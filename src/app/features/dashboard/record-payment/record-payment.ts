import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-record-payment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    InputTextModule,
    SelectModule,
    ButtonModule
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
      date: [new Date().toISOString().substring(0, 10), Validators.required],
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
      this.dialogRef.close(this.paymentForm.value);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
