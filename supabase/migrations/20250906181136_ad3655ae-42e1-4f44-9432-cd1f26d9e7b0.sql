
-- 1) Engagement events table to track behavior (visits, copy, download, etc.)
create table if not exists public.engagement_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id text not null,
  event_type text not null,
  partner_id uuid references public.partners(id),
  coupon_id uuid references public.coupons(id),
  question_id uuid references public.survey_questions(id),
  metadata jsonb not null default '{}'::jsonb
);

-- Restrict event types to expected values (not time-based, safe to use CHECK)
alter table public.engagement_events
  add constraint engagement_events_event_type_check
  check (event_type in ('visit_partner_page', 'view_congratulations', 'copy_code', 'download_coupon', 'pass_added'));

-- Enable RLS
alter table public.engagement_events enable row level security;

-- Allow admins to view all events
create policy "Admins can view all engagement events"
on public.engagement_events
for select
using (has_role(auth.uid(), 'admin'));

-- Allow anonymous and authenticated users to insert events
create policy "Anyone can insert engagement events"
on public.engagement_events
for insert
with check (true);

-- Helpful indexes
create index if not exists idx_engagement_events_partner on public.engagement_events (partner_id);
create index if not exists idx_engagement_events_event_type on public.engagement_events (event_type);
create index if not exists idx_engagement_events_created_at on public.engagement_events (created_at);
create index if not exists idx_engagement_events_session on public.engagement_events (session_id);

-- Enable realtime on events
alter table public.engagement_events replica identity full;
alter publication supabase_realtime add table public.engagement_events;

-- 2) Views to simplify dashboard queries

-- Sentiment summary per partner (and unique respondent sessions)
create or replace view public.partner_sentiment_summary as
select
  sr.partner_id,
  count(*) filter (where sr.answer = 'happy')     as happy_count,
  count(*) filter (where sr.answer = 'neutral')   as neutral_count,
  count(*) filter (where sr.answer = 'concerned') as concerned_count,
  count(*)                                        as total_count,
  count(distinct sr.session_id)                   as unique_sessions
from public.survey_responses sr
group by sr.partner_id;

-- Engagement summary per partner
create or replace view public.partner_engagement_summary as
select
  ee.partner_id,
  count(*) filter (where ee.event_type = 'visit_partner_page') as visits,
  count(*) filter (where ee.event_type = 'copy_code')          as copy_clicks,
  count(*) filter (where ee.event_type = 'download_coupon')    as download_clicks,
  count(*) filter (where ee.event_type = 'pass_added')         as wallet_adds,
  count(*) filter (where ee.event_type = 'view_congratulations') as congrats_views
from public.engagement_events ee
group by ee.partner_id;

-- One-stop partner overview
create or replace view public.partner_overview as
select
  p.id   as partner_id,
  p.name as name,
  p.slug as slug,
  coalesce(s.total_count, 0)      as total_responses,
  coalesce(s.happy_count, 0)      as happy_count,
  coalesce(s.neutral_count, 0)    as neutral_count,
  coalesce(s.concerned_count, 0)  as concerned_count,
  coalesce(s.unique_sessions, 0)  as respondent_sessions,
  coalesce(e.visits, 0)           as visits,
  coalesce(e.copy_clicks, 0)      as copy_clicks,
  coalesce(e.download_clicks, 0)  as download_clicks,
  coalesce(e.wallet_adds, 0)      as wallet_adds
from public.partners p
left join public.partner_sentiment_summary s on s.partner_id = p.id
left join public.partner_engagement_summary e on e.partner_id = p.id
where p.active = true;

-- 3) Seed partners if they don't exist yet
insert into public.partners (name, slug, active)
values
  ('Kingsway Fish and Chips', 'kingsway-fish-and-chips', true),
  ('Test 2', 'test-2', true),
  ('Test 3', 'test-3', true)
on conflict (slug) do nothing;
