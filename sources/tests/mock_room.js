/* Simulation locale de la capacité « room » de claude.ai (BroadcastChannel) pour tester le multijoueur entre deux onglets. */
window.claude={use:async n=>{
  if(n!=='room')return null;
  const me='p'+Math.random().toString(36).slice(2,10);
  const mk=name=>{
    const bc=new BroadcastChannel('room-'+name),peers=new Map(),hs={},ph=[];let mine={};let snap=Object.freeze([]);
    const rebuild=()=>{snap=Object.freeze([...peers.values()].map(x=>Object.freeze({...x,isMe:x.peer===me,sameTab:x.peer===me,kind:'viewer',guest:false,by:null})));setTimeout(()=>ph.forEach(f=>f({peers:snap})),0);};
    const up=(peer,presence)=>{peers.set(peer,{peer,presence,updatedAt:Date.now()});rebuild();};
    bc.onmessage=e=>{const m=e.data;if(m.t==='pres'){up(m.peer,m.p);if(m.hello)bc.postMessage({t:'pres',peer:me,p:mine});}else if(m.t==='bye'){peers.delete(m.peer);rebuild();}else if(m.t==='ev'){(hs[m.topic]||[]).forEach(f=>f({topic:m.topic,data:m.data,peer:m.peer,isMe:false,sameTab:false,kind:'viewer',by:null,guest:false}));}};
    up(me,{});bc.postMessage({t:'pres',peer:me,p:{},hello:1});
    addEventListener('pagehide',()=>bc.postMessage({t:'bye',peer:me}));
    return {name,
      emit:async(topic,data)=>{bc.postMessage({t:'ev',topic,data,peer:me});(hs[topic]||[]).forEach(f=>f({topic,data,peer:me,isMe:true,sameTab:true,kind:'viewer',by:null,guest:false}));},
      on:(topic,f)=>{(hs[topic]=hs[topic]||[]).push(f);return ()=>{hs[topic]=hs[topic].filter(x=>x!==f);};},
      presence:async patch=>{for(const k in patch){if(patch[k]===null)delete mine[k];else mine[k]=patch[k];}mine={...mine};up(me,mine);bc.postMessage({t:'pres',peer:me,p:mine});},
      peers:()=>snap,onPeers:f=>{ph.push(f);setTimeout(()=>f({peers:snap}),0);return ()=>{};},
      connected:()=>true,onConnection:f=>()=>{},leave:async()=>{bc.postMessage({t:'bye',peer:me});bc.close();}};
  };
  const lobby=mk('__lobby');return Object.assign(lobby,{join:async name=>mk(name)});
}};
