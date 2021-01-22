'use strict';
/**
 * @typedef { import('./builder') } Builder
 */

const Raw = require('./raw');

class Op {
  /**
   * @param {Builder} builder 
   * @param {string|Raw} [prep]
   */
  constructor(builder, prep) {
    this._builder = builder;
    this._items = [];
    this._params = [];
    this.param(prep);
  }

  param(value) {
    if (value instanceof Raw) {
      this._items.push(value);
    } else if (value !== undefined) {
      this._items.push('?');
      this._params.push(value);
    }
    return this;
  }

  /**
   * 运算操作
   * @param {string} op
   * @param {string|number|((op: Op) => Op)} value
   */
  op(op, value) {
    this._items.push(this._builder.raw(op));
    if (value instanceof Op) {
      const r = value.build();
      this._items.push('(');
      this._items.push(r.sql);
      this._items.push(')');
      r.params.length && this._params.push(...r.params);
    } else {
      this.param(value);
    }
    return this;
  }

  build() {
    return {
      sql: this._items.join(' '),
      params: this._params,
    };
  }
}

module.exports = Op;
