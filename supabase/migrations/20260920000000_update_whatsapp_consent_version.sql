-- Run manually when releasing the matching 2026-09-20 check-in notice.
-- Only the default for future opt-ins changes; historical evidence is untouched.
-- Exact text and deployment order: docs/datenschutz-inbetriebnahme.md.
begin;
alter table public.customer_notification_preferences
  alter column consent_version set default '2026-09-20';
commit;
