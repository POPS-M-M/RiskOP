/* ================= PERSONNAGES 3D (version test, PROTOTYPE) : modèle de petit personnage stylisé, poses et tenues =================
   Apparence uniquement : aucune statistique, aucun effectif, aucune règle n'est lue pour être modifiée.
   - Direction artistique : tête ≈ 1/3 de la hauteur, corps compact, grands yeux, sourcils, bouche, tenue par faction, accessoires.
   - Toutes les formes sont des volumes calculés par code (pas de fichier externe). Le modèle est construit dans un repère local :
     pieds à l'origine, avant = +x, gauche = +y, haut = +z ; hauteur ≈ 1,1. Alpha de sommet 0,5 = zone teintée à la couleur du joueur.
   - Un modèle + une pose + un numéro d'image = un maillage mis en cache ; les copies sont dessinées par instanciation (65-persos-rendu.js). */
const PXH=3.0,PXM=1.1;                                   /* hauteur d'un soldat dans le monde (pour une île de rayon 30) / hauteur du modèle */
const pxc=(h,a)=>{const c=r3c(h);c[3]=a===undefined?1:a;return c;};
const pxAcc=h=>pxc(h,.5);
const PX_SKIN=['#f6cfa4','#e8b585','#c98c5e','#94603e','#f1c2a2','#7a4c32'],PX_HAIR=['#2b2220','#6b4328','#c8903c','#d9d2c2','#8a2f24','#2f4468','#1c1c24','#b0653a'];
const pxHash=s=>{let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0);};
const pxRnd=seed=>{let a=seed>>>0||1;return ()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};};

/* tenues de faction (couleurs de base ; la couleur du joueur teinte les parties « accent ») */
const PXF={
  marine:{top:'#35538c',trim:'#f4f1e6',pants:'#ece8dc',boots:'#1f232d',cap:'#2c4778',name:'marine'},
  pirate:{top:'#f2ead6',trim:'#c8443a',pants:'#4d3d33',boots:'#5b4130',cap:'#c8443a',name:'pirate'},
  revo:{top:'#416c4b',trim:'#e2d8b2',pants:'#2f3a33',boots:'#3a2c24',cap:'#2f5a3c',name:'revo'},
  native:{top:'#b08a54',trim:'#e8dcc0',pants:'#5a4630',boots:'#3a2c20',cap:'#8a6a40',name:'native'},
  chasseur:{top:'#6e4b2f',trim:'#cba962',pants:'#3a3028',boots:'#2a2018',cap:'#8a6a40',name:'chasseur'}
};

/* ---------- géométrie : volumes à normales lisses, sans culling ---------- */
function pxGeo(){
  const P=[],N=[],C=[],nrm=a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return [a[0]/l,a[1]/l,a[2]/l];};
  const V=(p,n,c)=>{P.push(p[0],p[1],p[2]);N.push(n[0],n[1],n[2]);C.push(c[0],c[1],c[2],c[3]);};
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const G={P,N,C,V,nrm,cross,
    tri(a,b,c,col,n){if(!n)n=nrm(cross([b[0]-a[0],b[1]-a[1],b[2]-a[2]],[c[0]-a[0],c[1]-a[1],c[2]-a[2]]));V(a,n,col);V(b,n,col);V(c,n,col);},
    quad2(a,b,c,d,col){G.tri(a,b,c,col);G.tri(a,c,d,col);G.tri(a,c,b,col);G.tri(a,d,c,col);},
    ell(c,r,col,nu,nv,B){nu=nu||10;nv=nv||6;const ax=B?B[0]:[1,0,0],ay=B?B[1]:[0,1,0],az=B?B[2]:[0,0,1];
      const pt=(i,j)=>{const th=i/nu*6.2832,ph=-1.5708+j/nv*3.1416,cx=Math.cos(ph)*Math.cos(th),cy=Math.cos(ph)*Math.sin(th),cz=Math.sin(ph),x=cx*r[0],y=cy*r[1],z=cz*r[2],a=cx/r[0],b=cy/r[1],d=cz/r[2];
        return [[c[0]+ax[0]*x+ay[0]*y+az[0]*z,c[1]+ax[1]*x+ay[1]*y+az[1]*z,c[2]+ax[2]*x+ay[2]*y+az[2]*z],nrm([ax[0]*a+ay[0]*b+az[0]*d,ax[1]*a+ay[1]*b+az[1]*d,ax[2]*a+ay[2]*b+az[2]*d])];};
      for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const A=pt(i,j),B2=pt(i+1,j),C2=pt(i+1,j+1),D=pt(i,j+1);
        if(j>0){V(A[0],A[1],col);V(B2[0],B2[1],col);V(C2[0],C2[1],col);}
        if(j<nv-1){V(A[0],A[1],col);V(C2[0],C2[1],col);V(D[0],D[1],col);}}},
    tube(a,b,r0,r1,col,n,cap){n=n||6;const d=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],dn=nrm(d),h=Math.abs(dn[2])<.9?[0,0,1]:[1,0,0],u=nrm(cross(dn,h)),v=nrm(cross(dn,u));
      const ring=(i,p,r)=>{const t=i/n*6.2832,cs=Math.cos(t),sn=Math.sin(t);return [[p[0]+(u[0]*cs+v[0]*sn)*r,p[1]+(u[1]*cs+v[1]*sn)*r,p[2]+(u[2]*cs+v[2]*sn)*r],[u[0]*cs+v[0]*sn,u[1]*cs+v[1]*sn,u[2]*cs+v[2]*sn]];};
      for(let i=0;i<n;i++){const A=ring(i,a,r0),B=ring(i+1,a,r0),C2=ring(i+1,b,r1),D=ring(i,b,r1);V(A[0],A[1],col);V(B[0],B[1],col);V(C2[0],C2[1],col);V(A[0],A[1],col);V(C2[0],C2[1],col);V(D[0],D[1],col);
        if(cap){V(b,dn,col);V(C2[0],dn,col);V(D[0],dn,col);}}},
    cone(base,tip,r,col,n){G.tube(base,tip,r,0,col,n||7);},
    box(c,h,col,B){const ax=B?B[0]:[1,0,0],ay=B?B[1]:[0,1,0],az=B?B[2]:[0,0,1],P2=(x,y,z)=>[c[0]+ax[0]*x*h[0]+ay[0]*y*h[1]+az[0]*z*h[2],c[1]+ax[1]*x*h[0]+ay[1]*y*h[1]+az[1]*z*h[2],c[2]+ax[2]*x*h[0]+ay[2]*y*h[1]+az[2]*z*h[2]];
      const F=(p,q,r,s,n)=>{V(p,n,col);V(q,n,col);V(r,n,col);V(p,n,col);V(r,n,col);V(s,n,col);};
      F(P2(1,-1,-1),P2(1,1,-1),P2(1,1,1),P2(1,-1,1),ax);F(P2(-1,-1,-1),P2(-1,-1,1),P2(-1,1,1),P2(-1,1,-1),ax.map(q=>-q));
      F(P2(-1,1,-1),P2(-1,1,1),P2(1,1,1),P2(1,1,-1),ay);F(P2(-1,-1,-1),P2(1,-1,-1),P2(1,-1,1),P2(-1,-1,1),ay.map(q=>-q));
      F(P2(-1,-1,1),P2(1,-1,1),P2(1,1,1),P2(-1,1,1),az);F(P2(-1,-1,-1),P2(-1,1,-1),P2(1,1,-1),P2(1,-1,-1),az.map(q=>-q));}
  };
  return G;
}
/* matrices 3×3 (colonnes = axes locaux) */
const pxRz=a=>{const c=Math.cos(a),s=Math.sin(a);return [[c,s,0],[-s,c,0],[0,0,1]];};
const pxRy=a=>{const c=Math.cos(a),s=Math.sin(a);return [[c,0,-s],[0,1,0],[s,0,c]];};    /* a>0 : le haut bascule vers l'avant */
const pxMul=(A,B)=>[0,1,2].map(j=>[0,1,2].map(i=>A[0][i]*B[j][0]+A[1][i]*B[j][1]+A[2][i]*B[j][2]));
const pxMv=(M,v)=>[M[0][0]*v[0]+M[1][0]*v[1]+M[2][0]*v[2],M[0][1]*v[0]+M[1][1]*v[1]+M[2][1]*v[2],M[0][2]*v[0]+M[1][2]*v[1]+M[2][2]*v[2]];
const pxId=[[1,0,0],[0,1,0],[0,0,1]];
const pxAdd=(a,b,k)=>[a[0]+b[0]*(k===undefined?1:k),a[1]+b[1]*(k===undefined?1:k),a[2]+b[2]*(k===undefined?1:k)];

/* ---------- poses : une pose = angles d'articulations à un instant (t en secondes, boucle) ---------- */
/* bras : [balancement avant, écart latéral, flexion du coude] ; jambe : [hanche, genou] */
function pxPose(anim,t,kind,post){
  const P={lean:.06,bob:0,twist:0,hy:0,hp:0,aL:[.1,.14,.3],aR:[.35,.12,.7],lL:[0,0],lR:[0,0],mouth:0,brow:0,eye:0,fwd:0,lift:0,tilt:0,w:0,draw:0,arm:0};
  const TAU=6.2832;
  if(anim==='walk'||anim==='run'){const f=anim==='run'?1.7:1.15,ph=t*TAU*f,s=Math.sin(ph),c=Math.cos(ph),a=anim==='run'?1:.62;
    P.lL=[a*s,Math.max(0,.95*c)*a+.05];P.lR=[-a*s,Math.max(0,-.95*c)*a+.05];P.bob=(anim==='run'?.04:.022)*Math.abs(Math.sin(ph));P.lean=anim==='run'?.22:.1;
    P.aL=[-.62*s*a,.12,.3+Math.max(0,s)*.4];P.aR=[.3-(kind===1||kind===2?0:.5*s*a),.1,.7];P.twist=.12*s;P.hy=-.08*s;P.mouth=anim==='run'?.4:0;P.w=.2;
    if(kind===1)P.aR=[.5,.05,.8];}
  else if(anim==='idle'){const b=Math.sin(t*TAU*.45+post*1.7),h=Math.sin(t*TAU*.12+post*3);P.bob=.008*b;P.aL=[.1+.05*b,.16,.3];P.aR=[.4+.05*b,.1,.8];P.hy=.35*h;P.hp=.05*b;P.lean=.03;P.w=.1;
    const bl=(t*.37+post*.173)%1;P.eye=bl<.04?1:0;}
  else if(anim==='attack'){const u=(t*1.35)%1;let sw,st=0;if(u<.38)sw=-.2-2.1*(u/.38);else if(u<.58){const k=(u-.38)/.2;sw=-2.3+3.4*k;st=Math.sin(k*3.1416);}else sw=1.1-1.3*((u-.58)/.42);
    P.aR=[sw,.15,.55];P.aL=[-.5+(sw>0?.3:0),.3,.9];P.lL=[.72,.55];P.lR=[-.5,.12];P.fwd=.07+.1*st;P.lean=.2+.2*st;P.twist=-.25+.5*(sw>-1?1:0);P.mouth=1;P.brow=-1;P.hp=.1;P.w=sw;P.arm=1;
    if(kind===1){P.aR=[1.2-1.5*Math.max(0,Math.sin(u*TAU)),.08,.4+1.1*Math.max(0,Math.sin(u*TAU))];P.w=.2;}
    if(kind===2){P.draw=u<.7?u/.7:Math.max(0,1-(u-.7)/.1);P.aL=[1.55,.03,.05];P.aR=[1.3,-.05,2.0*P.draw+.1];P.lean=.05;P.brow=-.6;P.fwd=0;}}
  else if(anim==='hit'){const u=Math.min(1,t*2);P.lean=-.35*(1-u*.4);P.aL=[.5,.8,.4];P.aR=[.6,.8,.6];P.fwd=-.08;P.mouth=1;P.eye=.7;P.brow=1;P.hp=-.25;P.lL=[-.3,.1];P.lR=[.4,.5];}
  else if(anim==='fall'){const u=Math.max(0,Math.min(1,t));P.tilt=-1.42*u*u*(3-2*u);P.lean=-.2*u;P.aL=[.3,.9,.2];P.aR=[.5,.9,.3];P.eye=1;P.mouth=.5;P.lL=[.35,.2];P.lR=[-.2,.3];}
  else if(anim==='cheer'){const ph=t*TAU*1.4,j=Math.abs(Math.sin(ph));P.lift=.13*j;P.aL=[2.75,.45,.25];P.aR=[2.75,.45,.25];P.mouth=1;P.eye=.6;P.brow=.5;P.lean=-.05;P.lL=[.2*j,.3*j];P.lR=[.2*j,.3*j];}
  else if(anim==='cmd'){const b=Math.sin(t*TAU*.4+1);P.bob=.008*b;P.hy=.25*Math.sin(t*TAU*.1);P.eye=((t*.31)%1)<.04?1:0;P.w=.1;
    switch(post&3){
      case 0:P.aR=[2.1,.35,1.1];P.aL=[.1,.7,1.7];P.w=1.4;P.lean=.0;P.hp=.06;break;                      /* arme sur l'épaule, main à la hanche */
      case 1:P.aL=[.95,-.45,1.9];P.aR=[.95,-.5,1.9];P.lean=-.04;P.hp=.08;P.brow=-.3;P.w=0;break;        /* bras croisés */
      case 2:P.aR=[1.5,.05,.1];P.aL=[.1,.75,1.7];P.lean=.08;P.w=.7;P.mouth=.2;break;                    /* pointe devant lui */
      default:P.aR=[.25,.18,.35];P.aL=[.12,.15,.4];P.lean=-.02;P.w=0;P.hy=.4*Math.sin(t*TAU*.15);}}
  return P;
}
/* cycle de l'animation : nombre d'images et durée ; chaque image est un maillage distinct mis en cache */
const PX_ANIM={walk:{n:8,d:.87,loop:1},run:{n:8,d:.59,loop:1},idle:{n:6,d:3.2,loop:1},attack:{n:8,d:.74,loop:1},hit:{n:4,d:.5,loop:0},fall:{n:6,d:1,loop:0},cheer:{n:6,d:.72,loop:1},cmd:{n:6,d:3.4,loop:1}};

/* ---------- le personnage ---------- */
/* spec : {fac, kind (0 sabre,1 lance,2 tir,3 cavalier,4 catapulte), v (variante 0/1), cm (commandant : objet d'apparence) } */
function pxBuild(spec,anim,frame){
  const AN=PX_ANIM[anim]||PX_ANIM.idle,t=frame/AN.n*AN.d*(AN.loop?1:1)+(AN.loop?0:0),tt=AN.loop?t:Math.min(1,frame/(AN.n-1))*AN.d;
  const cm=spec.cm||null,F=PXF[spec.fac]||PXF.pirate,kind=spec.kind,sd=cm?cm.seed:(spec.v*37+kind*11+F.name.length*5);
  const rd=pxRnd(sd*7919+13),post=cm?cm.post:(spec.v+kind);
  const pose=pxPose(anim==='cmd'&&!cm?'idle':anim,anim==='fall'||anim==='hit'?(anim==='fall'?frame/(AN.n-1):tt):t,kind,post);
  const g=pxGeo(),sk=pxc(cm?cm.skin:PX_SKIN[spec.v===2?1:spec.v?2:(spec.fac==='chasseur'?4:0)]),hairC=pxc(cm?cm.hair:PX_HAIR[spec.v===2?(spec.fac==='marine'?5:7):spec.v?(spec.fac==='pirate'?4:1):(spec.fac==='revo'?2:0)]);
  const wd=cm?cm.w:1,ht=cm?cm.h:1;                                               /* morphologie : largeur / hauteur */
  const top=pxc(cm&&cm.top?cm.top:F.top),trim=pxc(cm&&cm.trim?cm.trim:F.trim),pants=pxc(F.pants),boots=pxc(F.boots),acc=pxAcc('#ffffff'),dark=pxc('#2a2224'),steel=pxc('#d6dde6'),wood=pxc('#7a5634'),leather=pxc('#6a4a2c');
  /* ----- montures et machines ----- */
  let z0=0,mountDz=0;
  if(kind===3){mountDz=.34;pxMount(g,pose,t,cm&&cm.mount?cm.mount:(spec.v?'#d9d3c4':'#8a5a3a'),acc);}
  if(kind===4){pxCatapult(g,anim,t,wood,acc);}
  const lift=pose.lift,hipZ=(.30+lift+mountDz)*ht,Zs=ht;
  const Ru=pxMul(pxRy(pose.lean),pxRz(pose.twist)),hip=[pose.fwd,0,hipZ];
  const U=p=>pxAdd(hip,pxMv(Ru,[p[0]*wd,p[1]*wd,p[2]*Zs]));
  /* ----- jambes ----- */
  const legs=kind===3?[[.95,1.4],[.95,1.4]]:null;
  for(const sg of [1,-1]){const L=legs?legs[0]:(sg>0?pose.lL:pose.lR),h=kind===3?1.0:L[0],k=kind===3?1.3:L[1],hp0=[pose.fwd+(kind===3?.02:0),.085*sg*wd,hipZ-.02*ht],th=.13*ht,sh=.13*ht;
    const kn=[hp0[0]+Math.sin(h)*th,hp0[1]+(kind===3?.1*sg:0),hp0[2]-Math.cos(h)*th],an=[kn[0]+Math.sin(h-k)*sh,kn[1],Math.max(.05,kn[2]-Math.cos(h-k)*sh)];
    if(F.name==='revo'||F.name==='pirate'){g.tube(hp0,kn,.056*wd,.05*wd,pants,6);g.tube(kn,an,.05*wd,.042*wd,F.name==='pirate'?trim:pants,6);}
    else{g.tube(hp0,kn,.056*wd,.05*wd,pants,6);g.tube(kn,an,.05*wd,.044*wd,pants,6);}
    g.ell([an[0]+.035,an[1],an[2]-.02],[.1,.062,.052],boots,8,5);
    if(F.name==='chasseur'||F.name==='marine')g.tube([an[0],an[1],an[2]+.07],[an[0],an[1],an[2]-.01],.058*wd,.052*wd,boots,6);}
  /* ----- bassin, ceinture, torse ----- */
  g.ell(U([0,0,.01]),[.115*wd,.135*wd,.075],pants,10,5);
  g.ell(U([0,0,.075]),[.124*wd,.145*wd,.026],F.name==='pirate'?acc:leather,10,4);
  if(F.name==='pirate'){/* écharpe-ceinture et deux pans */const kx=U([.1,-.11,.06]);g.quad2(kx,pxAdd(kx,[.03,-.04,-.14]),pxAdd(kx,[.07,-.02,-.15]),pxAdd(kx,[.07,.02,-.02]),acc);g.quad2(kx,pxAdd(kx,[.0,-.02,-.12]),pxAdd(kx,[-.04,-.05,-.13]),pxAdd(kx,[-.04,-.03,-.02]),acc);}
  const body=cm&&cm.body||0;
  g.ell(U([0,0,.17]),[.118*wd,.145*wd,.165],top,10,6,[pxMv(Ru,[1,0,0]),pxMv(Ru,[0,1,0]),pxMv(Ru,[0,0,1])]);
  if(F.name==='pirate'){for(let b=0;b<4;b++){const z=.09+b*.07;g.ell(U([.002,0,z]),[.123*wd,.148*wd,.017],b%2?pxc(F.trim):pxc('#ffffff'),10,3,[pxMv(Ru,[1,0,0]),pxMv(Ru,[0,1,0]),pxMv(Ru,[0,0,1])]);}}
  if(F.name==='marine'){g.ell(U([.0,0,.3]),[.13*wd,.16*wd,.034],trim,10,3);g.box(U([.118*wd,0,.16]),[.008,.02,.11],trim);g.ell(U([.115*wd,0,.26]),[.02,.03,.02],pxc('#e0b04a'),6,4);for(const sg of [1,-1])g.ell(U([0,.15*sg*wd,.31]),[.055,.045,.025],acc,6,4);}
  if(F.name==='revo'){/* cape à capuche et sangles */for(const sg of [1,-1])g.tube(U([.06,.1*sg,.34]),U([-.1,.12*sg,.0]),.03,.05,pxc('#34563c'),5);
    const a=U([-.1,-.15*wd,.32]),b=U([-.1,.15*wd,.32]),c2=U([-.2,.19*wd,-.05]),d=U([-.2,-.19*wd,-.05]);g.quad2(a,b,c2,d,pxc('#3a6044'));
    g.ell(U([0,0,.29]),[.13*wd,.16*wd,.038],acc,10,3);g.tube(U([.1,-.13,.31]),U([.12,.12,.1]),.016,.016,leather,5);}
  if(F.name==='chasseur'){/* long manteau évasé, cartouchière */const a=U([.1,-.14*wd,.02]),b=U([.1,.14*wd,.02]),c2=U([.16,.2*wd,-.13]),d=U([.16,-.2*wd,-.13]),e=U([-.1,-.14*wd,.02]),f=U([-.1,.14*wd,.02]),g2=U([-.17,.2*wd,-.13]),h=U([-.17,-.2*wd,-.13]);
    g.quad2(a,b,c2,d,top);g.quad2(e,f,g2,h,top);g.quad2(a,d,h,e,top);g.quad2(b,f,g2,c2,top);
    g.tube(U([.1,-.14,.31]),U([.1,.13,.04]),.02,.02,leather,5);for(let i=0;i<3;i++)g.ell(U([.125,-.05+i*.06,.22-i*.05]),[.016,.02,.025],pxc('#c9a860'),5,3);g.ell(U([0,0,.3]),[.125*wd,.152*wd,.032],acc,10,3);}
  /* ----- cou, tête ----- */
  const Hc=U([.012,0,.40]),Rh=pxMul(Ru,pxMul(pxRz(pose.hy),pxRy(pose.hp))),Bh=[pxMv(Rh,[1,0,0]),pxMv(Rh,[0,1,0]),pxMv(Rh,[0,0,1])];
  const hs=cm&&cm.hs!==undefined?cm.hs:(spec.v===2?4:spec.v?1:0),HR=[.166,.172,.17],hp=(x,y,z)=>pxAdd(Hc,pxMv(Rh,[x,y,z]));
  g.ell(pxAdd(Hc,[0,0,-.07]),[.06,.06,.06],sk,6,4);
  g.ell(Hc,HR,sk,12,8,Bh);
  /* visage : grands yeux, reflets, sourcils, nez, bouche, joues, oreilles */
  const eyeOpen=1-pose.eye*.75;
  for(const sg of [1,-1]){const ex=.158,ey=.066*sg,ez=.012;
    if(pose.eye>.8){g.tube(hp(ex,ey-.025,ez-.005),hp(ex+.004,ey,ez+.014),.007,.007,dark,4);g.tube(hp(ex+.004,ey,ez+.014),hp(ex,ey+.025,ez-.005),.007,.007,dark,4);}
    else if(cm&&cm.eyes==='narrow'){g.ell(hp(ex,ey,ez),[.012,.034,.018*eyeOpen+.004],dark,6,4,Bh);}
    else{g.ell(hp(ex,ey,ez),[.013,.03,.045*eyeOpen+.004],dark,8,5,Bh);if(eyeOpen>.5)g.ell(hp(ex+.011,ey+.008*sg*-1,ez+.02),[.006,.011,.014],pxc('#ffffff'),5,3,Bh);}
    {const bz=.078,ai=pose.brow;g.tube(hp(.155,.03*sg,bz+.02*ai),hp(.15,.105*sg,bz-.012*ai),.007,.007,hairC,4);}
    g.ell(hp(.15,.108*sg,-.045),[.012,.03,.02],pxc('#f08a7a',.9),5,3,Bh);
    g.ell(hp(0,.168*sg,-.004),[.018,.01,.03],sk,5,3,Bh);}
  g.ell(hp(.17,0,-.022),[.018,.016,.014],pxc('#d9987a'),5,3,Bh);
  if(pose.mouth>.25){g.ell(hp(.16,0,-.08),[.01,.026,.012+.022*pose.mouth],pxc('#5a1e22'),6,4,Bh);}
  else g.tube(hp(.164,-.03,-.074),hp(.164,.03,-.074),.005,.005,pxc('#7a3a32'),4);
  /* ----- coiffure ou coiffe ----- */
  pxHead(g,{hp,Hc,Bh,HR,hs,hairC,F,cm,spec,acc,trim,dark,steel,sk,leather,rd});
  /* ----- bras ----- */
  const arm=(sg,A,hold)=>{const sh=U([0,.155*sg,.285]),th=A[0],ph=A[1]*sg,ul=.125*ht,fl=.115*ht;
    const dir=(a,p)=>[Math.sin(a)*Math.cos(p),Math.sin(p),-Math.cos(a)*Math.cos(p)];
    const d1=pxMv(Ru,dir(th,ph)),el=pxAdd(sh,d1,ul),d2=pxMv(Ru,dir(th+A[2],ph)),ha=pxAdd(el,d2,fl);
    const sleeve=F.name==='pirate'?pxc('#f6efdc'):(F.name==='marine'?pxc('#f6f3ea'):top);
    g.ell(sh,[.052,.05,.05],F.name==='marine'?top:sleeve,6,4);g.tube(sh,el,.04*wd,.036*wd,sleeve,6);g.tube(el,ha,.036*wd,.03,(F.name==='revo'||F.name==='chasseur'||F.name==='marine')?pxc(F.name==='marine'?'#2c4778':top):sk,6);
    if(F.name==='marine'||F.name==='revo'||F.name==='chasseur'){g.tube(el,pxAdd(el,d2,fl*.55),.037*wd,.036*wd,F.name==='marine'?trim:pxc(F.name==='chasseur'?'#8a6a40':'#34563c'),6);}
    g.ell(ha,[.044,.042,.044],sk,6,4);return {sh,el,ha,d2,tot:th+A[2]};};
  const aR=arm(-1,pose.aR),aL=arm(1,pose.aL);
  pxWeapon(g,spec,pose,anim,aR,aL,Ru,{steel,wood,leather,acc,dark,trim,sk,F,cm,t});
  /* ----- chute : le corps entier bascule en arrière autour des pieds ----- */
  if(pose.tilt){const M=pxRy(pose.tilt);for(let i=0;i<g.P.length;i+=3){const p=pxMv(M,[g.P[i],g.P[i+1],g.P[i+2]]),n=pxMv(M,[g.N[i],g.N[i+1],g.N[i+2]]);g.P[i]=p[0];g.P[i+1]=p[1];g.P[i+2]=Math.max(.03,p[2]);g.N[i]=n[0];g.N[i+1]=n[1];g.N[i+2]=n[2];}}
  return g;
}
/* coiffure, coiffe de faction, accessoires de visage */
function pxHead(g,o){
  const {hp,Hc,Bh,HR,hs,hairC,F,cm,spec,acc,trim,dark,steel,rd}=o,hatted=F.name!=='pirate'||(cm&&cm.hat)||true;
  const fac=F.name,hat=cm&&cm.hat!==undefined?cm.hat:(fac==='marine'?'cap':fac==='pirate'?'bandana':fac==='revo'?'hood':'wide');
  const cap=(r,col,dz)=>g.ell(hp(-.012,0,.038+(dz||0)),[HR[0]*r+.008,HR[1]*r+.008,HR[2]*r*.78],col,12,6,Bh);
  /* cheveux (sous la coiffe : mèches latérales seulement) */
  const covered=hat==='cap'||hat==='wide'||hat==='hood'||hat==='helmet'||hat==='tricorn';
  const H=(x,y,z)=>hp(x,y,z);
  if(!covered||hs===8){
    switch(hs){
      case 0:cap(1.01,hairC);for(let i=0;i<8;i++){const a=i/8*6.2832;g.cone(H(Math.cos(a)*.1,Math.sin(a)*.11,.12),H(Math.cos(a)*.2,Math.sin(a)*.2,.27+.04*(i%3)),.05,hairC,5);}break;
      case 1:g.ell(H(-.012,0,.046),[HR[0]*1.06,HR[1]*1.06,HR[2]*.85],hairC,12,6,Bh);g.ell(H(.09,0,.09),[.07,.14,.04],hairC,8,4,Bh);break;
      case 2:cap(1.02,hairC);g.ell(H(-.09,0,-.04),[.1,.15,.2],hairC,10,6,Bh);for(const sg of [1,-1])g.tube(H(.02,.16*sg,.02),H(-.04,.19*sg,-.17),.035,.028,hairC,5);break;
      case 3:cap(.96,hairC,-.02);for(let i=0;i<5;i++)g.cone(H(.06-i*.035,0,.15+(i==2?.01:0)),H(.07-i*.035,0,.30-Math.abs(i-2)*.03),.045,hairC,5);break;
      case 4:g.ell(H(-.02,0,.05),[.25,.26,.23],hairC,12,7,Bh);break;
      case 5:cap(1.0,hairC);g.ell(H(-.01,0,.22),[.06,.06,.07],hairC,8,5);g.tube(H(-.01,0,.19),H(-.01,0,.27),.025,.02,pxc('#c8443a'),5);break;
      case 6:cap(1.0,hairC);g.tube(H(.08,.0,.17),H(.19,0,.2),.06,.03,hairC,6);g.ell(H(.03,0,.17),[.1,.12,.05],hairC,8,4,Bh);break;
      case 7:cap(1.0,hairC);g.tube(H(-.13,0,.08),H(-.24,0,-.07),.045,.03,hairC,6);g.ell(H(-.25,0,-.1),[.05,.05,.06],hairC,6,4);break;
      case 8:g.ell(H(.06,0,-.1),[.1,.13,.09],hairC,10,5,Bh);g.ell(H(.11,0,-.04),[.06,.07,.03],hairC,6,4,Bh);break;
      default:cap(1.0,hairC);for(const sg of [1,-1]){g.tube(H(-.02,.14*sg,.06),H(-.04,.2*sg,-.1),.04,.03,hairC,5);g.ell(H(-.04,.2*sg,-.13),[.04,.04,.05],hairC,6,4);}}
  } else {for(const sg of [1,-1])g.ell(H(-.03,.15*sg,-.01),[.06,.04,.08],hairC,6,4,Bh);g.ell(H(-.14,0,-.02),[.05,.12,.1],hairC,6,4,Bh);}
  const wcol=pxc(cm&&cm.hatC?cm.hatC:F.cap);
  switch(hat){
    case 'cap':{cap(1.04,wcol,.012);g.ell(H(.15,0,.062),[.08,.15,.014],wcol,8,3,Bh);g.ell(H(.0,0,.075),[.175,.18,.03],trim,10,3,Bh);g.ell(H(.16,0,.1),[.02,.03,.03],pxc('#e0b04a'),6,4);break;}
    case 'bandana':{g.ell(H(-.008,0,.052),[HR[0]*1.03+.01,HR[1]*1.03+.01,HR[2]*.62],acc,12,5,Bh);const k0=H(-.17,.0,.05);g.quad2(k0,pxAdd(k0,[-.1,.03,-.08]),pxAdd(k0,[-.14,.04,-.06]),pxAdd(k0,[-.04,.0,.02]),acc);g.quad2(k0,pxAdd(k0,[-.09,-.04,-.1]),pxAdd(k0,[-.13,-.05,-.07]),pxAdd(k0,[-.04,.0,.02]),acc);break;}
    case 'hood':{g.ell(H(-.045,0,.04),[HR[0]*1.2,HR[1]*1.22,HR[2]*1.16],wcol,12,7,Bh);g.ell(H(.02,0,.19),[.09,.1,.05],wcol,8,4,Bh);
      for(const sg of [1,-1]){g.ell(H(.11,.055*sg,.14),[.034,.034,.018],pxc('#3b3f45'),8,3,Bh);g.ell(H(.11,.055*sg,.145),[.024,.024,.02],pxc('#9bd8e8'),8,3,Bh);}break;}
    case 'wide':{g.tube(H(0,0,.1),H(0,0,.135),.31,.25,wcol,14,true);g.ell(H(-.005,0,.17),[.16,.165,.095],wcol,12,6,Bh);g.ell(H(-.005,0,.145),[.17,.175,.025],acc,12,3,Bh);break;}
    case 'tricorn':{g.tube(H(0,0,.095),H(0,0,.125),.27,.23,wcol,12,true);for(const a of [0,2.094,4.19]){const ca=Math.cos(a),sa=Math.sin(a);g.cone(H(ca*.2,sa*.2,.12),H(ca*.3,sa*.3,.26),.07,wcol,5);}
      g.ell(H(0,0,.16),[.15,.15,.07],wcol,10,5,Bh);g.tube(H(-.1,.08,.2),H(-.2,.12,.34),.012,.004,acc,4);break;}
    case 'helmet':{g.ell(H(0,0,.06),[HR[0]*1.08,HR[1]*1.08,HR[2]*.95],steel,12,6,Bh);g.tube(H(.1,0,.2),H(-.12,0,.2),.02,.02,wcol,5);g.tube(H(.12,0,.12),H(.12,0,-.05),.015,.015,steel,4);break;}
    case 'headband':{g.ell(H(-.005,0,.07),[HR[0]*1.025,HR[1]*1.025,.035],acc,12,3,Bh);const k=H(-.17,0,.07);g.quad2(k,pxAdd(k,[-.08,.02,-.1]),pxAdd(k,[-.1,.03,-.08]),pxAdd(k,[-.03,0,.02]),acc);break;}
    default:break;}
  /* accessoires de visage */
  const ac=cm&&cm.face||[];
  if(ac.includes('eyepatch')){g.ell(H(.152,.066,.012),[.013,.04,.05],dark,8,5,Bh);g.tube(H(.1,.15,.09),H(.1,-.15,-.01),.008,.008,dark,4);}
  if(ac.includes('scar')){g.tube(H(.158,-.085,.07),H(.162,-.05,-.04),.006,.006,pxc('#b8423a'),4);}
  if(ac.includes('beard')){g.ell(H(.09,0,-.115),[.1,.13,.07],hairC,10,5,Bh);}
  if(ac.includes('stache')){g.ell(H(.17,0,-.052),[.016,.06,.014],hairC,6,3,Bh);}
  if(ac.includes('glasses')){for(const sg of [1,-1])g.tube(H(.164,.066*sg-.03,.012),H(.164,.066*sg+.03,.012),.012,.012,steel,6);g.tube(H(.164,-.036,.012),H(.164,.036,.012),.005,.005,steel,4);}
  if(ac.includes('earring')){g.ell(H(0,-.178,-.05),[.012,.008,.02],pxc('#e0b04a'),5,3);}
  if(ac.includes('scarf')){g.ell(H(0,0,-.16),[.1,.12,.045],acc,10,4,Bh);const k=H(-.08,.08,-.17);g.quad2(k,pxAdd(k,[-.1,.04,-.16]),pxAdd(k,[-.14,.05,-.14]),pxAdd(k,[-.05,0,.0]),acc);}
}
/* arme tenue en main droite (et bouclier / arc en main gauche) */
function pxWeapon(g,spec,pose,anim,aR,aL,Ru,o){
  const {steel,wood,leather,acc,dark,trim,sk,F,cm,t}=o,k=spec.kind,hand=aR.ha;
  const wsel=cm&&cm.weapon!==undefined?cm.weapon:null;
  const ang=pose.w,up=pxMv(Ru,[Math.sin(ang*.5)*.8+.15,0,Math.cos(ang*.5)]),sl=(len,a,r,col)=>{const d=[Math.cos(a)*.9,0,Math.sin(a)];const dd=pxMv(Ru,[d[0],-.2,d[2]]);return [pxAdd(hand,dd,-.04),pxAdd(hand,dd,len)];};
  const blade=(len,w,col,curve)=>{const a=aR.tot+1.0,d=pxMv(Ru,[Math.sin(a),-.12,-Math.cos(a)]),a2=aR.tot+1.0+(curve?.45:0),d2=pxMv(Ru,[Math.sin(a2),-.12,-Math.cos(a2)]);
    const a0=pxAdd(hand,d,-.04),a1=pxAdd(hand,d,len*.5),a3=pxAdd(a1,d2,len*.5);
    g.tube(a0,pxAdd(hand,d,.05),.022,.02,leather,5);g.tube(pxAdd(hand,d,.05),a1,w,w*.9,col,4);g.tube(a1,a3,w*.9,.004,col,4);
    const gp=pxAdd(hand,d,.055);g.tube(pxAdd(gp,[0,.045,0]),pxAdd(gp,[0,-.045,0]),.014,.014,pxc('#c9a24a'),5);};
  if(k===0||k===3){
    const st=wsel!==null?wsel:(F.name==='pirate'?'curve':F.name==='marine'?'saber':F.name==='revo'?'club':'cleaver');
    if(st==='curve')blade(.36,.022,steel,true);else if(st==='saber')blade(.42,.018,steel,false);
    else if(st==='cleaver')blade(.32,.04,steel,false);
    else if(st==='club'){const d=pxMv(Ru,[.5,-.1,.85]);g.tube(pxAdd(hand,d,-.05),pxAdd(hand,d,.34),.022,.045,wood,6);g.ell(pxAdd(hand,d,.35),[.05,.05,.06],wood,6,4);}
    else if(st==='great'){blade(.7,.04,steel,false);}
    else if(st==='hammer'){const d=pxMv(Ru,[.35,-.1,.9]);g.tube(pxAdd(hand,d,-.1),pxAdd(hand,d,.55),.02,.02,wood,5);g.box(pxAdd(hand,d,.58),[.09,.06,.055],steel);}
    else if(st==='twin'){blade(.26,.016,steel,false);const h2=aL.ha,d=pxMv(Ru,[.5,.2,.6]);g.tube(pxAdd(h2,d,-.03),pxAdd(h2,d,.26),.016,.004,steel,4);}
    else if(st==='staff'){const d=pxMv(Ru,[.2,-.05,1]);g.tube(pxAdd(hand,d,-.35),pxAdd(hand,d,.55),.016,.016,wood,5);g.ell(pxAdd(hand,d,.58),[.045,.045,.045],pxc('#7ad8f0'),7,4);}}
  if(k===1){const lean=anim==='attack'?(1-Math.max(0,Math.sin(((t*1.35)%1)*6.28))*1.5):0,d=pxMv(Ru,[.25+lean*.5,-.05,1]),dn=g.nrm(d);
    g.tube(pxAdd(hand,dn,-.35),pxAdd(hand,dn,.62),.015,.014,wood,5);const tip=pxAdd(hand,dn,.62);g.cone(tip,pxAdd(tip,dn,.17),.032,steel,5);g.quad2(pxAdd(tip,dn,-.05),pxAdd(tip,dn,-.2),pxAdd(tip,[dn[0]*-.2,dn[1]*-.2+.07,dn[2]*-.2-.05]),pxAdd(tip,[dn[0]*-.05,.04,dn[2]*-.05]),acc);
    const sh=aL.ha;g.ell(pxAdd(sh,[.06,0,-.02]),[.03,.115,.13],pxc(F.name==='marine'?'#f2efe4':F.name==='pirate'?'#8a5a3a':F.name==='revo'?'#4a6e50':'#7a5a38'),10,5);g.ell(pxAdd(sh,[.085,0,-.02]),[.014,.07,.08],acc,8,4);g.ell(pxAdd(sh,[.095,0,-.02]),[.016,.025,.03],steel,6,3);}
  if(k===2){const hl=aL.ha,pw=pose.draw||0;
    if(F.name==='marine'||F.name==='chasseur'){const d=pxMv(Ru,[1,0,.1]),b0=pxAdd(hl,d,-.18),b1=pxAdd(hl,d,.4);g.tube(b0,b1,.018,.014,wood,5);g.tube(pxAdd(b1,d,0),pxAdd(b1,d,.08),.012,.01,steel,4);g.box(pxAdd(b0,[-.04,0,-.03]),[.05,.02,.04],wood);g.tube(pxAdd(hl,d,-.05),pxAdd(hl,[d[0],d[1],d[2]],.05),.03,.03,wood,5);}
    else{/* arc : courbure, corde tirée par la main droite */const bl=pxMv(Ru,[.06,0,0]),ctr=pxAdd(hl,bl,1),N=7,pts=[];for(let i=0;i<=N;i++){const u=i/N*2-1;pts.push([ctr[0]+.09*(1-u*u)*.9*Math.max(.4,1)-.0,ctr[1],ctr[2]+u*.26]);}
      for(let i=0;i<N;i++)g.tube(pts[i],pts[i+1],.014,.014,wood,4);const hr=aR.ha;g.tube(pts[0],pw>0.05?hr:pxAdd(pts[0],[-.08,0,.26*2/N*N/2]),.004,.004,pxc('#e8e0c8'),3);g.tube(pw>0.05?hr:pxAdd(pts[0],[-.08,0,.26*2/N*N/2],1),pts[N],.004,.004,pxc('#e8e0c8'),3);
      if(pw>.1){g.tube(hr,pxAdd(hl,[.25,0,0]),.007,.006,wood,3);g.cone(pxAdd(hl,[.18,0,0]),pxAdd(hl,[.26,0,0]),.014,steel,4);}}
    g.ell(pxAdd(aR.sh,[-.1,.08,.05]),[.04,.05,.12],leather,6,4);}
}
/* monture du cavalier : bête trapue, galop */
function pxMount(g,pose,t,col,acc){
  const c=pxc(col),dk=pxc('#2a2018'),ph=t*6.28*1.7,TAU=6.28,s=[Math.sin(ph),Math.sin(ph+.6),Math.sin(ph+3.2),Math.sin(ph+3.8)];
  g.ell([0,0,.34],[.34,.17,.15],c,10,6);g.ell([.2,0,.4],[.2,.16,.15],c,10,6);
  g.tube([.3,0,.42],[.44,0,.6],.075,.06,c,6);g.ell([.5,0,.62],[.13,.075,.085],c,8,5,[[.94,0,-.34],[0,1,0],[.34,0,.94]]);g.ell([.6,0,.58],[.06,.055,.05],pxc('#d9a98c'),6,4);
  for(const sg of [1,-1])g.cone([.45,.05*sg,.7],[.44,.07*sg,.8],.022,dk,4);g.tube([.36,0,.64],[.28,0,.76],.03,.012,dk,4);g.tube([-.32,0,.4],[-.5,0,.28],.04,.014,dk,5);
  [[.22,.1],[.22,-.1],[-.22,.1],[-.22,-.1]].forEach((p,i)=>{const sw=s[i]*.5,hi=[p[0],p[1],.27],kn=[p[0]+sw*.12,p[1],.15+Math.max(0,s[i])*.07],ft=[p[0]+sw*.2,p[1],Math.max(.03,.02+Math.max(0,s[i])*.1)];g.tube(hi,kn,.05,.04,c,5);g.tube(kn,ft,.04,.034,c,5);g.ell([ft[0],ft[1],ft[2]],[.045,.04,.03],dk,5,3);});
  g.ell([0,0,.53],[.17,.17,.03],acc,8,3);g.ell([.05,0,.5],[.2,.14,.03],pxc('#6a4a2c'),8,3);
}
/* catapulte : châssis, roues, bras qui bascule */
function pxCatapult(g,anim,t,wood,acc){
  const u=anim==='attack'?(t*1.35)%1:0,ar=anim==='attack'?(u<.5?-.5+u*.2:.45-(u-.5)*2.3):-.5,dk=pxc('#4a3626');
  g.box([0,0,.2],[.4,.17,.035],wood);for(const sg of [1,-1]){g.box([0,.17*sg,.2],[.4,.025,.04],dk);g.ell([.26,.23*sg,.14],[.13,.025,.13],dk,10,3);g.ell([-.26,.23*sg,.14],[.13,.025,.13],dk,10,3);g.tube([.12,.17*sg,.2],[.0,.17*sg,.52],.03,.026,wood,5);}
  g.tube([-.02,-.17,.52],[-.02,.17,.52],.03,.03,dk,6);
  const a0=[0,0,.52],d=[Math.cos(ar),0,Math.sin(ar)],a1=pxAdd(a0,d,.62),a2=pxAdd(a0,d,-.28);g.tube(a2,a1,.028,.022,wood,5);
  g.ell(pxAdd(a1,[0,0,.03]),[.07,.07,.04],dk,6,3);if(u<.52)g.ell(pxAdd(a1,[0,0,.1]),[.06,.06,.06],pxc('#8a8478'),6,4);g.ell(pxAdd(a2,[0,0,0]),[.07,.06,.06],acc,6,4);
  g.tube([.38,0,.2],[.1,0,.55],.012,.012,pxc('#e0d6b8'),3);
}
/* aperçu de dimensions : cadre utile du modèle (pour l'atlas de sprites) */
const PX_CELL={cx:0,cz:.62,size:2.0};

/* ---------- apparence d'un commandant : déduite UNIQUEMENT des données du jeu et de l'illustration importée ----------
   Le jeu ne contient aucune description physique des lieutenants. On n'invente donc pas leur visage « fidèle » :
   - stature, arme et posture dérivent de leurs bonus réels (attaque, défense, vitesse, « big ») ;
   - coiffure, accessoires, couleurs de repli viennent d'une graine stable tirée de leur identifiant (distincts, mais arbitraires) ;
   - si l'illustration importée est disponible, ses couleurs dominantes (cheveux, vêtement, accent, peau) remplacent les couleurs de repli. */
const PX_LOOK_OVERRIDE={};                               /* à remplir avec des fiches validées : {Ace:{hs:3,hat:'none',face:['scar'],top:'#…'}} */
function pxLookFor(i,fac){
  const L=LEGENDS[i],id=L.s,r=pxRnd(pxHash(id)),ld=L.lead||{},fx=L.fx||{},A=ld.atk||0,D=ld.def||0,S=ld.spd||0,B=ld.big||0;
  const ill=PXILL.pal[id]||null;
  const power=A+B,tank=D,fast=S+(fx.spd||0);
  const w=.92+Math.min(.28,tank*1.3+B*.5+(r()-.5)*.1),h=1+.05*(power>.12?1:0)+(r()-.5)*.06;
  const hs=Math.floor(r()*10),hatPool=fac==='marine'?['cap','cap','none','helmet']:fac==='pirate'?['bandana','tricorn','headband','none','none']:fac==='revo'?['hood','headband','none','helmet']:['wide','wide','tricorn','none'];
  const faceOpts=['eyepatch','scar','beard','stache','glasses','earring','scarf'],face=[];for(const f of faceOpts)if(r()<.2)face.push(f);
  const hat=hatPool[Math.floor(r()*hatPool.length)];
  const weapon=B>.12?'hammer':A>.1?(r()<.5?'great':'curve'):tank>.1?'club':fast>.05?'twin':fx.faith?'staff':(r()<.5?'saber':'cleaver');
  const cm={seed:pxHash(id)%100000,i,id,w,h,hs,hat,face,weapon,post:Math.floor(r()*4),
    skin:PX_SKIN[Math.floor(r()*PX_SKIN.length)],hair:PX_HAIR[Math.floor(r()*PX_HAIR.length)],top:null,trim:null,hatC:null,cape:'#ffffff',src:'données',mount:null,eyes:r()<.25?'narrow':'round'};
  if(ill){cm.src='illustration';if(ill.hair)cm.hair=ill.hair;if(ill.skin)cm.skin=ill.skin;if(ill.top)cm.top=ill.top;if(ill.acc)cm.trim=ill.acc;if(ill.acc)cm.hatC=ill.top||ill.acc;}
  const ov=PX_LOOK_OVERRIDE[id];if(ov){Object.assign(cm,ov);cm.src='fiche validée';}
  return cm;
}
/* palette extraite des illustrations importées (IndexedDB → image → couleurs) : exécutée dans le navigateur de l'utilisateur */
const PXILL={pal:{},busy:new Set(),n:0};
function pxIllScan(){
  if(typeof IL==='undefined'||!IL.url)return;
  for(const id of Object.keys(IL.url)){if(PXILL.pal[id]||PXILL.busy.has(id))continue;PXILL.busy.add(id);
    const im=new Image();im.onload=()=>{try{PXILL.pal[id]=pxPalette(im);PXILL.n++;PXS.dirtyLook=true;}catch(e){PXILL.pal[id]=null;}PXILL.busy.delete(id);};im.onerror=()=>{PXILL.pal[id]=null;PXILL.busy.delete(id);};im.src=IL.url[id];}
}
function pxPalette(im){
  const W=48,Hh=64,cv=document.createElement('canvas');cv.width=W;cv.height=Hh;const c=cv.getContext('2d',{willReadFrequently:true});
  const sw=im.naturalWidth,sh=im.naturalHeight,sc=Math.max(W/sw,Hh/sh),dw=sw*sc,dh=sh*sc;c.drawImage(im,(W-dw)/2,(Hh-dh)/2,dw,dh);
  const d=c.getImageData(0,0,W,Hh).data,px=(x,y)=>{const i=(y*W+x)*4;return [d[i],d[i+1],d[i+2],d[i+3]];};
  /* fond = couleur moyenne des coins */
  let bg=[0,0,0],nb=0;for(const [x,y] of [[0,0],[W-1,0],[0,Hh-1],[W-1,Hh-1],[1,1],[W-2,1]]){const p=px(x,y);bg=[bg[0]+p[0],bg[1]+p[1],bg[2]+p[2]];nb++;}bg=bg.map(v=>v/nb);
  const isBg=p=>p[3]<40||(Math.abs(p[0]-bg[0])+Math.abs(p[1]-bg[1])+Math.abs(p[2]-bg[2])<54);
  const hsv=p=>{const r=p[0]/255,g=p[1]/255,b=p[2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),dd=mx-mn;let h=0;if(dd){h=mx===r?((g-b)/dd)%6:mx===g?(b-r)/dd+2:(r-g)/dd+4;h*=60;if(h<0)h+=360;}return [h,mx?dd/mx:0,mx];};
  const avg=(x0,x1,y0,y1,pred)=>{let s=[0,0,0],n=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const p=px(x,y);if(isBg(p))continue;if(pred&&!pred(p))continue;s[0]+=p[0];s[1]+=p[1];s[2]+=p[2];n++;}return n>8?'#'+s.map(v=>Math.round(v/n).toString(16).padStart(2,'0')).join(''):null;};
  const skinP=p=>{const [h,s,v]=hsv(p);return (h<50||h>345)&&s>.12&&s<.7&&v>.35;};
  const hair=avg(12,36,2,16,p=>!skinP(p)),skin=avg(14,34,18,34,skinP),top=avg(12,36,36,56,p=>!skinP(p));
  /* accent : teinte la plus saturée de l'image */
  const bk={};for(let y=0;y<Hh;y++)for(let x=0;x<W;x++){const p=px(x,y);if(isBg(p))continue;const [h,s,v]=hsv(p);if(s<.45||v<.4)continue;const k=Math.floor(h/30);(bk[k]=bk[k]||[0,0,0,0]);bk[k][0]+=p[0];bk[k][1]+=p[1];bk[k][2]+=p[2];bk[k][3]++;}
  let best=null,bn=6;for(const k in bk)if(bk[k][3]>bn){bn=bk[k][3];best=bk[k];}
  const acc=best?'#'+[0,1,2].map(i=>Math.round(best[i]/best[3]).toString(16).padStart(2,'0')).join(''):null;
  return {hair,skin,top,acc};
}
