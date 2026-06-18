import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Profile, ProfileUpdate } from '../models/profile.model';
import { IncomeSource, IncomeSourceInsert } from '../models/subscription.model';

@Injectable({
  providedIn: 'root'
})
export class UserDataService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  profile = signal<Profile | null>(null);
  incomeSources = signal<IncomeSource[]>([]);

  onboardingCompleted = computed(() => this.profile()?.onboarding_completed ?? false);

  totalMonthlyIncome = computed(() => {
    return this.incomeSources().reduce((sum, src) => sum + Number(src.amount), 0);
  });

  async loadProfile(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    const { data } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data) {
      this.profile.set(data as Profile);
    }
  }

  async saveProfile(updates: ProfileUpdate): Promise<boolean> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return false;

    const { error } = await this.supabase.client
      .from('profiles')
      .update(updates)
      .eq('user_id', userId);

    if (!error) {
      await this.loadProfile();
      return true;
    }
    return false;
  }

  async setOnboardingCompleted(val: boolean): Promise<void> {
    await this.saveProfile({ onboarding_completed: val });
  }

  // Income Sources
  async loadIncomeSources(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    const { data } = await this.supabase.client
      .from('income_sources')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (data) {
      this.incomeSources.set(data as IncomeSource[]);
    }
  }

  async addIncome(source: Omit<IncomeSourceInsert, 'user_id'>): Promise<boolean> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return false;

    const { error } = await this.supabase.client
      .from('income_sources')
      .insert({ ...source, user_id: userId });

    if (!error) {
      await this.loadIncomeSources();
      return true;
    }
    return false;
  }

  async removeIncome(id: string): Promise<boolean> {
    const { error } = await this.supabase.client
      .from('income_sources')
      .delete()
      .eq('id', id);

    if (!error) {
      await this.loadIncomeSources();
      return true;
    }
    return false;
  }

  async loadAll(): Promise<void> {
    await Promise.all([
      this.loadProfile(),
      this.loadIncomeSources()
    ]);
  }
}
