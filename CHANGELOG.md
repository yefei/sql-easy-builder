# Changelog

## [2.14.0] - 2023-8-23
- 新增: AB.distinctCount

## [2.13.0] - 2023-4-28
- 删除: class Where 此功能不太常用，没有 jsonWhere 方便，故此删除
- 更新: symbol UNSET 改为 class UNSET，修正 ts 检查问题
- 更新: 使用 typescript 重写 test

## [2.12.0] - 2023-4-23
- 更新: between 支持单个参数查询

## [2.11.0] - 2023-4-18
- 新增: JSON 查询新增 UNSET 类型，可以删除查询条件

## [2.10.0] - 2023-4-18
- 新增: PointType, AB.point, Buffer
- 更新: AttrBuilder 为抽象类
- 更新: BuildResult 为对象类型

## [2.9.0] - 2023-3-13
- fix: JsonWhere 不能设置 null 值问题
- update: 删除 JsonWhereParam 类型
- update: WhereType 增加 Where 类型

## 2.8.1
- update() 方法忽略值为 undefined 的

## 2.8.0
- null 检查
