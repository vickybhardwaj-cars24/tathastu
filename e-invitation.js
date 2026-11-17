/* Tathastu E-Invitation Studio, phase 1. Projects are separate from orders and billing. */
const EInvitationStudio = (() => {
  const groups = [
    {key:'wedding',label:'Wedding & Marriage',icon:'💍',types:['Wedding Invitation','Save The Date','Engagement / Ring Ceremony','Roka / Sagai','Haldi','Mehndi','Sangeet','Cocktail Party','Wedding Reception','Tilak Ceremony','Baraat Invitation','Destination Wedding','Anniversary Celebration']},
    {key:'birthday',label:'Birthday & Celebrations',icon:'🎉',types:['Birthday Invitation','Kids Birthday','1st Birthday','18th Birthday','21st Birthday','25th Birthday','50th Birthday','Surprise Party','Anniversary','Retirement Party','Graduation Party']},
    {key:'family',label:'Baby & Family',icon:'🧸',types:['Baby Shower / Godh Bharai','Baby Welcome','Naming Ceremony','Mundan Ceremony','Annaprashan','Housewarming / Griha Pravesh','Family Get-together','Reunion Party']},
    {key:'religious',label:'Religious & Traditional',icon:'🪔',types:['Jagran','Mata Ki Chowki','Kirtan','Sunderkand Path','Bhagwat Katha','Ramayan Path','Satyanarayan Katha','Ganesh Chaturthi','Navratri Celebration','Diwali Celebration','Holi Celebration','Eid Celebration','Gurpurab','Christmas Celebration','Other Pooja & Religious Events']},
    {key:'corporate',label:'Corporate & Professional',icon:'🏢',types:['Business Opening','Shop / Studio Inauguration','Grand Opening','Corporate Party','Product Launch','Award Ceremony','Conference','Seminar','Business Meeting','Networking Event']},
    {key:'special',label:'Other Special Events',icon:'✨',types:['Farewell Party','Welcome Party','Bachelor Party','Bachelorette Party',"Valentine's Day",'Festival Celebrations','School / College Events','Cultural Programs','Stage Shows','Custom Event']}
  ];
  const styles = [
    {key:'royal',label:'Royal Gold',bg:'#241727',ink:'#fff2da',accent:'#e9bb72',muted:'#d4bfa8',ornament:'✦',font:'Georgia,serif'},
    {key:'floral',label:'Floral Blush',bg:'#fff1ee',ink:'#603947',accent:'#a65068',muted:'#81636d',ornament:'❀',font:'Georgia,serif'},
    {key:'pastel',label:'Soft Pastel',bg:'#edf5f0',ink:'#234a42',accent:'#558a78',muted:'#5d766e',ornament:'✿',font:'Georgia,serif'},
    {key:'minimal',label:'Modern Minimal',bg:'#f7f6f2',ink:'#1e2d39',accent:'#526c87',muted:'#63717b',ornament:'◆',font:'Arial,sans-serif'},
    {key:'festive',label:'Festive Marigold',bg:'#fff5dc',ink:'#5b2c22',accent:'#ae5b21',muted:'#805b46',ornament:'✺',font:'Georgia,serif'},
    {key:'midnight',label:'Midnight Luxe',bg:'#102633',ink:'#f1f4f3',accent:'#8ed4d0',muted:'#bdcfce',ornament:'✧',font:'Georgia,serif'}
  ];
  const recommended = {wedding:['royal','floral','pastel','midnight'],birthday:['festive','pastel','midnight','floral'],family:['pastel','floral','festive','minimal'],religious:['festive','royal','floral','pastel'],corporate:['minimal','midnight','royal','pastel'],special:['midnight','festive','floral','minimal']};
  const state = {screen:'library',filter:'all',draft:null,index:-1,showArchived:false};
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const phone = value => String(value||'').replace(/\D/g,'').replace(/^91(?=\d{10}$)/,'');
  const category = key => groups.find(group=>group.key===key)||groups[5];
  const design = key => styles.find(style=>style.key===key)||styles[0];
  const options = (items,selected) => items.map(item=>`<option value="${esc(item)}" ${item===selected?'selected':''}>${esc(item)}</option>`).join('');
  const newFunction = (name='',date='',venue='') => ({name,date,time:'',venue});
  function fresh(){return {id:'',source:'',category:'wedding',type:'Wedding Invitation',customType:'',template:'royal',host:'',family:'',phone:'',email:'',date:'',time:'',venue:'',address:'',message:'Your presence will make our celebration even more special.',functions:[],createdAt:'',updatedAt:''};}
  function all(){return Array.isArray(DB.invitations)?DB.invitations:[];}
  function sourceOptions(selected=''){
    const entries=[['','Start with blank details'],...DB.events.map((event,i)=>['event:'+i,`Event · ${event.name||'Unnamed'} · ${event.eventType||'Event'} · ${event.eventDate||''}`]),...DB.quotes.filter(q=>!q.deletedAt).map(q=>['quote:'+DB.quotes.indexOf(q),`Quotation · ${q.customerName||'Unnamed'} · ${q.weddingDate||''}`]),...DB.customers.map((customer,i)=>['customer:'+i,`Customer · ${customer.name||'Unnamed'} · ${customer.phone||''}`])];
    return entries.map(([key,label])=>`<option value="${esc(key)}" ${key===selected?'selected':''}>${esc(label)}</option>`).join('');
  }
  function matchCustomer(name,number){return DB.customers.find(c=>number&&phone(c.phone)===phone(number))||DB.customers.find(c=>name&&c.name?.toLowerCase()===name.toLowerCase());}
  function inferCategory(type){const value=String(type||'').toLowerCase();if(/wedding|vivah|haldi|mehndi|sangeet|sagai|engagement|reception|roka|baraat/.test(value))return 'wedding';if(/birth|anniversary|graduation|retirement/.test(value))return 'birthday';if(/baby|maternity|shower|griha|house|naming|mundan/.test(value))return 'family';if(/jagran|chowki|kirtan|pooja|puja|path|katha|diwali|holi|eid|gurpurab/.test(value))return 'religious';if(/corporate|business|launch|conference|seminar|studio|inauguration/.test(value))return 'corporate';return 'special';}
  function fromSource(ref){
    const [kind,raw]=String(ref||'').split(':');const i=Number(raw);if(!Number.isInteger(i)||i<0)return null;
    const item=kind==='event'?DB.events[i]:kind==='quote'?DB.quotes[i]:kind==='customer'?DB.customers[i]:null;if(!item)return null;
    const draft=fresh();draft.source=ref;
    const name=kind==='quote'?item.customerName:item.name;
    draft.host=name||'';draft.phone=item.phone||'';
    const customer=kind==='customer'?item:matchCustomer(name,draft.phone);
    draft.address=customer?.address||'';draft.email=customer?.email||'';draft.family=customer?.familyMembers||'';
    if(kind==='customer')return draft;
    const eventType=kind==='quote'?'Wedding Invitation':item.eventType||'Custom Event';
    draft.category=inferCategory(eventType);
    const aliases={'wedding':'Wedding Invitation','birthday shoot':'Birthday Invitation','sagai':'Roka / Sagai','ring ceremony':'Engagement / Ring Ceremony','chowki':'Mata Ki Chowki','baby shoot':'Baby Welcome'};
    draft.type=category(draft.category).types.find(t=>t.toLowerCase()===eventType.toLowerCase())||aliases[eventType.toLowerCase()]||category(draft.category).types[0];
    if(draft.category==='special'&&draft.type==='Custom Event')draft.customType=eventType;
    draft.template=recommended[draft.category][0];
    draft.date=kind==='quote'?item.weddingDate||'':item.eventDate||'';
    draft.time=item.eventTime||'';draft.venue=item.venue||'';
    if(kind==='event'){
      draft.functions=(item.functions||[]).filter(f=>f.name&&f.date).map(f=>newFunction(f.name,f.date,f.venue||''));
      if(!draft.functions.length)draft.functions=[newFunction(item.eventType||'Event',item.eventDate||'',item.venue||''),...(item.extraDates||[]).map((date,j)=>newFunction('Function '+(j+2),date,(item.extraVenues||[])[j]||''))].filter(f=>f.date);
    }else{
      draft.functions=(item.functions||[]).map(f=>typeof f==='string'?newFunction(f,draft.date,''):newFunction(f.name||'',addDays(draft.date,Number(f.offsetDays)||0),'')).filter(f=>f.name);
    }
    return draft;
  }
  function addDays(date,offset){if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return date||'';const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10);}
  function openNew(ref=''){state.draft=ref?fromSource(ref)||fresh():fresh();state.index=-1;state.screen='editor';window.render();}
  function openFromSource(ref){if(typeof closeShade==='function')closeShade();go('invitations',document.getElementById('tab-invitations'));openNew(ref);}
  function openSaved(index){const record=all()[index];if(!record)return;state.draft=structuredClone(record);state.index=index;state.screen='editor';window.render();}
  function back(){state.draft=null;state.index=-1;state.screen='library';window.render();}
  function chooseSource(ref){if(!ref){state.draft=fresh();state.index=-1;}else{state.draft=fromSource(ref)||fresh();state.index=-1;}window.render();}
  function setCategory(key){if(!groups.some(g=>g.key===key))return;const d=state.draft;d.category=key;d.type=category(key).types[0];d.customType='';d.template=recommended[key][0];window.render();}
  function setType(type){state.draft.type=category(state.draft.category).types.includes(type)?type:category(state.draft.category).types[0];window.render();}
  function setTemplate(key){if(!styles.some(style=>style.key===key))return;state.draft.template=key;window.render();}
  function field(key,value){if(!state.draft||!['customType','host','family','phone','email','date','time','venue','address','message'].includes(key))return;state.draft[key]=String(value).slice(0,key==='message'?1200:250);refreshPreview();}
  function functionField(index,key,value){const f=state.draft?.functions?.[index];if(!f||!['name','date','time','venue'].includes(key))return;f[key]=String(value).slice(0,250);refreshPreview();}
  function addFunction(){state.draft.functions.push(newFunction());window.render();}
  function removeFunction(index){state.draft.functions.splice(index,1);window.render();}
  function actualType(d){return d.type==='Custom Event'?(d.customType.trim()||'Custom Event'):d.type;}
  function prettyDate(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return 'Date to be confirmed';const d=new Date(value+'T12:00:00Z');return Number.isNaN(d.getTime())?'Date to be confirmed':new Intl.DateTimeFormat('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(d);}
  function card(d){
    const t=design(d.template);const funcs=(d.functions||[]).filter(f=>f.name||f.date||f.venue);
    return `<article class="ei-card" style="--ei-bg:${t.bg};--ei-ink:${t.ink};--ei-accent:${t.accent};--ei-muted:${t.muted};--ei-font:${t.font}"><div class="ei-card-top">TATHASTU <span>✦</span> E-INVITATION STUDIO</div><div class="ei-ornament">${t.ornament} ${t.ornament} ${t.ornament}</div><div class="ei-overline">You are warmly invited to</div><h2>${esc(actualType(d))}</h2><div class="ei-divider"></div><h3>${esc(d.host||'Your name here')}</h3>${d.family?`<p class="ei-family">With ${esc(d.family)}</p>`:''}<p class="ei-message">${esc(d.message||'Join us for a memorable celebration.')}</p><div class="ei-details"><b>${esc(prettyDate(d.date))}</b>${d.time?`<span>${esc(d.time)}</span>`:''}<span>${esc(d.venue||'Venue to be confirmed')}</span>${d.address?`<span>${esc(d.address)}</span>`:''}</div>${funcs.length?`<div class="ei-schedule"><strong>CELEBRATION SCHEDULE</strong>${funcs.map(f=>`<div><b>${esc(f.name||'Function')}</b><span>${esc(prettyDate(f.date))}${f.time?' · '+esc(f.time):''}${f.venue?' · '+esc(f.venue):''}</span></div>`).join('')}</div>`:''}<div class="ei-card-bottom">${d.phone?'RSVP · '+esc(d.phone):'We look forward to celebrating with you'}${d.email?' · '+esc(d.email):''}</div></article>`;
  }
  function refreshPreview(){const target=document.getElementById('ei-preview');if(target&&state.draft)target.innerHTML=card(state.draft);}
  function attachActions(){const head=document.querySelector('.ei-preview-head');if(!head||!state.draft)return;head.insertAdjacentHTML('beforeend','<div class="business-actions"><button class="btn btn-o btn-sm" onclick="EInvitationStudio.exportImage(\'png\')">PNG</button><button class="btn btn-o btn-sm" onclick="EInvitationStudio.exportImage(\'jpeg\')">JPG</button><button class="btn btn-o btn-sm" onclick="EInvitationStudio.printCard()">Print / PDF</button></div>');}
  function drawCard(d){
    const t=design(d.template),functions=(d.functions||[]).filter(f=>f.name||f.date||f.venue);
    const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=Math.max(1600,1290+functions.length*105);
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Image export is unavailable in this browser');
    const W=canvas.width,H=canvas.height;ctx.fillStyle=t.bg;ctx.fillRect(0,0,W,H);
    ctx.strokeStyle=t.accent;ctx.lineWidth=3;ctx.strokeRect(28,28,W-56,H-56);ctx.lineWidth=1;ctx.strokeRect(44,44,W-88,H-88);
    ctx.textAlign='center';ctx.textBaseline='middle';
    function line(text,y,font,color,max=1000){ctx.font=font;ctx.fillStyle=color;ctx.fillText(String(text||''),W/2,y,max);}
    function wrap(text,font,maxWidth){ctx.font=font;const words=String(text||'').split(/\s+/),lines=[];let current='';for(const word of words){const next=current?current+' '+word:word;if(ctx.measureText(next).width<=maxWidth){current=next;continue;}if(current)lines.push(current);current=word;if(ctx.measureText(current).width>maxWidth){let part='';for(const char of word){if(ctx.measureText(part+char).width>maxWidth&&part){lines.push(part);part='';}part+=char;}current=part;}}if(current)lines.push(current);return lines;}
    function block(text,y,font,color,width=980,leading=62,maxLines=6){const lines=wrap(text,font,width).slice(0,maxLines);for(const row of lines){line(row,y,font,color,width);y+=leading;}return y;}
    line('TATHASTU  ✦  E-INVITATION STUDIO',112,'25px Arial',t.accent);
    line(t.ornament+'   '+t.ornament+'   '+t.ornament,260,'64px Georgia',t.accent);
    line('YOU ARE WARMLY INVITED TO',350,'25px Georgia',t.muted);
    let y=block(actualType(d),430,'68px '+t.font,t.accent,1000,72,3);
    ctx.fillStyle=t.accent;ctx.fillRect(510,y+12,180,2);y+=92;
    y=block(d.host||'Your name here',y,'64px '+t.font,t.ink,1000,70,3);
    if(d.family)y=block('With '+d.family,y+2,'30px '+t.font,t.muted,960,40,2);
    y=block(d.message||'Join us for a memorable celebration.',y+50,'32px '+t.font,t.ink,950,46,5)+28;
    line(prettyDate(d.date),y,'bold 36px '+t.font,t.accent);y+=58;
    if(d.time){line(d.time,y,'30px '+t.font,t.ink);y+=45;}
    y=block(d.venue||'Venue to be confirmed',y,'31px '+t.font,t.ink,960,42,3);
    if(d.address)y=block(d.address,y,'27px '+t.font,t.muted,960,37,3);
    if(functions.length){y+=40;ctx.fillStyle=t.accent;ctx.fillRect(115,y,970,2);y+=38;line('CELEBRATION SCHEDULE',y,'24px Arial',t.accent);y+=53;for(const f of functions){const detail=[prettyDate(f.date),f.time,f.venue].filter(Boolean).join(' · ');line(f.name||'Function',y,'bold 29px '+t.font,t.ink,960);y+=34;line(detail,y,'24px '+t.font,t.muted,960);y+=70;}ctx.fillRect(115,y,970,2);}
    line(d.phone?'RSVP · '+d.phone:'We look forward to celebrating with you',H-120,'27px Arial',t.muted,1050);
    if(d.email)line(d.email,H-75,'23px Arial',t.muted,1050);
    return canvas;
  }
  function fileName(d){const slug=String(d.host||'event').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40);return 'tathastu-invitation-'+(slug||'event');}
  function exportImage(format){if(!state.draft)return;let canvas;try{canvas=drawCard(state.draft);}catch(error){alert(error.message);return;}const mime=format==='jpeg'?'image/jpeg':'image/png';canvas.toBlob(blob=>{if(!blob){alert('Image export failed. Please try again.');return;}const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=fileName(state.draft)+(format==='jpeg'?'.jpg':'.png');document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);},mime,0.94);}
  function printCard(){if(state.draft)window.print();}
  function editor(){const d=state.draft,g=category(d.category),available=recommended[g.key];return `<div class="shdr"><div><div class="stitle">${state.index<0?'Create':'Edit'} E-Invitation</div><div class="ssub">Auto-fill from a booking, quotation or customer, then edit every detail.</div></div><div class="business-actions"><button class="btn btn-o btn-sm" onclick="EInvitationStudio.back()">← Library</button><button class="btn btn-g btn-sm" onclick="EInvitationStudio.saveProject()">Save Project</button></div></div><div class="ei-layout"><div class="ei-editor"><div class="business-card"><h3>1 · Start with existing details</h3><div class="ff"><label>Import from</label><select onchange="EInvitationStudio.chooseSource(this.value)">${sourceOptions(d.source)}</select></div><p class="wf-help">Import fills available details. You can edit them before saving; the original booking and customer stay unchanged.</p></div><div class="business-card"><h3>2 · Occasion & design</h3><div class="business-grid"><div class="ff"><label>Category</label><select onchange="EInvitationStudio.setCategory(this.value)">${groups.map(group=>`<option value="${group.key}" ${group.key===d.category?'selected':''}>${esc(group.label)}</option>`).join('')}</select></div><div class="ff"><label>Function</label><select onchange="EInvitationStudio.setType(this.value)">${options(g.types,d.type)}</select></div></div>${d.type==='Custom Event'?`<div class="ff mt8"><label>Custom function name</label><input value="${esc(d.customType)}" oninput="EInvitationStudio.field('customType',this.value)" placeholder="Your function name"></div>`:''}<div class="ei-templates">${available.map(key=>{const t=design(key);return `<button class="ei-template ${d.template===key?'selected':''}" style="--tile-bg:${t.bg};--tile-accent:${t.accent}" onclick="EInvitationStudio.setTemplate('${key}')"><span>${t.ornament}</span><b>${esc(t.label)}</b></button>`;}).join('')}</div><details><summary>More design styles</summary><div class="ei-templates">${styles.filter(t=>!available.includes(t.key)).map(t=>`<button class="ei-template ${d.template===t.key?'selected':''}" style="--tile-bg:${t.bg};--tile-accent:${t.accent}" onclick="EInvitationStudio.setTemplate('${t.key}')"><span>${t.ornament}</span><b>${esc(t.label)}</b></button>`).join('')}</div></details></div><div class="business-card"><h3>3 · Invitation details</h3><div class="business-grid">${input('host','Name / host',d.host)}${input('family','Family members (optional)',d.family)}${input('date','Main date',d.date,'date')}${input('time','Time (optional)',d.time,'time')}${input('venue','Venue',d.venue)}${input('address','Address (optional)',d.address)}${input('phone','RSVP phone (optional)',d.phone,'tel')}${input('email','RSVP email (optional)',d.email,'email')}</div><div class="ff mt8"><label>Invitation message</label><textarea rows="3" oninput="EInvitationStudio.field('message',this.value)">${esc(d.message)}</textarea></div></div><div class="business-card"><div class="shdr"><div><h3>4 · Multiple functions</h3><p class="wf-help">Imported booking functions appear here. Add or remove any function for this invitation.</p></div><button class="btn btn-o btn-sm" onclick="EInvitationStudio.addFunction()">+ Function</button></div>${d.functions.map((f,i)=>`<div class="ei-function"><div class="business-grid">${functionInput(i,'name','Function name',f.name)}${functionInput(i,'date','Date',f.date,'date')}${functionInput(i,'time','Time',f.time,'time')}${functionInput(i,'venue','Venue',f.venue)}</div><button class="btn btn-d btn-sm" onclick="EInvitationStudio.removeFunction(${i})">Remove</button></div>`).join('')||'<p class="wf-help">No extra functions yet.</p>'}</div><button class="btn btn-g" onclick="EInvitationStudio.saveProject()">Save Invitation Project</button></div><div class="ei-preview-wrap"><div class="ei-preview-head"><b>Live preview</b><span>${esc(design(d.template).label)}</span></div><div id="ei-preview">${card(d)}</div><p class="wf-help">Export a PNG or JPG image, or use Print / PDF to save a PDF. Video and public website invitations are planned for later phases.</p></div></div>`;}
  function input(key,label,value,type='text'){return `<div class="ff"><label>${esc(label)}</label><input type="${type}" value="${esc(value)}" oninput="EInvitationStudio.field('${key}',this.value)"></div>`;}
  function functionInput(i,key,label,value,type='text'){return `<div class="ff"><label>${esc(label)}</label><input type="${type}" value="${esc(value)}" oninput="EInvitationStudio.functionField(${i},'${key}',this.value)"></div>`;}
  function library(){const records=all().map((record,index)=>({...record,_index:index})).filter(record=>state.showArchived?!!record.archivedAt:!record.archivedAt).filter(record=>state.filter==='all'||record.category===state.filter).sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||''));return `<div class="shdr"><div><div class="stitle">Tathastu E-Invitation Studio</div><div class="ssub">Create an invitation for any celebration using your existing studio records.</div></div><button class="btn btn-g btn-sm" onclick="EInvitationStudio.openNew()">+ New Invitation</button></div><div class="ei-category-grid">${groups.map(group=>`<button class="ei-category ${state.filter===group.key?'selected':''}" onclick="EInvitationStudio.filter('${group.key}')"><span>${group.icon}</span><b>${esc(group.label)}</b><small>${group.types.length} function types · ${recommended[group.key].length} designs</small></button>`).join('')}</div><div class="business-card"><div class="shdr"><div><h3>Saved projects</h3><p class="wf-help">Projects are stored separately from quotations, billing and bookings.</p></div><div class="business-actions"><button class="btn btn-o btn-sm" onclick="EInvitationStudio.filter('all')">All categories</button><button class="btn btn-o btn-sm" onclick="EInvitationStudio.toggleArchived()">${state.showArchived?'Active':'Archived'} projects</button></div></div>${records.length?`<div class="ei-projects">${records.map(record=>`<div class="ei-project"><div><span class="ei-project-icon">${category(record.category).icon}</span><b>${esc(record.host||'Untitled')}</b><small>${esc(actualType(record))} · ${esc(record.date||'Date pending')} · ${esc(design(record.template).label)}${record.version?' · Version '+record.version:''}</small></div><div class="business-actions"><button class="btn btn-o btn-sm" onclick="EInvitationStudio.openSaved(${record._index})">Edit</button>${record.archivedAt?`<button class="btn btn-o btn-sm" onclick="EInvitationStudio.restore(${record._index})">Restore</button>`:`<button class="btn btn-o btn-sm" onclick="EInvitationStudio.duplicate(${record._index})">New version</button><button class="btn btn-d btn-sm" onclick="EInvitationStudio.archive(${record._index})">Archive</button>`}</div></div>`).join('')}</div>`:'<div class="empty">No projects in this view. Choose a category or create your first invitation.</div>'}</div>`;}
  function render(){return state.screen==='editor'&&state.draft?editor():library();}
  function filter(key){state.filter=key;window.render();}
  function toggleArchived(){state.showArchived=!state.showArchived;window.render();}
  function saveProject(){const d=state.draft;if(!d)return;if(!d.host.trim()||!d.date){alert('Add a name and main date before saving the invitation.');return;}if(d.type==='Custom Event'&&!d.customType.trim()){alert('Enter the custom function name.');return;}const now=new Date().toISOString();const previous=state.index>=0?all()[state.index]:null;const record={...structuredClone(d),id:previous?.id||'invite-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),createdAt:previous?.createdAt||now,updatedAt:now};if(state.index>=0)DB.invitations[state.index]=record;else DB.invitations.push(record);save();back();}
  function duplicate(index){const original=all()[index];if(!original)return;state.draft={...structuredClone(original),id:'',source:original.source||'',version:(Number(original.version)||1)+1,parentId:original.parentId||original.id,createdAt:'',updatedAt:'',archivedAt:null};state.index=-1;state.screen='editor';window.render();}
  function archive(index){const record=all()[index];if(!record||!confirm('Archive this invitation project? It can be restored later.'))return;record.archivedAt=new Date().toISOString();save();window.render();}
  function restore(index){const record=all()[index];if(!record)return;delete record.archivedAt;save();window.render();}
  return {groups,styles,recommended,render,card,fromSource,openNew,openFromSource,openSaved,back,chooseSource,setCategory,setType,setTemplate,field,functionField,addFunction,removeFunction,saveProject,duplicate,archive,restore,filter,toggleArchived,attachActions,exportImage,printCard};
})();
