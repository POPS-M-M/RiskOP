/* ================= Rendu 2.5D des îles : moteur =================
   Couche de RENDU seulement : lit terrs (x, y, rad, name, owner, type) et ne modifie aucune donnée de jeu.
   Les clics restent gérés par la grille logique (terrAt) : le dessin peut changer sans toucher aux zones de sélection.
   - Chaque île est calculée UNE fois, en tâche de fond (tranches de quelques ms par image) : champ d'altitude projeté
     en vue 3/4, falaises, plages, lagon, ombre portée, puis bâtiments, arbres et monuments (rk25_lm.js) selon sa fiche (rk25_defs.js).
   - Le résultat est gardé dans ce navigateur (IndexedDB, base « risk-op-rendu ») : aux visites suivantes, rien n'est recalculé.
   - Mémoire : une miniature par île + la pleine définition des seules îles proches de la caméra (au plus 14).
   - À chaque image : recopie de l'image, liseré du camp, écume, et petits effets animés (drapeaux, fumée, neige…). */
const R25={on:true,K:8,ver:'r25-5',cache:new Map(),ms:0,maxSlice:0,dl:0,lru:[],FULLMAX:14,db:null,dbReady:false,built:0,fromDB:0,sea:null,allReady:false,order:null};
try{if(localStorage.getItem('rk-25')==='0')R25.on=false;}catch(_){}
const r25Ready=t=>{const e=R25.cache.get(t.id);return !!(e&&e.st==='ready');};
const r25Art=t=>R25.on&&ISLE_ART[t.name]&&r25Ready(t)?ISLE_ART[t.name]:null;
/* ---------- construction d'une île (générateur découpé en tranches) ---------- */
function* r25Build(t,D){
  const B=BIOMES[D.b]||BIOMES.tropical,P=B.pal,K=R25.K,Z=K/6,R=t.rad,S=D.seed||(nameHash(shapeKey(t.name))%997)+11,u=R*K,arab=D.layout==='alabasta';
  const rng=mulberry32(S*7+3),rnd=()=>rng();
  const r0=mulberry32(nameHash(shapeKey(t.name)));const sh={a2:.04+r0()*.04,p2:r0()*6.28,a3:.02+r0()*.03,p3:r0()*6.28,a5:.01+r0()*.02,p5:r0()*6.28};
  const NA=720,LUT=new Float32Array(NA+1);for(let i=0;i<=NA;i++){const th=i/NA*6.2832-Math.PI;LUT[i]=1+.05*(fbm2(Math.cos(th)*3+9,Math.sin(th)*3+9,S,4)-.5)*2;}
  const CLF=new Float32Array(NA+1);for(let i=0;i<=NA;i++){const th=i/NA*6.2832-Math.PI;CLF[i]=fbm2(Math.cos(th)*2+4,Math.sin(th)*2+4,S+5,3)-.5;}
  const rdAt=th=>{const i=Math.round((th+Math.PI)/6.2832*NA);return R*(1+sh.a2*Math.cos(2*th+sh.p2)+sh.a3*Math.cos(3*th+sh.p3)+sh.a5*Math.cos(5*th+sh.p5))*LUT[i];};
  const ph=arab?0:(hsh(S)-.5)*1.2,cb=arab?.1:(B.cliff-.1);
  const maxPk=Math.max(0,...(D.peaks||[]).map(p=>p[2]));
  const lmTall=({tower:110,prison:100,castleEU:90,castleJP:100,marblePalace:90,bigTree:150,mansion:70,eggDome:90,lighthouse:60,cakeCastle:100,bellTower:60,hive:75,fortress:70})[D.lm]||60;
  const TOP=Math.round((70+Math.max(maxPk*1.9,lmTall*(D.lmS||1.5)*.7+(D.lmOnPeak?maxPk*1.6:0)))*Z),Wc=Math.ceil(2*R*1.5*K),Hc=TOP+Wc,C=Wc/2,CY=TOP+Wc/2;
  const HM=Math.round((B.plateau+(B.hill||0)+(B.dune||0)+maxPk*1.9+8)*Z);
  /* plan : repères posés AVANT le relief (monument, replats, sommets, lac, canaux) */
  const at=(dx,dy)=>[C+dx*u,CY+dy*u];
  const L={flats:[],peaks:[],lakes:[],canals:[],lm:null};
  if(arab){L.lm=at(.05,-.2);L.oasis=at(-.46,.02);L.pier=at(-.5,.72);L.flats.push({x:L.lm[0],y:L.lm[1]+8*Z,r:.42*u,sx:1.3,soft:1});L.lakes.push({x:L.oasis[0],y:L.oasis[1],r:.2*u,d:6,grass:2.2});}
  else{
    for(const p of D.peaks||[]){const [x,y]=at(p[0],p[1]);L.peaks.push({x,y,h:p[2],r:p[3]*u,cr:!!p[4]});}
    if(D.lm){const [x,y]=D.lmOnPeak&&L.peaks[0]?[L.peaks[0].x,L.peaks[0].y+.05*u]:at(...(D.lmAt||[0,-.2]));L.lm=[x,y];if(!D.lmOnPeak)L.flats.push({x,y:y+4*Z,r:.3*u,sx:1.25});else L.flats.push({x,y,r:.16*u,sx:1.2,top:1});}
    if(D.lake){const [x,y]=at(D.lake[0],D.lake[1]);L.lakes.push({x,y,r:D.lake[2]*u,d:7,grass:0});}
    if(D.canals){for(const a of [0,1.05,2.1])L.canals.push({x0:C+Math.cos(a)*u*.95,y0:CY+Math.sin(a)*u*.95,x1:C-Math.cos(a)*u*.95,y1:CY-Math.sin(a)*u*.95});}
    L.pier=D.pier===0?null:at(-.52,.7);
  }
  const segD=(gx,gy,s)=>{const vx=s.x1-s.x0,vy=s.y1-s.y0,t2=Math.max(0,Math.min(1,((gx-s.x0)*vx+(gy-s.y0)*vy)/(vx*vx+vy*vy)));return Math.hypot(gx-s.x0-vx*t2,gy-s.y0-vy*t2);};
  /* altitude (px) en chaque point du sol ; −1 = eau */
  const GH2=Hc+HM,EL=new Float32Array(Wc*GH2).fill(-1),Q=new Float32Array(Wc*GH2),CM=new Float32Array(Wc*GH2),COLMAX=new Float32Array(Wc);
  const peakH=p=>p.h*Z*1.9;
  for(let gy=0;gy<GH2;gy++){if(performance.now()>R25.dl)yield;for(let gx=0;gx<Wc;gx++){
    const dx=(gx-C)/K,dy=(gy-CY)/K,th=Math.atan2(dy,dx),q=Math.hypot(dx,dy)/rdAt(th),i=gy*Wc+gx;Q[i]=q;
    if(q>=1)continue;
    const inl=1-q,ci=Math.round((th+Math.PI)/6.2832*NA);
    const cm=Math.max(0,Math.min(1,cb+1.06*Math.sin(th+Math.PI/4+ph)+.6*CLF[ci]));CM[i]=cm;
    const cliffP=sstep(0,.1,inl),beachP=.06+.94*sstep(.16,.42,inl);
    let e=B.plateau*Z*(beachP*(1-cm)+cliffP*cm);
    const wx=dx,wy=dy;
    e+=(B.hill||0)*Z*(fbm2(wx*(arab?.25:.12),wy*(arab?.25:.12),S+3,3)-.5)*(arab?1:2)*sstep(.1,.3,inl);
    let pk=0;for(const p of L.peaks){const d=Math.hypot(gx-p.x,(gy-p.y)*1.1)/p.r;if(d<1){let h=peakH(p)*Math.pow(1-d,1.15)*sstep(.02,.18,inl)*(.85+.3*fbm2(wx*.3,wy*.3,S+7,2));if(p.cr&&d<.22)h-=peakH(p)*.3*(1-d/.22);pk+=h;}}
    e+=pk;
    if(B.dune){let dz=sstep(.12,.35,inl);for(const f of L.flats)dz*=sstep(.66,1.2,Math.hypot((gx-f.x)/(f.sx||1),gy-f.y)/f.r);for(const l of L.lakes)dz*=sstep(1.25,2.25,Math.hypot(gx-l.x,gy-l.y)/l.r);
      const rid=1-Math.abs(2*fbm2(wx*.09+wy*.05,wy*.16-wx*.03,S+11,3)-1);e+=B.dune*Z*Math.pow(rid,2.2)*dz;}
    for(const f of L.flats){const d=Math.hypot((gx-f.x)/(f.sx||1),gy-f.y)/f.r;if(d<1&&!f.soft){const w=1-sstep(.55,1,d);const tgt=f.top?(B.plateau*Z+(L.peaks[0]?peakH(L.peaks[0])*.78:0)):B.plateau*Z;e=e*(1-w)+tgt*w;}}
    for(const l of L.lakes){const od=Math.hypot(gx-l.x,(gy-l.y)*1.25)/l.r;if(od<1.3)e-=l.d*Z*(1-sstep(.4,1.3,od));}
    for(const s of L.canals)if(segD(gx,gy,s)<4.2*Z&&inl>.04)e=Math.min(e,.6*Z);
    EL[i]=Math.max(.3*Z,e);if(e>COLMAX[gx])COLMAX[gx]=e;
  }}
  const el=(gx,gy)=>{gx=gx|0;gy=gy|0;if(gx<0||gy<0||gx>=Wc||gy>=GH2)return -1;return EL[gy*Wc+gx];};
  const cv=document.createElement('canvas');cv.width=Wc;cv.height=Hc;
  const cx=cv.getContext('2d'),im=cx.createImageData(Wc,Hc),Dd=im.data;
  const Lx=-.62,Ly=-.58,Lz=.53,cloud=!!B.cloud,W2=[46,140,186];
  const I={Z};
  const ground=(gx,gy,e,sl)=>{
    const i=gy*Wc+gx,q=Q[i],wx=(gx-C)/K,wy=(gy-CY)/K;
    I.e=e;I.inl=1-q;I.cm=CM[i];I.wx=wx;I.wy=wy;I.sl=sl;I.n1=fbm2(wx*.35,wy*.35,S+21,3);I.n2=fbm2(wx*.9,wy*.9,S+29,2);
    let c=B.color(I,P);
    if(L.peaks.length){const hr=sstep((B.plateau+12)*Z,(B.plateau+50)*Z,e);if(hr>0&&D.b!=='candy')c=mixc(c,P.rock||P.bas||[124,118,112],hr*.75);
      for(const p of L.peaks)if(p.cr){const d=Math.hypot(gx-p.x,(gy-p.y)*1.1)/p.r;if(d<.2)c=mixc(c,[255,112,40],1-sstep(.08,.2,d));else if(d<.32)c=mixc(c,[60,48,46],(1-sstep(.2,.32,d))*.8);}}
    for(const l of L.lakes){const od=Math.hypot(gx-l.x,(gy-l.y)*1.25)/l.r;if(l.grass&&od<l.grass)c=mixc(c,P.grass||[104,148,64],(1-sstep(1.1,l.grass,od))*(.75+.25*I.n2));
      if(!l.grass&&od<.9)c=mixc(c,W2,1-sstep(.6,.9,od));}
    for(const f of L.flats){const d=Math.hypot((gx-f.x)/(arab?1.35:(f.sx||1)),gy-f.y-(arab?6*Z:0))/(arab?u:f.r);if(arab){if(d<.33)c=mixc(c,P.pave,(1-sstep(.22,.33,d))*.9);}else if(d<.8&&P.pave)c=mixc(c,P.pave,(1-sstep(.55,.8,d))*.75);}
    if(arab){const gate=[L.lm[0],L.lm[1]+u*.42],rd2=Math.min(segD(gx,gy,{x0:L.pier[0],y0:L.pier[1],x1:gate[0],y1:gate[1]}),segD(gx,gy,{x0:gate[0],y0:gate[1],x1:L.oasis[0]+u*.12,y1:L.oasis[1]}));if(rd2<4.5*Z)c=mixc(c,[206,170,118],(1-sstep(2.5*Z,4.5*Z,rd2))*.8);}
    for(const s of L.canals){const d=segD(gx,gy,s);if(d<6*Z&&I.inl>.04)c=d<4.2*Z?mixc(W2,[90,190,220],fbm2(wx,wy,5,2)):mixc(c,[150,140,130],.7);}
    return c;
  };
  /* projection : pour chaque pixel, on cherche (de haut en bas) le point du sol visible */
  for(let y=0;y<Hc;y++){if(performance.now()>R25.dl)yield;for(let x=0;x<Wc;x++){
    const k=(y*Wc+x)*4;let hit=-1,dep=0;
    for(let h=Math.min(HM,Math.ceil(COLMAX[x])+1);h>=0;h--){const e=el(x,y+h);if(e>=0&&e>=h-.5){hit=h;dep=e-h;break;}}
    if(hit>=0){
      const gx=x,gy=y+hit;let c;
      if(dep<1.3*Z){
        const e=el(gx,gy),ex=(el(gx+1,gy)>=0?el(gx+1,gy):e)-(el(gx-1,gy)>=0?el(gx-1,gy):e),ey=(el(gx,gy+1)>=0?el(gx,gy+1):e)-(el(gx,gy-1)>=0?el(gx,gy-1):e);
        let nx=-ex*.5,ny=-ey*.5,nz=1;const nl=Math.hypot(nx,ny,nz);nx/=nl;ny/=nl;nz/=nl;
        const lam=Math.max(0,nx*Lx+ny*Ly+nz*Lz),sl=Math.hypot(ex,ey)*.5;
        c=ground(gx,gy,e,sl);const f=.5+.62*lam;
        c=[c[0]*f,c[1]*f,c[2]*f*.97+8*(1-lam)];
        /* neige sur les hauts sommets */
        if(e>(B.plateau+48)*Z&&!/desert|candy|redrock|volcanic|fireice|storm/.test(D.b)){const s=sstep((B.plateau+48)*Z,(B.plateau+64)*Z,e+fbm2(gx*.05,gy*.05,S,2)*8*Z);c=mixc(c,[240*f+10,244*f+10,252*f+6],s*.9);}
      }else{
        const wx=(gx-C)/K,cc=cloud?mixc([206,220,240],[250,252,255],fbm2(x*.05,y*.05,S,3)):B.cliffCol;
        const st=cloud?1:.86+.14*Math.sin((y*.55/Z)+fbm2(wx*.6,y*.05/Z,S+41,2)*6),ao=.62+.38*sstep(0,10*Z,hit),top=dep<3*Z?1.12:1;
        const f=cloud?(.9+.1*ao):(.74-.22*Math.min(1,dep/(26*Z)))*st*ao*top;
        c=[cc[0]*f,cc[1]*f,cc[2]*f];
      }
      Dd[k]=Math.min(255,c[0]);Dd[k+1]=Math.min(255,c[1]);Dd[k+2]=Math.min(255,c[2]);Dd[k+3]=255;
    }else{
      const q=Q[y*Wc+x];
      if(q<1.5){
        const t0=Math.max(0,(q-1)/.5),a=Math.pow(1-t0,1.6)*.92;if(a<.045&&!cloud)continue;
        if(cloud){const n=fbm2(x*.03/Z,y*.03/Z,S+51,4);const al=Math.max(0,Math.pow(1-t0,1.2)*(.55+.6*n)-.15);const c=mixc([214,226,242],[255,255,255],n);Dd[k]=c[0];Dd[k+1]=c[1];Dd[k+2]=c[2];Dd[k+3]=Math.round(255*Math.min(1,al));continue;}
        let sh2=0;for(let s=2;s<=26;s+=3){const e=el(x-s*Z*.62,y-s*Z*.58);if(e>s*Z*.55){sh2=1-s/30;break;}}
        const n=fbm2(x*.04/Z,y*.04/Z,S+51,3);
        let c=mixc([150,230,214],B.shallow,sstep(0,.35,t0));c=mixc(c,[26,92,140],sstep(.3,1,t0));
        c=mixc(c,[c[0]*1.08,c[1]*1.08,c[2]*1.05],n);if(q<1.02)c=mixc(c,[230,248,240],.5);
        const sf=1-.45*sh2;
        Dd[k]=c[0]*sf;Dd[k+1]=c[1]*sf;Dd[k+2]=c[2]*sf;Dd[k+3]=Math.round(255*Math.max(a,sh2*.5));
      }
    }
  }}
  cx.putImageData(im,0,0);yield;
  /* ---------- éléments posés sur le relief ---------- */
  const scr=(gx,gy)=>[gx/Z,(gy-Math.max(0,el(gx,gy)))/Z];
  const FX={flags:[],smoke:[],glow:[],mill:[],fountain:[]};
  const toW=(bx,by)=>[t.x+(bx*Z-C)/K,t.y+(by*Z-CY)/K];
  const items=[];
  const G={cx,rnd,cur:null,
    map(x,y){const a=G.cur;return a?[a.a[0]+(x-a.a[0])*a.k,a.a[1]+(y-a.a[1])*a.k]:[x,y];},
    flag(x,y){FX.flags.push(toW(...G.map(x,y)));},smoke(x,y,s){FX.smoke.push([...toW(...G.map(x,y)),s||1]);},glow(x,y,r,col){FX.glow.push([...toW(...G.map(x,y)),r*(G.cur?G.cur.k:1)*Z/K,col]);},
    mill(x,y){FX.mill.push([...toW(...G.map(x,y)),(G.cur?G.cur.k:1)*Z/K]);},fountain(x,y){FX.fountain.push([...toW(...G.map(x,y)),(G.cur?G.cur.k:1)*Z/K]);}};
  const add=(gy,a,k,f)=>items.push({y:gy,a,k,f});
  const okSpot=(gx,gy,minQ)=>{const i=(gy|0)*Wc+(gx|0);if(!(Q[i]<minQ))return false;for(const l of L.lakes)if(Math.hypot(gx-l.x,gy-l.y)<l.r*1.15)return false;for(const s of L.canals)if(segD(gx,gy,s)<8*Z)return false;return true;};
  if(arab)r25Alabasta(G,L,{u,Z,Q,Wc,C,CY,R,K,el,scr,add,rnd,okSpot,cx});
  else{
    if(L.lm&&LM[D.lm]){const [sx,sy]=scr(L.lm[0],L.lm[1]);add(L.lm[1]+30*Z,[sx,sy],D.lmS||1.5,()=>LM[D.lm](G,sx,sy,D.lmo));}
    for(const e of D.ex||[]){const [gx,gy]=at(e[1],e[2]);if(!okSpot(gx,gy,.95))continue;const [sx,sy]=scr(gx,gy);add(gy+10*Z,[sx,sy],e[3]||1,()=>LM[e[0]](G,sx,sy,e[4]));}
    const homes=[];const cen=L.lm||[C,CY];const hs=(D.houseS||1.45);
    for(let k=0;k<400&&homes.length<(D.town||0);k++){
      const a=rnd()*6.283,d=u*(.18+rnd()*.34),gx=cen[0]+Math.cos(a)*d*1.2,gy=cen[1]+(L.lm?16*Z:0)+Math.sin(a)*d*.85;
      if(!okSpot(gx,gy,.74))continue;if(L.lm&&Math.hypot((gx-L.lm[0])/1.3,gy-L.lm[1])<u*(.2+.04*(D.lmS||1.5)))continue;
      if(homes.some(h=>Math.abs(h[0]-gx)<15*Z*hs/1.45&&Math.abs(h[1]-gy)<11*Z*hs/1.45))continue;
      let tooHigh=false;for(const p of L.peaks)if(Math.hypot(gx-p.x,gy-p.y)<p.r*.6)tooHigh=true;if(tooHigh)continue;
      homes.push([gx,gy]);
    }
    const roofs=D.roof||['#b5533c'],hstyle=HOUSE[D.house]?D.house:'gable';
    for(const [gx,gy] of homes){const w=11+rnd()*7,dd=8+rnd()*5,h=7+rnd()*7,[sx,sy]=scr(gx,gy+dd*Z),v=rnd()*16,rf=roofs[Math.floor(rnd()*roofs.length)];
      add(gy+dd*Z,[sx,sy],hs,()=>HOUSE[hstyle](G,sx-w/2,sy-dd,w,dd,h,v,rf));}
    const trees=[];
    for(const tr0 of D.trees||[]){const [ty,n,side]=tr0;let placed=0;
      for(let k=0;k<n*30&&placed<n;k++){const a=rnd()*6.283,d=u*(.1+Math.sqrt(rnd())*.75),gx=C+Math.cos(a)*d,gy=CY+Math.sin(a)*d;
        if(side==='east'&&gx<C+u*.05)continue;if(side==='west'&&gx>C-u*.05)continue;
        if(!okSpot(gx,gy,ty==='mangrove'?.7:.84))continue;if(L.lm&&Math.hypot((gx-L.lm[0])/1.3,gy-L.lm[1])<u*(.16+.05*(D.lmS||1.5)))continue;
        if(homes.some(h=>Math.abs(h[0]-gx)<12*Z&&Math.abs(h[1]-gy)<10*Z))continue;if(trees.some(q=>Math.hypot(q[0]-gx,q[1]-gy)<(ty==='mangrove'?40:7)*Z))continue;
        trees.push([gx,gy]);placed++;const [sx,sy]=scr(gx,gy),s=.8+rnd()*.45;
        add(gy,[sx,sy],ty==='mangrove'?1:1.4,()=>{if(ty==='pineSnow')TREE.pine(G,sx,sy,s,true);else if(TREE[ty])TREE[ty](G,sx,sy,s);});}}
    if(L.pier&&okSpot(L.pier[0]-6*Z,L.pier[1]-30*Z,1)){const [px,py]=scr(L.pier[0],L.pier[1]);add(L.pier[1]+30*Z,[px,py],1.4,()=>r25Pier(G,px,py));}
    if(D.b==='volcanic'||D.b==='fireice'||D.fx&&D.fx.smokePeak)for(const p of L.peaks)if(p.cr){const [sx,sy]=scr(p.x,p.y);FX.smoke.push([...toW(sx,sy),2.2]);FX.glow.push([...toW(sx,sy),5*Z/K*1.6,'#ff7a2a']);}
  }
  cx.save();cx.scale(Z,Z);
  items.sort((a,b)=>a.y-b.y).forEach(o=>{cx.save();const [ax,ay]=o.a||[0,0],k=o.k||1;cx.translate(ax,ay);cx.scale(k,k);cx.translate(-ax,-ay);G.cur={a:[ax,ay],k};try{o.f();}catch(_){}G.cur=null;cx.restore();});
  cx.restore();
  /* lumière d'ambiance */
  cx.globalCompositeOperation='source-atop';
  const amb=cx.createLinearGradient(0,0,Wc,Hc);amb.addColorStop(0,'rgba(255,214,150,.10)');amb.addColorStop(1,'rgba(40,20,80,.10)');cx.fillStyle=amb;cx.fillRect(0,0,Wc,Hc);
  cx.globalCompositeOperation='source-over';
  /* contour de l'île (unités monde, depuis le centre) pour l'écume et le liseré du camp, dessinés à chaque image */
  const poly=[];for(let i=0;i<96;i++){const th=i/96*6.2832-Math.PI,r=rdAt(th);poly.push(Math.cos(th)*r,Math.sin(th)*r);}
  yield;
  /* recadrage sur les pixels visibles : moins de surface à recopier à chaque image */
  const A=cx.getImageData(0,0,Wc,Hc).data;let x0=Wc,y0=Hc,x1=-1,y1=-1;
  for(let y=0;y<Hc;y++){const o=y*Wc*4;for(let x=0;x<Wc;x++)if(A[o+x*4+3]>10){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}}
  if(x1<0){x0=0;y0=0;x1=Wc-1;y1=Hc-1;}
  const cw=x1-x0+1,ch=y1-y0+1,out=document.createElement('canvas');out.width=cw;out.height=ch;out.getContext('2d').drawImage(cv,-x0,-y0);
  return {cv:out,meta:{Wc:cw,Hc:ch,C:C-x0,CY:CY-y0,K},fx:FX,poly};
}
function r25Pier(G,px,py){const c=G.cx;c.fillStyle='#7b5733';c.fillRect(px-3,py-6,7,34);c.fillStyle='rgba(0,0,0,.25)';c.fillRect(px+4,py-4,3,32);
  c.fillStyle='#9c7446';for(let j=0;j<8;j++)c.fillRect(px-4,py-5+j*4.2,9,2);
  const bx=px+16,by=py+30;c.fillStyle='rgba(0,40,60,.35)';c.beginPath();c.ellipse(bx+3,by+3,15,4,0,0,6.283);c.fill();
  c.fillStyle='#6b4423';c.beginPath();c.moveTo(bx-14,by-3);c.lineTo(bx+14,by-3);c.lineTo(bx+9,by+3);c.lineTo(bx-9,by+3);c.closePath();c.fill();
  c.strokeStyle='#5a3b1e';c.lineWidth=1.4;c.beginPath();c.moveTo(bx,by-3);c.lineTo(bx-2,by-28);c.stroke();
  c.fillStyle='#f7efe0';c.beginPath();c.moveTo(bx-2,by-28);c.quadraticCurveTo(bx+12,by-16,bx+3,by-5);c.lineTo(bx-1,by-6);c.closePath();c.fill();}
/* Alabasta (référence validée) : ville blanche, remparts, palais à dôme, oasis, mesas, rochers épars */
function r25Alabasta(G,L,E){
  const {u,Z,Q,Wc,R,K,scr,add,rnd,cx,C,CY}=E;
  const town=[];
  for(let k=0;k<90&&town.length<16;k++){const a=rnd()*6.283,d=R*K*(.2+rnd()*.26),gx=L.lm[0]+Math.cos(a)*d*1.25,gy=L.lm[1]+18*Z+Math.sin(a)*d*.8;
    if(Q[(gy|0)*Wc+(gx|0)]>.72)continue;if(Math.hypot((gx-L.lm[0])/1.3,gy-L.lm[1])<R*K*.24)continue;if(Math.hypot(gx-L.oasis[0],gy-L.oasis[1])<R*K*.17)continue;
    if(town.some(h=>Math.abs(h[0]-gx)<21*Z&&Math.abs(h[1]-gy)<15*Z))continue;town.push([gx,gy]);}
  for(let k=0;k<40;k++){const a=rnd()*6.283,d=R*K*(.35+rnd()*.45),gx=C+Math.cos(a)*d,gy=CY+Math.sin(a)*d*.95;const qq=Q[(gy|0)*Wc+(gx|0)];if(!(qq<.82))continue;
    if(Math.hypot((gx-L.lm[0])/1.3,gy-L.lm[1])<R*K*.42||Math.hypot(gx-L.oasis[0],gy-L.oasis[1])<R*K*.25)continue;
    const [sx,sy]=scr(gx,gy),w=3+rnd()*5;add(gy,[sx,sy],1,()=>{cx.fillStyle='rgba(70,35,15,.28)';cx.beginPath();cx.ellipse(sx+w*.5,sy+1,w*.9,w*.3,0,0,6.283);cx.fill();
      const g=cx.createLinearGradient(sx-w,sy-w,sx+w,sy);g.addColorStop(0,'#e3b27c');g.addColorStop(1,'#8a5432');cx.fillStyle=g;cx.beginPath();cx.ellipse(sx,sy-w*.35,w,w*.6,0,0,6.283);cx.fill();});}
  {const ex=L.lm[0],ey=L.lm[1]+8*Z,rx=R*K*.47,ry=R*K*.36;
   for(let a=0;a<6.283;a+=.16){const mid=a+.08;if(Math.abs(mid-Math.PI/2)<.2)continue;const gx=ex+Math.cos(mid)*rx,gy=ey+Math.sin(mid)*ry;if(Q[(gy|0)*Wc+(gx|0)]>.9)continue;
     const [sx,sy]=scr(gx,gy),ln=Math.hypot(-Math.sin(mid)*rx,Math.cos(mid)*ry)*.16/Z+1.2;
     add(gy,[sx,sy],1,()=>{cx.save();cx.translate(sx,sy);cx.fillStyle='rgba(70,35,15,.25)';cx.fillRect(-ln/2,0,ln+3,2.5);cx.fillStyle=Math.sin(mid)>0?'#c49a62':'#b48a55';cx.fillRect(-ln/2,-6,ln,6);cx.fillStyle='#e7cf9d';cx.fillRect(-ln/2,-7.4,ln,1.6);for(let j=-ln/2;j<ln/2-1;j+=3)cx.fillRect(j,-9,1.6,1.8);cx.restore();});}
   const [gx0,gy0]=scr(ex,ey+ry);add(ey+ry+1,[gx0,gy0],1,()=>{for(const dx of [-8,8]){const g=cx.createLinearGradient(gx0+dx-3.5,0,gx0+dx+3.5,0);g.addColorStop(0,'#f1dfb4');g.addColorStop(1,'#a8844e');cx.fillStyle=g;cx.fillRect(gx0+dx-3.5,gy0-13,7,13);cx.fillStyle='#e7cf9d';cx.fillRect(gx0+dx-4.5,gy0-14.5,9,2);}
     cx.fillStyle='rgba(80,50,25,.9)';cx.beginPath();cx.moveTo(gx0-4.5,gy0);cx.lineTo(gx0-4.5,gy0-7);cx.arc(gx0,gy0-7,4.5,Math.PI,0);cx.lineTo(gx0+4.5,gy0);cx.closePath();cx.fill();});}
  for(const [gx,gy] of town){const w=11+rnd()*7,d=8+rnd()*5,h=7+rnd()*7,[sx,sy]=scr(gx,gy+d*Z),v=rnd()*16,aw=rnd()<.35;
    add(gy+d*Z,[sx,sy],1.45,()=>{HOUSE.flat(G,sx-w/2,sy-d,w,d,h,v);if(aw){cx.fillStyle='#c46a3c';cx.fillRect(sx-w/2+2,sy-d-h+1.5,w*.4,d*.4);}});}
  {const [px,py]=scr(L.lm[0],L.lm[1]);add(L.lm[1]+40*Z,[px,py],1.55,()=>LM.domePalace(G,px,py));}
  const [ox,oy]=scr(L.oasis[0],L.oasis[1]);
  add(L.oasis[1]-2,[ox,oy],1.4,()=>{const g=cx.createRadialGradient(ox-6,oy-4,2,ox,oy,26);g.addColorStop(0,'#7fe6e0');g.addColorStop(.6,'#2a9cb4');g.addColorStop(1,'#1c6c86');
    cx.fillStyle='rgba(70,110,40,.85)';cx.beginPath();cx.ellipse(ox,oy+1.5,27,15,0,0,6.283);cx.fill();cx.fillStyle=g;cx.beginPath();cx.ellipse(ox,oy,24,12.5,0,0,6.283);cx.fill();
    cx.strokeStyle='rgba(255,255,255,.45)';cx.lineWidth=1.2;cx.beginPath();cx.ellipse(ox-4,oy-3,12,4,0,3.6,5.6);cx.stroke();});
  for(const [dx,dy] of [[-30,-6],[-26,10],[28,-8],[30,8],[4,-16],[-6,18],[18,16]]){const gx=L.oasis[0]+dx*Z*1.4,gy=L.oasis[1]+dy*Z*1.4,[sx,sy]=scr(gx,gy);add(gy,[sx,sy],1.45,()=>TREE.palm(G,sx,sy,1));}
  for(const [rx,ry] of [[.55,-.3],[.64,-.08],[.4,.5]]){const gx=C+rx*u,gy=CY+ry*u,[sx,sy]=scr(gx,gy);add(gy,[sx,sy],1.4,()=>LM.rocks(G,sx,sy,{n:1}));}
  {const [px,py]=scr(L.pier[0],L.pier[1]);add(L.pier[1]+30*Z,[px,py],1.4,()=>r25Pier(G,px,py));}
}
/* ---------- cache navigateur (IndexedDB) : images déjà calculées ---------- */
function r25DbOpen(){return new Promise(res=>{try{const r=indexedDB.open('risk-op-rendu',1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('iles'))r.result.createObjectStore('iles',{keyPath:'k'});};r.onsuccess=()=>res(r.result);r.onerror=()=>res(null);r.onblocked=()=>res(null);}catch(_){res(null);}});}
async function r25DbLoad(){
  R25.db=await r25DbOpen();
  if(R25.db){try{const all=await new Promise((res,rej)=>{const tx=R25.db.transaction('iles'),q=tx.objectStore('iles').getAll();q.onsuccess=()=>res(q.result||[]);q.onerror=()=>rej(q.error);});
    for(const r of all){if(r.ver!==R25.ver)continue;const t=terrs.find(x=>x.name===r.name);if(!t)continue;const e=r25Entry(t);if(e.st==='ready')continue;
      try{const bm=await createImageBitmap(r.blob);r25Finish(e,bm,r.meta,r.fx,r.poly,r.blob,false);R25.fromDB++;}catch(_){}}}catch(_){}}
  R25.dbReady=true;
}
function r25DbPut(name,blob,meta,fx,poly){if(!R25.db)return;try{const tx=R25.db.transaction('iles','readwrite');tx.objectStore('iles').put({k:name,name,ver:R25.ver,blob,meta,fx,poly});}catch(_){}}
/* ---------- file d'attente ---------- */
function r25Entry(t){let e=R25.cache.get(t.id);if(!e){e={id:t.id,name:t.name,st:'wait',gen:null,spent:0,full:null,small:null,blob:null,loading:false,banner:null};R25.cache.set(t.id,e);}return e;}
function r25Finish(e,src,meta,fx,poly,blob,store){
  e.meta=meta;e.fx=fx;e.poly=poly;e.blob=blob;
  const s=document.createElement('canvas');s.width=Math.ceil(meta.Wc/4);s.height=Math.ceil(meta.Hc/4);const g=s.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(src,0,0,s.width,s.height);e.small=s;
  e.full=src;e.st='ready';r25Touch(e);dirty=true;
  if(store&&blob)r25DbPut(e.name,blob,meta,fx,poly);
  if([...R25.cache.values()].length===terrs.length&&[...R25.cache.values()].every(x=>x.st==='ready'))R25.allReady=true;
}
function r25Touch(e){const i=R25.lru.indexOf(e);if(i>=0)R25.lru.splice(i,1);R25.lru.push(e);
  while(R25.lru.length>R25.FULLMAX){const o=R25.lru.shift();o.mid=null;if(o.full&&o.blob){if(o.full.close)try{o.full.close();}catch(_){}o.full=null;}}}
function r25Mid(e){if(e.mid){r25Touch(e);return e.mid;}const f=r25Full(e);if(!f)return null;const c=document.createElement('canvas');c.width=Math.ceil(e.meta.Wc/2);c.height=Math.ceil(e.meta.Hc/2);const g=c.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(f,0,0,c.width,c.height);e.mid=c;return c;}
/* halos pré-dessinés (évite de recréer des dégradés à chaque image) */
const R25G={};function r25Glow(col){let c=R25G[col];if(!c){c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,col);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);R25G[col]=c;}return c;}
function r25Full(e){if(e.full){r25Touch(e);return e.full;}if(!e.loading&&e.blob){e.loading=true;createImageBitmap(e.blob).then(bm=>{e.full=bm;e.loading=false;r25Touch(e);}).catch(()=>{e.loading=false;});}return null;}
function r25Prio(e){const t=terrs[e.id],vx=V.x+W/V.k/2,vy=V.y+H/V.k/2,vis=t.x>V.x-40&&t.x<V.x+W/V.k+40&&t.y>V.y-40&&t.y<V.y+H/V.k+40;
  const me=players[ME],cap=me?terrs.find(x=>x.owner===ME&&x.capital):null;return (vis?0:1e6)+Math.hypot(t.x-(cap?cap.x:vx),t.y-(cap?cap.y:vy));}
function r25Step(budget){
  if(!R25.dbReady)return;
  let e=R25.cur;
  if(!e||e.st!=='build'){let best=null,bp=1e12;for(const x of R25.cache.values()){if(x.st!=='wait')continue;const p=r25Prio(x);if(p<bp){bp=p;best=x;}}if(!best)return;e=best;e.st='build';e.gen=r25Build(terrs[e.id],ISLE_ART[e.name]);R25.cur=e;}
  const s0=performance.now();R25.dl=s0+budget;
  let r;try{r=e.gen.next();}catch(err){e.st='error';e.err=String(err&&err.message||err);R25.cur=null;return;}
  const d=performance.now()-s0;e.spent+=d;if(d>R25.maxSlice)R25.maxSlice=d;
  if(r.done){const v=r.value;e.gen=null;e.st='enc';R25.cur=null;R25.built++;R25.ms=Math.round(e.spent);
    const fin=b=>{r25Finish(e,v.cv,v.meta,v.fx,v.poly,b,true);};
    try{v.cv.toBlob(b=>{if(b)fin(b);else v.cv.toBlob(b2=>fin(b2),'image/png');},'image/webp',.92);}catch(_){fin(null);}}
}
/* ---------- mer lisse (sans les îles plates ni les anneaux de côte pixelisés) ---------- */
function r25SeaBuild(){
  const cv=document.createElement('canvas');cv.width=GW;cv.height=GH;const g=cv.getContext('2d'),im2=g.createImageData(GW,GH),d=im2.data;
  for(let i=0;i<GW*GH;i++){const gy=(i/GW)|0,gx=i-gy*GW,X=gx*CELL+1,Y=gy*CELL+1,dxr=Math.abs(X-RL_X);let r,gg,b;
    if(dxr<=RL_HW){const st=Math.sin(Y*.31+X*.13)*5+Math.sin(Y*.07)*4,e=dxr>RL_HW-3?1:0;r=(e?176:140)+st;gg=(e?90:62)+st*.6;b=(e?68:46)+st*.5;}
    else if((Y>=BELTS[0][0]&&Y<=BELTS[0][1])||(Y>=BELTS[1][0]&&Y<=BELTS[1][1])){r=17;gg=44;b=80;}
    else{const t=seaTint(X,Y),w=Math.sin(gx*.09+gy*.05)+Math.sin(gx*.04-gy*.11),dep=Math.min(1,Math.abs(Y-440)/300);r=24+t[0]-dep*5+w*1.5;gg=62+t[1]-dep*9+gy*.04+w*2;b=102+t[2]-dep*14+gy*.06+w*3;}
    const k=i*4;d[k]=r;d[k+1]=gg;d[k+2]=b;d[k+3]=255;}
  g.putImageData(im2,0,0);R25.sea=cv;
}
/* la mer lisse n'est utilisée que lorsque toutes les îles sont prêtes (sinon l'ancien fond reste, sans trou) */
function r25SeaDraw(){
  if(!R25.on||!R25.allReady)return false;
  if(!R25.sea)r25SeaBuild();
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(R25.sea,0,0,W,H);return true;
}
/* ---------- dessin à chaque image ---------- */
function r25Path(e,t,s,st){const p=e.poly,stp=(st||1)*2;ctx.beginPath();for(let i=0;i<p.length;i+=stp){const x=t.x+p[i]*s,y=t.y+p[i+1]*s;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();}
function r25Draw(t,e,now,u){
  const D=ISLE_ART[t.name],m=e.meta,K=m.K,x0=t.x-m.C/K,y0=t.y-m.CY/K,w=m.Wc/K,h=m.Hc/K,T=REDUCE?0:now;
  const px=S*V.k;let img=e.small;if(px>4.2){const f=r25Full(e);if(f)img=f;else{const m2=e.mid;if(m2)img=m2;}}else if(px>2.1){const m2=r25Mid(e);if(m2)img=m2;}
  const p=.5+.5*Math.sin(T/900+t.id),cloud=D.b==='cloud',sr=t.rad*px,lod=sr<44;
  ctx.save();
  if(!cloud&&!lod){ctx.lineJoin='round';r25Path(e,t,1.1+.015*p);ctx.strokeStyle='rgba(235,250,255,'+(.08+.16*p).toFixed(3)+')';ctx.lineWidth=.5;ctx.stroke();}
  ctx.drawImage(img,x0,y0,w,h);
  if(t.id===ui.sel||t.id===ui.hover){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=t.id===ui.sel?.16:.09;ctx.drawImage(img,x0,y0,w,h);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;}
  if(!cloud&&!lod){r25Path(e,t,1.03);ctx.strokeStyle='rgba(240,252,255,'+(.35+.25*(1-p)).toFixed(3)+')';ctx.lineWidth=.45;ctx.stroke();}
  /* liseré du camp propriétaire */
  r25Path(e,t,1.065,lod?3:1);ctx.strokeStyle=t.owner>=0?COLORS[t.owner]:'rgba(232,220,192,.45)';ctx.globalAlpha=t.owner>=0?.9:1;ctx.lineWidth=t.owner>=0?1.1:.6;ctx.stroke();ctx.globalAlpha=1;
  /* effets animés (seulement si l'île est assez grande à l'écran) */
  if(t.rad*px>34&&!REDUCE)r25Fx(t,e,D,T);
  else if(t.rad*px>20){const col=t.owner>=0?COLORS[t.owner]:'#d8cfb0';for(const [fx,fy] of e.fx.flags)r25Flag(fx,fy,col,0);}
  ctx.restore();
}
function r25Flag(fx,fy,col,ph){ctx.strokeStyle='#4a3420';ctx.lineWidth=.3;ctx.beginPath();ctx.moveTo(fx,fy+2);ctx.lineTo(fx,fy-3);ctx.stroke();ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(fx,fy-3);
  for(let k=0;k<=6;k++)ctx.lineTo(fx+k*.5,fy-3+Math.sin(ph+k*.9)*.26*(k/6));for(let k=6;k>=0;k--)ctx.lineTo(fx+k*.5,fy-1.6+Math.sin(ph+k*.9)*.26*(k/6));ctx.closePath();ctx.fill();}
function r25Fx(t,e,D,T){
  const F=e.fx,fx=D.fx||{},col=t.owner>=0?COLORS[t.owner]:'#d8cfb0',R=t.rad;
  F.flags.forEach(([x,y],i)=>r25Flag(x,y,col,T/260+i));
  for(const [x,y,s] of F.smoke)for(let i=0;i<5;i++){const k=((T/2600)+i/5+hsh(t.id+i)*.1)%1;ctx.fillStyle='rgba(200,200,205,'+(.32*(1-k)).toFixed(3)+')';ctx.beginPath();ctx.arc(x+Math.sin(k*4+i)*1.2*s+k*3*s,y-k*10*s,(.8+k*2.4)*s,0,6.283);ctx.fill();}
  for(const [x,y,r,c] of F.glow){ctx.globalAlpha=.45+.35*Math.sin(T/380+x);ctx.drawImage(r25Glow(c),x-r*2.2,y-r*2.2,r*4.4,r*4.4);ctx.globalAlpha=1;}
  for(const [x,y,s] of F.mill){ctx.strokeStyle='#f3ead8';ctx.lineWidth=.6*s*4;for(let k=0;k<4;k++){const a=T/900+k*Math.PI/2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*14*s,y+Math.sin(a)*14*s);ctx.stroke();}}
  for(const [x,y,s] of F.fountain)for(let i=0;i<8;i++){const k=((T/900)+i/8)%1,a=(i/8)*6.283;ctx.fillStyle='rgba(200,240,255,'+(.7*(1-k)).toFixed(3)+')';ctx.beginPath();ctx.arc(x+Math.cos(a)*k*8*s,y-Math.sin(k*Math.PI)*10*s+k*4*s,.5*s*4,0,6.283);ctx.fill();}
  const rect=(n,f)=>{for(let i=0;i<n;i++)f(i,hsh(t.id*31+i),hsh(t.id*17+i*7));};
  if(fx.sand){ctx.fillStyle='rgba(255,236,190,.55)';rect(10,(i,a,b)=>{const k=((T/(2600+i*230))+a)%1,yy=t.y-R*.5+b*R*.9,xx=t.x+R*.85-k*R*1.6;ctx.globalAlpha=Math.sin(k*Math.PI)*.7;ctx.fillRect(xx,yy+Math.sin(k*9+i)*.6,.9,.22);});ctx.globalAlpha=1;}
  if(fx.snow||fx.snowEast){ctx.fillStyle='rgba(255,255,255,.85)';rect(26,(i,a,b)=>{const k=((T/(4000+i*90))+a)%1,xx=t.x-R+(fx.snowEast?R:0)+b*R*(fx.snowEast?1:2)+Math.sin(k*6+i)*1.5,yy=t.y-R*1.3+k*R*2.1;ctx.beginPath();ctx.arc(xx,yy,.28,0,6.283);ctx.fill();});}
  if(fx.petals){ctx.fillStyle='rgba(255,182,212,.9)';rect(18,(i,a,b)=>{const k=((T/(5200+i*120))+a)%1,xx=t.x-R*1.1+k*R*2.2,yy=t.y-R*.8+b*R*1.4+Math.sin(k*8+i)*2;ctx.beginPath();ctx.ellipse(xx,yy,.42,.24,k*6,0,6.283);ctx.fill();});}
  if(fx.bubbles){ctx.strokeStyle='rgba(220,250,255,.75)';ctx.lineWidth=.18;rect(16,(i,a,b)=>{const k=((T/(5000+i*140))+a)%1,xx=t.x-R*.7+b*R*1.4+Math.sin(k*5+i)*1.2,yy=t.y+R*.4-k*R*1.6;ctx.globalAlpha=Math.sin(k*Math.PI);ctx.beginPath();ctx.arc(xx,yy,.6+b*.9,0,6.283);ctx.stroke();});ctx.globalAlpha=1;}
  if(fx.dome){const sh=.5+.5*Math.sin(T/1200);const g=ctx.createRadialGradient(t.x-R*.3,t.y-R*.55,R*.1,t.x,t.y-R*.1,R*1.05);g.addColorStop(0,'rgba(255,255,255,'+(.22+.08*sh).toFixed(3)+')');g.addColorStop(.7,'rgba(160,230,255,.08)');g.addColorStop(1,'rgba(160,230,255,.28)');
    ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(t.x,t.y-R*.08,R*.95,R*1.05,0,0,6.283);ctx.fill();ctx.strokeStyle='rgba(220,250,255,.5)';ctx.lineWidth=.35;ctx.stroke();}
  if(fx.fog||fx.smog){rect(6,(i,a,b)=>{const k=((T/(14000+i*900))+a)%1,xx=t.x-R*1.2+k*R*2.4,yy=t.y-R*.6+b*R*1.1;ctx.drawImage(r25Glow(fx.smog?'rgba(120,110,100,.22)':'rgba(200,190,230,.22)'),xx-R*.4,yy-R*.4,R*.8,R*.8);});}
  if(fx.clouds){rect(5,(i,a,b)=>{const k=((T/(16000+i*1300))+a)%1,xx=t.x-R*1.3+k*R*2.6,yy=t.y+R*(.55+b*.35);ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.ellipse(xx,yy,R*.22,R*.08,0,0,6.283);ctx.ellipse(xx+R*.12,yy-R*.04,R*.14,R*.07,0,0,6.283);ctx.fill();});}
  if(fx.lightning){const c=Math.floor(T/2400),ph2=(T%2400)/2400;if(hsh(c+t.id)<.45&&ph2<.08){const x=t.x+(hsh(c*3)-.5)*R;ctx.strokeStyle='rgba(230,240,255,.95)';ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(x,t.y-R*1.6);let yy=t.y-R*1.6,xx=x;for(let k=0;k<6;k++){xx+=(hsh(c*7+k)-.5)*5;yy+=R*.22;ctx.lineTo(xx,yy);}ctx.stroke();ctx.fillStyle='rgba(200,220,255,.12)';ctx.beginPath();ctx.arc(t.x,t.y,R*1.4,0,6.283);ctx.fill();}}
  if(fx.gold){ctx.globalAlpha=.6+.4*Math.sin(T/700);ctx.drawImage(r25Glow('rgba(255,214,90,.3)'),t.x-R*.9,t.y-R*1.2,R*1.8,R*1.8);ctx.globalAlpha=1;}
}
/* passe de rendu : avant les routes. Les îles pas encore prêtes gardent leur ancien rendu (copié depuis le fond d'origine si la mer lisse est active) */
function r25Pass(now,u){
  if(!R25.on||!terrs.length)return;
  if(!R25.order){R25.order=1;for(const t of terrs)if(ISLE_ART[t.name])r25Entry(t);r25DbLoad();}
  r25Step(started?6:10);
  const x0=V.x-60,x1=V.x+W/V.k+60,y0=V.y-80,y1=V.y+H/V.k+60;
  for(const t of terrs){if(t.x<x0||t.x>x1||t.y<y0||t.y>y1)continue;const e=R25.cache.get(t.id);if(e&&e.st==='ready')r25Draw(t,e,now,u);}
}
/* le jeton (garnison, couronne, alertes) d'une île détaillée est réduit et posé au bord de l'île pour ne pas masquer le décor */
function r25TokenOpen(t){
  const A=r25Art(t);if(!A)return false;const b=A.badge||{dx:A.layout==='alabasta'?.1:0,dy:.55};
  ctx.save();const bx=t.x+t.rad*b.dx,by=t.y+t.rad*b.dy;ctx.translate(bx,by);ctx.scale(.8,.8);ctx.translate(-t.x,-t.y);
  return true;
}
function r25Toggle(){
  R25.on=!R25.on;try{localStorage.setItem('rk-25',R25.on?'1':'0');}catch(_){}
  const b=$('#z-25');if(b){b.classList.toggle('on',R25.on);b.setAttribute('aria-pressed',R25.on);}
  toast(R25.on?'Rendu 2.5D des îles activé':'Rendu d’origine');lastPanel='';
}
/* ---------- illustration de la fiche d'île : le vrai rendu 2.5D de l'île ---------- */
function islandArt(t){
  const e=R25.on?R25.cache.get(t.id):null;
  if(e&&e.st==='ready'){if(e.banner)return '<img class="art art25" src="'+e.banner+'" alt="Vue de '+esc(t.name)+'" width="640" height="264">';r25Banner(t,e);}
  return islandArt_o(t);
}
function r25Banner(t,e){
  if(e.bannerBusy)return;const src=r25Full(e);if(!src)return;e.bannerBusy=true;
  const W2=640,H2=264,cv=document.createElement('canvas');cv.width=W2;cv.height=H2;const g=cv.getContext('2d');
  const tint=seaTint(t.x,t.y),sg=g.createLinearGradient(0,0,0,H2);sg.addColorStop(0,'rgb('+(36+tint[0])+','+(96+tint[1])+','+(146+tint[2])+')');sg.addColorStop(1,'rgb('+(14+tint[0]*.6)+','+(48+tint[1]*.6)+','+(92+tint[2]*.6)+')');g.fillStyle=sg;g.fillRect(0,0,W2,H2);
  const m=e.meta,sc=(W2*.56)/(m.Wc/1.5);const dw=m.Wc*sc,dh=m.Hc*sc;g.imageSmoothingQuality='high';
  g.drawImage(src,W2/2-m.C*sc,H2*.8-m.CY*sc,dw,dh);
  const vg=g.createRadialGradient(W2/2,H2/2,H2*.4,W2/2,H2/2,W2*.62);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,10,25,.45)');g.fillStyle=vg;g.fillRect(0,0,W2,H2);
  cv.toBlob(b=>{if(b){e.banner=URL.createObjectURL(b);lastPanel='';}e.bannerBusy=false;},'image/webp',.9);
}
