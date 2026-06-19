import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, MatIconModule, MatButtonModule, MatMenuModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class Header {
  @Output() toggleSidebar = new EventEmitter<void>();

  authService = inject(AuthService);
  private router = inject(Router);

  get greeting(): string {
    const hour = new Date().getHours();
    const name = this.authService.currentProfile()?.full_name ?? '';
    const first = name.split(' ')[0] || 'User';
    const time = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    return `${time}, ${first}`;
  }

  onToggle() {
    this.toggleSidebar.emit();
  }

  async logout() {
    await this.authService.signOut();
  }
}
