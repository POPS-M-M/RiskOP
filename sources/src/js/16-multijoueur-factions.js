/* ================= Multijoueur : choix de la faction dans la salle d'attente =================
   Chaque joueur choisit sa faction (Marine, Pirates, Révolutionnaires, Chasseurs de prime).
   - Le client annonce son souhait dans sa présence ({crew}) ; l'hôte arbitre (premier arrivé, premier servi)
     et publie la répartition finale ({crews}) : c'est elle qui sert à lancer la partie.
   - Les places tenues par l'IA reçoivent les factions restantes.
   Le siège (couleur, ordre de jeu) ne change pas : seule la faction associée au siège est choisie. */
NET.crews=[0,1,2,3];NET.myCrew=crewPick;
const mpValid=c=>Number.isInteger(c)&&c>=0&&c<4;
/* hôte : calcule la répartition à partir des souhaits */
function mpAssignCrews(ps){
  const want=[0,1,2,3].map(s=>{
    const st=NET.seats[s];if(!st)return -1;
    if(s===0)return NET.myCrew;
    const p=ps.find(x=>x.peer===st.peer),c=p&&p.presence?p.presence.crew:-1;
    return mpValid(c)?c:-1;
  });
  const out=[-1,-1,-1,-1],taken=new Set();
  for(let s=0;s<4;s++)if(want[s]>=0&&!taken.has(want[s])){out[s]=want[s];taken.add(want[s]);}
  for(let s=0;s<4;s++)if(out[s]<0){const c=[0,1,2,3].find(x=>!taken.has(x));out[s]=c;taken.add(c);}
  NET.crews=out;
}
function mpCrewsNow(){if(NET.host)return NET.crews;const c=NET.hp&&NET.hp.presence&&NET.hp.presence.crews;return Array.isArray(c)&&c.length===4&&c.every(mpValid)?c:[0,1,2,3];}
function mpMySeat(seats){if(NET.host)return 0;return seats.findIndex(x=>x&&x[0]===NET.myPeer);}
function mpCrewOf(i){return mpCrewsNow()[i];}
function mpPicker(seats){
  const crews=mpCrewsNow(),me=mpMySeat(seats),mine=me>=0?crews[me]:crewPick;
  const takenBy={};seats.forEach((x,s)=>{if(x&&s!==me)takenBy[crews[s]]=cleanName(x[1],'Joueur');});
  const wantLost=me>=0&&crewPick!==mine&&!NET.host;
  return '<h3 style="margin:12px 0 6px">Votre faction</h3><div class="crews mpcrews" role="radiogroup" aria-label="Votre faction">'
    +CREWS.map((c,i)=>{const tk=takenBy[i],on=i===mine;
      return '<button type="button" role="radio" aria-checked="'+on+'" class="crew'+(on?' on':'')+'" data-mpcrew="'+i+'"'+(tk?' disabled':'')+'><b>'+c.ic+' '+c.n+'</b><small>'+(tk?'Prise par '+esc(tk):esc(c.t))+'</small></button>';}).join('')+'</div>'
    +(wantLost?'<p class="note" style="margin:0 0 8px">La faction demandée est déjà prise : l’hôte vous a attribué '+CREWS[mine].n+'.</p>':'');
}
function mpBindPicker(){
  overlay.querySelectorAll('[data-mpcrew]').forEach(b=>b.addEventListener('click',()=>{
    if(b.disabled)return;const c=+b.dataset.mpcrew;crewPick=c;try{localStorage.setItem('gl-crew',String(c));}catch(_){}
    if(NET.host){NET.myCrew=c;if(NET.room)hostSync(NET.room.peers());}
    else if(NET.room)NET.room.presence({crew:c}).catch(()=>{});
    NET.lobbyKey='';renderLobby();
  }));
}
