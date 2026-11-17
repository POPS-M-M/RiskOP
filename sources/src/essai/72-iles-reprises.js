/* ================= ÎLES SUR MESURE — reprise des six îles jugées faibles (version test) =================
   Remplace les entrées de 70/71 pour : Baratie, Karate, Baterilla, Briss, Torino, Long Ring Long Land.
   Canon = ce que l'œuvre établit (à ma connaissance, non revérifié en ligne) ; [I] = interprétation artistique.
   La côte, la taille logique et les zones de clic ne changent pas : seul le décor à l'intérieur de la côte change. */

/* relief libre : f(x,y,d,base) avec d = distance relative à la côte (0 centre, 1 côte) */
const cuRelF=(f)=>(H0,c)=>{const {rc}=c;return (x,y)=>{const r=Math.hypot(x,y),d=r/rc(Math.atan2(y,x)),b=H0(x,y);if(d>=1)return b;return f(x,y,d,b,c);};};
const cuSegD=(px,py,ax,ay,bx,by)=>{const vx=bx-ax,vy=by-ay,t=Math.max(0,Math.min(1,((px-ax)*vx+(py-ay)*vy)/(vx*vx+vy*vy||1)));return Math.hypot(px-ax-vx*t,py-ay-vy*t);};

/* ---------- Baratie — canon : restaurant flottant en forme de poisson (East Blue).
   [I] : bassin-port abrité qui le met en scène, couleurs, toque géante, terrasses-nageoires, lanternes. ---------- */
cuReg('Baratie',{art:{trees:[['palm',10]],town:0},pier:Math.PI/2,
  relief:cuRelF((x,y,d,b,c)=>{const R=c.R,q=cuSegD(x,y,0,.08*R,0,1.3*R),k=r3ss(.5*R,.38*R,q);return b*(1-k)+(-1.2)*k+(k<.05?.6*r3ss(.95,.7,d):0);}),
  color(x,y,h,sl,def,c){if(h<.35&&h>-.5)return cuC('#e9d7a4');return null;},
  build(k){const K=cuKit(k),{G,u,R}=K,s=u*1.15,x=0,y=.26*R,z=.15;
    const red=cuC('#d24a32'),red2=cuC('#a8382a'),cream=cuC('#f4e6c8'),green=cuC('#3f8f6a'),wood=cuC('#8a5a34'),gold=cuC('#f0c040'),white=cuC('#fbf8f0'),dark=cuC('#2a1e18');
    /* coque-poisson, tête tournée vers le sud (vers le joueur) : corps, ventre clair, écailles, nageoires, queue */
    cuEll(G,x,y,z+1.6*s,6.2*s,12*s,3*s,(j)=>j<3?cream:red,18,8);
    for(let q=0;q<5;q++)cuEll(G,x,y-6*s+q*2.6*s,z+3.2*s,5.6*s-Math.abs(q-2)*.5*s,1.1*s,.9*s,red2,14,4);           /* bandes d'écailles */
    cuEll(G,x,y+11*s,z+2.2*s,4.6*s,4*s,3.2*s,red,16,8);                                                      /* tête */
    cuEll(G,x,y+14*s,z+1.6*s,2.6*s,1.2*s,1*s,dark,10,5);cuEll(G,x,y+14.2*s,z+1.2*s,2.4*s,.9*s,.5*s,cuC('#e8806a'),10,4);  /* gueule ouverte */
    for(const sg of [-1,1]){cuEll(G,x+sg*3.3*s,y+11.6*s,z+3.6*s,1.2*s,1*s,1.2*s,white,10,6);cuEll(G,x+sg*3.9*s,y+12.1*s,z+3.8*s,.55*s,.5*s,.6*s,dark,8,5);}
    for(const sg of [-1,1]){G.tri([x+sg*2*s,y-11*s,z+2.4*s],[x+sg*7.5*s,y-17*s,z+5.4*s],[x+sg*1*s,y-14.6*s,z+1.6*s],red2);G.tri([x+sg*2*s,y-11*s,z+2.4*s],[x+sg*6.5*s,y-17.6*s,z+.8*s],[x+sg*1*s,y-14.6*s,z+1.6*s],red);}
    /* nageoires latérales devenues terrasses [I] : planchers verts, tables et parasols */
    for(const sg of [-1,1]){const fx=x+sg*8.6*s,fy=y+1*s;G.tri([x+sg*5.4*s,fy-5*s,z+2.6*s],[fx+sg*3.4*s,fy-1*s,z+2.6*s],[x+sg*5.4*s,fy+4.6*s,z+2.6*s],green,[0,0,1],[0,0,1],[0,0,1]);
      G.tri([x+sg*5.4*s,fy-5*s,z+2.2*s],[fx+sg*3.4*s,fy-1*s,z+2.2*s],[fx+sg*3.4*s,fy-1*s,z+2.6*s],cuC('#2c6a4e'));
      for(let q=0;q<3;q++){const tx=x+sg*(7+q*1.3)*s,ty=fy-1.6*s+q*1.4*s;G.cyl(tx,ty,z+2.6*s,.6*s,.5*s,white,8);G.cyl(tx,ty,z+2.6*s,.06*s,1.8*s,wood,4,false);G.cone(tx,ty,z+4.2*s,1.1*s,.6*s,q%2?gold:cuC('#e85a4a'),8);}}
    /* le restaurant sur le pont : deux étages crème, toit vert, baies dorées, enseigne et toque géante [I] */
    const by=y-.6*s,bz=z+3.6*s;K.bc(x,by,bz,8*s,12*s,3.4*s,cream,cuC('#e8d8b8'));G.pyr(x-4.6*s,by-6.6*s,bz+3.4*s,9.2*s,13.2*s,2*s,green,.2);
    K.bc(x,by-1*s,bz+4.6*s,5*s,6*s,2.4*s,cream);G.pyr(x-2.9*s,by-4.4*s,bz+7*s,5.8*s,6.8*s,1.6*s,green,.2);
    for(let q=0;q<4;q++)K.glow(x-3*s+q*2*s,by+6.02*s,bz+.8*s,0,1,.55*s,1.6*s,gold);
    for(let q=0;q<5;q++)K.glow(x-4.02*s,by-4.4*s+q*2.2*s,bz+.8*s,-1,0,.5*s,1.5*s,gold);
    G.box(x-3*s,by+6.1*s,bz+3.6*s,6*s,.3*s,1.2*s,cuC('#f6f0e0'));                                                   /* enseigne */
    for(let q=0;q<3;q++)cuEll(G,x-.9*s+q*.9*s,by+6.4*s,bz+4.2*s,.32*s,.12*s,.32*s,red,8,4);
    {const tz=bz+8.4*s;cuLathe(G,x,by-1*s,tz,[[1.5*s,0],[1.6*s,1.4*s]],white,14);cuEll(G,x,by-1*s,tz+2.2*s,2.1*s,2.1*s,1.5*s,white,14,7);for(let q=0;q<3;q++)cuEll(G,x+(q-1)*1.3*s,by-1*s,tz+2.6*s,1*s,1*s,.9*s,white,10,5);}
    k.ban(x,y-6*s,bz+6*s);G.cyl(x,y-6*s,bz,.12*s,6*s,wood,5,false);
    for(let q=0;q<10;q++){const a=q/10*6.2832;cuEll(G,x+Math.cos(a)*5.6*s,y+Math.sin(a)*11*s,z+3.4*s,.25*s,.25*s,.3*s,cuC('#ffcf6a'),6,4);}       /* lanternes */
    K.tops.push([x-6*s,y-12*s,x+6*s,y+14*s,bz+11*s]);k.top=bz+12*s;
    /* quais du bassin, bouées, barques */
    for(const sg of [-1,1]){const qx=sg*.42*R;K.box(qx-1*s,.1*R,-.2,2*s,.5*R,.8,wood,cuC('#a07048'));for(let q=0;q<5;q++)G.cyl(qx+sg*1.2*s,.12*R+q*.1*R,-.3,.25*s,1.3,cuC('#5a3c24'),5);}
    for(const [bx,byy] of [[-.25,.75],[.28,.68]]){cuEll(G,bx*R,byy*R,.15,1*s,2.2*s,.5*s,cuC('#9a6a3e'),10,4);}
    K.spot(14,900,.55,.92,(xx,yy,zz)=>K.tree('palm',xx,yy,zz,(1.3+K.rnd()*.6)*s,cuC('#3f8f3a')),1.4*s);}});

/* ---------- Karate — nom de l'île seulement dans les données : [I] pic rocheux couronné d'un dojo, long escalier, torii, cerisiers. ---------- */
cuReg('Karate',{art:{peaks:[],house:'jp',trees:[['blossom',6]]},pier:Math.PI/2,
  relief:cuRelF((x,y,d,b,c)=>{const R=c.R,px=0,py=-.1*R,q=Math.hypot(x-px,(y-py)*1.1),pil=r3ss(.25*R,.17*R,q),sh=1+.08*Math.sin(Math.atan2(y-py,x-px)*7);
    return b+16*r3ss(.26*R*sh,.17*R*sh,q)+.9*fbm2(x*.3,y*.3,7,2)*pil+2.4*r3ss(.55*R,.3*R,q)*(1-pil);}),
  color(x,y,h,sl,def,c){if(sl>.32)return cuMix(cuC('#7d7468'),cuC('#a39886'),.5+.5*Math.sin(h*3.1+x*.2));if(h>15)return cuMix(cuC('#cfc2a2'),cuC('#bfb090'),cuStripe(x,y,1.4*c.u,0,1));return null;},
  build(k){const K=cuKit(k),{G,u,R}=K,s=u*1.25,x=0,y=-.1*R,z=K.H(x,y);const wall=cuC('#f4ecd8'),wd=cuC('#6a3a24'),rf=cuC('#2c3448'),red=cuC('#c8352e'),gold=cuC('#e8b830');
    /* dojo : soubassement de pierre, grande salle, toit à deux niveaux, galerie de bois */
    K.bc(x,y,z-.4,10*s,8*s,1*s,cuC('#9a907e'));K.bc(x,y,z+.6*s,9*s,7*s,3*s,wall,cuC('#e8dcc4'));
    for(let q=0;q<5;q++)G.box(x-4.5*s+q*2.2*s,y+3.52*s,z+.6*s,.35*s,.2*s,3*s,wd);
    G.pyr(x-6*s,y-4.8*s,z+3.6*s,12*s,9.6*s,2.6*s,rf,.4);K.bc(x,y,z+5.2*s,5*s,4*s,2*s,wall);G.pyr(x-3.4*s,y-2.8*s,z+7.2*s,6.8*s,5.6*s,2.2*s,rf,.3);
    for(const sg of [-1,1])cuEll(G,x+sg*3*s,y,z+9.6*s,.5*s,.3*s,.5*s,gold,8,4);
    G.box(x-1.6*s,y+3.62*s,z+2.2*s,3.2*s,.2*s,1*s,cuC('#1a1a1a'));for(let q=0;q<3;q++)G.box(x-1.2*s+q*.9*s,y+3.7*s,z+2.4*s,.5*s,.1*s,.6*s,wall);  /* enseigne du dojo */
    k.ban(x+4.5*s,y-3*s,z+9*s);k.top=z+11*s;K.tops.push([x-6*s,y-5*s,x+6*s,y+5*s,z+10*s]);K.hold(x,y,8*s);
    /* torii au sommet de l'escalier + lanternes de pierre */
    {const ty=y+6.2*s,tz=K.H(x,ty);for(const sg of [-1,1])G.cyl(x+sg*2.4*s,ty,tz-.2,.35*s,5*s,red,8);G.box(x-3.6*s,ty-.4*s,tz+4.6*s,7.2*s,.8*s,.6*s,cuC('#1e1e1e'));G.box(x-3*s,ty-.3*s,tz+3.6*s,6*s,.6*s,.4*s,red);
      for(const sg of [-1,1]){G.box(x+sg*4.2*s-.4*s,ty-.4*s,tz,.8*s,.8*s,1.6*s,cuC('#a8a090'));G.pyr(x+sg*4.2*s-.7*s,ty-.7*s,tz+1.6*s,1.4*s,1.4*s,.7*s,cuC('#8a8478'));}}
    /* escalier en lacets taillé dans la falaise (sud), paliers de pierre */
    {let px=0,py=y+7.4*s;const pts=[];for(let q=0;q<26;q++){const f=q/25,yy=y+.2*R+f*.62*R,xx=Math.sin(f*Math.PI*3)*.12*R;pts.push([xx,yy]);}
      for(let i=0;i<pts.length-1;i++){const [ax,ay]=pts[i],[bx,by2]=pts[i+1],za=K.H(ax,ay),zb=K.H(bx,by2);const mx=(ax+bx)/2,my=(ay+by2)/2,zz=Math.max(.3,Math.min(za,zb));G.box(mx-1.2*s,my-.5*s,zz-.2,2.4*s,1*s,Math.max(.4,Math.abs(za-zb)*.6+.3),i%2?cuC('#b8ad98'):cuC('#a89e8a'));}}
    /* village au pied du pic : maisons japonaises, cerisiers, poteaux d'entraînement */
    const nH=Math.round(6*(k.city?[.8,1,1.3,1.6][k.lvl]:.7));
    K.spot(nH,700,.62,.9,(xx,yy,zz)=>{const w=(2+K.rnd())*s;K.bc(xx,yy,zz-.2,w,w*.8,1.6*s,wall);G.pyr(xx-w/2-.4*s,yy-w*.4-.4*s,zz+1.4*s,w+.8*s,w*.8+.8*s,1.2*s,rf,.2);K.hold(xx,yy,w);},.5*s);
    K.spot(8,700,.55,.92,(xx,yy,zz)=>{G.cyl(xx,yy,zz-.1,.25*s,1.6*s,cuC('#6a4a30'),5,false);cuEll(G,xx,yy,zz+2.2*s,1.4*s,1.4*s,1.1*s,cuC('#f6a6c4'),8,5);K.tops.push([xx-1.4*s,yy-1.4*s,xx+1.4*s,yy+1.4*s,zz+3.2*s]);},1*s);}});

/* ---------- Baterilla — canon : île de South Blue, lieu de naissance de Portgas D. Ace.
   [I] : village côtier blanc et ocre accroché à un promontoire, phare sur la falaise, chapelle, port de pêche, hibiscus. ---------- */
cuReg('Baterilla',{art:{trees:[['palm',12]],town:0},pier:Math.PI*.7,
  relief:cuRelF((x,y,d,b,c)=>{const R=c.R,q=Math.hypot(x-.42*R,y+.4*R);return b+9*r3ss(.4*R,.12*R,q)*r3ss(1,.86,d)+1.8*r3ss(.8,.3,d);}),
  color(x,y,h,sl,def,c){if(sl>.34)return cuMix(cuC('#e8dcc0'),cuC('#cdbb94'),.5+.5*Math.sin(h*4));return null;},
  build(k){const K=cuKit(k),{G,u,R}=K,s=u*1.2;const wh=cuC('#fbf8f2'),oc=cuC('#d9824a'),bl=cuC('#3d64b8'),wd=cuC('#7a5634');
    /* phare rayé sur le promontoire (élément héros) */
    {const x=.5*R,y=-.48*R,z=K.H(x,y);cuLathe(G,x,y,z-.2,[[1.8*s,0],[1.5*s,3*s],[1.3*s,6*s],[1.15*s,9*s]],(j)=>j%2?cuC('#d23a2e'):wh,14);
      G.cyl(x,y,z+9*s,1.5*s,.4*s,cuC('#3a3a3a'),12);K.glow(x,y+1.2*s,z+9.6*s,0,1,.7*s,1*s,cuC('#ffe58a'));cuLathe(G,x,y,z+9.4*s,[[1*s,0],[1*s,1.6*s]],cuC('#ffe58a'),10);G.cone(x,y,z+11*s,1.4*s,1.6*s,cuC('#d23a2e'),12);
      K.tops.push([x-1.8*s,y-1.8*s,x+1.8*s,y+1.8*s,z+12.6*s]);K.hold(x,y,3*s);k.top=Math.max(k.top,z+13*s);}
    /* chapelle blanche à clocher */
    {const x=.12*R,y=-.36*R,z=K.H(x,y);K.bc(x,y,z-.2,3.6*s,5.4*s,3*s,wh);G.pyr(x-2*s,y-2.9*s,z+2.8*s,4*s,5.8*s,1.6*s,oc,.3);K.bc(x,y+2.4*s,z-.2,1.8*s,1.8*s,6*s,wh);G.pyr(x-1*s,y+1.4*s,z+5.8*s,2*s,2*s,1.8*s,bl,.1);cuEll(G,x,y+3.32*s,z+4.6*s,.4*s,.1*s,.4*s,cuC('#e8b830'),8,4);K.hold(x,y,4*s);k.ban(x,y+2.4*s,z+9*s);}
    /* village en terrasses vers le port : maisons blanches, toits ocre, volets bleus ; densité selon le niveau de ville */
    const nH=Math.round(14*(k.city?[.8,1,1.3,1.6][k.lvl]:.7));
    K.spot(nH,1400,.25,.85,(xx,yy,zz)=>{if(yy<-.2*R&&xx>.2*R)return;const w=(1.7+K.rnd()*.9)*s,h=(1.4+K.rnd()*1.2)*s;K.bc(xx,yy,zz-.3,w,w*.85,h,wh);G.pyr(xx-w/2-.2*s,yy-w*.43-.2*s,zz+h-.3,w+.4*s,w*.85+.4*s,.9*s,oc,.15);K.glow(xx,yy+w*.43+.02,zz+.3*s,0,1,.25*s,.8*s,bl);K.hold(xx,yy,w*.8);},.3*s);
    /* port de pêche (ouest) : jetée, barques */
    {const a=Math.PI*.7,px=Math.cos(a)*.86*R,py=Math.sin(a)*.86*R;K.box(px-1*s,py-1*s,-.2,2*s,6*s,.8,wd,cuC('#a07048'));for(let q=0;q<3;q++)cuEll(G,px-3*s-q*2.6*s,py+2*s+q*1.2*s,.15,.8*s,2*s,.45*s,[cuC('#3d64b8'),cuC('#d9824a'),wh][q],10,4);}
    /* hibiscus */
    K.spot(16,900,.2,.92,(xx,yy,zz,i)=>cuEll(G,xx,yy,zz+.4*s,.55*s,.55*s,.45*s,[cuC('#ff5a7a'),cuC('#ffb43a'),cuC('#ff7ab0')][i%3],6,4),.8*s);}});

/* ---------- Briss — les données du jeu donnent seulement « royaume », biome forêt.
   [I] entièrement : plateau central d'où tombe une grande cascade, palais de bois sur pilotis au-dessus des chutes, rivière, ponts de cordes. ---------- */
cuReg('Briss',{art:{trees:[['jungle',18]],town:0},
  relief:cuRelF((x,y,d,b,c)=>{const R=c.R,q=Math.hypot(x+.05*R,y+.2*R),pl=r3ss(.36*R,.26*R,q),riv=r3ss(.07*R,.03*R,cuSegD(x,y,0,.02*R,.08*R,1.2*R));
    return (b+8*pl+.8*fbm2(x*.2,y*.2,11,3)*(1-pl))*(1-riv*(1-pl))+(-.3)*riv*(1-pl);}),
  color(x,y,h,sl,def,c){if(sl>.4)return cuMix(cuC('#5e6a52'),cuC('#7a7c62'),.5+.5*Math.sin(h*4));return null;},
  build(k){const K=cuKit(k),{G,u,R}=K,s=u*1.2;const wd=cuC('#7a5634'),wd2=cuC('#5a3c24'),roof=cuC('#3f6a3a'),gold=cuC('#e8b830'),water=[.62,.86,.96,1],foam=[.95,.98,1,1];
    /* cascade : nappe d'eau du bord du plateau jusqu'à la rivière, bassin d'écume */
    {const x0=.02*R,y0=.04*R,zt=K.H(x0,y0-1*s);for(let q=0;q<6;q++){const f=q/6,f1=(q+1)/6,w=3.2*s;G.quad([x0-w,y0+f*2.4*s,zt-f*8.2],[x0+w,y0+f*2.4*s,zt-f*8.2],[x0+w,y0+f1*2.4*s,zt-f1*8.2],[x0-w,y0+f1*2.4*s,zt-f1*8.2],q%2?water:foam);}
      for(let q=0;q<7;q++)cuEll(G,x0+(q-3)*1*s,y0+3*s,.2,1.2*s,1*s,.7*s,foam,8,4);}
    /* palais sur pilotis au-dessus de la chute */
    {const x=-.05*R,y=-.24*R,z=K.H(x,y);for(const [dx,dy] of [[-4,-3],[4,-3],[-4,3],[4,3],[0,-3],[0,3]])G.cyl(x+dx*s,y+dy*s,z-.2,.3*s,3*s,wd2,6,false);
      K.bc(x,y,z+3*s,10*s,8*s,.5*s,wd);K.bc(x,y,z+3.5*s,7*s,5.4*s,3*s,cuC('#c89a5c'));G.pyr(x-4.6*s,y-3.8*s,z+6.5*s,9.2*s,7.6*s,3*s,roof,.5);
      K.bc(x,y,z+8*s,3.6*s,3*s,2*s,cuC('#c89a5c'));G.pyr(x-2.4*s,y-2.1*s,z+10*s,4.8*s,4.2*s,3.2*s,roof,.3);cuEll(G,x,y,z+13.4*s,.5*s,.5*s,.7*s,gold,8,5);
      for(let q=0;q<4;q++)K.glow(x-2.4*s+q*1.6*s,y+2.72*s,z+4*s,0,1,.45*s,1.4*s,cuC('#ffd27a'));
      k.ban(x+3.6*s,y-2.6*s,z+9.5*s);k.top=Math.max(k.top,z+14*s);K.tops.push([x-5*s,y-4*s,x+5*s,y+4*s,z+13*s]);K.hold(x,y,7*s);}
    /* cabanes sur pilotis dans la jungle, reliées par des ponts de cordes */
    const pts=[];const nH=Math.round(6*(k.city?[.8,1,1.3,1.6][k.lvl]:.7));
    K.spot(nH,900,.45,.85,(x,y,zz)=>{for(const [dx,dy] of [[-1,-1],[1,-1],[-1,1],[1,1]])G.cyl(x+dx*1.1*s,y+dy*1.1*s,zz-.2,.14*s,3.4*s,wd2,5,false);G.cyl(x,y,zz+3.2*s,1.9*s,.3*s,wd,10);G.cyl(x,y,zz+3.5*s,1.4*s,1.4*s,cuC('#c89a5c'),10,false);G.cone(x,y,zz+4.9*s,2.1*s,1.8*s,roof,10);pts.push([x,y,zz+3.5*s]);K.tops.push([x-2*s,y-2*s,x+2*s,y+2*s,zz+6.7*s]);K.hold(x,y,2.6*s);},1*s);
    pts.sort((a,b)=>Math.atan2(a[1],a[0])-Math.atan2(b[1],b[0]));for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];if(Math.hypot(a[0]-b[0],a[1]-b[1])<.55*R)cuBridge(G,a,b,.45*s,1*s,cuC('#9a7048'));}
    K.spot(16,900,.1,.92,(x,y,zz)=>K.tree('palm',x,y,zz,(1.5+K.rnd()*.8)*s,cuC('#2f7a34')),1.4*s);
    K.spot(20,900,.1,.92,(x,y,zz,i)=>cuEll(G,x,y,zz+.4*s,.45*s,.45*s,.4*s,[cuC('#e84a8a'),cuC('#f6d24a'),cuC('#f08a3a')][i%3],6,4),.6*s);}});

/* ---------- Torino — canon : le royaume de Torino est le pays des oiseaux géants (où Chopper passe les deux ans).
   [I] : trois arbres colossaux coiffés de nids, œufs, oiseaux géants aux couleurs vives, hameau minuscule au pied des arbres. ---------- */
cuReg('Torino',{art:{trees:[['round',8],['palm',6]],house:'hut',town:0},
  build(k){const K=cuKit(k),{G,u,R}=K,s=u*1.05,bark=cuC('#7a5434'),leaf=cuC('#5aa83c'),nest=cuC('#a0784a'),nest2=cuC('#7a5634');
    const bird=(x,y,z,sc,c1,c2,yaw,fly)=>{const cy=Math.cos(yaw),sy=Math.sin(yaw),R2=(dx,dy)=>[x+dx*cy-dy*sy,y+dx*sy+dy*cy];
      cuEll(G,x,y,z,1.6*sc,1.6*sc,1.4*sc,c1,10,6,yaw);const [hx,hy]=R2(0,2*sc);cuEll(G,hx,hy,z+1.4*sc,.9*sc,.9*sc,.9*sc,c1,8,5);const [bx,by]=R2(0,3.1*sc);G.cone(bx,by,z+1.3*sc,.35*sc,.9*sc,cuC('#f0a020'),6);
      for(const sg of [-1,1]){const [wx,wy]=R2(sg*1.2*sc,0),[tx,ty]=R2(sg*(fly?5.4:2.6)*sc,-.8*sc),[t2x,t2y]=R2(sg*(fly?4:2)*sc,-2.2*sc);G.tri([wx,wy,z+.6*sc],[tx,ty,z+(fly?1.8:.4)*sc],[t2x,t2y,z+(fly?1.2:0)*sc],c2);}
      const [qx,qy]=R2(0,-2.4*sc);G.tri([x,y,z+.3*sc],[qx-.8*sc,qy,z+.9*sc],[qx+.8*sc,qy,z+.9*sc],c2);};
    const trees=[[-.32,-.22,19],[.34,-.28,16],[.05,.3,14]];
    for(const [px,py,h] of trees){const x=px*R,y=py*R,z=K.H(x,y);
      cuLathe(G,x,y,z-.3,[[3.4*s,0],[2.2*s,2*s],[1.8*s,h*.6*s],[2.2*s,h*s]],bark,12);
      for(let q=0;q<6;q++){const a=q/6*6.2832+px*3,zz=z+h*.85*s;cuTube(G,cuCR([[x,y,zz],[x+Math.cos(a)*3.4*s,y+Math.sin(a)*3.4*s,zz+1.2*s],[x+Math.cos(a)*6*s,y+Math.sin(a)*6*s,zz+1.4*s]],3),t=>(1-.6*t)*.7*s,bark,6,true);cuEll(G,x+Math.cos(a)*6*s,y+Math.sin(a)*6*s,zz+2*s,3.4*s,3.4*s,2*s,leaf,10,6);}
      const nz=z+(h+1)*s;cuLathe(G,x,y,nz,[[2.4*s,0],[4.4*s,1.4*s],[4.8*s,2.4*s],[4.2*s,2.6*s],[2.6*s,1.2*s]],(j)=>j%2?nest2:nest,16);
      for(let q=0;q<10;q++){const a=q*.63;cuTube(G,[[x+Math.cos(a)*4.4*s,y+Math.sin(a)*4.4*s,nz+2.2*s],[x+Math.cos(a+.5)*5.2*s,y+Math.sin(a+.5)*5.2*s,nz+2.6*s]],.18*s,nest2,4,true);}
      for(let q=0;q<3;q++){const a=q*2.1+px;cuEll(G,x+Math.cos(a)*1.6*s,y+Math.sin(a)*1.6*s,nz+2.6*s,.9*s,.9*s,1.2*s,q%2?cuC('#e8f0f8'):cuC('#bfe0f0'),8,6);}
      K.tops.push([x-6*s,y-6*s,x+6*s,y+6*s,nz+3*s]);K.hold(x,y,7*s);k.top=Math.max(k.top,nz+5*s);}
    bird(trees[0][0]*R+1.5*s,trees[0][1]*R,K.H(trees[0][0]*R,trees[0][1]*R)+(trees[0][2]+4.6)*s,1.5*s,cuC('#e84a3a'),cuC('#f6c24a'),.4,false);
    bird(trees[1][0]*R,trees[1][1]*R+1*s,K.H(trees[1][0]*R,trees[1][1]*R)+(trees[1][2]+4.4)*s,1.3*s,cuC('#3a8ae8'),cuC('#f6f6f6'),-.6,false);
    bird(.0,-.05*R,30*s,1.6*s,cuC('#f6f2e6'),cuC('#e8a030'),.9,true);bird(-.45*R,.3*R,24*s,1.2*s,cuC('#7ac84a'),cuC('#3a6a2a'),-1.2,true);
    k.ban(trees[2][0]*R,trees[2][1]*R,K.H(trees[2][0]*R,trees[2][1]*R)+(trees[2][2]+4)*s);
    /* hameau minuscule au pied des arbres (échelle volontairement réduite : les oiseaux dominent) */
    const nH=Math.round(9*(k.city?[.8,1,1.3,1.6][k.lvl]:.7));
    K.spot(nH,900,.35,.9,(x,y,zz)=>{G.cyl(x,y,zz-.1,.8*s,.8*s,cuC('#e8d8b0'),8,false);G.cone(x,y,zz+.7*s,1*s,1*s,cuC('#c8a050'),8);K.hold(x,y,1.2*s);},.4*s);}});

/* ---------- Long Ring Long Land — canon : terre en long anneau découpé en îlots que la mer sépare ; plaines d'herbe ; lieu du Davy Back Fight.
   [I] : arbres très hauts et fins, campement de tentes, piste de course ovale, animaux aux longues pattes (génériques). ---------- */
cuReg('Long Ring Long Land',{art:{trees:[],town:0},pier:Math.PI/2,
  relief:cuRelF((x,y,d,b,c)=>{const R=c.R,r=Math.hypot(x,y),a=Math.atan2(y,x),rr=.62*R,w=.24*R*(1+.18*Math.sin(a*3+1)),ring=r3ss(w,w*.62,Math.abs(r-rr));
    const gaps=[.6,1.85,3.05,4.35,5.5];let g=0;for(const ga of gaps){let da=Math.abs(a+Math.PI-ga);da=Math.min(da,6.2832-da);g=Math.max(g,r3ss(.12,.05,da*r/R));}
    const land=ring*(1-g);return -1+land*(2.6+.6*fbm2(x*.15,y*.15,5,2))*r3ss(1,.9,d);}),
  color(x,y,h,sl,def,c){if(h<.5&&h>-.6)return cuC('#e6d29a');return cuMix(cuC('#8cc85a'),cuC('#a8d468'),.5+.5*Math.sin(x*.3)*Math.cos(y*.25));},
  build(k){const K=cuKit(k),{G,u,R}=K,s=u*1.1;const wd=cuC('#7a5634');
    /* arbres très hauts et fins (silhouette « étirée ») */
    K.spot(22,1600,.3,.95,(x,y,zz)=>{const h=(9+K.rnd()*6)*s;G.cyl(x,y,zz-.1,.22*s,h,cuC('#8a6a44'),5,false);cuEll(G,x,y,zz+h,1.2*s,1.2*s,2.6*s,cuC(K.rnd()<.5?'#4f9a3c':'#6ab04a'),8,6);K.tops.push([x-1.2*s,y-1.2*s,x+1.2*s,y+1.2*s,zz+h+2.6*s]);},1.6*s);
    /* piste de course ovale sur le plus grand îlot, tribune et fanions */
    {const a=-1.2,cx=Math.cos(a)*.62*R,cy=Math.sin(a)*.62*R,z=K.H(cx,cy);if(z>.4){for(let q=0;q<28;q++){const t0=q/28*6.2832,t1=(q+1)/28*6.2832,P=(t,r)=>[cx+Math.cos(t)*r*1.5,cy+Math.sin(t)*r*.8,K.H(cx+Math.cos(t)*r*1.5,cy+Math.sin(t)*r*.8)+.08];
        G.quad(P(t0,4*s),P(t1,4*s),P(t1,5*s),P(t0,5*s),cuC('#c89a5c'),[0,0,1]);}
      K.bc(cx,cy-5.8*s,z,7*s,1.6*s,1.6*s,cuC('#d8c8a8'));G.pyr(cx-3.8*s,cy-6.8*s,z+1.6*s,7.6*s,2*s,1*s,cuC('#c8352e'),.2);
      for(let q=0;q<6;q++){const t=q/6*6.2832;const fx=cx+Math.cos(t)*6*s*1.4,fy=cy+Math.sin(t)*6*s*.8,fz=K.H(fx,fy);G.cyl(fx,fy,fz,.08*s,2.6*s,wd,4,false);G.tri([fx,fy,fz+2.6*s],[fx+1.2*s,fy,fz+2.2*s],[fx,fy,fz+1.8*s],q%2?cuC('#e84a3a'):cuC('#f6c24a'));}
      k.ban(cx,cy-5.8*s,z+3.6*s);K.hold(cx,cy,7*s);}}
    /* campement : tentes rayées */
    const nT=Math.round(6*(k.city?[.8,1,1.3,1.6][k.lvl]:.7));
    K.spot(nT,1200,.4,.9,(x,y,zz,i)=>{G.cone(x,y,zz-.1,1.6*s,2.2*s,i%2?cuC('#f2ecd8'):cuC('#e8b860'),8);G.cyl(x,y,zz+2*s,.05*s,.8*s,wd,4,false);K.hold(x,y,2*s);},.6*s);
    /* animaux aux longues pattes (génériques) */
    K.spot(5,900,.4,.9,(x,y,zz,i)=>{const c=i%2?cuC('#e8d8b8'):cuC('#b88a5a');for(const [dx,dy] of [[-.4,-.7],[.4,-.7],[-.4,.7],[.4,.7]])G.cyl(x+dx*s,y+dy*s,zz,.1*s,3.2*s,c,4,false);cuEll(G,x,y,zz+3.6*s,.7*s,1.3*s,.6*s,c,8,5);cuTube(G,[[x,y+1.1*s,zz+3.8*s],[x,y+1.6*s,zz+6.4*s]],.18*s,c,5,true);cuEll(G,x,y+1.9*s,zz+6.6*s,.3*s,.6*s,.3*s,c,6,4);},2*s);
    k.top=Math.max(k.top,16*s);}});
