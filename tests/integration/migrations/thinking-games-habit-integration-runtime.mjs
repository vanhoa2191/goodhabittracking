import { readFile } from 'node:fs/promises';
import { createThinkingGamesFixture, BASELINE_SCHEMA_SQL } from '../../../scripts/thinking-games-sql-fixture.mjs';

const fixture = await createThinkingGamesFixture({ schema: BASELINE_SCHEMA_SQL, label: 'thinking-games-habit-integration' });
const { identities: ids } = fixture;
const activityId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const approvalActivityId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const childLogId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const reviewLogId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const today = new Date().toISOString().slice(0, 10);

try {
  await fixture.exec(await readFile('supabase/migrations/202610210001_thinking_games.sql', 'utf8'));
  await fixture.exec(`
    alter table public.child_profiles add column if not exists total_earned integer not null default 0;
    alter table public.child_profiles add column if not exists level integer not null default 1;
    create or replace function public.recompute_child_streak(target_child_id uuid)
    returns void language sql security definer set search_path = '' as $$ select null::void $$;
    create or replace function public.act_as_user(actor_user_id uuid)
    returns void language plpgsql security definer set search_path = '' as $$
    begin
      perform set_config('request.jwt.claim.sub', actor_user_id::text, true);
      perform set_config('request.jwt.claims', json_build_object('sub', actor_user_id, 'role', 'authenticated')::text, true);
    end $$;
    create or replace function public.test_receipt(target_log_id uuid)
    returns table(received_at timestamptz, reviewed_at timestamptz, review_status text)
    language sql security definer set search_path = public as
    $$ select received_at, reviewed_at, review_status from public.thinking_game_habit_receipts where log_id = target_log_id $$;
  `);
  await fixture.query(`insert into public.habit_activities(id,family_id,child_id,title,points,requires_approval) values
    ($1,$2,$3,'Normal task',7,false),($4,$2,$3,'Approval task',9,true)`,
    [activityId, ids.families.alpha, ids.children.alpha, approvalActivityId]);

  await fixture.applyAuthContext({ role: 'authenticated', claims: { sub: ids.users.parentAlpha, role: 'authenticated' } });
  const complete = await fixture.one(
    `select public.complete_habit_command($1,$2,$3,$4) result`,
    [activityId, ids.children.alpha, today, childLogId],
  );
  if (complete.result.status !== 'completed' || complete.result.pointsAwarded !== 7) throw new Error('parent complete regression');
  const duplicate = await fixture.one(
    `select public.complete_habit_command($1,$2,$3,$4) result`,
    [activityId, ids.children.alpha, today, childLogId],
  );
  if (duplicate.result.status !== 'duplicate') throw new Error('idempotency regression');
  const undone = await fixture.one(`select public.undo_habit_command($1) result`, [childLogId]);
  if (undone.result.status !== 'undone') throw new Error('parent undo regression');

  await fixture.resetAuthContext();
  const childComplete = await fixture.one(
    `select public.complete_child_habit_command($1,$2,$3,$4) result`,
    [ids.sessions.childAlphaLive.tokenHash, activityId, today, childLogId],
  );
  if (childComplete.result.status !== 'completed') throw new Error('child complete regression');
  const childUndo = await fixture.one(
    `select public.undo_child_habit_command($1,$2) result`,
    [ids.sessions.childAlphaLive.tokenHash, childLogId],
  );
  if (childUndo.result.status !== 'undone') throw new Error('child undo regression');

  await fixture.applyAuthContext({ role: 'authenticated', claims: { sub: ids.users.parentAlpha, role: 'authenticated' } });
  const pending = await fixture.one(
    `select public.complete_habit_command($1,$2,$3,$4) result`,
    [approvalActivityId, ids.children.alpha, today, reviewLogId],
  );
  if (pending.result.status !== 'pending_approval') throw new Error('pending approval regression');
  await fixture.resetAuthContext(); // superuser/postgres can call _as wrappers
  const reviewed = await fixture.one(`select public.review_habit_command_as($1,$2,'approve') result`, [ids.users.parentAlpha, reviewLogId]);
  if (reviewed.result.status !== 'approved') throw new Error('single review regression');
  const receipt = await fixture.one(`select * from public.test_receipt($1)`, [reviewLogId]);
  if (!receipt.received_at || !receipt.reviewed_at || receipt.review_status !== 'approved') throw new Error('receipt review audit regression');

  const directAnonDenied = await fixture.query(`select has_function_privilege('anon','public.complete_habit_command(uuid,uuid,date,uuid)','execute') allowed`);
  if (directAnonDenied.rows[0].allowed) throw new Error('protected parent habit RPC is directly callable by anon');

  console.log(JSON.stringify({
    verdict: 'PASS',
    evidence: 'real-postgresql',
    cases: ['parent-complete-idempotency-undo', 'child-complete-undo', 'single-review-receipt', 'anon-acl'],
    database: fixture.databaseName,
  }));
} finally {
  await fixture.close();
}
