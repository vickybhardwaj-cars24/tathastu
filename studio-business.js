/* Studio workflows use the existing Worker JSON document and preserve legacy records. */
const StudioBusiness=(()=>{
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>Math.round((Number(v)||0)*100)/100;
  const id=prefix=>prefix+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);
  const categories={
    'Photography Services':['Passport Size Photos','Visa Photos','ID Card Photos','Photo Printing','Photo Restoration','Photo Editing','Old Photo Colourization','Photo Retouching'],
    'Printing Services':['4×6 Photo Print','5×7 Photo Print','8×12 Photo Print','A4 Photo Print','Document Printing','Custom Size Printing'],
    'Photo Frames':['Standard Frames','Premium Frames','Custom Frames','Collage Frames','Table Frames','Wall Frames'],
    'Wedding & Photography':['Wedding Albums','Pre-Wedding Shoots','Cinematic Videos','Traditional Videos','Candid Photography','Drone Photography','360° Video','Couple Portraits','Event Photography'],
    'Other Services':['Video Editing','Reel Editing','Lamination','Scanning','Photocopy','Digital File Delivery']
  };
  const code=(category,name)=>(category+'-'+name).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  const defaults=Object.entries(categories).flatMap(([category,names])=>names.map(name=>({id:code(category,name),code:code(category,name),name,category,unit:'each',sellingPrice:null,costPrice:null,taxRate:0,discount:0,description:'',active:true,quotationOnly:false})));
  function catalogue(){
    const saved=new Map((DB.catalogue||[]).map(p=>[p.code,p]));
    return [...defaults.map(p=>({...p,...saved.get(p.code)})),...(DB.catalogue||[]).filter(p=>!defaults.some(d=>d.code===p.code))];
  }
  function product(ref){return catalogue().find(p=>p.code===ref);}
  function renderCatalogue(){
    const q=(window._catSearch||'').toLowerCase();
    const list=catalogue().filter(p=>!q||(p.name+' '+p.code+' '+p.category).toLowerCase().includes(q));
    return `<div class="shdr"><div><div class="stitle">Product &amp; Service Catalogue</div><div class="ssub">Set a price before a service appears in Fast Billing. Disabling an item keeps old bills intact.</div></div><button class="btn btn-g btn-sm" onclick="StudioBusiness.editProduct()">+ Add Item</button></div>
      <div class="srow"><input class="sinp" placeholder="Search name or code" value="${esc(window._catSearch||'')}" oninput="window._catSearch=this.value;window.render()"></div>
      <div class="tw"><table><thead><tr><th>Code</th><th>Service / Product</th><th>Category</th><th>Unit</th><th>Selling</th><th>Cost</th><th>Tax</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      ${list.map(p=>`<tr><td>${esc(p.code)}</td><td><b>${esc(p.name)}</b>${p.description?'<div class="phone">'+esc(p.description)+'</div>':''}</td><td>${esc(p.category)}</td><td>${esc(p.unit)}</td><td>${p.sellingPrice==null?'Set price':fmtINR(p.sellingPrice)}</td><td>${p.costPrice==null?'—':fmtINR(p.costPrice)}</td><td>${Number(p.taxRate)||0}%</td><td>${p.active===false?'Disabled':'Available'}</td><td><button class="btn btn-o btn-sm" onclick="StudioBusiness.editProduct('${esc(p.code)}')">Edit</button> <button class="btn btn-o btn-sm" onclick="StudioBusiness.toggleProduct('${esc(p.code)}')">${p.active===false?'Enable':'Disable'}</button></td></tr>`).join('')}
      </tbody></table></div>`;
  }
  function editProduct(ref){
    const p=product(ref)||{code:'',name:'',category:Object.keys(categories)[0],unit:'each',sellingPrice:'',costPrice:'',taxRate:0,discount:0,description:'',active:true,quotationOnly:false};
    const shade=document.createElement('div');shade.className='shade';shade.id='shade';shade.style='position:fixed;inset:0;z-index:200;overflow:auto;padding:20px';
    shade.innerHTML=`<div class="modal"><div class="mtitle">${ref?'Edit':'Add'} catalogue item <button class="mclose" onclick="closeShade()">✕</button></div>
      <div class="business-grid"><div class="ff"><label>Name</label><input id="cat-name" value="${esc(p.name)}"></div><div class="ff"><label>Code</label><input id="cat-code" value="${esc(p.code)}" ${ref?'readonly':''}></div>
      <div class="ff"><label>Category</label><select id="cat-category">${[...Object.keys(categories),'Custom'].map(v=>`<option ${p.category===v?'selected':''}>${v}</option>`).join('')}</select></div><div class="ff"><label>Unit</label><input id="cat-unit" value="${esc(p.unit)}" placeholder="per set / per print / per event"></div>
      <div class="ff"><label>Selling price (₹)</label><input id="cat-price" type="number" min="0" step="0.01" value="${p.sellingPrice??''}"></div><div class="ff"><label>Cost price (₹)</label><input id="cat-cost" type="number" min="0" step="0.01" value="${p.costPrice??''}"></div>
      <div class="ff"><label>Tax %</label><input id="cat-tax" type="number" min="0" max="100" step="0.01" value="${p.taxRate||0}"></div><div class="ff"><label>Max discount %</label><input id="cat-discount" type="number" min="0" max="100" step="0.01" value="${p.discount||0}"></div></div>
      <div class="ff mt8"><label>Description</label><input id="cat-description" value="${esc(p.description||'')}"></div><div class="btn-row"><button class="btn btn-o" onclick="closeShade()">Cancel</button><button class="btn btn-g" onclick="StudioBusiness.saveProduct('${esc(ref||'')}')">Save Item</button></div></div>`;
    document.body.appendChild(shade);
  }
  function saveProduct(oldCode){
    const get=x=>document.getElementById('cat-'+x).value.trim();
    const name=get('name'),newCode=get('code')||code(get('category'),name);
    const selling=get('price')===''?null:Number(get('price'));
    const cost=get('cost')===''?null:Number(get('cost'));
    const tax=Number(get('tax')),discount=Number(get('discount'));
    if(!name||!newCode||! /^[a-z0-9][a-z0-9-]*$/i.test(newCode)){alert('Name and a code using letters, numbers and hyphens are required.');return;}
    if(!oldCode&&catalogue().some(p=>p.code===newCode)){alert('That product code already exists.');return;}
    if([selling,cost,tax,discount].some(x=>x!==null&&(!Number.isFinite(x)||x<0))||tax>100||discount>100){alert('Check price, cost, tax and discount values.');return;}
    const previous=product(oldCode)||{};
    const next={...previous,code:newCode,id:previous.id||newCode,name,category:get('category'),unit:get('unit')||'each',sellingPrice:selling,costPrice:cost,taxRate:tax,discount,description:get('description'),active:previous.active!==false};
    const i=DB.catalogue.findIndex(p=>p.code===oldCode||p.code===newCode);
    if(i<0)DB.catalogue.push(next);else DB.catalogue[i]=next;
    save();closeShade();window.render();
  }
  function toggleProduct(ref){
    const p=product(ref);if(!p)return;
    const next={...p,active:p.active===false};
    const i=DB.catalogue.findIndex(x=>x.code===ref);
    if(i<0)DB.catalogue.push(next);else DB.catalogue[i]=next;
    save();window.render();
  }

  const pos={category:'All',query:'',cart:[],discountType:'fixed',discountValue:0,payment:'Cash',paid:0,customerMode:'guest',customerIndex:'',guestName:'',guestPhone:'',lastBill:null};
  function posItems(){return catalogue().filter(p=>p.active!==false&&p.sellingPrice!=null&&Number(p.sellingPrice)>0&&!p.quotationOnly&&
      (pos.category==='All'||p.category===pos.category)&&(!pos.query||(p.name+' '+p.code).toLowerCase().includes(pos.query.toLowerCase())));}
  function calculateBill(items,discountType,discountValue,paidInput){
    const subtotal=money(items.reduce((sum,x)=>sum+x.quantity*x.unitPrice,0));
    const discount=money(Math.min(subtotal,Math.max(0,discountType==='percent'?subtotal*Number(discountValue)/100:Number(discountValue)||0)));
    const factor=subtotal?Math.max(0,1-discount/subtotal):1;
    const tax=money(items.reduce((sum,x)=>sum+x.quantity*x.unitPrice*factor*(Number(x.taxRate)||0)/100,0));
    const total=money(subtotal-discount+tax);
    const paid=money(Math.min(total,Math.max(0,Number(paidInput)||0)));
    return {subtotal,discount,tax,total,paid,balance:money(total-paid)};
  }
  function totals(){return calculateBill(pos.cart,pos.discountType,pos.discountValue,pos.paid);}
  function renderPOS(){
    const t=totals();
    return `<div class="shdr"><div><div class="stitle">⚡ Fast Billing</div><div class="ssub">Quick guest bill or registered customer bill</div></div><div class="business-actions"><button class="btn btn-g btn-sm" onclick="StudioBusiness.openCustomService()">+ Custom service</button><button class="btn btn-o btn-sm" onclick="go('catalogue',document.querySelector('.ntab[onclick*=catalogue]'))">Manage Prices</button></div></div>
      ${pos.lastBill?`<div class="business-card" style="margin-bottom:12px"><b>Bill saved:</b> ${esc(pos.lastBill.billNo)} · ${fmtINR(pos.lastBill.amount)} <button class="btn btn-o btn-sm" onclick="StudioBusiness.printBillAgain()">Print again</button> ${pos.lastBill.phone?`<button class="btn-wa" onclick="StudioBusiness.openBillReview()">WhatsApp message</button>`:''}</div>`:''}
      <div class="pos-layout"><div><div class="business-actions">${['All',...Object.keys(categories),'Custom'].map(v=>`<button class="btn ${pos.category===v?'btn-g':'btn-o'} btn-sm" onclick="StudioBusiness.setCategory('${esc(v)}')">${esc(v)}</button>`).join('')}</div>
      <input class="sinp" placeholder="Search product or service" value="${esc(pos.query)}" oninput="StudioBusiness.setSearch(this.value)">
      <div class="pos-list mt8" id="pos-list">${renderPOSItems()}</div></div>
      <div class="business-card"><h3>Bill</h3><div id="pos-cart">${renderCart()}</div><div class="ff mt8"><label>Discount</label><select id="pos-discount-type" onchange="StudioBusiness.updatePOS()"><option value="fixed" ${pos.discountType==='fixed'?'selected':''}>₹ Fixed</option><option value="percent" ${pos.discountType==='percent'?'selected':''}>% Percentage</option></select><input id="pos-discount" type="number" min="0" value="${pos.discountValue||0}" oninput="StudioBusiness.updatePOS()"></div>
      <div id="pos-totals">${renderTotals(t)}</div>
      <div class="ff mt8"><label>Billing mode</label><select id="pos-mode" onchange="StudioBusiness.updatePOS()"><option value="guest" ${pos.customerMode==='guest'?'selected':''}>Quick Guest</option><option value="registered" ${pos.customerMode==='registered'?'selected':''}>Registered Customer</option></select></div>
      <div id="pos-customer">${renderPOSCustomer()}</div>
      <div class="business-grid mt8"><div class="ff"><label>Payment method</label><select id="pos-payment" onchange="StudioBusiness.updatePOS()">${['Cash','UPI','Card','Bank Transfer','Other'].map(v=>`<option ${pos.payment===v?'selected':''}>${v}</option>`).join('')}</select></div><div class="ff"><label>Amount paid</label><input id="pos-paid" type="number" min="0" step="0.01" value="${pos.paid||0}" oninput="StudioBusiness.updatePOS()"></div></div>
      <div class="btn-row"><button class="btn btn-g" onclick="StudioBusiness.saveBill()">Save &amp; Print Bill</button></div></div></div>`;
  }
  function renderPOSItems(){const list=posItems();return list.length?list.map(p=>`<button class="pos-item" onclick="StudioBusiness.addItem('${esc(p.code)}')"><b>${esc(p.name)}</b><small>${esc(p.unit)} · ${fmtINR(p.sellingPrice)}${p.taxRate?' · '+p.taxRate+'% tax':''}</small></button>`).join(''):'<div class="empty">No priced items here. Set prices in Catalogue.</div>';}
  function renderCart(){return pos.cart.length?pos.cart.map((x,i)=>`<div class="pos-cart-row"><span>${esc(x.name)}<small style="display:block;color:var(--txm)">${fmtINR(x.unitPrice)} / ${esc(x.unit)}</small></span><button class="btn btn-o btn-sm" onclick="StudioBusiness.quantity(${i},-1)">−</button><b>${x.quantity}</b><button class="btn btn-o btn-sm" onclick="StudioBusiness.quantity(${i},1)">+</button><button class="btn btn-o btn-sm" onclick="StudioBusiness.overridePrice(${i})" title="Custom price with password confirmation">₹</button><button class="btn btn-d btn-sm" onclick="StudioBusiness.removeItem(${i})">✕</button></div>`).join(''):'<div class="empty">Select a product to start</div>';}
  function renderTotals(t){return `<div class="business-card mt8"><div>Subtotal: <b>${fmtINR(t.subtotal)}</b></div><div>Discount: <b>${fmtINR(t.discount)}</b></div><div>Tax: <b>${fmtINR(t.tax)}</b></div><div style="font-size:18px;color:var(--gold)">Total: <b>${fmtINR(t.total)}</b></div><div>Balance: <b>${fmtINR(t.balance)}</b></div></div>`;}
  function renderPOSCustomer(){return pos.customerMode==='guest'?`<div class="business-grid mt8"><div class="ff"><label>Name (optional)</label><input id="pos-guest-name" value="${esc(pos.guestName)}" oninput="posGuest('name',this.value)"></div><div class="ff"><label>Phone (optional)</label><input id="pos-guest-phone" value="${esc(pos.guestPhone)}" oninput="posGuest('phone',this.value)"></div></div>`:
    `<div class="ff mt8"><label>Existing customer</label><select id="pos-customer-index" onchange="StudioBusiness.setCustomer(this.value)"><option value="">Create new / select customer</option>${DB.customers.map((c,i)=>`<option value="${i}" ${String(i)===pos.customerIndex?'selected':''}>${esc(c.name)} · ${esc(c.phone||'')}</option>`).join('')}</select></div>
    ${pos.customerIndex===''?`<div class="business-grid mt8"><div class="ff"><label>Customer name</label><input id="pos-guest-name" value="${esc(pos.guestName)}" oninput="posGuest('name',this.value)"></div><div class="ff"><label>Phone</label><input id="pos-guest-phone" value="${esc(pos.guestPhone)}" oninput="posGuest('phone',this.value)"></div></div>`:''}`;
  }
  function posGuest(key,value){if(key==='name')pos.guestName=value;else pos.guestPhone=value;}
  function setCategory(value){pos.category=value;document.getElementById('pos-list').innerHTML=renderPOSItems();window.render();}
  function setSearch(value){pos.query=value;document.getElementById('pos-list').innerHTML=renderPOSItems();}
  function addItem(ref){const p=product(ref);if(!p||p.active===false||!(Number(p.sellingPrice)>0))return;
    const existing=pos.cart.find(x=>x.code===ref&&x.unitPrice===Number(p.sellingPrice));
    if(existing)existing.quantity++;else pos.cart.push({code:ref,name:p.name,unit:p.unit,quantity:1,unitPrice:Number(p.sellingPrice),taxRate:Number(p.taxRate)||0});
    window.render();}
  function openCustomService(){
    const shade=document.createElement('div');shade.className='shade';shade.id='shade';shade.style='position:fixed;inset:0;z-index:300;overflow:auto;padding:20px';
    shade.innerHTML=`<div class="modal"><div class="mtitle">Add custom service <button class="mclose" onclick="closeShade()">✕</button></div><div class="business-grid"><div class="ff"><label>Service name</label><input id="custom-name" placeholder="Special retouching"></div><div class="ff"><label>Unit price (₹)</label><input id="custom-price" type="number" min="0.01" step="0.01"></div><div class="ff"><label>Quantity</label><input id="custom-quantity" type="number" min="1" step="1" value="1"></div><div class="ff"><label>Tax % (optional)</label><input id="custom-tax" type="number" min="0" max="100" step="0.01" value="0"></div></div><p class="wf-help">This service is added to this bill only. Add another custom service the same way.</p><div class="btn-row"><button class="btn btn-o" onclick="closeShade()">Cancel</button><button class="btn btn-g" onclick="StudioBusiness.saveCustomService()">Add to bill</button></div></div>`;
    document.body.appendChild(shade);
  }
  function saveCustomService(){
    const name=document.getElementById('custom-name').value.trim(),price=Number(document.getElementById('custom-price').value),quantity=Number(document.getElementById('custom-quantity').value),tax=Number(document.getElementById('custom-tax').value);
    if(!name||name.length>120||!Number.isFinite(price)||price<=0||!Number.isInteger(quantity)||quantity<1||quantity>10000||!Number.isFinite(tax)||tax<0||tax>100){alert('Enter a name, positive price, whole-number quantity and valid tax.');return;}
    pos.cart.push({code:id('custom'),name,unit:'each',quantity,unitPrice:money(price),taxRate:tax,custom:true});
    closeShade();window.render();
  }
  function quantity(i,delta){const x=pos.cart[i];if(!x)return;x.quantity=Math.max(1,x.quantity+delta);window.render();}
  function removeItem(i){pos.cart.splice(i,1);window.render();}
  async function overridePrice(i){
    const x=pos.cart[i];if(!x)return;
    const password=prompt('Enter the studio account password to approve a custom price:');if(password===null)return;
    const user=sessionStorage.getItem('tw_u')||'';
    try{const response=await fetch(workerBase()+'/verify',{method:'POST',headers:{Authorization:'Basic '+btoa(user+':'+password)}});if(!response.ok)throw new Error('Invalid password');}
    catch{alert('Price override was not approved.');return;}
    const value=prompt('New unit price (₹):',String(x.unitPrice));if(value===null)return;
    const price=Number(value);if(!Number.isFinite(price)||price<0){alert('Enter a valid price.');return;}
    x.unitPrice=money(price);x.customPrice=true;window.render();
  }
  function updatePOS(){
    const q=id=>document.getElementById(id)?.value;
    pos.discountType=q('pos-discount-type')||pos.discountType;pos.discountValue=Number(q('pos-discount'))||0;
    pos.customerMode=q('pos-mode')||pos.customerMode;pos.payment=q('pos-payment')||pos.payment;pos.paid=Number(q('pos-paid'))||0;
    document.getElementById('pos-totals').innerHTML=renderTotals(totals());
    document.getElementById('pos-customer').innerHTML=renderPOSCustomer();
  }
  function setCustomer(i){pos.customerIndex=i;document.getElementById('pos-customer').innerHTML=renderPOSCustomer();}
  function saveBill(){
    updatePOS();const t=totals();
    if(!pos.cart.length||t.total<=0){alert('Add at least one priced item.');return;}
    if(!Number.isFinite(Number(pos.discountValue))||pos.discountValue<0||(pos.discountType==='percent'&&pos.discountValue>100)){alert('Check the discount.');return;}
    if(Number(pos.paid)<0||Number(pos.paid)>t.total){alert('Paid amount must be between zero and total.');return;}
    let customer=null;
    if(pos.customerMode==='registered'){
      customer=pos.customerIndex!==''?DB.customers[Number(pos.customerIndex)]:null;
      if(!customer){
        const name=pos.guestName.trim(),phone=phoneKey(pos.guestPhone);
        if(!name||phone.length<8){alert('Enter a name and phone for a registered customer.');return;}
        customer=DB.customers.find(c=>phoneKey(c.phone)===phone);
        if(!customer){customer={name,phone:pos.guestPhone,whatsapp:'',address:'',notes:'',timeline:[]};DB.customers.push(customer);}
      }
    }
    const bill={id:id('bill'),billNo:'TW-'+Date.now(),date:today(),createdAt:new Date().toISOString(),name:customer?.name||pos.guestName.trim()||'Guest',phone:customer?.phone||pos.guestPhone.trim(),service:pos.cart.map(x=>x.name).join(', '),items:pos.cart.map(x=>({...x})),subtotal:t.subtotal,discountType:pos.discountType,discountValue:pos.discountValue,discountAmount:t.discount,taxAmount:t.tax,amount:t.total,advance:t.paid,balance:t.balance,payMode:pos.payment,paymentStatus:t.balance===0?'Paid':t.paid>0?'Partially Paid':'Unpaid',status:'New Order',deliveryDate:'',notes:'Fast Billing'};
    DB.walkins.push(bill);SmartMessaging.queueFor('walkin',DB.walkins.length-1);save();
    pos.lastBill=bill;pos.cart=[];pos.discountValue=0;pos.paid=0;pos.customerIndex='';pos.guestName='';pos.guestPhone='';
    window.render();printBill(bill);
  }
  function printBill(bill){
    return TathastuPrint.open({kind:'Bill / Receipt',number:bill.billNo||bill.id,date:bill.date,customer:bill.name,phone:bill.phone,
      details:[['Payment method',bill.payMode||'—']],items:bill.items||[],subtotal:bill.subtotal,discount:bill.discountAmount,
      tax:bill.taxAmount,total:bill.amount,paid:bill.advance,balance:bill.balance});
  }
  function printBillAgain(){if(pos.lastBill)printBill(pos.lastBill);}
  function openBillReview(){const bill=pos.lastBill;if(!bill||!bill.phone)return;const i=DB.walkins.indexOf(bill);if(i>=0)SmartMessaging.open('walkin',i);}

  function renderJobs(){return `<div class="shdr"><div><div class="stitle">Studio Jobs</div><div class="ssub">Editing, printing, albums and deliveries</div></div><button class="btn btn-g btn-sm" onclick="StudioBusiness.openJob()">+ New Job</button></div><div class="tw"><table><thead><tr><th>ID</th><th>Customer</th><th>Service</th><th>Received</th><th>Deadline</th><th>Assigned</th><th>Status</th><th>Payment</th><th>Delivery</th></tr></thead><tbody>${DB.jobs.length?DB.jobs.map((j,i)=>`<tr><td>${esc(j.id)}</td><td>${esc(j.customerName)}<div class="phone">${esc(j.phone||'')}</div></td><td>${esc(j.service)}</td><td>${esc(j.receivedDate)}</td><td>${esc(j.deadline)}</td><td>${esc(j.assigned||'—')}</td><td><select onchange="StudioBusiness.updateJob(${i},'status',this.value)">${['New Order','Pending','In Progress','Editing','Ready for Preview','Awaiting Approval','Completed','Delivered'].map(x=>`<option ${j.status===x?'selected':''}>${x}</option>`).join('')}</select></td><td><select onchange="StudioBusiness.updateJob(${i},'paymentStatus',this.value)">${['Unpaid','Partially Paid','Paid'].map(x=>`<option ${j.paymentStatus===x?'selected':''}>${x}</option>`).join('')}</select></td><td>${esc(j.deliveryMethod||'—')}</td></tr>`).join(''):'<tr><td colspan="9" class="empty">No studio jobs yet</td></tr>'}</tbody></table></div>`;}
  function openJob(){const shade=document.createElement('div');shade.className='shade';shade.id='shade';shade.style='position:fixed;inset:0;z-index:200;overflow:auto;padding:20px';shade.innerHTML=`<div class="modal"><div class="mtitle">New Studio Job <button class="mclose" onclick="closeShade()">✕</button></div><div class="business-grid">${[['name','Customer name','text'],['phone','Phone','tel'],['service','Service type','text'],['received','Received date','date'],['deadline','Deadline','date'],['assigned','Assigned editor / employee','text'],['delivery','Delivery method','text'],['notes','Notes','text']].map(([key,label,type])=>`<div class="ff"><label>${label}</label><input id="job-${key}" type="${type}" ${key==='received'?'value="'+today()+'"':''}></div>`).join('')}</div><div class="btn-row"><button class="btn btn-o" onclick="closeShade()">Cancel</button><button class="btn btn-g" onclick="StudioBusiness.saveJob()">Save Job</button></div></div>`;document.body.appendChild(shade);}
  function saveJob(){const get=x=>document.getElementById('job-'+x).value.trim();if(!get('name')||!get('service')){alert('Customer and service are required.');return;}const j={id:id('job'),customerName:get('name'),phone:get('phone'),service:get('service'),receivedDate:get('received'),deadline:get('deadline'),assigned:get('assigned'),deliveryMethod:get('delivery'),notes:get('notes'),status:'New Order',paymentStatus:'Unpaid'};DB.jobs.push(j);autoCreateCustomer(j.customerName,j.phone);save();closeShade();window.render();}
  function updateJob(i,key,value){const j=DB.jobs[i];if(!j||!['status','paymentStatus'].includes(key))return;j[key]=value;save();}

  function renderQuotes(){return `<div class="shdr"><div><div class="stitle">Wedding Quotations</div><div class="ssub">Save an offer, print it, and convert it to a booking</div></div><button class="btn btn-g btn-sm" onclick="StudioBusiness.openQuote()">+ New Quotation</button></div><div class="tw"><table><thead><tr><th>Quote</th><th>Customer</th><th>Wedding Date</th><th>Package</th><th>Total</th><th>Advance</th><th>Status</th><th>Actions</th></tr></thead><tbody>${DB.quotes.length?DB.quotes.map((q,i)=>`<tr><td>${esc(q.id)}</td><td>${esc(q.customerName)}<div class="phone">${esc(q.phone||'')}</div></td><td>${esc(q.weddingDate)}</td><td>${esc(q.packageType)}</td><td>${fmtINR(q.total)}</td><td>${fmtINR(q.advance)}</td><td>${esc(q.status)}</td><td><button class="btn btn-o btn-sm" onclick="StudioBusiness.printQuote(${i})">Print / PDF</button> ${q.status==='Booked'?'':`<button class="btn btn-g btn-sm" onclick="StudioBusiness.convertQuote(${i})">Confirm Booking</button>`}</td></tr>`).join(''):'<tr><td colspan="8" class="empty">No quotations yet</td></tr>'}</tbody></table></div>`;}
  function openQuote(){const shade=document.createElement('div');shade.className='shade';shade.id='shade';shade.style='position:fixed;inset:0;z-index:200;overflow:auto;padding:20px';shade.innerHTML=`<div class="modal"><div class="mtitle">New Wedding Quotation <button class="mclose" onclick="closeShade()">✕</button></div><div class="business-grid"><div class="ff"><label>Customer name</label><input id="quote-name"></div><div class="ff"><label>Phone</label><input id="quote-phone"></div><div class="ff"><label>Wedding date</label><input id="quote-date" type="date"></div><div class="ff"><label>Package</label><select id="quote-package"><option>Budget-Friendly Package</option><option>Premium Package</option></select></div><div class="ff"><label>Functions and day offsets</label><input id="quote-functions" placeholder="Haldi:-2, Mehndi:-1, Wedding:0, Reception:1"></div><div class="ff"><label>Services, albums and frames</label><input id="quote-services" placeholder="Photography, album, frame"></div><div class="ff"><label>Original price (₹)</label><input id="quote-original" type="number" min="0"></div><div class="ff"><label>Discount (₹)</label><input id="quote-discount" type="number" min="0" value="0"></div><div class="ff"><label>Advance paid (₹)</label><input id="quote-advance" type="number" min="0" value="0"></div><div class="ff"><label>Complimentary services</label><input id="quote-complimentary"></div></div><div class="btn-row"><button class="btn btn-o" onclick="closeShade()">Cancel</button><button class="btn btn-g" onclick="StudioBusiness.saveQuote()">Save Quotation</button></div></div>`;document.body.appendChild(shade);}
  function saveQuote(){const get=x=>document.getElementById('quote-'+x).value.trim();const original=Number(get('original'))||0,discount=Number(get('discount'))||0,advance=Number(get('advance'))||0,total=money(original-discount);if(!get('name')||!get('date')||original<=0||discount<0||discount>original||advance<0||advance>total){alert('Enter customer, date and valid price, discount and advance.');return;}const functions=(get('functions')||'Wedding:0').split(',').map(x=>x.trim()).filter(Boolean).map(x=>{const parts=x.split(':');return {name:parts[0].trim(),offsetDays:parts.length>1?Number(parts[1].trim()):0};});if(functions.some(f=>!f.name||!Number.isInteger(f.offsetDays)||Math.abs(f.offsetDays)>365)){alert('Use function names with whole-day offsets, such as Haldi:-2, Wedding:0.');return;}const q={id:id('quote'),date:today(),customerName:get('name'),phone:get('phone'),weddingDate:get('date'),packageType:get('package'),functions,services:get('services'),complimentary:get('complimentary'),original,discount,total,advance,balance:money(total-advance),status:'Draft'};DB.quotes.push(q);save();closeShade();window.render();}
  function convertQuote(i){const q=DB.quotes[i];if(!q||q.status==='Booked')return;if(!confirm('Confirm this quotation as a booking for '+q.customerName+'?'))return;const specs=q.functions.length?q.functions:[{name:'Wedding',offsetDays:0}];const functions=specs.map((spec,j)=>{const name=typeof spec==='string'?spec:spec.name,offset=typeof spec==='string'?0:spec.offsetDays;return {...WeddingFunctions.newFunction(name,WeddingFunctions.addDays(q.weddingDate,offset),q.weddingDate,''),isMain:offset===0&&name.toLowerCase().includes('wedding'),sequence:j+1};});if(!functions.some(f=>f.isMain))functions.push({...WeddingFunctions.newFunction('Wedding',q.weddingDate,q.weddingDate,''),isMain:true,sequence:functions.length+1});const extras=functions.filter(f=>!f.isMain);const event={id:id('event'),quoteId:q.id,date:today(),name:q.customerName,phone:q.phone,eventType:'Wedding',eventDate:q.weddingDate,weddingDate:q.weddingDate,extraDates:extras.map(f=>f.date),extraVenues:extras.map(f=>f.venue||''),venue:'',functions,amount:q.total,advance:q.advance,balance:q.balance,status:'New Order',payMode:'Cash',notes:q.services,terms:'',installments:q.advance>0?[{date:today(),amount:q.advance,mode:'Cash',note:'Quotation advance'}]:[]};DB.events.push(event);q.status='Booked';q.bookingId=event.id;autoCreateCustomer(q.customerName,q.phone);save();window.render();}
  function printQuote(i){const q=DB.quotes[i];if(!q)return;const win=window.open('','_blank');if(!win)return;const names=q.functions.map(f=>typeof f==='string'?f:`${f.name} (${WeddingFunctions.addDays(q.weddingDate,f.offsetDays)})`).join(', ');win.document.write(`<html><head><title>Quotation ${esc(q.id)}</title><style>body{font:15px Arial;max-width:720px;margin:30px auto}h1{color:#8b6914}@media print{button{display:none}}</style></head><body><h1>Tathastu Weddings</h1><h2>Wedding Quotation ${esc(q.id)}</h2><p>Date: ${esc(q.date)} · Customer: ${esc(q.customerName)} · ${esc(q.phone)}</p><p>Wedding date: ${esc(q.weddingDate)}</p><p>Package: ${esc(q.packageType)}</p><p>Functions: ${esc(names)}</p><p>Services and products: ${esc(q.services)}</p><p>Complimentary: ${esc(q.complimentary||'—')}</p><hr><p>Original ${fmtINR(q.original)} · Discount ${fmtINR(q.discount)}</p><h2>Total ${fmtINR(q.total)}</h2><p>Advance ${fmtINR(q.advance)} · Balance ${fmtINR(q.balance)}</p><button onclick="window.print()">Print / Save as PDF</button></body></html>`);win.document.close();}

  function openMessages(phone,name,context,service,date,source){
    const prepared=source?SmartMessaging.prepare(source.kind,source.index,source.followup):SmartMessaging.prepareLegacy(phone,name,context,service,date);
    if(!prepared)return;
    const templates=[prepared.template];
    const shade=document.createElement('div');shade.className='shade';shade.id='shade';shade.style='position:fixed;inset:0;z-index:300;overflow:auto;padding:20px';
    const history=DB.messages.filter(m=>SmartMessaging.cleanPhone(m.phone)===SmartMessaging.cleanPhone(phone)).slice(-10).reverse();
    shade.innerHTML=`<div class="modal"><div class="mtitle">Message ${esc(prepared.name)} <button class="mclose" onclick="closeShade()">✕</button></div><p class="wf-help">Recommended for: <b>${esc(prepared.template.title)}</b>. ${prepared.reviewAllowed?'Completed service / final delivery confirmed.':'No review request at this stage.'}</p><div class="ff"><label>Template</label><select id="msg-template" onchange="StudioBusiness.chooseTemplate()"><option value="0">${esc(templates[0].title)}</option><option value="">Write your own</option></select></div><div class="ff mt8"><label>Preview and edit before opening WhatsApp</label><textarea id="msg-body" rows="8" style="width:100%">${esc(templates[0].body)}</textarea></div><div class="btn-row"><button class="btn btn-o" onclick="closeShade()">Close</button><button class="btn btn-g" onclick="StudioBusiness.openWhatsApp()">Open WhatsApp</button></div><p class="wf-help">Opening WhatsApp does not confirm a message was sent. Mark it sent after you send it.</p><h3 class="wf-heading">Communication history</h3><div id="msg-history">${history.length?history.map(m=>`<div class="business-card mt8"><b>${esc(m.template||'Custom')}</b> · ${esc(m.createdAt)} · ${esc(m.status)}<p style="white-space:pre-wrap">${esc(m.body)}</p>${m.status==='Opened WhatsApp'?`<button class="btn btn-o btn-sm" onclick="StudioBusiness.markMessageSent('${esc(m.id)}')">Mark sent</button> <button class="btn btn-o btn-sm" onclick="StudioBusiness.resetMessage('${esc(m.id)}')">Not sent / retry</button>`:''}</div>`).join(''):'<div class="empty">No messages recorded yet</div>'}</div></div>`;
    document.body.appendChild(shade);
    messageDraft={phone,name:prepared.name,context,templates,prepared,source};
  }
  let messageDraft=null;
  function chooseTemplate(){const i=document.getElementById('msg-template').value;document.getElementById('msg-body').value=i===''?'':messageDraft.templates[Number(i)].body;}
  function openWhatsApp(){const body=document.getElementById('msg-body').value.trim();if(!body){alert('Write a message first.');return;}const phone=messageDraft.phone.replace(/\D/g,'');if(phone.length<10){alert('Check customer phone number.');return;}if(!SmartMessaging.canOpen(body,messageDraft.prepared))return;const address=phone.length===10?'91'+phone:phone;const templateIndex=document.getElementById('msg-template').value;const p=messageDraft.prepared;const entry=SmartMessaging.pendingFor(p)||{id:id('msg'),phone:messageDraft.phone,customerName:messageDraft.name,context:messageDraft.context,sourceId:p.sourceId,stage:p.stage,createdAt:new Date().toISOString()};Object.assign(entry,{template:templateIndex===''?'Custom':p.template.title,body,reviewRequest:p.reviewAllowed&&SmartMessaging.reviewBody(body),status:'Opened WhatsApp'});if(!DB.messages.includes(entry))DB.messages.push(entry);save();window.open('https://wa.me/'+address+'?text='+encodeURIComponent(body),'_blank');const details=messageDraft;closeShade();openMessages(details.phone,details.name,details.context,'','',details.source);}
  function markMessageSent(ref){const m=DB.messages.find(x=>x.id===ref);if(!m)return;m.status='Marked sent';m.sentAt=new Date().toISOString();const details=messageDraft;if(m.stage==='quoteShare'&&m.context==='quote'){const q=DB.quotes.find(x=>x.id===m.sourceId);if(q&&q.status==='Draft')q.status='Sent';}save();closeShade();openMessages(details.phone,details.name,details.context,'','',details.source);}
  function resetMessage(ref){const m=DB.messages.find(x=>x.id===ref);if(!m||m.status!=='Opened WhatsApp')return;m.status='Pending';delete m.sentAt;save();const details=messageDraft;closeShade();openMessages(details.phone,details.name,details.context,'','',details.source);}
  function renderPeriodReport(){
    const period=window._reportPeriod||'day',selected=window._reportDate||today();
    const selectedDate=new Date(selected+'T00:00:00Z');
    const weekStart=new Date(selectedDate);weekStart.setUTCDate(weekStart.getUTCDate()-weekStart.getUTCDay());
    const weekEnd=new Date(weekStart);weekEnd.setUTCDate(weekEnd.getUTCDate()+7);
    const inPeriod=d=>{if(!d)return false;if(period==='day')return d===selected;if(period==='month')return d.slice(0,7)===selected.slice(0,7);const date=new Date(d+'T00:00:00Z');return date>=weekStart&&date<weekEnd;};
    const orders=[...DB.walkins.filter(o=>o.status!=='Enquiry'),...DB.events].filter(o=>inPeriod(o.date));
    const expenses=DB.expenses.filter(e=>inPeriod(e.date));
    const sales=money(orders.reduce((n,o)=>n+(Number(o.amount)||0),0));
    const received=money(orders.reduce((n,o)=>n+(Number(o.advance)||0),0));
    const cost=money(expenses.reduce((n,e)=>n+(Number(e.amount)||0),0));
    const count=new Map();
    orders.filter(o=>DB.walkins.includes(o)).forEach(o=>{(o.items?.length?o.items:[{name:o.service||'Other',quantity:1}]).forEach(x=>count.set(x.name,(count.get(x.name)||0)+(Number(x.quantity)||1)));});
    const top=[...count].sort((a,b)=>b[1]-a[1]).slice(0,5);
    return `<div class="business-card" style="margin-bottom:14px"><h3>Date-wise / Weekly / Monthly</h3><div class="business-actions"><select class="fsel" onchange="window._reportPeriod=this.value;window.render()"><option value="day" ${period==='day'?'selected':''}>Day</option><option value="week" ${period==='week'?'selected':''}>Week</option><option value="month" ${period==='month'?'selected':''}>Month</option></select><input class="sinp" type="date" value="${esc(selected)}" onchange="window._reportDate=this.value;window.render()"></div><div class="stats"><div class="sc"><div class="sc-lbl">Orders</div><div class="sc-val">${orders.length}</div></div><div class="sc"><div class="sc-lbl">Sales</div><div class="sc-val g">${fmtINR(sales)}</div></div><div class="sc"><div class="sc-lbl">Received</div><div class="sc-val">${fmtINR(received)}</div></div><div class="sc"><div class="sc-lbl">Expenses</div><div class="sc-val r">${fmtINR(cost)}</div></div><div class="sc"><div class="sc-lbl">Sales less expenses</div><div class="sc-val">${fmtINR(sales-cost)}</div></div></div><div class="wf-help">Top services: ${top.length?top.map(([name,n])=>esc(name)+' ('+n+')').join(', '):'No sales in this period'}</div></div>`;
  }
  return {renderCatalogue,editProduct,saveProduct,toggleProduct,renderPOS,setCategory,setSearch,addItem,openCustomService,saveCustomService,quantity,removeItem,overridePrice,updatePOS,setCustomer,saveBill,printBill,printBillAgain,openBillReview,renderJobs,openJob,saveJob,updateJob,renderQuotes,openQuote,saveQuote,convertQuote,printQuote,openMessages,chooseTemplate,openWhatsApp,markMessageSent,resetMessage,posGuest,totals,calculateBill,renderPeriodReport};
})();
function posGuest(key,value){StudioBusiness.posGuest(key,value);}
