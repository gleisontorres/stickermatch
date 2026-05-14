-- CollectHub — schema inicial (Supabase / Postgres)
-- Catálogo de figurinhas (seed estático, populado uma vez)
create table figurinhas (
  id text primary key,
  numero int,
  nome text not null,
  selecao text,
  selecao_codigo text,
  tipo text not null check (tipo in ('jogador','logo','especial')),
  posicao text,
  imagem_url text,
  created_at timestamptz default now()
);

create index idx_figurinhas_selecao on figurinhas(selecao);
create index idx_figurinhas_tipo on figurinhas(tipo);

-- Perfil do usuário (estende auth.users do Supabase)
create table perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  email text,
  avatar_url text,
  whatsapp text,
  created_at timestamptz default now()
);

-- Coleção do usuário
create table colecao (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  figurinha_id text not null references figurinhas(id) on delete cascade,
  quantidade int not null default 0 check (quantidade >= 0),
  updated_at timestamptz default now(),
  unique(user_id, figurinha_id)
);

create index idx_colecao_user on colecao(user_id);
create index idx_colecao_figurinha on colecao(figurinha_id);

-- Histórico de trocas
create table trocas (
  id bigserial primary key,
  user_a uuid not null references auth.users(id),
  user_b uuid not null references auth.users(id),
  figurinhas_de_a text[] not null,
  figurinhas_de_b text[] not null,
  status text not null default 'proposta' check (status in ('proposta','aceita','recusada','concluida')),
  created_at timestamptz default now()
);

-- View de matches: quem tem repetida do que o outro precisa
create view matches as
select
  repetida.user_id      as user_oferta,
  falta.user_id         as user_precisa,
  repetida.figurinha_id as figurinha_id
from colecao repetida
join colecao falta
  on repetida.figurinha_id = falta.figurinha_id
 and repetida.user_id != falta.user_id
where repetida.quantidade > 1
  and falta.quantidade = 0;

-- RLS
alter table figurinhas enable row level security;
alter table perfis enable row level security;
alter table colecao enable row level security;
alter table trocas enable row level security;

create policy "figurinhas_select_all" on figurinhas for select using (true);

create policy "perfis_select_all" on perfis for select using (true);
create policy "perfis_update_own" on perfis for update using (auth.uid() = id);
create policy "perfis_insert_own" on perfis for insert with check (auth.uid() = id);

create policy "colecao_select_all" on colecao for select using (true);
create policy "colecao_insert_own" on colecao for insert with check (auth.uid() = user_id);
create policy "colecao_update_own" on colecao for update using (auth.uid() = user_id);
create policy "colecao_delete_own" on colecao for delete using (auth.uid() = user_id);

create policy "trocas_select_own" on trocas for select using (auth.uid() = user_a or auth.uid() = user_b);
create policy "trocas_insert_own" on trocas for insert with check (auth.uid() = user_a);
create policy "trocas_update_envolvidos" on trocas for update using (auth.uid() = user_a or auth.uid() = user_b);

-- Permissões para PostgREST (anon / authenticated); RLS continua aplicando por política.
grant usage on schema public to anon, authenticated;

grant select on table public.figurinhas to anon, authenticated;

grant select on table public.perfis to anon, authenticated;
grant insert, update on table public.perfis to authenticated;

grant select on table public.colecao to anon, authenticated;
grant insert, update, delete on table public.colecao to authenticated;

grant select, insert, update on table public.trocas to authenticated;

grant select on table public.matches to anon, authenticated;

grant usage, select on sequence public.colecao_id_seq to authenticated;
grant usage, select on sequence public.trocas_id_seq to authenticated;

-- Trigger: cria linha em perfis no signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.perfis (id, nome, email, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
