import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { SubscriptionPlan, UserSubscription, Feature } from '../models/subscription.model';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  plans = signal<SubscriptionPlan[]>([]);
  currentSubscription = signal<UserSubscription | null>(null);
  userFeatures = signal<string[]>([]);

  currentPlan = computed(() => {
    const sub = this.currentSubscription();
    return sub?.plan || null;
  });

  async loadPlans(): Promise<void> {
    const { data } = await this.supabase.client
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (data) {
      this.plans.set(data as SubscriptionPlan[]);
    }
  }

  async loadCurrentSubscription(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    const { data } = await this.supabase.client
      .from('user_subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (data) {
      this.currentSubscription.set(data as UserSubscription);
    }
  }

  async loadUserFeatures(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    const { data } = await this.supabase.client
      .rpc('get_user_features', { p_user_id: userId });

    if (data) {
      this.userFeatures.set((data as { feature_key: string }[]).map(f => f.feature_key));
    }
  }

  async hasFeature(featureKey: string): Promise<boolean> {
    if (this.userFeatures().length === 0) {
      await this.loadUserFeatures();
    }
    return this.userFeatures().includes(featureKey);
  }

  hasFeatureSync(featureKey: string): boolean {
    return this.userFeatures().includes(featureKey);
  }

  async loadAll(): Promise<void> {
    await Promise.all([
      this.loadPlans(),
      this.loadCurrentSubscription(),
      this.loadUserFeatures()
    ]);
  }
}
