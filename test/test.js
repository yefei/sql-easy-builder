const assert = require('assert');
const Builder = require('..');
const whereBuilder = require('../lib/where');

describe('Builder', function() {
  it('where', function() {
    const test = {
      name: 'test',
      age: { gte: 18 },
      bb: null,
      cc: { not: null },
      dd: [4,5,6],
      ee: { notin: [7,8,9] },
      $or: {
        or1: 1,
        or2: 2,
      },
      date: {
        between: [1, 100],
      },
      date2: {
        notbetween: [1, 100],
      }
    };
    assert.deepStrictEqual(whereBuilder(new Builder(), test), [
      '`name` = ? AND `age` >= ? AND `bb` IS NULL AND `cc` IS NOT NULL AND `dd` IN (?, ?, ?) AND `ee` NOT IN (?, ?, ?) AND (`or1` = ? OR `or2` = ?) AND `date` BETWEEN ? AND ? AND `date2` NOT BETWEEN (?, ?)',
      ['test', 18, 4, 5, 6, 7, 8, 9, 1, 2, 1, 100, 1, 100]
    ]);
  });

  it('select', function() {
    const a = new Builder().select('p1', { p2: 'P2', p3: 'P3' });
    assert.deepStrictEqual(a.build(), [
      'SELECT `p1`, `p2` AS `P2`, `p3` AS `P3`',
      [],
    ]);
    a.from('t');
    assert.deepStrictEqual(a.build(), [
      'SELECT `p1`, `p2` AS `P2`, `p3` AS `P3` FROM `t`',
      [],
    ]);
    a.where({ a: 1, b: 'str' });
    assert.deepStrictEqual(a.build(), [
      'SELECT `p1`, `p2` AS `P2`, `p3` AS `P3` FROM `t` WHERE `a` = ? AND `b` = ?',
      [1, 'str'],
    ]);
    assert.deepStrictEqual(a.clone().limit(100).build(), [
      'SELECT `p1`, `p2` AS `P2`, `p3` AS `P3` FROM `t` WHERE `a` = ? AND `b` = ? LIMIT ?',
      [1, 'str', 100],
    ]);
    assert.deepStrictEqual(a.clone().limit(100, 200).build(), [
      'SELECT `p1`, `p2` AS `P2`, `p3` AS `P3` FROM `t` WHERE `a` = ? AND `b` = ? LIMIT ? OFFSET ?',
      [1, 'str', 100, 200],
    ]);
    assert.deepStrictEqual(a.clone().order('id').build(), [
      'SELECT `p1`, `p2` AS `P2`, `p3` AS `P3` FROM `t` WHERE `a` = ? AND `b` = ? ORDER BY `id` ASC',
      [1, 'str'],
    ]);
    assert.deepStrictEqual(a.clone().order('-t', 'id').build(), [
      'SELECT `p1`, `p2` AS `P2`, `p3` AS `P3` FROM `t` WHERE `a` = ? AND `b` = ? ORDER BY `t` DESC, `id` ASC',
      [1, 'str'],
    ]);
  });

  it('one', function() {
    assert.deepStrictEqual(new Builder().select().from('t').one().build(), [
      'SELECT * FROM `t` LIMIT ?',
      [1],
    ]);
  });

  it('count, count as', function() {
    assert.deepStrictEqual(new Builder().count().build(), [
      'SELECT COUNT(*)',
      [],
    ]);
    assert.deepStrictEqual(new Builder().count('id').build(), [
      'SELECT COUNT(`id`)',
      [],
    ]);
    assert.deepStrictEqual(new Builder().count('id', 'user_count').build(), [
      'SELECT COUNT(`id`) AS `user_count`',
      [],
    ]);
  });

  it('update', function() {
    const q = new Builder().update('user', {
      name: 'xiaohong',
      age: 18,
    });

    assert.deepStrictEqual(q.build(), [
      'UPDATE `user` SET `name` = ?, `age` = ?',
      ['xiaohong', 18],
    ]);

    q.where({ age: 20 });

    assert.deepStrictEqual(q.build(), [
      'UPDATE `user` SET `name` = ?, `age` = ? WHERE `age` = ?',
      ['xiaohong', 18, 20],
    ]);
  });

  it('insert', function() {
    const q = new Builder().insert('user', {
      name: 'xiaohong',
      age: 18,
    });

    assert.deepStrictEqual(q.build(), [
      'INSERT INTO `user` ( `name`, `age` ) VALUES ( ?, ? )',
      ['xiaohong', 18],
    ]);
  });
});
