/* ================= PERSONNAGES 3D (version test, PROTOTYPE) : rendu hybride à trois niveaux, sans moteur permanent =================
   Niveau 3 (gros plan)   : vrais maillages animés, mis en cache (un maillage par modèle × animation × image), dessinés par instanciation.
   Niveau 2 (plan moyen)  : sprites précalculés dans un atlas GPU, 8 directions × quelques images, fabriqués à la demande à partir des maillages.
   Niveau 1 (loin)        : silhouette de couleur (même sprite, teinté), avec la forme de l'arme.
   Le niveau est choisi d'après la hauteur du personnage en pixels à l'écran ; les passages se font en fondu (pas de saut visible).
   Hors écran ou trop petit : rien n'est calculé. Aucun effectif ni aucune règle du jeu n'est lu pour être modifié : ce module dessine. */
const PXS={on:true,mode:'full',gl:null,ext:null,fail:'',prog:null,progB:null,cache:new Map(),sets:new Map(),pages:[],bakeQ:[],inst:[],land:[],
  st:{mesh:0,spr:0,sil:0,tris:0,ms:0,frames:0,bakeMs:0,cells:0,meshes:0,drawn:0},atelier:null,CELL:80,PAGE:2048,dirtyLook:false};
try{const m=localStorage.getItem('rk-px');if(m==='fast'||m==='off'||m==='full')PXS.mode=m;}catch(_){}
const PX_SPR={walk:4,idle:1,attack:2};                         /* images de sprite par animation */
const PX_VS='attribute vec3 p;attribute vec3 n;attribute vec4 c;attribute vec4 i0;attribute vec4 i1;attribute vec4 i2;uniform vec3 eye,cr,cu,cf,sun;uniform vec4 P;uniform float bk,ol;varying vec4 vc;varying float vz;'
 +'void main(){float cy=cos(i0.w),sy=sin(i0.w);vec3 lp=(p+n*ol)*i1.x;vec3 w=vec3(lp.x*cy-lp.y*sy,lp.x*sy+lp.y*cy,lp.z)+i0.xyz;vec3 nn=vec3(n.x*cy-n.y*sy,n.x*sy+n.y*cy,n.z);'
 +'vec3 d=w-eye;float x=dot(d,cr),y=dot(d,cu),z=dot(d,cf);gl_Position=vec4(x*P.x,y*P.y,(z*(P.w+P.z)-2.*P.w*P.z)/(P.w-P.z),z);'
 +'float lm=dot(c.rgb,vec3(.3,.59,.11));vec3 base=c.a<.75?(bk>.5?vec3(lm,0.,lm):i2.rgb*lm):c.rgb;base=mix(base,vec3(1.),i1.z*.6);float df=max(dot(nn,sun),0.);float sk=.72+.16*max(0.,nn.z);'
 +'vec3 lit=base*(vec3(.64,.72,.88)*sk+vec3(1.08,.99,.84)*df*.62);float l=dot(lit,vec3(.3,.59,.11));lit=vec3(l)+(lit-vec3(l))*1.14;vc=ol>0.?vec4(.05,.04,.07,i1.y):vec4(lit,i1.y);vz=z;}';
const PX_FS='precision mediump float;varying vec4 vc;varying float vz;uniform vec3 fogc;uniform float fogd;void main(){float f=clamp((vz-fogd)/(fogd*1.6),0.,.7);vec3 col=mix(vc.rgb,fogc,f);gl_FragColor=vec4(col*vc.a,vc.a);}';
const PB_VS='attribute vec2 k;attribute vec4 b0;attribute vec4 b1;attribute vec4 b2;attribute vec4 b3;uniform vec3 eye,cr,cu,cf;uniform vec4 P;varying vec2 uv;varying vec4 bc;varying vec4 bt;varying float vz;'
 +'void main(){vec3 rt=normalize(vec3(cr.x,cr.y,0.));vec3 w=b0.xyz+rt*((k.x-.5)*b0.w)+vec3(0.,0.,(k.y-.5)*b0.w*1.435+b3.x);vec3 d=w-eye;float x=dot(d,cr),y=dot(d,cu),z=dot(d,cf);'
 +'gl_Position=vec4(x*P.x,y*P.y,(z*(P.w+P.z)-2.*P.w*P.z)/(P.w-P.z),z);uv=vec2(mix(b1.x,b1.z,k.x),mix(b1.y,b1.w,k.y));bc=b2;bt=b3;vz=z;}';
const PB_FS='precision mediump float;varying vec2 uv;varying vec4 bc;varying vec4 bt;varying float vz;uniform sampler2D T;uniform vec3 fogc;uniform float fogd;'
 +'void main(){vec4 t=texture2D(T,uv);if(t.a<.02)discard;float mn=min(t.r,t.b);float kf=clamp((.45*mn-t.g)/(.3*mn+.02),0.,1.);vec3 tc=mix(t.rgb,bc.rgb*((t.r+t.b)*.5),kf);float l=dot(tc,vec3(.3,.59,.11))/max(t.a,.01);vec3 col=mix(tc,bc.rgb*(.42+.7*l)*t.a,bt.y);float f=clamp((vz-fogd)/(fogd*1.6),0.,.7);col=mix(col,fogc*t.a,f);float a=bc.a;gl_FragColor=vec4(col*a,t.a*a);}';

function pxInit(){
  if(PXS.gl)return true;if(PXS.fail||!W3.gl)return false;
  try{
    const gl=W3.gl,ext=gl.getExtension('ANGLE_instanced_arrays');if(!ext)throw new Error('instanciation indisponible');
    const sh=(ty,src)=>{const s=gl.createShader(ty);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
    const mk=(vs,fs,names)=>{const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,vs));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,fs));names.forEach((n,i)=>gl.bindAttribLocation(p,i,n));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;};
    PXS.prog=mk(PX_VS,PX_FS,['p','n','c','i0','i1','i2']);PXS.progB=mk(PB_VS,PB_FS,['k','b0','b1','b2','b3']);PXS.ext=ext;PXS.gl=gl;
    PXS.ibuf=gl.createBuffer();PXS.bbuf=gl.createBuffer();PXS.qbuf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,PXS.qbuf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,1,0,1,1,0,0,1,1,0,1]),gl.STATIC_DRAW);
    PXS.depth=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,PXS.depth);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,PXS.PAGE,PXS.PAGE);
    return true;
  }catch(e){PXS.fail=String(e&&e.message||e);console.warn('persos 3D indisponibles :',PXS.fail);return false;}
}
/* ---------- maillages en cache ---------- */
const pxSpecKey=s=>s.cm?('c'+s.cm.i+':'+s.fac):(s.fac+':'+s.kind+':'+s.v);
function pxMesh(spec,anim,frame){
  const key=pxSpecKey(spec)+'|'+anim+frame;let m=PXS.cache.get(key);if(m)return m;
  const g=pxBuild(spec,anim,frame),n=g.P.length/3,a=new Float32Array(n*10);
  for(let i=0;i<n;i++){a[i*10]=g.P[i*3];a[i*10+1]=g.P[i*3+1];a[i*10+2]=g.P[i*3+2];a[i*10+3]=g.N[i*3];a[i*10+4]=g.N[i*3+1];a[i*10+5]=g.N[i*3+2];a[i*10+6]=g.C[i*4];a[i*10+7]=g.C[i*4+1];a[i*10+8]=g.C[i*4+2];a[i*10+9]=g.C[i*4+3];}
  const gl=PXS.gl,buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,a,gl.STATIC_DRAW);
  m={buf,n,tris:n/3,used:PXS.st.frames};PXS.cache.set(key,m);PXS.st.meshes++;return m;
}
const pxFrameOf=(anim,t)=>{const A=PX_ANIM[anim]||PX_ANIM.idle;if(A.loop){const u=((t/A.d)%1+1)%1;return Math.floor(u*A.n)%A.n;}return Math.min(A.n-1,Math.floor(Math.max(0,t)/A.d*A.n));};
/* nettoyage : on garde les maillages récemment utilisés */
function pxTrim(){if(PXS.cache.size<900)return;const gl=PXS.gl,lim=PXS.st.frames-1800;for(const [k,m] of PXS.cache)if(m.used<lim){gl.deleteBuffer(m.buf);PXS.cache.delete(k);PXS.st.meshes--;}}

/* ---------- caméra et uniformes ---------- */
function pxUniforms(pr,c,near,far,fogd){const gl=PXS.gl,u=n=>gl.getUniformLocation(pr,n);gl.uniform3fv(u('eye'),c.eye);gl.uniform3fv(u('cr'),c.r);gl.uniform3fv(u('cu'),c.u);gl.uniform3fv(u('cf'),c.f);gl.uniform4f(u('P'),1/c.tx,1/c.ty,near,far);gl.uniform3f(u('fogc'),.62,.86,.92);gl.uniform1f(u('fogd'),fogd);gl.uniform3f(u('sun'),R3_SUN[0],R3_SUN[1],R3_SUN[2]);return u;}
function pxDrawMeshes(groups,c,near,far,fogd,ol,dm){
  const gl=PXS.gl,ext=PXS.ext;gl.useProgram(PXS.prog);pxUniforms(PXS.prog,c,near,far,fogd);const uBk=gl.getUniformLocation(PXS.prog,'bk'),uOl=gl.getUniformLocation(PXS.prog,'ol');gl.uniform1f(uBk,PXS.baking?1:0);
  if(dm===undefined)dm=true;
  for(let l=0;l<6;l++)gl.enableVertexAttribArray(l);
  for(const [m,arr] of groups){if(!arr.length)continue;const ni=arr.length/12;
    gl.bindBuffer(gl.ARRAY_BUFFER,m.buf);gl.vertexAttribPointer(0,3,gl.FLOAT,false,40,0);gl.vertexAttribPointer(1,3,gl.FLOAT,false,40,12);gl.vertexAttribPointer(2,4,gl.FLOAT,false,40,24);
    ext.vertexAttribDivisorANGLE(0,0);ext.vertexAttribDivisorANGLE(1,0);ext.vertexAttribDivisorANGLE(2,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,PXS.ibuf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(arr),gl.DYNAMIC_DRAW);
    for(let q=0;q<3;q++){gl.vertexAttribPointer(3+q,4,gl.FLOAT,false,48,q*16);ext.vertexAttribDivisorANGLE(3+q,1);}
    /* contour : coque gonflée sombre dessinée d'abord SANS écrire la profondeur ; le personnage la recouvre, il n'en reste qu'un liseré */
    if(ol>0){gl.depthMask(false);gl.uniform1f(uOl,ol);ext.drawArraysInstancedANGLE(gl.TRIANGLES,0,m.n,ni);gl.uniform1f(uOl,0);gl.depthMask(dm);}
    ext.drawArraysInstancedANGLE(gl.TRIANGLES,0,m.n,ni);PXS.st.tris+=m.tris*ni*(ol>0?2:1);}
  for(let q=0;q<6;q++){ext.vertexAttribDivisorANGLE(q,0);}for(let l=2;l<6;l++)gl.disableVertexAttribArray(l);
}
/* ---------- atlas de sprites : 8 directions × (marche 4, repos 1, attaque 2) par modèle et par couleur de joueur ---------- */
function pxPage(){const gl=PXS.gl,tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,PXS.PAGE,PXS.PAGE,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  const fbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tex,0);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,PXS.depth);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);const pg={tex,fbo,n:0};PXS.pages.push(pg);return pg;}
function pxSet(key,spec,owner){
  const sk=key;let S=PXS.sets.get(sk);if(S)return S;
  const per=Math.floor(PXS.PAGE/PXS.CELL),need=8*(PX_SPR.walk+PX_SPR.idle+PX_SPR.attack);
  let pg=PXS.pages[PXS.pages.length-1];if(!pg||pg.n+need>per*per)pg=pxPage();
  S={key:sk,spec,owner,page:PXS.pages.indexOf(pg),base:pg.n,done:0,need,ready:false,used:0};pg.n+=need;PXS.sets.set(sk,S);PXS.bakeQ.push(S);return S;
}
const pxCellIdx=(S,anim,f,dir)=>{const ai=anim==='walk'?0:anim==='idle'?PX_SPR.walk:PX_SPR.walk+PX_SPR.idle,nf=PX_SPR[anim];return S.base+dir*(PX_SPR.walk+PX_SPR.idle+PX_SPR.attack)+ai+Math.min(nf-1,f);};
function pxCellUV(S,idx){const per=Math.floor(PXS.PAGE/PXS.CELL),cx=idx%per,cy=Math.floor(idx/per),P=PXS.PAGE,C=PXS.CELL;return [cx*C/P,cy*C/P,(cx+1)*C/P,(cy+1)*C/P];}
function pxBake(budgetMs){
  if(!PXS.bakeQ.length||!pxInit())return;const gl=PXS.gl,t0=performance.now();
  PXS.baking=true;const cam=w3Cam(0,0,0,.8,60),D=60,half=PX_CELL.size/2;cam.tx=cam.ty=half/D;
  const vp=gl.getParameter(gl.VIEWPORT);gl.enable(gl.SCISSOR_TEST);gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.disable(gl.BLEND);
  const per=Math.floor(PXS.PAGE/PXS.CELL);
  while(PXS.bakeQ.length&&performance.now()-t0<budgetMs){
    const S=PXS.bakeQ[0],pg=PXS.pages[S.page];gl.bindFramebuffer(gl.FRAMEBUFFER,pg.fbo);
    const all=[];for(const an of ['walk','idle','attack'])for(let f=0;f<PX_SPR[an];f++)all.push([an,f]);
    while(S.done<S.need&&performance.now()-t0<budgetMs){
      const dir=Math.floor(S.done/all.length),[an,f]=all[S.done%all.length],idx=S.base+S.done,cx=idx%per,cy=Math.floor(idx/per);
      gl.viewport(cx*PXS.CELL,cy*PXS.CELL,PXS.CELL,PXS.CELL);gl.scissor(cx*PXS.CELL,cy*PXS.CELL,PXS.CELL,PXS.CELL);gl.clearColor(0,0,0,0);gl.clearDepth(1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      const A=PX_ANIM[an],fr=Math.floor(f*A.n/PX_SPR[an]),m=pxMesh(S.spec,an,fr);
      const tint=pxTint(S.owner);gl.bindBuffer(gl.ARRAY_BUFFER,PXS.ibuf);
      pxDrawMeshes([[m,[0,0,-PX_CELL.cz,dir*Math.PI/4, 1,1,0,0, tint[0],tint[1],tint[2],0]]],cam,20,200,1e9,.05,true);pg.dirty=true;
      S.done++;PXS.st.cells++;}
    if(S.done>=S.need){S.ready=true;PXS.bakeQ.shift();}
  }
  for(const pg of PXS.pages)if(pg.dirty){pg.dirty=false;gl.bindTexture(gl.TEXTURE_2D,pg.tex);gl.generateMipmap(gl.TEXTURE_2D);}
  PXS.baking=false;gl.disable(gl.SCISSOR_TEST);gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(vp[0],vp[1],vp[2],vp[3]);
  PXS.st.bakeMs+=performance.now()-t0;
}
const pxTint=o=>r3c(typeof o==='string'?o:(COLORS[o]||'#ffffff'));

/* ---------- file d'instances et choix du niveau de détail ---------- */
/* inst : {spec, owner, x,y,z, yaw, anim, t, alpha, flash, scale, lod?} */
function pxQueue(i){PXS.inst.push(i);}
function pxFlush(c,now,opt){
  opt=opt||{};const t0=performance.now();if(!pxInit()){PXS.inst.length=0;return;}pxBake(opt.bakeMs||3);
  const gl=PXS.gl,ext=PXS.ext,cv=W3.cv,st=PXS.st;st.mesh=st.spr=st.sil=st.tris=st.drawn=0;
  const meshG=new Map(),fadeG=new Map(),shadow=[],bb=[];const maxMesh=opt.maxMesh||64;
  const list=PXS.inst;PXS.inst=[];
  /* tri par distance : les plus proches obtiennent les maillages */
  const items=[];
  for(const it of list){const p=w3Proj(it.x,it.y,it.z+.5*it.scale*PXH,c);if(!p)continue;const hpx=PXH*it.scale*p.k*((opt.vh||cv.height)/cv.height);
    if(hpx<2.2||p.sx<-60||p.sx>cv.width+60||p.sy<-60||p.sy>cv.height+90)continue;items.push({it,p,hpx});}
  items.sort((a,b)=>b.hpx-a.hpx);let nm=0;
  c.yaw0=Math.atan2(c.r[1],c.r[0]);
  const dirOf=(yaw)=>(((Math.round((yaw-c.yaw0)/(Math.PI/4))%8)+8)%8);
  for(const {it,p,hpx} of items){
    const sc=it.scale*PXH/PXM,al=it.alpha===undefined?1:it.alpha,spec=it.spec,tint=pxTint(it.owner);
    let wm;const M0=opt.meshAt||42;                                         /* seuil de passage au maillage (px) */
    wm=hpx>=M0+7?1:hpx<=M0-7?0:(hpx-(M0-7))/14;if(opt.forceMesh)wm=1;if(opt.forceSprite)wm=0;
    if(wm>0&&nm>=maxMesh)wm=0;
    const sil=opt.forceSil?1:hpx>=14?0:hpx<=9?1:1-(hpx-9)/5;
    /* ombre portée : disque sombre sur le sol */
    shadow.push(it.x,it.y,it.z,.34*sc*PXM*.5,al);
    if(wm>0){nm++;const an=it.anim||'idle',f=pxFrameOf(an,it.t||0),m=pxMesh(spec,an,f);m.used=st.frames;
      const row=[it.x,it.y,it.z+(it.lift||0),it.yaw,sc,al*wm,it.flash||0,0,tint[0],tint[1],tint[2],0],G=wm>=.999?meshG:fadeG;let a=G.get(m);if(!a){a=[];G.set(m,a);}a.push(...row);st.mesh++;}
    if(wm<.999){
      const key=pxSpecKey(spec),S=pxSet(key,spec,it.owner);S.used=st.frames;
      if(S.ready){let an=it.anim||'idle',f=0;if(an==='walk'||an==='run'){an='walk';f=Math.floor((((it.t||0)/PX_ANIM.walk.d)%1+1)%1*PX_SPR.walk);}else if(an==='attack'){f=Math.floor((((it.t||0)/PX_ANIM.attack.d)%1+1)%1*PX_SPR.attack);}else an='idle';
        const idx=pxCellIdx(S,an,f,dirOf(it.yaw)),uv=pxCellUV(S,idx),size=PX_CELL.size*sc;
        bb.push([S.page,it.x,it.y,it.z+(it.lift||0),size,uv[0],uv[1],uv[2],uv[3],al*(wm>0?1-wm*.0:1),tint[0],tint[1],tint[2],PX_CELL.cz*sc,sil,0,0]);if(sil>.5)st.sil++;else st.spr++;}
      else if(wm===0&&hpx>30&&it.t!==undefined){/* sprite pas encore prêt : maillage provisoire */const an=it.anim||'idle',f=pxFrameOf(an,it.t||0),m=pxMesh(spec,an,f);m.used=st.frames;const row=[it.x,it.y,it.z,it.yaw,sc,al,it.flash||0,0,tint[0],tint[1],tint[2],0];let a=meshG.get(m);if(!a){a=[];meshG.set(m,a);}a.push(...row);st.mesh++;}}
  }
  st.drawn=items.length;
  /* ombres */
  if(shadow.length){const n=shadow.length/5,arr=new Float32Array(n*8*3*7);let o=0;
    for(let i=0;i<n;i++){const x=shadow[i*5],y=shadow[i*5+1],z=shadow[i*5+2]+.12,r=shadow[i*5+3]*1.9,a=.3*shadow[i*5+4];
      for(let k=0;k<8;k++){const a0=k/8*6.2832,a1=(k+1)/8*6.2832,pts=[[x,y],[x+Math.cos(a0)*r,y+Math.sin(a0)*r*.8],[x+Math.cos(a1)*r,y+Math.sin(a1)*r*.8]];
        for(const q of pts){arr[o++]=q[0];arr[o++]=q[1];arr[o++]=z;arr[o++]=0;arr[o++]=.03*a;arr[o++]=.08*a;arr[o++]=a;}}}
    w3DrawArr(c,arr,true);}
  /* maillages opaques, puis fondus, puis sprites */
  gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(true);
  const far=Math.max(6000,c.D*6),fogd=c.D*1.8;
  pxDrawMeshes(meshG,c,20,far,fogd,.03,true);pxDrawMeshes(fadeG,c,20,far,fogd,.03,false);gl.depthMask(false);
  if(bb.length){gl.useProgram(PXS.progB);const u=pxUniforms(PXS.progB,c,20,far,fogd);gl.activeTexture(gl.TEXTURE0);gl.uniform1i(u('T'),0);
    bb.sort((a,b)=>a[0]-b[0]);let i=0;
    while(i<bb.length){const pg=bb[i][0];let j=i;while(j<bb.length&&bb[j][0]===pg)j++;const n=j-i,arr=new Float32Array(n*16);
      for(let q=0;q<n;q++){const b=bb[i+q];arr.set([b[1],b[2],b[3],b[4],b[5],b[6],b[7],b[8],b[10],b[11],b[12],b[9],b[13],b[14],0,0],q*16);}
      gl.bindTexture(gl.TEXTURE_2D,PXS.pages[pg].tex);gl.bindBuffer(gl.ARRAY_BUFFER,PXS.qbuf);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);ext.vertexAttribDivisorANGLE(0,0);
      gl.bindBuffer(gl.ARRAY_BUFFER,PXS.bbuf);gl.bufferData(gl.ARRAY_BUFFER,arr,gl.DYNAMIC_DRAW);for(let q=0;q<4;q++){gl.enableVertexAttribArray(1+q);gl.vertexAttribPointer(1+q,4,gl.FLOAT,false,64,q*16);ext.vertexAttribDivisorANGLE(1+q,1);}
      ext.drawArraysInstancedANGLE(gl.TRIANGLES,0,6,n);for(let q=0;q<5;q++){ext.vertexAttribDivisorANGLE(q,0);if(q>1)gl.disableVertexAttribArray(q);}i=j;}}
  gl.depthMask(true);gl.disable(gl.BLEND);for(let q=0;q<6;q++){ext.vertexAttribDivisorANGLE(q,0);gl.disableVertexAttribArray(q);}
  st.ms=performance.now()-t0;st.frames++;if(st.frames%120===0)pxTrim();
}
