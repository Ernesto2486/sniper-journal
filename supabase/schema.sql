create extension if not exists "pgcrypto";

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  time time not null,
  market text not null check (market in ('Forex', 'Futures', 'Stocks', 'Options', 'Crypto')),
  instrument text not null,
  setup text not null,
  direction text not null check (direction in ('Long', 'Short')),
  entry_price numeric(14, 4) not null,
  exit_price numeric(14, 4) not null,
  stop_loss numeric(14, 4) not null,
  take_profit numeric(14, 4) not null,
  size numeric(14, 4) not null,
  fees numeric(12, 2) not null default 0,
  result_usd numeric(12, 2) not null,
  result_percent numeric(10, 2) not null,
  notes text not null default '',
  followed_plan boolean not null default true,
  revenge_trade boolean not null default false,
  fomo boolean not null default false,
  overtrading boolean not null default false,
  respect_stop_loss boolean not null default true,
  pre_emotion text not null default '',
  during_emotion text not null default '',
  post_emotion text not null default '',
  mistake text not null default '',
  lesson text not null default '',
  discipline_score integer not null check (discipline_score between 1 and 10),
  setup_tags text[] not null default '{}',
  screenshot_url text,
  created_at timestamptz not null default now()
);

create index if not exists trades_user_date_idx on public.trades (user_id, date desc, time desc);
create index if not exists trades_user_market_idx on public.trades (user_id, market);
create index if not exists trades_user_setup_idx on public.trades (user_id, setup);
create table if not exists public.daily_journal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  journal_date date not null,
  mood text not null default '',
  sleep_hours numeric(4, 1),
  market_conditions text not null default 'Trending' check (market_conditions in ('Trending', 'Range', 'Volatile', 'News Day')),
  notes text not null default '',
  checklist jsonb not null default '{}'::jsonb,
  checklist_score integer not null default 0 check (checklist_score between 0 and 7),
  trade_status text not null default 'NO TRADE' check (trade_status in ('NO TRADE', 'A+ TRADE READY')),
  attachments jsonb not null default '[]'::jsonb,
  todays_focus jsonb not null default '[]'::jsonb,
  playbooks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, journal_date)
);

create index if not exists daily_journal_user_date_idx on public.daily_journal (user_id, journal_date desc);

alter table public.trades enable row level security;
alter table public.daily_journal enable row level security;

drop policy if exists "trades_select_own" on public.trades;
create policy "trades_select_own"
  on public.trades
  for select
  using (auth.uid() = user_id);

drop policy if exists "trades_insert_own" on public.trades;
create policy "trades_insert_own"
  on public.trades
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "trades_update_own" on public.trades;
create policy "trades_update_own"
  on public.trades
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "trades_delete_own" on public.trades;
create policy "trades_delete_own"
  on public.trades
  for delete
  using (auth.uid() = user_id);

drop policy if exists "daily_journal_select_own" on public.daily_journal;
create policy "daily_journal_select_own"
  on public.daily_journal
  for select
  using (auth.uid() = user_id);

drop policy if exists "daily_journal_insert_own" on public.daily_journal;
create policy "daily_journal_insert_own"
  on public.daily_journal
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "daily_journal_update_own" on public.daily_journal;
create policy "daily_journal_update_own"
  on public.daily_journal
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "daily_journal_delete_own" on public.daily_journal;
create policy "daily_journal_delete_own"
  on public.daily_journal
  for delete
  using (auth.uid() = user_id);
