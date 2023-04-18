import { Raw } from './raw';
import { Where } from './where';
import { Builder } from './builder';
import { AttrBuilder } from './attr_builder';

/**
 * 位置类型
 */
export type PointType = { x: number, y: number };

/**
 * 基本类型
 */
export type BasicType = string | number | boolean | Date | Buffer | PointType | null;

/**
 * SQL 模版参数类型
 */
export type SQLTemplateArg = Raw | AttrBuilder | BasicType | BasicType[];

/**
 * 字段类型
 */
export type FieldType = Raw | AttrBuilder | string;

/**
 * 值类型
 */
export type ValueType = Raw | AttrBuilder | BasicType;

/**
 * 行值
 */
export type ValueRow = { [column: string]: ValueType };

/**
 * SQL 构建结果
 */
export interface BuildResult {
  /**
   * SQL 语句
   * - 输入参数使用 ? 占位符
   */
  sql: string;

  /**
   * 输入参数
   */
  params?: ValueType[];
}

/**
 * 查询方法参数
 */
export type WhereType = JsonWhere | Where | ((where: Where) => Where);

export type FieldsType = (FieldType | { [key: string]: FieldType | FieldType[] | Builder })[];

/**
 * 不使用
 * - 可以在 JSON 查询中赋值为 UNSET 删除查询条件
 */
export const UNSET = Symbol('unset');
export type UNSET = typeof UNSET;

interface $Q {
  /** 转译为字段 */
  $quote?: string | UNSET;

  /** 原始内容拼接入SQL中不做任何处理。 注意：小心SQL注入漏洞 */
  $raw?: string | UNSET;
}

type $Value = ValueType | $Q;

export interface JsonWhereOp extends $Q {
  /** = */
  $eq?: $Value | UNSET;

  /** != */
  $ne?: $Value | UNSET;

  /** \>= */
  $gte?: $Value | UNSET;

  /** \> */
  $gt?: $Value | UNSET;

  /** \<= */
  $lte?: $Value | UNSET;

  /** \< */
  $lt?: $Value | UNSET;

  /** IS */
  $is?: $Value | UNSET;

  /** IS NOT */
  $isnot?: $Value | UNSET;

  /** IS NOT */
  $not?: $Value | UNSET;

  /** LIKE */
  $like?: $Value | UNSET;

  /** NOT LIKE */
  $notlike?: $Value | UNSET;

  /** ILIKE */
  $ilike?: $Value | UNSET;

  /** NOT ILIKE */
  $notilike?: $Value | UNSET;

  /** REGEXP */
  $regexp?: $Value | UNSET;

  /** NOT REGEXP */
  $notregexp?: $Value | UNSET;

  /** IN */
  $in?: $Value[] | UNSET,

  /** NOT IN */
  $notin?: $Value[] | UNSET,

  /** BETWEEN [start] AND [end] */
  $between?: [start: $Value, end: $Value] | UNSET,

  /** NOT BETWEEN [start] AND [end] */
  $notbetween?: [start: $Value, end: $Value] | UNSET,

  /** MATCH(field) AGAINST(value mode) */
  $match?: string | {
    expr: string,
    modifier?: string,
  } | UNSET,

  // f15: { $or: { $eq: 'f15-1', $gt: 'f15-2', $or: { $eq: 16, $gt: 18 } } },
  $or?: JsonWhereOp | UNSET;
  $and?: JsonWhereOp | UNSET;
}

export interface JsonWhere {
  [field: string]: ValueType | ValueType[] | JsonWhereOp | JsonWhere | JsonWhere[] | UNSET;
}

/*
function aaa(j:JsonWhere) {}

aaa({
  ddd: {
    $or: [
      { aaa: 1 }
    ],
    kkk: 1,
  },
  ccc : AB.SQL`aaa`,
});


const where: JsonWhere = {
  advertise: {
    status: 1,
    type_id: [1],
    start_time: { $lt: new Date() },
    end_time: { $gt: new Date() },
    deleted_at: null,
    $or: [
      { exactly_type: { $gt: 100 } },
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
