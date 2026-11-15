// Partie simulée identique (graine fixe, Math.random déterministe) sur deux builds ; compare l'état à chaque 8 tours. Lecture seule.
const {chromium}=require('playwright');const crypto=require('crypto');const H=s=>crypto.createHash('sha1').update(s).digest('hex').slice(0,12);
async function run(file){const b=await chromium.launch(),p=await b.newPage({viewport:{width:1000,height:640}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto('file://'+file);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('gl-tuto','1');});
 const r=await p.evaluate(()=>{const X=__RK;let s=777;Math.random=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
  X.newGame(777,'normal',{turn:true,pk:3});X.started=true;const out=[];
  const st=()=>JSON.stringify({t:X.terrs.map(t=>[t.id,t.owner,Math.round(t.x*1e3),Math.round(t.y*1e3),Math.round(t.rad*1e3)]),a:X.armies.map(a=>[a.owner,Math.round((a.x||0)*100),Math.round((a.y||0)*100),a.n||a.size||0]),p:X.players.map(p=>[Math.round(p.gold),p.alive===false?0:1])});
  for(let turn=1;turn<=40;turn++){X.TM.ready=[true,true,true,true];X.startRes();for(let i=0;i<400;i++){X.step(.05);if(X.TM.phase==='plan')break;}
   if(turn%8===0)out.push([turn,st()]);}
  const nz=(k,v)=>(typeof v==='number'&&v>1e12)?0:v;const sv=JSON.stringify(X.svBuild(),nz);
  X.svRestore(JSON.parse(sv));const sv2=JSON.stringify(X.svBuild(),nz);
  return {out,svLen:sv.length,sv,rt:sv===sv2,narm:X.armies.length};});
 await b.close();return {...r,errs};}
(async()=>{const A=await run(process.argv[2]),B=await run(process.argv[3]);require('fs').writeFileSync(__dirname+'/svA.json',A.sv);require('fs').writeFileSync(__dirname+'/svB.json',B.sv);
 console.log('relevés état (tous les 8 tours) :');A.out.forEach((o,i)=>console.log(' tour',o[0],o[1]===B.out[i][1]?'IDENTIQUE':'DIFFÉRENT',H(o[1]),H(B.out[i][1])));
 console.log('sauvegarde finale (hors date)',A.sv===B.sv?'IDENTIQUE':'DIFFÉRENTE',H(A.sv),H(B.sv),A.svLen+' car.');
 console.log('aller-retour sauvegarde→restauration : public',A.rt,'| test',B.rt,'| armées en fin de partie',A.narm,B.narm);
 console.log('erreurs de page : public',A.errs.length,'| test',B.errs.length,A.errs.slice(0,2),B.errs.slice(0,2));})();
