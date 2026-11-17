const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

function makeModule(){
  const items=new Map(),requests=[];
  const feeds={
    2027:{license:'CC BY 4.0',description:'All 2 wedding dates of 2027 for Delhi',rows:[
      {date:'2027-02-10',window_start_ist:'2027-02-10 07:03',window_end_ist:'2027-02-10 14:46',nakshatra:'Uttara Bhadrapada',tithi:'Chaturthi'},
      {date:'2027-02-10',window_start_ist:'2027-02-11 03:05',window_end_ist:'2027-02-11 07:02',nakshatra:'<script>',tithi:'Panchami'},
      {date:'2027-02-11',window_start_ist:'2027-02-11 07:02',window_end_ist:'2027-02-11 23:33',nakshatra:'Revati',tithi:'Panchami'}
    ]},
    2026:{license:'CC BY 4.0',description:'The 11 wedding dates left in 2026 after Dev Uthani Ekadashi',rows:[
      {date:'2026-11-21',window_start_ist:'2026-11-21 06:48',window_end_ist:'2026-11-22 00:13',nakshatra:'Revati',tithi:'Dwadashi'}
    ]}
  };
  const context={Date,Map,Number,String,Promise,JSON,RegExp,Math,URL,
    localStorage:{getItem:key=>items.get(key)||null,setItem:(key,value)=>items.set(key,value)},
    fetch:async url=>{requests.push(url);const year=Number(url.match(/-(\d{4})\.json$/)?.[1]);return feeds[year]?{ok:true,json:async()=>feeds[year]}:{ok:false,status:404};},
    DB:{events:[{eventDate:'2027-02-10',status:'New Order'}]},
    StudioBusiness:{openQuote(){},convertQuote(){}},
    window:{render(){}},curTab:'dash'
  };
  vm.createContext(context);
  const source=fs.readFileSync(path.join(__dirname,'..','vivah-muhurat.js'),'utf8');
  vm.runInContext(source+'\n;globalThis.moduleUnderTest=VivahMuhurat;',context);
  return {module:context.moduleUnderTest,requests,items};
}

test('year feed preserves overnight windows, distinct monthly counts and source credit',async()=>{
  const {module:vivah,requests}=makeModule();
  await vivah.loadYear(2027);
  const info=vivah.status('2027-02-10');
  assert.equal(info.kind,'shubh');
  assert.equal(info.windows.length,2);
  assert.match(vivah.calendarPanel(2027,2),/2 listed Shubh Vivah dates/);
  assert.match(vivah.alertHtml('2027-02-10'),/1 existing studio booking/);
  assert.match(vivah.alertHtml('2027-02-10'),/03:05 IST, 11 Feb 2027/);
  assert.match(vivah.alertHtml('2027-02-10'),/MyKundli/);
  assert.match(vivah.alertHtml('2027-02-10'),/CC BY 4.0/);
  assert.doesNotMatch(vivah.alertHtml('2027-02-10'),/<script>/);
  assert.equal(requests.length,1);
});

test('partial and unpublished years never invent auspicious status or reasons',async()=>{
  const {module:vivah,requests}=makeModule();
  await vivah.loadYear(2026);
  assert.equal(vivah.status('2026-11-10').kind,'unknown');
  assert.equal(vivah.status('2026-11-22').kind,'not-listed');
  assert.equal(vivah.status('2026-11-21').kind,'shubh');
  assert.match(vivah.alertHtml('2026-11-22'),/no specific inauspicious reason/i);
  assert.equal(vivah.status('2027-02-30').kind,'invalid');
  await vivah.loadYear(2028);
  assert.equal(vivah.status('2028-04-01').kind,'unavailable');
  vivah.calendarPanel(2028,4);
  vivah.calendarPanel(2028,4);
  assert.equal(requests.filter(url=>url.includes('2028')).length,1);
});
