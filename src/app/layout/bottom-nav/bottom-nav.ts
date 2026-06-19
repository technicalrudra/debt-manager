import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterModule, MatIconModule],
  templateUrl: './bottom-nav.html',
  styleUrls: ['./bottom-nav.scss']
})
export class BottomNav {
  items = [
    { icon: 'dashboard', label: 'Dashboard', route: '/dashboard' },
    { icon: 'account_balance_wallet', label: 'Debts', route: '/debts' },
    { icon: 'attach_money', label: 'Income', route: '/income' },
    { icon: 'bar_chart', label: 'Reports', route: '/reports' },
  ];
}
