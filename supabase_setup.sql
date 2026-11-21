-- ウィーバー高石 古着屋ゲーム Ver.0.6 全国ランキング
-- Supabase SQL Editor で実行。匿名ログイン機能を Auth > Providers で有効化してから使用。
-- ブラウザごとに匿名 Auth ユーザーを発行するので、ログイン画面は不要。
-- 注意: JavaScript製ゲームのスコア自体の真正性は検証できません。

create table if not exists public.weaver_game_scores (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  best_score integer not null default 0,
  achieved_at timestamptz not null default now(),
  last_submission_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint weaver_game_score_range check (best_score between 0 and 150000),
  constraint weaver_game_nickname_length check (char_length(nickname) between 1 and 10)
);
create index if not exists idx_weaver_game_rank
  on public.weaver_game_scores(best_score desc, achieved_at asc, user_id asc);
alter table public.weaver_game_scores enable row level security;
-- Browser clients have no direct read/write access: RPC functions only.
revoke all on public.weaver_game_scores from anon, authenticated, public;

-- 管理者がブロック語を追加するための表（初期状態は空）。
create table if not exists public.weaver_game_blocked_terms (
  term text primary key
);
alter table public.weaver_game_blocked_terms enable row level security;
revoke all on public.weaver_game_blocked_terms from anon, authenticated, public;

create or replace function public.weaver_submit_score(p_nickname text, p_score integer)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_name text := btrim(p_nickname);
  v_old public.weaver_game_scores%rowtype;
begin
  if v_user_id is null then
    raise exception 'ログイン認証が必要です';
  end if;
  if v_name is null or char_length(v_name) not between 1 and 10
     or v_name !~ '^[ぁ-んァ-ヶー一-龯々〆ヵヶa-zA-Z0-9・_ ]+$'
     or v_name ~* '(https?|www|電話|住所|@)'
     or v_name ~ '[0-9]{7,}' then
    raise exception 'ニックネームを確認してください';
  end if;
  if exists(select 1 from public.weaver_game_blocked_terms t
            where position(lower(t.term) in lower(v_name))>0) then
    raise exception 'このニックネームは使えません';
  end if;
  if p_score is null or p_score < 0 or p_score > 150000 or mod(p_score,100) <> 0 then
    raise exception '売上が不正です';
  end if;
  -- Same user submissions are serialized. This protects the highest-score rule.
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 17));
  select * into v_old from public.weaver_game_scores where user_id = v_user_id;
  if found then
    if v_old.nickname <> v_name then
      raise exception '登録済みニックネームを使ってください';
    end if;
    if p_score <= v_old.best_score then
      return;
    end if;
    if now() < v_old.last_submission_at + interval '30 seconds' then
      raise exception '短時間の連続登録はできません';
    end if;
    update public.weaver_game_scores
       set best_score=p_score, achieved_at=now(), last_submission_at=now()
     where user_id=v_user_id;
  else
    insert into public.weaver_game_scores(user_id,nickname,best_score,achieved_at,last_submission_at)
    values(v_user_id,v_name,p_score,now(),now());
  end if;
end;
$$;

create or replace function public.weaver_get_top10()
returns table(position bigint, nickname text, best_score integer, is_mine boolean)
language sql security definer stable set search_path = '' as $$
  select (row_number() over(order by best_score desc, achieved_at asc, user_id asc))::bigint,
         nickname, best_score, (user_id = auth.uid()) as is_mine
  from public.weaver_game_scores
  order by best_score desc, achieved_at asc, user_id asc
  limit 10;
$$;

create or replace function public.weaver_get_my_score()
returns table(nickname text, best_score integer)
language sql security definer stable set search_path = '' as $$
  select s.nickname,s.best_score from public.weaver_game_scores s
  where s.user_id=auth.uid() limit 1;
$$;

create or replace function public.weaver_get_my_rank()
returns table(position bigint, nickname text, best_score integer)
language sql security definer stable set search_path = '' as $$
  select 1+(select count(*) from public.weaver_game_scores other
     where other.best_score > me.best_score
       or (other.best_score=me.best_score and other.achieved_at < me.achieved_at)
       or (other.best_score=me.best_score and other.achieved_at=me.achieved_at and other.user_id < me.user_id)),
       me.nickname, me.best_score
  from public.weaver_game_scores me
  where me.user_id=auth.uid();
$$;

revoke all on function public.weaver_submit_score(text,integer) from public,anon;
revoke all on function public.weaver_get_top10() from public,anon;
revoke all on function public.weaver_get_my_score() from public,anon;
revoke all on function public.weaver_get_my_rank() from public,anon;
grant execute on function public.weaver_submit_score(text,integer) to authenticated;
grant execute on function public.weaver_get_top10() to authenticated;
grant execute on function public.weaver_get_my_score() to authenticated;
grant execute on function public.weaver_get_my_rank() to authenticated;
