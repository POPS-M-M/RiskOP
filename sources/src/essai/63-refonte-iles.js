/* ================= REFONTE DES ÎLES (version test) : le niveau de détail d'Alabasta, appliqué à toutes les îles du monde 3D =================
   Ne touche qu'à l'apparence : mêmes îles, mêmes contours, mêmes ids, mêmes zones de clic. Appelé par w3BuildIsland (61-monde3d.js).
   - détails de façade (fenêtres, portes, créneaux, fanions), murs d'enceinte, escaliers, jardins, bateaux, ports, chemins, places ;
   - un jeu de détails propre à chaque monument (phare, moulin, temple, prison, laboratoire, gâteau…). */
const W3_WD=r3c('#34425c'),W3_WL=r3c('#ffd27a'),W3_DOOR=r3c('#4a3020'),W3_WOOD2=r3c('#7b5733'),W3_PAVE=r3c('#d9d0b8'),W3_STEP=r3c('#c9c0aa');

/* fenêtres sur les quatre faces d'un volume rectangulaire (porte au centre de la face +y si door) */
function w3Wins(k,x0,y0,x1,y1,z0,z1,cell,door){
  const {G,rnd}=k,hg=z1-z0;if(hg<.5)return;const rows=Math.max(1,Math.floor(hg/cell)),zs=hg/rows;
  for(const [ax,ay,bx,by,nx,ny] of [[x0,y0,x1,y0,0,-1],[x0,y1,x1,y1,0,1],[x0,y0,x0,y1,-1,0],[x1,y0,x1,y1,1,0]]){
    const L=Math.hypot(bx-ax,by-ay),n=Math.max(1,Math.floor(L/cell)),tx=(bx-ax)/L,ty=(by-ay)/L;
    for(let i=0;i<n;i++)for(let j=0;j<rows;j++){
      if(door&&ny===1&&j===0&&Math.abs(i-(n-1)/2)<.6)continue;
      const f=(i+.5)/n,cx=ax+(bx-ax)*f+nx*.05,cy=ay+(by-ay)*f+ny*.05,cz=z0+zs*(j+.5),ww=cell*.2,hh=Math.min(zs*.3,cell*.34),c=rnd()<.3?W3_WL:W3_WD;
      G.quad([cx-tx*ww,cy-ty*ww,cz-hh],[cx+tx*ww,cy+ty*ww,cz-hh],[cx+tx*ww,cy+ty*ww,cz+hh],[cx-tx*ww,cy-ty*ww,cz+hh],c);
      G.tri([cx-tx*ww,cy-ty*ww,cz+hh],[cx+tx*ww,cy+ty*ww,cz+hh],[cx,cy,cz+hh+ww*.9],c);}
  }
}
/* fenêtres sur un cylindre */
function w3CylWins(k,x,y,r,z0,z1,n,rows,ww){
  const {G,rnd}=k;for(let j=0;j<rows;j++)for(let i=0;i<n;i++){const a=i/n*6.2832+j*.5,cz=z0+(z1-z0)*(j+.5)/rows,tx=-Math.sin(a),ty=Math.cos(a),cx=x+Math.cos(a)*(r+.05),cy=y+Math.sin(a)*(r+.05),c=rnd()<.3?W3_WL:W3_WD,hh=ww*1.4;
    G.quad([cx-tx*ww,cy-ty*ww,cz-hh],[cx+tx*ww,cy+ty*ww,cz-hh],[cx+tx*ww,cy+ty*ww,cz+hh],[cx-tx*ww,cy-ty*ww,cz+hh],c);}
}
function w3Door(k,x,y,z,s,w){const {G}=k;w=w||1.1*s;G.box(x-w/2,y-.03,z-.1,w,.12,1.7*s,W3_DOOR);G.dome(x,y+.04,z+1.55*s,w/2,.5,W3_DOOR,8);}
/* créneaux sur le pourtour d'un rectangle */
function w3Crenel(k,x0,y0,x1,y1,z,s,col){
  const {G}=k,m=1.1*s,b=.46*s;for(const [ax,ay,bx,by] of [[x0,y0,x1,y0],[x0,y1,x1,y1],[x0,y0,x0,y1],[x1,y0,x1,y1]]){const L=Math.hypot(bx-ax,by-ay),n=Math.max(2,Math.floor(L/m));
    for(let i=0;i<=n;i+=2){const f=i/n;G.box(ax+(bx-ax)*f-b/2,ay+(by-ay)*f-b/2,z-.05,b,b,.55*s,col);}}
}
function w3Pennant(k,x,y,z,h,col,s){const {G}=k;s=s||1;G.cyl(x,y,z,.05*s,h,r3c('#3a2a1c'),4,false);G.tri([x,y,z+h],[x,y,z+h-.8*s],[x+1.2*s,y+.05,z+h-.4*s],col);}
function w3Steps(k,x,y,z,w,s,n,dir){const {G}=k;for(let i=0;i<n;i++)G.box(x-w/2+i*.12*s,y+dir*(i*.5*s)-(dir>0?0:.5*s),z-.1,w-i*.24*s,.5*s,(n-i)*.22*s,i%2?W3_STEP:W3_PAVE);}
/* mur d'enceinte avec créneaux, tours d'angle et une porte tournée vers le port */
function w3WallRing(k,r,h,col,roof,gateA,nT){
  const {G,x,y,H,rc,s,tops}=k,n=40,gw=.2;let prev=null;
  const pt=(a,rr,z)=>[x+Math.cos(a)*rr,y+Math.sin(a)*rr,z];
  for(let i=0;i<=n;i++){const a=i/n*6.2832,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r,z=H(px,py),ok=Math.hypot(px,py)<rc(Math.atan2(py,px))*.86&&z>.45,cur={a,z,ok};
    const dg=Math.abs(Math.atan2(Math.sin(a-gateA),Math.cos(a-gateA)));
    if(prev&&prev.ok&&cur.ok&&dg>gw){
      const z0=Math.min(prev.z,cur.z)-.6,t=.32*s,A=prev.a,B=cur.a;
      G.quad(pt(A,r+t,z0),pt(B,r+t,z0),pt(B,r+t,cur.z+h),pt(A,r+t,prev.z+h),col);
      G.quad(pt(A,r-t,z0),pt(B,r-t,z0),pt(B,r-t,cur.z+h),pt(A,r-t,prev.z+h),col);
      G.quad(pt(A,r+t,prev.z+h),pt(B,r+t,cur.z+h),pt(B,r-t,cur.z+h),pt(A,r-t,prev.z+h),col,[0,0,1]);
      if(i%2===0){const mz=(prev.z+cur.z)/2+h,mx=x+Math.cos((A+B)/2)*(r+t*.6),my=y+Math.sin((A+B)/2)*(r+t*.6);G.box(mx-.22*s,my-.22*s,mz-.02,.44*s,.44*s,.5*s,col);}}
    prev=cur;
  }
  /* tours */
  for(let q=0;q<nT;q++){const a=q/nT*6.2832+.4,tx=x+Math.cos(a)*r,ty=y+Math.sin(a)*r,z=H(tx,ty);if(!(Math.hypot(tx,ty)<rc(Math.atan2(ty,tx))*.86&&z>.45))continue;
    const dg=Math.abs(Math.atan2(Math.sin(a-gateA),Math.cos(a-gateA)));if(dg<gw*1.6)continue;
    G.cyl(tx,ty,z-.3,.95*s,h+1.6*s,col,9);G.cone(tx,ty,z+h+1.3*s,1.2*s,1.5*s,roof,9);tops.push([tx-1*s,ty-1*s,tx+1*s,ty+1*s,z+h+2.8*s]);}
  /* tours de porte */
  for(const sg of [-1,1]){const a=gateA+sg*gw*1.15,tx=x+Math.cos(a)*r,ty=y+Math.sin(a)*r,z=H(tx,ty);if(!(z>.45&&Math.hypot(tx,ty)<rc(Math.atan2(ty,tx))*.9))continue;
    G.cyl(tx,ty,z-.3,.85*s,h+1.2*s,col,8);G.cone(tx,ty,z+h+.9*s,1.05*s,1.3*s,roof,8);tops.push([tx-.9*s,ty-.9*s,tx+.9*s,ty+.9*s,z+h+2.2*s]);}
}
/* haie de piquets (clôture) */
function w3Fence(k,r,h,gateA,col){
  const {G,x,y,H,rc,s}=k,n=36;let pp=null;
  for(let i=0;i<=n;i++){const a=i/n*6.2832,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r,z=H(px,py),ok=Math.hypot(px,py)<rc(Math.atan2(py,px))*.84&&z>.45,dg=Math.abs(Math.atan2(Math.sin(a-gateA),Math.cos(a-gateA)));
    if(ok&&dg>.14){G.cyl(px,py,z-.1,.07*s,h*1.1,col,4,false);if(pp&&pp.ok&&pp.g){G.quad([pp.x,pp.y,pp.z+h*.9],[px,py,z+h*.9],[px,py,z+h*.7],[pp.x,pp.y,pp.z+h*.7],col);G.quad([pp.x,pp.y,pp.z+h*.45],[px,py,z+h*.45],[px,py,z+h*.25],[pp.x,pp.y,pp.z+h*.25],col);}}
    pp={x:px,y:py,z,ok,g:dg>.14};}
}
/* plateforme pavée */
function w3Plaza(k,r,col){const {G,x,y,H}=k,z=H(x,y)+.05;G.cyl(x,y,z-.08,r,.16,col||W3_PAVE,24);}

/* ---------- détails propres à chaque monument ---------- */
const W3DET={
  castleEU(k){const {G,x,y,z,s,oc}=k,st=r3c('#d8ccb4'),roof=r3c((k.o&&k.o.roof)||'#b5533c');
    w3Wins(k,x-3.2*s,y-2.6*s,x+3.2*s,y+2.6*s,z+.3*s,z+2.7*s,1.9*s,true);w3Door(k,x,y+2.6*s,z,s,1.3*s);w3Steps(k,x,y+2.65*s,z,3*s,s,3,1);
    w3Crenel(k,x-3.0*s,y-2.4*s,x+3.0*s,y+2.4*s,z+2.9*s,s,st);w3CylWins(k,x,y,1.5*s,z+3.6*s,z+7.4*s,6,2,.22*s);
    for(const [dx,dy] of [[-3.2,-2.6],[3.2,-2.6],[-3.2,2.6],[3.2,2.6]]){w3CylWins(k,x+dx*s,y+dy*s,.95*s,z+1.4*s,z+4.4*s,4,2,.16*s);w3Pennant(k,x+dx*s,y+dy*s,z+7.1*s,1.5*s,oc,s);}
    w3Pennant(k,x,y,z+10.9*s,2*s,oc,s*1.2);w3WallRing(k,6.4*s,1.4*s,r3c('#e4dcc8'),roof,k.aP,6);
    for(let q=0;q<4;q++){G.ico(x-3.6*s+q*2.4*s,y+3.3*s,z+.35*s,.5*s,.8,r3c(['#e86a8a','#f2c14e','#d95a4a','#f2f2f2'][q]),k.rnd,.2);}},
  fortress(k){const {G,x,y,z,s,oc}=k,w=r3c('#c9c2b0'),roof=r3c((k.o&&k.o.roof)||'#3c5f9e');
    w3Wins(k,x-4*s,y-4*s,x+4*s,y+4*s,z+.3*s,z+2.2*s,2*s,true);w3Door(k,x,y+4*s,z,s,1.5*s);w3Steps(k,x,y+4.05*s,z,3.4*s,s,3,1);
    w3Crenel(k,x-3.9*s,y-3.9*s,x+3.9*s,y+3.9*s,z+2.4*s,s,w);w3Crenel(k,x-1.7*s,y-1.7*s,x+1.7*s,y+1.7*s,z+5.3*s,s*.8,w);
    w3Pennant(k,x,y,z+6.9*s,2.2*s,oc,s*1.3);for(const [dx,dy] of [[-4,-4],[4,-4],[-4,4],[4,4]])w3Pennant(k,x+dx*s,y+dy*s,z+5.4*s,1.3*s,oc,s);
    w3WallRing(k,6.6*s,1.2*s,r3c('#d4cdb9'),roof,k.aP,4);
    for(let q=0;q<3;q++)G.cyl(x+(q-1)*1.2*s+4.6*s,y+3.4*s,z+.2,.4*s,.9*s,r3c('#6a4a2c'),6);},
  tower(k){const {G,x,y,z,s,oc}=k;w3CylWins(k,x,y,1.7*s,z+2.3*s,z+9.6*s,6,3,.2*s);w3Door(k,x,y+2.4*s,z,s,1.1*s);w3Steps(k,x,y+2.5*s,z,2.4*s,s,3,1);
    for(let q=0;q<16;q++){const a=q/16*6.2832;G.cyl(x+Math.cos(a)*2.1*s,y+Math.sin(a)*2.1*s,z+10.5*s,.05*s,.7*s,r3c('#3a2a1c'),4,false);}
    w3Pennant(k,x,y,z+13*s,2*s,oc,s*1.2);},
  lighthouse(k){const {G,x,y,z,s,rnd}=k;for(let q=0;q<14;q++){const a=q/14*6.2832;G.cyl(x+Math.cos(a)*1.25*s,y+Math.sin(a)*1.25*s,z+8.9*s,.04*s,.6*s,r3c('#3a3a40'),4,false);}
    w3CylWins(k,x,y,1.2*s,z+1.5*s,z+7*s,3,2,.18*s);w3Door(k,x,y+1.6*s,z,s,.9*s);
    G.box(x+2.6*s,y-.8*s,z-.1,2.4*s,1.8*s,1.4*s,r3c('#efe4cc'));G.pyr(x+2.6*s,y-.8*s,z+1.3*s,2.4*s,1.8*s,1*s,r3c('#b5433a'),.15);w3Wins(k,x+2.6*s,y-.8*s,x+5*s,y+1*s,z+.2*s,z+1.3*s,1.3*s,true);
    for(let q=0;q<6;q++){const a=q/6*6.2832+.3,d=(2.6+rnd()*.6)*s;G.ico(x+Math.cos(a)*d,y+Math.sin(a)*d-1.5*s,z+.2,(.4+rnd()*.5)*s,.6,r3c('#8a8478'),rnd,.3);}},
  bellTower(k){const {G,x,y,z,s,oc}=k;w3Wins(k,x-1.3*s,y-1.3*s,x+1.3*s,y+1.3*s,z+.5*s,z+5.4*s,1.7*s,true);w3Pennant(k,x,y,z+11*s,1.8*s,oc,s);
    G.ico(x,y,z+7.4*s,.45*s,1,r3c('#d9a441'),null,0);},
  windmill(k){const {G,x,y,z,s,rnd}=k;w3Door(k,x,y+1.4*s,z,s,.8*s);for(let q=0;q<4;q++)G.box(x+2.2*s+(q%2)*.8*s,y+.6*s+Math.floor(q/2)*.8*s,z-.05,.7*s,.7*s,.6*s,r3c('#cdb98d'));
    G.cyl(x-2.2*s,y+1.4*s,z-.1,.5*s,.8*s,r3c('#8a6038'),8);
    for(let i=0;i<6;i++)for(let j=0;j<4;j++)G.cone(x-3.6*s+j*.55*s,y-3.2*s+i*.55*s,z,.2*s,.8*s,r3c(rnd()<.5?'#e7c660':'#d9b04a'),4);},
  temple(k){const {G,x,y,z,s,oc}=k;w3Steps(k,x,y+3.1*s,z,6*s,s,4,1);for(const [dx,dy] of [[-4,-3.2],[4,-3.2],[-4,3.2],[4,3.2]]){G.cyl(x+dx*s,y+dy*s,z-.05,.32*s,.8*s,r3c('#8a8478'),6);G.ico(x+dx*s,y+dy*s,z+1*s,.35*s,1,r3c('#ff9a3c'),null,0);}
    G.cyl(x,y,z+4.4*s,.7*s,1.6*s,r3c('#e8e0cc'),8);G.cyl(x,y,z+4.4*s,.5*s,.3*s,r3c('#d9a441'),8);w3Pennant(k,x,y,z+6.3*s,1.4*s,oc,s);},
  ruins(k){const {G,x,y,z,s,rnd}=k,w=r3c('#d4cbb2');G.box(x-1.8*s,y+2.6*s,z+.1,3.6*s,.5*s,.5*s,w);G.cyl(x-3.2*s,y-.6*s,z+.4*s,.4*s,.4*s,w,8);G.cyl(x-2.4*s,y-.6*s,z+.4*s,.4*s,.4*s,w,8);
    for(const dx of [-1,1]){G.cyl(x+dx*1.2*s,y-2.9*s,z-.1,.35*s,2.6*s,w,8);}G.box(x-1.7*s,y-3.15*s,z+2.4*s,3.4*s,.5*s,.5*s,w);
    for(let q=0;q<7;q++){const a=rnd()*6.28,d=(1.5+rnd()*2.6)*s;G.ico(x+Math.cos(a)*d,y+Math.sin(a)*d,z+.1,.45*s,.5,r3c(rnd()<.5?'#6a9a48':'#7aa84c'),rnd,.3);}},
  fountain(k){const {G,x,y,z,s,rnd}=k;w3Plaza(k,5.4*s,W3_PAVE);for(let q=0;q<4;q++){const a=q*1.5708+.78,bx=x+Math.cos(a)*4.1*s,by=y+Math.sin(a)*4.1*s;G.box(bx-.7*s,by-.25*s,z+.15,1.4*s,.5*s,.45*s,W3_WOOD2);
      G.cyl(x+Math.cos(a+.78)*4.6*s,y+Math.sin(a+.78)*4.6*s,z+.1,.06*s,2*s,r3c('#2e2a2a'),4,false);G.ico(x+Math.cos(a+.78)*4.6*s,y+Math.sin(a+.78)*4.6*s,z+2.2*s,.2*s,1,W3_WL,null,0);}
    for(let q=0;q<10;q++){const a=q/10*6.2832,d=3.2*s;G.ico(x+Math.cos(a)*d,y+Math.sin(a)*d,z+.25,.3*s,.7,r3c(['#e86a8a','#f2c14e','#9a7ae8'][q%3]),rnd,.2);}},
  bigTree(k){const {G,x,y,z,s,rnd}=k;for(let q=0;q<5;q++){const a=q/5*6.2832+.4;G.cone(x+Math.cos(a)*1.4*s,y+Math.sin(a)*1.4*s,z-.2,.55*s,1.2*s,r3c('#6a4a2c'),5);}
    G.cyl(x,y,z+3.9*s,2.1*s,.28*s,W3_WOOD2,10);G.box(x-.9*s,y-.9*s,z+4.2*s,1.8*s,1.8*s,1.1*s,r3c('#cdb98d'));G.pyr(x-.9*s,y-.9*s,z+5.3*s,1.8*s,1.8*s,.8*s,r3c('#7a9a44'),.2);
    for(let q=0;q<7;q++){const a=q/7*6.2832+.2;G.ico(x+Math.cos(a)*2.9*s,y+Math.sin(a)*2.9*s,z+(4.4+(q%2)*1.2)*s,.22*s,1,W3_WL,null,0);}
    for(let q=0;q<9;q++){const a=rnd()*6.28,d=(2+rnd()*2.4)*s;G.ico(x+Math.cos(a)*d,y+Math.sin(a)*d,z+.15,.28*s,.7,r3c(['#e86a8a','#f2c14e','#ffffff'][q%3]),rnd,.2);}},
  mansion(k){const {G,x,y,z,s,rnd}=k;w3Wins(k,x-3.5*s,y-2.2*s,x+3.5*s,y+2.2*s,z+.3*s,z+3.4*s,1.8*s,true);w3Door(k,x,y+2.2*s,z,s,1.2*s);w3Steps(k,x,y+2.25*s,z,2.6*s,s,3,1);w3Fence(k,6.2*s,1.5*s,k.aP,r3c('#2e2a34'));
    for(let q=0;q<6;q++){const gx=x+(-4+q*1.5)*s,gy=y+4.2*s;if(rnd()<.2)continue;G.box(gx,gy,z-.05,.5*s,.18*s,.9*s,r3c('#8a8a92'));G.dome(gx+.25*s,gy+.09*s,z+.85*s,.25*s,.6,r3c('#8a8a92'),6);}
    G.ico(x+4.6*s,y-3.2*s,z+.4*s,.5*s,1,r3c('#9a6ae8'),null,0);},
  prison(k){const {G,x,y,z,s}=k;w3CylWins(k,x,y,3.6*s,z+.6*s,z+2.2*s,12,1,.16*s);w3CylWins(k,x,y,2.7*s,z+2.6*s,z+5.2*s,10,2,.15*s);
    w3WallRing(k,8.2*s,1.8*s,r3c('#5e6470'),r3c('#2e323a'),k.aP,0);
    for(let q=0;q<4;q++){const a=q*1.5708+.78,tx=x+Math.cos(a)*5.2*s,ty=y+Math.sin(a)*5.2*s;G.ico(tx,ty,z+4.1*s,.35*s,1,W3_WL,null,0);}},
  lab(k){const {G,x,y,z,s,rnd}=k;w3Wins(k,x-3*s,y-2*s,x+3*s,y+2*s,z+.3*s,z+2*s,1.7*s,true);for(let q=0;q<3;q++)G.cyl(x+3.6*s,y-1.4*s+q*1.2*s,z+.4*s,.35*s,1.5*s,r3c('#9ad8c0'),8);
    G.cyl(x-1*s,y-2.4*s,z-.1,.18*s,2.4*s,r3c('#c8d2d8'),6);G.ico(x-1*s,y-2.4*s,z+2.5*s,.35*s,1,r3c('#8aff9a'),null,0);for(let q=0;q<5;q++){G.ico(x-3.4*s+q*.5*s,y+2.5*s,z+.3,.3*s,1,r3c(['#8aff9a','#7ac8ff','#ff9ad0'][q%3]),rnd,.2);}},
  colosseum(k){const {G,x,y,z,s,oc}=k,n=18,r=4.8*s;for(let q=0;q<n;q++){const a=(q+.5)/n*6.2832,tx=-Math.sin(a),ty=Math.cos(a),cx=x+Math.cos(a)*(r+.05),cy=y+Math.sin(a)*(r+.05)*.85,ww=.5*s;
      G.quad([cx-tx*ww,cy-ty*ww*.85,z+.3*s],[cx+tx*ww,cy+ty*ww*.85,z+.3*s],[cx+tx*ww,cy+ty*ww*.85,z+1.7*s],[cx-tx*ww,cy-ty*ww*.85,z+1.7*s],W3_WD);
      if(q%3===0)w3Pennant(k,x+Math.cos(a)*r*.98,y+Math.sin(a)*r*.83,z+3.2*s,1.4*s,oc,s*.8);}},
  cakeCastle(k){const {G,x,y,z,s,rnd}=k;for(let q=0;q<14;q++){const a=q/14*6.2832,d=(5+rnd()*1.6)*s;G.ico(x+Math.cos(a)*d,y+Math.sin(a)*d,z+.3*s,(.5+rnd()*.4)*s,.9,r3c(['#f98ab8','#8ad8c8','#ffd36a','#c8a2f0'][q%4]),rnd,.15);}
    for(let q=0;q<4;q++){const a=q*1.5708+.78,px=x+Math.cos(a)*6.2*s,py=y+Math.sin(a)*6.2*s;for(let m=0;m<6;m++)G.cyl(px,py,z+m*.5*s,.14*s,.5*s,r3c(m%2?'#f2f2f2':'#e8457a'),5,false);G.ico(px,py,z+3.2*s,.3*s,1,r3c('#e8457a'),null,0);}},
  marblePalace(k){const {G,x,y,z,s,oc}=k;w3Wins(k,x-5*s,y-3*s,x+5*s,y+3*s,z+.3*s,z+3*s,1.9*s,true);w3Steps(k,x,y+3.05*s,z,5*s,s,4,1);w3Door(k,x,y+3*s,z,s,1.6*s);
    for(const dx of [-3.2,0,3.2]){G.cone(x+dx*s,y,z+4.3*s,.15*s,1.1*s,r3c('#d9a441'),5);}w3Pennant(k,x-4.8*s,y,z+3.2*s,1.8*s,oc,s);w3Pennant(k,x+4.8*s,y,z+3.2*s,1.8*s,oc,s);},
  eggDome(k){const {G,x,y,z,s,rnd}=k;for(let q=0;q<14;q++){const a=q/14*6.2832;G.ico(x+Math.cos(a)*4.6*s,y+Math.sin(a)*4.6*s,z+.2,.22*s,1,r3c('#7ae8ff'),null,0);}
    G.cyl(x-3.4*s,y-3.4*s,z-.1,.12*s,3.4*s,r3c('#c8d2d8'),5,false);G.ico(x-3.4*s,y-3.4*s,z+3.5*s,.25*s,1,r3c('#ff7a7a'),null,0);},
  castleJP(k){const {G,x,y,z,s,oc}=k;w3WallRing(k,6.6*s,1.3*s,r3c('#c8c2b0'),r3c('#3d4658'),k.aP,6);w3Steps(k,x,y+3.5*s,z,3.4*s,s,3,1);
    for(let q=0;q<5;q++){const a=q/5*6.2832+.5,d=(8.2+(q%2))*s,px=x+Math.cos(a)*d,py=y+Math.sin(a)*d,zz=k.H(px,py);if(zz<.5)continue;G.cyl(px,py,zz-.1,.14*s,1.3*s,r3c('#7a5634'),5,false);G.ico(px,py,zz+1.9*s,.9*s,.85,r3c('#f6a6c4'),k.rnd,.25);}
    w3Pennant(k,x,y,z+9.2*s,1.6*s,oc,s);},
  pagoda(k){const {G,x,y,z,s,oc}=k;for(let q=0;q<4;q++)G.ico(x+Math.cos(q*1.57+.7)*3.4*s,y+Math.sin(q*1.57+.7)*3.4*s,z+.6*s,.3*s,1,r3c('#ff9a3c'),null,0);w3Steps(k,x,y+2.4*s,z,2.4*s,s,3,1);},
  shipInn(k){const {G,x,y,z,s,oc}=k;w3Pennant(k,x,y,z+6.6*s,1.8*s,oc,s);for(let q=0;q<6;q++)G.ico(x-3*s+q*1.2*s,y+1.4*s,z+1.3*s,.18*s,1,W3_WL,null,0);},
  hive(k){const {G,x,y,z,s,rnd}=k;for(let q=0;q<8;q++){const a=q/8*6.2832;G.ico(x+Math.cos(a)*(3.8+rnd()*.8)*s,y+Math.sin(a)*(3.8+rnd()*.8)*s,z+.8*s,.3*s,1,r3c('#e8c84a'),rnd,.2);}}
};

/* ---------- décor de village commun à toutes les îles : port, quai, caisses, lampadaires, étals, jardins ---------- */
function w3Harbor(k,lvl,marche,isNeutral){
  const {G,rc,H,aP,s,rnd,tops,oc}=k,u=s,r0=rc(aP)*.9,ca=Math.cos(aP),sa=Math.sin(aP),len=(lvl>=2||marche?6.4:4.6)*u,wid=1.15*u,wood=W3_WOOD2,post=r3c('#5f4226');
  const P=(d,w,z)=>[ca*(r0+d)-sa*w,sa*(r0+d)+ca*w,z];
  const d0=-.8*u;G.quad(P(d0,-wid,.3),P(d0+len,-wid,.3),P(d0+len,wid,.3),P(d0,wid,.3),wood,[0,0,1]);
  for(let i=0;i<=Math.floor(len/(1.1*u));i++){const d=d0+i*1.1*u;for(const sg of [-1,1]){const p=P(d,sg*wid,0);G.cyl(p[0],p[1],-.9,.1*u,1.5,post,5,false);}if(i%2===0)G.quad(P(d,-wid,.31),P(d+.08*u,-wid,.31),P(d+.08*u,wid,.31),P(d,wid,.31),r3c('#5f4226'),[0,0,1]);}
  /* caisses et tonneaux au pied du quai */
  for(let q=0;q<4;q++){const p=P(-.4*u-q*.5*u,(q%2?1.4:-1.5)*u,0),zz=Math.max(.3,H(p[0],p[1]));if(q%2)G.cyl(p[0],p[1],zz,.38*u,.7*u,r3c('#8a5f38'),8);else G.box(p[0]-.4*u,p[1]-.4*u,zz,.8*u,.8*u,.7*u,r3c('#b8935a'));}
  /* bateaux : navire marchand si l'île a un port, sinon barque de pêche ; mouillés sur le quai */
  const bp=P(len*.55,wid+1.7*u,0.05),bp2=P(len*.9,-wid-1.5*u,0.05);
  const boat=(x,y,sc,ang,sail)=>{const i0=G.P.length/3,hull=r3c('#6b4428'),deck=r3c('#9b7048');
    G.box(-2.4,-.8,-.15,4.8,1.6,.9,hull,deck);G.box(2.4,-.5,.1,.8,1,.6,hull,deck);G.cyl(-.3,0,.6,.09,3.8,r3c('#5f4226'),5,false);G.quad([-1.2,.1,4],[.6,.1,4],[.8,.15,1.4],[-1.4,.15,1.4],sail);
    for(let i=i0*3;i<G.P.length;i+=3){const px=G.P[i]*sc,py=G.P[i+1]*sc,pz=G.P[i+2]*sc,c=Math.cos(ang),sn=Math.sin(ang);G.P[i]=x+px*c-py*sn;G.P[i+1]=y+px*sn+py*c;G.P[i+2]=pz;
      if(G.N[i]!==undefined){const nx=G.N[i],ny=G.N[i+1];G.N[i]=nx*c-ny*sn;G.N[i+1]=nx*sn+ny*c;}}};
  boat(bp[0],bp[1],.5*u*(marche?1.15:.9),aP+1.5708,isNeutral?r3c('#e8e0c8'):oc);boat(bp2[0],bp2[1],.42*u,aP+1.57+.2,r3c('#f2ead6'));
  /* lampadaire à l'entrée du quai */
  const lp=P(-.9*u,wid+.3*u,0),lz=Math.max(.3,H(lp[0],lp[1]));G.cyl(lp[0],lp[1],lz,.06*u,2*u,r3c('#2e2a2a'),4,false);G.ico(lp[0],lp[1],lz+2.4*u,.22*u,1,W3_WL,null,0);
}
function w3Village(k,pave,lampN,stallN,occ){
  const {G,x,y,rc,H,s,rnd,tops}=k,u=k.u;
  for(let q=0;q<lampN;q++){const a=q/lampN*6.2832+.3,d=(k.pr*1.08+(q%2)*1.2*u),px=x+Math.cos(a)*d,py=y+Math.sin(a)*d,z=H(px,py);if(z<.5||Math.hypot(px,py)>rc(Math.atan2(py,px))*.82)continue;
    G.cyl(px,py,z-.1,.06*u,2.1*u,r3c('#2e2a2a'),4,false);G.ico(px,py,z+2.4*u,.22*u,1,W3_WL,null,0);}
  for(let q=0;q<stallN;q++){const a=q/Math.max(1,stallN)*6.2832+1.3,d=k.pr*1.3,px=x+Math.cos(a)*d,py=y+Math.sin(a)*d,z=H(px,py);if(z<.5||Math.hypot(px,py)>rc(Math.atan2(py,px))*.78||!occ.free(px,py,1.6*u))continue;
    const w=2.2*u,cols=['#d95a4a','#3d64b8','#e0b04c','#4aa86a'];G.box(px,py,z-.1,w,1.2*u,.9*u,r3c('#9b7048'));G.pyr(px-.15*u,py-.15*u,z+.8*u,w+.3*u,1.5*u,.7*u,r3c(cols[q%4]),0);
    for(const dx of [0,w])G.cyl(px+dx,py+1.2*u,z-.05,.05*u,1.9*u,r3c('#5f4226'),4,false);occ.push(px+w/2,py+.6*u,1.6*u);
    G.ico(px+.4*u,py+.4*u,z+1*u,.2*u,.8,r3c('#e8a24a'),rnd,.2);G.ico(px+1.1*u,py+.4*u,z+1*u,.2*u,.8,r3c('#d9453a'),rnd,.2);}
}
/* jardins : arbustes, fleurs, touffes, petits rochers ; densité selon le biome */
function w3Garden(k,pal,biome,occ){
  const {G,rc,H,rnd,tops}=k,u=k.u,ok=(x,y,m)=>{const d=Math.hypot(x,y)/rc(Math.atan2(y,x));return d<.84&&H(x,y)>.5&&occ.free(x,y,m);};
  const lush=['tropical','grass','jungle','japan','med','candy','coral'].includes(biome),flo={tropical:['#ffffff','#ffd24a','#ff7a9a'],grass:['#ffffff','#ffd24a','#9a7ae8'],jungle:['#ff7a4a','#ffd24a','#ff4a8a'],japan:['#ffffff','#f6a6c4'],med:['#e8a24a','#9a7ae8'],candy:['#ffffff','#7ae8d0'],coral:['#fff2a0','#9ae8ff']}[biome]||['#ffffff'];
  let n=0;for(let q=0;q<400&&n<(lush?22:9)*(k.R/30);q++){const a=rnd()*6.2832,d=(.1+rnd()*.78)*rc(a),x=Math.cos(a)*d,y=Math.sin(a)*d;if(!ok(x,y,.7*u))continue;n++;const z=H(x,y),r=(.45+rnd()*.5)*u;
    if(biome==='snow'||biome==='cloud')G.ico(x,y,z+r*.2,r*.9,.55,r3c('#eaf1f8'),rnd,.3);
    else if(biome==='volcanic'||biome==='spooky'||biome==='storm'||biome==='junk')G.ico(x,y,z+r*.2,r*.8,.7,pal.rock,rnd,.35);
    else G.ico(x,y,z+r*.3,r,.7,pal.tree[(rnd()*pal.tree.length)|0],rnd,.25);
    occ.push(x,y,r);tops.push([x-r,y-r,x+r,y+r,z+r*.8]);}
  if(lush){let f=0;for(let q=0;q<500&&f<34*(k.R/30);q++){const a=rnd()*6.2832,d=(.1+rnd()*.8)*rc(a),x=Math.cos(a)*d,y=Math.sin(a)*d;if(!ok(x,y,.2*u))continue;f++;
      const z=H(x,y),fc=r3c(flo[(rnd()*flo.length)|0]);for(let m=0;m<3;m++)G.ico(x+(rnd()-.5)*.8*u,y+(rnd()-.5)*.8*u,z+.15*u,.17*u,1,fc,null,0);}}
}
