/* ================= BANC DE MESURE (version test uniquement) =================
   Mesure, sur la machine du joueur, le temps par image avant / après la refonte des îles, en mode 2.5D et en mode 3D.
   Ouverture : raccourci Maj+Alt+B ou bouton ⏱ sous le zoom. Ne touche à aucune donnée de partie : la caméra et les modes
   d'affichage sont rétablis à la fin. « Avant » = îles d'origine (sans décor sur mesure ni rendus Blender). */
const BANC={open:false,run:false,cost:[],res:[],el:null};
{const d0=draw;draw=function(){if(!BANC.run)return d0();const t0=performance.now();d0();
  if(BANC.sync){try{const gl=W3.act&&W3.gl;if(gl){const px=new Uint8Array(4);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);}}catch(_){}}
  BANC.cost.push(performance.now()-t0);};}
function bancUI(){
  if(BANC.el)return BANC.el;
  const el=document.createElement('div');el.id='banc';el.setAttribute('role','dialog');el.setAttribute('aria-label','Banc de mesure');
  el.style.cssText='position:fixed;right:12px;bottom:12px;z-index:60;width:min(560px,calc(100vw - 24px));max-height:70vh;overflow:auto;background:#0d1420;color:#e8eef6;border:1px solid #2c3a52;border-radius:10px;padding:12px 14px;font:13px/1.45 Inter,system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.5)';
  el.innerHTML='<div style="display:flex;gap:8px;align-items:center;justify-content:space-between"><b>Banc de mesure des îles</b><button id="banc-x" aria-label="Fermer" style="background:none;border:0;color:#9fb0c8;font-size:18px;cursor:pointer">×</button></div>'
   +'<p style="margin:6px 0 8px;color:#9fb0c8">Mesure le temps par image (moyenne et 95ᵉ centile) avec les îles d\'origine (« avant ») puis refondues (« après »), dans les deux modes, à trois niveaux de zoom. Durée : environ 1 à 2 minutes ; ne touchez pas à la carte pendant la mesure.</p>'
   +'<label style="display:block;margin:4px 0"><input type="checkbox" id="banc-sync" checked> Attendre la carte graphique à chaque image (temps complet CPU + GPU)</label>'
   +'<div style="display:flex;gap:8px;margin:8px 0"><button id="banc-go" style="background:#e0a63a;color:#1a1206;border:0;border-radius:6px;padding:6px 12px;font-weight:700;cursor:pointer">Lancer la mesure</button><button id="banc-copy" style="background:#22304a;color:#e8eef6;border:0;border-radius:6px;padding:6px 12px;cursor:pointer">Copier les résultats</button></div>'
   +'<div id="banc-st" aria-live="polite" style="color:#ffd27a;margin:4px 0"></div><div id="banc-out" style="overflow-x:auto"></div>';
  document.body.appendChild(el);BANC.el=el;
  el.querySelector('#banc-x').onclick=()=>bancOpen(false);el.querySelector('#banc-go').onclick=()=>{if(!BANC.run)bancRun();};
  el.querySelector('#banc-copy').onclick=()=>{const t=bancText();try{navigator.clipboard.writeText(t).then(()=>bancSt('Résultats copiés.'),()=>bancSel());}catch(_){bancSel();}};
  return el;}
function bancSel(){const o=document.getElementById('banc-out');const r=document.createRange();r.selectNodeContents(o);const s=getSelection();s.removeAllRanges();s.addRange(r);bancSt('Texte sélectionné : copiez-le avec Ctrl+C.');}
function bancSt(m){const s=document.getElementById('banc-st');if(s)s.textContent=m;}
function bancOpen(v){BANC.open=v===undefined?!BANC.open:v;bancUI().style.display=BANC.open?'block':'none';}
const bancWait=ms=>new Promise(r=>setTimeout(r,ms));
async function bancRebuild(cuOff){
  if(typeof W3==='undefined')return;W3.cuOff=cuOff;
  if(typeof BLX!=='undefined')BLX.off=cuOff;
  if(W3.gl){for(const m of W3.models.values()){try{W3.gl.deleteBuffer(m.bo);W3.gl.deleteBuffer(m.bt);if(m.alt)for(const a of m.alt)W3.gl.deleteBuffer(a.bo);}catch(_){}}}
  W3.models.clear();W3.q=[];
  if(typeof blxRefresh==='function')blxRefresh();
  if(!W3.act)return;
  for(let i=0;i<400&&W3.models.size<terrs.length;i++){bancSt('Reconstruction des îles '+(cuOff?'d\'origine':'refondues')+' : '+W3.models.size+' / '+terrs.length);await bancWait(250);}
}
async function bancMeasure(label,mode,variant){
  BANC.cost=[];const iv=[];let last=0,stop=false;const f=t=>{if(last)iv.push(t-last);last=t;if(!stop)requestAnimationFrame(f);};
  await bancWait(1200);BANC.run=true;BANC.cost=[];requestAnimationFrame(f);await bancWait(3000);stop=true;BANC.run=false;
  const st=a=>{if(!a.length)return [0,0];const s=a.slice().sort((x,y)=>x-y);return [s.reduce((p,q)=>p+q,0)/s.length,s[Math.min(s.length-1,Math.floor(s.length*.95))]];};
  const [ca,cp]=st(BANC.cost),[ia]=st(iv);
  BANC.res.push({label,mode,variant,ms:ca,p95:cp,fps:ia?1000/ia:0,tris:mode==='3D'?(W3.tris|0):0});bancShow();}
function bancCam(nm,k){const t=nm?terrs.find(q=>q.name===nm):null,Wv=W,Hv=H;V.k=k;if(t){V.x=t.x-Wv/k/2;V.y=t.y-Hv/k/2;}else{V.x=0;V.y=0;}if(typeof clampView==='function')try{clampView();}catch(_){}dirty=true;}
async function bancRun(){
  BANC.run=false;BANC.res=[];BANC.sync=document.getElementById('banc-sync').checked;const keep={x:V.x,y:V.y,k:V.k,w3:typeof W3!=='undefined'&&W3.on,lod:typeof R3_LOD!=='undefined'?R3_LOD.on:true};
  const btn=document.getElementById('banc-go');btn.disabled=true;
  try{
    const S3=[['Vue d\'ensemble',null,1],['Zoom moyen · Zou','Zou',3],['Zoom proche · Whole Cake','Whole Cake',9],['Zoom proche · Zou','Zou',9]];
    const S25=[['Vue d\'ensemble',null,1],['Zoom moyen · Zou','Zou',2.2],['Zoom proche · Whole Cake','Whole Cake',3.5]];
    /* mode 3D */
    if(typeof W3!=='undefined'&&!W3.fail){if(!W3.on)w3Toggle();await bancWait(800);
      for(const [cuOff,vname] of [[true,'avant'],[false,'après']]){await bancRebuild(cuOff);
        for(const lod of (cuOff?[true]:[true,false])){if(typeof R3_LOD!=='undefined')R3_LOD.on=lod;
          for(const [lab,nm,k] of S3){bancSt('3D · '+vname+(cuOff?'':lod?' (niveaux de détail)':' (sans niveaux de détail)')+' · '+lab);bancCam(nm,k);await bancMeasure(lab,'3D',vname+(cuOff?'':lod?'':' sans LOD'));}}}
      if(typeof R3_LOD!=='undefined')R3_LOD.on=true;}
    /* mode 2.5D */
    if(typeof W3!=='undefined'&&W3.on){w3Toggle();await bancWait(800);}
    for(const [off,vname] of [[true,'avant'],[false,'après']]){if(typeof BLX!=='undefined'){BLX.off=off;if(typeof blxRefresh==='function')blxRefresh();}
      for(const [lab,nm,k] of S25){bancSt('2.5D · '+vname+' · '+lab);bancCam(nm,k);await bancMeasure(lab,'2.5D',vname);}}
    bancSt('Mesure terminée. '+(performance.memory?'Mémoire JavaScript utilisée : '+Math.round(performance.memory.usedJSHeapSize/1048576)+' Mo. ':'')+'Mémoire des modèles 3D : '+bancMem3()+' Mo.');
  }catch(err){bancSt('Mesure interrompue : '+(err&&err.message||err));}
  finally{BANC.run=false;if(typeof W3!=='undefined'&&W3.on!==keep.w3)w3Toggle();if(typeof W3!=='undefined'&&W3.cuOff){await bancRebuild(false);}
    if(typeof R3_LOD!=='undefined')R3_LOD.on=keep.lod;V.x=keep.x;V.y=keep.y;V.k=keep.k;dirty=true;btn.disabled=false;}
}
function bancMem3(){if(typeof W3==='undefined')return 0;let b=0;for(const m of W3.models.values()){b+=((m.no|0)+(m.nt|0))*28;if(m.alt)for(const a of m.alt)b+=a.no*28;}return Math.round(b/1048576*10)/10;}
function bancShow(){const o=document.getElementById('banc-out');if(!o)return;const f=x=>x.toFixed(1);
  o.innerHTML='<table style="border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums"><thead><tr style="color:#9fb0c8;text-align:left"><th>Mode</th><th>Vue</th><th>Version</th><th style="text-align:right">ms/image</th><th style="text-align:right">95ᵉ c.</th><th style="text-align:right">images/s</th><th style="text-align:right">triangles</th></tr></thead><tbody>'
   +BANC.res.map(r=>'<tr style="border-top:1px solid #22304a"><td>'+r.mode+'</td><td>'+r.label+'</td><td>'+r.variant+'</td><td style="text-align:right">'+f(r.ms)+'</td><td style="text-align:right">'+f(r.p95)+'</td><td style="text-align:right">'+Math.round(r.fps)+'</td><td style="text-align:right">'+(r.tris?Math.round(r.tris/1000)+' k':'—')+'</td></tr>').join('')+'</tbody></table>';}
function bancText(){return 'RISK OP · banc de mesure · '+new Date().toLocaleString('fr-FR')+' · '+navigator.userAgent+'\nMode\tVue\tVersion\tms/image\t95e centile\timages/s\ttriangles\n'
  +BANC.res.map(r=>[r.mode,r.label,r.variant,r.ms.toFixed(1),r.p95.toFixed(1),Math.round(r.fps),r.tris].join('\t')).join('\n');}
document.addEventListener('keydown',e=>{if(e.shiftKey&&e.altKey&&(e.code==='KeyB')&&!/INPUT|TEXTAREA/.test((e.target&&e.target.tagName)||'')){e.preventDefault();e.stopImmediatePropagation();bancOpen();}},true);
{const z=document.querySelector('.zoomctl');if(z){const b=document.createElement('button');b.id='z-banc';b.textContent='⏱';b.title='Banc de mesure des îles (Maj+Alt+B) — version test';b.setAttribute('aria-label','Banc de mesure des îles');b.onclick=()=>bancOpen();z.appendChild(b);}}
