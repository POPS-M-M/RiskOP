/* ================= MONDE 3D (version test) : carte parcourable en perspective =================
   Remplace le DESSIN de la carte (pas ses règles) : une scène WebGL (mer + îles en volume) sous le canvas 2D de la carte,
   qui sert de couche d'interface (routes, armées, jetons de troupes, noms) dessinée par-dessus en projection.
   Tout le reste est inchangé : territoires et grille logique (terrAt), V (zoom/centre), clics, mini-carte, règles.
   Les clics passent par pos(e) : le rayon de la caméra est projeté sur la mer puis sur la grille logique d'origine.
   Sans WebGL (ou en cas d'erreur), le jeu retombe sur la carte à plat d'origine. */
const W3={on:true,act:false,gl:null,cv:null,fail:'',cam:{yaw:0,pitch:.95},models:new Map(),q:[],seaTex:null,ms:0,frames:0,tris:0,built:0,c:null,drawMs:0};
try{if(localStorage.getItem('rk-w3')==='0')W3.on=false;}catch(_){}
const W3_FOVY=36*Math.PI/180;

/* ---------- caméra ---------- */
function w3Cam(cx,cy,yaw,pitch,D0){
  const c=W3.cam,k=V.k;if(cx===undefined){cx=V.x+W/k/2;cy=V.y+H/k/2;}
  const asp=canvas.width/canvas.height,ty=Math.tan(W3_FOVY/2),tx=ty*asp,D=D0||(W/k/2)/tx*1.02;if(yaw===undefined){yaw=c.yaw;pitch=c.pitch;}
  const cp=Math.cos(pitch),sp=Math.sin(pitch),hx=Math.sin(yaw),hy=-Math.cos(yaw);
  const f=[hx*cp,hy*cp,-sp],r=[Math.cos(yaw),Math.sin(yaw),0];
  let u=[r[1]*f[2]-r[2]*f[1],r[2]*f[0]-r[0]*f[2],r[0]*f[1]-r[1]*f[0]];if(u[2]<0)u=u.map(q=>-q);
  return {eye:[cx-hx*D*cp,cy-hy*D*cp,D*sp],f,r,u,tx,ty,D,cx,cy};
}
/* monde → pixels du canvas (null si derrière la caméra) ; k = pixels par unité monde à cette profondeur */
function w3Proj(x,y,z,c){c=c||W3.c||(W3.c=w3Cam());
  const dx=x-c.eye[0],dy=y-c.eye[1],dz=z-c.eye[2],zc=dx*c.f[0]+dy*c.f[1]+dz*c.f[2];if(zc<1)return null;
  const xc=dx*c.r[0]+dy*c.r[1]+dz*c.r[2],yc=dx*c.u[0]+dy*c.u[1]+dz*c.u[2];
  return {sx:(xc/(zc*c.tx)*.5+.5)*canvas.width,sy:(.5-yc/(zc*c.ty)*.5)*canvas.height,z:zc,k:canvas.height/2/(zc*c.ty)};}
/* pixels du canvas → point de la mer (z = 0) */
function w3Ground(sx,sy,c){c=c||W3.c||(W3.c=w3Cam());
  const nx=sx/canvas.width*2-1,ny=1-sy/canvas.height*2,d=[0,1,2].map(i=>c.f[i]+c.r[i]*nx*c.tx+c.u[i]*ny*c.ty);
  if(d[2]>=-1e-4)return null;const s=-c.eye[2]/d[2];return [c.eye[0]+d[0]*s,c.eye[1]+d[1]*s];}

/* ---------- palettes des biomes (couleurs des îles) ---------- */
const W3_PAL={
  tropical:{g:['#86c452','#6fb248'],sand:'#f2dca6',rock:'#b8b09c',tree:['#5aa646','#78bd4c','#4a9540']},
  grass:{g:['#8cbc50','#76a844'],sand:'#e6d9a8',rock:'#a8a090',tree:['#5e9a42','#4f8a3a']},
  snow:{g:['#f6f9fd','#e0eaf5'],sand:'#e8eef4',rock:'#98a6ba',tree:['#2f6a52','#3d7d62']},
  stone:{g:['#b8b19f','#a49e8d'],sand:'#d8d0b8',rock:'#8a8478',tree:['#5f8a44','#6f9a50']},
  jungle:{g:['#4f9a3c','#3f8a38'],sand:'#e0d098',rock:'#7a8070',tree:['#2f7a34','#3f8f3a','#287030']},
  volcanic:{g:['#4e3f3b','#3b302e'],sand:'#6a5a50',rock:'#2f2826',tree:['#4a3a30']},
  spooky:{g:['#6c6c5a','#5a5c4e'],sand:'#8a8672',rock:'#4a4658',tree:['#3a3a30']},
  cloud:{g:['#f8faff','#e6eefb'],sand:'#ffffff',rock:'#d4def2',tree:['#cfe2c0','#bdd8ae']},
  junk:{g:['#82785f','#6f6750'],sand:'#9a8e70',rock:'#5a5448',tree:['#4a4a3a']},
  storm:{g:['#606a74','#505a64'],sand:'#7a838c',rock:'#3a424c',tree:['#3a4a44']},
  japan:{g:['#9cc468','#86b058'],sand:'#e6dcb0',rock:'#a29c90',tree:['#4f8a42','#f2a6c0']},
  med:{g:['#d6bc82','#c6a86c'],sand:'#ecd9a6',rock:'#b4966a',tree:['#7a9a46','#8aa84c']},
  city:{g:['#b9b29c','#a8a28c'],sand:'#d6cdb0',rock:'#8a8474',tree:['#5f9444']},
  redrock:{g:['#c46a40','#aa593a'],sand:'#d89a6a',rock:'#8e4a30',tree:['#6a8a3a']},
  coral:{g:['#f4aab0','#e690a0'],sand:'#fadbc8',rock:'#c9707e',tree:['#f58aa0']},
  candy:{g:['#f9b8d4','#f4a2c6'],sand:'#fff0d8',rock:'#d08aae',tree:['#f98ab8','#8ad8c8']},
  fireice:{g:['#e8f0f8','#4a3a3a'],sand:'#d8e4ee',rock:'#5a4a4a',tree:['#9ad8f0','#4a3a30']},
  desert:{g:['#e3ad5e','#d8a764'],sand:'#f3d794',rock:'#cf8450',tree:['#6fb84a']}
};
const w3pal=b=>{const p=W3_PAL[b]||W3_PAL.tropical;if(!p.c)p.c={g:p.g.map(h=>r3c(h)),sand:r3c(p.sand),rock:r3c(p.rock),tree:p.tree.map(h=>r3c(h))};return p;};

/* ---------- contour de l'île (depuis la grille logique : même forme que la zone de clic) ---------- */
function w3Poly(t){
  const cl=tcells[t.id],B=72,mx=new Float32Array(B);
  for(const i of cl){const x=(i%GW)*CELL+1-t.x,y=((i/GW)|0)*CELL+1-t.y,b=Math.min(B-1,Math.floor((Math.atan2(y,x)+Math.PI)/6.2832*B)),r=Math.hypot(x,y);if(r>mx[b])mx[b]=r;}
  const lo=t.rad*.55;for(let i=0;i<B;i++)if(mx[i]<lo)mx[i]=lo;
  const sm=new Float32Array(B);for(let i=0;i<B;i++)sm[i]=(mx[(i+B-1)%B]+2*mx[i]+mx[(i+1)%B])/4;
  const np=96,out=[];for(let i=0;i<np;i++){const th=-Math.PI+i/np*6.2832,f=(th+Math.PI)/6.2832*B-.5,i0=((Math.floor(f)%B)+B)%B,i1=(i0+1)%B,k=f-Math.floor(f),r=(sm[i0]+(sm[i1]-sm[i0])*k)*.97;out.push(Math.cos(th)*r,Math.sin(th)*r);}
  return out;
}

/* ---------- petits décors réutilisables ---------- */
const W3T={
  round(G,x,y,z,s,c,rnd,tops){const r=(.8+rnd()*.5)*s;G.cyl(x,y,z-.1,.12*s,.9*s,r3c('#7a5634'),5,false);G.ico(x,y,z+.7*s+r*.55,r,.82,c,rnd,.2);tops.push([x-r,y-r,x+r,y+r,z+.8*s+r*1.3]);},
  pine(G,x,y,z,s,c,rnd,tops,snow){const h=(2.6+rnd()*1.3)*s;G.cyl(x,y,z-.1,.1*s,.7*s,r3c('#6a4a2c'),5,false);for(let k=0;k<3;k++){const rr=(1.15-k*.3)*s;G.cone(x,y,z+.5*s+k*.8*s,rr,1.5*s,snow&&k===2?r3c('#f4f8fc'):c,8);}tops.push([x-.9*s,y-.9*s,x+.9*s,y+.9*s,z+h]);},
  palm(G,x,y,z,s,c,rnd,tops){const tk=r3c('#8a5f38');let px=x,py=y,pz=z;const lx=(rnd()-.5)*.5,ly=(rnd()-.5)*.5;
    for(let k=0;k<4;k++){const nx=x+lx*(k+1)*s*.3,ny=y+ly*(k+1)*s*.3,nz=z+(k+1)*.6*s;G.cyl(px,py,pz,.13*s*(1-k*.1),nz-pz+.02,tk,5,false);px=nx;py=ny;pz=nz;}
    for(let f=0;f<6;f++){const a=f/6*6.2832+rnd()*.4;let ax=px,ay=py,az=pz;for(let k=0;k<3;k++){const L=.6*s,bx=ax+Math.cos(a)*L,by=ay+Math.sin(a)*L,bz=az+(.2-k*.32)*s,w=(.3-k*.08)*s,qx=-Math.sin(a)*w,qy=Math.cos(a)*w;
      G.quad([ax-qx,ay-qy,az],[ax+qx,ay+qy,az],[bx+qx*.7,by+qy*.7,bz],[bx-qx*.7,by-qy*.7,bz],c);ax=bx;ay=by;az=bz;}}tops.push([x-.5,y-.5,x+.5,y+.5,pz]);},
  dead(G,x,y,z,s,c,rnd,tops){const tk=r3c('#4a3a30');G.cyl(x,y,z-.1,.13*s,2.2*s,tk,5,false);for(let k=0;k<3;k++){const a=rnd()*6.28,zz=z+(1+k*.35)*s;G.quad([x,y,zz],[x+Math.cos(a)*1.1*s,y+Math.sin(a)*1.1*s,zz+.7*s],[x+Math.cos(a)*1.1*s+.1,y+Math.sin(a)*1.1*s,zz+.78*s],[x+.1,y,zz+.1],tk);}tops.push([x-.3,y-.3,x+.3,y+.3,z+2.2*s]);},
  cactus(G,x,y,z,s,c,rnd,tops){const g=r3c('#5fa04a');G.cyl(x,y,z-.1,.26*s,2.1*s,g,7);G.cyl(x+.5*s,y,z+.8*s,.17*s,.9*s,g,6);G.cyl(x-.5*s,y,z+1.1*s,.17*s,.7*s,g,6);tops.push([x-.3,y-.3,x+.3,y+.3,z+2.1*s]);},
  crystal(G,x,y,z,s,c,rnd,tops){for(let k=0;k<3;k++){const a=rnd()*6.28,d=.4*s;G.cone(x+Math.cos(a)*d,y+Math.sin(a)*d,z,.35*s,(1.6+rnd()*1.2)*s,c,5);}tops.push([x-.6,y-.6,x+.6,y+.6,z+2*s]);},
  candy(G,x,y,z,s,c,rnd,tops){G.cyl(x,y,z-.1,.07*s,1.3*s,r3c('#f0e0d0'),5,false);G.ico(x,y,z+1.5*s,.7*s,.9,c,rnd,.1);tops.push([x-.6,y-.6,x+.6,y+.6,z+2.2*s]);},
  mangrove(G,x,y,z,s,c,rnd,tops){for(let k=0;k<4;k++){const a=k/4*6.28;G.cyl(x+Math.cos(a)*.7*s,y+Math.sin(a)*.7*s,z-.2,.07*s,1.1*s,r3c('#6a4a2c'),4,false);}G.ico(x,y,z+1.5*s,1*s,.7,c,rnd,.2);tops.push([x-1,y-1,x+1,y+1,z+2.1*s]);}
};
const W3_TREE={round:'round',orange:'round',blossom:'round',jungle:'round',pine:'pine',pineSnow:'pine',palm:'palm',dead:'dead',cactus:'cactus',crystal:'crystal',candy:'candy',mangrove:'mangrove'};

/* ---------- maisons selon le style de l'île ---------- */
function w3House(G,tops,style,x,y,z,w,rnd,D){
  const hc=[r3c('#efe0bc'),r3c('#e6cf9c'),r3c('#f3e6c8')],roofs=(D.roof||['#b5533c','#3d64b8','#c9842c']).map(h=>r3c(h));
  const ro=roofs[(rnd()*roofs.length)|0],h=1.3+rnd()*.7,d=w*(.8+rnd()*.3);
  const B=(c,top)=>{G.box(x,y,z-.1,w,d,h+.1,c,top);tops.push([x,y,x+w,y+d,z+h]);};
  const dark=r3c('#4a3622'),win=(n)=>{for(let q=0;q<n;q++)G.box(x+.25+q*(w-.5)/Math.max(1,n),y+d+.001,z+.5,.26,.04,.45,dark);};
  switch(style){
    case 'hut':{const r=w*.5;G.cyl(x+r,y+r,z-.1,r,1.1,r3c('#d8bc88'),8);G.cone(x+r,y+r,z+1,r*1.25,1.3,r3c('#c49a50'),8);tops.push([x,y,x+w,y+w,z+2.2]);break;}
    case 'snowy':B(r3c('#e6dccb'),r3c('#f6f9fd'));G.pyr(x,y,z+h,w,d,.9,r3c('#f4f8fc'),.12);win(2);tops.push([x,y,x+w,y+d,z+h+.8]);break;
    case 'stone':B(r3c('#b9b3a4'),r3c('#cfc9ba'));win(2);break;
    case 'jp':B(r3c('#efe4cc'));G.pyr(x,y,z+h,w,d,.9,r3c('#3d4658'),.3);win(2);tops.push([x,y,x+w,y+d,z+h+.9]);break;
    case 'candy':B([.98,.82,.88,1],[1,.92,.94,1]);G.pyr(x,y,z+h,w,d,.9,[.98,.45,.65,1],.12);tops.push([x,y,x+w,y+d,z+h+.9]);break;
    case 'junk':B(r3c('#8a7a5e'));G.box(x+.2,y+.2,z+h,w*.6,d*.6,.8,r3c('#6a5c48'));win(1);break;
    case 'future':G.cyl(x+w/2,y+w/2,z-.1,w*.5,h,r3c('#eef4f8'),10);G.dome(x+w/2,y+w/2,z+h,w*.5,.8,r3c('#9fd4ea'),10);tops.push([x,y,x+w,y+w,z+h+.6]);break;
    case 'coral':G.cyl(x+w/2,y+w/2,z-.1,w*.45,h,r3c('#f8c8c8'),8);G.cone(x+w/2,y+w/2,z+h,w*.6,1.2,r3c('#f58aa0'),8);tops.push([x,y,x+w,y+w,z+h+1.2]);break;
    case 'med':B(r3c('#f2e6cc'),r3c('#f6ecd6'));win(2);if(rnd()<.3)G.dome(x+w/2,y+d/2,z+h,Math.min(w,d)*.35,1,r3c('#3f9f9a'),8);break;
    default:{const two=rnd()<.28,hh=two?h+1.25:h;G.box(x,y,z-.1,w,d,hh+.1,hc[(rnd()*3)|0]);tops.push([x,y,x+w,y+d,z+hh]);
      if(two)G.box(x-.12,y-.12,z+h,w+.24,d+.24,.14,r3c('#8a6a48'));
      G.pyr(x,y,z+hh,w,d,.6+w*.45,ro,.16);win(2);G.box(x+w/2-.22,y+d-.02,z-.1,.44,.08,.95,dark);
      if(two){for(let q=0;q<2;q++)G.box(x+.3+q*(w-.9),y+d+.001,z+h+.35,.28,.04,.5,r3c(rnd()<.4?'#ffd27a':'#34425c'));G.box(x+w+.001,y+d*.3,z+.5,.04,.3,.45,r3c('#34425c'));}
      if(rnd()<.5)G.box(x+w*.68,y+d*.2,z+hh+.25,.3,.3,.95,r3c('#9a5a44'));
      if(rnd()<.35)G.box(x+w+.05,y+d*.3,z-.1,.5,.5,.5,r3c('#a8845a'));
      tops.push([x,y,x+w,y+d,z+hh+.9]);}
  }
}

/* ---------- monuments : une petite bibliothèque de volumes, associés aux monuments de chaque île ---------- */
const W3LM={
  castleEU(k){const {G,x,y,z,s,o,oc}=k,st=(o.stone||['#f2ece0','#d8ccb4','#b4a68c']).map(h=>r3c(h)),roof=r3c(o.roof||'#b5533c');
    G.box(x-3.2*s,y-2.6*s,z-.1,6.4*s,5.2*s,3*s,st[1]);
    for(const [dx,dy] of [[-3.2,-2.6],[3.2,-2.6],[-3.2,2.6],[3.2,2.6]]){G.cyl(x+dx*s,y+dy*s,z-.1,.95*s,5*s,st[0],10);G.cone(x+dx*s,y+dy*s,z+4.9*s,1.25*s,2.2*s,roof,10);}
    G.cyl(x,y,z+2.9*s,1.5*s,5*s,st[0],10);G.cone(x,y,z+7.8*s,1.9*s,3.2*s,roof,10);
    G.box(x-.8*s,y+2.58*s,z-.1,1.6*s,.12,1.6*s,r3c('#4a3622'));
    k.tops.push([x-3.4*s,y-2.8*s,x+3.4*s,y+2.8*s,z+4.5*s]);k.top=z+11*s;k.ban(x,y,z+11*s);},
  fortress(k){const {G,x,y,z,s,o}=k,w=r3c('#c9c2b0'),w2=r3c('#a9a392'),roof=r3c(o.roof||'#3c5f9e');
    G.box(x-4*s,y-4*s,z-.1,8*s,8*s,2.4*s,w);G.box(x-3.4*s,y-3.4*s,z+2.3*s,6.8*s,6.8*s,.2,w2);
    for(const [dx,dy] of [[-4,-4],[4,-4],[-4,4],[4,4]]){G.cyl(x+dx*s,y+dy*s,z-.1,1.1*s,4*s,w2,8);G.cone(x+dx*s,y+dy*s,z+3.9*s,1.4*s,1.5*s,roof,8);}
    G.box(x-1.8*s,y-1.8*s,z+2.3*s,3.6*s,3.6*s,3*s,w);G.pyr(x-1.8*s,y-1.8*s,z+5.3*s,3.6*s,3.6*s,1.6*s,roof,.25);G.box(x-.8*s,y+4*s-.02,z-.1,1.6*s,.1,1.6*s,r3c('#3a2a1c'));
    k.tops.push([x-4.2*s,y-4.2*s,x+4.2*s,y+4.2*s,z+2.4*s]);k.top=z+7*s;k.ban(x,y,z+7*s);},
  tower(k){const {G,x,y,z,s}=k,w=r3c('#d4d0c6'),w2=r3c('#a9a89c');G.cyl(x,y,z-.1,2.4*s,2*s,w2,14);G.cyl(x,y,z+1.9*s,1.7*s,8*s,w,14);G.cyl(x,y,z+9.9*s,2.1*s,.6*s,w2,14);G.cone(x,y,z+10.5*s,1.9*s,2.6*s,r3c('#7a8aa8'),14);
    for(let q=0;q<8;q++){const a=q/8*6.28;G.box(x+Math.cos(a)*2.1*s-.2,y+Math.sin(a)*2.1*s-.2,z+.2,.4,.4,1.6*s,w2);}
    k.tops.push([x-2.4*s,y-2.4*s,x+2.4*s,y+2.4*s,z+10*s]);k.top=z+13*s;k.ban(x,y,z+13*s);},
  lighthouse(k){const {G,x,y,z,s}=k;for(let q=0;q<5;q++)G.cyl(x,y,z-.1+q*1.7*s,(1.5-q*.13)*s,1.75*s,q%2?r3c('#c8453a'):r3c('#f4efe6'),12);G.cyl(x,y,z+8.4*s,1.15*s,.5*s,r3c('#3a3a40'),12);G.cyl(x,y,z+8.9*s,.8*s,1*s,r3c('#ffe8a0'),10);G.cone(x,y,z+9.9*s,1.15*s,1.1*s,r3c('#c8453a'),10);
    k.tops.push([x-1.5*s,y-1.5*s,x+1.5*s,y+1.5*s,z+9*s]);k.top=z+11*s;},
  bellTower(k){const {G,x,y,z,s}=k,w=r3c('#f2eee4');G.box(x-1.3*s,y-1.3*s,z-.1,2.6*s,2.6*s,6*s,w);G.box(x-1.5*s,y-1.5*s,z+5.9*s,3*s,3*s,.4,r3c('#d8cfb8'));for(const [dx,dy] of [[-1.2,-1.2],[1,-1.2],[-1.2,1],[1,1]])G.box(x+dx*s,y+dy*s,z+6.3*s,.35*s,.35*s,2.2*s,w);G.pyr(x-1.5*s,y-1.5*s,z+8.5*s,3*s,3*s,2.6*s,r3c('#7fb4d8'),.1);G.ico(x,y,z+7.3*s,.5*s,.9,r3c('#e8c050'),null,0);
    k.tops.push([x-1.5*s,y-1.5*s,x+1.5*s,y+1.5*s,z+8*s]);k.top=z+11*s;k.ban(x,y,z+11*s);},
  windmill(k){const {G,x,y,z,s}=k;G.cyl(x,y,z-.1,1.7*s,.9*s,r3c('#b9a98e'),10);G.cyl(x,y,z+.7*s,1.35*s,3.6*s,r3c('#efe6d2'),10);G.cone(x,y,z+4.3*s,1.6*s,1.8*s,r3c('#b5533c'),10);
    for(let q=0;q<4;q++){const a=q*1.5708+.4,ex=Math.cos(a)*3.8*s,ez=Math.sin(a)*3.8*s,nx=-Math.sin(a)*.5*s,nz=Math.cos(a)*.5*s;G.quad([x,y+1.4*s,z+4*s],[x+ex,y+1.4*s,z+4*s+ez],[x+ex+nx,y+1.4*s,z+4*s+ez+nz],[x+nx*.3,y+1.4*s,z+4*s+nz*.3],r3c('#f6f0e0'));}
    k.tops.push([x-1.7*s,y-1.7*s,x+1.7*s,y+1.7*s,z+5.5*s]);k.top=z+6.5*s;},
  temple(k){const {G,x,y,z,s}=k,w=r3c('#efe8d6'),w2=r3c('#d3cbb4');for(let q=0;q<3;q++)G.box(x-(4.2-q*.45)*s,y-(3-q*.4)*s,z-.1+q*.45*s,(8.4-q*.9)*s,(6-q*.8)*s,.5*s,q%2?w:w2);
    for(let q=0;q<5;q++)for(const dy of [-2.1,2.1])G.cyl(x+(-3+q*1.5)*s,y+dy*s,z+1.4*s,.28*s,2.6*s,w,8);G.box(x-3.6*s,y-2.5*s,z+4*s,7.2*s,5*s,.5*s,w2);G.pyr(x-3.6*s,y-2.5*s,z+4.5*s,7.2*s,5*s,1.6*s,r3c('#7ea6c8'),.2);
    k.tops.push([x-4.2*s,y-3*s,x+4.2*s,y+3*s,z+4.8*s]);k.top=z+7*s;k.ban(x,y,z+7*s);},
  ruins(k){const {G,x,y,z,s}=k,w=r3c('#d4cbb2'),w2=r3c('#b5ac94');for(let q=0;q<7;q++){const a=q/7*6.28,d=(2+(q%2))*s,h=(1+((q*37)%10)/4)*s;G.cyl(x+Math.cos(a)*d,y+Math.sin(a)*d,z-.1,.45*s,h,q%2?w:w2,8);}
    G.box(x-2.4*s,y-2.8*s,z+1.1*s,4*s,.7*s,.6*s,w2);G.box(x-.5*s,y-.5*s,z-.1,1.8*s,1.4*s,.7*s,w);G.ico(x+2.3*s,y+1.5*s,z+.2,.7*s,.6,w2,null,0);
    k.tops.push([x-3*s,y-3*s,x+3*s,y+3*s,z+2.6*s]);k.top=z+4*s;},
  fountain(k){const {G,x,y,z,s}=k;G.cyl(x,y,z-.1,2.6*s,.35*s,r3c('#d8d2c2'),16);G.cyl(x,y,z+.25*s,2.2*s,.12*s,r3c('#58b8d8'),16);G.cyl(x,y,z,.45*s,1.6*s,r3c('#e8e2d2'),8);G.cone(x,y,z+1.5*s,.9*s,.8*s,r3c('#9fe0f4'),8);k.tops.push([x-2.6*s,y-2.6*s,x+2.6*s,y+2.6*s,z+1.6*s]);k.top=z+2.5*s;},
  bigTree(k){const {G,x,y,z,s,o,rnd}=k,burnt=o.burnt;G.cyl(x,y,z-.2,1.3*s,5.4*s,r3c(burnt?'#3a2a22':'#7a5634'),8);
    const c=burnt?[r3c('#4a4038'),r3c('#3a322c')]:[r3c('#4f9a3c'),r3c('#68b048'),r3c('#3f8a38')];
    for(let q=0;q<6;q++){const a=q/6*6.28,d=(q?2.6:0)*s;G.ico(x+Math.cos(a)*d,y+Math.sin(a)*d,z+(5.6+(q%2)*.8)*s,(q?2.3:3)*s,.8,c[q%c.length],rnd,.25);}
    k.tops.push([x-3.5*s,y-3.5*s,x+3.5*s,y+3.5*s,z+8*s]);k.top=z+9*s;},
  rocks(k){const {G,x,y,z,s,o,rnd}=k,cs=(o.col||['#c9b08a','#a8906a','#7a6a52']).map(h=>r3c(h)),n=o.n||3;for(let q=0;q<n;q++){const a=q/n*6.28+.5,d=(q?2.2:0)*s,r=(2.1-q*.2)*s;G.ico(x+Math.cos(a)*d,y+Math.sin(a)*d,z+r*.25,r,1.4,cs[q%cs.length],rnd,.3);k.tops.push([x+Math.cos(a)*d-r,y+Math.sin(a)*d-r,x+Math.cos(a)*d+r,y+Math.sin(a)*d+r,z+r*1.2]);}k.top=z+4*s;},
  hive(k){const {G,x,y,z,s,rnd}=k;for(let q=0;q<5;q++){const a=q/5*6.28,d=(q?2.4:0)*s,r=(q?1.5:2.4)*s;G.ico(x+Math.cos(a)*d,y+Math.sin(a)*d,z+r*.5,r,1.1,r3c(q%2?'#8a7258':'#7a6450'),rnd,.2);G.box(x+Math.cos(a)*d-.3,y+Math.sin(a)*d+r*.8,z+r*.3,.6,.1,.7,r3c('#2a2018'));}
    k.tops.push([x-3.5*s,y-3.5*s,x+3.5*s,y+3.5*s,z+3.4*s]);k.top=z+4.5*s;},
  mansion(k){const {G,x,y,z,s}=k,w=r3c('#6a5f78'),rf=r3c('#2e2838');G.box(x-3.5*s,y-2.2*s,z-.1,7*s,4.4*s,3.6*s,w);G.pyr(x-3.5*s,y-2.2*s,z+3.5*s,7*s,4.4*s,2.4*s,rf,.3);G.cyl(x-3.6*s,y,z-.1,1.2*s,7*s,w,8);G.cone(x-3.6*s,y,z+6.9*s,1.5*s,3*s,rf,8);G.cyl(x+3.2*s,y-1.4*s,z-.1,.8*s,5.5*s,w,8);G.cone(x+3.2*s,y-1.4*s,z+5.4*s,1*s,2.4*s,rf,8);
    for(let q=0;q<4;q++)G.box(x-2.6*s+q*1.6*s,y+2.21*s,z+1.1*s,.5*s,.05,.9*s,r3c('#ffd070'));k.tops.push([x-4.8*s,y-2.4*s,x+4.2*s,y+2.4*s,z+5.6*s]);k.top=z+10*s;},
  prison(k){const {G,x,y,z,s}=k,w=r3c('#6e7480'),w2=r3c('#4e5460');G.cyl(x,y,z-.1,3.6*s,2.4*s,w,16);G.cyl(x,y,z+2.3*s,2.7*s,3.2*s,w2,16);G.cone(x,y,z+5.4*s,2.7*s,1.4*s,r3c('#2e323a'),16);
    for(let q=0;q<4;q++){const a=q*1.5708+.78,tx=x+Math.cos(a)*5.2*s,ty=y+Math.sin(a)*5.2*s;G.cyl(tx,ty,z-.1,.9*s,3.5*s,w2,8);G.cone(tx,ty,z+3.4*s,1.1*s,1.2*s,r3c('#2e323a'),8);}
    k.tops.push([x-5.8*s,y-5.8*s,x+5.8*s,y+5.8*s,z+4*s]);k.top=z+7*s;},
  lab(k){const {G,x,y,z,s}=k;G.box(x-3*s,y-2*s,z-.1,6*s,4*s,2.2*s,r3c('#e8eef2'));G.dome(x-1*s,y,z+2.1*s,1.8*s,.9,r3c('#7ec8e8'),12);G.cyl(x+2*s,y-.4*s,z+2.1*s,.7*s,2.4*s,r3c('#c8d2d8'),8);G.cyl(x+2*s,y-.4*s,z+4.5*s,.5*s,.4*s,r3c('#e07a50'),8);
    k.tops.push([x-3*s,y-2*s,x+3*s,y+2*s,z+3.4*s]);k.top=z+5.5*s;},
  colosseum(k){const {G,x,y,z,s}=k,w=r3c('#e6d6b0'),w2=r3c('#c8b68a');const n=18;for(let q=0;q<n;q++){const a=q/n*6.2832,a2=(q+1)/n*6.2832,r=4.8*s;
      G.quad([x+Math.cos(a)*r,y+Math.sin(a)*r*.85,z-.1],[x+Math.cos(a2)*r,y+Math.sin(a2)*r*.85,z-.1],[x+Math.cos(a2)*r,y+Math.sin(a2)*r*.85,z+3.2*s],[x+Math.cos(a)*r,y+Math.sin(a)*r*.85,z+3.2*s],q%2?w:w2,[Math.cos((a+a2)/2),Math.sin((a+a2)/2),0]);
      G.box(x+Math.cos((a+a2)/2)*r*.99-.2,y+Math.sin((a+a2)/2)*r*.84-.2,z+.4*s,.4,.4,1.1*s,r3c('#5a4630'));}
    G.cyl(x,y,z-.05,4.5*s,.1,r3c('#e8cf98'),18);k.tops.push([x-5*s,y-4.3*s,x+5*s,y+4.3*s,z+3.2*s]);k.top=z+5*s;k.ban(x,y,z+5*s);},
  cakeCastle(k){const {G,x,y,z,s,rnd}=k;const cs=['#f8c6dc','#fff2e0','#7a4a32','#f58ab8'];let zz=z-.1;for(let q=0;q<4;q++){const r=(4-q*.8)*s;G.cyl(x,y,zz,r,1.6*s,r3c(cs[q%4]),16);G.cyl(x,y,zz+1.55*s,r+.15*s,.2*s,r3c('#ffffff'),16);zz+=1.7*s;}
    G.cone(x,y,zz,1.1*s,2.4*s,r3c('#f58ab8'),12);G.ico(x,y,zz+2.7*s,.45*s,1,r3c('#d62f40'),rnd,0);for(const [dx,dy] of [[-4.4,0],[4.4,0]]){G.cyl(x+dx*s,y+dy*s,z-.1,.9*s,3.4*s,r3c('#fde8d8'),10);G.cone(x+dx*s,y+dy*s,z+3.3*s,1.2*s,1.8*s,r3c('#f58ab8'),10);}
    k.tops.push([x-5.3*s,y-4*s,x+5.3*s,y+4*s,z+6.5*s]);k.top=z+11*s;k.ban(x,y,z+11*s);},
  marblePalace(k){const {G,x,y,z,s}=k,w=r3c('#f4f2ee'),g=r3c('#d9a441');G.box(x-5*s,y-3*s,z-.1,10*s,6*s,3.2*s,w);for(const dx of [-3.2,0,3.2])G.dome(x+dx*s,y,z+3.1*s,1.6*s,1.1,g,12);for(let q=0;q<8;q++)G.cyl(x-4.2*s+q*1.2*s,y+3.15*s,z-.1,.26*s,3*s,w,8);
    G.box(x-5.4*s,y-3.4*s,z-.2,10.8*s,.4,.3,r3c('#d8d6d0'));k.tops.push([x-5*s,y-3*s,x+5*s,y+3*s,z+4.4*s]);k.top=z+6*s;k.ban(x,y,z+6*s);},
  eggDome(k){const {G,x,y,z,s}=k;G.cyl(x,y,z-.1,4.4*s,.8*s,r3c('#cfd8de'),20);G.dome(x,y,z+.7*s,4.2*s,1.1,r3c('#eef4f8'),20);G.cyl(x+4.6*s,y+1.4*s,z-.1,.8*s,2.4*s,r3c('#b8c4cc'),8);G.dome(x+4.6*s,y+1.4*s,z+2.3*s,.8*s,.8,r3c('#7ec8e8'),8);
    k.tops.push([x-4.4*s,y-4.4*s,x+4.4*s,y+4.4*s,z+5*s]);k.top=z+6*s;},
  castleJP(k){const {G,x,y,z,s}=k,w=r3c('#f4eee0'),rf=r3c('#3d4658');G.box(x-4*s,y-3.4*s,z-.1,8*s,6.8*s,1.8*s,r3c('#a9a392'));let zz=z+1.7*s;const sz=[[3.2,2.6],[2.5,2],[1.8,1.4]];
    for(const [a,b] of sz){G.box(x-a*s,y-b*s,zz,2*a*s,2*b*s,1.5*s,w);G.pyr(x-a*s,y-b*s,zz+1.5*s,2*a*s,2*b*s,1.1*s,rf,.7*s);zz+=2.1*s;}G.cone(x,y,zz+.3*s,.3*s,1.2*s,r3c('#d9a441'),6);
    k.tops.push([x-4*s,y-3.4*s,x+4*s,y+3.4*s,z+3.4*s]);k.top=zz+1.5*s;k.ban(x,y,zz+1.5*s);},
  pagoda(k){const {G,x,y,z,s}=k;let zz=z-.1;for(let q=0;q<4;q++){const a=(2.4-q*.4)*s;G.box(x-a/1.4,y-a/1.4,zz,a*1.4,a*1.4,1.1*s,r3c('#efe4cc'));G.pyr(x-a/1.4,y-a/1.4,zz+1.1*s,a*1.4,a*1.4,.7*s,r3c('#b5433a'),.5*s);zz+=1.6*s;}k.tops.push([x-2.4*s,y-2.4*s,x+2.4*s,y+2.4*s,z+3*s]);k.top=zz+1*s;},
  torii(k){const {G,x,y,z,s}=k,r=r3c('#c8362e');G.cyl(x-1.4*s,y,z-.1,.22*s,3.2*s,r,6);G.cyl(x+1.4*s,y,z-.1,.22*s,3.2*s,r,6);G.box(x-2*s,y-.3*s,z+3*s,4*s,.6*s,.35*s,r);G.box(x-1.6*s,y-.2*s,z+2.4*s,3.2*s,.4*s,.22*s,r3c('#3a2a22'));k.tops.push([x-2*s,y-.4*s,x+2*s,y+.4*s,z+3.3*s]);k.top=z+4*s;},
  ship(k){const {G,x,y,z,s}=k,hull=r3c('#6b4428'),deck=r3c('#9b7048'),sail=r3c('#f2ead6');G.box(x-3.4*s,y-1.1*s,z-.1,6.8*s,2.2*s,1.2*s,hull,deck);G.box(x+3.4*s,y-.7*s,z+.2,1*s,1.4*s,.9*s,hull,deck);
    for(const [mx,mh] of [[-1.2,5.4],[1.4,4.6]]){G.cyl(x+mx*s,y,z+1*s,.12*s,mh*s,r3c('#5f4226'),6,false);G.quad([x+(mx-1.3)*s,y+.2*s,z+(mh-.4)*s],[x+(mx+1.3)*s,y+.2*s,z+(mh-.4)*s],[x+(mx+1.5)*s,y+.4*s,z+2*s],[x+(mx-1.5)*s,y+.4*s,z+2*s],sail);}
    k.tops.push([x-3.4*s,y-1.1*s,x+4.4*s,y+1.1*s,z+1.4*s]);k.top=z+6*s;},
  fleet(k){const {G,x,y,z,s,rnd}=k;for(let q=0;q<3;q++)W3LM.ship(Object.assign({},k,{x:x+(q-1)*5*s,y:y+(q%2)*2*s,s:s*.7}));k.top=z+5*s;},
  shipInn(k){const {G,x,y,z,s}=k,hull=r3c('#7a4a2c');G.box(x-4.6*s,y-2.4*s,z-.3,9.2*s,4.8*s,1.8*s,hull,r3c('#a8825a'));G.box(x-3*s,y-1.6*s,z+1.5*s,6*s,3.2*s,2.2*s,r3c('#f2e6c8'));G.pyr(x-3*s,y-1.6*s,z+3.7*s,6*s,3.2*s,1.6*s,r3c('#c8453a'),.3);G.cyl(x+4.2*s,y,z+1.5*s,.15*s,5*s,r3c('#5f4226'),6,false);
    k.tops.push([x-4.6*s,y-2.4*s,x+4.6*s,y+2.4*s,z+5*s]);k.top=z+6*s;k.ban(x+4.2*s,y,z+6.5*s);},
  default(k){return W3LM.fortress(k);}
};
const W3_LMMAP={marblePalace:'marblePalace',castleEU:'castleEU'};

/* ---------- bannière de faction (forme selon le camp) ---------- */
function w3Banner(G,x,y,z,oc,crew,s){s=s||1;const w=.55*s,h=1.3*s;G.cyl(x,y,z-2*s,.07*s,2.2*s,r3c('#3a2a1c'),5,false);
  const zz=z-.1*s;if(crew==='pirate')G.tri([x,y,zz],[x+w*1.6,y,zz-h*.45],[x,y,zz-h],oc);
  else if(crew==='chasseur'){G.quad([x,y,zz],[x+w*1.5,y,zz],[x+w*1.5,y,zz-h],[x,y,zz-h],oc);G.tri([x+w*1.5,y+.001,zz-h],[x,y+.001,zz-h],[x+w*.75,y+.001,zz-h*.7],r3c('#efe2c2'));}
  else if(crew==='revo')G.quad([x,y,zz],[x+w,y,zz],[x+w,y,zz-h*1.5],[x,y,zz-h*1.5],oc);
  else{G.quad([x,y,zz],[x+w*1.5,y,zz],[x+w*1.5,y,zz-h],[x,y,zz-h],oc);if(crew==='marine')G.quad([x,y-.002,zz-h*.15],[x+w*1.5,y-.002,zz-h*.15],[x+w*1.5,y-.002,zz-h*.3],[x,y-.002,zz-h*.3],r3c('#ffffff'));}}

/* ---------- anneaux au niveau de la mer : bas-fond clair, écume, liseré du camp (translucides) ---------- */
function w3Rings(G,rc,oc,owned){
  const ring=(k0,k1,a0,a1,c0,c1,z)=>{const n=96;for(let i=0;i<n;i++){const t0=i/n*6.2832-3.1416,t1=(i+1)/n*6.2832-3.1416,r0=rc(t0),r1=rc(t1);
    const P=(t,r,k)=>[Math.cos(t)*r*k,Math.sin(t)*r*k,z],c=(a,col)=>[col[0],col[1],col[2],a];
    const up=[0,0,1];for(const [A,B,C] of [[[t0,r0,k0,a0,c0],[t0,r0,k1,a1,c1],[t1,r1,k1,a1,c1]],[[t0,r0,k0,a0,c0],[t1,r1,k1,a1,c1],[t1,r1,k0,a0,c0]]])
      for(const v of [A,B,C]){G.P.push(...P(v[0],v[1],v[2]));G.N.push(0,0,1);G.Cl.push(...c(v[3],v[4]));G.Tw.push(0);}}};
  ring(1.0,1.3,.62,0,[.66,.95,.93],[.5,.88,.9],.015);
  ring(.985,1.08,.95,0,[1,1,1],[1,1,1],.03);
  ring(1.19,1.215,.5,.5,[1,.93,.7],[1,.93,.7],.035);
  if(owned){ring(.97,1.07,.96,.96,oc,oc,.05);       /* liseré net à la côte */
    ring(1.07,1.38,.62,0,oc,oc,.045);}          /* halo dans l'eau : on reconnaît ses îles de loin */
}

/* ---------- construction du modèle 3D d'une île selon son état de jeu ---------- */
function w3BuildIsland(t){
  const CU=(typeof W3CU!=='undefined'&&!W3.cuOff&&W3CU[t.name])||null,D=CU&&CU.art?Object.assign({},ISLE_ART[t.name]||{},CU.art):(ISLE_ART[t.name]||{}),poly=w3Poly(t),owner=t.owner>=0?players[t.owner]:null,oc=owner?r3c(COLORS[t.owner]):r3c('#d8cfb0'),crew=owner?CREWS[owner.crew||0].id:'';
  const blxA=t.name==='Alabasta'&&typeof BLX!=='undefined'&&!BLX.off&&!W3.cuOff&&BLX.isl[t.name]&&BLX.isl[t.name].ready3;   /* île produite par la chaîne Blender : son modèle remplace le prototype 3D */
  if(t.name==='Alabasta'&&!blxA&&typeof blxWant3==='function'&&typeof BLX!=='undefined'&&!BLX.off&&!W3.cuOff&&BLX.isl[t.name])blxWant3(t.name,'lod2');   /* demande le modèle ; le prototype sert en attendant */
  if(t.name==='Alabasta'&&!blxA){const e={poly25:poly,poly:poly},M=r3BuildAlabasta(t,e);
    /* les triangles du fond marin appartiennent au 2.5D : en monde 3D, la mer est un plan */
    const G=M.G,keep=[];for(let i=0;i<G.P.length;i+=9){const v0=i/3;if(G.Cl[v0*4+3]<.99||G.Cl[(v0+1)*4+3]<.99||G.Cl[(v0+2)*4+3]<.99)continue;keep.push(i);}
    const G2=r3Geo();for(const i of keep)for(let q=0;q<3;q++){const v=i/3+q;G2.P.push(G.P[v*3],G.P[v*3+1],G.P[v*3+2]);G2.N.push(G.N[v*3],G.N[v*3+1],G.N[v*3+2]);G2.Cl.push(G.Cl[v*4],G.Cl[v*4+1],G.Cl[v*4+2],G.Cl[v*4+3]);G2.Tw.push(G.Tw[v]);}
    const A=M.A,R0=t.rad,ox=A.OA[0],oy=A.OA[1],orr=.2*R0,wz=.62;for(let i=0;i<24;i++){const a0=i/24*6.2832,a1=(i+1)/24*6.2832;G2.tri([ox,oy,wz],[ox+Math.cos(a0)*orr*1.05,oy+Math.sin(a0)*orr*.95,wz],[ox+Math.cos(a1)*orr*1.05,oy+Math.sin(a1)*orr*.95,wz],[.16,.62,.74,1],[0,0,1],[0,0,1],[0,0,1]);}
    w3Rings(G2,A.rc,oc,!!owner);return {G:G2,tops:M.tops,A,ext:1.24*t.rad,top:A.MESA+8,H:A.H};}
  const R=t.rad,G=r3Geo(),rng=mulberry32(t.id*977+13),rnd=()=>rng(),pal=w3pal(D.b),pc=pal.c,S0=t.id*7+13;
  const B=poly.length/2,rc=th=>{const f=((th+Math.PI)/6.2832)*B,i=Math.floor(f)%B,j=(i+1)%B,k=f-Math.floor(f),r0=Math.hypot(poly[i*2],poly[i*2+1]),r1=Math.hypot(poly[j*2],poly[j*2+1]);return r0+(r1-r0)*k;};
  const typ=t.type,PL=typ==='montagne'?3.4:typ==='foret'?2.5:2,hills=typ==='montagne'?1.3:.8,u=R/30;
  const peaks=(D.peaks||(typ==='montagne'?[[0,-.1,60,.5]]:[])).map(p=>[p[0]*R,p[1]*R,p[2]*.075,Math.max(.25,p[3])*R*.55]);
  const lmS=(D.lmS||1)*u*1.65,lmAt=D.lmAt||[0,.02],LM=D.lm?[lmAt[0]*R,lmAt[1]*R]:null,onPeak=!!D.lmOnPeak&&peaks.length&&!!LM;
  if(onPeak){LM[0]=peaks[0][0];LM[1]=peaks[0][1];}
  const pr=5*lmS;
  let H=(x,y)=>{const r=Math.hypot(x,y),th=Math.atan2(y,x),c=rc(th),d=r/c;if(d>=1)return -.9*r3ss(1,1.2,d);
    const cliffy=fbm2(Math.cos(th)*1.5+3,Math.sin(th)*1.5+3,S0,3)>.52;
    let h=.3*r3ss(1,.93,d)+PL*(cliffy?r3ss(.9,.84,d):r3ss(.96,.62,d));
    h+=hills*fbm2(x*.07+7,y*.07+2,S0+5,3)*r3ss(.9,.5,d);
    for(const p of peaks){const dx=x-p[0],dy=y-p[1];h+=p[2]*Math.exp(-(dx*dx+dy*dy)/(2*p[3]*p[3]))*r3ss(.95,.5,d);}
    if(LM&&!onPeak){const ld=Math.hypot(x-LM[0],y-LM[1]);if(ld<pr*1.6){const k=r3ss(1.6*pr,.9*pr,ld);h=h*(1-k)+(PL+.4)*k;}}
    return h;};
  if(CU&&CU.relief)H=CU.relief(H,{rc,R,t,u,S0,PL});            /* île sur mesure : relief propre (la côte reste au niveau de la mer) */
  /* port : l'endroit de la côte le plus bas, plutôt au sud ; chemin sinueux du monument jusqu'au quai */
  let aP=1.5708,bh=1e9;for(let q=0;q<16;q++){const a=.6+q*(2/15),h=H(Math.cos(a)*rc(a)*.9,Math.sin(a)*rc(a)*.9)+Math.abs(a-1.5708)*.5+((q*7+t.id)%5)*.05;if(h<bh){bh=h;aP=a;}}
  if(CU&&CU.pier!==undefined)aP=CU.pier;
  /* île produite par la chaîne Blender (version test) : modèle glTF à la place du décor généré */
  if(typeof blxBuild==='function'){const bm=blxBuild(t,{poly,rc,R,oc,owner,crew,aP});if(bm)return bm;}
  const pS=LM?[LM[0]+Math.cos(aP)*pr,LM[1]+Math.sin(aP)*pr]:[0,0],pE=[Math.cos(aP)*rc(aP)*.93,Math.sin(aP)*rc(aP)*.93],pathPts=[];
  for(let i=0;i<=14;i++){const f=i/14,wx=-Math.sin(aP),wy=Math.cos(aP),w=Math.sin(f*5+t.id)*R*.07*Math.sin(f*Math.PI);pathPts.push([pS[0]+(pE[0]-pS[0])*f+wx*w,pS[1]+(pE[1]-pS[1])*f+wy*w]);}
  const dPath=(x,y)=>{let m=1e9;for(let i=0;i<14;i++){const a=pathPts[i],b=pathPts[i+1],vx=b[0]-a[0],vy=b[1]-a[1],tt=Math.max(0,Math.min(1,((x-a[0])*vx+(y-a[1])*vy)/(vx*vx+vy*vy||1))),d=Math.hypot(x-a[0]-vx*tt,y-a[1]-vy*tt);if(d<m)m=d;}return m;};
  const pathCol=D.b==='snow'||D.b==='cloud'?r3c('#c4ced9'):D.b==='desert'||D.b==='med'?r3c('#e8c98a'):D.b==='volcanic'||D.b==='spooky'||D.b==='storm'?r3c('#6a625c'):r3c('#d2bd8c');
  const ext=1.24*R,N=R>28?132:100,step=2*ext/N,hz=[];for(let j=0;j<=N;j++){hz[j]=[];for(let i=0;i<=N;i++)hz[j][i]=H(-ext+i*step,-ext+j*step);}
  const nAt=(i,j)=>{const a=hz[j][Math.max(0,i-1)],b=hz[j][Math.min(N,i+1)],c=hz[Math.max(0,j-1)][i],d=hz[Math.min(N,j+1)][i],v=[(a-b)/(2*step),(c-d)/(2*step),1],l=Math.hypot(...v);return v.map(q=>q/l);};
  const dirt=r3c('#cdb98d'),lava=r3c('#e0603a');
  const colorAt=(x,y,h,sl)=>{let c;const n=fbm2(x*.12,y*.12,S0+11,2);
    const gi=D.b==='fireice'?(x>0?0:1):(n>.5?1:0);
    c=r3mix(pc.sand,pc.g[gi],r3ss(.2,.75,h));
    if(D.b==='snow'||D.b==='cloud')c=r3mix(pc.sand,pc.g[gi],r3ss(.05,.5,h));
    if(sl>.2)c=r3mix(c,pc.rock,r3ss(.2,.45,sl));
    if(sl>.3){const b=.88+.14*Math.sin(h*4.5);c=[c[0]*b,c[1]*b,c[2]*b,1];}
    if(h>.45){const dp=dPath(x,y);if(dp<1.5*u)c=r3mix(c,pathCol,r3ss(1.5*u,.7*u,dp)*.85);}
    {const dd=Math.hypot(x,y)/rc(Math.atan2(y,x));if(dd>.86&&h<.6){const wv=.9-.12*r3ss(.86,1,dd);c=[c[0]*wv,c[1]*wv,c[2]*wv,1];}}
    if(LM&&!onPeak){const ld=Math.hypot(x-LM[0],y-LM[1]);if(ld<pr*1.5&&D.b!=='snow')c=r3mix(dirt,c,r3ss(.6*pr,1.5*pr,ld)*.8+.2);}
    if(D.b==='volcanic'||D.b==='fireice'&&x<0){for(const p of peaks){const dd=Math.hypot(x-p[0],y-p[1]);if(dd<p[3]*.28&&h>PL+1)c=r3mix(c,lava,.8);}}
    return c;};
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){
    if(hz[j][i]<-.08&&hz[j+1][i+1]<-.08&&hz[j][i+1]<-.08&&hz[j+1][i]<-.08)continue;
    const xs=[-ext+i*step,-ext+(i+1)*step],ys=[-ext+j*step,-ext+(j+1)*step];
    for(const tri of [[[0,0],[1,0],[1,1]],[[0,0],[1,1],[0,1]]])for(const [a,b] of tri){const x=xs[a],y=ys[b],h=Math.max(-.12,hz[j+b][i+a]),n=nAt(i+a,j+b),c=(CU&&CU.color&&CU.color(x,y,h,1-n[2],colorAt,{rc,R,u,S0,H}))||colorAt(x,y,h,1-n[2]);G.P.push(x,y,h);G.N.push(...n);G.Cl.push(c[0],c[1],c[2],1);G.Tw.push(0);}
  }
  const tops=[],occ=[],flags=[],Hs=H;
  const ban=(x,y,z,sc)=>{if(owner)w3Banner(G,x,y,z,oc,crew,sc||1);};
  /* île sur mesure : tout ce qui lui est propre (monuments, architecture, végétation) */
  let top=PL+4;
  if(CU&&CU.build){const kk={G,tops,occ,H:Hs,rc,R,u,rnd,oc,owner,aP,t,ban,S0,PL,pc,pal,D,top:0,lvl:t.city?t.city.lvl:0,city:t.city};try{CU.build(kk);}catch(e){console.warn('île sur mesure',t.name,e);}top=Math.max(top,kk.top);}
  /* monument de l'île */
  if(LM){const z=Hs(LM[0],LM[1]),o=D.lmo||{};const kit={G,x:LM[0],y:LM[1],z,s:lmS,o,oc,rnd,tops,top:z+5,ban:(x,y,zz)=>ban(x,y,zz,1.1),H:Hs,rc,aP,u,R,pr};
    (W3LM[D.lm]||W3LM.default)(kit);try{(W3DET[D.lm]||(()=>{}))(kit);}catch(e){console.warn('détail',D.lm,e);}top=Math.max(top,kit.top);occ.push([LM[0],LM[1],pr*1.15]);}
  for(const ex of (D.ex||[])){const [nm,fx,fy,sc,o]=ex,x=fx*R,y=fy*R;if(Math.hypot(x,y)>rc(Math.atan2(y,x))*.88&&nm!=='ship'&&nm!=='fleet')continue;
    const z=Math.max(0,Hs(x,y)),kit={G,x,y,z,s:(sc||1)*u*.9,o:o||{},oc,rnd,tops,top:z+4,ban:()=>{}};(W3LM[nm]||W3LM.default)(kit);occ.push([x,y,4*u]);}
  if(D.lake){const [lx,ly,lr]=D.lake,cx=lx*R,cy=ly*R,rr=lr*R*.6,z=Hs(cx,cy)+.05;for(let i=0;i<20;i++){const a0=i/20*6.2832,a1=(i+1)/20*6.2832;G.tri([cx,cy,z],[cx+Math.cos(a0)*rr,cy+Math.sin(a0)*rr,z],[cx+Math.cos(a1)*rr,cy+Math.sin(a1)*rr,z],[.2,.62,.78,1],[0,0,1],[0,0,1],[0,0,1]);}occ.push([cx,cy,rr]);}
  /* maisons : nombre selon la ville (village → niveau 3), style de l'île */
  const lvl=t.city?t.city.lvl:0,base=D.town||0,nH=Math.min(34,Math.round(base*(t.city?[.8,1,1.25,1.5][lvl]:.7)*(t.city||base?1:0)));
  const spots=(n,tries,ok,f)=>{let k=0;for(let q=0;q<tries&&k<n;q++){const a=rnd()*6.2832,d=(.12+rnd()*.72)*rc(a),x=Math.cos(a)*d,y=Math.sin(a)*d;if(!ok(x,y))continue;f(x,y);k++;}return k;};
  const flat=(x,y,w)=>{const h0=Hs(x,y);return Math.abs(h0-Hs(x+w,y))<.5&&Math.abs(h0-Hs(x,y+w))<.5&&h0>.35;};
  const free=(x,y,m)=>!occ.some(o=>Math.hypot(x-o[0],y-o[1])<o[2]+m)&&dPath(x,y)>1.1*u;
  const OC={free,push:(x,y,r)=>occ.push([x,y,r])};
  const houseS=D.houseS||1;
  spots(nH,nH*40,(x,y)=>Math.hypot(x,y)<rc(Math.atan2(y,x))*.8&&flat(x,y,2.4*houseS)&&free(x,y,1.8),(x,y)=>{const w=(1.6+rnd()*.8)*houseS;occ.push([x+w/2,y+w/2,w*.9]);w3House(G,tops,D.house||'gable',x,y,Hs(x,y),w,rnd,D);});
  /* bâtiments de la ville (mêmes règles que le jeu) : port marchand, fortin, camp */
  const has=b=>!!(t.city&&t.city.b.includes(b));
  const kitV={G,x:LM?LM[0]:0,y:LM?LM[1]:0,z:0,s:u,o:{},oc,rnd,tops,H:Hs,rc,aP,u,R,pr,top:0,ban:()=>{}};
  if(!(CU&&CU.noHarbor))w3Harbor(kitV,lvl,has('marche'),!owner);
  w3Village(kitV,0,LM?7:0,LM&&D.b!=='volcanic'?3:0,OC);
  if(has('muraille')){const cx0=.0,cy0=.0,rr=.5*R,st=r3c('#d7bf91');for(let q=0;q<30;q++){const a=q/30*6.2832,x=cx0+Math.cos(a)*rr,y=cy0+Math.sin(a)*rr*.9;if(Hs(x,y)<.4)continue;const z=Hs(x,y);G.box(x-.5,y-.5,z-.1,1,1,1.3,st);if(q%2===0)G.box(x-.5,y-.5,z+1.2,.4,.4,.3,st);if(q%6===0){G.cyl(x,y,z-.1,.62,2.3,st,10);G.cone(x,y,z+2.2,.8,.9,r3c('#b9483a'),10);tops.push([x-.6,y-.6,x+.6,y+.6,z+3]);}}}
  if(has('caserne')){const x0=.35*R,y0=.3*R;for(let q=0;q<5;q++){const x=x0+(q%3)*1.7,y=y0+Math.floor(q/3)*1.7,z=Hs(x,y);if(z<.4)continue;G.cone(x,y,z-.05,.8,1.15,q%2?r3c('#e9dfc8'):oc,4);}}
  /* végétation : nombre selon l'île, positions libres et peu pentues */
  for(const tr of (D.trees||[])){const [kind,n,side]=tr,fn=W3T[W3_TREE[kind]||'round'],cnt=Math.round(n*1.5*(R/30)),cols=pc.tree;
    const col=kind==='blossom'?r3c('#f6a6c4'):kind==='orange'?r3c('#e8a24a'):kind==='pineSnow'?r3c('#2f6a52'):kind==='crystal'?r3c(side==='east'?'#9ad8f0':'#b27ae8'):kind==='candy'?r3c(rnd()<.5?'#f98ab8':'#8ad8c8'):null;
    spots(cnt,cnt*30,(x,y)=>{const d=Math.hypot(x,y)/rc(Math.atan2(y,x));return d<.85&&Hs(x,y)>.45&&flat(x,y,1)&&free(x,y,.6)&&(!side||(side==='east'?x>0:x<0));},(x,y)=>{
      const s=(.85+rnd()*.5)*u*(kind==='jungle'?1.5:1);occ.push([x,y,s*.9]);fn(G,x,y,Hs(x,y),s,col||cols[(rnd()*cols.length)|0],rnd,tops,kind==='pineSnow');});}
  w3Garden(kitV,pc,D.b,OC);
  /* quelques rochers pour le relief */
  spots(9,120,(x,y)=>Hs(x,y)>.3&&free(x,y,.5),(x,y)=>{const r=(.5+rnd()*.6)*u;G.ico(x,y,Hs(x,y)+r*.1,r,.6,pc.rock,rnd,.3);tops.push([x-r,y-r,x+r,y+r,Hs(x,y)+r*.7]);});
  w3Rings(G,rc,oc,!!owner);
  return {G,tops,A:{H,rc,R,pa:aP},ext,top:top+3,H};
}

/* ---------- lumière cuite dans les sommets (ombres portées + occlusion), même soleil que le prototype ---------- */
/* hauteur visible (sol + toits) sur une grille 200×200 : sert aux ombres et à l'occlusion de l'éclairage cuit */
function w3HF(M){
  const ext=M.ext,S=200,cell=2*ext/S,hf=new Float32Array(S*S);
  for(let j=0;j<S;j++)for(let i=0;i<S;i++)hf[j*S+i]=M.H(-ext+(i+.5)*cell,-ext+(j+.5)*cell);
  for(const b of M.tops){const i0=Math.max(0,Math.floor((b[0]+ext)/cell)),i1=Math.min(S-1,Math.ceil((b[2]+ext)/cell)),j0=Math.max(0,Math.floor((b[1]+ext)/cell)),j1=Math.min(S-1,Math.ceil((b[3]+ext)/cell));
    for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++)if(b[4]>hf[j*S+i])hf[j*S+i]=b[4];}
  return (x,y)=>{const i=Math.floor((x+ext)/cell),j=Math.floor((y+ext)/cell);if(i<0||j<0||i>=S||j>=S)return -9;return hf[j*S+i];};}
/* éclairage cuit d'un sommet, sans la teinte du propriétaire : o[k..k+2] = couleur, o[k+3] = composante verticale de la normale
   effectivement éclairée (retournée pour les faces à deux côtés), qui décide de la teinte du sol */
function w3Lit(hAt,x,y,z,nx,ny,nz,cr,cg,cb,two,o,k){
  const L=R3_SUN;let df=nx*L[0]+ny*L[1]+nz*L[2];if(two){if(df<0){nx=-nx;ny=-ny;nz=-nz;df=-df;}}else df=Math.max(df,0);
  let sh=1;const qx=x+nx*.38,qy=y+ny*.38,qz=z+nz*.38;for(let i=1;i<34;i++){const kk=i*.28;if(hAt(qx+L[0]*kk,qy+L[1]*kk)>qz+L[2]*kk+.12){sh=0;break;}}
  let ao=0;for(let i=0;i<8;i++){const a=i*.785;ao+=Math.max(0,Math.min(1,(hAt(x+Math.cos(a)*1.1,y+Math.sin(a)*1.1)-z)/1.4));}ao=1-ao/8*.38*Math.max(0,Math.min(1,nz));
  const sk=(.70+.14*Math.max(0,nz))*ao,su=df*(.5+.5*sh)*.60;
  let r=cr*(.62*sk+1.05*su),g=cg*(.70*sk+.96*su),b=cb*(.86*sk+.82*su);
  const lum=r*.3+g*.59+b*.11;r=lum+(r-lum)*1.16+cr*.06*(1-nz);g=lum+(g-lum)*1.16+cg*.04*(1-nz);b=lum+(b-lum)*1.16+cb*.01*(1-nz);
  o[k]=r;o[k+1]=g;o[k+2]=b;o[k+3]=nz;}
function w3Bake(M,t){
  const G=M.G,hAt=w3HF(M);
  const nv=G.P.length/3,OL=[[],[],[],[]],Tt=[],LV=new Uint8Array(nv);for(const o of (G.objs||[]))LV.fill(o[2],o[0],Math.min(o[1],nv));let O;const oc3=t&&t.owner>=0?r3c(COLORS[t.owner]):null;
  const q=[0,0,0,0];
  for(let v=0;v<nv;v++){
    const x=G.P[v*3],y=G.P[v*3+1],z=G.P[v*3+2],cr=G.Cl[v*4],cg=G.Cl[v*4+1],cb=G.Cl[v*4+2],ca=G.Cl[v*4+3];const nz0=G.N[v*3+2];
    if(ca<.995&&nz0>.99&&z<.1){Tt.push(x,y,z,cr,cg,cb,ca);continue;}              /* anneaux au niveau de la mer : sans éclairage */
    w3Lit(hAt,x,y,z,G.N[v*3],G.N[v*3+1],nz0,cr,cg,cb,G.Tw[v]===1,q,0);let r=q[0],g=q[1],b=q[2];const nz=q[3];
    /* île conquise : le sol (faces tournées vers le haut) prend la couleur du joueur, plus fortement pour nos propres îles */
    if(oc3&&nz>.55){const k=(t.owner===ME?.30:.15)*Math.min(1,(nz-.55)/.3),lm=r*.3+g*.59+b*.11,lo=Math.max(.15,oc3[0]*.3+oc3[1]*.59+oc3[2]*.11),f=lm/lo;r+=(oc3[0]*f-r)*k;g+=(oc3[1]*f-g)*k;b+=(oc3[2]*f-b)*k;}
    O=OL[LV[v]];O.push(x,y,z,r,g,b,1);
  }
  /* sommets rangés par niveau de détail : 0 (toujours), 1 (moyen), 2 (fin), 3 (très fin) */
  const n0=OL[0].length/7,n1=n0+OL[1].length/7,n2=n1+OL[2].length/7;
  return {O:new Float32Array(OL[0].concat(OL[1],OL[2],OL[3])),T:new Float32Array(Tt),n0,n1,n2};
}

/* ---------- WebGL ---------- */
const W3_VS='attribute vec3 p;attribute vec4 c;uniform vec3 eye,cr,cu,cf,off;uniform vec4 P;varying vec4 vc;varying float vz;varying vec3 wp;'
 +'void main(){vec3 q=p+off,d=q-eye;float x=dot(d,cr),y=dot(d,cu),z=dot(d,cf);gl_Position=vec4(x*P.x,y*P.y,(z*(P.w+P.z)-2.*P.w*P.z)/(P.w-P.z),z);vc=c;vz=z;wp=q;}';
const W3_FS='precision mediump float;varying vec4 vc;varying float vz;varying vec3 wp;uniform vec3 fogc;uniform float fogd;'
 +'void main(){float f=clamp((vz-fogd)/(fogd*1.6),0.,.7);vec3 col=mix(vc.rgb,fogc,f);gl_FragColor=vec4(col*vc.a,vc.a);}';
const W3_SFS='precision mediump float;varying vec4 vc;varying float vz;varying vec3 wp;uniform sampler2D SEA;uniform vec3 fogc;uniform float fogd,T;uniform vec3 eye;'
 +'void main(){vec2 uv=clamp(wp.xy/vec2(1400.,860.),0.,1.);vec3 c=texture2D(SEA,uv).rgb;'
 +'float w=sin(wp.x*.33+T*.9+sin(wp.y*.21+T*.4)*1.7)*sin(wp.y*.29-T*.7+sin(wp.x*.17)*1.3);float g=smoothstep(.82,1.,w);float w2=sin(wp.x*.9-T*1.3)*sin(wp.y*.8+T*1.1);g+=smoothstep(.93,1.,w2)*.6;'
 +'c+=vec3(.55,.8,.85)*g*.20;c*=.97+.03*w;float f=clamp((vz-fogd)/(fogd*1.9),0.,.8);c=mix(c,fogc,f);gl_FragColor=vec4(c,1.);}';
function w3Init(){
  if(W3.gl||W3.fail)return W3.gl;
  try{
    const cv=document.createElement('canvas');cv.id='w3gl';cv.setAttribute('aria-hidden','true');
    const gl=cv.getContext('webgl',{antialias:true,alpha:false,premultipliedAlpha:true,preserveDrawingBuffer:true});if(!gl)throw new Error('WebGL indisponible');
    const sh=(ty,src)=>{const s=gl.createShader(ty);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
    const mk=(vs,fs)=>{const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,vs));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;};
    W3.pI=mk(W3_VS,W3_FS);W3.pS=mk(W3_VS,W3_SFS);W3.gl=gl;W3.cv=cv;
    cv.style.cssText='position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:block;pointer-events:none;';
    canvas.parentNode.insertBefore(cv,canvas);
    cv.addEventListener('webglcontextlost',e=>{e.preventDefault();W3.fail='contexte perdu';W3.gl=null;w3Off();});
    /* plan de mer */
    const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);const X0=-1800,X1=3200,Y0=-1400,Y1=2300;
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([X0,Y0,0,.5,.8,.85,1,X1,Y0,0,.5,.8,.85,1,X1,Y1,0,.5,.8,.85,1,X0,Y0,0,.5,.8,.85,1,X1,Y1,0,.5,.8,.85,1,X0,Y1,0,.5,.8,.85,1]),gl.STATIC_DRAW);W3.seaBuf=b;
    if(!R25.sea25){r25SeaBuild_o();R25.sea25=R25.sea;}
    if(!R3D.sea3)R3D.sea3=r3SeaMake(R25.sea25);
    const tx=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tx);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,R3D.sea3);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);W3.seaTex=tx;
  }catch(err){W3.fail=String(err&&err.message||err);}
  return W3.gl;
}
/* modèle d'une île : construit, éclairé puis envoyé au GPU (une île à la fois, hors du chemin de dessin) */
function w3Upload(t,key){
  const gl=W3.gl,t0=performance.now(),M=w3BuildIsland(t),B=w3Bake(M,t),old=W3.models.get(t.id);
  if(old){gl.deleteBuffer(old.bo);gl.deleteBuffer(old.bt);if(old.alt)for(const a of old.alt)gl.deleteBuffer(a.bo);}
  const bo=gl.createBuffer(),bt=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,bo);gl.bufferData(gl.ARRAY_BUFFER,B.O,gl.STATIC_DRAW);gl.bindBuffer(gl.ARRAY_BUFFER,bt);gl.bufferData(gl.ARRAY_BUFFER,B.T,gl.STATIC_DRAW);
  /* étendue du modèle vers le sud (tête de Zunesha, navires…) : l'étiquette du nom se place en dessous */
  let ys=0;for(let i=0;i<B.O.length;i+=7)if(B.O[i+2]>.4&&B.O[i+1]>ys)ys=B.O[i+1];
  const ysd=ys;if(M.bx&&typeof blxYs==='function')ys=Math.max(ys,blxYs(M.bx,t));   /* île Blender : son modèle (envoyé à part) compte aussi */
  /* modèles à niveaux de détail séparés (glTF Blender : lod1, lod2) */
  let alt=null;if(M.alts){alt=M.alts.map(G2=>{const B2=w3Bake({G:G2,H:M.H,tops:M.tops,ext:M.ext},t),b2=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b2);gl.bufferData(gl.ARRAY_BUFFER,B2.O,gl.STATIC_DRAW);return {bo:b2,no:B2.O.length/7};});}
  W3.models.set(t.id,{key,bo,bt,ys,ysd,alt,bl:!!M.bl,bx:M.bx||null,no:B.O.length/7,n0:B.n0,n1:B.n1,n2:B.n2,nt:B.T.length/7,top:M.top,rc:M.A.rc,pa:M.A.pa,H:M.H,ms:Math.round(performance.now()-t0)});W3.built++;
}
function w3Queue(){
  for(const t of terrs){const k=r3Key(t),m=W3.models.get(t.id);if((!m||m.key!==k)&&!W3.q.some(q=>q.id===t.id))W3.q.push({id:t.id,key:k});}
  const t0=performance.now();
  while(W3.q.length&&performance.now()-t0<14){const q=W3.q.shift(),t=terrs[q.id];if(t)try{w3Upload(t,q.key);}catch(err){W3.fail='île '+t.name+' : '+(err&&err.message||err);console.error(err);}}
}
function w3Draw(c,now){
  const gl=W3.gl,cv=W3.cv;
  gl.viewport(0,0,cv.width,cv.height);gl.clearColor(.62,.86,.92,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);gl.disable(gl.BLEND);gl.depthMask(true);
  const near=20,far=Math.max(6000,c.D*6),fog=[.62,.86,.92],fd=c.D*1.8;
  const setU=(pr)=>{const u=n=>gl.getUniformLocation(pr,n);gl.uniform3fv(u('eye'),c.eye);gl.uniform3fv(u('cr'),c.r);gl.uniform3fv(u('cu'),c.u);gl.uniform3fv(u('cf'),c.f);gl.uniform4f(u('P'),1/c.tx,1/c.ty,near,far);gl.uniform3fv(u('fogc'),fog);gl.uniform1f(u('fogd'),fd);return u;};
  const bind=(pr,buf)=>{gl.bindBuffer(gl.ARRAY_BUFFER,buf);const lp=gl.getAttribLocation(pr,'p'),lc=gl.getAttribLocation(pr,'c');gl.enableVertexAttribArray(lp);gl.vertexAttribPointer(lp,3,gl.FLOAT,false,28,0);gl.enableVertexAttribArray(lc);gl.vertexAttribPointer(lc,4,gl.FLOAT,false,28,12);};
  /* mer */
  let pr=W3.pS;gl.useProgram(pr);let u=setU(pr);gl.uniform3f(u('off'),0,0,0);gl.uniform1f(u('T'),now/1000);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,W3.seaTex);gl.uniform1i(u('SEA'),0);
  bind(pr,W3.seaBuf);gl.drawArrays(gl.TRIANGLES,0,6);
  /* îles : opaque, puis translucide (écume, bas-fond, liseré) */
  pr=W3.pI;gl.useProgram(pr);u=setU(pr);let tris=0;const offL=u('off');
  /* îles hors champ : non dessinées (grand gain en gros plan) */
  const vis=new Set(),PK=new Map();for(const t of terrs){const p=w3Proj(t.x,t.y,4,c);if(!p)continue;const mg=(1.7*t.rad+22)*p.k;if(p.sx>-mg&&p.sx<cv.width+mg&&p.sy>-mg*1.3&&p.sy<cv.height+mg){vis.add(t.id);PK.set(t.id,p.k);}}
  /* niveau de détail selon la taille de l'île à l'écran (pixels par unité de carte) : les petits objets n'apparaissent que lorsqu'ils dépassent ~2 pixels */
  const cnt=(m,id)=>{if(!R3_LOD.on||m.n0===undefined)return m.no;const k=PK.get(id)||9;return k<R3_LOD.p1?m.n0:k<R3_LOD.p2?m.n1:k<R3_LOD.p3?m.n2:m.no;};
  W3.nvis=vis.size;const BX=[];
  for(const t of terrs){if(!vis.has(t.id))continue;const m=W3.models.get(t.id);if(m&&m.bx)BX.push(t);if(!m||!m.no)continue;gl.uniform3f(offL,t.x,t.y,0);let bb=m.bo,nn;if(m.alt&&R3_LOD.on){const k=PK.get(t.id)||9,a=k<R3_LOD.p1?m.alt[1]:k<R3_LOD.p2?m.alt[0]:null;if(a){bb=a.bo;nn=a.no;}else nn=m.no;}else nn=cnt(m,t.id);bind(pr,bb);gl.drawArrays(gl.TRIANGLES,0,nn);tris+=nn/3;}
  /* îles Blender : modèle fixe (éclairage cuit une fois, teinte du propriétaire et niveau de ville au dessin), programme dédié */
  if(BX.length&&typeof blxDraw3==='function'){tris+=blxDraw3(c,BX,PK,near,far,fog,fd);gl.useProgram(pr);}
  gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
  for(const t of terrs){if(!vis.has(t.id))continue;const m=W3.models.get(t.id);if(!m||!m.nt)continue;gl.uniform3f(offL,t.x,t.y,0);bind(pr,m.bt);gl.drawArrays(gl.TRIANGLES,0,m.nt);}
  gl.depthMask(true);W3.tris=tris;
}

/* tableau de sommets dynamiques (x,y,z,r,g,b,a ×n), dessiné avec le programme des îles ; blend=true : translucide */
function w3DrawArr(c,arr,blend){
  if(!arr.length)return;const gl=W3.gl,pr=W3.pI;gl.useProgram(pr);const u=n=>gl.getUniformLocation(pr,n);
  gl.uniform3fv(u('eye'),c.eye);gl.uniform3fv(u('cr'),c.r);gl.uniform3fv(u('cu'),c.u);gl.uniform3fv(u('cf'),c.f);gl.uniform4f(u('P'),1/c.tx,1/c.ty,20,Math.max(6000,c.D*6));gl.uniform3f(u('fogc'),.62,.86,.92);gl.uniform1f(u('fogd'),c.D*1.8);gl.uniform3f(u('off'),0,0,0);
  if(!W3.dynBuf)W3.dynBuf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,W3.dynBuf);gl.bufferData(gl.ARRAY_BUFFER,arr,gl.DYNAMIC_DRAW);
  const lp=gl.getAttribLocation(pr,'p'),lc=gl.getAttribLocation(pr,'c');gl.enableVertexAttribArray(lp);gl.vertexAttribPointer(lp,3,gl.FLOAT,false,28,0);gl.enableVertexAttribArray(lc);gl.vertexAttribPointer(lc,4,gl.FLOAT,false,28,12);
  if(blend){gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);}else{gl.disable(gl.BLEND);gl.depthMask(true);}
  gl.drawArrays(gl.TRIANGLES,0,arr.length/7);gl.depthMask(true);gl.disable(gl.BLEND);
}
/* éclairage simple (sans ombres) d'une géométrie dynamique : même soleil que les îles */
function w3Shade(G,k){k=k||1;const L=R3_SUN,n=G.P.length/3,o=new Float32Array(n*7);
  for(let v=0;v<n;v++){let nx=G.N[v*3],ny=G.N[v*3+1],nz=G.N[v*3+2],df=nx*L[0]+ny*L[1]+nz*L[2];if(G.Tw[v]===1&&df<0)df=-df;df=Math.max(df,0);const sk=.72+.14*Math.max(0,nz),su=df*.62,a=G.Cl[v*4+3];
    o[v*7]=G.P[v*3];o[v*7+1]=G.P[v*3+1];o[v*7+2]=G.P[v*3+2];o[v*7+3]=Math.min(1.2,G.Cl[v*4]*(.62*sk+1.05*su)*k);o[v*7+4]=Math.min(1.2,G.Cl[v*4+1]*(.7*sk+.96*su)*k);o[v*7+5]=Math.min(1.2,G.Cl[v*4+2]*(.86*sk+.82*su)*k);o[v*7+6]=a;}
  return o;}

/* ---------- couche d'interface : routes, armées, jetons, noms (canvas 2D de la carte, en projection) ---------- */
function w3Overlay(c,now){
  const dpr=canvas.width/ui.cssW,T=REDUCE?0:now,me=players[ME],sel=ui.sel>=0?terrs[ui.sel]:null,flow=REDUCE?0:now/55,showNames=1000/ui.cssW/V.k<1.6;
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.textAlign='center';ctx.textBaseline='middle';
  const P=(x,y,z)=>w3Proj(x,y,z||0,c);
  /* noms des régions, posés sur la mer */
  {ctx.save();for(const R of regs){const p=P(R.lx!==undefined?R.lx:R.cx,R.ly!==undefined?R.ly:R.cy,0);if(!p)continue;const own=players.find(q=>q.alive&&regionHeld(R,q.id));
    ctx.font='800 '+Math.max(9*dpr,p.k*14)+'px "Big Shoulders Display",Inter,sans-serif';try{ctx.letterSpacing=(p.k*3)+'px';}catch(_){}ctx.fillStyle=own?COLORS[own.id]:'rgba(255,255,255,.34)';ctx.globalAlpha=own?.55:1;ctx.fillText(R.n.toUpperCase(),p.sx,p.sy);}
    try{ctx.letterSpacing='0px';}catch(_){}ctx.restore();}
  /* routes maritimes */
  ctx.save();ctx.lineCap='round';
  for(const rt of routes){const A=terrs[rt[0]],B=terrs[rt[1]],dx=B.x-A.x,dy=B.y-A.y,dl=Math.hypot(dx,dy)||1,ux=dx/dl,uy=dy/dl;
    const p1=P(A.x+ux*(A.rad+2),A.y+uy*(A.rad+2),.25),p2=P(B.x-ux*(B.rad+2),B.y-uy*(B.rad+2),.25);if(!p1||!p2)continue;
    const hot=sel&&(sel.id===rt[0]||sel.id===rt[1]),oa=A.owner,ob=B.owner,k=(p1.k+p2.k)/2;let col='rgba(255,255,255,.55)';
    if(rt[2])col='rgba(255,178,140,.85)';else if(oa>=0&&oa===ob)col=rgbaP(oa,.95);else if(oa>=0&&ob>=0&&oa!==ob&&isWar(oa,ob))col='rgba(255,98,86,.95)';
    ctx.setLineDash([]);ctx.strokeStyle='rgba(3,40,60,.35)';ctx.lineWidth=Math.max(2.6*dpr,k*(4.4+(hot?1.4:0)));ctx.beginPath();ctx.moveTo(p1.sx,p1.sy);ctx.lineTo(p2.sx,p2.sy);ctx.stroke();
    ctx.strokeStyle=hot?'rgba(255,240,200,.98)':col;ctx.lineWidth=Math.max(1.5*dpr,k*(2.1+(hot?1.1:0)));const dsh=Math.max(5*dpr,k*7);ctx.setLineDash(rt[2]?[dsh*.3,dsh*.7]:[dsh,dsh*.7]);ctx.lineDashOffset=-flow*.35*k;
    ctx.beginPath();ctx.moveTo(p1.sx,p1.sy);ctx.lineTo(p2.sx,p2.sy);ctx.stroke();}
  ctx.setLineDash([]);ctx.restore();
  /* anneaux au sol : sélection, survol, cibles possibles */
  const ring=(t,rad,col,w,dash)=>{const pts=[];for(let i=0;i<=40;i++){const a=i/40*6.2832,p=P(t.x+Math.cos(a)*rad,t.y+Math.sin(a)*rad,.2);if(!p)return;pts.push(p);}
    ctx.strokeStyle=col;ctx.lineWidth=w;ctx.setLineDash(dash||[]);ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.sx,p.sy):ctx.moveTo(p.sx,p.sy));ctx.stroke();ctx.setLineDash([]);};
  const pulse=.5+.5*Math.sin(now/260);
  if(sel&&sel.owner===ME&&ui.mode==='move')for(const n of sel.nb){const t=terrs[n],hostile=t.owner<0||(t.owner!==ME&&isWar(ME,t.owner));ring(t,t.rad*(1.15+pulse*.06),t.owner===ME?'rgba(110,235,160,.95)':hostile?'rgba(255,125,105,.95)':'rgba(130,170,220,.7)',2.6*dpr);}
  if(sel){ring(sel,sel.rad*1.12,'rgba(255,255,255,.35)',6*dpr);ring(sel,sel.rad*1.12,'#fff',2.4*dpr,[8*dpr,5*dpr]);}
  if(ui.hover>=0&&ui.hover!==ui.sel&&terrs[ui.hover])ring(terrs[ui.hover],terrs[ui.hover].rad*1.1,'rgba(255,255,255,.75)',2.2*dpr);
  /* ordres du tour en préparation */
  if(TM.on&&TM.phase==='plan')for(const o of TM.queue){if(o.s!==ME||!terrs[o.f]||!terrs[o.to])continue;const f=terrs[o.f],t=terrs[o.to],a=Math.atan2(t.y-f.y,t.x-f.x),p1=P(f.x+Math.cos(a)*f.rad*.9,f.y+Math.sin(a)*f.rad*.9,.5),p2=P(t.x-Math.cos(a)*t.rad*.9,t.y-Math.sin(a)*t.rad*.9,.5);if(!p1||!p2)continue;
    ctx.setLineDash([7*dpr,5*dpr]);drawArrow(p1.sx,p1.sy,p2.sx,p2.sy,'rgba(255,255,255,.92)',(2+o.pct*2.4)*dpr);ctx.setLineDash([]);
    ctx.font='700 '+(11*dpr)+'px Inter,system-ui,sans-serif';ctx.lineWidth=3.4*dpr;ctx.strokeStyle='rgba(8,10,14,.85)';ctx.fillStyle='#fff';const mx=(p1.sx+p2.sx)/2,my=(p1.sy+p2.sy)/2-9*dpr;ctx.strokeText(Math.round(o.pct*100)+' %',mx,my);ctx.fillText(Math.round(o.pct*100)+' %',mx,my);}
  /* routes bloquées par un Roi des mers */
  for(const e of EV){if(e.k!=='seaking')continue;const A=terrs[e.a],B=terrs[e.b];if(!A||!B)continue;const p1=P(A.x,A.y,.3),p2=P(B.x,B.y,.3);if(!p1||!p2)continue;ctx.strokeStyle='rgba(255,90,80,.8)';ctx.lineWidth=3.4*dpr;ctx.setLineDash([8*dpr,6*dpr]);ctx.beginPath();ctx.moveTo(p1.sx,p1.sy);ctx.lineTo(p2.sx,p2.sy);ctx.stroke();ctx.setLineDash([]);
    const mx=(p1.sx+p2.sx)/2,my=(p1.sy+p2.sy)/2;ctx.fillStyle='rgba(10,50,52,.95)';ctx.strokeStyle='#5cc8b0';ctx.lineWidth=2*dpr;ctx.beginPath();ctx.arc(mx,my,9*dpr,0,6.283);ctx.fill();ctx.stroke();ctx.font='800 '+(12*dpr)+'px sans-serif';ctx.fillStyle='#8fe8d4';ctx.fillText('≋',mx,my);}
  /* navires marchands décoratifs, puis armées en mer */
  const shipAt=(x,y,dir,col,ph,sz)=>{const p=P(x,y,.9);if(!p)return null;drawShip(p.sx,p.sy,dir,col,Math.max(.55*dpr,p.k*sz),ph);return p;};
  if(!REDUCE)for(let i=0;i<routes.length;i++){const rt=routes[i],A=terrs[rt[0]],B=terrs[rt[1]];if(rt[2]||A.owner<0||A.owner!==B.owner||hsh(i*5+9)>.6)continue;
    const ph=(T/(11000+hsh(i)*5000)+hsh(i*3))%2,k=ph<1?ph:2-ph,dir=(ph<1?1:-1)*(B.x>=A.x?1:-1),kk=.14+.72*k;shipAt(A.x+(B.x-A.x)*kk,A.y+(B.y-A.y)*kk,dir,COLORS[A.owner],T/500+i,.16);}
  const incoming=new Set(),outgoing=new Set();
  for(const a of armies){const f=terrs[a.from],t=terrs[a.to],k=clamp(a.t/a.dur,0,1),x=f.x+(t.x-f.x)*k,y=f.y+(t.y-f.y)*k,dir=t.x>=f.x?1:-1;
    if(t.owner===ME&&a.owner!==ME)incoming.add(a.to);if(a.owner===ME&&t.owner!==ME)outgoing.add(a.to);
    const sp3=(typeof PXS!=='undefined'&&PXS.on&&PXS.ships3d&&!PXS.fail&&PXS.mode!=='off')?pxShipPos(a):null;
    const p=sp3?P(sp3.x,sp3.y,3.2):shipAt(x,y,dir,COLORS[a.owner],now/320+a.from,.3);if(!p)continue;
    const n=(a.rt?'↩ ':a.owner===ME&&a.s?STANCE[a.s].ic+' ':'')+String(Math.floor(sumU(a.u)));ctx.font='800 '+(10.5*dpr)+'px Inter,system-ui,sans-serif';const tw=ctx.measureText(n).width+9*dpr;
    ctx.fillStyle='rgba(8,14,24,.9)';rr(p.sx-tw/2,p.sy+10*dpr,tw,13*dpr,6*dpr);ctx.fill();ctx.strokeStyle=COLORS[a.owner];ctx.lineWidth=1.5*dpr;ctx.stroke();ctx.fillStyle='#fff';ctx.fillText(n,p.sx,p.sy+16.5*dpr);}
  /* jetons des îles : rangés du fond vers l'avant (les plus proches par-dessus) */
  const dep=t=>(t.x-c.eye[0])*c.f[0]+(t.y-c.eye[1])*c.f[1],order=terrs.map(t=>({t,m:W3.models.get(t.id)})).sort((a,b)=>dep(b.t)-dep(a.t));
  const ltMap={};for(let i=0;i<LEGENDS.length;i++){const ch=CH[i];if(ch&&ch.own>=0&&ch.post>=0&&terrs[ch.post]&&terrs[ch.post].owner===ch.own)ltMap[ch.post]=i;}
  for(const {t,m} of order){
    const own=t.owner,col=own>=0?COLORS[own]:'#d8cfb0',isCity=!!t.city,zt=m?Math.max(6,m.top):7,pa=P(t.x,t.y,zt),pg=P(t.x,t.y,0);if(!pa||!pg)continue;
    const sc=clamp(pa.k*.42,.75*dpr,1.55*dpr),bw0=String(Math.floor(tr(t))).length,w=(bw0>2?36:30)*sc,h=(isCity?25:22)*sc,x=pa.sx,y=pa.sy-12*sc;
    if(t.fo>time){ctx.strokeStyle='#f2c75c';ctx.lineWidth=2*sc;ctx.setLineDash([5*sc,3*sc]);ctx.beginPath();ctx.ellipse(x,y,w*.85,h*.95,0,0,6.283);ctx.stroke();ctx.setLineDash([]);}
    if(incoming.has(t.id)){ctx.strokeStyle='rgba(255,72,60,'+(.55+.4*pulse)+')';ctx.lineWidth=3*sc;rr(x-w/2-5*sc,y-h/2-5*sc,w+10*sc,h+10*sc,h*.4);ctx.stroke();}
    if(outgoing.has(t.id)){ctx.strokeStyle='rgba(255,226,140,.9)';ctx.lineWidth=2.4*sc;ctx.setLineDash([4*sc,3*sc]);ctx.lineDashOffset=-now/60;rr(x-w/2-4*sc,y-h/2-4*sc,w+8*sc,h+8*sc,h*.4);ctx.stroke();ctx.setLineDash([]);}
    /* pied du jeton : fine ligne vers l'île */
    ctx.strokeStyle='rgba(8,14,24,.55)';ctx.lineWidth=1.4*sc;ctx.beginPath();ctx.moveTo(x,y+h/2);ctx.lineTo(pa.sx,pa.sy);ctx.stroke();
    ctx.fillStyle='rgba(6,12,22,.92)';ctx.strokeStyle=own>=0?col:'rgba(216,207,176,.9)';ctx.lineWidth=2.6*sc;rr(x-w/2,y-h/2,w,h,h*.34);ctx.fill();ctx.stroke();
    ctx.fillStyle='#fff';ctx.font='800 '+(14.5*sc)+'px Inter,system-ui,sans-serif';const tn=String(Math.floor(tr(t)));ctx.fillText(tn,x,y-(isCity?2.2*sc:.5*sc));
    if(isCity){ctx.fillStyle='rgba(255,255,255,.9)';for(let q=0;q<t.city.lvl;q++){ctx.beginPath();ctx.arc(x+(q-(t.city.lvl-1)/2)*4.6*sc,y+h*.32,1.5*sc,0,6.283);ctx.fill();}}
    if(own>=0){const cap=30+(players[own].mod?players[own].mod.cap||0:0),fr=clamp(tr(t)/cap,0,1);ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=2*sc;ctx.beginPath();ctx.moveTo(x-w/2+h*.3,y+h/2+3*sc);ctx.lineTo(x-w/2+h*.3+(w-h*.6)*fr,y+h/2+3*sc);ctx.stroke();}
    if(t.capital)drawCrown(x,y-h/2-8*sc,1.2*sc);
    if(t.fruit){ctx.fillStyle='#c58cf0';ctx.strokeStyle='rgba(8,10,14,.85)';ctx.lineWidth=1.4*sc;ctx.beginPath();ctx.arc(x-w/2-2*sc,y+h/2,5*sc,0,6.283);ctx.fill();ctx.stroke();}
    if(t.boss!==undefined&&BS[t.boss]&&!BS[t.boss].dead){const st=BS[t.boss],bo=BOSSES[t.boss],fr=clamp(st.hp/bo.hp,0,1),gl=REDUCE?.5:.5+.5*Math.sin(now/340+t.id);
      ctx.strokeStyle='rgba(255,77,77,'+(.45+.35*gl)+')';ctx.lineWidth=2.4*sc;ctx.setLineDash([5*sc,4*sc]);rr(x-w/2-4*sc,y-h/2-4*sc,w+8*sc,h+8*sc,h*.4);ctx.stroke();ctx.setLineDash([]);
      ctx.font='700 '+(15*sc)+'px sans-serif';ctx.fillStyle='#ff6a5a';ctx.strokeStyle='rgba(8,10,14,.95)';ctx.lineWidth=3*sc;ctx.strokeText('☠',x,y-h/2-11*sc);ctx.fillText('☠',x,y-h/2-11*sc);
      const bw=40*sc,bx=x-bw/2,by=y-h/2-26*sc;ctx.fillStyle='rgba(8,10,14,.88)';ctx.fillRect(bx-1.5*sc,by-1.5*sc,bw+3*sc,6.5*sc);ctx.fillStyle='#ff4d4d';ctx.fillRect(bx,by,bw*fr,3.5*sc);}
    if(own>=0&&own!==ME&&isWar(ME,own)){ctx.fillStyle='rgba(120,16,16,.92)';ctx.strokeStyle='#ffb09a';ctx.lineWidth=1.4*sc;ctx.beginPath();ctx.arc(x-w/2-8*sc,y,7*sc,0,6.283);ctx.fill();ctx.stroke();drawSwords(x-w/2-8*sc,y,.7*sc,'#ffe0d6');}
    if(own>=0&&players[own].religion){const ic=RELS.find(q=>q.id===players[own].religion).ic;ctx.font=(10*sc)+'px sans-serif';ctx.fillStyle='#fff';ctx.strokeStyle='rgba(8,10,14,.8)';ctx.lineWidth=2.4*sc;ctx.strokeText(ic,x+w/2+7*sc,y);ctx.fillText(ic,x+w/2+7*sc,y);}
    const lti=ltMap[t.id];
    if(showNames||t.id===ui.sel||t.id===ui.hover||lti!==undefined){
      const mm=W3.models.get(t.id),pn=P(t.x,t.y+Math.max(t.rad*.95,mm&&mm.ys?mm.ys+1.2:0),0);if(pn){ctx.font='700 '+(Math.max(10,Math.min(pn.k*10.5,24*dpr)))+'px Inter,system-ui,sans-serif';ctx.lineWidth=4*dpr;ctx.strokeStyle='rgba(6,12,20,.85)';ctx.fillStyle='rgba(255,255,255,.97)';
        if((showNames||t.id===ui.sel||t.id===ui.hover)&&!(typeof PXS!=='undefined'&&PXS.land.some(l=>l.t.id===t.id))){const lh=parseFloat(ctx.font.split(' ')[1])*1.05;nameLines(t.name).forEach((l,k)=>{ctx.strokeText(l,pn.sx,pn.sy+8*dpr+k*lh);ctx.fillText(l,pn.sx,pn.sy+8*dpr+k*lh);});}
        if(lti!==undefined){ctx.fillStyle='#ffe9a8';const yy=pn.sy+8*dpr+((showNames||t.id===ui.sel||t.id===ui.hover)?13*dpr*nameLines(t.name).length:0);ctx.strokeText('♛ '+LEGENDS[lti].s,pn.sx,yy);ctx.fillText('♛ '+LEGENDS[lti].s,pn.sx,yy);}}}
  }
  /* glisser-envoyer : flèche depuis l'île de départ */
  if(drag&&drag.moved&&drag.id>=0&&terrs[drag.id].owner===ME){const f=terrs[drag.id],p1=P(f.x,f.y,.5),p2=P(ptr.x,ptr.y,.5);if(p1&&p2)drawArrow(p1.sx,p1.sy,p2.sx,p2.sy,'rgba(255,255,255,.9)',3*dpr);}
}

/* ---------- passage de relais : dessin de la carte ---------- */
function w3Off(){W3.act=false;tkey=[];const w=document.getElementById('mapwrap');if(w)w.classList.remove('w3');if(W3.cv)W3.cv.style.display='none';dirty=true;}
function w3Frame(){
  const t0=performance.now();
  if(!W3.gl&&!w3Init()){w3Off();W3.on=W3.on&&!W3.fail;return false;}
  if(!terrs.length||!canvas.width)return false;
  const cv=W3.cv;if(cv.width!==canvas.width||cv.height!==canvas.height){cv.width=canvas.width;cv.height=canvas.height;}
  cv.style.width=canvas.style.width;cv.style.height=canvas.style.height;cv.style.display='block';
  document.getElementById('mapwrap').classList.add('w3');
  const now=t0;fxScan(now);evBarRender(now);
  w3Queue();
  if(typeof PXS!=='undefined'&&PXS.atelier){try{pxAtelierFrame(now);}catch(e){console.warn('atelier :',e);PXS.atelier=null;pxAtelierOpen(false);}W3.frames++;return true;}
  const bt=B3.run;W3.c=bt?b3Cam(now):w3Cam();w3Draw(W3.c,now);if(bt)b3Scene(W3.c,now);if(typeof pxScene!=='undefined')pxScene(W3.c,now,!!bt);if(bt)b3Hud(now);else w3Overlay(W3.c,now);
  dirty=false;W3.frames++;W3.drawMs=Math.round(performance.now()-t0);return true;
}
function draw(){
  if(W3.on&&!W3.fail&&grid){W3.act=true;if(w3Frame())return;}
  if(W3.act){w3Off();}
  draw_o();
}

/* ---------- clics, survol, pan : pos(e) renvoie la position MONDE pour le jeu (rayon → mer → grille logique d'origine) ---------- */
{const pos0=pos;
pos=function(e){
  if(!W3.act)return pos0(e);
  const r=canvas.getBoundingClientRect(),k=canvas.width/r.width,sx=(e.clientX-r.left)*k,sy=(e.clientY-r.top)*k,c=W3.c||(W3.c=w3Cam());
  let g=w3Ground(sx,sy,c)||[c.cx,c.cy],best=-1,bd=1;
  /* une île dressée se touche aussi sur son relief : on retient l'île dont le volume projeté contient le pointeur */
  for(const t of terrs){const m=W3.models.get(t.id),zt=m?m.top*.5:3,p=w3Proj(t.x,t.y,zt,c);if(!p)continue;const d=Math.hypot(sx-p.sx,(sy-p.sy)*1.05)/(Math.max(t.rad*.82,10)*p.k);if(d<bd){bd=d;best=t.id;}}
  if(best>=0&&terrAt(g[0],g[1])!==best)g=[terrs[best].x,terrs[best].y];
  return {x:g[0],y:g[1],sx:e.clientX-r.left,sy:e.clientY-r.top};
};}
/* caméra : clic droit = tourner (horizontal) et incliner (vertical) ; Q/E = tourner ; le glisser du clic gauche déplace la vue sur la mer */
{let rot=null;
 canvas.addEventListener('contextmenu',e=>{if(W3.act)e.preventDefault();});
 canvas.addEventListener('pointerdown',e=>{if(!W3.act||e.button!==2)return;e.preventDefault();e.stopImmediatePropagation();rot={x:e.clientX,y:e.clientY,yaw:W3.cam.yaw,pitch:W3.cam.pitch};try{canvas.setPointerCapture(e.pointerId);}catch(_){}},true);
 canvas.addEventListener('pointermove',e=>{if(!rot)return;e.stopImmediatePropagation();W3.cam.yaw=rot.yaw+(e.clientX-rot.x)*.006;W3.cam.pitch=clamp(rot.pitch+(e.clientY-rot.y)*.004,.45,1.45);},true);
 const end=e=>{if(rot){rot=null;e.stopImmediatePropagation();}};canvas.addEventListener('pointerup',end,true);canvas.addEventListener('pointercancel',end,true);
 window.addEventListener('keydown',e=>{if(!W3.act||e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(e.key==='q'||e.key==='Q')W3.cam.yaw-=.12;else if(e.key==='e'||e.key==='E')W3.cam.yaw+=.12;else if(e.key==='PageUp')W3.cam.pitch=clamp(W3.cam.pitch+.06,.45,1.45);else if(e.key==='PageDown')W3.cam.pitch=clamp(W3.cam.pitch-.06,.45,1.45);});
 /* pan sous perspective : le point de la mer saisi reste sous le doigt */
 canvas.addEventListener('pointerdown',e=>{if(!W3.act||e.button===2||!drag)return;const r=canvas.getBoundingClientRect(),k=canvas.width/r.width;W3.p0={sx:(e.clientX-r.left)*k,sy:(e.clientY-r.top)*k,cx:V.x+W/V.k/2,cy:V.y+H/V.k/2,k:V.k};});
 canvas.addEventListener('pointermove',e=>{if(!W3.act||!drag||!drag.moved||!drag.pan||!W3.p0||ptsMap.size>1)return;const r=canvas.getBoundingClientRect(),k=canvas.width/r.width,c0=w3Cam(W3.p0.cx,W3.p0.cy),g0=w3Ground(W3.p0.sx,W3.p0.sy,c0),g1=w3Ground((e.clientX-r.left)*k,(e.clientY-r.top)*k,c0);
   if(!g0||!g1)return;V.x=W3.p0.cx+g0[0]-g1[0]-W/V.k/2;V.y=W3.p0.cy+g0[1]-g1[1]-H/V.k/2;clampV();});
}
/* ---------- bouton « Monde 3D » ---------- */
function w3Toggle(){W3.on=!W3.on;try{localStorage.setItem('rk-w3',W3.on?'1':'0');}catch(_){}const b=$('#z-w3');if(b){b.classList.toggle('on',W3.on);b.setAttribute('aria-pressed',W3.on);}
  if(!W3.on)w3Off();dirty=true;toast(W3.fail?'Monde 3D indisponible : '+W3.fail:W3.on?'Monde 3D activé : clic droit pour tourner, Q/E aussi.':'Carte à plat d’origine.');}
{const b=document.getElementById('z-w3');if(b){b.addEventListener('click',w3Toggle);b.classList.toggle('on',W3.on);b.setAttribute('aria-pressed',W3.on);}
 const rs=document.getElementById('z-reset');if(rs)rs.addEventListener('click',()=>{W3.cam.yaw=0;W3.cam.pitch=.95;});}
