// Étape P4 : scénarios de versionnage et de repli (page 2.5D ; état du chargeur, images, modèles 3D prêts ou refusés)
const {chromium}=require('playwright');const {spawn}=require('child_process');const fs=require('fs');
const base=process.argv[2],only=process.argv[3];const scs=fs.readdirSync(base).filter(x=>!only||x===only).sort();
(async()=>{const b=await chromium.launch();let pt=9100;const out={};
for(const sc of scs){const port=pt++;const srv=spawn('python3',[__dirname+'/serveur.py',port,base+'/'+sc],{stdio:'ignore'});await new Promise(r=>setTimeout(r,700));
  const p=await b.newPage({viewport:{width:1400,height:860},deviceScaleFactor:2});const errs=[],warns=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='warning'&&/Blender|glTF/.test(m.text()))warns.push(m.text().slice(0,140));});
  await p.goto(`http://127.0.0.1:${port}/essai_test.html`);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('gl-tuto','1');localStorage.setItem('rk-tob','{"off":1}');localStorage.setItem('rk-w3','0');});await p.reload();
  for(let i=0;i<40;i++){const s=await p.evaluate(()=>{const B=window.__BLX;return B.err||Object.values(B.isl).every(I=>I.ready3)&&Object.keys(B.isl).length>=1&&B.loaded>=Object.keys(B.isl).length||B.verif.rejets.length>0;});if(s)break;await p.waitForTimeout(500);}
  await p.waitForTimeout(2500);
  await p.evaluate(()=>{const X=__RK;X.newGame(2024,'normal',{crews:[0,1,2,3],turn:false,pk:3});X.started=true;document.querySelector('#overlay').hidden=true;X.speed=0;});
  for(let i=0;i<60;i++){if(await p.evaluate(()=>{const e=__RK.R25.cache.get(__RK.terrs.find(q=>q.name==='Zou').id);return e&&e.st==='ready'&&(()=>{const w=__RK.R25.cache.get(__RK.terrs.find(q=>q.name==='Whole Cake').id);return w&&w.st==='ready';})();}))break;await p.waitForTimeout(500);}
  const res={};
  for(const nm of ['Zou','Whole Cake']){await p.evaluate(nm=>{const X=__RK,t=X.terrs.find(q=>q.name===nm),k=2.2;X.V.k=k;X.V.x=t.x-1400/k/2;X.V.y=t.y-860/k/2;document.querySelector('#map').dispatchEvent(new WheelEvent('wheel',{deltaY:0.001,clientX:700,clientY:430,bubbles:true}));},nm);await p.waitForTimeout(3000);
    res[nm]=await p.evaluate(nm=>{const X=__RK,t=X.terrs.find(q=>q.name===nm),e=X.R25.cache.get(t.id),I=window.__BLX.isl[nm];return {charge:!!I,rendu25:e?(e.isBl?'Blender':'origine'):'?',l2:!!(I&&I.img.l2),glb:I?Object.keys(I.glb).join(','):'',modele3D:I&&I.ready3?'Blender':'origine'};},nm);}
  const g=await p.evaluate(()=>{const B=window.__BLX;return {format:B.format,err:B.err,ok:B.verif.ok,taille:B.verif.taille,rejets:B.verif.rejets.map(r=>r.ile+' : '+r.raison),e404:performance.getEntriesByType('resource').filter(e=>/\/iles\//.test(e.name)&&e.responseStatus>=400).map(e=>e.name.split('/iles/')[1])};});
  out[sc]={...g,iles:res,erreursPage:errs.length,avert:warns.length};console.log(sc,JSON.stringify(out[sc]));await p.close();srv.kill();}
fs.writeFileSync(base+'/../resultats_scenarios.json',JSON.stringify(out,null,1));await b.close();})();
