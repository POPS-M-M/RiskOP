import * as THREE from 'three';
import { buildAdventureIsland, adventureTheme } from './adventure-islands.js';
import { createAdventureEnvironment } from './adventure-environment.js';
import { buildSailingShip, calibrateClearMaterials } from './world-motion.js';
import { buildOrganicCharacter, animateOrganicCharacter } from './organic-characters.js';
import { planMaritimeRoute } from './maritime-navigation.js';
import { loadBlenderDiorama } from './blender-islands.js';

const clamp=(n,a=0,b=1)=>Math.min(b,Math.max(a,n));
const ease=t=>{t=clamp(t);return t*t*(3-2*t);};
const count=value=>{if(Array.isArray(value))return value.reduce((n,x)=>n+count(x),0);const n=Number(value);return Number.isFinite(n)?Math.max(0,n):0;};
export const ATTACK_CINEMATIC_DURATION=12.5;

/** The animation samples already resolved numbers; it never rolls or resolves a battle. */
export function battleCastCounts(battle={}){
  const side=s=>{const before=count(s?.troopsBefore),after=count(s?.troopsAfter),actors=before>0?Math.min(20,Math.max(1,Math.ceil(before))):0;return {before:actors,after:after>0?Math.min(actors,Math.max(1,Math.ceil(actors*after/Math.max(.0001,before)))):0,realBefore:before,realAfter:after};};
  return {attackers:side(battle.attacker),defenders:side(battle.defender)};
}
export function cinematicTimeline(seconds,duration=ATTACK_CINEMATIC_DURATION){
  const d=Math.max(.1,Number(duration)||ATTACK_CINEMATIC_DURATION),time=clamp((Number(seconds)||0)/d)*ATTACK_CINEMATIC_DURATION;
  const phases=[['sea',0,3.2],['approach',3.2,4.4],['charge',4.4,6.4],['battle',6.4,9.7],['capture',9.7,11.8],['return',11.8,12.5]];
  if(time>=12.5)return {phase:'done',progress:1,time,overall:1};
  const [phase,start,end]=phases.find(p=>time>=p[1]&&time<p[2])||phases[0];
  return {phase,progress:clamp((time-start)/(end-start)),time,overall:time/12.5};
}
export function cinematicOutcome(battle={}){
  const a=battle.attacker||{},d=battle.defender||{};
  const explicit=battle.winner==='attacker'||battle.winner==='defender'||typeof battle.winner==='number';
  const attackerWon=explicit?(battle.winner==='attacker'||typeof battle.winner==='number'&&battle.winner===a.id):battle.captured===true;
  const captured=battle.captured===true&&attackerWon&&!battle.retreat;
  return {attackerWon,captured,winnerId:attackerWon?a.id:d.id,color:attackerWon?(a.color||'#db8d67'):(d.color||'#9bb5a4')};
}

/** Exported as a pure geometry builder for inspection and finite-transform tests. */
export function buildCinematicSoldier(color='#50789c',marine=false,index=0,faction,leader=true){
  return buildOrganicCharacter({color,marine,variant:index,leader:leader&&index===0,faction:faction||(marine?'marine':'pirate')});
}

/** Five ranks with four files fit the clear ground, including the deployment phase. */
export function battleFormationPosition(index,side,charge,arena){
  const rows=arena.rows||5,columns=Math.ceil(20/rows),row=index%rows,column=Math.floor(index/rows),q=clamp(charge),s=arena.scale||1;
  const start=arena.deployment??Math.abs(arena.startLeft[0]),x=side*((start-(columns-1)*.62*s+column*.62*s)*(1-q)+(.4+column*.64)*s*q),z=(row-(rows-1)/2)*.68*s;
  return battlefieldPoint(arena,x,z,arena.center[1]);
}
function battlefieldPoint(arena,x,z,y=arena.center[1]){
  const yaw=arena.yaw||0,c=Math.cos(yaw),sn=Math.sin(yaw);return new THREE.Vector3(arena.center[0]+c*x-sn*z,y,arena.center[2]+sn*x+c*z);
}
export function separateBattleUnits(actors,arena,heightAt,minDistance){
  const live=actors.filter(a=>a.visible),s=arena.scale||1,spacing=minDistance??.46*s;
  for(let pass=0;pass<6;pass++)for(let i=0;i<live.length;i++)for(let j=i+1;j<live.length;j++){
    const a=live[i].position,b=live[j].position,dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz),required=spacing+(live[i].userData.boss||live[j].userData.boss?.1*s:0);
    if(d>=required)continue;const nx=d>1e-5?dx/d:1,nz=d>1e-5?dz/d:0,push=(required-d)*.5;a.x-=nx*push;a.z-=nz*push;b.x+=nx*push;b.z+=nz*push;
  }
  const yaw=arena.yaw||0,c=Math.cos(yaw),sn=Math.sin(yaw);
  for(const actor of live){const p=actor.position,dx=p.x-arena.center[0],dz=p.z-arena.center[2],x=clamp(c*dx+sn*dz,-arena.halfWidth+.3*s,arena.halfWidth-.3*s),z=clamp(-sn*dx+c*dz,-arena.halfDepth+.25*s,arena.halfDepth-.25*s);p.copy(battlefieldPoint(arena,x,z));p.y=heightAt(p.x,p.z);}
}

/** Find existing walkable land, never flatten or alter a validated Blender mesh. */
export function findBlenderBattlefield(asset){
  if(!asset?.groundHeight||!asset?.obstacleHeight)return null;
  const radius=Math.max(.1,asset.navigationRadius||asset.radius),base=Math.min(1.2,radius/14.16),preferred=asset.port||new THREE.Vector3(0,0,radius*.55),water=asset.waterLevel??0;
  const centers=[];for(let ix=-23;ix<=23;ix++)for(let iz=-23;iz<=23;iz++){
    const x=ix*radius/24,z=iz*radius/24,h=asset.groundHeight(x,z),o=asset.obstacleHeight(x,z);if(h>water+.005&&o-h<.13*base)centers.push({x,z,cost:Math.hypot(x-preferred.x*.55,z-preferred.z*.55)});
  }centers.sort((a,b)=>a.cost-b.cost);
  for(const reduction of [1,.85,.7,.55,.42,.33,.25]){
    const scale=base*reduction;
    for(const rows of [5,8,10]){
      const columns=Math.ceil(20/rows),deployment=(1.8+(columns-1)*.62)*scale,halfWidth=deployment+.5*scale,halfDepth=((rows-1)*.34+.42)*scale;
      for(const center of centers)for(const yaw of [0,Math.PI/2,Math.PI/4,-Math.PI/4,Math.PI/8,-Math.PI/8,Math.PI*3/8,-Math.PI*3/8]){
        const c=Math.cos(yaw),sn=Math.sin(yaw);let low=Infinity,high=-Infinity,valid=true;
        const sample=(u,v)=>{const x=center.x+c*u-sn*v,z=center.z+sn*u+c*v,h=asset.groundHeight(x,z),o=asset.obstacleHeight(x,z);if(!Number.isFinite(h)||!Number.isFinite(o)||h<water+.018*scale||o-h>.12*scale){valid=false;return NaN;}low=Math.min(low,h);high=Math.max(high,h);return h;};
        for(const [u,v]of [[0,0],[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]){sample(u*halfWidth,v*halfDepth);if(!valid)break;}
        if(!valid)continue;
        let previous=[];
        for(let ix=0;ix<=24&&valid;ix++){
          const current=[];
          for(let iz=0;iz<=10&&valid;iz++){
            const h=sample((ix/12-1)*halfWidth,(iz/5-1)*halfDepth);current.push(h);
            if(ix&&Math.abs(h-previous[iz])/(halfWidth/12)>1.6||iz&&Math.abs(h-current[iz-1])/(halfDepth/5)>1.6)valid=false;
          }previous=current;
        }
        if(!valid)continue;
        // Validate the actual deployment/charge tracks, including a small body
        // clearance. A regular rectangle grid alone can miss a narrow wall.
        for(let qi=0;qi<=20&&valid;qi++)for(const side of [-1,1])for(let i=0;i<20&&valid;i++){
          const q=qi/20,column=Math.floor(i/rows),row=i%rows,x=side*((deployment-(columns-1)*.62*scale+column*.62*scale)*(1-q)+(.4+column*.64)*scale*q),z=(row-(rows-1)/2)*.68*scale;
          for(const [dx,dz]of [[0,0],[.18,0],[-.18,0],[0,.18],[0,-.18]]){sample(x+dx*scale,z+dz*scale);if(!valid)break;}
        }
        if(!valid)continue;
        const y=asset.groundHeight(center.x,center.z);
        return {center:[center.x,y,center.z],scale,rows,yaw,halfWidth,halfDepth,deployment,startLeft:[-deployment,y,center.z],startRight:[deployment,y,center.z],minX:center.x-halfWidth,maxX:center.x+halfWidth,minZ:center.z-halfDepth,maxZ:center.z+halfDepth,radius,surface:'existing-blender-ground',groundRange:[low,high]};
      }
    }
  }
  return null;
}

/** Read-only camera selection: test the real diorama, including trees and roofs. */
export function chooseBlenderBattleCamera(target,arena,asset){
  const s=arena.scale||1,ground=asset.groundHeight,obstacle=asset.obstacleHeight;
  const range=arena.groundRange||[arena.center[1],arena.center[1]],focus=new THREE.Vector3(arena.center[0],(range[0]+range[1])*.5+.45*s,arena.center[2]);
  const samples=[];
  for(const q of [0,1])for(const side of [-1,1])for(let i=0;i<20;i++){
    const p=battleFormationPosition(i,side,q,arena);p.y=ground(p.x,p.z)+.32*s;samples.push(p);
  }
  const meshes=[];target.updateMatrixWorld(true);target.traverseVisible(o=>{if(o.isMesh&&!o.material?.transparent)meshes.push(o);});
  const ray=new THREE.Raycaster(),direction=new THREE.Vector3();
  const poses=position=>[0,.5,1].map(k=>position.clone().add(new THREE.Vector3(Math.sin(k*.55)*1.8,k,-k*.5).multiplyScalar(s)));
  const heightClear=(camera,point)=>{
    const dx=point.x-camera.x,dz=point.z-camera.z,steps=Math.max(12,Math.ceil(Math.hypot(dx,dz)/(.14*s)));
    for(let k=1;k<steps;k++){const u=k/steps,x=camera.x+dx*u,z=camera.z+dz*u,y=THREE.MathUtils.lerp(camera.y,point.y,u);if(obstacle(x,z)>y-.025*s)return false;}
    return true;
  };
  const meshClear=(camera,point)=>{
    direction.subVectors(point,camera);const length=direction.length();ray.set(camera,direction.multiplyScalar(1/Math.max(.0001,length)));ray.near=.025*s;ray.far=Math.max(ray.near,length-.04*s);return ray.intersectObjects(meshes,false).length===0;
  };
  const verify=(position,exact=true)=>{
    for(const camera of poses(position))for(const point of samples){if(!heightClear(camera,point)||exact&&!meshClear(camera,point))return false;}
    return true;
  };
  const originalAngle=(arena.yaw||0)+Math.atan2(10.6,5.5),distance=Math.hypot(5.5,10.6)*s;
  const angles=[0,1,-1,2,-2,3,-3,4,-4,5,-5,6,-6,7,-7,8].map(i=>originalAngle+i*Math.PI/8);
  for(const height of [6.4,8.5,11,14,18,24])for(const angle of angles){
    const position=new THREE.Vector3(arena.center[0]+Math.cos(angle)*distance,range[1]+height*s,arena.center[2]+Math.sin(angle)*distance);
    position.y=Math.max(position.y,obstacle(position.x,position.z)+2*s);
    if(!verify(position,false)||!verify(position,true))continue;
    return {position,focus,source:'heightfield-and-mesh',sampleCount:samples.length,visibleSamples:samples.length,height,yaw:angle};
  }
  // A steep view above the complete model remains a safe last camera option.
  const top=asset.bounds?.max.y??range[1],position=new THREE.Vector3(arena.center[0]+2*s,Math.max(top+8*s,range[1]+30*s),arena.center[2]+4*s);
  const visible=verify(position,true);
  return {position,focus,source:visible?'overhead-clear':'overhead-unverified',sampleCount:samples.length,visibleSamples:visible?samples.length:0,height:(position.y-range[1])/s};
}

const CSS=`
.attack-cinematic{position:fixed;inset:10px;width:calc(100vw - 20px);height:calc(100dvh - 20px);max-width:none;max-height:none;margin:auto;padding:0;border:1px solid #68818b;border-radius:14px;background:#173444;color:#f1ebda;overflow:hidden;box-shadow:0 30px 100px #0008;font:13px/1.5 Inter,system-ui,sans-serif;z-index:10000}
.attack-cinematic::backdrop{background:#03131be8;backdrop-filter:blur(7px)}.attack-cinematic canvas{display:block;width:100%;height:100%;outline:0}.attack-cinematic__head{position:absolute;left:22px;right:22px;top:18px;z-index:3;display:flex;gap:18px;align-items:flex-start;justify-content:space-between;pointer-events:none}.attack-cinematic__identity{max-width:70%;padding:12px 15px;background:#0b2635d9;border:1px solid #62808b88;border-radius:9px;backdrop-filter:blur(8px)}.attack-cinematic__kicker{font-size:8px;letter-spacing:.17em;color:#d0ba85;margin:0 0 4px}.attack-cinematic h2{font:700 26px/1.1 'Big Shoulders Display',Impact,sans-serif;letter-spacing:.035em;margin:0}.attack-cinematic__route{font-size:10px;color:#b7d0d0;margin:6px 0 0}.attack-cinematic__skip{pointer-events:auto;border:1px solid #76919a;border-radius:7px;background:#153443d9;color:#e5eadc;padding:8px 14px;min-height:40px;font:11px Inter,system-ui,sans-serif;cursor:pointer}.attack-cinematic__skip:hover{background:#315765}.attack-cinematic__skip:focus-visible{outline:2px solid #eaca8c;outline-offset:3px}.attack-cinematic__caption{position:absolute;bottom:32px;left:20px;right:20px;text-align:center;pointer-events:none;color:#f5e7c3;font:600 16px/1.45 Inter,system-ui,sans-serif;text-shadow:0 2px 8px #001b27}.attack-cinematic__detail{display:block;margin-top:7px;font:11px/1.5 Inter,system-ui,sans-serif;color:#d0e0dc}.attack-cinematic__progress{position:absolute;bottom:0;left:0;height:3px;background:#e2c185;width:0;z-index:3}.attack-cinematic__shade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(#00131c33,transparent 25%,transparent 70%,#00131c66)}@media(max-width:600px){.attack-cinematic{inset:6px;width:calc(100vw - 12px);height:calc(100dvh - 12px)}.attack-cinematic__head{left:12px;right:12px;top:12px;gap:8px}.attack-cinematic__identity{padding:9px 11px}.attack-cinematic h2{font-size:22px}.attack-cinematic__caption{font-size:13px;bottom:26px}.attack-cinematic__detail{font-size:10px}.attack-cinematic__skip{padding:7px 10px}}
`;
function ensureStyle(){if(document.getElementById('attack-cinematic-style'))return;const style=document.createElement('style');style.id='attack-cinematic-style';style.textContent=CSS;document.head.appendChild(style);}
function disposeObject(root){const controllers=[];root.traverse(o=>{if(typeof o.userData.dispose==='function')controllers.push(()=>o.userData.dispose());});controllers.forEach(fn=>{try{fn();}catch(_){}});const geometries=new Set(),materials=new Set(),textures=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const t of o.userData.textures||[])textures.add(t);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);});});textures.forEach(t=>t.dispose());geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}

export function playAttackCinematic({container,battle={},onFinish=()=>{}}={}){
  let closed=false,raf=0,observer=null,renderer=null,environment=null,scene=null,dialog=null,loadAbort=null,blenderAsset=null;
  let scenery={source:'preparing',reason:''},playback={phase:'preparing',progress:0};
  const previousFocus=typeof document!=='undefined'?document.activeElement:null;
  const notify=reason=>{queueMicrotask(()=>onFinish({reason,battleId:battle.id}));};
  const finish=(reason='complete')=>{
    if(closed)return;closed=true;playback.phase=reason==='complete'?'done':reason;if(reason==='complete')playback.progress=1;loadAbort?.abort();if(raf)cancelAnimationFrame(raf);observer?.disconnect();
    if(typeof window!=='undefined')window.removeEventListener('resize',resize);
    try{blenderAsset?.group.removeFromParent();blenderAsset?.dispose();blenderAsset=null;}catch(_){}
    try{environment?.dispose();}catch(_){}try{if(scene)disposeObject(scene);}catch(_){}
    try{renderer?.domElement.removeEventListener('webglcontextlost',lost);renderer?.dispose();renderer?.forceContextLoss();}catch(_){}
    if(dialog){if(dialog.open&&typeof dialog.close==='function')dialog.close();dialog.remove();}
    if(previousFocus?.isConnected)previousFocus.focus();notify(reason);
  };
  const api={skip:()=>finish('skipped'),dispose:()=>finish('disposed'),get scenery(){return {...scenery,soldiers:scenery.soldiers?{...scenery.soldiers}:null};},get phase(){return playback.phase;},get progress(){return playback.progress;}};
  const camera=new THREE.PerspectiveCamera(44,1,.08,700);
  function resize(){if(!renderer||closed||!dialog)return;const w=Math.max(1,dialog.clientWidth),h=Math.max(1,dialog.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();environment?.resize(w,h);}
  function lost(event){event.preventDefault();finish('graphics-unavailable');}
  if(typeof document==='undefined'){notify('unavailable');closed=true;return api;}
  try{
    ensureStyle();dialog=document.createElement('dialog');dialog.className='attack-cinematic';dialog.setAttribute('aria-labelledby','attack-cinematic-title');
    dialog.innerHTML='<div class="attack-cinematic__shade"></div><header class="attack-cinematic__head"><div class="attack-cinematic__identity"><p class="attack-cinematic__kicker">BATAILLE NAVALE · GRAND LINE</p><h2 id="attack-cinematic-title"></h2><p class="attack-cinematic__route"></p></div><button class="attack-cinematic__skip" type="button">Passer ↗</button></header><div class="attack-cinematic__caption" aria-live="polite"></div><div class="attack-cinematic__progress"></div>';
    (container||document.body).appendChild(dialog);if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
    const title=dialog.querySelector('h2'),route=dialog.querySelector('.attack-cinematic__route'),caption=dialog.querySelector('.attack-cinematic__caption'),progress=dialog.querySelector('.attack-cinematic__progress'),skip=dialog.querySelector('button');
    title.textContent=battle.to?.name||'Île attaquée';route.textContent=(battle.from?.name||'Port de départ')+' → '+(battle.to?.name||'Île cible');
    skip.addEventListener('click',api.skip);dialog.addEventListener('cancel',e=>{e.preventDefault();api.skip();});dialog.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();api.skip();}});dialog.addEventListener('close',()=>finish('skipped'));
    caption.textContent='Préparation de l’île…';
    const setup=async()=>{
      try{
        loadAbort=new AbortController();let loaded=null,blenderArena=null,timedOut=false;
        const loadingDeadline=setTimeout(()=>{timedOut=true;loadAbort.abort();},15000);
        try{loaded=await loadBlenderDiorama(battle.to||{}, {unitScale:.35,lod:'lod0',signal:loadAbort.signal});}
        catch(error){if(error?.name==='AbortError'&&!timedOut)throw error;scenery.reason=timedOut?'loading-timeout':'unavailable-model';if(!timedOut)console.warn('Bataille Blender :',error);}
        finally{clearTimeout(loadingDeadline);}
        if(closed){loaded?.dispose();return;}
        if(loaded)blenderArena=findBlenderBattlefield(loaded);
        if(loaded&&!blenderArena){loaded.dispose();loaded=null;scenery.reason='no-clear-battlefield';}
        blenderAsset=loaded;scenery={source:loaded?'blender':'procedural',reason:loaded?'':scenery.reason||'no-model'};
    renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.85;renderer.domElement.setAttribute('aria-label','Cinématique de la bataille de '+(battle.to?.name||'Grand Line'));renderer.domElement.addEventListener('webglcontextlost',lost);dialog.prepend(renderer.domElement);
    scene=new THREE.Scene();const theme=adventureTheme(battle.to||{name:'Grand Line'},battle.to?.theme);environment=createAdventureEnvironment({renderer,scene,camera,theme,quality:'standard'});
    const outcome=cinematicOutcome(battle),counts=battleCastCounts(battle),attacker=battle.attacker||{},defender=battle.defender||{},attColor=attacker.color||'#bf795f',defColor=defender.color||'#8eaa9a';
    const target=blenderAsset?blenderAsset.group:buildAdventureIsland({...battle.to,name:battle.to?.name||'Grand Line',owner:defender.id??-1,capital:false},theme,{battlefield:true});scene.add(target);
    if(blenderAsset){target.userData.battlefield=blenderArena;target.userData.heightAt=blenderAsset.groundHeight;target.userData.radius=blenderAsset.radius;}
    const arena=target.userData.battlefield,sceneScale=arena.scale||1,travelScale=blenderAsset?Math.max(.2,(blenderAsset.navigationRadius||blenderAsset.radius)/14.16):1,waterLevel=blenderAsset?blenderAsset.waterLevel:-1.24;
    environment.ocean.position.y=waterLevel;environment.ocean.material.uniforms.uCoasts.value[0].set(0,0,target.userData.radius);camera.near=Math.max(.006,.08*sceneScale);camera.updateProjectionMatrix();
    const ship=buildSailingShip(attColor,!!attacker.marine);ship.scale.setScalar(1.12*travelScale);scene.add(ship);
    // A modest departure coastline remains at the horizon during the crossing.
    const source=new THREE.Group();source.position.set(-26*travelScale,waterLevel+.24*travelScale,18*travelScale);source.scale.setScalar(travelScale);scene.add(source);
    const sourceLand=new THREE.Mesh(new THREE.CylinderGeometry(3.8,4.5,.75,32),new THREE.MeshStandardMaterial({color:battle.from?.theme?.palette?.[1]||'#7d9d6b',roughness:.9}));sourceLand.scale.z=.75;sourceLand.position.y=.15;source.add(sourceLand);
    const quay=new THREE.Mesh(new THREE.BoxGeometry(1,.12,2.4),new THREE.MeshStandardMaterial({color:'#a88a5e',roughness:.8}));quay.position.set(3.3,.3,-.3);source.add(quay);
    const wake=new THREE.Group();scene.add(wake);const wakeMaterial=new THREE.MeshBasicMaterial({color:'#d8ece1',transparent:true,opacity:.33,depthWrite:false,side:THREE.DoubleSide});for(let i=0;i<17;i++){const p=new THREE.Mesh(new THREE.RingGeometry(.14,.18,24),wakeMaterial);p.rotation.x=-Math.PI/2;p.position.y=-1.12;wake.add(p);}
    const sourceObstacle={id:'departure',x:source.position.x,z:source.position.z,radius:4.6*travelScale},targetObstacle={id:'target',x:0,z:0,radius:target.userData.radius||14.2};
    const seaPath=planMaritimeRoute({from:sourceObstacle,to:targetObstacle,islands:[sourceObstacle,targetObstacle],wall:null,lane:.6*travelScale,margin:1.1*travelScale,cellSize:Math.max(.08,.32*travelScale)});
    if(!seaPath.valid)throw new Error('Aucun port sûr pour la traversée.');
    const portDirection=seaPath.start.clone().sub(new THREE.Vector3(source.position.x,0,source.position.z)).normalize();
    quay.position.set(portDirection.x*4.4,.3,portDirection.z*4.4);quay.rotation.y=Math.atan2(portDirection.x,portDirection.z);
    const arenaZ=arena.center[2];
    const ground=(x,z)=>target.userData.heightAt?.(x,z)??arena.center[1];
    const cameraPlan=blenderAsset?chooseBlenderBattleCamera(target,arena,blenderAsset):null;
    if(cameraPlan)scenery.camera={source:cameraPlan.source,sampleCount:cameraPlan.sampleCount,visibleSamples:cameraPlan.visibleSamples,height:cameraPlan.height};
    const actorsA=[],actorsD=[],fightRoot=new THREE.Group();scene.add(fightRoot);
    const buildSide=(amount,side,color,marine,faction,boss=false)=>{const list=[];for(let i=0;i<amount;i++){const actor=buildCinematicSoldier(color,marine,i,faction,!!faction||marine);actor.userData.side=side;actor.userData.boss=boss;actor.scale.setScalar((boss?.82:.52)*sceneScale);fightRoot.add(actor);list.push(actor);}return list;};
    actorsA.push(...buildSide(counts.attackers.before,-1,attColor,!!attacker.marine,attacker.crewid));
    const boss=!!battle.boss;actorsD.push(...buildSide(boss?1:counts.defenders.before,1,boss?'#a66a60':defColor,boss?false:!!defender.marine,boss?'bounty':defender.crewid,boss));fightRoot.visible=false;scenery.soldiers={attackers:actorsA.length,defenders:actorsD.length};
    // Flashes and smoke are brief, small effects rather than whole-screen bloom.
    const flashes=[],smoke=[],effectRoot=new THREE.Group();scene.add(effectRoot);
    for(let i=0;i<8;i++){const m=new THREE.Mesh(new THREE.OctahedronGeometry(.105),new THREE.MeshBasicMaterial({color:'#ffc777',transparent:true,opacity:.86,toneMapped:false}));m.visible=false;effectRoot.add(m);flashes.push(m);}
    for(let i=0;i<14;i++){const m=new THREE.Mesh(new THREE.IcosahedronGeometry(.18,1),new THREE.MeshStandardMaterial({color:'#9b9c91',transparent:true,opacity:.21,depthWrite:false,roughness:1}));m.visible=false;effectRoot.add(m);smoke.push(m);}
    const marker=new THREE.Group();scene.add(marker);const ringMaterial=new THREE.MeshBasicMaterial({color:defColor,transparent:true,opacity:.72,side:THREE.DoubleSide,depthWrite:false});const ring=new THREE.Mesh(new THREE.RingGeometry(target.userData.radius*1.015,target.userData.radius*1.015+.15,128),ringMaterial);ring.rotation.x=-Math.PI/2;ring.position.y=waterLevel+.34*travelScale;marker.add(ring);
    const flagPoint=battlefieldPoint(arena,-5.3*sceneScale,0),flagX=flagPoint.x,flagZ=flagPoint.z,flagY=ground(flagX,flagZ),mast=new THREE.Mesh(new THREE.CylinderGeometry(.035,.05,2.1,10),new THREE.MeshStandardMaterial({color:'#c9bea0',roughness:.7}));mast.scale.setScalar(sceneScale);mast.position.set(flagX,flagY+1.05*sceneScale,flagZ);marker.add(mast);
    const flagGeometry=new THREE.PlaneGeometry(.9,.47,16,4),flagMaterial=new THREE.MeshStandardMaterial({color:defColor,side:THREE.DoubleSide,roughness:.65});const flag=new THREE.Mesh(flagGeometry,flagMaterial),flagCenter=battlefieldPoint(arena,-4.85*sceneScale,0);flag.scale.setScalar(sceneScale);flag.rotation.y=-(arena.yaw||0);flag.position.set(flagCenter.x,flagY+1.79*sceneScale,flagCenter.z);marker.add(flag);
    const flagBase=Float32Array.from(flagGeometry.attributes.position.array),flagPositions=flagGeometry.attributes.position;
    const captureColor=new THREE.Color(outcome.captured?attColor:defColor),originalColor=new THREE.Color(defColor);
    let lastPhase='',started=null,lastTime=0,shipHeading=null;
    const duration=Math.max(4,Number(battle.duration)||ATTACK_CINEMATIC_DURATION);
    const putCaption=timeline=>{
      if(lastPhase===timeline.phase)return;lastPhase=timeline.phase;let text='',detail='';
      if(timeline.phase==='sea'){text='La flotte prend la mer';detail=(attacker.name||'Attaquants')+' quitte '+(battle.from?.name||'son port')+'.';}
      else if(timeline.phase==='approach'){text='Débarquement à '+(battle.to?.name||'l’île cible');detail='Les troupes rejoignent la côte.';}
      else if(timeline.phase==='charge'){text=boss?'Assaut contre '+(battle.boss.name||'le gardien'):'Les troupes se mettent en ligne';detail=(attacker.name||'Attaquants')+' face à '+(defender.name||'la garnison locale')+'.';}
      else if(timeline.phase==='battle'){text='L’affrontement';detail='Les deux camps s’affrontent sur l’île.';}
      else{text=outcome.captured?'Île conquise par '+(attacker.name||'les attaquants'):battle.retreat?'Les attaquants se replient':outcome.attackerWon&&boss?'Le gardien est vaincu':'L’attaque est repoussée';detail=boss?(battle.boss.name||'Gardien')+' · '+Math.max(0,Math.round(battle.boss.hpAfter||0))+' PV restants':Math.round(counts.attackers.realAfter)+' attaquants et '+Math.round(counts.defenders.realAfter)+' défenseurs survivants.';}
      caption.replaceChildren(document.createTextNode(text));const small=document.createElement('span');small.className='attack-cinematic__detail';small.textContent=detail;caption.appendChild(small);
    };
    const updateTroops=(list,side,timeline,time)=>{
      const isAtt=side===-1,realCounts=isAtt?counts.attackers:counts.defenders,survivors=boss&&!isAtt?(Number(battle.boss.hpAfter)>0?1:0):realCounts.after;
      let loss=ease((timeline.time-7.0)/2.65),charge=ease((timeline.time-4.4)/2.0),endRetreat=ease((timeline.time-9.7)/2.1);
      list.forEach((actor,i)=>{
        const falling=i>=survivors,threshold=falling?(i-survivors)/Math.max(1,list.length-survivors):2,death=falling?ease((loss-threshold)*Math.max(5,list.length-survivors)):0;
        const position=battleFormationPosition(i,side,charge,arena);let x=position.x,z=position.z;
        if(timeline.phase==='battle'){x+=Math.sin(time*3+i*1.1)*.055*sceneScale;z+=Math.sin(time*2.3+i)*.045*sceneScale;}
        if(battle.retreat&&isAtt&&i<survivors){x-=endRetreat*1.8*sceneScale*Math.cos(arena.yaw||0);z-=endRetreat*1.8*sceneScale*Math.sin(arena.yaw||0);}
        else if(timeline.time>=9.7&&isAtt&&!outcome.captured&&i<survivors){x-=endRetreat*1.5*sceneScale*Math.cos(arena.yaw||0);z-=endRetreat*1.5*sceneScale*Math.sin(arena.yaw||0);}
        actor.position.set(x,ground(x,z),z);actor.rotation.set(0,(side===-1?Math.PI/2:-Math.PI/2)-(arena.yaw||0),0);
        const walking=timeline.time<6.4||timeline.time>9.7&&isAtt&&!outcome.captured,attackPhase=(time*1.55+i*.31)%1;
        const state=death>0?'ko':walking?'run':timeline.phase==='battle'?((i+Math.floor(time*2))%9===0?'hit':actor.userData.ranged?'ranged':'melee'):timeline.time<9.7?'guard':'idle';
        animateOrganicCharacter(actor,{time:time+i*.07,state,phase:death>0?death:attackPhase});
        actor.visible=death<.99;actor.scale.setScalar((actor.userData.boss?.82:.52)*sceneScale*(1-death*.12));

      });
    };
    const update=time=>{
      const tl=cinematicTimeline(time,duration);playback={phase:tl.phase,progress:tl.overall};putCaption(tl);progress.style.width=(tl.overall*100)+'%';
      if(target.userData.npcPopulation)target.userData.npcPopulation.group.visible=tl.time<4.4;target.userData.update?.(time);environment.update(time);
      const seaProgress=ease(Math.min(tl.time/3.2,1)),point=seaPath.getPoint(seaProgress),tangent=seaPath.getTangent(seaProgress);
      ship.position.copy(point);ship.position.y=waterLevel+.19*travelScale+Math.sin(time*2.1)*.04*travelScale;
      const heading=Math.atan2(tangent.x,tangent.z);if(shipHeading===null)shipHeading=heading;shipHeading+=Math.atan2(Math.sin(heading-shipHeading),Math.cos(heading-shipHeading))*.18;ship.rotation.y=shipHeading;ship.rotation.z=Math.sin(time*1.7)*.025;
      wake.children.forEach((m,i)=>{const age=i/wake.children.length,wp=seaPath.getPoint(Math.max(0,seaProgress-(.35+age*2.1)*travelScale/seaPath.length));m.position.set(wp.x,waterLevel+.135*travelScale,wp.z);m.scale.set((.65+age*1.8)*travelScale,(.35+age*.8)*travelScale,travelScale);m.visible=tl.time<4.3;});
      const arenaFocus=cameraPlan?cameraPlan.focus:new THREE.Vector3(arena.center[0],(arena.groundRange?(arena.groundRange[0]+arena.groundRange[1])*.5:arena.center[1])+.45*sceneScale,arenaZ),approachCamera=seaPath.end.clone().add(new THREE.Vector3(-3.3,2.5,4.5).multiplyScalar(travelScale));approachCamera.y+=waterLevel+1.24*travelScale;
      const combatCamera=cameraPlan?cameraPlan.position:battlefieldPoint(arena,5.5*sceneScale,10.6*sceneScale,(arena.groundRange?.[1]??arena.center[1])+6.4*sceneScale);
      if(tl.time<3.2){camera.position.copy(point).add(new THREE.Vector3(-3.3,2.5,4.5).multiplyScalar(travelScale));camera.position.y+=waterLevel+1.24*travelScale;camera.lookAt(point.clone().add(new THREE.Vector3(tangent.x*2*travelScale,waterLevel+1.44*travelScale,tangent.z*2*travelScale)));}
      else if(tl.time<4.4){const q=ease((tl.time-3.2)/1.2);camera.position.lerpVectors(approachCamera,combatCamera,q);camera.lookAt(new THREE.Vector3().lerpVectors(point.clone().add(new THREE.Vector3(tangent.x*2*travelScale,waterLevel+1.44*travelScale,tangent.z*2*travelScale)),arenaFocus,q));}
      else{const capture=ease((tl.time-9.7)/2.1);camera.position.copy(combatCamera).add(new THREE.Vector3(Math.sin(capture*.55)*1.8,capture*1.0,-capture*.5).multiplyScalar(sceneScale));camera.lookAt(arenaFocus);}
      fightRoot.visible=tl.time>=4.4;updateTroops(actorsA,-1,tl,time);updateTroops(actorsD,1,tl,time);separateBattleUnits([...actorsA,...actorsD],arena,ground);
      const fighting=tl.phase==='battle'&&actorsD.length>0&&actorsA.length>0;flashes.forEach((m,i)=>{const blink=(time*5+i*.61)%1;m.visible=fighting&&blink<.13;const p=battlefieldPoint(arena,(i%2?1:-1)*(.2+(i%3)*.22)*sceneScale,((i%3)-1)*.45*sceneScale);m.position.set(p.x,ground(p.x,p.z)+.55*sceneScale,p.z);m.scale.setScalar((.7+Math.sin(time*18+i)*.2)*sceneScale);});
      smoke.forEach((m,i)=>{const q=(time*.7+i/14)%1;m.visible=fighting;const p=battlefieldPoint(arena,(Math.sin(i*2.4)*.9+q*.2)*sceneScale,Math.cos(i*2.4)*.7*sceneScale);m.position.set(p.x,ground(p.x,p.z)+(.3+q*.95)*sceneScale,p.z);m.scale.setScalar((.6+q*1.6)*(1-q*.8)*sceneScale);});
      const capture=ease((tl.time-9.7)/1.3);ringMaterial.color.copy(originalColor).lerp(captureColor,capture);flagMaterial.color.copy(originalColor).lerp(captureColor,capture);flag.position.y=flagY+(1.79+(outcome.captured?Math.sin(capture*Math.PI)*.18:0))*sceneScale;
      for(let i=0;i<flagPositions.count;i++){const x=flagBase[i*3];flagPositions.setZ(i,Math.sin(x*6+time*2.3)*.065*(x+.5));}flagPositions.needsUpdate=true;
      if(tl.phase==='done'){finish('complete');return;}environment.render();
    };
    const frame=now=>{if(closed)return;raf=requestAnimationFrame(frame);if(document.hidden){lastTime=now;return;}if(started===null)started=now;const delta=lastTime?Math.min(.1,(now-lastTime)/1000):0;lastTime=now;elapsed+=delta;try{update(elapsed);}catch(error){finish('render-error');}};
    calibrateClearMaterials(target);calibrateClearMaterials(source);
    let elapsed=0;observer=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;observer?.observe(dialog);window.addEventListener('resize',resize);resize();skip.focus();raf=requestAnimationFrame(frame);
      }catch(error){if(!closed)finish('graphics-unavailable');}
    };
    void setup();
  }catch(error){finish('graphics-unavailable');}
  return api;
}
