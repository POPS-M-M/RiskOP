/* ================= COMBAT TACTIQUE EN TEMPS RÉEL AVEC PAUSE — PROTOTYPE (version test, branche essai/tactique-rt) =================
   Conception : doc « RISK OP Adventure — Combat tactique en temps réel avec pause : conception » (23/11/2026), étapes 1 à 8 de la section 14 :
   noyau de simulation, déplacement, combat et moral, ordres et pause, commandants, branchement sur la carte, IA de bataille, équilibrage.
   Branchement (étape 6) : quand une armée arrive sur une île tenue par un autre camp et qu'un humain est en jeu, le jeu propose de commander
   la bataille ou de garder la résolution automatique (calcul d'origine, inchangé). Le résultat d'une bataille commandée est écrit par la
   même chaîne que le calcul d'origine (resolveArrival et ses enveloppes : Course, champions, rapports, débarquement) ; seuls le vainqueur
   et les survivants viennent de la bataille. Règle de retraite retenue : celle du jeu (le camp battu perd ses troupes engagées).
   Calibrage (RT.compare, 200 batailles tirées au hasard) : bonus d'assaut ×1,9 et part des survivants du vainqueur 40 %, pour que la bataille
   commandée donne en moyenne le même vainqueur et pas plus de survivants que le calcul automatique (pas de troupes gagnées en commandant).
   Le bouton « Combat temps réel (essai) » garde la démonstration sur Alabasta, sans effet sur la partie.
   Simulation : pas fixe de 0,05 s sur une horloge propre à la bataille (RT.run.t), graine propre, déterministe. La pause n'appelle plus
   le pas de simulation : positions, dégâts, moral, recharges et animations sont figés ; seul le rendu continue (caméra, fiches, ordres).
   Toutes les valeurs tactiques sont des choix du prototype [P] ; attaque, défense et vitesse relatives viennent des types du jeu [V]. */
const RT={run:null,DT:.05,W:20,H:14,S:1.2,TMAX:240,HOLD:60,OBJR:3,hs:1.75,hsCmd:2.05,spd:1,autoPause:false,skillAuto:false,camAuto:true,aide:false,
  K:{dmg:.02,rng:1.4,boulet:.15,hiken:.45,zoneCmd:1,eclair:.3,lave:.4,morPerte:.7,voisin:5,assaut:1.9,survie:.4,pistol:3,charge:1.3,canon:.6,flank:1.3,back:1.6,colFlank:1.25,hold:1.2,desorg:.7,ebranle:.8,cover:.65,sabTir:.85,disp:.6,dispMel:.8,carre:.8,
     high:1.15,highRng:1.25,uphill:.8,downhill:1.1,rngMelee:.6,logia:.5,isole:1.3,front:3,contact:1.05,feu:.25},
  comp:[[['guerrier',10],['lancier',9],['guerrier',10],['lancier',9]],[['archer',9],['guerrier',15],['archer',9],['guerrier',13]]]};
/* types : attaque / défense du jeu [V] ; portée, vitesse au sol, moral de base, cadence [P]. Moral de base relevé de 15 points par rapport
   au document : avec 60 et 50, Recrues et Tireurs commençaient déjà « ébranlés » (seuil 60). */
const RT_U={
  guerrier:{n:'Recrues',ic:'⚔',atk:1,def:1,rng:0,spd:2.0,mor:75,cd:1.1},
  lancier:{n:'Sabreurs',ic:'⛨',atk:.7,def:1.5,rng:0,spd:1.8,mor:85,cd:1.1,tir:.85},
  archer:{n:'Tireurs',ic:'➶',atk:1.5,def:.6,rng:6,spd:2.0,mor:70,cd:1.8},
  cavalier:{n:'Unités d\'assaut',ic:'➹',atk:2,def:.8,rng:0,spd:3.2,mor:75,cd:1.1,charge:true},
  catapulte:{n:'Canons',ic:'✹',atk:3.2,def:.3,rng:10,spd:1.0,mor:55,cd:3,zone:true,fixe:true},
  elite:{n:'Unités d\'élite',ic:'✦',atk:2.3,def:2.3,rng:0,spd:2.2,mor:100,cd:1.1,hdr:true}};
/* sans planche pour leur camp, ces types empruntent la figurine des recrues du camp (valeurs et nom restent les leurs) */
const RT_H={
  Garp:{asset:'cmd_garp',hp:9,atk:5,def:2.5,spd:2.4,cd:1,haki:true,aura:2,camp:'Marine',
    q:{k:'boulets',n:'Lancer de boulets',cd:20,rng:10,r:2,d:'3 boulets sur 2 u de rayon, à 10 u au plus.'},
    pas:'Héros de la Marine : ses groupes à 6 u reprennent 2 de moral par seconde (jusqu\'à leur base).'},
  Ace:{asset:'cmd_ace',hp:8,atk:4.5,def:2.2,spd:2.4,cd:1,logia:true,aura:1,camp:'Pirates',
    q:{k:'hiken',n:'Hiken',cd:18,rng:8,w:1.4,d:'Jet de feu en ligne de 8 u ; le couvert touché brûle 10 s.'},
    pas:'Logia (Mera Mera no Mi) : coups ordinaires ÷ 2, sauf Haki de l\'Armement. Ses groupes à 6 u : moral +1 par seconde.'},
  Shanks:{asset:'cmd_shanks',hp:9,atk:5.5,def:2.5,spd:2.4,cd:1,haki:true,aura:1,camp:'Pirates',
    q:{k:'hdr',n:'Haki des Rois',cd:30,rng:0,r:6,d:'Onde de 6 u : troupes ordinaires étourdies 3 s, moral −25 ; l\'élite tient.'},
    pas:'Présence : groupes ennemis à 6 u, moral −2 par seconde. Ses groupes à 6 u : moral +1 par seconde.'},
  Luffy:{asset:'cmd_luffy',hp:8,atk:5,def:2.2,spd:2.8,cd:.9,haki:true,aura:1,camp:'Pirates',caout:true,
    q:{k:'pistol',n:'Gomu Gomu no Pistol',cd:12,rng:4,d:'Frappe à 4 u sur un groupe ou un commandant.'},
    pas:'Caoutchouc : coups de Garp et des Canons ÷ 2. Ses groupes à 6 u : moral +1 par seconde.'},
  Nami:{asset:'cmd_nami',hp:6,atk:2.5,def:1.6,spd:2.4,cd:1,aura:1,camp:'Pirates',
    q:{k:'eclair',n:'Thunderbolt Tempo',cd:18,rng:10,r:2,d:'Foudre sur 2 u de rayon, à 10 u au plus.'},
    pas:'Navigatrice : retraite de ses groupes +20 % de vitesse. Ses groupes à 6 u : moral +1 par seconde.'},
  Akainu:{asset:'cmd_akainu',hp:9,atk:5.5,def:2.4,spd:2.3,cd:1,haki:true,logia:true,aura:1,camp:'Marine',justice:true,
    q:{k:'lave',n:'Dai Funka',cd:22,rng:6,d:'Poing de magma en cône de 6 u ; le magma reste au sol 12 s.'},
    pas:'Logia (Magu Magu no Mi). Justice absolue : ses groupes à 6 u ne fuient pas, mais leurs pertes +10 %.'}};
/* Haki de l'Armement retenu pour Garp, Shanks, Luffy et Akainu [C?] ; le magma l'emporte sur le feu : Akainu frappe Ace ×2 [C] */
const RT_FORM={ligne:'Ligne',colonne:'Colonne',carre:'Carré',disperse:'Dispersé'};
const RT_ETAT={ferme:'ferme',ebranle:'ébranlé',desorg:'désorganisé',deroute:'en déroute'};
const rtAsset=(fac,kind)=>(typeof trpAsset==='function'&&(trpAsset(fac,UK.indexOf(kind))||trpAsset(fac,0)))||(fac==='marine'?'marine_recrue':'pirate_recrue');

/* ---------- carte : 20 × 14 cases de 1,2 u (24 × 16,8 u) orientées sur l'axe d'attaque, lues sur la grille de marche de l'île ---------- */
function rtMap(t,f){
  const G=trpGrid(t);if(!G)return null;const m=W3.models.get(t.id);
  let dx=f.x-t.x,dy=f.y-t.y;const dl=Math.hypot(dx,dy)||1;dx/=dl;dy/=dl;const ang=Math.atan2(dy,dx),rc=m&&m.rc?m.rc(ang):t.rad;
  const U=[dx,dy],V=[-dy,dx],S=RT.S,W=RT.W,H=RT.H;
  const free=(lx,ly)=>{const c=trpCell(G,lx,ly);return trpFree(G,c[0],c[1]);};
  const at=(cx,cy,i,j)=>[cx+U[0]*(i-(W-1)/2)*S+V[0]*(j-(H-1)/2)*S,cy+U[1]*(i-(W-1)/2)*S+V[1]*(j-(H-1)/2)*S];
  let best=null,bs=-1;
  for(const r0 of [.1,.2,.3,.4,.5])for(const l of [0,.1,-.1,.2,-.2,.3,-.3]){const cx=U[0]*r0*rc+V[0]*l*rc,cy=U[1]*r0*rc+V[1]*l*rc;let n=0;
    for(let i=0;i<W;i++)for(let j=0;j<H;j++){const [x,y]=at(cx,cy,i,j);if(free(x,y))n++;}
    const sc=n-Math.abs(l)*10;if(sc>bs){bs=sc;best=[cx,cy];}}
  const [cx,cy]=best,T=[];
  for(let i=0;i<W;i++){T.push([]);for(let j=0;j<H;j++){const [x,y]=at(cx,cy,i,j);let fc=0,hs=0,hn=0,wet=0;
    for(const a of [-.4,0,.4])for(const b of [-.4,0,.4]){const px=x+U[0]*a+V[0]*b,py=y+U[1]*a+V[1]*b;const h=G.Hs(px,py);if(h<=.06)wet++;if(free(px,py)){fc++;hs+=Math.max(0,h);hn++;}}
    const h=hn?hs/hn:Math.max(0,G.Hs(x,y));const k=fc>=6?(fc<9?'couvert':'libre'):(wet>=5?'eau':'bloque');
    T[i].push({i,j,x:t.x+x,y:t.y+y,z:h,k,haut:false,feu:-1,lave:-1,etroit:false});}}
  const pass=c=>c&&(c.k==='libre'||c.k==='couvert');
  for(let i=0;i<W;i++)for(let j=0;j<H;j++){const c=T[i][j];if(!pass(c))continue;let mn=1e9,nb=0;
    for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const d=T[i+a]&&T[i+a][j+b];if(pass(d)){mn=Math.min(mn,d.z);nb++;}}
    if(nb&&c.z-mn>.45)c.haut=true;
    /* passage étroit : bloqué des deux côtés, en travers ou en long (une case de large) */
    const bl=(a,b)=>{const d=T[i+a]&&T[i+a][j+b];return !d||!pass(d);};
    if((bl(0,1)&&bl(0,-1)&&!bl(1,0)&&!bl(-1,0))||(bl(1,0)&&bl(-1,0)&&!bl(0,1)&&!bl(0,-1)))c.etroit=true;}
  const M={t,G,U,V,cx,cy,T,W,H,S,pass};
  M.ij=(x,y)=>{const lx=x-t.x-cx,ly=y-t.y-cy;return [(lx*U[0]+ly*U[1])/S+(W-1)/2,(lx*V[0]+ly*V[1])/S+(H-1)/2];};
  M.xy=(fi,fj)=>[t.x+cx+U[0]*(fi-(W-1)/2)*S+V[0]*(fj-(H-1)/2)*S,t.y+cy+U[1]*(fi-(W-1)/2)*S+V[1]*(fj-(H-1)/2)*S];
  M.tile=(x,y)=>{const [a,b]=M.ij(x,y),i=Math.round(a),j=Math.round(b);return T[i]&&T[i][j]||null;};
  M.ok=(x,y)=>{const [a,b]=M.ij(x,y);if(a<-.45||b<-.45||a>W-.55||b>H-.55)return false;return free(x-t.x,y-t.y);};
  M.z=(x,y)=>Math.max(0,G.Hs(x-t.x,y-t.y));
  M.near=(x,y)=>{const [a,b]=M.ij(x,y);let bc=null,bd=1e9;for(const r of T)for(const c of r){if(!pass(c))continue;const d=(c.i-a)**2+(c.j-b)**2;if(d<bd){bd=d;bc=c;}}return bc;};
  return M;
}
/* chemin d'un groupe : A* sur les cases (8 voisins), coûts du couvert, de la montée et du feu, puis lissage par ligne de passage */
function rtPath(R,a,b){
  const M=R.M,s=(()=>{const c=M.tile(a[0],a[1]);return c&&M.pass(c)?c:M.near(a[0],a[1]);})();let e=M.tile(b[0],b[1]);if(!e||!M.pass(e))e=M.near(b[0],b[1]);
  if(!s||!e)return [];const W=M.W,key=c=>c.i*64+c.j,g=new Map([[key(s),0]]),from=new Map(),open=[s],shut=new Set();
  const h=c=>{const di=Math.abs(c.i-e.i),dj=Math.abs(c.j-e.j);return Math.max(di,dj)+.414*Math.min(di,dj);};
  let it=0;while(open.length&&it++<4000){let bi=0;for(let k=1;k<open.length;k++)if(g.get(key(open[k]))+h(open[k])<g.get(key(open[bi]))+h(open[bi]))bi=k;
    const c=open.splice(bi,1)[0];if(c===e)break;shut.add(key(c));
    for(let di=-1;di<=1;di++)for(let dj=-1;dj<=1;dj++){if(!di&&!dj)continue;const n=M.T[c.i+di]&&M.T[c.i+di][c.j+dj];if(!M.pass(n)||shut.has(key(n)))continue;
      if(di&&dj&&(!M.pass(M.T[c.i+di][c.j])||!M.pass(M.T[c.i][c.j+dj])))continue;
      const nd=g.get(key(c))+(di&&dj?1.414:1)*(n.k==='couvert'?1.4:1)*(n.feu>R.t||n.lave>R.t?4:1)+Math.max(0,n.z-c.z)*.8;
      if(!g.has(key(n))||nd<g.get(key(n))){g.set(key(n),nd);from.set(key(n),c);if(!open.includes(n))open.push(n);}}}
  if(e!==s&&!from.has(key(e)))return [];
  const raw=[];for(let c=e;c;c=from.get(key(c))){raw.push(c);if(c===s)break;}raw.reverse();
  const vis=(p,q)=>{const n=Math.ceil(Math.max(Math.abs(q.i-p.i),Math.abs(q.j-p.j))*3);for(let k=1;k<n;k++){const u=k/n,c=M.T[Math.round(p.i+(q.i-p.i)*u)][Math.round(p.j+(q.j-p.j)*u)];if(!M.pass(c)||c.k==='couvert')return false;}return true;};
  const out=[];let i=0;while(i<raw.length-1){let j=raw.length-1;while(j>i+1&&!vis(raw[i],raw[j]))j--;out.push(raw[j]);i=j;}
  const P=out.map(c=>[c.x,c.y]);if(M.ok(b[0],b[1])&&P.length)P[P.length-1]=[b[0],b[1]];else if(!P.length&&M.ok(b[0],b[1]))P.push([b[0],b[1]]);
  return P;
}
/* ligne de vue d'un tir : une case bloquée la coupe, ainsi que plus de 3 u de couvert traversé */
function rtVue(R,a,b){const M=R.M,[ai,aj]=M.ij(a[0],a[1]),[bi,bj]=M.ij(b[0],b[1]),n=Math.ceil(Math.max(Math.abs(bi-ai),Math.abs(bj-aj))*3);let cov=0;
  for(let k=1;k<n;k++){const u=k/n,c=M.T[Math.round(ai+(bi-ai)*u)]&&M.T[Math.round(ai+(bi-ai)*u)][Math.round(aj+(bj-aj)*u)];if(!c||c.k==='bloque')return false;if(c.k==='couvert'){cov+=M.S/3;if(cov>3)return false;}}return true;}

/* ---------- formations : emplacements des soldats (avant, côté), centrés sur le groupe ---------- */
function rtSlots(form,N){const L=[];if(N<=0)return L;
  if(form==='colonne'){for(let k=0;k<N;k++)L.push([-Math.floor(k/2)*.78,((k%2)-.5)*.74]);}
  else if(form==='carre'){const c=Math.ceil(Math.sqrt(N));for(let k=0;k<N;k++)L.push([-Math.floor(k/c)*.7,((k%c)-(c-1)/2)*.7]);}
  else{const sp=form==='disperse'||form==='desorg'?1.3:.76,dr=form==='disperse'||form==='desorg'?1.2:.82,c=Math.ceil(N/2);
    for(let k=0;k<N;k++){const r=k<c?0:1,cc=r?k-c:k,cn=r?N-c:c;L.push([-r*dr,(cc-(cn-1)/2)*sp]);}}
  let mf=0;for(const s of L)mf+=s[0];mf/=L.length;for(const s of L)s[0]-=mf;
  if(form==='desorg')L.forEach((s,k)=>{s[0]+=Math.sin(k*12.9898)*.55;s[1]+=Math.sin(k*78.233)*.55;});
  return L;}
const rtFront=(g,N)=>g.form==='colonne'?Math.min(N,2):g.form==='carre'?Math.ceil(N/3):Math.ceil(N/2);

/* ---------- bataille ---------- */
const rtAlive=g=>g&&!g.out&&(g.hero?g.hp>0:g.n>.05);
const rtUnit=g=>g.hero?{n:g.hero,ic:'★',atk:g.atk,def:g.def,rng:0,spd:g.spd,mor:100,cd:RT_H[g.hero].cd}:RT_U[g.kind];
const rtD=(a,b)=>Math.hypot(a.cx-b.cx,a.cy-b.cy);
const rtCampN=sd=>RT.cur&&RT.cur.names?RT.cur.names[sd]:(sd===0?'Marine':'Pirates');
/* description d'une bataille : île, île de départ, deux camps (joueur, faction, troupes par type, commandants) */
function rtDemoSpec(){const t=terrs.find(q=>q.name==='Alabasta');if(!t)return null;const f=terrs[(t.nb||[]).find(n=>terrs[n].boss===undefined)]||terrs[(t.nb||[])[0]];
  const u=L=>{const o={};for(const [k,n] of L)o[k]=(o[k]||0)+n;return o;};
  return {demo:true,t,f,stance:0,camps:[{pid:-1,fac:'marine',name:'Marine',u:u(RT.comp[0]),heroes:[{name:'Garp',lv:1}]},{pid:-1,fac:'pirate',name:'Pirates',u:u(RT.comp[1]),heroes:[{name:'Ace',lv:1}]}],split:RT.comp};}
function rtNew(opt){
  opt=opt||{};const sp=opt.spec||rtDemoSpec();if(!sp)return null;const t=sp.t,f=sp.f;
  const M=rtMap(t,f);if(!M)return null;
  const R={M,t,spec:sp,side:opt.side||0,seed:opt.seed||((Date.now()/1000)|0),G:[],t:0,acc:0,paused:true,deploy:true,end:null,hold:0,sur:[0,0],fx:[],pend:[],
    sel:[],mode:null,ai:[0,0],cont:new Map(),aiOn:opt.ai||[false,true],evts:[],log:[],stats:{coups:0},spd:RT.spd||1,mouse:null,names:sp.camps.map(c=>c.name),
    why:'Déploiement : donnez vos premiers ordres, puis Espace pour commencer.'};
  /* semi-automatique : l'IA mène aussi les groupes du joueur tant qu'il ne leur donne pas d'ordre (contrôle « auto ») */
  R.aiOn=opt.ai||[true,true];
  let rs=R.seed>>>0;R.rnd=()=>{rs=(rs*1664525+1013904223)>>>0;return rs/4294967296;};
  /* objectif : la case libre la plus intérieure au centre (la plage est du côté des i grands) */
  let ob=null;for(let i=2;i<7&&!ob;i++)for(const dj of [0,1,-1,2,-2,3,-3]){const c=M.T[i][Math.floor(M.H/2)+dj];if(c&&c.k==='libre'){ob=c;break;}}
  R.obj=ob||M.near(...M.xy(3,(M.H-1)/2));
  /* échelle : une figurine pour kf soldats (au plus une centaine de figurines en tout), 12 figurines au plus par groupe */
  const tot=sp.camps.reduce((a,c)=>a+UK.reduce((q,k)=>q+(c.u[k]||0),0),0),kf=Math.max(1,Math.ceil(tot/90));R.kf=kf;
  const add=(g)=>{g.id=R.G.length;g.q=[];g.path=null;g.cd=.5;g.att=new Map();g.lastCombat=-99;g.state='ferme';g.form=g.form||'ligne';g.causes=[];g.rally=0;g.near=new Set();g.stun=0;
    g.face=g.sd===0?Math.atan2(-M.U[1],-M.U[0]):Math.atan2(M.U[1],M.U[0]);g.dface=g.face;g.post=[g.ax,g.ay];
    const N=g.hero?1:Math.max(1,Math.ceil(g.n/g.kf-1e-6)),sl=rtSlots(g.form,N);g.sol=[];
    for(let k=0;k<N;k++){const o=g.hero?[0,0]:sl[k],x=g.ax+Math.cos(g.face)*o[0]-Math.sin(g.face)*o[1],y=g.ay+Math.sin(g.face)*o[0]+Math.cos(g.face)*o[1];
      const ok=M.ok(x,y);g.sol.push({k,x:ok?x:g.ax,y:ok?y:g.ay,px:0,py:0,z:0,face:g.face,an:null,at:0,hitT:-9,dead:false,dieT:0,ph:R.rnd()});}
    for(const s of g.sol){s.px=s.x;s.py=s.y;s.z=M.z(s.x,s.y);}rtCentre(g);R.G.push(g);return g;};
  /* rangées : mêlée devant, tir derrière ; l'attaque débarque côté plage (i grands), la défense tient devant l'objectif */
  const rowPos=(sd,row,k,n)=>{const sp2=Math.min(3.1,(M.H-2)/Math.max(1,n-1)),fi=sd===0?M.W-3.8+row*1.9:R.obj.i+4.2-row*2.1,fj=(M.H-1)/2+(k-(n-1)/2)*sp2;const c=M.near(...M.xy(Math.max(0,Math.min(M.W-1,fi)),Math.max(0,Math.min(M.H-1,fj))));return [c.x,c.y];};
  for(const sd of [0,1]){const C=sp.camps[sd],L=[];
    if(sp.split)for(const [kind,n] of sp.split[sd])L.push({kind,n});
    else for(const k of UK){const n=C.u[k]||0;if(n<.5)continue;const ng=Math.ceil(Math.ceil(n/kf-1e-6)/12);for(let q=0;q<ng;q++)L.push({kind:k,n:n/ng});}
    const front=L.filter(x=>!RT_U[x.kind].rng),back=L.filter(x=>RT_U[x.kind].rng),rows=[];
    for(let q=0;q<front.length;q+=6)rows.push(front.slice(q,q+6));for(let q=0;q<back.length;q+=6)rows.push(back.slice(q,q+6));
    rows.forEach((row,ri)=>row.forEach((x,k)=>{const [ax,ay]=rowPos(sd,ri,k,row.length);add({sd,kind:x.kind,n:x.n,n0:x.n,kf,asset:rtAsset(C.fac,x.kind),ax,ay,m:RT_U[x.kind].mor});}));
    C.heroes.forEach((h,k)=>{const H=RT_H[h.name];if(!H)return;const lv=1+.1*((h.lv||1)-1),hc=sd===0?M.near(...M.xy(M.W-1.8,(M.H-1)/2+(k-(C.heroes.length-1)/2)*2)):M.near(...M.xy(R.obj.i+.5,(M.H-1)/2+(k-(C.heroes.length-1)/2)*2));
      add({sd,kind:'hero',hero:h.name,key:h.key,c:h.c,n:1,n0:1,kf:1,hp:H.hp*lv,hp0:H.hp*lv,atk:H.atk*lv,def:H.def,spd:H.spd,asset:H.asset,ax:hc.x,ay:hc.y,m:100,qcd:0});});}
  return R;
}
function rtCentre(g){let x=0,y=0,n=0;for(const s of g.sol)if(!s.dead){x+=s.x;y+=s.y;n++;}if(n){g.cx=x/n;g.cy=y/n;}else{g.cx=g.ax;g.cy=g.ay;}
  const N=n||1;if(g.hero){g.rad=.4;return;}const sl=rtSlots(g.state==='desorg'?'desorg':g.form,N);let r=0;for(const s of sl)r=Math.max(r,Math.hypot(s[0],s[1]));g.rad=r+.35;}
const rtSolV=g=>g.sol.filter(s=>!s.dead);
/* plus petite distance entre deux soldats de deux groupes (contact de mêlée) ; calculée une fois par pas */
function rtContactMap(R){const C=new Map(),L=R.G.filter(g=>rtAlive(g));
  for(let a=0;a<L.length;a++)for(let b=a+1;b<L.length;b++){const g=L[a],e=L[b];if(g.sd===e.sd)continue;if(rtD(g,e)>g.rad+e.rad+2)continue;
    let md=1e9;for(const s of g.sol){if(s.dead)continue;for(const o of e.sol){if(o.dead)continue;const d=(s.x-o.x)**2+(s.y-o.y)**2;if(d<md)md=d;}}md=Math.sqrt(md);
    if(md<=RT.K.contact){(C.get(g)||C.set(g,[]).get(g)).push([e,md]);(C.get(e)||C.set(e,[]).get(e)).push([g,md]);}}
  R.cont=C;}
const rtContacts=(R,g)=>(R.cont.get(g)||[]).filter(([e])=>rtAlive(e)).sort((a,b)=>a[1]-b[1]).map(([e])=>e);
const rtInContact=(R,g,e)=>(R.cont.get(g)||[]).some(([q])=>q===e);
function rtRange(R,g,e){const U=rtUnit(g);if(!U.rng)return false;const hi=g.state!=='desorg'&&R.M.z(g.cx,g.cy)-R.M.z(e.cx,e.cy)>.6;
  return rtD(g,e)<=U.rng*(hi?RT.K.highRng:1)&&rtVue(R,[g.cx,g.cy],[e.cx,e.cy]);}
const rtEnemies=(R,g)=>R.G.filter(e=>e.sd!==g.sd&&rtAlive(e));

/* ---------- ordres : file par groupe (Maj ajoute à la suite) ---------- */
function rtGive(R,g,o,queue){if(!rtAlive(g)||g.state==='deroute')return false;
  if(g.sd===R.side&&o.k!=='formation'){g.ctrl='manuel';g.idleT=0;}
  if(o.k==='formation'){if(!g.hero)g.form=o.f;return true;}
  if(queue&&g.q.length&&g.q[g.q.length-1].k!=='tenir'&&g.q[g.q.length-1].k!=='retraite')g.q.push(o);else{g.q=[o];g.path=null;g.goal=null;}
  return true;}
function rtSet(R,g,o){const c=g.q[0];if(c&&c.k===o.k&&(o.id===undefined||c.id===o.id)&&(o.x===undefined||Math.hypot(c.x-o.x,c.y-o.y)<1))return;g.q=[o];g.path=null;g.goal=null;}
function rtGoTo(R,g,x,y,re){if(!g.path||!g.goal||Math.hypot(g.goal[0]-x,g.goal[1]-y)>1.2||re||(R.t-g.pathT>1.5&&g.path.length&&g.pi<g.path.length)){g.path=rtPath(R,[g.ax,g.ay],[x,y]);g.pi=0;g.goal=[x,y];g.pathT=R.t;}}
function rtHalt(g){g.path=null;g.goal=null;}
function rtExit(R,g){const M=R.M,[,fj]=M.ij(g.cx,g.cy),fi=g.sd===0?M.W-.7:-.3;const j=Math.max(0,Math.min(M.H-1,Math.round(fj)));let c=null;
  for(let d=0;d<M.H&&!c;d++)for(const jj of [j+d,j-d]){const q=M.T[g.sd===0?M.W-1:0][jj];if(q&&M.pass(q)){c=q;break;}}
  return c?[c.x+M.U[0]*M.S*.4*(g.sd===0?1:-1),c.y+M.U[1]*M.S*.4*(g.sd===0?1:-1)]:M.xy(fi,j);}
/* comportement d'un groupe à ce pas : contre qui il frappe (g.fight) et où il va (g.path) */
function rtThink(R,g){
  g.fight=null;g.wantFace=null;if(!rtAlive(g))return;const U=rtUnit(g),o=g.q[0],cont=rtContacts(R,g);
  if(g.stun>R.t){rtHalt(g);return;}
  if(g.state==='deroute'||(o&&o.k==='retraite')){const [x,y]=g.exit||(g.exit=rtExit(R,g));rtGoTo(R,g,x,y);return;}
  g.exit=null;
  const melee=e=>{g.fight=e;g.wantFace=Math.atan2(e.cy-g.cy,e.cx-g.cx);};
  if(o&&o.k==='attaque'){const e=R.G[o.id];if(!rtAlive(e)){g.q.shift();rtHalt(g);return rtThink(R,g);}
    if(U.rng&&!cont.length&&rtRange(R,g,e)){rtHalt(g);melee(e);return;}
    if(rtInContact(R,g,e)){melee(e);g.creep=e;return;}
    if(cont.length){rtHalt(g);melee(cont[0]);return;}
    rtGoTo(R,g,e.cx,e.cy);return;}
  if(o&&(o.k==='aller'||o.k==='avancer')){
    if(cont.length){const dir=Math.atan2(o.y-g.cy,o.x-g.cx),bl=cont.find(e=>Math.cos(Math.atan2(e.cy-g.cy,e.cx-g.cx)-dir)>.35);
      if(o.k==='avancer'||bl){rtHalt(g);melee(bl||cont[0]);return;}}
    if(o.k==='avancer'){if(U.rng){const e=rtEnemies(R,g).filter(e=>rtRange(R,g,e)).sort((a,b)=>rtD(g,a)-rtD(g,b))[0];if(e){rtHalt(g);melee(e);return;}}
      else if(g.state!=='ebranle'){const e=rtEnemies(R,g).filter(e=>rtD(g,e)<=g.rad+e.rad+3).sort((a,b)=>rtD(g,a)-rtD(g,b))[0];if(e){rtGoTo(R,g,e.cx,e.cy);g.goal=null;return;}}}
    if(Math.hypot(g.ax-o.x,g.ay-o.y)<.35||(g.path&&g.pi>=g.path.length&&g.goal&&Math.hypot(g.goal[0]-o.x,g.goal[1]-o.y)<.5)){g.q.shift();rtHalt(g);return;}
    rtGoTo(R,g,o.x,o.y);return;}
  /* tenir, ou sans ordre : il tient sa place et riposte à ce qui l'attaque ou entre à sa portée */
  rtHalt(g);
  if(cont.length){melee(cont[0]);return;}
  if(U.rng){const e=rtEnemies(R,g).filter(e=>rtRange(R,g,e)).sort((a,b)=>rtD(g,a)-rtD(g,b))[0];if(e)melee(e);return;}
  if(!(o&&o.k==='tenir')&&g.state==='ferme'){const e=rtEnemies(R,g).filter(e=>rtD(g,e)<=g.rad+e.rad+1.6).sort((a,b)=>rtD(g,a)-rtD(g,b))[0];
    if(e){rtGoTo(R,g,e.cx,e.cy);g.goal=null;}}
}
function rtSpeed(R,g){const U=rtUnit(g);let v=U.spd;const c=R.M.tile(g.ax,g.ay),o=g.q[0];
  if(g.form==='colonne')v*=1.25;else if(g.form==='carre')v*=.7;if(c&&c.k==='couvert')v*=.7;
  if(g.path&&g.pi<g.path.length){const p=g.path[g.pi];if(R.M.z(p[0],p[1])-R.M.z(g.ax,g.ay)>.5)v*=.7;}
  if(o&&o.k==='retraite')v*=.8;if(g.state==='deroute')v*=1.1;
  if((g.state==='deroute'||(o&&o.k==='retraite'))&&R.G.some(q=>q.hero==='Nami'&&q.sd===g.sd&&rtAlive(q)))v*=1.2;return v;}
function rtAnchor(R,g,dt){
  g.moving=false;
  if(g.creep&&g.fight===g.creep&&rtAlive(g.creep)){   /* au contact : on serre jusqu'à joindre les fronts */
    const e=g.creep,d=rtD(g,e);if(d>g.rad*.3+e.rad*.3+.8){const v=.5*dt;g.ax+=(e.cx-g.ax)/Math.max(d,.01)*v;g.ay+=(e.cy-g.ay)/Math.max(d,.01)*v;}}
  g.creep=null;
  if(g.path&&g.pi<g.path.length){const p=g.path[g.pi],dx=p[0]-g.ax,dy=p[1]-g.ay,d=Math.hypot(dx,dy);let v=rtSpeed(R,g);
    if(Math.hypot(g.cx-g.ax,g.cy-g.ay)>2.2)v*=.3;const st=v*dt;
    if(d<=st){g.ax=p[0];g.ay=p[1];g.pi++;}else{g.ax+=dx/d*st;g.ay+=dy/d*st;}
    if(d>.05){g.dface=Math.atan2(dy,dx);g.moving=true;g.run=(g.run||0)+st;if(g.run>2)g.charge=true;}}
  else g.run=0;
  if(g.wantFace!==null&&g.wantFace!==undefined)g.dface=g.wantFace;
  let da=g.dface-g.face;while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;
  /* au combat, le front ne pivote que s'il est vraiment de travers (et lentement) : la ligne ne court pas sur place */
  if(g.fight&&!g.moving&&Math.abs(da)<.6)da=0;const mx=(g.fight?1.1:2.2)*dt;g.face+=Math.max(-mx,Math.min(mx,da));
  /* l'ancre reste sur la zone */
  const M=R.M,[fi,fj]=M.ij(g.ax,g.ay);if(fi<0||fj<0||fi>M.W-1||fj>M.H-1){const [x,y]=M.xy(Math.max(0,Math.min(M.W-1,fi)),Math.max(0,Math.min(M.H-1,fj)));if(!(g.state==='deroute'||(g.q[0]&&g.q[0].k==='retraite'))){g.ax=x;g.ay=y;}}
}
/* soldats : chacun rejoint sa place dans la formation ; séparation entre tous les soldats (les groupes se bloquent) ; jamais dans un obstacle */
/* soldats : locomotion avec vitesse et accélération limitées, arrêt net à l'arrivée (zone morte), état « court » avec hystérésis
   (pas de bascule course / garde pour les petites poussées entre voisins), orientation lissée : vers sa marche quand il court,
   vers l'ennemi le plus proche quand son groupe se bat, sinon vers le front du groupe. */
function rtSoldiers(R,dt){
  const M=R.M,all=[];for(const g of R.G)if(!g.out)for(const s of g.sol)if(!s.dead)all.push([s,g]);
  for(const [s] of all){s.px=s.x;s.py=s.y;}
  const ACC=9,ARR=.14;
  for(const g of R.G){if(g.out||!rtAlive(g))continue;const L=rtSolV(g),form=g.state==='desorg'||g.state==='deroute'?'desorg':g.form,sl=g.hero?[[0,0]]:rtSlots(form,L.length);
    const cf=Math.cos(g.face),sf=Math.sin(g.face),vmax=rtSpeed(R,g)*1.3*(g.stun>R.t?0:1),foe=g.fight&&rtAlive(g.fight)?g.fight:null,foeS=foe?rtSolV(foe):null;
    L.forEach((s,k)=>{const o=sl[k]||[0,0],sx0=g.ax+cf*o[0]-sf*o[1],sy0=g.ay+sf*o[0]+cf*o[1];let tx=sx0,ty=sy0;
      /* soldat bloqué derrière un obstacle : il suit un chemin fin (grille de marche) jusqu'à sa place */
      if(s.route){const q=s.route[0];if(Math.hypot(q[0]-s.x,q[1]-s.y)<.3)s.route.shift();if(!s.route.length||R.t>s.routeT)s.route=null;else{tx=s.route[0][0];ty=s.route[0][1];}}
      const dx=tx-s.x,dy=ty-s.y,d=Math.hypot(dx,dy);
      /* vitesse voulue : freinage à l'approche, rien dans la zone morte ; accélération limitée */
      let wx=0,wy=0;if(d>ARR){const v=Math.min(vmax,(d-ARR)*3.2+.4);wx=dx/d*v;wy=dy/d*v;}
      const busy=s.an==='attaque'||s.an==='preparation'||(s.an==='reaction'&&R.t-s.at<.3);if(busy&&!g.moving){wx*=.15;wy*=.15;}
      let vx=s.vx||0,vy=s.vy||0;const ex=wx-vx,ey=wy-vy,el=Math.hypot(ex,ey),am=ACC*dt;if(el>am){vx+=ex/el*am;vy+=ey/el*am;}else{vx=wx;vy=wy;}
      let nx=s.x+vx*dt,ny=s.y+vy*dt;
      /* séparation : poussée de position seulement (elle ne fait ni courir ni tourner) */
      for(const [o2] of all){if(o2===s)continue;const qx=s.px-o2.px,qy=s.py-o2.py,e2=qx*qx+qy*qy;if(e2>=.3364||e2<1e-8)continue;const e=Math.sqrt(e2),pp=(.58-e)*.35;nx+=qx/e*pp;ny+=qy/e*pp;}
      if(!M.ok(nx,ny)){if(M.ok(nx,s.y)){ny=s.y;vy=0;}else if(M.ok(s.x,ny)){nx=s.x;vx=0;}else{nx=s.x;ny=s.y;vx=vy=0;}}
      s.vx=vx;s.vy=vy;const sp=Math.hypot(vx,vy);
      /* au contact, on ne « court » que pour un vrai déplacement : les petits réajustements gardent la pose de combat */
      const thr=foe&&s.near<2?1.15:.55;if(!s.mv&&sp>thr&&d>.35)s.mv=1;else if(s.mv&&(sp<.22||(foe&&s.near<1.4&&sp<.8)))s.mv=0;
      s.walk=(s.walk||0)+sp*dt;
      /* orientation */
      let fa=g.face;
      if(s.mv)fa=Math.atan2(vy,vx);
      else if(foeS&&foeS.length){let b=null,bd=1e9;for(const q of foeS){const dd=(q.x-s.x)**2+(q.y-s.y)**2;if(dd<bd){bd=dd;b=q;}}if(b){fa=Math.atan2(b.y-s.y,b.x-s.x);s.near=Math.sqrt(bd);s.nearS=b;}}
      if(!foeS)s.near=99;
      let da=fa-s.face;while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;const mr=9*dt;s.face+=Math.max(-mr,Math.min(mr,da));
      const got=Math.hypot(nx-s.x,ny-s.y);s.stk=d>.5&&got<vmax*dt*.3?(s.stk||0)+dt:0;
      if(s.stk>.6&&!s.route){s.stk=0;const G=M.G,ox=M.t.x,oy=M.t.y,c0=trpNear(G,s.x-ox,s.y-oy,2),c1=trpNear(G,sx0-ox,sy0-oy,3),P=c0&&c1?trpPath(G,c0,c1):null;
        if(P&&P.length>1){s.route=P.slice(1).map(c=>{const q=trpXY(G,c[0],c[1]);return [q[0]+ox,q[1]+oy];});s.routeT=R.t+5;}}
      s.x=nx;s.y=ny;s.z=M.z(nx,ny);});}
  for(const g of R.G)rtCentre(g);
}
/* mêlée animée : tous les soldats au contact frappent à leur rythme (préparation, attaque, retour en garde), et l'adversaire visé
   réagit au moment du coup. Purement visuel : les pertes restent celles du groupe (rtStrike). */
function rtMeleeAnim(R){
  for(const g of R.G){if(!rtAlive(g)||!g.fight||!rtAlive(g.fight))continue;const U=rtUnit(g),melee=!U.rng||rtInContact(R,g,g.fight);if(!melee)continue;
    for(const s of rtSolV(g)){if(s.mv||s.an||s.near===undefined||s.near>1.4||R.t<(s.nextAtk||0))continue;
      const dp=g.hero?.18:.12+R.rnd()*.12,da=tacAnDur(g.asset,'attaque');s.an='preparation';s.at=R.t;s.prepEnd=R.t+dp;
      R.pend.push({t:R.t+dp,f:()=>{if(s.dead)return;s.an='attaque';s.at=R.t;const o=s.nearS;if(o&&!o.dead&&(!o.an||o.an==='reaction')&&R.rnd()<.45){o.an='reaction';o.at=R.t+da*.45;o.hitT=R.t+da*.45;
          R.fx.push({k:'impact',p:[o.x,o.y,o.z+.55],t0:R.t+da*.45,t1:R.t+da*.45+.2});}}});
      s.nextAtk=R.t+dp+da+.35+R.rnd()*(g.hero?.5:1.1);}}
}

/* ---------- combat : chaque groupe frappe à sa cadence ; dégâts = points ÷ défense de la cible ---------- */
function rtStrike(R,g,e){
  const K=RT.K,U=rtUnit(g),UE=rtUnit(e),M=R.M,L=rtSolV(g),N=L.length;const ranged=U.rng&&!rtInContact(R,g,e);
  let nEng=g.hero?1:ranged?g.n:Math.min(g.n,rtFront(g,N)*g.kf);const ct=M.tile(g.cx,g.cy),et=M.tile(e.cx,e.cy);
  if(!ranged&&!g.hero&&((ct&&ct.etroit)||(et&&et.etroit)))nEng=Math.min(nEng,K.front*g.kf);
  let P=K.dmg*nEng*U.atk*(ranged?K.rng:1)*(.85+.3*R.rnd());
  if(g.sd===0)P*=K.assaut*(R.spec&&!R.spec.demo?STANCE[R.spec.stance|0].a:1);   /* posture de l'armée (règle du jeu) ; calibrage de l'assaut sur le calcul automatique */
  if(U.charge&&!ranged&&g.charge){P*=K.charge;g.charge=false;}
  if(U.zone&&ranged)P*=K.canon;
  if(g.state==='ebranle')P*=K.ebranle;if(g.form==='carre')P*=K.carre;if(!ranged&&g.form==='disperse')P*=K.dispMel;if(U.rng&&!ranged)P*=K.rngMelee;
  /* flanc et dos (sauf carré) */
  let cote='front';if(!e.hero&&e.form!=='carre'){const dc=Math.cos(Math.atan2(g.cy-e.cy,g.cx-e.cx)-e.face);if(dc<-.5){P*=K.back;cote='dos';}else if(dc<.5){P*=K.flank*(e.form==='colonne'?K.colFlank:1);cote='flanc';}}
  const dz=M.z(g.cx,g.cy)-M.z(e.cx,e.cy);
  if(ranged){if(dz>.6)P*=K.high;if(et&&et.k==='couvert')P*=K.cover;if(UE.tir)P*=UE.tir;if(e.form==='disperse')P*=K.disp;}
  else{if(dz<-.6)P*=K.uphill;else if(dz>.6)P*=K.downhill;}
  R.stats.coups++;
  /* animation : les soldats les plus proches de la cible frappent (ou tirent), au moment du coup */
  const shooters=L.slice().sort((a,b)=>Math.hypot(a.x-e.cx,a.y-e.cy)-Math.hypot(b.x-e.cx,b.y-e.cy)).slice(0,Math.min(nEng,ranged?6:4));
  const tv=rtSolV(e);
  if(ranged||g.hero)shooters.forEach((s,k)=>{s.an='attaque';s.at=R.t+k*.05;s.face=Math.atan2(e.cy-s.y,e.cx-s.x);
    if(ranged&&tv.length){const o=tv[Math.floor(R.rnd()*tv.length)],t0=R.t+k*.05+.12;R.fx.push({k:'eclair',p:[s.x+Math.cos(s.face)*.3,s.y+Math.sin(s.face)*.3,s.z+.55],t0,t1:t0+.12});
      R.fx.push({k:'balle',a:[s.x,s.y,s.z+.55],b:[o.x,o.y,o.z+.5],t0,t1:t0+.18});R.fx.push({k:'impact',p:[o.x,o.y,o.z+.5],t0:t0+.18,t1:t0+.4});}});
  if(!ranged&&tv.length){const o=tv.slice().sort((a,b)=>Math.hypot(a.x-g.cx,a.y-g.cy)-Math.hypot(b.x-g.cx,b.y-g.cy))[0];R.fx.push({k:'impact',p:[o.x,o.y,o.z+.55],t0:R.t+.15,t1:R.t+.37});}
  rtHurt(R,e,P,g,ranged?'tir':'melee',cote,ranged?.3:.15);
  /* Canons : éclats sur les groupes ennemis voisins de l'impact */
  if(U.zone&&ranged)for(const q of R.G)if(q!==e&&q.sd===e.sd&&rtAlive(q)&&!q.hero&&rtD(q,e)<2.5)rtHurt(R,q,P*.35,g,'tir','front',.3);
}
function rtHurt(R,e,P,src,ty,cote,delay){
  const K=RT.K;if(!rtAlive(e))return 0;e.lastCombat=R.t;if(src&&!src.hero)src.lastCombat=R.t;
  if(src&&!e.hero){const was=e.att.get(src.id);if(was===undefined||R.t-was>6){if(cote==='flanc'){e.m-=10;rtCause(R,e,'pris de flanc −10');}else if(cote==='dos'){e.m-=20;rtCause(R,e,'pris à revers −20');}}e.att.set(src.id,R.t);}
  const hit=rtSolV(e);for(let k=0;k<Math.min(2,hit.length);k++){const s=hit[Math.floor(R.rnd()*hit.length)];if(s.an!=='attaque'){s.an='reaction';s.at=R.t+(delay||0);}s.hitT=R.t+(delay||0);}
  if(e.hero){const H=RT_H[e.hero];let v=P/e.def;if(H.logia&&!(src&&src.hero&&RT_H[src.hero].haki))v*=K.logia;
    if(H.caout&&src&&(src.hero==='Garp'||src.kind==='catapulte'))v*=.5;if(e.hero==='Ace'&&src&&src.hero==='Akainu')v*=2;
    if(!R.G.some(q=>q.sd===e.sd&&!q.hero&&rtAlive(q)&&rtD(q,e)<=4))v*=K.isole;
    e.hp=Math.max(0,e.hp-v);R.evts.push({t:R.t+(delay||0),g:e,v});
    if(e.hp<=0){const s=e.sol[0];s.dead=true;s.dieT=R.t+(delay||0);s.an='reaction';s.at=R.t;e.out=true;e.blesse=true;
      for(const q of R.G)if(q.sd===e.sd&&!q.hero&&rtAlive(q)){q.m-=20;rtCause(R,q,e.hero+' blessé −20');}
      rtLog(R,e.hero+' est blessé et quitte le combat.');if(e.sd===R.side)rtAutoPause(R,e.hero+' est blessé.');}
    else if(e.sd===R.side&&!e.p30&&e.hp<.3*e.hp0){e.p30=true;rtAutoPause(R,e.hero+' sous 30 % de vie.');}
    return v;}
  const U=RT_U[e.kind],o=e.q[0];let lost=P/U.def;if(o&&o.k==='tenir')lost/=K.hold;if(e.state==='desorg')lost/=K.desorg;
  if(rtJustice(R,e))lost*=1.1;
  const n1=Math.max(0,e.n-lost);lost=e.n-n1;e.n=n1;R.evts.push({t:R.t+(delay||0),g:e,v:lost});
  if(!(o&&o.k==='retraite'))e.m-=lost/e.n0*100*K.morPerte;
  /* figurines perdues : celles qui sont le plus près de l'assaillant tombent */
  const keep=Math.ceil(e.n/e.kf-1e-6);let L=rtSolV(e);
  while(L.length>keep){const sx=src?src.cx:e.cx,sy=src?src.cy:e.cy;L.sort((a,b)=>Math.hypot(a.x-sx,a.y-sy)-Math.hypot(b.x-sx,b.y-sy));const s=L.shift();s.dead=true;s.dieT=R.t+(delay||0);s.an='reaction';s.at=R.t+(delay||0);R.evts.push({t:R.t+(delay||0),g:e,kill:e.kf,x:s.x,y:s.y});}
  if(e.n<=.05){e.n=0;e.out=true;rtLog(R,RT_U[e.kind].n+' ('+rtCampN(e.sd)+') détruits.');}
  return lost;
}
function rtCause(R,g,txt){g.causes.push([R.t,txt]);g.causes=g.causes.filter(c=>R.t-c[0]<4).slice(-4);}
function rtLog(R,txt){R.log.unshift([R.t,txt]);R.log=R.log.slice(0,6);}

/* ---------- moral : quatre états, seuils fixes (60, 30, 10) ---------- */
function rtMoral(R,g,dt){
  if(g.hero||!rtAlive(g))return;const U=RT_U[g.kind],base=U.mor,o=g.q[0],ret=o&&o.k==='retraite';g.live=[];
  if(!ret&&g.state!=='deroute'){
    const h=R.G.find(q=>q.hero&&q.sd===g.sd&&rtAlive(q)&&rtD(q,g)<=6);
    if(h&&g.m<base){g.m=Math.min(base,g.m+RT_H[h.hero].aura*dt);g.live.push(h.hero+' +'+RT_H[h.hero].aura+'/s');}
    const att=[...g.att.entries()].filter(([id,t])=>R.t-t<2).map(([id])=>R.G[id]).filter(rtAlive);
    if(att.length>=2){let mx=0;for(let a=0;a<att.length;a++)for(let b=a+1;b<att.length;b++){let d=Math.abs(Math.atan2(att[a].cy-g.cy,att[a].cx-g.cx)-Math.atan2(att[b].cy-g.cy,att[b].cx-g.cx));if(d>Math.PI)d=2*Math.PI-d;mx=Math.max(mx,d);}
      if(mx>2.09){g.m-=3*dt;g.live.push('encerclé −3/s');}}
    if(R.t-g.lastCombat>5&&g.m<base&&!h){g.m=Math.min(base,g.m+dt);g.live.push('repos +1/s');}
    const sh=R.G.find(q=>q.hero==='Shanks'&&q.sd!==g.sd&&rtAlive(q)&&rtD(q,g)<=6);if(sh){g.m-=2*dt;g.live.push('présence de Shanks −2/s');}
    /* renforts : un groupe allié arrive à 6 u pendant le combat */
    for(const q of R.G){if(q===g||q.sd!==g.sd||q.hero||!rtAlive(q))continue;const inR=rtD(q,g)<=6;if(inR&&!g.near.has(q.id)&&R.t-g.lastCombat<3&&R.t>1){g.m+=10;rtCause(R,g,'renforts +10');}if(inR)g.near.add(q.id);else g.near.delete(q.id);}}
  g.m=Math.max(0,Math.min(100,g.m));
  const prev=g.state;
  if(g.state==='deroute'){const h=R.G.find(q=>q.hero&&q.sd===g.sd&&rtAlive(q)&&rtD(q,g)<=6),en=rtEnemies(R,g).some(e=>rtD(e,g)<=4+e.rad);
    if(h&&!en){g.rally+=dt;g.live.push('ralliement '+Math.ceil(5-g.rally)+' s');if(g.rally>=5){g.m=30;g.state='ebranle';g.rally=0;g.bestEx=undefined;g.q=[];rtHalt(g);rtCause(R,g,'rallié par '+h.hero);rtLog(R,RT_U[g.kind].n+' ('+rtCampN(g.sd)+') ralliés par '+h.hero+'.');}}
    else g.rally=0;}
  else{g.state=g.m>=60?'ferme':g.m>=30?'ebranle':g.m>=10?'desorg':'deroute';if(g.state==='deroute'&&rtJustice(R,g)){g.state='desorg';g.live.push('Justice absolue : ne fuit pas');}}
  if(g.state!==prev){
    if(g.state==='desorg'&&prev!=='deroute'){const c=rtContacts(R,g)[0];if(c){const d=rtD(g,c)||1,[x,y]=[g.cx+(g.cx-c.cx)/d*3,g.cy+(g.cy-c.cy)/d*3];if(R.M.ok(x,y)){g.ax=x;g.ay=y;rtHalt(g);}}}
    if(g.state==='deroute'){g.q=[];rtHalt(g);g.exit=null;rtLog(R,RT_U[g.kind].n+' ('+rtCampN(g.sd)+') en déroute.');
      for(const q of R.G){if(!rtAlive(q)||q===g||q.hero)continue;if(q.sd===g.sd&&rtD(q,g)<=6){q.m-=RT.K.voisin;rtCause(R,q,'voisins en fuite −'+RT.K.voisin);}
        else if(q.sd!==g.sd&&rtInContact(R,q,g)){q.m+=15;rtCause(R,q,'victoire locale +15');}}
      if(g.sd===R.side)rtAutoPause(R,RT_U[g.kind].n+' en déroute.');}}
}

/* ---------- compétences des commandants (une active et la passive dans ce prototype) ---------- */
function rtSkillOk(R,h){return h&&h.hero&&rtAlive(h)&&h.qcd<=0&&!h.cast;}
function rtCast(R,h,x,y){if(!rtSkillOk(R,h))return false;const Q=RT_H[h.hero].q,K=RT.K,M=R.M;
  if(Q.k==='hdr'){x=h.cx;y=h.cy;}const d=Math.hypot(x-h.cx,y-h.cy);
  if(Q.rng&&d>Q.rng){const k=Q.rng/d;x=h.cx+(x-h.cx)*k;y=h.cy+(y-h.cy)*k;}
  h.qcd=Q.cd;h.cast={x,y,t:R.t};const s=h.sol[0],face=Q.k==='hdr'?h.face:Math.atan2(y-h.cy,x-h.cx);s.an='preparation';s.at=R.t;s.face=face;h.face=h.dface=face;
  R.pend.push({t:R.t+.4,f:()=>{s.an='attaque';s.at=R.t;}});
  const hz=h.cz=M.z(h.cx,h.cy);
  if(Q.k==='boulets'){for(let k=0;k<3;k++){const a=R.rnd()*6.283,r=Math.sqrt(R.rnd())*Q.r,ix=x+Math.cos(a)*r,iy=y+Math.sin(a)*r,iz=M.z(ix,iy),t0=R.t+.45+k*.12,t1=t0+.75;
      R.fx.push({k:'boulet',a:[h.cx,h.cy,hz+1.2],b:[ix,iy,iz+.15],t0,t1});R.fx.push({k:'poussiere',p:[ix,iy,iz+.1],t0:t1,t1:t1+.8});R.fx.push({k:'secousse',t0:t1,t1:t1+.45});
      R.pend.push({t:t1,f:()=>rtZone(R,h,(px,py)=>Math.hypot(px-ix,py-iy)<=1.4,K.boulet,K.zoneCmd)});}}
  else if(Q.k==='hiken'){const L=Q.rng,ux=Math.cos(face),uy=Math.sin(face),ox=h.cx+ux*.4,oy=h.cy+uy*.4,inL=(px,py)=>{const a=(px-ox)*ux+(py-oy)*uy,b=Math.abs(-(px-ox)*uy+(py-oy)*ux);return a>=0&&a<=L&&b<=Q.w/2;};
    R.fx.push({k:'jet',a:[ox,oy,hz+.7],b:[ox+ux*L,oy+uy*L,M.z(ox+ux*L,oy+uy*L)+.4],t0:R.t+.42,t1:R.t+1.2});
    for(let k=0;k<=10;k++){const px=ox+ux*L*k/10,py=oy+uy*L*k/10,t0=R.t+.45+k*.06;R.fx.push({k:'feu',p:[px,py,M.z(px,py)+.25],t0,t1:t0+1.1});}
    R.fx.push({k:'secousse',t0:R.t+.6,t1:R.t+1});
    R.pend.push({t:R.t+.6,f:()=>{rtZone(R,h,inL,K.hiken,K.zoneCmd);for(const r of M.T)for(const c of r)if(c.k==='couvert'&&inL(c.x,c.y)){c.feu=R.t+10;c.hzSd=h.sd;}}});}
  else if(Q.k==='hdr'){R.fx.push({k:'onde',p:[h.cx,h.cy,hz+.3],r:Q.r,t0:R.t+.4,t1:R.t+1.3});R.fx.push({k:'secousse',t0:R.t+.45,t1:R.t+1});
    R.pend.push({t:R.t+.5,f:()=>{for(const e of R.G){if(e.sd===h.sd||!rtAlive(e)||e.hero||RT_U[e.kind].hdr)continue;if(!rtSolV(e).some(q=>Math.hypot(q.x-h.cx,q.y-h.cy)<=Q.r))continue;
      e.stun=R.t+3;e.m-=25;rtCause(R,e,'Haki des Rois −25, étourdis 3 s');for(const q of rtSolV(e)){q.an='reaction';q.at=R.t;}}}});}
  else if(Q.k==='pistol'){let tg=null,bd=1.8;for(const e of R.G){if(e.sd===h.sd||!rtAlive(e))continue;const dd=Math.hypot(e.cx-x,e.cy-y);if(dd<bd){bd=dd;tg=e;}}
    const tx=tg?tg.cx:x,ty=tg?tg.cy:y;R.fx.push({k:'poing',a:[h.cx,h.cy,hz+.7],b:[tx,ty,M.z(tx,ty)+.6],t0:R.t+.4,t1:R.t+.7});R.fx.push({k:'impact',p:[tx,ty,M.z(tx,ty)+.6],t0:R.t+.6,t1:R.t+.95});R.fx.push({k:'secousse',t0:R.t+.6,t1:R.t+.9});
    if(tg)R.pend.push({t:R.t+.6,f:()=>{if(rtAlive(tg)){rtHurt(R,tg,K.pistol*(tg.hero?tg.def*.6:tg.kf*(tg.kind?RT_U[tg.kind].def:1)),h,'competence','front',0);if(!tg.hero){tg.m-=5;rtCause(R,tg,'compétence −5');}}}});}
  else if(Q.k==='eclair'){for(let k=0;k<3;k++){const a=k*2.09+R.rnd(),r=Q.r*.55,ix=x+Math.cos(a)*r,iy=y+Math.sin(a)*r,t0=R.t+.45+k*.1;R.fx.push({k:'foudre',p:[ix,iy,M.z(ix,iy)],t0,t1:t0+.45});}
    R.fx.push({k:'nuage',p:[x,y,M.z(x,y)+3.2],t0:R.t+.1,t1:R.t+1.1});R.fx.push({k:'secousse',t0:R.t+.5,t1:R.t+.85});
    R.pend.push({t:R.t+.5,f:()=>rtZone(R,h,(px,py)=>Math.hypot(px-x,py-y)<=Q.r,K.eclair,K.zoneCmd)});}
  else if(Q.k==='lave'){const L=Q.rng,inC=(px,py)=>{const dx=px-h.cx,dy=py-h.cy,dd=Math.hypot(dx,dy);if(dd>L||dd<.2)return false;return Math.cos(Math.atan2(dy,dx)-face)>=.85;};
    for(let k=1;k<=8;k++)for(const o of [-.38,0,.38]){const px=h.cx+Math.cos(face+o*k/8)*L*k/8,py=h.cy+Math.sin(face+o*k/8)*L*k/8,t0=R.t+.45+k*.05;R.fx.push({k:'magma',p:[px,py,M.z(px,py)+.2],t0,t1:t0+1.2});}
    R.fx.push({k:'secousse',t0:R.t+.6,t1:R.t+1.1});
    R.pend.push({t:R.t+.6,f:()=>{rtZone(R,h,inC,K.lave,K.zoneCmd);for(const r of M.T)for(const c of r)if(M.pass(c)&&inC(c.x,c.y)){c.lave=R.t+12;c.hzSd=h.sd;}}});}
  rtLog(R,h.hero+' : '+Q.n+'.');return true;}
/* dégâts de zone : par figurine ennemie touchée (× soldats par figurine) ; un commandant touché perd des points fixes */
function rtZone(R,h,inZ,pts,hpts){for(const e of R.G){if(e.sd===h.sd||!rtAlive(e))continue;
  if(e.hero){if(inZ(e.cx,e.cy))rtHurt(R,e,hpts*e.def,h,'zone','front',0);continue;}
  const c=rtSolV(e).filter(s=>inZ(s.x,s.y)).length;if(!c)continue;let P=pts*c*e.kf*RT_U[e.kind].def*(e.form==='disperse'?RT.K.disp:1);rtHurt(R,e,P,h,'zone','front',0);e.m-=5;rtCause(R,e,'compétence −5');}}
/* meilleure cible d'une compétence pour l'IA : le plus de figurines ennemies dans la zone (les commandants comptent pour 4) */
function rtSkillBest(R,h){const Q=RT_H[h.hero].q,foes=R.G.filter(e=>e.sd!==h.sd&&rtAlive(e)),pts=[];for(const e of foes)for(const s of rtSolV(e))pts.push([s,e.hero?4:1,e]);
  if(Q.k==='hdr'){let v=0;for(const [p,w,e] of pts)if(!e.hero&&!RT_U[e.kind].hdr&&Math.hypot(p.x-h.cx,p.y-h.cy)<=Q.r)v+=w;return {v:v*.8,x:h.cx,y:h.cy};}
  let best=null;for(const [p,,e0] of pts){const d=Math.hypot(p.x-h.cx,p.y-h.cy);if(d>Q.rng+(Q.k==='pistol'?1:0)||d<.3)continue;let v=0;
    if(Q.k==='boulets'||Q.k==='eclair'){for(const [q,w] of pts)if(Math.hypot(q.x-p.x,q.y-p.y)<=Q.r+.5)v+=w;}
    else if(Q.k==='pistol'){v=e0.hero?6:Math.min(6,rtSolV(e0).length);}
    else{const ux=(p.x-h.cx)/d,uy=(p.y-h.cy)/d;for(const [q,w] of pts){const a=(q.x-h.cx)*ux+(q.y-h.cy)*uy,b=-(q.x-h.cx)*uy+(q.y-h.cy)*ux;
      if(Q.k==='hiken'){if(a>=0&&a<=Q.rng&&Math.abs(b)<=Q.w/2)v+=w;}else{const dd=Math.hypot(a,b);if(dd<=Q.rng&&a/Math.max(dd,.01)>=.85)v+=w;}}}
    if(!best||v>best.v)best={v,x:p.x,y:p.y};}return best;}
/* Justice absolue : un groupe Marine à 6 u d'Akainu ne fuit pas (pertes +10 %) */
const rtJustice=(R,g)=>!g.hero&&R.G.some(q=>q.hero&&RT_H[q.hero].justice&&q.sd===g.sd&&rtAlive(q)&&rtD(q,g)<=6);

/* ---------- intelligence de bataille (camp adverse, et les deux camps en résolution automatique) ---------- */
function rtAI(R,sd){
  const mine=R.G.filter(g=>g.sd===sd&&rtAlive(g)),foes=R.G.filter(g=>g.sd!==sd&&rtAlive(g)&&g.state!=='deroute');if(!foes.length)return;
  const att=sd===0,O=R.obj,dO=e=>Math.hypot(e.cx-O.x,e.cy-O.y),troops=foes.filter(f=>!f.hero),near=(g,L)=>L.slice().sort((a,b)=>rtD(g,a)-rtD(g,b))[0];
  if(att){const P=R.plan||(R.plan={ph:'approche',t0:R.t,st:{},ft:null}),my=mine.filter(q=>!q.hero&&q.state!=='deroute');
    if(my.length&&troops.length){let cx=0,cy=0;for(const q of my){cx+=q.cx;cy+=q.cy;}cx/=my.length;cy/=my.length;const c={cx,cy};
      P.ft=troops.slice().sort((a,b)=>rtD(c,a)-rtD(c,b))[0];
      if(P.ph==='approche'){const ft=P.ft,d=Math.hypot(cx-ft.cx,cy-ft.cy)||1,ux=(cx-ft.cx)/d,uy=(cy-ft.cy)/d,L=my.slice().sort((a,b)=>((a.cx-cx)*-uy+(a.cy-cy)*ux)-((b.cx-cx)*-uy+(b.cy-cy)*ux));
        L.forEach((q,k)=>{const off=(k-(L.length-1)/2)*3,x=ft.cx+ux*8.5-uy*off,y=ft.cy+uy*8.5+ux*off,c2=R.M.ok(x,y)?{x,y}:R.M.near(x,y);P.st[q.id]=[c2.x,c2.y];});
        const ready=L.every(q=>Math.hypot(q.ax-P.st[q.id][0],q.ay-P.st[q.id][1])<1.6&&!(q.path&&q.pi<q.path.length));
        if(ready||R.t-P.t0>14||my.some(q=>rtContacts(R,q).length||R.t-q.lastCombat<1)||d<9){P.ph='assaut';}}}}
  for(const g of mine){if(g.state==='deroute'||(g.q[0]&&g.q[0].k==='retraite'))continue;
    if(g.sd===R.side&&g.ctrl==='manuel'&&!R.toutAuto)continue;
    if(g.hero){if(rtSkillOk(R,g)&&(g.sd!==R.side||RT.skillAuto||R.toutAuto)){const b=rtSkillBest(R,g);if(b&&b.v>=5){rtCast(R,g,b.x,b.y);continue;}}
      const f=near(g,foes.filter(f=>rtD(g,f)<6));if(f){rtSet(R,g,{k:'attaque',id:f.id});continue;}
      const mates=mine.filter(q=>!q.hero);if(att&&mates.length){const m=near(g,mates.filter(q=>dO(q)<dO(g)+1))||near(g,mates);if(m&&rtD(g,m)>3)rtSet(R,g,{k:'avancer',x:m.cx,y:m.cy});else if(!g.q.length)rtSet(R,g,{k:'avancer',x:O.x,y:O.y});}
      else if(!att&&Math.hypot(g.ax-g.post[0],g.ay-g.post[1])>2)rtSet(R,g,{k:'aller',x:g.post[0],y:g.post[1]});
      continue;}
    const U=RT_U[g.kind];
    const presse=R.t>RT.TMAX*.45;   /* l'attaque doit conclure avant la fin du temps : elle presse sur l'objectif */
    if(att){const P=R.plan;
      if(U.rng){const e=near(g,troops.filter(f=>rtRange(R,g,f)));if(e){rtSet(R,g,{k:'attaque',id:e.id});continue;}
        if(P.ph==='approche'&&P.st[g.id]){rtSet(R,g,{k:'aller',x:P.st[g.id][0],y:P.st[g.id][1]});continue;}
        const tg=near(g,troops);if(tg)rtSet(R,g,{k:'avancer',x:tg.cx,y:tg.cy});continue;}
      if(rtContacts(R,g).length)continue;
      /* approche groupée : chacun gagne sa place sur une ligne à 6 u de la défense, puis assaut ensemble */
      if(P.ph==='approche'&&P.st[g.id]){rtSet(R,g,{k:'aller',x:P.st[g.id][0],y:P.st[g.id][1]});continue;}
      if(presse){const onO=troops.filter(f=>dO(f)<=RT.OBJR+1.5),tg=near(g,onO);if(tg)rtSet(R,g,{k:'attaque',id:tg.id});else rtSet(R,g,{k:'avancer',x:O.x,y:O.y});continue;}
      /* assaut : tous sur la même cible (la plus proche du centre de l'attaque), les unités d'assaut d'abord sur les tireurs */
      let tg=null;if(U.charge)tg=near(g,troops.filter(f=>RT_U[f.kind].rng));
      if(!tg&&P.ft&&rtAlive(P.ft)&&P.ft.state!=='deroute')tg=P.ft;if(!tg)tg=near(g,troops);
      if(tg)rtSet(R,g,{k:'attaque',id:tg.id});else rtSet(R,g,{k:'avancer',x:O.x,y:O.y});continue;}
    else{const thr=foes.filter(f=>dO(f)<=9||Math.hypot(f.cx-g.post[0],f.cy-g.post[1])<=5);
      if(U.rng){if(!thr.some(f=>rtRange(R,g,f))&&Math.hypot(g.ax-g.post[0],g.ay-g.post[1])>1.5)rtSet(R,g,{k:'aller',x:g.post[0],y:g.post[1]});else if(!g.q.length)rtSet(R,g,{k:'tenir'});}
      else{const busy=foes.filter(f=>!rtContacts(R,g).length&&rtD(g,f)<=9&&R.G.some(q=>q.sd===sd&&q!==g&&rtInContact(R,q,f))),
          cl=busy.length?busy:foes.filter(f=>rtD(g,f)<=g.rad+f.rad+2.5||dO(f)<=RT.OBJR),f=near(g,cl.filter(f=>!f.hero).length?cl.filter(f=>!f.hero):cl);if(f&&g.state==='ferme')rtSet(R,g,{k:'attaque',id:f.id});
        else if(Math.hypot(g.ax-g.post[0],g.ay-g.post[1])>1.5)rtSet(R,g,{k:'aller',x:g.post[0],y:g.post[1]});else if(!g.q.length)rtSet(R,g,{k:'tenir'});}}}
}


/* ---------- un pas de simulation ---------- */
function rtStep(R){
  const dt=RT.DT;R.t+=dt;RT.cur=R;
  for(let i=R.pend.length-1;i>=0;i--)if(R.pend[i].t<=R.t){const p=R.pend.splice(i,1)[0];p.f();}
  R.fx=R.fx.filter(f=>f.t1>=R.t-.05);R.evts=R.evts.filter(e=>R.t-e.t<1.4);
  for(const sd of [0,1])if(R.aiOn[sd]&&(R.ai[sd]-=dt)<=0){R.ai[sd]=.5;rtAI(R,sd);}
  rtContactMap(R);
  for(const g of R.G){if(!rtAlive(g))continue;if(g.hero){g.qcd=Math.max(0,g.qcd-dt);if(g.cast&&R.t-g.cast.t>1.3)g.cast=null;if(g.cast){g.fight=null;continue;}}rtThink(R,g);}
  for(const g of R.G){if(g.ctrl!=='manuel')continue;const o=g.q[0];if(!o&&!g.fight){g.idleT=(g.idleT||0)+dt;if(g.idleT>3){g.ctrl='auto';g.idleT=0;}}else g.idleT=0;}
  for(const g of R.G)if(rtAlive(g))rtAnchor(R,g,dt);
  rtSoldiers(R,dt);rtContactMap(R);rtMeleeAnim(R);
  for(const g of R.G){if(!rtAlive(g)||!g.fight||!rtAlive(g.fight)){if(g.cd<.4)g.cd=.4;continue;}
    const ok=rtInContact(R,g,g.fight)||rtRange(R,g,g.fight);if(!ok)continue;g.cd-=dt;if(g.cd<=0){rtStrike(R,g,g.fight);g.cd=rtUnit(g).cd*(.9+.2*R.rnd());}}
  /* feu au sol : dégâts par seconde aux soldats qui s'y tiennent */
  for(const g of R.G){if(!rtAlive(g)||g.hero)continue;let c=0;for(const s of rtSolV(g)){const t=R.M.tile(s.x,s.y);if(t&&(t.feu>R.t||t.lave>R.t)&&t.hzSd!==g.sd)c++;}if(c)rtHurt(R,g,RT.K.feu*c*g.kf*RT_U[g.kind].def*dt,null,'feu','front',0);}
  for(const g of R.G)rtMoral(R,g,dt);
  /* sortie du terrain : en déroute ou en retraite, un groupe arrivé au bord quitte la bataille (ses soldats survivent) */
  for(const g of R.G){if(!rtAlive(g))continue;const fl=g.state==='deroute'||(g.q[0]&&g.q[0].k==='retraite');if(!fl)continue;const [fi]=R.M.ij(g.cx,g.cy);
    /* sortie atteinte, ou plus de progrès vers elle depuis 3 s (bord infranchissable : plage, falaise) */
    const dEx=g.exit?Math.hypot(g.cx-g.exit[0],g.cy-g.exit[1]):99;if(g.bestEx===undefined||dEx<g.bestEx-.15){g.bestEx=dEx;g.exT=R.t;}const bout=dEx<1.6||R.t-g.exT>3;
    if((g.sd===0&&fi>=R.M.W-1.4)||(g.sd===1&&fi<=.4)||bout){g.out=true;g.sorti=true;for(const s of g.sol)s.dead=true;rtLog(R,(g.hero||RT_U[g.kind].n)+' ('+rtCampN(g.sd)+') quittent le terrain.');}}
  /* un commandant sans troupes se retire */
  for(const g of R.G)if(g.hero&&rtAlive(g)&&!R.G.some(q=>q.sd===g.sd&&!q.hero&&rtAlive(q))){g.out=true;g.sorti=true;g.sol[0].dead=true;g.sol[0].dieT=R.t;}
  rtFin(R);
}
/* ---------- conditions de fin ---------- */
function rtFin(R){if(R.end)return;
  const live=sd=>R.G.filter(g=>g.sd===sd&&!g.hero&&rtAlive(g)&&g.state!=='deroute'&&!(g.q[0]&&g.q[0].k==='retraite'));
  const A=live(0),D=live(1),O=R.obj,inO=g=>Math.hypot(g.cx-O.x,g.cy-O.y)<=RT.OBJR;
  if(!D.length)return rtEnd(R,0,'La défense ('+R.names[1]+') est éliminée ou en fuite.');
  if(!A.length)return rtEnd(R,1,'L\'attaque ('+R.names[0]+') est repoussée.');
  const a=A.some(inO),d=D.some(inO);R.contest=a&&d;if(a&&!d)R.hold+=RT.DT;else if(!a)R.hold=Math.max(0,R.hold-RT.DT*2);
  if(R.hold>=RT.HOLD)return rtEnd(R,0,R.names[0]+' tient l\'objectif 60 s.');
  /* l'attaque n'a plus que des troupes de tir : elle ne peut plus prendre l'île */
  if(A.every(g=>RT_U[g.kind].rng)&&D.some(g=>!RT_U[g.kind].rng))return rtEnd(R,1,'L\'attaque ('+R.names[0]+') n\'a plus de troupes de mêlée en état de combattre.');
  if(R.t>=RT.TMAX)return rtEnd(R,1,'Temps écoulé : la défense tient.');
  for(const sd of [0,1]){const L=sd?D:A;let n=0,m=0;for(const g of L){n+=g.n;m+=g.m*g.n;}const avg=n?m/n:0;R.sur[sd]=avg<15?R.sur[sd]+RT.DT:0;
    if(R.sur[sd]>=10)return rtEnd(R,1-sd,R.names[sd]+' : reddition (moral moyen sous 15 pendant 10 s).');}
}
function rtEnd(R,w,why){R.end={w,why,t:R.t};R.paused=true;for(const g of R.G)if(g.sd===w&&rtAlive(g))for(const s of rtSolV(g)){s.an='cri';s.at=R.t+R.rnd()*.4;}rtLog(R,why);}

/* ---------- résolution sans affichage (essais d'équilibre, « terminer en auto ») ---------- */
function rtRunAuto(R,lim){R.aiOn=[true,true];R.toutAuto=true;R.deploy=false;let k=0;const n=Math.ceil((lim||RT.TMAX+5)/RT.DT);while(!R.end&&k++<n)rtStep(R);return R;}
RT.sim=function(n,opt){opt=opt||{};const K0=Object.assign({},RT.K),C0=RT.comp;if(opt.K)Object.assign(RT.K,opt.K);if(opt.comp)RT.comp=opt.comp;
  const o={n,w0:0,w1:0,t:0,pourquoi:{},s0:0,s1:0,coups:0,ms:0};const t0=performance.now();
  for(let k=0;k<n;k++){const R=rtNew({seed:(opt.seed||1000)+k,comp:opt.comp,ai:[true,true]});if(!R)return null;rtRunAuto(R);
    o['w'+R.end.w]++;o.t+=R.end.t;o.pourquoi[R.end.why]=(o.pourquoi[R.end.why]||0)+1;o.coups+=R.stats.coups;
    for(const sd of [0,1]){const L=R.G.filter(g=>g.sd===sd&&!g.hero);o['s'+sd]+=L.reduce((a,g)=>a+g.n,0)/L.reduce((a,g)=>a+g.n0,0);}}
  RT.K=K0;RT.comp=C0;o.t=+(o.t/n).toFixed(1);o.s0=+(o.s0/n).toFixed(2);o.s1=+(o.s1/n).toFixed(2);o.coups=Math.round(o.coups/n);o.ms=Math.round((performance.now()-t0)/n);return o;};
/* comparaison avec le calcul automatique (essais) : mêmes armées, sans commandants, sur Alabasta ; l'île et ses troupes sont rendues ensuite */
RT.compare=function(n,opt){opt=opt||{};const t=terrs.find(q=>q.name==='Alabasta');if(!t)return null;const f=terrs[(t.nb||[])[0]];
  const pm=players.findIndex(p=>p.alive&&rtFac(p.id)==='marine'),pp=players.findIndex((p,i)=>p.alive&&i!==pm&&rtFac(p.id)==='pirate');if(pm<0||pp<0)return null;
  const o0=t.owner,u0=t.u,K0=Object.assign({},RT.K);if(opt.K)Object.assign(RT.K,opt.K);let rs=opt.seed||7;const rnd=()=>{rs=(rs*1664525+1013904223)>>>0;return rs/4294967296;};
  const ri=(a,b)=>a+Math.floor(rnd()*(b-a+1)),o={n,accord:0,autoA:0,rtA:0,survAuto:0,survRt:0,t:0,ecarts:[]};
  try{for(let k=0;k<n;k++){
    const uA={guerrier:ri(6,22),lancier:ri(0,10),archer:0,cavalier:ri(0,6),catapulte:ri(0,3),elite:0},uD={guerrier:ri(6,22),lancier:0,archer:ri(0,10),cavalier:0,catapulte:0,elite:ri(0,3)};
    t.owner=pp;t.u=Object.assign({},uD);const A=attTotal(pm,uA,t,false,f.id,null,0),D=defTotal(t,uA,false,null),aw=A>D,sa=aw?(A-D)/A:(D-A)/D;
    const sp={t,f,stance:0,camps:[{pid:pm,fac:'marine',name:'Marine',u:uA,heroes:[]},{pid:pp,fac:'pirate',name:'Pirates',u:uD,heroes:[]}]};
    const R=rtNew({spec:sp,seed:1000+k,ai:[true,true]});if(!R)return null;
    if(opt.trace===k){R.aiOn=[true,true];R.deploy=false;const L=[];let q=0;while(!R.end&&q++<5000){rtStep(R);if(q%300===0)L.push(R.t.toFixed(0)+' h'+R.hold.toFixed(0)+' '+R.G.map(g=>(g.sd?'D':'A')+(g.hero||g.kind.slice(0,3))+':'+g.n.toFixed(1)+':'+g.state[0]+':'+(g.q[0]?g.q[0].k[0]+(g.q[0].id!==undefined?g.q[0].id:''):'-')+(g.fight?'>'+g.fight.id:'')+(g.state[0]==='d'?'['+g.state+' '+(g.bestEx===undefined?'u':g.bestEx.toFixed(1))+' '+(g.exT||0).toFixed(0)+(g.exit?' e':'')+(g.out?' O':'')+']':'')+'@'+R.M.ij(g.cx,g.cy).map(v=>v.toFixed(0)).join(',')).join(' '));}
      return {A,D,uA,uD,L,end:R.end,obj:[R.obj.i,R.obj.j]};}
    rtRunAuto(R);const res=rtResult(R),rw=res.win;
    const sr=rw?sumU(res.uA)/sumU(uA):sumU(res.uD)/sumU(uD);
    o.autoA+=aw;o.rtA+=rw;if(aw!==rw){const w=R.end.why.replace(/\(.*?\)/g,'');(o.pq||(o.pq={}))[w]=((o.pq||{})[w]||0)+1;}o.accord+=aw===rw;o.survAuto+=sa;o.survRt+=sr;o.t+=R.end.t;if(aw!==rw&&o.ecarts.length<6)o.ecarts.push({A:Math.round(A),D:Math.round(D),rt:rw?'attaque':'défense'});}}
  finally{t.owner=o0;t.u=u0;RT.K=K0;}
  for(const k of ['accord','autoA','rtA'])o[k]=+(o[k]/n).toFixed(2);o.survAuto=+(o.survAuto/n).toFixed(2);o.survRt=+(o.survRt/n).toFixed(2);o.t=+(o.t/n).toFixed(0);return o;};
/* empreinte de l'état (essai « la pause arrête la simulation ») */
RT.hash=function(R){R=R||RT.run;if(!R)return '';const a=[R.t.toFixed(3),R.hold.toFixed(3)];for(const g of R.G){a.push(g.n.toFixed(4),(g.hp||0).toFixed(4),g.m.toFixed(4),g.cd.toFixed(4),(g.qcd||0).toFixed(3),g.ax.toFixed(4),g.ay.toFixed(4));for(const s of g.sol)a.push(s.x.toFixed(4),s.y.toFixed(4),s.an||'',s.dead?1:0);}return a.join(',');};

/* ============================== affichage ============================== */
const RT_COL={moi:[.29,.56,.88],eux:[.88,.28,.31],sel:[1,.85,.35],obj:[1,.78,.25],cov:[.35,.75,.35],haut:[1,1,.8],feu:[1,.45,.1],etroit:[.95,.95,1]};
const rtAnDur=(g,an)=>an==='attaque'?tacAnDur(g.asset,'attaque')+.08:an==='preparation'?.45:an==='reaction'?.42:an==='cri'?99:.4;
/* fin des actions (dans la simulation, pas dans l'affichage : l'état figé en pause ne bouge pas) */
function rtAnims(R){for(const g of R.G)for(const s of g.sol)if(s.an&&s.an!=='cri'&&!s.dead&&R.t-s.at>rtAnDur(g,s.an))s.an=null;}
function rtFigs(R,c){
  const rT=R.rT,al0=R.alpha;
  for(const g of R.G){if(g.sorti)continue;const col=g.sd===R.side?'#4a8fe0':'#e0484f';
    for(const s of g.sol){if(s.dead&&rT>s.dieT+1.3)continue;
      let x=s.px+(s.x-s.px)*al0,y=s.py+(s.y-s.py)*al0;const z0=R.M.z(x,y);let an='garde',t=rT+s.ph*3,al=1,z=z0,flash=0,bob=0;
      if(R.end&&!s.dead&&rtAlive(g)&&g.state!=='deroute'){const te=(performance.now()-(R.endW||performance.now()))/1000;
        /* fin : les vainqueurs crient et sautent (pose « cri » de la planche), les vaincus s'accroupissent ou s'effondrent (poses de la planche) */
        if(g.sd===R.end.w){an='cri';t=0;bob=Math.max(0,Math.sin(te*5.2+s.ph*9))*.2*Math.min(1,te*2);}else{an='@accroupi_1|fatigue_1|accroupi_2|chute';t=0;}}
      else if(s.dead&&rT>=s.dieT){const u=Math.min(1,(rT-s.dieT)/1.3),kb=Math.min(1,(rT-s.dieT)/.25)*.22;an='reaction';t=99;al=u<.55?1:1-(u-.55)/.45;z=z0-Math.max(0,u-.55)*.25;
        x-=Math.cos(s.face)*kb;y-=Math.sin(s.face)*kb;}
      else if(s.an&&rT>=s.at){an=s.an;t=rT-s.at;if(s.an==='cri')bob=Math.abs(Math.sin(rT*4.2+s.ph*6))*.12;
        if(s.an==='attaque'&&!g.hero){const u=Math.min(1,t/.25);x+=Math.cos(s.face)*.07*Math.sin(Math.PI*u);y+=Math.sin(s.face)*.07*Math.sin(Math.PI*u);}}
      else if(s.mv){an='deplacement';t=s.walk||0;bob=Math.abs(Math.sin((s.walk||0)*4.4+s.ph*3))*.06;}
      if(rT>=s.hitT&&rT-s.hitT<.18)flash=.35*(1-(rT-s.hitT)/.18);
      /* regard : retournement seulement au-delà d'un seuil (pas de clignotement face caméra) */
      const dot=Math.cos(s.face)*c.r[0]+Math.sin(s.face)*c.r[1];if(dot<-.18)s.fl=true;else if(dot>.18)s.fl=false;else if(s.fl===undefined)s.fl=dot<0;
      trpPush({asset:g.asset,x,y,z:z+bob,anim:an,t,flip:s.fl,al,own:s.dead?undefined:col,hs:g.hero?RT.hsCmd:RT.hs,cmd:!!g.hero,flash,ph:s.ph});}}
}
function rtTiles(R){
  const M=R.M,L=[],h=M.S*.48,u=M.U,C=RT_COL,rT=R.rT,T=(x,y,z,st,col,a,sz)=>L.push([x,y,z,(sz||1)*h,u[0],u[1],st,col[0],col[1],col[2],a]);
  const lit=R.paused||(R.camP&&R.camP.D<16);
  for(const r of M.T)for(const c of r){if(c.feu>rT){T(c.x,c.y,c.z,0,C.feu,.42+.08*Math.sin(rT*9+c.i));continue;}if(c.lave>rT){T(c.x,c.y,c.z,0,[.75,.12,.02],.36+.06*Math.sin(rT*5+c.j));continue;}if(!M.pass(c))continue;
    if(c.k==='couvert')T(c.x,c.y,c.z,0,C.cov,lit?.16:.09);if(c.haut)T(c.x,c.y,c.z,2,C.haut,lit?.34:.18,.85);if(c.etroit&&lit)T(c.x,c.y,c.z,1,C.etroit,.5,.22);}
  const O=R.obj,ring=(x,y,r,col,a,sz,n)=>{n=n||Math.max(12,Math.round(r*7));for(let k=0;k<n;k++){const an=k/n*6.283,px=x+Math.cos(an)*r,py=y+Math.sin(an)*r;T(px,py,M.z(px,py),1,col,a,sz);}};
  ring(O.x,O.y,RT.OBJR,C.obj,.85,.13,30);T(O.x,O.y,O.z,0,C.obj,.3+.15*Math.min(1,R.hold/RT.HOLD));
  const me=R.G.filter(g=>R.sel.includes(g.id)&&rtAlive(g));
  for(const g of me){for(const s of rtSolV(g))T(s.x,s.y,s.z,2,C.sel,.9,.26);
    /* file d'ordres : trajet en pointillé, cibles entourées */
    let px=g.ax,py=g.ay;const dots=(x,y)=>{const d=Math.hypot(x-px,y-py),n=Math.floor(d/.7);for(let k=1;k<=n;k++){const qx=px+(x-px)*k/n,qy=py+(y-py)*k/n;T(qx,qy,M.z(qx,qy),1,C.moi,.85,.14);}px=x;py=y;};
    if(g.path&&g.pi<g.path.length)for(const p of g.path.slice(g.pi))dots(p[0],p[1]);
    g.q.forEach((o,k)=>{if(o.k==='attaque'){const e=R.G[o.id];if(rtAlive(e)){ring(e.cx,e.cy,e.rad+.2,C.eux,.9,.15);if(k>0)dots(e.cx,e.cy);}}else if(o.x!==undefined){if(k>0||!g.path)dots(o.x,o.y);T(o.x,o.y,M.z(o.x,o.y),2,o.k==='avancer'?C.eux:C.moi,.9,.5);}});
    const U=rtUnit(g);if(U.rng)ring(g.cx,g.cy,U.rng,C.moi,.45,.1);}
  /* compétence en visée : portée, puis zone sous le pointeur */
  if(R.mode==='q'&&R.mouse){const h=rtMyHero(R);if(h){const Q=RT_H[h.hero].q;if(Q.rng)ring(h.cx,h.cy,Q.rng,C.obj,.6,.12);
    let [x,y]=R.mouse;const d=Math.hypot(x-h.cx,y-h.cy);if(Q.rng&&d>Q.rng){x=h.cx+(x-h.cx)*Q.rng/d;y=h.cy+(y-h.cy)*Q.rng/d;}
    if(Q.k==='boulets'||Q.k==='eclair'){ring(x,y,Q.r,C.feu,.9,.2);}
    else if(Q.k==='pistol'){T(x,y,M.z(x,y),2,C.feu,.9,1.2);}
    else if(Q.k==='lave'){const fa=Math.atan2(y-h.cy,x-h.cx);for(let k=1;k<=8;k++)for(const o of [-.5,-.25,0,.25,.5]){const r=Q.rng*k/8,qx=h.cx+Math.cos(fa+o*.6)*r,qy=h.cy+Math.sin(fa+o*.6)*r;T(qx,qy,M.z(qx,qy),1,C.feu,.7,.18);}}
    else if(Q.k==='hiken'){const ux=(x-h.cx)/(d||1),uy=(y-h.cy)/(d||1);for(let k=1;k<=Math.round(Q.rng/.6);k++){const qx=h.cx+ux*k*.6,qy=h.cy+uy*k*.6;T(qx,qy,M.z(qx,qy),0,C.feu,.3,.55);}}}}
  /* ciblage d'une compétence lancée : la zone clignote jusqu'à l'impact */
  for(const g of R.G)if(g.cast&&rT-g.cast.t<1.1){const Q=RT_H[g.hero].q,a=.25+.2*Math.sin(rT*18);if(Q.k==='boulets'||Q.k==='eclair')ring(g.cast.x,g.cast.y,Q.r,C.feu,a+.3,.2);else if(Q.k==='hdr')ring(g.cx,g.cy,Q.r,[.7,.1,.2],a+.3,.2);}
  TRP.tiles=L;
}
function rtFx(R){
  const rT=R.rT,G=[],g=(p,r,core,col,a)=>G.push([p[0],p[1],p[2],r,core,col[0],col[1],col[2],a]);
  for(const f of R.fx){if(rT<f.t0||rT>f.t1||f.k==='secousse')continue;const u=(rT-f.t0)/(f.t1-f.t0);
    if(f.k==='boulet'){const p=[f.a[0]+(f.b[0]-f.a[0])*u,f.a[1]+(f.b[1]-f.a[1])*u,f.a[2]+(f.b[2]-f.a[2])*u+Math.sin(Math.PI*u)*2.4];g(p,.2,0,[.1,.09,.1],.95);g(p,.32,0,[.35,.3,.25],.25);}
    else if(f.k==='poussiere'){for(let q=0;q<5;q++){const a=q*1.26,r=.25+u*.9;g([f.p[0]+Math.cos(a)*r*.6,f.p[1]+Math.sin(a)*r*.6,f.p[2]+u*.35+q*.05],.35+u*.55,0,[.84,.75,.6],.55*(1-u));}g(f.p,.6*(1-u)+.2,1,[1,.85,.5],.6*(1-u));}
    else if(f.k==='feu'){const fl=.75+.25*Math.sin(rT*38+f.p[0]*3);for(let q=0;q<4;q++){const sw=Math.sin(rT*9+q*1.7)*.12;g([f.p[0]+sw,f.p[1]-sw,f.p[2]+q*.3+u*.5],(.7-q*.13)*(1-u*.45)*fl,.65,[1,.5-q*.09,.06],.9*(1-u*u));}}
    else if(f.k==='jet'){for(let q=2;q<=10;q++){const v=Math.min(u*1.15,1)*q/10,w=Math.sin(Math.PI*q/10);g([f.a[0]+(f.b[0]-f.a[0])*v,f.a[1]+(f.b[1]-f.a[1])*v,f.a[2]+(f.b[2]-f.a[2])*v+Math.sin(rT*30+q)*.05],.18+.28*w,.8,[1,.55,.1],.72*(1-u*.6));}}
    else if(f.k==='balle'){const p=[f.a[0]+(f.b[0]-f.a[0])*u,f.a[1]+(f.b[1]-f.a[1])*u,f.a[2]+(f.b[2]-f.a[2])*u];g(p,.08,1,[1,.9,.5],1);}
    else if(f.k==='eclair'){g(f.p,.25*(1-u)+.08,1,[1,.85,.4],1-u);}
    else if(f.k==='impact'){g(f.p,.1+u*.25,1,[1,.95,.75],.8*(1-u));}
    else if(f.k==='onde'){const r=.5+u*f.r,n=Math.round(10+r*5);for(let q=0;q<n;q++){const a=q/n*6.283;g([f.p[0]+Math.cos(a)*r,f.p[1]+Math.sin(a)*r,f.p[2]+.15],.35,.2,[.55,.05,.12],.7*(1-u));}g(f.p,.8*(1-u)+.3,.4,[.3,0,.05],.5*(1-u));}
    else if(f.k==='poing'){const v=u<.5?u*2:2-u*2,p=[f.a[0]+(f.b[0]-f.a[0])*v,f.a[1]+(f.b[1]-f.a[1])*v,f.a[2]+(f.b[2]-f.a[2])*v];for(let q=1;q<=6;q++){const w=v*q/6;g([f.a[0]+(f.b[0]-f.a[0])*w,f.a[1]+(f.b[1]-f.a[1])*w,f.a[2]+(f.b[2]-f.a[2])*w],.07,.4,[.95,.75,.55],.8);}g(p,.22,.6,[1,.85,.65],.95);}
    else if(f.k==='foudre'){const fl=u<.15?1:Math.max(0,1-(u-.15)/.85)*(.6+.4*Math.sin(rT*80));for(let q=0;q<9;q++){const zz=f.p[2]+q*.4,j=Math.sin(q*2.3+f.t0*9)*.18;g([f.p[0]+j,f.p[1]-j,zz],.12,1,[.85,.9,1],fl);}g([f.p[0],f.p[1],f.p[2]+.15],.6,1,[.8,.85,1],fl*.8);}
    else if(f.k==='nuage'){for(let q=0;q<5;q++){const a=q*1.26;g([f.p[0]+Math.cos(a)*.9,f.p[1]+Math.sin(a)*.9,f.p[2]],.9,0,[.25,.27,.33],.55*Math.sin(Math.PI*u));}}
    else if(f.k==='magma'){for(let q=0;q<3;q++){const sw=Math.sin(rT*7+q*1.9)*.1;g([f.p[0]+sw,f.p[1]-sw,f.p[2]+q*.25+u*.3],(.45-q*.1)*(1-u*.4),.55,[1,.25-q*.05,.03],.85*(1-u*u));}}}
  /* poussière soulevée par la course, halo doré sous les commandants */
  let nd=0;for(const q of R.G){if(q.out)continue;for(const so of q.sol){if(so.dead)continue;const x=so.px+(so.x-so.px)*R.alpha,y=so.py+(so.y-so.py)*R.alpha,z=R.M.z(x,y);
    if(q.hero)g([x,y,z+.06],.55+.05*Math.sin(rT*3),.15,q.sd===R.side?[1,.8,.2]:[1,.3,.2],.32);
    else if(so.mv&&nd<60){nd++;const ph=Math.abs(Math.sin((so.walk||0)*4.4+so.ph*3));g([x-Math.cos(so.face)*.18,y-Math.sin(so.face)*.18,z+.08],.16+.1*(1-ph),0,[.82,.7,.5],.28*(1-ph));}}}
  /* le couvert en feu */
  for(const r of R.M.T)for(const c of r){if(c.feu>rT){const fl=.7+.3*Math.sin(rT*31+c.i*7+c.j*3);g([c.x,c.y,c.z+.35],.45*fl,.6,[1,.5,.08],.55);}if(c.lave>rT){const fl=.7+.3*Math.sin(rT*7+c.i*5+c.j*3);g([c.x,c.y,c.z+.12],.5*fl,.5,[1,.28,.04],.45);}}
  TRP.glow=G;
}
function rtLabels(R){
  const box=document.getElementById('rt-lab');if(!box||!R.cam)return;const cv=W3.cv,rc=cv.getBoundingClientRect(),k=rc.width/cv.width,rT=R.rT;let h='';
  const ic={ebranle:'⚠',desorg:'✖',deroute:'⤺'};
  for(const g of R.G){if(!rtAlive(g))continue;let ix=0,iy=0,nn=0;for(const q of g.sol)if(!q.dead){ix+=q.px+(q.x-q.px)*R.alpha;iy+=q.py+(q.y-q.py)*R.alpha;nn++;}if(nn){ix/=nn;iy/=nn;}else{ix=g.cx;iy=g.cy;}   /* étiquette au centre affiché (interpolé), pas au centre du dernier pas */
    const p=w3Proj(ix,iy,R.M.z(ix,iy)+(g.hero?RT.hsCmd:RT.hs)*.66,R.cam);if(!p||p.sx<0||p.sy<0||p.sx>cv.width||p.sy>cv.height)continue;
    const me=g.sd===R.side,U=rtUnit(g);let t;
    if(g.hero)t=esc(g.hero)+'<i class="rt-hp"><b style="width:'+Math.round(100*g.hp/g.hp0)+'%"></b></i>';
    else t=U.ic+' '+Math.ceil(g.n-1e-6)+(ic[g.state]?' '+ic[g.state]:'')+'<i class="rt-mb"><b style="width:'+Math.round(g.m)+'%" class="'+(g.m<30?'bas':g.m<60?'moy':'')+'"></b></i>';
    h+='<div class="rt-tag'+(me?' moi':' eux')+(R.sel.includes(g.id)?' sel':'')+'" style="left:'+(rc.left+p.sx*k)+'px;top:'+(rc.top+p.sy*k)+'px">'+t+'</div>';
    if(R.sel.includes(g.id))g.q.forEach((o,n)=>{if(g.q.length<2&&n===0)return;const x=o.x!==undefined?o.x:(R.G[o.id]||{}).cx,y=o.x!==undefined?o.y:(R.G[o.id]||{}).cy;if(x===undefined)return;
      const q=w3Proj(x,y,R.M.z(x,y)+.3,R.cam);if(q)h+='<div class="rt-step" style="left:'+(rc.left+q.sx*k)+'px;top:'+(rc.top+q.sy*k)+'px">'+(n+1)+'</div>';});}
  for(const e of R.evts){if(e.kill){const u=rT-e.t;if(u<0||u>.9)continue;const p=w3Proj(e.x,e.y,R.M.z(e.x,e.y)+RT.hs*.75,R.cam);if(!p)continue;h+='<div class="rt-num'+(e.g.sd===R.side?' moi':'')+'" style="left:'+(rc.left+p.sx*k)+'px;top:'+(rc.top+p.sy*k-u*22)+'px;opacity:'+Math.min(1,(.9-u)*3)+';font-size:13px">−'+e.kill+'</div>';continue;}
    if(!e.g.hero||e.v<.3)continue;const u=rT-e.t;if(u<0||u>1.1)continue;const p=w3Proj(e.g.cx,e.g.cy,R.M.z(e.g.cx,e.g.cy)+RT.hsCmd*.9,R.cam);if(!p)continue;
    h+='<div class="rt-num'+(e.g.sd===R.side?' moi':'')+'" style="left:'+(rc.left+p.sx*k)+'px;top:'+(rc.top+p.sy*k-u*24)+'px;opacity:'+Math.min(1,(1.1-u)*2.5)+'">−'+e.v.toFixed(1)+'</div>';}
  box.innerHTML=h;
}
/* minicarte tactique : relief, couvert, objectif, groupes, cadre de la caméra */
function rtMiniXY(R,fi,fj){const c=document.getElementById('rt-mini');if(!c)return [0,0];const M=R.M,sx=c.width/M.H,sy=c.height/M.W;
  const a=R.mmI?M.W-1-fi:fi,b=R.mmJ?M.H-1-fj:fj;return [(b+.5)*sx,(a+.5)*sy];}
function rtMiniIJ(R,px,py){const c=document.getElementById('rt-mini'),M=R.M,sx=c.width/M.H,sy=c.height/M.W;let b=px/sx-.5,a=py/sy-.5;if(R.mmI)a=M.W-1-a;if(R.mmJ)b=M.H-1-b;return [a,b];}
function rtMini(R){const c=document.getElementById('rt-mini');if(!c)return;const x=c.getContext('2d'),M=R.M,sx=c.width/M.H,sy=c.height/M.W,rT=R.rT;
  x.clearRect(0,0,c.width,c.height);
  for(const r of M.T)for(const t of r){const [px,py]=rtMiniXY(R,t.i,t.j);x.fillStyle=t.lave>rT?'#a8240a':t.feu>rT?'#e8731c':t.k==='bloque'?'#3b3328':t.k==='eau'?'#35353c':t.k==='couvert'?'#5d7f45':t.haut?'#c9b58a':'#a99a72';x.fillRect(px-sx/2,py-sy/2,sx+.5,sy+.5);}
  const ij=(X,Y)=>{const [a,b]=M.ij(X,Y);return rtMiniXY(R,a,b);};
  let [ox,oy]=ij(R.obj.x,R.obj.y);x.strokeStyle='#f2c75c';x.lineWidth=1.5;x.beginPath();x.arc(ox,oy,RT.OBJR/M.S*sx,0,6.283);x.stroke();
  for(const g of R.G){if(!rtAlive(g))continue;const [px,py]=ij(g.cx,g.cy);x.fillStyle=g.sd===R.side?'#4a8fe0':'#e0484f';x.beginPath();x.arc(px,py,g.hero?3:2+Math.sqrt(g.n)*.9,0,6.283);x.fill();
    if(g.hero){x.strokeStyle='#fff';x.lineWidth=1;x.stroke();}if(R.sel.includes(g.id)){x.strokeStyle='#f8d77a';x.lineWidth=2;x.stroke();}}
  if(R.camP){const [cx,cy]=ij(R.camP.cx,R.camP.cy),w=Math.min(c.width,R.camP.D*.9/M.S*sx);x.strokeStyle='#ffffffb0';x.lineWidth=1;x.strokeRect(cx-w/2,cy-w*.35,w,w*.7);}}

/* ---------- caméra : flèches pour déplacer, Page↑ / Page↓ pour tourner, molette pour zoomer ---------- */
function rtCam(R){const C=R.camP;let sx=0,sy=0,sd=1,cx=C.cx,cy=C.cy,D=C.D,pitch=C.pitch;
  for(const f of R.fx)if(f.k==='secousse'&&R.rT>=f.t0&&R.rT<=f.t1){const u=(R.rT-f.t0)/(f.t1-f.t0),e=(1-u)*.22;sx+=Math.sin(u*31)*e;sy+=Math.cos(u*25)*e;sd-=.03*(1-u);}
  /* mise en scène d'une compétence : la vue (seulement l'affichage) se rapproche du commandant puis revient ; un glisser l'annule */
  const ci=R.cin;if(ci){const u=(performance.now()-ci.w)/1000;if(u>=1.7||(R.drag&&R.drag.pan))R.cin=null;else{const e=u<.35?u/.35:u>1.25?(1.7-u)/.45:1,k=e*e*(3-2*e);cx+=(ci.x-cx)*k*.8;cy+=(ci.y-cy)*k*.8;D+=(Math.max(6.5,D*.55)-D)*k;pitch+=(-.1)*k;}}
  /* le point visé est sur le sol de l'île, pas au niveau de la mer : sans cela les troupes sortent par le haut de l'écran (hauteur lissée) */
  const zg=R.M.z(C.cx,C.cy);R.zc=R.zc===undefined?zg:R.zc+(zg-R.zc)*.08;
  const cam=trpCamBuild({cx:cx+sx,cy:cy+sy,yaw:C.yaw,pitch,D:D*sd,near:Math.max(.15,D*.04),fogD:Math.max(D*1.8,45)});cam.eye[2]+=R.zc;return cam;}
{const wc0=w3Cam;w3Cam=function(cx,cy,yaw,pitch,D0){if(cx===undefined&&RT.run&&RT.run.camP)return RT.run.cam=rtCam(RT.run);return wc0(cx,cy,yaw,pitch,D0);};}
{const ps0=pxScene;pxScene=function(c,now,combat){return ps0(c,now,combat||!!RT.run);};}
{const ov0=w3Overlay;w3Overlay=function(c,now){if(RT.run)return;return ov0(c,now);};}
{const pf0=pxFlush;pxFlush=function(c,now,opt){const R=RT.run;if(R&&R.cam){try{rtFigs(R,c);rtTiles(R);rtFx(R);rtLabels(R);rtMini(R);}catch(e){console.warn('combat temps réel :',e);}}return pf0(c,now,opt);};}
/* le monde stratégique reste arrêté pendant la bataille : minuteur de plan et transitions comprises (ils tournent sinon à vitesse 0) ; pas de sauvegarde */


/* ---------- horloge : la simulation avance seulement hors pause ---------- */
let rtLast=0;
(function rtLoop(now){const R=RT.run,dt=Math.min(.1,Math.max(0,(now-(rtLast||now))/1000));rtLast=now;
  if(R){if(R.end&&!R.endW)R.endW=now;if(!R.paused&&!R.end){R.acc+=dt*R.spd*rtSlow(R,now);let k=0;while(R.acc>=RT.DT&&k<8){rtStep(R);rtAnims(R);R.acc-=RT.DT;k++;}if(k>=8)R.acc=0;}
    R.alpha=Math.min(1,R.acc/RT.DT);R.rT=Math.max(0,R.t-RT.DT*(1-R.alpha));
    if(R.camP&&RT.camAuto&&!R.end&&now-(R.camUser||0)>6000){const C=R.camP;let x=0,y=0,n=0,x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
      const act=R.G.filter(g=>rtAlive(g)&&(g.fight||g.moving));const L=act.length?act:R.G.filter(rtAlive);
      for(const g of L){x+=g.cx;y+=g.cy;n++;}if(n){x/=n;y/=n;for(const g of L){const dd=Math.hypot(g.cx-x,g.cy-y);x0=Math.min(x0,dd);x1=Math.max(x1,dd);}
        C.tx+=(x-C.tx)*.03;C.ty+=(y-C.ty)*.03;const want=Math.max(11,Math.min(30,x1*1.9+5));C.tD+=(want-C.tD)*.02;}}
    if(R.camP){const C=R.camP,kk=.15;C.cx+=(C.tx-C.cx)*kk;C.cy+=(C.ty-C.cy)*kk;C.yaw+=(C.tyaw-C.yaw)*kk;C.D+=(C.tD-C.D)*kk;
      const ks=RT.keys;if(ks.size){const st=C.D*.9*dt,hx=Math.sin(C.yaw),hy=-Math.cos(C.yaw),rx=Math.cos(C.yaw),ry=Math.sin(C.yaw);
        if(ks.has('ArrowUp')){C.tx+=hx*st;C.ty+=hy*st;}if(ks.has('ArrowDown')){C.tx-=hx*st;C.ty-=hy*st;}if(ks.has('ArrowLeft')){C.tx-=rx*st;C.ty-=ry*st;}if(ks.has('ArrowRight')){C.tx+=rx*st;C.ty+=ry*st;}
        if(ks.has('PageUp'))C.tyaw-=1.4*dt;if(ks.has('PageDown'))C.tyaw+=1.4*dt;R.camUser=now;}}
    if(now-(R.uiT||0)>200||R.uiDirty){R.uiT=now;R.uiDirty=false;rtUI(R);}
    {const it=document.getElementById('rt-intro');if(it){const u=(now-(R.intro||0))/2600;it.style.opacity=u<0||u>1?0:u<.15?u/.15:u>.7?(1-u)/.3:1;it.style.transform='translate(-50%,-50%) scale('+(1+Math.max(0,.15-u)*1.2)+')';}
     const fl=document.getElementById('rt-flash');if(fl){let a=0;for(const f of R.fx)if(f.k==='secousse'&&R.rT>=f.t0&&R.rT<f.t0+.25)a=Math.max(a,.35*(1-(R.rT-f.t0)/.25));fl.style.opacity=a;}}
    dirty=true;}
  requestAnimationFrame(rtLoop);})(0);
RT.keys=new Set();

/* ============================== interface ============================== */
const rtMine=R=>R.G.filter(g=>g.sd===R.side);
/* commandant courant : celui qui est choisi, sinon le premier en jeu */
const rtMyHero=R=>{const L=R.G.filter(g=>g.hero&&g.sd===R.side&&rtAlive(g));return L.find(g=>g.id===R.qh)||L.find(g=>R.sel.includes(g.id))||L[0]||null;};
const rtSelG=R=>R.sel.map(i=>R.G[i]).filter(g=>g&&rtAlive(g)&&g.sd===R.side);
const rtMS=t=>Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');
function rtOrdTxt(R,g){if(!rtAlive(g))return g.sorti?'sorti du terrain':g.blesse?'blessé':'hors de combat';if(g.state==='deroute')return 'en déroute';const o=g.q[0];
  const f=g.fight&&rtAlive(g.fight)?' · '+(rtUnit(g).rng&&!rtInContact(R,g,g.fight)?'tire':'combat'):'';
  const k=!o?'sans ordre':o.k==='aller'?'se déplace':o.k==='avancer'?'avance en combattant':o.k==='attaque'?'attaque '+(R.G[o.id]?(R.G[o.id].hero||RT_U[R.G[o.id].kind].n):''):o.k==='tenir'?'tient':o.k==='retraite'?'retraite':o.k;
  return k+(g.q.length>1?' (+'+(g.q.length-1)+')':'')+f;}
/* ---------- portraits : poses réelles des planches (aucune image inventée, jamais agrandie au-delà de la planche) ---------- */
const RT_IMG={},RT_POR={};
function rtAtlas(a){const D=TRP_DATA[a];if(!D)return null;let o=RT_IMG[a];if(!o){o=RT_IMG[a]={img:new Image(),ok:false};o.img.onload=()=>{o.ok=true;if(RT.run)RT.run.uiDirty=true;};o.img.src=D.atlas;}return o.ok?o.img:null;}
/* pose : noms d'images séparés par « | » (première présente), sinon première image de l'animation ; crop : part haute gardée (1 = tout) ; H : hauteur voulue en px CSS */
function rtPor(a,pose,crop,H){const dpr=Math.min(2,window.devicePixelRatio||1),k=a+'|'+pose+'|'+crop+'|'+H+'|'+dpr;if(RT_POR[k]!==undefined)return RT_POR[k];const im=rtAtlas(a);if(!im)return '';
  const D=TRP_DATA[a];let E=null;for(const p of pose.split('|')){if(D.img[p]){E=D.img[p];break;}const an=D.anim[p];if(an){E=D.img[an.i[an.i.length-1]];break;}}if(!E)E=D.img[D.anim.garde.i[0]];
  const [ax,ay,w,h]=E.a,hh=Math.max(8,Math.round(h*crop)),sc=Math.min(1,H*dpr/hh),c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*sc));c.height=Math.max(1,Math.round(hh*sc));
  const x=c.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(im,ax,ay,w,hh,0,0,c.width,c.height);return RT_POR[k]=c.toDataURL();}
const rtFacOf=(R,sd)=>R.spec&&R.spec.camps&&R.spec.camps[sd]?R.spec.camps[sd].fac:(sd===0?'marine':'pirate');
const RT_FAC={marine:{c:'#2f74c8',c2:'#164c8c',ic:'⚓',n:'Marine'},pirate:{c:'#d62828',c2:'#8e1414',ic:'☠',n:'Pirates'},revo:{c:'#2e8b57',c2:'#1d5c39',ic:'✊',n:'Révolutionnaires'}};
const RT_ORD=[['avancer','➤','Avancer','A','Puis clic droit : aller en engageant ce qui se présente'],['tenir','⛨','Tenir','T','Tenir la position (Maj : à la suite)'],['retraite','↩','Retraite','R','Le groupe se replie vers son bord'],['rendre','⟳','Auto','G','Le groupe repasse en automatique : l\'IA le mène']];
const RT_FIC={ligne:'▬',colonne:'▮',carre:'■',disperse:'⁘'};
/* « de » devant un nom d'île : du Pays des Wa, de l'Île des Hommes-Poissons, d'Alabasta, de Water 7 */
const rtDe=n=>/^Pays /.test(n)?'du '+n.slice(5).replace(/^/,'Pays '):/^(Île|Archipel|Atelier)/.test(n)?'de l\''+n:/^[AEIOUYÉÈÊÎÔ]/i.test(n)?'d\''+n:'de '+n;
function rtUIBuild(){
  let el=document.getElementById('rt-ui');if(el)return el;el=document.createElement('div');el.id='rt-ui';
  el.innerHTML='<canvas id="rt-atmo"></canvas><div id="rt-tilt"><i></i><i></i></div><div id="rt-vig"></div><div id="rt-pz"></div><div id="rt-flash"></div><div id="rt-lbx"><i></i><i></i></div>'
    +'<div id="rt-intro"><b>À L\'ABORDAGE !</b><small>vos troupes combattent seules · donnez un ordre pour reprendre la main</small></div><div id="rt-cut"></div>'
    /* bandeau de bataille : votre camp à gauche, objectif et temps au centre, l'adversaire à droite */
    +'<div class="rt-hdr"><div class="rt-camp" id="rt-c0"></div><div class="rt-medal" id="rt-med"></div><div class="rt-camp eux" id="rt-c1"></div></div>'
    +'<div class="rt-tl"><div class="rt-title" id="rt-st"></div><div class="rt-obj" id="rt-obj"></div><div class="rt-feed" id="rt-feed"></div></div>'
    +'<div class="rt-tr" id="rt-ctl"><div class="rt-grp" id="rt-spd"></div><button data-rt="pause" id="rt-pb" class="pri"></button>'
    +'<div class="rt-grp"><button data-rt="cam" id="rt-cam" title="La caméra suit l\'action ; glisser au clic gauche la reprend 6 s"></button><button data-rt="auto" title="Les deux camps passent à l\'IA, sans affichage, jusqu\'à la fin">Auto</button><button data-rt="retgen" title="Tout le camp se retire : l\'autre camp l\'emporte">Retraite</button><button data-rt="quitter" id="rt-quit" class="rouge">Quitter</button></div></div>'
    +'<div id="rt-banner"></div><div id="rt-jr"></div>'
    +'<div class="rt-minibox"><div class="rt-mh">CARTE <span>N ▲</span></div><canvas id="rt-mini" width="154" height="220"></canvas><small>glisser sur le terrain : déplacer la vue</small></div>'
    +'<div class="rt-bot"><div id="rt-info"></div><div class="rt-ord" id="rt-ord"></div><div id="rt-cards"></div></div><div id="rt-cmd"></div><div id="rt-end"></div><div id="rt-box"></div>';
  document.body.appendChild(el);el.addEventListener('pointerdown',rtUIClick);el.addEventListener('contextmenu',e=>e.preventDefault());
  const lb=document.createElement('div');lb.id='rt-lab';document.body.appendChild(lb);return el;}
function rtCampHTML(R,sd){const F=RT_FAC[rtFacOf(R,sd)]||RT_FAC.pirate,L=R.G.filter(g=>g.sd===sd&&!g.hero),A=L.filter(rtAlive);let n=0,n0=0,m=0;for(const g of L){n0+=g.n0;}for(const g of A){n+=g.n;m+=g.m*g.n;}
  const mo=n?Math.round(m/n):0,H=R.G.filter(g=>g.sd===sd&&g.hero),moi=sd===R.side;
  return '<i class="rt-emb" style="--f:'+F.c+';--f2:'+F.c2+'">'+F.ic+'</i><div class="rt-cn"><b>'+esc(R.names[sd])+'</b><small>'+(sd===0?'attaque':'défense')+(moi?' · vous':'')+'</small></div>'
    +'<div class="rt-cv"><span class="rt-big">'+Math.ceil(n-1e-6)+'</span><small>/ '+Math.round(n0)+'</small></div>'
    +'<div class="rt-cb"><i class="rt-mb" title="Moral moyen '+mo+'"><b style="width:'+mo+'%" class="'+(mo<30?'bas':mo<60?'moy':'')+'"></b></i>'
    +H.map(h=>'<span class="rt-hh'+(rtAlive(h)?'':' off')+'" title="'+esc(h.hero)+'"><em>'+esc(h.hero)+'</em><i class="rt-hp"><b style="width:'+Math.round(100*Math.max(0,h.hp)/h.hp0)+'%"></b></i></span>').join('')+'</div>';}
function rtMedHTML(R){const u=Math.max(0,Math.min(1,R.hold/RT.HOLD)),C=2*Math.PI*30;
  return '<svg viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="30" class="rt-r0"/><circle cx="36" cy="36" r="30" class="rt-r1'+(R.contest?' disp':'')+'" style="stroke-dasharray:'+(C*u).toFixed(1)+' '+C.toFixed(1)+'"/></svg>'
    +'<div class="rt-mt"><b>'+rtMS(R.t)+'</b><small>/ '+rtMS(RT.TMAX)+'</small></div><div class="rt-ml">cercle doré '+Math.floor(R.hold)+' / '+RT.HOLD+' s'+(R.contest?' · disputé':'')+'</div>';}
function rtUI(R){
  if(!R){const el=document.getElementById('rt-ui');if(el)el.remove();const lb=document.getElementById('rt-lab');if(lb)lb.remove();return;}
  const el=rtUIBuild(),rc=W3.cv.getBoundingClientRect();el.style.cssText='left:'+rc.left+'px;top:'+rc.top+'px;width:'+rc.width+'px;height:'+rc.height+'px';
  const $i=id=>document.getElementById(id),put=(id,h)=>{const e=$i(id);if(e&&e._h!==h){e._h=h;e.innerHTML=h;}};
  el.classList.toggle('pz',!!(R.paused&&!R.end));el.classList.toggle('fin',!!R.end);
  put('rt-c0',rtCampHTML(R,R.side));put('rt-c1',rtCampHTML(R,1-R.side));put('rt-med',rtMedHTML(R));
  put('rt-st','<b>'+esc('Bataille '+rtDe(R.t0name||'Alabasta'))+'</b><small>'+(R.spec&&!R.spec.demo?'la carte attend l\'issue':'démonstration · la partie n\'est pas modifiée')+'</small>');
  put('rt-spd',[.5,1,2].map(v=>'<button data-rt="spd:'+v+'"'+(R.spd===v?' class="on"':'')+' title="Vitesse (touches + et −)">×'+String(v).replace('.',',')+'</button>').join(''));
  $i('rt-cam').textContent=RT.camAuto?'🎥 Suit':'🎥 Libre';$i('rt-cam').className=RT.camAuto?'on':'';
  $i('rt-quit').textContent=R.spec&&!R.spec.demo&&!R.end?'Abandonner':'Quitter';
  $i('rt-pb').innerHTML=R.end?'Terminé':R.deploy?'▶ Commencer':R.paused?'▶ Reprendre':'❚❚ Pause';$i('rt-pb').disabled=!!R.end;
  const bn=$i('rt-banner');bn.className=(R.paused||R.deploy)&&!R.end?'on':'';bn.innerHTML=R.end?'':R.deploy?'<b>DÉPLOIEMENT</b><small>'+esc(R.why||'')+' · Espace pour commencer</small>':R.paused?'<b>PAUSE TACTIQUE</b><small>donnez vos ordres'+(R.why?' · '+esc(R.why):'')+' · Espace pour reprendre</small>':'';
  /* mission : courte, toujours visible ; le reste sur demande */
  put('rt-obj','<div class="rt-h">Mission</div><p>'+(R.side===0?'Tenir le <b>cercle doré</b> 60 s sans défenseur dedans, ou chasser la défense.':'Tenir jusqu\'à '+rtMS(RT.TMAX)+' : l\'attaque ne doit pas garder le <b>cercle doré</b> 60 s.')+'</p>'
    +'<div class="rt-bar"><i style="width:'+Math.round(100*R.hold/RT.HOLD)+'%"></i></div>'
    +'<div class="rt-ob"><button data-rt="jr" class="'+(RT.jr?'on':'')+'">Journal</button><button data-rt="aide" class="'+(RT.aide?'on':'')+'">Commandes</button><button data-rt="ap" class="'+(RT.autoPause?'on':'')+'" title="Début, commandant sous 30 % de vie, groupe en déroute">Pauses auto</button></div>');
  /* notifications : les 3 derniers faits de moins de 7 s, qui s'effacent */
  put('rt-feed',R.log.filter(l=>R.t-l[0]<7).slice(0,3).map(l=>'<div class="rt-nt" style="opacity:'+Math.max(.25,Math.min(1,(7-(R.t-l[0]))/2)).toFixed(2)+'"><em>'+rtMS(l[0])+'</em> '+esc(l[1])+'</div>').join(''));
  const jr=$i('rt-jr');jr.style.display=RT.jr||RT.aide?'':'none';
  put('rt-jr',(RT.jr?'<div class="rt-h">Journal</div>'+R.log.map(l=>'<small><em>'+rtMS(l[0])+'</em> '+esc(l[1])+'</small>').join(''):'')
    +(RT.aide?'<div class="rt-h">Commandes</div><small><b>Clic</b> : choisir un groupe · <b>Maj + glisser</b> : cadre de sélection · <b>Ctrl+A</b> : tous · <b>Tab</b> : suivant</small><small><b>Clic droit</b> : aller · sur un ennemi : attaquer · <b>Maj</b> : à la suite</small><small><b>Glisser au clic gauche</b> : déplacer la vue · <b>molette</b> : zoom · <b>Page↑/↓</b> : tourner · flèches</small><small><b>Espace</b> : pause tactique · <b>Q</b> : compétence · <b>1-4</b> : formations</small>':''));
  /* cartes des groupes : avis de recherche avec la figurine de la planche */
  const fcm=rtFacOf(R,R.side),F=RT_FAC[fcm]||RT_FAC.pirate;
  let h='';rtMine(R).forEach((g,i)=>{const on=R.sel.includes(g.id),U=rtUnit(g),a=rtAlive(g),img=rtPor(g.asset,g.hero?'garde':'garde',g.hero?.62:1,g.hero?64:62);
    h+='<button data-rt="sel:'+g.id+'" style="--rt-camp:'+F.c+'" class="rt-card'+(on?' on':'')+(a?'':' off')+(g.hero?' hero':'')+' st-'+g.state+'" title="'+esc((g.hero||U.n)+' · '+rtOrdTxt(R,g))+'">'
      +'<i class="rt-badge '+(g.ctrl==='manuel'?'man':'aut')+'">'+(g.ctrl==='manuel'?'MANUEL':'AUTO')+'</i>'
      +'<span class="rt-pic">'+(img?'<img src="'+img+'" alt="">':'<em>'+U.ic+'</em>')+'</span>'
      +'<span class="rt-ct"><b>'+esc(g.hero||U.n)+'</b><span>'+(g.hero?Math.ceil(Math.max(0,g.hp))+'<small>/'+Math.round(g.hp0)+'</small>':Math.ceil(g.n-1e-6)+'<small>/'+Math.round(g.n0)+'</small>')+'</span></span>'
      +(g.hero?'<i class="rt-mb hp"><b style="width:'+Math.round(100*Math.max(0,g.hp)/g.hp0)+'%"></b></i>':'<i class="rt-mb"><b style="width:'+Math.round(g.m)+'%" class="'+(g.m<30?'bas':g.m<60?'moy':'')+'"></b><u style="left:30%"></u><u style="left:60%"></u></i>')
      +'<small>'+(a?(g.hero?'':esc(RT_ETAT[g.state])+' · ')+esc(rtOrdTxt(R,g)):esc(rtOrdTxt(R,g)))+'</small></button>';});
  put('rt-cards',h);
  /* commandant : médaillon, vie, compétence avec recharge circulaire */
  const HL=R.G.filter(g=>g.hero&&g.sd===R.side),hc=rtMyHero(R)||HL[0];let c='';
  if(hc){const Hh=RT_H[hc.hero],a=rtAlive(hc),cd=Math.max(0,hc.qcd||0),u=a?1-Math.min(1,cd/Hh.q.cd):0,ok=a&&cd<=0&&!hc.cast,img=rtPor(hc.asset,'garde',.5,84);
    c='<div class="rt-por'+(a?'':' off')+'" style="--f:'+F.c+'">'+(img?'<img src="'+img+'" alt="">':'')+'</div>'
      +'<div class="rt-cmb"><div class="rt-cnm">'+(HL.length>1?HL.map(q=>'<button data-rt="hq:'+q.id+'"'+(q===hc?' class="on"':'')+(rtAlive(q)?'':' disabled')+'>'+esc(q.hero)+'</button>').join(''):'<b>'+esc(hc.hero)+'</b>')+'<small>'+esc(Hh.camp)+(a?'':' · '+(hc.blesse?'blessé':'retiré'))+'</small></div>'
      +'<i class="rt-hp big"><b style="width:'+Math.round(100*Math.max(0,hc.hp)/hc.hp0)+'%"></b></i><small class="rt-pas" title="'+esc(Hh.pas)+'">'+esc(Hh.pas)+'</small>'
      +'<button data-rt="skauto" class="rt-mini2'+(RT.skillAuto?' on':'')+'" title="L\'IA lance la compétence d\'elle-même">Compétence auto : '+(RT.skillAuto?'oui':'non')+'</button></div>'
      +'<button data-rt="q" class="rt-skill'+(ok?' pret':'')+(R.mode==='q'?' on':'')+'"'+(ok?'':' disabled')+' title="'+esc(Hh.q.n+' : '+Hh.q.d)+'" style="--u:'+(u*360).toFixed(0)+'deg"><i>'+(cd>0?Math.ceil(cd):'Q')+'</i><span>'+esc(Hh.q.n)+'</span></button>';}
  put('rt-cmd',c);
  /* ordres */
  const S=rtSelG(R),f0=S.find(g=>!g.hero);
  put('rt-ord',S.length?RT_ORD.map(o=>'<button data-rt="o:'+o[0]+'" class="rt-o'+(o[0]==='rendre'?' rt-auto':'')+(o[0]==='avancer'&&R.mode==='A'?' on':'')+'" title="'+esc(o[4])+'"><i>'+o[1]+'</i>'+o[2]+'<kbd>'+o[3]+'</kbd></button>').join('')
      +'<i class="rt-sep"></i>'+Object.keys(RT_FORM).map((k,i)=>'<button data-rt="f:'+k+'" class="rt-o'+(f0&&f0.form===k?' on':'')+'"'+(f0?'':' disabled')+'><i>'+RT_FIC[k]+'</i>'+RT_FORM[k]+'<kbd>'+(i+1)+'</kbd></button>').join('')
    :'<span class="rt-hint"><b>Clic</b> : choisir · <b>glisser</b> : déplacer la vue · <b>Maj + glisser</b> : cadre · <b>clic droit</b> : ordre · <b>Espace</b> : pause</span>');
  /* fiche du groupe choisi */
  const g=S[0];let inf='';
  if(g){const U=rtUnit(g),t=R.M.tile(g.cx,g.cy),cs=[...(g.live||[]),...g.causes.filter(c=>R.t-c[0]<4).map(c=>c[1])];
    inf='<b>'+esc(g.hero||U.n)+'</b><span>⚔ '+U.atk+'</span><span>⛨ '+U.def+'</span><span>'+(U.rng?'➶ '+U.rng+' u':'mêlée')+'</span><span>➤ '+U.spd+' u/s</span>'+(g.hero?'':'<span>moral '+Math.round(g.m)+' / '+U.mor+'</span>')
      +(t?(t.k==='couvert'?'<span class="tg">couvert</span>':'')+(t.haut?'<span class="tg">hauteur</span>':'')+(t.etroit?'<span class="tg">passage étroit</span>':''):'')+(cs.length?'<em class="rt-cause">'+cs.map(esc).join(' · ')+'</em>':'');}
  put('rt-info',inf);$i('rt-info').style.display=inf?'':'none';
  /* fin */
  const en=$i('rt-end');
  if(R.end){if(!en.dataset.on){en.dataset.on='1';const w=R.end.w===R.side,row=sd=>{const L=R.G.filter(q=>q.sd===sd&&!q.hero),by={};for(const q of L){const k=RT_U[q.kind].n;by[k]=by[k]||[0,0];by[k][0]+=Math.ceil(q.n-1e-6);by[k][1]+=q.n0;}
        const hh=R.G.filter(q=>q.sd===sd&&q.hero);return '<tr><th>'+esc(rtCampN(sd))+'</th><td>'+Object.entries(by).map(([k,v])=>k+' <b>'+v[0]+'</b> / '+v[1]).join(' · ')+'</td><td>'+hh.map(h=>esc(h.hero)+' : '+(h.blesse?'blessé':Math.ceil(h.hp)+' / '+Math.round(h.hp0))).join(' · ')+'</td></tr>';};
      const real=R.spec&&!R.spec.demo,wh=R.G.find(q=>q.hero&&q.sd===R.end.w),wi=wh?rtPor(wh.asset,'cri',.62,150):'';
      en.className=w?'gagne':'perdu';
      en.innerHTML=(wi?'<img class="rt-ew" src="'+wi+'" alt="">':'')+'<h2>'+(w?'Victoire !':'Défaite…')+'</h2><p>'+esc(R.end.why)+' <em>('+rtMS(R.end.t)+')</em></p><table>'+row(0)+row(1)+'</table>'
        +(real?'<p class="rt-note">Sur la carte : '+(R.end.w===0?esc(R.names[0])+' prend '+esc(R.t0name):esc(R.names[1])+' garde '+esc(R.t0name))+' avec '+Math.round(RT.K.survie*100)+' % de ses survivants (les autres sont blessés ou dispersés : '+sumU(rtResult(R)[R.end.w===0?'uA':'uD']).toFixed(1)+' troupes) ; le camp battu perd ses troupes engagées (règle du jeu). Commandants mis hors de combat : blessés.</p><div class="rt-eb"><button data-rt="appliquer" class="pri">Revenir à la carte</button></div>'
          :'<p class="rt-note">Démonstration : la partie n\'est pas modifiée.</p><div class="rt-eb"><button data-rt="rejouer" class="pri">Rejouer</button><button data-rt="camp">Jouer l\'autre camp</button><button data-rt="quitter">Revenir à la carte</button></div>');en.style.display='';}}
  else{en.style.display='none';en.dataset.on='';}
}
function rtPauseSet(R,p,why){if(R.end)return;if(!p&&R.deploy){R.deploy=false;}R.paused=p;R.why=p?(why||''):'';R.uiDirty=true;}
function rtAutoPause(R,why){if(!RT.autoPause||R.toutAuto||RT.run!==R)return;rtPauseSet(R,true,why);}
function rtOrder(R,k,shift){const S=rtSelG(R);if(!S.length)return;
  if(k==='rendre'){for(const g of S){g.ctrl='auto';g.q=[];rtHalt(g);}R.mode=null;R.uiDirty=true;return;}
  if(k==='avancer'){R.mode=R.mode==='A'?null:'A';R.uiDirty=true;return;}
  for(const g of S){if(k==='tenir'||k==='retraite')rtGive(R,g,{k},shift&&k==='tenir');}R.mode=null;R.uiDirty=true;}
function rtForm(R,f){for(const g of rtSelG(R))rtGive(R,g,{k:'formation',f});R.uiDirty=true;}
function rtQ(R){let h=rtMyHero(R);if(h&&!rtSkillOk(R,h))h=R.G.find(g=>g.hero&&g.sd===R.side&&rtSkillOk(R,g))||h;if(!h||!rtSkillOk(R,h))return;R.qh=h.id;if(RT_H[h.hero].q.k==='hdr'){rtCast(R,h,h.cx,h.cy);R.mode=null;R.uiDirty=true;return;}if(!R.sel.includes(h.id))R.sel=[h.id];R.mode=R.mode==='q'?null:'q';R.uiDirty=true;}
function rtUIClick(e){const b=e.target.closest('button[data-rt]');if(!b||b.disabled)return;e.stopPropagation();e.preventDefault();const R=RT.run,a=b.dataset.rt;if(!R)return;
  if(a==='appliquer')return rtApply(R);if(a.startsWith('hq:')){R.qh=+a.slice(3);R.uiDirty=true;return;}
  if(a==='quitter'){if(R.spec&&!R.spec.demo&&!R.end){rtRetGen(R);return;}return rtStop();}if(a==='rejouer')return rtStart({side:R.side});if(a==='camp')return rtStart({side:1-R.side});
  if(a==='pause')return rtPauseSet(R,!R.paused&&!R.deploy?true:false);
  if(a==='ap'){RT.autoPause=!RT.autoPause;R.uiDirty=true;return;}
  if(a==='skauto'){RT.skillAuto=!RT.skillAuto;R.uiDirty=true;return;}
  if(a==='aide'){RT.aide=!RT.aide;R.uiDirty=true;return;}
  if(a==='jr'){RT.jr=!RT.jr;R.uiDirty=true;return;}
  if(a==='cam'){RT.camAuto=!RT.camAuto;R.camUser=0;R.uiDirty=true;return;}
  if(a==='auto'){rtRunAuto(R);R.uiDirty=true;return;}
  if(a==='retgen'){rtRetGen(R);return;}
  if(a.startsWith('spd:')){R.spd=RT.spd=+a.slice(4);R.uiDirty=true;return;}
  if(a.startsWith('sel:')){const id=+a.slice(4),g=R.G[id];if(!rtAlive(g))return;if(e.shiftKey){R.sel=R.sel.includes(id)?R.sel.filter(i=>i!==id):R.sel.concat(id);}else{if(R.sel.length===1&&R.sel[0]===id)rtFocus(R,g);R.sel=[id];}R.mode=null;R.uiDirty=true;return;}
  if(a.startsWith('o:'))return rtOrder(R,a.slice(2),e.shiftKey);
  if(a.startsWith('f:'))return rtForm(R,a.slice(2));
  if(a==='q')return rtQ(R);}
function rtRetGen(R){for(const g of rtMine(R))if(rtAlive(g)&&g.state!=='deroute')g.q=[{k:'retraite'}];rtEnd(R,1-R.side,'Retraite générale ordonnée par '+R.names[R.side]+'.');R.uiDirty=true;}
function rtFocus(R,g){const C=R.camP;C.tx=g.cx;C.ty=g.cy;R.camUser=performance.now();}

/* ---------- pointeur : clic gauche ou cadre pour choisir, clic droit pour ordonner ---------- */
function rtPick(R,e){
  const cv=W3.cv,rc=cv.getBoundingClientRect(),mx=(e.clientX-rc.left)*cv.width/rc.width,my=(e.clientY-rc.top)*cv.height/rc.height;
  let bs=null,bd=1e9;for(const g of R.G){if(!rtAlive(g))continue;for(const s of rtSolV(g)){const p=w3Proj(s.x,s.y,s.z+.5*(g.hero?RT.hsCmd:RT.hs)*.54,R.cam);if(!p)continue;const d=Math.hypot(p.sx-mx,p.sy-my),lim=Math.max(14,.5*RT.hs*.54*p.k);if(d<lim&&d<bd){bd=d;bs=g;}}}
  let bc=null,bcd=1e9;for(const r of R.M.T)for(const c of r){const p=w3Proj(c.x,c.y,c.z,R.cam);if(!p)continue;const d=Math.hypot(p.sx-mx,p.sy-my);if(d<bcd){bcd=d;bc=c;}}
  let pt=null;if(bc){const M=R.M;let best=1e9;for(let a=-3;a<=3;a++)for(let b=-3;b<=3;b++){const x=bc.x+M.U[0]*a*M.S/6+M.V[0]*b*M.S/6,y=bc.y+M.U[1]*a*M.S/6+M.V[1]*b*M.S/6,p=w3Proj(x,y,M.z(x,y),R.cam);if(!p)continue;const d=Math.hypot(p.sx-mx,p.sy-my);if(d<best){best=d;pt=[x,y];}}
    const p0=w3Proj(bc.x,bc.y,bc.z,R.cam);if(p0&&bcd>M.S*p0.k*1.2)pt=null;}
  return {g:bs,pt,mx,my};
}
function rtRight(R,P,shift){
  const S=rtSelG(R);if(R.mode==='q'){const h=rtMyHero(R);const pt=P.g&&P.g.sd!==R.side?[P.g.cx,P.g.cy]:P.pt;if(h&&pt){rtCast(R,h,pt[0],pt[1]);R.mode=null;R.uiDirty=true;}return;}
  if(!S.length)return;
  if(P.g&&P.g.sd!==R.side){for(const g of S)rtGive(R,g,{k:'attaque',id:P.g.id},shift);R.mode=null;R.uiDirty=true;return;}
  if(!P.pt)return;const k=R.mode==='A'?'avancer':'aller';
  /* plusieurs groupes : côte à côte, en travers de la direction du mouvement */
  let cx=0,cy=0;for(const g of S){cx+=g.cx;cy+=g.cy;}cx/=S.length;cy/=S.length;const dir=Math.atan2(P.pt[1]-cy,P.pt[0]-cx),px=-Math.sin(dir),py=Math.cos(dir);
  const L=S.slice().sort((a,b)=>((a.cx-cx)*px+(a.cy-cy)*py)-((b.cx-cx)*px+(b.cy-cy)*py)),w=L.map(g=>g.hero?1:g.rad*2*.85),tot=w.reduce((a,b)=>a+b,0);let off=-tot/2;
  L.forEach((g,i)=>{const o=off+w[i]/2;off+=w[i];let x=P.pt[0]+px*o,y=P.pt[1]+py*o;if(!R.M.ok(x,y)){const c=R.M.near(x,y);if(c){x=c.x;y=c.y;}}rtGive(R,g,{k,x,y},shift);});
  R.mode=null;R.uiDirty=true;}
function rtDown(e){const R=RT.run;if(!R)return;
  if(e.target&&e.target.id==='rt-mini'){e.preventDefault();e.stopImmediatePropagation();const rc=e.target.getBoundingClientRect(),[a,b]=rtMiniIJ(R,(e.clientX-rc.left)*e.target.width/rc.width,(e.clientY-rc.top)*e.target.height/rc.height),[x,y]=R.M.xy(a,b);
    if(e.button===2)rtRight(R,{g:null,pt:[x,y]},e.shiftKey);else{R.camP.tx=x;R.camP.ty=y;R.camUser=performance.now();}return;}
  if(e.target!==canvas)return;e.stopImmediatePropagation();e.preventDefault();if(R.end)return;
  if(e.button===2){rtRight(R,rtPick(R,e),e.shiftKey);return;}
  if(e.button===0)R.drag={x0:e.clientX,y0:e.clientY,x:e.clientX,y:e.clientY,shift:e.shiftKey,box:e.shiftKey||e.ctrlKey,px:e.clientX,py:e.clientY};}
/* clic gauche maintenu : la caméra suit la main (le point du sol saisi reste sous le pointeur) ; Maj ou Ctrl + glisser : cadre de sélection */
function rtPan(R,dxCss,dyCss){const C=R.camP,cam=R.cam;if(!C||!cam)return;const rc=W3.cv.getBoundingClientRect(),k=canvas.width/rc.width,z=R.M.z(C.cx,C.cy);
  const p0=w3Proj(C.cx,C.cy,z,cam),rx=Math.cos(C.yaw),ry=Math.sin(C.yaw),hx=Math.sin(C.yaw),hy=-Math.cos(C.yaw),pr=w3Proj(C.cx+rx,C.cy+ry,z,cam),pf=w3Proj(C.cx+hx,C.cy+hy,z,cam);if(!p0||!pr||!pf)return;
  const a=pr.sx-p0.sx,b=pf.sx-p0.sx,c=pr.sy-p0.sy,d=pf.sy-p0.sy,det=a*d-b*c;if(Math.abs(det)<1e-6)return;const sx=-dxCss*k,sy=-dyCss*k,u=(d*sx-b*sy)/det,v=(-c*sx+a*sy)/det;
  const wx=rx*u+hx*v,wy=ry*u+hy*v,M=R.M;let nx=C.tx+wx,ny=C.ty+wy;
  /* reste au-dessus du terrain de bataille */
  const [i,j]=M.ij(nx,ny);const ci=Math.max(-2,Math.min(M.W+1,i)),cj=Math.max(-2,Math.min(M.H+1,j));if(ci!==i||cj!==j){const q=M.xy(ci,cj);nx=q[0];ny=q[1];}
  C.cx+=nx-C.tx;C.cy+=ny-C.ty;C.tx=nx;C.ty=ny;R.camUser=performance.now();R.cam=rtCam(R);}
function rtMove(e){const R=RT.run;if(!R)return;
  if(R.drag&&!R.drag.box){const d=R.drag;d.x=e.clientX;d.y=e.clientY;if(d.pan||Math.hypot(d.x-d.x0,d.y-d.y0)>6){if(!d.pan){d.pan=true;document.body.classList.add('rt-grab');}rtPan(R,d.x-d.px,d.y-d.py);d.px=d.x;d.py=d.y;}}
  else if(R.drag){R.drag.x=e.clientX;R.drag.y=e.clientY;const b=document.getElementById('rt-box'),d=R.drag;if(b&&Math.hypot(d.x-d.x0,d.y-d.y0)>6){const rc=W3.cv.getBoundingClientRect();b.style.cssText='display:block;left:'+(Math.min(d.x,d.x0)-rc.left)+'px;top:'+(Math.min(d.y,d.y0)-rc.top)+'px;width:'+Math.abs(d.x-d.x0)+'px;height:'+Math.abs(d.y-d.y0)+'px';}}
  if(R.mode==='q'&&e.target===canvas&&R.cam){const now=performance.now();if(now-(R.mvT||0)>40){R.mvT=now;const P=rtPick(R,e);if(P.pt)R.mouse=P.pt;}}}
function rtUp(e){const R=RT.run;if(!R||!R.drag||e.button!==0)return;const d=R.drag;R.drag=null;const b=document.getElementById('rt-box');if(b)b.style.display='none';
  if(d.pan){document.body.classList.remove('rt-grab');return;}
  if(Math.hypot(d.x-d.x0,d.y-d.y0)<=6){const P=rtPick(R,{clientX:d.x,clientY:d.y});
    if(R.mode==='q'){rtRight(R,P,false);return;}
    if(P.g&&P.g.sd===R.side){R.sel=d.shift?(R.sel.includes(P.g.id)?R.sel.filter(i=>i!==P.g.id):R.sel.concat(P.g.id)):[P.g.id];}else if(!d.shift)R.sel=[];R.mode=null;R.uiDirty=true;return;}
  const cv=W3.cv,rc=cv.getBoundingClientRect(),k=cv.width/rc.width,x0=(Math.min(d.x,d.x0)-rc.left)*k,x1=(Math.max(d.x,d.x0)-rc.left)*k,y0=(Math.min(d.y,d.y0)-rc.top)*k,y1=(Math.max(d.y,d.y0)-rc.top)*k;
  const L=rtMine(R).filter(g=>rtAlive(g)&&g.state!=='deroute').filter(g=>{const p=w3Proj(g.cx,g.cy,R.M.z(g.cx,g.cy)+.5,R.cam);return p&&p.sx>=x0&&p.sx<=x1&&p.sy>=y0&&p.sy<=y1;}).map(g=>g.id);
  R.sel=d.shift?[...new Set(R.sel.concat(L))]:L;R.mode=null;R.uiDirty=true;}
function rtKey(e){const R=RT.run;if(!R)return;if(e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;const k=e.key;let used=true;
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','PageUp','PageDown'].includes(k))RT.keys.add(k);
  else if(k===' '){if(R.end)rtStop();else rtPauseSet(R,R.deploy?false:!R.paused);}
  else if(k==='Escape'){if(R.mode)R.mode=null;else R.sel=[];R.uiDirty=true;}
  else if(R.end){used=false;}
  else if((k==='a'||k==='A')&&(e.ctrlKey||e.metaKey)){R.sel=rtMine(R).filter(g=>rtAlive(g)&&g.state!=='deroute').map(g=>g.id);R.uiDirty=true;}
  else if(k==='a'||k==='A')rtOrder(R,'avancer');else if(k==='t'||k==='T')rtOrder(R,'tenir',e.shiftKey);else if(k==='r'||k==='R')rtOrder(R,'retraite');
  else if(k==='q'||k==='Q')rtQ(R);else if(k==='g'||k==='G')rtOrder(R,'rendre');
  else if(k>='1'&&k<='4')rtForm(R,Object.keys(RT_FORM)[+k-1]);
  else if(k==='Tab'){const L=rtMine(R).filter(rtAlive);if(L.length){const i=L.findIndex(g=>g.id===R.sel[0]);R.sel=[L[(i+1)%L.length].id];rtFocus(R,R.G[R.sel[0]]);R.uiDirty=true;}}
  else if(k==='f'||k==='F'){const g=rtSelG(R)[0];if(g)rtFocus(R,g);}
  else if(k==='+'){R.spd=RT.spd=Math.min(2,R.spd*2);R.uiDirty=true;}else if(k==='-'){R.spd=RT.spd=Math.max(.5,R.spd/2);R.uiDirty=true;}
  else used=false;
  if(used){e.preventDefault();e.stopImmediatePropagation();}}
function rtKeyUp(e){RT.keys.delete(e.key);}
function rtWheel(e){const R=RT.run;if(!R||e.target!==canvas)return;e.preventDefault();e.stopImmediatePropagation();const C=R.camP;C.tD=Math.max(6,Math.min(48,C.tD*(e.deltaY>0?1.12:1/1.12)));R.camUser=performance.now();}
addEventListener('pointerdown',rtDown,true);addEventListener('pointermove',rtMove,true);addEventListener('pointerup',rtUp,true);
addEventListener('keydown',rtKey,true);addEventListener('keyup',rtKeyUp,true);addEventListener('blur',()=>RT.keys.clear());
addEventListener('wheel',rtWheel,{capture:true,passive:false});
addEventListener('contextmenu',e=>{if(RT.run&&(e.target===canvas||e.target.id==='rt-mini'))e.preventDefault();},true);
addEventListener('resize',()=>{if(RT.run)RT.run.uiDirty=true;});

/* ---------- entrée et sortie ---------- */
function rtStart(opt){
  opt=opt||{};if(typeof W3==='undefined'||W3.fail){toast('Monde 3D indisponible : le combat ne peut pas être montré.');return;}
  if(typeof TAC!=='undefined'&&TAC.run)tacStop();if(!W3.on)w3Toggle();if(B3.run)b3End();
  const t=opt.spec?opt.spec.t:terrs.find(q=>q.name==='Alabasta');if(!t){toast('Île introuvable.');return;}
  if(RT.run){RT.run=null;}
  if(!RT.prev)RT.prev={speed,gfx:GFX.on,k:V.k,x:V.x,y:V.y,yaw:W3.cam.yaw,pitch:W3.cam.pitch};
  speed=0;if(!GFX.on)GFX.set(true);
  try{V.k=Math.max(V.k||1,14);centerOn(t.id);}catch(_){}
  const t0=performance.now();let said=false;
  const go=()=>{const m=W3.models.get(t.id),I=m&&m.bx&&typeof BLX!=='undefined'?BLX.isl[m.bx]:null,G=I&&I.ready3?trpGrid(t):null;
    if(!G){if(performance.now()-t0<20000){if(!said){toast('Chargement de '+t.name+'…');said=true;}setTimeout(go,250);return;}toast(t.name+' n\'est pas chargée : bataille en résolution automatique.');rtStop();if(opt.fail)opt.fail();return;}
    const R=rtNew({side:opt.side||0,seed:opt.seed,spec:opt.spec});if(!R){toast('Zone de combat introuvable : résolution automatique.');rtStop();if(opt.fail)opt.fail();return;}
    R.t0name=t.name;R.onApply=opt.onApply;
    const M=R.M,yaw=Math.atan2(-M.U[1],-M.U[0])+(R.side===1?Math.PI:0);
    let cx0=0,cy0=0,nn=0;for(const g of R.G){cx0+=g.cx;cy0+=g.cy;nn++;}cx0/=nn;cy0/=nn;const cc=w3Cam(cx0,cy0,yaw,.82,10),D0=Math.max(12,Math.min(40,(M.W*M.S*.72+1)/.86/(2*cc.tx)));
    R.camP={cx:cx0,cy:cy0,tx:cx0,ty:cy0,yaw,tyaw:yaw,pitch:.82,D:D0,tD:D0};
    /* minicarte : le haut est ce que regarde la caméra au départ */
    R.mmI=R.side===1;const rx=Math.cos(yaw),ry=Math.sin(yaw);R.mmJ=(M.V[0]*rx+M.V[1]*ry)<0;
    R.alpha=1;R.rT=0;RT.run=R;R.cam=rtCam(R);R.sel=[];R.paused=false;R.deploy=false;R.why='';R.intro=performance.now();
    try{W3.cv.style.filter='saturate(1.18) contrast(1.07) brightness(1.02)';}catch(_){}
    rtLog(R,'À l\'abordage ! Vos troupes combattent seules ; donnez un ordre pour reprendre la main.');
    document.body.classList.add('tacrun','rtrun');dispatchEvent(new Event('resize'));rtUI(R);dirty=true;};
  go();
}
function rtStop(){
  RT.run=null;rtUI(null);TRP.tiles=[];TRP.glow=[];try{W3.cv.style.filter='';}catch(_){}RT.keys.clear();document.body.classList.remove('tacrun','rtrun','rt-grab');dispatchEvent(new Event('resize'));
  const P=RT.prev;RT.prev=null;if(P){speed=P.speed;V.k=P.k;V.x=P.x;V.y=P.y;W3.cam.yaw=P.yaw;W3.cam.pitch=P.pitch;if(!P.gfx)GFX.set(false);}dirty=true;
}
/* ============================== branchement sur la carte (étape 6) ==============================
   1. Une armée arrive sur une île tenue par un autre camp, en guerre, sans boss, posture non prudente, et un humain est l'un des deux camps :
      si l'île a sa carte de bataille (île Blender) et que le réglage le permet, le monde s'arrête et le jeu propose de commander.
   2. « Résolution automatique » : la chaîne d'origine est appelée telle quelle (résultat identique au jeu sans ce module).
   3. « Commander » : sauvegarde automatique, bataille ; à la fin, la même chaîne est appelée avec le résultat de la bataille imposé :
      vainqueur et survivants par type (au plus l'effectif engagé), sans les techniques et le duel du calcul automatique (déjà joués sur le terrain).
      Les enveloppes existantes font le reste : propriété et villes (captureCity), Course (pertes de la Marine), champions (placés, blessés,
      expérience), rapport de bataille, débarquement. Le camp battu perd ses troupes engagées, comme dans le calcul d'origine. */
RT.cmdMode=(()=>{try{return localStorage.getItem('rk-rt')||'importantes';}catch(_){return 'importantes';}})();
RT.wait=[];RT.force=null;RT.cur=null;
const rtFac=pid=>{const S=typeof CS!=='undefined'&&CS.on&&CS.S&&CS.S[pid];if(S&&S.role)return S.role==='revo'?'revo':S.role==='marine'?'marine':'pirate';const id=pxCrewId(pid);return id==='marine'||id==='revo'?id:'pirate';};
const rtHurtCh=c=>opHurt(c.k==='c'?CH[c.i]:c.f);
function rtHeroesOf(L,fac){return L.filter(c=>c.k==='c'&&!rtHurtCh(c)).map(c=>({name:LEGENDS[c.i].s,lv:opChLv(c),c,key:opKey(c)})).filter(h=>RT_H[h.name]&&TRP_CMD_FAC[h.name]===fac);}
function rtSpecOf(a){
  const t=terrs[a.to];let f=terrs[a.from];if(!f||f===t||Math.hypot(f.x-t.x,f.y-t.y)<1)f=terrs[(t.nb||[])[0]];
  const fa=rtFac(a.owner),fd=rtFac(t.owner),cA=opChampsOfArmy(a).filter(c=>!rtHurtCh(c)),cD=opChampsAt(t.id);
  const u=o=>{const r={};for(const k of UK)r[k]=Math.max(0,+o[k]||0);return r;};
  return {t,f,a,stance:a.s|0,camps:[{pid:a.owner,fac:fa,name:players[a.owner].name,u:u(a.u),heroes:rtHeroesOf(cA,fa),champs:cA},{pid:t.owner,fac:fd,name:players[t.owner].name,u:u(t.u),heroes:rtHeroesOf(cD,fd),champs:cD}]};}
function rtIsle(t){const m=typeof W3!=='undefined'&&W3.models?W3.models.get(t.id):null;return !!((m&&m.bx)||(typeof BLX!=='undefined'&&BLX.isl&&BLX.isl[t.name]));}
/* l'arrivée peut-elle devenir une bataille commandée ? */
function rtQualif(a){
  if(RT.cmdMode==='jamais'||RT.force||MODE!=='solo'||!started||over)return false;
  const t=terrs[a.to];if(!t||t.owner<0||t.owner===a.owner||a.rt||bossAlive(t)||!isWar(a.owner,t.owner)||(a.s|0)===2)return false;
  if(!(players[a.owner]&&players[a.owner].human)&&!(players[t.owner]&&players[t.owner].human))return false;
  if(typeof W3==='undefined'||W3.fail||!rtIsle(t))return false;
  if(sumU(a.u)<1||tr(t)<1)return false;
  if(RT.cmdMode==='importantes'){const sp=rtSpecOf(a);if(!sp.camps.some(c=>c.heroes.length)&&sumU(a.u)+tr(t)<20)return false;}
  return true;}
/* résultat imposé : les troupes de la bataille sont posées juste avant le calcul de base, et le multiplicateur des techniques (OPB.mulA / mulD,
   déjà prévu par la couche OP Adventure, sans plafond) donne au vainqueur une force écrasante : survivants = troupes posées (× posture), sans hasard */
{const b0=opBattle;opBattle=function(a,t){const F=RT.force;if(F&&t&&t.id===F.t){
  /* troupes de la bataille : survivants de l'attaque (si elle gagne) ou de la défense (si elle tient) */
  a.u=Object.assign({},F.uA);if(F.win===false)t.u=Object.assign({},F.uD);
  return {ao:a.owner,do:t.owner,A:F.cA,D:F.cD,cutA:0,cutD:0,mulA:F.win?1e9:1,mulD:F.win?1:1e9,addA:0,addD:0,notes:F.notes.slice(),loot:{},aPow:0,dPow:0,duel:null,loser:F.loser};}
  return b0(a,t);};}
{const m0=brMake;brMake=function(){const F=RT.force,args=[...arguments];if(F&&args[1]&&args[1].id===F.t){args[3]=F.A0;args[4]=F.D0;args[5]=F.Pa;args[6]=F.Pd;args[7]=F.au0;args[8]=F.du0;}
  const r=m0.apply(null,args);if(r&&F&&args[1]&&args[1].id===F.t)r.rt={dur:Math.round(F.dur),k:'commandée'};return r;};}
/* arrivée : interception (la file garde l'armée dans la liste des armées, arrivée, tant que la bataille n'est pas résolue) */
{const ra=resolveArrival;RT.raOrig=ra;resolveArrival=function(a){
  if(a&&a.rtW&&RT.wait.includes(a)){if(!armies.includes(a))armies.push(a);rtHoldWorld();return;}
  if(a&&a.rtW)delete a.rtW;   /* reprise d'une sauvegarde faite pendant l'attente : nouvelle arrivée */
  let ok=false;try{ok=rtQualif(a);}catch(e){console.warn('bataille commandée :',e);ok=false;}
  if(!ok)return ra(a);
  a.rtW=1;a.t=a.dur;armies.push(a);RT.wait.push(a);rtHoldWorld();rtNext();};}
function rtHoldWorld(){if(RT.held===undefined||RT.held===null)RT.held=speed;speed=0;dirty=true;}
function rtReleaseWorld(){if(RT.wait.length||RT.run||RT.ask)return;if(RT.held!==undefined&&RT.held!==null){speed=RT.held||speed;RT.held=null;}dirty=true;}
/* résolution automatique d'une arrivée en attente (chaîne d'origine, inchangée) */
function rtAutoResolve(a){const i=armies.indexOf(a);if(i>=0)armies.splice(i,1);delete a.rtW;RT.raOrig(a);}
function rtNext(){
  if(RT.ask||RT.run)return;
  while(RT.wait.length){const a=RT.wait[0];
    /* la situation a pu changer pendant l'attente : si l'arrivée ne relève plus d'une bataille, calcul d'origine */
    let ok=false;try{const keep=RT.cmdMode;ok=rtQualif(a);}catch(_){ok=false;}
    if(!ok){RT.wait.shift();rtAutoResolve(a);continue;}
    rtAsk(a);return;}
  rtReleaseWorld();}
function rtListU(u){return UK.filter(k=>(u[k]||0)>=.5).map(k=>Math.round(u[k])+' '+RT_U[k].n).join(', ')||'aucune troupe';}
/* fenêtre de choix : commander ou résolution automatique */
function rtAsk(a){
  const sp=rtSpecOf(a),t=sp.t,me=players[a.owner].human?0:1,Pa={},Pd={};let A=0,D=0;try{A=attTotal(a.owner,a.u,t,false,a.from,Pa,a.s);D=defTotal(t,a.u,false,Pd);}catch(_){}
  RT.ask={a,sp,A,D,Pa,Pd};
  const ch=c=>c.champs.map(opChName).map(n=>esc(n)+(RT_H[n]&&TRP_CMD_FAC[n]===c.fac?'':' <i>(absent du terrain)</i>')).join(', ');
  let el=document.getElementById('rt-ask');if(!el){el=document.createElement('div');el.id='rt-ask';document.body.appendChild(el);el.addEventListener('pointerdown',rtAskClick);}
  el.innerHTML='<div class="rt-askb"><h3>Bataille · '+esc(t.name)+'</h3><p>'+esc(sp.camps[0].name)+' attaque '+esc(sp.camps[1].name)+'.</p>'
    +[0,1].map(sd=>'<p><b>'+(sd?'Défense':'Attaque')+' · '+esc(sp.camps[sd].name)+(sd===me?' (vous)':'')+'</b><br>'+esc(rtListU(sp.camps[sd].u))+(sp.camps[sd].champs.length?'<br>Commandants : '+ch(sp.camps[sd]):'')+'</p>').join('')
    +'<p class="rt-note">Calcul automatique, sans le hasard : attaque '+Math.round(A)+' contre défense '+Math.round(D)+' ('+(A>D?'l\'attaque l\'emporterait':'la défense tiendrait')+').</p>'
    +'<div class="rt-askbt"><button data-rk="cmd" class="pri">Commander la bataille</button><button data-rk="auto">Résolution automatique</button></div>'
    +'<label class="rt-note">Proposer : <select id="rt-mode"><option value="importantes"'+(RT.cmdMode==='importantes'?' selected':'')+'>les batailles importantes (commandant, ou 20 troupes et plus)</option><option value="toutes"'+(RT.cmdMode==='toutes'?' selected':'')+'>toutes mes batailles</option><option value="jamais"'+(RT.cmdMode==='jamais'?' selected':'')+'>jamais (calcul automatique)</option></select></label></div>';
  const sel=el.querySelector('#rt-mode');sel.addEventListener('change',()=>{RT.cmdMode=sel.value;try{localStorage.setItem('rk-rt',sel.value);}catch(_){}});
  el.hidden=false;
  try{centerOn(t.id);}catch(_){}}
function rtAskClick(e){const b=e.target.closest('button[data-rk]');if(!b)return;e.preventDefault();e.stopPropagation();const K=RT.ask;if(!K)return;
  const el=document.getElementById('rt-ask');if(el)el.hidden=true;RT.ask=null;const a=K.a;
  if(b.dataset.rk==='auto'){RT.wait.shift();rtAutoResolve(a);rtNext();return;}
  /* commander : sauvegarde automatique avant la bataille (l'armée est encore dans la liste des armées, arrivée) */
  try{if(typeof svAuto==='function')svAuto('bataille');}catch(_){}
  const me=players[a.owner].human?0:1;
  rtStart({side:me,spec:K.sp,seed:(a.id*7919+Math.floor(time))>>>0,onApply:(res)=>rtCommit(a,K,res),fail:()=>{RT.wait.shift();rtAutoResolve(a);rtNext();}});}
/* résultat de la bataille → carte */
function rtResult(R){const out={win:R.end.w===0,uA:{},uD:{},hurt:[],dur:R.end.t};for(const k of UK){out.uA[k]=0;out.uD[k]=0;}
  for(const g of R.G){if(g.hero){if(g.blesse)out.hurt.push(g);continue;}const u=g.sd===0?out.uA:out.uD;u[g.kind]+=Math.max(0,g.n);}
  /* jamais plus que l'effectif engagé, par type ; le vainqueur ne garde qu'une part de ses survivants sur le terrain (blessés, dispersés) :
     calibrage pour que la bataille commandée ne rapporte pas plus que le calcul automatique (mesure : RT.compare) */
  const ks=R.spec.demo?1:RT.K.survie;
  for(const k of UK){out.uA[k]=Math.min(out.uA[k],R.spec.camps[0].u[k]||0)*(out.win?ks:1);out.uD[k]=Math.min(out.uD[k],R.spec.camps[1].u[k]||0)*(out.win?1:ks);}
  return out;}
function rtApply(R){const res=rtResult(R),cb=R.onApply;rtStop();if(cb)try{cb(res);}catch(e){console.warn('bataille commandée, application :',e);}}
function rtCommit(a,K,res){
  const t=K.sp.t,i=armies.indexOf(a);if(i>=0)armies.splice(i,1);delete a.rtW;RT.wait.shift();
  const wounded=res.hurt.map(g=>g.c).filter(Boolean),win=res.win;
  /* un seul « blessé du duel » dans la chaîne d'origine : celui du camp vainqueur s'il y en a un (le camp battu suit déjà la règle) */
  const loserSide=wounded.filter(c=>win?K.sp.camps[0].champs.some(q=>opKey(q)===opKey(c)):K.sp.camps[1].champs.some(q=>opKey(q)===opKey(c)));
  RT.force={t:t.id,win,uA:win?res.uA:Object.assign({},a.u),uD:res.uD,cA:K.sp.camps[0].champs,cD:K.sp.camps[1].champs,loser:loserSide[0]||null,
    notes:[[win?'a':'d','Bataille commandée en temps réel ('+Math.round(res.dur)+' s) : '+(win?'l\'attaque l\'emporte':'la défense tient')]],
    A0:K.A,D0:K.D,Pa:K.Pa,Pd:K.Pd,au0:UK.map(k=>r1(a.u[k]||0)),du0:UK.map(k=>r1(t.u[k]||0)),dur:res.dur};
  try{RT.raOrig(a);}catch(e){console.warn('bataille commandée, carte :',e);}finally{RT.force=null;}
  /* commandants mis hors de combat sur le terrain et pas encore blessés : blessés (règle actuelle de blessure) */
  for(const c of wounded){const z=c.k==='c'?CH[c.i]:c.f;if(!z||(z.hurt||0)>time)continue;const own=c.k==='c'?CH[c.i].own:c.p;opWound(c,own,opCapOf(own));}
  dirty=true;rtNext();}
/* le monde reste arrêté tant qu'une bataille attend ou se joue */
{const a=tmTick;tmTick=function(dt){if(RT.run||RT.ask||RT.wait.length)return;return a(dt);};}
{const a=agTick;agTick=function(dt){if(RT.run||RT.ask||RT.wait.length)return;return a(dt);};}
{const a=svCanSave;svCanSave=function(){return RT.run||RT.force?'Sauvegarde impossible pendant une bataille.':a();};}
/* si la vitesse est relancée pendant l'attente, l'arrivée reste en attente (voir l'interception) */
RT.start=rtStart;RT.stop=rtStop;RT.step=rtStep;RT.cast=rtCast;RT.give=rtGive;RT.pause=(p)=>RT.run&&rtPauseSet(RT.run,p);
{const st=document.createElement('style');st.id='rt-css';st.textContent=
  /* thème One Piece : or du chapeau de paille, rouge de Luffy, bleu de la mer et de la Marine, parchemin des avis de recherche, bois des navires */
  ':root{--op-or:#f5c518;--op-or2:#e09b0b;--op-rouge:#d62828;--op-mer:#121215;--op-mer2:#1d1d22;--op-ciel:#3a8dde;--op-par:#f6e7c4;--op-par2:#e7cf9c;--op-encre:#2a1a0c;--op-bois:#5a361a;--op-marine:#2f74c8;--op-pirate:#d62828;--op-titre:"OPBangers",Impact,"Arial Black",system-ui,sans-serif}'
  +'#rt-go{position:fixed;right:14px;bottom:130px;z-index:9999;font:800 12.5px system-ui,sans-serif;letter-spacing:.3px;padding:8px 13px;border-radius:10px;border:2px solid var(--op-encre);background:linear-gradient(180deg,#ffd84d,var(--op-or2));color:var(--op-encre);cursor:pointer;box-shadow:0 3px 0 var(--op-encre),0 6px 14px #0006}'
  +'body.tacrun #rt-go{display:none}'
  +'#rt-ui{position:fixed;z-index:9000;pointer-events:none;font:13px system-ui,-apple-system,"Segoe UI",sans-serif;color:#fdf6e3;overflow:hidden}'
  +'#rt-ui.rtgrab,body.rt-grab,body.rt-grab canvas{cursor:grabbing!important}'
  +'#rt-atmo{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}'
  +'#rt-tilt i{position:absolute;left:0;right:0;pointer-events:none;-webkit-backdrop-filter:blur(var(--tb,0px));backdrop-filter:blur(var(--tb,0px))}'
  +'#rt-tilt i:first-child{top:0;height:24%;-webkit-mask-image:linear-gradient(#000,transparent);mask-image:linear-gradient(#000,transparent)}#rt-tilt i:last-child{bottom:0;height:12%;-webkit-mask-image:linear-gradient(transparent,#000);mask-image:linear-gradient(transparent,#000)}'
  +'#rt-vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 75% 70% at 50% 48%,transparent 60%,rgba(0,0,0,.6) 100%)}'
  +'#rt-pz{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .25s;background:linear-gradient(180deg,#12121566,#12121522 30%,#12121522 70%,#12121566);box-shadow:inset 0 0 0 4px #f5c51866}#rt-ui.pz #rt-pz{opacity:1}'
  +'#rt-flash{position:absolute;inset:0;pointer-events:none;background:#fff8e0;opacity:0;mix-blend-mode:screen}'
  +'#rt-lbx i{position:absolute;left:0;right:0;height:9%;background:#05080d;transition:transform .35s cubic-bezier(.2,.8,.2,1)}#rt-lbx i:first-child{top:0;transform:translateY(-101%)}#rt-lbx i:last-child{bottom:0;transform:translateY(101%)}#rt-ui.cin #rt-lbx i{transform:none}'
  +'#rt-ui.cin .rt-hdr,#rt-ui.cin .rt-tl,#rt-ui.cin .rt-tr,#rt-ui.cin .rt-bot,#rt-ui.cin #rt-cmd,#rt-ui.cin .rt-minibox{opacity:.3;transition:opacity .2s}'
  +'.rt-hdr,.rt-tl,.rt-tr,.rt-bot,#rt-cmd,.rt-minibox{transition:opacity .3s}'
  +'#rt-intro{position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);opacity:0;text-align:center;pointer-events:none}'
  +'#rt-intro b{display:block;font:400 76px/1 var(--op-titre);letter-spacing:2px;color:var(--op-or);-webkit-text-stroke:3px var(--op-encre);paint-order:stroke fill;text-shadow:0 6px 0 var(--op-rouge),0 12px 28px #000a}'
  +'#rt-intro small{display:inline-block;margin-top:10px;font:700 13px system-ui,sans-serif;color:var(--op-encre);background:var(--op-par);border:2px solid var(--op-encre);border-radius:8px;padding:3px 10px}'
  /* découpe de compétence : bandeau oblique, portrait de la planche, nom de l'attaque en lettrage manga */
  +'#rt-cut{position:absolute;left:0;right:0;top:50%;height:150px;transform:translateY(-50%);pointer-events:none;opacity:0}'
  +'#rt-cut.on{animation:rtcut 1.5s cubic-bezier(.2,.8,.2,1) forwards}@keyframes rtcut{0%{opacity:0;transform:translateY(-50%) scaleY(.2)}10%{opacity:1;transform:translateY(-50%) scaleY(1)}80%{opacity:1}100%{opacity:0;transform:translateY(-50%) scaleY(1)}}'
  +'#rt-cut .bd{position:absolute;inset:18px 0;transform:skewY(-4deg);background:repeating-linear-gradient(100deg,var(--cf,#d62828) 0 34px,var(--cf2,#a01515) 34px 38px);box-shadow:0 0 0 4px var(--op-encre),0 0 0 7px var(--op-or),0 14px 30px #000a}'
  +'#rt-cut img{position:absolute;bottom:0;height:150px;left:12%;filter:drop-shadow(5px 5px 0 var(--op-encre));animation:rtcuti 1.5s ease-out forwards}@keyframes rtcuti{0%{transform:translateX(-60px)}100%{transform:translateX(30px)}}'
  +'#rt-cut .nm{position:absolute;left:34%;top:50%;transform:translateY(-55%) skewY(-4deg);font:400 54px/1 var(--op-titre);letter-spacing:2px;color:#fff;-webkit-text-stroke:3px var(--op-encre);paint-order:stroke fill;text-shadow:0 5px 0 var(--op-encre);white-space:nowrap}'
  +'#rt-cut .nm small{display:block;font:800 14px system-ui,sans-serif;letter-spacing:3px;-webkit-text-stroke:0;color:var(--op-or);text-shadow:0 2px 0 var(--op-encre);text-transform:uppercase;margin-bottom:4px}'
  /* boutons */
  +'#rt-ui button{white-space:nowrap;pointer-events:auto;font:800 12px system-ui,sans-serif;border-radius:9px;border:2px solid #060607;background:linear-gradient(180deg,#34343b,var(--op-mer2));color:#fff;padding:5px 10px;cursor:pointer;box-shadow:0 2px 0 #060607,inset 0 1px 0 #ffffff33}'
  +'#rt-ui button:hover{filter:brightness(1.15)}#rt-ui button:active{transform:translateY(2px);box-shadow:none}'
  +'#rt-ui button.pri,#rt-ui button.on{background:linear-gradient(180deg,#ffe066,var(--op-or2));color:var(--op-encre);border-color:var(--op-encre);box-shadow:0 2px 0 var(--op-encre),inset 0 1px 0 #fff8}'
  +'#rt-ui button.rouge{background:linear-gradient(180deg,#e64545,#9c1717)}#rt-ui button.rt-auto{background:linear-gradient(180deg,#3fb36b,#1f7a45)}#rt-ui button:disabled{opacity:.45;cursor:default;filter:none}'
  /* bandeau de bataille */
  +'.rt-hdr{position:absolute;left:50%;top:8px;transform:translateX(-50%);display:flex;align-items:stretch;gap:0;pointer-events:none;filter:drop-shadow(0 6px 10px #0009)}'
  +'.rt-camp{display:flex;align-items:center;gap:9px;padding:6px 16px 6px 10px;min-width:250px;background:linear-gradient(180deg,#1d1d22f2,#0e0e10f2);border:2px solid #060607;border-right:0;border-radius:14px 0 0 14px;box-shadow:inset 0 0 0 1px #f5c51844;clip-path:polygon(0 0,100% 0,96% 100%,0 100%)}'
  +'.rt-camp.eux{flex-direction:row-reverse;text-align:right;padding:6px 10px 6px 16px;border-radius:0 14px 14px 0;border:2px solid #060607;border-left:0;clip-path:polygon(0 0,100% 0,100% 100%,4% 100%);background:linear-gradient(180deg,#3a1414f2,#240a0af2)}'
  +'.rt-emb{flex:none;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:21px;color:#fff;background:radial-gradient(circle at 35% 30%,var(--f),var(--f2));border:2px solid var(--op-encre);box-shadow:0 0 0 2px var(--op-or),inset 0 -3px 0 #0004}'
  +'.rt-cn{display:flex;flex-direction:column;line-height:1.1;min-width:0}.rt-cn b{font:400 19px/1 var(--op-titre);letter-spacing:.8px;color:#fff}.rt-cn small{font-size:10.5px;color:#d6d2c8;font-weight:700}'
  +'.rt-cv{display:flex;align-items:baseline;gap:2px}.rt-big{font:400 30px/1 var(--op-titre);color:var(--op-or);-webkit-text-stroke:1px var(--op-encre);paint-order:stroke fill}.rt-cv small{font-size:11px;color:#d6d2c8}'
  +'.rt-cb{display:flex;flex-direction:column;gap:3px;min-width:74px}.rt-cb .rt-mb{width:74px}.rt-hh{display:flex;align-items:center;gap:4px;font-size:10px;font-weight:800;color:#efebe2}.rt-hh em{font-style:normal;width:38px;overflow:hidden;text-overflow:ellipsis}.rt-hh .rt-hp{width:34px;height:4px}.rt-hh.off{opacity:.4}'
  +'.rt-camp.eux .rt-hh{flex-direction:row-reverse}'
  +'.rt-medal{position:relative;width:96px;flex:none;margin:-4px -6px 0;z-index:1;display:flex;flex-direction:column;align-items:center}'
  +'.rt-medal svg{width:78px;height:78px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#fff6d8,var(--op-par2));border:3px solid var(--op-encre);box-shadow:0 0 0 3px var(--op-or),0 6px 0 var(--op-encre);transform:rotate(-90deg)}'
  +'.rt-r0{fill:none;stroke:#2a1a0c22;stroke-width:7}.rt-r1{fill:none;stroke:var(--op-or2);stroke-width:7;stroke-linecap:round;transition:stroke-dasharray .3s}.rt-r1.disp{stroke:var(--op-rouge);animation:rtdisp .8s infinite}@keyframes rtdisp{50%{opacity:.45}}'
  +'.rt-mt{position:absolute;top:19px;left:0;right:0;text-align:center;color:var(--op-encre);line-height:1}.rt-mt b{display:block;font:400 22px/1 var(--op-titre);letter-spacing:.5px}.rt-mt small{font-size:9.5px;font-weight:800;color:#6b4a22}'
  +'.rt-ml{margin-top:7px;font-size:9.5px;font-weight:900;letter-spacing:.4px;text-transform:uppercase;color:var(--op-encre);background:var(--op-par);border:2px solid var(--op-encre);border-radius:7px;padding:1px 6px;white-space:nowrap}'
  /* coin haut gauche : titre, mission, notifications */
  +'.rt-tl{position:absolute;left:10px;top:10px;width:228px;display:flex;flex-direction:column;gap:6px}'
  +'.rt-title{display:flex;flex-direction:column;line-height:1}.rt-title b{font:400 24px/1 var(--op-titre);letter-spacing:1px;color:var(--op-or);-webkit-text-stroke:1.5px var(--op-encre);paint-order:stroke fill;text-shadow:0 3px 0 var(--op-encre),0 6px 14px #0008}.rt-title small{font-size:10.5px;font-weight:700;color:#fff;text-shadow:0 1px 2px #000}'
  +'.rt-obj{pointer-events:auto;padding:7px 10px 8px;background:linear-gradient(180deg,var(--op-par),var(--op-par2));color:var(--op-encre);border:2px solid var(--op-encre);border-radius:10px;box-shadow:0 4px 0 var(--op-encre),0 8px 16px #0007}'
  +'.rt-obj p{margin:2px 0 5px;font-size:11.5px;line-height:1.3;font-weight:600}.rt-h{font:400 14px/1 var(--op-titre);letter-spacing:1px;color:var(--op-rouge)}.rt-obj .rt-h{color:var(--op-rouge)}'
  +'.rt-bar{height:7px;border-radius:5px;background:#2a1a0c22;overflow:hidden;border:1px solid #2a1a0c66}.rt-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--op-or2),var(--op-or))}'
  +'.rt-ob{display:flex;gap:4px;margin-top:6px;flex-wrap:wrap}#rt-ui .rt-ob button{font-size:10px;padding:2px 7px;border-radius:7px;background:linear-gradient(180deg,#fff7e2,#ead3a3);color:var(--op-encre);border-color:#2a1a0c88;box-shadow:0 1px 0 #2a1a0c88}#rt-ui .rt-ob button.on{background:linear-gradient(180deg,#ffe066,var(--op-or2))}'
  +'.rt-feed{display:flex;flex-direction:column;gap:4px}.rt-nt{font-size:11px;font-weight:700;line-height:1.25;padding:4px 8px;border-radius:8px;background:#0e0e10d9;border-left:3px solid var(--op-or);color:#fff;box-shadow:0 3px 8px #0006;transition:opacity .5s}.rt-nt em,#rt-jr em{font-style:normal;color:var(--op-or);font-weight:900}'
  +'#rt-jr{position:absolute;left:246px;top:10px;width:300px;max-height:46%;overflow:auto;pointer-events:auto;padding:8px 11px;display:flex;flex-direction:column;gap:3px;background:linear-gradient(180deg,#1d1d22f2,#0e0e10f2);border:2px solid #060607;border-radius:12px;box-shadow:inset 0 0 0 1px #f5c51844,0 8px 16px #0008}#rt-jr small{font-size:11px;color:#ece8de;line-height:1.35}#rt-jr .rt-h{color:var(--op-or);margin-top:3px}'
  /* coin haut droit : contrôles */
  +'.rt-tr{position:absolute;right:10px;top:10px;display:flex;flex-direction:column;align-items:flex-end;gap:6px}.rt-grp{display:flex;gap:0;pointer-events:auto;filter:drop-shadow(0 3px 6px #0007)}'
  +'#rt-ui .rt-grp button{border-radius:0;margin-left:-2px}#rt-ui .rt-grp button:first-child{border-radius:9px 0 0 9px;margin-left:0}#rt-ui .rt-grp button:last-child{border-radius:0 9px 9px 0}'
  +'#rt-ui #rt-pb{font:400 17px/1 var(--op-titre);letter-spacing:1px;padding:7px 16px;min-width:126px}'
  +'#rt-banner{position:absolute;left:50%;top:104px;transform:translateX(-50%);display:none;flex-direction:column;align-items:center;padding:6px 26px 7px;background:linear-gradient(180deg,var(--op-par),var(--op-par2));border:3px solid var(--op-encre);border-radius:12px;color:var(--op-encre);box-shadow:0 5px 0 var(--op-encre),0 10px 24px #000a;white-space:nowrap}'
  +'#rt-banner.on{display:flex}#rt-banner b{font:400 26px/1 var(--op-titre);letter-spacing:2px;color:var(--op-rouge)}#rt-banner small{font-size:11.5px;font-weight:700}'
  /* minicarte : cadre de bois */
  +'.rt-minibox{position:absolute;left:10px;bottom:10px;padding:6px 7px 6px;pointer-events:auto;display:flex;flex-direction:column;gap:4px;align-items:center;background:linear-gradient(180deg,#7a4a24,var(--op-bois));border:2px solid var(--op-encre);border-radius:12px;box-shadow:inset 0 0 0 2px #c48a3a77,0 8px 16px #0008}'
  +'.rt-mh{align-self:stretch;display:flex;justify-content:space-between;font:400 13px/1 var(--op-titre);letter-spacing:1px;color:var(--op-or)}.rt-mh span{font:800 10px system-ui;color:var(--op-par)}'
  +'#rt-mini{width:128px;height:183px;border-radius:6px;cursor:crosshair;border:2px solid var(--op-encre);box-shadow:inset 0 0 0 1px #0004}.rt-minibox small{font-size:9.5px;font-weight:700;color:var(--op-par);width:128px;text-align:center;line-height:1.2}'
  /* bas : fiche, ordres, cartes */
  +'.rt-bot{position:absolute;left:162px;right:392px;bottom:10px;display:flex;flex-direction:column;gap:6px;align-items:flex-start}'
  +'#rt-info{display:flex;gap:8px;flex-wrap:wrap;align-items:baseline;padding:4px 10px;font-size:11.5px;font-weight:700;color:#f4f1ea;background:#0e0e10e6;border:2px solid #060607;border-radius:9px;box-shadow:inset 0 0 0 1px #f5c51833}#rt-info b{font:400 15px/1 var(--op-titre);letter-spacing:.6px;color:var(--op-or)}#rt-info .tg{color:#9fe0a8}.rt-cause{color:var(--op-or);font-style:normal}'
  +'.rt-ord{display:flex;gap:5px;align-items:center;flex-wrap:wrap;pointer-events:none}.rt-ord>*{pointer-events:auto}'
  +'#rt-ui .rt-o{display:flex;align-items:center;gap:5px;padding:5px 9px}.rt-o i{font-style:normal;font-size:14px;line-height:1}.rt-o kbd{font:900 9.5px system-ui;padding:1px 4px;border-radius:4px;background:#0006;color:var(--op-or);border:1px solid #fff3}#rt-ui .rt-o.on kbd{background:#2a1a0c22;color:var(--op-encre)}'
  +'.rt-sep{width:2px;height:22px;background:#ffffff44;border-radius:2px}'
  +'.rt-hint{font-size:11.5px;color:var(--op-encre);background:var(--op-par);border:2px solid var(--op-encre);border-radius:9px;padding:4px 10px;box-shadow:0 3px 0 var(--op-encre)}'
  +'#rt-cards{display:flex;gap:7px;max-width:100%;overflow-x:auto;padding:4px 2px 2px;pointer-events:none}#rt-cards>*{pointer-events:auto}'
  +'#rt-ui .rt-card{position:relative;white-space:normal;overflow:hidden;display:flex;flex-direction:column;gap:2px;width:112px;flex:none;text-align:left;padding:13px 6px 5px;background:linear-gradient(180deg,var(--op-par),var(--op-par2));color:var(--op-encre);border:2px solid var(--op-encre);border-radius:8px;box-shadow:0 4px 0 var(--op-encre),0 7px 12px #0007;transition:transform .12s}'
  +'#rt-ui .rt-card::before{content:"";position:absolute;left:0;right:0;top:0;height:10px;background:var(--rt-camp,var(--op-pirate));border-bottom:2px solid var(--op-encre)}'
  +'#rt-ui .rt-card:hover{transform:translateY(-3px)}#rt-ui .rt-card.on{outline:3px solid var(--op-or);outline-offset:1px;transform:translateY(-5px);box-shadow:0 4px 0 var(--op-encre),0 0 18px #f5c518aa}.rt-card.off{opacity:.45;filter:grayscale(.8)}'
  +'.rt-pic{display:flex;align-items:flex-end;justify-content:center;height:62px;margin:0 -2px;background:radial-gradient(ellipse 60% 40% at 50% 92%,#2a1a0c33,transparent),linear-gradient(180deg,#fff8e6,#efdcb2);border:1px solid #2a1a0c55;border-radius:5px;overflow:hidden}.rt-pic img{max-height:60px;max-width:100%;image-rendering:auto}.rt-pic em{font-style:normal;font-size:30px;align-self:center}'
  +'.rt-card.hero .rt-pic{background:radial-gradient(circle at 50% 70%,#ffe9a6,#e8c27a)}'
  +'.rt-ct{display:flex;justify-content:space-between;gap:4px;align-items:baseline;margin-top:2px}.rt-ct b{font:400 13.5px/1 var(--op-titre);letter-spacing:.4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rt-ct span{font:400 16px/1 var(--op-titre);color:var(--op-rouge)}.rt-ct span small{font:800 9px system-ui;color:#6b4a22}'
  +'.rt-card small{font-weight:700;font-size:9.5px;color:#5a3b1d;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
  +'.rt-badge{position:absolute;top:-1px;right:4px;font:900 normal 8px system-ui,sans-serif;letter-spacing:.8px;color:#fff;line-height:11px}.rt-badge.man{color:var(--op-or)}'
  +'.rt-card.st-ebranle{--rt-camp:#e0a20b}.rt-card.st-desorg{--rt-camp:#e06a1b}.rt-card.st-deroute{--rt-camp:#7a1010}'
  +'.rt-mb{position:relative;display:block;height:7px;border-radius:4px;background:#2a1a0c33;overflow:visible;border:1px solid #2a1a0c66}.rt-mb b{display:block;height:100%;border-radius:3px;background:linear-gradient(90deg,#1f9a52,#46d27f)}.rt-mb b.moy{background:linear-gradient(90deg,#c98a06,#f2c230)}.rt-mb b.bas{background:linear-gradient(90deg,#a3121c,#e8414c)}'
  +'.rt-mb.hp b{background:linear-gradient(90deg,#a3121c,#ff4d5a)}.rt-mb u{position:absolute;top:-2px;width:2px;height:9px;background:var(--op-encre)}.rt-card .rt-mb{flex:none;height:7px}.rt-card>*{flex:none}'
  +'.rt-hp{display:block;height:5px;border-radius:3px;background:#ffffff33;overflow:hidden}.rt-hp b{display:block;height:100%;background:linear-gradient(90deg,#a3121c,#ff4d5a);border-radius:3px}.rt-hp.big{height:8px;border:1px solid #060607}'
  /* commandant : médaillon */
  +'#rt-cmd{position:absolute;right:10px;bottom:10px;width:372px;height:118px;pointer-events:auto;display:flex;align-items:center;gap:8px;padding:8px 10px 8px 8px;background:linear-gradient(180deg,#1d1d22f2,#0e0e10f2);border:2px solid #060607;border-radius:60px 14px 14px 60px;box-shadow:inset 0 0 0 1px #f5c51855,0 8px 18px #0009}#rt-cmd:empty{display:none}'
  +'.rt-por{flex:none;width:96px;height:96px;border-radius:50%;overflow:hidden;display:flex;align-items:flex-end;justify-content:center;background:radial-gradient(circle at 50% 35%,#fff3c4,#d9a84c);border:3px solid var(--op-encre);box-shadow:0 0 0 3px var(--op-or),inset 0 -6px 12px #0003}.rt-por img{height:92px;margin-bottom:-6px}.rt-por.off{filter:grayscale(1) brightness(.7)}'
  +'.rt-cmb{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}.rt-cnm{display:flex;align-items:baseline;gap:6px;flex-wrap:wrap}.rt-cnm b{font:400 22px/1 var(--op-titre);letter-spacing:1px;color:var(--op-or);-webkit-text-stroke:1px var(--op-encre);paint-order:stroke fill}.rt-cnm small{font-size:10.5px;font-weight:800;color:#d6d2c8}'
  +'#rt-ui .rt-cnm button{font-size:10.5px;padding:2px 7px}.rt-pas{font-size:9.5px;color:#d8d4ca;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}#rt-ui .rt-mini2{align-self:flex-start;font-size:9.5px;padding:2px 7px}'
  +'#rt-ui .rt-skill{position:relative;flex:none;align-self:flex-start;margin-top:4px;width:74px;height:74px;padding:0;border-radius:50%;display:grid;place-items:center;border:3px solid var(--op-encre);background:conic-gradient(var(--op-or) var(--u),#0e0e10 0);box-shadow:0 4px 0 var(--op-encre),0 6px 16px #000a}'
  +'#rt-ui .rt-skill i{width:56px;height:56px;border-radius:50%;display:grid;place-items:center;font:400 28px/1 var(--op-titre);font-style:normal;color:#fff;background:radial-gradient(circle at 40% 30%,#e64545,#8e1414);border:2px solid var(--op-encre);-webkit-text-stroke:1px var(--op-encre);paint-order:stroke fill}'
  +'#rt-ui .rt-skill span{position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:4px;max-width:120px;overflow:hidden;text-overflow:ellipsis;font:800 9.5px system-ui;color:var(--op-encre);background:var(--op-par);border:2px solid var(--op-encre);border-radius:6px;padding:1px 6px;white-space:nowrap}'
  +'#rt-ui .rt-skill:disabled{opacity:1}#rt-ui .rt-skill:disabled i{background:radial-gradient(circle at 40% 30%,#6b6b72,#2c2c31);color:#ece8de}'
  +'#rt-ui .rt-skill.pret{animation:rtpulse 1.1s infinite}#rt-ui .rt-skill.on i{background:radial-gradient(circle at 40% 30%,#ffe066,var(--op-or2));color:var(--op-encre)}@keyframes rtpulse{50%{box-shadow:0 4px 0 var(--op-encre),0 0 0 7px #f5c51866,0 6px 16px #000a}}'
  /* fin de bataille */
  +'#rt-end{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);min-width:440px;background:repeating-conic-gradient(from 0deg at 50% 0%,#f6e7c4 0deg 5deg,#ecd5a2 5deg 10deg);border:4px solid var(--op-encre);border-radius:18px;padding:22px 30px 18px;pointer-events:auto;text-align:center;color:var(--op-encre);box-shadow:0 0 0 4px var(--op-or),0 10px 0 var(--op-encre),0 26px 60px #000c;animation:rtend .5s cubic-bezier(.2,1.4,.4,1)}@keyframes rtend{0%{transform:translate(-50%,-50%) scale(.6);opacity:0}}'
  +'#rt-end .rt-ew{position:absolute;right:-64px;top:-96px;height:150px;pointer-events:none;filter:drop-shadow(4px 4px 0 var(--op-encre))}#rt-end.perdu .rt-ew{filter:grayscale(.6) drop-shadow(4px 4px 0 var(--op-encre))}'
  +'#rt-end h2{margin:0 0 4px;font:400 64px/1 var(--op-titre);letter-spacing:3px;color:var(--op-or);-webkit-text-stroke:3px var(--op-encre);paint-order:stroke fill;text-shadow:0 6px 0 var(--op-rouge)}#rt-end.perdu h2{color:#d6d2c8;text-shadow:0 6px 0 var(--op-mer)}'
  +'#rt-end p{margin:6px 0;font-weight:700;max-width:520px}#rt-end em{font-style:normal;color:#6b4a22}#rt-end table{margin:10px auto;font-size:12px;border-collapse:collapse}#rt-end th{font:400 15px var(--op-titre);letter-spacing:.6px;text-align:left;padding:3px 10px 3px 0}#rt-end td{padding:3px 8px;border-top:1px solid #2a1a0c33;text-align:left}'
  +'#rt-end .rt-note{font-size:11.5px;font-weight:600}.rt-eb{display:flex;gap:8px;justify-content:center;margin-top:10px}#rt-ui .rt-eb button{font:400 16px/1 var(--op-titre);letter-spacing:1px;padding:8px 16px}'
  +'#rt-ask{position:fixed;inset:0;z-index:9500;background:radial-gradient(ellipse,#12121588,#000b);display:flex;align-items:center;justify-content:center;font:13px system-ui,sans-serif;color:var(--op-encre)}#rt-ask[hidden]{display:none}'
  +'.rt-askb{background:linear-gradient(180deg,var(--op-par),var(--op-par2));border:3px solid var(--op-encre);border-radius:14px;padding:16px 22px;max-width:540px;box-shadow:0 0 0 4px var(--op-or),0 7px 0 var(--op-encre),0 18px 40px #000a}.rt-askb h3{margin:0 0 6px;font:400 30px/1 var(--op-titre);letter-spacing:1.5px;color:var(--op-rouge)}.rt-askb p{margin:6px 0;line-height:1.4}'
  +'.rt-askbt{display:flex;gap:8px;margin:10px 0;flex-wrap:wrap}.rt-askb button{font:800 13px system-ui,sans-serif;border-radius:9px;border:2px solid var(--op-encre);background:linear-gradient(180deg,#34343b,var(--op-mer2));color:#fff;padding:8px 14px;cursor:pointer;box-shadow:0 3px 0 var(--op-encre)}.rt-askb button.pri{background:linear-gradient(180deg,#ffe066,var(--op-or2));color:var(--op-encre)}.rt-askb small{color:#5a3b1d}'
  +'#rt-box{position:absolute;display:none;border:2px dashed var(--op-or);background:#f5c5181f}'
  +'#rt-lab{position:fixed;left:0;top:0;z-index:8990;pointer-events:none}'
  /* étiquettes au-dessus des groupes */
  +'.rt-tag{position:fixed;transform:translate(-50%,-100%);font:400 12.5px/1.1 var(--op-titre);letter-spacing:.5px;padding:2px 7px 3px;border-radius:8px;background:#121215e0;color:#fff;white-space:nowrap;display:flex;flex-direction:column;align-items:center;gap:2px;border:2px solid #060607;box-shadow:0 2px 6px #0007}'
  +'.rt-tag .rt-mb,.rt-tag .rt-hp{width:36px;height:4px}'
  +'.rt-tag.moi{border-color:var(--op-marine);box-shadow:inset 3px 0 0 var(--op-ciel),0 2px 6px #0007}.rt-tag.eux{background:#3a1010e0;border-color:#8e1414;box-shadow:inset 3px 0 0 var(--op-rouge),0 2px 6px #0007}.rt-tag.sel{border-color:var(--op-or);color:var(--op-or)}'
  +'.rt-step{position:fixed;transform:translate(-50%,-50%);font:900 11px system-ui,sans-serif;width:18px;height:18px;line-height:15px;text-align:center;border-radius:50%;background:var(--op-or);color:var(--op-encre);border:2px solid var(--op-encre)}'
  +'.rt-num{position:fixed;transform:translate(-50%,-100%);font:400 19px/1 var(--op-titre);color:var(--op-or);-webkit-text-stroke:1.5px var(--op-encre);paint-order:stroke fill;text-shadow:0 2px 0 var(--op-encre)}.rt-num.moi{color:#ff6b6b}'
  /* plein écran pendant la bataille : le champ de bataille prend tout l\'écran */
  +'body.rtrun .hud,body.rtrun #players,body.rtrun #phase,body.rtrun #side,body.rtrun .zoomctl,body.rtrun #mini,body.rtrun #selcard,body.rtrun #b-end,body.rtrun #log,body.rtrun #hint,body.rtrun #evbar,body.rtrun #brief,body.rtrun #evt,body.rtrun #cs-hud,body.rtrun #minibox,body.rtrun #gfx-btn,body.rtrun #gfx-demo,body.rtrun #tac-go,body.rtrun #rt-go,body.rtrun #op-dock,body.rtrun .tu-card{display:none!important}'
  +'body.rtrun .app{padding:0!important;gap:0!important;height:100vh!important;max-height:100vh}body.rtrun #main{display:block!important;height:100vh!important;margin:0!important;padding:0!important}body.rtrun #mapwrap{width:100vw!important;height:100vh!important;border-radius:0!important;border:0!important;margin:0!important;background:#05080d!important}';
  document.head.appendChild(st);
  const b=document.createElement('button');b.id='rt-go';b.type='button';b.textContent='Combat temps réel (essai)';b.title='Bataille en temps réel avec pause sur Alabasta : Marine de Garp contre Pirates d\'Ace (la partie n\'est pas modifiée)';
  b.addEventListener('click',e=>{e.stopPropagation();rtStart({side:0});});document.body.appendChild(b);}
RT.scr=(x,y,z)=>{const R=RT.run;if(!R||!R.cam)return null;const p=w3Proj(x,y,z===undefined?R.M.z(x,y):z,R.cam);if(!p)return null;const rc=W3.cv.getBoundingClientRect(),k=rc.width/W3.cv.width;return [rc.left+p.sx*k,rc.top+p.sy*k];};
RT.canSave=()=>svCanSave();RT.anims=rtAnims;RT.best=(h)=>rtSkillBest(RT.run,h);RT.demoSpec=rtDemoSpec;RT.fac=rtFac;RT.qualif=rtQualif;RT.isle=rtIsle;
window.__RT=RT;   /* essais */
/* mesures (lecture seule) : moteur, planches, compteurs de rendu */
RT.dbg={get W3(){return W3;},get TRP_DATA(){return TRP_DATA;},get TRP(){return TRP;},ui:R=>rtUI(R),frame:()=>{const t=performance.now();w3Frame();W3.gl.finish();return performance.now()-t;}};
