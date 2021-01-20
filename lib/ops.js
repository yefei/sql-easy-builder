'use strict';

exports.flat = {
  eq: '=',
  ne: '!=',
  gte: '>=',
  gt: '>',
  lte: '<=',
  lt: '<',
  not: 'IS NOT',
  is: 'IS',
  like: 'LIKE',
  notlike: 'NOT LIKE',
  ilike: 'ILIKE',
  notilike: 'NOT ILIKE',
  regexp: '~',
  notregexp: '!~',
  iregexp: '~*',
  notiregexp: '!~*',
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
