const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

test('walk-in and event invoices do not invent an expiry date',()=>{
  const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  const start=html.indexOf('function showQuotation(type,idx){');
  const end=html.indexOf('/* ─── CUSTOMER NOTES',start);
  assert.ok(start>=0&&end>start);
  const output=[];
  const context={
    DB:{gstConfig:{taxRate:18,hsnCode:'998382',businessName:'Tathastu Weddings'},walkins:[{name:'Asha',phone:'9876543210',service:'Photo print',amount:750,advance:250,balance:500}],events:[{name:'Meera',phone:'9876543211',eventType:'Wedding',eventDate:'2027-02-14',amount:10000,advance:1000,balance:9000}]},
    today:()=> '2026-11-22',
    escapeWalkinText:value=>String(value),
    DocumentShare:{attach:()=>{}},
    window:{open:()=>({document:{write:value=>output.push(value),close:()=>{}}})}
  };
  vm.createContext(context);
  vm.runInContext(html.slice(start,end),context);
  for(const type of ['walkin','event']){
    output.length=0;
    vm.runInContext(`showQuotation('${type}',0)`,context);
    const invoice=output.join('');
    assert.match(invoice,/INVOICE/);
    assert.doesNotMatch(invoice,/valid until|confirm your booking/i);
  }
});

test('shared layout limits optional validity to unbooked wedding quotations',()=>{
  const context={URL,location:{href:'https://tathastuweddings.vercel.app/'}};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','print-layout.js'),'utf8'),context);
  const render=vm.runInContext('TathastuPrint.documentHTML',context);
  const data={number:'TW-1',date:'2026-11-22',customer:'Asha',total:750,validUntil:'2026-12-15'};
  for(const kind of ['Bill / Receipt','Invoice','Advance Receipt']){
    assert.doesNotMatch(render({...data,kind}),/Quotation valid until/);
  }
  assert.match(render({...data,kind:'Quotation'}),/Quotation valid until 2026-12-15/);
  assert.doesNotMatch(render({...data,kind:'Quotation',booked:true}),/Quotation valid until/);
});
