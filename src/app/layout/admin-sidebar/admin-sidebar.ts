import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatListModule, MatIconModule],
  templateUrl: './admin-sidebar.html',
  styleUrls: ['../sidebar/sidebar.scss']
})
export class AdminSidebar {
  private authService = inject(AuthService);
  @Input() isCollapsed = false;

  navItems = [
    { label: 'Dashboard', icon: 'dashboard', route: '/admin' },
    { label: 'Users', icon: 'people', route: '/admin/users' },
    { label: 'User Approvals', icon: 'how_to_reg', route: '/admin/approvals' },
    { label: 'Roles', icon: 'badge', route: '/admin/roles' },
    { label: 'Permissions', icon: 'security', route: '/admin/permissions' },
    { label: 'Modules', icon: 'widgets', route: '/admin/modules' },
    { label: 'Subscriptions', icon: 'card_membership', route: '/admin/plans' },
    { label: 'Activity Logs', icon: 'history', route: '/admin/activity' },
    { label: 'Notifications', icon: 'notifications', route: '/admin/notifications' },
    { label: 'Settings', icon: 'settings', route: '/admin/settings' }
  ];
}
