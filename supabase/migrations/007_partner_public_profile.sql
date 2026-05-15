-- Perfis públicos entre parceiros de match (server-side seguro via RPC security definer).

create or replace function public.partner_public_profile (p_partner_id uuid)
returns table (
  nome text,
  avatar_url text,
  whatsapp text,
  created_at timestamptz,
  owned_count bigint,
  surplus_copies bigint,
  album_total bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.nome,
    p.avatar_url,
    p.whatsapp,
    p.created_at,
    (
      select count(*)::bigint
      from public.figurinhas f
      left join public.colecao c
        on c.figurinha_id = f.id
        and c.user_id = p_partner_id
      where coalesce(c.quantidade, 0) >= 1
    ) as owned_count,
    (
      select coalesce(
        sum(case when c.quantidade > 1 then c.quantidade - 1 else 0 end),
        0
      )::bigint
      from public.colecao c
      where c.user_id = p_partner_id
    ) as surplus_copies,
    (select count(*)::bigint from public.figurinhas) as album_total
  from public.perfis p
  where p.id = p_partner_id
    and exists (
      select 1
      from public.matches m
      where (m.user_oferta = auth.uid() and m.user_precisa = p_partner_id)
         or (m.user_precisa = auth.uid() and m.user_oferta = p_partner_id)
    );
$$;

comment on function public.partner_public_profile (uuid) is
  'Dados públicos de um perfil apenas se há match com auth.uid(); sem email ou coords.';

revoke all on function public.partner_public_profile (uuid) from public;

grant execute on function public.partner_public_profile (uuid) to authenticated;
