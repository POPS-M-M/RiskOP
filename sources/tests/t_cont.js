const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1400,height:860}});const errs=[];
p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+__dirname+'/../dist/'+(process.argv[2]||'risk_op.html'));await p.evaluate(()=>{localStorage.clear();localStorage.setItem('gl-tuto','1');});await p.reload();await p.waitForTimeout(600);
const hasCont0=await p.evaluate(()=>!!document.querySelector('#o-cont'));
await p.click('#o-go');await p.waitForTimeout(400);
for(let i=0;i<3;i++){await p.click('[data-speed="4"]');await p.click('#b-end');await p.waitForFunction(()=>/ordres/.test(document.querySelector('#clock').textContent)&&!/Tour 1 /.test(document.querySelector('#clock').textContent),{timeout:20000}).catch(()=>{});await p.waitForTimeout(300);}
const clk=await p.evaluate(()=>document.querySelector('#clock').textContent);
await p.click('#b-new');await p.waitForTimeout(500);
const cont=await p.evaluate(()=>{const b=document.querySelector('#o-cont');return b&&b.textContent;});
await p.click('#o-cont');await p.waitForTimeout(600);
const clk2=await p.evaluate(()=>document.querySelector('#clock').textContent);
const ov=await p.evaluate(()=>document.querySelector('#overlay').hidden);
console.log(JSON.stringify({bouton_continuer_avant:hasCont0,horloge_avant:clk,bouton:cont,horloge_apres:clk2,overlay_cache:ov}));
console.log(errs.join('\n')||'aucune erreur JS');await b.close()})();
