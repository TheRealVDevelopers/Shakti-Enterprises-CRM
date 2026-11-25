import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {parseHTML} from 'linkedom';
import {productCatalogue} from '../lib/product-catalogue.mjs';
import {productCatalogueHtml,bindProductCatalogue} from '../public/crm-products.js';

test('product references scope variants and protect commercial prices',t=>{
 const directory=mkdtempSync(join(tmpdir(),'product-catalogue-'));t.after(()=>rmSync(directory,{recursive:true,force:true}));
 const file=join(directory,'catalogue.json');
 writeFileSync(file,JSON.stringify({families:[{id:'bar',name:'Bottom bar',image:'/assets/products/bottom-bar.png',variants:[
  {size:'15 spine',units:['Unit 1'],prices:[{value:'2.20 (SET)',list:'RR Industries'}]},
  {size:'22 spine',units:['Unit 2'],prices:[]},
  {size:'18 spine',units:['all'],prices:[{value:'₹ 4.00',list:'RR Industries'}]}
 ]}]}));
 const admin=productCatalogue(file,{role:'admin',unit:'all'});assert.equal(admin[0].variants.length,3);assert.equal(admin[0].variants[0].prices[0].value,'2.20 (SET)');
 const manager=productCatalogue(file,{role:'manager',unit:'Unit 1'});assert.equal(manager[0].variants.length,2);assert.ok(manager[0].variants.every(variant=>variant.prices.length===0));assert.equal(manager[0].pricesVisible,false);
 assert.equal(productCatalogue(join(directory,'missing'),{role:'admin',unit:'all'}).length,0);
});

test('one product card holds all sizes, preserves quotation qualifiers and filters by size',()=>{
 const family={id:'bottom-bar',name:'Bottom bar',image:'/assets/products/bottom-bar.png',pricesVisible:true,variants:[{size:'15 spine',prices:[{value:'2.20 (SET)'}]},{size:'22 spine',prices:[]}]};
 const {document,window}=parseHTML(productCatalogueHtml([family]));
 assert.equal(document.querySelectorAll('[data-product-family]').length,1);
 assert.equal(document.querySelectorAll('tbody tr').length,2);assert.match(document.textContent||document.toString(),/2.20 \(SET\)/);assert.match(document.toString(),/Quote on request/);
 bindProductCatalogue(document);const input=document.querySelector('input');input.value='22 spine';input.dispatchEvent(new window.Event('input'));assert.equal(document.querySelector('article').hidden,false);
 input.value='unknown';input.dispatchEvent(new window.Event('input'));assert.equal(document.querySelector('article').hidden,true);assert.equal(document.querySelector('#product-family-empty').hidden,false);
 const restricted=productCatalogueHtml([{...family,pricesVisible:false,variants:family.variants.map(v=>({...v,prices:[]}))}]);assert.ok(!restricted.includes('2.20'));assert.ok(!restricted.includes('<th scope="col">Reference price</th>'));
});
