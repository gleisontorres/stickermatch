-- Catálogo Panini: figurinha de seleção (posição 13 por time).
alter table public.figurinhas drop constraint if exists figurinhas_tipo_check;

alter table public.figurinhas
  add constraint figurinhas_tipo_check
  check (
    tipo in (
      'jogador',
      'logo',
      'especial',
      'selecao'
    )
  );
