/* ---------- butin de conquête ---------- */
function rkSnap(pid){const p=players[pid];return {net:rkEco(p).net*TLEN(),n:terrs.filter(t=>t.owner===pid).length};}
function rkRecap(s0,t,a,prev,note){
  const p=players[a.owner],E=rkEco(p),Z=TLEN()/PK,u=TUN();
  const mult=E.mult;
  const g=terrInc(t)[0]*mult*Z,sv=terrInc(t)[1]*(1+p.mod.sci)*p.inc*Z,fv=terrInc(t)[2]*(1+p.mod.faith)*p.inc*Z;
  const notes=[];
  if(t.capital)notes.push('Capitale ennemie prise : '+(prev>=0?esc(cname(players[prev])):'')+' perd son cœur économique.');
  if(t.fruit)notes.push('Fruit '+FRUITS[t.fruit].n+' : '+FRUITS[t.fruit].d+'.');
  if(t.pone)notes.push('Poneglyphe de Route : 1 des 4 (2 requis pour l’Expédition à Laugh Tale).');
  if(ISLE_FX[t.name])notes.push('Île célèbre : '+fxText(ISLE_FX[t.name].fx)+'.');
  const R=regs.find(r=>r.ids.includes(t.id));
  if(R){const held=R.ids.filter(i=>terrs[i].owner===a.owner).length;notes.push('Région '+esc(R.n)+' : '+held+' / '+R.ids.length+(held===R.ids.length?' — bonus actif ('+fxText(R.fx)+')':'')+'.');}
  if(t.city)notes.push('Ville niveau '+t.city.lvl+' conservée.');
  if(CREWS[p.crew||0].hunt&&prev>=0&&prev===huntTarget(a.owner))notes.push('Prime : +'+HUNT_GOLD+' ฿.');
  try{const me=p.x.me[0],th=PATHS[0].th[AG.n],mt=p.x.mt[0];if(mt<3)notes.push('Voie Militaire : '+Math.floor(me)+' / '+th[mt]+' conquêtes.');}catch(_){}
  const threats=t.nb.map(i=>terrs[i]).filter(x=>x.owner>=0&&x.owner!==a.owner&&isWar(a.owner,x.owner)).map(x=>esc(x.name)+' ('+esc(cname(players[x.owner]))+', '+Math.floor(tr(x))+')');
  const net1=E.net*TLEN();
  const r={id:t.id,tn:t.name,g:g,s:sv,f:fv,net0:s0?s0.net:net1-g,net1:net1,troops:Math.floor(tr(t)),notes:notes,threats:threats,
    line:sgn(g,2)+' ฿/'+u+' · '+Math.floor(tr(t))+' troupes'};
  RK.rec.push(r);if(RK.rec.length>8)RK.rec.shift();
  return r;
}
function rkRecapHTML(r){
  if(!r)return '';
  const u=TUN();
  return '<div class="rc"><b>Butin de '+esc(r.tn)+'</b>'
   +'<span class="g">+'+r.g.toFixed(2).replace('.',',')+' ฿ par '+u+(r.s>=.005?' · +'+r.s.toFixed(2).replace('.',',')+' savoir':'')+(r.f>=.005?' · +'+r.f.toFixed(2).replace('.',',')+' volonté':'')+'</span>'
   +'<span>Revenu net : '+sgn(r.net0,1)+' → <b>'+sgn(r.net1,1)+' ฿/'+u+'</b> · garnison conquérante : '+r.troops+'</span>'
   +r.notes.map(n=>'<span>• '+n+'</span>').join('')
   +(r.threats.length?'<span style="color:#ff9a8f">⚠ Voisins hostiles : '+r.threats.join(', ')+'. Pensez à renforcer.</span>':'')+'</div>';
}
/* ---------- boss : objectif facultatif expliqué ---------- */
function rkBossGold(b,p){
  const base=Math.max(10,Math.round(b.rew.gold*PK/6));
  if(!p)return base;
  return Math.max(base,Math.round(rkEco(p).net*TURN_LEN*10));
}
function rkBossSim(i,A){
  const b=BOSSES[i],st=BS[i];let hp=st.hp,S=A;
  for(let r=0;r<8&&S>0&&hp>0.01;r++){const ph=b.ph[bossPhaseIdx(b,hp)];hp-=Math.min(hp,S/8);if(hp>0.01)S-=b.pw*ph.dm/8+S*ph.bn;}
  return hp<=0.01;
}
function rkBossNeed(i){let lo=5,hi=6000;if(!rkBossSim(i,hi))return Infinity;while(hi-lo>1){const m=(lo+hi)>>1;if(rkBossSim(i,m))hi=m;else lo=m;}return hi;}
function bossSheet(t){
  if(t.boss===undefined||!BS[t.boss])return '';
  const i=t.boss,b=BOSSES[i],st=BS[i],p=players[ME];
  let h='<h4>☠ Objectif facultatif : '+esc(b.n)+'</h4>';
  if(st.dead)return h+'<p class="note">Vaincu'+(st.by>=0?' par '+esc(players[st.by].name):'')+'. Trophée : '+esc(b.rew.nm)+' ('+fxText2(b.rew.fx)+').</p>';
  const ph=bossPhaseIdx(b,st.hp),g=rkBossGold(b,p),need=rkBossNeed(i);
  let best=0,bf=null;
  for(const n of t.nb){const o=terrs[n];if(o.owner!==ME)continue;const A=attTotal(ME,o.u,t,true,o.id,undefined,0);if(A>best){best=A;bf=o;}}
  const ratio=need===Infinity?0:best/need;
  const verdict=need===Infinity?'Hors de portée.':!bf?'Aucune de vos îles n’est voisine : prenez d’abord une île adjacente.':ratio>=1.15?'<b style="color:var(--good)">Réalisable maintenant</b> avec l’armée de '+esc(bf.name)+'.':ratio>=.7?'<b style="color:#f2c75c">Presque</b> : rassemblez plus de troupes (ou affectez un lieutenant) avant d’attaquer.':'<b style="color:#ff9a8f">Trop tôt</b> : il vous faut environ '+Math.ceil(need/Math.max(1,best)*100)+' % de votre meilleure armée voisine.';
  h+='<div class="bossob"><b>Pourquoi l’attaquer ?</b>'
    +'<span class="gain">✔ Immédiat : +'+g+' ฿ (≈ '+(TM.on?'10 tours':'2 min 30')+' de revenu) et +'+fmtPrime(400)+' de prime</span>'
    +'<span class="gain">✔ Permanent : trophée « '+esc(b.rew.nm)+' » ('+fxText2(b.rew.fx)+') et l’île '+esc(t.name)+' à vous</span>'
    +'<span class="risk">✖ Risque : une vague qui échoue est perdue ; la prime attire la Marine ; le boss se soigne si on le laisse tranquille</span>'
    +'<span>Force nécessaire : ≈ <b>'+(need===Infinity?'—':Math.round(need))+'</b> en une vague · votre meilleure armée voisine : <b>'+Math.round(best)+'</b></span><span>'+verdict+'</span></div>';
  h+=kv('Points de vie','<span>'+Math.round(st.hp)+' / '+b.hp+'</span>')+'<div class="bossbar"><i style="width:'+Math.round(st.hp/b.hp*100)+'%"></i><u style="left:33.3%"></u><u style="left:66.6%"></u></div>'
    +kv('Phase actuelle',(ph+1)+' / 3 : '+esc(b.ph[ph].n));
  b.ph.forEach((z,k)=>{h+='<div class="kv" style="opacity:'+(k===ph?1:.7)+'"><span>Phase '+(k+1)+' : '+esc(z.n)+'</span><b>frappe ×'+String(z.dm).replace('.',',')+(z.bn?' · usure '+Math.round(z.bn*100)+' %':'')+'</b></div>';});
  return h+'<p class="note">'+esc(b.t)+'. '+esc(b.w)+' Il ne peut être ni annexé ni converti. Chaque vague joue 8 manches ; les frappes de lieutenant lui retirent aussi des PV.</p>';
}
/* ---------- conseils : toujours savoir pourquoi on agit ---------- */
function rkAdvice(){
  const p=players[ME];if(!p||!p.x||!p.alive)return [];
  const out=[],mine=terrs.filter(t=>t.owner===ME);
  const E=rkEco(p),net=E.net*TLEN();
  /* 1. attaque en cours contre vous */
  const inc=armies.filter(a=>!a.rt&&a.owner!==ME&&terrs[a.to].owner===ME&&isWar(a.owner,ME));
  if(inc.length){const a=inc[0],t=terrs[a.to];out.push({ic:'⚠',t:'<b>'+esc(cname(players[a.owner]))+'</b> attaque <b>'+esc(t.name)+'</b> ('+Math.floor(sumU(a.u))+' troupes contre '+Math.floor(tr(t))+'). Renforcez-la ou fortifiez-la.',to:t.id,l:'Voir'});}
  /* 2. conquête facile */
  let best=null,bs=0;
  for(const t of mine){
    for(const n of t.nb){
      const x=terrs[n];if(x.owner===ME||bossAlive(x))continue;if(x.owner>=0&&!isWar(ME,x.owner))continue;
      const A=attTotal(ME,scaleU(t.u,.75),x,false,t.id),D=defTotal(x,scaleU(t.u,.75),false);
      const r=A/(D+.5);if(r>=1.4&&r*(x.owner<0?1.2:1)>bs){bs=r*(x.owner<0?1.2:1);best={f:t,x:x,r:r};}
    }
  }
  if(best)out.push({ic:'⚔',t:'<b>'+esc(best.x.name)+'</b> ('+(best.x.owner<0?'neutre':esc(cname(players[best.x.owner])))+', '+Math.floor(tr(best.x))+' défenseurs) est à votre portée depuis <b>'+esc(best.f.name)+'</b> : '+(best.r>=2.2?'victoire très probable':'victoire probable')+' avec 75 % de la garnison.',to:best.x.id,l:'Voir'});
  /* 3. Berrys inutilisés */
  if(p.gold>=45&&!inc.length){const cap=mine.find(t=>t.capital)||mine[0];out.push({ic:'฿',t:'<b>'+Math.floor(p.gold)+' ฿</b> dorment : recrutez, fondez une ville ou construisez (onglet Économie).',to:cap?cap.id:-1,l:'Voir'});}
  /* 4. économie négative */
  if(net<-.05)out.push({ic:'⚠',t:'Économie négative ('+sgn(net,1)+' ฿/'+TUN()+') : l’entretien des unités dépasse vos revenus.',tab:'eco',l:'Détail'});
  /* 5. savoir */
  const tech=TECHS.find(t=>!p.techs[t.id]&&t.era<=AG.n+1&&t.req.every(r=>p.techs[r])&&p.sci>=t.cost);
  if(tech)out.push({ic:'◈',t:'Vous pouvez découvrir <b>'+esc(tech.n)+'</b> ('+tech.cost+' savoir).',tab:'tech',l:'Techno'});
  /* 6. boss atteignable */
  for(const t of terrs){if(!bossAlive(t))continue;const nb=t.nb.some(n=>terrs[n].owner===ME);if(!nb)continue;const need=rkBossNeed(t.boss);let bestA=0;for(const n of t.nb){const o=terrs[n];if(o.owner===ME)bestA=Math.max(bestA,attTotal(ME,o.u,t,true,o.id,undefined,0));}
    if(bestA>=need*1.15){out.push({ic:'☠',t:'Boss <b>'+esc(BOSSES[t.boss].n)+'</b> à portée : récompense +'+rkBossGold(BOSSES[t.boss],p)+' ฿ et trophée permanent (facultatif).',to:t.id,l:'Voir'});break;}}
  /* 7. personnage recrutable */
  if(!out.some(o=>o.ic==='♛')){const c=LEGENDS.findIndex((L,i)=>!hireReason(p,i));if(c>=0)out.push({ic:'♛',t:'<b>'+esc(LEGENDS[c].s)+'</b> peut rejoindre votre état-major ('+recCost(p,c)+' ฿) : '+esc(rkChUse(c)),tab:'leg',l:'Équipe'});}
  if(!out.length){out.push({ic:'➤',t:'Étendez-vous : sélectionnez une île à vous puis une île voisine pour envoyer des troupes.'});}
  return out.slice(0,3);
}
function adviceCard(){
  const A=rkAdvice();if(!A.length)return '';
  return '<div class="card adv-card"><h3>Que faire maintenant ?</h3>'+A.map(a=>'<div class="ar"><span>'+a.ic+'</span><span>'+a.t+'</span>'+(a.tab?btn('tab',a.tab,a.l,false):a.to>=0?btn('sel',a.to,a.l,false):'')+'</div>').join('')+'</div>';
}
/* ---------- objectifs : quoi, pourquoi, gain, risque ---------- */
function pObj(){
  const p=players[ME];if(!p||!p.x)return '';
  const alive=players.filter(q=>q.alive&&q.id!==ME),vass=alive.filter(q=>vas[q.id]===ME).length;
  const pj=p.x.pj;
  const myScore=scoreOf(p),sc=players.filter(q=>q.alive).map(q=>scoreOf(q)).sort((a,b)=>b-a),rank=sc.indexOf(myScore)+1;
  let h='<div class="card"><h3>Comment gagner</h3>'
    +'<div class="lr"><b>1. Dominer la mer</b><small><b>Quoi</b> : éliminer ou soumettre (vassaux) tous les rivaux. <b>Pourquoi</b> : victoire immédiate, la plus directe. <b>Gain</b> : fin de partie. <b>Risque</b> : plusieurs guerres à la fois. Avancement : '+(3-alive.length)+' éliminé(s), '+vass+' vassal(aux) sur 3.</small></div>'
    +'<div class="lr"><b>2. Achever un Projet (Âge III)</b><small><b>Quoi</b> : lancer un grand projet quand la voie d’Héritage correspondante est accomplie. <b>Pourquoi</b> : victoire sans conquérir toute la carte. <b>Risque</b> : la capitale tombe = le projet s’effondre. '+(pj?'<b>En cours : '+Math.round(pj.t/pj.dur*100)+' %.</b>':AG.n<2?'Accessible à l’âge Nouveau Monde.':'Voir Monde → Âge.')+'</small></div>'
    +'<div class="lr"><b>3. Finir en tête aux points</b><small><b>Quoi</b> : avoir le meilleur score à la fin de l’âge Nouveau Monde (jalons, îles, lieux légendaires, technologies). <b>Votre rang</b> : '+rank+' / '+sc.length+' (score '+myScore+').</small></div>'
    +'<div class="lr"><b>4. Paix mondiale</b><small>Si tous les camps encore en vie sont alliés après l’âge II : victoire commune.</small></div></div>';
  h+=msCard();
  /* lieux à enjeu et îles célèbres, expliqués simplement */
  const spots=[];
  for(const t of terrs){
    if(bossAlive(t))spots.push('<div class="lr"><b>☠ '+esc(t.name)+' · '+esc(BOSSES[t.boss].n)+'</b><small>Objectif facultatif. Récompense : '+rkBossGold(BOSSES[t.boss],p)+' ฿ + trophée « '+esc(BOSSES[t.boss].rew.nm)+' ». Risque : perdre une vague.</small>'+btn('sel',t.id,'Voir',false)+'</div>');
    else if(t.fruit)spots.push('<div class="lr"><b>Fruit '+FRUITS[t.fruit].n+' · '+esc(t.name)+'</b><small>Bonus permanent pour qui tient l’île : '+FRUITS[t.fruit].d+'. '+(t.owner>=0?'Tenu par '+esc(cname(players[t.owner]))+'.':'Neutre.')+'</small>'+btn('sel',t.id,'Voir',false)+'</div>');
    else if(t.pone)spots.push('<div class="lr"><b>Poneglyphe · '+esc(t.name)+'</b><small>Pierre ancienne : en tenir 2 permet le projet scientifique (Expédition à Laugh Tale). '+(t.owner>=0?'Tenu par '+esc(cname(players[t.owner]))+'.':'Neutre.')+'</small>'+btn('sel',t.id,'Voir',false)+'</div>');
  }
  h+='<div class="card"><h3>Lieux à enjeu</h3>'+(spots.join('')||'<p class="muted">Aucun.</p>')+'<p class="note">Un lieu à enjeu rapporte un avantage durable à son détenteur. Les boss sont facultatifs : battez-les seulement quand leur récompense vaut le risque (voir leur fiche).</p></div>';
  h+=regCard();
  const isl=terrs.filter(t=>ISLE_FX[t.name]).map(t=>{const own=t.owner>=0?players[t.owner]:null;return '<div class="lr"><b>✦ '+t.name+'</b><small>'+fxText(ISLE_FX[t.name].fx)+' · '+(own?'Tenue par '+esc(cname(own)):'Neutre')+'</small>'+btn('sel',t.id,'Voir',false)+'</div>';}).join('');
  if(isl)h+='<div class="card"><h3>Îles célèbres</h3>'+isl+'<p class="note">Une île célèbre (✦) donne son bonus à celui qui la tient.</p></div>';
  return h;
}
/* ---------- fiches de personnage lisibles ---------- */
function rkChUse(i){
  const sk=chMeta(i).sk,t=sk.ty;
  return t==='strike'?'brise la garnison d’une île avant l’assaut (utile contre une île fortifiée ou un boss)':t==='buff'?'renforce toute l’armée quelques secondes : à lancer juste avant un grand combat':t==='debuff'?'affaiblit tous vos ennemis en guerre : utile sur plusieurs fronts':t==='gold'||t==='wealth'?'rapporte des Berrys tout de suite : utile pour acheter sans attendre':t==='rally'?'ajoute des Pirates partout : renforce toutes vos îles d’un coup':'';
}
function chCard(i,p,mode){
  const L=LEGENDS[i],M=chMeta(i),R=RAR[M.r],c=CH[i];
  const owned=c.own===p.id,cr=CREWS[p.crew||0];
  let h='<div class="chc'+(mode==='dim'?' dim':'')+(IL.url[L.s]?' hasil':'')+'" style="--rc:'+R.col+'">'+ilCardThumb(i)+'<div class="t"><b style="color:'+R.col+'">♛ '+esc(L.n)+'</b><span class="rar" style="border-color:'+R.col+';color:'+R.col+'">'+R.n+'</span><span class="muted">'+M.role+(owned?' · niveau '+c.lv:'')+'</span></div>'
    +'<div class="ln"><i>★</i><span><b>Passif (tout le camp)</b> : '+fxText(L.fx)+(L.aff?' · ×1,5 chez '+CREWS.find(x=>x.id===L.aff).n:'')+'</span></div>'
    +'<div class="ln"><i>⚡</i><span><b>Compétence — '+esc(M.sk.n)+'</b> : '+skText(i)+' · recharge '+Math.round(chCd(i))+' s</span></div>'
    +'<div class="ln use"><i>➤</i><span><b>Utilité</b> : '+esc(rkChUse(i))+'.</span></div>'
    +'<div class="ln"><i>⚑</i><span><b>Sur une île</b> : '+rkLeadText(i,p)+'.</span></div>';
  if(owned){
    const act=chIsActive(ME,i),post=c.post>=0?terrs[c.post]:null,sel=ui.sel>=0?terrs[ui.sel]:null,why=skillReason(p,i,ui.sel),ready=c.cd<=0;
    const canPost=sel&&sel.owner===ME&&sel.id!==c.post&&act;
    h+='<div class="ln"><i>📍</i><span><b>Poste</b> : '+(post?esc(post.name):'aucun'+(canPost?'':' — sélectionnez une de vos îles pour l’y affecter'))+(act?'':' · <b style="color:var(--bad)">en réserve</b> (état-major plein)')+'</span></div>'
      +'<div class="acts">'+btn('cskill',i,ready?'Utiliser '+esc(M.sk.n):'Recharge '+Math.ceil(c.cd)+' s',!!why)+(canPost?btn('cpost',i+':'+sel.id,'Affecter à '+esc(sel.name),false):'')+(post?btn('cpost',i+':-1','Retirer du poste',false):'')
      +(ui.cdi===i?btn('cdis',i,'Confirmer le renvoi',false,'on'):btn('cdi',i,'Congédier',false))+'</div>'+(why&&!ready?'':'')
      +(c.lv<5?'<div class="bar" title="Expérience"><i style="width:'+Math.round((c.xp-(c.lv>1?XP_T[c.lv-2]:0))/((XP_T[c.lv-1])-(c.lv>1?XP_T[c.lv-2]:0))*100)+'%"></i></div>':'');
  }else if(mode==='hire'){
    const cs=recConds(p,i),why=hireReason(p,i);
    h+='<div class="ln"><i>✔</i><span><b>Conditions</b> : '+cs.map(x=>'<span style="color:'+(x.ok?'var(--good)':'var(--muted)')+'">'+(x.ok?'✓':'✗')+' '+x.t+'</span>').join(' · ')+'</span></div>'
      +'<div class="acts">'+btn('hire',i,'Recruter · '+recCost(p,i)+' ฿',!!why)+'<span class="note">'+(why||'Toutes les conditions sont remplies.')+'</span></div>';
  }else if(c.own>=0){h+='<div class="ln"><i>⚓</i><span>Au service de <b style="color:'+players[c.own].color+'">'+esc(cname(players[c.own]))+'</b></span></div>';}
  else{h+='<div class="ln"><i>✖</i><span>Il ne rejoindra jamais '+esc(cr.n)+' (camps : '+L.camps.map(x=>CREWS.find(y=>y.id===x).n).join(', ')+').</span></div>';}
  return h+'</div>';
}
function pLeg2(){
  const p=players[ME],cr=CREWS[p.crew||0],mineI=chOwnedBy(ME);
  let h='<div class="card"><h3>Votre état-major · '+mineI.length+' / '+chSlots()+' places</h3>'
    +'<p class="note">Un lieutenant donne un <b>bonus passif</b> à tout votre camp, une <b>compétence active</b> et peut commander une île. Il est unique : un seul camp l’a. Choisissez-le selon ce dont votre plan a besoin (attaque, défense, Berrys).</p>'
    +(mineI.length?mineI.map(i=>chCard(i,p,'own')).join(''):'<p class="muted">Aucun lieutenant pour l’instant. Remplissez les conditions d’un personnage ci-dessous.</p>')+'</div>';
  /* camp du joueur : trois sections (recrutables maintenant / presque / plus tard) + ceux non proposés dans cette partie (module 18) */
  h+=pgRecruitHTML(p);
  const rest=LEGENDS.map((L,i)=>i).filter(i=>CH[i].own!==ME&&(CH[i].own>=0||!LEGENDS[i].camps.includes(cr.id))).sort((a,b)=>RAR_W[chMeta(a).r]-RAR_W[chMeta(b).r]||a-b);
  if(rest.length)h+='<div class="card"><details><summary><b>Indisponibles ('+rest.length+')</b> — déjà pris ou qui refusent votre camp</summary>'+rest.map(i=>chCard(i,p,'dim')).join('')+'</details></div>';
  const buffs=(p.buf||[]).filter(b=>b.until>time).map(b=>kv(esc(b.n),Math.ceil(b.until-time)+' s')).join('');
  if(buffs)h+='<div class="card"><h3>Effets en cours</h3>'+buffs+'</div>';
  return h;
}

function rkLeadText(i,p){
  if(CH[i]&&CH[i].own>=0)return leadText(i);
  const d=LEGENDS[i].lead||{},kk=p?legBonus(p,i):1,o=[];
  if(d.atk)o.push('attaque des troupes qui en partent +'+Math.round(d.atk*kk*100)+' %');
  if(d.def)o.push('défense de la garnison +'+Math.round(d.def*kk*100)+' %');
  if(d.spd)o.push('vitesse des armées +'+Math.round(d.spd*kk*100)+' %');
  if(d.big)o.push('contre les grosses armées +'+Math.round(d.big*kk*100)+' %');
  return o.length?o.join(', ')+(kk>1?' (bonus ×1,5 : votre camp est le sien)':''):'aucun effet de commandement';
}
