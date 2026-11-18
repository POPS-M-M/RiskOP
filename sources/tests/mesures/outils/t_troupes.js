/* Essais du soldat de la Marine (troupes en sprites, src/essai/77-troupes-sprites.js) — copie de test avec les îles Blender.
   node t_troupes.js <dossier servi (essai_test.html + iles/)> <port> [sortie.json]
   Le rendu WebGL est logiciel (SwiftShader) : les durées sont relatives. Aucune donnée du jeu n'est écrite par le module testé ;
   pour les essais, l'île est attribuée au joueur et sa garnison fixée dans la page (état de test, pas une règle). */
const {chromium}=require('playwright');const {spawn}=require('child_process');const fs=require('fs'),path=require('path'),crypto=require('crypto');
const [dir,port,out]=[process.argv[2],+process.argv[3],process.argv[4]];
const res=[];const ok=(n,c,d)=>{res.push({n,ok:!!c,d:d===undefined?'':d});console.log((c?'✔':'✘')+' '+n+(d!==undefined?' — '+(typeof d==='string'?d:JSON.stringify(d)):''));};
const ROOT=path.join(__dirname,'..','..','..');
(async()=>{
 /* 1. données : planche source intacte, atlas = pixels de la planche, animations = images existantes */
 const T=JSON.parse(fs.readFileSync(path.join(ROOT,'art/troupes/marine_recrue/troupe.json'),'utf8'));
 const sha=crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,'art/troupes/marine_recrue/source',T.source.fichier))).digest('hex');
 ok('planche source intacte (SHA-256 identique à celle reçue)',sha===T.source.sha256&&sha==='2ade8b942b54c24c9384723159ae2b0e48fc87453defe1d7323f8d0653a87b3e',sha.slice(0,16));
 ok('animations : uniquement des images de la planche',Object.values(T.animations).every(a=>a.images.every(i=>T.images[i])),Object.keys(T.animations).join(', '));
 const js=fs.readFileSync(path.join(ROOT,'src/essai/76-troupes-donnees.js'),'utf8');
 const png=fs.readFileSync(path.join(ROOT,'art/troupes/marine_recrue/atlas.png'));
 ok('atlas du jeu = art/troupes/marine_recrue/atlas.png',js.includes(png.toString('base64')));

 const srv=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:dir,stdio:'ignore'});await new Promise(r=>setTimeout(r,800));
 const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const open=async(m)=>{const p=await b.newPage({viewport:{width:1400,height:860},deviceScaleFactor:1});const errs=[];p.on('pageerror',e=>errs.push(e.message));
   p.on('console',x=>{if((x.type()==='warning'||x.type()==='error')&&/troupes|sprites|débarquement|front/.test(x.text()))errs.push(x.text());});
   await p.goto(`http://127.0.0.1:${port}/essai_test.html`);
   await p.evaluate(m=>{localStorage.clear();localStorage.setItem('gl-tuto','1');localStorage.setItem('rk-tob','{"off":1}');localStorage.setItem('rk-w3',m.w3?'1':'0');if(m.off)localStorage.setItem('rk-trp','0');},m);await p.reload();await p.waitForTimeout(1200);
   await p.evaluate(()=>{let s=7;Math.random=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};const X=__RK;X.newGame(2024,'normal',{crews:[0,1,2,3],turn:false,pk:3});X.started=true;document.querySelector('#overlay').hidden=true;X.speed=0;});
   if(m.w3)for(let i=0;i<300;i++){const r=await p.evaluate(()=>{const X=__RK;return X.W3.models.size>=X.terrs.length&&Object.values(window.__BLX.isl).every(I=>I.ready3||I.fail3);});if(r)break;await p.waitForTimeout(400);}
   return {p,errs};};
 /* 2. 3D : garnison, échelle, appuis au sol */
 let {p,errs}=await open({w3:true});
 const g=await p.evaluate(()=>{const X=__RK,t=X.terrs.find(q=>q.name==='Water 7');t.owner=0;t.u.guerrier=40;const T=window.__TRP,G=window.__trpG(t),I=window.__BLX.isl['Water 7'];
   const s=G.gar.slots;let free=true,sol=true,dmin=9;for(let i=0;i<s.length;i++){const h=I.Hs(s[i].x,s[i].y),o=I.Ho(s[i].x,s[i].y);if(o-h>.1||h<.06)free=false;if(Math.abs(s[i].z-Math.max(0,h))>.02)sol=false;for(let j=0;j<i;j++)dmin=Math.min(dmin,Math.hypot(s[i].x-s[j].x,s[i].y-s[j].y));}
   return {n:s.length,free,sol,dmin,H:T.D.conv.hauteur_ref_u,kmax:0};});
 ok('emplacements de la garnison : sol libre (ni bâtiment, ni arbre, ni eau)',g.free&&g.n>=8,g);
 ok('pieds posés sur le sol (carte « sol », pas les toits)',g.sol);
 ok('figurines séparées (au moins 0,44 u entre deux soldats)',g.dmin>=.43,g.dmin.toFixed(2));
 await p.evaluate(()=>{const X=__RK,t=X.terrs.find(q=>q.name==='Water 7'),G=window.__trpG(t),s=G.gar.slots[0];X.V.k=36;X.V.x=t.x+s.x-1400/36/2;X.V.y=t.y+s.y-860/36/2;X.W3.cam.pitch=.7;});
 await p.waitForTimeout(2500);
 const sc=await p.evaluate(()=>{const X=__RK,t=X.terrs.find(q=>q.name==='Water 7'),G=window.__trpG(t),s=G.gar.slots[0],c=X.W3.c,a=X.w3Proj(t.x+s.x,t.y+s.y,s.z,c),bb=X.w3Proj(t.x+s.x,t.y+s.y,s.z+.54,c);
   return {poteau:a.sy-bb.sy,sprite:.54*c.u[2]*a.k,st:window.__TRPst()};});
 ok('échelle : hauteur à l\'écran = poteau vertical de 0,54 u au même endroit (± 8 %)',Math.abs(sc.sprite/sc.poteau-1)<.08,{sprite:sc.sprite.toFixed(1),poteau:sc.poteau.toFixed(1)});
 const nb=await p.evaluate(()=>{const X=__RK,t=X.terrs.find(q=>q.name==='Water 7');return Math.max(1,Math.min(30,Math.round(Math.pow(40,.62)*1.1)));});
 ok('garnison affichée (Recrues en sprites, effectif réel inchangé)',sc.st.gar>=nb&&sc.st.spr>=nb&&sc.st.fail==='',{attendu:nb,st:sc.st});
 /* 3. débarquement : chemin sur sol libre, arrivée aux places de l'armée, fin propre */
 const L=await p.evaluate(()=>{const X=__RK,t=X.terrs.find(q=>q.name==='Water 7'),f=X.terrs[t.nb.find(n=>X.terrs[n].boss===undefined)];
   const okL=X.px().pxLandStart({owner:0,from:f.id,to:t.id,u:{guerrier:20,lancier:4,archer:0,cavalier:0,catapulte:0,elite:0},rt:false,lt:-1},{force:true,demo:true});
   const T=window.__TRP,Ld=T.land[0],I=window.__BLX.isl['Water 7'];if(!Ld)return {okL};let bad=0,pts=0;
   for(const fg of Ld.figs)for(let q=3;q<fg.pts.length;q++){const [x,y]=fg.pts[q];pts++;if(I.Ho(x-t.x,y-t.y)-I.Hs(x-t.x,y-t.y)>.12)bad++;}
   return {okL,n:Ld.figs.length,pts,bad,res:[...(T.res.get(t.id)||[])].length};});
 ok('débarquement lancé (navire, passerelle, chemins)',L.okL&&L.n>0,L);
 ok('chemins sur l\'île : aucun point dans un bâtiment ou un arbre',L.bad===0,L);
 await p.evaluate(()=>{window.__TRP.tfix=25;});await p.waitForTimeout(2000);await p.evaluate(()=>{window.__TRP.tfix=30;});await p.waitForTimeout(2000);
 const L2=await p.evaluate(()=>{const T=window.__TRP,X=__RK,t=X.terrs.find(q=>q.name==='Water 7');return {land:T.land.length,res:T.res.has(t.id)};});
 await p.evaluate(()=>{delete window.__TRP.tfix;});
 ok('fin du débarquement : places rendues à la garnison',L2.land===0&&!L2.res,L2);
 /* 4. zoom maximal en 3D */
 const kz=await p.evaluate(()=>{const X=__RK;X.V.k=99;document.querySelector('#map').dispatchEvent(new WheelEvent('wheel',{deltaY:-50,clientX:700,clientY:430,bubbles:true}));return X.V.k;});
 ok('zoom 3D plafonné à 40 (18 avant)',kz<=40.001&&kz>18,kz);
 /* 5. charge : 1 000 figurines à l'écran (rendu logiciel : seule la part CPU du module est significative) */
 const perf=await p.evaluate(async()=>{const X=__RK,t=X.terrs.find(q=>q.name==='Water 7'),T=window.__TRP,G=window.__trpG(t),s0=G.gar.slots[0];
   X.V.k=30;X.V.x=t.x+s0.x-1400/60;X.V.y=t.y+s0.y-860/60;const fr=async n=>{const a=[];for(let i=0;i<n;i++){await new Promise(r=>requestAnimationFrame(r));a.push([T.st.ms,X.W3.drawMs]);}return a;};
   const base=await fr(12);T.extra=[];for(let i=0;i<1000;i++){const x=s0.x+(i%40-20)*.45,y=s0.y+(Math.floor(i/40)-12)*.45;T.extra.push({x:t.x+x,y:t.y+y,z:Math.max(0,G.Hs(x,y)),anim:i%3?'garde':'attaque',yaw:i,own:i%4});}
   const load=await fr(12);T.extra=null;const med=a=>a.map(q=>q[0]).sort((x,y)=>x-y)[a.length>>1],medD=a=>a.map(q=>q[1]).sort((x,y)=>x-y)[a.length>>1];
   return {cpuModule1000:med(load),imageSans:medD(base),imageAvec1000:medD(load),spr:T.st.spr};});
 ok('charge : 1 000 figurines, part CPU du module < 6 ms par image',perf.cpuModule1000<6&&perf.spr>500,perf);
 ok('3D : 0 erreur de page',errs.length===0,errs.slice(0,3));await p.close();
 /* 6. mêmes règles : bataille identique avec et sans le module (même graine, même ordre) */
 const battle=async(off)=>{const o=await open({w3:true,off});const r=await o.p.evaluate(()=>{const X=__RK,O=X.OPX,t=X.terrs.find(q=>q.name==='Water 7');let f=X.terrs[t.nb.find(n=>X.terrs[n].boss===undefined)];
     f.owner=0;f.u=O.emptyU();f.u.guerrier=60;t.owner=1;t.u=O.emptyU();t.u.guerrier=22;X.rel()[0][1]=X.rel()[1][0]='war';for(const q of X.players)if(!q.human)q.ai.t=1e9;
     let s=99;Math.random=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};   /* même graine juste avant la bataille (le rendu consomme aussi des tirages) */
     X.launch(0,f.id,t.id,1,0);
     for(let i=0;i<400&&O.armies.some(a=>a.owner===0);i++)X.step(.25);const rep=O.BATTLES.filter(r=>r.to===t.id).pop();
     return {owner:t.owner,u:t.u,rep:rep?{win:rep.win,au2:rep.au2,du2:rep.du2}:null,save:JSON.stringify(X.svBuild()),b3:!!(X.B3&&X.B3.run),front:X.B3&&X.B3.run?X.B3.run.fx!==undefined:null};});
   await o.p.waitForTimeout(1500);const st=await o.p.evaluate(()=>window.__TRPst());r.errs=o.errs;r.spr=st.spr;await o.p.close();return r;};
 const A=await battle(false),B=await battle(true);
 ok('bataille : même vainqueur, mêmes pertes, même garnison avec et sans le soldat en sprite',JSON.stringify([A.owner,A.u,A.rep])===JSON.stringify([B.owner,B.u,B.rep]),{avec:[A.owner,A.rep],sans:[B.owner,B.rep]});
 {const a=JSON.parse(A.save),bb=JSON.parse(B.save),diff=[];const walk=(x,y,pa)=>{if(typeof x!=='object'||x===null||typeof y!=='object'||y===null){if(JSON.stringify(x)!==JSON.stringify(y))diff.push(pa);return;}for(const k of new Set([...Object.keys(x),...Object.keys(y)]))walk(x[k],y[k],pa+'.'+k);};walk(a,bb,'');
  const keysA=JSON.stringify(Object.keys(a).sort()),keysB=JSON.stringify(Object.keys(bb).sort());
  /* seules différences admises : horloges du navigateur (meta.date, w = performance.now() des journaux, gid = Date.now()) */
  ok('sauvegarde : mêmes champs avec et sans (aucun champ ajouté) ; seules les horloges diffèrent',keysA===keysB&&diff.every(d=>/\.(w|date|gid)$/.test(d)),{diff:diff.slice(0,8)});}
 ok('scène de combat : front sur terrain dégagé, soldats en sprites',A.b3&&A.front&&A.spr>0,{b3:A.b3,front:A.front,spr:A.spr});
 ok('module désactivé (rk-trp=0) : aucun sprite, scène d\'origine',B.b3&&B.front===false&&B.spr===0,{front:B.front,spr:B.spr});
 ok('combat : 0 erreur de page',A.errs.length===0&&B.errs.length===0,A.errs.concat(B.errs).slice(0,3));
 /* 7. 2.5D : rien ne change */
 const q=await open({w3:false});await q.p.waitForTimeout(1500);const k25=await q.p.evaluate(()=>{const X=__RK;X.V.k=99;document.querySelector('#map').dispatchEvent(new WheelEvent('wheel',{deltaY:-50,clientX:700,clientY:430,bubbles:true}));return X.V.k;});
 ok('2.5D : zoom maximal inchangé (3,5), 0 erreur',k25<=3.5001&&q.errs.length===0,{k:k25,errs:q.errs.slice(0,2)});await q.p.close();
 await b.close();srv.kill();
 const n=res.filter(r=>r.ok).length;console.log(n+'/'+res.length);if(out)fs.writeFileSync(out,JSON.stringify(res,null,1));process.exit(n===res.length?0:1);
})();
