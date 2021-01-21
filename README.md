# sql easy builder

## install
```
npm i sql-easy-builder
```

## example

```js
const { Builder } = require('sql-easy-builder');
new Builder().select().from('user').where({ id: 1 }).build();
```
```sql
SELECT * FROM `user` WHERE `id` = ?; -- [ 1 ]
```

## select

```js
select()
```
```sql
SELECT *
```
```js
select('id', 'name')
```
```sql
SELECT `id`, `name`
```
```js
select('id', { name: 'realname', age: 'AGE' })
```
```sql
SELECT `id`, `name` AS `realname`, `age` AS `AGE`
```
```js
select('user.age', { user: ['id', 'name'], profile: ['edu', 'work'] })
```
```sql
SELECT `user`.`age`, `user`.`id`, `user`.`name`, `profile`.`edu`, `profile`.`work`
```
```js
select('user.age', { user: ['id', 'name'], profile: { edu: 'p.edu', work: 'p.work' } })
```
```sql
SELECT `user`.`age`, `user`.`id`, `user`.`name`, `profile`.`edu` AS `p`.`edu`, `profile`.`work` AS `p`.`work`
```
```js
let b = new Builder();
b.select(b.func('MAX','id'))
```
```sql
SELECT MAX(`id`)
```
```js
b = new Builder();
b.select(b.func('MAX','id','max_id'))
```
```sql
SELECT MAX(`id`) AS `max_id`
```
```js
b = new Builder();
b.select(b.raw(`DISTINCT ${b.q('id')}`))
```
```sql
SELECT DISTINCT `id`
```

## from
```js
from('user')
```
```sql
FROM `user`
```
```js
from('user', 'u')
```
```sql
FROM `user` AS `u`
```

## update
```js
update('user', { name: 'yf', age: 30 })
```
```sql
UPDATE `user` SET `name` = ?, `age` = ? -- [ 'yf', 30 ]
```
```js
b = new Builder();
b.update('user', { name: 'yf', age: b.q('new_age') })
```
```sql
UPDATE `user` SET `name` = ?, `age` = `new_age` -- [ 'yf' ]
```
```js
b = new Builder();
b.update(['user', 'profile'], { 'user.name': 'yf', 'user.age': b.q('profile.age') })
```
```sql
UPDATE `user`, `profile` SET `user`.`name` = ?, `user`.`age` = `profile`.`age` -- [ 'yf' ]
```
```js
b = new Builder();
b.update('user', { updated_at: b.func('NOW') })
```
```sql
UPDATE `user` SET `updated_at` = NOW()
```

## insert
```js
insert('user', { name: 'yf', age: 30 })
```
```sql
INSERT INTO `user` ( `name`, `age` ) VALUES ( ?, ? ) -- [ 'yf', 30 ]
```
```js
b = new Builder();
b.insert('user', { name: 'yf', age: 30, created_at: b.func('NOW') })
```
```sql
INSERT INTO `user` ( `name`, `age`, `created_at` ) VALUES ( ?, ?, NOW() ) -- [ 'yf', 30 ]
```

## delete
```js
delete('user')
```
```sql
DELETE FROM `user`
```

## join
```js
b = new Builder();
b.join('user', { 'user.id': b.q('other.id') })
```
```sql
INNER JOIN `user` ON (`user`.`id` = `other`.`id`)
```
```js
b = new Builder();
b.join('user', { 'user.id': b.q('other.id'), 'user.status': 1 })
```
```sql
INNER JOIN `user` ON (`user`.`id` = `other`.`id` AND `user`.`status` = ?) -- [ 1 ]
```
```js
b = new Builder();
b.leftJoin('user', { 'user.id': b.q('other.id') })
```
```sql
LEFT JOIN `user` ON (`user`.`id` = `other`.`id`)
```
```js
b = new Builder();
b.rightJoin('user', { 'user.id': b.q('other.id') })
```
```sql
RIGHT JOIN `user` ON (`user`.`id` = `other`.`id`)
```
```js
b = new Builder();
b.join('user', 'u', { 'u.id': b.q('other.id') })
```
```sql
INNER JOIN `user` AS `u` ON (`u`.`id` = `other`.`id`)
```

## count
```js
count()
```
```sql
SELECT COUNT(*)
```
```js
count('id')
```
```sql
SELECT COUNT(`id`)
```
```js
count('id', 'user_count')
```
```sql
SELECT COUNT(`id`) AS `user_count`
```

## limit
```js
limit(100)
```
```sql
LIMIT ? -- [ 100 ]
```
```js
limit(100, 200)
```
```sql
LIMIT ? OFFSET ? -- [ 100, 200 ]
```

```js
one()
```
```sql
LIMIT ? -- [ 1 ]
```
```js
one(2)
```
```sql
LIMIT ? OFFSET ? -- [ 1, 2 ]
```
```js
isOne() // => true
```

## order
```js
order('id')
```
```sql
ORDER BY `id` ASC
```
```js
order('updated_at', 'id')
```
```sql
ORDER BY `updated_at` ASC, `id` ASC
```
```js
order('-updated_at', 'id')
```
```sql
ORDER BY `updated_at` DESC, `id` ASC
```

----------------------------------------------------------

## where operator
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
  in: 'IN',
  notin: 'NOT IN',
  like: 'LIKE',
  notlike: 'NOT LIKE',
  ilike: 'ILIKE',
  notilike: 'NOT ILIKE',
  regexp: '~',
  notregexp: '!~',
  iregexp: '~*',
  notiregexp: '!~*',
  between: 'BETWEEN',
  notbetween: 'NOT BETWEEN',
}
```

```js
select().from('user').where({
  gender: 1,
  age: { between: [20, 80] },
  name: { like: '%Jackson%' },
  status: {
    gt: 2,
    ne: [5, 6],
  },
  more: {
    $or: {
      ne: 1,
      eq: 2,
    }
  },
  morein: {
    $or: {
      ne: [1, 2],
      gt: -10,
    }
  }
})
```
```SQL
SELECT * FROM `user` WHERE `gender` = ? AND `age` BETWEEN ? AND ? AND `name` LIKE ? AND `status` > ? AND `status` != ? AND `status` != ? AND (`more` != ? OR `more` = ?) AND (`morein` != ? OR `morein` != ? OR `morein` > ?);
```
```json
[ 1, 20, 80, "%Jackson%", 2, 5, 6, 1, 2, 1, 2, -10 ]
```

## class where
```js
select().from('user').where(w => w.eq('gender', 1).between('age', 20, 80).or(w => w.ne('more', 1).eq('more', 2)))
```
