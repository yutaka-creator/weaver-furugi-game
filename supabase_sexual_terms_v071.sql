-- 古着屋ゲーム Ver.0.7.1: 性的・卑猥な表現の禁止語追加
-- 前提: ニックネーム安全対策 v14 のSQL適用済み
-- 既存のランキング記録・スコア・アカウントは削除しません。
-- 既存のweaver_submit_score関数が禁止語表を参照して判定します。
-- 公開リスト LDNOOBW (CC BY 4.0) を参考に、必要な語のみ人手で選定・追加。
-- https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words

begin;

alter table public.weaver_game_blocked_terms enable row level security;
revoke all on public.weaver_game_blocked_terms from public, anon, authenticated;

insert into public.weaver_game_blocked_terms(term) values
  ('おっぱい'),
  ('オッパイ'),
  ('おつぱい'),
  ('乳首'),
  ('ちくび'),
  ('チクビ'),
  ('巨乳'),
  ('陰毛'),
  ('アナル'),
  ('あなる'),
  ('ペニス'),
  ('ぺにす'),
  ('オナニー'),
  ('おなにー'),
  ('マスターベーション'),
  ('まんこ'),
  ('マンコ'),
  ('ちんこ'),
  ('チンコ'),
  ('ちんぽ'),
  ('チンポ'),
  ('フェラ'),
  ('ふぇら'),
  ('フェラチオ'),
  ('クンニ'),
  ('くんに'),
  ('セックス'),
  ('せっくす'),
  ('性交'),
  ('性行為'),
  ('射精'),
  ('しゃせい'),
  ('中出し'),
  ('なかだし'),
  ('潮吹き'),
  ('しおふき'),
  ('精液'),
  ('せいえき'),
  ('勃起'),
  ('ぼっき'),
  ('ポルノ'),
  ('ぽるの'),
  ('レイプ'),
  ('れいぷ'),
  ('強姦'),
  ('輪姦'),
  ('乱交'),
  ('パイパン'),
  ('ぱいぱん'),
  ('ディルド'),
  ('性器'),
  ('せいき'),
  ('porn'),
  ('hentai'),
  ('xxx'),
  ('blowjob'),
  ('handjob'),
  ('dildo'),
  ('pussy'),
  ('dick'),
  ('fuck'),
  ('fucking'),
  ('rape'),
  ('boobs'),
  ('tits')
on conflict (term) do nothing;

commit;

-- 注意: 既存の登録済みの名前は自動で消えません。
-- 単語リストの判定は万能ではなく、誤検知/見逃しの管理者確認が必要です。
