// Mise à jour d'une île pendant que le navigateur garde l'ancien fichier en cache (hébergeur : max-age=600, comme un hébergement statique courant).
// Même contexte navigateur (cache HTTP partagé) : ouverture 1 avec l'état 1, mise à jour du dossier servi vers l'état 2, ouverture 2.
const {chromium}=require('playwright');const {spawn,execFileSync}=require('child_process');const fs=require('fs');
const [P,fmt]=[process.argv[2],process.argv[3]];const web=P+'/maj/web_'+fmt;
const pack=(art)=>execFileSync('python3',[P+'/maj/'+art+'/scripts/pack_for_game.py',web,'--b64',...(fmt==='v1'?['--format1']:[])]).toString().trim();
(async()=>{fs.rmSync(web,{recursive:true,force:true});fs.mkdirSync(web,{recursive:true});fs.copyFileSync(P+'/essai_test.html',web+'/essai_test.html');console.log(pack('art1'));
 const port=fmt==='v1'?9201:9202;const srv=spawn('python3',[P+'/serveur.py',port,web],{stdio:'ignore'});await new Promise(r=>setTimeout(r,700));
 const b=await chromium.launch(),ctx=await b.newContext({viewport:{width:1400,height:860},deviceScaleFactor:2});
 const ouvrir=async(c)=>{const p=await c.newPage();await p.goto(`http://127.0.0.1:${port}/essai_test.html`);await p.evaluate(()=>{localStorage.setItem('gl-tuto','1');localStorage.setItem('rk-tob','{"off":1}');localStorage.setItem('rk-w3','0');});await p.reload();
   for(let i=0;i<40;i++){if(await p.evaluate(()=>window.__BLX&&window.__BLX.isl.Zou&&window.__BLX.isl.Zou.img.l1))break;await p.waitForTimeout(300);}
   await p.evaluate(()=>{const X=__RK;X.newGame(2024,'normal',{crews:[0,1,2,3],turn:false,pk:3});X.started=true;document.querySelector('#overlay').hidden=true;X.speed=0;});
   for(let i=0;i<240;i++){if(await p.evaluate(()=>{const e=__RK.R25.cache.get(__RK.terrs.find(q=>q.name==='Zou').id);return e&&e.st==='ready';}))break;await p.waitForTimeout(500);}
   await p.evaluate(()=>{const X=__RK,t=X.terrs.find(q=>q.name==='Zou'),k=3.5;X.V.k=k;X.V.x=t.x-1400/k/2;X.V.y=t.y-860/k/2;document.querySelector('#map').dispatchEvent(new WheelEvent('wheel',{deltaY:0.001,clientX:700,clientY:430,bubbles:true}));});
   for(let i=0;i<60;i++){if(await p.evaluate(()=>!!window.__BLX.isl.Zou.img.l3))break;await p.evaluate(()=>document.querySelector('#map').dispatchEvent(new WheelEvent('wheel',{deltaY:0.001,clientX:700,clientY:430,bubbles:true})));await p.waitForTimeout(500);}
   console.log('   état :',JSON.stringify(await p.evaluate(()=>{const X=__RK,t=X.terrs.find(q=>q.name==='Zou'),e=X.R25.cache.get(t.id);return {k:X.V.k,S:X.S,st:e&&e.st,isBl:e&&e.isBl,img:Object.keys(window.__BLX.isl.Zou.img),err:window.__BLX.err,started:X.started};})));const r=await p.evaluate(()=>{const I=window.__BLX.isl.Zou,im=I.img.l3,c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const g=c.getContext('2d');g.drawImage(im,0,0);const d=g.getImageData(0,0,c.width,c.height).data;let h=2166136261;for(let i=0;i<d.length;i+=97)h=Math.imul(h^d[i],16777619)>>>0;
     const rt=performance.getEntriesByType('resource').find(e=>e.name===im.src);return {version:I.m.version,l3:im.src.split('/iles/')[1],pixels:h.toString(16),l3_depuis_cache:rt?rt.transferSize===0:'?',format:window.__BLX.format};});
   await p.close();return r;};
 const o1=await ouvrir(ctx);console.log('ouverture 1 (état 1)        ',JSON.stringify(o1));
 await new Promise(r=>setTimeout(r,1500));console.log(pack('art2'));
 /* déploiement : les fichiers publiés prennent la date du déploiement (sinon copy2 garde la date de la source) */
 {const now=new Date();const walk=d=>{for(const f of fs.readdirSync(d)){const q=d+'/'+f;if(fs.statSync(q).isDirectory())walk(q);else fs.utimesSync(q,now,now);}};walk(web+'/iles');}
 const o2=await ouvrir(ctx);console.log('ouverture 2 (état 2, même cache)',JSON.stringify(o2));
 const ctx2=await b.newContext({viewport:{width:1400,height:860},deviceScaleFactor:2});const o3=await ouvrir(ctx2);console.log('témoin (état 2, cache vide)  ',JSON.stringify(o3));
 const coherent=o2.version===o3.version&&o2.pixels===o3.pixels;
 const manNeuf=o2.version===o3.version,imgNeuve=o2.pixels===o3.pixels;console.log(fmt+' : ouverture 2 → manifeste '+(manNeuf?'NOUVEAU':'ancien')+' (version '+o2.version+'), image l3 '+(imgNeuve?'NOUVELLE':o2.pixels===o1.pixels?'ANCIENNE (cache)':'inattendue')+' → '+(manNeuf&&imgNeuve?'COHÉRENT':manNeuf&&!imgNeuve?'INCOHÉRENT : ancien fichier en cache utilisé avec le nouveau manifeste':'état ancien entier (cache)'));
 await b.close();srv.kill();})();
