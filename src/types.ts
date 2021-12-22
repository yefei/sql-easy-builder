import { Raw } from './raw';
import { AttrBuilder } from './attr_builder';
import { Where } from './where';
import { Builder } from './builder';

export type FieldType = string | Raw | AttrBuilder;
export type ValueType = string | Raw | AttrBuilder | number | boolean | Date;
export type BuildResult = [sql: string, params?: ValueType[]];
export type ResultRow = { [column: string]: ValueType };
export type WhereType = JsonWhere | ((where: Where) => Where);
export type FieldsType = (FieldType | { [key: string]: FieldType | FieldType[] | Builder })[];

export interface JsonWhereOp {
  /** = */
  $eq: ValueType;

  /** != */
  $ne: ValueType;

  /** >= */
  $gte: ValueType;

  /** > */
  $gt: ValueType;

  /** <= */
  $lte: ValueType;

  /** < */
  $lt: ValueType;

  /** IS */
  $is: ValueType;

  /** IS NOT */
  $isnot: ValueType;

  /** IS NOT */
  $not: ValueType;

  /** LIKE */
  $like: ValueType;

  /** NOT LIKE */
  $notlike: ValueType;

  /** ILIKE */
  $ilike: ValueType;

  /** NOT ILIKE */
  $notilike: ValueType;

  /** REGEXP */
  $regexp: ValueType;

  /** NOT REGEXP */
  $notregexp: ValueType;

  $in: ValueType[],
  $notin: ValueType[],
  $between: [start: ValueType, end: ValueType],
  $notbetween: [start: ValueType, end: ValueType],

  /** 字段转译 */
  $quote: string;

  /** 原始内容 */
  $raw: string;
}

export interface JsonWhere {
  $or?: JsonWhere | JsonWhere[];
  $and?: JsonWhere | JsonWhere[];
  [field: string]: JsonWhereOp | JsonWhere | JsonWhere[] | ValueType | ValueType[];
}
