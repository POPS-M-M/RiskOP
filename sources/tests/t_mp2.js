const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1300,height:820}});
await ctx.addInitScript({content:'window.__SAME='+(process.env.SAME?1:0)+';'+fs.readFileSync(__dirname+'/'+(process.env.SAME?'mock_room_same.js':'mock_room.js'),'utf8')});
const errs=[];const pg=async n=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(n+': '+e.message+' @ '+(e.stack||'').split('\n')[1]));await p.goto('http://127.0.0.1:8766/'+(process.argv[2]||'risk_test.html'));await p.evaluate(()=>{localStorage.setItem('gl-tuto','1');});await p.reload();await p.waitForTimeout(1200);return p;};
const H=await pg('hôte'),C=await pg('client');
const state=p=>p.evaluate(()=>({host:!document.querySelector('#o-host')||!document.querySelector('#o-host').disabled,why:(document.querySelector('#o-why')||{}).textContent,msg:(document.querySelector('#o-mpmsg')||{}).textContent,lobby:(document.querySelector('.lobby')||{}).textContent}));
console.log('hôte accueil',JSON.stringify(await state(H)));
await H.fill('#n-name','Luffy');await H.click('#o-host');await H.waitForTimeout(1500);
const code=await H.evaluate(()=>document.querySelector('#l-code').textContent);console.log('code',code);
await C.fill('#n-name','Zoro');await C.fill('#o-code',code);await C.click('#o-join');
for(let k=0;k<10;k++){await C.waitForTimeout(700);}
console.log('salle hôte',(await state(H)).lobby.slice(0,260));
console.log('salle client',JSON.stringify(await state(C)).slice(0,300));
const st=await H.$('#l-start');if(st){await st.click();await H.waitForTimeout(4000);}
const ingame=async p=>p.evaluate(()=>({started:typeof started!=='undefined'?null:null,ov:document.querySelector('#overlay').hidden,clock:(document.querySelector('#clock')||{}).textContent,players:[...document.querySelectorAll('#players .pl, #players > *')].map(e=>e.textContent.trim().slice(0,30)).join(' | ')}));
console.log('hôte en jeu',JSON.stringify(await ingame(H)));console.log('client en jeu',JSON.stringify(await ingame(C)));
const g0=await H.evaluate(()=>__RK.players[1].gold);await C.locator('#side [data-act="recruit"] >> visible=true').first().click();await H.waitForTimeout(2500);const g1=await H.evaluate(()=>__RK.players[1].gold);console.log('ordre du client reçu par l’hôte (or du joueur 2) :',Math.round(g0),'→',Math.round(g1));
await H.screenshot({path:__dirname+'/../../rk/mp_h.png'});await C.screenshot({path:__dirname+'/../../rk/mp_c.png'});
console.log(errs.join('\n')||'aucune erreur JS');await b.close()})();
