'use strict';

const Raw = require('./raw');
const jsonWhere = require('./json_where');
const Where = require('./where');
const { AttrBuilder, Op } = require('./attr_builder');
const template = require('./template');

class Builder {
  /**
   * @param {string} [quote='`']
   */
  constructor(quote = '`') {
    this._quote = quote;
    this._sql = [];
    this._params = [];
    this._one = false;
    this._nestTables = false;
  }

  /**
   * clone this
   * @returns {Builder}
   */
  clone() {
    const b = new Builder();
    b._quote = this._quote;
    b._sql = Array.from(this._sql);
    b._params = Array.from(this._params);
    b._one = this._one;
    b._nestTables = this._nestTables;
    return b;
  }

  /**
   * @param {string} str
   * @returns {Raw}
   */
  raw(str) {
    return new Raw(str);
  }

  /**
   * @param {string|Raw} c
   * @returns {string}
   */
  quote(c) {
    if (c instanceof Raw) return c;
    if (c instanceof AttrBuilder) {
      const [sql, params] = c.build(this);
      params && this._params.push(...params);
      return this.raw(sql);
    }
    if (typeof c === 'string') {
      return this.raw(c.split('.').map(i => (!i || i === '*') ? '*' : this._quote + i + this._quote).join('.'));
    }
    throw new TypeError(`Quote type error: ${c}`);
  }

  /**
   * alias quote
   * @param {string|Raw} c
   * @returns {string}
   */
  q(c) {
    return this.quote(c);
  }

  /**
   * op('views', '+', 100) => views + ?; [100]
   * @param {string|Raw} prep
   * @param {string} [op]
   * @param {string|number|((op: Op) => Op)} [value]
   */
  op(prep, op, value) {
    const _op = new Op(this.quote(prep));
    if (op && value !== undefined) {
      _op.op(op, value);
    }
    return _op;
  }

  /**
   * param(1) => ?; [1]
   * @param {*} value
   * @returns {Builder}
   */
  param(value) {
    this._sql.push('?');
    this._params.push(value);
    return this;
  }

  /**
   * append sql
   * @param {string | Builder} sql
   * @param {*[]} [params]
   * @returns {Builder}
   */
  append(sql, params) {
    if (sql instanceof Builder) {
      [sql, params] = sql.build();
    }
    this._sql.push(sql);
    params && this._params.push(...params);
    return this;
  }

  /**
   * append ES2015 template SQL
   * SQL`SELECT * FROM {user} WHERE {age} > ${100}`
   *    => SELECT * FROM `user` WHERE `age` > ?; [100]
   * @param {*} strings 
   * @param  {...any} args 
   */
  SQL(strings, ...args) {
    const { sql, params } = template(this, strings, ...args);
    return this.append(sql, params);
  }

  /**
   * fields(['id', 'name', { age: 'user_age', id: 'user_id' }]) => id, name, age as user_age, id as user_id
   * fields([{ user: ['id', 'name'], profile: ['edu', 'work'] }]) => user.id, user.name, profile.edu, profile.work
   * fields([{ user: { id: 'userId', name: 'user.Name' } }]) => user.id AS userId, user.name as user.Name
   * fields([{ asName: Builder() }]) => builder AS asName
   * fields([{ asName: Raw() }]) => raw AS asName
   * @param {string[]|{ [key: string]: string }} fields
   * @returns {Builder}
   */
  fields(fields) {
    const _fields = [];
    fields.forEach(item => {
      if (item instanceof AttrBuilder) {
        const [sql, params] = item.build(this);
        sql && _fields.push(this.raw(sql));
        params && this._params.push(...params);
        return;
      }

      if (typeof item === 'object' && !(item instanceof Raw)) {
        Object.keys(item).forEach(k => {
          // { 'asName': [Builder] }
          if (item[k] instanceof Builder) {
            const [sql, params] = item[k].build();
            sql && _fields.push(this.as(this.raw(sql), k));
            params && this._params.push(...params);
            return;
          }
          // { 'asName': [Raw] }
          if (item[k] instanceof Raw) {
            _fields.push(this.as(item[k], k));
            return;
          }
          // { 'asName': [AttrBuilder] }
          if (item[k] instanceof AttrBuilder) {
            const [sql, params] = item[k].build(this);
            _fields.push(this.as(this.raw(sql), k));
            params && this._params.push(...params);
            return;
          }
          if (Array.isArray(item[k])) {
            // { user: ['id', 'name'], profile: ['edu', 'work'] }
            item[k].forEach(k2 => _fields.push(`${k}.${k2}`));
          } else if (typeof item[k] === 'object') {
            // { user: { id: 'userId', name: 'user.Name' } }
            Object.keys(item[k]).forEach(k2 => _fields.push(this.as(`${k}.${k2}`, item[k][k2])));
          } else {
            // { age: 'user_age', id: 'user_id' }
            _fields.push(this.as(k, item[k]));
          }
        });
      } else {
        _fields.push(item);
      }
    });
    this.append(_fields.map(i => this.quote(i)).join(', '));
    return this;
  }

  /**
   * select() => SELECT *
   * select('id', 'name', { age: 'user_age', id: 'user_id' }, ...) => SELECT id, name, age as user_age, id as user_id
   * select({ user: ['id', 'name'], profile: ['edu', 'work'] }) => SELECT user.id, user.name, profile.edu, profile.work
   * select({ user: { id: 'userId', name: 'user.Name' } }) => SELECT user.id AS userId, user.name as user.Name
   * select({ asName: Builder() }) => builder AS asName
   * select({ asName: Raw() }) => raw AS asName
   * @param {string[]|{ [key: string]: string }} fields
   * @returns {Builder}
   */
  select(...fields) {
    this.append('SELECT');
    this.fields(fields.length ? fields : ['*']);
    return this;
  }

  /**
   * update('user', { name: 'yf', age: 18, }) => UPDATE user SET name = ?, age = ?; ['yf', 18]
   * @param {string|string[]} table 
   * @param {*} columns
   */
  update(table, columns) {
    this.append('UPDATE');
    this.append(Array.isArray(table) ? table.map(i => this.quote(i)).join(', ') : this.quote(table));
    this.append('SET');
    this.append(Object.keys(columns).map(k => {
      let _sql = '?';
      let _params = [columns[k]];
      if (columns[k] instanceof Raw) {
        _sql = columns[k];
        _params = null;
      }
      else if (columns[k] instanceof AttrBuilder) {
        [_sql, _params] = columns[k].build(this);
      }
      _params && this._params.push(..._params);
      return `${this.quote(k)} = ${_sql}`;
    }).join(', '));
    return this;
  }

  /**
   * insert('user', { name: 'yf', age: 18, }) => INSERT INTO user (name, age) VALUES (?, ?); ['yf', 18]
   * @param {string} table
   * @param {*} columns
   */
  insert(table, columns) {
    this.append('INSERT INTO');
    this.append(this.quote(table));
    this.append('(');
    const _keys = Object.keys(columns);
    this.append(_keys.map(i => this.quote(i)).join(', '));
    this.append(') VALUES (');
    this.append(_keys.map(i => {
      if (columns[i] instanceof Raw) {
        return columns[i].toString();
      }
      if (columns[i] instanceof AttrBuilder) {
        const [_sql, _params] = columns[i].build(this);
        _params && this._params.push(..._params);
        return _sql;
      }
      this._params.push(columns[i]);
      return '?';
    }).join(', '));
    this.append(')');
    return this;
  }

  /**
   * delete('uset') => DELETE FROM user
   * @param {string|Raw} table
   */
  delete(table) {
    this.append('DELETE FROM');
    this.append(this.quote(table));
    return this;
  }

  /**
   * as(raw('MAX(id)'), 'MAX_ID')
   * @param {string|Raw} from
   * @param {string|Raw} to
   * @returns {Raw}
   */
  as(from, to) {
    return this.raw(`${this.quote(from)} AS ${this.quote(to)}`);
  }

  /**
   * from('t') => FROM t
   * from('t', 'b') => FROM t AS b
   * @param {string|Raw} name
   * @param {string|Raw} [alias]
   * @returns {Builder}
   */
  from(name, alias) {
    this.append('FROM');
    this.fields([alias ? this.as(name, alias) : name]);
    return this;
  }

  /**
   * where({ username: 'test' }) => WHERE username = ?; ['test']
   * where(w => w.eq('username', 'test')) => WHERE username = ?; ['test']
   * @param {object|(w: Where) => Where} query
   * @returns {[string, any[]]}
   * @private
   */
  _where(query) {
    let result;
    if (typeof query === 'function') {
      result = query(new Where(this)).build();
    } else if (query instanceof Where) {
      result = query.build();
    } else if (query) {
      result = jsonWhere(this, query);
    } else {
      result = [];
    }
    return result;
  }

  /**
   * join('user', { 'user.id': b.q('other.id') }) => INNER JOIN user ON (user.id = other.id)
   * join('user', 'u', { 'u.id': b.q('other.id') }) => INNER JOIN user AS u ON (u.id = other.id)
   * @param {string|Raw} table
   * @param {string|Raw|((w: Where) => Where)} alias
   * @param {(w: Where) => Where} [on]
   */
  join(table, alias, on, joinType = 'INNER') {
    if (on === undefined) {
      on = alias;
      alias = null;
    }
    this.append(`${joinType} JOIN`);
    this.fields([alias ? this.as(table, alias) : table]);
    const result = this._where(on);
    if (result[0]) {
      this.append(`ON (${result[0]})`);
      this._params.push(...result[1]);
    }
    return this;
  }

  leftJoin(table, alias, on) {
    return this.join(table, alias, on, 'LEFT');
  }

  rightJoin(table, alias, on) {
    return this.join(table, alias, on, 'RIGHT');
  }

  /**
   * where({ username: 'test' }) => WHERE username = ?; ['test']
   * where(w => w.eq('username', 'test')) => WHERE username = ?; ['test']
   * @param {object|(w: Where) => Where} query
   * @param {string} [prep]
   * @param {string} [after]
   * @returns {Builder}
   */
  where(query, prep = 'WHERE', after) {
    const result = this._where(query);
    if (!result[0]) return this;
    prep && this.append(prep);
    this.append(result[0]);
    this._params.push(...result[1]);
    after && this.append(after);
    return this;
  }

  /**
   * func('COUNT', '*') => COUNT(*)
   * func('COUNT', '*', 'c') => COUNT(*) AS c
   * @param {string} name
   * @param {string|Raw} exp
   * @param {string} [alias]
   * @returns {Raw}
   */
  func(name, exp, alias) {
    const f = this.raw(`${name}(${exp ? this.quote(exp) : ''})`);
    return alias ? this.as(f, alias) : f;
  }

  /**
   * count() => SELECT COUNT(*)
   * count('id') => SELECT COUNT(id)
   * count('id', 'user_count') => SELECT COUNT(id) AS user_count
   * @param {string|Raw} [column='*']
   * @param {string} [alias]
   */
  count(column = '*', alias) {
    return this.select(this.func('COUNT', column, alias));
  }

  /**
   * limit(100) => LIMIT 100
   * limit(100, 100) => LIMIT 100 OFFSET 100
   * @param {numer} count 
   * @param {numer} [offset]
   * @returns {Builder}
   */
  limit(count, offset) {
    this.append('LIMIT ?');
    this._params.push(count);
    if (offset !== undefined) {
      this.append('OFFSET ?');
      this._params.push(offset);
    }
    return this;
  }

  /**
   * limit 1
   * @param {number} [offset]
   */
  one(offset) {
    this.limit(1, offset);
    this._one = true;
    return this;
  }

  /**
   * @param {boolean} v 
   */
  setOne(v = true) {
    this._one = v;
    return this;
  }

  /**
   * @returns {boolean}
   */
  isOne() {
    return this._one;
  }

  /**
   * @param {boolean|string} v 
   */
  nestTables(v = true) {
    this._nestTables = v;
    return this;
  }

  getNestTables() {
    return this._nestTables;
  }

  /**
   * order('id') => ORDER BY id ASC
   * order('-id') => ORDER BY id DESC
   * order('-created_at', '-id') => ORDER BY created_at DESC, id DESC
   * @param {string[]} fields
   * @returns {Builder}
   */
  order(...fields) {
    this.append('ORDER BY');
    this.append(fields.map(f => {
      const desc = f[0] === '-';
      return this.quote(desc ? f.substring(1) : f) + (desc ? ' DESC' : ' ASC');
    }).join(', '));
    return this;
  }

  /**
   * group('id') => GROUP BY id
   * @param {string[]} fields
   * @returns {Builder}
   */
  group(...fields) {
    this.append('GROUP BY');
    this.append(fields.map(f => this.quote(f)).join(', '));
    return this;
  }

  /**
   * having({ count: { $gt: 10 } }) => HAVING count > 10
   * @param {(w: Where) => Where} fields
   * @returns {Builder}
   */
  having(query) {
    this.append('HAVING');
    if (query) {
      const result = this._where(query);
      if (result[0]) {
        this.append(result[0]);
        this._params.push(...result[1]);
      }
    }
    return this;
  }

  /**
   * @returns {[string, any[]]} sql and params
   */
  build() {
    return [this._sql.join(' '), this._params];
  }
}

module.exports = Builder;
