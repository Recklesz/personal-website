export function createGlass(canvas, reducedMotion) {
const ctx=canvas.getContext('2d');
function drawCracks(side){
  const ratio=Math.min(devicePixelRatio||1,2),w=innerWidth,h=innerHeight;canvas.width=w*ratio;canvas.height=h*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);
  const x=w*(side==='left'?.44:.56),y=h*.45,max=Math.hypot(w,h),rays=[];
  const count=19;
  for(let i=0;i<count;i++){
    const angle=(i/count)*Math.PI*2+(Math.random()-.5)*.19;let px=x,py=y;const points=[{x,y}];
    let distance=9+Math.random()*9;
    while(distance<max){const a=angle+(Math.random()-.5)*.14,nx=x+Math.cos(a)*distance,ny=y+Math.sin(a)*distance;points.push({x:nx,y:ny});distance+=16+distance*.26+Math.random()*25;}
    rays.push(points);
    ctx.beginPath();ctx.moveTo(x,y);for(const point of points)ctx.lineTo(point.x,point.y);ctx.strokeStyle='rgba(5,9,7,.85)';ctx.lineWidth=2.5;ctx.stroke();
    ctx.save();ctx.translate(.85,-.8);ctx.strokeStyle=`rgba(231,248,242,${.45+Math.random()*.4})`;ctx.lineWidth=.7+Math.random()*.7;ctx.stroke();ctx.restore();
    for(let j=2;j<points.length-1;j++){const p=points[j],angle2=angle+(Math.random()>.5?1:-1)*(.3+Math.random()*.5);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+Math.cos(angle2)*(30+j*17),p.y+Math.sin(angle2)*(30+j*17));ctx.strokeStyle='rgba(218,245,240,.4)';ctx.lineWidth=.55;ctx.stroke();}
  }
  for(let ring=1;ring<6;ring++){for(let i=0;i<count;i++){if(Math.random()<.2)continue;const a=rays[i][Math.min(ring,rays[i].length-1)],b=rays[(i+1)%count][Math.min(ring,rays[(i+1)%count].length-1)];ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo((a.x+b.x)/2+(Math.random()-.5)*20,(a.y+b.y)/2+(Math.random()-.5)*20);ctx.lineTo(b.x,b.y);ctx.strokeStyle=`rgba(221,241,237,${.48-ring*.065})`;ctx.lineWidth=.55;ctx.stroke();if(ring<=3&&i%4===0){ctx.lineTo(x,y);ctx.closePath();ctx.fillStyle='rgba(224,245,240,.06)';ctx.fill();}}}
  const glow=ctx.createRadialGradient(x,y,0,x,y,60);glow.addColorStop(0,'rgba(235,248,238,.6)');glow.addColorStop(.2,'rgba(235,248,238,.09)');glow.addColorStop(1,'rgba(235,248,238,0)');ctx.fillStyle=glow;ctx.fillRect(x-60,y-60,120,120);
  canvas.style.transition='none';canvas.style.opacity=reducedMotion?'.35':'1';
}

return {draw:drawCracks,clear(){canvas.style.transition='opacity .7s';canvas.style.opacity='0';}};
}
