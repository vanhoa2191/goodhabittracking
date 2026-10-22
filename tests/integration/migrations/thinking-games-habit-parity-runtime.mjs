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

  await fixture.resetAuthContext();
  const childComplete = await fixture.one(
    `select public.complete_child_habit_command($1,$2,$3,$4) result`,
    [ids.sessions.childAlphaLive.tokenHash, plain, today, plainLog],
  );
  if (childComplete.result.status !== 'completed' || childComplete.result.pointsAwarded !== 11) throw new Error('child completion parity');
  await fixture.query(`update public.child_profiles set points=0 where id=$1`, [ids.children.alpha]);
  const spent = await fixture.one(
    `select public.undo_child_habit_command($1,$2) result`,
    [ids.sessions.childAlphaLive.tokenHash, plainLog],
  );
  if (spent.result.status !== 'points_already_spent') throw new Error('child spent-points guard parity');

  console.log(JSON.stringify({
    verdict: 'PASS',
    evidence: 'real-postgresql',
    cases: ['parent-old-date-guard', 'batch-review-response', 'child-completion-points', 'child-undo-points-guard'],
    database: fixture.databaseName,
  }));
} finally {
  await fixture.close();
}
