'use strict';

const Raw = require('./raw');
const flatOps = require('./ops').flat;

class Where {
  /**
   * @param {import('./builder')} builder
   */
  constructor(builder, conjunction = 'AND') {
    /** @private */
    this._builder = builder;
    /** @private */
    this._conjunction = conjunction;
    /** @private */
    this._sql = [];
    /** @private */
    this._params = [];
  }

  clone() {
    const where = new Where(this._builder, this._conjunction);
    where._sql = where._sql.slice();
    where._params = where._params.slice();
    return where;
  }

  conjunction(c) {
    this._conjunction = c;
    return this;
  }

  holder(value) {
    if (value instanceof Raw) return value.toString();
    this._params.push(value);
    return '?';
  }

  op(field, op, value) {
    this._sql.push(`${this._builder.quote(field)} ${op} ${value}`);
    return this;
  }

  /**
   * @param {(where: Where) => Where} callback
   * @returns {Where}
   */
  or(callback) {
    const result = callback(new Where(this._builder, 'OR')).build();
    this._sql.push(`( ${result[0]} )`);
    this._params.push(...result[1]);
    return this;
  }

  /**
   * @private
   */
  _valuesOp(field, op, values) {
    return this.op(field, op, `(${values.map(i => this.holder(i)).join(', ')})`);
  }

  /**
   * @param {string|Raw} field
   * @param {*[]} values
   */
  in(field, values) {
    return this._valuesOp(field, 'IN', values);
  }

  /**
   * @param {string|Raw} field
   * @param {*[]} values
   */
  notin(field, values) {
    return this._valuesOp(field, 'NOT IN', values);
  }

  /**
   * @param {string|Raw} field
   * @param {*} start
   * @param {*} end
   */
  between(field, start, end) {
    return this.op(field, 'BETWEEN', `${this.holder(start)} AND ${this.holder(end)}`);
  }

  /**
   * @param {string|Raw} field
   * @param {*} start
   * @param {*} end
   */
  notbetween(field, start, end) {
    return this.op(field, 'NOT BETWEEN', `${this.holder(start)} AND ${this.holder(end)}`);
  }

  build() {
    return [this._sql.join(` ${this._conjunction} `), this._params];
  }
}

Object.keys(flatOps).forEach(op => {
  Where.prototype[op] = function(field, value) {
    return this.op(field, flatOps[op], this.holder(value));
  };
});

/*
const Builder = require('./builder');
console.log(new Where(new Builder())
  .eq('name', 'aaa')
  .eq('cccc', 123)
  .ne('ne', 1)
  .gt('rrr', 1111)
  .in('in', [1,2,3,4])
  .notin('notin', [1,2,3,4])
  .between('between', 1, 2)
  .or(w => w.eq('aaa', 111).eq('nnn', 222))
  .build());
*/

module.exports = Where;
