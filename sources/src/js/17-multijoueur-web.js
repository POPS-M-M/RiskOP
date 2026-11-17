/* ================= Multijoueur hors claude.ai : salle pair-à-pair (PeerJS / WebRTC) =================
   Utilisé seulement quand la page n'est PAS ouverte dans claude.ai (pas de window.claude), par exemple
   quand le fichier index.html est hébergé sur GitHub Pages. Fournit la même interface que la salle de claude.ai :
   join(nom) → {emit, on, presence, peers, onPeers, connected, onConnection, leave}.
   Topologie en étoile : le premier navigateur qui ouvre une salle prend l'identifiant public « riskop-v1-<nom> »
   et relaie présences et messages ; les suivants s'y connectent. Mise en relation : serveur public gratuit de PeerJS
   (0.peerjs.com), relais TURN de PeerJS si une connexion directe est impossible. Les ordres de jeu restent chiffrés
   de bout en bout par la couche réseau du jeu (ECDH + AES-GCM). */
const PEER_CDN='https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js';
function rkLoadPeer(){return new Promise((res,rej)=>{if(window.Peer)return res();const s=document.createElement('script');s.src=PEER_CDN;s.onload=()=>window.Peer?res():rej(new Error('peerjs'));s.onerror=()=>rej(new Error('peerjs'));document.head.appendChild(s);});}
async function rkPeerRoom(){
  try{await rkLoadPeer();}catch(_){NET.why='Le module réseau (PeerJS) n’a pas pu être chargé : vérifiez la connexion internet, puis rechargez la page.';return null;}
  return {join:rkPeerJoin};
}
function rkPeerJoin(name){
  const HUB='riskop-v1-'+String(name).toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,40);
  return new Promise((resolve,reject)=>{
    const R={hs:{},ph:[],cc:[],mine:{},peers:new Map(),snap:Object.freeze([]),hub:false,conns:new Map(),toHub:null,me:null,ok:false,done:false};
    let peer=null;
    const fail=code=>{if(!R.ok&&!R.done){R.done=true;try{peer&&peer.destroy();}catch(_){}reject({code,message:'Connexion à la salle impossible ('+code+').'});}};
    const small=p=>{try{return p&&typeof p==='object'&&!Array.isArray(p)&&JSON.stringify(p).length<=8192?p:{};}catch(_){return {};}};
    const entry=(id,p)=>({peer:id,presence:p,updatedAt:Date.now()});
    const snapshot=()=>{R.snap=Object.freeze([...R.peers.values()].map(x=>Object.freeze({peer:x.peer,presence:x.presence||{},updatedAt:x.updatedAt,isMe:x.peer===R.me,sameTab:x.peer===R.me,kind:'viewer',guest:false,by:null})));
      const s=R.snap;setTimeout(()=>R.ph.slice().forEach(f=>{try{f({peers:s});}catch(_){}}),0);};
    const deliver=(topic,data,from)=>{(R.hs[topic]||[]).slice().forEach(f=>{try{f({topic,data,peer:from,isMe:from===R.me,sameTab:from===R.me,kind:'viewer',guest:false,by:null});}catch(_){}});};
    const conn=v=>R.cc.slice().forEach(f=>{try{f(v);}catch(_){}});
    const hubPeers=()=>{const list=[...R.peers.values()];for(const c of R.conns.values())if(c.open)try{c.send({t:'peers',list});}catch(_){}snapshot();};
    const api={name,
      emit:async(topic,data)=>{
        if(R.hub){deliver(topic,data,R.me);for(const c of R.conns.values())if(c.open)try{c.send({t:'ev',topic,data,peer:R.me});}catch(_){}}
        else if(R.toHub&&R.toHub.open){try{R.toHub.send({t:'ev',topic,data});}catch(_){}deliver(topic,data,R.me);}
      },
      on:(topic,f)=>{(R.hs[topic]=R.hs[topic]||[]).push(f);return ()=>{R.hs[topic]=(R.hs[topic]||[]).filter(x=>x!==f);};},
      presence:async patch=>{
        for(const k in patch){if(patch[k]===null)delete R.mine[k];else R.mine[k]=patch[k];}R.mine={...R.mine};
        if(R.me)R.peers.set(R.me,entry(R.me,R.mine));
        if(R.hub)hubPeers();else{snapshot();if(R.toHub&&R.toHub.open)try{R.toHub.send({t:'pres',p:R.mine});}catch(_){}}
      },
      peers:()=>R.snap,
      onPeers:f=>{R.ph.push(f);setTimeout(()=>f({peers:R.snap}),0);return ()=>{R.ph=R.ph.filter(x=>x!==f);};},
      connected:()=>R.hub||!!(R.toHub&&R.toHub.open),
      onConnection:f=>{R.cc.push(f);return ()=>{R.cc=R.cc.filter(x=>x!==f);};},
      leave:async()=>{R.done=true;R.hs={};R.ph=[];try{peer&&peer.destroy();}catch(_){}}
    };
    /* 1) tenter d'ouvrir la salle (devenir le relais) */
    try{peer=new Peer(HUB,{debug:0});}catch(_){fail('upstream_error');return;}
    peer.on('open',id=>{if(R.done)return;R.hub=true;R.me=id;R.ok=true;R.peers.set(id,entry(id,R.mine));snapshot();conn(true);resolve(api);});
    peer.on('connection',c=>{
      c.on('open',()=>{R.conns.set(c.peer,c);try{c.send({t:'peers',list:[...R.peers.values()]});}catch(_){}});
      c.on('data',m=>{if(!m||typeof m!=='object')return;const pid=c.peer;
        if(m.t==='pres'){R.peers.set(pid,entry(pid,small(m.p)));hubPeers();}
        else if(m.t==='ev'&&typeof m.topic==='string'&&m.topic.length<48){deliver(m.topic,m.data,pid);for(const [k,o] of R.conns)if(o.open&&k!==pid)try{o.send({t:'ev',topic:m.topic,data:m.data,peer:pid});}catch(_){}}});
      const gone=()=>{if(R.conns.get(c.peer)===c){R.conns.delete(c.peer);R.peers.delete(c.peer);hubPeers();}};
      c.on('close',gone);c.on('error',gone);
    });
    peer.on('error',err=>{
      if(R.ok||R.done)return;
      if(err&&err.type==='unavailable-id'){
        /* 2) la salle existe déjà : s'y connecter */
        try{peer.destroy();}catch(_){}
        try{peer=new Peer({debug:0});}catch(_){fail('upstream_error');return;}
        peer.on('open',id=>{if(R.done)return;R.me=id;
          const c=peer.connect(HUB,{reliable:true});R.toHub=c;
          c.on('open',()=>{if(R.done)return;R.ok=true;R.peers.set(id,entry(id,R.mine));try{c.send({t:'pres',p:R.mine});}catch(_){}snapshot();conn(true);resolve(api);});
          c.on('data',m=>{if(!m||typeof m!=='object')return;
            if(m.t==='peers'&&Array.isArray(m.list)){R.peers=new Map(m.list.filter(x=>x&&typeof x.peer==='string').map(x=>[x.peer,entry(x.peer,small(x.presence))]));if(!R.peers.has(R.me))R.peers.set(R.me,entry(R.me,R.mine));snapshot();}
            else if(m.t==='ev'&&typeof m.topic==='string')deliver(m.topic,m.data,typeof m.peer==='string'?m.peer:HUB);});
          c.on('close',()=>{R.peers=new Map([[R.me,entry(R.me,R.mine)]]);snapshot();conn(false);});
        });
        peer.on('error',e=>{if(!R.ok)fail(e&&e.type==='peer-unavailable'?'not_found':'upstream_error');});
      }else fail('upstream_error');
    });
    setTimeout(()=>fail('upstream_error'),20000);
    /* fermeture de l'onglet : on prévient tout de suite les autres (sinon WebRTC peut mettre plusieurs secondes à s'en apercevoir) */
    addEventListener('pagehide',()=>{try{peer&&peer.destroy();}catch(_){}});
  });
}
/* export de la collection d'illustrations hors claude.ai : téléchargement direct du navigateur */
function rkWebDownloads(){return {save:async({filename,data})=>{const u=URL.createObjectURL(data),a=document.createElement('a');a.href=u;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);}};}
