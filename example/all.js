'use strict';

const { Builder } = require('../dist/index');

// demo

console.log(new Builder().select().from('user').where({ id: 1 }).build());

// select

console.log(new Builder().select().build());

console.log(new Builder().select('id', 'name').build());

console.log(new Builder().select('id', 'name').build());

console.log(new Builder().select('id', { name: 'realname', age: 'AGE' }).build());

console.log(new Builder().select('user.age', { user: ['id', 'name'], profile: ['edu', 'work'] }).build());

console.log(new Builder().select('user.age', { user: ['id', 'name'], profile: { edu: 'p.edu', work: 'p.work' } }).build());

let b = new Builder();
console.log(b.select(b.func('MAX','id')).build());

b = new Builder();
console.log(b.select(b.func('MAX','id','max_id')).build());

b = new Builder();
console.log(b.select(b.raw(`DISTINCT ${b.q('id')}`)).build());

// from

console.log(new Builder().from('user').build());

console.log(new Builder().from('user', 'u').build());

// update

console.log(new Builder().update('user', { name: 'yf', age: 30 }).build());

b = new Builder();
console.log(b.update('user', { name: 'yf', age: b.q('new_age') }).build());

b = new Builder();
console.log(b.update(['user', 'profile'], { 'user.name': 'yf', 'user.age': b.q('profile.age') }).build());

b = new Builder();
console.log(b.update('user', { updated_at: b.func('NOW') }).build());

b = new Builder();
console.log(b.update('user', { balance: b.op('balance').op('+', 100).op('/', b.op(b.raw(10), '+', 1)) }).build());

b = new Builder();
console.log(b.update('user', { balance: b.op('balance', '+', 100).op('*', b.op('balance', '%', 10)) }).build());

// insert

console.log(new Builder().insert('user', { name: 'yf', age: 30 }).build());

b = new Builder();
console.log(b.insert('user', { name: 'yf', age: 30, created_at: b.func('NOW') }).build());

// delete

console.log(new Builder().delete('user').build());

// join

b = new Builder();
console.log(b.join('user', { 'user.id': b.q('other.id') }).build());

b = new Builder();
console.log(b.join('user', { 'user.id': b.q('other.id'), 'user.status': 1 }).build());

b = new Builder();
console.log(b.leftJoin('user', { 'user.id': b.q('other.id') }).build());

b = new Builder();
console.log(b.rightJoin('user', { 'user.id': b.q('other.id') }).build());

b = new Builder();
console.log(b.join('user', 'u', { 'u.id': b.q('other.id') }).build());

// count

console.log(new Builder().count().build());

console.log(new Builder().count('id').build());

console.log(new Builder().count('id', 'user_count').build());

// limit

console.log(new Builder().limit(100).build());

console.log(new Builder().limit(100, 200).build());

console.log(new Builder().one().build());

console.log(new Builder().one(2).build());

// order

console.log(new Builder().order('id').build());

console.log(new Builder().order('updated_at', 'id').build());

console.log(new Builder().order('-updated_at', 'id').build());


// template

console.log(new Builder().SQL`SELECT * FROM {user} WHERE {user.age} > ${100}`.build());
