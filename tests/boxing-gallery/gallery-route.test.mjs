import test from 'node:test';
import assert from 'node:assert/strict';
import {buildRoute,locateRoute} from '../../public/boxing_gallery/gallery-route.js';
import {chapters} from '../../public/boxing_gallery/chapters.js';
for(const [width,height] of [[1440,900],[390,844]]){
 test(`camera joins stay continuous at ${width}×${height}`,()=>{
  const r=buildRoute(chapters,width,height);
  for(const s of r.segments.slice(0,-1)){
   const left=locateRoute(r,s.end-1e-6),right=locateRoute(r,s.end+1e-6);
   for(const property of ['cameraX','cameraY','scale','dock','reveal'])assert.ok(Math.abs(left[property]-right[property])<.001,`${s.type} ${property} jumps`);
   assert.equal(left.activeChapter,right.activeChapter);assert.equal(left.activePanel,right.activePanel);
  }
 });
 test(`fighter changes pull back to reveal both ends of the move at ${width}×${height}`,()=>{
  const r=buildRoute(chapters,width,height);
  for(const s of r.segments.filter(s=>!['intro','hold','vertical'].includes(s.type))){
   const center=locateRoute(r,(s.start+s.end)/2);
   assert.ok(center.scale<.51);assert.equal(locateRoute(r,s.start).scale,1);assert.equal(locateRoute(r,s.end-1e-6).scale,1);
   for(const [x,y] of [[s.x+width/2,s.y+height/2],[s.toX+width/2,s.toY+height/2]]){
    const screenX=width/2+(x-center.cameraX-width/2)*center.scale;
    const screenY=height/2+(y-center.cameraY-height/2)*center.scale;
    assert.ok(screenX>0&&screenX<width,'art center is within horizontal viewport');
    assert.ok(screenY>0&&screenY<height,'art center is within vertical viewport');
   }
  }
 });
 test(`scrolling within each fighter stays straight, at fixed scale and one-to-one speed at ${width}×${height}`,()=>{
  const r=buildRoute(chapters,width,height);
  for(const s of r.segments.filter(s=>s.type==='vertical')){
   for(const t of [0,.1,.25,.5,.75,.9,.999]){
    const p=locateRoute(r,s.start+(s.end-s.start)*t);
    assert.equal(p.scale,1);assert.equal(p.focus,1);assert.equal(p.cameraX,s.x);
    assert.ok(Math.abs(p.cameraY-(s.y+(s.end-s.start)*t))<.000001);
   }
  }
 });
 test(`hanging has staggered starts and deliberately uneven gaps at ${width}×${height}`,()=>{
  const r=buildRoute(chapters,width,height);
  assert.equal(new Set(r.origins.map(o=>o.y)).size,chapters.length);
  for(const [i,o] of r.origins.entries()){
   assert.equal(o.sceneY.length,chapters[i].scenes.length);
   assert.equal(o.height,o.sceneY.at(-1)+height);
   const gaps=o.sceneY.slice(1).map((y,j)=>y-o.sceneY[j]);
   assert.ok(Math.max(...gaps)/Math.min(...gaps)>1.5);
   assert.ok(Math.min(...gaps)>height*.5);
  }
 });
 test(`opening reveals the overview before settling into the first film at ${width}×${height}`,()=>{
  const r=buildRoute(chapters,width,height),at=t=>locateRoute(r,r.introLength*t);
  assert.equal(at(0).reveal,0);assert.equal(at(0).dock,0);
  assert.ok(at(.28).scale<at(.1).scale);assert.ok(at(.38).scale<.25);assert.equal(at(.42).dock,1);
  assert.equal(at(.94).scale,1);assert.equal(at(.94).entered,true);assert.equal(at(.94).cameraY,0);
 });
 test(`reduced motion removes camera zoom at ${width}×${height}`,()=>{
  const r=buildRoute(chapters,width,height);
  for(let p=0;p<=r.length;p+=r.length/100)assert.equal(locateRoute(r,p,{reducedMotion:true}).scale,1);
 });
}
