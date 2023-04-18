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

  /** MATCH(field) AGAINST(value mode) */
  $match?: string | {
    expr: string,
    modifier?: string,
  },

  // f15: { $or: { $eq: 'f15-1', $gt: 'f15-2', $or: { $eq: 16, $gt: 18 } } },
  $or?: JsonWhereOp;
  $and?: JsonWhereOp;
}

export interface JsonWhere {
  [field: string]: ValueType | ValueType[] | JsonWhereOp | JsonWhere | JsonWhere[];
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
