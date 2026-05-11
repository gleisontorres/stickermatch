-- Stickermatch — controle de acesso manual (status + admin)

-- 1. Status do cadastro
alter table public.perfis
  add column if not exists status text
  not null default 'pendente'
  check (status in ('pendente', 'aprovado', 'rejeitado'));

-- 2. Flag de administrador (painel /admin)
alter table public.perfis
  add column if not exists is_admin boolean not null default false;

-- 3. Momento da última decisão de acesso (aprovar / rejeitar / reativar)
alter table public.perfis
  add column if not exists reviewed_at timestamptz;

-- 4. Índice para listar pendentes no admin
create index if not exists idx_perfis_status on public.perfis (status);

-- 5. Quem já estava no app entra como aprovado (migration compatível)
update public.perfis
set
  status = 'aprovado',
  reviewed_at = coalesce(reviewed_at, now());

-- 6. Dono do app — substitua GLEISON_EMAIL pelo usuário local antes de rodar em prod
update public.perfis
set
  is_admin = true,
  status = 'aprovado',
  reviewed_at = coalesce(reviewed_at, now())
where lower(trim(email)) = lower(trim('GLEISON_EMAIL@gmail.com'));

-- 7. RLS: usuário vê só o próprio perfil; admin vê todos
drop policy if exists "perfis_select_all" on public.perfis;

create policy "perfis_select_admin_ou_proprio" on public.perfis
  for select using (
    auth.uid() = id
    or exists (
      select 1
      from public.perfis admin_check
      where admin_check.id = auth.uid()
        and admin_check.is_admin = true
    )
  );

-- 8. Admin pode atualizar qualquer perfil (aprovar / rejeitar / reativar)
drop policy if exists "perfis_update_admin" on public.perfis;

create policy "perfis_update_admin" on public.perfis
  for update using (
    exists (
      select 1
      from public.perfis admin_check
      where admin_check.id = auth.uid()
        and admin_check.is_admin = true
    )
  );

-- 9. Impede que usuário comum altere status ou is_admin no próprio UPDATE (política perfis_update_own continua válida)
create or replace function public.perfis_prevent_privilege_escalation ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_is_admin boolean;
begin
  select coalesce(is_admin, false)
    into caller_is_admin
  from public.perfis
  where id = auth.uid();

  if caller_is_admin then
    return new;
  end if;

  if new.id = auth.uid() then
    new.status := old.status;
    new.is_admin := old.is_admin;
  end if;

  return new;
end;
$$;

drop trigger if exists perfis_prevent_privilege_escalation on public.perfis;

create trigger perfis_prevent_privilege_escalation
  before update on public.perfis
  for each row
  execute function public.perfis_prevent_privilege_escalation ();

-- 10. Novos usuários OAuth nascem como pendentes
create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, nome, email, avatar_url, status, is_admin, reviewed_at)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    'pendente',
    false,
    null
  );
  return new;
end;
$$;
