import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { UserSettings } from '../models/subscription.model';

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  settings = signal<UserSettings | null>(null);
  loading = signal(false);

  async load(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) return;

    this.loading.set(true);
    const { data } = await this.supabase.client
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      this.settings.set(data as UserSettings);
    }
    this.loading.set(false);
  }

  async update(patch: Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) return;

    const { data } = await this.supabase.client
      .from('user_settings')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .select()
      .single();

    if (data) {
      this.settings.set(data as UserSettings);
    }
  }
}
