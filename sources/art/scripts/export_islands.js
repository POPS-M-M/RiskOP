/* Export des données d'îles depuis le jeu (copie de test) → art/data/islands.json
   Usage : node art/scripts/export_islands.js   (nécessite dist/essai_test.html : node tools/build.js essai-test)
   Contient pour chaque île : id, nom, centre carte (x,y), rayon logique, type, région, contour de côte 3D (96 points,
   repère local de l'île : x vers l'est, y vers le sud), angle du ponton, et le contour 2.5D s'il est disponible.
   Ces données sont en LECTURE SEULE : la chaîne Blender s'y adapte, elle ne les modifie jamais. */
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'../..');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']}),p=await b.newPage();
await p.goto('file://'+ROOT+'/dist/essai_test.html');await p.evaluate(()=>{localStorage.clear();localStorage.setItem('gl-tuto','1');localStorage.setItem('rk-w3','0');localStorage.setItem('rk-tob','{"off":1}');});await p.reload();await p.waitForTimeout(1200);
await p.evaluate(()=>{__RK.newGame(2024,'normal',{crews:[0,1,2,3],turn:false,pk:3});__RK.started=true;document.querySelector('#overlay').hidden=true;});
for(let i=0;i<200;i++){const ok=await p.evaluate(()=>[...__RK.R25.cache.values()].filter(e=>e.st==='ready').length>=__RK.terrs.length);if(ok)break;await p.waitForTimeout(500);}
const data=await p.evaluate(()=>{const X=__RK;return {version:1,unites:'unités de carte (1400 × 860)',repere:'x est, y sud, z haut ; origine = centre logique de l\'île',
  iles:X.terrs.map(t=>{const e=X.R25.cache.get(t.id),cu=X.W3CU&&X.W3CU[t.name];return {id:t.id,nom:t.name,x:t.x,y:t.y,rayon:t.rad,type:t.type,region:t.reg,
    cote3d:X.w3Poly(t).map(v=>Math.round(v*1000)/1000),cote25d:e&&e.poly?Array.from(e.poly).map(v=>Math.round(v*1000)/1000):null,ponton:cu&&cu.pier!==undefined?cu.pier:null,
    art25d:X.ISLE_ART[t.name]||null};})};});
fs.writeFileSync(ROOT+'/art/data/islands.json',JSON.stringify(data));console.log('iles',data.iles.length);await b.close();})();
