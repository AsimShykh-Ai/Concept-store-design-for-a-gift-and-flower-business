(function(){
'use strict';
var CUR='$';
var memory={};
function load(){try{var v=window.localStorage.getItem('rw_cart');return v?JSON.parse(v):{};}catch(e){return memory.cart||{};}}
function save(c){memory.cart=c;try{window.localStorage.setItem('rw_cart',JSON.stringify(c));}catch(e){}}
function money(n){return CUR+(Math.round(n*100)/100).toFixed(2);}
function P(id){return (window.PRODUCTS||[]).filter(function(p){return p.id===id;})[0];}
function count(c){var n=0;for(var k in c){n+=c[k];}return n;}
function badge(){var c=load(),n=count(c);var els=document.querySelectorAll('.badge');for(var i=0;i<els.length;i++){els[i].textContent=n;}}
function toast(msg){var t=document.getElementById('toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(function(){t.classList.remove('show');},2200);}
function add(id,q){var c=load();c[id]=(c[id]||0)+q;save(c);badge();var p=P(id);toast((p?p.name:'Item')+' added to cart');}

document.documentElement.classList.add('js');
badge();

var mb=document.getElementById('menu-btn'),mn=document.getElementById('mobile-nav');
if(mb&&mn){mb.addEventListener('click',function(){var o=mn.classList.toggle('open');mb.setAttribute('aria-expanded',o?'true':'false');});}

document.addEventListener('click',function(e){
  var b=e.target.closest?e.target.closest('[data-add]'):null;
  if(b){var q=1;var qi=document.getElementById('qty');if(qi&&b.hasAttribute('data-useqty')){q=Math.max(1,Math.min(20,parseInt(qi.value,10)||1));}add(b.getAttribute('data-add'),q);}
});

if('IntersectionObserver' in window){
  var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target);}});},{threshold:.12});
  [].forEach.call(document.querySelectorAll('.reveal'),function(el){io.observe(el);});
}else{[].forEach.call(document.querySelectorAll('.reveal'),function(el){el.classList.add('in');});}

/* shop filter + sort */
var q=document.getElementById('q'),sort=document.getElementById('sort'),grid=document.getElementById('grid');
function applyShop(){
  if(!grid)return;
  var cards=[].slice.call(grid.querySelectorAll('.card'));
  var term=(q&&q.value||'').toLowerCase().trim();var shown=0;
  cards.forEach(function(c){var ok=!term||c.getAttribute('data-name').indexOf(term)>-1;c.style.display=ok?'':'none';if(ok)shown++;});
  var s=sort?sort.value:'';
  if(s){cards.sort(function(a,b){var pa=+a.getAttribute('data-price'),pb=+b.getAttribute('data-price');
    if(s==='low')return pa-pb;if(s==='high')return pb-pa;return +a.getAttribute('data-order')-+b.getAttribute('data-order');});
    cards.forEach(function(c){grid.appendChild(c);});}
  var em=document.getElementById('no-results');if(em)em.style.display=shown?'none':'block';
}
if(q)q.addEventListener('input',applyShop);
if(sort)sort.addEventListener('change',applyShop);

/* cart page */
var cr=document.getElementById('cart-root');
function renderCart(){
  if(!cr)return;var c=load(),ids=Object.keys(c).filter(function(i){return P(i)&&c[i]>0;});
  if(!ids.length){cr.innerHTML='<div class="empty"><h2>Your cart is empty</h2><p>Browse our gifts, bouquets, cakes and combos to get started.</p><a class="btn" href="shop.html">Start shopping</a></div>';return;}
  var tot=0,rows='';
  ids.forEach(function(i){var p=P(i),line=p.price*c[i];tot+=line;
    rows+='<tr><td><a href="'+p.url+'">'+p.name+'</a></td><td>'+money(p.price)+'</td><td><button class="qbtn" data-dec="'+i+'" aria-label="Decrease quantity of '+p.name+'">&minus;</button> <strong aria-live="polite">'+c[i]+'</strong> <button class="qbtn" data-inc="'+i+'" aria-label="Increase quantity of '+p.name+'">+</button></td><td>'+money(line)+'</td><td><button class="linkbtn" data-rm="'+i+'">Remove</button></td></tr>';});
  cr.innerHTML='<div style="overflow-x:auto"><table class="cart"><thead><tr><th>Item</th><th>Price</th><th>Qty</th><th>Total</th><th><span class="sr">Remove</span></th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
   '<div class="summary" style="margin-top:22px;max-width:420px;margin-left:auto"><div class="sum-row"><span>Subtotal</span><span>'+money(tot)+'</span></div><div class="sum-row"><span>Delivery</span><span>Set by store</span></div><div class="sum-row total"><span>Total</span><span>'+money(tot)+'</span></div><p style="margin:14px 0 0"><a class="btn" href="checkout.html" style="width:100%">Checkout</a></p></div>';
}
if(cr){
  renderCart();
  cr.addEventListener('click',function(e){var t=e.target,c=load(),id;
    if((id=t.getAttribute('data-inc'))){c[id]=(c[id]||0)+1;}
    else if((id=t.getAttribute('data-dec'))){c[id]=Math.max(0,(c[id]||0)-1);if(!c[id])delete c[id];}
    else if((id=t.getAttribute('data-rm'))){delete c[id];}else return;
    save(c);badge();renderCart();});
}

/* checkout */
var co=document.getElementById('order-summary');
if(co){
  var c=load(),ids=Object.keys(c).filter(function(i){return P(i)&&c[i]>0;}),tot=0,h='';
  ids.forEach(function(i){var p=P(i);tot+=p.price*c[i];h+='<div class="sum-row"><span>'+p.name+' &times; '+c[i]+'</span><span>'+money(p.price*c[i])+'</span></div>';});
  co.innerHTML=ids.length?h+'<div class="sum-row total"><span>Total</span><span>'+money(tot)+'</span></div>':'<p>Your cart is empty. <a href="shop.html">Go to the shop</a>.</p>';
  var dd=document.getElementById('ddate');if(dd){var d=new Date();d.setDate(d.getDate()+1);dd.min=d.toISOString().slice(0,10);}
}
function validate(form){
  var ok=true;[].forEach.call(form.querySelectorAll('[data-req]'),function(f){
    var v=(f.value||'').trim(),m='';
    if(!v)m='This field is required.';
    else if(f.type==='email'&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v))m='Enter a valid email address.';
    else if(f.getAttribute('data-phone')&&!/^[+0-9 ()-]{7,20}$/.test(v))m='Enter a valid phone number.';
    var e=document.getElementById(f.id+'-err');if(e)e.textContent=m;f.setAttribute('aria-invalid',m?'true':'false');if(m)ok=false;});
  return ok;
}
var of=document.getElementById('order-form');
if(of){of.addEventListener('submit',function(e){e.preventDefault();
  if(!Object.keys(load()).length){toast('Your cart is empty');return;}
  if(!validate(of)){var f=of.querySelector('[aria-invalid="true"]');if(f)f.focus();return;}
  save({});badge();of.style.display='none';var s=document.getElementById('order-summary');if(s)s.innerHTML='';
  var r=document.getElementById('order-done');r.style.display='block';r.focus();});}
var cf=document.getElementById('contact-form');
if(cf){cf.addEventListener('submit',function(e){e.preventDefault();
  if(!validate(cf)){var f=cf.querySelector('[aria-invalid="true"]');if(f)f.focus();return;}
  cf.reset();var r=document.getElementById('contact-done');r.style.display='block';r.focus();});}
})();
