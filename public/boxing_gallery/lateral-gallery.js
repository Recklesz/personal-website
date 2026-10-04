// Native vertical scrolling drives a fixed horizontal film strip.
export function createLateralGallery() {
  const rail=document.getElementById('gallery');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current=scrollY,target=current,limit=0,timer=null;
  function paint(){
    current=reduced?target:current+(target-current)*.24;
    if(Math.abs(target-current)<.3)current=target;
    rail.style.transform=`translate3d(${-current}px,0,0)`;
    document.dispatchEvent(new Event('gallerymove'));
    timer=current===target?null:setTimeout(paint,16);
  }
  function update(){target=Math.max(0,Math.min(limit,scrollY));if(timer===null)paint();}
  function measure(){
    rail.style.paddingRight=`${Math.max(0,(innerWidth-rail.lastElementChild.offsetWidth)/2)}px`;
    limit=Math.max(0,rail.scrollWidth-innerWidth);
    document.body.style.height=`${innerHeight+limit}px`;
    update();
  }
  window.addEventListener('scroll',update,{passive:true});
  window.addEventListener('resize',measure);
  document.querySelector('.brand').addEventListener('click',event=>{
    event.preventDefault();window.scrollTo({top:0,behavior:reduced?'instant':'smooth'});
  });
  window.addEventListener('wheel',event=>{
    if(Math.abs(event.deltaX)>Math.abs(event.deltaY)){
      event.preventDefault();window.scrollBy({top:event.deltaX,behavior:'instant'});
    }
  },{passive:false});
  document.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight'].includes(event.key)||event.target.closest('button,summary,a,input'))return;
    event.preventDefault();
    const scenes=[...rail.children];
    const active=Number(document.body.dataset.currentFilm||0);
    const next=scenes[Math.max(0,Math.min(scenes.length-1,active+(event.key==='ArrowRight'?1:-1)))];
    window.scrollTo({top:next.offsetLeft-scenes[0].offsetLeft,behavior:reduced?'instant':'smooth'});
  });
  document.fonts.ready.then(measure);measure();
}
