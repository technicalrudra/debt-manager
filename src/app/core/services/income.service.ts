import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface Income {
  id?: string;
  user_id?: string;
  type?: string;
  source_name: string;
  amount: number;
  frequency: string;
  recurring: boolean;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class IncomeService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  incomeSources = signal<Income[]>([]);

  async loadIncome() {
    const user = this.auth.currentUser();
    if (!user) return;

    const { data, error } = await this.supabase.client
      .from('income_sources')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      this.incomeSources.set(data as Income[]);
    }
  }

  async addIncome(income: Income) {
    const user = this.auth.currentUser();
    if (!user) return;

    const { data, error } = await this.supabase.client
      .from('income_sources')
      .insert({ ...income, user_id: user.id })
      .select()
      .single();

    if (!error && data) {
      this.incomeSources.update(curr => [data as Income, ...curr]);
    }
    return { data, error };
  }

  async updateIncome(id: string, updates: Partial<Income>) {
    const { data, error } = await this.supabase.client
      .from('income_sources')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      this.incomeSources.update(curr => curr.map(inc => inc.id === id ? { ...inc, ...data } : inc));
    }
    return { data, error };
  }

  async deleteIncome(id: string) {
    const { error } = await this.supabase.client
      .from('income_sources')
      .delete()
      .eq('id', id);

    if (!error) {
      this.incomeSources.update(curr => curr.filter(inc => inc.id !== id));
    }
    return { error };
  }

  getTotalMonthlyIncome(): number {
    return this.incomeSources().reduce((sum, inc) => {
      let monthly = Number(inc.amount);
      if (inc.frequency === 'Weekly') monthly = monthly * 4.33;
      if (inc.frequency === 'Annually') monthly = monthly / 12;
      return sum + monthly;
    }, 0);
  }
}
