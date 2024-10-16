import { Builder } from './builder.js';
import { isPlainObject } from './utils.js';
import { all as operatorMap } from './where_ops.js';
import { BuildResult, JsonWhere, ValueType } from './types.js';
import { Raw } from './raw.js';
import { AttrBuilder } from './attr_builder.js';

/**
 * 不使用标示
 * - 可以在 JSON 查询中赋值为 UNSET 删除查询条件
 * - 注意，为了让 TS 检查完美，没有使用 Symbol，index 中导出的 UNSET 为对象实例
 */
export class UNSET {};

export class JsonWhereBuilder {
  private sql: string[] = [];
  private params: ValueType[] = [];
  private lastOp: string | null = null;

  constructor(
    private builder: Builder,
    private where: JsonWhere,
  ) {}

  private _holder(v: ValueType) {
    if (v instanceof Raw) {
      return v.toString();
    }
    if (v instanceof AttrBuilder) {
      const b = v.build(this.builder);
      if (b.params) {
        this.params.push(...b.params);
      }
      return b.sql;
    }
    this.params.push(v);
    return '?';
  }

  /**
   * f2: { $gt: 1, $lt: 2 }
   * $or: { f8: 'f8', f9: 'f9' }
   * $or: [
   *   { f8: 'f8' },
   *   { f9: 'f9', f10: 'f10', $or: { f12: 'f12', f13: 'f13' } },
   * ]
   */
  private _fieldObject(key: string, value: any) {
    if (key === '$or' || key === '$and') {
      const _con = key.substring(1).toUpperCase();

      if (value instanceof Raw) {
        this.sql.push(value.toString());
        return;
      }

      if (value instanceof AttrBuilder) {
        const b = value.build(this.builder);
        this.sql.push(b.sql);
        if (b.params) {
          this.params.push(...b.params);
        }
        return;
      }

      // $or: [
      //   { f8: 'f8' },
      //   { f9: 'f9', f10: 'f10', $or: { f12: 'f12', f13: 'f13' } },
      // ]
      if (Array.isArray(value) && value.length > 0) {
        const _sql: string[] = [];
        const _params: ValueType[] = [];
        for (const item of value) {
          const b = new JsonWhereBuilder(this.builder, item).build();
          if (!b.sql) {
            break;
          }
          _sql.push(`(${b.sql})`);
          if (b.params) {
            _params.push(...b.params);
          }
        }
        this.sql.push(_sql.length === 1 ? _sql[0] : `(${_sql.join(` ${_con} `)})`);
        this.params.push(..._params);
        return;
      }

      // $or: { f8: 'f8', f9: 'f9' }
      if (isPlainObject(value)) {
        const b = new JsonWhereBuilder(this.builder, value)._build(_con);
        this.sql.push(`(${b.sql})`);
        if (b.params) {
          this.params.push(...b.params);
        }
        return;
      }

      return;
    }

    for (const op of Object.keys(value)) {
      this._appendOp(key, op, value[op]);
    }
  }

  private _appendOp(key: string, op: string | null, value: any) {
    // throw undefined
    if (value === undefined) throw new Error(`${key} value is undefined`);

    // ignore UNSET
    if (value instanceof UNSET) return;

    if (key === '$or' || key === '$and') {
      return this._fieldObject(key, value);
    }

    // $op | key.key
    if (op) {
      if(op[0] === '$') {
        op = op.substring(1).toLowerCase();
      } else {
        key = `${key}.${op}`;
        op = null;
      }
    }

    if (op === 'or' || op === 'and') {
      // f15: { $or: { $eq: 'f15-1', $gt: 'f15-2' } }
      if (isPlainObject(value)) {
        // remap to: [ { f15: { $eq: 'f15-1' } }, { f15: { $gt: 'f15-2' } } ]
        value = Object.entries(value).map(([op, value]) => ({ [op]: value }));
      }
      // f15: { $or: [ { f27: 'f27', f28: 'f28' }, { f29: 'f29', f30: 'f30' } ] }
      if (Array.isArray(value)) {
        this._fieldObject('$' + op, value.map(item => ({ [key]: item })));
      }
      return;
    }
    else if (op === 'quote') {
      op = this.lastOp || null;
      value = this.builder.quote(value);
    }
    else if (op === 'raw') {
      op = this.lastOp || null;
      value = this.builder.raw(value);
    }
    else if (op === 'match') {
      let modifier = '';
      if (typeof value === 'object') {
        if (value.modifier) {
          modifier = ' ' + value.modifier;
        }
        value = value.expr;
      }
      this.sql.push(`MATCH(${this.builder.quote(key)}) AGAINST(${this._holder(value)}${modifier})`);
      return;
    }

    // f3: [1, 2, 3]
    // f7: { $between: ['f7-1', 'f7-2'] }
    if (Array.isArray(value) && key !== '$or' && key !== '$and') {
      if (value.length === 0) {
        throw new TypeError(`parameter '${key}' cannot be empty`);
      }

      // between
      if (op === 'between' || op === 'notbetween') {
        if (value[0] !== undefined && value[1] !== undefined) {
          value = `${this._holder(value[0])} AND ${this._holder(value[1])}`;
        } else if (value[0] !== undefined) {
          op = op === 'notbetween' ? 'lte' : 'gte';
          value = this._holder(value[0]);
        } else if (value[1] !== undefined) {
          op = op === 'notbetween' ? 'gte' : 'lte';
          value = this._holder(value[1]);
        } else {
          throw new TypeError('between or notbetween at least one value is required');
        }
      }

      // [1]
      // else if (value.length === 1 && op === null) value = holder(value[0]);

      // [1, 2, ...]
      else {
        value = `(${value.map(i => this._holder(i)).join(', ')})`;
        if (op === null) {
          op = 'in';
        }
      }
    }

    // f11: null
    else if (value === null) {
      if (op === null || op === 'eq') {
        op = 'is';
      }
      else if (op === 'ne') {
        op = 'isnot';
      }
      value = 'NULL';
    }

    // f2: { $gt: 1, $lt: 2, $in: [1, 2] }
    // $or: { f8: 'f8', f9: 'f9' }
    // $or: []
    else if (Array.isArray(value) || isPlainObject(value)) {
      // lastOp:   👇
      //   f32: { $gt: { $quote: 'f32' } },
      //   f33: { $gt: { $raw: 'f33' } },
      this.lastOp = op;
      return this._fieldObject(key, value);
    }

    // f2: 1
    else {
      value = this._holder(value);
    }

    if (op === null) {
      op = 'eq';
    }

    if (!(op in operatorMap)) {
      throw new TypeError(`Unknown operator: ${op}`);
    }

    this.sql.push(`${this.builder.quote(key)} ${operatorMap[op]} ${value}`);
  }

  private _build(conjunction = 'AND'): BuildResult {
    if (this.where instanceof Raw) {
      this.sql.push(this.where.toString());
    }
    else if (this.where instanceof AttrBuilder) {
      const b = this.where.build(this.builder);
      this.sql.push(b.sql);
      if (b.params) {
        this.params.push(...b.params);
      }
    }
    else if (isPlainObject(this.where)) {
      for (const key of Object.keys(this.where)) {
        this._appendOp(key, null, this.where[key]);
      }
    }

    return {
      sql: this.sql.join(` ${conjunction} `),
      params: this.params,
    };
  }

  build() {
    return this._build();
  }
}
