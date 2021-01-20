'use strict';

const Raw = require('./raw');

const operatorMap = {
  eq: '=',
  ne: '!=',
  gte: '>=',
  gt: '>',
  lte: '<=',
  lt: '<',
  not: 'IS NOT',
  is: 'IS',
  in: 'IN',
  notin: 'NOT IN',
  like: 'LIKE',
  notlike: 'NOT LIKE',
  ilike: 'ILIKE',
  notilike: 'NOT ILIKE',
  regexp: '~',
  notregexp: '!~',
  iregexp: '~*',
  notiregexp: '!~*',
  between: 'BETWEEN',
  notbetween: 'NOT BETWEEN',
};

/**
 * @param {import('./builder')} builder
 * @param {*} query
 */
function whereBuilder(builder, query) {
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

    for (const key of keys) {
      let value = items[key];

      if (key === '$or') {
        const r = each(value, 'OR');
        _sql.push(`(${r[0]})`);
        _params.push(...r[1]);
        continue;
      }

      let op = 'eq';

      if (value && !Array.isArray(value) && typeof value === 'object' && !(value instanceof Raw)) {
        op = Object.keys(value)[0];
        value = Object.values(value)[0];
      }

      if (op === 'between') {
        _sql.push(`${builder.quote(key)} ${operatorMap[op]} ${holder(value[0])} AND ${holder(value[1])}`);
        continue;
      }

      if (Array.isArray(value)) {
        op = op == 'eq' ? 'in' : op;
        _sql.push(`${builder.quote(key)} ${operatorMap[op]} (${value.map(i => holder(i)).join(', ')})`);
        continue;
      }

      if (value === null) {
        op = op == 'eq' ? 'is' : op;
        _sql.push(`${builder.quote(key)} ${operatorMap[op]} NULL`);
        continue;
      }

      _sql.push(`${builder.quote(key)} ${operatorMap[op]} ${holder(value)}`);
    }
    return [_sql.join(` ${conjunction} `), _params];
  }
  return each(query);
}

module.exports = whereBuilder;
