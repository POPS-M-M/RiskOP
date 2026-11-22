/* OP Adventure = Course seule : aucun accès Campagne / Combat arcade / tutoriel classique / jeu en ligne. node t_course_seule.js [dist/essai_test.html] */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1400,height:860}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
const F=require('path').resolve(process.argv[2]||require('path').join(__dirname,'../../../dist/essai_test.html'));
await p.goto('file://'+F);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('gl-tuto','1');});await p.reload();await p.waitForTimeout(900);
const R={};const ok=(n,c,d)=>{R[n]=!!c;console.log((c?'✔ ':'✘ ')+n+(d!==undefined?' — '+JSON.stringify(d):''));};
const BAD=['o-arc','o-camp','o-cmenu','o-cnext','o-cretry','o-host','o-join','o-tuto','o-guide'];
const scan=async(label)=>{const r=await p.evaluate(BAD=>({ids:BAD.filter(i=>document.getElementById(i)&&document.getElementById(i).offsetParent!==null),txt:/Combat arcade|Mode Campagne|Campagne/.test(document.body.innerText),arc:!!document.querySelector('#arc,.arc-root,[id^="arc-"]')}),BAD);ok(label+' : aucun accès Campagne / arcade / tutoriel classique / en ligne visible',!r.ids.length&&!r.txt&&!r.arc,r);};
ok('script Combat arcade absent (window.ARC)',await p.evaluate(()=>typeof window.ARC==='undefined'));
await scan('accueil');
/* raccourcis clavier à l'accueil */
for(const k of ['a','A','c','C','t','m','Enter','Escape','F1','?'])await p.keyboard.press(k).catch(()=>{});await p.waitForTimeout(300);await scan('accueil après raccourcis');
/* écran Sauvegardes depuis l'accueil */
if(await p.$('#o-saves')){await p.click('#o-saves');await p.waitForTimeout(400);await scan('écran Sauvegardes');await p.keyboard.press('Escape');}
/* fonctions des anciens modes appelées directement (console, ancien lien) : retour à l'accueil de la Course */
const f=await p.evaluate(()=>{const X=__RK,out={};for(const n of ['campMenu','campPlay','rkStartTutorial','mpEnter']){try{const g=X.MODES[n];if(typeof g!=='function'){out[n]='absente';continue;}g();out[n]=document.querySelector('#overlay:not([hidden])')&&/Course/.test(document.querySelector('#overlay').innerText)?'accueil Course':'autre';}catch(e){out[n]='erreur '+e.message;}}return out;});
ok('anciennes entrées (campMenu, campPlay, tutoriel, en ligne) ramènent à l\'accueil de la Course',Object.values(f).every(v=>v==='accueil Course'||v==='absente'),f);
/* partie lancée : règles, barre du haut */
await p.evaluate(()=>{CS.start({seat:'marine',seed:5,dk:'normal',turn:false,pk:6});document.querySelectorAll('.tu-card,.tob').forEach(e=>e.remove());});await p.waitForTimeout(600);
await scan('partie en cours');
const rules=await p.evaluate(()=>{__RK.MODES.showRules();const el=document.getElementById('rulesov');const s=[...el.querySelectorAll('summary')].map(x=>x.textContent.trim());el.remove();return s;});
ok('règles : sections Campagne et Combat arcade retirées, règles de la Course en tête',!rules.some(s=>/arcade|Campagne/i.test(s))&&/Course/.test(rules[0]),rules.slice(0,4));
/* sauvegardes : une partie classique (v1) n'est pas chargée ; une partie Course (v2) l'est */
const sv=await p.evaluate(()=>{const X=__RK;const c=X.svBuild('t');const v1=JSON.parse(JSON.stringify(c));v1.v=1;delete v1.G.course;const m1=X.svRestore(v1);const m2=X.svRestore(JSON.parse(JSON.stringify(c)));return {v:c.v,m1,m2,on:CS.on,n:X.players.length};});
ok('sauvegarde Course v2 rechargée, sauvegarde classique refusée, emplacements propres (rk-c*)',sv.v===2&&sv.m1&&sv.m2===''&&sv.on&&sv.n===5,sv);
/* fin de partie : l'écran de fin ne propose pas la Campagne */
await p.evaluate(()=>{CS.victory(0,'tient Laugh Tale : le One Piece est à lui.');});await p.waitForTimeout(400);await scan('écran de fin');
ok('aucune erreur JavaScript',!errs.length,errs.slice(0,3));
await b.close();process.exit(Object.values(R).every(Boolean)?0:1);})();
