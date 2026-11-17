/* Interface de progression : bandeau d'accueil, écran Progression (choix, objectifs, collection), recrutement en 3 sections, fin de partie. */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();
const res=[];const ok=(n,c,d)=>{res.push((c?'PASS ':'FAIL ')+n+(d!==undefined?' — '+d:''));};
for(const vp of [{width:1400,height:860,tag:'pc'},{width:400,height:820,tag:'mobile'}]){
const p=await b.newPage({viewport:{width:vp.width,height:vp.height}});
const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
await p.goto('file://'+__dirname+'/../dist/risk_test.html');
await p.evaluate(()=>{localStorage.clear();localStorage.setItem('gl-profile',JSON.stringify({v:1,games:4,wins:1,uses:0,rec:{Zoro:1},tot:{},ach:{},ti:'',em:'',bs:0,camp:{},cj:[]}));});
await p.reload();await p.waitForTimeout(800);
const R=(f,...a)=>p.evaluate(f,...a);
const band=await R(()=>{const b=document.querySelector('#overlay .pgband');return b?{t:b.textContent,dot:!!b.querySelector('.pgdot')}:null;});
ok(vp.tag+' Accueil : bandeau rang + barre + prochaine récompense + pastille',band&&/Rang \d/.test(band.t)&&/Prochaine|Rang \d+ :/.test(band.t)&&band.dot,band&&band.t);
await p.screenshot({path:__dirname+'/s_pg_intro_'+vp.tag+'.png'});
await p.click('#overlay [data-pg="open"]');await p.waitForTimeout(200);
const modal=await R(()=>{const m=document.querySelector('#pgm');return {vis:m&&!m.hidden,t:m?m.textContent:'',cards:m?m.querySelectorAll('.pgmini').length:0,chips:m?m.querySelectorAll('.pgchip').length:0,ow:document.documentElement.scrollWidth<=innerWidth+1};});
ok(vp.tag+' Écran Progression : ouvert, sections présentes',modal.vis&&/À débloquer maintenant/.test(modal.t)&&/Prochaines récompenses/.test(modal.t)&&/Objectifs/.test(modal.t)&&/Collection/.test(modal.t));
ok(vp.tag+' Écran Progression : 3 commandants au choix, 46 dans la collection',modal.cards>=3&&modal.chips===46,modal.cards+' cartes, '+modal.chips+' pastilles');
ok(vp.tag+' Pas de défilement horizontal',modal.ow);
await p.screenshot({path:__dirname+'/s_pg_modal_'+vp.tag+'.png',fullPage:false});
const before=await R(()=>Object.keys(__RK.PG.col).length);
await p.click('#pgm [data-pg^="claim:2:"]');await p.waitForTimeout(150);
const after=await R(()=>({n:Object.keys(__RK.PG.col).length,msg:(document.querySelector('#pgm .verdict')||{}).textContent||''}));
ok(vp.tag+' Choisir un commandant : ajouté à la collection, message',after.n===before+1&&/rejoint votre collection/.test(after.msg),after.msg);
await p.keyboard.press('Escape');await p.waitForTimeout(100);
const closed=await R(()=>document.querySelector('#pgm').hidden);
ok(vp.tag+' Fermeture (Échap)',closed);
/* recrutement dans une partie */
await R(()=>{const X=__RK;X.newGame(2024,'normal',{crews:[1,0,2,3],turn:true,pk:3});X.started=true;document.querySelector('#overlay').hidden=true;X.ui.tab='leg';X.renderPanel(true);});
await p.waitForTimeout(300);
const side=await R(()=>{const s=document.querySelector('#side');return {t:s.textContent,short:s.querySelectorAll('.chc.pgs').length,head:(s.querySelector('.pghead')||{}).textContent||''};});
ok(vp.tag+' Équipe : en-tête « proposés : 8 sur 33 (Normal) »',/proposés pour cette partie : 8 sur 33 \(Normal\)/.test(side.head),side.head);
ok(vp.tag+' Équipe : sections Recrutables maintenant / Presque',/Recrutables maintenant/.test(side.t)&&(/Presque/.test(side.t)||/Plus tard/.test(side.t)));
ok(vp.tag+' Équipe : fiches courtes avec « Il vous manque »',side.short>0&&/Il vous manque|Prêt à rejoindre/.test(side.t),side.short+' fiches');
await p.click('#side [data-act="chmore"]');await p.waitForTimeout(150);
const det=await R(()=>/Passif \(tout le camp\)/.test(document.querySelector('#side').textContent));
ok(vp.tag+' Fiche détaillée au clic (passif, compétence complète)',det);
await p.click('#side [data-act="pgsec"][data-v="no"]');await p.waitForTimeout(150);
const no=await R(()=>/Pas proposé dans cette partie : il peut l’être/.test(document.querySelector('#side').textContent));
ok(vp.tag+' Section « Pas proposés dans cette partie » dépliable',no);
await p.screenshot({path:__dirname+'/s_pg_team_'+vp.tag+'.png'});
/* fin de partie */
await R(()=>{const X=__RK;X.over={winners:[0],text:'Test.'};X.showEnd();});await p.waitForTimeout(200);
const end=await R(()=>document.querySelector('#overlay').textContent);
ok(vp.tag+' Fin de partie : XP gagnée et bandeau',/\+\d+ XP/.test(end)&&/Rang \d/.test(end),(end.match(/\+\d+ XP[^·]*/)||[''])[0]);
await p.screenshot({path:__dirname+'/s_pg_end_'+vp.tag+'.png'});
ok(vp.tag+' Aucune erreur JS',!errs.length,errs.join(' | '));
await p.close();}
for(const r of res)console.log(r);console.log('bilan',res.filter(r=>r.startsWith('PASS')).length+'/'+res.length);
await b.close();})();
