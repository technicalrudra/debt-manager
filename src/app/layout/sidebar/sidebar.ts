import { Component, Input, Output, EventEmitter, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';
import { AccessControlService } from '../../core/services/access-control.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatListModule, MatIconModule, MatButtonModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class Sidebar implements OnInit {
  private authService = inject(AuthService);
  private access = inject(AccessControlService);
  @Input() isCollapsed = false;
  @Input() isMobile = false;
  @Output() close = new EventEmitter<void>();

  private allNavItems = [
    { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { key: 'debts', label: 'Debts', icon: 'account_balance_wallet', route: '/debts' },
    { key: 'income', label: 'Income', icon: 'attach_money', route: '/income' },
    { key: 'expenses', label: 'Expenses', icon: 'receipt_long', route: '/expenses' },
    { key: 'transactions', label: 'Transactions', icon: 'compare_arrows', route: '/transactions' },
    { key: 'reports', label: 'Reports', icon: 'bar_chart', route: '/reports' },
    { key: 'profile', label: 'Profile', icon: 'person', route: '/profile' },
    { key: 'settings', label: 'Settings', icon: 'settings', route: '/settings' }
  ];

  navItems = computed(() =>
    this.allNavItems.filter(item => this.access.hasModuleSync(item.key))
  );

  async ngOnInit() {
    await this.access.loadMyAccess(true);
  }
}
