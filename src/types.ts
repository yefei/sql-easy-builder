import { Raw } from './raw';
import { AttrBuilder } from './attr_builder';
import { JsonWhere } from './json_where';
import { Where } from './where';
import { Builder } from './builder';

export type FieldType = string | Raw | AttrBuilder;
export type ValueType = string | Raw | AttrBuilder | number | boolean | Date;
export type BuildResult = [sql: string, params?: ValueType[]];
export type ResultRow = { [column: string]: ValueType };
export type WhereType = JsonWhere | ((where: Where) => Where);
export type FieldsType = (FieldType | { [key: string]: FieldType | FieldType[] | Builder })[];
