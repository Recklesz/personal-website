export function createSoundtrack(){
  const track=new Audio('assets/audio/cavalleria-intermezzo.mp3');track.id='soundtrack';track.hidden=true;track.setAttribute('aria-hidden','true');document.body.append(track);
  track.loop=true;track.preload='auto';track.volume=.16;let enabled=true,started=false,duckTimer=null;
  const buttons=[...document.querySelectorAll('[data-music-toggle]')];
  function render(){for(const button of buttons){button.setAttribute('aria-label',enabled?'Mute sound':'Enable sound');button.title=enabled?'Mute sound':'Enable sound';}}
  function start(){if(!enabled||document.hidden||!track.paused)return;const promise=track.play();if(promise)promise.then(()=>{started=true;render();}).catch(()=>{});}
  function unlock(event){if(!started&&!event.target.closest('[data-music-toggle]'))start();}
  function toggle(){enabled=!enabled;if(enabled)start();else track.pause();document.dispatchEvent(new CustomEvent('soundchange',{detail:{muted:!enabled}}));render();}
  document.addEventListener('click',unlock,{capture:true});document.addEventListener('pointerdown',event=>{if(event.pointerType!=='touch')unlock(event);},{capture:true});document.addEventListener('touchend',unlock,{capture:true,passive:true});document.addEventListener('keydown',unlock,{capture:true});
  document.addEventListener('keydown',event=>{if(event.key.toLowerCase()==='m'&&!event.repeat)toggle();});buttons.forEach(button=>button.addEventListener('click',toggle));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)track.pause();else if(started&&enabled)start();});window.addEventListener('pagehide',()=>track.pause());render();
  return {start,duck(){clearTimeout(duckTimer);track.volume=.06;duckTimer=setTimeout(()=>track.volume=.16,550);}};
}
