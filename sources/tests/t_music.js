/* Rendu hors ligne (OfflineAudioContext) de chaque ambiance : non silencieuse, sans saturation, sans NaN ; export WAV pour écoute. */
const {chromium}=require('playwright');const fs=require('fs');
const OUT=__dirname+'/';
(async()=>{const b=await chromium.launch(),p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+__dirname+'/../dist/risk_test.html');await p.waitForTimeout(800);
const res=[];
for(const [sc,sec,file,b0] of [['explore',24,'4_l_appel_du_large',16],['explore',24,'1_le_port_du_village'],['dev',26,'2_le_conseil_des_capitaines'],['war',20,'3_bataille'],['tense',14,'3b_bataille_menace'],['win',10,'fin_victoire'],['lose',12,'fin_defaite']]){
  const r=await p.evaluate(async([sc,sec,b0])=>{const X=__RK,S=X.SND,M=X.MEDX,sr=44100,off=new OfflineAudioContext(2,sr*sec,sr);
    const len={explore:b0?M.large.len*0+M.port.len:M.port.len,dev:M.conseil.len,tense:M.bataille.len*1.25,war:M.bataille.len,win:M.large.len*.9,lose:M.conseil.len*1.6}[sc];
    X.sndBuild(off);S.on=true;S.mv=.6;S.mus.gain.value=S.mv*.9;S.scene=sc;S.beat=0;S.bar=b0||0;
    for(let t=.05;t<sec-1.5;t+=len){X.sndBeat(t);S.beat=(S.beat+1)%8;if(!S.beat)S.bar++;}
    const buf=await off.startRendering(),d0=buf.getChannelData(0),d1=buf.getChannelData(1);
    let pk=0,ss=0,nan=0;for(let i=0;i<d0.length;i++){const v=d0[i];if(!isFinite(v))nan++;else{pk=Math.max(pk,Math.abs(v));ss+=v*v;}}
    /* WAV 16 bits stéréo */
    const n=d0.length,ab=new ArrayBuffer(44+n*4),dv=new DataView(ab);const w=(o,s)=>{for(let i=0;i<s.length;i++)dv.setUint8(o+i,s.charCodeAt(i));};
    w(0,'RIFF');dv.setUint32(4,36+n*4,true);w(8,'WAVEfmt ');dv.setUint32(16,16,true);dv.setUint16(20,1,true);dv.setUint16(22,2,true);dv.setUint32(24,sr,true);dv.setUint32(28,sr*4,true);dv.setUint16(32,4,true);dv.setUint16(34,16,true);w(36,'data');dv.setUint32(40,n*4,true);
    for(let i=0;i<n;i++){dv.setInt16(44+i*4,Math.max(-1,Math.min(1,d0[i]))*32767,true);dv.setInt16(46+i*4,Math.max(-1,Math.min(1,d1[i]))*32767,true);}
    let bin='';const u=new Uint8Array(ab);for(let i=0;i<u.length;i+=32768)bin+=String.fromCharCode.apply(null,u.subarray(i,i+32768));
    return {name:X.SND&&document.title,pk,rms:Math.sqrt(ss/d0.length),nan,notes:S.n,b64:btoa(bin)};},[sc,sec,b0]);
  if(process.argv[2]==='wav')fs.writeFileSync(OUT+'musique_'+file+'.wav',Buffer.from(r.b64,'base64'));
  const okk=r.rms>.01&&r.pk<1&&r.nan===0;
  res.push((okk?'PASS ':'FAIL ')+sc+' ('+file+') — crête '+r.pk.toFixed(2)+' · RMS '+r.rms.toFixed(3)+' · NaN '+r.nan);
}
for(const x of res)console.log(x);console.log(errs.join('\n')||'aucune erreur JS');await b.close();})();
