/* Essais de la tranche de jeu (src/essai/84-jeu.js).
   node t_jeu.js <dossier servi (essai_test.html + iles/)>
   Duel : déclenchement, ordres de l'IA sans effet, ordre du joueur qui rompt, issue et bonus de moral, un seul duel par paire, équilibre de la démo.
   Riposte de la Marine (Course) : option coupée = règle d'origine (rien), option active = avis puis frappe graduée, la Marine jamais visée.
   Primes : panneau d'avis de recherche ; île de démonstration au choix ; 0 erreur JavaScript. */
const {chromium}=require('playwright');const {spawn}=require('child_process');
(async()=>{const dir=process.argv[2],port=8500+Math.floor(Math.random()*90);
const srv=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:dir,stdio:'ignore'});await new Promise(r=>setTimeout(r,800));
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1400,height:860}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
let n=0,t=0;const T=(a,c,d)=>{t++;if(c)n++;console.log((c?'✔ ':'✘ ')+a+(d!==undefined?' — '+JSON.stringify(d):''));};
await p.goto(`http://127.0.0.1:${port}/essai_test.html`);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('gl-tuto','1');localStorage.setItem('rk-tob','{"off":1}');});await p.reload();await p.waitForTimeout(1500);
T('écran d\'accueil : case « Riposte de la Marine (essai) » cochée par défaut',await p.evaluate(()=>{const c=document.getElementById('o-riposte');return !!c&&c.checked;}));
await p.click('#o-go');await p.waitForTimeout(1200);await p.evaluate(()=>document.querySelectorAll('.tu-card,.tob').forEach(e=>e.remove()));
T('panneau de la Course : avis de recherche de chaque camp',await p.evaluate(()=>{const s=document.querySelector('#cs-hud .op-pr');return !!s&&s.querySelectorAll('.op-w').length===__RK.players.filter(q=>q.alive).length;}));
/* riposte coupée : la règle d'origine de la Course ne frappe pas */
const troupes=()=>p.evaluate(()=>__RK.terrs.filter(q=>q.owner===__RK.ME).reduce((a,q)=>a+Object.values(q.u).reduce((x,y)=>x+y,0),0));
await p.evaluate(()=>{__OPJ.riposte(false);__OPJ.test.avis();__OPJ.test.frappe();});const a0=await troupes();
T('option coupée : aucune frappe (Course d\'origine)',Math.abs(a0-30)<1e-6&&await p.evaluate(()=>__OPJ.test.etat().marineWarned===true),{troupes:a0});
await p.evaluate(()=>{__OPJ.riposte(true);__OPJ.test.frappe();});const a1=await troupes();
T('option active : frappe de la Marine (Vice-amiral, −15 %) et minuteur relancé',Math.abs(a1-25.5)<.01&&await p.evaluate(()=>__OPJ.test.etat().marineAt>0),{troupes:a1,etat:await p.evaluate(()=>__OPJ.test.etat())});
T('la Marine n\'est jamais visée par sa propre riposte',await p.evaluate(()=>{const c=__OPJ.test.cibles();return c.length>0&&!c.includes('marine');}),await p.evaluate(()=>__OPJ.test.cibles()));
/* duel */
await p.click('#rt-go',{force:true});for(let i=0;i<120;i++){if(await p.evaluate(()=>!!(__RT.run&&__RT.run.cam)))break;await p.waitForTimeout(500);}
const d=await p.evaluate(()=>{const R=__RT.run;__RT.cine=false;let k=0;while(!R.duel&&!R.end&&k<4000){__RT.step(R);k++;}if(!R.duel)return null;const D=R.duel;
  for(let j=0;j<20;j++)__RT.step(R);const encore=!!R.duel;return {t:+R.t.toFixed(1),a:D.a.hero,b:D.b.hero,encore,ia:R.aiOn};});
T('deux commandants ennemis proches : duel déclenché ; l\'IA ne le rompt pas',!!d&&d.encore,d);
const o=await p.evaluate(()=>{const R=__RT.run,h=R.G.find(g=>g.hero&&g.sd===R.side&&g.duel);if(!h)return null;const [x,y]=[h.cx-2,h.cy];__RT.give(R,h,{k:'aller',x,y},false);return {duel:!!R.duel,log:R.log[0][1]};});
T('un ordre du joueur à son commandant rompt le duel',!!o&&!o.duel&&/rompt le duel/.test(o.log),o);
const o2=await p.evaluate(()=>{const R=__RT.run;for(let j=0;j<200;j++)__RT.step(R);return !R.duel;});
T('un seul duel par paire et par bataille',o2);
await p.evaluate(()=>__RT.stop());
const s=await p.evaluate(()=>{__RT.dst={};const r=__RT.sim(40);return {w0:r.w0,w1:r.w1,duels:__RT.dst};});
const dec=Object.entries(s.duels).filter(([k])=>k!=='nul').reduce((a,[,v])=>a+v,0);
T('démo IA (40 batailles) : les duels désignent un vainqueur dans au moins 80 % des cas, attaquant entre 35 et 75 %',dec>=.8*(dec+(s.duels.nul||0))&&s.w0>=14&&s.w0<=30,s);
let r=null;for(const sd of [4242,11,23,37,51,77]){await p.evaluate(sd=>__RT.start({seed:sd}),sd);for(let i=0;i<60;i++){if(await p.evaluate(()=>!!(__RT.run&&__RT.run.cam)))break;await p.waitForTimeout(300);}
  r=await p.evaluate(()=>{const R=__RT.run;__RT.cine=false;let k=0;while(!R.end&&k<6000){__RT.step(R);k++;const l=R.log.find(q=>/remporte le duel/.test(q[1]));if(l){const w=l[1].split(' remporte')[0],g=R.G.find(q=>q.hero===w);
    const L=R.G.filter(q=>q.sd===g.sd&&!q.hero).flatMap(q=>q.causes.map(c=>c[1]));return {w,bonus:L.some(c=>/gagne le duel \+12/.test(c))};}}return null;});
  await p.evaluate(()=>__RT.stop());await p.waitForTimeout(300);if(r)break;}
T('le vainqueur du duel galvanise ses troupes proches (+12 de moral)',!!r&&r.bonus,r);
/* île de démonstration */
await p.evaluate(()=>{__RT.demoIsle='Pays des Wa';__RT.start({seed:7});});for(let i=0;i<80;i++){if(await p.evaluate(()=>!!(__RT.run&&__RT.run.cam)))break;await p.waitForTimeout(400);}
T('démonstration sur l\'île choisie (Pays des Wa), titre accordé',await p.evaluate(()=>__RT.run.t0name==='Pays des Wa'&&/du Pays des Wa/.test(document.querySelector('#rt-st b').textContent)));
await p.evaluate(()=>{__RT.stop();__RT.demoIsle='Alabasta';});
T('aucune erreur JavaScript',errs.length===0,errs.slice(0,5));
console.log(n+'/'+t);await b.close();srv.kill();process.exit(n===t?0:1);})();
