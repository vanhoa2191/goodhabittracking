-- The predecessor depends on upgrade order: one RPC definition has the parent-role
-- guard while the other has the game lock and bonus sync. Reverting to either would
-- reopen a known authorization or game-integrity failure. Use a forward fix instead.
begin;
do $$
begin
  raise exception 'unsafe_rollback_requires_forward_fix';
end $$;
commit;
