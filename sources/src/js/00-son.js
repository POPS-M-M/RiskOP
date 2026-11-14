/* ================= Son : 5 ambiances + 2 volumes indépendants =================
   Tout est synthétisé par le navigateur (Web Audio) : aucun fichier audio, donc rien de la bande originale de l’œuvre.
   Ambiances (scènes) : exploration · développement · tension militaire · guerre · victoire / défaite.
   La scène change sur un temps fort (début de mesure), avec un petit « souffle » de transition ; les notes déjà lancées s’éteignent d’elles-mêmes (fondu enchaîné naturel).
   Volumes : Musique et Effets sont réglés séparément ; « Tout couper » coupe les deux. */
const SND={on:true,mv:.35,sv:.7,ctx:null,out:null,mus:null,fx:null,dr:null,send:null,nb:null,scene:'explore',want:'explore',sceneAt:0,until:0,next:0,beat:0,bar:0,n:0,last:{},mel:3,dead:false,timer:0,stinger:0,log:[]};
try{const o=JSON.parse(localStorage.getItem('rk-snd')||localStorage.getItem('gl-snd')||'null');if(o&&typeof o==='object'){SND.on=o.on!==false;const m=+(o.mv!=null?o.mv:o.vol),s=+(o.sv!=null?o.sv:o.vol);SND.mv=m>=0&&m<=1?m:.35;SND.sv=s>=0&&s<=1?s:.7;}}catch(_){}
function sndSave(){try{localStorage.setItem('rk-snd',JSON.stringify({on:SND.on,mv:SND.mv,sv:SND.sv}));}catch(_){}}
const SND_G=2.2;
const mfreq=m=>440*Math.pow(2,(m-69)/12);
const SND_SCENES={
  explore:{n:'Exploration',len:.4545,ch:[[50,57,62,65],[46,53,58,62],[48,55,60,64],[45,52,57,60]],sc:[62,65,67,69,72,74,77],wave:'triangle',pad:.05,mel:.34,mv:.06},
  dev:{n:'Développement',len:.5,ch:[[48,55,60,64],[45,52,57,60],[41,48,53,57],[43,50,55,59]],sc:[60,62,64,67,69,72,74],wave:'sine',pad:.045,mel:.3,mv:.055,arp:true},
  tense:{n:'Tension militaire',len:.38,ch:[[38,45,50],[38,45,51],[36,43,48],[37,44,49]],sc:[62,63,65,68,70],wave:'sawtooth',pad:.013,mel:.14,mv:.04,pulse:true},
  war:{n:'Guerre',len:.3125,ch:[[50,57,62],[51,58,63],[50,57,62],[48,55,60]],sc:[62,64,65,67,69,70,73,74],wave:'sawtooth',pad:.018,mel:.3,mv:.05,drums:true},
  win:{n:'Victoire',len:.4,ch:[[48,55,64,72],[53,60,65,69],[55,62,67,71],[48,55,64,72]],sc:[72,74,76,79,81,84],wave:'triangle',pad:.06,mel:.5,mv:.08,arp:true},
  lose:{n:'Défaite',len:.75,ch:[[45,52,57],[41,48,53],[43,50,55],[38,45,50]],sc:[57,60,62,64,65],wave:'sine',pad:.06,mel:.18,mv:.05}
};
function sndBuild(ctx){
  SND.ctx=ctx;
  const comp=ctx.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=6;comp.connect(ctx.destination);
  const out=ctx.createGain();out.gain.value=SND.on?SND_G:0;out.connect(comp);SND.out=out;
  SND.mus=ctx.createGain();SND.mus.gain.value=SND.mv*.9;SND.mus.connect(out);
  SND.dr=ctx.createGain();SND.dr.gain.value=1;SND.dr.connect(SND.mus);
  SND.fx=ctx.createGain();SND.fx.gain.value=SND.sv*1.1;SND.fx.connect(out);
  const dl=ctx.createDelay(1),fb=ctx.createGain(),lp=ctx.createBiquadFilter();
  dl.delayTime.value=.42;fb.gain.value=.36;lp.type='lowpass';lp.frequency.value=1700;
  SND.send=ctx.createGain();SND.send.gain.value=.35;SND.send.connect(dl);dl.connect(lp);lp.connect(fb);fb.connect(dl);lp.connect(SND.mus);
  const nb=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate),d=nb.getChannelData(0);
  let sd=12345;for(let i=0;i<d.length;i++){sd=(sd*1103515245+12345)&0x7fffffff;d[i]=sd/0x3fffffff-1;}
  SND.nb=nb;SND.next=0;SND.beat=0;SND.bar=0;
}
function sTone(dest,f,t,dur,type,vol,att,slide,send){
  const c=SND.ctx,o=c.createOscillator(),g=c.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t);
  if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,slide),t+dur);
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+(att||.01));g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g);g.connect(dest);if(send)g.connect(SND.send);
  o.start(t);o.stop(t+dur+.05);SND.n++;
}
function sNoise(dest,t,dur,vol,freq,q,type,sweep){
  const c=SND.ctx,src=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
  src.buffer=SND.nb;f.type=type||'bandpass';f.frequency.setValueAtTime(freq,t);if(sweep)f.frequency.exponentialRampToValueAtTime(sweep,t+dur);f.Q.value=q||1;
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  src.connect(f);f.connect(g);g.connect(dest);src.start(t,0,dur+.05);SND.n++;
}
function sndBeat(t){
  const S=SND_SCENES[SND.scene],ch=S.ch[SND.bar%4],stp=SND.beat,len=S.len,m=SND.mus;
  if(stp===0){
    for(const n of ch)sTone(m,mfreq(n),t,len*8*1.12,S.wave,S.pad,S.drums?.4:S.pulse?.8:1.2,0,!S.drums&&!S.pulse);
    sTone(m,mfreq(ch[0]-12),t,len*4,'sine',.1,.05);
  }else if(stp===4)sTone(m,mfreq(ch[0]-12),t,len*3,'sine',.08,.05);
  if(S.arp&&stp%2===0)sTone(m,mfreq(ch[(stp/2)%ch.length]+12),t,len*1.6,'sine',.05,.01,0,true);
  if(S.pulse){
    if(stp===0||stp===3)sTone(SND.dr,70,t,.4,'sine',.3,.01,48);          /* battement de cœur */
    if(stp===5)sNoise(SND.dr,t,.1,.03,5200,1,'highpass');
    if(stp===0&&SND.bar%2===1)sNoise(SND.dr,t,len*5,.035,260,3,'bandpass',900); /* souffle qui monte */
  }
  if(S.drums){
    if(stp===0||stp===4||stp===5)sTone(SND.dr,130,t,.28,'sine',.28,.005,42);
    if(stp===2||stp===6)sNoise(SND.dr,t,.14,.1,1900,.8);
    if(stp%2===1)sNoise(SND.dr,t,.04,.025,7000,1,'highpass');
    sTone(m,mfreq(ch[0]-12),t,len*.7,'triangle',.05,.005);
  }
  if(Math.random()<S.mel&&(S.drums||S.pulse||stp%2===0)){
    SND.mel=Math.max(0,Math.min(S.sc.length-1,SND.mel+Math.round((Math.random()-.5)*4)));
    sTone(m,mfreq(S.sc[SND.mel]),t,S.drums?.5:1,'triangle',S.mv,.01,0,true);
  }
}
/* scène voulue d'après l'état de la partie ; priorité : fin > guerre > tension > développement > exploration */
function sndWant(){
  try{
    if(typeof over!=='undefined'&&over)return (over.winners||[]).includes(ME)?'win':'lose';
    if(!started||!players||!players[ME])return 'explore';
    if(performance.now()<SND.until)return 'war';
    const mine=new Set(terrs.filter(t=>t.owner===ME).map(t=>t.id));
    if(armies.some(a=>a.owner!==ME&&mine.has(a.to)&&!a.rt))return 'tense';
    if(marineWarned&&marineTarget===ME)return 'tense';
    if(TM.on&&TM.phase==='plan')return 'dev';
    if(TM.on&&TM.phase==='res'&&armies.length>1)return 'tense';
    return 'explore';
  }catch(_){return 'explore';}
}
function sndSetScene(s){
  if(s===SND.scene)return;
  SND.log.push(SND.scene+'→'+s);if(SND.log.length>40)SND.log.shift();
  SND.scene=s;SND.sceneAt=performance.now();
  if(SND.ctx&&SND.on&&SND.ctx.state==='running'){const t=SND.ctx.currentTime+.02;sNoise(SND.dr,t,.9,.05,400,1.2,'bandpass',2600);}
  sndUI();
}
function sndFill(limit){
  while(SND.next<limit){
    if(SND.beat===0){
      const w=sndWant(),held=performance.now()-SND.sceneAt;
      /* fin et guerre passent tout de suite ; les autres changements attendent au moins 10 s pour éviter le va-et-vient */
      if(w!==SND.scene&&(w==='win'||w==='lose'||w==='war'||SND.scene==='win'||SND.scene==='lose'||held>10000))sndSetScene(w);
    }
    sndBeat(SND.next);
    SND.next+=SND_SCENES[SND.scene].len;
    SND.beat=(SND.beat+1)%8;if(!SND.beat)SND.bar++;
  }
}
function sndSched(){
  const c=SND.ctx;if(!c||!SND.on||c.state!=='running')return;
  if(SND.mv<=0.001)return;
  if(SND.next<c.currentTime)SND.next=c.currentTime+.05;
  sndFill(c.currentTime+1.4);
}
function sndInit(){
  if(SND.ctx||SND.dead)return;
  try{
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC){SND.dead=true;return;}
    sndBuild(new AC());
    SND.timer=setInterval(sndSched,300);
  }catch(_){SND.dead=true;SND.ctx=null;}
}
function sndApply(){
  if(SND.ctx){try{const t=SND.ctx.currentTime;SND.out.gain.setTargetAtTime(SND.on?SND_G:0,t,.05);SND.mus.gain.setTargetAtTime(SND.mv*.9,t,.05);SND.fx.gain.setTargetAtTime(SND.sv*1.1,t,.05);}catch(_){}}
  sndUI();
}
function sndUI(){
  const b=$('#b-snd');if(!b)return;
  b.classList.toggle('off',!SND.on||SND.dead);
  const l=$('#snd-l');
  if(l)l.textContent=SND.dead?' indisponible':SND.on?' '+SND_SCENES[SND.scene].n:' coupé';
  b.title=SND.dead?'Le son n’est pas disponible dans ce navigateur':'Son : musique '+Math.round(SND.mv*100)+' %, effets '+Math.round(SND.sv*100)+' %';
  const p=$('#sndp');if(p&&!p.hidden){const sc=$('#sndp-sc');if(sc)sc.textContent='Ambiance : '+SND_SCENES[SND.scene].n;}
}
function sndPop(){
  let p=$('#sndp');
  if(!p){
    p=document.createElement('div');p.id='sndp';p.className='sndp';p.hidden=true;p.setAttribute('role','dialog');p.setAttribute('aria-label','Réglages du son');
    p.style.position='fixed';
    p.innerHTML='<label>Musique <b id="sv-m"></b><input type="range" id="sr-m" min="0" max="100" step="5" aria-label="Volume de la musique"></label>'
      +'<label>Effets <b id="sv-s"></b><input type="range" id="sr-s" min="0" max="100" step="5" aria-label="Volume des effets sonores"></label>'
      +'<div style="display:flex;gap:6px;flex-wrap:wrap"><button id="sn-on" class="btn">Tout couper</button><button id="sn-t" class="btn">Test effet</button></div>'
      +'<span id="sndp-sc"></span><span>Cinq ambiances : exploration, développement, tension, guerre, victoire / défaite. Musique synthétisée, aucun extrait de l’œuvre.</span>';
    document.body.appendChild(p);
    const upd=()=>{$('#sv-m').textContent=Math.round(SND.mv*100)+' %';$('#sv-s').textContent=Math.round(SND.sv*100)+' %';$('#sn-on').textContent=SND.on?'Tout couper':'Réactiver le son';};
    p._upd=upd;
    $('#sr-m').addEventListener('input',e=>{SND.mv=+e.target.value/100;sndSave();sndApply();upd();});
    $('#sr-s').addEventListener('input',e=>{SND.sv=+e.target.value/100;sndSave();sndApply();upd();});
    $('#sn-on').addEventListener('click',()=>{SND.on=!SND.on;sndSave();if(SND.on){sndInit();if(SND.ctx&&SND.ctx.state==='suspended')SND.ctx.resume();}sndApply();upd();});
    $('#sn-t').addEventListener('click',()=>{sndInit();if(SND.ctx&&SND.ctx.state==='suspended')SND.ctx.resume().catch(()=>{});sndFx('conquer');});
  }
  return p;
}
function sndCycle(){
  const p=sndPop(),b=$('#b-snd');
  p.hidden=!p.hidden;
  if(!p.hidden){
    const r=b.getBoundingClientRect();p.style.top=Math.round(r.bottom+6)+'px';p.style.left=Math.max(8,Math.min(innerWidth-246,Math.round(r.right-230)))+'px';p.style.right='auto';
    $('#sr-m').value=Math.round(SND.mv*100);$('#sr-s').value=Math.round(SND.sv*100);p._upd();
    if(SND.on){sndInit();if(SND.ctx&&SND.ctx.state==='suspended')SND.ctx.resume().catch(()=>{});}
    sndUI();
  }
}
document.addEventListener('pointerdown',e=>{const p=$('#sndp');if(p&&!p.hidden&&!e.target.closest('#sndp,#b-snd'))p.hidden=true;},true);
addEventListener('keydown',e=>{if(e.key==='Escape'){const p=$('#sndp');if(p&&!p.hidden)p.hidden=true;}});
function sndFx(k){
  if(!SND.ctx||!SND.on||SND.dead||SND.ctx.state!=='running'||SND.sv<=0.001)return;
  const now=performance.now();if(SND.last[k]&&now-SND.last[k]<150)return;SND.last[k]=now;
  const t=SND.ctx.currentTime+.01,d=SND.fx;
  if(k==='conquer'||k==='conquer0'){[72,76,79].forEach((n,i)=>sTone(d,mfreq(n),t+i*.09,.35,'triangle',.18,.01));}
  else if(k==='clash'||k==='battle'){sNoise(d,t,.2,.22,900,.7);sTone(d,110,t,.25,'sine',.3,.005,50);}
  else if(k==='build'){sTone(d,230,t,.09,'square',.07,.003,170);sTone(d,190,t+.12,.09,'square',.07,.003,140);}
  else if(k==='recruit'){sTone(d,660,t,.07,'sine',.14,.004);sTone(d,880,t+.06,.07,'sine',.1,.004);}
  else if(k==='bell'){sTone(d,880,t,1.3,'sine',.14,.005);sTone(d,1760,t,.8,'sine',.05,.005);}
  else if(k==='chime'){sTone(d,784,t,.5,'sine',.15,.005);sTone(d,1175,t+.12,.7,'sine',.15,.005);}
  else if(k==='ach'){[72,76,79,84].forEach((n,i)=>sTone(d,mfreq(n),t+i*.1,.6,'triangle',.17,.01));}
  else if(k==='boss'){sTone(d,70,t,.5,'sine',.4,.005,38);sTone(d,70,t+.35,.6,'sine',.4,.005,36);sNoise(d,t,.3,.12,300,.7);}
  else if(k==='win'){[67,72,76,79,84].forEach((n,i)=>sTone(d,mfreq(n),t+i*.14,.9,'triangle',.18,.01,0,true));}
  else if(k==='lose'){[69,65,62,57].forEach((n,i)=>sTone(d,mfreq(n),t+i*.28,1,'triangle',.16,.02,0,true));}
  else if(k==='alarm'){sTone(d,196,t,.22,'square',.07,.004,150);sTone(d,196,t+.26,.22,'square',.07,.004,150);}
  else if(k==='resolve'){sNoise(d,t,.5,.06,500,1.2,'bandpass',2400);sTone(d,330,t,.2,'triangle',.08,.01);}
  else if(k==='go'){sTone(d,330,t,.12,'triangle',.12,.004);sTone(d,495,t+.09,.18,'triangle',.12,.004);}
  else if(k==='step'){sTone(d,740,t,.12,'sine',.1,.004);}
}
function sndBanner(text){
  if(/^Succès débloqué/.test(text))sndFx('ach');
  else if(/^Mission accomplie/.test(text))sndFx('chime');
  else if(/^Buster Call/.test(text))sndFx('boss');
  else if(/avis de recherche|^Événement : /.test(text))sndFx('bell');
}
document.addEventListener('pointerdown',()=>{if(SND.on&&!SND.ctx)sndInit();if(SND.ctx&&SND.ctx.state==='suspended'&&!document.hidden)SND.ctx.resume().catch(()=>{});},true);
document.addEventListener('visibilitychange',()=>{const c=SND.ctx;if(!c)return;try{if(document.hidden)c.suspend();else if(SND.on)c.resume();}catch(_){}});
