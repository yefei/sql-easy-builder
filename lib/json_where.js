'use strict';

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
   * f2: { gt: 1, lt: 2 }
   * $or: { f8: 'f8', f9: 'f9' }
   * $or: [
   *   { f8: 'f8' },
   *   { f9: 'f9', f10: 'f10', $or: { f12: 'f12', f13: 'f13' } },
   * ]
   */
  function fieldObject(key, value) {
    if (key === '$or') {
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
        sql.push(_sql.length === 1 ? _sql[0] : `( ${_sql.join(' OR ')} )`);
        params.push(..._params);
      }

      // $or: { f8: 'f8', f9: 'f9' }
      else {
        const [_sqls, _params] = jsonWhere(builder, value, null);
        sql.push(_sqls.length > 1 ? `( ${_sqls.join(' OR ')} )` : _sqls[0]);
        params.push(..._params);
      }
      return;
    }
    Object.keys(value).forEach(op => {
      appendOp(key, op, value[op]);
    });
  }

  function appendOp(key, op, value) {
    // f15: { $or: { eq: 'f15-1', gt: 'f15-2' } }
    if (op === '$or') {
      // remap: [ { f15: { eq: 'f15-1' } }, { f15: { gt: 'f15-2' } } ]
      const obj = Object.entries(value).map(([op, value]) => ({ [key]: { [op]: value } }));
      fieldObject('$or', obj);
      return;
    }

    // f3: [1, 2, 3]
    // f7: { between: ['f7-1', 'f7-2'] }
    if (Array.isArray(value) && key !== '$or') {
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

    // f2: { gt: 1, lt: 2, in: [1, 2] }
    // $or: { f8: 'f8', f9: 'f9' }
    else if (typeof value === 'object') {
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

  Object.keys(obj).forEach(key => {
    appendOp(key, null, obj[key]);
  });

  return [conjunction ? sql.join(` ${conjunction} `) : sql, params];
}

module.exports = jsonWhere;
