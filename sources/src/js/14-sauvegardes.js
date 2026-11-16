/* ================= Sauvegardes de partie =================
   Avant : seuls le profil (statistiques, succès, étoiles de campagne) et les réglages étaient mémorisés ; une partie en cours ne l'était JAMAIS.
   Maintenant : 3 emplacements nommés + 1 emplacement automatique. Une sauvegarde contient tout l'état de la partie solo (îles, armées, camps,
   diplomatie, âge, personnages, boss, événements) et se recharge à l'identique. Stockage : ce navigateur seulement (localStorage). */
const SV={keys:['rk-s1','rk-s2','rk-s3'],auto:'rk-sa',open:false,confirm:'',edit:'',msg:'',autoAt:0,autoKey:'',nameDraft:''};
/* Île renommée (Arabasta → Alabasta) : les anciennes sauvegardes sont converties à la lecture, rien d'autre ne change. */
/* îles renommées (Alabasta, puis les noms de la liste de 53 îles) : la sauvegarde est lue avec les nouveaux noms, sur la carte où elle a été faite */
const SV_REN={"Arabasta":"Alabasta","Elbaf":"Elbaph","Wano":"Pays des Wa","Hachinosu":"La Ruche","Fish-Man":"Île des Hommes-Poissons","Whole Cake":"Whole Cake Island","Kamabakka":"Royaume de Kamabakka","New Marineford":"Nouveau Marineford","Sabaody":"Archipel des Sabaody","Reverse Mountain":"Cap des Jumeaux","Sorbet":"Royaume de Sorbet","Sphinx":"Île de Sphinx","Drum":"Île de Drum","Cocoyasi":"Archipel des Konomi","Germa":"Royaume de Germa","Kuraigana":"Île de Kuraigana","Ruskaina":"Rusukaina","Syrup":"Archipel des Gecko"};
const svRenamed=s=>s&&s.replace(/"([^"\\]{2,24})"/g,(m,n)=>SV_REN[n]?'"'+SV_REN[n]+'"':m);
const svRead=k=>{try{const o=JSON.parse(svRenamed(rkLS(k))||'null');return o&&o.v===1&&o.G&&o.meta?o:null;}catch(_){return null;}};
const svClone=x=>JSON.parse(JSON.stringify(x));
function svCanSave(){return MODE==='solo'&&started&&!over&&players.length&&!TU.on?'':MODE!=='solo'?'Les sauvegardes ne sont pas disponibles en partie en ligne.':TU.on?'Terminez ou quittez le guide pour sauvegarder.':!started||over?'Aucune partie en cours à sauvegarder.':'Aucune partie en cours.';}
function svBuild(name){
  const p=players[ME],cw=CREWS[p.crew||0];
  const meta={name:name||(cw.n+' · '+(TM.on?'Tour '+TM.n:Math.floor(time/60)+' min')),camp:cw.n,ic:cw.ic,color:p.color,turn:TM.on?TM.n:0,real:!TM.on,age:AG.n,terr:terrs.filter(t=>t.owner===ME).length,total:terrs.length,diff:diffKey,t:Math.round(time),date:Date.now(),pace:PK};
  const G=svClone({mapv:MAPV,seed,diffKey,PK,ME,time,speed,secAcc,TM,AG,players,terrs,armies,rel,tradeM,truce,opin,proposals,warSince,vas,vasSince,vasDomT,domKey,domT,poneKey,poneT,marineAt,marineWarned,marineTarget,huntPrimes,BS,CH,EV,evNextAt,evSeq,evLastK,ARMN,BRN,BATTLES:BATTLES.slice(-30),JOURNAL:JOURNAL.slice(-150),logs:logs.slice(-6),CAMP,rec:RK.rec,ui:{sel:ui.sel,tab:ui.tab,pct:ui.pct,stance:ui.stance},rkp:{gid:RK.gid||'',roster:RK.roster||null,disc:RK.disc||[],coal:RK.coal>=0?RK.coal:-1}});
  return {v:1,meta,G};
}
function svWrite(k,name){
  const why=svCanSave();if(why)return why;
  try{localStorage.setItem(k,JSON.stringify(svBuild(name)));return '';}catch(e){return 'Sauvegarde impossible : le stockage du navigateur est plein ou bloqué.';}
}
function svRestore(o){
  const G=o.G;
  try{
    leaveNet();
    MODE='solo';ME=G.ME|0;PK=G.PK;diffKey=G.diffKey;
    setupWorld(G.seed,G.mapv||1);chReset();brReset();
    if(G.terrs.length!==terrs.length)throw new Error('carte différente');
    terrs.forEach((t,i)=>{Object.assign(t,G.terrs[i]);});
    players=G.players;armies=G.armies;rel=G.rel;tradeM=G.tradeM;truce=G.truce;opin=G.opin;proposals=G.proposals;warSince=G.warSince;vas=G.vas;vasSince=G.vasSince;vasDomT=G.vasDomT;
    domKey=G.domKey;domT=G.domT;poneKey=G.poneKey;poneT=G.poneT;marineAt=G.marineAt;marineWarned=G.marineWarned;marineTarget=G.marineTarget;huntPrimes=G.huntPrimes;
    BS=G.BS;CH=G.CH;EV=G.EV;evNextAt=G.evNextAt;evSeq=G.evSeq;evLastK=G.evLastK;ARMN=G.ARMN;BRN=G.BRN;
    TM=G.TM;AG=G.AG;time=G.time;secAcc=G.secAcc;seed=G.seed;
    for(const p of players){if(p.x&&Array.isArray(p.x.cr))p.x.cr=p.x.cr.map(v=>v===null?undefined:v);}
    if(Array.isArray(AG.cdl))AG.cdl=AG.cdl.map(v=>v===null?undefined:v);
    BATTLES.length=0;for(const b of G.BATTLES||[])BATTLES.push(b);
    JOURNAL=G.JOURNAL||[];logs=G.logs||[];logDirty=true;CAMP=G.CAMP||null;RK.rec=G.rec||[];
    /* progression : une sauvegarde d'avant cette version n'a pas de liste → tous les commandants du camp restent proposés */
    {const P=G.rkp||{};RK.roster=P.roster&&typeof P.roster==='object'?P.roster:null;RK.disc=Array.isArray(P.disc)?P.disc:[];RK.gid=P.gid||('old-'+G.seed+'-'+Math.round(G.time||0));RK.roKey='';RK.pgOver=null;RK.coal=P.coal>=0&&P.coal<4?P.coal|0:-1;}
    over=null;elimShown=false;TU={on:false,i:0,seen:{},clk:0};
    ui.sel=G.ui&&G.ui.sel!=null?G.ui.sel:-1;ui.tab=(G.ui&&G.ui.tab)||'army';ui.pct=(G.ui&&G.ui.pct)||.5;ui.stance=(G.ui&&G.ui.stance)|0;ui.mode='move';
    V.k=1;V.x=0;V.y=0;
    players.forEach(recalc);
    modePick=TM.on?'turn':'real';pacePick=PK;
    dirty=true;lastPanel='';started=true;speed=G.speed>0?G.speed:1;overlay.hidden=true;RK.phKey='';RK.phase0='';
    paintGrid();updateHint();renderPanel(true);
    return '';
  }catch(e){return 'Sauvegarde illisible ou incompatible ('+e.message+').';}
}
function svAuto(why){
  if(svCanSave())return;
  const e=svWrite(SV.auto,'Auto · '+CREWS[players[ME].crew||0].n+' · '+(TM.on?'Tour '+TM.n:Math.floor(time/60)+' min'));
  if(!e){SV.autoAt=Date.now();}
}
/* moments pertinents : début de chaque tour d'ordres, changement d'âge, toutes les 90 s en temps réel, départ vers le menu, fermeture de l'onglet */
function rkAutoTick(){
  if(svCanSave()||AG.trn)return;
  const key=(TM.on?TM.n+':'+TM.phase:'r'+Math.floor(time/90))+':'+AG.n;
  if(key===SV.autoKey)return;
  if(TM.on&&TM.phase!=='plan')return;
  const first=SV.autoKey==='';SV.autoKey=key;
  if(first)return;
  svAuto('tour');
}
addEventListener('pagehide',()=>{try{svAuto('quit');}catch(_){}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){try{svAuto('hidden');}catch(_){}}});
const svFmt=ts=>{const d=new Date(ts);return d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'})+' '+d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});};
function svLatest(){
  let best=null;
  for(const k of [SV.auto,...SV.keys]){const o=svRead(k);if(o&&(!best||o.meta.date>best.o.meta.date))best={k,o};}
  return best;
}
function svSlotHTML(k,label,isAuto){
  const o=svRead(k),canSave=!svCanSave();
  const nm=o?esc(o.meta.name):'';
  if(!o)return '<div class="slot empty"><div class="sh"><b>'+label+'</b><span class="sm">Vide</span></div>'+(isAuto?'<span class="sm">Remplie automatiquement au début de chaque tour, à chaque changement d’âge et quand vous quittez la partie.</span>':'<div class="sa"><button data-sv="save:'+k+'"'+(canSave?'':' disabled')+'>Sauvegarder ici</button></div>')+'</div>';
  const m=o.meta,conf=SV.confirm;
  let acts='';
  if(SV.edit===k)acts='<input id="sv-name" maxlength="40" value="'+esc(m.name)+'" aria-label="Nom de la sauvegarde"><button data-sv="rename:'+k+'">Valider</button><button data-sv="editno">Annuler</button>';
  else{
    acts=(conf==='load:'+k?'<button class="on" data-sv="load!:'+k+'">Confirmer le chargement</button><button data-sv="no">Annuler</button>':'<button data-sv="load:'+k+'">Charger</button>');
    if(!isAuto)acts+=(conf==='over:'+k?'<button class="on" data-sv="save!:'+k+'">Confirmer : écraser</button><button data-sv="no">Annuler</button>':'<button data-sv="over:'+k+'"'+(canSave?'':' disabled')+'>Écraser</button>')+'<button data-sv="edit:'+k+'">Renommer</button>'+(conf==='del:'+k?'<button class="on" data-sv="del!:'+k+'">Confirmer : supprimer</button><button data-sv="no">Annuler</button>':'<button data-sv="del:'+k+'">Supprimer</button>');
  }
  return '<div class="slot"><div class="sh"><span style="color:'+m.color+'">'+m.ic+'</span><b>'+nm+'</b>'+(isAuto?'<span class="rar" style="border-color:var(--accent);color:var(--accent)">auto</span>':'')+'</div>'
    +'<div class="sm">'+esc(m.camp)+' · '+(m.real?'temps réel · '+Math.floor(m.t/60)+' min':'tour '+m.turn)+' · âge '+ROMAN[m.age]+' · '+m.terr+' / '+m.total+' îles · '+esc((DIFF[m.diff]||{n:m.diff}).n)+'</div>'
    +'<div class="sm">Enregistrée le '+svFmt(m.date)+'</div><div class="sa">'+acts+'</div></div>';
}
function svRender(){
  let el=$('#rkm');
  if(!SV.open){if(el)el.hidden=true;return;}
  if(!el){el=document.createElement('div');el.id='rkm';el.className='rkm';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Sauvegardes');document.body.appendChild(el);
    el.addEventListener('click',svClick);}
  el.hidden=false;
  const why=svCanSave();
  el.innerHTML='<div class="rkb"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h2>Sauvegardes</h2><button data-sv="close" aria-label="Fermer">✕</button></div>'
    +'<h3>Ce qui est conservé</h3><div class="kinds"><div class="on"><b>Profil · statistiques</b>Parties jouées, victoires : automatique.</div><div class="on"><b>Succès et carnet</b>Automatique, dans ce navigateur.</div><div class="on"><b>Campagne</b>Étoiles par chapitre : automatique.</div><div class="on"><b>Partie en cours</b>Uniquement via les emplacements ci-dessous (et l’emplacement auto).</div></div>'
    +'<p class="advnote">Les sauvegardes restent dans <b>ce navigateur</b> ; elles ne suivent pas d’un appareil à l’autre et disparaissent si vous effacez les données du site.</p>'
    +(why?'<p class="advnote" style="color:var(--accent)">'+esc(why)+' Vous pouvez tout de même charger une sauvegarde.</p>':'')
    +(SV.msg?'<p class="verdict '+(SV.msg.ok?'pos':'neg')+'" role="status">'+esc(SV.msg.t)+'</p>':'')
    +'<h3>Emplacement automatique</h3>'+svSlotHTML(SV.auto,'Auto',true)
    +'<h3>Vos emplacements</h3>'+SV.keys.map((k,i)=>svSlotHTML(k,'Emplacement '+(i+1),false)).join('')+'</div>';
}
function svClick(e){
  const b=e.target.closest('[data-sv]');if(!b||b.disabled)return;
  const [a,k]=b.dataset.sv.split(':');
  SV.msg='';
  if(a==='close'){SV.open=false;SV.confirm='';SV.edit='';}
  else if(a==='no')SV.confirm='';
  else if(a==='save'||a==='save!'){
    const m=svWrite(k,'');SV.msg=m?{ok:false,t:m}:{ok:true,t:'Partie sauvegardée ('+CREWS[players[ME].crew||0].n+', '+(TM.on?'tour '+TM.n:Math.floor(time/60)+' min')+').'};SV.confirm='';
  }
  else if(a==='over')SV.confirm='over:'+k;
  else if(a==='load')SV.confirm='load:'+k;
  else if(a==='load!'){const o=svRead(k);if(!o)SV.msg={ok:false,t:'Cette sauvegarde est illisible.'};else{const m=svRestore(o);if(m)SV.msg={ok:false,t:m};else{SV.open=false;SV.confirm='';toast('Partie chargée : '+o.meta.name);}}SV.confirm='';}
  else if(a==='del')SV.confirm='del:'+k;
  else if(a==='del!'){try{localStorage.removeItem(k);}catch(_){}SV.confirm='';SV.msg={ok:true,t:'Sauvegarde supprimée.'};}
  else if(a==='edit'){SV.edit=k;SV.confirm='';}
  else if(a==='editno')SV.edit='';
  else if(a==='rename'){const o=svRead(k);const inp=$('#sv-name');if(o&&inp){o.meta.name=(inp.value||'').trim().slice(0,40)||o.meta.name;try{localStorage.setItem(k,JSON.stringify(o));SV.msg={ok:true,t:'Sauvegarde renommée.'};}catch(_){SV.msg={ok:false,t:'Impossible de renommer.'};}}SV.edit='';}
  svRender();
}
function svOpen(){SV.open=true;SV.confirm='';SV.edit='';SV.msg='';svRender();}
addEventListener('keydown',e=>{if(e.key==='Escape'&&SV.open){SV.open=false;svRender();}});
