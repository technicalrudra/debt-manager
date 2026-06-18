import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Goal, GoalInsert, GoalUpdate } from '../models/goal.model';

@Injectable({
  providedIn: 'root'
})
export class GoalService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  goals = signal<Goal[]>([]);
  loading = signal(false);

  async loadGoals(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    this.loading.set(true);
    const { data, error } = await this.supabase.client
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (data && !error) {
      this.goals.set(data as Goal[]);
    }
    this.loading.set(false);
  }

  async addGoal(goal: Omit<GoalInsert, 'user_id'>): Promise<boolean> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return false;

    const { error } = await this.supabase.client
      .from('goals')
      .insert({ ...goal, user_id: userId });

    if (!error) {
      await this.loadGoals();
      return true;
    }
    return false;
  }

  async updateGoal(id: string, updates: GoalUpdate): Promise<boolean> {
    const { error } = await this.supabase.client
      .from('goals')
      .update(updates)
      .eq('id', id);

    if (!error) {
      await this.loadGoals();
      return true;
    }
    return false;
  }

  async deleteGoal(id: string): Promise<boolean> {
    const { error } = await this.supabase.client
      .from('goals')
      .delete()
      .eq('id', id);

    if (!error) {
      await this.loadGoals();
      return true;
    }
    return false;
  }
}
