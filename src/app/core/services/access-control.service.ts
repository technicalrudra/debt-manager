import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { MyAccessRow } from '../models/access-control.model';

@Injectable({ providedIn: 'root' })
export class AccessControlService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  moduleKeys = signal<string[]>([]);
  permissionKeys = signal<string[]>([]);
  loadedForUserId = signal<string | null>(null);

  isAdmin = computed(() => this.auth.isAdmin());

  async loadMyAccess(force = false): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) {
      this.clear();
      return;
    }
    if (!force && this.loadedForUserId() === userId) return;

    const { data, error } = await this.supabase.client.rpc('get_my_access');
    if (error) {
      this.clear();
      return;
    }

    const rows = (data || []) as MyAccessRow[];
    this.moduleKeys.set([...new Set(rows.map(row => row.module_key).filter((key): key is string => !!key))]);
    this.permissionKeys.set([...new Set(rows.map(row => row.permission_key).filter((key): key is string => !!key))]);
    this.loadedForUserId.set(userId);
  }

  async hasModule(moduleKey: string): Promise<boolean> {
    if (this.isAdmin()) return true;
    await this.loadMyAccess(true);
    return this.moduleKeys().includes(moduleKey);
  }

  hasModuleSync(moduleKey: string): boolean {
    return this.isAdmin() || this.moduleKeys().includes(moduleKey);
  }

  async hasPermission(permissionKey: string): Promise<boolean> {
    if (this.isAdmin()) return true;
    await this.loadMyAccess();
    return this.permissionKeys().includes(permissionKey);
  }

  clear(): void {
    this.moduleKeys.set([]);
    this.permissionKeys.set([]);
    this.loadedForUserId.set(null);
  }
}
