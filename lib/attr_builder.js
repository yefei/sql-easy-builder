/**
 * @typedef { import('./builder') } Builder
 */
'use strict';

const Raw = require('./raw');
const template = require('./template');

class AttrBuilder {
  /**
   * @param {Builder} builder
   * @returns {[string, any[]]}
   */
  build(builder) {
    throw new Error('NotImplementedError');
  }
}

class Fn extends AttrBuilder {
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
   */
  build(builder) {
    return [`${this._fn}(${this._args ? builder.quote(this._args) : ''})`];
  }
}

class Op extends AttrBuilder {
  /**
   * @param {QBuilder|any} [prep]
   */
  constructor(prep) {
    super();
    this._items = [];
    this._params = [];
    this.param(prep);
  }

  param(value) {
    if (value instanceof Raw) {
      this._items.push(value.toString());
    } else if (value instanceof AttrBuilder) {
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
    return [
      this._items.map(i => i instanceof AttrBuilder ? i.build(builder)[0] : i).join(' '),
      this._params.length ? this._params : undefined,
    ];
  }
}

class Quote extends AttrBuilder {
  constructor(col) {
    super();
    this._col = col;
  }

  /**
   * @param {import('./builder')} builder 
   * @returns 
   */
  build(builder) {
    return [builder.quote(this._col)];
  }
}

class Template extends AttrBuilder {
  constructor(strings, args) {
    super();
    this.strings = strings;
    this.args = args;
  }

  /**
   * @param {import('./builder')} builder 
   * @returns 
   */
  build(builder) {
    const { sql, params } = template(builder, this.strings, ...this.args);
    return [sql, params];
  }
}

/**
 * 常用字段查询工具
 */
const AB = {
  raw(str) {
    return new Raw(str);
  },
  quote(col) {
    return new Quote(col);
  },
  SQL(strings, ...args) {
    return new Template(strings, args);
  },
  op(prep) {
    return new Op(prep);
  },
  count(col = '*') {
    return new Fn('COUNT', col);
  },
  avg(col) {
    return new Fn('AVG', col);
  },
  sum(col) {
    return new Fn('SUM', col);
  },
  min(col) {
    return new Fn('MIN', col);
  },
  max(col) {
    return new Fn('MAX', col);
  },
  // `col` + 1
  incr(col, val) {
    return AB.op(AB.quote(col)).op('+', val || 1);
  },
  // `col` - 1
  decr(col, val) {
    return AB.op(AB.quote(col)).op('-', val || 1);
  },
};

module.exports = {
  AttrBuilder,
  Fn,
  Op,
  Quote,
  AB,
};
