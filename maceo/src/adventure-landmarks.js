import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { addLandmark } from './landmarks.js';

// Original architectural interpretations of the familiar silhouettes, never official models.
export function addAdventureLandmark(root, theme = {}, t = {}, kit = {}) {
  const group=addLandmark(root,theme,t,kit);group.name='adventure-landmark-'+(theme.landmark||'none');group.position.set(0,.55,-.8);
  const materials=new Map();
  const mat=(c,extra={})=>{const key=c+JSON.stringify(extra);if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color:c,roughness:.72,metalness:0,...extra}));return materials.get(key);};
  const mesh=(geo,c,x=0,y=0,z=0,extra={})=>{const m=new THREE.Mesh(geo,mat(c,extra));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;group.add(m);return m;};
  const box=(x,y,z,w,h,d,c,extra={})=>mesh(new THREE.BoxGeometry(w,h,d),c,x,y,z,extra);
  const cyl=(x,y,z,rt,rb,h,c,n=24)=>mesh(new THREE.CylinderGeometry(rt,rb,h,n),c,x,y,z);
  const ball=(x,y,z,r,c,scale=[1,1,1],extra={})=>{const m=mesh(new THREE.SphereGeometry(r,24,14),c,x,y,z,extra);m.scale.set(...scale);return m;};
  const beam=(A,B,r,c)=>{const a=new THREE.Vector3(...A),b=new THREE.Vector3(...B),delta=b.clone().sub(a);const m=mesh(new THREE.CylinderGeometry(r,r,delta.length(),10),c,...a.clone().add(b).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;};
  const arch=(x,y,z,w,h,c)=>{box(x-w*.42,y+h*.34,z,w*.16,h*.68,.18,c);box(x+w*.42,y+h*.34,z,w*.16,h*.68,.18,c);mesh(new THREE.TorusGeometry(w*.42,w*.08,8,28,Math.PI),c,x,y+h*.68,z);};
  const window=(x,y,z,w=.15,h=.28,c='#54777c')=>{box(x,y,z,w+.06,h+.07,.025,'#d9cfb6');box(x,y,z+.018,w,h,.025,c);box(x,y,z+.035,.018,h,.012,'#a69f86');};
  const stair=(x,z,w,count,rise,run,c)=>{for(let j=0;j<count;j++)box(x,(j+.5)*rise,z-j*run,w,(j+1)*rise,run+.035,c);};
  const clear=()=>{const geometries=new Set(),mats=new Set();group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>mats.add(m));});group.clear();geometries.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());};
  const roof=(x,y,z,w,d,h,c='#735b51',curved=false)=>{
    if(!curved){const m=mesh(new THREE.ConeGeometry(w*.75,h,4),c,x,y,z);m.rotation.y=Math.PI/4;m.scale.z=d/w;return m;}
    const shape=new THREE.Shape();shape.moveTo(-w*.58,-h*.5);shape.quadraticCurveTo(-w*.35,-h*.58,0,h*.5);shape.quadraticCurveTo(w*.35,-h*.58,w*.58,-h*.5);shape.lineTo(w*.52,-h*.7);shape.quadraticCurveTo(0,h*.05,-w*.52,-h*.7);shape.closePath();
    const geo=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false,curveSegments:12});geo.translate(0,0,-d/2);return mesh(geo,c,x,y,z);
  };
  const house=(x,y,z,s=1,wall='#d9cbb1',rooftop='#9c6956',japanese=false)=>{
    box(x,y+s*.46,z,s*.88,s*.92,s*.76,wall);roof(x,y+s*1.02,z,s*1.08,s*.95,s*.48,rooftop,japanese);
    box(x,y+s*.27,z+s*.39,s*.16,s*.54,.028,'#625746');
    for(const dx of [-.27,.27])window(x+dx*s,y+s*.61,z+s*.4,s*.12,s*.18);
    box(x,y+s*.1,z+s*.5,s*.5,s*.13,s*.2,'#b8aa8e');
    if(!japanese){box(x+s*.25,y+s*1.14,z-s*.16,s*.14,s*.42,s*.16,'#ab9c82');}
  };
  const barkTree=(x,y,z,s=1,canopy='#527b43',roots=true)=>{
    const path=new THREE.CatmullRomCurve3([new THREE.Vector3(x,y,z),new THREE.Vector3(x-.14*s,y+1.5*s,z+.1*s),new THREE.Vector3(x+.16*s,y+3.1*s,z-.1*s)]);
    mesh(new THREE.TubeGeometry(path,16,.33*s,10,false),'#796444');
    for(let j=0;j<7;j++){const a=j/7*Math.PI*2,dx=Math.cos(a),dz=Math.sin(a);if(roots)beam([x,y+.85*s,z],[x+dx*s*.95,y+.02,z+dz*s*.95],.11*s,'#796444');beam([x,y+1.7*s,z],[x+dx*s*1.1,y+2.8*s,z+dz*s*.95],.105*s,'#796444');}
    for(let j=0;j<14;j++){const a=j*2.39996,rr=.4+(j%4)*.27;const m=mesh(new THREE.IcosahedronGeometry(.8*s,2),j%3?'#527b43':'#729451',x+Math.cos(a)*rr*s,y+(3.1+Math.sin(j)*.23)*s,z+Math.sin(a)*rr*s);m.scale.set(1.1,.65,1);}
  };
  const detailFacade=(m)=>{
    const p=m.geometry?.parameters;if(!p||!m.geometry.type.includes('Box')||p.width<.9||p.height<1||p.depth<.5)return;
    const rows=Math.min(6,Math.floor(p.height/.6)),cols=Math.min(6,Math.floor(p.width/.4));
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++)window(m.position.x-p.width*.5+(col+.5)*p.width/cols,m.position.y-p.height*.5+.38+row*(p.height-.55)/Math.max(1,rows-1),m.position.z+p.depth*.5+.025,.12,.22);
    box(m.position.x,m.position.y-p.height*.5+.08,m.position.z+p.depth*.5+.15,p.width+.14,.13,.3,'#b5aa91');
  };
  const landmark=theme.landmark;
  if(t.name==='Mary Geoise'){
    clear();box(0,.1,0,5.8,.2,4.6,'#e1ddcc');
    for(const [x,z,scale] of [[0,-.6,1.1],[-2.1,.7,.72],[2.1,.7,.72]]){for(let j=0;j<3;j++){const w=(2.5-j*.38)*scale,yy=.55+j*.8*scale;box(x,yy,z,w,.72*scale,1.5*scale,'#eee9d7');roof(x,yy+.53*scale,z,w+.25,1.8*scale,.45*scale,'#7c989b');for(let k=0;k<4;k++)window(x-w*.36+k*w*.24,yy+.08,z+.77*scale,.14*scale,.28*scale,'#8dabae');}for(const side of [-1,1]){cyl(x+side*.95*scale,1.55,z,.18*scale,.23*scale,2.6*scale,'#e8e5d2',16);roof(x+side*.95*scale,2.96*scale,z,.56*scale,.56*scale,.5*scale,'#8fa2a1');}}
    for(let j=0;j<5;j++){box(0,.24,1.4+j*.25,1.2,.04,.16,'#c9bea0');for(const side of [-1,1])ball(side*2.4,.45,-1.5+j*.7,.28,'#7b9a70',[1,.5,1]);}
  }else if(t.name==='New Marineford'){
    clear();
    const shape=new THREE.Shape(),N=80;for(let i=0;i<=N;i++){const a=.26+i/N*(Math.PI*2-.52),x=Math.sin(a)*3.8,z=Math.cos(a)*3.1;if(i)shape.lineTo(x,z);else shape.moveTo(x,z);}for(let i=N;i>=0;i--){const a=.26+i/N*(Math.PI*2-.52);shape.lineTo(Math.sin(a)*2.75,Math.cos(a)*2.1);}shape.closePath();const geo=new THREE.ExtrudeGeometry(shape,{depth:.8,bevelEnabled:true,bevelSize:.05,bevelThickness:.04,bevelSegments:1});geo.rotateX(Math.PI/2);mesh(geo,'#c3d6d3',0,.82,0);
    for(let i=0;i<13;i++){const a=.35+i/12*(Math.PI*2-.7),x=Math.sin(a)*3.45,z=Math.cos(a)*2.75;cyl(x,1.1,z,.17,.23,1.05,'#dce2d8',12);box(x,1.73,z,.45,.16,.43,'#6a91a0');}
    for(let j=0;j<4;j++){const w=4.2-j*.7,yy=1.05+j*.83;box(0,yy,-1.65,w,.82,w*.42,'#dbe2d4');roof(0,yy+.58,-1.65,w+.4,w*.6,.38,'#3e6f7e',true);for(let k=0;k<7-j;k++)window(-w*.4+k*w*.8/(6-j),yy+.03,-1.65+w*.22,.13,.26);}
    for(const x of [-2,2]){cyl(x,2,-1.7,.28,.38,2.7,'#d3e0d4',16);roof(x,3.5,-1.7,.85,.85,.45,'#527c8e');}
  }else if(t.name==='Enies Lobby'){
    clear();
    for(const x of [-2.7,2.7]){box(x,1.45,-1.5,1.1,2.9,1.2,'#d7dfd2');for(let j=0;j<5;j++)box(x-.45+j*.22,3.04,-1.5,.15,.3,1.25,'#e6eadf');}
    for(const x of [-1.4,1.4])box(x,2.15,-1.48,.18,4.3,.25,'#e1e6d8');arch(0,.4,-1.3,3.0,3.5,'#dce4d5');box(0,4.15,-1.45,3.2,.4,.6,'#d3ddcc');cyl(0,4.65,-1.5,.33,.33,.15,'#b6c6ae',20);
    for(let j=0;j<5;j++){box(0,.22,2.4-j*.7,1.25,.3,.65,'#c6ceb9');for(const x of [-.6,.6])cyl(x,.4,2.4-j*.7,.045,.045,.5,'#dce1cd',8);}
  }else if(t.name==='Zou'){
    clear();
    ball(0,-.6,.1,3.8,'#6f8381',[1.05,.7,1.28]);for(const x of [-2.4,2.4])for(const z of [-2.9,2.9])cyl(x,-3.0,z,.65,.5,4.4,'#6d7f7b',18);
    ball(0,-.8,4.0,2.0,'#7a8e86',[1,.95,.8]);for(const x of [-1.65,1.65])ball(x,-.55,3.8,1.3,'#889b90',[.35,.9,.75]);const trunkCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,-1.1,5),new THREE.Vector3(.1,-2.8,5.6),new THREE.Vector3(.5,-4.5,5.7),new THREE.Vector3(1.1,-4.9,5.5)]);mesh(new THREE.TubeGeometry(trunkCurve,30,.4,14,false),'#82968b');
    for(const x of [-.8,.8]){const tusk=new THREE.CatmullRomCurve3([new THREE.Vector3(x,-1.2,4.9),new THREE.Vector3(x*1.4,-1.5,5.7),new THREE.Vector3(x*1.7,-.8,6.1)]);mesh(new THREE.TubeGeometry(tusk,18,.12,10,false),'#dedeca');}
    cyl(0,1.8,0,3.35,3.65,.48,'#6e8c59',40);barkTree(0,1.95,-.7,1.55,'#5d884f',true);for(let j=0;j<12;j++){const a=j/12*Math.PI*2;house(Math.sin(a)*2.65,2.05,Math.cos(a)*2.5,.6,'#c8b48b','#6c7351');}
  }else if(landmark==='palace'&&t.name==='Dressrosa'){
    clear();
    // The arena, warm Mediterranean town and raised royal skyline form a distinct silhouette.
    cyl(0,.38,.9,2.45,2.65,.76,'#b9a78b',64);cyl(0,.83,.9,2.25,2.4,.18,'#ddc5a2',64);
    const arena=mesh(new THREE.RingGeometry(1.65,2.25,64),'#bba583',0,.96,.9);arena.rotation.x=-Math.PI/2;
    cyl(0,.79,.9,1.65,1.65,.12,'#cebc8e',48);
    for(let j=0;j<24;j++){const a=j/24*Math.PI*2,x=Math.cos(a)*2.35,z=.9+Math.sin(a)*2.35;const m=box(x,.58,z,.18,.65,.16,'#e2d2b2');m.rotation.y=-a;const cornice=box(x,1.02,z,.42,.14,.26,'#d9c49d');cornice.rotation.y=-a;}
    const rock=mesh(new THREE.CylinderGeometry(1.1,1.75,1.7,16),'#a8ad8c',0,.85,-2.2);rock.scale.z=.65;
    for(let j=0;j<3;j++){const w=1.8-j*.35;box(0,1.8+j*.61,-2.2,w,.62,w*.7,'#e5cbb3');roof(0,2.2+j*.62,-2.2,w+.2,w*.8,.42,'#c28c8c');}
    for(const x of [-.9,.9]){cyl(x,2.6,-2.2,.17,.22,1.6,'#d9c3b0',16);roof(x,3.55,-2.2,.48,.48,.55,'#c08891');}
    house(-3.35,0,-.7,.75,'#e3c7a3','#b77c69');house(3.25,0,-.9,.7,'#dbc6a9','#b78979');
  }else if(landmark==='palace'&&t.name==='Amazon Lily'){
    clear();
    for(let j=0;j<3;j++){const w=3.6-j*.8,yy=.45+j*.94;box(0,yy,0,w,.8,w*.6,'#be8b77');box(0,yy+.03,w*.32,w+.3,.12,.32,'#d2b58a');roof(0,yy+.63,0,w+.8,w*.85,.6,'#496f67',true);for(let k=0;k<4;k++)window(-w*.32+k*w*.215,yy+.12,w*.32,.16,.3,'#635f54');for(const x of [-1,1])cyl(x*w*.44,yy+.1,0,.055,.065,.8,'#b55347',10);}
    stair(0,2.4,2.4,8,.08,.18,'#bfba9f');
    for(const x of [-2.3,2.3]){const path=new THREE.CatmullRomCurve3([new THREE.Vector3(x,0,.7),new THREE.Vector3(x*1.1,1.0,.5),new THREE.Vector3(x,2.1,.35),new THREE.Vector3(x*.8,2.6,.7)]);mesh(new THREE.TubeGeometry(path,24,.17,12,false),'#a0afa1');ball(x*.8,2.65,.7,.23,'#b4c2aa',[1.1,.75,1.3]);}
    for(const x of [-3.0,3.0]){cyl(x,.8,-1.7,.08,.14,1.6,'#7f6b53');ball(x,1.95,-1.7,.9,'#6c985d',[1,.65,1]);}
  }else if(landmark==='palace'){
    clear();
    box(0,.12,0,4.8,.24,3.2,'#cbb487');box(0,1.6,-.25,3.3,2.9,2.0,'#dfc68e');box(0,3.05,-.25,3.55,.22,2.2,'#f1deb1');
    cyl(0,3.12,-.25,1.1,1.18,.2,'#ddcda4');ball(0,3.25,-.25,1.1,'#80aaa6',[1,.86,1],{roughness:.45});cyl(0,4.38,-.25,.035,.05,.45,'#dabb79');ball(0,4.65,-.25,.09,'#dabb79');
    for(const x of [-2.0,2.0])for(const z of [-1.1,1.1]){
      cyl(x,2.0,z,.24,.33,4.0,'#ead6aa');for(const yy of [.55,1.6,2.65,3.7])cyl(x,yy,z,.36,.36,.12,'#c7b181');ball(x,4.05,z,.39,'#7ea5a0',[1,.8,1]);cyl(x,4.57,z,.025,.025,.45,'#d8bc83');
      for(let j=0;j<5;j++)window(x-.12+j*.06,2.9,z+.3,.035,.25,'#587b80');
    }
    for(let j=0;j<7;j++){const x=-1.42+j*.47;arch(x,.1,1.02,.42,1.25,'#c3aa78');window(x,2.0,1.03,.17,.46);}
    stair(0,2.2,2.8,6,.06,.18,'#d4bf95');for(const x of [-1.1,1.1])box(x,.65,1.17,.08,1.2,.12,'#ebd7a5');
    for(const x of [-2.8,2.8]){cyl(x,.16,1.6,.65,.75,.3,'#bfa77a');ball(x,.25,1.6,.48,'#6fa6a4',[1,.1,1]);}
  }else if(landmark==='canals'&&t.name!=='Reverse Mountain'){
    clear();
    const tiers=[{r:3.9,y:.18},{r:2.75,y:.85},{r:1.55,y:1.55}];
    for(const [j,tier] of tiers.entries()){
      cyl(0,tier.y-.1,0,tier.r,tier.r+.15,.35,'#c2bd9f',64);
      const water=mesh(new THREE.RingGeometry(tier.r-.55,tier.r-.22,64),'#4399a8',0,tier.y+.09,0,{roughness:.22,metalness:.12});water.rotation.x=-Math.PI/2;
      const count=j===0?16:j===1?11:5;
      for(let k=0;k<count;k++){const a=k/count*Math.PI*2;if(k%5===0)continue;const rr=tier.r-.82,x=Math.cos(a)*rr,z=Math.sin(a)*rr;house(x,tier.y+.1,z,.53+j*.05,k%2?'#e0d0b5':'#c5c5b4',k%3?'#8b6657':'#71918a');}
      for(const a of [0,Math.PI*.65,Math.PI*1.3]){const x=Math.cos(a)*(tier.r-.38),z=Math.sin(a)*(tier.r-.38);const b=box(x,tier.y+.16,z,.72,.12,.31,'#d9c89d');b.rotation.y=-a;for(const side of [-1,1]){const rail=box(x,tier.y+.37,z+side*.14,.8,.06,.04,'#bdb08e');rail.rotation.y=-a;}}
      for(let k=0;k<6;k++){const a=k/6*Math.PI*2,rr=tier.r;beam([Math.cos(a)*rr,tier.y,Math.sin(a)*rr],[Math.cos(a)*(rr+.12),tier.y-.35,Math.sin(a)*(rr+.12)],.035,'#b3a78b');}
    }
    cyl(0,2.0,0,.58,.75,1.2,'#d7d8c6');cyl(0,2.64,0,1.05,.8,.12,'#c5d3c5',48);ball(0,2.8,0,.15,'#a6dee0');
    for(let k=0;k<8;k++){const a=k/8*Math.PI*2;beam([0,2.8,0],[Math.cos(a)*.75,2.65,Math.sin(a)*.75],.028,'#8dd1d4');}
    stair(0,4.4,1.6,8,.07,.16,'#cfbea0');
  }else if(landmark==='drum'){
    clear();
    const peaks=[[-2.2,.3,3.7,.9],[.15,-.5,5.7,1.03],[2.45,.25,4.25,.83],[-3.7,-1.3,2.6,.62],[3.5,-1.4,3.1,.62]];
    for(const [x,z,h,r] of peaks){
      const geo=new THREE.CylinderGeometry(r*.82,r,h,28,9);const p=geo.attributes.position;
      for(let i=0;i<p.count;i++){const yy=p.getY(i),xx=p.getX(i),zz=p.getZ(i),theta=Math.atan2(zz,xx),f=1+.035*Math.sin(theta*9+yy*2.3)+.025*Math.cos(theta*17-yy*1.8);p.setXYZ(i,xx*f,yy,zz*f);}geo.computeVertexNormals();mesh(geo,'#82969f',x,h*.5,z);
      cyl(x,h+.04,z,r*.89,r*.86,.16,'#eef2e8',28);for(let j=0;j<10;j++){const a=j/10*Math.PI*2;beam([x+Math.cos(a)*r*.85,.2,z+Math.sin(a)*r*.85],[x+Math.cos(a)*r*.79,h-.12,z+Math.sin(a)*r*.79],.033,'#bbcbd0');}
    }
    house(.15,5.82,-.5,.9,'#d8dfe0','#7a7390');for(const x of [-.35,.65]){cyl(x,6.45,-.5,.15,.19,1.1,'#c5d0d1');roof(x,7.12,-.5,.45,.45,.42,'#736e8a');}
  }else if(landmark==='torii'){
    clear();
    const mt=mesh(new THREE.ConeGeometry(1.85,4.6,40,8),'#738d8f',-2.4,2.3,-1.65);mt.scale.z=.75;mesh(new THREE.ConeGeometry(.72,1.35,40,4),'#eef1e4',-2.4,3.94,-1.65);
    for(let j=0;j<4;j++){const w=2.7-j*.48,yy=.4+j*.79;box(.4,yy,-.7,w,.72,w*.7,'#c5b994');box(.4,yy-.2,-.7,w+.1,.1,w*.76,'#745b48');roof(.4,yy+.53,-.7,w+.6,w*.92,.55,'#3e6262',true);for(const x of [-1,1])window(.4+x*w*.25,yy+.05,-.7+w*.36,.18,.25);}
    for(const x of [-1.2,1.2])cyl(x,1.3,1.8,.13,.18,2.6,'#b34b3d');box(0,2.1,1.8,3.2,.16,.25,'#bb5a46');roof(0,2.63,1.8,3.9,.5,.24,'#3e5050',true);
    for(const [x,z] of [[-3.4,1.3],[3.0,.5],[2.9,-2.2]]){cyl(x,.85,z,.08,.16,1.7,'#79614f');for(let k=0;k<6;k++){const a=k*Math.PI/3;ball(x+Math.cos(a)*.35,2.0+Math.sin(k)*.15,z+Math.sin(a)*.35,.52,k%2?'#d5a7b6':'#e3bac4',[1,.6,1]);}}
    stair(0,2.8,2,6,.06,.14,'#9e9d85');
  }else if(['tree','gianttree'].includes(landmark)&&t.name!=='Zou'){
    clear();
    if(t.name==='Sabaody'){
      for(const [x,z,s] of [[0,-.7,1.8],[-2.7,.2,1.25],[2.8,.4,1.35],[-1.8,-2.1,1.15],[2,-2.2,1.15]])barkTree(x,0,z,s,'#4b8055',true);
      for(let j=0;j<12;j++)ball(Math.sin(j*1.7)*3.4,.8+j*.43,Math.cos(j*1.7)*2.4,.22+j%3*.1,'#bedfe5',[1,1,1],{transparent:true,opacity:.18,roughness:.08,metalness:.05,depthWrite:false});
    }else{
      const scale=landmark==='gianttree'?2.2:1.85;barkTree(0,0,0,scale,'#507b43',true);
      if(t.name==='Ohara'){for(const x of [-.22,.22])for(let j=0;j<4;j++)window(x,.65+j*.72,.55,.14,.28,'#d8bd79');arch(0,0,.62,.7,.95,'#b3a073');for(let j=0;j<6;j++)box(-.65+j*.22,.18,.8,.2,.38,.14,'#9d8e6e');}
      if(t.name==='Elbaf'){house(-3.2,0,1.5,1.2,'#bbae8c','#64503c');house(3.1,0,1.2,1.2,'#bbae8c','#64503c');}
    }
  }else if(landmark==='dome'&&t.name!=='Mirrorball'){
    clear();
    cyl(0,.72,0,2.1,2.25,1.44,'#d8e3e0',48);ball(0,1.43,0,2.1,'#87b5c3',[1,.65,1],{roughness:.28,metalness:.25});
    for(let j=0;j<16;j++){const a=j/16*Math.PI*2,x=Math.cos(a)*2.18,z=Math.sin(a)*2.18;box(x,.9,z,.16,.56,.14,j%2?'#96d3d4':'#688f9d');}
    const orbit=mesh(new THREE.TorusGeometry(2.85,.095,12,96),'#dcc38f',0,2.0,0,{metalness:.5,roughness:.32});orbit.rotation.x=1.12;
    for(const [x,z] of [[-3.3,.8],[3.3,.7],[2.3,-2.6],[-2.4,-2.5]]){cyl(x,1.15,z,.42,.55,2.3,'#c8d8d8',24);ball(x,2.35,z,.57,'#9abecb',[1,.75,1],{roughness:.3,metalness:.2});for(let j=0;j<4;j++)window(x-.18+j*.12,1.35,z+.5,.06,.42,'#8be0dd');}
    cyl(0,3.1,0,.035,.045,1.0,'#ced8cf');ball(0,3.7,0,.17,'#cf9b9c');
    for(let j=0;j<3;j++){const pipe=mesh(new THREE.TorusGeometry(3.4+j*.2,.045,7,80,Math.PI*.55),'#9fc3c4',0,.65+j*.17,0,{metalness:.3});pipe.rotation.x=Math.PI/2;pipe.rotation.z=j;}
  }else{
    // All legacy silhouettes receive fine facade work rather than losing their island identity.
    const targets=[];group.traverse(m=>{if(m.isMesh)targets.push(m);});targets.forEach(detailFacade);
    if(landmark==='castle'||landmark==='prison'||landmark==='gates'){
      for(const x of [-1.1,1.1])for(let row=0;row<3;row++)window(x,.8+row*.6,.8,.17,.3,theme.biome==='haunted'?'#c9ac76':'#56828e');
      stair(0,1.8,1.8,7,.055,.12,'#a3a791');
      for(let j=0;j<8;j++)box(-1.4+j*.4,2.05,.8,.16,.25,.19,'#b3b9b1');
    }
    if(landmark==='cake'){for(let j=0;j<18;j++){const a=j/18*Math.PI*2;ball(Math.cos(a)*1.75,.8,Math.sin(a)*1.75,.11,j%2?'#cf7690':'#ead6a1');}for(const x of [-1.1,0,1.1])arch(x,0,1.7,.6,.9,'#e9d7be');}
    if(landmark==='restaurant'){for(const x of [-1.3,-.8,-.3,.2,.7,1.2])window(x,1.65,.69,.22,.36);for(const z of [-.78,.78]){beam([-1.9,1.35,z],[1.9,1.35,z],.025,'#d5c6a6');for(let j=0;j<10;j++)beam([-1.8+j*.4,1.06,z],[-1.8+j*.4,1.35,z],.018,'#c5b693');}}
    if(landmark==='split'){for(let j=0;j<14;j++){const x=-2.5+(j%4)*.6,z=-1.4+Math.floor(j/4)*.8;const crystal=mesh(new THREE.ConeGeometry(.16,.7+(j%3)*.25,6),'#b9e4e8',x,.45,z);crystal.rotation.z=(j%3-1)*.17;}}
  }
  if(t.name==='Whole Cake'){for(const [x,z,h]of [[-3,-1.3,1.8],[3.1,-1.5,2.1],[-3.2,1.4,1.2],[3.2,1.6,1.3]]){for(let j=0;j<3;j++){cyl(x,h*(j+.5)/3,z,.75-j*.14,.8-j*.14,h/3,j%2?'#d1a4bf':'#f0d7b4',24);cyl(x,h*(j+1)/3+.04,z,.77-j*.14,.77-j*.14,.07,'#f6e5d2',24);}ball(x,h+.15,z,.16,'#c67f95');}}
  if(t.name==='Skypiea'){for(const [x,z] of [[-2.5,1],[2.5,.8],[-2.4,-1.8],[2.5,-1.7]]){box(x,.55,z,1,.8,1,'#d2b561');for(const dx of [-.35,.35])cyl(x+dx,1.15,z+.4,.065,.08,1.1,'#e4c778',12);roof(x,1.68,z,1.4,1.3,.5,'#caa64e');}}
  // Fine facade meshes are consolidated by material so detail does not multiply draw calls.
  consolidate(group);
  if(['restaurant','ship'].includes(landmark))group.position.y=-1.5;
  group.userData.landmark=landmark||'none';group.userData.adventure=true;
  return group;
}

function consolidate(group){
  group.updateMatrixWorld(true);const inverse=group.matrixWorld.clone().invert(),buckets=new Map(),meshes=[],oldGeos=new Set();
  group.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||Array.isArray(o.material))return;meshes.push(o);const m=o.material,key=[m.color?.getHexString(),m.transparent,m.opacity,m.roughness,m.metalness,m.vertexColors,m.side].join('|');if(!buckets.has(key))buckets.set(key,{material:m,geometries:[]});let geo=o.geometry.clone();if(geo.index){const old=geo;geo=geo.toNonIndexed();old.dispose();}if(!geo.attributes.uv)geo.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count*2),2));if(!geo.attributes.normal)geo.computeVertexNormals();geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld));buckets.get(key).geometries.push(geo);oldGeos.add(o.geometry);});
  meshes.forEach(o=>o.removeFromParent());oldGeos.forEach(g=>g.dispose());
  const keep=new Set();for(const {material,geometries} of buckets.values()){
    const geo=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());if(!geo)continue;keep.add(material);const m=new THREE.Mesh(geo,material);m.castShadow=m.receiveShadow=true;group.add(m);
  }
  // Empty transform groups have no GPU cost; lights and animated transparent details stay attached.
}
