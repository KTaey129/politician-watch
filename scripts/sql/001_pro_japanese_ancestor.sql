-- Run this once in the Supabase SQL editor (or `supabase db execute < this file`)
-- to add the pro_japanese_ancestor table.
--
-- Data source: 친일반민족행위진상규명위원회 (Presidential Committee for the
-- Inspection of Collaborationist Activities, 2009 report). Rows are entered
-- manually via scripts/seed-ancestor-records.ts — no automated name-matching,
-- since incorrectly linking a living politician to this list is a real
-- defamation risk. Every row must carry a source.

create table if not exists public.pro_japanese_ancestor (
  id uuid primary key default gen_random_uuid(),
  politician_id uuid not null references public.politician(id) on delete cascade,
  ancestor_name text not null,
  relation text not null,
  activity_summary text not null,
  designated_by text not null default '친일반민족행위진상규명위원회',
  source text,
  source_url text,
  created_at timestamptz not null default now(),
  unique (politician_id, ancestor_name)
);

create index if not exists pro_japanese_ancestor_politician_id_idx
  on public.pro_japanese_ancestor (politician_id);

alter table public.pro_japanese_ancestor enable row level security;

create policy "Public read access"
  on public.pro_japanese_ancestor
  for select
  to anon, authenticated
  using (true);
