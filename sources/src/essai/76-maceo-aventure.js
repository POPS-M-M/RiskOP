/* MACE0 — Adaptateur de présentation : règles, coordonnées et sauvegardes du socle inchangées.
   Seul le rendu 3D est confié à notre moteur d'aventure ; les combats rejouent les rapports du jeu. */
const MACE={want:true,board:null,opening:false,attempted:false,module:null,detail:null,detailOpening:false,detailVisible:false,detailResume:null,
  busy:false,active:null,battleModule:null,resume:null,token:0,queue:[],seen:new Set(),lastPoll:0,layouts:new Map(),layoutSeed:null};
try{const saved=localStorage.getItem('maceo-adventure');MACE.want=saved===null?localStorage.getItem('rk-w3')!=='0':saved!=='0';}catch(_){}
const m3Asset=name=>new URL('assets/'+name,document.baseURI).href;
const m3Theme=t=>{const all=window.GL_ISLAND_THEMES||{},alias={'Alabasta':'Arabasta','Île des Hommes-Poissons':'Fish-Man','Elbaph':'Elbaf'};return all[t.name]||all[alias[t.name]]||{};};
function m3Island(t){
  const p=t.owner>=0?players[t.owner]:null;
  return {id:t.id,name:t.name,x:t.x,y:t.y,rad:t.rad,type:t.type,owner:t.owner,crewid:p?CREWS[p.crew||0].id:'resident',marine:!!p&&(p.crew||0)===0,
    theme:m3Theme(t),city:t.city?{lvl:t.city.lvl}:null,capital:!!t.capital,fruit:t.fruit,pone:t.pone};
}
function m3Snapshot(){
  if(MACE.layoutSeed!==seed){MACE.layouts.clear();MACE.layoutSeed=seed;}
  const islands=terrs.map(t=>{
    let layout=MACE.layouts.get(t.id);
    if(!layout){const flat=w3Poly(t),coast=[];for(let i=0;i<flat.length;i+=2)coast.push([flat[i],flat[i+1]]);layout={coast,portAngle:W3CU[t.name]&&W3CU[t.name].pier};MACE.layouts.set(t.id,layout);}
    return {...m3Island(t),...layout,troops:Math.floor(tr(t)),nb:t.nb.slice()};
  });
  return {generation:seed,selected:ui.sel,hover:ui.hover,me:ME,colors:COLORS,marineOwners:players.filter(p=>(p.crew||0)===0).map(p=>p.id),
    phase:TM.on?TM.phase:'real',battleCinematic:MACE.busy,canOrder:started&&!over&&!!players[ME]?.alive&&(!TM.on||TM.phase==='plan'),
    suspended:!started||!!over||MACE.busy||MACE.detailOpening||MACE.detailVisible||!!AG.trn||!overlay.hidden,
    islands,routes:routes.map(r=>r.slice()),armies:armies.map(a=>({id:a.id,from:a.from,to:a.to,owner:a.owner,progress:clamp(a.t/a.dur,0,1),troops:Math.floor(sumU(a.u))}))};
}
function m3Button(){const b=document.getElementById('z-w3');if(b){b.classList.toggle('on',MACE.want);b.setAttribute('aria-pressed',String(MACE.want));b.title=MACE.want?'Carte aventure 3D · clic pour revenir à la carte 2.5D':'Ouvrir la carte aventure 3D';b.textContent=MACE.want?'3D aventure':'3D';}}
function m3Disable(){MACE.want=false;MACE.opening=false;MACE.attempted=true;MACE.board?.dispose();MACE.board=null;const host=document.getElementById('maceo-map');if(host)host.hidden=true;W3.on=false;w3Off();try{localStorage.setItem('maceo-adventure','0');}catch(_){}m3Button();dirty=true;}
async function m3Enable(){
  MACE.want=true;m3Button();if(MACE.board||MACE.opening||!started||!terrs.length)return;
  MACE.opening=true;MACE.attempted=true;
  try{
    MACE.module=MACE.module||import(m3Asset('strategy-board.js'));const module=await MACE.module;
    if(!MACE.want)return;
    let host=document.getElementById('maceo-map');if(!host){host=document.createElement('div');host.id='maceo-map';host.style.cssText='position:absolute;inset:0;z-index:8;overflow:hidden';document.getElementById('mapwrap').appendChild(host);}host.hidden=false;
    W3.on=false;w3Off();
    MACE.board=module.createStrategyBoard({container:host,getState:m3Snapshot,
      onSelect:id=>{if(!terrs[id]||over)return;ui.sel=id;ui.hover=id;TU.clk=1;dirty=true;renderPanel(true);},
      onOrder:(from,to)=>{const a=terrs[from],b=terrs[to];if(!started||over||!a||!b||a.owner!==ME||!a.nb.includes(to)||TM.on&&TM.phase!=='plan')return false;
        const why=launchCheck(ME,from,to,ui.pct);if(why)return why;cmd({k:'launch',f:from,to,pct:ui.pct,st:ui.stance|0});dirty=true;renderPanel(true);return true;},
      onExplore:id=>m3Explore(terrs[id]),onClose:m3Disable});
    try{localStorage.setItem('maceo-adventure','1');}catch(_){}
  }catch(error){console.warn('Carte aventure 3D :',error);MACE.module=null;m3Disable();toast('La carte 3D ne s’est pas chargée ; la carte 2.5D reste disponible.');}
  finally{MACE.opening=false;m3Button();}
}
function m3Release(){MACE.busy=false;MACE.active=null;if(MACE.resume){if(MACE.resume.seed===seed&&!over)speed=MACE.resume.speed;MACE.resume=null;}}
function m3Cancel(){++MACE.token;MACE.queue.length=0;MACE.seen.clear();const active=MACE.active;MACE.active=null;active?.dispose();m3Release();MACE.detail?.closeIsland3D?.();}
function m3Battle(r){
  const from=terrs[r.from],to=terrs[r.to],att=players[r.att],def=r.def>=0?players[r.def]:null,boss=r.bs?BOSSES[r.bs.i]:null;if(!from||!to||!att)return null;
  const captured=r.bs?r.bs.end==='kill':!!r.win;
  return {id:r.id,generation:seed,from:m3Island(from),to:{...m3Island(to),owner:r.def,crewid:def?CREWS[def.crew||0].id:'resident',marine:!!def&&(def.crew||0)===0},
    attacker:{id:r.att,name:att.name==='Votre camp'?CREWS[att.crew||0].n:att.name,color:att.color,marine:(att.crew||0)===0,crewid:CREWS[att.crew||0].id,troopsBefore:brCnt(r.au),troopsAfter:brCnt(r.au2)},
    defender:{id:r.def,name:boss?boss.n:def?def.name:'Garnison indépendante',color:boss?'#c87766':def?def.color:'#a5ad91',marine:!!def&&(def.crew||0)===0,crewid:def?CREWS[def.crew||0].id:'resident',troopsBefore:brCnt(r.du),troopsAfter:brCnt(r.du2)},
    captured,winner:captured?'attacker':'defender',retreat:!!r.bs&&r.bs.end==='ret',boss:boss?{name:boss.n,hpBefore:r.bs.h0,hpAfter:r.bs.h1,maxHp:r.bs.mx}:null};
}
function m3Queue(r){
  if(!started||!MACE.want||!B3.on||r.att!==ME&&r.def!==ME)return;
  const key=seed+':'+r.id;if(MACE.seen.has(key))return;const battle=m3Battle(r);if(!battle)return;MACE.seen.add(key);MACE.queue.push(battle);m3Pump();
}
async function m3Pump(){
  if(MACE.busy||!MACE.queue.length||MACE.detailVisible||MACE.detailOpening||AG.trn||!overlay.hidden&&!over)return;
  const battle=MACE.queue.shift();if(battle.generation!==seed){m3Pump();return;}
  const token=++MACE.token;MACE.busy=true;if(MODE==='solo'&&!MACE.resume){MACE.resume={seed,speed};speed=0;}
  try{
    MACE.battleModule=MACE.battleModule||import(m3Asset('attack-cinematic.js'));const module=await MACE.battleModule;if(token!==MACE.token)return;
    MACE.active=module.playAttackCinematic({container:document.body,battle,onFinish:()=>{if(token!==MACE.token)return;MACE.active=null;MACE.busy=false;MACE.board?.update(m3Snapshot());if(MACE.queue.length)m3Pump();else m3Release();dirty=true;renderPanel(true);}});
  }catch(error){if(token!==MACE.token)return;console.warn('Cinématique aventure :',error);MACE.battleModule=null;m3Release();if(MACE.queue.length)m3Pump();}
}
async function m3Explore(t){
  if(!t||MACE.detailOpening||MACE.busy)return;MACE.detailOpening=true;
  if(MODE==='solo'&&!MACE.detailResume){MACE.detailResume={seed,speed};speed=0;}
  try{MACE.detail=MACE.detail||await import(m3Asset('island-3d.js'));const islands=terrs.map(m3Island);MACE.detail.openIsland3D(islands.find(q=>q.id===t.id),islands);MACE.detailVisible=true;}
  catch(error){console.warn('Exploration aventure :',error);m3CloseDetail();toast('L’exploration 3D ne s’est pas chargée.');}
  finally{MACE.detailOpening=false;}
}
function m3CloseDetail(){MACE.detailVisible=false;if(MACE.detailResume){if(MACE.detailResume.seed===seed&&!over)speed=MACE.detailResume.speed;MACE.detailResume=null;}}
function m3Paused(){return MODE==='solo'&&(MACE.busy||MACE.detailOpening||MACE.detailVisible);}
function m3Tick(now){
  if(started&&MACE.want&&!MACE.board&&!MACE.opening&&!MACE.attempted)m3Enable();
  if(MACE.board&&now-MACE.lastPoll>180){MACE.lastPoll=now;MACE.board.update(m3Snapshot());}
  if(MACE.queue.length&&!MACE.busy)m3Pump();
}
/* Une seule scène rejoue chaque rapport. Le renderer WebGL historique reste disponible dans les sources, mais n'est pas lancé en parallèle. */
W3.on=false;w3Off();
{const previous=draw;draw=function(){if(MACE.board&&MACE.want)return;W3.on=false;previous();};}
{const previous=brShow;brShow=function(r){m3Queue(r);previous(r);};}
{const previous=brReset;brReset=function(){m3Cancel();return previous();};}
{const previous=step;step=function(dt){if(!m3Paused())return previous(dt);};}
{const previous=tmTick;tmTick=function(dt){if(!m3Paused())return previous(dt);};}
{const previous=agTick;agTick=function(dt){if(!m3Paused())return previous(dt);};}
{const previous=frame;frame=function(now){m3Tick(now);if(m3Paused()){last=now;acc=0;updateTop();renderLog();requestAnimationFrame(frame);return;}previous(now);};}
window.addEventListener('gl3d:close',m3CloseDetail);
{const b=document.getElementById('z-w3');if(b)b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();if(MACE.want)m3Disable();else{MACE.attempted=false;m3Enable();}},true);m3Button();}
window.__MACE={state:MACE,snapshot:m3Snapshot,enable:m3Enable,disable:m3Disable,explore:id=>m3Explore(terrs[id]),playReport:m3Queue,cancel:m3Cancel,
  diagnostics:()=>({branch:'maceo',busy:MACE.busy,detailVisible:MACE.detailVisible,want:MACE.want,board:!!MACE.board,models:MACE.board?.getDiagnostics?.()||null})};
