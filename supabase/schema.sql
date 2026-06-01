create extension if not exists "pgcrypto";

create table if not exists public.trading_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_name text not null,
  broker text,
  account_type text,
  starting_balance numeric default 0,
  current_balance numeric default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trading_account_id uuid references public.trading_accounts(id) on delete set null,
  date date not null,
  time time not null,
  market text not null check (market in ('Forex', 'Futures', 'Stocks', 'Options', 'Crypto')),
  instrument text not null,
  setup text not null,
  direction text not null check (direction in ('Long', 'Short')),
  option_type text check (option_type in ('Call', 'Put')),
  execution_timeframe text not null default '',
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

alter table public.trades add column if not exists trading_account_id uuid;
alter table public.trades add column if not exists option_type text;
alter table public.trades add column if not exists execution_timeframe text not null default '';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'trades_option_type_check'
  ) then
    alter table public.trades
      add constraint trades_option_type_check
      check (option_type is null or option_type in ('Call', 'Put'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'trades_trading_account_id_fkey'
  ) then
    alter table public.trades
      add constraint trades_trading_account_id_fkey
      foreign key (trading_account_id)
      references public.trading_accounts(id)
      on delete set null;
  end if;
end $$;

create index if not exists trading_accounts_user_active_idx on public.trading_accounts (user_id, is_active, created_at);
create index if not exists trades_user_date_idx on public.trades (user_id, date desc, time desc);
create index if not exists trades_user_market_idx on public.trades (user_id, market);
create index if not exists trades_user_setup_idx on public.trades (user_id, setup);
create index if not exists trades_user_account_idx on public.trades (user_id, trading_account_id);
create index if not exists trades_user_timeframe_idx on public.trades (user_id, execution_timeframe);

create table if not exists public.setups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  setup_name text not null,
  category text not null default '',
  preferred_timeframe text not null default '',
  description text not null default '',
  entry_rules text not null default '',
  risk_rules text not null default '',
  confirmation_rules text not null default '',
  avoid_conditions text not null default '',
  screenshot_url text,
  notes text not null default '',
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists setups_user_favorite_idx on public.setups (user_id, is_favorite desc, setup_name);

create table if not exists public.daily_journal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.trading_accounts(id) on delete set null,
  journal_date date not null,
  mood text not null default '',
  sleep_hours numeric(4, 1),
  market_conditions text not null default 'Trending' check (market_conditions in ('Trending', 'Range', 'Volatile', 'News Day')),
  notes text not null default '',
  checklist jsonb not null default '{}'::jsonb,
  checklist_score integer not null default 0 check (checklist_score between 0 and 7),
  trade_status text not null default 'NO TRADE' check (trade_status in ('NO TRADE', 'A+ TRADE READY')),
  attachments jsonb not null default '[]'::jsonb,
  daily_watchlist jsonb not null default '[]'::jsonb,
  todays_focus jsonb not null default '[]'::jsonb,
  playbooks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.daily_journal add column if not exists account_id uuid references public.trading_accounts(id) on delete set null;
alter table public.daily_journal add column if not exists daily_watchlist jsonb not null default '[]'::jsonb;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'daily_journal_user_id_journal_date_key'
  ) then
    alter table public.daily_journal
      drop constraint daily_journal_user_id_journal_date_key;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'daily_journal_user_account_date_key'
  ) then
    alter table public.daily_journal
      add constraint daily_journal_user_account_date_key
      unique nulls not distinct (user_id, account_id, journal_date);
  end if;
end $$;

create index if not exists daily_journal_user_date_idx on public.daily_journal (user_id, journal_date desc);
create index if not exists daily_journal_user_account_date_idx on public.daily_journal (user_id, account_id, journal_date desc);
create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.trading_accounts(id) on delete set null,
  week_start_date date not null,
  best_trade text not null default '',
  worst_trade text not null default '',
  best_setup text not null default '',
  worst_mistake text not null default '',
  emotional_state text not null default '',
  discipline_grade text not null default '',
  execution_grade text not null default '',
  what_worked text not null default '',
  what_failed text not null default '',
  needs_improvement text not null default '',
  followed_plan text not null default '',
  forced_trades text not null default '',
  improve_next_week text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'weekly_reviews_user_account_week_key'
  ) then
    alter table public.weekly_reviews
      add constraint weekly_reviews_user_account_week_key
      unique nulls not distinct (user_id, account_id, week_start_date);
  end if;
end $$;

create index if not exists weekly_reviews_user_week_idx on public.weekly_reviews (user_id, week_start_date desc);
create table if not exists public.weekly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.trading_accounts(id) on delete set null,
  week_start_date date not null,
  main_goal text not null default '',
  max_weekly_risk text not null default '',
  daily_max_loss text not null default '',
  psychology_focus text not null default '',
  rules_for_week text not null default '',
  allowed_setups text not null default '',
  setups_to_avoid text not null default '',
  stop_trading_conditions text not null default '',
  watchlist jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'weekly_plans_user_account_week_key'
  ) then
    alter table public.weekly_plans
      add constraint weekly_plans_user_account_week_key
      unique nulls not distinct (user_id, account_id, week_start_date);
  end if;
end $$;

create index if not exists weekly_plans_user_week_idx on public.weekly_plans (user_id, week_start_date desc);

alter table public.trading_accounts enable row level security;
alter table public.trades enable row level security;
alter table public.setups enable row level security;
alter table public.daily_journal enable row level security;
alter table public.weekly_reviews enable row level security;
alter table public.weekly_plans enable row level security;

drop policy if exists "trading_accounts_select_own" on public.trading_accounts;
create policy "trading_accounts_select_own"
  on public.trading_accounts
  for select
  using (auth.uid() = user_id);

drop policy if exists "trading_accounts_insert_own" on public.trading_accounts;
create policy "trading_accounts_insert_own"
  on public.trading_accounts
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "trading_accounts_update_own" on public.trading_accounts;
create policy "trading_accounts_update_own"
  on public.trading_accounts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "trading_accounts_delete_own" on public.trading_accounts;
create policy "trading_accounts_delete_own"
  on public.trading_accounts
  for delete
  using (auth.uid() = user_id);

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

drop policy if exists "setups_select_own" on public.setups;
create policy "setups_select_own"
  on public.setups
  for select
  using (auth.uid() = user_id);

drop policy if exists "setups_insert_own" on public.setups;
create policy "setups_insert_own"
  on public.setups
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "setups_update_own" on public.setups;
create policy "setups_update_own"
  on public.setups
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "setups_delete_own" on public.setups;
create policy "setups_delete_own"
  on public.setups
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
drop policy if exists "weekly_reviews_select_own" on public.weekly_reviews;
create policy "weekly_reviews_select_own"
  on public.weekly_reviews
  for select
  using (auth.uid() = user_id);

drop policy if exists "weekly_reviews_insert_own" on public.weekly_reviews;
create policy "weekly_reviews_insert_own"
  on public.weekly_reviews
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "weekly_reviews_update_own" on public.weekly_reviews;
create policy "weekly_reviews_update_own"
  on public.weekly_reviews
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "weekly_reviews_delete_own" on public.weekly_reviews;
create policy "weekly_reviews_delete_own"
  on public.weekly_reviews
  for delete
  using (auth.uid() = user_id);
drop policy if exists "weekly_plans_select_own" on public.weekly_plans;
create policy "weekly_plans_select_own"
  on public.weekly_plans
  for select
  using (auth.uid() = user_id);

drop policy if exists "weekly_plans_insert_own" on public.weekly_plans;
create policy "weekly_plans_insert_own"
  on public.weekly_plans
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "weekly_plans_update_own" on public.weekly_plans;
create policy "weekly_plans_update_own"
  on public.weekly_plans
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "weekly_plans_delete_own" on public.weekly_plans;
create policy "weekly_plans_delete_own"
  on public.weekly_plans
  for delete
  using (auth.uid() = user_id);
