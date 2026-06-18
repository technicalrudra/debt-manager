import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Expense, ExpenseInsert, ExpenseUpdate } from '../models/expense.model';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  expenses = signal<Expense[]>([]);
  loading = signal(false);

  async loadExpenses(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    this.loading.set(true);
    const { data, error } = await this.supabase.client
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (data && !error) {
      this.expenses.set(data as Expense[]);
    }
    this.loading.set(false);
  }

  async addExpense(expense: Omit<ExpenseInsert, 'user_id'>): Promise<boolean> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return false;

    const { error } = await this.supabase.client
      .from('expenses')
      .insert({ ...expense, user_id: userId });

    if (!error) {
      await this.loadExpenses();
      return true;
    }
    return false;
  }

  async updateExpense(id: string, updates: ExpenseUpdate): Promise<boolean> {
    const { error } = await this.supabase.client
      .from('expenses')
      .update(updates)
      .eq('id', id);

    if (!error) {
      await this.loadExpenses();
      return true;
    }
    return false;
  }

  async deleteExpense(id: string): Promise<boolean> {
    const { error } = await this.supabase.client
      .from('expenses')
      .delete()
      .eq('id', id);

    if (!error) {
      await this.loadExpenses();
      return true;
    }
    return false;
  }

  getTotalExpenses(): number {
    return this.expenses().reduce((sum, e) => sum + Number(e.amount), 0);
  }
}
