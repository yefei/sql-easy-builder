
declare class Raw {
  constructor(str: string);
  toString(): string;
}

declare class Builder {
  constructor(quote: string);
  clone(): Builder;
  raw(str: string): Raw;
  quote(c: string | Raw): string;
  append(sql: string): Builder;

  /**
   * fields('id', 'name', { age: 'user_age', id: 'user_id' }, ...) => id, name, age as user_age, id as user_id
   * @param fields 
   */
  fields(fields: string[] | { [key: string]: string }): Builder;

  /**
   * select() => SELECT *
   * select('id', 'name', { age: 'user_age', id: 'user_id' }, ...) => SELECT id, name, age as user_age, id as user_id
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
  delete(table): Builder;

  as(from: string | Raw, to: string | Raw): Raw;

  /**
   * from('t') => FROM t
   * from('t', 'b') => FROM t AS b
   * @param name 
   * @param alias 
   */
  from(name: string | Raw, alias: string | Raw): Builder;

  /**
   * where({ username: 'test' }) => WHERE username = ?; ['test']
   * @param query 
   */
  where(query: { [key: string]: any }): Builder;

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

  isOne(): boolean;

  /**
   * order('id') => ORDER BY id ASC
   * order('-id') => ORDER BY id DESC
   * order('-created_at', '-id') => ORDER BY created_at DESC, id DESC
   * @param fields
   */
  order(...fields: string[]): Builder;

  build(): [string, any[]];
}

export = Builder;
