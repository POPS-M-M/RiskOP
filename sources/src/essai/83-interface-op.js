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
  B+'{--bg:#061a2e;--panel:#0d2e50;--panel-2:#123c66;--line:#2c5c8a;--ink:#fdf6e3;--muted:#a9c3dc;--accent:#f5c518;--accent-ink:#2a1a0c;--sea:#0b3a66;--good:#5fd18f;--bad:#ff7a6b;'
   +'--f-display:"OPBangers","Big Shoulders Display",Impact,sans-serif;--op-bois:#5a361a;--op-bois2:#3a2110;--op-encre:#2a1a0c;--op-par:#f8ecd0;--op-par2:#ead197;--op-rouge:#d62828;--op-or:#f5c518;background:#061a2e}',
  /* ---- disposition : carte plein écran, panneaux au-dessus ---- */
  B+' .app{position:fixed;inset:0;max-width:none;margin:0;height:auto!important;padding:8px 380px 0 10px;display:flex;flex-direction:column;gap:6px;align-items:stretch;pointer-events:none;z-index:20}',
  B+' .app>*{pointer-events:auto;position:relative;z-index:1}',
  B+' #main{position:fixed!important;inset:0;display:block;z-index:0;margin:0;padding:0}',
  B+' #mapwrap{position:absolute!important;inset:0;width:100vw;height:100vh;aspect-ratio:auto!important;border:0!important;border-radius:0!important;background:radial-gradient(ellipse at 50% 40%,#11507f,#08294a 70%,#051a30)}',
  B+' #side{position:fixed!important;top:8px;right:10px;bottom:10px;width:356px;z-index:2;display:block}',
  B+' .zoomctl{top:auto!important;bottom:96px;right:378px!important}',
  B+' #log{top:var(--opui-top,214px)!important;left:344px!important}',
  B+' #b-end{right:380px!important;bottom:16px!important}',
  B+' #cs-hud{top:var(--opui-top,214px)!important;z-index:25;max-height:calc(100vh - var(--opui-top,214px) - 170px);overflow:auto}',
  B+' #rt-go,'+B+' #tac-go,'+B+' #gfx-demo,'+B+' #gfx-btn,'+B+' #b-opui{right:auto!important;left:auto!important}',
  /* boutons d'essai : regroupés en bas, au-dessus de la mini-carte, hors du panneau de l'île */
  B+' #rt-go{position:fixed!important;bottom:auto!important;top:auto!important}',
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
  B+' .pl{background:linear-gradient(90deg,rgba(0,0,0,.0),rgba(0,0,0,.0)),#0b2a4a;background:linear-gradient(90deg,color-mix(in srgb,var(--c) 34%,#0b2a4a) 0%,#0b2a4a 62%);border:2px solid #061626;border-left:7px solid var(--c);border-radius:10px 22px 22px 10px;box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 3px 10px rgba(0,0,0,.45)}',
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
  B+' .side{background:linear-gradient(180deg,#0f3458,#0a2440);border:2px solid var(--op-encre);border-radius:16px;box-shadow:inset 0 0 0 3px #6b4220,inset 0 0 0 4px rgba(245,197,24,.4),0 10px 28px rgba(0,0,0,.6);padding:0 12px 12px}',
  B+' .side::-webkit-scrollbar{width:8px}'+B+' .side::-webkit-scrollbar-thumb{background:#6b4220;border-radius:8px}',
  B+' .tabs{background:transparent!important;padding-top:10px;gap:5px}',B+' .tabs .ti{font-size:18px}',
  B+' .budget{background:rgba(0,0,0,.25);border:1.5px solid #2c5c8a;border-radius:10px}',
  B+' #side .card{background:linear-gradient(180deg,#123a62,#0e3052);border:1.5px solid #2c5c8a;border-radius:13px;box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 3px 10px rgba(0,0,0,.3)}',
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
  B+' .minibox{background:#0a2440;border:2px solid var(--op-encre);border-radius:12px;box-shadow:inset 0 0 0 2px #6b4220,0 6px 16px rgba(0,0,0,.55);opacity:.95}',
  B+' .log div{background:linear-gradient(180deg,#fff6df,var(--op-par2));color:var(--op-encre);border:1.5px solid var(--op-encre);border-radius:8px;margin-bottom:3px;font-weight:600;box-shadow:0 2px 6px rgba(0,0,0,.35)}',
  B+' #cs-hud{background:linear-gradient(180deg,#0f3458,#0a2440)!important;border:2px solid var(--op-encre)!important;border-radius:14px!important;box-shadow:inset 0 0 0 2px #6b4220,inset 0 0 0 3px rgba(245,197,24,.35),0 8px 22px rgba(0,0,0,.55)!important}',
  B+' #cs-hud .cs-top b{font:400 19px/1 var(--f-display);letter-spacing:.8px;color:var(--op-or)}',
  /* ---- accueil : siège = avis de recherche ---- */
  B+' #overlay{z-index:60!important;top:var(--opui-top,150px)!important;right:370px!important}',
  B+' #overlay .intro{background:linear-gradient(180deg,#0f3458,#0a2440);border:2px solid var(--op-encre);border-radius:18px;box-shadow:inset 0 0 0 3px #6b4220,inset 0 0 0 4px rgba(245,197,24,.45),0 18px 50px rgba(0,0,0,.65)}',
  B+' #overlay h2{font:400 40px/1.02 var(--f-display);letter-spacing:1.5px;color:var(--op-or);-webkit-text-stroke:2px var(--op-encre);paint-order:stroke fill;text-shadow:0 3px 0 var(--op-rouge),0 5px 0 var(--op-encre);text-transform:uppercase}',
  B+' #overlay h3{font:400 20px/1 var(--f-display);letter-spacing:1px;color:var(--op-or)}',
  B+' #overlay .crew{background:linear-gradient(180deg,#fff6df,var(--op-par2));color:var(--op-encre);border:2px solid var(--op-encre);border-radius:12px;box-shadow:inset 0 -3px 0 rgba(160,110,30,.25),0 3px 0 rgba(0,0,0,.4)}',
  B+' #overlay .crew *{color:inherit}',B+' #overlay .crew small{color:#5b4220}',
  B+' #overlay .crew.on{background:linear-gradient(180deg,#ffe066,#f0b21a);box-shadow:0 0 0 3px var(--op-rouge),0 4px 0 rgba(0,0,0,.45)}',
  B+' #overlay .btn.primary{font:400 24px/1 var(--f-display);letter-spacing:1.4px;background:linear-gradient(180deg,#ffe066,#f0a90f);color:var(--op-encre);border:3px solid var(--op-encre);border-radius:12px;box-shadow:0 4px 0 #8e1414,0 5px 0 var(--op-encre)}',
  B+' #overlay select,'+B+' #overlay input{background:#0a2440;border:1.5px solid #2c5c8a;color:var(--op-par);border-radius:8px}',
  /* interrupteur de comparaison */
  '#b-opui{position:fixed;left:12px;bottom:160px;z-index:9999;font:800 12px system-ui,sans-serif;padding:7px 11px;border-radius:10px;border:2px solid #2a1a0c;background:#f8ecd0;color:#2a1a0c;cursor:pointer;box-shadow:0 3px 0 rgba(0,0,0,.45)}',
  'body:not(.op-ui) #b-opui{left:auto;right:14px;bottom:52px}',
  'body.rtrun #b-opui,body.tacrun #b-opui{display:none}',
  /* boutons d'essai alignés au-dessus du bouton de fin de tour (nouvelle interface) */
  B+' #rt-go{right:380px!important;left:auto!important;bottom:78px!important}',
  B+' #tac-go{position:fixed;right:380px!important;left:auto!important;bottom:122px!important}',
  B+' #gfx-demo{position:fixed;right:380px!important;left:auto!important;bottom:160px!important}',
  B+' #gfx-btn{position:fixed;right:380px!important;left:auto!important;bottom:198px!important}',
  B+' .zoomctl{bottom:236px!important}'
].join('\n');document.head.appendChild(st);}
{const go=()=>{if(!document.body)return setTimeout(go,50);let b=document.getElementById('b-opui');if(!b){b=document.createElement('button');b.id='b-opui';b.title='Comparer avec l\'interface d\'origine (rien d\'autre ne change)';
  b.addEventListener('click',e=>{e.stopPropagation();opuiSet(!OPUI.on);});document.body.appendChild(b);}opuiSet(OPUI.on);};go();}
