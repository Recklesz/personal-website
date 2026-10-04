export function createBoxingAudio(){
  let context=null,master=null,ready=false,bellPlayed=false,muted=false;
  const buffers=new Map(),files=['boxing-punch-heavy-000','boxing-punch-heavy-001','boxing-punch-medium-000','boxing-punch-medium-001','boxing-ring-bell'];
  const bytes=Promise.all(files.map(async name=>[name,await fetch(`assets/audio/${name}.mp3`).then(r=>r.arrayBuffer())]));
  async function unlock(){
    if(!context){const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)return;context=new AudioContext();master=context.createGain();master.gain.value=muted?0:.72;master.connect(context.destination);}
    if(context.state==='suspended')void context.resume();
    if(ready)return;ready=true;
    try{for(const [name,data] of await bytes)buffers.set(name,await context.decodeAudioData(data));if(!bellPlayed){sample('boxing-ring-bell',0,.24,1,2.1);bellPlayed=true;}}catch{}
  }
  function sample(name,pan=0,volume=1,rate=1,duration){
    if(!context||!buffers.has(name)||muted)return;
    const source=context.createBufferSource(),gain=context.createGain(),panner=context.createStereoPanner();
    source.buffer=buffers.get(name);source.playbackRate.value=rate;gain.gain.value=volume;panner.pan.value=pan;
    source.connect(gain);gain.connect(panner);panner.connect(master);source.start();if(duration)source.stop(context.currentTime+duration);
  }
  function whoosh(side,close=false){
    if(!context||muted)return;
    const length=close?.24:.18,buffer=context.createBuffer(1,context.sampleRate*length,context.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++){const t=i/data.length;data[i]=(Math.random()*2-1)*Math.sin(Math.PI*t)**2;}
    const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain(),pan=context.createStereoPanner();
    const now=context.currentTime,sign=side==='left'?-1:1;source.buffer=buffer;filter.type='bandpass';filter.Q.value=.6;filter.frequency.setValueAtTime(close?900:550,now);filter.frequency.exponentialRampToValueAtTime(close?3300:1900,now+length*.7);gain.gain.value=close?.24:.12;pan.pan.setValueAtTime(sign*.95,now);pan.pan.linearRampToValueAtTime(-sign*.55,now+length);source.connect(filter);filter.connect(gain);gain.connect(pan);pan.connect(master);source.start();
  }
  function impact(side,index=0){
    sample(files[index%4],side==='left'?-.22:.22,.95,.94+Math.random()*.12);
    if(!context||muted)return;const now=context.currentTime,osc=context.createOscillator(),gain=context.createGain();
    osc.frequency.setValueAtTime(92,now);osc.frequency.exponentialRampToValueAtTime(42,now+.11);gain.gain.setValueAtTime(.16,now);gain.gain.exponentialRampToValueAtTime(.001,now+.13);osc.connect(gain);gain.connect(master);osc.start();osc.stop(now+.14);
  }
  const activate=()=>void unlock();document.addEventListener('pointerdown',activate,{capture:true});document.addEventListener('touchend',activate,{capture:true,passive:true});document.addEventListener('keydown',activate,{capture:true});
  document.addEventListener('soundchange',event=>{muted=event.detail.muted;if(master)master.gain.setTargetAtTime(muted?0:.72,context.currentTime,.04);});
  return {unlock,whoosh,impact};
}
