"use strict";
const RankingUI=(()=>{
 const byId=id=>document.getElementById(id);
 const resultStatus=()=>byId('rankingResultStatus');
 let registeredName=null;
 let currentScore=null;
 let busy=false;
 let lastDisplayContext='intro';
 const fmt=n=>Number(n).toLocaleString('ja-JP')+'円';
 function status(message){resultStatus().textContent=message}
 async function onResult(score){
   currentScore=score;
   byId('rankingRegisterForm').hidden=true;
   status('記録を確認しています…');
   try{
     const profile=await GameRanking.getProfile();
     if(!profile){registeredName=null;byId('rankingRegisterForm').hidden=false;status('初回は名前を登録するとランキングに参加できるよ。登録しなくても遊べます。');return;}
     registeredName=profile.nickname;
     if(score>Number(profile.best_score)){
       status('自己ベスト更新！ ランキングに反映中…');
       try {await GameRanking.submit(registeredName,score);status(`🎉 自己ベスト更新！ ${fmt(score)} を登録したよ。`)}
       catch(err){status('更新できませんでした：'+String(err.message||err))}
     }else status(`${registeredName}さんの最高売上は${fmt(profile.best_score)}。もう一度挑戦しよう！`);
   }catch(err){status('ランキングの接続に失敗しました：'+String(err.message||err))}
 }
 async function register(e){
   e.preventDefault();if(busy)return;
   busy=true;byId('rankingRegisterButton').disabled=true;
   try{
     const name=byId('rankingNickname').value;
     status('ランキングに登録しています…');
     await GameRanking.submit(name,currentScore);
     const profile=await GameRanking.getProfile();
     registeredName=profile?.nickname||name.trim();
     byId('rankingRegisterForm').hidden=true;
     status(`🎉 ${registeredName}さん、${fmt(currentScore)} を登録したよ！`);
   }catch(err){status('登録できませんでした：'+String(err.message||err));}
   finally{busy=false;byId('rankingRegisterButton').disabled=false;}
 }
 function setLoading(text){byId('rankingLoading').hidden=false;byId('rankingLoading').textContent=text}
 function appendRank(entry){
   const li=document.createElement('li');if(entry.is_mine)li.className='mine';
   const left=document.createElement('span');left.className='rank-left';
   const num=document.createElement('span');num.className='rank-num';
   const n=Number(entry.position);num.textContent=n===1?'🥇':n===2?'🥈':n===3?'🥉':n+'位';
   const name=document.createElement('span');name.className='rank-name';name.textContent=entry.nickname||'名無し';
   const score=document.createElement('span');score.className='rank-score';score.textContent=fmt(entry.best_score);
   left.append(num,name);li.append(left,score);byId('rankingList').append(li);
 }
 async function open(source){
   lastDisplayContext=source;
   byId('rankingOverlay').hidden=false;
   byId('rankingMode').textContent=GameRanking.online?'全国ランキング（Supabase接続中）':'この端末だけのテストランキング（全国共有は未接続）';
   byId('rankingList').replaceChildren();byId('rankingMine').textContent='あなたの順位：確認中';
   setLoading('ランキングを読み込み中…');
   try{
     const {top,mine}=await GameRanking.list();
     if(top.length){top.forEach(appendRank);byId('rankingLoading').hidden=true;}
     else setLoading('まだ登録がありません。最初の記録に挑戦しよう！');
     byId('rankingMine').textContent=mine?`あなた：${mine.position}位 / ${fmt(mine.best_score)}（${mine.nickname}）`:'あなたの順位：未登録';
   }catch(err){setLoading('ランキングを読み込めませんでした：'+String(err.message||err));byId('rankingMine').textContent='接続できませんでした';}
 }
 function close(){byId('rankingOverlay').hidden=true}
 function setup(){
   byId('rankingRegisterForm').addEventListener('submit',register);
   byId('rankingFromIntro').addEventListener('click',()=>open('intro'));
   byId('rankingFromResult').addEventListener('click',()=>open('result'));
   byId('rankingClose').addEventListener('click',close);
 }
 return {setup,onResult,open};
})();
RankingUI.setup();
