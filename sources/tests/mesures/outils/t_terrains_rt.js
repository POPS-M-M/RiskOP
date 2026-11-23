/* Terrains de bataille (src/essai/81-tactique-rt.js) : sur chacune des 53 îles, 3 batailles automatiques ; mesure des groupes figés
   (chemin sans progrès plus de 3 s), des chemins introuvables, des groupes inactifs (attaque sans combat ni marche ; défense immobile
   pendant qu'un allié se bat à moins de 9 u) et des soldats égarés loin de leur groupe.
   node t_terrains_rt.js <dossier servi (essai_test.html + iles/)> [îles séparées par des virgules] */
const {chromium}=require('playwright');const {spawn}=require('child_process');
const base=async function(file,fn){const port=8500+Math.floor(Math.random()*90);const srv=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:process.argv[2],stdio:'ignore'});await new Promise(r=>setTimeout(r,800));
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1400,height:860}});const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join('|')));p.on('console',m=>{if(/warn|error/.test(m.type())&&!/ERR_TUNNEL|GL Driver|Failed to load/.test(m.text()))errs.push(m.text().slice(0,300));});
await p.goto(`http://127.0.0.1:${port}/${file||'essai_test.html'}`);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('gl-tuto','1');localStorage.setItem('rk-tob','{"off":1}');});await p.reload();await p.waitForTimeout(1500);
await p.click('#o-go');await p.waitForTimeout(800);await p.evaluate(()=>document.querySelectorAll('.tu-card,.tob').forEach(e=>e.remove()));
try{await fn(p,errs);}catch(e){console.log('ECHEC',e.message);}console.log('ERREURS',JSON.stringify(errs.slice(0,8)));await b.close();srv.kill();};

/* mesure : sur chaque île, batailles automatiques ; groupes inactifs, groupes bloqués (chemin sans progrès ou introuvable), soldats égarés loin de leur groupe */
const ONLY=process.argv[3]||'';
base('essai_test.html',async(p,errs)=>{
  await p.evaluate(()=>{const W3=__RT.dbg.W3,BLX=__RT.dbg.BLX;if(!W3.on)w3Toggle();for(const n in (BLX.isl||{}))try{blxWant3(n,'lod2');}catch(_){} });
  for(let k=0;k<60;k++){const s=await p.evaluate(()=>{const W3=__RT.dbg.W3,BLX=__RT.dbg.BLX,terrs=__RT.dbg.terrs;return [W3.models.size,terrs.length,Object.values(BLX.isl||{}).filter(I=>I.ready3).length,Object.keys(BLX.isl||{}).length];});if(s[0]>=s[1]&&s[2]>=s[3])break;await p.waitForTimeout(1000);}
  const out=await p.evaluate((ONLY)=>{const RT=__RT,res=[],W3=RT.dbg.W3,terrs=RT.dbg.terrs,rtAlive=RT.dbg.alive,rtSolV=RT.dbg.solV,RT_U_rng=g=>!!(g.kind&&['archer','catapulte'].includes(g.kind));
    const L=terrs.filter(t=>!ONLY||ONLY.split(',').includes(t.name));
    for(const t of L){const f=terrs[(t.nb||[])[0]]||t;const row={ile:t.name,bl:!!(W3.models.get(t.id)||{}).bx,n:0,fin:{},idleA:0,idleMax:0,bloq:0,sansChemin:0,egares:0,t:0,libres:0};
      for(let sd=0;sd<3;sd++){
        const uA={guerrier:10+sd*4,lancier:4,archer:2,cavalier:3,catapulte:sd===2?2:0,elite:0},uD={guerrier:10,lancier:2,archer:5,cavalier:0,catapulte:0,elite:sd};
        const sp={t,f,stance:0,camps:[{pid:0,fac:'pirate',name:'A',u:uA,heroes:[]},{pid:1,fac:'marine',name:'D',u:uD,heroes:[]}]};
        let R=null;try{R=RT.dbg.nw({spec:sp,seed:500+sd*31+t.id,ai:[true,true]});}catch(e){row.err=String(e).slice(0,120);break;}
        if(!R){row.err='pas de carte';break;}
        row.libres=R.M.T.flat().filter(c=>R.M.pass(c)).length;
        R.aiOn=[true,true];R.toutAuto=true;R.deploy=false;let q=0;const st=new Map(),so=new Map();
        while(!R.end&&q++<5200){RT.dbg.step(R);
          for(const g of R.G){if(!rtAlive(g)||g.hero)continue;const z=st.get(g)||{x:g.ax,y:g.ay,still:0,idle:0,im:0};
            const enemies=R.G.some(e=>e.sd!==g.sd&&rtAlive(e));
            const mv=Math.hypot(g.ax-z.x,g.ay-z.y);z.x=g.ax;z.y=g.ay;
            const wantMove=g.path&&g.pi<g.path.length;
            if(wantMove&&mv<1e-3){z.still+=RT.DT;if(z.still>3&&!z.cnt){row.bloq++;z.cnt=1;}}else{z.still=0;z.cnt=0;}
            if(g.goal&&g.path&&!g.path.length&&!z.np){row.sansChemin++;z.np=1;}
            if(g.sd===0&&enemies&&!g.fight&&!wantMove&&g.state!=='deroute'){z.idle+=RT.DT;row.idleA+=RT.DT;z.im=Math.max(z.im,z.idle);row.idleMax=Math.max(row.idleMax,z.idle);}else z.idle=0;
            if(g.sd===1&&!g.fight&&!wantMove&&g.state==='ferme'&&!RT_U_rng(g)&&R.G.some(q=>q.sd===1&&q!==g&&q.fight&&rtAlive(q.fight)&&Math.hypot(q.cx-g.cx,q.cy-g.cy)<9)){z.di=(z.di||0)+RT.DT;row.idleDMax=Math.max(row.idleDMax||0,+z.di.toFixed(1));}else z.di=0;
            st.set(g,z);
            for(const s of rtSolV(g)){const d=Math.hypot(s.x-g.ax,s.y-g.ay),w=so.get(s)||0;const nw=d>g.rad+2.5?w+RT.DT:0;if(nw>5&&w<=5)row.egares++;so.set(s,nw);}}}
        row.rej=(row.rej||0)+(R.stats.rejoints||0);row.n++;row.t+=R.end?R.end.t:999;const w=R.end?R.end.why.replace(/\(.*?\)/g,'').slice(0,40):'non finie';row.fin[w]=(row.fin[w]||0)+1;}
      row.t=Math.round(row.t/Math.max(1,row.n));row.idleA=Math.round(row.idleA);row.idleMax=+row.idleMax.toFixed(1);res.push(row);}
    return res;},ONLY);
  for(const r of out)console.log(JSON.stringify(r));
  const bad=out.filter(r=>r.err||r.bloq||r.idleMax>6||(r.idleDMax||0)>6||Object.keys(r.fin).some(k=>/non finie|Temps/.test(k)));
  console.log((bad.length?'✘ ':'✔ ')+out.length+' îles : bataille sur chaque île, finie avant le temps, aucun groupe figé plus de 3 s, aucune troupe inactive plus de 6 s'+(bad.length?' — '+bad.map(r=>r.ile).join(', '):''));
});
