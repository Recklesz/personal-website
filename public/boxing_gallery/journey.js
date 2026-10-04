import {buildRoute,locateRoute} from './gallery-route.js';
export {buildRoute,locateRoute} from './gallery-route.js';
const clamp=(n,min=0,max=1)=>Math.max(min,Math.min(max,n));
export function createJourney(chapters,{onProgress=()=>{},onState=()=>{}}={}){
  const nodes=[...document.querySelectorAll('.chapter')],lens=document.querySelector('#lens'),world=document.querySelector('#world'),page=document.querySelector('#gallery-page'),mark=document.querySelector('#gallery-wordmark');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let route,current=scrollY,target=current,frame=0,lastTime=0,lastChapter=-1,markWidth=0,markHeight=0;
  function paint(time=performance.now()){
    frame=0;const dt=Math.min(48,time-(lastTime||time-16));lastTime=time;
    current=reduced?target:current+(target-current)*(1-Math.exp(-dt/78));
    if(Math.abs(target-current)<.15)current=target;
    const p=locateRoute(route,current,{reducedMotion:reduced}),scale=p.scale;
    // Lens is unclipped. The outer viewport crops the transformed gallery, so a pullback reveals neighbours.
    lens.style.transform=`scale(${scale})`;world.style.opacity=p.reveal;
    page.style.background=p.background;
    const halfW=innerWidth/(2*scale),halfH=innerHeight/(2*scale),cx=p.cameraX+innerWidth/2,cy=p.cameraY+innerHeight/2;
    nodes.forEach((node,i)=>{
      const o=route.origins[i],height=o.height;
      const visible=o.x+innerWidth>cx-halfW-100&&o.x<cx+halfW+100&&o.y+height>cy-halfH-100&&o.y<cy+halfH+100;
      node.style.visibility=visible?'visible':'hidden';node.inert=i!==p.activeChapter||p.reveal<.9;
      [...node.children].forEach((panel,j)=>panel.inert=!(i===p.activeChapter&&j===p.activePanel&&p.focus>.72&&p.entered));
      if(visible)node.style.transform=`translate3d(${o.x-p.cameraX}px,${o.y-p.cameraY}px,0)`;
    });
    if(mark){
      const small=innerWidth<761?145:178,ratio=small/markWidth,dock=p.dock;
      const fromX=(innerWidth-markWidth)/2,fromY=(innerHeight-markHeight)/2;
      const toX=innerWidth*(innerWidth<761?.055:.04)-small*.085,toY=(innerWidth<761?19:22)-markHeight*ratio*.18;
      mark.style.transform=`translate3d(${fromX+(toX-fromX)*dock}px,${fromY+(toY-fromY)*dock}px,0) scale(${1+(ratio-1)*dock})`;
      mark.classList.toggle('is-docked',dock>.98);
    }
    document.body.dataset.chapter=String(p.activeChapter);document.body.dataset.panel=String(p.activePanel);
    document.body.dataset.travel=p.type==='intro'?'intro':p.type==='vertical'?'down':p.type==='hold'?'still':'across';
    document.body.dataset.gallery=p.entered?'entered':'opening';document.body.dataset.focus=String(p.focus);
    world.dataset.cameraX=p.cameraX.toFixed(2);world.dataset.cameraY=p.cameraY.toFixed(2);world.dataset.scale=scale.toFixed(4);
    if(lastChapter!==p.activeChapter){lastChapter=p.activeChapter;nodes.slice(Math.max(0,lastChapter-1),lastChapter+2).forEach(node=>node.querySelectorAll('img').forEach(img=>img.loading='eager'));}
    document.querySelector('meta[name="theme-color"]').content=p.background;
    const progress=clamp((current-route.introLength)/(route.length-route.introLength));
    document.dispatchEvent(new CustomEvent('journeychange',{detail:{chapter:p.activeChapter,panel:p.activePanel,scale,focus:p.focus,entered:p.entered,progress}}));
    onProgress(progress);onState(p);
    if(current!==target)frame=requestAnimationFrame(paint);
  }
  function update(){target=clamp(scrollY,0,route.length);if(!frame)frame=requestAnimationFrame(paint);}
  function measure(){
    const oldLength=route?.length,ratio=oldLength?scrollY/oldLength:0;
    route=buildRoute(chapters,innerWidth,innerHeight);
    nodes.forEach((node,i)=>{
      const origin=route.origins[i];node.style.height=`${origin.height}px`;
      [...node.children].forEach((panel,j)=>{
        panel.style.top=`${origin.sceneY[j]}px`;
        const frame=chapters[i].scenes[j].frame;if(!frame)return;
        let [left,top,width,height]=frame;
        if(innerWidth<761){left=clamp(left*.35,3,12);width=Math.min(97-left,clamp(width+26,78,94));top=Math.max(14,top);height=Math.min(74,height);}
        panel.dataset.hung='';
        for(const [name,value] of Object.entries({left,top,width,height}))panel.style.setProperty(`--art-${name}`,`${value}%`);
      });
    });
    document.documentElement.style.setProperty('--vh',`${innerHeight}px`);
    document.body.style.height=`${innerHeight+route.length}px`;
    markWidth=mark?.offsetWidth||1;markHeight=mark?.offsetHeight||1;
    if(oldLength){current=ratio*route.length;window.scrollTo({top:current,behavior:'instant'});}
    update();
  }
  window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',measure);
  document.querySelector('.brand').addEventListener('click',event=>{event.preventDefault();window.scrollTo({top:current<route.introLength*.1?route.introLength:0,behavior:reduced?'instant':'smooth'});});
  window.addEventListener('wheel',event=>{if(Math.abs(event.deltaX)>Math.abs(event.deltaY)){event.preventDefault();window.scrollBy({top:event.deltaX,behavior:'instant'});}},{passive:false});
  document.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight'].includes(event.key)||event.target.closest('button'))return;
    event.preventDefault();const index=clamp(lastChapter+(event.key==='ArrowRight'?1:-1),0,chapters.length-1);
    window.scrollTo({top:route.origins[index].start,behavior:reduced?'instant':'smooth'});
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else{lastTime=0;update();}});
  measure();return {get route(){return route;}};
}
