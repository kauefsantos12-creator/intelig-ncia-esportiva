begin;

-- Reuse the private review/rating stores. This never writes provider participation or statistics.
create or replace function public.save_pitch_player_rating(
  p_fixture_id uuid, p_player_id uuid, p_rating numeric,
  p_confirmed boolean, p_expected_updated_at timestamptz
)
returns setof public.sports_player_personal_ratings
language plpgsql security invoker set search_path = '' as $$
declare
  v_fixture public.sports_fixtures;
  v_review public.sports_match_reviews;
  v_rating public.sports_player_personal_ratings;
  v_has_rating boolean;
begin
  if not coalesce(public.is_approved_app_user(), false) then
    raise exception using errcode='42501', message='Account not authorized';
  end if;
  if p_fixture_id is null or p_player_id is null or
     (p_rating is not null and (p_rating < 0 or p_rating > 10 or p_rating*2 <> trunc(p_rating*2))) then
    raise exception using errcode='22023', message='Invalid personal rating';
  end if;
  if p_rating is not null and p_confirmed is distinct from true then
    raise exception using errcode='22023', message='Confirm that you watched this player participate';
  end if;
  select * into v_fixture from public.sports_fixtures where id=p_fixture_id;
  if not found then raise exception using errcode='22023', message='Fixture unavailable'; end if;
  if p_rating is not null and v_fixture.kickoff_at > clock_timestamp() then
    raise exception using errcode='22023', message='Fixture has not started';
  end if;
  if not exists(select 1 from public.sports_fixture_lineups l where l.fixture_id=p_fixture_id
      and l.player_id=p_player_id and l.team_id in (v_fixture.home_team_id,v_fixture.away_team_id))
     and not exists(select 1 from public.sports_fixture_player_stats s where s.fixture_id=p_fixture_id
      and s.player_id=p_player_id and s.team_id in (v_fixture.home_team_id,v_fixture.away_team_id)) then
    raise exception using errcode='22023', message='Player is not related to this fixture';
  end if;

  select * into v_review from public.sports_match_reviews
  where owner_id=auth.uid() and fixture_id=p_fixture_id for update;
  if not found then
    if p_rating is null then return; end if;
    insert into public.sports_match_reviews(owner_id,fixture_id,watched)
    values(auth.uid(),p_fixture_id,true) on conflict(owner_id,fixture_id) do nothing;
    select * into v_review from public.sports_match_reviews
    where owner_id=auth.uid() and fixture_id=p_fixture_id for update;
  end if;
  if v_review.id is null then raise exception using errcode='42501',message='Review unavailable'; end if;

  select * into v_rating from public.sports_player_personal_ratings
  where review_id=v_review.id and player_id=p_player_id for update;
  v_has_rating := found;
  -- Acknowledgement lost: same value can be safely read back without another write.
  if v_has_rating and v_rating.rating is not distinct from p_rating then
    return next v_rating; return;
  end if;
  if v_review.status <> 'PENDING' then
    raise exception using errcode='55000', message='Review is finalized';
  end if;
  if (v_has_rating and v_rating.updated_at is distinct from p_expected_updated_at)
     or (not v_has_rating and p_expected_updated_at is not null) then
    raise exception using errcode='40001', message='Personal rating changed; reload before saving';
  end if;
  if p_rating is not null then
    update public.sports_match_reviews set watched=true,updated_at=clock_timestamp() where id=v_review.id;
  end if;
  if v_has_rating then
    update public.sports_player_personal_ratings set rating=p_rating,
      participation_state=case when p_rating is not null then 'PARTICIPATED' else participation_state end,
      updated_at=greatest(clock_timestamp(),v_rating.updated_at+interval '1 microsecond')
    where review_id=v_review.id and player_id=p_player_id returning * into v_rating;
  elsif p_rating is not null then
    insert into public.sports_player_personal_ratings(review_id,player_id,participation_state,rating)
    values(v_review.id,p_player_id,'PARTICIPATED',p_rating) returning * into v_rating;
  else return;
  end if;
  return next v_rating;
end;
$$;
revoke all on function public.save_pitch_player_rating(uuid,uuid,numeric,boolean,timestamptz) from public,anon;
grant execute on function public.save_pitch_player_rating(uuid,uuid,numeric,boolean,timestamptz) to authenticated;
comment on function public.save_pitch_player_rating(uuid,uuid,numeric,boolean,timestamptz) is
  'Private personal rating 0..10 step 0.5, explicit user observation, owned review, optimistic concurrency. Never provider facts.';
commit;
