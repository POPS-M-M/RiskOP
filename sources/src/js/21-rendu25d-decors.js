/* ================= Rendu 2.5D : éléments de décor dessinés (bâtiments, arbres, monuments) =================
   Dessin vectoriel en « espace de base » (1 unité = 1 px à K=6), vue 3/4 : dessus, façade sud, flanc est.
   G : {cx (contexte 2D), rnd(), flag(x,y), smoke(x,y,s), glow(x,y,r,col)} ; (x,y) = point au sol, en bas au centre. */
const LMK={
  box(g,x,y,w,d,h,top,front,side){const c=g.cx;c.fillStyle=front;c.fillRect(x,y+d-h,w,h);c.fillStyle=top;c.fillRect(x,y-h,w,d);
    if(side){c.fillStyle=side;c.beginPath();c.moveTo(x+w,y-h);c.lineTo(x+w+d*.22,y-h+d*.18);c.lineTo(x+w+d*.22,y+d*.18);c.lineTo(x+w,y+d);c.closePath();c.fill();}},
  shadow(g,x,y,w,d,h){const c=g.cx;c.fillStyle='rgba(20,20,30,.26)';c.beginPath();c.moveTo(x+w,y+d);c.lineTo(x+w+h*.75,y+d+h*.2);c.lineTo(x+w+h*.75,y+h*.2);c.lineTo(x+w,y);c.closePath();c.fill();c.fillRect(x,y+d,w+h*.75,h*.2);},
  ell(g,x,y,rx,ry,col){const c=g.cx;c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,6.283);c.fill();},
  cyl(g,x,y,w,h,c1,c2,c3){const c=g.cx,gr=c.createLinearGradient(x-w/2,0,x+w/2,0);gr.addColorStop(0,c1);gr.addColorStop(.55,c2);gr.addColorStop(1,c3);
    c.fillStyle='rgba(20,20,30,.25)';c.beginPath();c.ellipse(x+w*.7,y+1,w*.8,w*.22,0,0,6.283);c.fill();
    c.fillStyle=gr;c.fillRect(x-w/2,y-h,w,h);c.beginPath();c.ellipse(x,y,w/2,w*.18,0,0,Math.PI);c.fill();c.fillStyle=c1;c.beginPath();c.ellipse(x,y-h,w/2,w*.18,0,0,6.283);c.fill();},
  cone(g,x,y,w,h,col,dark){const c=g.cx,gr=c.createLinearGradient(x-w/2,0,x+w/2,0);gr.addColorStop(0,col);gr.addColorStop(1,dark);c.fillStyle=gr;c.beginPath();c.moveTo(x-w/2-1,y);c.lineTo(x,y-h);c.lineTo(x+w/2+1,y);c.closePath();c.fill();},
  windows(g,x,y,w,h,n,col){const c=g.cx;c.fillStyle=col;const sp=w/(n+1);for(let i=1;i<=n;i++)c.fillRect(x+sp*i-1.2,y,2.4,h);}
};
/* ---------- petits éléments : maisons et arbres ---------- */
const HOUSE={
  flat(g,x,y,w,d,h,v){LMK.shadow(g,x,y,w,d,h);LMK.box(g,x,y,w,d,h,'rgb('+(244-v)+','+(232-v)+','+(206-v)+')','rgb('+(200-v)+','+(172-v)+','+(132-v)+')','rgb('+(176-v)+','+(146-v)+','+(110-v)+')');
    const c=g.cx;c.fillStyle='rgba(70,44,26,.85)';c.fillRect(x+w*.42,y+d-h*.62,w*.18,h*.62);c.fillStyle='rgba(255,255,255,.35)';c.fillRect(x,y-h,w,1.4);},
  gable(g,x,y,w,d,h,v,roof){const c=g.cx;LMK.shadow(g,x,y,w,d,h+6);LMK.box(g,x,y,w,d,h,'#e9e0cf','rgb('+(226-v)+','+(214-v)+','+(192-v)+')','rgb('+(196-v)+','+(184-v)+','+(160-v)+')');
    const r=roof||'#b5533c';c.fillStyle=r;c.beginPath();c.moveTo(x-1.5,y+d-h);c.lineTo(x+w/2,y+d-h-8);c.lineTo(x+w+1.5,y+d-h);c.closePath();c.fill();
    c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.moveTo(x+w/2,y+d-h-8);c.lineTo(x+w+1.5,y+d-h);c.lineTo(x+w+1.5,y-h+2);c.lineTo(x+w/2,y-h-6);c.closePath();c.fill();
    c.fillStyle=r;c.fillRect(x-1.5,y-h-1,w+3,d-h+h*0+1>0?2:2);
    c.fillStyle='rgba(60,40,30,.85)';c.fillRect(x+w*.4,y+d-h*.6,w*.2,h*.6);c.fillStyle='rgba(120,180,220,.8)';c.fillRect(x+2,y+d-h*.8,2.4,2.4);c.fillRect(x+w-4.4,y+d-h*.8,2.4,2.4);},
  snowy(g,x,y,w,d,h,v){HOUSE.gable(g,x,y,w,d,h,v,'#f4f8ff');},
  jp(g,x,y,w,d,h,v){const c=g.cx;LMK.shadow(g,x,y,w,d,h+5);LMK.box(g,x,y,w,d,h,'#efe6d4','#e8dcc4','#bfae8f');
    c.fillStyle='#4a3a30';for(let i=0;i<3;i++)c.fillRect(x+i*w/2.6,y+d-h,1.4,h);
    c.fillStyle='#3b3f4a';c.beginPath();c.moveTo(x-4,y+d-h+1);c.quadraticCurveTo(x+w/2,y+d-h-3,x+w+4,y+d-h+1);c.lineTo(x+w,y+d-h-7);c.lineTo(x,y+d-h-7);c.closePath();c.fill();
    c.fillStyle='#565c6a';c.fillRect(x,y-h-7,w,d*0+3);},
  med(g,x,y,w,d,h,v){const c=g.cx;LMK.shadow(g,x,y,w,d,h+3);LMK.box(g,x,y,w,d,h,'#f8f4ea','#efe6d6','#cfc3ae');c.fillStyle='#c8663c';c.fillRect(x-1,y-h-2,w+2,d*.5);c.fillStyle='#a84f2c';c.fillRect(x-1,y-h-2+d*.5,w+2,2);
    c.fillStyle='rgba(50,90,140,.85)';c.fillRect(x+w*.4,y+d-h*.65,w*.2,h*.65);},
  candy(g,x,y,w,d,h,v){const c=g.cx,cols=['#ffb3cf','#b9e8ff','#fff1a8','#c9f2c9','#e2c4ff'],col=cols[Math.floor(g.rnd()*cols.length)];LMK.shadow(g,x,y,w,d,h+5);LMK.box(g,x,y,w,d,h,'#fff6ec',col,'rgba(0,0,0,.12)');
    c.fillStyle='#fffaf3';c.beginPath();c.moveTo(x-1,y-h+d);for(let i=0;i<=6;i++){const xx=x-1+i*(w+2)/6;c.quadraticCurveTo(xx-(w+2)/12,y-h+d+3,xx,y-h+d);}c.lineTo(x+w+1,y-h-1);c.lineTo(x-1,y-h-1);c.closePath();c.fill();
    c.fillStyle='#e05a7a';c.beginPath();c.arc(x+w/2,y-h-2,2,0,6.283);c.fill();},
  stone(g,x,y,w,d,h,v){LMK.shadow(g,x,y,w,d,h);LMK.box(g,x,y,w,d,h,'#cfd0d6','#a5a8b2','#878a96');const c=g.cx;c.fillStyle='rgba(40,50,70,.8)';c.fillRect(x+w*.42,y+d-h*.6,w*.16,h*.6);},
  hut(g,x,y,w,d,h,v){const c=g.cx;LMK.ell(g,x+w/2+3,y+d,w*.6,2.5,'rgba(20,20,10,.25)');c.fillStyle='#9c7a4c';c.fillRect(x+2,y+d-h*.6,w-4,h*.6);c.fillStyle='#d8b56c';c.beginPath();c.moveTo(x-2,y+d-h*.55);c.lineTo(x+w/2,y+d-h-6);c.lineTo(x+w+2,y+d-h*.55);c.closePath();c.fill();c.fillStyle='rgba(0,0,0,.15)';c.beginPath();c.moveTo(x+w/2,y+d-h-6);c.lineTo(x+w+2,y+d-h*.55);c.lineTo(x+w/2,y+d-h*.55);c.closePath();c.fill();},
  future(g,x,y,w,d,h,v){const c=g.cx;LMK.ell(g,x+w/2+3,y+d,w*.6,2.5,'rgba(20,20,40,.25)');const gr=c.createRadialGradient(x+w*.35,y+d-h,1,x+w/2,y+d-h*.4,w*.8);gr.addColorStop(0,'#ffffff');gr.addColorStop(1,'#a9bfd6');c.fillStyle=gr;c.beginPath();c.ellipse(x+w/2,y+d-h*.1,w/2,h,0,Math.PI,0);c.fill();c.fillStyle='#5ff0ff';c.fillRect(x+w*.2,y+d-h*.5,w*.6,1.6);},
  coral(g,x,y,w,d,h,v){const c=g.cx,cols=['#f59a8a','#f7d27a','#9fe0d0','#c9a6f0'],col=cols[Math.floor(g.rnd()*cols.length)];LMK.ell(g,x+w/2+3,y+d,w*.6,2.5,'rgba(20,20,40,.25)');c.fillStyle=col;c.beginPath();c.ellipse(x+w/2,y+d,w/2,h,0,Math.PI,0);c.fill();c.fillStyle='rgba(255,255,255,.4)';c.beginPath();c.ellipse(x+w*.38,y+d-h*.6,w*.14,h*.2,0,0,6.283);c.fill();c.fillStyle='rgba(40,40,80,.7)';c.fillRect(x+w*.44,y+d-h*.45,w*.12,h*.45);},
  junk(g,x,y,w,d,h,v){LMK.shadow(g,x,y,w,d,h);LMK.box(g,x,y,w,d,h,'#8a7f74','#6d6157','#574d45');const c=g.cx;c.fillStyle='#a2683e';c.fillRect(x+1,y-h+1,w*.5,d*.4);c.fillStyle='rgba(255,200,120,.6)';c.fillRect(x+w*.3,y+d-h*.7,2,2);}
};
const TREE={
  palm(g,x,y,s){const c=g.cx,h=26*s,l=(g.rnd()-.5)*10*s;LMK.ell(g,x+h*.5,y+1,h*.45,3*s,'rgba(40,40,10,.25)');const tx=x+l,ty=y-h;
    c.strokeStyle='#7a5530';c.lineWidth=3*s;c.lineCap='round';c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+l*.2,y-h*.6,tx,ty);c.stroke();
    for(let j=0;j<7;j++){const a=-Math.PI/2+(j-3)*.52+(g.rnd()-.5)*.2,len=h*.48,ex=tx+Math.cos(a)*len*1.15,ey=ty+Math.sin(a)*len*.55+len*.32;const lg=c.createLinearGradient(tx,ty,ex,ey);lg.addColorStop(0,'#2f6b25');lg.addColorStop(1,j%2?'#6fae3c':'#4f9130');c.fillStyle=lg;c.beginPath();c.moveTo(tx,ty);c.quadraticCurveTo((tx+ex)/2,ty+Math.sin(a)*len*.55-5*s,ex,ey);c.quadraticCurveTo((tx+ex)/2+2*s,ty+Math.sin(a)*len*.3+2*s,tx,ty+2*s);c.fill();}},
  pine(g,x,y,s,snow){const c=g.cx,h=30*s;LMK.ell(g,x+h*.35,y+1,h*.32,2.6*s,'rgba(20,30,20,.25)');c.fillStyle='#5a3d22';c.fillRect(x-1.2*s,y-5*s,2.4*s,5*s);
    for(let k=0;k<3;k++){const yy=y-4*s-k*8*s,w=(13-k*3.4)*s,gr=c.createLinearGradient(x-w,0,x+w,0);gr.addColorStop(0,'#3f8a4a');gr.addColorStop(1,'#1f4f2c');c.fillStyle=gr;c.beginPath();c.moveTo(x-w,yy);c.lineTo(x,yy-12*s);c.lineTo(x+w,yy);c.closePath();c.fill();
      if(snow){c.fillStyle='#f4f8ff';c.beginPath();c.moveTo(x-w*.55,yy-5.5*s);c.lineTo(x,yy-12*s);c.lineTo(x+w*.55,yy-5.5*s);c.quadraticCurveTo(x,yy-8*s,x-w*.55,yy-5.5*s);c.fill();}}},
  round(g,x,y,s,col){const c=g.cx,h=20*s,r=9*s;LMK.ell(g,x+r,y+1,r*1.1,2.6*s,'rgba(20,30,20,.25)');c.fillStyle='#5a3d22';c.fillRect(x-1.3*s,y-h*.5,2.6*s,h*.5);
    const gr=c.createRadialGradient(x-r*.4,y-h-r*.4,1,x,y-h,r*1.3);const cc=col||['#8fd06a','#3f8a3a'];gr.addColorStop(0,cc[0]);gr.addColorStop(1,cc[1]);c.fillStyle=gr;c.beginPath();c.arc(x,y-h,r,0,6.283);c.arc(x-r*.7,y-h+r*.35,r*.7,0,6.283);c.arc(x+r*.7,y-h+r*.35,r*.7,0,6.283);c.fill();},
  blossom(g,x,y,s){TREE.round(g,x,y,s,['#ffd6e6','#e07aa6']);},
  orange(g,x,y,s){TREE.round(g,x,y,s*.8,['#7ccb5a','#2f7a34']);const c=g.cx;c.fillStyle='#ff9a2e';for(let i=0;i<5;i++){c.beginPath();c.arc(x+(g.rnd()-.5)*12*s,y-16*s+(g.rnd()-.5)*8*s,1.4*s,0,6.283);c.fill();}},
  jungle(g,x,y,s){TREE.round(g,x,y,s*1.15,['#5fae4a','#1f5a2a']);},
  dead(g,x,y,s){const c=g.cx;LMK.ell(g,x+6*s,y+1,8*s,2*s,'rgba(10,10,20,.25)');c.strokeStyle='#3e3530';c.lineCap='round';c.lineWidth=2.6*s;c.beginPath();c.moveTo(x,y);c.lineTo(x+1*s,y-18*s);c.stroke();c.lineWidth=1.4*s;
    for(const [a,l] of [[-2.3,9],[-.8,10],[-1.9,7],[-1.1,8]]){const yy=y-(8+g.rnd()*8)*s;c.beginPath();c.moveTo(x+.6*s,yy);c.lineTo(x+Math.cos(a)*l*s,yy+Math.sin(a)*l*s);c.stroke();}},
  candy(g,x,y,s){const c=g.cx,cols=['#ff6fa8','#7fd8ff','#ffd84f','#8ff0a0'],col=cols[Math.floor(g.rnd()*4)];LMK.ell(g,x+6*s,y+1,7*s,2*s,'rgba(60,20,40,.22)');c.fillStyle='#fff';c.fillRect(x-1*s,y-16*s,2*s,16*s);c.fillStyle=col;c.beginPath();c.arc(x,y-20*s,7*s,0,6.283);c.fill();c.strokeStyle='#fff';c.lineWidth=1.4*s;c.beginPath();c.arc(x,y-20*s,4*s,.3,4.5);c.stroke();},
  cactus(g,x,y,s){const c=g.cx;LMK.ell(g,x+5*s,y+1,6*s,1.8*s,'rgba(60,30,10,.25)');c.strokeStyle='#4f8a3a';c.lineCap='round';c.lineWidth=4*s;c.beginPath();c.moveTo(x,y);c.lineTo(x,y-18*s);c.moveTo(x,y-9*s);c.lineTo(x-5*s,y-9*s);c.lineTo(x-5*s,y-14*s);c.moveTo(x,y-12*s);c.lineTo(x+5*s,y-12*s);c.lineTo(x+5*s,y-16*s);c.stroke();},
  crystal(g,x,y,s){const c=g.cx;LMK.ell(g,x+5*s,y+1,7*s,2*s,'rgba(20,40,80,.2)');for(const [dx,h,w] of [[-4,14,4],[0,22,5],[4,12,4]]){const gr=c.createLinearGradient(x+dx*s-w*s,0,x+dx*s+w*s,0);gr.addColorStop(0,'#e8fbff');gr.addColorStop(1,'#7fc4ee');c.fillStyle=gr;c.beginPath();c.moveTo(x+dx*s-w*s,y);c.lineTo(x+dx*s,y-h*s);c.lineTo(x+dx*s+w*s,y);c.closePath();c.fill();}},
  mangrove(g,x,y,s){const c=g.cx,h=56*s;LMK.ell(g,x+16*s,y+2,22*s,5*s,'rgba(20,30,20,.28)');c.strokeStyle='#6b4a2c';c.lineCap='round';for(let i=-3;i<=3;i++){c.lineWidth=2.4*s;c.beginPath();c.moveTo(x+i*5*s,y);c.quadraticCurveTo(x+i*2*s,y-12*s,x,y-18*s);c.stroke();}
    c.lineWidth=7*s;c.beginPath();c.moveTo(x,y-14*s);c.lineTo(x,y-h);c.stroke();TREE.round(g,x,y-h+20*s,s*2.2,['#7cc95a','#2e6e2e']);}
};
/* ---------- monuments ---------- */
const LM={
  domePalace(g,x,y){/* palais à dôme (Alabasta) */
    const c=g.cx,bx=x-58,by=y-6;LMK.shadow(g,bx,by,116,46,16);LMK.box(g,bx,by,116,46,12,'#ead9b0','#c4a26c','#a98a56');
    c.fillStyle='rgba(120,80,40,.5)';for(let i=0;i<9;i++)c.fillRect(bx+5+i*12.4,by+46-12+3,6,7);
    const mx=x-40,my=by-12+4;LMK.shadow(g,mx,my,80,30,28);LMK.box(g,mx,my,80,30,28,'#f3e6c8','#cdb184','#b0935f');
    c.fillStyle='rgba(90,58,30,.9)';for(let i=0;i<6;i++){const ax=mx+6+i*12.4;c.beginPath();c.moveTo(ax,my+28);c.lineTo(ax,my+15);c.arc(ax+3.5,my+15,3.5,Math.PI,0);c.lineTo(ax+7,my+28);c.closePath();c.fill();}
    c.fillStyle='#a8854e';c.fillRect(mx,my+2,80,2.2);
    const dx0=x,dy0=my-14,gr=c.createRadialGradient(dx0-8,dy0-22,3,dx0,dy0-10,30);gr.addColorStop(0,'#c9fbf2');gr.addColorStop(.45,'#3fb8b0');gr.addColorStop(1,'#14636a');
    c.fillStyle='#e8d6ac';c.fillRect(dx0-20,dy0-6,40,8);c.fillStyle=gr;c.beginPath();c.ellipse(dx0,dy0-6,20,24,0,Math.PI,0);c.fill();
    c.fillStyle='#f2c75c';c.fillRect(dx0-1,dy0-36,2,8);c.beginPath();c.arc(dx0,dy0-37,2.4,0,6.283);c.fill();
    for(const [tx,ty,th] of [[mx-6,my+30,44],[mx+86,my+30,44],[bx+4,by+46,30],[bx+112,by+46,30]]){
      LMK.cyl(g,tx,ty,9,th,'#fff3d6','#dcc28e','#a8874f');
      const dg=c.createRadialGradient(tx-2,ty-th-5,1,tx,ty-th-2,7);dg.addColorStop(0,'#bdf7ee');dg.addColorStop(1,'#1d7d7d');c.fillStyle=dg;c.beginPath();c.ellipse(tx,ty-th-1.5,5,7,0,Math.PI,0);c.fill();
      g.flag(tx,ty-th-9);}
  },
  castleEU(g,x,y,o){const c=g.cx,roof=(o&&o.roof)||'#3d64b8',stone=(o&&o.stone)||['#d9d6d0','#b4b0aa','#8f8b86'];
    LMK.shadow(g,x-36,y-30,72,30,30);LMK.box(g,x-36,y-30,72,30,22,stone[0],stone[1],stone[2]);
    c.fillStyle=stone[0];for(let i=0;i<12;i++)c.fillRect(x-36+i*6.2,y-30-22-3,3.4,3);
    LMK.shadow(g,x-16,y-36,32,20,40);LMK.box(g,x-16,y-36,32,20,40,stone[0],stone[1],stone[2]);
    LMK.windows(g,x-16,y-36+20-30,32,6,3,'rgba(40,40,60,.85)');
    LMK.cone(g,x,y-36+20-40-2,40,22,roof,'#1e2f5a');g.flag(x,y-36+20-40-24);
    for(const [tx,ty,h] of [[x-38,y,40],[x+38,y,40],[x-38,y-30,46],[x+38,y-30,46]]){LMK.cyl(g,tx,ty,13,h,stone[0],stone[1],stone[2]);LMK.cone(g,tx,ty-h,15,15,roof,'#1e2f5a');}
    c.fillStyle='rgba(60,40,30,.9)';c.beginPath();c.moveTo(x-6,y);c.lineTo(x-6,y-12);c.arc(x,y-12,6,Math.PI,0);c.lineTo(x+6,y);c.closePath();c.fill();g.flag(x+38,y-30-46-17);g.flag(x-38,y-30-46-17);},
  castleJP(g,x,y){const c=g.cx;c.fillStyle='#8c8780';c.beginPath();c.moveTo(x-48,y);c.lineTo(x-40,y-18);c.lineTo(x+40,y-18);c.lineTo(x+48,y);c.closePath();c.fill();c.fillStyle='rgba(0,0,0,.18)';for(let i=0;i<6;i++)c.fillRect(x-44+i*16,y-14,12,1.2);
    let w=66,yy=y-18;for(let k=0;k<4;k++){const h=13-k;LMK.box(g,x-w/2,yy-6,w,6,h,'#f4efe4','#eee6d6','#c8bba2');c.fillStyle='#3a3a3a';for(let i=0;i<w/9;i++)c.fillRect(x-w/2+3+i*9,yy-h+1,1.4,h-3);
      c.fillStyle='#2f3542';c.beginPath();c.moveTo(x-w/2-8,yy-h+1);c.quadraticCurveTo(x,yy-h-4,x+w/2+8,yy-h+1);c.lineTo(x+w/2-2,yy-h-8);c.lineTo(x-w/2+2,yy-h-8);c.closePath();c.fill();
      c.fillStyle='#e6c25a';c.fillRect(x-w/2-8,yy-h,3,2);c.fillRect(x+w/2+5,yy-h,3,2);yy-=h+8;w*=.74;}
    c.fillStyle='#e6c25a';c.beginPath();c.moveTo(x-6,yy+2);c.quadraticCurveTo(x,yy-8,x+6,yy+2);c.fill();g.flag(x+12,yy-4);},
  pagoda(g,x,y){let w=26,yy=y;const c=g.cx;LMK.ell(g,x+10,y+2,20,4,'rgba(20,20,20,.25)');for(let k=0;k<4;k++){LMK.box(g,x-w/2,yy-4,w,4,9,'#c0392b','#a93226','#7d2a22');c.fillStyle='#2f3542';c.beginPath();c.moveTo(x-w/2-6,yy-8);c.quadraticCurveTo(x,yy-12,x+w/2+6,yy-8);c.lineTo(x+w/2-1,yy-14);c.lineTo(x-w/2+1,yy-14);c.closePath();c.fill();yy-=14;w*=.82;}c.fillStyle='#e6c25a';c.fillRect(x-.8,yy-10,1.6,10);},
  torii(g,x,y){const c=g.cx;c.fillStyle='#c0392b';c.fillRect(x-12,y-24,3,24);c.fillRect(x+9,y-24,3,24);c.fillRect(x-16,y-26,32,3);c.fillStyle='#222';c.fillRect(x-17,y-29,34,3);c.fillStyle='#c0392b';c.fillRect(x-13,y-20,26,2);},
  cakeCastle(g,x,y){const c=g.cx,cols=[['#ffd1e3','#f59ac0','#d9709c'],['#fff4d6','#f6dca0','#d9b56a'],['#d4f2ff','#9fd9f2','#6fb4d4'],['#ffe0f0','#f7a8cf','#d77aa8']];
    LMK.ell(g,x+20,y+3,60,10,'rgba(80,30,50,.25)');let r=56,yy=y;for(let k=0;k<4;k++){const h=22-k*2,cc=cols[k];LMK.cyl(g,x,yy,r*2,h,cc[0],cc[1],cc[2]);
      c.fillStyle='#fffaf3';c.beginPath();c.moveTo(x-r,yy-h);for(let i=0;i<=10;i++){const xx=x-r+i*r*2/10;c.quadraticCurveTo(xx-r/10,yy-h+5,xx,yy-h);}c.lineTo(x+r,yy-h-2);c.lineTo(x-r,yy-h-2);c.fill();
      c.fillStyle='#e0405a';for(let i=0;i<6;i++){c.beginPath();c.arc(x-r*.8+i*r*.32,yy-h-2,1.8,0,6.283);c.fill();}yy-=h;r*=.72;}
    for(const dx of [-8,0,8]){c.fillStyle='#fff';c.fillRect(x+dx-1,yy-12,2,10);g.glow(x+dx,yy-14,2.5,'#ffd34f');}g.flag(x+r+4,yy-6);},
  fortress(g,x,y,o){const c=g.cx;LMK.shadow(g,x-50,y-40,100,40,16);LMK.box(g,x-50,y-40,100,40,14,'#b7bcc6','#8d939e','#727985');c.fillStyle='#b7bcc6';for(let i=0;i<16;i++)c.fillRect(x-50+i*6.3,y-40-14-3,3.4,3);
    LMK.shadow(g,x-30,y-34,60,24,30);LMK.box(g,x-30,y-34,60,24,30,'#eef1f6','#d5dae3','#aab2c0');c.fillStyle=(o&&o.roof)||'#3c5f9e';c.fillRect(x-31,y-34-30-2,62,6);LMK.windows(g,x-30,y-34+24-26,60,16,6,'rgba(40,60,90,.8)');
    for(const [tx,ty] of [[x-50,y],[x+50,y],[x-50,y-40],[x+50,y-40]]){LMK.cyl(g,tx,ty,14,22,'#c6cad2','#9aa0ab','#757b87');}
    c.fillStyle='#444';for(let i=0;i<4;i++)c.fillRect(x-36+i*22,y-3,6,2.4);g.flag(x-50,y-62);g.flag(x+50,y-62);g.flag(x,y-34-30-12);},
  tower(g,x,y,o){const c=g.cx;LMK.shadow(g,x-40,y-26,80,26,16);LMK.box(g,x-40,y-26,80,26,16,'#e9e2d2','#c9bfa8','#a99e86');
    LMK.shadow(g,x-11,y-18,22,14,90);LMK.box(g,x-11,y-18,22,14,92,'#f2ece0','#d8ccb4','#b4a68c');c.fillStyle='rgba(60,50,40,.8)';for(let i=0;i<7;i++)c.fillRect(x-3,y-18+14-86+i*12,6,6);
    LMK.cone(g,x,y-18+14-92,26,22,'#3a4a6a','#1c2638');g.flag(x,y-18+14-92-24);},
  prison(g,x,y){const c=g.cx;LMK.cyl(g,x,y,74,52,'#6f6a66','#4e4a48','#33302f');c.fillStyle='rgba(0,0,0,.55)';for(let k=0;k<3;k++)for(let i=0;i<7;i++)c.fillRect(x-30+i*10,y-44+k*14,2.4,7);
    LMK.cyl(g,x,y-52,40,26,'#7b7672','#57524f','#3a3634');LMK.cone(g,x,y-78,44,12,'#5a1e1e','#2c0d0d');g.flag(x,y-92);g.glow(x-12,y-30,3,'#ff5030');g.glow(x+14,y-20,3,'#ff5030');},
  eggDome(g,x,y){const c=g.cx;LMK.ell(g,x+16,y+3,50,10,'rgba(20,30,60,.25)');const gr=c.createRadialGradient(x-14,y-60,4,x,y-40,60);gr.addColorStop(0,'#ffffff');gr.addColorStop(.6,'#d8e6f2');gr.addColorStop(1,'#8aa6c4');c.fillStyle=gr;c.beginPath();c.ellipse(x,y-34,34,46,0,0,6.283);c.fill();
    c.strokeStyle='#5ff0ff';c.lineWidth=2;c.beginPath();c.ellipse(x,y-30,34,8,0,0,Math.PI);c.stroke();c.beginPath();c.ellipse(x,y-50,28,6,0,0,Math.PI);c.stroke();g.glow(x,y-30,4,'#5ff0ff');g.glow(x+18,y-44,3,'#ff6fd8');
    for(const dx of [-48,46]){c.fillStyle='#e8eef6';c.fillRect(x+dx-4,y-40,8,40);c.fillStyle='#5ff0ff';c.fillRect(x+dx-4,y-42,8,3);g.glow(x+dx,y-42,3,'#5ff0ff');}},
  bigTree(g,x,y,o){const c=g.cx,s=(o&&o.s)||1,burnt=o&&o.burnt;LMK.ell(g,x+30*s,y+4,50*s,10*s,'rgba(10,20,10,.3)');
    const tg=c.createLinearGradient(x-12*s,0,x+12*s,0);tg.addColorStop(0,burnt?'#4a3c34':'#8a6236');tg.addColorStop(1,burnt?'#211a16':'#4a3018');c.fillStyle=tg;c.beginPath();c.moveTo(x-22*s,y);c.quadraticCurveTo(x-10*s,y-20*s,x-9*s,y-70*s);c.lineTo(x+9*s,y-70*s);c.quadraticCurveTo(x+10*s,y-20*s,x+22*s,y);c.closePath();c.fill();
    if(burnt){c.strokeStyle='#2a2320';c.lineWidth=3*s;for(const [a,l] of [[-2.4,30],[-.7,32],[-2,24],[-1.1,26]]){c.beginPath();c.moveTo(x,y-64*s);c.lineTo(x+Math.cos(a)*l*s,y-64*s+Math.sin(a)*l*s);c.stroke();}g.smoke(x,y-80*s,1);return;}
    const cols=(o&&o.cols)||['#9be070','#2f7a34'];for(const [dx,dy,r] of [[0,-92,34],[-30,-78,24],[30,-78,24],[-16,-110,22],[18,-108,22],[0,-66,22]]){const gr=c.createRadialGradient(x+(dx-10)*s,y+(dy-12)*s,2,x+dx*s,y+dy*s,r*s*1.2);gr.addColorStop(0,cols[0]);gr.addColorStop(1,cols[1]);c.fillStyle=gr;c.beginPath();c.arc(x+dx*s,y+dy*s,r*s,0,6.283);c.fill();}},
  library(g,x,y){const c=g.cx;LMK.cyl(g,x,y,60,20,'#e8dcc0','#c8b48a','#9a8460');const gr=c.createRadialGradient(x-10,y-34,2,x,y-24,30);gr.addColorStop(0,'#fff');gr.addColorStop(1,'#a99c80');c.fillStyle=gr;c.beginPath();c.ellipse(x,y-20,30,18,0,Math.PI,0);c.fill();g.flag(x,y-40);},
  lighthouse(g,x,y){const c=g.cx;LMK.cyl(g,x,y,12,42,'#ffffff','#e2e2e2','#a8a8a8');c.fillStyle='#c0392b';for(let i=0;i<3;i++)c.fillRect(x-6,y-10-i*12,12,5);c.fillStyle='#333';c.fillRect(x-7,y-46,14,4);g.glow(x,y-49,5,'#ffe48a');c.fillStyle='#c0392b';c.beginPath();c.moveTo(x-7,y-50);c.lineTo(x,y-58);c.lineTo(x+7,y-50);c.fill();},
  windmill(g,x,y){const c=g.cx;LMK.ell(g,x+8,y+2,14,3,'rgba(20,20,10,.25)');c.fillStyle='#e8dcc4';c.beginPath();c.moveTo(x-9,y);c.lineTo(x-5,y-30);c.lineTo(x+5,y-30);c.lineTo(x+9,y);c.closePath();c.fill();c.fillStyle='rgba(0,0,0,.15)';c.beginPath();c.moveTo(x+2,y);c.lineTo(x+2,y-30);c.lineTo(x+5,y-30);c.lineTo(x+9,y);c.fill();
    c.fillStyle='#8a4a2c';c.beginPath();c.moveTo(x-7,y-30);c.lineTo(x,y-38);c.lineTo(x+7,y-30);c.fill();g.mill(x,y-30);},
  marblePalace(g,x,y){const c=g.cx;LMK.shadow(g,x-56,y-34,112,34,20);LMK.box(g,x-56,y-34,112,34,16,'#fbfaf6','#e6e2d8','#c8c2b4');
    LMK.box(g,x-36,y-30,72,24,30,'#ffffff','#efece4','#d2ccbe');c.fillStyle='rgba(180,170,150,.6)';for(let i=0;i<9;i++)c.fillRect(x-33+i*8.2,y-30+24-28,2.2,26);
    for(const [dx,r] of [[0,16],[-28,9],[28,9]]){const gr=c.createRadialGradient(x+dx-r*.4,y-62-r*.6,1,x+dx,y-58,r*1.3);gr.addColorStop(0,'#fff6c8');gr.addColorStop(1,'#c99a2e');c.fillStyle=gr;c.beginPath();c.ellipse(x+dx,y-58+(dx?8:0),r,r*1.1,0,Math.PI,0);c.fill();}
    g.flag(x,y-80);g.flag(x-28,y-64);g.flag(x+28,y-64);},
  colosseum(g,x,y){const c=g.cx;LMK.ell(g,x+14,y+3,46,12,'rgba(40,30,20,.25)');c.fillStyle='#c9a77a';c.beginPath();c.ellipse(x,y-6,40,20,0,0,6.283);c.fill();c.fillStyle='#e5cfa8';c.beginPath();c.ellipse(x,y-18,40,20,0,0,6.283);c.fill();
    c.fillStyle='#b8996c';c.beginPath();c.ellipse(x,y-18,30,14,0,0,6.283);c.fill();c.fillStyle='#d8c08c';c.beginPath();c.ellipse(x,y-16,24,10,0,0,6.283);c.fill();
    c.fillStyle='rgba(90,60,30,.75)';for(let i=0;i<12;i++)c.fillRect(x-36+i*6.2,y-8,3,6);g.flag(x-38,y-20);g.flag(x+38,y-20);},
  mansion(g,x,y){const c=g.cx;LMK.shadow(g,x-32,y-26,64,26,34);LMK.box(g,x-32,y-26,64,26,30,'#4a4456','#3a3446','#2a2634');c.fillStyle='#2b2333';c.beginPath();c.moveTo(x-34,y-26+26-30);c.lineTo(x,y-26+26-30-16);c.lineTo(x+34,y-26+26-30);c.fill();
    for(let i=0;i<5;i++){c.fillStyle='#b98cff';c.fillRect(x-26+i*12,y-20,4,6);g.glow(x-24+i*12,y-17,2.2,'#b98cff');}
    for(const dx of [-36,36]){LMK.cyl(g,x+dx,y,12,46,'#5a5266','#433c4e','#2c2734');LMK.cone(g,x+dx,y-46,14,18,'#2b2333','#141018');}g.flag(x+36,y-66);},
  lab(g,x,y){const c=g.cx;LMK.shadow(g,x-30,y-22,60,22,22);LMK.box(g,x-30,y-22,60,22,22,'#f2f4f8','#d4d9e2','#aab2c0');LMK.windows(g,x-30,y-22+22-18,60,8,5,'#5ff0ff');
    const gr=c.createRadialGradient(x-6,y-50,2,x,y-44,18);gr.addColorStop(0,'#fff');gr.addColorStop(1,'#9aa8bc');c.fillStyle=gr;c.beginPath();c.ellipse(x,y-44,16,12,0,Math.PI,0);c.fill();c.fillStyle='#d4d9e2';c.fillRect(x+18,y-60,6,40);g.smoke(x+21,y-62,.8);g.flag(x,y-58);},
  hive(g,x,y){const c=g.cx;LMK.ell(g,x+20,y+3,50,10,'rgba(10,10,10,.3)');const gr=c.createRadialGradient(x-14,y-50,4,x,y-30,56);gr.addColorStop(0,'#8a7a5a');gr.addColorStop(1,'#3a3024');c.fillStyle=gr;c.beginPath();c.moveTo(x-46,y);c.quadraticCurveTo(x-44,y-60,x,y-70);c.quadraticCurveTo(x+44,y-60,x+46,y);c.closePath();c.fill();
    c.fillStyle='#1a140e';for(let k=0;k<4;k++)for(let i=0;i<5-k;i++){c.beginPath();c.ellipse(x-24+k*6+i*12,y-12-k*14,3.2,4.2,0,0,6.283);c.fill();g.glow(x-24+k*6+i*12,y-12-k*14,1.6,'#ffb050');}g.flag(x,y-72);},
  bellTower(g,x,y){const c=g.cx;LMK.shadow(g,x-12,y-14,24,14,44);LMK.box(g,x-12,y-14,24,14,40,'#f0dc8a','#d8b648','#a8862a');c.fillStyle='#2a2010';c.fillRect(x-6,y-14+14-34,12,14);
    const gr=c.createRadialGradient(x-3,y-48,1,x,y-44,10);gr.addColorStop(0,'#fff6c0');gr.addColorStop(1,'#c99a2e');c.fillStyle=gr;c.beginPath();c.moveTo(x-7,y-28);c.quadraticCurveTo(x-7,y-38,x,y-38);c.quadraticCurveTo(x+7,y-38,x+7,y-28);c.closePath();c.fill();LMK.cone(g,x,y-40,30,16,'#e8c45a','#9a7420');g.glow(x,y-32,5,'#ffe48a');g.flag(x,y-58);},
  rocks(g,x,y,o){const c=g.cx,n=(o&&o.n)||3,col=(o&&o.col)||['#e0a66e','#b9784a','#7f4a2a'];for(let i=0;i<n;i++){const sx=x+(i-(n-1)/2)*16,h=18+g.rnd()*16,w=12+g.rnd()*6;LMK.ell(g,sx+10,y+2,12,3,'rgba(30,20,10,.28)');const gr=c.createLinearGradient(sx-w/2,0,sx+w/2,0);gr.addColorStop(0,col[0]);gr.addColorStop(.5,col[1]);gr.addColorStop(1,col[2]);c.fillStyle=gr;c.beginPath();c.moveTo(sx-w/2,y);c.lineTo(sx-w/2+2,y-h);c.quadraticCurveTo(sx,y-h-5,sx+w/2-2,y-h);c.lineTo(sx+w/2,y);c.closePath();c.fill();}},
  shipInn(g,x,y){const c=g.cx;LMK.ell(g,x+6,y+4,46,7,'rgba(0,40,60,.35)');c.fillStyle='#7a4a24';c.beginPath();c.moveTo(x-44,y-8);c.lineTo(x+44,y-8);c.lineTo(x+34,y+4);c.lineTo(x-34,y+4);c.closePath();c.fill();
    LMK.box(g,x-26,y-18,52,10,16,'#f5e8cf','#e2c99c','#b99a68');c.fillStyle='#c0392b';c.fillRect(x-28,y-18-16-3,56,4);LMK.windows(g,x-26,y-18+10-12,52,6,5,'rgba(255,220,140,.9)');g.flag(x+30,y-44);c.strokeStyle='#5a3b1e';c.lineWidth=1.6;c.beginPath();c.moveTo(x+30,y-8);c.lineTo(x+30,y-44);c.stroke();},
  fleet(g,x,y){for(const [dx,dy,s] of [[-30,10,1],[24,-6,.9],[0,24,.8]])LM.ship(g,x+dx,y+dy,s);},
  ship(g,x,y,s){const c=g.cx;s=s||1;LMK.ell(g,x+4*s,y+3*s,22*s,4*s,'rgba(0,40,60,.35)');c.fillStyle='#6b4423';c.beginPath();c.moveTo(x-20*s,y-4*s);c.lineTo(x+20*s,y-4*s);c.lineTo(x+14*s,y+4*s);c.lineTo(x-14*s,y+4*s);c.closePath();c.fill();
    c.strokeStyle='#5a3b1e';c.lineWidth=1.4*s;c.beginPath();c.moveTo(x,y-4*s);c.lineTo(x,y-34*s);c.stroke();c.fillStyle='#f7efe0';c.fillRect(x-10*s,y-32*s,20*s,12*s);c.fillRect(x-8*s,y-18*s,16*s,10*s);g.flag(x,y-36*s);},
  ruins(g,x,y){for(let i=0;i<6;i++){const sx=x-30+i*12+(g.rnd()-.5)*6,h=6+g.rnd()*18;LMK.box(g,sx,y-6+(i%2)*6,8,5,h,'#a9a39a','#8a847b','#6c675f');}LMK.ell(g,x,y+6,36,8,'rgba(30,25,20,.25)');g.smoke(x+6,y-20,.7);},
  temple(g,x,y){const c=g.cx;LMK.shadow(g,x-34,y-26,68,26,26);LMK.box(g,x-34,y-26,68,26,6,'#efe8d8','#d8ccb0','#b8aa8a');c.fillStyle='#f6f0e2';for(let i=0;i<7;i++)c.fillRect(x-31+i*10,y-26+26-6-20,4,20);
    c.fillStyle='#e9dfc8';c.beginPath();c.moveTo(x-38,y-26+26-26);c.lineTo(x,y-26+26-40);c.lineTo(x+38,y-26+26-26);c.closePath();c.fill();c.fillStyle='#c0392b';c.fillRect(x-38,y-26,76,2);g.flag(x,y-42);},
  fountain(g,x,y){LMK.cyl(g,x,y,40,6,'#d8d0c0','#b8ae9a','#8e8572');LMK.cyl(g,x,y-6,14,26,'#e8e0d0','#c4b9a2','#9a8f78');g.fountain(x,y-34);g.flag(x+18,y-12);},
  dojo(g,x,y){LM.castleJP(g,x,y);}
};
