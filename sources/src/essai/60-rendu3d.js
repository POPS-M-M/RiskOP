/* ================= PROTOTYPE (version test) : îles en vraie 3D, photographiées une fois =================
   Couche de RENDU seulement. L'île est modélisée en volume (relief, falaises, bâtiments), éclairée par une lumière commune
   (ombres portées et occlusion calculées par pixel), puis « photographiée » en vue isométrique dans une image.
   Cette image remplace celle du rendu 2.5D dans le même cache : l'affichage, les clics (grille logique), le liseré, les jetons
   et toutes les données de jeu sont inchangés. Le contour de côte est celui du 2.5D (même liseré, même écume).
   Le décor bâti suit l'état réel : niveau de ville, bâtiments existants, camp propriétaire. Une nouvelle photo n'est prise
   que quand cet état change. Sans WebGL (ou en cas d'erreur), l'île garde son rendu 2.5D.
   Prototype : Alabasta seulement. Architecture inventée pour le jeu (palais du désert générique), aucun décor de l'œuvre reproduit. */
const R3D={on:true,facet:false,isl:{Arabasta:1},gl:null,prog:null,fail:'',ms:0,bakes:0,SS:2,pend:new Set()};
try{if(localStorage.getItem('rk-3d')==='0')R3D.on=false;}catch(_){}
/* soleil haut, venant du sud-ouest : les façades visibles (sud, ouest) sont éclairées, les ombres partent vers le haut de l'écran */
const R3_SUN=(()=>{const v=[-.55,.42,.72],n=Math.hypot(...v);return v.map(x=>x/n);})();

/* ---------- géométrie : triangles colorés (position, normale, couleur RGBA) ---------- */
function r3Geo(){
  const P=[],N=[],Cl=[],Tw=[];
  const push=(p,n,c,tw)=>{P.push(p[0],p[1],p[2]);N.push(n[0],n[1],n[2]);Cl.push(c[0],c[1],c[2],c[3]===undefined?1:c[3]);Tw.push(tw?1:0);};
  const nrm=(a,b,c)=>{const u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],v=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];const l=Math.hypot(...n)||1;return n.map(x=>x/l);};
  const G={P,N,Cl,Tw,
    /* normale non fournie = surface fine à deux faces (bannières, voiles, feuilles, fenêtres) */
    tri(a,b,c,col,na,nb,nc){const n=na?null:nrm(a,b,c),tw=!na;push(a,na||n,col,tw);push(b,nb||n,col,tw);push(c,nc||n,col,tw);},
    quad(a,b,c,d,col,nn){if(nn){G.tri(a,b,c,col,nn,nn,nn);G.tri(a,c,d,col,nn,nn,nn);}else{G.tri(a,b,c,col);G.tri(a,c,d,col);}},
    /* boîte : x,y = coin nord-ouest, z = sol ; faces visibles seulement (dessus + 4 côtés) */
    box(x,y,z,w,d,h,col,top){const t=z+h,A=[x,y,t],B=[x+w,y,t],C=[x+w,y+d,t],D=[x,y+d,t];
      G.quad(A,B,C,D,top||col,[0,0,1]);
      G.quad([x,y+d,z],[x+w,y+d,z],C,D,col,[0,1,0]);G.quad([x+w,y,z],[x+w,y+d,z],C,B,col,[1,0,0]);G.quad([x,y,z],[x,y,t],B,[x+w,y,z],col,[0,-1,0]);G.quad([x,y,z],[x,y+d,z],D,A,col,[-1,0,0]);},
        cyl(x,y,z,r,h,col,n,top){n=r3Seg(r,n||12);for(let i=0;i<n;i++){const a0=i/n*6.2832,a1=(i+1)/n*6.2832,c0=Math.cos(a0),s0=Math.sin(a0),c1=Math.cos(a1),s1=Math.sin(a1);
      const p0=[x+c0*r,y+s0*r,z],p1=[x+c1*r,y+s1*r,z],q0=[p0[0],p0[1],z+h],q1=[p1[0],p1[1],z+h];
      G.tri(p0,p1,q1,col,[c0,s0,0],[c1,s1,0],[c1,s1,0]);G.tri(p0,q1,q0,col,[c0,s0,0],[c1,s1,0],[c0,s0,0]);
      if(top!==false)G.tri([x,y,z+h],q0,q1,top||col,[0,0,1],[0,0,1],[0,0,1]);}},
    dome(x,y,z,r,hk,col,n){n=r3Seg(r,n||14);const R=6;for(let j=0;j<R;j++){const b0=j/R*1.5708,b1=(j+1)/R*1.5708;
      for(let i=0;i<n;i++){const a0=i/n*6.2832,a1=(i+1)/n*6.2832,pt=(a,b)=>[x+Math.cos(a)*Math.cos(b)*r,y+Math.sin(a)*Math.cos(b)*r,z+Math.sin(b)*r*hk],nm=(a,b)=>{const v=[Math.cos(a)*Math.cos(b),Math.sin(a)*Math.cos(b),Math.sin(b)/hk];const l=Math.hypot(...v);return v.map(q=>q/l);};
        G.tri(pt(a0,b0),pt(a1,b0),pt(a1,b1),col,nm(a0,b0),nm(a1,b0),nm(a1,b1));G.tri(pt(a0,b0),pt(a1,b1),pt(a0,b1),col,nm(a0,b0),nm(a1,b1),nm(a0,b1));}}},
    /* sphère à facettes (octaèdre subdivisé) : arbustes, rochers, feuillages « low-poly » */
    ico(x,y,z,r,hk,col,rnd,jit){const o=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],F=[[0,2,4],[2,1,4],[1,3,4],[3,0,4],[2,0,5],[1,2,5],[3,1,5],[0,3,5]];jit=jit||0;
      const vp=new Map(),V=(a)=>{const k=a.map(q=>q.toFixed(4)).join();if(!vp.has(k)){const l=Math.hypot(...a),f=1+(rnd?(rnd()-.5)*jit:0);vp.set(k,a.map(q=>q/l*f));}return vp.get(k);};
      const mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2];
      for(const f of F){const a=o[f[0]],b=o[f[1]],c=o[f[2]],ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);
        for(const t of [[a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca]]){const q=t.map(v=>{const w=V(v);return [x+w[0]*r,y+w[1]*r,z+w[2]*r*hk];});
          if(R3D.facet){const sh=.92+(rnd?rnd():.5)*.16;G.tri(q[0],q[1],q[2],[col[0]*sh,col[1]*sh,col[2]*sh,1]);}
          else{const nn=t.map(v=>{const w=V(v),m=[w[0],w[1],w[2]/hk],l=Math.hypot(...m)||1;return m.map(c=>c/l);}),cc=t.map(v=>{const k=.82+.3*((V(v)[2]+1)/2);return [col[0]*k,col[1]*k,col[2]*k,1];});
            for(let m=0;m<3;m++){push(q[m],nn[m],cc[m]);}}}}},
    /* toit en pyramide sur une boîte */
    pyr(x,y,z,w,d,h,col,ov){ov=ov||0;const A=[x-ov,y-ov,z],B=[x+w+ov,y-ov,z],C=[x+w+ov,y+d+ov,z],D=[x-ov,y+d+ov,z],T=[x+w/2,y+d/2,z+h];
      const sl=Math.min(w,d)/2,k=sl/Math.max(h,.01),nf=(nx,ny)=>{const l=Math.hypot(nx,ny,k)||1;return [nx/l,ny/l,k/l];};G.tri(A,B,T,col,...Array(3).fill(nf(0,-1)));G.tri(B,C,T,col,...Array(3).fill(nf(1,0)));G.tri(C,D,T,col,...Array(3).fill(nf(0,1)));G.tri(D,A,T,col,...Array(3).fill(nf(-1,0)));},
    cone(x,y,z,r,h,col,n){n=r3Seg(r,n||10);const k=r/Math.max(h,.01);for(let i=0;i<n;i++){const a0=i/n*6.2832,a1=(i+1)/n*6.2832,am=(a0+a1)/2,nm=(a)=>{const cx=Math.cos(a),sy=Math.sin(a),l=Math.hypot(1,k);return [cx/l,sy/l,k/l];};G.tri([x+Math.cos(a0)*r,y+Math.sin(a0)*r,z],[x+Math.cos(a1)*r,y+Math.sin(a1)*r,z],[x,y,z+h],col,nm(a0),nm(a1),nm(am));}}
  };
  /* ---- niveaux de détail : chaque objet posé (boîte, cylindre, dôme, sphère…) est mesuré ; les petits objets sont classés
     en détail moyen (1) ou fin (2) et ne sont dessinés que lorsque l'île est assez grande à l'écran. Les surfaces (relief) restent au niveau 0. */
  G.objs=[];G._d=0;
  G.obj=(f)=>{if(G._d){return f();}G._d=1;const i0=P.length/3;let r;try{r=f();}finally{G._d=0;}const i1=P.length/3;if(i1>i0){
    let x0=1e9,y0=1e9,z0=1e9,x1=-1e9,y1=-1e9,z1=-1e9;for(let v=i0;v<i1;v++){const x=P[v*3],y=P[v*3+1],z=P[v*3+2];if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;if(z<z0)z0=z;if(z>z1)z1=z;}
    const sz=Math.max(x1-x0,y1-y0,z1-z0),lv=sz<R3_LOD.s3?3:sz<R3_LOD.s2?2:sz<R3_LOD.s1?1:0;if(lv)G.objs.push([i0,i1,lv]);}return r;};
  for(const nm of ['box','cyl','dome','ico','pyr','cone']){const f0=G[nm];G[nm]=(...a)=>G.obj(()=>f0(...a));}
  return G;
}
/* seuils des niveaux de détail (taille d'objet en unités de carte) et nombre de facettes utile pour un rayon donné */
const R3_LOD={s1:2.2,s2:.9,s3:.42,p1:1.1,p2:2.4,p3:5.2,on:true};
const r3Seg=(r,n,min)=>Math.max(Math.min(min||5,n),Math.min(n,Math.ceil(6.2832*Math.abs(r)*1.6)));
/* agrandit autour d'un point tout ce qui a été ajouté depuis i0 (sommets, empreintes d'ombre, mâts) */
function r3Scale(G,i0,t0,f0,tops,flags,ox,oy,oz,k){for(let i=i0;i<G.P.length;i+=3){G.P[i]=ox+(G.P[i]-ox)*k;G.P[i+1]=oy+(G.P[i+1]-oy)*k;G.P[i+2]=oz+(G.P[i+2]-oz)*k;}
  for(let i=t0;i<tops.length;i++){const b=tops[i];tops[i]=[ox+(b[0]-ox)*k,oy+(b[1]-oy)*k,ox+(b[2]-ox)*k,oy+(b[3]-oy)*k,oz+(b[4]-oz)*k];}
  for(let i=f0;i<flags.length;i++){const f=flags[i];flags[i]=[ox+(f[0]-ox)*k,oy+(f[1]-oy)*k,oz+(f[2]-oz)*k];}}
const r3c=(h,k)=>{const n=parseInt(h.slice(1),16);k=k||1;return [((n>>16)&255)/255*k,((n>>8)&255)/255*k,(n&255)/255*k,1];};
const r3mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t,a[3]+(b[3]-a[3])*t];
const r3ss=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};

/* ---------- Alabasta : relief ---------- */
function r3Alabasta(t,e){
  const R=t.rad,poly=e.poly25,np=poly.length/2;
  const rc=th=>{const f=((th+Math.PI)/6.2832)*np,i=Math.floor(f)%np,j=(i+1)%np,k=f-Math.floor(f);const r0=Math.hypot(poly[i*2],poly[i*2+1]),r1=Math.hypot(poly[j*2],poly[j*2+1]);return r0+(r1-r0)*k;};
  const S=41,LM=[.05*R,-.2*R],OA=[-.46*R,.02*R],PIER=[-.5*R,.72*R];
  const PL=3.4,MESA=5.6;
  const H=(x,y)=>{
    const r=Math.hypot(x,y),th=Math.atan2(y,x),c=rc(th),d=r/c;
    if(d>=1)return -.9*r3ss(1,1.22,d);                                    /* plateau sous-marin */
    const cliffy=fbm2(Math.cos(th)*1.6+3,Math.sin(th)*1.6+3,S,3)>.5;    /* côtes à falaises / côtes en pente douce */
    let h=.32*r3ss(1,.93,d);
    h+=PL*(cliffy?r3ss(.9,.84,d):r3ss(.95,.62,d));
    const dn=fbm2(x*.09+11,y*.09+3,S+7,4),ridge=1-Math.abs(dn*2-1);
    h+=1.35*ridge*ridge*r3ss(.86,.55,d);
    /* mesa du palais */
    const mx=(x-LM[0])/1.35,my=y-LM[1],md=Math.hypot(mx,my)/(.33*R);
    if(md<1.25){const k=r3ss(1.12,.86,md);h=h*(1-k)+MESA*k;}
    /* oasis : cuvette */
    const od=Math.hypot(x-OA[0],y-OA[1])/(.21*R);if(od<1.4){const k=r3ss(1.35,.75,od);h=h*(1-k)+.25*k;}
    return h;
  };
  return {H,LM,OA,PIER,R,rc,MESA,PL};
}

/* ---------- Alabasta : terrain + décor + bâtiments selon l'état ---------- */
function r3BuildAlabasta(t,e){
  const A=r3Alabasta(t,e),R=A.R,G=r3Geo(),rng=mulberry32(4101),rnd=()=>rng();
  const ext=1.24*R,N=150,step=2*ext/N;
  const col={sand:r3c('#f3d794'),dune:r3c('#e3ad5e'),wet:r3c('#dcc58f'),rock:r3c('#cf8450'),rock2:r3c('#a8603b'),grass:r3c('#74bf4a'),sea:[.42,.86,.84,1],deep:[.22,.66,.78,1]};
  const hz=[];for(let j=0;j<=N;j++){hz[j]=[];for(let i=0;i<=N;i++)hz[j][i]=A.H(-ext+i*step,-ext+j*step);}
  /* ombrage « à facettes » : normale et couleur communes à un groupe de F×F mailles (relief lisse, éclairage low-poly) */
  const F=4,facets=new Map();
  const hsh=k=>{const v=Math.sin(k*12.9898)*43758.5453;return v-Math.floor(v);};
  /* couleur du sol selon l'altitude, la pente et la position (commune aux deux modes d'ombrage) */
  const colorAt=(x,y,h,sl)=>{
    if(h<0)return r3mix(col.sea,col.deep,r3ss(0,-.9,h));
    let c=r3mix(col.wet,col.sand,r3ss(.05,.3,h));
    c=r3mix(c,col.dune,r3ss(1.6,2.8,h)*.65*(.5+.5*fbm2(x*.2,y*.2,9,2)));
    const od=Math.hypot(x-A.OA[0],y-A.OA[1])/(.21*R);if(od<1.55)c=r3mix(col.grass,c,r3ss(.95,1.5,od));
    if(sl>.2){const band=.5+.5*Math.sin(h*7.5+fbm2(x*.3,y*.3,4,2)*3);c=r3mix(c,r3mix(col.rock,col.rock2,band),r3ss(.2,.42,sl));}
    /* pied de falaise plus sombre (volume) */
    return c;};
  const aAt=(i,j)=>{const h=hz[j][i];if(h>=0)return 1;const x=-ext+i*step,y=-ext+j*step,r=Math.hypot(x,y),c0=A.rc(Math.atan2(y,x));return (1-r3ss(c0*1.02,c0*1.2,r))*.85;};
  const nAt=(i,j)=>{const a=hz[j][Math.max(0,i-1)],b=hz[j][Math.min(N,i+1)],c=hz[Math.max(0,j-1)][i],d=hz[Math.min(N,j+1)][i];const v=[(a-b)/(2*step),(c-d)/(2*step),1];const l=Math.hypot(...v);return v.map(q=>q/l);};
  const facet=(i,j,upper)=>{const ci=Math.floor(i/F),cj=Math.floor(j/F),id=(cj*(N/F)+ci)*2+(upper?0:1);let f=facets.get(id);if(f)return f;
    const X=a=>-ext+(ci+a)*F*step,Y=b=>-ext+(cj+b)*F*step,hh=(a,b)=>hz[Math.min(N,(cj+b)*F)][Math.min(N,(ci+a)*F)];
    const P=upper?[[X(0),Y(0),hh(0,0)],[X(1),Y(0),hh(1,0)],[X(1),Y(1),hh(1,1)]]:[[X(0),Y(0),hh(0,0)],[X(1),Y(1),hh(1,1)],[X(0),Y(1),hh(0,1)]];
    const u=[P[1][0]-P[0][0],P[1][1]-P[0][1],P[1][2]-P[0][2]],v=[P[2][0]-P[0][0],P[2][1]-P[0][1],P[2][2]-P[0][2]];
    let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];const l=Math.hypot(...n)||1;n=n.map(q=>q/l);if(n[2]<0)n=n.map(q=>-q);
    const cx=(P[0][0]+P[1][0]+P[2][0])/3,cy=(P[0][1]+P[1][1]+P[2][1])/3,h=(P[0][2]+P[1][2]+P[2][2])/3,j2=.93+hsh(id)*.14,c=colorAt(cx,cy,h,1-n[2]);
    f={n,c:[c[0]*j2,c[1]*j2,c[2]*j2,1]};facets.set(id,f);return f;};
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){
    const xs=[-ext+i*step,-ext+(i+1)*step],ys=[-ext+j*step,-ext+(j+1)*step];
    const v=(a,b)=>[xs[a],ys[b],hz[j+b][i+a]];
    if(hz[j][i]<-.85&&hz[j+1][i+1]<-.85&&hz[j][i+1]<-.85&&hz[j+1][i]<-.85)continue;
    if(R3D.facet){
      const li=i%F,lj=j%F,fa=li>=lj?facet(i,j,true):facet(i,j,false),fb=li>lj?facet(i,j,true):facet(i,j,false);
      const tris=[[[0,0],[1,0],[1,1],fa],[[0,0],[1,1],[0,1],fb]];
      for(const [p,q,r,f] of tris)for(const [a,b] of [p,q,r]){G.P.push(...v(a,b));G.N.push(...f.n);G.Cl.push(f.c[0],f.c[1],f.c[2],aAt(i+a,j+b));G.Tw.push(0);}
    }else{
      /* ombrage doux : normales et couleurs par sommet (collines et falaises arrondies) */
      for(const [p,q,r] of [[[0,0],[1,0],[1,1]],[[0,0],[1,1],[0,1]]])for(const [a,b] of [p,q,r]){const P=v(a,b),n=nAt(i+a,j+b),c=colorAt(P[0],P[1],P[2],1-n[2]);G.P.push(...P);G.N.push(...n);G.Cl.push(c[0],c[1],c[2],aAt(i+a,j+b));G.Tw.push(0);}
    }
  }
  const terrainEnd=G.P.length/3;
  const Hs=(x,y)=>A.H(x,y);
  const tops=[];  /* empreintes [x0,y0,x1,y1,zTop] pour les ombres */
  const B=(x,y,w,d,h,c,top)=>{const z=Math.min(Hs(x,y),Hs(x+w,y),Hs(x,y+d),Hs(x+w,y+d))-.05;G.box(x,y,z,w,d,h+.05,c,top);tops.push([x,y,x+w,y+d,z+h]);return z+h;};
  /* --- palais du désert (mesa) --- */
  const [lx,ly]=A.LM,mz=A.MESA,wall=r3c('#efe2c2'),wall2=r3c('#e2cfa6'),gold=r3c('#d9a441'),teal=r3c('#3f9f9a'),dark=r3c('#5a3b22');
  const owner=t.owner>=0?players[t.owner]:null,oc=owner?r3c(COLORS[t.owner]):r3c('#d8cfb0'),crew=owner?CREWS[owner.crew||0].id:'';
  const towers=[],pI=G.P.length,pT=tops.length;
  G.box(lx-5,ly-2.6,mz-.05,10,6.2,.7,wall2);tops.push([lx-5,ly-2.6,lx+5,ly+3.6,mz+.65]);
  const z1=mz+.65;
  G.box(lx-3,ly-1.6,z1,6,3.8,2.5,wall);tops.push([lx-3,ly-1.6,lx+3,ly+2.2,z1+2.5]);
  G.cyl(lx,ly+.3,z1+2.5,1.75,.45,wall2,16);G.dome(lx,ly+.3,z1+2.95,1.6,1.05,gold,16);G.cyl(lx,ly+.3,z1+2.95+1.65,.08,.7,dark,6,false);
  tops.push([lx-1.7,ly-1.4,lx+1.7,ly+2,z1+4.6]);
  for(const sx of [-1,1]){G.box(lx+sx*3.1-(sx>0?0:2.4),ly-.9,z1,2.4,3,1.7,wall2);tops.push([lx+sx*3.1-(sx>0?0:2.4),ly-.9,lx+sx*3.1+(sx>0?2.4:0),ly+2.1,z1+1.7]);
    for(let k=0;k<4;k++)G.box(lx+sx*3.1-(sx>0?0:2.4)+k*.66,ly+2.05,z1+1.7,.32,.18,.28,wall2);
    G.dome(lx+sx*4.3,ly+.6,z1+1.7,.75,1.1,teal,12);}
  for(const [dx,dy] of [[-4.6,-2.2],[4.6,-2.2],[-4.6,3.2],[4.6,3.2]]){G.cyl(lx+dx,ly+dy,z1-.6,.55,4.1,wall,12);G.dome(lx+dx,ly+dy,z1+3.5,.62,1.3,gold,12);towers.push([lx+dx,ly+dy,z1+4.4]);tops.push([lx+dx-.55,ly+dy-.55,lx+dx+.55,ly+dy+.55,z1+4.3]);}
  /* détails de façade : fenêtres en arc sur deux niveaux, tambour du dôme, portique à colonnes, balcons des minarets */
  {const wd=r3c('#3b5f66'),fy=ly+2.22;
    for(let k=0;k<5;k++){const wx=lx-2.3+k*1.15;if(Math.abs(wx-lx)<.5)continue;G.quad([wx-.22,fy,z1+.35],[wx+.22,fy,z1+.35],[wx+.22,fy,z1+1.25],[wx-.22,fy,z1+1.25],wd);G.tri([wx-.22,fy,z1+1.25],[wx+.22,fy,z1+1.25],[wx,fy,z1+1.6],wd);
      G.quad([wx-.18,fy,z1+1.65],[wx+.18,fy,z1+1.65],[wx+.18,fy,z1+2.2],[wx-.18,fy,z1+2.2],wd);}
    for(let k=0;k<8;k++){const a=k/8*6.2832;G.box(lx+Math.cos(a)*1.78-.09,ly+.3+Math.sin(a)*1.78-.09,z1+2.55,.18,.18,.3,wd);}
    for(const dx of [-1.5,-.5,.5,1.5])G.cyl(lx+dx,ly+2.75,z1,.14,1.5,wall,8);
    G.box(lx-1.85,ly+2.55,z1+1.5,3.7,.5,.22,gold);tops.push([lx-1.85,ly+2.55,lx+1.85,ly+3.05,z1+1.7]);
    for(const [dx,dy] of [[-4.6,-2.2],[4.6,-2.2],[-4.6,3.2],[4.6,3.2]]){G.cyl(lx+dx,ly+dy,z1+1.9,.72,.14,gold,12);G.cyl(lx+dx,ly+dy,z1+3.0,.7,.14,gold,12);}
    /* petits dômes d'angle sur le toit de la nef */
    for(const dx of [-2.3,2.3])G.dome(lx+dx,ly-.6,z1+2.5,.55,1,teal,10);}
  /* porte + escalier vers le sud */
  G.box(lx-.8,ly+2.15,z1,1.6,.2,1.5,dark);
  for(let k=0;k<6;k++){const zz=mz-k*.48;G.box(lx-1.1,ly+3.6+k*.55,Math.max(A.H(lx,ly+3.6+k*.55)-.05,zz-.5),2.2,.6,.45,wall2);}
  /* bannières du camp propriétaire (forme selon le camp) */
  const ban=(x,y,z)=>{const w=.5,h=1.25;
    if(crew==='pirate'){G.tri([x-w/2,y,z],[x+w/2,y,z],[x,y,z-h],oc);}
    else if(crew==='chasseur'){G.quad([x-w/2,y,z],[x+w/2,y,z],[x+w/2,y,z-h],[x-w/2,y,z-h],oc);G.tri([x-w/2,y+.001,z-h],[x+w/2,y+.001,z-h],[x,y+.001,z-h*.7],wall);}
    else if(crew==='revo'){G.quad([x-w/3,y,z],[x+w/3,y,z],[x+w/3,y,z-h*1.4],[x-w/3,y,z-h*1.4],oc);}
    else{G.quad([x-w/2,y,z],[x+w/2,y,z],[x+w/2,y,z-h],[x-w/2,y,z-h],oc);if(crew==='marine'){G.quad([x-w/2,y-.002,z-h*.15],[x+w/2,y-.002,z-h*.15],[x+w/2,y-.002,z-h*.28],[x-w/2,y-.002,z-h*.28],r3c('#ffffff'));}}};
  for(const bx of [-2.2,-1.1,1.1,2.2])ban(lx+bx,ly+2.27,z1+2.25);
  r3Scale(G,pI,pT,0,tops,towers,lx,ly,mz,1.85);
  /* --- oasis : palmiers --- */
  const palm=(x,y,s)=>{const z=Hs(x,y),tk=r3c('#8a5f38'),lf=r3mix(r3c('#4f8f3a'),r3c('#77b24a'),rnd());const lean=[(rnd()-.5)*.5,(rnd()-.5)*.5];let px=x,py=y,pz=z;
    for(let k=0;k<5;k++){const nx=x+lean[0]*(k+1)*s*.3,ny=y+lean[1]*(k+1)*s*.3,nz=z+(k+1)*.6*s;G.cyl(px,py,pz,.14*s*(1-k*.08),nz-pz+.02,tk,6,false);px=nx;py=ny;pz=nz;}
    tops.push([x-.3,y-.3,x+.3,y+.3,pz]);
    for(let f=0;f<7;f++){const a=f/7*6.2832+rnd()*.4;let ax=px,ay=py,az=pz;for(let k=0;k<4;k++){const L=.55*s,bx=ax+Math.cos(a)*L,by=ay+Math.sin(a)*L,bz=az+(.25-k*.32)*s,w=(.32-k*.06)*s,px2=-Math.sin(a)*w,py2=Math.cos(a)*w;
      G.quad([ax-px2,ay-py2,az],[ax+px2,ay+py2,az],[bx+px2*.7,by+py2*.7,bz],[bx-px2*.7,by-py2*.7,bz],lf);ax=bx;ay=by;az=bz;}}};
  {const od=.21*R;for(let k=0;k<14;k++){const a=rnd()*6.283,d=od*(.9+rnd()*.5);palm(A.OA[0]+Math.cos(a)*d,A.OA[1]+Math.sin(a)*d*.9,.9+rnd()*.5);}}
  /* --- végétation et rochers « low-poly » : arbustes ronds, tamaris, blocs de grès --- */
  {const shr=[r3c('#6fb84a'),r3c('#8cc858'),r3c('#5da53f')],stone=[r3c('#d29461'),r3c('#bf7a4b'),r3c('#e0aa74')];
    const okSpot=(x,y,m)=>{const r=Math.hypot(x,y),c=A.rc(Math.atan2(y,x));return r<c*m&&Hs(x,y)>.25&&Math.hypot((x-lx)/1.35,y-ly)>.36*R;};
    for(let k=0,n=0;k<400&&n<26;k++){const a=rnd()*6.283,d=A.OA?(.12+rnd()*.5)*R:0;const x=A.OA[0]+Math.cos(a)*d*1.5,y=A.OA[1]+Math.sin(a)*d*1.2;
      if(!okSpot(x,y,.86)||Math.hypot(x-A.OA[0],y-A.OA[1])<.2*R)continue;const z=Hs(x,y),r=.55+rnd()*.5;
      G.cyl(x,y,z-.05,.1,.6,r3c('#7a5634'),5,false);G.ico(x,y,z+.55+r*.5,r,.8,shr[(rnd()*3)|0],rnd,.18);tops.push([x-r,y-r,x+r,y+r,z+.6+r*1.2]);n++;}
    for(let k=0,n=0;k<400&&n<16;k++){const a=rnd()*6.283,d=(.45+rnd()*.42)*A.rc(a),x=Math.cos(a)*d,y=Math.sin(a)*d;
      if(!okSpot(x,y,.9)||Math.hypot(x-A.OA[0],y-A.OA[1])<.24*R)continue;const z=Hs(x,y),r=.5+rnd()*.9;
      G.ico(x,y,z+r*.15,r,.62,stone[(rnd()*3)|0],rnd,.34);tops.push([x-r*.8,y-r*.8,x+r*.8,y+r*.8,z+r*.7]);n++;}}
  /* --- ville : selon l'état réel (village, puis niveaux 1 à 3) --- */
  const lvl=t.city?t.city.lvl:0,nH=[5,10,18,28][lvl],houses=[];
  const zoneOK=(x,y,w)=>{const r=Math.hypot(x,y),c=A.rc(Math.atan2(y,x));if(r>c*.8)return false;
    if(Math.hypot((x-lx)/1.35,y-ly)<.4*R)return false;if(Math.hypot(x-A.OA[0],y-A.OA[1])<.27*R)return false;
    const h0=Hs(x,y),h1=Hs(x+w,y),h2=Hs(x,y+w);if(Math.abs(h0-h1)>.45||Math.abs(h0-h2)>.45)return false;return !houses.some(q=>Math.abs(q[0]-x)<q[2]+.4&&Math.abs(q[1]-y)<q[2]+.4);};
  const hc=[r3c('#e8cf9c'),r3c('#e0bd85'),r3c('#d9b07a'),r3c('#efdcb4')],aw=[r3c('#b9483a'),r3c('#3f8f8a'),r3c('#d7a13e'),r3c('#7c4f9a')];
  for(let k=0;k<nH*40&&houses.length<nH;k++){
    const x=R*(.05+rnd()*.55),y=R*(.02+rnd()*.6)*(rnd()<.25?-1:1),w=1.5+rnd()*.9;if(!zoneOK(x,y,w))continue;houses.push([x,y,w]);
    const d=1.3+rnd()*.8,h=1.2+rnd()*(.6+lvl*.45),c=hc[(rnd()*4)|0],top=B(x,y,w,d,h,c,r3c('#f1e2bf'));
    for(let q=0;q<Math.max(2,Math.round(w*1.6));q++)G.box(x+.25+q*.55,y+d+.001,top-h+.45,.24,.04,.4,dark);
    if(rnd()<.55&&lvl>=1){const rc=aw[(rnd()*4)|0];G.pyr(x,y,top,w,d,.5+Math.min(w,d)*.55,rc,.12);tops.push([x,y,x+w,y+d,top+.8]);}
    else{G.box(x-.05,y-.05,top,w+.1,.1,.18,c);G.box(x-.05,y+d-.05,top,w+.1,.1,.18,c);}
    if(rnd()<.35){const a=aw[(rnd()*4)|0],zz=top-h+.7;G.quad([x+.1,y+d,zz],[x+w-.1,y+d,zz],[x+w-.1,y+d+.45,zz-.25],[x+.1,y+d+.45,zz-.25],a);}
    if(lvl>=2&&rnd()<.15){G.dome(x+w/2,y+d/2,top,Math.min(w,d)*.35,1,teal,10);}
  }
  const has=b=>!!(t.city&&t.city.b.includes(b));
  /* Port marchand : quai, navire, étals */
  if(has('marche')||lvl>=1){const [qx,qy]=A.PIER,sI=G.P.length,sT=tops.length,sF=towers.length;const pz=.18,wood=r3c('#7b5733'),wood2=r3c('#5f4226');
    G.box(qx-.5,qy-2.5,pz,1.1,6,.18,wood);for(let k=0;k<6;k++){G.cyl(qx-.45,qy-2.2+k*1.1,-.8,.09,1.2,wood2,5);G.cyl(qx+.55,qy-2.2+k*1.1,-.8,.09,1.2,wood2,5);}
    if(has('marche')){/* navire marchand amarré, vu de flanc : coque est-ouest, voiles face au sud */
      const sx=qx+1.4,sy=qy+1.3,hull=r3c('#6b4428'),deck=r3c('#9b7048'),sail=r3c('#f2ead6');
      G.box(sx-2.2,sy-.7,-.3,4.4,1.4,.85,hull,deck);G.box(sx+2.2,sy-.45,-.15,.7,.9,.6,hull,deck);G.box(sx-2.6,sy-.55,.2,.6,1.1,.75,hull,deck);
      for(let k=0;k<4;k++)G.box(sx-1.6+k*.9,sy+.71,.12,.25,.02,.18,r3c('#3a2614'));
      for(const [mx,mh,sw] of [[-.8,3.6,1.9],[.9,3.1,1.6]]){G.cyl(sx+mx,sy,.55,.08,mh,wood2,6,false);
        G.quad([sx+mx-sw/2,sy+.12,.55+mh-.3],[sx+mx+sw/2,sy+.12,.55+mh-.3],[sx+mx+sw/2*1.1,sy+.25,1.3],[sx+mx-sw/2*1.1,sy+.25,1.3],sail);}
      towers.push([sx-.8,sy,4.2]);
      r3Scale(G,sI,sT,sF,tops,towers,qx,qy,0,1.6);
      for(let k=0;k<4;k++){const x=qx+1.5+k*1.6,y=qy-4.6,z=Hs(x,y);if(z<.1)continue;G.box(x,y,z,1.3,1,.9,r3c('#c9a26e'));G.quad([x-.1,y+1,z+1.3],[x+1.4,y+1,z+1.3],[x+1.4,y+1.7,z+.8],[x-.1,y+1.7,z+.8],aw[k%4]);}}}
  /* Fortin : enceinte et tours autour de la ville */
  if(has('muraille')){const cx0=.33*R,cy0=.3*R,rr=.36*R,st=r3c('#d7bf91');for(let k=0;k<26;k++){const a=-1.1+k/26*3.9,x=cx0+Math.cos(a)*rr,y=cy0+Math.sin(a)*rr*.85;const r=Math.hypot(x,y);if(r>A.rc(Math.atan2(y,x))*.88)continue;
      B(x-.45,y-.45,.9,.9,1.1,st);if(k%2===0)G.box(x-.45,y-.45,Hs(x,y)+1.1,.35,.35,.3,st);
      if(k%6===0){G.cyl(x,y,Hs(x,y)-.1,.55,2.1,st,10);G.cone(x,y,Hs(x,y)+2,.7,.9,r3c('#b9483a'),10);towers.push([x,y,Hs(x,y)+3.1]);tops.push([x-.55,y-.55,x+.55,y+.55,Hs(x,y)+2.9]);}}}
  /* Camp d'entraînement : tentes et cour */
  if(has('caserne')){const x0=-.12*R,y0=.45*R;for(let k=0;k<5;k++){const x=x0+(k%3)*1.6,y=y0+Math.floor(k/3)*1.6,z=Hs(x,y);if(Math.hypot(x,y)>A.rc(Math.atan2(y,x))*.85)continue;
      G.cone(x,y,z,.75,1.05,k%2?r3c('#e9dfc8'):oc,4);}
    G.cyl(x0-1.3,y0+.6,Hs(x0-1.3,y0+.6),.06,2.4,r3c('#5a3b22'),5,false);towers.push([x0-1.3,y0+.6,Hs(x0-1.3,y0+.6)+2.4]);}
  /* drapeaux animés (dessinés par le moteur 2.5D à chaque image) */
  const flags=towers.slice(0,6);
  return {G,terrainEnd,tops,flags,A};
}

/* ---------- WebGL : programme, carte des hauteurs pour les ombres, photo ---------- */
const R3_VS='attribute vec3 p;attribute vec3 n;attribute vec4 c;uniform vec4 V;uniform float K;varying vec3 w;varying vec3 nn;varying vec4 cc;'
 +'void main(){w=p;nn=n;cc=c;gl_Position=vec4((V.x+p.x*K)/V.z*2.-1.,1.-(V.y+(p.y-p.z)*K)/V.w*2.,-(p.y+p.z)/140.,1.);}';
const R3_FS='precision highp float;varying vec3 w;varying vec3 nn;varying vec4 cc;uniform sampler2D HT;uniform vec4 HB;uniform vec3 L;uniform float HM;'
 +'float hAt(vec2 q){vec2 u=(q-HB.xy)/HB.zw;if(u.x<0.||u.y<0.||u.x>1.||u.y>1.)return -9.;vec4 t=texture2D(HT,u);return (t.r*255.*256.+t.g*255.)/65535.*HM-1.;}'
 +'void main(){vec3 N=normalize(nn);if(dot(N,vec3(0.,.6,.8))<0.)N=-N;'
 +'float sh=1.;vec3 q=w+N*.38;for(int i=1;i<34;i++){vec3 r=q+L*(float(i)*.28);if(hAt(r.xy)>r.z+.12){sh=0.;break;}}'
 +'float ao=0.;for(int i=0;i<8;i++){float a=float(i)*.785;vec2 o=vec2(cos(a),sin(a))*1.1;ao+=clamp((hAt(w.xy+o)-w.z)/1.4,0.,1.);}ao=1.-ao/8.*.38*clamp(N.z,0.,1.);'
 +'float df=max(dot(N,L),0.);vec3 sky=vec3(.62,.70,.86),sun=vec3(1.05,.96,.82);'
 +'vec3 col=cc.rgb*(sky*(.70+.14*N.z)*ao+sun*df*mix(.50,1.,sh)*.60);'
 +'float lum=dot(col,vec3(.3,.59,.11));col=mix(vec3(lum),col,1.16);col+=cc.rgb*vec3(.06,.04,.01)*(1.-N.z);'
 +'gl_FragColor=vec4(col*cc.a,cc.a);}';
function r3Gl(){
  if(R3D.gl||R3D.fail)return R3D.gl;
  try{
    const cv=document.createElement('canvas'),gl=cv.getContext('webgl',{premultipliedAlpha:true,preserveDrawingBuffer:true,antialias:true,alpha:true});
    if(!gl)throw new Error('WebGL indisponible');
    const sh=(ty,src)=>{const s=gl.createShader(ty);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
    const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,R3_VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,R3_FS));gl.linkProgram(pr);
    if(!gl.getProgramParameter(pr,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(pr));
    R3D.gl=gl;R3D.cv=cv;R3D.prog=pr;
    cv.addEventListener('webglcontextlost',()=>{R3D.gl=null;R3D.fail='contexte perdu';});
  }catch(err){R3D.fail=String(err&&err.message||err);}
  return R3D.gl;
}
/* carte des hauteurs (relief + sommets des bâtiments) codée sur 16 bits pour les ombres et l'occlusion */
function r3HeightTex(gl,M,ext){
  const S=256,HM=32,A=new Uint8Array(S*S*4),cell=2*ext/S;
  const hf=new Float32Array(S*S);
  for(let j=0;j<S;j++)for(let i=0;i<S;i++)hf[j*S+i]=M.A.H(-ext+(i+.5)*cell,-ext+(j+.5)*cell);
  /* sommets des bâtiments : on remplit seulement leur empreinte */
  for(const b of M.tops){const i0=Math.max(0,Math.floor((b[0]+ext)/cell)),i1=Math.min(S-1,Math.ceil((b[2]+ext)/cell)),j0=Math.max(0,Math.floor((b[1]+ext)/cell)),j1=Math.min(S-1,Math.ceil((b[3]+ext)/cell));
    for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++)if(b[4]>hf[j*S+i])hf[j*S+i]=b[4];}
  for(let q=0;q<S*S;q++){const v=Math.max(0,Math.min(65535,Math.round((hf[q]+1)/HM*65535))),k=q*4;A[k]=v>>8;A[k+1]=v&255;A[k+2]=0;A[k+3]=255;}
  const tx=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tx);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,S,S,0,gl.RGBA,gl.UNSIGNED_BYTE,A);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  return {tx,HM,ext};
}
const r3Key=t=>[t.owner,t.owner>=0&&players[t.owner]?players[t.owner].crew:-1,t.city?t.city.lvl:0,t.city?t.city.b.slice().sort().join(','):'',t.capital?1:0].join('|');
function r3Bake(t,e){
  const t0=performance.now(),gl=r3Gl();if(!gl)return false;
  const M=r3BuildAlabasta(t,e),K=8,SS=R3D.SS,ext=1.24*t.rad,zmax=18;
  const Wc=Math.ceil(2*ext*K),Hc=Math.ceil((2*ext+zmax)*K),C=ext*K,CY=(ext+zmax)*K;
  const cv=R3D.cv;cv.width=Wc*SS;cv.height=Hc*SS;gl.viewport(0,0,cv.width,cv.height);
  gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  const pr=R3D.prog;gl.useProgram(pr);
  const HT=r3HeightTex(gl,M,ext);
  gl.uniform4f(gl.getUniformLocation(pr,'V'),C*SS,CY*SS,Wc*SS,Hc*SS);gl.uniform1f(gl.getUniformLocation(pr,'K'),K*SS);
  gl.uniform4f(gl.getUniformLocation(pr,'HB'),-ext,-ext,2*ext,2*ext);gl.uniform3f(gl.getUniformLocation(pr,'L'),...R3_SUN);gl.uniform1f(gl.getUniformLocation(pr,'HM'),HT.HM);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,HT.tx);gl.uniform1i(gl.getUniformLocation(pr,'HT'),0);
  const bufs=[];const attr=(name,data,n)=>{const b=gl.createBuffer();bufs.push(b);gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);const l=gl.getAttribLocation(pr,name);gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,n,gl.FLOAT,false,0,0);};
  attr('p',M.G.P,3);attr('n',M.G.N,3);attr('c',M.G.Cl,4);
  const nv=M.G.P.length/3;
  /* le fond marin semi-transparent d'abord (sans écrire la profondeur), puis tout le reste */
  gl.drawArrays(gl.TRIANGLES,0,nv);
  /* écume : bande blanche le long de la côte + liseré clair plus au large (alpha dégradé, posés sur l'eau) */
  {const fv=[],fc=[],fn=[];const ring=(k0,k1,a0,a1,rgb)=>{const n=96;for(let i=0;i<n;i++){const t0=i/n*6.2832-3.1416,t1=(i+1)/n*6.2832-3.1416,r0=M.A.rc(t0),r1=M.A.rc(t1);
      const P=(t,r,k)=>[Math.cos(t)*r*k,Math.sin(t)*r*k,.03];
      const q=[[t0,r0,k0,a0],[t0,r0,k1,a1],[t1,r1,k1,a1],[t0,r0,k0,a0],[t1,r1,k1,a1],[t1,r1,k0,a0]];
      for(const [tt,rr,kk,aa] of q){fv.push(...P(tt,rr,kk));fn.push(0,0,1);fc.push(rgb[0],rgb[1],rgb[2],aa);}}};
    ring(1.0,1.09,.95,0,[1,1,1]);ring(1.17,1.2,.0,.0,[1,1,1]);ring(1.2,1.215,.55,.55,[1,.93,.7]);
    attr('p',fv,3);attr('n',fn,3);attr('c',fc,4);gl.drawArrays(gl.TRIANGLES,0,fv.length/3);}
  /* eau de l'oasis */
  const wv=[],R=t.rad,ox=M.A.OA[0],oy=M.A.OA[1],orr=.2*R,wz=.62;for(let i=0;i<24;i++){const a0=i/24*6.2832,a1=(i+1)/24*6.2832;wv.push(ox,oy,wz,ox+Math.cos(a0)*orr*1.05,oy+Math.sin(a0)*orr*.95,wz,ox+Math.cos(a1)*orr*1.05,oy+Math.sin(a1)*orr*.95,wz);}
  const wn=[],wc=[];for(let i=0;i<wv.length/3;i++){wn.push(0,0,1);wc.push(.16,.52,.62,.82);}
  attr('p',wv,3);attr('n',wn,3);attr('c',wc,4);gl.drawArrays(gl.TRIANGLES,0,wv.length/3);
  /* image finale : réduite ×SS (anticrénelage) */
  const out=document.createElement('canvas');out.width=Wc;out.height=Hc;const g=out.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(cv,0,0,Wc,Hc);
  for(const b of bufs)gl.deleteBuffer(b);gl.deleteTexture(HT.tx);
  /* drapeaux : position monde (îles = image posée à t.x - C/K, t.y - CY/K) */
  const flags=M.flags.map(([x,y,z])=>[t.x+x,t.y+y-z]);
  e.fx3={flags,smoke:[],glow:[],mill:[],fountain:[]};
  e.r3={cv:out,meta:{Wc,Hc,C,CY,K},key:r3Key(t),tris:nv/3};
  R3D.ms=Math.round(performance.now()-t0);R3D.bakes++;
  return true;
}
/* applique (ou retire) la photo 3D sur l'entrée du cache, sans toucher au 2.5D gardé à côté */
function r3Apply(t,e){
  if(!e.k25){e.k25={full:e.full,small:e.small,meta:e.meta,fx:e.fx,blob:e.blob};e.poly25=e.poly;}
  if(R3D.on&&e.r3){const r=e.r3;e.full=r.cv;e.blob=null;e.meta=r.meta;e.fx=e.fx3;e.mid=null;e.banner=null;
    const s=document.createElement('canvas');s.width=Math.ceil(r.meta.Wc/4);s.height=Math.ceil(r.meta.Hc/4);const g=s.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(r.cv,0,0,s.width,s.height);e.small=s;e.is3=true;}
  else if(e.is3){const k=e.k25;e.full=k.full;e.small=k.small;e.meta=k.meta;e.fx=k.fx;e.blob=k.blob;e.mid=null;e.banner=null;e.is3=false;}
  dirty=true;
}
function r3Check(t,e){
  if(!R3D.isl[t.name]||R3D.fail)return;
  if(!e.poly25&&e.poly)e.poly25=e.poly;
  if(!R3D.on){if(e.is3)r3Apply(t,e);return;}
  const k=r3Key(t);
  if(e.r3&&e.r3.key===k){if(!e.is3)r3Apply(t,e);return;}
  /* nouvelle photo : au plus une par image, hors du chemin de dessin */
  if(R3D.pend.has(t.id))return;R3D.pend.add(t.id);
  setTimeout(()=>{R3D.pend.delete(t.id);try{if(!e.k25)r3Apply(t,e);if(r3Bake(t,e))r3Apply(t,e);}catch(err){R3D.fail=String(err&&err.message||err);if(e.is3){R3D.on=false;r3Apply(t,e);}}},0);
}
function r25Draw(t,e,now,u){r3Check(t,e);r25Draw_o(t,e,now,u);}

/* ---------- mer turquoise (version test) : même grille que la mer du 2.5D, zones spéciales conservées ---------- */
function r3SeaMake(src){
  const w=src.width,h=src.height,g=src.getContext('2d'),im=g.getImageData(0,0,w,h),d=im.data,cv=document.createElement('canvas');cv.width=w;cv.height=h;
  const o=cv.getContext('2d'),out=o.createImageData(w,h),q=out.data,mix=(a,b,t)=>a+(b-a)*t;
  for(let i=0;i<w*h;i++){const k=i*4,r=d[k],gg=d[k+1],b=d[k+2],gy=(i/w)|0,gx=i-gy*w;
    if((r<=20&&gg<=50)||r>100){q[k]=r;q[k+1]=gg;q[k+2]=b;q[k+3]=255;continue;}   /* Calm Belt et Red Line inchangés */
    const X=gx*CELL+1,Y=gy*CELL+1,t=seaTint(X,Y),wv=Math.sin(gx*.09+gy*.05)+Math.sin(gx*.04-gy*.11),dep=Math.min(1,Math.abs(Y-440)/300),
      m=Math.max(0,Math.min(1,dep*.55+(.5-wv*.2)*.4)),cs=Math.sin(gx*.55+Math.sin(gy*.3)*2)*Math.sin(gy*.47+gx*.12),cl=cs>.9?(cs-.9)*260:0;
    q[k]=Math.min(255,mix(70,26,m)+t[0]*.5+cl*.8);q[k+1]=Math.min(255,mix(198,132,m)+t[1]*.5+cl);q[k+2]=Math.min(255,mix(218,186,m)+t[2]*.5+cl*.9);q[k+3]=255;}
  o.putImageData(out,0,0);return cv;}
const r25SeaBuild_o=r25SeaBuild;
r25SeaBuild=function(){r25SeaBuild_o();R25.sea25=R25.sea;try{if(!R3D.sea3)R3D.sea3=r3SeaMake(R25.sea25);R25.sea=R3D.on&&!R3D.fail?R3D.sea3:R25.sea25;}catch(err){R3D.sea3=null;}};
function r3SeaSwap(){if(R25.sea25&&R3D.sea3){R25.sea=R3D.on&&!R3D.fail?R3D.sea3:R25.sea25;dirty=true;}}
function r3Toggle(){R3D.on=!R3D.on;try{localStorage.setItem('rk-3d',R3D.on?'1':'0');}catch(_){}
  for(const e of R25.cache.values())if(R3D.isl[e.name]&&(e.is3||e.r3))r3Apply(terrs[e.id],e);
  r3SeaSwap();const b=$('#z-3d');if(b){b.classList.toggle('on',R3D.on);b.setAttribute('aria-pressed',R3D.on);}
  toast(R3D.fail?'Prototype 3D indisponible : '+R3D.fail:R3D.on?'Prototype 3D activé (Alabasta).':'Prototype 3D désactivé : rendu 2.5D.');}
{const b=document.getElementById('z-3d');if(b){b.addEventListener('click',r3Toggle);b.classList.toggle('on',R3D.on);b.setAttribute('aria-pressed',R3D.on);}}
