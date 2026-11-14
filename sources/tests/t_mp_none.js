const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext();
for(const [lbl,init] of [['sans claude (lien public)',''],['use() ne répond jamais','window.claude={use:()=>new Promise(()=>{})};'],['use() → null','window.claude={use:async()=>null};']]){
  const p=await ctx.newPage();if(init)await p.addInitScript({content:init});await p.goto('http://127.0.0.1:8766/risk_test.html');await p.waitForTimeout(lbl.includes('jamais')?13500:1500);
  console.log(lbl,'→',JSON.stringify(await p.evaluate(()=>({why:document.querySelector('#o-why').textContent.slice(0,90),dis:document.querySelector('#o-host').disabled,solo:!document.querySelector('#o-go').disabled}))));await p.close();}
await b.close()})();
