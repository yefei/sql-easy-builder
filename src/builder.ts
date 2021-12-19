import { Where } from '.';
import { AttrBuilder, Op } from './attr_builder';
import { jsonWhere } from './json_where';
import { Raw } from './raw';
import { template } from './template';
import { BuildResult, FieldsType, FieldType, ResultRow, ValueType, WhereType } from './types';

function defaultQuote(str: string) {
  return '`' + String(str).replace(/`/g, '``') + '`';
}

export class Builder {
  private _quote: (str: string) => string;
  private _sql: string[] = [];
  private _params: ValueType[] = [];
  private _one: boolean = false;
  private _nestTables: boolean = false;

  constructor(quote: (str: string) => string) {
    this._quote = quote || defaultQuote;
  }

  /**
   * clone this
   */
  clone() {
    const b = new Builder(this._quote);
    b._quote = this._quote;
    b._sql = Array.from(this._sql);
    b._params = Array.from(this._params);
    b._one = this._one;
    b._nestTables = this._nestTables;
    return b;
  }

  raw(str: string) {
    return new Raw(str);
  }

  quote(c: FieldType): Raw {
    if (c instanceof Raw) return c;
    if (c instanceof AttrBuilder) {
      const [sql, params] = c.build(this);
      params && this._params.push(...params);
      return this.raw(sql);
    }
    if (typeof c === 'string') {
      return this.raw(c.split('.').map(i => (!i || i === '*') ? '*' : this._quote(i)).join('.'));
    }
    throw new TypeError(`Quote type error: ${c}`);
  }

  q(c: FieldType) {
    return this.quote(c);
  }

  /**
   * op('views', '+', 100) => views + ?; [100]
   */
  op(prep: FieldType, op: string, value: string | number | Op) {
    const _op = new Op(this.quote(prep));
    if (op && value !== undefined) {
      _op.op(op, value);
    }
    return _op;
  }

  /**
   * param(1) => ?; [1]
   */
  param(value: ValueType) {
    this._sql.push('?');
    this._params.push(value);
    return this;
  }

  /**
   * append sql
   */
  append(sql: string | Builder, params?: ValueType[]) {
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
   */
  SQL(strings: string[], ...args: ValueType[]) {
    const { sql, params } = template(this, strings, ...args);
    return this.append(sql, params);
  }

  /**
   * fields(['id', 'name', { age: 'user_age', id: 'user_id' }]) => id, name, age as user_age, id as user_id
   * fields([{ user: ['id', 'name'], profile: ['edu', 'work'] }]) => user.id, user.name, profile.edu, profile.work
   * fields([{ user: { id: 'userId', name: 'user.Name' } }]) => user.id AS userId, user.name as user.Name
   * fields([{ asName: Builder() }]) => builder AS asName
   * fields([{ asName: Raw() }]) => raw AS asName
   */
  fields(fields: FieldsType) {
    const _fields: FieldType[] = [];
    fields.forEach(item => {
      if (item instanceof AttrBuilder) {
        const [sql, params] = item.build(this);
        sql && _fields.push(this.raw(sql));
        params && this._params.push(...params);
        return;
      }

      if (typeof item === 'object' && !(item instanceof Raw)) {
        Object.keys(item).forEach(k => {
          const _value = item[k];
          // { 'asName': [Builder] }
          if (_value instanceof Builder) {
            const [sql, params] = _value.build();
            sql && _fields.push(this.as(this.raw(sql), k));
            params && this._params.push(...params);
            return;
          }
          // { 'asName': [Raw] }
          if (_value instanceof Raw) {
            _fields.push(this.as(_value, k));
            return;
          }
          // { 'asName': [AttrBuilder] }
          if (_value instanceof AttrBuilder) {
            const [sql, params] = _value.build(this);
            _fields.push(this.as(this.raw(sql), k));
            params && this._params.push(...params);
            return;
          }
          if (Array.isArray(_value)) {
            // { user: ['id', 'name'], profile: ['edu', 'work'] }
            _value.forEach(k2 => _fields.push(`${k}.${k2}`));
          } else if (typeof _value === 'object') {
            // { user: { id: 'userId', name: 'user.Name' } }
            Object.keys(_value).forEach(k2 => _fields.push(this.as(`${k}.${k2}`, _value[k2])));
          } else {
            // { age: 'user_age', id: 'user_id' }
            _fields.push(this.as(k, _value));
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
   */
  select(...fields: FieldsType) {
    this.append('SELECT');
    this.fields(fields.length ? fields : ['*']);
    return this;
  }

  /**
   * update('user', { name: 'yf', age: 18, }) => UPDATE user SET name = ?, age = ?; ['yf', 18]
   */
  update(table: FieldType | FieldType[], columns: ResultRow) {
    this.append('UPDATE');
    this.append(Array.isArray(table) ? table.map(i => this.quote(i).toString()).join(', ') : this.quote(table).toString());
    this.append('SET');
    this.append(Object.keys(columns).map(k => {
      const column = columns[k];
      let _sql: string = '?';
      let _params: ValueType[] = [column];
      if (column instanceof Raw) {
        _sql = column.toString();
        _params = null;
      }
      else if (column instanceof AttrBuilder) {
        [_sql, _params] = column.build(this);
      }
      _params && this._params.push(..._params);
      return `${this.quote(k)} = ${_sql}`;
    }).join(', '));
    return this;
  }

  /**
   * insert('user', { name: 'yf', age: 18, }) => INSERT INTO user (name, age) VALUES (?, ?); ['yf', 18]
   */
  insert(table: FieldType, columns: ResultRow) {
    this.append('INSERT INTO');
    this.append(this.quote(table).toString());
    this.append('(');
    const _keys = Object.keys(columns);
    this.append(_keys.map(i => this.quote(i)).join(', '));
    this.append(') VALUES (');
    this.append(_keys.map(i => {
      const column = columns[i];
      if (column instanceof Raw) {
        return column.toString();
      }
      if (column instanceof AttrBuilder) {
        const [_sql, _params] = column.build(this);
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
   */
  delete(table: FieldType) {
    this.append('DELETE FROM');
    this.append(this.quote(table).toString());
    return this;
  }

  /**
   * as(raw('MAX(id)'), 'MAX_ID')
   */
  as(from: FieldType, to: FieldType): Raw {
    return this.raw(`${this.quote(from)} AS ${this.quote(to)}`);
  }

  /**
   * from('t') => FROM t
   * from('t', 'b') => FROM t AS b
   */
  from(name: FieldType, alias?: FieldType) {
    this.append('FROM');
    this.fields([alias ? this.as(name, alias) : name]);
    return this;
  }

  /**
   * where({ username: 'test' }) => WHERE username = ?; ['test']
   * where(w => w.eq('username', 'test')) => WHERE username = ?; ['test']
   */
  private _where(query: WhereType) {
    let result: BuildResult;
    if (typeof query === 'function') {
      result = query(new Where(this)).build();
    } else if (query instanceof Where) {
      result = query.build();
    } else if (typeof query === 'object') {
      result = jsonWhere(this, query);
    }
    return result;
  }

  /**
   * join('user', null, { 'user.id': b.q('other.id') }) => INNER JOIN user ON (user.id = other.id)
   * join('user', 'u', { 'u.id': b.q('other.id') }) => INNER JOIN user AS u ON (u.id = other.id)
   */
  join(table: FieldType, alias?: FieldType, on?: WhereType, joinType = 'INNER') {
    this.append(`${joinType} JOIN`);
    this.fields([alias ? this.as(table, alias) : table]);
    const result = this._where(on);
    if (result && result[0]) {
      this.append(`ON (${result[0]})`);
      this._params.push(...result[1]);
    }
    return this;
  }

  leftJoin(table: FieldType, alias?: FieldType, on?: WhereType) {
    return this.join(table, alias, on, 'LEFT');
  }

  rightJoin(table: FieldType, alias?: FieldType, on?: WhereType) {
    return this.join(table, alias, on, 'RIGHT');
  }

  /**
   * where({ username: 'test' }) => WHERE username = ?; ['test']
   * where(w => w.eq('username', 'test')) => WHERE username = ?; ['test']
   */
  where(query: WhereType, prep = 'WHERE', after?: string) {
    const result = this._where(query);
    if (!result || !result[0]) return this;
    prep && this.append(prep);
    this.append(result[0]);
    this._params.push(...result[1]);
    after && this.append(after);
    return this;
  }

  /**
   * func('COUNT', '*') => COUNT(*)
   * func('COUNT', '*', 'c') => COUNT(*) AS c
   */
  func(name: string, exp: FieldType, alias: string): Raw {
    const f = this.raw(`${name}(${exp ? this.quote(exp) : ''})`);
    return alias ? this.as(f, alias) : f;
  }

  /**
   * count() => SELECT COUNT(*)
   * count('id') => SELECT COUNT(id)
   * count('id', 'user_count') => SELECT COUNT(id) AS user_count
   */
  count(column = '*', alias?: string) {
    return this.select(this.func('COUNT', column, alias));
  }

  /**
   * limit(100) => LIMIT 100
   * limit(100, 100) => LIMIT 100 OFFSET 100
   */
  limit(count: number, offset?: number) {
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
   */
  one(offset?: number) {
    this.limit(1, offset);
    this._one = true;
    return this;
  }

  setOne(is = true) {
    this._one = is;
    return this;
  }

  isOne() {
    return this._one;
  }

  nestTables(is = true) {
    this._nestTables = is;
    return this;
  }

  getNestTables() {
    return this._nestTables;
  }

  /**
   * order('id') => ORDER BY id ASC
   * order('-id') => ORDER BY id DESC
   * order('-created_at', '-id') => ORDER BY created_at DESC, id DESC
   */
  order(...fields: string[]) {
    this.append('ORDER BY');
    this.append(fields.map(f => {
      const desc = f[0] === '-';
      return this.quote(desc ? f.substring(1) : f) + (desc ? ' DESC' : ' ASC');
    }).join(', '));
    return this;
  }

  /**
   * group('id') => GROUP BY id
   */
  group(...fields: FieldType[]) {
    this.append('GROUP BY');
    this.append(fields.map(f => this.quote(f)).join(', '));
    return this;
  }

  /**
   * having({ count: { $gt: 10 } }) => HAVING count > 10
   */
  having(query: WhereType) {
    this.append('HAVING');
    if (query) {
      const result = this._where(query);
      if (result && result[0]) {
        this.append(result[0]);
        this._params.push(...result[1]);
      }
    }
    return this;
  }

  /**
   * @returns sql and params
   */
  build(): BuildResult {
    return [this._sql.join(' '), this._params];
  }
}
