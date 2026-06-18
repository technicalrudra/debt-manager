import { Component, OnInit, TemplateRef, ViewChild, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DebtService } from '../../core/services/debt.service';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-debts',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    EmptyState
  ],
  templateUrl: './debts.html',
  styleUrls: ['./debts.scss']
})
export class Debts implements OnInit {
  private debtService = inject(DebtService);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);

  @ViewChild('addDebtDialog') addDebtDialogTemp!: TemplateRef<any>;

  displayedColumns: string[] = ['name', 'type', 'currentBalance', 'interestRate', 'emi', 'priority', 'progress', 'actions'];

  filters: string[] = ['All', 'Loans', 'Credit Cards', 'Friends'];
  activeFilter = signal('All');

  debtTypes: string[] = ['Personal Loan', 'Home Loan', 'Car Loan', 'Credit Card', 'Friend/Family', 'Education Loan', 'Other'];
  priorities: string[] = ['High', 'Medium', 'Low'];

  debtForm!: FormGroup;

  private readonly filterKeywords: Record<string, string> = {
    'Loans': 'loan',
    'Credit Cards': 'credit card',
    'Friends': 'friend'
  };

  dataSource = computed(() => {
    const active = this.activeFilter();
    let allDebts = this.debtService.debts();
    if (active !== 'All') {
      const keyword = (this.filterKeywords[active] ?? active).toLowerCase();
      allDebts = allDebts.filter(d =>
        d.type.toLowerCase().includes(keyword) || d.lender.toLowerCase().includes(keyword)
      );
    }
    return allDebts.map(d => {
      const orig = Number(d.original_amount) || 1;
      const curr = Number(d.current_balance);
      const paid = orig - curr;
      const progress = Math.min(100, Math.max(0, Math.round((paid / orig) * 100)));
      return {
        id: d.id,
        name: d.name,
        lender: d.lender,
        type: d.type,
        currentBalance: curr,
        interestRate: d.interest_rate,
        emi: d.emi,
        priority: d.priority,
        progress
      };
    });
  });

  constructor() {}

  async ngOnInit() {
    await this.debtService.loadDebts();
  }

  setFilter(filter: string) {
    this.activeFilter.set(filter);
  }

  openAddDialog() {
    this.debtForm = this.fb.group({
      name: ['', Validators.required],
      type: ['Personal Loan', Validators.required],
      lender: ['', Validators.required],
      original_amount: [null, [Validators.required, Validators.min(1)]],
      interest_rate: [null, [Validators.required, Validators.min(0)]],
      emi: [null, [Validators.required, Validators.min(1)]],
      tenure: [null, [Validators.min(1)]],
      due_date: [1, [Validators.required, Validators.min(1), Validators.max(31)]],
      priority: ['Medium', Validators.required]
    });
    this.dialog.open(this.addDebtDialogTemp, {
      width: '560px',
      panelClass: 'custom-dialog-container'
    });
  }

  async saveDebt() {
    if (this.debtForm.invalid) return;
    const val = this.debtForm.value;
    const success = await this.debtService.addDebt({
      name: val.name,
      type: val.type,
      lender: val.lender,
      original_amount: val.original_amount,
      current_balance: val.original_amount,
      interest_rate: val.interest_rate,
      emi: val.emi,
      tenure: val.tenure ?? 0,
      due_date: val.due_date,
      priority: val.priority,
      status: 'Active'
    });
    if (success) this.dialog.closeAll();
  }
}
