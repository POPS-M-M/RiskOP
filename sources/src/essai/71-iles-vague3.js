/* ================= ÎLES SUR MESURE — vague 3 (version test) : Grand Line et Nouveau Monde ================= */

/* ---------- Karate : dojo au sommet d'un pic, long escalier, poing de pierre (interprétation) ---------- */
cuReg('Karate',{art:{peaks:[],house:'jp'},relief:cuRel([{t:'peak',x:0,y:-.22,h:11,s:.15},{t:'plat',x:0,y:-.22,r:.08,w:.05,h:10.4}]),
  build(k){const K=cuKit(k),{G,u:s,R}=K,wd=cuC('#8a4a2c'),rf=cuC('#2e3a4e');const x=0,y=-.22*R,z=K.H(x,y);
    const top=K.tiers(x,y,z,[[7*s,2.6*s,cuC('#f2e8d4'),rf],[4.6*s,2*s,cuC('#f2e8d4'),rf]],1.4*s,.9*s);K.tops.push([x-4*s,y-4*s,x+4*s,y+4*s,top]);k.ban(x,y,top+1.5*s);k.top=top+2*s;K.hold(x,y,6*s);
    for(let q=0;q<20;q++){const f=q/19,yy=y+4*s+f*.55*R,zz=Math.max(.4,K.H(0,yy));G.box(-1.4*s,yy-.4*s,zz-.3,2.8*s,.8*s,.4,q%2?cuC('#b8b0a0'):cuC('#a8a090'));}
    {const fx=-.4*R,fy=.15*R,fz=K.H(fx,fy);K.bc(fx,fy,fz,3*s,3*s,2*s,cuC('#8a8a84'));cuEll(G,fx,fy,fz+5.5*s,2*s,1.7*s,2.6*s,cuC('#9a968c'),10,6);for(let q=0;q<4;q++)cuEll(G,fx-1.2*s+q*.8*s,fy+1.4*s,fz+7*s,.45*s,.5*s,.6*s,cuC('#9a968c'),6,4);G.cyl(fx,fy,fz+2*s,1.1*s,1.4*s,cuC('#9a968c'),8);K.hold(fx,fy,3*s);}
    for(const sg of [-1,1]){const tx=sg*2.6*s,ty=.5*R,tz=K.H(tx,ty);G.cyl(tx,ty,tz-.1,.3*s,4.6*s,cuC('#c8352e'),8);}G.box(-3.4*s,.5*R-.3*s,K.H(0,.5*R)+4.4*s,6.8*s,.6*s,.5*s,cuC('#c8352e'));}});

/* ---------- Baterilla : village du Sud, falaise, petite chapelle blanche et cimetière marin (interprétation) ---------- */
cuReg('Baterilla',{art:{trees:[['palm',16]]},relief:cuRel([{t:'peak',x:.25,y:-.3,h:7,s:.16}]),
  build(k){const K=cuKit(k),{G,u:s,R}=K;const x=.25*R,y=-.3*R,z=K.H(x,y);K.bc(x,y,z,4*s,6*s,3.6*s,cuC('#fbf8f2'));G.pyr(x-2.2*s,y-3.2*s,z+3.6*s,4.4*s,6.4*s,2*s,cuC('#3d64b8'),.48);K.bc(x,y+2*s,z,2*s,2*s,6.5*s,cuC('#fbf8f2'));G.cone(x,y+2*s,z+6.5*s,1.4*s,2.8*s,cuC('#3d64b8'),4);
    k.ban(x,y+2*s,z+10*s);k.top=z+10*s;K.hold(x,y,5*s);
    for(let q=0;q<8;q++){const xx=x-4*s+(q%4)*2.4*s,yy=y+6*s+Math.floor(q/4)*2*s,zz=K.H(xx,yy);G.box(xx-.1*s,yy,zz-.1,.2*s,.15*s,1.4*s,cuC('#f0ece2'));G.box(xx-.5*s,yy,zz+.9*s,1*s,.15*s,.2*s,cuC('#f0ece2'));}
    K.spot(10,600,.2,.9,(xx,yy,zz,i)=>cuEll(G,xx,yy,zz+.5*s,.6*s,.6*s,.5*s,[cuC('#ff7a9a'),cuC('#ffd24a'),cuC('#f6f6f6')][i%3],6,4),1*s);}});

/* ---------- Briss : jungle épaisse, cabanes sur pilotis reliées par des ponts de cordes (interprétation) ---------- */
cuReg('Briss',{art:{trees:[['jungle',20]],town:3},
  build(k){const K=cuKit(k),{G,u:s,R}=K;const pts=[];
    K.spot(7,800,.15,.75,(x,y,zz)=>{for(const [dx,dy] of [[-1,-1],[1,-1],[-1,1],[1,1]])G.cyl(x+dx*1.2*s,y+dy*1.2*s,zz-.2,.15*s,4.2*s,cuC('#5a3c24'),5,false);G.cyl(x,y,zz+4*s,2*s,.3*s,cuC('#8a5f38'),10);cuLathe(G,x,y,zz+4.3*s,[[1.5*s,0],[1.5*s,1.4*s]],cuC('#c8a070'),10);G.cone(x,y,zz+5.6*s,2.2*s,2.2*s,cuC('#9a8a40'),10);K.tops.push([x-2*s,y-2*s,x+2*s,y+2*s,zz+7.8*s]);pts.push([x,y,zz+4.3*s]);},3.5*s);
    for(let i=0;i<pts.length-1;i++)if(Math.hypot(pts[i][0]-pts[i+1][0],pts[i][1]-pts[i+1][1])<.6*R)cuBridge(G,pts[i],pts[i+1],.5*s,1*s,cuC('#9a7048'));
    if(pts.length){const p=pts[0];k.ban(p[0],p[1],p[2]+4*s);k.top=p[2]+5*s;}
    K.spot(10,700,.1,.9,(x,y,zz)=>K.tree('palm',x,y,zz,(1.6+K.rnd())*s,cuC('#3f8f3a')),1.6*s);}});

/* ---------- Torino : arbres géants coiffés de nids, oiseaux immenses, minuscules huttes (d'après le récit : royaume des grands oiseaux) ---------- */
cuReg('Torino',{art:{trees:[['round',10],['palm',6]],house:'hut'},
  build(k){const K=cuKit(k),{G,u:s,R}=K,bark=cuC('#6a4a30'),leaf=cuC('#4f9a3c');
    for(const [px,py,h] of [[-.25,-.2,13],[.3,-.3,11],[.05,.25,10]]){const x=px*R,y=py*R,t=cuBigTree(K,x,y,s,bark,leaf,h);const nz=t-1.5*s;cuLathe(G,x,y,nz,[[2*s,0],[3*s,1.2*s],[2.6*s,1.6*s]],cuC('#9a7a4a'),12);for(let q=0;q<3;q++)cuEll(G,x+(q-1)*.9*s,y,nz+1.4*s,.6*s,.5*s,.45*s,cuC('#f4ecdc'),6,4);k.top=Math.max(k.top,t+s);}
    /* grands oiseaux posés */
    for(const [px,py,c] of [[.45,.1,'#f0f0f0'],[-.45,.25,'#e8b860']]){const x=px*R,y=py*R,z=K.H(x,y),col=cuC(c);cuEll(G,x,y,z+3.4*s,1.8*s,2.6*s,1.8*s,col,10,6);cuTube(G,[[x,y+1.8*s,z+4*s],[x,y+2.6*s,z+6.4*s]],.6*s,col,6,false);cuEll(G,x,y+2.8*s,z+6.8*s,.9*s,1*s,.8*s,col,8,5);G.cone(x,y+3.7*s,z+6.7*s,.35*s,1.4*s,cuC('#e8a030'),5);
      for(const sg of [-1,1])G.cyl(x+sg*.6*s,y,z,.12*s,2*s,cuC('#e8a030'),4,false);for(const sg of [-1,1])G.tri([x+sg*1.5*s,y-1*s,z+4*s],[x+sg*1.6*s,y+1.6*s,z+4*s],[x+sg*3.6*s,y-2.4*s,z+3*s],col);K.tops.push([x-2*s,y-3*s,x+2*s,y+4*s,z+7*s]);K.hold(x,y,4*s);}
    k.ban(-.25*R,-.2*R,k.top+s);}});

/* ---------- Birka : île céleste en ruines — mer de nuages, temple brisé, colonnes (interprétation) ---------- */
cuReg('Birka',{art:{trees:[['round',8]]},
  build(k){const K=cuKit(k),{G,u:s,R}=K,w=cuC('#f2eee4'),w2=cuC('#d4cdb8');const x=0,y=-.15*R,z=K.H(x,y);
    for(let q=0;q<3;q++)K.bc(x,y,z-.1+q*.5*s,(10-q)*s,(7-q)*s,.5*s,q%2?w:w2);for(let q=0;q<6;q++)for(const sg of [-1,1]){const hh=(q===2||q===4)?2*s:(5+(q%2))*s;G.cyl(x-5*s+q*2*s,y+sg*2.8*s,z+1.5*s,.4*s,hh,w,8);}
    K.bc(x-2.5*s,y-3*s,z+7*s,5*s,1*s,.6*s,w2);K.tops.push([x-5*s,y-3.5*s,x+5*s,y+3.5*s,z+7.5*s]);k.ban(x,y,z+9*s);k.top=z+9*s;K.hold(x,y,7*s);
    for(let q=0;q<9;q++){const a=q/9*6.2832+.2,r=K.rc(a)*(.8+(q%3)*.12),cx=Math.cos(a)*r,cy=Math.sin(a)*r;cuCloud(K,cx,cy,1.2+(q%2)*1.4,1.1*s,cuC(q%2?'#ffffff':'#eef4ff'));}
    cuRuins(K,0,0,.7*R,10,w2,w);}});

/* ---------- Kamabakka : royaume extravagant — palais rose à cœurs, scène de cabaret, jardins fleuris ---------- */
cuReg('Kamabakka',{art:{trees:[['round',10]]},
  build(k){const K=cuKit(k),{G,u:s,R}=K,pk=cuC('#ff6fae'),pk2=cuC('#ffc4dc'),gold=cuC('#f0c050');
    const top=cuCastle(K,k,0,-.18*R,s,{W:10,D:7,th:7,kh:10,roof:pk,w:cuC('#ffe4f0'),w2:pk2,cone:3});
    const heart=(x,y,z,r,c)=>{cuEll(G,x-.5*r,y,z+.3*r,.6*r,.35*r,.6*r,c,8,5);cuEll(G,x+.5*r,y,z+.3*r,.6*r,.35*r,.6*r,c,8,5);G.cone(x,y,z-.9*r,.98*r,1.1*r,c,8);};
    heart(0,-.18*R,top+2*s,1.8*s,cuC('#ff3a7a'));k.ban(0,-.18*R,top+4.5*s);k.top=top+5*s;
    {const sx=.35*R,sy=.2*R,sz=K.H(sx,sy);K.bc(sx,sy,sz,8*s,4*s,1.2*s,cuC('#8a3a6a'));K.bc(sx,sy-1.8*s,sz+1.2*s,8*s,.4*s,5*s,cuC('#c83a7a'));for(const sg of [-1,1])G.cyl(sx+sg*4*s,sy-1.6*s,sz,.4*s,6.4*s,gold,8);
     for(let q=0;q<6;q++)G.ico(sx-3.4*s+q*1.36*s,sy+2*s,sz+1.4*s,.25*s,1,cuC('#ffe8a0'),null,0);K.hold(sx,sy,5*s);}
    K.spot(12,700,.2,.9,(x,y,zz,i)=>heart(x,y,zz+1.6*s,.6*s,[pk,cuC('#ff3a7a'),pk2][i%3]),1*s);}});

/* ---------- Whisky Peak : ville-accueil, montagnes en forme de cactus géants hérissées de croix ---------- */
cuReg('Whisky Peak',{art:{b:'med',trees:[['palm',4]]},
  build(k){const K=cuKit(k),{G,u:s,R}=K,rk=[cuC('#c89a62'),cuC('#b4824e'),cuC('#d8b07a')];
    for(const [px,py,h] of [[-.4,-.35,20],[0,-.5,24],[.4,-.32,18],[-.55,.05,13],[.55,.0,14]]){const x=px*R,y=py*R,z=K.H(x,y),r=2.8*s,c=rk[(h|0)%3];
      cuLathe(G,x,y,z-.4,[[r*1.2,0],[r,1*s],[r*.95,h*s],[r*.6,(h+1.6)*s],[.1,(h+2.2)*s]],c,12);
      for(const sg of [-1,1]){const ay=z+h*.45*s+sg*1.4*s;cuTube(G,cuCR([[x,y,ay],[x+sg*r*1.6,y,ay+.4*s],[x+sg*r*2.1,y,ay+3*s],[x+sg*r*2.1,y,ay+6*s]],3),r*.48,c,10,true);}
      for(let q=0;q<10;q++){const a=q*2.3,zz=z+(2+q*1.7)*s;if(zz>z+h*s)break;const cx=x+Math.cos(a)*r,cy=y+Math.sin(a)*r;G.box(cx-.06*s,cy,zz,.12*s,.08*s,.9*s,cuC('#f4ece0'));G.box(cx-.3*s,cy,zz+.55*s,.6*s,.08*s,.12*s,cuC('#f4ece0'));}
      K.tops.push([x-r*2.2,y-r,x+r*2.2,y+r,z+(h+2)*s]);K.hold(x,y,r*2.4);k.top=Math.max(k.top,(h+3)*s);}
    k.ban(0,-.5*R,K.H(0,-.5*R)+27*s);
    K.spot(8,500,.1,.6,(x,y,zz)=>{if(y<-.1*R)return;for(let q=0;q<4;q++)G.ico(x+q*.6*s,y,zz+2.4*s,.18*s,1,cuC(q%2?'#ffd27a':'#ff8a5a'),null,0);G.cyl(x,y,zz-.1,.05*s,2.4*s,cuC('#3a2a1c'),4,false);G.cyl(x+1.8*s,y,zz-.1,.05*s,2.4*s,cuC('#3a2a1c'),4,false);},2*s);}});

/* ---------- Jaya : ville pirate de Mock Town, façade de maison seule, ruines dorées dans la jungle ---------- */
cuReg('Jaya',{art:{trees:[['jungle',14]],house:'gable',roof:['#8a5a3c','#6a4a3a']},
  build(k){const K=cuKit(k),{G,u:s,R}=K,gold=cuC('#e8b830'),st=cuC('#c8b88a');
    /* façade de château plantée seule sur la plage (élément du récit) */
    {const fx=.4*R,fy=.3*R,fz=K.H(fx,fy);G.box(fx-5*s,fy,fz-.2,10*s,.6*s,6*s,cuC('#e8dcc0'));for(const sg of [-1,1]){G.box(fx+sg*4.4*s-.8*s,fy-.3*s,fz-.2,1.6*s,1.2*s,8*s,cuC('#e8dcc0'));G.cone(fx+sg*4.4*s,fy+.3*s,fz+7.8*s,1.2*s,2*s,cuC('#b5533c'),8);}
     G.pyr(fx-5*s,fy-.2*s,fz+5.8*s,10*s,1*s,2.6*s,cuC('#b5533c'),.0);for(const dx of [-2,0,2])G.box(fx+dx*s-.5*s,fy+.61*s,fz+2.4*s,1*s,.05*s,1.6*s,cuC('#34425c'));G.box(fx-3*s,fy-3*s,fz-.2,6*s,2.4*s,2*s,cuC('#9a7a5a'));K.tops.push([fx-5*s,fy-1*s,fx+5*s,fy+1*s,fz+8*s]);K.hold(fx,fy,6*s);}
    /* ruines dorées dans la jungle : pyramide à degrés, cloche d'or */
    {const rx=-.2*R,ry=-.3*R,rz=K.H(rx,ry);for(let q=0;q<4;q++)K.bc(rx,ry,rz-.2+q*1.6*s,(9-q*2)*s,(9-q*2)*s,1.6*s,q%2?st:cuC('#b8a878'));cuLathe(G,rx,ry,rz+6.4*s,[[.4*s,0],[1.2*s,.4*s],[1.6*s,2.4*s],[2*s,3*s]],gold,12);G.cyl(rx,ry,rz+9.4*s,.4*s,.6*s,gold,6);
     k.ban(rx,ry,rz+11*s);k.top=rz+11*s;K.hold(rx,ry,7*s);}
    cuRuins(K,-.2*R,-.2*R,.35*R,10,st,gold);}});

/* ---------- Skypiea : île céleste — tige de haricot géante en spirale, cloche d'or au sommet, nuages ---------- */
cuReg('Skypiea',{art:{trees:[['round',10]]},
  build(k){const K=cuKit(k),{G,u:s,R}=K,gr=cuC('#5aa83a'),gr2=cuC('#4a9030'),gold=cuC('#f0c040');const x=-.1*R,y=-.15*R,z=K.H(x,y);
    const pts=[];for(let q=0;q<=28;q++){const f=q/28,a=f*9;pts.push([x+Math.cos(a)*(2.6-f*1.4)*s,y+Math.sin(a)*(2.6-f*1.4)*s,z+f*24*s]);}cuTube(G,pts,t=>(1.2-.6*t)*s,(t)=>t*28%2<1?gr:gr2,8,true);
    for(let q=0;q<7;q++){const p=pts[3+q*3],a=q*1.9;cuEll(G,p[0]+Math.cos(a)*1.6*s,p[1]+Math.sin(a)*1.6*s,p[2],1.2*s,.6*s,.15*s,gr,8,4,a);}
    const tz=z+24*s;cuCloud(K,x,y,tz,1.6*s,cuC('#ffffff'));cuLathe(G,x,y,tz+3*s,[[.4*s,0],[1.4*s,.5*s],[1.9*s,3*s],[2.4*s,3.6*s]],gold,12);G.cyl(x,y,tz+6.5*s,.5*s,.8*s,gold,6);
    K.tops.push([x-3*s,y-3*s,x+3*s,y+3*s,tz+7*s]);k.ban(x,y,tz+8*s);k.top=tz+8*s;K.hold(x,y,5*s);
    for(let q=0;q<7;q++){const a=q/7*6.2832+.4,r=K.rc(a)*(.85+(q%2)*.15);cuCloud(K,Math.cos(a)*r,Math.sin(a)*r,1+(q%3),1*s,cuC(q%2?'#ffffff':'#f0f6ff'));}
    cuRuins(K,.3*R,.0,.25*R,8,cuC('#e8dcc0'),gold);}});

/* ---------- Long Ring Long Land : îlot des choses étirées — arbres démesurément hauts, animaux au long cou, arche de roche (interprétation) ---------- */
cuReg('Long Ring Long Land',{art:{trees:[['round',4]]},
  build(k){const K=cuKit(k),{G,u:s,R}=K;
    K.spot(8,700,.15,.85,(x,y,zz)=>{const h=(10+K.rnd()*5)*s;G.cyl(x,y,zz-.1,.25*s,h,cuC('#7a5634'),6,false);cuEll(G,x,y,zz+h,2*s,2*s,.9*s,cuC('#6aaa4a'),8,5);K.tops.push([x-2*s,y-2*s,x+2*s,y+2*s,zz+h+s]);},3*s);
    for(const [px,py] of [[-.3,.2],[.3,.25]]){const x=px*R,y=py*R,z=K.H(x,y),c=cuC('#e8c070');cuEll(G,x,y,z+3.4*s,1.2*s,2.2*s,1*s,c,8,5);for(const [dx,dy] of [[-.6,-1.4],[.6,-1.4],[-.6,1.4],[.6,1.4]])G.cyl(x+dx*s,y+dy*s,z,.15*s,3*s,c,4,false);cuTube(G,[[x,y+1.8*s,z+3.8*s],[x,y+2.6*s,z+12*s]],.3*s,c,6,false);cuEll(G,x,y+3*s,z+12.2*s,.4*s,.8*s,.4*s,c,6,4);K.tops.push([x-s,y-2*s,x+s,y+3*s,z+12*s]);K.hold(x,y,3*s);}
    {const ax=0,ay=-.35*R,az=K.H(ax,ay),pts=[];for(let q=0;q<=12;q++){const a=q/12*Math.PI;pts.push([ax+Math.cos(a)*7*s,ay,az+Math.sin(a)*9*s]);}cuTube(G,pts,1.3*s,cuC('#b8a888'),8,true);K.tops.push([ax-8*s,ay-1.5*s,ax+8*s,ay+1.5*s,az+10*s]);k.ban(ax,ay,az+11*s);k.top=az+11*s;K.hold(ax,ay,8*s);}}});

/* ---------- Impel Down : prison-forteresse — tour cylindrique massive, meurtrières, porte colossale, rochers acérés ---------- */
cuReg('Impel Down',{art:{trees:[]},
  build(k){const K=cuKit(k),{G,u:s,R}=K,st=cuC('#5a5a62'),st2=cuC('#46464e'),dk=cuC('#1a1a20');const x=0,y=-.1*R,z=K.H(x,y);
    cuLathe(G,x,y,z-.4,[[11*s,0],[10*s,3*s],[9*s,10*s],[9.6*s,11*s],[9.6*s,12*s],[6*s,12.4*s],[5.4*s,15*s]],(j)=>j%2?st2:st,20);w3Crenel(k,x-6.8*s,y-6.8*s,x+6.8*s,y+6.8*s,z+11.8*s,s,st2);
    for(let r=0;r<3;r++)for(let q=0;q<14;q++){const a=q/14*6.2832+r*.2,rr=(10.3-r*.4)*s;K.glow(x+Math.cos(a)*rr,y+Math.sin(a)*rr,z+(2+r*3)*s,Math.cos(a),Math.sin(a),.18*s,1.4*s,dk);}
    {const a=k.aP,c=Math.cos(a),sn=Math.sin(a),gx=x+c*10.2*s,gy=y+sn*10.2*s;G.quad([gx-sn*2.6*s,gy+c*2.6*s,z],[gx+sn*2.6*s,gy-c*2.6*s,z],[gx+sn*2.6*s,gy-c*2.6*s,z+7*s],[gx-sn*2.6*s,gy+c*2.6*s,z+7*s],dk);G.quad([gx-sn*2.9*s,gy+c*2.9*s,z+7*s],[gx+sn*2.9*s,gy-c*2.9*s,z+7*s],[gx+sn*2.9*s,gy-c*2.9*s,z+7.8*s],[gx-sn*2.9*s,gy+c*2.9*s,z+7.8*s],cuC('#8a2a2a'));}
    K.tops.push([x-10*s,y-10*s,x+10*s,y+10*s,z+15*s]);k.ban(x,y,z+17*s);k.top=z+17*s;K.hold(x,y,13*s);
    K.spot(12,600,.6,.95,(xx,yy,zz)=>{G.cone(xx,yy,zz-.4,(1+K.rnd())*s,(3+K.rnd()*4)*s,st2,5);},1*s);}});

/* ---------- Amazon Lily : palais des guerrières, colonnes à têtes de serpent, arène, pics de jungle ---------- */
cuReg('Amazon Lily',{art:{trees:[['jungle',14]]},
  build(k){const K=cuKit(k),{G,u:s,R}=K,w=cuC('#f4ecd8'),w2=cuC('#dccfae'),pu=cuC('#8a4aa8'),gr=cuC('#3a8a5a');
    const top=cuCastle(K,k,-.05*R,-.22*R,s,{W:11,D:7,th:7,kh:9,roof:pu,w,w2,cone:3});k.ban(-.05*R,-.22*R,top+s);k.top=top+2*s;
    /* colonnes-serpents gardant l'allée */
    for(let q=0;q<4;q++)for(const sg of [-1,1]){const x=-.05*R+sg*4*s,y=-.22*R+7*s+q*3.4*s,z=K.H(x,y);const pts=[];for(let t=0;t<=10;t++){const f=t/10;pts.push([x+Math.sin(f*9)*.6*s,y+Math.cos(f*9)*.6*s,z+f*6*s]);}cuTube(G,pts,.45*s,gr,6,false);cuEll(G,x,y+.6*s,z+6.4*s,.7*s,1.2*s,.5*s,gr,8,5);G.cone(x,y+1.6*s,z+6.3*s,.2*s,.6*s,cuC('#e8b830'),4);K.hold(x,y,1.2*s);}
    /* arène circulaire */
    {const ax=.4*R,ay=.2*R,az=K.H(ax,ay);cuLathe(G,ax,ay,az-.2,[[6*s,0],[6*s,2.4*s],[5.2*s,2.4*s],[4*s,.4*s]],w2,20);K.tops.push([ax-6*s,ay-6*s,ax+6*s,ay+6*s,az+2.4*s]);K.hold(ax,ay,7*s);}}});

/* ---------- Punk Hazard : moitié brasier, moitié glacier — laboratoire en dôme sur la ligne de partage ---------- */
cuReg('Punk Hazard',{art:{trees:[]},
  build(k){const K=cuKit(k),{G,u:s,R}=K;
    K.spot(12,800,.1,.9,(x,y,zz,i)=>{if(x<0)return;for(let q=0;q<3;q++){const a=q*2.1+i;G.cone(x+Math.cos(a)*.8*s,y+Math.sin(a)*.8*s,zz-.2,(.6+q*.2)*s,(2.6+((i+q)%4)*1.6)*s,[cuC('#bfe6f6'),cuC('#a6d8f0'),cuC('#e8f8ff')][q],5);}K.tops.push([x-s,y-s,x+s,y+s,zz+7*s]);},1.6*s);
    K.spot(12,800,.1,.9,(x,y,zz,i)=>{if(x>0)return;G.cone(x,y,zz-.1,.9*s,(2+(i%3))*s,cuC('#ff7a2a'),6);G.cone(x,y,zz+.4*s,.5*s,(2.6+(i%3))*s,cuC('#ffd04a'),5);cuEll(G,x,y,zz+(5+(i%3))*s,(1+(i%2)*.4)*s,(1+(i%2)*.4)*s,.8*s,cuC('#5a4a48'),6,4);},1.4*s);
    const x=0,y=-.05*R,z=K.H(x,y);G.cyl(x,y,z-.1,6*s,2*s,cuC('#d8dce2'),20);G.dome(x,y,z+1.9*s,5.4*s,.7,cuC('#eef2f6'),20);for(let q=0;q<8;q++)K.glow(x+Math.cos(q*.785)*6.02*s,y+Math.sin(q*.785)*6.02*s,z+.5*s,Math.cos(q*.785),Math.sin(q*.785),.5*s,1*s,cuC('#7ad8ff'));
    G.cyl(x+3*s,y-2*s,z+4*s,.6*s,6*s,cuC('#9aa0a8'),8);for(let q=0;q<3;q++)cuEll(G,x+3*s+q*.6*s,y-2*s,z+11*s+q*1.6*s,(.8+q*.3)*s,(.8+q*.3)*s,.6*s,cuC('#b8a4d8'),6,4);
    K.tops.push([x-6*s,y-6*s,x+6*s,y+6*s,z+6*s]);k.ban(x,y,z+8*s);k.top=z+15*s;K.hold(x,y,8*s);}});

/* ---------- Dressrosa : Colisée de la Corrida, palais royal sur le plateau, champs de tournesols ---------- */
cuReg('Dressrosa',{art:{trees:[['round',4],['palm',6]]},relief:cuRel([{t:'plat',x:.3,y:-.35,r:.16,w:.1,h:7}]),
  build(k){const K=cuKit(k),{G,u:s,R}=K,st=cuC('#e8d0a0'),st2=cuC('#c8a878'),rf=cuC('#c84a3a');
    /* Colisée : deux étages d'arcades, gradins, arène */
    {const x=-.25*R,y=0,z=K.H(x,y),r=8*s;cuLathe(G,x,y,z-.2,[[r,0],[r,6*s],[r-.6*s,6.6*s],[r-1.6*s,6.6*s],[r-4.6*s,1*s]],(j)=>j<1?st:st2,28);
     for(let q=0;q<28;q++){const a=q/28*6.2832;for(const zz of [1,3.6])K.glow(x+Math.cos(a)*r*1.002,y+Math.sin(a)*r*1.002,z+zz*s,Math.cos(a),Math.sin(a),.45*s,1.8*s,cuC('#6a4a30'));}
     G.cyl(x,y,z+.9*s,r-4.6*s,.1,cuC('#e8c890'),20);K.tops.push([x-r,y-r,x+r,y+r,z+6.6*s]);K.hold(x,y,r+1*s);k.top=Math.max(k.top,8*s);}
    /* palais royal sur le plateau */
    {const x=.3*R,y=-.35*R,z=K.H(x,y);K.bc(x,y,z,9*s,5*s,4*s,cuC('#f6ecd6'));G.pyr(x-4.7*s,y-2.7*s,z+4*s,9.4*s,5.4*s,2*s,rf,.3);for(const sg of [-1,1]){cuLathe(G,x+sg*4.5*s,y,z,[[1.2*s,0],[1*s,7*s]],cuC('#f6ecd6'),10);G.dome(x+sg*4.5*s,y,z+7*s,1.2*s,1.3,cuC('#3f9f9a'),10);}
     K.tops.push([x-5*s,y-2.5*s,x+5*s,y+2.5*s,z+9*s]);k.ban(x,y,z+8*s);k.top=Math.max(k.top,z+9*s);K.hold(x,y,6*s);}
    K.spot(30,900,.3,.9,(x,y,zz)=>{if(y<.15*k.R)return;G.cyl(x,y,zz-.1,.06*s,1.6*s,cuC('#4a8a3a'),4,false);cuEll(G,x,y,zz+1.7*s,.45*s,.15*s,.45*s,cuC('#ffc828'),6,3);},.5*s);}});

/* ---------- Baltigo : terre blanche et désolée — quartier général révolutionnaire en tours blanches, ossements de roche ---------- */
cuReg('Baltigo',{art:{trees:[['dead',6]]},
  color(x,y,h,sl,def,c){if(sl>.3)return cuMix(cuC('#c8c4bc'),cuC('#e0dcd4'),.5+.5*Math.sin(h*4));return cuMix(cuC('#f0eee8'),cuC('#e2ded4'),fbm2(x*.15,y*.15,c.S0,2));},
  build(k){const K=cuKit(k),{G,u:s,R}=K,w=cuC('#f4f2ee'),w2=cuC('#d8d4cc'),dk=cuC('#3a3a40');const x=0,y=-.15*R,z=K.H(x,y);
    for(const [dx,dy,h] of [[0,0,16],[-5,2,11],[5,2,12],[-2.5,-4,9],[2.6,-4,10]]){cuLathe(G,x+dx*s,y+dy*s,z-.2,[[2.2*s,0],[1.8*s,h*s],[2.2*s,(h+.5)*s]],w,8);G.cone(x+dx*s,y+dy*s,z+(h+.5)*s,2*s,1.6*s,w2,8);K.tops.push([x+dx*s-2*s,y+dy*s-2*s,x+dx*s+2*s,y+dy*s+2*s,z+(h+2)*s]);}
    for(const [a,b] of [[[0,0],[-5,2]],[[0,0],[5,2]],[[0,0],[-2.5,-4]],[[0,0],[2.6,-4]]])cuTube(G,[[x+a[0]*s,y+a[1]*s,z+7*s],[x+b[0]*s,y+b[1]*s,z+6*s]],.35*s,w2,6,false);
    k.ban(x,y,z+19*s);k.top=z+19*s;K.hold(x,y,9*s);
    K.spot(10,600,.2,.9,(xx,yy,zz)=>{cuTube(G,cuCR([[xx,yy,zz-.2],[xx+1*s,yy,zz+2.4*s],[xx+2.4*s,yy,zz+3*s]],3),t=>(1-.7*t)*.5*s,cuC('#e8e4dc'),6,true);},2*s);}});

/* ---------- Egghead : île du futur — grand œuf-laboratoire perché, anneaux en lévitation, tours lumineuses ---------- */
cuReg('Egghead',{art:{trees:[['round',8]],house:'future'},
  build(k){const K=cuKit(k),{G,u:s,R}=K,wh=cuC('#f6f8fa'),cy2=cuC('#7ad8f0'),pk=cuC('#ff8ac0');const x=0,y=-.12*R,z=K.H(x,y);
    cuLathe(G,x,y,z-.2,[[5*s,0],[3*s,2*s],[1.6*s,4*s],[1.4*s,12*s],[2.2*s,13*s]],(j)=>j%2?cuC('#d8e0e8'):wh,16);
    cuEll(G,x,y,z+19*s,5*s,5*s,7*s,(j)=>j===4?cy2:wh,16,10);for(let q=0;q<10;q++){const a=q/10*6.2832;K.glow(x+Math.cos(a)*4.9*s,y+Math.sin(a)*4.9*s,z+18*s,Math.cos(a),Math.sin(a),.4*s,1.6*s,cy2);}
    for(const [zz,r] of [[8,6],[25,3.6]]){const pts=[];for(let q=0;q<=32;q++){const a=q/32*6.2832;pts.push([x+Math.cos(a)*r*s,y+Math.sin(a)*r*s,z+zz*s]);}cuTube(G,pts,.25*s,zz>20?pk:cy2,5,false);}
    K.tops.push([x-5*s,y-5*s,x+5*s,y+5*s,z+26*s]);k.ban(x,y,z+28*s);k.top=z+28*s;K.hold(x,y,7*s);
    K.spot(7,600,.25,.85,(xx,yy,zz,i)=>{const h=(4+K.rnd()*5)*s;cuLathe(G,xx,yy,zz-.1,[[1*s,0],[.7*s,h],[1.2*s,h+.6*s]],wh,8);G.dome(xx,yy,zz+h+.6*s,1.2*s,.6,[cy2,pk][i%2],8);K.tops.push([xx-s,yy-s,xx+s,yy+s,zz+h+1.4*s]);},2.4*s);}});

/* ---------- Laugh Tale : île des origines — portique de pierre monumental, ruines anciennes, lueur dorée (interprétation entière, rien de canonique) ---------- */
cuReg('Laugh Tale',{art:{trees:[['palm',10]]},
  build(k){const K=cuKit(k),{G,u:s,R}=K,st=cuC('#b8ac94'),st2=cuC('#9a8e78'),gold=cuC('#ffd24a');const x=0,y=-.25*R,z=K.H(x,y);
    for(const sg of [-1,1]){K.bc(x+sg*5*s,y,z-.3,2.4*s,2.4*s,14*s,st);K.bc(x+sg*5*s,y,z+13.6*s,3*s,3*s,.6*s,st2);}K.bc(x,y,z+14.2*s,13*s,3*s,2*s,st);K.bc(x,y,z+16.2*s,9*s,2.4*s,1*s,st2);
    G.quad([x-3.7*s,y,z],[x+3.7*s,y,z],[x+3.7*s,y,z+13.6*s],[x-3.7*s,y,z+13.6*s],cuC('#fff0b0'));
    K.tops.push([x-6.5*s,y-1.5*s,x+6.5*s,y+1.5*s,z+17*s]);k.ban(x,y,z+18.4*s);k.top=z+19*s;K.hold(x,y,8*s);
    cuRuins(K,0,.05*R,.6*R,18,st,st2);K.spot(10,600,.1,.8,(xx,yy,zz)=>cuEll(G,xx,yy,zz+.4*s,.25*s,.25*s,.25*s,gold,5,3),.3*s);}});

/* ---------- Reverse Mountain : montagne rouge gigantesque, courants d'eau qui gravissent ses flancs, phare au pied ---------- */
cuReg('Reverse Mountain',{art:{peaks:[],trees:[]},relief:cuRel([{t:'peak',x:0,y:-.1,h:26,s:.22}]),
  color(x,y,h,sl,def,c){const a=Math.atan2(y+.1*c.R,x);for(let q=0;q<4;q++){let da=Math.abs(a-(q*1.5708+.785));da=Math.min(da,6.2832-da);if(da<.09&&h>1)return cuMix(cuC('#3aa8d8'),cuC('#8ad8f0'),.5+.5*Math.sin(h*2));}if(h>1)return cuMix(cuC('#a84a2e'),cuC('#c86040'),.5+.5*Math.sin(h*1.6));return null;},
  build(k){const K=cuKit(k),{G,u:s,R}=K;const lx=-.2*R,ly=.55*R,lz=K.H(lx,ly);W3LM.lighthouse({G,x:lx,y:ly,z:lz,s:1.2*s,o:{},tops:K.tops,top:0,ban:()=>{}});K.hold(lx,ly,3*s);
    const pz=K.H(0,-.1*R);k.ban(0,-.1*R,pz+2*s);k.top=pz+4*s;
    for(let q=0;q<10;q++)cuEll(G,(q-5)*.8*s,-.1*R,pz+2*s+q*.3*s,(1.4-q*.08)*s,(1.4-q*.08)*s,.6*s,cuC('#e8f6fc'),6,4);}});
