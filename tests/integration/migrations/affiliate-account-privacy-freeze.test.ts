import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse, parsePlPgSQL } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(resolve('supabase/migrations/202610090020_affiliate_account_privacy_freeze.sql'), 'utf8');
const verification = readFileSync(resolve('supabase/preflight/202610090020_affiliate_account_privacy_freeze.verify.sql'), 'utf8');
const statements = (await parse(migration)).stmts?.map((statement) => statement.stmt!) ?? [];
const functions = statements.flatMap((statement) => 'CreateFunctionStmt' in statement ? [statement.CreateFunctionStmt] : []);
// Database execution requires a local PostgreSQL/Supabase fixture. These checks cover the
// deployable DDL contract, not the monetary behaviour inside the function bodies.
describe('affiliate account/privacy/freeze migration contract', () => {
  it('preserves historical release dates and commissions while changing only the new hold policy', () => {
    const writes = statements.flatMap((statement) => 'UpdateStmt' in statement ? [statement.UpdateStmt] : []);
    expect(writes.map((statement) => statement.relation?.relname)).toEqual(['affiliate_settings']);
    expect(statements.some((statement) => 'DeleteStmt' in statement || 'DropStmt' in statement)).toBe(false);
    const hold = statements.flatMap((statement) => 'AlterTableStmt' in statement ? [statement.AlterTableStmt] : []);
    expect(hold).toMatchObject([{ relation: { relname: 'affiliate_settings' }, cmds: [{ AlterTableCmd: { name: 'hold_days', def: { A_Const: { ival: { ival: 40 } } } } }] }]);
  });

  it('serializes every support-case transition against the linked payment order', () => {
    const triggers = statements.flatMap((statement) => 'CreateTrigStmt' in statement ? [statement.CreateTrigStmt] : []);
    expect(triggers).toMatchObject([{
      relation: { schemaname: 'public', relname: 'billing_support_cases' },
      row: true, timing: 2, events: 28,
    }]);
    expect(triggers[0]?.funcname?.map((part) => 'String' in part ? part.String.sval : undefined).join('.')).toBe('public.lock_affiliate_billing_case_order');
  });
  it('keeps every replacement a security definer with an empty search path', () => {
    expect(functions.map((fn) => fn.funcname?.map((part) => 'String' in part ? part.String.sval : undefined).join('.')).sort()).toEqual([
      'public.accrue_referral_commission', 'public.admin_affiliate_overview',
      'public.admin_resolve_affiliate_payout', 'public.admin_reverse_referral_commission',
      'public.affiliate_commission_block_reason',
      'public.affiliate_overview', 'public.claim_referral', 'public.lock_affiliate_billing_case_order',
      'public.referral_claim_state', 'public.request_affiliate_payout',
    ]);
    for (const fn of functions) {
      expect(fn.options).toEqual(expect.arrayContaining([
        expect.objectContaining({ DefElem: expect.objectContaining({ defname: 'security', arg: { Boolean: { boolval: true } } }) }),
        expect.objectContaining({ DefElem: expect.objectContaining({ defname: 'set', arg: { VariableSetStmt: expect.objectContaining({ name: 'search_path', args: [expect.objectContaining({ A_Const: expect.objectContaining({ sval: { sval: '' } }) })] }) } }) }),
      ]));
    }
  });

  it('locks the payment order before the commission when reversing a refund', async () => {
    const definition = functions.find((fn) => fn.funcname?.some((part) => 'String' in part && part.String.sval === 'admin_reverse_referral_commission'))!;
    const parsed = await parsePlPgSQL(migration.slice(
      migration.indexOf('create or replace function public.admin_reverse_referral_commission('),
      migration.indexOf('\n$$;', migration.indexOf('create or replace function public.admin_reverse_referral_commission(')) + 4,
    )) as unknown as { plpgsql_funcs: Array<{ PLpgSQL_function: { action: { PLpgSQL_stmt_block: { body: Array<{
      PLpgSQL_stmt_perform?: { expr: { PLpgSQL_expr: { query: string } } };
      PLpgSQL_stmt_execsql?: { sqlstmt: { PLpgSQL_expr: { query: string } } };
    }> } } } }> };
    expect(definition.returnType?.names).toEqual([{ String: { sval: 'text' } }]);
    const body = parsed.plpgsql_funcs[0].PLpgSQL_function.action.PLpgSQL_stmt_block.body;
    const firstQuery = body[0].PLpgSQL_stmt_perform?.expr.PLpgSQL_expr.query
      ?? body[0].PLpgSQL_stmt_execsql!.sqlstmt.PLpgSQL_expr.query;
    const first = (await parse(firstQuery)).stmts![0].stmt!;
    expect(first).toMatchObject({ SelectStmt: {
      fromClause: [{ RangeVar: { schemaname: 'public', relname: 'payment_orders' } }],
      lockingClause: [{ LockingClause: { strength: 'LCS_FORUPDATE' } }],
    } });
    const second = (await parse(body[1].PLpgSQL_stmt_execsql!.sqlstmt.PLpgSQL_expr.query)).stmts![0].stmt!;
    expect(second).toMatchObject({ SelectStmt: {
      fromClause: [{ RangeVar: { schemaname: 'public', relname: 'referral_commissions' } }],
      lockingClause: [{ LockingClause: { strength: 'LCS_FORUPDATE' } }],
    } });
  });

  it('parses every PL/pgSQL replacement and preflight assertion, not just outer SQL', async () => {
    const result = await parsePlPgSQL(migration) as unknown as { plpgsql_funcs: Array<{ PLpgSQL_function: { action?: unknown } }> };
    expect(result.plpgsql_funcs.filter((fn) => fn.PLpgSQL_function.action)).toHaveLength(9);
    const preflight = await parse(verification);
    expect(preflight.stmts?.map((statement) => Object.keys(statement.stmt!))).toEqual([['DoStmt']]);
    const statement = preflight.stmts![0].stmt!;
    if (!('DoStmt' in statement)) throw new Error('Expected a preflight DO block');
    const argument = statement.DoStmt.args?.find((argument) => 'DefElem' in argument && argument.DefElem.defname === 'as');
    const expression = argument && 'DefElem' in argument ? argument.DefElem.arg : undefined;
    const body = expression && 'String' in expression ? expression.String.sval : undefined;
    const parsedPreflight = await parsePlPgSQL(`create function preflight() returns void language plpgsql as $body$${body}$body$;`) as unknown as { plpgsql_funcs: Array<{ PLpgSQL_function: { action?: unknown } }> };
    expect(parsedPreflight.plpgsql_funcs[0].PLpgSQL_function.action).toBeDefined();
  });
});
