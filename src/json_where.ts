import { Builder } from './builder';
import { isPlainObject } from './utils';
import { all as operatorMap } from './where_ops';
import { BuildResult, JsonWhere, ValueType } from './types';
import { Raw } from './raw';
import { AttrBuilder } from './attr_builder';

/**
 * 不使用标示
 * - 可以在 JSON 查询中赋值为 UNSET 删除查询条件
 * - 注意，为了让 TS 检查完美，没有使用 Symbol，index 中导出的 UNSET 为对象实例
 */
export class UNSET {};

export function jsonWhere(builder: Builder, obj: JsonWhere, conjunction = 'AND'): BuildResult {
  const sql: string[] = [];
  const params: ValueType[] = [];

  function holder(v: ValueType) {
    if (v instanceof Raw) return v.toString();
    if (v instanceof AttrBuilder) {
      const b = v.build(builder);
      b.params && params.push(...b.params);
      return b.sql;
    }
    params.push(v);
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
  function fieldObject(key: string, value: any) {
    if (key === '$or' || key === '$and') {
      const _con = key.substring(1).toUpperCase();
      if (value instanceof Raw) {
        sql.push(value.toString());
        return;
      }
      if (value instanceof AttrBuilder) {
        const b = value.build(builder);
        sql.push(b.sql);
        b.params && params.push(...b.params);
        return;
      }
      // $or: [
      //   { f8: 'f8' },
      //   { f9: 'f9', f10: 'f10', $or: { f12: 'f12', f13: 'f13' } },
      // ]
      if (Array.isArray(value) && value.length > 0) {
        const _sql: string[] = [];
        const _params: ValueType[] = [];
        value.forEach(item => {
          const b = jsonWhere(builder, item);
          if (!b.sql) return;
          _sql.push(`(${b.sql})`);
          b.params && _params.push(...b.params);
        });
        sql.push(_sql.length === 1 ? _sql[0] : `(${_sql.join(` ${_con} `)})`);
        params.push(..._params);
        return;
      }

      // $or: { f8: 'f8', f9: 'f9' }
      if (isPlainObject(value)) {
        const b = jsonWhere(builder, value, _con);
        sql.push(`(${b.sql})`);
        b.params && params.push(...b.params);
        return;
      }
      return;
    }
    Object.keys(value).forEach(op => {
      appendOp(key, op, value[op]);
    });
  }

  let lastOp: string | null;
  function appendOp(key: string, op: string | null, value: any) {
    // throw undefined
    if (value === undefined) throw new Error(`${key} value is undefined`);

    // ignore UNSET
    if (value instanceof UNSET) return;

    if (key === '$or' || key === '$and') {
      return fieldObject(key, value);
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
        fieldObject('$' + op, value.map(item => ({ [key]: item })));
      }
      return;
    }
    else if (op === 'quote') {
      op = lastOp || null;
      value = builder.quote(value);
    }
    else if (op === 'raw') {
      op = lastOp || null;
      value = builder.raw(value);
    }
    else if (op === 'match') {
      let modifier = '';
      if (typeof value === 'object') {
        if (value.modifier) {
          modifier = ' ' + value.modifier;
        }
        value = value.expr;
      }
      sql.push(`MATCH(${builder.quote(key)}) AGAINST(${holder(value)}${modifier})`);
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
          value = `${holder(value[0])} AND ${holder(value[1])}`;
        } else if (value[0] !== undefined) {
          op = op === 'notbetween' ? 'lte' : 'gte';
          value = holder(value[0]);
        } else if (value[1] !== undefined) {
          op = op === 'notbetween' ? 'gte' : 'lte';
          value = holder(value[1]);
        } else {
          throw new TypeError('between or notbetween at least one value is required');
        }
      }

      // [1]
      // else if (value.length === 1 && op === null) value = holder(value[0]);

      // [1, 2, ...]
      else {
        value = `(${value.map(i => holder(i)).join(', ')})`;
        if (op === null) op = 'in';
      }
    }

    // f11: null
    else if (value === null) {
      if (op === null || op === 'eq') op = 'is';
      else if (op === 'ne') op = 'isnot';
      value = 'NULL';
    }

    // f2: { $gt: 1, $lt: 2, $in: [1, 2] }
    // $or: { f8: 'f8', f9: 'f9' }
    // $or: []
    else if (Array.isArray(value) || isPlainObject(value)) {
      // lastOp:   👇
      //   f32: { $gt: { $quote: 'f32' } },
      //   f33: { $gt: { $raw: 'f33' } },
      lastOp = op;
      return fieldObject(key, value);
    }

    // f2: 1
    else {
      value = holder(value);
    }

    if (op === null) op = 'eq';
    if (!(op in operatorMap)) {
      throw new TypeError(`Unknown operator: ${op}`);
    }

    sql.push(`${builder.quote(key)} ${operatorMap[op]} ${value}`);
  }

  if (obj instanceof Raw) {
    sql.push(obj.toString());
  }
  else if (obj instanceof AttrBuilder) {
    const b = obj.build(builder);
    sql.push(b.sql);
    b.params && params.push(...b.params);
  }
  else if (isPlainObject(obj)) {
    Object.keys(obj).forEach(key => {
      appendOp(key, null, obj[key]);
    });
  }

  return {
    sql: sql.join(` ${conjunction} `),
    params,
  };
}

/*
const builder = new (require('./builder'))();
const test = {
  f1: 'f1',
  f2: { $gt: 'f2-gt', $lt: 'f2-lt', $in: ['f2-in-1', 'f2-in-2'], $eq: new Raw('f2-raw') },
  f3: ['f3-1', 'f3-2'],
  f4: ['f4'],
  f5: [],
  f6: new Raw('f6'),
  f7: { $between: ['f7-1', 'f7-2'] },
  $or: { f8: 'f8', f9: 'f9' },
  // $or: { f8: 'f8' },
  // $or: [
  //   { f8: 'f8' },
  //   { f9: 'f9', f10: 'f10', $or: { f12: 'f12', f13: 'f13' } },
  // ],
  f14: null,
  f15: { $or: { $eq: 'f15-1', $gt: 'f15-2', $or: { $eq: 16, $gt: 18 } } },
  f16: new Date(),
  f17: { f18: 'f17.f18', f19: { f20: { $gt: 'f20' } } },
  f21: {
    f22: 'f22',
    $or: {
      f23: 'f23',
      f24: 'f24',
    }
  },
  f25: {
    f26: 'f26',
    $or: [
      { f27: 'f27', f28: 'f28' },
      { f29: 'f29', f30: 'f30' },
    ]
  },
  // quote
  f31: { $quote: 'f31' },
  f32: { $gt: { $quote: 'f32' } },
  // raw
  f33: { $raw: 'f33' },
  f34: { $gt: { $raw: 'f34' } },
  // quote and raw
  f35: { $lt: { $raw: 'f35-r', $quote: 'f35-q' } },
  // and
  $and: [
    { f36: { $ne: 1 } },
    { f36: { $ne: 2 } },
  ],
  f37: {
    $and: { f38: 38, f39: 39 },
  },
  f40: {
    $and: [
      { f41: { $ne: 1 } },
      { f41: { $ne: 2 } },
    ]
  },
};
console.log(jsonWhere(builder, test));
*/

/*
const builder = new Builder();
console.log(jsonWhere(builder, {
  a: 1,
  $and: [
    { $or: { b: 1, c: 2 } },
    { $or: { d: 1, e: 2 } },
  ],
  b: {
    $match: { expr: 'kkk', modifier: 'IN BOOLEAN MODE' },
    d: { $match: 'aaa bbb' }
  }
}));
*/
