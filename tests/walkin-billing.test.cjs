const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function section(startText,endText){
  const start=html.indexOf(startText),end=html.indexOf(endText,start);
  assert.ok(start>=0&&end>start,`Missing ${startText}`);
  return html.slice(start,end);
}
function harness(){
  const fields=new Map(),alerts=[],writes=[];
  const field=(id,value='')=>fields.set(id,{value,style:{},required:false});
  for(const [id,value] of Object.entries({
    'f-date':'2026-11-26','f-name':'Asha','f-phone':'9876543210','f-svc':'__custom__','f-custom-svc':'Special photo retouching',
    'f-status':'New Order','f-rate':'999','f-discount':'12.5','f-discount-amt':'','f-amt':'','f-adv':'200','f-bal':'',
    'f-pay':'UPI','f-urg':'No','f-del':'','f-deltime':'','f-notes':'','f-gallery':'','f-watermark':'0','f-finaldel':'0'
  }))field(id,value);
  const DB={walkins:[],events:[]};
  const context={DB,Number,Math,Date,URL,location:{href:'https://tathastuweddings.vercel.app/'},
    document:{getElementById:id=>fields.get(id)},alert:text=>alerts.push(text),
    autoCreateCustomer:()=>{},SmartMessaging:{queueFor:()=>{}},save:()=>writes.push('save'),closeShade:()=>{},render:()=>{},today:()=> '2026-11-26',
    DocumentShare:{attach:()=>{}}};
  vm.createContext(context);
  vm.runInContext(section('function walkinPricing(rate,percent){','function setupWiCalc()'),context);
  return {context,DB,fields,alerts,writes};
}

test('walk-in discount preview and save use the same two-decimal final price',()=>{
  const {context,DB,fields,writes}=harness();
  vm.runInContext('calcBal()',context);
  assert.equal(fields.get('f-discount-amt').value,'124.88');
  assert.equal(fields.get('f-amt').value,'874.12');
  assert.equal(fields.get('f-bal').value,'674.12');
  vm.runInContext(section('function saveWi(){','function saveEv(){'),context);
  vm.runInContext('saveWi()',context);
  assert.equal(DB.walkins.length,1);
  assert.equal(DB.walkins[0].service,'Special photo retouching');
  assert.equal(DB.walkins[0].originalAmount,999);
  assert.equal(DB.walkins[0].discountPercent,12.5);
  assert.equal(DB.walkins[0].walkinDiscountAmount,124.88);
  assert.equal(DB.walkins[0].amount,874.12);
  assert.equal(DB.walkins[0].balance,674.12);
  assert.deepEqual(writes,['save']);
});

test('walk-in form rejects invalid discount, advance and empty custom service',()=>{
  const {context,fields,alerts}=harness();
  const form=vm.runInContext('walkinFormValues',context);
  fields.get('f-discount').value='101';
  assert.equal(form(),null);
  fields.get('f-discount').value='50';fields.get('f-adv').value='600';
  assert.equal(form(),null);
  fields.get('f-adv').value='0';fields.get('f-custom-svc').value='  ';
  assert.equal(form(),null);
  assert.equal(alerts.length,3);
});

test('walk-in receipt and invoice show the original rate and discount',()=>{
  const {context,DB}=harness();
  DB.walkins.push({name:'Asha',phone:'9876543210',service:'Special photo retouching',status:'New Order',date:'2026-11-26',originalAmount:999,discountPercent:12.5,walkinDiscountAmount:124.88,amount:874.12,advance:200,balance:674.12,payMode:'UPI'});
  DB.gstConfig={taxRate:18,hsnCode:'998382',businessName:'Tathastu Weddings'};
  const output=[];
  context.window={open:()=>({document:{write:value=>output.push(value),close:()=>{}}})};
  vm.runInContext(section('function printReceipt(idx){','/* ─── FORM HELPERS ─── */'),context);
  vm.runInContext(section('function showQuotation(type,idx){','/* ─── CUSTOMER NOTES / TIMELINE ─── */'),context);
  vm.runInContext('printReceipt(0)',context);
  const receipt=output.join('');
  assert.match(receipt,/Original Rate/);
  assert.match(receipt,/Discount \(12\.5%\)/);
  assert.match(receipt,/874\.12/);
  output.length=0;
  vm.runInContext("showQuotation('walkin',0)",context);
  const invoice=output.join('');
  assert.match(invoice,/Discount \(12\.5%\)/);
  assert.match(invoice,/999/);
  assert.match(invoice,/874\.12/);
  DB.walkins[0].service='<img src=x onerror=alert(1)>';
  output.length=0;
  vm.runInContext('printReceipt(0)',context);
  assert.match(output.join(''),/&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(output.join(''),/<img src=x onerror=alert\(1\)>/);
});

test('editing an older walk-in keeps its price and custom service',()=>{
  const {context,DB,fields}=harness();
  DB.walkins.push({name:'Asha',phone:'9876543210',service:'Hand-painted frame',date:'2026-11-20',status:'New Order',amount:450,advance:100,balance:350,extra:'keep'});
  context.WALKIN_SVC=['Passport Photos'];
  context.showAdd=()=>{};
  context.setTimeout=callback=>callback();
  const button={onclick:null};
  context.document.querySelector=selector=>selector==='#shade .mtitle'?{firstChild:{textContent:''}}:button;
  vm.runInContext(section('function editWi(i){','/* ─── EDIT EVENT ─── */'),context);
  vm.runInContext('editWi(0)',context);
  assert.equal(fields.get('f-svc').value,'__custom__');
  assert.equal(fields.get('f-custom-svc').value,'Hand-painted frame');
  assert.equal(fields.get('f-rate').value,450);
  assert.equal(fields.get('f-discount').value,0);
  assert.equal(fields.get('f-amt').value,'450.00');
  button.onclick();
  assert.equal(DB.walkins[0].service,'Hand-painted frame');
  assert.equal(DB.walkins[0].amount,450);
  assert.equal(DB.walkins[0].advance,100);
  assert.equal(DB.walkins[0].balance,350);
  assert.equal(DB.walkins[0].extra,'keep');
});
