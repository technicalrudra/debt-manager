export interface Debt {
  id: string;
  user_id: string;
  name: string;
  type: string;
  lender: string;
  original_amount: number;
  current_balance: number;
  interest_rate: number;
  emi: number;
  tenure: number;
  due_date: number;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Active' | 'Closed';
  created_at: string;
  updated_at: string;
}

export type DebtInsert = Omit<Debt, 'id' | 'created_at' | 'updated_at'>;
export type DebtUpdate = Partial<Omit<Debt, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
