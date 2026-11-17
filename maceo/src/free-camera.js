import { MOUSE, TOUCH, Vector3 } from 'three';

const FORWARD=new Set(['w','z','arrowup']);
const BACK=new Set(['s','arrowdown']);
const LEFT=new Set(['a','q','arrowleft']);
const RIGHT=new Set(['d','arrowright']);
const MOVEMENT=new Set([...FORWARD,...BACK,...LEFT,...RIGHT]);
const hasAny=(keys,values)=>{for(const k of values)if(keys.has?keys.has(k):keys[k])return true;return false;};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/** A horizontal displacement, independent of the camera's height or inclination. */
export function computePanStep(keys,forward,speed=8,dt=1/60){
  let fx=Number(forward?.x)||0,fz=Number(forward?.z)||0;
  const length=Math.hypot(fx,fz);if(length<1e-7){fx=0;fz=-1;}else{fx/=length;fz/=length;}
  const f=Number(hasAny(keys,FORWARD))-Number(hasAny(keys,BACK));
  const r=Number(hasAny(keys,RIGHT))-Number(hasAny(keys,LEFT));
  let x=fx*f-fz*r,z=fz*f+fx*r;
  const magnitude=Math.hypot(x,z);if(magnitude>1){x/=magnitude;z/=magnitude;}
  const distance=Math.max(0,Number(speed)||0)*clamp(Number(dt)||0,0,.1);
  return {x:x*distance,y:0,z:z*distance};
}

const interactiveTarget=target=>{
  if(!target)return false;
  if(target.isContentEditable)return true;
  return !!target.closest?.('input,select,textarea,button,[contenteditable=""],[contenteditable="true"],dialog,[role="dialog"]');
};

/** Adds free ground-plane travel while OrbitControls retains rotation and wheel zoom. */
export function attachFreeCamera({camera,controls,element,isEnabled=()=>true,onTactical,
  worldBounds={minX:-35,maxX:35,minZ:-25,maxZ:25},speed=8}){
  if(!camera||!controls||!element)throw new Error('La caméra libre nécessite une caméra, ses contrôles et un élément de rendu.');
  const host=element.ownerDocument?.defaultView||(typeof window!=='undefined'?window:null);
  if(!host?.addEventListener)throw new Error('La caméra libre nécessite une fenêtre de navigateur.');
  const previous={enablePan:controls.enablePan,screenSpacePanning:controls.screenSpacePanning,
    maxTargetRadius:controls.maxTargetRadius,minDistance:controls.minDistance,maxDistance:controls.maxDistance,
    minPolarAngle:controls.minPolarAngle,maxPolarAngle:controls.maxPolarAngle,
    minAzimuthAngle:controls.minAzimuthAngle,maxAzimuthAngle:controls.maxAzimuthAngle,
    mouseButtons:{...controls.mouseButtons},touches:{...controls.touches}};
  controls.enablePan=true;controls.screenSpacePanning=false;controls.maxTargetRadius=Infinity;
  controls.minDistance=.65;controls.maxDistance=90;controls.minPolarAngle=.1;controls.maxPolarAngle=Math.PI*.499;
  controls.minAzimuthAngle=-Infinity;controls.maxAzimuthAngle=Infinity;
  controls.mouseButtons={...controls.mouseButtons,LEFT:MOUSE.ROTATE,MIDDLE:MOUSE.PAN,RIGHT:MOUSE.PAN};
  controls.touches={...controls.touches,ONE:TOUCH.ROTATE,TWO:TOUCH.DOLLY_PAN};
  const previousTabIndex=element.tabIndex;if(!Number.isFinite(element.tabIndex)||element.tabIndex<0)element.tabIndex=0;
  const focus=()=>element.focus?.({preventScroll:true});element.addEventListener('pointerdown',focus);
  const keys=new Set(),velocity=new Vector3(),direction=new Vector3(),offset=new Vector3();
  let disposed=false;
  const bounds={minX:Number.isFinite(worldBounds.minX)?worldBounds.minX:-35,maxX:Number.isFinite(worldBounds.maxX)?worldBounds.maxX:35,
    minZ:Number.isFinite(worldBounds.minZ)?worldBounds.minZ:-25,maxZ:Number.isFinite(worldBounds.maxZ)?worldBounds.maxZ:25};
  const margin=Math.max(20,(bounds.maxX-bounds.minX)*.5,(bounds.maxZ-bounds.minZ)*.5);
  const resetKeys=()=>{keys.clear();velocity.set(0,0,0);};
  const enabled=()=>!disposed&&isEnabled();
  const down=e=>{
    if(!enabled()||(interactiveTarget(e.target)&&e.target!==element&&!element.contains?.(e.target))||e.ctrlKey||e.metaKey||e.altKey)return;
    const key=String(e.key||'').toLowerCase();
    if(key==='t'&&typeof onTactical==='function'){
      resetKeys();onTactical();e.preventDefault();e.stopPropagation();return;
    }
    if(!MOVEMENT.has(key))return;
    keys.add(key);e.preventDefault();e.stopPropagation();
  };
  const up=e=>{const key=String(e.key||'').toLowerCase();const wasDown=keys.delete(key);if(wasDown&&enabled()){e.preventDefault();e.stopPropagation();}};
  const blur=()=>resetKeys();
  const visibility=()=>{if(element.ownerDocument?.hidden)resetKeys();};
  const contextmenu=e=>{if(enabled())e.preventDefault();};
  host.addEventListener('keydown',down,true);host.addEventListener('keyup',up,true);host.addEventListener('blur',blur);
  element.ownerDocument?.addEventListener?.('visibilitychange',visibility);
  element.addEventListener('contextmenu',contextmenu);
  const constrainAxis=(axis,min,max)=>{
    const target=controls.target[axis],position=camera.position[axis];
    const low=Math.max(min-target,min-margin-position),high=Math.min(max-target,max+margin-position);
    // The wide camera margin preserves its relative offset at normal orbit distances.
    const delta=low<=high?clamp(0,low,high):clamp(target,min,max)-target;
    if(delta){controls.target[axis]+=delta;camera.position[axis]+=delta;velocity[axis]=0;}
  };
  const update=deltaSeconds=>{
    if(disposed)return;
    if(!enabled()){resetKeys();return;}
    const dt=clamp(Number(deltaSeconds)||0,0,.1);
    camera.getWorldDirection(direction);
    const step=computePanStep(keys,direction,speed,dt||1/60);
    const invDt=dt>0?1/dt:0,blend=1-Math.exp(-dt*10);
    velocity.x+=(step.x*invDt-velocity.x)*blend;velocity.z+=(step.z*invDt-velocity.z)*blend;
    if(Math.abs(velocity.x)<.0001)velocity.x=0;if(Math.abs(velocity.z)<.0001)velocity.z=0;
    offset.set(velocity.x*dt,0,velocity.z*dt);camera.position.add(offset);controls.target.add(offset);
    constrainAxis('x',bounds.minX,bounds.maxX);constrainAxis('z',bounds.minZ,bounds.maxZ);
    camera.updateMatrixWorld();
  };
  const dispose=()=>{
    if(disposed)return;disposed=true;resetKeys();
    host.removeEventListener('keydown',down,true);host.removeEventListener('keyup',up,true);host.removeEventListener('blur',blur);
    element.ownerDocument?.removeEventListener?.('visibilitychange',visibility);element.removeEventListener('contextmenu',contextmenu);element.removeEventListener('pointerdown',focus);element.tabIndex=previousTabIndex;
    Object.assign(controls,previous);
  };
  return {update,dispose,resetKeys};
}
