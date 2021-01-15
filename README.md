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
