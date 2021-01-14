'use strict';

const sqlWhereBuilder = require('sql-where-builder');

class Raw {
  constructor(str) {
    this._str = str;
  }

  toString() {
    return this._str;
  }
}

class Builder {
  constructor(quote = '`') {
    this._quote = quote;
    this._select = [];
    this._from = null;
    this._where = [];
    this._params = [];
  }

  raw(str) {
    return new Raw(str);
  }

  quote(c) {
    if (c === '*') return c;
    if (c instanceof Raw) return c.toString();
    return this._quote + c + this._quote;
  }

  /**
   * select('id', 'name', { age: 'user_age', id: 'user_id' }, ...)
   * @param {...string|object} args
   * @returns {Builder}
   */
  select(...args) {
    if (args.length) {
      args.forEach(i => {
        if (typeof i === 'object' && !(i instanceof Raw)) {
          Object.keys(i).forEach(k => {
            this._select.push(this.as(k, i[k]));
          });
        } else {
          this._select.push(i);
        }
      });
    } else {
      this.select('*');
    }
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
   * @param {string|Raw} name
   * @returns {Builder}
   */
  from(name) {
    this._from = name;
    return this;
  }

  /**
   * where({
   *  username: 'test'
   * })
   * @param {object} query
   * @returns {Builder}
   */
  where(query) {
    const r = sqlWhereBuilder(query);
    this._where.push(r.statement);
    this._params.push(...r.parameters);
    return this;
  }

  /**
   * count()
   * count('id')
   * count('id', 'user_count')
   * @param {string|Raw} [column='*']
   * @param {string} [alias]
   */
  count(column = '*', alias) {
    const count = this.raw(`COUNT(${this.quote(column)})`);
    return this.select(alias ? this.as(count, alias) : count);
  }

  build() {
    const sql = [];
    let params;
    if (this._select.length) {
      sql.push('SELECT');
      sql.push(this._select.map(i => this.quote(i)).join(', '));
    }
    if (this._from) {
      sql.push('FROM');
      sql.push(this.quote(this._from));
    }
    if (this._where.length) {
      sql.push('WHERE');
      sql.push(this._where.join(' AND '));
      params = this._params;
    }
    return [sql.join(' '), params];
  }
}

// console.log(new Builder().select('reg_at', {id: 'USER_ID', name: 'USER_NAME'}).from('user').where({aaa:1, bbb:2}).build());
// console.log(new Builder().count('id').from('user').where({aaa:1, bbb:2}).build());

module.exports = Builder;
