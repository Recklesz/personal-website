import { animateTimed } from './motion.js';
export function createCamera({page,chrome,reducedMotion=false}) {
  let animations=[];
  const clear=()=>{animations.forEach(animation=>animation.cancel());animations=[];};
  function move(side,kind='dodge'){
    const previous=new Map([page,chrome].map(element=>[element,getComputedStyle(element).transform]));
    clear();const direction=side==='left'?-1:1;
    const x=Math.min(innerWidth*.205,245)*direction,y=-Math.min(innerHeight*.16,145);
    const at=(shift,lift,roll,yaw,pitch,scale)=>`perspective(1000px) translate3d(${shift}px,${lift}px,0) rotateZ(${roll}deg) rotateY(${yaw}deg) rotateX(${pitch}deg) scale(${scale})`;
    let frames;
    if(reducedMotion)frames=[{filter:'brightness(1)'},{filter:kind==='dodge'?'brightness(1.12)':'brightness(.85)',offset:.3},{filter:'brightness(1)'}];
    else if(kind==='dodge')frames=[
      {transform:at(0,0,0,0,0,1),filter:'blur(0px)',offset:0},
      {transform:at(x*.8,y*.52,-9*direction,10*direction,-6,1.14),filter:'blur(.8px)',offset:.16},
      {transform:at(x,y,-12*direction,14*direction,-11,1.19),filter:'blur(0px)',offset:.35},
      {transform:at(x*.58,y*.78,-6*direction,8*direction,-5,1.12),filter:'blur(0px)',offset:.58},
      {transform:at(-x*.025,5,.3*direction,0,1,1.007),filter:'blur(0px)',offset:.88},
      {transform:at(0,0,0,0,0,1),filter:'blur(0px)',offset:1}
    ];
    else frames=[{transform:at(19*direction,-14,1.4*direction,0,0,1.05),filter:'blur(2px)'},{transform:at(-14*direction,10,-.8*direction,0,0,1.025),filter:'blur(.5px)',offset:.2},{transform:at(6*direction,-4,.3*direction,0,0,1.01),filter:'blur(0px)',offset:.45},{transform:at(0,0,0,0,0,1),filter:'blur(0px)'}];
    for(const element of [page,chrome]){
      element.style.transformOrigin=`50% ${innerHeight*.52}px`;
      const from=previous.get(element);const liveFrames=from&&from!=='none'&&!reducedMotion?[{...frames[0],transform:from},...frames.slice(1)]:frames;
      animations.push(animateTimed(element,liveFrames,{duration:reducedMotion?300:kind==='dodge'?1160:480,easing:'linear'}));
    }
    if(!reducedMotion&&kind==='dodge')animations.push(animateTimed(document.querySelector('#dodge-vignette'),[{opacity:0},{opacity:.55,offset:.25},{opacity:.15,offset:.7},{opacity:0}],{duration:1160,easing:'ease-out'}));
  }
  return {dodge:side=>move(side),hit:side=>move(side,'hit'),clear};
}
