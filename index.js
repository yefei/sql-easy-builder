'use strict';

const Raw = require('./lib/raw');
const Fn = require('./lib/fn');
const Quote = require('./lib/quote');
const Op = require('./lib/op');

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
