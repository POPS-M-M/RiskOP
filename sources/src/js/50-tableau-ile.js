/* Tableau de bord de l'île (onglet « Île »).
   Règles : mêmes valeurs que la fiche actuelle (mêmes fonctions de calcul), mêmes actions (data-act déjà existants :
   recruit, fort, pct, stance, cpost, foundcity, spec, annex, tab). Aucune mécanique nouvelle, aucune deuxième façon d'agir.
   Organisation autour de trois questions : 1. Dans quel état est l'île ? 2. Que puis-je faire ? 3. Atouts et faiblesses. */
RK.mq=RK.mq||{open:{},sel:-1};
const mqNum=(v,l,ic,tip,cls)=>'<div class="mqn'+(cls?' '+cls:'')+'" title="'+esc(tip||l)+'"><b>'+(ic?'<i>'+ic+'</i>':'')+v+'</b><span>'+l+'</span></div>';
const mqFr=x=>String(x).replace('.',',');
function mqFold(k,label,body,def){
  const o=k in RK.mq.open?RK.mq.open[k]:!!def;
  return '<div class="mqf"><button class="mqfh" data-act="mqx" data-v="'+k+'" aria-expanded="'+o+'">'+label+'<span>'+(o?'▴':'▾')+'</span></button>'+(o?'<div class="mqfb">'+body+'</div>':'')+'</div>';
}
function mqSec(n,title,body){return '<section class="mqs"><h4><em>'+n+'</em>'+title+'</h4>'+body+'</section>';}
/* voisins : ce que montre déjà la carte (chiffre sur chaque île), regroupé */
function mqNeighbors(t){
  const own=t.owner,o=[];
  for(const q of t.nb){const x=terrs[q];if(x.owner===own)continue;o.push({x,n:Math.floor(tr(x)),war:own>=0&&x.owner>=0&&isWar(own,x.owner),neu:x.owner<0});}
  return o.sort((a,b)=>b.n-a.n);
}
function terrSheet(t){
  const p=players[ME],own=t.owner>=0?players[t.owner]:null,ty=TYPES[t.type],R=regs.find(r=>r.ids.includes(t.id)),mine=t.owner===ME;
  const col=own?own.color:'#8d8672',tn=Math.floor(tr(t));
  const ownName=own?esc(own.name==='Votre camp'?CREWS[own.crew||0].n:own.name):'Indépendante';
  const enter=RK.mq.sel!==t.id;RK.mq.sel=t.id;
  const dm=ty.def*fortOf(t);
  /* ---------- en-tête ---------- */
  let h='<div class="card sheet mq'+(enter?' mqin':'')+'" style="--c:'+col+'"><div class="sh-art mqart">'+islandArt(t)
    +'<div class="sh-ban"><span class="sw" style="background:'+col+'"></span><b>'+esc(t.name)+'</b>'+(t.capital?'<span class="tag">Capitale</span>':'')+'</div></div>'
    +'<p class="mqid">'+ownName+' · '+esc(ty.n)+(R?' · '+esc(R.n):'')+(t.city?' · Ville niv. '+t.city.lvl:t.spec?' · Village '+esc(SPECS[t.spec]):' · Village')
    +(own&&!mine&&isWar(ME,t.owner)?' · <b class="ko">En guerre</b>':'')+'</p>';
  /* alertes d'état (déjà visibles sur la carte, regroupées ici) */
  const inc=armies.filter(a=>a.to===t.id&&a.owner!==t.owner&&(t.owner<0||isWar(a.owner,t.owner)||a.owner===ME));
  const alerts=[];
  if(t.fo>time)alerts.push('<span class="mqal ok">🛡 Fortifiée ×'+mqFr(t.fm||FORT_MUL)+' · '+Math.ceil(t.fo-time)+' s</span>');
  if(mine&&inc.length)alerts.push('<span class="mqal ko">⚠ '+inc.length+' armée'+(inc.length>1?'s':'')+' en approche</span>');
  if(mine&&t.city&&t.city.q)alerts.push('<span class="mqal">⌂ Construction en cours</span>');
  if(alerts.length)h+='<div class="mqals">'+alerts.join('')+'</div>';

  /* ---------- 1. ÉTAT ---------- */
  let s1='<div class="mqsub">Militaire · <b>'+tn+'</b> troupes <small>('+compText(t.u)+')</small></div><div class="mqrow">';
  if(mine){
    const dP=Math.round(powerOf(t.u,ZERO_U(),'def')*Math.max(.3,1+p.mod.def)*dm),aP=Math.round(powerOf(t.u,ZERO_U(),'atk')*(1+p.mod.atk));
    s1+=mqNum(dP,'Défense','🛡','Défense des unités × bonus du camp × terrain × fortifications')+mqNum(aP,'Attaque','⚔','Attaque des unités × bonus du camp');
  }else s1+=mqNum(tn,'Garnison','⚑','Chiffre affiché sur la carte');
  s1+=mqNum('×'+mqFr(dm.toFixed(2)),'Terrain','⛰','Terrain '+ty.n+' × fortification')+'</div>';
  s1+=bossSheet(t);
  if(mine){
    const pr=tProd(t,p),L=TLEN(),U=TUN();
    s1+='<div class="mqsub">Production par '+U+'</div><div class="mqrow">'
      +mqNum('+'+mqFr(f2(pr.g*L)),'Berrys','<span class="cg">฿</span>','Berrys par '+U)
      +mqNum('+'+mqFr(f2(pr.s*L)),'Savoir','<span class="cs">◈</span>','Savoir par '+U)
      +mqNum('+'+mqFr(f2(pr.f*L)),'Volonté','<span class="cf">✹</span>','Volonté par '+U)+'</div>';
    s1+=mqFold('prod','Détail des sources',
      '<p class="note">Terrain'+(t.city?' + ville niv. '+t.city.lvl:'')+(t.capital?' + capitale':'')+(t.spec&&!t.city?' + spécialité '+SPECS[t.spec]:'')+(t.city&&t.city.b.some(b=>BLD_INCOME[b])?' + bâtiments':'')+', au rythme de la partie, bonus de votre camp inclus.</p>');
  }else{
    const mx=.3,bar=(v,c,l)=>'<div class="pot" title="'+l+'"><span>'+l+'</span><div><i style="width:'+Math.round(v/mx*100)+'%;background:'+c+'"></i></div></div>';
    s1+=mqFold('pot','Potentiel du terrain',bar(ty.g,'var(--c-gold)','Berrys')+bar(ty.s,'var(--c-sci)','Savoir')+bar(ty.f,'var(--c-faith,#c58cf0)','Volonté')+'<p class="note">La production réelle n’est visible que sur vos îles.</p>');
  }
  h+=mqSec(1,'État',s1);

  /* ---------- 2. QUE FAIRE ---------- */
  let s2='';
  if(mine){
    /* fortifier */
    if(!(t.fo>time)){const fc=fortCost(t,p);s2+='<div class="mqact"><div><b>Fortifier</b><small>Défense ×'+mqFr(fortMul(p))+' pendant '+Math.round(fortDur(p))+' s</small></div>'+btn('fort',t.id,'🛡 '+fc+' ฿',p.gold<fc)+'</div>';}
    /* recruter : seulement les unités disponibles ; les autres repliées */
    const okU=UK.filter(k=>unitOK(p,k)),noU=UK.filter(k=>!unitOK(p,k));
    s2+='<div class="mqsub">Recruter</div><div class="mqrec">'+okU.map(k=>{const U=UNITS[k],c=recruitCost(p,t,k);
      return '<div class="mqu'+(ui.flash&&ui.flash.key==='u:'+k&&performance.now()<ui.flash.until?' flash':'')+'" title="'+esc(U.pl+' — '+U.d)+'"><b>'+U.pl+'</b><small>Att. '+U.atk+' · Déf. '+U.def+' · Vit. '+U.spd+'</small>'+btn('recruit',k,'+'+U.batch+' · '+c+' ฿',p.gold<c)+'</div>';}).join('')+'</div>';
    if(noU.length)s2+=mqFold('lockU','Unités verrouillées ('+noU.length+')',noU.map(k=>'<div class="mqu locked"><b>'+UNITS[k].pl+'</b><small>Requiert '+TECH[UNITS[k].tech].n+'</small></div>').join(''));
    /* envoyer : même réglage que la carte « Envoyer des troupes » */
    s2+='<div class="mqsub">Envoyer depuis cette île</div><div class="segs">'+[25,50,75,100].map(v=>btn('pct',v/100,v+' %',false,Math.round(ui.pct*100)===v?'on':'')).join('')+'</div>'
      +'<p class="note">Cliquez une île voisine ou glissez vers elle : <b>'+Math.round(ui.pct*100)+' %</b> de la garnison part.</p>'
      +mqFold('stance','Posture au départ (avancé)','<div class="segs">'+STANCE.map((z,i)=>btn('stance',i,z.ic+' '+z.n,false,(ui.stance|0)===i?'on':'')).join('')+'</div><p class="note">'+STANCE[ui.stance|0].t+'</p>');
    /* accès directs (navigation vers l'écran existant, l'île reste sélectionnée) */
    s2+='<div class="mqquick">'+(t.city?btn('tab','city','⌂ Construire',false):'')+btn('tab','leg','♛ Équipe',false)+'</div>';
    if(!t.city&&!t.spec)s2+=btn('foundcity',t.id,'Fonder une ville · '+CITY_COST+' ฿ + '+CITY_UNITS+' pirates',p.gold<CITY_COST||t.u.guerrier<CITY_UNITS||tr(t)-CITY_UNITS<1,'wide');
    if(!t.city&&!t.capital&&!t.spec)s2+=mqFold('spec','Spécialiser ce village · '+SPEC_COST+' ฿','<p class="note">Définitif : le village renonce à devenir une ville et se consacre à une ressource.</p><div class="spc">'+Object.keys(SPECS).map(r=>btn('spec',t.id+':'+r,SPECS[r],p.gold<SPEC_COST)).join('')+'</div>');
  }else{
    const near=t.nb.some(q=>terrs[q].owner===ME);
    if(t.owner<0){const why=annexReason(p,t);s2+=btn('annex',t.id,'Envoyer une ambassade · '+annexCost(t)+' ⚜',!!why,'wide')+'<p class="note">'+(why||'Gagne l’île sans combat ; une ambassade toutes les '+fmtDur(25*PK)+'.')+'</p>';}
    s2+='<p class="note">'+(near?'À portée : sélectionnez votre île voisine puis cliquez ici, ou glissez depuis elle.':'Hors de portée : prenez d’abord une île voisine.')+'</p>';
  }
  h+=mqSec(2,mine?'Que faire ?':'Que puis-je faire ?',s2);

  /* ---------- 3. ATOUTS ET FAIBLESSES ---------- */
  let s3='';
  /* développement */
  if(t.city){
    const used=usedSlots(t),tot=slotsOf(t),built=t.city.b.length;
    s3+='<div class="mqline"><span>⌂ Bâtiments</span><b>'+built+' construit'+(built>1?'s':'')+' · '+(tot-used)+' place'+(tot-used>1?'s':'')+' libre'+(tot-used>1?'s':'')+' / '+tot+'</b></div>'
      +'<div class="mqslots">'+Array.from({length:tot},(_,k)=>{const b=t.city.b[k];if(b){const d=defOfBuild(b);return '<span class="sl on" title="'+esc(d.n+' — '+(b.startsWith('w:')?d.d:(mine?bDesc(b,p):d.d)))+'">'+bico(b.startsWith('w:')?'wonder':b)+'</span>';}
        if(k===built&&t.city.q)return '<span class="sl q" title="En construction : '+esc(defOfBuild(t.city.q.id).n)+'"><i style="height:'+Math.round(t.city.q.t/t.city.q.dur*100)+'%"></i></span>';return '<span class="sl" title="Place libre"></span>';}).join('')+'</div>';
  }
  /* lieutenant : affectation directe (action existante cpost) */
  const li=ltAt(t.id);
  if(li>=0){const L=LEGENDS[li],M=chMeta(li),Rr=RAR[M.r];
    s3+='<div class="mqline"><span>♛ Lieutenant</span><b style="color:'+Rr.col+'">'+esc(L.s)+'</b></div><p class="note">'+leadText(li)+'.</p>'+(mine?btn('cpost',li+':-1','Retirer du poste',false):'');}
  else if(mine){
    const free=chOwnedBy(ME).filter(i=>chIsActive(ME,i)&&CH[i].post!==t.id);
    s3+='<div class="mqline"><span>♛ Lieutenant</span><b class="muted">Aucun</b></div>'
      +(free.length?'<div class="mqquick">'+free.map(i=>btn('cpost',i+':'+t.id,'Affecter '+esc(LEGENDS[i].s)+(CH[i].post>=0?' (quitte '+esc(terrs[CH[i].post].name)+')':''),false)).join('')+'</div>':'<p class="note">Aucun commandant disponible : recrutez-en un (Équipe).</p>');
  }
  /* contrôle régional : verrouillé tant que la région n'est pas complète */
  if(R&&R.fx){
    const held=t.owner>=0?R.ids.filter(i=>terrs[i].owner===t.owner).length:0,all=R.ids.length,on=t.owner>=0&&held===all;
    s3+='<div class="mqline"><span>◎ Région '+esc(R.n)+'</span><b>'+held+' / '+all+'</b></div><div class="mqbar"><i style="width:'+Math.round(held/all*100)+'%"></i></div>'
      +'<p class="note mqreg '+(on?'on':'off')+'">'+(on?'✓ Bonus actif':'🔒 Bonus verrouillé, il manque '+(all-held)+' île'+(all-held>1?'s':''))+' : '+fxText(R.fx)+'.</p>';
  }
  /* bonus propres à l'île */
  const bon=[];
  if(ISLE_FX[t.name])bon.push('<div class="bn"><b>✦ Île célèbre</b><small>'+fxText(ISLE_FX[t.name].fx)+'. '+esc(ISLE_FX[t.name].w)+'</small></div>');
  if(t.fruit)bon.push('<div class="bn"><b>Fruit '+FRUITS[t.fruit].n+'</b><small>'+FRUITS[t.fruit].d+'.</small></div>');
  if(t.pone)bon.push(poneBon(t));
  if(t.city)for(const b of t.city.b)if(b.startsWith('w:'))bon.push('<div class="bn"><b>★ '+esc(WONDER[b.slice(2)].n)+'</b><small>'+WONDER[b.slice(2)].d+'</small></div>');
  if(bon.length)s3+=bon.join('');
  /* faiblesses : uniquement ce que la carte montre déjà, regroupé */
  const nb=mqNeighbors(t),weak=[];
  if(t.owner>=0){
    const th=nb.filter(z=>!z.neu&&(z.war||t.owner<0));const big=nb.filter(z=>!z.neu).sort((a,b)=>b.n-a.n)[0];
    if(big&&big.n>tn)weak.push('Voisin plus garni : <b>'+esc(big.x.name)+'</b> ('+big.n+' contre '+tn+')'+(big.war?', en guerre':'')+'.');
    if(th.length)weak.push(th.length+' voisin'+(th.length>1?'s':'')+' en guerre contre ce camp.');
  }
  if(dm<=1)weak.push('Terrain peu défensif (×'+mqFr(dm.toFixed(2))+'), pas de muraille.');
  const fr=nb.length;
  s3+='<div class="mqline"><span>⚠ Points faibles</span><b>'+(weak.length?weak.length:'aucun repéré')+'</b></div>'+(weak.length?'<ul class="mqw">'+weak.map(w=>'<li>'+w+'</li>').join('')+'</ul>':'')
    +'<p class="note">'+fr+' voisin'+(fr>1?'s':'')+' d’un autre camp ou neutres'+(fr?' : '+nb.slice(0,4).map(z=>esc(z.x.name)+' '+z.n).join(', ')+(fr>4?'…':''):'')+'.</p>';
  h+=mqSec(3,'Atouts et faiblesses',s3);
  return h+'</div>';
}
/* l'onglet Île commence par l'île sélectionnée ; le conseil passe dessous */
function pArmy2(){
  const p=players[ME],t=ui.sel>=0?terrs[ui.sel]:null,m=p.mod,cw=CREWS[p.crew||0];
  let nT=0,trp=0;for(const x of terrs)if(x.owner===ME){nT++;trp+=tr(x);}
  const mvN=armies.filter(a=>a.owner===ME).reduce((s,a)=>s+Math.floor(sumU(a.u)),0);
  return campCard()+(t?terrSheet(t)+adviceCard():adviceCard()+'<div class="card"><h3>Territoire</h3><p class="muted">Cliquez une île pour afficher son tableau de bord : état, actions possibles, atouts et faiblesses.</p></div>')
    +(!t||t.owner!==ME?'<div class="card"><h3>Envoyer des troupes</h3><div class="segs">'+[25,50,75,100].map(v=>btn('pct',v/100,v+' %',false,Math.round(ui.pct*100)===v?'on':'')).join('')+'</div><p class="note" style="margin-top:8px">Sélectionnez une de vos îles puis cliquez un voisin, ou glissez de l’une à l’autre.</p></div>':'')
    +seaCard()
    +'<div class="card"><details><summary class="note" style="cursor:pointer"><b>Votre camp : '+cw.ic+' '+cw.n+'</b> · '+nT+' îles · '+Math.floor(trp)+' troupes</summary><p class="note">'+cw.t+'</p>'
    +kv('Troupes en marche',mvN)+kv('Attaque','+'+Math.round(m.atk*100)+' %')+kv('Défense','+'+Math.round(m.def*100)+' %')+kv('Vitesse','+'+Math.round(m.spd*100)+' %')+kv('Votre prime',fmtPrime(primeOf(ME)))
    +(cw.hunt?(()=>{const pr=curPrimes(),h=huntTarget(ME,pr);return h>=0?'<p class="note">Prime à abattre : <b>'+players[h].name+'</b> ('+fmtPrime(pr[h])+').</p>':'';})():'')+'</details></div>';
}
/* sections repliables (état d'affichage seulement) */
document.getElementById('side').addEventListener('click',e=>{
  const b=e.target.closest('[data-act="mqx"]');if(!b)return;
  const k=b.dataset.v,cur=k in RK.mq.open?RK.mq.open[k]:false;RK.mq.open[k]=!cur;lastPanel='';renderPanel(true);
});
