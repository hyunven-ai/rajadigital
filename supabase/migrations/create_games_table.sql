-- ============================================================
-- Tabel games — pengganti src/data/games.json
-- Jalankan di Supabase SQL Editor
-- ============================================================

create table if not exists public.games (
  id              text primary key,
  slug            text unique not null,
  name            text not null,
  publisher       text default '',
  description     text default '',
  cover           text default '',
  emoji           text default '🎮',
  currency        text not null default 'Diamond',
  currency_icon   text default '💎',
  extra_currencies jsonb default '[]'::jsonb,
  color           text default '#fbbf24',
  gradient        text default 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
  is_active       boolean default true,
  is_hot          boolean default false,
  is_new          boolean default false,
  sort_order      integer default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Enable RLS
alter table public.games enable row level security;

-- Public dapat baca game aktif
create policy "Public can read active games"
  on public.games for select
  using (is_active = true);

-- Service role (admin API) bisa semua
create policy "Service role full access"
  on public.games for all
  using (auth.role() = 'service_role');

-- Trigger update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger games_updated_at
  before update on public.games
  for each row execute function public.set_updated_at();

-- ============================================================
-- Seed data dari games.json yang sudah ada
-- ============================================================
insert into public.games (id, slug, name, publisher, description, cover, emoji, currency, currency_icon, extra_currencies, color, gradient, is_active, is_hot, is_new, sort_order)
values
  (
    'royal-dream', 'royal-dream', 'Royal Dream', 'Coin Royal Dream',
    'Top-up Diamond & Koin Royal Dream dengan harga terbaik, proses cepat dan aman.',
    '/games/royal-dream.png', '👑', 'Chip', '🎰',
    '[{"key":"b","label":"B","icon":"🪙"},{"key":"m","label":"M","icon":"🎰"},{"key":"100m","label":"100M","icon":"✨"}]',
    '#ec4899', 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
    true, true, false, 1
  ),
  (
    'higgs-domino', 'higgs-domino', 'Higgs Domino', 'Higgs Games',
    'Top-up Koin & Chip Higgs Domino Island resmi dengan harga termurah.',
    '/games/higgs-domino.png', '🎰', 'Chip', '🎰',
    '[{"key":"b","label":"B","icon":"🪙"},{"key":"m","label":"M","icon":"🎰"}]',
    '#22c55e', 'linear-gradient(135deg, #14532d 0%, #0f172a 100%)',
    true, false, true, 5
  ),
  (
    'boss-party', 'boss-party', 'Boss Party', 'BossGAME',
    'Boss Party menyediakan game lokal Indonesia, mulai dari: QiuQiu, Kamar Biasa, Kamar Bet, Happy Fishing.',
    '/games/boss-party.png', '🎮', 'Chip', '🎰',
    '[{"key":"b","label":"B","icon":"🪙"},{"key":"m","label":"M","icon":"🎰"}]',
    '#a78bfa', 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
    true, false, false, 0
  )
on conflict (id) do nothing;
