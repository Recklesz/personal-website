export function createScrollFilms(films){
  const records=[...document.querySelectorAll('[data-film]')].map(scene=>{
    const index=Number(scene.dataset.film);
    return {index,scene,video:scene.querySelector('video'),button:scene.querySelector('.film-control'),screen:scene.querySelector('.film-screen'),film:films[index],loaded:false,hls:null,manifestReady:false,manualPause:false,timer:null};
  });
  let active=null,timer=null;
  const stopLoading=r=>{if(r.manifestReady)r.hls?.stopLoad();};
  function sync(r){const paused=r.video.paused;r.button.classList.toggle('is-paused',paused&&(r.manualPause||r===active));r.button.setAttribute('aria-label',`${paused?'Play':'Pause'} ${r.film.name} video`);}
  function play(r){
    if(document.hidden||r.manualPause)return;r.video.muted=true;r.video.volume=0;r.hls?.startLoad();
    void r.video.play().catch(()=>sync(r));
  }
  function load(r){
    if(r.loaded)return;r.loaded=true;const {video,film}=r;video.preload='metadata';
    const begin=()=>{if(active===r)play(r);};
    if(film.hls&&window.Hls?.isSupported()){
      r.hls=new Hls({autoStartLoad:false,capLevelToPlayerSize:true,maxBufferLength:12,startLevel:2,enableWebVTT:false,enableCEA708Captions:false});
      r.hls.subtitleDisplay=false;r.hls.loadSource(film.hls);r.hls.attachMedia(video);r.hls.on(Hls.Events.MANIFEST_PARSED,()=>{r.manifestReady=true;begin();});
      r.hls.on(Hls.Events.ERROR,(_e,data)=>{if(data.fatal){r.hls.destroy();r.hls=null;if(film.src){video.src=film.src;begin();}}});
    }else{video.src=film.hls&&video.canPlayType('application/vnd.apple.mpegurl')?film.hls:film.src;begin();}
  }
  function update(){
    timer=null;if(document.hidden)return;
    const chapter=Number(document.body.dataset.chapter||0),entered=document.body.dataset.gallery==='entered';
    let selected=null,maxArea=0;
    records.forEach(r=>{
      const rect=r.screen.getBoundingClientRect();
      const area=Math.max(0,Math.min(innerWidth,rect.right)-Math.max(0,rect.left))*Math.max(0,Math.min(innerHeight,rect.bottom)-Math.max(0,rect.top));
      if(entered&&r.index===chapter&&area>innerWidth*innerHeight*.12&&area>maxArea){selected=r;maxArea=area;}
      if(Math.abs(r.index-chapter)<=1)load(r);
    });
    const changed=selected!==active;active=selected;
    records.forEach(r=>{if(r!==active){if(!r.video.paused)r.video.pause();stopLoading(r);}sync(r);});
    if(changed&&active){load(active);play(active);}
  }
  records.forEach(r=>{
    const {video}=r;video.muted=true;video.defaultMuted=true;video.volume=0;
    const hideCaptions=()=>{for(const t of video.textTracks)t.mode='disabled';};video.textTracks.addEventListener('addtrack',hideCaptions);
    video.addEventListener('loadedmetadata',()=>{hideCaptions();const start=r.film.start??0;if(video.duration>start&&video.currentTime<1)video.currentTime=start;});
    const toggle=()=>{if(r.scene.inert||document.body.dataset.gallery!=='entered')return;if(video.paused){r.manualPause=false;active=r;records.forEach(other=>{if(other!==r){other.video.pause();stopLoading(other);sync(other);}});load(r);play(r);}else{r.manualPause=true;video.pause();}sync(r);};
    r.button.addEventListener('click',toggle);video.addEventListener('click',toggle);
    video.addEventListener('play',()=>sync(r));video.addEventListener('pause',()=>sync(r));
    video.addEventListener('volumechange',()=>{if(!video.muted)video.muted=true;if(video.volume!==0)video.volume=0;});
  });
  const schedule=()=>{if(timer===null)timer=setTimeout(update,45);};
  document.addEventListener('journeychange',schedule);window.addEventListener('resize',schedule);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)records.forEach(r=>{r.video.pause();stopLoading(r);});else{if(active)play(active);update();}});
  window.addEventListener('pagehide',event=>records.forEach(r=>{r.video.pause();if(event.persisted)stopLoading(r);else{r.hls?.destroy();r.hls=null;}}));
  window.addEventListener('pageshow',event=>{if(event.persisted){update();if(active)play(active);}});update();
}
