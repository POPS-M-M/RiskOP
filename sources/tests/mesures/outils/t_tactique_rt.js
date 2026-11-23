/* Essais du combat tactique en temps réel (src/essai/81-tactique-rt.js).
   node t_tactique_rt.js <dossier servi (essai_test.html + iles/)> [nombre de batailles IA]
   Démonstration : pause réelle (empreinte), ordres à la souris et au clavier, partie inchangée en quittant.
   Branchement : arrivée → fenêtre de choix ; « Commander » → bataille → résultat écrit par la chaîne d'origine (propriété, survivants,
   blessure d'un commandant, rapport) ; « Résolution automatique » → chaîne d'origine sans marque de bataille commandée ; réglage « jamais ».
   Équilibre : comparaison avec le calcul automatique sur des armées tirées au hasard ; 0 erreur JavaScript. */
const {chromium}=require('playwright');const {spawn}=require('child_process');
(async()=>{const dir=process.argv[2],N=+(process.argv[3]||40),port=8500+Math.floor(Math.random()*90);
const srv=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:dir,stdio:'ignore'});await new Promise(r=>setTimeout(r,800));
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1400,height:860}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,c,d)=>{console.log((c?'✔ ':'✘ ')+n+(d!==undefined?' — '+JSON.stringify(d):''));return c;};let n=0,t=0;const T=(a,b,c)=>{t++;if(ok(a,b,c))n++;};
await p.goto(`http://127.0.0.1:${port}/essai_test.html`);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('gl-tuto','1');localStorage.setItem('rk-tob','{"off":1}');});await p.reload();await p.waitForTimeout(1500);
await p.click('#o-go');await p.waitForTimeout(800);await p.evaluate(()=>document.querySelectorAll('.tu-card,.tob').forEach(e=>e.remove()));
const snap=()=>p.evaluate(()=>JSON.stringify([__RK.terrs.map(t=>[t.owner,JSON.stringify(t.u)]),__RK.speed]));const before=await snap();
await p.evaluate(()=>window.__OPUI&&__OPUI.menu&&__OPUI.menu(true));await p.click('#rt-go');for(let i=0;i<120;i++){if(await p.evaluate(()=>!!(__RT.run&&__RT.run.cam)))break;await p.waitForTimeout(500);}
const g0=await p.evaluate(()=>__RT.run.G.map(g=>[g.cx,g.cy]));await p.waitForTimeout(2500);
T('la bataille démarre aussitôt et les troupes bougent seules (semi-automatique)',await p.evaluate(g0=>!__RT.run.paused&&__RT.run.G.filter((g,i)=>Math.hypot(g.cx-g0[i][0],g.cy-g0[i][1])>.5).length>=3,g0));
await p.keyboard.press('Space');
T('sauvegarde refusée pendant la bataille',await p.evaluate(()=>/bataille/.test(__RT.canSave())));
await p.click('[data-rt="sel:0"]',{force:true});const pt=await p.evaluate((C)=>{const R=__RT.run;for(const [i,j] of C){const [x,y]=R.M.xy(i,j);if(!R.M.ok(x,y))continue;const q=__RT.scr(x,y);if(!q)continue;const e=document.elementFromPoint(q[0],q[1]);if(e&&e.tagName==='CANVAS')return q;}return null;},[[13,4],[12,5],[11,6],[12,7],[10,5],[9,6]]);
await p.mouse.click(pt[0],pt[1],{button:'right'});const pt2=await p.evaluate((C)=>{const R=__RT.run;for(const [i,j] of C){const [x,y]=R.M.xy(i,j);if(!R.M.ok(x,y))continue;const q=__RT.scr(x,y);if(!q)continue;const e=document.elementFromPoint(q[0],q[1]);if(e&&e.tagName==='CANVAS')return q;}return null;},[[10,3],[9,4],[10,6],[8,5],[11,8],[8,7]]);
await p.keyboard.down('Shift');await p.mouse.click(pt2[0],pt2[1],{button:'right'});await p.keyboard.up('Shift');await p.keyboard.press('2');
T('ordres : clic droit, Maj+clic droit (file), formation par touche ; le groupe passe en manuel',await p.evaluate(()=>{const g=__RT.run.G[0];return g.q.length===2&&g.q.every(o=>o.k==='aller')&&g.form==='colonne'&&g.ctrl==='manuel';}));
{const c0=await p.evaluate(()=>{const C=__RT.run.camP;__RT.camAuto=false;return [C.tx,C.ty,__RT.run.sel.join()];});await p.mouse.move(pt[0],pt[1]);await p.mouse.down();for(let k=1;k<=10;k++)await p.mouse.move(pt[0]-18*k,pt[1]-9*k);await p.mouse.up();await p.waitForTimeout(150);const c1=await p.evaluate(()=>{const C=__RT.run.camP;return [C.tx,C.ty,__RT.run.sel.join(),document.body.classList.contains('rt-grab')];});T('clic gauche maintenu et glissé : la vue se déplace (le point saisi suit le pointeur), la sélection ne change pas',Math.hypot(c1[0]-c0[0],c1[1]-c0[1])>1&&c1[2]===c0[2]&&!c1[3],{d:+Math.hypot(c1[0]-c0[0],c1[1]-c0[1]).toFixed(2)});await p.evaluate(()=>{__RT.camAuto=true;});}
await p.keyboard.press('Space');await p.waitForTimeout(3000);await p.keyboard.press('Space');await p.waitForTimeout(200);const h1=await p.evaluate(()=>__RT.hash());const t1=await p.evaluate(()=>__RT.run.t);
await p.waitForTimeout(2500);const h2=await p.evaluate(()=>__RT.hash());
T('la pause arrête la simulation (positions, effectifs, moral, recharges identiques)',h1===h2&&t1>0,{t:+t1.toFixed(2)});
await p.click('[data-rt="auto"]',{force:true});await p.waitForTimeout(800);T('fin de bataille atteinte en auto',await p.evaluate(()=>!!__RT.run.end),await p.evaluate(()=>__RT.run.end));
await p.click('#rt-end [data-rt="quitter"]',{force:true});await p.waitForTimeout(800);
T('la partie n\'est pas modifiée, vitesse rendue',before===await snap());
const s=await p.evaluate(n=>__RT.sim(n),N);T('démo IA contre IA (Garp contre Ace) : attaquant entre 35 et 75 %',s.w0/s.n>=.35&&s.w0/s.n<=.75,s);
/* ---- branchement sur la carte ---- */
const arrive=(o)=>p.evaluate(o=>{const RK=__RK,t=RK.terrs.find(q=>q.name==='Alabasta'),nb=RK.terrs[t.nb[0]],fac=RK.players.map((q,i)=>__RT.fac(i)),mar=fac.indexOf('marine');
  const iG=RK.LEGENDS.findIndex(l=>l.s==='Garp'),iL=RK.LEGENDS.findIndex(l=>l.s==='Luffy'),CH=RK.CH,Rl=RK.rel();Rl[0][mar]='war';Rl[mar][0]='war';
  const att=o.def?mar:0,dfd=o.def?0:mar;t.owner=dfd;t.u={guerrier:12,lancier:0,archer:6,cavalier:0,catapulte:0,elite:0};nb.owner=att;
  const ch=[];if(o.def){CH[iG].own=mar;CH[iG].army=o.id;CH[iG].post=-1;CH[iG].hurt=0;ch.push({k:'c',i:iG});CH[iL].own=0;CH[iL].post=t.id;CH[iL].army=0;CH[iL].hurt=0;}
  RK.armies.push({id:o.id,owner:att,from:nb.id,to:t.id,u:{guerrier:14,lancier:o.def?8:0,archer:0,cavalier:o.def?0:4,catapulte:0,elite:0},t:9.99,dur:10,s:0,rt:0,ch});
  RK.TM.phase='res';RK.speed=1;const nB=RK.BATTLES.length;RK.step(.05);
  return {ask:!document.getElementById('rt-ask')||!document.getElementById('rt-ask').hidden?!!document.getElementById('rt-ask')&&!document.getElementById('rt-ask').hidden:false,nB,speed:RK.speed,iG,iL,t:t.id,mar};},o);
const waitRun=async()=>{for(let i=0;i<120;i++){if(await p.evaluate(()=>!!(__RT.run&&__RT.run.cam)))break;await p.waitForTimeout(500);}};
let A1=await arrive({id:9001});T('arrivée sur une île ennemie : fenêtre de choix, monde arrêté',A1.ask&&A1.speed===0,A1);
await p.click('[data-rk="cmd"]');await waitRun();
await p.click('[data-rt="auto"]',{force:true});await p.waitForTimeout(600);
const fin1=await p.evaluate(()=>{const R=__RT.run;const w=R.end.w===0,u={};for(const g of R.G)if(!g.hero&&g.sd===(w?0:1))u[g.kind]=(u[g.kind]||0)+g.n;return {w,u,k:__RT.K.survie};});
await p.click('[data-rt="appliquer"]',{force:true});await p.waitForTimeout(600);
const c1=await p.evaluate(a=>{const RK=__RK,t=RK.terrs[a.t],b=RK.BATTLES[RK.BATTLES.length-1];return {owner:t.owner,u:t.u,speed:RK.speed,arm:RK.armies.some(x=>x.id===9001),rt:!!(b&&b.rt),n:RK.BATTLES.length-a.nB};},A1);
const exp=Object.entries(fin1.u).every(([k,v])=>Math.abs((c1.u[k]||0)-v*fin1.k)<.02);
T('bataille commandée → carte : vainqueur, survivants (part retenue), armée retirée, rapport marqué, vitesse rendue',(fin1.w?c1.owner===0:c1.owner===A1.mar)&&exp&&!c1.arm&&c1.rt&&c1.n===1&&c1.speed===1,{fin1,c1});
let A2=await arrive({id:9002,def:true});await p.click('[data-rk="cmd"]');await waitRun();
const s2=await p.evaluate(()=>({side:__RT.run.side,h:__RT.run.G.filter(g=>g.hero).map(g=>g.hero)}));
await p.evaluate(()=>{const l=__RT.run.G.find(g=>g.hero==='Luffy');if(l)l.hp=.01;});await p.click('[data-rt="auto"]',{force:true});await p.waitForTimeout(600);
await p.click('[data-rt="appliquer"]',{force:true});await p.waitForTimeout(600);
const c2=await p.evaluate(a=>{const RK=__RK;return {luffy:RK.CH[a.iL].hurt>RK.time,garp:RK.CH[a.iG].army};},A2);
T('défense du joueur avec commandants : camp 1, Garp et Luffy sur le terrain, Luffy mis hors de combat → blessé',s2.side===1&&s2.h.includes('Garp')&&s2.h.includes('Luffy')&&c2.luffy&&!c2.garp,{s2,c2});
let A3=await arrive({id:9003});await p.click('[data-rk="auto"]');await p.waitForTimeout(400);
const c3=await p.evaluate(a=>{const RK=__RK,b=RK.BATTLES[RK.BATTLES.length-1];return {n:RK.BATTLES.length-a.nB,rt:!!(b&&b.rt),arm:RK.armies.some(x=>x.id===9003),speed:RK.speed};},A3);
T('« Résolution automatique » : calcul d\'origine (rapport sans marque), armée résolue, vitesse rendue',c3.n===1&&!c3.rt&&!c3.arm&&c3.speed===1,c3);
await p.evaluate(()=>{localStorage.setItem('rk-rt','jamais');});await p.evaluate(()=>{__RT.cmdMode='jamais';});
let A4=await arrive({id:9004});T('réglage « jamais » : aucune fenêtre, calcul d\'origine immédiat',!A4.ask&&A4.speed===1,A4);
await p.evaluate(()=>{__RT.cmdMode='importantes';localStorage.removeItem('rk-rt');});
const cmp=await p.evaluate(n=>__RT.compare(n,{seed:11}),Math.max(60,N));
T('équilibre contre le calcul automatique : accord ≥ 80 %, écart de victoires ≤ 10 points, survivants pas plus nombreux (± 5 points)',cmp.accord>=.8&&Math.abs(cmp.rtA-cmp.autoA)<=.1&&cmp.survRt<=cmp.survAuto+.05,cmp);
T('aucune erreur JavaScript',!errs.length,errs.slice(0,4));console.log(n+'/'+t);await b.close();srv.kill();})();
