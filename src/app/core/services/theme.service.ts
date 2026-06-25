import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly DARK_KEY = '_app_dark';
  private readonly COMPACT_KEY = '_app_compact';

  isDark = signal(false);
  isCompact = signal(false);

  constructor() {
    // Restore instantly from localStorage before Supabase loads so there's no flash
    this.applyDark(localStorage.getItem(this.DARK_KEY) === 'true');
    this.applyCompact(localStorage.getItem(this.COMPACT_KEY) === 'true');
  }

  /** Called by PreferencesService after loading saved settings from Supabase */
  applyFromSettings(dark: boolean, compact: boolean): void {
    this.setDark(dark);
    this.setCompact(compact);
  }

  setDark(value: boolean): void {
    this.applyDark(value);
    localStorage.setItem(this.DARK_KEY, String(value));
  }

  setCompact(value: boolean): void {
    this.applyCompact(value);
    localStorage.setItem(this.COMPACT_KEY, String(value));
  }

  private applyDark(value: boolean): void {
    this.isDark.set(value);
    if (value) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  private applyCompact(value: boolean): void {
    this.isCompact.set(value);
    if (value) {
      document.body.classList.add('compact-mode');
    } else {
      document.body.classList.remove('compact-mode');
    }
  }
}
