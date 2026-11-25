import {existsSync,readFileSync} from 'node:fs';

export function productCatalogue(file,actor){
 if(!existsSync(file))return [];
 const commercial=['admin','accounts','sales'].includes(actor.role);
 const catalogue=JSON.parse(readFileSync(file,'utf8'));
 return catalogue.families.map(family=>({id:family.id,name:family.name,image:family.image,variants:family.variants
  .filter(variant=>actor.unit==='all'||variant.units.includes('all')||variant.units.includes(actor.unit))
  .map(variant=>({size:variant.size,units:variant.units,prices:commercial?variant.prices:[]})),pricesVisible:commercial}))
  .filter(family=>family.variants.length);
}
