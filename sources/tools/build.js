const fs=require('fs');
const root=__dirname+'/../',SRC=root+'src/';
const test=process.argv[2]==='test',web=process.argv[2]==='web';
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
/* 9. IA : une réflexion par tour, visible */
rep("TM.phase='res';TM.res=TURN_LEN;TM.ready=[false,false,false,false];dirty=true;\n}","TM.phase='res';TM.res=TURN_LEN;TM.ready=[false,false,false,false];dirty=true;\n  try{rkAiTurn();}catch(_){}\n}");
rep("if(!p.alive||p.human)continue;\n    p.ai.t-=dt;","if(!p.alive||p.human||TM.on)continue;\n    p.ai.t-=dt;");
rep("if(TM.on&&TM.phase==='res'&&!over){TM.res-=dt;if(TM.res<=1e-9)endRes();}","if(TM.on&&TM.phase==='res'&&!over){TM.res-=dt;if(!TM.mid&&TM.res<TURN_LEN/2){TM.mid=true;try{rkAiTurn();}catch(_){}}if(TM.res<=1e-9)endRes();}");
rep("TM.phase='res';TM.res=TURN_LEN;TM.ready=[false,false,false,false];dirty=true;\n  try{rkAiTurn();}catch(_){}","TM.phase='res';TM.res=TURN_LEN;TM.mid=false;TM.ready=[false,false,false,false];dirty=true;\n  try{rkAiTurn();}catch(_){}");
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
const MODS=['10-economie-phases-ia.js','11-recap-objectifs-heros.js','12-interface-onglets-minicarte.js','13-tutoriel.js','14-sauvegardes.js','15-ages.js','16-multijoueur-factions.js','17-multijoueur-web.js','20-rendu25d-biomes.js','21-rendu25d-decors.js','22-rendu25d-iles.js','23-rendu25d-moteur.js','30-illustrations.js','40-menu-boutons.js'];
const block='/* ================= RISK OP : couche d\'expérience (audit, tutoriel, phases, économie, sauvegardes, sons, âges) ================= */\n'
  +MODS.map(f=>'/* ─────────── module : '+f+' ─────────── */\n'+rd(f)).join('\n');
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
/* 16. nettoyage : anciennes versions de fonctions et fonctions mortes */
h=require('./shake.js')(h,true);
/* 17. sommaire en tête du script principal */
const TOC='/* ==========================================================================\n   RISK OP — fichier assemblé par tools/build.js (ne pas modifier à la main : modifier src/ puis reconstruire)\n   SOMMAIRE DU SCRIPT PRINCIPAL\n   1. Socle du jeu (src/base) : son, carte, règles, IA, diplomatie, âges, rendu de base, interface, réseau\n   2. Couche RISK OP (src/js), dans l\'ordre :\n'+MODS.map(f=>'      - '+f).join('\n')+'\n   3. Boucle principale\n   Le mini-jeu « Combat arcade » est un second script indépendant, inchangé.\n   ========================================================================== */\n';
rep("<script>\n(()=>{\n'use strict';","<script>\n"+TOC+"/* global claude */\n(()=>{\n'use strict';");
if(web){const lib=fs.readFileSync(root+'tools/vendor/peerjs-1.5.5.min.js','utf8').replace(/<\/script/gi,'<\\/script');
  rep('<script>\n/* ==========================================================================\n   RISK OP','<script>/* PeerJS 1.5.5 (licence MIT) — réseau pair-à-pair pour le multijoueur hors claude.ai */\n'+lib+'\n</script>\n<script>\n/* ==========================================================================\n   RISK OP');}
fs.writeFileSync(root+'dist/'+(test?'risk_test.html':web?'index.html':'risk_op.html'),h);
console.log('ok',(test?'test':web?'web (index.html)':'release'),h.length,'octets');
