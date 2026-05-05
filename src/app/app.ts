import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    @if (showHeader()) {
      <header class="app-header">
        <div class="header-inner">
          <div class="header-brand" (click)="goHome()">
            <svg class="header-logo" viewBox="0 0 680 260" role="img" xmlns="http://www.w3.org/2000/svg">
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
          </div>
          <div class="header-actions">
            @if (auth.isAuthenticated()) {
              <span class="plan-badge" [class.plan-pro]="auth.isPro()" [class.plan-free]="!auth.isPro()">
                {{ auth.isPro() ? 'Pro' : 'Gratuito' }}
              </span>
              <button class="header-btn" (click)="router.navigate(['/dashboard'])">Dashboard</button>
              <button class="header-btn header-btn-secondary" (click)="auth.logout()">Salir</button>
            } @else {
              <button class="header-btn header-btn-primary" (click)="router.navigate(['/login'])">Iniciar sesion</button>
            }
          </div>
        </div>
      </header>
    }
    <div class="toast-container position-fixed bottom-0 end-0 p-3" id="toastContainer"></div>
    <div class="loading-overlay" id="loadingOverlay" style="display:none">
      <div class="text-center">
        <div class="spinner-border mb-3" style="width: 3rem; height: 3rem;"></div>
        <div class="loading-text" id="loadingText">Cargando...</div>
      </div>
    </div>
    <router-outlet></router-outlet>
  `,
  styles: [`
    .app-header {
      position: sticky;
      top: 0;
      z-index: 200;
      background: rgba(248, 249, 251, 0.85);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-bottom: 0.5px solid #e2e6ea;
    }
    .header-inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .header-brand {
      cursor: pointer;
      display: flex;
      align-items: center;
    }
    .header-logo {
      height: 32px;
      width: auto;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .plan-badge {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 4px 12px;
      border-radius: 100px;
    }
    .plan-badge.plan-pro {
      background: #EFF6FF;
      color: #2563EB;
    }
    .plan-badge.plan-free {
      background: #f1f5f9;
      color: #64748b;
    }
    .header-btn {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      font-weight: 600;
      padding: 8px 18px;
      border-radius: 8px;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .header-btn-primary {
      background: #2563EB;
      color: #fff;
      border: none;
    }
    .header-btn-primary:hover { opacity: 0.88; }
    .header-btn-secondary {
      background: #fff;
      color: #0f172a;
      border: 0.5px solid #cbd5e1;
    }
    .header-btn-secondary:hover { background: #f8f9fb; }
  `]
})
export class App implements OnInit {
  auth = inject(AuthService);
  router = inject(Router);

  showHeader = signal(true);

  private hideHeaderRoutes = ['/', '/landing'];

  constructor() {
    this.router.events.subscribe((e: any) => {
      if (e.urlAfterRedirects !== undefined) {
        this.showHeader.set(!this.hideHeaderRoutes.includes(e.urlAfterRedirects));
      }
    });
  }

  async ngOnInit() {
    await this.auth.init();
  }

  goHome() {
    this.router.navigate(['/']);
  }
}
