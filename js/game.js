'use strict';
const $=id=>document.getElementById(id);
const el={customer:$('customer'),clerk:$('clerk'),product:$('product'),bubble:$('bubble'),sell:$('sell'),bargain:$('bargain'),scene:$('scene'),intro:$('intro'),result:$('result')};
const state={phase:'intro',round:0,total:0,sales:0,wins:0,tries:0,offer:0,item:null,customer:null,usedItems:new Set(),usedCustomers:new Set(),sound:true,customerAnim:null,animTick:0,runId:0};
const money=n=>`${n.toLocaleString('ja-JP')}円`;
const choose=arr=>arr[Math.floor(Math.random()*arr.length)];
const rand=(min,max)=>min+Math.floor(Math.random()*(max-min+1));
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const sprite=(pose)=>{const face=['idle','thinking','happy','worried','thanks'].includes(pose)?pose:'happy';el.clerk.src=`assets/clerk_overlay_${face}.png`;};
['idle','thinking','happy','worried','thanks'].forEach(p=>{const im=new Image();im.src=`assets/clerk_overlay_${p}.png`;});
const customerImage=(pose)=>`assets/customers/c${String(state.customer.id).padStart(2,'0')}/${pose}.png`;
function stopCustomerMotion(){if(state.customerAnim!==null){clearInterval(state.customerAnim);state.customerAnim=null}}
function customerPose(pose){if(state.customer)el.customer.src=customerImage(pose)}
function walkCustomer(){stopCustomerMotion();let frame=0;customerPose('walk_1');if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;state.customerAnim=setInterval(()=>{frame=(frame+1)%4;customerPose(`walk_${frame+1}`)},150)}
function showBubble(message){el.bubble.textContent=message}

function beep(freq=440,duration=.07){
  // Legacy fallback mapping: all existing calls now use original game effects.
  if(!state.sound)return;
  const type = freq >= 870 ? 'rare' : freq >= 850 ? 'result' : freq >= 720 ? 'sell'
    : freq >= 640 ? 'negotiate-ok' : freq >= 530 ? 'door'
    : freq >= 440 ? 'pickup' : freq >= 300 ? 'place' : 'negotiate-fail';
  GameAudio.effect(type);
}

function render(){const s=state;$('turn').textContent=`接客 ${Math.min(s.round,5)}/5`;$('total').textContent=`売上 ${money(s.total)}`;$('item').textContent=s.item?.name||'商品';$('base').textContent=money(s.item?.base||0);$('offer').textContent=money(s.offer);$('tries').textContent=s.tries+'回';$('hint').textContent=s.customer?.special?`💡 ${s.customer.hint}`:'';el.sell.disabled=el.bargain.disabled=s.phase!=='ready';$('tapNotice').hidden=s.phase!=='next';}
function getNext(){const eligibleItems=ITEMS.filter(it=>!state.usedItems.has(it.id));const rare=Math.random()<.10;const pool=eligibleItems.filter(it=>it.rare===rare);const item=choose(pool.length?pool:eligibleItems);state.usedItems.add(item.id);const special=Math.random()<.25;const eligible=CUSTOMERS.filter(c=>c.special===special&&!state.usedCustomers.has(c.id));const customer=choose(eligible.length?eligible:CUSTOMERS.filter(c=>!state.usedCustomers.has(c.id)));state.usedCustomers.add(customer.id);return {item,customer}}
function initialOffer(item,c){let percent=rand(20,200);if(c.special){if(c.kind===0)percent=rand(150,200);if(c.kind===2)percent=rand(20,50);if(c.kind===6)percent=rand(120,200)}return Math.max(100,Math.round(item.base*percent/100/100)*100)}
function successIncrement(c){let n=rand(1,3)*100;if(c.special){if(c.kind===1)n+=rand(2,5)*100;if(c.kind===3&&Math.random()<.30)n+=500;if(c.kind===7)n+=rand(3,6)*100}return n}
function failChance(){let n=FAIL_RATES[Math.min(state.tries-1,5)];const c=state.customer;if(c.special){if(c.kind===4)n-=.10;if(c.kind===5)n-=.15;if(c.kind===8)n+=.15;if(c.kind===9&&state.tries===1)n=0}return Math.max(0,Math.min(1,n))}
async function animateEnter(){
  const s=state;
  s.phase='enter';render();
  el.customer.className='sprite customer';
  el.customer.style.opacity='1';
  el.customer.style.transform=''; // 前のお客さんのインライン位置を持ち越さない
  el.product.classList.remove('handoff','placing','sold-transfer','failed-item');
  el.product.src=`assets/items/${s.item.id}.png`;
  el.product.style.opacity='0';
  customerPose('idle');sprite('idle');
  showBubble(`${s.customer.name}が来店しました！`);
  void el.customer.offsetWidth;
  el.customer.classList.add('entering');walkCustomer();GameAudio.effect('door');
  await delay(1500);
  stopCustomerMotion();customerPose('idle');
  el.customer.classList.remove('entering');
  el.customer.style.transform='translateX(0)';

  // 3つの場面を600msで連続再生。商品は1つのDOM要素だけを動かす。
  s.phase='placing';render();
  showBubble('この古着を見てください！');
  sprite('thinking');
  el.product.style.opacity='1';
  void el.product.offsetWidth;
  el.customer.classList.add('handing');
  el.product.classList.add('handoff');
  GameAudio.effect('pickup');
  await delay(600);
  el.customer.classList.remove('handing');
  el.product.classList.remove('handoff');
  el.product.style.opacity='1';
  sprite('idle');
  GameAudio.effect('place');

  showBubble(choose([
    'これ、いくらで買ってくれる？',
    'いいもの見つけた！ この値段はどう？',
    'この古着、気に入ったんだ！'
  ]));
  if(s.item.rare){
    $('sparkle').classList.add('show');GameAudio.effect('rare');
    setTimeout(()=>$('sparkle').classList.remove('show'),850);
  }
  s.phase='ready';render();
}
async function startRound(){const s=state;s.round++;s.tries=0;const next=getNext();s.item=next.item;s.customer=next.customer;s.offer=initialOffer(s.item,s.customer);await animateEnter()}
// 成功: 商品をお客さんへ渡す → 喜んで退店
// 失敗: 商品をカウンターに残す → がっかりして退店
async function finish(sold){
  if(state.phase!=='ready' && state.phase!=='thinking')return;
  const token=state.runId;
  state.phase='reaction';
  render();
  stopCustomerMotion();
  el.product.classList.remove('handoff','placing','sold-transfer','failed-item');
  el.customer.classList.remove('handing','reaction-success','reaction-fail','leaving-success','leaving-fail');
  customerPose(sold?'happy':'disappointed');
  sprite(sold?'thanks':'worried');
  if(sold){
    state.total+=state.offer;
    state.sales++;
    showBubble(`${money(state.offer)}で販売成立！ ありがとうございました！`);
    el.customer.classList.add('reaction-success');
    el.product.style.opacity='1';
    void el.product.offsetWidth;
    el.product.classList.add('sold-transfer');
    GameAudio.effect('sell');
    await delay(800);
    if(token!==state.runId)return;
    el.product.classList.remove('sold-transfer');
    el.product.style.opacity='0';
  }else{
    showBubble('残念！ 交渉が決裂した…');
    el.customer.classList.add('reaction-fail');
    el.product.classList.add('failed-item');
    el.product.style.opacity='1';
    GameAudio.effect('negotiate-fail');
    await delay(800);
    if(token!==state.runId)return;
  }
  el.customer.classList.remove('reaction-success','reaction-fail');
  state.phase='depart';
  render();
  // 退店中の足運びは既存の歩行4コマを使用
  walkCustomer();
  // 退店アニメーションは毎回初期位置から再生
  void el.customer.offsetWidth;
  el.customer.classList.add(sold?'leaving-success':'leaving-fail');
  await delay(sold?1150:1550);
  if(token!==state.runId)return;
  stopCustomerMotion();
  el.customer.classList.remove('leaving-success','leaving-fail');
  el.customer.style.opacity='0';
  el.product.classList.remove('failed-item');
  state.phase='next';
  sprite('idle');
  showBubble(state.round===5?'本日の営業終了！ 画面をタップして結果へ':'お客さんが帰りました。画面をタップして次へ！');
  render();
}
async function negotiate(){if(state.phase!=='ready')return;const token=state.runId;state.phase='thinking';state.tries++;render();sprite('thinking');customerPose('thinking');el.bubble.textContent='うーん、どうしようかな…';GameAudio.effect('thinking');await delay(1000);if(token!==state.runId)return;if(Math.random()<failChance()){await finish(false)}else{const inc=successIncrement(state.customer);state.offer+=inc;state.wins++;el.bubble.textContent=choose([`それなら、あと${money(inc)}出すよ！`,'うん、もう少し高くてもいいよ！','よし！ それで考えてみよう！']);sprite('happy');customerPose('happy');GameAudio.effect('negotiate-ok');state.phase='ready';render()}}
function showResult(){state.phase='results';$('resultTotal').textContent=money(state.total);$('resultTitle').textContent=TITLES.find(t=>state.total>=t.min).name;$('resultSales').textContent=state.sales+'件';$('resultWins').textContent=state.wins+'回';el.result.hidden=false;GameAudio.effect('result');RankingUI.onResult(state.total)}
function reset(){stopCustomerMotion();state.runId++;Object.assign(state,{phase:'setup',round:0,total:0,sales:0,wins:0,tries:0,offer:0,item:null,customer:null,usedItems:new Set(),usedCustomers:new Set()});el.result.hidden=true;el.intro.hidden=true;startRound()}
el.sell.addEventListener('click',()=>{if(state.phase==='ready')finish(true)});el.bargain.addEventListener('click',negotiate);$('start').addEventListener('click',()=>{GameAudio.start();GameAudio.effect('tap');reset()});$('restart').addEventListener('click',()=>{GameAudio.start();reset()});$('sound').addEventListener('click',()=>{state.sound=!state.sound;GameAudio.setEnabled(state.sound);$('sound').textContent=state.sound?'🔊':'🔇';$('sound').setAttribute('aria-label',state.sound?'サウンドをオフにする':'サウンドをオンにする');$('sound').setAttribute('aria-pressed',String(state.sound));});document.getElementById('game').addEventListener('pointerup',e=>{if(state.phase!=='next'||e.target.closest('button'))return;state.phase='transition';render();if(state.round>=5)showResult();else startRound()});render();
