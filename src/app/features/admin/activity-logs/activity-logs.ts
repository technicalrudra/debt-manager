import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-activity-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatCardModule, MatInputModule, MatIconModule],
  templateUrl: './activity-logs.html',
  styleUrls: ['./activity-logs.scss']
})
export class ActivityLogs implements OnInit {
  private adminService = inject(AdminService);
  
  searchText: string = '';
  
  displayedColumns: string[] = ['timestamp', 'admin', 'action', 'target', 'details'];
  
  logs = computed(() => {
    let result = this.adminService.activityLogs();
    if (this.searchText.trim()) {
      const search = this.searchText.toLowerCase().trim();
      result = result.filter(l => 
        l.action.toLowerCase().includes(search) || 
        l.target_user_id?.toLowerCase().includes(search) ||
        l.admin_id?.toLowerCase().includes(search)
      );
    }
    return result;
  });

  constructor() {}

  async ngOnInit() {
    await this.adminService.loadActivityLogs();
  }
}
