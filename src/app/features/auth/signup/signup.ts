import { Component, inject, signal, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './signup.html',
  styleUrls: ['./signup.scss']
})
export class Signup {
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  signupForm: FormGroup;
  loading = signal(false);
  hidePassword = signal(true);
  hideConfirm = signal(true);
  errorMessage = signal('');
  registrationComplete = signal(false);

  readonly passwordValue = signal('');

  readonly passwordStrength = computed(() => {
    const pw = this.passwordValue();
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  });

  readonly passwordStrengthLabel = computed(() => {
    if (!this.passwordValue()) return '';
    const s = this.passwordStrength();
    if (s <= 1) return 'Weak';
    if (s === 2) return 'Fair';
    if (s === 3) return 'Good';
    return 'Strong';
  });

  readonly passwordStrengthColor = computed(() => {
    const s = this.passwordStrength();
    if (s <= 1) return '#ef4444';
    if (s === 2) return '#f59e0b';
    if (s === 3) return '#10b981';
    return '#059669';
  });

  readonly hasMinLength = computed(() => this.passwordValue().length >= 8);
  readonly hasSpecialChar = computed(() => /[^A-Za-z0-9]/.test(this.passwordValue()));

  constructor() {
    this.signupForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    });

    this.signupForm.get('password')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.passwordValue.set(v ?? ''));
  }

  async onSubmit() {
    if (this.signupForm.invalid) return;

    const { email, password, confirmPassword } = this.signupForm.value;

    if (password !== confirmPassword) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const result = await this.authService.signUp(email, password, '');
    this.loading.set(false);

    if (result.success) {
      this.registrationComplete.set(true);
      this.toast.success('Registration submitted! Awaiting admin approval.');
    } else {
      let msg = result.error || 'Registration failed. Please try again.';
      if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('email rate')) {
        msg = 'Too many signup attempts. Please wait a few minutes and try again.';
      } else if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('user already exists')) {
        msg = 'An account with this email already exists. Try logging in instead.';
      } else if (msg.toLowerCase().includes('invalid email')) {
        msg = 'Please enter a valid email address.';
      }
      this.errorMessage.set(msg);
      this.toast.error(msg);
    }
  }
}
