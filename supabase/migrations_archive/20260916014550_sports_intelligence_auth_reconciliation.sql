-- Motor de Inteligência Esportiva — alinhar a autorização privada ao vínculo canônico.
-- O runtime não deve depender de email/identificador de conta versionado no código.
begin;

create or replace function private.is_authorized_app_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
     and auth.uid() = private.approved_app_user_id()
     and exists (
       select 1
       from auth.users u
       where u.id = auth.uid()
         and coalesce(u.raw_app_meta_data ->> 'provider', '') = 'google'
     );
$$;

revoke all on function private.is_authorized_app_user() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_authorized_app_user() to authenticated, service_role;

commit;
