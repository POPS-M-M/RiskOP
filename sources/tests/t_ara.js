const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();
const res=[];const ok=(n,c,d)=>{res.push((c?'PASS ':'FAIL ')+n+(d!==undefined?' — '+d:''));};const errs=[];
const lt=async(url)=>{const p=await b.newPage({viewport:{width:1400,height:860}});p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{window.__LT=[];try{new PerformanceObserver(l=>{for(const e of l.getEntries())window.__LT.push(Math.round(e.duration));}).observe({type:'longtask',buffered:true});}catch(_){}});
  await p.goto(url);await p.evaluate(()=>{localStorage.setItem('gl-tuto','1');});await p.waitForTimeout(6000);
  const v=await p.evaluate(()=>({lt:window.__LT.slice(),max:Math.max(0,...window.__LT)}));await p.close();return v;};
const before=await lt('http://127.0.0.1:8766/ref_v2.html');
const after=await lt('http://127.0.0.1:8766/risk_test.html');
console.log('longtasks avant',JSON.stringify(before),'après',JSON.stringify(after));
const p=await b.newPage({viewport:{width:1400,height:860}});p.on('pageerror',e=>errs.push(e.message+' @ '+(e.stack||'').split('\n')[1]));
await p.goto('http://127.0.0.1:8766/risk_test.html');await p.evaluate(()=>{localStorage.setItem('gl-tuto','1');});await p.reload();
const t0=Date.now();await p.waitForFunction(()=>__RK.R25.allReady,null,{timeout:200000,polling:500});
const ready=Date.now()-t0;const sl=await p.evaluate(()=>({ms:__RK.R25.ms,max:+__RK.R25.maxSlice.toFixed(1)}));
ok('53 îles préparées en tâche de fond, sans gel',after.max<before.max&&sl.max<30,'toutes prêtes en '+(ready/1000).toFixed(1)+' s (tranche la plus longue '+sl.max+' ms) ; plus longue tâche au chargement : version précédente (Alabasta seule, sans découpage) '+before.max+' ms, maintenant '+after.max+' ms');
await p.click('#o-go');await p.waitForTimeout(500);
/* stabilité */
const st=await p.evaluate(async()=>{const X=__RK,t=X.terrs.find(t=>t.name==='Alabasta');const w=ms=>new Promise(r=>setTimeout(r,ms));
  for(let k=0;k<10;k++){X.r25Toggle();await w(60);} const on1=X.R25.on;
  const owners=[];for(const o of [0,1,2,3,-1]){t.owner=o;await w(120);owners.push(o);}
  const c=X.R25.cache.get(t.id);const comps=Object.keys(c.comp||{}).length;
  X.V.k=3.5;X.V.x=t.x-200;X.V.y=t.y-120;await w(200);X.V.k=1;X.V.x=0;X.V.y=0;await w(100);
  for(let g=0;g<3;g++){X.newGame(1000+g,'normal',{turn:true,pk:3});X.started=true;await w(150);}
  const size=X.R25.cache.size,done=X.R25.cache.get(t.id).st==='ready';
  const e=X.svWrite('rk-s1','A');const m=X.svRestore(X.svRead('rk-s1'));
  return {on1,comps,size,done,save:e+m,lru:X.R25.lru.length};});
ok('Stabilité : bascules, changements de camp, zoom, 3 nouvelles parties, sauvegarde',st.on1===true&&st.size===53&&st.done&&st.save===''&&true,JSON.stringify(st));
await p.setViewportSize({width:900,height:700});await p.waitForTimeout(300);await p.setViewportSize({width:1400,height:860});await p.waitForTimeout(300);
/* clics toujours bons sur Alabasta après tout ça */
const ar=await p.evaluate(()=>{const X=__RK,t=X.terrs.find(t=>t.name==='Alabasta');X.V.k=3;X.V.x=t.x-1400/6;X.V.y=t.y-860/6;const r=document.querySelector('#map').getBoundingClientRect(),V=X.V;return {id:t.id,x:r.left+(t.x-V.x)*V.k/1400*r.width,y:r.top+(t.y-t.rad*.3-V.y)*V.k/860*r.height};});
await p.waitForTimeout(300);await p.evaluate(()=>{__RK.ui.sel=-1;});await p.mouse.click(ar.x,ar.y);await p.waitForTimeout(200);
ok('Alabasta reste sélectionnable',await p.evaluate(id=>__RK.ui.sel===id,ar.id));
const fps=async()=>p.evaluate(()=>new Promise(r=>{let n=0;const t0=performance.now();function f(){n++;if(performance.now()-t0<3000)requestAnimationFrame(f);else r(Math.round(n/((performance.now()-t0)/1000)));}requestAnimationFrame(f);}));
const f1=await fps();await p.evaluate(()=>__RK.r25Toggle());const f0=await fps();await p.evaluate(()=>__RK.r25Toggle());
ok('Fluidité (sans GPU)',f1>=f0*.8,'2.5D '+f1+' i/s · ancien rendu '+f0+' i/s');
console.log(res.join('\n'));console.log(errs.join('\n')||'aucune erreur JS');await b.close()})();
