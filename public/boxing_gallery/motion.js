// Use elapsed time for the short, interactive camera and glove effects.
// This also keeps them moving when a browser suspends its animation timeline.
export function animateTimed(element,frames,options) {
  const animation=element.animate(frames,{...options,fill:'both'});
  animation.pause();
  const started=performance.now();
  let timer=null,cancelled=false;
  function tick(){
    if(cancelled)return;
    const elapsed=Math.min(performance.now()-started,options.duration);
    animation.currentTime=elapsed;
    if(elapsed<options.duration)timer=setTimeout(tick,16);
    else if(options.fill!=='forwards'&&options.fill!=='both')animation.cancel();
  }
  tick();
  return {cancel(){cancelled=true;clearTimeout(timer);animation.cancel();}};
}
