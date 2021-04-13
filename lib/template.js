'use strict';

const Raw = require('./raw');
const quoteRe = /\{([\w_.]+)\}/g;

/**
 * ES2015 template
 * T`SELECT * FROM {user} WHERE {age} > ${100}`
 *    => SELECT * FROM `user` WHERE `age` > ?; [100]
 * @param {import('./builder')} builder
 * @param {*[]} strings
 * @param  {...any} args
 */
function template(builder, strings, ...args) {
  const sql = [];
  const params = [];
  if (args.length === 0) {
    sql.push(strings[0]);
  } else {
    for (let i = 0; i < args.length; ++i) {
      strings[i] && sql.push(strings[i]);
      const arg = args[i];
      // if (arg === undefined) {
      //   continue;
      // }
      if (arg instanceof Raw) {
        sql.push(arg.toString());
        continue;
      }
      if (Array.isArray(arg)) {
        sql.push(arg.map(i => '?').join(','));
        params.push(...arg);
        continue;
      }
      sql.push('?');
      params.push(arg);
    }
    strings[strings.length - 1] && sql.push(strings[strings.length - 1]);
  }
  return {
    sql: sql.join('').replace(quoteRe, (match, p1) => {
      return builder.quote(p1);
    }),
    params
  };
}

module.exports = template;
