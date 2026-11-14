const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1400,height:860}});
const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' @ '+(e.stack||'').split('\n').slice(1,4).join(' | ')));
await p.goto('file://'+__dirname+'/../dist/risk_test.html');await p.evaluate(()=>localStorage.clear());await p.reload();await p.waitForTimeout(800);
console.log('case "guide" cochée par défaut:',await p.evaluate(()=>document.querySelector('#o-tuto').checked));
await p.click('#o-go');await p.waitForTimeout(600);
const st=()=>p.evaluate(()=>({i:__RK.TU.i,ph:__RK.TU.ph,on:__RK.TU.on,turn:__RK.TM.n,phase:__RK.TM.phase,title:(document.querySelector('#coach b')||{}).textContent,hid:document.querySelector('#coach').hidden,cap:__RK.TC.cap,tgt:__RK.TC.tgt}));
const pt=id=>p.evaluate(id=>{const t=__RK.terrs[id],c=document.querySelector('#map').getBoundingClientRect();return {x:c.left+t.x/1400*c.width,y:c.top+t.y/860*c.height};},id);
const log=[];let lastKey='',shots=0;const t0=Date.now();
const ids=['goal','cap','rec','send','end','conq','eco','def','chars','win'];
while(Date.now()-t0<70000){
  const s=await st();
  if(!s.on)break;
  const key=s.i+':'+s.ph;
  if(key!==lastKey){lastKey=key;{const L=(Date.now()-t0)+'ms étape '+(s.i+1)+'/10 '+s.ph+' « '+s.title+' » tour '+s.turn+' '+s.phase;log.push(L);console.log(L);}
    if(s.ph==='do'&&[1,3,5,7].includes(s.i)){await p.screenshot({path:'tuto_'+(s.i+1)+'.png'});}}
  if(false)console.log('  dbg',JSON.stringify(await p.evaluate(()=>({i:__RK.TU.i,ph:__RK.TU.ph,phase:__RK.TM.phase,res:+__RK.TM.res.toFixed(1),sel:__RK.ui.sel,q:__RK.TM.queue.length,speed:__RK.speed,t:Math.round(__RK.time)}))));
  const id=ids[s.i];
  if(s.ph==='ok'){await p.waitForTimeout(250);await p.click('#coach [data-tu="next"]');continue;}
  if(s.ph==='do'){
    if(id==='goal')await p.click('#coach [data-tu="cont"]');
    else if(id==='cap'){const q=await pt(s.cap);await p.mouse.click(q.x,q.y);}
    else if(id==='rec')await p.click('#side [data-act="recruit"][data-v="guerrier"]');
    else if(id==='send'){let q=await pt(s.cap);await p.mouse.click(q.x,q.y);q=await pt(s.tgt);await p.mouse.click(q.x,q.y);}
    else if(id==='end')await p.click('#b-end');
    else if(id==='conq'){if(s.phase==='plan')await p.click('#b-end');}
    else if(id==='eco')await p.click('#side [data-act="tab"][data-v="eco"]');
    else if(id==='def'){if(s.phase==='res'){await p.waitForTimeout(800);continue;}const a=await pt(s.cap),c=await pt(s.tgt);await p.mouse.move(a.x,a.y);await p.mouse.down();for(let k=1;k<=8;k++)await p.mouse.move(a.x+(c.x-a.x)*k/8,a.y+(c.y-a.y)*k/8);await p.mouse.up();}
    else if(id==='chars')await p.click('#side [data-act="tab"][data-v="leg"]');
    else if(id==='win')await p.click('#coach [data-tu="cont2"]');
  }
  await p.waitForTimeout(350);
}
console.log(log.join('\n'));
const end=await p.evaluate(()=>({on:__RK.TU.on,fin:__RK.TU.fin,freeze:__RK.TU.freeze,owner:__RK.terrs[__RK.TC.tgt].owner,ls:localStorage.getItem('gl-tuto'),coachHidden:document.querySelector('#coach').hidden}));
console.log('fin:',JSON.stringify(end));console.log(errs.join('\n')||'aucune erreur JS');await b.close()})();
