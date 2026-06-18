export interface Payment {
  id: string;
  user_id: string;
  debt_id: string | null;
  debt_name: string;
  amount: number;
  payment_date: string;
  method: string;
  notes: string;
  created_at: string;
}

export type PaymentInsert = Omit<Payment, 'id' | 'created_at'>;
