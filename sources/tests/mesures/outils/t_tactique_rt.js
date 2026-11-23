/* Essais du combat tactique en temps réel (src/essai/81-tactique-rt.js).
   node t_tactique_rt.js <dossier servi (essai_test.html + iles/)> [nombre de batailles IA]
   1) la pause arrête la simulation (empreinte identique après 2,5 s de pause), 2) ordres réels à la souris et au clavier,
   3) la partie n'est pas modifiée et la vitesse est rendue en quittant, 4) batailles IA contre IA (équilibre, durée), 5) 0 erreur JavaScript. */
const {chromium}=require('playwright');const {spawn}=require('child_process');
(async()=>{const dir=process.argv[2],N=+(process.argv[3]||40),port=8500+Math.floor(Math.random()*90);
const srv=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:dir,stdio:'ignore'});await new Promise(r=>setTimeout(r,800));
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1400,height:860}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(n,c,d)=>{console.log((c?'✔ ':'✘ ')+n+(d!==undefined?' — '+JSON.stringify(d):''));return c;};let n=0,t=0;const T=(a,b,c)=>{t++;if(ok(a,b,c))n++;};
await p.goto(`http://127.0.0.1:${port}/essai_test.html`);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('gl-tuto','1');localStorage.setItem('rk-tob','{"off":1}');});await p.reload();await p.waitForTimeout(1500);
await p.click('#o-go');await p.waitForTimeout(800);await p.evaluate(()=>document.querySelectorAll('.tu-card,.tob').forEach(e=>e.remove()));
const snap=()=>p.evaluate(()=>JSON.stringify([__RK.terrs.map(t=>[t.owner,JSON.stringify(t.u)]),__RK.speed]));const before=await snap();
await p.click('#rt-go');for(let i=0;i<120;i++){if(await p.evaluate(()=>!!(__RT.run&&__RT.run.cam)))break;await p.waitForTimeout(500);}
T('bataille ouverte en pause (déploiement)',await p.evaluate(()=>__RT.run.paused&&__RT.run.deploy));
T('sauvegarde refusée pendant la bataille',await p.evaluate(()=>/bataille/.test(__RT.canSave())));
await p.click('[data-rt="sel:0"]',{force:true});const pt=await p.evaluate(()=>{const R=__RT.run,[x,y]=R.M.xy(R.M.W-7,4);return __RT.scr(x,y);});
await p.mouse.click(pt[0],pt[1],{button:'right'});const pt2=await p.evaluate(()=>{const R=__RT.run,[x,y]=R.M.xy(R.M.W-10,3);return __RT.scr(x,y);});
await p.keyboard.down('Shift');await p.mouse.click(pt2[0],pt2[1],{button:'right'});await p.keyboard.up('Shift');await p.keyboard.press('2');
T('ordres : clic droit, Maj+clic droit (file), formation par touche',await p.evaluate(()=>{const g=__RT.run.G[0];return g.q.length===2&&g.q.every(o=>o.k==='aller')&&g.form==='colonne';}));
await p.keyboard.press('Space');await p.waitForTimeout(3000);await p.keyboard.press('Space');const h1=await p.evaluate(()=>__RT.hash());const t1=await p.evaluate(()=>__RT.run.t);
await p.waitForTimeout(2500);const h2=await p.evaluate(()=>__RT.hash());
T('la pause arrête la simulation (positions, effectifs, moral, recharges identiques)',h1===h2&&t1>0,{t:+t1.toFixed(2)});
await p.click('[data-rt="auto"]',{force:true});await p.waitForTimeout(800);T('fin de bataille atteinte en auto',await p.evaluate(()=>!!__RT.run.end),await p.evaluate(()=>__RT.run.end));
await p.click('#rt-end [data-rt="quitter"]',{force:true});await p.waitForTimeout(800);
T('la partie n\'est pas modifiée, vitesse rendue',before===await snap());
const s=await p.evaluate(n=>__RT.sim(n),N);T('batailles IA contre IA : attaquant entre 35 et 65 %',s.w0/s.n>=.35&&s.w0/s.n<=.65,s);
T('aucune erreur JavaScript',!errs.length,errs.slice(0,4));console.log(n+'/'+t);await b.close();srv.kill();})();
