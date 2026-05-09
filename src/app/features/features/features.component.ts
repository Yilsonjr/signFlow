import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page">
      <section class="hero-section">
        <div class="container">
          <div class="eyebrow"><span class="eyebrow-dot"></span><span class="eyebrow-text">Caracteristicas</span></div>
          <h1 class="page-title"><span class="title-dark">Todo lo que necesitas</span><br><span class="title-blue">para firmar con confianza.</span></h1>
          <p class="page-subtitle">SignFlow combina seguridad, velocidad y validez legal en una plataforma disenada para profesionales y equipos.</p>
        </div>
      </section>
      <section class="features-grid">
        <div class="container">
          <div class="grid">
            <div class="feature-card"><div class="feature-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></div><h3>Envio rapido</h3><p>Sube un PDF, define zonas de firma y envia en segundos. Cada firmante recibe un link unico y seguro.</p></div>
            <div class="feature-card"><div class="feature-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></div><h3>Firma manuscrita</h3><p>Firma con un trazo natural sobre la pantalla. Dibuja tu firma una vez y reutiliza en todos los documentos.</p></div>
            <div class="feature-card"><div class="feature-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div><h3>Validez legal</h3><p>Cumple con eIDAS, ISO 27001 y SOC 2 Type II. Audit trail completo con sello temporal y evidencia inviolable.</p></div>
            <div class="feature-card"><div class="feature-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div><h3>Multiples firmantes</h3><p>Envia un documento a varios firmantes con orden de firma configurable. Recibe notificaciones en tiempo real.</p></div>
            <div class="feature-card"><div class="feature-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg></div><h3>Dashboard completo</h3><p>Visualiza el estado de cada documento, gestiona firmantes y controla tu plan desde un panel centralizado.</p></div>
            <div class="feature-card"><div class="feature-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div><h3>Sin fricciones</h3><p>Los firmantes no necesitan crear cuenta. Reciben un codigo de 8 caracteres y firman en menos de un minuto.</p></div>
          </div>
        </div>
      </section>
      <section class="cta-section"><div class="container"><h2>Comienza a firmar hoy</h2><p>3 documentos gratis al mes, sin tarjeta de credito.</p><a class="cta-btn" routerLink="/register">Crear cuenta gratis</a></div></section>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page { background: #f8f9fb; font-family: 'Helvetica Neue', Arial, sans-serif; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    .hero-section { padding: 80px 0 48px; }
    .eyebrow { display: inline-flex; align-items: center; gap: 8px; background: #EFF6FF; padding: 6px 16px; border-radius: 100px; margin-bottom: 24px; }
    .eyebrow-dot { width: 7px; height: 7px; border-radius: 50%; background: #2563EB; }
    .eyebrow-text { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #1d4ed8; }
    .page-title { font-size: 48px; font-weight: 800; letter-spacing: -2px; line-height: 1.05; margin: 0 0 20px 0; }
    .title-dark { color: #0f172a; } .title-blue { color: #2563EB; }
    .page-subtitle { font-size: 18px; line-height: 1.6; color: #64748b; margin: 0; max-width: 560px; }
    .features-grid { padding: 48px 0 80px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .feature-card { background: #fff; border: 0.5px solid #e2e8f0; border-radius: 12px; padding: 28px 24px; }
    .feature-card:hover { border-color: #cbd5e1; }
    .feature-icon { width: 44px; height: 44px; border-radius: 10px; background: #EFF6FF; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; }
    .feature-card h3 { font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; }
    .feature-card p { font-size: 14px; line-height: 1.6; color: #64748b; margin: 0; }
    .cta-section { padding: 80px 24px; text-align: center; }
    .cta-section h2 { font-size: 32px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0; letter-spacing: -1px; }
    .cta-section p { font-size: 16px; color: #64748b; margin: 0 0 28px 0; }
    .cta-btn { display: inline-flex; align-items: center; font-family: inherit; font-size: 15px; font-weight: 600; background: #2563EB; color: #fff; border: none; border-radius: 10px; padding: 13px 28px; text-decoration: none; transition: opacity 0.15s; }
    .cta-btn:hover { opacity: 0.88; }
    @media (max-width: 768px) { .page-title { font-size: 32px; letter-spacing: -1px; } .grid { grid-template-columns: 1fr; } }
  `]
})
export class FeaturesComponent {}