// mémoire et temps des îles Blender (copie de test, instrumentation étape 0) : node t_mem.js <dir> <port> <sortie.json>
const {chromium}=require('playwright');const {spawn}=require('child_process');const fs=require('fs');
const [dir,pt,outf]=[process.argv[2],+process.argv[3],process.argv[4]];
(async()=>{const srv=spawn('python3',['-m','http.server',pt,'--bind','127.0.0.1'],{cwd:dir,stdio:'ignore'});await new Promise(r=>setTimeout(r,800));
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const res={};
for(const mode of ['3d','25']){const p=await b.newPage({viewport:{width:1400,height:860},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(`http://127.0.0.1:${pt}/essai_test.html`);await p.evaluate(m=>{localStorage.clear();localStorage.setItem('gl-tuto','1');localStorage.setItem('rk-tob','{"off":1}');localStorage.setItem('rk-w3',m==='3d'?'1':'0');},mode);await p.reload();await p.waitForTimeout(1500);
 await p.evaluate(()=>{const X=__RK;X.newGame(2024,'normal',{crews:[0,1,2,3],turn:false,pk:3});X.started=true;document.querySelector('#overlay').hidden=true;X.speed=0;});
 for(let i=0;i<500;i++){const ok=await p.evaluate(m=>{const X=__RK;if(m==='3d')return window.__BLX.loaded>=3&&X.W3.models.size>=X.terrs.length&&[...X.W3.models.values()].filter(q=>q.bl).length>=3;return [...X.R25.cache.values()].filter(x=>x.st==='ready').length>=X.terrs.length-2;},mode);if(ok)break;await p.waitForTimeout(700);}
 await p.waitForTimeout(3000);
 res[mode]=await p.evaluate(()=>{const s=__MES.snap();return {mem:s.mem,b3:Object.fromEntries(Object.entries(s.b3).filter(([n])=>['Zou','Whole Cake','Water 7'].includes(n))),fichiers:s.fichiers.filter(f=>/water_7|zou|whole_cake/.test(f.f)),verif:s.blxVerif,err:s.err,blxErr:s.blxErr,format:s.blxFormat};});
 res[mode].pageErrors=errs;await p.close();}
fs.writeFileSync(outf,JSON.stringify(res,null,1));console.log('ok');await b.close();srv.kill();})();
