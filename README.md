# sql easy builder

## install
```
npm i sql-easy-builder
```

## example

```js
const Builder = require('sql-easy-builder');

function builder(callback) {
  const q = new Builder();
  callback(q);
  return q.build();
}
```

### select

```js
builder(q => q.select().from('user'));
```
sql:
```sql
SELECT * FROM `user`
```
params:
```json
[]
```

----------------------------------------------------------

```js
builder(q => q.select().from('user').where({ age: 18 }).limit(100));
```
sql:
```sql
SELECT * FROM `user` WHERE `age` = ? LIMIT ?
```
params:
```json
[18, 100]
```

### update

```js
builder(q => q.update('user', { age: 100 }).where({ age: 18 }));
```
sql:
```sql
UPDATE `user` SET `age` = ? WHERE `age` = ?
```
params:
```json
[100, 18]
```

### count

```js
builder(q => q.count().from('user').where({ age: 18 }));
```
sql:
```sql
SELECT COUNT(*) FROM `user` WHERE `age` = ?
```
params:
```json
[18]
```

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
