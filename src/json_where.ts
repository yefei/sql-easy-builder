import { Builder } from './builder';
import isPlainObject = require('lodash.isplainobject');
import { all as operatorMap } from './where_ops';
import { BuildResult, ValueType } from './types';
import { Raw } from './raw';
import { AttrBuilder } from './attr_builder';

export interface JsonWhereOp {
  /** = */
  $eq: ValueType;

  /** != */
  $ne: ValueType;

  /** >= */
  $gte: ValueType;

  /** > */
  $gt: ValueType;

  /** <= */
  $lte: ValueType;

  /** < */
  $lt: ValueType;

  /** IS */
  $is: ValueType;

  /** IS NOT */
  $isnot: ValueType;

  /** IS NOT */
  $not: ValueType;

  /** LIKE */
  $like: ValueType;

  /** NOT LIKE */
  $notlike: ValueType;

  /** ILIKE */
  $ilike: ValueType;

  /** NOT ILIKE */
  $notilike: ValueType;

  /** REGEXP */
  $regexp: ValueType;

  /** NOT REGEXP */
  $notregexp: ValueType;

  $in: ValueType[],
  $notin: ValueType[],
  $between: [start: ValueType, end: ValueType],
  $notbetween: [start: ValueType, end: ValueType],

  /** 字段转译 */
  $quote: string;

  /** 原始内容 */
  $raw: string;
}

export interface JsonWhere {
  $or?: JsonWhere | JsonWhere[];
  $and?: JsonWhere | JsonWhere[];
  [field: string]: JsonWhereOp | JsonWhere | JsonWhere[] | ValueType | ValueType[];
}

export function jsonWhere(builder: Builder, obj: JsonWhere, conjunction = 'AND'): BuildResult {
  const sql: string[] = [];
  const params: ValueType[] = [];

  function holder(v: ValueType) {
    if (v instanceof Raw) return v.toString();
    if (v instanceof AttrBuilder) {
      const [_sql, _params] = v.build(builder);
      _params && params.push(..._params);
      return _sql;
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
      // $or: [
      //   { f8: 'f8' },
      //   { f9: 'f9', f10: 'f10', $or: { f12: 'f12', f13: 'f13' } },
      // ]
      if (Array.isArray(value) && value.length > 0) {
        const _sql: string[] = [];
        const _params: ValueType[] = [];
        value.forEach(item => {
          const [_item_sqls, _item_params] = jsonWhere(builder, item);
          _sql.push(`(${_item_sqls})`);
          _params.push(..._item_params);
        });
        sql.push(_sql.length === 1 ? _sql[0] : `(${_sql.join(` ${_con} `)})`);
        params.push(..._params);
      }

      // $or: { f8: 'f8', f9: 'f9' }
      else if (isPlainObject(value)) {
        const [_sqls, _params] = jsonWhere(builder, value, _con);
        sql.push(`(${_sqls})`);
        params.push(..._params);
      }
      return;
    }
    Object.keys(value).forEach(op => {
      appendOp(key, op, value[op]);
    });
  }

  let lastOp: string;
  function appendOp(key: string, op: string, value: any) {
    // ignore undefined
    if (value === undefined) throw new Error(`${key} value is undefined`);

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

    // f3: [1, 2, 3]
    // f7: { $between: ['f7-1', 'f7-2'] }
    if (Array.isArray(value) && key !== '$or' && key !== '$and') {
      if (value.length === 0) {
        throw new TypeError(`parameter '${key}' cannot be empty`);
      }

      // between
      if (op === 'between' || op === 'notbetween') {
        if (value.length !== 2) {
          throw new TypeError('between or notbetween must be 2 values');
        }
        value = `${holder(value[0])} AND ${holder(value[1])}`;
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
    const [_sql, _params] = obj.build(builder);
    sql.push(_sql);
    _params && params.push(..._params);
  }
  else if (isPlainObject(obj)) {
    Object.keys(obj).forEach(key => {
      appendOp(key, null, obj[key]);
    });
  }

  return [sql.join(` ${conjunction} `), params];
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
