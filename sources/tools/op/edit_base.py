"""OP Adventure — modifications des règles dans src/base/grand_line_origine.html (branche op-adventure).
Chaque remplacement doit trouver son ancre exactement une fois (sinon arrêt). Script lancé une seule fois ; il est gardé pour la traçabilité."""
import sys
P='src/base/grand_line_origine.html'
h=open(P,encoding='utf-8').read()
def rep(a,b,n=1):
    global h
    c=h.count(a)
    if c!=n: sys.exit('ancre trouvée %d× au lieu de %d : %s'%(c,n,a[:90]))
    h=h.replace(a,b)

# ---------- ressources : la Volonté devient ⚔ Recrues (champ interne faith conservé) ----------
rep('<div class="chip" title="Volonté : sert à la Voie et aux rallies"><i class="ic" style="color:var(--c-faith)">✹</i>',
    '<div class="chip" title="Recrues : hommes disponibles pour constituer et renforcer les armées (chaque lot recruté en consomme)"><i class="ic" style="color:var(--c-faith)">⚔</i>')
rep('<div class="chip" title="Troupes en garnison"><i class="ic">⚔</i>','<div class="chip" title="Troupes en garnison"><i class="ic">⛨</i>')

# ---------- unités : Mangeur de Fruit retiré des troupes, Unités d'assaut et Unités d'élite ----------
rep("const UK=['guerrier','lancier','archer','cavalier','catapulte'];","const UK=['guerrier','lancier','archer','cavalier','catapulte','elite'];")
rep("const emptyU=()=>({guerrier:0,lancier:0,archer:0,cavalier:0,catapulte:0});","const emptyU=()=>({guerrier:0,lancier:0,archer:0,cavalier:0,catapulte:0,elite:0});")
rep("const sumU=u=>u.guerrier+u.lancier+u.archer+u.cavalier+u.catapulte;","const sumU=u=>u.guerrier+u.lancier+u.archer+u.cavalier+u.catapulte+(u.elite||0);")
rep("const scaleU=(u,f)=>{const r=emptyU();for(const k of UK)r[k]=u[k]*f;return r;};","const scaleU=(u,f)=>{const r=emptyU();for(const k of UK)r[k]=(u[k]||0)*f;return r;};")
rep("const addU=(a,b)=>{for(const k of UK)a[k]+=b[k];};","const addU=(a,b)=>{for(const k of UK)a[k]=(a[k]||0)+(b[k]||0);};")
a="""  guerrier:{n:'Pirate',pl:'Pirates',atk:1,def:1,spd:1,batch:5,cost:12,tech:null,d:'Polyvalent, recruté naturellement.'},
  lancier:{n:'Sabreur',pl:'Sabreurs',atk:.7,def:1.5,spd:1,batch:5,cost:17,tech:'bronze',d:'Défend bien. Son Haki de l\\'Armement tient tête aux Mangeurs de Fruit.'},
  archer:{n:'Tireur',pl:'Tireurs',atk:1.5,def:.6,spd:1,batch:5,cost:16,tech:'archerie',d:'Attaque forte, à distance. Fort contre les Sabreurs.'},
  cavalier:{n:'Mangeur de Fruit',pl:'Mangeurs de Fruit',atk:2.2,def:.8,spd:1.8,batch:3,cost:16,tech:'equitation',d:'Très rapide. Fort contre les Tireurs.'},
  catapulte:{n:'Canon',pl:'Canons',atk:3.2,def:.3,spd:.55,batch:2,cost:14,tech:'siege',d:'Lent. Ignore une grande part des fortins.'}
};"""
b="""  guerrier:{n:'Recrue',pl:'Recrues',atk:1,def:1,spd:1,batch:5,cost:12,rc:4,tech:null,d:'Unité polyvalente et économique. Elle arrive aussi d\\'elle-même en renfort sur vos îles.'},
  lancier:{n:'Sabreur',pl:'Sabreurs',atk:.7,def:1.5,spd:1,batch:5,cost:17,rc:5,tech:'bronze',d:'Combat rapproché et défense. Fort contre les Unités d\\'assaut.'},
  archer:{n:'Tireur',pl:'Tireurs',atk:1.5,def:.6,spd:1,batch:5,cost:16,rc:5,tech:'archerie',d:'Attaque forte, à distance. Fort contre les Sabreurs.'},
  cavalier:{n:'Unité d\\'assaut',pl:'Unités d\\'assaut',atk:2,def:.8,spd:1.5,batch:3,cost:16,rc:5,tech:'equitation',d:'Percée et pression offensive, rapide. Fort contre les Tireurs.'},
  catapulte:{n:'Canon',pl:'Canons',atk:3.2,def:.3,spd:.55,batch:2,cost:14,rc:4,tech:'siege',d:'Lent. Ignore une grande part des fortins.'},
  elite:{n:'Unité d\\'élite',pl:'Unités d\\'élite',atk:2.3,def:2.3,spd:1.1,batch:2,cost:30,rc:6,tech:'elite',d:'Combattants entraînés et coûteux, sans point faible ; la pression du Haki des Rois ne les fait pas tomber. Entretien double.'}
};
/* OP Adventure : chaque lot recruté consomme aussi des ⚔ Recrues (rc). Les Fruits du Démon ne sont plus des troupes : voir 90-op-adventure.js. */"""
rep(a,b)
rep("const UPKEEP=.02; /* Berrys par seconde pour chaque unité autre que pirate */","const UPKEEP=.02; /* Berrys par seconde pour chaque unité autre que les Recrues (×2 pour les Unités d'élite) */")
rep("for(const k of UK)if(k!=='guerrier')up+=t.u[k]*UPKEEP;","for(const k of UK)if(k!=='guerrier')up+=(t.u[k]||0)*UPKEEP*(k==='elite'?2:1);")
rep("for(const a of armies)if(a.owner===p.id)for(const k of UK)if(k!=='guerrier')up+=a.u[k]*UPKEEP;","for(const a of armies)if(a.owner===p.id)for(const k of UK)if(k!=='guerrier')up+=(a.u[k]||0)*UPKEEP*(k==='elite'?2:1);")

# ---------- technologies : 5 branches conservées, identités et déblocages revus ----------
rep("{id:'equitation',br:'Militaire',era:2,n:'Fruits artificiels',cost:125,req:['bronze'],d:'Mangeurs de Fruit. Armées 15 % plus rapides.',fx:{spd:.15}},",
    "{id:'equitation',br:'Militaire',era:1,n:'Tactiques d\\'assaut',cost:70,req:['bronze'],d:'Unités d\\'assaut. Armées 10 % plus rapides.',fx:{spd:.1}},\n  {id:'elite',br:'Militaire',era:2,n:'Formations d\\'élite',cost:140,req:['fer'],d:'Unités d\\'élite. Base militaire. Défense +5 %.',fx:{def:.05}},")
rep("{id:'fer',br:'Militaire',era:2,n:'Granit marin',cost:120,req:['bronze'],d:'Attaque +15 %.',fx:{atk:.15}},",
    "{id:'fer',br:'Militaire',era:2,n:'Granit marin',cost:120,req:['bronze'],d:'Attaque +15 %. Menottes et filets de granit marin : les utilisateurs de Fruit ennemis perdent 20 % de puissance contre vous.',fx:{atk:.15}},")
rep("{id:'tactique',br:'Militaire',era:3,n:'Stratégie navale',cost:300,req:['siege','equitation'],d:'Attaque +20 %, vitesse +15 %. Arme Antique.',fx:{atk:.2,spd:.15}},",
    "{id:'tactique',br:'Militaire',era:3,n:'Stratégie navale',cost:300,req:['siege','equitation'],d:'Attaque +20 %, vitesse +15 %. Arme Antique.',fx:{atk:.2,spd:.15}},\n  {id:'doctrine',br:'Militaire',era:3,n:'Doctrine du Nouveau Monde',cost:320,req:['elite','tactique'],d:'Unités d\\'élite +25 % (attaque et défense). Quartier général avancé. Attaque +5 %.',fx:{elite:.25,atk:.05}},")
rep("{id:'forteresses',br:'Défense',era:2,n:'Forteresses',cost:130,req:['murailles'],d:'Défense +15 %, garnison max +15. Marineford.',fx:{def:.15,cap:15}},",
    "{id:'forteresses',br:'Défense',era:2,n:'Forteresses',cost:130,req:['murailles'],d:'Défense +15 %, garnison max +15. Forteresse (amélioration du Fortin). Marineford.',fx:{def:.15,cap:15}},")
rep("{id:'milice',br:'Défense',era:2,n:'Soutien des insulaires',cost:150,req:['forteresses'],d:'Recrues naturelles +40 %.',fx:{regen:.4}},",
    "{id:'milice',br:'Défense',era:2,n:'Soutien des insulaires',cost:150,req:['forteresses'],d:'Renforts naturels +40 %, Recrues +10 %.',fx:{regen:.4,faith:.1}},")
rep("{id:'fortification',br:'Défense',era:3,n:'Bastions',cost:280,req:['forteresses','fer'],d:'Défense +25 %.',fx:{def:.25}},",
    "{id:'fortification',br:'Défense',era:3,n:'Installations stratégiques',cost:280,req:['forteresses','fer'],d:'Défense +25 %. Base stratégique majeure (amélioration de la Forteresse).',fx:{def:.25}},")
rep("{id:'commerce',br:'Économie',era:2,n:'Commerce maritime',cost:135,req:['monnaie'],d:'Berrys +20 %. Accords commerciaux.',fx:{gold:.2}},",
    "{id:'commerce',br:'Économie',era:2,n:'Commerce maritime',cost:135,req:['monnaie'],d:'Berrys +20 %. Grand port, comptoirs. Accords commerciaux.',fx:{gold:.2}},")
rep("{id:'banque',br:'Économie',era:3,n:'Banque',cost:280,req:['commerce'],d:'Recrutement 25 % moins cher.',fx:{recruit:.25}},",
    "{id:'banque',br:'Économie',era:3,n:'Réseaux commerciaux',cost:280,req:['commerce'],d:'Recrutement 25 % moins cher. Centre commercial majeur.',fx:{recruit:.25}},")
rep("{id:'industrie',br:'Économie',era:3,n:'Chantiers navals',cost:340,req:['banque','siege'],d:'Berrys +25 %, recrues naturelles +25 %.',fx:{gold:.25,regen:.25}},",
    "{id:'industrie',br:'Économie',era:3,n:'Chantiers navals',cost:340,req:['banque','siege'],d:'Berrys +25 %, renforts naturels +25 %.',fx:{gold:.25,regen:.25}},")
rep("{id:'ecriture',br:'Savoir',era:1,n:'Cartographie',cost:45,req:[],d:'Savoir +20 %. Archives.',fx:{sci:.2}},",
    "{id:'ecriture',br:'Savoir',era:1,n:'Cartographie et archives',cost:45,req:[],d:'Savoir +20 %. Archives.',fx:{sci:.2}},")
rep("{id:'philo',br:'Savoir',era:2,n:'Histoire authentique',cost:125,req:['ecriture'],d:'Savoir +20 %, Volonté +15 %. Bibliothèque d\\'Ohara.',fx:{sci:.2,faith:.15}},",
    "{id:'philo',br:'Savoir',era:2,n:'Recherches historiques',cost:125,req:['ecriture'],d:'Savoir +20 %, Influence +0,05/s. Bibliothèque d\\'archéologie (amélioration des Archives). Bibliothèque d\\'Ohara.',fx:{sci:.2,inf:.05}},")
rep("{id:'theologie',br:'Savoir',era:2,n:'Maîtrise du Haki',cost:130,req:['philo'],d:'Volonté +25 %. Grand Dojo, Voix de toutes choses.',fx:{faith:.25}},",
    "{id:'theologie',br:'Savoir',era:2,n:'Études des Poneglyphes',cost:130,req:['philo'],d:'Savoir +10 %. Déchiffrer un Poneglyphe coûte 25 % moins cher. Voix de toutes choses.',fx:{sci:.1}},")
rep("{id:'universite',br:'Savoir',era:3,n:'Laboratoires',cost:290,req:['philo','mathematiques'],d:'Savoir +30 %. Laboratoire.',fx:{sci:.3}},",
    "{id:'universite',br:'Savoir',era:3,n:'Laboratoires',cost:290,req:['philo','mathematiques'],d:'Savoir +30 %. Centre de recherche avancé (amélioration de la Bibliothèque d\\'archéologie).',fx:{sci:.3}},\n  {id:'siecle',br:'Savoir',era:3,n:'Le Siècle oublié',cost:330,req:['theologie','universite'],d:'Chaque Poneglyphe déchiffré donne Savoir +12 % au lieu de +6 %. Technologies anciennes : attaque +5 %.',fx:{atk:.05}},")
rep("{id:'logpose',br:'Mer',era:1,n:'Log Pose de précision',cost:60,req:['voiles'],d:'Repli : pertes réduites de moitié.',fx:{rt:.5}},",
    "{id:'logpose',br:'Mer',era:1,n:'Log Pose',cost:60,req:['voiles'],d:'Repli : pertes réduites de moitié.',fx:{rt:.5}},")
rep("{id:'ports',br:'Mer',era:2,n:'Ports fortifiés',cost:130,req:['logpose','murailles'],d:'Fortifier : 35 % moins cher et 40 % plus long.',fx:{fc:.35,fd:.4}},",
    "{id:'ports',br:'Mer',era:2,n:'Log Pose avancé et ports fortifiés',cost:130,req:['logpose','murailles'],d:'Fortifier : 35 % moins cher et 40 % plus long.',fx:{fc:.35,fd:.4}},")

# ---------- bâtiments : progression par âge (une amélioration remplace le bâtiment d'avant, sans place en plus) ----------
a="""  caserne:{n:'Camp d\\'entraînement',cost:40,time:15,tech:'bronze',d:'+0,2 recrue/s ici, recrutement 20 % moins cher.'},
  muraille:{n:'Fortin',cost:45,time:15,tech:'murailles',d:'Défense de la ville ×1,35.'},
  marche:{n:'Port marchand',cost:50,time:15,tech:'monnaie',d:'+0,5 ฿/s.'},
  bibliotheque:{n:'Archives',cost:55,time:15,tech:'ecriture',d:'+0,45 savoir/s.'},
  temple:{n:'Dojo de Haki',cost:45,time:15,tech:null,rel:true,d:'+0,35 Volonté/s. Une Voie est requise.'},
  universite:{n:'Laboratoire',cost:110,time:25,tech:'universite',d:'+1 savoir/s.'},
  cathedrale:{n:'Grand Dojo',cost:100,time:25,tech:'theologie',rel:true,d:'+0,8 Volonté/s. Une Voie est requise.'}
};"""
b="""  caserne:{n:'Camp d\\'entraînement',cost:40,time:15,tech:'bronze',age:1,d:'+0,2 renfort/s et +0,25 Recrues/s ici, recrutement 20 % moins cher.'},
  muraille:{n:'Fortin',cost:45,time:15,tech:'murailles',age:1,d:'Défense de la ville ×1,35.'},
  marche:{n:'Port marchand',cost:50,time:15,tech:'monnaie',age:1,d:'+0,5 ฿/s.'},
  bibliotheque:{n:'Archives',cost:55,time:15,tech:'ecriture',age:1,d:'+0,45 savoir/s.'},
  temple:{n:'Dojo',cost:45,time:15,tech:null,age:1,d:'+0,3 Recrues/s. Ouvre le rang 1 du Haki (onglet Haki).'},
  base_mil:{n:'Base militaire',cost:90,time:25,tech:'elite',up:'caserne',age:2,d:'Remplace le Camp d\\'entraînement : +0,35 renfort/s et +0,5 Recrues/s ici, recrutement 30 % moins cher (Berrys et Recrues −15 %).'},
  forteresse:{n:'Forteresse',cost:90,time:25,tech:'forteresses',up:'muraille',age:2,d:'Remplace le Fortin : défense de la ville ×1,6.'},
  grand_port:{n:'Grand port',cost:95,time:25,tech:'commerce',up:'marche',age:2,d:'Remplace le Port marchand : +1,1 ฿/s, Influence +0,03/s.'},
  biblio2:{n:'Bibliothèque d\\'archéologie',cost:100,time:25,tech:'philo',up:'bibliotheque',age:2,d:'Remplace les Archives : +0,8 savoir/s.'},
  cathedrale:{n:'Centre de maîtrise du Haki',cost:100,time:25,tech:null,up:'temple',haki:1,age:2,d:'Remplace le Dojo : +0,6 Recrues/s, défense de la ville +10 %. Ouvre le rang 2 du Haki. Il faut un rang 1 de Haki.'},
  qg:{n:'Quartier général avancé',cost:160,time:35,tech:'doctrine',up:'base_mil',age:3,d:'Remplace la Base militaire : +0,5 renfort/s et +0,8 Recrues/s ici, recrutement 40 % moins cher (Berrys et Recrues −25 %).'},
  base_strat:{n:'Base stratégique majeure',cost:160,time:35,tech:'fortification',up:'forteresse',age:3,d:'Remplace la Forteresse : défense de la ville ×1,9.'},
  centre_com:{n:'Centre commercial majeur',cost:165,time:35,tech:'banque',up:'grand_port',age:3,d:'Remplace le Grand port : +2 ฿/s, Influence +0,06/s.'},
  universite:{n:'Centre de recherche avancé',cost:150,time:35,tech:'universite',up:'biblio2',age:3,d:'Remplace la Bibliothèque d\\'archéologie : +1,4 savoir/s.'},
  elite_c:{n:'Centre d\\'entraînement d\\'élite',cost:160,time:35,tech:null,up:'cathedrale',haki:2,age:3,d:'Remplace le Centre de maîtrise du Haki : +1 Recrues/s, défense de la ville +15 %, Unités d\\'élite 20 % moins chères ici. Ouvre le rang 3 du Haki. Il faut un rang 2 de Haki.'}
};
/* OP Adventure : familles de bâtiments (du plus ancien au plus avancé). Une amélioration exige le bâtiment d'avant et prend sa place. */
const BFAM=[['caserne','base_mil','qg'],['muraille','forteresse','base_strat'],['marche','grand_port','centre_com'],['bibliotheque','biblio2','universite'],['temple','cathedrale','elite_c']];
const famOf=id=>BFAM.find(f=>f.includes(id))||[id];
/* une ville a-t-elle ce bâtiment OU une de ses améliorations ? */
const hasB=(t,id)=>{if(!t||!t.city)return false;const f=famOf(id),i=f.indexOf(id);return t.city.b.some(b=>f.indexOf(b)>=i&&f.indexOf(b)>=0);};
const tierB=(t,fam0)=>{if(!t||!t.city)return 0;const f=famOf(fam0);let r=0;for(const b of t.city.b){const i=f.indexOf(b);if(i+1>r)r=i+1;}return r;};"""
rep(a,b)
rep("  {id:'oracle',n:'Voix de toutes choses',tech:'theologie',cost:150,time:50,d:'Volonté +40 %.',fx:{faith:.4}},",
    "  {id:'oracle',n:'Voix de toutes choses',tech:'theologie',cost:150,time:50,d:'Savoir +15 %, Influence +0,1/s : entendre la voix des Poneglyphes.',fx:{sci:.15,inf:.1}},")
rep("const BLD_INCOME={marche:{g:.5},bibliotheque:{s:.45},temple:{f:.35},universite:{s:1},cathedrale:{f:.8}};",
    "const BLD_INCOME={marche:{g:.5},bibliotheque:{s:.45},temple:{f:.3},caserne:{f:.25},base_mil:{f:.5},qg:{f:.8},grand_port:{g:1.1},centre_com:{g:2},biblio2:{s:.8},universite:{s:1.4},cathedrale:{f:.6},elite_c:{f:1}};")
rep("const AIB=['marche','bibliotheque','caserne','temple','muraille','universite','cathedrale'];",
    "const AIB=['marche','bibliotheque','caserne','temple','muraille','grand_port','biblio2','base_mil','forteresse','cathedrale','centre_com','universite','qg','base_strat','elite_c'];")

# ---------- Voies religieuses et Fruits « bonus d'île » retirés ----------
rep("const FXN={atk:'Attaque',def:'Défense',spd:'Vitesse',gold:'Berrys',sci:'Savoir',faith:'Volonté',regen:'Recrues naturelles'};",
    "const FXN={atk:'Attaque',def:'Défense',spd:'Vitesse',gold:'Berrys',sci:'Savoir',faith:'Recrues',regen:'Renforts naturels',inf:'Influence /s',elite:'Unités d\\'élite'};")
rep("""  paramecia:{n:'Paramecia',d:'Berrys +15 %, Savoir +15 %',fx:{gold:.15,sci:.15}},
  zoan:{n:'Zoan',d:'Attaque +15 %, vitesse +15 %',fx:{atk:.15,spd:.15}},
  logia:{n:'Logia',d:'Défense +20 %',fx:{def:.2}}""",
"""  paramecia:{n:'Paramecia',d:'Fruit du Démon introuvable : il peut donner un utilisateur rare (techniques variées, offensives ou utilitaires)',fx:{}},
  zoan:{n:'Zoan',d:'Fruit du Démon introuvable : il peut donner un utilisateur rare (transformation, puissance physique, endurance)',fx:{}},
  logia:{n:'Logia',d:'Fruit du Démon introuvable : il peut donner un utilisateur rare (corps élémentaire, insaisissable sans Haki de l\\'Armement)',fx:{}}""")
rep("""  if(p.religion){
    const r=RELS.find(x=>x.id===p.religion),k=p.ferveur?2:1;
    for(const key in r.fx)m[key]+=r.fx[key]*k;
    m.faith+=.10*k;
  }""","""  opHakiFx(p,m);/* OP Adventure : Haki de l'Observation et de l'Armement (les Voies sont retirées) */""")
rep("    if(t.fruit){const f=FRUITS[t.fruit];for(const k in f.fx)m[k]+=f.fx[k]*cw.fruitX;}\n","")
rep("const m={atk:0,def:0,spd:0,gold:0,sci:0,faith:0,regen:0,cap:0,recruit:0,fruitCost:0,inf:0,rt:0,fc:0,fd:0,fm:0};\n  for(const id in p.techs)",
    "const m={atk:0,def:0,spd:0,gold:0,sci:0,faith:0,regen:0,cap:0,recruit:0,fruitCost:0,inf:0,rt:0,fc:0,fd:0,fm:0,elite:0};\n  for(const id in p.techs)")
rep("const MODZERO=()=>({atk:0,def:0,spd:0,gold:0,sci:0,faith:0,regen:0,cap:0,recruit:0,fruitCost:0,inf:0,rt:0,fc:0,fd:0,fm:0});",
    "const MODZERO=()=>({atk:0,def:0,spd:0,gold:0,sci:0,faith:0,regen:0,cap:0,recruit:0,fruitCost:0,inf:0,rt:0,fc:0,fd:0,fm:0,elite:0});")
rep("const FOUND_COST=40,FERV_COST=120,CONV_NEUTRAL=25,CONV_ENEMY=45,CONV_MAX_UNITS=6;",
    "const FOUND_COST=40,FERV_COST=120,CONV_NEUTRAL=8,CONV_ENEMY=14,CONV_MAX_UNITS=6;/* OP Adventure : le Ralliement se paie en ⚜ Influence */")

# ---------- revenus : bâtiments par famille, Influence ----------
rep("i:Math.max(0,.22+tradePartners(p.id)*.04+m.inf)*p.inc*Z};","i:Math.max(0,.3+tradePartners(p.id)*.04+m.inf+opInfB(p))*p.inc*Z};")

# ---------- recrutement : Berrys + Recrues ----------
rep("""function recruitCost(p,t,k){
  const c=t&&t.city&&t.city.b.includes('caserne')?.8:1;
  const fc=k==='cavalier'?Math.min(.5,p.mod.fruitCost||0):0;
  return Math.max(3,Math.round(UNITS[k].cost*(1-Math.min(.6,p.mod.recruit))*(1-fc)*c));
}""","""function recruitCost(p,t,k){
  const tb=tierB(t,'caserne'),c=[1,.8,.7,.6][tb]*(k==='elite'&&hasB(t,'elite_c')?.8:1);
  return Math.max(3,Math.round(UNITS[k].cost*(1-Math.min(.6,p.mod.recruit))*c));
}
/* OP Adventure : Recrues (⚔) consommées par un lot */
function recruitMen(p,t,k){const tb=tierB(t,'caserne');return Math.max(1,Math.round((UNITS[k].rc||4)*[1,1,.85,.75][tb]));}""")
rep("""  const c=recruitCost(p,t,k);
  if(p.gold<c)return 'Berrys insuffisants ('+c+' requis).';
  p.gold-=c;t.u[k]+=UNITS[k].batch;stInc(p.id,'ru');return '';""","""  const c=recruitCost(p,t,k),rm=recruitMen(p,t,k);
  if(p.gold<c)return 'Berrys insuffisants ('+c+' requis).';
  if(p.faith<rm)return 'Recrues insuffisantes ('+rm+' ⚔ requises).';
  p.gold-=c;p.faith-=rm;t.u[k]=(t.u[k]||0)+UNITS[k].batch;stInc(p.id,'ru');return '';""")

# ---------- combat : unités d'élite, fortifications par niveau, champions (commandants et utilisateurs de Fruit) ----------
rep("    s+=n*(mode==='atk'?UNITS[k].atk:UNITS[k].def)*m;","    s+=n*(mode==='atk'?UNITS[k].atk:UNITS[k].def)*m*(k==='elite'?opEliteK(u):1);")
rep("  if(t.city){f*=1.15;if(t.city.b.includes('muraille'))f*=1.35;}",
    "  if(t.city){f*=1.15;f*=[1,1.35,1.6,1.9][tierB(t,'muraille')];f*=[1,1,1.1,1.15][tierB(t,'temple')];}")
rep("const flags={city:!!t.city,wall:!!(t.city&&t.city.b.includes('muraille')),cap:!!t.capital};",
    "const flags={city:!!t.city,wall:hasB(t,'muraille'),cap:!!t.capital};")
rep("    if(t.city&&t.city.b.includes('caserne'))reg+=.2;","    reg+=[0,.2,.35,.5][tierB(t,'caserne')];")

# ---------- constructions : améliorations ----------
rep("""  }else{
    if(def.tech&&!p.techs[def.tech])return 'Technologie requise : '+TECH[def.tech].n+'.';
    if(def.rel&&!p.religion)return 'Une Voie est requise.';
    if(c.b.includes(id))return 'Déjà construit ici.';
  }""","""  }else{
    if(def.tech&&!p.techs[def.tech])return 'Technologie requise : '+TECH[def.tech].n+'.';
    if(hasB(t,id))return c.b.includes(id)?'Déjà construit ici.':'Déjà amélioré ici.';
    if(def.up&&!c.b.includes(def.up))return 'Nécessite : '+BUILDINGS[def.up].n+' dans cette ville.';
    if(def.haki&&opHakiMax(p)<def.haki)return 'Nécessite un rang '+def.haki+' de Haki (onglet Haki).';
  }""")
rep("  if(usedSlots(t)>=slotsOf(t))return 'Plus d\\'emplacement libre.';\n  const def=defOfBuild(id);",
    "  const def=defOfBuild(id);\n  if(!def.up&&usedSlots(t)>=slotsOf(t))return 'Plus d\\'emplacement libre.';")
rep("        t.city.b.push(q.id);t.city.q=null;stInc(p.id,'bd');",
    "        {const D0=BUILDINGS[q.id];const ix=D0&&D0.up?t.city.b.indexOf(D0.up):-1;if(ix>=0)t.city.b[ix]=q.id;else t.city.b.push(q.id);}t.city.q=null;stInc(p.id,'bd');")

# ---------- Ralliement : Influence au lieu de Volonté, plus de Voie requise ----------
rep("const convertCost=(t,p)=>{const base=t.owner<0?CONV_NEUTRAL:CONV_ENEMY;let d=CREWS[p.crew||0].rally||0;if(p.religion==='guerre')d+=.3;return Math.max(8,Math.round(base*(1-Math.min(.6,d))));};",
    "const convertCost=(t,p)=>{const base=t.owner<0?CONV_NEUTRAL:CONV_ENEMY;let d=(CREWS[p.crew||0].rally||0)+(opHasHdR(p.id)?.3:0);return Math.max(4,Math.round(base*(1-Math.min(.6,d))));};")
rep("  if(!p.religion)return 'Choisissez d\\'abord une Voie.';\n  if(t.owner===p.id)return 'Ce territoire est déjà à vous.';",
    "  if(t.owner===p.id)return 'Ce territoire est déjà à vous.';")
rep("  if(p.faith<convertCost(t,p))return 'Volonté insuffisante ('+convertCost(t,p)+' requis).';",
    "  if(p.x.inf<convertCost(t,p))return 'Influence insuffisante ('+convertCost(t,p)+' ⚜ requis).';")
rep("  if(convertReason(p,t))return false;\n  p.faith-=convertCost(t,p);","  if(convertReason(p,t))return false;\n  p.x.inf-=convertCost(t,p);")

# ---------- âges : héritage « Influence », options sans Volonté ----------
rep("  {id:'cul',n:'Culture',ic:'✹',m:'Volonté produite (+40 par lieu légendaire)',th:[[60,100,150],[150,280,450],[300,600,950]]}",
    "  {id:'cul',n:'Influence',ic:'⚜',m:'Influence produite ×10 (+40 par lieu légendaire)',th:[[60,100,150],[150,280,450],[300,600,950]]}")
rep("p.x.me[1]+=Math.max(0,r.g)*dt;p.x.me[2]+=r.s*dt;p.x.me[3]+=r.f*dt;","p.x.me[1]+=Math.max(0,r.g)*dt;p.x.me[2]+=r.s*dt;p.x.me[3]+=(r.i||0)*10*dt;")
rep("{id:'g_mil',k:'g',pi:0,n:'Âge d\\'or militaire',d:'Attaque +10 %, recrues +15 %.',fx:{atk:.10,regen:.15}},",
    "{id:'g_mil',k:'g',pi:0,n:'Âge d\\'or militaire',d:'Attaque +10 %, renforts naturels +15 %.',fx:{atk:.10,regen:.15}},")
rep("{id:'g_cul',k:'g',pi:3,n:'Âge d\\'or culturel',d:'Volonté +20 %, Influence +0,10/s.',fx:{faith:.20,inf:.10}},",
    "{id:'g_cul',k:'g',pi:3,n:'Âge d\\'or diplomatique',d:'Influence +0,15/s, Recrues +10 %.',fx:{inf:.15,faith:.10}},")
rep("{id:'d_cul',k:'d',pi:3,n:'Ferveur sauvage',d:'Volonté +25 %, mais Berrys −8 %.',fx:{faith:.25,gold:-.08}},",
    "{id:'d_cul',k:'d',pi:3,n:'Propagande',d:'Influence +0,2/s, mais Berrys −8 %.',fx:{inf:.2,gold:-.08}},")
rep("{id:'l_faith',k:'l',pi:3,n:'Chants des insulaires',d:'Volonté +10 %.',fx:{faith:.10}},",
    "{id:'l_faith',k:'l',pi:3,n:'Appel aux volontaires',d:'Recrues +10 %.',fx:{faith:.10}},")
rep("  {id:'cul',n:'Culturel',ic:'✹',d:'Volonté +5 % par rang',fx:{faith:.05}},","  {id:'cul',n:'Mobilisateur',ic:'⚔',d:'Recrues +5 % par rang',fx:{faith:.05}},")
rep("const SPECS={g:'Berrys',s:'Savoir',f:'Volonté',r:'Recrues'};","const SPECS={g:'Berrys',s:'Savoir',f:'Recrues',r:'Renforts'};")
rep("  m.sci+=.06*(x.dc||[]).length;/* Poneglyphes déchiffrés */","  m.sci+=(p.techs&&p.techs.siecle?.12:.06)*(x.dc||[]).length;/* Poneglyphes déchiffrés (×2 avec le Siècle oublié) */")
rep("const decCost=()=>({g:Math.max(10,Math.round(DEC_COST.g*PK/6)),s:Math.max(5,Math.round(DEC_COST.s*PK/6))});",
    "const decCost=p=>{const k=p&&p.techs&&p.techs.theologie?.75:1;return {g:Math.max(10,Math.round(DEC_COST.g*PK/6*k)),s:Math.max(5,Math.round(DEC_COST.s*PK/6*k))};};")

# ---------- IA : Recrues, Haki, Ralliement par l'Influence ----------
rep("""  if(!p.religion){
    if(p.faith>=FOUND_COST){const pr=RELS.find(r=>r.br===p.ai.pref[0])||RELS[0];foundReligion(p,pr.id);}
  }else if(!p.ferveur&&p.ai.wantFerv){
    if(p.faith>=FERV_COST)buyFerveur(p);
  }else{
    let bestT=null,bestC=1e9;""","""  try{opAiThink(p);}catch(_){}
  {
    let bestT=null,bestC=1e9;""")
rep("  const opts=UK.filter(k=>unitOK(p,k)&&(!heavy||k==='guerrier')&&p.gold>=recruitCost(p,t,k));",
    "  const opts=UK.filter(k=>unitOK(p,k)&&(!heavy||k==='guerrier')&&p.gold>=recruitCost(p,t,k)&&p.faith>=recruitMen(p,t,k));")
rep("  const W2={guerrier:3,lancier:2,archer:2,cavalier:1.5,catapulte:1};","  const W2={guerrier:3,lancier:2,archer:2,cavalier:1.5,catapulte:1,elite:1.6};")
open(P,'w',encoding='utf-8').write(h)
print('ok')
