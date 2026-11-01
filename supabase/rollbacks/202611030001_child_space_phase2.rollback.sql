-- Rolls back phase 2: restores the phase-1 read commands and drops weekly goals and letters (their data is lost).
begin;
drop function if exists public.respond_child_space_letter(uuid, uuid, boolean);
drop function if exists public.send_child_space_letter(text, date, text);
drop function if exists public.mark_child_space_goal(text, date, text);
drop function if exists public.save_child_space_goal(text, date, text);
drop table if exists public.child_space_letters;
drop table if exists public.child_space_weekly_goals;

create or replace function public.read_child_space(session_token_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare child_session public.device_sessions%rowtype;
begin
  select * into child_session from public.device_sessions device
  where device.token_hash = session_token_hash and device.revoked_at is null and device.expires_at > now()
    and 'child:read' = any(device.capabilities);
  if not found then return jsonb_build_object('status', 'session_invalid'); end if;
  return jsonb_build_object('status', 'ready',
    'moods', coalesce((select jsonb_agg(to_jsonb(m) order by m.local_date desc) from public.child_space_moods m
      where m.child_id = child_session.child_id and m.family_id = child_session.family_id
        and m.local_date >= current_date - 60), '[]'::jsonb),
    'notes', coalesce((select jsonb_agg(to_jsonb(n) order by n.local_date desc, n.kind) from public.child_space_notes n
      where n.child_id = child_session.child_id and n.family_id = child_session.family_id
        and n.local_date >= current_date - 60), '[]'::jsonb));
end $$;

create or replace function public.read_parent_child_space(target_family_id uuid, target_child_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not public.can_manage_family(target_family_id) then return jsonb_build_object('status', 'session_invalid'); end if;
  perform 1 from public.child_profiles child where child.id = target_child_id and child.family_id = target_family_id;
  if not found then return jsonb_build_object('status', 'child_unavailable'); end if;
  return jsonb_build_object('status', 'ready',
    'moods', coalesce((select jsonb_agg(to_jsonb(m) order by m.local_date desc) from public.child_space_moods m
      where m.child_id = target_child_id and m.family_id = target_family_id
        and m.local_date >= current_date - 30), '[]'::jsonb),
    'notes', coalesce((select jsonb_agg(to_jsonb(n) order by n.local_date desc, n.kind) from public.child_space_notes n
      where n.child_id = target_child_id and n.family_id = target_family_id and n.shared_with_parent
        and n.local_date >= current_date - 30), '[]'::jsonb));
end $$;

commit;
