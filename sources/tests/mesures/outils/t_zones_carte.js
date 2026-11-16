/* Zones de clic : compare, île par île, les cases de la grille de la carte 1 (ancienne) et de la carte 2 (canonique), à translation près.
   Usage : node tests/mesures/outils/t_zones_carte.js $PWD/dist/essai_test.html */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(800);
const r=await p.evaluate(()=>{
  const X=__RK,cells=v=>{X.mapUse(v);const M=X.generateMap(7),o={};M.T.forEach(t=>{o[t.name]={x:t.x,y:t.y,c:new Set(M.tc[t.id])};});return o;};
  const a=cells(1),b=cells(2);X.mapUse(2);const out=[];
  for(const n in b){if(!a[n])continue;const A=a[n],B=b[n];const dx=(B.x-A.x)/2,dy=(B.y-A.y)/2,sh=dy*700+dx;let miss=0;for(const i of A.c)if(!B.c.has(i+sh))miss++;let extra=B.c.size-(A.c.size-miss);
    if(miss||extra)out.push(n+' : '+miss+' cases perdues, '+extra+' gagnées (sur '+A.c.size+')');}
  return out;});
console.log(r.join('\n')||'zones de clic identiques');console.log('erreurs',errs.length,errs.slice(0,3));await b.close();})();
