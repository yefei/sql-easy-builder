'use strict';

const sqlWhereBuilder = require('sql-where-builder');

class Raw {
  /**
   * @param {string} str
   */
  constructor(str) {
    this._str = str;
  }

  /**
   * @returns {string}
   */
  toString() {
    return this._str;
  }
}

class Builder {
  /**
   * @param {string} [quote='`']
   */
  constructor(quote = '`') {
    this._quote = quote;
    this._select = [];
    this._update = [];
    this._from = null;
    this._where = [];
    this._params = [];
    this._limit = null;
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
   * update('user', {
   *  username: 'xiaohong',
   *  age: 18,
   * })
   * @param {*} table 
   * @param {*} columns 
   */
  update(table, columns) {
    this._update.push([table, columns]);
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
    this._where.push(query);
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

  /**
   * limit(100)
   * limit(100, 100)
   * @param {numer} count 
   * @param {numer} [offset]
   * @returns {Builder}
   */
  limit(count, offset) {
    this._limit = [count, offset];
    return this;
  }

  /**
   * @returns {[string, any[]]} sql and params
   */
  build() {
    const sql = [];
    const params = [];
    if (this._select.length) {
      sql.push('SELECT');
      sql.push(this._select.map(i => this.quote(i)).join(', '));
    }
    else if (this._update.length) {
      sql.push('UPDATE');
      sql.push(this._update.map(i => this.quote(i[0])).join(', '));
      sql.push('SET');
      sql.push(this._update.map(i => {
        return Object.keys(i[1]).map(k => {
          params.push(i[1][k]);
          return `${this.quote(k)} = ?`;
        }).join(', ');
      }).join(', '));
    }
    if (this._from) {
      sql.push('FROM');
      sql.push(this.quote(this._from));
    }
    if (this._where.length) {
      sql.push('WHERE');
      const _where = [];
      this._where.forEach(w => {
        const r = sqlWhereBuilder(w);
        _where.push(r.statement);
        params.push(...r.parameters);
      });
      sql.push(_where.join(' AND '));
    }
    if (this._limit) {
      sql.push('LIMIT ?');
      params.push(this._limit[0]);
      if (this._limit[1]) {
        sql.push('OFFSET ?');
        params.push(this._limit[1]);
      }
    }
    return [sql.join(' '), params];
  }
}

module.exports = Builder;
