import { Component, signal, computed, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';
import { Sidebar } from '../sidebar/sidebar';
import { Header } from '../header/header';
import { BottomNav } from '../bottom-nav/bottom-nav';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatSidenavModule, Sidebar, Header, BottomNav],
  templateUrl: './shell.html',
  styleUrls: ['./shell.scss']
})
export class Shell implements OnDestroy {
  private breakpoints = inject(BreakpointObserver);
  private bpSub: Subscription;

  isCollapsed = signal(false);
  sidenavOpen = signal(false);
  isMobile = signal(this.breakpoints.isMatched('(max-width: 767px)'));

  sidenavMode = computed((): 'over' | 'side' => this.isMobile() ? 'over' : 'side');
  sidenavOpened = computed(() => this.isMobile() ? this.sidenavOpen() : true);

  constructor() {
    this.bpSub = this.breakpoints.observe('(max-width: 767px)').subscribe(result => {
      this.isMobile.set(result.matches);
      if (!result.matches) {
        this.sidenavOpen.set(false);
      }
    });
  }

  ngOnDestroy() {
    this.bpSub.unsubscribe();
  }

  toggleSidebar() {
    if (this.isMobile()) {
      this.sidenavOpen.update(v => !v);
    } else {
      this.isCollapsed.update(v => !v);
    }
  }

  onSidenavOpenedChange(opened: boolean) {
    if (this.isMobile()) {
      this.sidenavOpen.set(opened);
    }
  }
}
