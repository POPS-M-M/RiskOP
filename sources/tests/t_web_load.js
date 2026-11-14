const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8766/index.html');await p.waitForTimeout(1500);
console.log(JSON.stringify(await p.evaluate(()=>({peer:typeof Peer,claude:typeof window.claude,host:!document.querySelector('#o-host').disabled,title:document.title}))));
await p.fill('#n-name','Test');await p.click('#o-host');await p.waitForTimeout(22000);
console.log('création sans accès au serveur PeerJS (bac à sable) :',await p.evaluate(()=>(document.querySelector('#o-mpmsg')||{}).textContent||document.querySelector('#overlay').textContent.slice(0,80)));
await p.click('#o-go');await p.waitForTimeout(800);console.log('solo ok',await p.evaluate(()=>document.querySelector('#clock').textContent));
console.log(errs.join('\n')||'aucune erreur JS');await b.close()})();
