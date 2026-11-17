/* ================= Illustrations des héros importées par le joueur =================
   - Une illustration par lieutenant, rattachée à son identifiant (nom court du jeu : « Nami », « Kaido »…).
   - Le fichier importé est conservé TEL QUEL dans IndexedDB (mêmes octets : ni redimensionnement, ni recompression, ni retouche).
     Seule la taille d'AFFICHAGE change ; le cadrage des miniatures (point focal + zoom) est un réglage d'affichage enregistré à part.
   - Stockage local à ce navigateur : rien n'est envoyé, rien n'est partagé avec les autres joueurs, rien n'entre dans les sauvegardes de partie.
   - Aucune illustration = affichage d'origine, inchangé. Aucune mécanique de jeu ne lit ce module. */
const IL={db:null,ok:null,meta:{},url:{},open:false,mode:'list',id:null,msg:null,confirm:'',real:false,dl:undefined,est:null,persist:null,draft:null};
const IL_DB='risk-op-illustrations',IL_ST='illustrations';
const ilLeg=id=>LEGENDS.find(L=>L.s===id)||null;
function ilDbOpen(){return new Promise(res=>{try{const r=indexedDB.open(IL_DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(IL_ST))r.result.createObjectStore(IL_ST,{keyPath:'id'});};r.onsuccess=()=>res(r.result);r.onerror=()=>res(null);r.onblocked=()=>res(null);}catch(_){res(null);}});}
function ilReq(mode,fn){return new Promise((res,rej)=>{try{const tx=IL.db.transaction(IL_ST,mode),rq=fn(tx.objectStore(IL_ST));let v;if(rq)rq.onsuccess=()=>{v=rq.result;};tx.oncomplete=()=>res(v);tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error);}catch(e){rej(e);}});}
function ilSetMem(r){
  if(IL.url[r.id])try{URL.revokeObjectURL(IL.url[r.id]);}catch(_){}
  IL.meta[r.id]={id:r.id,name:r.name,type:r.type,size:r.size,w:r.w,h:r.h,fx:r.fx,fy:r.fy,z:r.z,date:r.date};
  IL.url[r.id]=URL.createObjectURL(r.blob);
}
function ilDropMem(id){if(IL.url[id])try{URL.revokeObjectURL(IL.url[id]);}catch(_){}delete IL.url[id];delete IL.meta[id];}
async function ilInit(){
  IL.db=await ilDbOpen();IL.ok=!!IL.db;
  if(IL.ok){try{const all=await ilReq('readonly',st=>st.getAll());for(const r of all||[])if(r&&r.blob&&ilLeg(r.id))ilSetMem(r);}catch(_){IL.ok=false;}}
  lastPanel='';ilRender();
  try{IL.dl=(window.claude&&typeof claude.use==='function')?await claude.use('downloads'):rkWebDownloads();}catch(_){IL.dl=null;}
  ilRender();
}
const ilSize=b=>b>=1048576?(b/1048576).toFixed(1).replace('.',',')+' Mo':Math.max(1,Math.round(b/1024))+' Ko';
function ilDims(blob){return new Promise(res=>{const u=URL.createObjectURL(blob),im=new Image();im.onload=()=>{res({w:im.naturalWidth,h:im.naturalHeight});URL.revokeObjectURL(u);};im.onerror=()=>{res(null);URL.revokeObjectURL(u);};im.src=u;});}
async function ilPersist(){try{if(navigator.storage&&navigator.storage.persist){IL.persist=await navigator.storage.persisted()||await navigator.storage.persist();}}catch(_){}}
async function ilEstimate(){try{if(navigator.storage&&navigator.storage.estimate){IL.est=await navigator.storage.estimate();ilRender();}}catch(_){}}
/* import d'un fichier image pour un héros (remplace l'éventuelle illustration précédente) */
async function ilImport(id,file){
  const L=ilLeg(id);if(!L)return {ok:false,t:'Héros inconnu.'};
  if(!IL.ok)return {ok:false,t:'Le stockage local (IndexedDB) n’est pas disponible dans ce navigateur : impossible d’importer.'};
  if(!file||!/^image\//.test(file.type||''))return {ok:false,t:'Ce fichier n’est pas une image (PNG, JPEG, WebP, GIF, AVIF…).'};
  const d=await ilDims(file);if(!d||!d.w)return {ok:false,t:'Ce navigateur ne sait pas afficher cette image.'};
  const blob=file.slice(0,file.size,file.type);   /* mêmes octets que le fichier d'origine */
  const prev=IL.meta[id];
  const rec={id,blob,name:file.name||'image',type:file.type,size:file.size,w:d.w,h:d.h,fx:.5,fy:.25,z:1,date:Date.now()};
  try{await ilReq('readwrite',st=>st.put(rec));}
  catch(e){return {ok:false,t:(e&&e.name==='QuotaExceededError')?'Espace de stockage du navigateur plein : supprimez des illustrations ou libérez de la place.':'Enregistrement impossible ('+((e&&e.name)||'erreur')+').'};}
  ilSetMem(rec);ilPersist();ilEstimate();lastPanel='';
  return {ok:true,t:(prev?'Illustration de '+L.s+' remplacée':'Illustration de '+L.s+' importée')+' : '+d.w+' × '+d.h+' px, '+ilSize(file.size)+', fichier conservé tel quel.'};
}
async function ilDelete(id){
  try{await ilReq('readwrite',st=>st.delete(id));}catch(_){return {ok:false,t:'Suppression impossible.'};}
  ilDropMem(id);ilEstimate();lastPanel='';return {ok:true,t:'Illustration de '+id+' supprimée.'};
}
async function ilSaveFrame(id,fx,fy,z){
  const r=await ilReq('readonly',st=>st.get(id));if(!r)return {ok:false,t:'Illustration introuvable.'};
  r.fx=fx;r.fy=fy;r.z=z;await ilReq('readwrite',st=>st.put(r));
  Object.assign(IL.meta[id],{fx,fy,z});lastPanel='';return {ok:true,t:'Cadrage enregistré (l’image elle-même n’est pas modifiée).'};
}
/* ---------- affichage ---------- */
function ilThumb(id,cls,fr){
  const m=IL.meta[id],u=IL.url[id];if(!m||!u)return '';
  const f=fr||m,px=(f.fx*100).toFixed(1)+'%',py=(f.fy*100).toFixed(1)+'%';
  return '<span class="ilth '+(cls||'')+'"><img src="'+u+'" alt="Illustration de '+esc(id)+'" draggable="false" style="object-position:'+px+' '+py+';transform-origin:'+px+' '+py+';transform:scale('+f.z+')"></span>';
}
function ilCardThumb(i){const id=LEGENDS[i].s;return IL.url[id]?'<button class="ilbtn" data-ill="view:'+esc(id)+'" title="Voir l’illustration de '+esc(id)+'" aria-label="Voir l’illustration de '+esc(id)+'">'+ilThumb(id,'r34')+'</button>':'';}
function ilBattleHTML(r,size){
  if(!r||r.bs)return '';
  const out=[];
  for(const [nm,side] of [[r.la,'attaque'],[r.ld,'défense']])if(nm&&IL.url[nm])out.push('<figure class="ilbat '+size+'">'+(size==='big'?'<img src="'+IL.url[nm]+'" alt="Illustration de '+esc(nm)+'">':ilThumb(nm,'r34'))+'<figcaption>'+esc(nm)+' · '+side+'</figcaption></figure>');
  return out.length?'<div class="ilbats '+size+'">'+out.join('')+'</div>':'';
}
function ilManageCard(){
  const n=Object.keys(IL.meta).length;
  return '<div class="card"><h3>Illustrations des héros</h3><p class="note">Importez vos propres illustrations ('+n+' / '+LEGENDS.length+' héros illustrés). Elles restent <b>dans ce navigateur</b> et ne sont pas partagées avec les autres joueurs.</p><button data-ill="manage">Gérer les illustrations</button></div>';
}
function pLeg4(){return pLeg2()+ilManageCard();}
/* ---------- fenêtre de gestion ---------- */
function ilMsg(o){IL.msg=o;ilRender();}
function ilRender(){
  let el=$('#ilm');
  if(!IL.open){if(el)el.hidden=true;return;}
  if(!el){el=document.createElement('div');el.id='ilm';el.className='rkm';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Illustrations des héros');document.body.appendChild(el);bindIlModal(el);}
  el.hidden=false;
  const head='<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h2>Illustrations des héros</h2><button data-ill="close" aria-label="Fermer">✕</button></div>';
  const msg=IL.msg?'<p class="verdict '+(IL.msg.ok?'pos':'neg')+'" role="status">'+esc(IL.msg.t)+'</p>':'';
  let body='';
  if(IL.mode==='view'&&IL.meta[IL.id]){
    const id=IL.id,m=IL.meta[id],L=ilLeg(id);
    body='<div class="ilhead"><button data-ill="back">← Tous les héros</button><b>'+esc(L.n)+'</b><span class="muted">'+esc(L.t)+'</span></div>'
      +'<div class="ilview'+(IL.real?' real':'')+'"><img src="'+IL.url[id]+'" alt="Illustration de '+esc(L.n)+'"></div>'
      +'<p class="note">Fichier d’origine : '+esc(m.name)+' · '+m.w+' × '+m.h+' px · '+ilSize(m.size)+'. Affiché sans retouche, proportions respectées'+(IL.real?' (taille réelle : faites défiler).':' (réduit à la fenêtre).')+'</p>'
      +'<div class="sa"><button data-ill="real">'+(IL.real?'Ajuster à la fenêtre':'Taille réelle')+'</button><button data-ill="crop:'+esc(id)+'">Cadrage des miniatures</button><button data-ill="pick:'+esc(id)+'">Remplacer</button>'+(IL.confirm==='del:'+id?'<button class="on" data-ill="del!:'+esc(id)+'">Confirmer la suppression</button><button data-ill="no">Annuler</button>':'<button data-ill="del:'+esc(id)+'">Supprimer</button>')+'</div>';
  }else if(IL.mode==='crop'&&IL.meta[IL.id]){
    const id=IL.id,m=IL.meta[id],L=ilLeg(id),d=IL.draft||(IL.draft={fx:m.fx,fy:m.fy,z:m.z});
    body='<div class="ilhead"><button data-ill="back">← Tous les héros</button><b>Cadrage des miniatures · '+esc(L.s)+'</b></div>'
      +'<p class="note">Cliquez ou glissez sur l’image pour choisir le point à garder au centre des miniatures, puis réglez le zoom. Seul l’affichage change : le fichier d’origine reste intact.</p>'
      +'<div class="ilcrop"><div class="ilsrc" id="il-src"><img src="'+IL.url[id]+'" alt="" draggable="false"><i class="ilpt" style="left:'+(d.fx*100)+'%;top:'+(d.fy*100)+'%"></i></div>'
      +'<div class="ilprev"><div>'+ilThumb(id,'r34 lg',d)+'<small>Fiche / rapport</small></div><div>'+ilThumb(id,'r34',d)+'<small>Équipage</small></div><div>'+ilThumb(id,'rnd',d)+'<small>Rond</small></div></div></div>'
      +'<label class="ilz">Zoom <input type="range" id="il-z" min="1" max="4" step="0.05" value="'+d.z+'"> <b>×'+d.z.toFixed(2).replace('.',',')+'</b></label>'
      +'<div class="sa"><button class="on" data-ill="framesave:'+esc(id)+'">Enregistrer le cadrage</button><button data-ill="framereset">Recentrer</button><button data-ill="back">Annuler</button></div>';
  }else{
    IL.mode='list';
    const est=IL.est&&IL.est.usage!=null?' Espace utilisé par ce site : '+ilSize(IL.est.usage)+(IL.est.quota?' sur environ '+ilSize(IL.est.quota)+' disponibles':'')+'.':'';
    body='<div class="ilinfo"><p class="note"><b>Stockage local uniquement.</b> Les images sont gardées dans ce navigateur (IndexedDB), avec leur résolution et leurs octets d’origine. Elles ne sont ni envoyées, ni partagées avec les autres joueurs, ni incluses dans les sauvegardes de partie ; elles ne suivent pas sur un autre appareil et disparaissent si vous effacez les données du site.'+est+(IL.persist===true?' Le navigateur protège ce stockage contre l’effacement automatique.':IL.persist===false?' Le navigateur n’a pas accordé de protection contre l’effacement automatique : exportez régulièrement votre collection.':'')+'</p>'
      +(IL.ok===false?'<p class="verdict neg">Le stockage local (IndexedDB) est indisponible ici (navigation privée ou données de site bloquées) : l’import est impossible.</p>':'')
      +'<div class="sa"><button data-ill="export"'+(IL.dl&&Object.keys(IL.meta).length?'':' disabled')+'>Exporter ma collection (.zip)</button><button data-ill="zip"'+(IL.ok?'':' disabled')+'>Réimporter une collection (.zip)</button></div>'
      +(IL.dl===null?'<p class="note">L’export n’est pas disponible dans cette vue de la page (la page ne peut proposer un fichier à enregistrer que dans claude.ai).</p>':'')+'</div>'
      +'<div class="illist">'+LEGENDS.map(L=>{const id=L.s,has=!!IL.url[id];
        return '<div class="ilrow'+(has?'':' empty')+'">'+(has?'<button class="ilbtn" data-ill="view:'+esc(id)+'" aria-label="Voir">'+ilThumb(id,'r34')+'</button>':'<span class="ilth r34 none" aria-hidden="true"></span>')
          +'<div class="iln"><b>'+esc(L.s)+'</b><small>'+esc(L.t)+(has?' · '+IL.meta[id].w+'×'+IL.meta[id].h+' · '+ilSize(IL.meta[id].size):'')+'</small></div>'
          +'<div class="sa"><button data-ill="pick:'+esc(id)+'"'+(IL.ok?'':' disabled')+'>'+(has?'Remplacer':'Importer')+'</button>'+(has?'<button data-ill="crop:'+esc(id)+'">Cadrage</button>'+(IL.confirm==='del:'+id?'<button class="on" data-ill="del!:'+esc(id)+'">Confirmer</button><button data-ill="no">Annuler</button>':'<button data-ill="del:'+esc(id)+'">Supprimer</button>'):'')+'</div></div>';}).join('')+'</div>';
  }
  el.innerHTML='<div class="rkb ilb">'+head+msg+body+'</div>';
  if(IL.mode==='crop')bindCrop();
}
let ilPickId=null;
const ilFile=document.createElement('input');ilFile.type='file';ilFile.accept='image/*';ilFile.hidden=true;document.body.appendChild(ilFile);
const ilZip=document.createElement('input');ilZip.type='file';ilZip.accept='.zip,application/zip';ilZip.hidden=true;document.body.appendChild(ilZip);
ilFile.addEventListener('change',async()=>{const f=ilFile.files&&ilFile.files[0];ilFile.value='';if(!f||!ilPickId)return;const r=await ilImport(ilPickId,f);ilMsg(r);});
ilZip.addEventListener('change',async()=>{const f=ilZip.files&&ilZip.files[0];ilZip.value='';if(!f)return;ilMsg({ok:true,t:'Lecture de l’archive…'});ilMsg(await ilImportZip(f));});
async function ilAct(a,v){
  if(a==='manage'){IL.open=true;IL.mode='list';IL.msg=null;IL.confirm='';ilEstimate();}
  else if(a==='close'){IL.open=false;IL.draft=null;}
  else if(a==='back'){IL.mode='list';IL.draft=null;IL.confirm='';}
  else if(a==='view'){IL.open=true;IL.mode='view';IL.id=v;IL.real=false;IL.msg=null;IL.confirm='';}
  else if(a==='real')IL.real=!IL.real;
  else if(a==='crop'){IL.mode='crop';IL.id=v;IL.draft=null;IL.msg=null;}
  else if(a==='framereset'){if(IL.draft){IL.draft.fx=.5;IL.draft.fy=.25;IL.draft.z=1;}}
  else if(a==='framesave'){const d=IL.draft;if(d){IL.msg=await ilSaveFrame(v,d.fx,d.fy,d.z);IL.mode='view';IL.id=v;IL.draft=null;}}
  else if(a==='pick'){ilPickId=v;ilFile.click();return;}
  else if(a==='del')IL.confirm='del:'+v;
  else if(a==='no')IL.confirm='';
  else if(a==='del!'){IL.confirm='';IL.msg=await ilDelete(v);if(IL.mode==='view')IL.mode='list';}
  else if(a==='export'){IL.msg=await ilExport();}
  else if(a==='zip'){ilZip.click();return;}
  renderPanel(true);ilRender();
}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-ill]');if(!b||b.disabled)return;e.preventDefault();const s=b.dataset.ill,k=s.indexOf(':');ilAct(k<0?s:s.slice(0,k),k<0?'':s.slice(k+1));});
addEventListener('keydown',e=>{if(e.key==='Escape'&&IL.open){IL.open=false;ilRender();}});
function bindIlModal(el){}
function bindCrop(){
  const box=$('#il-src'),z=$('#il-z');if(!box)return;
  const img=box.querySelector('img');
  const set=e=>{const r=img.getBoundingClientRect();IL.draft.fx=clamp((e.clientX-r.left)/r.width,0,1);IL.draft.fy=clamp((e.clientY-r.top)/r.height,0,1);ilRender();};
  let down=false;
  box.addEventListener('pointerdown',e=>{down=true;try{box.setPointerCapture(e.pointerId);}catch(_){}set(e);});
  box.addEventListener('pointermove',e=>{if(down){const r=img.getBoundingClientRect();IL.draft.fx=clamp((e.clientX-r.left)/r.width,0,1);IL.draft.fy=clamp((e.clientY-r.top)/r.height,0,1);const pt=box.querySelector('.ilpt');if(pt){pt.style.left=(IL.draft.fx*100)+'%';pt.style.top=(IL.draft.fy*100)+'%';}}});
  box.addEventListener('pointerup',e=>{if(down){down=false;set(e);}});
  if(z)z.addEventListener('change',()=>{IL.draft.z=+z.value;ilRender();});
}
/* ---------- export / réimport de la collection : archive .zip SANS compression (octets d'origine) ---------- */
const CRC_T=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(u8){let c=0xFFFFFFFF;for(let i=0;i<u8.length;i++)c=CRC_T[(c^u8[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
function zipStore(files){ /* files: [{name, data:Uint8Array}] → Blob */
  const enc=new TextEncoder(),parts=[],cen=[];let off=0;
  const now=new Date(),dt=((now.getFullYear()-1980)<<9)|((now.getMonth()+1)<<5)|now.getDate(),tm=(now.getHours()<<11)|(now.getMinutes()<<5)|(now.getSeconds()>>1);
  for(const f of files){
    const nm=enc.encode(f.name),crc=crc32(f.data),lh=new DataView(new ArrayBuffer(30));
    lh.setUint32(0,0x04034b50,true);lh.setUint16(4,20,true);lh.setUint16(6,0x0800,true);lh.setUint16(8,0,true);lh.setUint16(10,tm,true);lh.setUint16(12,dt,true);
    lh.setUint32(14,crc,true);lh.setUint32(18,f.data.length,true);lh.setUint32(22,f.data.length,true);lh.setUint16(26,nm.length,true);lh.setUint16(28,0,true);
    parts.push(lh.buffer,nm,f.data);
    const ch=new DataView(new ArrayBuffer(46));
    ch.setUint32(0,0x02014b50,true);ch.setUint16(4,20,true);ch.setUint16(6,20,true);ch.setUint16(8,0x0800,true);ch.setUint16(10,0,true);ch.setUint16(12,tm,true);ch.setUint16(14,dt,true);
    ch.setUint32(16,crc,true);ch.setUint32(20,f.data.length,true);ch.setUint32(24,f.data.length,true);ch.setUint16(28,nm.length,true);ch.setUint32(42,off,true);
    cen.push(ch.buffer,nm);off+=30+nm.length+f.data.length;
  }
  const csz=cen.reduce((a,b)=>a+(b.byteLength!==undefined?b.byteLength:b.length),0),end=new DataView(new ArrayBuffer(22));
  end.setUint32(0,0x06054b50,true);end.setUint16(8,files.length,true);end.setUint16(10,files.length,true);end.setUint32(12,csz,true);end.setUint32(16,off,true);
  return new Blob([...parts,...cen,end.buffer],{type:'application/zip'});
}
function zipRead(buf){ /* uniquement les archives non compressées (celles que ce jeu exporte) */
  const dv=new DataView(buf),dec=new TextDecoder(),out={};let p=0;
  while(p+30<=buf.byteLength&&dv.getUint32(p,true)===0x04034b50){
    const fl=dv.getUint16(p+6,true),meth=dv.getUint16(p+8,true),crc=dv.getUint32(p+14,true),cs=dv.getUint32(p+18,true),nl=dv.getUint16(p+26,true),xl=dv.getUint16(p+28,true);
    if(fl&8)throw new Error('format');if(meth!==0)throw new Error('compressée');
    const name=dec.decode(new Uint8Array(buf,p+30,nl)),st=p+30+nl+xl;
    const data=new Uint8Array(buf.slice(st,st+cs));if(crc32(data)!==crc)throw new Error('corrompue');
    out[name]=data;p=st+cs;
  }
  return out;
}
const ilExt=t=>({'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif','image/avif':'avif','image/svg+xml':'svg','image/bmp':'bmp'})[t]||'img';
async function ilBuildZip(){
  const all=await ilReq('readonly',st=>st.getAll())||[];
  const items=[],files=[];
  for(let k=0;k<all.length;k++){const r=all[k];const fn='images/'+String(k+1).padStart(2,'0')+'-'+r.id.replace(/[^\w-]+/g,'_')+'.'+ilExt(r.type);
    files.push({name:fn,data:new Uint8Array(await r.blob.arrayBuffer())});
    items.push({id:r.id,file:fn,name:r.name,type:r.type,size:r.size,w:r.w,h:r.h,fx:r.fx,fy:r.fy,z:r.z,date:r.date});}
  files.unshift({name:'collection.json',data:new TextEncoder().encode(JSON.stringify({format:'risk-op-illustrations',version:1,exported:new Date().toISOString(),items},null,1))});
  return {blob:zipStore(files),n:items.length};
}
async function ilExport(){
  if(!IL.dl)return {ok:false,t:'L’export n’est pas disponible dans cette vue.'};
  try{const z=await ilBuildZip();if(!z.n)return {ok:false,t:'Aucune illustration à exporter.'};
    const d=new Date(),nm='risk-op-illustrations-'+d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0')+'.zip';
    await IL.dl.save({filename:nm,data:z.blob});return {ok:true,t:'Collection exportée : '+z.n+' illustration(s), '+ilSize(z.blob.size)+' (images d’origine, sans compression).'};}
  catch(e){return {ok:false,t:e&&e.code==='declined'?'Export annulé.':'Export impossible ('+((e&&(e.code||e.message))||'erreur')+').'};}
}
async function ilImportZip(file){
  let ent;try{ent=zipRead(await file.arrayBuffer());}catch(e){return {ok:false,t:e.message==='compressée'||e.message==='format'?'Cette archive n’a pas été créée par l’export de RISK OP (fichiers compressés) : réimport impossible.':'Archive illisible ou corrompue.'};}
  let col;try{col=JSON.parse(new TextDecoder().decode(ent['collection.json']));}catch(_){return {ok:false,t:'Archive sans fichier collection.json : ce n’est pas une collection RISK OP.'};}
  if(!col||col.format!=='risk-op-illustrations'||!Array.isArray(col.items))return {ok:false,t:'Ce n’est pas une collection d’illustrations RISK OP.'};
  let n=0,skip=0;
  for(const it of col.items){
    const data=ent[it.file];if(!data||!ilLeg(it.id)){skip++;continue;}
    const blob=new Blob([data],{type:it.type||'application/octet-stream'}),d=await ilDims(blob);if(!d){skip++;continue;}
    const rec={id:it.id,blob,name:it.name||'image',type:it.type,size:data.length,w:d.w,h:d.h,fx:+it.fx||.5,fy:+it.fy||.25,z:+it.z||1,date:it.date||Date.now()};
    try{await ilReq('readwrite',st=>st.put(rec));ilSetMem(rec);n++;}catch(_){skip++;}
  }
  ilPersist();ilEstimate();lastPanel='';
  return {ok:n>0,t:n+' illustration(s) réimportée(s)'+(skip?', '+skip+' ignorée(s) (héros inconnu ou image illisible)':'')+'.'};
}
ilInit();
