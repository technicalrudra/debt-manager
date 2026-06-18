import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType, registerables, Chart } from 'chart.js';
import { UserDataService } from '../../core/services/user-data.service';
import { ExpenseService } from '../../core/services/expense.service';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

Chart.register(...registerables);

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, MatCardModule, BaseChartDirective, EmptyState],
  templateUrl: './reports.html',
  styleUrls: ['./reports.scss']
})
export class Reports implements OnInit {
  private userDataService = inject(UserDataService);
  private expenseService = inject(ExpenseService);

  public barChartOptions: ChartConfiguration['options'] = { 
    responsive: true,
    maintainAspectRatio: false
  };

  barChartData = computed<ChartConfiguration['data']>(() => {
    // Basic logic to show current month vs historical
    const totalIncome = this.userDataService.totalMonthlyIncome() || 0;
    const totalExpenses = this.expenseService.getTotalExpenses() || 0;
    
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        { data: [0, 0, 0, 0, 0, totalIncome], label: 'Income', backgroundColor: '#10b981' },
        { data: [0, 0, 0, 0, 0, totalExpenses], label: 'Expenses', backgroundColor: '#ef4444' }
      ]
    };
  });

  public barChartType: ChartType = 'bar';

  hasData = computed(() => {
    return (this.userDataService.totalMonthlyIncome() || 0) > 0 || (this.expenseService.getTotalExpenses() || 0) > 0;
  });

  constructor() {}

  async ngOnInit() {
    await Promise.all([
      this.userDataService.loadAll(),
      this.expenseService.loadExpenses()
    ]);
  }
}
