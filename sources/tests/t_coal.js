/* Difficultés : Expert présent, coalitions contre le meneur (humain ou IA), paix refusée, dissolution, fiche des règles, trêve Facile. */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1400,height:860}});
const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
await p.goto('file://'+__dirname+'/../dist/risk_test.html');await p.evaluate(()=>localStorage.clear());await p.reload();await p.waitForTimeout(700);
const res=[];const ok=(n,c,d)=>{res.push((c?'PASS ':'FAIL ')+n+(d!==undefined?' — '+d:''));};
const R=(f,...a)=>p.evaluate(f,...a);
const d=await R(()=>Object.keys(__RK.DIFF).join(','));
ok('4 difficultés : Facile, Normal, Difficile, Expert',d==='easy,normal,hard,expert',d);
const intro=await R(()=>{const s=document.querySelector('#o-diff');const opts=[...s.options].map(o=>o.textContent);s.value='expert';s.dispatchEvent(new Event('change'));const t=document.querySelector('#o-drules').textContent;s.value='easy';s.dispatchEvent(new Event('change'));return {opts,t,t2:document.querySelector('#o-drules').textContent};});
ok('Accueil : Expert dans la liste',intro.opts.includes('Expert'),intro.opts.join(','));
ok('Accueil : fiche des règles Expert avant le lancement (coalition, tous les commandants, victoire)',/Coalition/.test(intro.t)&&/tous ceux de votre camp/.test(intro.t)&&/conditions de victoire restent valables/.test(intro.t),intro.t.slice(0,160));
ok('Accueil : fiche Facile (4 commandants, trêve envers vous)',/4<\/b>|: 4 par camp|4 par camp/.test(intro.t2)&&/Aucune IA ne vous déclare la guerre/.test(intro.t2),intro.t2.slice(0,200));
await p.screenshot({path:__dirname+'/s_coal_intro.png'});
/* scénario : le joueur humain écrase les autres en Expert */
const co=await R(()=>{const X=__RK;X.newGame(8080,'expert',{crews:[1,0,2,3],turn:true,pk:3});X.started=true;
  const T=X.terrs;let k=0;for(const t of T){if(t.owner<0&&k<26){t.owner=0;k++;for(const u in t.u)t.u[u]=Math.min(t.u[u],1);}}
  for(let i=0;i<3;i++)X.players[0].techs['t'+i]=1;
  X.rkCoalTick();const c1=X.RK.coal;
  const r=X.rel();for(const q of [1,2,3]){X.truce?0:0;}
  /* forcer le voisinage puis laisser les IA décider plusieurs fois */
  X.time_=0;for(let n=0;n<40;n++)for(const q of X.players.slice(1))X.aiDiplo(q);
  const wars=[1,2,3].filter(q=>X.isWar(q,0)).length;
  const atWar=[1,2,3].filter(q=>X.isWar(q,0));
  /* une IA encore solide (≥ 35 % de la force du meneur) refuse ; une IA au bord de la ruine peut accepter */
  const capQ=X.terrs.find(t=>t.owner===atWar[0]&&t.capital);for(const u in capQ.u)capQ.u[u]*=20;
  const strong=X.strength(atWar[0])>=.35*X.strength(0),refuse=strong&&!X.aiAccepts(atWar[0],0,'peace');
  for(const u in capQ.u)capQ.u[u]/=20;for(const t of X.terrs)if(t.owner===atWar[0]&&!t.capital)t.owner=0;
  const weakOK=X.strength(atWar[0])<.35*X.strength(0);
  const allyOK=X.aiAccepts(2,1,'alliance')||X.rel()[1][2]!=='peace';
  const rules=X.rulesHTML();
  /* l'avance retombe : dissolution */
  for(const t of T)if(t.owner===0&&!t.capital)t.owner=-1;X.players[0].techs={};
  X.rkCoalTick();const c2=X.RK.coal;
  return {c1,wars,refuse,weakOK,allyOK,rules:/Coalition en cours/.test(rules),c2,logs:X.RK?1:0};});
ok('Coalition : formée contre le joueur humain qui mène largement',co.c1===0,'meneur '+co.c1);
ok('Coalition : les IA voisines déclarent la guerre au meneur',co.wars>=1,co.wars+' IA en guerre');
ok('Coalition : les IA coalisées refusent la paix au meneur',co.refuse);
ok('Coalition : alliance entre membres acceptée',co.allyOK);
ok('Règles : « Coalition en cours » affichée en partie',co.rules);
ok('Coalition : dissoute quand l’avance retombe',co.c2===-1,'meneur '+co.c2);
/* coalition contre une IA aussi (équité) */
const ai=await R(()=>{const X=__RK;X.newGame(9090,'hard',{crews:[1,0,2,3],turn:true,pk:3});X.started=true;X.AG.n=1;
  let k=0;for(const t of X.terrs){if(t.owner<0&&k<26){t.owner=2;k++;}}X.rkCoalTick();return X.RK.coal;});
ok('Coalition : vise aussi une IA qui mène (pas seulement le joueur)',ai===2,'meneur '+ai);
const hard0=await R(()=>{const X=__RK;X.newGame(9091,'hard',{crews:[1,0,2,3],turn:true,pk:3});X.started=true;X.AG.n=0;
  let k=0;for(const t of X.terrs){if(t.owner<0&&k<26){t.owner=0;k++;}}X.rkCoalTick();return X.RK.coal;});
ok('Difficile : pas de coalition avant l’âge II',hard0===-1);
const nor=await R(()=>{const X=__RK;X.newGame(9092,'normal',{crews:[1,0,2,3],turn:true,pk:3});X.started=true;X.AG.n=2;
  let k=0;for(const t of X.terrs){if(t.owner<0&&k<30){t.owner=0;k++;}}X.rkCoalTick();return X.RK.coal;});
ok('Normal : jamais de coalition',nor===-1);
const sv=await R(()=>{const X=__RK;X.newGame(8081,'expert',{crews:[1,0,2,3],turn:true,pk:3});X.started=true;let k=0;for(const t of X.terrs){if(t.owner<0&&k<26){t.owner=0;k++;}}X.rkCoalTick();
  X.svWrite('rk-s2','coal');X.newGame(1,'normal',{turn:true,pk:3});const e=X.svRestore(X.svRead('rk-s2'));return {e,c:X.RK.coal,dk:X.diffKey};});
ok('Sauvegarde : difficulté Expert et coalition conservées',!sv.e&&sv.c===0&&sv.dk==='expert',JSON.stringify(sv));
for(const r of res)console.log(r);console.log(errs.length?errs.join('\n'):'aucune erreur JS');console.log('bilan',res.filter(r=>r.startsWith('PASS')).length+'/'+res.length);
await b.close();})();
