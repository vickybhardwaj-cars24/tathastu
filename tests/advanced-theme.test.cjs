const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

function boot(){
  const values=new Map([['customer-records','KEEP-EXISTING-DATA']]);
  const localStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
  const styleProps=new Map();
  const document={body:{classList:{toggle(){}},style:{setProperty:(k,v)=>styleProps.set(k,v),removeProperty:k=>styleProps.delete(k),zoom:''}},
    head:{appendChild(el){el.isConnected=true}},getElementById(){return null},querySelector(){return null},createElement(){return {id:'',textContent:'',isConnected:false}}};
  const ctx={document,localStorage,structuredClone,Date,console,setInterval(){},requestAnimationFrame(){},confirm(){return true},alert(m){throw Error(m)}};
  ctx.window=ctx;ctx.render=()=>{};
  vm.createContext(ctx);
  for(const file of ['appearance.js','advanced-theme.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx,{filename:file});
  return {ctx,values,appearance:vm.runInContext('Appearance',ctx),advanced:ctx.AdvancedAppearance};
}

test('custom themes can be saved, deleted and restored without touching other data',()=>{
  const {values,appearance,advanced}=boot();
  advanced.change('name','name','My Studio');
  advanced.change('base','primary','#123456');
  advanced.save(true);
  const key=appearance.settings.theme;
  assert.match(key,/^custom-\d+$/);
  assert.equal(appearance.settings.customPresets[0].colors[0],'#123456');
  advanced.remove('dark');
  assert.equal(appearance.settings.customPresets.length,1,'system theme cannot be deleted');
  advanced.remove(key);
  assert.equal(appearance.settings.theme,'dark');
  assert.equal(appearance.settings.customPresets.length,0);
  assert.equal(JSON.parse(values.get('tw_appearance_trash_v1'))[0].key,key);
  advanced.restore(key);
  assert.equal(appearance.settings.customPresets[0].name,'My Studio');
  assert.equal(values.get('customer-records'),'KEEP-EXISTING-DATA');
});
