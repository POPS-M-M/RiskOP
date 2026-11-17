/* ================= PERSONNAGES 3D — SCÈNES (PROTOTYPE) : débarquement, navires, combat, atelier de comparaison =================
   Tout est de la mise en images : aucun champ n'est ajouté aux armées, aucune règle n'est touchée.
   • Le débarquement est joué APRÈS le calcul d'arrivée du jeu (resolveArrival d'origine appelé en premier, résultat inchangé) ; l'état de l'animation
     vit uniquement dans PXS.land (mémoire vive, non sauvegardée).
   • Seules les arrivées SANS bataille (renforts, replis) sont animées ici ; les attaques gardent la scène de combat existante. */
PXS.land=[];PXS.flights=[];PXS.looks=new Map();PXS.cap=8;PXS.ships3d=true;PXS.combat=true;PXS.fc=new Map();PXS.last={land:0};
const pxNew=()=>PXS.on&&PXS.mode!=='off'&&!PXS.fail;
const pxCrewId=o=>{const p=players[o],c=CREWS[(p&&p.crew)||0];return c?c.id:'pirate';};
const pxLook=(i,fac)=>{const k=i+':'+fac;let l=PXS.looks.get(k);if(!l){l=pxLookFor(i,fac);PXS.looks.set(k,l);}return l;};
const pxE=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
function pxRoster(counts,n,seed){
  const tot=counts.reduce((a,b)=>a+b,0),out=[];if(tot<=0)return out;
  const raw=counts.map(v=>v/tot*n),base=raw.map(Math.floor);let rest=n-base.reduce((a,b)=>a+b,0);
  const ord=raw.map((v,i)=>[v-Math.floor(v),i]).sort((a,b)=>b[0]-a[0]);for(let i=0;i<rest;i++)base[ord[i%ord.length][1]]++;
  base.forEach((c,kind)=>{for(let i=0;i<c;i++)out.push({kind,v:(pxHash(seed+':'+kind+':'+i)%3)});});return out;
}
/* ---------- géométrie d'une traversée : de la côte de départ au quai d'arrivée (pas de navire à travers les terres) ---------- */
function pxGeom(f,t){
  const dx=t.x-f.x,dy=t.y-f.y,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L,ang=Math.atan2(dy,dx),mf=W3.models.get(f.id),mt=W3.models.get(t.id);
  /* point d'accostage : le ponton construit sur l'île si la traversée arrive de son côté, sinon la côte tournée vers le départ */
  let la=Math.atan2(-uy,-ux);if(mt&&mt.pa!==undefined){const d=((mt.pa-la+Math.PI*3)%(Math.PI*2))-Math.PI;if(Math.abs(d)<1.2)la=mt.pa;}
  const ox=Math.cos(la),oy=Math.sin(la),rf=mf?mf.rc(ang):f.rad,rt=mt?mt.rc(la):t.rad,kS=(f.rad+t.rad)/60*2.0,scS=.95*kS,dB=rt*1.05+1.5*kS,ds=dB+4.2*scS;
  let d0=rf*1.1+2*kS;const P1=[t.x+ox*ds,t.y+oy*ds];const dd=Math.hypot(P1[0]-f.x,P1[1]-f.y);if(dd-d0<8*kS)d0=Math.max(0,dd-14*kS);
  const P0=[f.x+(P1[0]-f.x)/dd*d0,f.y+(P1[1]-f.y)/dd*d0];
  return {ux,uy,ix:-ox,iy:-oy,hd:Math.atan2(-oy,-ox),hf:Math.atan2(P1[1]-P0[1],P1[0]-P0[0]),kS,scS,dB,ds,rt,P0,P1,E:[t.x+ox*rt*.86,t.y+oy*rt*.86]};
}
const pxHd=(g,k)=>{const d=((g.hd-g.hf+Math.PI*3)%(Math.PI*2))-Math.PI;return g.hf+d*pxE(.8,1,k);};
function pxShipPos(a){const f=terrs[a.from],t=terrs[a.to];if(!f||!t)return null;const g=pxGeom(f,t),k=clamp(a.t/a.dur,0,1);return {x:g.P0[0]+(g.P1[0]-g.P0[0])*k,y:g.P0[1]+(g.P1[1]-g.P0[1])*k,hd:pxHd(g,k),g};}
function pxShip(G,x,y,hd,col,sc,tt,fac){b3Ship(G,x,y,hd,col,fac||'',sc,tt);}
const pxBob=(x,tt)=>Math.sin(tt*2.2+x)*.18;
const pxSlot=(s,n)=>({u:(2.5-Math.floor(s/2)*1.25),w:(s%2?.52:-.52)});               /* emplacement sur le pont (unités locales du navire) */
function pxDeckXY(P,hd,scS,sl){const c=Math.cos(hd),s=Math.sin(hd);return [P[0]+c*sl.u*scS-s*sl.w*scS,P[1]+s*sl.u*scS+c*sl.w*scS];}

/* ---------- débarquement ---------- */
function pxSnap(a){return {owner:a.owner,from:a.from,to:a.to,u:Object.assign({},a.u),rt:!!a.rt,lt:(()=>{try{return ltAt(a.from);}catch(_){return -1;}})()};}
function pxLandStart(sn,opt){
  opt=opt||{};const t=terrs[sn.to],f=terrs[sn.from],m=t&&W3.models.get(t.id);if(!t||!f||!m||PXS.mode==='off')return false;
  const live=PXS.land.length;if(live>=PXS.cap&&!opt.force)return false;
  const g=pxGeom(f,t),k=g.kS,sc=g.scS,fac=pxCrewId(sn.owner),H=(x,y)=>Math.max(0,m.H(x-t.x,y-t.y));
  const counts=UK.map(q=>Math.max(0,+sn.u[q]||0)),tot=counts.reduce((a,b)=>a+b,0);if(tot<1)return false;
  const capN=PXS.mode==='fast'?8:26,n=Math.max(3,Math.min(capN,Math.round(Math.pow(tot,.62)*1.1))),seed=(sn.from*131+sn.to*17+((performance.now()|0)%97));
  const roster=pxRoster(counts,n,seed),nsh=Math.min(3,Math.ceil(roster.length/10)),ships=[];
  for(let i=0;i<nsh;i++){const off=(i-(nsh-1)/2)*7*k,c=Math.cos(g.hd),s=Math.sin(g.hd);ships.push({P:[g.P1[0]-s*off,g.P1[1]+c*off],hd:g.hd,n:0});}
  const figs=[];roster.forEach((r,i)=>{const si=i%nsh,sh=ships[si],sl=pxSlot(sh.n++);figs.push({spec:{fac,kind:r.kind,v:r.v},scale:k,si,sl,ph:(pxHash(seed+':'+i)%1000)/1000});});
  if(sn.lt>=0||opt.cm!==undefined){const li=opt.cm!==undefined?opt.cm:sn.lt,sh=ships[0],sl=pxSlot(sh.n++);figs.push({spec:{fac,kind:0,v:0,cm:pxLook(li,fac)},scale:k*1.16,si:0,sl,ph:.3,cmdr:true,li});}
  /* chemin : pont → proue → plage → emplacement de regroupement (grappe naturelle derrière le chef) */
  const bow=[t.x-g.ix*g.dB,t.y-g.iy*g.dB],zD=1.1*sc,rally=[t.x-g.ix*g.rt*.50,t.y-g.iy*g.rt*.50],px_=-g.iy,py_=g.ix,rnd=pxRnd(seed*7+3);
  const cols=Math.max(3,Math.ceil(Math.sqrt(figs.length*1.7)));let order=0;
  figs.sort((a,b)=>(b.cmdr?1:0)-(a.cmdr?1:0)||a.sl.u-b.sl.u).reverse();
  figs.forEach((fg,i)=>{
    const sh=ships[fg.si],A=pxDeckXY(sh.P,sh.hd,sc,fg.sl),row=Math.floor(i/cols),col=i%cols-(cols-1)/2;
    let rx=rally[0]-g.ix*(row*1.9*k-(fg.cmdr?4:0))+px_*(col*1.8*k+(rnd()-.5)*.8*k),ry=rally[1]-g.iy*(row*1.9*k-(fg.cmdr?4:0))+py_*(col*1.8*k+(rnd()-.5)*.8*k);
    if(fg.cmdr){rx=rally[0]+g.ix*3.2*k;ry=rally[1]+g.iy*3.2*k;}
    const sB=[bow[0]+px_*(fg.sl.w*sc*.25),bow[1]+py_*(fg.sl.w*sc*.25)],E=[g.E[0]+px_*fg.sl.w*sc*.5,g.E[1]+py_*fg.sl.w*sc*.5];
    fg.pts=[[A[0],A[1],zD],[sB[0],sB[1],zD*.92],[E[0],E[1],H(E[0],E[1])+.05],[rx,ry,H(rx,ry)]];
    fg.len=[0];for(let q=1;q<4;q++)fg.len.push(fg.len[q-1]+Math.hypot(fg.pts[q][0]-fg.pts[q-1][0],fg.pts[q][1]-fg.pts[q-1][1]));
    fg.v=k*(fg.spec.kind===3?5.2:fg.spec.kind===4?3.0:4.2)*(.92+.16*fg.ph);fg.t0=.5+(fg.cmdr?0:1.1)+order*.2+fg.si*.35+(fg.cmdr?0:.0);order+=fg.cmdr?0:1;
    fg.tA=fg.t0+fg.len[3]/fg.v;fg.yawEnd=Math.atan2(g.iy,g.ix)+(rnd()-.5)*.5;
  });
  const tAll=Math.max(...figs.map(q=>q.tA));
  PXS.land.push({t0:performance.now(),g,m,t,k,sc,ships,figs,tAll,tEnd:tAll+2.6,fac,col:COLORS[sn.owner]||'#ffffff',own:sn.owner,H,id:PXS.last.land++,demo:!!opt.demo});
  return true;
}
function pxLandings(c,now){
  const live=PXS.land.length,spd=(PXS.mode==='fast'?2.4:1)*(1+Math.max(0,live-3)*.35);
  for(let li=PXS.land.length-1;li>=0;li--){
    const L=PXS.land[li];L.tt=L.tt===undefined?0:L.tt;const dt=L.lastNow?Math.min(.1,(now-L.lastNow)/1000):0;L.lastNow=now;L.tt+=dt*spd;const tau=L.tt;
    if(tau>L.tEnd){PXS.land.splice(li,1);continue;}
    const G=r3Geo(),g=L.g,al=1-pxE(L.tEnd-1.2,L.tEnd,tau),leave=pxE(L.tAll-1.2,L.tAll+1.4,tau),sc=L.sc,k=L.k;
    const pv=w3Proj(g.P1[0],g.P1[1],3,c);if(!pv||pv.sx<-200||pv.sx>canvas.width+200||pv.sy<-200||pv.sy>canvas.height+200){if(tau>L.tEnd-.01)PXS.land.splice(li,1);continue;}
    /* navires : à quai, puis ils s'éloignent en fondu pendant le regroupement */
    L.ships.forEach((sh,i)=>{const bk=leave*10*k,c0=Math.cos(sh.hd),s0=Math.sin(sh.hd),x=sh.P[0]-c0*bk,y=sh.P[1]-s0*bk,i0=G.P.length/3;
      pxShip(G,x,y,sh.hd,r3c(L.col),sc,now/1000+i+L.id,L.fac);sh.cur=[x,y];sh.a=1-leave;});
    /* passerelles */
    {const bow=[L.t.x-g.ix*g.dB,L.t.y-g.iy*g.dB],px_=-g.iy,py_=g.ix,wd=.5*k,zB=1.0*sc,zE=L.H(g.E[0],g.E[1])+.05,wood=r3c('#8a6238');
      if(leave<.5)G.quad([bow[0]+px_*wd,bow[1]+py_*wd,zB],[bow[0]-px_*wd,bow[1]-py_*wd,zB],[g.E[0]-px_*wd,g.E[1]-py_*wd,zE],[g.E[0]+px_*wd,g.E[1]+py_*wd,zE],wood);}
    /* personnages */
    for(const fg of L.figs){
      const s=tau-fg.t0,P=fg.pts;let x,y,z,yaw,anim='idle',tt=tau+fg.ph*5;
      const sh=L.ships[fg.si],hdS=Math.atan2(P[1][1]-P[0][1],P[1][0]-P[0][0]);
      if(s<=0){const q=pxDeckXY([sh.cur?sh.cur[0]:sh.P[0],sh.cur?sh.cur[1]:sh.P[1]],sh.hd,sc,fg.sl);x=q[0];y=q[1];z=1.1*sc+pxBob(sh.cur?sh.cur[0]:sh.P[0],now/1000+fg.si+L.id);yaw=g.hd+(fg.ph-.5)*.8;}
      else{const d=s*fg.v;if(d<fg.len[3]){let q=1;while(q<3&&d>fg.len[q])q++;const u=(d-fg.len[q-1])/Math.max(.001,fg.len[q]-fg.len[q-1]),a=P[q-1],b=P[q];x=a[0]+(b[0]-a[0])*u;y=a[1]+(b[1]-a[1])*u;z=a[2]+(b[2]-a[2])*u;yaw=Math.atan2(b[1]-a[1],b[0]-a[0]);anim='walk';tt=s+fg.ph*PX_ANIM.walk.d;}
        else{const e=tau-fg.tA;x=P[3][0];y=P[3][1];z=P[3][2];const ly=Math.atan2(P[3][1]-P[2][1],P[3][0]-P[2][0]);yaw=ly+((((fg.yawEnd-ly)+Math.PI*3)%(Math.PI*2))-Math.PI)*pxE(0,.7,e);
          anim=fg.cmdr?'cmd':'idle';if(!fg.cmdr&&tau>L.tAll+.3&&tau<L.tAll+1.7&&(fg.ph>.62))anim='cheer';tt=fg.cmdr?tau:tt;if(anim==='cheer')tt=tau-L.tAll;}}
      PXS.inst.push({spec:fg.spec,owner:L.own,x,y,z,yaw,anim,t:tt,scale:fg.scale,alpha:al});
    }
    {const arr=w3Shade(G),a=Math.min(al,1-leave*.999);if(a<.995)for(let v=6;v<arr.length;v+=7)arr[v]=a;w3DrawArr(c,arr,a<.995);}
  }
}
/* navires en traversée (armées réelles + démonstrations) : en 3D, de la côte de départ au quai */
function pxFlightShips(c,now){
  if(!PXS.ships3d)return;const G=r3Geo(),list=[];
  for(const a of armies)list.push({id:a.id|0,from:a.from,to:a.to,k:clamp(a.t/a.dur,0,1),owner:a.owner,u:a.u});
  for(const d of PXS.flights){const k=clamp((now-d.t0)/d.dur,0,1);list.push({id:d.id,from:d.from,to:d.to,k,owner:d.owner,u:d.u,demo:d});}
  for(const q of list){const f=terrs[q.from],t=terrs[q.to];if(!f||!t)continue;const g=pxGeom(f,t),x=g.P0[0]+(g.P1[0]-g.P0[0])*q.k,y=g.P0[1]+(g.P1[1]-g.P0[1])*q.k,p=w3Proj(x,y,2,c);
    if(!p||p.sx<-120||p.sx>canvas.width+120||p.sy<-120||p.sy>canvas.height+120)continue;
    const hd=pxHd(g,q.k);pxShip(G,x,y,hd,r3c(COLORS[q.owner]||'#ffffff'),g.scS,now/1000+q.id,pxCrewId(q.owner));
    if(PXS.mode==='full'){let cr=PXS.fc.get(q.id);if(!cr){const cn=UK.map(z=>Math.max(0,+q.u[z]||0)),tot=cn.reduce((a,b)=>a+b,0),n=Math.max(2,Math.min(8,Math.round(Math.pow(tot,.4))));cr=pxRoster(cn,n,'f'+q.id);PXS.fc.set(q.id,cr);if(PXS.fc.size>200)PXS.fc.delete(PXS.fc.keys().next().value);}
      const fac=pxCrewId(q.owner),bobz=pxBob(x,now/1000+q.id);cr.forEach((r,i)=>{const sl=pxSlot(i),w=pxDeckXY([x,y],g.hd,g.scS,sl);PXS.inst.push({spec:{fac,kind:r.kind,v:r.v},owner:q.owner,x:w[0],y:w[1],z:1.1*g.scS+bobz,yaw:g.hd,anim:'idle',t:now/1000+i*.7,scale:g.kS});});}}
  if(G.P.length)w3DrawArr(c,w3Shade(G),false);
}
/* ---------- raccord avec le jeu : arrivée → animation (le calcul d'origine passe toujours en premier) ---------- */
{const ra0=resolveArrival;
 resolveArrival=function(a){
   const lastB=BATTLES[BATTLES.length-1],sn=pxSnap(a),dst=terrs[a.to],ownBefore=dst?dst.owner:-9;
   ra0(a);
   try{if(pxNew()&&W3.act&&started&&BATTLES[BATTLES.length-1]===lastB&&dst&&dst.owner===a.owner&&ownBefore===a.owner)pxLandStart(sn);}catch(e){console.warn('débarquement 3D :',e);}
 };}
/* ---------- combat : les nouveaux personnages dans la scène existante (désactivable) ---------- */
function pxFight(u,side,x,y,z,face,tau,fall,melee,R,Rn,al,idle){
  const own=side===0?Rn.r.att:Rn.r.def,fac=side===0?Rn.crewA:(own>=0?pxCrewId(own):'native');
  PXS.inst.push({spec:{fac,kind:u.kind,v:(u.ph*10|0)&1},owner:own,x,y,z,yaw:face,anim:fall>0?'fall':(idle?'idle':(tau<4.4?'walk':(melee?'attack':'walk'))),t:fall>0?fall*PX_ANIM.fall.d:tau*1.3+u.ph*3,scale:2.0*R/30,alpha:al===undefined?1:al});
}
/* ---------- passage dans la boucle d'affichage ---------- */
function pxScene(c,now,combat){
  if(!pxNew()){PXS.inst.length=0;PXS.land.length=0;return;}
  try{
    if(PXS.dirtyLook){PXS.dirtyLook=false;PXS.looks.clear();for(const [k,m] of PXS.cache)if(k[0]==='c'){PXS.gl&&PXS.gl.deleteBuffer(m.buf);PXS.cache.delete(k);}for(const k of [...PXS.sets.keys()])if(k[0]==='c')PXS.sets.delete(k);}
    if(!(PXS.st.frames%90))pxIllScan();
    if(!combat){pxFlightShips(c,now);pxLandings(c,now);for(let i=PXS.flights.length-1;i>=0;i--){const d=PXS.flights[i];if(now-d.t0>d.dur){if(d.land)pxLandStart(d.land,{demo:true,cm:d.cm,force:true});PXS.flights.splice(i,1);}}}
    pxFlush(c,now,{});
  }catch(e){console.warn('persos 3D désactivés :',e);PXS.fail=String(e&&e.message||e);PXS.inst.length=0;PXS.land.length=0;}
}
/* démonstration : une traversée puis un débarquement, sur deux îles voisines (aucune donnée de jeu modifiée) */
function pxDemo(opt){
  opt=opt||{};let A=null,B=null;
  for(const t of terrs){if(t.owner!==ME)continue;for(const n of t.nb||[]){const u=terrs[n];if(!u||!W3.models.get(u.id)||!W3.models.get(t.id))continue;const d=Math.hypot(u.x-t.x,u.y-t.y);if(d>110&&d<420&&(!A||(t.owner===ME&&u.owner===ME&&!(A.owner===ME&&B.owner===ME)))){A=t;B=u;if(u.owner===ME)break;}}if(A&&B.owner===ME)break;}
  if(!A)for(const t of terrs){const n=(t.nb||[])[0];if(n!==undefined&&W3.models.get(t.id)&&W3.models.get(n)){A=t;B=terrs[n];break;}}
  if(!A)return false;
  const crew=CREWS[(players[ME]&&players[ME].crew)||0].id,cmI=opt.cmd===false?undefined:LEGENDS.findIndex(L=>(L.camps||[]).includes(crew)),u={guerrier:18,lancier:10,archer:8,cavalier:4,catapulte:2};
  const dur=(opt.dur||5200)/(PXS.mode==='fast'?2:1);
  PXS.flights.push({id:9000+(PXS.last.land|0),from:A.id,to:B.id,owner:ME,u,t0:performance.now(),dur,land:{owner:ME,from:A.id,to:B.id,u,rt:false,lt:-1},cm:cmI>=0?cmI:undefined});
  const g=pxGeom(A,B),mx=g.E[0]-g.ix*3*g.kS,my=g.E[1]-g.iy*3*g.kS;V.k=clamp(opt.k||16,1,18);V.x=mx-W/V.k/2;V.y=my-H/V.k/2;clampV();
  W3.cam.yaw=Math.atan2(g.ix,-g.iy);W3.cam.pitch=.62;dirty=true;return {A,B,cm:cmI};
}
function pxDemoMany(n){let c=0;for(const t of terrs){if(c>=n)break;const nb=(t.nb||[])[0];if(nb===undefined||!W3.models.get(t.id)||!W3.models.get(nb))continue;pxLandStart({owner:t.owner>=0?t.owner:0,from:t.id,to:nb,u:{guerrier:30,lancier:14,archer:10,cavalier:5,catapulte:2},lt:-1},{force:true,demo:true});c++;}return c;}

/* ================= ATELIER : comparaison ancien / nouveau, zooms, commandants, performances ================= */
const ATL_COL={marine:'#3d7bd6',pirate:'#d6453d',revo:'#3dbd6a',chasseur:'#d6a83d'},ATL_FAC=['marine','pirate','revo','chasseur'],ATL_FN={marine:'Marine',pirate:'Pirates',revo:'Révolutionnaires',chasseur:'Chasseurs de prime'};
PXS.atl={tab:'cmp',fac:'pirate',anim:'walk',lod:'auto',yaw:0,pitch:.62,zoom:1.35,min:false,auto:false,real:false,page:0,bench:null,pad:null};
function pxAtelierOpen(on){
  const A=PXS.atelier=on?(PXS.atelier||{}):null;let sh=document.getElementById('px-shield');
  if(on){if(!document.getElementById('px-panel'))pxPanelBuild();if(!sh){sh=document.createElement('div');sh.id='px-shield';sh.style.cssText='position:absolute;inset:0;z-index:30;cursor:grab;touch-action:none';document.getElementById('mapwrap').appendChild(sh);pxShieldBind(sh);}
    sh.style.display='block';document.getElementById('px-panel').style.display='block';}
  else{if(sh)sh.style.display='none';const p=document.getElementById('px-panel');if(p)p.style.display='none';}
  document.body.classList.toggle('pxatl',!!on);dirty=true;
}
function pxShieldBind(sh){let d=null;
  sh.addEventListener('pointerdown',e=>{d={x:e.clientX,y:e.clientY,yaw:PXS.atl.yaw,pitch:PXS.atl.pitch};PXS.atl.auto=false;try{sh.setPointerCapture(e.pointerId);}catch(_){}e.stopPropagation();});
  sh.addEventListener('pointermove',e=>{if(!d)return;PXS.atl.yaw=d.yaw+(e.clientX-d.x)*.008;PXS.atl.pitch=clamp(d.pitch+(e.clientY-d.y)*.005,.15,1.4);});
  sh.addEventListener('pointerup',()=>{d=null;});sh.addEventListener('pointercancel',()=>{d=null;});
  sh.addEventListener('wheel',e=>{e.preventDefault();PXS.atl.zoom=clamp(PXS.atl.zoom*(e.deltaY>0?1.12:1/1.12),.12,6);},{passive:false});}
function pxPanelBuild(){
  const st=document.createElement('style');st.textContent='#px-panel{position:absolute;z-index:40;left:8px;top:8px;max-width:min(430px,calc(100% - 16px));background:rgba(8,16,28,.92);border:1px solid rgba(255,255,255,.18);border-radius:12px;padding:8px 10px;color:#fff;font:11.5px Inter,system-ui,sans-serif;display:none}body.pxatl .selcard,body.pxatl #mini{display:none!important}'
   +'#px-panel button{font:inherit;color:#fff;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.22);border-radius:7px;padding:4px 8px;margin:2px 2px 0 0;cursor:pointer}#px-panel button.on{background:#2f7bd0;border-color:#7db6f0}#px-panel .r{margin-top:5px;line-height:1.5}#px-panel small{opacity:.75}'
   +'#px-open{position:absolute;z-index:25;left:8px;bottom:8px;font:600 12px Inter,system-ui,sans-serif;color:#fff;background:rgba(8,16,28,.85);border:1px solid rgba(255,255,255,.3);border-radius:8px;padding:6px 10px;cursor:pointer}';document.head.appendChild(st);
  const p=document.createElement('div');p.id='px-panel';document.getElementById('mapwrap').appendChild(p);p.addEventListener('pointerdown',e=>e.stopPropagation());pxPanelRender();
}
function pxPanelRender(){
  const p=document.getElementById('px-panel');if(!p)return;const A=PXS.atl,b=(id,txt,on,ex)=>'<button data-a="'+id+'" class="'+(on?'on':'')+'">'+txt+'</button>';
  const tabs=[['cmp','Ancien ↔ nouveau'],['zoom','Trois niveaux de zoom'],['cmd','Commandants'],['perf','Performances'],['land','Débarquement']];
  let h='<div><b>Personnages 3D · prototype</b> <button data-a="min">'+(A.min?'▸ Options':'▾ Réduire')+'</button><button data-a="close">✕ Fermer</button></div><div>'+tabs.map(t=>b('tab:'+t[0],t[1],A.tab===t[0])).join('')+'</div>';if(!A.min){
  if(A.tab==='cmp'||A.tab==='zoom')h+='<div class="r">Camp : '+ATL_FAC.map(f=>b('fac:'+f,ATL_FN[f],A.fac===f)).join('')+'</div>';
  if(A.tab==='cmp')h+='<div class="r">Animation : '+[['walk','Marche'],['idle','Repos'],['attack','Attaque'],['cheer','Acclamer'],['fall','Chute']].map(q=>b('anim:'+q[0],q[1],A.anim===q[0])).join('')+'</div>'
    +'<div class="r">Niveau forcé : '+[['auto','Auto'],['mesh','Maillage 3D'],['sprite','Sprite'],['sil','Silhouette']].map(q=>b('lod:'+q[0],q[1],A.lod===q[0])).join('')+b('real','Tailles réelles du jeu',A.real)+b('auto','Rotation auto',A.auto)+'</div><div class="r"><small>Clic-glisser : tourner · molette : zoom. Rangée du haut = rendu actuel (v20), rangée du bas = prototype ; 3e rangée = 4 commandants (apparence issue des données du jeu).</small></div>';
  if(A.tab==='zoom')h+='<div class="r"><small>Même personnage affiché à 5 hauteurs d’écran fixes + un balayage continu (6e case). Le niveau actif et le fondu sont lus en direct ; seuil maillage ≈ 42 px, silhouette sous ≈ 9–14 px (px du canevas).</small></div>';
  if(A.tab==='cmd')h+='<div class="r">'+[0,1,2,3].map(i=>b('page:'+i,'Page '+(i+1),A.page===i)).join('')+'<br><small>Le jeu ne contient aucune description physique des 46 lieutenants : silhouette, arme et posture viennent de leurs bonus réels, coiffure/accessoires d’une graine stable (distincts mais arbitraires), couleurs de l’illustration importée quand elle est lisible.</small></div>';
  if(A.tab==='perf')h+='<div class="r">'+b('bench','▶ Lancer le banc d’essai (~25 s)',false)+'<span id="px-bench"></span></div>';
  if(A.tab==='land')h+='<div class="r">Mode : '+[['full','Complètes'],['fast','Rapides'],['off','Désactivées']].map(q=>b('mode:'+q[0],q[1],PXS.mode===q[0])).join('')+b('ships','Navires 3D en traversée',PXS.ships3d)+b('combat','Nouveaux personnages au combat',PXS.combat)+'</div>'
    +'<div class="r">'+b('demo','▶ Traversée + débarquement (démo, avec un commandant)')+b('demo2','▶ Même scène sans commandant')+b('many','▶ 8 débarquements simultanés')+'</div><div class="r"><small>Ferme l’atelier et place la caméra sur deux îles voisines. Rien n’est modifié dans la partie : c’est un rejeu visuel. En jeu normal, seules les arrivées sans bataille (renforts, replis) sont animées ; les attaques gardent la scène de combat.</small></div>';
  }h+='<div class="r" id="px-stats"></div>';p.innerHTML=h;
  p.querySelectorAll('button[data-a]').forEach(bt=>bt.addEventListener('click',()=>pxAct(bt.dataset.a)));
}
function pxAct(a){const A=PXS.atl,[k,v]=a.split(':');
  if(k==='close')pxAtelierOpen(false);else if(k==='min')A.min=!A.min;
  else if(k==='tab'){A.tab=v;A.bench=null;}else if(k==='fac')A.fac=v;else if(k==='anim')A.anim=v;else if(k==='lod')A.lod=v;else if(k==='page')A.page=+v;
  else if(k==='real')A.real=!A.real;else if(k==='auto')A.auto=!A.auto;
  else if(k==='mode'){PXS.mode=v;try{localStorage.setItem('rk-px',v);}catch(_){}}
  else if(k==='ships')PXS.ships3d=!PXS.ships3d;else if(k==='combat')PXS.combat=!PXS.combat;
  else if(k==='bench')pxBenchStart();
  else if(k==='demo'||k==='demo2'||k==='many'){pxAtelierOpen(false);if(PXS.mode==='off'){PXS.mode='full';}if(k==='many'){V.k=2.4;pxDemoMany(8);}else pxDemo({cmd:k==='demo'});}
  pxPanelRender();dirty=true;}
{const b=document.createElement('button');b.id='px-open';b.style.display='none';b.textContent='👤 Persos 3D (prototype)';b.title='Ouvre l’atelier : ancien ↔ nouveau, zooms, commandants, performances, débarquement';
 b.addEventListener('click',()=>pxAtelierOpen(true));b.addEventListener('pointerdown',e=>e.stopPropagation());
 const w=document.getElementById('mapwrap');if(w){if(!document.getElementById('px-panel'))pxPanelBuild();/* bouton retiré de l'écran : l'atelier s'ouvre au clavier (Maj+P) */}
 window.addEventListener('keydown',e=>{if(e.shiftKey&&(e.key==='P'||e.key==='p')&&!/INPUT|TEXTAREA|SELECT/.test((e.target||{}).tagName||''))pxAtelierOpen(!PXS.atelier);});}

/* ---------- le décor de l'atelier : sol herbeux, plateforme, couleur de mer en fond ---------- */
function pxGround(c,R){
  const arr=[],q=(x0,y0,x1,y1,z,col)=>{for(const p of [[x0,y0],[x1,y0],[x1,y1],[x0,y0],[x1,y1],[x0,y1]])arr.push(p[0],p[1],z,col[0],col[1],col[2],1);};
  q(-R*3,-R*3,R*3,R*3,0,[.50,.66,.38]);
  const n=48,P=[];for(let i=0;i<n;i++){const a0=i/n*6.2832,a1=(i+1)/n*6.2832;for(const [rr,col] of [[R*1.0,[.86,.78,.58]],[R*.94,[.62,.74,.42]]]){arr.push(0,0,.02+rr*0,col[0],col[1],col[2],0);arr.length-=7;
    for(const p of [[0,0],[Math.cos(a0)*rr,Math.sin(a0)*rr],[Math.cos(a1)*rr,Math.sin(a1)*rr]])arr.push(p[0],p[1],rr===R?.03:.05,col[0],col[1],col[2],1);}}
  w3DrawArr(c,new Float32Array(arr),false);
}
const atlFigure=(x,y,z,yaw,spec,own,anim,t,scale)=>PXS.inst.push({spec,owner:own,x,y,z,yaw,anim,t,scale});
function atlOld(G,x,y,kind,col,anim,t,scale,face){const mv=anim==='walk'||anim==='attack';b3Unit(G,x,y,0,face||0,r3c(col),kind,mv?t*1.2:0,anim==='fall'?Math.min(1,(t%1.6)/1):0,scale);}
function atlLodOpt(){const l=PXS.atl.lod;return l==='mesh'?{forceMesh:1}:l==='sprite'?{forceSprite:1}:l==='sil'?{forceSprite:1,forceSil:1}:{};}
const atlT=(an,now)=>{const A=PX_ANIM[an]||PX_ANIM.idle;return A.loop?now/1000:((now/1000)%(A.d*1.8));};

function pxAtelierFrame(now){
  const t0=performance.now(),gl=W3.gl,A=PXS.atl,cv=W3.cv,Wc=cv.width,Hc=cv.height;
  if(cv.width!==canvas.width){cv.width=canvas.width;cv.height=canvas.height;}
  cv.style.display='block';document.getElementById('mapwrap').classList.add('w3');
  gl.viewport(0,0,Wc,Hc);gl.disable(gl.SCISSOR_TEST);gl.clearColor(.62,.86,.92,1);gl.clearDepth(1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.depthMask(true);
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,Wc,Hc);ctx.textAlign='center';ctx.textBaseline='middle';
  const dpr=Wc/(ui.cssW||Wc),s=Math.max(1,dpr),lab=(txt,x,y,sz,col)=>{ctx.font='700 '+(sz*s)+'px Inter,system-ui,sans-serif';ctx.lineWidth=4*s;ctx.strokeStyle='rgba(6,12,20,.85)';ctx.fillStyle=col||'#fff';ctx.strokeText(txt,x,y);ctx.fillText(txt,x,y);};
  if(A.auto)A.yaw+=.004;
  const stats=document.getElementById('px-stats');let info='';
  if(!pxInit()){lab('Rendu 3D des personnages indisponible : '+PXS.fail,Wc/2,Hc/2,16);PXS.inst.length=0;return;}
  PXS.inst.length=0;
  if(A.tab==='cmp'){
    const fac=A.fac,col=ATL_COL[fac],kinds=[0,1,2,3,4],gap=7,xs=kinds.map((_,i)=>(i-2)*gap),sNew=A.real?1:2.5,sOld=5.2,G=r3Geo();
    const FZ=Math.PI/2-.45,c=w3Cam(0,0,A.yaw,A.pitch,70*A.zoom);pxGround(c,38);
    const t=atlT(A.anim,now);
    kinds.forEach((k,i)=>{atlOld(G,xs[i],-10,k,col,A.anim,t,sOld,FZ);
      const spec={fac,kind:k,v:0};atlFigure(xs[i],0,0,FZ,spec,col,A.anim,t,sNew);});
    /* commandants : 4 apparences tirées des données */
    const cms=LEGENDS.map((L,i)=>[L,i]).filter(([L])=>(L.camps||[]).includes(fac)).slice(0,4);
    cms.forEach(([L,i],j)=>atlFigure((j-1.5)*gap*1.1,10,0,FZ,{fac,kind:0,v:0,cm:pxLook(i,fac)},col,A.anim==='walk'?'cmd':A.anim,atlT(A.anim==='walk'?'cmd':A.anim,now),sNew*1.16));
    w3DrawArr(c,w3Shade(G),false);
    pxFlush(c,now,Object.assign({maxMesh:99},atlLodOpt()));
    ['Sabreur','Lancier','Tireur','Cavalier','Catapulte'].forEach((n,i)=>{const p=w3Proj(xs[i],0,-1.2,c);if(p)lab(n,p.sx,p.sy+10*s,11);});
    const p0=w3Proj(-23,-10,2,c),p1=w3Proj(-23,0,2,c),p2=w3Proj(-23,10,2,c);
    if(A.yaw===0||Math.abs(A.yaw)<.4){if(p0)lab('ACTUEL',p0.sx,p0.sy,12,'#ffb09a');if(p1)lab('NOUVEAU',p1.sx,p1.sy,12,'#9ff0b0');if(p2)lab('CHEFS',p2.sx,p2.sy,12,'#ffe9a8');}
    cms.forEach(([L,i],j)=>{const p=w3Proj((j-1.5)*gap*1.1,10,-1.2,c),lk=pxLook(i,fac);if(p)lab(L.s+' · '+lk.src,p.sx,p.sy+10*s,10.5,lk.src==='illustration'?'#9ff0b0':'#fff');});
    info=A.real?'Tailles réelles : ancien (scène de combat v20) ≈ 7,5 · nouveau (carte) ≈ 3,0 — unités du monde pour une île de rayon 30.':'Tailles égalisées pour comparer la finesse du modèle (clique « Tailles réelles du jeu » pour voir la réduction).';
  }
  else if(A.tab==='zoom'){
    const fac=A.fac,col=ATL_COL[fac],heights=[7,12,22,42,80],cw=Math.floor(Wc/3),ch=Math.floor(Hc/2),ty=Math.tan(W3_FOVY/2);
    const cells=heights.concat([0]);let txt=[];
    gl.enable(gl.SCISSOR_TEST);
    cells.forEach((hpx,ci)=>{
      const cx=(ci%3)*cw,cyTop=Math.floor(ci/3)*ch,vy=Hc-cyTop-ch;
      let hp=hpx;if(!hp){hp=7+Math.round(78*(.5-.5*Math.cos(now/2600)));}
      gl.viewport(cx,vy,cw,ch);gl.scissor(cx,vy,cw,ch);gl.clearColor(.62,.86,.92,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      /* distance telle que le soldat (3 unités × échelle) mesure hp pixels dans une case de hauteur ch */
      const D=70,scz=hp*D*ty/(ch/2)/PXH,c=w3Cam(0,0,A.yaw,.55,D);c.tx=c.ty*cw/ch;
      /* w3Proj travaille avec le canevas entier ; on lit le niveau par le même calcul que pxFlush (hauteur en px du CANEVAS) */
      pxGround(c,90);
      const xs=[-2.8*scz,0,2.8*scz],specs=[{fac,kind:0,v:0},{fac,kind:2,v:1},{fac,kind:0,v:0,cm:pxLook(Math.max(0,LEGENDS.findIndex(L=>(L.camps||[]).includes(fac))),fac)}];
      specs.forEach((sp,i)=>PXS.inst.push({spec:sp,owner:col,x:xs[i],y:0,z:0,yaw:Math.PI/2-.45,anim:'idle',t:now/1000,scale:scz}));
      pxFlush(Object.assign(c,{ctxH:ch}),now,Object.assign({vh:ch},atlLodOpt()));
      txt.push([hp,cx+cw/2,cyTop+ch-(ci>2?58:12)*s]);
    });
    gl.disable(gl.SCISSOR_TEST);gl.viewport(0,0,Wc,Hc);
    ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=1.5*s;ctx.beginPath();for(let i=1;i<3;i++){ctx.moveTo(i*cw,0);ctx.lineTo(i*cw,Hc);}ctx.moveTo(0,ch);ctx.lineTo(Wc,ch);ctx.stroke();
    txt.forEach(([hp,x,y],i)=>{const lv=hp>=49?'maillage 3D':hp>=35?'fondu sprite ↔ maillage':hp>=14?'sprite':hp>=9?'fondu silhouette ↔ sprite':'silhouette';lab((i===5?'balayage · ':'')+'≈ '+hp+' px · '+lv,x,y,12);});
    info='Les trois niveaux utilisent le même modèle : le sprite est la photo précalculée du maillage, la silhouette en est l’aplat teinté.';
  }
  else if(A.tab==='cmd'){
    const per=12,i0=A.page*per,list=[...Array(LEGENDS.length).keys()].slice(i0,i0+per),gap=6.4,c=w3Cam(0,-1,A.yaw*.4+0,.5,33*A.zoom);pxGround(c,40);
    const pos=[];list.forEach((i,j)=>{const L=LEGENDS[i],fac=(L.camps&&L.camps[0])||'pirate',x=((j%6)-2.5)*gap,y=j<6?6:-6,lk=pxLook(i,fac);pos.push([x,y,i,lk,L]);
      PXS.inst.push({spec:{fac,kind:0,v:0,cm:lk},owner:ATL_COL[fac]||'#ffffff',x,y,z:0,yaw:Math.PI/2+.25*Math.sin(now/1500+j),anim:'cmd',t:now/1000+j*.4,scale:1.3});});
    pxFlush(c,now,Object.assign({maxMesh:99},atlLodOpt()));
    pos.forEach(([x,y,i,lk,L])=>{const p=w3Proj(x,y,-1,c);if(!p)return;lab(L.s,p.sx,p.sy+9*s,11);lab(lk.src==='illustration'?'illustration ✓':lk.src==='fiche validée'?'fiche validée':'données seules',p.sx,p.sy+22*s,9.5,lk.src==='données'?'#c8d4e4':'#9ff0b0');
      const im=PXS.medal&&PXS.medal[L.s];if(im&&im.complete&&im.naturalWidth){const r=14*s,cx=p.sx,cy=p.sy-6.2*p.k-14*s;ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,6.283);ctx.clip();ctx.drawImage(im,cx-r,cy-r,2*r,2*r);ctx.restore();ctx.strokeStyle='#fff';ctx.lineWidth=1.5*s;ctx.beginPath();ctx.arc(cx,cy,r,0,6.283);ctx.stroke();}});
    PXS.medal=PXS.medal||{};if(typeof IL!=='undefined'&&IL.url)for(const i of list){const id=LEGENDS[i].s;if(IL.url[id]&&!PXS.medal[id]){const im=new Image();im.src=IL.url[id];PXS.medal[id]=im;}}
    const nI=list.filter(i=>PXILL.pal[LEGENDS[i].s]).length;info='Page '+(A.page+1)+'/4 · '+nI+' illustration(s) lue(s) sur cette page ('+PXILL.n+' au total). Médaillon (si importé) au-dessus du personnage : il complète la figure 3D, il ne la remplace pas.';
  }
  else if(A.tab==='perf'){info=pxBenchFrame(now);}
  else if(A.tab==='land'){lab('Utilise les boutons ci-dessus : la caméra va sur deux îles de votre partie.',Wc/2,Hc/2,15);}
  {const s2=PXS.st,mem=PXS.pages.length*PXS.PAGE*PXS.PAGE*4/1048576,l2='Image : '+s2.mesh+' maillages · '+s2.spr+' sprites · '+s2.sil+' silhouettes · '+Math.round(s2.tris/1000)+' k triangles · CPU '+s2.ms.toFixed(1)+' ms · atlas '+PXS.pages.length+' page(s) ≈ '+mem.toFixed(0)+' Mo · '+PXS.cache.size+' poses en cache';
   ctx.fillStyle='rgba(6,12,22,.78)';ctx.fillRect(0,Hc-44*s,Wc,44*s);ctx.textAlign='left';ctx.font='600 '+(11.5*s)+'px Inter,system-ui,sans-serif';ctx.fillStyle='#fff';ctx.fillText(info,10*s,Hc-30*s);ctx.fillStyle='#bcd3ea';ctx.fillText(l2,10*s,Hc-13*s);ctx.textAlign='center';}
  gl.finish();dirty=false;W3.frames++;W3.drawMs=Math.round(performance.now()-t0);
}
/* ---------- banc d'essai : mêmes foules, ancien rendu / nouveau rendu à trois distances ---------- */
const PXB_SC=[['Ancien · 300 soldats, plan moyen','old',300,28],['Nouveau · 300 soldats, plan lointain (≈9 px)','new',300,9],['Nouveau · 300 soldats, plan moyen (≈28 px)','new',300,28],['Nouveau · 300 soldats, plan rapproché (≈70 px)','new',300,70],['Nouveau · 1200 soldats, plan lointain (≈9 px)','new',1200,9]];
function pxBenchStart(){PXS.atl.bench={i:0,f:0,res:[],t:0,sum:0,tr:0,n:{}};}
function pxBenchFrame(now){
  const B=PXS.atl.bench;if(!B)return 'Lance le banc d’essai : même foule en ancien rendu puis en nouveau rendu, mesurée sur votre machine (CPU + GPU, gl.finish après chaque image).';
  const el=document.getElementById('px-bench');
  if(B.i>=PXB_SC.length){const rows=B.res.map(r=>r.name+' → '+r.ms.toFixed(1)+' ms/image ('+(1000/Math.max(.01,r.ms)).toFixed(0)+' i/s) · '+r.tris+' k tri'+(r.detail?' · '+r.detail:'')).join('<br>');if(el)el.innerHTML='<br><small>'+rows+'</small>';return 'Banc d’essai terminé.';}
  const [name,kind,N,hpx]=PXB_SC[B.i],G=kind==='old'?r3Geo():null,cols=Math.ceil(Math.sqrt(N*1.6)),sp=3.4,gl=W3.gl,ty=Math.tan(W3_FOVY/2);
  const D=PXH*(canvas.height/2)/(hpx*ty),c=w3Cam(0,0,.6,.9,D);pxGround(c,Math.sqrt(N)*sp);
  const tt=now/1000,t0=performance.now();
  for(let i=0;i<N;i++){const x=((i%cols)-(cols-1)/2)*sp,y=(Math.floor(i/cols)-(N/cols-1)/2)*sp,k=i%5;
    if(kind==='old')atlOld(G,x,y,k,ATL_COL[ATL_FAC[(i/5|0)%4]],'walk',tt+i*.13,2.5*.6);
    else PXS.inst.push({spec:{fac:ATL_FAC[(i/5|0)%4],kind:k,v:i&1},owner:ATL_COL[ATL_FAC[(i/5|0)%4]],x,y,z:0,yaw:(i%7)*.9,anim:'walk',t:tt+i*.13,scale:1});}
  if(G)w3DrawArr(c,w3Shade(G),false);else pxFlush(c,now,{maxMesh:64});
  gl.finish();const dt=performance.now()-t0;
  B.f++;if(B.f>30){B.sum+=dt;B.tr+=(kind==='old'?(G.P.length/3/3):PXS.st.tris);B.n.m=(B.n.m||0)+PXS.st.mesh;B.n.s=(B.n.s||0)+PXS.st.spr;B.n.l=(B.n.l||0)+PXS.st.sil;}
  if(B.f>=30+50){const m=B.sum/50;B.res.push({name,ms:m,tris:Math.round(B.tr/50/1000),detail:kind==='old'?'':Math.round(B.n.m/50)+' maillages / '+Math.round(B.n.s/50)+' sprites / '+Math.round(B.n.l/50)+' silhouettes'});B.i++;B.f=0;B.sum=0;B.tr=0;B.n={};}
  return 'Banc d’essai '+(Math.min(B.i+1,PXB_SC.length))+'/'+PXB_SC.length+' : '+name+' (image '+B.f+'/80)';
}
