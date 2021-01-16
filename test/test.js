const assert = require('assert');
const Builder = require('..');

describe('Builder', function() {
  it('select where limit', function() {
    const q = new Builder()
      .select('p1', { p2: 'P2', p3: 'P3' });
    
    assert.deepStrictEqual(q.build(), [
      'SELECT `p1`, `p2` AS `P2`, `p3` AS `P3`',
      [],
    ]);

    q.from('t');
    
    assert.deepStrictEqual(q.build(), [
      'SELECT `p1`, `p2` AS `P2`, `p3` AS `P3` FROM `t`',
      [],
    ]);

    q.where({ a: 1, b: 'str' });

    assert.deepStrictEqual(q.build(), [
      'SELECT `p1`, `p2` AS `P2`, `p3` AS `P3` FROM `t` WHERE `a` = ? AND `b` = ?',
      [1, 'str'],
    ]);

    q.limit(100);

    assert.deepStrictEqual(q.build(), [
      'SELECT `p1`, `p2` AS `P2`, `p3` AS `P3` FROM `t` WHERE `a` = ? AND `b` = ? LIMIT ?',
      [1, 'str', 100],
    ]);

    q.limit(100, 200);

    assert.deepStrictEqual(q.build(), [
      'SELECT `p1`, `p2` AS `P2`, `p3` AS `P3` FROM `t` WHERE `a` = ? AND `b` = ? LIMIT ? OFFSET ?',
      [1, 'str', 100, 200],
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
});
