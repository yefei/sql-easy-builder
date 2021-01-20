'use strict';

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
    for (const key of keys) {
      let value = items[key];

      if (key === '$or') {
        const r = each(value, 'OR');
        _sql.push(`(${r[0]})`);
        _params.push(...r[1]);
        continue;
      }

      let op = 'eq';

      if (value && !Array.isArray(value) && typeof value === 'object') {
        op = Object.keys(value)[0];
        value = Object.values(value)[0];
      }

      if (op === 'between') {
        _sql.push(`${builder.quote(key)} ${operatorMap[op]} ? AND ?`);
        _params.push(value[0], value[1]);
        continue;
      }

      if (Array.isArray(value)) {
        op = op == 'eq' ? 'in' : op;
        _sql.push(`${builder.quote(key)} ${operatorMap[op]} (${value.map(i=>'?').join(', ')})`);
        _params.push(...value);
        continue;
      }

      if (value === null) {
        op = op == 'eq' ? 'is' : op;
        _sql.push(`${builder.quote(key)} ${operatorMap[op]} NULL`);
        continue;
      }

      _sql.push(`${builder.quote(key)} ${operatorMap[op]} ?`);
      _params.push(value);
    }
    return [_sql.join(` ${conjunction} `), _params];
  }
  return each(query);
}

module.exports = whereBuilder;
