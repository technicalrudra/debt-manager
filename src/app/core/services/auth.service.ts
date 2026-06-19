import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { Profile } from '../models/profile.model';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  currentUser = signal<User | null>(null);
  currentSession = signal<Session | null>(null);
  currentProfile = signal<Profile | null>(null);
  loading = signal(true);

  isAuthenticated = computed(() => !!this.currentUser());
  isAdmin = computed(() => this.currentProfile()?.role === 'admin');
  isApproved = computed(() => this.currentProfile()?.status === 'approved');
  userStatus = computed(() => this.currentProfile()?.status || 'pending');
  userRole = computed(() => this.currentProfile()?.role || 'user');

  constructor() {
    this.initAuthListener();
  }

  private async initAuthListener() {
    // Get initial session
    const { data: { session } } = await this.supabase.client.auth.getSession();
    if (session) {
      this.currentSession.set(session);
      this.currentUser.set(session.user);
      await this.loadProfile(session.user.id);
    }
    this.loading.set(false);

    // Listen to auth state changes
    this.supabase.client.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      // Guard: INITIAL_SESSION with no session while we already have a user means
      // a token refresh is in progress — do not wipe the existing auth state.
      if (event === 'INITIAL_SESSION' && !session && this.currentUser()) {
        return;
      }

      this.currentSession.set(session);
      this.currentUser.set(session?.user ?? null);

      if (session?.user) {
        await this.loadProfile(session.user.id);
      } else {
        this.currentProfile.set(null);
      }
    });
  }

  async loadProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data && !error) {
      this.currentProfile.set(data as Profile);
      return data as Profile;
    }
    return null;
  }

  async signUp(email: string, password: string, fullName: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase.client.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string; status?: string }> {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      const profile = await this.loadProfile(data.user.id);
      if (profile) {
        if (profile.status === 'pending') {
          return { success: false, error: 'Your account is pending approval by an administrator.', status: 'pending' };
        }
        if (profile.status === 'rejected') {
          await this.supabase.client.auth.signOut();
          return { success: false, error: 'Your account registration has been rejected.', status: 'rejected' };
        }
        if (profile.status === 'suspended') {
          await this.supabase.client.auth.signOut();
          return { success: false, error: 'Your account has been suspended. Contact support.', status: 'suspended' };
        }
      }
    }

    return { success: true };
  }

  async signOut(): Promise<void> {
    await this.supabase.client.auth.signOut();
    this.currentUser.set(null);
    this.currentSession.set(null);
    this.currentProfile.set(null);
    this.router.navigate(['/login']);
  }

  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase.client.auth.updateUser({
      password: newPassword
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  async refreshProfile(): Promise<void> {
    const user = this.currentUser();
    if (user) {
      await this.loadProfile(user.id);
    }
  }
}
