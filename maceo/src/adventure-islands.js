import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { addAdventureLandmark } from './adventure-landmarks.js';
import { addAnimeRim,addIslandMotion } from './world-motion.js';
import { addIslandNPCs } from './island-npcs.js';

const FALLBACK={biome:'grass',landmark:'none',architecture:'village',palette:['#b6cb8a','#7b9d66','#456b51'],sand:'#e0c594',rock:[119,113,91],label:'Paysage insulaire',detail:'Une interprétation de l’île.'};
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const q=clamp((x-a)/(b-a));return q*q*(3-2*q);};
function hash(s){let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
function seeded(s){let n=hash(s);return()=>{n+=0x6d2b79f5;let q=Math.imul(n^(n>>>15),n|1);q^=q+Math.imul(q^(q>>>7),q|61);return ((q^(q>>>14))>>>0)/4294967296;};}
export function adventureTheme(t,override){return {...FALLBACK,...(typeof window!=='undefined'?window.GL_ISLAND_THEMES?.[t.name]:null),...override};}

/** Procedural original environments: terrain, coastal villages and vegetation are real mesh geometry. */
export function buildAdventureIsland(t,themeOverride,options={}){
  const theme=adventureTheme(t,themeOverride),group=new THREE.Group(),rng=seeded(t.name+'-adventure');
  const phase=hash(t.name)/4294967296*Math.PI*2,waterLevel=-1.24,floating=['restaurant','ship'].includes(theme.landmark)||t.name==='Zou';
  const battlefield=!!options.battlefield,isZou=t.name==='Zou',isShip=['restaurant','ship'].includes(theme.landmark),islandRadius=battlefield?11.8:8.2;
  // Architecture stays in human units. Extra terrain, rather than a scaled diorama,
  // gives each squad its own deployment area in front of the familiar landmark.
  const arenaY=isZou?2.6:.55,arenaZ=isZou?-5.65:theme.landmark==='canals'&&t.name!=='Reverse Mountain'?5.75:5.25;
  const arena={center:[0,arenaY,arenaZ],halfWidth:5.8,halfDepth:1.85,startLeft:[-5.15,arenaY,arenaZ],startRight:[5.15,arenaY,arenaZ],minX:-5.8,maxX:5.8,minZ:arenaZ-1.85,maxZ:arenaZ+1.85,surface:isZou?'elephant-platform':isShip?'boarding-deck':'land',radius:islandRadius};
  const arenaWeight=(x,z)=>battlefield?(1-smooth(6.5,7.2,Math.abs(x)))*(1-smooth(2.6,3.15,Math.abs(z-arenaZ))):0;
  const reserved=(x,z,padding=.6)=>battlefield&&Math.abs(x)<arena.halfWidth+padding&&Math.abs(z-arenaZ)<arena.halfDepth+padding;
  group.name='Paysage — '+t.name;group.userData={island:t.name,biome:theme.biome,landmark:theme.landmark,waterLevel,quality:'adventure'};
  if(battlefield)group.userData.battlefield=arena;
  const mats=new Map(),textures=[];
  function makeTexture(kind){
    const size=128,data=new Uint8Array(size*size*4),normal=new Uint8Array(size*size*4),noise=new Float32Array(size*size),tr=seeded(t.name+'-texture-'+kind);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){const broad=Math.sin(x*.17+Math.cos(y*.13))*Math.sin(y*.19+x*.04),fine=tr()-.5;noise[y*size+x]=broad*.35+fine*.65;}
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const i=y*size+x,n=noise[i],strata=kind==='stone'?Math.sin(y*.9+Math.sin(x*.04)*2)*5:kind==='wood'?Math.sin(x*.55+Math.sin(y*.045)*1.4)*12:0;
      const v=clamp(Math.round(231+n*(kind==='sand'?23:36)+strata),0,255);data[i*4]=data[i*4+1]=data[i*4+2]=v;data[i*4+3]=255;
      const dx=noise[y*size+(x+1)%size]-noise[y*size+(x+size-1)%size],dy=noise[((y+1)%size)*size+x]-noise[((y+size-1)%size)*size+x];
      normal[i*4]=clamp(Math.round(128-dx*28),0,255);normal[i*4+1]=clamp(Math.round(128-dy*28),0,255);normal[i*4+2]=252;normal[i*4+3]=255;
    }
    const map=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.minFilter=THREE.LinearMipmapLinearFilter;map.magFilter=THREE.LinearFilter;map.generateMipmaps=true;map.needsUpdate=true;
    const bump=new THREE.DataTexture(normal,size,size,THREE.RGBAFormat);bump.wrapS=bump.wrapT=THREE.RepeatWrapping;bump.minFilter=THREE.LinearMipmapLinearFilter;bump.generateMipmaps=true;bump.needsUpdate=true;textures.push(map,bump);return {map,normalMap:bump};
  }
  const stoneTex=makeTexture('stone'),groundTex=makeTexture(theme.biome==='desert'?'sand':'grass'),woodTex=makeTexture('wood');
  const mat=(color,kind='',extra={})=>{const key=color+'|'+kind+'|'+JSON.stringify(extra);if(!mats.has(key)){const tx=kind==='stone'?stoneTex:kind==='ground'?groundTex:kind==='wood'?woodTex:{};mats.set(key,new THREE.MeshStandardMaterial({color,roughness:kind==='wood'?.86:.94,metalness:0,envMapIntensity:.42,emissiveIntensity:0,...tx,...(tx.normalMap?{normalScale:new THREE.Vector2(.2,.2)}:{}),...extra}));}return mats.get(key);};
  const mesh=(geometry,material,x=0,y=0,z=0,parent=group)=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
  const batches=new Map(),matrix=new THREE.Matrix4(),quat=new THREE.Quaternion(),euler=new THREE.Euler(),scale=new THREE.Vector3(),pos=new THREE.Vector3();
  function part(geometry,material,x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0){
    pos.set(x,y,z);scale.set(sx,sy,sz);quat.setFromEuler(euler.set(rx,ry,rz));matrix.compose(pos,quat,scale);const g=geometry.index?geometry.toNonIndexed():geometry.clone();g.applyMatrix4(matrix);let a=batches.get(material);if(!a){a=[];batches.set(material,a);}a.push(g);
  }
  const boxGeo=new THREE.BoxGeometry(1,1,1),sphereGeo=new THREE.SphereGeometry(1,14,10),rockGeo=new THREE.IcosahedronGeometry(1,1),cylinderGeo=new THREE.CylinderGeometry(1,1,1,9);
  const roofGeo=(()=>{const g=new THREE.BufferGeometry();const v=[-.55,0,-.48,.55,0,-.48,0,.4,-.48,-.55,0,.48,0,.4,.48,.55,0,.48,-.55,0,-.48,0,.4,-.48,0,.4,.48,-.55,0,-.48,0,.4,.48,-.55,0,.48,.55,0,-.48,.55,0,.48,0,.4,.48,.55,0,-.48,0,.4,.48,0,.4,-.48];g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));const uv=[];for(let i=0;i<v.length;i+=3)uv.push(v[i]+.5,v[i+2]+.5);g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;})();
  const coast=angle=>{
    const natural=islandRadius*(1+.105*Math.sin(3*angle+phase)+.047*Math.cos(5*angle-phase*.6)+.025*Math.sin(9*angle+phase*.4));
    // A wide southern headland supports the entire esplanade, including its
    // sandy approach. This also keeps the front corners above the shoreline.
    return battlefield&&!floating?Math.max(natural,12.3*smooth(-.08,.35,Math.sin(angle))):natural;
  };
  function surface(x,z){
    const angle=Math.atan2(z/.84,x),rad=Math.hypot(x,z/.84),q=rad/coast(angle),front=smooth(-.25,.75,Math.sin(angle));
    let h=waterLevel+.02+smooth(1,.76,q)*1.82;
    h+=(1-front)*smooth(.78,.95,q)*(1-smooth(.95,1,q))*.38;
    const roll=(Math.sin(x*.8+phase)*Math.cos(z*.65-phase)+.45*Math.sin(x*1.8+z*.7))* .18;
    h+=roll*smooth(1,.7,q);
    let terrain=0;
    if(['grass','tropical','jungle','haunted'].includes(theme.biome))terrain=Math.exp(-((x+3.7)**2+(z+2.3)**2)/5)*1.2+Math.exp(-((x-3.6)**2+(z+3.0)**2)/4)*1.65;
    if(['rock','snow','volcano'].includes(theme.biome)&&!['drum','split','canals','gianttree'].includes(theme.landmark))terrain=Math.exp(-((x+3.7)**2+(z+2.9)**2)/3)*2.8+Math.exp(-((x-3.4)**2+(z+3.0)**2)/3.7)*3.25;
    if(theme.biome==='desert')terrain=(.45+.2*Math.sin(x*1.6+z*.4))*Math.exp(-((z+2.5)**2)/7)+.3*Math.sin(x*2.2+z*.8)**2;
    h+=terrain*smooth(1,.77,q);
    const core=Math.hypot(x/4.15,(z+.9)/3.3),flat=1-smooth(.66,1.12,core);
    h=h*(1-flat)+.55*flat;
    if(t.name==='Enies Lobby'&&Math.hypot(x,z+.3)<2.55)h=-2.8;
    if(battlefield&&!floating){const blend=arenaWeight(x,z);h=h*(1-blend)+arenaY*blend;}
    if(battlefield&&floating&&reserved(x,z,.4))h=arenaY;
    return {h,q,front};
  }
  group.userData.groundHeight=(x,z)=>surface(x,z).h;group.userData.heightAt=group.userData.groundHeight;
  group.userData.coastRadius=coast;
  if(!floating){
    const rings=battlefield?54:46,segments=128,positions=[],colors=[],uvs=[],indices=[],light=new THREE.Color(theme.palette[0]),mid=new THREE.Color(theme.palette[1]),dark=new THREE.Color(theme.palette[2]),sand=new THREE.Color(theme.sand).lerp(new THREE.Color('#dca84d'),.52),stone=new THREE.Color(`rgb(${theme.rock.join(',')})`);
    if(['grass','tropical','jungle','city'].includes(theme.biome)){mid.lerp(new THREE.Color('#44904d'),.48);dark.lerp(new THREE.Color('#286044'),.35);light.lerp(new THREE.Color('#81af51'),.38);}
    else if(theme.biome==='sky'){mid.lerp(new THREE.Color('#65a77c'),.3);sand.lerp(new THREE.Color('#c8dede'),.42);}
    else{mid.offsetHSL(0,.08,-.025);dark.offsetHSL(0,.05,-.02);}
    for(let j=0;j<=rings;j++)for(let i=0;i<=segments;i++){
      const a=i/segments*Math.PI*2,q=j/rings,rad=coast(a)*q,x=Math.cos(a)*rad,z=Math.sin(a)*rad*.84,v=surface(x,z),h=v.h;
      positions.push(x,h,z);uvs.push(x/2.7,z/2.7);
      const c=mid.clone();const beach=smooth(.68,.89,q);c.lerp(sand,beach);if(h>1.05)c.lerp(dark,clamp((h-1.05)*.18));if(h>1.9)c.lerp(stone,clamp((h-1.9)*.3));
      if(battlefield&&arenaWeight(x,z)>.9)c.lerp(theme.biome==='desert'?sand:new THREE.Color('#ad985d'),theme.biome==='snow'?.12:.23);
      if(theme.biome==='snow')c.lerp(new THREE.Color('#b9d4de'),.68+clamp(h/5)*.18);
      if(theme.landmark==='split')c.copy(x<0?new THREE.Color('#dce8e5'):new THREE.Color('#62534e')).lerp(x<0?new THREE.Color('#f6fcf7'):new THREE.Color('#353f43'),clamp(h/7));
      c.lerp(light,clamp((Math.sin(x*2.1+z*.9+phase)+Math.cos(z*2.5-x*.6))*.07+.06));colors.push(c.r,c.g,c.b);
    }
    for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){const a=j*(segments+1)+i,b=a+segments+1;indices.push(a,a+1,b,a+1,b+1,b);}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();const terrain=mesh(geo,mat('#ffffff','ground',{vertexColors:true}));terrain.name='Terrain organique';
    // The coast continues below the water rather than ending in a miniature display pedestal.
    const pv=[],pu=[],ix=[];
    for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2,rad=coast(a),x=Math.cos(a)*rad,z=Math.sin(a)*rad*.84,top=surface(x,z).h;pv.push(x,top,z,x*.94,-2.25+.12*Math.sin(i*.7),z*.94);pu.push(i/14,0,i/14,1);if(i<segments){const k=i*2;ix.push(k,k+2,k+1,k+2,k+3,k+1);}}
    const skirt=new THREE.BufferGeometry();skirt.setAttribute('position',new THREE.Float32BufferAttribute(pv,3));skirt.setAttribute('uv',new THREE.Float32BufferAttribute(pu,2));skirt.setIndex(ix);skirt.computeVertexNormals();mesh(skirt,mat(stone.getStyle(),'stone')).name='Côtes et falaises';
    // Pale shallows trace the organic shoreline; the cinematic ocean can animate above them.
    const foam=[];for(let i=0;i<=160;i++){const a=i/160*Math.PI*2,rad=coast(a)*1.018;foam.push(new THREE.Vector3(Math.cos(a)*rad,waterLevel+.045,Math.sin(a)*rad*.84));}
    const foamMesh=mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(foam),160,.022,3,false),mat('#c6e1d7','',{transparent:true,opacity:.43,depthWrite:false}));foamMesh.castShadow=false;
  }
  function ribbon(points,width,color){
    const pts=points.map(p=>new THREE.Vector3(p[0],0,p[1])),curve=new THREE.CatmullRomCurve3(pts),p=[],uv=[],idx=[];
    for(let i=0;i<=20;i++){const q=curve.getPoint(i/20),tan=curve.getTangent(i/20),nx=-tan.z,nz=tan.x;for(const side of [-1,1]){const xx=q.x+nx*width*side,zz=q.z+nz*width*side;p.push(xx,surface(xx,zz).h+.035,zz);uv.push(side>0?1:0,i/4);}if(i<20){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();mesh(g,mat(color,'stone',{side:THREE.DoubleSide}));
  }
  const wallMat=mat(theme.architecture==='gothic'?'#82768f':theme.architecture==='adobe'?'#ce9c53':theme.architecture==='futuristic'?'#96bcc6':theme.architecture==='marine'?'#a9bdb5':'#c49c63','stone');
  const wallSide=mat('#a99b80','stone'),door=mat('#506063','wood'),glass=mat('#75a8af','',{roughness:.3,metalness:.2}),roof=mat(theme.architecture==='japanese'?'#475f69':theme.architecture==='gothic'?'#4a4c60':theme.architecture==='marine'?'#5c8494':theme.architecture==='candy'?'#c187a4':'#9a6b52','stone',{side:THREE.DoubleSide});
  const trunkMat=mat('#795332','wood'),leafMats=[mat(theme.palette[2]),mat(theme.biome==='haunted'?'#6c626f':'#397c44'),mat(theme.biome==='haunted'?'#87808c':'#7ba54b')],warm=mat('#dcb05a');
  function cottage(x,z,s){
    const y=surface(x,z).h,rotation=(rng()-.5)*.25;
    part(boxGeo,wallMat,x,y+s*.42,z,s*.88,s*.84,s*.76,0,rotation);
    if(theme.architecture==='futuristic'){part(sphereGeo,mat('#92bac5','',{roughness:.35,metalness:.2}),x,y+s*.9,z,s*.56,s*.28,s*.52);}
    else if(theme.architecture==='adobe'){part(boxGeo,wallMat,x,y+s*.9,z,s*1.0,s*.1,s*.88);part(sphereGeo,mat('#d3bf8b','stone'),x,y+s*.93,z,s*.33,s*.24,s*.32);}
    else{part(roofGeo,roof,x,y+s*.83,z,s*1.05,s*1.1,s*1.02,0,rotation);if(theme.architecture==='japanese')part(boxGeo,roof,x,y+s*.85,z,s*1.22,s*.08,s*1.1,0,rotation);}
    part(boxGeo,door,x,y+s*.23,z+s*.39,s*.19,s*.46,s*.035);
    for(const dx of [-.26,.26]){part(boxGeo,wallSide,x+dx*s,y+s*.53,z+s*.395,s*.18,s*.22,s*.06);part(boxGeo,glass,x+dx*s,y+s*.53,z+s*.43,s*.125,s*.16,s*.015);}
    if(theme.architecture!=='futuristic'&&theme.architecture!=='adobe')part(boxGeo,wallSide,x+s*.25,y+s*1.04,z-s*.13,s*.12,s*.46,s*.14);
    // Timber balcony, lintels, roof ridges and a small warm lantern break up the silhouettes.
    part(boxGeo,trunkMat,x,y+s*.76,z+s*.42,s*.95,s*.055,s*.08);part(boxGeo,trunkMat,x,y+s*.05,z+s*.5,s*.55,s*.06,s*.25);part(sphereGeo,warm,x+s*.43,y+s*.58,z+s*.46,s*.045,s*.08,s*.045);
  }
  function tree(x,z,s,palm=false){
    const base=surface(x,z).h;
    part(cylinderGeo,trunkMat,x,base+s*.78,z,s*.08,s*1.55,s*.08,0,0,-.055);
    if(palm){
      for(let j=0;j<7;j++){const a=j/7*Math.PI*2;part(sphereGeo,leafMats[j%3],x+Math.cos(a)*s*.42,base+s*1.58,z+Math.sin(a)*s*.42,s*.8,s*.055,s*.21,Math.sin(a)*.1,-a,.14*Math.cos(a));}
    }else if(theme.biome==='snow'){
      for(let j=0;j<3;j++){const cone=new THREE.ConeGeometry(s*(.48-j*.1),s*.95,10);part(cone,leafMats[j%3],x,base+s*(.7+j*.43),z);cone.dispose();const snow=new THREE.ConeGeometry(s*(.36-j*.08),s*.35,10);part(snow,mat('#e5ece3'),x,base+s*(1.0+j*.43),z);snow.dispose();}
    }else{
      for(let j=0;j<4;j++){const a=j*2.2;part(sphereGeo,leafMats[j%3],x+Math.sin(a)*s*.35,base+s*(1.6+(j%2)*.28),z+Math.cos(a)*s*.27,s*(.61+(j%2)*.13),s*.5,s*.59);}
      for(const side of [-1,1])part(cylinderGeo,trunkMat,x+side*s*.16,base+s*1.12,z,s*.035,s*.61,s*.035,0,0,-side*.54);
    }
  }
  if(!floating&&theme.architecture!=='none'&&theme.landmark!=='prison'){
    const count=Math.min(24,(theme.biome==='city'?18:theme.biome==='desert'?13:10)+(t.city?Math.min(6,(t.city.lvl||1)*2):0));
    for(let i=0;i<count;i++){
      const angle=(battlefield?.08:.1)*Math.PI+(i/(count-1))*(battlefield?1.84:1.8)*Math.PI,dist=(battlefield?8.5:5.65)+(i%3)*.4,x=Math.cos(angle)*dist,z=Math.sin(angle)*dist*.86,s=.58+rng()*.24;
      if(reserved(x,z,.95)||surface(x,z).q>.88||surface(x,z).h<.15)continue;
      cottage(x,z,s);
      if(i%3===0){const endX=battlefield?Math.sign(x||1)*6.7:x*.78,endZ=battlefield?Math.min(3.1,z*.65):z*.78;ribbon([[x,z],[x*.9,z*.9],[endX,endZ]],.11,theme.biome==='snow'?'#91afb5':'#bc9755');}
    }
  }
  const vegetation=theme.biome==='jungle'?38:theme.biome==='tropical'?26:theme.biome==='grass'?23:theme.biome==='snow'?10:theme.biome==='haunted'?14:0;
  if(!floating)for(let i=0;i<vegetation;i++){
    const a=.96*Math.PI+rng()*1.95*Math.PI,dist=(battlefield?8.0:5.35)+rng()*(battlefield?2.1:1.6),x=Math.cos(a)*dist,z=Math.sin(a)*dist*.82;
    if(reserved(x,z,1.15)||(z>1.2&&Math.abs(x)<4.9))continue;if(surface(x,z).q>.9)continue;
    tree(x,z,.58+rng()*.5,theme.biome==='tropical');
  }
  if(!floating&&theme.biome!=='sky')for(let i=0;i<23;i++){
    const a=i/23*Math.PI*2+.1,rad=coast(a)*(.94+rng()*.14),x=Math.cos(a)*rad,z=Math.sin(a)*rad*.84,y=surface(x,z).h;
    const s=.13+rng()*.23;part(rockGeo,mat(theme.biome==='snow'?'#cedbd6':'#849084','stone'),x,y+.04,z,s*(1+rng()),s*.7,s,0,rng()*Math.PI,0);
  }
  if(!floating&&!['sky','undersea'].includes(theme.biome)){
    const a=battlefield?.33*Math.PI:.31*Math.PI,shore=coast(a)*.96,x=Math.cos(a)*shore,z=Math.sin(a)*shore*.84,deckY=-.35;part(boxGeo,trunkMat,x,deckY,z,1.15,.12,2.45);
    for(let i=0;i<11;i++)part(boxGeo,mat('#b58b4f','wood'),x,deckY+.08,z-1.11+i*.22,1.18,.055,.1);
    for(const dx of [-.5,.5])for(const dz of [-1,1])part(cylinderGeo,trunkMat,x+dx,-.93,z+dz,.055,1.4,.055);
  }
  const landmark=addAdventureLandmark(group,theme,t,{groundHeight:(x,z)=>surface(x,z).h,mat,mesh});
  if(battlefield&&floating){
    // A connected boarding pontoon is more legible than multiplying the scale
    // of Baratie/Germa's hull. On Zou the same human-sized timber construction
    // becomes a braced rear terrace on Zunesha's back, behind the city and tree.
    const deckMat=mat(isZou?'#8d733e':'#a7773d','wood'),edgeMat=mat('#66482c','wood'),floorY=arenaY;
    const terrace=mesh(new THREE.BoxGeometry(12.8,.28,4.8),deckMat,0,floorY-.14,arenaZ);terrace.name=isZou?'Terrasse du dos de Zunesha':'Quai d’abordage relié au navire';
    for(let i=0;i<24;i++)part(boxGeo,edgeMat,0,floorY+.004,arenaZ-2.3+i*.2,12.65,.008,.022);
    for(const x of [-6.35,6.35]){
      part(boxGeo,edgeMat,x,floorY-.16,arenaZ,.15,.45,4.95);
      for(const dz of [-2.25,0,2.25]){
        part(cylinderGeo,edgeMat,x,floorY+.31,arenaZ+dz,.065,.64,.065);
        if(!isZou)part(cylinderGeo,mat('#574b33','wood'),x,floorY-.66,arenaZ+dz,.29,.8,.29,Math.PI/2,0,0);
      }
      part(boxGeo,edgeMat,x,floorY+.55,arenaZ,.07,.06,4.65);
    }
    // The open inner edge and unobstructed 11.6 x 3.7 floor are shared by the
    // battle simulation; rails never cut across the squad deployment lanes.
    const joinZ=isZou?-2.8:theme.landmark==='restaurant'?0:.65,nearZ=arenaZ+(isZou?2.4:-2.4),joinY=isZou?2.6:theme.landmark==='restaurant'?-.29:-.18;
    for(const accessX of isZou?[-2.2,2.2]:[0])for(let j=0;j<9;j++){
      const u=(j+.5)/9,z=THREE.MathUtils.lerp(joinZ,nearZ,u),y=THREE.MathUtils.lerp(joinY,floorY,u);
      part(boxGeo,deckMat,accessX,y-.07,z,isZou?.75:1.8,.14,Math.abs(nearZ-joinZ)/9+.025);
    }
    if(isZou){
      for(const side of [-1,1])for(const dz of [-1.4,1.4]){
        const a=new THREE.Vector3(side*2.7,1.35,-2.3),b=new THREE.Vector3(side*5.95,floorY-.26,arenaZ+dz);
        const brace=new THREE.CylinderGeometry(.105,.105,a.distanceTo(b),8),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize()),rot=new THREE.Euler().setFromQuaternion(q),p=a.clone().add(b).multiplyScalar(.5);
        part(brace,edgeMat,p.x,p.y,p.z,1,1,1,rot.x,rot.y,rot.z);brace.dispose();
      }
      for(const side of [-1,1])part(sphereGeo,mat('#567b45','ground'),side*3.9,floorY-.52,arenaZ+1.8,2.4,.4,1.15);
    }else{
      for(const x of [-5.3,5.3])for(const dz of [-1.7,1.7])part(sphereGeo,mat('#6b5937','wood'),x,floorY-.52,arenaZ+dz,.47,.32,.6);
    }
  }
  if(t.name==='Enies Lobby'){const basin=new THREE.Mesh(new THREE.CircleGeometry(2.65,80),new THREE.MeshBasicMaterial({color:'#041320'}));basin.rotation.x=-Math.PI/2;basin.position.set(0,-1.05,-.3);group.add(basin);}
  if(['Loguetown','Orange Town','Briss'].includes(t.name)){const x=5.25,z=1.2,y=surface(x,z).h;part(cylinderGeo,mat('#e4ddc5','stone'),x,y+.85,z,.25,1.7,.25);part(cylinderGeo,mat('#9d6956','stone'),x,y+.6,z,.27,.18,.27);part(boxGeo,glass,x,y+1.8,z,.52,.42,.52);part(roofGeo,roof,x,y+2.02,z,.7,.5,.7);}
  if(theme.biome==='snow')for(let j=0;j<9;j++){const a=j/9*Math.PI*2,rr=coast(a)*1.1;part(rockGeo,mat('#badde0','',{roughness:.3,metalness:.07}),Math.cos(a)*rr,waterLevel+.03,Math.sin(a)*rr*.84,.35+(j%3)*.13,.08,.3,0,a,0);}
  // Floating landmark builders place their own hull at the ocean surface.
  if(theme.biome==='sky')for(let i=0;i<15;i++){const a=i/15*Math.PI*2,r=coast(a)*.93;part(sphereGeo,mat('#e3ece7'),Math.cos(a)*r,-.5,Math.sin(a)*r*.84,1.2,.48,.9);}
  if(t.capital&&!floating){
    const x=battlefield?-7.35:-4.6,z=battlefield?1.5:2.4,y=surface(x,z).h;part(cylinderGeo,mat('#b4a26f'),x,y+1.05,z,.035,2.1,.035);part(boxGeo,mat(t.owner>=0?['#4c8df6','#ee5b52','#3fc27a','#b672ee'][t.owner%4]:'#c4a166'),x+.3,y+1.9,z,.6,.36,.025);
  }
  for(const [material,geos]of batches){const merged=mergeGeometries(geos,false);if(merged){mesh(merged,material).name='Détails du paysage';}geos.forEach(g=>g.dispose());}
  for(const g of [boxGeo,sphereGeo,rockGeo,cylinderGeo,roofGeo])g.dispose();
  const livingMotion=addIslandMotion(group,t,theme);
  const npcHeight=battlefield?group.userData.heightAt:isZou?()=>2.6:theme.landmark==='restaurant'?()=>-.29:theme.landmark==='ship'?()=>-.18:group.userData.heightAt;
  const residents=addIslandNPCs(group,t,theme,{heightAt:npcHeight,count:theme.architecture==='none'?7:14,radius:battlefield?(floating?3.0:2.4):t.name==='Enies Lobby'?5.8:5.2,scale:.14,...(battlefield?{patrolCenter:[0,arenaZ]}:{})});
  group.userData.npcPopulation=residents;group.userData.update=time=>{livingMotion(time);if(residents.group.visible)residents.update(time);};group.userData.dispose=()=>residents.dispose();addAnimeRim(group);
  group.userData.textures=textures;
  group.userData.radius=islandRadius*1.2;
  group.traverse(o=>{if(o.isMesh){o.castShadow=!o.material?.transparent;o.receiveShadow=true;for(const m of Array.isArray(o.material)?o.material:[o.material])if(m&&'emissiveIntensity'in m)m.emissiveIntensity=0;}});
  return group;
}
