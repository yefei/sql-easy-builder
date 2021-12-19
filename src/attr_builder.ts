import { Builder } from './builder';
import { Raw } from './raw';
import { template } from './template';
import { BuildResult, FieldType } from './types';

export class AttrBuilder {
  build(builder: Builder): BuildResult {
    throw new Error('NotImplementedError');
  }
}

export class Fn extends AttrBuilder {
  _fn: string;
  _args: any;

  constructor(fn: string, args?: any) {
    super();
    this._fn = fn;
    this._args = args;
  }

  override build(builder: Builder): BuildResult {
    return [`${this._fn}(${this._args ? builder.quote(this._args) : ''})`];
  }
}

export class Op extends AttrBuilder {
  _items: (string | AttrBuilder | Op)[] = [];
  _params: any[] = [];

  constructor(prep: string | number | Raw | AttrBuilder) {
    super();
    this.param(prep);
  }

  param(value: string | number | Raw | AttrBuilder) {
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
   */
  op(op: string, value: string | number | Op) {
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

  override build(builder: Builder): BuildResult {
    return [
      this._items.map(i => i instanceof AttrBuilder ? i.build(builder)[0] : i).join(' '),
      this._params.length ? this._params : undefined,
    ];
  }
}

export class Quote extends AttrBuilder {
  private _col: FieldType;

  constructor(col: FieldType) {
    super();
    this._col = col;
  }

  override build(builder: Builder): BuildResult {
    return [builder.quote(this._col).toString()];
  }
}

class Template extends AttrBuilder {
  private _strings: string[];
  private _args: any[];

  constructor(strings: string[], args: any[]) {
    super();
    this._strings = strings;
    this._args = args;
  }

  override build(builder: Builder): BuildResult {
    const { sql, params } = template(builder, this._strings, ...this._args);
    return [sql, params];
  }
}

/**
 * 常用字段查询工具
 */
export const AB = {
  raw(str: string) {
    return new Raw(str);
  },
  quote(col: string) {
    return new Quote(col);
  },
  SQL(strings: string[], ...args: any[]) {
    return new Template(strings, args);
  },
  op(prep: any) {
    return new Op(prep);
  },
  count(col = '*') {
    return new Fn('COUNT', col);
  },
  avg(col: string) {
    return new Fn('AVG', col);
  },
  sum(col: string) {
    return new Fn('SUM', col);
  },
  min(col: string) {
    return new Fn('MIN', col);
  },
  max(col: string) {
    return new Fn('MAX', col);
  },
  // `col` + 1
  incr(col: string, val: number) {
    return AB.op(AB.quote(col)).op('+', val || 1);
  },
  // `col` - 1
  decr(col: string, val: number) {
    return AB.op(AB.quote(col)).op('-', val || 1);
  },
};
