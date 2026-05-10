-- Matches inclusivos: falta explícita (quantidade = 0) OU falta implícita (sem linha em colecao).
-- Substitui a view que só fazia JOIN com falta explícita.

drop view if exists public.matches;

create view public.matches as
select
  repetida.user_id      as user_oferta,
  outro_user.id         as user_precisa,
  repetida.figurinha_id as figurinha_id
from public.colecao repetida
cross join (select id from auth.users) as outro_user
left join public.colecao falta
  on falta.user_id = outro_user.id
  and falta.figurinha_id = repetida.figurinha_id
where repetida.quantidade > 1
  and repetida.user_id <> outro_user.id
  and (falta.quantidade = 0 or falta.figurinha_id is null);

comment on view public.matches is
  'Par (oferta,precisa,figurinha): oferta tem repetida (>1); precisa não tem ou tem qty=0.';

-- Ajuda o planner nas linhas repetidas (filtro quantidade > 1).
create index if not exists idx_colecao_user_fig_qty_gt1
  on public.colecao (user_id, figurinha_id)
  where quantidade > 1;

grant select on table public.matches to anon, authenticated;
