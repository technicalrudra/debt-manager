import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private _client!: SupabaseClient;

  constructor() {
    const url = environment.supabaseUrl;
    const key = environment.supabaseAnonKey;

    if (url && key && url.startsWith('http') && !url.includes('YOUR_SUPABASE')) {
      // Each browser window/tab gets a unique storage key so that BroadcastChannel
      // (used by Supabase for cross-tab sync) is scoped to that window only.
      // Without this, signing in on a regular window would push the session to any
      // incognito window open on the same origin via the shared BroadcastChannel.
      let windowKey = window.sessionStorage.getItem('_sb_window_key');
      if (!windowKey) {
        windowKey = crypto.randomUUID();
        window.sessionStorage.setItem('_sb_window_key', windowKey);
      }

      this._client = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: window.sessionStorage,
          storageKey: `sb-auth-${windowKey}`
        }
      });
    } else {
      console.warn(
        '⚠️ Supabase is not configured. Open src/environments/environment.ts and set supabaseUrl and supabaseAnonKey.'
      );
      // Create a no-op placeholder so the app doesn't crash
      this._client = createClient('https://placeholder.supabase.co', 'placeholder-key');
    }
  }

  get client(): SupabaseClient {
    return this._client;
  }
}
