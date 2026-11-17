/* ================= ÎLES PRODUITES DANS BLENDER (version test) =================
   Une seule source par île (scène Blender) → deux sorties chargées ici :
   - mode 2.5D : images transparentes l1 / l2 / l3 (2, 6, 12 px par unité) + calques de ville (niveaux 2 à 4), posées
     dans le cache d'images existant (mêmes ancrages, même liseré, même écume, mêmes zones de clic) ;
   - mode 3D : modèles glTF lod0 / lod1 / lod2 (couleurs de sommets = albédo), éclairés par le soleil du jeu,
     avec la carte des hauteurs exportée de Blender pour poser les unités.
   Sans ces fichiers (ou en cas d'échec), l'île garde son rendu d'origine.

   Versionnage (étape P4) : paquet « format 2 » produit par art/scripts/pack_for_game.py. Seul index.json est relu à chaque
   ouverture ; manifestes et fichiers portent une empreinte de leur contenu dans leur nom. Taille et SHA-256 de chaque fichier
   (images comprises) sont vérifiés contre le manifeste avant usage.

   SOCLE TECHNIQUE (avant la 7e île) — un gestionnaire de ressources commun aux deux modes :
   P1 · secours : un état par fichier (absent → en cours → prêt / échec), 2 nouveaux essais espacés, puis échec définitif signalé
        une seule fois. Chaîne de secours : niveau voulu complet (base + calques de ville du niveau de la partie) → meilleur niveau
        complet déjà prêt → l1 (2.5D) / lod2 (3D) → rendu d'origine. Jamais une ville d'un autre niveau que celui de la partie.
   P5 · chargement progressif : au démarrage, index + manifestes (≈ 3 Ko sans les hauteurs) + l1 seulement. Aucun fichier 3D tant
        que la 3D n'est pas affichée ; en 3D, lod2 + hauteurs de chaque île, puis lod1 / lod0 seulement pour les îles visibles dont
        la taille à l'écran l'exige (préchargés à 80 % du seuil). 4 téléchargements simultanés au plus.
   P3 · mémoire : modèles 3D gardés indexés (≈ 5 fois moins de sommets que la version dépliée), données glTF lues libérées dès
        l'envoi à la carte graphique ; images décodées hors du fil principal (createImageBitmap) ; libération des niveaux fins
        inutilisés depuis 45 s et de ceux du mode inactif après 30 s ; fichiers compressés gardés pour redécoder sans réseau.
   P6a · conquête sans gel : l'éclairage d'un modèle est cuit une fois par niveau (en tranches de quelques ms), sans la couleur du
        propriétaire ; celle-ci et le niveau de ville (plages d'indices BASE, VILLE_2, _3, _4) s'appliquent au dessin. Un changement
        de propriétaire ne reconstruit que drapeaux et liserés (quelques centaines de sommets). */
const BLX={off:false,isl:{},base:'iles/',err:'',loaded:0,format:0,verif:{ok:0,taille:0,rejets:[]},
  cfg:{essais:3,delais:[700,2500],maxDl:4,libere:45000,inactif:30000,tranche:6,budget25:96e6,budget3:64e6,recent:2000},
  dl:{n:0,q:[]},cuis:[],gl:null,stat:{req:0,essais:0,liberes25:0,liberes3:0,cuits:0}};
/* empreinte SHA-256 (hexadécimal) ; null si l'API n'est pas disponible (contexte non sécurisé) : seule la taille est alors vérifiée */
async function blxSha(buf){if(typeof crypto==='undefined'||!crypto.subtle)return null;const d=new Uint8Array(await crypto.subtle.digest('SHA-256',buf));let s='';for(const x of d)s+=(x<16?'0':'')+x.toString(16);return s;}
async function blxCheck(fichier,buf,att){
  if(buf.byteLength!==att.octets)throw new Error(fichier+' : '+buf.byteLength+' octets au lieu de '+att.octets);
  const h=await blxSha(buf);if(h===null){BLX.verif.taille++;return;}
  if(h!==att.sha256)throw new Error(fichier+' : contenu différent de celui déclaré (empreinte)');BLX.verif.ok++;}
function blxRejet(ile,fichier,err){const raison=String(err&&err.message||err);BLX.verif.rejets.push({ile,fichier:fichier||'',raison});console.warn('fichier d\'île Blender refusé',ile,raison);}
const blxLvl=t=>t.city?t.city.lvl:0;
const blxNow=()=>performance.now();
function blxB64(s){const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u;}

/* ---------- fichiers : état par fichier, nouveaux essais, file de téléchargement bornée (P1, P5) ---------- */
function blxSlot(){return new Promise(r=>{if(BLX.dl.n<BLX.cfg.maxDl){BLX.dl.n++;r();}else BLX.dl.q.push(r);});}
function blxFree(){const r=BLX.dl.q.shift();if(r)r();else BLX.dl.n--;}
async function blxOnce(I,nom){
  await blxSlot();BLX.stat.req++;
  try{
    if(BLX.format===2){const d=I.m.fichiers&&I.m.fichiers[nom];if(!d)throw new Error('fichier non déclaré dans le manifeste : '+nom);
      const r=await fetch(BLX.base+I.slug+'/'+nom);if(!r.ok)throw new Error(nom+' introuvable ('+r.status+')');
      const buf=d.encodage==='base64'?blxB64((await r.text()).trim()).buffer:await r.arrayBuffer();await blxCheck(nom,buf,d);return buf;}
    /* format 1 (ancien paquet, noms fixes, sans vérification) ; copie base64 .txt pour les hébergements qui ne servent pas le type glTF */
    let r=await fetch(BLX.base+I.slug+'/'+nom).catch(()=>null);if(r&&r.ok)return await r.arrayBuffer();
    if(/\.glb$/.test(nom)){r=await fetch(BLX.base+I.slug+'/'+nom+'.txt');if(r.ok)return blxB64((await r.text()).trim()).buffer;}
    throw new Error(nom+' introuvable'+(r?' ('+r.status+')':''));}
  finally{blxFree();}}
/* contenu vérifié d'un fichier ; au plus BLX.cfg.essais tentatives espacées ; un échec définitif n'est signalé qu'une fois */
function blxFetch(name,nom){
  const I=BLX.isl[name],F=I.f[nom]||(I.f[nom]={st:'absent',n:0,p:null});
  if(F.st==='echec')return Promise.reject(new Error(F.err));
  if(F.p)return F.p;F.st='en cours';
  F.p=(async()=>{for(;;){try{const b=await blxOnce(I,nom);F.st='pret';F.p=null;return b;}
    catch(err){F.n++;BLX.stat.essais++;if(F.n>=BLX.cfg.essais){F.st='echec';F.err=String(err&&err.message||err);F.p=null;blxRejet(name,nom,err);throw err;}
      await new Promise(r=>setTimeout(r,BLX.cfg.delais[F.n-1]||2500));}}})();
  return F.p;}

/* ---------- index et manifestes ---------- */
async function blxInit(){
  if(typeof fetch!=='function'||location.protocol==='file:'){BLX.err='fichiers d\'îles non accessibles (page ouverte en local)';return;}
  const add=(name,slug,m)=>{BLX.isl[name]={slug,m,f:{},img:{},cv:{},z:{},u25:{},img_ld:{},g3:{},u3:{},ready3:false,fail3:false,Hs:null,Ho:null,ys:0};blxImg(name,'l1');
    /* manifeste arrivé après la construction de l'île en 3D (partie ouverte directement en 3D) : demander son modèle */
    if(typeof W3!=='undefined'&&W3.gl&&!BLX.off&&!W3.cuOff)blxWant3(name,'lod2');};
  try{const r=await fetch(BLX.base+'index.json',{cache:'no-cache'});if(!r.ok)throw new Error('index.json introuvable ('+r.status+')');const idx=await r.json();
    if(idx&&idx.format===2){BLX.format=2;
      /* manifestes lus en parallèle (chacun est petit et vérifié contre l'index) */
      await Promise.all(Object.entries(idx.iles||{}).map(async([name,e])=>{try{
        let buf=null,last=null;for(let k=0;k<BLX.cfg.essais&&!buf;k++){try{const q=await fetch(BLX.base+e.dossier+'/'+e.manifeste);if(!q.ok)throw new Error(e.manifeste+' introuvable ('+q.status+')');buf=await q.arrayBuffer();}
          catch(err){last=err;if(k+1<BLX.cfg.essais)await new Promise(z=>setTimeout(z,BLX.cfg.delais[k]||2500));}}
        if(!buf)throw last;await blxCheck(e.manifeste,buf,e);const m=JSON.parse(new TextDecoder().decode(buf));
        if(m.format!==2||m.ile!==name||String(m.version)!==String(e.version))throw new Error('manifeste incohérent avec l\'index (île, format ou version)');
        for(const g of ['images25d','ville25d','glb'])for(const ref of Object.values(m[g]||{}))if(!m.fichiers||!m.fichiers[ref.fichier])throw new Error('fichier non déclaré dans le manifeste : '+ref.fichier);
        if(m.hauteurs&&m.hauteurs.fichier&&!m.fichiers[m.hauteurs.fichier])throw new Error('fichier non déclaré dans le manifeste : '+m.hauteurs.fichier);
        add(name,e.dossier,m);}catch(err){blxRejet(name,e&&e.manifeste,err);}}));}
    else{BLX.format=1;   /* ancien paquet : lu comme avant l'étape P4 */
      for(const [name,slug] of Object.entries(idx)){try{const m=await (await fetch(BLX.base+slug+'/manifest.json',{cache:'no-cache'})).json();add(name,slug,m);}catch(err){console.warn('île Blender',name,err);}}}
    dirty=true;}
  catch(err){BLX.err=String(err&&err.message||err);}
}

/* ---------- mode 2.5D : images ---------- */
/* image décodée hors du fil principal ; le fichier compressé reste gardé (I.z) pour redécoder après libération sans réseau */
async function blxDecode(blob){if(typeof createImageBitmap==='function')return await createImageBitmap(blob);
  const u=URL.createObjectURL(blob);try{const im=new Image();im.src=u;await im.decode();return im;}finally{setTimeout(()=>URL.revokeObjectURL(u),0);}}
function blxImg(name,key){
  const I=BLX.isl[name];if(!I||I.img[key]||I.img_ld[key])return;
  const ref=key==='l1'||key==='l2'||key==='l3'?I.m.images25d&&I.m.images25d[key]:I.m.ville25d&&I.m.ville25d[key.slice(1)];
  if(!ref){I.img_ld[key]='echec';return;}
  I.img_ld[key]='en cours';
  (async()=>{try{if(!I.z[key])I.z[key]=new Blob([await blxFetch(name,ref.fichier)],{type:'image/webp'});
      const im=await blxDecode(I.z[key]);if(I.img_ld[key]!=='en cours'){if(im.close)im.close();return;}I.img[key]=im;I.img_ld[key]='';if(key==='l1')delete I.z.l1;   /* l1 n'est jamais libéré : inutile de garder son fichier */
      dirty=true;}
    catch(err){I.img_ld[key]='echec';dirty=true;}})();}
const blxFailed=(I,key)=>I.img_ld[key]==='echec';
/* calques de ville nécessaires au niveau de la partie (ceux que le manifeste déclare) */
const blxVilles=(I,lvl)=>{const v=[];for(let k=2;k<=lvl;k++)if(I.m.ville25d&&I.m.ville25d[k])v.push('v'+k);return v;};
function blxComplete(I,lod,lvl){if(!I.img[lod])return false;if(lod==='l1')return true;return blxVilles(I,lvl).every(k=>I.img[k]);}
function blxBroken(I,lod,lvl){if(blxFailed(I,lod))return true;if(lod==='l1')return false;return blxVilles(I,lvl).some(k=>blxFailed(I,k));}
function blxWant25(name,lod,lvl){const I=BLX.isl[name];if(!I.img[lod]&&!I.img_ld[lod]&&!blxRoom25())return;blxImg(name,lod);if(lod!=='l1')for(const k of blxVilles(I,lvl))blxImg(name,k);}
function blxCompose(I,base,lvl){const c=document.createElement('canvas');c.width=base.width;c.height=base.height;const g=c.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(base,0,0);
  for(const k of blxVilles(I,lvl))g.drawImage(I.img[k],0,0,c.width,c.height);return c;}
/* image composée (base + calques de ville du niveau de la partie), gardée tant que ses images sources le sont */
function blxComp(I,lod,lvl){const k=lod+'|'+lvl;for(const k2 of Object.keys(I.cv))if(k2!==k&&k2.startsWith(lod+'|'))delete I.cv[k2];return I.cv[k]||(I.cv[k]=blxCompose(I,I.img[lod],lvl));}
function blxRestore25(e){if(!e.isBl)return;const k=e.kbl;Object.assign(e,{full:k.full,small:k.small,mid:null,meta:k.meta,fx:k.fx,blob:k.blob,banner:null});e.isBl=false;e.blKey='';dirty=true;}
function blxApply25(t,e){
  const I=BLX.isl[t.name];if(!I)return;
  if(BLX.off){blxRestore25(e);return;}
  const px=S*V.k,lvl=blxLvl(t),now=blxNow(),need=px>4.2?'l3':px>2.1?'l2':'l1',l1bad=blxFailed(I,'l1');
  /* chaîne de secours : niveau voulu, puis l'autre niveau fin, puis l1 ; un niveau cassé (base ou calque de ville en échec) est sauté ;
     si l1 manque, un niveau fin sert aussi de petite image */
  const order=need==='l3'?['l3','l2']:need==='l2'?['l2','l3']:l1bad?['l2','l3']:[];
  const ok=l=>!blxBroken(I,l,lvl)&&blxComplete(I,l,lvl);
  let fine=null;for(const lod of order){if(blxBroken(I,lod,lvl))continue;blxWant25(t.name,lod,lvl);if(ok(lod)){fine=lod;break;}}
  for(const lod of order)if(I.img[lod])I.u25[lod]=now;
  const l1=!l1bad&&I.img.l1?I.img.l1:null;
  if(!l1&&!fine){if(l1bad&&order.every(l=>blxBroken(I,l,lvl)))blxRestore25(e);return;}   /* rien d'affichable : rendu d'origine (ou attente) */
  if(!e.kbl)e.kbl={full:e.full,small:e.small,meta:e.meta,fx:e.fx,blob:e.blob};
  const key=[lvl,!!l1,ok('l2'),ok('l3')].join('|');
  if(e.isBl&&e.blKey===key)return;
  const m3=I.m.images25d.l3,meta={Wc:m3.Wc,Hc:m3.Hc,C:m3.C,CY:m3.CY,K:m3.K};
  const mid=ok('l2')?blxComp(I,'l2',lvl):null,full=ok('l3')?blxComp(I,'l3',lvl):null;
  e.small=l1||mid||full;e.mid=mid;e.full=full||mid||e.small;
  e.meta=meta;e.blob=null;e.banner=null;
  e.fx={flags:(I.m.drapeaux||[]).map(([x,y,z])=>[t.x+x,t.y+y-z]),smoke:[],glow:[],mill:[],fountain:[]};
  e.isBl=true;e.blKey=key;I.vu25=(full?'l3':'')+(mid?'l2':'')+(l1?'l1':'');dirty=true;
}
{const d0=r25Draw;r25Draw=function(t,e,now,u){try{blxApply25(t,e);}catch(err){console.warn('île Blender 2.5D',err);}return d0(t,e,now,u);};}

/* ---------- mode 3D ---------- */
function blxHeightArr(n,ext,u){const cell=2*ext/n;u=new Uint16Array(u);   /* gardé en entiers 16 bits (2 octets par point) */
  const F=i=>Math.fround(u[i]/65535*96-4);   /* même valeur que l'ancien tableau en flottants 32 bits */
  return (x,y)=>{const fx=(x+ext)/cell-.5,fy=(y+ext)/cell-.5;if(fx<0||fy<0||fx>n-1||fy>n-1)return -.9;const i=Math.floor(fx),j=Math.floor(fy),a=fx-i,b=fy-j,i1=Math.min(n-1,i+1),j1=Math.min(n-1,j+1);
    return F(j*n+i)*(1-a)*(1-b)+F(j*n+i1)*a*(1-b)+F(j1*n+i)*(1-a)*b+F(j1*n+i1)*a*b;};}
/* hauteurs incluses dans le manifeste (paquets d'avant le socle) */
function blxHeight(m,which){const H=m.hauteurs,raw=blxB64(H[which]);return blxHeightArr(H.n,H.ext,new Uint16Array(raw.buffer,raw.byteOffset,H.n*H.n));}
async function blxHeights(name){
  const I=BLX.isl[name],H=I.m.hauteurs;if(I.Hs)return;
  if(!H.fichier){I.Hs=blxHeight(I.m,'sol');I.Ho=blxHeight(I.m,'obstacles');return;}
  const buf=await blxFetch(name,H.fichier),nn=H.n*H.n;
  I.Hs=blxHeightArr(H.n,H.ext,new Uint16Array(buf,H.sol[0],nn));I.Ho=blxHeightArr(H.n,H.ext,new Uint16Array(buf,H.obstacles[0],nn));}
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
/* maillage indexé rangé par plage de ville : BASE, puis VILLE_2, VILLE_3, VILLE_4 (le niveau de ville choisit combien d'indices dessiner) */
function blxMesh(nodes){
  const grp=n=>/^VILLE_(\d)/.test(n.name)?+RegExp.$1:1,ord=nodes.slice().sort((a,b)=>grp(a)-grp(b));
  let nv=0,ni=0;for(const nd of ord){nv+=nd.P.length/3;ni+=nd.I?nd.I.length:nd.P.length/3;}
  const P=new Float32Array(nv*3),N=new Float32Array(nv*3),C=new Float32Array(nv*3),I=new Uint32Array(ni),fin={1:0,2:0,3:0,4:0},vgrp=new Uint8Array(nv);
  let v0=0,i0=0;
  for(const nd of ord){const n=nd.P.length/3,Cc=nd.C,cs=Cc?(Cc.T===Uint16Array?65535:Cc.T===Uint8Array?255:1):1,cn=Cc?Cc.nc:4;
    for(let v=0;v<n;v++){const o=(v0+v)*3;P[o]=nd.P[v*3];P[o+1]=nd.P[v*3+2];P[o+2]=nd.P[v*3+1];
      if(nd.N){N[o]=nd.N[v*3];N[o+1]=nd.N[v*3+2];N[o+2]=nd.N[v*3+1];}else{N[o]=0;N[o+1]=0;N[o+2]=1;}
      /* couleurs glTF linéaires → sRGB (le jeu travaille en sRGB) */
      if(Cc){const d=Cc.d;C[o]=Math.pow(d[v*cn]/cs,1/2.2);C[o+1]=Math.pow(d[v*cn+1]/cs,1/2.2);C[o+2]=Math.pow(d[v*cn+2]/cs,1/2.2);}else{C[o]=.8;C[o+1]=.8;C[o+2]=.8;}}
    if(nd.I)for(let k=0;k<nd.I.length;k++)I[i0+k]=v0+nd.I[k];else for(let k=0;k<n;k++)I[i0+k]=v0+k;
    const g=grp(nd);vgrp.fill(g,v0,v0+n);v0+=n;i0+=nd.I?nd.I.length:n;for(let L=g;L<=4;L++)fin[L]=i0;}
  /* plage d'un niveau = fin de son groupe ; un niveau sans calque garde la plage du niveau inférieur */
  for(let L=2;L<=4;L++)if(fin[L]<fin[L-1])fin[L]=fin[L-1];
  return {P,N,C,I,nv,ni,fin,vgrp};}
/* cuisson en tranches : même éclairage que w3Bake (fonction w3Lit partagée), sans la teinte du propriétaire ;
   4e composante = poids « sol » (faces tournées vers le haut) qui reçoit la teinte au dessin */
function blxCuire(name,lod,mesh){
  return new Promise((ok,ko)=>{const I=BLX.isl[name];
    if(!I.hAt)I.hAt=w3HF({H:I.Ho,tops:[],ext:I.m.cadre.ext});
    const hAt=I.hAt,O=new Float32Array(mesh.nv*7),q=[0,0,0,0],ysL=[0,0,0,0,0];let v=0;
    const step=()=>{const t0=blxNow();try{
        for(;v<mesh.nv&&blxNow()-t0<BLX.cfg.tranche;v++){const o=v*3,x=mesh.P[o],y=mesh.P[o+1],z=mesh.P[o+2];
          w3Lit(hAt,x,y,z,mesh.N[o],mesh.N[o+1],mesh.N[o+2],mesh.C[o],mesh.C[o+1],mesh.C[o+2],false,q,0);
          const k=v*7;O[k]=x;O[k+1]=y;O[k+2]=z;O[k+3]=q[0];O[k+4]=q[1];O[k+5]=q[2];O[k+6]=q[3]>.55?Math.min(1,(q[3]-.55)/.3):0;
          if(z>.4){const g=mesh.vgrp[v];for(let L=g;L<=4;L++)if(y>ysL[L])ysL[L]=y;}}
        if(v<mesh.nv){setTimeout(step,0);return;}
        ok({O,ysL});}catch(err){ko(err);}};
    setTimeout(step,0);});}
const BLX_VS='attribute vec3 p;attribute vec4 c;uniform vec3 eye,cr,cu,cf,off,oc;uniform vec4 P;uniform float os,olo;varying vec4 vc;varying float vz;varying vec3 wp;'
 +'void main(){vec3 q=p+off,d=q-eye;float x=dot(d,cr),y=dot(d,cu),z=dot(d,cf);gl_Position=vec4(x*P.x,y*P.y,(z*(P.w+P.z)-2.*P.w*P.z)/(P.w-P.z),z);'
 /* teinte du propriétaire : même formule que w3Bake (luminance conservée, poids sol × force 0,15 / 0,30) */
 +'vec3 col=c.rgb;float k=os*c.a;if(k>0.){float lm=dot(col,vec3(.3,.59,.11));col+=(oc*(lm/olo)-col)*k;}vc=vec4(col,1.);vz=z;wp=q;}';
function blxProg(){
  const gl=W3.gl;if(BLX.gl&&BLX.gl.gl===gl)return BLX.gl;
  const sh=(ty,src)=>{const s=gl.createShader(ty);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
  const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,BLX_VS));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,W3_FS));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));
  const U={};for(const n of ['eye','cr','cu','cf','off','oc','P','os','olo','fogc','fogd'])U[n]=gl.getUniformLocation(p,n);
  /* contexte recréé après une perte : les modèles envoyés à l'ancien contexte n'existent plus (au premier usage, rien à oublier :
     des niveaux peuvent déjà être en cours de chargement) */
  if(BLX.gl)for(const [n,I] of Object.entries(BLX.isl)){I.g3={};if(I.ready3){I.ready3=false;blxRefresh(n);}}
  BLX.gl={gl,p,U,lp:gl.getAttribLocation(p,'p'),lc:gl.getAttribLocation(p,'c'),u32:!!gl.getExtension('OES_element_index_uint')};return BLX.gl;}
/* un niveau 3D : téléchargement, lecture, cuisson en tranches, envoi ; les données lues sont libérées ensuite */
function blxWant3(name,lod){
  const I=BLX.isl[name];if(!I||I.fail3||!W3.gl)return;const g=I.g3[lod];if(g)return;
  if(lod!=='lod2'&&I.ready3&&!blxRoom3())return;   /* budget 3D atteint : l'île garde le niveau déjà prêt */
  if(I.f[I.m.glb[lod].fichier]&&I.f[I.m.glb[lod].fichier].st==='echec'){I.g3[lod]={st:'echec'};return;}
  const G=I.g3[lod]={st:'en cours'},gl0=W3.gl;
  (async()=>{try{
      await blxHeights(name);
      const buf=await blxFetch(name,I.m.glb[lod].fichier);const mesh=blxMesh(blxGlb(buf));
      const t0=blxNow(),B=await blxCuire(name,lod,mesh),t1=blxNow();
      if(W3.gl!==gl0||I.g3[lod]!==G)return;   /* contexte perdu ou niveau libéré pendant la cuisson */
      const P=blxProg(),gl=W3.gl;let ib=null,type=gl.UNSIGNED_SHORT,vb,ni=mesh.ni,arr=B.O,draw='el';
      if(mesh.nv<=65535){ib=new Uint16Array(mesh.I);}else if(P.u32){ib=mesh.I;type=gl.UNSIGNED_INT;}
      else{/* sans indices 32 bits : sommets dépliés (rare, WebGL ancien) */arr=new Float32Array(ni*7);for(let k=0;k<ni;k++)arr.set(B.O.subarray(mesh.I[k]*7,mesh.I[k]*7+7),k*7);draw='arr';}
      if(typeof MES!=='undefined')MES.tag={ile:name,role:lod};
      try{vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,arr,gl.STATIC_DRAW);
        if(draw==='el'){G.ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,G.ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,ib,gl.STATIC_DRAW);}}
      finally{if(typeof MES!=='undefined')MES.tag=null;}
      Object.assign(G,{st:'pret',vb,type,draw,fin:mesh.fin,nv:mesh.nv,ni,octets:arr.byteLength+(draw==='el'?ib.byteLength:0),cuisson:t1-t0,ysL:B.ysL});
      BLX.stat.cuits++;BLX.cuis.push({ile:name,lod,ms:Math.round(t1-t0),sommets:mesh.nv,triangles:ni/3});
      if(typeof mesEv==='function')mesEv('cuisson 3D Blender (en tranches)',name,t0,t1,lod+' · '+mesh.nv+' sommets · '+(G.octets/1048576).toFixed(2)+' Mo envoyés');
      if(!I.ready3){I.ready3=true;BLX.loaded++;blxRefresh(name);}
      dirty=true;}
    catch(err){G.st='echec';
      /* plus aucun niveau possible : rendu d'origine */
      if(['lod2','lod1','lod0'].every(l=>I.g3[l]&&I.g3[l].st==='echec')||!I.Hs){I.fail3=true;if(I.ready3){I.ready3=false;blxRefresh(name);}}
      else if(!I.ready3){const nx=lod==='lod2'?'lod1':lod==='lod1'?'lod0':null;if(nx)blxWant3(name,nx);}}})();}
function blxDrop3(I,lod){const G=I.g3[lod];if(!G)return;if(G.st==='pret'&&W3.gl){try{W3.gl.deleteBuffer(G.vb);if(G.ib)W3.gl.deleteBuffer(G.ib);}catch(_){}BLX.stat.liberes3++;}delete I.g3[lod];}
/* bord sud du modèle (étiquette du nom) au niveau de ville de la partie, d'après le niveau de détail le plus fin déjà prêt */
function blxYs(name,t){const I=BLX.isl[name];if(!I)return 0;const L=Math.max(1,Math.min(4,blxLvl(t)||1));for(const l of ['lod0','lod1','lod2']){const g=I.g3[l];if(g&&g.st==='pret')return g.ysL[L];}return 0;}
/* dessin des îles Blender visibles ; niveau voulu selon la taille à l'écran, sinon le plus proche déjà prêt (secours) */
function blxDraw3(c,list,PK,near,far,fog,fd){
  const P=blxProg(),gl=P.gl,U=P.U,now=blxNow();let tris=0;
  gl.useProgram(P.p);gl.uniform3fv(U.eye,c.eye);gl.uniform3fv(U.cr,c.r);gl.uniform3fv(U.cu,c.u);gl.uniform3fv(U.cf,c.f);gl.uniform4f(U.P,1/c.tx,1/c.ty,near,far);gl.uniform3fv(U.fogc,fog);gl.uniform1f(U.fogd,fd);
  for(const t of list){const m=W3.models.get(t.id),I=BLX.isl[m.bx];if(!I)continue;m.ys=Math.max(m.ysd||0,blxYs(m.bx,t));   /* étiquette du nom : sous le modèle le plus détaillé arrivé */const k=PK.get(t.id)||9,L=R3_LOD;
    const want=!L.on?'lod0':k<L.p1?'lod2':k<L.p2?'lod1':'lod0';blxWant3(m.bx,want);
    if(L.on){if(k>=.8*L.p1)blxWant3(m.bx,'lod1');if(k>=.8*L.p2)blxWant3(m.bx,'lod0');}   /* préchargement */
    const order=want==='lod0'?['lod0','lod1','lod2']:want==='lod1'?['lod1','lod2','lod0']:['lod2','lod1','lod0'];
    let G=null;for(const l of order){const g=I.g3[l];if(g&&g.st==='pret'){G=g;I.u3[l]=now;I.vu3=l;break;}}I.u3[want]=now;
    if(!G)continue;
    const lvl=Math.max(1,Math.min(4,blxLvl(t)||1)),n=G.fin[lvl];
    const own=t.owner>=0?r3c(COLORS[t.owner]):null;
    if(own){gl.uniform3f(U.oc,own[0],own[1],own[2]);gl.uniform1f(U.olo,Math.max(.15,own[0]*.3+own[1]*.59+own[2]*.11));gl.uniform1f(U.os,t.owner===ME?.30:.15);}else gl.uniform1f(U.os,0);
    gl.uniform3f(U.off,t.x,t.y,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,G.vb);gl.enableVertexAttribArray(P.lp);gl.vertexAttribPointer(P.lp,3,gl.FLOAT,false,28,0);gl.enableVertexAttribArray(P.lc);gl.vertexAttribPointer(P.lc,4,gl.FLOAT,false,28,12);
    if(G.draw==='el'){gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,G.ib);gl.drawElements(gl.TRIANGLES,n,G.type,0);}else gl.drawArrays(gl.TRIANGLES,0,n);
    tris+=n/3;}
  return tris;}
/* rafraîchit l'île dans les deux modes (bascule « avant / après » du banc de mesure, ou modèles arrivés) */
function blxRefresh(only){
  for(const name of Object.keys(BLX.isl)){if(only&&name!==only)continue;const t=terrs.find(q=>q.name===name);if(!t)continue;
    if(typeof W3!=='undefined'&&W3.gl){const m=W3.models.get(t.id);if(m){try{W3.gl.deleteBuffer(m.bo);W3.gl.deleteBuffer(m.bt);if(m.alt)for(const a of m.alt)W3.gl.deleteBuffer(a.bo);}catch(_){}W3.models.delete(t.id);}}
    const e=R25.cache.get(t.id);if(e)e.blKey='';}
  dirty=true;}
/* mode 3D : à la place du décor généré, seulement drapeaux et liserés (dépendent du propriétaire) ; le modèle lui-même est fixe */
function blxBuild(t,o){
  if(BLX.off||(typeof W3!=='undefined'&&W3.cuOff))return null;const I=BLX.isl[t.name];if(!I||I.fail3)return null;
  if(W3.gl)blxProg();
  if(!I.ready3){blxWant3(t.name,'lod2');return null;}
  const G=r3Geo();for(const d of I.m.drapeaux||[])if(o.owner)w3Banner(G,d[0],d[1],d[2]-2.2,o.oc,o.crew,1.4);
  w3Rings(G,o.rc,o.oc,!!o.owner);
  const pon=I.m.ponton,pa=pon?Math.atan2(pon[1],pon[0]):o.aP;
  return {G,tops:[],A:{H:I.Hs,rc:o.rc,R:o.R,pa},ext:I.m.cadre.ext,top:Math.max(8,I.m.sommet*.6),H:I.Ho,bl:true,bx:t.name};
}

/* ---------- libération de la mémoire (P3) ---------- */
/* octets décodés (2.5D : images fines et compositions) et envoyés à la carte graphique (3D : lod0 et lod1) */
const blxPx=o=>o?(o.width||0)*(o.height||0)*4:0;
function blxMem25(){let n=0;for(const I of Object.values(BLX.isl)){for(const [k,v] of Object.entries(I.img))if(k!=='l1')n+=blxPx(v);for(const v of Object.values(I.cv))n+=blxPx(v);}return n;}
function blxMem3(){let n=0;for(const I of Object.values(BLX.isl))for(const l of ['lod0','lod1']){const g=I.g3[l];if(g&&g.st==='pret')n+=g.octets;}return n;}
/* budget dépassé : on ne demande plus de niveau fin (l'île garde le meilleur niveau déjà prêt) tant que la libération n'a pas fait de place */
const blxRoom25=()=>blxMem25()<BLX.cfg.budget25,blxRoom3=()=>blxMem3()<BLX.cfg.budget3;
function blxEvict25(I,lods){let rel=false;for(const lod of lods)if(I.img[lod]){if(I.img[lod].close)I.img[lod].close();delete I.img[lod];rel=true;BLX.stat.liberes25++;}
  if(!I.img.l2&&!I.img.l3)for(const k of Object.keys(I.img))if(/^v\d$/.test(k)){if(I.img[k].close)I.img[k].close();delete I.img[k];rel=true;}
  for(const k of Object.keys(I.cv))if(!I.img[k.split('|')[0]])delete I.cv[k];
  /* l'entrée du cache 2.5D ne doit garder aucune image libérée : elle est recomposée au prochain dessin */
  if(rel){const name=Object.keys(BLX.isl).find(n=>BLX.isl[n]===I),t=terrs.find(q=>q.name===name),e=t&&R25.cache.get(t.id);if(e&&e.isBl){if(e.small!==I.img.l1)blxRestore25(e);else{e.mid=null;e.full=e.small;e.blKey='';}}}}
function blxSweep(){
  const now=blxNow(),act3=typeof W3!=='undefined'&&W3.act,C=BLX.cfg;
  if(act3!==BLX.mode){BLX.mode=act3;BLX.since=now;}
  const inactif=now-(BLX.since||0)>C.inactif;
  for(const I of Object.values(BLX.isl)){
    /* 2.5D : niveaux fins inutilisés depuis 45 s, ou mode 2.5D inactif depuis 30 s ; l1 reste (affichage de secours immédiat) */
    blxEvict25(I,['l2','l3'].filter(l=>I.img[l]&&(now-(I.u25[l]||0)>C.libere||(act3&&inactif))));
    /* 3D : lod0 / lod1 inutilisés depuis 45 s, ou mode 3D inactif depuis 30 s ; lod2 reste tant que la 3D a servi */
    for(const lod of ['lod0','lod1']){const g=I.g3[lod];if(g&&g.st==='pret'&&(now-(I.u3[lod]||0)>C.libere||(!act3&&inactif)))blxDrop3(I,lod);}}
  /* budgets : au-delà, on libère d'abord ce qui a servi il y a le plus longtemps (jamais ce qui a servi dans les 2 dernières secondes) */
  const c25=[];for(const I of Object.values(BLX.isl))for(const l of ['l3','l2'])if(I.img[l])c25.push([I.u25[l]||0,I,l]);c25.sort((a,b)=>a[0]-b[0]);
  for(const [u,I,l] of c25){if(blxMem25()<C.budget25||now-u<C.recent)break;blxEvict25(I,[l]);}
  const c3=[];for(const I of Object.values(BLX.isl))for(const l of ['lod0','lod1']){const g=I.g3[l];if(g&&g.st==='pret')c3.push([I.u3[l]||0,I,l]);}c3.sort((a,b)=>a[0]-b[0]);
  for(const [u,I,l] of c3){if(blxMem3()<C.budget3||now-u<C.recent)break;blxDrop3(I,l);}}
setInterval(()=>{try{blxSweep();}catch(err){console.warn('libération îles Blender',err);}},2000);

blxInit();
window.__BLX=BLX;   /* accès pour les tests automatisés (copie de test) */
