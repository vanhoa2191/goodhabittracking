import { readFile } from 'node:fs/promises';
import { createThinkingGamesFixture, BASELINE_SCHEMA_SQL } from '../../../scripts/thinking-games-sql-fixture.mjs';

const fixture = await createThinkingGamesFixture({ schema: BASELINE_SCHEMA_SQL, label: 'thinking-games-gameplay' });
const { identities: ids } = fixture;
const today = new Date().toISOString().slice(0, 10);
try {
  await fixture.exec(await readFile('supabase/migrations/202610210001_thinking_games.sql', 'utf8'));
  await fixture.exec(`
    create or replace function public.act_as_user(actor_user_id uuid)
    returns void language plpgsql security definer set search_path = '' as $$
    begin
      perform set_config('request.jwt.claim.sub', actor_user_id::text, true);
      perform set_config('request.jwt.claims', json_build_object('sub', actor_user_id, 'role', 'authenticated')::text, true);
    end $$;
  `);
  await fixture.query(`insert into public.thinking_game_settings(family_id,enabled,bonus_enabled,timezone)
    values ($1,true,false,'UTC')`, [ids.families.alpha]);
  const own = await fixture.one(
    `select public.thinking_game_parent_state_as($1,$2,$3) result`,
    [ids.users.parentAlpha, ids.children.alpha, today],
  );
  if (!own.result.ok || own.result.serverLocalDay !== today) throw new Error('parent own-child state failed');

  await fixture.query(`select public.act_as_user($1)`, [ids.users.parentAlpha]);
  let foreignDenied = false;
  try {
    await fixture.one(`select public.thinking_game_parent_state_as($1,$2,$3) result`,
      [ids.users.parentAlpha, ids.children.beta, today]);
  } catch (error) {
    foreignDenied = /child_not_found|family_manage_required/.test(String(error.message));
  }
  if (!foreignDenied) throw new Error('foreign-family parent state was not denied');

  const grants = await fixture.one(`select has_function_privilege('authenticated',
    'public.thinking_game_parent_start_as(uuid,uuid,text,date,uuid)','execute') allowed`);
  if (grants.allowed) throw new Error('parent gameplay RPC exposed to authenticated role');
  console.log(JSON.stringify({
    verdict: 'PASS',
    evidence: 'real-postgresql',
    cases: ['parent-own-child-state', 'foreign-family-denial', 'parent-rpc-acl'],
    database: fixture.databaseName,
  }));
} finally {
  await fixture.close();
}
