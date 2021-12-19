import { Builder } from './builder';
import { Raw } from './raw';
import { BuildResult, FieldType, ValueType } from './types';

export class Where {
  private _builder: Builder;
  private _conjunction: string;
  private _sql: string[] = [];
  private _params: ValueType[] = [];

  constructor(builder: Builder, conjunction = 'AND') {
    this._builder = builder;
    this._conjunction = conjunction;
  }

  clone() {
    const where = new Where(this._builder, this._conjunction);
    where._sql = where._sql.slice();
    where._params = where._params.slice();
    return where;
  }

  conjunction(c: string) {
    this._conjunction = c;
    return this;
  }

  holder(value: ValueType) {
    if (value instanceof Raw) return value.toString();
    this._params.push(value);
    return '?';
  }

  op(field: FieldType, op: string, value: string) {
    this._sql.push(`${this._builder.quote(field)} ${op} ${value}`);
    return this;
  }

  or(callback: (where: Where) => Where) {
    const result = callback(new Where(this._builder, 'OR')).build();
    this._sql.push(`( ${result[0]} )`);
    this._params.push(...result[1]);
    return this;
  }

  private _valuesOp(field: FieldType, op: string, values: ValueType[]) {
    return this.op(field, op, `(${values.map(i => this.holder(i)).join(', ')})`);
  }

  in(field: FieldType, values: ValueType[]) {
    return this._valuesOp(field, 'IN', values);
  }

  notin(field: FieldType, values: ValueType[]) {
    return this._valuesOp(field, 'NOT IN', values);
  }

  between(field: FieldType, start: ValueType, end: ValueType) {
    return this.op(field, 'BETWEEN', `${this.holder(start)} AND ${this.holder(end)}`);
  }

  notbetween(field: FieldType, start: ValueType, end: ValueType) {
    return this.op(field, 'NOT BETWEEN', `${this.holder(start)} AND ${this.holder(end)}`);
  }

  build(): BuildResult {
    return [this._sql.join(` ${this._conjunction} `), this._params];
  }

  eq(field: FieldType, value: ValueType) {
    return this.op(field, '=', this.holder(value));
  }

  ne(field: FieldType, value: ValueType) {
    return this.op(field, '<>', this.holder(value));
  }

  gte(field: FieldType, value: ValueType) {
    return this.op(field, '>=', this.holder(value));
  }

  gt(field: FieldType, value: ValueType) {
    return this.op(field, '>', this.holder(value));
  }

  lte(field: FieldType, value: ValueType) {
    return this.op(field, '<=', this.holder(value));
  }

  lt(field: FieldType, value: ValueType) {
    return this.op(field, '<', this.holder(value));
  }

  not(field: FieldType, value: ValueType) {
    return this.op(field, 'IS NOT', this.holder(value));
  }

  is(field: FieldType, value: ValueType) {
    return this.op(field, 'IS', this.holder(value));
  }

  like(field: FieldType, value: ValueType) {
    return this.op(field, 'LIKE', this.holder(value));
  }

  notlike(field: FieldType, value: ValueType) {
    return this.op(field, 'NOT LIKE', this.holder(value));
  }

  ilike(field: FieldType, value: ValueType) {
    return this.op(field, 'ILIKE', this.holder(value));
  }

  notilike(field: FieldType, value: ValueType) {
    return this.op(field, 'NOT ILIKE', this.holder(value));
  }

  regexp(field: FieldType, value: ValueType) {
    return this.op(field, 'REGEXP', this.holder(value));
  }

  notregexp(field: FieldType, value: ValueType) {
    return this.op(field, 'NOT REGEXP', this.holder(value));
  }
}

/*
const Builder = require('./builder');
console.log(new Where(new Builder())
  .eq('name', 'aaa')
  .eq('cccc', 123)
  .ne('ne', 1)
  .gt('rrr', 1111)
  .in('in', [1,2,3,4])
  .notin('notin', [1,2,3,4])
  .between('between', 1, 2)
  .or(w => w.eq('aaa', 111).eq('nnn', 222))
  .build());
*/
