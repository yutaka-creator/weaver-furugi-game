
"use strict";

// ウィーバー高石 古着屋ゲーム Ver.0.4

const CONFIG = {
  maxCustomers: 5,
  specialChance: 0.20,
  walkSpeed: 110
};

const PRODUCTS = [
  {name:"ヴィンテージTシャツ",icon:"👕",price:1000},
  {name:"古着パーカー",icon:"🧥",price:1800},
  {name:"デニムパンツ",icon:"👖",price:1500},
  {name:"スタジャン",icon:"🧥",price:2500},
  {name:"キャップ",icon:"🧢",price:800},
  {name:"レトロスニーカー",icon:"👟",price:3200},
  {name:"ネルシャツ",icon:"👔",price:1300},
  {name:"ロゴスウェット",icon:"👕",price:1700},
  {name:"カーディガン",icon:"🧶",price:1600},
  {name:"花柄ワンピース",icon:"👗",price:2100},
  {name:"ロングコート",icon:"🧥",price:3500},
  {name:"チェックシャツ",icon:"👔",price:1200},
  {name:"ニットベスト",icon:"🦺",price:1400},
  {name:"チノパン",icon:"👖",price:1500},
  {name:"アロハシャツ",icon:"👕",price:1900}
];

const CUSTOMERS = [
  {
    name:"古着好きのお兄さん",
    skin:"#e8b78d",hair:"#49382f",
    shirt:"#71908b",pants:"#454c65",
    hairStyle:0
  },
  {
    name:"おしゃれなお姉さん",
    skin:"#f0c7a3",hair:"#6d4434",
    shirt:"#bf7469",pants:"#59506c",
    hairStyle:1
  },
  {
    name:"買い物好きのお客さん",
    skin:"#c78e6b",hair:"#312b30",
    shirt:"#d2a44f",pants:"#526b7c",
    hairStyle:2
  },
  {
    name:"レトロ好きのお客さん",
    skin:"#e3ab83",hair:"#79644b",
    shirt:"#8d7eaa",pants:"#625345",
    hairStyle:1
  }
];

const SPECIAL_CUSTOMERS = [
  {
    name:"謎の大富豪",
    type:"rich",
    skin:"#edc593",hair:"#333333",
    shirt:"#e0c15f",pants:"#473d55",
    hairStyle:2,
    rateMin:150,rateMax:250,
    successRate:0.90,
    line:"気に入った！高くても買おう！"
  },
  {
    name:"宇宙からのお客さん",
    type:"alien",
    skin:"#8bd887",hair:"#5aab69",
    shirt:"#7960af",pants:"#4f5988",
    hairStyle:0,
    rateMin:70,rateMax:140,
    successRate:0.75,
    line:"ワレワレハ……地球の服が欲しい……"
  },
  {
    name:"値切りの達人",
    type:"bargain",
    skin:"#dfaa85",hair:"#4c3630",
    shirt:"#bd7460",pants:"#514d58",
    hairStyle:2,
    rateMin:15,rateMax:45,
    successRate:0.30,
    line:"ふふふ……この値段ならどうかな？"
  },
  {
    name:"謎のダンサー",
    type:"dancer",
    skin:"#e7b48f",hair:"#68402e",
    shirt:"#ef799c",pants:"#546aa7",
    hairStyle:1,
    rateMin:70,rateMax:130,
    successRate:0.65,
    line:"ヘイ！この服で踊りたいぜ！"
  },
  {
    name:"ふしぎな幽霊",
    type:"ghost",
    skin:"#dfedf4",hair:"#b7c9d9",
    shirt:"#c4dce7",pants:"#b8c6e1",
    hairStyle:1,
    rateMin:65,rateMax:125,
    successRate:0.50,
    line:"この服……生きていた頃を思い出す……"
  }
];

const $ = id => document.getElementById(id);
const canvas = $("scene");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const game = {
  state:"title",
  sales:0,
  sold:0,
  successfulNegotiations:0,
  count:0,
  customer:null,
  product:null,
  offer:0,
  customerX:430,
  targetX:264,
  walking:false,
  emotion:"normal",
  time:0,
  lastTime:0,
  visitId:0,
  pendingTimer:null
};

const randomInt = (min,max) =>
  Math.floor(Math.random()*(max-min+1))+min;

const pick = arr => arr[randomInt(0,arr.length-1)];

const money = amount =>
  amount.toLocaleString("ja-JP")+"円";

function pixel(x,y,w,h,color){
  ctx.fillStyle=color;
  ctx.fillRect(Math.round(x),Math.round(y),w,h);
}

function showPanel(id){
  ["startPanel","playPanel","resultPanel"].forEach(panel=>{
    $(panel).classList.toggle("hidden",panel!==id);
  });
}

function updateStats(){
  $("sales").textContent=money(game.sales);
  $("progress").textContent=`${game.count} / ${CONFIG.maxCustomers}`;
}

function setActions(enabled){
  $("sellButton").disabled=!enabled;
  $("negotiateButton").disabled=!enabled;
}

// 店内を描画
function drawShop(){
  // 壁と床
  pixel(0,0,400,166,"#c5a47e");
  for(let x=0;x<400;x+=32)
    pixel(x,0,2,166,"#bb9974");

  pixel(0,0,400,12,"#765340");
  pixel(0,12,400,4,"#a17a54");

  pixel(0,166,400,74,"#a67a57");
  pixel(0,166,400,5,"#725039");

  for(let y=179;y<240;y+=15)
    pixel(0,y,400,2,"#916849");

  for(let x=0;x<400;x+=65)
    pixel(x,180,2,60,"#916849");

  // 店の看板
  pixel(134,21,132,39,"#594434");
  pixel(139,26,122,29,"#f0d8a4");

  ctx.fillStyle="#544335";
  ctx.textAlign="center";
  ctx.font="bold 13px monospace";
  ctx.fillText("WEAVER",200,40);
  ctx.font="7px monospace";
  ctx.fillText("VINTAGE SHOP",200,49);

  // 洋服ラック
  pixel(25,76,106,5,"#4b423e");
  pixel(31,80,4,77,"#4b423e");
  pixel(123,80,4,77,"#4b423e");

  const colors=[
    "#b75d50","#667c95","#d3b36b",
    "#7b9674","#ad819b"
  ];

  colors.forEach((color,i)=>{
    let x=35+i*18;
    pixel(x+7,82,3,6,"#413934");
    pixel(x+3,87,11,2,"#413934");
    pixel(x+3,90,12,37,color);
    pixel(x,92,4,19,color);
    pixel(x+14,92,4,19,color);
  });

  // 右の商品棚
  for(let y=60;y<=126;y+=33)
    pixel(350,y,36,6,"#6b4833");

  pixel(350,60,4,85,"#624734");
  pixel(382,60,4,85,"#624734");

  ["#638570","#d6ab67","#ae7e90"].forEach((c,i)=>{
    pixel(355,48+i*33,25,11,c);
  });

  // 窓
  pixel(283,67,62,62,"#72513f");
  pixel(288,72,52,52,"#a2bdb4");
  pixel(312,72,4,52,"#e0cda6");
  pixel(288,95,52,4,"#e0cda6");
  pixel(292,106,15,18,"#698b68");
  pixel(320,103,18,21,"#75976d");

  // 天井ライト
  pixel(194,0,4,20,"#514238");
  pixel(181,20,30,8,"#ddad61");
  pixel(186,28,20,6,"#f8dc91");

  drawClerk(75,114);

  // カウンター
  pixel(24,147,177,15,"#654632");
  pixel(30,162,165,61,"#8b5d40");
  pixel(37,170,151,46,"#9f6c49");
  pixel(30,217,165,8,"#603f30");
  pixel(47,177,56,2,"#b27d53");
  pixel(115,192,49,2,"#b27d53");

  // レジ
  pixel(124,128,44,20,"#454b48");
  pixel(131,119,30,13,"#7a8780");
  pixel(136,123,19,5,"#a7d0ae");
}

function drawClerk(x,y){
  pixel(x-17,y+20,35,36,"#435f4c");
  pixel(x-6,y+14,13,12,"#e4ae83");
  pixel(x-13,y-15,27,34,"#e4ae83");
  pixel(x-15,y-20,30,11,"#3e322e");
  pixel(x-15,y-13,6,12,"#3e322e");
  pixel(x-7,y+1,3,3,"#302b29");
  pixel(x+6,y+1,3,3,"#302b29");
  pixel(x-2,y+10,7,2,"#9c5848");
  pixel(x-8,y+27,17,23,"#c7a477");
}

// お客さんを描画
function drawCustomer(){
  const c=game.customer;
  if(!c)return;

  const x=Math.round(game.customerX);
  const isGhost=c.type==="ghost";

  ctx.save();

  if(isGhost)ctx.globalAlpha=0.67;

  let bounce=game.walking
    ?Math.sin(game.time*14)*2:0;

  if(c.type==="dancer")
    bounce+=Math.sin(game.time*12)*5;

  if(isGhost)
    bounce+=Math.sin(game.time*3)*8;

  const y=Math.round(116+bounce);

  // 影
  pixel(x-18,216,39,5,"#5b473e55");

  // 歩行アニメーション
  const step=game.walking
    ?Math.round(Math.sin(game.time*14)*5):0;

  pixel(x-11,y+64,9,29+step,c.pants);
  pixel(x+3,y+64,9,29-step,c.pants);
  pixel(x-14,y+90+step,13,6,"#383535");
  pixel(x+2,y+90-step,14,6,"#383535");

  // 服と腕
  pixel(x-17,y+29,35,39,c.shirt);
  pixel(x-23,y+33,8,29,c.shirt);
  pixel(x+17,y+33,8,29,c.shirt);
  pixel(x-23,y+58,8,8,c.skin);
  pixel(x+17,y+58,8,8,c.skin);

  // 首と顔
  pixel(x-6,y+20,13,12,c.skin);
  pixel(x-15,y-12,31,37,c.skin);
  pixel(x-19,y+1,5,10,c.skin);
  pixel(x+15,y+1,5,10,c.skin);

  // 髪
  if(c.type!=="alien"){
    pixel(x-17,y-21,35,13,c.hair);

    if(c.hairStyle===1){
      pixel(x-20,y-13,8,40,c.hair);
      pixel(x+13,y-13,8,40,c.hair);
    }else if(c.hairStyle===2){
      pixel(x-20,y-17,40,6,c.hair);
    }else{
      pixel(x-17,y-13,7,13,c.hair);
    }
  }else{
    // 宇宙人のアンテナ
    pixel(x-3,y-30,5,20,"#67b66f");
    pixel(x-7,y-36,13,9,"#a8ed9c");
  }

  // 表情
  if(game.emotion==="happy"){
    pixel(x-9,y+3,7,2,"#38302d");
    pixel(x+4,y+3,7,2,"#38302d");
    pixel(x-4,y+15,10,3,"#9f584d");
  }else if(game.emotion==="angry"){
    pixel(x-10,y+1,7,3,"#38302d");
    pixel(x+4,y+1,7,3,"#38302d");
    pixel(x-4,y+16,10,3,"#873f41");
  }else{
    pixel(x-8,y+4,3,4,"#302927");
    pixel(x+6,y+4,3,4,"#302927");
    pixel(x-3,y+15,8,2,"#9c6255");
  }

  // 特殊キャラクターの装飾
  if(c.type==="rich"){
    // サングラス
    pixel(x-12,y+1,11,8,"#26282c");
    pixel(x+3,y+1,11,8,"#26282c");
    pixel(x-1,y+3,4,2,"#26282c");

    // 金のネックレス
    pixel(x-6,y+32,12,4,"#eacf52");
  }

  if(c.type==="bargain"){
    // 眼鏡
    pixel(x-12,y+1,11,10,"#544333");
    pixel(x+3,y+1,11,10,"#544333");
    pixel(x-1,y+3,4,2,"#544333");
  }

  if(c.type==="dancer"){
    // 派手な帽子
    pixel(x-21,y-27,42,7,"#ee72ad");
    pixel(x-13,y-39,26,13,"#ee72ad");
  }

  // バッグ
  if(!isGhost){
    pixel(x+22,y+53,17,23,"#d9b581");
    pixel(x+25,y+47,11,7,"#8e7150");
  }

  ctx.restore();
}

// メインループ
function animate(timestamp){
  const dt=Math.min(
    (timestamp-(game.lastTime||timestamp))/1000,
    0.05
  );

  game.lastTime=timestamp;
  game.time+=dt;

  ctx.clearRect(0,0,400,240);
  drawShop();

  if(game.walking){
    const distance=game.targetX-game.customerX;
    const move=CONFIG.walkSpeed*dt;

    if(Math.abs(distance)<=move){
      game.customerX=game.targetX;
      game.walking=false;
      onWalkFinished();
    }else{
      game.customerX+=Math.sign(distance)*move;
    }
  }

  drawCustomer();
  requestAnimationFrame(animate);
}

// ゲーム開始
function startGame(){
  clearTimeout(game.pendingTimer);
  game.visitId++;
  game.sales=0;
  game.sold=0;
  game.successfulNegotiations=0;
  game.count=0;
  game.customer=null;
  game.walking=false;
  game.state="playing";

  showPanel("playPanel");
  updateStats();
  nextCustomer();
}

function nextCustomer(){
  if(game.count>=CONFIG.maxCustomers){
    finishGame();
    return;
  }

  game.count++;
  game.visitId++;

  game.product=pick(PRODUCTS);

  // 20%で特殊なお客さん
  const special=Math.random()<CONFIG.specialChance;

  game.customer=special
    ?pick(SPECIAL_CUSTOMERS)
    :pick(CUSTOMERS);

  const c=game.customer;

  // 大富豪・値切りの達人などは価格帯が違う
  const min=c.rateMin??60;
  const max=c.rateMax??120;
  const rate=randomInt(min,max)/100;

  game.offer=Math.max(
    100,
    Math.round(game.product.price*rate/100)*100
  );

  game.customerX=430;
  game.targetX=264;
  game.emotion="normal";
  game.walking=true;
  game.state="entering";

  $("customerName").textContent=c.name;
  $("customerCount").textContent=`${game.count}人目`;
  $("productIcon").textContent=game.product.icon;
  $("productName").textContent=game.product.name;
  $("basePrice").textContent=money(game.product.price);
  $("offerPrice").textContent=money(game.offer);

  $("dialogue").textContent="お客さんが来店しています…";
  $("message").textContent="";
  $("actions").classList.remove("hidden");
  $("nextButton").classList.add("hidden");

  setActions(false);
  $("shopStatus").textContent=
    special?"なにやら変わったお客さんが…":"お客さんが来店中";

  updateStats();
}

function onWalkFinished(){
  if(game.state==="entering"){
    game.state="choosing";

    const c=game.customer;
    const introduction=c.line?c.line+" ":"";

    $("dialogue").textContent=
      introduction+
      `この${game.product.name}、`+
      `${money(game.offer)}でください！`;

    $("shopStatus").textContent="値段交渉中";
    setActions(true);
  }

  if(game.state==="leaving"){
    game.customer=null;
    game.walking=false;

    if(game.count>=CONFIG.maxCustomers){
      finishGame();
    }else{
      nextCustomer();
    }
  }
}

// 売る
function sell(){
  if(game.state!=="choosing")return;

  game.sales+=game.offer;
  game.sold++;
  game.emotion="happy";
  game.state="resolved";

  $("dialogue").textContent=
    "ありがとうございます！いい買い物ができました！";

  $("message").textContent=
    `${money(game.offer)}で販売成立！`;

  updateStats();
  showNextButton();
}

// もう一声
function negotiate(){
  if(game.state!=="choosing")return;

  game.state="negotiating";
  setActions(false);

  $("dialogue").textContent="うーん、どうしようかな…";
  $("message").textContent="お客さんが考えています…";

  const visitId=game.visitId;

  game.pendingTimer=setTimeout(()=>{
    if(
      game.state!=="negotiating" ||
      game.visitId!==visitId
    )return;

    const successRate=
      game.customer.successRate??0.60;

    const success=Math.random()<successRate;

    if(success){
      const increase=randomInt(1,3)*100;
      const finalPrice=game.offer+increase;

      game.sales+=finalPrice;
      game.sold++;
      game.successfulNegotiations++;
      game.emotion="happy";

      $("dialogue").textContent=
        `わかりました！${money(finalPrice)}で買います！`;

      $("message").textContent=
        `交渉成功！ ＋${money(increase)}`;
    }else{
      game.emotion="angry";

      $("dialogue").textContent=
        "それなら今回はやめておきます…";

      $("message").textContent=
        "交渉失敗！売上は増えませんでした。";
    }

    game.state="resolved";
    updateStats();
    showNextButton();
  },900);
}

function showNextButton(){
  $("actions").classList.add("hidden");
  $("nextButton").classList.remove("hidden");

  $("nextButton").textContent=
    game.count>=CONFIG.maxCustomers
      ?"本日の結果を見る →"
      :"次のお客さんへ →";

  $("shopStatus").textContent="接客終了";
}

// 帰宅アニメーション
function leaveCustomer(){
  if(game.state!=="resolved")return;

  game.state="leaving";
  game.targetX=440;
  game.walking=true;

  $("nextButton").classList.add("hidden");
  $("dialogue").textContent="ありがとうございました！";
  $("shopStatus").textContent="お客さんがお帰りです";
}

// 結果発表
function finishGame(){
  game.state="finished";
  game.customer=null;

  showPanel("resultPanel");

  $("finalSales").textContent=money(game.sales);
  $("finalSold").textContent=`${game.sold}件`;
  $("finalSuccess").textContent=
    `${game.successfulNegotiations}回`;

  let comment;

  if(game.sales>=10000){
    comment="すごい！伝説の古着屋スタッフ！";
  }else if(game.sales>=6000){
    comment="いい感じ！あなたは交渉上手！";
  }else{
    comment="お疲れさま！次はもっと売れるかも！";
  }

  $("resultComment").textContent=comment;
  $("shopStatus").textContent="本日の営業終了";
}

// ボタン
$("startButton").addEventListener("click",startGame);
$("retryButton").addEventListener("click",startGame);
$("sellButton").addEventListener("click",sell);
$("negotiateButton").addEventListener("click",negotiate);
$("nextButton").addEventListener("click",leaveCustomer);

// 起動
updateStats();
requestAnimationFrame(animate);
