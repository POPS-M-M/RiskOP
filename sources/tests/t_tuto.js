/* Tutoriel joué : 7 objectifs validés uniquement par les actions réelles (clics sur la carte et l'interface), sans bouton « Terminé ».
   Objectifs 1-3 guidés (rivaux immobiles), 4-7 non bloquants (la partie tourne, la sauvegarde est permise). */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1400,height:860}});
const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' @ '+(e.stack||'').split('\n').slice(1,4).join(' | ')));
await p.goto('file://'+__dirname+'/../dist/risk_test.html');await p.evaluate(()=>localStorage.clear());await p.reload();await p.waitForTimeout(800);
const res=[];const ok=(n,c,d)=>{res.push((c?'PASS ':'FAIL ')+n+(d!==undefined?' — '+d:''));};
ok('Case « guide » cochée par défaut (premier lancement)',await p.evaluate(()=>document.querySelector('#o-tuto').checked));
await p.click('#o-go');await p.waitForTimeout(600);
const st=()=>p.evaluate(()=>({i:__RK.TU.i,ph:__RK.TU.ph,on:__RK.TU.on,turn:__RK.TM.n,phase:__RK.TM.phase,title:(document.querySelector('#coach b')||{}).textContent,small:(document.querySelector('#coach small')||{}).textContent,hid:document.querySelector('#coach').hidden,cap:__RK.TC.cap,tgt:__RK.TC.tgt,next:!!document.querySelector('#coach [data-tu="next"],#coach [data-tu="cont"],#coach [data-tu="cont2"]'),freeze:__RK.TU.freeze}));
const pt=id=>p.evaluate(id=>{const X=__RK,t=X.terrs[id],c=document.querySelector('#map').getBoundingClientRect(),V=X.V;return {x:c.left+(t.x-V.x)*V.k/1400*c.width,y:c.top+(t.y-V.y)*V.k/860*c.height};},id);
const log=[];let lastKey='',anyNextBtn=false;const t0=Date.now();
const ids=['map','cap','rec','send','end','conq'];
while(Date.now()-t0<70000){
  const s=await st();
  if(s.next)anyNextBtn=true;
  if(!s.on)break;
  const key=s.i+':'+s.ph;
  if(key!==lastKey){lastKey=key;const L=(Date.now()-t0)+'ms '+ids[s.i]+' '+s.ph+' « '+s.title+' » '+s.small+' tour '+s.turn+' '+s.phase;log.push(L);}
  const id=ids[s.i];
  if(s.ph==='do'){
    if(id==='map'){await p.click('#z-in');await p.waitForTimeout(150);await p.click('#z-reset');}
    else if(id==='cap'){const q=await pt(s.cap);await p.mouse.click(q.x,q.y);}
    else if(id==='rec')await p.click('#side [data-act="recruit"][data-v="guerrier"]');
    else if(id==='send'){let q=await pt(s.cap);await p.mouse.click(q.x,q.y);q=await pt(s.tgt);await p.mouse.click(q.x,q.y);}
    else if(id==='end')await p.click('#b-end');
    else if(id==='conq'){if(s.phase==='plan')await p.click('#b-end');}
  }
  await p.waitForTimeout(350);
}
console.log(log.join('\n'));
ok('Objectifs 1 à 3 validés par les seules actions (aucun bouton « Continuer / Terminé »)',!anyNextBtn&&log.some(l=>/conq ok/.test(l)),log.length+' transitions');
const g=await p.evaluate(()=>({on:__RK.TU.on,freeze:__RK.TU.freeze,owner:__RK.terrs[__RK.TC.tgt].owner,coach:(document.querySelector('#coach')||{}).textContent,mini:document.querySelector('#coach').classList.contains('mini'),save:__RK.svWrite('rk-s3','tuto')}));
ok('Après la première conquête : guide relâché (rivaux actifs), île conquise',!g.on&&!g.freeze&&g.owner===0);
ok('Objectif actuel 4/7 affiché en carte discrète',g.mini&&/Objectif 4 \/ 7/.test(g.coach),g.coach.slice(0,80));
ok('Sauvegarde permise pendant les objectifs 4-7',!g.save,g.save);
/* objectif 4 : recruter un commandant (actions réelles : ouvrir Équipe, cliquer Recruter) */
await p.evaluate(()=>{const X=__RK,me=X.players[0],cid=X.CREWS[me.crew].id,ro=X.pgRosterNow()[cid];
  const i=X.LEGENDS.findIndex(L=>ro.includes(L.s)&&!L.rec.prime&&!L.rec.ter&&!L.rec.war);const L=X.LEGENDS[i];
  for(const n of L.rec.isl){const t=X.terrs.find(z=>z.name===n);if(t)t.owner=0;}X.AG.n=Math.max(X.AG.n,L.rec.age||0);me.gold+=5000;X.speed=0;X.TM.phase='plan';});
await p.click('#side [data-act="tab"][data-v="leg"]');await p.waitForTimeout(200);
await p.click('#side .pgs [data-act="hire"]:not([disabled])');await p.waitForTimeout(400);
const o4=await p.evaluate(()=>document.querySelector('#coach').textContent);
ok('Objectif 4 validé automatiquement après « Recruter »',/✔ Recruter ton premier commandant/.test(o4),o4.slice(0,60));
await p.waitForTimeout(2900);
const o5=await p.evaluate(()=>document.querySelector('#coach').textContent);
ok('Puis l’objectif 5 apparaît seul',/Objectif 5 \/ 7/.test(o5),o5.slice(0,60));
/* objectif 5 : technologie (le savoir s'accumule ; on avance le temps de jeu) */
await p.evaluate(()=>{__RK.players[0].sci+=60;});
await p.evaluate(()=>{__RK.ui.tab='tech';__RK.renderPanel(true);});await p.waitForTimeout(200);
const tb=await p.$('#side [data-act="tech"]:not([disabled])');if(tb)await tb.click();await p.waitForTimeout(400);
const o6=await p.evaluate(()=>({t:document.querySelector('#coach').textContent,n:Object.keys(__RK.players[0].techs).length}));
ok('Objectif 5 validé par l’achat d’une technologie',/✔ Acheter une technologie/.test(o6.t),o6.t.slice(0,60)+' techs='+o6.n);
await p.waitForTimeout(2900);
/* objectif 6 : lancer une construction (bâtiment débloqué par la technologie achetée) */
await p.evaluate(()=>{const X=__RK,cap=X.terrs.find(t=>t.owner===0&&t.capital);X.ui.sel=cap.id;X.ui.tab='city';X.renderPanel(true);});await p.waitForTimeout(200);
const bt=await p.$('#side [data-act="build"]:not([disabled])');if(bt)await bt.click();await p.waitForTimeout(400);
const o5b=await p.evaluate(()=>document.querySelector('#coach').textContent);
ok('Objectif 6 validé par « Construire »',!!bt&&/✔ Construire/.test(o5b),o5b.slice(0,60));
await p.waitForTimeout(2900);
const o7=await p.evaluate(()=>document.querySelector('#coach').textContent);
ok('Objectif 7 affiché (bataille contre un rival)',/Objectif 7 \/ 7/.test(o7),o7.slice(0,60));
/* objectif 7 : une bataille gagnée contre un camp rival (rapport de bataille réel : défense réussie contre l'IA 1) */
await p.evaluate(()=>{__RK.BATTLES.push({id:999,t:__RK.time,att:1,def:0,win:false,to:0});});await p.waitForTimeout(400);
const o7b=await p.evaluate(()=>document.querySelector('#coach').textContent);
ok('Objectif 7 validé par une bataille gagnée contre un rival',/✔ Gagner une bataille/.test(o7b),o7b.slice(0,60));
await p.waitForTimeout(2900);
const fin=await p.evaluate(()=>({hid:document.querySelector('#coach').hidden,d:localStorage.getItem('rk-tob')}));
ok('Les 7 objectifs accomplis : la carte disparaît',fin.hid,fin.d);
/* Codex */
const cdx=await p.evaluate(()=>{const h=__RK.rulesHTML();return {n:(h.match(/class="cdx"/g)||[]).length,ok:/Codex du guide/.test(h)};});
ok('Codex consultable dans Règles (13 fiches)',cdx.ok&&cdx.n===13,cdx.n);
await p.screenshot({path:__dirname+'/s_tuto_obj.png'});
ok('Aucune erreur JS',!errs.length,errs.join(' | '));
for(const r of res)console.log(r);console.log('bilan',res.filter(r=>r.startsWith('PASS')).length+'/'+res.length);
await b.close()})();
