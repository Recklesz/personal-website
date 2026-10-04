export function createCinema(films) {
  const $=id=>document.getElementById(id);
  const cinema=$('cinema'),video=$('cinema-video'),seek=$('video-seek'),toggle=$('video-toggle');
  let active=null,returnFocus=null,loadTimer=null,hls=null;
  const stamp=value=>{if(!Number.isFinite(value))return'0:00';return `${Math.floor(value/60)}:${String(Math.floor(value%60)).padStart(2,'0')}`;};
  function update(){
    toggle.setAttribute('aria-label',video.paused?'Play video':'Pause video');
    toggle.classList.toggle('is-paused',video.paused);
    if(Number.isFinite(video.duration)){
      seek.disabled=false;seek.max=video.duration;seek.value=video.currentTime;
      seek.style.setProperty('--progress',`${video.currentTime/video.duration*100}%`);
      seek.setAttribute('aria-valuetext',`${stamp(video.currentTime)} of ${stamp(video.duration)}`);
    }
    $('video-time').textContent=Number.isFinite(video.duration)?`${stamp(video.currentTime)} / ${stamp(video.duration)}`:'Loading…';
  }
  function unavailable(){
    cinema.classList.remove('loading');
    $('cinema-status').textContent='This clip is unavailable here.';
    $('cinema-fallback').hidden=false;
  }
  function close(){
    if(cinema.hidden)return;
    clearTimeout(loadTimer);active=null;video.pause();hls?.destroy();hls=null;video.removeAttribute('src');video.load();
    cinema.hidden=true;$('gallery-page').inert=false;document.body.classList.remove('watching');
    if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});
  }
  function play(index){
    close();active=index;const film=films[index];returnFocus=document.querySelector(`[data-film="${index}"]`);
    $('cinema-title').textContent=`${film.name} / ${film.caption}`;
    $('cinema-original').href=film.source;
    $('cinema-fallback').hidden=true;cinema.classList.add('loading');
    video.poster=film.poster;video.muted=true;video.defaultMuted=true;video.volume=0;
    video.setAttribute('aria-label',`${film.name}: ${film.caption}, muted`);
    seek.value=0;seek.disabled=true;seek.style.setProperty('--progress','0%');
    cinema.hidden=false;$('gallery-page').inert=true;document.body.classList.add('watching');
    $('cinema-close').focus({preventScroll:true});
    const begin=()=>{if(active===index)void video.play().catch(()=>{cinema.classList.remove('loading');update();});};
    if(film.hls&&video.canPlayType('application/vnd.apple.mpegurl')){
      video.src=film.hls;begin();
    }else if(film.hls&&window.Hls?.isSupported()){
      hls=new Hls({capLevelToPlayerSize:true,maxBufferLength:20,startLevel:2});
      hls.loadSource(film.hls);hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED,begin);
      hls.on(Hls.Events.ERROR,(_event,data)=>{if(data.fatal&&active===index){hls.destroy();hls=null;video.src=film.src;begin();}});
    }else{video.src=film.src;begin();}
    loadTimer=setTimeout(()=>{if(active===index&&video.readyState<2)unavailable();},16000);
    update();
  }
  function togglePlayback(){if(video.paused)void video.play().catch(unavailable);else video.pause();}
  toggle.addEventListener('click',togglePlayback);video.addEventListener('click',togglePlayback);
  seek.addEventListener('input',()=>{video.currentTime=Number(seek.value);update();});
  video.addEventListener('playing',()=>{clearTimeout(loadTimer);cinema.classList.remove('loading');$('cinema-fallback').hidden=true;update();});
  video.addEventListener('waiting',()=>{if(!cinema.hidden)cinema.classList.add('loading');});
  for(const event of ['timeupdate','durationchange','loadedmetadata','pause','play'])video.addEventListener(event,update);
  video.addEventListener('error',()=>{if(active!==null)unavailable();});
  video.addEventListener('volumechange',()=>{if(!video.muted)video.muted=true;if(video.volume!==0)video.volume=0;});
  $('cinema-close').addEventListener('click',close);
  cinema.addEventListener('click',event=>{if(event.target===cinema)close();});
  cinema.addEventListener('keydown',event=>{
    if(event.key==='Tab'){
      const focusable=[...cinema.querySelectorAll('button,a[href],input')].filter(el=>!el.disabled&&el.getClientRects().length);
      const first=focusable[0],last=focusable.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();});
  return {play,close,togglePlayback,get returnFocus(){return returnFocus;}};
}
