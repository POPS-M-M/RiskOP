/* ================= BANC DE MESURE (version test uniquement) =================
   Mesure, sur la machine du joueur, le temps par image avant / après la refonte des îles, en mode 2.5D et en mode 3D.
   Ouverture : raccourci Maj+Alt+B ou bouton ⏱ sous le zoom. Ne touche à aucune donnée de partie : la caméra et les modes
   d'affichage sont rétablis à la fin. « Avant » = îles d'origine (sans décor sur mesure ni rendus Blender).
   Étape 0 : s'appuie sur 75-mesure-ressources.js (mémoire, chargement, fluidité). Les séries « temps par image » sont
   inchangées pour rester comparables aux mesures précédentes ; s'y ajoutent le balayage de zoom, la reconstruction des
   modèles 3D (toutes les îles, puis une île isolée) et des instantanés mémoire au début et à la fin. */
const BANC={open:false,run:false,cost:[],res:[],sw:[],rb:[],iso:[],snap0:null,snap1:null,el:null,tab:'mesure',t0:0,t1:0};
{const d0=draw;draw=function(){if(!BANC.run)return d0();const t0=performance.now();d0();
  if(BANC.sync){try{const gl=W3.act&&W3.gl;if(gl){const px=new Uint8Array(4);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);}}catch(_){}}
  BANC.cost.push(performance.now()-t0);};}
function bancUI(){
  if(BANC.el)return BANC.el;
  const el=document.createElement('div');el.id='banc';el.setAttribute('role','dialog');el.setAttribute('aria-label','Banc de mesure');
  el.style.cssText='position:fixed;right:12px;bottom:12px;z-index:60;width:min(680px,calc(100vw - 24px));max-height:78vh;overflow:auto;background:#0d1420;color:#e8eef6;border:1px solid #2c3a52;border-radius:10px;padding:12px 14px;font:13px/1.45 Inter,system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.5)';
  const B='border:0;border-radius:6px;padding:6px 12px;cursor:pointer;';
  el.innerHTML='<div style="display:flex;gap:8px;align-items:center;justify-content:space-between"><b>Banc de mesure des îles</b><button id="banc-x" aria-label="Fermer" style="background:none;border:0;color:#9fb0c8;font-size:18px;cursor:pointer">×</button></div>'
   +'<p style="margin:6px 0 8px;color:#9fb0c8">Mesure le temps par image (moyenne et 95ᵉ centile) avec les îles d\'origine (« avant ») puis refondues (« après »), dans les deux modes, à trois niveaux de zoom ; puis un balayage de zoom, la reconstruction des modèles 3D et la mémoire. Durée : environ 3 minutes ; ne touchez pas à la carte pendant la mesure. Les onglets Mémoire et Chargement sont consultables à tout moment, sans lancer la mesure.</p>'
   +'<label style="display:block;margin:4px 0"><input type="checkbox" id="banc-sync" checked> Attendre la carte graphique à chaque image (temps complet CPU + GPU)</label>'
   +'<label style="display:inline-block;margin:2px 14px 2px 0"><input type="checkbox" id="banc-sw" checked> Balayage de zoom</label><label style="display:inline-block;margin:2px 0"><input type="checkbox" id="banc-iso" checked> Reconstruction d\'une île isolée</label>'
   +'<div style="display:flex;flex-wrap:wrap;gap:8px;margin:8px 0"><button id="banc-go" style="'+B+'background:#e0a63a;color:#1a1206;font-weight:700">Lancer la mesure</button><button id="banc-copy" style="'+B+'background:#22304a;color:#e8eef6">Copier tout (texte)</button><button id="banc-json" style="'+B+'background:#22304a;color:#e8eef6">Copier (JSON)</button><button id="banc-ref" style="'+B+'background:#22304a;color:#e8eef6">Actualiser</button><button id="banc-raz" style="'+B+'background:#22304a;color:#e8eef6" title="Remet à zéro les compteurs d\'images, de gels et de changements de niveau">Remise à zéro fluidité</button></div>'
   +'<div role="tablist" style="display:flex;gap:4px;border-bottom:1px solid #2c3a52;margin:6px 0 8px">'+[['mesure','Temps et transitions'],['memoire','Mémoire'],['charge','Chargement et fluidité']].map(([k,l])=>'<button role="tab" data-tab="'+k+'" style="'+B+'border-radius:6px 6px 0 0;background:none;color:#9fb0c8">'+l+'</button>').join('')+'</div>'
   +'<div id="banc-st" aria-live="polite" style="color:#ffd27a;margin:4px 0"></div><div id="banc-out" style="overflow-x:auto"></div>';
  document.body.appendChild(el);BANC.el=el;
  el.querySelector('#banc-x').onclick=()=>bancOpen(false);el.querySelector('#banc-go').onclick=()=>{if(!BANC.run)bancRun();};
  el.querySelector('#banc-copy').onclick=()=>bancCopy(bancText());el.querySelector('#banc-json').onclick=()=>bancCopy(bancJSON());
  el.querySelector('#banc-ref').onclick=()=>bancShow();el.querySelector('#banc-raz').onclick=()=>{mesReset();bancSt('Compteurs de fluidité remis à zéro.');bancShow();};
  for(const b of el.querySelectorAll('[data-tab]'))b.onclick=()=>{BANC.tab=b.dataset.tab;bancShow();};
  return el;}
function bancCopy(t){try{navigator.clipboard.writeText(t).then(()=>bancSt('Résultats copiés ('+Math.round(t.length/1024)+' Ko de texte).'),()=>bancSel(t));}catch(_){bancSel(t);}}
function bancSel(t){const o=document.getElementById('banc-out');o.innerHTML='';const ta=document.createElement('textarea');ta.value=t;ta.readOnly=true;ta.style.cssText='width:100%;height:40vh;background:#0a101a;color:#e8eef6;border:1px solid #2c3a52;font:12px/1.35 ui-monospace,monospace';o.appendChild(ta);ta.focus();ta.select();bancSt('Texte sélectionné : copiez-le avec Ctrl+C.');}
function bancSt(m){const s=document.getElementById('banc-st');if(s)s.textContent=m;}
function bancOpen(v){BANC.open=v===undefined?!BANC.open:v;bancUI().style.display=BANC.open?'block':'none';if(BANC.open)bancShow();}
const bancWait=ms=>new Promise(r=>setTimeout(r,ms));
async function bancRebuild(cuOff,label){
  if(typeof W3==='undefined')return;W3.cuOff=cuOff;
  if(typeof BLX!=='undefined')BLX.off=cuOff;
  const ts=performance.now();
  if(W3.gl){for(const m of W3.models.values()){try{W3.gl.deleteBuffer(m.bo);W3.gl.deleteBuffer(m.bt);if(m.alt)for(const a of m.alt)W3.gl.deleteBuffer(a.bo);}catch(_){}}}
  W3.models.clear();W3.q=[];
  if(typeof blxRefresh==='function')blxRefresh();
  if(!W3.act)return;
  for(let i=0;i<400&&W3.models.size<terrs.length;i++){bancSt('Reconstruction des îles '+(cuOff?'d\'origine':'refondues')+' : '+W3.models.size+' / '+terrs.length);await bancWait(250);}
  const te=performance.now(),ev=MES.ev.filter(e=>e.k==='construction 3D'&&e.t0>=ts&&e.t1<=te),d=ev.map(e=>e.t1-e.t0),G=MES.gels.filter(g=>g.t>=ts&&g.t<=te+50);
  BANC.rb.push({label:label||(cuOff?'avant':'après'),n:ev.length,duree:te-ts,somme:d.reduce((a,b)=>a+b,0),med:bancQ(d,.5),max:Math.max(0,...d),
    blender:ev.filter(e=>/Blender/.test(e.info)).map(e=>e.ile+' '+Math.round(e.t1-e.t0)+' ms').join(', '),g50:G.length,g100:G.filter(g=>g.dt>100).length,maxImg:Math.max(0,...G.map(g=>g.dt))});
}
const bancQ=(a,p)=>{if(!a.length)return 0;const s=a.slice().sort((x,y)=>x-y);return s[Math.min(s.length-1,Math.floor(s.length*p))];};
async function bancMeasure(label,mode,variant){
  BANC.cost=[];const iv=[];let last=0,stop=false;const f=t=>{if(last)iv.push(t-last);last=t;if(!stop)requestAnimationFrame(f);};
  await bancWait(1200);BANC.run=true;BANC.cost=[];requestAnimationFrame(f);await bancWait(3000);stop=true;BANC.run=false;
  const st=a=>{if(!a.length)return [0,0];const s=a.slice().sort((x,y)=>x-y);return [s.reduce((p,q)=>p+q,0)/s.length,s[Math.min(s.length-1,Math.floor(s.length*.95))]];};
  const [ca,cp]=st(BANC.cost),[ia]=st(iv);
  BANC.res.push({label,mode,variant,ms:ca,p95:cp,fps:ia?1000/ia:0,tris:mode==='3D'?(W3.tris|0):0});bancShow();}
function bancCam(nm,k){const t=nm?terrs.find(q=>q.name===nm):null,Wv=W,Hv=H;V.k=k;if(t){V.x=t.x-Wv/k/2;V.y=t.y-Hv/k/2;}else{V.x=0;V.y=0;}if(typeof clampView==='function')try{clampView();}catch(_){}dirty=true;}
/* balayage de zoom : avant puis arrière (4 s chacun, progression géométrique), centré sur une île ; intervalle entre images et changements de niveau */
async function bancSweep(mode,variant,nm,k0,k1){
  const t=terrs.find(q=>q.name===nm);if(!t)return;bancCam(nm,k0);await bancWait(1200);
  const iv=[],D=4000,ts=performance.now();let last=0,done=false;
  await new Promise(res=>{const f=now=>{if(last)iv.push(now-last);last=now;const e=now-ts,ph=e<D?e/D:e<2*D?2-e/D:0,k=k0*Math.pow(k1/k0,Math.max(0,ph));
    V.k=k;V.x=t.x-W/k/2;V.y=t.y-H/k/2;dirty=true;if(e>=2*D){done=true;res();}if(!done)requestAnimationFrame(f);};requestAnimationFrame(f);});
  const te=performance.now(),G=MES.gels.filter(g=>g.t>=ts&&g.t<=te),L=MES.ev.filter(e=>e.k==='changement de niveau'&&e.t0>=ts&&e.t0<=te);
  BANC.sw.push({mode,variant,ile:nm,zoom:k0+' → '+k1+' → '+k0,n:iv.length,med:bancQ(iv,.5),p95:bancQ(iv,.95),p99:bancQ(iv,.99),max:Math.max(0,...iv),g50:iv.filter(x=>x>50).length,g100:iv.filter(x=>x>100).length,
    lodIle:L.filter(e=>e.ile===nm).length,lodTot:L.length,gLod:G.filter(g=>/changement de niveau/.test(g.cause)).length,detail:L.filter(e=>e.ile===nm).map(e=>e.info).join(' ; ')});bancShow();}
/* reconstruction isolée du modèle 3D d'une île (même travail qu'après une conquête ou une montée de ville ; aucune donnée de partie touchée) */
async function bancIso(nm){
  const t=terrs.find(q=>q.name===nm);if(!t||typeof W3==='undefined'||!W3.act)return;bancCam(nm,3);await bancWait(800);
  const m=W3.models.get(t.id);if(m){try{W3.gl.deleteBuffer(m.bo);W3.gl.deleteBuffer(m.bt);if(m.alt)for(const a of m.alt)W3.gl.deleteBuffer(a.bo);}catch(_){}W3.models.delete(t.id);}
  dirty=true;const ts=performance.now();for(let i=0;i<300&&!W3.models.has(t.id);i++)await bancWait(40);await bancWait(400);
  const te=performance.now(),r=MES.isl[nm]&&MES.isl[nm].b.last,G=MES.gels.filter(g=>g.t>=ts&&g.t<=te);
  if(r)BANC.iso.push({ile:nm,bl:r.bl,tot:r.tot,geo:r.geo,conv:r.conv,bake:r.bake,envoi:r.envoi,sommets:r.sommets,octets:r.octets,maxImg:Math.max(0,...G.map(g=>g.dt))});bancShow();}
async function bancRun(){
  BANC.run=false;BANC.res=[];BANC.sw=[];BANC.rb=[];BANC.iso=[];BANC.sync=document.getElementById('banc-sync').checked;
  const doSw=document.getElementById('banc-sw').checked,doIso=document.getElementById('banc-iso').checked;
  const keep={x:V.x,y:V.y,k:V.k,w3:typeof W3!=='undefined'&&W3.on,lod:typeof R3_LOD!=='undefined'?R3_LOD.on:true};
  const btn=document.getElementById('banc-go');btn.disabled=true;BANC.tab='mesure';BANC.t0=performance.now();BANC.snap0=mesSnap();mesReset();
  try{
    const S3=[['Vue d\'ensemble',null,1],['Zoom moyen · Zou','Zou',3],['Zoom proche · Whole Cake','Whole Cake',9],['Zoom proche · Zou','Zou',9]];
    const S25=[['Vue d\'ensemble',null,1],['Zoom moyen · Zou','Zou',2.2],['Zoom proche · Whole Cake','Whole Cake',3.5]];
    /* mode 3D */
    if(typeof W3!=='undefined'&&!W3.fail){if(!W3.on)w3Toggle();await bancWait(800);
      for(const [cuOff,vname] of [[true,'avant'],[false,'après']]){await bancRebuild(cuOff);
        for(const lod of (cuOff?[true]:[true,false])){if(typeof R3_LOD!=='undefined')R3_LOD.on=lod;
          for(const [lab,nm,k] of S3){bancSt('3D · '+vname+(cuOff?'':lod?' (niveaux de détail)':' (sans niveaux de détail)')+' · '+lab);bancCam(nm,k);await bancMeasure(lab,'3D',vname+(cuOff?'':lod?'':' sans LOD'));}}
        if(typeof R3_LOD!=='undefined')R3_LOD.on=true;
        if(doSw){bancSt('3D · '+vname+' · balayage de zoom sur Zou');await bancSweep('3D',vname,'Zou',1.5,12);}
        if(doIso&&!cuOff)for(const nm of ['Zou','Whole Cake','Alabasta']){bancSt('3D · reconstruction isolée · '+nm);await bancIso(nm);}}
      if(typeof R3_LOD!=='undefined')R3_LOD.on=true;}
    /* mode 2.5D */
    if(typeof W3!=='undefined'&&W3.on){w3Toggle();await bancWait(800);}
    for(const [off,vname] of [[true,'avant'],[false,'après']]){if(typeof BLX!=='undefined'){BLX.off=off;if(typeof blxRefresh==='function')blxRefresh();}
      for(const [lab,nm,k] of S25){bancSt('2.5D · '+vname+' · '+lab);bancCam(nm,k);await bancMeasure(lab,'2.5D',vname);}
      if(doSw){bancSt('2.5D · '+vname+' · balayage de zoom sur Zou');await bancSweep('2.5D',vname,'Zou',1,3.5);}}
    bancSt('Mesure terminée. '+(performance.memory?'Mémoire JavaScript utilisée : '+Math.round(performance.memory.usedJSHeapSize/1048576)+' Mo. ':'')+'Mémoire des modèles 3D : '+bancMem3()+' Mo.');
  }catch(err){bancSt('Mesure interrompue : '+(err&&err.message||err));}
  finally{BANC.run=false;if(typeof W3!=='undefined'&&W3.on!==keep.w3)w3Toggle();if(typeof W3!=='undefined'&&W3.cuOff){await bancRebuild(false,'retour');}
    if(typeof R3_LOD!=='undefined')R3_LOD.on=keep.lod;V.x=keep.x;V.y=keep.y;V.k=keep.k;dirty=true;btn.disabled=false;BANC.t1=performance.now();BANC.snap1=mesSnap();bancShow();}
}
function bancMem3(){if(typeof W3==='undefined')return 0;let b=0;for(const m of W3.models.values()){b+=((m.no|0)+(m.nt|0))*28;if(m.alt)for(const a of m.alt)b+=a.no*28;}return Math.round(b/1048576*10)/10;}

/* ---------- présentation : sections (titre, colonnes, lignes, notes), rendues en tableau HTML ou en texte tabulé ---------- */
const bancMo=b=>(b/1048576).toFixed(1),bancKo=b=>Math.round(b/1024),bancF1=x=>(+x||0).toFixed(1),bancF0=x=>Math.round(+x||0);
function bancSecMesure(){const S=[];
  S.push({t:'Temps de rendu par image (série d\'origine, inchangée)',c:['Mode','Vue','Version','ms/image','95e centile','images/s','triangles'],r:BANC.res.map(r=>[r.mode,r.label,r.variant,bancF1(r.ms),bancF1(r.p95),bancF0(r.fps),r.tris])});
  if(BANC.sw.length)S.push({t:'Balayage de zoom (intervalle entre deux images, ms) et changements de niveau de détail',c:['Mode','Île','Version','Zoom','images','médiane','95e c.','99e c.','max','> 50 ms','> 100 ms','chgts de niveau (île)','chgts (toutes)','images > 50 ms liées à un chgt'],
    r:BANC.sw.map(s=>[s.mode,s.ile,s.variant,s.zoom,s.n,bancF1(s.med),bancF1(s.p95),bancF1(s.p99),bancF1(s.max),s.g50,s.g100,s.lodIle,s.lodTot,s.gLod]),n:BANC.sw.filter(s=>s.detail).map(s=>s.mode+' '+s.variant+' · '+s.detail)});
  if(BANC.rb.length)S.push({t:'Reconstruction de tous les modèles 3D (temps de construction)',c:['Version','îles','durée totale ms','somme des constructions ms','médiane ms','max ms','images > 50 ms','> 100 ms','plus longue image ms','îles Blender'],
    r:BANC.rb.map(b=>[b.label,b.n,bancF0(b.duree),bancF0(b.somme),bancF0(b.med),bancF0(b.max),b.g50,b.g100,bancF0(b.maxImg),b.blender||'—'])});
  if(BANC.iso.length)S.push({t:'Reconstruction isolée d\'un modèle 3D (même travail qu\'une conquête ou un changement de ville)',c:['Île','type','total ms','géométrie ms','dont conversion glTF','éclairage cuit ms','envoi GPU ms','sommets','Mo GPU','plus longue image ms'],
    r:BANC.iso.map(i=>[i.ile,i.bl?'Blender':'origine',bancF0(i.tot),bancF0(i.geo),bancF0(i.conv),bancF0(i.bake),bancF0(i.envoi),i.sommets,bancMo(i.octets),bancF0(i.maxImg)])});
  if(!S[0].r.length)S[0].n=['Aucune mesure lancée dans cette session : bouton « Lancer la mesure ».'];
  return S;}
function bancSecMem(s){const M=s.mem,S=[],I=M.img,g=(k)=>I[k+'|alloué']||0,im=k=>I[k+'|img']||0;
  S.push({t:'Mémoire · images décodées 2.5D (largeur × hauteur × 4 octets)',c:['Catégorie','alloué (canevas, ImageBitmap) Mo','balises <img> (estimation) Mo'],
    r:[['Îles d\'origine (petite, moyenne, grande, bannières)',bancMo(g('origine')),bancMo(im('origine'))],['Îles Blender : images d\'origine conservées pour le repli',bancMo(g('origine_gardee')),bancMo(im('origine_gardee'))],
      ['Îles Blender : canevas composés (base + ville)',bancMo(g('blender_compose')),bancMo(im('blender_compose'))],['Îles Blender : fichiers image chargés (l1, l2, l3, calques)',bancMo(g('blender_img')),bancMo(im('blender_img'))],
      ['Mer lisse',bancMo(g('mer')),'—'],['Halos',bancMo(g('halos')),'—'],['Total',bancMo(Object.entries(I).filter(([k])=>/alloué/.test(k)).reduce((a,[,v])=>a+v,0)),bancMo(Object.entries(I).filter(([k])=>/img$/.test(k)).reduce((a,[,v])=>a+v,0))]],
    n:['« alloué » : mémoire certainement occupée tant que l\'objet existe. « <img> » : le navigateur décode et peut libérer lui-même ces pixels ; valeur haute.']});
  const pi=Object.entries(M.imgIle);if(pi.length)S.push({t:'Mémoire · images 2.5D par île Blender',c:['Île','composés Mo','fichiers <img> Mo','origine conservée Mo'],r:pi.map(([n,v])=>[n,bancMo(v['blender_compose|alloué']||0),bancMo((v['blender_img|img']||0)+(v['blender_img|alloué']||0)),bancMo((v['origine_gardee|alloué']||0)+(v['origine_gardee|img']||0))])});
  const G=M.gl,rows=[];for(const c of G.ctx)rows.push([c.nom+(c.perdu?' (contexte perdu)':''),'tampons '+bancMo(c.tampons),'textures '+bancMo(c.textures)]);
  rows.push(['Îles d\'origine ('+G.origineN+')',bancMo(G.origine),'']);for(const [n,b] of Object.entries(G.blender))rows.push(['Île Blender '+n,'lod0 '+bancMo(b.principal||0)+' · lod1 '+bancMo(b.lod1||0)+' · lod2 '+bancMo(b.lod2||0),'translucide '+bancMo(b.translucide||0)]);
  rows.push(['Tampons dynamiques (par image)',bancMo(G.dyn),''],['Autres (mer…)',bancMo(G.autre),''],['Total tampons + textures',bancMo(G.total+G.tex),'(estimation précédente du banc : '+bancMem3()+' Mo, îles du monde 3D seules)']);
  S.push({t:'Mémoire · carte graphique (WebGL : octets envoyés)',c:['Poste','valeur Mo',''],r:rows,n:G.ctx.length?[]:['Aucun contexte WebGL créé (le mode 3D n\'a pas encore été ouvert).']});
  const fr=[['Fichiers compressés gardés par les îles d\'origine (cache 2.5D)',bancMo(M.blobO)],['Fichiers compressés d\'origine gardés pour le repli des îles Blender',bancMo(M.blobK)],['Fichiers Blender compressés gardés par le jeu','0,0 (non gardés ; cache HTTP du navigateur)']];
  for(const [n,b] of Object.entries(M.gltfIle))fr.push(['Données glTF lues conservées en JavaScript · '+n,bancMo(b)]);
  if(M.js)fr.push(['Tas JavaScript utilisé / réservé (indicatif : Chrome arrondit et rafraîchit rarement cette valeur)',bancMo(M.js.utilise)+' / '+bancMo(M.js.total)]);else fr.push(['Tas JavaScript','non disponible dans ce navigateur']);
  S.push({t:'Mémoire · fichiers compressés et données lues',c:['Poste','Mo'],r:fr});
  return S;}
function bancSecCharge(s){const S=[],F=s.fichiers;
  const tot=F.reduce((a,f)=>[a[0]+f.tr,a[1]+f.enc,a[2]+f.dec],[0,0,0]),ko=F.filter(f=>f.st>=400).length;
  S.push({t:'Chargement · fichiers du dossier iles/ (réseau)',c:['Fichier','début ms','durée ms','transféré Ko','compressé Ko','décompressé Ko','statut'],
    r:F.map(f=>[f.f,bancF0(f.t),bancF0(f.d),bancKo(f.tr),bancKo(f.enc),bancKo(f.dec),f.st||'—']),n:[F.length+' requêtes · '+bancKo(tot[0])+' Ko transférés · '+bancKo(tot[2])+' Ko reçus · '+ko+' en erreur (statut ≥ 400). « transféré » = 0 si le fichier vient du cache.'+(s.sup.resource?'':' Resource Timing indisponible.')]});
  const B=Object.entries(s.b3).filter(([,v])=>v.bl||Object.keys(v.glb).length);
  if(B.length)S.push({t:'Chargement · étapes par île Blender (ms depuis l\'ouverture de la page)',c:['Île','étapes','base64 → binaire ms','lecture glTF ms'],
    r:B.map(([n,v])=>[n,Object.entries(v.jal).sort((a,b)=>a[1]-b[1]).map(([k,t])=>k+' '+t).join(' · '),['lod2','lod1','lod0'].map(l=>l+' '+bancF1(v.glb[l]&&v.glb[l].b64)).join(' · '),['lod2','lod1','lod0'].map(l=>l+' '+bancF1(v.glb[l]&&v.glb[l].lecture)).join(' · ')])});
  const all=Object.values(s.b3).filter(v=>v.n),ori=all.filter(v=>!v.bl).map(v=>v.last?v.last.tot:0),r25=Object.values(s.r25.parIle);
  S.push({t:'Construction des images et modèles (moteurs)',c:['Mesure','valeur'],r:[
    ['2.5D · îles d\'origine générées / chargées depuis le cache du navigateur',s.r25.construites+' / '+s.r25.depuisDB],
    ['2.5D · génération d\'une île : médiane / max ms',bancF0(bancQ(r25,.5))+' / '+bancF0(Math.max(0,...r25))],['2.5D · plus longue tranche de génération (ms, une image)',bancF1(s.r25.maxTranche)],
    ['2.5D · toutes les îles prêtes à (ms)',s.jal.r25===undefined?'—':s.jal.r25],['3D · tous les modèles construits à (ms)',s.jal.w3===undefined?'—':s.jal.w3],
    ['3D · dernière construction, îles d\'origine : médiane / max ms',bancF0(bancQ(ori,.5))+' / '+bancF0(Math.max(0,...ori))],
    ...Object.entries(s.b3).filter(([,v])=>v.bl&&v.last).map(([n,v])=>['3D · dernière construction · '+n+' (Blender)',bancF0(v.last.tot)+' ms = géométrie '+bancF0(v.last.geo)+' (dont conversion glTF '+bancF0(v.last.conv)+') + éclairage cuit '+bancF0(v.last.bake)+' + envoi '+bancF0(v.last.envoi)+' · '+v.last.sommets+' sommets · '+bancMo(v.last.octets)+' Mo']),
    ['Décodage base64 (copies .glb.txt) : appels / ms',s.b64.n+' / '+bancF0(s.b64.ms)],['Erreur du chargeur Blender',s.blxErr||'aucune'],['Paquet des îles Blender : format',s.blxFormat===2?'2 (noms à empreinte, vérifié)':s.blxFormat===1?'1 (ancien, noms fixes, non vérifié)':'—'],['Fichiers vérifiés (taille + SHA-256) / taille seule',s.blxVerif?s.blxVerif.ok+' / '+s.blxVerif.taille:'—'],['Fichiers refusés (rendu d\'origine conservé)',s.blxVerif&&s.blxVerif.rejets.length?s.blxVerif.rejets.map(r=>r.ile+' · '+r.raison).join(' ; '):'aucun'],['Erreurs internes du moniteur de mesure',s.err.n?s.err.n+' (dernière : '+s.err.msg+')':'aucune']]});
  const fl=s.fl,cl=['≤ 20','20–34','34–50','50–100','100–250','> 250'];
  S.push({t:'Fluidité depuis l\'ouverture ou la remise à zéro (intervalle entre deux images)',c:['Classe (ms)',...cl],r:[['Images',...fl.classes]],
    n:['Images comptées : '+fl.images+' · tâches longues (> 50 ms) : '+(s.sup.longtask?fl.lt.n+', la plus longue '+bancF0(fl.lt.max)+' ms, total '+bancF0(fl.lt.total)+' ms':'API indisponible')+' · changements de niveau de détail : '+fl.lodN+(Object.keys(fl.lodIsl).length?' ('+Object.entries(fl.lodIsl).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([n,c])=>n+' '+c).join(', ')+')':'')+' · dessin de la carte : '+fl.dessin.n+' appels, '+bancF1(fl.dessin.moy)+' ms en moyenne (sans attente de la carte graphique) · coût du moniteur : '+bancF1(fl.surcout*1000)+' µs par image.']});
  if(fl.gels.length)S.push({t:'Images longues (> 50 ms) les plus récentes et travail en cours à ce moment',c:['à (ms)','durée ms','cause probable'],r:fl.gels.slice().reverse().slice(0,25).map(g=>[bancF0(g.t),bancF0(g.dt),g.cause||'aucune opération JavaScript chronométrée (rendu par la carte graphique, travail du navigateur ou autre script)'])});
  if(fl.loaf.length)S.push({t:'Images d\'animation longues (navigateur, LoAF) : scripts les plus coûteux',c:['à (ms)','durée ms','blocage ms','scripts'],r:fl.loaf.map(l=>[bancF0(l.t),bancF0(l.d),bancF0(l.bloc),l.sc||'—'])});
  return S;}
function bancCond(s){return 'Conditions · '+new Date(s.date).toLocaleString('fr-FR')+' · mode affiché '+s.mode+' · écran '+s.ecran.w+'×'+s.ecran.h+' · devicePixelRatio '+s.ecran.dpr+' · canvas 2.5D '+s.ecran.canvas+' · fenêtre '+s.ecran.fenetre+' · '+s.ua
  +'\nAPI du navigateur · tâches longues '+(s.sup.longtask?'oui':'non')+' · LoAF '+(s.sup.loaf?'oui':'non')+' · Resource Timing '+(s.sup.resource?'oui':'non')+' · mémoire JS '+(s.sup.memoire?'oui':'non')+' · 1 Mo = 1 048 576 octets';}
function bancHTML(S){const e=x=>String(x).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  return S.map(x=>'<h4 style="margin:12px 0 4px;font-size:13px;color:#ffd27a">'+e(x.t)+'</h4><table style="border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums;font-size:12px"><thead><tr style="color:#9fb0c8;text-align:left">'+x.c.map(c=>'<th style="padding:2px 6px 2px 0">'+e(c)+'</th>').join('')+'</tr></thead><tbody>'
    +x.r.map(r=>'<tr style="border-top:1px solid #22304a">'+r.map(v=>'<td style="padding:2px 6px 2px 0">'+e(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table>'+(x.n||[]).map(n=>'<p style="margin:4px 0;color:#9fb0c8;font-size:12px">'+e(n)+'</p>').join('')).join('');}
function bancTxt(S){return S.map(x=>'## '+x.t+'\n'+x.c.join('\t')+'\n'+x.r.map(r=>r.join('\t')).join('\n')+(x.n&&x.n.length?'\n'+x.n.map(n=>'· '+n).join('\n'):'')).join('\n\n');}
function bancShow(){const o=document.getElementById('banc-out');if(!o)return;const s=mesSnap();
  for(const b of BANC.el.querySelectorAll('[data-tab]')){const on=b.dataset.tab===BANC.tab;b.setAttribute('aria-selected',on);b.style.color=on?'#ffd27a':'#9fb0c8';b.style.borderBottom=on?'2px solid #ffd27a':'2px solid transparent';}
  const S=BANC.tab==='memoire'?bancSecMem(s):BANC.tab==='charge'?bancSecCharge(s):bancSecMesure();
  o.innerHTML='<p style="margin:2px 0 6px;color:#9fb0c8;font-size:12px">'+bancCond(s).replace(/[&<>]/g,'').split('\n')[0]+'</p>'+bancHTML(S);}
function bancText(){const s=mesSnap();
  return 'RISK OP · banc de mesure · '+new Date().toLocaleString('fr-FR')+' · '+navigator.userAgent+'\nMode\tVue\tVersion\tms/image\t95e centile\timages/s\ttriangles\n'
  +BANC.res.map(r=>[r.mode,r.label,r.variant,r.ms.toFixed(1),r.p95.toFixed(1),Math.round(r.fps),r.tris].join('\t')).join('\n')
  +'\n\n'+bancCond(s)+'\n\n'+bancTxt([...bancSecMesure().slice(1),...bancSecMem(s),...bancSecCharge(s)])
  +(BANC.snap0?'\n\n## Mémoire au début de la mesure\n'+bancTxt(bancSecMem(BANC.snap0)):'');}
function bancJSON(){return JSON.stringify({version:'banc-etape0-1',res:BANC.res,balayage:BANC.sw,reconstruction:BANC.rb,isolee:BANC.iso,debut:BANC.snap0,fin:BANC.snap1||mesSnap()});}
document.addEventListener('keydown',e=>{if(e.shiftKey&&e.altKey&&(e.code==='KeyB')&&!/INPUT|TEXTAREA/.test((e.target&&e.target.tagName)||'')){e.preventDefault();e.stopImmediatePropagation();bancOpen();}},true);
{const z=document.querySelector('.zoomctl');if(z){const b=document.createElement('button');b.id='z-banc';b.textContent='⏱';b.title='Banc de mesure des îles (Maj+Alt+B) — version test';b.setAttribute('aria-label','Banc de mesure des îles');b.onclick=()=>bancOpen();z.appendChild(b);}}
