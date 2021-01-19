
declare class Raw {
  constructor(str: string);
  toString(): string;
}

declare class Builder {
  constructor(quote: string);
  raw(str: string): Raw;
  quote(c: string | Raw): string;
  select(...cloums?: string[] | { [string]: string }): Builder;
  update(table: string, columns: { [string]: any }): Builder;
  insert(table: string, columns: { [string]: any }): Builder;
  as(from: string | Raw, to: string | Raw): Raw;
  from(name: string): Builder;
  where(query: { [string]: any }): Builder;
  count(column?: string, alias?: string): Builder;
  limit(count: number, offset?: number): Builder;
  one(offset?: number): Builder;
  isOne(): boolean;
  build(): [string, any[]];
}

export = Builder;
