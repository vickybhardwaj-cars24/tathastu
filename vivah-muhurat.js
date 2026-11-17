/* New Delhi wedding-date guidance. This module never writes to the studio DB. */
const VivahMuhurat=(()=>{
  const SOURCE='https://mykundli.app/data';
  const REFERENCE='https://www.drikpanchang.com/shubh-dates/shubh-marriage-dates-with-muhurat.html';
  const LICENSE='https://creativecommons.org/licenses/by/4.0/';
  const CACHE_PREFIX='tw-vivah-muhurat-v1-';
  const MAX_AGE=7*24*60*60*1000;
  const years=new Map(),pending=new Map();
  let selectedDate='';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const validDate=v=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;const d=new Date(v+'T12:00:00Z');return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===v;};
  const validStamp=v=>/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v.replace(' ','T')+':00+05:30'));
  function sourceUrl(year){return `${SOURCE}/vivah-muhurat-${year}.json`;}
  function referenceUrl(year){return `${REFERENCE}?geoname-id=1261481&year=${year}`;}
  function normalize(payload,year){
    if(payload?.license!=='CC BY 4.0'||!Array.isArray(payload.rows))throw new Error('Unexpected Panchang feed');
    const rows=payload.rows.filter(r=>validDate(r.date)&&Number(r.date.slice(0,4))===year&&validStamp(r.window_start_ist)&&validStamp(r.window_end_ist)&&Date.parse(r.window_end_ist.replace(' ','T')+':00+05:30')>Date.parse(r.window_start_ist.replace(' ','T')+':00+05:30'))
      .map(r=>({date:r.date,start:r.window_start_ist,end:r.window_end_ist,nakshatra:String(r.nakshatra||''),tithi:String(r.tithi||'')}));
    if(!rows.length)throw new Error('No valid wedding dates in feed');
    const byDate={};for(const row of rows)(byDate[row.date]??=[]).push(row);
    const description=String(payload.description||'');
    const complete=/\ball\s+\d+\s+wedding dates\b/i.test(description)&&!/\bleft\b|\bremaining\b|\bpartial\b/i.test(description);
    const remainingYear=/\bleft in\b|\bremaining\b/i.test(description);
    const coverageStart=remainingYear?rows.map(r=>r.date).sort()[0]:null;
    return {year,rows,byDate,complete,coverageStart,description,source:String(payload.source||sourceUrl(year)),fetchedAt:Date.now(),stale:false};
  }
  function fromCache(year){
    try{const raw=JSON.parse(localStorage.getItem(CACHE_PREFIX+year)||'null');if(!raw?.payload||!raw.fetchedAt)return null;const data=normalize(raw.payload,year);data.fetchedAt=raw.fetchedAt;data.stale=Date.now()-raw.fetchedAt>MAX_AGE;return data;}catch{return null;}
  }
  function loadYear(year){
    year=Number(year);if(!Number.isInteger(year)||year<2026||year>2100)return Promise.resolve(null);
    const existing=years.get(year)||fromCache(year);
    if(existing&&!years.has(year))years.set(year,existing);
    if(existing?.retryAfter&&Date.now()<existing.retryAfter)return Promise.resolve(existing.missing?null:existing);
    if(existing&&!existing.stale&&Date.now()-existing.fetchedAt<MAX_AGE)return Promise.resolve(existing);
    if(pending.has(year))return pending.get(year);
    const request=fetch(sourceUrl(year),{cache:'no-store'}).then(async response=>{
      if(!response.ok)throw new Error(response.status===404?'No published data for '+year:'Panchang feed unavailable');
      const payload=await response.json(),data=normalize(payload,year);
      years.set(year,data);
      try{localStorage.setItem(CACHE_PREFIX+year,JSON.stringify({payload,fetchedAt:data.fetchedAt}));}catch{}
      return data;
    }).catch(error=>{
      if(existing&&!existing.missing){existing.stale=true;existing.retryAfter=Date.now()+60*60*1000;years.set(year,existing);return existing;}
      years.set(year,{year,error:error.message,missing:true,retryAfter:Date.now()+(error.message.startsWith('No published data')?24:1)*60*60*1000});return null;
    }).finally(()=>{pending.delete(year);if(typeof curTab!=='undefined'&&curTab==='calendar'&&typeof window.render==='function')window.render();});
    pending.set(year,request);return request;
  }
  function status(date){
    if(!validDate(date))return {kind:'invalid'};
    const year=Number(date.slice(0,4));if(year<2026||year>2100)return {kind:'unavailable'};
    const data=years.get(year)||fromCache(year);
    if(!data){loadYear(year);return {kind:'loading'};}
    if(data.missing)return {kind:'unavailable'};
    const windows=data.byDate[date]||[];
    if(windows.length)return {kind:'shubh',windows,data};
    if(!data.complete&&(!data.coverageStart||date<data.coverageStart))return {kind:'unknown',data};
    return {kind:'not-listed',data};
  }
  function formatStamp(stamp){return `${stamp.slice(11)} IST, ${stamp.slice(8,10)} ${new Date(stamp.slice(0,7)+'-01T00:00:00Z').toLocaleString('en-IN',{month:'short',timeZone:'UTC'})} ${stamp.slice(0,4)}`;}
  function windowsHtml(windows){return windows.map(w=>`<div class="muhurat-window"><b>${esc(formatStamp(w.start))} – ${esc(formatStamp(w.end))}</b><span>Nakshatra: ${esc(w.nakshatra||'—')} · Tithi: ${esc(w.tithi||'—')}</span></div>`).join('');}
  function bookingCount(date){return typeof DB==='undefined'?0:DB.events.filter(e=>e.eventDate===date&&e.status!=='Cancelled').length;}
  function alertHtml(date){
    const info=status(date),year=Number(date.slice(0,4));
    if(info.kind==='invalid')return '';
    const links=`<a href="${SOURCE}" target="_blank" rel="noopener noreferrer">MyKundli</a> (<a href="${LICENSE}" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>; <a href="${sourceUrl(year)}" target="_blank" rel="noopener noreferrer">year data</a>) · <a href="${referenceUrl(year)}" target="_blank" rel="noopener noreferrer">Drik Panchang reference</a>`;
    if(info.kind==='loading')return `<div class="muhurat-alert">Loading New Delhi Vivah Muhurat for ${year}…</div>`;
    if(info.kind==='unavailable')return `<div class="muhurat-alert">No verified New Delhi feed is published for ${year} yet. Check the source before advising a customer. ${links}</div>`;
    const stale=info.data.stale?'<strong> Cached data; refresh failed. Recheck source before confirming.</strong>':'';
    if(info.kind==='shubh')return `<div class="muhurat-alert shubh"><b>✨ Shubh Vivah date · potential high demand</b>${stale}${windowsHtml(info.windows)}<small>${bookingCount(date)} existing studio booking(s) on this date. New Delhi, IST · Data: ${links}. Dates are Panchang guidance; confirm with your priest.</small></div>`;
    if(info.kind==='unknown')return `<div class="muhurat-alert">This date is outside the published ${year} feed coverage; auspicious status and reason are unknown.${stale} New Delhi, IST · ${links}</div>`;
    return `<div class="muhurat-alert">No Shubh Muhurat is listed for ${esc(date)} in the MyKundli feed. Another Panchang may differ. This feed gives no specific inauspicious reason; check Drik Panchang before advising a customer.${stale} New Delhi, IST · ${links}</div>`;
  }
  function showDateAlert(inputId,targetId,eventTypeId){
    const input=document.getElementById(inputId),target=document.getElementById(targetId);if(!input||!target)return;
    const date=input.value,wedding=!eventTypeId||/^(wedding|vivah)$/i.test(document.getElementById(eventTypeId)?.value?.trim()||'');
    target.innerHTML=wedding&&date?alertHtml(date):'';
    if(wedding&&validDate(date))loadYear(Number(date.slice(0,4))).then(()=>{if(document.getElementById(inputId)?.value===date){const t=document.getElementById(targetId);if(t)t.innerHTML=alertHtml(date);}});
  }
  function calendarBadge(date){const info=status(date);if(info.kind!=='shubh')return '';return `<button class="muhurat-day" onclick="VivahMuhurat.openDate('${date}')" title="View Vivah Muhurat">✨ Shubh Vivah</button>`;}
  function monthSummary(year,month){
    if(year<2026||year>2100)return `<span class="muhurat-count">No verified ${year} feed available</span>`;
    const data=years.get(year)||fromCache(year);if(!data){loadYear(year);return '<span class="muhurat-count">Loading Vivah Muhurat…</span>';}
    if(data.missing)return `<span class="muhurat-count">No verified ${year} feed published yet</span>`;
    const dates=Object.keys(data.byDate).filter(d=>Number(d.slice(5,7))===month);
    return `<span class="muhurat-count">✨ ${dates.length} listed Shubh Vivah date${dates.length===1?'':'s'} this month${data.complete?'':' · partial-year feed'}</span>${data.stale?' <span class="muhurat-stale">Cached data</span>':''}`;
  }
  function calendarPanel(year,month){
    const cached=years.get(year)||fromCache(year);
    if(year>=2026&&year<=2100&&(!cached||(cached.retryAfter&&Date.now()>=cached.retryAfter)||(!cached.missing&&!cached.retryAfter&&(cached.stale||Date.now()-cached.fetchedAt>=MAX_AGE))))loadYear(year);
    const monthKey=year+'-'+String(month).padStart(2,'0');
    const checked=selectedDate.startsWith(monthKey)?selectedDate:'';
    return `<div class="muhurat-panel">${monthSummary(year,month)}<button class="btn btn-o btn-sm" onclick="showBlockDate()">+ Block Date</button><span>New Delhi, NCT · IST · Data: <a href="${SOURCE}" target="_blank" rel="noopener noreferrer">MyKundli</a> (<a href="${LICENSE}" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>; <a href="${sourceUrl(year)}" target="_blank" rel="noopener noreferrer">year file</a>) · <a href="${referenceUrl(year)}" target="_blank" rel="noopener noreferrer">Drik Panchang reference</a></span><label>Check wedding date <input type="date" value="${checked}" onchange="VivahMuhurat.setCheckDate(this.value)"></label>${checked?alertHtml(checked):''}<small>Only published source dates are highlighted. Times are formatted from source data. Unlisted dates may lack a verified reason. Confirm a final wedding muhurat with a priest.</small></div>`;
  }
  function setCheckDate(date){selectedDate=validDate(date)?date:'';if(typeof window.render==='function')window.render();}
  function openDate(date){
    const shade=document.createElement('div');shade.className='shade';shade.id='shade';shade.style='position:fixed;inset:0;z-index:300;overflow:auto;padding:20px';
    shade.innerHTML=`<div class="modal"><div class="mtitle">Vivah Muhurat · ${esc(date)} <button class="mclose" onclick="closeShade()">✕</button></div>${alertHtml(date)}<div class="btn-row"><button class="btn btn-o" onclick="closeShade()">Close</button></div></div>`;
    document.body.appendChild(shade);
  }
  function attachQuoteDate(){
    const input=document.getElementById('quote-date');if(!input)return;
    const target=document.createElement('div');target.id='quote-muhurat-alert';
    input.closest('.business-grid')?.after(target);
    input.addEventListener('change',()=>showDateAlert('quote-date','quote-muhurat-alert'));
    showDateAlert('quote-date','quote-muhurat-alert');
  }
  function attachBookingConfirmation(index){
    const date=DB.quotes[index]?.weddingDate,modal=document.querySelector('#shade .modal');if(!date||!modal)return;
    const target=document.createElement('div');target.id='booking-muhurat-alert';target.innerHTML=alertHtml(date);
    modal.querySelector('.btn-row')?.before(target);
    loadYear(Number(date.slice(0,4))).then(()=>{const current=document.getElementById('booking-muhurat-alert');if(current)current.innerHTML=alertHtml(date);});
  }
  return {loadYear,status,showDateAlert,alertHtml,calendarBadge,calendarPanel,setCheckDate,openDate,attachQuoteDate,attachBookingConfirmation,normalize,formatStamp};
})();

/* The existing quotation modal owns its save logic; these hooks only add date guidance. */
const openQuoteWithoutMuhurat=StudioBusiness.openQuote;
StudioBusiness.openQuote=(...args)=>{openQuoteWithoutMuhurat(...args);VivahMuhurat.attachQuoteDate();};
const convertQuoteWithoutMuhurat=StudioBusiness.convertQuote;
StudioBusiness.convertQuote=(...args)=>{convertQuoteWithoutMuhurat(...args);VivahMuhurat.attachBookingConfirmation(args[0]);};
