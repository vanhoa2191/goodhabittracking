#!/usr/bin/env node
// Smoke runner for the daily thinking-games SQL harness.
//
// SCOPE (read first)
//   This runner proves the HARNESS only: that the disposable PostgreSQL fixture
//   builds a real dynamic auth context (auth.uid / auth.role / auth.jwt /
//   current_family_id), that a non-superuser role is genuinely subject to RLS,
//   that a cross-tenant read and write are denied, that cleared claims cannot
//   reuse the previous tenant, and that the role is reset between cases.
//
//   It is NOT proof of any thinking-games policy. No thinking-games migration,
//   function, entitlement, snapshot or attempt exists in this repository yet, so
//   AC04 game policy proofs are NOT RUN. The fixture used here is an explicitly
//   labelled harness fixture, not the production schema.
//
// Usage
//   SQL_TEST_DATABASE_URL=postgresql://postgres:local-only@127.0.0.1:55432/postgres \
//     node tests/integration/migrations/thinking-games-harness-smoke.mjs
//
// Exit codes
//   0 = every case passed, 1 = at least one case failed, 2 = blocked (no usable DB).
import assert from 'node:assert/strict';
import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  THINKING_GAMES_IDENTITIES,
  buildClaims,
  createThinkingGamesFixture,
  databaseExists,
} from '../../../scripts/thinking-games-sql-fixture.mjs';

const EVIDENCE_DIR = process.env.THINKING_GAMES_HARNESS_EVIDENCE_DIR ?? '/tmp/goodhabit-games-sql-harness-evidence';
const COMMAND = 'node tests/integration/migrations/thinking-games-harness-smoke.mjs';
const STARTED_AT = new Date();

mkdirSync(EVIDENCE_DIR, { recursive: true });
const stamp = STARTED_AT.toISOString().replaceAll(':', '-').replaceAll('.', '-');
const evidencePath = join(EVIDENCE_DIR, `thinking-games-harness-smoke-${stamp}.log`);

// Synchronous append: process.exit() at the end of the run would otherwise
// truncate a buffered stream and lose the evidence file.
function emit(line = '') {
  console.log(line);
  appendFileSync(evidencePath, `${line}\n`);
}

function redactUrl(value) {
  if (!value) return '(unset)';
  try {
    const url = new URL(value);
    if (url.password) url.password = '***';
    return url.href;
  } catch {
    return '(unparseable)';
  }
}

function emitBanner() {
  emit('=== thinking-games SQL harness smoke ===');
  emit(`command: ${COMMAND}`);
  emit(`started: ${STARTED_AT.toISOString()}`);
  emit(`node: ${process.version}`);
  emit(`cwd: ${process.cwd()}`);
  emit(`sql-test-database-url: ${redactUrl(process.env.SQL_TEST_DATABASE_URL)}`);
  emit(`evidence: ${evidencePath}`);
  emit('');
  emit('--- SCOPE NOTICE ---------------------------------------------------');
  emit('This run proves the HARNESS (auth context + RLS fixture) against real');
  emit('PostgreSQL. It does NOT prove any thinking-games behaviour.');
  emit('No thinking-games migration, function, entitlement, snapshot or attempt');
  emit('exists in this repository yet.');
  emit('AC04 game policy proofs: NOT RUN.');
  emit('-------------------------------------------------------------------');
  emit('');
}

const { families, users, children, sessions } = THINKING_GAMES_IDENTITIES;
const claimsAlpha = buildClaims(users.parentAlpha, { email: 'parent-alpha@example.test' });
const claimsBeta = buildClaims(users.parentBeta, { email: 'parent-beta@example.test' });

const cases = [
  {
    id: 'H1',
    title: 'dynamic auth context follows the request claims (uid / role / jwt / current_family_id)',
    async run(fixture) {
      await fixture.applyAuthContext({ role: 'authenticated', claims: claimsAlpha });
      assert.equal(await fixture.scalar('select auth.uid()::text as value'), users.parentAlpha);
      assert.equal(await fixture.scalar('select auth.role() as value'), 'authenticated');
      assert.equal(await fixture.scalar(`select auth.jwt() ->> 'sub' as value`), users.parentAlpha);
      assert.equal(await fixture.scalar('select public.current_family_id()::text as value'), families.alpha);

      // Same session, different claims: the tenant must follow. A fixed
      // constant current_family_id() would fail this line.
      await fixture.applyAuthContext({ role: 'authenticated', claims: claimsBeta });
      assert.equal(await fixture.scalar('select auth.uid()::text as value'), users.parentBeta);
      assert.equal(await fixture.scalar('select auth.role() as value'), 'authenticated');
      assert.equal(await fixture.scalar('select public.current_family_id()::text as value'), families.beta);
      assert.notEqual(families.beta, families.alpha);

      // auth.role() is read from the JWT role claim, not from a constant.
      await fixture.applyAuthContext({
        role: 'authenticated',
        claims: buildClaims(users.parentAlpha, { role: 'service_role' }),
      });
      assert.equal(await fixture.scalar('select auth.role() as value'), 'service_role');
      assert.equal(await fixture.scalar('select current_user as value'), 'authenticated');
    },
  },
  {
    id: 'H2',
    title: 'the asserting role is a non-superuser that RLS actually restricts',
    async run(fixture) {
      await fixture.applyAuthContext({ role: 'authenticated', claims: claimsAlpha });
      const role = await fixture.one(
        `select r.rolsuper as superuser, r.rolbypassrls as bypassrls, r.rolcanlogin as canlogin
         from pg_roles r where r.rolname = current_user`,
      );
      assert.equal(role.superuser, false, 'asserting role must not be a superuser');
      assert.equal(role.bypassrls, false, 'asserting role must not bypass RLS');

      const relation = await fixture.one(
        `select c.relrowsecurity as rls, c.relforcerowsecurity as forced
         from pg_class c join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public' and c.relname = 'child_profiles'`,
      );
      assert.equal(relation.rls, true, 'RLS must be enabled on child_profiles');
      assert.equal(relation.forced, true, 'RLS must be forced on child_profiles');

      // Tenant-scoped visibility: only the alpha child is visible.
      const scoped = await fixture.rows('select id::text as id from public.child_profiles order by id');
      assert.deepEqual(scoped.map(row => row.id), [children.alpha]);

      // Positive control: the rows really exist. The same read as the login
      // role sees both tenants, so the restriction above is RLS and not an
      // empty table.
      await fixture.resetAuthContext();
      const unrestricted = await fixture.rows('select id::text as id from public.child_profiles order by id');
      assert.equal(unrestricted.length, 2);
      assert.deepEqual(unrestricted.map(row => row.id), [children.alpha, children.beta]);

      // The non-superuser role is still in force for the rest of the case.
      await fixture.applyAuthContext({ role: 'authenticated', claims: claimsAlpha });
      const again = await fixture.rows('select id::text as id from public.child_profiles order by id');
      assert.deepEqual(again.map(row => row.id), [children.alpha]);
    },
  },
  {
    id: 'H3',
    title: 'cross-tenant read is denied and cross-tenant write is rejected by RLS',
    async run(fixture) {
      await fixture.applyAuthContext({ role: 'authenticated', claims: claimsAlpha });

      const crossRead = await fixture.rows(
        'select id::text as id from public.child_profiles where family_id = $1',
        [families.beta],
      );
      assert.equal(crossRead.length, 0, 'alpha parent must not read beta children');

      // The alpha family has several members, but no membership of another
      // tenant may be visible. The assertion is on the set of distinct families
      // seen, not on the row count.
      const memberships = await fixture.rows('select family_id::text as id from public.family_memberships order by family_id');
      assert.ok(memberships.length > 0, 'the alpha parent must see its own family memberships');
      assert.deepEqual([...new Set(memberships.map(row => row.id))], [families.alpha]);

      const ownChild = 'cccccccc-0000-4000-8000-0000000000ff';
      const crossChild = 'cccccccc-0000-4000-8000-0000000000fe';

      let crossWriteError = null;
      try {
        await fixture.query(
          'insert into public.child_profiles (id, family_id, name) values ($1, $2, $3)',
          [crossChild, families.beta, 'Cross Tenant'],
        );
      } catch (error) {
        crossWriteError = error;
      }
      assert.ok(crossWriteError, 'cross-tenant insert was not rejected');
      assert.equal(crossWriteError.code, '42501', 'expected insufficient_privilege');
      assert.match(crossWriteError.message, /row-level security policy/i);

      // Positive control: the same role may write inside its own tenant. Without
      // this the rejection above could be a broken policy rather than an RLS
      // denial.
      await fixture.query(
        'insert into public.child_profiles (id, family_id, name) values ($1, $2, $3)',
        [ownChild, families.alpha, 'Own Tenant'],
      );
      const own = await fixture.rows('select id::text as id from public.child_profiles where id = $1', [ownChild]);
      assert.equal(own.length, 1);

      // The rejected write left nothing behind in the other tenant.
      const betaAfter = await fixture.rows(
        'select id::text as id from public.child_profiles where family_id = $1',
        [families.beta],
      );
      assert.equal(betaAfter.length, 0);

      await fixture.query('delete from public.child_profiles where id = $1', [ownChild]);
    },
  },
  {
    id: 'H4',
    title: 'cleared claims cannot reuse the previous tenant',
    async run(fixture) {
      await fixture.applyAuthContext({ role: 'authenticated', claims: claimsAlpha });
      const before = await fixture.rows('select id::text as id from public.child_profiles');
      assert.equal(before.length, 1, 'alpha parent should see exactly one child before clearing');

      await fixture.clearClaims();
      assert.equal(await fixture.scalar('select auth.uid()::text as value'), null);
      assert.equal(await fixture.scalar('select auth.role() as value'), null);
      assert.equal(await fixture.scalar('select auth.jwt() ->> \'sub\' as value'), null);
      assert.equal(await fixture.scalar('select public.current_family_id()::text as value'), null);

      const after = await fixture.rows('select id::text as id from public.child_profiles');
      assert.equal(after.length, 0, 'a claimless session must not see the previous tenant');

      // And it must not be able to write into the tenant it could read before.
      let writeError = null;
      try {
        await fixture.query(
          'insert into public.child_profiles (id, family_id, name) values ($1, $2, $3)',
          ['cccccccc-0000-4000-8000-0000000000fd', families.alpha, 'No Claims'],
        );
      } catch (error) {
        writeError = error;
      }
      assert.ok(writeError, 'claimless insert into the previous tenant was not rejected');
      assert.equal(writeError.code, '42501');
      assert.match(writeError.message, /row-level security policy/i);
    },
  },
  {
    id: 'H5',
    title: 'the role is reset between cases and the restriction is re-applied on demand',
    async run(fixture) {
      const identity = await fixture.one('select current_user as current_user, session_user as session_user');
      assert.equal(identity.current_user, identity.session_user, 'role was not reset before this case');
      assert.equal(identity.current_user, 'postgres');
      assert.equal(await fixture.scalar('select auth.uid()::text as value'), null, 'claims were not cleared before this case');

      const unrestricted = await fixture.rows('select id::text as id from public.child_profiles order by id');
      assert.equal(unrestricted.length, 2);

      await fixture.applyAuthContext({ role: 'authenticated', claims: claimsAlpha });
      const scoped = await fixture.rows('select id::text as id from public.child_profiles order by id');
      assert.deepEqual(scoped.map(row => row.id), [children.alpha]);
    },
  },
  {
    id: 'H6',
    title: 'child device session identities: a live session resolves, a revoked one does not',
    async run(fixture) {
      await fixture.applyAuthContext({ role: 'authenticated', claims: claimsAlpha });
      assert.equal(
        await fixture.scalar('select public.resolve_child_session($1)::text as value', [sessions.childAlphaLive.tokenHash]),
        children.alpha,
      );
      assert.equal(
        await fixture.scalar('select public.resolve_child_session($1)::text as value', [sessions.childAlphaRevoked.tokenHash]),
        null,
        'a revoked session must not resolve to a child',
      );
      assert.equal(
        await fixture.scalar('select public.resolve_child_session($1)::text as value', ['harness-token-unknown']),
        null,
      );
      // A session token is a bearer secret: it resolves to the child it is
      // bound to, never to a child of the calling tenant.
      assert.equal(
        await fixture.scalar('select public.resolve_child_session($1)::text as value', [sessions.childBetaLive.tokenHash]),
        children.beta,
      );

      // The session rows themselves stay tenant scoped under RLS.
      const alphaSessions = await fixture.rows('select id::text as id from public.device_sessions order by id');
      assert.deepEqual(alphaSessions.map(row => row.id), [sessions.childAlphaLive.id, sessions.childAlphaRevoked.id].sort());

      await fixture.applyAuthContext({ role: 'authenticated', claims: claimsBeta });
      const betaSessions = await fixture.rows('select id::text as id from public.device_sessions order by id');
      assert.deepEqual(betaSessions.map(row => row.id), [sessions.childBetaLive.id]);
    },
  },
];

emitBanner();

let passed = 0;
let failed = 0;
let blocked = 0;
let fixture = null;
let databaseName = null;
let databaseVersion = '(unavailable)';
let databaseUrl = '(unavailable)';

const environmentBlocker = !process.env.SQL_TEST_DATABASE_URL && !process.env.EMBEDDED_POSTGRES_MODULE_PATH
  ? 'Neither SQL_TEST_DATABASE_URL nor EMBEDDED_POSTGRES_MODULE_PATH is set, so no disposable PostgreSQL is available.'
  : null;

if (environmentBlocker) {
  blocked += 1;
  emit(`BLOCKED H0 environment: ${environmentBlocker}`);
} else {
  try {
    fixture = await createThinkingGamesFixture({ label: 'harness' });
    databaseName = fixture.databaseName;
    const versionRow = await fixture.one('select version() as version, current_database() as database');
    databaseVersion = versionRow.version;
    databaseUrl = `${redactUrl(process.env.SQL_TEST_DATABASE_URL)} -> ${versionRow.database}`;
    emit(`database: ${versionRow.database}`);
    emit(`db version: ${databaseVersion}`);
    emit('');
  } catch (error) {
    blocked += 1;
    emit(`BLOCKED H0 database: the disposable PostgreSQL could not be prepared: ${error.message}`);
    emit('');
    emit('No case was executed. This is a BLOCKED verdict, not a PASS.');
  }
}

if (fixture) {
  for (const testCase of cases) {
    try {
      // Guard every case with a clean session: a leaked role or claim from a
      // previous case must fail loudly instead of silently weakening a case.
      await fixture.resetAuthContext();
      const identity = await fixture.one('select current_user as current_user, session_user as session_user');
      assert.equal(identity.current_user, identity.session_user, 'role was not reset between cases');
      assert.equal(await fixture.scalar('select auth.uid()::text as value'), null, 'claims were not cleared between cases');

      await testCase.run(fixture);
      passed += 1;
      emit(`PASS ${testCase.id} ${testCase.title}`);
    } catch (error) {
      failed += 1;
      emit(`FAIL ${testCase.id} ${testCase.title}`);
      emit(`     ${error && error.message ? error.message : String(error)}`);
    }
  }

  // Isolation case: the fixture database is disposable, per-test and dropped.
  try {
    const stillPresent = await databaseExists(databaseName);
    await fixture.close();
    const afterClose = await databaseExists(databaseName);
    assert.equal(stillPresent, true, 'the per-test database should exist while the fixture is open');
    assert.equal(afterClose, false, 'the per-test database must be dropped on close');
    assert.match(databaseName, /^kidhabit_test_/);
    assert.notEqual(databaseName, 'postgres');
    passed += 1;
    emit('PASS H7 the fixture ran in a disposable kidhabit_test_* database that is dropped on close (the root postgres database is never used)');
  } catch (error) {
    failed += 1;
    emit('FAIL H7 disposable database isolation');
    emit(`     ${error && error.message ? error.message : String(error)}`);
  }
}

emit('');
emit('--- summary ---------------------------------------------------');
emit(`database: ${databaseUrl}`);
emit(`db version: ${databaseVersion}`);
emit(`PASS ${passed}  FAIL ${failed}  BLOCKED ${blocked}`);
emit(`finished: ${new Date().toISOString()}`);
emit('game policy proofs (AC04): NOT RUN - no thinking-games SQL exists yet');
emit('----------------------------------------------------------------');

let exitCode = 0;
if (failed > 0) exitCode = 1;
else if (blocked > 0) exitCode = 2;
emit(`exit code: ${exitCode}`);

process.exit(exitCode);