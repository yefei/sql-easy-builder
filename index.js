'use strict';

const { Raw, Fn, Quote, Op } = require('./lib/q');

const Q = {
  quote(col) { return new Quote(col); },
  raw(str) { return new Raw(str); },
  count(col) { return new Fn('COUNT', col); },
  op(prep) { return new Op(prep); },
  add(col, val) { return Q.op(Q.quote(col)).op('+', val || 1); },
};

module.exports = {
  Builder: require('./lib/builder'),
  Where: require('./lib/where'),
  Raw,
  raw: Q.raw,
  Op: require('./lib/op'),
  Q,
};
