import type { EMI, Payment } from './types';
import { initialEMIs } from './data';
const EMI_KEY='emi-tracker-v1'; const PAY_KEY='emi-payments-v1';
export function loadEMIs(): EMI[] { try { const raw=localStorage.getItem(EMI_KEY); return raw ? (JSON.parse(raw) as EMI[]).map(e=>({...e,frequency:e.frequency||'Monthly',bank:e.bank||'Not specified',dueDay:e.dueDay||Number((e.nextDue||'').slice(-2))||1})) : initialEMIs; } catch { return initialEMIs; } }
export function saveEMIs(v: EMI[]) { localStorage.setItem(EMI_KEY,JSON.stringify(v)); }
export function loadPayments(): Payment[] { try { return JSON.parse(localStorage.getItem(PAY_KEY)||'[]'); } catch { return []; } }
export function savePayments(v: Payment[]) { localStorage.setItem(PAY_KEY,JSON.stringify(v)); }
const dateOnly=(d: Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export function addOccurrence(date:string, frequency:EMI['frequency']) {
 const d=new Date(date+'T12:00:00');
 if(frequency==='Weekly') d.setDate(d.getDate()+7);
 else if(frequency==='Yearly') d.setFullYear(d.getFullYear()+1);
 else if(frequency==='Monthly') { const day=d.getDate(); d.setDate(1); d.setMonth(d.getMonth()+1); d.setDate(Math.min(day,new Date(d.getFullYear(),d.getMonth()+1,0).getDate())); }
 return dateOnly(d);
}
export function reconcile(emis: EMI[], history: Payment[], now=new Date()) {
 const today=dateOnly(now); const payments=[...history]; const updated=emis.map(e=>{
   if(!e.active) return e;
   let next=e.nextDue; let remaining=e.remaining; let safety=0;
   while(next < today && safety++ < 240 && e.frequency!=='One-time') {
     if(!payments.some(p=>p.emiId===e.id && p.dueDate===next)) payments.push({id:`${e.id}-${next}`,emiId:e.id,emiName:e.name,dueDate:next,amount:e.amount,status:'Auto-assumed paid',recordedAt:today});
     if(remaining!==null) remaining=Math.max(0,remaining-1);
     next=addOccurrence(next,e.frequency);
     if(remaining===0) return {...e,remaining,nextDue:next,active:false};
   }
   if(e.frequency==='One-time' && next<today) return {...e,remaining:0,active:false};
   return {...e,remaining,nextDue:next};
 });
 return {emis:updated,payments};
}
export function markPayment(emi: EMI, status: Payment['status'], emis: EMI[], history: Payment[]) {
 const due=emi.nextDue; if(history.some(p=>p.emiId===emi.id&&p.dueDate===due)) return {emis,history};
 const payment:Payment={id:`${emi.id}-${due}`,emiId:emi.id,emiName:emi.name,dueDate:due,amount:emi.amount,status,recordedAt:dateOnly(new Date())};
 let next=due; let remaining=emi.remaining;
 if(status==='Paid'||status==='Auto-assumed paid') {
   if(remaining!==null) remaining=Math.max(0,remaining-1);
   next=addOccurrence(due,emi.frequency);
 }
 const updated=emis.map(e=>e.id===emi.id?{...e,remaining,nextDue:next,active:remaining!==0 && e.frequency!=='One-time'}:e);
 return {emis:updated,history:[payment,...history]};
}