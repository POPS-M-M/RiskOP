import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildAdventureIsland } from './adventure-islands.js';
import { createAdventureEnvironment } from './adventure-environment.js';
import { attachFreeCamera } from './free-camera.js';
import { loadBlenderDiorama } from './blender-islands.js';
import { addIslandNPCs } from './island-npcs.js';

const fallbackTheme={biome:'grass',landmark:'none',architecture:'village',palette:['#b6cb8a','#7b9d66','#456b51'],sand:'#e0c594',rock:[119,113,91],label:'Île de la Grand Line',detail:'Une interprétation en miniature du paysage de cette île.'};
const getTheme=(t,override)=>({...fallbackTheme,...((typeof window!=='undefined'&&window.GL_ISLAND_THEMES?.[t.name])||{}),...override});
const hash=s=>{let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;};
const randomFor=s=>{let n=hash(s);return()=>{n+=0x6D2B79F5;let t=n;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};};

export function buildIslandGroup(t,themeOverride){return buildAdventureIsland(t,getTheme(t,themeOverride));}

let active=null;
const CSS=`
.gl3d-dialog{width:calc(100vw - 18px);height:calc(100dvh - 18px);max-width:none;max-height:none;padding:0;border:1px solid #627981;border-radius:18px;background:#102631;color:#f0efe2;box-shadow:0 36px 120px #0009;overflow:hidden;font:14px/1.5 Inter,system-ui,sans-serif}
.gl3d-dialog::backdrop{background:#06111be8;backdrop-filter:blur(9px)}
.gl3d-layout{height:100%;display:flex;flex-direction:column;min-height:0}.gl3d-head{display:flex;align-items:center;gap:18px;padding:14px 22px;border-bottom:1px solid #3c5861;background:linear-gradient(115deg,#193945,#112936)}.gl3d-title{min-width:0;flex:1}.gl3d-kicker{font-size:9px;color:#d8ba7c;letter-spacing:.17em;margin:0 0 5px}.gl3d-title h2{font:700 29px/1.1 'Big Shoulders Display',Impact,sans-serif;letter-spacing:.035em;margin:0}.gl3d-select{display:block;margin-top:10px;max-width:100%;width:250px;border:1px solid #506c77;background:#102a35;color:#e7e9dc;padding:7px 10px;border-radius:6px;font:11px Inter,system-ui,sans-serif}.gl3d-label{font-size:11px;color:#b1c9cd;margin:6px 0 0}.gl3d-close,.gl3d-action{border:1px solid #586e75;background:#1c3b47;color:#e9ebdf;border-radius:8px;cursor:pointer;min-height:40px;padding:8px 12px;font:inherit}.gl3d-close{font-size:24px;line-height:1;width:42px;flex:none}.gl3d-close:hover,.gl3d-action:hover{background:#31535f}.gl3d-close:focus-visible,.gl3d-action:focus-visible{outline:2px solid #eaca8b;outline-offset:3px}.gl3d-stage{position:relative;flex:1;min-height:250px;background:radial-gradient(ellipse at 45% 30%,#2b5664,#102532);overflow:hidden;touch-action:none}.gl3d-stage canvas{display:block;width:100%;height:100%;outline:none}.gl3d-tools{position:absolute;left:16px;top:16px;z-index:2;display:flex;gap:7px}.gl3d-action{font-size:11px;background:#102a36d9;backdrop-filter:blur(8px)}.gl3d-action[aria-pressed=true]{color:#ecd29c;border-color:#aa966c}.gl3d-note{position:absolute;left:16px;right:16px;bottom:15px;text-align:center;font-size:10px;color:#c4d7d8;pointer-events:none;text-shadow:0 1px 4px #000}.gl3d-footer{border-top:1px solid #39545d;padding:13px 24px;font-size:11px;color:#afc5c8;line-height:1.6}.gl3d-error{display:grid;place-content:center;height:100%;padding:28px;text-align:center;max-width:520px;margin:auto;font-size:13px;color:#cfdbd9}.gl3d-error strong{display:block;font-size:18px;color:#f0d39b;margin-bottom:12px}@media(max-width:600px){.gl3d-dialog{width:calc(100vw - 16px);height:calc(100dvh - 20px);border-radius:12px}.gl3d-head{padding:16px;gap:10px}.gl3d-title h2{font-size:25px}.gl3d-footer{padding:12px 16px;font-size:10px}.gl3d-tools{left:10px;top:10px}.gl3d-action{font-size:10px;padding:7px 9px}.gl3d-note{font-size:9px}}
.gl3d-quality{font:11px Inter,system-ui,sans-serif;color:#e5dfca;background:#102a36eb;border:1px solid #5b777d;border-radius:8px;padding:8px 10px;min-height:40px}.gl3d-tools{flex-wrap:wrap;right:12px}.gl3d-head{align-items:center}.gl3d-title{display:grid;grid-template-columns:auto minmax(140px,240px);column-gap:24px}.gl3d-title .gl3d-kicker,.gl3d-title h2,.gl3d-title .gl3d-label{grid-column:1}.gl3d-title .gl3d-select{grid-column:2;grid-row:1/4;align-self:center;margin:0;width:100%}.gl3d-footer{padding:10px 22px}.gl3d-stage{background:#2f7086}@media(max-width:600px){.gl3d-title{display:block}.gl3d-title .gl3d-select{margin-top:7px;width:180px}.gl3d-tools{gap:5px}.gl3d-quality{font-size:10px;min-height:35px}.gl3d-action{min-height:35px}.gl3d-footer{max-height:70px;overflow:auto}}
`;
function ensureStyle(){if(document.getElementById('gl3d-style'))return;const s=document.createElement('style');s.id='gl3d-style';s.textContent=CSS;document.head.appendChild(s);}
export function closeIsland3D(){if(active)active.close();}
export function openIsland3D(t,allIslands=[]){
  if(typeof document==='undefined')return;
  closeIsland3D();ensureStyle();let theme=getTheme(t),sceneryNote='';const previousFocus=document.activeElement;
  const dialog=document.createElement('dialog');dialog.className='gl3d-dialog';dialog.setAttribute('aria-labelledby','gl3d-heading');
  dialog.innerHTML='<div class="gl3d-layout"><header class="gl3d-head"><div class="gl3d-title"><p class="gl3d-kicker">GRAND LINE · EXPLORATION</p><h2 id="gl3d-heading"></h2><p class="gl3d-label"></p><select class="gl3d-select" aria-label="Choisir une île à explorer"></select></div><button class="gl3d-close" type="button" aria-label="Fermer la vue 3D">×</button></header><div class="gl3d-stage"><div class="gl3d-tools"><button type="button" class="gl3d-action gl3d-reset">Recentrer</button><button type="button" class="gl3d-action gl3d-spin" aria-pressed="false">Survol automatique</button><button type="button" class="gl3d-action gl3d-camera" aria-pressed="false">Caméra aventure</button><select class="gl3d-quality" aria-label="Qualité graphique"><option value="cinema">Cinéma · maximum</option><option value="standard">Équilibré</option><option value="eco">Fluidité</option></select></div><p class="gl3d-note">Gauche : tourner · Droit / molette : déplacer · ZQSD / WASD / flèches · T : vue globale</p></div><footer class="gl3d-footer"></footer></div>';
  const selector=dialog.querySelector('.gl3d-select');
  const choices=allIslands.length?[...allIslands]:Object.keys(window.GL_ISLAND_THEMES||{[t.name]:{}}).map(name=>({name,owner:-1}));
  if(!choices.some(p=>p.name===t.name))choices.unshift(t);
  for(const island of choices){const option=document.createElement('option');option.value=island.name;option.textContent=island.name;selector.appendChild(option);}
  const updateTitle=()=>{dialog.querySelector('h2').textContent=t.name;dialog.querySelector('.gl3d-label').textContent=theme.label;dialog.querySelector('.gl3d-footer').textContent=(theme.detail||'Interprétation miniature de l’île.')+' Décor stylisé de fan inspiré de One Piece.'+(sceneryNote?' '+sceneryNote:'');selector.value=t.name;};
  updateTitle();
  document.body.appendChild(dialog);dialog.showModal();
  const stage=dialog.querySelector('.gl3d-stage'),reset=dialog.querySelector('.gl3d-reset'),spin=dialog.querySelector('.gl3d-spin');
  let renderer,controls,scene,model,observer,environment,freeTravel,raf=0,closed=false,last=0,adventureCamera=false;
  let modelRequest=0,modelAbort=null,blenderModel=null,blenderPopulation=null;
  const cameraButton=dialog.querySelector('.gl3d-camera'),qualitySelect=dialog.querySelector('.gl3d-quality');
  try{qualitySelect.value=localStorage.getItem('gl-quality')||'cinema';}catch(_){}
  if(!['cinema','standard','eco'].includes(qualitySelect.value))qualitySelect.value='cinema';
  const disposeObject=obj=>{const cleanups=[];obj.traverse(o=>{if(typeof o.userData.dispose==='function')cleanups.push(o.userData.dispose);});cleanups.forEach(fn=>fn());const geos=new Set(),mats=new Set(),textures=new Set();obj.traverse(o=>{if(o.geometry)geos.add(o.geometry);for(const tx of o.userData.textures||[])textures.add(tx);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{mats.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);});if(o.shadow?.map)o.shadow.map.dispose();});textures.forEach(t=>t.dispose());geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());};
  const close=()=>{if(closed)return;closed=true;++modelRequest;modelAbort?.abort();cancelAnimationFrame(raf);observer?.disconnect();window.removeEventListener('resize',resize);freeTravel?.dispose();controls?.dispose();environment?.dispose();releaseModel();if(scene)disposeObject(scene);renderer?.dispose();renderer?.forceContextLoss();if(dialog.open)dialog.close();dialog.remove();active=null;if(previousFocus?.isConnected)previousFocus.focus();window.dispatchEvent(new CustomEvent('gl3d:close'));};
  const resize=()=>{if(!renderer||closed)return;const w=Math.max(1,stage.clientWidth),h=Math.max(1,stage.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();environment?.resize(w,h);};
  active={close};dialog.querySelector('.gl3d-close').addEventListener('click',close);dialog.addEventListener('cancel',e=>{e.preventDefault();close();});dialog.addEventListener('close',close);dialog.addEventListener('keydown',e=>e.stopPropagation());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
  const camera=new THREE.PerspectiveCamera(46,1,.08,700);camera.position.set(13,8.5,17);
  const releaseModel=()=>{
    if(!model)return;scene?.remove(model);
    if(blenderModel){blenderPopulation?.dispose();blenderPopulation=null;blenderModel.dispose();blenderModel=null;}
    else disposeObject(model);
    model=null;
  };
  const waterForModel=(height,radius)=>{if(!environment)return;environment.ocean.position.y=height;const u=environment.ocean.material.uniforms;u.uCoastCount.value=1;u.uCoasts.value[0].set(0,0,radius);};
  const resetForModel=()=>{
    const radius=blenderModel?Math.max(.5,blenderModel.radius):9.8;
    const box=model?new THREE.Box3().setFromObject(model):null,centerY=box&&!box.isEmpty()?Math.min(box.max.y*.3,radius*.5):1.3;
    camera.position.set(radius*1.33,radius*.87,radius*1.74);controls.target.set(0,centerY,0);controls.minDistance=Math.max(.12,radius*.12);controls.maxDistance=Math.max(20,radius*5);controls.update();
  };
  const addResidents=asset=>{
    const radius=Math.max(.35,asset.navigationRadius||asset.radius),step=radius/5,free=(x,z)=>{const h=asset.groundHeight(x,z),o=asset.obstacleHeight(x,z);return Number.isFinite(h)&&h>.015&&Number.isFinite(o)&&o-h<.12;};
    let patch=null;
    for(let ix=-4;ix<=4&&!patch;ix++)for(let iz=-4;iz<=4&&!patch;iz++){
      const x=ix*step,z=iz*step,rr=Math.min(.65,radius*.12);
      if([[0,0],[1,0],[-1,0],[0,1],[0,-1],[.7,.7],[-.7,-.7]].every(([dx,dz])=>free(x+dx*rr,z+dz*rr)))patch={x,z,r:rr};
    }
    if(!patch)return;
    blenderPopulation=addIslandNPCs(asset.group,t,theme,{count:8,radius:patch.r,patrolCenter:[patch.x,patch.z],scale:.1,heightAt:(x,z)=>free(x,z)?asset.groundHeight(x,z):-3});
    const prior=asset.group.userData.update;asset.group.userData.update=time=>{prior?.(time);blenderPopulation?.update(time);};
  };
  const requestBlender=async()=>{
    modelAbort?.abort();const abort=new AbortController(),token=++modelRequest;modelAbort=abort;
    try{
      const asset=await loadBlenderDiorama(t,{unitScale:.25,lod:'lod0',signal:abort.signal});
      if(closed||token!==modelRequest||!renderer||!scene){asset?.dispose();return;}
      if(!asset)return;
      releaseModel();blenderModel=asset;model=asset.group;scene.add(model);addResidents(asset);waterForModel(asset.waterLevel,asset.navigationRadius||asset.radius);sceneryNote='Modèle Blender du projet.';resetForModel();updateTitle();
    }catch(error){if(closed||token!==modelRequest||error?.name==='AbortError')return;sceneryNote='Décor de secours affiché : le modèle détaillé est indisponible.';updateTitle();console.warn('Atlas Blender :',error);}
  };
  selector.addEventListener('change',()=>{
    const next=choices.find(p=>p.name===selector.value);if(!next)return;
    ++modelRequest;modelAbort?.abort();releaseModel();t=next;theme=getTheme(next);sceneryNote='';
    if(renderer&&scene){model=buildIslandGroup(t,theme);scene.add(model);environment?.setTheme(theme);waterForModel(-1.24,model.userData.radius||9.8);resetForModel();adventureCamera=false;cameraButton.setAttribute('aria-pressed','false');requestBlender();}
    updateTitle();
  });
  try{
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,qualitySelect.value==='cinema'?2:qualitySelect.value==='eco'?1:1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.85;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;stage.prepend(renderer.domElement);renderer.domElement.setAttribute('aria-label','Vue 3D interactive de '+t.name);renderer.domElement.setAttribute('role','img');
    scene=new THREE.Scene();environment=createAdventureEnvironment({renderer,scene,camera,theme,quality:qualitySelect.value});
    model=buildIslandGroup(t,theme);scene.add(model);
    controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.3,0);controls.enableDamping=true;controls.dampingFactor=.07;controls.enablePan=false;controls.minDistance=2.4;controls.maxDistance=45;controls.minPolarAngle=.23;controls.maxPolarAngle=Math.PI*.49;controls.autoRotate=!window.matchMedia('(prefers-reduced-motion: reduce)').matches;controls.autoRotateSpeed=.23;spin.setAttribute('aria-pressed',String(controls.autoRotate));
    const stopSpin=()=>{controls.autoRotate=false;spin.setAttribute('aria-pressed','false');};controls.addEventListener('start',stopSpin);
    spin.addEventListener('click',()=>{controls.autoRotate=!controls.autoRotate;spin.setAttribute('aria-pressed',String(controls.autoRotate));});
    reset.addEventListener('click',()=>{adventureCamera=false;cameraButton.setAttribute('aria-pressed','false');resetForModel();});
    cameraButton.addEventListener('click',()=>{adventureCamera=!adventureCamera;cameraButton.setAttribute('aria-pressed',String(adventureCamera));const radius=blenderModel?Math.max(.5,blenderModel.radius):9.8;camera.position.set(...(adventureCamera?[radius*.92,radius*.3,radius*1.12]:[radius*1.33,radius*.87,radius*1.74]));controls.target.set(0,adventureCamera?radius*.17:radius*.13,-radius*.06);controls.autoRotate=false;spin.setAttribute('aria-pressed','false');controls.update();});
    qualitySelect.addEventListener('change',()=>{const quality=qualitySelect.value;renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,quality==='cinema'?2:quality==='eco'?1:1.5));environment.setQuality(quality);resize();try{localStorage.setItem('gl-quality',quality);}catch(_){}});
    freeTravel=attachFreeCamera({camera,controls,element:renderer.domElement,isEnabled:()=>!closed,onTactical:()=>reset.click(),worldBounds:{minX:-24,maxX:24,minZ:-24,maxZ:24},speed:4});
    observer=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;observer?.observe(stage);window.addEventListener('resize',resize);resize();
    const frame=ts=>{if(closed)return;raf=requestAnimationFrame(frame);if(document.hidden||ts-last<(qualitySelect.value==='eco'?34:16))return;const delta=Math.min(.1,(ts-last)/1000);last=ts;freeTravel.update(delta);controls.update();model.userData.update?.(ts/1000);environment.update(ts/1000);environment.render();};raf=requestAnimationFrame(frame);requestBlender();
  }catch(error){
    environment?.dispose();environment=null;if(renderer){renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();renderer=null;}
    reset.disabled=true;spin.hidden=true;cameraButton.hidden=true;qualitySelect.hidden=true;stage.querySelector('.gl3d-note').hidden=true;
    const p=document.createElement('div');p.className='gl3d-error';const strong=document.createElement('strong');strong.textContent='La vue 3D n’est pas disponible sur ce navigateur';p.append(strong,document.createTextNode('La carte et les illustrations des îles restent accessibles. Essayez un navigateur récent avec l’accélération graphique activée.'));stage.appendChild(p);
  }
  dialog.querySelector('.gl3d-close').focus();
}
if(typeof window!=='undefined')window.GL3D={open:openIsland3D,close:closeIsland3D};
