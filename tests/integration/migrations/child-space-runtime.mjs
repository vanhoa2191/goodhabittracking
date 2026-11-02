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
  const phase2 = await readFile('supabase/migrations/202611030001_child_space_phase2.sql', 'utf8');
  await fixture.exec(phase2);
  await fixture.exec(phase2);
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

  // ---- Phase 2: weekly goal ----
  await fixture.exec(`select set_config('request.jwt.claim.sub','',false), set_config('request.jwt.claims','',false)`);
  const monday = await fixture.scalar(`select date_trunc('week', current_date)::date::text`);
  const lastMonday = await fixture.scalar(`select (date_trunc('week', current_date)::date - 7)::text`);
  const nextMonday = await fixture.scalar(`select (date_trunc('week', current_date)::date + 7)::text`);
  r = await call(`select public.save_child_space_goal($1, $2::date, 'Tự dọn đồ chơi') result`, [alpha, monday]);
  check(r.status === 'saved' && r.goal.status === 'open', `goal save returned ${r.status}`);
  r = await call(`select public.save_child_space_goal($1, $2::date, 'Đọc sách mỗi ngày') result`, [alpha, monday]);
  check(r.goal.goal_text === 'Đọc sách mỗi ngày', 'goal was not replaced');
  check(Number(await fixture.scalar(`select count(*) from public.child_space_weekly_goals where child_id=$1`, [ids.children.alpha])) === 1, 'more than one goal per week');
  r = await call(`select public.save_child_space_goal($1, $2::date, 'x') result`, [alpha, nextMonday]);
  check(r.status === 'date_unavailable', 'goal for a future week accepted');
  r = await call(`select public.save_child_space_goal($1, ($2::date + 1), 'x') result`, [alpha, monday]);
  check(r.status === 'date_unavailable', 'non-Monday week start accepted');
  r = await call(`select public.save_child_space_goal($1, $2::date, repeat('a',61)) result`, [alpha, monday]);
  check(r.status === 'input_invalid', 'over-long goal accepted');
  r = await call(`select public.save_child_space_goal($1, $2::date, 'x') result`, [revoked, monday]);
  check(r.status === 'session_invalid', 'revoked session could set a goal');
  r = await call(`select public.mark_child_space_goal($1, $2::date, 'done') result`, [alpha, monday]);
  check(r.status === 'saved' && r.goal.status === 'done', 'goal could not be marked done');
  r = await call(`select public.mark_child_space_goal($1, $2::date, 'nonsense') result`, [alpha, monday]);
  check(r.status === 'input_invalid', 'unknown goal status accepted');
  r = await call(`select public.mark_child_space_goal($1, $2::date, 'done') result`, [alpha, lastMonday]);
  check(r.status === 'not_found', 'marking a missing goal did not report not_found');
  r = await call(`select public.mark_child_space_goal($1, ($2::date - 7), 'done') result`, [alpha, lastMonday]);
  check(r.status === 'date_unavailable', 'a goal two weeks old could be marked');
  r = await call(`select public.mark_child_space_goal($1, $2::date, 'not_yet') result`, [beta, monday]);
  check(r.status === 'not_found', 'another family child marked a foreign goal');

  // ---- Phase 2: letters ----
  r = await call(`select public.send_child_space_letter($1, current_date, 'Ba mẹ ơi' || chr(10) || 'con yêu ba mẹ') result`, [alpha]);
  check(r.status === 'saved' && r.letter.read_at === null, `letter send returned ${r.status}`);
  const letterId = r.letter.id;
  r = await call(`select public.send_child_space_letter($1, current_date, repeat('a',301)) result`, [alpha]);
  check(r.status === 'input_invalid', 'over-long letter accepted');
  r = await call(`select public.send_child_space_letter($1, current_date, 'x') result`, [revoked]);
  check(r.status === 'session_invalid', 'revoked session could send a letter');
  for (let i = 0; i < 4; i += 1) await call(`select public.send_child_space_letter($1, current_date, 'thư ' || $2::text) result`, [alpha, String(i)]);
  r = await call(`select public.send_child_space_letter($1, current_date, 'thư thứ sáu') result`, [alpha]);
  check(r.status === 'limit_reached', 'letter limit was not enforced');

  const ownAfter = await call(`select public.read_child_space($1) result`, [alpha]);
  check(ownAfter.goals.length === 1 && ownAfter.goals[0].status === 'done', 'child cannot read back the goal');
  check(ownAfter.letters.length === 5 && ownAfter.letters.every((l) => l.read === false && l.parent_heart === false), 'child letter state is wrong');
  check(ownAfter.moods.length === 1, 'phase 1 mood read regressed');
  const betaAfter = await call(`select public.read_child_space($1) result`, [beta]);
  check(betaAfter.goals.length === 0 && betaAfter.letters.length === 0, 'child of another family sees foreign goals or letters');

  // Parents see letters, never the goal; an outsider sees and can do nothing.
  await asUser(ids.users.parentAlpha);
  const parent2 = await call(`select public.read_parent_child_space($1,$2) result`, [ids.families.alpha, ids.children.alpha]);
  check(parent2.letters.length === 5, 'manager cannot read the letters');
  check(!('goals' in parent2), 'weekly goals leaked to the parent read');
  check(parent2.notes.length === 0, 'a private note reached the parent after phase 2');
  r = await call(`select public.respond_child_space_letter($1,$2,true) result`, [ids.families.alpha, letterId]);
  check(r.status === 'saved' && r.letter.parent_heart === true && r.letter.read_at !== null, 'heart did not mark the letter read');
  r = await call(`select public.respond_child_space_letter($1,$2,null) result`, [ids.families.alpha, letterId]);
  check(r.letter.parent_heart === true, 'marking read cleared the heart');
  r = await call(`select public.respond_child_space_letter($1,$2,false) result`, [ids.families.alpha, letterId]);
  check(r.letter.parent_heart === false, 'heart could not be taken back');
  await call(`select public.respond_child_space_letter($1,$2,true) result`, [ids.families.alpha, letterId]);

  await asUser(ids.users.parentBeta);
  r = await call(`select public.respond_child_space_letter($1,$2,true) result`, [ids.families.alpha, letterId]);
  check(r.status === 'session_invalid', 'outsider answered another family letter');
  r = await call(`select public.respond_child_space_letter($1,$2,true) result`, [ids.families.beta, letterId]);
  check(r.status === 'not_found', 'a manager reached a letter through the wrong family');
  const heartState = await fixture.scalar(`select parent_heart::text from public.child_space_letters where id=$1`, [letterId]);
  check(heartState === 'true', 'outsider changed the heart');

  const seen = await call(`select public.read_child_space($1) result`, [alpha]);
  const sent = seen.letters.find((l) => l.id === letterId);
  check(sent.read === true && sent.parent_heart === true, 'child cannot see that the letter was read and hearted');

  // Rolling phase 2 back restores the phase-1 reads; applying it again works.
  await fixture.exec(await readFile('supabase/rollbacks/202611030001_child_space_phase2.rollback.sql', 'utf8'));
  check(await fixture.scalar(`select to_regclass('public.child_space_letters') is null`) === true
    || (await fixture.scalar(`select to_regclass('public.child_space_letters') is null`)) === 't', 'rollback left the letters table');
  const phase1Read = await call(`select public.read_child_space($1) result`, [alpha]);
  check(phase1Read.status === 'ready' && !('goals' in phase1Read) && phase1Read.moods.length === 1, 'rollback did not restore the phase-1 read');
  await fixture.exec(phase2);

  console.log(JSON.stringify({ verdict: 'PASS', evidence: 'real-postgresql', database: fixture.databaseName, today }));
} finally {
  await fixture.close();
}
