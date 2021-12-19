export const flat: { [key: string]: string } = {
  eq: '=',
  ne: '!=',
  gte: '>=',
  gt: '>',
  lte: '<=',
  lt: '<',
  is: 'IS',
  isnot: 'IS NOT',
  not: 'IS NOT',
  like: 'LIKE',
  notlike: 'NOT LIKE',
  ilike: 'ILIKE',
  notilike: 'NOT ILIKE',
  regexp: 'REGEXP',
  notregexp: 'NOT REGEXP',
};

export const other: { [key: string]: string } = {
  in: 'IN',
  notin: 'NOT IN',
  between: 'BETWEEN',
  notbetween: 'NOT BETWEEN',
};

export const all: { [key: string]: string } = {
  ...flat,
  ...other,
};
