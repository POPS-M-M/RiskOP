/* Tests du socle technique (îles Blender, copie de test) — node t_socle.js <dossier servi> <port> <scénario> [sortie.json]
   Scénarios : reseau | conquete | liberation | pannes | pixels:<préfixe>
   Le dossier servi contient essai_test.html et iles/ (paquet format 2). Rendu WebGL logiciel : les durées sont relatives. */
const {chromium}=require('playwright');const {spawn}=require('child_process');const fs=require('fs');
const [dir,port,scen,out]=[process.argv[2],+process.argv[3],process.argv[4]||'reseau',process.argv[5]];
const W=ms=>new Promise(r=>setTimeout(r,ms));
let B;
async function page(mode,routes){
  const p=await B.newPage({viewport:{width:1400,height:860},deviceScaleFactor:2});const st={errs:[],req:[],cnt:{}};
  p.on('pageerror',e=>st.errs.push(e.message));
  p.on('request',r=>{const u=r.url(),i=u.indexOf('/iles/');if(i<0)return;const f=u.slice(i+6);st.req.push({f,t:Date.now()});st.cnt[f]=(st.cnt[f]||0)+1;});
  p.on('response',async r=>{const u=r.url(),i=u.indexOf('/iles/');if(i<0)return;const f=u.slice(i+6);const q=st.req.slice().reverse().find(x=>x.f===f&&x.o===undefined);if(q){q.st=r.status();try{q.o=(await r.body()).length;}catch(_){q.o=0;}}});
  if(routes)for(const [pat,fn] of routes)await p.route(pat,fn);
  await p.goto(`http://127.0.0.1:${port}/essai_test.html`);
  await p.evaluate(m=>{localStorage.clear();localStorage.setItem('gl-tuto','1');localStorage.setItem('rk-tob','{"off":1}');localStorage.setItem('rk-w3',m==='3d'?'1':'0');},mode);
  st.req.length=0;for(const k in st.cnt)delete st.cnt[k];
  await p.reload();
  await p.evaluate(()=>{let s=1;Math.random=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};const X=__RK;X.newGame(2024,'normal',{crews:[0,1,2,3],turn:false,pk:3});X.started=true;document.querySelector('#overlay').hidden=true;X.speed=0;
    document.querySelectorAll('.selcard,#minibox,.coach,.brief,.evbar,.log,.hint').forEach(e=>e.style.display='none');});
  return [p,st];}
async function cam(p,ile,k,yaw){await p.evaluate(([ile,k,yaw])=>{const X=__RK,t=typeof ile==='string'?X.terrs.find(q=>q.name===ile):{x:ile[0],y:ile[1]};X.V.k=k;X.V.x=t.x-1400/k/2;X.V.y=t.y-860/k/2;if(X.W3&&X.W3.cam){X.W3.cam.pitch=.95;X.W3.cam.yaw=yaw||0;}
  document.querySelector('#map').dispatchEvent(new WheelEvent('wheel',{deltaY:0,clientX:700,clientY:430,bubbles:true}));},[ile,k,yaw]);}
const blx=p=>p.evaluate(()=>{const B=window.__BLX,o={};for(const [n,I] of Object.entries(B.isl))o[n]={ready3:I.ready3,fail3:I.fail3,g3:Object.fromEntries(Object.entries(I.g3||{}).map(([l,g])=>[l,g.st])),vu3:I.vu3||'',vu25:I.vu25||'',
  img:Object.keys(I.img||{}),img_ld:Object.assign({},I.img_ld||{}),cv:Object.keys(I.cv||{})};return {isl:o,err:B.err,stat:Object.assign({},B.stat||{}),rejets:B.verif.rejets.slice(),cuis:(B.cuis||[]).slice()};});
const memo=p=>p.evaluate(()=>{const s=__MES.snap(),g=s.mem.gl;const bl={};for(const [n,r] of Object.entries(g.blender))bl[n]=Object.values(r).reduce((a,b)=>a+b,0);
  return {mode:s.mode,glTotal:g.total,glBlender:bl,glOrigine:g.origine,gltfJS:s.mem.gltfJS,img:s.mem.img,sommets:s.mem.sommets};});
const sumReq=(st,since)=>{const r=st.req.filter(x=>!since||x.t>=since);const g={};for(const x of r){const k=x.f.replace(/^[^/]+\//,'').replace(/\.[0-9a-f]{8}\./,'.');const c=/manifest/.test(k)?'manifestes':/^l1/.test(k)?'l1':/^l[23]|^ville/.test(k)?'2.5D fin':/^lod2/.test(k)?'lod2':/^lod[01]/.test(k)?'lod1/lod0':/hauteurs/.test(k)?'hauteurs':k==='index.json'?'index':'autre';
  g[c]=g[c]||{n:0,o:0,f:[]};g[c].n++;g[c].o+=x.o||0;g[c].f.push(x.f);}return g;};
async function readyBl(p,mode,ile,ms){for(let i=0;i<(ms||60000)/500;i++){const ok=await p.evaluate(([m,ile])=>{const X=__RK,B=window.__BLX,I=B.isl[ile];if(!I)return true;if(m==='3d')return X.W3.models.size>=X.terrs.length&&(I.ready3||I.fail3);const t=X.terrs.find(q=>q.name===ile),e=X.R25.cache.get(t.id);return !!I.vu25||(I.img_ld.l1==='echec'&&e&&e.st==='ready');},[mode,ile]);if(ok)return true;await W(500);}return false;}
const R={};
(async()=>{const srv=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:dir,stdio:'ignore'});await W(800);
B=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
try{
if(scen==='reseau'){
  /* 1. démarrage en 2.5D, vue d'ensemble ; 2. bascule en 3D ; 3. gros plan sur Zou */
  const [p,st]=await page('25');await cam(p,'Drum',1.0);await W(12000);
  R.demarrage25={req:sumReq(st),mem:await memo(p)};let t1=Date.now();
  await cam(p,'Zou',3.5);await W(10000);R.zoom25={req:sumReq(st,t1),mem:await memo(p)};
  t1=Date.now();await p.evaluate(()=>{document.querySelector('#z-w3').click();});await cam(p,'Drum',2.2);await W(4000);await readyBl(p,'3d','Zou',90000);await W(6000);
  R.bascule3d={req:sumReq(st,t1),mem:await memo(p),blx:await blx(p)};
  t1=Date.now();await cam(p,'Zou',9);await W(20000);R.zoom3d={req:sumReq(st,t1),mem:await memo(p),blx:await blx(p)};
  R.errs=st.errs;await p.close();}
else if(scen==='conquete'){
  for(const ile of ['Zou','Alabasta']){const [p,st]=await page('3d');await cam(p,ile,9);await readyBl(p,'3d',ile,90000);await W(15000);
    const r={};
    for(const [lab,fn] of [['proprietaire = moi',t=>{t.owner=__RK.ME;}],['proprietaire = adversaire',t=>{t.owner=1;}],['ville niveau 3',t=>{t.city={lvl:3,b:[]};}],['neutre',t=>{t.owner=-1;t.city=null;}]]){
      const a=await p.evaluate(([ile,f])=>{const X=__RK,t=X.terrs.find(q=>q.name===ile),M=window.__MES,I=M.isl[ile];const n0=I?I.b.n:0,lt0=M.lt.length,t0=performance.now();(0,eval)('('+f+')')(t);window.__k={n0,lt0,t0};return true;},[ile,fn.toString()]);
      await W(3000);
      r[lab]=await p.evaluate(ile=>{const M=window.__MES,I=M.isl[ile],k=window.__k;const lts=M.lt.slice(k.lt0).filter(x=>x.t>=k.t0).map(x=>Math.round(x.d));const ev=M.ev.filter(e=>e.t0>=k.t0&&(e.k==='construction 3D'||/cuisson/.test(e.k))&&e.ile===ile).map(e=>e.k+' '+Math.round(e.t1-e.t0)+' ms');
        return {reconstructions:I.b.n-k.n0,derniere_ms:I.b.last?Math.round(I.b.last.tot):null,sommets_reconstruits:I.b.last?I.b.last.sommets:null,taches_longues_ms:lts,evenements:ev};},ile);
      await (await p.$('#mapwrap')).screenshot({path:`conq_${ile.replace(/ /g,'_')}_${lab.replace(/[^a-z0-9]+/gi,'_')}.png`});}
    R[ile]={etapes:r,errs:st.errs,blx:(await blx(p)).isl[ile]};await p.close();}}
else if(scen==='tour'){
  /* paquet simulé de 53 îles : démarrage 2.5D, bascule 3D, gros plan successif sur 12 îles, puis pause ; mémoire après chaque étape */
  const [p,st]=await page('25');await cam(p,'Drum',1.0);await W(15000);
  const mm=async()=>{const m=await memo(p);const bl=Object.values(m.glBlender).reduce((a,b)=>a+b,0);return {mode:m.mode,glTotalMo:+(m.glTotal/1e6).toFixed(1),glBlenderMo:+(bl/1e6).toFixed(1),gltfJSMo:+(m.gltfJS/1e6).toFixed(1),iles3d:Object.keys(m.glBlender).length};};
  R.demarrage25={req:sumReq(st),mem:await mm()};let t1=Date.now();
  await p.evaluate(()=>{document.querySelector('#z-w3').click();});await cam(p,'Drum',2.2);await W(30000);
  R.bascule3d={req:sumReq(st,t1),mem:await mm()};R.etapes=[];
  const L=['Zou','Whole Cake','Water 7','Loguetown','Wano','Alabasta','Drum','Jaya','Skypiea','Dressrosa','Enies Lobby','Sabaody'];
  for(const n of L){const t0=Date.now();await cam(p,n,9);await W(9000);R.etapes.push({ile:n,mem:await mm(),req:Object.values(sumReq(st,t0)).reduce((a,v)=>a+v.n,0)});}
  await cam(p,'Drum',2.2);await W(50000);R.pause50s={mem:await mm()};
  const fl=await p.evaluate(()=>{const s=__MES.snap();return {lt:s.fl.lt,classes:s.fl.classes};});R.fluidite=fl;
  R.errs=st.errs;await p.close();}
else if(scen==='liberation'){
  const [p,st]=await page('3d');await cam(p,'Zou',9);await readyBl(p,'3d','Zou',90000);await W(20000);
  R.a_gros_plan={mem:await memo(p),zou:(await blx(p)).isl.Zou};
  await cam(p,'Loguetown',4);await W(52000);R.b_ailleurs_52s={mem:await memo(p),zou:(await blx(p)).isl.Zou,stat:(await blx(p)).stat};
  await p.evaluate(()=>{document.querySelector('#z-w3').click();});await cam(p,'Zou',3.5);await W(12000);R.c_25_gros_plan={mem:await memo(p),zou:(await blx(p)).isl.Zou};
  await W(25000);R.d_25_apres_37s={mem:await memo(p),blx:(await blx(p)).isl};
  await p.evaluate(()=>{document.querySelector('#z-w3').click();});await cam(p,'Loguetown',4);await W(36000);R.e_3d_apres_36s={mem:await memo(p),zou:(await blx(p)).isl.Zou,stat:(await blx(p)).stat};
  await cam(p,'Zou',9);await W(15000);R.f_retour_zou={mem:await memo(p),zou:(await blx(p)).isl.Zou,req:sumReq(st)};
  R.errs=st.errs;await p.close();}
else if(scen.startsWith('pixels')){
  const pre=scen.split(':')[1]||'px';
  for(const ile of ['Zou','Alabasta','Water 7']){const [p,st]=await page('3d');await cam(p,ile,9);await readyBl(p,'3d',ile,90000);await W(20000);
    for(const [lab,fn] of [['neutre',t=>{}],['moi',t=>{t.owner=__RK.ME;}],['adv',t=>{t.owner=1;}],['ville3',t=>{t.owner=1;t.city={lvl:3,b:[]};}]]){
      await p.evaluate(([ile,f])=>{const t=__RK.terrs.find(q=>q.name===ile);(0,eval)('('+f+')')(t);},[ile,fn.toString()]);await W(6000);
      await (await p.$('#mapwrap')).screenshot({path:`${pre}_${ile.replace(/ /g,'_')}_${lab}.png`});}
    R[ile]={errs:st.errs};await p.close();}}
else if(scen.startsWith('pannes')){const seul=(scen.split(':')[1]||'').split(',').filter(Boolean);
  const nf=(re)=>r=>re.test(r.request().url())?r.fulfill({status:404,body:'absent'}):r.continue();
  let once=0;
  const C=[
    ['normal',[], '25',3.5,0],
    ['l2_absent',[['**/iles/zou/l2.*',r=>r.fulfill({status:404})]],'25',2.6,0],
    ['l3_absent',[['**/iles/zou/l3.*',r=>r.fulfill({status:404})]],'25',3.5,0],
    ['ville_absente',[['**/iles/zou/ville2.*',r=>r.fulfill({status:404})]],'25',3.5,2],
    ['l2_corrompu',[['**/iles/zou/l2.*',async r=>{const q=await r.fetch();const b=await q.body();b[200]^=255;r.fulfill({response:q,body:b});}]],'25',2.6,0],
    ['l3_tronque',[['**/iles/zou/l3.*',async r=>{const q=await r.fetch();const b=await q.body();r.fulfill({response:q,body:b.subarray(0,b.length>>1)});}]],'25',3.5,0],
    ['l1_absent',[['**/iles/zou/l1.*',r=>r.fulfill({status:404})]],'25',1.0,0],
    ['manifeste_absent',[['**/iles/zou/manifest.*',r=>r.fulfill({status:404})]],'25',3.5,0],
    ['index_absent',[['**/iles/index.json',r=>r.fulfill({status:404})]],'25',3.5,0],
    ['reprise_apres_echec',[['**/iles/zou/l3.*',r=>{if(once++<1)return r.fulfill({status:503});return r.continue();}]],'25',3.5,0],
    ['coupure_lod0',[['**/iles/zou/lod0.*',r=>r.abort('connectionreset')]],'3d',9,0],
    ['lod2_absent',[['**/iles/zou/lod2.*',r=>r.fulfill({status:404})]],'3d',9,0],
    ['hauteurs_absentes',[['**/iles/zou/hauteurs.*',r=>r.fulfill({status:404})]],'3d',9,0],
    ['tous_glb_absents',[['**/iles/zou/lod*',r=>r.fulfill({status:404})]],'3d',9,0]];
  for(const [nom,routes,mode,k,lvl] of C){if(seul.length&&!seul.includes(nom))continue;once=0;const [p,st]=await page(mode,routes);
    if(lvl)await p.evaluate(l=>{const t=__RK.terrs.find(q=>q.name==='Zou');t.city={lvl:l,b:[]};},lvl);
    await cam(p,'Zou',k);await W(mode==='3d'?6000:4000);await readyBl(p,mode,'Zou',60000);await W(mode==='3d'?25000:12000);
    const b=await blx(p),z=b.isl.Zou||null;
    const e25=await p.evaluate(()=>{const X=__RK,t=X.terrs.find(q=>q.name==='Zou'),e=X.R25.cache.get(t.id);return e?{isBl:!!e.isBl}:null;});
    const m3=await p.evaluate(()=>{const X=__RK,t=X.terrs.find(q=>q.name==='Zou'),m=X.W3&&X.W3.models.get(t.id);return m?{bx:m.bx||null,bl:!!m.bl}:null;});
    const maxReq=Math.max(0,...Object.entries(st.cnt).filter(([f])=>/^zou\//.test(f)).map(([,n])=>n));
    await (await p.$('#mapwrap')).screenshot({path:`panne_${nom}.png`});
    R[nom]={mode,erreurs_page:st.errs,zou:z,cache25:e25,modele3d:m3,requetes_max_par_fichier:maxReq,requetes_zou:Object.fromEntries(Object.entries(st.cnt).filter(([f])=>/^zou\//.test(f))),rejets:b.rejets.map(x=>x.fichier+' : '+x.raison),err:b.err};
    console.log(nom,JSON.stringify({err:st.errs.length,vu25:z&&z.vu25,vu3:z&&z.vu3,isBl:e25&&e25.isBl,bx:m3&&m3.bx,maxReq}));await p.close();}}
}catch(err){R.exception=String(err&&err.stack||err);}
if(out)fs.writeFileSync(out,JSON.stringify(R,null,1));else console.log(JSON.stringify(R,null,1).slice(0,6000));
await B.close();srv.kill();})();
