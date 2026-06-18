import { Component, OnInit, TemplateRef, ViewChild, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule, MatDatepicker } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType, ChartOptions, registerables, Chart } from 'chart.js';
import { UserDataService } from '../../core/services/user-data.service';
import { ExpenseService } from '../../core/services/expense.service';
import { DebtService } from '../../core/services/debt.service';
import { Expense } from '../../core/models/expense.model';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

Chart.register(...registerables);

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    BaseChartDirective,
    EmptyState
  ],
  templateUrl: './expenses.html',
  styleUrls: ['./expenses.scss']
})
export class Expenses implements OnInit {
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  protected userDataService = inject(UserDataService);
  protected expenseService = inject(ExpenseService);
  private debtService = inject(DebtService);

  @ViewChild('expenseDialog') expenseDialogTemp!: TemplateRef<any>;
  @ViewChild('deleteConfirmDialog') deleteConfirmDialogTemp!: TemplateRef<any>;
  
  // Month picker
  selectedMonth = signal(new Date());

  get selectedMonthLabel(): string {
    return this.selectedMonth().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }

  onMonthSelected(date: Date, picker: MatDatepicker<Date>) {
    this.selectedMonth.set(date);
    picker.close();
  }

  // Expenses filtered to the selected month
  monthlyExpenses = computed(() => {
    const m = this.selectedMonth();
    return this.expenseService.expenses().filter(e => {
      const d = new Date(e.start_date || e.updated_at || e.created_at || '');
      return !isNaN(d.getTime()) &&
        d.getFullYear() === m.getFullYear() &&
        d.getMonth() === m.getMonth();
    });
  });

  // Forms
  expenseForm!: FormGroup;
  currentEditingExpense: Expense | null = null;
  expenseToDelete: Expense | null = null;

  // Metadata Lists
  categories: string[] = ['Rent', 'Electricity', 'Household', 'Fuel', 'Internet', 'Miscellaneous'];
  frequencies: string[] = ['One-time', 'Weekly', 'Monthly', 'Annually'];

  // Table Config
  displayedColumns: string[] = ['category', 'description', 'amount', 'frequency', 'lastUpdated', 'actions'];

  // Table data sorted from monthly expenses
  filteredExpenses = computed(() => {
    return [...this.monthlyExpenses()].sort((a, b) => {
      const aDate = new Date(a.updated_at || a.created_at || '').getTime();
      const bDate = new Date(b.updated_at || b.created_at || '').getTime();
      return bDate - aDate;
    });
  });

  // KPIs — all scoped to selected month
  getTotalExpenses = computed(() =>
    this.monthlyExpenses().reduce((sum, e) => sum + Number(e.amount), 0)
  );

  getLargestCategory = computed(() => {
    const expenses = this.monthlyExpenses();
    if (!expenses.length) return 'None';
    const sumsMap: Record<string, number> = {};
    expenses.forEach(e => { sumsMap[e.category] = (sumsMap[e.category] || 0) + Number(e.amount); });
    const [cat, amt] = Object.entries(sumsMap).reduce((a, b) => b[1] > a[1] ? b : a);
    return `${cat} – ₹${Number(amt).toLocaleString('en-IN')}`;
  });

  getAvailableSurplus = computed(() => {
    const totalIncome = this.userDataService.totalMonthlyIncome() || 0;
    const totalEmis = this.debtService.getTotalMonthlyEmi() || 0;
    const surplus = totalIncome - totalEmis - this.getTotalExpenses();
    return surplus > 0 ? surplus : 0;
  });

  getCategoryTotal(categoryName: string): number {
    return this.monthlyExpenses()
      .filter(e => e.category === categoryName)
      .reduce((sum, e) => sum + Number(e.amount), 0);
  }

  getCategoryPercentage(categoryName: string): number {
    const total = this.getTotalExpenses();
    if (!total) return 0;
    return Math.round((this.getCategoryTotal(categoryName) / total) * 100);
  }

  // Chart configs
  public donutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: { legend: { display: false } }
  };
  
  donutChartData = computed<ChartConfiguration<'doughnut'>['data']>(() => {
    const sums = this.categories.map(cat => 
      this.expenseService.expenses()
        .filter(e => e.category === cat)
        .reduce((sum, e) => sum + Number(e.amount), 0)
    );

    return {
      labels: this.categories,
      datasets: [{
        data: sums,
        backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#0ea5e9', '#6366f1', '#8b5cf6'],
        borderWidth: 0
      }]
    };
  });
  
  public donutChartType: any = 'doughnut';

  public trendChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { grid: { color: '#f1f5f9' }, border: { display: false } },
      x: { grid: { display: false } }
    },
    plugins: { legend: { display: false } }
  };
  public trendChartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const currentExp = this.getTotalExpenses() || 0;
    return {
      labels: ['Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026'],
      datasets: [{
        data: [0, 0, 0, 0, 0, currentExp],
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.05)',
        fill: true,
        tension: 0.3,
        borderWidth: 3,
        pointRadius: 4,
        pointBackgroundColor: '#4f46e5'
      }]
    };
  });
  public trendChartType: any = 'line';

  getCategoryColor(idx: number): string {
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#0ea5e9', '#6366f1', '#8b5cf6'];
    return colors[idx] || '#6366f1';
  }

  constructor() {}

  async ngOnInit() {
    await this.expenseService.loadExpenses();
    this.initForm();
  }

  private localDateString(d = new Date()): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  initForm() {
    this.expenseForm = this.fb.group({
      category: ['Rent', Validators.required],
      description: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      frequency: ['Monthly', Validators.required],
      date: [this.localDateString(), Validators.required],
      recurring: [true],
      notes: ['']
    });
  }

  openAddDialog() {
    this.currentEditingExpense = null;
    this.initForm();
    this.dialog.open(this.expenseDialogTemp, {
      width: '500px',
      panelClass: 'custom-dialog-container'
    });
  }

  openEditDialog(expense: Expense) {
    this.currentEditingExpense = expense;
    this.expenseForm.patchValue({
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      frequency: expense.frequency,
      date: expense.start_date ? this.localDateString(new Date(expense.start_date)) : this.localDateString(),
      recurring: expense.recurring,
      notes: expense.notes || ''
    });
    
    this.dialog.open(this.expenseDialogTemp, {
      width: '500px',
      panelClass: 'custom-dialog-container'
    });
  }

  async saveExpense() {
    if (this.expenseForm.invalid) return;

    const formVal = this.expenseForm.value;

    if (this.currentEditingExpense) {
      // Edit
      await this.expenseService.updateExpense(this.currentEditingExpense.id!, {
        category: formVal.category,
        description: formVal.description,
        amount: formVal.amount,
        frequency: formVal.frequency,
        start_date: formVal.date,
        recurring: formVal.recurring,
        notes: formVal.notes
      });
    } else {
      // Add
      await this.expenseService.addExpense({
        category: formVal.category,
        description: formVal.description,
        amount: formVal.amount,
        frequency: formVal.frequency,
        start_date: formVal.date,
        recurring: formVal.recurring,
        notes: formVal.notes
      });
    }

    this.dialog.closeAll();
  }

  confirmDelete(expense: Expense) {
    this.expenseToDelete = expense;
    this.dialog.open(this.deleteConfirmDialogTemp, {
      width: '400px',
      panelClass: 'custom-dialog-container'
    });
  }

  async deleteExpense() {
    if (!this.expenseToDelete) return;
    await this.expenseService.deleteExpense(this.expenseToDelete.id!);
    this.expenseToDelete = null;
    this.dialog.closeAll();
  }
}
