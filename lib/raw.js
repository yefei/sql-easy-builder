'use strict';

class Raw {
  /**
   * @param {string} str
   */
  constructor(str) {
    this._str = str;
  }

  /**
   * @returns {string}
   */
  toString() {
    return this._str;
  }
}

module.exports = Raw;
