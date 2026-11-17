/* ---- tutoriel : apprendre en jouant (7 objectifs) ----
   Chaque objectif se valide TOUT SEUL quand l'état réel de la partie change (vue zoomée, île choisie, troupes recrutées,
   ordre donné, île conquise, commandant recruté, construction lancée, technologie achetée, bataille gagnée) : aucun bouton « Terminé ».
   Objectifs 1 à 3 (première conquête) : guidés, rivaux immobiles. Objectifs 4 à 7 : une simple carte « Objectif actuel »,
   la partie continue normalement (et peut être sauvegardée). Toutes les explications restent consultables dans Règles → Codex. */
let TU={on:false,i:0,seen:{},clk:0};
let TC={cap:-1,tgt:-1,n0:0,g0:0,b0:0};
const tuP=()=>players[ME];
const tuCap=()=>terrs[TC.cap],tuTgt=()=>terrs[TC.tgt];
const tuMyArmy=()=>armies.find(a=>a.owner===ME&&a.to===TC.tgt);
const TU_AUTO=2200;   /* délai d'affichage du « ✔ » avant l'objectif suivant (ms) */
const TUS=[
 {id:'map',o:1,n:'Découvrir la carte',
  say:()=>'Tu diriges <b>'+esc(CREWS[tuP().crew||0].n)+'</b>, l’un des 4 camps qui se disputent les îles. Chaque rond est une île ; le chiffre, sa garnison.',
  todo:()=>'Zoome sur la carte : bouton <b>+</b>, molette, ou pincement sur mobile.',
  why:()=>'Plus tu tiens d’îles, plus tu gagnes de Berrys et de troupes. La mini-carte en bas à gauche montre toute la mer.',
  hl:()=>({sel:'#z-in'}),enter:()=>{TC.v0={x:V.x,y:V.y,k:V.k};},
  ok:()=>Math.abs(V.k-TC.v0.k)>.04||Math.abs(V.x-TC.v0.x)+Math.abs(V.y-TC.v0.y)>20,
  fb:()=>'Bien. Le bouton ⌂ remet la vue entière.'},
 {id:'cap',o:2,n:'Sélectionner une île',
  say:()=>'Ton camp démarre sur une île-capitale, repérable à sa <b>couronne dorée</b>.',
  todo:()=>'Clique sur ta capitale (l’anneau doré).',
  why:()=>'Une île = une <b>garnison</b> (le chiffre dessus) et un <b>revenu</b> en Berrys. Ta capitale est ta base : c’est elle qui produit le plus.',
  hl:()=>({terr:TC.cap,label:'TA CAPITALE'}),enter:()=>{ui.tab='army';ui.sel=-1;dirty=true;},
  ok:()=>ui.sel===TC.cap,
  fb:()=>{const t=tuCap(),pr=tProd(t,tuP());return 'Fiche ouverte à droite : garnison <b>'+Math.floor(tr(t))+'</b>, revenu <b>'+sgn(pr.g*TLEN(),1)+' ฿ par '+TUN()+'</b>.';}},
 {id:'rec',o:3,n:'Première conquête · troupes',
  say:()=>'Pour prendre une île, il faut plus de troupes que sa garnison. Recrute un lot de Pirates.',
  todo:()=>{const c=recruitCost(tuP(),tuCap(),'guerrier');return 'Dans « Recruter », clique <b>« +'+UNITS.guerrier.batch+' · '+c+' ฿ »</b> (tu as '+Math.floor(tuP().gold)+' ฿).';},
  why:()=>'Les Berrys de tes îles paient les troupes. Les Pirates sont les moins chers et n’ont pas d’entretien.',
  hl:()=>({sel:'#side [data-act="recruit"][data-v="guerrier"]'}),
  enter:()=>{ui.tab='army';ui.sel=TC.cap;dirty=true;TC.g0=tr(tuCap());TC.b0=tuP().gold;},
  ok:()=>(tuP().x.st.ru|0)>=1,
  fb:()=>{const t=tuCap();return '+'+UNITS.guerrier.batch+' Pirates : garnison <b>'+Math.floor(TC.g0)+' → '+Math.floor(tr(t))+'</b>. Il te reste <b>'+Math.floor(tuP().gold)+' ฿</b>.';}},
 {id:'send',o:3,n:'Première conquête · ordre',
  say:()=>'Ta cible : l’île voisine marquée <b>▼</b>, neutre, défendue par <b>'+Math.floor(tr(tuTgt()))+'</b> troupes ; tu en as <b>'+Math.floor(tr(tuCap()))+'</b>.',
  todo:()=>ui.sel===TC.cap?'Clique l’île marquée, ou glisse de ta capitale vers elle.':'Sélectionne d’abord ta capitale, puis clique l’île marquée.',
  why:()=>'Tu gagnes si ta force dépasse celle de la garnison. Seule la part choisie (<b>'+Math.round(ui.pct*100)+' %</b>) part ; le reste défend la capitale.',
  hl:()=>({terr:TC.tgt,label:'CIBLE'}),
  enter:()=>{ui.tab='army';ui.sel=TC.cap;ui.pct=.75;dirty=true;},
  ok:()=>TM.on?TM.queue.some(o=>o.s===ME&&o.f===TC.cap&&o.to===TC.tgt):!!tuMyArmy(),
  fb:()=>TM.on?'Ordre enregistré : une <b>flèche blanche</b> relie ta capitale à '+esc(tuTgt().name)+'. Rien ne part avant la fin du tour.':'Ton armée prend la mer vers '+esc(tuTgt().name)+'.'},
 {id:'end',o:3,n:'Première conquête · fin de tour',
  say:()=>'Tous les camps donnent leurs ordres en même temps, puis tout s’exécute ensemble.',
  todo:()=>'Clique <b>« Fin de tour »</b> (ou la touche Entrée).',
  why:()=>'Pendant la phase d’ordres le temps est arrêté : réfléchis tranquillement.',
  hl:()=>({sel:'#b-end'}),enter:()=>{TC.n0=TM.n;},skip:()=>!TM.on,
  ok:()=>TM.n>TC.n0||TM.phase==='res',
  fb:()=>'<b>Résolution</b> : les armées voyagent pendant '+TURN_LEN+' s.'},
 {id:'conq',o:3,n:'Première conquête',wait:true,
  say:()=>'Ton navire traverse la mer. Si ta force dépasse la garnison, l’île <b>change de couleur</b>.',
  todo:()=>{const a=tuMyArmy();if(a)return 'Patiente : arrivée dans ≈ '+Math.max(1,Math.ceil((a.dur-a.t)/Math.max(1,speed)))+' s.';return TM.on&&TM.phase==='plan'?'Clique « Fin de tour » pour laisser ton armée finir sa traversée.':'Un instant…';},
  why:()=>'Conquérir une île donne son revenu, agrandit ta zone et réduit celle des rivaux.',
  hl:()=>{const a=tuMyArmy();return (!a&&TM.on&&TM.phase==='plan')?{sel:'#b-end'}:{terr:TC.tgt,label:'ARRIVÉE'};},
  enter:()=>{TC.t5=performance.now();},
  fail:()=>{if(performance.now()-TC.t5<2500)return false;if(tuTgt().owner===ME||tuMyArmy())return false;if(TM.on&&TM.phase==='res')return false;return true;},
  ok:()=>tuTgt().owner===ME,
  fb:()=>{const r=RK.rec.slice().reverse().find(x=>x.id===TC.tgt);return r?'<b>Île conquise !</b> +'+r.g.toFixed(2).replace('.',',')+' ฿ par '+TUN()+'. Les rivaux se mettent à jouer.':'<b>Île conquise !</b> Les rivaux se mettent à jouer.';}}
];
/* objectifs 4 à 7 : la partie continue, la carte « Objectif actuel » reste discrète ; proposés aussi dans les premières parties libres */
const BATWIN=()=>BATTLES.some(r=>!r.bs&&((r.att===ME&&r.def>=0&&r.win)||(r.def===ME&&r.att>=0&&!r.win)));
const TOB=[
 {id:'lt',o:4,n:'Recruter ton premier commandant',
  say:'Un commandant donne un bonus à tout ton camp, une compétence et peut commander une île.',
  todo:()=>'Onglet <b>« Équipe »</b> : choisis dans « Recrutables maintenant », ou regarde « Presque » (il ne manque qu’une condition).',
  hl:()=>ui.tab==='leg'?null:{sel:'#side [data-act="tab"][data-v="leg"]'},
  ok:()=>(tuP().x.st.lt|0)>=1||chOwnedBy(ME).length>0},
 {id:'tech',o:5,n:'Acheter une technologie',
  say:'Une technologie renforce ton camp pour toute la partie (attaque, revenus, nouvelles unités…).',
  todo:()=>'Onglet <b>« Économie » → « Techno »</b> : achète une technologie. Elle se paie en <b>savoir</b> (◈ en haut), qui s’accumule à chaque tour : il en faut '+Math.min(...TECHS.filter(t=>!t.req.length).map(t=>t.cost))+' pour la moins chère (tu en as '+Math.floor(tuP().sci)+').',
  hl:()=>ui.tab==='tech'?null:{sel:'#side [data-act="tab"][data-v="'+(['eco','city','tech'].includes(ui.tab)?'tech':'eco')+'"]'},
  ok:()=>Object.keys(tuP().techs).length>=1},
 {id:'bd',o:6,n:'Construire ton premier bâtiment',
  say:'Les bâtiments d’une ville augmentent durablement tes revenus ou ta défense. Chacun demande sa technologie (Sabres → Caserne, Trésorerie → Marché…).',
  todo:()=>'Onglet <b>« Économie » → « Villes »</b> : sélectionne ta capitale et clique « Construire » sur un bâtiment débloqué par ta technologie.',
  hl:()=>ui.tab==='city'?null:{sel:'#side [data-act="tab"][data-v="'+(['eco','city','tech'].includes(ui.tab)?'city':'eco')+'"]'},
  ok:()=>(tuP().x.st.bd|0)>=1||terrs.some(t=>t.owner===ME&&t.city&&t.city.q)},
 {id:'bw',o:7,n:'Gagner une bataille contre un rival',
  say:'Prends une île à un autre camp, ou repousse une de ses attaques.',
  todo:()=>'Attaque une île d’une autre couleur plus faible que ton armée, ou garde tes îles plus fortes que les armées voisines.',
  hl:()=>null,
  ok:BATWIN}
];
/* un joueur qui a déjà 3 parties terminées (carnet) n'est pas dérangé par les objectifs, sauf s'il relance le Guide */
function tobLoad(){let o=null;try{o=JSON.parse(localStorage.getItem('rk-tob')||'null');}catch(_){o=null;}if(!o||typeof o!=='object')o=(PROFILE.games|0)>=3?{off:1}:{};return o;}
function tobSave(o){try{localStorage.setItem('rk-tob',JSON.stringify(o));}catch(_){}}
/* objectif actuel : le premier des 4 que ce navigateur n'a pas encore accompli */
function tobCur(){
  if(MODE!=='solo'||!started||over||TU.on||!players[ME]||!players[ME].x)return null;
  const d=tobLoad();if(d.off)return null;
  return TOB.find(o=>!d[o.id])||null;
}
function tobTick(){
  const o=tobCur();if(!o)return null;
  if(RK.tobOk&&performance.now()-RK.tobOk.t<TU_AUTO+600)return o;
  if(o.ok()){const d=tobLoad();d[o.id]=1;tobSave(d);RK.tobOk={id:o.id,t:performance.now(),n:o.n};try{sndFx('chime');}catch(_){}
    if(!TOB.find(x=>!d[x.id]))try{toast('Les 7 objectifs du guide sont accomplis. Les explications restent dans Règles → Codex.');}catch(_){}}
  return o;
}
function tobRender(el){
  const o=tobTick(),ok=RK.tobOk&&performance.now()-RK.tobOk.t<TU_AUTO;
  if(!o&&!ok){if(!el.hidden)el.hidden=true;el.classList.remove('mini');document.querySelectorAll('.tuhl').forEach(e=>e.classList.remove('tuhl'));return;}
  const d=tobLoad(),done=TOB.filter(x=>d[x.id]).length;
  let h;
  if(ok)h='<div class="ct"><b>✔ '+esc(RK.tobOk.n)+'</b><small>Objectif accompli</small></div>';
  else h='<div class="ct"><b>Objectif '+o.o+' / 7 · '+o.n+'</b><small>'+(3+done)+' accomplis</small></div><p>'+o.say+'</p><div class="do">👉 '+o.todo()+'</div><div class="cb"><button data-tob="skip">Passer</button><button data-tob="off">Masquer les objectifs</button></div>';
  if(h!==TU.key){TU.key=h;el.innerHTML=h;}
  el.classList.add('mini');el.classList.remove('top');el.hidden=false;
  const hl=!ok&&o.hl?o.hl():null;
  document.querySelectorAll('.tuhl').forEach(e=>{if(!hl||!e.matches(hl.sel))e.classList.remove('tuhl');});
  if(hl&&hl.sel){const e=document.querySelector(hl.sel);if(e)e.classList.add('tuhl');}
}
function tuTarget(){if(!TU.on||TU.ph!=='do')return null;const s=TUS[TU.i];return s&&s.hl?s.hl():null;}
function tuSetup(){
  TC={cap:-1,tgt:-1,n0:0,g0:0,b0:0};
  const cap=terrs.find(t=>t.owner===ME&&t.capital);if(!cap){TU.on=false;return;}
  TC.cap=cap.id;
  let best=null;
  for(const pass of [0,1])for(const n of cap.nb){const x=terrs[n];if(x.owner>=0||bossAlive(x))continue;if(pass===0&&(x.fruit||x.pone))continue;if(!best||tr(x)<tr(best))best=x;}
  if(!best){TU.on=false;return;}
  TC.tgt=best.id;
  if(tr(best)>5)best.u=scaleU(best.u,5/tr(best));
  tuP().gold=Math.max(tuP().gold,60);
  TU.freeze=true;TU.i=0;TU.ph=undefined;ui.tab='army';ui.sel=-1;ui.pct=.75;dirty=true;
  /* un nouveau guide repart des 7 objectifs */
  tobSave({});RK.tobOk=null;
}
function tuAdvance(){
  TU.i++;TU.ph=undefined;
  if(TU.i>=TUS.length)tuFinish();
}
function tuFinish(){
  TU.on=false;TU.freeze=false;TU.fin=true;rkLS('gl-tuto','1');ui.tab='army';
  document.querySelectorAll('.tuhl').forEach(e=>e.classList.remove('tuhl'));
  const c=$('#coach');if(c)c.hidden=true;
  toast('Première conquête réussie : les rivaux jouent. Les objectifs suivants s’affichent sans arrêter la partie.');
}
function tuTick(){
  if(!TU.on||MODE!=='solo'||!started||!players[ME]||!players[ME].x||TC.cap<0)return;
  const s=TUS[TU.i];if(!s){tuFinish();return;}
  if(TU.ph===undefined){TU.ph='do';TU.t0=performance.now();if(s.enter)s.enter();}
  if(TU.ph==='do'){
    if(s.skip&&s.skip()){tuAdvance();return;}
    if(s.fail&&s.fail()){const k=TUS.findIndex(z=>z.id==='send');TU.i=k;TU.ph=undefined;TU.retry='L’assaut a échoué : la garnison était plus forte. Recrute ou envoie 100 % de la garnison, puis réessaie.';tuP().gold=Math.max(tuP().gold,40);return;}
    if(s.ok()){TU.ph='ok';TU.t1=performance.now();TU.fbT=s.fb?s.fb():'';TU.retry='';try{sndFx('chime');}catch(_){}}
  }
  /* validé : le « ✔ » reste affiché un instant, puis l'objectif suivant apparaît (aucun clic nécessaire) */
  else if(TU.ph==='ok'&&performance.now()-TU.t1>=TU_AUTO)tuAdvance();
}
function tuCard(){return '';}
function coachRender(){
  const el=$('#coach');if(!el)return;
  if(!TU.on||MODE!=='solo'||!started||over||TC.cap<0||!TUS[TU.i]){
    $('.app').classList.remove('tu');
    tobRender(el);return;
  }
  el.classList.remove('mini');
  $('.app').classList.add('tu');
  const s=TUS[TU.i],ph=TU.ph||'do',hl=ph==='do'&&s.hl?s.hl():null;
  /* ancre : à l'opposé de la cible pour ne pas la cacher */
  let top=false;
  if(hl&&hl.terr!==undefined&&terrs[hl.terr]){const t=terrs[hl.terr];const fy=(t.y-V.y)*V.k/H;top=fy>.5;}
  /* progression sur les 7 objectifs (les 4 étapes de la première conquête comptent pour l'objectif 3) */
  const prog='<div class="prog">'+[1,2,3,4,5,6,7].map(k=>'<i class="'+(k<s.o?'d':k===s.o?'c':'')+'"></i>').join('')+'</div>';
  let body='<p>'+s.say()+'</p><p class="why">Pourquoi : '+s.why()+'</p>';
  if(TU.retry&&s.id==='send')body='<p style="color:#ff9a8f"><b>'+TU.retry+'</b></p>'+body;
  const btns='<button data-tu="skip">Passer l’étape</button><button data-tu="off">Quitter le guide</button>';
  if(ph==='ok')body+='<div class="ok">✔ '+TU.fbT+'</div>';
  else body+='<div class="do">👉 À faire : '+s.todo()+'</div>';
  const h='<div class="ct"><b>'+s.n+'</b><small>Objectif '+s.o+' / 7</small></div>'+prog+body+'<div class="cb">'+btns+'</div>';
  const key=h+(top?'T':'B');
  if(key!==TU.key){TU.key=key;el.innerHTML=h;}
  el.classList.toggle('top',top);el.hidden=false;
  /* surbrillance d'un élément de l'interface */
  document.querySelectorAll('.tuhl').forEach(e=>{if(!hl||!hl.sel||!e.matches(hl.sel))e.classList.remove('tuhl');});
  if(hl&&hl.sel){const e=document.querySelector(hl.sel);if(e){if(!e.classList.contains('tuhl')){e.classList.add('tuhl');if(TU.scr!==hl.sel){TU.scr=hl.sel;try{e.scrollIntoView({block:'nearest',behavior:'smooth'});}catch(_){}}}}}
  else TU.scr='';
}
document.getElementById('coach').addEventListener('click',e=>{
  const b=e.target.closest('[data-tu]');if(!b)return;
  const a=b.dataset.tu;
  if(a==='skip'){TU.ph=undefined;TU.i++;if(TU.i>=TUS.length)tuFinish();}
  else if(a==='off'){TU.on=false;TU.freeze=false;rkLS('gl-tuto','1');toast('Guide fermé : les rivaux jouent. Rejouable avec le bouton « Guide ».');}
  TU.key='';coachRender();
});
document.getElementById('coach').addEventListener('click',e=>{
  const b=e.target.closest('[data-tob]');if(!b)return;
  const d=tobLoad(),o=tobCur();
  if(b.dataset.tob==='skip'&&o){d[o.id]=1;tobSave(d);}
  else if(b.dataset.tob==='off'){d.off=1;tobSave(d);toast('Objectifs masqués. Le bouton « Guide » les relance ; les explications sont dans Règles → Codex.');}
  TU.key='';coachRender();
});
/* Codex : toutes les explications du guide, consultables à tout moment (Règles) */
const CODEX=[
 ['La carte','Chaque rond est une île ; le chiffre est sa garnison. Zoome avec +, la molette ou le pincement ; ⌂ remet la vue entière. La mini-carte montre toute la mer.'],
 ['Ta capitale','Une île = une garnison et un revenu en Berrys. La capitale (couronne dorée) est ta base : elle produit le plus.'],
 ['Recruter des troupes','Les Berrys de tes îles paient les troupes (onglet Île → Recruter). Les Pirates sont les moins chers et n’ont pas d’entretien.'],
 ['Envoyer une armée','Clique une île voisine depuis ton île sélectionnée, ou glisse de l’une à l’autre. Seule la part choisie (25 à 100 %) part. Tu gagnes si ta force dépasse la garnison.'],
 ['Tours simultanés','Tous les camps donnent leurs ordres pendant que le temps est arrêté, puis « Fin de tour » : tout s’exécute ensemble pendant la résolution.'],
 ['La conquête','Une île conquise donne son revenu et agrandit ta zone. Le récapitulatif de conquête détaille le butin.'],
 ['Tes Berrys','Revenu net = îles + villes + bâtiments − entretien des unités (onglet Économie). Un revenu positif permet de recruter et construire sans cesse.'],
 ['Défendre ses îles','Une île se défend avec sa garnison : garde-la plus forte que les armées voisines. Entre tes îles, glisser envoie des renforts ; « Fortifier » et les Fortins multiplient la défense.'],
 ['Les commandants','Chacun donne un bonus à tout le camp, une compétence et peut commander une île. Onglet Équipe : « Recrutables maintenant », « Presque » (une condition manque), « Plus tard ». La fiche détaillée donne tout.'],
 ['Technologies','Dans Économie → Techno : payées en savoir (◈), qui s’accumule à chaque tour ; elles renforcent ton camp pour toute la partie et débloquent bâtiments et unités.'],
 ['Bâtiments','Dans Économie → Villes : chaque ville construit un bâtiment à la fois, s’il a sa technologie et une place libre (revenus, défense, savoir…). Les merveilles sont uniques.'],
 ['Diplomatie','Onglet Diplo : paix, commerce, alliance ou guerre ; l’influence paie ces accords.'],
 ['Comment gagner','Éliminer ou soumettre les 3 autres camps, alliance commune à l’âge III, ou réussir un grand projet du Nouveau Monde. Détails : Monde → Objectifs.']
];
function codexHTML(){return '<h3>Codex du guide</h3>'+CODEX.map(c=>'<details class="cdx"><summary>'+esc(c[0])+'</summary><p>'+esc(c[1])+'</p></details>').join('');}
function rkStartTutorial(){
  leaveNet();
  const sd=Math.floor(Math.random()*90000)+1000;
  modePick='turn';pacePick=3;
  newGame(sd,'easy',{crews:[crewPick,...[0,1,2,3].filter(i=>i!==crewPick)],turn:true,pk:3});
  TU={on:true,i:0,seen:{},clk:0,fin:false};tuSetup();
  started=true;speed=2;overlay.hidden=true;const ro=$('#rulesov');if(ro)ro.hidden=true;updateHint();renderPanel(true);
}
