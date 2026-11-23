/* ================= VILLE DE CHAQUE ÎLE (version test, branche essai/aaa-proto) =================
   Demande du 23/11 (« applique mais sur la ville de chaque ») après la maquette « Ville portuaire » : Économie, Équipage, Diplomatie et
   Monde se gèrent en cliquant des lieux dans la ville. Chaque île montre SA ville : le vrai modèle 3D de l'île (modèle Blender, ou modèle
   du monde 3D), filmé de près en vue plongeante par le moteur du jeu, avec une lente rotation de caméra.
   Six lieux sont posés sur de vrais bâtiments de l'île :
     Banque → Économie (Berrys) · Chantier naval → Villes · Bibliothèque → Techno · Taverne → Équipage · Capitainerie → Diplomatie · Phare → Monde.
   Choix des bâtiments [I] : amas de bâtiments tirés des cartes « sol » et « obstacles » (île Blender) ou des emprises du modèle (île du
   monde 3D) ; banque au cœur de la ville (repère du drapeau), chantier et capitainerie près du ponton, bibliothèque sur le plus haut,
   phare le plus au large, taverne près de la banque. Sans bâtiment trouvé : lieux posés en cercle autour du centre.
   Un clic sur un lieu ouvre la partie du Livre de bord par-dessus la ville ; la fermer ramène à la ville ; Échap ou « Carte » ramène à la
   carte. Les boutons Économie, Équipage, Diplomatie, Monde du bandeau ouvrent la ville puis la partie. Ville affichée : l'île choisie si
   elle est à vous, sinon votre capitale ; ◀ ▶ passent d'une de vos îles à l'autre.
   Règles, panneaux et boutons du jeu inchangés : rien n'est retiré. Réglage : localStorage « rk-ville » = 0 (Livre de bord seul). */
const VIL={on:false,t:null,A:null,cache:new Map(),yaw:0,dyaw:0,zoom:1,t0:0,drag:null,raf:0,ok:true,info:0};
try{if(localStorage.getItem('rk-ville')==='0')VIL.ok=false;}catch(_){}
const VIL_B=[
  {id:'banque',n:'Banque',ic:'฿',go:'eco',leaf:true,g:'Économie'},
  {id:'chantier',n:'Chantier naval',ic:'⚒',go:'city',leaf:true,g:'Villes'},
  {id:'bibli',n:'Bibliothèque',ic:'◈',go:'tech',leaf:true,g:'Techno'},
  {id:'taverne',n:'Taverne',ic:'♛',go:'leg',g:'Équipage'},
  {id:'capitainerie',n:'Capitainerie',ic:'⚖',go:'dip',g:'Diplomatie'},
  {id:'phare',n:'Phare',ic:'◎',go:'rel',g:'Monde'}];
const vilAvail=()=>VIL.ok&&typeof W3!=='undefined'&&!W3.fail&&MODE!=='client'&&started&&!over;
const vilCap=()=>terrs.find(t=>t.capital&&t.owner===ME)||terrs.find(t=>t.owner===ME)||null;
const vilMine=()=>{const L=terrs.filter(t=>t.owner===ME);return L.sort((a,b)=>(b.capital?1:0)-(a.capital?1:0)||((b.city?b.city.lvl:0)-(a.city?a.city.lvl:0))||a.name.localeCompare(b.name,'fr'));};
const vilTxt=id=>{const e=document.getElementById(id);return e?e.textContent.trim():'';};

/* ---------- bâtiments de l'île : amas (coordonnées locales, centre de l'île) ---------- */
function vilClusters(t){
  const m=W3.models.get(t.id),I=m&&m.bx&&typeof BLX!=='undefined'?BLX.isl[m.bx]:null,out=[];
  if(I&&I.Hs&&I.Ho){
    const ext=Math.min(I.m&&I.m.cadre?I.m.cadre.ext:60,(t.rad||30)*1.3),st=.7,n=Math.ceil(2*ext/st),g=new Uint8Array(n*n),top=new Float32Array(n*n);
    for(let j=0;j<n;j++)for(let i=0;i<n;i++){const x=-ext+(i+.5)*st,y=-ext+(j+.5)*st,hs=I.Hs(x,y),ho=I.Ho(x,y);if(hs>.15&&ho-hs>.7){g[j*n+i]=1;top[j*n+i]=ho;}}
    const seen=new Uint8Array(n*n);
    for(let k=0;k<n*n;k++){if(!g[k]||seen[k])continue;const s2=[k];seen[k]=1;let sx=0,sy=0,c=0,zt=0;
      while(s2.length){const q=s2.pop(),i=q%n,j=(q/n)|0;sx+=i;sy+=j;c++;zt=Math.max(zt,top[q]);
        for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const a=i+di,b=j+dj;if(a<0||b<0||a>=n||b>=n)continue;const r=b*n+a;if(g[r]&&!seen[r]){seen[r]=1;s2.push(r);}}}
      if(c>=2)out.push({x:-ext+(sx/c+.5)*st,y:-ext+(sy/c+.5)*st,z:zt,n:c});}
    return {L:out,hz:(x,y)=>Math.max(0,I.Hs(x,y)),port:I.m&&Array.isArray(I.m.ponton)?{x:I.m.ponton[0],y:I.m.ponton[1]}:null,
      ctr:I.m&&Array.isArray(I.m.drapeaux)&&I.m.drapeaux[0]?{x:I.m.drapeaux[0][0],y:I.m.drapeaux[0][1]}:null};}
  const hz=m&&typeof m.Hg==='function'?(x,y)=>Math.max(0,m.Hg(x,y)):()=>0;
  if(m&&m.tops)for(const b of m.tops){const cx=(b[0]+b[2])/2,cy=(b[1]+b[3])/2,ar=Math.abs((b[2]-b[0])*(b[3]-b[1])),h=b[4]-hz(cx,cy);
    if(h>.9&&ar>1.2&&ar<80){const o=out.find(q=>Math.hypot(q.x-cx,q.y-cy)<1.8);if(o){o.n+=ar;o.z=Math.max(o.z,b[4]);}else out.push({x:cx,y:cy,z:b[4],n:ar});}}
  return {L:out,hz,port:null,ctr:null};}
/* six lieux, écartés les uns des autres */
function vilAnchors(t){
  const I=typeof BLX!=='undefined'&&BLX.isl?BLX.isl[t.name]:null,key=((W3.models.get(t.id)||{}).key||'')+'|'+(I&&I.Hs?1:0),h=VIL.cache.get(t.id);
  if(h&&h.key===key)return h.A;
  const r=Math.max(8,t.rad||20),Q=vilClusters(t),L=Q.L.sort((a,b)=>b.n-a.n).slice(0,60),sep=Math.max(2.4,r*.17),used=[],A={};
  const big=L.slice(0,6),mid=big.length?{x:big.reduce((s,c)=>s+c.x,0)/big.length,y:big.reduce((s,c)=>s+c.y,0)/big.length}:{x:0,y:0};
  const ctr=Q.ctr||mid,d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  /* la ville, pas toute l'île : lieux à moins de 0,6 rayon du cœur (0,8 pour le phare), s'il y a assez de bâtiments */
  const near=f=>{const N=L.filter(c=>d(c,ctr)<r*f);return N.length>=8?N:L;};
  const pick=(id,sc)=>{let best=null,bs=-1e9;for(const c of near(id==='phare'?.8:.6)){if(used.some(u=>d(u,c)<sep))continue;const s=sc(c);if(s>bs){bs=s;best=c;}}
    if(!best){const k=VIL_B.findIndex(b=>b.id===id),a=k/6*Math.PI*2+.4,x=ctr.x+Math.cos(a)*r*.32,y=ctr.y+Math.sin(a)*r*.32;best={x,y,z:Q.hz(x,y)+1.2,n:0,auto:1};}
    used.push(best);A[id]={x:best.x,y:best.y,z:best.z+.35,auto:!!best.auto};};
  pick('banque',c=>-d(c,ctr)+Math.min(8,c.n)*.15);
  pick('chantier',c=>Q.port?-d(c,Q.port):d(c,ctr)-Math.abs(c.z-Q.hz(c.x,c.y)));
  pick('capitainerie',c=>Q.port?-d(c,Q.port)*.8-d(c,A.banque)*.2:-d(c,A.chantier));
  pick('taverne',c=>-d(c,A.banque)-d(c,A.capitainerie)*.3);
  pick('bibli',c=>c.z-d(c,ctr)*.05);
  pick('phare',c=>d(c,ctr));
  VIL.cache.set(t.id,{key,A});return A;}

/* ---------- caméra : vue plongeante sur les six lieux, arrivée en douceur, lente rotation ; glisser pour tourner, molette pour zoomer ---------- */
function vilCam(){
  const t=VIL.t,A=VIL.A;let cx=t.x,cy=t.y,R=Math.max(8,(t.rad||20)*.6);
  if(A){const P=Object.values(A);cx=t.x+P.reduce((s,p)=>s+p.x,0)/P.length;cy=t.y+P.reduce((s,p)=>s+p.y,0)/P.length;R=Math.max(6,...P.map(p=>Math.hypot(t.x+p.x-cx,t.y+p.y-cy)))+3;}
  const k=(performance.now()-VIL.t0)/1000,e=1-Math.pow(1-Math.min(1,k/1.6),3);
  const yaw=VIL.yaw+VIL.dyaw+.11*Math.sin(k*.06),pitch=.95-.15*e,D=R*1.22/Math.tan(W3_FOVY/2)*VIL.zoom*(1.6-.6*e);
  const c=w3Cam(cx,cy,yaw,pitch,D);c.near=Math.max(.5,D*.03);c.far=D*14;c.fogD=D*7;return c;}
{const wc0=w3Cam;w3Cam=function(cx,cy,yaw,pitch,D0){if(cx===undefined&&VIL.on&&VIL.t&&!(typeof RT!=='undefined'&&RT.run))return vilCam();return wc0(cx,cy,yaw,pitch,D0);};}
/* la carte stratégique (noms des îles, armées, routes) ne se dessine pas par-dessus la ville */
{const o0=w3Overlay;w3Overlay=function(c,now){if(VIL.on&&!(typeof RT!=='undefined'&&RT.run))return;return o0(c,now);};}

/* ---------- interface ---------- */
function vilInfo(id,t){const r={s:'',bd:false};
  try{switch(id){
    case 'banque':r.s=vilTxt('r-gold')+' ฿ · '+vilTxt('r-gold-r');break;
    case 'chantier':r.s=t.city?'ville niveau '+t.city.lvl:'pas encore de ville';break;
    case 'bibli':r.s='◈ '+vilTxt('r-sci')+' · '+vilTxt('r-sci-r');break;
    case 'taverne':r.s='État-major '+chOwnedBy(ME).length+' / '+chSlots();r.bd=rkHireReady();break;
    case 'capitainerie':{let w=0;for(let i=0;i<players.length;i++)if(i!==ME&&players[i].alive&&isWar(ME,i))w++;r.s='Influence '+vilTxt('r-inf')+' · '+(w?w+' en guerre':'en paix');r.bd=proposals.some(x=>x.to===ME);break;}
    case 'phare':r.s=vilTxt('r-age-n')||'Âges, Haki, objectifs';r.bd=!!(agAlert()||RK.unread>0);break;}}catch(_){}
  return r;}
function vilBuild(){let el=document.getElementById('vil');if(el)return el;
  el=document.createElement('div');el.id='vil';el.hidden=true;
  el.innerHTML='<div class="vil-voile" aria-hidden="true"></div>'+VIL_B.map(b=>'<i class="vil-pt" data-pt="'+b.id+'" aria-hidden="true"></i><button type="button" class="vil-pin" data-vil="'+b.id+'" aria-label="'+b.n+' : '+b.g+'"><span class="vil-ic">'+b.ic+'</span><span class="vil-tx"><b>'+b.n+'</b><small></small></span><i class="vil-bd" hidden>!</i><span class="vil-tip"><em>'+b.n.toUpperCase()+' · '+b.g.toUpperCase()+'</em><span class="vil-l"></span><span class="vil-cta">Cliquer pour entrer ▸</span></span></button>').join('')
    +'<div class="vil-bar"><button type="button" data-vilk="prev" aria-label="Île précédente">◀</button><div class="vil-nm"><b></b><small></small></div><button type="button" data-vilk="next" aria-label="Île suivante">▶</button><button type="button" data-vilk="carte" class="vil-carte">⚑ Carte</button></div>'
    +'<p class="vil-aide">Glisser : tourner · molette : zoom · Échap : carte</p>';
  document.body.appendChild(el);
  el.addEventListener('click',e=>{const b=e.target.closest('[data-vil],[data-vilk]');if(!b)return;e.stopPropagation();
    if(b.dataset.vil){const B=VIL_B.find(q=>q.id===b.dataset.vil);ui.sel=VIL.t.id;if(typeof renderPanel==='function')renderPanel(true);if(typeof oplGo==='function')oplGo(B.go,!!B.leaf);return;}
    const k=b.dataset.vilk;if(k==='carte')vilClose();else{const L=vilMine();if(L.length<2)return;let i=L.indexOf(VIL.t);i=(i+(k==='next'?1:-1)+L.length)%L.length;vilShow(L[i]);}});
  return el;}
function vilShow(t){if(!t)return;VIL.t=t;VIL.A=null;VIL.info=0;VIL.t0=performance.now();VIL.dyaw=0;ui.sel=t.id;
  try{const m=W3.models.get(t.id);if(m&&m.bx&&typeof blxWant3==='function')blxWant3(m.bx,'lod0');}catch(_){}
  const el=vilBuild();el.querySelector('.vil-nm b').textContent=t.name.toUpperCase();
  el.querySelector('.vil-nm small').textContent=(t.capital?'Capitale · ':'')+(t.city?'ville niveau '+t.city.lvl:'sans ville')+' · '+Math.floor(tr(t))+' troupes';
  for(const b of el.querySelectorAll('[data-vilk="prev"],[data-vilk="next"]'))b.disabled=vilMine().length<2;
  for(const p of el.querySelectorAll('.vil-pin,.vil-pt'))p.style.visibility='hidden';dirty=true;}
function vilOpen(t){if(!vilAvail())return false;if(typeof RT!=='undefined'&&(RT.run||RT.ask))return false;
  t=t||(ui.sel>=0&&terrs[ui.sel]&&terrs[ui.sel].owner===ME?terrs[ui.sel]:vilCap());if(!t)return false;
  if(!W3.on&&typeof w3Toggle==='function')w3Toggle();if(W3.fail)return false;
  if(!VIL.on){VIL.yaw=(W3.cam&&W3.cam.yaw)||0;VIL.zoom=1;}
  VIL.on=true;vilShow(t);document.body.classList.add('vil');const el=vilBuild();el.hidden=false;
  try{W3.cv.style.filter='saturate(1.16) contrast(1.06) brightness(1.03)';}catch(_){}
  cancelAnimationFrame(VIL.raf);VIL.raf=requestAnimationFrame(vilLoop);dispatchEvent(new Event('resize'));return true;}
function vilClose(){if(!VIL.on)return;{const h=document.querySelector('#op-livre-h small');if(h)h.textContent='Échap : retour à la carte';}if(typeof OPL!=='undefined'&&OPL.open&&typeof oplClose==='function')oplClose();
  VIL.on=false;document.body.classList.remove('vil');const el=document.getElementById('vil');if(el)el.hidden=true;try{W3.cv.style.filter='';}catch(_){}
  cancelAnimationFrame(VIL.raf);if(VIL.t)try{centerOn(VIL.t.id);}catch(_){}dirty=true;dispatchEvent(new Event('resize'));}
/* chaque image : lieux projetés sur la vue 3D ; chiffre et pastille de chaque lieu toutes les 0,5 s */
function vilLoop(){if(!VIL.on)return;VIL.raf=requestAnimationFrame(vilLoop);dirty=true;
  const t=VIL.t,el=document.getElementById('vil');if(!t||!el)return;
  el.classList.toggle('vil-livre',typeof OPL!=='undefined'&&OPL.open);
  {const h=document.querySelector('#op-livre-h small');if(h&&h.textContent!=='Échap : retour à la ville')h.textContent='Échap : retour à la ville';}
  if(!VIL.A){const m=W3.models.get(t.id);if(!m)return;const I=m.bx&&typeof BLX!=='undefined'?BLX.isl[m.bx]:null;if(m.bx&&!(I&&I.Hs)&&performance.now()-VIL.t0<4000)return;VIL.A=vilAnchors(t);}
  const c=W3.c;if(!c)return;const rc=W3.cv.getBoundingClientRect(),k=rc.width/W3.cv.width,now=performance.now();
  if(now-VIL.info>500){VIL.info=now;for(const b of VIL_B){const i=vilInfo(b.id,t),p=el.querySelector('[data-vil="'+b.id+'"]');p.querySelector('small').textContent=i.s;p.querySelector('.vil-l').textContent=i.s;p.querySelector('.vil-bd').hidden=!i.bd;}}
  /* étiquettes : au-dessus de leur bâtiment, écartées l'une de l'autre (jamais superposées), sous le bandeau du haut ; la tige suit */
  const it=[],top0=VIL.top||130;
  for(const b of VIL_B){const a=VIL.A[b.id],p=el.querySelector('[data-vil="'+b.id+'"]'),pt=el.querySelector('[data-pt="'+b.id+'"]');
    const q=a?w3Proj(t.x+a.x,t.y+a.y,a.z,c):null;if(!q){p.style.visibility=pt.style.visibility='hidden';continue;}
    const x=rc.left+q.sx*k,y=rc.top+q.sy*k;p.style.visibility=pt.style.visibility='visible';
    pt.style.transform='translate('+x.toFixed(1)+'px,'+y.toFixed(1)+'px)';
    if(!p._w||now-VIL.info<20){p._w=p.offsetWidth||150;p._h=p.offsetHeight||46;}
    it.push({p,x,y,w:p._w,h:p._h,lx:x,ly:Math.max(top0,y-18-p._h)});}
  for(let n=0;n<24;n++){let moved=false;it.sort((a,b)=>a.ly-b.ly);
    for(let i=0;i<it.length;i++)for(let j=i+1;j<it.length;j++){const A=it[i],B=it[j],ox=(A.w+B.w)/2+8-Math.abs(A.lx-B.lx),oy=A.h+6-(B.ly-A.ly);
      if(ox>0&&oy>0){if(oy<ox||Math.abs(A.lx-B.lx)<20){if(A.ly-oy/2>=top0){A.ly-=oy/2;B.ly+=oy/2;}else B.ly+=oy;}else{const s=A.lx<B.lx?-1:1;A.lx+=s*ox/2;B.lx-=s*ox/2;}moved=true;}}
    if(!moved)break;}
  for(const q of it){const st=Math.max(6,q.y-(q.ly+q.h));q.p.style.setProperty('--st',st.toFixed(0)+'px');q.p.style.setProperty('--dx',(q.x-q.lx).toFixed(0)+'px');
    q.p.style.transform='translate('+q.lx.toFixed(1)+'px,'+q.ly.toFixed(1)+'px) translateX(-50%)';q.p.style.zIndex=String(10+Math.round(q.y/4));}}
/* entrées : bouton « Ville » du bandeau ; Économie, Équipage, Diplomatie, Monde ouvrent d'abord la ville (la partie s'ouvre par-dessus) */
document.addEventListener('click',e=>{const b=e.target.closest('#op-livre-nav [data-opl],#op-livre-nav [data-vilgo]');if(!b||!vilAvail())return;
  if(b.dataset.vilgo!==undefined){e.stopPropagation();e.preventDefault();if(VIL.on&&!(typeof OPL!=='undefined'&&OPL.open))vilClose();else{if(typeof OPL!=='undefined'&&OPL.open)oplClose();vilOpen();}return;}
  if(!VIL.on)vilOpen();},true);
(function vilNav(){requestAnimationFrame(vilNav);const n=document.getElementById('op-livre-nav');if(!n||n.querySelector('[data-vilgo]')||!VIL.ok)return;
  const b=document.createElement('button');b.type='button';b.dataset.vilgo='';b.title='Ville de l\'île choisie (ou de votre capitale) : cliquez ses lieux';b.innerHTML='<span>⌂</span>Ville';n.insertBefore(b,n.firstChild);})();
document.addEventListener('keydown',e=>{if(e.key!=='Escape'||!VIL.on)return;if(typeof OPL!=='undefined'&&OPL.open)return;const m=document.getElementById('op-menu');if(m&&!m.hidden)return;vilClose();},true);
/* la carte ne réagit pas sous la ville ; glisser fait tourner la vue, la molette zoome */
{const stop=e=>{if(!VIL.on||e.target!==canvas)return false;e.stopImmediatePropagation();return true;};
  addEventListener('pointerdown',e=>{if(stop(e)){VIL.drag={x:e.clientX,y0:VIL.dyaw};e.preventDefault();}},true);
  addEventListener('pointermove',e=>{if(VIL.on&&VIL.drag){VIL.dyaw=VIL.drag.y0+(e.clientX-VIL.drag.x)*.006;e.stopImmediatePropagation();}},true);
  addEventListener('pointerup',()=>{VIL.drag=null;},true);
  for(const ty of ['click','dblclick','mousedown','mouseup','mousemove','contextmenu'])addEventListener(ty,e=>{stop(e);},true);
  addEventListener('wheel',e=>{if(!stop(e))return;e.preventDefault();VIL.zoom=Math.max(.55,Math.min(1.8,VIL.zoom*(e.deltaY>0?1.1:1/1.1)));},{capture:true,passive:false});}
/* une bataille commence : on quitte la ville (la bataille prend la caméra) */
{const s0=rtStart;rtStart=function(o){if(VIL.on)vilClose();return s0(o);};}
window.__VIL={open:t=>vilOpen(typeof t==='number'?terrs[t]:t),close:vilClose,get on(){return VIL.on;},get t(){return VIL.t&&VIL.t.id;},
  anchors:t=>vilAnchors(typeof t==='number'?terrs[t]:t),mine:()=>vilMine().map(t=>t.id),
  pins:()=>[...document.querySelectorAll('#vil .vil-pin')].map(p=>{const r=p.getBoundingClientRect();return {id:p.dataset.vil,vis:p.style.visibility!=='hidden',x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),w:Math.round(r.width)};})};
{const B='body.vil',st=document.createElement('style');st.id='vil-css';st.textContent=[
  B+' #players,'+B+' #phase,'+B+' #side,'+B+' #b-side,'+B+' #cs-hud,'+B+' #mini,'+B+' #minibox,'+B+' #selcard,'+B+' #log,'+B+' #hint,'+B+' #evbar,'+B+' #brief,'+B+' #evt,'+B+' .zoomctl,'+B+' #op-dock,'+B+' #rt-go,'+B+' #tac-go,'+B+' #gfx-btn,'+B+' #gfx-demo,'+B+' #rt-mode-w,'+B+' #rt-isle,'+B+' .tu-card{display:none!important}',
  B+'.op-livre #side{display:grid!important}',
  '#vil{position:fixed;inset:0;z-index:30;pointer-events:none;font:13px Inter,system-ui,-apple-system,"Segoe UI",sans-serif;color:#fdf6e3}',
  '#vil[hidden]{display:none}#vil.vil-livre .vil-pin,#vil.vil-livre .vil-pt,#vil.vil-livre .vil-bar,#vil.vil-livre .vil-aide{visibility:hidden!important}',
  '#vil .vil-voile{position:absolute;inset:0;background:radial-gradient(ellipse 80% 75% at 50% 52%,rgba(0,0,0,0) 58%,rgba(6,12,22,.5) 100%),linear-gradient(180deg,rgba(255,196,120,.07),rgba(0,0,0,0) 45%,rgba(8,16,26,.16))}',
  '#vil .vil-pt{position:absolute;left:0;top:0;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;background:#ffd84d;border:2px solid #2a1a0c;box-shadow:0 0 0 4px rgba(255,216,77,.28),0 0 14px rgba(255,216,77,.8)}',
  '#vil .vil-pin{position:absolute;left:0;top:0;pointer-events:auto;display:flex;align-items:center;gap:8px;padding:4px 14px 4px 4px;border-radius:999px;cursor:pointer;white-space:nowrap;',
  'background:linear-gradient(180deg,rgba(30,28,32,.95),rgba(12,12,15,.95));border:2px solid #d9a93a;box-shadow:0 0 0 1px #2a1a0c,0 8px 18px rgba(0,0,0,.55);color:#fdf6e3;font:inherit;transition:border-color .15s,box-shadow .15s}',
  '#vil .vil-pin::after{content:"";position:absolute;left:calc(50% + var(--dx,0px));top:100%;width:2px;height:var(--st,14px);margin-left:-1px;background:linear-gradient(#d9a93a,rgba(217,169,58,.15));pointer-events:none}',
  '#vil .vil-pin:hover,#vil .vil-pin:focus-visible{border-color:#ffe066;box-shadow:0 0 0 1px #2a1a0c,0 0 18px rgba(255,214,90,.55),0 8px 18px rgba(0,0,0,.55);outline:none;z-index:999!important}',
  '#vil .vil-ic{width:34px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ffe680,#e0a10e);color:#2a1a0c;border:2px solid #2a1a0c;font:800 17px Inter,system-ui,sans-serif}',
  '#vil .vil-tx{display:flex;flex-direction:column;line-height:1.1;text-align:left}#vil .vil-tx b{font:800 14.5px Inter,system-ui,sans-serif}#vil .vil-tx small{font:600 11.5px Inter,system-ui,sans-serif;color:#e9c46a}',
  '#vil .vil-bd{position:absolute;right:-8px;top:-10px;width:22px;height:22px;border-radius:50%;background:#d62828;color:#fff;border:2px solid #2a1a0c;font:800 13px/18px Inter,sans-serif;font-style:normal;text-align:center}#vil .vil-bd[hidden]{display:none}',
  '#vil .vil-tip{position:absolute;left:50%;bottom:calc(100% + 10px);transform:translateX(-50%);display:none;flex-direction:column;gap:5px;width:240px;padding:10px 12px;border-radius:12px;background:#f8ecd0;color:#2a1a0c;border:2px solid #2a1a0c;box-shadow:0 12px 26px rgba(0,0,0,.5);white-space:normal;text-align:left}',
  '#vil .vil-pin:hover .vil-tip,#vil .vil-pin:focus-visible .vil-tip{display:flex}#vil .vil-tip em{font:400 18px/1.05 var(--op-titre,Impact);letter-spacing:1px;font-style:normal}#vil .vil-tip .vil-l{font:600 12.5px Inter,sans-serif}#vil .vil-cta{font:800 12px Inter,sans-serif;color:#8e1414}',
  '#vil .vil-bar{position:absolute;left:16px;bottom:16px;pointer-events:auto;display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:16px;background:linear-gradient(180deg,rgba(30,28,32,.94),rgba(12,12,15,.94));border:2px solid #d9a93a;box-shadow:0 10px 24px rgba(0,0,0,.5)}',
  '#vil .vil-bar button{height:44px;min-width:44px;padding:0 12px;border-radius:11px;border:1.5px solid rgba(214,166,58,.6);background:#1f1f25;color:#f5c518;font:800 15px Inter,sans-serif;cursor:pointer}#vil .vil-bar button:disabled{opacity:.35;cursor:default}',
  '#vil .vil-bar .vil-carte{background:linear-gradient(180deg,#ffe066,#e8a90d);color:#2a1a0c;border:2px solid #2a1a0c}',
  '#vil .vil-nm{display:flex;flex-direction:column;align-items:center;min-width:230px;line-height:1.1}#vil .vil-nm b{font:400 26px/1 var(--op-titre,Impact);letter-spacing:1.4px;color:#f5c518;-webkit-text-stroke:1.2px #2a1a0c;paint-order:stroke fill}#vil .vil-nm small{font:700 11.5px Inter,sans-serif;color:#e9dfc7}',
  '#vil .vil-aide{position:absolute;right:16px;bottom:22px;margin:0;font:700 11.5px Inter,sans-serif;color:#ffe7a3;text-shadow:0 1px 3px #000}',
  '#op-livre-nav [data-vilgo]{font-weight:800}'].join('');document.head.appendChild(st);}
