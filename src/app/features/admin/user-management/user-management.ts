import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatIconModule,
    MatSelectModule,
    MatTableModule
  ],
  template: `
    <div class="container-fluid py-3">
      <div class="page-header mb-4">
        <h1 class="page-title mb-1">User Management</h1>
        <p class="text-secondary subtitle mb-0">
          Approve users, assign roles and modules, suspend access, or remove accounts.
        </p>
      </div>

      <mat-card class="grid-card p-0 overflow-hidden bg-white border shadow-sm">
        <mat-card-header class="p-3 border-bottom">
          <mat-card-title class="m-0 fw-bold fs-6">Registered Users</mat-card-title>
        </mat-card-header>

        <mat-card-content class="p-0">
          <div class="table-responsive">
            <table mat-table [dataSource]="users()" class="w-100">
              <ng-container matColumnDef="user">
                <th mat-header-cell *matHeaderCellDef>User</th>
                <td mat-cell *matCellDef="let user">
                  <div class="fw-bold">{{ user.full_name || 'N/A' }}</div>
                  <div class="text-secondary small">{{ user.email }}</div>
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let user">
                  <span
                    class="badge px-2 py-1"
                    [ngClass]="{
                      'bg-warning text-dark': user.status === 'pending',
                      'bg-success text-white': user.status === 'approved',
                      'bg-danger text-white': user.status === 'rejected' || user.status === 'suspended'
                    }"
                  >
                    {{ user.status | uppercase }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef>Role</th>
                <td mat-cell *matCellDef="let user">
                  <mat-select
                    class="role-select"
                    [value]="roleIdFor(user.user_id)"
                    (selectionChange)="assignRole(user.user_id, $event.value)"
                    [disabled]="isCurrentUser(user.user_id)"
                  >
                    <mat-option *ngFor="let role of roles()" [value]="role.id">
                      {{ role.display_name }}
                    </mat-option>
                  </mat-select>
                </td>
              </ng-container>

              <ng-container matColumnDef="modules">
                <th mat-header-cell *matHeaderCellDef>Assigned Modules</th>
                <td mat-cell *matCellDef="let user">
                  <div class="module-grid">
                    <mat-checkbox
                      *ngFor="let module of modules()"
                      [checked]="hasModule(user.user_id, module.id)"
                      (change)="setModule(user.user_id, module.id, $event.checked)"
                      [disabled]="roleNameFor(user.user_id) === 'admin'"
                    >
                      {{ module.name }}
                    </mat-checkbox>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="text-end">Actions</th>
                <td mat-cell *matCellDef="let user" class="text-end text-nowrap">
                  <button
                    *ngIf="user.status !== 'approved'"
                    mat-icon-button
                    color="primary"
                    title="Approve user"
                    (click)="updateStatus(user.user_id, 'approved')"
                  >
                    <mat-icon>check_circle</mat-icon>
                  </button>
                  <button
                    *ngIf="user.status === 'approved'"
                    mat-icon-button
                    color="warn"
                    title="Suspend user"
                    [disabled]="isCurrentUser(user.user_id)"
                    (click)="updateStatus(user.user_id, 'suspended')"
                  >
                    <mat-icon>block</mat-icon>
                  </button>
                  <button
                    mat-icon-button
                    color="warn"
                    title="Permanently remove user"
                    [disabled]="isCurrentUser(user.user_id)"
                    (click)="removeUser(user.user_id, user.email)"
                  >
                    <mat-icon>delete_forever</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
            </table>

            <div class="text-center py-5 bg-light" *ngIf="users().length === 0 && !loading()">
              <mat-icon class="empty-icon text-secondary">group</mat-icon>
              <h4 class="fw-bold mb-2">No users found</h4>
            </div>
            <div class="text-center py-5 bg-light" *ngIf="loading()">
              <div class="spinner-border text-primary" role="status"></div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .badge { font-size: 11px; letter-spacing: .5px; }
    .role-select { min-width: 130px; }
    .module-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(120px, 1fr));
      gap: 0 12px;
      min-width: 300px;
      padding: 8px 0;
    }
    .empty-icon { width: 48px; height: 48px; font-size: 48px; }
  `]
})
export class UserManagement implements OnInit {
  private adminService = inject(AdminService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  users = this.adminService.users;
  roles = this.adminService.roles;
  modules = this.adminService.modules;
  userRoles = this.adminService.userRoles;
  userModules = this.adminService.userModules;
  loading = this.adminService.loading;

  displayedColumns = ['user', 'status', 'role', 'modules', 'actions'];

  async ngOnInit() {
    await Promise.all([
      this.adminService.loadUsers(),
      this.adminService.loadRoles(),
      this.adminService.loadModules(),
      this.adminService.loadUserRoles(),
      this.adminService.loadUserModules()
    ]);
  }

  roleIdFor(userId: string): string {
    return this.userRoles().find(item => item.user_id === userId)?.role_id || '';
  }

  roleNameFor(userId: string): string {
    return this.userRoles().find(item => item.user_id === userId)?.role?.name || 'user';
  }

  hasModule(userId: string, moduleId: string): boolean {
    return this.userModules().some(
      item => item.user_id === userId && item.module_id === moduleId
    );
  }

  isCurrentUser(userId: string): boolean {
    return this.auth.currentUser()?.id === userId;
  }

  async assignRole(userId: string, roleId: string) {
    const success = await this.adminService.updateUserRole(userId, roleId);
    success
      ? this.toast.success('User role updated.')
      : this.toast.error('Failed to update the user role.');
  }

  async setModule(userId: string, moduleId: string, enabled: boolean) {
    const success = await this.adminService.setUserModule(userId, moduleId, enabled);
    success
      ? this.toast.success('Module assignment updated.')
      : this.toast.error('Failed to update module access.');
  }

  async updateStatus(userId: string, status: 'approved' | 'suspended') {
    if (!confirm(`Change this user's status to ${status}?`)) return;
    const success = await this.adminService.updateUserStatus(userId, status);
    success
      ? this.toast.success(`User ${status}.`)
      : this.toast.error('Failed to update user status.');
  }

  async removeUser(userId: string, email: string) {
    if (!confirm(`Permanently remove ${email}? This cannot be undone.`)) return;
    const success = await this.adminService.removeUser(userId);
    success
      ? this.toast.success('User removed permanently.')
      : this.toast.error('Failed to remove the user.');
  }
}
