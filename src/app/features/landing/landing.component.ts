import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  template: `
    <div class="landing-page">

      <!-- Hero -->
      <section class="hero">
        <div class="hero-inner">

          <!-- Left: Copy -->
          <div class="hero-copy">
            <div class="eyebrow">
              <span class="eyebrow-dot"></span>
              <span class="eyebrow-text">eIDAS &middot; ISO 27001 &middot; SOC 2 Type II</span>
            </div>

            <h1 class="hero-h1">
              <span class="h1-dark">Firma sin fricciones.</span><br>
              <span class="h1-blue">Validez sin excusas.</span>
            </h1>

            <p class="hero-body">
              Envia documentos para firma y recibelos firmados con
              pleno valor legal. Sin reuniones, sin impresoras, sin demoras.
            </p>

            <div class="hero-cta-group">
              <button class="btn-primary-cta" (click)="router.navigate(['/login'])">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Enviar para firma
              </button>
              <button class="btn-secondary-cta" (click)="router.navigate(['/sign'])">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                Firmar documento
              </button>
            </div>

            <!-- Social proof -->
            <div class="social-proof">
              <div class="avatar-stack">
                <div class="avatar" style="--bg:#2563EB;">MR</div>
                <div class="avatar" style="--bg:#7C3AED;">LC</div>
                <div class="avatar" style="--bg:#059669;">JP</div>
                <div class="avatar" style="--bg:#D97706;">AS</div>
              </div>
              <span class="social-proof-text">+2,400 empresas ya usan SignFlow</span>
            </div>
          </div>

          <!-- Right: Product preview -->
          <div class="hero-visual">
            <div class="preview-card">
              <div class="preview-header">
                <div class="preview-dot" style="background:#ef4444;"></div>
                <div class="preview-dot" style="background:#f59e0b;"></div>
                <div class="preview-dot" style="background:#22c55e;"></div>
                <span class="preview-filename">Contrato_Arriendo_2025.pdf</span>
                <span class="preview-status">Pendiente</span>
              </div>
              <div class="preview-body">
                <div class="preview-line" style="width:100%;"></div>
                <div class="preview-line" style="width:88%;"></div>
                <div class="preview-line" style="width:94%;"></div>
                <div class="preview-line" style="width:72%;"></div>
                <div class="preview-line" style="width:82%;"></div>
                <div class="preview-line" style="width:40%;"></div>
                <div class="preview-spacer"></div>
                <div class="preview-sign-line">
                  <div class="sign-block">
                    <div class="sign-label">Firma</div>
                    <div class="sign-name">Maria Rodriguez</div>
                    <svg class="sign-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div class="sign-block">
                    <div class="sign-label">Firma</div>
                    <div class="sign-name sign-pending">Carlos Mendez</div>
                    <div class="sign-waiting-dot"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features -->
      <section class="features-section" id="features">
        <div class="features-inner">
          <div class="feature-card" (click)="router.navigate(['/login'])">
            <div class="feature-icon-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </div>
            <h3 class="feature-heading">Enviar para firma</h3>
            <p class="feature-body">Sube un PDF, define zonas de firma y envia en segundos. Cada firmante recibe un link unico.</p>
          </div>
          <div class="feature-card" (click)="router.navigate(['/sign'])">
            <div class="feature-icon-box icon-blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </div>
            <h3 class="feature-heading">Firmar documento</h3>
            <p class="feature-body">Ingresa tu codigo de 8 caracteres y firma con un trazo manuscrito. Termina en menos de un minuto.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon-box icon-green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h3 class="feature-heading">Validez legal</h3>
            <p class="feature-body">Cumple con eIDAS, ISO 27001 y SOC 2. Audit trail completo con sello temporal y evidencia inviolable.</p>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host {
      --blue: #2563EB;
      --dark: #0f172a;
      --surface: #ffffff;
      --bg: #f8f9fb;
      --border: #e2e8f0;
      --border-light: #f1f5f9;
      --text-1: #0f172a;
      --text-2: #334155;
      --text-3: #64748b;
      display: block;
    }

    .landing-page {
      background: var(--bg);
      min-height: 100vh;
      font-family: 'Helvetica Neue', Arial, sans-serif;
    }

    /* ─── Hero ─── */
    .hero {
      padding: 72px 24px 80px;
    }
    .hero-inner {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 64px;
      align-items: center;
    }

    /* ── Eyebrow ── */
    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #EFF6FF;
      padding: 6px 16px;
      border-radius: 100px;
      margin-bottom: 28px;
    }
    .eyebrow-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--blue);
    }
    .eyebrow-text {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #1d4ed8;
    }

    /* ── H1 ── */
    .hero-h1 {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 56px;
      font-weight: 800;
      letter-spacing: -2px;
      line-height: 1.05;
      margin: 0 0 24px 0;
    }
    .h1-dark {
      color: var(--dark);
    }
    .h1-blue {
      color: var(--blue);
    }

    /* ── Body ── */
    .hero-body {
      font-size: 18px;
      line-height: 1.6;
      color: var(--text-3);
      margin: 0 0 36px 0;
      max-width: 480px;
    }

    /* ── CTA group ── */
    .hero-cta-group {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 40px;
    }
    .btn-primary-cta,
    .btn-secondary-cta {
      font-family: inherit;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 15px;
      font-weight: 600;
      border-radius: 10px;
      padding: 13px 24px;
      cursor: pointer;
      transition: opacity 0.15s, background 0.15s;
    }
    .btn-primary-cta {
      background: var(--blue);
      color: #fff;
      border: none;
    }
    .btn-primary-cta:hover {
      opacity: 0.9;
    }
    .btn-secondary-cta {
      background: var(--surface);
      color: var(--dark);
      border: 0.5px solid #cbd5e1;
    }
    .btn-secondary-cta:hover {
      background: var(--bg);
    }

    /* ── Social proof ── */
    .social-proof {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .avatar-stack {
      display: flex;
    }
    .avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--bg, #2563EB);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1.5px solid #fff;
      margin-left: -8px;
    }
    .avatar:first-child {
      margin-left: 0;
    }
    .social-proof-text {
      font-size: 14px;
      color: var(--text-3);
    }

    /* ─── Product Preview ─── */
    .hero-visual {
      display: flex;
      justify-content: center;
    }
    .preview-card {
      width: 100%;
      background: var(--surface);
      border: 0.5px solid var(--border);
      border-radius: 14px;
      overflow: hidden;
    }
    .preview-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 14px 20px;
      border-bottom: 0.5px solid var(--border-light);
    }
    .preview-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .preview-filename {
      flex: 1;
      margin-left: 10px;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-1);
    }
    .preview-status {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #d97706;
      background: #fffbeb;
      padding: 3px 10px;
      border-radius: 100px;
    }
    .preview-body {
      padding: 24px 20px 28px;
    }
    .preview-line {
      height: 10px;
      border-radius: 5px;
      background: #f1f5f9;
      margin-bottom: 10px;
    }
    .preview-spacer {
      height: 24px;
    }
    .preview-sign-line {
      display: flex;
      gap: 16px;
    }
    .sign-block {
      border: 0.5px solid var(--border);
      border-radius: 10px;
      padding: 14px 16px;
      flex: 1;
      position: relative;
    }
    .sign-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-3);
      margin-bottom: 4px;
    }
    .sign-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-1);
      font-style: italic;
    }
    .sign-pending {
      color: var(--text-3);
    }
    .sign-check {
      position: absolute;
      top: 14px;
      right: 14px;
    }
    .sign-waiting-dot {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid #cbd5e1;
      background: #fff;
    }

    /* ─── Features ─── */
    .features-section {
      padding: 0 24px 80px;
    }
    .features-inner {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
    .feature-card {
      background: var(--surface);
      border: 0.5px solid var(--border);
      border-radius: 12px;
      padding: 28px 24px;
      cursor: pointer;
      transition: border-color 0.15s;
    }
    .feature-card:hover {
      border-color: #cbd5e1;
    }
    .feature-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: #EFF6FF;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 18px;
    }
    .feature-icon-box.icon-blue {
      background: #EFF6FF;
    }
    .feature-icon-box.icon-green {
      background: #ECFDF5;
    }
    .feature-heading {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-1);
      margin: 0 0 8px 0;
    }
    .feature-body {
      font-size: 14px;
      line-height: 1.6;
      color: var(--text-3);
      margin: 0;
    }

    /* ─── Responsive ─── */
    @media (max-width: 900px) {
      .hero-inner {
        grid-template-columns: 1fr;
        gap: 48px;
      }
      .hero-h1 {
        font-size: 40px;
        letter-spacing: -1.5px;
      }
      .hero-body {
        font-size: 16px;
      }
      .nav-links {
        display: none;
      }
      .features-inner {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 520px) {
      .hero-h1 {
        font-size: 32px;
        letter-spacing: -1px;
      }
      .hero-cta-group {
        flex-direction: column;
      }
      .btn-primary-cta,
      .btn-secondary-cta {
        justify-content: center;
        width: 100%;
      }
    }
  `]
})
export class LandingComponent {
  constructor(public router: Router) {}
}