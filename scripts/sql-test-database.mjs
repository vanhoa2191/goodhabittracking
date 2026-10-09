// Every SQL test gets its own disposable database. Only loopback PostgreSQL is accepted.
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import pg from 'pg';

let server;
let databaseDir;
let connectionString;
export async function createSqlTestDatabase() {
  if (!connectionString) {
    connectionString = process.env.SQL_TEST_DATABASE_URL;
    if (!connectionString) {
      const modulePath = process.env.EMBEDDED_POSTGRES_MODULE_PATH ?? process.argv[2];
      if (!modulePath) throw new Error('Set SQL_TEST_DATABASE_URL to a disposable loopback PostgreSQL, or EMBEDDED_POSTGRES_MODULE_PATH to the optional local package.');
      const { default: EmbeddedPostgres } = await import(pathToFileURL(modulePath).href);
      databaseDir = mkdtempSync(join(tmpdir(), 'kidhabit-sql-'));
      server = new EmbeddedPostgres({ databaseDir, user: 'postgres', password: 'local-only', port: 55439, persistent: false, onLog: () => {}, onError: console.error });
      await server.initialise();
      await server.start();
      connectionString = 'postgresql://postgres:local-only@127.0.0.1:55439/postgres';
    }
    const url = new URL(connectionString);
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw new Error('SQL tests refuse non-loopback database hosts.');
  }
  const control = new pg.Client({ connectionString });
  await control.connect();
  // Roles are cluster-wide, unlike each fixture's tables and auth schema.
  await control.query("do $$ declare r text; begin foreach r in array array['anon','authenticated','service_role'] loop if not exists(select 1 from pg_roles where rolname=r) then execute format('create role %I',r); end if; end loop; end $$;");
  const name = `kidhabit_test_${randomUUID().replaceAll('-', '')}`;
  await control.query(`create database ${name}`);
  const url = new URL(connectionString); url.pathname = `/${name}`;
  const client = new pg.Client({ connectionString: url.href });
  await client.connect();
  return {
    client,
    exec: sql => client.query(sql),
    query: (sql, args) => client.query(sql, args),
    async connect() {
      const extra = new pg.Client({ connectionString: url.href });
      await extra.connect();
      return extra;
    },
    async close() {
      await client.end();
      try { await control.query(`drop database ${name} with (force)`); } finally { await control.end(); }
    },
  };
}
export async function stopSqlTestServer() {
  if (server) await server.stop();
  if (databaseDir) rmSync(databaseDir, { recursive: true, force: true });
}
