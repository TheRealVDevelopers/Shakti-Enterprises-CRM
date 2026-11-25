const priceText=value=>String(value).includes('₹')?String(value):'₹ '+value;
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function productCatalogueHtml(families=[]){
 if(!families.length)return '';
 return `<section class="product-catalogue" aria-label="Product families"><div class="product-catalogue-heading"><div><p class="eyebrow">OUR PRODUCTS / ONE FAMILY, MANY POSSIBILITIES</p><h2>Find the part.<br>Choose the size.</h2><p>Each product comes in different sizes or colours, with prices varying by variant.</p></div><label class="field">Find a product or size<input type="search" id="product-family-search" placeholder="Try bottom bar, cap or 40 mm…"></label></div><p class="product-reference-note">AI-created product illustrations show the product type; exact geometry and colour require the approved drawing or sample. Listed prices are references from the RR Industries price list, subject to quotation. Unlisted prices are available on request.</p><p id="product-family-count" class="muted" aria-live="polite">${families.length} product families</p><div class="product-family-grid">${families.map(family=>`<article class="product-family-card" data-product-family="${esc(family.id)}"><figure><img src="${esc(family.image)}" alt="Illustration of ${esc(family.name)}" loading="lazy"><figcaption>Product illustration</figcaption></figure><div class="product-family-copy"><h3>${esc(family.name)}</h3><p>Available in ${family.variants.length} size / colour variant${family.variants.length===1?'':'s'}.</p><details><summary>Explore sizes ${family.pricesVisible?'& prices':''}<span aria-hidden="true">+</span></summary><div class="product-variant-scroll"><table><thead><tr><th scope="col">Size / variant</th>${family.pricesVisible?'<th scope="col">Reference price</th>':''}</tr></thead><tbody>${family.variants.map(variant=>`<tr><td>${esc(variant.size)}</td>${family.pricesVisible?`<td>${variant.prices.length?variant.prices.map(price=>esc(priceText(price.value))).join('<br>')+(variant.prices.length>1?'<small class="muted">Multiple listed prices; confirm quotation.</small>':''):'Quote on request'}</td>`:''}</tr>`).join('')}</tbody></table></div></details></div></article>`).join('')}</div><p id="product-family-empty" class="muted" hidden>No matching product families. Try a different product name or size.</p></section>`;
}

export function bindProductCatalogue(root=document){
 const input=root.querySelector('#product-family-search');if(!input)return;
 input.addEventListener('input',()=>{
  const query=input.value.toLowerCase().replace(/\s/g,'');let count=0;
  for(const card of root.querySelectorAll('[data-product-family]')){
   card.hidden=!card.textContent.toLowerCase().replace(/\s/g,'').includes(query);if(!card.hidden)count++;
  }
  root.querySelector('#product-family-count').textContent=`${count} product ${count===1?'family':'families'}`;
  root.querySelector('#product-family-empty').hidden=count!==0;
 });
}
