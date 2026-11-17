/* lance le banc ⏱ sur une copie servie en http : node t_banc2.js dossier port sortie */
const {chromium}=require('playwright');const {spawn}=require('child_process');const fs=require('fs');
const [dir,pt,out]=[process.argv[2],+process.argv[3],process.argv[4]];
(async()=>{const srv=spawn('python3',['-m','http.server',pt,'--bind','127.0.0.1'],{cwd:dir,stdio:'ignore'});await new Promise(r=>setTimeout(r,800));
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']}),p=await b.newPage({viewport:{width:1000,height:640}});
p.on('pageerror',e=>console.log('ERR',e.message));const T0=Date.now();await p.addInitScript(()=>{let s=20241115;Math.random=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};});
await p.goto(`http://127.0.0.1:${pt}/essai_test.html`);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('gl-tuto','1');localStorage.setItem('rk-tob','{"off":1}');localStorage.setItem('rk-w3','1');});await p.reload();await p.waitForTimeout(1500);
await p.evaluate(()=>{const X=__RK;X.newGame(2024,'normal',{crews:[0,1,2,3],turn:false,pk:3});X.started=true;document.querySelector('#overlay').hidden=true;X.speed=0;});
for(let i=0;i<500;i++){const s=await p.evaluate(()=>__RK.W3.models.size>=__RK.terrs.length&&window.__BLX.loaded>=2);if(s)break;await p.waitForTimeout(600);}
const isNew=await p.evaluate(()=>!!window.__MES);let pre='';
if(isNew){await p.click('#z-banc');await p.waitForTimeout(300);await p.click('#banc-copy');await p.waitForTimeout(500);pre=await p.evaluate(()=>{const t=document.querySelector('#banc-out textarea');return t?t.value:'';});}
else{await p.click('#z-banc');await p.waitForTimeout(500);}await p.click('#banc-go');
for(let i=0;i<2400;i++){const d=await p.evaluate(()=>document.getElementById('banc-go').disabled);if(!d&&i>5)break;await p.waitForTimeout(1000);}
const st=await p.evaluate(()=>document.getElementById('banc-st').textContent);let txt='',js='';
if(isNew){await p.click('#banc-copy');await p.waitForTimeout(500);txt=await p.evaluate(()=>{const t=document.querySelector('#banc-out textarea');return t?t.value:'';});await p.click('#banc-json');await p.waitForTimeout(500);js=await p.evaluate(()=>{const t=document.querySelector('#banc-out textarea');return t?t.value:'';});}
else txt=await p.evaluate(()=>document.getElementById('banc-out').innerText);
fs.writeFileSync(out+'.txt','# statut : '+st+'\n# durée totale du test '+Math.round((Date.now()-T0)/1000)+' s\n'+txt+(pre?'\n\n# ---- instantané AVANT la mesure (après chargement) ----\n'+pre:''));if(js)fs.writeFileSync(out+'.json',js);
console.log('fini',out,Math.round((Date.now()-T0)/1000),'s');await b.close();srv.kill();})();
