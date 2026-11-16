/* Carte 2 (53 îles de la liste) — node t_carte.js <dossier servi> <port> [préfixe captures]
   Le dossier servi contient essai_test.html (version testée), ancien.html (version d'avant la carte 2) et iles/.
   Vérifie : nouvelle partie sur la carte 2 (53 îles, noms, capitales, régions, routes) ; une sauvegarde faite avec l'ancienne
   version se recharge sur l'ancienne carte (îles renommées lues sous leur nouveau nom) et se réenregistre comme carte 1 ;
   une sauvegarde faite sur la carte 2 se recharge sur la carte 2. Captures de la carte entière en 2D, 2.5D et 3D. */
const {chromium}=require('playwright');const {spawn}=require('child_process');const fs=require('fs');
const [dir,port,pre]=[process.argv[2],+process.argv[3],process.argv[4]||'carte'];
const W=ms=>new Promise(r=>setTimeout(r,ms));const R={ok:[],ko:[]};const chk=(c,m)=>(c?R.ok:R.ko).push(m);
(async()=>{
  const srv=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:dir,stdio:'ignore'});await W(800);
  const B=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const ctx=await B.newContext({viewport:{width:1400,height:860},deviceScaleFactor:1});const errs=[];
  const open=async(f,w3)=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f+' : '+e.message));await p.goto(`http://127.0.0.1:${port}/${f}`);
    await p.evaluate(m=>{localStorage.setItem('gl-tuto','1');localStorage.setItem('rk-tob','{"off":1}');localStorage.setItem('rk-w3',m?'1':'0');},w3);await p.reload();await W(900);return p;};
  const hide=p=>p.evaluate(()=>{document.querySelector('#overlay').hidden=true;document.querySelectorAll('.selcard,#minibox,.coach,.brief,.evbar,.log,.hint').forEach(e=>e.style.display='none');});
  /* 1. sauvegarde faite avec l'ancienne version */
  let p=await open('ancien.html',false);
  await p.evaluate(()=>{localStorage.removeItem('rk-s1');localStorage.removeItem('rk-s2');const X=__RK;X.newGame(4242,'normal',{crews:[0,1,2,3],turn:false,pk:3});X.started=true;});await hide(p);
  await p.evaluate(()=>{const X=__RK;X.speed=4;});await W(6000);
  const old=await p.evaluate(()=>{const X=__RK;localStorage.setItem('rk-s1',JSON.stringify(X.svBuild('ancienne partie')));return {n:X.terrs.length,names:X.terrs.map(t=>t.name),own:X.terrs.map(t=>t.owner),time:Math.round(X.time)};});
  await p.close();
  /* 2. nouvelle partie sur la carte 2 */
  p=await open('essai_test.html',false);
  const nw=await p.evaluate(()=>{const X=__RK;X.newGame(2024,'normal',{crews:[0,1,2,3],turn:false,pk:3});X.started=true;
    return {v:X.MAPV,n:X.terrs.length,names:X.terrs.map(t=>t.name),caps:X.terrs.filter(t=>t.capital).map(t=>t.name),regs:X.regs.map(r=>[r.n,r.ids.length]),routes:X.routes.length,
      pone:X.terrs.filter(t=>t.pone).map(t=>t.name)};});
  await hide(p);
  chk(nw.v===2&&nw.n===53,'nouvelle partie : carte 2, 53 îles ('+nw.v+', '+nw.n+')');
  const list=JSON.parse(fs.readFileSync(__dirname+'/../../../art/data/carte/carte2.json','utf8')).I.map(d=>d[0]);
  chk(list.every(n=>nw.names.includes(n)),'nouvelle partie : les 53 noms de la liste');
  chk(['Nouveau Marineford','Île de Dawn','Royaume de Kamabakka','Whisky Peak'].every(n=>nw.caps.includes(n)),'capitales : '+nw.caps.join(', '));
  chk(nw.pone.length===4,'Poneglyphes : '+nw.pone.join(', '));
  R.regions=nw.regs;R.routes=nw.routes;
  /* captures de la carte entière */
  const shot=async(nm)=>{await p.evaluate(()=>{const X=__RK;X.V.k=1;X.V.x=0;X.V.y=0;document.querySelector('#map').dispatchEvent(new WheelEvent('wheel',{deltaY:0,clientX:700,clientY:430,bubbles:true}));});await W(1500);
    await p.screenshot({path:pre+'_'+nm+'.png'});};
  await p.evaluate(()=>{try{showNames=true;}catch(_){};const b=document.querySelector('#b-names');if(b&&!b.classList.contains('on'))b.click();});
  for(let i=0;i<120;i++){const ok=await p.evaluate(()=>[...__RK.R25.cache.values()].filter(e=>e.st==='ready').length>=__RK.terrs.length);if(ok)break;await W(500);}
  await shot('25d');
  /* sauvegarde carte 2 → relecture */
  const rt=await p.evaluate(()=>{const X=__RK;const o=JSON.parse(JSON.stringify(X.svBuild('carte 2')));localStorage.setItem('rk-s2',JSON.stringify(o));
    const own=X.terrs.map(t=>t.owner);X.newGame(99,'normal',{crews:[0,1,2,3],turn:false,pk:3});const m=X.svRestore(X.svRead('rk-s2'));
    return {m:m||'',v:X.MAPV,mapv:o.G.mapv,same:X.terrs.every((t,i)=>t.owner===own[i])};});
  chk(!rt.m&&rt.v===2&&rt.mapv===2&&rt.same,'sauvegarde carte 2 relue sur la carte 2 '+JSON.stringify(rt));
  /* 3. ancienne sauvegarde relue par la nouvelle version */
  const ld=await p.evaluate(()=>{const X=__RK;const o=X.svRead('rk-s1');if(!o)return {m:'illisible'};const m=X.svRestore(o);
    return {m:m||'',v:X.MAPV,n:X.terrs.length,names:X.terrs.map(t=>t.name),own:X.terrs.map(t=>t.owner),time:Math.round(X.time)};});
  const REN=JSON.parse(fs.readFileSync(__dirname+'/../../../art/data/carte/carte2.json','utf8')).RENAME;
  chk(!ld.m&&ld.v===1&&ld.n===old.n,'ancienne sauvegarde chargée sur la carte 1 ('+(ld.m||'ok')+', carte '+ld.v+', '+ld.n+' îles)');
  chk(old.names.every((n,i)=>ld.names[i]===(REN[n]||n)),'ancienne sauvegarde : mêmes îles, renommées ('+ld.names.filter((n,i)=>n!==old.names[i]).length+' noms changés)');
  chk(old.own.every((o,i)=>ld.own[i]===o),'ancienne sauvegarde : mêmes propriétaires');
  await p.evaluate(()=>{__RK.speed=4;});await W(4000);
  const re=await p.evaluate(()=>{const X=__RK;return {mapv:X.svBuild('re').G.mapv,t:Math.round(X.time)};});
  chk(re.mapv===1&&re.t>ld.time,'ancienne partie jouable et réenregistrée en carte 1 ('+JSON.stringify(re)+')');
  await p.evaluate(()=>{const X=__RK;X.speed=0;});await hide(p);await shot('ancienne');
  await p.close();
  /* 4. carte 2 en 3D */
  p=await open('essai_test.html',true);
  await p.evaluate(()=>{const X=__RK;X.newGame(2024,'normal',{crews:[0,1,2,3],turn:false,pk:3});X.started=true;X.speed=0;});await hide(p);
  for(let i=0;i<160;i++){const ok=await p.evaluate(()=>__RK.W3&&__RK.W3.models.size>=__RK.terrs.length);if(ok)break;await W(500);}
  await W(4000);await shot('3d');
  chk(errs.length===0,'aucune erreur de page ('+errs.length+')');R.errs=errs.slice(0,5);
  console.log(JSON.stringify(R,null,1));fs.writeFileSync(pre+'_resultats.json',JSON.stringify(R,null,1));
  await B.close();srv.kill();process.exit(R.ko.length?1:0);
})();
