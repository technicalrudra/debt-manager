import { Component, OnInit, inject, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UserDataService } from '../../core/services/user-data.service';
import { DebtService } from '../../core/services/debt.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule,
    MatTabsModule,
    MatDialogModule
  ],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class Profile implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  public userDataService = inject(UserDataService);
  public debtService = inject(DebtService);

  @ViewChild('editDialog') editDialogTemp!: TemplateRef<any>;
  @ViewChild('incomeDialog') incomeDialogTemp!: TemplateRef<any>;
  @ViewChild('debtsDialog') debtsDialogTemp!: TemplateRef<any>;

  profileForm!: FormGroup;
  incomeForm!: FormGroup;
  debtForm!: FormGroup;

  today = new Date();

  employmentTypes = ['Salaried', 'Self-Employed', 'Freelancer', 'Business Owner'];
  incomeTypes = ['Salary', 'Freelance', 'Business', 'Rental', 'Other'];
  debtTypes = ['Personal Loan', 'Car Loan', 'Home Loan', 'Credit Card', 'Money Borrowed', 'Other'];
  frequencies = ['Monthly', 'Quarterly', 'Yearly'];

  constructor() {
    this.initForms();
  }

  async ngOnInit() {
    await this.userDataService.loadProfile();
    this.profileForm.patchValue(this.userDataService.profile() || {});
  }

  initForms() {
    this.profileForm = this.fb.group({
      full_name: ['', Validators.required],
      mobile: ['', Validators.required],
      email: [{value: '', disabled: true}],
      city: ['', Validators.required],
      state: ['', Validators.required],
      country: ['', Validators.required],
      company: ['', Validators.required],
      job_title: ['', Validators.required],
      employment_type: ['', Validators.required],
      currency: ['INR', Validators.required]
    });

    this.incomeForm = this.fb.group({
      type: ['Salary', Validators.required],
      source_name: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      frequency: ['Monthly', Validators.required],
      recurring: [true]
    });

    this.debtForm = this.fb.group({
      name: ['', Validators.required],
      type: ['Personal Loan', Validators.required],
      lender: ['Other', Validators.required],
      original_amount: [0, Validators.required],
      current_balance: [null, Validators.required],
      interest_rate: [0, Validators.required],
      emi: [null, Validators.required],
      tenure: [12, Validators.required],
      due_date: [5, Validators.required],
      priority: ['Medium', Validators.required]
    });
  }

  async save() {
    if (this.profileForm.valid) {
      await this.userDataService.saveProfile(this.profileForm.getRawValue());
      this.showSnackBar('Profile updated successfully!');
    }
  }

  async addIncome() {
    if (this.incomeForm.valid) {
      await this.userDataService.addIncome(this.incomeForm.value);
      this.incomeForm.reset({ type: 'Salary', frequency: 'Monthly', recurring: true });
      this.showSnackBar('Income source added!');
      this.dialog.closeAll();
    }
  }

  async addDebt() {
    if (this.debtForm.valid) {
      await this.debtService.addDebt(this.debtForm.value);
      this.debtForm.reset({ type: 'Personal Loan', lender: 'Other', original_amount: 0, current_balance: null, interest_rate: 0, tenure: 12, due_date: 5, priority: 'Medium' });
      this.showSnackBar('Debt entry added!');
      this.dialog.closeAll();
    }
  }

  openEditDialog() {
    this.profileForm.patchValue(this.userDataService.profile() || {});
    this.dialog.open(this.editDialogTemp, {
      width: '600px',
      panelClass: 'custom-dialog-container'
    });
  }

  openIncomeDialog() {
    this.incomeForm.reset({ type: 'Salary', frequency: 'Monthly', recurring: true });
    this.dialog.open(this.incomeDialogTemp, {
      width: '600px',
      panelClass: 'custom-dialog-container'
    });
  }

  openDebtsDialog() {
    this.debtForm.reset({ type: 'Personal Loan', lender: 'Other', original_amount: 0, current_balance: null, interest_rate: 0, tenure: 12, due_date: 5, priority: 'Medium' });
    this.dialog.open(this.debtsDialogTemp, {
      width: '600px',
      panelClass: 'custom-dialog-container'
    });
  }

  private showSnackBar(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }
}
