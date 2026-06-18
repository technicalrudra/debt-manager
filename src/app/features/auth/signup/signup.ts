import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatCardModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './signup.html',
  styleUrls: ['./signup.scss']
})
export class Signup {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  signupForm: FormGroup;
  loading = signal(false);
  hidePassword = signal(true);
  hideConfirm = signal(true);
  errorMessage = signal('');
  registrationComplete = signal(false);

  constructor() {
    this.signupForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

  async onSubmit() {
    if (this.signupForm.invalid) return;

    const { fullName, email, password, confirmPassword } = this.signupForm.value;

    if (password !== confirmPassword) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const result = await this.authService.signUp(email, password, fullName);
    this.loading.set(false);

    if (result.success) {
      this.registrationComplete.set(true);
      this.toast.success('Registration submitted! Awaiting admin approval.');
    } else {
      // Improve Supabase error messages for users
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
