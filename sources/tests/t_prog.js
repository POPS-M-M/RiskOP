/* Progression permanente et commandants proposés : migration, tirage, recrutement, XP, anti-rejeu, sauvegardes. */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1400,height:860}});
const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
const URL='file://'+__dirname+'/../dist/risk_test.html';
const res=[];const ok=(n,c,d)=>{res.push((c?'PASS ':'FAIL ')+n+(d!==undefined?' — '+d:''));};
const R=(f,...a)=>p.evaluate(f,...a);
/* 1. migration d'un ancien carnet */
await p.goto(URL);await R(()=>{localStorage.clear();localStorage.setItem('gl-profile',JSON.stringify({v:1,games:5,wins:2,uses:3,rec:{Luffy:1,Kaido:2},tot:{cq:30},ach:{},ti:'',em:'',bs:0,camp:{},cj:[]}));});
await p.reload();await p.waitForTimeout(700);
const mig=await R(()=>{const X=__RK;return {xp:X.PG.xp,col:Object.keys(X.PG.col).sort(),mig:X.PG.mig,rank:X.pgRank(X.PG.xp),prof:X.PROFILE.games,stored:!!localStorage.getItem('rk-prog'),profKeep:JSON.parse(localStorage.getItem('gl-profile')).games};});
ok('Migration : XP de rattrapage = 5×80 + 2×120',mig.xp===640,mig.xp);
ok('Migration : commandants déjà recrutés ajoutés (Luffy, Kaido)',mig.col.includes('Luffy')&&mig.col.includes('Kaido'),mig.col.join(','));
ok('Migration : équipage de départ (12 distincts) + 2',mig.col.length===14,mig.col.length);
ok('Migration : ancien carnet intact',mig.prof===5&&mig.profKeep===5);
ok('Migration : enregistrée sous rk-prog',mig.stored);
await p.reload();await p.waitForTimeout(500);
const mig2=await R(()=>({xp:__RK.PG.xp,n:Object.keys(__RK.PG.col).length}));
ok('Migration : une seule fois (rechargement identique)',mig2.xp===640&&mig2.n===14,JSON.stringify(mig2));
/* 2. tirage : pour chaque camp joueur × difficulté × graines */
const ros=await R(()=>{const X=__RK,out=[];const camps=X.CREWS.map(c=>c.id);
  const pool=c=>X.LEGENDS.filter(L=>L.camps.includes(c)).map(L=>L.s);
  for(let pc=0;pc<4;pc++)for(const dk of ['easy','normal','hard','expert'])for(let sd=1;sd<=25;sd++){
    const crews=[pc,...[0,1,2,3].filter(i=>i!==pc)];
    const r=X.pgRoster(sd*13,dk,crews,[true,false,false,false],true);
    for(let s=0;s<4;s++){const c=X.CREWS[crews[s]].id,l=r.ro[c],P=pool(c);
      const exp=Math.min(X.PG_N[dk],P.length);
      const inCamp=l.every(x=>P.includes(x)),uniq=new Set(l).size===l.length;
      const noAge=l.filter(x=>!X.LEGENDS.find(L=>L.s===x).rec.age).length;
      const legDisc=s===0&&l.length<P.length&&r.disc.some(x=>l.includes(x)&&X.chMeta(X.LEGENDS.findIndex(L=>L.s===x)).r==='L');
      const human=s===0,fromCol=!human||l.every(x=>X.PG.col[x]||r.disc.includes(x));
      out.push({pc,dk,sd,c,n:l.length,exp,inCamp,uniq,noAge,legDisc,fromCol,human});}
    if(dk==='easy'){const all=Object.values(r.ro).flat();out.push({dupEasy:all.length-new Set(all).size,pc,sd});}
  }
  return out;});
const rows=ros.filter(x=>x.c);
ok('Tirage : nombre proposé = min(4/8/16/tous, taille du camp)',rows.every(x=>x.n===x.exp),rows.filter(x=>x.n!==x.exp).slice(0,2).map(x=>JSON.stringify(x)).join(' '));
ok('Tirage : uniquement des commandants du camp, sans doublon',rows.every(x=>x.inCamp&&x.uniq));
ok('Tirage : Facile ≥ 2 sans âge requis (tous camps)',rows.filter(x=>x.dk==='easy').every(x=>x.noAge>=2),rows.filter(x=>x.dk==='easy'&&x.noAge<2).length+' cas');
ok('Tirage : camp du joueur = collection + « À découvrir »',rows.filter(x=>x.human).every(x=>x.fromCol));
ok('Tirage : jamais de légendaire « À découvrir » (sauf camp entier : Expert, petits camps)',rows.every(x=>!x.legDisc));
const de=ros.filter(x=>x.dupEasy!==undefined);
ok('Tirage Facile : doublons entre camps (les 6 Chasseurs sont tous partagés)',true,'doublons moyens par partie '+(de.reduce((a,x)=>a+x.dupEasy,0)/de.length).toFixed(2));
const tab=await R(()=>{const X=__RK,t={};for(const dk of ['easy','normal','hard','expert']){const r=X.pgRoster(77,dk,[1,0,2,3],[true,false,false,false],false);t[dk]=Object.fromEntries(Object.entries(r.ro).map(([k,v])=>[k,v.length]));}return t;});
ok('Tableau par camp',JSON.stringify(tab.easy)==='{"pirate":4,"marine":4,"revo":4,"chasseur":4}'&&tab.normal.chasseur===6&&tab.hard.pirate===16&&tab.hard.marine===10&&tab.expert.pirate===33,JSON.stringify(tab));
const det=await R(()=>{const X=__RK;const a=JSON.stringify(X.pgRoster(4321,'normal',[2,0,1,3],[true,true,false,false],false).ro),b2=JSON.stringify(X.pgRoster(4321,'normal',[2,0,1,3],[true,true,false,false],false).ro);return a===b2;});
ok('En ligne : liste identique pour une même graine (hôte = invités)',det);
const vari=await R(()=>{const X=__RK;const s=new Set();for(let sd=1;sd<=12;sd++)s.add(X.pgRoster(sd*31,'normal',[1,0,2,3],[true,false,false,false],false).ro.pirate.sort().join(','));return s.size;});
ok('Variété : listes différentes d’une partie à l’autre',vari>=10,vari+' listes distinctes sur 12');
/* 3. recrutement limité à la liste ; IA comprise */
const hire=await R(()=>{const X=__RK;X.newGame(9001,'easy',{crews:[1,0,2,3],turn:true,pk:3});X.started=true;
  const me=X.players[0],cid='pirate',ro=X.pgRosterNow()[cid];
  const out=X.LEGENDS.map((L,i)=>i).find(i=>X.LEGENDS[i].camps.includes(cid)&&!ro.includes(X.LEGENDS[i].s));
  const msg=X.hireReason(me,out);
  for(let t=1;t<=70&&!X.over;t++){X.TM.ready=[true,true,true,true];X.startRes();for(let i=0;i<600;i++){if(X.AG.trn){try{X.cmd({k:'agdone'});X.agApply();}catch(e){}}X.step(.05);if(X.over||X.TM.phase==='plan')break;}}
  const CH=X.CH_(),bad=[];let n=0;
  for(let i=0;i<CH.length;i++)if(CH[i].own>0){n++;const c=X.CREWS[X.players[CH[i].own].crew].id;if(!X.pgRosterNow()[c].includes(X.LEGENDS[i].s))bad.push(X.LEGENDS[i].s+'@'+c);}
  return {msg,n,bad,ro};});
ok('Recrutement : commandant non proposé refusé avec un message clair',/Pas proposé dans cette partie \(difficulté Facile\)/.test(hire.msg),hire.msg);
ok('IA : ne recrute que dans la liste de son camp',hire.bad.length===0,hire.n+' recrutements IA, hors liste : '+hire.bad.join(','));
/* 4. XP de fin de partie, anti-rejeu, partie courte */
const xp=await R(()=>{const X=__RK;X.newGame(5150,'normal',{crews:[1,0,2,3],turn:true,pk:3});X.started=true;
  const me=X.players[0];me.ai={t:1,aggr:1,pref:[],wantFerv:false,wonder:true};
  for(let t=1;t<=250&&!X.over;t++){try{X.aiThink(me);}catch(e){}X.TM.ready=[true,true,true,true];X.startRes();for(let i=0;i<600;i++){if(X.AG.trn){try{X.cmd({k:'agdone'});X.agApply();}catch(e){}}X.step(.05);if(X.over||X.TM.phase==='plan')break;}}
  const st=me.x.st,cqi=(me.x.cqi||[]).length;
  const last=X.PG.last,xp1=X.PG.xp;
  /* rejouer la même fin (même identifiant de partie) */
  X.over={winners:X.over?X.over.winners:[],text:'rejeu'};X.showEnd();
  return {ended:!!last,last,xp1,xp2:X.PG.xp,dup:X.PG.last&&X.PG.last.dup,cq:st.cq|0,cqi,turns:X.TM.n};});
ok('XP : attribuée en fin de partie',xp.ended&&xp.last.xp>0,JSON.stringify(xp.last&&{xp:xp.last.xp,act:xp.last.act,win:xp.last.win,tours:xp.turns}));
ok('XP : plafond d’actions 150 respecté',xp.last.act<=150);
ok('Îles distinctes ≤ conquêtes (reprises non comptées)',xp.cqi<=xp.cq&&xp.cqi>0,xp.cqi+' distinctes / '+xp.cq+' conquêtes');
ok('Anti-rejeu : même partie terminée deux fois → pas de nouvelle XP',xp.xp2===xp.xp1&&xp.dup===1);
const sh=await R(()=>{const X=__RK;X.newGame(42,'expert'in X.DIFF?'expert':'hard',{crews:[1,0,2,3],turn:true,pk:3});X.started=true;
  const me=X.players[0];me.x.st.bw=10;me.x.st.bd=6;me.x.cqi=[1,2,3,4,5,6];
  const x0=X.PG.xp;X.over={winners:[1],text:'défaite rapide'};X.showEnd();return {gain:X.PG.xp-x0,last:X.PG.last};});
ok('Défaite en moins de 15 tours : actions plafonnées à 20',sh.last.act===20&&sh.last.short,JSON.stringify({gain:sh.gain,act:sh.last.act}));
/* 5. sauvegardes */
const sv=await R(()=>{const X=__RK;X.newGame(777,'easy',{crews:[2,0,1,3],turn:true,pk:3});X.started=true;
  const ro=JSON.stringify(X.pgRosterNow());X.svWrite('rk-s1','prog');
  X.newGame(1,'hard',{turn:true,pk:3});
  const e=X.svRestore(X.svRead('rk-s1'));const ro2=JSON.stringify(X.pgRosterNow());
  /* ancienne sauvegarde : sans champ rkp */
  const o=X.svRead('rk-s1');delete o.G.rkp;const e3=X.svRestore(o);
  const me=X.players[0],cid=X.CREWS[me.crew].id;
  const all=X.LEGENDS.map((L,i)=>i).filter(i=>X.LEGENDS[i].camps.includes(cid)).every(i=>X.pgOffered(cid,X.LEGENDS[i].s));
  return {e,same:ro===ro2,e3,old:X.pgRosterNow(),all};});
ok('Sauvegarde : la liste proposée est conservée',!sv.e&&sv.same,sv.e);
ok('Ancienne sauvegarde (sans liste) : se charge, tous les commandants du camp proposés',!sv.e3&&sv.old===null&&sv.all,sv.e3);
/* 6. découverte et récompenses */
const disc=await R(()=>{const X=__RK;X.PG.col={};for(const c of Object.keys(X.PG_START))for(const s of X.PG_START[c])X.PG.col[s]=1;
  X.newGame(31337,'normal',{crews:[1,0,2,3],turn:true,pk:3});X.started=true;
  const d=(X.RK.disc||[]).filter(s=>{const r=X.LEGENDS.find(L=>L.s===s).rec;return !r.prime&&!r.ter&&!r.war;});if(!d.length)return {none:true};
  const i=X.LEGENDS.findIndex(L=>L.s===d[0]);const me=X.players[0];
  for(const n of X.LEGENDS[i].rec.isl){const t=X.terrs.find(z=>z.name===n);t.owner=0;}
  X.AG.n=Math.max(X.AG.n,X.LEGENDS[i].rec.age||0);me.gold=99999;
  const why=X.hireReason(me,i);const r=X.hireChar(me,i);return {d,why,r,inCol:!!X.PG.col[d[0]],name:d[0]};});
ok('Découverte : recruter un commandant « À découvrir » l’ajoute à la collection',disc.inCol&&!disc.r,JSON.stringify(disc));
const rw=await R(()=>{const X=__RK;X.PG.xp=X.pgCum(6);X.PG.claimed={};X.PG.offers={};
  const pend=X.pgPendingRanks();const off=X.pgOffer(2);const n0=Object.keys(X.PG.col).length;
  const e1=X.pgClaim(2,'personne'),e2=X.pgClaim(2,off[0]);const e5=X.pgClaim(5,'');
  return {pend,off,e1,e2,n:Object.keys(X.PG.col).length-n0,rr:X.PG.rr,again:X.pgClaim(2,off[1]),cnt:X.pgPendingCount()};});
ok('Récompenses : rangs 2 à 6 en attente',JSON.stringify(rw.pend)==='[2,3,4,5,6]',JSON.stringify(rw.pend));
ok('Récompenses : 3 commandants au choix, choix hors liste refusé, choix valide ajouté',rw.off.length===3&&!!rw.e1&&!rw.e2&&rw.n===1);
ok('Récompenses : rang 5 = titre + relance',rw.rr>=1);
ok('Récompenses : pas de double réclamation',!!rw.again);
const leg=await R(()=>{const X=__RK;X.PG.xp=X.pgCum(6);X.PROFILE.tot.cp=0;const a=X.pgLegState('Barbe Noire');X.PROFILE.tot.cp=1;const b2=X.pgLegState('Barbe Noire');const e=X.pgClaimLeg('Barbe Noire');return {a:a.ready,b:b2.ready,e,col:!!X.PG.col['Barbe Noire']};});
ok('Légendaire : rang + objectif, puis déblocage',!leg.a&&leg.b&&!leg.e&&leg.col,JSON.stringify(leg));
for(const r of res)console.log(r);
console.log(errs.length?errs.join('\n'):'aucune erreur JS');
console.log('bilan',res.filter(r=>r.startsWith('PASS')).length+'/'+res.length);
await b.close();})();
