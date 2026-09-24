begin;

create or replace function public.get_child_family_pause(session_token_hash text)
returns timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  select settings.paused_at
  from public.device_sessions session
  left join public.family_engagement_settings settings
    on settings.family_id = session.family_id
  where session.token_hash = session_token_hash
    and session.revoked_at is null
    and session.expires_at > now()
    and 'child:read' = any(session.capabilities)
  limit 1;
$$;

revoke all on function public.get_child_family_pause(text) from public;
grant execute on function public.get_child_family_pause(text) to anon, authenticated;

commit;
