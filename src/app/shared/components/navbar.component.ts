import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  template: `
    <nav class="nav-bar">
      <div class="nav-inner">
        <a class="nav-brand" routerLink="/">
          <svg class="nav-logo" viewBox="0 0 680 260" xmlns="http://www.w3.org/2000/svg">
            <title>SignFlow</title>
            <g transform="translate(130, 40)">
              <path d="M42 0 L84 16 L84 52 Q84 80 42 96 Q0 80 0 52 L0 16 Z" fill="#2563EB" opacity="0.12"/>
              <path d="M42 6 L78 20 L78 52 Q78 76 42 90 Q6 76 6 52 L6 20 Z" fill="none" stroke="#2563EB" stroke-width="1.5" stroke-linejoin="round"/>
              <path d="M22 50 Q30 38 38 48 Q48 22 66 32" fill="none" stroke="#2563EB" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="66" cy="32" r="3.5" fill="#2563EB"/>
              <line x1="20" y1="62" x2="68" y2="62" stroke="#2563EB" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
            </g>
            <line x1="236" y1="65" x2="236" y2="135" stroke="#2563EB" stroke-width="0.75" opacity="0.25"/>
            <text x="252" y="116" font-family="'Helvetica Neue', Arial, sans-serif" font-size="52" font-weight="700" letter-spacing="-1" fill="#0f172a">Sign</text>
            <text x="367" y="116" font-family="'Helvetica Neue', Arial, sans-serif" font-size="52" font-weight="300" letter-spacing="-1" fill="#2563EB">Flow</text>
          </svg>
        </a>

        <div class="nav-links">
          <a class="nav-link" routerLink="/features" routerLinkActive="nav-link-active">Caracteristicas</a>
          <a class="nav-link" routerLink="/precios" routerLinkActive="nav-link-active">Precios</a>
          <a class="nav-link" routerLink="/empresa" routerLinkActive="nav-link-active">Empresa</a>
        </div>

        <div class="nav-actions">
          @if (auth.isAuthenticated()) {
            <span class="plan-badge" [class.plan-pro]="auth.isPro()" [class.plan-free]="!auth.isPro()">
              {{ auth.isPro() ? 'Pro' : 'Gratuito' }}
            </span>
            <a class="nav-btn nav-btn-secondary" routerLink="/dashboard">Dashboard</a>
            <button class="nav-btn nav-btn-secondary" (click)="auth.logout()">Salir</button>
          } @else {
            <a class="nav-btn nav-btn-primary" routerLink="/login">Iniciar sesion</a>
            <a class="nav-btn nav-btn-outline" routerLink="/register">Registrarse</a>
          }
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .nav-bar {
      position: sticky;
      top: 0;
      z-index: 200;
      background: rgba(248, 249, 251, 0.85);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-bottom: 0.5px solid #e2e6ea;
    }
    .nav-inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .nav-brand {
      display: flex;
      align-items: center;
      text-decoration: none;
    }
    .nav-logo {
      height: 32px;
      width: auto;
    }
    .nav-links {
      display: flex;
      gap: 28px;
    }
    .nav-link {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      font-weight: 500;
      color: #334155;
      text-decoration: none;
      cursor: pointer;
      transition: color 0.15s;
      padding: 4px 0;
      position: relative;
    }
    .nav-link:hover {
      color: #0f172a;
    }
    .nav-link-active {
      color: #2563EB;
    }
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .nav-btn {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      font-weight: 600;
      padding: 8px 18px;
      border-radius: 8px;
      cursor: pointer;
      transition: opacity 0.15s, background 0.15s;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
    }
    .nav-btn-primary {
      background: #2563EB;
      color: #fff;
      border: none;
    }
    .nav-btn-primary:hover { opacity: 0.88; }
    .nav-btn-secondary {
      background: #fff;
      color: #0f172a;
      border: 0.5px solid #cbd5e1;
    }
    .nav-btn-secondary:hover { background: #f8f9fb; }
    .nav-btn-outline {
      background: transparent;
      color: #334155;
      border: 0.5px solid #cbd5e1;
    }
    .nav-btn-outline:hover { background: #f8f9fb; }
    .nav-cta {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      background: #2563EB;
      border: none;
      border-radius: 8px;
      padding: 8px 18px;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .nav-cta:hover { opacity: 0.88; }
    .plan-badge {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 4px 12px;
      border-radius: 100px;
    }
    .plan-badge.plan-pro { background: #EFF6FF; color: #2563EB; }
    .plan-badge.plan-free { background: #f1f5f9; color: #64748b; }
    @media (max-width: 768px) {
      .nav-links { display: none; }
      .nav-btn-outline { display: none; }
    }
  `]
})
export class NavbarComponent {
  auth = inject(AuthService);
  router = inject(Router);
}