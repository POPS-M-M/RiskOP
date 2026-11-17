// Comparaison d'intégrité (lecture seule) : build public 906bb53 vs copie de test. Aucun fichier du jeu modifié.
const {chromium}=require('playwright');const fs=require('fs'),crypto=require('crypto');
const H=s=>crypto.createHash('sha1').update(s).digest('hex').slice(0,12);
async function snap(file,seed){
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']}),p=await b.newPage({viewport:{width:1000,height:640}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
  await p.goto('file://'+file);
  await p.evaluate(()=>{localStorage.clear();localStorage.setItem('gl-tuto','1');});
  const r=await p.evaluate((seed)=>{const X=__RK;Math.random=(()=>{let s=12345;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;}})();
    X.newGame(seed,'normal',{crews:[0,1,2,3],turn:false,pk:3});X.started=true;
    const T=X.terrs,safe=o=>JSON.stringify(o,(k,v)=>typeof v==='function'?undefined:(typeof v==='number'?Math.round(v*1e6)/1e6:v));
    const geo=T.map(t=>({id:t.id,name:t.name,x:t.x,y:t.y,rad:t.rad,owner:t.owner,nb:t.nb||t.links||t.adj||null,poly:t.poly||null,cells:t.cells?t.cells.length:null}));
    // grille de clic : terrAt sur toute la carte
    let grid='',n=0;const W=3000;for(let y=-200;y<W;y+=6){for(let x=-200;x<W;x+=6){const q=X.terrAt(x,y);grid+=q?q.id:'.';n++;}}
    const keys=Object.keys(T[0]).sort();
    let sv=null;try{sv=safe(X.svBuild())}catch(e){sv='ERR '+e}
    const art=safe(X.ISLE_ART);
    return {n:T.length,keys,geo:safe(geo),gridLen:n,grid,sv,svLen:sv?sv.length:0,art,army:safe(X.armies.map(a=>({id:a.id,x:a.x,y:a.y,n:a.n,owner:a.owner,t:a.t||a.at||null}))),players:safe(X.players.map(p=>({n:p.name,g:p.gold,c:p.crew})))};
  },seed);
  await b.close();return {...r,errs};}
(async()=>{const A=await snap(process.argv[2],2024),B=await snap(process.argv[3],2024);
 const out=[];const cmp=(k,a,b)=>out.push([k,a===b?'IDENTIQUE':'DIFFÉRENT',H(String(a)),H(String(b)),String(a).length]);
 out.push(['territoires',A.n,B.n]);out.push(['champs d\'un territoire',JSON.stringify(A.keys)===JSON.stringify(B.keys)?'identiques':'DIFFÉRENTS',A.keys.length,B.keys.length]);
 cmp('géométrie (x,y,rayon,nom,propriétaire,voisins,contour)',A.geo,B.geo);cmp('grille de clic terrAt ('+A.gridLen+' points)',A.grid,B.grid);
 cmp('ISLE_ART',A.art,B.art);cmp('armées/jetons',A.army,B.army);cmp('joueurs',A.players,B.players);cmp('sauvegarde svBuild',A.sv,B.sv);
 for(const o of out)console.log(o.join(' | '));console.log('erreurs page A',A.errs.slice(0,3),'B',B.errs.slice(0,3));
 if(A.sv!==B.sv){let i=0;while(A.sv[i]===B.sv[i])i++;console.log('sv diff @',i,A.sv.slice(i-60,i+80),'||',B.sv.slice(i-60,i+80));}
})();
