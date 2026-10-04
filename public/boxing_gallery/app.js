import { SurpriseEngine } from './boxing-engine.mjs';
import { createGlass } from './glass.js';
import { films } from './films.js';
import { chapters } from './chapters.js';
import { createJourney } from './journey.js';
import { createScrollFilms } from './scroll-player.js';
import { createCamera } from './camera.js';
import { createSoundtrack } from './music.js';
import { createBoxingAudio } from './boxing-audio.js';
import { animateTimed } from './motion.js';
import { createGalleryTitle } from './gallery-title.js';
const $=id=>document.getElementById(id),reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const filmMarkup=index=>{const film=films[index];return `<div class="film-screen ${film.portrait?'portrait-film':''}"><video id="film-${index}" muted loop playsinline preload="none" disablepictureinpicture aria-label="${film.name} fight footage" poster="${film.poster}"></video><button class="film-control" aria-label="Pause ${film.name} video"><svg class="pause-symbol" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg><svg class="play-symbol" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m7 4 14 8-14 8z"/></svg></button></div>`;};
$('world').innerHTML=chapters.map((chapter,i)=>`<section class="chapter fight-chapter chapter-${chapter.key}" aria-label="${chapter.name}" data-chapter="${i}">${chapter.scenes.map((scene,j)=>`<div class="panel layout-${scene.layout}" ${scene.film!==undefined?`data-film="${scene.film}"`:''} data-scene="${j}" style="--scene-tone:${scene.bg}">${scene.film!==undefined?filmMarkup(scene.film):scene.images.map((image,k)=>`<figure class="photo-frame photo-${k}${scene.nativeSize?' native-size':''}"><img src="${image}" alt="${chapter.name} in a professional bout" decoding="async" loading="${i<2?'eager':'lazy'}"></figure>`).join('')}${j===0?`<h2 class="fighter-name name-${chapter.nameStyle}">${chapter.name==='Moses Itauma'?'Moses<br>Itauma':chapter.name}</h2>`:''}</div>`).join('')}</section>`).join('');
const music=createSoundtrack(),boxingAudio=createBoxingAudio();
const galleryTitle=createGalleryTitle($('title-shader'),{reducedMotion});
const glass=createGlass($('fractures'),reducedMotion),camera=createCamera({page:$('gallery-page'),chrome:$('site-chrome'),reducedMotion});
const gloves=[...document.querySelectorAll('.glove')],flights=new Map();
let explained=false,defenseFocus=null,lastImpact=0,activeGlove=null,attackTarget=null,light=null;
function cleanup(){
  camera.clear();flights.forEach(animation=>animation.cancel());flights.clear();light?.cancel();
  gloves.forEach(glove=>glove.style.opacity='0');$('punch-stage').classList.remove('active');$('defense-surface').hidden=true;$('feedback').hidden=true;glass.clear();$('live-action').textContent='';document.body.dataset.phase='waiting';
  if(defenseFocus?.isConnected&&defenseFocus!==$('defense-surface'))defenseFocus.focus({preventScroll:true});defenseFocus=null;
}
function pose(x,y,scale,rotation,side){return `translate(${x}px,${y}px) translate(-50%,-50%) rotate(${rotation}deg) scale(${side==='right'?-scale:scale},${scale})`;}
function onEvent(event,state){
  document.body.dataset.level=String(state.level);document.body.dataset.combo=`${state.punchInCombo}/${state.comboLength}`;
  if(event==='clear'){cleanup();return;}
  if(event==='attack'){
    document.body.dataset.phase='incoming';$('punch-stage').classList.add('active');$('defense-surface').hidden=false;
    if(document.activeElement!==$('defense-surface'))defenseFocus=document.activeElement;
    $('defense-surface').focus({preventScroll:true});$('live-action').textContent=state.comboLength>1?'Another punch. Tap, click, or press Space.':'Incoming punch. Tap, click, or press Space to dodge.';
    const side=state.side,sign=side==='left'?1:-1,startX=side==='left'?-80:innerWidth+80;
    attackTarget={x:innerWidth*(.4+Math.random()*.2),y:innerHeight*(state.punchInCombo%2?.43:.53),side};
    const glove=gloves[state.attackId%gloves.length];activeGlove=glove;flights.get(glove)?.cancel();glove.style.opacity='1';
    const frames=reducedMotion?[{transform:pose(attackTarget.x,attackTarget.y,.55,0,side),opacity:0},{transform:pose(attackTarget.x,attackTarget.y,.8,0,side),opacity:1}]:[
      {transform:pose(startX,innerHeight*.6,.28,-42*sign,side),opacity:.45,offset:0},
      {transform:pose(startX+sign*innerWidth*.22,innerHeight*.4,.48,-26*sign,side),opacity:1,offset:.3},
      {transform:pose(attackTarget.x-sign*innerWidth*.13,attackTarget.y,.82,-9*sign,side),opacity:1,offset:.83},
      {transform:pose(attackTarget.x,attackTarget.y,1.75,7*sign,side),opacity:1,offset:1}
    ];
    flights.set(glove,animateTimed(glove,frames,{duration:state.duration,easing:'cubic-bezier(.18,.55,.72,.1)',fill:'forwards'}));boxingAudio.whoosh(side);
  }else if(event==='hit'||event==='blocked'){
    lastImpact=performance.now();const dodged=event==='blocked',glove=activeGlove,current=getComputedStyle(glove).transform;
    document.body.dataset.phase=event;flights.get(glove)?.cancel();
    const exitFrames=reducedMotion?[{transform:current,opacity:1},{transform:current,opacity:0}]:[{transform:current,opacity:1},{transform:pose(dodged?(state.side==='left'?innerWidth*1.4:-innerWidth*.4):attackTarget.x,dodged?attackTarget.y-innerHeight*.18:attackTarget.y+100,dodged?1.4:.4,dodged?(state.side==='left'?48:-48):0,state.side),opacity:0}];
    flights.set(glove,animateTimed(glove,exitFrames,{duration:reducedMotion?180:dodged?700:360,easing:'ease-out',fill:'forwards'}));
    if(dodged){camera.dodge(state.side);boxingAudio.whoosh(state.side,true);$('live-action').textContent='Dodged.';}
    else{camera.hit(state.side);glass.draw(state.side);boxingAudio.impact(state.side,state.attackId);music.duck();if(!reducedMotion)light=animateTimed($('impact-light'),[{opacity:.3},{opacity:0}],{duration:190,easing:'ease-out'});if(!explained){$('feedback').hidden=false;explained=true;} $('live-action').textContent='Hit. Defend yourself next time.';}
  }
}
const game=new SurpriseEngine({onChange:onEvent});
let galleryEntered=false,gameStarted=false;
const syncGame=()=>{if(gameStarted)game.setPaused(document.hidden||!galleryEntered);};
createJourney(chapters,{onProgress:progress=>game.setProgress(progress),onState:state=>{
  galleryTitle.setActivity(1-state.dock);galleryEntered=state.entered;
  if(galleryEntered&&!gameStarted){gameStarted=true;game.start();}syncGame();
}});createScrollFilms(films);
let touchStart=null;
$('defense-surface').addEventListener('pointerdown',event=>{if(event.pointerType==='touch'){touchStart={x:event.clientX,y:event.clientY};return;}event.preventDefault();event.stopPropagation();void boxingAudio.unlock();game.defend();});
$('defense-surface').addEventListener('pointerup',event=>{if(event.pointerType==='touch'&&touchStart){const distance=Math.hypot(event.clientX-touchStart.x,event.clientY-touchStart.y);touchStart=null;if(distance<16){event.preventDefault();event.stopPropagation();void boxingAudio.unlock();game.defend();}}});
$('defense-surface').addEventListener('pointercancel',()=>touchStart=null);
$('defense-surface').addEventListener('click',event=>{event.preventDefault();event.stopPropagation();if(event.detail===0)game.defend();});
document.addEventListener('keydown',event=>{if([' ','Enter'].includes(event.key)&&game.phase==='incoming'){event.preventDefault();if(!event.repeat){void boxingAudio.unlock();game.defend();}}else if(event.key===' '&&performance.now()-lastImpact<1500)event.preventDefault();});
document.addEventListener('visibilitychange',syncGame);window.addEventListener('pagehide',()=>{if(gameStarted)game.setPaused(true);});window.addEventListener('pageshow',syncGame);
gloves.forEach(glove=>glove.decode().catch(()=>{}));
