const assert = require('assert');
const { Builder, Where } = require('..');
const josnWhere = require('../lib/json_where');

describe('Builder', function() {
  it('jsonWhere', function() {
    const builder = new Builder();
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
    assert.deepStrictEqual(josnWhere(builder, test), [
      '`name` = ? AND `age` >= ? AND `bb` IS NULL AND `cc` IS NOT NULL AND `dd` IN (?, ?, ?) AND `ee` NOT IN (?, ?, ?) AND (`or1` = ? OR `or2` = ?) AND `date` BETWEEN ? AND ? AND `date2` NOT BETWEEN ? AND ?',
      ['test', 18, 4, 5, 6, 7, 8, 9, 1, 2, 1, 100, 1, 100]
    ]);

    assert.deepStrictEqual(josnWhere(builder, { name: 'yf', age: builder.raw('1') }), [
      '`name` = ? AND `age` = 1',
      ['yf']
    ]);

    assert.deepStrictEqual(josnWhere(builder, { name: 'yf', age: builder.func('NOW') }), [
      '`name` = ? AND `age` = NOW()',
      ['yf']
    ]);

    assert.deepStrictEqual(josnWhere(builder, {
      name: 'yf',
      age: {
        gt: 10,
        ne: 50,
      }
    }), [
      '`name` = ? AND `age` > ? AND `age` != ?',
      ['yf', 10, 50]
    ]);

    assert.deepStrictEqual(josnWhere(builder, {
      name: 'yf',
      age: {
        $or: {
          gt: 10,
          ne: 50,
        }
      }
    }), [
      '`name` = ? AND (`age` > ? OR `age` != ?)',
      ['yf', 10, 50]
    ]);

    assert.deepStrictEqual(josnWhere(builder, {
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
    }), [
      '`gender` = ? AND `age` BETWEEN ? AND ? AND `name` LIKE ? AND `status` > ? AND `status` != ? AND `status` != ? AND (`more` != ? OR `more` = ?) AND (`morein` != ? OR `morein` != ? OR `morein` > ?)',
      [ 1, 20, 80, '%Jackson%', 2, 5, 6, 1, 2, 1, 2, -10 ],
    ]);
  });

  it('Where', function() {
    const builder = new Builder();
    assert.deepStrictEqual(new Where(builder).eq('username', 'yf').gte('age', 18).build(), [
      '`username` = ? AND `age` >= ?',
      ['yf', 18]
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

  it('join', function() {
    const q = new Builder();
    q.select().from('user').join('profile', { 'user.id': q.q('profile.id') });

    assert.deepStrictEqual(q.build(), [
      'SELECT * FROM `user` INNER JOIN `profile` ON (`user`.`id` = `profile`.`id`)',
      [],
    ]);
  });

  it('join as', function() {
    const q = new Builder();
    q.select().from('user', 'u').join('profile', 'p', { 'u.id': q.q('p.id') });

    assert.deepStrictEqual(q.build(), [
      'SELECT * FROM `user` AS `u` INNER JOIN `profile` AS `p` ON (`u`.`id` = `p`.`id`)',
      [],
    ]);
  });

  it('join left', function() {
    const q = new Builder();
    q.select().from('user', 'u').leftJoin('profile', 'p', { 'u.id': q.q('p.id') });

    assert.deepStrictEqual(q.build(), [
      'SELECT * FROM `user` AS `u` LEFT JOIN `profile` AS `p` ON (`u`.`id` = `p`.`id`)',
      [],
    ]);
  });

  it('select("a.", "b.*", "c.d")', function() {
    const q = new Builder();
    q.select("a.", "b.*", 'c.d');
    assert.deepStrictEqual(q.build(), [
      'SELECT `a`.*, `b`.*, `c`.`d`',
      [],
    ]);
  });
});
