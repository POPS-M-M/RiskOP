/* ================= OBJECTIFS DISCRETS (version test) : la fiche « Objectif n / 7 » ne reste plus affichée en grand en permanence =================
   Elle s'ouvre quand l'objectif change (7 s), puis se replie en une petite pastille ; un clic la rouvre. Les boutons d'origine (Passer, Masquer les objectifs)
   et le contenu des objectifs sont inchangés : seule la présentation change. */
{
  const st=document.createElement('style');
  st.textContent='.coach.mini.pxc{display:block;height:auto!important;min-height:0!important;width:auto;max-width:min(300px,calc(100% - 24px));padding:4px 10px;cursor:pointer;opacity:.92;bottom:auto;top:8px;left:50%}.coach.mini.pxc .ct{height:auto!important;min-height:0!important;display:block}.coach.mini.pxc>:not(.ct){display:none!important}.coach.mini.pxc .ct small{display:none}.coach.mini.pxc .ct b{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.coach.mini.pxc .ct b::before{content:"◈ "}'
   +'body.b3run .coach,body.pxatl .coach{display:none!important}';
  document.head.appendChild(st);
  const el=document.getElementById('coach');
  if(el){let key='',t0=0,open=true,ptr=false;
    el.addEventListener('click',e=>{if(e.target.closest('button'))return;if(el.classList.contains('pxc')){open=true;t0=performance.now();el.classList.remove('pxc');}else if(el.classList.contains('mini')){open=false;el.classList.add('pxc');}});
    setInterval(()=>{
      if(el.hidden||!el.classList.contains('mini')){el.classList.remove('pxc');key='';return;}
      const b=el.querySelector('.ct b'),k=b?b.textContent:'';
      if(k!==key){key=k;open=true;t0=performance.now();}
      if(open&&performance.now()-t0>7000)open=false;
      el.classList.toggle('pxc',!open);
    },350);
  }
}
