-- Run after all batches. Expect: rows = 1460, per-track 730, per-slot 365, no other version rows touched.
select content_version, age_track, slot_type, count(*) as rows, min(day_index) as first_day, max(day_index) as last_day
from public.thinking_game_content where content_version = 'release-365-v2'
group by 1, 2, 3 order by 2, 3;
