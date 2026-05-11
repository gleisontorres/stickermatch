-- Corrige erro 42P17 (recursão infinita nas policies de perfis).
-- A política com EXISTS (SELECT ... FROM perfis ...) dispara RLS de novo no subselect.

create or replace function public.current_user_is_admin ()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select p.is_admin
      from public.perfis p
      where p.id = auth.uid()
    ),
    false
  );
$$;

comment on function public.current_user_is_admin () is
  'Evita recursão nas policies RLS de perfis (checagem de admin sem subselect na policy).';

grant execute on function public.current_user_is_admin () to authenticated;
grant execute on function public.current_user_is_admin () to anon;

drop policy if exists "perfis_select_admin_ou_proprio" on public.perfis;

create policy "perfis_select_admin_ou_proprio" on public.perfis
  for select using (
    auth.uid() = id
    or public.current_user_is_admin ()
  );

drop policy if exists "perfis_update_admin" on public.perfis;

create policy "perfis_update_admin" on public.perfis
  for update using (
    public.current_user_is_admin ()
  );
