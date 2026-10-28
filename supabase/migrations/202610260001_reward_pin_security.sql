begin;

-- Reward management is PIN-gated by the server route. Keep authenticated callers
-- read-only so they cannot bypass that check through PostgREST table mutations.
revoke insert, update, delete on table public.rewards from authenticated;

commit;
