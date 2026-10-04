export class SurpriseEngine {
  constructor({onChange=()=>{},random=Math.random,setTimer=(fn,ms)=>setTimeout(fn,ms),clearTimer=id=>clearTimeout(id)}={}){
    Object.assign(this,{onChange,random,setTimer,clearTimer});this.phase='idle';this.round=0;this.total=0;this.blocks=0;this.level=0;this.progress=0;this.paused=false;this.timer=null;this.side='left';this.comboLength=1;this.punchInCombo=0;this.attackId=0;
  }
  state(){return {phase:this.phase,round:this.round,total:this.total,blocks:this.blocks,level:this.level,paused:this.paused,side:this.side,comboLength:this.comboLength,punchInCombo:this.punchInCombo,attackId:this.attackId};}
  emit(event,extra={}){this.onChange(event,{...this.state(),...extra});}
  schedule(fn,ms){this.clearTimer(this.timer);this.timer=this.setTimer(fn,ms);}
  setProgress(value){this.progress=Math.max(this.progress,Math.min(1,Math.max(0,value)));this.level=Math.max(this.level,Math.min(5,Math.floor(this.progress*5)));}
  start(){if(this.phase!=='idle')return;this.phase='waiting';this.schedule(()=>this.beginRound(),8200);}
  beginRound(){
    if(this.paused)return;this.round++;this.level=Math.max(this.level,Math.min(5,Math.floor((this.round-1)/2)));
    this.punchInCombo=0;
    this.comboLength=this.round<=2?1:this.round===3?2:this.random()<Math.min(.82,.32+this.level*.1)?(this.level>=3&&this.random()<.55?3:2):1;
    this.attack();
  }
  attack(){
    if(this.paused)return;this.punchInCombo++;this.attackId++;
    this.side=this.round===1?'left':this.round===2?'right':this.punchInCombo>1?(this.side==='left'?'right':'left'):(this.random()<.5?'left':'right');
    this.phase='incoming';
    const duration=this.round===1?2300:this.round===2?1950:Math.max(620,1420-this.level*145-(this.punchInCombo-1)*65);
    this.emit('attack',{duration});this.schedule(()=>this.resolve(false),duration);
  }
  defend(){if(this.phase!=='incoming'||this.paused)return false;this.resolve(true);return true;}
  resolve(blocked){
    if(this.phase!=='incoming')return;this.clearTimer(this.timer);this.total++;if(blocked)this.blocks++;
    this.phase=blocked?'blocked':'hit';this.emit(this.phase);
    if(this.punchInCombo<this.comboLength){
      this.schedule(()=>this.attack(),Math.max(300,570-this.level*45));
    }else{
      this.schedule(()=>{this.phase='waiting';this.emit('clear');const wait=this.round===1?5500:Math.max(6500,15000-this.level*1500)+this.random()*6000;this.schedule(()=>this.beginRound(),wait);},blocked?1250:2100);
    }
  }
  setPaused(paused){
    if(typeof paused!=='boolean')throw new Error('Invalid pause state');if(this.paused===paused)return;
    this.paused=paused;this.clearTimer(this.timer);this.phase='waiting';this.emit('clear');
    if(!paused)this.schedule(()=>this.beginRound(),this.round===0?8200:6500);
  }
}
