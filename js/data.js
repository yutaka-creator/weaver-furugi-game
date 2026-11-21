'use strict';
const ITEMS=[
['tshirt','Tシャツ',800],['logo_tee','ロゴTシャツ',1000],['aloha','アロハシャツ',1500],['check','チェックシャツ',1200],['hoodie','パーカー',1800],['sweat','スウェット',1500],['cardigan','カーディガン',1600],['vest','ニットベスト',1300],['denim','デニムパンツ',1800],['chino','チノパン',1200],['dress','ワンピース',2000],['jacket','ジャケット',2500],['coat','ロングコート',3500],['cap','キャップ',800],['sneaker','スニーカー',3000],['windbreaker','90年代ウインドブレーカー',4000],['stadium','ヴィンテージスタジャン',5000],['retro_shoe','幻のレトロスニーカー',6000],['loud_sweater','謎の派手柄セーター',3500]
].map(([id,name,base])=>({id,name,base,rare:ITEM_RARE(id)}));
function ITEM_RARE(id){return ['windbreaker','stadium','retro_shoe','loud_sweater'].includes(id)}
const REGULAR_NAMES=['カジュアルな若者','おしゃれな大学生','眼鏡の会社員','元気な学生','キャップの青年','優しいお姉さん','旅好きの男性','本好きの女性','音楽好き','スポーツ好き','個性的な女性','陽気なおじさん','帽子のお姉さん','古着初心者','落ち着いた紳士'];
const SPECIAL_NAMES=['大富豪','宇宙人','値切りの達人','ダンサー','幽霊','ロボット','タイムトラベラー','伝説の古着コレクター','筋肉客','猫好き'];
const HINTS=['財布のひもが緩いようだ','地球の値段感覚が少し不思議','最初は厳しい金額を提示してくる','気分が乗ると大盤振る舞い！','交渉に長く付き合ってくれそう','冷静で交渉を続けやすそう','昔の価値をよく知っている','価値ある古着には目がない','勢いがすごい。交渉は慎重に','最初のお願いには優しいかも'];
const CUSTOMERS=[...REGULAR_NAMES.map((name,i)=>({id:i,name,special:false,hint:''})),...SPECIAL_NAMES.map((name,i)=>({id:i+15,name,special:true,kind:i,hint:HINTS[i]}))];
const FAIL_RATES=[.10,.25,.50,.75,.90,.95];
const TITLES=[{min:15000,name:'伝説の店長'},{min:10000,name:'カリスマ店員'},{min:6000,name:'商売上手'},{min:3000,name:'見習いバイヤー'},{min:0,name:'新人店員'}];
