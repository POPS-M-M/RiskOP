/* ================= TRANCHE DE JEU « AAA » (version test, branche essai/aaa-proto) =================
   1. Duel des commandants (bataille en temps réel) : deux commandants ennemis proches s'affrontent seul à seul ; les troupes ne s'en mêlent
      pas ; le vainqueur galvanise ses troupes proches (+12 de moral). Un ordre donné à son commandant rompt le duel. Réglage « rk-duel » (0 = coupé).
      Entre les deux duellistes, les coups portent ×20 avec une part de hasard (×0,45 à ×1,55), pour qu'un duel se décide en une dizaine de secondes, sans le bonus d'assaut de l'attaquant (armes égales) ; au bout de 12 s sans vainqueur, le duel s'arrête ; un seul duel par paire et par bataille.
   2. Lumière des impacts (principe HD-2D : une lumière au moment de chaque effet) et sons des coups, tirs, explosions, compétences.
   3. Primes visibles sur la carte : avis de recherche de chaque camp, alertes du Journal, bandeau du Buster Call.
      Option « Riposte de la Marine (essai) » (localStorage « rk-riposte », écran d'accueil) : dans la Course, le Buster Call d'origine est coupé
      (tools/build.js). L'option le rétablit avec une montée en puissance selon la prime de la cible. Option décochée = règles de la Course d'origine.
   4. Démo : choix de l'île parmi celles qui ont un terrain de bataille. */

/* ---------------------------------------------------------------- 1. duel ---------------------------------------------------------------- */
RT.duelOn=true;try{if(localStorage.getItem('rk-duel')==='0')RT.duelOn=false;}catch(_){}
const RT_DUEL={R:3.2,TMAX:12,BONUS:12,LOIN:8,X:20,UNE:true};   /* UNE : un seul duel par paire de commandants et par bataille */   /* X : coups entre duellistes, plus décisifs qu'en mêlée */
function rtDuelScan(R){if(!RT.duelOn||R.duel||R.end)return;R.duelPast=R.duelPast||{};
  for(const a of R.G){if(!a.hero||a.sd!==0||!rtAlive(a)||a.cast)continue;
    for(const b of R.G){if(!b.hero||b.sd!==1||!rtAlive(b)||b.cast)continue;const k=a.id+'-'+b.id;if(R.duelPast[k]!==undefined&&(RT_DUEL.UNE||R.t-R.duelPast[k]<20))continue;
      if(rtD(a,b)<=RT_DUEL.R){rtDuelStart(R,a,b);return;}}}}
function rtDuelStart(R,a,b){R.duel={a,b,t0:R.t,hp:[a.hp,b.hp]};a.duel=b;b.duel=a;for(const g of [a,b]){g.q=[];rtHalt(g);}
  rtLog(R,'Duel : '+a.hero+' contre '+b.hero+' !');if(R===RT.run&&!R.toutAuto){rtDuelCine(R,'start');rtSnd('duel');}R.uiDirty=true;}
RT.dst={};RT.DUEL=RT_DUEL;
function rtDuelEnd(R,w,why){const D=R.duel;if(!D)return;{const k=w?w.hero:'nul';RT.dst[k]=(RT.dst[k]||0)+1;}R.duelPast=R.duelPast||{};R.duelPast[D.a.id+'-'+D.b.id]=R.t;D.a.duel=null;D.b.duel=null;R.duel=null;
  if(w){const l=w===D.a?D.b:D.a;for(const q of R.G)if(q.sd===w.sd&&!q.hero&&rtAlive(q)&&rtD(q,w)<=RT_DUEL.LOIN){q.m=Math.min(100,q.m+RT_DUEL.BONUS);rtCause(R,q,w.hero+' gagne le duel +'+RT_DUEL.BONUS);}
    rtLog(R,w.hero+' remporte le duel contre '+l.hero+'.');}
  else rtLog(R,'Duel '+D.a.hero+' / '+D.b.hero+' interrompu'+(why?' : '+why:'')+'.');
  if(R===RT.run&&!R.toutAuto)rtDuelCine(R,'end',w,why);R.uiDirty=true;}
function rtDuelTick(R){const D=R.duel;if(!D)return;const {a,b}=D;
  if(!rtAlive(a)||!rtAlive(b)){const w=a.blesse&&rtAlive(b)?b:b.blesse&&rtAlive(a)?a:null;rtDuelEnd(R,w,w?null:'un commandant se retire');return;}
  if(R.t-D.t0>RT_DUEL.TMAX){rtDuelEnd(R,null,'aucun vainqueur au bout de '+RT_DUEL.TMAX+' s');return;}
  if(rtD(a,b)>RT_DUEL.LOIN)rtDuelEnd(R,null,'les adversaires se sont séparés');}
/* pendant le duel : les deux commandants ne visent que l'autre ; les autres groupes laissent les duellistes */
{const t0=rtThink;rtThink=function(R,g){
  if(g.hero&&g.duel&&rtAlive(g)&&rtAlive(g.duel)){g.fight=null;g.wantFace=null;if(g.stun>R.t){rtHalt(g);return;}const e=g.duel;
    if(rtInContact(R,g,e)){rtHalt(g);g.fight=e;g.wantFace=Math.atan2(e.cy-g.cy,e.cx-g.cx);}else rtGoTo(R,g,e.cx,e.cy);return;}
  t0(R,g);
  /* un groupe qui visait un duelliste se tourne vers un autre ennemi au contact, sinon vers le plus proche à 4 u ; s'il n'y en a pas, il continue (jamais de groupe planté) */
  if(g.fight&&g.fight.duel&&g.fight.duel!==g&&!g.hero){const alt=rtContacts(R,g).find(e=>!e.duel);
    if(alt){g.fight=alt;g.wantFace=Math.atan2(alt.cy-g.cy,alt.cx-g.cx);}
    else{const n=rtEnemies(R,g).filter(e=>!e.duel&&rtD(g,e)<=g.rad+e.rad+4).sort((x,y)=>rtD(g,x)-rtD(g,y))[0];if(n&&!rtUnit(g).rng){g.fight=null;rtGoTo(R,g,n.cx,n.cy);g.goal=null;}}}};}
{const s0=rtStep;rtStep=function(R){s0(R);if(!R.end){rtDuelTick(R);rtDuelScan(R);}else if(R.duel)rtDuelEnd(R,null,'fin de la bataille');};RT.step=rtStep;}
{const h0=rtHurt;rtHurt=function(R,e,P,src,ty,cote,delay){if(e&&src&&e.duel&&e.duel===src){P*=RT_DUEL.X*(.45+1.1*R.rnd());if(src.sd===0)P/=RT.K.assaut*(R.spec&&!R.spec.demo?STANCE[R.spec.stance|0].a:1);}return h0(R,e,P,src,ty,cote,delay);};}
/* l'IA ne donne pas d'ordre à un duelliste ; seul un ordre du joueur à son commandant rompt le duel */
{const a0=rtAI;rtAI=function(R,sd){RT._ai=true;try{return a0(R,sd);}finally{RT._ai=false;}};}
{const g0=rtGive;rtGive=function(R,g,o,queue){if(g&&g.duel&&R.duel&&o&&o.k!=='formation'){if(RT._ai)return false;rtDuelEnd(R,null,g.hero+' rompt le duel');}return g0(R,g,o,queue);};RT.give=rtGive;}
RT.duelStart=(a,b)=>{const R=RT.run;if(R)rtDuelStart(R,R.G[a],R.G[b]);};
function rtDuelCine(R,ph,w,why){const ui=document.getElementById('rt-ui');if(!ui)return;let c=document.getElementById('rt-dcut');
  if(!c){c=document.createElement('div');c.id='rt-dcut';ui.appendChild(c);}
  if(ph==='start'){const D=R.duel;if(!D)return;const {a,b}=D;if(RT.cine)R.cin={w:performance.now(),x:(a.cx+b.cx)/2,y:(a.cy+b.cy)/2};
    const pa=rtPor(a.asset,'preparation|cri',1,160),pb=rtPor(b.asset,'preparation|cri',1,160),Fa=RT_FAC[rtFacOf(R,a.sd)]||RT_FAC.marine,Fb=RT_FAC[rtFacOf(R,b.sd)]||RT_FAC.pirate;
    c.innerHTML='<div class="dl" style="--f:'+Fa.c+'">'+(pa?'<img src="'+pa+'" alt="">':'')+'<b>'+esc(a.hero)+'</b></div><div class="vs"><small>combat singulier</small>DUEL !</div><div class="dr" style="--f:'+Fb.c+'">'+(pb?'<img src="'+pb+'" alt="">':'')+'<b>'+esc(b.hero)+'</b></div>';}
  else{c.innerHTML='<div class="fin'+(w?'':' nul')+'">'+(w?esc(w.hero)+' remporte le duel !':'Duel interrompu')+'<small>'+(w?'ses troupes proches +'+RT_DUEL.BONUS+' de moral':esc(why||''))+'</small></div>';}
  c.className='';void c.offsetWidth;c.className='on '+ph;}
/* bandeau du duel : les deux vies face à face, sous le médaillon */
function rtDuelHTML(R){const D=R.duel;if(!D)return '';const {a,b}=D,pa=Math.round(100*Math.max(0,a.hp)/a.hp0),pb=Math.round(100*Math.max(0,b.hp)/b.hp0);
  return '<b class="na">'+esc(a.hero)+'</b><i class="ba"><u style="width:'+pa+'%"></u></i><em>DUEL · '+Math.max(0,Math.ceil(RT_DUEL.TMAX-(R.t-D.t0)))+' s</em><i class="bb"><u style="width:'+pb+'%"></u></i><b class="nb">'+esc(b.hero)+'</b>';}
{const u0=rtUI;rtUI=function(R){u0(R);if(!R)return;const ui=document.getElementById('rt-ui');if(!ui)return;let el=document.getElementById('rt-duel');
  if(!el){el=document.createElement('div');el.id='rt-duel';ui.appendChild(el);}const h=rtDuelHTML(R);if(el._h!==h){el._h=h;el.innerHTML=h;}el.style.display=h?'':'none';
  /* commandes : rappel du duel dans l'aide */
  };}

/* ------------------------------------------------- 2. lumière des impacts et sons ------------------------------------------------- */
const RT_LUM={impact:[255,214,150,.9,.32],eclair:[255,226,140,.8,.5],poing:[255,240,220,1.2,.5],feu:[255,140,40,1.5,.36],jet:[255,150,50,2.2,.35],magma:[255,90,30,1.4,.4],
  foudre:[200,220,255,3.2,.8],onde:[255,210,90,0,.28],poussiere:[255,170,80,2.4,.55],nuage:[170,190,255,3,.25]};
RT.lum=true;
function rtLight(){const R=RT.run,ui=document.getElementById('rt-ui');let cv=document.getElementById('rt-light');
  if(!R||!ui||!R.cam){if(cv&&cv.width)cv.width=0;return;}
  if(!cv){cv=document.createElement('canvas');cv.id='rt-light';ui.insertBefore(cv,ui.firstChild);}
  const rc=cv.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1),W=Math.round(rc.width*dpr),H=Math.round(rc.height*dpr);if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}
  const x=cv.getContext('2d');x.clearRect(0,0,W,H);if(!RT.lum)return;const s=W/canvas.width,rT=R.rT;x.globalCompositeOperation='lighter';
  const glow=(p,rw,col,a)=>{const q=w3Proj(p[0],p[1],p[2],R.cam);if(!q)return;const r=Math.max(6,rw*q.k*s),cx=q.sx*s,cy=q.sy*s;if(cx<-r||cy<-r||cx>W+r||cy>H+r)return;
    const g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,'rgba('+col[0]+','+col[1]+','+col[2]+','+a.toFixed(3)+')');g.addColorStop(.35,'rgba('+col[0]+','+col[1]+','+col[2]+','+(a*.45).toFixed(3)+')');g.addColorStop(1,'rgba('+col[0]+','+col[1]+','+col[2]+',0)');
    x.fillStyle=g;x.beginPath();x.ellipse(cx,cy,r,r*.62,0,0,6.283);x.fill();};
  for(const f of R.fx){const L=RT_LUM[f.k];if(!L||rT<f.t0||rT>f.t1)continue;const u=(rT-f.t0)/Math.max(.01,f.t1-f.t0),e=u<.15?u/.15:1-(u-.15)/.85,a=L[4]*Math.max(0,e);
    if(f.k==='jet'){for(let k=0;k<=4;k++){const v=Math.min(1,u*1.6)*k/4;glow([f.a[0]+(f.b[0]-f.a[0])*v,f.a[1]+(f.b[1]-f.a[1])*v,f.a[2]],L[3],L,a*.6);}continue;}
    if(f.k==='onde'){glow(f.p,(f.r||4)*Math.min(1,u*1.4),L,a);continue;}
    glow(f.p||f.b||f.a,L[3],L,a);}
  /* anneau du duel au sol */
  const D=R.duel;if(D&&rtAlive(D.a)&&rtAlive(D.b)){const mx=(D.a.cx+D.b.cx)/2,my=(D.a.cy+D.b.cy)/2,q=w3Proj(mx,my,R.M.z(mx,my)+.05,R.cam);
    if(q){const r=Math.max(30,(rtD(D.a,D.b)/2+1.1)*q.k*s),ph=(performance.now()/600)%1;x.globalCompositeOperation='source-over';x.strokeStyle='rgba(245,197,24,.85)';x.lineWidth=3*dpr;x.setLineDash([10*dpr,8*dpr]);x.lineDashOffset=-ph*36*dpr;
      x.beginPath();x.ellipse(q.sx*s,q.sy*s,r,r*.45,0,0,6.283);x.stroke();x.setLineDash([]);x.globalCompositeOperation='lighter';glow([mx,my,R.M.z(mx,my)+.1],rtD(D.a,D.b)/2+1.2,[255,200,80],.18);}}
  x.globalCompositeOperation='source-over';}
/* sons : synthétisés (module de son d'origine), au moment où l'effet devient visible */
const RT_SND={vu:new WeakSet(),last:{}};
function rtSnd(k,vol){if(typeof SND==='undefined'||!SND.ctx||!SND.on||SND.dead||SND.ctx.state!=='running'||SND.sv<=.001)return;const now=performance.now(),gap={coup:70,tir:60}[k]||120;
  if(RT_SND.last[k]&&now-RT_SND.last[k]<gap)return;RT_SND.last[k]=now;const t=SND.ctx.currentTime+.01,d=SND.fx,v=vol||1,j=.9+Math.random()*.2;
  if(k==='coup'){sNoise(d,t,.07,.16*v,1800*j,1.2,'bandpass');sTone(d,180*j,t,.08,'triangle',.08*v,.003,90);}
  else if(k==='tir'){sNoise(d,t,.09,.2*v,2600*j,.8,'highpass');sTone(d,320,t,.05,'square',.04*v,.002,120);}
  else if(k==='boom'){sNoise(d,t,.6,.32*v,500,.7,'lowpass',90);sTone(d,72,t,.5,'sine',.34*v,.005,34);}
  else if(k==='feu'){sNoise(d,t,.9,.2*v,700,.9,'bandpass',2600);}
  else if(k==='foudre'){sNoise(d,t,.35,.32*v,5200,.6,'highpass',900);sTone(d,58,t+.05,.7,'sine',.28*v,.01,30);}
  else if(k==='onde'){sTone(d,90,t,1.1,'sine',.3*v,.04,40);sNoise(d,t,.8,.08*v,300,.7,'lowpass',60);}
  else if(k==='duel'){sTone(d,110,t,1.6,'triangle',.22*v,.005,0,true);sTone(d,220,t,1.3,'sine',.12*v,.005,0,true);sTone(d,331,t+.02,1.1,'sine',.06*v,.005,0,true);}
  else if(k==='cri'){[60,64,67].forEach((n,i)=>sTone(d,mfreq(n),t+i*.08,.5,'sawtooth',.05*v,.02));}}
const RT_SNDK={impact:'coup',eclair:'tir',poussiere:'boom',jet:'feu',foudre:'foudre',onde:'onde',poing:'boom'};
function rtSndScan(){const R=RT.run;if(!R||R.paused)return;for(const f of R.fx){const k=RT_SNDK[f.k];if(!k||RT_SND.vu.has(f)||R.rT<f.t0)continue;RT_SND.vu.add(f);
  if(R.rT-f.t0<.25)rtSnd(k,k==='coup'?.7+Math.random()*.4:1);}
  if(R.end&&!R.endSnd){R.endSnd=true;try{sndFx(R.end.w===R.side?'win':'lose');}catch(_){}}}
(function rtLumLoop(){try{rtLight();rtSndScan();}catch(e){console.warn('lumière / sons :',e);RT.lum=false;}requestAnimationFrame(rtLumLoop);})();

/* --------------------------------------------------- 4. démo : choix de l'île --------------------------------------------------- */
RT.demoIsle='Alabasta';try{const v=localStorage.getItem('rk-rt-ile');if(v)RT.demoIsle=v;}catch(_){}
{const d0=rtDemoSpec;rtDemoSpec=function(){const s=d0();if(!s||!RT.demoIsle||RT.demoIsle==='Alabasta')return s;const t=terrs.find(q=>q.name===RT.demoIsle);if(!t||!rtIsle(t))return s;
  const f=terrs[(t.nb||[]).find(n=>terrs[n].boss===undefined)]||terrs[(t.nb||[])[0]];if(!f)return s;s.t=t;s.f=f;return s;};}
{const st0=rtStart;rtStart=function(opt){opt=opt||{};if(!opt.spec&&RT.demoIsle&&RT.demoIsle!=='Alabasta'){const sp=rtDemoSpec();if(sp)opt=Object.assign({},opt,{spec:sp});}return st0(opt);};RT.start=rtStart;}
function rtIsleSel(){let s=document.getElementById('rt-isle');const go=document.getElementById('rt-go');if(!go||!terrs.length)return;
  const L=terrs.filter(t=>rtIsle(t)).map(t=>t.name).sort((a,b)=>a.localeCompare(b,'fr'));if(!L.length)return;
  if(!s){s=document.createElement('select');s.id='rt-isle';s.title='Île de la bataille de démonstration';s.addEventListener('change',()=>{RT.demoIsle=s.value;try{localStorage.setItem('rk-rt-ile',s.value);}catch(_){}});
    s.addEventListener('pointerdown',e=>e.stopPropagation());}
  const h=L.map(n=>'<option'+(n===RT.demoIsle?' selected':'')+'>'+esc(n)+'</option>').join('');if(s._h!==h){s._h=h;s.innerHTML=h;}
  if(s.parentNode!==go.parentNode||s.nextSibling!==go)go.parentNode.insertBefore(s,go);}
setInterval(()=>{try{rtIsleSel();}catch(_){}},1000);

/* --------------------------------------------------- 3. primes et Buster Call visibles --------------------------------------------------- */
const OP_PR={pal:{},warned:false,at:0,news:[],showing:false};
/* riposte de la Marine dans la Course : même règle que le Buster Call d'origine (camp en tête de 30 % et d'au moins 9 000 000 ฿, avis 15 s
   avant, puis frappe sur son île la plus forte hors capitale, toutes les 110 s × rythme), la Marine n'étant jamais visée, et une frappe
   qui grandit avec la prime : Vice-amiral (−15 %), Amiral (−25 %, dès 15 000 000 ฿), Buster Call (−35 %, dès 30 000 000 ฿). */
const OPJ={riposte:true};try{if(localStorage.getItem('rk-riposte')==='0')OPJ.riposte=false;}catch(_){}
const OPJ_RIP=[{s:3000,n:'Buster Call',k:.65},{s:1500,n:'Amiral',k:.75},{s:0,n:'Vice-amiral',k:.85}];
const opRip=s=>OPJ_RIP.find(r=>s>=r.s);
const opCourse=()=>typeof CS!=='undefined'&&CS.on;
/* camps que la riposte peut viser (la Marine jamais), triés par prime */
const opCibles=()=>players.filter(p=>p.alive&&CREWS[p.crew||0].id!=='marine').map(p=>({p,s:primeOf(p.id)})).sort((a,b)=>b.s-a.s);
{const m0=marineTick;marineTick=function(){if(!opCourse()||!OPJ.riposte)return m0();
  if(over||time<marineAt-15)return;
  const arr=opCibles();
  const clear=arr.length>=2&&arr[0].s>=1.3*arr[1].s&&arr[0].s>=900;
  if(time<marineAt){if(!marineWarned&&clear){marineWarned=true;marineTarget=arr[0].p.id;const R=opRip(arr[0].s);addLog('Le Journal publie l\'avis de recherche de '+arr[0].p.name+' : prime '+fmtPrime(arr[0].s)+'. La Marine envoie un '+R.n+'.','#9ec5ff');}return;}
  if(marineWarned&&players[marineTarget]&&players[marineTarget].alive){const R=opRip(primeOf(marineTarget)),mine=terrs.filter(t=>t.owner===marineTarget&&!t.capital).sort((a,b)=>tr(b)-tr(a)),tg=mine[0]||terrs.find(t=>t.owner===marineTarget);
    if(tg){tg.u=scaleU(tg.u,R.k);OP_PR.last={n:R.n,isle:tg.name,who:players[marineTarget].name,pct:Math.round((1-R.k)*100)};addLog(R.n+' de la Marine sur '+tg.name+' ('+players[marineTarget].name+') : −'+Math.round((1-R.k)*100)+' % de troupes.','#9ec5ff');}}
  marineAt=time+110*PK;marineWarned=false;};}
function opRiposteSet(on){OPJ.riposte=!!on;try{localStorage.setItem('rk-riposte',on?'1':'0');}catch(_){}}
const opPal=v=>Math.floor(v/250);   /* palier : tous les 2 500 000 ฿ */
function opPrimeHTML(){if(typeof primeOf!=='function'||!players||!players.length)return '';
  const arr=players.filter(p=>p.alive).map(p=>({p,s:primeOf(p.id)})).sort((a,b)=>b.s-a.s),top=arr[0]?arr[0].s:1;
  const actif=!opCourse()||OPJ.riposte,cand=opCourse()?opCibles():arr;
  const lead=cand.length>=2&&cand[0].s>=1.3*cand[1].s&&cand[0].s>=900,dt=Math.max(0,Math.ceil(marineAt-time));
  let st;
  if(!actif)st='<div class="op-bc">Riposte de la Marine coupée<small>règles d\'origine de la Course : pas de Buster Call (option sur l\'écran d\'accueil)</small></div>';
  else if(marineWarned&&players[marineTarget]){const R=opCourse()?opRip(primeOf(marineTarget)):{n:'Buster Call',k:CREWS[players[marineTarget].crew||0].bust||.7};
    st='<div class="op-bc on">⚓ '+R.n.toUpperCase()+' contre <b>'+esc(players[marineTarget].name)+'</b> dans ~'+dt+' s<small>−'+Math.round((1-R.k)*100)+' % de troupes sur son île la plus forte (la capitale seulement s\'il n\'a qu\'elle)</small></div>';}
  else st='<div class="op-bc">Prochaine décision de la Marine dans ~'+Math.max(0,dt-15)+' s<small>'+(lead?'<b>'+esc(cand[0].p.name)+'</b> domine : il sera visé'+(opCourse()?' ('+opRip(cand[0].s).n+')':''):'personne ne domine assez pour être visé')+' · règle : 30 % de prime de plus que le 2e et au moins '+fmtPrime(900)+(opCourse()?' · Vice-amiral, Amiral dès '+fmtPrime(1500)+', Buster Call dès '+fmtPrime(3000):'')+'</small></div>';
  return '<div class="cs-h">Avis de recherche</div><div class="op-wl">'+arr.map((o,i)=>{const me=o.p.id===ME,tg=marineWarned&&o.p.id===marineTarget;
    return '<div class="op-w'+(me?' me':'')+(tg?' tg':'')+'" style="--c:'+o.p.color+'"><span class="op-wn">'+(i+1)+'. '+esc(o.p.name)+(me?' <em>vous</em>':'')+'</span><span class="op-wb"><i style="width:'+Math.round(100*o.s/Math.max(1,top))+'%"></i></span><b>'+fmtPrime(o.s)+'</b></div>';}).join('')+'</div>'+st;}
if(typeof CS!=='undefined'&&CS.hud){const h0=CS.hud;CS.hud=function(force){const r=h0.apply(this,arguments);try{const h=document.getElementById('cs-hud');if(h&&!h.hidden){const b=h.querySelector('.cs-body');if(b){let s=b.querySelector('.op-pr');if(!s){s=document.createElement('div');s.className='op-pr';b.appendChild(s);}
  const x=opPrimeHTML();if(s._h!==x){s._h=x;s.innerHTML=x;}}}}catch(e){console.warn('primes :',e);}return r;};}
function opNews(txt,kind){OP_PR.news.push({txt,kind});opNewsNext();}
function opNewsNext(){if(OP_PR.showing||!OP_PR.news.length||document.body.classList.contains('rtrun'))return;const n=OP_PR.news.shift();let el=document.getElementById('op-news');
  if(!el){el=document.createElement('div');el.id='op-news';document.body.appendChild(el);}
  el.className='';el.innerHTML='<small>'+(n.kind==='bc'?'⚓ Quartier général de la Marine':'📰 Le Journal de l\'économie mondiale')+'</small>'+n.txt;void el.offsetWidth;el.className='on '+(n.kind||'');OP_PR.showing=true;
  setTimeout(()=>{el.className=(n.kind||'');OP_PR.showing=false;setTimeout(opNewsNext,400);},n.kind==='bc'?5200:4000);}
function opBuster(name,isle,titre,pct){let el=document.getElementById('op-bc');if(!el){el=document.createElement('div');el.id='op-bc';document.body.appendChild(el);}
  el.innerHTML='<b>'+esc((titre||'Buster Call').toUpperCase())+'</b><small>'+esc(isle?isle+' ('+name+')':name)+(pct?' · −'+pct+' % de troupes':'')+'</small>';el.className='';void el.offsetWidth;el.className='on';
  const m=document.getElementById('mapwrap');if(m){m.classList.remove('op-shake');void m.offsetWidth;m.classList.add('op-shake');}}
/* lecture de l'état chaque demi-seconde : paliers de prime, avis du Buster Call, Buster Call exécuté */
setInterval(()=>{try{if(typeof started==='undefined'||!started||!players||!players.length||typeof primeOf!=='function'){OP_PR.pal={};OP_PR.init=false;return;}
  if(!OP_PR.init){OP_PR.init=true;for(const p of players)OP_PR.pal[p.id]=opPal(primeOf(p.id));OP_PR.warned=marineWarned;OP_PR.at=marineAt;OP_PR.tgt=marineTarget;return;}
  for(const p of players){if(!p.alive)continue;const v=primeOf(p.id),k=opPal(v);if(k>(OP_PR.pal[p.id]|0)&&v>=500){if(p.id===ME||k>=4)opNews('La prime de <b style="color:'+p.color+'">'+esc(p.name)+'</b> passe à <b>'+fmtPrime(v)+'</b>','');}OP_PR.pal[p.id]=Math.max(OP_PR.pal[p.id]|0,k);}
  if(marineWarned&&!OP_PR.warned&&players[marineTarget]){const p=players[marineTarget];opNews('Avis de recherche : <b style="color:'+p.color+'">'+esc(p.name)+'</b>, '+fmtPrime(primeOf(p.id))+'. '+(opCourse()?'La Marine envoie un '+opRip(primeOf(p.id)).n:'Un Buster Call se prépare')+(p.id===ME?' contre <b>vous</b>':'')+' !','bc');OP_PR.tgt=marineTarget;}
  if(OP_PR.warned&&!marineWarned){const L=OP_PR.last;if(L){opBuster(L.who,L.isle,L.n,L.pct);OP_PR.last=null;}else{const p=players[OP_PR.tgt];if(p&&p.alive){const mine=terrs.filter(t=>t.owner===p.id&&!t.capital).sort((a,b)=>tr(b)-tr(a)),tg=mine[0]||terrs.find(t=>t.owner===p.id);opBuster(p.name,tg?tg.name:'');}}}
  {const sct=document.querySelector('#cs-hud .op-pr');if(sct){const x=opPrimeHTML();if(sct._h!==x){sct._h=x;sct.innerHTML=x;}}}
  OP_PR.warned=marineWarned;OP_PR.at=marineAt;}catch(e){console.warn('primes :',e);}},500);

function opRipUI(){const o=document.getElementById('overlay');if(!o||o.hidden)return;if(document.getElementById('o-riposte'))return;const row=o.querySelector('.row');if(!row)return;
  const l=document.createElement('label');l.className='op-rip';l.innerHTML='<input type="checkbox" id="o-riposte"'+(OPJ.riposte?' checked':'')+'> Riposte de la Marine (essai) <small>la prime attire Vice-amiral, Amiral puis Buster Call ; décoché = Course d\'origine</small>';
  row.parentNode.insertBefore(l,row.nextSibling);l.querySelector('input').addEventListener('change',e=>opRiposteSet(e.target.checked));}
setInterval(()=>{try{opRipUI();}catch(_){}},700);
/* --------------------------------------------------- styles --------------------------------------------------- */
{const st=document.createElement('style');st.id='op-jeu-css';st.textContent=[
  '#rt-light{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;mix-blend-mode:screen}',
  '#rt-duel{position:absolute;left:50%;top:96px;transform:translateX(-50%);display:flex;align-items:center;gap:8px;padding:5px 12px;background:#0e0e10ee;border:2px solid #060607;border-radius:12px;box-shadow:inset 0 0 0 1px #f5c51866,0 6px 16px #0008;font:800 12px system-ui,sans-serif;color:#fdf6e3;white-space:nowrap}',
  '#rt-duel b{font:400 17px/1 var(--op-titre,Impact);letter-spacing:.8px}#rt-duel em{font-style:normal;color:var(--op-or,#f5c518);font:400 15px/1 var(--op-titre,Impact);letter-spacing:1px}',
  '#rt-duel i{display:block;width:110px;height:9px;border-radius:5px;background:#ffffff22;overflow:hidden;border:1px solid #000}#rt-duel i u{display:block;height:100%;background:linear-gradient(90deg,#ff5a4f,#ffd84d)}#rt-duel i.ba{transform:scaleX(-1)}',
  '#rt-dcut{position:absolute;inset:0;pointer-events:none;opacity:0;display:flex;align-items:center;justify-content:center;gap:2vw}',
  '#rt-dcut.on.start{animation:rtdc 2s cubic-bezier(.2,.8,.2,1) forwards}#rt-dcut.on.end{animation:rtdc 2.2s ease-out forwards}@keyframes rtdc{0%{opacity:0}8%{opacity:1}82%{opacity:1}100%{opacity:0}}',
  '#rt-dcut .dl,#rt-dcut .dr{display:flex;flex-direction:column;align-items:center;gap:4px}#rt-dcut img{height:160px;filter:drop-shadow(0 0 0 #000) drop-shadow(5px 5px 0 #2a1a0c)}#rt-dcut .dr img{transform:scaleX(-1)}',
  '#rt-dcut .dl{animation:rtdl .6s cubic-bezier(.2,.8,.2,1) both}#rt-dcut .dr{animation:rtdr .6s cubic-bezier(.2,.8,.2,1) both}@keyframes rtdl{from{transform:translateX(-40vw)}}@keyframes rtdr{from{transform:translateX(40vw)}}',
  '#rt-dcut .dl b,#rt-dcut .dr b{font:400 30px/1 var(--op-titre,Impact);letter-spacing:1.5px;color:#fff;-webkit-text-stroke:2px #2a1a0c;paint-order:stroke fill;background:var(--f);padding:4px 14px;border:2px solid #2a1a0c;border-radius:8px;transform:skewX(-8deg)}',
  '#rt-dcut .vs{text-align:center;font:400 84px/1 var(--op-titre,Impact);letter-spacing:3px;color:var(--op-or,#f5c518);-webkit-text-stroke:3px #2a1a0c;paint-order:stroke fill;text-shadow:0 6px 0 #d62828,0 8px 0 #2a1a0c;animation:rtvs .5s .2s cubic-bezier(.3,1.6,.5,1) both}@keyframes rtvs{from{transform:scale(2.4);opacity:0}}',
  '#rt-dcut .vs small{display:block;font:800 13px system-ui,sans-serif;letter-spacing:2px;color:#fdf6e3;-webkit-text-stroke:0;text-shadow:0 2px 0 #000;margin-bottom:6px;text-transform:uppercase}',
  '#rt-dcut .fin{font:400 46px/1.05 var(--op-titre,Impact);letter-spacing:2px;color:var(--op-or,#f5c518);-webkit-text-stroke:2.5px #2a1a0c;paint-order:stroke fill;text-shadow:0 5px 0 #2a1a0c;text-align:center;transform:translateY(-18vh)}',
  '#rt-dcut .fin.nul{color:#fdf6e3}#rt-dcut .fin small{display:block;font:800 13px system-ui,sans-serif;letter-spacing:.5px;color:#fdf6e3;-webkit-text-stroke:0;text-shadow:0 2px 0 #000;margin-top:6px}',
  '#rt-isle{font:700 12px system-ui,sans-serif;padding:5px 8px;border-radius:9px;border:2px solid #2a1a0c;background:#f8ecd0;color:#2a1a0c;max-width:200px}',
  'body:not(.op-ui) #rt-isle{position:fixed;right:220px;bottom:140px;z-index:9999}',
  '#cs-hud .op-pr{margin-top:7px;padding-top:6px;border-top:1px solid rgba(255,255,255,.12)}',
  '#cs-hud .op-w{display:grid;grid-template-columns:minmax(0,1fr) 54px auto;gap:6px;align-items:center;margin:2px 0;padding:2px 4px;border-left:3px solid var(--c);border-radius:0}',
  '#cs-hud .op-w.me .op-wn{font-weight:800}#cs-hud .op-w em{font-style:normal;color:var(--op-or,#f5c518);font-size:10px;text-transform:uppercase}',
  '#cs-hud .op-w.tg{background:#d6282833;animation:opbl 1.2s ease-in-out infinite}@keyframes opbl{50%{background:#d6282866}}',
  '#cs-hud .op-wn{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#cs-hud .op-wb{height:6px;background:rgba(255,255,255,.12);border-radius:3px;overflow:hidden}#cs-hud .op-wb i{display:block;height:100%;background:var(--c)}',
  '#cs-hud .op-w b{font:400 14px/1 var(--op-titre,var(--f-display,Impact));letter-spacing:.5px;color:#ffe7a3;white-space:nowrap}',
  '#cs-hud .op-bc{margin-top:6px;padding:5px 7px;border-radius:8px;background:rgba(255,255,255,.06);font-size:11.5px;line-height:1.35}#cs-hud .op-bc small{display:block;color:#b9b4a8;font-size:10.5px;margin-top:2px}',
  '#cs-hud .op-bc.on{background:#7a1010;border:1.5px solid #ff7a6b;font-weight:800;color:#fff;animation:opbl2 1s ease-in-out infinite}#cs-hud .op-bc.on small{color:#ffd1cc}@keyframes opbl2{50%{box-shadow:0 0 0 3px #ff7a6b55}}',
  '#op-news{position:fixed;left:50%;top:18vh;transform:translate(-50%,-30px);z-index:70;min-width:340px;max-width:min(560px,90vw);padding:10px 16px 12px;border-radius:12px;opacity:0;pointer-events:none;transition:opacity .35s,transform .35s cubic-bezier(.2,.8,.2,1);',
  'background:linear-gradient(180deg,#fff6df,#ead197);color:#2a1a0c;border:2px solid #2a1a0c;box-shadow:inset 0 -3px 0 rgba(160,110,30,.25),0 10px 26px rgba(0,0,0,.55);font:600 15px/1.35 system-ui,sans-serif;text-align:center}',
  '#op-news small{display:block;font:400 15px/1 "OPBangers",Impact,sans-serif;letter-spacing:1px;color:#8e5b00;margin-bottom:5px}#op-news.on{opacity:1;transform:translate(-50%,0)}',
  '#op-news.bc{background:linear-gradient(180deg,#fff6df,#f3c9b8);border-color:#7a1010;box-shadow:0 0 0 3px #d62828,0 10px 26px rgba(0,0,0,.55)}#op-news.bc small{color:#a01515}',
  '#op-bc{position:fixed;inset:0;z-index:80;pointer-events:none;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0;background:radial-gradient(ellipse at center,#d6282855,#7a101099 70%)}',
  '#op-bc.on{animation:opbc 3.2s ease-out forwards}@keyframes opbc{0%{opacity:0}6%{opacity:1}75%{opacity:1}100%{opacity:0}}',
  '#op-bc b{font:400 clamp(60px,11vw,150px)/1 "OPBangers",Impact,sans-serif;letter-spacing:4px;color:#fff;-webkit-text-stroke:4px #2a1a0c;paint-order:stroke fill;text-shadow:0 8px 0 #a01515,0 11px 0 #2a1a0c;animation:rtvs .5s cubic-bezier(.3,1.6,.5,1) both}',
  '#op-bc small{font:800 20px system-ui,sans-serif;color:#fff;text-shadow:0 2px 0 #000;margin-top:8px}',
  '#mapwrap.op-shake{animation:opsh .7s ease-out}@keyframes opsh{0%,100%{transform:none}15%{transform:translate(-9px,5px)}30%{transform:translate(8px,-6px)}45%{transform:translate(-6px,-3px)}60%{transform:translate(5px,4px)}80%{transform:translate(-2px,1px)}}',
  '#overlay .op-rip{display:flex;align-items:baseline;flex-wrap:wrap;gap:6px;margin:8px 0;font-weight:700;cursor:pointer}#overlay .op-rip small{flex-basis:100%;font-weight:400;opacity:.75;font-size:12px}',
  'body.rtrun #op-news,body.rtrun #op-bc{display:none}'
].join('\n');document.head.appendChild(st);}
window.__OPJ={news:opNews,buster:opBuster,prime:opPrimeHTML,riposte:opRiposteSet};
/* essais seulement : déclenche la règle d'origine du Buster Call (avis, puis frappe) sans attendre son minuteur */
window.__OPJ.test={cibles:()=>opCibles().map(o=>CREWS[o.p.crew||0].id),avis:()=>{marineWarned=true;marineTarget=ME;},frappe:()=>{marineAt=time;marineTick();},etat:()=>({marineWarned,marineAt:Math.round(marineAt),time:Math.round(time),target:marineTarget})};
