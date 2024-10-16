import { UNSET as _UNSET } from './json_where.js';

export { Raw } from './raw.js';
export { AttrBuilder, AB } from './attr_builder.js';
export { Builder } from './builder.js';
export * from './types.js';

/**
 * 不使用
 * - 可以在 JSON 查询中赋值为 UNSET 删除查询条件
 * - 不使用 undefined 的目的是为了防止传入参数没有检查造成查询条件丢失问题
 */
export const UNSET = new _UNSET;
