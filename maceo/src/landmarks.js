import * as THREE from 'three';

/** Original low-poly architectural motifs, drawn from each island's broad setting. */
export function addLandmark(root, theme = {}, t = {}, kit = {}) {
  const group = new THREE.Group();
  group.name = `landmark-${theme.landmark || 'none'}`;
  group.position.z = -1.15;
  root.add(group);
  const mats = new Map();
  const material = (color, extra = {}) => {
    const key = color + JSON.stringify(extra);
    if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial({ color, roughness: .87, flatShading: true, ...extra }));
    return mats.get(key);
  };
  const mesh = (geo, color, x=0, y=0, z=0, extra={}) => {
    const m = new THREE.Mesh(geo, material(color, extra));
    m.position.set(x,y,z); m.castShadow = true; m.receiveShadow = true; group.add(m); return m;
  };
  const box = (x,y,z,w,h,d,c) => mesh(new THREE.BoxGeometry(w,h,d),c,x,y,z);
  const cyl = (x,y,z,rt,rb,h,c,n=12) => mesh(new THREE.CylinderGeometry(rt,rb,h,n),c,x,y,z);
  const ball = (x,y,z,r,c,scale=[1,1,1],extra={}) => { const m=mesh(new THREE.SphereGeometry(r,12,8),c,x,y,z,extra);m.scale.set(...scale);return m; };
  const cone = (x,y,z,r,h,c,n=8) => mesh(new THREE.ConeGeometry(r,h,n),c,x,y,z);
  const beam = (a,b,r,c) => {
    const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),diff=B.clone().sub(A);
    const m=mesh(new THREE.CylinderGeometry(r,r,diff.length(),7),c,...A.clone().add(B).multiplyScalar(.5).toArray());
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),diff.normalize());return m;
  };
  const arch = (x,y,z,w,h,c) => {
    box(x-w*.42,y+h*.33,z,w*.16,h*.66,.32,c);box(x+w*.42,y+h*.33,z,w*.16,h*.66,.32,c);
    const m=mesh(new THREE.TorusGeometry(w*.42,w*.08,5,18,Math.PI),c,x,y+h*.66,z);return m;
  };
  const roof = (x,y,z,r,h,c) => { const m=cone(x,y,z,r,h,c,4);m.rotation.y=Math.PI/4;return m; };
  const house = (x,y,z,w=1,c='#e8d5aa',roofColor='#ac6c4b') => {
    box(x,y+.4*w,z,w,.8*w,.76*w,c);roof(x,y+.94*w,z,w*.85,.45*w,roofColor);
    box(x,y+.25*w,z+.39*w,.18*w,.5*w,.025,'#4e6056');
    for(const dx of [-.27,.27])box(x+dx*w,y+.52*w,z+.39*w,.13*w,.18*w,.025,'#a6c8cb');
  };
  const flag = (x,y,z,c='#c34539') => {cyl(x,y,z,.025,.025,1.1,'#d8caab',6);box(x+.25,y+.32,z,.5,.28,.035,c);};
  const tree = (x,y,z,s=1, giant=false) => {
    cyl(x,y+1.1*s,z,.2*s,.42*s,2.2*s,'#766545',9);
    for(const dx of [-1,1])beam([x,y+1.3*s,z],[x+dx*.85*s,y+2.1*s,z],.12*s,'#766545');
    ball(x,y+2.55*s,z,1.25*s,'#4a8055',[1.3,.7,1]);
    ball(x-.8*s,y+2.35*s,z+.3*s,.85*s,'#75a367',[1,.8,1]);
    if(giant)ball(x+.8*s,y+2.55*s,z-.2*s,.9*s,'#365e47');
  };
  const tower = (x,z,h=2.5,c='#d8d5bf') => {
    cyl(x,h*.5,z,.4,.52,h,c,10);cone(x,h+.3,z,.61,.7,'#657b78',10);
    for(let j=0;j<2;j++)box(x,h*.4+j*.7,z+.43,.16,.34,.035,'#485f63');
  };
  switch (theme.landmark) {
    case 'palace': {
      box(0,1.0,0,2.8,2.0,1.8,'#ead7a4');
      cyl(0,2.0,0,1.0,1.05,.28,'#e9dcb2',16);ball(0,2.25,0,.98,'#77b6ad',[1,.8,1]);
      cyl(0,3.15,0,.035,.035,.45,'#e7c67d',6);ball(0,3.4,0,.1,'#e7c67d');
      for(const x of [-1.6,1.6])for(const z of [-.8,.8]){
        cyl(x,1.3,z,.22,.33,2.6,'#f0dfb8',10);cyl(x,2.45,z,.33,.33,.17,'#c7ae7b',10);cone(x,2.85,z,.37,.6,'#7eb6ab',10);
      }
      for(const x of [-.85,0,.85])arch(x,.03,1.0,.58,1.25,'#d1b881');
      break;
    }
    case 'canals': {
      if(t.name==='Reverse Mountain'){
        /* The Red Line massif and its converging uphill waterways. */
        cone(0,2.15,0,2.85,4.3,'#b4725e',10);
        cone(-1.6,1.0,-.7,1.2,2.0,'#996456',7);
        cone(1.5,.8,-.8,1.0,1.6,'#c48a6b',7);
        for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
          const pts=[[dx*2.66,.15,dz*2.66],[dx*1.83,1.45,dz*1.83],[dx*.95,2.82,dz*.95],[dx*.12,4.2,dz*.12]];
          for(let j=0;j<pts.length-1;j++)beam(pts[j],pts[j+1],.14,'#64b7d2');
          for(let j=0;j<pts.length-1;j++){
            const a=pts[j].map((v,k)=>k===1?v+.09:v),b=pts[j+1].map((v,k)=>k===1?v+.09:v);
            beam(a,b,.035,'#c0e5e6');
          }
        }
        ball(0,4.21,0,.3,'#9cd4dd',[1,.35,1]);
        break;
      }
      const water=mesh(new THREE.RingGeometry(1.05,2.9,40),'#459ea9',0,.44,0,{roughness:.22});water.rotation.x=-Math.PI/2;
      for(let j=0;j<16;j++){
        const a=j/16*Math.PI*2;
        if(j%4===0)continue;
        const x=Math.cos(a)*2.25,z=Math.sin(a)*2.25;
        cyl(x,.44,z,.44,.5,.16,'#d6c8ab',8);house(x,.53,z,.6,['#d7c6a1','#c9bbab','#ead8b2'][j%3],j%2?'#8b5747':'#678e82');
      }
      cyl(0,.8,0,.55,.7,1.6,'#c5d2bf',12);cyl(0,1.65,0,1.05,.75,.2,'#c5d2bf',16);
      cyl(0,2.0,0,.1,.16,.6,'#8bcecf',8);ball(0,2.38,0,.18,'#9ddfd9');
      for(const x of [-1,1]){ const b=box(x*1.7,.56,0,1.8,.18,.7,'#d0c09b');b.rotation.y=x*Math.PI*.05; }
      break;
    }
    case 'drum': {
      for(const [x,z,h,r] of [[-1.4,.15,2.4,.65],[.2,-.1,3.8,.8],[1.7,.35,2.8,.63]]){
        cyl(x,h/2,z,r*.9,r,h,'#8799a2',12);cyl(x,h+.06,z,r*.97,r,.15,'#f0f0df',12);
        for(let j=0;j<5;j++){const a=j/5*Math.PI*2;beam([x+Math.cos(a)*r*.9,.2,z+Math.sin(a)*r*.9],[x+Math.cos(a)*r*.85,h-.1,z+Math.sin(a)*r*.85],.045,'#c1cbd0');}
      }
      box(.2,4.0,-.1,.65,.45,.55,'#d1dbe0');roof(.2,4.34,-.1,.58,.45,'#8a7e9d');
      break;
    }
    case 'torii': {
      for(const x of [-1,1])cyl(x,1.05,.6,.16,.21,2.1,'#be4e3d',10);
      box(0,1.72,.6,2.65,.16,.25,'#c45540');box(0,2.15,.6,3.0,.22,.38,'#344c4c');
      for(let k=0;k<3;k++){const w=1.8-k*.35;box(0,.45+k*.7,-1.1,w,.6,w*.82,'#d0b58b');roof(0,.87+k*.7,-1.1,w*.95,.32,'#3e6b67');}
      const mt=cone(-2.15,1.5,-1.25,1.15,3.0,'#829898',8);mt.scale.z=.8;
      cone(-2.15,2.65,-1.25,.45,.75,'#e9e9db',8);
      for(const x of [-2.1,2.15]){cyl(x,.8,.1,.07,.13,1.6,'#6b5a47',7);ball(x,1.85,.1,.65,'#d9a0ae',[1,.75,1]);}
      break;
    }
    case 'tree': case 'gianttree': {
      if(t.name==='Zou'){
        ball(0,1.0,0,1.3,'#8e9a8d',[1.35,.8,.9]);ball(.1,1.1,1.0,.7,'#9da798');
        for(const x of [-.8,.8])for(const z of [-.55,.55])cyl(x,.4,z,.24,.28,.8,'#88968b',9);
        const trunk=mesh(new THREE.TorusGeometry(.65,.19,7,14,Math.PI*1.1),'#9da798',.1,.75,1.7);trunk.rotation.y=Math.PI/2;trunk.rotation.z=.3;
        tree(0,1.65,-.15,1.07,true);
      }else{
        const s=theme.landmark==='gianttree'?1.5:1.25;tree(0,0,0,s,true);
        if(t.name==='Ohara'){
          for(const x of [-.23,.23])for(const yy of [.55,1.15,1.75])box(x,yy,.5,.14,.23,.03,'#d4b982');
          arch(0,.0,.53,.6,.72,'#bead7f');
        }
        if(t.name==='Sabaody')for(let j=0;j<6;j++)ball(Math.sin(j*1.7)*2.2,1+j*.55,Math.cos(j*1.7)*1.9,.34+j*.05,'#bce6de',[1,1,1],{transparent:true,opacity:.22,roughness:.15,metalness:.05});
        if(t.name==='Elbaf')for(const x of [-2.0,2.0])house(x,0,.6,.95,'#b9aa86','#6b5140');
      }
      break;
    }
    case 'cloud': {
      if(t.name==='Birka'){
        /* Its limited known setting is a sky island: no borrowed Skypiea temple. */
        for(let j=0;j<14;j++){
          const a=j*2.39996,r=1.0+(j%4)*.55;
          ball(Math.cos(a)*r,.12+(j%3)*.28,Math.sin(a)*r*.65,.7+(j%3)*.15,j%3?'#edf1e8':'#c9dce0',[1.35,.45,1]);
        }
        for(let j=0;j<4;j++)ball(-2.0+j*1.3,1.25+(j%2)*.25,-1.0,.55,'#e4ede7',[1.4,.45,.85]);
        break;
      }
      for(let j=0;j<9;j++)ball(Math.cos(j*2.4)*2.5,.1+Math.sin(j)*.12,Math.sin(j*2.4)*1.4,.75,'#f0f2e7',[1.3,.4,1]);
      for(const x of [-.7,.7])cyl(x,1.0,0,.13,.17,2,'#ede1af',9);
      box(0,2.0,0,2.0,.22,.65,'#e3d4a0');roof(0,2.32,0,1.2,.5,'#d5b36d');
      cyl(0,1.5,0,.38,.45,.55,'#e4be66',12);ball(0,1.17,0,.1,'#e4be66');
      beam([-.8,0,1],[.8,0,1],.12,'#d0b96e');break;
    }
    case 'coral': {
      for(let j=0;j<7;j++){
        const x=Math.sin(j*1.5)*2.3,z=Math.cos(j*1.5)*1.6,h=1+(j%3)*.35,c=['#de8f8e','#d7ae84','#8bbca9'][j%3];
        beam([x,0,z],[x,h,z],.1,c);for(const dx of [-.35,.35]){beam([x,h*.5,z],[x+dx,h*.9,z+.15],.075,c);ball(x+dx,h*.9,z+.15,.13,c);}
      }
      ball(0,1.1,0,1.0,'#d2abcf',[1.1,1.1,1]);cone(0,2.5,0,.65,1.0,'#c877a7',12);
      for(let j=0;j<4;j++)cyl(Math.sin(j*Math.PI/2)*.95,.75,Math.cos(j*Math.PI/2)*.95,.2,.25,1.5,'#d8bdc8',10);
      ball(0,2,0,4.3,'#a1deea',[1,1,1],{transparent:true,opacity:.075,roughness:.1,depthWrite:false,side:THREE.DoubleSide});
      break;
    }
    case 'split': {
      const ice=cone(-1.15,1.5,0,1.5,3.0,'#a9dfe7',6);ice.scale.z=1.1;
      for(let j=0;j<3;j++)cone(-2+j*.6,.9,1.0,.45,1.8,'#d7eff0',5);
      cone(1.4,1.2,-.15,1.6,2.4,'#635956',9);cyl(1.4,2.38,-.15,.4,.4,.08,'#e99257',10);
      for(let j=0;j<3;j++)beam([1.35,2.35,-.15],[1.1+j*.35,.3,1.1],.07,'#c8673e');
      for(let j=0;j<3;j++)ball(1.4+j*.1,2.8+j*.4,-.15,.3+j*.1,'#9faaa5',[1,.6,1],{transparent:true,opacity:.5});break;
    }
    case 'castle': {
      box(0,.95,0,2.2,1.9,1.3,'#78808b');roof(0,2.3,0,1.5,1.1,'#45445d');
      for(const x of [-1.2,1.2]){cyl(x,1.3,.1,.3,.4,2.6,'#858c95',9);cone(x,3.0,.1,.6,1.0,'#46445c',8);box(x,1.7,.49,.15,.45,.03,'#d9bd7b');}
      box(0,.45,.68,.4,.9,.04,'#39485a');
      for(const x of [-2.0,2.0]){beam([x,0,.4],[x*.9,1.9,.4],.08,'#665e58');beam([x*.97,1.1,.4],[x+Math.sign(x)*.5,1.7,.4],.05,'#665e58');}
      break;
    }
    case 'skull': {
      ball(0,1.55,0,1.6,'#a5a89e',[1.2,1.0,.85]);
      for(const x of [-.64,.64])ball(x,1.7,1.15,.43,'#3b4b4a',[1,.9,.35]);
      cone(0,1.05,1.25,.25,.55,'#465554',3).rotation.x=Math.PI;
      for(let j=-2;j<=2;j++)box(j*.3,.35,1.0,.22,.65,.45,'#b7b8a9');
      beam([-2.1,.25,.1],[2.1,1.0,.1],.16,'#a5a89e');beam([-2.1,1.0,.1],[2.1,.25,.1],.16,'#a5a89e');break;
    }
    case 'dome': {
      if(t.name==='Mirrorball'){
        /* Mirrorball's namesake is a huge reflective ball, distinct from Egghead. */
        cyl(0,.18,0,2.0,2.15,.35,'#687c8a',20);
        cyl(0,.7,0,.65,.82,.8,'#b9bfc0',12);
        const geo=new THREE.SphereGeometry(1.6,20,14).toNonIndexed();
        const count=geo.getAttribute('position').count,colors=[];
        const shades=['#d9e1df','#879cab','#bfcbd0','#9dabb6','#e6e7db','#748e9f'];
        for(let i=0;i<count;i+=3){const c=new THREE.Color(shades[(Math.floor(i/3)*7+Math.floor(i/60))%shades.length]);for(let j=0;j<3;j++)colors.push(c.r,c.g,c.b);}
        geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
        mesh(geo,'#ffffff',0,2.35,0,{vertexColors:true,metalness:.62,roughness:.22});
        for(const [i,c] of ['#af8bbb','#8cc3ca','#c49bba','#dfc082'].entries()){
          const a=i*Math.PI/2,x=Math.cos(a)*1.75,z=Math.sin(a)*1.75;
          cyl(x,.48,z,.13,.18,.7,'#607688',8);ball(x,.88,z,.16,c);
          const lamp=new THREE.PointLight(c,.65,5);lamp.position.set(x,1.25,z);group.add(lamp);
        }
        break;
      }
      cyl(0,.75,0,1.7,1.9,1.5,'#cddddd',20);ball(0,1.5,0,1.7,'#8dbbc1',[1,.7,1]);
      const ring=mesh(new THREE.TorusGeometry(2.3,.12,6,40),'#e6bd82',0,1.65,0,{metalness:.35,roughness:.4});ring.rotation.x=Math.PI*.36;
      for(const x of [-2.3,2.3]){cyl(x,.95,.7,.3,.4,1.9,'#d9e3d8',10);ball(x,2.0,.7,.45,'#b0b8d2');}
      beam([0,2.5,0],[0,3.5,0],.045,'#e2d2a4');ball(0,3.5,0,.14,'#c77c80');
      for(let j=0;j<6;j++){const a=j/6*Math.PI*2;box(Math.cos(a)*1.72,.95,Math.sin(a)*1.72,.26,.4,.14,'#5c979c');}break;
    }
    case 'windmill': {
      cyl(-.6,1.25,0,.47,.7,2.5,'#dfd6b6',8);roof(-.6,2.75,0,.9,.65,'#8c6250');
      const hub=new THREE.Group();hub.position.set(-.6,2.0,.65);group.add(hub);
      for(let k=0;k<4;k++){const blade=new THREE.Mesh(new THREE.BoxGeometry(.16,1.35,.075),material('#cab793'));blade.position.y=.7;const arm=new THREE.Group();arm.rotation.z=k*Math.PI/2+.4;arm.add(blade);hub.add(arm);}
      ball(-.6,2.0,.72,.15,'#9c8261');house(1.2,0,.65,.9);break;
    }
    case 'restaurant': case 'ship': {
      if(theme.landmark==='ship'){
        /* Germa: linked armored naval platforms carrying a mobile fortress. */
        for(const x of [-1.75,0,1.75]){
          const hull=cyl(x,.62,0,.72,.88,.85,'#526a78',8);hull.scale.set(.82,1,2.05);
          box(x,.96,0,1.16,.17,2.72,'#9aa9ad');
          box(x,.56,1.33,.7,.24,.14,'#b4bdb8');
        }
        box(0,1.1,0,5.0,.28,3.0,'#7b919d');
        box(0,1.25,0,4.45,.14,2.5,'#b9c3bd');
        box(0,2.0,-.1,2.2,1.5,1.45,'#c0c9c4');
        box(0,2.79,-.1,2.35,.18,1.6,'#768d9a');
        box(0,1.72,.64,.44,.85,.06,'#405e70');
        for(const x of [-1.94,1.94])for(const z of [-1.0,1.0]){
          cyl(x,2.13,z,.4,.46,1.8,'#a6b6ba',10);
          cyl(x,3.05,z,.5,.48,.18,'#677f90',10);
          for(let j=0;j<6;j++){
            const a=j/6*Math.PI*2;
            box(x+Math.cos(a)*.39,3.25,z+Math.sin(a)*.39,.19,.28,.19,'#c1cbc4');
          }
          box(x,2.2,z+.42,.13,.42,.035,'#38586a');
        }
        for(const x of [-.75,0,.75]){
          box(x,2.17,.64,.2,.36,.04,'#496b7a');
          box(x,2.99,-.1,.36,.3,1.57,'#b5c2c3');
        }
        for(const z of [-1.28,1.28])box(0,1.56,z,3.3,.24,.12,'#6f8797');
        flag(0,3.64,-.15,'#587e91');
        break;
      }
      const hull=cyl(0,.65,0,.8,1.0,.8,'#775c43',6);hull.scale.set(2.8,1,1.2);
      box(0,1.08,0,4.0,.25,1.65,'#b69d6b');box(0,1.65,0,2.6,1.0,1.3,'#ece1bc');roof(0,2.28,0,1.75,.45,'#6e8970').scale.z=.65;
      for(const x of [-.9,0,.9])box(x,1.66,.66,.28,.38,.025,'#769993');
      cyl(-1.5,2.1,0,.035,.035,2.9,'#ad9468',7);const sail=box(-1.0,2.7,0,1.05,1.0,.035,'#f2e9ca');sail.rotation.y=.25;
      if(theme.landmark==='restaurant'){ball(2.05,1.1,0,.42,'#cbb482',[1.6,.75,.7]);cone(2.35,1.15,0,.25,.65,'#bba774',5).rotation.z=-Math.PI/2;}
      break;
    }
    case 'citrus': {
      for(let j=0;j<7;j++){
        const x=(j%4-1.5)*1.1,z=Math.floor(j/4)*1.25-.8;cyl(x,.55,z,.07,.13,1.1,'#7d6b43',7);ball(x,1.2,z,.65,'#4e8a4e',[1,.85,1]);
        for(let k=0;k<3;k++)ball(x+Math.sin(k*2.1)*.42,1.15+Math.cos(k)*.18,z+.38,.13,'#e4a24c');
      }
      house(1.6,0,1.3,.8,'#decfaa','#a16b50');break;
    }
    case 'execution': {
      box(0,1.55,0,2.9,.18,1.4,'#988569');
      for(const x of [-1.2,1.2])for(const z of [-.5,.5])box(x,.75,z,.13,1.5,.13,'#7d6d54');
      for(const x of [-1.0,1.0])box(x,2.3,-.3,.14,1.5,.14,'#80725c');box(0,3.0,-.3,2.5,.14,.17,'#80725c');
      for(let j=0;j<5;j++)box(-1.7+j*.15,.2+j*.26,1.15-j*.18,.9,.12,.35,'#9f8968');break;
    }
    case 'gates': {
      for(const x of [-1.8,1.8]){cyl(x,1.8,0,.55,.67,3.6,'#d5d9cc',12);cyl(x,3.65,0,.78,.63,.3,'#dddccd',12);flag(x,4.3,0,'#7aabb5');}
      box(0,2.9,0,3.6,.55,.8,'#d4d9cd');arch(0,.0,0,3.1,2.7,'#e6e5d2');
      box(0,1.05,.06,2.2,2.1,.2,'#72909a');for(const x of [-.9,-.45,0,.45,.9])box(x,1.0,.2,.07,2.0,.1,'#c7d4cc');break;
    }
    case 'prison': {
      for(let j=0;j<4;j++)cyl(0,.45+j*.65,0,1.8-j*.22,2.0-j*.22,.72,j%2?'#889092':'#697f83',12);
      box(0,2.9,0,.9,.8,.9,'#9aa59f');for(const x of [-1,1])tower(x*1.5,.3,2.0,'#899b9c');
      for(let j=0;j<12;j++){const a=j/12*Math.PI*2;box(Math.cos(a)*1.85,.7,Math.sin(a)*1.85,.08,.9,.09,'#485b60');}break;
    }
    case 'cake': {
      for(let j=0;j<3;j++){
        const rr=1.8-j*.45,yy=.45+j*.95;cyl(0,yy,0,rr,rr,.9,['#d8b2b1','#dfd1a7','#c4b0c8'][j],20);cyl(0,yy+.48,0,rr*1.02,rr,.15,'#f0e5cf',20);
        for(let k=0;k<10;k++){const a=k/10*Math.PI*2;ball(Math.cos(a)*rr,yy+.4,Math.sin(a)*rr,.15,'#e8d3bc',[1,1.4,1]);}
      }
      for(let j=0;j<3;j++){cyl((j-1)*.35,3.35,0,.045,.045,.55,'#cc7e8b',6);ball((j-1)*.35,3.7,0,.07,'#efbd77');}
      for(const x of [-2.3,2.3]){cyl(x,.8,.5,.07,.07,1.6,'#dfc2ac',6);ball(x,1.75,.5,.5,'#b7abc5',[1,.85,.35]);}break;
    }
    case 'lightning': {
      for(let j=0;j<4;j++){const x=(j-1.5)*1.0,z=Math.sin(j)*.8;cone(x,.65,z,.6,1.3,'#5e6b75',6);ball(x,3.5,z,.85,'#8996a0',[1,.5,1]);const pts=[[x-.2,3.2,z],[x-.55,2.2,z],[x+.05,2.25,z],[x-.15,1.35,z]];for(let k=0;k<pts.length-1;k++)beam(pts[k],pts[k+1],.06,'#e5d68e');}break;
    }
    case 'bridges': {
      for(let j=-2;j<=2;j++)arch(j*1.0,.0,0,.95,1.25,'#bfc4b4');box(0,1.55,0,5.2,.22,.85,'#c8c9b4');
      for(const z of [-.42,.42])box(0,1.85,z,5.2,.15,.12,'#d8d8c3');break;
    }
    default: break;
  }
  group.userData.landmark = theme.landmark || 'none';
  return group;
}
