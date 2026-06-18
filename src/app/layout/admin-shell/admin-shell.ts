import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { AdminSidebar } from '../admin-sidebar/admin-sidebar';
import { Header } from '../header/header';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatSidenavModule, AdminSidebar, Header],
  templateUrl: './admin-shell.html',
  styleUrls: ['../user-shell/shell.scss']
})
export class AdminShell {
  isCollapsed = signal(false);

  toggleSidebar() {
    this.isCollapsed.update(val => !val);
  }
}
