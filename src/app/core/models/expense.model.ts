export interface Expense {
  id: string;
  user_id: string;
  category: string;
  description: string;
  amount: number;
  frequency: string;
  start_date: string;
  recurring: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

export type ExpenseInsert = Omit<Expense, 'id' | 'created_at' | 'updated_at'>;
export type ExpenseUpdate = Partial<Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
