/* ================= COMBAT TACTIQUE — PROTOTYPE JOUABLE (version test, branche essai/tactique-proto) =================
   Conception : doc « RISK OP Adventure — Conception du combat tactique interactif » (23/11/2026), section 11.
   Démonstration seulement : une bataille sur Alabasta (Marine de Garp contre Pirates d'Ace), lancée par le bouton « Combat tactique (démo) ».
   Rien n'est lu pour être modifié dans la partie : îles, effectifs, propriétaires, commandants, sauvegardes restent tels quels ; le monde est
   en pause pendant la démonstration (comme pendant une scène de combat) et reprend ensuite.
   Règles (manches à ordres simultanés) : chaque escouade reçoit un ordre (Déplacer, Attaquer, Tenir, Repli, Pouvoir pour un commandant) ;
   puis la manche se joue : pouvoirs, mouvements, tirs, mêlées, moral. Tous les chiffres sont des choix d'équilibrage du prototype [I]. */
const TAC={comp:[10,9,10,9,8,13,8,11],run:null,S:1.2,W:12,H:9,ROUNDS:10,hs:2.1,hsCmd:2.4,
  K:{dmg:.38,charge:1.3,flank:1.25,back:1.5,hold:1.25,cover:.7,high:1.1,uphill:.8,shaken:.7,moved:.75,riposte:.5,logia:.5,aura:1.1,power:.28}};
const TAC_UNITS={
  guerrier:{n:'Recrues',atk:1,def:1,rng:1,spd:3},lancier:{n:'Sabreurs',atk:.8,def:1.5,rng:1,spd:3},archer:{n:'Tireurs',atk:1.5,def:.6,rng:4,spd:3},
  hero:{n:'Commandant',atk:1,def:1,rng:1,spd:3}};
/* contres du jeu : Sabreurs > Unités d'assaut > Tireurs > Sabreurs ; seuls Recrues, Sabreurs et Tireurs ont une planche */
const TAC_CONTRE={archer:'lancier',lancier:'cavalier',cavalier:'archer'};
const TAC_HEROS={
  Garp:{asset:'cmd_garp',hp:20,pow:14,def:2,haki:true,power:{n:'Poing de météore',cd:3,rng:4,aire:2,d:'Boulets lancés à la main sur 2 × 2 cases, à 4 cases au plus.'},aura:'Défense +10 % des escouades à 2 cases ; il rallie les escouades ébranlées.'},
  Ace:{asset:'cmd_ace',hp:18,pow:13,def:1.6,logia:true,power:{n:'Hiken',cd:3,rng:4,ligne:4,d:'Ligne de feu de 4 cases ; la végétation touchée brûle 2 manches.'},aura:'Logia : il ne subit que la moitié des coups, sauf face au Haki de l\'Armement (Garp).'}};

/* ---------- carte tactique : cases de 1,2 u (3 × 3 cellules de la grille de marche), orientées sur l'axe d'attaque ---------- */
function tacMap(t,f){
  const G=trpGrid(t);if(!G)return null;const m=W3.models.get(t.id);
  let dx=f.x-t.x,dy=f.y-t.y;const dl=Math.hypot(dx,dy)||1;dx/=dl;dy/=dl;const ang=Math.atan2(dy,dx),rc=m&&m.rc?m.rc(ang):t.rad;
  const U=[dx,dy],V=[-dy,dx],S=TAC.S,W=TAC.W,H=TAC.H;
  const free=(lx,ly)=>{const c=trpCell(G,lx,ly);return trpFree(G,c[0],c[1]);};
  const at=(cx,cy,i,j)=>[cx+U[0]*(i-(W-1)/2)*S+V[0]*(j-(H-1)/2)*S,cy+U[1]*(i-(W-1)/2)*S+V[1]*(j-(H-1)/2)*S];
  /* centre : la zone la plus dégagée sur l'axe d'attaque, entre la plage et le centre de l'île */
  let best=null,bs=-1;
  for(const r0 of [.15,.25,.35,.45,.55])for(const l of [0,.1,-.1,.2,-.2,.3,-.3]){const cx=U[0]*r0*rc+V[0]*l*rc,cy=U[1]*r0*rc+V[1]*l*rc;let n=0;
    for(let i=0;i<W;i++)for(let j=0;j<H;j++){const [x,y]=at(cx,cy,i,j);if(free(x,y))n++;}
    const sc=n-Math.abs(l)*8;if(sc>bs){bs=sc;best=[cx,cy];}}
  const [cx,cy]=best,T=[];
  for(let i=0;i<W;i++){T.push([]);for(let j=0;j<H;j++){const [x,y]=at(cx,cy,i,j);let fc=0,hs=0,hn=0,wet=0;
    for(const a of [-.4,0,.4])for(const b of [-.4,0,.4]){const px=x+U[0]*a+V[0]*b,py=y+U[1]*a+V[1]*b;const h=G.Hs(px,py);if(h<=.06)wet++;if(free(px,py)){fc++;hs+=Math.max(0,h);hn++;}}
    const h=hn?hs/hn:Math.max(0,G.Hs(x,y));let k=fc>=6?(fc<9?'couvert':'libre'):(wet>=5?'eau':'bloque');
    T[i].push({i,j,lx:x,ly:y,x:t.x+x,y:t.y+y,z:h,k,haut:false,feu:0});}}
  for(let i=0;i<W;i++)for(let j=0;j<H;j++){const c=T[i][j];if(!tacPass(c))continue;let mn=1e9,nb=0;
    for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const d=T[i+a]&&T[i+a][j+b];if(d&&tacPass(d)){mn=Math.min(mn,d.z);nb++;}}
    if(nb&&c.z-mn>.45)c.haut=true;}
  return {t,G,U,V,cx,cy,T,W,H,free:bs};
}
const tacPass=c=>c&&(c.k==='libre'||c.k==='couvert')&&!c.feu;
const tacCost=c=>c.k==='couvert'?2:1;
const tacD=(a,b)=>Math.max(Math.abs(a.i-b.i),Math.abs(a.j-b.j));   /* distance en cases (8 voisins) */
/* ligne de vue : les cases bloquées et le couvert traversé (plus d'une case) coupent le tir */
function tacVue(M,a,b){const n=Math.max(Math.abs(b.i-a.i),Math.abs(b.j-a.j));let cov=0;
  for(let s=1;s<n;s++){const i=Math.round(a.i+(b.i-a.i)*s/n),j=Math.round(a.j+(b.j-a.j)*s/n),c=M.T[i][j];if(c.k==='bloque')return false;if(c.k==='couvert'&&++cov>1)return false;}return true;}

/* ---------- bataille ---------- */
function tacNew(opt){
  opt=opt||{};const t=terrs.find(q=>q.name==='Alabasta');if(!t)return null;const f=terrs[(t.nb||[]).find(n=>terrs[n].boss===undefined)]||terrs[(t.nb||[])[0]];
  const M=tacMap(t,f);if(!M)return null;
  const side=opt.side||0;   /* 0 : le joueur commande la Marine (attaquant), 1 : les Pirates (défenseur) */
  const R={M,t,round:1,phase:'ordres',sq:[],sel:null,mode:null,log:[],hold:0,end:null,side,seed:opt.seed||((Date.now()/1000)|0),fx:[],labels:[],
    col:['#4a8fe0','#e0484f']};
  let rs=R.seed;R.rnd=()=>{rs=(rs*1664525+1013904223)>>>0;return rs/4294967296;};
  /* objectif : la case libre la plus « intérieure » au centre de la zone (le côté plage est i grand) */
  let ob=null;for(let i=1;i<5&&!ob;i++)for(const dj of [0,1,-1,2,-2,3,-3]){const c=M.T[i][Math.floor(M.H/2)+dj];if(tacPass(c)&&c.k==='libre'){ob=c;break;}}
  R.obj=ob||M.T[2][Math.floor(M.H/2)];
  const free=(cands)=>{for(const c of cands)if(tacPass(c)&&!R.sq.some(s=>s.c===c))return c;return null;};
  const zone=(i0,i1)=>{const L=[];for(let i=i0;i!==i1;i+=i1>i0?1:-1)for(const dj of [0,1,-1,2,-2,3,-3,4,-4])L.push(M.T[i][Math.floor(M.H/2)+dj]);return L.filter(Boolean);};
  const add=(sd,kind,n,asset,hero)=>{const H=hero?TAC_HEROS[hero]:null,c=sd===0?free(zone(M.W-1,M.W-5)):free(hero?zone(0,4).filter(q=>q!==R.obj&&tacD(q,R.obj)<=1).concat(zone(0,6)):[R.obj].concat(zone(1,6)));if(!c)return;
    R.sq.push({id:R.sq.length,sd,kind:hero?'hero':kind,n:hero?H.hp:n,n0:hero?H.hp:n,asset:hero?H.asset:asset,hero,c,face:sd===0?Math.atan2(-M.U[1],-M.U[0]):Math.atan2(M.U[1],M.U[0]),
      ord:{k:'tenir'},cd:0,moral:0,out:false,path:[c],x:c.x,y:c.y,z:c.z});};
  const C=opt.comp||TAC.comp;
  add(0,null,0,null,'Garp');add(0,'guerrier',C[0],'marine_recrue');add(0,'lancier',C[1],'marine_sabreur');add(0,'guerrier',C[2],'marine_recrue');add(0,'lancier',C[3],'marine_sabreur');
  add(1,null,0,null,'Ace');add(1,'archer',C[4],'pirate_tireur');add(1,'guerrier',C[5],'pirate_recrue');add(1,'archer',C[6],'pirate_tireur');add(1,'guerrier',C[7],'pirate_recrue');
  return R;
}
const tacAlive=s=>!s.out&&s.n>0;
const tacName=s=>s.hero?s.hero:(TAC_UNITS[s.kind].n+' ×'+Math.round(s.n));
const tacUnit=s=>s.hero?{atk:1,def:TAC_HEROS[s.hero].def,rng:1,spd:3}:TAC_UNITS[s.kind];
function tacNb(R,c,pred){const out=[];for(const s of R.sq)if(tacAlive(s)&&tacD(s.c,c)<=1&&s.c!==c&&(!pred||pred(s)))out.push(s);return out;}
function tacAt(R,c){return R.sq.find(s=>tacAlive(s)&&s.c===c)||null;}
/* chemin (8 voisins, coûts) en évitant les cases occupées ; renvoie les cases jusqu'à la destination (ou la plus proche atteignable) */
function tacPath(R,s,goal,budget,stopNear){
  const M=R.M,key=c=>c.i*64+c.j,start=s.c,dist=new Map([[key(start),0]]),prev=new Map(),Q=[start];let bestC=start,bestD=tacD(start,goal);
  while(Q.length){Q.sort((a,b)=>dist.get(key(a))-dist.get(key(b)));const c=Q.shift(),d=dist.get(key(c));
    const hd=tacD(c,goal);if(hd<bestD||(hd===bestD&&d<dist.get(key(bestC)))){bestD=hd;bestC=c;}if(c===goal)break;
    if(c!==start&&tacNb(R,c,q=>q.sd!==s.sd).length)continue;   /* zone de contrôle : on s'arrête au contact */
    for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){if(!a&&!b)continue;const n=M.T[c.i+a]&&M.T[c.i+a][c.j+b];if(!tacPass(n))continue;
      if(a&&b&&(!tacPass(M.T[c.i+a][c.j])||!tacPass(M.T[c.i][c.j+b])))continue;const o=tacAt(R,n);if(o&&o!==s&&!(stopNear&&n===goal))continue;if(o&&o!==s)continue;
      const nd=d+tacCost(n);if(nd>budget)continue;if(!dist.has(key(n))||nd<dist.get(key(n))){dist.set(key(n),nd);prev.set(key(n),c);Q.push(n);}}}
  const P=[];for(let c=bestC;c;c=prev.get(key(c))){P.push(c);if(c===start)break;}return P.reverse();
}
/* ---------- intelligence du camp adverse (et des deux camps en résolution automatique) ---------- */
function tacAI(R,sd){
  const att=sd===0,mine=R.sq.filter(s=>s.sd===sd&&tacAlive(s)),foes=R.sq.filter(s=>s.sd!==sd&&tacAlive(s));if(!foes.length)return;
  for(const s of mine){const u=tacUnit(s),near=foes.slice().sort((a,b)=>tacD(s.c,a.c)-tacD(s.c,b.c)),f0=near[0],dd=tacD(s.c,f0.c);
    if(s.moral>=2){s.ord={k:'repli'};continue;}
    if(s.hero){const H=TAC_HEROS[s.hero];if(s.cd<=0){let bc=null,bv=0;for(const f of foes){if(tacD(s.c,f.c)>H.power.rng)continue;const v=tacPowerHits(R,s,f.c).reduce((a,q)=>a+(q.sd!==sd?Math.min(q.n,8):-6),0);if(v>bv){bv=v;bc=f.c;}}
        if(bc&&bv>=8){s.ord={k:'pouvoir',c:bc};continue;}}
      s.ord=dd<=3||att?{k:'attaque',cible:f0.id}:{k:'tenir'};continue;}
    if(u.rng>1){const tg=foes.filter(f=>tacD(s.c,f.c)<=u.rng+(s.c.haut?1:0)&&tacVue(R.M,s.c,f.c)).sort((a,b)=>tacUnit(a).def-tacUnit(b).def||a.n-b.n)[0];
      if(tg){s.ord={k:'attaque',cible:tg.id};continue;}
      if(dd<=u.rng+3||att){s.ord={k:'attaque',cible:f0.id};continue;}s.ord={k:'tenir'};continue;}
    if(att){const troops=foes.filter(f=>!f.hero),onObj=foes.filter(f=>tacD(f.c,R.obj)<=2).sort((a,b)=>tacD(s.c,a.c)-tacD(s.c,b.c))[0];
      if(!tacAt(R,R.obj)&&tacD(s.c,R.obj)<=3&&!foes.some(f=>tacD(f.c,R.obj)<=1)){s.ord={k:'aller',c:R.obj};continue;}
      s.ord={k:'attaque',cible:(dd<=1?f0:(onObj||troops.sort((a,b)=>tacD(s.c,a.c)-tacD(s.c,b.c))[0]||f0)).id};continue;}
    s.ord=dd<=1||(dd<=4&&s.n>=.7*f0.n)?{k:'attaque',cible:f0.id}:{k:'tenir'};}
}
/* cases touchées par un pouvoir */
function tacPowerHits(R,s,c){const H=TAC_HEROS[s.hero],M=R.M,out=[];
  if(H.power.aire){for(const q of R.sq)if(tacAlive(q)&&q.c.i>=c.i&&q.c.i<c.i+H.power.aire&&q.c.j>=c.j&&q.c.j<c.j+H.power.aire)out.push(q);}
  else{for(const cc of tacLine(R,s.c,c,H.power.ligne)){const q=tacAt(R,cc);if(q)out.push(q);}}
  return out;}
function tacLine(R,a,b,n){const M=R.M,di=b.i-a.i,dj=b.j-a.j,L=Math.max(Math.abs(di),Math.abs(dj))||1,out=[];
  for(let s=1;s<=n;s++){const i=Math.round(a.i+di/L*s),j=Math.round(a.j+dj/L*s),c=M.T[i]&&M.T[i][j];if(!c||c.k==='bloque')break;out.push(c);}return out;}

/* ---------- résolution d'une manche (toutes les décisions sont prises avant ; résultat identique à chaque relecture) ---------- */
function tacResolve(R){
  const K=TAC.K,M=R.M,ev={pw:[],mv:[],hit:[],dead:[],moral:[]},dmg=new Map(),add=(s,v,src,ty)=>{dmg.set(s,(dmg.get(s)||0)+v);ev.hit.push({s,v,src,ty});};
  const al=R.sq.filter(tacAlive);for(const s of al){s.n0r=s.n;s.cd=Math.max(0,s.cd-1);s.path=[s.c];s.moved=0;s.charge=false;}
  /* ralliement par un commandant à 2 cases */
  for(const s of al)if(s.moral===1&&al.some(h=>h.hero&&h.sd===s.sd&&tacD(h.c,s.c)<=2)){s.moral=0;ev.moral.push({s,k:'rallie'});}
  /* 1. pouvoirs */
  for(const s of al)if(s.hero&&s.ord.k==='pouvoir'&&s.cd<=0){const H=TAC_HEROS[s.hero],c=s.ord.c;if(tacD(s.c,c)>H.power.rng+0)continue;
    const hits=tacPowerHits(R,s,c);s.cd=H.power.cd;ev.pw.push({s,c,cells:H.power.aire?[c]:tacLine(R,s.c,c,H.power.ligne)});
    for(const q of hits)if(q.sd!==s.sd){const v=q.hero?q.n0*.22:Math.max(2,q.n*K.power);add(q,v,s,'pouvoir');}
    if(s.hero==='Ace')for(const cc of tacLine(R,s.c,c,H.power.ligne))if(cc.k==='couvert'&&!tacAt(R,cc))cc.feu=2;}
  /* 2. mouvements : les plus rapides d'abord */
  const movers=al.filter(s=>['aller','attaque','repli'].includes(s.ord.k)&&!(s.hero&&s.ord.k==='pouvoir')).sort((a,b)=>tacUnit(b).spd-tacUnit(a).spd||a.id-b.id);
  for(const s of movers){const u=tacUnit(s);let goal=null,stop=false;
    if(s.ord.k==='aller')goal=s.ord.c;
    else if(s.ord.k==='repli'){goal=M.T[s.sd===0?M.W-1:0][s.c.j];}
    else{const tg=R.sq[s.ord.cible];if(!tg||!tacAlive(tg))continue;if(u.rng>1&&tacD(s.c,tg.c)<=u.rng+(s.c.haut?1:0)&&tacVue(M,s.c,tg.c))continue;if(tacD(s.c,tg.c)<=1)continue;goal=tg.c;stop=true;}
    if(!goal||goal===s.c)continue;
    if(s.ord.k!=='repli'&&tacNb(R,s.c,q=>q.sd!==s.sd).length&&!(s.ord.k==='attaque'&&R.sq[s.ord.cible]&&tacD(s.c,R.sq[s.ord.cible].c)<=1))continue;   /* au contact : on ne se dégage qu'en repli */
    let P=tacPath(R,s,goal,(s.moral===1?2:u.spd)+(s.ord.k==='repli'?1:0),stop);
    if(u.rng>1&&s.ord.k==='attaque'){const tg=R.sq[s.ord.cible];const k=P.findIndex(c=>tacD(c,tg.c)<=u.rng+(c.haut?1:0)&&tacVue(M,c,tg.c));if(k>0)P=P.slice(0,k+1);}
    if(P.length<2)continue;
    if(s.ord.k==='repli'){for(const e of tacNb(R,s.c,q=>q.sd!==s.sd))add(s,tacHit(R,e,s)*.5,e,'repli');}
    s.path=P;s.c=P[P.length-1];s.moved=P.length-1;s.face=Math.atan2(s.c.y-P[0].y,s.c.x-P[0].x);s.charge=s.ord.k==='attaque'&&s.moved>=2&&tacUnit(s).rng===1;ev.mv.push(s);
    if(s.ord.k==='aller'&&s.c===s.ord.c)s.ord={k:'tenir'};
    if(s.ord.k==='repli'&&(s.sd===0?s.c.i>=M.W-1:s.c.i<=0)&&s.moral>=2){s.out=true;ev.moral.push({s,k:'fuit'});}}
  /* 3. tirs, puis 4. mêlées */
  for(const s of al){if(!tacAlive(s)||s.ord.k!=='attaque')continue;const u=tacUnit(s),tg=R.sq[s.ord.cible];if(!tg||!tacAlive(tg))continue;
    const d=tacD(s.c,tg.c);if(u.rng>1){if(d<=u.rng+(s.c.haut?1:0)&&d>1&&tacVue(M,s.c,tg.c)){add(tg,tacHit(R,s,tg)*(s.moved?K.moved:1),s,'tir');s.face=Math.atan2(tg.c.y-s.c.y,tg.c.x-s.c.x);}else if(d===1)add(tg,tacHit(R,s,tg)*.6,s,'melee');continue;}
    if(d===1){add(tg,tacHit(R,s,tg)*(s.charge?K.charge:1),s,'melee');s.face=Math.atan2(tg.c.y-s.c.y,tg.c.x-s.c.x);
      const rip=tg.ord.k==='tenir'?1:K.riposte;if(tacUnit(tg).rng===1||tg.hero)add(s,tacHit(R,tg,s)*rip,tg,'riposte');}}
  /* 5. pertes (simultanées), moral */
  for(const [s,v] of dmg){s.n=Math.max(0,s.n-v);if(s.n<.5){s.n=0;ev.dead.push(s);if(s.hero){for(const q of R.sq)if(tacAlive(q)&&q.sd===s.sd&&tacD(q.c,s.c)<=3&&q.moral<1)q.moral=1;}}}
  for(const s of al)if(tacAlive(s)&&!s.hero&&s.n0r>0&&(s.n0r-s.n)/s.n0r>.5){s.moral++;ev.moral.push({s,k:s.moral>=2?'fuit':'ebranle'});if(s.moral>=2)s.ord={k:'repli'};}
  for(const c of M.T.flat())if(c.feu)c.feu--;
  /* objectif et fin */
  /* une armée sans troupes est battue : son commandant se retire */
  const A=R.sq.filter(s=>s.sd===0&&tacAlive(s)&&!s.hero),D=R.sq.filter(s=>s.sd===1&&tacAlive(s)&&!s.hero);
  for(const s of R.sq)if(s.hero&&tacAlive(s)&&!(s.sd===0?A:D).length){s.out=true;}
  const onObj=A.some(s=>s.c===R.obj)&&!R.sq.some(s=>s.sd===1&&tacAlive(s)&&tacD(s.c,R.obj)<=1);R.hold=onObj?R.hold+1:0;
  if(!D.length)R.end={w:0,why:'La défense pirate est éliminée.'};
  else if(!A.length)R.end={w:1,why:'L\'attaque de la Marine est repoussée.'};
  else if(R.hold>=2)R.end={w:0,why:'La Marine tient l\'objectif deux manches de suite.'};
  else if(R.round>=TAC.ROUNDS)R.end={w:1,why:'Dernière manche jouée : la défense tient.'};
  return ev;
}
function tacHit(R,a,b){
  const K=TAC.K,M=R.M,ua=tacUnit(a),ub=tacUnit(b);let atk=a.hero?TAC_HEROS[a.hero].pow:a.n*ua.atk,def=b.hero?TAC_HEROS[b.hero].def:ub.def;
  if(a.moral===1)atk*=K.shaken;if(!a.hero&&!b.hero&&TAC_CONTRE[a.kind]===b.kind)atk*=1.3;
  /* flanc et dos : selon l'orientation de la cible */
  const ang=Math.atan2(a.c.y-b.c.y,a.c.x-b.c.x),dc=Math.cos(ang-b.face);if(dc<-.5)atk*=K.back;else if(dc<.5)atk*=K.flank;
  if(b.ord.k==='tenir')def*=K.hold;
  if(ua.rng>1&&tacD(a.c,b.c)>1){if(b.c.k==='couvert')atk*=K.cover;if(a.c.haut&&!b.c.haut)atk*=K.high;}
  else if(b.c.haut&&!a.c.haut)atk*=K.uphill;
  if(R.sq.some(h=>h.hero==='Garp'&&tacAlive(h)&&h.sd===b.sd&&tacD(h.c,b.c)<=2&&h!==b))def*=K.aura;
  let v=K.dmg*atk/def;if(b.hero&&TAC_HEROS[b.hero].logia&&!(a.hero&&TAC_HEROS[a.hero].haki))v*=K.logia;
  return v*(.9+.2*R.rnd());
}

/* ---------- affichage : figurines, cases, ordres, nombres ---------- */
const TAC_COL={sel:[1,.85,.35],moi:[.29,.56,.88],eux:[.88,.28,.31],obj:[1,.78,.25],grille:[.9,.95,1],cov:[.35,.75,.35],haut:[1,1,.8],feu:[1,.45,.1]};
function tacFig(R,s,now){
  if(s.n<=0&&!(R.anim&&R.anim.n0.get(s)>0))return;const c=R.cam,ts=now/1000,M=R.M,A=R.anim,tau=A?(now-A.t0)/1000:9;
  /* position : le long du chemin de la manche pendant la phase de mouvement (0,8 → 2,4 s) */
  let x=s.c.x,y=s.c.y,z=s.c.z,mv=false;
  if(A&&s.path&&s.path.length>1&&tau<2.4){const u=Math.max(0,Math.min(1,(tau-.8)/1.6))*(s.path.length-1),k=Math.min(s.path.length-2,Math.floor(u)),f=u-k,a=s.path[k],b=s.path[k+1];x=a.x+(b.x-a.x)*f;y=a.y+(b.y-a.y)*f;z=a.z+(b.z-a.z)*f;mv=tau>.8&&tau<2.4;}
  s.x=x;s.y=y;s.z=z;
  let an='garde';if(mv)an='deplacement';else if(A&&tau>=2.4&&tau<3.6){if(A.atk.has(s))an='attaque';else if(A.hit.has(s))an='reaction';}else if(A&&tau<.8&&A.pw.has(s))an='attaque';else if(s.moral>=1&&!A)an='reaction';
  const col=s.sd===R.side?'#4a8fe0':'#e0484f',fl=Math.cos(s.face)*c.r[0]+Math.sin(s.face)*c.r[1]<0;
  const al=s.n<=0?Math.max(0,1-(tau-3.2)/.8):1;if(al<=0)return;
  if(s.hero){trpPush({asset:s.asset,x,y,z,anim:an,t:A?tau:ts,flip:fl,al,own:col,hs:TAC.hsCmd,cmd:true});return;}
  /* figurines : une pour 3 soldats, 4 au plus, en carré dans la case ; celles des soldats perdus s'effacent à la fin de la manche */
  const nBefore=A&&A.n0.has(s)?A.n0.get(s):s.n,nShow=tau<3.2?nBefore:s.n,nf=Math.max(1,Math.min(4,Math.ceil(nShow/3)));
  const off=[[-.3,-.22],[.3,.22],[.3,-.26],[-.3,.26]];
  for(let k=0;k<nf;k++){const o=off[k],X=x+M.U[0]*o[0]+M.V[0]*o[1],Y=y+M.U[1]*o[0]+M.V[1]*o[1],Z=Math.max(0,M.G.Hs(X-M.t.x,Y-M.t.y));
    trpPush({asset:s.asset,x:X,y:Y,z:Z,anim:an,t:(A?tau:ts)+k*.37+s.id*.13,flip:fl,al,own:k===0?col:undefined,hs:TAC.hs});}
}
function tacTiles(R){
  const M=R.M,L=[],h=TAC.S*.48,u=M.U,C=TAC_COL,tile=(c,st,col,a,sz)=>L.push([c.x,c.y,c.z,(sz||1)*h,u[0],u[1],st,col[0],col[1],col[2],a]);
  for(const row of M.T)for(const c of row){if(c.feu){tile(c,0,C.feu,.45);continue;}if(!tacPass(c))continue;
    if(c.k==='couvert')tile(c,0,C.cov,.16);else tile(c,2,C.grille,.10);if(c.haut)tile(c,2,C.haut,.30,.82);}
  tile(R.obj,0,C.obj,.42);
  if(R.phase==='deploiement'||R.round===1&&R.phase==='ordres'&&!R.anim)for(const row of M.T)for(const c of row)if(tacPass(c)&&c.i>=M.W-4)tile(c,2,C.moi,.22,.9);
  const s=R.sel!==null?R.sq[R.sel]:null;
  if(s&&tacAlive(s)&&R.phase==='ordres'&&!R.anim){
    /* portée de déplacement et cibles à portée de l'escouade choisie */
    const u=tacUnit(s);for(const row of M.T)for(const c of row){if(!tacPass(c)||tacAt(R,c))continue;const d=tacD(s.c,c);if(d<=u.spd&&d>0)tile(c,0,C.moi,.13,.92);}
    for(const f of R.sq)if(tacAlive(f)&&f.sd!==s.sd){const d=tacD(s.c,f.c),ok=u.rng>1?d<=u.rng+(s.c.haut?1:0)&&tacVue(M,s.c,f.c):d<=1;if(ok)tile(f.c,2,C.eux,.75);}
    tile(s.c,2,C.sel,.95,1.02);
    if(s.hero&&R.mode==='pouvoir'){const H=TAC_HEROS[s.hero];for(const row of M.T)for(const c of row)if(tacD(s.c,c)<=H.power.rng&&c.k!=='bloque'&&c.k!=='eau')tile(c,1,C.obj,.35,.5);}}
  /* ordres donnés (joueur) : chemin prévu en points, cible en contour rouge */
  if(R.phase==='ordres'&&!R.anim)for(const q of R.sq){if(!tacAlive(q)||q.sd!==R.side)continue;const o=q.ord;
    if(o.k==='aller'){const P=tacPath(R,q,o.c,tacUnit(q).spd,false);for(const c of P.slice(1))tile(c,1,C.moi,.9,.35);}
    else if(o.k==='attaque'&&R.sq[o.cible]){const tg=R.sq[o.cible];for(const c of tacLine(R,q.c,tg.c,tacD(q.c,tg.c)).slice(0,-1))tile(c,1,C.eux,.8,.28);tile(tg.c,2,C.eux,.9,.95);}
    else if(o.k==='pouvoir'){tile(o.c,0,C.obj,.5);}
    else if(o.k==='repli'){tile(q.c,1,C.haut,.9,.4);}}
  /* effets de la manche : pouvoirs (0 → 0,8 s puis brûlure), cases touchées */
  if(R.anim){const tau=(performance.now()-R.anim.t0)/1000;
    for(const p of R.anim.ev.pw){if(tau>2.4)continue;const cells=p.s.hero==='Ace'?p.cells:(()=>{const out=[];for(let a=0;a<2;a++)for(let b=0;b<2;b++){const c=M.T[p.c.i+a]&&M.T[p.c.i+a][p.c.j+b];if(c)out.push(c);}return out;})();
      for(const c of cells)tile(c,0,p.s.hero==='Ace'?C.feu:[.75,.62,.45],.65*Math.max(0,1-Math.abs(tau-.7)/1.2));}}
  TRP.tiles=L;
}
/* nombres et étiquettes à l'écran (pertes, moral) */
function tacLabels(R,now){
  const box=document.getElementById('tac-lab');if(!box)return;const cv=W3.cv,rc=cv.getBoundingClientRect(),k=rc.width/cv.width;
  let h='';const A=R.anim,tau=A?(now-A.t0)/1000:0;
  if(A&&tau>2.4&&tau<4.4){for(const [s,v] of A.loss){if(v<.5)continue;const p=w3Proj(s.x,s.y,s.z+1.3*TAC.hs*.54,R.cam);if(!p)continue;
      h+='<div class="tac-num" style="left:'+(rc.left+p.sx*k)+'px;top:'+(rc.top+p.sy*k-(tau-2.4)*18)+'px">−'+Math.round(v)+'</div>';}}
  for(const s of R.sq){if(!tacAlive(s))continue;const p=w3Proj(s.x,s.y,s.z+(s.hero?TAC.hsCmd:TAC.hs)*.62,R.cam);if(!p)continue;
    const tag=(s.moral===1?'⚠ ':'')+(s.hero?s.hero+(s.cd>0?' · '+s.cd:' · prêt'):Math.round(s.n));
    h+='<div class="tac-tag'+(s.sd===R.side?' moi':' eux')+(R.sel===s.id?' sel':'')+'" style="left:'+(rc.left+p.sx*k)+'px;top:'+(rc.top+p.sy*k)+'px">'+esc(tag)+'</div>';}
  box.innerHTML=h;
}

/* ---------- caméra tactique : la zone entière au départ ; ZQSD / flèches, Q/E (A/E) pour tourner, molette pour zoomer ---------- */
function tacCam(R){const C=R.camP;return trpCamBuild({cx:C.cx,cy:C.cy,yaw:C.yaw,pitch:C.pitch,D:C.D,near:Math.max(.15,C.D*.04),fogD:Math.max(C.D*1.8,45)});}
{const wc0=w3Cam;w3Cam=function(cx,cy,yaw,pitch,D0){if(cx===undefined&&TAC.run&&TAC.run.camP)return TAC.run.cam=tacCam(TAC.run);return wc0(cx,cy,yaw,pitch,D0);};}
{const ps0=pxScene;pxScene=function(c,now,combat){return ps0(c,now,combat||!!TAC.run);};}
{const ov0=w3Overlay;w3Overlay=function(c,now){if(TAC.run)return;return ov0(c,now);};}
{const pf0=pxFlush;pxFlush=function(c,now,opt){const R=TAC.run;if(R&&R.cam){try{for(const s of R.sq)tacFig(R,s,now);tacTiles(R);tacLabels(R,now);tacTick(R,now);}catch(e){console.warn('combat tactique :',e);}}return pf0(c,now,opt);};}

/* ---------- déroulement ---------- */
function tacTick(R,now){
  if(!R.anim)return;const tau=(now-R.anim.t0)/1000;
  if(tau>=4.4){R.anim=null;for(const s of R.sq)s.path=[s.c];
    if(R.end){tacFin(R);return;}R.round++;R.phase='ordres';for(const s of R.sq)if(s.sd===R.side&&tacAlive(s)&&(s.ord.k==='pouvoir'||(s.ord.k==='attaque'&&!tacAlive(R.sq[s.ord.cible]))))s.ord={k:'tenir'};tacFollow(R);tacUI(R);}
}
function tacLancer(R){
  if(!R||R.anim||R.end||R.phase!=='ordres')return;
  tacAI(R,1-R.side);   /* l'adversaire décide en même temps (sans voir vos ordres de cette manche) */
  const n0=new Map(R.sq.map(s=>[s,s.n]));const ev=tacResolve(R);
  const loss=new Map();for(const s of R.sq){const v=(n0.get(s)||0)-s.n;if(v>0)loss.set(s,v);}
  const atk=new Set(ev.hit.filter(h=>h.ty!=='riposte'||true).map(h=>h.src)),hit=new Set(ev.hit.map(h=>h.s)),pw=new Set(ev.pw.map(p=>p.s));
  R.anim={t0:performance.now(),ev,n0,loss,atk,hit,pw};R.phase='execution';R.mode=null;
  /* journal court : pertes par camp, pouvoirs, escouades détruites ou en fuite, commandant blessé */
  const camp=sd=>sd===0?'Marine':'Pirates',per=[0,0],L=[];for(const [s,v] of loss)if(!s.hero)per[s.sd]+=v;
  for(const p of ev.pw)L.push(p.s.hero+' : '+TAC_HEROS[p.s.hero].power.n);
  if(per[0]>=.5||per[1]>=.5)L.push('pertes : Marine −'+Math.round(per[0])+', Pirates −'+Math.round(per[1]));
  for(const s of R.sq)if(n0.get(s)>0&&s.n<=0)L.push(s.hero?s.hero+' blessé, se retire':TAC_UNITS[s.kind].n+' ('+camp(s.sd)+') détruits');
  for(const m of ev.moral)if(tacAlive(m.s)&&m.k!=='rallie')L.push(TAC_UNITS[m.s.kind].n+' ('+camp(m.s.sd)+') '+(m.k==='fuit'?'en fuite':'ébranlés'));
  R.log.unshift('Manche '+R.round+' — '+(L.join(' · ')||'mouvements'));R.log=R.log.slice(0,4);tacFollow(R);tacUI(R);
}
/* la caméra suit l'action : centre et recul sur les escouades encore en jeu (le joueur peut ensuite déplacer la vue) */
function tacFollow(R){const al=R.sq.filter(tacAlive);if(!al.length||!R.camP)return;const M=R.M,C=R.camP;
  let i0=1e9,i1=-1e9,j0=1e9,j1=-1e9;for(const s of al){i0=Math.min(i0,s.c.i);i1=Math.max(i1,s.c.i);j0=Math.min(j0,s.c.j);j1=Math.max(j1,s.c.j);}
  const ci=(i0+i1)/2,cj=(j0+j1)/2,x=M.t.x+M.cx+M.U[0]*(ci-(M.W-1)/2)*TAC.S+M.V[0]*(cj-(M.H-1)/2)*TAC.S,y=M.t.y+M.cy+M.U[1]*(ci-(M.W-1)/2)*TAC.S+M.V[1]*(cj-(M.H-1)/2)*TAC.S;
  const cc=w3Cam(x,y,C.yaw,C.pitch,10),span=(Math.max(i1-i0,(j1-j0)*.8)+3)*TAC.S;C.tx=x;C.ty=y;C.tD=Math.max(9,Math.min(44,span/.62/(2*cc.tx)));}
function tacAuto(R){   /* résolution automatique de la suite : les deux camps commandés par l'IA, sans animation */
  if(!R||R.anim||R.end)return;let g=0;while(!R.end&&g++<20){tacAI(R,0);tacAI(R,1);tacResolve(R);if(!R.end)R.round++;}for(const s of R.sq)s.path=[s.c];tacFin(R);}
function tacFin(R){R.phase='fin';tacUI(R);}

/* ---------- interface ---------- */
function tacUI(R){
  let el=document.getElementById('tac-ui');if(!R){if(el)el.remove();const lb=document.getElementById('tac-lab');if(lb)lb.remove();return;}
  if(!el){el=document.createElement('div');el.id='tac-ui';document.body.appendChild(el);el.addEventListener('click',tacClick);
    const lb=document.createElement('div');lb.id='tac-lab';document.body.appendChild(lb);}
  const rc=W3.cv.getBoundingClientRect();el.style.cssText='left:'+rc.left+'px;top:'+rc.top+'px;width:'+rc.width+'px;height:'+rc.height+'px';
  const me=R.side,my=R.sq.filter(s=>s.sd===me),sel=R.sel!==null?R.sq[R.sel]:null,tot=sd=>R.sq.filter(s=>s.sd===sd&&tacAlive(s)&&!s.hero).reduce((a,s)=>a+s.n,0);
  const fa=tot(0),fb=tot(1),pc=Math.round(100*fa/Math.max(1,fa+fb));
  const nomCamp=sd=>sd===0?'Marine (Garp)':'Pirates (Ace)';
  let h='<div class="tac-top"><b>Alabasta · combat tactique (démo)</b><span>manche '+Math.min(R.round,TAC.ROUNDS)+' / '+TAC.ROUNDS+' · '+(R.phase==='ordres'?'ordres':R.phase==='execution'?'la manche se joue…':'terminé')+'</span>'
    +'<span class="tac-sp"></span>'+(R.phase!=='fin'?'<button data-tac="auto">Résolution auto</button><button data-tac="lancer" class="pri"'+(R.phase!=='ordres'?' disabled':'')+'>Lancer la manche · Espace</button>':'')+'<button data-tac="quitter">Quitter</button></div>';
  h+='<div class="tac-left"><div class="tac-h">Vos escouades · '+nomCamp(me)+'</div>';
  for(const s of my){const o=s.ord,od=!tacAlive(s)?(s.out?'en fuite':'hors de combat'):o.k==='aller'?'se déplace':o.k==='attaque'?'attaque '+(R.sq[o.cible]?tacName(R.sq[o.cible]):''):o.k==='repli'?'repli':o.k==='pouvoir'?'pouvoir':'tient';
    h+='<button data-tac="sel:'+s.id+'" class="tac-sq'+(R.sel===s.id?' on':'')+(tacAlive(s)?'':' off')+'"><b>'+esc(tacName(s))+'</b>'+(s.moral===1?' ⚠':'')+'<small>'+esc(od)+'</small></button>';}
  h+='<div class="tac-help">Clic : choisir une escouade · clic sur le sol : y aller · clic sur un ennemi : l\'attaquer · clic droit : annuler · ZQSD ou flèches : déplacer la vue · A / E : tourner · molette : zoom</div></div>';
  h+='<div class="tac-right"><div class="tac-h">Rapport de forces</div><div class="tac-bar"><i style="width:'+(me===0?pc:100-pc)+'%"></i></div><small>'+Math.round(me===0?fa:fb)+' contre '+Math.round(me===0?fb:fa)+' soldats</small>'
    +'<div class="tac-h">Objectif</div><small>'+(R.side===0?'Tenir la case dorée 2 manches (aucun pirate au contact) ou éliminer la défense.':'Tenir jusqu\'à la manche '+TAC.ROUNDS+' : la Marine ne doit pas garder la case dorée 2 manches.')+(R.hold?' Tenue : '+R.hold+' / 2.':'')+'</small>';
  h+='<div class="tac-h">Journal</div>'+R.log.slice(0,4).map(l=>'<small class="tac-log">'+esc(l)+'</small>').join('')+'</div>';
  if(R.phase==='ordres'&&sel&&tacAlive(sel)&&sel.sd===me){const u=tacUnit(sel);
    const info=sel.hero?TAC_HEROS[sel.hero].power.n+' : '+TAC_HEROS[sel.hero].power.d+' '+(sel.cd>0?'Recharge : '+sel.cd+' manche(s).':'Prêt.')+' '+TAC_HEROS[sel.hero].aura
      :TAC_UNITS[sel.kind].n+' : '+Math.round(sel.n)+' soldats · attaque '+u.atk+' · défense '+u.def+' · portée '+u.rng+' · déplacement '+u.spd+(sel.c.k==='couvert'?' · dans un couvert (tirs reçus −30 %)':'')+(sel.c.haut?' · en hauteur (portée +1)':'');
    h+='<div class="tac-bot"><div class="tac-info">'+esc(info)+'</div><div class="tac-btns"><button data-tac="o:tenir"'+(sel.ord.k==='tenir'?' class="on"':'')+'>Tenir · T</button><button data-tac="o:repli"'+(sel.ord.k==='repli'?' class="on"':'')+'>Repli · R</button>'
      +(sel.hero?'<button data-tac="o:pouvoir"'+(sel.cd>0?' disabled':'')+(R.mode==='pouvoir'?' class="on"':'')+'>'+esc(TAC_HEROS[sel.hero].power.n)+' · 1</button>':'')
      +'<span>Déplacer : clic sur une case · Attaquer : clic sur un ennemi'+(R.mode==='pouvoir'?' · Pouvoir : clic sur la case visée':'')+'</span></div></div>';}
  if(R.phase==='fin'&&R.end){const w=R.end.w===me;const surv=sd=>R.sq.filter(s=>s.sd===sd&&!s.hero&&s.n>0).reduce((a,s)=>a+s.n,0),n0=sd=>R.sq.filter(s=>s.sd===sd&&!s.hero).reduce((a,s)=>a+s.n0,0);
    h+='<div class="tac-end"><h2>'+(w?'Victoire':'Défaite')+'</h2><p>'+esc(R.end.why)+'</p><p>Marine : '+Math.round(surv(0))+' / '+n0(0)+' soldats · Pirates : '+Math.round(surv(1))+' / '+n0(1)+' soldats</p>'
      +'<p class="tac-note">Démonstration : la partie n\'est pas modifiée.</p><button data-tac="rejouer" class="pri">Rejouer</button><button data-tac="camp">Jouer l\'autre camp</button><button data-tac="quitter">Revenir à la carte</button></div>';}
  el.innerHTML=h;
}
function tacClick(e){const b=e.target.closest('button[data-tac]');if(!b)return;e.stopPropagation();const R=TAC.run,a=b.dataset.tac;
  if(a==='quitter')return tacStop();if(a==='rejouer')return tacStart({side:R.side});if(a==='camp')return tacStart({side:1-R.side});
  if(a==='lancer')return tacLancer(R);if(a==='auto')return tacAuto(R);
  if(a.startsWith('sel:')){R.sel=+a.slice(4);R.mode=null;tacFocus(R,R.sq[R.sel]);tacUI(R);return;}
  if(a.startsWith('o:'))tacOrdre(R,a.slice(2));}
function tacOrdre(R,k){const s=R.sel!==null?R.sq[R.sel]:null;if(!s||!tacAlive(s)||s.sd!==R.side||R.phase!=='ordres')return;
  if(k==='pouvoir'){if(!s.hero||s.cd>0)return;R.mode=R.mode==='pouvoir'?null:'pouvoir';}else{s.ord={k};R.mode=null;}tacUI(R);}
function tacFocus(R,s){if(!s)return;const C=R.camP;C.tx=s.c.x;C.ty=s.c.y;}
/* clic dans la scène : la case ou l'escouade la plus proche à l'écran */
function tacPick(R,e){
  const cv=W3.cv,rc=cv.getBoundingClientRect(),mx=(e.clientX-rc.left)*cv.width/rc.width,my=(e.clientY-rc.top)*cv.height/rc.height;
  let bs=null,bd=1e9;for(const s of R.sq){if(!tacAlive(s))continue;const p=w3Proj(s.x,s.y,s.z+.5*(s.hero?TAC.hsCmd:TAC.hs)*.54,R.cam);if(!p)continue;const d=Math.hypot(p.sx-mx,p.sy-my),lim=Math.max(18,.6*TAC.hs*.54*p.k);if(d<lim&&d<bd){bd=d;bs=s;}}
  let bc=null,bcd=1e9;for(const row of R.M.T)for(const c of row){const p=w3Proj(c.x,c.y,c.z,R.cam);if(!p)continue;const d=Math.hypot(p.sx-mx,p.sy-my);if(d<bcd){bcd=d;bc=c;}}
  const p0=bc&&w3Proj(bc.x,bc.y,bc.z,R.cam);if(bc&&p0&&bcd>TAC.S*p0.k*.9)bc=null;
  return {s:bs,c:bc};
}
function tacDown(e){const R=TAC.run;if(!R||e.target!==canvas)return;e.stopImmediatePropagation();e.preventDefault();
  if(R.phase!=='ordres'||R.anim)return;const P=tacPick(R,e),sel=R.sel!==null?R.sq[R.sel]:null;
  if(e.button===2){if(sel&&sel.sd===R.side){sel.ord={k:'tenir'};R.mode=null;}tacUI(R);return;}
  if(R.mode==='pouvoir'&&sel&&sel.hero){const c=P.s?P.s.c:P.c;if(c&&tacD(sel.c,c)<=TAC_HEROS[sel.hero].power.rng){sel.ord={k:'pouvoir',c};R.mode=null;}tacUI(R);return;}
  if(P.s&&P.s.sd===R.side){R.sel=P.s.id;R.mode=null;tacUI(R);return;}
  if(!sel||sel.sd!==R.side||!tacAlive(sel))return;
  if(P.s&&P.s.sd!==R.side){sel.ord={k:'attaque',cible:P.s.id};tacUI(R);return;}
  if(P.c&&tacPass(P.c)&&P.c!==sel.c){sel.ord={k:'aller',c:P.c};tacUI(R);}
}
function tacKey(e){const R=TAC.run;if(!R)return;if(e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;const k=e.key,C=R.camP,step=C.D*.06;
  const hx=Math.sin(C.yaw),hy=-Math.cos(C.yaw),rx=Math.cos(C.yaw),ry=Math.sin(C.yaw);let used=true;
  if(k===' '||k==='Enter'){if(R.phase==='fin')tacStop();else tacLancer(R);}
  else if(k==='Escape'){if(R.mode){R.mode=null;tacUI(R);}else if(R.phase==='fin')tacStop();else{R.sel=null;tacUI(R);}}
  else if(k==='ArrowUp'||k==='z'||k==='Z'||k==='w'||k==='W'){C.tx+=hx*step;C.ty+=hy*step;}
  else if(k==='ArrowDown'||k==='s'||k==='S'){C.tx-=hx*step;C.ty-=hy*step;}
  else if(k==='ArrowLeft'||k==='q'||k==='Q'){C.tx-=rx*step;C.ty-=ry*step;}
  else if(k==='ArrowRight'||k==='d'||k==='D'){C.tx+=rx*step;C.ty+=ry*step;}
  else if(k==='a'||k==='A')C.tyaw-=.12;else if(k==='e'||k==='E')C.tyaw+=.12;
  else if(k==='t'||k==='T')tacOrdre(R,'tenir');else if(k==='r'||k==='R')tacOrdre(R,'repli');else if(k==='1')tacOrdre(R,'pouvoir');
  else used=false;
  if(used){e.preventDefault();e.stopImmediatePropagation();}}
function tacWheel(e){const R=TAC.run;if(!R||e.target!==canvas)return;e.preventDefault();e.stopImmediatePropagation();const C=R.camP;C.tD=Math.max(7,Math.min(44,C.tD*(e.deltaY>0?1.12:1/1.12)));}
addEventListener('pointerdown',tacDown,true);addEventListener('keydown',tacKey,true);addEventListener('wheel',tacWheel,{capture:true,passive:false});
addEventListener('contextmenu',e=>{if(TAC.run&&e.target===canvas)e.preventDefault();},true);
addEventListener('resize',()=>{if(TAC.run)tacUI(TAC.run);});
/* caméra : glissement doux vers la cible */
(function tacLoop(){const R=TAC.run;if(R&&R.camP){const C=R.camP,k=.15;C.cx+=(C.tx-C.cx)*k;C.cy+=(C.ty-C.cy)*k;C.yaw+=(C.tyaw-C.yaw)*k;C.D+=(C.tD-C.D)*k;dirty=true;}requestAnimationFrame(tacLoop);})();

/* ---------- entrée et sortie ---------- */
function tacStart(opt){
  opt=opt||{};if(typeof W3==='undefined'||W3.fail){toast('Monde 3D indisponible : le combat tactique ne peut pas être montré.');return;}
  if(!W3.on)w3Toggle();if(B3.run)b3End();
  const t=terrs.find(q=>q.name==='Alabasta');if(!t){toast('Alabasta introuvable.');return;}
  const was=TAC.run;if(was){TAC.run=null;}
  if(!TAC.prev)TAC.prev={speed,gfx:GFX.on,k:V.k,x:V.x,y:V.y,yaw:W3.cam.yaw,pitch:W3.cam.pitch};
  speed=0;if(!GFX.on)GFX.set(true);
  try{V.k=Math.max(V.k||1,14);centerOn(t.id);}catch(_){}
  const t0=performance.now();let said=false;
  const go=()=>{const m=W3.models.get(t.id),I=m&&m.bx&&typeof BLX!=='undefined'?BLX.isl[m.bx]:null,G=I&&I.ready3?trpGrid(t):null;
    if(!G){if(performance.now()-t0<20000){if(!said){toast('Chargement d\'Alabasta…');said=true;}setTimeout(go,250);return;}toast('Alabasta n\'est pas chargée : combat tactique impossible pour l\'instant.');tacStop();return;}
    const R=tacNew({side:opt.side||0,seed:opt.seed});if(!R){toast('Zone de combat introuvable.');tacStop();return;}
    const M=R.M,yaw=Math.atan2(-M.U[1],-M.U[0])+(R.side===1?Math.PI:0);
    /* recul : la largeur de la zone (et une marge) dans la partie centrale de l'écran, entre les deux panneaux */
    const cx0=M.t.x+M.cx,cy0=M.t.y+M.cy,cc=w3Cam(cx0,cy0,yaw,.8,10),D0=Math.max(10,Math.min(40,(M.W*TAC.S+1)/.86/(2*cc.tx)));
    R.camP={cx:cx0,cy:cy0,tx:cx0,ty:cy0,yaw,tyaw:yaw,pitch:.8,D:D0,tD:D0};
    TAC.run=R;tacFollow(R);R.camP.cx=R.camP.tx;R.camP.cy=R.camP.ty;R.camP.D=R.camP.tD;R.cam=tacCam(R);R.sel=R.sq.findIndex(s=>s.sd===R.side&&s.hero);tacAI(R,1-R.side);
    R.log=['Manche 1 : donnez un ordre à vos escouades, puis « Lancer la manche ».'];
    document.body.classList.add('tacrun');tacUI(R);dirty=true;};
  go();
}
function tacStop(){
  TAC.run=null;tacUI(null);TRP.tiles=[];document.body.classList.remove('tacrun');
  const P=TAC.prev;TAC.prev=null;if(P){speed=P.speed;V.k=P.k;V.x=P.x;V.y=P.y;W3.cam.yaw=P.yaw;W3.cam.pitch=P.pitch;if(!P.gfx)GFX.set(false);}dirty=true;
}
TAC.start=tacStart;TAC.stop=tacStop;
TAC.sim=function(n,comp,K){const K0=Object.assign({},TAC.K);if(K)Object.assign(TAC.K,K);const o={n,w0:0,w1:0,manches:0,s0:0,s1:0,pourquoi:{}};for(let k=0;k<n;k++){const R=tacNew({seed:1000+k,comp});if(!R)return null;let g=0;while(!R.end&&g++<20){tacAI(R,0);tacAI(R,1);tacResolve(R);if(!R.end)R.round++;}
  o['w'+R.end.w]++;o.manches+=R.round;o.pourquoi[R.end.why]=(o.pourquoi[R.end.why]||0)+1;for(const s of R.sq)if(!s.hero)o['s'+s.sd]+=s.n/Math.max(1,R.sq.filter(q=>q.sd===s.sd&&!q.hero).reduce((a,q)=>a+q.n0,0));}
  TAC.K=K0;o.manches=+(o.manches/n).toFixed(1);o.s0=+(o.s0/n).toFixed(2);o.s1=+(o.s1/n).toFixed(2);return o;};
/* bouton d'entrée, à côté des boutons du prototype graphique */
{const st=document.createElement('style');st.textContent=
  '#tac-go{position:fixed;right:14px;bottom:90px;z-index:9999;font:600 12px system-ui,sans-serif;padding:7px 11px;border-radius:9px;border:1px solid #f2c75c;background:#2b2210e6;color:#f8d77a;cursor:pointer}'
  +'body.tacrun #tac-go,body.tacrun #gfx-demo,body.tacrun #cs-hud,body.tacrun #minibox,body.tacrun #selcard,body.tacrun #z-dock,body.tacrun #b-end{display:none!important}body.tacrun #map{opacity:0}'
  +'#tac-ui{position:fixed;z-index:9000;pointer-events:none;font:13px system-ui,sans-serif;color:#e8eef3}'
  +'#tac-ui button{pointer-events:auto;font:600 12px system-ui,sans-serif;border-radius:8px;border:1px solid #5d7387;background:#16222ce8;color:#e8eef3;padding:6px 10px;cursor:pointer}'
  +'#tac-ui button.pri{border-color:#f2c75c;color:#f8d77a}#tac-ui button.on{border-color:#f2c75c;background:#3a3016e8}#tac-ui button:disabled{opacity:.45;cursor:default}'
  +'.tac-top{position:absolute;left:8px;right:8px;top:8px;display:flex;gap:10px;align-items:center;background:#0f1922d9;border:1px solid #33475a;border-radius:10px;padding:6px 10px;pointer-events:auto}'
  +'.tac-top span{color:#b9c9d6}.tac-sp{flex:1}'
  +'.tac-left,.tac-right{position:absolute;top:60px;width:168px;max-height:calc(100% - 80px);overflow:auto;background:#0f1922d9;border:1px solid #33475a;border-radius:10px;padding:8px;pointer-events:auto;display:flex;flex-direction:column;gap:5px}'
  +'.tac-left{left:8px}.tac-right{right:8px}.tac-h{font-weight:700;color:#f2c75c;margin-top:4px}'
  +'.tac-sq{display:flex;flex-direction:column;align-items:flex-start;text-align:left}.tac-sq small{font-weight:400;color:#b9c9d6}.tac-sq.off{opacity:.45}'
  +'.tac-help{font-size:11px;color:#9fb2c2;margin-top:6px;line-height:1.35}.tac-right small{color:#c9d6e0;line-height:1.35}.tac-log{display:block;font-size:11px}'
  +'.tac-bar{height:8px;border-radius:4px;background:#e0484f88;overflow:hidden}.tac-bar i{display:block;height:100%;background:#4a8fe0}'
  +'.tac-bot{position:absolute;left:188px;right:188px;bottom:10px;display:flex;flex-direction:column;gap:6px;background:#0f1922d9;border:1px solid #33475a;border-radius:10px;padding:6px 10px;pointer-events:auto}.tac-info{font-size:11.5px;color:#d5e1ea;line-height:1.35}.tac-btns{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.tac-btns span{font-size:11px;color:#9fb2c2}'
  +'.tac-end{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:#0f1922f2;border:1px solid #f2c75c;border-radius:14px;padding:18px 22px;pointer-events:auto;text-align:center;max-width:420px}'
  +'.tac-end h2{margin:0 0 6px;color:#f8d77a}.tac-end p{margin:6px 0}.tac-end .tac-note{font-size:11px;color:#9fb2c2}.tac-end button{margin:4px}'
  +'#tac-lab{position:fixed;left:0;top:0;z-index:8990;pointer-events:none}'
  +'.tac-tag{position:fixed;transform:translate(-50%,-100%);font:700 11px system-ui,sans-serif;padding:1px 6px;border-radius:7px;background:#0f1922c9;color:#fff;white-space:nowrap}'
  +'.tac-tag.moi{border:1px solid #4a8fe0}.tac-tag.eux{border:1px solid #e0484f}.tac-tag.sel{border-color:#f2c75c;color:#f8d77a}'
  +'.tac-num{position:fixed;transform:translate(-50%,-100%);font:800 16px system-ui,sans-serif;color:#ffdf6b;text-shadow:0 1px 2px #000,0 0 4px #000}';
  document.head.appendChild(st);
  const b=document.createElement('button');b.id='tac-go';b.type='button';b.textContent='Combat tactique (démo)';b.title='Bataille tactique sur Alabasta : Marine de Garp contre Pirates d\'Ace (la partie n\'est pas modifiée)';
  b.addEventListener('click',e=>{e.stopPropagation();tacStart({side:0});});document.body.appendChild(b);}
window.__TAC=TAC;   /* essais */
