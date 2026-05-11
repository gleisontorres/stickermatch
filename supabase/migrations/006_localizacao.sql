-- Localização opcional para distância aproximada nos Matches (sem expor coords na UI).
-- Rode no SQL Editor após 005_fix_perfis_rls_recursion.sql.

create extension if not exists cube;
create extension if not exists earthdistance;

alter table public.perfis
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists localizacao_atualizada_em timestamptz;

create index if not exists idx_perfis_localizacao
  on public.perfis (latitude, longitude)
  where latitude is not null and longitude is not null;

-- Distância em km (earth_distance retorna metros)
create or replace function public.distancia_km (
  lat1 double precision,
  lng1 double precision,
  lat2 double precision,
  lng2 double precision
)
returns double precision
language sql
immutable
parallel safe
set search_path = public
as $$
  select case
    when lat1 is null or lng1 is null or lat2 is null or lng2 is null then null::double precision
    else earth_distance(ll_to_earth(lat1, lng1), ll_to_earth(lat2, lng2)) / 1000.0
  end;
$$;

comment on function public.distancia_km (double precision, double precision, double precision, double precision) is
  'Distância aproximada em km entre dois pontos (lat, lng). Retorna null se alguma coordenada for nula.';

create or replace function public.partner_profiles_for_matches (partner_ids uuid[])
returns table (
  id uuid,
  nome text,
  email text,
  whatsapp text,
  distancia_km double precision
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select p.latitude as lat, p.longitude as lng
    from public.perfis p
    where p.id = auth.uid()
  ),
  allowed_partner as (
    select distinct
      case
        when m.user_precisa = auth.uid() then m.user_oferta
        else m.user_precisa
      end as pid
    from public.matches m
    where m.user_precisa = auth.uid()
       or m.user_oferta = auth.uid()
  )
  select
    pr.id,
    pr.nome,
    pr.email,
    pr.whatsapp,
    case
      when me.lat is not null and me.lng is not null
           and pr.latitude is not null and pr.longitude is not null
      then public.distancia_km(me.lat, me.lng, pr.latitude, pr.longitude)
      else null::double precision
    end as distancia_km
  from public.perfis pr
  cross join me
  where coalesce(array_length(partner_ids, 1), 0) > 0
    and pr.id = any(partner_ids)
    and pr.id in (select pid from allowed_partner where pid is not null);
$$;

comment on function public.partner_profiles_for_matches (uuid[]) is
  'Perfis de parceiros com match ao usuário atual; não expõe coordenadas, só distancia_km quando ambos têm localização.';

revoke all on function public.partner_profiles_for_matches (uuid[]) from public;
grant execute on function public.partner_profiles_for_matches (uuid[]) to authenticated;
