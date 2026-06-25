import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';

@Component({
  selector: 'app-record-payment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
  ],
  templateUrl: './record-payment.html',
  styleUrls: ['./record-payment.scss']
})
export class RecordPayment implements OnInit {
  paymentForm!: FormGroup;
  debts: any[] = [];
  debtOptions: { label: string; value: string }[] = [];
  
  paymentMethods = [
    { label: 'UPI', value: 'UPI' },
    { label: 'Bank Transfer', value: 'Bank Transfer' },
    { label: 'Auto-Debit', value: 'Auto-Debit' },
    { label: 'Cash', value: 'Cash' }
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<RecordPayment>,
    @Inject(MAT_DIALOG_DATA) public data: { debts: any[] }
  ) {
    if (data && data.debts) {
      this.debts = data.debts;
    }
  }

  ngOnInit() {
    this.debtOptions = this.debts
      .filter(d => (d.current ?? d.currentBalance ?? 0) > 0)
      .map(d => ({
        label: `${d.name} (₹${(d.current ?? d.currentBalance ?? 0).toLocaleString('en-IN')})`,
        value: d.name
      }));

    this.paymentForm = this.fb.group({
      debtName: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      method: ['UPI', Validators.required],
      date: [new Date(), Validators.required],
      notes: ['']
    });

    // Dynamically adjust validation when selected debt changes
    this.paymentForm.get('debtName')?.valueChanges.subscribe(name => {
      const selected = this.debts.find(d => d.name === name);
      if (selected) {
        const balance = selected.current ?? selected.currentBalance ?? 0;
        this.paymentForm.get('amount')?.setValidators([
          Validators.required,
          Validators.min(1),
          Validators.max(balance)
        ]);
        this.paymentForm.get('amount')?.updateValueAndValidity();
      }
    });
  }

  getSelectedDebtMaxBalance(): number {
    const name = this.paymentForm.get('debtName')?.value;
    const selected = this.debts.find(d => d.name === name);
    if (selected) {
      return selected.current ?? selected.currentBalance ?? 0;
    }
    return 0;
  }

  onSubmit() {
    if (this.paymentForm.valid) {
      const value = this.paymentForm.value;
      const date: Date = value.date;
      this.dialogRef.close({
        ...value,
        date: date instanceof Date ? date.toISOString().substring(0, 10) : value.date
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
