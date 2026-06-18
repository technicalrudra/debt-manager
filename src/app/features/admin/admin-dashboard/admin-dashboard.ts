import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="container-fluid py-3">
      <div class="page-header mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h1 class="page-title mb-1">Admin Dashboard</h1>
          <p class="text-secondary subtitle mb-0">Platform overview and high-level metrics.</p>
        </div>
        <div class="d-flex gap-2">
          <button mat-stroked-button color="primary" routerLink="/admin/users">Users</button>
          <button mat-stroked-button color="primary" routerLink="/admin/permissions">Permissions</button>
        </div>
      </div>

      <div class="row g-4" *ngIf="stats() as s">
        <div class="col-12 col-md-6 col-xl-3">
          <mat-card class="kpi-card h-100">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div class="kpi-icon-box bg-primary-soft text-primary">
                <mat-icon>people</mat-icon>
              </div>
            </div>
            <div class="kpi-label">Total Users</div>
            <div class="kpi-value">{{ s.total_users }}</div>
            <div class="text-xs text-secondary mt-1">
              <span class="text-success fw-bold">{{ s.approved_users }}</span> approved, 
              <span class="text-warning fw-bold">{{ s.pending_users }}</span> pending
            </div>
          </mat-card>
        </div>

        <div class="col-12 col-md-6 col-xl-3">
          <mat-card class="kpi-card h-100">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div class="kpi-icon-box bg-success-soft text-success">
                <mat-icon>verified</mat-icon>
              </div>
            </div>
            <div class="kpi-label">Active Subscriptions</div>
            <div class="kpi-value">{{ s.active_subscriptions }}</div>
          </mat-card>
        </div>

        <div class="col-12 col-md-6 col-xl-3">
          <mat-card class="kpi-card h-100">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div class="kpi-icon-box bg-danger-soft text-danger">
                <mat-icon>account_balance_wallet</mat-icon>
              </div>
            </div>
            <div class="kpi-label">Total Debts Tracked</div>
            <div class="kpi-value">{{ s.total_debts }}</div>
          </mat-card>
        </div>

        <div class="col-12 col-md-6 col-xl-3">
          <mat-card class="kpi-card h-100">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div class="kpi-icon-box bg-info-soft text-info">
                <mat-icon>payments</mat-icon>
              </div>
            </div>
            <div class="kpi-label">Total Payments Logged</div>
            <div class="kpi-value">{{ s.total_payments }}</div>
          </mat-card>
        </div>
      </div>
      
      <div class="row mt-4">
        <div class="col-12">
          <mat-card class="grid-card">
            <mat-card-header>
              <mat-card-title>Quick Actions</mat-card-title>
            </mat-card-header>
            <mat-card-content class="p-3">
              <p class="text-secondary mb-3">Navigate to the detailed administration panels below:</p>
              <div class="d-flex flex-wrap gap-3">
                <button mat-flat-button color="primary" routerLink="/admin/users">
                  <mat-icon>group</mat-icon> Users
                </button>
                <button mat-flat-button color="primary" routerLink="/admin/roles">
                  <mat-icon>badge</mat-icon> Roles
                </button>
                <button mat-flat-button color="primary" routerLink="/admin/permissions">
                  <mat-icon>security</mat-icon> Permissions
                </button>
                <button mat-flat-button color="primary" routerLink="/admin/modules">
                  <mat-icon>widgets</mat-icon> Modules
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bg-success-soft { background-color: rgba(16, 185, 129, 0.1); }
    .bg-danger-soft { background-color: rgba(239, 68, 68, 0.1); }
    .bg-info-soft { background-color: rgba(14, 165, 233, 0.1); }
    .text-info { color: #0ea5e9; }
  `]
})
export class AdminDashboard implements OnInit {
  private adminService = inject(AdminService);
  stats = this.adminService.stats;

  async ngOnInit() {
    await this.adminService.loadStats();
  }
}
