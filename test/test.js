const assert = require('assert');
const { Builder, Where, Raw, AB } = require('../dist/index');
const { jsonWhere } = require('../dist/json_where');

function raw(s) { return new Raw(s); }

describe('Builder', function() {
  it('jsonWhere', function() {
    const builder = new Builder();
    const test = {
      f1: 'f1',
      f2: { $gt: 'f2-gt', $lt: 'f2-lt', $in: ['f2-in-1', 'f2-in-2'], $eq: raw('f2-raw') },
      f3: ['f3-1', 'f3-2'],
      f4: ['f4'],
      f6: raw('f6'),
      f7: { $between: ['f7-1', 'f7-2'] },
      $or: { f8: 'f8', f9: 'f9' },
      f14: null,
      f15: { $or: { $eq: 'f15-1', $gt: 'f15-2', $or: { $eq: 16, $gt: 18 } } },
    };
    assert.deepStrictEqual(jsonWhere(builder, test), [
      '`f1` = ? AND `f2` > ? AND `f2` < ? AND `f2` IN (?, ?) AND `f2` = f2-raw AND `f3` IN (?, ?) AND `f4` IN (?) AND `f6` = f6 AND `f7` BETWEEN ? AND ? AND (`f8` = ? OR `f9` = ?) AND `f14` IS NULL AND ((`f15` = ?) OR (`f15` > ?) OR (((`f15` = ?) OR (`f15` > ?))))',
      ['f1', 'f2-gt', 'f2-lt', 'f2-in-1', 'f2-in-2', 'f3-1', 'f3-2', 'f4', 'f7-1', 'f7-2', 'f8', 'f9', 'f15-1', 'f15-2', 16, 18]
    ]);

    assert.deepStrictEqual(jsonWhere(builder, {
      f1: 'f1',
      $or: { f8: 'f8' }
    }), [
      '`f1` = ? AND (`f8` = ?)',
      ['f1', 'f8']
    ]);

    assert.deepStrictEqual(jsonWhere(builder, {
      f1: 'f1',
      $or: [
        { f8: 'f8' },
        { f9: 'f9', f10: 'f10', $or: { f12: 'f12', f13: 'f13' } },
      ]
    }), [
      '`f1` = ? AND ((`f8` = ?) OR (`f9` = ? AND `f10` = ? AND (`f12` = ? OR `f13` = ?)))',
      ['f1', 'f8', 'f9', 'f10', 'f12', 'f13']
    ]);

    const now = new Date();
    assert.deepStrictEqual(jsonWhere(builder, {
      f1: now,
    }), [
      '`f1` = ?',
      [now]
    ]);

    assert.deepStrictEqual(jsonWhere(builder, {
      f17: { f18: 'f17.f18', f19: { f20: { $gt: 'f20' } } }
    }), [
      '`f17`.`f18` = ? AND `f17`.`f19`.`f20` > ?',
      ['f17.f18', 'f20']
    ]);

    assert.deepStrictEqual(jsonWhere(builder, {
      f25: {
        f26: 'f26',
        $or: [
          { f27: 'f27', f28: 'f28' },
          { f29: 'f29', f30: 'f30' },
        ]
      }
    }), [
      '`f25`.`f26` = ? AND ((`f25`.`f27` = ? AND `f25`.`f28` = ?) OR (`f25`.`f29` = ? AND `f25`.`f30` = ?))',
      ['f26', 'f27', 'f28', 'f29', 'f30']
    ]);

    assert.deepStrictEqual(jsonWhere(builder, {
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
    }), [
      '((`f36` != ?) AND (`f36` != ?)) AND ((`f37`.`f38` = ?) AND (`f37`.`f39` = ?)) AND ((`f40`.`f41` != ?) AND (`f40`.`f41` != ?))',
      [1, 2, 38, 39, 1, 2]
    ]);

    assert.deepStrictEqual(jsonWhere(builder, {
      f1: { $in: [1] },
      f2: [2],
      f3: [3, 4, 5],
    }), [
      '`f1` IN (?) AND `f2` IN (?) AND `f3` IN (?, ?, ?)',
      [1,2,3,4,5]
    ]);
  });

  it('Where', function() {
    const builder = new Builder();
    assert.deepStrictEqual(new Where(builder).eq('username', 'yf').gte('age', 18).build(), [
      '`username` = ? AND `age` >= ?',
      ['yf', 18]
    ]);
  });

  it('where(invalidity)', function() {
    assert.deepStrictEqual(new Builder().where().build(), ['', []]);
    assert.deepStrictEqual(new Builder().where({}).build(), ['', []]);
    assert.deepStrictEqual(new Builder().where(null).build(), ['', []]);
    assert.deepStrictEqual(new Builder().where(new Where()).build(), ['', []]);
  });

  it('where(undefined)', function() {
    assert.throws(() => new Builder().where({ a: 1, b: undefined }).build(), Error, 'b value is undefined');
  });

  it('where($quote $raw)', function() {
    assert.deepStrictEqual(new Builder().where({
      // quote
      f31: { $quote: 'f31' },
      f32: { $gt: { $quote: 'f32' } },
      // raw
      f33: { $raw: 'f33' },
      f34: { $gt: { $raw: 'f34' } },
      // quote and raw
      f35: { $lt: { $raw: 'f35-r', $quote: 'f35-q' } },
    }).build(), ['WHERE `f31` = `f31` AND `f32` > `f32` AND `f33` = f33 AND `f34` > f34 AND `f35` < f35-r AND `f35` < `f35-q`', []]);
  });

  it('where(prep)', function() {
    assert.deepStrictEqual(new Builder().where({
      a: 1,
    }).where({
      b: 2,
    }, 'AND').build(), ['WHERE `a` = ? AND `b` = ?', [1, 2]]);
  });

  it('where(after)', function() {
    assert.deepStrictEqual(new Builder().where({
      a: 1,
    }).where({
      b: 2,
      c: 3,
    }, 'OR (', ')').build(), ['WHERE `a` = ? OR ( `b` = ? AND `c` = ? )', [1, 2, 3]]);
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

  it('select(AB)', function() {
    assert.deepStrictEqual(new Builder().select('*', AB.SQL`1+1 as {A}`).build(), [
      'SELECT *, 1+1 as `A`',
      [],
    ]);
    assert.deepStrictEqual(new Builder().select({ a: AB.SQL`1+1 as {A}`, b: '*' }).build(), [
      'SELECT 1+1 as `A` AS `a`, `b` AS *',
      [],
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
    q.select().from('user').join('profile', null, { 'user.id': q.q('profile.id') });

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

  it("select({ asName: Builder() })", function() {
    const q = new Builder();
    q.select({ asName: new Builder().SQL`TEST(${1})` });
    assert.deepStrictEqual(q.build(), [
      'SELECT TEST(?) AS `asName`',
      [1],
    ]);
  });

  it("select({ asName: Raw() })", function() {
    const q = new Builder();
    q.select({ asName: q.raw('1+1') });
    assert.deepStrictEqual(q.build(), [
      'SELECT 1+1 AS `asName`',
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

  it("group", function() {
    const q = new Builder();
    q.group('a', 'b');
    assert.deepStrictEqual(q.build(), [
      'GROUP BY `a`, `b`',
      [],
    ]);
  });

  it("having", function() {
    const q = new Builder();
    q.having();
    assert.deepStrictEqual(q.build(), [
      'HAVING',
      [],
    ]);
  });

  it("having(query)", function() {
    const q = new Builder();
    q.having({ a: 1, b: { $gt: 2 } });
    assert.deepStrictEqual(q.build(), [
      'HAVING `a` = ? AND `b` > ?',
      [1, 2],
    ]);
  });

  it("SQL`IN`", function() {
    const q = new Builder();
    q.SQL`A in (${[1,2,3]})`;
    assert.deepStrictEqual(q.build(), [
      'A in (?,?,?)',
      [1, 2, 3],
    ]);
  });

  it("update(AB)", function() {
    const q = new Builder();
    q.update('test', {
      a: AB.count('*'),
      b: AB.quote('c'),
      c: AB.incr('c'),
      d: AB.decr('d'),
      e: AB.SQL`100 + ${200}`,
    });
    assert.deepStrictEqual(q.build(), [
      'UPDATE `test` SET `a` = COUNT(*), `b` = `c`, `c` = `c` + ?, `d` = `d` - ?, `e` = 100 + ?',
      [1, 1, 200],
    ]);
  });

  it("select(AB)", function() {
    const q = new Builder();
    q.select(AB.count('*'), { s: AB.SQL`SUM({a} + {b})` });
    assert.deepStrictEqual(q.build(), [
      'SELECT COUNT(*), SUM(`a` + `b`) AS `s`',
      [],
    ]);
  });

  it("where(AB)", function() {
    const q = new Builder();
    q.where({ a: AB.SQL`{a} + {b} + ${111}`, b: AB.quote('c') });
    assert.deepStrictEqual(q.build(), [
      'WHERE `a` = `a` + `b` + ? AND `b` = `c`',
      [111],
    ]);
  });

  it("where({ $ne: null })", function() {
    const q = new Builder();
    q.where({ a: null, b: { $ne: null } });
    assert.deepStrictEqual(q.build(), [
      'WHERE `a` IS NULL AND `b` IS NOT NULL',
      [],
    ]);
  });

  it("where({ $eq: null })", function() {
    const q = new Builder();
    q.where({ a: { $eq: null } });
    assert.deepStrictEqual(q.build(), [
      'WHERE `a` IS NULL',
      [],
    ]);
  });

  it("where({ $EQ: null, $notIn: [1,2,3] })", function() {
    const q = new Builder();
    q.where({ a: { $EQ: null, $notIn: [1,2,3] } });
    assert.deepStrictEqual(q.build(), [
      'WHERE `a` IS NULL AND `a` NOT IN (?, ?, ?)',
      [1, 2, 3],
    ]);
  });

  it('insert(AB)', function() {
    const q = new Builder().insert('user', {
      name: 'xiaohong',
      age: AB.SQL`RAND(${100})`,
    });

    assert.deepStrictEqual(q.build(), [
      'INSERT INTO `user` ( `name`, `age` ) VALUES ( ?, RAND(?) )',
      ['xiaohong', 100],
    ]);
  });

  it('jsonWhere(AB, Raw)', function() {
    const q = new Builder().where({
      $and: [AB.SQL`AB`, new Raw('RAW')],
      $or: [AB.SQL`AB`, new Raw('RAW')],
    });
    assert.deepStrictEqual(q.build(), [
      'WHERE ((AB) AND (RAW)) AND ((AB) OR (RAW))',
      [],
    ]);
  });

  it('jsonWhere($or:[])', function() {
    const q = new Builder().where({
      $and: [],
      $or: [],
    });
    assert.deepStrictEqual(q.build(), [
      '',
      [],
    ]);
  });

  it('quote(AB)', function() {
    const q = new Builder().count(AB.SQL`DISTINCT {id}`);
    assert.deepStrictEqual(q.build(), [
      'SELECT COUNT(DISTINCT `id`)',
      [],
    ]);
  });
});
