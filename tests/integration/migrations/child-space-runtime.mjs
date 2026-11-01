import { readFile } from 'node:fs/promises';
import { createThinkingGamesFixture, BASELINE_SCHEMA_SQL } from '../../../scripts/thinking-games-sql-fixture.mjs';

const fixture = await createThinkingGamesFixture({ schema: BASELINE_SCHEMA_SQL, label: 'child-space' });
const { identities: ids } = fixture;
const alpha = ids.sessions.childAlphaLive.tokenHash;
const beta = ids.sessions.childBetaLive.tokenHash;
const revoked = ids.sessions.childAlphaRevoked.tokenHash;
const check = (condition, message) => { if (!condition) throw new Error(message); };
const call = async (sql, params) => (await fixture.one(sql, params)).result;
const asUser = (userId) => fixture.exec(`select set_config('request.jwt.claim.sub','${userId}',false), set_config('request.jwt.claims', json_build_object('sub','${userId}','role','authenticated')::text, false)`);

try {
  const migration = await readFile('supabase/migrations/202611020001_child_space.sql', 'utf8');
  await fixture.exec(migration);
  await fixture.exec(migration); // replay is harmless
  const today = await fixture.scalar(`select current_date::text`);

  // A child records a mood, then changes it the same day: one row per day.
  let r = await call(`select public.save_child_space_mood($1, current_date, 'sad', 'friends') result`, [alpha]);
  check(r.status === 'saved', `mood save returned ${r.status}`);
  r = await call(`select public.save_child_space_mood($1, current_date, 'worried', null) result`, [alpha]);
  check(r.mood.mood === 'worried' && r.mood.reason === null, 'mood was not replaced');
  check(Number(await fixture.scalar(`select count(*) from public.child_space_moods where child_id=$1`, [ids.children.alpha])) === 1, 'more than one mood row per day');

  // Bad input and out-of-window dates are refused without writing.
  r = await call(`select public.save_child_space_mood($1, current_date, 'furious', null) result`, [alpha]);
  check(r.status === 'input_invalid', 'unknown mood accepted');
  r = await call(`select public.save_child_space_mood($1, current_date - 5, 'happy', null) result`, [alpha]);
  check(r.status === 'date_unavailable', 'old date accepted');
  r = await call(`select public.save_child_space_note($1, current_date, 'proud', repeat('a',141), false) result`, [alpha]);
  check(r.status === 'input_invalid', 'over-long note accepted');
  r = await call(`select public.save_child_space_note($1, current_date, 'secret', 'x', false) result`, [alpha]);
  check(r.status === 'input_invalid', 'unknown note kind accepted');

  // Sessions: a revoked device and a read-only token cannot write.
  r = await call(`select public.save_child_space_mood($1, current_date, 'happy', null) result`, [revoked]);
  check(r.status === 'session_invalid', 'revoked session could write');
  r = await call(`select public.save_child_space_mood($1, current_date, 'happy', null) result`, ['no-such-token']);
  check(r.status === 'session_invalid', 'unknown token could write');

  // Notes are private by default; only shared ones reach a parent.
  await call(`select public.save_child_space_note($1, current_date, 'learned', 'chia sẻ đồ chơi', false) result`, [alpha]);
  await call(`select public.save_child_space_note($1, current_date, 'grateful', 'mẹ nấu món ngon', true) result`, [alpha]);
  const own = await call(`select public.read_child_space($1) result`, [alpha]);
  check(own.notes.length === 2 && own.moods.length === 1, 'child cannot read back their own space');

  await asUser(ids.users.parentAlpha);
  const parent = await call(`select public.read_parent_child_space($1,$2) result`, [ids.families.alpha, ids.children.alpha]);
  check(parent.status === 'ready' && parent.moods.length === 1, 'manager cannot read the mood trend');
  check(parent.notes.length === 1 && parent.notes[0].kind === 'grateful', 'a private note reached the parent');

  // Another family sees nothing and the other family's child cannot be addressed.
  await asUser(ids.users.parentBeta);
  const outsider = await call(`select public.read_parent_child_space($1,$2) result`, [ids.families.alpha, ids.children.alpha]);
  check(outsider.status === 'session_invalid', 'outsider could read another family');
  const betaOwn = await call(`select public.read_child_space($1) result`, [beta]);
  check(betaOwn.moods.length === 0 && betaOwn.notes.length === 0, 'child of another family sees foreign data');

  // Deleting removes the note.
  await call(`select public.delete_child_space_note($1, current_date, 'grateful') result`, [alpha]);
  check(Number(await fixture.scalar(`select count(*) from public.child_space_notes where child_id=$1 and kind='grateful'`, [ids.children.alpha])) === 0, 'note not deleted');

  console.log(JSON.stringify({ verdict: 'PASS', evidence: 'real-postgresql', database: fixture.databaseName, today }));
} finally {
  await fixture.close();
}
