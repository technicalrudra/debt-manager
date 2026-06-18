import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface Transaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  type: 'Income' | 'Expense' | 'Payment';
  date: string;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  transactions = signal<Transaction[]>([]);

  async loadTransactions() {
    const user = this.auth.currentUser();
    if (!user) return;

    const { data, error } = await this.supabase.client
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (!error && data) {
      this.transactions.set(data as Transaction[]);
    }
  }
}
