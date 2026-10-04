const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*t*(t*(t*6-15)+10);};
const mix=(a,b,t)=>a+(b-a)*t;
const paper=['#e8e5dc','#ddcfc3','#cdd5cf','#e5e1d9','#d8cbbd','#cbd3d1'];
export function blendColor(from,to,t){const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));return `rgb(${rgb(from).map((v,i)=>Math.round(mix(v,rgb(to)[i],t))).join(',')})`;}
export function buildRoute(chapters,width,height){
  const introLength=height*2.65,compact=width<761?.78:1;
  let at=introLength,x=0;const segments=[];
  // Coordinates describe the hanging itself, not a regular row grid.
  const origins=chapters.map(chapter=>{
    const hanging=chapter.hanging||{},sceneY=[0];
    for(let j=0;j<chapter.scenes.length-1;j++)sceneY.push(sceneY[j]+height*(hanging.steps?.[j]??1.12)*compact);
    const origin={x,y:(hanging.start||0)*height*compact,sceneY,height:sceneY.at(-1)+height,start:0};
    x+=width*(hanging.next??1.12);return origin;
  });
  segments.push({start:0,end:at,type:'intro',chapter:0,panel:0,x:0,y:0,toX:0,toY:0});
  chapters.forEach((chapter,i)=>{
    const origin=origins[i];origin.start=at;
    for(let j=0;j<chapter.scenes.length-1;j++){
      const y=origin.y+origin.sceneY[j],toY=origin.y+origin.sceneY[j+1],length=toY-y;
      // One scroll pixel moves the gallery one pixel: no per-image easing, hold or zoom.
      segments.push({start:at,end:at+length,x:origin.x,y,toX:origin.x,toY,chapter:i,panel:j,type:'vertical'});at+=length;
    }
    if(i<chapters.length-1){
      const next=origins[i+1],bottom=origin.y+origin.sceneY.at(-1),length=height*[1.9,2.05,1.85,2,1.92][i%5];
      segments.push({start:at,end:at+length,x:origin.x,y:bottom,toX:next.x,toY:next.y,chapter:i,panel:chapter.scenes.length-1,type:chapter.transition,wide:Math.min([.30,.34,.29,.33,.31][i%5],.86/(1+Math.abs(bottom-next.y)/height)),drift:[-.07,.06,-.045,.075,0][i%5]});at+=length;
    }
  });
  const last=origins.at(-1),bottom=last.y+last.sceneY.at(-1);
  segments.push({start:at,end:at+height*.38,x:last.x,y:bottom,toX:last.x,toY:bottom,chapter:chapters.length-1,panel:chapters.at(-1).scenes.length-1,type:'hold'});at+=height*.38;
  return {segments,origins,length:at,introLength,width,height};
}
export function locateRoute(route,position,{reducedMotion=false}={}){
  const s=route.segments.find(segment=>position<segment.end)||route.segments.at(-1);
  const t=clamp((position-s.start)/(s.end-s.start));
  if(s.type==='intro'){
    const enter=smooth(.42,.94,t),reveal=smooth(.025,.25,t),dock=smooth(.025,.40,t);
    const overview=mix(.43,.235,smooth(0,.28,t));
    return {...s,t,cameraX:reducedMotion?0:route.width*.68*(1-enter),cameraY:reducedMotion?0:route.height*1.22*(1-enter),scale:reducedMotion?1:mix(overview,1,enter),dock:reducedMotion?(t>.10?1:0):dock,reveal,focus:enter,activeChapter:0,activePanel:0,entered:t>=.94,background:blendColor('#0b0c0e',paper[0],smooth(.08,.42,t))};
  }
  const hold=s.type==='hold',cross=s.type!=='vertical'&&!hold;
  const travel=hold?1:!cross?t:reducedMotion?(t<.5?0:1):smooth(.26,.75,t),pull=smooth(.10,.36,t),push=smooth(.65,.91,t),away=!cross||reducedMotion?0:pull*(1-push);
  const chapter=s.chapter+(cross&&travel>=.5?1:0),panel=hold?s.panel:cross?(travel<.5?s.panel:0):s.panel+(travel>=.5?1:0);
  const arc=!cross||reducedMotion||travel===0||travel===1?0:Math.sin(travel*Math.PI)*(s.drift||0);
  return {...s,t,cameraX:mix(s.x,s.toX,travel)+(cross?0:arc*route.width),cameraY:mix(s.y,s.toY,travel)+(cross?arc*route.height:0),scale:reducedMotion?1:mix(1,s.wide||1,away),dock:1,reveal:1,focus:1-away,activeChapter:chapter,activePanel:panel,entered:true,background:cross?blendColor(paper[s.chapter],paper[s.chapter+1],travel):paper[chapter]};
}
