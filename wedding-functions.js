/* Function scheduling for existing event bookings. No data changes occur until Save. */
const WeddingFunctions=(()=>{
  let draft=null;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')&&!Number.isNaN(new Date(value+'T00:00:00Z').getTime());
  function addDays(value,days){
    if(!validDate(value))return '';
    const d=new Date(value+'T00:00:00Z');
    d.setUTCDate(d.getUTCDate()+Number(days||0));
    return d.toISOString().slice(0,10);
  }
  function daysBetween(main,date){
    if(!validDate(main)||!validDate(date))return 0;
    return Math.round((new Date(date+'T00:00:00Z')-new Date(main+'T00:00:00Z'))/86400000);
  }
  function newFunction(name,date,main,venue=''){
    return {id:'fn-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),name:name||'Function',date:date||main||'',offsetDays:daysBetween(main,date),manualDate:false,isMain:false,startTime:'',endTime:'',venue,location:'',photographer:'',cinematographer:'',team:'',equipment:'',instructions:'',deliverables:'',status:'Planned',priority:'Normal',sequence:0};
  }
  function functionsFor(event){
    if(Array.isArray(event.functions)&&event.functions.length){
      const list=event.functions.map((f,i)=>({...f,id:f.id||'fn-legacy-'+i,sequence:Number.isFinite(+f.sequence)?+f.sequence:i+1,offsetDays:Number.isFinite(+f.offsetDays)?+f.offsetDays:daysBetween(event.weddingDate||event.eventDate,f.date)}));
      if(!list.some(f=>f.isMain))list[0].isMain=true;
      return list;
    }
    const main=event.weddingDate||event.eventDate||'';
    const first=newFunction(event.eventType||'Wedding',main,main,event.venue||'');
    first.isMain=true;first.sequence=1;first.id='fn-main-'+(event.date||main);
    const extras=(event.extraDates||[]).map((date,i)=>{
      const f=newFunction('Additional function '+(i+1),date,main,(event.extraVenues||[])[i]||'');
      f.sequence=i+2;return f;
    });
    return [first,...extras];
  }
  function chronological(functions){
    return [...functions].sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999')||(a.startTime||'').localeCompare(b.startTime||'')||(+a.sequence||0)-(+b.sequence||0));
  }
  function reschedule(functions,next){
    return functions.map(f=>f.manualDate?{...f}:{...f,date:addDays(next,f.offsetDays)});
  }
  function calendarEntries(event){
    return functionsFor(event).filter(f=>f.date).map(f=>({date:f.date,name:event.name||'',functionName:f.name||event.eventType||'Event',event,status:f.status||event.status||'Planned'}));
  }
  function open(index){
    const event=DB.events[index];if(!event)return;
    draft={index,main:event.weddingDate||event.eventDate||'',functions:functionsFor(event)};
    const shade=document.createElement('div');shade.className='shade';shade.id='shade';
    shade.style='position:fixed;top:0;left:0;right:0;bottom:0;z-index:200;overflow-y:auto;padding:20px';
    shade.innerHTML='<div class="modal wf-modal" id="wf-modal"></div>';
    document.body.appendChild(shade);
    render();
  }
  function field(f,key,label,type='text',extra=''){
    return `<div class="ff"><label>${label}</label><input class="wf-field" data-key="${key}" type="${type}" value="${esc(f[key])}" ${extra}></div>`;
  }
  function renderTimeline(){
    return chronological(draft.functions).map((f,i)=>{
      const d=f.date?daysBetween(today(),f.date):null;
      const urgent=d!==null&&d>=0&&d<=3&&f.status!=='Completed';
      return `<details class="wf-timeline-item" ${i===0?'open':''}><summary><b>${esc(f.date||'No date')}</b> · ${esc(f.name)} ${urgent?'<span class="bdg bdg-urg">Upcoming</span>':''}<span class="bdg bdg-muted">${esc(f.status||'Planned')}</span></summary>
        <div class="wf-timeline-body">${esc(f.startTime||'—')}–${esc(f.endTime||'—')} · ${esc(f.venue||'Venue pending')}${f.location?' · '+esc(f.location):''}<br>
        Photographer: ${esc(f.photographer||'—')} · Cinematographer: ${esc(f.cinematographer||'—')} · Team: ${esc(f.team||'—')}<br>
        Equipment: ${esc(f.equipment||'—')} · Deliverables: ${esc(f.deliverables||'—')}<br>
        Instructions: ${esc(f.instructions||'—')} · Priority: ${esc(f.priority||'Normal')}</div></details>`;
    }).join('')||'<div class="empty">No functions yet</div>';
  }
  function renderEditor(f,i){
    return `<details class="wf-editor" ${i===0?'open':''} data-id="${esc(f.id)}"><summary>${esc(f.name||'Function')} · ${esc(f.date||'No date')} ${f.manualDate?'<span class="bdg bdg-amb">Manual date</span>':''}</summary>
      <div class="wf-grid">${field(f,'name','Function name')}${field(f,'date','Function date','date',f.isMain?'readonly':'')}${field(f,'offsetDays','Days from main date','number',f.isMain?'readonly':'')}${field(f,'startTime','Start time','time')}${field(f,'endTime','End time','time')}${field(f,'venue','Venue')}${field(f,'location','Location')}${field(f,'photographer','Photographer')}${field(f,'cinematographer','Cinematographer')}${field(f,'team','Other team members')}${field(f,'equipment','Equipment needed')}${field(f,'deliverables','Deliverables')}${field(f,'instructions','Special instructions')}
        <div class="ff"><label>Status</label><select class="wf-field" data-key="status">${['Planned','Confirmed','In Progress','Completed','Cancelled'].map(v=>`<option ${f.status===v?'selected':''}>${v}</option>`).join('')}</select></div>
        <div class="ff"><label>Priority</label><select class="wf-field" data-key="priority">${['Urgent','High','Normal','Low'].map(v=>`<option ${f.priority===v?'selected':''}>${v}</option>`).join('')}</select></div>
      </div>
      <div class="wf-row-actions">${f.isMain?'<span>Main date follows the booking date above.</span><input class="wf-manual" type="checkbox" hidden>':`<label><input class="wf-manual" type="checkbox" ${f.manualDate?'checked':''}> Keep this date when main date changes</label><button type="button" class="btn btn-o btn-sm wf-reset">Reset to offset</button><button type="button" class="btn btn-d btn-sm wf-remove">Remove function</button>`}</div>
    </details>`;
  }
  function renderSequence(){
    return [...draft.functions].sort((a,b)=>(+a.sequence||0)-(+b.sequence||0)).map((f,i)=>`<div class="wf-sequence-row" data-id="${esc(f.id)}"><span>${i+1}. ${esc(f.name)} · ${esc(f.date||'No date')} · ${esc(f.priority||'Normal')}</span><button type="button" class="btn btn-o btn-sm wf-up" ${i===0?'disabled':''}>↑</button><button type="button" class="btn btn-o btn-sm wf-down" ${i===draft.functions.length-1?'disabled':''}>↓</button></div>`).join('');
  }
  function render(){
    const modal=document.getElementById('wf-modal');if(!modal||!draft)return;
    const event=DB.events[draft.index];
    modal.innerHTML=`<div class="mtitle">Functions · ${esc(event.name)} <button class="mclose" type="button" id="wf-close">✕</button></div>
      <p class="wf-help">Change the main date here to review linked date changes. Manually fixed function dates stay in place.</p>
      <div class="ff"><label>Main wedding / event date</label><input type="date" id="wf-main-date" value="${esc(draft.main)}"></div>
      <h3 class="wf-heading">Date-wise timeline</h3><div id="wf-timeline">${renderTimeline()}</div>
      <h3 class="wf-heading">Priority &amp; sequence</h3><p class="wf-help">This order highlights the next work to prepare. The timeline above always follows actual dates.</p><div id="wf-sequence">${renderSequence()}</div>
      <h3 class="wf-heading">Function details</h3><div id="wf-editors">${draft.functions.map(renderEditor).join('')}</div>
      <button type="button" class="btn btn-o btn-sm" id="wf-add">+ Add function</button>
      <div class="btn-row"><button type="button" class="btn btn-o" id="wf-cancel">Cancel</button><button type="button" class="btn btn-g" id="wf-save">Save functions</button></div>`;
    modal.querySelector('#wf-close').onclick=closeShade;
    modal.querySelector('#wf-cancel').onclick=closeShade;
    modal.querySelector('#wf-add').onclick=add;
    modal.querySelector('#wf-save').onclick=saveDraft;
    modal.querySelector('#wf-main-date').onchange=changeMainDate;
    modal.querySelector('#wf-editors').addEventListener('change',onEditorChange);
    modal.querySelector('#wf-editors').addEventListener('click',onEditorClick);
    modal.querySelector('#wf-sequence').addEventListener('click',onSequenceClick);
  }
  function collect(){
    const editors=[...document.querySelectorAll('#wf-editors .wf-editor')];
    for(const editor of editors){
      const f=draft.functions.find(item=>item.id===editor.dataset.id);if(!f)continue;
      editor.querySelectorAll('.wf-field').forEach(el=>{f[el.dataset.key]=el.value;});
      f.offsetDays=Number.isFinite(+f.offsetDays)?Math.trunc(+f.offsetDays):0;
      f.manualDate=editor.querySelector('.wf-manual').checked;
    }
  }
  function onEditorChange(e){
    const editor=e.target.closest('.wf-editor');if(!editor)return;
    if(e.target.dataset.key==='date') editor.querySelector('.wf-manual').checked=true;
    if(e.target.dataset.key==='offsetDays'){
      editor.querySelector('.wf-manual').checked=false;
      editor.querySelector('[data-key="date"]').value=addDays(draft.main,e.target.value);
    }
    collect();
    document.getElementById('wf-timeline').innerHTML=renderTimeline();
    document.getElementById('wf-sequence').innerHTML=renderSequence();
  }
  function onEditorClick(e){
    const editor=e.target.closest('.wf-editor');if(!editor)return;
    collect();
    const index=draft.functions.findIndex(f=>f.id===editor.dataset.id);if(index<0)return;
    const f=draft.functions[index];
    if(e.target.closest('.wf-reset')){f.manualDate=false;f.date=addDays(draft.main,f.offsetDays);render();}
    if(e.target.closest('.wf-remove')&&confirm('Remove this function from this booking?')){draft.functions.splice(index,1);renumber();render();}
  }
  function renumber(){[...draft.functions].sort((a,b)=>(+a.sequence||0)-(+b.sequence||0)).forEach((f,i)=>f.sequence=i+1);}
  function onSequenceClick(e){
    const row=e.target.closest('.wf-sequence-row');if(!row)return;
    const delta=e.target.closest('.wf-up')?-1:e.target.closest('.wf-down')?1:0;if(!delta)return;
    collect();
    const ordered=[...draft.functions].sort((a,b)=>(+a.sequence||0)-(+b.sequence||0));
    const i=ordered.findIndex(f=>f.id===row.dataset.id),j=i+delta;
    if(i<0||j<0||j>=ordered.length)return;
    [ordered[i],ordered[j]]=[ordered[j],ordered[i]];
    ordered.forEach((f,k)=>f.sequence=k+1);
    render();
  }
  function add(){
    collect();
    const f=newFunction('New function',draft.main,draft.main,'');
    f.sequence=draft.functions.length+1;
    draft.functions.push(f);render();
  }
  function changeMainDate(e){
    const next=e.target.value;
    if(!validDate(next)){e.target.value=draft.main;return;}
    collect();
    if(next===draft.main)return;
    const changes=draft.functions.filter(f=>!f.manualDate).map(f=>`${f.name}: ${f.date||'—'} → ${addDays(next,f.offsetDays)}`);
    const message=`Change main date from ${draft.main||'—'} to ${next}?\n\n${changes.join('\n')||'No linked dates will move.'}\n\nManually fixed dates will stay unchanged.`;
    if(!confirm(message)){e.target.value=draft.main;return;}
    draft.main=next;
    draft.functions=reschedule(draft.functions,next);
    render();
  }
  function saveDraft(){
    collect();
    if(!validDate(draft.main)){alert('Main date required');return;}
    if(draft.functions.some(f=>!f.name.trim()||!validDate(f.date))){alert('Every function needs a name and valid date');return;}
    if(draft.functions.some(f=>f.startTime&&f.endTime&&f.endTime<f.startTime)){alert('End time must be after start time');return;}
    renumber();
    const event=DB.events[draft.index];if(!event)return;
    const mainFunction=draft.functions.find(f=>f.isMain)||draft.functions[0];
    if(mainFunction)mainFunction.isMain=true;
    event.weddingDate=draft.main;
    event.eventDate=draft.main;
    event.functions=draft.functions.map(f=>({...f}));
    event.venue=mainFunction?.venue||event.venue||'';
    event.extraDates=draft.functions.filter(f=>f!==mainFunction).map(f=>f.date);
    event.extraVenues=draft.functions.filter(f=>f!==mainFunction).map(f=>f.venue||'');
    save();closeShade();window.render();
  }
  return {open,newFunction,functionsFor,calendarEntries,chronological,reschedule,addDays,daysBetween};
})();
