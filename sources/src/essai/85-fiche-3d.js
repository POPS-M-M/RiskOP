/* ================= FICHE D'ÎLE : VUE 3D RÉELLE (version test, branche essai/aaa-proto) =================
   L'en-tête de la fiche d'île montre le modèle 3D de l'île (celui de la carte : modèle Blender ou modèle du monde 3D), photographié par le
   moteur du jeu en vue de trois quarts, à la place de l'illustration dessinée. La photo est refaite quand l'île change de propriétaire,
   de niveau de ville, ou quand un niveau de détail plus fin finit de charger. Jamais agrandie au-delà de la taille rendue.
   Sans monde 3D (désactivé, pas de WebGL) ou pendant une bataille : l'illustration d'origine. Réglage : localStorage « rk-fiche3d » = 0. */
const OP3={on:true,cache:new Map(),pend:null,last:0};
try{if(localStorage.getItem('rk-fiche3d')==='0')OP3.on=false;}catch(_){}
function op3Ok(){return OP3.on&&typeof W3!=='undefined'&&W3.gl&&W3.on&&!W3.fail&&W3.act&&canvas.width>0&&canvas.height>0
  &&!(typeof RT!=='undefined'&&RT.run)&&!(typeof B3!=='undefined'&&B3.run)&&!(typeof TAC!=='undefined'&&TAC.run)&&!(typeof PXS!=='undefined'&&PXS.atelier);}
/* état qui change l'image : propriétaire (teinte), niveau de ville, niveaux de détail chargés */
function op3Key(t){const I=typeof BLX!=='undefined'?BLX.isl[t.name]:null;const g=I?['lod0','lod1','lod2'].map(l=>I.g3[l]&&I.g3[l].st||'-').join(''):'m';
  return [t.owner,t.city?t.city.lvl:0,g,W3.models.has(t.id)?1:0].join('|');}
/* modèle prêt : modèle Blender chargé (au moins lod2), ou modèle du monde 3D construit ; sinon on lance le chargement et on attend */
function op3Ready(t){const m=W3.models.get(t.id);if(!m)return false;if(m.bx&&typeof BLX!=='undefined'){const I=BLX.isl[m.bx];if(!I||I.fail3)return !!m.no;if(!I.ready3){try{blxWant3(m.bx,'lod1');}catch(_){}return false;}}return true;}
function op3Shot(t){
  const r=Math.max(8,t.rad||20),pitch=.55,D=r*1.55/Math.tan(W3_FOVY/2);
  const c=w3Cam(t.x,t.y,W3.cam.yaw||0,pitch,D);c.near=Math.max(1,D*.04);c.far=D*8;c.fogD=D*6;
  let url=null;
  try{
    w3Draw(c,performance.now());
    /* cadre : contour de l'île projeté (au sol et à mi-hauteur), élargi, au format de l'en-tête (2,7 : 1) */
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(let a=0;a<16;a++)for(const z of [0,r*.45]){const q=w3Proj(t.x+Math.cos(a*.3927)*r*1.12,t.y+Math.sin(a*.3927)*r*1.12,z,c);if(!q)continue;x0=Math.min(x0,q.sx);x1=Math.max(x1,q.sx);y0=Math.min(y0,q.sy);y1=Math.max(y1,q.sy);}
    if(x1>x0&&y1>y0){const AS=2.7,cx=(x0+x1)/2;let w=(x1-x0)*1.04,h=(y1-y0)*.9;const cy=(y0+y1)/2+(y1-y0)*.06;   /* serré : l'île remplit la hauteur ; le bas (rivage) passe sous le nom */
      if(w/h<AS)w=h*AS;else h=w/AS;
      const W=W3.cv.width,H=W3.cv.height;if(w>W){w=W;h=w/AS;}if(h>H){h=H;w=h*AS;}
      const sx=Math.max(0,Math.min(W-w,cx-w/2)),sy=Math.max(0,Math.min(H-h,cy-h/2));
      const ow=Math.round(Math.min(w,712)),oh=Math.round(ow/AS),o=document.createElement('canvas');o.width=ow;o.height=oh;const g=o.getContext('2d');g.imageSmoothingQuality='high';
      g.drawImage(W3.cv,sx,sy,w,h,0,0,ow,oh);
      /* fond du bas assombri pour la lisibilité du nom */
      const gr=g.createLinearGradient(0,oh*.5,0,oh);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.55)');g.fillStyle=gr;g.fillRect(0,0,ow,oh);
      url=o.toDataURL('image/jpeg',.88);}
  }catch(e){console.warn('fiche 3D :',e);}
  /* l'image normale de la carte est redessinée aussitôt (aucune image intermédiaire n'est affichée) */
  try{w3Frame();}catch(_){}
  return url;}
function op3Get(t){const h=OP3.cache.get(t.id);return h?h.url:null;}
function op3Ask(t){OP3.pend=t;}
/* remplace l'illustration déjà affichée par la photo, sans reconstruire le panneau */
function op3Paint(t,url){for(const el of document.querySelectorAll('#side .sh-art')){const img=el.querySelector('img.art3d');if(img){if(img.dataset.id==String(t.id)&&img.src!==url)img.src=url;continue;}
  const a=el.querySelector('.art');if(!a||(typeof ui!=='undefined'&&ui.sel!==t.id))continue;const n=document.createElement('img');n.className='art art3d';n.dataset.id=t.id;n.alt='Vue 3D de '+t.name;n.src=url;a.replaceWith(n);}}
{const a0=islandArt;islandArt=function(t){const u=op3Ok()||OP3.cache.has(t.id)?op3Get(t):null;op3Ask(t);
  if(u&&OP3.on)return '<img class="art art3d" data-id="'+t.id+'" src="'+u+'" alt="Vue 3D de '+esc(t.name)+'">';return a0(t);};}
/* une photo au plus toutes les 250 ms ; l'île choisie est revérifiée chaque seconde (chargement d'un détail plus fin, changement de camp) */
(function op3Loop(){requestAnimationFrame(op3Loop);const now=performance.now();if(now-OP3.last<250||!op3Ok())return;
  let t=OP3.pend;if(!t&&typeof ui!=='undefined'&&ui.sel>=0&&now-OP3.last>1000)t=terrs[ui.sel];if(!t)return;OP3.pend=null;
  if(!op3Ready(t)){OP3.pend=t;OP3.last=now;return;}
  const key=op3Key(t),h=OP3.cache.get(t.id);if(h&&h.key===key){op3Paint(t,h.url);return;}
  OP3.last=now;const url=op3Shot(t);if(!url)return;OP3.cache.set(t.id,{key,url});if(OP3.cache.size>24){const k=OP3.cache.keys().next().value;OP3.cache.delete(k);}op3Paint(t,url);})();
window.__OP3={sel:i=>{ui.sel=i;dirty=true;renderPanel(true);},shot:t=>op3Shot(t),get:id=>op3Get({id}),set on(v){OP3.on=!!v;try{localStorage.setItem('rk-fiche3d',v?'1':'0');}catch(_){}},get on(){return OP3.on;}};
{const st=document.createElement('style');st.textContent='.sh-art img.art3d{display:block;width:100%;height:100%;object-fit:cover;background:#1d6f9e}';document.head.appendChild(st);}
