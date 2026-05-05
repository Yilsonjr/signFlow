import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DocumentService } from '../../core/services/document.service';
import { Document } from '../../core/models';
import { NgFor, NgIf, DatePipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, NgFor, NgIf, DatePipe],
  template: `
    <div class="dashboard-wrapper">
      <div class="container py-5">
        <!-- Header -->
        <div class="dashboard-header">
          <div class="header-content">
            <h1 class="header-title">Dashboard</h1>
            <p class="header-subtitle">Gestiona tus documentos para firma</p>
          </div>
          <div class="header-actions">
            @if (auth.isAdmin()) {
              <button class="btn-admin" routerLink="/admin">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 1l3 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z"/>
                </svg>
                <span>Panel Admin</span>
              </button>
            }
            <button class="btn-primary-new" (click)="router.navigate(['/upload'])">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span>Nuevo documento</span>
            </button>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card hover-lift">
            <div class="stat-icon bg-primary-soft">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            </div>
            <div class="stat-info">
              <span class="stat-label">Plan actual</span>
              <span class="stat-value" [class.stat-pro]="auth.hasPaidPlan()">{{ auth.currentPlan().label }}</span>
            </div>
            <a *ngIf="!auth.hasPaidPlan()" routerLink="/pricing" class="stat-link">
              Actualizar plan
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </a>
          </div>

          <div class="stat-card hover-lift">
            <div class="stat-icon bg-success-soft">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <div class="stat-info">
              <span class="stat-label">Documentos disponibles</span>
              <span class="stat-value">{{ auth.docsRemaining() === 9999 ? '∞' : auth.docsRemaining() }}</span>
            </div>
          </div>

          <div class="stat-card hover-lift">
            <div class="stat-icon bg-warning-soft">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
            </div>
            <div class="stat-info">
              <span class="stat-label">Documentos totales</span>
              <span class="stat-value">{{ docs().length }}</span>
            </div>
          </div>
        </div>

        <!-- Documents Table -->
        <div class="documents-section">
          <div class="documents-header">
            <h2 class="section-title">Documentos recientes</h2>
          </div>

          <div class="documents-card">
            <div *ngIf="loading()" class="loading-state">
              <div class="spinner-modern"></div>
              <p class="loading-text">Cargando documentos...</p>
            </div>

            <div *ngIf="!loading() && docs().length === 0" class="empty-state">
              <div class="empty-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
              </div>
              <h3 class="empty-title">Aún no tienes documentos</h3>
              <p class="empty-desc">Sube tu primer documento para comenzar a gestionar firmas digitales</p>
              <button class="btn-outline-new" (click)="router.navigate(['/upload'])">
                Subir documento
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            </div>

            <div *ngIf="!loading() && docs().length > 0" class="table-container">
              <table class="modern-table">
                <thead>
                  <tr>
                    <th>Documento</th>
                    <th>Código</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th class="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let doc of docs()" class="table-row">
                    <td>
                      <div class="doc-info">
                        <div class="doc-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        </div>
                        <span class="doc-name">{{ doc.file_name }}</span>
                      </div>
                    </td>
                    <td>
                      <code class="code-badge">{{ doc.code }}</code>
                    </td>
                    <td>
                      <span class="status-badge" [class.status-pending]="doc.status === 'pending'" [class.status-signed]="doc.status === 'signed'">
                        <span class="status-dot"></span>
                        {{ doc.status === 'signed' ? 'Firmado' : 'Pendiente' }}
                      </span>
                    </td>
                    <td>
                      <span class="date-text">{{ doc.created_at | date:'dd MMM yyyy' }}</span>
                    </td>
                    <td class="text-end">
                      <button class="btn-icon" (click)="copyCode(doc.code)" title="Copiar código">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-wrapper {
      background: linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%);
      min-height: calc(100vh - 57px);
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .btn-admin {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 16px;
      background: linear-gradient(135deg, var(--gold), var(--gold-2));
      border: none;
      border-radius: var(--radius-md);
      color: white;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
    }

    .btn-admin:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
    }

    .header-title {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-1);
      margin-bottom: 0.25rem;
    }

    .header-subtitle {
      color: var(--text-3);
      font-size: 0.9375rem;
    }

    .btn-primary-new {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: linear-gradient(135deg, var(--primary), var(--primary-2));
      border: none;
      border-radius: var(--radius-md);
      color: white;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: var(--shadow-sm);
    }

    .btn-primary-new:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-primary);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2.5rem;
    }

    .stat-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      position: relative;
      overflow: hidden;
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--primary), var(--secondary));
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .stat-card:hover::before {
      opacity: 1;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary);
    }

    .bg-primary-soft {
      background: linear-gradient(135deg, var(--primary-pale), #EFF6FF);
    }

    .bg-success-soft {
      background: linear-gradient(135deg, var(--success-bg), #D1FAE5);
      color: var(--success) !important;
    }

    .bg-warning-soft {
      background: linear-gradient(135deg, var(--warning-bg), #FEF3C7);
      color: var(--warning) !important;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--text-3);
      font-weight: 500;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-1);
    }

    .stat-pro {
      background: linear-gradient(135deg, var(--gold), var(--gold-2));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .stat-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--primary);
      text-decoration: none;
      margin-top: 0.5rem;
    }

    .stat-link:hover {
      color: var(--primary-2);
    }

    .documents-section {
      margin-top: 2rem;
    }

    .documents-header {
      margin-bottom: 1.5rem;
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-1);
    }

    .documents-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      overflow: hidden;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      gap: 1rem;
    }

    .spinner-modern {
      width: 40px;
      height: 40px;
      border: 3px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .loading-text {
      color: var(--text-3);
      font-size: 0.9375rem;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      text-align: center;
    }

    .empty-icon {
      width: 80px;
      height: 80px;
      border-radius: var(--radius-2xl);
      background: linear-gradient(135deg, var(--primary-pale), #EFF6FF);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary);
      margin-bottom: 1.5rem;
    }

    .empty-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-1);
      margin-bottom: 0.5rem;
    }

    .empty-desc {
      color: var(--text-3);
      font-size: 0.9375rem;
      margin-bottom: 1.5rem;
      max-width: 400px;
    }

    .btn-outline-new {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      color: var(--text-2);
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-outline-new:hover {
      background: var(--bg-2);
      border-color: var(--border-2);
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }

    .modern-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
    }

    .modern-table th {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-3);
      padding: 16px 24px;
      border-bottom: 1px solid var(--border);
      text-align: left;
      background: var(--bg-2);
    }

    .modern-table td {
      padding: 16px 24px;
      border-bottom: 1px solid var(--border);
      color: var(--text-2);
      font-size: 0.9375rem;
    }

    .table-row {
      transition: background 0.2s ease;
    }

    .table-row:hover {
      background: var(--bg-2);
    }

    .table-row:last-child td {
      border-bottom: none;
    }

    .doc-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .doc-icon {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--primary-pale), #EFF6FF);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary);
    }

    .doc-name {
      font-weight: 500;
      color: var(--text-1);
    }

    .code-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.875rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      padding: 6px 12px;
      background: linear-gradient(135deg, var(--primary-pale), #EFF6FF);
      border: 1px solid var(--primary-border);
      border-radius: var(--radius-md);
      color: var(--primary-2);
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: var(--radius-full);
      font-size: 0.875rem;
      font-weight: 500;
    }

    .status-pending {
      background: var(--warning-bg);
      color: var(--warning-2);
    }

    .status-signed {
      background: var(--success-bg);
      color: var(--success-2);
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }

    .date-text {
      color: var(--text-3);
      font-size: 0.875rem;
    }

    .btn-icon {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      background: var(--bg-2);
      border: 1px solid var(--border);
      color: var(--text-3);
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .btn-icon:hover {
      background: var(--primary-pale);
      border-color: var(--primary-border);
      color: var(--primary);
    }

    .text-end {
      text-align: right;
    }

    @media (max-width: 768px) {
      .dashboard-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .modern-table {
        display: block;
        overflow-x: auto;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  docService = inject(DocumentService);
  router = inject(Router);

  docs = signal<Document[]>([]);
  loading = signal(true);

  async ngOnInit() {
    await this.loadDocs();
  }

  async loadDocs() {
    this.loading.set(true);
    const docs = await this.docService.getDocuments();
    this.docs.set(docs);
    this.loading.set(false);
  }

  copyCode(code: string) {
    navigator.clipboard.writeText(`${window.location.origin}?code=${code}`);
    alert('Código copiado ✅');
  }
}
