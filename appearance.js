/* Appearance is local to each browser. Calendar notes are shared through DB. */
const Appearance=(()=>{
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const hex=v=>/^#[0-9a-f]{6}$/i.test(String(v||''))?v:null;
  const presets={
    dark:['Dark Mode','#c9a84c','#e8cc80','#0a0a0a','#f0ead8','#60a8e0'],
    light:['Light Mode','#a07820','#7a5c10','#f5f0e8','#1a1208','#2870b0'],
    gold:['Premium Gold','#c9a84c','#e8cc80','#15110a','#f7f0df','#d6a135'],
    bridal:['Wedding / Bridal','#b43161','#e6a9ba','#fff4f6','#371826','#b17324'],
    newyear:['New Year','#d6ad35','#fff0a3','#10182e','#f7f3e8','#51b8d4'],
    christmas:['Christmas','#b62635','#68b783','#10251e','#f3eee5','#d9aa42'],
    diwali:['Diwali','#e49c2e','#f2ce68','#251326','#fff2d8','#bd4da3'],
    dussehra:['Dussehra','#d77a28','#eebc62','#261b19','#fff4e6','#a84332'],
    holi:['Holi','#b334a6','#f19e48','#fff5f0','#302039','#39a6a5'],
    eid:['Eid','#168b70','#a8d5aa','#112a28','#eff7ed','#d7ac48'],
    gurpurab:['Gurpurab','#d49b36','#f4d891','#f8f5ec','#312617','#347fa1'],
    rakhi:['Raksha Bandhan','#b23e72','#e4a758','#fff5ed','#372233','#7359b5'],
    navratri:['Navratri','#bd3d53','#e7a743','#2c1226','#fff1e5','#664ab1'],
    independence:['Independence Day','#e88831','#65aa6a','#fffaf0','#22352d','#217a8a'],
    republic:['Republic Day','#d7832c','#5b9a65','#f3f7f6','#263840','#295a9f'],
    karwa:['Karwa Chauth','#a52c42','#e3ae65','#2b141a','#fff0e7','#d46b3e']
  };
  const fixedRules=[
    {id:'newyear',theme:'newyear',start:'01-01',end:'01-02',annual:true},
    {id:'republic',theme:'republic',start:'01-26',end:'01-26',annual:true},
    {id:'independence',theme:'independence',start:'08-15',end:'08-15',annual:true},
    {id:'christmas',theme:'christmas',start:'12-24',end:'12-26',annual:true}
  ];
  const defaults={theme:'dark',mode:'dark',textSize:13.5,automatic:false,manualOverride:false,
    customPresets:[],rules:fixedRules,calendar:{view:'month',date:'',numberSize:11,eventSize:10,detailSize:10,
      background:'',eventColor:'',deliveryColor:'',importantColor:''}};
  let settings;
  try{settings={...structuredClone(defaults),...JSON.parse(localStorage.getItem('tw_appearance_v2')||'{}')};}catch{settings=structuredClone(defaults);}
  settings.calendar={...defaults.calendar,...(settings.calendar||{})};
  if(!Array.isArray(settings.rules))settings.rules=structuredClone(fixedRules);
  if(!Array.isArray(settings.customPresets))settings.customPresets=[];
  function persist(){localStorage.setItem('tw_appearance_v2',JSON.stringify(settings));apply();}
  function names(){return {...Object.fromEntries(Object.entries(presets).map(([key,p])=>[key,p[0]])),
    ...Object.fromEntries(settings.customPresets.map(p=>[p.key,p.name]))};}
  function palette(key){const custom=settings.customPresets.find(p=>p.key===key);return custom?[custom.name,...custom.colors]:presets[key]||presets.dark;}
  function activeRule(date){const day=date.slice(5);return settings.rules.find(r=>{
    if(!names()[r.theme])return false;
    if(r.annual){const start=String(r.start||'').slice(-5),end=String(r.end||'').slice(-5);return start<=end?day>=start&&day<=end:day>=start||day<=end;}
    return date>=r.start&&date<=r.end;
  });}
  function activeTheme(date){return settings.automatic&&!settings.manualOverride?(activeRule(date||localDate())?.theme||settings.theme):settings.theme;}
  function localDate(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function mix(a,b,p){const x=parseInt(a.slice(1),16),y=parseInt(b.slice(1),16);const c=[16,8,0].map(s=>Math.round(((x>>s)&255)*(1-p)+((y>>s)&255)*p));return '#'+c.map(n=>n.toString(16).padStart(2,'0')).join('');}
  function luminance(value){const n=parseInt(value.slice(1),16);return .2126*((n>>16)&255)+.7152*((n>>8)&255)+.0722*(n&255);}
  function apply(){
    const p=palette(activeTheme());let [,primary,secondary,bg,tx,accent]=p;
    if(![primary,secondary,bg,tx,accent].every(hex))[,primary,secondary,bg,tx,accent]=presets.dark;
    const light=settings.mode==='light';
    if(light&&['dark','gold','newyear','christmas','diwali','dussehra','eid','navratri','karwa'].includes(activeTheme())){bg=mix(bg,'#ffffff',.9);tx='#241d1c';primary=mix(primary,'#000000',.28);secondary=mix(secondary,'#000000',.4);accent=mix(accent,'#000000',.25);}
    if(!light&&['light','bridal','holi','gurpurab','rakhi','independence','republic'].includes(activeTheme())){bg=mix(bg,'#080912',.9);tx='#f4eee6';primary=mix(primary,'#ffffff',.25);secondary=mix(secondary,'#ffffff',.2);}
    if(activeTheme().startsWith('custom-')){
      if(light&&luminance(bg)<140){bg=mix(bg,'#ffffff',.86);if(luminance(tx)>150)tx='#241d1c';}
      if(!light&&luminance(bg)>140){bg=mix(bg,'#080912',.86);if(luminance(tx)<110)tx='#f4eee6';}
    }
    document.body.classList.toggle('light',light);
    const vars={'--gold':primary,'--gold-lt':secondary,'--gold-dk':mix(primary,bg,.35),'--ink':bg,
      '--s1':mix(bg,tx,light?.04:.05),'--s2':mix(bg,tx,light?.09:.1),'--s3':mix(bg,tx,light?.15:.16),
      '--br':mix(bg,tx,light?.2:.22),'--tx':tx,'--txm':mix(tx,bg,.42),'--blu':accent,
      '--on-primary':light?'#23170b':'#160f08'};
    Object.entries(vars).forEach(([key,value])=>document.body.style.setProperty(key,value));
    const c=settings.calendar;
    document.body.style.setProperty('--cal-number-size',(Number(c.numberSize)||11)+'px');
    document.body.style.setProperty('--cal-event-size',(Number(c.eventSize)||10)+'px');
    document.body.style.setProperty('--cal-detail-size',(Number(c.detailSize)||10)+'px');
    document.body.style.setProperty('--cal-bg',hex(c.background)||vars['--s2']);
    document.body.style.setProperty('--cal-event',hex(c.eventColor)||primary);
    document.body.style.setProperty('--cal-delivery',hex(c.deliveryColor)||accent);
    document.body.style.setProperty('--cal-important',hex(c.importantColor)||'#d46a45');
    document.body.style.zoom=String((Number(settings.textSize)||13.5)/13.5);
    document.getElementById('theme-btn')?.setAttribute('title','Appearance settings');
  }
  function setTheme(key){if(!names()[key])return;settings.theme=key;settings.manualOverride=true;persist();window.render();}
  function setMode(mode){if(!['light','dark'].includes(mode))return;settings.mode=mode;persist();window.render();}
  function toggleMode(){setMode(settings.mode==='dark'?'light':'dark');}
  function setTextSize(value){const n=Number(value);if(!Number.isFinite(n)||n<11||n>18)return;settings.textSize=n;persist();window.render();}
  function setAuto(on){settings.automatic=on;settings.manualOverride=false;persist();window.render();}
  function resumeAuto(){settings.manualOverride=false;persist();window.render();}
  function colorField(key,label,value){return `<div class="ff"><label>${label}</label><div class="appearance-color"><input type="color" id="ap-${key}-picker" value="${hex(value)||'#ffffff'}" oninput="document.getElementById('ap-${key}').value=this.value"><input id="ap-${key}" value="${esc(value)}" maxlength="7" placeholder="#RRGGBB"></div></div>`;}
  function render(){
    const p=palette(settings.theme),c=settings.calendar,active=activeTheme();
    return `<div class="shdr"><div><div class="stitle">Appearance &amp; Themes</div><div class="ssub">Saved only in this browser. Billing and customer data are unaffected.</div></div></div>
      <div class="fc"><div class="ftitle">Theme selection</div><div class="business-grid">
        <div class="ff"><label>Preset or saved theme</label><select onchange="Appearance.setTheme(this.value)">${Object.entries(names()).map(([key,name])=>`<option value="${esc(key)}" ${settings.theme===key?'selected':''}>${esc(name)}</option>`).join('')}</select></div>
        <div class="ff"><label>Tone</label><select onchange="Appearance.setMode(this.value)"><option value="dark" ${settings.mode==='dark'?'selected':''}>Dark</option><option value="light" ${settings.mode==='light'?'selected':''}>Light</option></select></div><div class="ff"><label>App text &amp; interface size (${settings.textSize}px)</label><input type="range" min="11" max="18" step="0.5" value="${settings.textSize}" onchange="Appearance.setTextSize(this.value)"></div></div>
        <p class="wf-help mt8">Active: ${esc(names()[active]||active)} (${esc(settings.mode)}). ${settings.automatic&&!settings.manualOverride?'Automatic schedule is active when a matching date is found.':'Manual choice stays active until you resume automatic switching.'}</p></div>
      <div class="fc"><div class="ftitle">Automatic festival switching</div><label><input type="checkbox" ${settings.automatic?'checked':''} onchange="Appearance.setAuto(this.checked)"> Turn on automatic themes</label>
        <button class="btn btn-o btn-sm" onclick="Appearance.resumeAuto()">Resume automatic</button>
        <p class="wf-help">Fixed-date occasions are preloaded. Add the dates for festivals whose dates change each year.</p>
        <div class="tw"><table><thead><tr><th>Theme</th><th>From</th><th>Through</th><th>Repeats</th><th></th></tr></thead><tbody>${settings.rules.map((r,i)=>`<tr><td>${esc(names()[r.theme]||r.theme)}</td><td>${esc(r.start)}</td><td>${esc(r.end)}</td><td>${r.annual?'Every year':'Once'}</td><td><button class="btn btn-o btn-sm" onclick="Appearance.editRule(${i})">Edit</button> <button class="btn btn-d btn-sm" onclick="Appearance.deleteRule(${i})">Delete</button></td></tr>`).join('')}</tbody></table></div>
        <button class="btn btn-g btn-sm" onclick="Appearance.editRule(-1)">+ Schedule festival</button></div>
      <div class="fc"><div class="ftitle">Create a custom theme</div><div class="business-grid"><div class="ff"><label>Theme name</label><input id="ap-name" placeholder="My studio theme"></div>
        ${[['primary','Primary',p[1]],['secondary','Secondary',p[2]],['background','Background',p[3]],['text','Text',p[4]],['accent','Accent',p[5]]].map(x=>colorField(...x)).join('')}</div>
        <div class="btn-row"><button class="btn btn-g" onclick="Appearance.saveCustom()">Save &amp; use custom theme</button></div></div>
      <div class="fc"><div class="ftitle">Calendar appearance</div><div class="business-grid">
        ${[['numberSize','Date number size',c.numberSize],['eventSize','Event name size',c.eventSize],['detailSize','Details size',c.detailSize]].map(([key,label,value])=>`<div class="ff"><label>${label} (px)</label><input id="ap-cal-${key}" type="number" min="8" max="24" value="${value}"></div>`).join('')}
        ${[['background','Calendar background',c.background],['eventColor','Booking highlight',c.eventColor],['deliveryColor','Delivery highlight',c.deliveryColor],['importantColor','Important highlight',c.importantColor]].map(([key,label,value])=>colorField('cal-'+key,label,value)).join('')}
        </div><div class="btn-row"><button class="btn btn-g" onclick="Appearance.saveCalendarStyle()">Save calendar style</button></div></div>`;
  }
  function saveCustom(){const name=document.getElementById('ap-name').value.trim();const keys=['primary','secondary','background','text','accent'];const colors=keys.map(k=>hex(document.getElementById('ap-'+k).value.trim()));if(!name||name.length>40||colors.some(x=>!x)){alert('Enter a theme name and five valid #RRGGBB colours.');return;}const key='custom-'+Date.now();settings.customPresets.push({key,name,colors});settings.theme=key;settings.manualOverride=true;persist();window.render();}
  function saveCalendarStyle(){const c={...settings.calendar};for(const key of ['numberSize','eventSize','detailSize']){const n=Number(document.getElementById('ap-cal-'+key).value);if(!Number.isInteger(n)||n<8||n>24){alert('Choose text sizes from 8 to 24 px.');return;}c[key]=n;}for(const key of ['background','eventColor','deliveryColor','importantColor']){const v=document.getElementById('ap-cal-'+key).value.trim();if(v&&!hex(v)){alert('Use #RRGGBB color codes.');return;}c[key]=v;}settings.calendar=c;persist();window.render();}
  function editRule(i){const r=settings.rules[i]||{theme:'diwali',start:'',end:'',annual:false};const shade=document.createElement('div');shade.className='shade';shade.id='shade';shade.style='position:fixed;inset:0;z-index:300;overflow:auto;padding:20px';shade.innerHTML=`<div class="modal"><div class="mtitle">Festival schedule <button class="mclose" onclick="closeShade()">✕</button></div><div class="ff"><label>Theme</label><select id="rule-theme">${Object.entries(names()).map(([key,name])=>`<option value="${esc(key)}" ${r.theme===key?'selected':''}>${esc(name)}</option>`).join('')}</select></div><div class="business-grid mt8"><div class="ff"><label>From</label><input id="rule-start" type="date" value="${esc(r.annual?'2026-'+r.start:r.start)}"></div><div class="ff"><label>Through</label><input id="rule-end" type="date" value="${esc(r.annual?'2026-'+r.end:r.end)}"></div></div><label><input id="rule-annual" type="checkbox" ${r.annual?'checked':''}> Repeat every year (for fixed-date occasions)</label><div class="btn-row"><button class="btn btn-o" onclick="closeShade()">Cancel</button><button class="btn btn-g" onclick="Appearance.saveRule(${i})">Save schedule</button></div></div>`;document.body.appendChild(shade);}
  function saveRule(i){const theme=document.getElementById('rule-theme').value,start=document.getElementById('rule-start').value,end=document.getElementById('rule-end').value,annual=document.getElementById('rule-annual').checked;if(!start||!end||(!annual&&end<start)){alert('Choose a valid date range.');return;}const rule={id:i<0?'rule-'+Date.now():settings.rules[i].id,theme,start:annual?start.slice(5):start,end:annual?end.slice(5):end,annual};if(i<0)settings.rules.push(rule);else settings.rules[i]=rule;persist();closeShade();window.render();}
  function deleteRule(i){if(!confirm('Remove this automatic theme schedule?'))return;settings.rules.splice(i,1);persist();window.render();}
  function calendarDate(){return settings.calendar.date||localDate();}
  function setCalendarDate(date){if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return;settings.calendar.date=date;persist();window.render();}
  function setCalendarView(view){if(!['month','week','day'].includes(view))return;settings.calendar.view=view;persist();window.render();}
  function shiftCalendar(direction){const date=calendarDate(),view=settings.calendar.view;const d=new Date(date+'T12:00:00Z');if(view==='month'){d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+direction);}else d.setUTCDate(d.getUTCDate()+direction*(view==='week'?7:1));setCalendarDate(d.toISOString().slice(0,10));}
  function entries(date){const rows=[];DB.events.forEach((o,i)=>WeddingFunctions.calendarEntries(o).filter(e=>e.date===date).forEach(e=>rows.push({kind:'event',index:i,name:e.name+' · '+e.functionName,important:true})));DB.walkins.forEach((o,i)=>{if(o.deliveryDate===date)rows.push({kind:'delivery',index:i,name:(o.name||'Customer')+' · Delivery'});});(DB.calendarNotes||[]).forEach((o,i)=>{if(o.date===date)rows.push({kind:'note',index:i,name:o.title,details:o.details,color:hex(o.color),important:o.important});});DB.blockedDates.forEach((o,i)=>{if(o.date===date)rows.push({kind:'blocked',index:i,name:o.reason||'Blocked'});});return rows;}
  function renderDay(date,other=false){const d=Number(date.slice(-2)),isToday=date===localDate(),items=other?[]:entries(date);return `<div class="cal-day ${other?'other-month':''} ${isToday?'today':''} ${items.length?'has-event':''}"><button class="cal-dn ${isToday?'today-n':''}" onclick="Appearance.editNote(-1,'${date}')" title="Add calendar entry">${d} +</button>${other?'':VivahMuhurat.calendarBadge(date)}${items.map(e=>`<button class="cal-ev ${e.kind} ${e.important?'important':''}" style="${e.color?'--entry-color:'+e.color+';':''}" onclick="Appearance.openEntry('${e.kind}',${e.index})" title="${esc(e.name)}">${esc(e.name)}${e.details?`<small class="cal-detail">${esc(e.details)}</small>`:''}</button>`).join('')}</div>`;}
  function renderCalendar(){const date=calendarDate(),view=settings.calendar.view,y=Number(date.slice(0,4)),m=Number(date.slice(5,7))-1;let dates=[];if(view==='month'){const first=new Date(Date.UTC(y,m,1,12)),start=new Date(first);start.setUTCDate(1-first.getUTCDay());const count=Math.ceil((first.getUTCDay()+new Date(Date.UTC(y,m+1,0)).getUTCDate())/7)*7;dates=Array.from({length:count},(_,i)=>{const d=new Date(start);d.setUTCDate(start.getUTCDate()+i);return d.toISOString().slice(0,10);});}else if(view==='week'){const start=new Date(date+'T12:00:00Z');start.setUTCDate(start.getUTCDate()-start.getUTCDay());dates=Array.from({length:7},(_,i)=>{const d=new Date(start);d.setUTCDate(start.getUTCDate()+i);return d.toISOString().slice(0,10);});}else dates=[date];const label=view==='month'?new Date(Date.UTC(y,m,1)).toLocaleString('en-IN',{month:'long',year:'numeric'}):view==='week'?dates[0]+' – '+dates[6]:date;return `<div class="shdr"><div><div class="stitle">Calendar</div><div class="ssub">Click a date to add a note; click a booking to edit its original record.</div></div><button class="btn btn-g btn-sm" onclick="Appearance.editNote(-1,'${date}')">+ Entry</button></div><div class="cal-nav"><button class="btn btn-o btn-sm" onclick="Appearance.shiftCalendar(-1)">◀ Prev</button><strong>${esc(label)}</strong><button class="btn btn-o btn-sm" onclick="Appearance.shiftCalendar(1)">Next ▶</button><input type="date" value="${date}" onchange="Appearance.setCalendarDate(this.value)"><select onchange="Appearance.setCalendarView(this.value)">${['month','week','day'].map(v=>`<option value="${v}" ${view===v?'selected':''}>${v[0].toUpperCase()+v.slice(1)}</option>`).join('')}</select></div><div class="business-actions"><span class="cal-legend event">Booking</span><span class="cal-legend delivery">Delivery</span><span class="cal-legend note">Custom entry</span><span class="cal-legend blocked">Blocked</span><button class="btn btn-o btn-sm" onclick="go('appearance',document.getElementById('tab-appearance'))">Calendar colors &amp; text</button></div>${VivahMuhurat.calendarPanel(y,m+1)}<div class="cal-grid ${view==='day'?'cal-one':''}">${view==='day'?'':(view==='week'?dates:['Sun','Mon','Tue','Wed','Thu','Fri','Sat']).map((x,i)=>`<div class="cal-hdr-cell">${view==='week'?['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][i]+' '+x.slice(-2):x}</div>`).join('')}${dates.map(d=>renderDay(d,view==='month'&&d.slice(0,7)!==date.slice(0,7))).join('')}</div>`;}
  function openEntry(kind,i){if(kind==='note'){editNote(i);return;}if(kind==='event'){WeddingFunctions.open(i);return;}if(kind==='delivery'){editWi(i);return;}if(kind==='blocked'){editBlocked(i);}}
  function editNote(i,date){const note=(DB.calendarNotes||[])[i]||{date:date||calendarDate(),title:'',details:'',color:'',important:false};const shade=document.createElement('div');shade.className='shade';shade.id='shade';shade.style='position:fixed;inset:0;z-index:300;overflow:auto;padding:20px';shade.innerHTML=`<div class="modal"><div class="mtitle">${i<0?'Add':'Edit'} calendar entry <button class="mclose" onclick="closeShade()">✕</button></div><div class="business-grid"><div class="ff"><label>Date</label><input id="note-date" type="date" value="${esc(note.date)}"></div><div class="ff"><label>Title</label><input id="note-title" value="${esc(note.title)}"></div><div class="ff"><label>Highlight color</label><input id="note-color" type="color" value="${hex(note.color)||'#c9a84c'}"></div></div><div class="ff mt8"><label>Details</label><textarea id="note-details" rows="3">${esc(note.details)}</textarea></div><label><input id="note-important" type="checkbox" ${note.important?'checked':''}> Important date</label><div class="btn-row">${i>=0?`<button class="btn btn-d" onclick="Appearance.deleteNote(${i})">Delete</button>`:''}<button class="btn btn-o" onclick="closeShade()">Cancel</button><button class="btn btn-g" onclick="Appearance.saveNote(${i})">Save entry</button></div></div>`;document.body.appendChild(shade);}
  function saveNote(i){const date=document.getElementById('note-date').value,title=document.getElementById('note-title').value.trim(),details=document.getElementById('note-details').value.trim(),color=document.getElementById('note-color').value,important=document.getElementById('note-important').checked;if(!date||!title){alert('Date and title are required.');return;}DB.calendarNotes=DB.calendarNotes||[];const old=DB.calendarNotes[i]||{};const note={...old,id:old.id||'note-'+Date.now(),date,title,details,color,important};if(i<0)DB.calendarNotes.push(note);else DB.calendarNotes[i]=note;save();closeShade();window.render();}
  function deleteNote(i){if(!confirm('Delete this calendar entry?'))return;DB.calendarNotes.splice(i,1);save();closeShade();window.render();}
  function editBlocked(i){const b=DB.blockedDates[i];if(!b)return;const shade=document.createElement('div');shade.className='shade';shade.id='shade';shade.style='position:fixed;inset:0;z-index:300;overflow:auto;padding:20px';shade.innerHTML=`<div class="modal"><div class="mtitle">Edit blocked date <button class="mclose" onclick="closeShade()">✕</button></div><div class="ff"><label>Date</label><input id="block-date" type="date" value="${esc(b.date)}"></div><div class="ff mt8"><label>Reason</label><input id="block-reason" value="${esc(b.reason||'')}"></div><div class="btn-row"><button class="btn btn-d" onclick="Appearance.deleteBlocked(${i})">Delete</button><button class="btn btn-g" onclick="Appearance.saveBlocked(${i})">Save</button></div></div>`;document.body.appendChild(shade);}
  function saveBlocked(i){const date=document.getElementById('block-date').value;if(!date){alert('Date required.');return;}DB.blockedDates[i]={...DB.blockedDates[i],date,reason:document.getElementById('block-reason').value.trim()};save();closeShade();window.render();}
  function deleteBlocked(i){if(!confirm('Remove this blocked date?'))return;DB.blockedDates.splice(i,1);save();closeShade();window.render();}
  apply();setInterval(()=>{if(settings.automatic&&!settings.manualOverride)apply();},60000);
  return {render,apply,toggleMode,setTheme,setMode,setTextSize,setAuto,resumeAuto,saveCustom,saveCalendarStyle,editRule,saveRule,deleteRule,
    renderCalendar,setCalendarDate,setCalendarView,shiftCalendar,openEntry,editNote,saveNote,deleteNote,editBlocked,saveBlocked,deleteBlocked,
    activeTheme,activeRule,settings};
})();
