export interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  max_debts: number;
  max_income_sources: number;
  max_goals: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  activated_by: string | null;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  plan?: SubscriptionPlan;
}

export interface Feature {
  id: string;
  key: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface PlanFeature {
  id: string;
  plan_id: string;
  feature_id: string;
  enabled: boolean;
  created_at: string;
  // Joined
  feature?: Feature;
}

export interface UserSettings {
  id: string;
  user_id: string;
  notifications_enabled: boolean;
  email_reminders: boolean;
  due_date_alerts: boolean;
  dark_mode: boolean;
  compact_view: boolean;
  language: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface IncomeSource {
  id: string;
  user_id: string;
  type: string;
  source_name: string;
  amount: number;
  frequency: string;
  recurring: boolean;
  created_at: string;
  updated_at: string;
}

export type IncomeSourceInsert = Omit<IncomeSource, 'id' | 'created_at' | 'updated_at'>;
