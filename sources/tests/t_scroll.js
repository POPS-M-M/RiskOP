const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:+(process.argv[2]||1400),height:+(process.argv[3]||860)}});
p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('file://'+__dirname+'/../dist/risk_test.html');await p.evaluate(()=>{localStorage.clear();localStorage.setItem('gl-tuto','1');});await p.reload();await p.waitForTimeout(700);
await p.click('#o-go');await p.waitForTimeout(600);
const info=()=>p.evaluate(()=>{const s=document.querySelector('#side'),sc=[s,...s.querySelectorAll('*')].concat([document.scrollingElement]).filter(e=>e.scrollHeight>e.clientHeight+2&&getComputedStyle(e).overflowY!=='visible'||e===document.scrollingElement).map(e=>(e.id||e.className||e.tagName)+':'+Math.round(e.scrollTop));const bt=[...document.querySelectorAll('#side [data-act="recruit"]')].find(e=>e.offsetParent);return {sc:sc.join(' '),btnY:bt?Math.round(bt.getBoundingClientRect().top):null,gold:Math.round(__RK.players[0].gold)};});
await p.evaluate(()=>{[...document.querySelectorAll('#side [data-act="recruit"]')].find(e=>e.offsetParent).scrollIntoView({block:'center'});});await p.waitForTimeout(300);
console.log('avant',JSON.stringify(await info()));
for(let k=0;k<4;k++){await p.locator('#side [data-act="recruit"] >> visible=true').first().click();for(const ms of [50,400,900]){await p.waitForTimeout(ms);console.log('clic',k+1,'+'+ms+'ms',JSON.stringify(await info()));}}
await b.close()})();
