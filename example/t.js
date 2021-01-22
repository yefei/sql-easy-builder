const Raw = require('../lib/raw');

/**
   * ES2015 template
   * T`SELECT * FROM ${b.q('user')} WHERE {age} > ${100}`
   *    => SELECT * FROM `user` WHERE `age` > ?; [100]
   * @param {*[]} strings 
   * @param  {...any} args 
   */
function T(strings, ...args) {
  const sql = [];
  const params = [];
  if (args.length === 0) {
    sql.push(strings[0]);
  } else {
    for (let i = 0; i < args.length; ++i) {
      strings[i] && sql.push(strings[i]);
      const arg = args[i];
      if (arg === undefined) {
        continue;
      }
      if (arg instanceof Raw) {
        sql.push(arg.toString());
        continue;
      }
      sql.push('?');
      params.push(arg);
    }
    strings[strings.length - 1] && sql.push(strings[strings.length - 1]);
  }
  return { sql: sql.join(''), params };
}

console.log(T`SELECT * FROM user WHERE age > ${100}`);
