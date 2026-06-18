import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="container-fluid py-3">
      <div class="page-header mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h1 class="page-title mb-1">Notifications</h1>
          <p class="text-secondary subtitle mb-0">System alerts, new signups, and threshold warnings.</p>
        </div>
        <button mat-stroked-button color="primary">Mark all as read</button>
      </div>

      <mat-card>
        <mat-card-content class="p-4 text-center text-secondary">
          <mat-icon class="opacity-50 mb-2" style="font-size: 3rem; width: 3rem; height: 3rem;">notifications_off</mat-icon>
          <p>You're all caught up! No new notifications.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class AdminNotifications {}
