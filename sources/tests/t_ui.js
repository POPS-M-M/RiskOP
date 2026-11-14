const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();
const res=[];const ok=(n,c,d)=>{res.push((c?'PASS ':'FAIL ')+n+(d!==undefined?' — '+d:''));};
const errs=[];
const mk=async(vp)=>{const p=await b.newPage({viewport:vp});p.on('pageerror',e=>errs.push(vp.width+'px PAGEERR '+e.message+' @ '+(e.stack||'').split('\n')[1]));await p.goto('file://'+__dirname+'/../dist/risk_test.html');await p.evaluate(()=>{localStorage.clear();localStorage.setItem('gl-tuto','1');});await p.reload();await p.waitForTimeout(700);return p;};
const p=await mk({width:1400,height:860});
const R=(f,a)=>p.evaluate(f,a);
ok('Guide décoché pour un joueur qui l’a déjà fait',!(await R(()=>document.querySelector('#o-tuto').checked)));
console.log('rythme par défaut:',await R(()=>document.querySelector('#o-pace').selectedOptions[0].textContent));
await p.click('#o-go');await p.waitForTimeout(500);
ok('Nouvelle partie solo lancée (tours simultanés)',await R(()=>__RK.started&&__RK.TM.on&&!__RK.TU.on));
const ph=await R(()=>document.querySelector('#phase').textContent);
ok('Bandeau de phase visible (tour, phase, camps)',/Tour 1/.test(ph)&&/ORDRES/.test(ph)&&/Pirates/.test(ph),ph.slice(0,140));
/* recrutement via l'interface */
const g0=await R(()=>__RK.players[0].gold);
await p.click('#side [data-act="recruit"][data-v="guerrier"]');await p.waitForTimeout(300);
const g1=await R(()=>__RK.players[0].gold);
ok('Recrutement (clic sur le bouton)',g1<g0,Math.round(g0)+' → '+Math.round(g1)+' ฿');
/* aperçu de dépense au survol */
await p.hover('#side [data-act="recruit"][data-v="guerrier"]');await p.waitForTimeout(400);
ok('Aperçu de la dépense au survol (bandeau budget)',await R(()=>{const e=document.getElementById('bprev');return !!e&&e.textContent.length>3;}),await R(()=>{const e=document.getElementById('bprev');return e?e.textContent:'absent';}));
/* déplacer des troupes : glisser de la capitale vers un voisin neutre */
const pos=await R(()=>{const X=__RK,c=X.terrs.find(t=>t.owner===0&&t.capital),n=c.nb.map(i=>X.terrs[i]).filter(t=>t.owner<0&&t.boss===undefined).sort((a,b)=>X.tr(a)-X.tr(b))[0];X.ui.pct=1;const r=document.querySelector('#map').getBoundingClientRect();const P=t=>({x:r.left+t.x/1400*r.width,y:r.top+t.y/860*r.height});return {a:P(c),b:P(n),tid:n.id,cid:c.id};});
await p.mouse.move(pos.a.x,pos.a.y);await p.mouse.down();for(let k=1;k<=8;k++)await p.mouse.move(pos.a.x+(pos.b.x-pos.a.x)*k/8,pos.a.y+(pos.b.y-pos.a.y)*k/8);await p.mouse.up();
await p.waitForTimeout(200);
ok('Ordre de mouvement (glisser) mis en file',await R(t=>__RK.TM.queue.some(o=>o.s===0&&o.to===t),pos.tid));
/* fin de tour → résolution → IA visible */
let sawMv=0,label='',conq=false,brief='';
for(let turn=0;turn<14;turn++){
  await R(()=>{if(__RK.TM.phase==='plan'){__RK.speed=4;}});
  await p.click('#b-end');
  for(let k=0;k<40;k++){await p.waitForTimeout(250);
    const s=await R(()=>({mv:document.querySelectorAll('#ph-mv .mv').length,ph:__RK.TM.phase,br:(()=>{const e=document.getElementById('brief');return e&&!e.hidden?e.textContent:'';})()}));
    if(s.mv>sawMv){sawMv=s.mv;label=await R(()=>document.querySelector('#ph-mv').textContent);if(turn<6)await p.screenshot({path:'s_res.png'});}
    if(/Butin/.test(s.br)&&!brief){brief=s.br;await p.screenshot({path:'s_brief.png'});}
    if(s.ph==='plan'&&k>4)break;}
  if(turn===0)conq=await R(t=>__RK.terrs[t].owner===0,pos.tid);
}
ok('Conquête de l’île visée au premier tour',conq);
ok('Rapport de bataille avec récapitulatif de conquête (butin)',!!brief,brief.slice(0,160));
ok('Actions de l’IA annoncées (qui attaque quoi)',sawMv>0,label.slice(0,200));
const ai=await R(()=>__RK.players.slice(1).map(q=>__RK.terrs.filter(t=>t.owner===q.id).length));
ok('Les IA s’étendent pendant ces 14 tours',ai.some(n=>n>1),'îles IA : '+ai.join(', '));
/* onglets */
for(const [tab,re] of [['eco',/Revenu|revenu/],['leg',/Utilité|Recrut/],['obj',/Objectif|objectif|Victoire|victoire/],['age',/âge/],['jrn',/./]]){
  await R(t=>{__RK.ui.tab=t;__RK.renderPanel(true);},tab);await p.waitForTimeout(150);
  const t=await R(()=>document.querySelector('#side').textContent);
  ok('Onglet '+tab+' affiché',re.test(t),t.length+' caractères');
  if(tab==='eco'||tab==='leg'||tab==='obj')await p.screenshot({path:'s_tab_'+tab+'.png'});
}
/* boss */
const boss=await R(()=>__RK.BOSSES.map((B,i)=>({n:B.n,need:__RK.rkBossNeed(i)})));
ok('Boss : effectif nécessaire calculable pour chacun',boss.every(x=>isFinite(x.need)),boss.map(x=>x.n+' ≈'+x.need).join(' · '));
const bsh=await R(()=>{const X=__RK,t=X.terrs.find(t=>t.boss!==undefined);X.ui.sel=t.id;X.ui.tab='army';X.renderPanel(true);return document.querySelector('#side').textContent.match(/Pourquoi l’attaquer.{0,160}/);});
ok('Boss : fiche avec récompense annoncée',!!(bsh&&bsh[0]),bsh&&bsh[0]);
await p.screenshot({path:'s_boss.png'});
/* mini-carte : masquer/afficher (touche M) */
await p.keyboard.press('m');await p.waitForTimeout(400);
const h1=await R(()=>document.querySelector('#minibox').hidden&&!document.querySelector('#mini-show').hidden);
await p.keyboard.press('m');await p.waitForTimeout(400);
const h2=await R(()=>!document.querySelector('#minibox').hidden);
ok('Mini-carte masquable/affichable',h1&&h2);
/* victoire */
const win=await R(()=>{const X=__RK;for(const t of X.terrs)t.owner=0;X.armies.length=0;X.TM.phase='res';X.TM.res=5;X.step(.05);return {over:!!X.over,w:X.over&&X.over.winners,text:document.querySelector('#overlay h2')&&document.querySelector('#overlay h2').textContent,scene:X.sndWant()};});
ok('Victoire détectée et écran de fin',win.over&&win.w.includes(0)&&/Victoire/.test(win.text),JSON.stringify(win));
await p.screenshot({path:'s_win.png'});
/* résolutions */
for(const vp of [{width:1024,height:700},{width:390,height:844},{width:1920,height:1080}]){
  const q=await mk(vp);await q.click('#o-go');await q.waitForTimeout(700);
  const m=await q.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth,map:document.querySelector('#map').getBoundingClientRect().width,phase:!document.querySelector('#phase').hidden}));
  ok('Résolution '+vp.width+'×'+vp.height+' : pas de défilement horizontal, carte visible',m.sw<=m.iw+1&&m.map>200,JSON.stringify(m));
  await q.screenshot({path:'s_'+vp.width+'.png'});await q.close();
}
console.log(res.join('\n'));console.log(errs.join('\n')||'aucune erreur JS');await b.close()})();
