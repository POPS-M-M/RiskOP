/* OP Adventure : ressources, recrutement (Berrys + Recrues), Haki, Fruits, champions au combat, améliorations de bâtiments,
   Ralliement par l'Influence, migration d'une ancienne sauvegarde, rendu de tous les onglets. Usage : node tests/t_op_adventure.js [dist/risk_test.html] */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1400,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+require('path').resolve(process.argv[2]||__dirname+'/../dist/risk_test.html'));
await p.evaluate(()=>{localStorage.clear();localStorage.setItem('gl-tuto','1');localStorage.setItem('rk-tob','{"off":1}');});await p.reload();await p.waitForTimeout(800);
const res=await p.evaluate(()=>{
 const X=__RK,O=X.OPX,R=[];const ok=(n,c,d)=>R.push((c?'PASS ':'FAIL ')+n+(d!==undefined?' — '+(typeof d==='string'?d:JSON.stringify(d)):''));
 X.newGame(2024,'normal',{crews:[1,0,2,3],turn:false,pk:3});X.started=true;document.querySelector('#overlay').hidden=true;
 const me=X.players[0],cap=X.terrs.find(t=>t.owner===0&&t.capital);
 ok('départ : 24 Recrues, Haki et Fruits initialisés',me.faith>=24&&me.x.hk&&Array.isArray(me.x.fu),{f:me.faith,hk:me.x.hk});
 ok('unités : 6 types, Mangeur de Fruit retiré',O.UK.join()==='guerrier,lancier,archer,cavalier,catapulte,elite'&&X.UNITS.cavalier.n==="Unité d'assaut"&&cap.u.elite===0);
 /* recrutement */
 me.gold=500;me.faith=30;const g0=me.gold,f0=me.faith;const r1=X.recruit(me,cap,'guerrier');
 ok('recruter : Berrys et Recrues consommés',r1===''&&me.gold<g0&&me.faith===f0-O.recruitMen(me,cap,'guerrier'),{g:g0-me.gold,f:f0-me.faith});
 me.faith=1;ok('recruter sans Recrues : refusé',/Recrues insuffisantes/.test(X.recruit(me,cap,'guerrier')));
 /* Haki */
 me.sci=999;me.faith=999;ok('Haki sans Dojo : refusé',/Dojo/.test(O.opHakiReason(me,'a')),O.opHakiReason(me,'a'));
 cap.city.b.push('temple');ok('Haki rang 1 (Armement)',O.opHakiBuy(me,'a')===''&&me.x.hk.a===1&&me.mod.atk>=.04);
 ok('Haki rang 2 bloqué à l\'âge I',/âge/.test(O.opHakiReason(me,'a')),O.opHakiReason(me,'a'));
 /* améliorations de bâtiment */
 me.techs.bronze=1;me.techs.fer=1;me.techs.elite=1;X.recalc(me);cap.city.b.push('caserne');cap.city.lvl=3;
 const sl0=cap.city.b.length;ok('Base militaire : constructible sur le Camp',O.buildReason(me,cap,'base_mil')==='',O.buildReason(me,cap,'base_mil'));
 O.startBuild(me,cap,'base_mil');for(let i=0;i<200&&cap.city.q;i++)X.step(.5);
 ok('Base militaire remplace le Camp (pas de place en plus)',cap.city.b.includes('base_mil')&&!cap.city.b.includes('caserne')&&cap.city.b.length===sl0,cap.city.b);
 ok('Camp non reconstructible après amélioration',/amélioré/.test(O.buildReason(me,cap,'caserne')),O.buildReason(me,cap,'caserne'));
 ok('Élite moins chère en Recrues à la Base militaire',O.recruitMen(me,cap,'elite')<X.UNITS.elite.rc);
 /* champions : Zoro (Haki des Rois [C]) attaque une île tenue par Kaido */
 const zi=X.LEGENDS.findIndex(L=>L.s==='Zoro'),ki=X.LEGENDS.findIndex(L=>L.s==='Kaido'),ai=X.LEGENDS.findIndex(L=>L.s==='Ace');
 const tgt=X.terrs[cap.nb.find(n=>X.terrs[n].boss===undefined&&X.terrs[n].owner<0)];
 tgt.owner=1;tgt.u=O.emptyU();tgt.u.guerrier=24;X.rel()[0][1]=X.rel()[1][0]='war';
 O.CH[zi].own=0;O.CH[zi].post=cap.id;O.CH[ki].own=1;O.CH[ki].post=tgt.id;X.recalc(X.players[1]);
 cap.u=O.emptyU();cap.u.guerrier=60;
 const pZ=O.opChPow({k:'c',i:zi},0,1),pK=O.opChPow({k:'c',i:ki},1,0);
 ok('puissance : Kaido (légendaire, Zoan) > Zoro (rare)',pK>pZ&&pZ>10,{zoro:Math.round(pZ),kaido:Math.round(pK)});
 const D0=O.defTotal(tgt,cap.u,false),k0=O.CH[ki].post;O.CH[ki].post=-1;const D1=O.defTotal(tgt,cap.u,false);O.CH[ki].post=k0;
 ok('défense : Kaido posté renforce l\'île',D0>D1*1.5,{avec:Math.round(D0),sans:Math.round(D1)});
 const lr=X.launch(0,cap.id,tgt.id,1,0);const A=O.armies.find(a=>a.owner===0&&a.to===tgt.id);
 ok('départ : Zoro embarque avec l\'armée (jamais sur deux fronts)',lr===''&&A&&A.ch.length===1&&O.CH[zi].post===-1&&O.CH[zi].army===A.id,{lr,ch:A&&A.ch});
 ok('poste refusé pendant la traversée',/en mer/.test(O.postChar(me,zi,cap.id)));
 for(const q of X.players)if(!q.human)q.ai.t=1e9;
 for(let i=0;i<400&&O.armies.includes(A);i++)X.step(.25);
 const rep=O.BATTLES.filter(r=>r.att===0&&r.to===tgt.id).pop();
 ok('rapport : champions, techniques et duel',!!(rep&&rep.op&&rep.op.a.includes('Zoro')&&rep.op.d.includes('Kaido')&&rep.op.duel),rep?JSON.stringify(rep).slice(0,600):'aucun rapport '+O.BATTLES.length+' '+JSON.stringify(O.BATTLES.map(r=>[r.att,r.def,r.to])));
 ok('rapport : texte du Haki des Rois',!!(rep&&rep.op&&rep.op.n.some(z=>/Haki des Rois/.test(z[1]))));
 const zc=O.CH[zi],kc=O.CH[ki];
 ok('après la bataille : un champion blessé ou replacé, aucun en mer',zc.army===0&&kc.army===0&&(zc.hurt>O.time||kc.hurt>O.time||zc.post>=0||kc.post>=0),{zoro:zc,kaido:kc,win:rep&&rep.win});
 ok('rapport HTML affiché',/Champions au combat/.test(O.opBattleHTML(rep)));
 /* Logia : Ace contre un camp sans Haki de l'Armement */
 const pAce1=O.opChPow({k:'c',i:ai},2,3);X.players[3].x.hk.a=1;const pAce2=O.opChPow({k:'c',i:ai},2,3);
 ok('Logia : bonus perdu face au Haki de l\'Armement',pAce1>pAce2*1.25,{sans:Math.round(pAce1),avec:Math.round(pAce2)});
 X.players[3].techs.fer=1;ok('granit marin : utilisateur de Fruit affaibli',O.opChPow({k:'c',i:ai},2,3)<pAce2);
 /* Fruits introuvables */
 const fs=X.terrs.find(t=>t.fruit&&t.boss===undefined);fs.owner=0;me.gold=999;me.faith=999;me.x.inf=99;
 const fty=fs.fruit;ok('manger le Fruit : un utilisateur identifié',O.opEat(me,fs)===''&&me.x.fu.length===1&&!fs.fruit&&me.x.fu[0].ty===fty,me.x.fu[0]);
 ok('plafond : au plus 2 utilisateurs par camp',/Il faut tenir|Aucun Fruit/.test(O.opEatReason(me,fs)));
 const fu=me.x.fu[0];ok('affecter l\'utilisateur',O.exec(0,{k:'fpost',id:fu.id,t:cap.id})===''&&fu.post===cap.id,O.exec(0,{k:'fpost',id:fu.id,t:cap.id}));
 /* Ralliement par l'Influence */
 const nb=X.terrs.find(t=>t.owner<0&&t.boss===undefined&&!t.capital&&t.nb.some(n=>X.terrs[n].owner===0));
 me.x.inf=0;ok('Ralliement sans Influence : refusé',/Influence/.test(O.convertReason(me,nb)),O.convertReason(me,nb));
 me.x.inf=50;const i0=me.x.inf;ok('Ralliement payé en Influence',O.convert(me,nb)&&me.x.inf===i0-O.convertCost({owner:-1},me)&&nb.owner===0);
 /* commande réseau */
 ok('commande « haki » via exec',typeof O.exec(0,{k:'haki',h:'o'})==='string');
 /* rendu de tous les onglets */
 const tabs=['army','eco','city','tech','leg','dip','obj','age','jrn','rel'];const bad=[];
 for(const tb of tabs){X.ui.tab=tb;try{const h=O.panelHTML();if(!h||h.length<50)bad.push(tb+':vide');}catch(e){bad.push(tb+':'+e.message);}}
 ok('rendu des 10 onglets',bad.length===0,bad.join(' | '));
 X.ui.tab='rel';const hk=O.panelHTML();ok('onglet Haki : Observation, Armement, Rois, Ralliement',/Observation/.test(hk)&&/Armement/.test(hk)&&/Haki des Rois/.test(hk)&&/Ralliement/.test(hk));
 X.ui.tab='leg';const lg=O.panelHTML();ok('onglet Équipe : combat des commandants et utilisateurs de Fruit',/Au combat/.test(lg)&&/Utilisateurs de Fruit/.test(lg));
 X.ui.tab='army';X.ui.sel=cap.id;const ar=O.panelHTML();ok('recrutement : coût en ⚔ affiché',/⚔/.test(ar));
 /* ancienne sauvegarde : Voie, sans Haki ni Fruits ni Unités d'élite */
 const S=JSON.parse(JSON.stringify(O.svBuild('vieille')));
 for(const q of S.G.players){delete q.x.hk;delete q.x.fu;q.religion='gardiens';q.ferveur=true;}
 for(const t of S.G.terrs)delete t.u.elite;for(const c of S.G.CH){delete c.army;delete c.hurt;}
 const why=O.svRestore(S);const P0=X.players[0];
 ok('ancienne sauvegarde : chargée et migrée',why===''&&P0.religion===null&&P0.x.hk.a>=1&&Array.isArray(P0.x.fu)&&X.terrs.every(t=>t.u.elite===0||t.u.elite>0),why);
 for(let i=0;i<40;i++)X.step(.5);
 ok('ancienne sauvegarde : la partie tourne',X.players.every(q=>isFinite(q.gold)&&isFinite(q.faith)));
 return R;});
console.log(res.join('\n'));console.log('page errors',errs.length,errs.slice(0,5));
const nf=res.filter(x=>x.startsWith('FAIL')).length;console.log(nf?nf+' échec(s)':'tout passe');await b.close();process.exit(nf||errs.length?1:0);})();
