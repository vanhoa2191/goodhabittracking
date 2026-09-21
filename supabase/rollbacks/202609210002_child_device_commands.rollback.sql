begin;

drop function if exists public.complete_child_habit_command(text, uuid, date, uuid);
drop function if exists public.undo_child_habit_command(text, uuid);
drop function if exists public.redeem_child_reward_command(text, uuid, uuid);

commit;
