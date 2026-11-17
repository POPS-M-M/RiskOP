/* ---------- onglets regroupés : 5 entrées au lieu de 8 ---------- */
RK.last={};
const GROUPS=[['army','Île','⚑',['army']],['eco','Économie','฿',['eco','city','tech']],['leg','Équipe','♛',['leg']],['dip','Diplo','⚖',['dip']],['world','Monde','◎',['rel','obj','age','jrn']]];
const LEAF={army:'Île',eco:'Berrys',city:'Villes',tech:'Techno',leg:'Lieutenants',dip:'Diplomatie',obj:'Objectifs',age:'Âge',jrn:'Journal',rel:'Haki'};
const groupOf=leaf=>GROUPS.find(g=>g[3].includes(leaf))||GROUPS[0];
const rkHireReady=()=>{const p=players[ME];return !!p&&p.alive&&chOwnedBy(ME).length<chSlots()&&LEGENDS.some((L,i)=>!hireReason(p,i));};
function pTurn2(){
  if(!TM.on||TM.phase!=='plan')return '';
  const mine=TM.queue.filter(o=>o.s===ME);
  if(!mine.length)return '';
  return '<div class="card tcard"><h3>Ordres de ce tour</h3>'+mine.map((o,i)=>'<div class="lr"><b>'+esc(terrs[o.f].name)+' → '+esc(terrs[o.to].name)+'</b><small>'+Math.round(o.pct*100)+' % de la garnison'+(o.st?' · '+STANCE[o.st].n.toLowerCase():'')+'</small>'+btn('unq',i,'Annuler',false)+'</div>').join('')+'<p class="note">Ils partent tous en même temps que ceux des autres camps quand la résolution commence.</p></div>';
}
function pArmy2(){
  const p=players[ME],t=ui.sel>=0?terrs[ui.sel]:null,m=p.mod,cw=CREWS[p.crew||0];
  let nT=0,trp=0;for(const x of terrs)if(x.owner===ME){nT++;trp+=tr(x);}
  const mvN=armies.filter(a=>a.owner===ME).reduce((s,a)=>s+Math.floor(sumU(a.u)),0);
  return campCard()+adviceCard()+(t?terrSheet(t):'<div class="card"><h3>Territoire</h3><p class="muted">Cliquez une île pour afficher sa fiche : garnison, revenu, actions possibles.</p></div>')
    +'<div class="card"><h3>Envoyer des troupes</h3><div class="segs">'+[25,50,75,100].map(v=>btn('pct',v/100,v+' %',false,Math.round(ui.pct*100)===v?'on':'')).join('')+'</div>'
    +'<p class="note" style="margin-top:8px">Glissez depuis une de vos îles vers un voisin, ou sélectionnez-la puis cliquez un voisin. Part de la garnison envoyée : <b>'+Math.round(ui.pct*100)+' %</b>. Gagner : votre force doit dépasser celle de la garnison.</p>'
    +'<details><summary class="note" style="cursor:pointer">Posture au départ (avancé)</summary><div class="segs" style="margin-top:6px">'+STANCE.map((z,i)=>btn('stance',i,z.ic+' '+z.n,false,(ui.stance|0)===i?'on':'')).join('')+'</div><p class="note" style="margin-top:6px">'+STANCE[ui.stance|0].t+'</p></details></div>'
    +seaCard()
    +'<div class="card"><details><summary class="note" style="cursor:pointer"><b>Votre camp : '+cw.ic+' '+cw.n+'</b> · '+nT+' îles · '+Math.floor(trp)+' troupes</summary><p class="note">'+cw.t+'</p>'
    +kv('Troupes en marche',mvN)+kv('Attaque','+'+Math.round(m.atk*100)+' %')+kv('Défense','+'+Math.round(m.def*100)+' %')+kv('Vitesse','+'+Math.round(m.spd*100)+' %')+kv('Votre prime',fmtPrime(primeOf(ME)))
    +(cw.hunt?(()=>{const pr=curPrimes(),h=huntTarget(ME,pr);return h>=0?'<p class="note">Prime à abattre : <b>'+players[h].name+'</b> ('+fmtPrime(pr[h])+').</p>':'';})():'')+'</details></div>';
}
function pAgeInfo(){
  const A=AGES[AG.n];
  return '<div class="card"><h3>À quoi servent les âges ?</h3><p class="note">Le monde avance en trois sagas : <b>'+AGES.map(a=>a.n).join(' → ')+'</b>. Chaque âge a sa jauge : elle monte avec le temps, vos conquêtes et vos jalons. À 100 %, une <b>transition</b> vous laisse choisir vos options, puis l’âge suivant ouvre de nouvelles technologies'+(AG.n===1?' et les projets de victoire':'')+'.</p>'
    +'<p class="note"><b>Vous gardez</b> : vos îles, armées, bâtiments, technologies, attributs. <b>Remis à zéro</b> : les jalons d’Héritage. <b>Vous choisissez</b> : votre camp pour la suite (facultatif) et des options d’Héritage.</p>'
    +(A.cr?'<p class="note">Cet âge se termine par une <b>crise</b> ('+esc(A.cr)+') qui frappe tous les camps : prévoyez des troupes en réserve.</p>':'')+'</div>';
}
function pAge2(){return pAgeInfo()+pAge();}
function panelHTML(){
  const g=groupOf(ui.tab);
  const nav='<div class="tabs" role="tablist">'+GROUPS.map(G=>{
    const on=G===g,leaf=on?ui.tab:(RK.last[G[0]]||G[3][0]);
    const bdg=(G[0]==='dip'&&proposals.some(x=>x.to===ME))||(G[0]==='world'&&(agAlert()||RK.unread>0))||(G[0]==='leg'&&rkHireReady());
    return '<button role="tab" class="tab '+(on?'on':'')+'" data-act="tab" data-v="'+leaf+'" title="'+G[1]+'"><span class="ti">'+G[2]+'</span><span>'+G[1]+(bdg?'<i class="bdg"></i>':'')+'</span></button>';
  }).join('')+'</div>';
  const leaves=g[3];
  const sub=leaves.length>1?'<div class="subtabs">'+leaves.map(l=>'<button data-act="tab" data-v="'+l+'" class="'+(ui.tab===l?'on':'')+'">'+LEAF[l]+(l==='age'&&agAlert()?' •':'')+'</button>').join('')+'</div>':'';
  RK.last[g[0]]=ui.tab;
  const body={army:pArmy2,eco:pEco,city:pCity,tech:pTech,rel:pRel,dip:pDiplo,age:pAge2,leg:pLeg4,jrn:pJournal,obj:pObj}[ui.tab]||pArmy2;
  return nav+budgetBar()+sub+tuCard()+pTurn2()+body();
}
/* ---------- notifications discrètes ---------- */
function addLog(text,color,to){
  addLog_o(text,color,to);
  const l=logs[logs.length-1];if(l)l.w=performance.now();
  if(visLog({to})&&RK_KEY.test(text)&&ui.tab!=='jrn')RK.unread=Math.min(99,RK.unread+1);
}
function renderLog(){
  const now=performance.now();
  if(now-RK.logT<250&&!logDirty)return;RK.logT=now;logDirty=false;
  const L=RK.notif==='off'?[]:logs.filter(visLog).filter(l=>now-(l.w||now)<7000&&(RK.notif==='all'||RK_KEY.test(l.text))).slice(-3);
  const h=L.map(l=>'<div style="border-left-color:'+l.color+'">'+l.text+'</div>').join('');
  if(h!==RK.lastLogH){RK.lastLogH=h;$('#log').innerHTML=h;}
}
function rkNotifLabel(){return RK.notif==='all'?'🔔':RK.notif==='key'?'🔔!':'🔕';}
function rkNotifCycle(){
  RK.notif=RK.notif==='all'?'key':RK.notif==='key'?'off':'all';rkLS('rk-notif',RK.notif);
  const b=$('#b-notif');if(b){b.textContent=rkNotifLabel();b.title='Notifications sur la carte : '+({all:'toutes',key:'importantes seulement',off:'aucune (le journal garde tout)'})[RK.notif]+' — cliquer pour changer';}
  toast('Notifications : '+({all:'toutes',key:'importantes seulement',off:'masquées (journal consultable)'})[RK.notif]);
}
/* ---------- mini-carte : déplaçable, masquable, troupes et camps lisibles ---------- */
const minibox=$('#minibox'),miniShow=$('#mini-show'),miniH=$('#mini-h');
function rkMiniApply(){
  const w=$('#mapwrap'),wr=w.getBoundingClientRect();
  minibox.hidden=!!RK.mini.hide;miniShow.hidden=!RK.mini.hide;
  if(RK.mini.x!=null&&!RK.mini.hide){
    const mw=minibox.offsetWidth||190,mh=minibox.offsetHeight||150;
    minibox.style.left=clamp(RK.mini.x,0,Math.max(0,wr.width-mw))+'px';minibox.style.top=clamp(RK.mini.y,0,Math.max(0,wr.height-mh))+'px';minibox.style.bottom='auto';
  }else if(RK.mini.x==null){minibox.style.left='10px';minibox.style.top='';minibox.style.bottom='10px';}
  const sc=$('#selcard');
  if(!RK.mini.hide&&!minibox.hidden){const mr=minibox.getBoundingClientRect();sc.style.left=(mr.left-wr.left<260&&wr.bottom-mr.bottom<90?Math.round(mr.right-wr.left+8):10)+'px';}
  else sc.style.left='10px';
  sc.style.width='min(330px,calc(100% - '+sc.style.left+' - 190px))';
}
{
  let mv=null;
  miniH.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;const r=minibox.getBoundingClientRect();mv={dx:e.clientX-r.left,dy:e.clientY-r.top};minibox.classList.add('drag');try{miniH.setPointerCapture(e.pointerId);}catch(_){}});
  miniH.addEventListener('pointermove',e=>{if(!mv)return;const wr=$('#mapwrap').getBoundingClientRect();RK.mini.x=e.clientX-wr.left-mv.dx;RK.mini.y=e.clientY-wr.top-mv.dy;rkMiniApply();});
  const end=()=>{if(!mv)return;mv=null;minibox.classList.remove('drag');rkLS('rk-mini',JSON.stringify(RK.mini));};
  miniH.addEventListener('pointerup',end);miniH.addEventListener('pointercancel',end);
  $('#mini-hide').addEventListener('click',()=>{RK.mini.hide=true;rkLS('rk-mini',JSON.stringify(RK.mini));rkMiniApply();});
  miniShow.addEventListener('click',()=>{RK.mini.hide=false;rkLS('rk-mini',JSON.stringify(RK.mini));rkMiniApply();});
  addEventListener('resize',rkMiniApply);
}
function drawMini(){
  const w=mini.clientWidth,h=mini.clientHeight;if(!w||!terrs.length||RK.mini.hide)return;
  if(mini.width!==w*2||mini.height!==h*2){mini.width=w*2;mini.height=h*2;}
  const mw=mini.width,mh=mini.height,sx=mw/W,sy=mh/H,fs=Math.round(mh/15);
  mctx.drawImage(off,0,0,mw,mh);
  mctx.fillStyle='rgba(8,18,32,.42)';mctx.fillRect(0,0,mw,mh);
  for(const a of armies){
    const f=terrs[a.from],t=terrs[a.to],k=clamp(a.t/a.dur,0,1),toMe=t.owner===ME&&a.owner!==ME;
    mctx.strokeStyle=toMe?'#ff5a4e':COLORS[a.owner];mctx.globalAlpha=.9;mctx.setLineDash([5,4]);mctx.lineWidth=toMe?3:2;
    mctx.beginPath();mctx.moveTo(f.x*sx,f.y*sy);mctx.lineTo(t.x*sx,t.y*sy);mctx.stroke();mctx.setLineDash([]);mctx.globalAlpha=1;
    const x=(f.x+(t.x-f.x)*k)*sx,y=(f.y+(t.y-f.y)*k)*sy;
    mctx.fillStyle=COLORS[a.owner];mctx.beginPath();mctx.moveTo(x,y-6);mctx.lineTo(x+6,y+5);mctx.lineTo(x-6,y+5);mctx.closePath();mctx.fill();mctx.strokeStyle='#fff';mctx.lineWidth=1.6;mctx.stroke();
  }
  mctx.textAlign='center';mctx.textBaseline='middle';mctx.font='700 '+fs+'px Inter,system-ui,sans-serif';
  for(const t of terrs){
    const x=t.x*sx,y=t.y*sy,o=t.owner,r=(o===ME?7.5:6)*(mw/380);
    mctx.fillStyle=o>=0?COLORS[o]:'#cfc8ad';mctx.beginPath();mctx.arc(x,y,r,0,6.283);mctx.fill();
    let ring='rgba(6,10,16,.7)',lw=1.6;
    if(o===ME){ring='#ffffff';lw=3;}else if(o>=0){ring=rel[ME][o]==='alliance'?'#4cc38a':isWar(ME,o)?'#ff5a4e':'#9aa3ad';lw=2.6;}
    mctx.strokeStyle=ring;mctx.lineWidth=lw;mctx.stroke();
    if(t.capital){mctx.fillStyle='#f2c75c';mctx.fillText('★',x,y-r-fs*.55);}
    if(bossAlive(t)){mctx.fillStyle='#ff6a5e';mctx.fillText('☠',x+r+fs*.5,y-r);}
    const n=String(Math.floor(tr(t)));
    mctx.lineWidth=3.2;mctx.strokeStyle='rgba(6,10,16,.9)';mctx.strokeText(n,x,y+r+fs*.7);mctx.fillStyle='#fff';mctx.fillText(n,x,y+r+fs*.7);
  }
  if(ui.sel>=0&&terrs[ui.sel]){const t=terrs[ui.sel];mctx.strokeStyle='#ffe08a';mctx.lineWidth=2;mctx.beginPath();mctx.arc(t.x*sx,t.y*sy,11*(mw/380),0,6.283);mctx.stroke();}
  if(V.k>1.001){mctx.strokeStyle='#ffe08a';mctx.lineWidth=2.5;mctx.strokeRect(V.x/W*mw,V.y/H*mh,mw/V.k,mh/V.k);}
}
/* ---------- surcouches de la carte : étiquettes d'armée, cibles du tutoriel ---------- */
function rkArmyLabel(a,x,y,u){
  if(a.owner===ME||a.rt)return;
  const P=players[a.owner],t=terrs[a.to];if(!P||!t)return;
  const txt=CREWS[P.crew||0].ic+' '+cname(P)+' → '+t.name;
  ctx.font='700 '+(10.5*u)+'px Inter,system-ui,sans-serif';
  ctx.textAlign='center';ctx.textBaseline='middle';
  const tw=ctx.measureText(txt).width+10*u;
  ctx.fillStyle='rgba(8,14,24,.9)';rr(x-tw/2,y-26*u,tw,13*u,6*u);ctx.fill();
  ctx.strokeStyle=t.owner===ME?'#ff5a4e':COLORS[a.owner];ctx.lineWidth=(t.owner===ME?2.2:1.5)*u*.7;ctx.stroke();
  ctx.fillStyle='#fff';ctx.fillText(txt,x,y-19.5*u);
}
function rkDrawOver(u,now){
  const hl=typeof tuTarget==='function'?tuTarget():null;
  if(hl&&hl.terr!==undefined&&terrs[hl.terr]){
    const t=terrs[hl.terr],k=.5+.5*Math.sin(now/230);
    ctx.save();ctx.strokeStyle='rgba(255,214,90,'+(.55+.45*k)+')';ctx.lineWidth=4*u*.8;
    ctx.beginPath();ctx.arc(t.x,t.y,(24+k*5)*u,0,6.283);ctx.stroke();
    ctx.strokeStyle='rgba(255,214,90,.9)';ctx.lineWidth=2*u*.8;ctx.setLineDash([6*u,5*u]);ctx.lineDashOffset=-now/50;ctx.beginPath();ctx.arc(t.x,t.y,(32+k*4)*u,0,6.283);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#ffd65a';ctx.strokeStyle='rgba(6,10,16,.95)';ctx.lineWidth=3*u*.8;ctx.font='800 '+(13*u)+'px Inter,system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    const lab=hl.label||'ICI';ctx.strokeText('▼ '+lab,t.x,t.y-44*u-k*4*u);ctx.fillText('▼ '+lab,t.x,t.y-44*u-k*4*u);
    ctx.restore();
  }
}
/* ---------- cadence : mises à jour des nouveaux éléments ---------- */
let rkFT=0;
function rkFrame(now){
  rkPhaseTick();
  if(now-rkFT<250)return;rkFT=now;
  rkPhaseWatch();
  if(ui.tab==='jrn')RK.unread=0;
  const jb=$('#b-jrn');if(jb){const v=RK.unread>0?String(RK.unread):'';if(jb.dataset.n!==v){jb.dataset.n=v;jb.innerHTML='📜'+(v?'<b>'+v+'</b>':'');}}
  const ap=$('.app');if(ap)ap.classList.toggle('adv',ADV());
  /* statut « prêt » dans le tableau des camps */
  try{if(typeof tuTick==='function')tuTick();}catch(_){}
  try{if(typeof coachRender==='function')coachRender();}catch(_){}
  try{if(typeof rkAutoTick==='function')rkAutoTick();}catch(_){}
  const hb=document.querySelector('#side [data-act]:hover');if(hb&&hb.dataset.act!=='tab')rkPreview(hb);
  logDirty=true;
  rkMiniApply();
}
$('#b-notif').addEventListener('click',rkNotifCycle);
$('#b-jrn').addEventListener('click',()=>{ui.tab='jrn';RK.unread=0;$('#main').classList.remove('nodock');renderPanel(true);$('#side').scrollTop=0;if(matchMedia('(max-width:940px)').matches)$('#side').scrollIntoView({behavior:'smooth',block:'start'});});
addEventListener('keydown',e=>{if(e.target&&/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(e.key==='m'||e.key==='M'){RK.mini.hide=!RK.mini.hide;rkLS('rk-mini',JSON.stringify(RK.mini));rkMiniApply();}});
$('#b-notif').textContent=rkNotifLabel();
