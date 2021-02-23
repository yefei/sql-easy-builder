# sql easy builder

## install
```
npm i sql-easy-builder
```

## example

```js
const { Builder, raw } = require('sql-easy-builder');
new Builder().select().from('user').where({ id: 1 }).build();
// SELECT * FROM `user` WHERE `id` = ?
// [ 1 ]
```

## select

```js
select()
// SELECT *
```
```js
select('id', 'name')
// SELECT `id`, `name`
```
```js
select('id', { name: 'realname', age: 'AGE' })
// SELECT `id`, `name` AS `realname`, `age` AS `AGE`
```
```js
select('user.age', { user: ['id', 'name'], profile: ['edu', 'work'] })
/*
SELECT
	`user`.`age`,
	`user`.`id`,
	`user`.`name`,
	`profile`.`edu`,
  `profile`.`work`
*/
```
```js
select('user.age', { user: ['id', 'name'], profile: { edu: 'p.edu', work: 'p.work' } })
/*
SELECT
	`user`.`age`,
	`user`.`id`,
	`user`.`name`,
	`profile`.`edu` AS `p`.`edu`,
  `profile`.`work` AS `p`.`work`
*/
```
```js
let b = new Builder();
b.select(b.func('MAX','id'))
// SELECT MAX(`id`)
```
```js
b = new Builder();
b.select(b.func('MAX','id','max_id'))
// SELECT MAX(`id`) AS `max_id`
```
```js
b = new Builder();
b.select(b.raw(`DISTINCT ${b.q('id')}`))
// SELECT DISTINCT `id`
```

## from
```js
from('user')
// FROM `user`
```
```js
from('user', 'u')
// FROM `user` AS `u`
```

## update
```js
update('user', { name: 'yf', age: 30 })
// UPDATE `user` SET `name` = ?, `age` = ?
// [ 'yf', 30 ]
```
```js
b = new Builder();
b.update('user', { name: 'yf', age: b.q('new_age') })
// UPDATE `user` SET `name` = ?, `age` = `new_age`
// [ 'yf' ]
```
```js
b = new Builder();
b.update(['user', 'profile'], { 'user.name': 'yf', 'user.age': b.q('profile.age') })
// UPDATE `user`, `profile` SET `user`.`name` = ?, `user`.`age` = `profile`.`age`
// [ 'yf' ]
```
```js
b = new Builder();
b.update('user', { updated_at: b.func('NOW') })
// UPDATE `user` SET `updated_at` = NOW()
```
```js
b = new Builder();
b.update('user', { balance: b.op('balance').op('+', 100) });
// UPDATE `user` SET `balance` = `balance` + ?
// [ 100 ]
```
```js
b = new Builder();
b.update('user', { balance: b.op('balance', '+', 100).op('*', b.op('balance', '%', 10)) });
// UPDATE `user` SET `balance` = `balance` + ? * ( `balance` % ? )
// [ 100, 10 ]
```

## insert
```js
insert('user', { name: 'yf', age: 30 })
// INSERT INTO `user` ( `name`, `age` ) VALUES ( ?, ? )
// [ 'yf', 30 ]
```
```js
b = new Builder();
b.insert('user', { name: 'yf', age: 30, created_at: b.func('NOW') })
// INSERT INTO `user` ( `name`, `age`, `created_at` ) VALUES ( ?, ?, NOW() )
// [ 'yf', 30 ]
```

## delete
```js
delete('user')
// DELETE FROM `user`
```

## join
```js
b = new Builder();
b.join('user', { 'user.id': b.q('other.id') })
// INNER JOIN `user` ON (`user`.`id` = `other`.`id`)
```
```js
b = new Builder();
b.join('user', { 'user.id': b.q('other.id'), 'user.status': 1 })
// INNER JOIN `user` ON (`user`.`id` = `other`.`id` AND `user`.`status` = ?)
// [ 1 ]
```
```js
b = new Builder();
b.leftJoin('user', { 'user.id': b.q('other.id') })
// LEFT JOIN `user` ON (`user`.`id` = `other`.`id`)
```
```js
b = new Builder();
b.rightJoin('user', { 'user.id': b.q('other.id') })
// RIGHT JOIN `user` ON (`user`.`id` = `other`.`id`)
```
```js
b = new Builder();
b.join('user', 'u', { 'u.id': b.q('other.id') })
// INNER JOIN `user` AS `u` ON (`u`.`id` = `other`.`id`)
```

## count
```js
count()
// SELECT COUNT(*)
```
```js
count('id')
// SELECT COUNT(`id`)
```
```js
count('id', 'user_count')
// SELECT COUNT(`id`) AS `user_count`
```

## limit
```js
limit(100)
// LIMIT ?
// [ 100 ]
```
```js
limit(100, 200)
// LIMIT ? OFFSET ?
// [ 100, 200 ]
```

```js
one()
// LIMIT ?
// [ 1 ]
```
```js
one(2)
// LIMIT ? OFFSET ?
// [ 1, 2 ]
```
```js
isOne() // => true
```

## order
```js
order('id')
// ORDER BY `id` ASC
```
```js
order('updated_at', 'id')
// ORDER BY `updated_at` ASC, `id` ASC
```
```js
order('-updated_at', 'id')
// ORDER BY `updated_at` DESC, `id` ASC
```

## template
```js
SQL`SELECT * FROM {user} WHERE {user.age} > ${100}`
// SELECT * FROM `user` WHERE `user`.`age` > ?
// [ 100 ]
```

----------------------------------------------------------

## json where

### operator:
```js
{
  eq: '=',
  ne: '!=',
  gte: '>=',
  gt: '>',
  lte: '<=',
  lt: '<',
  not: 'IS NOT',
  is: 'IS',
  like: 'LIKE',
  notlike: 'NOT LIKE',
  ilike: 'ILIKE',
  notilike: 'NOT ILIKE',
  regexp: 'REGEXP',
  notregexp: 'NOT REGEXP',
  in: 'IN', // $in: [1,2,3]
  notin: 'NOT IN', // $notin: [1,2,3]
  between: 'BETWEEN', // $between: [1,2]
  notbetween: 'NOT BETWEEN', // $notbetween: [1,2]
}
```

### demo:
js:
```js
select().from('user').where({
  f1: 'f1',
  f2: { $gt: 'f2-gt', $lt: 'f2-lt', $in: ['f2-in-1', 'f2-in-2'], $eq: raw('f2-raw') },
  f3: ['f3-1', 'f3-2'],
  f4: ['f4'],
  f5: [],
  f6: raw('f6'),
  f7: { $between: ['f7-1', 'f7-2'] },
  $or: { f8: 'f8', f9: 'f9' },
  // $or: { f8: 'f8' },
  // $or: [
  //   { f8: 'f8' },
  //   { f9: 'f9', f10: 'f10', $or: { f12: 'f12', f13: 'f13' } },
  // ],
  f14: null,
  f15: { $or: { $eq: 'f15-1', $gt: 'f15-2', $or: { $eq: 16, $gt: 18 } } },
  f16: new Date(),
  f17: { f18: 'f17.f18', f19: { f20: { $gt: 'f20' } } },
  f21: { $quote: 'f22', $raw: 'f21-raw' },
  f23: { $gt: { $quote: 'f24' } },
  $and: [
    { f36: { $ne: 1 } },
    { f36: { $ne: 2 } },
  ],
  f37: {
    $and: { f38: 38, f39: 39 },
  },
  f40: {
    $and: [
      { f41: { $ne: 1 } },
      { f41: { $ne: 2 } },
    ]
  },
})
```
sql:
```SQL
SELECT
	* 
FROM
	`user` 
WHERE
	`f1` = ?
  AND `f2` > ?
  AND `f2` < ?
  AND `f2` IN (?, ?)
  AND `f2` = f2-raw
  AND `f3` IN (?, ?)
  AND `f4` = ?
  AND `f6` = f6
  AND `f7` BETWEEN ? AND ?
  AND ( `f8` = ? OR `f9` = ? )
  AND `f14` IS NULL
  AND (
    `f15` = ?
    OR `f15` > ?
    OR (
      `f15` = ?
      OR `f15` > ?
    )
  )
  AND `f16` = ?
  AND `f17`.`f18` = ?
  AND `f17`.`f19`.`f20` > ?
  AND `f21` = `f22`
  AND `f21` = f21-raw
  AND `f23` > `f24`
  AND ( `f36` != ? AND `f36` != ? ) AND ( `f37`.`f38` = ? AND `f37`.`f39` = ? ) AND ( `f40`.`f41` != ? AND `f40`.`f41` != ? )
```
params:
```json
[
  "f1",
  "f2-gt",
  "f2-lt",
  "f2-in-1",
  "f2-in-2",
  "f3-1",
  "f3-2",
  "f4",
  "f7-1",
  "f7-2",
  "f8",
  "f9",
  "f15-1",
  "f15-2",
  16,
  18,
  "2021-01-29T05:29:09.629Z",
  "f17.f18",
  "f20",
  1, 2, 38, 39, 1, 2
]
```

## class where
```js
select().from('user').where(w => w
  .eq('gender', 1)
  .between('age', 20, 80)
  .or(w => w
    .ne('more', 1)
    .eq('more', 2)
  )
)
```
