'use strict';

/**
 * @typedef { import('./builder') } Builder
 */

const isPlainObject = require('lodash.isplainobject');
const Raw = require('./raw');
const operatorMap = require('./ops').all;

/**
 * @param {Builder} builder 
 * @param {{[key: string]: any}} obj 
 * @param {string} conjunction 
 */
function jsonWhere(builder, obj, conjunction = 'AND') {
  const sql = [];
  const params = [];

  function holder(v) {
    if (v instanceof Raw) return v.toString();
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
  function fieldObject(key, value) {
    if (key === '$or' || key === '$and') {
      const _con = key.substring(1).toUpperCase();
      // $or: [
      //   { f8: 'f8' },
      //   { f9: 'f9', f10: 'f10', $or: { f12: 'f12', f13: 'f13' } },
      // ]
      if (Array.isArray(value)) {
        const _sql = [];
        const _params = [];
        value.forEach(item => {
          const [_item_sqls, _item_params] = jsonWhere(builder, item, null);
          _sql.push(_item_sqls.length > 1 ? `( ${_item_sqls.join(' AND ')} )` : _item_sqls[0]);
          _params.push(..._item_params);
        });
        sql.push(_sql.length === 1 ? _sql[0] : `( ${_sql.join(` ${_con} `)} )`);
        params.push(..._params);
      }

      // $or: { f8: 'f8', f9: 'f9' }
      else {
        const [_sqls, _params] = jsonWhere(builder, value, null);
        sql.push(_sqls.length > 1 ? `( ${_sqls.join(` ${_con} `)} )` : _sqls[0]);
        params.push(..._params);
      }
      return;
    }
    Object.keys(value).forEach(op => {
      appendOp(key, op, value[op]);
    });
  }

  let lastOp;

  function appendOp(key, op, value) {
    // ignore undefined
    if (value === undefined) return;

    // $op | key.key
    if (op) {
      if(op[0] === '$') {
        op = op.substring(1);
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
      if (value.length === 0) return; // []

      // between
      if (op === 'between' || op === 'notbetween') {
        if (value.length !== 2) {
          throw new TypeError('between or notbetween must be 2 values');
        }
        value = `${holder(value[0])} AND ${holder(value[1])}`;
      }

      // [1]
      else if (value.length === 1) value = holder(value[0]);

      // [1, 2, ...]
      else {
        value = `(${value.map(i => holder(i)).join(', ')})`;
        if (op === null) op = 'in';
      }
    }

    // f6: new Raw('test')
    else if (value instanceof Raw) {
      value = value.toString();
    }

    // f11: null
    else if (value === null) {
      if (op === null) op = 'is';
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
    if (operatorMap[op] === undefined) {
      throw new TypeError(`Unknown operator: ${op}`);
    }

    sql.push(`${builder.quote(key)} ${operatorMap[op]} ${value}`);
  }

  if (obj) Object.keys(obj).forEach(key => {
    appendOp(key, null, obj[key]);
  });

  return [conjunction ? sql.join(` ${conjunction} `) : sql, params];
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

module.exports = jsonWhere;
