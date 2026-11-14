/* ---- tutoriel interactif (partie solo) ----
   On apprend en jouant : chaque étape montre l'élément à utiliser (anneau doré sur la carte, contour sur un bouton), donne l'action concrète,
   dit pourquoi elle sert, et n'avance que lorsque l'état RÉEL de la partie a changé (île choisie, troupes recrutées, ordre donné, tour terminé,
   île conquise, onglet ouvert). Les rivaux restent immobiles jusqu'à la dernière étape. « Passer » reste disponible si une étape bloque. */
let TU={on:false,i:0,seen:{},clk:0};
let TC={cap:-1,tgt:-1,n0:0,g0:0,b0:0};
const tuP=()=>players[ME];
const tuCap=()=>terrs[TC.cap],tuTgt=()=>terrs[TC.tgt];
const tuMyArmy=()=>armies.find(a=>a.owner===ME&&a.to===TC.tgt);
const TUS=[
 {id:'goal',n:'Ton objectif',info:true,go:'C’est parti ▸',
  say:()=>'Tu diriges <b>'+esc(CREWS[tuP().crew||0].n)+'</b>, l’un des 4 camps qui se disputent les îles de la mer. Plus tu tiens d’îles, plus tu gagnes de Berrys et de troupes.',
  why:()=>'On gagne en éliminant les 3 autres camps, en finissant en tête ou en réussissant un grand projet. Ce guide dure 3 minutes : tu vas vraiment jouer.',
  ok:()=>!!TU.cont,fb:()=>'Parfait. Commençons par ta base.'},
 {id:'cap',n:'Ta capitale',
  say:()=>'Ton camp démarre sur une île-capitale, repérable à sa <b>couronne dorée</b>.',
  todo:()=>'Clique sur ta capitale (l’anneau doré).',
  why:()=>'Une île = une <b>garnison</b> (le chiffre dessus) et un <b>revenu</b> en Berrys. Ta capitale est ta base : c’est elle qui produit le plus.',
  hl:()=>({terr:TC.cap,label:'TA CAPITALE'}),enter:()=>{ui.tab='army';ui.sel=-1;dirty=true;},
  ok:()=>ui.sel===TC.cap,
  fb:()=>{const t=tuCap(),pr=tProd(t,tuP());return 'Fiche ouverte à droite : garnison <b>'+Math.floor(tr(t))+'</b>, revenu <b>'+sgn(pr.g*TLEN(),1)+' ฿ par '+TUN()+'</b>.';}},
 {id:'rec',n:'Recruter des troupes',
  say:()=>'Pour prendre une île, il faut plus de troupes que sa garnison. Recrutons un lot de Pirates.',
  todo:()=>{const c=recruitCost(tuP(),tuCap(),'guerrier');return 'Dans « Recruter », clique <b>« +'+UNITS.guerrier.batch+' · '+c+' ฿ »</b> (tu as '+Math.floor(tuP().gold)+' ฿).';},
  why:()=>'Les Berrys de tes îles paient les troupes. Les Pirates sont les moins chers et n’ont pas d’entretien.',
  hl:()=>({sel:'#side [data-act="recruit"][data-v="guerrier"]'}),
  enter:()=>{ui.tab='army';ui.sel=TC.cap;dirty=true;TC.g0=tr(tuCap());TC.b0=tuP().gold;},
  ok:()=>(tuP().x.st.ru|0)>=1,
  fb:()=>{const t=tuCap();return '+'+UNITS.guerrier.batch+' Pirates : garnison <b>'+Math.floor(TC.g0)+' → '+Math.floor(tr(t))+'</b>. Coût '+Math.round(TC.b0-tuP().gold)+' ฿, il te reste <b>'+Math.floor(tuP().gold)+' ฿</b>.';}},
 {id:'send',n:'Envoyer une armée',
  say:()=>'Ta cible : l’île voisine marquée <b>▼</b>. Elle est neutre (personne ne la tient) et défendue par <b>'+Math.floor(tr(tuTgt()))+'</b> troupes ; tu en as <b>'+Math.floor(tr(tuCap()))+'</b>.',
  todo:()=>ui.sel===TC.cap?'Clique l’île marquée — ou glisse de ta capitale vers elle.':'Sélectionne d’abord ta capitale, puis clique l’île marquée.',
  why:()=>'Tu gagnes si ta force dépasse celle de la garnison. Seule la part choisie (<b>'+Math.round(ui.pct*100)+' %</b>) part ; le reste défend la capitale.',
  hl:()=>({terr:TC.tgt,label:'CIBLE'}),
  enter:()=>{ui.tab='army';ui.sel=TC.cap;ui.pct=.75;dirty=true;},
  ok:()=>TM.on?TM.queue.some(o=>o.s===ME&&o.f===TC.cap&&o.to===TC.tgt):!!tuMyArmy(),
  fb:()=>{const o=TM.queue.find(q=>q.s===ME&&q.f===TC.cap&&q.to===TC.tgt);return TM.on?'Ordre enregistré : une <b>flèche blanche</b> relie ta capitale à '+esc(tuTgt().name)+' ('+Math.round((o?o.pct:ui.pct)*100)+' % de la garnison). Rien ne part avant la fin du tour.':'Ton armée prend la mer vers '+esc(tuTgt().name)+'.';}},
 {id:'end',n:'Finir le tour',
  say:()=>'Le jeu se joue en <b>tours simultanés</b> : tous les camps donnent leurs ordres en même temps, puis tout s’exécute ensemble.',
  todo:()=>'Clique <b>« Fin de tour »</b> (ou la touche Entrée).',
  why:()=>'Pendant la phase d’ordres le temps est arrêté : réfléchis tranquillement. Le bandeau en haut te dit toujours à qui c’est le tour.',
  hl:()=>({sel:'#b-end'}),enter:()=>{TC.n0=TM.n;},skip:()=>!TM.on,
  ok:()=>TM.n>TC.n0||TM.phase==='res',
  fb:()=>'<b>Résolution</b> : les ordres de tous les camps partent ensemble et les armées voyagent pendant '+TURN_LEN+' s.'},
 {id:'conq',n:'La conquête',wait:true,
  say:()=>'Ton navire traverse la mer. Si ta force dépasse la garnison, l’île <b>change de couleur</b>.',
  todo:()=>{const a=tuMyArmy();if(a)return 'Patiente : arrivée dans ≈ '+Math.max(1,Math.ceil((a.dur-a.t)/Math.max(1,speed)))+' s.';return TM.on&&TM.phase==='plan'?'Clique « Fin de tour » pour laisser ton armée finir sa traversée.':'Un instant…';},
  why:()=>'Conquérir une île donne son revenu, agrandit ta zone et réduit celle des rivaux.',
  hl:()=>{const a=tuMyArmy();return (!a&&TM.on&&TM.phase==='plan')?{sel:'#b-end'}:{terr:TC.tgt,label:'ARRIVÉE'};},
  enter:()=>{TC.t5=performance.now();},
  fail:()=>{if(performance.now()-TC.t5<2500)return false;if(tuTgt().owner===ME||tuMyArmy())return false;if(TM.on&&TM.phase==='res')return false;return true;},
  ok:()=>tuTgt().owner===ME,
  fb:()=>{const r=RK.rec.slice().reverse().find(x=>x.id===TC.tgt);return r?'<b>Île conquise !</b> Butin : +'+r.g.toFixed(2).replace('.',',')+' ฿ par '+TUN()+', garnison '+r.troops+'. Revenu net : '+sgn(r.net0,1)+' → <b>'+sgn(r.net1,1)+' ฿</b>.':'<b>Île conquise !</b>';}},
 {id:'eco',n:'Tes Berrys',
  say:()=>'Chaque île conquise augmente tes revenus. Le tableau <b>Économie</b> montre d’où viennent tes Berrys et où ils vont.',
  todo:()=>'Ouvre l’onglet <b>« Économie »</b>.',
  why:()=>'Revenu net = îles + villes + bâtiments − entretien des unités. Un revenu positif te permet de recruter et construire sans cesse.',
  hl:()=>({sel:'#side [data-act="tab"][data-v="eco"]'}),enter:()=>{ui.tab='army';},
  ok:()=>ui.tab==='eco',
  fb:()=>{const E=rkEco(tuP());return 'Revenu net : <b>'+sgn(E.net*TLEN(),1)+' ฿ par '+TUN()+'</b>. Solde : '+Math.floor(tuP().gold)+' ฿. Le bandeau « Budget » reste visible partout.';}},
 {id:'def',n:'Défendre ses îles',
  say:()=>'Les autres camps vont bientôt attaquer. Ta nouvelle île est faiblement gardée : renforce-la.',
  todo:()=>TM.on&&TM.phase==='res'?'Patiente : la résolution finit dans ≈ '+Math.max(1,Math.ceil(TM.res/Math.max(1,speed)))+' s. Les ordres ne se donnent qu’à la phase d’ordres (temps arrêté).':'<b>Glisse</b> (clic maintenu) de ta capitale jusqu’à l’île conquise : entre tes propres îles, un simple clic sélectionne, le glisser envoie des troupes.',
  why:()=>'Une île se défend avec sa garnison : garde-la plus forte que les armées voisines. « Fortifier » et les Fortins multiplient la défense.',
  hl:()=>TM.on&&TM.phase==='res'?{terr:TC.tgt,label:'ATTENDRE'}:{terr:TC.tgt,label:'RENFORCER'},
  enter:()=>{ui.tab='army';ui.sel=-1;dirty=true;},
  ok:()=>TM.on?TM.queue.some(o=>o.s===ME&&terrs[o.f].owner===ME&&terrs[o.to].owner===ME):armies.some(a=>a.owner===ME&&terrs[a.to].owner===ME),
  fb:()=>'Renforts ordonnés. Quand une île est menacée, une alerte rouge apparaît sur la carte, dans le bandeau du haut et dans « Que faire maintenant ? ».'},
 {id:'chars',n:'Tes personnages',
  say:()=>'Des <b>lieutenants</b> célèbres peuvent rejoindre ton camp. Chacun apporte un bonus permanent et une compétence.',
  todo:()=>'Ouvre l’onglet <b>« Équipe »</b>.',
  why:()=>'Chaque fiche dit à quoi il sert, ses conditions de recrutement et son coût : recrute celui dont ton plan a besoin (attaque, défense, Berrys).',
  hl:()=>({sel:'#side [data-act="tab"][data-v="leg"]'}),
  ok:()=>ui.tab==='leg',
  fb:()=>{const p=tuP(),i=LEGENDS.findIndex((L,k)=>!hireReason(p,k));if(i>=0)return '<b>'+esc(LEGENDS[i].s)+'</b> est recrutable maintenant ('+recCost(p,i)+' ฿).';const j=LEGENDS.findIndex((L,k)=>CH[k].own<0&&L.camps.includes(CREWS[p.crew||0].id));return j>=0?'Premier objectif : <b>'+esc(LEGENDS[j].s)+'</b> — regarde ses conditions dans sa fiche.':'Regarde les conditions de chaque fiche.';}},
 {id:'win',n:'Comment gagner',info:true,go:'Terminer et jouer ▸',
  say:()=>'Tu connais l’essentiel : <b>ordres → Fin de tour → résolution</b>. Pour gagner : éliminer ou soumettre les 3 camps, finir en tête aux points, ou achever un grand projet à l’âge final.',
  why:()=>'Tout est expliqué dans Monde → Objectifs. Tu peux rejouer ce guide avec le bouton « Guide » en haut. Les rivaux commencent à jouer maintenant.',
  ok:()=>!!TU.cont2,fb:()=>'Bonne chasse !'}
];
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
  TU.freeze=true;TU.i=0;TU.ph=undefined;TU.cont=false;TU.cont2=false;ui.tab='army';ui.sel=-1;ui.pct=.75;dirty=true;
}
function tuAdvance(){
  TU.i++;TU.ph=undefined;TU.cont=false;
  if(TU.i>=TUS.length)tuFinish();
}
function tuFinish(){
  TU.on=false;TU.freeze=false;TU.fin=true;rkLS('gl-tuto','1');ui.tab='army';
  document.querySelectorAll('.tuhl').forEach(e=>e.classList.remove('tuhl'));
  const c=$('#coach');if(c)c.hidden=true;
  toast('Guide terminé : les rivaux jouent. Tu peux le rejouer avec le bouton « Guide ».');
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
}
function tuCard(){return '';}
function coachRender(){
  const el=$('#coach');if(!el)return;
  if(!TU.on||MODE!=='solo'||!started||over||TC.cap<0||!TUS[TU.i]){
    if(!el.hidden)el.hidden=true;
    document.querySelectorAll('.tuhl').forEach(e=>e.classList.remove('tuhl'));
    $('.app').classList.remove('tu');return;
  }
  $('.app').classList.add('tu');
  const s=TUS[TU.i],n=TUS.length,ph=TU.ph||'do',hl=ph==='do'&&s.hl?s.hl():null;
  /* ancre : à l'opposé de la cible pour ne pas la cacher */
  let top=false;
  if(hl&&hl.terr!==undefined&&terrs[hl.terr]){const t=terrs[hl.terr];const fy=(t.y-V.y)*V.k/H;top=fy>.5;}
  const prog='<div class="prog">'+TUS.map((z,j)=>'<i class="'+(j<TU.i?'d':j===TU.i?'c':'')+'"></i>').join('')+'</div>';
  let body='<p>'+s.say()+'</p><p class="why">Pourquoi : '+s.why()+'</p>';
  if(TU.retry&&s.id==='send')body='<p style="color:#ff9a8f"><b>'+TU.retry+'</b></p>'+body;
  let btns='<button data-tu="skip">Passer l’étape</button><button data-tu="off">Quitter le guide</button>';
  if(ph==='ok'){
    body+='<div class="ok">✔ '+TU.fbT+'</div>';
    btns+='<button class="go" data-tu="next">Continuer ▸</button>';
  }else if(s.info){
    btns='<button data-tu="off">Quitter le guide</button><button class="go" data-tu="'+(s.id==='goal'?'cont':'cont2')+'">'+s.go+'</button>';
  }else body+='<div class="do">👉 À faire : '+s.todo()+'</div>';
  const h='<div class="ct"><b>'+s.n+'</b><small>Étape '+(TU.i+1)+' / '+n+'</small></div>'+prog+body+'<div class="cb">'+btns+'</div>';
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
  if(a==='skip'){TU.ph=undefined;TU.i++;TU.cont=false;if(TU.i>=TUS.length)tuFinish();}
  else if(a==='off'){TU.on=false;TU.freeze=false;rkLS('gl-tuto','1');toast('Guide fermé : les rivaux jouent. Rejouable avec le bouton « Guide ».');}
  else if(a==='next')tuAdvance();
  else if(a==='cont'){TU.cont=true;}
  else if(a==='cont2'){TU.cont2=true;}
  TU.key='';coachRender();
});
function rkStartTutorial(){
  leaveNet();
  const sd=Math.floor(Math.random()*90000)+1000;
  modePick='turn';pacePick=3;
  newGame(sd,'easy',{crews:[crewPick,...[0,1,2,3].filter(i=>i!==crewPick)],turn:true,pk:3});
  TU={on:true,i:0,seen:{},clk:0,fin:false};tuSetup();
  started=true;speed=2;overlay.hidden=true;const ro=$('#rulesov');if(ro)ro.hidden=true;updateHint();renderPanel(true);
}
