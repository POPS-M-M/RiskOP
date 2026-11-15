// gros plans d'une île dans le jeu (copie de test) : node t_zones.js <dossier servi> <port> <préfixe> <île> <zones.json> [modes]
// zones.json : [[nom, dx, dy, k25, k3d], ...] décalages en unités de carte depuis le centre de l'île (x est, y sud)
const {chromium}=require('playwright');const {spawn}=require('child_process');const fs=require('fs');
const [dir,port,pre,ile,zf,modes]=[process.argv[2],+process.argv[3],process.argv[4],process.argv[5],process.argv[6],(process.argv[7]||'25,3d').split(',')];
const Z=JSON.parse(fs.readFileSync(zf,'utf8'));
(async()=>{const srv=spawn('python3',['-m','http.server',port,'--bind','127.0.0.1'],{cwd:dir,stdio:'ignore'});await new Promise(r=>setTimeout(r,800));
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
for(const mode of modes){const p=await b.newPage({viewport:{width:1400,height:860},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(`http://127.0.0.1:${port}/essai_test.html`);await p.evaluate(m=>{localStorage.clear();localStorage.setItem('gl-tuto','1');localStorage.setItem('rk-tob','{"off":1}');localStorage.setItem('rk-w3',m==='3d'?'1':'0');},mode);await p.reload();await p.waitForTimeout(1500);
 await p.evaluate(()=>{let s=1;Math.random=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};const X=__RK;X.newGame(2024,'normal',{crews:[0,1,2,3],turn:false,pk:3});X.started=true;document.querySelector('#overlay').hidden=true;X.speed=0;});
 for(let i=0;i<500;i++){const ok=await p.evaluate(([m,ile])=>{const X=__RK,t=X.terrs.find(q=>q.name===ile);if(m==='3d')return X.W3.models.size>=X.terrs.length&&(!window.__BLX.isl[ile]||window.__BLX.isl[ile].ready3);const e=X.R25.cache.get(t.id);return e&&e.st==='ready'&&[...X.R25.cache.values()].filter(x=>x.st==='ready').length>=X.terrs.length-2;},[mode,ile]);if(ok)break;await p.waitForTimeout(700);}
 await p.evaluate(()=>document.querySelectorAll('.selcard,#minibox,.coach,.brief,.evbar,.log,.hint').forEach(e=>e.style.display='none'));
 for(const [nm,dx,dy,k25,k3] of Z){const k=mode==='3d'?k3:k25;
  const got=await p.evaluate(([ile,dx,dy,k])=>{const X=__RK,t=X.terrs.find(q=>q.name===ile);const Wm=(typeof W!=='undefined')?W:1400,Hm=(typeof H!=='undefined')?H:860;X.V.k=k;X.V.x=t.x+dx-Wm/k/2;X.V.y=t.y+dy-Hm/k/2;if(X.W3&&X.W3.cam){X.W3.cam.pitch=.95;X.W3.cam.yaw=0;}document.querySelector('#map').dispatchEvent(new WheelEvent('wheel',{deltaY:0.001,clientX:700,clientY:430,bubbles:true}));return 0;},[ile,dx,dy,k]);
  await p.waitForTimeout(mode==='3d'?4000:3500);const kv=await p.evaluate(([ile])=>{const X=__RK,t=X.terrs.find(q=>q.name===ile);const Wm=(typeof W!=='undefined')?W:1400,Hm=(typeof H!=='undefined')?H:860;return [X.V.k,X.V.x+Wm/X.V.k/2-t.x,X.V.y+Hm/X.V.k/2-t.y,Wm,Hm];},[ile]);await (await p.$('#mapwrap')).screenshot({path:`${pre}_${mode}_${nm}.png`});console.log(mode,nm,'k demandé',k,'obtenu',kv.map(v=>+v.toFixed(2)).join(' '));}
 console.log(mode,'ok',errs.length,'erreurs',errs.slice(0,2));await p.close();}
await b.close();srv.kill();})();
