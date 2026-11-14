/* Musique : 3 morceaux médiévaux + 1 chant de marins : 3 morceaux originaux, composés pour le jeu et joués par le navigateur (Web Audio, aucun fichier).
   Instruments imités : flûte à bec (vibrato), luth (cordes pincées), bourdon de vielle / cornemuse, cor, tambour sur cadre, tambourin.
   1. « Le port du village » (ré dorien)       : exploration, paix.
   2. « Le conseil des capitaines » (sol mixolydien) : phase d'ordres, développement.
   3. « Bataille » (ré phrygien)                : menace (tension, sans mélodie au début) puis guerre (complète).
   4. « L'appel du large » (ré mixolydien) : chant de marins original (accordéon), en alternance avec le 1 en exploration.
   Fin de partie : morceau 4 en fanfare (victoire), du morceau 2 lent et en mineur (défaite).
   Les moments où la musique change (scènes) ne bougent pas : seul ce qui est joué change. */
const MED_NOTE={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
/* « D5 - E5 . » : note, « - » prolonge la note précédente, « . » silence ; 8 temps par mesure */
function medBar(s){
  const tk=s.trim().split(/\s+/),out=Array(8).fill(null);let last=-1;
  tk.forEach((x,i)=>{
    if(x==='-'){if(last>=0)out[last].d++;return;}
    if(x==='.'){last=-1;return;}
    const m=x.match(/^([A-G])(b|#)?(\d)$/);if(!m)return;
    out[i]={m:12*(+m[3]+1)+MED_NOTE[m[1]]+(m[2]==='b'?-1:m[2]==='#'?1:0),d:1};last=i;
  });
  return out;
}
const MED={
  port:{len:.28,roots:[50,50,48,45,50,48,53,50],mel:[
    'D5 - E5 F5 G5 - A5 -','G5 F5 E5 - D5 - . .','C5 - D5 E5 F5 - E5 D5','E5 - - - . . . .',
    'D5 - E5 F5 G5 - A5 B5','C6 - B5 A5 G5 - A5 -','F5 E5 D5 - C5 - E5 -','D5 - - - . . . .'].map(medBar),
    lead:'flute',lute:true,drum:'doux',drone:.05},
  conseil:{len:.36,roots:[43,43,48,50,43,41,50,43],mel:[
    'G4 - A4 B4 C5 - B4 A4','G4 - - D5 - - . .','E5 D5 C5 - B4 C5 D5 -','A4 - - - . . . .',
    'B4 - C5 D5 E5 - D5 C5','D5 - F5 - E5 D5 C5 -','B4 A4 G4 - A4 - B4 -','G4 - - - . . . .'].map(medBar),
    lead:'flute',lute:'harpe',drum:'rare',drone:.04},
  bataille:{len:.21,roots:[50,50,53,51,50,46,50,50],mel:[
    'D5 . D5 F5 G5 - F5 Eb5','D5 - - . A4 . C5 D5','F5 . F5 G5 A5 - G5 F5','Eb5 - D5 - . . . .',
    'A5 . A5 Bb5 A5 G5 F5 G5','A5 - - . G5 F5 Eb5 F5','D5 . F5 Eb5 D5 C5 Bb4 C5','D5 - - - . . . .'].map(medBar),
    lead:'cor',lute:false,drum:'marche',drone:.06},
  /* 4. « L'appel du large » (ré mixolydien) : chant de marins original, accordéon, cordes pincées, pieds et mains */
  large:{len:.27,roots:[50,43,48,50,50,48,48,50],mel:[
    'D5 - F#5 E5 D5 - A4 -','B4 C5 D5 - E5 - F#5 -','G5 - F#5 E5 D5 - C5 -','D5 - A4 - - . . .',
    'F#5 - A5 G5 F#5 - E5 D5','E5 - G5 F#5 E5 - D5 C5','C5 - E5 D5 C5 - A4 C5','D5 - - - D5 . . .'].map(medBar),
    lead:'accordeon',lute:'bouzouki',drum:'pont',drone:0}
};
/* scène du jeu → morceau joué */
const MED_MAP={explore:['port',1],dev:['conseil',1],tense:['bataille',.55],war:['bataille',1],win:['large',1.25],lose:['conseil',.7]};
/* exploration : « Le port du village » et « L'appel du large » alternent, deux tours de 8 mesures chacun */
const medKey=()=>{if(SND.scene!=='explore')return MED_MAP[SND.scene]||MED_MAP.explore;const k=Math.floor(SND.bar/16)%2?'large':'port';const n=k==='large'?'L’appel du large':'Le port du village';if(SND_SCENES.explore.n!==n){SND_SCENES.explore.n=n;try{sndUI();}catch(_){}}return [k,1];};
Object.assign(SND_SCENES.explore,{n:'Le port du village',len:MED.port.len});
Object.assign(SND_SCENES.dev,{n:'Le conseil des capitaines',len:MED.conseil.len});
Object.assign(SND_SCENES.tense,{n:'Bataille (menace)',len:MED.bataille.len*1.25});
Object.assign(SND_SCENES.war,{n:'Bataille',len:MED.bataille.len});
Object.assign(SND_SCENES.win,{n:'L’appel du large (fanfare)',len:MED.large.len*.9});
Object.assign(SND_SCENES.lose,{n:'Le conseil des capitaines (lent)',len:MED.conseil.len*1.6});
/* ---- instruments ---- */
function medFlute(f,t,dur,vol){
  const c=SND.ctx,o=c.createOscillator(),o2=c.createOscillator(),g=c.createGain(),lfo=c.createOscillator(),lg=c.createGain();
  o.type='sine';o2.type='triangle';o.frequency.setValueAtTime(f,t);o2.frequency.setValueAtTime(f*2,t);
  lfo.frequency.value=5.2;lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(f*.006,t+Math.min(.35,dur*.6));lfo.connect(lg);lg.connect(o.frequency);
  const g2=c.createGain();g2.gain.value=.12;o2.connect(g2);g2.connect(g);
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+.05);g.gain.setValueAtTime(vol*.85,t+Math.max(.06,dur-.08));g.gain.exponentialRampToValueAtTime(.0001,t+dur+.12);
  o.connect(g);g.connect(SND.mus);g.connect(SND.send);
  for(const x of [o,o2,lfo]){x.start(t);x.stop(t+dur+.2);}SND.n++;
}
function medPluck(f,t,vol,dec,bright){
  const c=SND.ctx,o=c.createOscillator(),o2=c.createOscillator(),lp=c.createBiquadFilter(),g=c.createGain();
  o.type='triangle';o2.type='sawtooth';o.frequency.value=f;o2.frequency.value=f*1.003;
  lp.type='lowpass';lp.frequency.setValueAtTime(bright||2600,t);lp.frequency.exponentialRampToValueAtTime(500,t+dec);
  const g2=c.createGain();g2.gain.value=.35;o2.connect(g2);g2.connect(lp);o.connect(lp);lp.connect(g);
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+dec);
  g.connect(SND.mus);g.connect(SND.send);
  for(const x of [o,o2]){x.start(t);x.stop(t+dec+.05);}SND.n++;
}
function medHorn(f,t,dur,vol){
  const c=SND.ctx,o=c.createOscillator(),lp=c.createBiquadFilter(),g=c.createGain();
  o.type='sawtooth';o.frequency.setValueAtTime(f*.985,t);o.frequency.linearRampToValueAtTime(f,t+.05);
  lp.type='lowpass';lp.frequency.setValueAtTime(700,t);lp.frequency.linearRampToValueAtTime(1500,t+.08);lp.Q.value=2;
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+.03);g.gain.setValueAtTime(vol*.8,t+Math.max(.04,dur-.05));g.gain.exponentialRampToValueAtTime(.0001,t+dur+.08);
  o.connect(lp);lp.connect(g);g.connect(SND.mus);g.connect(SND.send);o.start(t);o.stop(t+dur+.12);SND.n++;
}
function medDrone(r,t,dur,vol){
  /* bourdon de vielle : quinte tenue, filtrée */
  const c=SND.ctx,lp=c.createBiquadFilter(),g=c.createGain();lp.type='lowpass';lp.frequency.value=520;
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+.25);g.gain.setValueAtTime(vol,t+dur-.2);g.gain.exponentialRampToValueAtTime(.0001,t+dur+.15);
  lp.connect(g);g.connect(SND.mus);
  for(const [m,ty,k] of [[r,'sawtooth',.5],[r+7,'sawtooth',.35],[r-12,'sine',1]]){const o=c.createOscillator(),gg=c.createGain();o.type=ty;o.frequency.value=mfreq(m);gg.gain.value=k;o.connect(gg);gg.connect(lp);o.start(t);o.stop(t+dur+.2);}
  SND.n++;
}
function medAcc(f,t,dur,vol){
  /* accordéon : deux anches légèrement désaccordées, filtrées, avec un léger tremolo de soufflet */
  const c=SND.ctx,lp=c.createBiquadFilter(),g=c.createGain(),tr=c.createOscillator(),tg=c.createGain();
  lp.type='lowpass';lp.frequency.value=1900;lp.Q.value=.7;
  tr.frequency.value=6;tg.gain.value=vol*.12;tr.connect(tg);tg.connect(g.gain);
  for(const [ty,dt,k] of [['square',1,.5],['sawtooth',1.004,.45],['square',2,.12]]){const o=c.createOscillator(),gg=c.createGain();o.type=ty;o.frequency.value=f*dt;gg.gain.value=k;o.connect(gg);gg.connect(lp);o.start(t);o.stop(t+dur+.15);}
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+.035);g.gain.setValueAtTime(vol*.85,t+Math.max(.05,dur-.06));g.gain.exponentialRampToValueAtTime(.0001,t+dur+.1);
  lp.connect(g);g.connect(SND.mus);g.connect(SND.send);tr.start(t);tr.stop(t+dur+.15);SND.n++;
}
function medClap(t,vol){sNoise(SND.dr,t,.06,vol,1500,1.4);sNoise(SND.dr,t+.012,.07,vol*.8,1300,1.2);}
function medDrum(t,vol){sTone(SND.dr,92,t,.32,'sine',vol,.004,52);sNoise(SND.dr,t,.09,vol*.25,320,1.2,'lowpass');}
function medTamb(t,vol){sNoise(SND.dr,t,.07,vol,6500,1,'highpass');}
/* ---- un temps de musique ---- */
function sndBeat(t){
  const [key,k]=medKey(),P=MED[key],len=SND_SCENES[SND.scene].len,stp=SND.beat,bar=SND.bar%8;
  const root=P.roots[bar]+(SND.scene==='lose'&&bar%4===3?-1:0);
  const tense=SND.scene==='tense',win=SND.scene==='win',lose=SND.scene==='lose';
  if(stp===0&&P.drone)medDrone(root,t,len*8*1.02,P.drone*(tense?1.2:1));
  if(P.lead==='accordeon'&&(stp===0||stp===4)){medPluck(mfreq(root-12),t,.09,.5,900);for(const iv of [12,16,19])medAcc(mfreq(root+iv),t+len*2,len*.9,.02);}
  /* luth : arpège racine-quinte-octave ; harpe : un temps sur deux plus aigu */
  if(P.lute&&!tense){
    const arp=[0,7,12,7,0,7,12,7];
    if(P.lute==='bouzouki'){if(stp%2===1)medPluck(mfreq(root+12+arp[stp]),t,.085,.35,3600);}
    else if(P.lute==='harpe'){if(stp%2===0)medPluck(mfreq(root+12+arp[stp]),t,.07,1.4,3200);}
    else if(stp%2===0||stp===3)medPluck(mfreq(root+12+arp[stp]),t,.08*(lose?.6:1),.75);
  }
  /* mélodie (en « menace », elle n'apparaît qu'une mesure sur deux, plus bas) */
  const e=P.mel[bar][stp];
  if(e&&(!tense||SND.bar%2===1)){
    const f=mfreq(e.m-(tense?12:0)-(lose&&e.m%12===11?1:0))   /* défaite : si → si bémol, le morceau passe en mineur */,d=e.d*len*.95,v=(P.lead==='cor'?.07:.075)*k;
    if(P.lead==='cor')medHorn(f,t,d,v);else if(P.lead==='accordeon')medAcc(f,t,d,v*.95);else medFlute(f,t,d,v);
    if(win&&stp===0)medHorn(f/2,t,d,.04);
  }
  /* percussions */
  if(P.drum==='doux'){if(stp===0||stp===5)medDrum(t,.16);if(stp===3||stp===7)medTamb(t,.025);}
  else if(P.drum==='pont'){if(stp===0||stp===4)medDrum(t,.2);if(stp===2||stp===6)medClap(t,.06);}
  else if(P.drum==='rare'){if(stp===0&&bar%2===0)medDrum(t,.12);}
  else if(P.drum==='marche'){
    if(stp===0||stp===3||stp===6)medDrum(t,tense?.2:.26);
    if(!tense&&stp%2===1)medTamb(t,.03);
    if(!tense&&stp===4)sNoise(SND.dr,t,.12,.07,1700,.9);
  }
  if(win&&stp===0)medDrum(t,.22);
}
