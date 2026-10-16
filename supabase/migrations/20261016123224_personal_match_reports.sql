begin;

-- Personal, user-entered journal. Never a source of official fixtures or statistics.
create table if not exists public.sports_personal_match_reports (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  home_team text not null check (length(btrim(home_team)) between 1 and 120),
  away_team text not null check (length(btrim(away_team)) between 1 and 120),
  competition text check (competition is null or length(competition) <= 180),
  kickoff_at timestamptz not null,
  notes text not null default '' check (length(notes) <= 4000),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists personal_match_reports_owner_updated
  on public.sports_personal_match_reports(owner_id, updated_at desc, id desc);

alter table public.sports_personal_match_reports enable row level security;
revoke all on public.sports_personal_match_reports from public, anon, authenticated;
grant select, delete on public.sports_personal_match_reports to authenticated;
grant insert(id,owner_id,home_team,away_team,competition,kickoff_at,notes)
  on public.sports_personal_match_reports to authenticated;
grant update(home_team,away_team,competition,kickoff_at,notes)
  on public.sports_personal_match_reports to authenticated;
grant all on public.sports_personal_match_reports to service_role;

drop policy if exists personal_report_select on public.sports_personal_match_reports;
create policy personal_report_select on public.sports_personal_match_reports for select to authenticated
using (owner_id = (select auth.uid()) and (select public.is_approved_app_user()));
drop policy if exists personal_report_insert on public.sports_personal_match_reports;
create policy personal_report_insert on public.sports_personal_match_reports for insert to authenticated
with check (owner_id = (select auth.uid()) and (select public.is_approved_app_user()));
drop policy if exists personal_report_update on public.sports_personal_match_reports;
create policy personal_report_update on public.sports_personal_match_reports for update to authenticated
using (owner_id = (select auth.uid()) and (select public.is_approved_app_user()))
with check (owner_id = (select auth.uid()) and (select public.is_approved_app_user()));
drop policy if exists personal_report_delete on public.sports_personal_match_reports;
create policy personal_report_delete on public.sports_personal_match_reports for delete to authenticated
using (owner_id = (select auth.uid()) and (select public.is_approved_app_user()));

create or replace function private.touch_personal_match_report()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.version := old.version + 1;
  new.created_at := old.created_at;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
revoke all on function private.touch_personal_match_report() from public, anon, authenticated;
drop trigger if exists personal_report_touch on public.sports_personal_match_reports;
create trigger personal_report_touch before update on public.sports_personal_match_reports
for each row execute function private.touch_personal_match_report();

-- Invoker + RLS: this RPC never borrows the service role's privileges.
-- A client-generated id makes retries safe when the first acknowledgement is lost.
create or replace function public.save_personal_match_report(
  p_id uuid, p_version integer, p_home_team text, p_away_team text,
  p_competition text, p_kickoff_at timestamptz, p_notes text
)
returns setof public.sports_personal_match_reports
language plpgsql security invoker set search_path = '' as $$
declare v_report public.sports_personal_match_reports;
begin
  if not coalesce(public.is_approved_app_user(), false) then
    raise exception using errcode = '42501', message = 'Account not authorized';
  end if;
  if p_id is null or p_version is null or p_version < 0 or p_notes is null then
    raise exception using errcode = '22023', message = 'Invalid personal report';
  end if;

  if p_version = 0 then
    insert into public.sports_personal_match_reports(id,owner_id,home_team,away_team,competition,kickoff_at,notes)
    values(p_id,auth.uid(),btrim(p_home_team),btrim(p_away_team),nullif(btrim(p_competition),''),p_kickoff_at,p_notes)
    on conflict (id) do nothing returning * into v_report;
  else
    update public.sports_personal_match_reports
    set home_team=btrim(p_home_team), away_team=btrim(p_away_team),
        competition=nullif(btrim(p_competition),''), kickoff_at=p_kickoff_at, notes=p_notes
    where id=p_id and owner_id=auth.uid() and version=p_version
    returning * into v_report;
  end if;
  if found then return next v_report; return; end if;

  select * into v_report from public.sports_personal_match_reports
  where id=p_id and owner_id=auth.uid();
  -- Same successful write repeated after a lost response: return its saved version.
  if found and v_report.version=p_version+1
     and v_report.home_team=btrim(p_home_team) and v_report.away_team=btrim(p_away_team)
     and v_report.competition is not distinct from nullif(btrim(p_competition),'')
     and v_report.kickoff_at=p_kickoff_at and v_report.notes=p_notes then
    return next v_report; return;
  end if;
  raise exception using errcode = '40001', message = 'Personal report changed; reload before saving';
end;
$$;
revoke all on function public.save_personal_match_report(uuid,integer,text,text,text,timestamptz,text)
  from public, anon;
grant execute on function public.save_personal_match_report(uuid,integer,text,text,text,timestamptz,text)
  to authenticated;

create or replace function public.erase_user_application_data(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_push integer := 0; v_reviews integer := 0; v_reports integer := 0;
begin
  if p_user_id is null then raise exception 'user id is required'; end if;
  delete from public.push_subscriptions where user_id=p_user_id;
  get diagnostics v_push = row_count;
  delete from public.sports_match_reviews where owner_id=p_user_id;
  get diagnostics v_reviews = row_count;
  delete from public.sports_personal_match_reports where owner_id=p_user_id;
  get diagnostics v_reports = row_count;
  return jsonb_build_object('push_deleted',v_push,'reviews_deleted',v_reviews,'personal_reports_deleted',v_reports);
end;
$$;
revoke all on function public.erase_user_application_data(uuid) from public, anon, authenticated;
grant execute on function public.erase_user_application_data(uuid) to service_role;

comment on table public.sports_personal_match_reports is
  'Private user-entered match reports. Not official fixtures, provider facts, player profiles or statistics.';
commit;
