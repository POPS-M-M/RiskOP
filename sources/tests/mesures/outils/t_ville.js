/* Écran « Ville » de chaque île (src/essai/87-ville.js) : bouton Ville, six lieux visibles, clic → partie du Livre de bord par-dessus la ville,
   Échap : Livre puis ville, bouton Diplomatie → ville + Diplomatie, lieux posés sur des bâtiments (« bât ») sur Water 7, Alabasta, Shells Town, Loguetown.
   node t_ville.js <dossier servi (essai_test.html + iles/)> — lire la sortie : attendus livre:true/ville:true après clic, ville:false après le second Échap. */
const {chromium}=require('playwright');const {spawn}=require('child_process');
const base=async function(file,fn){const port=8500+Math.floor(Math.random()*90);const srv=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:process.argv[2],stdio:'ignore'});await new Promise(r=>setTimeout(r,800));
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1400,height:860}});const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join('|')));p.on('console',m=>{if(/warn|error/.test(m.type())&&!/ERR_TUNNEL|GL Driver|Failed to load/.test(m.text()))errs.push(m.text().slice(0,300));});
await p.goto(`http://127.0.0.1:${port}/${file||'essai_test.html'}`);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('gl-tuto','1');localStorage.setItem('rk-tob','{"off":1}');});await p.reload();await p.waitForTimeout(1500);
await p.click('#o-go');await p.waitForTimeout(800);await p.evaluate(()=>document.querySelectorAll('.tu-card,.tob').forEach(e=>e.remove()));
try{await fn(p,errs);}catch(e){console.log('ECHEC',e.message);}console.log('ERREURS',JSON.stringify(errs.slice(0,8)));await b.close();srv.kill();};

base('essai_test.html',async(p,errs)=>{await p.waitForTimeout(2500);
  const nav=await p.evaluate(()=>[...document.querySelectorAll('#op-livre-nav button')].map(b=>b.textContent.trim()));console.log('nav',nav);
  await p.click('#op-livre-nav [data-vilgo]',{timeout:30000});
  for(let i=0;i<40;i++){const v=await p.evaluate(()=>__VIL.pins().filter(q=>q.vis).length);if(v>=6)break;await p.waitForTimeout(500);}
  await p.waitForTimeout(2500);
  console.log('ville',await p.evaluate(()=>({on:__VIL.on,t:__VIL.t,nom:__RK.terrs[__VIL.t].name,pins:__VIL.pins()})).then(JSON.stringify));
  
  const pin=await p.evaluate(()=>__VIL.pins().find(q=>q.id==='taverne'));await p.mouse.move(pin.x,pin.y);await p.waitForTimeout(800);
  await p.mouse.click(pin.x,pin.y);await p.waitForTimeout(1500);console.log('après clic taverne',await p.evaluate(()=>JSON.stringify({livre:__OPL.open,tab:__OPL.tab,ville:__VIL.on})));
  await p.keyboard.press('Escape');await p.waitForTimeout(800);console.log('Échap 1',await p.evaluate(()=>JSON.stringify({livre:__OPL.open,ville:__VIL.on})));
  const b=await p.evaluate(()=>__VIL.pins().find(q=>q.id==='banque'));await p.mouse.click(b.x,b.y);await p.waitForTimeout(1200);console.log('banque',await p.evaluate(()=>JSON.stringify({livre:__OPL.open,tab:__OPL.tab})));
  await p.keyboard.press('Escape');await p.waitForTimeout(500);await p.keyboard.press('Escape');await p.waitForTimeout(800);console.log('Échap 2',await p.evaluate(()=>JSON.stringify({livre:__OPL.open,ville:__VIL.on})));
  await p.click('#op-livre-nav [data-opl="dip"]',{timeout:30000});await p.waitForTimeout(1500);console.log('bouton Diplomatie',await p.evaluate(()=>JSON.stringify({livre:__OPL.open,tab:__OPL.tab,ville:__VIL.on})));
  await p.keyboard.press('Escape');await p.waitForTimeout(500);await p.keyboard.press('Escape');await p.waitForTimeout(500);
  for(const nm of ['Water 7','Alabasta','Shells Town','Loguetown']){await p.evaluate(nm=>{const t=__RK.terrs.find(q=>q.name===nm);t.owner=0;__VIL.open(t.id);},nm);
    for(let i=0;i<40;i++){const v=await p.evaluate(()=>__VIL.pins().filter(q=>q.vis).length);if(v>=6)break;await p.waitForTimeout(500);}await p.waitForTimeout(3000);
    console.log(nm,await p.evaluate(()=>JSON.stringify(Object.values(__VIL.anchors(__VIL.t)).map(a=>a.auto?'auto':'bât'))));}
});
