import { Raw } from './raw';
import { AttrBuilder } from './attr_builder';
import { Where } from './where';
import { Builder } from './builder';

export type FieldType = string | Raw | AttrBuilder;
export type ValueType = string | Raw | AttrBuilder | number | boolean | Date;
export type BuildResult = [sql: string, params?: ValueType[]];
export type ValueRow = { [column: string]: ValueType };
export type WhereType = JsonWhere | ((where: Where) => Where);
export type FieldsType = (FieldType | { [key: string]: FieldType | FieldType[] | Builder })[];

export interface JsonWhereOp {
  /** = */
  $eq?: ValueType;

  /** != */
  $ne?: ValueType;

  /** \>= */
  $gte?: ValueType;

  /** \> */
  $gt?: ValueType;

  /** \<= */
  $lte?: ValueType;

  /** \< */
  $lt?: ValueType;

  /** IS */
  $is?: ValueType;

  /** IS NOT */
  $isnot?: ValueType;

  /** IS NOT */
  $not?: ValueType;

  /** LIKE */
  $like?: ValueType;

  /** NOT LIKE */
  $notlike?: ValueType;

  /** ILIKE */
  $ilike?: ValueType;

  /** NOT ILIKE */
  $notilike?: ValueType;

  /** REGEXP */
  $regexp?: ValueType;

  /** NOT REGEXP */
  $notregexp?: ValueType;

  /** IN */
  $in?: ValueType[],

  /** NOT IN */
  $notin?: ValueType[],

  /** BETWEEN [start] AND [end] */
  $between?: [start: ValueType, end: ValueType],

  /** NOT BETWEEN [start] AND [end] */
  $notbetween?: [start: ValueType, end: ValueType],

  /** 转译为字段 */
  $quote?: string;

  /** 原始内容拼接入SQL中不做任何处理。 注意：小心SQL注入漏洞 */
  $raw?: string;
}

export interface JsonWhere {
  /**
   * 对象以下字段执行 OR 查询
   */
  $or?: JsonWhere | JsonWhere[];

  /**
   * 对象以下字段执行 AND 查询
   */
  $and?: JsonWhere | JsonWhere[];

  /**
   * 数据库字段操作
   */
  [field: string]: JsonWhereOp | JsonWhere | JsonWhere[] | ValueType | ValueType[];
}

/*
const where: JsonWhere & { advertise: JsonWhere & { $or: JsonWhere[] }  } = {
  advertise: {
    status: 1, // 仅限开启状态的
    type_id: [1],
    start_time: { $lt: new Date() },
    end_time: { $gt: new Date() },
    deleted_at: null,
    $or: [
      { exactly_type: 0 },
    ],
  },
  ad_type: {
    type: 1,
  },
};
where.advertise.site_id = { $or: { $is: null, $eq: 1 } };
where.advertise.$or.push({
  exactly_type: 1,
  with_job_subarea: { $regexp: '(,|^)(1)(,|$)' },
});
*/
