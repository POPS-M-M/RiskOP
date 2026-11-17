/* ================= OP ADVENTURE — nouvelles règles (branche op-adventure) =================
   Consigne de l'utilisateur (17/11/2026), résumé :
   · 4 ressources : ฿ Berrys, ◈ Savoir, ⚔ Recrues, ⚜ Influence. L’ancienne troisième ressource (celle des Voies), les Voies et la Ferveur (Éveil) disparaissent.
     Le champ interne `faith` (p.faith, rate.f, mod.faith) porte désormais les ⚔ Recrues : sauvegardes, réseau et IA gardent leur forme.
   · 3 âges et 5 branches conservés, identités revues (données dans src/base, script tools/op/edit_base.py).
   · Haki de l'Observation et de l'Armement : progression propre (rangs 1 à 3), hors arbre technologique. Le Haki des Rois n'est pas une
     technologie : seuls certains commandants l'ont.
   · Les Fruits du Démon ne sont plus une troupe : un Fruit = un utilisateur identifié. Commandants à Fruit (canon) et rares utilisateurs
     créés à partir des Fruits introuvables de la carte (3 par partie, un par type).
   · Les commandants (et utilisateurs de Fruit) COMBATTENT : celui qui est affecté à une île part avec l'armée qui en sort (au moins la
     moitié des troupes), défend l'île où il est posté, utilise sa technique pendant la bataille, peut être blessé ; il n'est jamais sur
     deux fronts.
   Repères canon : [C] sourcé · [C?] de mémoire, à vérifier · [I] interprétation / choix d'équilibrage.
   Sources : One Piece Wiki « Haki/Haoshoku Haki » (liste des utilisateurs, consultée le 17/11/2026) ; « Devil Fruit » (types, granit
   marin, Logia intangibles) ; fiches des personnages déjà dans le jeu (LEGENDS). Tous les chiffres sont des choix d'équilibrage [I]. */

/* ---------- données canon des commandants ---------- */
/* Fruit du Démon : [nom, type, éveil possible]. Types et noms : [C] d'après les textes du jeu et le wiki ; éveil : Doflamingo [C], Luffy, Law, Katakuri [C?] ; « modèle Seiryu » de Kaido [C?] (le texte du jeu dit « modèle Dragon »). */
const OPF={
  Ace:['Mera Mera no Mi','logia'],'Barbe Noire':['Yami Yami no Mi et Gura Gura no Mi','logia'],Akainu:['Magu Magu no Mi','logia'],
  Luffy:['Hito Hito no Mi, modèle Nika','zoan',1],'Barbe Blanche':['Gura Gura no Mi','paramecia'],Kaido:['Uo Uo no Mi, modèle Seiryu','zoan'],
  Law:['Ope Ope no Mi','paramecia',1],Sengoku:['Hito Hito no Mi, modèle Bouddha','zoan'],Smoker:['Moku Moku no Mi','logia'],Sabo:['Mera Mera no Mi','logia'],
  Ivankov:['Horu Horu no Mi','paramecia'],Doflamingo:['Ito Ito no Mi','paramecia',1],'Big Mom':['Soru Soru no Mi','paramecia'],Katakuri:['Mochi Mochi no Mi','paramecia',1],
  Fujitora:['Zushi Zushi no Mi','paramecia'],Vegapunk:['Nomi Nomi no Mi','paramecia'],Queen:['Ryu Ryu no Mi, modèle Brachiosaure','zoan'],
  King:['Ryu Ryu no Mi, modèle Ptéranodon','zoan'],Yamato:['Inu Inu no Mi, modèle Okuchi no Makami','zoan'],Caesar:['Gasu Gasu no Mi','logia'],
  Bartolomeo:['Bari Bari no Mi','paramecia'],Biblo:['Iku Iku no Mi','paramecia'],Sommers:['Iba Iba no Mi','paramecia'],Killingham:['Ryu Ryu no Mi, modèle Kirin','zoan'],
  Loki:['fruit légendaire de la famille royale d\'Elbaph (type non précisé ici)','?']
};
/* Haki des Rois : liste des utilisateurs du One Piece Wiki [C] (personnages du jeu seulement) */
const OPHDR=['Shanks','Luffy','Rayleigh','Doflamingo','Big Mom','Katakuri','Sengoku','Kaido','Zoro','Barbe Blanche','Ace','Oden','Roger'];
const OPTY={paramecia:{n:'Paramecia',ic:'✧',d:'techniques variées : sa technique de combat est 25 % plus forte'},
  zoan:{n:'Zoan',ic:'🐾',d:'transformation, puissance physique et endurance : puissance +20 %, blessures deux fois plus courtes'},
  logia:{n:'Logia',ic:'🔥',d:'corps élémentaire : puissance +35 % et jamais blessé, SAUF face à un camp qui maîtrise le Haki de l\'Armement'},
  '?':{n:'type non précisé',ic:'✦',d:'aucun effet de type'}};
/* réglages [I] */
const OP={st:{b:0,duel:0,hdr:0,wound:0,eat:0,haki:0},HAKI_S:[40,110,240],HAKI_R:[15,35,70],FU_MAX:2,EAT_G:90,EAT_R:25,EAT_I:8,HURT_TURNS:3,DUEL_K:.08};
let OPB=null;   /* contexte de la bataille en cours (calcul) */

/* ---------- état ---------- */
function opX(p){if(!p||!p.x)return null;const x=p.x;if(!x.hk||typeof x.hk!=='object')x.hk={o:0,a:0};if(!Array.isArray(x.fu))x.fu=[];return x;}
function opCH(i){const c=CH[i];if(!c)return null;if(c.army===undefined)c.army=0;if(c.hurt===undefined)c.hurt=0;return c;}
/* migration : partie neuve, ancienne sauvegarde, état reçu → champs OP Adventure présents, Voies converties */
function opMigrate(){
  for(const t of terrs){if(t.u&&t.u.elite===undefined)t.u.elite=0;}
  for(const a of armies){if(a.u&&a.u.elite===undefined)a.u.elite=0;if(!Array.isArray(a.ch))a.ch=[];}
  for(const p of players){
    const x=opX(p);if(!x)continue;
    if(p.religion){/* ancienne Voie → un rang de Haki (Observation pour la Voie du Savoir, Armement pour les autres) */
      if(p.religion==='sagesse')x.hk.o=Math.max(x.hk.o,1);else if(p.religion!=='soleil')x.hk.a=Math.max(x.hk.a,1);
      p.religion=null;p.ferveur=false;}
    if(p.mod&&p.mod.elite===undefined)p.mod.elite=0;
  }
  for(let i=0;i<CH.length;i++)opCH(i);
}
const opHakiMax=p=>{const x=opX(p);return x?Math.max(x.hk.o,x.hk.a):0;};
const opHk=(pid,h)=>{const p=players[pid];const x=p&&opX(p);return x?x.hk[h]|0:0;};
function opHakiFx(p,m){const x=opX(p);if(!x)return;const o=x.hk.o|0,a=x.hk.a|0;m.def+=.04*o+.02*a;m.rt+=.15*o;m.atk+=.04*a;}
/* Influence en plus : Grands ports et Centres commerciaux */
function opInfB(p){let v=0;for(const t of terrs)if(t.owner===p.id&&t.city){if(t.city.b.includes('grand_port'))v+=.03;if(t.city.b.includes('centre_com'))v+=.06;}return v;}
const opHasHdR=pid=>chActive(chOwnedBy(pid)).some(i=>OPHDR.includes(LEGENDS[i].s)&&!opHurt(CH[i]));
const opHurt=c=>!!c&&c.hurt>time;
const opHurtLen=()=>TM.on?OP.HURT_TURNS*TURN_LEN:45*tkS();

/* ---------- Haki ---------- */
function opHakiReason(p,h){
  const x=opX(p);if(!x||(h!=='o'&&h!=='a'))return 'Action impossible.';
  const r=(x.hk[h]|0)+1;if(r>3)return 'Rang maximal atteint.';
  if(r>AG.n+1)return 'Rang '+r+' : disponible à l\'âge '+AGES[r-1].n+'.';
  const need=['Dojo','Centre de maîtrise du Haki','Centre d\'entraînement d\'élite'][r-1];
  if(!terrs.some(t=>t.owner===p.id&&tierB(t,'temple')>=r))return 'Il faut un '+need+' dans une de vos villes (onglet Villes).';
  if(p.sci<OP.HAKI_S[r-1])return 'Savoir insuffisant ('+OP.HAKI_S[r-1]+' ◈).';
  if(p.faith<OP.HAKI_R[r-1])return 'Recrues insuffisantes ('+OP.HAKI_R[r-1]+' ⚔ à entraîner).';
  return '';
}
function opHakiBuy(p,h){
  const why=opHakiReason(p,h);if(why)return why;
  OP.st.haki++;const x=opX(p),r=(x.hk[h]|0)+1;p.sci-=OP.HAKI_S[r-1];p.faith-=OP.HAKI_R[r-1];x.hk[h]=r;recalc(p);
  if(p.human)addLog((h==='o'?'Haki de l\'Observation':'Haki de l\'Armement')+' : rang '+r+' maîtrisé.',p.color,p.id);
  return '';
}

/* ---------- utilisateurs de Fruit (Fruits introuvables de la carte) ---------- */
const opEatCost=p=>({g:Math.max(20,Math.round(OP.EAT_G*PK/6*(1-Math.min(.5,(p.mod&&p.mod.fruitCost)||0)))),r:OP.EAT_R,i:OP.EAT_I});
function opEatReason(p,t){
  if(!t||t.owner!==p.id)return 'Il faut tenir l\'île.';
  if(!t.fruit)return 'Aucun Fruit du Démon ici.';
  if(bossAlive(t))return 'Un boss garde l\'île.';
  const x=opX(p);if(x.fu.length>=OP.FU_MAX)return 'Au plus '+OP.FU_MAX+' utilisateurs de Fruit par camp.';
  const c=opEatCost(p);
  if(p.gold<c.g)return 'Berrys insuffisants ('+c.g+' ฿).';
  if(p.faith<c.r)return 'Recrues insuffisantes ('+c.r+' ⚔).';
  if(x.inf<c.i)return 'Influence insuffisante ('+c.i+' ⚜).';
  return '';
}
function opEat(p,t){
  const why=opEatReason(p,t);if(why)return why;
  const c=opEatCost(p),x=opX(p),ty=t.fruit;p.gold-=c.g;p.faith-=c.r;x.inf-=c.i;
  x.fuN=(x.fuN|0)+1;const id=p.id*100+x.fuN;
  x.fu.push({id,ty,isl:t.name,lv:1,xp:0,post:t.id,army:0,hurt:0});
  t.fruit=null;t.fruitEaten=ty;dirty=true;OP.st.eat++;
  addLog('🍇 '+p.name+' : un combattant de '+t.name+' mange le Fruit '+FRUITS[ty].n+' introuvable de l\'île.',p.color);
  return '';
}
const opFuName=f=>'Utilisateur '+(OPTY[f.ty]?OPTY[f.ty].n:'')+' de '+f.isl;
function opFuPost(p,id,tid){
  const x=opX(p),f=x.fu.find(z=>z.id===id);if(!f)return 'Utilisateur introuvable.';
  if(f.army)return 'Il est en mer avec une armée.';
  if(tid<0){f.post=-1;return '';}
  const t=terrs[tid];if(!t||t.owner!==p.id)return 'Il ne peut défendre qu\'une de vos îles.';
  f.post=tid;dirty=true;return '';
}

/* ---------- puissance des champions ---------- */
/* champion : {k:'c',i} commandant · {k:'f',p,id} utilisateur de Fruit */
const opChName=c=>c.k==='c'?LEGENDS[c.i].s:opFuName(c.f);
const opKey=c=>c?(c.k==='c'?'c'+c.i:'f'+c.f.id):'';
function opChFruit(c){if(c.k==='c'){const F=OPF[LEGENDS[c.i].s];return F?{n:F[0],ty:F[1],aw:!!F[2]}:null;}return {n:'Fruit '+FRUITS[c.f.ty].n+' de '+c.f.isl,ty:c.f.ty,aw:false};}
const opChLv=c=>c.k==='c'?(CH[c.i]?CH[c.i].lv:1):c.f.lv;
const opAwake=c=>{const F=opChFruit(c);return !!(F&&F.aw&&AG.n>=2&&opChLv(c)>=4);};
/* puissance brute (en équivalent troupes) sans adversaire */
function opChBase(c){
  if(c.k==='c'){const M=chMeta(c.i);return (3+1.4*M.st[0]+.5*M.st[1])*RAR[M.r].pw*(1+.12*(opChLv(c)-1));}
  return 14*(1+.15*(c.f.lv-1));
}
/* puissance face à un camp ennemi (eo) : type de Fruit, Haki, granit marin, éveil */
function opChPow(c,owner,eo){
  let v=opChBase(c);const F=opChFruit(c);
  if(F){
    if(F.ty==='zoan')v*=1.2;
    if(F.ty==='logia'&&!(eo>=0&&opHk(eo,'a')>=1))v*=1.35;
    if(eo>=0&&players[eo]&&players[eo].techs.fer)v*=.8;
    if(opAwake(c))v*=1.25;
  }
  v*=1+.05*opHk(owner,'a');
  return v;
}
/* champions présents à une île (défense) */
function opChampsAt(tid){
  const t=terrs[tid];if(!t||t.owner<0)return [];const o=t.owner,out=[];
  for(let i=0;i<LEGENDS.length;i++){const c=opCH(i);if(c&&c.own===o&&c.post===tid&&!c.army&&!opHurt(c)&&chIsActive(o,i))out.push({k:'c',i});}
  const x=opX(players[o]);if(x)for(const f of x.fu)if(f.post===tid&&!f.army&&!opHurt(f))out.push({k:'f',p:o,f});
  return out;
}
function opChampsOfArmy(a){
  const out=[];if(!a||!Array.isArray(a.ch))return out;
  for(const e of a.ch){if(e.k==='c'){const c=opCH(e.i);if(c&&c.own===a.owner&&c.army===a.id)out.push({k:'c',i:e.i});}
    else{const x=opX(players[a.owner]),f=x&&x.fu.find(z=>z.id===e.id);if(f&&f.army===a.id)out.push({k:'f',p:a.owner,f});}}
  return out;
}
/* aperçu côté attaque (IA, prévisions) : champions qui partiraient de l'île d'origine */
function opPreviewAtt(owner,from,t){
  if(OPB&&OPB.owner===owner)return OPB.aPow;
  if(from===undefined||from<0||!terrs[from]||terrs[from].owner!==owner)return 0;
  let s=0;const eo=t?t.owner:-1;for(const c of opChampsAt(from))s+=opChPow(c,owner,eo);return s;
}
/* part de l'élite : Unités d'élite renforcées par la Doctrine (utilisé par le socle) */
const opEliteK=()=>1;

/* ---------- départ : le champion affecté à l'île part avec l'armée ---------- */
function opAttach(a,pct,from){
  if(!a||!terrs[from])return;
  if(!Array.isArray(a.ch))a.ch=[];
  const left=tr(terrs[from]),sent=sumU(a.u);if(sent<1)return;if(pct<.5&&sent<left)return;
  for(const c of opChampsAt(from)){
    if(c.k==='c'){CH[c.i].post=-1;CH[c.i].army=a.id;a.ch.push({k:'c',i:c.i});}
    else{c.f.post=-1;c.f.army=a.id;a.ch.push({k:'f',id:c.f.id});}
  }
}
{const launch_op=launch;launch=function(pid,from,to,pct,st){const n0=ARMN;const r=launch_op(pid,from,to,pct,st);if(!r&&ARMN>n0){const a=armies.find(x=>x.id===ARMN);if(a&&a.owner===pid&&a.from===from)try{opAttach(a,pct,from);}catch(_){}}return r;};}

/* ---------- arrivée : techniques, duel, présence au combat, blessures ---------- */
const opCapOf=o=>{const c=terrs.find(t=>t.owner===o&&t.capital);if(c)return c.id;const a=terrs.find(t=>t.owner===o);return a?a.id:-1;};
function opPlace(c,owner,tid){
  if(c.k==='c'){const s=CH[c.i];s.army=0;s.post=-1;if(tid>=0&&terrs[tid].owner===owner&&chIsActive(owner,c.i)){for(let j=0;j<LEGENDS.length;j++)if(j!==c.i&&CH[j]&&CH[j].own===owner&&CH[j].post===tid)CH[j].post=-1;s.post=tid;}}
  else{c.f.army=0;c.f.post=tid>=0&&terrs[tid].owner===owner?tid:-1;}
}
function opWound(c,owner,home){
  const z=c.k==='c'?CH[c.i]:c.f,F=opChFruit(c),k=F&&F.ty==='zoan'?.5:1;
  z.hurt=time+opHurtLen()*k;opPlace(c,owner,home);OP.st.wound++;
}
function opXP(c,n){if(c.k==='c')chAddXP(c.i,n);else{c.f.xp+=n;while(c.f.lv<3&&c.f.xp>=[4,10][c.f.lv-1])c.f.lv++;}}
/* effet de la technique d'un champion pendant la bataille. f : puissance de la technique (rareté, stats, niveau) */
function opTech(c,side,ctx){
  const anti=1-.12*opHk(side==='a'?ctx.do:ctx.ao,'o');   /* Observation adverse : anticipation */
  let name,ty,v,fx,f;
  if(c.k==='c'){const M=chMeta(c.i);name=M.sk.n;ty=M.sk.ty;v=M.sk.v;fx=M.sk.fx;f=chPow(c.i);}
  else{name={paramecia:'Pouvoir du Fruit',zoan:'Forme hybride',logia:'Corps élémentaire'}[c.f.ty];ty={paramecia:'strike',zoan:'buff',logia:'debuff'}[c.f.ty];v=.14;fx={atk:.10,def:.10};f=1+.1*(c.f.lv-1);}
  const F=opChFruit(c);if(F&&F.ty==='paramecia')f*=1.25;f*=anti;
  const me=side==='a'?'A':'D',foe=side==='a'?'D':'A',nm=opChName(c);
  if(ty==='strike'){const fr=Math.min(.25,v*f*.6);ctx['cut'+foe]=1-(1-ctx['cut'+foe])*(1-fr);ctx.notes.push([side,nm+' — '+name+' : '+Math.round(fr*100)+' % des troupes adverses hors de combat avant le choc']);}
  else if(ty==='buff'){const b=Math.min(.3,((side==='a'?fx.atk:fx.def)||(fx.atk||fx.def||fx.spd||.1)*.5)*f*.8);ctx['mul'+me]+=b;ctx.notes.push([side,nm+' — '+name+' : force de son camp +'+Math.round(b*100)+' %']);}
  else if(ty==='debuff'){const b=Math.min(.25,Math.abs(fx.atk||fx.def||fx.spd||.1)*f*.8);ctx['mul'+foe]-=b;ctx.notes.push([side,nm+' — '+name+' : force adverse −'+Math.round(b*100)+' %']);}
  else if(ty==='rally'){const b=Math.min(.3,v*f*.5);ctx['add'+me]+=b;ctx.notes.push([side,nm+' — '+name+' : renforts, +'+Math.round(b*100)+' % de troupes']);}
  else{ctx.loot[side]=(ctx.loot[side]||0)+Math.round(10*f);ctx.notes.push([side,nm+' — '+name+' : soutien (butin en cas de victoire)']);}
}
function opBattle(a,t){
  const ao=a.owner,dO=t.owner;
  const A=opChampsOfArmy(a).filter(c=>!opHurt(c.k==='c'?CH[c.i]:c.f)),D=dO>=0?opChampsAt(t.id):[];
  if(!A.length&&!D.length)return null;
  OP.st.b++;
  const ctx={ao,do:dO,A,D,cutA:0,cutD:0,mulA:1,mulD:1,addA:0,addD:0,notes:[],loot:{},aPow:0,dPow:0,duel:null};
  for(const c of A)opTech(c,'a',ctx);
  for(const c of D)opTech(c,'d',ctx);
  /* Haki des Rois : pression sur les troupes ordinaires adverses (les Unités d'élite tiennent) [C : capacité réservée à certains personnages] */
  const hdr=(L,side)=>{const c=L.find(z=>z.k==='c'&&OPHDR.includes(LEGENDS[z.i].s));if(!c)return;const fr=Math.min(.12,.04+.015*opChLv(c));
    OP.st.hdr++;const u=side==='a'?t.u:a.u;for(const k of UK)if(k!=='elite')u[k]=(u[k]||0)*(1-fr);ctx.notes.push([side,LEGENDS[c.i].s+' — Haki des Rois : '+Math.round(fr*100)+' % des troupes ordinaires adverses perdent connaissance']);};
  hdr(A,'a');hdr(D,'d');
  /* duel des meilleurs champions */
  if(A.length&&D.length){
    const best=(L,o,eo)=>L.map(c=>({c,v:opChPow(c,o,eo)})).sort((x,y)=>y.v-x.v)[0];
    const x=best(A,ao,dO),y=best(D,dO,ao),nx=x.v*(.85+Math.random()*.3),ny=y.v*(.85+Math.random()*.3);
    const w=nx>=ny?'a':'d',L=w==='a'?y:x;
    ctx.duel={a:opChName(x.c),d:opChName(y.c),w};OP.st.duel++;
    ctx['mul'+(w==='a'?'A':'D')]+=OP.DUEL_K;
    const lf=opChFruit(L.c),lo=w==='a'?dO:ao,wo=w==='a'?ao:dO;
    const immune=lf&&lf.ty==='logia'&&opHk(wo,'a')<1;
    ctx.loser=immune?null:L.c;
    ctx.notes.push([w,'Duel : '+opChName(x.c)+' contre '+opChName(y.c)+' → '+(w==='a'?opChName(x.c):opChName(y.c))+' l\'emporte'+(immune?' ('+opChName(L.c)+', Logia, reste insaisissable sans Haki de l\'Armement)':' ; '+opChName(L.c)+' est blessé')]);
  }
  for(const c of A)if(c!==ctx.loser)ctx.aPow+=opChPow(c,ao,dO);
  for(const c of D)if(c!==ctx.loser)ctx.dPow+=opChPow(c,dO,ao);
  /* troupes : techniques de frappe et renforts */
  if(ctx.cutD>0&&dO>=0)t.u=scaleU(t.u,1-ctx.cutD);
  if(ctx.cutA>0)a.u=scaleU(a.u,1-ctx.cutA);
  if(ctx.addA>0)a.u.guerrier+=sumU(a.u)*ctx.addA;
  if(ctx.addD>0&&dO>=0)t.u.guerrier+=sumU(t.u)*ctx.addD;
  return ctx;
}
{
  const ra_op=resolveArrival;
  resolveArrival=function(a){
    const t=terrs[a.to];if(!t){return ra_op(a);}
    opMigrateArmy(a);
    const A0=opChampsOfArmy(a),own=a.owner,from=a.from;
    /* arrivée chez soi, repli, traité signé en route : pas de bataille */
    const fight=t.owner!==a.owner&&!a.rt&&!bossAlive(t)&&!(t.owner>=0&&!isWar(a.owner,t.owner));
    let ctx=null;
    if(fight){try{ctx=opBattle(a,t);}catch(e){ctx=null;}}
    const nA=armies.length,prevOwner=t.owner,lk=ctx&&ctx.loser?opKey(ctx.loser):'';
    /* bonus de commandement (lead) : le commandant à bord commande comme s'il était encore posté à l'île de départ */
    const tmp=[],lead=A0.find(c=>c.k==='c'&&opKey(c)!==lk);
    if(lead&&terrs[from]&&terrs[from].owner===own){for(let j=0;j<LEGENDS.length;j++)if(CH[j]&&CH[j].own===own&&CH[j].post===from){tmp.push([j,from]);CH[j].post=-1;}tmp.push([lead.i,CH[lead.i].post]);CH[lead.i].post=from;}
    OPB=ctx?{owner:own,aPow:ctx.aPow,dPow:ctx.dPow,mulA:ctx.mulA,mulD:ctx.mulD,ctx,t:t.id}:(A0.length?{owner:own,aPow:A0.reduce((s,c)=>s+opChPow(c,own,t.owner),0),dPow:0,mulA:1,mulD:1,ctx:null,t:t.id}:null);
    try{ra_op(a);}finally{OPB=null;for(let k=tmp.length-1;k>=0;k--)CH[tmp[k][0]].post=tmp[k][1];}
    /* champions de l'attaque */
    const won=t.owner===own;
    const back=armies.slice(nA).find(z=>z.owner===own&&z.rt&&z.to===from);
    for(const c of A0){
      if(lk&&opKey(c)===lk){opWound(c,own,opCapOf(own));opXP(c,1);continue;}
      if(won){opPlace(c,own,t.id);if(fight){opXP(c,2);}}
      else if(back){const z=c.k==='c'?CH[c.i]:c.f;z.army=back.id;back.ch=back.ch||[];back.ch.push(c.k==='c'?{k:'c',i:c.i}:{k:'f',id:c.f.id});}
      else if(!fight){opPlace(c,own,terrs[from]&&terrs[from].owner===own?from:opCapOf(own));}
      else{opWound(c,own,opCapOf(own));opXP(c,1);}
    }
    if(ctx){
      for(const c of ctx.D){
        if(lk&&opKey(c)===lk){opWound(c,prevOwner,opCapOf(prevOwner));opXP(c,1);continue;}
        if(won){{const nb=terrs[t.id].nb.find(n=>terrs[n].owner===prevOwner);opPlace(c,prevOwner,nb!==undefined?nb:opCapOf(prevOwner));}}
        else opXP(c,2);
      }
      const ls=won?'a':'d',lp=won?own:prevOwner;if(ctx.loot[ls]&&lp>=0){players[lp].gold+=ctx.loot[ls];}
    }
    dirty=true;
  };
}
function opMigrateArmy(a){if(a&&a.u&&a.u.elite===undefined)a.u.elite=0;if(a&&!Array.isArray(a.ch))a.ch=[];}
/* attaque : champions de l'armée (ou de l'île de départ pour les prévisions), techniques (multiplicateurs) */
{
  const dt_op=defTotal;
  defTotal=function(t,attU,noise,P){
    const Q=P||{};const v=dt_op(t,attU,noise,Q);
    let dp=0,mul=1;
    if(OPB&&OPB.t===t.id){dp=OPB.dPow;mul=OPB.mulD;}
    else if(t.owner>=0){const ao=-1;for(const c of opChampsAt(t.id))dp+=opChPow(c,t.owner,ao);}
    if(!dp&&mul===1)return v;
    const k=Q.base>0?v/Q.base:(Q.dm||1)*(Q.f||1)*(Q.fo||1);
    if(P)P.ch=Math.round(dp);
    return (v+dp*k)*Math.max(.4,mul);
  };
}
/* utilisé par attTotal du socle */
function opAttChamp(owner,from,t){return opPreviewAtt(owner,from,t);}
function opAttMul(owner,t){return OPB&&OPB.owner===owner&&t&&OPB.t===t.id?Math.max(.4,OPB.mulA):1;}
{
  const bm_op=brMake;
  brMake=function(){const r=bm_op.apply(null,arguments);if(r&&OPB&&OPB.ctx){const C=OPB.ctx;r.op={n:C.notes.map(z=>z.slice()),a:C.A.map(opChName),d:C.D.map(opChName),ap:Math.round(C.aPow),dp:Math.round(C.dPow),duel:C.duel};}
    else if(r&&OPB&&OPB.aPow>0)r.op={n:[],a:[],d:[],ap:Math.round(OPB.aPow),dp:0,duel:null};return r;};
}
function opBattleHTML(r){
  if(!r||!r.op)return '';const o=r.op;
  const side=s=>s==='a'?'⚔':'🛡';
  return '<div class="opb"><b>Champions au combat</b>'
    +(o.a.length?'<small>Attaque : '+esc(o.a.join(', '))+(o.ap>0?' (+'+o.ap+' de puissance)':'')+'</small>':'')
    +(o.d.length?'<small>Défense : '+esc(o.d.join(', '))+(o.dp>0?' (+'+o.dp+' de puissance)':'')+'</small>':'')
    +o.n.map(z=>'<small>'+side(z[0])+' '+esc(z[1])+'</small>').join('')+'</div>';
}
if(typeof ilBattleHTML==='function'){const il_op=ilBattleHTML;ilBattleHTML=function(r,size){return il_op(r,size)+opBattleHTML(r);};}

/* ---------- entretien : blessures, camps éliminés, îles perdues ---------- */
function opTick(){
  for(const p of players){
    const x=opX(p);if(!x)continue;
    if(!p.alive){x.fu.length=0;continue;}
    for(const f of x.fu){if(f.post>=0&&terrs[f.post].owner!==p.id)f.post=-1;if(f.army&&!armies.some(a=>a.id===f.army))f.army=0;}
  }
  for(let i=0;i<CH.length;i++){const c=opCH(i);if(c.army&&(c.own<0||!armies.some(a=>a.id===c.army)))c.army=0;}
}
{const pc_op=postChar;postChar=function(p,i,tid){const c=opCH(i);if(c&&c.army&&c.own===p.id)return 'Il est en mer avec une armée : il prendra un poste à l\'arrivée.';return pc_op(p,i,tid);};}
{const ct_op=chTick;chTick=function(){ct_op();try{opTick();}catch(_){}};}

/* ---------- IA ---------- */
function opAiThink(p){
  const x=opX(p);if(!x)return;
  /* Haki : branche préférée d'abord */
  const order=p.ai.pref.indexOf('Militaire')<p.ai.pref.indexOf('Défense')?['a','o']:['o','a'];
  for(const h of order)if(!opHakiReason(p,h)&&p.sci>OP.HAKI_S[Math.min(2,x.hk[h]|0)]*1.3){opHakiBuy(p,h);break;}
  /* Fruits introuvables */
  for(const t of terrs)if(t.owner===p.id&&t.fruit&&!opEatReason(p,t)&&p.gold>opEatCost(p).g+30){opEat(p,t);break;}
  /* utilisateurs de Fruit : sur l'île de front la plus garnie */
  for(const f of x.fu){
    if(f.army||opHurt(f))continue;
    if(f.post>=0&&terrs[f.post].owner===p.id&&Math.random()<.85)continue;
    let bt=null,bv=-1;for(const t of terrs){if(t.owner!==p.id)continue;const front=t.nb.some(n=>terrs[n].owner!==p.id);const v=tr(t)*(front?2:1);if(v>bv){bv=v;bt=t;}}
    if(bt)f.post=bt.id;
  }
}

/* ---------- commandes (solo, hôte, réseau) ---------- */
{
  const ex_op=exec;
  exec=function(seat,c){
    if(c&&(c.k==='haki'||c.k==='eat'||c.k==='fpost')){
      try{
        const p=players[seat];if(!p||!p.alive)return 'Action impossible.';
        if(TM.on&&TM.phase==='res')return 'Résolution en cours : attendez le prochain tour.';
        if(AG.trn)return 'Transition d\'âge en cours.';
        if(TM.on&&TM.phase==='plan')TM.ready[seat]=false;
        const T=i=>Number.isInteger(i)&&i>=0&&i<terrs.length?terrs[i]:null;
        if(c.k==='haki')return opHakiBuy(p,c.h);
        if(c.k==='eat')return opEat(p,T(c.t));
        if(c.k==='fpost')return Number.isInteger(c.id)?opFuPost(p,c.id,c.t===-1?-1:(T(c.t)?c.t:-2)):'Action impossible.';
      }catch(_){return 'Action impossible.';}
    }
    return ex_op(seat,c);
  };
}
document.getElementById('side').addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b||b.disabled||over)return;
  const a=b.dataset.act,v=b.dataset.v;
  if(a==='ophaki')cmd({k:'haki',h:v});
  else if(a==='opeat')cmd({k:'eat',t:+v});
  else if(a==='opfpost'){const [i,tt]=v.split(':');cmd({k:'fpost',id:+i,t:+tt});}
  else return;
  renderPanel(true);
});

/* ---------- interface ---------- */
const opChampLine=(c,owner)=>{const F=opChFruit(c),hd=c.k==='c'&&OPHDR.includes(LEGENDS[c.i].s);
  return (F?'<span title="'+esc((OPTY[F.ty]||OPTY['?']).d)+'">'+(OPTY[F.ty]||OPTY['?']).ic+' '+esc(F.n)+' ('+(OPTY[F.ty]||OPTY['?']).n+(opAwake(c)?', éveillé':F.aw?', éveil possible à l\'âge III niveau 4':'')+')</span>':'<span class="muted">Sans Fruit du Démon</span>')
    +(hd?' · <b style="color:#f2c75c">Haki des Rois</b>':'');};
function opStatus(z){return z.army?'<b>en mer avec une armée</b>':opHurt(z)?'<b style="color:var(--bad)">blessé</b> (encore '+Math.ceil(TM.on?(z.hurt-time)/TURN_LEN:z.hurt-time)+(TM.on?' tour(s)':' s')+')':z.post>=0?'posté à '+esc(terrs[z.post].name):'sans poste';}
{
  const cc_op=chCard;
  chCard=function(i,p,mode){
    const h=cc_op(i,p,mode),c={k:'c',i},z=opCH(i);
    const add='<div class="ln"><i>⚔</i><span><b>Au combat</b> : puissance ≈ '+Math.round(opChPow(c,p.id,-1))+' (en troupes) · '+opChampLine(c,p.id)
      +(z&&z.own===p.id?' · '+opStatus(z):'')+'. Affecté à une île, il la défend et part avec l\'armée qui en sort (au moins la moitié des troupes).</span></div>';
    return h.replace(/<\/div>$/,add+'</div>');
  };
}
function opFruitCard(){
  const p=players[ME],x=opX(p);if(!x)return '';
  const spots=terrs.filter(t=>t.fruit),sel=ui.sel>=0?terrs[ui.sel]:null;
  let h='<div class="card"><h3>Utilisateurs de Fruit du Démon · '+x.fu.length+' / '+OP.FU_MAX+'</h3><p class="note">Un Fruit = un utilisateur identifié, rare et puissant, jamais une troupe recrutée en série. Les commandants à Fruit (Ace, Law, Kaido…) ont le leur. Les '+FRUIT_KEYS.length+' Fruits introuvables de la carte peuvent chacun donner un utilisateur au camp qui tient leur île.</p>';
  for(const f of x.fu){
    const c={k:'f',p:ME,f},canPost=sel&&sel.owner===ME&&sel.id!==f.post&&!f.army;
    h+='<div class="chc"><div class="t"><b>🍇 '+esc(opFuName(f))+'</b><span class="muted">niveau '+f.lv+'</span></div>'
      +'<div class="ln"><i>⚔</i><span>Puissance ≈ '+Math.round(opChPow(c,ME,-1))+' · '+opChampLine(c,ME)+' · '+(OPTY[f.ty]?esc(OPTY[f.ty].d):'')+'</span></div>'
      +'<div class="ln"><i>📍</i><span>'+opStatus(f)+'</span></div>'
      +'<div class="acts">'+(canPost?btn('opfpost',f.id+':'+sel.id,'Affecter à '+esc(sel.name),false):'')+(f.post>=0&&!f.army?btn('opfpost',f.id+':-1','Retirer du poste',false):'')+'</div></div>';
  }
  h+=spots.length?'<p class="note">Fruits encore introuvables : '+spots.map(t=>esc(t.name)+' ('+FRUITS[t.fruit].n+(t.owner===ME?', à vous':t.owner>=0?', '+esc(players[t.owner].name):', indépendante')+')').join(' · ')+'.</p>':'<p class="note">Tous les Fruits de la carte ont trouvé un utilisateur.</p>';
  for(const t of spots)if(t.owner===ME){const why=opEatReason(p,t),c=opEatCost(p);h+=btn('opeat',t.id,'Fruit de '+esc(t.name)+' : faire naître un utilisateur · '+c.g+' ฿ + '+c.r+' ⚔ + '+c.i+' ⚜',!!why,'wide')+(why?'<small class="note">'+esc(why)+'</small>':'');}
  return h+'</div>';
}
if(typeof pLeg4==='function'){const pl_op=pLeg4;pLeg4=function(){return pl_op()+opFruitCard();};}
/* onglet Haki (remplace l'onglet Voie) */
pRel=function(){
  const p=players[ME],x=opX(p);
  const row=(h,nm,ic,eff)=>{const r=x.hk[h]|0,why=opHakiReason(p,h),n=r+1;
    return '<div class="lr"><b>'+ic+' '+nm+' · rang '+r+' / 3</b><small>'+eff+'</small>'
      +(r<3?btn('ophaki',h,'Rang '+n+' · '+OP.HAKI_S[n-1]+' ◈ + '+OP.HAKI_R[n-1]+' ⚔',!!why):'<small style="color:var(--good)">Maîtrise complète.</small>')
      +(why&&r<3?'<small class="note">'+esc(why)+'</small>':'')+'</div>';};
  const mine=chActive(chOwnedBy(ME)).filter(i=>OPHDR.includes(LEGENDS[i].s));
  return '<div class="card"><h3>Haki</h3><p class="note">Le Haki se maîtrise par la recherche (◈ Savoir) et l\'entraînement (⚔ Recrues). Rang 1 : un Dojo · rang 2 : un Centre de maîtrise du Haki (âge II) · rang 3 : un Centre d\'entraînement d\'élite (âge III).</p>'
    +row('o','Haki de l\'Observation','◉','Par rang : défense +4 %, pertes de repli −15 % ; anticipation : les techniques des champions ennemis perdent 12 % d\'effet.')
    +row('a','Haki de l\'Armement','♜','Par rang : attaque +4 %, défense +2 %, puissance de vos champions +5 %. Dès le rang 1, vos troupes touchent les Logia (ils perdent leur bonus et peuvent être blessés).')
    +'<div class="lr"><b>♛ Haki des Rois</b><small>Ce n\'est pas une technologie : seuls certains personnages l\'ont (liste du One Piece Wiki). Au combat, il fait perdre connaissance à une part des troupes ordinaires adverses ; il rend le Ralliement 30 % moins cher. '+(mine.length?'Dans votre état-major : '+mine.map(i=>esc(LEGENDS[i].s)).join(', ')+'.':'Aucun de vos commandants ne l\'a.')+'</small></div></div>'
    +'<div class="card"><h3>Ralliement</h3><p class="note" style="margin-bottom:6px">Rallie sans combat un territoire voisin du vôtre : neutre pour '+convertCost({owner:-1},p)+' ⚜ Influence, ennemi en guerre avec '+CONV_MAX_UNITS+' unités ou moins pour '+convertCost({owner:0},p)+' ⚜. Les capitales résistent.</p>'
    +btn('mode','',ui.mode==='convert'?'Quitter le mode ralliement':'Activer le mode ralliement',false,'wide '+(ui.mode==='convert'?'on':''))+'</div>';
};

/* ---------- partie neuve, sauvegardes ---------- */
{const ng_op=newGame;newGame=function(){const r=ng_op.apply(null,arguments);try{for(const p of players){p.faith=Math.max(p.faith,24);}opMigrate();}catch(_){}return r;};}
{const sr_op=svRestore;svRestore=function(o){const r=sr_op(o);try{opMigrate();players.forEach(recalc);}catch(_){}return r;};}
{const st=document.createElement('style');st.textContent='.opb{margin:6px 0;padding:6px 8px;border-radius:8px;background:rgba(242,199,92,.10);border:1px solid rgba(242,199,92,.35);display:flex;flex-direction:column;gap:2px}.opb small{line-height:1.35}';document.head.appendChild(st);}

/* carte : nom des champions à bord de vos armées */
if(typeof rkArmyLabel==='function'){const al_op=rkArmyLabel;rkArmyLabel=function(a,x,y,u){al_op(a,x,y,u);try{
  if(a.owner!==ME||!a.ch||!a.ch.length)return;const L=opChampsOfArmy(a);if(!L.length)return;
  const txt='♛ '+L.map(c=>c.k==='c'?LEGENDS[c.i].s:'Fruit '+FRUITS[c.f.ty].n).join(', ');
  ctx.font='700 '+(10*u)+'px Inter,system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  const tw=ctx.measureText(txt).width+10*u;ctx.fillStyle='rgba(8,14,24,.88)';rr(x-tw/2,y+20*u,tw,13*u,6*u);ctx.fill();
  ctx.strokeStyle='#f2c75c';ctx.lineWidth=1.2*u*.7;ctx.stroke();ctx.fillStyle='#f2c75c';ctx.fillText(txt,x,y+26.5*u);}catch(_){}};}
/* fiche d'île : champions présents */
if(typeof pArmy2==='function'){const pa_op=pArmy2;pArmy2=function(){const h=pa_op();try{
  const t=ui.sel>=0?terrs[ui.sel]:null;if(!t||t.owner!==ME)return h;
  const L=opChampsAt(t.id);const hurt=[];for(let i=0;i<LEGENDS.length;i++){const c=CH[i];if(c&&c.own===ME&&c.post===t.id&&opHurt(c))hurt.push(LEGENDS[i].s);}
  if(!L.length&&!hurt.length&&!t.fruit)return h;
  let s='<div class="card"><h3>Champions sur '+esc(t.name)+'</h3>';
  if(L.length)s+='<p class="note">'+L.map(c=>'♛ <b>'+esc(opChName(c))+'</b> (puissance ≈ '+Math.round(opChPow(c,ME,-1))+')').join(' · ')+'. Ils défendent l\'île et partent avec une armée qui emmène au moins la moitié des troupes.</p>';
  if(hurt.length)s+='<p class="note">Blessés (ne combattent pas) : '+hurt.map(esc).join(', ')+'.</p>';
  if(t.fruit){const why=opEatReason(players[ME],t),c=opEatCost(players[ME]);s+='<p class="note">🍇 Fruit du Démon introuvable ('+FRUITS[t.fruit].n+').</p>'+btn('opeat',t.id,'Faire naître un utilisateur · '+c.g+' ฿ + '+c.r+' ⚔ + '+c.i+' ⚜',!!why,'wide')+(why?'<small class="note">'+esc(why)+'</small>':'');}
  return h+s+'</div>';}catch(_){return h;}};}

/* icônes des bâtiments améliorés : celles de leur famille */
try{for(const f of BFAM)for(const id of f)if(!BICON[id])BICON[id]=BICON[f[0]];}catch(_){}
