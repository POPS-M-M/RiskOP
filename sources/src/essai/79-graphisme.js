/* ================= PROTOTYPE GRAPHIQUE (version test, branche essai/graphisme-proto) =================
   Apparence uniquement : aucune règle, aucun effectif, aucune position de jeu, aucune île (fichiers) ni planche (pixels) n'est modifié.
   Interrupteur GFX.on (bouton « Rendu » en bas à droite, mémorisé : rk-gfx) : éteint = rendu actuel exact (fonctions d'origine appelées).
   Ce que le prototype change, scène de combat d'abord :
   1. taille de présentation des personnages au combat (GFX.hsC, commandants GFX.hsCmd) : les sprites passent de ≈ 46 px à ≈ 90 px de haut,
      donc d'une réduction ×4 de la planche à ≈ ×2 (plus de détail réel de la planche à l'écran) ; écarts des rangs et cadrage inchangés ;
   2. netteté : biais de niveau de mipmap (GFX.lb) pour ne pas descendre trop tôt vers les niveaux flous ;
   3. intégration au sol : ombre portée de la silhouette (direction du soleil des îles, R3_SUN), ombre de contact douce, assombrissement
      des pieds, légère teinte de la lumière du soleil ;
   4. marqueurs : arc fin à la couleur du camp, plus marqué devant les pieds, au lieu de l'anneau plein ; commandants : double anneau doré ;
   5. sol des îles Blender : détail procédural (grain, touffes, cailloux) seulement de près, d'après la couleur existante du sol ;
   6. ambiance de la scène de combat : vignette et léger contraste (CSS, scène de combat seulement). */
const GFX={on:true,hsC:2.0,hsCmd:2.25,lb:-.6,det:1,cap:1.25,
  set(v){GFX.on=!!v;try{localStorage.setItem('rk-gfx',GFX.on?'1':'0');}catch(_){}document.body.classList.toggle('gfx',GFX.on);gfxBtn();dirty=true;}};
try{if(localStorage.getItem('rk-gfx')==='0')GFX.on=false;}catch(_){}

/* ---------- sprites : second programme (le premier reste celui du rendu actuel) ---------- */
const GFX_VS='attribute vec2 k;attribute vec4 a0;attribute vec4 a1;attribute vec4 a2;attribute vec4 a3;uniform vec3 eye,cr,cu,cf;uniform vec4 P;uniform float bias;uniform vec2 sd;'
 +'varying vec2 uv;varying vec4 col;varying float md;varying float vz;varying vec2 q;varying float fy;'
 +'void main(){vec3 F=a0.xyz;float m=a0.w;float ox=mix(a2.x,a2.y,k.x),oy=mix(a2.z,a2.w,k.y);vec3 w;vec3 R=normalize(vec3(cr.x,cr.y,0.)),Fh=normalize(vec3(cf.x,cf.y,0.));'
 +'if(m<.5){float s=max(.2,cu.z);w=F+(cr*ox+cu*oy)*s;}'
 /* ombre portée : la silhouette couchée sur le sol, à l'opposé du soleil ; largeur perpendiculaire à l'ombre, du côté droit de l'écran */
 +'else if(m>3.5){vec3 S=normalize(vec3(sd,0.));vec3 Rs=vec3(-S.y,S.x,0.);if(dot(Rs,R)<0.)Rs=-Rs;w=F+Rs*ox+S*oy*.62;}'
 +'else{w=F+R*ox+Fh*oy;}'
 +'vec3 d=w-eye;float x=dot(d,cr),y=dot(d,cu),z=dot(d,cf);float zd=m<.5?dot(F-eye,cf)-bias:z-.004*z;'
 +'float nd=(zd*(P.w+P.z)-2.*P.w*P.z)/(P.w-P.z)/zd;gl_Position=vec4(x*P.x,y*P.y,nd*z,z);'
 +'uv=vec2(mix(a1.x,a1.z,k.x),mix(a1.w,a1.y,k.y));col=a3;md=m;vz=z;q=k*2.-1.;fy=oy;}';
const GFX_FS='precision mediump float;varying vec2 uv;varying vec4 col;varying float md;varying float vz;varying vec2 q;varying float fy;uniform sampler2D T;uniform vec3 fogc;uniform float fogd,lb,tm;'
 +'void main(){float f=clamp((vz-fogd)/(fogd*1.6),0.,.7);'
 /* sprite : pixels de la planche ; pieds un peu assombris (contact), teinte chaude du soleil (col.r = hauteur de l'assombrissement) */
 +'if(md<.5){vec4 t=texture2D(T,uv,lb);if(t.a<.01)discard;float ao=mix(.72,1.,smoothstep(0.,col.r,fy));vec3 c=t.rgb*ao*vec3(1.03,1.,.95);c=mix(c,fogc*t.a,f);gl_FragColor=vec4(c,t.a)*col.a;}'
 /* ombre de contact : tache douce */
 +'else if(md<1.5){float d=length(q);float a=exp(-d*d*3.4)*(1.-smoothstep(.85,1.,d))*col.a;if(a<.004)discard;gl_FragColor=vec4(vec3(.04,.03,.06)*a,a);}'
 /* marqueur de camp : arc fin, plein devant les pieds, discret derrière */
 +'else if(md<2.5){float d=length(q);float r=smoothstep(.78,.83,d)*(1.-smoothstep(.87,.92,d));float fr=.15+.85*smoothstep(.1,-.6,q.y);float a=r*fr*col.a;if(a<.004)discard;gl_FragColor=vec4(col.rgb*a,a);}'
 /* commandant : anneau du camp + anneau doré qui respire */
 +'else if(md<3.5){float d=length(q);float r1=smoothstep(.66,.70,d)*(1.-smoothstep(.73,.77,d));float r2=smoothstep(.86,.89,d)*(1.-smoothstep(.92,.95,d));'
 +'float p=.7+.3*sin(tm*2.6);float g=exp(-pow((d-.86)*7.,2.))*.28*p;float fr=.35+.65*smoothstep(.1,-.6,q.y);vec3 c=(vec3(1.,.8,.32)*(r2+g)+col.rgb*r1)*fr;float a=clamp(r1+r2+g,0.,1.)*fr*col.a;if(a<.004)discard;gl_FragColor=vec4(c*col.a,a);}'
 /* ombre portée : alpha de la silhouette (niveau de mipmap plus flou = ombre plus douce) */
 +'else{vec4 t=texture2D(T,uv,lb+1.5);float a=t.a*col.a*(1.-.55*clamp(fy/2.,0.,1.));if(a<.004)discard;gl_FragColor=vec4(vec3(.05,.04,.09)*a,a);}}';
function gfxProg(){
  if(GFX.prog)return GFX.prog;if(GFX.fail||!TRP.gl)return null;
  try{const gl=TRP.gl,sh=(ty,src)=>{const s=gl.createShader(ty);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
    const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,GFX_VS));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,GFX_FS));['k','a0','a1','a2','a3'].forEach((n,i)=>gl.bindAttribLocation(p,i,n));
    gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));GFX.prog=p;return p;}
  catch(e){GFX.fail=String(e&&e.message||e);console.warn('prototype graphique (sprites) indisponible :',GFX.fail);return null;}
}
/* taille de présentation : au combat seulement (le reste du jeu garde 1 dans ce premier prototype) */
{const fp0=trpFromPx;trpFromPx=function(it,c){
  if(!GFX.on||typeof B3==='undefined'||!B3.run)return fp0(it,c);
  const n=TRP.q.length;fp0(it,c);const f=TRP.q[n];if(!f)return;const cm=typeof it.spec.kind==='string'&&it.spec.kind.startsWith('c:');
  f.hs=cm?GFX.hsCmd:GFX.hsC;f.cmd=cm;f.ph=it.ph===undefined?((it.x*7.1+it.y*3.3)%1):it.ph;};}
{const tf0=trpFlush;trpFlush=function(c,now){
  if(!GFX.on||!trpInit()||!gfxProg())return tf0(c,now);
  const q=TRP.q;TRP.q=[];TRP.st.spr=0;TRP.st.gnd=0;if(!q.length)return;const t0=performance.now(),gl=TRP.gl,ext=TRP.ext;
  const spr=[],gnd=[],sh=[],cuz=Math.max(.2,c.u[2]),ts=now/1000;
  for(const f of q){
    const X=trpTex(f.asset||'marine_recrue');if(!X)continue;const D=X.D,AW=X.aw,AH=X.ah;let hs=f.hs||1;const cm=f.cmd||/^cmd_/.test(f.asset||'');
    const p=w3Proj(f.x,f.y,f.z,c);if(!p)continue;
    /* jamais plus grand que la planche : au-delà de GFX.cap × sa hauteur en pixels, l'image serait agrandie (floue) ; la taille de présentation est alors réduite */
    const h1=TRP_H*cuz*p.k;if(hs>1&&h1>0){const src=D.conv.hauteur_ref_px*GFX.cap;if(h1*hs>src)hs=Math.max(1,src/h1);}
    const hpx=h1*hs;
    if(hpx<1.6||p.sx<-80-hpx||p.sx>canvas.width+80+hpx||p.sy<-40||p.sy>canvas.height+hpx+40)continue;
    const nm=trpImg(D,f.anim,f.t),E=D.img[nm];if(!E)continue;if(TRP.mesure)(TRP.hpxL||(TRP.hpxL=[])).push(hpx);
    const [ax,ay,w,h]=E.a,[cx,cy]=E.c,al=f.al===undefined?1:f.al,u=X.upp*hs;
    /* respiration au repos : ±1,2 % en hauteur (aucune image ajoutée) */
    const br=f.anim==='garde'?1+.012*Math.sin(ts*2.4+(f.ph||0)*6.28):1;
    let L=-cx*u,Rr=(w-cx)*u,u0=ax/AW,u1=(ax+w)/AW;if(f.flip){const l=L;L=-Rr;Rr=-l;const uu=u0;u0=u1;u1=uu;}
    const B=-(h-cy)*u*br,T=cy*u*br;
    spr.push([p.z,X,f.x,f.y,f.z,0,u0,ay/AH,u1,(ay+h)/AH,L,Rr,B,T,.11*hs,1,1,al]);
    if(hpx>=3){const fw=.17*hs*(cm?1.15:1);
      gnd.push([0,X,f.x,f.y,f.z+.012,1,0,0,1,1,-fw*1.25,fw*1.25,-fw*.75,fw*.75,0,0,0,.55*al]);
      if(hpx>=8)sh.push([0,X,f.x,f.y,f.z+.010,4,u0,ay/AH,u1,(ay+h)/AH,L,Rr,0,T-B,0,0,0,.30*al]);
      if(TRP.anneau&&f.own!==undefined&&f.own!==null&&f.own!==-1){const oc=r3c(typeof f.own==='string'?f.own:(COLORS[f.own]||'#ffffff')),rr=(cm?.26:.20)*hs;
        gnd.push([0,X,f.x,f.y,f.z+.014,cm?3:2,0,0,1,1,-rr,rr,-rr*.9,rr*.9,oc[0],oc[1],oc[2],(cm?.62:.5)*al]);}}
  }
  TRP.st.spr=spr.length;TRP.st.gnd=gnd.length+sh.length;
  if(TRP.mesure){const hs=TRP.hpxL||[];TRP.st.hpx=hs.length?[Math.round(Math.min(...hs)),Math.round(hs.sort((a,b)=>a-b)[hs.length>>1]),Math.round(Math.max(...hs))]:null;TRP.hpxL=[];}
  if(!spr.length){TRP.st.ms=performance.now()-t0;return;}
  spr.sort((a,b)=>b[0]-a[0]);
  const pr=GFX.prog;gl.useProgram(pr);const U=n=>gl.getUniformLocation(pr,n),far=c.far||Math.max(6000,c.D*6);
  gl.uniform3fv(U('eye'),c.eye);gl.uniform3fv(U('cr'),c.r);gl.uniform3fv(U('cu'),c.u);gl.uniform3fv(U('cf'),c.f);gl.uniform4f(U('P'),1/c.tx,1/c.ty,c.near||20,far);
  gl.uniform3f(U('fogc'),.62,.86,.92);gl.uniform1f(U('fogd'),c.fogD||c.D*1.8);gl.uniform1f(U('bias'),TRP.biais);gl.uniform1f(U('lb'),GFX.lb);gl.uniform1f(U('tm'),ts);
  gl.uniform2f(U('sd'),-R3_SUN[0],-R3_SUN[1]);gl.activeTexture(gl.TEXTURE0);gl.uniform1i(U('T'),0);
  gl.enable(gl.DEPTH_TEST);gl.depthMask(false);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.disable(gl.CULL_FACE);
  const draw1=(rows)=>{const n=rows.length,a=new Float32Array(n*16);rows.forEach((r,i)=>a.set(r.slice(2),i*16));
    gl.bindBuffer(gl.ARRAY_BUFFER,TRP.qb);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);ext.vertexAttribDivisorANGLE(0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,TRP.ib);gl.bufferData(gl.ARRAY_BUFFER,a,gl.DYNAMIC_DRAW);
    for(let i=0;i<4;i++){gl.enableVertexAttribArray(1+i);gl.vertexAttribPointer(1+i,4,gl.FLOAT,false,64,i*16);ext.vertexAttribDivisorANGLE(1+i,1);}
    ext.drawArraysInstancedANGLE(gl.TRIANGLES,0,6,n);for(let i=1;i<5;i++){ext.vertexAttribDivisorANGLE(i,0);gl.disableVertexAttribArray(i);}};
  const draw=(rows)=>{let i=0;while(i<rows.length){const X=rows[i][1];let j=i;while(j<rows.length&&rows[j][1]===X)j++;gl.bindTexture(gl.TEXTURE_2D,X.tex);draw1(rows.slice(i,j));i=j;}};
  gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(-1,-4);
  /* ombres portées : une seule couche (le tampon de gabarit n'est pas demandé au contexte) ; puis contact et marqueurs ; puis les sprites */
  draw(sh);draw(gnd);gl.disable(gl.POLYGON_OFFSET_FILL);
  draw(spr);
  gl.depthMask(true);gl.disable(gl.BLEND);gl.disableVertexAttribArray(0);
  TRP.st.ms=performance.now()-t0;
};}

/* ---------- sol des îles Blender : détail procédural de près (programme à part ; l'original reste utilisé quand GFX est éteint) ---------- */
/* texture de bruit 256×256 qui se répète (calculée une fois) : R, G, B = bruit lissé à 3 échelles, A = petits cailloux ; deux lectures par pixel au lieu de calculs de bruit */
function gfxNoise(gl){
  if(GFX.ntex&&GFX.ntex.gl===gl)return GFX.ntex.t;const N=256,d=new Uint8Array(N*N*4);
  const lat=(n,seed)=>{const a=new Float32Array(n*n);let s=seed;for(let i=0;i<a.length;i++){s=(s*1664525+1013904223)>>>0;a[i]=s/4294967296;}return a;};
  const smp=(a,n,x,y)=>{const X=Math.floor(x),Y=Math.floor(y),fx=x-X,fy=y-Y,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),g=(i,j)=>a[((j%n+n)%n)*n+((i%n+n)%n)];
    return (g(X,Y)*(1-u)+g(X+1,Y)*u)*(1-v)+(g(X,Y+1)*(1-u)+g(X+1,Y+1)*u)*v;};
  const L=[[8,lat(8,11)],[32,lat(32,23)],[128,lat(128,37)],[64,lat(64,53)]];
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const o=(y*N+x)*4;for(let c=0;c<4;c++){const [n,a]=L[c];let v=smp(a,n,x*n/N,y*n/N);if(c===3)v=v>.86?Math.min(1,(v-.86)*14):0;d[o+c]=Math.round(v*255);}}
  const t=gl.createTexture();gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,N,N,0,gl.RGBA,gl.UNSIGNED_BYTE,d);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.generateMipmap(gl.TEXTURE_2D);gl.activeTexture(gl.TEXTURE0);
  GFX.ntex={gl,t};return t;}
const GFX_DFS='precision mediump float;varying vec4 vc;varying float vz;varying vec3 wp;uniform vec3 fogc;uniform float fogd,det;uniform sampler2D NZ;'
 +'void main(){vec3 col=vc.rgb;float nr=det*(1.-smoothstep(20.,80.,vz));'
 /* coordonnées : 1 tuile de bruit = 24 u (grandes taches) et 3,2 u (grain) ; la hauteur décale pour les murs */
 +'if(nr>.001){vec2 p=wp.xy+wp.z*vec2(.61,.37);vec4 a=texture2D(NZ,p/24.);vec4 b=texture2D(NZ,p/3.2);'
 +'float gr=clamp((col.g-max(col.r,col.b))*7.,0.,1.);float sa=clamp((col.r-col.b)*2.6-gr,0.,1.)*clamp(dot(col,vec3(.3,.59,.11))*2.4-.7,0.,1.);'
 +'col*=1.+((a.r-.5)*.18+(a.g-.5)*.10+(b.b-.5)*.09)*nr;'
 /* herbe : brins plus sombres et pointes claires ; sable / terre : grain et petits cailloux */
 +'col=mix(col,col*vec3(.80,.93,.76),gr*smoothstep(.5,.85,b.g)*nr*.7);col=mix(col,col*vec3(1.08,1.1,1.02),gr*smoothstep(.75,.95,b.b)*nr*.5);'
 +'col=mix(col,col*.78,sa*b.a*nr);col*=1.+sa*(b.b-.5)*.10*nr;}'
 +'float f=clamp((vz-fogd)/(fogd*1.6),0.,.7);col=mix(col,fogc,f);gl_FragColor=vec4(col*vc.a,vc.a);}';
{const bp0=blxProg;blxProg=function(){const P=bp0();if(!GFX.on||!GFX.det||GFX.dfail)return P;
  try{if(!P.d||P.d.gl!==P.gl){const gl=P.gl,sh=(ty,src)=>{const s=gl.createShader(ty);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
      const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,BLX_VS));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,GFX_DFS));gl.bindAttribLocation(p,P.lp,'p');gl.bindAttribLocation(p,P.lc,'c');gl.linkProgram(p);
      if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));
      const U={};for(const n of ['eye','cr','cu','cf','off','oc','P','os','olo','fogc','fogd','det','NZ'])U[n]=gl.getUniformLocation(p,n);P.d={gl,p,U,lp:P.lp,lc:P.lc,u32:P.u32};}
    const Q=P.d,gl=Q.gl,t=gfxNoise(gl);gl.useProgram(Q.p);gl.uniform1f(Q.U.det,GFX.det);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,t);gl.uniform1i(Q.U.NZ,1);gl.activeTexture(gl.TEXTURE0);return Q;}
  catch(e){GFX.dfail=String(e&&e.message||e);console.warn('prototype graphique (sol) indisponible :',GFX.dfail);return P;}};}

/* ---------- interrupteur et ambiance de la scène de combat ---------- */
function gfxBtn(){let d=document.getElementById('gfx-demo');if(!d){d=document.createElement('button');d.id='gfx-demo';d.type='button';d.textContent='Voir un combat (démo)';d.title='Rejoue une scène de combat pour juger le rendu, sans rien changer à la partie';d.addEventListener('click',e=>{e.stopPropagation();GFX.demo();});document.body.appendChild(d);}
  let b=document.getElementById('gfx-btn');if(!b){b=document.createElement('button');b.id='gfx-btn';b.type='button';b.addEventListener('click',e=>{e.stopPropagation();GFX.set(!GFX.on);});document.body.appendChild(b);}
  b.textContent='Rendu : '+(GFX.on?'prototype':'actuel')+(GFX.ms?' · '+GFX.ms.toFixed(1)+' ms/image':'');b.title='Comparer le prototype graphique et le rendu actuel';b.setAttribute('aria-pressed',GFX.on?'true':'false');}
{const st=document.createElement('style');st.textContent='#gfx-btn{position:fixed;right:14px;bottom:14px;z-index:9999;font:600 12px system-ui,sans-serif;padding:7px 11px;border-radius:9px;border:1px solid #f2c75c;background:#13202bcc;color:#f2c75c;cursor:pointer}'
  +'#gfx-btn[aria-pressed="false"]{border-color:#8aa;color:#cde}'
  +'#gfx-demo{position:fixed;right:14px;bottom:52px;z-index:9999;font:600 12px system-ui,sans-serif;padding:7px 11px;border-radius:9px;border:1px solid #6fb3d9;background:#13202bcc;color:#cfe8f7;cursor:pointer}'
    +'body.gfx.b3run #w3gl+canvas{box-shadow:inset 0 0 120px 30px rgba(10,14,24,.45)}';document.head.appendChild(st);}
document.body.classList.toggle('gfx',GFX.on);gfxBtn();
/* temps moyen entre deux images (mesuré dans le navigateur du joueur, affiché dans le bouton toutes les 2 s) */
{let last=0,acc=0,n=0,t2=0;const tick=t=>{if(last){acc+=t-last;n++;}last=t;if(t-t2>2000&&n){GFX.ms=acc/n;acc=0;n=0;t2=t;gfxBtn();}requestAnimationFrame(tick);};requestAnimationFrame(tick);}
/* ---------- démonstration (pour juger le rendu) : rejoue une scène de combat visuelle sur une île Blender, SANS rien changer à la partie.
   Le compte rendu est fabriqué pour l'affichage seulement : il n'est ni appliqué aux îles, ni ajouté à l'historique des batailles. ---------- */
GFX.demo=function(){
  if(typeof W3==='undefined'||W3.fail){toast('Monde 3D indisponible sur cet appareil : la scène de combat ne peut pas être montrée.');return;}
  if(!W3.on)w3Toggle();
  if(B3.run)b3End();
  const want=['Water 7','Alabasta','Loguetown','Syrup','Cocoyasi'];const t=want.map(n=>terrs.find(z=>z.name===n)).find(Boolean)||terrs[0];
  const f=terrs[(t.nb||[]).find(n=>terrs[n].boss===undefined)];if(!f){toast('Démonstration impossible ici.');return;}
  /* l'île doit être chargée (modèle Blender) : la caméra s'en approche, puis la scène démarre dès qu'elle est prête (15 s au plus) */
  try{V.k=Math.max(V.k||1,14);centerOn(t.id);}catch(_){}
  dirty=true;const t0=performance.now();let said=false;
  const go=()=>{const m=W3.models.get(t.id),I=m&&m.bx&&typeof BLX!=='undefined'?BLX.isl[m.bx]:null;
    if(!(W3.act&&m&&(!m.bx||(I&&(I.ready3||I.fail3))))){if(performance.now()-t0<15000){if(!said){toast('Chargement de l\'île de démonstration…');said=true;}setTimeout(go,250);return;}}
    const me=players[ME],fa=CREWS[(me&&me.crew)||0].id,def=players.find(p=>p.id!==ME&&CREWS[p.crew||0].id!==fa)||players.find(p=>p.id!==ME);
    const fd=CREWS[(def&&def.crew)||0].id,pick=fac=>Object.keys(TRP_CMD_FAC).filter(k=>TRP_CMD_FAC[k]===fac);
    const ca=pick(fa),cd=pick(fd);GFX.demoN=(GFX.demoN||0)+1;
    const r={id:900000+GFX.demoN,to:t.id,from:f.id,att:ME,def:def?def.id:-1,au:[18,8,6,0,0,0],au2:[11,5,4,0,0,0],du:[12,4,8,0,0,0],du2:[0,0,0,0,0,0],win:true,
      op:{a:ca.length?[ca[GFX.demoN%ca.length]]:[],d:cd.length?[cd[GFX.demoN%cd.length]]:[]},demo:true};
    try{if(!b3Start(r))toast('Scène de combat indisponible (scènes 3D désactivées ?).');}catch(e){console.warn('démonstration :',e);toast('Démonstration impossible : '+e.message);}};
  go();
};
window.__GFX=GFX;   /* essais : comparaison à cadrage identique */
