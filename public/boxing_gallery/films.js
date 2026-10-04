// One local, muted, fight-only excerpt per boxer. Source ranges live in the asset manifest.
const fight=(name,key)=>({name,src:`assets/fights/${key}-fight.mp4`,poster:`assets/fights/${key}-poster.jpg`,start:0});
export const films = [
  fight('Usyk','usyk'),
  fight('Canelo','canelo'),
  fight('Lomachenko','loma'),
  fight('Inoue','inoue'),
  fight('Benavidez','benavidez'),
  fight('Moses Itauma','itauma')
];
