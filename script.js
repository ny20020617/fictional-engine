const CHARACTERS = [
  ["hokuto","氷鷹北斗","Trickstar"],["subaru","明星スバル","Trickstar"],["makoto","遊木真","Trickstar"],["mao","衣更真緒","Trickstar"],
  ["eichi","天祥院英智","fine"],["wataru","日々樹渉","fine"],["tori","姫宮桃李","fine"],["yuzuru","伏見弓弦","fine"],
  ["chiaki","守沢千秋","流星隊"],["kanata","深海奏汰","流星隊"],["midori","高峯翠","流星隊"],["shinobu","仙石忍","流星隊"],["tetora","南雲鉄虎","流星隊"],
  ["hiiro","天城一彩","ALKALOID"],["aira","白鳥藍良","ALKALOID"],["mayoi","礼瀬マヨイ","ALKALOID"],["tatsumi","風早巽","ALKALOID"],
  ["rinne","天城燐音","Crazy:B"],["himeru","HiMERU","Crazy:B"],["kohaku","桜河こはく","Crazy:B"],["niki","椎名ニキ","Crazy:B"],
  ["rei","朔間零","UNDEAD"],["kaoru","羽風薫","UNDEAD"],["koga","大神晃牙","UNDEAD"],["adonis","乙狩アドニス","UNDEAD"],
  ["tomoya","真白友也","Ra*bits"],["nazuna","仁兎なずな","Ra*bits"],["mitsuru","天満光","Ra*bits"],["hajime","紫之創","Ra*bits"],
  ["keito","蓮巳敬人","紅月"],["kuro","鬼龍紅郎","紅月"],["souma","神崎颯馬","紅月"],
  ["tsukasa","朱桜司","Knights"],["leo","月永レオ","Knights"],["izumi","瀬名泉","Knights"],["ritsu","朔間凛月","Knights"],["arashi","鳴上嵐","Knights"],
  ["natsume","逆先夏目","Switch"],["tsumugi","青葉つむぎ","Switch"],["sora","春川宙","Switch"],
  ["hiyori","巴日和","Eden"],["ibara","七種茨","Eden"],["jun","漣ジュン","Eden"],["nagisa","乱凪砂","Eden"],
  ["mika","影片みか","Valkyrie"],["shu","斎宮宗","Valkyrie"],
  ["hinata","葵ひなた","2wink"],["yuta","葵ゆうた","2wink"],
  ["madara","三毛縞斑","MaM"],["jin","佐賀美陣","教師"],["sawako","椚章臣","教師"]
].map(([id,name,unit])=>({id,name,unit,image:`images/${id}.svg`}));

const $ = id => document.getElementById(id);
const screens = ["start","select","battle","result"];
let selected = new Set();
let pool = [];
let queue = [];
let ranking = [];
let battleCount = 0;

function show(id){
  screens.forEach(s=>$(s).classList.toggle("active",s===id));
  window.scrollTo({top:0,behavior:"instant"});
}

function avatar(c){
  return c.image;
}

function renderSelection(){
  const grid=$("characterGrid");
  grid.innerHTML="";
  CHARACTERS.forEach(c=>{
    const el=document.createElement("article");
    el.className="character"+(selected.has(c.id)?" selected":"");
    el.innerHTML=`<button aria-label="${c.name}を選択">
      <img src="${avatar(c)}" alt="${c.name}" loading="lazy">
      <div class="name">${c.name}</div>
      <div class="unit">${c.unit}</div>
    </button>`;
    el.onclick=()=>{
      selected.has(c.id)?selected.delete(c.id):selected.add(c.id);
      el.classList.toggle("selected",selected.has(c.id));
      $("selectedCount").textContent=selected.size;
      $("toBattleBtn").disabled=selected.size<2;
    };
    grid.appendChild(el);
  });
}

function start(){
  selected=new Set();
  $("selectedCount").textContent=0;
  $("toBattleBtn").disabled=true;
  renderSelection();
  show("select");
}

function beginBattle(){
  pool=CHARACTERS.filter(c=>selected.has(c.id));
  // 9人未満なら全員をランキング対象にし、9人以上なら比較で順位を決める
  queue=[...pool].sort(()=>Math.random()-.5);
  ranking=[];
  battleCount=0;
  nextBattle();
  show("battle");
}

function nextBattle(){
  if(ranking.length>=Math.min(9,pool.length) || queue.length<2){
    finish();
    return;
  }
  const a=queue[0], b=queue[1];
  $("battleNo").textContent=battleCount+1;
  $("battleTotal").textContent=Math.max(1,pool.length*2);
  const box=$("battleCards");
  box.innerHTML="";
  [a,b].forEach(c=>{
    const card=document.createElement("div");
    card.className="battle-card";
    card.innerHTML=`<button><img src="${avatar(c)}" alt="${c.name}"><div class="name">${c.name}</div></button>`;
    card.onclick=()=>choose(c.id);
    box.appendChild(card);
  });
}

function choose(id){
  const winner=queue.find(c=>c.id===id);
  const loser=queue.find(c=>c.id!==id);
  if(!winner)return;
  ranking.push(winner);
  queue=queue.filter(c=>c.id!==winner.id && c.id!==loser.id);
  // 勝者を後で再登場させ、単純な総当たりより少ない比較で順位を作る
  if(!ranking.some(c=>c.id===winner.id)) queue.push(winner);
  battleCount++;
  nextBattle();
}

function finish(){
  const seen=new Set();
  ranking=ranking.filter(c=>!seen.has(c.id)&&(seen.add(c.id),true));
  const rest=pool.filter(c=>!seen.has(c.id)).sort(()=>Math.random()-.5);
  ranking=[...ranking,...rest].slice(0,9);
  renderResult();
  show("result");
}

function renderResult(){
  const list=$("resultList");
  list.innerHTML="";
  ranking.forEach((c,i)=>{
    const el=document.createElement("div");
    el.className="result-item";
    el.innerHTML=`<div class="rank">${i+1}</div><img src="${avatar(c)}" alt="${c.name}"><div><div class="result-name">${c.name}</div><div class="result-unit">${c.unit}</div></div>`;
    list.appendChild(el);
  });
}

async function share(){
  const text="あんスタ好き顔TOP9\n"+ranking.map((c,i)=>`${i+1}. ${c.name}`).join("\n");
  try{
    if(navigator.share){await navigator.share({title:"あんスタ好き顔TOP9",text});}
    else{await navigator.clipboard.writeText(text);$("copyStatus").textContent="結果をコピーしました";}
  }catch(e){}
}

$("startBtn").onclick=start;
$("toBattleBtn").onclick=beginBattle;
$("retryBtn").onclick=()=>show("start");
$("shareBtn").onclick=share;
$("skipBattleBtn").onclick=()=>{
  queue=queue.slice(2);
  battleCount++;
  nextBattle();
};

renderSelection();
