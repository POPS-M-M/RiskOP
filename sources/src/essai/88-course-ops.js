/* ================= COURSE VERS LAUGH TALE : renseignement et opérations (version test) =================
   Demande du 25/11/2026 : un jeu asymétrique pensé pour 5 joueurs en ligne (testé pour l'instant contre l'IA).
   - Brouillard de guerre par siège : chaque camp ne voit que les garnisons et les flottes de ses îles, des îles voisines
     et de ses alliés ; ailleurs il garde la dernière observation. La possession des îles reste publique (le Journal).
   - Marine (contrôle, renseignement, traque) : réseau des bases (vue à 2 îles), Localisation (avis de recherche), Blocus, Buster Call, Poursuite.
   - Armée révolutionnaire (déstabilisation) : Infiltration (agents cachés), Sabotage, Insurrection.
   - Pirates : Se faire discret (échapper aux avis de recherche).
   - Alliances : les alliés partagent leur vue. L'IA profite des camps déjà attaqués par un tiers.
   Pensé pour le jeu en ligne : toute action passe par CS.act(siège, ordre), appelée par exec() (commande { k:'cs', a, … }) ;
   la vue de chaque siège (CS.visOf) ne dépend que de l'état de la partie, et buildView masque ce que le siège ne voit pas.
   Les conditions de victoire ne changent pas. Toutes les durées sont au rythme Standard (PK 6) et suivent le rythme choisi. */
(function(){
if(typeof CS==='undefined')return;
const R=Math.round,K=()=>PK/6;
const role=i=>CS.S&&CS.S[i]&&CS.S[i].role;
const pn=i=>players[i]?players[i].name:'?';
const log=(txt,col,to)=>{try{addLog(txt,col||'#f2c75c',to);}catch(_){}};
const OPS={
  avis:{n:'Localisation',r:'marine',g:70,cd:90,dur:60,d:'Révèle 60 s toutes les îles, flottes et la progression d\'un camp ; démasque les agents révolutionnaires.'},
  blocus:{n:'Blocus',r:'marine',g:60,cd:120,dur:90,d:'Sur une de vos îles : 90 s, les flottes ennemies qui partent de la zone ou y arrivent vont 40 % moins vite et perdent 10 % de leurs troupes à l\'arrivée.'},
  buster:{n:'Buster Call',r:'marine',g:120,s:40,cd:150,del:15,d:'Sur une île ennemie visible, à 2 îles au plus des vôtres : 15 s après l\'alerte, −30 % de garnison.'},
  inter:{n:'Poursuite',r:'marine',g:50,cd:60,d:'Une flotte ennemie visible, partie d\'une île voisine des vôtres ou en route vers elle : −25 % de troupes, trajet +20 %.'},
  infil:{n:'Infiltration',r:'revo',g:45,i:4,cd:20,d:'Place un agent caché sur une île ennemie à 2 îles au plus des vôtres (3 agents au plus). L\'agent voit l\'île et ses voisines.'},
  sabot:{n:'Sabotage',r:'revo',g:35,cd:45,d:'Avec un agent sur place depuis 10 s : −15 % de garnison, chantier remis à zéro ; sur une base ou un passage de la Marine, son compteur de 60 s repart de zéro.'},
  insur:{n:'Insurrection',r:'revo',g:60,i:6,cd:60,d:'Avec un agent sur place depuis 20 s, sur une île de 18 troupes au plus (ni capitale, ni Mary Geoise, ni Laugh Tale) : l\'île se soulève et rejoint la Révolution. L\'agent est consommé.'},
  indice:{n:'Indice',r:'pirate',s:40,cd:60,d:'Règles « Autorité » : étudie les textes pour situer un Ponéglyphe de Route caché ; 1er indice = sa région, 2e indice = l\'île.'},
  discret:{n:'Se faire discret',r:'pirate',g:60,cd:150,dur:60,d:'60 s : les avis de recherche contre vous tombent et aucun nouveau ne peut vous viser.'}};
const AU=(d,why)=>{if(CS.aut)CS.aut(d,why);};
const cost=o=>({g:R((o.g||0)*K()),s:R((o.s||0)*K()),i:o.i||0});
let X=null;
const fresh=()=>({mem:players.map(()=>terrs.map(()=>null)),cd:players.map(()=>({})),wt:[],bl:[],bu:[],ag:[],disc:players.map(()=>0),hit:players.map(()=>[-1e9,-1]),aiT:players.map(()=>3),agN:0,sab:{}});
/* distances en îles (graphe des routes) */
let D=null;
function dist(){const n=terrs.length;D=terrs.map((_,s)=>{const d=new Array(n).fill(99);d[s]=0;const q=[s];while(q.length){const u=q.shift();for(const v of terrs[u].nb)if(d[v]>d[u]+1){d[v]=d[u]+1;q.push(v);}}return d;});}
const near=(s,id,r)=>terrs.some(t=>t.owner===s&&D[t.id][id]<=r);
const allies=s=>players.filter(q=>q.alive&&q.id!==s&&rel[s]&&rel[s][q.id]==='alliance').map(q=>q.id);

/* ---------- vue d'un siège ---------- */
CS.visOf=function(s){
  const v=new Uint8Array(terrs.length);
  if(!CS.on||!X||!CS.S||!CS.S[s]){v.fill(1);return v;}
  const sh=[s,...allies(s)];
  for(const t of terrs)if(t.owner>=0&&sh.includes(t.owner)){v[t.id]=1;for(const n of t.nb)v[n]=1;}
  for(const a of armies)if(sh.includes(a.owner)){v[a.from]=1;v[a.to]=1;}
  if(role(s)==='marine')for(const [id] of CS.BASES)if(terrs[id].owner===s)for(let j=0;j<terrs.length;j++)if(D[id][j]<=2)v[j]=1;
  for(const g of X.ag)if(g.by===s){v[g.t]=1;for(const n of terrs[g.t].nb)v[n]=1;}
  for(const w of X.wt)if(w.by===s&&w.until>time)for(const t of terrs)if(t.owner===w.q)v[t.id]=1;
  return v;
};
let VC={k:'',v:null};
const visMe=s=>{const k=s+':'+Math.floor(time*2)+':'+armies.length;if(VC.k!==k){VC={k,v:CS.visOf(s)};}return VC.v;};
CS.seeT=(id,s)=>!CS.on||!X||visMe(s)[id]===1;
CS.wanted=(s,q)=>!!X&&X.wt.some(w=>w.by===s&&w.q===q&&w.until>time);
CS.seeA=(a,s)=>{if(!CS.on||!X||a.owner===s||allies(s).includes(a.owner)||CS.wanted(s,a.owner))return true;const v=visMe(s);return v[a.from]===1||v[a.to]===1;};
CS.memN=(id,s)=>{const m=X&&X.mem[s]&&X.mem[s][id];return m?'≈'+m[1]:'?';};
CS.memAge=(id,s)=>{const m=X&&X.mem[s]&&X.mem[s][id];return m?'il y a '+R(time-m[2])+' s, '+m[1]+' troupes':'jamais observée';};
/* ce que le siège s sait de la progression du siège q (panneau Course) */
CS.knows=(s,q)=>{if(!CS.on||!X)return true;if(q===s||allies(s).includes(q)||CS.wanted(s,q))return true;
  return X.ag.some(g=>g.by===s&&terrs[g.t].owner===q&&terrs[g.t].capital);};
/* repères affichés au-dessus d'une île pour le siège s */
CS.icon=(id,s)=>{if(!CS.on||!X)return '';let o='';
  if(X.bl.some(b=>b.t===id&&b.until>time&&(b.by===s||CS.seeT(id,s))))o+='⛓';
  if(X.bu.some(b=>b.t===id&&(b.by===s||terrs[id].owner===s)))o+='💥';
  if(X.ag.some(g=>g.t===id&&g.by===s))o+='🕵';
  if(X.sab[id]>time&&CS.seeT(id,s))o+='🔥';return o;};

/* ---------- règles des opérations ---------- */
const cdLeft=(s,k)=>Math.max(0,(X.cd[s][k]||0)-time);
const blZone=b=>[b.t,...terrs[b.t].nb];
const hostileM=(m,q)=>q>=0&&q!==m&&isWar(m,q);
function why(s,c){
  const p=players[s],o=OPS[c.a];if(!o)return 'Opération inconnue.';
  if(!p||!p.alive)return 'Action impossible.';
  if(role(s)!==o.r)return o.n+' : réservé '+(o.r==='marine'?'à la Marine':o.r==='revo'?'à l\'Armée révolutionnaire':'aux équipages pirates')+'.';
  const cl=cdLeft(s,c.a);if(cl>0)return o.n+' : encore '+Math.ceil(cl)+' s de préparation.';
  const z=cost(o);if(p.gold<z.g)return 'Il faut '+z.g+' ฿.';if(z.s&&p.sci<z.s)return 'Il faut '+z.s+' de savoir.';if(z.i&&(p.x.inf||0)<z.i)return 'Il faut '+z.i+' d\'Influence.';
  const T=Number.isInteger(c.t)&&c.t>=0&&c.t<terrs.length?terrs[c.t]:null;
  switch(c.a){
    case 'avis':{const q=c.q;if(!Number.isInteger(q)||!players[q]||!players[q].alive||q===s)return 'Choisissez un camp.';if(X.disc[q]>time)return pn(q)+' se fait discret : impossible de le localiser pour l\'instant.';return '';}
    case 'blocus':if(!T||T.owner!==s)return 'Choisissez une de vos îles.';if(X.bl.some(b=>b.by===s&&b.until>time))return 'Un blocus est déjà en place.';return '';
    case 'buster':if(!T)return 'Choisissez une île ennemie.';if(!hostileM(s,T.owner))return 'Il faut une île d\'un camp avec qui vous êtes en guerre.';
      if(!CS.seeT(T.id,s))return 'Cette île n\'est pas en vue.';if(!near(s,T.id,2))return 'Trop loin de vos îles (2 îles au plus).';if(T.id===CS.LT)return 'Laugh Tale est hors d\'atteinte.';if(X.bu.some(b=>b.t===T.id))return 'Un Buster Call est déjà en route.';return '';
    case 'inter':{const a=armies.find(z=>z.id===c.id);if(!a)return 'Flotte introuvable.';if(!hostileM(s,a.owner))return 'Il faut une flotte d\'un camp avec qui vous êtes en guerre.';
      if(!CS.seeA(a,s))return 'Cette flotte n\'est pas en vue.';if(!(near(s,a.from,1)||near(s,a.to,1)))return 'Trop loin de vos îles.';if(a.ix)return 'Déjà interceptée.';return '';}
    case 'infil':if(!T||T.owner<0||T.owner===s)return 'Choisissez une île tenue par un autre camp.';if(!near(s,T.id,2))return 'Trop loin de vos îles (2 îles au plus).';
      if(X.ag.filter(g=>g.by===s).length>=3)return 'Vous avez déjà 3 agents.';if(X.ag.some(g=>g.by===s&&g.t===T.id))return 'Un agent est déjà sur place.';return '';
    case 'sabot':case 'insur':{if(!T)return 'Choisissez l\'île de votre agent.';const g=X.ag.find(z=>z.by===s&&z.t===T.id);if(!g)return 'Aucun agent sur cette île.';
      if(T.owner===s)return 'L\'île est déjà à vous.';const need=(c.a==='sabot'?10:20)*K();if(time-g.t0<need)return 'L\'agent doit être sur place depuis '+R(need)+' s.';
      if(c.a==='insur'){if(T.capital||T.id===CS.MG||T.id===CS.LT||(typeof bossAlive==='function'&&bossAlive(T)))return 'Cette île ne peut pas se soulever.';if(tr(T)>18)return 'Garnison trop forte ('+Math.floor(tr(T))+' troupes, 18 au plus).';}
      return '';}
    case 'discret':return '';
    case 'indice':return CS.indWhy?CS.indWhy(s):'Indisponible.';
  }
  return 'Action impossible.';
}
function pay(s,o){const p=players[s],z=cost(o);p.gold-=z.g;if(z.s)p.sci-=z.s;if(z.i)p.x.inf-=z.i;}
const killM=(m,q,n)=>{if(role(m)==='marine'&&role(q)==='pirate')CS.S[m].kills+=Math.max(0,n);};
function apply(s,c){
  const o=OPS[c.a],T=terrs[c.t];pay(s,o);X.cd[s][c.a]=time+o.cd*K();
  switch(c.a){
    case 'avis':{const q=c.q;X.wt=X.wt.filter(w=>!(w.by===s&&w.q===q));X.wt.push({by:s,q,until:time+o.dur*K()});
      log('📜 Avis de recherche : la Marine localise '+pn(q)+' (îles, flottes et progression connues pendant '+R(o.dur*K())+' s).','#9ec5ff',[s,q]);
      if(role(q)==='revo'){const caught=X.ag.filter(g=>g.by===q&&terrs[g.t].owner===s);if(caught.length){X.ag=X.ag.filter(g=>!caught.includes(g));AU(2*caught.length,'agents arrêtés');log('🕵 Agents révolutionnaires démasqués et arrêtés : '+caught.map(g=>terrs[g.t].name).join(', ')+'.','#9ec5ff',[s,q]);}}
      return;}
    case 'blocus':X.bl.push({by:s,t:T.id,until:time+o.dur*K()});log('⛓ Blocus de la Marine autour de '+T.name+' ('+R(o.dur*K())+' s).','#9ec5ff');return;
    case 'buster':X.bu.push({by:s,t:T.id,at:time+o.del*K()});log('💥 Buster Call annoncé sur '+T.name+' : frappe dans '+R(o.del*K())+' s.','#ff8a70',[s,T.owner].filter(x=>x>=0));return;
    case 'inter':{const a=armies.find(z=>z.id===c.id),n0=sumU(a.u);a.u=scaleU(a.u,.75);if(sumU(a.u)<1)a.u.guerrier+=1-sumU(a.u);a.dur*=1.2;a.ix=1;killM(s,a.owner,n0-sumU(a.u));AU(.5,'poursuite');
      log('⚓ Poursuite : la Marine rattrape une flotte de '+pn(a.owner)+' : −'+Math.floor(n0-sumU(a.u))+' troupes.','#9ec5ff',[s,a.owner]);return;}
    case 'infil':X.ag.push({id:++X.agN,by:s,t:T.id,t0:time});log('🕵 Un agent s\'infiltre à '+T.name+'.','#9fdcaa',s);return;
    case 'sabot':{const n0=tr(T);T.u=scaleU(T.u,.85);if(T.city&&T.city.q)T.city.q.t=0;X.sab[T.id]=time+30*K();
      const m=T.owner;if(m>=0&&role(m)==='marine'){const S=CS.S[m];if(S.baseT[T.id])S.baseT[T.id]=0;if(S.passT[T.id])S.passT[T.id]=0;AU(CS.BASES.some(b=>b[0]===T.id)||CS.PASS.includes(T.id)?-4:-2,'sabotage');}
      log('🔥 Sabotage à '+T.name+' : −'+Math.floor(n0-tr(T))+' troupes'+(T.city?', chantier arrêté':'')+'.','#9fdcaa',[s,T.owner].filter(x=>x>=0));return;}
    case 'insur':{const prev=T.owner,n0=tr(T),u=emptyU();u.guerrier=5+Math.floor(n0*.3);T.owner=s;T.u=u;T.fo=0;T.fm=0;if(T.city)captureCity(T);
      X.ag=X.ag.filter(g=>!(g.by===s&&g.t===T.id));AU(-2,'insurrection');if(prev>=0)opin[prev][s]=Math.max(-100,opin[prev][s]-12);dirty=true;
      log('✊ Insurrection à '+T.name+' : l\'île rejoint '+pn(s)+(prev>=0?' (prise à '+pn(prev)+')':'')+'.','#9fdcaa');return;}
    case 'indice':CS.indDo(s);return;
    case 'discret':X.disc[s]=time+o.dur*K();X.wt=X.wt.filter(w=>w.q!==s);log('🌫 '+pn(s)+' se fait discret : la Marine perd sa trace.','#c9b8ff',s);return;
  }
}
/* point d'entrée unique, humain (via exec) ou IA */
CS.act=function(s,c){if(!CS.on||!X||!c)return 'Action impossible.';const w=why(s,c);if(w)return w;apply(s,c);VC={k:'',v:null};dirty=true;try{CS.hud(true);}catch(_){}return '';};
CS.opWhy=(s,c)=>(!CS.on||!X)?'Action impossible.':why(s,c);
CS.OPS=OPS;

/* ---------- chaque seconde ---------- */
function sec(){
  if(!CS.on||!X||over)return;
  /* mémoire des observations */
  for(const p of players){const v=CS.visOf(p.id),m=X.mem[p.id];for(let j=0;j<terrs.length;j++)if(v[j])m[j]=[terrs[j].owner,Math.floor(tr(terrs[j])),R(time)];}
  X.wt=X.wt.filter(w=>w.until>time&&players[w.q]&&players[w.q].alive);
  VC={k:'',v:null};
  X.bl=X.bl.filter(b=>b.until>time&&terrs[b.t].owner===b.by);
  for(const b of X.bu.slice())if(time>=b.at){X.bu.splice(X.bu.indexOf(b),1);const T=terrs[b.t];
    if(T.owner>=0&&T.owner!==b.by&&isWar(b.by,T.owner)){const n0=tr(T);T.u=scaleU(T.u,.7);killM(b.by,T.owner,n0-tr(T));AU(1,'Buster Call');X.hit[T.owner]=[time,b.by];
      log('💥 Buster Call sur '+T.name+' : −'+Math.floor(n0-tr(T))+' troupes pour '+pn(T.owner)+'.','#ff8a70');dirty=true;}}
  /* agents : retirés si l'île est à eux, découverts parfois sur les îles de la Marine (plus souvent sur ses bases) */
  X.ag=X.ag.filter(g=>{const T=terrs[g.t];if(T.owner===g.by||T.owner<0)return false;
    if(role(T.owner)==='marine'){const pr=(CS.BASES.some(b=>b[0]===T.id)?1/120:1/300)/K();if(Math.random()<pr){AU(2,'agent arrêté');log('🕵 La Marine démasque un agent révolutionnaire à '+T.name+'.','#9ec5ff',[g.by,T.owner]);return false;}}
    return true;});
  if(!CS.noOps)for(const p of players)if(p.alive&&!p.human){X.aiT[p.id]-=1;if(X.aiT[p.id]<=0){X.aiT[p.id]=(4+Math.random()*4)*K();try{ai(p);}catch(_){}}}
}

/* ---------- IA : mêmes ordres que le joueur, même vue (aucune information cachée utilisée) ---------- */
const tryAct=(s,c)=>{const p=players[s],z=cost(OPS[c.a]);if(p.gold<z.g*(role(s)==='revo'?1:1.25))return false;return CS.act(s,c)==='';};
function ai(p){
  const s=p.id,r=role(s),v=CS.visOf(s),foesAt=q=>q>=0&&q!==s&&isWar(s,q);
  if(r==='marine'){
    /* avis de recherche : le pirate le plus avancé connu, sinon la plus grosse prime (publique) */
    const zb=cost(OPS.buster),za=cost(OPS.avis);
    if(!cdLeft(s,'avis')&&!cdLeft(s,'buster')&&p.gold>=(zb.g+za.g)*1.1&&p.sci>=zb.s){const ps=players.filter(q=>q.alive&&role(q.id)==='pirate'&&X.disc[q.id]<=time).sort((a,b)=>primeOf(b.id)-primeOf(a.id));if(ps[0]&&tryAct(s,{a:'avis',q:ps[0].id}))return;}
    if(!cdLeft(s,'inter')){const A=armies.filter(a=>foesAt(a.owner)&&!a.ix&&CS.seeA(a,s)&&(near(s,a.from,1)||near(s,a.to,1))&&sumU(a.u)>=8).sort((a,b)=>sumU(b.u)-sumU(a.u));if(A[0]&&tryAct(s,{a:'inter',id:A[0].id}))return;}
    if(!cdLeft(s,'buster')){const T=terrs.filter(t=>foesAt(t.owner)&&v[t.id]&&t.id!==CS.LT&&near(s,t.id,2)&&!X.bu.some(b=>b.t===t.id)).map(t=>({t,sc:tr(t)*(CS.PONE.includes(t.id)?2:1)*(CS.S[t.owner].dj&&CS.PONE[CS.S[t.owner].dj.k]===t.id?2:1)})).sort((a,b)=>b.sc-a.sc);
      if(T[0]&&T[0].sc>=12&&tryAct(s,{a:'buster',t:T[0].t.id}))return;}
    if(!cdLeft(s,'blocus')&&!X.bl.some(b=>b.by===s&&b.until>time)){const T=terrs.filter(t=>t.owner===s).map(t=>({t,sc:t.nb.filter(n=>foesAt(terrs[n].owner)).length+(CS.PASS.includes(t.id)?1:0)})).sort((a,b)=>b.sc-a.sc);if(T[0]&&T[0].sc>=2&&tryAct(s,{a:'blocus',t:T[0].t.id}))return;}
  }else if(r==='revo'){
    const mine=X.ag.filter(g=>g.by===s);
    for(const g of mine){const T=terrs[g.t];if(!cdLeft(s,'insur')&&!why(s,{a:'insur',t:T.id})&&tryAct(s,{a:'insur',t:T.id}))return;}
    for(const g of mine){const T=terrs[g.t],m=T.owner;const hot=m>=0&&role(m)==='marine'&&((CS.S[m].baseT[T.id]||0)>0||(CS.S[m].passT[T.id]||0)>0);
      if((hot||T.city)&&!cdLeft(s,'sabot')&&!why(s,{a:'sabot',t:T.id})&&tryAct(s,{a:'sabot',t:T.id}))return;}
    if(mine.length<3&&!cdLeft(s,'infil')){const T=terrs.filter(t=>t.owner>=0&&t.owner!==s&&role(t.owner)==='marine'&&near(s,t.id,2)&&!mine.some(g=>g.t===t.id)).map(t=>({t,sc:(CS.BASES.some(b=>b[0]===t.id)?3:0)+(CS.PASS.includes(t.id)?2:0)+(t.city?1:0)+(tr(t)<=18?2:0)})).sort((a,b)=>b.sc-a.sc);
      if(T[0]&&tryAct(s,{a:'infil',t:T[0].t.id}))return;}
  }else if(r==='pirate'){
    {const S=CS.S[s],busy=S.dj||[0,1,2,3].some(k=>S.dec[k]===null&&S.found[k]!==null);   /* l'IA cherche des indices seulement quand elle n'a rien à déchiffrer */
     if(!busy&&!cdLeft(s,'indice')&&CS.indWhy&&!CS.indWhy(s)&&players[s].sci>=cost(OPS.indice).s*1.5&&CS.act(s,{a:'indice'})==='')return;}
    if(!cdLeft(s,'discret')&&X.wt.some(w=>w.q===s&&w.until-time>20*K())&&(CS.S[s].dj||CS.S[s].open!==null))tryAct(s,{a:'discret'});
  }
}

/* ---------- branchements ---------- */
{const i0=CS.init;CS.init=function(o){i0.apply(this,arguments);dist();X=fresh();CS.X=X;VC={k:'',v:null};};}
{const s0=CS.save;CS.save=function(){const o=s0();o.X=X;return o;};}
{const l0=CS.load;CS.load=function(z){l0(z);if(z.X){X=z.X;CS.X=X;}};}
{const d0=decTick;decTick=function(){d0();if(CS.on)sec();};}
/* blocus : ralentit les flottes ennemies qui partent de la zone ou y arrivent */
{const l0=launch_o;launch_o=function(pid,from,to,pct,st){const n=armies.length,r=l0.apply(this,arguments);
  if(CS.on&&X&&r===''&&armies.length>n){const a=armies[armies.length-1];for(const b of X.bl)if(b.until>time&&isWar(b.by,pid)&&(blZone(b).includes(from)||blZone(b).includes(to))){a.dur*=1/0.6;a.bk=b.by;break;}}
  return r;};}
/* arrivée : harcèlement du blocus (−10 %) et mémoire des camps attaqués (l'IA profite d'un camp déjà occupé ailleurs) */
{const r0=resolveArrival;resolveArrival=function(a){
  if(CS.on&&X){const t=terrs[a.to];
    for(const b of X.bl)if(b.until>time&&isWar(b.by,a.owner)&&blZone(b).includes(a.to)&&t.owner!==a.owner){const n0=sumU(a.u);a.u=scaleU(a.u,.9);if(sumU(a.u)<1)a.u.guerrier+=1-sumU(a.u);killM(b.by,a.owner,n0-sumU(a.u));break;}
    if(t&&t.owner>=0&&t.owner!==a.owner)X.hit[t.owner]=[time,a.owner];}
  return r0.apply(this,arguments);};}
{const w0=CS.w;CS.w=function(p,x){let v=w0(p,x);if(X&&x.owner>=0&&x.owner!==p.id){const h=X.hit[x.owner];if(h&&h[1]!==p.id&&time-h[0]<20*K())v*=1.3;}return v;};}

/* ---------- panneau : opérations du joueur ---------- */
const esc2=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function opsHTML(){
  const s=ME,r=role(s),p=players[s];if(!X||!p||!p.alive)return '';
  const sel=typeof ui!=='undefined'&&ui.sel>=0?terrs[ui.sel]:null;
  const B=(c,label)=>{const w=why(s,c),z=cost(OPS[c.a]);const pr=[z.g?z.g+' ฿':'',z.s?z.s+' ◈':'',z.i?z.i+' Infl.':''].filter(Boolean).join(', ');
    return '<button class="btn cs-b" data-op=\''+esc2(JSON.stringify(c))+'\''+(w?' disabled title="'+esc2(w)+'"':' title="'+esc2(OPS[c.a].d)+'"')+'>'+esc2(label||OPS[c.a].n)+(pr?' <small>('+pr+')</small>':'')+'</button>';};
  const cdT=k=>{const l=cdLeft(s,k);return l>0?' <small>prêt dans '+Math.ceil(l)+' s</small>':'';};
  let h='<div class="cs-h">Opérations</div>';
  h+='<div class="cs-r"><small>Île sélectionnée : '+(sel?'<b>'+esc2(sel.name)+'</b>':'aucune (cliquez une île)')+'</small></div>';
  if(r==='marine'){
    h+='<div class="cs-r">Localisation (avis de recherche)'+cdT('avis')+'<br>'+players.filter(q=>q.alive&&q.id!==s).map(q=>B({a:'avis',q:q.id},q.name)).join(' ')+'</div>';
    h+='<div class="cs-r">'+B({a:'blocus',t:sel?sel.id:-1})+cdT('blocus')+' '+B({a:'buster',t:sel?sel.id:-1})+cdT('buster')+'</div>';
    const A=armies.filter(a=>a.owner!==s&&CS.seeA(a,s)&&isWar(s,a.owner)).sort((a,b)=>sumU(b.u)-sumU(a.u)).slice(0,4);
    h+='<div class="cs-r">Poursuite'+cdT('inter')+(A.length?'<br>'+A.map(a=>B({a:'inter',id:a.id},pn(a.owner)+' → '+terrs[a.to].name+' ('+Math.floor(sumU(a.u))+')')).join(' '):' <small>aucune flotte ennemie en vue</small>')+'</div>';
    const wt=X.wt.filter(w=>w.by===s);if(wt.length)h+='<div class="cs-r"><small>Avis en cours : '+wt.map(w=>esc2(pn(w.q))+' '+R(w.until-time)+' s').join(', ')+'</small></div>';
  }else if(r==='revo'){
    const mine=X.ag.filter(g=>g.by===s);
    h+='<div class="cs-r">'+B({a:'infil',t:sel?sel.id:-1})+cdT('infil')+' <small>agents : '+mine.length+'/3</small></div>';
    for(const g of mine){const T=terrs[g.t];h+='<div class="cs-r">🕵 <a href="#" data-cs="sel:'+T.id+'" onclick="return false">'+esc2(T.name)+'</a> <small>'+R(time-g.t0)+' s, '+Math.floor(tr(T))+' troupes</small> '+B({a:'sabot',t:T.id})+' '+B({a:'insur',t:T.id})+'</div>';}
  }else if(r==='pirate'){
    const wt=X.wt.filter(w=>w.q===s);
    if(CS.o&&CS.o.v2)h+='<div class="cs-r">'+B({a:'indice'})+cdT('indice')+'</div>';
    h+='<div class="cs-r">'+(wt.length?'<b class="cs-alert">Avis de recherche contre vous : '+R(Math.max(...wt.map(w=>w.until-time)))+' s</b><br>':'')+B({a:'discret'})+cdT('discret')+(X.disc[s]>time?' <small>discret encore '+R(X.disc[s]-time)+' s</small>':'')+'</div>';
  }
  return '<div class="cs-ops">'+h+'</div>';
}
{const h0=CS.hud;CS.hud=function(force){h0.apply(this,arguments);if(!CS.on||!X)return;const el=document.getElementById('cs-hud');if(!el||el.hidden)return;
  const k=R(time)+':'+(typeof ui!=='undefined'?ui.sel:-1)+':'+players[ME].gold.toFixed(0);
  if(el.querySelector('.cs-ops')&&!force&&CS._ok===k)return;CS._ok=k;
  const old=el.querySelector('.cs-ops');if(old)old.remove();const mine=el.querySelector('.cs-mine')||el.querySelector('.cs-body');if(mine)mine.insertAdjacentHTML('beforeend',opsHTML());};}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#cs-hud [data-op]');if(!b||b.disabled)return;let c;try{c=JSON.parse(b.dataset.op);}catch(_){return;}cmd(Object.assign({k:'cs'},c));try{CS.hud(true);}catch(_){}});
/* vue privée pour le jeu en ligne (buildView) : ce que le siège s sait de la Course */
CS.view=function(s){if(!CS.on||!X)return 0;return {
  P:players.map(q=>CS.knows(s,q.id)?CS.prog(q.id):-1),
  ag:X.ag.filter(g=>g.by===s).map(g=>[g.t,R(time-g.t0)]),wt:X.wt.filter(w=>w.by===s||w.q===s).map(w=>[w.by,w.q,R(w.until-time)]),
  bl:X.bl.filter(b=>b.by===s||CS.seeT(b.t,s)).map(b=>[b.t,R(b.until-time)]),bu:X.bu.filter(b=>b.by===s||terrs[b.t].owner===s).map(b=>[b.t,R(b.at-time)]),
  cd:Object.fromEntries(Object.keys(OPS).map(k=>[k,R(cdLeft(s,k))])),disc:R(Math.max(0,X.disc[s]-time))};};
{const st=document.createElement('style');st.textContent='#cs-hud .cs-ops{margin-top:6px;padding-top:5px;border-top:1px solid rgba(255,255,255,.1)}#cs-hud .cs-ops .cs-b{margin:2px 3px 2px 0}#cs-hud .cs-ops .cs-b[disabled]{opacity:.45;cursor:not-allowed}#cs-hud .cs-ops small{opacity:.8}';document.head.appendChild(st);}
})();
