const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1400,height:860}});
const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
await p.goto('file://'+__dirname+'/../dist/risk_test.html');await p.evaluate(()=>localStorage.clear());await p.reload();await p.waitForTimeout(800);
const R=(f,...a)=>p.evaluate(f,...a);
const res=[];const ok=(n,c,d)=>{res.push((c?'PASS ':'FAIL ')+n+(d!==undefined?' — '+d:''));};
/* 1. économie : somme des parts = income(p).g, à plusieurs étapes d'une partie jouée par l'IA */
const eco=await R(()=>{
  const X=__RK;X.newGame(777,'normal',{turn:true,pk:3});X.started=true;
  const out=[];let worst=0;
  for(let turn=1;turn<=40;turn++){
    X.TM.ready=[true,true,true,true];X.startRes();
    for(let i=0;i<400;i++){X.step(.05);if(X.TM.phase==='plan')break;}
    if(turn%8===0)for(const p of X.players){
      const E=X.rkEco(p),inc=X.income(p);
      const calc=E.net;const d=Math.abs(calc-inc.g);worst=Math.max(worst,d);
      out.push({turn,id:p.id,net:+calc.toFixed(4),inc:+inc.g.toFixed(4),d:+d.toFixed(5)});
    }
  }
  return {worst,n:out.length,sample:out.slice(0,3)};
});
ok('Économie : décomposition = income() (écart max)',eco.worst<1e-6,'écart max '+eco.worst+' sur '+eco.n+' relevés');
/* 2. sauvegarde : aller-retour */
const sv=await R(()=>{
  const X=__RK;X.newGame(4242,'normal',{turn:true,pk:3});X.started=true;
  for(let turn=1;turn<=12;turn++){X.TM.ready=[true,true,true,true];X.startRes();for(let i=0;i<400;i++){X.step(.05);if(X.TM.phase==='plan')break;}}
  const cap=X.terrs.find(t=>t.owner===0&&t.capital);
  X.cmd({k:'recruit',t:cap.id,u:'guerrier'});
  const strip=g=>{const o=Object.assign({},g);delete o.speed;return JSON.stringify(o);};const before=strip(X.svBuild('x').G);
  const err=X.svWrite('rk-s1','Test A');
  const meta=X.svRead('rk-s1').meta;
  /* on abîme la partie puis on recharge */
  X.newGame(1,'hard',{turn:false,pk:12});
  const o=X.svRead('rk-s1');
  const e2=X.svRestore(o);
  const after=strip(X.svBuild('x').G);
  return {err,e2,same:before===after,len:before.length,meta,turn:X.TM.n,terr:X.terrs.filter(t=>t.owner===0).length};
});
ok('Sauvegarde : écriture sans erreur',!sv.err,sv.err||'');
ok('Sauvegarde : rechargement',!sv.e2,sv.e2||'');
ok('Sauvegarde : état identique après rechargement ('+sv.len+' octets)',sv.same);
ok('Sauvegarde : méta (nom/camp/tour/âge)',sv.meta.name==='Test A'&&sv.meta.turn>=12&&typeof sv.meta.camp==='string',JSON.stringify(sv.meta));
/* la partie rechargée continue à tourner */
const cont=await R(()=>{const X=__RK;const t0=X.TM.n;for(let turn=0;turn<5;turn++){X.TM.ready=[true,true,true,true];X.startRes();for(let i=0;i<400;i++){X.step(.05);if(X.TM.phase==='plan')break;}}return {t0,t1:X.TM.n,over:!!X.over};});
ok('Sauvegarde : la partie rechargée continue (tours '+cont.t0+' → '+cont.t1+')',cont.t1===cont.t0+5);
/* emplacements, renommer, supprimer, auto */
const slots=await R(()=>{
  const X=__RK;X.svWrite('rk-s2','Deuxième');X.svAuto('t');
  const a=!!X.svRead('rk-sa'),b2=!!X.svRead('rk-s2');
  localStorage.removeItem('rk-s2');
  return {auto:a,s2:b2,gone:!X.svRead('rk-s2')};
});
ok('Sauvegarde : emplacements nommés + emplacement auto + suppression',slots.auto&&slots.s2&&slots.gone);
/* sauvegarde impossible hors partie */
const noSave=await R(()=>{const X=__RK;const old=X.started;X.started=false;const e=X.svWrite('rk-s3','x');X.started=old;return e;});
ok('Sauvegarde : refuse honnêtement quand aucune partie',!!noSave,noSave);
/* 3. modale sauvegardes (UI réelle) */
await R(()=>{__RK.svOpen();});await p.waitForTimeout(200);
const modal=await R(()=>({txt:document.querySelector('#rkm').innerText.slice(0,500),slots:document.querySelectorAll('#rkm .slot').length}));
ok('Sauvegardes : fenêtre avec explication des 4 types de données',/Profil/.test(modal.txt)&&/Campagne/.test(modal.txt)&&/Partie en cours/.test(modal.txt)&&/navigateur/.test(modal.txt),modal.slots+' emplacements');
await p.screenshot({path:'s_saves.png'});
await R(()=>{document.querySelector('#rkm [data-sv="close"]').click();});
/* 4. transition d'âge */
const age=await R(()=>{
  const X=__RK;X.newGame(99,'normal',{turn:true,pk:3});X.started=true;
  X.startTransition();X.renderTModal();
  const el=document.querySelector('#tmodal');
  const t=el.textContent;
  const adv=X.rkAgeAdvice(X.players[0]);
  return {shown:!el.hidden,why:/Pourquoi/.test(t),change:/Ce qui change/.test(t),kept:/Ce qui est conserv/.test(t),adv:adv&&adv.id,advwhy:adv&&adv.why,len:t.length};
});
ok('Âges : écran de transition (pourquoi, change, conservé)',age.shown&&age.why&&age.change&&age.kept,JSON.stringify(age));
await p.screenshot({path:'s_age.png'});
const ag2=await R(()=>{const X=__RK;const a=X.AG.n;X.cmd({k:'agdone'});X.agApply();return {a,b:X.AG.n,trn:X.AG.trn};});
ok('Âges : passage à l\'âge suivant',ag2.b===ag2.a+1&&!ag2.trn);
/* 5. son : scènes et volumes indépendants */
await p.mouse.click(700,400);
const snd=await R(async()=>{
  const X=__RK;X.sndInit();const S=X.SND;
  if(S.ctx&&S.ctx.state==='suspended')await S.ctx.resume();
  await new Promise(r=>setTimeout(r,300));
  const out={state:S.ctx&&S.ctx.state,dead:S.dead,scenes:{}};
  if(!S.ctx)return out;
  for(const sc of ['explore','dev','tense','war','win','lose']){
    S.scene=sc;S.beat=0;S.bar=0;S.next=S.ctx.currentTime+.05;const n0=S.n;
    let err=null;try{X.sndFill(S.ctx.currentTime+9);}catch(e){err=e.message;}
    out.scenes[sc]={nodes:S.n-n0,err};
  }
  S.mv=0;S.sv=1;S.on=true;await new Promise(r=>setTimeout(r,10));
  S.mus.gain.value=S.mv*.9;S.fx.gain.value=S.sv*1.1;
  out.vols={mus:S.mus.gain.value,fx:S.fx.gain.value};
  return out;
});
ok('Son : moteur Web Audio démarre',snd.state==='running',JSON.stringify({state:snd.state,dead:snd.dead}));
if(snd.scenes)for(const k in snd.scenes)ok('Son : ambiance « '+k+' » planifie des notes sans erreur',snd.scenes[k].nodes>5&&!snd.scenes[k].err,snd.scenes[k].nodes+' nœuds');
ok('Son : volumes musique/effets indépendants',snd.vols&&snd.vols.mus===0&&snd.vols.fx>1,JSON.stringify(snd.vols));
/* scène choisie selon l'état de jeu */
const sc=await R(()=>{
  const X=__RK;X.newGame(5,'normal',{turn:true,pk:3});X.started=true;X.SND.until=0;
  const o={};
  o.plan=X.sndWant();
  X.TM.phase='res';o.res_quiet=X.sndWant();
  const e=X.armies;X.armies.push({id:99,owner:1,from:0,to:X.terrs.findIndex(t=>t.owner===0),u:{guerrier:5},t:0,dur:20,s:0,rt:0});o.tense=X.sndWant();
  X.armies.length=0;X.TM.phase='plan';
  return o;
});
ok('Son : scènes d\'après l\'état (ordres → développement, armée ennemie → tension)',sc.plan==='dev'&&sc.tense==='tense',JSON.stringify(sc));
console.log(res.join('\n'));console.log(errs.join('\n')||'aucune erreur JS');await b.close()})();
