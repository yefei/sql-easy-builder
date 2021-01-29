'use strict';

const Raw = require('./lib/raw');

/**
 * new Raw()
 * @param {string} str
 */
function raw(str) {
  return new Raw(str);
}

module.exports = {
  Builder: require('./lib/builder'),
  Where: require('./lib/where'),
  Raw,
  raw,
  Op: require('./lib/op'),
};
