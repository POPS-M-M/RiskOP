/* RISK OP — progression permanente et commandants proposés par difficulté.
   Deux systèmes distincts :
   · la COLLECTION (permanente, ce navigateur) : les commandants débloqués au fil des parties ;
   · les commandants PROPOSÉS dans une partie : tirés au lancement, pour chaque camp, selon la difficulté
     (Facile 4, Normal 8, Difficile 16, Expert tous ceux du camp ; jamais plus que le camp n'en compte).
   Stockage : clé 'rk-prog', séparée du carnet 'gl-profile' (jamais réécrit ici). Les fiches LEGENDS / CHMETA ne sont pas modifiées.
   Une partie sauvegardée avant cette version (sans liste) garde tous les commandants de chaque camp. */

/* ---------- réglages ---------- */
const PG_N={easy:4,normal:8,hard:16,expert:99};
const PG_MUL={easy:.6,normal:1,hard:1.25,expert:1.5};
const PG_MAXR=30;
/* XP pour passer du rang r au rang r+1. Seule constante de rythme : environ 25 parties en Normal pour le rang 30. */
const pgCost=r=>100+6*(r-1);
const pgCum=r=>{let s=0;for(let k=1;k<r;k++)s+=pgCost(k);return s;};
const pgRank=xp=>{let r=1;while(r<PG_MAXR&&xp>=pgCum(r+1))r++;return r;};
const PG_TITLES=[[1,'Mousse'],[5,'Matelot'],[10,'Second'],[15,'Capitaine'],[20,'Grand capitaine'],[25,'Légende des mers'],[30,'Roi des mers']];
const pgTitle=r=>PG_TITLES.filter(t=>t[0]<=r).pop()[1];
const pgTitleRank=r=>r%5===0;              /* rangs 5, 10… 30 : nouveau titre + une relance du tirage */
/* équipage de départ : par camp, les 4 commandants aux conditions les plus simples (au moins 2 sans âge requis) */
const PG_START={pirate:['Nami','Zoro','Ace','Bartolomeo'],marine:['Smoker','Garp','Killingham','Sommers'],revo:['Ace','Ivankov','Koala','Rayleigh'],chasseur:['Zoro','Smoker','Rayleigh','Law']};
/* XP d'une partie : points d'actions (plafond 150 au total), + victoire, × difficulté */
const PG_ACT=[
  {k:'isl',n:'Îles conquises (différentes)',p:4,max:15},
  {k:'bw',n:'Batailles gagnées',p:2,max:10},
  {k:'bd',n:'Constructions achevées',p:4,max:6},
  {k:'tech',n:'Technologies',p:2,max:10},
  {k:'age',n:'Âges franchis',p:15,max:2},
  {k:'bk',n:'Boss vaincus',p:5,max:3},
  {k:'lt',n:'Commandants recrutés',p:3,max:3}
];
const PG_ACT_CAP=150,PG_WIN=150,PG_SHORT=15,PG_SHORT_CAP=20,PG_NET=40,PG_NET_WIN=60;
let PG=null;

/* ---------- état et stockage ---------- */
const pgLegIdx=s=>LEGENDS.findIndex(L=>L.s===s);
const pgValid=s=>typeof s==='string'&&pgLegIdx(s)>=0;
const pgIsL=i=>chMeta(i).r==='L';
function pgBlank(){return {v:1,xp:0,col:{},claimed:{},offers:{},fresh:[],recent:{},gids:[],w:{easy:0,normal:0,hard:0,expert:0},age:0,camps:{},rr:0,mig:0,seen:0,last:null};}
function pgSave(){try{localStorage.setItem('rk-prog',JSON.stringify(PG));}catch(_){}}
function pgLoad(){
  let o=null;try{o=JSON.parse(localStorage.getItem('rk-prog')||'null');}catch(_){o=null;}
  PG=pgBlank();
  if(!o||o.v!==1){pgMigrate();return;}
  PG.xp=Math.max(0,Math.min(1e7,+o.xp||0));
  if(o.col&&typeof o.col==='object')for(const k of Object.keys(o.col))if(pgValid(k))PG.col[k]=1;
  if(o.claimed&&typeof o.claimed==='object')for(const k of Object.keys(o.claimed))if(+k>=2&&+k<=PG_MAXR)PG.claimed[+k]=1;
  if(o.offers&&typeof o.offers==='object')for(const k of Object.keys(o.offers))if(Array.isArray(o.offers[k]))PG.offers[+k]=o.offers[k].filter(pgValid).slice(0,3);
  if(Array.isArray(o.fresh))PG.fresh=o.fresh.filter(pgValid).slice(-10);
  if(o.recent&&typeof o.recent==='object')for(const c of CREWS)if(Array.isArray(o.recent[c.id]))PG.recent[c.id]=o.recent[c.id].filter(pgValid).slice(0,40);
  if(Array.isArray(o.gids))PG.gids=o.gids.filter(g=>typeof g==='string').slice(-60);
  if(o.w)for(const k of Object.keys(PG.w))PG.w[k]=Math.max(0,o.w[k]|0);
  PG.age=Math.max(0,Math.min(2,o.age|0));
  if(o.camps)for(const c of CREWS)PG.camps[c.id]=Math.max(0,o.camps[c.id]|0);
  PG.rr=Math.max(0,Math.min(99,o.rr|0));PG.mig=o.mig|0;PG.seen=Math.max(0,o.seen|0);
  PG.last=o.last&&typeof o.last==='object'?o.last:null;
  for(const c of Object.keys(PG_START))for(const s of PG_START[c])PG.col[s]=1;
}
/* premier lancement de cette version : on part du carnet existant (rien n'est perdu) */
function pgMigrate(){
  for(const c of Object.keys(PG_START))for(const s of PG_START[c])PG.col[s]=1;
  let n=0;
  for(const k of Object.keys(PROFILE.rec||{}))if(pgValid(k)&&(PROFILE.rec[k]|0)>0){PG.col[k]=1;n++;}
  const g=PROFILE.games|0,w=PROFILE.wins|0;
  PG.xp=Math.min(pgCum(10),g*80+w*120);
  PG.mig=1;PG.migInfo={games:g,wins:w,rec:n};
  pgSave();
}
pgLoad();

/* ---------- récompenses ---------- */
const PG_LEG={
  'Barbe Noire':{r:6,t:'Prendre 1 capitale ennemie (au total de vos parties)',v:()=>PROFILE.tot.cp|0,n:1},
  'Akainu':{r:8,t:'Gagner 1 partie en Normal, Difficile ou Expert',v:()=>(PG.w.normal|0)+(PG.w.hard|0)+(PG.w.expert|0),n:1},
  'Shanks':{r:10,t:'Vaincre 3 boss (au total)',v:()=>PROFILE.tot.bk|0,n:3},
  'Barbe Blanche':{r:12,t:'Gagner 40 batailles (au total)',v:()=>PROFILE.tot.bw|0,n:40},
  'Big Mom':{r:14,t:'Atteindre l’âge III dans une partie',v:()=>PG.age>=2?1:0,n:1},
  'Kaido':{r:16,t:'Gagner 1 partie en Difficile ou Expert',v:()=>(PG.w.hard|0)+(PG.w.expert|0),n:1},
  'Luffy':{r:18,t:'Gagner 5 parties (au total)',v:()=>PROFILE.wins|0,n:5},
  'Loki':{r:20,t:'Déchiffrer 3 Poneglyphes (au total)',v:()=>PROFILE.tot.pz|0,n:3},
  'Roger':{r:24,t:'Gagner 1 partie en Expert',v:()=>PG.w.expert|0,n:1}
};
const pgRankNow=()=>pgRank(PG.xp);
function pgLegState(s){
  const d=PG_LEG[s];if(!d)return null;
  const have=!!PG.col[s],rk=pgRankNow()>=d.r,v=Math.min(d.n,d.v()),ok=rk&&v>=d.n;
  return {s,d,have,rk,v,ok,ready:ok&&!have};
}
/* rangs dont la récompense n'a pas encore été prise */
function pgPendingRanks(){const r=pgRankNow(),o=[];for(let k=2;k<=r;k++)if(!PG.claimed[k])o.push(k);return o;}
function pgPendingCount(){return pgPendingRanks().length+Object.keys(PG_LEG).filter(s=>pgLegState(s).ready).length;}
/* trois commandants au choix : rares, épiques, communs non encore débloqués, de préférence des camps que vous jouez */
function pgOffer(r){
  const cur=(PG.offers[r]||[]).filter(s=>!PG.col[s]);
  if(cur.length)return cur;
  const pool=LEGENDS.map((L,i)=>i).filter(i=>!pgIsL(i)&&!PG.col[LEGENDS[i].s]);
  if(!pool.length){PG.offers[r]=[];return [];}
  const w=i=>1+LEGENDS[i].camps.reduce((a,c)=>a+Math.min(5,PG.camps[c]|0),0);
  const out=[],left=pool.slice();
  while(out.length<3&&left.length){let tot=0;for(const i of left)tot+=w(i);let x=Math.random()*tot,k=0;for(;k<left.length-1;k++){x-=w(left[k]);if(x<=0)break;}out.push(LEGENDS[left[k]].s);left.splice(k,1);}
  PG.offers[r]=out;pgSave();return out;
}
function pgAdd(s){if(!PG.col[s]){PG.col[s]=1;PG.fresh.push(s);PG.fresh=PG.fresh.slice(-10);}}
function pgClaim(r,s){
  r=r|0;if(!pgPendingRanks().includes(r))return 'Cette récompense n’est pas disponible.';
  if(pgTitleRank(r)){PG.claimed[r]=1;PG.rr++;pgSave();return '';}
  const off=pgOffer(r);
  if(!off.length){PG.claimed[r]=1;PG.rr++;pgSave();return '';}   /* collection complète : la récompense devient une relance */
  if(!off.includes(s))return 'Choisissez un des commandants proposés.';
  pgAdd(s);PG.claimed[r]=1;delete PG.offers[r];pgSave();return '';
}
function pgClaimLeg(s){const st=pgLegState(s);if(!st||!st.ready)return 'Objectif non atteint.';pgAdd(s);pgSave();return '';}
/* découverte : recruter en solo un commandant qui n'est pas dans la collection l'y ajoute */
function pgDiscover(k){
  if(MODE!=='solo'||!PG||PG.col[k])return;
  pgAdd(k);pgSave();
  try{toast('Nouveau commandant dans votre collection : '+k+'.');}catch(_){}
}

/* ---------- commandants proposés dans une partie ---------- */
function pgRng(s){let a=s|0;return ()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
function pgDraw(arr,wf,k,rnd){
  const left=arr.slice(),out=[];
  while(out.length<k&&left.length){let tot=0;for(const i of left)tot+=wf(i);let x=rnd()*tot,j=0;for(;j<left.length-1;j++){x-=wf(left[j]);if(x<=0)break;}out.push(left[j]);left.splice(j,1);}
  return out;
}
const pgNoAge=i=>!LEGENDS[i].rec.age;
/* useCol : le camp du joueur humain en solo puise dans sa collection ; en ligne, la liste ne dépend que de la graine
   (identique chez l'hôte et chez chaque joueur, sans message réseau). */
function pgRoster(sd,dk,crews,humans,useCol){
  const N=PG_N[dk]||8,rnd=pgRng((sd|0)*7919+(Object.keys(PG_N).indexOf(dk)+1)*104729);
  const ro={},disc=[],taken=new Set();
  const seats=[0,1,2,3].filter(s=>crews[s]!==undefined).sort((a,b)=>(humans[b]?1:0)-(humans[a]?1:0)||a-b);
  for(const seat of seats){
    const cid=CREWS[crews[seat]].id;if(ro[cid])continue;
    const pool=LEGENDS.map((L,i)=>i).filter(i=>LEGENDS[i].camps.includes(cid));
    if(N>=pool.length){
      /* camp entier (Expert, ou camp plus petit que le nombre prévu) : ce qui manque à la collection est « À découvrir » */
      ro[cid]=pool.map(i=>LEGENDS[i].s);
      if(useCol&&humans[seat])for(const s of ro[cid])if(!PG.col[s])disc.push(s);
      continue;
    }
    /* Facile : pas de commandant en double entre camps quand le camp en a assez (le camp du joueur est servi en premier) */
    let cand=dk==='easy'?pool.filter(i=>!taken.has(i)):pool.slice();
    if(cand.length<N)cand=pool.slice();
    const pick=[];const col=useCol&&humans[seat];
    if(col){
      const own=cand.filter(i=>PG.col[LEGENDS[i].s]),fr=own.filter(i=>PG.fresh.includes(LEGENDS[i].s));
      for(const i of pgDraw(fr,()=>1,Math.ceil(N/2),rnd))pick.push(i);
      const rec=PG.recent[cid]||[];
      for(const i of pgDraw(own.filter(i=>!pick.includes(i)),i=>rec.includes(LEGENDS[i].s)?.35:1,N-pick.length,rnd))pick.push(i);
      if(pick.length<N)for(const i of pgDraw(cand.filter(i=>!pick.includes(i)&&!pgIsL(i)),()=>1,N-pick.length,rnd)){pick.push(i);disc.push(LEGENDS[i].s);}
    }else for(const i of pgDraw(cand,()=>1,N,rnd))pick.push(i);
    if(dk==='easy'){
      /* au moins 2 commandants sans âge requis : on remplace le dernier tiré qui en demande un */
      let guard=0;
      while(pick.filter(pgNoAge).length<2&&guard++<4){
        const opts=pool.filter(i=>pgNoAge(i)&&!pick.includes(i)&&!pgIsL(i));
        const add=(col?opts.find(i=>PG.col[LEGENDS[i].s]):undefined)??opts[0];
        const out=pick.slice().reverse().find(i=>!pgNoAge(i));
        if(add===undefined||out===undefined)break;
        pick[pick.indexOf(out)]=add;
        const di=disc.indexOf(LEGENDS[out].s);if(di>=0)disc.splice(di,1);
        if(col&&!PG.col[LEGENDS[add].s])disc.push(LEGENDS[add].s);
      }
    }
    for(const i of pick)taken.add(i);
    ro[cid]=pick.map(i=>LEGENDS[i].s);
  }
  return {ro,disc};
}
/* liste en vigueur (null = partie d'avant cette version : tous les commandants du camp) */
function pgRosterNow(){
  if(MODE==='client'&&players.length){
    const key=seed+'|'+diffKey+'|'+players.map(p=>p.crew).join(',')+'|'+players.map(p=>p.human?1:0).join('');
    if(RK.roKey!==key){RK.roKey=key;const r=pgRoster(seed,diffKey,players.map(p=>p.crew),players.map(p=>!!p.human),false);RK.roster=r.ro;RK.disc=[];}
  }
  return RK.roster||null;
}
const pgOffered=(cid,s)=>{const ro=pgRosterNow();return !ro||!ro[cid]||ro[cid].includes(s);};
const pgIsDisc=s=>MODE==='solo'&&Array.isArray(RK.disc)&&RK.disc.includes(s)&&!PG.col[s];

/* appelé après chaque newGame (solo, hôte, campagne, tutoriel) */
function pgNewGame(sd){
  if(MODE==='client')return;
  const r=pgRoster(sd,diffKey,players.map(p=>p.crew),players.map(p=>!!p.human),MODE==='solo');
  RK.roster=r.ro;RK.disc=r.disc;RK.roKey='';
  RK.coal=-1;
  RK.gid=(sd|0)+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
  RK.pgOver=null;
}
function newGame(sd,dk,o){newGame_o(sd,dk,o);try{pgNewGame(sd);}catch(_){RK.roster=null;RK.disc=[];}}
/* îles conquises comptées une seule fois (reprendre la même île ne rapporte pas d'XP) */
function rkCqT(o,t){const p=players[o];if(!p||!p.x||!t)return;const a=p.x.cqi||(p.x.cqi=[]);if(!a.includes(t.id))a.push(t.id);}

/* ---------- fin de partie : XP ---------- */
function pgActions(){
  const p=players[ME],st=(p&&p.x&&p.x.st)||{};
  const v={isl:Array.isArray(p&&p.x&&p.x.cqi)?p.x.cqi.length:Math.min(15,st.cq|0),bw:st.bw|0,bd:st.bd|0,tech:p?Object.keys(p.techs||{}).length:0,age:AG.n|0,bk:st.bk|0,lt:st.lt|0};
  const rows=PG_ACT.map(a=>({n:a.n,v:v[a.k],pts:Math.min(a.max,v[a.k])*a.p,max:a.max*a.p}));
  return {rows,sum:Math.min(PG_ACT_CAP,rows.reduce((s,r)=>s+r.pts,0))};
}
function pgEnd(win){
  if(!PG||!over||RK.pgOver===over)return;RK.pgOver=over;
  if(MODE==='client'&&!RK.gid)RK.gid='net-'+seed+'-'+(NET.code||'');
  const gid=RK.gid||'';
  if(gid&&PG.gids.includes(gid)){PG.last={dup:1};pgSave();return;}
  const dk=PG_MUL[diffKey]?diffKey:'normal',m=PG_MUL[dk];
  let act=0,rows=[],short=false;
  if(MODE==='solo'){
    const A=pgActions();rows=A.rows;act=A.sum;
    short=(TM.on?TM.n:time/TURN_LEN)<PG_SHORT;
    if(short&&!win)act=Math.min(act,PG_SHORT_CAP);
  }else{act=PG_NET;rows=[{n:'Partie en ligne terminée',v:1,pts:PG_NET,max:PG_NET}];}
  const wb=win?(MODE==='solo'?PG_WIN:PG_NET_WIN):0;
  const xp=Math.round((act+wb)*m),r0=pgRankNow();
  PG.xp+=xp;
  if(win)PG.w[dk]=(PG.w[dk]|0)+1;
  PG.age=Math.max(PG.age,AG.n|0);
  const me=players[ME];const cid=me?CREWS[me.crew||0].id:'';
  if(cid)PG.camps[cid]=(PG.camps[cid]|0)+1;
  if(MODE==='solo'&&RK.roster&&cid&&RK.roster[cid]){
    PG.recent[cid]=RK.roster[cid].slice();
    PG.fresh=PG.fresh.filter(s=>!RK.roster[cid].includes(s));
  }
  if(gid){PG.gids.push(gid);PG.gids=PG.gids.slice(-60);}
  PG.last={xp,act,wb,m,dk,rows,short,win:!!win,r0,r1:pgRankNow()};
  pgSave();
}

/* ---------- relance du tirage (récompense des rangs 5, 10…) ---------- */
function pgReroll(){
  if(MODE!=='solo')return 'La relance n’existe qu’en solo (en ligne, la liste est commune).';
  if(PG.rr<1)return 'Aucune relance disponible (rangs 5, 10, 15…).';
  if((TM.on?TM.n>1:time>60)||chOwnedBy(ME).length)return 'La relance se fait au début de la partie, avant tout recrutement.';
  const cid=CREWS[players[ME].crew||0].id,all=LEGENDS.filter(L=>L.camps.includes(cid)).length;
  if(!RK.roster||!RK.roster[cid]||RK.roster[cid].length>=all)return 'Tous les commandants de votre camp sont déjà proposés.';
  const r=pgRoster((Math.random()*1e9)|0,diffKey,players.map(p=>p.crew),players.map(p=>!!p.human),true);
  RK.roster[cid]=r.ro[cid];RK.disc=r.disc;PG.rr--;pgSave();return '';
}

/* ---------- fiche courte (recrutement) ---------- */
const pgMissing=(p,i)=>recConds(p,i).filter(x=>!x.ok);
function pgTop2(M){return M.st.map((v,j)=>[v,j]).sort((a,b)=>b[0]-a[0]||a[1]-b[1]).slice(0,2).map(([v,j])=>STN[j]+' <b>'+v+'</b>').join(' · ');}
function pgShortCard(i,p,dim){
  const L=LEGENDS[i],M=chMeta(i),R=RAR[M.r],miss=dim?[]:pgMissing(p,i),why=dim?'x':hireReason(p,i),open=RK.chOpen===i;
  const need=dim?'Pas proposé dans cette partie : il peut l’être à la prochaine partie, ou en difficulté plus élevée.':miss.length?'Il vous manque : '+esc(miss[0].t)+(miss.length>1?' <span class="muted">(et '+(miss.length-1)+' autre'+(miss.length>2?'s':'')+')</span>':''):chOwnedBy(ME).length>=chSlots()?'Conditions remplies, mais état-major complet.':'Prêt à rejoindre votre état-major.';
  return '<div class="chc pgs'+(dim?' dim':'')+'" style="--rc:'+R.col+'">'+ilCardThumb(i)
    +'<div class="t"><b style="color:'+R.col+'">♛ '+esc(L.s)+'</b><span class="rar" style="border-color:'+R.col+';color:'+R.col+'">'+R.n+'</span><span class="muted">'+esc(M.role)+'</span>'+(pgIsDisc(L.s)?'<span class="pgnew" title="Le recruter l’ajoute définitivement à votre collection">À découvrir</span>':'')+'</div>'
    +'<div class="ln"><i>◆</i><span>'+pgTop2(M)+'</span></div>'
    +'<div class="ln"><i>⚡</i><span><b>'+esc(M.sk.n)+'</b> : '+esc(rkChUse(i))+'</span></div>'
    +'<div class="ln '+(dim?'':miss.length?'miss':'ready')+'"><i>'+(dim?'·':miss.length?'✗':'✓')+'</i><span>'+need+'</span></div>'
    +'<div class="acts">'+(dim?'':btn('hire',i,'Recruter · '+recCost(p,i)+' ฿',!!why))+btn('chmore',i,open?'Masquer la fiche':'Fiche détaillée',false)+'</div>'
    +(open?chCard(i,p,dim?'dim':'hire'):'')+'</div>';
}
function pgSec(k,title,items,p,dim,openDef){
  if(!items.length)return '';
  const open=RK.sec&&k in RK.sec?RK.sec[k]:openDef;
  return '<div class="card"><button class="pgsec" data-act="pgsec" data-v="'+k+'" aria-expanded="'+open+'"><span>'+(open?'▾':'▸')+'</span> '+title+' ('+items.length+')</button>'+(open?items.map(i=>pgShortCard(i,p,dim)).join(''):'')+'</div>';
}
function pgRecruitHTML(p){
  const cr=CREWS[p.crew||0],ro=pgRosterNow();
  const camp=LEGENDS.map((L,i)=>i).filter(i=>CH[i].own<0&&LEGENDS[i].camps.includes(cr.id)).sort((a,b)=>RAR_W[chMeta(a).r]-RAR_W[chMeta(b).r]||a-b);
  const off=camp.filter(i=>pgOffered(cr.id,LEGENDS[i].s)),no=camp.filter(i=>!pgOffered(cr.id,LEGENDS[i].s));
  const nm=i=>pgMissing(p,i).length;
  const now=off.filter(i=>nm(i)===0),almost=off.filter(i=>nm(i)===1),later=off.filter(i=>nm(i)>1);
  const tot=LEGENDS.filter(L=>L.camps.includes(cr.id)).length,prop=ro&&ro[cr.id]?ro[cr.id].length:tot;
  let h='<div class="card pghead"><p class="note">'+(ro?'Commandants proposés pour cette partie : <b>'+prop+'</b> sur '+tot+' ('+esc(DIFF[diffKey].n)+'). ':'Tous les commandants de votre camp sont proposés. ')
    +(MODE==='solo'?'Votre collection : <b>'+Object.keys(PG.col).length+'</b> / '+LEGENDS.length+'.':'')+'</p>'
    +(MODE==='solo'&&PG.rr>0&&ro&&ro[cr.id]&&prop<tot&&(TM.on?TM.n<=1:time<=60)&&!chOwnedBy(ME).length?btn('pgrr','','Relancer la liste ('+PG.rr+' relance'+(PG.rr>1?'s':'')+')',false):'')+'</div>';
  h+=now.length?pgSec('now','Recrutables maintenant',now,p,false,true):'<div class="card"><h3>Recrutables maintenant (0)</h3><p class="note">Personne pour l’instant : regardez « Presque », il n’y manque qu’une condition.</p></div>';
  h+=pgSec('almost','Presque : il manque une seule condition',almost,p,false,true);
  h+=pgSec('later','Plus tard',later,p,false,false);
  h+=pgSec('no','Pas proposés dans cette partie',no,p,true,false);
  return h;
}

/* ---------- écran Progression ---------- */
const pgRewardName=r=>pgTitleRank(r)?'titre « '+pgTitle(r)+' » + 1 relance du tirage':'choisir un nouveau commandant';
function pgBarHTML(pct,lbl){return '<div class="pgbar" role="progressbar" aria-label="'+esc(lbl)+'" aria-valuenow="'+pct+'" aria-valuemin="0" aria-valuemax="100"><i style="width:'+pct+'%"></i></div>';}
function pgRankInfo(){const r=pgRankNow(),x0=pgCum(r),x1=r<PG_MAXR?pgCum(r+1):x0;return {r,x0,x1,in:PG.xp-x0,need:x1-x0,pct:r<PG_MAXR?Math.max(0,Math.min(100,Math.round((PG.xp-x0)/(x1-x0)*100))):100};}
function pgBandHTML(){
  const I=pgRankInfo(),n=pgPendingCount();
  return '<div class="pgband"><div class="pgr"><b>Rang '+I.r+'</b> · '+pgTitle(I.r)+'</div>'+pgBarHTML(I.pct,'Expérience vers le rang suivant')
    +'<div class="pgn">'+(I.r<PG_MAXR?I.in+' / '+I.need+' XP · Rang '+(I.r+1)+' : '+pgRewardName(I.r+1):'Rang maximal atteint')+'</div>'
    +'<button class="btn'+(n?' primary':'')+'" data-pg="open">Progression'+(n?' <span class="pgdot" title="Déblocages disponibles">'+n+'</span>':'')+'</button></div>';
}
function pgLegCond(L){const r=L.rec,o=[];for(const n of r.isl||[])o.push('tenir '+n);if(r.age)o.push('âge '+AGES[r.age].n);if(r.prime)o.push('prime '+fmtPrime(r.prime));if(r.ter)o.push(r.ter+' territoires');if(r.war)o.push('être en guerre');o.push(r.cost+' ฿ environ');return o.join(' · ');}
function pgMini(s,act){
  const i=pgLegIdx(s),L=LEGENDS[i],M=chMeta(i),R=RAR[M.r];
  return '<div class="pgmini" style="--rc:'+R.col+'"><div class="t"><b style="color:'+R.col+'">♛ '+esc(L.s)+'</b><span class="rar" style="border-color:'+R.col+';color:'+R.col+'">'+R.n+'</span><span class="muted">'+esc(M.role)+'</span></div>'
    +'<div class="ln">'+L.camps.map(c=>{const C=CREWS.find(x=>x.id===c);return C?C.ic+' '+C.n:'';}).join(' · ')+'</div>'
    +'<div class="ln">'+pgTop2(M)+'</div><div class="ln"><b>'+esc(M.sk.n)+'</b> : '+esc(rkChUse(i))+'</div>'
    +'<div class="ln muted">En partie : '+esc(pgLegCond(L))+'</div>'+(act||'')+'</div>';
}
function pgOpen(){RK.pgOpen=true;PG.seen=pgPendingCount();pgSave();pgRender();}
function pgRender(){
  let el=$('#pgm');
  if(!RK.pgOpen){if(el)el.hidden=true;return;}
  if(!el){el=document.createElement('div');el.id='pgm';el.className='rkm';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Progression');document.body.appendChild(el);}
  el.hidden=false;
  const I=pgRankInfo(),pend=pgPendingRanks(),legR=Object.keys(PG_LEG).filter(s=>pgLegState(s).ready);
  let h='<div class="rkb pgb"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h2>Progression</h2><button data-pg="close" aria-label="Fermer">✕</button></div>'
    +'<div class="pgband big"><div class="pgr"><b>Rang '+I.r+'</b> · '+pgTitle(I.r)+'<span class="muted"> · '+PG.xp+' XP au total</span></div>'+pgBarHTML(I.pct,'Expérience vers le rang suivant')
    +'<div class="pgn">'+(I.r<PG_MAXR?I.in+' / '+I.need+' XP pour le rang '+(I.r+1):'Rang maximal atteint')+(PG.rr?' · Relances du tirage : <b>'+PG.rr+'</b>':'')+'</div></div>';
  if(PG.migInfo&&!PG.migSeen)h+='<p class="advnote">Votre carnet existant a été repris : '+PG.migInfo.games+' partie(s), '+PG.migInfo.wins+' victoire(s) et '+PG.migInfo.rec+' commandant(s) déjà recruté(s) sont comptés.</p>';
  if(RK.pgMsg)h+='<p class="verdict '+(RK.pgMsg.ok?'pos':'neg')+'" role="status">'+esc(RK.pgMsg.t)+'</p>';
  /* 1. disponibles maintenant */
  h+='<h3>À débloquer maintenant'+(pend.length+legR.length?' <span class="pgdot">'+(pend.length+legR.length)+'</span>':'')+'</h3>';
  if(!pend.length&&!legR.length)h+='<p class="note">Rien en attente. Terminez une partie pour gagner de l’expérience.</p>';
  for(const r of pend){
    if(pgTitleRank(r)){h+='<div class="pgrw"><div><b>Rang '+r+'</b> : '+pgRewardName(r)+'</div><button class="btn primary" data-pg="claim:'+r+'">Recevoir</button></div>';continue;}
    const off=pgOffer(r);
    if(!off.length){h+='<div class="pgrw"><div><b>Rang '+r+'</b> : collection complète, la récompense devient 1 relance.</div><button class="btn primary" data-pg="claim:'+r+'">Recevoir</button></div>';continue;}
    h+='<div class="pgrw"><div><b>Rang '+r+'</b> : choisissez un commandant (il rejoint définitivement votre collection)</div><div class="pgcards">'+off.map(s=>pgMini(s,'<button class="btn primary" data-pg="claim:'+r+':'+esc(s)+'">Choisir '+esc(s)+'</button>')).join('')+'</div></div>';
  }
  for(const s of legR)h+='<div class="pgrw"><div><b>Légendaire</b> : objectif atteint</div><div class="pgcards">'+pgMini(s,'<button class="btn primary" data-pg="leg:'+esc(s)+'">Débloquer '+esc(s)+'</button>')+'</div></div>';
  /* 2. prochaines récompenses */
  const nx=[];for(let r=I.r+1;r<=Math.min(PG_MAXR,I.r+3);r++)nx.push('<li><b>Rang '+r+'</b> ('+(pgCum(r)-PG.xp)+' XP restants) : '+pgRewardName(r)+'</li>');
  h+='<h3>Prochaines récompenses</h3>'+(nx.length?'<ul class="pgl">'+nx.join('')+'</ul>':'<p class="note">Tous les rangs sont atteints.</p>');
  /* 3. objectifs (au plus 3) */
  const obj=Object.keys(PG_LEG).map(pgLegState).filter(x=>!x.have&&!x.ready).sort((a,b)=>a.d.r-b.d.r).slice(0,3);
  h+='<h3>Objectifs</h3>'+(obj.length?obj.map(x=>'<div class="pgobj"><div><b>'+esc(x.s)+'</b> (légendaire) : '+esc(x.d.t)+' · rang '+x.d.r+' '+(x.rk?'<span style="color:var(--good)">✓</span>':'<span class="muted">(vous êtes rang '+I.r+')</span>')+'</div>'+pgBarHTML(Math.round(x.v/x.d.n*100),x.d.t)+'<div class="pgn">'+x.v+' / '+x.d.n+'</div></div>').join(''):'<p class="note">Tous les légendaires sont débloqués.</p>');
  /* 4. collection */
  const camps=CREWS.map(c=>{const all=LEGENDS.filter(L=>L.camps.includes(c.id)),have=all.filter(L=>PG.col[L.s]).length;return '<span class="pgcamp">'+c.ic+' '+c.n+' <b>'+have+'</b>/'+all.length+'</span>';}).join('');
  h+='<h3>Collection · '+Object.keys(PG.col).length+' / '+LEGENDS.length+'</h3><div class="pgcamps">'+camps+'</div><div class="pgcol">'
    +LEGENDS.map((L,i)=>{const M=chMeta(i),R=RAR[M.r],have=!!PG.col[L.s],lg=PG_LEG[L.s];
      const how=have?'Débloqué':lg?'Rang '+lg.r+' + '+lg.t:'Récompense de rang, ou à découvrir en partie';
      return '<span class="pgchip'+(have?'':' off')+'" style="--rc:'+R.col+'" title="'+esc(L.s+' · '+R.n+' · '+how)+'">'+(have?'':'🔒 ')+esc(L.s)+'</span>';}).join('')+'</div>'
    +'<p class="note">En Expert, tous les commandants de votre camp sont proposés, même ceux pas encore débloqués : en recruter un l’ajoute à la collection.</p>';
  /* 5. dernière partie */
  const ls=PG.last;
  if(ls)h+='<h3>Dernière partie</h3>'+(ls.dup?'<p class="note">Cette partie avait déjà rapporté son expérience (sauvegarde rechargée) : rien de plus.</p>':pgLastHTML(ls));
  h+='<details class="pgrules"><summary>Comment gagner de l’expérience</summary><ul class="pgl">'+PG_ACT.map(a=>'<li>'+a.n+' : '+a.p+' pts (au plus '+a.max+')</li>').join('')
    +'<li>Points d’actions plafonnés à '+PG_ACT_CAP+' par partie. Victoire : +'+PG_WIN+'.</li><li>Multiplicateur : Facile ×0,6 · Normal ×1 · Difficile ×1,25 · Expert ×1,5.</li><li>Défaite en moins de '+PG_SHORT+' tours : actions plafonnées à '+PG_SHORT_CAP+'. Une partie abandonnée ne rapporte rien ; une sauvegarde rechargée ne rapporte pas deux fois.</li><li>En ligne : '+PG_NET+' XP par partie terminée, +'+PG_NET_WIN+' en cas de victoire (× difficulté).</li></ul></details></div>';
  el.innerHTML=h;
  if(PG.migInfo)PG.migSeen=1;
}
function pgLastHTML(ls){
  return '<div class="pglast"><p><b>+'+ls.xp+' XP</b> · '+(ls.win?'victoire':'défaite')+' · '+esc((DIFF[ls.dk]||DIFF.normal).n)+' (×'+String(ls.m).replace('.',',')+')'+(ls.r1>ls.r0?' · <b style="color:var(--accent)">Rang '+ls.r1+' atteint !</b>':'')+'</p>'
    +'<ul class="pgl">'+(ls.rows||[]).map(r=>'<li>'+esc(r.n)+' : '+r.v+' → '+r.pts+' pts</li>').join('')+'<li>Actions retenues : '+ls.act+(ls.short?' (partie courte)':'')+' · victoire : +'+ls.wb+'</li></ul></div>';
}
function pgEndHTML(){
  const ls=PG&&PG.last;if(!ls||RK.pgOver!==over)return '';
  if(ls.dup)return '<p class="note">Expérience : cette partie l’avait déjà rapportée.</p>';
  const n=pgPendingCount();
  return '<div class="pgend">'+pgLastHTML(ls)+(n?'<p class="note" style="color:var(--accent)">'+n+' déblocage'+(n>1?'s':'')+' disponible'+(n>1?'s':'')+'.</p>':'')+pgBandHTML()+'</div>';
}
function pgClick(e){
  const b=e.target.closest('[data-pg]');if(!b||b.disabled)return;
  const [a,x,y]=b.dataset.pg.split(':');RK.pgMsg=null;
  if(a==='open'){pgOpen();return;}
  if(a==='close'){RK.pgOpen=false;pgRender();pgBandRefresh();return;}
  if(a==='claim'){const m=pgClaim(+x,y);RK.pgMsg=m?{ok:false,t:m}:{ok:true,t:y?y+' rejoint votre collection.':'Récompense reçue.'};}
  else if(a==='leg'){const m=pgClaimLeg(x);RK.pgMsg=m?{ok:false,t:m}:{ok:true,t:x+' rejoint votre collection.'};}
  pgRender();
}
/* le bandeau (accueil, fin de partie) suit les déblocages pris dans l'écran Progression */
function pgBandRefresh(){for(const el of document.querySelectorAll('.pgband:not(.big)')){const t=document.createElement('div');t.innerHTML=pgBandHTML();el.replaceWith(t.firstChild);}}
document.addEventListener('click',pgClick);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&RK.pgOpen){RK.pgOpen=false;pgRender();pgBandRefresh();}});

/* ---------- difficultés : règles stratégiques (pas seulement des chiffres) ---------- */
/* Coalition : quand un camp (humain OU IA) mène largement, les IA s'unissent contre lui.
   Difficile : à partir de l'âge II, seuil 1,5× le score du deuxième. Expert : dès l'âge I, seuil 1,3×.
   Dissoute quand l'écart retombe sous 1,2×. Toutes les conditions de victoire restent valables. */
const COAL={hard:{age:1,on:1.5},expert:{age:0,on:1.3}},COAL_OFF=1.2,COAL_MIN=30,EASY_PEACE=240;
function rkCoalTick(){
  const c=COAL[diffKey];
  if(!c||MODE==='client'){RK.coal=-1;return;}
  if(!(RK.coal>=-1))RK.coal=-1;
  const alive=players.filter(p=>p.alive);
  if(alive.length<3||AG.n<c.age){if(RK.coal>=0)rkCoalEnd('');return;}
  if(RK.coal>=0){
    const L=players[RK.coal];
    const best=Math.max(1,...alive.filter(p=>p.id!==RK.coal).map(scoreOf));
    if(!L||!L.alive||scoreOf(L)<COAL_OFF*best)rkCoalEnd(L&&L.alive?' : son avance s’est réduite':'');
    return;
  }
  const sc=alive.map(p=>({id:p.id,s:scoreOf(p)})).sort((a,b)=>b.s-a.s);
  if(sc[0].s>=COAL_MIN&&sc[0].s>c.on*Math.max(1,sc[1].s)){
    RK.coal=sc[0].id;const L=players[RK.coal];
    addLog('⚔ Coalition : les autres camps s’unissent contre '+L.name+', qui mène largement (alliance contre le meneur).','#f2c75c');
    if(L.id===ME&&MODE!=='client')try{toast('Coalition : vous menez trop largement, les IA s’allient contre vous. Elle se dissout si votre avance retombe sous 1,2× le deuxième.');}catch(_){}
  }
}
function rkCoalEnd(why){const L=players[RK.coal];RK.coal=-1;if(L)addLog('Coalition contre '+L.name+' dissoute'+why+'.','#9aa3ad');}
const rkCoalMember=id=>RK.coal>=0&&id!==RK.coal&&players[id]&&players[id].alive&&vas[id]!==RK.coal;
const rkCoalPair=(a,b)=>rkCoalMember(a)&&rkCoalMember(b);
/* une IA coalisée refuse la paix avec le meneur, sauf si elle est au bord de la ruine */
const rkCoalNoPeace=(q,p)=>RK.coal===p&&rkCoalMember(q)&&strength(q)>=.35*strength(p);
function rkCoalDiplo(p){
  rkCoalTick();
  if(!rkCoalMember(p.id))return;
  const L=RK.coal;
  const tot=players.filter(q=>rkCoalMember(q.id)).reduce((a,q)=>a+strength(q.id),0);
  if(rel[p.id][L]==='peace'&&time>=truce[p.id][L]&&terrs.some(t=>t.owner===p.id&&t.nb.some(n=>terrs[n].owner===L))&&tot>.6*strength(L)&&Math.random()<.35)declareWar(p.id,L);   /* plusieurs fronts à la fois : 60 % de la force du meneur suffit */
  for(const q of players){
    if(q.id===p.id||!rkCoalPair(p.id,q.id))continue;
    if(rel[p.id][q.id]==='war'&&Math.random()<.25)propose(p.id,q.id,'peace');
    else if(rel[p.id][q.id]==='peace'&&isWar(p.id,L)&&Math.random()<.2)propose(p.id,q.id,'alliance');
  }
}
/* Expert : les IA coalisées concentrent leurs attaques sur le meneur */
const rkCoalFocus=(p,x)=>diffKey==='expert'&&RK.coal>=0&&x.owner===RK.coal&&p.id!==RK.coal&&!p.human;
/* Facile : aucune IA ne déclare la guerre à un joueur HUMAIN avant EASY_PEACE (entre IA : comme en Normal) */
const rkPeaceT=q=>(diffKey==='easy'&&players[q]&&players[q].human?EASY_PEACE:170)*PK;

/* fiche des règles de la difficulté : affichée avant le lancement et dans « Règles » */
function pgRulesText(dk,pk){
  pk=pk>0?pk:PK;
  const D=DIFF[dk]||DIFF.normal,n=PG_N[dk]||8,pct=v=>(v>=1?'+':'')+Math.round((v-1)*100)+' %';
  const peace=(dk==='easy'?EASY_PEACE:170)*pk,turns=Math.round(peace/TURN_LEN);
  const o=[];
  o.push(n>=99?'Commandants : <b>tous ceux de votre camp</b>, même ceux pas encore débloqués (les recruter les ajoute à votre collection).':'Commandants proposés : <b>'+n+'</b> par camp (ou tous si le camp en compte moins), tirés dans votre collection.');
  o.push('IA : revenus '+pct(D.inc)+', agressivité '+pct(D.aggr)+'.');
  o.push((dk==='easy'?'Aucune IA ne vous déclare la guerre':'Les IA ne déclarent aucune guerre')+' avant ≈ '+turns+' tours ('+fmtDur(peace)+' de jeu)'+(dk==='easy'?' ; en Normal, ≈ '+Math.round(170*pk/TURN_LEN)+' tours':'')+'.');
  if(COAL[dk])o.push('<b>Coalition</b> : '+(dk==='expert'?'dès l’âge I':'à partir de l’âge II')+', si un camp (vous ou une IA) a un score supérieur à '+String(COAL[dk].on).replace('.',',')+'× celui du deuxième, les IA s’allient contre lui et refusent la paix avec lui. Elle se dissout quand l’écart retombe sous 1,2×.'+(dk==='expert'?' Les IA coalisées concentrent leurs attaques sur le meneur.':''));
  o.push('Toutes les conditions de victoire restent valables. Expérience ×'+String(PG_MUL[dk]||1).replace('.',',')+'.');
  return '<ul class="pgl">'+o.map(x=>'<li>'+x+'</li>').join('')+'</ul>';
}
function pgRulesBox(id,dk,pk){return '<div class="pgdr" id="'+id+'"><b>Règles : '+esc((DIFF[dk]||DIFF.normal).n)+'</b>'+pgRulesText(dk,pk)+'</div>';}
/* enveloppe : règles de la partie en cours + règles générales */
function rulesHTML(_){
  const now=started&&!over&&players.length?'<h3>Règles de cette partie · '+esc((DIFF[diffKey]||DIFF.normal).n)+'</h3>'+pgRulesText(diffKey)+(RK.coal>=0&&players[RK.coal]?'<p class="note"><b>Coalition en cours</b> contre '+esc(players[RK.coal].name)+'.</p>':''):'';
  return now+rulesHTML_o()+codexHTML();
}
function pgIntroRules(){
  const s=$('#o-diff');if(!s||$('#o-drules'))return;
  const row=s.closest('.row');if(!row)return;
  const pk=()=>+(($('#o-pace')||{}).value)||PK;
  row.insertAdjacentHTML('afterend',pgRulesBox('o-drules',s.value,pk()));
  const up=()=>{const b=$('#o-drules');if(b)b.outerHTML=pgRulesBox('o-drules',s.value,pk());};
  s.addEventListener('change',up);const pc=$('#o-pace');if(pc)pc.addEventListener('change',up);
}
