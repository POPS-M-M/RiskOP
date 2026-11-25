/* ================= COURSE VERS LAUGH TALE : règles « Autorité » (version test, 25/11/2026) =================
   Refonte des objectifs demandée par l'utilisateur (« applique tout ») après le constat que la Révolution ne gagnait presque jamais
   (éliminée 19 fois sur 25 dans les parties de l'IA : ses points ne venaient que de batailles gagnées contre la Marine).
   Règles choisies à l'écran d'accueil (« Règles : Autorité » par défaut) ; « Phase 2 » garde les anciennes règles à l'identique.
   1. Jauge publique « Autorité du Gouvernement mondial » (0 à 100, départ 70) : la Marine la fait monter, la Révolution la fait tomber,
      les pirates l'abîment en gagnant contre la Marine et en déchiffrant.
   2. Victoires : Pirates inchangés (tenir Laugh Tale 90 s). Révolution : Autorité à 0, puis la garder sous 15 pendant 90 s.
      Marine : Autorité à 100, puis la garder au-dessus de 85 pendant 90 s sans route de Laugh Tale ouverte.
      Fin de la phase finale : Autorité ≥ 60 → la Marine gagne, ≤ 40 → la Révolution gagne, entre les deux → pas de vainqueur.
   3. Ponéglyphes de Route cachés (tirés au sort avec la graine) : on les découvre en tenant l'île ou une voisine, ou par l'opération
      « Indice » (savoir) ; prendre la capitale d'un équipage rival copie un de ses déchiffrages.
   4. La Marine et la Révolution commencent en guerre. Les autres relations restent libres.
   Valeurs marquées [réglage] : à ajuster avec les parties jouées. */
(function(){
if(typeof CS==='undefined')return;
const R=Math.round,K=()=>PK/6;
const role=i=>CS.S&&CS.S[i]&&CS.S[i].role;
const pn=i=>players[i]?players[i].name:'?';
const log=(txt,col,to)=>{try{addLog(txt,col||'#f2c75c',to);}catch(_){}};
const V2=()=>CS.on&&CS.o&&CS.o.v2&&!!Y;
const AUT={start:70,hold:90,revoLow:15,marHigh:85,endM:65,endR:40,   /* [réglage] */
  base:.0035,revoIsl:-.003,                                            /* par seconde : par base tenue par la Marine, par île révolutionnaire */
  m2r:-3,m2rCity:-2,m2p:-1.5,p2m:1.5,r2m:2,dec:-1.5,open:-5};             /* événements */
let Y=null,D=null;
function dist(){const n=terrs.length;D=terrs.map((_,s)=>{const d=new Array(n).fill(99);d[s]=0;const q=[s];while(q.length){const u=q.shift();for(const v of terrs[u].nb)if(d[v]>d[u]+1){d[v]=d[u]+1;q.push(v);}}return d;});}
const seatOf=r=>players.findIndex(p=>role(p.id)===r);
const regOf=id=>(typeof regs!=='undefined'&&regs.find(r=>r.ids.includes(id)))||null;

CS.ruleSel=()=>{try{return localStorage.getItem('rk-cregle')||'v2';}catch(_){return 'v2';}};
CS.aut=function(d,why){if(!V2())return;const a0=Y.aut;Y.aut=Math.max(0,Math.min(100,Y.aut+d));if(Math.abs(d)>=1.5&&Y.hist.length<600)Y.hist.push([R(time),R(Y.aut),why]);return Y.aut-a0;};
CS.autV=()=>V2()?Y.aut:null;
CS._Y=()=>Y;   /* essais */

/* ---------- démarrage ---------- */
function drawPone(){
  let s=((typeof seed==='number'?seed:1)*2654435761+97)>>>0;const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
  const caps=terrs.filter(t=>t.capital).map(t=>t.id),ban=new Set([CS.LT,CS.LS,CS.MG,CS.EG,...CS.BASES.map(b=>b[0])]);
  const pc=players.filter(p=>role(p.id)==='pirate').map(p=>{const c=terrs.find(t=>t.capital&&t.owner===p.id);return c?c.id:-1;}).filter(x=>x>=0);
  const dp=id=>Math.min(...pc.map(c=>D[c][id]));   /* [réglage] ni trop près ni trop loin des équipages : entre 2 et 4 îles de la capitale pirate la plus proche */
  let pool=terrs.filter(t=>!t.capital&&!ban.has(t.id)&&caps.every(c=>D[c][t.id]>=2)&&dp(t.id)<=4).map(t=>t.id);
  if(pool.length<6)pool=terrs.filter(t=>!t.capital&&!ban.has(t.id)&&caps.every(c=>D[c][t.id]>=2)).map(t=>t.id);
  /* tirage équitable : parmi 300 tirages de 4 îles espacées, celui où les trois équipages sont le plus à égalité (somme des distances) */
  const one=()=>{const out=[];for(let tries=0;out.length<4&&tries<400;tries++){const id=pool[Math.floor(rnd()*pool.length)];if(out.includes(id))continue;if(tries<300&&out.some(o=>D[o][id]<2))continue;out.push(id);}return out.length===4?out:null;};
  let best=null,bv=1e9;for(let n=0;n<300;n++){const c=one();if(!c)continue;const sums=pc.map(cp=>c.reduce((a,id)=>a+D[cp][id],0));const v=Math.max(...sums)-Math.min(...sums)+rnd()*.5;if(v<bv){bv=v;best=c;}}
  return best||CS.PONE;
}
{const i0=CS.init;CS.init=function(o){i0.apply(this,arguments);Y=null;if(!(o&&o.v2))return;dist();
  Y={aut:AUT.start,hist:[],last:terrs.map(t=>t.owner),dec:players.map(()=>0),open:players.map(()=>false),clue:players.map(()=>[0,0,0,0]),exp:players.map(()=>terrs.map(()=>0)),rT:0,mT:0,canon:CS.PONE.slice()};
  if(o.pone==='cache')CS.PONE=drawPone();
  const m=seatOf('marine'),r=seatOf('revo');if(m>=0&&r>=0){setRel(m,r,'war');warSince[m][r]=warSince[r][m]=time;}
};}
{const s0=CS.save;CS.save=function(){const o=s0();if(Y){o.Y=Y;o.PONE=CS.PONE.slice();}return o;};}
{const l0=CS.load;CS.load=function(z){l0(z);Y=z.Y||null;if(Y){dist();if(z.PONE)CS.PONE=z.PONE;}};}

/* ---------- objectifs et progression ---------- */
{const p0=CS.prog;CS.prog=function(i){if(!V2())return p0(i);const r=role(i);if(r==='marine')return R(Y.aut);if(r==='revo')return R(100-Y.aut);return p0(i);};}
{const k0=CS.knows;CS.knows=function(s,q){if(V2()&&(role(q)==='marine'||role(q)==='revo'))return true;return k0?k0(s,q):true;};}
{const d0=CS.decWhy;CS.decWhy=function(i,k){if(V2()&&role(i)==='pirate'&&CS.S[i].found[k]===null&&CS.S[i].dec[k]===null)return 'Ponéglyphe pas encore découvert.';return d0(i,k);};}
{const p0=CS.prepWhy;CS.prepWhy=function(i){if(V2())return 'Règles « Autorité » : pas de préparation, faites tomber l\'Autorité.';return p0(i);};}
{const t0=CS.targets;CS.targets=function(p){if(!V2())return t0(p);const i=p.id,S=CS.S[i],r=S.role,out=[];
  if(r==='pirate'){
    if(S.open!==null)return [CS.LT,CS.LS];
    const left=[0,1,2,3].filter(k=>S.dec[k]===null);if(!left.length)return [CS.LS];
    const known=left.filter(k=>S.found[k]!==null).map(k=>CS.PONE[k]);if(known.length)return known;
    for(const k of left){if(Y.clue[i][k]>=1){const g=regOf(CS.PONE[k]);if(g)for(const id of g.ids)if(!Y.exp[i][id])out.push(id);}}
    if(out.length)return out;
    for(const t of terrs)if(!Y.exp[i][t.id]&&t.id!==CS.LT&&t.id!==CS.MG)out.push(t.id);
    return out.length?out:[CS.LS];
  }
  if(r==='marine'){for(const [id] of CS.BASES)if(terrs[id].owner!==i)out.push(id);for(const id of CS.PASS)if(terrs[id].owner!==i)out.push(id);
    for(const t of terrs)if(t.owner>=0&&role(t.owner)==='revo')out.push(t.id);if(terrs[CS.LT].owner>=0)out.push(CS.LT);return out;}
  for(const t of terrs)if(t.owner>=0&&role(t.owner)==='marine')out.push(t.id);return out;};}

/* ---------- opération « Indice » (pirates) ---------- */
const indK=s=>{const S=CS.S[s];const ks=[0,1,2,3].filter(k=>S.dec[k]===null&&S.found[k]===null&&Y.clue[s][k]<2);return ks.find(k=>Y.clue[s][k]===1)??ks[0];};
CS.indWhy=s=>{if(!V2())return 'Réservé aux règles « Autorité ».';if(role(s)!=='pirate')return 'Réservé aux équipages pirates.';return indK(s)===undefined?'Tous vos Ponéglyphes restants sont déjà situés.':'';};
CS.indDo=s=>{const k=indK(s);if(k===undefined)return;Y.clue[s][k]++;const id=CS.PONE[k],g=regOf(id);
  if(Y.clue[s][k]>=2||!g){CS.S[s].found[k]=time;log('📖 Indice : un Ponéglyphe de Route se trouve à '+terrs[id].name+'.','#f2c75c',s);}
  else log('📖 Indice : un Ponéglyphe de Route se trouve dans la région « '+g.n+' ».','#f2c75c',s);};
CS.poneLbl=(s,k)=>{const id=CS.PONE[k],a='<a href="#" data-cs="sel:'+id+'" onclick="return false">'+esc(terrs[id].name)+'</a>';
  if(!V2())return a;const S=CS.S[s];if(S.found[k]!==null||S.dec[k]!==null)return a;const g=regOf(id);
  return '<i>Ponéglyphe inconnu</i>'+(Y.clue[s][k]>=1&&g?' <small>(région '+esc(g.n)+')</small>':'');};

/* ---------- chaque seconde ---------- */
function sec(){
  if(!V2()||over)return;
  const m=seatOf('marine'),rv=seatOf('revo');
  /* changements de propriétaire */
  for(const t of terrs){const a=Y.last[t.id],b=t.owner;if(a===b)continue;Y.last[t.id]=b;
    const ra=a>=0?role(a):null,rb=b>=0?role(b):null;
    if(ra==='marine'&&rb==='revo'){CS.aut(AUT.m2r+(t.city?AUT.m2rCity:0),'île libérée : '+t.name);}
    else if(ra==='marine'&&rb==='pirate')CS.aut(AUT.m2p,'défaite de la Marine : '+t.name);
    else if(ra==='pirate'&&rb==='marine')CS.aut(AUT.p2m,'île reprise aux pirates : '+t.name);
    else if(ra==='revo'&&rb==='marine')CS.aut(AUT.r2m,'île reprise à la Révolution : '+t.name);}
  /* pirates : exploration, découverte à proximité, déchiffrages et route */
  for(const p of players){if(!p.alive||role(p.id)!=='pirate')continue;const i=p.id,S=CS.S[i],E=Y.exp[i];
    for(const t of terrs)if(t.owner===i){E[t.id]=1;for(const n of t.nb)E[n]=1;}
    for(let k=0;k<4;k++){const id=CS.PONE[k];if(S.found[k]===null&&(terrs[id].owner===i||terrs[id].nb.some(n=>terrs[n].owner===i))){S.found[k]=time;log('📜 Ponéglyphe de Route découvert à '+terrs[id].name+' !','#f2c75c',i);}}
    const nd=S.dec.filter(v=>v!==null).length;if(nd>Y.dec[i]){CS.aut(AUT.dec*(nd-Y.dec[i]),'déchiffrage pirate');Y.dec[i]=nd;}
    if(S.open!==null&&!Y.open[i]){Y.open[i]=true;CS.aut(AUT.open,'route de Laugh Tale ouverte');}}
  /* dérive : bases tenues par la Marine, îles de la Révolution */
  {let d=0;if(m>=0&&players[m].alive)d+=AUT.base*CS.BASES.filter(b=>terrs[b[0]].owner===m).length;if(rv>=0&&players[rv].alive)d+=AUT.revoIsl*terrs.filter(t=>t.owner===rv).length;Y.aut=Math.max(0,Math.min(100,Y.aut+d));}
  /* opérations finales */
  const fin=AUT.hold*K();
  if(rv>=0&&players[rv].alive){if(Y.rT>0){if(Y.aut<=AUT.revoLow){Y.rT+=1;if(Y.rT>=fin)return CS.victory(rv,'fait tomber le Gouvernement mondial.');}else{Y.rT=0;log('Le Gouvernement mondial reprend la main : l\'effondrement est évité.','#9ec5ff');}}
    else if(Y.aut<1){Y.rT=1;log('⚠ L\'Autorité du Gouvernement mondial s\'effondre : la Révolution gagne si elle reste sous '+AUT.revoLow+' pendant '+R(fin)+' s.','#ff6a5e');}}
  if(m>=0&&players[m].alive){const open=players.some(q=>q.alive&&role(q.id)==='pirate'&&CS.S[q.id].open!==null);
    if(Y.mT>0){if(Y.aut>=AUT.marHigh&&!open){Y.mT+=1;if(Y.mT>=fin)return CS.victory(m,'impose l\'ordre absolu sur les mers.');}else{Y.mT=0;log('L\'ordre absolu vacille : la Marine doit reconstruire son autorité.','#ff9a7a');}}
    else if(Y.aut>99&&!open){Y.mT=1;log('⚠ Ordre absolu : la Marine gagne si l\'Autorité reste au-dessus de '+AUT.marHigh+' pendant '+R(fin)+' s, sans route de Laugh Tale ouverte.','#ff6a5e');}}
}
/* fin de la phase finale : l'Autorité désigne le vainqueur (sinon : pas de vainqueur, comme avant) */
CS.finalV2=function(){if(!V2())return false;const m=seatOf('marine'),rv=seatOf('revo');
  if(Y.aut>=AUT.endM&&m>=0&&players[m].alive){CS.victory(m,'maintient l\'ordre jusqu\'au bout (Autorité '+R(Y.aut)+').');return true;}
  if(Y.aut<=AUT.endR&&rv>=0&&players[rv].alive){CS.victory(rv,'a brisé l\'Autorité du Gouvernement mondial (Autorité '+R(Y.aut)+').');return true;}
  return false;};
{const d0=decTick;decTick=function(){d0();if(CS.on)sec();};}
/* prendre la capitale d'un équipage rival : copie d'un de ses déchiffrages */
{const r0=resolveArrival;resolveArrival=function(a){const t=terrs[a.to],prev=t?t.owner:-1;const r=r0.apply(this,arguments);
  if(V2()&&t&&t.capital&&prev>=0&&prev!==a.owner&&t.owner===a.owner&&role(prev)==='pirate'&&role(a.owner)==='pirate'){
    const A=CS.S[a.owner],B=CS.S[prev],k=[0,1,2,3].find(k=>B.dec[k]!==null&&A.dec[k]===null);
    if(k!==undefined){A.dec[k]=time;if(A.found[k]===null)A.found[k]=time;log('📜 '+pn(a.owner)+' copie les relevés de '+pn(prev)+' : un Ponéglyphe déchiffré de plus.','#f2c75c',[a.owner,prev]);}}
  return r;};}

/* ---------- affichage ---------- */
{const v0=CS.view;CS.view=function(s){const o=v0?v0(s):0;if(o&&V2())o.aut=R(Y.aut);return o;};}
{const h0=CS.hud;CS.hud=function(force){h0.apply(this,arguments);if(!V2())return;const el=document.getElementById('cs-hud');if(!el||el.hidden)return;
  const body=el.querySelector('.cs-body');if(!body)return;let g=body.querySelector('.cs-aut');const a=R(Y.aut);
  const st=Y.rT>0?' <b class="cs-alert">effondrement '+R(Y.rT)+'/'+R(AUT.hold*K())+' s</b>':Y.mT>0?' <b class="cs-alert">ordre absolu '+R(Y.mT)+'/'+R(AUT.hold*K())+' s</b>':'';
  const html='<div class="cs-aut-h">Autorité du Gouvernement mondial <b>'+a+'</b>'+st+'</div><span class="cs-autbar"><i style="width:'+a+'%"></i><em style="left:'+AUT.endR+'%"></em><em style="left:'+AUT.endM+'%"></em></span>';
  if(!g){g=document.createElement('div');g.className='cs-aut';g.title='La Marine la fait monter (bases tenues, îles reprises, arrestations, Buster Call) ; la Révolution la fait tomber (îles libérées, sabotages, insurrections) ; les pirates l\'abîment (victoires contre la Marine, déchiffrages). À la fin : ≥ '+AUT.endM+' la Marine gagne, ≤ '+AUT.endR+' la Révolution gagne.';body.prepend(g);}
  if(g.innerHTML!==html)g.innerHTML=html;};}
CS.rulesV2=function(){return '<ul>'
 +'<li><b>Cinq sièges</b> : la Marine, l\'Armée révolutionnaire et trois équipages pirates rivaux. Les places que vous ne prenez pas sont jouées par l\'IA, sans bonus de ressources.</li>'
 +'<li><b>Autorité du Gouvernement mondial</b> (jauge publique, départ '+AUT.start+'/100) : la Marine la fait monter (bases tenues, îles reprises, agents arrêtés, Buster Call), la Révolution la fait tomber (îles libérées, villes prises, sabotages, insurrections, îles tenues), les pirates l\'abîment (victoires contre la Marine, déchiffrages, route de Laugh Tale ouverte).</li>'
 +'<li><b>Pirates</b> : les 4 Ponéglyphes de Route sont <b>cachés</b> (tirés au sort). On en découvre un en tenant son île ou une voisine, ou par l\'opération Indice (1er indice : la région, 2e : l\'île). On le déchiffre depuis l\'île ou une voisine ('+R(80*1.5)+' s au rythme Standard). Prendre la capitale d\'un équipage rival copie un de ses déchiffrages. Puis tenir Lodestar 60 s : la route s\'ouvre pour vous seul. Victoire : tenir Laugh Tale 90 s.</li>'
 +'<li><b>Révolution</b> : faire tomber l\'Autorité à 0, puis la garder sous '+AUT.revoLow+' pendant 90 s. Commence en guerre contre la Marine.</li>'
 +'<li><b>Marine</b> : empêcher Laugh Tale et maintenir l\'ordre. Victoire avant la fin : Autorité à 100, puis au-dessus de '+AUT.marHigh+' pendant 90 s sans route de Laugh Tale ouverte.</li>'
 +'<li><b>Fin de l\'âge III</b> : phase finale de 300 s. À son terme, sans autre vainqueur : Autorité ≥ '+AUT.endM+' → la Marine gagne ; ≤ '+AUT.endR+' → la Révolution gagne ; entre les deux → pas de vainqueur. Éliminer tous les autres sièges fait aussi gagner.</li>'
 +'<li><b>Brouillard de guerre</b> et <b>opérations</b> : voir le panneau Course (Marine : Localisation, Blocus, Buster Call, Poursuite ; Révolution : Infiltration, Sabotage, Insurrection ; Pirates : Indice, Se faire discret). Les alliés partagent leur vue ; les alliances restent libres et sans victoire commune.</li>'
 +'</ul>';};
for(const s of CS.SEATS){if(s.role==='marine')s.d='Contrôle et traque : maintenir l\'ordre du Gouvernement mondial et empêcher les pirates d\'atteindre Laugh Tale.';
  if(s.role==='revo')s.d='Déstabiliser le Gouvernement mondial : agents, sabotages, insurrections et îles libérées.';}
{const st=document.createElement('style');st.textContent='#cs-hud .cs-aut{margin:2px 0 7px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,.1)}#cs-hud .cs-aut-h{font-size:11.5px;margin-bottom:3px}#cs-hud .cs-autbar{position:relative;display:block;height:8px;border-radius:4px;background:linear-gradient(90deg,#3dbd6a 0%,#3dbd6a 40%,#8c97a6 40%,#8c97a6 60%,#3d7bd6 60%,#3d7bd6 100%);opacity:.95}#cs-hud .cs-autbar i{position:absolute;left:0;top:0;bottom:0;background:rgba(255,255,255,.35);border-right:2px solid #fff}#cs-hud .cs-autbar em{position:absolute;top:-2px;bottom:-2px;width:1px;background:#fff;opacity:.6}';document.head.appendChild(st);}
})();
