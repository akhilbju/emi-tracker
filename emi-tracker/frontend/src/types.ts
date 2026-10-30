export type Frequency = 'Monthly' | 'Weekly' | 'Yearly' | 'One-time';
export type EMI = {
  id: string; name: string; bank: string; dueDay: number; amount: number;
  remaining: number | null; nextDue: string; active: boolean; frequency: Frequency;
};
export type Payment = { id: string; emiId: string; emiName: string; dueDate: string; amount: number; status: 'Auto-assumed paid' | 'Paid' | 'Unpaid'; recordedAt: string };
