/* Maquette : rendu sur 5 types d'îles (PC et mobile) + chaque bouton déclenche l'action existante (mêmes effets que la fiche actuelle). */
const {chromium}=require('playwright');
const D=__dirname+'/';
(async()=>{const b=await chromium.launch();const res=[];const ok=(n,c,d)=>{res.push((c?'PASS ':'FAIL ')+n+(d!==undefined?' — '+d:''));};
for(const vp of [{w:1400,h:2400,tag:'pc'},{w:400,h:860,tag:'mobile'}]){
const p=await b.newPage({viewport:{width:vp.w,height:vp.h}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+__dirname+'/../dist/risk_test.html');await p.evaluate(()=>{localStorage.clear();localStorage.setItem('gl-tuto','1');localStorage.setItem('rk-tob','{"off":1}');});await p.reload();await p.waitForTimeout(800);
const setup=await p.evaluate(()=>{const X=__RK;X.newGame(2024,'normal',{crews:[0,1,2,3],turn:true,pk:3});X.started=true;document.querySelector('#overlay').hidden=true;
  const cap=X.terrs.find(t=>t.owner===0&&t.capital);const neu=X.terrs.find(t=>t.owner<0&&cap.nb.includes(t.id))||X.terrs.find(t=>t.owner<0);
  /* un village à nous pour le cas « village » */
  neu.owner=0;const vil=neu;const neu2=X.terrs.find(t=>t.owner<0&&!X.BS.some(z=>z.t===t.id&&!z.dead)&&t.nb.some(n=>X.terrs[n].owner===0))||X.terrs.find(t=>t.owner<0);
  const en=X.terrs.find(t=>t.owner===1&&t.capital);const boss=X.terrs.find(t=>t.boss!==undefined&&X.BS[t.boss]&&!X.BS[t.boss].dead&&t.owner<0)||null;
  return {cap:cap.id,vil:vil.id,neu:neu2.id,en:en.id,boss:boss?boss.id:-1};});
const cases=[['capitale',setup.cap],['village',setup.vil],['neutre',setup.neu],['ennemie',setup.en]];if(setup.boss>=0)cases.push(['boss',setup.boss]);
for(const [nm,id] of cases){
  await p.evaluate(id=>{const X=__RK;X.ui.sel=id;X.ui.tab='army';X.renderPanel(true);document.querySelector('#side').scrollTop=0;},id);await p.waitForTimeout(350);
  const info=await p.evaluate(()=>{const s=document.querySelector('#side'),c=s.querySelector('.mq');return {h:c?Math.round(c.getBoundingClientRect().height):0,secs:[...s.querySelectorAll('.mqs>h4:first-child')].map(h=>h.textContent),ow:document.documentElement.scrollWidth<=innerWidth+1,first:s.querySelector('.card.mq')===s.querySelector('.card:not(.tcard)')||!!s.querySelector('.card.mq')};});
  ok(vp.tag+' '+nm+' : 3 sections (État / Que faire / Atouts et faiblesses)',info.secs.length===3,info.secs.join(' | ')+' · hauteur fiche '+info.h+' px');
  ok(vp.tag+' '+nm+' : pas de défilement horizontal',info.ow);
  if(vp.tag==='pc'){const el=await p.$('#side .card.mq');await el.screenshot({path:D+'s_apres_'+nm+'.png'});}
  else await p.screenshot({path:D+'s_mobile_'+nm+'.png',fullPage:false});
}
/* actions : chacune passe par le data-act existant et produit le même effet métier */
await p.evaluate(id=>{const X=__RK;X.ui.sel=id;X.players[0].gold=500;X.renderPanel(true);},setup.cap);await p.waitForTimeout(200);
const r=await p.evaluate(async id=>{const X=__RK,t=X.terrs[id],me=X.players[0],click=sel=>{const e=document.querySelector('#side '+sel);if(e&&!e.disabled){e.click();return true;}return false;};
  const g0=me.gold,u0=X.tr(t);const c1=click('.mq [data-act="recruit"][data-v="guerrier"]');const rec={click:c1,dg:g0-me.gold,du:X.tr(t)-u0};
  const f0=me.gold;const c2=click('.mq [data-act="fort"]');const fort={click:c2,fortified:t.fo>X.time,cost:f0-me.gold};
  X.renderPanel(true);const c3=click('.mq [data-act="pct"][data-v="1"]');const pct=X.ui.pct;
  X.renderPanel(true);const c4=click('.mq [data-act="tab"][data-v="city"]');const tab=X.ui.tab,sel=X.ui.sel;
  X.ui.tab='army';X.renderPanel(true);const c5=click('.mq [data-act="mqx"][data-v="prod"]');const fold=!!document.querySelector('#side .mqfb');
  return {rec,fort,c3,pct,c4,tab,sel,c5,fold};},setup.cap);
ok(vp.tag+' Recruter : même effet (Berrys débités, garnison +5)',r.rec.click&&r.rec.dg>0&&r.rec.du===5,JSON.stringify(r.rec));
ok(vp.tag+' Fortifier : même effet (île fortifiée, coût débité)',r.fort.click&&r.fort.fortified&&r.fort.cost>0,JSON.stringify(r.fort));
ok(vp.tag+' Part envoyée 100 % : même réglage ui.pct',r.c3&&r.pct===1);
ok(vp.tag+' « Construire » ouvre l’écran Villes existant, île conservée',r.c4&&r.tab==='city'&&r.sel===setup.cap);
ok(vp.tag+' Détails repliables',r.c5&&r.fold);
/* lieutenant : affectation directe = action cpost existante */
const lt=await p.evaluate(id=>{const X=__RK,me=X.players[0],cid=X.CREWS[me.crew].id,ro=X.pgRosterNow()[cid];
  const i=X.LEGENDS.findIndex(L=>ro.includes(L.s));X.CH_()[i].own=0;X.CH_()[i].post=-1;X.ui.sel=id;X.ui.tab='army';X.renderPanel(true);
  const btn=document.querySelector('#side .mq [data-act="cpost"]');if(!btn)return {none:true};btn.click();return {post:X.CH_()[i].post,id,name:X.LEGENDS[i].s};},setup.cap);
ok(vp.tag+' Lieutenant : « Affecter » = même action (poste sur l’île)',lt.post===lt.id,JSON.stringify(lt));
ok(vp.tag+' Aucune erreur JS',!errs.length,errs.join(' | '));
await p.close();}
for(const r of res)console.log(r);console.log('bilan',res.filter(r=>r.startsWith('PASS')).length+'/'+res.length);await b.close();})();
