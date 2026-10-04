import test from 'node:test';
import assert from 'node:assert/strict';
import {SurpriseEngine} from '../../public/boxing_gallery/boxing-engine.mjs';
import {buildRoute,locateRoute} from '../../public/boxing_gallery/journey.js';
function setup(){
  let timer=null,now=0;const events=[];
  const game=new SurpriseEngine({random:()=>0,onChange:(type,state)=>events.push({type,...state}),setTimer:(fn,ms)=>(timer={fn,ms}),clearTimer:()=>timer=null});
  return {game,events,next(){assert.ok(timer);const t=timer;timer=null;now+=t.ms;t.fn();return now;},get pending(){return !!timer;}};
}
test('left/right teaching punches precede a combination requiring distinct defences',()=>{
  const s=setup();s.game.start();s.next();assert.equal(s.game.side,'left');assert.equal(s.game.comboLength,1);s.game.defend();
  s.next();s.next();assert.equal(s.game.side,'right');assert.equal(s.game.comboLength,1);s.game.defend();
  s.next();s.next();assert.equal(s.game.comboLength,2);const firstSide=s.game.side;
  assert.equal(s.game.defend(),true);assert.equal(s.game.defend(),false);s.next();assert.notEqual(s.game.side,firstSide);assert.equal(s.game.phase,'incoming');assert.equal(s.game.defend(),true);
  assert.equal(s.game.blocks,4);s.next();assert.equal(s.game.phase,'waiting');
});
test('difficulty rises and never drops when scrolling back; advanced combinations speed up',()=>{
  const s=setup();s.game.start();s.next();const initial=s.events.at(-1).duration;s.game.defend();s.next();s.next();s.game.defend();s.next();
  s.game.setProgress(1);s.game.setProgress(.1);assert.equal(s.game.level,5);s.next();const advanced=s.events.at(-1).duration;assert.ok(advanced<initial);assert.ok(advanced>=620);
  s.game.defend();s.next();assert.ok(s.events.at(-1).duration<=advanced);
});
test('hiding the page cancels a combination and leaves no delayed punch',()=>{
  const s=setup();s.game.round=2;s.game.beginRound();assert.equal(s.game.comboLength,2);s.game.defend();s.game.setPaused(true);assert.equal(s.pending,false);assert.equal(s.game.defend(),false);assert.equal(s.game.phase,'waiting');
});
test('route descends through a fighter then pulls back and reframes to the next column',()=>{
  const chapters=[{scenes:[1,2,3,4],transition:'pullback'},{scenes:[1,2,3],transition:'glide'}];
  const route=buildRoute(chapters,1200,800),cross=route.segments.find(s=>s.type==='pullback');
  const before=locateRoute(route,cross.start),middle=locateRoute(route,(cross.start+cross.end)/2),after=locateRoute(route,cross.end+1);
  assert.equal(before.cameraX,0);assert.equal(before.cameraY,route.origins[0].sceneY.at(-1));
  assert.ok(middle.cameraX>0&&middle.cameraX<route.origins[1].x);assert.ok(middle.cameraY>0&&middle.cameraY<before.cameraY);
  assert.ok(middle.scale<.4,'adjacent columns should share the viewport');
  assert.equal(after.cameraX,route.origins[1].x);assert.ok(Math.abs(after.cameraY-(route.origins[1].y+1))<.00001);
  assert.equal(locateRoute(route,route.length).cameraY,route.origins[1].y+route.origins[1].sceneY.at(-1));
});
