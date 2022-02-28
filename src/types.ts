import { Raw } from './raw';
import { AttrBuilder } from './attr_builder';
import { Where } from './where';
import { Builder } from './builder';

export type BasicType = string | number | boolean | Date;
export type SQLTemplateArg = Raw | AttrBuilder | BasicType | BasicType[];
export type FieldType = Raw | AttrBuilder | string;
export type ValueType = Raw | AttrBuilder | BasicType;
export type BuildResult = [sql: string, params?: ValueType[]];
export type ValueRow = { [column: string]: ValueType };
export type WhereType = JsonWhereParam | ((where: Where) => Where);
export type FieldsType = (FieldType | { [key: string]: FieldType | FieldType[] | Builder })[];

interface $Q {
  /** 转译为字段 */
  $quote?: string;

  /** 原始内容拼接入SQL中不做任何处理。 注意：小心SQL注入漏洞 */
  $raw?: string;
}

type $Value = ValueType | $Q;

export interface JsonWhereOp extends $Q {
  /** = */
  $eq?: $Value;

  /** != */
  $ne?: $Value;

  /** \>= */
  $gte?: $Value;

  /** \> */
  $gt?: $Value;

  /** \<= */
  $lte?: $Value;

  /** \< */
  $lt?: $Value;

  /** IS */
  $is?: $Value;

  /** IS NOT */
  $isnot?: $Value;

  /** IS NOT */
  $not?: $Value;

  /** LIKE */
  $like?: $Value;

  /** NOT LIKE */
  $notlike?: $Value;

  /** ILIKE */
  $ilike?: $Value;

  /** NOT ILIKE */
  $notilike?: $Value;

  /** REGEXP */
  $regexp?: $Value;

  /** NOT REGEXP */
  $notregexp?: $Value;

  /** IN */
  $in?: $Value[],

  /** NOT IN */
  $notin?: $Value[],

  /** BETWEEN [start] AND [end] */
  $between?: [start: $Value, end: $Value],

  /** NOT BETWEEN [start] AND [end] */
  $notbetween?: [start: $Value, end: $Value],

  // f15: { $or: { $eq: 'f15-1', $gt: 'f15-2', $or: { $eq: 16, $gt: 18 } } },
  $or?: JsonWhereOp;
  $and?: JsonWhereOp;
}

/**
 * 表字段操作
 */
export type FieldWhere = { [field: string]: ValueType | ValueType[] | JsonWhereOp | FieldWhere | FieldWhere[] };

export interface JsonWhere extends FieldWhere {
  /**
   * 对象以下字段执行 OR 查询
   */
  $or?: FieldWhere | FieldWhere[];

  /**
   * 对象以下字段执行 AND 查询
   */
  $and?: FieldWhere | FieldWhere[];
}

export type JsonWhereParam = JsonWhere | {
  [name: string]: JsonWhere | AttrBuilder | Raw;
};

/*
function aaa(j:JsonWhereParam) {}

aaa({
  ddd: {
    $or: [
      { aaa: 1 }
    ],
    kkk: 1,
  },
  ccc : AB.SQL`aaa`,
});


const where = {
  advertise: {
    status: 1,
    type_id: [1],
    start_time: { $lt: new Date() },
    end_time: { $gt: new Date() },
    deleted_at: null,
    $or: [
      { exactly_type: { $gt: 100 } },
    ],
  } as JsonWhere,
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
