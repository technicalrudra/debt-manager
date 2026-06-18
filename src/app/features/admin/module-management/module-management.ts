import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-module-management',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatSlideToggleModule, MatTableModule],
  template: `
    <div class="container-fluid py-3">
      <div class="page-header mb-4">
        <h1 class="page-title mb-1">Modules</h1>
        <p class="text-secondary subtitle mb-0">
          Enable application modules and review their user and permission assignments.
        </p>
      </div>

      <mat-card class="grid-card">
        <mat-card-content class="p-0">
          <div class="table-responsive">
            <table mat-table [dataSource]="modules()" class="w-100 modern-table">
              <ng-container matColumnDef="module">
                <th mat-header-cell *matHeaderCellDef>Module</th>
                <td mat-cell *matCellDef="let module">
                  <div class="d-flex align-items-center gap-3">
                    <div class="module-icon">
                      <mat-icon>{{ module.icon || 'widgets' }}</mat-icon>
                    </div>
                    <div>
                      <div class="fw-bold">{{ module.name }}</div>
                      <code>{{ module.key }}</code>
                    </div>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="route">
                <th mat-header-cell *matHeaderCellDef>Route</th>
                <td mat-cell *matCellDef="let module"><code>{{ module.route || 'N/A' }}</code></td>
              </ng-container>

              <ng-container matColumnDef="users">
                <th mat-header-cell *matHeaderCellDef>Assigned Users</th>
                <td mat-cell *matCellDef="let module">{{ userCount(module.id) }}</td>
              </ng-container>

              <ng-container matColumnDef="permissions">
                <th mat-header-cell *matHeaderCellDef>Permissions</th>
                <td mat-cell *matCellDef="let module">{{ permissionCount(module.id) }}</td>
              </ng-container>

              <ng-container matColumnDef="active">
                <th mat-header-cell *matHeaderCellDef class="text-center">Active</th>
                <td mat-cell *matCellDef="let module" class="text-center">
                  <mat-slide-toggle
                    color="primary"
                    [checked]="module.is_active"
                    (change)="toggleModule(module.id, $event.checked)"
                  ></mat-slide-toggle>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
            </table>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .module-icon {
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      color: #2563eb;
      background: rgba(37, 99, 235, .1);
    }
  `]
})
export class ModuleManagement implements OnInit {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);

  modules = this.adminService.modules;
  permissions = this.adminService.permissions;
  userModules = this.adminService.userModules;
  displayedColumns = ['module', 'route', 'users', 'permissions', 'active'];

  async ngOnInit() {
    await Promise.all([
      this.adminService.loadModules(),
      this.adminService.loadPermissions(),
      this.adminService.loadUserModules()
    ]);
  }

  userCount(moduleId: string): number {
    return this.userModules().filter(item => item.module_id === moduleId).length;
  }

  permissionCount(moduleId: string): number {
    return this.permissions().filter(item => item.module_id === moduleId).length;
  }

  async toggleModule(moduleId: string, isActive: boolean) {
    const success = await this.adminService.updateModule(moduleId, { is_active: isActive });
    success
      ? this.toast.success(`Module ${isActive ? 'enabled' : 'disabled'}.`)
      : this.toast.error('Failed to update module.');
  }
}
