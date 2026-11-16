/* ================= ÎLES SUR MESURE — vague 2 (version test) : East Blue, North Blue, première moitié de Grand Line =================
   Même mécanisme (W3CU via cuReg). Les éléments marqués [I] dans le rapport d'audit sont des interprétations artistiques. */
/* château générique paramétrable : enceinte, quatre tours, donjon ; renvoie la hauteur du sommet */
function cuCastle(K,k,x,y,s,o){const {G}=K,z=K.H(x,y),w=o.w||cuC('#efe8d8'),w2=o.w2||cuC('#cfc6b0'),rf=o.roof||cuC('#b5533c'),W=(o.W||8)*s,D=(o.D||6)*s,th=(o.th||5)*s,kh=(o.kh||7)*s;
  K.bc(x,y,z-.2,W,D,2.6*s,w2);w3Crenel(k,x-W/2,y-D/2,x+W/2,y+D/2,z+2.4*s,s,w2);
  for(const [dx,dy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const tx=x+dx*W/2,ty=y+dy*D/2;cuLathe(G,tx,ty,z-.2,[[1.15*s,0],[1*s,th]],w,10);G.cone(tx,ty,z+th,1.45*s,(o.cone||2.2)*s,rf,10);K.tops.push([tx-1.2*s,ty-1.2*s,tx+1.2*s,ty+1.2*s,z+th+2*s]);}
  K.bc(x,y,z+2.2*s,W*.5,D*.5,kh-2.2*s,w);G.pyr(x-W*.28,y-D*.28,z+kh,W*.56,D*.56,(o.kr||2.6)*s,rf,.2);
  K.bc(x,y+D/2+.05*s,z-.2,1.8*s,.2*s,1.8*s,cuC('#3a2a1c'));K.hold(x,y,Math.max(W,D)*.75);return z+kh+(o.kr||2.6)*s;}
/* champ de ruines : pans de murs brisés, colonnes tronquées */
function cuRuins(K,cx,cy,rad,n,col,col2){const {G,rnd,u:s}=K;for(let q=0;q<n;q++){const a=rnd()*6.2832,d=rnd()*rad,x=cx+Math.cos(a)*d,y=cy+Math.sin(a)*d,z=K.H(x,y);if(z<.5)continue;
  if(q%3===0)cuLathe(G,x,y,z-.2,[[.7*s,0],[.6*s,(1.5+rnd()*3)*s]],col2||col,8);else{const w=(1.5+rnd()*3)*s,h=(1+rnd()*3)*s,ang=rnd()<.5;G.box(x,y,z-.2,ang?w:.8*s,ang?.8*s:w,h,col);K.tops.push([x,y,x+(ang?w:.8*s),y+(ang?.8*s:w),z+h]);}}}
/* grand arbre stylisé */
function cuBigTree(K,x,y,s,bark,leaf,h){const {G}=K,z=K.H(x,y);h=h||12;cuLathe(G,x,y,z-.3,[[2.6*s,0],[1.7*s,1.6*s],[1.4*s,h*.7*s],[1.2*s,h*s]],bark,10);
  for(let q=0;q<5;q++){const a=q/5*6.2832+.3,zz=z+h*(.55+(q%2)*.15)*s;cuTube(G,cuCR([[x,y,zz],[x+Math.cos(a)*3*s,y+Math.sin(a)*3*s,zz+1.6*s],[x+Math.cos(a)*5*s,y+Math.sin(a)*5*s,zz+2.2*s]],3),t=>(1-.6*t)*.55*s,bark,6,true);cuEll(G,x+Math.cos(a)*5*s,y+Math.sin(a)*5*s,zz+3*s,3*s,3*s,2*s,leaf,10,6);}
  cuEll(G,x,y,z+(h+2.6)*s,5*s,5*s,3.4*s,leaf,12,7);K.tops.push([x-6*s,y-6*s,x+6*s,y+6*s,z+(h+5)*s]);K.hold(x,y,6.5*s);return z+(h+6)*s;}
const cuCloud=(K,x,y,z,s,c)=>{for(let q=0;q<5;q++){const a=q*1.3;cuEll(K.G,x+Math.cos(a)*1.6*s,y+Math.sin(a)*1.2*s,z+(q%2)*.6*s,(1.6+q%3*.5)*s,(1.4+q%2*.4)*s,1.1*s,c,10,6);}};

/* ---------- Orange Town : grand chapiteau rayé (interprétation : le cirque du pirate de passage), rue commerçante ---------- */
cuReg('Orange Town',{art:{trees:[['round',8],['palm',4]]},
  build(k){const K=cuKit(k),{G,u:s,R}=K,red=cuC('#d8352e'),wh=cuC('#f6f0e4'),yl=cuC('#f0c040');const x=0,y=-.12*R,z=K.H(x,y);
    cuLathe(G,x,y,z-.1,[[7*s,0],[7*s,3*s]],(j)=>red,16);for(let q=0;q<16;q++){const a0=q/16*6.2832,a1=(q+1)/16*6.2832;G.tri([x+Math.cos(a0)*7.3*s,y+Math.sin(a0)*7.3*s,z+3*s],[x+Math.cos(a1)*7.3*s,y+Math.sin(a1)*7.3*s,z+3*s],[x,y,z+9*s],q%2?red:wh);}
    for(let q=0;q<16;q++){const a=q/16*6.2832;G.box(x+Math.cos(a)*7.05*s-.3*s,y+Math.sin(a)*7.05*s-.3*s,z+.2,.6*s,.6*s,2.8*s,q%2?wh:red);}
    G.cyl(x,y,z+8.5*s,.15*s,3*s,cuC('#5a3c24'),5,false);G.tri([x,y,z+11.4*s],[x,y,z+10.3*s],[x+2*s,y,z+10.9*s],yl);
    for(const sg of [-1,1]){G.cyl(x+sg*4.6*s,y+5.5*s,z,.2*s,6.5*s,cuC('#5a3c24'),5,false);}cuTube(G,[[x-4.6*s,y+5.5*s,z+6.4*s],[x,y+7*s,z+5.6*s],[x+4.6*s,y+5.5*s,z+6.4*s]],.08*s,cuC('#3a2a1c'),4,false);
    for(let q=0;q<7;q++){const f=q/6;G.tri([x-4.6*s+f*9.2*s,y+5.5*s+Math.sin(f*Math.PI)*1.5*s,z+6.3*s],[x-4.2*s+f*9.2*s,y+5.6*s+Math.sin(f*Math.PI)*1.5*s,z+6.3*s],[x-4.4*s+f*9.2*s,y+5.5*s+Math.sin(f*Math.PI)*1.5*s,z+5.5*s],[red,yl,cuC('#3d64b8')][q%3]);}
    K.tops.push([x-7*s,y-7*s,x+7*s,y+7*s,z+9*s]);k.ban(x,y,z+12*s);k.top=z+12*s;K.hold(x,y,9*s);
    for(let q=0;q<3;q++){const wx=-.42*R+q*4*s,wy=.3*R,wz=K.H(wx,wy);K.bc(wx,wy,wz+.5*s,3*s,1.8*s,1.8*s,[red,cuC('#3d64b8'),yl][q]);G.dome(wx,wy,wz+2.3*s,1.2*s,.6,wh,8);for(const dx of [-1,1])G.cyl(wx+dx*1.1*s,wy+.95*s,wz+.5*s,.5*s,.2*s,cuC('#3a2a1c'),8);K.hold(wx,wy,2.4*s);}}});

/* ---------- Shells Town : base de la Marine fortifiée, haute tour, statue monumentale du commandant (élément du récit) ---------- */
cuReg('Shells Town',{art:{trees:[['round',6]]},
  build(k){const K=cuKit(k),{G,u:s,R}=K,wh=cuC('#e8e6e0'),gr=cuC('#b8b8b4'),bl=cuC('#3c5f9e'),br=cuC('#8a7a5a');const x=0,y=-.15*R,z=K.H(x,y);
    K.bc(x,y,z-.2,16*s,12*s,2.4*s,gr);w3Crenel(k,x-8*s,y-6*s,x+8*s,y+6*s,z+2.2*s,s,gr);
    K.bc(x-3*s,y-2*s,z+2*s,8*s,5*s,4*s,wh);G.pyr(x-7.3*s,y-4.8*s,z+6*s,8.6*s,5.6*s,1.6*s,bl,.3);
    cuLathe(G,x+4.5*s,y-2.5*s,z,[[2*s,0],[1.7*s,14*s]],wh,10);G.cyl(x+4.5*s,y-2.5*s,z+14*s,2.2*s,.6*s,gr,10);G.cone(x+4.5*s,y-2.5*s,z+14.6*s,1.8*s,2.4*s,bl,10);w3CylWins(k,x+4.5*s,y-2.5*s,1.72*s,z+4*s,z+13*s,8,3,.4*s);
    K.tops.push([x+2.5*s,y-4.5*s,x+6.5*s,y-.5*s,z+17*s]);k.ban(x+4.5*s,y-2.5*s,z+18*s);k.top=z+18*s;
    /* statue : silhouette debout, bras-hache levé, sur socle (stylisée) */
    {const sx=x-2*s,sy=y+3.4*s,sz=z+2.2*s;K.bc(sx,sy,sz,2.6*s,2.6*s,1.6*s,gr);cuEll(G,sx,sy,sz+4.2*s,1.2*s,.9*s,2.4*s,br,10,6);for(const sg of [-1,1])G.cyl(sx+sg*.5*s,sy,sz+1.6*s,.4*s,1.6*s,br,6);cuEll(G,sx,sy,sz+7.3*s,.8*s,.8*s,.9*s,br,8,5);
     cuTube(G,[[sx+1*s,sy,sz+5.6*s],[sx+2.4*s,sy,sz+7*s],[sx+2.6*s,sy,sz+8.6*s]],.35*s,br,6,true);G.quad([sx+2.6*s,sy,sz+8*s],[sx+4.2*s,sy,sz+8.6*s],[sx+4.2*s,sy,sz+10.4*s],[sx+2.6*s,sy,sz+9.8*s],cuC('#c8ccd0'));K.tops.push([sx-1.3*s,sy-1.3*s,sx+4.2*s,sy+1.3*s,sz+10*s]);}
    K.hold(x,y,11*s);}});

/* ---------- Syrup : village paisible, grand manoir blanc sur la colline, pente côtière (disposition interprétée) ---------- */
cuReg('Archipel des Gecko',{art:{trees:[['round',12]]},relief:cuRel([{t:'peak',x:.0,y:-.3,h:5,s:.2}]),
  build(k){const K=cuKit(k),{G,u:s,R}=K,wh=cuC('#f6f2ea'),wh2=cuC('#ddd6c6'),rf=cuC('#b5533c');const x=0,y=-.3*R,z=K.H(x,y);
    K.bc(x,y,z-.2,12*s,6*s,5*s,wh);G.pyr(x-6.4*s,y-3.4*s,z+4.8*s,12.8*s,6.8*s,3*s,rf,.32);for(const sg of [-1,1]){K.bc(x+sg*7.5*s,y+1*s,z-.2,4*s,7*s,4*s,wh2);G.pyr(x+sg*7.5*s-2.2*s,y-2.7*s,z+3.8*s,4.4*s,7.4*s,2.2*s,rf,.3);}
    w3Wins(k,x-5.5*s,y+3.01*s,x+5.5*s,y+3.01*s,z+.6*s,z+4.4*s,1.6*s,true);for(let q=0;q<5;q++)G.cyl(x-2.4*s+q*1.2*s,y+3.6*s,z,.2*s,3.2*s,wh2,6);
    for(let q=0;q<3;q++)G.box(x+(-4+q*4)*s,y-1*s,z+6.5*s,.6*s,.6*s,1.6*s,cuC('#9a5a44'));
    K.tops.push([x-9.5*s,y-3.5*s,x+9.5*s,y+4.5*s,z+8*s]);k.ban(x,y,z+9*s);k.top=z+9*s;K.hold(x,y,11*s);
    /* grille et allée du manoir, prairie à moutons */
    for(let q=0;q<12;q++){const xx=x-6*s+q*s;G.box(xx,y+7*s,K.H(xx,y+7*s)-.1,.12*s,.12*s,1.4*s,cuC('#2e2a2a'));}
    K.spot(10,600,.3,.85,(xx,yy,zz)=>{cuEll(G,xx,yy,zz+.6*s,.7*s,.45*s,.45*s,cuC('#f8f6f0'),8,5);cuEll(G,xx+.7*s,yy,zz+.7*s,.25*s,.2*s,.25*s,cuC('#3a3030'),6,4);},1.2*s);}});

/* ---------- Baratie : restaurant flottant en forme de poisson, amarré au large de l'îlot ---------- */
cuReg('Baratie',{art:{trees:[['palm',8]]},pier:0,
  build(k){const K=cuKit(k),{G,u:s,R}=K,hull=cuC('#c84a3a'),hull2=cuC('#f0e6d0'),wd=cuC('#8a5a34'),gr=cuC('#3a8a6a');const x=.5*R,y=.32*R,z=0;
    /* coque-poisson (axe x) : corps, tête à gueule ouverte, nageoires, queue */
    cuEll(G,x,y,z+1.4*s,10*s,4.2*s,2.6*s,(j)=>j<3?hull:hull2,16,8);cuEll(G,x+10*s,y,z+2*s,3.6*s,3.4*s,2.6*s,hull,12,7);
    for(const sg of [-1,1])cuEll(G,x+11.6*s,y+sg*2.4*s,z+3.4*s,.8*s,.4*s,.8*s,cuC('#f8f4ea'),8,5),cuEll(G,x+11.9*s,y+sg*2.6*s,z+3.4*s,.4*s,.3*s,.4*s,cuC('#1a1a1a'),6,4);
    for(const sg of [-1,1])G.tri([x-10*s,y,z+2*s],[x-14*s,y+sg*3.4*s,z+4.8*s],[x-13.4*s,y+sg*.6*s,z+1.2*s],hull);
    for(const sg of [-1,1])G.tri([x+2*s,y+sg*4*s,z+2.4*s],[x-2*s,y+sg*6.4*s,z+2*s],[x-3*s,y+sg*4*s,z+2*s],hull);
    /* restaurant sur le pont : deux étages, toits verts, terrasse, mâts et pavillon */
    K.bc(x-1*s,y,z+3.6*s,12*s,6*s,3*s,hull2);G.pyr(x-7.4*s,y-3.4*s,z+6.6*s,12.8*s,6.8*s,1.6*s,gr,.3);K.bc(x-1*s,y,z+8*s,7*s,4.4*s,2.4*s,hull2);G.pyr(x-4.8*s,y-2.5*s,z+10.4*s,7.6*s,5*s,1.6*s,gr,.3);
    for(let q=0;q<6;q++)K.glow(x-6*s+q*2*s,y+3.02*s,z+4.6*s,0,1,.4*s,1.1*s,cuC('#ffd27a'));
    G.cyl(x+3.5*s,y,z+6*s,.2*s,10*s,wd,6,false);G.tri([x+3.5*s,y,z+16*s],[x+3.5*s,y,z+14.4*s],[x+6.2*s,y,z+15.2*s],cuC('#f6f0e4'));
    K.tops.push([x-12*s,y-4*s,x+13*s,y+4*s,z+12*s]);k.ban(x-1*s,y,z+13*s);k.top=Math.max(k.top,16*s);
    cuTube(G,[[x-1*s,y-4*s,z+3*s],[x-1*s,K.rc(1.5708)*.88,1.2]],.5*s,wd,6,true);}});

/* ---------- Cocoyasi : vergers de mandariniers, maisonnette, forteresse des hommes-poissons au bord de l'eau (stylisée) ---------- */
cuReg('Archipel des Konomi',{art:{trees:[['palm',6]]},
  build(k){const K=cuKit(k),{G,u:s,R}=K,leaf=cuC('#3f8a3a'),ora=cuC('#f2932a');
    /* vergers : rangées régulières de mandariniers */
    for(let r=0;r<4;r++)for(let c=0;c<7;c++){const x=(-.5+c*.08)*R+(r%2)*.04*R,y=(.05+r*.08)*R,z=K.H(x,y);if(z<.6)continue;G.cyl(x,y,z-.1,.13*s,.9*s,cuC('#6a4a2c'),5,false);G.ico(x,y,z+1.5*s,1*s,.85,leaf,K.rnd,.15);for(let q=0;q<4;q++){const a=q*1.7+c;G.ico(x+Math.cos(a)*.8*s,y+Math.sin(a)*.8*s,z+1.5*s+(q%2)*.4*s,.22*s,1,ora,null,0);}K.tops.push([x-s,y-s,x+s,y+s,z+2.5*s]);K.hold(x,y,1.1*s);}
    {const hx=-.2*R,hy=-.18*R,hz=K.H(hx,hy);K.bc(hx,hy,hz,4*s,3.4*s,2.4*s,cuC('#f2e8d4'));G.pyr(hx-2.2*s,hy-1.9*s,hz+2.4*s,4.4*s,3.8*s,1.8*s,cuC('#3d64b8'),.1);K.hold(hx,hy,3*s);}
    /* forteresse au toit en ailerons (interprétation) */
    {const fx=.42*R,fy=-.22*R,fz=K.H(fx,fy);K.bc(fx,fy,fz-.2,11*s,8*s,3*s,cuC('#6a8a9a'));K.bc(fx,fy,fz+2.8*s,6*s,4.4*s,4*s,cuC('#e8eef0'));G.pyr(fx-3.3*s,fy-2.5*s,fz+6.8*s,6.6*s,5*s,2.2*s,cuC('#2e6a8a'),.2);
     for(const sg of [-1,1])G.tri([fx+sg*3*s,fy,fz+6.8*s],[fx+sg*6*s,fy,fz+6*s],[fx+sg*3.4*s,fy,fz+10*s],cuC('#2e6a8a'));G.tri([fx,fy-1*s,fz+8.6*s],[fx,fy+1*s,fz+8.6*s],[fx,fy,fz+12*s],cuC('#2e6a8a'));
     K.tops.push([fx-5.5*s,fy-4*s,fx+5.5*s,fy+4*s,fz+12*s]);k.ban(fx,fy,fz+13*s);k.top=fz+13*s;K.hold(fx,fy,8*s);}
    /* moulin, tradition des villages de l'East Blue */
    {const mx=-.45*R,my=-.35*R,mz=K.H(mx,my);W3LM.windmill({G,x:mx,y:my,z:mz,s:1.3*s,o:{},tops:K.tops,top:0,ban:()=>{}});K.hold(mx,my,4*s);}}});

/* ---------- Goa : royaume en terrasses (ville haute, muraille blanche) et décharge du Gray Terminal en contrebas ---------- */
cuReg('Goa',{art:{trees:[['round',6]]},relief:cuRel([{t:'plat',x:-.1,y:-.25,r:.3,w:.15,h:5},{t:'plat',x:-.1,y:-.28,r:.16,w:.08,h:7.5}]),
  color(x,y,h,sl,def,c){const R=c.R;if(x>.2*R&&y>-.1*R&&h<4)return cuMix(cuC('#7a6a50'),cuC('#5a4e3e'),fbm2(x*.3,y*.3,c.S0,2));return null;},
  build(k){const K=cuKit(k),{G,u:s,R}=K;
    const top=cuCastle(K,k,-.1*R,-.3*R,s,{W:9,D:7,th:8,kh:10,roof:cuC('#3d64b8'),w:cuC('#f8f6f2'),w2:cuC('#dcd8ce')});k.ban(-.1*R,-.3*R,top+1*s);k.top=top+2*s;
    for(let q=0;q<24;q++){const a=q/24*6.2832,x=-.1*R+Math.cos(a)*.3*R,y=-.25*R+Math.sin(a)*.3*R,z=K.H(x,y);if(z<.5)continue;G.box(x-.9*s,y-.9*s,z-.3,1.8*s,1.8*s,2.6*s,cuC('#f4f2ec'));}
    /* décharge : amas de ferraille, cabanes de tôle, fumées */
    K.spot(16,900,.3,.9,(x,y,zz,i)=>{if(x<.18*R||y<-.15*R)return;const r=(1+K.rnd()*1.4)*s;G.ico(x,y,zz+r*.3,r,.7,[cuC('#7a6a50'),cuC('#8a5a3a'),cuC('#5a5a5a')][i%3],K.rnd,.5);if(i%4===0)for(let q=0;q<3;q++)cuEll(G,x,y,zz+(2+q*1.4)*s,(.6+q*.3)*s,(.6+q*.3)*s,.5*s,cuC('#9a9690'),6,4);},.5*s);
    K.spot(8,600,.3,.9,(x,y,zz)=>{if(x<.15*R||y<-.15*R)return;G.box(x,y,zz-.1,2.2*s,1.8*s,1.4*s,cuC('#8a7a62'));G.pyr(x-.1*s,y-.1*s,zz+1.3*s,2.4*s,2*s,.6*s,cuC('#6a6a6a'),.05);K.hold(x,y,1.6*s);},1*s);}});

/* ---------- Foosha : village côtier, grand moulin, petit bar, colline boisée en arrière-plan ---------- */
cuReg('Foosha',{art:{trees:[['round',8],['palm',6]]},relief:cuRel([{t:'peak',x:-.3,y:-.4,h:8,s:.18}]),
  build(k){const K=cuKit(k),{G,u:s,R}=K;
    {const mx=.25*R,my=-.15*R,mz=K.H(mx,my);W3LM.windmill({G,x:mx,y:my,z:mz,s:2*s,o:{},tops:K.tops,top:0,ban:()=>{}});k.ban(mx,my,mz+13*s);k.top=mz+14*s;K.hold(mx,my,5*s);}
    {const bx=-.05*R,by=.15*R,bz=K.H(bx,by);K.bc(bx,by,bz,6*s,4*s,2.6*s,cuC('#f2e2c0'));G.pyr(bx-3.3*s,by-2.3*s,bz+2.6*s,6.6*s,4.6*s,1.8*s,cuC('#b5533c'),.15);K.bc(bx,by+2.2*s,bz+1.6*s,2.4*s,.3*s,.6*s,cuC('#5a3c24'));G.box(bx+2.6*s,by+1.6*s,bz,.8*s,.8*s,.8*s,cuC('#8a5f38'));K.hold(bx,by,4*s);}
    K.spot(14,800,.1,.6,(x,y,zz)=>{if(y>-.2*R)return;K.tree('round',x,y,zz,(1.4+K.rnd())*s,cuC('#3f7a34'));},1.5*s);}});

/* ---------- Lvneel : royaume nordique, château sur promontoire au-dessus d'un fjord (interprétation) ---------- */
cuReg('Lvneel',{art:{b:'grass',peaks:[],trees:[['pine',14]]},relief:cuRel([{t:'peak',x:-.25,y:-.3,h:9,s:.17},{t:'peak',x:.35,y:-.35,h:7,s:.15},{t:'line',ax:'x',v:.08,w:.035,h:.2}]),
  color(x,y,h,sl,def,c){if(h<.45)return cuC('#3a7a98');if(sl>.3)return cuMix(cuC('#5a5e64'),cuC('#7a7e84'),.5+.5*Math.sin(h*4));return null;},
  build(k){const K=cuKit(k),{G,u:s,R}=K;G.quad([.08*R-.035*R,-.95*R,.33],[.08*R+.035*R,-.95*R,.33],[.08*R+.035*R,.95*R,.33],[.08*R-.035*R,.95*R,.33],cuC('#4a9ab8'),[0,0,1]);
    const top=cuCastle(K,k,-.28*R,-.28*R,s,{W:8,D:6,th:7,kh:10,roof:cuC('#2e4a6a'),w:cuC('#c8c4bc'),w2:cuC('#9a968e'),cone:3.6});k.ban(-.28*R,-.28*R,top+s);k.top=top+2*s;
    for(let q=0;q<5;q++){const y=(-.4+q*.18)*R;G.box(.08*R-2.4*s,y-.4*s,1.5,4.8*s,.8*s,.4*s,cuC('#8a6a48'));}}});

/* ---------- Flevance : la ville blanche — toits, flèches et arbres entièrement blancs ---------- */
cuReg('Flevance',{art:{b:'snow',trees:[['pine',8]],house:'snowy'},
  color(x,y,h,sl,def,c){if(sl>.3)return cuMix(cuC('#c8ccd4'),cuC('#e4e8ee'),.5+.5*Math.sin(h*4));return cuMix(cuC('#f6f8fa'),cuC('#eceff3'),fbm2(x*.15,y*.15,c.S0,2));},
  build(k){const K=cuKit(k),{G,u:s,R}=K,w=cuC('#ffffff'),w2=cuC('#e6e9ee'),w3=cuC('#cfd5de');
    const x=0,y=-.15*R,z=K.H(x,y);K.bc(x,y,z,8*s,12*s,6*s,w2);G.pyr(x-4.3*s,y-6.3*s,z+6*s,8.6*s,12.6*s,4*s,w,.48);cuLathe(G,x,y+5*s,z,[[1.8*s,0],[1.5*s,14*s]],w,10);G.cone(x,y+5*s,z+14*s,2*s,7*s,w,10);
    for(let q=0;q<5;q++)K.glow(x+4.02*s,y-4*s+q*2*s,z+2*s,1,0,.35*s,2.2*s,cuC('#bcd4f0'));K.tops.push([x-4*s,y-6*s,x+4*s,y+7*s,z+21*s]);k.ban(x,y+5*s,z+22*s);k.top=z+22*s;K.hold(x,y,9*s);
    K.spot(10,800,.15,.85,(xx,yy,zz,i)=>{const h=(4+K.rnd()*4)*s;cuLathe(G,xx,yy,zz-.1,[[.8*s,0],[.7*s,h]],w2,8);G.cone(xx,yy,zz+h,1*s,2.6*s,w,8);K.tops.push([xx-s,yy-s,xx+s,yy+s,zz+h+2.6*s]);},2*s);
    K.spot(10,600,.15,.9,(xx,yy,zz)=>K.tree('round',xx,yy,zz,(1+K.rnd()*.6)*s,cuC('#f4f6fa')),1.4*s);}});

/* ---------- Ruskaina : île glaciaire et sauvage — pics de glace, lac gelé, ossements de bêtes géantes (interprétation) ---------- */
cuReg('Rusukaina',{art:{trees:[['pine',12]]},
  build(k){const K=cuKit(k),{G,u:s,R}=K,ice=[cuC('#bfe6f6'),cuC('#a6d8f0'),cuC('#e0f4fc')];
    {const lx=.15*R,ly=.18*R,lz=K.H(lx,ly)+.08,r=.17*R;for(let q=0;q<24;q++){const a0=q/24*6.2832,a1=(q+1)/24*6.2832;G.tri([lx,ly,lz],[lx+Math.cos(a0)*r,ly+Math.sin(a0)*r*.8,lz],[lx+Math.cos(a1)*r,ly+Math.sin(a1)*r*.8,lz],cuC('#cfeefa'),[0,0,1],[0,0,1],[0,0,1]);}K.hold(lx,ly,r);}
    K.spot(16,900,.1,.9,(x,y,zz,i)=>{for(let q=0;q<3;q++){const a=q*2.1+i;G.cone(x+Math.cos(a)*.8*s,y+Math.sin(a)*.8*s,zz-.2,(.7+q*.2)*s,(3+((i*3+q)%4)*1.4)*s,ice[q],5);}K.tops.push([x-s,y-s,x+s,y+s,zz+6*s]);},2*s);
    {const bx=-.3*R,by=.25*R,bz=K.H(bx,by);for(let q=0;q<5;q++)for(const sg of [-1,1])cuTube(G,cuCR([[bx+q*1.5*s,by+sg*.4*s,bz],[bx+q*1.5*s,by+sg*2.6*s,bz+2.6*s],[bx+q*1.5*s,by+sg*.4*s,bz+4.2*s]],3),.18*s,cuC('#ece6d6'),5,true);
     for(const sg of [-1,1])cuTube(G,cuCR([[bx-2*s,by+sg*1*s,bz+2*s],[bx-5*s,by+sg*2.4*s,bz+1*s],[bx-6.5*s,by+sg*1*s,bz+3.6*s]],4),t=>(1-.7*t)*.4*s,cuC('#f4ecd8'),6,true);cuEll(G,bx-2.6*s,by,bz+1.8*s,1.6*s,1.4*s,1.3*s,cuC('#ece6d6'),8,5);K.hold(bx,by,6*s);}
    k.ban(0,-.2*R,K.H(0,-.2*R)+8*s);}});

/* ---------- Lulusia : île anéantie — grand cratère, ruines calcinées, braises (évocation de la destruction) ---------- */
cuReg('Lulusia',{art:{lake:null,trees:[['dead',10]]},relief:cuRel([{t:'dip',x:0,y:.02,h:3.6,s:.16}]),
  color(x,y,h,sl,def,c){const d=Math.hypot(x,y-.02*c.R);if(d<.12*c.R)return cuMix(cuC('#ff7a3a'),cuC('#3a2a26'),r3ss(.03*c.R,.12*c.R,d));if(d<.3*c.R)return cuMix(cuC('#2a2422'),cuC('#4a3a34'),fbm2(x*.3,y*.3,c.S0,2));return null;},
  build(k){const K=cuKit(k),{G,u:s,R}=K;cuRuins(K,0,0,.7*R,26,cuC('#3a3430'),cuC('#5a4e46'));
    K.spot(16,700,.05,.3,(x,y,zz)=>cuEll(G,x,y,zz+.3*s,.3*s,.3*s,.3*s,cuC('#ffb04a'),5,3),.3*s);
    for(let q=0;q<4;q++)cuEll(G,q*.8*s,.02*R-q*.5*s,4*s+q*2*s,(1.4+q*.5)*s,(1.4+q*.5)*s,1*s,cuMix(cuC('#5a5050'),cuC('#a8a0a0'),q/4),8,5);
    k.ban(-.3*R,-.3*R,K.H(-.3*R,-.3*R)+8*s);k.top=14*s;}});

/* ---------- Spider Miles : ville-décharge — tours de ferraille, cheminées fumantes, grue (interprétation) ---------- */
cuReg('Spider Miles',{art:{trees:[['dead',6]]},
  build(k){const K=cuKit(k),{G,u:s,R}=K,rust=[cuC('#8a5a3a'),cuC('#6a6a6a'),cuC('#7a6a50'),cuC('#5a4a3a')];
    {const x=0,y=-.1*R,z=K.H(x,y);let zz=z;for(let q=0;q<7;q++){const w=(8-q*.8)*s;K.bc(x+(q%2?.6:-.6)*s,y+(q%3-1)*.5*s,zz,w,w*.8,2*s,rust[q%4]);zz+=2*s;}G.cyl(x,y,zz,.3*s,5*s,cuC('#3a3a3a'),5,false);for(const hz of [1.4,3,4.4])cuTube(G,[[x-3*s,y,zz+hz*s-1*s],[x,y,zz+hz*s],[x+3*s,y,zz+hz*s-1*s]],.06*s,cuC('#2a2a2a'),4,false);k.ban(x,y,zz+5.5*s);k.top=zz+6*s-z;K.hold(x,y,7*s);}
    K.spot(10,700,.2,.85,(x,y,zz,i)=>{const h=(3+K.rnd()*4)*s;K.bc(x,y,zz-.1,2.4*s,2*s,h,rust[i%4]);if(i%3===0){G.cyl(x+.5*s,y,zz+h,.35*s,2.4*s,cuC('#4a4a4a'),6);for(let q=0;q<3;q++)cuEll(G,x+.5*s+q*.5*s,y,zz+h+3*s+q*1.3*s,(.6+q*.3)*s,(.6+q*.3)*s,.5*s,cuC('#8a8480'),6,4);}},1.6*s);
    {const cx=.4*R,cy=.2*R,cz=K.H(cx,cy);G.cyl(cx,cy,cz,.4*s,10*s,cuC('#c8a030'),4,false);cuTube(G,[[cx,cy,cz+10*s],[cx-6*s,cy,cz+10*s]],.3*s,cuC('#c8a030'),4,true);G.box(cx-5.8*s,cy-.1*s,cz+5*s,.2*s,.2*s,5*s,cuC('#333'));G.box(cx-6.6*s,cy-.8*s,cz+3.6*s,1.6*s,1.6*s,1.4*s,rust[0]);K.hold(cx,cy,2*s);}}});

/* ---------- Mirrorball : grande sphère à facettes miroir sur une place (interprétation d'après le nom) ---------- */
cuReg('Mirrorball',{art:{trees:[['palm',8]]},
  build(k){const K=cuKit(k),{G,u:s,R}=K;const x=0,y=-.08*R,z=K.H(x,y);G.cyl(x,y,z-.1,6*s,.6*s,cuC('#e8e0d0'),20);cuLathe(G,x,y,z+.5*s,[[1.6*s,0],[1*s,3*s],[1.4*s,3.6*s]],cuC('#c8c0b0'),12);
    cuEll(G,x,y,z+8*s,4.4*s,4.4*s,4.4*s,(j,i)=>((i+j)%2)?cuC('#e8f0fa'):((i*3+j)%5===0?cuC('#ffd6f0'):cuC('#a8c4e0')),12,8);
    for(let q=0;q<8;q++){const a=q/8*6.2832;G.cyl(x+Math.cos(a)*5.4*s,y+Math.sin(a)*5.4*s,z+.4*s,.15*s,2.2*s,cuC('#c8c0b0'),5,false);G.ico(x+Math.cos(a)*5.4*s,y+Math.sin(a)*5.4*s,z+2.8*s,.3*s,1,cuC('#ffe8a0'),null,0);}
    K.tops.push([x-4.4*s,y-4.4*s,x+4.4*s,y+4.4*s,z+12.4*s]);k.ban(x,y,z+13*s);k.top=z+13*s;K.hold(x,y,7*s);}});

/* ---------- Ohara : l'arbre de la connaissance devenu bibliothèque, entouré de ruines calcinées ---------- */
cuReg('Ohara',{art:{trees:[['dead',8],['round',4]]},
  color(x,y,h,sl,def,c){const d=Math.hypot(x,y);if(d<.5*c.R&&h>.6)return cuMix(cuC('#4a4036'),cuC('#6a5a46'),fbm2(x*.25,y*.25,c.S0,2));return null;},
  build(k){const K=cuKit(k),{G,u:s,R}=K,bark=cuC('#5a4030'),burnt=cuC('#3a322c');const x=0,y=-.05*R,z=K.H(x,y);
    cuLathe(G,x,y,z-.3,[[6*s,0],[4.6*s,2*s],[4*s,10*s],[3.6*s,14*s]],bark,14);for(let r=0;r<3;r++)for(let q=0;q<10;q++){const a=q/10*6.2832;K.glow(x+Math.cos(a)*(4.4-r*.2)*s,y+Math.sin(a)*(4.4-r*.2)*s,z+(2.5+r*3.6)*s,Math.cos(a),Math.sin(a),.4*s,1.8*s,q%2?cuC('#ffd27a'):cuC('#e8b860'));}
    for(let q=0;q<6;q++){const a=q/6*6.2832;cuTube(G,cuCR([[x,y,z+12*s],[x+Math.cos(a)*4*s,y+Math.sin(a)*4*s,z+15*s],[x+Math.cos(a)*7*s,y+Math.sin(a)*7*s,z+16*s]],3),t=>(1-.7*t)*.9*s,bark,6,true);cuEll(G,x+Math.cos(a)*7*s,y+Math.sin(a)*7*s,z+17*s,3*s,3*s,2*s,q%2?cuC('#4a6a3a'):burnt,8,5);}
    cuEll(G,x,y,z+19*s,5*s,5*s,3*s,cuC('#4a6a3a'),10,6);K.bc(x,y+5.8*s,z,2.4*s,.4*s,3*s,cuC('#2a1e14'));K.tops.push([x-7*s,y-7*s,x+7*s,y+7*s,z+21*s]);k.ban(x,y,z+23*s);k.top=z+23*s;K.hold(x,y,9*s);
    cuRuins(K,0,0,.75*R,22,cuC('#5a524a'),cuC('#7a6e60'));}});

/* ---------- Sorbet : palais royal pastel et chapelle à clocher (interprétation) ---------- */
cuReg('Royaume de Sorbet',{art:{trees:[['round',8]]},
  build(k){const K=cuKit(k),{G,u:s,R}=K;const top=cuCastle(K,k,-.1*R,-.2*R,s,{W:9,D:6,th:6,kh:8,roof:cuC('#5ab0c8'),w:cuC('#fff4ec'),w2:cuC('#f2d8cc')});k.ban(-.1*R,-.2*R,top+s);k.top=top+2*s;
    const cx=.35*R,cy=.05*R,z=K.H(cx,cy);K.bc(cx,cy,z,4*s,7*s,4*s,cuC('#f6efe2'));G.pyr(cx-2.2*s,cy-3.7*s,z+4*s,4.4*s,7.4*s,2.6*s,cuC('#8a5aa8'),.48);K.bc(cx,cy-3*s,z,2.4*s,2.4*s,9*s,cuC('#f6efe2'));G.cone(cx,cy-3*s,z+9*s,1.8*s,4*s,cuC('#8a5aa8'),4);
    G.box(cx-.08*s,cy-1.7*s,z+13.4*s,.16*s,.1*s,1.4*s,cuC('#f0c050'));G.box(cx-.5*s,cy-1.7*s,z+14.1*s,1*s,.1*s,.16*s,cuC('#f0c050'));K.hold(cx,cy,5*s);}});

/* ---------- Hachinosu : île-repaire des pirates, rocher en forme de crâne dominant un village de bicoques (élément à confirmer) ---------- */
cuReg('La Ruche',{art:{trees:[['dead',8]]},relief:cuRel([{t:'plat',x:0,y:-.25,r:.2,w:.12,h:3}]),
  build(k){const K=cuKit(k),{G,u:s,R}=K,rk=cuC('#d8d0c0'),dk=cuC('#1e1a1c');const x=0,y=-.25*R,z=K.H(x,y);
    cuEll(G,x,y,z+7*s,8*s,7*s,7.6*s,rk,14,9);cuEll(G,x,y+3*s,z+2*s,5.4*s,4*s,3.4*s,rk,12,7);
    for(const sg of [-1,1])cuEll(G,x+sg*3*s,y+6.2*s,z+8*s,2*s,1*s,2.2*s,dk,10,6);cuEll(G,x,y+6.8*s,z+4.8*s,.9*s,.6*s,1.2*s,dk,8,5);
    for(let q=0;q<6;q++)K.bc(x-3.2*s+q*1.3*s,y+6.4*s,z+1.4*s,.9*s,.8*s,1.6*s,cuC('#f0e8d8'));
    K.tops.push([x-8*s,y-7*s,x+8*s,y+7*s,z+14*s]);k.ban(x,y,z+16*s);k.top=z+16*s;K.hold(x,y,10*s);
    K.spot(12,700,.25,.9,(xx,yy,zz,i)=>{if(yy<-.05*R)return;K.bc(xx,yy,zz-.1,2.2*s,1.8*s,1.6*s,[cuC('#7a5a3a'),cuC('#5a4a3a'),cuC('#8a6a48')][i%3]);G.pyr(xx-1.2*s,yy-1*s,zz+1.5*s,2.4*s,2*s,.9*s,cuC('#4a3a2a'),.05);if(i%3===0)w3Pennant(k,xx,yy,zz+1.6*s,3*s,dk,s);},1.2*s);}});

/* ---------- Raijin : île des orages — aiguille rocheuse coiffée d'un paratonnerre, nuages noirs, éclairs figés (interprétation) ---------- */
cuReg('Raijin',{art:{peaks:[],trees:[['pine',6],['dead',6]]},relief:cuRel([{t:'peak',x:0,y:-.15,h:15,s:.12},{t:'peak',x:-.4,y:.1,h:5,s:.1},{t:'peak',x:.4,y:.05,h:6,s:.1}]),
  build(k){const K=cuKit(k),{G,u:s,R}=K;const x=0,y=-.15*R,z=K.H(x,y);G.cyl(x,y,z-.5,.3*s,7*s,cuC('#c8a050'),6,false);G.cone(x,y,z+6.5*s,.5*s,2*s,cuC('#ffd84a'),6);
    for(let q=0;q<6;q++){const a=q*1.05;cuCloud(K,x+Math.cos(a)*7*s,y+Math.sin(a)*6*s,z+11*s+(q%2)*1.5*s,1.2*s,cuC(q%2?'#4a4e5a':'#3a3e4a'));}
    for(let q=0;q<4;q++){const a=q*1.6+.4,bx=x+Math.cos(a)*6*s,by=y+Math.sin(a)*5*s,gz=K.H(bx,by);let px=bx,py=by,pz=z+10*s;for(let t=0;t<4;t++){const nx=bx+(t%2?1:-1)*.9*s,ny=by,nz=pz-(pz-gz)/(4-t);cuTube(G,[[px,py,pz],[nx,ny,nz]],.14*s,cuC('#fff4a0'),4,false);px=nx;py=ny;pz=nz;}}
    K.tops.push([x-s,y-s,x+s,y+s,z+9*s]);k.ban(x+2*s,y+2*s,z+2*s);k.top=z+14*s;K.hold(x,y,4*s);}});
