import { Component, OnInit, TemplateRef, ViewChild, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IncomeService, Income as IncomeModel } from '../../core/services/income.service';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-income',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
    EmptyState
  ],
  templateUrl: './income.html',
  styleUrls: ['./income.scss']
})
export class Income implements OnInit {
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  private incomeService = inject(IncomeService);

  @ViewChild('incomeDialog') incomeDialogTemp!: TemplateRef<any>;
  @ViewChild('deleteConfirmDialog') deleteConfirmDialogTemp!: TemplateRef<any>;
  
  incomeForm!: FormGroup;
  currentEditingIncome: IncomeModel | null = null;
  incomeToDelete: IncomeModel | null = null;

  types: string[] = ['Salary', 'Freelance', 'Investment', 'Business', 'Other'];
  frequencies: string[] = ['One-time', 'Weekly', 'Monthly', 'Annually'];

  displayedColumns: string[] = ['source_name', 'type', 'amount', 'frequency', 'lastUpdated', 'actions'];

  filteredIncome = computed(() => this.incomeService.incomeSources());
  getTotalIncome = computed(() => this.incomeService.getTotalMonthlyIncome());
  sourceCount = computed(() => this.incomeService.incomeSources().length);
  highestSource = computed(() => {
    const sources = this.incomeService.incomeSources();
    if (!sources.length) return null;
    return sources.reduce((max, s) => Number(s.amount) > Number(max.amount) ? s : max);
  });

  constructor() {}

  async ngOnInit() {
    await this.incomeService.loadIncome();
    this.initForm();
  }

  initForm() {
    this.incomeForm = this.fb.group({
      source_name: ['', Validators.required],
      type: ['Salary', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      frequency: ['Monthly', Validators.required],
      recurring: [true]
    });
  }

  openAddDialog() {
    this.currentEditingIncome = null;
    this.initForm();
    this.dialog.open(this.incomeDialogTemp, {
      width: '500px',
      panelClass: 'custom-dialog-container'
    });
  }

  openEditDialog(income: IncomeModel) {
    this.currentEditingIncome = income;
    this.incomeForm.patchValue({
      source_name: income.source_name,
      type: income.type,
      amount: income.amount,
      frequency: income.frequency,
      recurring: income.recurring
    });
    
    this.dialog.open(this.incomeDialogTemp, {
      width: '500px',
      panelClass: 'custom-dialog-container'
    });
  }

  async saveIncome() {
    if (this.incomeForm.invalid) return;
    const formVal = this.incomeForm.value;

    if (this.currentEditingIncome) {
      await this.incomeService.updateIncome(this.currentEditingIncome.id!, formVal);
    } else {
      await this.incomeService.addIncome(formVal);
    }
    this.dialog.closeAll();
  }

  confirmDelete(income: IncomeModel) {
    this.incomeToDelete = income;
    this.dialog.open(this.deleteConfirmDialogTemp, {
      width: '400px',
      panelClass: 'custom-dialog-container'
    });
  }

  async deleteIncome() {
    if (!this.incomeToDelete) return;
    await this.incomeService.deleteIncome(this.incomeToDelete.id!);
    this.incomeToDelete = null;
    this.dialog.closeAll();
  }
}
