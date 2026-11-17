import { Vector3, CatmullRomCurve3, Curve } from 'three';

export const DEFAULT_RED_LINE=Object.freeze({x:0,halfWidth:.45,minZ:-15,maxZ:15,passages:Object.freeze([{z:.5,width:4.2},{z:8,width:4.2}])});
const TAU=Math.PI*2,EPS=1e-6,clamp=(n,a=0,b=1)=>Math.min(b,Math.max(a,n));
const gridCache=new Map();

/** Chart islands {x,y,rad} are conservatively expanded 18%; world circles use {x,z,radius}. */
export function normalizeMaritimeIsland(t={}){
  const chart=!Number.isFinite(Number(t.z))&&Number.isFinite(Number(t.y));
  const x=chart?(Number(t.x)-700)/30:Number(t.x)||0,z=chart?(Number(t.y)-430)/30:Number(t.z)||0;
  const radius=Number.isFinite(Number(t.radius))?Math.max(0,Number(t.radius)):Number.isFinite(Number(t.rad))?Math.max(0,Number(t.rad)/30*1.18):0;
  return {id:t.id,name:t.name,x,z,radius};
}
function normalizeWall(wall){
  if(wall===null||wall===false)return null;
  const w=wall||DEFAULT_RED_LINE;
  return {x:Number(w.x)||0,halfWidth:Math.max(.01,Number(w.halfWidth??(Number(w.width)/2))||.45),minZ:Number(w.minZ??-15),maxZ:Number(w.maxZ??15),passages:(w.passages||DEFAULT_RED_LINE.passages).map(p=>({z:Number(p.z)||0,width:Math.max(.01,Number(p.width)||4.2)}))};
}
const circleKey=o=>[o.id??o.name??'',o.x.toFixed(4),o.z.toFixed(4),o.radius.toFixed(4)].join(':');
function circlesOf(islands=[]){return islands.map(normalizeMaritimeIsland).filter(o=>o.radius>0);}
function wallAllows(z0,z1,w,margin){return !w||w.passages.some(p=>Math.min(z0,z1)>=p.z-p.width/2+margin-EPS&&Math.max(z0,z1)<=p.z+p.width/2-margin+EPS);}
function pointClear(p,obstacles,wall,margin){
  for(const o of obstacles)if(Math.hypot(p.x-o.x,p.z-o.z)<o.radius+margin-EPS)return false;
  // Red Line is a world barrier: a boat may not bypass its rendered chart endpoints.
  if(wall&&Math.abs(p.x-wall.x)<wall.halfWidth+margin-EPS&&!wallAllows(p.z,p.z,wall,margin))return false;
  return true;
}
/** Pure collision test. Wall passages are their TOTAL widths, with ship clearance subtracted. */
export function isNavigable(point,islands=[],wall=DEFAULT_RED_LINE,margin=.22){return pointClear(normalizeMaritimeIsland(point),circlesOf(islands),normalizeWall(wall),Math.max(0,Number(margin)||0));}
function segmentClear(a,b,obstacles,wall,margin){
  if(!pointClear(a,obstacles,wall,margin)||!pointClear(b,obstacles,wall,margin))return false;
  const dx=b.x-a.x,dz=b.z-a.z,length2=dx*dx+dz*dz;
  for(const o of obstacles){const q=length2?clamp(((o.x-a.x)*dx+(o.z-a.z)*dz)/length2):0,ex=a.x+dx*q-o.x,ez=a.z+dz*q-o.z,r=o.radius+margin;if(ex*ex+ez*ez<(r-EPS)*(r-EPS))return false;}
  if(wall){
    const lo=wall.x-wall.halfWidth-margin,hi=wall.x+wall.halfWidth+margin;
    let t0=0,t1=1;
    if(Math.abs(dx)<EPS){if(a.x<lo||a.x>hi)return true;}
    else{const p=(lo-a.x)/dx,q=(hi-a.x)/dx;t0=Math.max(0,Math.min(p,q));t1=Math.min(1,Math.max(p,q));if(t0>t1)return true;}
    if(!wallAllows(a.z+dz*t0,a.z+dz*t1,wall,margin))return false;
  }
  return true;
}
function nearestWater(point,toward,obstacles,wall,margin){
  if(pointClear(point,obstacles,wall,margin))return new Vector3(point.x,0,point.z);
  const angle=Math.atan2(toward.z-point.z,toward.x-point.x);
  for(let step=1;step<=90;step++){
    const radius=step*.12;
    for(let j=0;j<32;j++){const a=angle+(j%2?1:-1)*Math.ceil(j/2)*TAU/32,p={x:point.x+Math.cos(a)*radius,z:point.z+Math.sin(a)*radius};if(pointClear(p,obstacles,wall,margin))return new Vector3(p.x,0,p.z);}
  }
  return null;
}
function portFor(island,toward,obstacles,wall,margin,lane=0,normal){
  if(!island.radius)return nearestWater(island,toward,obstacles,wall,margin);
  const distance=Math.hypot(toward.x-island.x,toward.z-island.z)||1,n=normal||{x:-(toward.z-island.z)/distance,z:(toward.x-island.x)/distance};
  const reach=island.radius+margin+.045;
  const direction={x:(toward.x-island.x)/distance+n.x*lane/reach,z:(toward.z-island.z)/distance+n.z*lane/reach};
  const preferred=Math.atan2(direction.z,direction.x);
  let best=null,bestCost=Infinity;
  for(let ring=0;ring<5;ring++){
    const rr=reach+ring*.12;
    for(let j=0;j<96;j++){
      const offset=(j%2?1:-1)*Math.ceil(j/2)*TAU/96,a=preferred+offset,p={x:island.x+Math.cos(a)*rr,z:island.z+Math.sin(a)*rr};
      if(!pointClear(p,obstacles,wall,margin))continue;
      const score=Math.hypot(p.x-toward.x,p.z-toward.z)+Math.abs(offset)*.18+ring*.3;
      if(score<bestCost-EPS){bestCost=score;best=new Vector3(p.x,0,p.z);}
    }
    if(best)return best;
  }
  return nearestWater({x:island.x+direction.x*reach,z:island.z+direction.z*reach},toward,obstacles,wall,margin);
}
/** Pick a clear sea-side port; callers can also supply world points without radius. */
export function coastalPort(island,toward,islands=[],wall=DEFAULT_RED_LINE,margin=.22,lane=0){
  const a=normalizeMaritimeIsland(island),b=normalizeMaritimeIsland(toward),obstacles=circlesOf(islands);
  if(a.radius&&!obstacles.some(o=>o.id!==undefined&&o.id===a.id||Math.hypot(o.x-a.x,o.z-a.z)<EPS))obstacles.push(a);
  return portFor(a,b,obstacles,normalizeWall(wall),Math.max(0,Number(margin)||0),Number(lane)||0);
}

class Heap{
  constructor(){this.a=[];}
  push(id,score){const item={id,score},a=this.a;a.push(item);let i=a.length-1;while(i){const p=(i-1)>>1;if(a[p].score<=score)break;a[i]=a[p];i=p;}a[i]=item;}
  pop(){const a=this.a;if(!a.length)return null;const first=a[0],last=a.pop();if(a.length){let i=0;while(true){let c=i*2+1;if(c>=a.length)break;if(c+1<a.length&&a[c+1].score<a[c].score)c++;if(a[c].score>=last.score)break;a[i]=a[c];i=c;}a[i]=last;}return first;}
}
function makeGrid(start,end,obstacles,wall,margin,step){
  let minX=Math.min(start.x,end.x),maxX=Math.max(start.x,end.x),minZ=Math.min(start.z,end.z),maxZ=Math.max(start.z,end.z);
  for(const o of obstacles){minX=Math.min(minX,o.x-o.radius);maxX=Math.max(maxX,o.x+o.radius);minZ=Math.min(minZ,o.z-o.radius);maxZ=Math.max(maxZ,o.z+o.radius);}
  if(wall)for(const p of wall.passages){minZ=Math.min(minZ,p.z-p.width/2);maxZ=Math.max(maxZ,p.z+p.width/2);}
  const pad=2.4,minGX=Math.floor((minX-pad)/step),minGZ=Math.floor((minZ-pad)/step),width=Math.ceil((maxX+pad)/step)-minGX+1,height=Math.ceil((maxZ+pad)/step)-minGZ+1;
  const key=[minGX,minGZ,width,height,step,margin,wall?JSON.stringify(wall):'no-wall',obstacles.map(circleKey).join('|')].join(';');
  if(gridCache.has(key))return gridCache.get(key);
  if(width*height>240000)return null;
  const allowed=new Uint8Array(width*height),point=(id)=>({x:(minGX+id%width)*step,z:(minGZ+Math.floor(id/width))*step});
  for(let i=0;i<allowed.length;i++)allowed[i]=pointClear(point(i),obstacles,wall,margin)?1:0;
  const grid={allowed,width,height,minGX,minGZ,step,point};gridCache.set(key,grid);if(gridCache.size>5)gridCache.delete(gridCache.keys().next().value);return grid;
}
function gridLinks(p,grid,obstacles,wall,margin){
  const gx=Math.round(p.x/grid.step)-grid.minGX,gz=Math.round(p.z/grid.step)-grid.minGZ,links=[];
  for(let radius=0;radius<=5;radius++){
    for(let y=Math.max(0,gz-radius);y<=Math.min(grid.height-1,gz+radius);y++)for(let x=Math.max(0,gx-radius);x<=Math.min(grid.width-1,gx+radius);x++){
      if(radius&&Math.max(Math.abs(x-gx),Math.abs(y-gz))!==radius)continue;const id=y*grid.width+x;if(grid.allowed[id]&&segmentClear(p,grid.point(id),obstacles,wall,margin))links.push({id,cost:Math.hypot(grid.point(id).x-p.x,grid.point(id).z-p.z)});
    }
    if(links.length>=3||radius>=2&&links.length)break;
  }
  return links;
}
function aStar(start,end,obstacles,wall,margin,step){
  if(segmentClear(start,end,obstacles,wall,margin))return [start.clone(),end.clone()];
  const grid=makeGrid(start,end,obstacles,wall,margin,step);if(!grid)return null;
  const links=gridLinks(start,grid,obstacles,wall,margin),ends=gridLinks(end,grid,obstacles,wall,margin);if(!links.length||!ends.length)return null;
  const targets=new Map(ends.map(q=>[q.id,q.cost])),N=grid.allowed.length,scores=new Float64Array(N).fill(Infinity),parents=new Int32Array(N).fill(-1),closed=new Uint8Array(N),heap=new Heap();
  for(const q of links){scores[q.id]=q.cost;const p=grid.point(q.id);heap.push(q.id,q.cost+Math.hypot(p.x-end.x,p.z-end.z));}
  let finish=-1,best=Infinity,iterations=0;
  const neighbors=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
  while(heap.a.length&&iterations++<N*2){
    const node=heap.pop(),id=node.id;if(closed[id])continue;if(node.score>best)break;closed[id]=1;
    if(targets.has(id)){const total=scores[id]+targets.get(id);if(total<best){best=total;finish=id;}}
    const x=id%grid.width,z=Math.floor(id/grid.width),A=grid.point(id);
    for(const [dx,dz]of neighbors){const xx=x+dx,zz=z+dz;if(xx<0||zz<0||xx>=grid.width||zz>=grid.height)continue;const next=zz*grid.width+xx;if(!grid.allowed[next]||closed[next])continue;if(dx&&dz&&(!grid.allowed[z*grid.width+xx]||!grid.allowed[zz*grid.width+x]))continue;const B=grid.point(next);if(!segmentClear(A,B,obstacles,wall,margin))continue;const cost=scores[id]+Math.hypot(dx,dz)*grid.step;if(cost>=scores[next]-EPS)continue;scores[next]=cost;parents[next]=id;heap.push(next,cost+Math.hypot(B.x-end.x,B.z-end.z));}
  }
  if(finish<0)return null;const points=[end.clone()];for(let id=finish;id>=0;id=parents[id]){const p=grid.point(id);points.push(new Vector3(p.x,0,p.z));}points.push(start.clone());return points.reverse();
}
function pull(points,obstacles,wall,margin){
  if(!points?.length)return null;const result=[points[0].clone()];let at=0;
  while(at<points.length-1){let next=points.length-1;while(next>at+1&&!segmentClear(points[at],points[next],obstacles,wall,margin))next--;if(!segmentClear(points[at],points[next],obstacles,wall,margin))return null;result.push(points[next].clone());at=next;}
  return result;
}
class SeaPolyline extends Curve{
  constructor(points){super();this.points=points.map(p=>p.clone());this.cumulative=[0];for(let i=1;i<points.length;i++)this.cumulative.push(this.cumulative[i-1]+points[i].distanceTo(points[i-1]));this.length=this.cumulative.at(-1)||0;}
  getLength(){return this.length;}
  getPoint(t,target=new Vector3()){const d=clamp(t)*this.length;let i=1;while(i<this.cumulative.length-1&&this.cumulative[i]<d)i++;return target.lerpVectors(this.points[i-1],this.points[i],clamp((d-this.cumulative[i-1])/Math.max(EPS,this.cumulative[i]-this.cumulative[i-1])));}
  getPointAt(t,target=new Vector3()){return this.getPoint(t,target);}
  getTangent(t,target=new Vector3()){const p=this.getPoint(Math.max(0,t-.0005)),q=this.getPoint(Math.min(1,t+.0005));return target.subVectors(q,p).normalize();}
  getTangentAt(t,target=new Vector3()){return this.getTangent(t,target);}
}
function validateCurve(curve,obstacles,wall,margin){
  const length=curve.getLength(),samples=Math.max(32,Math.ceil(length/.055));let previous=curve.getPointAt(0);
  for(let i=1;i<=samples;i++){const p=curve.getPointAt(i/samples);if(!segmentClear(previous,p,obstacles,wall,margin))return false;previous=p;}return true;
}
function finishRoute(points,obstacles,wall,margin,lane,key,start,end){
  let path=pull(points,obstacles,wall,margin);if(!path||path.length<2)return invalidRoute(key,start,end);
  // Separate open-water lanes even when both endpoints are explicit water ports.
  if(lane&&path.length===2){const middle=path[0].clone().lerp(path[1],.5),direction=path[1].clone().sub(path[0]).normalize();middle.add(new Vector3(-direction.z,0,direction.x).multiplyScalar(lane));if(segmentClear(path[0],middle,obstacles,wall,margin)&&segmentClear(middle,path[1],obstacles,wall,margin))path=[path[0],middle,path[1]];}
  // Offset open-water bends, progressively reducing the offset if a coast is close.
  else if(lane&&path.length>2){for(const weight of [1,.5,.25]){const shifted=path.map((p,i)=>{if(!i||i===path.length-1)return p.clone();const d=path[i+1].clone().sub(path[i-1]).normalize();return p.clone().add(new Vector3(-d.z,0,d.x).multiplyScalar(lane*weight));});if(shifted.slice(1).every((p,i)=>segmentClear(shifted[i],p,obstacles,wall,margin))){path=shifted;break;}}}
  let curve=path.length>2?new CatmullRomCurve3(path.map(p=>p.clone()),false,'centripetal',.25):new SeaPolyline(path);curve.arcLengthDivisions=Math.max(1600,path.length*300);
  if(!validateCurve(curve,obstacles,wall,margin))curve=new SeaPolyline(path);
  if(!validateCurve(curve,obstacles,wall,margin))return invalidRoute(key,start,end);
  const length=curve.getLength();
  return {valid:true,key,points:path.map(p=>p.clone()),curve,start:start.clone(),end:end.clone(),length,getPoint:(t,target=new Vector3())=>curve.getPointAt(clamp(t),target),getTangent:(t,target=new Vector3())=>curve.getTangentAt(clamp(t),target)};
}
function invalidRoute(key,start,end){return {valid:false,key,points:[],curve:null,start:start?.clone?.()||null,end:end?.clone?.()||null,length:0,getPoint:()=>null,getTangent:()=>new Vector3(0,0,1)};}
export function maritimeRouteKey({from,to,islands=[],wall=DEFAULT_RED_LINE,lane=0,margin=.22,cellSize=.24}={}){const a=normalizeMaritimeIsland(from),b=normalizeMaritimeIsland(to);return [circleKey(a),circleKey(b),Number(lane).toFixed(4),margin,cellSize,wall?JSON.stringify(normalizeWall(wall)):'no-wall',circlesOf(islands).map(circleKey).join('|')].join(';');}

/**
 * Safe, constant-distance maritime route. Supply world {x,z,radius} or chart
 * {x,y,rad}; an endpoint with no radius is an explicit water point. `wall:null`
 * disables Red Line for local cinematic scenes. Positive lane is a world-unit
 * lateral offset relative to departure→arrival. No unsafe straight fallback.
 */
export function planMaritimeRoute({from,to,islands=[],wall=DEFAULT_RED_LINE,lane=0,margin=.22,cellSize=.24}={}){
  const a=normalizeMaritimeIsland(from),b=normalizeMaritimeIsland(to),w=normalizeWall(wall),clearance=Math.max(.01,Number.isFinite(Number(margin))?Number(margin):.22),step=clamp(Number(cellSize)||.24,.08,.6),offset=clamp(Number(lane)||0,-1,1),obstacles=circlesOf(islands);
  for(const p of [a,b])if(p.radius&&!obstacles.some(o=>p.id!==undefined&&o.id===p.id||Math.hypot(o.x-p.x,o.z-p.z)<EPS))obstacles.push(p);
  const key=maritimeRouteKey({from:a,to:b,islands:obstacles,wall:w,lane:offset,margin:clearance,cellSize:step});
  const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz)||1,normal={x:-dz/d,z:dx/d};
  const start=portFor(a,b,obstacles,w,clearance,offset,normal),end=portFor(b,a,obstacles,w,clearance,offset,normal);if(!start||!end||start.distanceTo(end)<EPS)return invalidRoute(key,start,end);
  let points=aStar(start,end,obstacles,w,clearance,step);
  if(w&&(!points||(start.x-w.x)*(end.x-w.x)<0)){
    // A coarse grid can miss a narrow coastal channel and return a distant portal.
    // Compare analytical water anchors as well, including almost the full safe width.
    let best=points,bestLength=points?points.slice(1).reduce((n,p,i)=>n+p.distanceTo(points[i]),0):Infinity;
    for(const passage of w.passages)for(const fraction of [0,.5,-.5,.85,-.85,.97,-.97,.99999,-.99999]){
      const z=passage.z+fraction*Math.max(0,passage.width/2-clearance-.0001),side=start.x<w.x?-1:1;
      const A=new Vector3(w.x+side*(w.halfWidth+clearance+.1),0,z),B=new Vector3(w.x-side*(w.halfWidth+clearance+.1),0,z);
      if(!segmentClear(A,B,obstacles,w,clearance))continue;
      const first=aStar(start,A,obstacles,w,clearance,step),last=aStar(B,end,obstacles,w,clearance,step);if(!first||!last)continue;
      const candidate=[...first,...last],length=candidate.slice(1).reduce((n,p,i)=>n+p.distanceTo(candidate[i]),0);if(length<bestLength){bestLength=length;best=candidate;}
    }
    points=best;
  }
  if(!points)return invalidRoute(key,start,end);
  return finishRoute(points,obstacles,w,clearance,offset,key,start,end);
}
