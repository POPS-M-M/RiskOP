const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1400,height:860}});const errs=[];
p.on('pageerror',e=>errs.push(e.message+' @ '+(e.stack||'').split('\n')[1]));
await p.goto('file://'+__dirname+'/../dist/risk_test.html');await p.evaluate(()=>{localStorage.clear();localStorage.setItem('gl-tuto','1');});await p.reload();await p.waitForTimeout(600);
await p.selectOption('#o-mode','real');await p.click('#o-go');await p.click('[data-speed="4"]');await p.waitForTimeout(15000);
const s=await p.evaluate(()=>({t:Math.round(__RK.time),ph:document.querySelector('#phase').textContent.slice(0,80),ai:__RK.players.map(q=>__RK.terrs.filter(t=>t.owner===q.id).length),chip:document.querySelector('#r-gold-r').textContent,arc:typeof window.ARC}));
/* sauvegarde en temps réel */
const sv=await p.evaluate(()=>{const e=__RK.svWrite('rk-s1','RT');const o=__RK.svRead('rk-s1');const m=__RK.svRestore(o);return {e,m,real:o.meta.real,tm:__RK.TM.on};});
await p.waitForTimeout(2000);
console.log(JSON.stringify({s,sv}));console.log(errs.join('\n')||'aucune erreur JS');await b.close()})();
