export declare class Raw {
  constructor(str: string);
  toString(): string;
}

/** @deprecated use AttrBuilds.raw */
export declare function raw(str:string): Raw;

type Value = string | number | boolean | Date | Raw;

export declare class Where {
  constructor(builder: Builder, conjunction?: string);
  clone(): Where;
  conjunction(c: string): Where;
  holder(value: Value): string;
  op(field: string | Raw, op: string, value: Value): Where;
  or(callback: (w: Where) => Where): Where;
  in(field: string | Raw, values: Value[]): Where;
  notin(field: string | Raw, values: Value[]): Where;
  between(field: string | Raw, start: Value, end: Value): Where;
  notbetween(field: string | Raw, start: Value, end: Value): Where;
  build(): [string, Value[]];
  eq(field: string | Raw, value: Value): Where;
  ne(field: string | Raw, value: Value): Where;
  gte(field: string | Raw, value: Value): Where;
  gt(field: string | Raw, value: Value): Where;
  lte(field: string | Raw, value: Value): Where;
  lt(field: string | Raw, value: Value): Where;
  not(field: string | Raw, value: Value): Where;
  is(field: string | Raw, value: Value): Where;
  like(field: string | Raw, value: Value): Where;
  notlike(field: string | Raw, value: Value): Where;
  ilike(field: string | Raw, value: Value): Where;
  notilike(field: string | Raw, value: Value): Where;
  regexp(field: string | Raw, value: Value): Where;
  notregexp(field: string | Raw, value: Value): Where;
}

export interface JsonWhereOp {
  /** = */
  $eq: Value;

  /** != */
  $ne: Value;

  /** >= */
  $gte: Value;

  /** > */
  $gt: Value;

  /** <= */
  $lte: Value;

  /** < */
  $lt: Value;

  /** IS */
  $is: Value;

  /** IS NOT */
  $isnot: Value;

  /** IS NOT */
  $not: Value;

  /** LIKE */
  $like: string;

  /** NOT LIKE */
  $notlike: string;

  /** ILIKE */
  $ilike: string;

  /** NOT ILIKE */
  $notilike: string;

  /** REGEXP */
  $regexp: string;

  /** NOT REGEXP */
  $notregexp: string;

  $in: Value[],
  $notin: Value[],
  $between: [Value, Value],
  $notbetween: [Value, Value],

  /** 字段转译 */
  $quote: string;

  /** 原始内容 */
  $raw: string;
}

export interface JsonWhere {
  $or: JsonWhere | JsonWhere[];
  $and: JsonWhere | JsonWhere[];
  [field: string]: JsonWhereOp | JsonWhere | JsonWhere[] | Value | Value[];
}

export declare class AttrBuilder {
  build(builder: Builder): [string, Value[]];
}

export declare class Op extends AttrBuilder {
  constructor(prep?: string | Raw);
  op(op: string, value: Value | ((op: Op) => Op)): Op;
}

export declare class Fn extends AttrBuilder {
  constructor(fn: string, args?: Value);
}

export declare class Quote extends AttrBuilder {
  constructor(col: string);
}

export declare class Template extends AttrBuilder {
  constructor(strings: string[], args: Value[]);
}

export declare class Builder {
  constructor(quote: string);
  clone(): Builder;
  raw(str: string): Raw;
  quote(c: string | Raw): string;
  q(c: string | Raw): string;
  op(prep: string | Raw, op?: string, value?: string | number | ((op: Op) => Op)): Op;
  append(sql: string, params?: Value[]): Builder;
  SQL(strings: string[], ...args: Value): Builder;
  param(value: Value): Builder;

  /**
   * fields(['id', 'name', { age: 'user_age', id: 'user_id' }]) => id, name, age as user_age, id as user_id
   * fields([{ user: ['id', 'name'], profile: ['edu', 'work'] }]) => user.id, user.name, profile.edu, profile.work
   * fields([{ user: { id: 'userId', name: 'user.Name' } }]) => user.id AS userId, user.name as user.Name
   * fields([{ asName: Builder() }]) => builder AS asName
   * fields([{ asName: Raw() }]) => raw AS asName
   * @param fields 
   */
  fields(fields: string[] | { [key: string]: string }): Builder;

  /**
   * select() => SELECT *
   * select('id', 'name', { age: 'user_age', id: 'user_id' }, ...) => SELECT id, name, age as user_age, id as user_id
   * select({ user: ['id', 'name'], profile: ['edu', 'work'] }) => SELECT user.id, user.name, profile.edu, profile.work
   * select({ user: { id: 'userId', name: 'user.Name' } }) => SELECT user.id AS userId, user.name as user.Name
   * select({ asName: Builder() }) => SELECT builder AS asName
   * select({ asName: Raw() }) => SELECT raw AS asName
   * @param cloums 
   */
  select(...cloums: string[] | { [key: string]: string }[]): Builder;

  /**
   * update('user', { name: 'yf', age: 18, }) => UPDATE user SET name = ?, age = ?; ['yf', 18]
   * @param table 
   * @param columns 
   */
  update(table: string, columns: { [key: string]: Value }): Builder;

  /**
   * insert('user', { name: 'yf', age: 18, }) => INSERT INTO user (name, age) VALUES (?, ?); ['yf', 18]
   * @param table 
   * @param columns 
   */
  insert(table: string, columns: { [key: string]: Value }): Builder;

  /**
   * delete('uset') => DELETE FROM user
   * @param table 
   */
  delete(table: string): Builder;

  as(from: string | Raw, to: string | Raw): Raw;

  /**
   * from('t') => FROM t
   * from('t', 'b') => FROM t AS b
   * @param name 
   * @param alias 
   */
  from(name: string | Raw, alias: string | Raw): Builder;


  /**
   * join('user', { user.id: other.id }) => INNER JOIN user ON(user.id = other.id)
   * join('user', 'u', { u.id: other.id }) => INNER JOIN user AS u ON(u.id = other.id)
   * @param table
   * @param alias
   * @param on
   */
  join(table: string|Raw, alias:string|Raw|((w: Where) => Where), on?:(w: Where) => Where): Builder;

  /**
   * join('user', { user.id: other.id }) => LEFT JOIN user ON(user.id = other.id)
   * join('user', 'u', { u.id: other.id }) => LEFT JOIN user AS u ON(u.id = other.id)
   * @param table
   * @param alias
   * @param on
   */
  leftJoin(table: string|Raw, alias:string|Raw|((w: Where) => Where), on?:(w: Where) => Where): Builder;

  /**
   * join('user', { user.id: other.id }) => RIGHT JOIN user ON(user.id = other.id)
   * join('user', 'u', { u.id: other.id }) => RIGHT JOIN user AS u ON(u.id = other.id)
   * @param table
   * @param alias
   * @param on
   */
  rightJoin(table: string|Raw, alias:string|Raw|((w: Where) => Where), on?:(w: Where) => Where): Builder;

  /**
   * where({ username: 'test' }) => WHERE username = ?; ['test']
   * where(w => w.eq('username', 'test')) => WHERE username = ?; ['test']
   * @param query 
   */
  where(query: JsonWhere | ((w: Where) => Where)): Builder;

  /**
   * func('COUNT', '*') => COUNT(*)
   * func('COUNT', '*', 'c') => COUNT(*) AS c
   * @param name 
   * @param exp 
   * @param alias 
   */
  func(name: string, exp: string | Raw, alias: string | Raw): Raw;

  /**
   * count() => SELECT COUNT(*)
   * count('id') => SELECT COUNT(id)
   * count('id', 'user_count') => SELECT COUNT(id) AS user_count
   * @param column 
   * @param alias 
   */
  count(column?: string, alias?: string): Builder;

  /**
   * limit(100) => LIMIT 100
   * limit(100, 100) => LIMIT 100 OFFSET 100
   * @param count 
   * @param offset 
   */
  limit(count: number, offset?: number): Builder;

  /**
   * => LIMIT 1
   * @param offset
   */
  one(offset?: number): Builder;

  setOne(v: boolean): Builder;

  isOne(): boolean;

  nestTables(v: boolean | string): Builder;

  getNestTables(): boolean | string;

  /**
   * order('id') => ORDER BY id ASC
   * order('-id') => ORDER BY id DESC
   * order('-created_at', '-id') => ORDER BY created_at DESC, id DESC
   * @param fields
   */
  order(...fields: string[]): Builder;

  /**
   * group('id') => GROUP BY id
   * @param fields 
   */
  group(...fields: string[]): Builder;

  /**
   * having({ count: { $gt: 10 } }) => HAVING count > 10
   * @param query 
   */
  having(query: ((w: Where) => Where)): Builder;

  build(): [string, Value[]];
}

export declare namespace AB {
  function raw(str: string): Raw;
  function quote(col: string): Quote;
  function SQL(strings: string[], ...args: Value[]): Template;
  function op(prep: string): Op;
  function count(col: string): Fn;
  function avg(col: string): Fn;
  function sum(col: string): Fn;
  function min(col: string): Fn;
  function max(col: string): Fn;
  function incr(col: string, val?: number): Op;
  function decr(col: string, val?: number): Op;
}
