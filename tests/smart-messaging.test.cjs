const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');

function boot(){
  const alerts=[];
  const DB={walkins:[],events:[],quotes:[],customers:[],messages:[],messageConfig:null,googleReviewLink:''};
  const ctx={DB,URL,Date,Math,console,fmtINR:n=>'₹'+n,alert:m=>alerts.push(m)};
  ctx.window=ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','smart-messaging.js'),'utf8'),ctx);
  return {DB,alerts,messaging:vm.runInContext('SmartMessaging',ctx)};
}

test('enquiry, quotation and booking drafts never request a review',()=>{
  const {DB,messaging}=boot();
  DB.walkins.push({name:'Asha',phone:'9876543210',status:'Enquiry',service:'Portrait'});
  DB.quotes.push({id:'Q1',customerName:'Riya',phone:'9876543211',status:'Draft',weddingDate:'2027-02-14'});
  DB.events.push({name:'Meera',phone:'9876543212',status:'New Order',eventType:'Wedding',eventDate:'2027-03-01',advance:1000,balance:9000});
  for(const [kind,i] of [['walkin',0],['quote',0],['event',0]]){
    const p=messaging.prepare(kind,i);
    assert.equal(p.reviewAllowed,false);
    assert.doesNotMatch(p.template.body,/g\.page\/r\//);
    assert.match(p.template.body,/instagram\.com/);
  }
  assert.match(messaging.prepare('event',0).template.body,/₹1000/);
  assert.equal(messaging.canOpen(messaging.config().reviewLink,messaging.prepare('quote',0)),false);
  assert.equal(messaging.canOpen('Please leave a Google review',messaging.prepare('quote',0)),false);
});

test('review eligibility starts only after completed service or final event delivery',()=>{
  const {DB,messaging}=boot();
  const walkin={name:'Asha',phone:'9876543210',status:'Ready',service:'Passport photos'};
  const event={name:'Meera',phone:'9876543212',status:'Delivered',finalDelivered:false,eventType:'Wedding'};
  DB.walkins.push(walkin);DB.events.push(event);
  assert.equal(messaging.prepare('walkin',0).reviewAllowed,false);
  assert.equal(messaging.prepare('walkin',0).stage,'ready');
  assert.equal(messaging.prepare('event',0).reviewAllowed,false);
  walkin.status='Delivered';event.finalDelivered=true;
  assert.equal(messaging.prepare('walkin',0).reviewAllowed,true);
  assert.equal(messaging.prepare('event',0).reviewAllowed,true);
  assert.match(messaging.prepare('event',0).template.body,/g\.page\/r\//);
});

test('review requests are queued once and a sent request blocks another',()=>{
  const {DB,messaging}=boot();
  DB.messageConfig={autoPrepare:true};
  DB.walkins.push({name:'Asha',phone:'9876543210',status:'Delivered',service:'Prints'});
  DB.events.push({name:'Asha',phone:'9876543210',status:'Delivered',finalDelivered:true,eventType:'Wedding'});
  messaging.queueFor('walkin',0);
  messaging.queueFor('walkin',0);
  messaging.queueFor('event',0);
  assert.equal(DB.messages.length,1);
  DB.messages[0].status='Marked sent';
  assert.equal(messaging.prepare('event',0).stage,'eventThanks');
  assert.equal(messaging.canOpen(messaging.config().reviewLink,messaging.prepare('event',0)),false);
  assert.equal(DB.messages.length,1);
});

test('changing a booking stage supersedes an unsent draft',()=>{
  const {DB,messaging}=boot();
  DB.messageConfig={autoPrepare:true};
  const event={id:'E1',name:'Meera',phone:'9876543212',status:'New Order',eventType:'Wedding'};
  DB.events.push(event);
  messaging.queueFor('event',0);
  assert.equal(DB.messages[0].stage,'booking');
  event.status='In Progress';
  messaging.queueFor('event',0);
  assert.equal(DB.messages[0].status,'Superseded');
  assert.equal(DB.messages[1].stage,'progress');
});

test('custom Hindi template uses central links without changing business records',()=>{
  const {DB,messaging}=boot();
  const quote={id:'Q2',customerName:'Riya',phone:'9876543211',status:'Draft',weddingDate:'2027-02-14'};
  DB.quotes.push(quote);
  DB.messageConfig={reviewLink:'https://g.page/r/test/review',instagramLink:'https://www.instagram.com/teststudio/',language:'hi',templates:{quoteShare:{hi:'नमस्ते {name} — {instagram}'}}};
  assert.equal(messaging.prepare('quote',0).template.body,'नमस्ते Riya — https://www.instagram.com/teststudio/');
  assert.equal(DB.quotes[0],quote);
  assert.equal(DB.messages.length,0);
});

test('lost quotation gets a polite follow-up without a review request',()=>{
  const {DB,messaging}=boot();
  DB.quotes.push({id:'Q3',customerName:'Riya',phone:'9876543211',status:'Lost'});
  const p=messaging.prepare('quote',0);
  assert.equal(p.stage,'lost');
  assert.match(p.template.body,/instagram\.com/);
  assert.doesNotMatch(p.template.body,/g\.page\/r\//);
});
