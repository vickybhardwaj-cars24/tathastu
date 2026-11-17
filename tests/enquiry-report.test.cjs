const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

test('an unconfirmed enquiry does not inflate period sales or balances',()=>{
  const context={Date,Map,Number,String,Math,JSON,
    DB:{walkins:[
      {date:'2026-11-18',status:'Enquiry',service:'Estimate',amount:10000,advance:0,balance:10000},
      {date:'2026-11-18',status:'New Order',service:'Portrait',amount:500,advance:200,balance:300}
    ],events:[],expenses:[],catalogue:[]},
    window:{_reportPeriod:'day',_reportDate:'2026-11-18'},
    today:()=> '2026-11-18',fmtINR:n=>'₹'+n
  };
  vm.createContext(context);
  const source=fs.readFileSync(path.join(__dirname,'..','studio-business.js'),'utf8');
  vm.runInContext(source+'\n;globalThis.businessUnderTest=StudioBusiness;',context);
  const html=context.businessUnderTest.renderPeriodReport();
  assert.match(html,/Orders<\/div><div class="sc-val">1<\/div>/);
  assert.match(html,/Sales<\/div><div class="sc-val g">₹500<\/div>/);
  assert.match(html,/Received<\/div><div class="sc-val">₹200<\/div>/);
  assert.doesNotMatch(html,/₹10500|₹10000/);
});
