export declare class Raw {
  constructor(str: string);
  toString(): string;
}

/** @deprecated use AttrBuilds.raw */
export declare function raw(str:string): Raw;

export declare class Where {
  constructor(builder: Builder, conjunction?: string);
  clone(): Where;
  conjunction(c: string): Where;
  holder(value: string | Raw): string;
  op(field: string | Raw, op: string, value: string | Raw): Where;
  or(callback: (w: Where) => Where): Where;
  in(field: string | Raw, values: (string|Raw)[]): Where;
  notin(field: string | Raw, values: (string|Raw)[]): Where;
  between(field: string | Raw, start: string | Raw, end: string | Raw): Where;
  notbetween(field: string | Raw, start: string | Raw, end: string | Raw): Where;
  build(): [string, any[]];
  eq(field: string | Raw, value: string | Raw): Where;
  ne(field: string | Raw, value: string | Raw): Where;
  gte(field: string | Raw, value: string | Raw): Where;
  gt(field: string | Raw, value: string | Raw): Where;
  lte(field: string | Raw, value: string | Raw): Where;
  lt(field: string | Raw, value: string | Raw): Where;
  not(field: string | Raw, value: string | Raw): Where;
  is(field: string | Raw, value: string | Raw): Where;
  like(field: string | Raw, value: string | Raw): Where;
  notlike(field: string | Raw, value: string | Raw): Where;
  ilike(field: string | Raw, value: string | Raw): Where;
  notilike(field: string | Raw, value: string | Raw): Where;
  regexp(field: string | Raw, value: string | Raw): Where;
  notregexp(field: string | Raw, value: string | Raw): Where;
}

export declare class AttrBuilder {
  build(builder: Builder): [string, any[]];
}

export declare class Op extends AttrBuilder {
  constructor(prep?: string | Raw);
  op(op: string, value: any | Raw | ((op: Op) => Op)): Op;
}

export declare class Fn extends AttrBuilder {
  constructor(fn: string, args?: any);
}

export declare class Quote extends AttrBuilder {
  constructor(col: string);
}

export declare class Template extends AttrBuilder {
  constructor(strings: string[], args: any[]);
}

export declare class Builder {
  constructor(quote: string);
  clone(): Builder;
  raw(str: string): Raw;
  quote(c: string | Raw): string;
  q(c: string | Raw): string;
  op(prep: string | Raw, op?: string, value?: string | number | ((op: Op) => Op)): Op;
  append(sql: string, params?: any[]): Builder;
  SQL(strings: string[], ...args: any): Builder;
  param(value: any): Builder;

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
  update(table: string, columns: { [key: string]: any }): Builder;

  /**
   * insert('user', { name: 'yf', age: 18, }) => INSERT INTO user (name, age) VALUES (?, ?); ['yf', 18]
   * @param table 
   * @param columns 
   */
  insert(table: string, columns: { [key: string]: any }): Builder;

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
  where(query: { [key: string]: any } | ((w: Where) => Where)): Builder;

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

  build(): [string, any[]];
}

export declare namespace AB {
  declare function raw(str: string): Raw;
  declare function quote(col: string): Quote;
  declare function SQL(strings: string[], ...args: any[]): Template;
  declare function op(prep: string): Op;
  declare function count(col: string): Fn;
  declare function incr(col: string, val?: number): Op;
  declare function decr(col: string, val?: number): Op;
};
