import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Sidebar } from '../sidebar/sidebar';
import { Header } from '../header/header';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatSidenavModule, Sidebar, Header],
  templateUrl: './shell.html',
  styleUrls: ['./shell.scss']
})
export class Shell {
  isCollapsed = signal(false);

  toggleSidebar() {
    this.isCollapsed.update(val => !val);
  }
}
