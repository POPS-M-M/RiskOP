/* ================= TROUPES EN SPRITES (version test) : soldat de base de la Marine pour l'unité « Recrues » (kind 0, clé « guerrier ») =================
   Apparence uniquement : effectifs, coûts, statistiques, règles, déplacements stratégiques, zones de clic et sauvegardes ne sont ni lus pour être
   modifiés ni étendus (aucun champ ajouté). L'état des figurines vit en mémoire vive (TRP), comme celui des personnages 3D (PXS).
   Convention commune à toutes les troupes en sprites : art/troupes/CONVENTION_TROUPES.md. En bref :
   • hauteur de référence TRP_H = 0,54 unité du monde (1 u ≈ 3,3 m : portes des kits Blender 0,55–0,70 u), de la semelle au sommet de la casquette
     dans la pose de garde ; même nombre d'unités par pixel pour toutes les images (aucune image n'est agrandie ou étirée à part) ;
   • le sprite est dessiné face à la caméra, sans déformation, à l'échelle uniforme qui donne à l'écran la hauteur d'un poteau vertical de 0,54 u
     planté à ses pieds (même raccourci que les murs et les portes de l'île, quelle que soit l'inclinaison de la caméra) ;
   • ancre = milieu des appuis (bottes posées), au niveau des semelles, posée sur le SOL de l'île (carte « sol » exportée de Blender, sans les toits) ;
   • profondeur : celle du point d'ancrage, avancée de 0,16 u vers la caméra (un mur devant les pieds cache le soldat, un mur derrière non) ;
   • ombre de contact : l'ellipse fournie avec la planche, à plat sur le sol ; un anneau fin à la couleur du joueur (identification du camp) ;
   • orientation : la planche ne montre le soldat que tourné vers la droite (trois quarts face) : regard à gauche = image en miroir.
   Aucune image n'est créée ni déformée : seules les poses de la planche sont affichées (animations : art/troupes/marine_recrue/troupe.json). */
const TRP={on:true,reel:true,anneau:true,gl:null,prog:null,tex:null,ok:false,fail:'',q:[],D:TRP_DATA.marine_recrue,land:[],grid:new Map(),res:new Map(),
  st:{spr:0,gnd:0,ms:0,land:0,gar:0,ilesGar:0},cap:30,vSol:1.7,vPont:1.1,biais:.16,last:0};
try{const m=localStorage.getItem('rk-trp');if(m==='0')TRP.on=false;}catch(_){}
const TRP_H=TRP.D.conv.hauteur_ref_u,TRP_UPP=TRP_H/TRP.D.conv.hauteur_ref_px,TRP_PXS=()=>TRP_H/PXH;   /* échelle des personnages 3D à la même hauteur */
const trpActif=()=>TRP.on&&!TRP.fail&&typeof W3!=='undefined'&&W3.act&&!PXS.atelier;
const trpH=(s)=>{let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return ((h>>>0)%100000)/100000;};

/* ---------- WebGL : un programme, quads instanciés (sprite face caméra, ombre et anneau à plat sur le sol) ---------- */
const TRP_VS='attribute vec2 k;attribute vec4 a0;attribute vec4 a1;attribute vec4 a2;attribute vec4 a3;uniform vec3 eye,cr,cu,cf;uniform vec4 P;uniform float bias;'
 +'varying vec2 uv;varying vec4 col;varying float md;varying float vz;varying vec2 q;'
 +'void main(){vec3 F=a0.xyz;float m=a0.w;float ox=mix(a2.x,a2.y,k.x),oy=mix(a2.z,a2.w,k.y);vec3 w;'
 /* sprite : plan face caméra, échelle uniforme cu.z (= raccourci d'un objet vertical) */
 +'if(m<.5){float s=max(.2,cu.z);w=F+(cr*ox+cu*oy)*s;}else{vec3 R=normalize(vec3(cr.x,cr.y,0.)),Fh=normalize(vec3(cf.x,cf.y,0.));w=F+R*ox+Fh*oy;}'
 +'vec3 d=w-eye;float x=dot(d,cr),y=dot(d,cu),z=dot(d,cf);float zd=m<.5?dot(F-eye,cf)-bias:z-.004*z;'
 +'float nd=(zd*(P.w+P.z)-2.*P.w*P.z)/(P.w-P.z)/zd;gl_Position=vec4(x*P.x,y*P.y,nd*z,z);'
 +'uv=vec2(mix(a1.x,a1.z,k.x),mix(a1.w,a1.y,k.y));col=a3;md=m;vz=z;q=k*2.-1.;}';
const TRP_FS='precision mediump float;varying vec2 uv;varying vec4 col;varying float md;varying float vz;varying vec2 q;uniform sampler2D T;uniform vec3 fogc;uniform float fogd;'
 +'void main(){float f=clamp((vz-fogd)/(fogd*1.6),0.,.7);'
 +'if(md<.5){vec4 t=texture2D(T,uv);if(t.a<.01)discard;vec3 c=mix(t.rgb,fogc*t.a,f);gl_FragColor=vec4(c,t.a)*col.a;}'
 +'else if(md<1.5){vec4 t=texture2D(T,uv);float a=t.a*col.a;if(a<.004)discard;gl_FragColor=vec4(vec3(.05,.04,.07)*a,a);}'
 +'else{float d=length(q);float a=smoothstep(.66,.76,d)*(1.-smoothstep(.9,1.,d))*col.a;if(a<.004)discard;gl_FragColor=vec4(col.rgb*a,a);}}';
function trpInit(){
  if(TRP.ok)return true;if(TRP.fail||!W3.gl)return false;
  try{
    const gl=W3.gl,ext=gl.getExtension('ANGLE_instanced_arrays');if(!ext)throw new Error('instanciation indisponible');
    const sh=(ty,src)=>{const s=gl.createShader(ty);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
    const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,TRP_VS));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,TRP_FS));['k','a0','a1','a2','a3'].forEach((n,i)=>gl.bindAttribLocation(p,i,n));
    gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));
    TRP.prog=p;TRP.ext=ext;TRP.gl=gl;TRP.qb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,TRP.qb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,1,0,1,1,0,0,1,1,0,1]),gl.STATIC_DRAW);TRP.ib=gl.createBuffer();
    TRP.ok=true;
    /* atlas : PNG d'origine (pixels de la planche), alpha prémultiplié au chargement (pas de liseré sombre), mipmaps pour les petites tailles */
    const im=new Image();im.onload=()=>{try{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.generateMipmap(gl.TEXTURE_2D);
      TRP.tex=t;TRP.aw=im.naturalWidth;TRP.ah=im.naturalHeight;dirty=true;}catch(e){TRP.fail=String(e&&e.message||e);}};
    im.onerror=()=>{TRP.fail='atlas illisible';};im.src=TRP.D.atlas;
    return true;
  }catch(e){TRP.fail=String(e&&e.message||e);console.warn('troupes en sprites indisponibles :',TRP.fail);return false;}
}

/* ---------- animations : uniquement les images de la planche ---------- */
function trpImg(anim,t){const A=TRP.D.anim[anim]||TRP.D.anim.garde,n=A.i.length;if(!A.ips||n===1)return A.i[0];
  const k=Math.floor(Math.max(0,t)*A.ips);return A.i[A.b?((k%n)+n)%n:Math.min(n-1,k)];}
/* figurine → file d'affichage. f : {x,y,z (pieds), anim, t (s), flip (bool), al, own (joueur ou couleur)} */
function trpPush(f){TRP.q.push(f);if(TRP.trace)TRP.trace.push([f.x,f.y,f.z,f.anim]);}
function trpFlush(c,now){
  const q=TRP.q;TRP.q=[];if(!q.length||!trpInit()||!TRP.tex)return;const t0=performance.now(),gl=TRP.gl,ext=TRP.ext,D=TRP.D,AW=TRP.aw,AH=TRP.ah;
  const spr=[],gnd=[],cuz=Math.max(.2,c.u[2]);
  for(const f of q){
    const p=w3Proj(f.x,f.y,f.z,c);if(!p)continue;const hpx=TRP_H*cuz*p.k;
    if(hpx<1.6||p.sx<-80||p.sx>canvas.width+80||p.sy<-40||p.sy>canvas.height+hpx+40)continue;
    const nm=trpImg(f.anim,f.t),E=D.img[nm];if(!E)continue;const [ax,ay,w,h]=E.a,[cx,cy]=E.c,al=f.al===undefined?1:f.al;
    let L=-cx*TRP_UPP,Rr=(w-cx)*TRP_UPP,u0=ax/AW,u1=(ax+w)/AW;if(f.flip){const l=L;L=-Rr;Rr=-l;const u=u0;u0=u1;u1=u;}
    spr.push([p.z,f.x,f.y,f.z,0,u0,ay/AH,u1,(ay+h)/AH,L,Rr,-(h-cy)*TRP_UPP,cy*TRP_UPP,1,1,1,al]);
    if(hpx>=3){const O=D.img[D.ombre],[oa,ob,ow,oh]=O.a;gnd.push([f.x,f.y,f.z+.012,1,oa/AW,ob/AH,(oa+ow)/AW,(ob+oh)/AH,-.14,.14,-.085,.085,0,0,0,.42*al]);
      if(TRP.anneau&&f.own!==undefined&&f.own!==null&&f.own!==-1){const oc=r3c(typeof f.own==='string'?f.own:(COLORS[f.own]||'#ffffff'));gnd.push([f.x,f.y,f.z+.014,2,0,0,1,1,-.2,.2,-.15,.15,oc[0],oc[1],oc[2],.6*al]);}}
  }
  TRP.st.spr=spr.length;TRP.st.gnd=gnd.length;if(!spr.length){TRP.st.ms=performance.now()-t0;return;}
  spr.sort((a,b)=>b[0]-a[0]);   /* du plus loin au plus proche */
  gl.useProgram(TRP.prog);const U=n=>gl.getUniformLocation(TRP.prog,n),far=Math.max(6000,c.D*6);
  gl.uniform3fv(U('eye'),c.eye);gl.uniform3fv(U('cr'),c.r);gl.uniform3fv(U('cu'),c.u);gl.uniform3fv(U('cf'),c.f);gl.uniform4f(U('P'),1/c.tx,1/c.ty,20,far);
  gl.uniform3f(U('fogc'),.62,.86,.92);gl.uniform1f(U('fogd'),c.D*1.8);gl.uniform1f(U('bias'),TRP.biais);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,TRP.tex);gl.uniform1i(U('T'),0);
  gl.enable(gl.DEPTH_TEST);gl.depthMask(false);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.disable(gl.CULL_FACE);
  const draw=(rows)=>{if(!rows.length)return;const n=rows.length,a=new Float32Array(n*16);rows.forEach((r,i)=>a.set(r.length===17?r.slice(1):r,i*16));
    gl.bindBuffer(gl.ARRAY_BUFFER,TRP.qb);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);ext.vertexAttribDivisorANGLE(0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,TRP.ib);gl.bufferData(gl.ARRAY_BUFFER,a,gl.DYNAMIC_DRAW);
    for(let i=0;i<4;i++){gl.enableVertexAttribArray(1+i);gl.vertexAttribPointer(1+i,4,gl.FLOAT,false,64,i*16);ext.vertexAttribDivisorANGLE(1+i,1);}
    ext.drawArraysInstancedANGLE(gl.TRIANGLES,0,6,n);for(let i=1;i<5;i++){ext.vertexAttribDivisorANGLE(i,0);gl.disableVertexAttribArray(i);}};
  gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(-1,-4);draw(gnd);gl.disable(gl.POLYGON_OFFSET_FILL);
  draw(spr);
  gl.depthMask(true);gl.disable(gl.BLEND);gl.disableVertexAttribArray(0);
  TRP.st.ms=performance.now()-t0;
}
/* regard : la planche montre le soldat tourné vers la droite de l'écran ; miroir si le regard (ou la marche) va vers la gauche de l'écran */
const trpFlipYaw=(yaw,c,prev)=>{const d=Math.cos(yaw)*c.r[0]+Math.sin(yaw)*c.r[1];return d<-.08?true:d>.08?false:!!prev;};

/* ---------- raccord avec les personnages 3D : les Recrues (kind 0) passent au sprite ; tous les personnages à la hauteur de référence ---------- */
const TRP_AN={idle:'garde',cmd:'garde',walk:'deplacement',run:'deplacement',cheer:'cri',fall:'reaction'};
function trpFromPx(it,c){
  let an=TRP_AN[it.anim]||'garde',t=it.t||0;
  if(it.anim==='attack'){const p=((t%1.3)+1.3)%1.3;if(p<.375){an='attaque';t=p;}else{an='garde';}}
  else if(it.anim==='fall'){t=(it.t||0)/((PX_ANIM.fall&&PX_ANIM.fall.d)||1)*.5;}
  let z=it.z;
  /* combat : la scène pose les soldats sur la carte « obstacles » (toits compris) ; à terre, on les repose sur le sol */
  if(typeof B3!=='undefined'&&B3.run&&B3.run.m&&B3.run.m.bx){const I=BLX.isl[B3.run.m.bx],tt=B3.run.t;if(I&&I.Hs&&I.Ho){const lx=it.x-tt.x,ly=it.y-tt.y,o=I.Ho(lx,ly);if(Math.abs(z-Math.max(0,o))<.06)z=Math.max(0,I.Hs(lx,ly));}}
  trpPush({x:it.x,y:it.y,z,anim:an,t,flip:trpFlipYaw(it.yaw||0,c),al:(it.alpha===undefined?1:it.alpha),own:it.owner});
}
{const pf0=pxFlush;
 pxFlush=function(c,now,opt){
   if(trpActif()){const keep=[];for(const it of PXS.inst){
       if(it.spec&&it.spec.kind===0&&!it.spec.cm)trpFromPx(it,c);
       else{if(TRP.reel&&!it.trpOk)it.scale=TRP_PXS()*(it.spec&&it.spec.cm?1.16:1);keep.push(it);}}
     PXS.inst=keep;}
   pf0(c,now,opt);
   if(trpActif())trpFlush(c,now);else TRP.q.length=0;
 };}

/* ---------- grille de marche d'une île : sol libre (ni eau, ni bâtiment, ni arbre, ni falaise) ---------- */
function trpGrid(t){
  const m=W3.models.get(t.id);if(!m)return null;let G=TRP.grid.get(t.id);if(G&&G.m===m)return G;
  /* îles Blender seulement : leurs cartes « sol » et « obstacles » disent où sont les bâtiments ; les îles pas encore refaites n'ont pas cette information */
  const I=m.bx&&typeof BLX!=='undefined'?BLX.isl[m.bx]:null;if(!(I&&I.Hs&&I.Ho))return null;
  const Hs=I.Hs,Ho=I.Ho,ext=Math.min(80,(t.rad||30)*1.2),cs=.4,n=Math.ceil(2*ext/cs);
  const z=new Float32Array(n*n),g=new Uint8Array(n*n);
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const x=-ext+(i+.5)*cs,y=-ext+(j+.5)*cs,h=Hs(x,y);z[j*n+i]=h;let ok=h>.06;if(ok&&Ho(x,y)-h>.1)ok=false;g[j*n+i]=ok?1:0;}
  for(let j=1;j<n-1;j++)for(let i=1;i<n-1;i++){const k=j*n+i;if(!g[k])continue;const sx=(z[k+1]-z[k-1])/(2*cs),sy=(z[k+n]-z[k-n])/(2*cs);if(sx*sx+sy*sy>.7)g[k]=0;}
  G={m,n,cs,ext,z,g,Hs};TRP.grid.set(t.id,G);return G;
}
const trpCell=(G,x,y)=>[Math.floor((x+G.ext)/G.cs),Math.floor((y+G.ext)/G.cs)];
const trpXY=(G,i,j)=>[-G.ext+(i+.5)*G.cs,-G.ext+(j+.5)*G.cs];
const trpFree=(G,i,j)=>i>=0&&j>=0&&i<G.n&&j<G.n&&G.g[j*G.n+i]===1;
function trpNear(G,x,y,maxR){const [i0,j0]=trpCell(G,x,y);if(trpFree(G,i0,j0))return [i0,j0];const R=Math.ceil((maxR||8)/G.cs);
  for(let r=1;r<=R;r++){let best=null,bd=1e9;for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){if(Math.max(Math.abs(di),Math.abs(dj))!==r)continue;if(trpFree(G,i0+di,j0+dj)){const d=di*di+dj*dj;if(d<bd){bd=d;best=[i0+di,j0+dj];}}}if(best)return best;}return null;}
/* A* (8 voisins) puis lissage par visibilité : des chemins qui contournent bâtiments, arbres et eau */
function trpPath(G,a,b){
  const n=G.n,N=n*n,s=a[1]*n+a[0],e=b[1]*n+b[0];if(s===e)return [a];
  const gS=new Float32Array(N).fill(1e9),from=new Int32Array(N).fill(-1),shut=new Uint8Array(N),H=[];gS[s]=0;
  const h=k=>{const dx=Math.abs(k%n-b[0]),dy=Math.abs((k/n|0)-b[1]);return Math.max(dx,dy)+.414*Math.min(dx,dy);};
  const push=(k,f)=>{H.push([f,k]);let i=H.length-1;while(i>0){const p=(i-1)>>1;if(H[p][0]<=H[i][0])break;[H[p],H[i]]=[H[i],H[p]];i=p;}};
  const pop=()=>{const top=H[0],l=H.pop();if(H.length){H[0]=l;let i=0;for(;;){const a2=2*i+1,b2=a2+1;let m=i;if(a2<H.length&&H[a2][0]<H[m][0])m=a2;if(b2<H.length&&H[b2][0]<H[m][0])m=b2;if(m===i)break;[H[m],H[i]]=[H[i],H[m]];i=m;}}return top;};
  push(s,h(s));let it=0;
  while(H.length&&it++<60000){const [,k]=pop();if(shut[k])continue;shut[k]=1;if(k===e)break;const ci=k%n,cj=k/n|0;
    for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const ni=ci+di,nj=cj+dj;if(!trpFree(G,ni,nj))continue;if(di&&dj&&(!trpFree(G,ci+di,cj)||!trpFree(G,ci,cj+dj)))continue;
      const nk=nj*n+ni,ng=gS[k]+(di&&dj?1.414:1);if(ng<gS[nk]){gS[nk]=ng;from[nk]=k;push(nk,ng+h(nk));}}}
  if(from[e]<0)return null;const raw=[];for(let k=e;k>=0;k=from[k]){raw.push([k%n,k/n|0]);if(k===s)break;}raw.reverse();
  const vis=(p,q)=>{const d=Math.max(Math.abs(q[0]-p[0]),Math.abs(q[1]-p[1]))*2;for(let i=1;i<d;i++){const u=i/d;if(!trpFree(G,Math.round(p[0]+(q[0]-p[0])*u),Math.round(p[1]+(q[1]-p[1])*u)))return false;}return true;};
  const out=[raw[0]];let i=0;while(i<raw.length-1){let j=raw.length-1;while(j>i+1&&!vis(raw[i],raw[j]))j--;out.push(raw[j]);i=j;}return out;
}
/* emplacement de l'armée sur l'île : une place libre près du port (ponton) ; emplacements des figurines en tache compacte autour */
function trpGarLayout(t,G){
  if(G.gar)return G.gar;const m=G.m,pa=m.pa!==undefined?m.pa:Math.PI/2;let best=null,bs=-1;
  for(const r of [.62,.7,.54,.78,.46])for(const da of [0,.25,-.25,.5,-.5]){const a=pa+da,rc=m.rc?m.rc(a):t.rad,x=Math.cos(a)*rc*r,y=Math.sin(a)*rc*r,[i0,j0]=trpCell(G,x,y);let sc=0;
    for(let dj=-6;dj<=6;dj++)for(let di=-6;di<=6;di++)if(di*di+dj*dj<=36&&trpFree(G,i0+di,j0+dj))sc++;if(sc>bs+4){bs=sc;best=[x,y];}}
  const c0=best&&trpNear(G,best[0],best[1],10);if(!c0){G.gar={slots:[]};return G.gar;}
  const n=G.n,seen=new Uint8Array(n*n),Q=[c0],slots=[];seen[c0[1]*n+c0[0]]=1;
  for(let qi=0;qi<Q.length&&slots.length<44;qi++){const [i,j]=Q[qi],[x,y]=trpXY(G,i,j);
    if(slots.every(s=>Math.hypot(s.x-x,s.y-y)>=.44)){const hj=trpH(t.id+':'+i+':'+j),xx=x+(hj-.5)*.12,yy=y+(trpH(j+':'+i)-.5)*.12;
      slots.push({x:xx,y:yy,z:Math.max(0,G.Hs(xx,yy)),face:pa+(hj-.5)*.9,ph:hj,cell:[i,j]});}
    for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const a=i+di,b=j+dj;if(trpFree(G,a,b)&&!seen[b*n+a]){seen[b*n+a]=1;Q.push([a,b]);}}}
  G.gar={slots,c0};return G.gar;
}
/* nombre de figurines pour un effectif (représentation, les effectifs réels ne changent pas) : même courbe que les personnages 3D */
const trpNb=(tot,cap)=>tot<1?0:Math.max(1,Math.min(cap||TRP.cap,Math.round(Math.pow(tot,.62)*1.1)));
function trpRoster(t,n){const counts=UK.map(k=>Math.max(0,+(t.u&&t.u[k])||0));return pxRoster(counts,n,'g'+t.id);}

/* ---------- garnison : les troupes de chaque île possédée, debout à l'emplacement de l'armée (vue rapprochée seulement) ---------- */
function trpGarrisons(c,now){
  let nI=0,nF=0;const cuz=Math.max(.2,c.u[2]),ts=now/1000;
  for(const t of terrs){if(t.owner<0||!t.u)continue;const tot=UK.reduce((a,k)=>a+Math.max(0,+t.u[k]||0),0);if(tot<1)continue;
    const p=w3Proj(t.x,t.y,0,c);if(!p||TRP_H*cuz*p.k<2.2)continue;const R=(t.rad||30)*p.k*1.3;if(p.sx<-R||p.sx>canvas.width+R||p.sy<-R||p.sy>canvas.height+R)continue;
    const G=trpGrid(t);if(!G)continue;const L=trpGarLayout(t,G);const n=Math.min(L.slots.length,trpNb(tot));if(!n)continue;
    const ros=trpRoster(t,n),resv=TRP.res.get(t.id),fac=pxCrewId(t.owner);nI++;
    for(let i=0;i<n;i++){if(resv&&resv.has(i))continue;const s=L.slots[i],r=ros[i]||{kind:0,v:0},x=t.x+s.x,y=t.y+s.y;nF++;
      if(r.kind===0)trpPush({x,y,z:s.z,anim:'garde',t:ts+s.ph*4,flip:trpFlipYaw(s.face,c,s.flip),al:1,own:t.owner});
      else PXS.inst.push({spec:{fac,kind:r.kind,v:r.v},owner:t.owner,x,y,z:s.z,yaw:s.face,anim:'idle',t:ts+s.ph*3,scale:TRP_PXS(),trpOk:1});}}
  if(TRP.extra)for(const f of TRP.extra)trpPush(Object.assign({},f,{t:f.t===undefined?ts:f.t,flip:f.yaw!==undefined?trpFlipYaw(f.yaw,c):f.flip}));   /* figurines posées à la main (essais, atelier) */
  TRP.st.ilesGar=nI;TRP.st.gar=nF;
}

/* ---------- débarquement à l'échelle : navire → passerelle → plage → chemin sur l'île → place dans l'armée ---------- */
function trpDeck(sc){const out=[];for(let x=3.2;x>=-3.0;x-=.5/sc*1.0)for(const w of [0,.42,-.42,.84,-.84]){const ww=w/sc;if(Math.abs(ww)<b3W(x)*.78)out.push([x,ww]);}return out;}
function trpLandStart(sn,opt){
  opt=opt||{};const t=terrs[sn.to],f=terrs[sn.from];if(!t||!f||!trpActif())return false;const m=W3.models.get(t.id),G=trpGrid(t);if(!m||!G)return false;
  if(TRP.land.length>=6&&!opt.force)return false;
  const L=trpGarLayout(t,G);if(!L.slots.length)return false;
  const g=pxGeom(f,t),sc=g.scS,counts=UK.map(q=>Math.max(0,+sn.u[q]||0)),tot=counts.reduce((a,b)=>a+b,0);if(tot<1)return false;
  /* garnison après l'arrivée (le calcul du jeu est déjà fait) ; les arrivants prennent des places de leur type, en partant de l'extérieur */
  const totA=UK.reduce((a,k)=>a+Math.max(0,+(t.u&&t.u[k])||0),0),nA=Math.min(L.slots.length,trpNb(opt.demo?Math.max(totA,tot):totA)),ros=opt.demo&&totA<tot?pxRoster(counts,nA,'g'+t.id):trpRoster(t,nA);
  const nL=Math.min(nA,trpNb(tot)),mine=pxRoster(counts,nL,'l'+sn.from+':'+sn.to),taken=new Set(),pick=[];
  for(const r of mine){let s=-1;for(let i=nA-1;i>=0;i--)if(!taken.has(i)&&ros[i]&&ros[i].kind===r.kind){s=i;break;}if(s<0)for(let i=nA-1;i>=0;i--)if(!taken.has(i)){s=i;break;}if(s<0)break;taken.add(s);pick.push([r,s]);}
  if(!pick.length)return false;
  /* navires (même géométrie que les traversées) : un pour 14 figurines, trois au plus ; chacun a sa passerelle */
  const nsh=Math.min(3,Math.ceil(pick.length/14)),ships=[],deck=trpDeck(sc),fac=pxCrewId(sn.owner);
  for(let i=0;i<nsh;i++){const off=(i-(nsh-1)/2)*7*g.kS,cs=Math.cos(g.hd),ss=Math.sin(g.hd),P=[g.P1[0]-ss*off,g.P1[1]+cs*off],bow=[P[0]+cs*4.2*sc,P[1]+ss*4.2*sc];
    const a=Math.atan2(bow[1]-t.y,bow[0]-t.x),rc=m.rc?m.rc(a):t.rad,e0=trpNear(G,Math.cos(a)*rc*.88,Math.sin(a)*rc*.88,6);if(!e0)return false;
    const E=trpXY(G,e0[0],e0[1]);ships.push({P,hd:g.hd,bow,E:[t.x+E[0],t.y+E[1]],e0,n:0});}
  const figs=[];
  pick.forEach(([r,slot],i)=>{const si=i%nsh,sh=ships[si],dk=deck[sh.n++%deck.length],S=L.slots[slot];
    const path=trpPath(G,sh.e0,S.cell)||[sh.e0,S.cell];
    const pts=[[null,null,null,dk],[sh.bow[0],sh.bow[1],1.0*sc],[sh.E[0],sh.E[1],Math.max(0,G.Hs(sh.E[0]-t.x,sh.E[1]-t.y))+.01]];
    for(let q=1;q<path.length;q++){const [x,y]=trpXY(G,path[q][0],path[q][1]);pts.push([t.x+x,t.y+y,Math.max(0,G.Hs(x,y))]);}
    pts.push([t.x+S.x,t.y+S.y,S.z]);
    let lenS=0;for(let q=3;q<pts.length;q++)lenS+=Math.hypot(pts[q][0]-pts[q-1][0],pts[q][1]-pts[q-1][1]);
    figs.push({kind:r.kind,v:r.v,si,dk,slot,S,pts,ph:trpH(sn.to+':'+i),t0:.6+i*.22+si*.3,vS:Math.max(TRP.vSol,lenS/12)});});   /* à terre : au plus ≈ 12 s de marche (traversée d'île) */
  const id=++TRP.last,mineS=pick.map(p=>p[1]);let rs=TRP.res.get(t.id);if(!rs){rs=new Set();TRP.res.set(t.id,rs);}mineS.forEach(i=>rs.add(i));
  TRP.land.push({id,mineS,t,g,sc,ships,figs,fac,own:sn.owner,col:COLORS[sn.owner]||'#ffffff',tt:0,lastNow:0,G,demo:!!opt.demo});TRP.st.land++;
  return true;
}
/* position d'une figurine sur son chemin à l'instant s (secondes depuis son départ) */
function trpAlong(L,fg,s,shipXY){
  const sh=L.ships[fg.si],c=Math.cos(sh.hd),sn=Math.sin(sh.hd),sc=L.sc,P=fg.pts;
  const at=(X,Y,Z)=>[X+c*fg.dk[0]*sc-sn*fg.dk[1]*sc,Y+sn*fg.dk[0]*sc+c*fg.dk[1]*sc,1.09*sc+Z];
  if(s<=0){const q=at(shipXY[0],shipXY[1],shipXY[2]);return {x:q[0],y:q[1],z:q[2],mv:false,dx:c,dy:sn};}
  const dk=at(sh.P[0],sh.P[1],0);   /* une fois parti, le chemin part du navire à quai (il ne suit plus le navire qui s'éloigne) */
  const seq=[dk].concat(P.slice(1));let d=0;
  for(let q=1;q<seq.length;q++){const a=seq[q-1],b=seq[q],len=Math.hypot(b[0]-a[0],b[1]-a[1])||.001,v=q===1?TRP.vPont:q===2?TRP.vSol:(fg.vS||TRP.vSol),dt=len/v;
    if(s<=d+dt){const u=(s-d)/dt;return {x:a[0]+(b[0]-a[0])*u,y:a[1]+(b[1]-a[1])*u,z:q>=3?Math.max(0,L.G.Hs(a[0]+(b[0]-a[0])*u-L.t.x,a[1]+(b[1]-a[1])*u-L.t.y)):a[2]+(b[2]-a[2])*u,mv:true,dx:b[0]-a[0],dy:b[1]-a[1]};}d+=dt;}
  const e=seq[seq.length-1];return {x:e[0],y:e[1],z:e[2],mv:false,done:s-d,dx:0,dy:0};
}
function trpLandings(c,now){
  const spd=(PXS.mode==='fast'?2.2:1)*(1+Math.max(0,TRP.land.length-3)*.3);
  for(let li=TRP.land.length-1;li>=0;li--){const L=TRP.land[li],dt=L.lastNow?Math.min(.1,(now-L.lastNow)/1000):0;L.lastNow=now;if(TRP.tfix!==undefined)L.tt=TRP.tfix;else L.tt+=dt*spd;const tau=L.tt;   /* tfix : temps imposé (captures des essais) */
    let allIn=true;const G3=r3Geo(),sc=L.sc;
    const shipPos=L.ships.map((sh,i)=>{const lv=L.tAll?pxE(L.tAll-1,L.tAll+1.6,tau):0,bk=lv*10*L.g.kS,x=sh.P[0]-Math.cos(sh.hd)*bk,y=sh.P[1]-Math.sin(sh.hd)*bk,tt=now/1000+i+L.id;
      pxShip(G3,x,y,sh.hd,r3c(L.col),sc,tt,L.fac);sh.lv=lv;return [x,y,Math.sin(tt*2.2+x)*.18];});
    /* passerelles (planches de la proue à la plage) tant que le navire est à quai */
    L.ships.forEach((sh,i)=>{if(sh.lv>.4)return;const zE=Math.max(0,L.G.Hs(sh.E[0]-L.t.x,sh.E[1]-L.t.y))+.03,dx=sh.E[0]-sh.bow[0],dy=sh.E[1]-sh.bow[1],l=Math.hypot(dx,dy)||1,px=-dy/l*.32,py=dx/l*.32;
      G3.quad([sh.bow[0]+px,sh.bow[1]+py,1.0*sc],[sh.bow[0]-px,sh.bow[1]-py,1.0*sc],[sh.E[0]-px,sh.E[1]-py,zE],[sh.E[0]+px,sh.E[1]+py,zE],r3c('#8a6238'));});
    for(const fg of L.figs){const s=tau-fg.t0,P=trpAlong(L,fg,s,shipPos[fg.si]);let an='garde',tt=now/1000+fg.S.ph*4,flip=fg.flip;
      if(P.mv){an=fg.kind===0?'deplacement':'walk';const d=P.dx*c.r[0]+P.dy*c.r[1];flip=d<-.02?true:d>.02?false:fg.flip;}
      else if(P.done!==undefined){if(P.done<1.4&&fg.ph>.55){an='cri';}else flip=trpFlipYaw(fg.S.face,c,fg.flip);}
      else allIn=false;
      if(!(P.done!==undefined))allIn=false;
      fg.flip=flip;
      if(fg.kind===0)trpPush({x:P.x,y:P.y,z:P.z,anim:an,t:tt,flip,al:1,own:L.own});
      else PXS.inst.push({spec:{fac:L.fac,kind:fg.kind,v:fg.v},owner:L.own,x:P.x,y:P.y,z:P.z,yaw:P.mv?Math.atan2(P.dy,P.dx):fg.S.face,anim:P.mv?'walk':(an==='cri'?'cheer':'idle'),t:P.mv?s:tt,scale:TRP_PXS(),trpOk:1});}
    if(allIn&&!L.tAll)L.tAll=tau;
    {const arr=w3Shade(G3);const a=L.tAll?1-pxE(L.tAll+.4,L.tAll+1.6,tau):1;if(a<.995)for(let v=6;v<arr.length;v+=7)arr[v]=a;w3DrawArr(c,arr,a<.995);}
    if(L.tAll&&tau>L.tAll+1.8||tau>90){TRP.land.splice(li,1);const r=TRP.res.get(L.t.id);if(r){L.mineS.forEach(i=>r.delete(i));if(!r.size)TRP.res.delete(L.t.id);}}
  }
}
{const ls0=pxLandStart;pxLandStart=function(sn,opt){try{if(trpActif()&&trpLandStart(sn,opt))return true;}catch(e){console.warn('débarquement (troupes en sprites) :',e);}return ls0(sn,opt);};}
{const ld0=pxLandings;pxLandings=function(c,now){ld0(c,now);if(!trpActif())return;try{trpGarrisons(c,now);trpLandings(c,now);if(TRP.poles&&TRP.poles.length){const G=r3Geo();for(const [x,y,z,h,col] of TRP.poles)G.box(x-.03,y-.03,z,.06,.06,h,r3c(col||'#e02020'));w3DrawArr(c,w3Shade(G),false);}}catch(e){console.warn('troupes en sprites désactivées :',e);TRP.fail=String(e&&e.message||e);}};}

/* ---------- scène de combat : rangs serrés à l'échelle des soldats, caméra plus proche, effets à leur taille (valeurs d'origine si désactivé) ---------- */
{const st0=b3Start;b3Start=function(r){const on=TRP.on&&!TRP.fail&&typeof W3!=='undefined'&&W3.act;B3.sp=on?.34:1;B3.camD=on?.45:1;B3.fx=on?.05:1;const ok=st0(r);
   /* front : place dégagée la plus vaste sur l'axe d'attaque, entre la plage et le centre (rien n'est changé au résultat de la bataille) */
   try{const Rn=B3.run;if(ok&&on&&Rn){const G=trpGrid(Rn.t);if(G){let best=null,bs=-1;const px=-Rn.dy,py=Rn.dx;
     for(const r0 of [.7,.62,.54,.46,.38,.3,.2])for(const l of [0,.12,-.12,.24,-.24,.36,-.36,.5,-.5]){const x=Rn.dx*r0*Rn.rcb+px*l*Rn.rcb,y=Rn.dy*r0*Rn.rcb+py*l*Rn.rcb,[i0,j0]=trpCell(G,x,y);let sc=0;
       for(let dj=-8;dj<=8;dj++)for(let di=-8;di<=8;di++)if(di*di+dj*dj<=64&&trpFree(G,i0+di,j0+dj))sc++;sc*=1-.5*Math.abs(l)-.2*Math.abs(r0-.55);if(sc>bs+4){bs=sc;best=[x,y];}}
     if(best&&bs>35){Rn.fx=Rn.t.x+best[0];Rn.fy=Rn.t.y+best[1];}TRP.st.front=Math.round(bs);}}}catch(e){console.warn('front (troupes en sprites) :',e);}
   return ok;};}
/* ---------- zoom : en 3D, avec les troupes à l'échelle, on peut s'approcher davantage (40 au lieu de 18 ; au-delà, le plan proche de la caméra coupe le premier plan) pour voir les soldats ---------- */
const TRP_KMAX=40;
const trpKmax=()=>(typeof W3!=='undefined'&&W3.act)?(TRP.on&&!TRP.fail?TRP_KMAX:18):3.5;
clampV=function(){V.k=clamp(V.k,1,trpKmax());V.x=clamp(V.x,0,W-W/V.k);V.y=clamp(V.y,0,H-H/V.k);};
zoomAt=function(fx,fy,f){const wx=V.x+fx*W/V.k,wy=V.y+fy*H/V.k;V.k=clamp(V.k*f,1,trpKmax());V.x=wx-fx*W/V.k;V.y=wy-fy*H/V.k;clampV();};
/* accès pour les essais automatisés (copie de test) */
window.__trpG=t=>{const G=trpGrid(t);if(G)trpGarLayout(t,G);return G;};window.__TRPst=()=>Object.assign({fail:TRP.fail,tex:!!TRP.tex,land:TRP.land.length},TRP.st);window.__TRP=TRP;
