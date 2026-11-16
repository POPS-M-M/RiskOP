/* ================= ÎLES SUR MESURE — vague 1 (version test) : lieux iconiques =================
   Même mécanisme que 68 (W3CU). Les maisons, arbres et jardins par défaut (niveaux de ville) restent générés autour du décor ;
   chaque entrée retire le monument générique (lm:null) et pose le sien. Éléments d'interprétation : voir le rapport d'audit. */
const cuC=h=>r3c(h);
/* relief additionnel : liste de bosses / plateaux / creux (positions et tailles en fraction du rayon de l'île) ; la côte reste à 0 */
function cuRel(list){return (H0,c)=>{const {rc,R}=c;return (x,y)=>{const r=Math.hypot(x,y),d=r/rc(Math.atan2(y,x));let h=H0(x,y);if(d>=1)return h;const edge=r3ss(.97,.72,d);
  for(const f of list){const dx=x-f.x*R,dy=y-f.y*R,q=Math.hypot(dx,dy);
    if(f.t==='peak')h+=f.h*Math.exp(-(q*q)/(2*f.s*R*f.s*R))*edge;
    else if(f.t==='plat'){const k=r3ss((f.r+f.w)*R,f.r*R,q)*edge;h=h*(1-k)+f.h*k;}
    else if(f.t==='dip')h-=f.h*Math.exp(-(q*q)/(2*f.s*R*f.s*R))*edge;
    else if(f.t==='line'){const dd=Math.abs(f.ax==='x'?x-f.v*R:y-f.v*R),k=r3ss((f.w*1.5)*R,f.w*R,dd)*edge;h=h*(1-k)+f.h*k;}}
  return Math.max(h,d<.97?.2:h);};};}
/* petite boîte à outils pour un constructeur d'île */
function cuKit(k){const {G,tops,occ,H,rc,R,u,rnd}=k;const o={G,H,u,R,rnd,rc,tops,occ,
  box(x,y,z,w,d,h,c,t){G.box(x,y,z,w,d,h,c,t);tops.push([x,y,x+w,y+d,z+h]);},
  bc(x,y,z,w,d,h,c,t){o.box(x-w/2,y-d/2,z,w,d,h,c,t);},
  cyl(x,y,z,r,h,c,n){G.cyl(x,y,z,r,h,c,n||12);tops.push([x-r,y-r,x+r,y+r,z+h]);},
  spot(n,tries,a,b,f,m){let c=0;for(let q=0;q<tries&&c<n;q++){const th=rnd()*6.2832,d=(a+rnd()*(b-a))*rc(th),x=Math.cos(th)*d,y=Math.sin(th)*d,z=H(x,y);if(z<.5)continue;if(occ.some(e=>Math.hypot(x-e[0],y-e[1])<e[2]+(m||0)))continue;f(x,y,z,c);c++;}return c;},
  hold(x,y,r){occ.push([x,y,r]);},
  tree(t,x,y,z,s,col){W3T[t](G,x,y,z,s,col,rnd,tops);},
  /* pagode / étages en retrait : tableau [largeur, hauteur, couleur mur, couleur toit] */
  tiers(x,y,z,list,roofH,eave){let zz=z;for(const [w,h,cw,cr] of list){o.bc(x,y,zz,w,w,h,cw);G.pyr(x-w/2-(eave||.5),y-w/2-(eave||.5),zz+h,w+(eave||.5)*2,w+(eave||.5)*2,roofH||h*.5,cr,.18);zz+=h+(roofH||h*.5)*.55;}return zz;},
  /* ligne de lueur sur une face (quad) */
  glow(x,y,z,dx,dy,w,h,c){G.quad([x-dy*w,y+dx*w,z],[x+dy*w,y-dx*w,z],[x+dy*w,y-dx*w,z+h],[x-dy*w,y+dx*w,z+h],c);}
};return o;}
const cuReg=(name,spec)=>{W3CU[name]=Object.assign({},spec,{art:Object.assign({lm:null,ex:[]},spec.art||{})});};
const cuStripe=(x,y,s,a,b)=>((Math.floor(x/s)+Math.floor(y/s))&1)?a:b;

/* ---------- Sphinx : sphinx monumental sur plateau de grès (interprétation d'après le nom de l'île) ---------- */
cuReg('Île de Sphinx',{art:{b:'med',peaks:[]},
  relief:cuRel([{t:'plat',x:0,y:-.04,r:.34,w:.2,h:3.2},{t:'peak',x:-.55,y:-.35,h:3,s:.1},{t:'peak',x:.55,y:-.3,h:2.4,s:.09}]),
  color(x,y,h,sl,def,c){const d=Math.hypot(x,y)/c.rc(Math.atan2(y,x));if(sl>.25)return cuMix(cuC('#b4783e'),cuC('#d69a58'),.5+.5*Math.sin(h*6));if(h>2.9)return cuMix(cuC('#e8cc8e'),cuC('#dcbc7c'),cuStripe(x,y,2.2*c.u,0,1));return null;},
  build(k){const K=cuKit(k),{G}=K,s=K.u*1.4,cx=0,cy=-.04*k.R,z=K.H(cx,cy),sa=cuC('#e0bb78'),sb=cuC('#c79a56'),gold=cuC('#e8b830'),blue=cuC('#2e5aa8');
    /* corps de lion couché (long axe y), pattes avant tendues vers le sud, haut du dos arrondi */
    cuEll(G,cx,cy-.5*s,z+2.2*s,3.4*s,7.2*s,2.5*s,sa,14,8);cuEll(G,cx,cy-4.6*s,z+2.4*s,3.7*s,3.2*s,2.7*s,sb,12,7);cuEll(G,cx,cy+3.2*s,z+2.4*s,2.7*s,2.8*s,2.3*s,sa,12,7);
    for(const sg of [-1,1]){K.bc(cx+sg*1.5*s,cy+8*s,z,1.5*s,6*s,1.3*s,sa);cuEll(G,cx+sg*1.5*s,cy+11*s,z+.6*s,.9*s,1.3*s,.7*s,sb,8,5);}
    cuEll(G,cx,cy-8*s,z+1.6*s,.5*s,1.8*s,.4*s,sb,6,4);                                                    /* queue */
    /* cou, tête, coiffe nemes à rayures, nez, yeux, barbe, uræus */
    cuLathe(G,cx,cy+5.2*s,z+3.2*s,[[2.1*s,0],[1.8*s,2.6*s],[1.6*s,3.4*s]],sa,10);
    cuEll(G,cx,cy+5.8*s,z+7.2*s,1.9*s,1.7*s,2.3*s,sa,12,8);cuEll(G,cx,cy+5.4*s,z+7.8*s,2.5*s,2.2*s,2.4*s,(j)=>j%2?blue:gold,12,8);
    for(const sg of [-1,1]){for(let q=0;q<6;q++)G.quad([cx+sg*2*s,cy+5.2*s,z+9.2*s-q*.8*s],[cx+sg*3.9*s,cy+5.2*s,z+8.6*s-q*.8*s],[cx+sg*3.9*s,cy+5.2*s,z+8.1*s-q*.8*s],[cx+sg*2*s,cy+5.2*s,z+8.6*s-q*.8*s],q%2?blue:gold);}
    cuEll(G,cx,cy+7.4*s,z+6.9*s,.35*s,.5*s,.7*s,sb,6,4);for(const sg of [-1,1])cuEll(G,cx+sg*.7*s,cy+7.25*s,z+7.5*s,.3*s,.2*s,.18*s,cuC('#2a2018'),6,4);
    G.cone(cx,cy+7.3*s,z+5.5*s,.5*s,1.8*s,gold,5);cuEll(G,cx,cy+7.4*s,z+9.9*s,.35*s,.35*s,.5*s,gold,6,4);
    K.tops.push([cx-4*s,cy-8*s,cx+4*s,cy+12*s,z+9.5*s]);k.top=z+10*s;k.ban(cx,cy-1*s,z+5.2*s);
    /* escalier d'accès, obélisques, petites pyramides à l'arrière */
    for(let q=0;q<4;q++)K.bc(cx,cy+13.5*s+q*1.4*s,z-.1,(7-q*.5)*s,1.4*s,(.5+.3*(3-q))*s,sb);
    for(const sg of [-1,1]){const ox=cx+sg*8*s,oy=cy+10*s,oz=K.H(ox,oy);G.pyr(ox-.7*s,oy-.7*s,oz,1.4*s,1.4*s,7*s,sa,.35);G.cone(ox,oy,oz+7*s,.5*s,.9*s,gold,4);K.tops.push([ox-.8*s,oy-.8*s,ox+.8*s,oy+.8*s,oz+7*s]);}
    for(const [px,py,w] of [[-.48,-.33,9],[.5,-.28,7]]){const x=px*k.R,y=py*k.R,zz=K.H(x,y);G.pyr(x-w*s/2,y-w*s/2,zz,w*s,w*s,w*.85*s,sa,.0);K.tops.push([x-w*s/2,y-w*s/2,x+w*s/2,y+w*s/2,zz+w*.8*s]);K.hold(x,y,w*s*.8);}
    K.hold(cx,cy+3*s,13*s);
    K.spot(8,500,.15,.85,(x,y,zz)=>{const r=(.6+K.rnd()*.8)*s;G.ico(x,y,zz+r*.4,r,.8,cuC('#c79a56'),K.rnd,.4);},1.5*s);
    K.spot(6,400,.3,.9,(x,y,zz)=>K.tree('cactus',x,y,zz,(1+K.rnd()*.6)*s,cuC('#5fa04a')),1.5*s);}});

/* ---------- Little Garden : jungle préhistorique géante, volcans fumants, grand reptile à long cou, côtes de géant ---------- */
cuReg('Little Garden',{art:{b:'jungle',peaks:[],trees:[['jungle',14]]},
  relief:cuRel([{t:'peak',x:-.3,y:-.3,h:19,s:.15},{t:'dip',x:-.3,y:-.3,h:3.4,s:.045},{t:'peak',x:.38,y:-.12,h:13,s:.12},{t:'dip',x:.38,y:-.12,h:2.4,s:.04},{t:'dip',x:.0,y:.28,h:1.4,s:.12}]),
  color(x,y,h,sl,def,c){const R=c.R,d1=Math.hypot(x+.3*R,y+.3*R),d2=Math.hypot(x-.38*R,y+.12*R);if(h>7&&d1<.08*R)return cuMix(cuC('#e0603a'),cuC('#40302c'),r3ss(.02*R,.08*R,d1));if(d1<.2*R||d2<.17*R)return cuMix(cuC('#4a403c'),cuC('#5a4a3c'),fbm2(x*.3,y*.3,c.S0,2));if(sl>.3)return cuMix(cuC('#5a5648'),cuC('#7a7458'),.5+.5*Math.sin(h*5));return null;},
  build(k){const K=cuKit(k),{G,u:s,R}=K,gr=[cuC('#2f7a34'),cuC('#3f8f3a'),cuC('#4aa044'),cuC('#287030')];
    /* fumée des deux volcans */
    for(const [px,py,top] of [[-.3,-.3,19],[.38,-.12,13]]){for(let q=0;q<5;q++)cuEll(G,px*R+q*.6*s,py*R-q*.4*s,top*s*.82+q*1.6*s,(1.2+q*.4)*s,(1.2+q*.4)*s,(.9+q*.2)*s,cuMix(cuC('#6a6666'),cuC('#b4b0b0'),q/5),8,5);}
    /* arbres géants (échelle ×3), fougères arborescentes, champignons géants */
    K.spot(9,900,.2,.85,(x,y,zz)=>{const q=(2.6+K.rnd()*1.3)*s;K.tree('round',x,y,zz,q,gr[(K.rnd()*4)|0]);K.hold(x,y,1.8*q);},3*s);
    K.spot(10,700,.15,.88,(x,y,zz)=>{const q=(1.3+K.rnd())*s,tk=cuC('#6a4a2c');cuTube(G,[[x,y,zz],[x+.1*q,y,zz+1.4*q],[x,y+.1*q,zz+2.6*q]],.16*q,tk,6,true);for(let f=0;f<7;f++){const a=f/7*6.2832;cuTube(G,[[x,y,zz+2.6*q],[x+Math.cos(a)*1.4*q,y+Math.sin(a)*1.4*q,zz+3.2*q],[x+Math.cos(a)*2.4*q,y+Math.sin(a)*2.4*q,zz+2.2*q]],.07*q,gr[f%4],4,false);}K.tops.push([x-2*q,y-2*q,x+2*q,y+2*q,zz+3.4*q]);},2.5*s);
    K.spot(7,600,.15,.85,(x,y,zz)=>{const q=(.9+K.rnd()*.8)*s;G.cyl(x,y,zz-.1,.35*q,2*q,cuC('#efe6d4'),8);cuEll(G,x,y,zz+2*q,1.5*q,1.5*q,.9*q,cuC('#d8453a'),10,5);for(let t=0;t<4;t++){const a=t*1.6;cuEll(G,x+Math.cos(a)*.9*q,y+Math.sin(a)*.9*q,zz+2.5*q,.25*q,.25*q,.12*q,cuC('#fff4e0'),5,3);}K.tops.push([x-1.5*q,y-1.5*q,x+1.5*q,y+1.5*q,zz+3*q]);},2*s);
    /* grand reptile herbivore à long cou, au bord d'une clairière (interprétation) */
    {const s=1.6*K.u,bx=.05*R,by=.22*R,z=K.H(bx,by),sk=cuC('#c09a62'),sk2=cuC('#9a7646');cuEll(G,bx,by,z+4.2*s,2.2*s,4.6*s,2.1*s,sk,12,7);
     for(const [dx,dy] of [[-1.3,-2.6],[1.3,-2.6],[-1.3,2.2],[1.3,2.2]])G.cyl(bx+dx*s,by+dy*s,z-.1,.6*s,3.6*s,sk2,8);
     cuTube(G,cuCR([[bx,by+3.8*s,z+5*s],[bx+.4*s,by+6*s,z+8*s],[bx,by+7.4*s,z+11.5*s],[bx-.3*s,by+8.2*s,z+13*s]],4),t=>(1-.6*t)*.8*s,sk,8,true);cuEll(G,bx-.3*s,by+8.9*s,z+13.4*s,.8*s,1.2*s,.6*s,sk,8,5);
     cuTube(G,cuCR([[bx,by-4.4*s,z+3.8*s],[bx-.5*s,by-7*s,z+3*s],[bx+.8*s,by-10*s,z+1.5*s]],4),t=>(1-.85*t)*.8*s,sk2,7,true);K.tops.push([bx-3*s,by-6*s,bx+3*s,by+5*s,z+9*s]);k.top=Math.max(k.top,z+14*s);K.hold(bx,by,6*s);}
    /* côtes d'un animal gigantesque */
    {const rx=.38*R,ry=.34*R,z=K.H(rx,ry);for(let q=0;q<6;q++){const y=ry+q*1.7*s;for(const sg of [-1,1])cuTube(G,cuCR([[rx+sg*.3*s,y,z],[rx+sg*2.6*s,y,z+3.2*s],[rx+sg*.2*s,y,z+5.4*s]],4),.2*s,cuC('#ece4d0'),5,true);}
     cuTube(G,[[rx,ry-1*s,z+4.8*s],[rx,ry+11*s,z+5*s]],.28*s,cuC('#ece4d0'),6,true);cuEll(G,rx,ry-3.4*s,z+1.6*s,1.8*s,2.4*s,1.5*s,cuC('#ece4d0'),10,6);K.hold(rx,ry+4*s,7*s);}
    k.top=Math.max(k.top,15*s);}});

/* ---------- Drum : montagne enneigée, château au sommet, escalier en lacets, cerisier en fleurs ---------- */
cuReg('Île de Drum',{art:{b:'snow',peaks:[],trees:[['pine',16]]},
  relief:cuRel([{t:'peak',x:0,y:-.1,h:15,s:.19},{t:'peak',x:-.42,y:-.05,h:6,s:.12},{t:'peak',x:.4,y:-.1,h:7,s:.12},{t:'plat',x:0,y:-.1,r:.06,w:.05,h:14.4}]),
  color(x,y,h,sl,def,c){if(sl>.34)return cuMix(cuC('#6f7a8a'),cuC('#98a2b2'),.5+.5*Math.sin(h*4));if(h>14)return cuC('#f4f8fc');return null;},
  build(k){const K=cuKit(k),{G,u:s,R}=K,cx=0,cy=-.1*R,z=K.H(cx,cy),w1=cuC('#f4f6fa'),w2=cuC('#d2d8e2'),roof=cuC('#3d64b8'),pink=cuC('#f2a6c8');
    /* château : mur d'enceinte, salle centrale, grande tour et quatre tourelles */
    K.bc(cx,cy,z-.5*s,9*s,7*s,2.4*s,w2);for(const [dx,dy] of [[-4.5,-3.5],[4.5,-3.5],[-4.5,3.5],[4.5,3.5]]){cuLathe(G,cx+dx*s,cy+dy*s,z-.5*s,[[1.2*s,0],[1.05*s,5*s]],w1,10);G.cone(cx+dx*s,cy+dy*s,z+4.5*s,1.5*s,2.4*s,roof,10);K.tops.push([cx+dx*s-1.2*s,cy+dy*s-1.2*s,cx+dx*s+1.2*s,cy+dy*s+1.2*s,z+7*s]);}
    K.bc(cx,cy,z+1.9*s,5.4*s,4.4*s,3.2*s,w1);G.pyr(cx-3*s,cy-2.5*s,z+5.1*s,6*s,5*s,2.4*s,roof,.2);cuLathe(G,cx,cy,z+5*s,[[1.6*s,0],[1.4*s,5.4*s]],w1,12);G.cone(cx,cy,z+10.4*s,2*s,3.6*s,roof,12);
    for(let q=0;q<5;q++)K.glow(cx-2*s+q*1*s,cy+2.21*s,z+2.6*s,0,1,.3*s,1.2*s,cuC('#ffd27a'));
    k.ban(cx,cy,z+14.4*s);k.top=z+15*s;K.hold(cx,cy,8*s);
    /* escalier en lacets du pied de la montagne jusqu'au château */
    {let px=0,py=.42*R;const pts=[[px,py]];for(let q=1;q<=10;q++){const f=q/10;pts.push([(q%2?-1:1)*(.22*R)*(1-f*.8),py+(cy+4*s-py)*f]);}
     for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],n=8;for(let q=0;q<n;q++){const f=q/n,x=a[0]+(b[0]-a[0])*f,y=a[1]+(b[1]-a[1])*f,zz=K.H(x,y);G.box(x-.7*s,y-.35*s,zz-.1,1.4*s,.7*s,.22*s,cuC('#cfd6e2'));}K.hold(a[0],a[1],1.6*s);}}
    /* cerisier en fleurs, détail propre à Drum */
    for(const [dx,dy,r] of [[-5.5,5,1.2],[-7,6.5,1],[-4.2,6.8,.9]]){const x=cx+dx*s,y=cy+dy*s,zz=K.H(x,y);G.cyl(x,y,zz-.1,.18*s,1.4*s*r,cuC('#5a4030'),6,false);cuEll(G,x,y,zz+1.9*s*r,1.3*s*r,1.3*s*r,1*s*r,pink,8,5);}
    K.spot(8,500,.15,.9,(x,y,zz)=>{G.ico(x,y,zz+.4*s,.8*s,.6,cuC('#e8eef6'),K.rnd,.4);},1.2*s);}});

/* ---------- Water 7 : ville d'eau — canaux, fontaine centrale, chantier naval, ponts et gondoles ---------- */
cuReg('Water 7',{art:{b:'city',canals:0,roof:['#3d64b8','#2e8a9a','#b5533c'],trees:[['round',3]]},
  relief:cuRel([{t:'plat',x:0,y:.02,r:.9,w:.1,h:2.4},{t:'line',ax:'x',v:-.33,w:.04,h:.2},{t:'line',ax:'x',v:.33,w:.04,h:.2},{t:'line',ax:'y',v:-.2,w:.04,h:.2}]),
  color(x,y,h,sl,def,c){const R=c.R;if(h<.45)return cuC('#3a8aa8');if(Math.hypot(x,y-.02*R)<.13*R)return cuStripe(x,y,1.4*c.u,0,1)?cuC('#e8dcc0'):cuC('#d2c6a8');return null;},
  build(k){const K=cuKit(k),{G,u:s,R}=K,wat=cuC('#4cb4d0'),st=cuC('#d8d0b8'),rd=cuC('#b5533c');
    /* eau des canaux : trois bandes dont les extrémités rejoignent la mer */
    const strip=(a,b)=>{const L=Math.hypot(b[0]-a[0],b[1]-a[1]),nx=-(b[1]-a[1])/L*.045*R,ny=(b[0]-a[0])/L*.045*R;G.quad([a[0]-nx,a[1]-ny,.33],[a[0]+nx,a[1]+ny,.33],[b[0]+nx,b[1]+ny,.33],[b[0]-nx,b[1]-ny,.33],wat,[0,0,1]);};
    strip([-.33*R,-.95*R],[-.33*R,.95*R]);strip([.33*R,-.95*R],[.33*R,.95*R]);strip([-.95*R,-.2*R],[.95*R,-.2*R]);
    /* ponts voûtés et gondoles */
    for(const [x,y,ax] of [[-.33,.1,'x'],[.33,.3,'x'],[-.33,-.55,'x'],[.33,-.5,'x'],[-.7,-.2,'y'],[.0,-.2,'y'],[.7,-.2,'y']]){const bx=x*R,by=y*R,w=ax==='x'?4.2*s:2.2*s,d=ax==='x'?2.2*s:4.2*s;G.box(bx-w/2,by-d/2,1.55,w,d,.4*s,st);G.box(bx-w/2,by-d/2-.0,1.9,w,.25*s,.5*s,st);if(ax==='x')G.box(bx-w/2,by+d/2-.25*s,1.9,w,.25*s,.5*s,st);}
    for(const [x,y,a] of [[-.33,.45,1.5708],[.33,-.2,1.5708],[-.55,-.2,0],[.3,-.2,0]]){const bx=x*R,by=y*R,c=Math.cos(a),sn=Math.sin(a),hl=1.6*s;for(let q=-2;q<=2;q++){const t=q/2,px=bx+c*hl*t,py=by+sn*hl*t;G.box(px-.45*s,py-.3*s,.34,.9*s,.6*s,.4*s*(1-.3*Math.abs(t)),cuC('#6b4428'));}G.box(bx+c*hl-.1*s,by+sn*hl-.1*s,.6,.2*s,.2*s,.5*s,cuC('#6b4428'));}
    /* place centrale : grande fontaine à trois vasques et jets */
    {const fx=0,fy=.02*R,z=2.4;G.cyl(fx,fy,z-.1,4.2*s,.7*s,st,24);G.cyl(fx,fy,z+.55*s,3.6*s,.12,wat,24);cuLathe(G,fx,fy,z+.6*s,[[.9*s,0],[.7*s,1.8*s],[2*s,2.2*s],[2.2*s,2.5*s]],st,14);cuLathe(G,fx,fy,z+3*s,[[.5*s,0],[.4*s,1.2*s],[1.3*s,1.6*s]],st,12);
     for(let q=0;q<8;q++){const a=q/8*6.2832;G.cone(fx+Math.cos(a)*2.2*s,fy+Math.sin(a)*2.2*s,z+2.5*s,.12*s,1.3*s,cuC('#bfe8f4'),4);}G.cone(fx,fy,z+4.3*s,.2*s,2.2*s,cuC('#cdeef8'),5);K.tops.push([fx-4.2*s,fy-4.2*s,fx+4.2*s,fy+4.2*s,z+6*s]);K.hold(fx,fy,5.5*s);k.top=z+9*s;k.ban(fx,fy,z+8*s);}
    /* chantier naval : deux cales avec coques en construction, grue, grand hangar */
    for(let q=0;q<2;q++){const x=(.5+q*.2)*R,y=-.5*R+q*.0,z=K.H(x,y),L=9*s;K.bc(x,y,z,6*s,L+2*s,.5*s,cuC('#a58a62'));for(let r=0;r<6;r++){const yy=y-L/2+r*L/5,hh=(1.1+(r%2)*.3)*s;for(const sg of [-1,1])cuTube(G,[[x+sg*.4*s,yy,z+.5*s],[x+sg*2*s,yy,z+hh+1.2*s],[x+sg*2.4*s,yy,z+hh+2.2*s]],.12*s,cuC('#7a4e2c'),4,true);}
      cuTube(G,[[x,y-L/2,z+.7*s],[x,y+L/2,z+.7*s]],.18*s,cuC('#7a4e2c'),5,true);K.hold(x,y,6*s);}
    {const cx=.55*R,cy=-.72*R,z=K.H(cx,cy);for(const [dx,dy] of [[-1,-1],[1,-1],[-1,1],[1,1]])G.cyl(cx+dx*s,cy+dy*s,z,.15*s,9*s,cuC('#c8453a'),4,false);for(let q=0;q<4;q++)K.glow(cx,cy,z+q*2.2*s,1,0,1.1*s,.15*s,cuC('#a83a30'));cuTube(G,[[cx,cy,z+9*s],[cx,cy+7*s,z+9*s]],.2*s,cuC('#c8453a'),5,true);G.box(cx-.2*s,cy+7*s,z+5*s,.4*s,.3*s,4*s,cuC('#444'));K.hold(cx,cy,3*s);}
    {const hx=-.55*R,hy=-.55*R,z=K.H(hx,hy);K.bc(hx,hy,z,10*s,6*s,3.2*s,cuC('#e8dcc0'));G.pyr(hx-5.5*s,hy-3.5*s,z+3.2*s,11*s,7*s,2.6*s,cuC('#3d64b8'),.3);K.bc(hx,hy+3.02*s,z,4*s,.2,2.6*s,cuC('#3a2a1c'));K.hold(hx,hy,8*s);}
    /* tour de la compagnie (interprétation) : étages en retrait, coiffe bleue */
    {const tx=.0,ty=-.62*R,z=K.H(tx,ty),top=K.tiers(tx,ty,z,[[6*s,4*s,cuC('#e8dcc0'),cuC('#3d64b8')],[4.4*s,3.4*s,cuC('#f0e6cc'),cuC('#3d64b8')]],1.4*s,.4*s);G.cone(tx,ty,top,1.6*s,3*s,cuC('#3d64b8'),10);K.hold(tx,ty,6*s);k.top=Math.max(k.top,top+3*s-z);}}});

/* ---------- Enies Lobby : île judiciaire — tour centrale, Portes de la Justice, cascades sur le pourtour (disposition interprétée) ---------- */
cuReg('Enies Lobby',{art:{b:'stone',peaks:[],town:4},pier:Math.PI/2,
  relief:cuRel([{t:'plat',x:0,y:-.05,r:.62,w:.18,h:5.2}]),
  color(x,y,h,sl,def,c){if(sl>.3)return cuMix(cuC('#7a7a80'),cuC('#a4a4aa'),.5+.5*Math.sin(h*4));if(h>4.6)return cuStripe(x,y,2*c.u,0,1)?cuC('#d8d4ca'):cuC('#c4c0b4');return null;},
  build(k){const K=cuKit(k),{G,R,rc}=K,w=cuC('#eeeae0'),w2=cuC('#c9c5b8'),blue=cuC('#4a6aa0'),gold=cuC('#e0b04a'),dk=cuC('#3a3530');
    /* cascades : rideaux d'eau du rebord du plateau jusqu'à la mer, sauf côté quai */
    for(let q=0;q<40;q++){const a0=q/40*6.2832,a1=(q+1)/40*6.2832,am=(a0+a1)/2;let da=Math.abs(am-k.aP);da=Math.min(da,6.2832-da);if(da<.7)continue;
      const P=(a,f)=>{const r=rc(a)*f;return [Math.cos(a)*r,Math.sin(a)*r];};const t0=P(a0,.8),t1=P(a1,.8),b0=P(a0,1.03),b1=P(a1,1.03),z0=K.H(t0[0],t0[1])+.15,z1=K.H(t1[0],t1[1])+.15;
      G.quad([b0[0],b0[1],.05],[b1[0],b1[1],.05],[t1[0],t1[1],z1],[t0[0],t0[1],z0],q%2?cuC('#d8f0f8'):cuC('#b8e2f2'));}
    /* tour de la Justice : haute tour ronde à étages, coiffe bleue */
    const s=1.35*K.u,cx=0,cy=-.18*R,z=K.H(cx,cy);cuLathe(G,cx,cy,z,[[4*s,0],[3.6*s,3*s],[2.8*s,3.4*s],[2.6*s,12*s],[3.2*s,12.6*s],[3.2*s,13.4*s],[2*s,13.6*s],[1.8*s,17*s]],(j)=>j%2?w2:w,16);
    G.cone(cx,cy,z+17*s,2.4*s,4*s,blue,16);G.cone(cx,cy,z+21*s,.3*s,1.4*s,gold,6);w3CylWins(k,cx,cy,2.62*s,z+4*s,z+11.5*s,10,4,.45*s);
    K.tops.push([cx-4*s,cy-4*s,cx+4*s,cy+4*s,z+17*s]);k.top=z+22*s;k.ban(cx,cy,z+22*s);K.hold(cx,cy,6*s);
    /* palais de justice en façade, colonnade */
    {const hx=0,hy=.08*R,hz=K.H(hx,hy);K.bc(hx,hy,hz,12*s,5*s,4*s,w);for(let q=0;q<7;q++)G.cyl(hx-5.4*s+q*1.8*s,hy+2.8*s,hz,.35*s,4*s,w2,8);K.bc(hx,hy+.6*s,hz+4*s,13*s,6.4*s,.6*s,w2);G.pyr(hx-6.5*s,hy-2.6*s,hz+4.6*s,13*s,6.4*s,2*s,blue,.3);for(let q=0;q<4;q++)K.bc(hx,hy+3.4*s+q*.8*s,hz-.1-q*.25*s,6*s,.8*s,.4*s,w2);K.hold(hx,hy,8*s);}
    /* Portes de la Justice : deux piliers géants, linteau, battants sombres ; tournés vers le large (nord) */
    {const gx=-.6*R,gy=.52*R,gz=0;for(const sg of [-1,1]){K.bc(gx+sg*5*s,gy,gz,2.6*s,2.6*s,16*s,w2);G.cone(gx+sg*5*s,gy,gz+16*s,1.8*s,2*s,blue,4);}K.bc(gx,gy,gz+14*s,12.6*s,2.8*s,2*s,w);
     for(const sg of [-1,1])K.bc(gx+sg*1.9*s,gy,gz,3.6*s,.8*s,13.6*s,dk);G.box(gx-.15*s,gy-.45*s,gz+3*s,.3*s,.1,8*s,gold);
     cuTube(G,[[gx+1.5*s,gy-1.5*s,4.6],[gx+.16*R,gy-.16*R,5.2]],.8*s,w2,6,true);k.top=Math.max(k.top,18*s);}}});

/* ---------- Thriller Bark : île-navire fantôme — pont de bois, mâts aux voiles déchirées, figure de proue, manoir gothique ---------- */
cuReg('Thriller Bark',{art:{b:'spooky',trees:[['dead',12]]},
  relief:cuRel([{t:'plat',x:0,y:0,r:.7,w:.22,h:2.6},{t:'peak',x:0,y:-.62,h:3.4,s:.14}]),
  color(x,y,h,sl,def,c){if(sl>.3)return cuMix(cuC('#3e2c22'),cuC('#5a4030'),.5+.5*Math.sin(h*7));if(h>2.2){const p=Math.floor(x/(1.1*c.u));return cuMix(cuC('#5a4636'),cuC('#4a3a2e'),(p&1)*.6+.2*fbm2(x*.2,y*.6,c.S0,2));}return null;},
  build(k){const K=cuKit(k),{G,u:s,R}=K,dk=cuC('#2e2830'),st=cuC('#4e4658'),rf=cuC('#2a2238'),sail=cuC('#5a5248'),glow=cuC('#b4ff8a');
    /* manoir gothique central */
    const cx=0,cy=-.05*R,z=K.H(cx,cy);K.bc(cx,cy,z,10*s,6*s,6*s,st);G.pyr(cx-5.4*s,cy-3.4*s,z+6*s,10.8*s,6.8*s,3.4*s,rf,.4);
    for(const [dx,h] of [[-5,11],[5,9],[0,15]]){cuLathe(G,cx+dx*s,cy,z,[[1.6*s,0],[1.4*s,h*s]],st,8);G.cone(cx+dx*s,cy,z+h*s,2*s,(h*.5)*s,rf,8);K.tops.push([cx+dx*s-1.6*s,cy-1.6*s,cx+dx*s+1.6*s,cy+1.6*s,z+h*1.5*s]);}
    for(let q=0;q<6;q++)K.glow(cx-4*s+q*1.6*s,cy+3.02*s,z+2*s+(q%2)*1.8*s,0,1,.35*s,1.1*s,q%3?cuC('#ffc562'):glow);
    k.ban(cx,cy,z+23*s);k.top=z+23*s;K.hold(cx,cy,8*s);
    /* trois mâts géants, vergues et voiles en lambeaux */
    for(const [mx,my,mh] of [[-.42,.28,22],[.42,.25,19],[0,.55,16]]){const x=mx*R,y=my*R,zz=K.H(x,y);G.cyl(x,y,zz-.2,.55*s,mh*s,dk,8);
      for(let q=0;q<2;q++){const yz=zz+(mh*.55+q*mh*.28)*s,wd=(6-q*2)*s;G.box(x-wd,y-.2*s,yz,wd*2,.4*s,.4*s,dk);for(let p=0;p<4;p++){const x0=x-wd+p*wd/2;G.quad([x0,y+.3*s,yz-.1],[x0+wd/2-.2*s,y+.3*s,yz-.1],[x0+wd/2-.4*s,y+.4*s,yz-(4.5-((p*7)%3))*s],[x0+.3*s,y+.4*s,yz-(3.6+((p*5)%2))*s],sail);}}
      G.tri([x,y,zz+mh*s],[x,y,zz+mh*s-1.4*s],[x+2.4*s,y,zz+mh*s-.6*s],cuC('#1c1a1e'));K.tops.push([x-.6*s,y-.6*s,x+.6*s,y+.6*s,zz+mh*s]);K.hold(x,y,2.5*s);k.top=Math.max(k.top,zz+mh*s);}
    /* figure de proue : grand crâne en avant de l'étrave nord */
    {const px=0,py=-.95*R,pz=4.4;cuEll(G,px,py,pz+2.4*s,2.6*s,2.4*s,2.6*s,cuC('#e6dece'),12,8);for(const sg of [-1,1])cuEll(G,px+sg*1*s,py-2*s,pz+2.8*s,.7*s,.4*s,.8*s,cuC('#1a1418'),8,5);cuEll(G,px,py-2.2*s,pz+1.4*s,.35*s,.3*s,.4*s,cuC('#1a1418'),6,4);
     for(let q=0;q<5;q++)K.bc(px-1.6*s+q*.8*s,py-1.8*s,pz-.2*s,.5*s,.6*s,.8*s,cuC('#e6dece'));cuTube(G,[[px,py+2*s,pz],[px,-.72*R,3.2]],1*s,dk,8,true);}
    /* bastingage le long du bord du pont */
    for(let q=0;q<48;q++){const a=q/48*6.2832,r=K.rc(a)*.8,x=Math.cos(a)*r,y=Math.sin(a)*r,zz=K.H(x,y);if(zz<1.6)continue;G.box(x-.15*s,y-.15*s,zz,.3*s,.3*s,1.1*s,dk);}
    /* tombes du cimetière */
    K.spot(16,600,.25,.75,(x,y,zz,i)=>{if(i%3)G.box(x-.5*s,y,zz-.1,1*s,.3*s,1.2*s,cuC('#7a7484'));else{G.box(x-.1*s,y,zz-.1,.2*s,.2*s,1.6*s,cuC('#7a7484'));G.box(x-.55*s,y,zz+1*s,1.1*s,.2*s,.22*s,cuC('#7a7484'));}K.hold(x,y,1*s);},1*s);
    K.spot(14,500,.1,.85,(x,y,zz)=>cuEll(G,x,y,zz+.8*s,.2*s,.2*s,.2*s,glow,5,3),.5*s);}});

/* ---------- Wano : pays des samouraïs — mont enneigé, château à toits recourbés, pagode, torii, ponts rouges, cerisiers, rizières ---------- */
cuReg('Pays des Wa',{art:{b:'japan',peaks:[],trees:[['round',4]],house:'jp'},
  relief:cuRel([{t:'peak',x:-.05,y:-.38,h:17,s:.17},{t:'peak',x:-.5,y:-.25,h:6,s:.1},{t:'peak',x:.5,y:-.22,h:7,s:.11},{t:'plat',x:.05,y:.02,r:.12,w:.1,h:4.2}]),
  color(x,y,h,sl,def,c){const R=c.R;if(h>13)return cuC('#f6f8fc');if(sl>.32)return cuMix(cuC('#6a6a62'),cuC('#8a887c'),.5+.5*Math.sin(h*4));if(h<2.8&&h>.6&&y>.15*R){const band=Math.floor((x*.9+y*.4)/(1.6*c.u))&1;return band?cuC('#b8c860'):cuC('#9ab84c');}return null;},
  build(k){const K=cuKit(k),{G,u:s,R}=K,wh=cuC('#f4efe2'),stn=cuC('#8e8a80'),rf=cuC('#2e3a4e'),gold=cuC('#e8b830'),red=cuC('#c8352e'),pink=[cuC('#f6b6cc'),cuC('#f2a0bc'),cuC('#fbd0de')];
    /* château : socle de pierre en talus, quatre étages à toits débordants, poissons d'or au faîte */
    const cx=.05*R,cy=.02*R,z=K.H(cx,cy);G.pyr(cx-6*s,cy-5*s,z-.3,12*s,10*s,3*s,stn,.12);
    const top=K.tiers(cx,cy,z+2.7*s,[[8.4*s,2.6*s,wh,rf],[6.6*s,2.2*s,wh,rf],[5*s,2*s,wh,rf],[3.6*s,1.8*s,wh,rf]],1.3*s,.9*s);
    for(const sg of [-1,1])G.cone(cx+sg*1.6*s,cy,top-.4*s,.3*s,.9*s,gold,5);K.tops.push([cx-6*s,cy-5*s,cx+6*s,cy+5*s,top]);k.ban(cx,cy,top+1.6*s);k.top=top+2*s;K.hold(cx,cy,9*s);
    /* pagode à cinq toits */
    {const px=-.42*R,py=.12*R,pz=K.H(px,py);let zz=pz;for(let q=0;q<5;q++){const w=(3.4-q*.4)*s;K.bc(px,py,zz,w,w,1.3*s,cuC('#a8402c'));G.pyr(px-w/2-.8*s,py-w/2-.8*s,zz+1.3*s,w+1.6*s,w+1.6*s,.8*s,rf,.2);zz+=2*s;}G.cyl(px,py,zz,.12*s,2.4*s,gold,5,false);K.hold(px,py,4*s);k.top=Math.max(k.top,zz+2*s-pz);}
    /* torii près du quai, pont rouge en arc */
    {const a=k.aP,r=K.rc(a)*.7,tx=Math.cos(a)*r,ty=Math.sin(a)*r,tz=K.H(tx,ty),nx=-Math.sin(a),ny=Math.cos(a);for(const sg of [-1,1])G.cyl(tx+nx*sg*2*s,ty+ny*sg*2*s,tz-.1,.3*s,4.6*s,red,8);
     const L=(zz,e,c)=>G.box(tx-Math.abs(nx)*(2+e)*s-.3*s,ty-Math.abs(ny)*(2+e)*s-.3*s,zz,(Math.abs(nx)*(4+2*e)+.6)*s,(Math.abs(ny)*(4+2*e)+.6)*s,.45*s,c);L(tz+3.6*s,.3,red);L(tz+4.5*s,.9,cuC('#2a2a2a'));K.hold(tx,ty,3*s);}
    {const bx=.45*R,by=.3*R;for(let q=0;q<9;q++){const f=q/8,y=by-3*s+f*6*s,zz=K.H(.45*R,y)+.3+Math.sin(f*Math.PI)*1.6*s;G.box(bx-1.1*s,y-.4*s,zz,2.2*s,.8*s,.3*s,red);}}
    /* cerisiers en fleurs et bambouseraie */
    K.spot(18,900,.15,.9,(x,y,zz,i)=>{const q=(1+K.rnd()*.6)*s;G.cyl(x,y,zz-.1,.16*q,1.6*q,cuC('#5a4030'),6,false);cuEll(G,x,y,zz+2.2*q,1.4*q,1.4*q,1.05*q,pink[i%3],8,5);K.tops.push([x-1.4*q,y-1.4*q,x+1.4*q,y+1.4*q,zz+3.2*q]);},1.6*s);
    K.spot(5,500,.2,.85,(x,y,zz)=>{for(let q=0;q<9;q++){const a=q*2.4,d=(q%3)*.5*s;G.cyl(x+Math.cos(a)*d,y+Math.sin(a)*d,zz-.1,.09*s,(3+q%4*.6)*s,cuC('#6aa84a'),5,false);}K.tops.push([x-s,y-s,x+s,y+s,zz+5*s]);},2*s);}});

/* ---------- Elbaf : pays des géants — grand arbre-monde, halle de bois à proues de dragon, pierres runiques, armes plantées (interprétation) ---------- */
cuReg('Elbaph',{art:{b:'grass',trees:[['pine',10]]},
  relief:cuRel([{t:'peak',x:-.45,y:-.3,h:7,s:.13},{t:'peak',x:.48,y:-.32,h:6,s:.12}]),
  build(k){const K=cuKit(k),{G,u:s,R}=K,bark=cuC('#6a4a30'),leaf=[cuC('#3f7a3a'),cuC('#4f8f44'),cuC('#5a9a48')],wood=cuC('#8a5a34'),wood2=cuC('#5a3a22'),stone=cuC('#8a8a84');
    /* arbre-monde : tronc massif, racines, branches porteuses, frondaison étagée */
    const tx=-.05*R,ty=-.25*R,tz=K.H(tx,ty);cuLathe(G,tx,ty,tz-.3,[[4.4*s,0],[3*s,2*s],[2.4*s,10*s],[2.2*s,18*s]],bark,12);
    for(let q=0;q<7;q++){const a=q/7*6.2832;cuTube(G,cuCR([[tx+Math.cos(a)*2*s,ty+Math.sin(a)*2*s,tz+2*s],[tx+Math.cos(a)*4.5*s,ty+Math.sin(a)*4.5*s,tz+.6*s],[tx+Math.cos(a)*6.5*s,ty+Math.sin(a)*6.5*s,tz-.3]],3),t=>(1-.7*t)*.9*s,bark,6,true);}
    for(let q=0;q<6;q++){const a=q/6*6.2832+.4,zz=tz+(11+q%3*2.5)*s;cuTube(G,cuCR([[tx,ty,zz],[tx+Math.cos(a)*4*s,ty+Math.sin(a)*4*s,zz+2.4*s],[tx+Math.cos(a)*7*s,ty+Math.sin(a)*7*s,zz+3*s]],3),t=>(1-.6*t)*.8*s,bark,6,true);cuEll(G,tx+Math.cos(a)*7*s,ty+Math.sin(a)*7*s,zz+4*s,4*s,4*s,2.6*s,leaf[q%3],10,6);}
    cuEll(G,tx,ty,tz+21*s,7*s,7*s,4.4*s,leaf[1],12,7);K.tops.push([tx-8*s,ty-8*s,tx+8*s,ty+8*s,tz+25*s]);k.ban(tx,ty,tz+26*s);k.top=tz+26*s;K.hold(tx,ty,10*s);
    /* grande halle des géants : toit très pentu, poutres croisées et têtes de dragon aux pignons */
    {const hx=.12*R,hy=.28*R,hz=K.H(hx,hy),L=16*s,W=7*s;K.bc(hx,hy,hz-.2,L,W,4*s,wood);G.pyr(hx-L/2-.5*s,hy-W/2-.8*s,hz+3.8*s,L+s,W+1.6*s,5.5*s,cuC('#4a3a2a'),.48);
     for(const sg of [-1,1]){const gx=hx+sg*(L/2+.3*s);cuTube(G,cuCR([[gx,hy,hz+7*s],[gx+sg*1.5*s,hy,hz+10*s],[gx+sg*2.6*s,hy,hz+10.4*s]],3),t=>(.5-.25*t)*s,wood2,6,true);cuEll(G,gx+sg*2.9*s,hy,hz+10.4*s,.9*s,.5*s,.5*s,wood2,6,4);}
     K.bc(hx,hy+W/2+.05*s,hz-.1,2.4*s,.2*s,3.2*s,wood2);K.hold(hx,hy,10*s);}
    /* cercle de pierres runiques à lueur bleue */
    {const rx=.45*R,ry=-.05*R;for(let q=0;q<8;q++){const a=q/8*6.2832,x=rx+Math.cos(a)*4.5*s,y=ry+Math.sin(a)*4.5*s,zz=K.H(x,y);K.bc(x,y,zz-.2,1.2*s,.9*s,(3.6+(q%3))*s,stone);K.glow(x,y+.46*s,zz+1*s,0,1,.25*s,1.8*s,cuC('#8ad8ff'));}K.hold(rx,ry,6*s);}
    /* hache et épée de géant plantées dans le sol, tonneau géant */
    {const ax=-.5*R,ay=.25*R,az=K.H(ax,ay);G.cyl(ax,ay,az-1,.45*s,11*s,wood2,6);G.quad([ax,ay,az+8.6*s],[ax+3.6*s,ay,az+7.4*s],[ax+3.6*s,ay,az+11.4*s],[ax,ay,az+10.6*s],cuC('#b8c0c8'));K.hold(ax,ay,3*s);}
    {const ex=.42*R,ey=.42*R,ez=K.H(ex,ey);K.bc(ex,ey,ez-1,.5*s,1.4*s,12*s,cuC('#c8d0d8'));K.bc(ex,ey,ez+9*s,3.6*s,.8*s,.6*s,cuC('#8a6a3a'));K.bc(ex,ey,ez+9.6*s,.6*s,.6*s,2.4*s,wood2);K.hold(ex,ey,2.5*s);}
    {const bx=-.2*R,by=.52*R,bz=K.H(bx,by);cuLathe(G,bx,by,bz,[[2.2*s,0],[2.6*s,1.8*s],[2.2*s,3.6*s]],(j)=>wood,12);for(const zz of [.5,1.8,3.1])G.cyl(bx,by,bz+zz*s,2.5*s,.25*s,cuC('#4a4a4a'),12);K.hold(bx,by,3*s);}
    K.spot(7,600,.15,.88,(x,y,zz)=>K.tree('pine',x,y,zz,(2.2+K.rnd())*s,leaf[0]),3*s);}});

/* ---------- Mary Geoise : Terre sainte au sommet de la falaise rouge — palais de marbre blanc et or, grand escalier ---------- */
cuReg('Mary Geoise',{art:{b:'redrock',peaks:[],town:4},pier:Math.PI/2,
  relief:cuRel([{t:'plat',x:0,y:-.08,r:.55,w:.22,h:10}]),
  color(x,y,h,sl,def,c){if(sl>.28)return cuMix(cuC('#a8452c'),cuC('#c86040'),.5+.5*Math.sin(h*3.2));if(h>9.4)return cuStripe(x,y,2.4*c.u,0,1)?cuC('#f4f0e8'):cuC('#e6dfcf');return null;},
  build(k){const K=cuKit(k),{G,u:s,R}=K,mb=cuC('#f6f2ea'),mb2=cuC('#dcd4c4'),gold=cuC('#e8c048'),gd2=cuC('#c89830');
    const cx=0,cy=-.16*R,z=K.H(cx,cy);
    /* palais : grand corps, deux ailes, dôme d'or central, quatre clochetons dorés, colonnade */
    K.bc(cx,cy,z,16*s,8*s,5*s,mb);for(const sg of [-1,1]){K.bc(cx+sg*10*s,cy+2*s,z,5*s,10*s,4*s,mb2);G.dome(cx+sg*10*s,cy+2*s,z+4*s,2*s,.9,gold,10);}
    cuLathe(G,cx,cy,z+5*s,[[4*s,0],[4*s,3*s]],mb,16);G.dome(cx,cy,z+8*s,4.2*s,1,gold,16);G.cyl(cx,cy,z+12*s,.6*s,1.2*s,mb,8);G.cone(cx,cy,z+13.2*s,.8*s,2.4*s,gold,8);
    for(const [dx,dy] of [[-7,-3.4],[7,-3.4],[-7,3.4],[7,3.4]]){cuLathe(G,cx+dx*s,cy+dy*s,z,[[1*s,0],[.9*s,9*s]],mb,10);G.cone(cx+dx*s,cy+dy*s,z+9*s,1.2*s,3*s,gold,10);K.tops.push([cx+dx*s-s,cy+dy*s-s,cx+dx*s+s,cy+dy*s+s,z+12*s]);}
    for(let q=0;q<9;q++)G.cyl(cx-6.4*s+q*1.6*s,cy+4.6*s,z,.3*s,4.6*s,mb,8);K.bc(cx,cy+4.6*s,z+4.6*s,15*s,1.2*s,.6*s,mb2);
    K.tops.push([cx-8*s,cy-4*s,cx+8*s,cy+5*s,z+12*s]);k.ban(cx,cy,z+16*s);k.top=z+16*s;K.hold(cx,cy,15*s);
    /* grand escalier blanc descendant la falaise vers le quai (sud) */
    {const n=22;for(let q=0;q<n;q++){const f=q/(n-1),y=cy+8*s+f*(.62*R),zz=Math.max(.3,K.H(0,y));G.box(-2.6*s,y-.5*s,zz-.4,5.2*s,1*s,.5,q%2?mb:mb2);}K.hold(0,.3*R,3*s);}
    /* jardins et fontaine dorée sur l'esplanade */
    {const fx=0,fy=.2*R,fz=K.H(fx,fy);if(fz>8){G.cyl(fx,fy,fz-.1,3*s,.6*s,mb2,16);G.cyl(fx,fy,fz+.45*s,2.6*s,.1,cuC('#7ad0e8'),16);cuLathe(G,fx,fy,fz,[[.4*s,0],[.3*s,2.4*s],[1.2*s,2.8*s]],gold,10);K.hold(fx,fy,4*s);}}
    K.spot(10,600,.15,.55,(x,y,zz)=>{if(zz<9)return;G.cyl(x,y,zz-.1,.12*s,.8*s,cuC('#7a5634'),5,false);cuEll(G,x,y,zz+1.4*s,.7*s,.7*s,.9*s,cuC('#5e9a42'),8,5);},1.4*s);}});

/* ---------- Sabaody : archipel de mangroves géantes, bulles de résine, grande roue du parc ---------- */
cuReg('Archipel des Sabaody',{art:{b:'grass',trees:[['round',6]]},
  build(k){const K=cuKit(k),{G,u:s,R}=K,bark=cuC('#7a5a3e'),bark2=cuC('#5e4430'),leaf=[cuC('#5aa060'),cuC('#4a9070')],bub=[cuC('#e8f8ff'),cuC('#d6f0fc'),cuC('#f6e8ff')];
    /* mangroves géantes : racines aériennes en arceaux, tronc, petite couronne ; numéro de grove sur un panneau */
    const pos=[[-.45,-.35],[.1,-.5],[.5,-.25],[-.55,.15],[.45,.25],[-.15,.35],[.05,-.05]];
    pos.forEach(([px,py],i)=>{const x=px*R,y=py*R,z=K.H(x,y),h=(10+(i%3)*2.5)*s;
      for(let q=0;q<7;q++){const a=q/7*6.2832+i;cuTube(G,cuCR([[x+Math.cos(a)*.8*s,y+Math.sin(a)*.8*s,z+3.4*s],[x+Math.cos(a)*2.8*s,y+Math.sin(a)*2.8*s,z+2.6*s],[x+Math.cos(a)*3.6*s,y+Math.sin(a)*3.6*s,z-.3]],3),.32*s,bark2,5,true);}
      cuLathe(G,x,y,z+2.6*s,[[1.4*s,0],[1.2*s,h-2*s],[1.6*s,h-.8*s]],bark,10);cuEll(G,x,y,z+h+1*s,4.2*s,4.2*s,2*s,leaf[i%2],10,6);
      for(let q=0;q<4;q++){const a=q*1.7+i,r=(.6+q*.25)*s;cuEll(G,x+Math.cos(a)*2*s,y+Math.sin(a)*2*s,z+h+3*s+q*2.2*s,r,r,r,bub[q%3],8,6);}
      K.tops.push([x-4*s,y-4*s,x+4*s,y+4*s,z+h+3*s]);K.hold(x,y,5*s);k.top=Math.max(k.top,h+10*s);});
    k.ban(.05*R,-.05*R,K.H(.05*R,-.05*R)+16*s);
    /* bulles au ras du sol entre les mangroves */
    K.spot(16,800,.1,.9,(x,y,zz,i)=>{const r=(.4+K.rnd()*.7)*s;cuEll(G,x,y,zz+r*1.4,r,r,r,bub[i%3],8,6);},.6*s);
    /* grande roue du parc d'attractions */
    {const wx=.35*R,wy=.55*R,wz=K.H(wx,wy),r=6*s,hz=wz+r+1.6*s;for(const sg of [-1,1])cuTube(G,[[wx-2*s,wy+sg*.6*s,wz],[wx,wy+sg*.6*s,hz],[wx+2*s,wy+sg*.6*s,wz]],.18*s,cuC('#e8e0d0'),5,false);
     const ring=[];for(let q=0;q<=24;q++){const a=q/24*6.2832;ring.push([wx+Math.cos(a)*r,wy,hz+Math.sin(a)*r]);}cuTube(G,ring,.16*s,cuC('#f05a7a'),5,false);
     for(let q=0;q<8;q++){const a=q/8*6.2832;cuTube(G,[[wx,wy,hz],[wx+Math.cos(a)*r,wy,hz+Math.sin(a)*r]],.08*s,cuC('#f6f0e6'),4,false);G.box(wx+Math.cos(a)*r-.5*s,wy-.5*s,hz+Math.sin(a)*r-1.2*s,1*s,1*s,1*s,[cuC('#ffd24a'),cuC('#4ab0e8'),cuC('#7ae07a')][q%3]);}
     K.tops.push([wx-r,wy-1,wx+r,wy+1,hz+r]);K.hold(wx,wy,7*s);}}});

/* ---------- Île des Hommes-Poissons : palais Ryugu de corail, coupoles, forêt de corail et coquillages ---------- */
cuReg('Île des Hommes-Poissons',{art:{b:'coral',trees:[]},
  build(k){const K=cuKit(k),{G,u:s,R}=K,wl=cuC('#fff0f0'),wl2=cuC('#f7c6c6'),pink=cuC('#f58aa0'),aqua=cuC('#5ac8d8'),gold=cuC('#f0c050'),cor=[cuC('#ff7a6a'),cuC('#ff9ac0'),cuC('#b48aff'),cuC('#ffb04a')];
    const cx=0,cy=-.12*R,z=K.H(cx,cy);
    /* palais : corps à étages, trois grandes coupoles en bulbe, tours-coquillages en spirale */
    K.bc(cx,cy,z,14*s,8*s,4*s,wl2);K.bc(cx,cy,z+4*s,10*s,6*s,3*s,wl);
    const onion=(x,y,zz,r,c)=>{cuLathe(G,x,y,zz,[[r*.7,0],[r*1.05,r*.7],[r*.9,r*1.4],[r*.3,r*2],[.05,r*2.6]],c,14);G.cyl(x,y,zz+r*2.6,.12*s,1*s,gold,4,false);};
    onion(cx,cy,z+7*s,3*s,aqua);for(const sg of [-1,1]){cuLathe(G,cx+sg*5.6*s,cy,z+4*s,[[1.4*s,0],[1.2*s,5*s]],wl,10);onion(cx+sg*5.6*s,cy,z+9*s,1.8*s,pink);}
    for(const sg of [-1,1]){const x=cx+sg*8.6*s,y=cy+3*s;cuLathe(G,x,y,z,[[2.2*s,0],[1.7*s,3*s],[1.2*s,6*s],[.7*s,9*s],[.1,12*s]],(j)=>j%2?wl2:wl,12);K.tops.push([x-2*s,y-2*s,x+2*s,y+2*s,z+12*s]);}
    for(let q=0;q<6;q++)K.glow(cx-5*s+q*2*s,cy+4.02*s,z+1.4*s,0,1,.45*s,1.6*s,cuC('#7ad8ff'));
    K.tops.push([cx-7*s,cy-4*s,cx+7*s,cy+4*s,z+14*s]);k.ban(cx,cy,z+16*s);k.top=z+16*s;K.hold(cx,cy,11*s);
    /* forêt de corail : branches ramifiées, anémones, coquillages-maisons, perles */
    K.spot(14,900,.15,.9,(x,y,zz,i)=>{const c=cor[i%4],h=(2.4+K.rnd()*2)*s;cuTube(G,[[x,y,zz-.2],[x,y,zz+h*.5]],.25*s,c,6,false);for(let b=0;b<4;b++){const a=b*1.6+i,l=h*(.4+K.rnd()*.3);cuTube(G,[[x,y,zz+h*.4],[x+Math.cos(a)*l*.5,y+Math.sin(a)*l*.5,zz+h*.7],[x+Math.cos(a)*l*.6,y+Math.sin(a)*l*.6,zz+h]],.16*s,c,5,true);}K.tops.push([x-s,y-s,x+s,y+s,zz+h]);},1.8*s);
    K.spot(8,600,.2,.9,(x,y,zz,i)=>{cuLathe(G,x,y,zz-.1,[[1.4*s,0],[1.1*s,1*s],[.6*s,2*s],[.1,2.8*s]],(j)=>j%2?cuC('#ffe0c8'):cuC('#f8c8a8'),9);K.tops.push([x-1.4*s,y-1.4*s,x+1.4*s,y+1.4*s,zz+2.8*s]);},2*s);
    K.spot(12,600,.1,.9,(x,y,zz,i)=>{for(let q=0;q<6;q++){const a=q;cuTube(G,[[x,y,zz],[x+Math.cos(a)*.4*s,y+Math.sin(a)*.4*s,zz+.9*s]],.08*s,cor[(i+1)%4],4,true);}},1*s);
    K.spot(14,500,.1,.9,(x,y,zz)=>cuEll(G,x,y,zz+.5*s,.35*s,.35*s,.35*s,cuC('#f8f4f0'),6,4),.4*s);}});

/* ---------- Germa : royaume technologique (Germa 66) — palais de métal rouge et noir, tours-antennes, pods hexagonaux (interprétation) ---------- */
cuReg('Royaume de Germa',{art:{b:'stone',trees:[['round',4]],house:'future'},
  relief:cuRel([{t:'plat',x:0,y:-.05,r:.5,w:.2,h:3}]),
  color(x,y,h,sl,def,c){if(sl>.3)return cuMix(cuC('#4a4a52'),cuC('#626270'),.5+.5*Math.sin(h*5));if(h>2.7){const g=(Math.abs(((x/(3*c.u))%1+1)%1-.5)<.04)||(Math.abs(((y/(3*c.u))%1+1)%1-.5)<.04);return g?cuC('#c8352e'):cuC('#5a5a64');}return null;},
  build(k){const K=cuKit(k),{G,u:s,R}=K,red=cuC('#c8352e'),red2=cuC('#9a2420'),blk=cuC('#2a2a32'),mt=cuC('#8a8e98'),neon=cuC('#6ad8ff');
    const cx=0,cy=-.1*R,z=K.H(cx,cy);
    /* tour centrale hexagonale à ailerons et anneaux lumineux */
    cuLathe(G,cx,cy,z,[[4.5*s,0],[3.6*s,2*s],[2.6*s,4*s],[2.4*s,14*s],[3.2*s,15*s],[1.4*s,17*s],[.3*s,21*s]],(j)=>j%2?blk:red,6);
    for(const zz of [5,8.5,12])G.cyl(cx,cy,z+zz*s,2.65*s,.3*s,neon,6);for(let q=0;q<3;q++){const a=q/3*6.2832+.5;G.quad([cx+Math.cos(a)*2.4*s,cy+Math.sin(a)*2.4*s,z+4*s],[cx+Math.cos(a)*5.4*s,cy+Math.sin(a)*5.4*s,z+3*s],[cx+Math.cos(a)*4*s,cy+Math.sin(a)*4*s,z+11*s],[cx+Math.cos(a)*2.4*s,cy+Math.sin(a)*2.4*s,z+13*s],red2);}
    K.tops.push([cx-4.5*s,cy-4.5*s,cx+4.5*s,cy+4.5*s,z+21*s]);k.ban(cx,cy,z+22*s);k.top=z+22*s;K.hold(cx,cy,7*s);
    /* aile basse en arc, pods hexagonaux, passerelles */
    for(let q=0;q<5;q++){const a=1.5708-1.1+q*.55,x=cx+Math.cos(a)*9*s,y=cy+Math.sin(a)*9*s,zz=K.H(x,y);G.cyl(x,y,zz-.1,1.8*s,3*s,q%2?red:blk,6);G.dome(x,y,zz+2.9*s,1.8*s,.6,mt,6);G.cyl(x,y,zz+1.6*s,1.85*s,.2*s,neon,6);K.tops.push([x-1.8*s,y-1.8*s,x+1.8*s,y+1.8*s,zz+4*s]);cuTube(G,[[cx+Math.cos(a)*2.6*s,cy+Math.sin(a)*2.6*s,z+3*s],[x,y,zz+2.4*s]],.35*s,mt,6,false);K.hold(x,y,2.6*s);}
    /* tours-antennes aux feux jaunes */
    for(const [px,py] of [[-.5,-.35],[.5,-.35],[-.45,.35],[.5,.3]]){const x=px*R,y=py*R,zz=K.H(x,y);G.cyl(x,y,zz-.1,.7*s,1.2*s,blk,6);cuTube(G,[[x,y,zz],[x,y,zz+12*s]],t=>(.35-.25*t)*s,mt,5,false);for(const hz of [4,8])G.box(x-1.4*s,y-.1*s,zz+hz*s,2.8*s,.2*s,.2*s,mt);cuEll(G,x,y,zz+12.3*s,.4*s,.4*s,.4*s,cuC('#ffd24a'),6,4);K.tops.push([x-s,y-s,x+s,y+s,zz+12*s]);K.hold(x,y,2*s);}
    /* aire d'envol : disque marqué */
    {const lx=-.35*R,ly=.0,lz=K.H(lx,ly);G.cyl(lx,ly,lz-.1,3.4*s,.35*s,blk,16);G.cyl(lx,ly,lz+.26*s,2.6*s,.06*s,red,16);G.cyl(lx,ly,lz+.3*s,2*s,.06*s,blk,16);K.hold(lx,ly,4*s);}}});

/* ---------- Loguetown : ville du début et de la fin — échafaud de la place d'exécution, tour de l'horloge, base de la Marine ---------- */
cuReg('Loguetown',{art:{b:'tropical',trees:[['round',4],['palm',3]]},
  relief:cuRel([{t:'plat',x:0,y:-.05,r:.2,w:.12,h:2.4}]),
  color(x,y,h,sl,def,c){if(Math.hypot(x,y+.05*c.R)<.22*c.R&&h>2)return cuStripe(x,y,1.2*c.u,0,1)?cuC('#d8ccb0'):cuC('#c8bc9e');return null;},
  build(k){const K=cuKit(k),{G,u:s,R}=K,wd=cuC('#7a5434'),wd2=cuC('#5a3c24'),st=cuC('#c8c0aa'),wh=cuC('#f0ebe0'),bl=cuC('#3c5f9e');
    /* échafaud : estrade de bois haute, escalier, portique (représentation stylisée) */
    const cx=0,cy=-.08*R,z=K.H(cx,cy);K.bc(cx,cy,z,7*s,5*s,4.2*s,wd);for(const [dx,dy] of [[-3.3,-2.3],[3.3,-2.3],[-3.3,2.3],[3.3,2.3]])G.cyl(cx+dx*s,cy+dy*s,z,.25*s,4.4*s,wd2,5,false);
    for(let q=0;q<7;q++)K.bc(cx,cy+2.5*s+q*.75*s,z-.1,2.4*s,.75*s,(4.2-q*.6)*s,wd2);
    for(const sg of [-1,1])G.box(cx+sg*2.2*s-.25*s,cy-.25*s,z+4.2*s,.5*s,.5*s,5.4*s,wd2);G.box(cx-2.6*s,cy-.3*s,z+9.4*s,5.2*s,.6*s,.6*s,wd2);
    K.tops.push([cx-3.6*s,cy-2.6*s,cx+3.6*s,cy+2.6*s,z+10*s]);k.ban(cx,cy,z+11*s);k.top=z+11*s;K.hold(cx,cy,7*s);
    /* tour de l'horloge sur la place */
    {const tx=-.25*R,ty=-.22*R,tz=K.H(tx,ty);K.bc(tx,ty,tz,3.2*s,3.2*s,11*s,st);K.bc(tx,ty,tz+11*s,3.8*s,3.8*s,.5*s,wh);for(const [dx,dy] of [[0,1],[1,0],[0,-1],[-1,0]]){const fx=tx+dx*1.62*s,fy=ty+dy*1.62*s;cuEll(G,fx,fy,tz+9*s,dx?.06*s:1*s,dy?.06*s:1*s,1*s,wh,10,6);G.box(fx-.06*s,fy-.06*s,tz+9*s,.12*s,.12*s,.8*s,cuC('#2a2a2a'));}
     G.pyr(tx-1.9*s,ty-1.9*s,tz+11.5*s,3.8*s,3.8*s,3.4*s,cuC('#b5533c'),.0);k.top=Math.max(k.top,tz+15*s);K.hold(tx,ty,3*s);}
    /* base de la Marine : bâtiment blanc à toit bleu, mât */
    {const bx=.33*R,by=-.25*R,bz=K.H(bx,by);K.bc(bx,by,bz,9*s,5*s,4*s,wh);G.pyr(bx-4.7*s,by-2.7*s,bz+4*s,9.4*s,5.4*s,1.8*s,bl,.25);K.bc(bx,by,bz+4*s,2.4*s,2.4*s,4*s,wh);G.pyr(bx-1.3*s,by-1.3*s,bz+8*s,2.6*s,2.6*s,1.4*s,bl,0);w3Pennant(k,bx+3.6*s,by,bz+4*s,5*s,cuC('#f4f6fa'),s);K.hold(bx,by,6*s);}
    /* avenue pavée jusqu'au quai, bordée de réverbères */
    {const a=k.aP;for(let q=0;q<7;q++){const f=.3+q*.09,r=K.rc(a)*f;for(const sg of [-1,1]){const x=Math.cos(a)*r-Math.sin(a)*sg*2.6*s,y=Math.sin(a)*r+Math.cos(a)*sg*2.6*s,zz=K.H(x,y);if(zz<.5)continue;G.cyl(x,y,zz-.1,.07*s,2.4*s,cuC('#2e2a2a'),4,false);G.ico(x,y,zz+2.6*s,.24*s,1,cuC('#ffe8a0'),null,0);}}}}});
