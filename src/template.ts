import { Builder } from './builder';
import { Raw } from './raw';

const quoteRe = /\{([\w_.]+)\}/g;

export type TemplateArgType = string | number | boolean | Date;
export type TemplateArg = Raw | TemplateArgType | TemplateArgType[];

/**
 * ES2015 template
 * T`SELECT * FROM {user} WHERE {age} > ${100}`
 *    => SELECT * FROM `user` WHERE `age` > ?; [100]
 */
export function template(builder: Builder, strings: TemplateStringsArray, ...args: TemplateArg[]) {
  const sql: string[] = [];
  const params: any[] = [];
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
    sql: sql.join('').replace(quoteRe, (_match, p1) => {
      return builder.quote(p1).toString();
    }),
    params
  };
}
