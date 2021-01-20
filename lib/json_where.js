'use strict';

const Raw = require('./raw');
const operatorMap = require('./ops').all;

/**
 * @param {import('./builder')} builder
 * @param {*} query
 */
function jsonWhere(builder, query) {
  function each(items, conjunction = 'AND') {
    let keys;
    try {
      keys = Object.keys(items);
    } catch (e) {
      throw new TypeError(`Expected object, got ${typeof items}`);
    }
    const _sql = [];
    const _params = [];

    function holder(v) {
      if (v instanceof Raw) return v.toString();
      _params.push(v);
      return '?';
    }

    function opMake(op, key, value, conjunction = 'AND') {
      if (op === 'between' || op === 'notbetween') {
        value = `${holder(value[0])} AND ${holder(value[1])}`;
      }
      else if (Array.isArray(value)) {
        op = op === null ? 'in' : op;
        if (op === 'in' || op === 'notin') {
          value = `(${value.map(i => holder(i)).join(', ')})`;
        } else {
          return value.map(v => opMake(op, key, v)).join(` ${conjunction} `);
        }
      }
      else if (value === null) {
        op = op === null ? 'is' : op;
        value = 'NULL';
      }
      else {
        value = holder(value);
      }
      op = op || 'eq';
      if (operatorMap[op] === undefined) {
        throw new TypeError(`Unknown operator: ${op}`);
      }
      return `${builder.quote(key)} ${operatorMap[op]} ${value}`;
    }

    function fieldOpMake(key, value, conjunction = 'AND') {
      return Object.keys(value).map(op => {
        // { field: { $or: { eq: 1, ne: 2 } } }
        if (op === '$or') return '(' + fieldOpMake(key, value[op], 'OR') + ')';
        // { field: { eq: 1, ne: 2 } }
        return opMake(op, key, value[op], conjunction);
      }).join(` ${conjunction} `);
    }

    for (const key of keys) {
      let value = items[key];

      // { $or: { field: 1, field2: 2 } }
      if (key === '$or') {
        const r = each(value, 'OR');
        _sql.push(`(${r[0]})`);
        _params.push(...r[1]);
        continue;
      }

      // { field: { eq: 1, ne: 2 } }
      // { field: { $or: { eq: 1, ne: 2 } } }
      if (value && !Array.isArray(value) && typeof value === 'object' && !(value instanceof Raw)) {
        _sql.push(fieldOpMake(key, value));
        continue;
      }

      _sql.push(opMake(null, key, value));
    }
    return [_sql.join(` ${conjunction} `), _params];
  }
  return each(query);
}

module.exports = jsonWhere;
