import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-container">
        <div class="auth-left">
          <div class="auth-brand" (click)="router.navigate(['/'])">
            <img src="/signflow-logo.png" alt="SignFlow" class="brand-logo">
            <span class="gradient-text">SignFlow</span>
          </div>
          <div class="auth-hero">
            <h1 class="auth-title">Bienvenido de nuevo</h1>
            <p class="auth-subtitle">Accede a tu cuenta para gestionar documentos y firmas digitales de forma segura.</p>
          </div>
          <div class="auth-features">
            <div class="feature-item">
              <div class="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              </div>
              <span>Gestiona documentos ilimitados</span>
            </div>
            <div class="feature-item">
              <div class="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <span>Firma digital segura y verificable</span>
            </div>
            <div class="feature-item">
              <div class="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <span>Múltiples firmantes por documento</span>
            </div>
          </div>
        </div>
        
        <div class="auth-right">
          <div class="auth-card">
            <div class="auth-header">
              <h2 class="auth-card-title">Iniciar sesión</h2>
              <p class="auth-card-subtitle">Ingresa tus credenciales para continuar</p>
            </div>
            
            <form class="auth-form" (submit)="login(); $event.preventDefault()">
              <div class="form-group">
                <label class="form-label">Correo electrónico</label>
                <div class="input-wrapper">
                  <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <input 
                    type="email" 
                    class="form-input" 
                    [(ngModel)]="email" 
                    name="email"
                    placeholder="nombre@empresa.com"
                    required
                  >
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">Contraseña</label>
                <div class="input-wrapper">
                  <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <input 
                    type="password" 
                    class="form-input" 
                    [(ngModel)]="password" 
                    name="password"
                    placeholder="••••••••"
                    (keydown.enter)="login()"
                    required
                  >
                </div>
              </div>
              
              <button type="submit" class="btn-submit" [disabled]="loading">
                @if (loading) {
                  <span class="spinner"></span>
                } @else {
                  <span>Iniciar sesión</span>
                }
              </button>
            </form>
            
            <div class="auth-divider">
              <span>o</span>
            </div>
            
            <button class="btn-outline" routerLink="/register">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
              <span>Crear cuenta nueva</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
    }
    
    .auth-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      width: 100%;
      min-height: 100vh;
    }
    
    .auth-left {
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      padding: 3rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
      color: white;
      position: relative;
      overflow: hidden;
    }
    
    .auth-left::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    }
    
    .auth-brand {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 3rem;
      cursor: pointer;
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .auth-brand .brand-logo {
      height: 40px;
      width: auto;
      border-radius: 8px;
    }
    
    .auth-brand .gradient-text {
      background: linear-gradient(135deg, #fff, rgba(255,255,255,0.8));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .auth-hero {
      margin-bottom: 3rem;
      position: relative;
      z-index: 1;
    }
    
    .auth-title {
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: 1rem;
      line-height: 1.1;
      color: white;
    }
    
    .auth-subtitle {
      font-size: 1.125rem;
      opacity: 0.9;
      line-height: 1.6;
      color: rgba(255,255,255,0.9);
    }
    
    .auth-features {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      position: relative;
      z-index: 1;
    }
    
    .feature-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 0.9375rem;
      opacity: 0.9;
    }
    
    .feature-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: rgba(255,255,255,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
    }
    
    .auth-right {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      background: var(--bg);
    }
    
    .auth-card {
      width: 100%;
      max-width: 420px;
    }
    
    .auth-header {
      margin-bottom: 2rem;
    }
    
    .auth-card-title {
      font-size: 1.875rem;
      font-weight: 700;
      color: var(--text-1);
      margin-bottom: 0.5rem;
    }
    
    .auth-card-subtitle {
      color: var(--text-3);
      font-size: 0.9375rem;
    }
    
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .form-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-2);
    }
    
    .input-wrapper {
      position: relative;
    }
    
    .input-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-4);
      pointer-events: none;
    }
    
    .form-input {
      width: 100%;
      padding: 12px 14px 12px 44px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      color: var(--text-1);
      font-size: 0.9375rem;
      font-family: 'Inter', sans-serif;
      transition: all 0.2s ease;
    }
    
    .form-input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--primary-glow);
    }
    
    .form-input::placeholder {
      color: var(--text-4);
    }
    
    .btn-submit {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, var(--primary), var(--primary-2));
      border: none;
      border-radius: var(--radius-md);
      color: white;
      font-size: 1rem;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 0.5rem;
      box-shadow: var(--shadow-sm);
    }
    
    .btn-submit:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: var(--shadow-primary);
    }
    
    .btn-submit:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    
    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .auth-divider {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin: 1.5rem 0;
      color: var(--text-4);
      font-size: 0.875rem;
    }
    
    .auth-divider::before,
    .auth-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border);
    }
    
    .btn-outline {
      width: 100%;
      padding: 14px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      color: var(--text-2);
      font-size: 1rem;
      font-weight: 500;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .btn-outline:hover {
      background: var(--bg-2);
      border-color: var(--border-2);
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }
    
    @media (max-width: 968px) {
      .auth-container {
        grid-template-columns: 1fr;
      }
      
      .auth-left {
        display: none;
      }
      
      .auth-right {
        padding: 2rem;
      }
    }
  `]
})
export class LoginComponent {
  private auth = inject(AuthService);
  router = inject(Router);
  email = '';
  password = '';
  loading = false;

  async login() {
    if (!this.email || !this.password) return;
    this.loading = true;
    await this.auth.login(this.email, this.password);
    this.loading = false;
  }
}
