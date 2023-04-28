import { UNSET as _UNSET } from './json_where';

export { Raw } from './raw';
export { AttrBuilder, AB } from './attr_builder';
export { Builder } from './builder';
export * from './types';

/**
 * 不使用
 * - 可以在 JSON 查询中赋值为 UNSET 删除查询条件
 * - 不使用 undefined 的目的是为了防止传入参数没有检查造成查询条件丢失问题
 */
export const UNSET = new _UNSET;
