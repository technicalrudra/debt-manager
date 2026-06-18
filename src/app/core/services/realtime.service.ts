import { Injectable, inject, OnDestroy } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { DebtService } from './debt.service';
import { PaymentService } from './payment.service';
import { ExpenseService } from './expense.service';
import { RealtimeChannel } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class RealtimeService implements OnDestroy {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);
  private debtService = inject(DebtService);
  private paymentService = inject(PaymentService);
  private expenseService = inject(ExpenseService);

  private channels: RealtimeChannel[] = [];

  subscribeToUserData(): void {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    this.unsubscribeAll();

    // Debts channel
    const debtsChannel = this.supabase.client
      .channel('debts-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'debts',
        filter: `user_id=eq.${userId}`
      }, () => {
        this.debtService.loadDebts();
      })
      .subscribe();
    this.channels.push(debtsChannel);

    // Payments channel
    const paymentsChannel = this.supabase.client
      .channel('payments-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'payments',
        filter: `user_id=eq.${userId}`
      }, () => {
        this.paymentService.loadPayments();
      })
      .subscribe();
    this.channels.push(paymentsChannel);

    // Expenses channel
    const expensesChannel = this.supabase.client
      .channel('expenses-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'expenses',
        filter: `user_id=eq.${userId}`
      }, () => {
        this.expenseService.loadExpenses();
      })
      .subscribe();
    this.channels.push(expensesChannel);
  }

  unsubscribeAll(): void {
    this.channels.forEach(ch => {
      this.supabase.client.removeChannel(ch);
    });
    this.channels = [];
  }

  ngOnDestroy(): void {
    this.unsubscribeAll();
  }
}
