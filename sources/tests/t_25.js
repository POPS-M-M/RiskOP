const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1400,height:860}});
const res=[];const ok=(n,c,d)=>{res.push((c?'PASS ':'FAIL ')+n+(d!==undefined?' — '+d:''));};const errs=[];
let p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message+' @ '+(e.stack||'').split('\n')[1]));
await p.goto('http://127.0.0.1:8766/risk_test.html');await p.evaluate(async()=>{localStorage.clear();localStorage.setItem('gl-tuto','1');await new Promise(r=>{const q=indexedDB.deleteDatabase('risk-op-rendu');q.onsuccess=q.onerror=q.onblocked=()=>r();});});await p.reload();
let t0=Date.now();await p.waitForFunction(()=>__RK.R25.allReady,null,{timeout:200000,polling:500});const first=(Date.now()-t0)/1000;
const st1=await p.evaluate(()=>({built:__RK.R25.built,db:__RK.R25.fromDB,err:[...__RK.R25.cache.values()].filter(e=>e.st==='error').length}));
ok('Première visite : les 53 îles calculées en tâche de fond',st1.built===53&&st1.err===0,first.toFixed(1)+' s, '+JSON.stringify(st1));
await p.waitForTimeout(3000);
await p.close();p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
t0=Date.now();await p.goto('http://127.0.0.1:8766/risk_test.html');await p.waitForFunction(()=>__RK.R25.allReady,null,{timeout:60000,polling:100});const second=(Date.now()-t0)/1000;
const st2=await p.evaluate(()=>({built:__RK.R25.built,db:__RK.R25.fromDB}));
ok('Visite suivante : îles relues depuis le cache du navigateur, sans recalcul',st2.built===0&&st2.db===53,second.toFixed(1)+' s, '+JSON.stringify(st2));
await p.click('#o-go');await p.waitForTimeout(600);
/* clics : 12 îles prises au hasard, clic au centre logique */
const ids=await p.evaluate(()=>__RK.terrs.filter((t,i)=>i%4===0).map(t=>t.id));let good=0,bad=[];
for(const id of ids){const c=await p.evaluate(id=>{const X=__RK,t=X.terrs[id];X.V.k=2.4;X.V.x=Math.max(0,Math.min(1400-1400/2.4,t.x-1400/2.4/2));X.V.y=Math.max(0,Math.min(860-860/2.4,t.y-860/2.4/2));X.ui.sel=-1;const r=document.querySelector('#map').getBoundingClientRect(),V=X.V;return {x:r.left+(t.x-V.x)*V.k/1400*r.width,y:r.top+(t.y-V.y)*V.k/860*r.height};},id);
  await p.waitForTimeout(120);await p.mouse.click(c.x,c.y);await p.waitForTimeout(120);if(await p.evaluate(id=>__RK.ui.sel===id,id))good++;else bad.push(id);}
ok('Sélection au clic sur '+ids.length+' îles détaillées',good===ids.length,good+'/'+ids.length+(bad.length?' échecs '+bad:''));
/* fiche d'île : vraie vue 2.5D */
await p.evaluate(()=>{const X=__RK,t=X.terrs.find(t=>t.name==='Wano');X.ui.sel=t.id;X.ui.tab='army';X.renderPanel(true);});
let ban=null;for(let k=0;k<20&&!ban;k++){await p.waitForTimeout(250);await p.evaluate(()=>{__RK.renderPanel(true);});ban=await p.evaluate(()=>{const i=document.querySelector('#side .sh-art img.art25');return i&&i.complete&&i.naturalWidth?i.naturalWidth+'×'+i.naturalHeight:null;});}
ok('Fiche d’île : illustration = rendu 2.5D de l’île',!!ban,ban);
await p.screenshot({path:'v_banner.png',clip:{x:1030,y:240,width:360,height:300}});
/* bascule 2.5D → ancienne illustration */
await p.evaluate(()=>{__RK.r25Toggle();__RK.renderPanel(true);});await p.waitForTimeout(200);
ok('2.5D désactivé : ancienne illustration et ancienne carte',await p.evaluate(()=>!!document.querySelector('#side .sh-art svg.art')&&!__RK.R25.on));
await p.evaluate(()=>{__RK.r25Toggle();});
/* fluidité */
const fps=async()=>p.evaluate(()=>new Promise(r=>{let n=0;const t0=performance.now();function f(){n++;if(performance.now()-t0<3000)requestAnimationFrame(f);else r(Math.round(n/((performance.now()-t0)/1000)));}requestAnimationFrame(f);}));
await p.evaluate(()=>{__RK.V.k=1;__RK.V.x=0;__RK.V.y=0;});const fo=await fps();
await p.evaluate(()=>{const X=__RK,t=X.terrs.find(t=>t.name==='Wano');X.V.k=3.5;X.V.x=0;X.V.y=Math.max(0,t.y-120);});const fz=await fps();
await p.evaluate(()=>__RK.r25Toggle());const f0=await fps();await p.evaluate(()=>__RK.r25Toggle());
const mem=await p.evaluate(()=>{let full=0,px=0;for(const e of __RK.R25.cache.values()){if(e.full){full++;px+=e.meta.Wc*e.meta.Hc*4;}if(e.small)px+=e.small.width*e.small.height*4;}return {full,mo:Math.round(px/1048576)};});
ok('Fluidité (navigateur sans GPU)',fo>=40&&fz>=40,'vue d’ensemble '+fo+' i/s · zoom max '+fz+' i/s · ancien rendu '+f0+' i/s ; images pleine définition en mémoire : '+mem.full+' (≈ '+mem.mo+' Mo de pixels)');
/* conquête et changement de propriétaire visibles */
const cq=await p.evaluate(async()=>{const X=__RK,c=X.terrs.find(t=>t.owner===0&&t.capital),n=c.nb.map(i=>X.terrs[i]).filter(t=>t.owner<0&&t.boss===undefined).sort((a,b)=>X.tr(a)-X.tr(b))[0];X.cmd({k:'recruit',t:c.id,u:'guerrier'});X.cmd({k:'launch',f:c.id,to:n.id,pct:1,st:0});X.speed=4;X.cmd({k:'ready'});for(let i=0;i<60&&n.owner!==0;i++)await new Promise(r=>setTimeout(r,250));return {owner:n.owner,name:n.name,ready:X.R25.cache.get(n.id).st};});
ok('Conquête d’une île détaillée',cq.owner===0&&cq.ready==='ready',JSON.stringify(cq));
const sv=await p.evaluate(()=>{const X=__RK;return X.svWrite('rk-s1','A')+X.svRestore(X.svRead('rk-s1'));});ok('Sauvegarde / chargement',sv==='',sv);
await p.evaluate(()=>{__RK.V.k=1;__RK.V.x=0;__RK.V.y=0;});await p.waitForTimeout(400);await p.screenshot({path:'v_overview.png'});
console.log(res.join('\n'));console.log(errs.join('\n')||'aucune erreur JS');await b.close()})();
