/* ================= Boutons de l'en-tête et du menu : sauvegardes, guide, mode avancé ================= */
function rkRecapFor(r){
  if(!r||r.bs||r.att!==ME||!r.win)return '';
  const x=RK.rec.slice().reverse().find(z=>z.id===r.to);
  return x?rkRecapHTML(x):'';
}
function rkAdvLabel(){const b=$('#b-adv');if(!b)return;const on=RK.adv||AG.n>=1;b.classList.toggle('off',!on);b.querySelector('.lbl2').textContent=on?' Avancé : oui':' Avancé : non';b.title=AG.n>=1?'Les mécaniques avancées sont affichées automatiquement à partir de l’âge II.':'Afficher aussi les mécaniques avancées (relations, postures, etc.)';}
$('#b-adv').addEventListener('click',()=>{if(AG.n>=1){toast('Mode avancé actif d’office à partir de l’âge II.');return;}RK.adv=!RK.adv;rkLS('rk-adv',RK.adv?'1':'0');rkAdvLabel();lastPanel='';renderPanel(true);toast(RK.adv?'Mécaniques avancées affichées.':'Mode simple : l’essentiel seulement.');});
$('#b-saves').addEventListener('click',()=>{svOpen();});
$('#b-guide').addEventListener('click',()=>{
  if(started&&!over&&!TU.on&&MODE!=='client'&&!RK.guideArm){RK.guideArm=1;toast('Le guide lance une partie d’entraînement et quitte la partie en cours (elle est mise dans l’emplacement auto). Cliquez encore pour continuer.');setTimeout(()=>{RK.guideArm=0;},5000);return;}
  RK.guideArm=0;try{svAuto('guide');}catch(_){}rkStartTutorial();
});
rkAdvLabel();
function rkIntroRow(){
  const L=svLatest();
  return pgBandHTML()+'<div class="row" style="margin-bottom:6px">'+(L?'<button class="btn" id="o-cont" title="Reprendre la dernière sauvegarde">Continuer · '+esc(L.o.meta.name)+' <small>('+svFmt(L.o.meta.date)+')</small></button>':'')+'<button class="btn" id="o-saves">Sauvegardes</button><button class="btn" id="o-guide">Guide interactif (rejouable)</button></div>';
}
function rkIntroBind(){
  try{pgIntroRules();}catch(_){}
  const c=$('#o-cont');if(c)c.addEventListener('click',()=>{const L=svLatest();if(!L){toast('Aucune sauvegarde.');return;}const m=svRestore(L.o);if(m){toast(m);showIntro();}else toast('Partie chargée : '+L.o.meta.name);});
  $('#o-saves').addEventListener('click',svOpen);
  $('#o-guide').addEventListener('click',rkStartTutorial);
}

$('#z-25').addEventListener('click',r25Toggle);{const b=$('#z-25');b.classList.toggle('on',R25.on);b.setAttribute('aria-pressed',R25.on);}

/* aide affichée dans la salle d'attente en ligne */
function mpHelp(){
  const n=NET.room?NET.room.peers().length:0;
  return '<p class="note" style="margin:0 0 10px">Personnes connectées à cette salle : <b>'+n+'</b>.'+(n<2?' Si l’autre joueur n’apparaît pas : il doit être connecté à claude.ai, avoir été <b>invité sur cette page</b> avec son compte (Partager → son e-mail, droit d’interagir) et saisir exactement ce code. Un lien public seul ne permet pas de rejoindre.':'')+'</p>';
}
