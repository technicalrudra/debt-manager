import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatTableModule],
  template: `
    <div class="container-fluid py-3">
      <div class="page-header mb-4">
        <h1 class="page-title mb-1">Roles</h1>
        <p class="text-secondary subtitle mb-0">
          View the Admin and User roles and their current access assignments.
        </p>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-12 col-md-6" *ngFor="let role of roles()">
          <mat-card class="h-100 role-card">
            <mat-card-content class="p-4">
              <div class="d-flex align-items-start justify-content-between">
                <div class="d-flex gap-3">
                  <div class="role-icon">
                    <mat-icon>{{ role.name === 'admin' ? 'admin_panel_settings' : 'person' }}</mat-icon>
                  </div>
                  <div>
                    <h2 class="h5 fw-bold mb-1">{{ role.display_name }}</h2>
                    <div class="text-secondary small mb-2">{{ role.name }}</div>
                    <p class="text-secondary mb-0">{{ role.description }}</p>
                  </div>
                </div>
                <span class="badge bg-primary-subtle text-primary" *ngIf="role.is_system">System</span>
              </div>
              <div class="role-stats mt-4">
                <div>
                  <strong>{{ userCount(role.id) }}</strong>
                  <span>Users</span>
                </div>
                <div>
                  <strong>{{ permissionCount(role.id) }}</strong>
                  <span>Permissions</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <mat-card class="grid-card">
        <mat-card-header class="border-bottom pb-3">
          <mat-card-title>Role Summary</mat-card-title>
        </mat-card-header>
        <mat-card-content class="p-0">
          <table mat-table [dataSource]="roles()" class="w-100">
            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef>Role</th>
              <td mat-cell *matCellDef="let role">
                <div class="fw-bold">{{ role.display_name }}</div>
                <code>{{ role.name }}</code>
              </td>
            </ng-container>
            <ng-container matColumnDef="users">
              <th mat-header-cell *matHeaderCellDef>Assigned Users</th>
              <td mat-cell *matCellDef="let role">{{ userCount(role.id) }}</td>
            </ng-container>
            <ng-container matColumnDef="permissions">
              <th mat-header-cell *matHeaderCellDef>Permissions</th>
              <td mat-cell *matCellDef="let role">{{ permissionCount(role.id) }}</td>
            </ng-container>
            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let role">{{ role.is_system ? 'System role' : 'Custom role' }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .role-card { border: 1px solid #e5e7eb; box-shadow: none; }
    .role-icon {
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      color: #2563eb;
      background: rgba(37, 99, 235, .1);
    }
    .role-stats { display: flex; gap: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px; }
    .role-stats div { display: flex; flex-direction: column; }
    .role-stats strong { font-size: 20px; }
    .role-stats span { color: #6b7280; font-size: 12px; }
  `]
})
export class RoleManagement implements OnInit {
  private adminService = inject(AdminService);

  roles = this.adminService.roles;
  userRoles = this.adminService.userRoles;
  rolePermissions = this.adminService.rolePermissions;
  displayedColumns = ['role', 'users', 'permissions', 'type'];

  async ngOnInit() {
    await Promise.all([
      this.adminService.loadRoles(),
      this.adminService.loadUserRoles(),
      this.adminService.loadRolePermissions()
    ]);
  }

  userCount(roleId: string): number {
    return this.userRoles().filter(item => item.role_id === roleId).length;
  }

  permissionCount(roleId: string): number {
    return this.rolePermissions().filter(item => item.role_id === roleId).length;
  }
}
