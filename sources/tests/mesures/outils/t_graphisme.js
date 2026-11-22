/* Prototype graphique : capture d'une scène de combat figée, rendu actuel (m0) / prototype (m1) / prototype sans détail du sol (m2), même caméra ; taille des sprites à l'écran et temps d'image. DIR=<dossier servi (essai_test.html + iles/)> MODES=0,1 node t_graphisme.js essai_test.html sortie 6,9 */
/* Capture d'une scène de combat figée (même cadrage) : rendu actuel / prototype. node tg.js <html servi> <sortie-prefixe> [tau...] */
const {chromium}=require('playwright');const {spawn}=require('child_process');
(async()=>{const port=8800+Math.floor(Math.random()*90);const srv=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:process.env.DIR||'.',stdio:'ignore'});await new Promise(r=>setTimeout(r,800));
const page=process.argv[2]||'essai_test.html',out=process.argv[3]||'cap',taus=(process.argv[4]||'6').split(',').map(Number),dsf=+(process.env.DSF||1),modes=(process.env.MODES||'0').split(',');
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1400,height:860},deviceScaleFactor:dsf});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(/warn|error/.test(m.type())&&!/ERR_TUNNEL|GL Driver|Failed to load/.test(m.text()))errs.push(m.text().slice(0,200));});
await p.goto(`http://127.0.0.1:${port}/${page}`);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('gl-tuto','1');localStorage.setItem('rk-tob','{"off":1}');localStorage.setItem('rk-w3','1');});await p.reload();await p.waitForTimeout(1500);
const SC=process.env.SC||'w7';
await p.evaluate(()=>{let s=7;Math.random=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};CS.start({seat:'marine',seed:2024,dk:'normal',turn:false,pk:6});document.querySelectorAll('.tu-card,.tob').forEach(e=>e.remove());});
for(let i=0;i<300;i++){const r=await p.evaluate(()=>{const X=__RK;return X.W3.models.size>=X.terrs.length&&Object.values(window.__BLX.isl).every(I=>I.ready3||I.fail3);});if(r)break;await p.waitForTimeout(500);}
const info=await p.evaluate((SC)=>{const X=__RK,tn=SC==='ala'?'Alabasta':'Water 7',t=X.terrs.find(q=>q.name===tn),f=X.terrs[t.nb.find(n=>X.terrs[n].boss===undefined)];
  t.owner=2;t.u={guerrier:14,lancier:0,archer:8,cavalier:0,catapulte:0,elite:0};f.owner=0;f.u={guerrier:30,lancier:14,archer:0,cavalier:0,catapulte:0,elite:0};
  const CH=X.CH_(),L=X.LEGENDS,gi=L.findIndex(l=>l.s==='Garp'),ai=L.findIndex(l=>l.s==='Ace');
  CH[gi].own=0;CH[gi].post=f.id;CH[ai].own=2;CH[ai].post=t.id;X.declareWar(0,2);
  X.players[0].human=true;X.speed=1;const e=X.launch(0,f.id,t.id,1);return {e,t:t.name,f:f.name};},SC);
for(let k=0;k<40;k++){const s=await p.evaluate(()=>!!(__RK.B3&&__RK.B3.run));if(s)break;await p.evaluate(()=>{for(let i=0;i<8;i++)__RK.step(.25);});await p.waitForTimeout(300);}
const res={info,shots:[]};
for(const tau of taus){await p.evaluate(tau=>{__RK.B3.freeze=tau;window.__TRP.mesure=true;},tau);await p.waitForTimeout(3500);
  for(const m of modes){await p.evaluate(m=>{if(window.__GFX){__GFX.det=m==='2'?0:1;if(m==='3'){__GFX.det=0;__GFX.hsC=1;__GFX.hsCmd=1;}if(m==='4'){__GFX.det=0;__GFX.hsC=1;__GFX.hsCmd=1;document.body.classList.remove('b3run');}__GFX.set(m!=='0');}},m);await p.waitForTimeout(1600);
    const st=await p.evaluate(()=>{const T=window.__TRPst();return {hpx:T.hpx,spr:T.spr,ms:T.ms,dpr:devicePixelRatio,cv:[__RK.W3.cv.width,__RK.W3.cv.height]};});
    const fn=`${out}_t${tau}_m${m}.png`;await p.screenshot({path:fn,clip:{x:16,y:205,width:1010,height:640}});res.shots.push({fn,tau,m,st});}}
/* coût d'une image : moyenne sur 60 images (rendu logiciel SwiftShader : valeurs relatives) */
for(const m of modes){await p.evaluate(m=>{if(window.__GFX){__GFX.det=m==='2'?0:1;if(m==='3'){__GFX.det=0;__GFX.hsC=1;__GFX.hsCmd=1;}if(m==='4'){__GFX.det=0;__GFX.hsC=1;__GFX.hsCmd=1;document.body.classList.remove('b3run');}__GFX.set(m!=='0');}},m);const ft=await p.evaluate(()=>new Promise(r=>{const ts=[];let last=performance.now(),n=0,ms=0;const f=()=>{const t=performance.now();ts.push(t-last);last=t;ms+=window.__TRPst().ms||0;if(++n<90)requestAnimationFrame(f);else r({frame:ts.slice(5).reduce((a,b)=>a+b,0)/(ts.length-5),trp:ms/60});};requestAnimationFrame(f);}));(res.perf=res.perf||[]).push([m,Math.round(ft.frame*10)/10,Math.round(ft.trp*100)/100]);}
res.errs=errs.slice(0,6);console.log(JSON.stringify(res));await b.close();srv.kill();})();
