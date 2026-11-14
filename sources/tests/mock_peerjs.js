/* Imitation locale de PeerJS (même onglet ou onglets voisins, via BroadcastChannel) pour tester la couche réseau web. */
(()=>{const bus=new BroadcastChannel('fake-peerjs'),owned=new Map(),pending=new Map(),conns=new Map();
class Em{constructor(){this.h={};}on(e,f){(this.h[e]=this.h[e]||[]).push(f);return this;}emit(e,...a){(this.h[e]||[]).forEach(f=>f(...a));}}
class Conn extends Em{constructor(cid,me,peer){super();this.cid=cid;this.me=me;this.peer=peer;this.open=false;conns.set(cid+':'+me,this);}
  send(d){if(!this.open)return;bus.postMessage({t:'data',cid:this.cid,to:this.peer,d:JSON.parse(JSON.stringify(d))});}close(){if(!this.open)return;this.open=false;bus.postMessage({t:'close',cid:this.cid,to:this.peer});this.emit('close');}}
class Peer extends Em{constructor(id){super();if(typeof id!=='string')id='rnd'+Math.random().toString(36).slice(2,10);this.id=id;this.dead=false;this.my=[];
  const nonce=Math.random();pending.set(nonce,this);bus.postMessage({t:'claim',id,nonce});
  setTimeout(()=>{if(!pending.has(nonce))return;pending.delete(nonce);owned.set(id,this);this.emit('open',id);},150);}
  connect(to){const cid=Math.random().toString(36).slice(2);const c=new Conn(cid,this.id,to);this.my.push(c);bus.postMessage({t:'conn',cid,from:this.id,to});
    setTimeout(()=>{if(!c.open)this.emit('error',{type:'peer-unavailable'});},1200);return c;}
  destroy(){this.dead=true;owned.delete(this.id);this.my.forEach(c=>c.close());}}
bus.onmessage=e=>{const m=e.data;
  if(m.t==='claim'){const o=owned.get(m.id);if(o&&!o.dead)bus.postMessage({t:'taken',nonce:m.nonce});}
  else if(m.t==='taken'){const p=pending.get(m.nonce);if(p){pending.delete(m.nonce);p.emit('error',{type:'unavailable-id'});}}
  else if(m.t==='conn'){const o=owned.get(m.to);if(o&&!o.dead){const c=new Conn(m.cid,o.id,m.from);o.my.push(c);o.emit('connection',c);c.open=true;bus.postMessage({t:'ack',cid:m.cid,to:m.from});setTimeout(()=>c.emit('open'),0);}}
  else if(m.t==='ack'){const c=conns.get(m.cid+':'+m.to);if(c){c.open=true;c.emit('open');}}
  else if(m.t==='data'){const c=conns.get(m.cid+':'+m.to);if(c&&c.open)c.emit('data',m.d);}
  else if(m.t==='close'){const c=conns.get(m.cid+':'+m.to);if(c&&c.open){c.open=false;c.emit('close');}}};
window.Peer=Peer;})();
