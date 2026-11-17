import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import * as THREE from 'three';
import path from 'node:path';
import {loadBlenderDiorama,loadBlenderRegistry} from '../src/blender-islands.js';
import {findBlenderBattlefield,battleFormationPosition,separateBattleUnits,cinematicTimeline,battleCastCounts,cinematicOutcome,playAttackCinematic} from '../src/attack-cinematic.js';
const base=path.resolve(process.argv[2]||'../local-preview/maceo/iles')+'/';globalThis.GL_BLENDER_ASSET_BASE=pathToFileURL(base).href;
const nativeFetch=globalThis.fetch;globalThis.fetch=async input=>{try{return new Response(await fs.readFile(new URL(input)),{status:200});}catch(e){if(e.code==='ENOENT')return new Response('',{status:404});throw e;}};
const registry=await loadBlenderRegistry(),results=[];let checked=0;
for(const name of registry.names){
 const asset=await loadBlenderDiorama({name,city:{lvl:4}},{unitScale:.35,lod:'lod0'}),t0=performance.now(),arena=findBlenderBattlefield(asset);const elapsed=performance.now()-t0;
 if(arena){
  for(let q=0;q<=1.001;q+=.05){const actors=[];for(const side of [-1,1])for(let i=0;i<20;i++){const actor=new THREE.Group();actor.position.copy(battleFormationPosition(i,side,q,arena));actors.push(actor);}separateBattleUnits(actors,arena,asset.groundHeight);
   for(let i=0;i<actors.length;i++){const p=actors[i].position,g=asset.groundHeight(p.x,p.z),o=asset.obstacleHeight(p.x,p.z);assert.ok(g>0,`${name} water`);assert.ok(o-g<=.13*arena.scale,`${name} obstacle ${o-g}`);assert.equal(p.y,g);for(let j=i+1;j<actors.length;j++)assert.ok(p.distanceTo(actors[j].position)>=.455*arena.scale,`${name} overlap`);checked++;}
  }
 }
 results.push({name,source:arena?'blender':'procedural-fallback',scale:arena?.scale,center:arena?.center,rows:arena?.rows,yaw:arena?.yaw,groundRange:arena?.groundRange,searchMs:Math.round(elapsed)});asset.dispose();
}
for(const [t,p]of [[0,'sea'],[3.2,'approach'],[4.4,'charge'],[6.4,'battle'],[9.7,'capture'],[11.8,'return'],[12.5,'done']])assert.equal(cinematicTimeline(t).phase,p);
assert.equal(battleCastCounts({attacker:{troopsBefore:70,troopsAfter:0}}).attackers.before,20);assert.equal(cinematicOutcome({attacker:{id:0},defender:{id:-1},winner:0,captured:true}).captured,true);
let count=0;const noDoc=playAttackCinematic({onFinish:()=>count++});await Promise.resolve();assert.equal(count,1);noDoc.skip();await Promise.resolve();assert.equal(count,1);
let resolveDownload,appends=0,removals=0;const nodes=new Map();const node=()=>({textContent:'',style:{},isConnected:false,addEventListener(){},setAttribute(){},focus(){}});let dialog;
globalThis.document={activeElement:null,getElementById:()=>({}),body:{appendChild(){appends++;}},createElement(tag){assert.equal(tag,'dialog');dialog={...node(),open:false,showModal(){this.open=true;},close(){this.open=false;},remove(){removals++;},querySelector(sel){if(!nodes.has(sel))nodes.set(sel,node());return nodes.get(sel);},prepend(){throw new Error('A cancelled scene must not attach a renderer');}};return dialog;}};
globalThis.window={removeEventListener(){}};globalThis.GL_BLENDER_ASSET_BASE='https://maceo-delayed.test/iles/';globalThis.fetch=()=>new Promise(resolve=>resolveDownload=resolve);
let finishes=[];const pending=playAttackCinematic({onFinish:x=>finishes.push(x.reason)});assert.ok(dialog.open);assert.equal(finishes.length,0);pending.skip();await Promise.resolve();assert.deepEqual(finishes,['skipped']);assert.equal(removals,1);
await Promise.resolve();resolveDownload?.(new Response(JSON.stringify({format:2,iles:{}}),{status:200}));await new Promise(resolve=>setTimeout(resolve,20));pending.dispose();await Promise.resolve();assert.deepEqual(finishes,['skipped']);assert.equal(appends,1);assert.equal(removals,1);
delete globalThis.document;delete globalThis.window;globalThis.fetch=nativeFetch;
console.log(JSON.stringify({results,unitSamples:checked,asyncSkip:'PASS',timeline:'unchanged',outcome:'unchanged'},null,2));
