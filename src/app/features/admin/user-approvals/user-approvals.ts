import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AdminService } from '../../../core/services/admin.service';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-user-approvals',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatCardModule, MatButtonModule, MatIconModule, EmptyState],
  templateUrl: './user-approvals.html',
  styleUrls: ['./user-approvals.scss']
})
export class UserApprovals implements OnInit {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);

  displayedColumns: string[] = ['name', 'email', 'joined', 'actions'];

  pendingUsers = computed(() => {
    return this.adminService.users().filter(u => u.status === 'pending');
  });

  constructor() {}

  async ngOnInit() {
    await this.adminService.loadUsers();
  }

  async approveUser(userId: string) {
    const success = await this.adminService.updateUserStatus(userId, 'approved');
    if (success) {
      this.toast.success('User approved successfully.');
    } else {
      this.toast.error('Failed to approve user.');
    }
  }

  async rejectUser(userId: string) {
    const success = await this.adminService.updateUserStatus(userId, 'rejected');
    if (success) {
      this.toast.success('User registration rejected.');
    } else {
      this.toast.error('Failed to reject user.');
    }
  }
}
