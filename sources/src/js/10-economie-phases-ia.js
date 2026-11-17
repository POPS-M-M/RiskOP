/* ================= RISK OP : couche d'expérience de jeu =================
   Ajoutée par-dessus le moteur existant (cartes, combats, diplomatie, âges) sans en changer les règles :
   bandeau de phase, IA qui joue à chaque tour avec ses mouvements annoncés, tableau des Berrys, butin de conquête, fiches lisibles,
   objectifs expliqués, onglets regroupés, mini-carte mobile, notifications discrètes. */
const RK={adv:false,notif:'all',unread:0,rec:[],mv:[],lastAtk:{},phKey:'',phase0:'',expl:false,mini:{x:null,y:null,hide:false},lastPh:null,lastLogH:'',logT:0,bellT:0};
const rkLS=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v);}catch(_){}return null;};
RK.adv=rkLS('rk-adv')==='1';
{const n=rkLS('rk-notif');if(n==='all'||n==='key'||n==='off')RK.notif=n;}
try{const m=JSON.parse(rkLS('rk-mini')||'null');if(m&&typeof m==='object')Object.assign(RK.mini,m);}catch(_){}
const ADV=()=>RK.adv||AG.n>=1;
const TLEN=()=>TM.on?TURN_LEN:60;
const TUN=()=>TM.on?'tour':'min';
const sgn=(v,d)=>(v>=0?'+':'−')+Math.abs(v).toFixed(d==null?1:d).replace('.',',');
const cname=p=>p.name==='Votre camp'?CREWS[p.crew||0].n:p.name;
const RK_KEY=/capitale|vaincu|âge|achève|Buster Call|éliminé|trésor|révolte|conquiert|attaque|rejoint|boss|☠|mission|succès|alliance|guerre|paix|jalon|crise|projet|prend|tombe/i;

/* ---------- économie : décomposition exacte des Berrys (mêmes formules que income()) ---------- */
function rkEco(p){
  const Z=1/PK,m=p.mod,tb=Math.min(.2,tradePartners(p.id)*.1);
  const L={isl:0,spec:0,city:0,cap:0,bld:0},per=[];
  for(const t of terrs){
    if(t.owner!==p.id)continue;
    const y=TYPES[t.type];let g=y.g,spec=0,city=0,cap=0,bld=0;
    if(t.spec==='g'&&!t.city){const g2=g*1.8+.18;spec=g2-g;g=g2;}
    if(t.city){city+=.25;g+=.25;}
    if(t.capital){cap=.8;g+=.8;}
    if(t.city){const lm=1+.35*(t.city.lvl-1);city+=g*(lm-1);g*=lm;for(const b of t.city.b){const bi=BLD_INCOME[b];if(bi&&bi.g){bld+=bi.g;g+=bi.g;}}}
    L.isl+=y.g;L.spec+=spec;L.city+=city;L.cap+=cap;L.bld+=bld;per.push({t,g});
  }
  const gross=L.isl+L.spec+L.city+L.cap+L.bld,mult=(1+m.gold+tb)*p.inc,bonus=gross*(mult-1);
  let up=0;
  for(const t of terrs)if(t.owner===p.id)for(const k of UK)if(k!=='guerrier')up+=t.u[k]*UPKEEP;
  for(const a of armies)if(a.owner===p.id)for(const k of UK)if(k!=='guerrier')up+=a.u[k]*UPKEEP;
  let g2=gross*mult,tout=0,tin=0;
  if(vas[p.id]>=0&&players[vas[p.id]]&&players[vas[p.id]].alive){tout=g2*TRIB;g2-=tout;}
  for(const q of players)if(q.alive&&q.id!==p.id&&vas[q.id]===p.id)tin+=TRIB*goldGross(q);
  return {isl:L.isl*Z,spec:L.spec*Z,city:L.city*Z,cap:L.cap*Z,bld:L.bld*Z,bonus:bonus*Z,tin:tin*Z,tout:tout*Z,up:up*Z,net:(g2+tin-up)*Z,
    gross:gross*mult*Z,per:per.map(o=>({t:o.t,g:o.g*mult*Z})).sort((a,b)=>b.g-a.g),mult};
}
const ecoRow=(l,v,cls,tip)=>'<div class="er '+(cls||'')+'"'+(tip?' title="'+esc(tip)+'"':'')+'><span>'+l+'</span><b>'+(Math.abs(v*TLEN())<.005?'0':sgn(v*TLEN(),2))+'</b></div>';
function rkBuys(p){
  /* ce qu'on peut acheter bientôt, avec le nombre de tours d'épargne nécessaires */
  const E=rkEco(p),net=E.net*TLEN(),o=[];
  const cap=terrs.find(t=>t.owner===p.id&&t.capital)||terrs.find(t=>t.owner===p.id);
  const eta=c=>p.gold>=c?'maintenant':net>0.01?'dans ≈ '+Math.ceil((c-p.gold)/net)+' '+TUN()+(Math.ceil((c-p.gold)/net)>1&&TM.on?'s':''):'jamais à ce rythme';
  if(cap)o.push(['Lot de Pirates (+'+UNITS.guerrier.batch+' troupes)',recruitCost(p,cap,'guerrier'),'Plus de force pour attaquer ou défendre']);
  const free=terrs.find(t=>t.owner===p.id&&!t.city&&!t.spec&&!t.capital&&t.u.guerrier>=CITY_UNITS+1);
  if(free)o.push(['Fonder une ville à '+free.name,CITY_COST,'Revenu plus élevé, bâtiments, +1 emplacement']);
  for(const t of terrs){
    if(t.owner!==p.id||!t.city)continue;
    const id=['marche','caserne','muraille'].find(i=>buildReason(p,t,i,true)==='');
    if(id){o.push([BUILDINGS[id].n+' à '+t.name,BUILDINGS[id].cost,id==='marche'?'+'+sgn(BLD_INCOME.marche.g*E.mult/PK*TLEN(),2).replace('+','')+' ฿/'+TUN():BUILDINGS[id].d]);break;}
  }
  return o.map(x=>({n:x[0],c:x[1],why:x[2],eta:eta(x[1])}));
}
function pEco(){
  const p=players[ME];if(!p||!p.x)return '';
  const E=rkEco(p),u=TUN(),net=E.net*TLEN();
  const st=net>=.05?'pos':net<=-.05?'neg':'';
  const verdict=st==='pos'?'Économie positive : tes Berrys augmentent à chaque '+u+'.':st==='neg'?'Économie négative : tu perds des Berrys à chaque '+u+'. Les unités autres que les Pirates coûtent un entretien ; construis un Port marchand ou réduis ton armée.':'Économie à l’équilibre : rien ne s’accumule.';
  let h='<div class="card"><h3>Berrys</h3><div class="ecoh"><div><small>Disponibles</small><b class="big">'+Math.floor(p.gold)+' ฿</b></div>'
    +'<div class="net '+st+'"><small>Revenu net par '+u+'</small><b class="big">'+sgn(net,1)+' ฿</b></div></div>'
    +'<div class="verdict '+st+'">'+verdict+'</div>'
    +'<div class="ecoh2">Revenus par '+u+'</div>'
    +ecoRow('Îles (production de base)',E.isl,'','Terrain de chaque île : plage, jungle, volcan')
    +(E.spec?ecoRow('Villages spécialisés',E.spec):'')
    +ecoRow('Villes et niveaux',E.city,'','Villes fondées et leurs niveaux')
    +(E.cap?ecoRow('Capitale',E.cap,'','Bonus de votre capitale'):'')
    +(E.bld?ecoRow('Bâtiments (Port marchand…)',E.bld):'')
    +ecoRow('Bonus (techno, camp, commerce, héritage)',E.bonus,E.bonus>=0?'':'neg')
    +(E.tin?ecoRow('Tribut reçu de vos vassaux',E.tin,'pos'):'')
    +'<div class="ecoh2">Dépenses par '+u+'</div>'
    +ecoRow('Entretien des unités',-E.up,E.up>0?'neg':'','Chaque unité autre que Pirate coûte '+UPKEEP+' ฿/s de jeu (soit '+(UPKEEP/PK*TLEN()).toFixed(2).replace('.',',')+' ฿ par '+u+')')
    +(E.tout?ecoRow('Tribut versé à votre suzerain',-E.tout,'neg'):'')
    +'<div class="er tot '+(st)+'"><span>Net par '+u+'</span><b>'+sgn(net,2)+' ฿</b></div>'
    +'<p class="note">'+(TM.on?'Un tour dure '+TURN_LEN+' s de jeu : c’est la période de résolution pendant laquelle les Berrys tombent.':'Valeurs par minute de jeu.')+' Recruter, construire et agrandir coûtent des Berrys une fois ; les technologies coûtent du Savoir.</p></div>';
  const buys=rkBuys(p);
  if(buys.length)h+='<div class="card"><h3>Anticiper tes achats</h3>'+buys.map(b=>'<div class="lr"><b>'+esc(b.n)+' · '+b.c+' ฿</b><small>'+esc(b.why)+' — <b>'+b.eta+'</b>'+(p.gold>=b.c?' (solde après achat : '+Math.floor(p.gold-b.c)+' ฿)':'')+'</small></div>').join('')
    +'<p class="note">Survole un bouton d’achat : le bandeau « Budget » en haut du panneau montre le solde et le revenu après achat.</p></div>';
  const top=E.per.slice(0,5);
  h+='<div class="card"><h3>Îles qui rapportent le plus</h3>'+top.map(o=>'<div class="lr"><b>'+esc(o.t.name)+(o.t.capital?' · capitale':o.t.city?' · ville '+o.t.city.lvl:'')+'</b><small>'+sgn(o.g*TLEN(),2)+' ฿ par '+u+'</small>'+btn('sel',o.t.id,'Voir',false)+'</div>').join('')
    +'<p class="note">Les îles dont la part est faible gagnent à devenir des villes (Villes → fonder). Le revenu complet, Savoir et Volonté compris, est sur chaque fiche d’île.</p></div>';
  if(RK.rec.length)h+='<div class="card"><h3>Dernières conquêtes</h3>'+RK.rec.slice().reverse().map(r=>'<div class="lr"><b>'+esc(r.tn)+'</b><small>'+r.line+'</small>'+btn('sel',r.id,'Voir',false)+'</div>').join('')+'</div>';
  return h;
}
/* bandeau « Budget » en tête du panneau + aperçu avant achat */
function budgetBar(){
  const p=players[ME];if(!p||!p.x)return '';
  const E=rkEco(p),net=E.net*TLEN();
  return '<div class="budget" id="budget"><span>฿ <b>'+Math.floor(p.gold)+'</b></span><span class="'+(net>=.05?'pos':net<=-.05?'neg':'')+'" title="Revenu net par '+TUN()+'">'+sgn(net,1)+' ฿/'+TUN()+(net<=-.05?' ⚠':'')+'</span><span title="Savoir (technologies)">◈ <b>'+Math.floor(p.sci)+'</b></span><span class="prev" id="bprev">'+esc(RK.prevTxt||'')+'</span></div>';
}
function rkPreview(b){
  const p=players[ME],el=document.getElementById('bprev');if(!el||!p)return;
  if(!b){RK.prevTxt=el.textContent='';return;}
  const a=b.dataset.act,v=b.dataset.v,t=ui.sel>=0?terrs[ui.sel]:null,E=rkEco(p),Z=TLEN()/PK;let c=0,s='',d=0;
  try{
    if(a==='recruit'&&t){c=recruitCost(p,t,v);d=v==='guerrier'?0:-UPKEEP*UNITS[v].batch*Z;s='Recruter '+UNITS[v].pl;}
    else if(a==='foundcity'){c=CITY_COST;s='Fonder une ville';}
    else if(a==='upcity'){const tt=terrs[+v];c=CITY_UP*tt.city.lvl;s='Agrandir la ville';}
    else if(a==='build'&&t){const id=v;const def=defOfBuild(id);c=def.cost;s='Construire '+def.n;const bi=BLD_INCOME[id];if(bi&&bi.g)d=bi.g*E.mult*Z;}
    else if(a==='tech'){const T=TECH[v];if(T){s='Technologie '+T.n+' : −'+T.cost+' savoir (reste '+Math.floor(p.sci-T.cost)+')';RK.prevTxt=el.textContent=p.sci<T.cost?s+' · savoir insuffisant':s;return;}}
    else if(a==='fort'){const tt=terrs[+v];c=fortCost(tt,p);s='Fortifier';}
    else if(a==='hire'){c=recCost(p,+v);s='Recruter '+LEGENDS[+v].s;}
    else if(a==='spec'){c=SPEC_COST;s='Spécialiser';}
    else{RK.prevTxt=el.textContent='';return;}
  }catch(_){RK.prevTxt=el.textContent='';return;}
  const after=p.gold-c,net=E.net*TLEN()+d;
  RK.prevTxt=el.textContent=s+' : −'+c+' ฿ → solde '+Math.floor(after)+' ฿'+(after<0?' (insuffisant)':'')+' · revenu net '+sgn(net,2)+' ฿/'+TUN()+(Math.abs(d)>.005?' ('+sgn(d,2)+')':'');
}
document.addEventListener('mouseover',e=>{const b=e.target.closest&&e.target.closest('#side [data-act]');rkPreview(b&&b.dataset.act!=='tab'?b:null);});
document.addEventListener('focusin',e=>{const b=e.target.closest&&e.target.closest('#side [data-act]');rkPreview(b&&b.dataset.act!=='tab'?b:null);});
document.addEventListener('pointerdown',e=>{const b=e.target.closest&&e.target.closest('#side [data-act]');if(b&&b.dataset.act!=='tab')rkPreview(b);},true);

/* ---------- bandeau de phase (tours simultanés) ---------- */
function rkPhaseHTML(){
  if(!started||!players.length||over)return '';
  if(!TM.on){
    return {cls:'rt',h:'<span class="ph-turn">Temps réel</span><span class="ph-state"><i></i>'+(speed===0?'En pause':'Tout se déroule en continu')+'</span><span class="ph-sub">Pas de tours : les armées partent tout de suite. Espace = pause, touches 1 à 3 = vitesse.</span>'};
  }
  const res=TM.phase==='res';
  const pcs=players.map(p=>{
    let st;
    if(!p.alive)st='éliminé';
    else if(res)st='▶ en action';
    else if(p.human)st=TM.ready[p.id]?'✔ prêt':'✎ ordres en cours';
    else st='🤖 jouera à la résolution';
    const ok=p.alive&&((res)||(!p.human)||TM.ready[p.id]);
    return '<span class="pc'+(ok?' ok':'')+(p.id===ME?' me':'')+'" style="--c:'+p.color+'" title="'+esc(cname(p))+'">'+CREWS[p.crew||0].ic+' '+esc(p.id===ME?'Vous':cname(p))+' <em>'+st+'</em></span>';
  }).join('');
  const wait=players.filter(p=>p.human&&p.alive&&!TM.ready[p.id]).map(p=>p.id===ME?'vous':cname(p));
  let state,sub,bar='';
  if(res){
    state='RÉSOLUTION — on regarde';
    sub='Les ordres de tous les camps s’exécutent en même temps. Résolution : <b>'+Math.ceil(TM.res)+' s</b>, puis nouveau tour.';
    bar='<span class="ph-bar"><i style="width:'+Math.round(Math.max(0,Math.min(100,(1-TM.res/TURN_LEN)*100)))+'%"></i></span>';
  }else{
    state=TM.ready[ME]?'ORDRES — vous êtes prêt':'ORDRES — à vous de jouer';
    sub=(TM.ready[ME]?'En attente de : '+(wait.length?wait.join(', '):'personne')+'. ':'Donnez vos ordres (temps arrêté), puis « Fin de tour ». ')+(TM.planMax>0&&TM.planLeft>=0?'Il reste <b>'+Math.ceil(TM.planLeft)+' s</b>.':'La résolution démarre quand tous les joueurs humains sont prêts.');
  }
  const q=TM.queue.filter(o=>o.s===ME).length;
  return {cls:res?'res':'plan',h:'<span class="ph-turn">Tour '+TM.n+'</span><span class="ph-state"><i></i>'+state+'</span>'+bar+'<span class="ph-camps">'+pcs+'</span><span class="ph-sub">'+sub+(!res&&q?' · '+q+' ordre'+(q>1?'s':'')+' en attente':'')+'</span><button class="ph-q" id="ph-q" aria-label="Comment fonctionnent les tours simultanés ?" title="Comment fonctionnent les tours ?">?</button><div class="ph-mv" id="ph-mv"></div>'
    +(RK.expl?'<div class="phexp"><span><b>1. Ordres</b> : tous les camps décident en même temps, le temps est arrêté. Vos mouvements s’affichent en flèches blanches.</span><span><b>2. Résolution</b> : les ordres de tous partent ensemble (l’IA joue à cet instant) et les armées voyagent pendant '+TURN_LEN+' s ; les Berrys tombent.</span><span><b>3. Nouveau tour</b> : le temps s’arrête de nouveau. Entrée = fin de tour.</span></div>':'')};
}
function rkPhaseTick(){
  const el=document.getElementById('phase');if(!el)return;
  const r=rkPhaseHTML();
  if(!r){el.hidden=true;return;}
  el.hidden=false;
  const mv=RK.mv.filter(m=>performance.now()-m.w<9000).slice(-3);
  const key=r.h+'|'+mv.map(m=>m.id).join(',');
  if(key!==RK.phKey){
    RK.phKey=key;el.className='phase '+r.cls;el.innerHTML=r.h;
    const box=document.getElementById('ph-mv');
    if(box)box.innerHTML=mv.map(m=>'<span class="mv'+(m.me?' me':'')+'" style="--c:'+m.col+'" data-to="'+m.to+'">'+m.txt+'</span>').join('');
  }
}
document.getElementById('phase').addEventListener('click',e=>{
  if(e.target.closest('#ph-q')){RK.expl=!RK.expl;RK.phKey='';rkPhaseTick();return;}
  const m=e.target.closest('.mv');if(m){const id=+m.dataset.to;if(terrs[id]){ui.sel=id;centerOn(id);dirty=true;renderPanel(true);}}
});
/* phase qui change : annonce discrète */
function rkPhaseWatch(){
  if(!TM.on||!started)return;
  const k=TM.n+':'+TM.phase;
  if(k===RK.phase0)return;
  const first=RK.phase0==='';RK.phase0=k;
  if(first)return;
  try{sndFx(TM.phase==='res'?'resolve':'bell');}catch(_){}
}

/* ---------- mouvements visibles : qui attaque quelle île ---------- */
function rkMove(a){
  const f=terrs[a.from],t=terrs[a.to],P=players[a.owner];if(!f||!t||!P)return;
  const tgt=t.owner>=0?players[t.owner]:null;
  if(a.owner===ME||(tgt&&tgt.id===a.owner))return;  /* vos ordres et les renforts internes ne sont pas annoncés */
  if(!tgt){
    if(!started)return;
    const n0=Math.floor(sumU(a.u));
    RK.mv.push({id:a.id,w:performance.now(),txt:CREWS[P.crew||0].ic+' <b>'+esc(cname(P))+'</b> s’étend vers '+esc(t.name)+' (neutre) · '+n0+' troupes',col:P.color,to:t.id,me:false});
    if(RK.mv.length>8)RK.mv.shift();RK.phKey='';return;
  }
  const n=Math.floor(sumU(a.u));
  const toMe=tgt&&tgt.id===ME;
  const col=P.color;
  const txt=CREWS[P.crew||0].ic+' <b>'+esc(cname(P))+'</b> '+(toMe?'<b style="color:var(--bad)">attaque votre île '+esc(t.name)+'</b>':'attaque '+esc(t.name)+(tgt?' ('+esc(cname(tgt))+')':' (neutre)'))+' · '+n+' troupes';
  RK.mv.push({id:a.id,w:performance.now(),txt:txt,col:col,to:t.id,me:toMe});
  if(RK.mv.length>8)RK.mv.shift();
  RK.phKey='';
  if(toMe){RK.lastAtk[ME]=a.owner;addLog('⚠ '+cname(P)+' attaque '+t.name+' ('+n+' troupes, arrivée dans ≈ '+Math.ceil(a.dur/Math.max(1,speed))+' s).','#ef6a62',ME);try{sndFx('alarm');}catch(_){}}
  else if(!tgt&&a.owner!==ME&&started){/* conquête de territoire neutre par un rival : pas de bruit */}
}
function launch(pid,from,to,pct,st){
  const n0=armies.length,r=launch_o(pid,from,to,pct,st);
  if(!r&&armies.length>n0){try{rkMove(armies[armies.length-1]);}catch(_){}}
  return r;
}
/* l'IA joue à chaque tour : décisions prises au début de la résolution, en même temps que les ordres des joueurs */
function rkAiReact(p){
  for(const a of armies){
    if(a.owner===p.id||a.rt)continue;
    const t=terrs[a.to];if(!t||t.owner!==p.id||!isWar(a.owner,p.id))continue;
    const A=attTotal(a.owner,a.u,t,false,a.from),D=defTotal(t,a.u,false);
    if(A<D*.85)continue;
    let best=null;for(const n of t.nb){const o=terrs[n];if(o.owner===p.id&&n!==a.from&&(!best||tr(o)>tr(best)))best=o;}
    if(best&&tr(best)>=6)launch(p.id,best.id,t.id,.6);
  }
}
function rkAiTurn(){
  if(TU.on&&TU.freeze)return;
  for(const p of players){
    if(!p.alive||p.human)continue;
    try{rkAiReact(p);aiThink(p);}catch(_){}
  }
}
