import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-done',
  standalone: true,
  template: `
    <div class="done-wrapper">
      <div class="done-card">
        <div class="done-icon" [class.success]="status() === 'signed'" [class.cancelled]="status() === 'cancelled'">
          @if (status() === 'signed') {
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          } @else {
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          }
        </div>

        <h1 class="done-title">
          @if (status() === 'signed') {
            Documento firmado
          } @else {
            Operación cancelada
          }
        </h1>

        <p class="done-message">
          @if (status() === 'signed') {
            Tu firma ha sido aplicada al documento y guardada de forma segura. El remitente será notificado.
          } @else {
            La operación fue cancelada. Puedes intentarlo nuevamente cuando lo desees.
          }
        </p>

        <div class="done-actions">
          <button class="btn-primary" (click)="router.navigate(['/'])">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .done-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 57px);
      padding: 2rem;
      background: linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%);
    }

    .done-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      padding: 3rem;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: var(--shadow-lg);
      animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .done-icon {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
    }
    .done-icon.success {
      background: linear-gradient(135deg, var(--success-bg), #D1FAE5);
      color: var(--success);
    }
    .done-icon.cancelled {
      background: linear-gradient(135deg, var(--error-bg), #FFE4E6);
      color: var(--error);
    }

    .done-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-1);
      margin-bottom: 0.75rem;
    }

    .done-message {
      color: var(--text-3);
      font-size: 0.9375rem;
      line-height: 1.6;
      margin-bottom: 2rem;
    }

    .done-actions {
      display: flex;
      justify-content: center;
    }

    .btn-primary {
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
    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-primary);
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 768px) {
      .done-card {
        padding: 2rem 1.5rem;
      }
    }
  `]
})
export class DoneComponent implements OnInit {
  router = inject(Router);
  private route = inject(ActivatedRoute);
  status = signal<'signed' | 'cancelled'>('signed');

  ngOnInit() {
    this.route.queryParams.subscribe((params: { [key: string]: any }) => {
      if (params['status'] === 'cancelled') {
        this.status.set('cancelled');
      }
    });
  }
}
