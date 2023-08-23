import { Builder } from './builder';
import { Raw } from './raw';
import { template } from './template';
import { BuildResult, FieldType, SQLTemplateArg } from './types';

export abstract class AttrBuilder {
  /**
   * 构建 SQL 结果
   */
  abstract build(builder: Builder): BuildResult;
}

export class Fn extends AttrBuilder {
  constructor(
    private fn: string,
    private args?: any,
  ) {
    super();
  }

  build(builder: Builder) {
    return {
      sql: `${this.fn}(${this.args ? builder.quote(this.args) : ''})`,
    };
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

  build(builder: Builder): BuildResult {
    return {
      sql: this._items.map(i => i instanceof AttrBuilder ? i.build(builder).sql : i).join(' '),
      params: this._params.length ? this._params : undefined,
    };
  }
}

export class Quote extends AttrBuilder {
  constructor(private col: FieldType) {
    super();
  }

  override build(builder: Builder): BuildResult {
    return {
      sql: builder.quote(this.col).toString(),
    };
  }
}

export class Point extends AttrBuilder {
  constructor(private x: number, private y: number) {
    super();
  }

  build(builder: Builder): BuildResult {
    return {
      sql: `ST_GeomFromText('POINT(? ?)')`,
      params: [this.x, this.y],
    }
  }
}

class Template extends AttrBuilder {
  constructor(
    private strings: TemplateStringsArray,
    private args: SQLTemplateArg[],
  ) {
    super();
  }

  override build(builder: Builder): BuildResult {
    return template(builder, this.strings, ...this.args);
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
  SQL(strings: TemplateStringsArray, ...args: SQLTemplateArg[]) {
    return new Template(strings, args);
  },
  op(prep: any) {
    return new Op(prep);
  },
  count(col = '*') {
    return new Fn('COUNT', col);
  },
  distinctCount(col: string) {
    return AB.SQL`COUNT(DISTINCT ${AB.quote(col)})`;
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
  incr(col: string, val?: number) {
    if (typeof val === 'undefined') val = 1;
    return AB.op(AB.quote(col)).op('+', val);
  },
  // `col` - 1
  decr(col: string, val?: number) {
    if (typeof val === 'undefined') val = 1;
    return AB.op(AB.quote(col)).op('-', val);
  },
  point(x: number, y: number) {
    return new Point(x, y);
  },
};
