// Isolated local regression runner; the optional database package stays outside this repo.
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
if (!process.argv[2]) throw new Error('Usage: node scripts/verify-local-affiliate.mjs /tmp/fix-affiliate-db/node_modules/embedded-postgres/dist/index.js');
const { default: EmbeddedPostgres } = await import(pathToFileURL(resolve(process.argv[2])).href);
const root = fileURLToPath(new URL('../', import.meta.url));
const databaseDir = mkdtempSync(join(tmpdir(), 'affiliate-sql-'));
const load = path => readFileSync(`${root}/${path}`, 'utf8');
const pg = new EmbeddedPostgres({databaseDir, user:'postgres', password:'local-only', port:55439, persistent:false, onLog:()=>{}, onError:console.error});
let client;
const out = [];
try {
  await pg.initialise(); await pg.start(); client = pg.getPgClient(); await client.connect();
  client.on('notice', n => { if (n.severity === 'WARNING') out.push(`WARNING: ${n.message}`); });
  const family = load('supabase/migrations/202609190001_family_tenancy.sql');
  const cases = load('supabase/migrations/202609280001_lifecycle_revenue_operations.sql');
  await client.query(`create role anon; create role authenticated; create role service_role; create schema auth;
    create table auth.users(id uuid primary key, created_at timestamptz not null default now());
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid$$;
    ${family.slice(family.indexOf('create table if not exists public.user_subscriptions'), family.indexOf('create table if not exists public.parent_profiles'))}
    alter table public.payment_orders add column family_id uuid references public.families(id) on delete set null;
    alter table public.user_subscriptions add column family_id uuid references public.families(id) on delete cascade;
    create function public.current_family_id() returns uuid language sql stable as $$select nullif(current_setting('test.family_id', true), '')::uuid$$;
    create function public.can_manage_family(target uuid) returns boolean language sql stable as $$select exists(select 1 from public.family_memberships where family_id = target and user_id = auth.uid() and role in ('owner', 'parent', 'guardian'))$$;
    ${cases.slice(cases.indexOf('create table if not exists public.billing_support_cases'), cases.indexOf('create table if not exists public.billing_support_case_events'))}`);
  for (const name of ['202609300010_affiliate_program', '202610010002_affiliate_hardening', '202610010003_affiliate_audit_fixes']) {
    await client.query(load(`supabase/migrations/${name}.sql`));
  }
  await client.query(`insert into auth.users(id) select ('00000000-0000-0000-0000-' || lpad(n::text,12,'0'))::uuid from generate_series(1,5) n;
    insert into public.families(id,created_by) values ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002'), ('10000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000004');
    insert into public.family_memberships(family_id,user_id,role) values ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','owner'), ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003','guardian'), ('10000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000004','owner');
    insert into public.affiliate_accounts(user_id,code,terms_version,payout_bank,payout_account_number,payout_account_name) values ('00000000-0000-0000-0000-000000000001','ABCDEFGH','2026-10-01','Bank','123456','Referrer');
    insert into public.referrals(referrer_user_id,referred_family_id,referred_user_id,code) values ('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','ABCDEFGH');
    insert into public.payment_orders(order_code,user_id,family_id,amount,status,plan_id) values (1,'00000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002',1000000,'PAID','yearly');
    insert into public.referral_commissions(referral_id,order_code,base_amount,rate_bps,amount,available_at) select id,1,1000000,3000,300000,now() - interval '1 day' from public.referrals;
    create temporary table test_original_release as select available_at as original_release from public.referral_commissions where order_code=1;`);
  await client.query(`insert into public.payment_orders(order_code,user_id,family_id,amount,status,plan_id) values (90,'00000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002',1000000,'PAID','yearly');
    insert into public.referral_commissions(referral_id,order_code,base_amount,rate_bps,amount,available_at) select id,90,1000000,3000,300000,now() - interval '1 day' from public.referrals;
    insert into public.billing_support_cases(family_id,user_id,order_code,status,case_type,reason_code,created_by,resolution_code,resolved_at) values ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002',90,'completed','refund','other','00000000-0000-0000-0000-000000000002','manual_refund_confirmed',now());`);
  await client.query('create temporary table test_original_refund_release as select available_at as original_release from public.referral_commissions where order_code = 90');
  await client.query(load('supabase/migrations/202610090020_affiliate_account_privacy_freeze.sql'));
  await client.query(load('supabase/preflight/202610090020_affiliate_account_privacy_freeze.verify.sql'));
  out.push(`PostgreSQL: ${(await client.query('select version()')).rows[0].version}`);
  out.push('PASS: migration and preflight execute');
  const results = await client.query(load('tests/integration/migrations/affiliate-account-privacy-freeze.scenarios.sql'));
  for (const result of results) if (result.rows?.[0]?.result) out.push(result.rows[0].result);
} catch(e) { out.push(`FAIL: ${e.message}`); process.exitCode=1; }
finally { if(client) await client.end(); await pg.stop(); out.push('Temporary PostgreSQL stopped'); rmSync(databaseDir, { recursive: true, force: true }); console.log(out.join('\n')); }
