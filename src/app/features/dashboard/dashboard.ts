import { Component, OnInit, TemplateRef, ViewChild, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType, ChartOptions } from 'chart.js';
import { UserDataService } from '../../core/services/user-data.service';
import { DebtService } from '../../core/services/debt.service';
import { PaymentService } from '../../core/services/payment.service';
import { ExpenseService } from '../../core/services/expense.service';
import { AuthService } from '../../core/services/auth.service';
import { Onboarding } from '../onboarding/onboarding';
import { RecordPayment } from './record-payment/record-payment';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { registerables, Chart } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressBarModule,
    BaseChartDirective,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    EmptyState
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard implements OnInit {
  userDataService = inject(UserDataService);
  debtService = inject(DebtService);
  paymentService = inject(PaymentService);
  expenseService = inject(ExpenseService);
  authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);

  @ViewChild('addExpenseDialog') addExpenseDialogTemp!: TemplateRef<any>;

  expenseForm!: FormGroup;
  categories: string[] = ['Rent', 'Electricity', 'Household', 'Fuel', 'Internet', 'Miscellaneous'];
  frequencies: string[] = ['One-time', 'Weekly', 'Monthly', 'Annually'];

  user = computed(() => {
    const profile = this.authService.currentProfile();
    return { name: profile?.full_name || 'User' };
  });

  kpis = computed(() => {
    const totalDebt = this.debtService.getTotalDebtBalance();
    const monthlyIncome = this.userDataService.totalMonthlyIncome();
    const monthlyExpenses = this.expenseService.getTotalExpenses();
    const monthlyEmis = this.debtService.getTotalMonthlyEmi();
    const friendDebt = this.debtService.debts()
      .filter(d => d.type === 'Friend' || d.lender === 'Friend' || d.name.includes('Friend'))
      .reduce((sum, d) => sum + Number(d.current_balance), 0);
    const availableSurplus = monthlyIncome - monthlyExpenses - monthlyEmis;

    return {
      totalDebt,
      monthlyIncome,
      monthlyExpenses,
      monthlyEmis,
      friendDebt,
      availableSurplus
    };
  });
  
  upcomingDueDates = computed(() => {
    const today = new Date();
    const currentDay = today.getDate();
    return this.debtService.debts()
      .filter(d => d.current_balance > 0)
      .map(d => {
        let diff = d.due_date - currentDay;
        if (diff < 0) diff += 30; // approx next month
        return {
          name: d.name,
          date: `${d.due_date} of month`,
          amount: d.emi,
          priority: d.priority,
          diff
        };
      })
      .sort((a, b) => a.diff - b.diff)
      .slice(0, 4);
  });

  recentPayments = computed(() => {
    return this.paymentService.payments().slice(0, 4).map(p => ({
      name: p.debt_name,
      method: p.method,
      date: p.payment_date,
      amount: p.amount
    }));
  });

  priorityActions = [
    { title: 'Credit card APR is 36%', description: 'Pay ₹15K extra this month to save ₹1.8K in interest.', icon: 'report_problem', color: 'warn' },
    { title: 'Card due in 4 days', description: 'Schedule auto-pay to avoid late fees.', icon: 'schedule', color: 'accent' },
    { title: 'Surplus available', description: 'Allocate ₹15K to the highest-rate debt.', icon: 'auto_awesome', color: 'primary' }
  ];

  debtProgress = computed(() => {
    return this.debtService.debts().map(d => ({
      name: d.name,
      current: Number(d.current_balance),
      target: Number(d.original_amount),
      color: '#4f46e5'
    }));
  });

  // Donut Chart
  public donutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: { legend: { display: false } }
  };
  
  donutChartData = computed<ChartConfiguration<'doughnut'>['data']>(() => {
    let loans = 0, cards = 0, friends = 0;
    this.debtService.debts().forEach(d => {
      const bal = Number(d.current_balance);
      const name = d.name.toLowerCase();
      const type = d.type.toLowerCase();
      if (type.includes('loan') || name.includes('loan')) loans += bal;
      else if (type.includes('card') || name.includes('card')) cards += bal;
      else friends += bal;
    });

    return {
      labels: ['Loans', 'Credit Cards', 'Friends'],
      datasets: [
        { 
          data: [loans, cards, friends], 
          backgroundColor: ['#4f46e5', '#ef4444', '#f59e0b'],
          borderWidth: 0
        }
      ]
    };
  });

  public donutChartType: ChartType = 'doughnut';

  // Line Chart
  public lineChartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const totalDebt = this.kpis().totalDebt || 0;
    return {
      labels: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'],
      datasets: [
        {
          data: [0, 0, 0, 0, 0, totalDebt],
          label: 'Total Debt Trend',
          borderColor: '#4f46e5',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
          tension: 0.1
        }
      ]
    };
  });
  public lineChartOptions: ChartOptions<'line'> = { 
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: false, grid: { display: true, color: '#f1f5f9' }, border: { display: false } },
      x: { grid: { display: false } }
    },
    plugins: { legend: { display: false } }
  };
  public lineChartType: ChartType = 'line';

  // Bar Chart (Income vs Expenses)
  public barChartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const totalIncome = this.kpis().monthlyIncome || 0;
    const totalExpenses = this.kpis().monthlyExpenses || 0;
    return {
      labels: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'],
      datasets: [
        { data: [0, 0, 0, 0, 0, totalIncome], label: 'Income', backgroundColor: '#10b981', borderRadius: 4, barThickness: 20 },
        { data: [0, 0, 0, 0, 0, totalExpenses], label: 'Expenses', backgroundColor: '#ef4444', borderRadius: 4, barThickness: 20 }
      ]
    };
  });
  public barChartOptions: ChartOptions<'bar'> = { 
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { grid: { color: '#f1f5f9' }, border: { display: false } },
      x: { grid: { display: false } }
    },
    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 20 } } }
  };
  public barChartType: ChartType = 'bar';

  constructor() {}

  async ngOnInit() {
    await Promise.all([
      this.userDataService.loadAll(),
      this.debtService.loadDebts(),
      this.paymentService.loadPayments(),
      this.expenseService.loadExpenses()
    ]);

    if (!this.userDataService.onboardingCompleted()) {
      setTimeout(() => {
        this.openOnboarding();
      }, 3000);
    }
  }

  openOnboarding() {
    this.dialog.open(Onboarding, {
      width: '600px',
      disableClose: true,
      panelClass: 'custom-dialog-container'
    });
  }

  private localDateString(d = new Date()): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  openAddExpense() {
    this.expenseForm = this.fb.group({
      category: ['Rent', Validators.required],
      description: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      frequency: ['Monthly', Validators.required],
      date: [this.localDateString(), Validators.required],
      notes: ['']
    });
    this.dialog.open(this.addExpenseDialogTemp, {
      width: '500px',
      panelClass: 'custom-dialog-container'
    });
  }

  async saveExpense() {
    if (this.expenseForm.invalid) return;
    const v = this.expenseForm.value;
    await this.expenseService.addExpense({
      category: v.category,
      description: v.description,
      amount: v.amount,
      frequency: v.frequency,
      start_date: v.date,
      recurring: true,
      notes: v.notes
    });
    this.dialog.closeAll();
  }

  openRecordPayment() {
    const dialogRef = this.dialog.open(RecordPayment, {
      width: '600px',
      panelClass: 'custom-dialog-container',
      data: {
        debts: this.debtProgress()
      }
    });

    dialogRef.afterClosed().subscribe(async payment => {
      if (payment) {
        const debt = this.debtService.debts().find(d => d.name === payment.debtName);
        if (debt) {
          await this.paymentService.addPayment({
            debt_id: debt.id,
            debt_name: debt.name,
            amount: payment.amount,
            method: payment.method,
            payment_date: payment.date,
            notes: payment.notes || ''
          });
        }
      }
    });
  }

  getDonutValue(index: number): number {
    const val = this.donutChartData().datasets[0].data[index];
    return typeof val === 'number' ? val : 0;
  }

  getDonutColor(index: number): string {
    const bg = this.donutChartData().datasets[0].backgroundColor;
    if (Array.isArray(bg)) {
      return bg[index] as string;
    }
    return typeof bg === 'string' ? bg : '#ccc';
  }
}
