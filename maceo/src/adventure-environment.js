import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export const ADVENTURE_LIGHTING=Object.freeze({exposure:.85,sun:1.1,hemisphere:.45,rim:.15,bloomThreshold:1.05,bloomRadius:.06});
const PRESETS={
  cinema:{shadow:2048,ao:true,bloom:.1,segments:96},
  standard:{shadow:1024,ao:false,bloom:.08,segments:64},
  eco:{shadow:512,ao:false,bloom:0,segments:32}
};
const MOODS={
  daylight:{deep:'#075287',shallow:'#35b2bf',sky:'#51aee0',zenith:'#1676c7',sun:'#fff0ce',elevation:36,sunIntensity:1.1,hemi:.45,wave:1,cloud:1},
  desert:{deep:'#075984',shallow:'#43bdbe',sky:'#62b5df',zenith:'#2686d1',sun:'#ffedc2',elevation:29,sunIntensity:1.12,hemi:.43,wave:.8,cloud:.5},
  snow:{deep:'#105c8e',shallow:'#59b8ca',sky:'#69b9e4',zenith:'#338bd1',sun:'#f6f6e6',elevation:31,sunIntensity:1.02,hemi:.48,wave:.75,cloud:.8},
  haunted:{deep:'#133e68',shallow:'#417f9c',sky:'#527cb2',zenith:'#283b77',sun:'#d9daef',elevation:16,sunIntensity:.78,hemi:.4,wave:.7,cloud:.85},
  candy:{deep:'#155b88',shallow:'#55b8c8',sky:'#6cace0',zenith:'#467fc4',sun:'#ffe8d8',elevation:25,sunIntensity:1.06,hemi:.45,wave:.65,cloud:.85},
  sky:{deep:'#4896bd',shallow:'#a4d4d9',sky:'#78bce5',zenith:'#438fd3',sun:'#fff4d9',elevation:38,sunIntensity:1.04,hemi:.48,wave:.18,cloud:1.15},
  undersea:{deep:'#074974',shallow:'#2fa3b8',sky:'#439bc8',zenith:'#1466a4',sun:'#cceff0',elevation:43,sunIntensity:.92,hemi:.43,wave:.35,cloud:.35}
};
const getMood=theme=>MOODS[theme?.biome]||MOODS.daylight;

/** A clear, blue sky without atmospheric scattering that whitens the horizon. */
export function createSkyMaterial(theme={}){
  const mood=getMood(theme);
  return new THREE.ShaderMaterial({
    name:'AdventureClearSky',side:THREE.BackSide,depthWrite:false,fog:false,toneMapped:true,
    uniforms:{uHorizon:{value:new THREE.Color(mood.sky)},uZenith:{value:new THREE.Color(mood.zenith)},uSunColor:{value:new THREE.Color(mood.sun)},uSunDirection:{value:new THREE.Vector3(-.52,.67,.53)},uSunStrength:{value:2.5}},
    vertexShader:`
      varying vec3 vDirection;
      void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`
      uniform vec3 uHorizon;uniform vec3 uZenith;uniform vec3 uSunColor;uniform vec3 uSunDirection;uniform float uSunStrength;
      varying vec3 vDirection;
      void main(){
        vec3 direction=normalize(vDirection);float altitude=clamp(direction.y,0.,1.);
        vec3 color=mix(uHorizon,uZenith,pow(altitude,.42));
        float sunDisc=smoothstep(.99989,.99997,dot(direction,normalize(uSunDirection)));
        color+=uSunColor*sunDisc*uSunStrength;
        gl_FragColor=vec4(color,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
}

/** Fully procedural water; near-coast color is independent of camera distance. */
export function createOceanMaterial(theme={}){
  const mood=getMood(theme);
  return new THREE.ShaderMaterial({
    name:'AdventureOcean',toneMapped:true,fog:false,
    uniforms:{uTime:{value:0},uDeep:{value:new THREE.Color(mood.deep)},uShallow:{value:new THREE.Color(mood.shallow)},uSky:{value:new THREE.Color(mood.sky)},uSunColor:{value:new THREE.Color(mood.sun)},uSunDirection:{value:new THREE.Vector3(-.52,.67,.53)},uWave:{value:mood.wave},uCoasts:{value:Array.from({length:64},(_,i)=>new THREE.Vector3(0,0,i?0:7))},uCoastCount:{value:1},uRedLine:{value:0}},
    vertexShader:`
      uniform float uTime;uniform float uWave;
      varying vec3 vWorld;varying vec3 vNormal;
      float waveHeight(vec2 p){
        float fade=1.-smoothstep(135.,170.,length(p));
        return fade*uWave*(sin(p.x*.75+p.y*.42+uTime*.72)*.035+sin(p.x*1.24-p.y*.82-uTime*.54)*.022+sin(p.x*2.5+p.y*1.8+uTime*.88)*.012);
      }
      void main(){
        vec3 p=position;p.z+=waveHeight(p.xy);
        float e=.055;float dx=(waveHeight(p.xy+vec2(e,0.))-waveHeight(p.xy-vec2(e,0.)))/(2.*e);float dz=(waveHeight(p.xy+vec2(0.,e))-waveHeight(p.xy-vec2(0.,e)))/(2.*e);
        vec3 localNormal=normalize(vec3(-dx,-dz,1.));
        vec4 world=modelMatrix*vec4(p,1.);vWorld=world.xyz;vNormal=normalize(mat3(modelMatrix)*localNormal);
        gl_Position=projectionMatrix*viewMatrix*world;
      }`,
    fragmentShader:`
      uniform vec3 uCoasts[64];uniform int uCoastCount;uniform float uRedLine;uniform float uTime;uniform float uWave;uniform vec3 uDeep;uniform vec3 uShallow;uniform vec3 uSky;uniform vec3 uSunColor;uniform vec3 uSunDirection;
      varying vec3 vWorld;varying vec3 vNormal;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
      void main(){
        vec2 p=vWorld.xz;float time=uTime;
        float localWave=uWave*(1.-smoothstep(135.,170.,length(p)));
        vec3 N=normalize(vNormal+vec3(sin(p.x*4.5+p.y*3.2+time*.85)*.035*localWave,0.,cos(p.x*3.4-p.y*4.2-time*.7)*.035*localWave));
        vec3 V=normalize(cameraPosition-vWorld);float fresnel=pow(1.-max(dot(N,V),0.),4.2);
        float coastDistance=1000.;
        for(int i=0;i<64;i++){
          if(i>=uCoastCount)break;
          vec2 delta=p-uCoasts[i].xy;float bound=max(abs(delta.x),abs(delta.y))-uCoasts[i].z;
          if(bound<coastDistance&&bound<5.0)coastDistance=min(coastDistance,length(delta)-uCoasts[i].z);
        }
        if(uRedLine>.5){vec2 lineEdge=abs(p)-vec2(.6,15.5);float lineDistance=length(max(lineEdge,vec2(0.)))+min(max(lineEdge.x,lineEdge.y),0.);coastDistance=min(coastDistance,lineDistance);}
        float depthBlend=smoothstep(-.15,4.0,coastDistance);float waterVariation=noise(p*.38+vec2(time*.012,0.));
        vec3 color=mix(uShallow,uDeep,depthBlend*.9+.1);color*=.94+.08*waterVariation;
        vec3 reflected=mix(uSky*.35,uSky*.67,clamp(reflect(-V,N).y,0.,1.));
        color=mix(color,reflected,.07+.18*fresnel);
        vec3 H=normalize(V+normalize(uSunDirection));float sparkle=pow(max(dot(N,H),0.),460.);
        color+=uSunColor*sparkle*(1.35+.75*fresnel);
        float smallCrests=smoothstep(.76,.94,noise(p*3.6+vec2(time*.08,-time*.04)))*smoothstep(.25,.55,noise(p*.7+time*.035));
        color=mix(color,vec3(.7,.88,.88),smallCrests*.035*localWave);
        float foamBand=(1.-smoothstep(.04,.38,abs(coastDistance+sin(time*1.3+noise(p*2.0)*5.0)*.07)))*(.5+.5*noise(p*9.0+time*.15));
        color=mix(color,vec3(.76,.9,.89),foamBand*.58);
        gl_FragColor=vec4(color,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
}

function cloudTexture(){
  const size=96,data=new Uint8Array(size*size*4);
  const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
  const noise=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y);let fx=x-ix,fy=y-iy;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(ix,iy),hash(ix+1,iy),fx),THREE.MathUtils.lerp(hash(ix,iy+1),hash(ix+1,iy+1),fx),fy);};
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/(size-1),v=y/(size-1),r=(u-.5)**2*4+(v-.5)**2*4;
    const n=noise(u*7,v*7)*.55+noise(u*15,v*15)*.3+noise(u*30,v*30)*.15;
    const alpha=Math.max(0,(1-r)*1.3)*THREE.MathUtils.smoothstep(n,.3,.76),k=(y*size+x)*4;
    data[k]=data[k+1]=data[k+2]=255;data[k+3]=Math.min(255,alpha*230);
  }
  const tex=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);tex.colorSpace=THREE.SRGBColorSpace;tex.minFilter=THREE.LinearFilter;tex.magFilter=THREE.LinearFilter;tex.needsUpdate=true;return tex;
}

/** Owns its environment resources; the caller retains scene models and camera controls. */
export function createAdventureEnvironment({renderer,scene,camera,theme={},quality='cinema'}){
  const previous={background:scene.background,environment:scene.environment,environmentIntensity:scene.environmentIntensity,fog:scene.fog,cameraFar:camera.far};
  const root=new THREE.Group();root.name='Adventure atmosphere';scene.add(root);
  const sky=new THREE.Mesh(new THREE.SphereGeometry(9000,32,16),createSkyMaterial(theme));sky.name='Ciel bleu sans voile';sky.frustumCulled=false;sky.renderOrder=-10;root.add(sky);
  const oceanMaterial=createOceanMaterial(theme);
  const ocean=new THREE.Mesh(new THREE.RingGeometry(0,180,192,96),oceanMaterial);ocean.name='Océan côtier';ocean.rotation.x=-Math.PI/2;ocean.position.y=-1.24;ocean.frustumCulled=false;root.add(ocean);
  // Matching circular boundaries avoid overlapping water surfaces and their depth flicker.
  // The outer ring extends to the visual horizon without spending vertices on distant waves.
  const horizonMaterial=createOceanMaterial(theme);horizonMaterial.uniforms.uWave.value=0;horizonMaterial.uniforms.uCoastCount.value=0;
  const horizon=new THREE.Mesh(new THREE.RingGeometry(180,14000,192,1),horizonMaterial);horizon.name='Océan jusqu’à l’horizon';horizon.rotation.x=-Math.PI/2;horizon.position.y=ocean.position.y;horizon.frustumCulled=false;root.add(horizon);
  const hemisphere=new THREE.HemisphereLight('#a8d2eb','#626a4d',ADVENTURE_LIGHTING.hemisphere);root.add(hemisphere);
  const sun=new THREE.DirectionalLight('#fff0ce',ADVENTURE_LIGHTING.sun);sun.position.set(-18,27,21);sun.castShadow=true;
  sun.shadow.camera.left=-12;sun.shadow.camera.right=12;sun.shadow.camera.top=16;sun.shadow.camera.bottom=-12;sun.shadow.camera.near=1;sun.shadow.camera.far=90;sun.shadow.bias=-.00025;sun.shadow.normalBias=.035;sun.shadow.radius=3;root.add(sun);root.add(sun.target);sun.target.position.set(0,1,0);
  const rim=new THREE.DirectionalLight('#a4cde7',ADVENTURE_LIGHTING.rim);rim.position.set(10,11,-16);root.add(rim);
  const cloudMap=cloudTexture(),clouds=[];
  for(let i=0;i<9;i++){
    const material=new THREE.SpriteMaterial({map:cloudMap,color:'#dce7eb',transparent:true,opacity:.25,depthWrite:false,toneMapped:true,fog:false});
    const cloud=new THREE.Sprite(material);cloud.position.set(-70+i*19,22+(i%3)*7,-40-(i%4)*24);cloud.scale.set(27+(i%3)*9,7+(i%2)*3,1);cloud.userData.baseX=cloud.position.x;clouds.push(cloud);root.add(cloud);
  }
  const volumeClouds=[];
  const puffGeometry=new THREE.SphereGeometry(1,12,8);
  const puffMaterial=new THREE.MeshStandardMaterial({color:'#d8e8ed',roughness:1,emissiveIntensity:0,transparent:true,opacity:.12,depthWrite:false,fog:false});
  for(let j=0;j<5;j++){
    const cluster=new THREE.Group();cluster.position.set(-28+j*14,15+(j%2)*5,-18-j*5);cluster.userData.baseX=cluster.position.x;
    for(let k=0;k<5;k++){const puff=new THREE.Mesh(puffGeometry,puffMaterial);puff.position.set((k-2)*1.8,Math.sin(k)*.5,Math.cos(k)*.6);puff.scale.set(2.4,1.0+(k%2)*.4,1.5);cluster.add(puff);}
    root.add(cluster);volumeClouds.push(cluster);
  }
  scene.fog=null;scene.background=null;scene.environmentIntensity=.55;
  camera.far=Math.max(camera.far,18000);camera.updateProjectionMatrix();
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=ADVENTURE_LIGHTING.exposure;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  let composer=null,passes=[],width=1,height=1,level='',disposed=false,environmentTarget=null,environmentMood='',currentTheme=theme;
  const pmrem=new THREE.PMREMGenerator(renderer);
  const clearComposer=()=>{for(const pass of passes)pass.dispose?.();passes=[];composer?.dispose();composer=null;};
  const resize=(w,h)=>{width=Math.max(1,Math.floor(w));height=Math.max(1,Math.floor(h));if(composer){composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(width,height);}};
  const setQuality=value=>{
    const next=PRESETS[value]?value:'standard';if(next===level)return;level=next;const preset=PRESETS[level];
    clearComposer();
    ocean.geometry.dispose();ocean.geometry=new THREE.RingGeometry(0,180,192,preset.segments);
    sun.shadow.map?.dispose();sun.shadow.map=null;sun.shadow.mapSize.set(preset.shadow,preset.shadow);sun.shadow.needsUpdate=true;renderer.shadowMap.needsUpdate=true;
    if(level!=='eco'){
      composer=new EffectComposer(renderer);const renderPass=new RenderPass(scene,camera);composer.addPass(renderPass);passes.push(renderPass);
      if(preset.ao){const ao=new SSAOPass(scene,camera,width,height,12);ao.kernelRadius=7;ao.minDistance=.004;ao.maxDistance=.12;composer.addPass(ao);passes.push(ao);}
      const bloom=new UnrealBloomPass(new THREE.Vector2(width,height),preset.bloom,ADVENTURE_LIGHTING.bloomRadius,ADVENTURE_LIGHTING.bloomThreshold);composer.addPass(bloom);passes.push(bloom);
      const output=new OutputPass();composer.addPass(output);passes.push(output);resize(width,height);
    }
  };
  const setTheme=value=>{
    currentTheme=value||{};const mood=getMood(currentTheme),uniforms=sky.material.uniforms;
    const elevation=THREE.MathUtils.degToRad(90-mood.elevation),azimuth=THREE.MathUtils.degToRad(-42),direction=new THREE.Vector3().setFromSphericalCoords(1,elevation,azimuth);
    uniforms.uHorizon.value.set(mood.sky);uniforms.uZenith.value.set(mood.zenith);uniforms.uSunColor.value.set(mood.sun);uniforms.uSunDirection.value.copy(direction);
    sun.position.copy(direction).multiplyScalar(42);sun.color.set(mood.sun);sun.intensity=mood.sunIntensity;hemisphere.intensity=mood.hemi;hemisphere.color.set('#b6d8ec');hemisphere.groundColor.set(currentTheme.biome==='snow'?'#879eaa':'#626a4d');
    scene.fog=null;
    for(const material of [oceanMaterial,horizonMaterial]){
      material.uniforms.uDeep.value.set(mood.deep);material.uniforms.uShallow.value.set(mood.shallow);material.uniforms.uSky.value.set(mood.sky);material.uniforms.uSunColor.value.set(mood.sun);material.uniforms.uSunDirection.value.copy(direction);
    }
    oceanMaterial.uniforms.uWave.value=mood.wave;
    clouds.forEach((cloud,i)=>{cloud.material.color.set(currentTheme.biome==='haunted'?'#8197ba':'#dce7eb');cloud.material.opacity=(.19+i%3*.025)*mood.cloud;});
    const key=currentTheme.biome||'daylight';
    if(key!==environmentMood){
      environmentMood=key;
      const envScene=new THREE.Scene(),clone=sky.clone();clone.position.set(0,0,0);clone.material=sky.material.clone();clone.material.uniforms.uSunStrength.value=0;envScene.add(clone);
      try{const next=pmrem.fromScene(envScene,.04,.1,18000);environmentTarget?.dispose();environmentTarget=next;scene.environment=next.texture;}catch(error){scene.environment=previous.environment;}
      clone.material.dispose();envScene.remove(clone);
    }
  };
  const update=time=>{
    if(disposed)return;const t=Number.isFinite(time)?time:0;
    oceanMaterial.uniforms.uTime.value=t;horizonMaterial.uniforms.uTime.value=t;horizon.position.y=ocean.position.y;sky.position.copy(camera.position);
    clouds.forEach((cloud,i)=>{cloud.position.x=cloud.userData.baseX+Math.sin(t*.012+i)*8;});volumeClouds.forEach((cloud,i)=>{cloud.position.x=cloud.userData.baseX+Math.sin(t*.007+i)*12;});
  };
  const render=()=>{if(disposed)return;if(composer)composer.render();else renderer.render(scene,camera);};
  const dispose=()=>{
    if(disposed)return;disposed=true;clearComposer();root.removeFromParent();
    const geometries=new Set(),materials=new Set();root.traverse(object=>{if(object.geometry)geometries.add(object.geometry);if(object.material)(Array.isArray(object.material)?object.material:[object.material]).forEach(material=>materials.add(material));});geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose());cloudMap.dispose();sun.shadow.map?.dispose();environmentTarget?.dispose();pmrem.dispose();
    if(scene.fog===null)scene.fog=previous.fog;if(!scene.background)scene.background=previous.background;if(scene.environment===environmentTarget?.texture)scene.environment=previous.environment;scene.environmentIntensity=previous.environmentIntensity;camera.far=previous.cameraFar;camera.updateProjectionMatrix();
  };
  setTheme(theme);setQuality(quality);update(0);
  const size=new THREE.Vector2();renderer.getSize(size);resize(size.x,size.y);
  return {update,setTheme,setQuality,resize,render,dispose,sunlight:sun,ocean,sky,get quality(){return level;},get theme(){return currentTheme;}};
}
