/* ================= LIVRE DE BORD ET FICHE D'ÎLE (maquette validée le 23/11, version test, branche essai/aaa-proto) =================
   Nouvelle interface seulement (body.op-ui). Le contenu et les boutons restent ceux du jeu : mêmes éléments, mêmes « data-act », même écouteur
   de clics sur #side. Seules la disposition et la présentation changent ; quelques boutons sont regroupés (menu « Proposer » en diplomatie)
   et les textes longs passent en infobulle ou dans « Détails ». Rien n'est retiré.
   - Onglet Île (ui.tab = 'army') : FICHE D'ÎLE compacte à droite de la carte.
   - Autres onglets (Économie, Villes, Techno, Équipe, Diplo, Monde…) : LIVRE DE BORD plein écran, en-tête et navigation, Échap ou ✕ pour revenir.
   La mise en forme est réappliquée après chaque reconstruction du panneau (renderPanel). */
const OPL={open:false,tab:null};
const OPL_NAV=[['eco','฿','Économie',['eco','city','tech']],['leg','♛','Équipage',['leg']],['dip','⚖','Diplomatie',['dip']],['rel','◎','Monde',null]];
function oplTab(){try{return ui.tab;}catch(_){return 'army';}}
/* bouton du Livre (Économie, Équipage, Diplomatie, Monde) : ouvre le groupe, sur son dernier sous-onglet ; sous-onglet précis (Villes, Techno…) : le groupe puis ce sous-onglet.
   Le jeu donne à l'onglet du haut le nom du dernier sous-onglet visité (data-v="city" après Villes) : on cherche donc l'onglet par son groupe,
   pas par son nom (sinon « Économie » ne répondait plus après un passage par Villes ou Techno). */
function oplGo(v){const tabs=[...document.querySelectorAll('#side .tabs .tab')],grp=x=>{try{return groupOf(x)[0];}catch(_){return x;}};
  const nav=OPL_NAV.some(n=>n[0]===v),g=grp(v),t=tabs.find(x=>x.dataset.v===v)||tabs.find(x=>grp(x.dataset.v)===g);if(!t)return false;
  if(!(nav&&grp(ui.tab)===g&&OPL.open))t.click();
  if(!nav&&ui.tab!==v){if(typeof renderPanel==='function')renderPanel(true);const b=document.querySelector('#side .subtabs button[data-act="tab"][data-v="'+v+'"]');if(b)b.click();}
  return true;}
function oplClose(){oplGo('army');}
function oplNavOf(t){for(const n of OPL_NAV){if(n[3]?n[3].includes(t):!['army','eco','city','tech','leg','dip'].includes(t))return n[0];}return null;}
/* en-tête du Livre de bord (posé au-dessus du panneau), fond, boutons du bandeau */
function oplChrome(){
  let h=document.getElementById('op-livre-h');
  if(!h){h=document.createElement('div');h.id='op-livre-h';h.setAttribute('role','navigation');h.setAttribute('aria-label','Livre de bord');
    h.innerHTML='<h2>LIVRE DE BORD</h2><nav>'+OPL_NAV.map(n=>'<button type="button" data-opl="'+n[0]+'"><span>'+n[1]+'</span> '+n[2]+'</button>').join('')+'</nav><small>Échap : retour à la carte</small><button type="button" class="x" data-opl="x" aria-label="Fermer le Livre de bord">✕</button>';
    h.addEventListener('click',e=>{const b=e.target.closest('[data-opl]');if(!b)return;e.stopPropagation();const v=b.dataset.opl;if(v==='x')oplClose();else oplGo(v);});document.body.appendChild(h);
    const bg=document.createElement('div');bg.id='op-livre-bg';bg.addEventListener('click',()=>oplClose());(document.getElementById('main')||document.body).appendChild(bg);}
  let n=document.getElementById('op-livre-nav');const ctl=document.querySelector('.hud .ctl');
  if(!n&&ctl){n=document.createElement('nav');n.id='op-livre-nav';n.setAttribute('aria-label','Ouvrir le Livre de bord');
    n.innerHTML=OPL_NAV.map(x=>'<button type="button" data-opl="'+x[0]+'" title="'+x[2]+'"><span>'+x[1]+'</span>'+x[2]+'</button>').join('');
    n.addEventListener('click',e=>{const b=e.target.closest('[data-opl]');if(!b)return;e.stopPropagation();const cur=oplNavOf(oplTab());if(cur===b.dataset.opl&&OPL.open)oplClose();else oplGo(b.dataset.opl);});
    ctl.insertBefore(n,ctl.firstChild);}
  /* état actif et pastille « Monde » recopiés de l'onglet d'origine */
  const cur=OPL.open?oplNavOf(oplTab()):null,bdg=([...document.querySelectorAll('#side .tabs .tab')].find(x=>{try{return groupOf(x.dataset.v)[0]==='world';}catch(_){return false;}})||{querySelector:()=>null}).querySelector('.bdg'),dot=!!(bdg&&bdg.offsetParent!==null&&getComputedStyle(bdg).display!=='none'&&getComputedStyle(bdg).backgroundColor!=='rgba(0, 0, 0, 0)');
  for(const b of document.querySelectorAll('#op-livre-h [data-opl],#op-livre-nav [data-opl]')){b.classList.toggle('on',b.dataset.opl===cur);if(b.dataset.opl==='rel')b.classList.toggle('dot',dot);}}
/* ---- mise en forme après chaque reconstruction ---- */
const OPL_POR={'Nami':'cmd_nami','Ace':'cmd_ace','Monkey D. Garp':'cmd_garp','Garp':'cmd_garp','Luffy':'cmd_luffy','Monkey D. Luffy':'cmd_luffy','Shanks':'cmd_shanks','Sakazuki':'cmd_akainu','Akainu':'cmd_akainu'};
function oplNote2Tip(scope){for(const p of scope.querySelectorAll('p.note')){if(p.dataset.opl)continue;const prev=p.previousElementSibling;const t=p.textContent.trim();
  if(t.length>70&&prev&&!prev.matches('.segs,.mqf')){prev.title=(prev.title?prev.title+'\n':'')+t;prev.classList.add('op-tip');p.dataset.opl='tip';}}}
function oplFiche(side){
  const sh=side.querySelector('.card.sheet');if(!sh||side.dataset.oplDone==='f')return;side.dataset.oplDone='f';
  oplNote2Tip(sh);
  /* actions : le recrutement en gros bouton doré, le reste en tuiles */
  const rec=sh.querySelector('.mqrec button[data-act^="recruit"]');if(rec)rec.classList.add('op-big');
  /* cartes secondaires (conseil, votre camp, champions…) : repliées sous « Détails » */
  const rest=[...side.children].filter(c=>c!==sh&&c.classList.contains('card'));
  if(rest.length){const d=document.createElement('details');d.className='card op-more';d.innerHTML='<summary>Détails : conseil, votre camp, champions</summary>';
    if(OPL.more)d.open=true;d.addEventListener('toggle',()=>{OPL.more=d.open;});rest[0].before(d);for(const c of rest)d.appendChild(c);}}
function oplLivre(side){
  const t=oplTab();if(side.dataset.oplDone===t)return;side.dataset.oplDone=t;
  oplNote2Tip(side);
  /* Diplomatie : par camp, « Déclarer la guerre » à part, les accords dans un menu « Proposer » (mêmes boutons) */
  for(const act of side.querySelectorAll('.card > .act')){const bs=[...act.querySelectorAll('button[data-act]')];const war=bs.find(b=>b.dataset.act==='war');const others=bs.filter(b=>b!==war);
    if(!war||others.length<2||act.querySelector('.op-prop'))continue;const d=document.createElement('details');d.className='op-prop';d.innerHTML='<summary>Proposer ▾</summary><div class="op-pm"></div>';
    const m=d.querySelector('.op-pm');for(const b of others)m.appendChild(b);act.insertBefore(d,war);
    d.addEventListener('toggle',()=>{if(d.open)for(const o of side.querySelectorAll('details.op-prop[open]'))if(o!==d)o.open=false;});}
  /* Équipe : avis de recherche avec la pose de garde de la planche quand le personnage en a une (jamais agrandie) */
  for(const c of side.querySelectorAll('.chc')){if(c.querySelector('.op-wp'))continue;const nm=((c.querySelector('.t b')||{}).textContent||'').replace(/^♛\s*/,'').trim();const a=OPL_POR[nm];
    const w=document.createElement('div');w.className='op-wp';let img='';try{img=a&&typeof rtPor==='function'?rtPor(a,'garde',1,120):'';}catch(_){}
    w.innerHTML='<b>WANTED</b>'+(img?'<img alt="'+esc(nm)+'" src="'+img+'">':'<span>pas de planche</span>');if(a&&!img)w.dataset.wait=a;c.insertBefore(w,c.firstChild);}
}
/* portraits dont la planche n'était pas encore chargée : complétés dès qu'elle l'est */
function oplWait(side){for(const w of side.querySelectorAll('.op-wp[data-wait]')){let img='';try{img=rtPor(w.dataset.wait,'garde',1,120);}catch(_){}if(img){const sp=w.querySelector('span');if(sp)sp.outerHTML='<img alt="" src="'+img+'">';delete w.dataset.wait;}}}
function oplApply(){if(!OPUI.on)return;const side=document.getElementById('side');if(!side)return;const t=oplTab(),open=t!=='army'&&!document.body.classList.contains('rtrun')&&!document.body.classList.contains('tacrun');
  if(open!==OPL.open){OPL.open=open;document.body.classList.toggle('op-livre',open);if(open)side.scrollTop=0;}
  document.body.classList.toggle('op-fiche',!open);document.body.classList.toggle('op-tab-'+(OPL.tab||'x'),false);OPL.tab=t;document.body.classList.add('op-tab-'+t);
  oplChrome();
  try{if(open){oplLivre(side);oplWait(side);}else oplFiche(side);}catch(e){console.warn('livre de bord :',e);}}
{const r0=renderPanel;renderPanel=function(force){const side=document.getElementById('side');r0.apply(this,arguments);
  /* panneau reconstruit (le jeu ne remplace son contenu que si le HTML a changé) : la mise en forme est à refaire */
  if(side&&side._oplLP!==lastPanel){side._oplLP=lastPanel;delete side.dataset.oplDone;}oplApply();};}
setInterval(()=>{try{oplApply();}catch(_){}},500);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&OPL.open&&OPUI.on){const m=document.getElementById('op-menu');if(m&&!m.hidden)return;e.preventDefault();oplClose();}});
window.__OPL={go:oplGo,close:oplClose,get open(){return OPL.open;},get tab(){return oplTab();}};

{const st=document.createElement('style');st.id='op-livre-css';const B='body.op-ui';st.textContent=[
  /* boutons du bandeau */
  '#op-livre-nav{display:none}',B+' #op-livre-nav{display:flex;gap:4px}',
  B+' #op-livre-nav button{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:66px;height:46px;padding:2px 6px!important;font-size:10.5px!important;line-height:1.1}',
  B+' #op-livre-nav button span{font-size:16px}',B+' #op-livre-nav button.dot::after,#op-livre-h button.dot::after{content:"";position:absolute;right:5px;top:5px;width:8px;height:8px;border-radius:50%;background:#ff5a4f}',
  B+' #side .tabs{display:none!important}',B+' #side #budget{display:none!important}',
  /* ===== FICHE D'ÎLE ===== */
  B+'.op-fiche #side{width:384px!important}',
  B+'.op-fiche #side .sheet h4 em{display:none}',
  B+'.op-fiche #side .sheet .sh-art{height:140px}',
  B+'.op-fiche #side .mqrow .mqn{background:#1b1b20;border:1px solid #34343b;border-radius:10px;padding:6px 8px}',
  B+'.op-fiche #side .mqrec button.op-big{display:flex;width:100%;min-height:46px;justify-content:center;align-items:center;border-radius:12px!important;border:2px solid #2a1a0c!important;background:linear-gradient(180deg,#ffe066,#f0a90f)!important;color:#2a1a0c!important;font:800 14px Inter,system-ui,sans-serif!important;box-shadow:0 3px 0 #8e1414}',
  B+'.op-fiche #side .mqact{border-radius:12px;background:#1b1b20;border:1px solid #34343b;padding:8px 10px}',
  B+'.op-fiche #side .segs button{min-height:34px}',
  B+'.op-fiche #side .mqquick{display:grid!important;grid-template-columns:1fr 1fr;gap:6px}',B+'.op-fiche #side .mqquick button{min-height:40px;font-weight:800}',
  B+'.op-fiche #side p.note[data-opl="tip"],'+B+'.op-livre #side p.note[data-opl="tip"]{display:none}',
  B+' #side .op-tip{text-decoration:underline dotted rgba(245,197,24,.6);text-underline-offset:3px;cursor:help}',
  B+'.op-fiche #side details.op-more{padding:0}',B+'.op-fiche #side details.op-more>summary{cursor:pointer;padding:10px 12px;font-weight:800;color:#f5c518;list-style:none}',
  B+'.op-fiche #side details.op-more>summary::after{content:" ▾"}',B+'.op-fiche #side details.op-more[open]>summary::after{content:" ▴"}',
  B+'.op-fiche #side details.op-more>.card{margin:0 8px 8px;box-shadow:none}',
  /* ===== LIVRE DE BORD ===== */
  '#op-livre-h,#op-livre-bg{display:none}',
  /* le panneau sort du plan de la carte pour passer au-dessus du voile ; la carte derrière est assombrie */
  /* .app est un contexte d'empilement (z 20) : on l'élève, le voile vit dedans, juste sous #main */
  B+'.op-livre .app{z-index:56!important}',B+'.op-livre #main{z-index:56!important}',B+'.op-livre #cs-hud,'+B+'.op-livre #b-opui,'+B+'.op-livre #rt-isle,'+B+'.op-livre #op-menu{visibility:hidden!important}',B+'.op-livre #mapwrap{filter:brightness(.42) saturate(.8)}',B+'.op-livre #mapwrap>*:not(canvas){visibility:hidden}',
  B+'.op-livre #op-livre-bg{display:block;position:fixed;inset:0;z-index:55;background:rgba(4,10,18,.62)}',
  B+'.op-livre #op-livre-h{display:flex;align-items:center;gap:18px;position:fixed;left:60px;right:60px;top:40px;height:60px;box-sizing:border-box;z-index:58;padding:0 18px;border:2px solid #060607;border-bottom:0;border-radius:18px 18px 0 0;background:linear-gradient(180deg,#704522,#47280f);box-shadow:inset 0 0 0 1px rgba(245,197,24,.45)}',
  B+'.op-livre #op-livre-h h2{margin:0;font:400 30px/1 "OPBangers",Impact,sans-serif;letter-spacing:1.5px;color:#f5c518;-webkit-text-stroke:1.5px #2a1a0c;paint-order:stroke fill}',
  B+'.op-livre #op-livre-h nav{display:flex;gap:4px}',
  B+'.op-livre #op-livre-h nav button{height:40px;padding:0 16px;border-radius:10px;border:1.5px solid rgba(214,166,58,.5);background:#1b1b20;color:#fdf6e3;font:700 13px Inter,system-ui,sans-serif;cursor:pointer;position:relative}',
  B+'.op-livre #op-livre-h nav button.on{background:#f5c518;color:#2a1a0c;border:2px solid #2a1a0c;font-weight:800}',
  B+'.op-livre #op-livre-h small{margin-left:auto;font:600 12px Inter,system-ui,sans-serif;color:#ffe7a3}',
  B+'.op-livre #op-livre-h .x{width:38px;height:38px;border-radius:10px;border:2px solid #2a1a0c;background:#f8ecd0;color:#2a1a0c;font:800 15px Inter,sans-serif;cursor:pointer}',
  B+'.op-livre #side{position:fixed!important;left:60px!important;right:60px!important;top:100px!important;bottom:40px!important;width:auto!important;max-height:none!important;z-index:57!important;transform:none!important;border-radius:0 0 18px 18px!important;padding:16px 18px 18px!important;',
  'display:grid!important;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));align-content:start;gap:14px;overflow:auto}',
  B+'.op-livre #side>*{margin:0!important;min-width:0}',
  B+'.op-livre #side>.subtabs{grid-column:1/-1;display:flex;gap:6px}',
  B+'.op-livre #side>.subtabs button{height:36px;padding:0 16px;border-radius:999px;font-weight:800}',
  B+'.op-livre #side>.subtabs button.on{background:#f5c518!important;color:#2a1a0c!important;border:2px solid #2a1a0c!important}',
  B+'.op-livre #side .card{border-radius:14px}',
  B+'.op-livre.op-ui #b-side,'+B+'.op-livre #b-side{display:none!important}',
  /* Économie : le bilan sur toute la largeur, en grands chiffres */
  B+'.op-livre.op-tab-eco #side>.card.mq,'+B+'.op-livre.op-tab-city #side>.card.mq,'+B+'.op-livre.op-tab-tech #side>.card.mq{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;align-items:start;background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important}',
  B+'.op-livre.op-tab-eco #side>.card.mq>section,'+B+'.op-livre.op-tab-city #side>.card.mq>section,'+B+'.op-livre.op-tab-tech #side>.card.mq>section{background:#17171b;border:1px solid #2c2c33;border-radius:14px;padding:14px;margin:0!important}',
  B+'.op-livre #side .mqrow .mqn b{font-size:30px}',
  /* Équipe : cartes « recrutables » en grille d'avis de recherche */
  B+'.op-livre.op-tab-leg #side>.card:has(.chc){grid-column:1/-1;display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px;align-items:start}',
  B+'.op-livre.op-tab-leg #side>.card:has(.chc)>.pgsec,'+B+'.op-livre.op-tab-leg #side>.card:has(.chc)>details>summary{grid-column:1/-1}',
  B+'.op-livre.op-tab-leg #side>.card>details[open]{grid-column:1/-1;display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}',
  B+'.op-livre #side .chc{margin:0!important;border-radius:10px!important;background:linear-gradient(180deg,#fff6df,#ead197)!important;color:#2a1a0c!important;border:3px solid #2a1a0c!important;box-shadow:0 8px 18px rgba(0,0,0,.45)!important;padding:10px 12px 12px!important}',
  B+'.op-livre #side .chc *{color:inherit}',B+'.op-livre #side .chc .ln.miss{color:#a01515!important;font-weight:800}',B+'.op-livre #side .chc .rar{border-color:#2a1a0c!important}',
  B+'.op-livre #side .chc .t b{font:400 24px/1 "OPBangers",Impact,sans-serif;letter-spacing:.8px}',
  B+'.op-livre #side .chc .acts button{background:linear-gradient(180deg,#4a2c14,#2e1a0a)!important;color:#f8ecd0!important;border:1.5px solid #2a1a0c!important}',
  B+'.op-livre #side .chc.dim{opacity:.75}',
  B+' #side .op-wp{display:none}',B+'.op-livre #side .op-wp{display:flex;flex-direction:column;align-items:center;margin-bottom:6px}',
  B+'.op-livre #side .op-wp b{font:400 24px/1 "OPBangers",Impact,sans-serif;letter-spacing:3px}',
  B+'.op-livre #side .op-wp img,'+B+'.op-livre #side .op-wp span{display:flex;align-items:flex-end;justify-content:center;width:100%;height:132px;object-fit:contain;object-position:bottom;border:2px solid #2a1a0c;background:#e9d6a8;box-sizing:border-box;font-size:11px;font-weight:700;color:#8a7a5a}',
  B+'.op-livre #side .op-wp span{align-items:center}',
  /* Diplomatie : un camp par carte, « Proposer ▾ » regroupe les accords */
  B+'.op-livre.op-tab-dip #side .emp-h b{font-size:16px}',
  B+'.op-livre #side .act{display:flex;flex-wrap:wrap;gap:6px;align-items:flex-start;position:relative}',
  B+' #side details.op-prop{position:relative;flex:1}',
  B+' #side details.op-prop>summary{list-style:none;cursor:pointer;height:36px;display:flex;align-items:center;justify-content:center;border-radius:9px;border:2px solid #2a1a0c;background:linear-gradient(180deg,#ffe066,#f0a90f);color:#2a1a0c;font:800 13px Inter,system-ui,sans-serif}',
  B+' #side details.op-prop>summary::-webkit-details-marker{display:none}',
  B+' #side details.op-prop .op-pm{position:absolute;left:0;top:42px;z-index:5;min-width:260px;display:flex;flex-direction:column;gap:2px;padding:6px;border-radius:12px;background:#f8ecd0;border:2px solid #2a1a0c;box-shadow:0 14px 30px rgba(0,0,0,.6)}',
  B+' #side details.op-prop .op-pm button{text-align:left;min-height:36px;background:transparent!important;color:#2a1a0c!important;border:0!important;border-radius:8px!important;font-weight:700!important}',
  B+' #side details.op-prop .op-pm button:hover{background:#ead197!important}',B+' #side details.op-prop .op-pm button:disabled{opacity:.5}',
  B+' #side .act button[data-act="war"]{border:1.5px solid #ff7a6b!important;background:#2a1214!important;color:#ff8a7a!important;font-weight:800!important}',
  /* textes d'aide restants : plus discrets */
  B+'.op-livre #side p.note{font-size:12px;opacity:.9}'
].join('\n');document.head.appendChild(st);}
