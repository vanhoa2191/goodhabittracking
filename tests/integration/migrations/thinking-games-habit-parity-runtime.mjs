import { readFile } from 'node:fs/promises';
import { createThinkingGamesFixture, BASELINE_SCHEMA_SQL } from '../../../scripts/thinking-games-sql-fixture.mjs';

const fixture = await createThinkingGamesFixture({ schema: BASELINE_SCHEMA_SQL, label: 'thinking-games-habit-parity' });
const { identities: ids } = fixture;
const plain = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01';
const approval = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02';
const plainLog = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1';
const approvalLog = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2';
const today = new Date().toISOString().slice(0, 10);
const oldDay = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);
const childLog1 = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1';
const parentLog1 = 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1';
const parentLog2 = 'dddddddd-dddd-4ddd-8ddd-ddddddddddd2';
const parentLog3 = 'dddddddd-dddd-4ddd-8ddd-ddddddddddd3';
const parentLog4 = 'dddddddd-dddd-4ddd-8ddd-ddddddddddd4';
const undoLog = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1';
const completedLog = 'ffffffff-ffff-4fff-8fff-fffffffffff1';
// Use different dates to avoid unique constraint conflicts
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const dayAfter = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);

try {
  await fixture.exec(await readFile('supabase/migrations/202610210001_thinking_games.sql', 'utf8'));
  await fixture.exec(`
    alter table public.child_profiles add column if not exists total_earned integer not null default 0;
    alter table public.child_profiles add column if not exists level integer not null default 1;
    alter table public.activity_logs add column if not exists user_id uuid;
    create or replace function public.recompute_child_streak(target_child_id uuid)
    returns void language sql security definer set search_path = '' as $$ select null::void $$;
    create or replace function public.act_as_user(actor_user_id uuid)
    returns void language plpgsql security definer set search_path = '' as $$
    begin
      perform set_config('request.jwt.claim.sub', actor_user_id::text, true);
      perform set_config('request.jwt.claims', json_build_object('sub', actor_user_id, 'role', 'authenticated')::text, true);
    end $$;
  `);
  await fixture.query(
    `insert into public.habit_activities(id,family_id,child_id,title,points,requires_approval,created_at)
       values ($1,$2,$3,'Parity plain',11,false,now()),($4,$2,$3,'Parity approval',13,true,now())`,
    [plain, ids.families.alpha, ids.children.alpha, approval],
  );

  await fixture.applyAuthContext({ role: 'authenticated', claims: { sub: ids.users.parentAlpha, role: 'authenticated' } });
  const rejectedOldDate = await fixture.query(
    `select public.complete_habit_command($1,$2,$3,$4) result`,
    [plain, ids.children.alpha, oldDay, plainLog],
  ).catch(() => null);
  if (rejectedOldDate) throw new Error('parent old-date guard unexpectedly accepted');

  const pending = await fixture.one(
    `select public.complete_habit_command($1,$2,$3,$4) result`,
    [approval, ids.children.alpha, today, approvalLog],
  );
  if (pending.result.status !== 'pending_approval' || pending.result.pointsAwarded !== 0) throw new Error('approval completion parity');
  const batch = await fixture.one(`select public.review_habits_command($1,'approve') result`, [[approvalLog]]);
  const batchItem = batch.result.results?.[0];
  if (batchItem?.status !== 'approved' || batchItem.logId !== approvalLog || batchItem.pointsAwarded !== 13) {
    throw new Error('batch review response parity');
  }

  // --- Regression: parent completion stores user_id = auth.uid() ---
  const parentLogCheck = await fixture.one(
    `select user_id from public.activity_logs where id = $1`,
    [approvalLog]
  );
  if (parentLogCheck.user_id !== ids.users.parentAlpha) {
    throw new Error(`parent completion user_id mismatch: expected ${ids.users.parentAlpha}, got ${parentLogCheck.user_id}`);
  }

  // --- Regression: duplicate completion returns 'duplicate' status ---
  const duplicate = await fixture.one(
    `select public.complete_habit_command($1,$2,$3,$4) result`,
    [approval, ids.children.alpha, today, approvalLog]
  );
  if (duplicate.result.status !== 'duplicate') throw new Error('duplicate completion parity');

  // --- Regression: parent undo on pending_approval ---
  // Create a fresh pending_approval log for undo test (use different date to avoid unique constraint)
  await fixture.query(
    `insert into public.activity_logs(id,family_id,user_id,activity_id,child_id,log_date,status,points_awarded)
       values ($1,$2,$3,$4,$5,$6,'pending_approval',0)`,
    [undoLog, ids.families.alpha, ids.users.parentAlpha, approval, ids.children.alpha, tomorrow]
  );
  const parentUndone = await fixture.one(
    `select public.undo_habit_command($1) result`,
    [undoLog]
  );
  if (parentUndone.result.status !== 'undone') throw new Error('parent undo parity');
  const parentAfterUndo = await fixture.one(
    `select public.undo_habit_command($1) result`,
    [undoLog]
  );
  if (parentAfterUndo.result.status !== 'not_found') throw new Error('parent undo not_found parity');

  // --- Regression: parent undo on completed ---
  await fixture.query(
    `insert into public.activity_logs(id,family_id,user_id,activity_id,child_id,log_date,status,points_awarded)
       values ($1,$2,$3,$4,$5,$6,'completed',11)`,
    [completedLog, ids.families.alpha, ids.users.parentAlpha, plain, ids.children.alpha, dayAfter]
  );
  await fixture.query(`update public.child_profiles set points=11 where id=$1`, [ids.children.alpha]);
  const parentUndoneCompleted = await fixture.one(
    `select public.undo_habit_command($1) result`,
    [completedLog]
  );
  if (parentUndoneCompleted.result.status !== 'undone') throw new Error('parent undo completed parity');
  const parentAfterUndoCompleted = await fixture.one(
    `select public.undo_habit_command($1) result`,
    [completedLog]
  );
  if (parentAfterUndoCompleted.result.status !== 'not_found') throw new Error('parent undo completed not_found parity');

  await fixture.resetAuthContext();
  const childComplete = await fixture.one(
    `select public.complete_child_habit_command($1,$2,$3,$4) result`,
    [ids.sessions.childAlphaLive.tokenHash, plain, today, childLog1],
  );
  if (childComplete.result.status !== 'completed' || childComplete.result.pointsAwarded !== 11) throw new Error('child completion parity');

  // --- Regression: child completion stores user_id null ---
  const childLogCheck = await fixture.one(
    `select user_id from public.activity_logs where id = $1`,
    [childLog1]
  );
  if (childLogCheck.user_id !== null) {
    throw new Error(`child completion user_id should be null, got ${childLogCheck.user_id}`);
  }

  // --- Regression: child duplicate completion ---
  const childDuplicate = await fixture.one(
    `select public.complete_child_habit_command($1,$2,$3,$4) result`,
    [ids.sessions.childAlphaLive.tokenHash, plain, today, childLog1]
  );
  if (childDuplicate.result.status !== 'duplicate') throw new Error('child duplicate completion parity');

  // --- Regression: child undo points_already_spent ---
  await fixture.query(`update public.child_profiles set points=0 where id=$1`, [ids.children.alpha]);
  const spent = await fixture.one(
    `select public.undo_child_habit_command($1,$2) result`,
    [ids.sessions.childAlphaLive.tokenHash, childLog1],
  );
  if (spent.result.status !== 'points_already_spent') throw new Error('child spent-points guard parity');

  // --- Regression: child undo not_found after already undone ---
  // First restore points so undo can succeed
  await fixture.query(`update public.child_profiles set points=11 where id=$1`, [ids.children.alpha]);
  const childUndone = await fixture.one(
    `select public.undo_child_habit_command($1,$2) result`,
    [ids.sessions.childAlphaLive.tokenHash, childLog1],
  );
  if (childUndone.result.status !== 'undone') throw new Error('child undo parity');
  const childAfterUndo = await fixture.one(
    `select public.undo_child_habit_command($1,$2) result`,
    [ids.sessions.childAlphaLive.tokenHash, childLog1],
  );
  if (childAfterUndo.result.status !== 'not_found') throw new Error('child undo not_found parity');

  // --- Regression: review_habit_command approve/reject payload keys ---
  await fixture.applyAuthContext({ role: 'authenticated', claims: { sub: ids.users.parentAlpha, role: 'authenticated' } });
  // Create a new pending approval log for review test (different date)
  await fixture.query(
    `insert into public.activity_logs(id,family_id,user_id,activity_id,child_id,log_date,status,points_awarded)
       values ($1,$2,$3,$4,$5,$6,'pending_approval',0)`,
    [parentLog1, ids.families.alpha, ids.users.parentAlpha, approval, ids.children.alpha, tomorrow]
  );
  const approveResult = await fixture.one(
    `select public.review_habit_command($1,'approve') result`,
    [parentLog1]
  );
  if (approveResult.result.status !== 'approved' || typeof approveResult.result.pointsAwarded !== 'number') {
    throw new Error('review_habit_command approve payload parity');
  }

  await fixture.query(
    `insert into public.activity_logs(id,family_id,user_id,activity_id,child_id,log_date,status,points_awarded)
       values ($1,$2,$3,$4,$5,$6,'pending_approval',0)`,
    [parentLog2, ids.families.alpha, ids.users.parentAlpha, approval, ids.children.alpha, dayAfter]
  );
  const rejectResult = await fixture.one(
    `select public.review_habit_command($1,'reject') result`,
    [parentLog2]
  );
  if (rejectResult.result.status !== 'rejected' || rejectResult.result.pointsAwarded !== undefined) {
    throw new Error('review_habit_command reject payload parity');
  }

  // --- Regression: review_habits_command batch result shape ---
  await fixture.query(
    `insert into public.activity_logs(id,family_id,user_id,activity_id,child_id,log_date,status,points_awarded)
       values ($1,$2,$3,$4,$5,$6,'pending_approval',0),
              ($7,$2,$3,$4,$5,$8,'pending_approval',0)`,
    [parentLog3, ids.families.alpha, ids.users.parentAlpha, plain, ids.children.alpha, tomorrow, parentLog4, dayAfter]
  );
  const batchReview = await fixture.one(
    `select public.review_habits_command($1,'approve') result`,
    [[parentLog3, parentLog4]]
  );
  if (batchReview.result.status !== 'reviewed' || !Array.isArray(batchReview.result.results) || batchReview.result.results.length !== 2) {
    throw new Error('review_habits_command batch shape parity');
  }
  for (const item of batchReview.result.results) {
    if (!item.logId || !item.status || (item.status === 'approved' && typeof item.pointsAwarded !== 'number')) {
      throw new Error('review_habits_command batch item shape parity');
    }
  }

  console.log(JSON.stringify({
    verdict: 'PASS',
    evidence: 'real-postgresql',
    cases: [
      'parent-old-date-guard',
      'batch-review-response',
      'child-completion-points',
      'child-undo-points-guard',
      'parent-completion-user_id',
      'child-completion-user_id-null',
      'duplicate-completion',
      'parent-undo-not_found',
      'child-undo-not_found',
      'review-approve-payload',
      'review-reject-payload',
      'batch-review-shape'
    ],
    database: fixture.databaseName,
  }));
} finally {
  await fixture.close();
}
