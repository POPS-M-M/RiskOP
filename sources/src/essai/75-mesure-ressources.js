/* ================= MESURE DES RESSOURCES (version test uniquement · étape 0) =================
   Instrumentation PASSIVE : n'ajoute aucun calcul au rendu, ne change ni l'ordre ni le contenu des chargements ; elle observe.
   - Mémoire, en trois familles distinctes :
       · images décodées 2.5D (canevas et ImageBitmap : mémoire certaine ; balises <img> : décodage géré par le navigateur, estimation) ;
       · tampons et textures WebGL (octets réellement envoyés à la carte graphique, par île, par rôle et par niveau) ;
       · fichiers compressés gardés en mémoire par le jeu, données glTF lues conservées en JavaScript.
   - Temps : téléchargement (Resource Timing), décodage base64, lecture glTF, cartes de hauteur, construction / éclairage cuit / envoi
     des modèles 3D, génération des images 2.5D d'origine, composition des images 2.5D Blender.
   - Fluidité : intervalle entre deux images (classes, images longues > 50 ms, gels > 100 ms) avec l'événement en cours à ce moment,
     tâches longues (Long Tasks API), images d'animation longues (LoAF, Chrome), changements de niveau de détail par île.
   Consultable et copiable dans le banc ⏱ (onglets « Mémoire » et « Chargement et fluidité »). */
const MES={t0:performance.now(),ev:[],evMax:1200,gels:[],gelMax:400,hist:[0,0,0,0,0,0],nf:0,last:0,lt:[],loaf:[],res:[],
  gl:new Map(),ctxs:[],up:null,isl:{},lod:new Map(),lodN:0,lodIsl:{},monMs:0,monN:0,jal:{},b64:{n:0,ms:0},sup:{}};
const MES_B=[20,34,50,100,250];                       /* bornes des classes d'intervalle entre deux images (ms) */
const MES_ROLE=['principal','translucide','lod1','lod2'];  /* ordre des envois de tampons dans w3Upload */
const mesNow=()=>performance.now();
function mesEv(k,ile,t0,t1,info){const e={k,ile:ile||'',t0,t1,info:info||''};MES.ev.push(e);if(MES.ev.length>MES.evMax)MES.ev.shift();return e;}
function mesI(n){return MES.isl[n]||(MES.isl[n]={b:{n:0,max:0,last:null,tot:0},glb:{},jal:{}});}
function mesJal(n,k,t){const I=mesI(n);if(I.jal[k]===undefined)I.jal[k]=Math.round(t===undefined?mesNow():t);}
/* île Blender et niveau d'un glTF d'après sa taille exacte (déclarée dans le manifeste) */
function mesGlbOf(bytes){if(typeof BLX==='undefined')return [null,null];for(const [n,I] of Object.entries(BLX.isl))for(const [l,g] of Object.entries(I.m.glb||{}))if(g.octets===bytes)return [n,l];return [null,null];}

/* ---------- enveloppes de chronométrage (même résultat, mêmes arguments) ---------- */
if(typeof blxB64==='function'){const f0=blxB64;blxB64=function(s){const t=mesNow(),r=f0(s),t1=mesNow();MES.b64.n++;MES.b64.ms+=t1-t;
  if(s.length>20000){const [n,l]=mesGlbOf(r.length);mesEv('décodage base64',n,t,t1,(l||'données')+' · '+Math.round(s.length/1024)+' Ko de texte → '+Math.round(r.length/1024)+' Ko');if(n)mesI(n).glb[l]=Object.assign(mesI(n).glb[l]||{},{b64:t1-t});}
  return r;};}
if(typeof blxGlb==='function'){const f0=blxGlb;blxGlb=function(buf){const t=mesNow(),r=f0(buf),t1=mesNow(),[n,l]=mesGlbOf(buf.byteLength);
  let tri=0;for(const nd of r)tri+=(nd.I?nd.I.length:nd.P.length/3)/3;
  mesEv('lecture glTF',n,t,t1,(l||'?')+' · '+Math.round(buf.byteLength/1024)+' Ko · '+Math.round(tri)+' triangles');
  if(n){mesI(n).glb[l]=Object.assign(mesI(n).glb[l]||{},{lecture:t1-t,octets:buf.byteLength,tri:Math.round(tri)});mesJal(n,'glTF '+l+' lu',t1);}
  return r;};}
if(typeof blxHeight==='function'){const f0=blxHeight;blxHeight=function(m,which){const t=mesNow(),r=f0(m,which),t1=mesNow();mesEv('carte de hauteurs',m&&m.ile,t,t1,which);return r;};}
if(typeof blxAddNodes==='function'){const f0=blxAddNodes;blxAddNodes=function(G,nodes,lvl){const t=mesNow(),r=f0(G,nodes,lvl);if(MES.up)MES.up.conv+=mesNow()-t;return r;};}
if(typeof blxCompose==='function'){const f0=blxCompose;blxCompose=function(I,base,lvl){const t=mesNow(),r=f0(I,base,lvl),t1=mesNow();
  const n=typeof BLX!=='undefined'?(Object.entries(BLX.isl).find(([,v])=>v===I)||[''])[0]:'';mesEv('composition 2.5D',n,t,t1,r.width+'×'+r.height+' · '+(r.width*r.height*4/1048576).toFixed(1)+' Mo');return r;};}
if(typeof blxApply25==='function'){const f0=blxApply25;blxApply25=function(t,e){const k0=e&&e.blKey,t0=mesNow(),r=f0(t,e),t1=mesNow();if(e&&e.blKey!==k0)mesEv('application 2.5D',t.name,t0,t1,'clé '+e.blKey);return r;};}
if(typeof w3BuildIsland==='function'){const f0=w3BuildIsland;w3BuildIsland=function(t){const a=mesNow(),M=f0(t);if(MES.up){MES.up.geo+=mesNow()-a;MES.up.bl=!!(M&&M.bl);}return M;};}
if(typeof w3Bake==='function'){const f0=w3Bake;w3Bake=function(M,t){const a=mesNow(),B=f0(M,t);if(MES.up){MES.up.bake+=mesNow()-a;MES.up.sommets+=(B.O.length+B.T.length)/7;}return B;};}
if(typeof w3Upload==='function'){const f0=w3Upload;w3Upload=function(t,key){
  const u=MES.up={ile:t.name,geo:0,conv:0,bake:0,seq:0,octets:0,sommets:0,bl:false},a=mesNow();
  try{return f0(t,key);}finally{const b=mesNow(),tot=b-a,I=mesI(t.name),rec={tot,geo:u.geo,conv:u.conv,bake:u.bake,envoi:Math.max(0,tot-u.geo-u.bake),octets:u.octets,sommets:u.sommets,bl:u.bl,t:Math.round(b)};
    I.b.n++;I.b.tot+=tot;if(tot>I.b.max)I.b.max=tot;I.b.last=rec;I.bl=u.bl;mesJal(t.name,'premier modèle 3D construit',b);
    mesEv('construction 3D',t.name,a,b,(u.bl?'Blender':'origine')+' · '+Math.round(tot)+' ms (géométrie '+Math.round(u.geo)+', éclairage cuit '+Math.round(u.bake)+') · '+(u.octets/1048576).toFixed(1)+' Mo');MES.up=null;}};}

/* moteur 2.5D d'origine (src/js inchangé : enveloppes posées depuis ce fichier) et dessin de chaque image : seules les durées notables
   deviennent des événements, pour attribuer les images longues sans alourdir le journal */
if(typeof r25Step==='function'){const f0=r25Step;r25Step=function(budget){const n0=R25.cur&&R25.cur.name,a=mesNow(),r=f0(budget),b=mesNow();
  if(b-a>8)mesEv('génération image 2.5D (île d\'origine)',(R25.cur&&R25.cur.name)||n0,a,b,'tranche '+Math.round(b-a)+' ms');return r;};}
if(typeof draw==='function'){const f0=draw;draw=function(){const a=mesNow(),r=f0.apply(this,arguments),b=mesNow();MES.drawN=(MES.drawN||0)+1;MES.drawMs=(MES.drawMs||0)+(b-a);
  if(b-a>30)mesEv('dessin de l\'image ('+(typeof W3!=='undefined'&&W3.act?'3D':'2.5D')+')','',a,b,Math.round(b-a)+' ms');return r;};}

/* ---------- WebGL : comptabilité des tampons et textures (octets réellement envoyés) ---------- */
function mesPatchGL(gl,cv){
  if(!gl||gl.__mes)return;gl.__mes=1;const C={cv,gl,tex:new Map()};MES.ctxs.push(C);const cur={},ct={};
  const bb=gl.bindBuffer.bind(gl),bd=gl.bufferData.bind(gl),db=gl.deleteBuffer.bind(gl),bt=gl.bindTexture.bind(gl),ti=gl.texImage2D.bind(gl),dt=gl.deleteTexture.bind(gl),gm=gl.generateMipmap.bind(gl);
  gl.bindBuffer=function(tg,b){cur[tg]=b;return bb(tg,b);};
  gl.bufferData=function(tg,d,us){const b=cur[tg];if(b){const n=typeof d==='number'?d:(d&&d.byteLength)||0;let r=MES.gl.get(b);
      if(!r){r={C,octets:0,role:us===gl.DYNAMIC_DRAW?'dynamique':'autre',ile:'',bl:false};const u=MES.up;if(MES.tag){r.ile=MES.tag.ile;r.bl=true;r.role=MES.tag.role+(tg===gl.ELEMENT_ARRAY_BUFFER?' indices':' sommets');}else if(u){r.ile=u.ile;r.bl=u.bl;r.role=MES_ROLE[u.seq]||'autre';u.seq++;}MES.gl.set(b,r);}
      if(MES.up&&r.ile===MES.up.ile)MES.up.octets+=n-r.octets;r.octets=n;}
    return bd(tg,d,us);};
  gl.deleteBuffer=function(b){MES.gl.delete(b);return db(b);};
  gl.bindTexture=function(tg,x){ct[tg]=x;return bt(tg,x);};
  gl.texImage2D=function(){const x=ct[arguments[0]];if(x&&arguments[1]===0){const a=arguments,w=a.length>=9?a[3]:(a[5]&&(a[5].width||a[5].videoWidth))||0,h=a.length>=9?a[4]:(a[5]&&(a[5].height||a[5].videoHeight))||0;C.tex.set(x,{octets:w*h*4,mip:false});}
    return ti.apply(null,arguments);};
  gl.generateMipmap=function(tg){const x=ct[tg],r=x&&C.tex.get(x);if(r)r.mip=true;return gm(tg);};
  gl.deleteTexture=function(x){C.tex.delete(x);return dt(x);};
}
{const gc=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,o){const c=gc.call(this,type,o);if(c&&/webgl/.test(String(type)))try{mesPatchGL(c,this);}catch(_){}return c;};}
if(typeof W3!=='undefined'&&W3.gl)mesPatchGL(W3.gl,W3.cv);   /* contexte déjà créé avant ce module (cas improbable) : compté à partir de maintenant */

/* ---------- observateurs du navigateur ---------- */
{const sup=(typeof PerformanceObserver!=='undefined'&&PerformanceObserver.supportedEntryTypes)||[];MES.sup={longtask:sup.includes('longtask'),loaf:sup.includes('long-animation-frame'),resource:sup.includes('resource'),memoire:!!performance.memory};
  const obs=(type,f)=>{try{new PerformanceObserver(l=>{for(const e of l.getEntries())f(e);}).observe({type,buffered:true});}catch(_){}};
  if(MES.sup.longtask)obs('longtask',e=>{MES.lt.push({t:e.startTime,d:e.duration});if(MES.lt.length>500)MES.lt.shift();});
  if(MES.sup.loaf)obs('long-animation-frame',e=>{const sc=(e.scripts||[]).slice().sort((a,b)=>b.duration-a.duration).slice(0,2).map(s=>(s.sourceFunctionName||s.invoker||'?')+' '+Math.round(s.duration)+' ms');
    MES.loaf.push({t:e.startTime,d:e.duration,bloc:e.blockingDuration||0,sc:sc.join(', ')});if(MES.loaf.length>300)MES.loaf.shift();});
  if(MES.sup.resource)obs('resource',e=>{const i=e.name.indexOf('/iles/');if(i<0)return;MES.res.push({f:e.name.slice(i+6).split('?')[0],t:e.startTime,d:e.duration,fin:e.responseEnd,tr:e.transferSize||0,enc:e.encodedBodySize||0,dec:e.decodedBodySize||0,st:e.responseStatus||0});});}

/* ---------- niveau de détail affiché par île (même règle que le moteur ; calcul seul, rien n'est dessiné) ---------- */
function mesLodOf(t){
  if(typeof W3!=='undefined'&&W3.act&&W3.c&&typeof w3Proj==='function'){const p=w3Proj(t.x,t.y,4,W3.c);if(!p)return null;const cvw=W3.cv?W3.cv.width:0,cvh=W3.cv?W3.cv.height:0,mg=(1.7*t.rad+22)*p.k;
    if(!(p.sx>-mg&&p.sx<cvw+mg&&p.sy>-mg*1.3&&p.sy<cvh+mg))return null;const m=W3.models.get(t.id);if(!m)return '3D:attente';const L=R3_LOD;
    if(m.bx&&typeof BLX!=='undefined'&&BLX.isl[m.bx]){const g=BLX.isl[m.bx].g3,want=!L.on?'lod0':p.k<L.p1?'lod2':p.k<L.p2?'lod1':'lod0',o=want==='lod0'?['lod0','lod1','lod2']:want==='lod1'?['lod1','lod2','lod0']:['lod2','lod1','lod0'];for(const l of o)if(g[l]&&g[l].st==='pret')return '3D:'+l;return '3D:attente';}
    if(!L.on)return '3D:complet';if(m.alt)return '3D:'+(p.k<L.p1?'lod2':p.k<L.p2?'lod1':'lod0');return '3D:objets'+(p.k<L.p1?0:p.k<L.p2?1:p.k<L.p3?2:3);}
  if(t.x<V.x-40||t.x>V.x+W/V.k+40||t.y<V.y-40||t.y>V.y+H/V.k+40)return null;
  const e=R25.cache.get(t.id);if(!e||e.st!=='ready')return '2.5D:attente';const px=S*V.k;
  if(e.isBl&&typeof BLX!=='undefined'&&BLX.isl[t.name]){const g=BLX.isl[t.name].img,need=px>4.2?'l3':px>2.1?'l2':'l1';return '2.5D:'+(need==='l3'?(g.l3?'l3':g.l2?'l2':'l1'):need==='l2'?(g.l2?'l2':'l1'):'l1');}
  return '2.5D:'+(px>4.2?(e.full?'grande':e.mid?'moyenne':'petite'):px>2.1?(e.mid||e.full?'moyenne':'petite'):'petite');}
function mesLods(now){if(typeof terrs==='undefined')return;for(const t of terrs){const v=mesLodOf(t),p=MES.lod.get(t.id);
  if(v&&p&&v!==p&&v.slice(0,4)===p.slice(0,4)&&!/attente/.test(v+p)){MES.lodN++;MES.lodIsl[t.name]=(MES.lodIsl[t.name]||0)+1;mesEv('changement de niveau',t.name,now,now,p.slice(p.indexOf(':')+1)+' → '+v.slice(v.indexOf(':')+1));}
  if(v)MES.lod.set(t.id,v);else MES.lod.delete(t.id);}}

/* ---------- moniteur d'images : intervalle entre deux images + jalons de chargement ---------- */
function mesCause(a,b){const s=new Map();for(let i=MES.ev.length-1;i>=0;i--){const e=MES.ev[i];if(e.t1<a-1)break;if(e.t0<=b){const k=e.k+(e.ile?' · '+e.ile:'');s.set(k,(s.get(k)||0)+(e.t1-e.t0));}}
  return [...s.entries()].sort((x,y)=>y[1]-x[1]).slice(0,3).map(([k,d])=>k+(d>=1?' ('+Math.round(d)+' ms)':'')).join(' ; ');}
function mesFrame(now){const c0=mesNow();
  if(MES.last&&!document.hidden){const dt=now-MES.last;MES.nf++;let i=0;while(i<MES_B.length&&dt>MES_B[i])i++;MES.hist[i]++;
    if(dt>50){MES.gels.push({t:now,dt,cause:mesCause(MES.last,now)});if(MES.gels.length>MES.gelMax)MES.gels.shift();}}
  MES.last=document.hidden?0:now;
  /* chaque partie est isolée : une erreur interne du moniteur est comptée et affichée, sans masquer les autres mesures ni gêner le jeu */
  try{mesLods(now);}catch(err){mesErr('niveaux',err);}
  try{/* jalons, précision = une image */
    if(typeof BLX!=='undefined')for(const [n,I] of Object.entries(BLX.isl)){mesJal(n,'manifeste lu');for(const l of ['l1','l2','l3'])if(I.img[l]&&typeof I.img[l]==='object')mesJal(n,'image '+l+' prête');if(I.ready3)mesJal(n,'modèles 3D prêts');}
    if(typeof R25!=='undefined'&&R25.allReady&&MES.jal.r25===undefined)MES.jal.r25=Math.round(now);
    if(typeof W3!=='undefined'&&typeof terrs!=='undefined'&&terrs.length&&W3.models.size>=terrs.length&&MES.jal.w3===undefined)MES.jal.w3=Math.round(now);}catch(err){mesErr('jalons',err);}
  MES.monMs+=mesNow()-c0;MES.monN++;requestAnimationFrame(mesFrame);}
function mesErr(k,err){MES.errN=(MES.errN||0)+1;MES.errMsg=k+' : '+String(err&&err.message||err);}
requestAnimationFrame(mesFrame);
function mesReset(){MES.drawN=0;MES.drawMs=0;MES.hist=[0,0,0,0,0,0];MES.nf=0;MES.gels=[];MES.lodN=0;MES.lodIsl={};MES.monMs=0;MES.monN=0;MES.tReset=mesNow();}

/* ---------- instantané : mémoire, chargement, fluidité ---------- */
const mesPx=o=>{if(!o)return 0;const w=o.naturalWidth||o.width||0,h=o.naturalHeight||o.height||0;return w*h*4;};
const mesKind=o=>typeof ImageBitmap!=='undefined'&&o instanceof ImageBitmap?'bitmap':o instanceof HTMLCanvasElement?'canevas':o instanceof HTMLImageElement?'img':'autre';
function mesMem(){
  const seen=new Set(),cat={},per={};
  const add=(o,c,ile)=>{if(!o||typeof o!=='object'||seen.has(o))return;seen.add(o);const n=mesPx(o),k=mesKind(o),key=c+'|'+(k==='img'?'img':'alloué');cat[key]=(cat[key]||0)+n;if(ile){per[ile]=per[ile]||{};per[ile][key]=(per[ile][key]||0)+n;}};
  let blobO=0,blobK=0;
  if(typeof R25!=='undefined')for(const e of R25.cache.values()){const nm=e.name;
    if(e.isBl){add(e.mid,'blender_compose',nm);add(e.full,e.full&&mesKind(e.full)==='img'?'blender_img':'blender_compose',nm);add(e.small,'blender_img',nm);
      if(e.kbl){add(e.kbl.full,'origine_gardee',nm);add(e.kbl.small,'origine_gardee',nm);if(e.kbl.blob)blobK+=e.kbl.blob.size||0;}}
    else{add(e.small,'origine');add(e.mid,'origine');add(e.full,'origine');if(e.blob)blobO+=e.blob.size||0;}
    if(e.banner)add(e.banner,'origine');}
  let gltfJS=0;const gj={};
  if(typeof BLX!=='undefined')for(const [n,I] of Object.entries(BLX.isl)){for(const v of Object.values(I.img))if(v&&typeof v==='object')add(v,'blender_img',n);
    for(const v of Object.values(I.cv||{}))add(v,'blender_compose',n);
    let b=0;for(const nodes of Object.values(I.glb||{}))for(const nd of nodes)b+=(nd.P?nd.P.byteLength:0)+(nd.N?nd.N.byteLength:0)+(nd.C&&nd.C.d?nd.C.d.byteLength:0)+(nd.I?nd.I.byteLength:0);
    if(I.Hs&&I.m.hauteurs)b+=2*I.m.hauteurs.n*I.m.hauteurs.n*4;for(const z of Object.values(I.z||{}))b+=z.size||0;gj[n]=b;gltfJS+=b;}
  if(typeof R25!=='undefined'){add(R25.sea,'mer');}
  if(typeof R25G!=='undefined')for(const v of Object.values(R25G))add(v,'halos');
  /* WebGL */
  const g={total:0,tex:0,ctx:[],blender:{},origine:0,origineN:0,dyn:0,autre:0,parIle:{}};
  for(const C of MES.ctxs){let b=0,tx=0;for(const r of MES.gl.values())if(r.C===C)b+=r.octets;for(const t of C.tex.values())tx+=t.octets*(t.mip?4/3:1);
    const nom=typeof W3!=='undefined'&&C.cv===W3.cv?'monde 3D':'autre contexte (personnages, combat…)';g.ctx.push({nom,tampons:b,textures:Math.round(tx),perdu:C.gl.isContextLost&&C.gl.isContextLost()});g.total+=b;g.tex+=tx;}
  const ilesO=new Set();
  for(const r of MES.gl.values()){if(r.ile){if(r.bl){const B=g.blender[r.ile]=g.blender[r.ile]||{};B[r.role]=(B[r.role]||0)+r.octets;}else{g.origine+=r.octets;ilesO.add(r.ile);}}else if(r.role==='dynamique')g.dyn+=r.octets;else g.autre+=r.octets;}
  g.origineN=ilesO.size;
  const vis={};if(typeof W3!=='undefined')for(const t of (typeof terrs!=='undefined'?terrs:[])){const m=W3.models.get(t.id);if(m&&m.bx&&typeof BLX!=='undefined'&&BLX.isl[m.bx]){const g=BLX.isl[m.bx].g3,nv=l=>g[l]&&g[l].st==='pret'?g[l].nv:0;vis[t.name]={sommets:nv('lod0'),lod1:nv('lod1'),lod2:nv('lod2'),indexe:true,dyn:m.no};}else if(m)vis[t.name]={sommets:m.no,lod1:m.alt?m.alt[0].no:0,lod2:m.alt?m.alt[1].no:0};}
  return {img:cat,imgIle:per,blobO,blobK,gltfJS,gltfIle:gj,gl:g,sommets:vis,
    js:performance.memory?{utilise:performance.memory.usedJSHeapSize,total:performance.memory.totalJSHeapSize,limite:performance.memory.jsHeapSizeLimit}:null};}
function mesSnap(){
  const cvs=document.getElementById('map');
  const fl={images:MES.nf,classes:MES.hist.slice(),gels:MES.gels.slice(-40),lt:{n:MES.lt.length,max:Math.max(0,...MES.lt.map(x=>x.d)),total:MES.lt.reduce((a,x)=>a+x.d,0)},
    loaf:MES.loaf.slice().sort((a,b)=>b.d-a.d).slice(0,8),lodN:MES.lodN,lodIsl:Object.assign({},MES.lodIsl),surcout:MES.monN?MES.monMs/MES.monN:0,dessin:{n:MES.drawN||0,moy:MES.drawN?MES.drawMs/MES.drawN:0}};
  const b3={};for(const [n,I] of Object.entries(MES.isl))b3[n]={n:I.b.n,max:I.b.max,moy:I.b.n?I.b.tot/I.b.n:0,last:I.b.last,bl:!!I.bl,glb:I.glb,jal:I.jal};
  const r25={construites:typeof R25!=='undefined'?R25.built:0,depuisDB:typeof R25!=='undefined'?R25.fromDB:0,maxTranche:typeof R25!=='undefined'?R25.maxSlice:0,parIle:{}};
  if(typeof R25!=='undefined')for(const e of R25.cache.values())if(e.spent)r25.parIle[e.name]=e.spent;
  return {date:new Date().toISOString(),depuis:Math.round(mesNow()),ua:navigator.userAgent,ecran:{w:screen.width,h:screen.height,dpr:devicePixelRatio,canvas:cvs?cvs.width+'×'+cvs.height:'?',fenetre:innerWidth+'×'+innerHeight},
    mode:typeof W3!=='undefined'&&W3.act?'3D':'2.5D',sup:MES.sup,mem:mesMem(),fichiers:MES.res.slice(),b64:Object.assign({},MES.b64),b3,r25,jal:Object.assign({},MES.jal),
    blxErr:typeof BLX!=='undefined'?BLX.err:'',blxFormat:typeof BLX!=='undefined'?BLX.format||0:0,blxVerif:typeof BLX!=='undefined'&&BLX.verif?JSON.parse(JSON.stringify(BLX.verif)):null,err:{n:MES.errN||0,msg:MES.errMsg||''},fl};}
MES.snap=mesSnap;MES.reset=mesReset;
window.__MES=MES;   /* accès pour les tests automatisés (copie de test) */
