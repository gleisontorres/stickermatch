-- Grupo da Copa (A–L) para filtros/agrupamento na UI
alter table public.figurinhas
  add column if not exists grupo text;

create index if not exists idx_figurinhas_grupo on public.figurinhas (grupo);
