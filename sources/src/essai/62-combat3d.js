/* ================= COMBAT 3D (version test) : chaque attaque est rejouée en scène 3D =================
   La scène n'invente rien : elle rejoue le rapport de bataille déjà calculé par le jeu (troupes engagées par type, pertes, vainqueur,
   boss, fortin). Aucune règle n'est modifiée : le calcul a eu lieu avant, la scène n'est qu'une mise en images, ~9 s, que l'on peut passer.
   En partie solo, le temps de jeu est suspendu pendant la scène ; en ligne il continue. Sans monde 3D actif, le comportement d'origine est conservé. */
const B3={on:true,run:null,q:[],DUR:10.5};
try{if(localStorage.getItem('rk-b3')==='0')B3.on=false;}catch(_){}
const b3Tau=now=>B3.freeze!==undefined?B3.freeze:(now-B3.run.t0)/1000;
{const st=document.createElement('style');st.textContent='body.b3run .selcard{display:none!important}';document.head.appendChild(st);}
const B3_SKIN=r3c('#f1c9a0'),B3_STEEL=r3c('#d7dde4'),B3_WOOD=r3c('#7a5634'),B3_DARK=r3c('#2e2a2a');

/* transforme (rotation autour de z puis translation) les sommets ajoutés depuis i0 */
function b3Xf(G,i0,ang,ox,oy,oz){const c=Math.cos(ang),s=Math.sin(ang);for(let i=i0*3;i<G.P.length;i+=3){const x=G.P[i],y=G.P[i+1];G.P[i]=ox+x*c-y*s;G.P[i+1]=oy+x*s+y*c;G.P[i+2]+=oz||0;
  const nx=G.N[i],ny=G.N[i+1];G.N[i]=nx*c-ny*s;G.N[i+1]=nx*s+ny*c;}}
const b3h=i=>{const v=Math.sin(i*127.1+311.7)*43758.5453;return v-Math.floor(v);};
const b3e=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};

/* effectif d'un camp : tableau par type d'unité → liste de silhouettes (≈ 1 pour 2 soldats, entre 3 et 34) */
function b3Roster(counts,seed){
  const tot=brCnt(counts),n=Math.max(3,Math.min(34,Math.round(tot/2.2))),k=Array.isArray(counts)?counts:[tot,0,0,0,0],out=[];
  if(tot<=0)return out;const raw=k.map(v=>v/tot*n),base=raw.map(Math.floor);let rest=n-base.reduce((a,b)=>a+b,0);
  const ord=raw.map((v,i)=>[v-Math.floor(v),i]).sort((a,b)=>b[0]-a[0]);for(let i=0;i<rest;i++)base[ord[i%ord.length][1]]++;
  base.forEach((c,kind)=>{for(let i=0;i<c;i++)out.push({kind});});
  /* mélange stable */out.sort((a,b)=>b3h(seed+a.kind*7+out.indexOf(a))-b3h(seed+b.kind*7+out.indexOf(b)));return out;
}
/* silhouette : corps, jambes, tête, arme selon le type (0 pirate, 1 sabreur, 2 tireur, 3 mangeur de fruit, 4 canon) */
function b3Unit(G,x,y,z,face,col,kind,anim,fall,sc){
  const fx=Math.cos(face),fy=Math.sin(face),sx=-fy,sy=fx,s=sc,ft=fall;
  if(kind===4){/* canon : affût et tube */
    G.box(x-.55*s,y-.3*s,z,1.1*s,.6*s,.28*s,B3_WOOD);G.cyl(x-.35*s,y-.35*s,z-.02,.22*s,.12,B3_DARK,8);
    const bx=x+fx*.1,by=y+fy*.1;G.quad([bx-sx*.17*s,by-sy*.17*s,z+.4*s],[bx+sx*.17*s,by+sy*.17*s,z+.4*s],[bx+fx*1.2*s+sx*.17*s,by+fy*1.2*s+sy*.17*s,z+.5*s],[bx+fx*1.2*s-sx*.17*s,by+fy*1.2*s-sy*.17*s,z+.5*s],B3_DARK);
    G.cyl(bx,by,z+.28*s,.22*s,.3*s,col,8);return;}
  const bob=ft>0?0:Math.abs(Math.sin(anim*7))*.07*s,hh=(.78-ft*.45)*s,z0=z-ft*.18*s;
  /* jambes */for(const k of [-1,1])G.cyl(x+sx*.12*s*k,y+sy*.12*s*k,z0+bob,.085*s,.42*s*(1-ft*.6),B3_DARK,5,false);
  /* corps */G.cyl(x,y,z0+.38*s+bob,.26*s,hh*.78,col,7);
  /* tête et coiffe */const hz=z0+.38*s+hh*.78+bob+.2*s;G.ico(x+fx*ft*.3*s,y+fy*ft*.3*s,hz-ft*.25*s,.21*s,1,B3_SKIN,null,0);
  if(kind===3){G.ico(x,y,hz+.26*s,.18*s,1,r3c('#c58cf0'),null,0);}else G.cyl(x,y,hz+.12*s,.24*s,.12*s,col,7);
  if(ft>.5)return;
  /* arme : balancier d'attaque */
  const sw=Math.sin(anim*9)*.8,hx=x+fx*.32*s,hy=y+fy*.32*s,hz2=z0+.62*s+bob;
  const sl=(len,ang,w,c)=>{const dz=Math.sin(ang)*len,dh=Math.cos(ang)*len;G.quad([hx-sx*w,hy-sy*w,hz2],[hx+sx*w,hy+sy*w,hz2],[hx+fx*dh+sx*w,hy+fy*dh+sy*w,hz2+dz],[hx+fx*dh-sx*w,hy+fy*dh-sy*w,hz2+dz],c);};
  if(kind===0||kind===3)sl(.95*s,.9+sw*.5,.05*s,B3_STEEL);
  else if(kind===1){sl(1.9*s,.4+sw*.12,.04*s,B3_STEEL);const cx=x+sx*.38*s+fx*.2*s,cy=y+sy*.38*s+fy*.2*s;G.cyl(cx,cy,z0+.35*s+bob,.3*s,.07*s,col,8);}
  else if(kind===2){sl(.8*s,1.2,.03*s,B3_WOOD);G.tri([hx+fx*.3*s,hy+fy*.3*s,hz2+.4*s],[hx+fx*.3*s,hy+fy*.3*s,hz2-.4*s],[hx+fx*.36*s,hy+fy*.36*s,hz2],B3_WOOD);}
}
/* navire d'assaut (même volume que le port marchand), orienté vers la côte */
/* ---------- navire : caravelle à trois mâts (coque profilée, château arrière, voiles carrées bombées, pavillon et liseré à la couleur du joueur) ---------- */
const B3_SHIPS={marine:{hull:'#e6e0cf',dk:'#8d7f66',sail:'#f4f5f7',em:'#2c4778'},pirate:{hull:'#5d3b22',dk:'#3a2416',sail:'#eadfc3',em:'#1d1c22'},revo:{hull:'#52633f',dk:'#33422a',sail:'#d9e0c4',em:'#2f6a3c'},chasseur:{hull:'#6f5b38',dk:'#47391f',sail:'#dccb9f',em:'#9a6a1c'}};
const B3_WP=[[-3.9,.72],[-3.3,.98],[-2,1.14],[0,1.2],[1.8,1.1],[3,.82],[3.9,.45],[4.55,.08]];
const b3W=x=>{for(let i=1;i<B3_WP.length;i++){const a=B3_WP[i-1],b=B3_WP[i];if(x<=b[0]){const k=(x-a[0])/(b[0]-a[0]||1);return a[1]+(b[1]-a[1])*Math.max(0,Math.min(1,k));}}return .08;};
function b3Ship(G,x,y,ang,col,crew,sc,t){
  const i0=G.P.length/3,F=B3_SHIPS[crew]||B3_SHIPS.pirate,hull=r3c(F.hull),dk=r3c(F.dk),sailC=r3c(F.sail),emC=r3c(F.em),wood=r3c('#4a3220'),tan=r3c('#b98a58'),tan2=r3c('#a57848'),rope=r3c('#3a2a1c'),dark=r3c('#1b1714');
  const rod=(a,b,r,c)=>{const d=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],l=Math.hypot(...d)||1,u=[d[0]/l,d[1]/l,d[2]/l];let p=Math.abs(u[2])>.9?[1,0,0]:[0,0,1];
    let s=[u[1]*p[2]-u[2]*p[1],u[2]*p[0]-u[0]*p[2],u[0]*p[1]-u[1]*p[0]];const sl=Math.hypot(...s)||1;s=s.map(q=>q/sl*r);const v=[u[1]*s[2]-u[2]*s[1],u[2]*s[0]-u[0]*s[2],u[0]*s[1]-u[1]*s[0]];
    const C=[[s[0],s[1],s[2]],[v[0],v[1],v[2]],[-s[0],-s[1],-s[2]],[-v[0],-v[1],-v[2]]];
    for(let i=0;i<4;i++){const e=C[i],f=C[(i+1)%4];G.quad([a[0]+e[0],a[1]+e[1],a[2]+e[2]],[b[0]+e[0],b[1]+e[1],b[2]+e[2]],[b[0]+f[0],b[1]+f[1],b[2]+f[2]],[a[0]+f[0],a[1]+f[1],a[2]+f[2]],c);}};
  /* coque : sections de la poupe à la proue, quatre niveaux (liseré du joueur au bordé, puis flancs sombres jusqu'à la quille) */
  const XS=[-3.9,-3.4,-2.7,-1.8,-.8,.2,1.2,2.1,2.9,3.5,4.05,4.55],LV=[[1.1,1,col],[.82,.985,col],[.3,.9,hull],[-.2,.68,dk],[-.55,0,dk]];
  for(const s of [1,-1])for(let i=0;i<XS.length-1;i++){const xa=XS[i],xb=XS[i+1],wa=b3W(xa),wb=b3W(xb);
    for(let l=0;l<LV.length-1;l++){const A=LV[l],B=LV[l+1],c=l===0?A[2]:(l===1?hull:B[2]);
      G.quad([xa,s*wa*A[1],A[0]],[xb,s*wb*A[1],A[0]],[xb,s*wb*B[1],B[0]],[xa,s*wa*B[1],B[0]],c);}}
  const wS=b3W(-3.9);for(let l=0;l<LV.length-1;l++){const A=LV[l],B=LV[l+1];G.quad([-3.9,-wS*A[1],A[0]],[-3.9,wS*A[1],A[0]],[-3.9,wS*B[1],B[0]],[-3.9,-wS*B[1],B[0]],l===0?col:hull);}
  /* pont en planches alternées, bordages (plus hauts à la proue) */
  for(let xx=-3.8,k=0;xx<4.2;xx+=.4,k++){const w0=b3W(xx)*.93,w1=b3W(xx+.4)*.93;G.quad([xx,-w0,1.09],[xx+.4,-w1,1.09],[xx+.4,w1,1.09],[xx,w0,1.09],k%2?tan:tan2);}
  for(const s of [1,-1]){let px0=null;for(let xx=-3.9;xx<=4.5;xx+=.35){const w=b3W(xx),rh=.26+(xx>1.8?.55*r3ss(1.8,4.5,xx):0);
    if(px0){const w0=px0[1],h0=px0[2];G.quad([px0[0],s*w0,1.1],[xx,s*w,1.1],[xx,s*w,1.1+rh],[px0[0],s*w0,1.1+h0],wood);G.quad([px0[0],s*(w0-.08),1.1+h0],[xx,s*(w-.08),1.1+rh],[xx,s*w,1.1+rh],[px0[0],s*w0,1.1+h0],tan);}
    px0=[xx,w,rh];}}
  /* sabords et château arrière */
  for(const s of [1,-1])for(const cx of [-1.6,-.7,.2,1.1,2.0])G.quad([cx-.15,s*(b3W(cx)*.99+.012),.86],[cx+.15,s*(b3W(cx)*.99+.012),.86],[cx+.15,s*(b3W(cx)*.99+.012),.58],[cx-.15,s*(b3W(cx)*.99+.012),.58],dark);
  G.box(-3.85,-.72,1.1,1.3,1.44,.62,hull,tan);G.box(-3.85,-.72,1.72,1.3,.07,.07,wood);
  for(const wy of [-.4,0,.4])G.quad([-3.915,wy-.11,1.28],[-3.915,wy+.11,1.28],[-3.915,wy+.11,1.52],[-3.915,wy-.11,1.52],r3c('#ffd77a'));
  G.ico(-3.95,0,2.05,.1,1,r3c('#ffd77a'),null,0);rod([-3.95,0,1.72],[-3.95,0,2],.025,rope);
  /* beaupré et foc */
  rod([3.95,0,1.2],[6.05,0,2.15],.07,wood);G.tri([6,0,2.1],[2.85,0,5.1],[3.5,0,1.7],sailC);rod([6.05,0,2.15],[2.8,0,5.4],.014,rope);
  /* mâts, vergues, voiles */
  const wave=(k)=>Math.sin(t*3+k)*.12;
  const sail=(mx,zb,zt,w,bul,emb)=>{const nu=5,nv=4;const P=(u,v)=>{const ww=w*(1-.18*v),bx=bul*Math.sin(Math.PI*u)*Math.sin(Math.PI*Math.min(1,v*.9+.05));return [mx+.06+bx+wave(mx)*.2*v,(u-.5)*ww,zb+(zt-zb)*v];};
    for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=P(i/nu,j/nv),b=P((i+1)/nu,j/nv),c=P((i+1)/nu,(j+1)/nv),d=P(i/nu,(j+1)/nv);G.quad(a,b,c,d,j===0?col:sailC);}
    if(emb){const cz=zb+(zt-zb)*.58,c0=P(.5,.58),rr=Math.min(w*.2,(zt-zb)*.24);const disc=(r,c,dx)=>{for(let k=0;k<10;k++){const a0=k/10*6.2832,a1=(k+1)/10*6.2832;G.tri([c0[0]+dx,c0[1],cz],[c0[0]+dx,c0[1]+Math.cos(a0)*r,cz+Math.sin(a0)*r],[c0[0]+dx,c0[1]+Math.cos(a1)*r,cz+Math.sin(a1)*r],c);}};
      disc(rr,emC,.03);if(crew==='pirate'||!crew){disc(rr*.18,sailC,.05);G.quad([c0[0]+.05,c0[1]-rr*.55,cz-rr*.55],[c0[0]+.05,c0[1]+rr*.55,cz-rr*.55],[c0[0]+.05,c0[1]+rr*.55,cz-rr*.7],[c0[0]+.05,c0[1]-rr*.55,cz-rr*.7],sailC);}else disc(rr*.5,sailC,.05);}};
  const mast=(mx,z0,h,yards)=>{G.cyl(mx,0,z0,.09,h,wood,6,false);for(const [yz,len] of yards)rod([mx+.02,-len/2,yz],[mx+.02,len/2,yz],.045,wood);};
  mast(.2,1.1,5.3,[[3.75,3.1],[5.15,2.2]]);mast(2.75,1.1,4.5,[[3.4,2.5],[4.45,1.7]]);mast(-2,1.7,3.7,[[3.05,1.9]]);
  sail(.2,2.45,3.7,3,.55,true);sail(.2,3.85,5.1,2.1,.4,false);sail(2.75,2.2,3.35,2.6,.5,false);sail(2.75,3.5,4.4,1.75,.35,false);sail(-2,1.95,3,1.9,.38,false);
  G.cyl(.2,0,4.9,.3,.09,wood,8,tan);for(const a of [0,2,4,6])rod([.2+Math.cos(a)*.3,Math.sin(a)*.3,4.98],[.2+Math.cos(a)*.3,Math.sin(a)*.3,5.2],.015,wood);
  for(const [mx,mz] of [[.2,5.3],[2.75,4.5],[-2,3.7]]){const w1=wave(mx*3);G.tri([mx,0,mz+1.1],[mx-1.1+w1,.05,mz+.88],[mx-.05,0,mz+.74],col);G.tri([mx,0,mz],[mx,0,mz+1.1],[mx-.04,0,mz+.74],dark);}
  /* haubans et étais */
  for(const s of [1,-1]){for(const [mx,dx] of [[.2,-.5],[.2,.5],[2.75,-.3]])rod([mx,0,3.3],[mx+dx,s*(b3W(mx+dx)*.96),1.25],.014,rope);}
  rod([.2,0,5.2],[2.75,0,4.4],.012,rope);rod([-2,0,3.6],[.2,0,5.1],.012,rope);
  const bob=Math.sin(t*2.2+x)*.18;
  for(let i=i0*3;i<G.P.length;i+=3){G.P[i]*=sc;G.P[i+1]*=sc;G.P[i+2]=G.P[i+2]*sc+bob;}b3Xf(G,i0,ang,x,y,0);}

/* ---------- préparation d'une scène depuis un rapport de bataille ---------- */
function b3Start(r){
  const t=terrs[r.to],f=terrs[r.from],m=t&&W3.models.get(t.id);if(!t||!f||!m)return false;
  const ac=COLORS[r.att],dc=r.bs?'#8a1f1f':(r.def>=0?COLORS[r.def]:'#c8bfa0'),R=t.rad,seed=r.id*31+7;
  let dx=f.x-t.x,dy=f.y-t.y;const dl=Math.hypot(dx,dy)||1;dx/=dl;dy/=dl;
  const ang=Math.atan2(dy,dx),rcb=m.rc(ang),cnt=(a)=>Array.isArray(a)?a:[brCnt(a),0,0,0,0];
  const A0=brCnt(r.au),A1=brCnt(r.au2),D0=r.bs?1:brCnt(r.du),D1=r.bs?(r.bs.end==='kill'?0:1):brCnt(r.du2);
  const atk=b3Roster(cnt(r.au),seed),def=r.bs?[{kind:9}]:b3Roster(cnt(r.du),seed+99);
  if(!def.length&&!r.bs)for(let i=0;i<4;i++)def.push({kind:0});     /* île sans garnison : quelques habitants */
  const sa=Math.round(atk.length*(A0>0?A1/A0:0)),sd=r.bs?(D1>0?1:0):Math.round(def.length*(D0>0?D1/D0:0));
  const place=(list,surv,side)=>{const n=list.length,cols=Math.min(8,n);list.forEach((u,i)=>{u.side=side;u.lane=((i%cols)-(cols-1)/2)*2.7*(R/30);u.row=Math.floor(i/cols);u.ph=b3h(seed+i*13+side*5);u.fallT=Infinity;});
    /* les perdants tombent pendant l'affrontement ; les survivants sont tirés au sort */
    const idx=list.map((u,i)=>[b3h(seed+i*7+side*31),i]).sort((a,b)=>a[0]-b[0]).map(q=>q[1]),nf=n-surv;for(let q=0;q<nf;q++)list[idx[q]].fallT=5.1+(q+b3h(seed+q+side))/Math.max(1,nf)*3.2;};
  place(atk,sa,0);place(def,sd,1);
  const nsh=Math.max(1,Math.min(4,Math.ceil(atk.length/9))),ships=[];for(let i=0;i<nsh;i++)ships.push({off:(i-(nsh-1)/2)*13*(R/30)});
  atk.forEach((u,i)=>{u.sh=i%nsh;u.sl=Math.min(9,Math.floor(i/nsh));});            /* place sur le pont : navire et emplacement */
  const win=r.bs?r.bs.end==='kill':r.win,mine=brMine(r),good=brOutcome(r);
  B3.run={r,t,f,m,ac,dc,R,dx,dy,ang,rcb,atk,def,ships,A0,A1,D0,D1,win,good,mine,t0:performance.now(),seed,hpBar:r.bs?[r.bs.h0/r.bs.mx,r.bs.h1/r.bs.mx]:null,
    solo:MODE!=='client'&&players.filter(p=>p.human).length<=1,prev:speed,names:[players[r.att].name,r.bs?BOSSES[r.bs.i].n:(r.def>=0?players[r.def].name:'Habitants')],crewA:CREWS[players[r.att].crew||0].id};
  if(B3.run.solo)speed=0;
  document.body.classList.add('b3run');
  return true;
}
function b3End(){const R=B3.run;if(!R)return;B3.run=null;document.body.classList.remove('b3run');if(R.solo&&speed===0)speed=R.prev||1;dirty=true;
  try{brShow_o(R.r);}catch(_){}
  if(B3.q.length){const n=B3.q.shift();if(!b3Start(n))brShow_o(n);}}
const brShow_o=brShow;
brShow=function(r){
  if(!(B3.on&&W3.act&&!W3.fail&&started&&!over)){brShow_o(r);return;}
  if(B3.run){if(B3.q.length<3)B3.q.push(r);else brShow_o(r);return;}
  if(!b3Start(r))brShow_o(r);
};
/* passer la scène : clic, Espace, Entrée ou Échap (la scène ne laisse passer aucune commande de jeu) */
canvas.addEventListener('pointerdown',e=>{if(!B3.run)return;e.stopImmediatePropagation();e.preventDefault();if(performance.now()-B3.run.t0>600)b3End();},true);
canvas.addEventListener('pointerup',e=>{if(B3.run)e.stopImmediatePropagation();},true);
window.addEventListener('keydown',e=>{if(!B3.run)return;if(e.key===' '||e.key==='Enter'||e.key==='Escape'){e.stopImmediatePropagation();e.preventDefault();b3End();}},true);

/* ---------- caméra : plan large sur les navires, puis rapprochement, puis recul sur le vainqueur ---------- */
function b3Cam(now){
  const Rn=B3.run,tau=b3Tau(now),k=b3e(0,B3.DUR,tau),yaw0=Math.atan2(-Rn.dx,Rn.dy),yaw=yaw0+Math.sin(tau*.32)*.35+b3e(7,B3.DUR,tau)*.5;
  const D=Rn.R*(5.6-3.2*b3e(0,4.4,tau)+1.4*b3e(8,B3.DUR,tau)),pitch=.80-.22*b3e(0,4.4,tau)+.18*b3e(8,B3.DUR,tau);
  const cw=Rn.rcb*(.7-.2*b3e(1.2,4,tau)+.2*b3e(8,B3.DUR,tau)),cx=Rn.t.x+Rn.dx*cw,cy=Rn.t.y+Rn.dy*cw;
  return w3Cam(cx,cy,yaw,pitch,D);
}

/* ---------- la scène à l'instant tau ---------- */
function b3Scene(c,now){
  const Rn=B3.run,tau=b3Tau(now);if(tau>B3.DUR+.4){b3End();return;}
  const G=r3Geo(),FX=r3Geo(),t=Rn.t,m=Rn.m,H=(x,y)=>Math.max(0,m.H(x-t.x,y-t.y)),R=Rn.R,sc=5.2*(R/30);
  const bx=t.x+Rn.dx*Rn.rcb*.86,by=t.y+Rn.dy*Rn.rcb*.86;                   /* plage d'abordage */
  const px=-Rn.dy,py=Rn.dx;                                                   /* perpendiculaire à l'axe d'attaque */
  const clashD=Rn.rcb*.30;                                                    /* ligne de front : à 30 % du bord vers le centre */
  const cxl=t.x+Rn.dx*clashD,cyl=t.y+Rn.dy*clashD;
  const faceA=Math.atan2(-Rn.dy,-Rn.dx),faceD=Math.atan2(Rn.dy,Rn.dx);
  /* navires : arrivée du large (0 → 2 s), puis au mouillage */
  const ks=R/30*1.5;
  Rn.ships.forEach((s,i)=>{const k=b3e(0,2.2,tau),far=Rn.rcb*1.2+34,near=Rn.rcb*.99+4.4*ks+i%2*2,d=far+(near-far)*k,x=t.x+Rn.dx*d+px*s.off,y=t.y+Rn.dy*d+py*s.off;
    s.x=x;s.y=y;s.bob=Math.sin((now/1000+i)*2.2+x)*.18;
    b3Ship(G,x,y,faceA,r3c(Rn.ac),Rn.crewA,ks,now/1000+i);});
  /* attaquants */
  let fallenA=0,fallenD=0,sparks=0;
  const pos=(u,side)=>{
    const lane=u.lane,row=u.row;
    if(side===0){
      /* ils voyagent sur le pont de leur navire (on ne les voit jamais ailleurs), puis descendent à terre et rejoignent la ligne de front */
      const sh=Rn.ships[u.sh||0]||Rn.ships[0],sl=u.sl||0,du=(2.5-Math.floor(sl/2)*1.1)*ks,dw=(sl%2?.5:-.5)*ks,ca=Math.cos(faceA),sa=Math.sin(faceA);
      const x0=sh.x+ca*du-sa*dw,y0=sh.y+sa*du+ca*dw,k1=b3e(2.1+u.ph*.7,3.4+u.ph*.7,tau),k2=b3e(3.1,4.6,tau);
      const x1=bx+px*lane*.95,y1=by+py*lane*.95,x2=cxl-Rn.dx*(row*2.7+1.2)*(R/30)+px*lane,y2=cyl-Rn.dy*(row*2.7+1.2)*(R/30)+py*lane;
      let x=x0+(x1-x0)*k1,y=y0+(y1-y0)*k1;x=x+(x2-x)*k2;y=y+(y2-y)*k2;
      return [x,y,1.1*ks+(sh.bob||0),b3e(.25,.8,k1)];
    }
    const hx0=t.x+Rn.dx*(-.1*R)+px*lane*.8,hy0=t.y+Rn.dy*(-.1*R)+py*lane*.8,k=b3e(2.4,4.4,tau),x2=cxl+Rn.dx*(1.2+row*2.7)*(R/30)+px*lane,y2=cyl+Rn.dy*(1.2+row*2.7)*(R/30)+py*lane;
    return [hx0+(x2-hx0)*k,hy0+(y2-hy0)*k,0,1];
  };
  const drawSide=(list,side,col,face)=>{
    for(const u of list){
      const fall=tau<u.fallT?0:b3e(u.fallT,u.fallT+.55,tau),idle=side===0&&tau<2.1+u.ph*.7,anim=idle?0:tau*(tau<4.4?1:1.6)+u.ph*6;let [x,y,dZ,kz]=pos(u,side);
      /* mêlée : va-et-vient au contact */
      if(tau>4.4&&fall<1){const j=Math.sin(tau*5+u.ph*9)*.45*(R/30);x+=Rn.dx*j*(side===0?1:-1);y+=Rn.dy*j*(side===0?1:-1);}
      /* retraite du perdant à la fin */
      const z=H(x,y)*kz+dZ*(1-kz);
      if(u.kind===9){/* boss : silhouette géante */ continue;}
      if(fall>=.99)continue;
      const pxOn=typeof pxNew!=='undefined'&&pxNew(),pxFull=pxOn&&PXS.combat,pxLand=pxOn&&side===0&&tau<4.7;
      /* débarquement : les nouveaux personnages (jusqu'au contact, fondu 4,4 → 4,7 s) ; la mêlée garde les soldats d'origine */
      if(pxFull||pxLand)pxFight(u,side,x,y,z,face,tau,fall,pxFull&&tau>4.4,R,Rn,pxFull?1:1-b3e(4.4,4.7,tau),idle);
      if(!pxFull&&!(pxLand&&tau<4.4))b3Unit(G,x,y,z,face,col,u.kind,anim,fall,sc);
      if(tau>4.6&&fall===0&&b3h(Math.floor(tau*4)+u.ph*50+side)>.9){sparks++;FX.ico(x+Math.cos(face)*.7,y+Math.sin(face)*.7,z+1.1*sc,.22*sc,1,r3c('#fff1a8'),null,0);}
      if(tau>=u.fallT&&tau<u.fallT+1.4)FX.ico(x,y,z+.8*sc+(tau-u.fallT)*.9,(.35+(tau-u.fallT)*.5)*sc,.8,[.78,.78,.8,1],null,0);
    }
    return list.filter(u=>tau>=u.fallT).length;
  };
  fallenA=drawSide(Rn.atk,0,r3c(Rn.ac),faceA);
  /* défenseurs : soldats ou boss */
  if(Rn.r.bs){const hp=Rn.hpBar,kk=b3e(0,B3.DUR*.8,tau),z=H(t.x,t.y),big=R/30*3.2,sw=Math.sin(tau*3.4)*.4,dead=Rn.win&&tau>7.2,fk=dead?b3e(7.2,8.4,tau):0;
    const bc=r3c('#8a1f1f'),cx0=t.x+Rn.dx*R*.05,cy0=t.y+Rn.dy*R*.05;
    G.cyl(cx0,cy0,z+(1-fk)*.01,1.5*big*(1-fk*.2),(4.2-fk*3.4)*big,bc,10);G.ico(cx0,cy0,z+(4.6-fk*3.6)*big,1.15*big,1,r3c('#a62828'),null,0);
    for(const sd of [-1,1]){const ax=cx0+px*sd*1.9*big,ay=cy0+py*sd*1.9*big;G.cyl(ax,ay,z+(2.4-fk*2)*big,.5*big,(2.2-fk*1.6)*big,bc,7);G.ico(ax-Rn.dx*(1+sw*.8*sd)*big*.8,ay-Rn.dy*(1+sw*.8*sd)*big*.8,z+(1.8-fk*1.5)*big,.6*big,1,r3c('#2e1a1a'),null,0);}
    for(const sd of [-1,1])G.cone(cx0+px*sd*.7*big,cy0+py*sd*.7*big,z+(5.4-fk*4.2)*big,.28*big,1.2*big*(1-fk),r3c('#efe2c2'),5);
    fallenD=dead?1:0;}
  else fallenD=drawSide(Rn.def,1,r3c(Rn.dc),faceD);
  /* tirs : flèches des tireurs et boulets des canons, de la ligne de front vers l'adversaire */
  if(tau>3.2&&tau<8.4)for(let i=0;i<7;i++){const ph=((tau*1.1+i*.37)%1),sd=i%2,from=sd?[cxl+Rn.dx*3,cyl+Rn.dy*3]:[cxl-Rn.dx*4,cyl-Rn.dy*4],to=sd?[cxl-Rn.dx*2.5,cyl-Rn.dy*2.5]:[cxl+Rn.dx*2.5,cyl+Rn.dy*2.5];
    const ax=from[0]+(to[0]-from[0])*ph+px*(i-3)*1.1*(R/30),ay=from[1]+(to[1]-from[1])*ph+py*(i-3)*1.1*(R/30),az=H(ax,ay)+1.1*sc+Math.sin(ph*Math.PI)*3.6*(R/30);
    FX.ico(ax,ay,az,.16*sc,1,i%3===0?r3c('#2a2a2e'):r3c('#f1e6c4'),null,0);}
  /* poussière du débarquement */
  if(tau>2.2&&tau<4)for(let i=0;i<6;i++){const k=(tau-2.2)/1.8,a=i/6*6.28;FX.ico(bx+px*(i-2.5)*2.4*(R/30)+Math.cos(a)*k,by+py*(i-2.5)*2.4*(R/30)+Math.sin(a)*k,H(bx,by)+.3+k*.7,(.18+k*.42)*(R/30)*1.1,.7,[.86,.8,.68,1],null,0);}   /* petits nuages de sable au débarquement */
  /* fortin : onde de choc sur la ligne de front quand elle s'écroule */
  if(Rn.r.wall&&tau>4.4&&tau<8.2){const k=(tau*2)%1;FX.ico(t.x+Rn.dx*clashD*.5,t.y+Rn.dy*clashD*.5,H(t.x,t.y)+1.2+k*1.5,(.4+k*.7)*sc,.8,[1,.85,.5,1],null,0);}
  /* drapeau du vainqueur sur l'île (se déploie en fin de scène) */
  if(tau>7.2){const k=b3e(7.2,8.6,tau),wc=Rn.win?r3c(Rn.ac):r3c(Rn.dc),z=H(t.x,t.y)+(m.top||6)*.5;w3Banner(G,t.x,t.y,z+3.2*k*(R/30)+1.2,wc,Rn.win?Rn.crewA:'',2.2*(R/30)*k);}
  Rn.fall=[fallenA,fallenD];
  w3DrawArr(c,w3Shade(G),false);
  w3DrawArr(c,w3Shade(FX,1.15),false);
}

/* ---------- interface de la scène : titre, forces en présence, résultat ---------- */
function b3Hud(now){
  const Rn=B3.run;if(!Rn)return;const dpr=canvas.width/ui.cssW,tau=b3Tau(now),cw=canvas.width,ch=canvas.height,s=dpr*Math.min(1.25,Math.max(.8,ui.cssW/900));
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cw,ch);ctx.textAlign='center';ctx.textBaseline='middle';
  /* bandes de cinéma et vignette */
  const g=ctx.createLinearGradient(0,0,0,ch);g.addColorStop(0,'rgba(2,10,22,.55)');g.addColorStop(.18,'rgba(2,10,22,0)');g.addColorStop(.8,'rgba(2,10,22,0)');g.addColorStop(1,'rgba(2,10,22,.6)');ctx.fillStyle=g;ctx.fillRect(0,0,cw,ch);
  const fade=b3e(0,.5,tau)*(1-b3e(B3.DUR-.3,B3.DUR+.3,tau)),L=brLosses(Rn.r);
  ctx.globalAlpha=fade;
  /* titre */
  ctx.font='800 '+(19*s)+'px "Big Shoulders Display",Inter,sans-serif';try{ctx.letterSpacing=(2*s)+'px';}catch(_){}
  ctx.lineWidth=5*s;ctx.strokeStyle='rgba(4,10,20,.9)';ctx.fillStyle='#fff';const tt='⚔  '+Rn.f.name.toUpperCase()+'  ▸  '+Rn.t.name.toUpperCase();ctx.strokeText(tt,cw/2,34*s);ctx.fillText(tt,cw/2,34*s);try{ctx.letterSpacing='0px';}catch(_){}
  /* forces : effectifs qui diminuent à mesure que les soldats tombent */
  const na=Rn.atk.length||1,nd=Rn.def.length||1,fa=Math.min(1,(Rn.fall?Rn.fall[0]:0)/Math.max(1,na-Math.round(na*(Rn.A0>0?Rn.A1/Rn.A0:0)))),fd=Rn.r.bs?(Rn.win&&tau>7.2?1:0):Math.min(1,(Rn.fall?Rn.fall[1]:0)/Math.max(1,nd-Math.round(nd*(Rn.D0>0?Rn.D1/Rn.D0:0))));
  const cur=(a0,a1,f)=>Math.round(a0-(a0-a1)*(isFinite(f)?f:1));
  const box=(x,name,col,n0,n1,f,right,hp)=>{const w=190*s,h=58*s,X=right?x-w:x;ctx.fillStyle='rgba(6,12,22,.82)';ctx.strokeStyle=col;ctx.lineWidth=2.4*s;rr(X,64*s,w,h,10*s);ctx.fill();ctx.stroke();
    ctx.textAlign=right?'right':'left';const tx=right?X+w-12*s:X+12*s;ctx.fillStyle=col;ctx.font='800 '+(12.5*s)+'px Inter,system-ui,sans-serif';ctx.fillText(name.length>20?name.slice(0,19)+'…':name,tx,64*s+17*s);
    ctx.fillStyle='#fff';ctx.font='800 '+(22*s)+'px Inter,system-ui,sans-serif';ctx.fillText(hp?'PV '+Math.round(hp[0]*100)+' %':String(cur(n0,n1,f)),tx,64*s+41*s);ctx.textAlign='center';
    if(hp){const cp=hp[0]+(hp[1]-hp[0])*f;ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(X+10*s,64*s+h-9*s,w-20*s,4*s);ctx.fillStyle='#ff4d4d';ctx.fillRect(X+10*s,64*s+h-9*s,(w-20*s)*Math.max(0,cp),4*s);}};
  box(14*s,Rn.names[0],Rn.ac,Rn.A0,Rn.A1,fa,false);
  box(cw-74*s,Rn.names[1],Rn.dc,Rn.D0,Rn.D1,fd,true,Rn.hpBar&&[Rn.hpBar[0]-(Rn.hpBar[0]-Rn.hpBar[1])*fd,Rn.hpBar[1]]);
  /* résultat */
  const rk=b3e(7,8,tau);if(rk>0){const v=Rn.r.bs?(Rn.r.bs.end==='kill'?'BOSS VAINCU':Rn.r.bs.end==='dead'?'ANÉANTIE':'REPLI'):(Rn.good?'VICTOIRE':(Rn.mine==='att'?'REPOUSSÉ':'DÉFAITE')),col=Rn.good?'#f2c75c':'#ff8a70';
    ctx.globalAlpha=fade*rk;ctx.font='800 '+(54*s*(.9+.1*rk))+'px "Big Shoulders Display",Inter,sans-serif';try{ctx.letterSpacing=(6*s)+'px';}catch(_){}ctx.lineWidth=9*s;ctx.strokeStyle='rgba(4,10,20,.92)';ctx.fillStyle=col;ctx.strokeText(v,cw/2,ch*.78);ctx.fillText(v,cw/2,ch*.78);try{ctx.letterSpacing='0px';}catch(_){}
    ctx.font='700 '+(15*s)+'px Inter,system-ui,sans-serif';ctx.lineWidth=4*s;ctx.fillStyle='#fff';const ln='Vos troupes : '+Math.round(L.m0)+' → '+Math.round(L.m1)+'   ·   adversaire : '+(Rn.r.bs?'PV ':'≈ ')+Math.round(L.e0)+' → '+Math.round(L.e1);ctx.strokeText(ln,cw/2,ch*.78+38*s);ctx.fillText(ln,cw/2,ch*.78+38*s);}
  ctx.globalAlpha=fade*.8;ctx.font='600 '+(12*s)+'px Inter,system-ui,sans-serif';ctx.fillStyle='rgba(255,255,255,.85)';ctx.fillText('Clic ou Espace : passer la scène',cw/2,62*s);ctx.globalAlpha=1;
}
/* interrupteur : la scène de combat peut être coupée sans quitter le monde 3D */
window.addEventListener('keydown',e=>{if(e.shiftKey&&(e.key==='B'||e.key==='b')&&!/INPUT|TEXTAREA|SELECT/.test((e.target||{}).tagName||'')){b3Toggle();}});
function b3Toggle(){B3.on=!B3.on;try{localStorage.setItem('rk-b3',B3.on?'1':'0');}catch(_){}toast(B3.on?'Scènes de combat 3D activées.':'Scènes de combat 3D désactivées.');}
