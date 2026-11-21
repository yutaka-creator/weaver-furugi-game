"use strict";
/*
 * Ranking: local-device demo OR Supabase anonymous-auth nationwide ranking.
 * No custom player ID is trusted as permission; Supabase Auth uid is the
 * persistent browser-scoped ID in online mode.
 */
const GameRanking=(()=>{
 const config=window.WEAVER_RANKING_CONFIG||{};
 const online=Boolean(config.supabaseUrl && config.supabasePublishableKey);
 const localKey='weaver_game_v06_rankings_demo_v1';
 const nameKey='weaver_game_v06_nickname_demo_v1';
 const idKey='weaver_game_v06_browser_id_demo_v1';
 let client=null, currentUser=null, ready=null;
 async function ensureSupabaseLibrary(){
   if(window.supabase?.createClient)return;
   await new Promise((resolve,reject)=>{
     const script=document.createElement('script');
     script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
     script.onload=resolve;script.onerror=()=>reject(new Error('Supabaseライブラリを読み込めませんでした'));
     document.head.appendChild(script);
   });
 }
 const pickId=()=>{try{let id=localStorage.getItem(idKey);if(!id){id=crypto.randomUUID();localStorage.setItem(idKey,id)}return id}catch(e){return 'temporary-player'}};
 const parseData=()=>{try{const obj=JSON.parse(localStorage.getItem(localKey)||'[]');return Array.isArray(obj)?obj:[]}catch{return []}};
 const persistData=data=>localStorage.setItem(localKey,JSON.stringify(data));
 const sortRows=rows=>rows.slice().sort((a,b)=>b.best_score-a.best_score||new Date(a.achieved_at)-new Date(b.achieved_at)||String(a.id).localeCompare(String(b.id)));
 const validate=(name,score)=>{
   const normalized=(name||'').trim();
   if([...normalized].length<1||[...normalized].length>10)throw new Error('ニックネームは1〜10文字で入力してください。');
   if(!/^[ぁ-んァ-ヶー一-龯々〆ヵヶa-zA-Z0-9・_ ]+$/u.test(normalized))throw new Error('ニックネームは日本語・英数字で入力してください。');
   if(/(?:https?|www|@|電話|住所)/i.test(normalized))throw new Error('個人情報やURLを含む名前は使えません。');
   if(!Number.isSafeInteger(score)||score<0||score>150000)throw new Error('売上記録を登録できません。');
   return normalized;
 };
 async function init(){
   if(!ready)ready=(async()=>{
     if(!online)return;
     await ensureSupabaseLibrary();
     client=window.supabase.createClient(config.supabaseUrl,config.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
     const {data:{session},error:sessionError}=await client.auth.getSession();
     if(sessionError)throw sessionError;
     let user=session?.user;
     if(!user){const {data,error}=await client.auth.signInAnonymously();if(error)throw error;user=data.user;}
     currentUser=user;
   })();
   return ready;
 }
 async function getProfile(){
   await init();
   if(!online){const id=pickId();const mine=parseData().find(r=>r.id===id);return mine?{nickname:mine.nickname,best_score:mine.best_score}:null;}
   const {data,error}=await client.rpc('weaver_get_my_score');
   if(error)throw error;
   return data?.[0]??null;
 }
 async function submit(name,score){
   const normalized=validate(name,score);
   await init();
   if(!online){
     const id=pickId(),rows=parseData(),index=rows.findIndex(r=>r.id===id);
     if(index<0)rows.push({id,nickname:normalized,best_score:score,achieved_at:new Date().toISOString()});
     else if(score>rows[index].best_score){rows[index].best_score=score;rows[index].achieved_at=new Date().toISOString();}
     // automatic name carryover; nickname isn't reset by a later submission
     persistData(rows);localStorage.setItem(nameKey,normalized);
     return {saved:true};
   }
   const {error}=await client.rpc('weaver_submit_score',{p_nickname:normalized,p_score:score});
   if(error)throw error;
   return {saved:true};
 }
 async function list(){
   await init();
   if(!online){
     const rows=sortRows(parseData()),myId=pickId();const index=rows.findIndex(r=>r.id===myId);
     return {top:rows.slice(0,10).map((r,i)=>({position:i+1,nickname:r.nickname,best_score:r.best_score,is_mine:r.id===myId})),mine:index<0?null:{position:index+1,nickname:rows[index].nickname,best_score:rows[index].best_score}};
   }
   const [topResult,mineResult]=await Promise.all([client.rpc('weaver_get_top10'),client.rpc('weaver_get_my_rank')]);
   if(topResult.error)throw topResult.error;
   if(mineResult.error)throw mineResult.error;
   return {top:topResult.data||[],mine:mineResult.data?.[0]||null};
 }
 return {init,getProfile,submit,list,online};
})();
