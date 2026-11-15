/* ================= ÎLES PRODUITES DANS BLENDER (version test) =================
   Une seule source par île (scène Blender) → deux sorties chargées ici :
   - mode 2.5D : images transparentes l1 / l2 / l3 (2, 6, 12 px par unité) + calques de ville (niveaux 2 à 4), posées
     dans le cache d'images existant (mêmes ancrages, même liseré, même écume, mêmes zones de clic) ;
   - mode 3D : modèles glTF lod0 / lod1 / lod2 (couleurs de sommets = albédo), rééclairés par le soleil du jeu,
     avec la carte des hauteurs exportée de Blender pour poser les unités.
   Les fichiers sont lus à côté de la page (dossier iles/) ; sans eux (ou en cas d'erreur), l'île garde son rendu actuel.
   Chargement progressif : l1 et le glTF lod2 d'abord, l2/l3 seulement quand le zoom les demande. */
const BLX={off:false,isl:{},base:'iles/',err:'',loaded:0};
const blxLvl=t=>t.city?t.city.lvl:0;
function blxB64(s){const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u;}
function blxHeight(m,which){
  const H=m.hauteurs,n=H.n,ext=H.ext,raw=blxB64(H[which]),u=new Uint16Array(raw.buffer,raw.byteOffset,n*n),cell=2*ext/n;
  const f=new Float32Array(n*n);for(let i=0;i<n*n;i++)f[i]=u[i]/65535*96-4;
  return (x,y)=>{const fx=(x+ext)/cell-.5,fy=(y+ext)/cell-.5;if(fx<0||fy<0||fx>n-1||fy>n-1)return -.9;const i=Math.floor(fx),j=Math.floor(fy),a=fx-i,b=fy-j,i1=Math.min(n-1,i+1),j1=Math.min(n-1,j+1);
    return f[j*n+i]*(1-a)*(1-b)+f[j*n+i1]*a*(1-b)+f[j1*n+i]*(1-a)*b+f[j1*n+i1]*a*b;};}
/* lecteur glTF binaire minimal : POSITION, NORMAL, COLOR_0, indices ; repère glTF (Y haut) → repère du jeu (x, y sud, z haut) */
function blxGlb(buf){
  const dv=new DataView(buf);if(dv.getUint32(0,true)!==0x46546C67)throw new Error('glb invalide');
  const jl=dv.getUint32(12,true),J=JSON.parse(new TextDecoder().decode(new Uint8Array(buf,20,jl))),bo=20+jl+8;
  const acc=(i)=>{const a=J.accessors[i],bv=J.bufferViews[a.bufferView],off=bo+(bv.byteOffset||0)+(a.byteOffset||0),nc={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type],n=a.count*nc;
    const T={5126:Float32Array,5125:Uint32Array,5123:Uint16Array,5121:Uint8Array}[a.componentType];const st=bv.byteStride;
    if(st&&st!==nc*T.BYTES_PER_ELEMENT){const out=new T(n),src=new DataView(buf);for(let k=0;k<a.count;k++)for(let c=0;c<nc;c++){const p=off+k*st+c*T.BYTES_PER_ELEMENT;out[k*nc+c]=T===Float32Array?src.getFloat32(p,true):T===Uint16Array?src.getUint16(p,true):T===Uint32Array?src.getUint32(p,true):src.getUint8(p);}return {d:out,nc,norm:a.normalized,T};}
    return {d:new T(buf.slice(off,off+n*T.BYTES_PER_ELEMENT)),nc,norm:a.normalized,T};};
  const nodes=[];for(const nd of J.nodes||[]){if(nd.mesh===undefined)continue;const me=J.meshes[nd.mesh];
    for(const pr of me.primitives){const P=acc(pr.attributes.POSITION),N=pr.attributes.NORMAL!==undefined?acc(pr.attributes.NORMAL):null,Cc=pr.attributes.COLOR_0!==undefined?acc(pr.attributes.COLOR_0):null,I=pr.indices!==undefined?acc(pr.indices).d:null;
      nodes.push({name:nd.name||me.name||'',P:P.d,N:N&&N.d,C:Cc,I});}}
  return nodes;}
function blxAddNodes(G,nodes,lvl){
  for(const nd of nodes){if(/^VILLE_(\d)/.test(nd.name)&&lvl<+RegExp.$1)continue;
    const P=nd.P,N=nd.N,Cc=nd.C,I=nd.I,nv=P.length/3,cs=Cc?(Cc.T===Uint16Array?65535:Cc.T===Uint8Array?255:1):1,cn=Cc?Cc.nc:4;
    const put=v=>{G.P.push(P[v*3],P[v*3+2],P[v*3+1]);if(N)G.N.push(N[v*3],N[v*3+2],N[v*3+1]);else G.N.push(0,0,1);
      if(Cc){const d=Cc.d;let r=d[v*cn]/cs,g=d[v*cn+1]/cs,b=d[v*cn+2]/cs;/* couleurs glTF linéaires → sRGB (le jeu travaille en sRGB) */r=Math.pow(r,1/2.2);g=Math.pow(g,1/2.2);b=Math.pow(b,1/2.2);G.Cl.push(r,g,b,1);}else G.Cl.push(.8,.8,.8,1);G.Tw.push(0);};
    if(I)for(let k=0;k<I.length;k++)put(I[k]);else for(let v=0;v<nv;v++)put(v);}
}
async function blxInit(){
  if(typeof fetch!=='function'||location.protocol==='file:'){BLX.err='fichiers d\'îles non accessibles (page ouverte en local)';return;}
  try{const idx=await (await fetch(BLX.base+'index.json',{cache:'no-cache'})).json();
    for(const [name,slug] of Object.entries(idx)){try{const m=await (await fetch(BLX.base+slug+'/manifest.json',{cache:'no-cache'})).json();
      const I=BLX.isl[name]={slug,m,img:{},cv:{},glb:{},ready3:false};blxImg(name,'l1');blxLoad3(name);}catch(err){console.warn('île Blender',name,err);}}}
  catch(err){BLX.err=String(err&&err.message||err);}
}
async function blxLoad3(name){
  const I=BLX.isl[name];
  /* .glb direct ; sinon copie en base64 (.glb.txt) pour les hébergements qui ne servent pas le type glTF (artefact de test) */
  const get=async f=>{let r=await fetch(BLX.base+I.slug+'/'+f).catch(()=>null);if(r&&r.ok)return r.arrayBuffer();r=await fetch(BLX.base+I.slug+'/'+f+'.txt');if(!r.ok)throw new Error('glTF introuvable');return blxB64((await r.text()).trim()).buffer;};
  for(const lod of ['lod2','lod1','lod0']){try{I.glb[lod]=blxGlb(await get(I.m.glb[lod].fichier));}catch(err){console.warn('glTF',name,lod,err);return;}}
  I.Hs=blxHeight(I.m,'sol');I.Ho=blxHeight(I.m,'obstacles');I.ready3=true;BLX.loaded++;blxRefresh(name);
}
function blxImg(name,lod,cb){const I=BLX.isl[name];if(I.img[lod]||I.img[lod+'_ld'])return;I.img[lod+'_ld']=1;
  const files=[[lod,I.m.images25d[lod].fichier]];if(lod==='l3'||lod==='l2')for(const k of Object.keys(I.m.ville25d||{}))files.push(['v'+k,I.m.ville25d[k].fichier]);
  let left=files.length;for(const [key,f] of files){const im=new Image();im.onload=()=>{I.img[key]=im;if(--left===0){I.img[lod]=I.img[lod]||im;dirty=true;}};im.onerror=()=>{left--;};im.src=BLX.base+I.slug+'/'+f;}
}
/* rafraîchit l'île dans les deux modes (bascule « avant / après » du banc de mesure, ou modèles arrivés) */
function blxRefresh(only){
  for(const name of Object.keys(BLX.isl)){if(only&&name!==only)continue;const t=terrs.find(q=>q.name===name);if(!t)continue;
    if(typeof W3!=='undefined'&&W3.gl){const m=W3.models.get(t.id);if(m){try{W3.gl.deleteBuffer(m.bo);W3.gl.deleteBuffer(m.bt);if(m.alt)for(const a of m.alt)W3.gl.deleteBuffer(a.bo);}catch(_){}W3.models.delete(t.id);}}
    const e=R25.cache.get(t.id);if(e)e.blKey='';}
  dirty=true;}
/* ---------- mode 3D : modèle glTF à la place du décor généré ---------- */
function blxBuild(t,o){
  if(BLX.off||(typeof W3!=='undefined'&&W3.cuOff))return null;const I=BLX.isl[t.name];if(!I||!I.ready3)return null;
  const lvl=blxLvl(t),mk=(nodes)=>{const G=r3Geo();blxAddNodes(G,nodes,lvl);
    const ban=(x,y,z,s)=>{if(o.owner)w3Banner(G,x,y,z,o.oc,o.crew,s||1.3);};for(const d of I.m.drapeaux||[])ban(d[0],d[1],d[2]-2.2,1.4);
    w3Rings(G,o.rc,o.oc,!!o.owner);return G;};
  const pon=I.m.ponton,pa=pon?Math.atan2(pon[1],pon[0]):o.aP;
  return {G:mk(I.glb.lod0),alts:[mk(I.glb.lod1),mk(I.glb.lod2)],tops:[],A:{H:I.Hs,rc:o.rc,R:o.R,pa},ext:I.m.cadre.ext,top:Math.max(8,I.m.sommet*.6),H:I.Ho,bl:true};
}
/* ---------- mode 2.5D : images Blender dans le cache existant ---------- */
function blxCompose(I,base,lvl){const c=document.createElement('canvas');c.width=base.width;c.height=base.height;const g=c.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(base,0,0);
  for(let k=2;k<=lvl;k++){const v=I.img['v'+k];if(v)g.drawImage(v,0,0,c.width,c.height);}return c;}
function blxApply25(t,e){
  const I=BLX.isl[t.name];if(!I)return;
  if(BLX.off||!I.img.l1){if(e.isBl){const k=e.kbl;Object.assign(e,{full:k.full,small:k.small,mid:null,meta:k.meta,fx:k.fx,blob:k.blob,banner:null});e.isBl=false;dirty=true;}return;}
  if(!e.kbl)e.kbl={full:e.full,small:e.small,meta:e.meta,fx:e.fx,blob:e.blob};
  const px=S*V.k,lvl=blxLvl(t),need=px>4.2?'l3':px>2.1?'l2':'l1';
  if(need!=='l1')blxImg(t.name,'l2');if(need==='l3')blxImg(t.name,'l3');
  const key=[lvl,!!I.img.l2,!!I.img.l3,!!I.img.v2,!!I.img.v3,!!I.img.v4].join('|');
  if(e.isBl&&e.blKey===key)return;
  const m3=I.m.images25d.l3,meta={Wc:m3.Wc,Hc:m3.Hc,C:m3.C,CY:m3.CY,K:m3.K};
  e.small=I.img.l1;e.mid=I.img.l2?blxCompose(I,I.img.l2,lvl):null;e.full=I.img.l3?blxCompose(I,I.img.l3,lvl):(e.mid||I.img.l1);
  e.meta=meta;e.blob=null;e.banner=null;
  e.fx={flags:(I.m.drapeaux||[]).map(([x,y,z])=>[t.x+x,t.y+y-z]),smoke:[],glow:[],mill:[],fountain:[]};
  e.isBl=true;e.blKey=key;dirty=true;
}
{const d0=r25Draw;r25Draw=function(t,e,now,u){try{blxApply25(t,e);}catch(err){console.warn('île Blender 2.5D',err);}return d0(t,e,now,u);};}
blxInit();
window.__BLX=BLX;   /* accès pour les tests automatisés (copie de test) */
