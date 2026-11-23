/* ================= INTERFACE DU RESTE DU JEU : carte stratégique, accueil, panneaux (version test, branche essai/aaa-proto) =================
   Même direction que l'interface de bataille : bois des navires (bandeau, cadres), parchemin des avis de recherche (ressources, tour,
   fiche choisie, sièges), bleu de la mer (panneaux), or du chapeau de paille (actions), lettrage manga pour les titres.
   Disposition : la carte occupe tout l'écran ; le bandeau, les équipages et le tour flottent en haut à gauche ; le panneau de l'île
   occupe le bord droit sur toute la hauteur.
   Aucun élément, identifiant, bouton, texte ni zone de clic n'est retiré : seule la présentation change. Le canevas garde les proportions
   de la carte (fonction resize d'origine), donc les clics sur les îles restent exacts.
   Interrupteur « Interface : nouvelle / ancienne » (bas de l'écran, à côté des boutons d'essai), mémorisé dans localStorage « rk-ui ». */
const OPUI={on:true};
try{if(localStorage.getItem('rk-ui')==='ancienne')OPUI.on=false;}catch(_){}
function opuiSet(on){OPUI.on=!!on;document.body.classList.toggle('op-ui',OPUI.on);try{localStorage.setItem('rk-ui',OPUI.on?'nouvelle':'ancienne');}catch(_){}
  const b=document.getElementById('b-opui');if(b)b.textContent='Interface : '+(OPUI.on?'nouvelle':'ancienne');
  dispatchEvent(new Event('resize'));dirty=true;}
function opuiTop(){if(!OPUI.on)return;const ph=document.getElementById('phase'),pl=document.getElementById('players');let y=0;for(const e of [ph,pl]){if(!e)continue;const r=e.getBoundingClientRect();if(r.height)y=Math.max(y,r.bottom);}document.body.style.setProperty('--opui-top',Math.round((y||206)+8)+'px');}
setInterval(opuiTop,400);addEventListener('resize',()=>setTimeout(opuiTop,50));
window.__OPUI={set:opuiSet,get on(){return OPUI.on;}};
{const st=document.createElement('style');st.id='op-ui-css';const B='body.op-ui';st.textContent=[
  /* jetons de couleur : la palette d'origine est remplacée pour toute l'interface (textes, lignes, accents) */
  B+'{--bg:#08080a;--panel:#131316;--panel-2:#1b1b20;--line:#3b3b44;--ink:#fdf6e3;--muted:#b9b4a8;--accent:#f5c518;--accent-ink:#2a1a0c;--sea:#1a1a1e;--good:#5fd18f;--bad:#ff7a6b;'
   +'--f-display:"OPBangers","Big Shoulders Display",Impact,sans-serif;--op-bois:#5a361a;--op-bois2:#3a2110;--op-encre:#2a1a0c;--op-par:#f8ecd0;--op-par2:#ead197;--op-rouge:#d62828;--op-or:#f5c518;background:#08080a}',
  /* ---- disposition : carte plein écran, panneaux au-dessus ---- */
  B+' .app{position:fixed;inset:0;max-width:none;margin:0;height:auto!important;padding:8px var(--opui-r,380px) 0 10px;display:flex;flex-direction:column;gap:6px;align-items:stretch;pointer-events:none;z-index:20}',
  B+' .app>*{pointer-events:auto;position:relative;z-index:1}',
  B+' #main{position:fixed!important;inset:0;display:block;z-index:0;margin:0;padding:0}',
  B+' #mapwrap{position:absolute!important;inset:0;width:100vw;height:100vh;aspect-ratio:auto!important;border:0!important;border-radius:0!important;background:radial-gradient(ellipse at 50% 40%,#1a1a1e,#0e0e10 70%,#060607)}',
  B+' #log{top:var(--opui-top,214px)!important;left:344px!important}',
  /* ---- ergonomie ---- */
  B+'{--opui-r:392px;--opui-tab:366px}'+B+'.op-side-off{--opui-r:14px;--opui-tab:0px}',
  /* panneau de l'île : hauteur du contenu (pas de grand vide), escamotable sur le côté */
  B+' #side{position:fixed!important;top:8px;right:10px;bottom:auto!important;max-height:calc(100vh - 18px);width:356px;z-index:2;display:block;transition:transform .28s cubic-bezier(.2,.8,.2,1)}',
  B+'.op-side-off #side{transform:translateX(calc(100% + 16px))}',
  '#b-side{display:none}',
  B+' #b-side{display:flex;align-items:center;justify-content:center;position:fixed;top:50%;right:var(--opui-tab);top:200px;z-index:30;width:22px;height:96px;padding:0;border-radius:10px 0 0 10px;border:2px solid var(--op-encre);border-right:0;background:linear-gradient(90deg,#ffe066,#e8a90d);color:var(--op-encre);font:900 14px/1 system-ui,sans-serif;cursor:pointer;writing-mode:vertical-rl;letter-spacing:1px;box-shadow:-3px 3px 10px rgba(0,0,0,.45);transition:right .28s cubic-bezier(.2,.8,.2,1)}',
  B+' #b-side{transform:none}',
  B+' .zoomctl{top:auto!important;bottom:236px!important;right:calc(var(--opui-r) + 4px)!important;transition:right .28s}',
  B+' #b-end{right:var(--opui-r)!important;bottom:16px!important;transition:right .28s}',
  /* course : sous la pile du haut, hauteur du contenu ; repliée = simple bandeau */
  B+' #cs-hud{top:var(--opui-top,214px)!important;bottom:auto!important;z-index:25;max-height:calc(100vh - var(--opui-top,214px) - 170px);overflow:auto;width:300px}',
  B+' #cs-hud.fold{width:auto!important;overflow:hidden}'+B+' #cs-hud.fold .cs-top{border-bottom:0;gap:10px;padding:5px 8px 5px 10px}'+B+' #cs-hud.fold .cs-top b{font-size:15px}',
  /* tour : une ligne ; clic sur le bandeau pour voir les camps et l'aide en entier */
  B+' .phase{cursor:pointer;position:relative;padding-right:118px}',
  B+' .phase::after{content:"détails ▾";position:absolute;right:38px;top:6px;font:800 10.5px system-ui,sans-serif;color:#6b4a1e;background:#f6e2b0;padding:3px 7px;border-radius:7px;border:1px solid rgba(42,26,12,.3);pointer-events:none;z-index:2}',
  B+'.op-phase-open .phase::after{content:"réduire ▴"}',
  B+':not(.op-phase-open) .phase .ph-sub{display:none}',
  B+':not(.op-phase-open) .phase .ph-camps{flex-wrap:nowrap;overflow:hidden;min-width:0;flex:1 1 0;-webkit-mask-image:linear-gradient(90deg,#000 88%,transparent);mask-image:linear-gradient(90deg,#000 88%,transparent)}',
  B+' .phase .ph-q{position:absolute;right:8px;top:5px}',
  /* boutons d'essai : un tiroir repliable au-dessus de « Fin de tour » */
  'body:not(.op-ui) #op-essais{display:contents}body:not(.op-ui) #op-essais>.oe-h{display:none}',
  B+' #op-essais{position:fixed;right:var(--opui-r);bottom:78px;z-index:30;display:flex;flex-direction:column;align-items:flex-end;gap:5px;transition:right .28s}',
  B+' #op-essais>*:not(.oe-h){position:static!important;inset:auto!important;margin:0!important;transform:none!important}',
  B+'.op-essais-off #op-essais>*:not(.oe-h){display:none!important}',
  B+' #op-essais>.oe-h{order:99;font:800 11px system-ui,sans-serif;padding:4px 10px;border-radius:9px;border:1.5px solid var(--op-encre);background:#f8ecd0;color:var(--op-encre);cursor:pointer;box-shadow:0 2px 0 rgba(0,0,0,.45)}',
  '#b-opui{font:800 12px system-ui,sans-serif;padding:7px 11px;border-radius:10px;border:2px solid #2a1a0c;background:#f8ecd0;color:#2a1a0c;cursor:pointer;box-shadow:0 3px 0 rgba(0,0,0,.45)}',
  'body:not(.op-ui) #b-opui{position:fixed;left:14px;bottom:14px;z-index:9999}',
  'body.rtrun #op-essais,body.tacrun #op-essais,body.rtrun #b-side,body.tacrun #b-side{display:none!important}',
  /* ---- bandeau du haut : planche de bois, liseré doré ---- */
  B+' .hud{background:linear-gradient(180deg,rgba(255,255,255,.10),rgba(0,0,0,.28)),repeating-linear-gradient(90deg,transparent 0 31px,rgba(0,0,0,.10) 31px 33px,rgba(255,255,255,.035) 33px 78px),linear-gradient(180deg,#704522,#47280f);'
   +'border:2px solid var(--op-encre);border-radius:14px;box-shadow:inset 0 0 0 1px rgba(245,197,24,.45),inset 0 -3px 0 rgba(0,0,0,.35),0 8px 22px rgba(0,0,0,.55);padding:6px 12px}',
  B+' .hud{gap:6px 12px}',B+' .hud button{padding:4px 9px;font-size:12.5px;min-height:30px}',
  B+' .brand h1{font:400 30px/1 var(--f-display);letter-spacing:1.5px;color:var(--op-or);-webkit-text-stroke:2px var(--op-encre);paint-order:stroke fill;text-shadow:0 3px 0 var(--op-rouge),0 4px 0 var(--op-encre);margin:0}',
  B+' .brand .clock{color:#ffe7a3;font-weight:800;letter-spacing:.3px}',
  /* ressources : jetons de parchemin */
  B+' .chip{background:linear-gradient(180deg,#fff6df,var(--op-par2));border:2px solid var(--op-encre);border-radius:11px;color:var(--op-encre);box-shadow:inset 0 -3px 0 rgba(160,110,30,.28),0 2px 0 rgba(0,0,0,.45);padding:3px 10px 4px 8px}',
  B+' .chip *{color:inherit}',B+' .chip b{font:400 17px/1 var(--f-display);letter-spacing:.5px}',B+' .res{gap:5px}',B+' .chip{padding:2px 8px 3px 6px;font-size:11.5px}',B+' .chip i.ic{font-style:normal;color:#8a5a12}',
  B+' .chip small,'+B+' .chip em,'+B+' .chip span{color:#6b4a1e}',B+' .chip .pos,'+B+' .chip [class*=good]{color:#1d7a45}',
  /* boutons du bandeau : bois sombre, texte parchemin ; actif : or */
  B+' .hud button,'+B+' .tabs button,'+B+' .zoomctl button,'+B+' .ph-q,'+B+' .cs-fold{background:linear-gradient(180deg,#4a2c14,#2e1a0a);border:1.5px solid rgba(214,166,58,.55);color:var(--op-par);border-radius:9px;box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 2px 0 rgba(0,0,0,.45);font-weight:700}',
  B+' .hud button:hover,'+B+' .tabs button:hover,'+B+' .zoomctl button:hover{border-color:var(--op-or);color:#fff}',
  B+' .hud button.on,'+B+' .tabs button.on,'+B+' .zoomctl button.on,'+B+' .speed button.on,'+B+' .segs button.on{background:linear-gradient(180deg,#ffe066,#e8a90d)!important;color:var(--op-encre)!important;border-color:var(--op-encre)!important;text-shadow:none}',
  B+' .speed{border-radius:10px;overflow:hidden;border:1.5px solid var(--op-encre)}',B+' .speed button{border-radius:0!important;box-shadow:none!important}',
  /* ---- équipages : fanions à la couleur de chacun ---- */
  B+' #players{gap:6px}',
  B+' .pl{background:linear-gradient(90deg,rgba(0,0,0,.0),rgba(0,0,0,.0)),#121215;background:linear-gradient(90deg,color-mix(in srgb,var(--c) 34%,#121215) 0%,#121215 62%);border:2px solid #060607;border-left:7px solid var(--c);border-radius:10px 22px 22px 10px;box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 3px 10px rgba(0,0,0,.45)}',
  B+' .pl.me{box-shadow:0 0 0 2px var(--op-or),inset 0 1px 0 rgba(255,255,255,.18),0 3px 12px rgba(0,0,0,.5)}',
  B+' .pl{padding:3px 8px 4px;gap:5px;font-size:12.5px}',B+' .pl .nm{font-weight:800;letter-spacing:.2px;min-width:3.5em}',B+' .pl .sts{font-size:11px}',B+' .pl .pill{font-size:9.5px;padding:0 5px}',B+' .pl .you{color:var(--op-or)}',
  /* ---- tour : bandeau de parchemin ---- */
  B+' .phase{background:linear-gradient(180deg,#fff6df,var(--op-par2));border:2px solid var(--op-encre);border-left:8px solid var(--op-rouge);border-radius:12px;box-shadow:inset 0 -3px 0 rgba(160,110,30,.25),0 6px 16px rgba(0,0,0,.45);color:var(--op-encre);padding:5px 10px}',
  B+' .phase.res{border-left-color:#2f74c8}',
  B+' .phase *{color:inherit}',
  B+' .phase .ph-turn{font:400 24px/1 var(--f-display);letter-spacing:1px;color:var(--op-rouge);-webkit-text-stroke:1px var(--op-encre);paint-order:stroke fill}',
  B+' .phase .ph-state{font-weight:800}',B+' .phase .ph-sub{color:#5b4220;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11.5px}',B+' .phase .ph-sub:hover{white-space:normal}',B+' .phase{gap:4px 10px;padding:4px 10px}',B+' .phase .pc{font-size:11px;padding:0 6px}',B+' .phase .ph-camps{gap:4px}',
  B+' .phase .pc{background:#fffaf0;border:1.5px solid rgba(42,26,12,.35);border-left:4px solid var(--c);color:var(--op-encre);font-weight:700}',
  B+' .phase .pc.me{border-color:var(--op-encre);box-shadow:0 0 0 1px var(--op-encre) inset}',B+' .phase .pc em,'+B+' .phase .pc.ok em{color:#1d7a45}',
  B+' .phase .ph-bar{background:rgba(42,26,12,.18)}',
  B+' .phase .ph-mv .mv{background:#fffaf0;border-color:rgba(42,26,12,.35)}',B+' .phase .ph-mv .mv.me{background:#ffe3df;border-color:var(--op-rouge)}',
  /* ---- panneau de l'île : mer profonde, cadre de bois, titres manga ---- */
  B+' .side{background:linear-gradient(180deg,#17171b,#0e0e10);border:2px solid var(--op-encre);border-radius:16px;box-shadow:inset 0 0 0 3px #6b4220,inset 0 0 0 4px rgba(245,197,24,.4),0 10px 28px rgba(0,0,0,.6);padding:0 12px 12px}',
  B+' .side::-webkit-scrollbar{width:8px}'+B+' .side::-webkit-scrollbar-thumb{background:#6b4220;border-radius:8px}',
  B+' .tabs{background:transparent!important;padding-top:10px;gap:5px}',B+' .tabs .ti{font-size:18px}',
  B+' .budget{background:rgba(0,0,0,.25);border:1.5px solid #3b3b44;border-radius:10px}',
  B+' #side .card{background:linear-gradient(180deg,#1a1a1e,#141417);border:1.5px solid #3b3b44;border-radius:13px;box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 3px 10px rgba(0,0,0,.3)}',
  B+' .sh-ban{font-family:var(--f-display)!important;letter-spacing:1px;text-shadow:0 2px 0 var(--op-encre),0 0 12px rgba(0,0,0,.5)}',
  B+' .sh-art{border-bottom:3px solid var(--op-encre);box-shadow:inset 0 -2px 0 rgba(245,197,24,.5)}',
  B+' #side h3,'+B+' #side h4{font-family:var(--f-display);font-weight:400;letter-spacing:.8px;color:var(--op-or);text-transform:uppercase}',
  B+' #side h4{font-size:17px}',B+' #side h3{font-size:18px}',
  B+' #side button:not(.tab){border-radius:9px}',
  B+' .tag,'+B+' .pill{border-radius:999px}',
  /* ---- carte choisie : avis de recherche ---- */
  B+' .selcard{left:212px;background:linear-gradient(180deg,#fff6df,var(--op-par2));color:var(--op-encre);border:2px solid var(--op-encre);border-left:7px solid var(--c,var(--op-encre));border-radius:12px;box-shadow:inset 0 -3px 0 rgba(160,110,30,.25),0 8px 18px rgba(0,0,0,.5)}',
  B+' .selcard *{color:inherit}',B+' .selcard b,'+B+' .selcard strong{color:var(--op-encre)!important}',B+' .selcard .tag{color:#8e5b00!important;border-color:#8e5b00!important}',B+' .selcard .st,'+B+' .selcard span{color:#5b4220}',
  B+' .selcard .h{font:400 22px/1 var(--f-display);letter-spacing:.8px;color:var(--op-encre)}',
  B+' .selcard button{background:linear-gradient(180deg,#4a2c14,#2e1a0a);color:var(--op-par)!important;border:1.5px solid var(--op-encre);border-radius:9px}',
  /* ---- fin de tour : gros bouton manga ---- */
  B+' .endturn{font:400 30px/1 var(--f-display)!important;letter-spacing:1.8px;text-transform:uppercase;padding:12px 26px 10px;background:linear-gradient(180deg,#ffe066,#f0a90f)!important;color:var(--op-encre)!important;border:3px solid var(--op-encre)!important;border-radius:14px;box-shadow:0 5px 0 #8e1414,0 6px 0 var(--op-encre),0 12px 24px rgba(0,0,0,.55)!important}',
  B+' .endturn:active{transform:translateY(3px);box-shadow:0 2px 0 #8e1414,0 3px 0 var(--op-encre),0 8px 16px rgba(0,0,0,.5)!important}',
  /* ---- mini-carte, journal, course ---- */
  B+' .minibox{background:#0e0e10;border:2px solid var(--op-encre);border-radius:12px;box-shadow:inset 0 0 0 2px #6b4220,0 6px 16px rgba(0,0,0,.55);opacity:.95}',
  B+' .log div{background:linear-gradient(180deg,#fff6df,var(--op-par2));color:var(--op-encre);border:1.5px solid var(--op-encre);border-radius:8px;margin-bottom:3px;font-weight:600;box-shadow:0 2px 6px rgba(0,0,0,.35)}',
  B+' #cs-hud{background:linear-gradient(180deg,#17171b,#0e0e10)!important;border:2px solid var(--op-encre)!important;border-radius:14px!important;box-shadow:inset 0 0 0 2px #6b4220,inset 0 0 0 3px rgba(245,197,24,.35),0 8px 22px rgba(0,0,0,.55)!important}',
  B+' #cs-hud .cs-top b{font:400 19px/1 var(--f-display);letter-spacing:.8px;color:var(--op-or)}',
  /* ---- accueil : siège = avis de recherche ---- */
  B+' #overlay{z-index:60!important;top:var(--opui-top,150px)!important;right:370px!important}',
  B+' #overlay .intro{background:linear-gradient(180deg,#17171b,#0e0e10);border:2px solid var(--op-encre);border-radius:18px;box-shadow:inset 0 0 0 3px #6b4220,inset 0 0 0 4px rgba(245,197,24,.45),0 18px 50px rgba(0,0,0,.65)}',
  B+' #overlay h2{font:400 40px/1.02 var(--f-display);letter-spacing:1.5px;color:var(--op-or);-webkit-text-stroke:2px var(--op-encre);paint-order:stroke fill;text-shadow:0 3px 0 var(--op-rouge),0 5px 0 var(--op-encre);text-transform:uppercase}',
  B+' #overlay h3{font:400 20px/1 var(--f-display);letter-spacing:1px;color:var(--op-or)}',
  B+' #overlay .crew{background:linear-gradient(180deg,#fff6df,var(--op-par2));color:var(--op-encre);border:2px solid var(--op-encre);border-radius:12px;box-shadow:inset 0 -3px 0 rgba(160,110,30,.25),0 3px 0 rgba(0,0,0,.4)}',
  B+' #overlay .crew *{color:inherit}',B+' #overlay .crew small{color:#5b4220}',
  B+' #overlay .crew.on{background:linear-gradient(180deg,#ffe066,#f0b21a);box-shadow:0 0 0 3px var(--op-rouge),0 4px 0 rgba(0,0,0,.45)}',
  B+' #overlay .btn.primary{font:400 24px/1 var(--f-display);letter-spacing:1.4px;background:linear-gradient(180deg,#ffe066,#f0a90f);color:var(--op-encre);border:3px solid var(--op-encre);border-radius:12px;box-shadow:0 4px 0 #8e1414,0 5px 0 var(--op-encre)}',
  B+' #overlay select,'+B+' #overlay input{background:#0e0e10;border:1.5px solid #3b3b44;color:var(--op-par);border-radius:8px}',
  /* interrupteur de comparaison */
].join('\n');document.head.appendChild(st);}
{const go=()=>{if(!document.body)return setTimeout(go,50);let b=document.getElementById('b-opui');if(!b){b=document.createElement('button');b.id='b-opui';b.title='Comparer avec l\'interface d\'origine (rien d\'autre ne change)';
  b.addEventListener('click',e=>{e.stopPropagation();opuiSet(!OPUI.on);});document.body.appendChild(b);}opuiSet(OPUI.on);};go();}

/* ---------- ergonomie : panneau de l'île escamotable, tiroir des essais, bandeau du tour dépliable (états mémorisés) ---------- */
const OPUI_ST={side:true,essais:true,phase:false};
try{const o=JSON.parse(localStorage.getItem('rk-ui-st')||'{}');Object.assign(OPUI_ST,o);}catch(_){}
function opuiSave(){try{localStorage.setItem('rk-ui-st',JSON.stringify(OPUI_ST));}catch(_){}}
function opuiApply(){const b=document.body;if(!b)return;b.classList.toggle('op-side-off',!OPUI_ST.side);b.classList.toggle('op-essais-off',!OPUI_ST.essais);b.classList.toggle('op-phase-open',!!OPUI_ST.phase);
  const t=document.getElementById('b-side');if(t){t.textContent=OPUI_ST.side?'▸ masquer':'◂ île';t.title=OPUI_ST.side?'Masquer le panneau de l\'île (la carte prend la place)':'Afficher le panneau de l\'île';}
  const h=document.querySelector('#op-essais>.oe-h');if(h)h.textContent=OPUI_ST.essais?'Essais ▾':'Essais ▸';
  dispatchEvent(new Event('resize'));}
function opuiSide(on){OPUI_ST.side=!!on;opuiSave();opuiApply();}
{const go=()=>{if(!document.body)return setTimeout(go,50);
  let t=document.getElementById('b-side');if(!t){t=document.createElement('button');t.id='b-side';t.addEventListener('click',e=>{e.stopPropagation();opuiSide(!OPUI_ST.side);});document.body.appendChild(t);}
  let d=document.getElementById('op-essais');if(!d){d=document.createElement('div');d.id='op-essais';const h=document.createElement('button');h.className='oe-h';h.title='Afficher / masquer les boutons d\'essai';
    h.addEventListener('click',e=>{e.stopPropagation();OPUI_ST.essais=!OPUI_ST.essais;opuiSave();opuiApply();});d.appendChild(h);document.body.appendChild(d);}
  /* les boutons d'essai sont créés par leurs modules ; ils sont rangés dans le tiroir dès qu'ils existent (mêmes éléments, mêmes actions) */
  let k=0;const adopt=()=>{for(const id of ['b-opui','gfx-btn','gfx-demo','tac-go','rt-go']){const e=document.getElementById(id);if(e&&e.parentNode!==d)d.insertBefore(e,d.firstChild);}if(++k<40)setTimeout(adopt,250);};adopt();
  opuiApply();};go();}
/* bandeau du tour : un clic (hors boutons) déplie ou replie les détails */
document.addEventListener('click',e=>{if(!OPUI.on)return;const ph=e.target.closest&&e.target.closest('#phase');if(!ph||e.target.closest('button,a,.mv,input,select'))return;OPUI_ST.phase=!OPUI_ST.phase;opuiSave();opuiApply();});
/* « Fiche de l'île » ou un double-clic sur la carte rouvre le panneau s'il est masqué */
document.addEventListener('click',e=>{if(!OPUI.on||OPUI_ST.side)return;const b=e.target.closest&&e.target.closest('#selcard button');if(b&&/fiche/i.test(b.textContent||''))opuiSide(true);},true);
window.__OPUI.side=opuiSide;
