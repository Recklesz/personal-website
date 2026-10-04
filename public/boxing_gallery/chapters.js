const nativeFrames=new Set(['benavidez-1','benavidez-2','benavidez-4','itauma-3']);
const action=(fighter,index,layout,bg,frame)=>({layout,images:[`assets/gallery/${fighter}-${index}.jpg`],bg,frame,nativeSize:nativeFrames.has(`${fighter}-${index}`)});
// A complete fight chapter for every boxer, with more scenes as the collection unfolds.
export const chapters = [
  {name:'Usyk',key:'usyk',hanging:{start:0,next:1.18,steps:[.90,1.52,.78]},nameStyle:'low',transition:'pullback',scenes:[
    {layout:'cinema',film:0,bg:'#0a0b0d'},
    action('usyk',1,'panorama','#e5e3da',[3,16,76,68]),
    action('usyk',2,'ringside','#131b28',[35,18,57,67]),
    action('usyk',3,'full-bout','#142337',[6,7,90,86])]},
  {name:'Canelo',key:'canelo',hanging:{start:.68,next:1.07,steps:[.76,1.35,1.08]},nameStyle:'high',transition:'drift',scenes:[
    action('canelo',2,'ringside','#622422'),
    action('canelo',1,'floating','#20110e',[5,11,56,74]),
    {layout:'inset',film:1,bg:'#e9e4db'},
    action('canelo',3,'full-bout','#17100f',[19,10,77,80])]},
  {name:'Lomachenko',key:'loma',hanging:{start:-.28,next:1.29,steps:[1.32,.74,.89,1.48]},nameStyle:'side',transition:'letterbox',scenes:[
    action('loma',1,'ringside','#1b272b'),
    action('loma',3,'full-bout','#0a1217',[14,8,71,80]),
    {layout:'asymmetric',film:2,bg:'#d4dfd9'},
    action('loma',2,'aperture','#16323b',[37,15,56,70]),
    action('loma',4,'full-bout','#080e13',[2,7,85,86])]},
  {name:'Inoue',key:'inoue',hanging:{start:.36,next:1.12,steps:[.78,1.46,1.09,.78]},nameStyle:'wide',transition:'push',scenes:[
    action('inoue',1,'panorama','#e6e3dd'),
    action('inoue',3,'ringside','#131313',[6,15,67,70]),
    action('inoue',2,'full-bout','#171925',[29,10,65,80]),
    action('inoue',4,'upright','#ded8cc'),
    {layout:'cinema',film:3,bg:'#110e12'}]},
  {name:'Benavidez',key:'benavidez',hanging:{start:1.04,next:1.24,steps:[1.40,.79,.98,1.55,.80]},nameStyle:'stack',transition:'float',scenes:[
    action('benavidez',1,'ringside','#171b23'),
    action('benavidez',2,'ringside','#d3d0c4',[5,16,60,68]),
    action('benavidez',3,'floating','#181b1e',[30,8,65,84]),
    {layout:'cinema',film:4,bg:'#101012'},
    action('benavidez',4,'panorama','#662b25',[5,18,64,64]),
    action('benavidez',5,'aperture','#c5c2b9',[23,10,72,80])]},
  {name:'Moses Itauma',key:'itauma',hanging:{start:-.08,next:1.12,steps:[.86,1.34,.77,1.51,.81]},nameStyle:'low',transition:'glide',scenes:[
    action('itauma',1,'ringside','#101515'),
    {layout:'inset',film:5,bg:'#bac8c6'},
    action('itauma',2,'full-bout','#171b21',[3,11,70,78]),
    action('itauma',3,'floating','#dae0db',[34,16,60,68]),
    action('itauma',4,'panorama','#25343b',[3,10,87,80]),
    action('itauma',5,'aperture','#e9e4db',[26,15,68,70])]}
];
