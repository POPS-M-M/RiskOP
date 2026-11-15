const {chromium}=require('playwright');const {spawn}=require('child_process');
const dir=process.argv[2],pt=8975;(async()=>{const srv=spawn('python3',['-m','http.server',pt,'--bind','127.0.0.1'],{cwd:dir,stdio:'ignore'});await new Promise(r=>setTimeout(r,800));
const b=await chromium.launch(),p=await b.newPage({viewport:{width:1400,height:860},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));const ok=(c,m)=>console.log((c?'OK   ':'ÉCHEC ')+m);
await p.goto(`http://127.0.0.1:${pt}/essai_test.html`);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('gl-tuto','1');localStorage.setItem('rk-tob','{"off":1}');localStorage.setItem('rk-w3','0');});await p.reload();await p.waitForTimeout(1500);
await p.evaluate(()=>{const X=__RK;X.newGame(2024,'normal',{crews:[0,1,2,3],turn:false,pk:3});X.started=true;document.querySelector('#overlay').hidden=true;X.speed=0;});
for(let i=0;i<40;i++){if(await p.evaluate(()=>__RK.R25.allReady&&window.__BLX.loaded>=2))break;await p.waitForTimeout(500);}
for(const k of [1,2,3.5,2,1]){await p.evaluate(k=>{const X=__RK,t=X.terrs.find(q=>q.name==='Zou');X.V.k=k;X.V.x=t.x-1400/k/2;X.V.y=t.y-860/k/2;document.querySelector('#map').dispatchEvent(new WheelEvent('wheel',{deltaY:0.001,clientX:700,clientY:430,bubbles:true}));},k);await p.waitForTimeout(2500);}
const r=await p.evaluate(()=>{const s=__MES.snap();return {img:s.mem.imgIle.Zou,lod:__MES.ev.filter(e=>e.k==='changement de niveau'&&e.ile==='Zou').map(e=>e.info),comp:__MES.ev.filter(e=>e.k==='composition 2.5D'&&e.ile==='Zou').map(e=>e.info+' '+(e.t1-e.t0).toFixed(1)+' ms'),jal:s.jal,jz:s.b3.Zou&&s.b3.Zou.jal,err:s.err,gl:s.mem.gl.ctx.length,r25:s.r25,g:s.fl.gels.slice(-5).map(g=>[Math.round(g.dt),g.cause])};});
const comp=r.img['blender_compose|alloué']||0;ok(comp>=1045*1658*4,'canevas composés de Zou : '+comp+' o (l3 seul = '+(1045*1658*4)+' ; l2 = '+(523*829*4)+' : le canevas moyen a pu être libéré par le cache d\'origine)');
ok(r.lod.length>=4,'changements de niveau 2.5D de Zou : '+r.lod.join(' ; '));console.log('     compositions Zou :',r.comp.join(' | '));
ok(r.jal.r25>0,'jalon « toutes les îles 2.5D prêtes » : '+r.jal.r25+' ms');console.log('     jalons Zou :',JSON.stringify(r.jz));
ok(r.err.n===0,'erreurs internes du moniteur : '+r.err.n+' '+r.err.msg);ok(r.gl===0,'aucun contexte WebGL en 2.5D pur ('+r.gl+')');
console.log('     2.5D génération : construites',r.r25.construites,'depuis cache',r.r25.depuisDB,'tranche max',r.r25.maxTranche.toFixed(1),'ms · gels récents',JSON.stringify(r.g));
ok(errs.length===0,'erreurs de page : '+errs.length);await b.close();srv.kill();})();
