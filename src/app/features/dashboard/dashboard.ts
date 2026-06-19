import { Component, OnInit, TemplateRef, ViewChild, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { BaseChartDirective } from 'ng2-charts';
import {
  LucideWallet, LucideUsers, LucideTrendingUp, LucideTrendingDown,
  LucideReceipt, LucideScrollText, LucideCalendarClock, LucidePiggyBank,
  LucideClock, LucideCalendarCheck, LucideCircleCheck,
  LucideCreditCard, LucideShoppingCart, LucideBanknote, LucidePlus,
  LucideX, LucideAlertTriangle, LucideSparkles
} from '@lucide/angular';
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
    MatButtonModule,
    MatChipsModule,
    MatProgressBarModule,
    BaseChartDirective,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    EmptyState,
    LucideWallet, LucideUsers, LucideTrendingUp, LucideTrendingDown,
    LucideReceipt, LucideScrollText, LucideCalendarClock, LucidePiggyBank,
    LucideClock, LucideCalendarCheck, LucideCircleCheck,
    LucideCreditCard, LucideShoppingCart, LucideBanknote, LucidePlus,
    LucideX, LucideAlertTriangle, LucideSparkles
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
  private router = inject(Router);

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

  priorityActions = computed(() => {
    const debts = this.debtService.debts().filter(d => Number(d.current_balance) > 0);
    const today = new Date();
    const currentDay = today.getDate();
    const { monthlyIncome, availableSurplus } = this.kpis();
    const actions: { title: string; description: string; icon: string; color: string }[] = [];

    // High-interest debt alert
    const highRateDebt = [...debts].sort((a, b) => Number(b.interest_rate) - Number(a.interest_rate))[0];
    if (highRateDebt && Number(highRateDebt.interest_rate) > 15) {
      const monthlySaving = Math.round(Number(highRateDebt.current_balance) * Number(highRateDebt.interest_rate) / 1200 * 0.1);
      actions.push({
        title: `${highRateDebt.name} at ${highRateDebt.interest_rate}% APR`,
        description: `Highest-rate debt. Paying extra saves ~₹${monthlySaving.toLocaleString('en-IN')}/mo in interest.`,
        icon: 'alert',
        color: 'warn'
      });
    }

    // Due soon within 5 days
    const dueSoonList = debts
      .map(d => ({ ...d, diff: Number(d.due_date) - currentDay }))
      .filter(d => d.diff >= 0 && d.diff <= 5)
      .sort((a, b) => a.diff - b.diff);
    if (dueSoonList.length > 0) {
      const d = dueSoonList[0];
      const label = d.diff === 0 ? 'today' : `in ${d.diff} day${d.diff === 1 ? '' : 's'}`;
      actions.push({
        title: `${d.name} EMI due ${label}`,
        description: `₹${Number(d.emi).toLocaleString('en-IN')} payment due. Schedule to avoid late fees.`,
        icon: 'clock',
        color: 'accent'
      });
    }

    // Budget deficit warning
    if (monthlyIncome > 0 && availableSurplus < 0) {
      actions.push({
        title: 'Monthly budget in deficit',
        description: `Overspending by ₹${Math.abs(availableSurplus).toLocaleString('en-IN')}. Review expenses.`,
        icon: 'alert',
        color: 'warn'
      });
    }

    // Surplus — encourage extra payment
    if (availableSurplus > 5000 && actions.length < 3) {
      const topDebt = debts.find(d => d.priority === 'High')
        ?? [...debts].sort((a, b) => Number(b.interest_rate) - Number(a.interest_rate))[0];
      actions.push({
        title: `₹${availableSurplus.toLocaleString('en-IN')} surplus this month`,
        description: topDebt
          ? `Allocate extra toward ${topDebt.name} to pay off faster.`
          : 'Consider making an extra debt payment this month.',
        icon: 'sparkles',
        color: 'primary'
      });
    }

    // Fallback — all good
    if (actions.length === 0) {
      actions.push({
        title: 'Finances on track',
        description: 'No urgent actions needed. Keep up the good work!',
        icon: 'sparkles',
        color: 'primary'
      });
    }

    return actions.slice(0, 3);
  });

  debtProgress = computed(() => {
    return this.debtService.debts().map(d => {
      const current = Number(d.current_balance);
      const target = Number(d.original_amount);
      const paid = target - current;
      const paidPct = target > 0 ? Math.round((paid / target) * 100) : 0;
      const remainingPct = 100 - paidPct;
      const barColor = remainingPct > 75 ? '#ef4444' : remainingPct > 40 ? '#f59e0b' : '#10b981';
      return { name: d.name, type: d.type || 'Loan', current, target, paid, paidPct, remainingPct, barColor, emi: Number(d.emi) };
    });
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

  openAddDebt() {
    this.router.navigate(['/debts']);
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
