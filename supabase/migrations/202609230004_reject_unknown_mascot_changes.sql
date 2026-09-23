begin;

create or replace function public.record_mascot_selection()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  last_selected_at timestamptz;
  selected_at timestamptz := now();
  new_mascot_id text;
  old_mascot_id text;
begin
  if new.avatar is null or new.avatar not in (
      'mascot:leo', 'mascot:bunny', 'mascot:panda',
      'mascot:fox', 'mascot:turtle', 'mascot:bee',
      '🦁', '🐰', '🐼', '🦊', '🐢', '🐝'
    ) then
    if tg_op = 'INSERT' then
      raise exception 'invalid_mascot_selection' using errcode = 'P0001';
    elsif new.avatar is distinct from old.avatar then
      raise exception 'invalid_mascot_selection' using errcode = 'P0001';
    end if;
    return new;
  end if;

  new_mascot_id := case new.avatar
    when '🦁' then 'mascot:leo'
    when '🐰' then 'mascot:bunny'
    when '🐼' then 'mascot:panda'
    when '🦊' then 'mascot:fox'
    when '🐢' then 'mascot:turtle'
    when '🐝' then 'mascot:bee'
    else new.avatar
  end;

  if tg_op = 'INSERT' then
    if new_mascot_id = 'mascot:leo' then return new; end if;
  else
    old_mascot_id := case old.avatar
      when '🦁' then 'mascot:leo'
      when '🐰' then 'mascot:bunny'
      when '🐼' then 'mascot:panda'
      when '🦊' then 'mascot:fox'
      when '🐢' then 'mascot:turtle'
      when '🐝' then 'mascot:bee'
      else old.avatar
    end;
    if new_mascot_id = old_mascot_id then return new; end if;

    select mascot_selected_at into last_selected_at
    from public.child_engagement_profiles
    where child_id = new.id and family_id = new.family_id
    for update;

    if last_selected_at is not null
      and selected_at < last_selected_at + interval '168 hours' then
      raise exception 'mascot_change_cooldown' using errcode = 'P0001';
    end if;
  end if;

  insert into public.child_engagement_profiles (
    family_id, child_id, mascot_selected_at, updated_at
  ) values (
    new.family_id, new.id, selected_at, selected_at
  )
  on conflict (child_id) do update
    set mascot_selected_at = excluded.mascot_selected_at,
        updated_at = excluded.updated_at;

  return new;
end
$$;

revoke all on function public.record_mascot_selection() from public, anon, authenticated;

commit;
