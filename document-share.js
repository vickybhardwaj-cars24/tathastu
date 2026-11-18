/* One print-window share control for receipts, invoices, quotations and later documents. */
const DocumentShare=(()=>{
  const safeName=v=>String(v||'Document').replace(/[^a-z0-9._-]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,80)||'Document';
  const pdfURL=new URL('vendor/html2pdf.bundle.min.js',location.href).href;
  function record(meta){return meta.kind&&Number.isInteger(meta.index)?({walkin:DB.walkins,event:DB.events,quote:DB.quotes})[meta.kind]?.[meta.index]:null;}
  function wording(meta){
    const r=record(meta),p=r?SmartMessaging.prepare(meta.kind,meta.index):null;
    const name=r?.name||r?.customerName||meta.name||'Customer',phone=r?.phone||meta.phone||'';
    const link=SmartMessaging.config().instagramLink,kind=meta.label||'document',number=meta.number||'';
    let body;
    if(meta.type==='advance')body=`Hello ${name}! Your advance payment receipt ${number} for ${r?.eventType||'your booking'} is attached. Advance received: ${fmtINR(Number(meta.payment)||0)}. Remaining balance: ${fmtINR(Number(meta.balance)||0)}. Thank you for choosing Tathastu Weddings! Our work: ${link}`;
    else if(meta.type==='payment')body=`Hello ${name}! We received your payment of ${fmtINR(Number(meta.payment)||0)}. Your ${kind.toLowerCase()} ${number} is attached. Remaining balance: ${fmtINR(Number(meta.balance)||0)}. Thank you for choosing Tathastu Weddings! Our work: ${link}`;
    else if(meta.type==='quotation')body=`Hello ${name}! Your quotation ${number} is attached. Please review it and let us know if you have any questions. Explore our latest work: ${link}`;
    else body=`Your ${kind.toLowerCase()} ${number} is attached.\n\n${p?.template.body||`Hello ${name}! Thank you for choosing Tathastu Weddings! Our work: ${link}`}`;
    return {name,phone,body,prepared:p||{phone,reviewAllowed:false}};
  }
  function pdfSource(win){
    const body=win.document.body,source=win.document.createElement('div'),style=win.getComputedStyle(body);
    for(const key of ['fontFamily','fontSize','fontWeight','lineHeight','color','backgroundColor','padding','boxSizing','textAlign'])source.style[key]=style[key];
    source.style.width=style.width;source.style.maxWidth=style.maxWidth;source.style.margin='0 auto';
    for(const child of body.childNodes){if(child.nodeType===1&&child.matches('.np,.actions,.doc-share-panel'))continue;source.appendChild(child.cloneNode(true));}
    source.querySelectorAll('.np,.actions,.doc-share-panel').forEach(el=>el.remove());
    return source;
  }
  function readyImages(win){return Promise.all([...win.document.images].map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});setTimeout(resolve,3000);})));}
  async function makeFile(win,meta){
    await readyImages(win);
    const options={margin:meta.paper==='a5'?8:10,filename:safeName(meta.label)+'-'+safeName(meta.number)+'.pdf',image:{type:'jpeg',quality:0.96},html2canvas:{scale:2,useCORS:true,backgroundColor:'#ffffff'},jsPDF:{unit:'mm',format:meta.paper||'a4',orientation:'portrait',compress:true},pagebreak:{mode:['css','legacy']}};
    const blob=await win.html2pdf().set(options).from(pdfSource(win)).outputPdf('blob');
    if(!blob||blob.size<1000)throw new Error('PDF generation failed');
    return new win.File([blob],options.filename,{type:'application/pdf'});
  }
  function download(win,file){const url=win.URL.createObjectURL(file),a=win.document.createElement('a');a.href=url;a.download=file.name;win.document.body.appendChild(a);a.click();a.remove();setTimeout(()=>win.URL.revokeObjectURL(url),60000);}
  function validPhone(raw){const digits=SmartMessaging.cleanPhone(raw);return /^\d{10}$/.test(digits)?'91'+digits:/^\d{11,15}$/.test(digits)?digits:'';}
  function attach(win,meta={}){
    if(!win||win.closed)return false;
    const doc=win.document,actions=doc.querySelector('.np,.actions');if(!actions)return false;
    actions.setAttribute('data-html2canvas-ignore','true');
    const shareButton=doc.createElement('button');shareButton.type='button';shareButton.textContent='Send on WhatsApp';shareButton.style.cssText='background:#25d366;color:#082612;border:0;border-radius:5px;padding:9px 16px;margin:5px;cursor:pointer;font:600 12px Arial';
    actions.appendChild(shareButton);
    const panel=doc.createElement('div');panel.className='doc-share-panel';panel.setAttribute('data-html2canvas-ignore','true');panel.style.cssText='display:none;border:1px solid #ddd;border-radius:8px;padding:14px;margin:14px auto;max-width:480px;background:#fff;color:#171717;font:12px/1.5 Arial;text-align:left';
    panel.innerHTML='<b>Preview before sharing</b><div style="margin:8px 0"><label>Customer WhatsApp number<br><input type="tel" class="doc-share-phone" style="width:100%;padding:8px;border:1px solid #bbb;border-radius:4px" placeholder="Enter mobile number"></label></div><label>Message<br><textarea class="doc-share-message" rows="7" style="width:100%;padding:8px;border:1px solid #bbb;border-radius:4px"></textarea></label><p class="doc-share-status" role="status" style="color:#555;margin:8px 0">Preparing PDF…</p><p style="font-size:11px;color:#555">On supported devices, choose WhatsApp and the customer in the share sheet. On desktop, download the PDF and attach it in the WhatsApp chat.</p><div style="display:flex;flex-wrap:wrap;gap:6px"><button type="button" class="doc-share-native" disabled style="padding:8px 12px;background:#25d366;color:#082612;border:0;border-radius:4px;cursor:pointer">Confirm &amp; share PDF</button><button type="button" class="doc-share-fallback" disabled style="padding:8px 12px;background:#171717;color:#fff;border:0;border-radius:4px;cursor:pointer">Download PDF + open chat</button><button type="button" class="doc-share-mark" hidden style="padding:8px 12px;background:#176b34;color:#fff;border:0;border-radius:4px;cursor:pointer">Mark sent</button><button type="button" class="doc-share-reset" hidden style="padding:8px 12px;background:#eee;border:0;border-radius:4px;cursor:pointer">Not sent / retry</button><button type="button" class="doc-share-close" style="padding:8px 12px;background:#eee;border:0;border-radius:4px;cursor:pointer">Cancel</button></div>';
    actions.after(panel);
    const message=wording(meta),phoneInput=panel.querySelector('.doc-share-phone'),messageInput=panel.querySelector('.doc-share-message'),status=panel.querySelector('.doc-share-status'),native=panel.querySelector('.doc-share-native'),fallback=panel.querySelector('.doc-share-fallback');
    phoneInput.value=message.phone;messageInput.value=message.body;
    let file=null,attempt=null,nativePossible=false;
    shareButton.addEventListener('click',()=>{panel.style.display='block';panel.scrollIntoView({block:'nearest'});});
    panel.querySelector('.doc-share-close').addEventListener('click',()=>{panel.style.display='none';});
    function review(){const body=messageInput.value.trim(),phone=validPhone(phoneInput.value);if(!body){win.alert('Write a message first.');return null;}if(!phone){win.alert('Enter a valid customer WhatsApp number.');return null;}if(!SmartMessaging.canOpen(body,{...message.prepared,phone:phoneInput.value}))return null;return {body,phone};}
    const mark=panel.querySelector('.doc-share-mark'),reset=panel.querySelector('.doc-share-reset');
    function logAttempt(result,data){
      DB.messages=DB.messages||[];
      const p=message.prepared;
      attempt={id:'msg-doc-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),phone:data.phone,customerName:message.name,context:meta.kind||'document',sourceId:p.sourceId||'',stage:p.stage||meta.type||'document',template:meta.label||'Document',body:data.body,reviewRequest:p.reviewAllowed&&SmartMessaging.reviewBody(data.body),documentNumber:meta.number||'',documentName:file.name,status:result,createdAt:new Date().toISOString()};
      if(attempt.reviewRequest)DB.messages.filter(m=>m.status==='Pending'&&SmartMessaging.cleanPhone(m.phone)===SmartMessaging.cleanPhone(data.phone)&&SmartMessaging.reviewBody(m.body)).forEach(m=>m.status='Superseded');
      DB.messages.push(attempt);save();native.disabled=true;fallback.disabled=true;mark.hidden=false;reset.hidden=false;
    }
    native.addEventListener('click',async()=>{const data=review();if(!data||!file)return;if(!win.confirm(`Share ${file.name} for ${message.name} (${data.phone})? Confirm the WhatsApp recipient before sending.`))return;try{await win.navigator.share({files:[file],title:file.name,text:data.body});logAttempt('Opened Share Sheet',data);status.textContent='Share sheet completed. Mark sent only after you confirm delivery in WhatsApp.';}catch(err){if(err?.name!=='AbortError')status.textContent='File sharing failed. Use Download PDF + open chat below.';}});
    fallback.addEventListener('click',()=>{const data=review();if(!data||!file)return;if(!win.confirm(`Download ${file.name} and open WhatsApp for ${data.phone}? Attach the downloaded PDF in the chat before sending.`))return;download(win,file);const chat=win.open('https://wa.me/'+data.phone+'?text='+encodeURIComponent(data.body),'_blank');logAttempt('Opened WhatsApp',data);status.textContent=chat?'PDF downloaded and WhatsApp opened. Attach the PDF, then mark sent after sending.':'PDF downloaded. Allow pop-ups, open WhatsApp and attach the PDF before sending.';});
    mark.addEventListener('click',()=>{if(!attempt)return;attempt.status='Marked sent';attempt.sentAt=new Date().toISOString();if(attempt.stage==='quoteShare'&&meta.kind==='quote'){const q=DB.quotes.find(x=>x.id===attempt.sourceId);if(q&&q.status==='Draft')q.status='Sent';}save();mark.hidden=true;reset.hidden=true;status.textContent='Marked sent. This does not verify delivery automatically.';});
    reset.addEventListener('click',()=>{if(!attempt)return;attempt.status='Not sent';save();attempt=null;mark.hidden=true;reset.hidden=true;native.disabled=!nativePossible;fallback.disabled=false;status.textContent='Not sent. You can try sharing again.';});
    for(const img of doc.querySelectorAll('img[src="logo.png"]'))img.src=new URL('logo.png',location.href).href;
    const script=doc.createElement('script');script.src=pdfURL;script.onload=()=>{makeFile(win,meta).then(result=>{file=result;fallback.disabled=false;nativePossible=!!win.navigator.share&&!!win.navigator.canShare?.({files:[file]});native.disabled=!nativePossible;status.textContent=nativePossible?'PDF ready. Share the file and choose WhatsApp, or use the direct chat option.':'PDF ready. Download it and attach it in WhatsApp.';}).catch(err=>{status.textContent='Could not create PDF. Use Print / Save as PDF, then attach it manually.';});};script.onerror=()=>{status.textContent='PDF tool unavailable. Use Print / Save as PDF, then attach it manually.';};doc.head.appendChild(script);
    return true;
  }
  return {attach,wording,pdfSource,validPhone};
})();
