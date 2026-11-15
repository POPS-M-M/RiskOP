/* ================= ÎLES SUR MESURE (version test) : une direction artistique propre aux lieux emblématiques =================
   Ne touche qu'à l'apparence : mêmes îles, mêmes contours (rc), mêmes ids, mêmes zones de clic ; la côte reste au niveau de la mer
   (débarquements, ports, combat inchangés). Branché dans w3BuildIsland (61-monde3d.js) par W3CU[nom de l'île] :
     art      : retouches de la fiche d'île, pour le seul rendu 3D (la fiche 2.5D n'est pas modifiée)
     relief   : (H0,ctx) → nouvelle fonction de hauteur ;  color : couleur du sol ;  pier : angle du ponton ;  noHarbor
     build    : (kit) → ajoute architecture, monuments, végétation.
   Les éléments qui relèvent d'une interprétation artistique (et non d'un fait de l'œuvre) sont listés dans le rapport d'audit. */
const W3CU={};
const cuMix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t,1];
const cuSh=(c,k)=>[Math.min(1,c[0]*k),Math.min(1,c[1]*k),Math.min(1,c[2]*k),1];
/* ellipsoïde lisse (yaw autour de z) */
function cuEll(G,x,y,z,rx,ry,rz,col,n,m,yaw){
  n=n||14;m=m||8;yaw=yaw||0;const c=Math.cos(yaw),s=Math.sin(yaw);
  const pt=(a,b)=>{const cb=Math.cos(b),lx=Math.cos(a)*cb*rx,ly=Math.sin(a)*cb*ry,lz=Math.sin(b)*rz;return [x+lx*c-ly*s,y+lx*s+ly*c,z+lz];};
  const nm=(a,b)=>{const cb=Math.cos(b);let nx=Math.cos(a)*cb/rx,ny=Math.sin(a)*cb/ry,nz=Math.sin(b)/rz;const l=Math.hypot(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;return [nx*c-ny*s,nx*s+ny*c,nz];};
  for(let j=0;j<m;j++){const b0=-1.5708+j/m*3.1416,b1=-1.5708+(j+1)/m*3.1416;
    for(let i=0;i<n;i++){const a0=i/n*6.2832,a1=(i+1)/n*6.2832,A=[pt(a0,b0),pt(a1,b0),pt(a1,b1),pt(a0,b1)],N=[nm(a0,b0),nm(a1,b0),nm(a1,b1),nm(a0,b1)],cc=typeof col==='function'?col(j,i):col;
      G.tri(A[0],A[1],A[2],cc,N[0],N[1],N[2]);G.tri(A[0],A[2],A[3],cc,N[0],N[2],N[3]);}}
}
/* tube le long d'une ligne brisée : rayon r(t) 0→1, couleur col(t) ; extrémités fermées */
function cuTube(G,pts,rf,col,n,cap){
  n=n||10;const N=pts.length,rings=[];
  for(let i=0;i<N;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(N-1,i+1)];let T=[b[0]-a[0],b[1]-a[1],b[2]-a[2]];const l=Math.hypot(...T)||1;T=T.map(q=>q/l);
    let U=Math.abs(T[2])>.92?[1,0,0]:[0,0,1],S=[U[1]*T[2]-U[2]*T[1],U[2]*T[0]-U[0]*T[2],U[0]*T[1]-U[1]*T[0]];const sl=Math.hypot(...S)||1;S=S.map(q=>q/sl);
    const V=[T[1]*S[2]-T[2]*S[1],T[2]*S[0]-T[0]*S[2],T[0]*S[1]-T[1]*S[0]],r=typeof rf==='function'?rf(i/(N-1)):rf;
    rings.push({p:pts[i],r,S,V});}
  for(let i=0;i<N-1;i++){const A=rings[i],B=rings[i+1],cc=typeof col==='function'?col(i/(N-1)):col;
    for(let k=0;k<n;k++){const a0=k/n*6.2832,a1=(k+1)/n*6.2832,d0=[Math.cos(a0),Math.sin(a0)],d1=[Math.cos(a1),Math.sin(a1)];
      const dir=(R,d)=>[R.S[0]*d[0]+R.V[0]*d[1],R.S[1]*d[0]+R.V[1]*d[1],R.S[2]*d[0]+R.V[2]*d[1]],q=(R,d)=>{const v=dir(R,d);return [R.p[0]+v[0]*R.r,R.p[1]+v[1]*R.r,R.p[2]+v[2]*R.r];};
      G.tri(q(A,d0),q(A,d1),q(B,d1),cc,dir(A,d0),dir(A,d1),dir(B,d1));G.tri(q(A,d0),q(B,d1),q(B,d0),cc,dir(A,d0),dir(B,d1),dir(B,d0));}}
  if(cap){for(const [R,sg] of [[rings[0],-1],[rings[N-1],1]]){const T=[sg*(rings[N-1].p[0]-rings[0].p[0]),sg*(rings[N-1].p[1]-rings[0].p[1]),sg*(rings[N-1].p[2]-rings[0].p[2])],l=Math.hypot(...T)||1,nn=T.map(q=>q/l),cc=typeof col==='function'?col(sg>0?1:0):col;
    for(let k=0;k<n;k++){const a0=k/n*6.2832,a1=(k+1)/n*6.2832,P=(a)=>{const v=[R.S[0]*Math.cos(a)+R.V[0]*Math.sin(a),R.S[1]*Math.cos(a)+R.V[1]*Math.sin(a),R.S[2]*Math.cos(a)+R.V[2]*Math.sin(a)];return [R.p[0]+v[0]*R.r,R.p[1]+v[1]*R.r,R.p[2]+v[2]*R.r];};G.tri(R.p,P(a0),P(a1),cc,nn,nn,nn);}}}
}
/* solide de révolution : profil [[rayon, hauteur]…] de bas en haut, couleur par anneau */
function cuLathe(G,x,y,z,prof,col,n){
  n=n||14;for(let j=0;j<prof.length-1;j++){const [r0,z0]=prof[j],[r1,z1]=prof[j+1],dr=r1-r0,dz=z1-z0,l=Math.hypot(dr,dz)||1,nr=dz/l,nz=-dr/l,cc=typeof col==='function'?col(j):col;
    for(let i=0;i<n;i++){const a0=i/n*6.2832,a1=(i+1)/n*6.2832,c0=Math.cos(a0),s0=Math.sin(a0),c1=Math.cos(a1),s1=Math.sin(a1);
      const A=[x+c0*r0,y+s0*r0,z+z0],B=[x+c1*r0,y+s1*r0,z+z0],C=[x+c1*r1,y+s1*r1,z+z1],D=[x+c0*r1,y+s0*r1,z+z1];
      const n0=[c0*nr,s0*nr,nz],n1=[c1*nr,s1*nr,nz];G.tri(A,B,C,cc,n0,n1,n1);G.tri(A,C,D,cc,n0,n1,n0);}}
}
/* niveaux de détail : chaque appel = un objet mesuré ; facettes proportionnées à la taille (inutile de tailler 14 facettes sur un bonbon de 3 pixels) */
{const E0=cuEll,T0=cuTube,L0=cuLathe;
  cuEll=function(G,x,y,z,rx,ry,rz,col,n,m,yaw){if(typeof col!=='function'){n=r3Seg(Math.max(rx,ry),n||14,6);m=Math.max(4,Math.min(m||8,Math.ceil(n*.6)));}return G.obj?G.obj(()=>E0(G,x,y,z,rx,ry,rz,col,n,m,yaw)):E0(G,x,y,z,rx,ry,rz,col,n,m,yaw);};
  cuTube=function(G,pts,rf,col,n,cap){const r0=typeof rf==='function'?Math.max(rf(0),rf(.5)):rf;n=r3Seg(r0,n||10,4);return G.obj?G.obj(()=>T0(G,pts,rf,col,n,cap)):T0(G,pts,rf,col,n,cap);};
  cuLathe=function(G,x,y,z,prof,col,n){const rm=Math.max(...prof.map(q=>q[0]));n=r3Seg(rm,n||14,6);return G.obj?G.obj(()=>L0(G,x,y,z,prof,col,n)):L0(G,x,y,z,prof,col,n);};}

/* ---------- petits assemblages réutilisables ---------- */
/* cabane ronde des Minks : plateforme, murs, toit pointu à deux « oreilles », porte */
function cuMinkHut(G,tops,x,y,z,s,wall,roof,rnd){
  G.cyl(x,y,z-.15*s,1.5*s,.3*s,r3c('#8a5f38'),10);cuLathe(G,x,y,z+.15*s,[[1.0*s,0],[1.02*s,1.05*s]],wall,10);
  for(let i=0;i<10;i+=2){const a=i/10*6.2832;G.cyl(x+Math.cos(a)*1.02*s,y+Math.sin(a)*1.02*s,z+.15*s,.07*s,1.05*s,r3c('#5f4226'),4,false);}
  G.cone(x,y,z+1.2*s,1.35*s,1.5*s,roof,10);
  for(const sg of [-1,1]){const ex=x+Math.cos(.9*sg)*.62*s,ey=y+Math.sin(.9*sg)*.62*s;G.cone(ex,ey,z+2.1*s,.3*s,.7*s,cuSh(roof,1.12),5);}
  G.box(x-.22*s,y+.96*s,z+.15*s,.44*s,.1*s,.8*s,r3c('#4a3020'));G.quad([x-.5*s,y+.99*s,z+.7*s],[x-.3*s,y+.99*s,z+.7*s],[x-.3*s,y+.99*s,z+.95*s],[x-.5*s,y+.99*s,z+.95*s],r3c('#ffd27a'));
  tops.push([x-1.5*s,y-1.5*s,x+1.5*s,y+1.5*s,z+2.7*s]);
}
/* pont de cordes : deux cordes et des planches, légèrement affaissé */
function cuBridge(G,a,b,w,sag,col){
  const N=10;let prev=null;for(let i=0;i<=N;i++){const f=i/N,x=a[0]+(b[0]-a[0])*f,y=a[1]+(b[1]-a[1])*f,z=a[2]+(b[2]-a[2])*f-Math.sin(f*Math.PI)*sag,L=Math.hypot(b[0]-a[0],b[1]-a[1])||1,nx=-(b[1]-a[1])/L*w,ny=(b[0]-a[0])/L*w;
    if(prev){G.quad([prev[0]-prev[3],prev[1]-prev[4],prev[2]],[prev[0]+prev[3],prev[1]+prev[4],prev[2]],[x+nx,y+ny,z],[x-nx,y-ny,z],i%2?col:cuSh(col,.82));
      for(const sg of [-1,1]){G.quad([prev[0]+sg*prev[3],prev[1]+sg*prev[4],prev[2]+.9],[x+sg*nx,y+sg*ny,z+.9],[x+sg*nx,y+sg*ny,z+.96],[prev[0]+sg*prev[3],prev[1]+sg*prev[4],prev[2]+.96],r3c('#3a2a1c'));}}
    prev=[x,y,z,nx,ny];}
}
const cuCR=(P,sub)=>{const out=[];for(let i=0;i<P.length-1;i++){const p0=P[Math.max(0,i-1)],p1=P[i],p2=P[i+1],p3=P[Math.min(P.length-1,i+2)];for(let k=0;k<sub;k++){const t=k/sub,t2=t*t,t3=t2*t;out.push([0,1,2].map(j=>.5*((2*p1[j])+(-p0[j]+p2[j])*t+(2*p0[j]-5*p1[j]+4*p2[j]-p3[j])*t2+(-p0[j]+3*p1[j]-3*p2[j]+p3[j])*t3)));}}out.push(P[P.length-1]);return out;};

/* ================= ZOU : l'île est le dos de Zunesha ================= */
const ZSK=r3c('#948d82'),ZSK2=r3c('#7a746b'),ZBELLY=r3c('#b5ada0'),ZEAR=r3c('#d9a79e'),ZIV=r3c('#f3ecd6');
W3CU['Zou']={
  art:{lm:null,town:0,trees:[],ex:[],lake:null},
  pier:1.95,
  relief(H0,c){const {rc,R,S0}=c,PLZ=6.8,fw=Math.PI/2-.1;
    const legs=[fw-.95,fw+.95,fw-2.3,fw+2.3];
    return (x,y)=>{const r=Math.hypot(x,y),th=Math.atan2(y,x),cr=rc(th),d=r/cr;if(d>=1)return -.9*r3ss(1,1.2,d);
      let h=PLZ*r3ss(1,.66,d);h=Math.max(h,.3*r3ss(1,.93,d));
      /* cuisses : bourrelets le long du flanc */
      for(const a of legs){let da=Math.abs(th-a);da=Math.min(da,6.2832-da);h+=1.5*Math.exp(-(da/.2)*(da/.2))*r3ss(.55,.8,d)*(1-r3ss(.94,1,d));}
      /* le dos : vallonné, plus haut le long de l'épine */
      h+=1.9*fbm2(x*.065+4,y*.065+9,S0,3)*r3ss(.8,.45,d)+1.0*Math.exp(-Math.pow((x*Math.cos(fw+1.5708)+y*Math.sin(fw+1.5708))/(.25*R),2))*r3ss(.8,.4,d);
      return h;};},
  color(x,y,h,sl,def,c){const {rc,u,S0}=c,th=Math.atan2(y,x),d=Math.hypot(x,y)/rc(th),k=r3ss(.7,.82,d);if(k<=0)return null;
    const base=def(x,y,h,sl),wr=.84+.16*(Math.sin(th*46+fbm2(x*.2,y*.2,S0+3,2)*7)*.5+.5),sk=cuSh(cuMix(ZSK,ZBELLY,r3ss(.94,1,d)*.6),wr);
    const moss=r3ss(.86,.74,d)*.45;return cuMix(cuMix(base,sk,k),[.3,.5,.26,1],moss*(1-k*.6));},
  build(k){
    const {G,tops,occ,H,rc,R,u,rnd,aP}=k,fw=Math.PI/2-.1,cf=Math.cos(fw),sf=Math.sin(fw);
    const F=(bf,br,z)=>[cf*bf-sf*br,sf*bf+cf*br,z],tp=(x,y,r,z)=>tops.push([x-r,y-r,x+r,y+r,z]);
    /* tête, front, joues */
    const hc=F(1.03*R,0,3.6),rx=.2*R,ry=.185*R,rz=.2*R;
    cuEll(G,hc[0],hc[1],hc[2],rx,ry,rz,ZSK,18,10,fw);cuEll(G,...F(.93*R,0,6.0),.17*R,.16*R,.13*R,cuSh(ZSK,1.04),14,8,fw);
    for(const sg of [-1,1]){cuEll(G,...F(1.05*R,sg*.15*R,2.7),.12*R,.1*R,.1*R,cuSh(ZSK,1.06),12,7,fw);}
    tp(hc[0],hc[1],.22*R,8.5);
    /* yeux : larges, expressifs, sous un arc sourcilier */
    for(const sg of [-1,1]){const e=F(1.19*R,sg*.095*R,4.5);cuEll(G,...e,.032*R,.034*R,.038*R,r3c('#f6f1e4'),10,7,fw);cuEll(G,...F(1.215*R,sg*.095*R,4.45),.017*R,.02*R,.026*R,r3c('#1b1714'),8,6,fw);cuEll(G,...F(1.222*R,sg*.09*R,4.55),.006*R,.006*R,.008*R,r3c('#ffffff'),5,4,fw);
      cuEll(G,...F(1.17*R,sg*.1*R,5.05),.045*R,.04*R,.014*R,ZSK2,8,5,fw+sg*.25);}
    /* bouche et menton */
    cuEll(G,...F(1.2*R,0,1.9),.045*R,.09*R,.012*R,r3c('#5a3f3a'),10,5,fw);
    /* oreilles : immenses, dépliées de part et d'autre */
    for(const sg of [-1,1]){const yaw=fw+sg*(1.5708-.35),e=F(.78*R,sg*.2*R,6.4);cuEll(G,...e,.02*R,.17*R,.21*R,ZSK2,14,9,yaw);
      const e2=F(.8*R,sg*.2*R,6.4);cuEll(G,e2[0]+Math.cos(yaw)*.012*R,e2[1]+Math.sin(yaw)*.012*R,e2[2],.014*R,.14*R,.18*R,ZEAR,12,8,yaw);tp(e[0],e[1],.19*R,9);}
    /* trompe : descend en S jusqu'à l'eau, se recourbe au bout ; défenses d'ivoire */
    const tr=cuCR([F(1.17*R,0,3.0),F(1.3*R,.02*R,1.9),F(1.42*R,.09*R,.8),F(1.5*R,.17*R,.15),F(1.58*R,.26*R,.5),F(1.6*R,.3*R,1.4)],4);
    cuTube(G,tr,t=>(.075-.045*t)*R,t=>(Math.floor(t*22)%2)?ZSK:cuSh(ZSK,.9),10,true);
    for(const sg of [-1,1]){const tk=cuCR([F(1.1*R,sg*.12*R,2.2),F(1.2*R,sg*.17*R,1.3),F(1.36*R,sg*.19*R,1.9),F(1.45*R,sg*.17*R,3.1),F(1.47*R,sg*.15*R,3.9)],4);cuTube(G,tk,t=>(.03-.026*t)*R,ZIV,8,true);}
    /* jambes : cuisses le long du flanc, pieds élargis et ongles dans l'eau */
    for(const a of [fw-.95,fw+.95,fw-2.3,fw+2.3]){const cr=rc(a),ca=Math.cos(a),sa=Math.sin(a);
      const lg=cuCR([[ca*cr*1.06,sa*cr*1.06,-.5],[ca*cr*.97,sa*cr*.97,1.4],[ca*cr*.88,sa*cr*.88,3.6],[ca*cr*.76,sa*cr*.76,6.2]],3);
      cuTube(G,lg,t=>(.088+.02*t)*R,t=>cuSh(ZSK,.94+.12*t),10,false);
      const fx=ca*cr*1.08,fy=sa*cr*1.08;cuEll(G,fx,fy,.35,.11*R,.11*R,.55,ZSK2,14,6,a);
      for(let q=-2;q<=1;q++){const na=a+(q+.5)*.2;cuEll(G,fx+Math.cos(na)*.1*R,fy+Math.sin(na)*.1*R,.45,.026*R,.026*R,.5,ZIV,6,4,na);}
      tp(fx,fy,.12*R,2);}
    /* queue */
    const tl=cuCR([F(-.98*R,0,3.6),F(-1.06*R,0,2.6),F(-1.12*R,.02*R,1.2),F(-1.1*R,.04*R,.4)],4);cuTube(G,tl,t=>(.022-.008*t)*R,ZSK2,7,true);cuEll(G,...F(-1.1*R,.04*R,.25),.03*R,.03*R,.05*R,r3c('#3a352f'),8,6,fw);
    /* ---- le dos : forêt luxuriante et ville des Minks dans les arbres géants ---- */
    const greens=[r3c('#2f7a34'),r3c('#3f9a3e'),r3c('#4aa848'),r3c('#256a30'),r3c('#5fb24a')],bark=r3c('#6b4a2c'),bark2=r3c('#7d5834');
    const giants=[[-.05,-.12,1.0],[.30,.05,.82],[-.34,.08,.78],[.08,.34,.7],[-.2,-.38,.66],[.32,-.3,.62]];
    const tops3=[];
    for(const [fx,fy,sz] of giants){const x=fx*R,y=fy*R,d=Math.hypot(x,y)/rc(Math.atan2(y,x));if(d>.78)continue;const z=H(x,y),hh=(9+sz*5)*u*.9,tr=1.3*sz*u;
      /* racines, tronc cannelé, couronne en plusieurs masses */
      for(let q=0;q<5;q++){const a=q/5*6.2832+fx*3;cuTube(G,[[x+Math.cos(a)*tr*2.4,y+Math.sin(a)*tr*2.4,z-.3],[x+Math.cos(a)*tr*1.4,y+Math.sin(a)*tr*1.4,z+tr*1.2],[x+Math.cos(a)*tr*.9,y+Math.sin(a)*tr*.9,z+tr*3]],t=>tr*(.5-.3*t),bark,6,false);}
      cuTube(G,[[x,y,z-.3],[x+.2*u,y,z+hh*.5],[x,y+.2*u,z+hh]],t=>tr*(1-.45*t),t=>(Math.floor(t*14)%2)?bark:bark2,10,false);
      const cz=z+hh;for(const [ox,oy,oz,rr,ci] of [[0,0,.6,4.6,0],[3.4,1.2,-.4,3.4,1],[-3.2,-1.4,-.6,3.6,2],[1,-3.3,.2,3.2,3],[-1,3.1,-.2,3.4,4],[0,0,2.8,3.2,1]])
        {const s2=rr*sz*u;cuEll(G,x+ox*sz*u,y+oy*sz*u,cz+oz*sz*u,s2,s2,s2*.62,greens[ci],12,7);}
      tp(x,y,5.2*sz*u,cz+3*sz*u);
      /* cabanes accrochées au tronc à deux hauteurs, plateformes et marches en spirale */
      const nh=sz>.9?5:3;for(let q=0;q<nh;q++){const a=q*2.2+fx*5,lv=q%2?.46:.3,hx=x+Math.cos(a)*(tr+2.2*u),hy=y+Math.sin(a)*(tr+2.2*u),hz=z+hh*lv;
        cuTube(G,[[x+Math.cos(a)*tr*.8,y+Math.sin(a)*tr*.8,hz-.1],[hx,hy,hz-.1]],.22*u,bark,5,false);
        cuMinkHut(G,tops,hx,hy,hz,.62*u*(.85+rnd()*.3),[cuMix(r3c('#e2c48c'),r3c('#c9a06a'),rnd()),r3c('#d9b27a')][q%2],[r3c('#b5533c'),r3c('#3f8a8a'),r3c('#c98a2c'),r3c('#7a5ab0')][(q+Math.floor(fx*9)+4)%4],rnd);}
      for(let q=0;q<16;q++){const a=q*.62,zz=z+1.2*u+q*(hh*.42/16);G.box(x+Math.cos(a)*(tr+.35*u)-.5*u,y+Math.sin(a)*(tr+.35*u)-.3*u,zz,1*u,.6*u,.14*u,bark2);}
      tops3.push([x,y,z+hh*.38,sz]);occ.push([x,y,5*sz*u]);}
    /* ponts de cordes entre les grands arbres */
    for(const [i,j] of [[0,1],[0,2],[0,3],[1,5],[2,4]]){const A=tops3[i],B=tops3[j];if(!A||!B)continue;cuBridge(G,[A[0],A[1],A[2]],[B[0],B[1],B[2]],.45*u,1.2*u,r3c('#a98250'));}
    /* sous-bois : feuillus, fougères géantes (palmes), arbustes, rochers moussus */
    const spot=(n,tries,f)=>{let c=0;for(let q=0;q<tries&&c<n;q++){const a=rnd()*6.2832,d=(.06+rnd()*.7)*rc(a),x=Math.cos(a)*d,y=Math.sin(a)*d,z=H(x,y);if(z<2.2||occ.some(o=>Math.hypot(x-o[0],y-o[1])<o[2]))continue;f(x,y,z);c++;}};
    spot(Math.round(60*u),2400,(x,y,z)=>{W3T.round(G,x,y,z,(1.5+rnd()*1.3)*u,greens[(rnd()*5)|0],rnd,tops);occ.push([x,y,1.4*u]);});
    spot(Math.round(26*u),1400,(x,y,z)=>{W3T.palm(G,x,y,z,(1.2+rnd()*.8)*u,greens[(rnd()*5)|0],rnd,tops);occ.push([x,y,1*u]);});
    spot(Math.round(34*u),1200,(x,y,z)=>{const r=(.5+rnd()*.5)*u;G.ico(x,y,z+r*.3,r*1.4,.6,greens[(rnd()*5)|0],rnd,.3);});
    spot(Math.round(10*u),600,(x,y,z)=>{G.ico(x,y,z+.3,(.7+rnd()*.5)*u,.65,r3c('#8a8a80'),rnd,.3);G.ico(x,y+.1,z+.9*u,.5*u,.5,r3c('#4a8a3a'),rnd,.2);});
    /* fleurs et lucioles de la jungle */
    spot(Math.round(40*u),800,(x,y,z)=>{G.ico(x,y,z+.2,.16*u,1,[r3c('#ffd24a'),r3c('#ff7a9a'),r3c('#9ad8f0')][(rnd()*3)|0],null,0);});
    k.top=14*u;
  }
};

/* ================= WHOLE CAKE : le territoire de Big Mom, tout en sucre ================= */
const WC={pink:r3c('#f7a8cc'),pinkD:r3c('#ef82b4'),cream:r3c('#fff4dc'),choc:r3c('#6b4129'),chocL:r3c('#8f5e3c'),mint:r3c('#a8e6cf'),lemon:r3c('#ffe6a0'),lav:r3c('#d4c0f0'),cherry:r3c('#d4203a'),waffle:r3c('#e5b070'),ginger:r3c('#a8683a'),ice:r3c('#ffffff'),blue:r3c('#9ad4f0')};
const wcRiver=(R)=>[[-.02,-.02],[-.1,.14],[.06,.26],[.0,.4],[.1,.58],[.04,.78],[.08,.96]].map(p=>[p[0]*R,p[1]*R]);
const cuDistPoly=(P,x,y)=>{let m=1e9;for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1],vx=b[0]-a[0],vy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*vx+(y-a[1])*vy)/(vx*vx+vy*vy||1))),d=Math.hypot(x-a[0]-vx*t,y-a[1]-vy*t);if(d<m)m=d;}return m;};
W3CU['Whole Cake']={
  art:{lm:null,town:0,trees:[],ex:[],lake:null},
  relief(H0,c){const {rc,R,u,S0}=c,riv=wcRiver(R);
    return (x,y)=>{const r=Math.hypot(x,y),th=Math.atan2(y,x),cr=rc(th),d=r/cr;if(d>=1)return -.9*r3ss(1,1.2,d);
      const cliffy=fbm2(Math.cos(th)*1.5+3,Math.sin(th)*1.5+3,S0,3)>.5;
      let h=.3*r3ss(1,.93,d)+2.6*(cliffy?r3ss(.9,.84,d):r3ss(.96,.64,d));
      h+=1.5*fbm2(x*.08+7,y*.08+2,S0+5,3)*r3ss(.9,.5,d);
      /* gâteau central : plateau surélevé ; collines de crème et de flan */
      const cd=Math.hypot(x,y+.06*R);h+=2.6*r3ss(.3*R,.16*R,cd);
      for(const [px,py,pr,ph] of [[.45,.25,.14,2.2],[-.5,.2,.15,2.4],[.38,-.45,.12,2.0],[-.4,-.4,.13,2.2]]){const dd=Math.hypot(x-px*R,y-py*R);h+=ph*Math.exp(-(dd*dd)/(2*(pr*R)*(pr*R)))*r3ss(.95,.5,d);}
      const dr=cuDistPoly(riv,x,y);h-=.9*(1-r3ss(1.4*u,2.6*u,dr))*r3ss(.3*R,.5*R,cd)*r3ss(.98,.9,d);
      return Math.max(h,d<.97?.18:-1);};},
  color(x,y,h,sl,def,c){const {rc,R,u,S0}=c,th=Math.atan2(y,x),d=Math.hypot(x,y)/rc(th),riv=wcRiver(R),dr=cuDistPoly(riv,x,y);
    if(dr<1.7*u&&Math.hypot(x,y+.06*R)>.3*R&&d<.96)return cuMix(WC.choc,WC.chocL,r3ss(.4,1.7,dr*.5)*.4);
    if(sl>.22){const band=Math.floor((h+3)/.55)%3;return band===0?WC.pink:band===1?WC.cream:cuMix(WC.choc,WC.chocL,.3);}
    const n=fbm2(x*.11,y*.11,S0+13,3),m=fbm2(x*.04+3,y*.04+1,S0+4,2);
    let col=m>.62?WC.mint:m<.36?WC.lemon:WC.pink;if(n>.62)col=cuMix(col,WC.cream,.55);
    if(d>.88&&h<.9)col=cuMix(col,r3c('#fff0d8'),.7*r3ss(.88,.96,d));
    if(Math.hypot(x,y+.06*R)<.3*R)col=cuMix(col,r3c('#e9c690'),.5*r3ss(.3*R,.2*R,Math.hypot(x,y+.06*R)));
    return col;},
  build(k){
    const {G,tops,occ,H,rc,R,u,rnd,lvl,city}=k,cx=0,cy=-.06*R,z0=H(cx,cy),s=u;
    const sprk=()=>[r3c('#ff5a8a'),r3c('#ffd24a'),r3c('#6fd4f0'),r3c('#8ae070'),r3c('#ffffff')][(rnd()*5)|0];
    const swirl=(x,y,z,r,h,c)=>{for(let q=0;q<3;q++)cuEll(G,x,y,z+q*h*.3,r*(1-q*.26),r*(1-q*.26),h*.32,c,10,6);G.cone(x,y,z+h*.7,r*.28,h*.34,c,8);};
    const cherry=(x,y,z,r)=>{cuEll(G,x,y,z+r,r,r,r,WC.cherry,10,7);cuTube(G,[[x,y,z+r*1.8],[x+r*.5,y,z+r*2.8],[x+r*.9,y,z+r*3.1]],r*.1,r3c('#4a8a3a'),4,false);cuEll(G,x-r*.35,y-r*.3,z+r*1.5,r*.22,r*.22,r*.18,r3c('#ff9aa8'),6,4);};
    /* --- Whole Cake Chateau : cinq étages, nappage qui coule, clochetons en cornets et cupcakes --- */
    const tiers=[[6.9,3.6,WC.choc,WC.pink],[5.4,3.1,WC.lemon,WC.mint],[4.0,2.8,WC.mint,WC.pink],[2.9,2.6,WC.lav,WC.cream]];let z=z0-.4*s;
    const sc2=R/32;
    tiers.forEach(([r,h,body,top],i)=>{r*=sc2;h*=s*1.4;
      cuLathe(G,cx,cy,z,[[r,0],[r*1.01,h]],body,26);                                    /* étage */
      cuLathe(G,cx,cy,z+h,[[r*1.04,0],[r*1.06,.34*s],[r*.96,.5*s],[0.01,.62*s]],top,26);  /* glaçage */
      const nd=Math.round(14+r*.8);for(let q=0;q<nd;q++){const a=q/nd*6.2832,ln=(.5+((q*37)%7)/7*1.2)*s;cuEll(G,cx+Math.cos(a)*r*1.05,cy+Math.sin(a)*r*1.05,z+h-ln*.4,.34*s,.34*s,ln*.7+.3*s,top,6,5);}  /* coulures */
      for(let q=0;q<Math.round(r*2.3);q++){const a=q*2.399,rr=r*(.35+((q*13)%10)/10*.6);cuEll(G,cx+Math.cos(a)*rr,cy+Math.sin(a)*rr,z+h+.62*s,.16*s,.16*s,.1*s,sprk(),4,3);}  /* vermicelles */
      const nw=Math.round(r*1.6);for(let q=0;q<nw;q++){const a=q/nw*6.2832+i*.4,ww=.3*s,wx=cx+Math.cos(a)*(r*1.012),wy=cy+Math.sin(a)*(r*1.012),tx=-Math.sin(a),ty=Math.cos(a);
        G.quad([wx-tx*ww,wy-ty*ww,z+h*.3],[wx+tx*ww,wy+ty*ww,z+h*.3],[wx+tx*ww,wy+ty*ww,z+h*.72],[wx-tx*ww,wy-ty*ww,z+h*.72],q%3===0?r3c('#ff8ac0'):r3c('#ffe9a0'));G.tri([wx-tx*ww,wy-ty*ww,z+h*.72],[wx+tx*ww,wy+ty*ww,z+h*.72],[wx,wy,z+h*.72+ww*.9],q%3===0?r3c('#ff8ac0'):r3c('#ffe9a0'));}
      tops.push([cx-r,cy-r,cx+r,cy+r,z+h+.6*s]);z+=h+.6*s;});
    /* flèche centrale : cornet gaufré retourné, boules de glace, cerise géante, fanion à la couleur du joueur */
    const rS=1.9*sc2*s;cuLathe(G,cx,cy,z,[[rS,0],[rS*.92,3.2*s],[.15*s,8.8*s]],(j)=>j?WC.waffle:cuSh(WC.waffle,.92),12);
    for(let q=0;q<9;q++){const zz=z+.6*s+q*.88*s,a=q*.8;G.quad([cx+Math.cos(a)*rS*.9,cy+Math.sin(a)*rS*.9,zz],[cx+Math.cos(a+.5)*rS*.86,cy+Math.sin(a+.5)*rS*.86,zz+.14*s],[cx+Math.cos(a+.5)*rS*.8,cy+Math.sin(a+.5)*rS*.8,zz+.3*s],[cx+Math.cos(a)*rS*.84,cy+Math.sin(a)*rS*.84,zz+.16*s],cuSh(WC.waffle,.78));}
    cuEll(G,cx,cy,z+8.8*s,1.05*s,1.05*s,.9*s,WC.pinkD,10,7);cherry(cx,cy,z+9.5*s,.8*s);k.ban(cx,cy,z+13*s);k.top=Math.max(k.top,z-z0+13.5*s);
    tops.push([cx-rS,cy-rS,cx+rS,cy+rS,z+10*s]);
    /* quatre cupcakes-tourelles aux angles du premier étage */
    for(let q=0;q<4;q++){const a=.785+q*1.5708,rr=7.2*sc2,tx=cx+Math.cos(a)*rr,ty=cy+Math.sin(a)*rr,tz=z0+.5*s,cup=q%2?r3c('#ff9ac2'):r3c('#7fd0e8');
      cuLathe(G,tx,ty,tz,[[1.0*s,0],[1.5*s,2.6*s]],(j)=>cup,12);for(let w=0;w<8;w++){const aa=w/8*6.2832;G.quad([tx+Math.cos(aa)*1.1*s,ty+Math.sin(aa)*1.1*s,tz+.1*s],[tx+Math.cos(aa)*1.46*s,ty+Math.sin(aa)*1.46*s,tz+2.55*s],[tx+Math.cos(aa+.2)*1.46*s,ty+Math.sin(aa+.2)*1.46*s,tz+2.55*s],[tx+Math.cos(aa+.2)*1.1*s,ty+Math.sin(aa+.2)*1.1*s,tz+.1*s],r3c('#fff4dc'));}
      swirl(tx,ty,tz+2.6*s,1.5*s,3*s,[WC.cream,WC.pink,WC.mint,WC.lav][q]);cherry(tx,ty,tz+5.3*s,.55*s);tops.push([tx-1.5*s,ty-1.5*s,tx+1.5*s,ty+1.5*s,tz+6*s]);}
    /* pont-levis en barre de chocolat et porte biscuit, face au port */
    {const a=k.aP,ca=Math.cos(a),sa=Math.sin(a),r0=7.4*sc2;const P=(d,w,zz)=>[cx+ca*(r0+d)-sa*w,cy+sa*(r0+d)+ca*w,zz];
      for(let i=0;i<5;i++)for(let j=0;j<3;j++)G.quad(P(i*1.2*s,(j-1.5)*1.1*s,z0+.55*s),P((i+1)*1.2*s-.06,(j-1.5)*1.1*s,z0+.55*s),P((i+1)*1.2*s-.06,(j-.5)*1.1*s-.06,z0+.55*s),P(i*1.2*s,(j-.5)*1.1*s-.06,z0+.55*s),(i+j)%2?WC.choc:WC.chocL);}
    occ.push([cx,cy,10*sc2*s]);
    /* chocolat : fontaine au centre de la place */
    /* --- ville : maisons en pain d'épices, cupcakes, macarons, cornets --- */
    const spot=(n,tries,rmin,rmax,f)=>{let c=0;for(let q=0;q<tries&&c<n;q++){const a=rnd()*6.2832,d=(rmin+rnd()*(rmax-rmin))*rc(a),x=Math.cos(a)*d,y=Math.sin(a)*d,zz=H(x,y);if(zz<.45||occ.some(o=>Math.hypot(x-o[0],y-o[1])<o[2])||cuDistPoly(wcRiver(R),x,y)<2.6*u)continue;f(x,y,zz);c++;}};
    const nH=Math.min(30,Math.round(16*(city?[.8,1,1.25,1.5][lvl]:.7)));
    const house=(x,y,zz,w)=>{const t=(rnd()*4)|0,pc=[r3c('#ff8ac0'),r3c('#7fd0e8'),r3c('#ffd24a'),r3c('#b69af0'),r3c('#8ae0a8')][(rnd()*5)|0];
      if(t===0||t===1){G.box(x,y,zz-.1,w,w,w*.8,WC.ginger,cuSh(WC.ginger,1.1));G.pyr(x,y,zz+w*.7,w,w,w*.8,pc,.22*w);
        for(const [fx,fy] of [[0,0],[w,0],[w,w],[0,w]])cuEll(G,x+fx,y+fy,zz+w*.75,.12*w,.12*w,.1*w,sprk(),5,4);
        G.box(x+w*.38,y+w-.02,zz-.1,w*.24,.1,w*.5,WC.choc);for(const sx of [.14,.62])G.quad([x+w*sx,y+w+.02,zz+w*.3],[x+w*(sx+.24),y+w+.02,zz+w*.3],[x+w*(sx+.24),y+w+.02,zz+w*.56],[x+w*sx,y+w+.02,zz+w*.56],WC.ice);
        G.box(x-.03,y+w*.6,zz+w*.8,w+.06,.08,.1*w,WC.ice);}
      else if(t===2){cuLathe(G,x+w/2,y+w/2,zz-.1,[[.45*w,0],[.62*w,.9*w]],(j)=>pc,10);swirl(x+w/2,y+w/2,zz+.8*w,.66*w,1.3*w,WC.cream);cherry(x+w/2,y+w/2,zz+2.1*w,.22*w);}
      else{cuEll(G,x+w/2,y+w/2,zz+.2*w,.7*w,.7*w,.22*w,pc,12,6);cuEll(G,x+w/2,y+w/2,zz+.55*w,.62*w,.62*w,.13*w,WC.cream,12,5);cuEll(G,x+w/2,y+w/2,zz+.9*w,.7*w,.7*w,.22*w,cuSh(pc,1.1),12,6);G.cyl(x+w/2,y+w/2,zz+1.1*w,.1*w,.55*w,WC.choc,5);G.box(x+w*.4,y+w*1.1,zz-.1,w*.2,.1,w*.5,WC.choc);}
      tops.push([x-.2,y-.2,x+w+.2,y+w+.2,zz+w*1.4]);occ.push([x+w/2,y+w/2,w*1.1]);};
    spot(nH,nH*60,.3,.8,(x,y,zz)=>house(x,y,zz,(1.5+rnd()*.9)*u));
    /* quelques monuments sucrés : donuts-arches, cornets géants, empilements de macarons, flans */
    const donut=(x,y,zz,r)=>{const ring=[];for(let q=0;q<=14;q++){const a=q/14*6.2832;ring.push([x+Math.cos(a)*r,y,zz+r+Math.sin(a)*r]);}cuTube(G,ring,r*.42,WC.waffle,8,false);const ring2=[];for(let q=0;q<=14;q++){const a=q/14*6.2832;ring2.push([x+Math.cos(a)*r,y,zz+r+Math.sin(a)*r+.05*r]);}cuTube(G,ring2,r*.36,[WC.pinkD,WC.mint][(rnd()*2)|0],8,false);tops.push([x-r*1.4,y-r*.5,x+r*1.4,y+r*.5,zz+r*2.4]);};
    spot(4,300,.35,.8,(x,y,zz)=>{donut(x,y,zz,1.7*u);occ.push([x,y,2.6*u]);});
    spot(4,300,.35,.85,(x,y,zz)=>{const r=1.1*u;cuLathe(G,x,y,zz-.1,[[.08*u,0],[r,3.2*u]],WC.waffle,10);cuLathe(G,x,y,zz+3.1*u,[[r*1.05,0],[r*1.1,.5*u],[r*.7,1.6*u],[r*.2,2.2*u]],[WC.pink,WC.mint][(rnd()*2)|0],10);cherry(x,y,zz+5*u,.4*u);G.cyl(x,y,zz,.01,0.01,WC.cream,3);tops.push([x-r,y-r,x+r,y+r,zz+5.4*u]);occ.push([x,y,1.7*u]);});
    spot(5,300,.3,.88,(x,y,zz)=>{const n=3+((rnd()*3)|0);for(let q=0;q<n;q++){const rr=(1.5-q*.22)*u,cz=zz+q*.9*u,c=[WC.pinkD,WC.mint,WC.lav,WC.lemon,WC.blue][(q+((rnd()*5)|0))%5];cuEll(G,x,y,cz+.3*u,rr,rr,.36*u,c,12,5);cuEll(G,x,y,cz+.62*u,rr*.92,rr*.92,.14*u,WC.cream,12,4);}tops.push([x-1.5*u,y-1.5*u,x+1.5*u,y+1.5*u,zz+n*.9*u+.6*u]);occ.push([x,y,1.8*u]);});
    spot(5,300,.3,.8,(x,y,zz)=>{const r=(2+rnd())*u;cuEll(G,x,y,zz,r,r,r*.8,[WC.cream,WC.lemon][(rnd()*2)|0],12,7);cuEll(G,x,y,zz+r*.62,r*.8,r*.8,r*.28,r3c('#b8682a'),12,5);cuEll(G,x,y,zz+r*.78,r*.4,r*.4,r*.16,r3c('#8a4a1c'),8,4);tops.push([x-r,y-r,x+r,y+r,zz+r*.9]);occ.push([x,y,r*1.1]);});
    /* végétation fantastique : sucettes, barbe à papa, cannes à sucre, bonbons gélifiés, meringues */
    const lolli=(x,y,zz,s2)=>{const c1=[WC.pinkD,WC.mint,WC.lav,WC.blue][(rnd()*4)|0],c2=WC.ice;G.cyl(x,y,zz-.1,.07*s2,1.9*s2,r3c('#f0e0d0'),5,false);cuEll(G,x,y,zz+2.4*s2,.95*s2,.2*s2,.95*s2,(j,i)=>(i%4<2)?c1:c2,12,6,0);tops.push([x-s2,y-s2,x+s2,y+s2,zz+3.4*s2]);};
    const cotton=(x,y,zz,s2)=>{const c=[r3c('#ffb8d8'),r3c('#bfe6ff'),r3c('#e6d0ff')][(rnd()*3)|0];G.cyl(x,y,zz-.1,.09*s2,1.4*s2,r3c('#f0e0d0'),5,false);for(const [ox,oy,oz,rr] of [[0,0,1.8,1.1],[.7,.3,1.4,.8],[-.6,-.3,1.5,.85],[.1,-.5,2.5,.7]])cuEll(G,x+ox*s2,y+oy*s2,zz+oz*s2,rr*s2,rr*s2,rr*s2*.8,c,10,6);tops.push([x-1.4*s2,y-1.4*s2,x+1.4*s2,y+1.4*s2,zz+3.2*s2]);};
    const cane=(x,y,zz,s2)=>{const pts=cuCR([[x,y,zz-.1],[x,y,zz+1.6*s2],[x+.1*s2,y,zz+2.6*s2],[x+.7*s2,y,zz+3.1*s2],[x+1.2*s2,y,zz+2.6*s2]],4);cuTube(G,pts,.17*s2,t=>(Math.floor(t*14)%2)?r3c('#ff4a6a'):r3c('#ffffff'),6,true);};
    const gum=(x,y,zz,s2)=>{const c=[r3c('#ff6a8a'),r3c('#ffd24a'),r3c('#6fd4f0'),r3c('#8ae070'),r3c('#c28af0')][(rnd()*5)|0];cuEll(G,x,y,zz+.35*s2,.7*s2,.7*s2,.5*s2,c,8,5);for(let q=0;q<6;q++)cuEll(G,x+Math.cos(q)*.4*s2,y+Math.sin(q)*.4*s2,zz+.7*s2,.08*s2,.08*s2,.06*s2,WC.ice,3,3);};
    const mering=(x,y,zz,s2)=>{for(let q=0;q<3;q++)cuEll(G,x+q*.4*s2,y+(q%2)*.3*s2,zz+.5*s2,.55*s2*(1-q*.15),.55*s2*(1-q*.15),.8*s2*(1-q*.1),WC.cream,8,5);};
    spot(Math.round(20*u),900,.12,.88,(x,y,zz)=>{lolli(x,y,zz,(.9+rnd()*.7)*u);occ.push([x,y,1.2*u]);});
    spot(Math.round(16*u),900,.12,.88,(x,y,zz)=>{cotton(x,y,zz,(.9+rnd()*.6)*u);occ.push([x,y,1.2*u]);});
    spot(Math.round(22*u),900,.12,.9,(x,y,zz)=>{cane(x,y,zz,(.9+rnd()*.7)*u);});
    spot(Math.round(30*u),900,.1,.9,(x,y,zz)=>gum(x,y,zz,(.7+rnd()*.8)*u));
    spot(Math.round(10*u),600,.12,.9,(x,y,zz)=>mering(x,y,zz,(.9+rnd()*.5)*u));
    /* vermicelles au sol */
    spot(Math.round(160*u),1600,.05,.95,(x,y,zz)=>{cuEll(G,x,y,zz+.08,.12*u,.12*u,.07*u,sprk(),3,3);});
    k.top=Math.max(k.top,16*u);
  }
};

/* ================= NEW MARINEFORD : le quartier général de la Marine ================= */
const MF={wall:r3c('#e6e3da'),wall2:r3c('#c9c6bb'),stone:r3c('#a8a699'),roof:r3c('#3b62a8'),roof2:r3c('#2c4a86'),dark:r3c('#2a2f3a'),gold:r3c('#e0b04a'),flag:r3c('#f4f6fa'),pave:r3c('#cfcbbd'),pave2:r3c('#bdb9aa')};
W3CU['New Marineford']={
  art:{lm:null,town:0,trees:[],ex:[],lake:null},
  pier:Math.PI/2,
  relief(H0,c){const {rc,R,u,S0}=c;
    return (x,y)=>{const r=Math.hypot(x,y),th=Math.atan2(y,x),cr=rc(th),d=r/cr;if(d>=1)return -.9*r3ss(1,1.2,d);
      /* plateau fortifié aux falaises nettes ; rampe vers le port au sud */
      let da=Math.abs(th-Math.PI/2);da=Math.min(da,6.2832-da);const ramp=Math.exp(-(da/.3)*(da/.3));
      let h=.3*r3ss(1,.93,d)+3.4*r3ss(.97,.86,d)*(1-.75*ramp*r3ss(.8,.97,d));
      h+=.35*fbm2(x*.09+2,y*.09+5,S0,3)*r3ss(.9,.6,d);
      h+=1.0*r3ss(.3*R,.16*R,Math.hypot(x,y+.14*R));       /* terrasse de la forteresse */
      return Math.max(h,d<.97?.2:-1);};},
  color(x,y,h,sl,def,c){const {rc,R,u}=c,d=Math.hypot(x,y)/rc(Math.atan2(y,x));
    if(sl>.3)return cuMix(r3c('#5d5a58'),r3c('#8a8478'),.5+.5*Math.sin(h*5));
    if(h>1.2){const g=(Math.floor(x/(1.7*u))+Math.floor(y/(1.7*u)))&1;return g?r3c('#8a929c'):r3c('#737b87');}
    if(d>.8)return cuMix(r3c('#6f8a5a'),r3c('#8a8a78'),.4);
    return null;},
  build(k){
    const {G,tops,occ,H,rc,R,u,rnd,lvl,city}=k,s=R/32*u/u*1;const sc=u,cx=0,cy=-.14*R,z0=H(cx,cy);
    const box=(x,y,z,w,d,h,c,t)=>{G.box(x,y,z,w,d,h,c,t);tops.push([x,y,x+w,y+d,z+h]);};
    const tower=(x,y,z,r,h,roof,rh)=>{cuLathe(G,x,y,z,[[r*1.12,0],[r,.5*sc],[r*.97,h-.6*sc],[r*1.12,h-.3*sc],[r*1.12,h]],(j)=>j===3?MF.wall2:MF.wall,14);G.cone(x,y,z+h,r*1.3,rh||r*1.6,roof||MF.roof,14);
      for(let q=0;q<3;q++){const a=q*2.1,zz=z+h*(.3+q*.2);G.quad([x+Math.cos(a)*r*1.0-Math.sin(a)*.25*sc,y+Math.sin(a)*r*1.0+Math.cos(a)*.25*sc,zz],[x+Math.cos(a)*r*1.0+Math.sin(a)*.25*sc,y+Math.sin(a)*r*1.0-Math.cos(a)*.25*sc,zz],[x+Math.cos(a)*r*1.02+Math.sin(a)*.25*sc,y+Math.sin(a)*r*1.02-Math.cos(a)*.25*sc,zz+.8*sc],[x+Math.cos(a)*r*1.02-Math.sin(a)*.25*sc,y+Math.sin(a)*r*1.02+Math.cos(a)*.25*sc,zz+.8*sc],MF.dark);}
      tops.push([x-r*1.2,y-r*1.2,x+r*1.2,y+r*1.2,z+h+(rh||r*1.6)]);};
    /* ---- forteresse centrale : trois terrasses, grande halle à toit bleu, donjon et quatre tours ---- */
    const W1=.5*R,D1=.34*R;let zz=z0-.3*sc;
    box(cx-W1/2,cy-D1/2,zz,W1,D1,2.2*sc,MF.wall2,MF.pave);zz+=2.2*sc;
    const W2=.4*R,D2=.26*R;box(cx-W2/2,cy-D2/2,zz,W2,D2,3.4*sc,MF.wall,MF.wall2);w3Wins({G,rnd},cx-W2/2,cy-D2/2,cx+W2/2,cy+D2/2,zz+.4*sc,zz+3.2*sc,1.8*sc,true);zz+=3.4*sc;
    G.pyr(cx-W2/2,cy-D2/2,zz,W2,D2,3.2*sc,MF.roof,.7*sc);tops.push([cx-W2/2,cy-D2/2,cx+W2/2,cy+D2/2,zz+3.2*sc]);
    for(let q=0;q<9;q++){const a=q/9;G.quad([cx-W2/2+a*W2,cy-D2/2-.72*sc,zz-.1],[cx-W2/2+a*W2+.1*sc,cy-D2/2-.72*sc,zz-.1],[cx-W2/2+a*W2*.5+W2*.25+.05*sc,cy,zz+3.2*sc],[cx-W2/2+a*W2*.5+W2*.25,cy,zz+3.2*sc],MF.roof2);}
    /* grande arche d'entrée et escalier monumental */
    {const ax=cx,ay=cy+D2/2+.05*sc;G.box(ax-2.2*sc,ay,z0+1.8*sc,4.4*sc,.7*sc,4.8*sc,MF.wall2);G.dome(ax,ay+.4*sc,z0+4.2*sc,1.5*sc,1.1,MF.dark,12);G.box(ax-1.5*sc,ay+.3*sc,z0+1.8*sc,3*sc,.5*sc,2.6*sc,MF.dark);
      for(let i=0;i<7;i++)G.box(ax-3*sc,ay+.7*sc+i*.8*sc,z0+1.8*sc-i*.32*sc,6*sc,.82*sc,.3*sc+.001,i%2?MF.wall:MF.wall2);}
    /* donjon central (le plus haut), lanterne et fanion */
    tower(cx,cy,zz,2.6*sc,9*sc,MF.roof,4.6*sc);G.cyl(cx,cy,zz+9*sc+4.6*sc,.1*sc,2.6*sc,r3c('#3a2a1c'),4,false);k.ban(cx,cy,zz+9*sc+7*sc);k.top=zz-z0+9.5*sc+9*sc;
    for(const [ox,oy] of [[-1,-1],[1,-1],[-1,1],[1,1]])tower(cx+ox*W2*.5,cy+oy*D2*.5,z0+2.2*sc,1.9*sc,8*sc,MF.roof2,3.4*sc);
    /* grandes bannières bleues sur la façade (le « signe » de la Marine : bande blanche, ancre stylisée) */
    for(const sx of [-1,1]){const bx=cx+sx*W2*.3,by=cy+D2/2+.2*sc,top=zz-.2*sc;G.quad([bx-.9*sc,by,top],[bx+.9*sc,by,top],[bx+.9*sc,by,top-6*sc],[bx-.9*sc,by,top-6*sc],MF.roof);G.quad([bx-.9*sc,by+.02,top-2*sc],[bx+.9*sc,by+.02,top-2*sc],[bx+.9*sc,by+.02,top-2.7*sc],[bx-.9*sc,by+.02,top-2.7*sc],MF.flag);
      G.quad([bx-.12*sc,by+.03,top-2.9*sc],[bx+.12*sc,by+.03,top-2.9*sc],[bx+.12*sc,by+.03,top-4.8*sc],[bx-.12*sc,by+.03,top-4.8*sc],MF.flag);G.quad([bx-.6*sc,by+.03,top-3.4*sc],[bx+.6*sc,by+.03,top-3.4*sc],[bx+.6*sc,by+.03,top-3.65*sc],[bx-.6*sc,by+.03,top-3.65*sc],MF.flag);}
    /* ---- enceinte : remparts crénelés, douze tours, batteries de canons ; porte face au port ---- */
    const RW=.7*R,nT=14;let prev=null;
    for(let q=0;q<=nT;q++){const a=q/nT*6.2832+Math.PI/2+.22,x=cx+Math.cos(a)*RW*1.02,y=cy+Math.sin(a)*RW*.9,z=H(x,y);if(z<1){prev=null;continue;}
      tower(x,y,z-.3*sc,1.45*sc,4.6*sc,MF.roof,2.3*sc);
      if(prev){const [px,py,pz]=prev,L=Math.hypot(x-px,y-py),nx=(y-py)/L,ny=-(x-px)/L,th=.7*sc,hz=Math.max(z,pz)+.2*sc;
        G.quad([px,py,hz+2.4*sc],[x,y,hz+2.4*sc],[x,y,hz-1],[px,py,hz-1],MF.wall);G.quad([px+nx*th,py+ny*th,hz+2.4*sc],[x+nx*th,y+ny*th,hz+2.4*sc],[px,py,hz+2.4*sc],[x,y,hz+2.4*sc],MF.wall2);G.quad([px+nx*th,py+ny*th,hz-1],[x+nx*th,y+ny*th,hz-1],[x+nx*th,y+ny*th,hz+2.4*sc],[px+nx*th,py+ny*th,hz+2.4*sc],MF.wall2);
        const nc=Math.max(2,Math.floor(L/(1.3*sc)));for(let i=0;i<nc;i+=2){const f=(i+.5)/nc;G.box(px+(x-px)*f-.35*sc+nx*th*.5,py+(y-py)*f-.35*sc+ny*th*.5,hz+2.35*sc,.7*sc,.7*sc,.7*sc,MF.wall);}
        if(q%2===0){const f=.5,mx=px+(x-px)*f,my=py+(y-py)*f,ox=-ny,oy=nx;cuTube(G,[[mx,my,hz+2.6*sc],[mx+(-nx)*1.5*sc,my+(-ny)*1.5*sc,hz+2.9*sc]],.2*sc,MF.dark,6,true);}}
      prev=[x,y,z];}
    /* ---- place d'armes pavée, mât des couleurs, plate-forme et casernes ---- */
    {const px=cx,py=cy+.3*R;G.cyl(px,py,H(px,py),.18*sc,9*sc,r3c('#cfcfd4'),6,false);G.quad([px,py,H(px,py)+9*sc],[px+3*sc,py,H(px,py)+8.4*sc],[px+3*sc,py,H(px,py)+6.2*sc],[px,py,H(px,py)+6.4*sc],MF.roof);tops.push([px-.3,py-.3,px+.3,py+.3,H(px,py)+9*sc]);occ.push([px,py,2*sc]);
      const ex=cx+.28*R,ey=cy+.34*R,ez=H(ex,ey);box(ex-3*sc,ey-2*sc,ez-.2*sc,6*sc,4*sc,1.2*sc,MF.stone,MF.wall2);for(let i=0;i<3;i++)box(ex-1.6*sc,ey+2*sc+i*.55*sc,ez-.2*sc-i*.3*sc+.9*sc,3.2*sc,.56*sc,.3*sc,MF.wall2);for(const sg of [-1,1])G.cyl(ex+sg*2.6*sc,ey-1.6*sc,ez+1*sc,.2*sc,2.4*sc,MF.dark,5,false);occ.push([ex,ey,4*sc]);
      for(const sg of [-1,1])for(let i=0;i<2;i++){const bx=cx+sg*.34*R-3.6*sc,by=cy+.12*R+i*.15*R,bz=H(bx+3.6*sc,by);box(bx,by,bz-.2*sc,7.2*sc,3.2*sc,2.4*sc,MF.wall);G.pyr(bx,by,bz+2.2*sc,7.2*sc,3.2*sc,2*sc,MF.roof,.4*sc);w3Wins({G,rnd},bx,by,bx+7.2*sc,by+3.2*sc,bz+.2*sc,bz+2.2*sc,1.4*sc,false);occ.push([bx+3.6*sc,by+1.6*sc,4.6*sc]);}}
    /* ---- port militaire : deux jetées en arc, phare, chaîne, trois navires de guerre à quai ---- */
    {const a0=k.aP,rr=rc(a0);for(const sg of [-1,1]){let pv=null;for(let q=0;q<=8;q++){const a=a0+sg*(.3+q*.012),d=rr*(.96+q*.035),x=Math.cos(a)*d,y=Math.sin(a)*d;if(pv){const L=Math.hypot(x-pv[0],y-pv[1]),nx=(y-pv[1])/L*1.2*sc,ny=-(x-pv[0])/L*1.2*sc;G.quad([pv[0]-nx,pv[1]-ny,1.3*sc],[x-nx,y-ny,1.3*sc],[x+nx,y+ny,1.3*sc],[pv[0]+nx,pv[1]+ny,1.3*sc],MF.wall2,[0,0,1]);G.quad([pv[0]+nx,pv[1]+ny,1.3*sc],[x+nx,y+ny,1.3*sc],[x+nx,y+ny,-1],[pv[0]+nx,pv[1]+ny,-1],MF.stone);G.quad([pv[0]-nx,pv[1]-ny,1.3*sc],[x-nx,y-ny,1.3*sc],[x-nx,y-ny,-1],[pv[0]-nx,pv[1]-ny,-1],MF.stone);}pv=[x,y];}
      const a=a0+sg*(.3+8*.012),d=rr*(.96+8*.035),lx=Math.cos(a)*d,ly=Math.sin(a)*d;cuLathe(G,lx,ly,1.2*sc,[[1.3*sc,0],[.9*sc,6*sc]],(j)=>MF.wall,10);G.cyl(lx,ly,1.2*sc+6*sc,1*sc,1.1*sc,MF.dark,8);cuEll(G,lx,ly,1.2*sc+7.4*sc,.7*sc,.7*sc,.6*sc,r3c('#ffe9a0'),8,6);G.cone(lx,ly,1.2*sc+8*sc,1.2*sc,1.3*sc,MF.roof,8);tops.push([lx-1.4*sc,ly-1.4*sc,lx+1.4*sc,ly+1.4*sc,12*sc]);}
      /* navires de guerre : le nouveau modèle, en rade, proue vers le large */
      [[-.13,1.1],[.0,1.22],[.13,1.1]].forEach(([da,dd],i)=>{const a=a0+da*2.4,d=rr*dd+4*sc,x=Math.cos(a)*d,y=Math.sin(a)*d;b3Ship(G,x,y,a+Math.PI/2+(i-1)*.12+.0,r3c('#3b62a8'),'marine',.62*u,0);tops.push([x-3*sc,y-3*sc,x+3*sc,y+3*sc,5*sc]);});}
    /* ---- ville des soldats : petites maisons blanches à toit bleu, dans l'enceinte ---- */
    const nH=Math.min(20,Math.round(10*(city?[.8,1,1.25,1.5][lvl]:.7)));
    for(let q=0,c=0;q<nH*50&&c<nH;q++){const a=rnd()*6.2832,d=(.18+rnd()*.46)*rc(a),x=Math.cos(a)*d,y=Math.sin(a)*d*.9,zz2=H(x,y);if(zz2<1.2||occ.some(o=>Math.hypot(x-o[0],y-o[1])<o[2])||Math.hypot(x-cx,y-cy)<.3*R)continue;
      const w=(1.6+rnd()*.8)*sc;box(x,y,zz2-.1,w,w,w*.9,MF.wall);G.pyr(x,y,zz2+w*.8,w,w,w*.7,MF.roof,.2*w);occ.push([x+w/2,y+w/2,w*1.2]);c++;}
    k.top=Math.max(k.top,24*sc);
  }
};


/* ================= KURAIGANA : château gothique en ruines, forêt sombre ================= */
const KG={stone:r3c('#5a566a'),stone2:r3c('#46425a'),dk:r3c('#2e2a3c'),roof:r3c('#241f33'),roof2:r3c('#3a2f52'),glow:r3c('#ffc562'),glow2:r3c('#b48aff'),moss:r3c('#3d5440'),rock:r3c('#4a475a'),bone:r3c('#d8d2c0')};
W3CU['Kuraigana']={
  art:{lm:null,town:0,trees:[],ex:[],lake:null},
  relief(H0,c){const {rc,R,u,S0}=c;
    return (x,y)=>{const r=Math.hypot(x,y),th=Math.atan2(y,x),cr=rc(th),d=r/cr;if(d>=1)return -.9*r3ss(1,1.2,d);
      let h=.3*r3ss(1,.93,d)+2.4*r3ss(.97,.72,d);
      h+=2.4*fbm2(x*.07+3,y*.07+8,S0,4)*r3ss(.92,.5,d);                       /* landes tourmentées */
      h+=3.8*r3ss(.34*R,.12*R,Math.hypot(x,y+.04*R));                           /* éperon rocheux du château */
      for(const [px,py,pr,ph] of [[.55,.3,.07,4],[-.55,.15,.06,3.4],[-.3,-.55,.07,3.8],[.42,-.5,.06,3.2]]){const dd=Math.hypot(x-px*R,y-py*R);h+=ph*Math.exp(-(dd*dd)/(2*(pr*R)*(pr*R)))*r3ss(.95,.5,d);}   /* aiguilles de roche */
      return Math.max(h,d<.97?.2:-1);};},
  color(x,y,h,sl,def,c){const {rc,R,S0}=c,d=Math.hypot(x,y)/rc(Math.atan2(y,x));
    if(sl>.28)return cuMix(KG.rock,KG.stone2,fbm2(x*.2,y*.2,S0+1,2));
    const n=fbm2(x*.1,y*.1,S0+9,3);return cuMix(cuMix(r3c('#4a5a46'),KG.moss,n),r3c('#5a5470'),r3ss(.55,.9,n)*.5*r3ss(.9,.6,d)+(h>4?.3:0));},
  build(k){
    const {G,tops,occ,H,rc,R,u,rnd,lvl,city}=k,sc=u,cx=0,cy=-.04*R,z0=H(cx,cy);
    const box=(x,y,z,w,d,h,c,t)=>{G.box(x,y,z,w,d,h,c,t);tops.push([x,y,x+w,y+d,z+h]);};
    const spire=(x,y,z,r,h,sh,roof)=>{cuLathe(G,x,y,z,[[r*1.1,0],[r,h*.12],[r*.92,h]],(j)=>KG.stone,8);G.cone(x,y,z+h,r*1.25,sh,roof||KG.roof,8);for(let q=0;q<4;q++)G.cone(x+Math.cos(q*1.5708+.785)*r*1.05,y+Math.sin(q*1.5708+.785)*r*1.05,z+h-.2*sc,r*.22,r*.9,KG.roof,4);tops.push([x-r*1.2,y-r*1.2,x+r*1.2,y+r*1.2,z+h+sh]);};
    const glow=(x,y,z,dx,dy,w,h,c)=>{const tx=dx,ty=dy;G.quad([x-ty*w,y+tx*w,z],[x+ty*w,y-tx*w,z],[x+ty*w,y-tx*w,z+h],[x-ty*w,y+tx*w,z+h],c);G.tri([x-ty*w,y+tx*w,z+h],[x+ty*w,y-tx*w,z+h],[x,y,z+h+w*1.2],c);};
    /* ---- le château : nef centrale, tour-donjon, quatre flèches, arcs-boutants, pans de ruine ---- */
    box(cx-.2*R,cy-.1*R,z0-.4*sc,.4*R,.2*R,6*sc,KG.stone,KG.stone2);glow(0,0,0,0,1,.0,0,KG.glow);
    for(let q=0;q<9;q++){const x=cx-.19*R+q*.0475*R;glow(x,cy+.1*R+.02,z0+2*sc+ (q%2)*1.2*sc,0,1,.5*sc,2.4*sc,q%3===0?KG.glow2:KG.glow);}
    for(let q=0;q<7;q++){const x=cx-.15*R+q*.05*R;G.box(x,cy-.1*R-.08*sc,z0+5.2*sc,.5*sc,.4*sc,1*sc,KG.stone2);}                                /* créneaux */
    G.pyr(cx-.2*R,cy-.1*R,z0+5.6*sc,.4*R,.2*R,3.2*sc,KG.roof,.6*sc);
    spire(cx,cy,z0+5.6*sc,3.4*sc,13*sc,10*sc,KG.roof2);k.ban(cx,cy,z0+5.6*sc+13*sc+10*sc+2*sc);k.top=z0+5.6*sc+13*sc+10*sc+3*sc-z0;
    for(const [ox,oy,hh] of [[-.2,-.1,10],[.2,-.1,8],[-.2,.1,9],[.2,.1,11]])spire(cx+ox*R,cy+oy*R,z0+(hh>9?.5:.2)*sc,1.9*sc,hh*sc,6.5*sc,KG.roof);
    /* fenêtres en ogive et rosace sur le donjon */
    for(let q=0;q<5;q++){const a=q*1.2+.4,zz=z0+7.4*sc+(q%2)*2.4*sc;glow(cx+Math.cos(a)*3.36*sc,cy+Math.sin(a)*3.36*sc,zz,Math.cos(a),Math.sin(a),.4*sc,1.6*sc,q%2?KG.glow2:KG.glow);}
    cuEll(G,cx,cy+3.4*sc,z0+13*sc,1*sc,.12*sc,1*sc,KG.glow2,12,6);
    /* arcs-boutants */
    for(const sg of [-1,1]){const pts=cuCR([[cx+sg*.2*R,cy-.1*R-.2*sc,z0+5*sc],[cx+sg*.26*R,cy-.1*R-2*sc,z0+4.4*sc],[cx+sg*.32*R,cy-.1*R-3.6*sc,z0+1.4*sc]],4);cuTube(G,pts,.5*sc,KG.stone2,6,false);box(cx+sg*.32*R-.6*sc,cy-.1*R-4.2*sc,z0-.2*sc,1.2*sc,1.2*sc,1.8*sc,KG.stone);}
    /* ruines : murs brisés, arches seules, colonnes tronquées autour de la cour */
    const ruin=(x,y,w,d,h)=>{const z=H(x+w/2,y+d/2);for(let q=0;q<Math.ceil(w/(1.6*sc));q++){const hh=h*(.35+rnd()*.65);box(x+q*1.6*sc,y,z-.3*sc,1.6*sc,d,hh,rnd()<.5?KG.stone:KG.stone2);}};
    ruin(cx-.46*R,cy+.2*R,.2*R,1.4*sc,5*sc);ruin(cx+.26*R,cy+.22*R,.2*R,1.4*sc,4.4*sc);ruin(cx-.42*R,cy-.3*R,1.4*sc,.18*R,4.6*sc);
    for(let q=0;q<7;q++){const a=q*.9,x=cx+Math.cos(a)*.34*R,y=cy+.26*R+Math.sin(a)*.08*R,z=H(x,y);if(z<1)continue;cuLathe(G,x,y,z-.3*sc,[[.9*sc,0],[.7*sc,(2+rnd()*3)*sc]],KG.bone,8);tops.push([x-.9*sc,y-.9*sc,x+.9*sc,y+.9*sc,z+4*sc]);}
    occ.push([cx,cy,.3*R]);
    /* cimetière : croix, stèles, grilles ; arbres tordus et brume de lueurs violettes */
    const spot=(n,tries,rmin,rmax,f)=>{let c=0;for(let q=0;q<tries&&c<n;q++){const a=rnd()*6.2832,d=(rmin+rnd()*(rmax-rmin))*rc(a),x=Math.cos(a)*d,y=Math.sin(a)*d,zz=H(x,y);if(zz<.5||occ.some(o=>Math.hypot(x-o[0],y-o[1])<o[2]))continue;f(x,y,zz);c++;}};
    {const gx=cx+.34*R,gy=cy+.3*R;for(let q=0;q<14;q++){const x=gx+((q%5)-2)*2.2*sc,y=gy+Math.floor(q/5)*2.2*sc,z=H(x,y);if(z<.5)continue;if(q%3===0){G.box(x-.12*sc,y,z,.24*sc,.2*sc,1.6*sc,KG.bone);G.box(x-.6*sc,y,z+1*sc,1.2*sc,.2*sc,.24*sc,KG.bone);}else{G.box(x-.5*sc,y,z,1*sc,.3*sc,1.1*sc,KG.stone);G.dome(x,y+.15*sc,z+1.1*sc,.5*sc,.6,KG.stone,6);}tops.push([x-.6*sc,y-.2*sc,x+.6*sc,y+.4*sc,z+1.6*sc]);occ.push([x,y,1.3*sc]);}}
    spot(Math.round(26*u),1400,.1,.9,(x,y,zz)=>{const s2=(1.2+rnd()*.9)*u;cuTube(G,cuCR([[x,y,zz-.2],[x+.3*s2,y,zz+1.2*s2],[x-.4*s2,y+.2*s2,zz+2.4*s2],[x+.2*s2,y-.3*s2,zz+3.6*s2]],3),t=>(.2-.12*t)*s2,r3c('#2e2a2a'),6,true);for(let b=0;b<3;b++){const a=b*2.1+x;cuTube(G,[[x,y,zz+(1.6+b*.7)*s2],[x+Math.cos(a)*1.2*s2,y+Math.sin(a)*1.2*s2,zz+(2.2+b*.7)*s2],[x+Math.cos(a)*1.9*s2,y+Math.sin(a)*1.9*s2,zz+(2.1+b*.7)*s2]],.07*s2,r3c('#2e2a2a'),4,true);}tops.push([x-s2,y-s2,x+s2,y+s2,zz+3.8*s2]);occ.push([x,y,1.2*u]);});
    spot(Math.round(34*u),1600,.1,.92,(x,y,zz)=>{W3T.pine(G,x,y,zz,(1.2+rnd()*1.2)*u,r3c(rnd()<.5?'#1f3a30':'#2a4a3c'),rnd,tops);occ.push([x,y,1.2*u]);});
    spot(Math.round(12*u),700,.1,.9,(x,y,zz)=>{const r=(.8+rnd()*1.2)*u;G.ico(x,y,zz+r*.3,r,.9,KG.rock,rnd,.4);});
    spot(Math.round(24*u),900,.1,.92,(x,y,zz)=>{cuEll(G,x,y,zz+.6*u+rnd()*u,.22*u,.22*u,.22*u,r3c('#b48aff'),5,4);});
    k.top=Math.max(k.top,30*sc);
  }
};
