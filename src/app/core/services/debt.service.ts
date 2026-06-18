import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Debt, DebtInsert, DebtUpdate } from '../models/debt.model';

@Injectable({
  providedIn: 'root'
})
export class DebtService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  debts = signal<Debt[]>([]);
  loading = signal(false);

  async loadDebts(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    this.loading.set(true);
    const { data, error } = await this.supabase.client
      .from('debts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (data && !error) {
      this.debts.set(data as Debt[]);
    }
    this.loading.set(false);
  }

  async addDebt(debt: Omit<DebtInsert, 'user_id'>): Promise<boolean> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return false;

    const { error } = await this.supabase.client
      .from('debts')
      .insert({ ...debt, user_id: userId });

    if (!error) {
      await this.loadDebts();
      return true;
    }
    return false;
  }

  async updateDebt(id: string, updates: DebtUpdate): Promise<boolean> {
    const { error } = await this.supabase.client
      .from('debts')
      .update(updates)
      .eq('id', id);

    if (!error) {
      await this.loadDebts();
      return true;
    }
    return false;
  }

  async deleteDebt(id: string): Promise<boolean> {
    const { error } = await this.supabase.client
      .from('debts')
      .delete()
      .eq('id', id);

    if (!error) {
      await this.loadDebts();
      return true;
    }
    return false;
  }

  getTotalDebtBalance(): number {
    return this.debts().reduce((sum, d) => sum + Number(d.current_balance), 0);
  }

  getTotalMonthlyEmi(): number {
    return this.debts().reduce((sum, d) => sum + Number(d.emi), 0);
  }
}
