import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createThinkingGamesFixture, BASELINE_SCHEMA_SQL } from '../../../scripts/thinking-games-sql-fixture.mjs';

const fixture = await createThinkingGamesFixture({ schema: BASELINE_SCHEMA_SQL, label: 'thinking-games-settings-read' });
const { identities: ids } = fixture;
const cases = [];

async function denied(sql, parameters = []) {
  await assert.rejects(fixture.query(sql, parameters), (error) => error.code === '42501');
}

try {
  await fixture.exec(await readFile('supabase/migrations/202610210001_thinking_games.sql', 'utf8'));
  await fixture.query(`insert into public.thinking_game_settings (family_id, enabled, timezone)
    values ($1, true, 'Asia/Ho_Chi_Minh'), ($2, false, 'UTC')`, [ids.families.alpha, ids.families.beta]);
  if (!process.argv.includes('--without-fix')) {
    const migration = await readFile('supabase/migrations/202610240001_thinking_games_settings_read.sql', 'utf8');
    await fixture.exec(migration);
    // Reapplying a narrow grant must remain safe.
    await fixture.exec(migration);
    await fixture.exec(await readFile('supabase/preflight/202610240001_thinking_games_settings_read.verify.sql', 'utf8'));
  }

  await fixture.applyAuthContext({ role: 'authenticated', claims: { sub: ids.users.parentAlpha, role: 'authenticated' } });
  const own = await fixture.rows('select family_id, enabled, timezone from public.thinking_game_settings where family_id=$1', [ids.families.alpha]);
  assert.deepEqual(own, [{ family_id: ids.families.alpha, enabled: true, timezone: 'Asia/Ho_Chi_Minh' }]);
  cases.push('authenticated-own-settings-readable');
  assert.deepEqual(await fixture.rows('select family_id from public.thinking_game_settings where family_id=$1', [ids.families.beta]), []);
  assert.deepEqual(await fixture.rows('select family_id from public.thinking_game_settings'), [{ family_id: ids.families.alpha }]);
  cases.push('foreign-family-settings-hidden');
  await denied('insert into public.thinking_game_settings (family_id) values ($1)', ['33333333-3333-4333-8333-333333333333']);
  await denied('update public.thinking_game_settings set enabled=false where family_id=$1', [ids.families.alpha]);
  await denied('delete from public.thinking_game_settings where family_id=$1', [ids.families.alpha]);
  cases.push('authenticated-direct-mutations-denied');
  await denied('select public_payload, grading_payload from public.thinking_game_content');
  await denied('select grading_payload from public.thinking_game_content');
  await denied('select public_payload from public.thinking_game_content');
  cases.push('authenticated-private-content-denied');

  await fixture.applyAuthContext({ role: 'authenticated', claims: { sub: ids.users.parentBeta, role: 'authenticated' } });
  assert.deepEqual(await fixture.rows('select family_id from public.thinking_game_settings'), [{ family_id: ids.families.beta }]);
  cases.push('second-family-sees-only-own-settings');

  await fixture.applyAuthContext({ role: 'anon', claims: { role: 'anon' } });
  await denied('select * from public.thinking_game_settings');
  await denied('select public_payload, grading_payload from public.thinking_game_content');
  await denied('select grading_payload from public.thinking_game_content');
  cases.push('anonymous-settings-and-private-content-denied');
  console.log(JSON.stringify({ verdict: 'PASS', evidence: 'real-postgresql', cases, database: fixture.databaseName }));
} finally {
  await fixture.close();
}
