alter table public.proactive_messages
  drop constraint if exists proactive_messages_reason_check;

alter table public.proactive_messages
  add constraint proactive_messages_reason_check
  check (reason in ('random_check_in', 'evening_check_in', 'unfinished_topic'));
