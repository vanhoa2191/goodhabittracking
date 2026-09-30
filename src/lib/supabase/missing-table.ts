type RowResult<Row> = {
  readonly data: Row[] | null;
  readonly error: { readonly code?: string } | null;
};

/** PostgREST reports an unknown table as PGRST205 and PostgreSQL as 42P01. */
export function isMissingTable(error: { readonly code?: string } | null | undefined): boolean {
  return error?.code === 'PGRST205' || error?.code === '42P01';
}

/**
 * Reading a table that a migration has not created yet should not break everything else,
 * so that new code can be deployed just before the migration is applied.
 */
export function emptyWhenTableMissing<Row, Result extends RowResult<Row>>(
  result: Result,
): Result | { data: Row[]; error: null } {
  return isMissingTable(result.error) ? { data: [], error: null } : result;
}
