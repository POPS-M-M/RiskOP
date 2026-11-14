const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+__dirname+'/../dist/risk_test.html');await p.waitForTimeout(800);
const r=await p.evaluate(()=>{const X=__RK;X.newGame(4321,'normal',{turn:true,pk:3});X.started=true;
  const seen=new Set(),mid=[],perTurn=[];let launches=0;
  for(let turn=1;turn<=40;turn++){
    X.TM.ready=[true,true,true,true];X.startRes();
    const atStart={};for(const a of X.armies)if(!seen.has(a.id)){seen.add(a.id);if(a.owner>0){atStart[a.owner]=(atStart[a.owner]||0)+1;launches++;}}
    perTurn.push(atStart);
    for(let i=0;i<400;i++){X.step(.05);for(const a of X.armies)if(!seen.has(a.id)){seen.add(a.id);if(a.owner>0&&!a.rt)mid.push({turn,owner:a.owner,res:+X.TM.res.toFixed(1)});}if(X.TM.phase==='plan')break;}
  }
  return {launches,mid:mid.slice(0,8),nmid:mid.length,ai:X.players.slice(1).map(q=>X.terrs.filter(t=>t.owner===q.id).length)};});
console.log(JSON.stringify(r));console.log(errs.join('\n')||'aucune erreur JS');await b.close()})();
