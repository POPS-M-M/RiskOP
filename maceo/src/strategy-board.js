import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { attachFreeCamera } from './free-camera.js';
import { addIslandNPCs } from './island-npcs.js';
import { addAdventureLandmark } from './adventure-landmarks.js';
import { createAdventureEnvironment } from './adventure-environment.js';
import { addAnimeRim,buildSailingShip,addIslandMotion } from './world-motion.js';
import { planMaritimeRoute } from './maritime-navigation.js';
import { loadBlenderDiorama } from './blender-islands.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const DEFAULT_COLORS=['#4c8df6','#ee5b52','#3fc27a','#b672ee'];
const TAU=Math.PI*2;
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
const mapPoint=t=>new THREE.Vector3((Number(t.x)-700)/30,0,(Number(t.y)-430)/30);
const themeOf=t=>t.theme||(typeof window!=='undefined'&&window.GL_ISLAND_THEMES?.[t.name])||{biome:'grass',landmark:'none',architecture:'village',palette:['#b9ca8a','#7f9e66','#4b7051'],sand:'#daca9a',rock:[122,117,91]};

/** UI permission check only. The game's existing order command stays authoritative. */
export function getOrderEligibility(state,from,to){
  const islands=new Map((state?.islands||[]).map(t=>[t.id,t])),a=islands.get(from),b=islands.get(to);
  if(!state?.canOrder||state.suspended)return {ok:false,reason:'Les ordres sont momentanément indisponibles.'};
  if(!a||!b)return {ok:false,reason:'Choisissez une île de départ et une destination.'};
  if(a.id===b.id)return {ok:false,reason:'Choisissez une autre île comme destination.'};
  if(a.owner!==state.me)return {ok:false,reason:'Le départ doit être une île de votre camp.'};
  const adjacent=Array.isArray(a.nb)?a.nb.includes(b.id):(state.routes||[]).some(r=>(r[0]===a.id&&r[1]===b.id)||(r[1]===a.id&&r[0]===b.id));
  if(!adjacent)return {ok:false,reason:'Cette île ne possède pas de route directe depuis le départ.'};
  return {ok:true,from:a,to:b};
}

/** A deliberately light LOD for the 53-island strategy overview. */
export function buildBoardIsland(t){
  const theme=themeOf(t),r=Math.max(.75,Number(t.rad||31)/30),g=new THREE.Group();g.name=t.name;g.userData.islandId=t.id;
  const materials=new Map(),mat=(c,extra={})=>{const key=c+JSON.stringify(extra);if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color:c,roughness:.85,flatShading:true,...extra}));return materials.get(key);};
  const mesh=(geo,c,x,y,z)=>{const m=new THREE.Mesh(geo,typeof c==='string'?mat(c):c);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;};
  const box=(x,y,z,w,h,d,c)=>mesh(new THREE.BoxGeometry(w,h,d),c,x,y,z);
  const cone=(x,y,z,rr,h,c,n=6)=>mesh(new THREE.ConeGeometry(rr,h,n),c,x,y,z);
  const cylinder=(x,y,z,rt,rb,h,c,n=12)=>mesh(new THREE.CylinderGeometry(rt,rb,h,n),c,x,y,z);
  const ball=(x,y,z,rr,c,sx=1,sy=1,sz=1)=>{const m=mesh(new THREE.SphereGeometry(rr,10,6),c,x,y,z);m.scale.set(sx,sy,sz);return m;};
  const shape=new THREE.Shape(),phase=(hash(t.name)%1000)/1000*TAU;
  const coastline=Array.isArray(t.coast)&&t.coast.length>=3?t.coast.filter(p=>Array.isArray(p)&&p.length>=2&&p.slice(0,2).every(Number.isFinite)).map(p=>[p[0]/30,p[1]/30]):null;
  for(let i=0;i<28;i++){const a=i/28*TAU,rad=r*(1+.09*Math.sin(a*3+phase)+.045*Math.cos(a*5-phase));const x=Math.cos(a)*rad,z=Math.sin(a)*rad*.83;if(i)shape.lineTo(x,z);else shape.moveTo(x,z);}shape.closePath();
  if(!['ship','restaurant'].includes(theme.landmark)&&t.name!=='Zou'){
    const rings=14,segments=coastline?.length||48,p=[],c=[],uv=[],ix=[],sand=new THREE.Color(theme.sand),grass=new THREE.Color(theme.palette[1]);
    for(let j=0;j<=rings;j++)for(let i=0;i<=segments;i++){
      const angle=i/segments*TAU,q=j/rings,rad=r*(1+.09*Math.sin(angle*3+phase)+.045*Math.cos(angle*5-phase))*q,coast=coastline?.[i%segments],x=coast?coast[0]*q:Math.cos(angle)*rad,z=coast?coast[1]*q:Math.sin(angle)*rad*.83;
      const slope=THREE.MathUtils.smoothstep(q,.68,1);let h=.3-slope*.45+Math.sin(x*5+phase)*Math.cos(z*4)*.045*(1-slope)*(q>.45?1:0);
      if(t.name==='Enies Lobby'&&Math.hypot(x,z+.1)<r*.67)h=-.7;
      p.push(x,h,z);uv.push(x,z);const color=grass.clone().lerp(sand,THREE.MathUtils.smoothstep(q,.72,.95));c.push(color.r,color.g,color.b);
      if(j<rings&&i<segments){const k=j*(segments+1)+i,n=k+segments+1;ix.push(k,k+1,n,k+1,n+1,n);}
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(c,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(ix);geo.computeVertexNormals();
    const land=mesh(geo,mat('#ffffff',{vertexColors:true,flatShading:false}),0,0,0);land.userData.islandId=t.id;
  }
  if(t.name==='Enies Lobby'){const abyss=mesh(new THREE.CircleGeometry(r*.68,40),'#06111e',0,-.09,-.1);abyss.rotation.x=-Math.PI/2;}
  const lm=theme.landmark,bio=theme.biome,hasDetailed=lm&&lm!=='none';
  if(hasDetailed){const detail=new THREE.Group();const m=addAdventureLandmark(detail,theme,t);detail.scale.setScalar(r*.21);detail.position.y=.22;g.add(detail);g.userData.update=addIslandMotion(detail,t,theme);}
  if(!hasDetailed){
  if(lm==='drum'){
    for(const [x,z,h,rr]of[[-.48,-.12,.75,.23],[.05,-.35,1.15,.25],[.5,-.05,.73,.2]]){cylinder(x,.3+h/2,z,rr*.9,rr,h,'#9cb4bf');cylinder(x,.31+h,z,rr,rr,.045,'#edf3eb');}
  }else if(lm==='tree'||lm==='gianttree'){
    cylinder(0,.8,-.2,.12,.22,1.05,'#9c8a62',8);ball(0,1.45,-.2,.58,'#668c5d',1.2,.55,1);ball(-.25,1.56,-.2,.38,'#a0b478',1,.55,1);
    if(t.name==='Sabaody')ball(.55,1.22,.2,.19,'#c9ece5',1,1,1).material=mat('#c9ece5',{transparent:true,opacity:.3});
  }else if(lm==='palace'){
    box(0,.54,-.24,.7,.5,.47,'#e4cfaa');ball(0,.88,-.24,.31,'#8fb7ae',1,.65,1);for(const x of[-.43,.43])cylinder(x,.67,-.24,.085,.11,.8,'#e8d9ba',8);
  }else if(lm==='canals'&&t.name!=='Reverse Mountain'){
    const ring=mesh(new THREE.RingGeometry(.31,.72,22),mat('#66b5c1',{roughness:.35}),0,.32,0);ring.rotation.x=-Math.PI/2;cylinder(0,.7,-.3,.13,.23,.8,'#cbd8cd',10);cylinder(0,1.07,-.3,.34,.26,.09,'#cbd8cd',12);
  }else if(lm==='torii'){
    for(const x of[-.3,.3])box(x,.65,-.2,.07,.75,.09,'#bd5a4b');box(0,.99,-.2,.92,.09,.15,'#bf6753');cone(-.52,.83,-.5,.38,1.05,'#aebeb7');cone(-.52,1.22,-.5,.15,.28,'#eef2e8');
  }else if(lm==='cake'){
    for(let j=0;j<3;j++)cylinder(0,.4+j*.25,-.2,.52-j*.12,.55-j*.12,.25,j%2?'#d9aac3':'#f3dfc0');for(const x of[-.17,0,.17])cylinder(x,1.15,-.2,.025,.025,.22,'#e8bb86',5);
  }else if(lm==='dome'){
    cylinder(0,.55,-.2,.45,.48,.5,'#cee1df');ball(0,.84,-.2,.48,'#8fbccd',1,.45,1);const ring=mesh(new THREE.TorusGeometry(.65,.035,4,24),'#d3bd8d',0,.85,-.2);ring.rotation.x=1.25;
  }else if(lm==='coral'){
    for(const x of[-.55,.55]){cylinder(x,.65,-.2,.035,.07,.75,x<0?'#d6a7c8':'#8fc9ca',5);box(x,.68,-.2,.28,.045,.05,'#cca4bd');}ball(0,.75,-.1,.75,'#bddde1',1,.9,1).material=mat('#bddde1',{transparent:true,opacity:.14,depthWrite:false});
  }else if(lm==='cloud'||bio==='sky'){
    for(const [x,z]of[[-.5,0],[0,.3],[.5,0]])ball(x,.28,z,.5,'#e7eeec',1,.28,1);if(t.name!=='Birka')box(0,.65,-.3,.4,.62,.4,'#d5c394');
  }else if(lm==='ship'||lm==='restaurant'){
    const hull=ball(0,.45,0,.78,'#8b7054',1.2,.3,.65);box(0,.7,0,1.2,.42,.6,'#ddd7b8');cone(0,.97,0,.72,.28,'#749987',4).scale.z=.65;
  }else if(lm==='skull'){
    ball(0,.83,-.2,.58,'#bfc0a8',1,.9,.7);for(const x of[-.2,.2])ball(x,.93,.16,.12,'#53686b',1,1,.4);
  }else if(['castle','gates','prison'].includes(lm)||bio==='fortress'||bio==='haunted'){
    const c=bio==='haunted'?'#85829b':'#c9d2c8';box(0,.57,-.2,.72,.58,.47,c);for(const x of[-.46,.46]){cylinder(x,.76,-.2,.16,.19,.98,c,8);cone(x,1.3,-.2,.24,.22,bio==='haunted'?'#55516e':'#6b95a3',8);}
  }else if(lm==='split'){
    cone(-.4,.8,-.2,.5,1.1,'#bedde4');cone(.4,.85,-.2,.5,1.2,'#6b5658');cylinder(.4,1.44,-.2,.12,.13,.025,'#e4a064',7);
  }else if(lm==='windmill'){
    cylinder(0,.7,-.2,.16,.24,.86,'#dfd5b7',8);box(0,1.03,-.01,.77,.055,.025,'#d2bf92');box(0,1.03,-.01,.055,.77,.025,'#d2bf92');
  }else if(lm==='execution'){
    box(0,.4,-.25,.6,.12,.35,'#ae9466');for(const x of[-.23,.23])box(x,.75,-.25,.045,.65,.045,'#c5a576');box(0,1.06,-.25,.6,.045,.045,'#c5a576');
  }else if(['snow','volcano','rock'].includes(bio)){
    for(const [x,h]of[[-.42,.7],[.2,1]]){cone(x,.3+h/2,-.3,.47,h,bio==='snow'?'#bdcfd4':theme.palette?.[2]||'#76877c');if(bio==='snow')cone(x,.3+h*.86,-.3,.18,h*.3,'#f0f4e9');}
  }else{
    for(const x of[-.43,.4]){const hill=ball(x,.34,-.35,.54,theme.palette?.[0]||'#95ac70',1,.5,1);}
    if(theme.architecture!=='none'){box(-.3,.47,.35,.24,.31,.24,'#dfd5b2');cone(-.3,.68,.35,.23,.18,'#b47a59',4);}
  }
  }
  g.position.copy(mapPoint(t));if(t.name==='Mary Geoise')g.position.y=2.75;addAnimeRim(g);return g;
}

export function buildRedLineWorld(){
 const root=new THREE.Group();root.name='Red Line — muraille et courants';const walls=[];
 const rock=new THREE.MeshStandardMaterial({color:'#a85642',roughness:.93});
 for(let j=0;j<60;j++){const z=-15+j*.5,h=2.5+.3*Math.sin(j*.31)+.12*Math.cos(j*1.9),gap=Math.abs(z-.5)<2.32||Math.abs(z-8)<2.32;if(gap)continue;const m=new THREE.Mesh(new THREE.BoxGeometry(.85,h,.53,3,6,2),rock);m.position.set(0,h/2-.12,z);const p=m.geometry.attributes.position;for(let k=0;k<p.count;k++){const x=p.getX(k),y=p.getY(k);p.setX(k,x+Math.sin(y*5+z*2.3)*.05);}m.geometry.computeVertexNormals();root.add(m);walls.push(m);}
 for(const z of [.5,8]){const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,.3,z-2.5),new THREE.Vector3(0,2.9,z-2.05),new THREE.Vector3(0,3.15,z),new THREE.Vector3(0,2.9,z+2.05),new THREE.Vector3(0,.3,z+2.5)]);const arch=new THREE.Mesh(new THREE.TubeGeometry(curve,32,.3,10,false),rock);root.add(arch);walls.push(arch);}
 const base=new THREE.Mesh(new THREE.ConeGeometry(.95,3.5,40,9),rock);base.position.set(0,1.6,.5);base.scale.z=1.05;root.add(base);walls.push(base);
 const textures=new Set(),flowData=new Uint8Array(32*128*4);for(let y=0;y<128;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4,q=.5+.5*Math.sin(y*.35+x*.8);flowData[i]=100+q*130;flowData[i+1]=181+q*65;flowData[i+2]=213+q*40;flowData[i+3]=240;}const texture=new THREE.DataTexture(flowData,32,128,THREE.RGBAFormat);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.needsUpdate=true;texture.colorSpace=THREE.SRGBColorSpace;root.userData.textures=[texture];
 const water=new THREE.MeshStandardMaterial({map:texture,color:'#b6e0de',roughness:.22,metalness:.15,emissive:'#5f939c',emissiveIntensity:.12});
 for(const [dx,dz]of [[-1,0],[1,0],[0,-1],[0,1]]){const points=[[dx*2.1,.02,.5+dz*2.1],[dx*1.5,1.3,.5+dz*1.5],[dx*.1,3.4,.5+dz*.1]].map(p=>new THREE.Vector3(...p));const m=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),40,.09,8,false),water);root.add(m);}
 const falls=[];for(const side of [-1,1]){const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(side*.18,2.5,-3.7),new THREE.Vector3(side*.58,1.9,-3.7),new THREE.Vector3(side*.65,-.14,-3.7)]);const m=new THREE.Mesh(new THREE.TubeGeometry(curve,36,.055,8,false),water);root.add(m);falls.push(m);}
 const entries=[];root.updateMatrixWorld(true);for(const m of walls){const geo=m.geometry.clone();geo.applyMatrix4(m.matrixWorld);entries.push(geo);m.removeFromParent();m.geometry.dispose();}
 // A few merged rock strata have soft highlights and remain cheap across the whole chart.
 const merged=mergeGeometries(entries,false);entries.forEach(g=>g.dispose());if(merged){const m=new THREE.Mesh(merged,rock);m.castShadow=m.receiveShadow=true;root.add(m);}addAnimeRim(root);
 root.userData.update=time=>{texture.offset.x=time*.38;};return root;
}

const CSS=`
.strategy-board{position:absolute;inset:0;z-index:9;overflow:hidden;background:#0b2734;border-radius:inherit;touch-action:none}.strategy-board>canvas{display:block;width:100%;height:100%;outline:none}.strategy-board__top{position:absolute;left:12px;right:12px;top:12px;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;pointer-events:none}.strategy-board__badge{background:#0b2531e8;border:1px solid #52717b;color:#dfd4b8;border-radius:8px;padding:9px 12px;font:600 10px/1.45 Inter,system-ui,sans-serif;letter-spacing:.09em;box-shadow:0 4px 20px #0003}.strategy-board__tools{display:flex;gap:6px;pointer-events:auto}.strategy-board button{border:1px solid #5f7b84;border-radius:7px;background:#153440eb;color:#e8e9da;padding:8px 10px;min-height:36px;font:11px Inter,system-ui,sans-serif;cursor:pointer}.strategy-board button:hover:not(:disabled){background:#2b515e}.strategy-board button:disabled{opacity:.45;cursor:not-allowed}.strategy-board button:focus-visible{outline:2px solid #e8c785;outline-offset:3px}.strategy-board__help{position:absolute;left:14px;right:14px;top:62px;font:10px/1.5 Inter,system-ui,sans-serif;color:#d1dfdb;pointer-events:none;text-shadow:0 1px 4px #00151f}.strategy-board__actions{position:absolute;left:12px;bottom:12px;width:min(440px,calc(100% - 220px));box-sizing:border-box;display:grid;gap:8px;padding:12px;background:#0a2430ed;border:1px solid #5c747d;border-radius:10px;box-shadow:0 8px 26px #0004;font:11px/1.5 Inter,system-ui,sans-serif;color:#c7d9d6}.strategy-board__title{margin:0;font-size:13px;font-weight:600;color:#f0e5c9}.strategy-board__origin{margin:0;color:#d3c18e;font-size:10px}.strategy-board__buttons{display:flex;flex-wrap:wrap;gap:6px}.strategy-board .strategy-board__send{background:#e3bf7d;color:#172b2c;border-color:#e9c98f;font-weight:600}.strategy-board__status{margin:0;color:#a8c5c6;font-size:10px}.strategy-board__actions[hidden]{display:none}.strategy-board__error{position:absolute;inset:0;display:grid;place-content:center;padding:30px;text-align:center;color:#d9e6de;font:13px/1.6 Inter,system-ui,sans-serif}.strategy-board__error strong{color:#f0d49b;font-size:18px}@media(max-width:650px){.strategy-board__badge{font-size:8px;padding:7px 9px}.strategy-board__help{top:93px;font-size:9px;max-width:230px}.strategy-board__tools button{padding:7px;font-size:10px;min-height:32px}.strategy-board__actions{left:10px;right:10px;bottom:70px;width:auto;padding:10px;gap:6px}.strategy-board__actions .strategy-board__title{font-size:12px}.strategy-board button{min-height:35px;font-size:10px;padding:7px 9px}}
.strategy-board__quality{background:#173b48;color:#f2e3bd;border:1px solid #69838a;border-radius:7px;padding:7px;font:11px Inter,system-ui,sans-serif;min-height:36px}.strategy-board__tools{flex-wrap:wrap;justify-content:flex-end}
`;
function style(){if(document.getElementById('strategy-board-style'))return;const el=document.createElement('style');el.id='strategy-board-style';el.textContent=CSS;document.head.appendChild(el);}
function disposeTree(root){const cleanups=[];root.traverse(o=>{if(typeof o.userData.dispose==='function')cleanups.push(o.userData.dispose);});cleanups.forEach(fn=>fn());const geometries=new Set(),materials=new Set(),textures=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);});if(o.shadow?.map)o.shadow.map.dispose();});textures.forEach(t=>t.dispose());geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
function troopTexture(t,color,selected){const c=document.createElement('canvas');c.width=128;c.height=80;const q=c.getContext('2d');q.fillStyle=selected?'#f1d395':'#0c2534';q.strokeStyle=selected?'#fff4d0':color;q.lineWidth=5;q.beginPath();q.roundRect(5,5,118,70,24);q.fill();q.stroke();q.font='700 37px Inter,system-ui,sans-serif';q.textAlign='center';q.textBaseline='middle';q.fillStyle=selected?'#203334':'#dbe3d3';q.fillText(String(Math.max(0,Math.floor(t.troops||0))),64,42);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;return texture;}
function nameTexture(name){const c=document.createElement('canvas');c.width=512;c.height=72;const q=c.getContext('2d');q.font='600 31px Inter,system-ui,sans-serif';q.textAlign='center';q.textBaseline='middle';q.lineWidth=8;q.strokeStyle='#092131';q.strokeText(name,256,36);q.fillStyle='#eee9d8';q.fillText(name,256,36);const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;return tx;}
const WATER_VERTEX=`uniform float time;varying vec3 vWorld;void main(){vec3 p=position;p.z+=sin(p.x*.45+time*.5)*.04+cos(p.y*.51-time*.35)*.035;vWorld=(modelMatrix*vec4(p,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`;
const WATER_FRAGMENT=`precision highp float;uniform float time;varying vec3 vWorld;void main(){float a=sin(vWorld.x*1.5+vWorld.z*.85+time*.7);float b=cos(vWorld.z*2.3-vWorld.x*.8-time*.45);float glitter=pow(max(0.,a*b),12.);float wave=.5+.5*sin(vWorld.x*.23+vWorld.z*.35);vec3 base=mix(vec3(.022,.12,.18),vec3(.055,.26,.32),wave);gl_FragColor=vec4(base+vec3(.3,.5,.49)*glitter*.28,1.);}`;

export function createStrategyBoard({container,getState,onSelect=()=>{},onOrder=()=>{},onExplore=()=>{},onClose=()=>{}}){
  if(typeof document==='undefined'||!container)throw new Error('La carte 3D nécessite un conteneur dans le navigateur.');
  style();
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.85;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  const root=document.createElement('div');root.className='strategy-board';root.innerHTML='<div class="strategy-board__top"><div class="strategy-board__badge">GRAND LINE · CARTE 3D</div><div class="strategy-board__tools"><button type="button" data-sb="reset">Vue tactique</button><select class="strategy-board__quality" aria-label="Qualité graphique"><option value="cinema">Cinéma</option><option value="standard">Équilibré</option><option value="eco">Fluidité</option></select><button type="button" data-sb="close">Carte 2D</button></div></div><div class="strategy-board__help">Clic : sélectionner · Double clic : explorer l’île<br>Gauche : tourner · Droit / molette : déplacer<br>ZQSD / WASD / flèches · T : vue tactique</div><div class="strategy-board__actions" hidden><p class="strategy-board__title"></p><p class="strategy-board__origin"></p><div class="strategy-board__buttons"><button type="button" data-sb="source">Départ d’ici</button><button type="button" class="strategy-board__send" data-sb="send">Envoyer les troupes</button><button type="button" data-sb="explore">Explorer en 3D ↗</button><button type="button" data-sb="cancel">Annuler le départ</button></div><p class="strategy-board__status" role="status"></p></div>';
  root.prepend(renderer.domElement);container.appendChild(root);renderer.domElement.setAttribute('aria-label','Carte stratégique 3D des îles de Grand Line');renderer.domElement.tabIndex=0;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(40,1,.08,700);camera.position.set(2,35,27);camera.lookAt(0,0,0);
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,0,0);controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=1.8;controls.maxDistance=66;controls.minPolarAngle=.12;controls.maxPolarAngle=Math.PI*.495;controls.enablePan=true;controls.screenSpacePanning=false;controls.mouseButtons.RIGHT=null;controls.touches.TWO=THREE.TOUCH.DOLLY_PAN;controls.maxTargetRadius=24;
  const quality=root.querySelector('.strategy-board__quality');try{quality.value=localStorage.getItem('gl-quality')||'cinema';}catch(_){}if(!['cinema','standard','eco'].includes(quality.value))quality.value='cinema';
  const atmosphere=createAdventureEnvironment({renderer,scene,camera,theme:{biome:'daylight'},quality:quality.value});atmosphere.ocean.position.y=-.14;atmosphere.ocean.material.uniforms.uRedLine.value=1;
  Object.assign(atmosphere.sunlight.shadow.camera,{left:-30,right:30,top:24,bottom:-24});atmosphere.sunlight.shadow.camera.updateProjectionMatrix();atmosphere.sunlight.shadow.normalBias=.015;
  const waterMaterial=atmosphere.ocean.material;
  const livingGroup=new THREE.Group();scene.add(livingGroup);let ambientShips=[];
  const islandsGroup=new THREE.Group(),routesGroup=new THREE.Group(),armiesGroup=new THREE.Group();scene.add(islandsGroup,routesGroup,armiesGroup);
  const redLine=buildRedLineWorld();scene.add(redLine);
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),pickMeshes=[],islandObjects=new Map(),armyObjects=new Map();
  const actions=root.querySelector('.strategy-board__actions'),title=actions.querySelector('.strategy-board__title'),origin=actions.querySelector('.strategy-board__origin'),status=actions.querySelector('.strategy-board__status'),sourceButton=root.querySelector('[data-sb=source]'),sendButton=root.querySelector('[data-sb=send]'),exploreButton=root.querySelector('[data-sb=explore]'),cancelButton=root.querySelector('[data-sb=cancel]');
  let state=null,sourceId=null,hoverId=null,selectedId=null,disposed=false,suspended=false,forcedSuspended=false,raf=0,lastFrame=0,lastPoll=0,generation=null,lastIslandTopology='',lastRouteKey='',notice='';
  const navigationCache=new Map(),modelLoads=new Set();let islandEpoch=0,navigationEpoch=0,navigationDirty=false;
  const navigationIsland=t=>{const o=islandObjects.get(t.id),radius=o?.blender?.navigationRadius??o?.blender?.radius;return radius?{...t,radius:Math.max((t.rad||31)/30*1.18,radius)}:t;};
  const seaRoute=(from,to,lane=.3)=>{const key=navigationEpoch+':'+from.id+':'+to.id+':'+lane;let route=navigationCache.get(key);if(!route){route=planMaritimeRoute({from:navigationIsland(from),to:navigationIsland(to),islands:state.islands.map(navigationIsland),lane,margin:.38});navigationCache.set(key,route);}return route;};
  const pointers=new Map();let gesture=null,lastPointerGesture=null;
  const readState=()=>typeof getState==='function'?getState():{};
  const colorFor=t=>t.owner>=0?(state?.colors||DEFAULT_COLORS)[t.owner%(state?.colors||DEFAULT_COLORS).length]:'#abb49b';
  const index=()=>new Map((state?.islands||[]).map(t=>[t.id,t]));
  const refreshUI=()=>{
    const byId=index(),t=byId.get(selectedId),from=byId.get(sourceId);actions.hidden=!t;if(!t)return;
    title.textContent=t.name+' · '+Math.floor(t.troops||0)+' troupes';origin.textContent=from?'Départ : '+from.name:'Choisissez une île de votre camp comme départ.';
    sourceButton.hidden=t.owner!==state.me||t.id===sourceId;sourceButton.disabled=!state.canOrder;cancelButton.hidden=sourceId==null;
    const eligibility=getOrderEligibility(state,sourceId,selectedId);sendButton.hidden=sourceId==null||sourceId===selectedId;sendButton.disabled=!eligibility.ok;
    status.textContent=notice||(sourceId===selectedId?'Sélectionnez une île voisine, puis confirmez l’envoi.':eligibility.ok?from.name+' → '+t.name+' · utilise le pourcentage et la posture du panneau de jeu.':sourceId!=null?eligibility.reason:'La sélection ne déplace aucune troupe.');
  };
  const invalidateMarker=obj=>{obj.markerKey='';};
  const select=id=>{const t=index().get(id);if(!t)return;selectedId=id;if(sourceId==null&&t.owner===state.me&&state.canOrder)sourceId=id;notice='';onSelect(id);refreshUI();};
  const submit=(to=selectedId)=>{
    update(readState());const result=getOrderEligibility(state,sourceId,to);if(!result.ok){notice=result.reason;refreshUI();return false;}
    try{const answer=onOrder(result.from.id,result.to.id);notice=answer===false?'L’ordre n’a pas été accepté.':typeof answer==='string'&&answer?answer:'Ordre transmis : '+result.from.name+' → '+result.to.name+'.';}
    catch(error){notice='L’ordre n’a pas pu être transmis.';}
    refreshUI();return true;
  };
  const clearObjects=()=>{islandEpoch++;for(const c of modelLoads)c.abort();modelLoads.clear();disposeTree(livingGroup);livingGroup.clear();ambientShips=[];navigationCache.clear();disposeTree(islandsGroup);islandsGroup.clear();disposeTree(routesGroup);routesGroup.clear();disposeTree(armiesGroup);armiesGroup.clear();islandObjects.clear();armyObjects.clear();pickMeshes.length=0;lastRouteKey='';navigationDirty=false;};
  const populate=()=>{
    clearObjects();
    const cu=waterMaterial.uniforms;cu.uCoastCount.value=Math.min(64,state.islands.length);state.islands.slice(0,64).forEach((t,i)=>{const p=mapPoint(t);cu.uCoasts.value[i].set(p.x,p.z,(t.rad||31)/30);});
    for(const t of state.islands||[]){
      const group=buildBoardIsland(t);islandsGroup.add(group);
      const theme=themeOf(t),radius=(t.rad||31)/30,npcHeight=t.name==='Zou'?()=>.78:['ship','restaurant'].includes(theme.landmark)?()=>.13:t.name==='Enies Lobby'?(x,z)=>Math.hypot(x,z+.1)<radius*.67?-1:.3:()=>.3;
      const npcs=addIslandNPCs(group,t,theme,{heightAt:npcHeight,count:4,radius:radius*.94,scale:.055}),motion=group.userData.update;
      group.userData.npcController=npcs;group.userData.npcOptions={heightAt:npcHeight,count:4,radius:radius*.94,scale:.055};group.userData.npcSignature=t.owner+':'+(t.crewid||t.marine);
      group.userData.update=time=>{motion?.(time);if(group.userData.npcController?.group.visible)group.userData.npcController.update(time);};group.userData.dispose=()=>group.userData.npcController?.dispose();group.traverse(o=>{if(o.isMesh){o.userData.islandId=t.id;pickMeshes.push(o);}});
      const ring=new THREE.Mesh(new THREE.RingGeometry((t.rad||31)/30*1.07,(t.rad||31)/30*1.16,40),new THREE.MeshBasicMaterial({color:colorFor(t),transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.copy(mapPoint(t));ring.position.y=.03;islandsGroup.add(ring);
      const selectedRing=new THREE.Mesh(new THREE.RingGeometry((t.rad||31)/30*1.22,(t.rad||31)/30*1.28,40),new THREE.MeshBasicMaterial({color:'#f7df9e',transparent:true,opacity:.95,side:THREE.DoubleSide,depthWrite:false}));selectedRing.rotation.x=-Math.PI/2;selectedRing.position.copy(mapPoint(t));selectedRing.position.y=.05;selectedRing.visible=false;islandsGroup.add(selectedRing);
      const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:troopTexture(t,colorFor(t),t.id===selectedId),transparent:true,depthTest:false}));sprite.position.copy(mapPoint(t));sprite.position.x+=(t.rad||31)/30*.85;sprite.position.y=['Mary Geoise','Reverse Mountain'].includes(t.name)?4.6:2.05;sprite.scale.set(1.15,.72,1);sprite.renderOrder=4;islandsGroup.add(sprite);
      const name=new THREE.Sprite(new THREE.SpriteMaterial({map:nameTexture(t.name),transparent:true,depthTest:false}));name.position.copy(mapPoint(t));name.position.y=['Mary Geoise','Reverse Mountain'].includes(t.name)?5.4:2.8;name.scale.set(3.5,.49,1);name.renderOrder=5;islandsGroup.add(name);
      islandObjects.set(t.id,{group,ring,selectedRing,sprite,name,markerKey:'',blender:null,modelStatus:'fallback'});
    }
    const epoch=islandEpoch;
    for(const t of state.islands||[])requestBlenderModel(t,epoch);
  };
  const rebuildPickMeshes=()=>{pickMeshes.length=0;for(const [id,o]of islandObjects)o.group.traverse(m=>{if(m.isMesh){m.userData.islandId=id;pickMeshes.push(m);}});};
  const requestBlenderModel=(t,epoch)=>{
    const record=islandObjects.get(t.id);if(!record)return;
    const controller=new AbortController();modelLoads.add(controller);record.modelStatus='loading';
    loadBlenderDiorama(t,{unitScale:1/30,lod:'lod1',signal:controller.signal}).then(model=>{
      modelLoads.delete(controller);
      if(!model){if(islandObjects.get(t.id)===record)record.modelStatus='procedural';return;}
      if(disposed||controller.signal.aborted||epoch!==islandEpoch||islandObjects.get(t.id)!==record){model.dispose();return;}
      const current=index().get(t.id);if(!current){model.dispose();return;}
      const group=new THREE.Group();group.name=current.name;group.position.copy(mapPoint(current));group.position.y=-.14;group.userData.islandId=current.id;group.userData.blenderIsland=true;group.add(model.group);
      model.setCityLevel?.(current.city?.lvl||1);model.group.userData.setCityLevel?.(current.city?.lvl||1);
      const theme=themeOf(current),radius=(current.rad||31)/30,ground=model.groundHeight;
      const heightAt=(x,z)=>{const floor=ground(x,z),solid=model.obstacleHeight?.(x,z)??floor;return solid-floor>.035?-1:floor;};
      const npcOptions={heightAt,count:6,radius:radius*.94,scale:.017};
      group.userData.npcOptions=npcOptions;group.userData.npcController=addIslandNPCs(group,current,theme,npcOptions);group.userData.npcSignature=current.owner+':'+(current.crewid||current.marine);
      group.userData.update=time=>{if(group.userData.npcController?.group.visible)group.userData.npcController.update(time);};
      group.userData.dispose=()=>{group.userData.npcController?.dispose();model.dispose();};addAnimeRim(group);
      const old=record.group;islandsGroup.remove(old);disposeTree(old);record.group=group;record.blender=model;record.modelStatus='blender';record.cityLevel=current.city?.lvl||1;islandsGroup.add(group);
      rebuildPickMeshes();navigationDirty=true;
    }).catch(error=>{modelLoads.delete(controller);if(disposed||controller.signal.aborted||epoch!==islandEpoch)return;record.modelStatus='fallback';record.modelError=String(error?.message||error);});
  };
  const rebuildRoutes=()=>{
    disposeTree(routesGroup);routesGroup.clear();const byId=index();
    for(const rt of state.routes||[]){
      const a=byId.get(rt[0]),b=byId.get(rt[1]);if(!a||!b)continue;
      const path=seaRoute(a,b,0);if(!path.valid)continue;
      const points=new Array(Math.max(20,Math.ceil(path.length*3)));
      for(let i=0;i<points.length;i++){const p=path.getPoint(i/(points.length-1));p.y=.07;points[i]=p;}
      const geometry=new THREE.BufferGeometry().setFromPoints(points),hot=a.id===selectedId||b.id===selectedId||a.id===sourceId||b.id===sourceId;
      const color=hot?'#f1d29b':rt[2]?'#b4897d':a.owner>=0&&a.owner===b.owner?colorFor(a):'#8bb1bb';
      const line=new THREE.Line(geometry,new THREE.LineDashedMaterial({color,transparent:true,depthTest:false,opacity:hot?.95:.55,dashSize:rt[2]?.1:.24,gapSize:.17}));line.computeLineDistances();line.renderOrder=3;routesGroup.add(line);
    }
  };
  const updateArmyObjects=()=>{
    const byId=index(),live=new Set();
    (state.armies||[]).forEach((army,i)=>{
      const key=army.id??`${army.from}-${army.to}-${army.owner}-${i}`;live.add(key);let object=armyObjects.get(key);
      if(!object){const col=(state.colors||DEFAULT_COLORS)[army.owner%(state.colors||DEFAULT_COLORS).length],group=buildSailingShip(col,(state.marineOwners||[0]).includes(army.owner));group.scale.setScalar(.4);armiesGroup.add(group);object={group,owner:army.owner,radius:.37};armyObjects.set(key,object);}
      const a=byId.get(army.from),b=byId.get(army.to);if(!a||!b){object.group.visible=false;return;}
      const lane=.38+(Math.abs(Number(army.owner)||0)%4)*.17,route=seaRoute(a,b,lane);
      if(object.route!==route){object.route=route;object.visualProgress=null;object.heading=null;}
      object.desiredProgress=Math.max(0,Math.min(1,Number(army.progress)||0));object.group.visible=route.valid;
    });
    for(const [key,o]of armyObjects)if(!live.has(key)){disposeTree(o.group);armiesGroup.remove(o.group);armyObjects.delete(key);}
  };
  // Visual traffic yields along its validated route; no unit is pushed into land.
  // Authoritative troop timing and combat resolution are deliberately untouched.
  const updateSeaTraffic=(time,dt)=>{
    const occupied=[],vessels=[...armyObjects.values(),...ambientShips];
    for(const o of vessels){
      const ship=o.group,route=o.route;if(!route?.valid){ship.visible=false;continue;}
      const desired=o.ambient?(time*.03+o.offset)%1:o.desiredProgress;
      if(o.ambient&&desired<(o.previousDesired??desired))o.visualProgress=null;
      o.previousDesired=desired;
      let progress=o.visualProgress==null?desired:Math.min(desired,o.visualProgress+Math.max(.004,dt*2.5/Math.max(1,route.length)));
      let point=route.getPoint(progress),clear=p=>occupied.every(v=>p.distanceTo(v.point)>=o.radius+v.radius);
      if(!clear(point)){
        let found=false;
        for(let back=.02;back<=progress+.02;back+=Math.max(.004,.4/route.length)){
          const q=Math.max(0,progress-back),candidate=route.getPoint(q);
          if(clear(candidate)){progress=q;point=candidate;found=true;break;}
        }
        // A congested berth waits outside the visible traffic until there is space.
        if(!found){ship.visible=false;continue;}
      }
      o.visualProgress=progress;ship.visible=true;ship.position.copy(point);ship.position.y=.08+Math.sin(time*1.8+(o.offset||0))*.025;
      const tangent=route.getTangent(progress),heading=Math.atan2(tangent.x,tangent.z);
      if(o.heading==null)o.heading=heading;
      o.heading+=Math.atan2(Math.sin(heading-o.heading),Math.cos(heading-o.heading))*(1-Math.exp(-dt*7));ship.rotation.y=o.heading;ship.rotation.z=Math.sin(time*1.3+(o.offset||0))*.025;
      occupied.push({point,radius:o.radius});
    }
  };
  function update(nextState){
    if(disposed)return;const next=nextState||readState();if(!next||!Array.isArray(next.islands))return;state=next;suspended=forcedSuspended||!!state.suspended;
    if(suspended)return;
    const byId=index();selectedId=byId.has(state.selected)?state.selected:selectedId;if(!byId.has(selectedId))selectedId=null;
    if(sourceId!=null&&(!byId.has(sourceId)||byId.get(sourceId).owner!==state.me||!state.canOrder)){sourceId=null;notice='';}
    if(sourceId==null&&selectedId!=null&&byId.get(selectedId)?.owner===state.me&&state.canOrder)sourceId=selectedId;
    const topology=(state.islands||[]).map(t=>`${t.id}:${t.name}:${t.x}:${t.y}:${t.rad}`).join('|');
    if(generation!==state.generation||topology!==lastIslandTopology){generation=state.generation;lastIslandTopology=topology;populate();}
    for(const t of state.islands){const o=islandObjects.get(t.id);if(!o)continue;if(o.blender&&(o.cityLevel!==(t.city?.lvl||1))){o.cityLevel=t.city?.lvl||1;o.blender.setCityLevel?.(o.cityLevel);o.blender.group.userData.setCityLevel?.(o.cityLevel);}if(o.group.userData.npcSignature!==t.owner+':'+(t.crewid||t.marine)){o.group.userData.npcController?.dispose();o.group.userData.npcController=addIslandNPCs(o.group,t,themeOf(t),o.group.userData.npcOptions);o.group.userData.npcSignature=t.owner+':'+(t.crewid||t.marine);o.group.traverse(m=>{if(m.userData.factionBanner&&m.material)m.material.color.set(colorFor(t));});}o.ring.material.color.set(colorFor(t));o.selectedRing.visible=t.id===selectedId||t.id===sourceId||t.id===hoverId;o.selectedRing.material.color.set(t.id===sourceId?'#eff0d5':t.id===selectedId?'#f2ca79':'#adcdd4');const key=`${t.owner}:${Math.floor(t.troops||0)}:${t.id===selectedId}`;if(o.markerKey!==key){o.sprite.material.map?.dispose();o.sprite.material.map=troopTexture(t,colorFor(t),t.id===selectedId);o.sprite.material.needsUpdate=true;o.markerKey=key;}o.name.visible=camera.position.distanceTo(controls.target)<29||t.id===selectedId||t.id===hoverId||!!t.capital;}
    const routeKey=String(selectedId)+':'+sourceId+':'+state.islands.map(t=>t.owner).join(',')+':'+(state.routes||[]).map(r=>r.join(',')).join('|');if(routeKey!==lastRouteKey){lastRouteKey=routeKey;rebuildRoutes();}
    if(navigationDirty){navigationDirty=false;navigationEpoch++;navigationCache.clear();rebuildRoutes();const cu=waterMaterial.uniforms;state.islands.slice(0,64).forEach((t,i)=>{const p=mapPoint(t),n=navigationIsland(t);cu.uCoasts.value[i].set(p.x,p.z,n.radius||(t.rad||31)/30);});for(const vessel of ambientShips){const a=byId.get(vessel.from),b=byId.get(vessel.to);if(a&&b){vessel.route=seaRoute(a,b,-.65);vessel.visualProgress=null;vessel.heading=null;}}}
    updateArmyObjects();if(!ambientShips.length&&state.routes.length){const by=index();state.routes.filter((_,i)=>i%6===1).slice(0,15).forEach((rt,i)=>{const a=by.get(rt[0]),b=by.get(rt[1]);if(!a||!b)return;const own=a.owner>=0?a.owner:i%2,ship=buildSailingShip(colorFor({owner:own}),(state.marineOwners||[0]).includes(own));ship.scale.setScalar(.28);livingGroup.add(ship);ambientShips.push({group:ship,from:a.id,to:b.id,route:seaRoute(a,b,-.65),owner:own,radius:.27,ambient:true,offset:i*.153});});}refreshUI();
  }
  function resize(){if(disposed)return;const w=Math.max(1,container.clientWidth),h=Math.max(1,container.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();atmosphere.resize(w,h);}
  const pick=e=>{const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(pickMeshes,false)[0];return hit?.object.userData.islandId??null;};
  const down=e=>{pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1)gesture={x:e.clientX,y:e.clientY,button:e.button,moved:false,multi:false};else if(gesture)gesture.multi=true;};
  const move=e=>{if(gesture&&Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>8)gesture.moved=true;if(pointers.size===0&&!suspended){const id=pick(e);if(id!==hoverId){hoverId=id;renderer.domElement.style.cursor=id!=null?'pointer':'grab';update(state);}}};
  const up=e=>{const g=gesture;pointers.delete(e.pointerId);if(!pointers.size){lastPointerGesture=g;gesture=null;if(g&&!g.moved&&!g.multi&&!suspended){const id=pick(e);if(id!=null&&g.button===0)select(id);}}};
  const cancel=e=>{pointers.delete(e.pointerId);if(gesture)gesture.multi=true;if(!pointers.size){gesture=null;lastPointerGesture=null;}};
  const dbl=e=>{if(suspended||lastPointerGesture?.moved||lastPointerGesture?.multi)return;const id=pick(e);if(id!=null){select(id);onExplore(id);}};
  const contextmenu=e=>e.preventDefault();
  const keydown=e=>{if(e.key==='Escape'&&sourceId!=null){sourceId=null;notice='Départ annulé.';refreshUI();e.stopPropagation();}if(e.key.toLowerCase()==='t'){reset();e.preventDefault();e.stopPropagation();}if(e.key==='Enter'&&selectedId!=null){onExplore(selectedId);e.preventDefault();e.stopPropagation();}};
  renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointercancel',cancel);renderer.domElement.addEventListener('dblclick',dbl);renderer.domElement.addEventListener('contextmenu',contextmenu);renderer.domElement.addEventListener('keydown',keydown);
  const reset=()=>{camera.position.set(2,35,27);controls.target.set(0,0,0);controls.update();};
  const click=e=>{const b=e.target.closest('[data-sb]');if(!b||b.disabled)return;switch(b.dataset.sb){case 'reset':reset();break;case 'close':onClose();break;case 'source':{const t=index().get(selectedId);if(t?.owner===state.me&&state.canOrder){sourceId=t.id;notice='';update(state);}break;}case 'cancel':sourceId=null;notice='Départ annulé.';refreshUI();break;case 'send':submit();break;case 'explore':if(selectedId!=null)onExplore(selectedId);break;}};
  const freeTravel=attachFreeCamera({camera,controls,element:renderer.domElement,isEnabled:()=>!disposed&&!suspended&&!readState().suspended,onTactical:reset,speed:8});
  quality.addEventListener('change',()=>{renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,quality.value==='cinema'?2:quality.value==='eco'?1:1.5));atmosphere.setQuality(quality.value);resize();try{localStorage.setItem('gl-quality',quality.value);}catch(_){}});
  const buttonKeys=e=>{if(e.target.closest('button,select'))e.stopPropagation();};root.addEventListener('keydown',buttonKeys);
  root.addEventListener('click',click);root.querySelectorAll('button').forEach(b=>b.addEventListener('pointerdown',e=>e.stopPropagation()));
  const observer=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;observer?.observe(container);window.addEventListener('resize',resize);
  const frame=now=>{if(disposed)return;raf=requestAnimationFrame(frame);if(now-lastPoll>180){lastPoll=now;const fresh=readState();const blocked=forcedSuspended||!!fresh?.suspended;if(!blocked||!suspended)update(fresh);suspended=blocked;}if(suspended||document.hidden||now-lastFrame<(quality.value==='eco'?34:16))return;const dt=Math.min(.1,(now-lastFrame)/1000);lastFrame=now;if(navigationDirty)update(state);freeTravel.update(dt);controls.update();atmosphere.update(now*.001);updateSeaTraffic(now*.001,dt);if(redLine)redLine.userData.update?.(now*.001);const near=camera.position.distanceTo(controls.target)<29;for(const [id,o]of islandObjects){const t=state?.islands.find(t=>t.id===id);if(o.group.userData.npcController)o.group.userData.npcController.group.visible=camera.position.distanceTo(o.group.position)<11;o.group.userData.update?.(now*.001);o.name.visible=near||id===selectedId||id===hoverId||!!t?.capital;}atmosphere.render();};
  update(readState());resize();raf=requestAnimationFrame(frame);
  const dispose=()=>{if(disposed)return;disposed=true;islandEpoch++;for(const controller of modelLoads)controller.abort();modelLoads.clear();cancelAnimationFrame(raf);observer?.disconnect();window.removeEventListener('resize',resize);freeTravel.dispose();controls.dispose();renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointermove',move);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('pointercancel',cancel);renderer.domElement.removeEventListener('dblclick',dbl);renderer.domElement.removeEventListener('contextmenu',contextmenu);renderer.domElement.removeEventListener('keydown',keydown);root.removeEventListener('click',click);root.removeEventListener('keydown',buttonKeys);atmosphere.dispose();disposeTree(scene);islandsGroup.clear();routesGroup.clear();armiesGroup.clear();livingGroup.clear();scene.clear();islandObjects.clear();armyObjects.clear();navigationCache.clear();ambientShips=[];pickMeshes.length=0;renderer.dispose();renderer.forceContextLoss();root.remove();};
  return {update,dispose,resize,getDiagnostics(){return {generation,disposed,islands:[...islandObjects].map(([id,o])=>({id,name:o.group.name,status:o.modelStatus,error:o.modelError||null,cityLevel:o.cityLevel||1,stats:o.blender?.stats||null,radius:o.blender?.navigationRadius??o.blender?.radius??null})),pendingModels:modelLoads.size};},setSuspended(value){forcedSuspended=!!value;suspended=forcedSuspended||!!state?.suspended;if(!suspended)update(readState());}};
}
