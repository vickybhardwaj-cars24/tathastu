const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');

function boot(){
  const DB={walkins:[],events:[],quotes:[],customers:[],messages:[],messageConfig:null,googleReviewLink:''};
  const ctx={DB,URL,Date,Math,location:{href:'https://tathastuweddings.vercel.app/'},fmtINR:n=>'₹'+n,alert:()=>{}};
  vm.createContext(ctx);
  for(const name of ['smart-messaging.js','document-share.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',name),'utf8'),ctx);
  return {DB,share:vm.runInContext('DocumentShare',ctx),messaging:vm.runInContext('SmartMessaging',ctx)};
}

test('document messages use the matching customer and status rules',()=>{
  const {DB,share}=boot();
  DB.walkins.push({name:'Asha',phone:'9876543210',status:'New Order',service:'Photos'});
  DB.events.push({name:'Meera',phone:'9876543211',status:'Delivered',finalDelivered:false,eventType:'Wedding',advance:1000,balance:9000});
  DB.quotes.push({id:'Q1',customerName:'Riya',phone:'9876543212',status:'Booked'});
  const walkin=share.wording({kind:'walkin',index:0,type:'receipt',label:'Walk-in Receipt',number:'TW-1'});
  assert.equal(walkin.phone,'9876543210');
  assert.match(walkin.body,/instagram\.com/);
  assert.doesNotMatch(walkin.body,/g\.page\/r\//);
  DB.walkins[0].status='Delivered';
  assert.match(share.wording({kind:'walkin',index:0,type:'receipt',label:'Walk-in Receipt',number:'TW-1'}).body,/g\.page\/r\//);
  const event=share.wording({kind:'event',index:0,type:'receipt',label:'Event Receipt',number:'TW-E1'});
  assert.doesNotMatch(event.body,/g\.page\/r\//);
  const quote=share.wording({kind:'quote',index:0,type:'quotation',label:'Quotation',number:'Q1'});
  assert.equal(quote.phone,'9876543212');
  assert.match(quote.body,/instagram\.com/);
  assert.doesNotMatch(quote.body,/g\.page\/r\//);
});

test('advance and payment receipts never ask for reviews before final delivery',()=>{
  const {DB,share}=boot();
  DB.events.push({name:'Meera',phone:'',status:'New Order',eventType:'Wedding',advance:1000,balance:9000});
  for(const type of ['advance','payment']){
    const message=share.wording({kind:'event',index:0,type,label:'Payment Receipt',number:'P1',payment:1000,balance:9000});
    assert.equal(message.phone,'');
    assert.match(message.body,/₹1000/);
    assert.doesNotMatch(message.body,/g\.page\/r\//);
  }
  assert.equal(share.validPhone('98765 43210'),'919876543210');
  assert.equal(share.validPhone(''),'');
});

test('a review opened through a document blocks another request until reset',()=>{
  const {DB,share,messaging}=boot();
  DB.walkins.push({name:'Asha',phone:'9876543210',status:'Delivered',service:'Prints'});
  const draft=share.wording({kind:'walkin',index:0,type:'receipt',label:'Walk-in Receipt',number:'TW-1'});
  const prepared=messaging.prepare('walkin',0);
  DB.messages.push({phone:draft.phone,sourceId:prepared.sourceId,body:draft.body,reviewRequest:true,status:'Opened Share Sheet'});
  assert.equal(messaging.canOpen(draft.body,prepared),false);
  DB.messages[0].status='Not sent';
  assert.equal(messaging.canOpen(draft.body,prepared),true);
  DB.messages[0].status='Marked sent';
  assert.equal(messaging.prepare('walkin',0).stage,'walkinThanks');
});
