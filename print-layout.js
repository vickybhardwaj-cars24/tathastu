/* Shared, printable presentation for bills and quotations. No data writes. */
const TathastuPrint=(()=>{
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const amount=v=>'₹'+Number(v||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
  function documentHTML({kind,number,date,customer,phone,subtitle,details=[],items=[],subtotal,discount,tax,total,paid,balance,note,validUntil,booked}){
    const quotation=kind==='Quotation';
    const logo=new URL('logo.png',location.href).href;
    const rows=items.length?items:[{name:subtitle||'Photography services',quantity:1,unitPrice:Number(total)||0}];
    const safeNum=esc(number),safeKind=esc(kind);
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${safeKind} ${safeNum}</title><style>
      *{box-sizing:border-box}body{font:12px/1.55 Arial,sans-serif;color:#171717;background:#fff;max-width:680px;margin:20px auto;padding:20px 26px}
      .header{text-align:center;border-bottom:2px solid #171717;padding-bottom:12px;margin-bottom:12px}.header img{width:58px;height:58px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 7px}
      .header h1{font:700 23px Georgia,serif;letter-spacing:1px;margin:0}.header p{font-size:10px;color:#666;margin:2px 0}
      .title{text-align:center;letter-spacing:3px;font-weight:700;font-size:14px;margin:14px 0 6px}.meta{text-align:right;color:#666;font-size:10px;margin-bottom:12px}
      .section{font-size:10px;letter-spacing:1.5px;color:#777;font-weight:700;text-transform:uppercase;margin:14px 0 5px}
      .pair{display:flex;justify-content:space-between;gap:20px;padding:4px 0;border-bottom:1px solid #eee}.pair span:first-child{color:#666}.pair b{text-align:right;overflow-wrap:anywhere}
      table{width:100%;border-collapse:collapse;table-layout:fixed;margin:8px 0 12px}th{background:#f4f0e7;text-align:left;color:#555;font-size:10px;letter-spacing:.05em;text-transform:uppercase;padding:8px 7px;border-bottom:2px solid #b9923d}td{padding:8px 7px;border-bottom:1px solid #e5e2dd;vertical-align:top;overflow-wrap:anywhere}th:nth-child(2),td:nth-child(2){text-align:center;width:52px}th:nth-child(3),td:nth-child(3),th:nth-child(4),td:nth-child(4){text-align:right;width:100px}
      .totals{margin-left:auto;max-width:300px;border-top:1px dashed #aaa;padding-top:7px}.totals .pair{border:0}.totals .grand{border-top:2px solid #171717;margin-top:5px;padding-top:8px;font-size:16px;font-weight:700}
      .note{border:1px dashed #bbb;border-radius:4px;padding:8px 10px;margin-top:14px;white-space:pre-wrap}.footer{text-align:center;border-top:1px solid #171717;margin-top:20px;padding-top:10px;color:#666;font-size:10px}
      .actions{text-align:center;margin:18px 0}.actions button{background:#171717;color:white;border:0;border-radius:4px;padding:9px 20px;cursor:pointer}
      @page{size:A4;margin:14mm}@media print{body{max-width:none;margin:0;padding:0}.actions{display:none}}
      </style></head><body><div class="header"><img src="${esc(logo)}" alt=""><h1>Tathastu Weddings</h1><p>Photography &amp; Videography Studio</p></div>
      <div class="title">${safeKind.toUpperCase()}</div><div class="meta">No: ${safeNum} &nbsp; | &nbsp; Date: ${esc(date)}</div>
      <div class="section">Customer</div><div class="pair"><span>Name</span><b>${esc(customer)}</b></div>${phone?`<div class="pair"><span>Phone</span><b>${esc(phone)}</b></div>`:''}
      ${details.length?`<div class="section">Details</div>${details.map(([label,value])=>`<div class="pair"><span>${esc(label)}</span><b>${esc(value||'—')}</b></div>`).join('')}`:''}
      <div class="section">${quotation?'Services / package':'Items'}</div><table><thead><tr><th>Description</th><th>Qty</th><th>Unit</th><th>Amount</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.name)}</td><td>${Number(x.quantity)||1}</td><td>${amount(x.unitPrice)}</td><td>${amount((Number(x.quantity)||1)*Number(x.unitPrice||0))}</td></tr>`).join('')}</tbody></table>
      <div class="totals"><div class="pair"><span>Subtotal</span><b>${amount(subtotal??total)}</b></div>${Number(discount)>0?`<div class="pair"><span>Discount</span><b>− ${amount(discount)}</b></div>`:''}${Number(tax)>0?`<div class="pair"><span>Tax</span><b>${amount(tax)}</b></div>`:''}<div class="pair grand"><span>${quotation?'Quoted total':'Total amount'}</span><b>${amount(total)}</b></div>
      ${!quotation||booked?`<div class="pair"><span>Amount paid</span><b>${amount(paid)}</b></div><div class="pair"><span>Balance due</span><b>${amount(balance)}</b></div>`:''}</div>
      ${quotation&&validUntil&&!booked?`<div class="note">Quotation valid until ${esc(validUntil)}. Booking is confirmed only after you approve it with the studio.</div>`:''}
      ${note?`<div class="note">${esc(note)}</div>`:''}<div class="footer"><b>Thank you for choosing Tathastu Weddings!</b><br>${quotation?'We look forward to capturing your special moments.':'Please keep this document for your records.'}</div>
      <div class="actions"><button onclick="window.print()">Print / Save as PDF</button></div></body></html>`;
  }
  function open(data){const win=window.open('','_blank');if(!win){alert('Allow pop-ups to print or save a PDF.');return false;}win.document.write(documentHTML(data));win.document.close();DocumentShare.attach(win,{kind:data.share?.kind,index:data.share?.index,type:data.share?.type||(data.kind==='Quotation'?'quotation':'receipt'),label:data.kind,number:data.number,name:data.customer,phone:data.phone,paper:'a4',payment:data.share?.payment,balance:data.share?.balance});return true;}
  return {documentHTML,open};
})();
