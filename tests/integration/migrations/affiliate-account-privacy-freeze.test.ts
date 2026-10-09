import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse, parsePlPgSQL } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(resolve('supabase/migrations/202610090020_affiliate_account_privacy_freeze.sql'), 'utf8');
const verification = readFileSync(resolve('supabase/preflight/202610090020_affiliate_account_privacy_freeze.verify.sql'), 'utf8');
const scenarios = readFileSync(resolve('tests/integration/migrations/affiliate-account-privacy-freeze.scenarios.sql'), 'utf8');
const statements = (await parse(migration)).stmts?.map((statement) => statement.stmt!) ?? [];
const functions = statements.flatMap((statement) => 'CreateFunctionStmt' in statement ? [statement.CreateFunctionStmt] : []);

// Monetary transitions are exercised by the isolated PostgreSQL scenarios, not source-text assertions.
describe('affiliate account/privacy/freeze migration contract', () => {
  it('keeps every replacement a security definer with an empty search path', () => {
    for (const fn of functions) {
      expect(fn.options).toEqual(expect.arrayContaining([
        expect.objectContaining({ DefElem: expect.objectContaining({ defname: 'security', arg: { Boolean: { boolval: true } } }) }),
        expect.objectContaining({ DefElem: expect.objectContaining({ defname: 'set', arg: { VariableSetStmt: expect.objectContaining({ name: 'search_path', args: [expect.objectContaining({ A_Const: expect.objectContaining({ sval: { sval: '' } }) })] }) } }) }),
      ]));
    }
  });

  it('parses every PL/pgSQL replacement, SQL scenario and preflight assertion', async () => {
    await expect(parsePlPgSQL(migration)).resolves.toBeDefined();
    await expect(parse(scenarios)).resolves.toBeDefined();
    const preflight = await parse(verification);
    const statement = preflight.stmts![0].stmt!;
    if (!('DoStmt' in statement)) throw new Error('Expected a preflight DO block');
    const argument = statement.DoStmt.args?.find((argument) => 'DefElem' in argument && argument.DefElem.defname === 'as');
    const expression = argument && 'DefElem' in argument ? argument.DefElem.arg : undefined;
    const body = expression && 'String' in expression ? expression.String.sval : undefined;
    await expect(parsePlPgSQL(`create function preflight() returns void language plpgsql as $body$${body}$body$;`)).resolves.toBeDefined();
  });
});
