import { Routes } from '@angular/router';
import { authGuard, anonGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'landing', pathMatch: 'full' },
  { path: 'landing', loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent) },
  { path: 'features', loadComponent: () => import('./features/features/features.component').then(m => m.FeaturesComponent) },
  { path: 'empresa', loadComponent: () => import('./features/empresa/empresa.component').then(m => m.EmpresaComponent) },
  { path: 'precios', loadComponent: () => import('./features/precios/precios.component').then(m => m.PreciosComponent) },
  { path: 'login', canActivate: [anonGuard], loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', canActivate: [anonGuard], loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
  { path: 'dashboard', canActivate: [authGuard], loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'admin', canActivate: [adminGuard], loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent) },
  { path: 'upload', canActivate: [authGuard], loadComponent: () => import('./features/upload/upload.component').then(m => m.UploadComponent) },
  { path: 'sign-zone', canActivate: [authGuard], loadComponent: () => import('./features/upload/sign-zone.component').then(m => m.SignZoneComponent) },
  { path: 'sign', loadComponent: () => import('./features/signature/signature.component').then(m => m.SignatureComponent) },
  { path: 'pricing', canActivate: [authGuard], loadComponent: () => import('./features/pricing/pricing.component').then(m => m.PricingComponent) },
  { path: 'done', loadComponent: () => import('./features/signature/done.component').then(m => m.DoneComponent) },
  { path: '**', redirectTo: 'landing' }
];