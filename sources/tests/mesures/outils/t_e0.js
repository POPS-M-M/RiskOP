// Tests fonctionnels de l'instrumentation (étape 0) : exactitude des comptes, gels, LOD, interface. Page de test jetable.
const {chromium}=require('playwright');const {spawn}=require('child_process');
const dir=process.argv[2],pt=+process.argv[3]||8971;
(async()=>{const srv=spawn('python3',['-m','http.server',pt,'--bind','127.0.0.1'],{cwd:dir,stdio:'ignore'});await new Promise(r=>setTimeout(r,800));
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx=await b.newContext({viewport:{width:1400,height:860},deviceScaleFactor:2});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>console.log((c?'OK   ':'ÉCHEC ')+m);
await p.goto(`http://127.0.0.1:${pt}/essai_test.html`);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('gl-tuto','1');localStorage.setItem('rk-tob','{"off":1}');localStorage.setItem('rk-w3','1');});await p.reload();await p.waitForTimeout(1500);
await p.evaluate(()=>{const X=__RK;X.newGame(2024,'normal',{crews:[0,1,2,3],turn:false,pk:3});X.started=true;document.querySelector('#overlay').hidden=true;X.speed=0;});
for(let i=0;i<400;i++){if(await p.evaluate(()=>window.__BLX.loaded>=2&&__RK.W3.models.size>=__RK.terrs.length&&[...__RK.W3.models.values()].filter(m=>m.bl).length>=2))break;await p.waitForTimeout(700);}
await p.waitForTimeout(1500);
// 1) comptabilité WebGL vs calcul indépendant à partir des modèles
let r=await p.evaluate(()=>{const X=__RK,s=__MES.snap(),G=s.mem.gl;let ind=0,bl={};for(const t of X.terrs){const m=X.W3.models.get(t.id);if(!m)continue;const a=(m.no+m.nt)*28+(m.alt?m.alt.reduce((q,x)=>q+x.no*28,0):0);ind+=a;if(m.bl)bl[t.name]={p:m.no*28,t:m.nt*28,l1:m.alt[0].no*28,l2:m.alt[1].no*28};}
  return {G,ind,bl,ctx:G.ctx,jal:s.jal,nres:s.fichiers.length,res:s.fichiers.map(f=>f.f+':'+f.st),b3:Object.fromEntries(Object.entries(s.b3).filter(([,v])=>v.bl).map(([n,v])=>[n,{last:v.last,glb:v.glb,jal:v.jal}])),ms:Object.fromEntries(X.terrs.filter(t=>X.W3.models.get(t.id).bl).map(t=>[t.name,X.W3.models.get(t.id).ms])),nev:__MES.ev.filter(e=>e.k==='construction 3D').length};});
const sumIles=r.G.origine+Object.values(r.G.blender).reduce((a,b)=>a+Object.values(b).reduce((x,y)=>x+y,0),0);
ok(sumIles===r.ind,'tampons des îles comptés '+sumIles+' o = calcul indépendant depuis les modèles '+r.ind+' o');
for(const [n,v] of Object.entries(r.bl)){const B=r.G.blender[n];ok(B.principal===v.p&&B.translucide===v.t&&B.lod1===v.l1&&B.lod2===v.l2,n+' : lod0 '+B.principal+'/'+v.p+' · lod1 '+B.lod1+'/'+v.l1+' · lod2 '+B.lod2+'/'+v.l2+' · translucide '+B.translucide+'/'+v.t);}
for(const [n,v] of Object.entries(r.b3))ok(Math.abs(v.last.tot-r.ms[n])<=1,n+' : temps de construction mesuré '+Math.round(v.last.tot)+' ms ≈ champ ms du moteur '+r.ms[n]+' ms (géométrie '+Math.round(v.last.geo)+', conversion '+Math.round(v.last.conv)+', éclairage '+Math.round(v.last.bake)+', envoi '+Math.round(v.last.envoi)+')');
ok(r.nev>=53,'événements « construction 3D » : '+r.nev);ok(r.nres>=13,'fichiers iles/ vus par Resource Timing : '+r.nres+' → '+r.res.join(' '));
console.log('     jalons Zou :',JSON.stringify(r.b3.Zou.jal),'| glTF Zou :',JSON.stringify(r.b3.Zou.glb));console.log('     contextes WebGL :',JSON.stringify(r.ctx),'| jalons moteur',JSON.stringify(r.jal));
// 2) gel artificiel (boucle de 300 ms) : doit apparaître comme image longue + tâche longue, cause non identifiée
await p.evaluate(()=>new Promise(res=>setTimeout(()=>{const t=performance.now();while(performance.now()-t<300){}res();},50)));await p.waitForTimeout(500);
r=await p.evaluate(()=>{const s=__MES.snap();return {g:s.fl.gels.slice(-3),lt:s.fl.lt};});
ok(r.g.some(g=>g.dt>=290),'gel artificiel de 300 ms détecté : '+JSON.stringify(r.g.map(g=>[Math.round(g.dt),g.cause])));ok(r.lt.n>0&&r.lt.max>=290,'tâche longue détectée (max '+Math.round(r.lt.max)+' ms)');
// 3) reconstruction de Zou : le gel doit être attribué à « construction 3D · Zou »
await p.evaluate(()=>{const X=__RK,t=X.terrs.find(q=>q.name==='Zou'),m=X.W3.models.get(t.id);X.W3.gl.deleteBuffer(m.bo);X.W3.gl.deleteBuffer(m.bt);for(const a of m.alt)X.W3.gl.deleteBuffer(a.bo);X.W3.models.delete(t.id);X.V.k=3;});
for(let i=0;i<100;i++){if(await p.evaluate(()=>__RK.W3.models.has(__RK.terrs.find(q=>q.name==='Zou').id)))break;await p.waitForTimeout(100);}await p.waitForTimeout(400);
r=await p.evaluate(()=>__MES.snap().fl.gels.slice(-4).map(g=>[Math.round(g.dt),g.cause]));ok(r.some(g=>/construction 3D · Zou/.test(g[1])),'gel pendant la reconstruction attribué à Zou : '+JSON.stringify(r));
r=await p.evaluate(()=>{const s=__MES.snap();return [s.mem.gl.blender.Zou,__MES.gl.size];});ok(r[0]&&r[0].principal>0,'après suppression/reconstruction, comptes Zou cohérents (pas de double compte) : '+JSON.stringify(r));
// 4) 2.5D : niveaux d'image et mémoire des images
await p.evaluate(()=>{const X=__RK;X.w3Toggle&&0;});await p.click('#z-w3');await p.waitForTimeout(1500);
{const t0=Date.now();let st='';for(let i=0;i<300;i++){st=await p.evaluate(()=>{const e=__RK.R25.cache.get(__RK.terrs.find(q=>q.name==='Zou').id);return e?e.st:'absente';});if(st==='ready')break;await p.waitForTimeout(500);}console.log('     entrée 2.5D de Zou après passage 3D → 2.5D : '+st+' après '+Math.round((Date.now()-t0)/1000)+' s (l\'île d\'origine doit être générée avant d\'afficher les images Blender)');}
for(const k of [1,2,3.5]){await p.evaluate(k=>{const X=__RK,t=X.terrs.find(q=>q.name==='Zou');X.V.k=k;X.V.x=t.x-1400/k/2;X.V.y=t.y-860/k/2;document.querySelector('#map').dispatchEvent(new WheelEvent('wheel',{deltaY:0.001,clientX:700,clientY:430,bubbles:true}));},k);await p.waitForTimeout(3500);}
r=await p.evaluate(()=>{const s=__MES.snap(),M=s.mem;return {img:M.imgIle.Zou,cat:M.img,lodN:s.fl.lodN,lod:__MES.ev.filter(e=>e.k==='changement de niveau'&&e.ile==='Zou').map(e=>e.info),comp:__MES.ev.filter(e=>e.k==='composition 2.5D').map(e=>e.ile+' '+e.info+' '+Math.round(e.t1-e.t0)+'ms')};});
const comp=r.img['blender_compose|alloué']||0;ok(comp>=1045*1658*4,'canevas composés de Zou = '+comp+' o (l3 seul = '+(1045*1658*4)+')');
ok(r.lod.length>=2,'changements de niveau 2.5D de Zou enregistrés : '+r.lod.join(' ; '));console.log('     compositions :',r.comp.join(' | '));console.log('     images par catégorie (Mo) :',Object.fromEntries(Object.entries(r.cat).map(([k,v])=>[k,(v/1048576).toFixed(1)])));
// 5) interface du banc : onglets, copie texte et JSON
await p.click('#z-banc');await p.waitForTimeout(300);for(const t of ['memoire','charge','mesure']){await p.click(`[data-tab="${t}"]`);await p.waitForTimeout(200);}
const txt=await p.evaluate(()=>{BANC.tab='memoire';return null;}).catch(()=>null);
const T=await p.evaluate(()=>{const o=document.getElementById('banc-out').innerText;return o;});
await p.click('[data-tab="memoire"]');const Tm=await p.evaluate(()=>document.getElementById('banc-out').innerText);await p.click('[data-tab="charge"]');const Tc=await p.evaluate(()=>document.getElementById('banc-out').innerText);
ok(/carte graphique/.test(Tm)&&/images décodées/.test(Tm),'onglet Mémoire affiché ('+Tm.length+' caractères)');ok(/fichiers du dossier iles/.test(Tc)&&/Fluidité/.test(Tc),'onglet Chargement et fluidité affiché ('+Tc.length+' caractères)');
await p.click('#banc-copy');await p.waitForTimeout(400);const ta=await p.evaluate(()=>{const t=document.querySelector('#banc-out textarea');return t?t.value:document.getElementById('banc-st').textContent;});
ok(ta.length>500,'copie texte (presse-papiers ou zone de sélection) : '+ta.length+' caractères, '+(ta.match(/^## /gm)||[]).length+' sections');
await p.click('#banc-json');await p.waitForTimeout(300);const tj=await p.evaluate(()=>{const t=document.querySelector('#banc-out textarea');return t?t.value:'';});let J=null;try{J=JSON.parse(tj);}catch(_){}ok(!!(J||/copiés/.test(await p.evaluate(()=>document.getElementById('banc-st').textContent))),'copie JSON valide '+(J?Object.keys(J).join(','):'(presse-papiers)'));
require('fs').writeFileSync(dir+'/../e0_texte.txt',ta);
r=await p.evaluate(()=>__MES.snap().fl.surcout);console.log('     coût moyen du moniteur par image :',(r*1000).toFixed(1),'µs');
ok(errs.length===0,'erreurs de page : '+errs.length+' '+errs.slice(0,3).join(' | '));
await b.close();srv.kill();})();
