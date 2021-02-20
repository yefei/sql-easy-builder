'use strict';

exports.flat = {
  eq: '=',
  ne: '!=',
  gte: '>=',
  gt: '>',
  lte: '<=',
  lt: '<',
  is: 'IS',
  isnot: 'IS NOT',
  like: 'LIKE',
  notlike: 'NOT LIKE',
  ilike: 'ILIKE',
  notilike: 'NOT ILIKE',
  regexp: 'REGEXP',
  notregexp: 'NOT REGEXP',
};

exports.other = {
  in: 'IN',
  notin: 'NOT IN',
  between: 'BETWEEN',
  notbetween: 'NOT BETWEEN',
};

exports.all = {
  ...exports.flat,
  ...exports.other,
};
