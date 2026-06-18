import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TransactionService } from '../../core/services/transaction.service';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    EmptyState
  ],
  templateUrl: './transactions.html',
  styleUrls: ['./transactions.scss']
})
export class Transactions implements OnInit {
  private transactionService = inject(TransactionService);

  searchText: string = '';
  selectedTypeFilter: string = 'All';

  displayedColumns: string[] = ['date', 'description', 'type', 'amount'];

  filteredTransactions = computed(() => {
    let result = this.transactionService.transactions();

    if (this.searchText.trim()) {
      const search = this.searchText.toLowerCase().trim();
      result = result.filter(t => t.description.toLowerCase().includes(search));
    }

    if (this.selectedTypeFilter !== 'All') {
      result = result.filter(t => t.type === this.selectedTypeFilter);
    }

    return result;
  });

  constructor() {}

  async ngOnInit() {
    await this.transactionService.loadTransactions();
  }
}
