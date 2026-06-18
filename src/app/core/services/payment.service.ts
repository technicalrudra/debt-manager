import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Payment, PaymentInsert } from '../models/payment.model';
import { DebtService } from './debt.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);
  private debtService = inject(DebtService);

  payments = signal<Payment[]>([]);
  loading = signal(false);

  async loadPayments(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    this.loading.set(true);
    const { data, error } = await this.supabase.client
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('payment_date', { ascending: false });

    if (data && !error) {
      this.payments.set(data as Payment[]);
    }
    this.loading.set(false);
  }

  async addPayment(payment: Omit<PaymentInsert, 'user_id'>): Promise<boolean> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return false;

    const { error } = await this.supabase.client
      .from('payments')
      .insert({ ...payment, user_id: userId });

    if (error) return false;

    // Update debt balance if linked
    if (payment.debt_id) {
      const debt = this.debtService.debts().find(d => d.id === payment.debt_id);
      if (debt) {
        const newBalance = Math.max(0, Number(debt.current_balance) - Number(payment.amount));
        await this.debtService.updateDebt(payment.debt_id, {
          current_balance: newBalance,
          status: newBalance === 0 ? 'Closed' : 'Active'
        });
      }
    }

    await this.loadPayments();
    return true;
  }

  async deletePayment(id: string): Promise<boolean> {
    const { error } = await this.supabase.client
      .from('payments')
      .delete()
      .eq('id', id);

    if (!error) {
      await this.loadPayments();
      return true;
    }
    return false;
  }
}
