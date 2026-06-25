import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { PreferencesService } from '../../core/services/preferences.service';
import { ThemeService } from '../../core/services/theme.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const pw = control.get('newPassword')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return pw && confirm && pw !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  templateUrl: './settings.html',
  styleUrls: ['./settings.scss']
})
export class Settings implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  prefs = inject(PreferencesService);
  theme = inject(ThemeService);

  savingPassword = signal(false);
  showCurrentPw = signal(false);
  showNewPw = signal(false);
  showConfirmPw = signal(false);

  passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  }, { validators: passwordMatchValidator });

  async ngOnInit() {
    // Ensure settings are loaded (shell loads them, but settings may be visited directly)
    if (!this.prefs.settings()) {
      await this.prefs.load();
    }
  }

  async onDarkMode(value: boolean) {
    this.theme.setDark(value);
    await this.prefs.update({ dark_mode: value });
  }

  async onCompactView(value: boolean) {
    this.theme.setCompact(value);
    await this.prefs.update({ compact_view: value });
  }

  async onEmiReminders(value: boolean) {
    await this.prefs.update({ due_date_alerts: value });
  }

  async onEmailAlerts(value: boolean) {
    await this.prefs.update({ email_reminders: value });
  }

  async onPaymentConfirmations(value: boolean) {
    await this.prefs.update({ notifications_enabled: value });
  }

  async changePassword() {
    if (this.passwordForm.invalid) return;
    this.savingPassword.set(true);
    const { newPassword } = this.passwordForm.value;
    const result = await this.authService.updatePassword(newPassword!);
    this.savingPassword.set(false);

    if (result.success) {
      this.snackBar.open('Password updated successfully.', 'Close', { duration: 3000, panelClass: 'snack-success' });
      this.passwordForm.reset();
    } else {
      this.snackBar.open(result.error ?? 'Failed to update password.', 'Close', { duration: 4000, panelClass: 'snack-error' });
    }
  }
}
