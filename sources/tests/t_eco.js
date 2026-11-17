/* Maquette Économie : chaque bouton = action existante, mêmes effets ; replis ; sélecteur de villes ; aucune donnée perdue. */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const res=[];const ok=(n,c,d)=>{res.push((c?'PASS ':'FAIL ')+n+(d!==undefined?' — '+d:''));};
for(const vp of [{w:1400,h:900,tag:'pc'},{w:400,h:860,tag:'mobile'}]){
const p=await b.newPage({viewport:{width:vp.w,height:vp.h}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+__dirname+'/../dist/risk_test.html');
await p.evaluate(()=>{localStorage.clear();localStorage.setItem('gl-tuto','1');localStorage.setItem('rk-tob','{"off":1}');});await p.reload();await p.waitForTimeout(800);
await p.evaluate(()=>{const X=__RK;X.newGame(2024,'normal',{crews:[0,1,2,3],turn:true,pk:3});X.started=true;document.querySelector('#overlay').hidden=true;const me=X.players[0];
 let k=0;const cap=X.terrs.find(t=>t.owner===0&&t.capital);for(const n of cap.nb){const t=X.terrs[n];if(t.owner<0&&k<3){t.owner=0;k++;}}
 const v=X.terrs.find(t=>t.owner===0&&!t.capital);v.city={lvl:1,b:[],q:null};me.techs.bronze=1;me.techs.monnaie=1;X.recalc(me);me.gold=900;me.sci=300;X.ui.sel=cap.id;});
const R=f=>p.evaluate(f);
const click=async sel=>{for(let k=0;k<3;k++){const e=await p.$('#side '+sel+':not([disabled])');if(!e)return false;try{await e.click({timeout:3000});await p.waitForTimeout(150);return true;}catch(_){await p.waitForTimeout(200);}}return false;};
/* Berrys */
await R(()=>{__RK.ui.tab='eco';__RK.renderPanel(true);});
const e1=await R(()=>{const s=document.querySelector('#side');return {t:s.textContent,stack:s.querySelectorAll('.mqstack i').length};});
ok(vp.tag+' Berrys : bilan, sources en barre, achats',/Bilan/.test(e1.t)&&e1.stack>0&&/Que faire de tes Berrys/.test(e1.t),e1.stack+' segments');
ok(vp.tag+' Berrys : détail ligne par ligne replié puis ouvert',await click('[data-act="mqx"][data-v="ecodet"]')&&await R(()=>/Entretien des unités/.test(document.querySelector('#side').textContent)));
/* Villes */
await R(()=>{__RK.ui.tab='city';__RK.renderPanel(true);});
const picks=await R(()=>document.querySelectorAll('#side .mqpick button').length);
ok(vp.tag+' Villes : sélecteur (2 villes)',picks===2,picks);
const g0=await R(()=>__RK.players[0].gold);
const built=await click('.br [data-act="build"]');
const b1=await R(()=>{const X=__RK,t=X.terrs[X.ui.sel];return {q:!!(t.city&&t.city.q),g:X.players[0].gold};});
ok(vp.tag+' Construire : même action (construction lancée, Berrys débités)',built&&b1.q&&b1.g<g0,JSON.stringify(b1));
const up=await click('[data-act="upcity"]');const lv=await R(()=>{const X=__RK;return X.terrs[X.ui.sel].city.lvl;});
ok(vp.tag+' Agrandir la ville : niveau 2',up&&lv===2,lv);
const other=await R(()=>{const b=[...document.querySelectorAll('#side .mqpick button')].find(x=>!x.classList.contains('on'));b.click();return {sel:__RK.ui.sel,tab:__RK.ui.tab};});
await p.waitForTimeout(150);
ok(vp.tag+' Sélecteur : change de ville, reste dans Villes',other.tab==='city'&&await R(()=>!__RK.terrs[__RK.ui.sel].capital));
ok(vp.tag+' Bâtiments verrouillés repliés avec leur condition',await click('[data-act="mqx"][data-v="bLock"]')&&await R(()=>document.querySelectorAll('#side .mqline.lk').length>0));
/* Techno */
await R(()=>{__RK.ui.tab='tech';__RK.renderPanel(true);});
const s0=await R(()=>__RK.players[0].sci);const tb=await click('.mqu [data-act="tech"]');const t1=await R(()=>({n:Object.keys(__RK.players[0].techs).length,s:__RK.players[0].sci}));
ok(vp.tag+' Technologie : achetée (savoir débité)',tb&&t1.n===3&&t1.s<s0,JSON.stringify(t1));
const all=await R(()=>{const X=__RK;let n=0;for(const k of Object.keys(X.RK.mq.open))X.RK.mq.open[k]=true;for(const br of ['Militaire','Défense','Économie','Savoir','Mer'])X.RK.mq.open['tL'+br]=true;X.RK.mq.open.tOwn=true;X.renderPanel(true);const s=document.querySelector('#side');
 return X.TECHS.filter(t=>s.textContent.includes(t.n)).length;});
ok(vp.tag+' Techno : les '+all+' technologies restent consultables (replis ouverts)',all===await R(()=>__RK.TECHS.length),all);
const ma=await click('[data-act="mast"]');ok(vp.tag+' Maîtrise : bouton existant toujours là',ma);
ok(vp.tag+' Pas de défilement horizontal',await R(()=>document.documentElement.scrollWidth<=innerWidth+1));
ok(vp.tag+' Aucune erreur JS',!errs.length,errs.join(' | '));
await p.close();}
for(const r of res)console.log(r);console.log('bilan',res.filter(r=>r.startsWith('PASS')).length+'/'+res.length);await b.close();})();
