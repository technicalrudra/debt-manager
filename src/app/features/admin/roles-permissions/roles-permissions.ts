import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-roles-permissions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatCheckboxModule,
    MatSelectModule,
    MatFormFieldModule
  ],
  templateUrl: './roles-permissions.html',
  styleUrls: ['./roles-permissions.scss']
})
export class RolesPermissions implements OnInit {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);

  roles = this.adminService.roles;
  selectedRoleId = '';

  permissions = this.adminService.permissions;
  modules = this.adminService.modules;
  rolePermissions = this.adminService.rolePermissions;

  displayedColumns: string[] = ['name', 'module', 'description', 'assigned'];

  constructor() {}

  async ngOnInit() {
    await Promise.all([
      this.adminService.loadRoles(),
      this.adminService.loadModules(),
      this.adminService.loadPermissions(),
      this.adminService.loadRolePermissions()
    ]);
    this.selectedRoleId = this.roles()[0]?.id || '';
  }

  moduleName(moduleId: string | null): string {
    if (!moduleId) return 'System';
    return this.modules().find(module => module.id === moduleId)?.name || 'Unknown';
  }

  hasPermission(permissionId: string): boolean {
    return this.rolePermissions().some(
      rp => rp.role_id === this.selectedRoleId && rp.permission_id === permissionId
    );
  }

  async togglePermission(permissionId: string, enabled: boolean) {
    if (!this.selectedRoleId) return;
    const success = await this.adminService.toggleRolePermission(
      this.selectedRoleId,
      permissionId,
      enabled
    );
    if (success) {
      this.toast.success('Permission updated.');
    } else {
      this.toast.error('Failed to update permission.');
    }
  }
}
