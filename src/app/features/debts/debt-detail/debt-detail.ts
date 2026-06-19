import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  LucideArrowLeft, LucideWallet, LucideTrendingDown, LucideClock,
  LucideCalendarCheck, LucideCircleCheck, LucideBanknote, LucidePercent,
  LucideZap, LucidePiggyBank, LucideTarget, LucideFlame, LucideLightbulb,
  LucideScrollText
} from '@lucide/angular';
import { DebtService } from '../../../core/services/debt.service';
import { PaymentService } from '../../../core/services/payment.service';

@Component({
  selector: 'app-debt-detail',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatTableModule, MatProgressBarModule,
    LucideArrowLeft, LucideWallet, LucideTrendingDown, LucideClock,
    LucideCalendarCheck, LucideCircleCheck, LucideBanknote, LucidePercent,
    LucideZap, LucidePiggyBank, LucideTarget, LucideFlame, LucideLightbulb,
    LucideScrollText
  ],
  templateUrl: './debt-detail.html',
  styleUrls: ['./debt-detail.scss']
})
export class DebtDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private debtService = inject(DebtService);
  private paymentService = inject(PaymentService);

  debtId = signal<string | null>(null);
  loading = signal(true);

  debt = computed(() => {
    const id = this.debtId();
    if (!id) return null;
    return this.debtService.debts().find(d => d.id === id) ?? null;
  });

  debtPayments = computed(() => {
    const id = this.debtId();
    if (!id) return [];
    return this.paymentService.payments()
      .filter(p => p.debt_id === id)
      .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
  });

  stats = computed(() => {
    const d = this.debt();
    if (!d) return null;

    const original = Number(d.original_amount);
    const current  = Number(d.current_balance);
    const emi      = Number(d.emi);
    const rate     = Number(d.interest_rate);
    const paid     = Math.max(0, original - current);
    const paidPct  = original > 0 ? Math.min(100, Math.round((paid / original) * 100)) : 0;
    const monthsRemaining = emi > 0 ? Math.ceil(current / emi) : 0;

    // Payoff date
    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + monthsRemaining);

    // Months completed — prefer payment count, fallback to estimate
    const pymts = this.debtPayments();
    const monthsPaid = pymts.length > 0 ? pymts.length : (emi > 0 ? Math.floor(paid / emi) : 0);

    // Earliest payment date for timeline start
    const firstPayment = pymts.length > 0
      ? new Date(pymts[pymts.length - 1].payment_date)
      : null;

    // Estimated start date (months before first payment OR fall back to (monthsPaid) months ago)
    const startDate = firstPayment
      ? new Date(firstPayment)
      : (() => { const d = new Date(); d.setMonth(d.getMonth() - monthsPaid); return d; })();

    // Remaining interest (reducing balance approximation)
    const monthlyRate = rate / 100 / 12;
    let interestRemaining = 0;
    let balance = current;
    for (let i = 0; i < monthsRemaining && balance > 0; i++) {
      const interest = balance * monthlyRate;
      interestRemaining += interest;
      balance = Math.max(0, balance - (emi - interest));
    }
    interestRemaining = Math.round(interestRemaining);

    // Interest already paid estimate (simple: total paid - principal reduction)
    const principalPaid = paid;
    const totalPaid = pymts.reduce((sum, p) => sum + Number(p.amount), 0);
    const interestPaid = Math.max(0, totalPaid - principalPaid);

    const barColor = paidPct >= 60 ? '#10b981' : paidPct >= 25 ? '#f59e0b' : '#ef4444';

    return {
      original, current, paid, paidPct, emi, rate,
      monthsRemaining, monthsPaid, payoffDate, startDate,
      interestRemaining, interestPaid, totalPaid, barColor
    };
  });

  scenarios = computed(() => {
    const s = this.stats();
    if (!s || s.emi === 0) return [];
    const extras = [0, 2000, 5000, 10000];
    const today = new Date();
    const monthlyRate = s.rate / 100 / 12;

    return extras.map(extra => {
      const newEmi = s.emi + extra;
      // Accurate months remaining with reducing balance
      let months = 0;
      let balance = s.current;
      while (balance > 0 && months < 1200) {
        const interest = balance * monthlyRate;
        balance = Math.max(0, balance - (newEmi - interest));
        months++;
      }
      const date = new Date(today);
      date.setMonth(date.getMonth() + months);
      const monthsSaved = s.monthsRemaining - months;
      const interestSaved = Math.max(0, Math.round(monthsSaved * s.emi * 0.15));
      return {
        label: extra === 0 ? 'Current pace' : `+₹${extra.toLocaleString('en-IN')}/mo`,
        months,
        payoffDate: date,
        monthsSaved: Math.max(0, monthsSaved),
        interestSaved,
        isBase: extra === 0
      };
    });
  });

  paymentColumns = ['date', 'amount', 'method', 'notes'];

  get nowLabelPct(): number {
    const pct = this.stats()?.paidPct ?? 0;
    return Math.min(88, Math.max(10, pct));
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.debtId.set(id);
    await Promise.all([
      this.debtService.loadDebts(),
      this.paymentService.loadPayments()
    ]);
    this.loading.set(false);
  }

  goBack() {
    this.router.navigate(['/debts']);
  }

  fmt(date: Date): string {
    return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  }

  fmtFull(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
