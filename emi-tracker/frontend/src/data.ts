import type { EMI } from './types';
const today = new Date();
const nextDue = (day: number) => {
  let d = new Date(today.getFullYear(), today.getMonth(), Math.min(day, new Date(today.getFullYear(), today.getMonth()+1, 0).getDate()));
  if (d < new Date(today.getFullYear(), today.getMonth(), today.getDate())) d = new Date(today.getFullYear(), today.getMonth()+1, Math.min(day, new Date(today.getFullYear(), today.getMonth()+2, 0).getDate()));
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
export const initialEMIs: EMI[] = [
 {id:'bike',name:'Bike EMI',bank:'ICICI',dueDay:5,amount:4954,remaining:36,nextDue:nextDue(5),active:true,frequency:'Monthly'},
 {id:'health',name:'Health',bank:'ICICI',dueDay:3,amount:2396,remaining:null,nextDue:nextDue(3),active:true,frequency:'Monthly'},
 {id:'personal-loan',name:'Personal Loan',bank:'ICICI',dueDay:2,amount:1646,remaining:13,nextDue:nextDue(2),active:true,frequency:'Monthly'},
 {id:'anakha-phone',name:'Anakha Phone',bank:'Not specified',dueDay:2,amount:3148,remaining:6,nextDue:nextDue(2),active:true,frequency:'Monthly'},
 {id:'house',name:'House',bank:'Not specified',dueDay:2,amount:2870,remaining:1,nextDue:nextDue(2),active:true,frequency:'Monthly'},
 {id:'personal',name:'Personal',bank:'Not specified',dueDay:2,amount:2945,remaining:29,nextDue:nextDue(2),active:true,frequency:'Monthly'},
 {id:'my-phone',name:'My Phone',bank:'Not specified',dueDay:1,amount:1811,remaining:7,nextDue:nextDue(1),active:true,frequency:'Monthly'}
];