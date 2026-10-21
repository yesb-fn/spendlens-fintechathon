import {parseCSV} from './engine.js';
const datePattern = '(?:\\d{4}-\\d{2}-\\d{2}|\\d{1,2}[./-]\\d{1,2}[./-]\\d{4})';
function statementDate(value){
 const m=value.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2}|\d{4})$/);
 if(!m)return value;
 const year=m[3].length===2?String(Number(m[3])+(Number(m[3])<70?2000:1900)):m[3];
 return `${year}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
}
export function pdfLinesToRecords(lines) {
 const records=[];
 const isKaspi=lines.some(line=>/Kaspi Gold/i.test(line))&&lines.some(line=>/Date\s+Amount\s+Transaction\s+Details/i.test(line));
 if(isKaspi){
  const bankRow=/^\s*(\d{1,2}\.\d{1,2}\.\d{2,4})\s+([+−-]\s*[\d ,\u00a0]+[.,]\d{2})\s*₸\s+(.+)$/;
  const operation=/^(Transfer to your(?: account)?|Receipt from your(?: account)?|Transfers to your accounts|Receipts from your accounts|Replenishment|Purchases|Transfers|Withdrawals|Others|Пополнение|Покупки|Переводы|Снятия|Разное)\s+(.+)$/i;
  let dated=0;
  for(const line of lines){
   if(!/^\s*\d{1,2}\.\d{1,2}\.\d{2,4}\s/.test(line))continue;
   dated++;const m=line.match(bankRow);const detail=m?.[3].match(operation);
   if(!m||!detail)continue;
   const amount=m[2].replace(/−/g,'-');const internal=/to your|from your/i.test(detail[1]);
   records.push({date:statementDate(m[1]),merchant:detail[2].trim(),amount,type:internal?'internal transfer':/^\s*\+/.test(amount)?'income':'expense'});
  }
  if(records.length!==dated)throw new Error('Some Kaspi transaction rows could not be read. Please export this statement as Excel or CSV to avoid an incomplete report.');
  if(records.length){records.expenseMode='negative';records.currency='KZT';records.format='Kaspi Gold';return records;}
 }
 const pattern=new RegExp('^\\s*('+datePattern+')\\s+(.+?)\\s+([+−-]?\\s*(?:\\d{1,3}(?:[ ,\\u00a0]\\d{3})+|\\d+)(?:[.,]\\d{1,2})?)(?:\\s*(?:KZT|USD|EUR|GBP|₸|₽|₴|€|£|\\$))?\\s*$','i');
 for(const line of lines){const m=line.match(pattern);if(m)records.push({date:m[1],merchant:m[2].trim(),amount:m[3].replace(/−/g,'-')});}
 if(!records.length)throw new Error('No supported transaction table found. Kaspi Gold statements and text tables with date, description and amount are supported. Scanned PDFs need OCR; try an Excel or CSV export.');
 return records;
}
export function worksheetRecords(XLSX,workbook){
 const records=[];
 for(const name of workbook.SheetNames){
  const rows=XLSX.utils.sheet_to_json(workbook.Sheets[name],{header:1,raw:true,defval:''});
  const header=rows.findIndex(row=>row.some(v=>/^(date|transaction[ _-]?date|дата)$/i.test(String(v).trim()))&&row.some(v=>/^(amount|expense|value|sum|debit|сумма)$/i.test(String(v).trim())));
  if(header<0)continue;
  const aliases={date:['date','transactiondate','transaction date','дата'],merchant:['merchant','description','payee','name','vendor','details','описание'],amount:['amount','expense','value','sum','debit','сумма'],category:['category','категория'],type:['type','transactiontype','transaction type']};
  const keys=rows[header].map(v=>{const label=String(v).trim().toLowerCase().replace(/[_-]/g,' ');return Object.keys(aliases).find(key=>aliases[key].includes(label))||String(v).trim();});
  for(const row of rows.slice(header+1)){if(!row.some(v=>String(v).trim()))continue;records.push(Object.fromEntries(keys.map((key,i)=>[key,row[i] instanceof Date?row[i].toISOString().slice(0,10):(row[i]??'')])));if(records.length>30000)throw new Error('Please use up to 30,000 rows per file.');}
 }
 if(!records.length)throw new Error('No transaction sheet found. Excel needs columns: date, merchant (or description), amount.');
 return records;
}
export async function parseExpenseFile(file){
 const ext=file.name.split('.').pop().toLowerCase();
 if(ext==='csv')return parseCSV(await file.text());
 if(ext==='json'){const parsed=JSON.parse(await file.text());const records=Array.isArray(parsed)?parsed:parsed.transactions;if(!Array.isArray(records))throw new Error('JSON must contain a transaction array.');return records;}
 if(ext==='xlsx'||ext==='xls'){
  await import('./vendor/xlsx.full.min.js');
  return worksheetRecords(globalThis.XLSX,globalThis.XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:true,dateNF:'yyyy-mm-dd'}));
 }
 if(ext==='pdf'){
  const pdfjs=await import('./vendor/pdf.mjs');pdfjs.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdf.worker.mjs',import.meta.url).href;
  let task;
  try{
   task=pdfjs.getDocument({data:await file.arrayBuffer(),isEvalSupported:false,useSystemFonts:true});
   task.onPassword=()=>task.destroy();
   const pdf=await task.promise;if(pdf.numPages>100)throw new Error('Please use a PDF with up to 100 pages.');
   const lines=[];
   for(let i=1;i<=pdf.numPages;i++){
    const page=await pdf.getPage(i);const content=await page.getTextContent();const rows=[];
    for(const item of content.items){if(!item.str?.trim())continue;const y=item.transform[5];let row=rows.find(r=>Math.abs(r.y-y)<3);if(!row){row={y,items:[]};rows.push(row);}row.items.push(item);}
    rows.sort((a,b)=>b.y-a.y);for(const row of rows)lines.push(row.items.sort((a,b)=>a.transform[4]-b.transform[4]).map(t=>t.str).join(' '));
    page.cleanup();
   }
   return pdfLinesToRecords(lines);
  }catch(e){if(/password|destroyed/i.test(e.message))throw new Error('This PDF is password-protected. Upload an unlocked copy.');throw e;}finally{if(task)await task.destroy();}
 }
 throw new Error('Choose a PDF, Excel (.xlsx or .xls), CSV or JSON file.');
}
