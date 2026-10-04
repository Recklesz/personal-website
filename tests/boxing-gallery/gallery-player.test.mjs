import test from 'node:test';
import assert from 'node:assert/strict';
import {createScrollFilms} from '../../public/boxing_gallery/scroll-player.js';

const fullFrame={left:120,right:1080,top:120,bottom:680};
const smallFrame={left:450,right:750,top:300,bottom:470};
const offscreen={left:450,right:750,top:1100,bottom:1270};

function emitter(){
  const listeners=new Map();
  return {
    addEventListener(name,callback){const list=listeners.get(name)||[];list.push(callback);listeners.set(name,list);},
    dispatch(name,event={}){for(const callback of listeners.get(name)||[])callback(event);}
  };
}

function setup(t,{entered=true,hls=false,count=1,rect=fullFrame}={}){
  const keys=['document','window','innerWidth','innerHeight','Hls','setTimeout'];
  const original=new Map(keys.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  t.after(()=>{for(const [key,descriptor] of original){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}});
  const queued=[],instances=[];
  const records=Array.from({length:count},(_,index)=>{
    const video=Object.assign(emitter(),{
      paused:true,muted:true,volume:0,playCalls:0,pauseCalls:0,
      textTracks:Object.assign([],emitter()),
      play(){this.playCalls++;this.paused=false;this.dispatch('play');return Promise.resolve();},
      pause(){this.pauseCalls++;const changed=!this.paused;this.paused=true;if(changed)this.dispatch('pause');},
      canPlayType(){return '';}
    });
    const classes=new Set(),attributes=new Map();
    const button=Object.assign(emitter(),{
      classList:{toggle(name,on){if(on)classes.add(name);else classes.delete(name);}},
      setAttribute(name,value){attributes.set(name,value);}
    });
    const record={video,button,classes,attributes,rect:{...rect}};
    record.scene={dataset:{film:String(index)},inert:false,querySelector(selector){return selector==='video'?video:selector==='.film-control'?button:{getBoundingClientRect:()=>record.rect};}};
    return record;
  });
  class MockHls {
    static Events={MANIFEST_PARSED:'manifestParsed',ERROR:'error'};
    static isSupported(){return true;}
    constructor(config){this.config=config;this.listeners=new Map();this.startCalls=0;this.stopCalls=0;this.destroyCalls=0;this.manifestPending=false;this.manifestReady=false;instances.push(this);}
    on(name,callback){this.listeners.set(name,callback);}
    loadSource(src){this.src=src;this.manifestPending=true;}
    attachMedia(video){this.video=video;}
    startLoad(){this.startCalls++;}
    // In hls.js, PlaylistLoader.stopLoad aborts pending manifests, and
    // PlaylistLoader.startLoad does not restart them.
    stopLoad(){this.stopCalls++;if(!this.manifestReady)this.manifestPending=false;}
    finishManifest(){assert.ok(this.manifestPending,'HLS manifest was aborted before it could parse');this.manifestPending=false;this.manifestReady=true;this.listeners.get(MockHls.Events.MANIFEST_PARSED)?.();}
    destroy(){this.destroyCalls++;this.manifestPending=false;}
  }
  globalThis.innerWidth=1200;globalThis.innerHeight=800;
  globalThis.document=Object.assign(emitter(),{hidden:false,body:{dataset:{chapter:'0',gallery:entered?'entered':'opening'}},querySelectorAll:()=>records.map(record=>record.scene)});
  globalThis.window=Object.assign(emitter(),hls?{Hls:MockHls}:{});
  globalThis.Hls=MockHls;
  globalThis.setTimeout=callback=>{queued.push(callback);return queued.length;};
  createScrollFilms(records.map((_,index)=>({name:`Film ${index}`,src:`film-${index}.mp4`,...(hls?{hls:`film-${index}.m3u8`}:{})})));
  return {
    records,instances,document:globalThis.document,window:globalThis.window,
    update(){document.dispatch('journeychange');while(queued.length)queued.shift()();}
  };
}

test('opening blocks automatic and manual playback until the gallery is entered',t=>{
  const s=setup(t,{entered:false}),r=s.records[0];
  assert.equal(r.video.playCalls,0);
  r.button.dispatch('click');
  assert.equal(r.video.playCalls,0);
  s.document.body.dataset.gallery='entered';s.update();
  assert.equal(r.video.paused,false);
});

test('a manually started small film pauses when it leaves the viewport',t=>{
  const s=setup(t,{rect:smallFrame}),r=s.records[0];
  assert.equal(r.video.paused,true);
  r.button.dispatch('click');assert.equal(r.video.paused,false);
  r.rect=offscreen;s.update();
  assert.equal(r.video.paused,true);
  assert.equal(r.classes.has('is-paused'),false,'automatic pauses should not expose overview play buttons');
});

test('inert film panels ignore manual playback',t=>{
  const s=setup(t,{rect:smallFrame}),r=s.records[0];
  r.scene.inert=true;r.button.dispatch('click');
  assert.equal(r.video.playCalls,0);
});

test('manual play resumes the selected film when several films are registered',t=>{
  const s=setup(t,{count:2}),r=s.records[0];
  r.button.dispatch('click');assert.equal(r.video.paused,true);
  r.button.dispatch('click');assert.equal(r.video.paused,false);
  assert.equal(s.records[1].video.paused,true);
});

test('a manual pause survives leaving, reentering, and page restoration',t=>{
  const s=setup(t),r=s.records[0];
  assert.equal(r.video.paused,false);
  r.button.dispatch('click');const plays=r.video.playCalls;
  assert.equal(r.classes.has('is-paused'),true);
  r.rect=offscreen;s.update();r.rect=fullFrame;s.update();
  s.window.dispatch('pagehide',{persisted:true});s.window.dispatch('pageshow',{persisted:true});
  assert.equal(r.video.paused,true);assert.equal(r.video.playCalls,plays);
});

test('BFCache preserves HLS and resumes the selected film',t=>{
  const s=setup(t,{hls:true}),r=s.records[0],instance=s.instances[0];
  instance.finishManifest();const plays=r.video.playCalls;
  s.window.dispatch('pagehide',{persisted:true});
  assert.equal(r.video.paused,true);assert.equal(instance.destroyCalls,0);
  s.window.dispatch('pageshow',{persisted:true});
  assert.equal(r.video.paused,false);assert.ok(r.video.playCalls>plays);
  assert.equal(s.instances.length,1);assert.equal(instance.destroyCalls,0);
  s.window.dispatch('pagehide',{persisted:false});assert.equal(instance.destroyCalls,1);
});

test('preloaded HLS manifests finish before inactive loading is stopped',t=>{
  const s=setup(t,{entered:false,hls:true,count:2});
  assert.equal(s.instances.length,2);
  for(const instance of s.instances)instance.finishManifest();
  assert.ok(s.records.every(r=>r.video.paused));
  s.document.body.dataset.gallery='entered';s.update();
  assert.equal(s.records[0].video.paused,false);
  assert.equal(s.records[1].video.paused,true);
});
