// captures d'une île dans le jeu (copie de test) : node t_shots.js <dossier servi> <port> <préfixe> <île> [modes]
const {chromium}=require('playwright');const {spawn}=require('child_process');
const [dir,port,pre,ile,modes]=[process.argv[2],+process.argv[3],process.argv[4],process.argv[5]||'Water 7',(process.argv[6]||'25,3d').split(',')];
(async()=>{const srv=spawn('python3',['-m','http.server',port,'--bind','127.0.0.1'],{cwd:dir,stdio:'ignore'});await new Promise(r=>setTimeout(r,800));
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
for(const mode of modes){const p=await b.newPage({viewport:{width:1400,height:860},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(`http://127.0.0.1:${port}/essai_test.html`);await p.evaluate(m=>{localStorage.clear();localStorage.setItem('gl-tuto','1');localStorage.setItem('rk-tob','{"off":1}');localStorage.setItem('rk-w3',m==='3d'?'1':'0');},mode);await p.reload();await p.waitForTimeout(1500);
 await p.evaluate(()=>{let s=1;Math.random=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};const X=__RK;X.newGame(2024,'normal',{crews:[0,1,2,3],turn:false,pk:3});X.started=true;document.querySelector('#overlay').hidden=true;X.speed=0;});
 for(let i=0;i<500;i++){const ok=await p.evaluate(([m,ile])=>{const X=__RK,t=X.terrs.find(q=>q.name===ile);if(m==='3d')return X.W3.models.size>=X.terrs.length&&(!window.__BLX.isl[ile]||window.__BLX.isl[ile].ready3);const e=X.R25.cache.get(t.id);return e&&e.st==='ready'&&[...X.R25.cache.values()].filter(x=>x.st==='ready').length>=X.terrs.length-2;},[mode,ile]);if(ok)break;await p.waitForTimeout(700);}
 await p.evaluate(()=>document.querySelectorAll('.selcard,#minibox,.coach,.brief,.evbar,.log,.hint').forEach(e=>e.style.display='none'));
 const views=mode==='3d'?[['vue',2.2],['moyen',5],['proche',9]]:[['vue',1.6],['moyen',2.6],['proche',3.5]];
 for(const [nm,k] of views){await p.evaluate(([ile,k])=>{const X=__RK,t=X.terrs.find(q=>q.name===ile);X.V.k=k;X.V.x=t.x-1400/k/2;X.V.y=t.y-860/k/2;if(X.W3&&X.W3.cam){X.W3.cam.pitch=.95;X.W3.cam.yaw=0;}document.querySelector('#map').dispatchEvent(new WheelEvent('wheel',{deltaY:0.001,clientX:700,clientY:430,bubbles:true}));},[ile,k]);
  await p.waitForTimeout(mode==='3d'?4000:3500);await (await p.$('#mapwrap')).screenshot({path:`${pre}_${mode}_${nm}.png`});}
 console.log(mode,'ok',errs.length,'erreurs',errs.slice(0,2));await p.close();}
await b.close();srv.kill();})();
