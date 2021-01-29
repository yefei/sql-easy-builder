const assert = require('assert');
const { Builder, Where, raw } = require('..');
const josnWhere = require('../lib/json_where');

describe('Builder', function() {
  it('jsonWhere', function() {
    const builder = new Builder();
    const test = {
      f1: 'f1',
      f2: { $gt: 'f2-gt', $lt: 'f2-lt', $in: ['f2-in-1', 'f2-in-2'], $eq: raw('f2-raw') },
      f3: ['f3-1', 'f3-2'],
      f4: ['f4'],
      f5: [],
      f6: raw('f6'),
      f7: { $between: ['f7-1', 'f7-2'] },
      $or: { f8: 'f8', f9: 'f9' },
      f14: null,
      f15: { $or: { $eq: 'f15-1', $gt: 'f15-2', $or: { $eq: 16, $gt: 18 } } },
    };
    assert.deepStrictEqual(josnWhere(builder, test), [
      '`f1` = ? AND `f2` > ? AND `f2` < ? AND `f2` IN (?, ?) AND `f2` = f2-raw AND `f3` IN (?, ?) AND `f4` = ? AND `f6` = f6 AND `f7` BETWEEN ? AND ? AND ( `f8` = ? OR `f9` = ? ) AND `f14` IS NULL AND ( `f15` = ? OR `f15` > ? OR ( `f15` = ? OR `f15` > ? ) )',
      ['f1', 'f2-gt', 'f2-lt', 'f2-in-1', 'f2-in-2', 'f3-1', 'f3-2', 'f4', 'f7-1', 'f7-2', 'f8', 'f9', 'f15-1', 'f15-2', 16, 18]
    ]);

    assert.deepStrictEqual(josnWhere(builder, {
      f1: 'f1',
      $or: { f8: 'f8' }
    }), [
      '`f1` = ? AND `f8` = ?',
      ['f1', 'f8']
    ]);

    assert.deepStrictEqual(josnWhere(builder, {
      f1: 'f1',
      $or: [
        { f8: 'f8' },
        { f9: 'f9', f10: 'f10', $or: { f12: 'f12', f13: 'f13' } },
      ]
    }), [
      '`f1` = ? AND ( `f8` = ? OR ( `f9` = ? AND `f10` = ? AND ( `f12` = ? OR `f13` = ? ) ) )',
      ['f1', 'f8', 'f9', 'f10', 'f12', 'f13']
    ]);

    const now = new Date();
    assert.deepStrictEqual(josnWhere(builder, {
      f1: now,
    }), [
      '`f1` = ?',
      [now]
    ]);

    assert.deepStrictEqual(josnWhere(builder, {
      f17: { f18: 'f17.f18', f19: { f20: { $gt: 'f20' } } }
    }), [
      '`f17`.`f18` = ? AND `f17`.`f19`.`f20` > ?',
      ['f17.f18', 'f20']
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

  it("select({ user: ['id', 'name'], profile: ['edu', 'work'] })", function() {
    const q = new Builder();
    q.select({ user: ['id', 'name'], profile: ['edu', 'work'] });
    assert.deepStrictEqual(q.build(), [
      'SELECT `user`.`id`, `user`.`name`, `profile`.`edu`, `profile`.`work`',
      [],
    ]);
  });

  it("select({ user: { id: 'userId', name: 'user.Name' } })", function() {
    const q = new Builder();
    q.select({ user: { id: 'userId', name: 'user.Name' } });
    assert.deepStrictEqual(q.build(), [
      'SELECT `user`.`id` AS `userId`, `user`.`name` AS `user`.`Name`',
      [],
    ]);
  });

  it("op", function() {
    const q = new Builder();
    q.update('t', {
      a: q.op('a').op('+', 1),
      b: q.op('b', '+', 2),
    });
    assert.deepStrictEqual(q.build(), [
      'UPDATE `t` SET `a` = `a` + ?, `b` = `b` + ?',
      [1, 2],
    ]);
  });
});
