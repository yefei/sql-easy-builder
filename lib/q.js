'use strict';

/**
 * @typedef { import('./builder') } Builder
 * @typedef { import('./raw') } Raw
 */

class QBuilder {
  /**
   * @param {Builder} builder
   * @returns {{ sql: string, params: any[] }}
   */
  build(builder) {
    throw new Error('NotImplementedError');
  }

  _buildResult(sql, params = []) {
    return { sql, params };
  }
}

class Raw extends QBuilder {
  /**
   * @param {string} str
   */
  constructor(str) {
    super();
    this._str = str;
  }

  /**
   * @param {Builder} builder
   */
  build(builder) {
    return super._buildResult(this._str);
  }
}

class Fn extends QBuilder {
  /**
   * @param {string} fn 
   * @param {*} [args]
   */
  constructor(fn, args) {
    super();
    this._fn = fn;
    this._args = args;
  }

  /**
   * @param {Builder} builder
   * @returns {string}
   */
  build(builder) {
    return super._buildResult(`${this._fn}(${this._args ? builder.quote(this._args) : ''})`);
  }
}

class Op extends QBuilder {
  /**
   * @param {string|Raw} [prep]
   */
  constructor(prep) {
    super();
    this._items = [];
    this._params = [];
    this.param(prep);
  }

  param(value) {
    if (value instanceof QBuilder) {
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
    this._items.push(op);
    if (value instanceof Op) {
      this._items.push('(');
      this._items.push(value);
      this._items.push(')');
      value._params.length && this._params.push(...value._params);
    } else {
      this.param(value);
    }
    return this;
  }

  /**
   * @param {import('./builder')} builder 
   * @returns 
   */
  build(builder) {
    return super._buildResult(
      this._items.map(i => i instanceof QBuilder ? i.build(builder).sql : i).join(' '),
      this._params,
    );
  }
}

class Quote extends QBuilder {
  /**
   * @param {string} col
   */
  constructor(col) {
    super();
    this._col = col;
  }

  /**
   * @param {Builder} builder
   * @returns {string}
   */
  build(builder) {
    const c = this._col;
    if (c === '*') return c;
    if (c instanceof QBuilder) return c.build(builder);
    if (typeof c === 'string') {
      return builder.raw(c.split('.').map(i => (!i || i === '*') ? '*' : builder._quote + i + builder._quote).join('.'));
    }
    throw new TypeError(`Quote type error: ${typeof c}`);
  }
}

module.exports = {
  QBuilder,
  Raw,
  Fn,
  Op,
  Quote,
};
