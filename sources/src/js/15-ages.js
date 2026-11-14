/* ================= Transition d'âge : pourquoi / ce qui change / ce qui reste / choix / avantages et risques =================
   Audit : la mécanique d'âge est utile (rythme de la partie, crises, héritage) mais l'écran d'origine empilait camp + 18 options sans dire pourquoi.
   Simplification : le changement de camp devient un choix avancé replié (« Garder mon camp » par défaut) et un Choix conseillé est proposé. */
RK.txCamp=false;
const OPT_NOTE={g:'Avantage fort · aucun coût · un seul Âge d’or',d:'Gros bonus mais un malus · réservé à qui n’a atteint aucun jalon',l:'Petit bonus sûr'};
function rkAgeAdvice(me){
  const x=me.x,chosen=id=>x.nop.some(e=>e[0]===id);
  const gold=LOPTS.filter(o=>o.k==='g'&&optAvail(me,o)&&!chosen(o.id)&&x.gd[o.pi]);
  const hasG=x.nop.some(e=>LOPT[e[0]].k==='g');
  if(gold.length&&!hasG)return {id:gold[0].id,why:'Vous avez terminé cette voie : l’Âge d’or est gratuit et le plus fort des bonus.'};
  const war=players.some(q=>q.alive&&q.id!==me.id&&rel[me.id]&&rel[me.id][q.id]==='war');
  const net=rkEco(me).net;
  const want=war?['l_def','l_atk','l_rec','l_gold']:net<2?['l_gold','l_rec','l_def','l_atk']:['l_rec','l_gold','l_atk','l_def'];
  for(const id of want){const o=LOPT[id];if(!chosen(id)&&optPay(x,o)>=0)return {id,why:war?'Vous êtes en guerre : '+o.n.toLowerCase()+' sert tout de suite.':net<2?'Votre revenu est faible ('+sgn(net*TLEN())+' ฿/'+TUN()+') : '+o.n.toLowerCase()+' le relève.':'Pour continuer à recruter et conquérir : '+o.n.toLowerCase()+'.'};}
  return null;
}
function renderTModal(){
  const el=$('#tmodal');if(!el)return;
  const me=players[ME];
  const show=AG.trn&&started&&!over&&me&&me.alive;
  if(!show){if(!el.hidden){el.hidden=true;lastTM='';}return;}
  if(performance.now()<tmPressT)return;
  const x=me.x,A=AGES[AG.n],B=AGES[Math.min(2,AG.n+1)],done=!!AG.dn[ME];
  const wait=players.filter(p=>p.human&&p.alive&&!AG.dn[p.id]&&p.id!==ME).map(p=>esc(p.name));
  const want=AG.pick[ME]>=0?AG.pick[ME]:me.crew;
  const chosen=id=>x.nop.some(e=>e[0]===id);
  const adv=rkAgeAdvice(me);
  const row=o=>{
    const on=chosen(o.id);
    const ok=on||(o.k==='g'||o.k==='d'?optAvail(me,o):optPay(x,o)>=0);
    const cost=o.k==='l'?(o.pi===4?'coût : 2 points joker':'coût : 1 point '+PATHS[o.pi].n+' (ou 2 joker)'):'gratuit';
    return '<div class="opt'+(on?' on':'')+(o.k==='g'?' gold':o.k==='d'?' dark':'')+'"><b>'+o.n+(adv&&adv.id===o.id&&!on?' <span class="rar" style="border-color:var(--good);color:var(--good)">conseillé</span>':'')+'</b><small>'+o.d+' · '+cost+'</small><small>'+OPT_NOTE[o.k]+'</small><button data-ag="opt:'+o.id+'"'+((!ok&&!on)||done?' disabled':'')+'>'+(on?'Retirer':'Choisir')+'</button></div>';
  };
  const gold=LOPTS.filter(o=>o.k==='g'&&(x.gd[o.pi]||chosen(o.id))),dark=LOPTS.filter(o=>o.k==='d'&&(x.dk[o.pi]||chosen(o.id)));
  const nt=terrs.filter(t=>t.owner===ME).length,nb=Math.round(p0(me.gold));
  const pts=PATHS.map((P,i)=>x.lp[i]).reduce((a,b)=>a+b,0)+x.lp[4];
  let h='<div class="tpanel tx"><div><h2>L’âge '+A.n+' s’achève</h2><p class="lead" style="margin:0">Prochain âge : <b>'+B.n+'</b> — '+B.sub+'.</p></div>'
    +'<div class="blk"><h3>Pourquoi cette pause ?</h3><p class="note" style="margin:0">Chaque âge dure un temps fixe. À la fin, la partie fait le point : vos réussites de l’âge (jalons) deviennent des <b>points d’Héritage</b>, que vous dépensez ci-dessous pour renforcer l’âge suivant. Rien de ce que vous avez conquis n’est perdu.</p></div>'
    +'<div class="cols"><div class="blk"><h3>Ce qui change</h3><ul><li>Vos jalons repartent de zéro.</li><li>Les options d’Héritage de l’âge précédent expirent ; celles que vous choisissez ici durent tout l’âge suivant.</li><li>Les malus de crise sont levés.</li><li>Vous gagnez 1 point d’attribut.</li><li>De nouvelles technologies deviennent disponibles.</li></ul></div>'
    +'<div class="blk"><h3>Ce qui est conservé</h3><ul><li>Vos îles ('+nt+'), vos armées et vos '+nb+' ฿.</li><li>Vos technologies, attributs et maîtrises.</li><li>Vos lieutenants et leurs niveaux.</li><li>Vos relations et traités.</li></ul></div></div>'
    +'<div class="blk"><h3>Votre Héritage ('+pts+' point'+(pts>1?'s':'')+')</h3>'+PATHS.map((P,i)=>'<div class="kv"><span>'+P.ic+' '+P.n+'</span><b>'+optPips(x.mt[i])+(x.gd[i]?' · Âge d’or ouvert':x.dk[i]?' · Âge sombre ouvert':'')+'</b></div>').join('')
    +'<div class="lp">'+PATHS.map((P,i)=>'<span>'+P.ic+' '+x.lp[i]+'</span>').join('')+'<span>joker '+x.lp[4]+'</span></div></div>'
    +(!adv?'<div class="blk"><h3>Choix conseillé</h3><p class="note" style="margin:0">'+(pts?'Vos points ne suffisent pour aucune option restante : passez à l’âge suivant.':'Aucun point d’Héritage cet âge (aucun jalon atteint) : rien à choisir, passez à l’âge suivant. Pour le prochain âge, visez les jalons de l’onglet Âge.')+'</p></div>':'')
    +(adv?'<div class="blk" style="border-color:var(--good)"><h3 style="color:var(--good)">Choix conseillé</h3><p class="note" style="margin:0">'+esc(LOPT[adv.id].n)+' — '+esc(adv.why)+'</p>'+(chosen(adv.id)?'':'<button class="primary" data-ag="opt:'+adv.id+'"'+(done?' disabled':'')+'>Prendre le choix conseillé</button>')+'</div>':'')
    +'<div><h3>1. Options d’Héritage pour l’âge suivant</h3><div class="opts">'
    +(gold.length?gold.map(row).join(''):'<p class="note" style="margin:0">Âge d’or : terminez les 3 jalons d’une voie pour l’ouvrir (un seul choix).</p>')
    +(dark.length?dark.map(row).join(''):'')
    +LOPTS.filter(o=>o.k==='l').map(row).join('')
    +'</div></div>'
    +'<div><h3>2. Camp</h3>'+(RK.txCamp
      ?'<div class="tgrid">'+CREWS.map((c,i)=>'<button class="copt'+(want===i?' on':'')+'" data-ag="pick:'+i+'"'+(done?' disabled':'')+'><b>'+c.ic+' '+c.n+(me.crew===i?' (actuel)':'')+'</b><small>'+c.t+'</small></button>').join('')+'</div><p class="note">Changer de camp modifie votre trait et les lieutenants qui acceptent de vous suivre. Si deux joueurs visent le même, le meilleur score l’emporte.</p>'
      :'<p class="note" style="margin:0">Vous restez <b>'+CREWS[me.crew||0].ic+' '+CREWS[me.crew||0].n+'</b> (recommandé : changer de camp ne rapporte presque rien et brouille vos lieutenants). <button data-ag="camp:1">Changer de camp</button></p>')+'</div>'
    +'<div class="tbar"><span class="note" style="margin:0">'+(done?'<b>Prêt.</b> ':'')+(wait.length?'En attente de : '+wait.join(', ')+'. ':'')+'Temps restant : <b id="tm-left">'+Math.ceil(AG.left)+'</b> s (sans choix, l’âge suivant démarre sans option).</span><button class="primary" data-ag="done"'+(done?' disabled':'')+'>Passer à l’âge suivant</button></div></div>';
  if(h!==lastTM){el.innerHTML=h;lastTM=h;}
  el.hidden=false;
  const tl=$('#tm-left');if(tl)tl.textContent=Math.ceil(AG.left);
}
const p0=v=>isFinite(v)?v:0;
$('#tmodal').addEventListener('click',e=>{
  const b=e.target.closest('[data-ag="camp:1"]');if(!b)return;
  RK.txCamp=true;lastTM='';renderTModal();
},true);
