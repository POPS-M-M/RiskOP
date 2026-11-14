const {chromium}=require('playwright');const fs=require('fs'),crypto=require('crypto');
const IMG=__dirname+'/images/';
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1400,height:860}});
const res=[];const ok=(n,c,d)=>{res.push((c?'PASS ':'FAIL ')+n+(d!==undefined?' — '+d:''));};const errs=[];
let p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message+' @ '+(e.stack||'').split('\n')[1]));
await p.goto('http://127.0.0.1:8766/risk_test.html');await p.evaluate(async()=>{localStorage.clear();localStorage.setItem('gl-tuto','1');await new Promise(r=>{const q=indexedDB.deleteDatabase('risk-op-illustrations');q.onsuccess=q.onerror=q.onblocked=()=>r();});});await p.reload();await p.waitForTimeout(900);
await p.click('#o-go');await p.waitForTimeout(500);
const R=(f,a)=>p.evaluate(f,a);
const dbHash=id=>R(async id=>{const db=await new Promise(r=>{const q=indexedDB.open('risk-op-illustrations');q.onsuccess=()=>r(q.result);});const rec=await new Promise(r=>{const g=db.transaction('illustrations').objectStore('illustrations').get(id);g.onsuccess=()=>r(g.result);});db.close();if(!rec)return null;const h=await crypto.subtle.digest('SHA-256',await rec.blob.arrayBuffer());return {hash:[...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,'0')).join(''),size:rec.blob.size,type:rec.blob.type,w:rec.w,h:rec.h,fx:rec.fx,fy:rec.fy,z:rec.z};},id);
/* 0. sans illustration : fiches inchangées */
await R(()=>{__RK.ui.tab='leg';__RK.renderPanel(true);});await p.waitForTimeout(200);
ok('Sans illustration : aucune vignette ajoutée aux fiches',await R(()=>document.querySelectorAll('#side .chc .ilbtn').length===0));
ok('IndexedDB disponible',await R(()=>__RK.IL.ok===true));
/* 1. import via l'interface (vraie boîte de choix de fichier) */
await p.click('[data-ill="manage"]');await p.waitForTimeout(200);
let [fc]=await Promise.all([p.waitForEvent('filechooser'),p.click('#ilm [data-ill="pick:Smoker"]')]);await fc.setFiles(IMG+'test_grand.png');await p.waitForTimeout(800);
let h=await dbHash('Smoker');
ok('Import (PNG 3000×4200) : octets identiques au fichier d’origine',h&&h.hash===sha(IMG+'test_grand.png')&&h.size===fs.statSync(IMG+'test_grand.png').size,JSON.stringify(h&&{w:h.w,h:h.h,size:h.size}));
ok('Résolution d’origine conservée',h&&h.w===3000&&h.h===4200);
ok('Message d’import',/importée/.test(await R(()=>document.querySelector('#ilm').textContent)));
/* 2. affichages : liste de recrutement (Smoker est recrutable par la Marine) */
await p.click('#ilm [data-ill="close"]');await R(()=>{__RK.ui.tab='leg';__RK.renderPanel(true);});await p.waitForTimeout(300);
const hire=await R(()=>{const b=[...document.querySelectorAll('#side .chc')].find(c=>/Smoker/.test(c.textContent));return b?{thumb:!!b.querySelector('.ilbtn img'),hire:!!b.querySelector('[data-act="hire"]')}:null;});
ok('Miniature dans la liste de recrutement',hire&&hire.thumb&&hire.hire,JSON.stringify(hire));
await p.screenshot({path:'il_hire.png',clip:{x:1030,y:240,width:360,height:600}});
/* 3. fiche : grande illustration à pleine résolution, sans déformation */
await p.click('#side .chc .ilbtn');await p.waitForTimeout(400);
const view=await R(()=>{const i=document.querySelector('#ilm .ilview img');const r=i.getBoundingClientRect();return {nw:i.naturalWidth,nh:i.naturalHeight,ratio:+(r.width/r.height).toFixed(3),orig:+(3000/4200).toFixed(3)};});
ok('Fiche : grande illustration, résolution native et proportions respectées',view.nw===3000&&view.nh===4200&&Math.abs(view.ratio-view.orig)<.01,JSON.stringify(view));
await p.screenshot({path:'il_view.png'});
await p.click('#ilm [data-ill="real"]');await p.waitForTimeout(200);
ok('Taille réelle',await R(()=>Math.round(document.querySelector('#ilm .ilview img').getBoundingClientRect().width)===3000));
/* 4. cadrage des miniatures */
await p.click('#ilm [data-ill="crop:Smoker"]');await p.waitForTimeout(300);
const box=await p.$('#il-src img');const bb=await box.boundingBox();
await p.mouse.click(bb.x+bb.width*.5,bb.y+bb.height*.28);await p.waitForTimeout(150);
await R(()=>{const z=document.getElementById('il-z');z.value='2';z.dispatchEvent(new Event('change'));});await p.waitForTimeout(150);
await p.screenshot({path:'il_crop.png'});
await p.click('#ilm [data-ill="framesave:Smoker"]');await p.waitForTimeout(400);
h=await dbHash('Smoker');
ok('Cadrage enregistré, image intacte',h&&Math.abs(h.fx-.5)<.03&&Math.abs(h.fy-.28)<.03&&h.z===2&&h.hash===sha(IMG+'test_grand.png'),JSON.stringify({fx:h.fx,fy:h.fy,z:h.z}));
/* 5. remplacement */
[fc]=await Promise.all([p.waitForEvent('filechooser'),p.click('#ilm [data-ill="pick:Smoker"]')]);await fc.setFiles(IMG+'test_paysage.jpg');await p.waitForTimeout(800);
h=await dbHash('Smoker');
ok('Remplacement (JPEG 2400×1600) : octets identiques',h&&h.hash===sha(IMG+'test_paysage.jpg')&&h.w===2400&&h.type==='image/jpeg');
/* 6. suppression avec confirmation */
await p.click('#ilm [data-ill="del:Smoker"]');await p.waitForTimeout(100);
const still=await dbHash('Smoker');
await p.click('#ilm [data-ill="del!:Smoker"]');await p.waitForTimeout(400);
ok('Suppression : demande une confirmation puis efface',!!still&&(await dbHash('Smoker'))===null&&!(await R(()=>!!__RK.IL.url.Smoker)));
/* 7. persistance après fermeture du navigateur (nouvelle page, même profil) */
[fc]=await Promise.all([p.waitForEvent('filechooser'),p.click('#ilm [data-ill="pick:Smoker"]')]);await fc.setFiles(IMG+'test_grand.png');await p.waitForTimeout(700);
[fc]=await Promise.all([p.waitForEvent('filechooser'),p.click('#ilm [data-ill="pick:Nami"]')]);await fc.setFiles(IMG+'test_paysage.jpg');await p.waitForTimeout(700);
await p.close();p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8766/risk_test.html');await p.waitForTimeout(1200);
const per=await p.evaluate(()=>Object.keys(__RK.IL.meta).sort().join(','));
ok('Persistance après réouverture',per==='Nami,Smoker',per);
/* 8. export / réimport de la collection (archive non compressée) */
const zr=await p.evaluate(async()=>{const X=__RK;const z=await X.ilBuildZip();const buf=await z.blob.arrayBuffer();
  for(const id of Object.keys(X.IL.meta))await X.ilDelete(id);
  const after=Object.keys(X.IL.meta).length;
  const r=await X.ilImportZip(new File([buf],'col.zip',{type:'application/zip'}));
  return {n:z.n,size:z.blob.size,after,r,meta:Object.keys(X.IL.meta).sort().join(','),fr:X.IL.meta.Smoker&&[X.IL.meta.Smoker.fx,X.IL.meta.Smoker.z]};});
h=await (async()=>{const q=await p.evaluate(async()=>{const db=await new Promise(r=>{const q=indexedDB.open('risk-op-illustrations');q.onsuccess=()=>r(q.result);});const rec=await new Promise(r=>{const g=db.transaction('illustrations').objectStore('illustrations').get('Smoker');g.onsuccess=()=>r(g.result);});db.close();const hh=await crypto.subtle.digest('SHA-256',await rec.blob.arrayBuffer());return [...new Uint8Array(hh)].map(x=>x.toString(16).padStart(2,'0')).join('');});return q;})();
ok('Export puis réimport de la collection : images identiques au bit près',zr.n===2&&zr.after===0&&zr.meta==='Nami,Smoker'&&h===sha(IMG+'test_grand.png'),JSON.stringify(zr));
ok('Archive étrangère compressée refusée proprement',/créée par l’export|illisible/.test((await p.evaluate(async()=>{const bytes=new Uint8Array([0x50,0x4b,3,4,20,0,0,0,8,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0x61,0x00]);return (await __RK.ilImportZip(new File([bytes],'x.zip'))).t;}))));
await p.evaluate(()=>{__RK.ui.tab='leg';__RK.renderPanel(true);});await p.waitForTimeout(150);await p.click('[data-ill="manage"]');await p.waitForTimeout(300);
ok('Export hors claude.ai : bouton désactivé et raison affichée',await p.evaluate(()=>{const b=document.querySelector('#ilm [data-ill="export"]');return !!b&&b.disabled&&/n’est pas disponible dans cette vue/.test(document.querySelector('#ilm').textContent);}));
await p.click('#ilm [data-ill="close"]');
/* 9. équipage + rapports de bataille : Nami (pirates) — on passe le joueur chez les Pirates pour un vrai combat */
await p.evaluate(()=>{localStorage.setItem('gl-tuto','1');});
await p.reload();await p.waitForTimeout(900);
await p.click('.crew[data-crew="1"]');await p.click('#o-go');await p.waitForTimeout(500);
const bat=await p.evaluate(()=>{const X=__RK,i=X.LEGENDS.findIndex(L=>L.s==='Nami'),cap=X.terrs.find(t=>t.owner===X.ME&&t.capital);const C=X.CH;
  return {i,cap:cap.id};});
await p.evaluate(({i,cap})=>{const X=__RK;const c=X.CH[i];c.own=X.ME;c.post=cap;X.ui.tab='leg';X.renderPanel(true);},bat);await p.waitForTimeout(300);
ok('Miniature dans l’équipage (état-major)',await p.evaluate(()=>{const c=[...document.querySelectorAll('#side .chc')].find(x=>/Nami/.test(x.textContent)&&x.querySelector('[data-act="cskill"]'));return !!(c&&c.querySelector('.ilbtn img'));}));
await p.screenshot({path:'il_crew.png',clip:{x:1030,y:240,width:360,height:520}});
await p.evaluate(({cap})=>{const X=__RK,c=X.terrs[cap],n=c.nb.map(i=>X.terrs[i]).filter(t=>t.owner<0&&t.boss===undefined).sort((a,b)=>X.tr(a)-X.tr(b))[0];X.cmd({k:'recruit',t:cap,u:'guerrier'});X.cmd({k:'launch',f:cap,to:n.id,pct:1,st:0});X.speed=4;X.cmd({k:'ready'});},bat);
let br=null;for(let k=0;k<45&&!br;k++){await p.waitForTimeout(300);br=await p.evaluate(()=>{const e=document.getElementById('brief');return e&&!e.hidden&&e.querySelector('.ilbats img')?e.querySelector('.ilbats').textContent:null;});}
ok('Rapport de bataille (bandeau) : illustration du lieutenant impliqué',!!br,br);
if(br)await p.screenshot({path:'il_brief.png',clip:{x:640,y:240,width:400,height:300}});
await p.evaluate(()=>{const X=__RK,r=X.BATTLES[X.BATTLES.length-1];X.ui.tab='jrn';X.ui.rep=r.id;X.renderPanel(true);});await p.waitForTimeout(300);
ok('Rapport détaillé : grande illustration',await p.evaluate(()=>!!document.querySelector('#side .rpt .ilbats.big img')));
await p.screenshot({path:'il_rpt.png',clip:{x:1030,y:240,width:360,height:600}});
/* 10. héros sans image dans le rapport : rien n'est ajouté */
ok('Rapport sans lieutenant illustré : rien d’ajouté',await p.evaluate(()=>__RK.ilBattleHTML({la:'Zoro',ld:''},'small')===''));
console.log(res.join('\n'));console.log(errs.join('\n')||'aucune erreur JS');await b.close()})();
