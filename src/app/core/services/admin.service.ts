import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Profile } from '../models/profile.model';
import { SubscriptionPlan, Feature, PlanFeature, UserSubscription } from '../models/subscription.model';
import {
  AppModule,
  Permission,
  Role,
  RolePermission,
  UserModule,
  UserRole
} from '../models/access-control.model';

export interface AdminStats {
  total_users: number;
  pending_users: number;
  approved_users: number;
  suspended_users: number;
  total_debts: number;
  total_payments: number;
  active_subscriptions: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  users = signal<Profile[]>([]);
  stats = signal<AdminStats | null>(null);
  plans = signal<SubscriptionPlan[]>([]);
  features = signal<Feature[]>([]);
  planFeatures = signal<PlanFeature[]>([]);
  roles = signal<Role[]>([]);
  modules = signal<AppModule[]>([]);
  permissions = signal<Permission[]>([]);
  rolePermissions = signal<RolePermission[]>([]);
  userRoles = signal<UserRole[]>([]);
  userModules = signal<UserModule[]>([]);
  activityLogs = signal<any[]>([]);
  loading = signal(false);

  // ---- User Management ----
  async loadUsers(): Promise<void> {
    this.loading.set(true);
    const { data } = await this.supabase.client
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      this.users.set(data as Profile[]);
    }
    this.loading.set(false);
  }

  async updateUserStatus(userId: string, status: string): Promise<boolean> {
    const { error } = await this.supabase.client.rpc('admin_set_user_status', {
      target_user_id: userId,
      new_status: status
    });

    if (!error) {
      await this.loadUsers();
      return true;
    }
    return false;
  }

  async updateUserRole(userId: string, roleId: string): Promise<boolean> {
    const { error } = await this.supabase.client.rpc('admin_assign_user_role', {
      target_user_id: userId,
      target_role_id: roleId
    });

    if (!error) {
      await Promise.all([this.loadUsers(), this.loadUserRoles()]);
      return true;
    }
    return false;
  }

  async removeUser(userId: string): Promise<boolean> {
    const { error } = await this.supabase.client.rpc('admin_remove_user', {
      target_user_id: userId
    });
    if (!error) {
      await Promise.all([this.loadUsers(), this.loadUserRoles(), this.loadUserModules()]);
      return true;
    }
    return false;
  }

  async assignPlanToUser(userId: string, planId: string): Promise<boolean> {
    // Upsert — if subscription exists, update it; otherwise insert
    const { data: existing } = await this.supabase.client
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .single();

    let error;
    if (existing) {
      ({ error } = await this.supabase.client
        .from('user_subscriptions')
        .update({ plan_id: planId, status: 'active', activated_by: this.auth.currentUser()?.id })
        .eq('user_id', userId));
    } else {
      ({ error } = await this.supabase.client
        .from('user_subscriptions')
        .insert({ user_id: userId, plan_id: planId, status: 'active', activated_by: this.auth.currentUser()?.id }));
    }

    if (!error) {
      await this.logAction('assign_plan', userId, { plan_id: planId });
      return true;
    }
    return false;
  }

  // ---- Stats ----
  async loadStats(): Promise<void> {
    const { data } = await this.supabase.client.rpc('get_admin_stats');
    if (data) {
      this.stats.set(data as AdminStats);
    }
  }

  // ---- Plan Management ----
  async loadPlans(): Promise<void> {
    const { data } = await this.supabase.client
      .from('subscription_plans')
      .select('*')
      .order('sort_order');

    if (data) {
      this.plans.set(data as SubscriptionPlan[]);
    }
  }

  async updatePlan(id: string, updates: Partial<SubscriptionPlan>): Promise<boolean> {
    const { error } = await this.supabase.client
      .from('subscription_plans')
      .update(updates)
      .eq('id', id);

    if (!error) {
      await this.loadPlans();
      return true;
    }
    return false;
  }

  // ---- Feature Management ----
  async loadFeatures(): Promise<void> {
    const { data } = await this.supabase.client
      .from('features')
      .select('*')
      .order('name');

    if (data) {
      this.features.set(data as Feature[]);
    }
  }

  async loadPlanFeatures(): Promise<void> {
    const { data } = await this.supabase.client
      .from('plan_features')
      .select('*, feature:features(*)');

    if (data) {
      this.planFeatures.set(data as PlanFeature[]);
    }
  }

  async togglePlanFeature(planId: string, featureId: string, enabled: boolean): Promise<boolean> {
    // Upsert
    const { data: existing } = await this.supabase.client
      .from('plan_features')
      .select('id')
      .eq('plan_id', planId)
      .eq('feature_id', featureId)
      .single();

    let error;
    if (existing) {
      ({ error } = await this.supabase.client
        .from('plan_features')
        .update({ enabled })
        .eq('plan_id', planId)
        .eq('feature_id', featureId));
    } else {
      ({ error } = await this.supabase.client
        .from('plan_features')
        .insert({ plan_id: planId, feature_id: featureId, enabled }));
    }

    if (!error) {
      await this.loadPlanFeatures();
      return true;
    }
    return false;
  }

  // ---- Roles & Permissions ----
  async loadRoles(): Promise<void> {
    const { data } = await this.supabase.client.from('roles').select('*').order('display_name');
    if (data) this.roles.set(data as Role[]);
  }

  async loadModules(): Promise<void> {
    const { data } = await this.supabase.client.from('modules').select('*').order('sort_order');
    if (data) this.modules.set(data as AppModule[]);
  }

  async updateModule(id: string, updates: Partial<AppModule>): Promise<boolean> {
    const { error } = await this.supabase.client
      .from('modules')
      .update(updates)
      .eq('id', id);

    if (!error) {
      await this.loadModules();
      return true;
    }
    return false;
  }

  async loadPermissions(): Promise<void> {
    const { data } = await this.supabase.client.from('permissions').select('*').order('name');
    if (data) this.permissions.set(data as Permission[]);
  }

  async loadRolePermissions(): Promise<void> {
    const { data } = await this.supabase.client.from('role_permissions').select('*, permission:permissions(*)');
    if (data) this.rolePermissions.set(data as RolePermission[]);
  }

  async loadUserRoles(): Promise<void> {
    const { data } = await this.supabase.client.from('user_roles').select('*, role:roles(*)');
    if (data) this.userRoles.set(data as UserRole[]);
  }

  async loadUserModules(): Promise<void> {
    const { data } = await this.supabase.client.from('user_modules').select('*, module:modules(*)');
    if (data) this.userModules.set(data as UserModule[]);
  }

  async toggleRolePermission(roleId: string, permissionId: string, enabled: boolean): Promise<boolean> {
    if (enabled) {
      const { error } = await this.supabase.client
        .from('role_permissions')
        .insert({ role_id: roleId, permission_id: permissionId });
      if (!error) {
        await this.loadRolePermissions();
        return true;
      }
    } else {
      const { error } = await this.supabase.client
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId)
        .eq('permission_id', permissionId);
      if (!error) {
        await this.loadRolePermissions();
        return true;
      }
    }
    return false;
  }

  async setUserModule(userId: string, moduleId: string, enabled: boolean): Promise<boolean> {
    const { error } = await this.supabase.client.rpc('admin_set_user_module', {
      target_user_id: userId,
      target_module_id: moduleId,
      enabled
    });
    if (!error) {
      await this.loadUserModules();
      return true;
    }
    return false;
  }

  // ---- Audit Log ----
  async loadActivityLogs(): Promise<void> {
    const { data } = await this.supabase.client
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (data) this.activityLogs.set(data);
  }

  private async logAction(action: string, targetUserId: string, details: any): Promise<void> {
    await this.supabase.client
      .from('audit_log')
      .insert({
        admin_id: this.auth.currentUser()?.id,
        action,
        target_user_id: targetUserId,
        details
      });
  }

  async loadAll(): Promise<void> {
    await Promise.all([
      this.loadUsers(),
      this.loadStats(),
      this.loadPlans(),
      this.loadFeatures(),
      this.loadPlanFeatures(),
      this.loadRoles(),
      this.loadModules(),
      this.loadPermissions(),
      this.loadRolePermissions(),
      this.loadUserRoles(),
      this.loadUserModules(),
      this.loadActivityLogs()
    ]);
  }
}
