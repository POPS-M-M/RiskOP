const fs=require('fs');
const root=__dirname+'/../',SRC=root+'src/';
/* essai : version « test » publiée sur claude.ai = jeu + prototypes de src/essai/ ; essai-test : la même avec l'accès de test */
const essai=/^essai/.test(process.argv[2]||''),test=process.argv[2]==='test'||process.argv[2]==='essai-test',web=process.argv[2]==='web'||process.argv[2]==='essai-web';
let h=fs.readFileSync(SRC+'base/grand_line_origine.html','utf8');
const rd=f=>fs.readFileSync(SRC+'js/'+f,'utf8');
function rep(a,b,n){n=n||1;const parts=h.split(a);if(parts.length-1!==n)throw new Error('ancre trouvée '+(parts.length-1)+'× au lieu de '+n+' : '+a.slice(0,80));h=parts.join(b);}
function cut(startRe,endRe,ins){const s=h.search(startRe);if(s<0)throw new Error('début introuvable '+startRe);const rest=h.slice(s);const m=rest.slice(1).search(endRe);if(m<0)throw new Error('fin introuvable '+endRe);h=h.slice(0,s)+(ins||'')+h.slice(s+1+m);}
/* 1. nom */
rep('<title>Grand Line</title>','<title>RISK OP</title>');
rep('<h1>Grand Line</h1>','<h1>RISK OP</h1>');
rep('overlay.innerHTML=\'<div class="intro"><h2>Grand Line</h2>\'','overlay.innerHTML=\'<div class="intro"><h2>RISK OP</h2>\'');
/* 2. CSS */
rep('</style>\n\n<div class="app" id="app">','\n'+fs.readFileSync(SRC+'styles/risk-op.css','utf8')+'\n</style>\n\n<div class="app" id="app">');
/* 3. HTML */
rep('<button id="b-snd" title="Son">','<button id="b-notif" title="Notifications sur la carte">🔔</button><button id="b-jrn" title="Journal des événements">📜</button><button id="b-saves" title="Sauvegardes de partie"><span aria-hidden="true">💾</span><span class="lbl2"> Sauvegardes</span></button><button id="b-guide" title="Guide interactif"><span aria-hidden="true">🎓</span><span class="lbl2"> Guide</span></button><button id="b-adv" title="Mode avancé"><span aria-hidden="true">⚙</span><span class="lbl2"> Avancé</span></button>\n      <button id="b-snd" title="Son">');
rep('<div class="players" id="players" aria-label="Camps en jeu"></div>','<div class="players" id="players" aria-label="Camps en jeu"></div>\n  <div class="phase" id="phase" aria-live="polite" hidden></div>');
rep('<canvas class="mini" id="mini" aria-label="Mini-carte : cliquez pour déplacer la vue"></canvas>','<div class="minibox" id="minibox"><div class="mini-h" id="mini-h"><span>Mini-carte · troupes par île</span><button id="mini-hide" title="Masquer la mini-carte (touche M)" aria-label="Masquer la mini-carte">–</button></div><canvas class="mini" id="mini" aria-label="Mini-carte : cliquez pour déplacer la vue"></canvas></div><button class="mini-show" id="mini-show" hidden title="Afficher la mini-carte (touche M)">🗺 Mini-carte</button>\n      <div class="coach" id="coach" hidden role="region" aria-live="polite" aria-label="Guide interactif"></div>');
/* 4. tutoriel d'origine remplacé */
cut(/\/\* ---- tutoriel guidé \(partie solo\)/,/\/\* ---- compteurs par camp/);
/* 5. son */
cut(/\/\* ---- ambiance sonore ----/,/\nfunction mulberry32/,'/*SND*/\n');
rep('/*SND*/\n',rd('00-son.js')+'\n');
/* 6. wrappers */
rep('function launch(pid,from,to,pct,st){','function launch_o(pid,from,to,pct,st){');
rep('function addLog(text,color,to){logs.push','function addLog_o(text,color,to){logs.push');
/* 7. économie / équilibrage / unités par tour */
rep("gold:20,sci:0,faith:0","gold:40,sci:0,faith:0");
rep("modePick='turn',pacePick=6;","modePick='turn',pacePick=3;");
rep("const g=Math.max(10,Math.round(b.rew.gold*PK/6));\n  if(p){p.gold+=g;","const g=rkBossGold(b,p);\n  if(p){p.gold+=g;");
rep("const rk=TM.on?TURN_LEN:1,ru=TM.on?'/tour':'/s',rd=TM.on?0:1;","const rk=TLEN(),ru='/'+TUN(),rd=1;if(TM.on&&TM.phase==='plan'&&MODE!=='client'&&p.alive)p.rate=income(p);");
rep("' ฿/s');\n  if(bi.s)","' ฿/'+TUN());\n  if(bi.s)");
rep("f2(bi.g*(1+m.gold)*p.inc*Z)","f2(bi.g*(1+m.gold)*p.inc*Z*TLEN())");
rep("f2(bi.s*(1+m.sci)*p.inc*Z)+' savoir/s'","f2(bi.s*(1+m.sci)*p.inc*Z*TLEN())+' savoir/'+TUN()");
rep("f2(bi.f*(1+m.faith)*p.inc*Z)+' Volonté/s'","f2(bi.f*(1+m.faith)*p.inc*Z*TLEN())+' Volonté/'+TUN()");
rep('title="Berrys par seconde"><i>฿</i> +\'+f2(pr.g)+\'<small>/s</small>','title="Berrys par \'+(TM.on?\'tour\':\'minute\')+\'"><i>฿</i> +\'+f2(pr.g*TLEN())+\'<small>/\'+TUN()+\'</small>');
rep('title="Savoir par seconde"><i>◈</i> +\'+f2(pr.s)+\'<small>/s</small>','title="Savoir par \'+(TM.on?\'tour\':\'minute\')+\'"><i>◈</i> +\'+f2(pr.s*TLEN())+\'<small>/\'+TUN()+\'</small>');
rep('title="Volonté par seconde"><i>✹</i> +\'+f2(pr.f)+\'<small>/s</small>','title="Volonté par \'+(TM.on?\'tour\':\'minute\')+\'"><i>✹</i> +\'+f2(pr.f*TLEN())+\'<small>/\'+TUN()+\'</small>');
rep("kv('Entretien',f1(p.rate.up)+' ฿/s')","kv('Entretien des troupes',f1(p.rate.up*TLEN())+' ฿/'+TUN())");
rep("'+f1(me.rate.i||0)+'/s)')","'+f1((me.rate.i||0)*TLEN())+'/'+TUN()+')')");
/* 8. conquête : récapitulatif */
rep("const atk=players[a.owner];\n  if((a.s|0)===2&&A<D*PRUD_ABORT)","const atk=players[a.owner];const rk0=a.owner===ME?rkSnap(a.owner):null;\n  if((a.s|0)===2&&A<D*PRUD_ABORT)");
rep("stInc(a.owner,'bw');\n    if(t.city)captureCity(t);","stInc(a.owner,'bw');\n    if(t.city)captureCity(t);\n    if(a.owner===ME){try{rkRecap(rk0,t,a,prev);}catch(_){}}");
rep("+'<button class=\"brb\" data-act=\"brrep\" data-v=\"'+r.id+'\">Voir le rapport</button>';","+rkRecapFor(r)+'<button class=\"brb\" data-act=\"brrep\" data-v=\"'+r.id+'\">Voir le rapport</button>';");
rep("brTimer=setTimeout(brClose,9000);","brTimer=setTimeout(brClose,(r.win&&me==='att'&&!r.bs)?16000:9000);");
/* 9. IA : UNE décision par tour, comme un joueur humain. Elle décide au moment où la phase d'ordres se termine,
      AVANT que les ordres des joueurs ne partent (elle ne voit donc pas les coups humains du tour), puis tout part ensemble. */
rep("function startRes(){\n  const q=TM.queue.slice();TM.queue=[];","function startRes(){\n  try{rkAiTurn();}catch(_){}\n  const q=TM.queue.slice();TM.queue=[];");
rep("if(!p.alive||p.human)continue;\n    p.ai.t-=dt;","if(!p.alive||p.human||TM.on)continue;\n    p.ai.t-=dt;");
rep("const thr=(x.owner<0?1.4:1.5)*","const thr=(x.owner<0?(mine.length<5?1.15:1.3):1.5)*");
/* 10. boucle et dessin */
rep("draw();updateTop();renderLog();","draw();updateTop();renderLog();rkFrame(now);");
rep("drawFX(now,u);\n  if(ui.hover>=0","drawFX(now,u);rkDrawOver(u,now);\n  if(ui.hover>=0");
rep("ctx.fillText(n,x,y+15.5*u);\n  }","ctx.fillText(n,x,y+15.5*u);rkArmyLabel(a,x,y,u);\n  }");
/* 11. menu : sauvegarde auto en quittant, boutons de l'écran d'accueil */
rep("$('#b-new').addEventListener('click',()=>{leaveNet();showIntro();});","$('#b-new').addEventListener('click',()=>{try{svAuto('menu');}catch(_){}leaveNet();showIntro();});");
rep('id="o-arc">Combat arcade</button></div>\'','id="o-arc">Combat arcade</button></div>\'+rkIntroRow()');
rep("$('#o-arc').addEventListener('click'","rkIntroBind();$('#o-arc').addEventListener('click'");
rep("$('#o-go').addEventListener('click',()=>{\n","$('#o-go').addEventListener('click',()=>{\n    if($('#o-tuto')&&$('#o-tuto').checked){rkStartTutorial();return;}\n");
rep("> Tutoriel guidé (partie solo)</label>","> Guide interactif au lancement (conseillé la première fois ; rejouable depuis le bouton Guide)</label>");
/* 13. rendu 2.5D (couche de dessin seulement) */
rep("const flow=REDUCE?0:now/55;","r25Pass(now,u);\n  const flow=REDUCE?0:now/55;");
rep("for(const t of terrs){\n    const s=u*.62;","for(const t of terrs){\n    if(r25Art(t))continue;\n    const s=u*.62;");
rep("for(const t of terrs){\n    const isCity=!!t.city,r=12*u*","for(const t of terrs){\n    const r25o=r25TokenOpen(t);\n    const isCity=!!t.city,r=12*u*");
rep("ctx.strokeText(LEGENDS[lti].s,t.x,ly);ctx.fillText(LEGENDS[lti].s,t.x,ly);\n    }\n  }","ctx.strokeText(LEGENDS[lti].s,t.x,ly);ctx.fillText(LEGENDS[lti].s,t.x,ly);\n    }\n    if(r25o)ctx.restore();\n  }");
rep('<button id="z-reset"','<button id="z-25" class="on" aria-pressed="true" aria-label="Basculer le rendu 2.5D" title="Rendu 2.5D (prototype) : activer / désactiver">2.5D</button><button id="z-reset"');
/* 14. illustrations importées : rapports de bataille */
rep("aria-label=\"Fermer\">✕</button></div>'\n    +'<div class=\"bl\">Vos troupes","aria-label=\"Fermer\">✕</button></div>'+ilBattleHTML(r,'small')\n    +'<div class=\"bl\">Vos troupes");
rep("return '<div class=\"card rpt\">'+btn('repback','','← Retour au journal')","return '<div class=\"card rpt\">'+btn('repback','','← Retour au journal')+ilBattleHTML(r,'big')",2);
/* 15. rendu 2.5D généralisé : fiche d'île et mer lisse */
rep("function islandArt(t){","function islandArt_o(t){");
rep("ctx.drawImage(off,0,0,W,H);","if(!r25SeaDraw())ctx.drawImage(off,0,0,W,H);");
/* 12. couche RISK OP */
const MODS=['10-economie-phases-ia.js','11-recap-objectifs-heros.js','12-interface-onglets-minicarte.js','13-tutoriel.js','14-sauvegardes.js','15-ages.js','16-multijoueur-factions.js','17-multijoueur-web.js','18-progression.js','20-rendu25d-biomes.js','21-rendu25d-decors.js','22-rendu25d-iles.js','23-rendu25d-moteur.js','30-illustrations.js','40-menu-boutons.js','50-tableau-ile.js','51-economie.js','52-musique-medievale.js','90-op-adventure.js'];
const block='/* ================= RISK OP : couche d\'expérience (audit, tutoriel, phases, économie, sauvegardes, sons, âges) ================= */\n'
  +MODS.map(f=>'/* ─────────── module : '+f+' ─────────── */\n'+rd(f)).join('\n')
  +(essai?fs.readdirSync(SRC+'essai').filter(f=>f.endsWith('.js')).sort().map(f=>'\n/* ─────────── PROTOTYPE (version test) : '+f+' ─────────── */\n'+fs.readFileSync(SRC+'essai/'+f,'utf8')).join(''):'');
rep('/* ================= Boucle principale ================= */',block+'\n/* ================= Boucle principale ================= */');
if(test){
  rep("requestAnimationFrame(frame);\n})();\n"+"",
    "requestAnimationFrame(frame);\n"+fs.readFileSync(__dirname+'/expose-tests.txt','utf8')+"\n})();\n");
}
/* 18. correctif : le panneau latéral ne doit pas défiler tout seul quand il est redessiné (ex. clic sur « Recruter ») */
rep("if(h!==lastPanel){side.innerHTML=h;lastPanel=h;}","if(h!==lastPanel){const st=side.scrollTop;side.innerHTML=h;lastPanel=h;if(side.scrollTop!==st)side.scrollTop=st;}");
/* 19. multijoueur : un même compte ouvert dans deux onglets/appareils = deux joueurs distincts (on n'ignore que CET onglet),
       messages d'erreur explicites (accès à la page, code introuvable, droit d'envoyer des ordres) */
rep("const me=ps.find(p=>p.isMe&&p.sameTab);","const me=ps.find(p=>p.sameTab);");
rep("if(p.isMe||p.kind!=='viewer')continue;","if(p.sameTab||p.kind!=='viewer')continue;");
rep("const hp=ps.filter(p=>p.kind==='viewer'&&!p.isMe&&p.presence","const hp=ps.filter(p=>p.kind==='viewer'&&!p.sameTab&&p.presence");
rep("if(!NET.host||msg.isMe||NET.phase!=='play')return;","if(!NET.host||msg.sameTab||NET.phase!=='play')return;");
rep("if(NET.host||msg.isMe||!NET.hostKey||","if(NET.host||msg.sameTab||!NET.hostKey||");
rep("}catch(e){mpMsg('Connexion impossible ('+((e&&e.code)||'erreur')+').');NET.room=null;return;}","}catch(e){const c=e&&e.code;mpMsg(c==='not_permitted'?'Votre compte n’est pas admis dans la salle de cette page. Demandez au propriétaire de vous inviter (Partager → votre e-mail, avec le droit d’interagir) : un lien public seul ne suffit pas.':'Connexion impossible ('+(c||'erreur')+'). Réessayez dans quelques secondes.');NET.room=null;return;}");
rep("NET.room.emit('cmd',{d}).catch(()=>{});","NET.room.emit('cmd',{d}).catch(e=>{if(e&&e.code==='not_permitted'&&!NET.permWarn){NET.permWarn=1;toast('Vos ordres ne partent pas : votre accès à la page est en lecture seule. L’hôte doit vous donner le droit d’interagir (Partager).');}});");
rep("netLost(NET.state==='play'?'L\\'hôte a quitté la partie.':'Aucune partie trouvée avec ce code.');","netLost(NET.state==='play'?'L\\'hôte a quitté la partie.':'Aucune partie trouvée avec ce code. Vérifiez le code, que l’hôte est bien dans sa salle d’attente, et que vous avez été invité sur cette page avec votre compte claude.ai.');");
rep("'Vous êtes connecté. L\\'hôte choisit le moment de lancer.')+'</p>'","'Vous êtes connecté. L\\'hôte choisit le moment de lancer.')+'</p>'+mpHelp()");
rep("const key=JSON.stringify(seats)+NET.host+(NET.hp?'h':'-');","const key=JSON.stringify(seats)+NET.host+(NET.hp?'h':'-')+(NET.room?NET.room.peers().length:0)+JSON.stringify(mpCrewsNow())+crewPick;");
/* 20. multijoueur : choix de la faction */
rep("const key=JSON.stringify(seatsPublic())+NET.phase;\n  if(key!==NET.seatsKey&&NET.room){NET.seatsKey=key;NET.room.presence({seats:seatsPublic(),phase:NET.phase}).catch(()=>{});}","if(NET.phase==='lobby')mpAssignCrews(ps);\n  const key=JSON.stringify(seatsPublic())+JSON.stringify(NET.crews)+NET.phase;\n  if(key!==NET.seatsKey&&NET.room){NET.seatsKey=key;NET.room.presence({seats:seatsPublic(),crews:NET.crews,phase:NET.phase}).catch(()=>{});}");
rep("<small class=\"muted\">'+CREWS[i].n+'</small>'","<small class=\"muted\">'+CREWS[mpCrewOf(i)].ic+' '+CREWS[mpCrewOf(i)].n+'</small>'");
rep("'<div class=\"seats\">'+rows+'</div>'","'<div class=\"seats\">'+rows+'</div>'+mpPicker(seats)");
rep("$('#l-quit').addEventListener('click',()=>{leaveNet();showIntro();});","$('#l-quit').addEventListener('click',()=>{leaveNet();showIntro();});mpBindPicker();");
rep("let n=CREWS[i].cap;if(used.has","let n=CREWS[NET.crews[i]].cap;if(used.has");
rep("newGame(sd,NET.diff,{names,humans,turn:","newGame(sd,NET.diff,{names,humans,crews:NET.crews.slice(),turn:");
rep("NET.room.presence({role:'host',name,pub:NET.pub,code,phase:'lobby',seats:[],seed:0,df:NET.diff,v:1})","NET.myCrew=crewPick;NET.room.presence({role:'host',name,pub:NET.pub,code,phase:'lobby',seats:[],crews:NET.crews,seed:0,df:NET.diff,v:1})");
rep("NET.room.presence({role:'player',name,pub:NET.pub,v:1})","NET.room.presence({role:'player',name,pub:NET.pub,crew:crewPick,v:1})");
/* 21. multijoueur : ne jamais rester bloqué sur « Vérification du multijoueur… » ; message clair si la page est ouverte par un simple lien */
rep("    const rt=(window.claude&&typeof claude.use==='function')?await claude.use('room'):null;","    const rt=(window.claude&&typeof claude.use==='function')?await Promise.race([claude.use('room'),new Promise(r=>setTimeout(()=>r(null),12000))]):null;");
rep("else NET.why='Disponible seulement quand la page est ouverte sur claude.ai avec un compte autorisé.';","else NET.why='Multijoueur indisponible pour ce compte sur cette page. Pour jouer en ligne, il faut être connecté à claude.ai ET avoir été invité sur la page par son propriétaire (Partager → adresse e-mail du compte, droit d’interagir). Un lien public seul ne donne pas accès au multijoueur. La partie solo reste disponible.';");
rep("const b=$('#o-host');if(b&&NET.api){$('#o-host').disabled=false;$('#o-join').disabled=false;const w=$('#o-why');if(w)w.textContent='';}","NET.checked=true;const b=$('#o-host');if(b&&NET.api){$('#o-host').disabled=false;$('#o-join').disabled=false;const w=$('#o-why');if(w)w.textContent='';}else{const w=$('#o-why');if(w)w.textContent=NET.why||'Multijoueur indisponible.';}");
/* 22. hors claude.ai (fichier hébergé ailleurs) : salle pair-à-pair PeerJS, téléchargement direct pour l'export */
rep("await Promise.race([claude.use('room'),new Promise(r=>setTimeout(()=>r(null),12000))]):null;","await Promise.race([claude.use('room'),new Promise(r=>setTimeout(()=>r(null),12000))]):await rkPeerRoom();");
rep("    if(rt&&typeof rt.join==='function')NET.api=rt;\n    else NET.why=","    if(rt&&typeof rt.join==='function')NET.api=rt;\n    else if(!window.claude&&NET.why){}\n    else NET.why=");
/* 23. progression permanente et commandants proposés par difficulté (module 18) */
rep("function newGame(sd,dk,opts){","function newGame_o(sd,dk,opts){");
rep("agConquest(a.owner,-1);","agConquest(a.owner,-1);rkCqT(a.owner,t);");
rep("agConquest(a.owner,prev);","agConquest(a.owner,prev);rkCqT(a.owner,t);");
rep("agConquest(p.id,prev);","agConquest(p.id,prev);rkCqT(p.id,t);");
rep("if(!L.camps.includes(cr.id))return 'Il ne rejoindra jamais '+cr.n+'.';","if(!L.camps.includes(cr.id))return 'Il ne rejoindra jamais '+cr.n+'.';\n  if(!pgOffered(cr.id,L.s))return 'Pas proposé dans cette partie (difficulté '+DIFF[diffKey].n+').';");
rep("function profRec(pid,i){if(MODE==='client'||pid!==ME)return;const k=LEGENDS[i].s;","function profRec(pid,i){if(MODE==='client'||pid!==ME)return;const k=LEGENDS[i].s;try{pgDiscover(k);}catch(_){}");
rep("profSave();try{achCheck();}catch(_){}\n  if(CAMP&&!CAMP.fin","profSave();try{achCheck();}catch(_){}\n  try{pgEnd(win);}catch(_){}\n  if(CAMP&&!CAMP.fin");
rep("else if(a==='hire')cmd({k:'hire',i:+v});","else if(a==='hire')cmd({k:'hire',i:+v});\n  else if(a==='chmore')RK.chOpen=RK.chOpen===+v?-1:+v;\n  else if(a==='pgsec'){RK.sec=RK.sec||{};const d={now:true,almost:true};RK.sec[v]=!(v in RK.sec?RK.sec[v]:!!d[v]);}\n  else if(a==='pgrr'){const m=pgReroll();toast(m||'Nouvelle liste de commandants tirée.');}");
rep("  return h+endStats();","  return h+pgEndHTML()+endStats();");
/* 24. difficultés : Expert, trêve allongée en Facile, coalitions (Difficile / Expert), fiche des règles (module 18) */
rep("hard:{n:'Difficile',inc:1.15,aggr:1.2,think:2.6}};","hard:{n:'Difficile',inc:1.15,aggr:1.2,think:2.6},expert:{n:'Expert',inc:1.15,aggr:1.2,think:2.6}};");
rep("function aiDiplo(p){\n  const myS=strength(p.id);","function aiDiplo(p){\n  try{rkCoalDiplo(p);}catch(_){}\n  const myS=strength(p.id);");
rep("time>=truce[p.id][q.id]&&time>170*PK&&","time>=truce[p.id][q.id]&&time>rkPeaceT(q.id)&&");
rep("if(time>=warSince[p.id][q.id]+60*PK&&(myS<.75*qS||Math.random()<.015))propose(p.id,q.id,'peace');","if(time>=warSince[p.id][q.id]+60*PK&&(myS<.75*qS||Math.random()<.015)&&!rkCoalNoPeace(p.id,q.id))propose(p.id,q.id,'peace');");
rep("if(kind==='peace')return o+(rs-1)*35","if(kind==='peace'&&rkCoalNoPeace(q,p))return false;\n  if(kind==='peace'&&rkCoalPair(q,p))return true;\n  if(kind==='alliance'&&rkCoalPair(q,p)&&rel[q][p]==='peace')return true;\n  if(kind==='peace')return o+(rs-1)*35");
rep("/p.ai.aggr;\n      if(ratio>=thr){","/p.ai.aggr*(rkCoalFocus(p,x)?.85:1);\n      if(ratio>=thr){");
rep("const sc=ratio*(evTreasureAt(x.id)?1.5:1)","const sc=ratio*(rkCoalFocus(p,x)?1.6:1)*(evTreasureAt(x.id)?1.5:1)");
rep("function rulesHTML(){","function rulesHTML_o(){");
rep("+'<button class=\"btn primary\" id=\"l-start\">","+pgRulesBox('l-drules',NET.diff,+NET.pace)+'<button class=\"btn primary\" id=\"l-start\">");
rep("$('#l-diff').addEventListener('change',e=>{NET.diff=e.target.value;});","$('#l-diff').addEventListener('change',e=>{NET.diff=e.target.value;const b=$('#l-drules');if(b)b.outerHTML=pgRulesBox('l-drules',NET.diff,+NET.pace);});");
/* 25. version test seulement : prototype 3D (le dessin 2.5D d'une île passe d'abord par r3Check) */
if(essai){
  rep("function r25Draw(t,e,now,u){\n  const D=ISLE_ART","function r25Draw_o(t,e,now,u){\n  const D=ISLE_ART");
  rep('<button id="z-reset"','<button id="z-3d" class="on" aria-pressed="true" title="Prototype 3D (Alabasta) : activer / désactiver">3D</button><button id="z-reset"');
  if(!web)rep('<title>RISK OP</title>','<title>RISK OP test</title>');
  /* monde 3D (version test) : la fonction de dessin de la carte passe d'abord par w3Frame ; bouton « Monde 3D » */
  rep("function draw(){\n  if(!grid)return;","function draw_o(){\n  if(!grid)return;");
  rep("V.k=clamp(V.k,1,3.5);","V.k=clamp(V.k,1,(typeof W3!=='undefined'&&W3.act)?18:3.5);");
  rep("V.k=clamp(V.k*f,1,3.5);","V.k=clamp(V.k*f,1,(typeof W3!=='undefined'&&W3.act)?18:3.5);");
  rep('<button id="z-3d"','<button id="z-w3" class="on" aria-pressed="true" title="Monde 3D : caméra libre (clic droit : tourner et incliner, Q/E : tourner)">🌍</button><button id="z-3d"');
}
/* 27. version test seulement : mode « Course vers Laugh Tale » (5 sièges : Marine, Révolutionnaires, 3 équipages pirates).
       Chaque règle Course est conditionnée à CS.on ; le module est src/essai/78-course.js. Remplacements repris de la copie de test
       de la phase 2 (rapport du 22/11/2026), où le mode classique est resté identique sur 10 parties sur 10. */
if(essai){
  if(h.indexOf('<head>')<0)throw new Error('<head> introuvable');h=h.replace('<head>','<head><script id="cs0">window.CS={on:false,only:true};</script>');   /* première occurrence : la page ; la seconde est un modèle de texte */
  rep('players=[0,1,2,3].map(i=>({\n    id:i,','players=crews.map((_,i)=>i).map(i=>({\n    id:i,');
  rep('inc:humans[i]?1:DIFF[dk].inc,\n    ai:{t:1.5+Math.random()*2,aggr:DIFF[dk].aggr*','inc:humans[i]||opts.noBonus?1:DIFF[dk].inc,\n    ai:{dk:(opts.dks&&opts.dks[i])||dk,t:1.5+Math.random()*2,aggr:DIFF[(opts.dks&&opts.dks[i])||dk].aggr*');
  rep('{length:4},()=>Array(4)','{length:players.length},()=>Array(players.length)',9);
  rep('vas=[-1,-1,-1,-1];vasSince=[0,0,0,0];','vas=players.map(()=>-1);vasSince=players.map(()=>0);',2);
  rep('opin=Array.from({length:4},()=>Array.from({length:4},()=>Math.round(Math.random()*12)));','opin=Array.from({length:players.length},()=>Array.from({length:players.length},()=>Math.round(Math.random()*12)));');
  rep('for(let v=0;v<4;v++){','for(let v=0;v<players.length;v++){');
  rep('for(let a=0;a<4;a++)for(let b=0;b<4;b++){\n    if(a===b)continue;','for(let a=0;a<players.length;a++)for(let b=0;b<players.length;b++){\n    if(a===b)continue;');
  rep('for(let q=0;q<4;q++){if(q!==p.id){setRel(','for(let q=0;q<players.length;q++){if(q!==p.id){setRel(');
  rep("const COLORS=['#4c8df6','#ee5b52','#3fc27a','#b672ee'];","const COLORS=['#4c8df6','#ee5b52','#3fc27a','#b672ee','#f2a33a'];");
  rep('let id=terrs.find(t=>t.name===MAP_CAPS[CREWS[p.crew||0].id]).id;','let id=terrs.find(t=>t.name===((opts.caps&&opts.caps[p.id])||MAP_CAPS[CREWS[p.crew||0].id])).id;');
  rep('p.ai.t=DIFF[diffKey].think*PK','p.ai.t=DIFF[p.ai.dk||diffKey].think*PK');
  rep('TM={on:!!opts.turn,phase:\'plan\',n:1,res:0,ready:[false,false,false,false],','TM={on:!!opts.turn,phase:\'plan\',n:1,res:0,ready:crews.map(()=>false),');
  rep('if(nw!==old){\n      if(p.name===CREWS[old].n)','if(nw!==old&&!CS.on){\n      if(p.name===CREWS[old].n)');
  rep('const dom=alive.length>=2?','const dom=!CS.on&&alive.length>=2?');
  rep('if(AG.n>=2&&alive.length>=2&&alive.every(','if(!CS.on&&AG.n>=2&&alive.length>=2&&alive.every(');
  rep('if(!players.some(p=>p.human&&p.alive)){fin(','if(!(CS.on&&CS.allAI)&&!players.some(p=>p.human&&p.alive)){fin(');
  rep('if(AG.n>=2){finalScore();return;}','if(AG.n>=2){if(CS.on){CS.ageEnd();return;}finalScore();return;}');
  rep('function endGame(winners,text){over={winners,text};showEnd();}','function endGame(winners,text){if(CS.on&&!CS.endOK)return;over={winners,text};showEnd();}');
  rep('function startProj(p,id){','function startProj(p,id){if(CS.on)return \'Mode Course : pas de projet de victoire.\';');
  rep('function marineTick(){','function marineTick(){if(CS.on)return;');
  rep('const canHit=(p,x)=>(x.owner<0&&!bossAlive(x))||','let canHit=(p,x)=>(CS.on&&CS.veto(p,x))?false:(x.owner<0&&(!bossAlive(x)||(CS.on&&CS.bossOK(p,x))))||');
  rep('    for(const x of foes){\n      const A=attTotal(p.id,avU,x,false,t.id),D=defTotal(x,avU,false);',
      '    for(const x of foes){\n      if(bossAlive(x)){const r=CS.on?CS.bossEval(p,t,x,avU):null;if(r&&r.sc>bestScore){bestScore=r.sc;best=x;bestRatio=1;bestRaw=99;}continue;}\n      const A=attTotal(p.id,avU,x,false,t.id),D=defTotal(x,avU,false);');
  rep('const sc=ratio*(rkCoalFocus(p,x)?1.6:1)','const sc=ratio*(CS.on?CS.w(p,x):1)*(rkCoalFocus(p,x)?1.6:1)');
  rep('const sc=(warAdj?12:0)-tr(t);','const sc=(warAdj?12:0)-tr(t)+(CS.on?CS.stage(p,t):0);');
  rep('function aiDec(p){','function aiDec(p){if(CS.on)return CS.aiDec(p);');
  rep('function decReason(p,t){','function decReason(p,t){if(CS.on)return \'Mode Course : déchiffrez depuis le panneau « Course ».\';');
  rep('function convertReason(p,t){','function convertReason(p,t){if(CS.on&&t.id===CS.LT)return \'Laugh Tale ne se rallie pas.\';');
  rep('function annexReason(p,t){','function annexReason(p,t){if(CS.on&&t.id===CS.LT)return \'Laugh Tale ne se rallie pas.\';');
  rep('function launch_o(pid,from,to,pct,st){','function launch_o(pid,from,to,pct,st){if(CS.on&&CS.blockLaunch(pid,to))return \'La route de Laugh Tale ne vous est pas encore révélée.\';');
  rep("return o&&o.v===1&&o.G&&o.meta?o:null;","return o&&(o.v===1||(CS.only&&o.v===2))&&o.G&&o.meta?o:null;");
  rep('<div class="on"><b>Campagne</b>Étoiles par chapitre : automatique.</div>',"'+(CS.only?'':'<div class=\"on\"><b>Campagne</b>Étoiles par chapitre : automatique.</div>')+'");   /* écran Sauvegardes : pas de carte Campagne dans la Course seule */
  rep("\nnewGame(seed,'normal');","\nif(CS.only)CS.backdrop(seed);else newGame(seed,'normal');");   /* décor de l'accueil : les cinq sièges de la Course */
  /* OP Adventure = Course seule : le mini-jeu « Combat arcade » (feuille de style et script indépendants, aucune dépendance du jeu) n'est pas inclus */
  {const i=h.indexOf('<style>\n/* ---- Combat arcade'),j=h.lastIndexOf('</script>');if(i<0||j<i)throw new Error('bloc Combat arcade introuvable');
   if(h.slice(i,j).indexOf('window.ARC=')<0)throw new Error('bloc Combat arcade inattendu');h=h.slice(0,i)+'<!-- Combat arcade : non inclus dans la version Course (OP Adventure) -->'+h.slice(j+9);}
  rep('function launchCheck(pid,from,to,pct){','function launchCheck(pid,from,to,pct){if(CS.on&&CS.blockLaunch(pid,to))return \'La route de Laugh Tale ne vous est pas encore révélée.\';');
  /* 28. Course asymétrique (25/11/2026, module src/essai/88-course-ops.js) : opérations par commande, brouillard de guerre par siège, diplomatie avec les 5 sièges */
  rep("      case 'agdone':return agDone(seat);","      case 'agdone':return agDone(seat);\n      case 'cs':return (CS.on&&CS.act&&typeof c.a==='string')?CS.act(seat,{a:c.a,t:c.t,q:c.q,id:c.id}):'Action impossible.';");
  rep('int(c.q,0,3)','int(c.q,0,players.length-1)',5);
  rep("    return [t.owner,mine?UK.map(k=>r1(t.u[k])):r1(tr(t)),","    return [t.owner,mine?UK.map(k=>r1(t.u[k])):(CS.on&&CS.seeT&&!CS.seeT(t.id,s)?-1:r1(tr(t))),");
  rep("  const A=armies.map(a=>[a.owner,a.from,a.to,","  const A=armies.filter(a=>!(CS.on&&CS.seeA)||CS.seeA(a,s)).map(a=>[a.owner,a.from,a.to,");
  rep("    N:players.map(p=>p.name),","    CSV:CS.on&&CS.view?CS.view(s):0,N:players.map(p=>p.name),");
  rep("  for(const a of armies){\n    const f=terrs[a.from],t=terrs[a.to],k=clamp(a.t/a.dur,0,1);\n    const x=f.x","  for(const a of armies){\n    if(CS.on&&CS.seeA&&!CS.seeA(a,ME))continue;\n    const f=terrs[a.from],t=terrs[a.to],k=clamp(a.t/a.dur,0,1);\n    const x=f.x");
  rep("const tn=String(Math.floor(tr(t)));ctx.strokeText(tn,","const tn=(CS.on&&CS.seeT&&!CS.seeT(t.id,ME))?CS.memN(t.id,ME):String(Math.floor(tr(t)));ctx.strokeText(tn,");
  rep("const n=String(Math.floor(tr(t)));\n    mctx.lineWidth=3.2","const n=(CS.on&&CS.seeT&&!CS.seeT(t.id,ME))?CS.memN(t.id,ME):String(Math.floor(tr(t)));\n    mctx.lineWidth=3.2");
  rep("const col=own?own.color:'#8d8672',tn=Math.floor(tr(t));","const col=own?own.color:'#8d8672',fogT=CS.on&&CS.seeT&&!CS.seeT(t.id,ME),tn=fogT?CS.memN(t.id,ME):Math.floor(tr(t));",2);
  rep("<span>Garnison <b>'+Math.floor(tr(t))+'</b></span>","<span>Garnison <b>'+((CS.on&&CS.seeT&&!CS.seeT(t.id,ME))?CS.memN(t.id,ME):Math.floor(tr(t)))+'</b></span>");
  rep("⚔ <b>'+Math.floor(c.t)+'</b></span>","⚔ <b>'+((CS.on&&CS.knowsMil&&p.id!==ME&&!CS.knowsMil(ME,p.id))?'?':Math.floor(c.t))+'</b></span>");
  rep("troupes <small>('+compText(t.u)+')</small>","troupes <small>('+(fogT?'hors de vue : '+CS.memAge(t.id,ME):compText(t.u))+')</small>");
  rep("  h+='<p class=\"note\">'+compText(t.u)+'</p>';","  h+='<p class=\"note\">'+(fogT?'Hors de vue : dernière observation '+CS.memAge(t.id,ME)+'.':compText(t.u))+'</p>';");
}
/* 26. OP Adventure : la Volonté devient ⚔ Recrues (textes affichés), les « recrues naturelles » deviennent des renforts naturels.
       Ce remplacement porte sur les textes ; les identifiants internes (faith, rate.f) ne contiennent ni « Volonté » ni « ✹ ». */
/* textes : l'unité de base s'appelle désormais « Recrues » (avant : Pirates) — seulement là où « pirates » désigne l'unité, pas le camp */
for(const [x,y] of [["' de Pirates à la garnison","' de Recrues à la garnison"],["+' pirates sur vos territoires.'","+' Recrues sur vos territoires.'"],["'+25 pirates et +60 ฿","'+25 Recrues et +60 ฿"],
  ["pirates ajoutés partout","Recrues ajoutées partout"],["'Lot de Pirates (+'","'Lot de Recrues (+'"],["ajoute des Pirates partout","ajoute des Recrues partout"],["Recrute un lot de Pirates.","Recrute un lot de Recrues."],
  ["Les Pirates sont les moins chers et n’ont pas d’entretien","Les Recrues sont les moins chères et n’ont pas d’entretien (mais chaque lot consomme des ⚔ Recrues)"],["+' Pirates : garnison","+' Recrues : garnison"],
  ["autres que les Pirates coûtent","autres que les Recrues coûtent"],["+CITY_UNITS+' pirates de plus que","+CITY_UNITS+' Recrues de plus que"],["+CITY_UNITS+' pirates de la garnison","+CITY_UNITS+' Recrues de la garnison"],["+CITY_UNITS+' pirates',","+CITY_UNITS+' Recrues',"]]){
  if(!h.includes(x))throw new Error('texte OP Adventure introuvable : '+x);h=h.split(x).join(y);}
h=h.replace(/Recrues naturelles/g,'Renforts naturels').replace(/recrues naturelles/g,'renforts naturels').replace(/Volonté/g,'Recrues').replace(/✹/g,'⚔');
/* 16. nettoyage : anciennes versions de fonctions et fonctions mortes */
h=require('./shake.js')(h,true);
/* 17. sommaire en tête du script principal */
const TOC='/* ==========================================================================\n   RISK OP — fichier assemblé par tools/build.js (ne pas modifier à la main : modifier src/ puis reconstruire)\n   SOMMAIRE DU SCRIPT PRINCIPAL\n   1. Socle du jeu (src/base) : son, carte, règles, IA, diplomatie, âges, rendu de base, interface, réseau\n   2. Couche RISK OP (src/js), dans l\'ordre :\n'+MODS.map(f=>'      - '+f).join('\n')+'\n   3. Boucle principale\n   Le mini-jeu « Combat arcade » est un second script indépendant, inchangé.\n   ========================================================================== */\n';
rep("<script>\n(()=>{\n'use strict';","<script>\n"+TOC+"/* global claude */\n(()=>{\n'use strict';");
if(web){const lib=fs.readFileSync(root+'tools/vendor/peerjs-1.5.5.min.js','utf8').replace(/<\/script/gi,'<\\/script');
  rep('<script>\n/* ==========================================================================\n   RISK OP','<script>/* PeerJS 1.5.5 (licence MIT) — réseau pair-à-pair pour le multijoueur hors claude.ai */\n'+lib+'\n</script>\n<script>\n/* ==========================================================================\n   RISK OP');}
fs.writeFileSync(root+'dist/'+(essai&&web?'index.html':essai?(test?'essai_test.html':'risk_op_test.html'):test?'risk_test.html':web?'index.html':'risk_op.html'),h);
console.log('ok',(essai&&web?'essai-web (index.html)':essai?'essai'+(test?' (test)':''):test?'test':web?'web (index.html)':'release'),h.length,'octets');
