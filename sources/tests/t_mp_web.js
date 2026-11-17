const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1300,height:820}});
await ctx.addInitScript({content:fs.readFileSync(__dirname+'/mock_peerjs.js','utf8')});
const res=[];const ok=(n,c,d)=>res.push((c?'PASS ':'FAIL ')+n+(d!==undefined?' — '+d:''));const errs=[];
const pg=async n=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(n+': '+e.message+' @ '+(e.stack||'').split('\n')[1]));await p.goto('http://127.0.0.1:8766/risk_test.html');await p.evaluate(()=>{localStorage.setItem('gl-tuto','1');});await p.reload();await p.waitForTimeout(1500);return p;};
const H=await pg('hôte'),C=await pg('client'),C2=await pg('client2');
ok('Hors claude.ai : boutons en ligne actifs (réseau PeerJS)',await H.evaluate(()=>!document.querySelector('#o-host').disabled&&!window.claude));
await H.fill('#n-name','Luffy');await H.click('#o-host');await H.waitForTimeout(800);
const code=await H.evaluate(()=>document.querySelector('#l-code').textContent);
for(const [P,n] of [[C,'Zoro'],[C2,'Nami']]){await P.fill('#n-name',n);await P.fill('#o-code',code);await P.click('#o-join');}
await H.waitForTimeout(3000);
const lob=await H.evaluate(()=>document.querySelector('.lobby .seats').textContent);
ok('Salle d’attente : les 3 joueurs se voient',/Luffy/.test(lob)&&/Zoro/.test(lob)&&/Nami/.test(lob),lob.slice(0,150));
await C.click('.lobby [data-mpcrew="3"]').catch(()=>{});await H.waitForTimeout(1200);
await H.click('#l-start');await H.waitForTimeout(4000);
const pl=async p=>p.evaluate(()=>__RK.players.map(q=>q.name+':'+q.crew).join(' | '));
const a=await pl(H),c1=await pl(C),c2=await pl(C2);
ok('Partie lancée chez les 3 joueurs avec les mêmes camps',a===c1&&a===c2&&/Zoro:3/.test(a),a);
const g0=await H.evaluate(()=>__RK.players[2].gold);await C2.locator('#side [data-act="recruit"] >> visible=true').first().click();await H.waitForTimeout(2500);const g1=await H.evaluate(()=>__RK.players[2].gold);
ok('Ordre d’un client reçu et exécuté par l’hôte',g1<g0,Math.round(g0)+' → '+Math.round(g1));
await H.click('#b-end').catch(()=>{});await C.click('#b-end').catch(()=>{});await C2.click('#b-end').catch(()=>{});await H.waitForTimeout(5000);
const turn=await Promise.all([H,C,C2].map(p=>p.evaluate(()=>document.querySelector('#clock').textContent)));
ok('Tours synchronisés',turn.every(t=>/Tour/.test(t)),turn.join(' / '));
await H.close();await C.waitForTimeout(9000);
ok('Départ de l’hôte détecté par les clients',await C.evaluate(()=>!document.querySelector('#overlay').hidden&&/quitté/.test(document.querySelector('#overlay').textContent)));
/* mauvais code : pas de salle */
const D=await pg('perdu');await D.fill('#n-name','X');await D.fill('#o-code','zzzzz');await D.click('#o-join');await D.waitForTimeout(9000);
ok('Code inconnu : message clair',/Aucune partie trouvée/.test(await D.evaluate(()=>document.querySelector('#overlay').textContent)));
/* export d'illustrations hors claude.ai : téléchargement direct proposé */
ok('Export d’illustrations disponible hors claude.ai',await D.evaluate(()=>!!__RK.IL.dl&&typeof __RK.IL.dl.save==='function'));
console.log(res.join('\n'));console.log(errs.join('\n')||'aucune erreur JS');await b.close()})();
