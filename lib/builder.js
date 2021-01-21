'use strict';

const Raw = require('./raw');
const jsonWhere = require('./json_where');
const Where = require('./where');

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
    if (!c) return '';
    if (c === '*') return c;
    if (c instanceof Raw) return c.toString();
    return this.raw(this._quote + (c.split('.').join('`.`')) + this._quote);
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
   * append sql
   * @param {string} sql
   * @returns {Builder}
   */
  append(sql) {
    this._sql.push(sql);
    return this;
  }

  /**
   * fields('id', 'name', { age: 'user_age', id: 'user_id' }, ...) => id, name, age as user_age, id as user_id
   * @param {string[]|{ [key: string]: string }} fields
   * @returns {Builder}
   */
  fields(fields) {
    const _fields = [];
    fields.forEach(i => {
      if (typeof i === 'object' && !(i instanceof Raw)) {
        Object.keys(i).forEach(k => {
          _fields.push(this.as(k, i[k]));
        });
      } else {
        _fields.push(i);
      }
    });
    this.append(_fields.map(i => this.quote(i)).join(', '));
    return this;
  }

  /**
   * select() => SELECT *
   * select('id', 'name', { age: 'user_age', id: 'user_id' }, ...) => SELECT id, name, age as user_age, id as user_id
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
      this._params.push(columns[k]);
      return `${this.quote(k)} = ?`;
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
   * @returns {Builder}
   * @private
   */
  _where(query) {
    let result;
    if (typeof query === 'function') {
      result = query(new Where(this)).build();
    } else if (query instanceof Where) {
      result = query.build();
    } else {
      result = jsonWhere(this, query);
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
    this.append(`ON (${result[0]})`);
    this._params.push(...result[1]);
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
   * @returns {Builder}
   */
  where(query) {
    this.append('WHERE');
    const result = this._where(query);
    this.append(result[0]);
    this._params.push(...result[1]);
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
    const f = this.raw(`${name}(${this.quote(exp)})`);
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

  setOne() {
    this._one = true;
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
  nestTables(v) {
    this._nestTables = v;
    return this;
  }

  getNestTables(v) {
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
   * @returns {[string, any[]]} sql and params
   */
  build() {
    return [this._sql.join(' '), this._params];
  }
}

module.exports = Builder;
