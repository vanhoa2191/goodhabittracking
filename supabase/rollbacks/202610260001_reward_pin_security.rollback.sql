begin;

grant insert, update, delete on table public.rewards to authenticated;

commit;
