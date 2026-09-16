begin;

create or replace function public.sports_fixture_status_timestamps()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.status = 'FINISHED' then
    if tg_op = 'UPDATE' and old.finished_at is not null then
      new.finished_at := old.finished_at;
    elsif new.finished_at is null then
      new.finished_at := now();
    end if;
  elsif tg_op = 'UPDATE' and old.status = 'FINISHED' and new.status <> 'FINISHED' then
    new.finished_at := null;
  end if;
  return new;
end;
$$;

create trigger sports_fixture_status_timestamps_trigger
before insert or update of status, finished_at on public.sports_fixtures
for each row execute function public.sports_fixture_status_timestamps();

commit;
