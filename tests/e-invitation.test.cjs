const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function studio(){
  let writes=0;
  const DB={
    invitations:[],
    events:[{id:'event-1',name:'Asha & Ravi',phone:'9876543210',eventType:'Wedding',eventDate:'2027-02-10',venue:'Main Hall',functions:[{name:'Haldi',date:'2027-02-08',venue:'Home'},{name:'Wedding',date:'2027-02-10',venue:'Main Hall'}]}],
    quotes:[{id:'quote-1',customerName:'Asha & Ravi',phone:'9876543210',weddingDate:'2027-02-10',functions:[{name:'Mehndi',offsetDays:-1},{name:'Wedding',offsetDays:0}]}],
    customers:[{name:'Asha & Ravi',phone:'9876543210',address:'New Delhi',email:'guest@example.com'}]
  };
  const context={DB,Date,Intl,Number,String,Math,JSON,structuredClone,window:{render(){}},document:{getElementById(){return null;}},save(){writes++;},alert(){throw new Error('Unexpected alert');},confirm(){return true;}};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','e-invitation.js'),'utf8')+'\n;globalThis.studio=EInvitationStudio;',context);
  return {studio:context.studio,DB,writes:()=>writes};
}

test('all function categories have several original template choices',()=>{
  const {studio:s}=studio();
  assert.equal(s.groups.length,6);
  for(const group of s.groups){assert.ok(group.types.length>=8);assert.ok(s.recommended[group.key].length>=4);}
  assert.ok(s.groups.some(group=>group.types.includes('Custom Event')));
});

test('event and quotation import preserve multiple functions without changing original data',()=>{
  const {studio:s,DB,writes}=studio();
  const before=structuredClone(DB);
  const event=s.fromSource('event:0');
  assert.equal(event.host,'Asha & Ravi');
  assert.equal(event.address,'New Delhi');
  assert.deepEqual(Array.from(event.functions,f=>f.name),['Haldi','Wedding']);
  assert.equal(event.functions[0].venue,'Home');
  const quote=s.fromSource('quote:0');
  assert.equal(quote.functions[0].date,'2027-02-09');
  assert.equal(quote.functions[1].date,'2027-02-10');
  assert.deepEqual(DB,before);
  assert.equal(writes(),0);
});

test('card escapes customer text and saving touches only invitation records',()=>{
  const {studio:s,DB,writes}=studio();
  const event=s.fromSource('event:0');
  event.host='<script>alert(1)</script>';
  assert.doesNotMatch(s.card(event),/<script>/);
  assert.match(s.card(event),/&lt;script&gt;/);
  s.openNew('event:0');
  s.saveProject();
  assert.equal(writes(),1);
  assert.equal(DB.invitations.length,1);
  assert.equal(DB.events[0].name,'Asha & Ravi');
  assert.equal(DB.quotes[0].customerName,'Asha & Ravi');
});
