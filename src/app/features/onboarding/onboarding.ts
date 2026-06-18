import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { UserDataService } from '../../core/services/user-data.service';
import { DebtService } from '../../core/services/debt.service';
import { ProfileUpdate } from '../../core/models/profile.model';

interface LocalIncome {
  sourceName: string;
  amount: number | null;
  frequency: string;
}

interface LocalDebt {
  name: string;
  type: string;
  currentBalance: number | null;
  emi: number | null;
}

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    InputTextModule,
    SelectModule,
    ButtonModule
  ],
  templateUrl: './onboarding.html',
  styleUrls: ['./onboarding.scss']
})
export class Onboarding implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  public userDataService = inject(UserDataService);
  public debtService = inject(DebtService);
  private dialogRef = inject(MatDialogRef<Onboarding>, { optional: true });

  currentStep: number = 1;
  profileForm!: FormGroup;

  // In-place editable lists matching the screenshot cards
  incomeList: LocalIncome[] = [];
  debtsList: LocalDebt[] = [];

  frequencies = [
    { label: 'Monthly', value: 'Monthly' },
    { label: 'Quarterly', value: 'Quarterly' },
    { label: 'Yearly', value: 'Yearly' }
  ];

  debtTypes = [
    { label: 'Loan', value: 'Loan' },
    { label: 'Credit Card', value: 'Credit Card' },
    { label: 'Personal Loan', value: 'Personal Loan' },
    { label: 'Other', value: 'Other' }
  ];

  async ngOnInit() {
    // Make sure profile is loaded
    await this.userDataService.loadProfile();
    const currentProfile: Partial<ProfileUpdate> = this.userDataService.profile() || {};

    // 1. Initialize Profile Form
    this.profileForm = this.fb.group({
      fullName: [currentProfile.full_name || '', Validators.required],
      email: [currentProfile.email || 'test@gmail.com', [Validators.required, Validators.email]],
      mobile: [currentProfile.mobile || '', Validators.required]
    });

    // 2. Initialize Income Sources list (prepopulate with one default card if empty to match screenshot)
    await this.userDataService.loadIncomeSources();
    const savedIncome = this.userDataService.incomeSources();
    if (savedIncome.length > 0) {
      this.incomeList = savedIncome.map(inc => ({
        sourceName: inc.source_name,
        amount: Number(inc.amount),
        frequency: inc.frequency
      }));
    } else {
      this.incomeList = [{ sourceName: 'salary', amount: 90000, frequency: 'Monthly' }];
    }

    // 3. Initialize Debts list (prepopulate with one default card if empty to match screenshot)
    await this.debtService.loadDebts();
    const savedDebts = this.debtService.debts();
    if (savedDebts.length > 0) {
      this.debtsList = savedDebts.map(d => ({
        name: d.name,
        type: d.type,
        currentBalance: Number(d.current_balance),
        emi: Number(d.emi)
      }));
    } else {
      this.debtsList = [{ name: '', type: 'Loan', currentBalance: null, emi: null }];
    }
  }

  // Next Step / Navigation Logic
  nextStep() {
    if (this.currentStep === 1) {
      if (this.profileForm.valid) {
        this.currentStep = 2;
      }
    } else if (this.currentStep === 2) {
      this.currentStep = 3;
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  // Step 2: Income Add/Delete
  addIncomeSource() {
    this.incomeList.push({ sourceName: '', amount: null, frequency: 'Monthly' });
  }

  removeIncomeSource(index: number) {
    this.incomeList.splice(index, 1);
  }

  // Step 3: Debt Add/Delete
  addDebt() {
    this.debtsList.push({ name: '', type: 'Loan', currentBalance: null, emi: null });
  }

  removeDebt(index: number) {
    this.debtsList.splice(index, 1);
  }

  // Close Modal
  close() {
    if (this.dialogRef) {
      this.dialogRef.close();
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  // Finalize Onboarding Setup
  async completeSetup() {
    // 1. Save Profile Details
    const currentProfile: Partial<ProfileUpdate> = this.userDataService.profile() || {};
    const profileData: ProfileUpdate = {
      full_name: this.profileForm.value.fullName,
      mobile: this.profileForm.value.mobile,
      email: this.profileForm.value.email,
      city: currentProfile.city || '',
      state: currentProfile.state || '',
      country: currentProfile.country || 'India',
      company: currentProfile.company || '',
      job_title: currentProfile.job_title || '',
      employment_type: currentProfile.employment_type || 'Salaried',
      currency: currentProfile.currency || 'INR',
      onboarding_completed: true
    };
    await this.userDataService.saveProfile(profileData);

    // 2. Save Income Sources
    const finalIncomes = this.incomeList
      .filter(inc => inc.sourceName.trim() !== '' && inc.amount !== null)
      .map(inc => ({
        type: 'Salary',
        source_name: inc.sourceName,
        amount: inc.amount as number,
        frequency: inc.frequency,
        recurring: true
      }));
    
    for (const inc of finalIncomes) {
      await this.userDataService.addIncome(inc);
    }

    // 3. Save Debts
    const finalDebts = this.debtsList
      .filter(d => d.name.trim() !== '' && d.currentBalance !== null)
      .map(d => ({
        name: d.name,
        type: d.type,
        lender: 'Other',
        original_amount: d.currentBalance as number,
        current_balance: d.currentBalance as number,
        interest_rate: 12,
        emi: d.emi || 0,
        tenure: 12,
        due_date: 5,
        priority: 'Medium' as const,
        status: 'Active' as const
      }));
    
    for (const debt of finalDebts) {
      await this.debtService.addDebt(debt);
    }

    // Set completed
    await this.userDataService.setOnboardingCompleted(true);
    this.close();
  }
}
