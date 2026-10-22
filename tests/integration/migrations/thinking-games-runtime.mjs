import { readFile } from 'node:fs/promises';
import { createThinkingGamesFixture, BASELINE_SCHEMA_SQL } from '../../../scripts/thinking-games-sql-fixture.mjs';

const migration = await readFile('supabase/migrations/202610210001_thinking_games.sql', 'utf8');
const preflight = await readFile('supabase/preflight/202610210001_thinking_games.verify.sql', 'utf8');
const rollback = await readFile('supabase/rollbacks/202610210001_thinking_games.rollback.sql', 'utf8');

const fixture = await createThinkingGamesFixture({
  schema: BASELINE_SCHEMA_SQL,
  label: 'thinking-games-runtime',
});
const { identities: ids } = fixture;
const activityId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const logId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

try {
  await fixture.exec(migration);
  await fixture.exec(preflight);

  // Regression: receipt persistence must happen after the parent log row exists.
  await fixture.query(
    `insert into public.habit_activities(id, family_id, child_id, title)
     values ($1, $2, $3, 'Runtime task')`,
    [activityId, ids.families.alpha, ids.children.alpha],
  );
  await fixture.query(
    `insert into public.activity_logs(
       id, family_id, child_id, activity_id, log_date, status, points_awarded
     ) values ($1, $2, $3, $4, current_date, 'completed', 0)`,
    [logId, ids.families.alpha, ids.children.alpha, activityId],
  );
  const receipt = await fixture.one(
    `select log_id, child_id, family_id, received_at
       from public.thinking_game_habit_receipts where log_id = $1`,
    [logId],
  );
  if (!receipt?.received_at) throw new Error('receipt was not created after completion');

  await fixture.query(`update public.activity_logs set status = 'approved' where id = $1`, [logId]);
  const reviewed = await fixture.one(
    `select review_status, reviewed_at from public.thinking_game_habit_receipts where log_id = $1`,
    [logId],
  );
  if (reviewed.review_status !== 'approved' || !reviewed.reviewed_at) {
    throw new Error('receipt review state was not recorded');
  }

  await fixture.query(`delete from public.activity_logs where id = $1`, [logId]);
  const retained = await fixture.one(
    `select log_id, child_id, family_id from public.thinking_game_habit_receipts where log_id = $1`,
    [logId],
  );
  if (!retained || retained.child_id !== ids.children.alpha || retained.family_id !== ids.families.alpha) {
    throw new Error('game receipt audit identity was not retained after legacy undo/delete');
  }

  const enabledActivityId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const enabledLogId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  await fixture.query(
    `insert into public.thinking_game_settings(family_id, enabled, timezone)
     values ($1, true, 'Asia/Ho_Chi_Minh')`,
    [ids.families.alpha],
  );
  await fixture.query(
    `insert into public.habit_activities(id, family_id, child_id, title)
     values ($1, $2, $3, 'Enabled task')`,
    [enabledActivityId, ids.families.alpha, ids.children.alpha],
  );
  await fixture.query(
    `insert into public.activity_logs(
       id, family_id, child_id, activity_id, log_date, status, points_awarded
     ) values ($1, $2, $3, $4, current_date, 'completed', 0)`,
    [enabledLogId, ids.families.alpha, ids.children.alpha, enabledActivityId],
  );
  const enabledReceipt = await fixture.one(
    `select received_at from public.thinking_game_habit_receipts where log_id = $1`,
    [enabledLogId],
  );
  if (!enabledReceipt?.received_at) throw new Error('enabled feature completion broke receipt write');

  await fixture.exec(rollback);
  const remaining = await fixture.scalar(
    `select count(*)::int from pg_class where relnamespace = 'public'::regnamespace
      and relname = 'thinking_game_habit_receipts'`,
  );
  if (remaining !== 0) throw new Error('rollback left thinking game tables behind');
  console.log(JSON.stringify({
    verdict: 'PASS',
    evidence: 'real-postgresql',
    cases: [
      'feature-off-completion',
      'receipt-after-insert',
      'review-receipt',
      'receipt-retained-after-delete',
      'feature-enabled-completion',
      'rollback',
    ],
    database: fixture.databaseName,
  }));
} finally {
  await fixture.close();
}
