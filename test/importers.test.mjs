import test from 'node:test';
import assert from 'node:assert/strict';
import XLSX from 'xlsx';
import {pdfLinesToRecords,worksheetRecords,parseExpenseFile} from '../dist/importers.js';
import {normalizeRecords} from '../dist/engine.js';
test('PDF text rows support Kazakh merchants, signed grouped amounts and currencies',()=>{
 const rows=pdfLinesToRecords(['Bank statement','Date Description Amount','2026-09-01 Magnum Market 1 250.50 KZT','02.09.2026 Кофе −950,00 ₸','Closing balance 3000']);
 assert.equal(rows.length,2);assert.equal(normalizeRecords(rows).transactions[0].amount,1250.5);assert.equal(normalizeRecords(rows,{mode:'negative'}).transactions[0].amount,950);
 assert.throws(()=>pdfLinesToRecords(['Scanned page']),/OCR/);
});
test('real XLS/XLSX workbooks preserve dates, numeric amounts, preambles and multiple sheet aliases',()=>{
 for(const bookType of ['xlsx','xls']){
 const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['Statement'],['Date','Description','Amount'],[new Date('2026-09-01T00:00:00Z'),'Magnum',1250.5]]),'Expenses');
 XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['дата','описание','сумма'],['02.09.2026','Кофе',950]]),'Other');
 const decoded=XLSX.read(XLSX.write(wb,{type:'buffer',bookType}),{type:'buffer',cellDates:true});
 const result=normalizeRecords(worksheetRecords(XLSX,decoded));assert.equal(result.transactions.length,2);assert.equal(result.transactions[0].date,'2026-09-01');assert.equal(result.transactions[1].merchant,'Кофе');
 }
});
test('CSV and JSON imports continue to work; unsupported extensions are rejected',async()=>{
 assert.equal((await parseExpenseFile({name:'x.csv',text:async()=>'date,merchant,amount\n2026-09-01,Cafe,10'})).length,1);
 assert.equal((await parseExpenseFile({name:'x.json',text:async()=>'[{"date":"2026-09-01","merchant":"Cafe","amount":10}]'})).length,1);
 await assert.rejects(()=>parseExpenseFile({name:'x.exe'}),/Choose a PDF/);
});
test('Kaspi PDF layout handles short years, amount-first rows, refunds and own-account transfers',()=>{
 const records=pdfLinesToRecords(['Kaspi Gold','Date Amount Transaction Details',
 '21.10.26 - 1 250,50 ₸ Purchases Test Market',
 '20.10.26 + 40 000,00 ₸ Replenishment Test Sender',
 '19.10.26 - 5 000,00 ₸ Transfer to your To Kaspi Deposit','account',
 '18.10.26 + 250,00 ₸ Purchases Test Refund',
 '17.10.26 - 500,00 ₸ Transfers Test Recipient']);
 assert.equal(records.length,5);assert.equal(records.expenseMode,'negative');assert.equal(records.currency,'KZT');
 const r=normalizeRecords(records,{mode:records.expenseMode});assert.equal(r.transactions.length,2);assert.equal(r.income,3);assert.equal(r.invalid,0);assert.equal(r.transactions[0].date,'2026-10-21');assert.equal(r.transactions[0].merchant,'Test Market');assert.equal(r.transactions.reduce((sum,t)=>sum+t.amount,0),1750.5);
});
test('Kaspi parser rejects partially recognized statements instead of silently dropping rows',()=>{
 assert.throws(()=>pdfLinesToRecords(['Kaspi Gold','Date Amount Transaction Details','21.10.26 - 100,00 ₸ Purchases Test Market','20.10.26 unreadable transaction']),/incomplete report/);
});
