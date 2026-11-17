/* Onglet Économie (Berrys, Villes, Techno), réorganisé.
   Mêmes calculs (rkEco, rkBuys, bRow, buildReason, mastCost) et mêmes actions (build, upcity, foundcity, tech, mast, sel).
   Principe : ce qui est faisable maintenant en premier ; ce qui est verrouillé ou plus tard est replié, sans rien retirer. */
const mqRes=p=>{const L=TLEN(),r=p.rate||{g:0,s:0,f:0};return {g:Math.floor(p.gold),s:Math.floor(p.sci),f:Math.floor(p.faith),sr:r.s*L,fr:r.f*L};};
/* ---------- Berrys ---------- */
function pEco(){
  const p=players[ME];if(!p||!p.x)return '';
  const E=rkEco(p),u=TUN(),L=TLEN(),net=E.net*L,R=mqRes(p),st=net>=.05?'pos':net<=-.05?'neg':'';
  let h='<div class="card mq"><section class="mqs first"><h4><em>1</em>Bilan</h4><div class="mqrow">'
    +mqNum(R.g+' ฿','Berrys','','Disponibles')+mqNum('<span class="'+st+'">'+sgn(net,1)+'</span>','Net / '+u,'','Revenu net par '+u)
    +mqNum(R.s,'Savoir','<span class="cs">◈</span>','Savoir disponible · '+sgn(R.sr,1)+' par '+u)+'</div>'
    +'<p class="note">Savoir '+sgn(R.sr,1)+' / '+u+' · Volonté <b>'+R.f+'</b> ('+sgn(R.fr,1)+' / '+u+')</p>'
    +(st==='neg'?'<p class="verdict neg">Tu perds des Berrys à chaque '+u+' : les unités autres que les Pirates coûtent un entretien. Construis un Port marchand ou réduis ton armée.</p>':'')+'</section>';
  /* d'où viennent les Berrys : une barre empilée, puis le détail replié */
  const src=[['Îles',E.isl,'#d9b45a'],['Spécialités',E.spec,'#c98f3c'],['Villes',E.city,'#e2903b'],['Capitale',E.cap,'#f2c75c'],['Bâtiments',E.bld,'#8fd16b'],['Bonus',Math.max(0,E.bonus),'#5aa0f5'],['Tribut reçu',E.tin,'#c58cf0']].filter(x=>x[1]>.0001);
  const tot=src.reduce((a,x)=>a+x[1],0)||1,out=E.up+E.tout;
  h+='<section class="mqs"><h4><em>2</em>D’où viennent tes Berrys</h4><div class="mqstack">'+src.map(x=>'<i style="width:'+(x[1]/tot*100).toFixed(1)+'%;background:'+x[2]+'" title="'+esc(x[0])+' '+sgn(x[1]*L,2)+'"></i>').join('')+'</div>'
    +'<div class="mqleg">'+src.map(x=>'<span><i style="background:'+x[2]+'"></i>'+esc(x[0])+' <b>'+sgn(x[1]*L,2)+'</b></span>').join('')+'</div>'
    +'<div class="mqline"><span>Dépenses (entretien'+(E.tout?', tribut':'')+')</span><b class="'+(out>0?'neg':'')+'">'+(out>0?'−'+f2(out*L):'0')+'</b></div>'
    +mqFold('ecodet','Détail ligne par ligne',
      ecoRow('Îles (production de base)',E.isl,'','Terrain de chaque île : plage, jungle, volcan')+(E.spec?ecoRow('Villages spécialisés',E.spec):'')
      +ecoRow('Villes et niveaux',E.city,'','Villes fondées et leurs niveaux')+(E.cap?ecoRow('Capitale',E.cap,'','Bonus de votre capitale'):'')
      +(E.bld?ecoRow('Bâtiments (Port marchand…)',E.bld):'')+ecoRow('Bonus (techno, camp, commerce, héritage)',E.bonus,E.bonus>=0?'':'neg')
      +(E.tin?ecoRow('Tribut reçu de vos vassaux',E.tin,'pos'):'')
      +ecoRow('Entretien des unités',-E.up,E.up>0?'neg':'','Chaque unité autre que Pirate coûte '+UPKEEP+' ฿/s de jeu (soit '+(UPKEEP/PK*L).toFixed(2).replace('.',',')+' ฿ par '+u+')')
      +(E.tout?ecoRow('Tribut versé à votre suzerain',-E.tout,'neg'):'')
      +'<div class="er tot '+st+'"><span>Net par '+u+'</span><b>'+sgn(net,2)+' ฿</b></div>'
      +'<p class="note">'+(TM.on?'Un tour dure '+TURN_LEN+' s de jeu : les Berrys tombent pendant la résolution.':'Valeurs par minute de jeu.')+' Recruter, construire et agrandir coûtent des Berrys une fois ; les technologies coûtent du Savoir.</p>')+'</section>';
  /* que faire de ses Berrys */
  const buys=rkBuys(p);
  h+='<section class="mqs"><h4><em>3</em>Que faire de tes Berrys ?</h4>'
    +(buys.length?buys.map(b=>'<div class="mqbuy"><div><b>'+esc(b.n)+'</b><small>'+esc(b.why)+'</small></div><span class="mqeta'+(p.gold>=b.c?' ok':'')+'">'+b.c+' ฿ · '+b.eta+'</span></div>').join(''):'<p class="note">Rien à prévoir pour l’instant.</p>')
    +mqFold('ecotop','Îles qui rapportent le plus',E.per.slice(0,5).map(o=>'<div class="mqline"><span>'+esc(o.t.name)+(o.t.capital?' · capitale':o.t.city?' · ville '+o.t.city.lvl:'')+'</span><b>'+sgn(o.g*L,2)+' '+btn('sel',o.t.id,'Voir',false)+'</b></div>').join('')+'<p class="note">Les îles qui rapportent peu gagnent à devenir des villes (Villes → fonder).</p>')
    +(RK.rec.length?mqFold('ecorec','Dernières conquêtes ('+RK.rec.length+')',RK.rec.slice().reverse().map(r=>'<div class="lr"><b>'+esc(r.tn)+'</b><small>'+r.line+'</small>'+btn('sel',r.id,'Voir',false)+'</div>').join('')):'')
    +'</section></div>';
  return h;
}
/* ---------- Villes ---------- */
function pCity(){
  const p=players[ME],mine=terrs.filter(x=>x.owner===ME&&x.city);
  let t=ui.sel>=0?terrs[ui.sel]:null;
  if((!t||t.owner!==ME||!t.city)&&mine.length&&!(t&&t.owner===ME))t=mine.find(x=>x.capital)||mine[0];
  /* sélecteur de villes : une rangée de pastilles au lieu d'une liste en bas */
  const pick=mine.length<2?'':'<div class="mqpick">'+mine.map(x=>'<button data-act="sel" data-v="'+x.id+'" class="'+(t&&x.id===t.id?'on':'')+'">'+esc(x.name)+(x.capital?' ★':'')+' <small>niv. '+x.city.lvl+' · '+(slotsOf(x)-usedSlots(x))+' libre'+(slotsOf(x)-usedSlots(x)>1?'s':'')+'</small></button>').join('')+'</div>';
  if(!t||t.owner!==ME){return '<div class="card mq">'+pick+'<p class="note">Sélectionnez une de vos villes.</p></div>';}
  if(!t.city){
    return '<div class="card mq">'+pick+'<section class="mqs first"><h4><em>1</em>'+esc(t.name)+'</h4><p class="note">Pas de ville ici. Une ville donne des emplacements de bâtiments, plus de revenus et une défense accrue.</p>'
      +btn('foundcity',t.id,'Fonder une ville · '+CITY_COST+' ฿ + '+CITY_UNITS+' pirates',p.gold<CITY_COST||t.u.guerrier<CITY_UNITS||tr(t)-CITY_UNITS<1,'wide')+'</section></div>';
  }
  const c=t.city,used=usedSlots(t),tot=slotsOf(t),upc=CITY_UP*c.lvl;
  let h='<div class="card mq">'+pick+'<section class="mqs first"><h4><em>1</em>'+esc(t.name)+' · niveau '+c.lvl+'</h4>'
    +'<div class="mqline"><span>Emplacements</span><b>'+c.b.length+' construit'+(c.b.length>1?'s':'')+' · '+(tot-used)+' libre'+(tot-used>1?'s':'')+' / '+tot+'</b></div>'
    +'<div class="mqslots">'+Array.from({length:tot},(_,k)=>{const b=c.b[k];if(b){const d=defOfBuild(b);return '<span class="sl on" title="'+esc(d.n)+'">'+bico(b.startsWith('w:')?'wonder':b)+'</span>';}
      if(k===c.b.length&&c.q)return '<span class="sl q" title="En construction : '+esc(defOfBuild(c.q.id).n)+'"><i style="height:'+Math.round(c.q.t/c.q.dur*100)+'%"></i></span>';return '<span class="sl" title="Place libre"></span>';}).join('')+'</div>'
    +(c.b.length?'<p class="note">'+c.b.map(b=>esc(defOfBuild(b).n)).join(' · ')+'</p>':'')
    +(c.q?'<div class="mqline"><span>En construction : '+esc(defOfBuild(c.q.id).n)+'</span><b>'+Math.ceil(c.q.dur-c.q.t)+' s</b></div>':'')
    +(c.lvl<3?'<div class="mqact"><div><b>Agrandir la ville</b><small>Niveau '+(c.lvl+1)+' : +1 emplacement, revenus ×'+String(1+.35*c.lvl).replace('.',',')+'</small></div>'+btn('upcity',t.id,upc+' ฿',p.gold<upc)+'</div>':'<p class="note">Niveau maximal atteint.</p>')+'</section>';
  /* bâtiments : constructibles d'abord, les verrouillés repliés avec leur condition */
  const ids=Object.keys(BUILDINGS).filter(id=>!hasB(t,id)&&(!BUILDINGS[id].up||c.b.includes(BUILDINGS[id].up)||!famOf(id).slice(famOf(id).indexOf(id)).some(z=>c.b.includes(z))));
  const lockedB=id=>{const r=buildReason(p,t,id,true);return !!r&&(r.startsWith('Techno')||r.startsWith('Nécessite'));};
  const okB=ids.filter(id=>!lockedB(id)),noB=ids.filter(lockedB);
  h+='<section class="mqs"><h4><em>2</em>Construire ici</h4>'+(okB.length?okB.map(id=>bRow(p,t,id,'b')).join(''):'<p class="note">Aucun bâtiment débloqué : achète une technologie (Techno).</p>')
    +(noB.length?mqFold('bLock','Verrouillés ('+noB.length+')',noB.map(id=>{const d=BUILDINGS[id];return '<div class="mqline lk"><span>'+bico(id)+' '+esc(d.n)+' <small>'+esc(bDesc(id,p))+'</small></span><b>'+(d.tech&&!p.techs[d.tech]?'◈ '+esc(TECH[d.tech].n):'')+(d.up&&!c.b.includes(d.up)?' · après '+esc(BUILDINGS[d.up].n):'')+(d.haki?' · Haki rang '+d.haki:'')+'</b></div>';}).join('')):'')+'</section>';
  /* lieux légendaires */
  const W=WONDERS.map(w=>({w,ow:wonderOwner(w.id),bd:wonderBuilding(w.id),lk:lockedB('w:'+w.id)}));
  const wOk=W.filter(x=>x.ow===null&&!x.lk&&!x.bd);
  h+='<section class="mqs"><h4><em>3</em>Lieux légendaires</h4>'+(wOk.length?wOk.map(x=>bRow(p,t,x.w.id,'w')).join(''):'<p class="note">Aucun lieu constructible maintenant.</p>')
    +mqFold('wAll','Tous les lieux ('+W.length+')',W.filter(x=>!wOk.includes(x)).map(x=>'<div class="mqline lk"><span>★ '+esc(x.w.n)+' <small>'+esc(x.w.d)+'</small></span><b>'+(x.ow!==null?esc(players[x.ow].name):x.bd?'en cours ailleurs':x.w.tech?'◈ '+esc(TECH[x.w.tech].n):'')+'</b></div>').join('')+'<p class="note">Un seul exemplaire de chaque lieu dans le monde. Il appartient à celui qui tient la ville.</p>')+'</section></div>';
  return h;
}
/* ---------- Techno ---------- */
function pTech(){
  const p=players[ME],R=mqRes(p),u=TUN();
  const st=t=>{const owned=!!p.techs[t.id],ready=t.req.every(r=>p.techs[r]),late=t.era>AG.n+1;return owned?'own':ready&&!late?'ok':'lock';};
  const eta=c=>p.sci>=c?'maintenant':R.sr>.01?'dans ≈ '+Math.ceil((c-p.sci)/R.sr)+' '+u+(Math.ceil((c-p.sci)/R.sr)>1&&TM.on?'s':''):'—';
  const row=t=>'<div class="mqu"><b>'+esc(t.n)+' <small class="mqbr">'+esc(t.br)+'</small></b><small>'+esc(t.d)+'</small>'+btn('tech',t.id,t.cost+' ◈',p.sci<t.cost)+'</div>';
  const ok=TECHS.filter(t=>st(t)==='ok').sort((a,b)=>a.cost-b.cost),own=TECHS.filter(t=>st(t)==='own'),lk=TECHS.filter(t=>st(t)==='lock');
  let h='<div class="card mq"><section class="mqs first"><h4><em>1</em>Savoir</h4><div class="mqrow">'+mqNum(R.s,'Disponible','<span class="cs">◈</span>')+mqNum(sgn(R.sr,1),'Par '+u,'')+mqNum(own.length+' / '+TECHS.length,'Découvertes','')+'</div>'
    +(ok.length?'<p class="note">Prochaine abordable : <b>'+esc(ok[0].n)+'</b> ('+ok[0].cost+' ◈) — '+eta(ok[0].cost)+'.</p>':'')+'</section>';
  h+='<section class="mqs"><h4><em>2</em>Disponibles maintenant ('+ok.length+')</h4>'+(ok.length?ok.map(row).join(''):'<p class="note">Rien de disponible : attends l’âge suivant ou découvre les prérequis.</p>')+'</section>';
  h+='<section class="mqs"><h4><em>3</em>Ton arbre</h4>'
    +(own.length?mqFold('tOwn','Découvertes ('+own.length+') · maîtrise',own.map(t=>{const m=!!p.x.ma[t.id];return '<div class="mqu"><b>'+esc(t.n)+(m?' ✦':'')+'</b><small>'+esc(t.d)+(m?' Maîtrisée : effets +50 %.':'')+'</small>'+(m?'':btn('mast',t.id,'Maîtrise '+mastCost(t)+' ◈',p.sci<mastCost(t)))+'</div>';}).join('')+'<p class="note">Maîtriser (coût ×1,5) donne +50 % aux effets.</p>'):'')
    +BRANCHES.map(br=>{const L=lk.filter(t=>t.br===br);if(!L.length)return '';return mqFold('tL'+br,'Plus tard · '+esc(br)+' ('+L.length+')',L.map(t=>{const miss=t.req.filter(r=>!p.techs[r]).map(r=>TECH[r].n),late=t.era>AG.n+1;
      return '<div class="mqline lk"><span>'+esc(t.n)+' <small>'+esc(t.d)+'</small></span><b>'+(late?'⌛ '+esc(AGES[t.era-1].n):'')+(miss.length?(late?' · ':'')+'requiert '+esc(miss.join(', ')):'')+'</b></div>';}).join(''));}).join('')
    +'<p class="note">Chaque âge ouvre ses technologies ; tes technologies restent secrètes pour les autres camps.</p></section></div>';
  return h;
}
