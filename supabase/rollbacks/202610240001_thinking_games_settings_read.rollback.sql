begin;

-- Restore the former ACL without changing family policies or stored settings.
-- This also restores the parent settings read failure; disable the feature
-- before using this rollback outside an isolated verification environment.
revoke select on public.thinking_game_settings from authenticated;

commit;
