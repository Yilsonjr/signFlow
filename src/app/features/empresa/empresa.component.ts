import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-empresa',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page">
      <section class="hero-section"><div class="container"><div class="eyebrow"><span class="eyebrow-dot"></span><span class="eyebrow-text">Empresa</span></div><h1 class="page-title"><span class="title-dark">Construimos firma digital</span><br><span class="title-blue">con la confianza que mereces.</span></h1><p class="page-subtitle">SignFlow nacio para eliminar la friccion de los procesos de firma. Hoy ayudamos a miles de profesionales y empresas a cerrar acuerdos mas rapido, con plena validez legal.</p></div></section>
      <section class="stats-section"><div class="container"><div class="stats-grid"><div class="stat-card"><div class="stat-number">10K+</div><div class="stat-label">Documentos firmados</div></div><div class="stat-card"><div class="stat-number">5K+</div><div class="stat-label">Usuarios activos</div></div><div class="stat-card"><div class="stat-number">99.9%</div><div class="stat-label">Disponibilidad</div></div><div class="stat-card"><div class="stat-number">&lt;2min</div><div class="stat-label">Tiempo promedio de firma</div></div></div></div></section>
      <section class="values-section"><div class="container"><h2 class="section-title">Nuestros valores</h2><div class="values-grid"><div class="value-card"><div class="value-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div><h3>Seguridad primero</h3><p>Cifrado extremo a extremo, cumplimiento eIDAS, ISO 27001 y SOC 2. Tu informacion esta protegida.</p></div><div class="value-card"><div class="value-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div><h3>Velocidad sin compromiso</h3><p>Firma un documento en menos de 2 minutos. Sin registros, sin descargas, sin esperas.</p></div><div class="value-card"><div class="value-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div><h3>Para todos</h3><p>Desde freelancers hasta equipos corporativos. Planes flexibles que crecen contigo.</p></div></div></div></section>
      <section class="compliance-section"><div class="container"><h2 class="section-title">Cumplimiento normativo</h2><div class="compliance-grid"><div class="compliance-card"><div class="compliance-badge">eIDAS</div><p>Reglamento europeo de identificacion electronica. Validez legal plena.</p></div><div class="compliance-card"><div class="compliance-badge">ISO 27001</div><p>Gestion de seguridad de la informacion. Procesos auditados y certificados.</p></div><div class="compliance-card"><div class="compliance-badge">SOC 2 Type II</div><p>Controles de seguridad, disponibilidad y confidencialidad verificados.</p></div></div></div></section>
      <section class="cta-section"><div class="container"><h2>Unete a miles de profesionales</h2><p>Comienza a firmar digitalmente hoy. Sin tarjeta de credito.</p><a class="cta-btn" routerLink="/register">Crear cuenta gratis</a></div></section>
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
    .stats-section { padding: 48px 0; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
    .stat-card { background: #fff; border: 0.5px solid #e2e8f0; border-radius: 12px; padding: 28px 24px; text-align: center; }
    .stat-number { font-size: 36px; font-weight: 800; color: #2563EB; letter-spacing: -1px; margin-bottom: 4px; }
    .stat-label { font-size: 14px; color: #64748b; }
    .values-section { padding: 48px 0; }
    .section-title { font-size: 28px; font-weight: 700; color: #0f172a; margin: 0 0 32px 0; letter-spacing: -0.5px; }
    .values-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .value-card { background: #fff; border: 0.5px solid #e2e8f0; border-radius: 12px; padding: 32px 24px; }
    .value-icon { width: 44px; height: 44px; border-radius: 10px; background: #EFF6FF; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
    .value-card h3 { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 10px 0; }
    .value-card p { font-size: 14px; line-height: 1.6; color: #64748b; margin: 0; }
    .compliance-section { padding: 48px 0; }
    .compliance-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .compliance-card { background: #fff; border: 0.5px solid #e2e8f0; border-radius: 12px; padding: 28px 24px; text-align: center; }
    .compliance-badge { display: inline-block; font-size: 13px; font-weight: 700; color: #2563EB; background: #EFF6FF; padding: 6px 16px; border-radius: 100px; margin-bottom: 14px; letter-spacing: 0.04em; }
    .compliance-card p { font-size: 14px; line-height: 1.6; color: #64748b; margin: 0; }
    .cta-section { padding: 80px 24px; text-align: center; }
    .cta-section h2 { font-size: 32px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0; letter-spacing: -1px; }
    .cta-section p { font-size: 16px; color: #64748b; margin: 0 0 28px 0; }
    .cta-btn { display: inline-flex; align-items: center; font-family: inherit; font-size: 15px; font-weight: 600; background: #2563EB; color: #fff; border: none; border-radius: 10px; padding: 13px 28px; text-decoration: none; transition: opacity 0.15s; }
    .cta-btn:hover { opacity: 0.88; }
    @media (max-width: 768px) { .page-title { font-size: 32px; letter-spacing: -1px; } .stats-grid, .values-grid, .compliance-grid { grid-template-columns: 1fr; } }
  `]
})
export class EmpresaComponent {}