/* ================= MODE « COURSE VERS LAUGH TALE » (version test / OP Adventure) =================
   5 sièges indépendants : Marine, Armée révolutionnaire et 3 équipages pirates (même faction « pirate », données séparées).
   Règles et IA reprises du banc de simulation de la phase 2 (rapport du 22/11/2026), avec les choix recommandés en section 11 :
   déchiffrage « à proximité » (tenir l'île ou une île voisine, 120 s), plusieurs équipages en même temps ; positions C5 ;
   diplomatie libre ; phase finale de 300 s après l'âge III ; l'IA n'attaque que les boss qui gardent ses objectifs ; revenu ×1 pour tous.
   Toutes les règles sont conditionnées à CS.on ; CS est déclaré dans <head> (tools/build.js, bloc 27).
   Durées exprimées au rythme Standard (PK 6), mises à l'échelle du rythme comme le déchiffrage d'origine. */
(function(){
const R=Math.round,K=()=>PK/6;
const nm=s=>{const t=terrs.find(t=>t.name===s);if(!t)throw new Error('île '+s);return t.id;};
let H=null;
function hopsAll(){const n=terrs.length;H=terrs.map((_,s)=>{const d=Array(n).fill(99);d[s]=0;const q=[s];while(q.length){const u=q.shift();for(const v of terrs[u].nb)if(d[v]>d[u]+1){d[v]=d[u]+1;q.push(v);}}return d;});}
/* ---- sièges proposés (configuration C5 du rapport) ---- */
const SEATS=[
  {k:'marine',role:'marine',crew:0,cap:'Enies Lobby',n:'Marine',d:'Protéger les bases, contrôler les passages, frapper les pirates, puis dominer les mers.'},
  {k:'revo',role:'revo',crew:2,cap:'Île de Winner',n:'Armée révolutionnaire',d:'Libérer les îles de la Marine, rallier les peuples, puis prendre Mary Geoise.'},
  {k:'pa',role:'pirate',crew:1,cap:'Ohara',n:'Équipage d\'Ohara',d:'Déchiffrer les 4 Ponéglyphes de Route, tenir Lodestar, puis Laugh Tale.'},
  {k:'pb',role:'pirate',crew:1,cap:'Karai Bari',n:'Équipage de Karai Bari',d:'Déchiffrer les 4 Ponéglyphes de Route, tenir Lodestar, puis Laugh Tale.'},
  {k:'pc',role:'pirate',crew:1,cap:'Green Bit',n:'Équipage de Green Bit',d:'Déchiffrer les 4 Ponéglyphes de Route, tenir Lodestar, puis Laugh Tale.'}];
const Q={easy:{obj:.5,bossM:1.4,decRes:2,prep:false},normal:{obj:1,bossM:1.15,decRes:1.3,prep:true},hard:{obj:1.5,bossM:1.05,decRes:1,prep:true}};
const qOf=dk=>Q[dk==='expert'?'hard':dk]||Q.normal;
const PONE_N=['Zou','Whole Cake Island','Pays des Wa','Île des Hommes-Poissons'];
const role=i=>CS.S&&CS.S[i]&&CS.S[i].role;
const own=(i,id)=>terrs[id].owner===i;
const capOf=i=>terrs.find(t=>t.owner===i&&t.capital);
const ev=(k,i,x)=>{if(CS.ev.length<4000)CS.ev.push([R(time),k,i,x]);};
const pn=i=>players[i]?players[i].name:'?';
const pnm=k=>terrs[CS.PONE[k]]?terrs[CS.PONE[k]].name:PONE_N[k];
const say=(txt,col)=>{try{addLog(txt,col||'#f2c75c');}catch(_){}};

Object.assign(CS,{SEATS,
  init(o){
    CS.on=true;CS.endOK=false;CS.o=Object.assign({dec:'prox',strat:'obj',boss:'obj',hold:60,fin:90,phase:300},o);hopsAll();
    CS.PONE=PONE_N.map(nm);CS.LS=nm('Lodestar');CS.LT=nm('Laugh Tale');CS.EG=nm('Egghead');CS.MG=nm('Mary Geoise');CS.CJ=nm('Cap des Jumeaux');
    CS.BASES=[['Nouveau Marineford',6],['Marineford',6],['Enies Lobby',6],['Impel Down',6],['Mary Geoise',6],['Loguetown',5],['Shells Town',5]].map(([s,v])=>[nm(s),v]);
    CS.PASS=['Cap des Jumeaux','Archipel des Sabaody','Marineford','Île des Hommes-Poissons','Lodestar','Egghead'].map(nm);
    CS.GOV=new Set(CS.BASES.map(b=>b[0]));
    CS.S=players.map(p=>({role:CS.o.roles[p.id],q:CS.o.q[p.id],found:[null,null,null,null],dec:[null,null,null,null],dj:null,
      lsT:0,lsDone:null,open:null,ltT:0,ltFirst:null,baseT:{},baseDone:{},passT:{},passDone:{},kills:0,inter:0,lib:{},sup:{},inst:{},prepT:0,prepDone:null,finT:0,finStart:null}));
    CS.ev=[];CS.endT=null;CS.win=null;CS.last=terrs.map(t=>t.owner);CS.lastCity=terrs.map(t=>!!t.city);CS.warned={};
  },
  prog(i){
    const S=CS.S&&CS.S[i];if(!S)return 0;
    if(S.role==='pirate')return S.found.filter(v=>v!==null).length*5+S.dec.filter(v=>v!==null).length*15+(S.lsDone!==null?20:0);
    if(S.role==='marine'){let b=0;for(const [id,v] of CS.BASES)if(S.baseDone[id])b+=v;return b+Math.min(30,Math.floor(S.kills/10)+3*S.inter)+Object.keys(S.passDone).length*5;}
    return Math.min(40,Object.keys(S.lib).length*2)+Math.min(20,Object.keys(S.sup).length*2)+Math.min(20,Object.keys(S.inst).length*4)+(S.prepDone!==null?20:0);
  },
  /* ---- Laugh Tale : route révélée seulement à l'équipage qui a ses 4 déchiffrages et a tenu Lodestar ---- */
  veto(p,x){if(x.id!==CS.LT)return false;const S=CS.S[p.id];if(x.owner<0)return !(S.role==='pirate'&&S.open!==null);return false;},
  blockLaunch(pid,to){if(to!==CS.LT)return false;const t=terrs[to],S=CS.S[pid];if(S&&S.role==='pirate'&&S.open!==null)return false;return !(t.owner>=0&&t.owner!==pid);},
  bossOK(p,x){if(CS.o.boss!=='obj')return true;return CS.targets(p).includes(x.id);},
  bossEval(p,from,x,avU){
    if(!CS.bossOK(p,x))return null;
    const S=CS.S[p.id],need=rkBossNeed(x.boss);if(!isFinite(need))return null;
    const A=attTotal(p.id,avU,x,true,from.id,undefined,0);
    if(A<need*S.q.bossM)return null;
    return {sc:(A/need)*CS.w(p,x)*(x.pone?1.4:1)*1.3};
  },
  targets(p){
    const S=CS.S[p.id],i=p.id,out=[];
    if(S.role==='pirate'){
      if(S.open!==null)return [CS.LT,CS.LS];
      const left=CS.PONE.filter((id,k)=>S.dec[k]===null);
      return left.length?left:[CS.LS];
    }
    if(S.role==='marine'){
      for(const [id] of CS.BASES)if(!own(i,id))out.push(id);
      for(const id of CS.PASS)if(!own(i,id))out.push(id);
      for(const id of CS.PONE)if(terrs[id].owner>=0&&role(terrs[id].owner)==='pirate')out.push(id);
      if(terrs[CS.LT].owner>=0)out.push(CS.LT);
      return out;
    }
    if(CS.prog(i)>=80)out.push(CS.CJ,CS.MG);
    for(const t of terrs)if(t.owner>=0&&role(t.owner)==='marine')out.push(t.id);
    return out;
  },
  w(p,x){
    const S=CS.S[p.id];if(!S||CS.o.strat==='base')return 1;
    const tg=CS.targets(p);if(!tg.length)return 1;
    let d=99;for(const g of tg)d=Math.min(d,H[x.id][g]);
    const w=tg.includes(x.id)?3:1+1.2/(1+d);
    return 1+(w-1)*S.q.obj;
  },
  stage(p,t){const S=CS.S[p.id];if(!S||!S.q.prep||CS.o.strat==='base')return 0;const tg=CS.targets(p);return t.nb.some(n=>tg.includes(n))?30:0;},
  /* ---- déchiffrage à proximité : tenir l'île ou une île voisine ---- */
  decOK(i,k){const id=CS.PONE[k];return own(i,id)||terrs[id].nb.some(n=>own(i,n));},
  decLen(){return decDur()*1.5;},
  decWhy(i,k){
    const S=CS.S[i],p=players[i];if(!S||S.role!=='pirate')return 'Seuls les équipages pirates déchiffrent les Ponéglyphes.';
    if(S.dec[k]!==null)return 'Déjà déchiffré.';if(S.dj)return 'Un déchiffrage est déjà en cours.';
    if(!CS.decOK(i,k))return 'Il faut tenir l\'île ou une île voisine.';
    const c=decCost(p);if(p.gold<c.g)return 'Berrys insuffisants ('+c.g+' requis).';if(p.sci<c.s)return 'Savoir insuffisant ('+c.s+' requis).';
    return '';
  },
  decStart(i,k){const w=CS.decWhy(i,k);if(w)return w;const p=players[i],c=decCost(p);p.gold-=c.g;p.sci-=c.s;CS.S[i].dj={k,e:0,t0:time};ev('decStart',i,k);
    if(i===ME)say('Déchiffrage du Ponéglyphe de '+pnm(k)+' commencé ('+R(CS.decLen())+' s).');dirty=true;return '';},
  aiDec(p){
    const S=CS.S[p.id];if(!S||S.role!=='pirate'||S.dj||p.human)return;
    const c=decCost(p);if(p.gold<c.g*S.q.decRes||p.sci<c.s*S.q.decRes)return;
    for(let k=0;k<4;k++)if(S.dec[k]===null&&CS.decOK(p.id,k)){CS.decStart(p.id,k);return;}
  },
  prepWhy(i){const S=CS.S[i],p=players[i];if(!S||S.role!=='revo')return 'Réservé à l\'Armée révolutionnaire.';if(S.prepDone!==null)return 'Préparation terminée.';if(S.prepT>0)return 'Préparation en cours.';
    if(CS.prog(i)<40)return 'Il faut 40 points de libération, de soutien et d\'installations.';if(!capOf(i))return 'Il faut tenir votre capitale.';
    const cg=R(150*K()),cs=R(80*K());if(p.gold<cg||p.sci<cs)return 'Il faut '+cg+' ฿ et '+cs+' de savoir.';return '';},
  prepStart(i){const w=CS.prepWhy(i);if(w)return w;const p=players[i];p.gold-=R(150*K());p.sci-=R(80*K());CS.S[i].prepT=1;ev('prepStart',i);say(pn(i)+' prépare son opération contre Mary Geoise.','#ff9a7a');dirty=true;return '';},
  /* ---- chaque seconde ---- */
  sec(){
    if(!CS.on||over)return;
    const hold=CS.o.hold*K(),fin=CS.o.fin*K();
    for(const t of terrs){
      const a=CS.last[t.id],b=t.owner;
      if(a!==b){
        if(b>=0){const Sb=CS.S[b];
          if(Sb.role==='pirate'){const k=CS.PONE.indexOf(t.id);if(k>=0&&Sb.found[k]===null){Sb.found[k]=time;ev('found',b,k);}}
          if(Sb.role==='revo'&&a>=0&&role(a)==='marine'){Sb.lib[t.id]=1;if(CS.lastCity[t.id])Sb.inst[t.id]=1;}
          if(Sb.role==='revo'&&CS.GOV.has(t.id))Sb.lib[t.id]=1;
          if(Sb.role==='marine'&&a>=0&&role(a)==='pirate'){const Sa=CS.S[a];if(Sa.dj&&CS.PONE[Sa.dj.k]===t.id){Sb.inter++;ev('inter',b,a);}}
        }
        if(t.id===CS.LT&&b>=0&&role(b)==='pirate'&&CS.S[b].ltFirst===null){CS.S[b].ltFirst=time;ev('ltFirst',b);}
        CS.last[t.id]=b;
      }
      CS.lastCity[t.id]=!!t.city;
    }
    {const t=terrs[CS.LT];if(t.owner>=0){const S=CS.S[t.owner];if(!(S.role==='pirate'&&S.open!==null)){const o=t.owner;t.owner=-1;CS.last[t.id]=-1;ev('ltRepousse',o);say(pn(o)+' repousse l\'expédition : Laugh Tale redevient indépendante.','#9ec5ff');dirty=true;}}}
    for(const p of players){
      if(!p.alive)continue;const i=p.id,S=CS.S[i];
      if(S.role==='pirate'){
        if(S.dj){if(!CS.decOK(i,S.dj.k)){ev('decLost',i,S.dj.k);if(i===ME)say('Déchiffrage interrompu : vous ne tenez plus '+pnm(S.dj.k)+' ni une île voisine.','#e66');S.dj=null;}
          else{S.dj.e+=1;if(S.dj.e>=CS.decLen()){const k=S.dj.k;S.dec[k]=time;if(S.found[k]===null)S.found[k]=time;p.x.dc.push(CS.PONE[k]);p.sci+=R(40*K());recalc(p);ev('dec',i,k);S.dj=null;
            if(!CS.knows||CS.knows(ME,i)||CS.seeT(CS.PONE[k],ME))say(pn(i)+' déchiffre le Ponéglyphe de Route de '+pnm(k)+' ('+S.dec.filter(v=>v!==null).length+'/4).',p.color);}}}
        if(S.dec.every(v=>v!==null)&&S.lsDone===null){if(own(i,CS.LS)){S.lsT+=1;if(S.lsT>=hold){S.lsDone=time;ev('lodestar',i);}}else S.lsT=0;}
        if(S.open===null&&CS.prog(i)>=100){S.open=time;ev('open',i);say('☠ La route de Laugh Tale est révélée à '+pn(i)+' : son expédition peut partir de Lodestar ou d\'Egghead.','#ff9a7a');}
        if(S.open!==null){if(own(i,CS.LT)){if(S.finStart===null){S.finStart=time;say('⚠ '+pn(i)+' a débarqué sur Laugh Tale : il gagne s\'il la tient '+R(fin)+' s.','#ff6a5e');}S.ltT+=1;if(S.ltT>=fin)return CS.victory(i,'tient Laugh Tale : le One Piece est à lui.');}else{S.ltT=0;S.finStart=null;}}
      }else if(S.role==='marine'){
        for(const [id] of CS.BASES){if(own(i,id)){S.baseT[id]=(S.baseT[id]||0)+1;if(!S.baseDone[id]&&S.baseT[id]>=hold){S.baseDone[id]=time;ev('base',i,id);}}else S.baseT[id]=0;}
        for(const id of CS.PASS){if(own(i,id)){S.passT[id]=(S.passT[id]||0)+1;if(!S.passDone[id]&&S.passT[id]>=hold){S.passDone[id]=time;ev('pass',i,id);}}else S.passT[id]=0;}
        if(!CS.o.v2&&CS.prog(i)>=100){
          const nb=CS.BASES.filter(([id])=>own(i,id)).length,np=CS.PASS.filter(id=>own(i,id)).length,lt=terrs[CS.LT].owner;
          if(nb>=5&&np>=4&&!(lt>=0&&role(lt)==='pirate')){if(S.finStart===null){S.finStart=time;ev('finStart',i);say('⚠ La Marine lance la Domination des mers : elle gagne si elle garde 5 bases et 4 passages '+R(fin)+' s.','#ff6a5e');}S.finT+=1;if(S.finT>=fin)return CS.victory(i,'domine les mers.');}
          else{S.finT=0;S.finStart=null;}
        }
      }else{
        if(S.prepDone===null&&S.prepT===0&&!p.human&&!CS.prepWhy(i))CS.prepStart(i);
        if(S.prepDone===null&&S.prepT>0){if(capOf(i)){S.prepT+=1;if(S.prepT>=120*K()){S.prepDone=time;ev('prep',i);say(pn(i)+' a terminé ses préparatifs contre Mary Geoise.','#ff9a7a');}}else{S.prepT=0;ev('prepLost',i);if(i===ME)say('Préparation perdue : votre capitale est tombée.','#e66');}}
        if(!CS.o.v2&&CS.prog(i)>=100){if(own(i,CS.MG)&&own(i,CS.CJ)){if(S.finStart===null){S.finStart=time;ev('finStart',i);say('⚠ L\'Armée révolutionnaire tient Mary Geoise et le Cap des Jumeaux : elle gagne si elle les garde '+R(fin)+' s.','#ff6a5e');}S.finT+=1;if(S.finT>=fin)return CS.victory(i,'prend Mary Geoise.');}else{S.finT=0;S.finStart=null;}}
      }
    }
    if(CS.endT!==null&&time>=CS.endT+CS.o.phase*K()){if(CS.o.v2&&CS.finalV2&&CS.finalV2())return;CS.endOK=true;endGame([],'Fin de la phase finale : aucune opération finale n\'a réussi, la partie se termine sans vainqueur.');return;}
    CS.hud();
  },
  victory(i,why){CS.win={i,why,t:R(time),role:role(i)};ev('win',i,why);CS.endOK=true;endGame([i],pn(i)+' '+why);},
  ageEnd(){if(CS.endT===null){CS.endT=time;ev('ageEnd',-1);say('Fin de l\'âge III : la phase finale commence. Seule une opération finale réussie dans les '+R(CS.o.phase*K())+' s désigne un vainqueur.','#f2c75c');}},
  wrapArrival(orig){return function(a){
    const t=terrs[a.to],d0=t?t.owner:-1,D0=t?tr(t):0;
    const r=orig.apply(this,arguments);
    if(CS.on&&t&&d0>=0&&role(a.owner)==='marine'&&role(d0)==='pirate'){const after=t.owner===d0?tr(t):0;CS.S[a.owner].kills+=Math.max(0,D0-after);}
    return r;};},
  save(){return {o:CS.o,S:CS.S,endT:CS.endT,last:CS.last,lastCity:CS.lastCity,win:CS.win,ev:CS.ev.slice(-500)};},
  load(z){CS.on=true;CS.endOK=false;CS.init(z.o);Object.assign(CS,{S:z.S,endT:z.endT,last:z.last,lastCity:z.lastCity,win:z.win,ev:z.ev||[]});CS.hud(true);}
});

/* ---- démarrage d'une partie Course : le joueur humain prend toujours le siège 0 (ME = 0) ---- */
/* décor derrière l'écran d'accueil (partie non lancée) : les cinq sièges de la Course, pas les quatre camps de la partie classique */
CS.backdrop=function(sd){newGame(sd,'normal',{crews:SEATS.map(s=>s.crew),names:SEATS.map(s=>s.n),humans:SEATS.map((_,i)=>i===0),caps:SEATS.map(s=>s.cap),noBonus:true});};
CS.start=function(o){
  const mine=SEATS.findIndex(s=>s.k===o.seat),order=[mine,...SEATS.map((_,i)=>i).filter(i=>i!==mine)];
  const seats=order.map(i=>SEATS[i]);
  MODE='solo';ME=0;
  newGame(o.seed,o.dk,{crews:seats.map(s=>s.crew),names:seats.map(s=>s.n),humans:seats.map((_,i)=>i===0),caps:seats.map(s=>s.cap),noBonus:true,turn:!!o.turn,pk:o.pk});
  MODE='solo';ME=0;
  CS.init({roles:seats.map(s=>s.role),q:seats.map(()=>qOf(o.dk)),seats:seats.map(s=>s.k),v2:!!o.v2,pone:o.pone||'canon'});
  started=true;speed=TM.on?2:1;overlay.hidden=true;try{updateHint();}catch(_){}renderPanel(true);
  {const c=capOf(0);if(c){ui.sel=c.id;try{centerOn(c.id);}catch(_){}}}
  say('Course vers Laugh Tale : vous jouez '+players[0].name+'. '+seats[0].d,'#f2c75c');
  CS.hud(true);
};

/* ---- branchements ---- */
{const d0=decTick;decTick=function(){d0();if(CS.on)CS.sec();};}
resolveArrival=CS.wrapArrival(resolveArrival);
{const a0=annex;annex=function(p,t){const r=a0(p,t);if(CS.on&&r===''&&role(p.id)==='revo')CS.S[p.id].sup[t.id]=1;return r;};}
{const c0=convert;convert=function(p,t){const r=c0(p,t);if(CS.on&&r&&role(p.id)==='revo')CS.S[p.id].sup[t.id]=1;return r;};}
/* sauvegardes : emplacements séparés, format v:2 */
if(CS.only){SV.keys=['rk-c1','rk-c2','rk-c3'];SV.auto='rk-ca';}
{const b0=svBuild;svBuild=function(name){const o=b0(name);if(CS.on){o.v=2;o.G.course=CS.save();o.meta.course=1;o.meta.camp=players[ME].name;}return o;};}
{const r0=svRestore;svRestore=function(o){if(CS.only&&!(o&&o.G&&o.G.course))return 'Cette sauvegarde n\'est pas une partie de la Course vers Laugh Tale.';CS.on=false;const m=r0(o);if(!m&&o.G&&o.G.course)CS.load(o.G.course);return m;};}
/* une partie classique lancée par un test ou le guide désactive le mode Course */
{const n0=newGame;newGame=function(){CS.on=false;CS.S=null;const h=document.getElementById('cs-hud');if(h)h.hidden=true;return n0.apply(this,arguments);};}

/* ---- version Course seule : les autres modes n'ont plus d'entrée (Campagne, tutoriel en partie classique, multijoueur à 4) ---- */
if(CS.only){
  const back=(m)=>()=>{toast(m);showIntro();};
  campMenu=back('La Campagne n\'existe pas dans OP Adventure : seule la Course vers Laugh Tale est proposée.');
  campPlay=back('La Campagne n\'existe pas dans OP Adventure : seule la Course vers Laugh Tale est proposée.');
  rkStartTutorial=back('Le guide interactif porte sur la partie classique : il n\'est pas proposé dans OP Adventure.');
  mpEnter=back('Le jeu en ligne n\'est pas encore disponible pour la Course à 5 sièges.');
  /* règles : celles de la Course d'abord ; les sections propres aux autres modes ou remplacées par la Course sont retirées */
  const sr0=showRules;showRules=function(){sr0();const el=document.getElementById('rulesov');if(!el)return;
    const hors=/^(Le but du jeu|Combat arcade|Mode Campagne|Victoires du Nouveau Monde|Déchiffrer les Poneglyphes|Tutoriel et bilan|Jouer à plusieurs)/;
    el.querySelectorAll('details').forEach(d=>{const s=d.querySelector('summary');if(s&&hors.test(s.textContent.trim()))d.remove();});
    const h2=el.querySelector('h2');if(h2){h2.textContent='Règles — Course vers Laugh Tale';const d=document.createElement('details');d.open=true;d.innerHTML='<summary>La Course vers Laugh Tale (règles de ce mode)</summary><div class="rb">'+rulesCourse()+'</div>';const n=el.querySelector('.note');(n||h2).after(d);}};
}
/* ---- écran d'accueil : seulement le mode Course ---- */
let seatPick='pa';try{seatPick=localStorage.getItem('rk-cseat')||'pa';}catch(_){}
if(!SEATS.some(s=>s.k===seatPick))seatPick='pa';
function rulesCourse(){
  if(CS.rulesV2&&CS.ruleSel&&CS.ruleSel()==='v2')return CS.rulesV2();
  return '<ul>'
   +'<li><b>Cinq sièges</b> : la Marine, l\'Armée révolutionnaire et trois équipages pirates rivaux. Les places que vous ne prenez pas sont jouées par l\'IA, sans aucun bonus de ressources.</li>'
   +'<li><b>Pirates</b> : trouver puis déchiffrer les 4 Ponéglyphes de Route (Zou, Whole Cake Island, Pays des Wa, Île des Hommes-Poissons). On déchiffre en tenant l\'île <b>ou une île voisine</b> pendant '+R(80*1.5)+' s au rythme Standard ; plusieurs équipages peuvent déchiffrer le même. Puis tenir Lodestar 60 s : la route de Laugh Tale s\'ouvre pour vous seul. Victoire : tenir Laugh Tale 90 s.</li>'
   +'<li><b>Marine</b> : tenir ses 7 bases et les 6 passages (60 s chacun), détruire des troupes pirates en attaquant, interrompre leurs déchiffrages. À 100 points : garder ensemble 5 bases et 4 passages 90 s, sans pirate sur Laugh Tale.</li>'
   +'<li><b>Révolutionnaires</b> : prendre des îles à la Marine, rallier des îles par l\'Influence, prendre ses villes, puis préparer l\'assaut (120 s à la capitale). À 100 points : tenir Mary Geoise et le Cap des Jumeaux 90 s.</li>'
   +'<li>Les points acquis ne se perdent pas ; l\'opération finale, elle, exige de tenir ses objectifs au moment même.</li>'
   +'<li><b>Brouillard de guerre</b> : vous voyez les garnisons et les flottes de vos îles, des îles voisines et de vos alliés ; ailleurs, la dernière observation (≈) ou « ? ». La possession des îles reste publique. La progression d\'un rival n\'est connue que par un renseignement (avis de recherche, agent dans sa capitale, alliance). Les opérations finales sont annoncées à tous.</li>'
   +'<li><b>Opérations</b> (panneau Course) — Marine : réseau des bases (vue à 2 îles), Localisation (avis de recherche), Blocus, Buster Call, Poursuite. Révolutionnaires : Infiltration d\'agents cachés, Sabotage, Insurrection. Pirates : Se faire discret. Les alliés partagent leur vue.</li>'
   +'<li>À la fin de l\'âge III s\'ouvre une <b>phase finale</b> de 300 s (rythme Standard) : sans opération finale réussie, pas de vainqueur. Éliminer tous les autres sièges fait aussi gagner.</li>'
   +'<li>Laugh Tale ne se rallie pas et n\'accepte que l\'équipage dont la route est révélée ; un adversaire qui l\'en chasse la rend indépendante. Pas de victoire commune d\'alliance, pas de victoire par vassalité, pas de projets.</li>'
   +'</ul>';
}
const si0=showIntro;
showIntro=function(){
  si0();
  if(!CS.only)return;
  CS.on=false;{const h=document.getElementById('cs-hud');if(h)h.hidden=true;}
  const sd=seed||Math.floor(Math.random()*90000)+1000;
  const opt=(arr,cur)=>arr.map(([v,n])=>'<option value="'+v+'"'+(String(v)===String(cur)?' selected':'')+'>'+n+'</option>').join('');
  const L=(typeof svLatest==='function')?svLatest():null;
  overlay.innerHTML='<div class="intro cs-intro"><h2>RISK OP Adventure — Course vers Laugh Tale</h2>'
    +'<p class="lead">Cinq camps, une seule victoire : trois équipages pirates rivaux se disputent les Ponéglyphes de Route et Laugh Tale, pendant que la Marine tente de dominer les mers et que l\'Armée révolutionnaire marche sur Mary Geoise. Jeu de fan inspiré de One Piece, sans lien officiel.</p>'
    +'<details class="rules"><summary>Règles de la Course (cliquez pour déplier)</summary>'+rulesCourse()+'</details>'
    +'<h3>Votre siège</h3><div class="crews cs-seats" role="radiogroup" aria-label="Siège">'+SEATS.map(s=>'<button type="button" role="radio" aria-checked="'+(s.k===seatPick)+'" class="crew'+(s.k===seatPick?' on':'')+'" data-seat="'+s.k+'"><b>'+CREWS[s.crew].ic+' '+esc(s.n)+'</b><small>Départ : '+esc(s.cap)+'. '+esc(s.d)+'</small></button>').join('')+'</div>'
    +'<div class="row"><label for="o-diff">Difficulté de l\'IA<select id="o-diff">'+opt([['easy','Facile'],['normal','Normal'],['hard','Difficile']],diffKey==='expert'?'hard':diffKey)+'</select></label>'
    +'<label for="o-mode">Mode<select id="o-mode">'+opt([['turn','Tours simultanés'],['real','Temps réel']],modePick)+'</select></label>'
    +'<label for="o-pace">Rythme<select id="o-pace">'+opt(PACES.map(z=>[z.k,z.n]),pacePick)+'</select></label>'
    +(CS.ruleSel?'<label for="o-regle">Règles<select id="o-regle">'+opt([['v2','Autorité (nouvelles)'],['p2','Phase 2 (anciennes)']],CS.ruleSel())+'</select></label>':'')
    +'<label for="o-seed">Graine<input id="o-seed" type="number" min="1" value="'+sd+'"></label></div>'
    +'<p class="note">La difficulté change la qualité des décisions de l\'IA (rythme, priorités, préparation des attaques), jamais ses ressources.</p>'
    +'<div class="row" style="margin-bottom:6px"><button class="btn primary" id="o-go">Lancer la Course</button>'
    +(L?'<button class="btn" id="o-cont">Continuer · '+esc(L.o.meta.name)+'</button>':'')+'<button class="btn" id="o-saves">Sauvegardes</button></div></div>';
  overlay.querySelectorAll('[data-seat]').forEach(b=>b.addEventListener('click',()=>{seatPick=b.dataset.seat;overlay.querySelectorAll('[data-seat]').forEach(x=>{const on=x.dataset.seat===seatPick;x.classList.toggle('on',on);x.setAttribute('aria-checked',on);});}));
  $('#o-go').addEventListener('click',()=>{
    const dk=$('#o-diff').value,sdv=Math.max(1,parseInt($('#o-seed').value,10)||1);
    modePick=$('#o-mode').value==='real'?'real':'turn';pacePick=+$('#o-pace').value||6;
    try{localStorage.setItem('rk-cseat',seatPick);localStorage.setItem('gl-mode',modePick);localStorage.setItem('gl-pace',String(pacePick));}catch(_){}
    TU={on:false,i:0,seen:{},clk:0,fin:false};
    const rg=$('#o-regle')?$('#o-regle').value:'p2';try{localStorage.setItem('rk-cregle',rg);}catch(_){}
    CS.start({seat:seatPick,seed:sdv,dk,turn:modePick==='turn',pk:pacePick,v2:rg==='v2',pone:rg==='v2'?'cache':'canon'});
  });
  const c=$('#o-cont');if(c)c.addEventListener('click',()=>{const L=svLatest();if(!L){toast('Aucune sauvegarde.');return;}const m=svRestore(L.o);if(m){toast(m);showIntro();}else toast('Partie chargée : '+L.o.meta.name);});
  $('#o-saves').addEventListener('click',svOpen);
};

/* ---- panneau « Course » : progression de tous, objectifs et actions du joueur ---- */
function hudEl(){
  let h=document.getElementById('cs-hud');
  if(!h){h=document.createElement('div');h.id='cs-hud';h.setAttribute('role','region');h.setAttribute('aria-label','Course vers Laugh Tale');document.body.appendChild(h);
    h.addEventListener('click',e=>{const b=e.target.closest('[data-cs]');if(!b)return;const [a,v]=b.dataset.cs.split(':');
      if(a==='fold'){h.classList.toggle('fold');return;}
      if(a==='dec'){const m=CS.decStart(ME,+v);if(m)toast(m);CS.hud(true);return;}
      if(a==='prep'){const m=CS.prepStart(ME);if(m)toast(m);CS.hud(true);return;}
      if(a==='sel'){ui.sel=+v;try{centerOn(+v);}catch(_){}dirty=true;renderPanel(true);}});}
  return h;
}
const bar=(v,col)=>'<span class="cs-bar"><i style="width:'+Math.max(0,Math.min(100,v))+'%;background:'+col+'"></i></span>';
const isl=id=>'<a href="#" data-cs="sel:'+id+'" onclick="return false">'+esc(terrs[id].name)+'</a>';
CS.hud=function(force){
  if(!CS.on||!CS.S){const h=document.getElementById('cs-hud');if(h)h.hidden=true;return;}
  const h=hudEl();h.hidden=false;
  if(!force&&CS._hk===R(time)+':'+(over?1:0))return;CS._hk=R(time)+':'+(over?1:0);
  const fin=CS.o.fin*K(),me=ME,S=CS.S[me],p=players[me];
  const ok=b=>b?'<b class="cs-ok">✓</b>':'<b class="cs-no">·</b>';
  let mine='';
  if(S&&p&&p.alive){
    if(S.role==='pirate'){
      mine+='<div class="cs-h">Vos Ponéglyphes de Route</div>'+CS.PONE.map((id,k)=>{
        const st=S.dec[k]!==null?'déchiffré':S.dj&&S.dj.k===k?'déchiffrage '+R(S.dj.e)+'/'+R(CS.decLen())+' s':S.found[k]!==null?'trouvé':'—';
        const w=S.dec[k]===null&&!S.dj?CS.decWhy(me,k):'x';
        return '<div class="cs-r">'+ok(S.dec[k]!==null)+(CS.poneLbl?CS.poneLbl(me,k):isl(id))+' <small>'+st+'</small>'+(w===''?' <button class="btn cs-b" data-cs="dec:'+k+'">Déchiffrer</button>':'')+'</div>';}).join('');
      mine+='<div class="cs-r">'+ok(S.lsDone!==null)+'Tenir '+isl(CS.LS)+' 60 s'+(S.dec.every(v=>v!==null)&&S.lsDone===null?' <small>'+R(S.lsT)+'/'+R(CS.o.hold*K())+' s</small>':'')+'</div>';
      mine+='<div class="cs-r">'+ok(false)+'Tenir '+isl(CS.LT)+' '+R(fin)+' s'+(S.open!==null?' <small>route révélée'+(S.ltT?' · '+R(S.ltT)+'/'+R(fin)+' s':'')+'</small>':' <small>route fermée</small>')+'</div>';
    }else if(S.role==='marine'){
      mine+='<div class="cs-h">Bases (60 s chacune)</div><div class="cs-r cs-w">'+CS.BASES.map(([id])=>ok(S.baseDone[id])+isl(id)).join(' ')+'</div>';
      mine+='<div class="cs-h">Passages</div><div class="cs-r cs-w">'+CS.PASS.map(id=>ok(S.passDone[id])+isl(id)).join(' ')+'</div>';
      mine+='<div class="cs-r">Opérations : '+Math.min(30,Math.floor(S.kills/10)+3*S.inter)+'/30 <small>('+R(S.kills)+' pirates détruits en attaque, '+S.inter+' déchiffrages interrompus)</small></div>';
      const nb=CS.BASES.filter(([id])=>own(me,id)).length,np=CS.PASS.filter(id=>own(me,id)).length;
      mine+='<div class="cs-r">Domination : '+nb+'/5 bases et '+np+'/4 passages tenus'+(S.finT?' · '+R(S.finT)+'/'+R(fin)+' s':'')+'</div>';
    }else{
      mine+='<div class="cs-r">Îles libérées : '+Object.keys(S.lib).length+'/20 · soutien : '+Object.keys(S.sup).length+'/10 · villes prises : '+Object.keys(S.inst).length+'/5</div>';
      const w=CS.prepWhy(me);
      mine+='<div class="cs-r">'+ok(S.prepDone!==null)+'Préparation'+(S.prepT>0&&S.prepDone===null?' <small>'+R(S.prepT)+'/'+R(120*K())+' s</small>':'')+(w===''?' <button class="btn cs-b" data-cs="prep:0">Lancer (150 ฿, 80 ◈)</button>':'')+'</div>';
      mine+='<div class="cs-r">'+ok(false)+'Tenir '+isl(CS.MG)+' et '+isl(CS.CJ)+' '+R(fin)+' s'+(S.finT?' <small>'+R(S.finT)+'/'+R(fin)+' s</small>':'')+'</div>';
    }
  }
  const rows=players.map(q=>{const s=CS.S[q.id],kn=!CS.knows||CS.knows(me,q.id),v=kn?CS.prog(q.id):0,f=s.finStart!==null?' <b class="cs-alert">opération finale</b>':s.open!==null?' <small>route révélée</small>':'';
    return '<div class="cs-p'+(q.id===me?' me':'')+(q.alive?'':' dead')+'"><span class="sw" style="background:'+q.color+'"></span><span class="cs-n">'+esc(q.name)+'</span>'+bar(v,q.color)+'<b'+(kn?'':' title="Progression inconnue : il faut un renseignement (avis de recherche, agent dans sa capitale ou alliance)"')+'>'+(kn?v:'?')+'</b>'+f+'</div>';}).join('');
  const ph=CS.endT!==null?'<div class="cs-alert">Phase finale : '+Math.max(0,R(CS.endT+CS.o.phase*K()-time))+' s restantes</div>':'';
  h.innerHTML='<div class="cs-top"><b>☠ Course vers Laugh Tale</b><button class="cs-fold" data-cs="fold:0" title="Replier / déplier">▾</button></div><div class="cs-body">'+ph+rows+(mine?'<div class="cs-mine">'+mine+'</div>':'')+'</div>';
};
/* style du panneau */
{const st=document.createElement('style');st.textContent=
 '#cs-hud{position:fixed;left:12px;bottom:200px;z-index:40;width:min(320px,calc(100vw - 24px));max-height:46vh;overflow:auto;background:rgba(12,20,32,.93);color:#e8edf5;border:1px solid rgba(255,255,255,.14);border-radius:10px;font:12px/1.35 system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.35)}'
+'#cs-hud.fold .cs-body{display:none}#cs-hud .cs-top{display:flex;justify-content:space-between;align-items:center;padding:7px 10px;border-bottom:1px solid rgba(255,255,255,.1)}'
+'#cs-hud .cs-fold{background:none;border:0;color:inherit;cursor:pointer;font-size:14px}#cs-hud .cs-body{padding:6px 10px 9px}'
+'#cs-hud .cs-p{display:grid;grid-template-columns:10px 1fr 70px 26px;gap:6px;align-items:center;margin:3px 0}#cs-hud .cs-p.me .cs-n{font-weight:700}#cs-hud .cs-p.dead{opacity:.45;text-decoration:line-through}'
+'#cs-hud .cs-p small,#cs-hud .cs-p .cs-alert{grid-column:2/5;font-size:11px}#cs-hud .sw{width:10px;height:10px;border-radius:50%}'
+'#cs-hud .cs-bar{height:6px;background:rgba(255,255,255,.12);border-radius:3px;overflow:hidden;display:block}#cs-hud .cs-bar i{display:block;height:100%}'
+'#cs-hud .cs-mine{margin-top:7px;padding-top:6px;border-top:1px solid rgba(255,255,255,.1)}#cs-hud .cs-h{font-weight:700;margin:4px 0 2px;color:#f2c75c}'
+'#cs-hud .cs-r{margin:2px 0}#cs-hud .cs-w{line-height:1.7}#cs-hud .cs-ok{color:#6fdc8c}#cs-hud .cs-no{color:#8c97a6}#cs-hud .cs-alert{color:#ff8a70;font-weight:700}'
+'#cs-hud a{color:#9ec5ff;text-decoration:none}#cs-hud a:hover{text-decoration:underline}#cs-hud .cs-b{padding:1px 7px;font-size:11px;margin-left:4px}'
+'body.b3run #cs-hud{display:none}'+(CS.only?'#b-guide{display:none!important}':'');
 document.head.appendChild(st);}
})();
