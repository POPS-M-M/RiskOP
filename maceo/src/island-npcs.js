import * as THREE from 'three';

const TAU=Math.PI*2;
const COLORS=['#4c8df6','#ee5b52','#3fc27a','#b672ee'];
const SKIN=['#d8ae82','#be8c68','#e6c29b','#a77759','#cf9b72'];
const SHIRTS=['#bca978','#8faca4','#bc8e77','#a2a5bd','#d0bc91'];
const PANTS=['#586879','#665f59','#69746b','#625b72'];
const ROUND_SLOTS=26,BODY_SLOTS=3,LIMB_SLOTS=13,OUTLINE_SLOTS=12;
function seedFor(text){let h=2166136261;for(const c of String(text))h=Math.imul(h^c.charCodeAt(0),16777619);return()=>{h+=0x6d2b79f5;let n=Math.imul(h^(h>>>15),h|1);n^=n+Math.imul(n^(n>>>7),n|61);return((n^(n>>>14))>>>0)/4294967296;};}
function unitGeometry(geometry){geometry.computeBoundingBox();const size=new THREE.Vector3(),center=new THREE.Vector3();geometry.boundingBox.getSize(size);geometry.boundingBox.getCenter(center);geometry.translate(-center.x,-center.y,-center.z);geometry.scale(1/Math.max(size.x,.0001),1/Math.max(size.y,.0001),1/Math.max(size.z,.0001));return geometry;}

/**
 * Organic, toon-shaded inhabitants rendered in ten instanced batches. An adult
 * is about .62 world units tall at scale=.22; use .055 for the strategy map.
 * The caller owns the clock and supplies the real terrain/deck height.
 */
export function addIslandNPCs(root,t={},theme={},options={}){
  const {heightAt=()=>.5,radius=4.5}=options;
  const patrolCenter=options.patrolCenter??[0,0],centerX=Number(patrolCenter[0])||0,centerZ=Number(patrolCenter[1])||0;
  const count=Math.max(0,Math.min(48,Math.floor(options.count??12))),size=Math.max(.001,Number(options.scale??.22));
  const group=new THREE.Group();group.name='Habitants organiques et patrouilles';root.add(group);
  const rng=seedFor((t.name||t.id||'island')+'-inhabitants');
  const compact=['ship','restaurant'].includes(theme.landmark)||t.name==='Zou',travelRadius=Math.max(.05,radius*(compact?.56:1));
  const crew=String(t.crewid??t.crew??'').toLowerCase(),marine=typeof t.marine==='boolean'?t.marine:crew?crew==='marine'||crew==='0':theme.architecture==='marine';
  const pirate=['pirate','pirates','1'].includes(crew),revolutionary=['revo','revolutionary','revolutionnaires','révolutionnaires','2'].includes(crew),hunter=['chasseur','hunter','bounty','3'].includes(crew);
  const owned=t.owner!==undefined&&t.owner>=0,factionColor=t.color||(owned?COLORS[t.owner%COLORS.length]:'#a99875');
  const gradientData=new Uint8Array([68,126,188,255]),gradient=new THREE.DataTexture(gradientData,4,1,THREE.RedFormat);gradient.minFilter=gradient.magFilter=THREE.NearestFilter;gradient.generateMipmaps=false;gradient.needsUpdate=true;
  const materials=[],geometries=[];
  const material=()=>{const m=new THREE.MeshToonMaterial({color:'#ffffff',gradientMap:gradient,emissiveIntensity:0});materials.push(m);return m;};
  const sphere=unitGeometry(new THREE.SphereGeometry(.5,12,9)),capsule=unitGeometry(new THREE.CapsuleGeometry(.3,.45,5,10)),cylinder=unitGeometry(new THREE.CylinderGeometry(.46,.5,1,14));
  const cape=unitGeometry(new THREE.CylinderGeometry(.48,.66,1,16,2,true,Math.PI*.35,Math.PI*1.3));
  const hatProfile=[new THREE.Vector2(0,0),new THREE.Vector2(.49,0),new THREE.Vector2(.51,.035),new THREE.Vector2(.31,.07),new THREE.Vector2(.28,.23),new THREE.Vector2(.23,.30),new THREE.Vector2(0,.32)];
  const hat=unitGeometry(new THREE.LatheGeometry(hatProfile,20)),band=unitGeometry(new THREE.TorusGeometry(.5,.055,6,18).rotateX(Math.PI/2));
  const barrelProfile=[new THREE.Vector2(0,-.5),new THREE.Vector2(.38,-.5),new THREE.Vector2(.47,-.3),new THREE.Vector2(.5,0),new THREE.Vector2(.47,.3),new THREE.Vector2(.38,.5),new THREE.Vector2(0,.5)];
  const prop=unitGeometry(new THREE.LatheGeometry(barrelProfile,12));geometries.push(sphere,capsule,cylinder,cape,hat,band,prop);
  const outlineMaterial=new THREE.MeshBasicMaterial({color:'#1b2326',side:THREE.BackSide,toneMapped:false});materials.push(outlineMaterial);
  const batches={
    rounds:new THREE.InstancedMesh(sphere,material(),count*ROUND_SLOTS),
    bodies:new THREE.InstancedMesh(capsule,material(),count*BODY_SLOTS),
    limbs:new THREE.InstancedMesh(capsule,material(),count*LIMB_SLOTS),
    clothes:new THREE.InstancedMesh(cylinder,material(),count),
    capes:new THREE.InstancedMesh(cape,material(),count),
    hats:new THREE.InstancedMesh(hat,material(),count),
    bands:new THREE.InstancedMesh(band,material(),count*3),
    props:new THREE.InstancedMesh(prop,material(),count),
    weapons:new THREE.InstancedMesh(cylinder,material(),count*2),
    outlines:new THREE.InstancedMesh(capsule,outlineMaterial,count*OUTLINE_SLOTS)
  };
  for(const [name,batch]of Object.entries(batches)){batch.name='PNJ organiques — '+name;batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);batch.castShadow=!['outlines','rounds','bands'].includes(name);batch.receiveShadow=name!=='outlines';batch.frustumCulled=false;group.add(batch);}
  const color=new THREE.Color(),paint=(batch,i,c)=>batch.setColorAt(i,color.set(c));
  const sampleHeight=(x,z)=>{const h=Number(heightAt(x,z));return Number.isFinite(h)?h:null;};
  function safePoint(x,z,angle){const h=sampleHeight(x,z);if(h!==null&&h>-.85)return new THREE.Vector3(x,h,z);for(const k of [.86,.98,.68,.5]){const xx=centerX+Math.cos(angle)*travelRadius*k,zz=centerZ+Math.sin(angle)*travelRadius*k*.8,hh=sampleHeight(xx,zz);if(hh!==null&&hh>-.85)return new THREE.Vector3(xx,hh,zz);}return new THREE.Vector3(x,h===null?.5:Math.max(-.75,h),z);}
  const agents=[];
  for(let i=0;i<count;i++){
    const leader=owned&&i===0&&(pirate||marine||revolutionary||hunter);
    const role=leader?(pirate?'pirate':marine?'officer':revolutionary?'revolutionary':'hunter'):i%4===0?'merchant':owned&&marine?'guard':owned&&pirate?'pirate':owned&&revolutionary?'revolutionary':owned&&hunter?'hunter':'resident';
    const luffy=leader&&pirate,chef=role==='pirate'&&!luffy&&i%5===0,swordsman=role==='pirate'&&!luffy&&i%3===1,skin=SKIN[i%SKIN.length];
    const angle=(.12+(i+.5)/Math.max(1,count)*.76)*Math.PI,centerRadius=travelRadius*(.62+rng()*.14),cx=centerX+Math.cos(angle)*centerRadius,cz=centerZ+Math.sin(angle)*centerRadius*.84,rx=travelRadius*(.055+rng()*.055),rz=travelRadius*(.045+rng()*.045),points=[];
    for(let j=0;j<7;j++){const a=j/7*TAU,xx=cx+Math.cos(a)*rx,zz=cz+Math.sin(a)*rz;points.push(safePoint(xx,zz,Math.atan2((zz-centerZ)/.84,xx-centerX)));}
    const shirt=luffy?skin:role==='guard'||role==='officer'?'#e2e6db':role==='revolutionary'?'#354d42':role==='hunter'?'#584b40':chef?'#e6e5d8':role==='pirate'?swordsman?'#668355':factionColor:SHIRTS[i%SHIRTS.length];
    const pants=luffy?'#3d70a1':marine&&owned?'#3e627b':PANTS[i%PANTS.length];
    for(let k=0;k<ROUND_SLOTS;k++)paint(batches.rounds,i*ROUND_SLOTS+k,skin);
    for(const slot of [5,6])paint(batches.rounds,i*ROUND_SLOTS+slot,luffy?'#755a3e':'#374247');
    for(const slot of [7,8,19,20,21])paint(batches.rounds,i*ROUND_SLOTS+slot,role==='revolutionary'?'#293e34':'#3d3733');
    for(const slot of [9,13])paint(batches.rounds,i*ROUND_SLOTS+slot,'#eeeae0');
    for(const slot of [10,14])paint(batches.rounds,i*ROUND_SLOTS+slot,marine?'#567c88':swordsman?'#617b54':'#625341');
    for(const slot of [11,15])paint(batches.rounds,i*ROUND_SLOTS+slot,'#1e292b');
    for(const slot of [12,16])paint(batches.rounds,i*ROUND_SLOTS+slot,'#fff6df');
    for(const slot of [22,23])paint(batches.rounds,i*ROUND_SLOTS+slot,pants);
    for(const slot of [24,25])paint(batches.rounds,i*ROUND_SLOTS+slot,role==='revolutionary'||role==='hunter'?shirt:skin);
    for(let k=0;k<BODY_SLOTS;k++)paint(batches.bodies,i*BODY_SLOTS+k,k&&luffy?'#bf423d':shirt);
    for(let k=0;k<LIMB_SLOTS;k++)paint(batches.limbs,i*LIMB_SLOTS+k,k<4?pants:k<8?luffy?skin:role==='revolutionary'||role==='hunter'||k%2===0?shirt:skin:k===10?'#8f5c4f':'#352f2d');
    paint(batches.clothes,i,luffy?'#3d70a1':role==='revolutionary'?'#354d42':role==='hunter'?'#554738':pants);
    paint(batches.capes,i,role==='officer'?'#d9dfd5':role==='revolutionary'?'#2d4439':'#534a41');
    paint(batches.hats,i,luffy?'#d3af56':role==='guard'||role==='officer'?'#dce5dc':chef?'#ece9dc':role==='hunter'?'#776244':role==='merchant'?'#a88e5e':swordsman?'#65834e':'#9a574a');
    paint(batches.bands,i*3,luffy?'#bb4038':marine?'#537d91':revolutionary?'#9b5148':hunter?'#3b3330':'#8e795e');for(let j=1;j<3;j++)paint(batches.bands,i*3+j,'#675c48');
    paint(batches.props,i,role==='merchant'?'#a78b5e':'#6e5a43');for(let j=0;j<2;j++)paint(batches.weapons,i*2+j,j?'#c2cac2':'#514d40');
    agents.push({curve:new THREE.CatmullRomCurve3(points,true,'catmullrom',.35),role,leader,luffy,chef,swordsman,period:29+rng()*20,phase:rng()*47,walkRatio:.7+rng()*.13,stride:3.2+rng()*.6,speedScale:.9+rng()*.16,look:rng()*TAU});
  }
  for(const batch of Object.values(batches))if(batch.instanceColor)batch.instanceColor.needsUpdate=true;
  group.userData.npcCount=count;group.userData.roles=agents.map(a=>a.role);group.userData.characterStyle='organic-toon';group.userData.leaders=agents.map((a,i)=>a.leader?i:-1).filter(i=>i>=0);group.userData.luffy=agents.some(a=>a.luffy);group.userData.textures=[gradient];
  const position=new THREE.Vector3(),tangent=new THREE.Vector3(),rootPosition=new THREE.Vector3(),unitScale=new THREE.Vector3(),partPosition=new THREE.Vector3(),partScale=new THREE.Vector3();
  const rootRotation=new THREE.Quaternion(),partRotation=new THREE.Quaternion(),euler=new THREE.Euler(),rootMatrix=new THREE.Matrix4(),partMatrix=new THREE.Matrix4(),matrix=new THREE.Matrix4(),translation=new THREE.Matrix4(),scaling=new THREE.Matrix4();
  function put(batch,index,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){partPosition.set(x,y,z);partScale.set(sx,sy,sz);partRotation.setFromEuler(euler.set(rx,ry,rz));partMatrix.compose(partPosition,partRotation,partScale);matrix.multiplyMatrices(rootMatrix,partMatrix);batch.setMatrixAt(index,matrix);}
  function hide(batch,index){put(batch,index,0,.12,0,.00001,.00001,.00001);}
  function outline(index,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){put(batches.outlines,index,x,y,z,sx*1.035,sy*1.035,sz*1.035,rx,ry,rz);}
  function limb(batch,index,x,pivotY,z,length,width,depth,angle,outlineIndex){partPosition.set(x,pivotY,z);partRotation.setFromEuler(euler.set(angle,0,0));partMatrix.compose(partPosition,partRotation,unitScale.set(1,1,1));partMatrix.multiply(translation.makeTranslation(0,-length*.5,0));partMatrix.multiply(scaling.makeScale(width,length,depth));matrix.multiplyMatrices(rootMatrix,partMatrix);batch.setMatrixAt(index,matrix);if(outlineIndex!==undefined){partMatrix.multiply(scaling.makeScale(1.035,1.035,1.035));matrix.multiplyMatrices(rootMatrix,partMatrix);batches.outlines.setMatrixAt(outlineIndex,matrix);}}
  let disposed=false;
  function update(timeSeconds=0){
    if(disposed)return;const time=Number.isFinite(timeSeconds)?timeSeconds:0;
    for(let i=0;i<count;i++){
      const a=agents[i],r=i*ROUND_SLOTS,b=i*BODY_SLOTS,l=i*LIMB_SLOTS,o=i*OUTLINE_SLOTS,local=((time+a.phase)%a.period+a.period)%a.period,walkTime=a.period*a.walkRatio,walking=local<walkTime,u=walking?local/walkTime:1;
      a.curve.getPointAt(u%1,position);a.curve.getTangentAt(u%1,tangent);const ground=sampleHeight(position.x,position.z);if(ground!==null&&ground>-.85)position.y=ground;
      const gait=walking?Math.sin(local*a.stride)*.5:0,bob=walking?Math.abs(Math.sin(local*a.stride))*.023:Math.sin(time*.7+a.look)*.008;
      rootPosition.set(position.x,position.y+.018+size*bob,position.z);rootRotation.setFromAxisAngle(THREE.Object3D.DEFAULT_UP,Math.atan2(tangent.x,tangent.z)+(walking?0:Math.sin(time*.35+a.look)*.18));rootMatrix.compose(rootPosition,rootRotation,unitScale.setScalar(size*a.speedScale));
      for(let k=0;k<ROUND_SLOTS;k++)hide(batches.rounds,r+k);for(let k=0;k<BODY_SLOTS;k++)hide(batches.bodies,b+k);for(let k=0;k<LIMB_SLOTS;k++)hide(batches.limbs,l+k);for(let k=0;k<OUTLINE_SLOTS;k++)hide(batches.outlines,o+k);
      hide(batches.clothes,i);hide(batches.capes,i);hide(batches.hats,i);hide(batches.props,i);for(let j=0;j<3;j++)hide(batches.bands,i*3+j);for(let j=0;j<2;j++)hide(batches.weapons,i*2+j);
      const headTurn=walking?Math.sin(time*.6+a.look)*.08:Math.sin(time*.8+a.look)*.35,lean=walking?.025*Math.sin(local*a.stride):0;
      put(batches.bodies,b,0,1.52,0,.84,1.04,.48,lean);outline(o,0,1.52,0,.84,1.04,.48,lean);
      if(a.luffy){for(let side=0;side<2;side++){const sign=side?1:-1;put(batches.bodies,b+1+side,sign*.27,1.57,.05,.24,.98,.5,lean);outline(o+1+side,sign*.27,1.57,.05,.24,.98,.5,lean);}put(batches.clothes,i,0,1.07,0,.86,.44,.53);}
      else if(a.role==='revolutionary'||a.role==='hunter')put(batches.clothes,i,0,1.08,-.015,.97,1.48,.67);
      else put(batches.clothes,i,0,1.08,0,.8,.26,.48);
      if(a.role==='officer')put(batches.capes,i,0,1.34,-.06,1.2,1.7,.85,0,0,-Math.sin(time*.6)*.025);
      else if(a.role==='revolutionary')put(batches.capes,i,0,1.37,-.1,1.08,1.65,.77);
      else if(a.role==='hunter')put(batches.capes,i,0,1.23,-.08,1.02,1.6,.7);
      put(batches.rounds,r,0,2.32,0,.68,.75,.64,0,headTurn);outline(o+3,0,2.32,0,.7,.77,.66,0,headTurn);
      put(batches.rounds,r+3,-.34,2.3,0,.13,.22,.14);put(batches.rounds,r+4,.34,2.3,0,.13,.22,.14);
      put(batches.rounds,r+7,0,2.61,-.045,.7,.3,.66,0,headTurn);put(batches.rounds,r+19,-.24,2.55,-.07,.23,.35,.27);put(batches.rounds,r+20,.24,2.54,-.07,.23,.34,.27);
      if(a.role==='revolutionary')put(batches.rounds,r+8,0,2.36,-.12,.86,.92,.77);
      else{
        const wide=a.luffy?1.02:a.role==='hunter'?1.02:a.role==='merchant'?.93:.79,hatHeight=a.chef?.48:a.luffy?.33:.22;
        put(batches.hats,i,0,2.73,0,wide,hatHeight,wide*.97,0,headTurn);
        put(batches.bands,i*3,0,2.73,-.002,wide*.6,.065,wide*.58,0,headTurn);
      }
      if(a.role==='revolutionary')put(batches.bands,i*3,0,2.0,.01,.67,.14,.53);
      for(let side=0;side<2;side++){
        const sign=side?1:-1,swing=gait*sign,guarding=a.role==='guard'||a.role==='officer',carrying=a.role==='merchant';
        const kneeY=1.0-.46*Math.cos(swing),kneeZ=-.46*Math.sin(swing),lowerLeg=swing+Math.max(0,swing)*.5;
        limb(batches.limbs,l+side*2,sign*.2,1.0,0,.46,.28,.3,swing,o+4+side*2);
        limb(batches.limbs,l+side*2+1,sign*.2,kneeY,kneeZ,.47,.25,.27,lowerLeg,o+5+side*2);
        put(batches.rounds,r+22+side,sign*.2,kneeY,kneeZ,.265,.27,.28);
        const footY=kneeY-.47*Math.cos(lowerLeg),footZ=kneeZ-.47*Math.sin(lowerLeg)+.09;put(batches.rounds,r+5+side,sign*.2,footY+.05,footZ,.34,.18,.48,lowerLeg*.3);
        const armAngle=carrying?-.62:guarding&&side===1?-.4:-swing*.8;
        const elbowY=1.96-.46*Math.cos(armAngle),elbowZ=(carrying?.15:0)-.46*Math.sin(armAngle),forearmAngle=armAngle-(carrying?.58:guarding?.42:.1+Math.max(0,swing)*.2);
        limb(batches.limbs,l+4+side*2,sign*.52,1.96,carrying?.15:0,.46,.24,.26,armAngle,o+8+side*2);
        limb(batches.limbs,l+5+side*2,sign*.52,elbowY,elbowZ,.43,.21,.23,forearmAngle,o+9+side*2);
        put(batches.rounds,r+24+side,sign*.52,elbowY,elbowZ,.225,.23,.24);
        put(batches.rounds,r+1+side,sign*.52,elbowY-.43*Math.cos(forearmAngle),elbowZ-.43*Math.sin(forearmAngle),.22,.24,.22);
        const eyeX=sign*.14,eyeZ=.294,xx=Math.cos(headTurn)*eyeX+Math.sin(headTurn)*eyeZ,zz=-Math.sin(headTurn)*eyeX+Math.cos(headTurn)*eyeZ,slot=r+9+side*4;
        put(batches.rounds,slot,xx,2.36,zz,.145,.205,.085,0,headTurn);put(batches.rounds,slot+1,xx+Math.sin(headTurn)*.04,2.36,zz+Math.cos(headTurn)*.043,.082,.133,.035,0,headTurn);put(batches.rounds,slot+2,xx+Math.sin(headTurn)*.06,2.36,zz+Math.cos(headTurn)*.06,.038,.087,.02,0,headTurn);put(batches.rounds,slot+3,xx-.017+Math.sin(headTurn)*.073,2.4,zz+Math.cos(headTurn)*.073,.024,.037,.018,0,headTurn);
        put(batches.limbs,l+8+side,xx,2.49,zz+.01,.16,.029,.035,0,headTurn,sign*.08);
      }
      put(batches.rounds,r+17,Math.sin(headTurn)*.33,2.27,Math.cos(headTurn)*.33,.085,.09,.1,0,headTurn);
      put(batches.limbs,l+10,Math.sin(headTurn)*.315,2.16,Math.cos(headTurn)*.315,.15,.03,.026,0,headTurn);
      if(a.luffy){put(batches.limbs,l+11,-.21,2.21,.285,.11,.018,.024,0,headTurn,-.12);put(batches.limbs,l+12,-.23,2.21,.29,.018,.048,.025,0,headTurn);}
      if(a.role==='merchant'){put(batches.props,i,0,1.23,.48,.58,.51,.48);for(let j=0;j<2;j++)put(batches.bands,i*3+1+j,0,1.09+j*.28,.48,.57,.038,.47);}
      else if(a.role==='guard'||a.role==='officer'||a.role==='hunter'||a.role==='revolutionary'||a.role==='pirate'&&!a.luffy&&!a.swordsman){put(batches.props,i,.47,1.33,.36,.12,.39,.12,.2);put(batches.weapons,i*2,.46,1.62,.44,.055,.73,.055,.4);}
      else if(a.swordsman){put(batches.weapons,i*2+1,.49,1.1,.19,.04,.84,.025,-.15,0,-.35);}
    }
    for(const batch of Object.values(batches))batch.instanceMatrix.needsUpdate=true;
  }
  function dispose(){if(disposed)return;disposed=true;group.removeFromParent();Object.values(batches).forEach(b=>b.dispose());geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());gradient.dispose();}
  update(0);return {group,update,dispose};
}
