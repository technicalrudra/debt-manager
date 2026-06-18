import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [() => import('./core/guards/guest.guard').then(m => m.guestGuard)],
    loadComponent: () => import('./features/auth/login/login').then(m => m.Login)
  },
  {
    path: 'signup',
    canActivate: [() => import('./core/guards/guest.guard').then(m => m.guestGuard)],
    loadComponent: () => import('./features/auth/signup/signup').then(m => m.Signup)
  },
  {
    path: 'forgot-password',
    canActivate: [() => import('./core/guards/guest.guard').then(m => m.guestGuard)],
    loadComponent: () => import('./features/auth/forgot-password/forgot-password').then(m => m.ForgotPassword)
  },
  { path: 'pending-approval', loadComponent: () => import('./features/auth/pending-approval/pending-approval').then(m => m.PendingApproval) },
  {
    path: '',
    loadComponent: () => import('./layout/user-shell/shell').then(m => m.Shell),
    canActivate: [
      () => import('./core/guards/auth.guard').then(m => m.authGuard),
      () => import('./core/guards/approved.guard').then(m => m.approvedGuard)
    ],
    children: [
      { path: 'access-denied', loadComponent: () => import('./features/auth/access-denied/access-denied').then(m => m.AccessDenied) },
      { path: 'dashboard', data: { module: 'dashboard' }, canActivate: [() => import('./core/guards/module.guard').then(m => m.moduleGuard)], loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard) },
      { path: 'profile', data: { module: 'profile' }, canActivate: [() => import('./core/guards/module.guard').then(m => m.moduleGuard)], loadComponent: () => import('./features/profile/profile').then(m => m.Profile) },
      { path: 'debts', data: { module: 'debts' }, canActivate: [() => import('./core/guards/module.guard').then(m => m.moduleGuard)], loadComponent: () => import('./features/debts/debts').then(m => m.Debts) },
      { path: 'income', data: { module: 'income' }, canActivate: [() => import('./core/guards/module.guard').then(m => m.moduleGuard)], loadComponent: () => import('./features/income/income').then(m => m.Income) },
      { path: 'transactions', data: { module: 'transactions' }, canActivate: [() => import('./core/guards/module.guard').then(m => m.moduleGuard)], loadComponent: () => import('./features/transactions/transactions').then(m => m.Transactions) },
      { path: 'expenses', data: { module: 'expenses' }, canActivate: [() => import('./core/guards/module.guard').then(m => m.moduleGuard)], loadComponent: () => import('./features/expenses/expenses').then(m => m.Expenses) },
      { path: 'reports', data: { module: 'reports' }, canActivate: [() => import('./core/guards/module.guard').then(m => m.moduleGuard)], loadComponent: () => import('./features/reports/reports').then(m => m.Reports) },
      { path: 'settings', data: { module: 'settings' }, canActivate: [() => import('./core/guards/module.guard').then(m => m.moduleGuard)], loadComponent: () => import('./features/settings/settings').then(m => m.Settings) },
      { path: 'subscription', data: { module: 'subscription' }, canActivate: [() => import('./core/guards/module.guard').then(m => m.moduleGuard)], loadComponent: () => import('./features/subscription/subscription').then(m => m.SubscriptionPage) }
    ]
  },
  {
    path: 'admin',
    loadComponent: () => import('./layout/admin-shell/admin-shell').then(m => m.AdminShell),
    canActivate: [() => import('./core/guards/admin.guard').then(m => m.adminGuard)],
    children: [
      { path: '', loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard').then(m => m.AdminDashboard) },
      { path: 'users', loadComponent: () => import('./features/admin/user-management/user-management').then(m => m.UserManagement) },
      { path: 'approvals', loadComponent: () => import('./features/admin/user-approvals/user-approvals').then(m => m.UserApprovals) },
      { path: 'roles', loadComponent: () => import('./features/admin/role-management/role-management').then(m => m.RoleManagement) },
      { path: 'permissions', loadComponent: () => import('./features/admin/roles-permissions/roles-permissions').then(m => m.RolesPermissions) },
      { path: 'modules', loadComponent: () => import('./features/admin/module-management/module-management').then(m => m.ModuleManagement) },
      { path: 'plans', loadComponent: () => import('./features/admin/plan-management/plan-management').then(m => m.PlanManagement) },
      { path: 'activity', loadComponent: () => import('./features/admin/activity-logs/activity-logs').then(m => m.ActivityLogs) },
      { path: 'notifications', loadComponent: () => import('./features/admin/admin-notifications/admin-notifications').then(m => m.AdminNotifications) },
      { path: 'settings', loadComponent: () => import('./features/admin/admin-settings/admin-settings').then(m => m.AdminSettings) }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
