import { Component, inject, ViewChild, ElementRef, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { DocumentService } from '../../core/services/document.service';
import { PdfService } from '../../core/services/pdf.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { Document, Signer } from '../../core/models';
import { toast, showLoading, hideLoading } from '../../shared/utils/toast';
import { computeSHA256 } from '../../shared/utils/crypto';

type SignatureMode = 'draw' | 'type';

@Component({
  selector: 'app-signature',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="sig-wrapper">
      @if (step() === 'verify') {
        <div class="sig-verify-container">
          <div class="sig-verify-card">
            <div class="sig-verify-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h1 class="sig-verify-title">Firmar documento</h1>
            <p class="sig-verify-subtitle">Ingresa el código de 8 caracteres que recibiste para acceder al documento</p>

            <div class="sig-code-input-group">
              <input
                type="text"
                class="sig-code-input"
                maxlength="8"
                placeholder="XXXXXXXX"
                [(ngModel)]="code"
                (keyup.enter)="verifyCode()"
                [disabled]="isVerifying()"
              >
              <button
                class="sig-verify-btn"
                (click)="verifyCode()"
                [disabled]="code.length !== 8 || isVerifying()"
              >
                @if (isVerifying()) {
                  <span class="sig-spinner"></span>
                } @else {
                  <span>Verificar</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                }
              </button>
            </div>

            <div class="sig-code-hint">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              El código fue enviado por el remitente del documento
            </div>
          </div>
        </div>
      }

      @if (step() === 'sign') {
        <div class="container-fluid py-4">
          <div class="sig-header">
            <div class="sig-doc-info">
              <h1 class="sig-title">{{ document()?.file_name }}</h1>
              <p class="sig-subtitle">Solicitado por {{ signer()?.signer_name }}</p>
            </div>
            <div class="sig-status-badge" [class.signed]="signer()?.status === 'signed'">
              @if (signer()?.status === 'signed') {
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                Firmado
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Pendiente de firma
              }
            </div>
          </div>

          <div class="sig-layout">
            <!-- PDF Preview -->
            <div class="sig-pdf-section">
              <div class="sig-pdf-toolbar">
                <div class="sig-page-controls">
                  <button class="btn-icon" (click)="prevPage()" [disabled]="currentPage() <= 1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <span class="sig-page-info">Página {{ currentPage() }} de {{ totalPages() }}</span>
                  <button class="btn-icon" (click)="nextPage()" [disabled]="currentPage() >= totalPages()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>
              </div>

              <div class="sig-pdf-container">
                <canvas #pdfCanvas class="sig-pdf-canvas"></canvas>

                @if (isZoneOnCurrentPage()) {
                  <div
                    class="sig-zone-highlight"
                    [style.left.px]="zoneDisplay()?.x"
                    [style.top.px]="zoneDisplay()?.y"
                    [style.width.px]="zoneDisplay()?.w"
                    [style.height.px]="zoneDisplay()?.h"
                  >
                    <div class="sig-zone-label">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>
                      Zona de firma
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Signature Panel -->
            <div class="sig-panel">
              <div class="sig-panel-card">
                <h3 class="sig-panel-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>
                  Tu firma
                </h3>

                @if (signer()?.status === 'signed') {
                  <div class="sig-already-signed">
                    <div class="sig-success-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                    <h4>Ya has firmado este documento</h4>
                    <p>Este documento fue firmado el {{ signer()?.signed_at | date:'medium' }}</p>
                  </div>
                } @else {
                  <!-- Mode toggle -->
                  <div class="sig-mode-toggle">
                    <button
                      class="sig-mode-btn"
                      [class.active]="sigMode() === 'draw'"
                      (click)="setSigMode('draw')"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>
                      Dibujar
                    </button>
                    <button
                      class="sig-mode-btn"
                      [class.active]="sigMode() === 'type'"
                      (click)="setSigMode('type')"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
                      Escribir
                    </button>
                  </div>

                  @if (sigMode() === 'draw') {
                    <div class="sig-draw-area">
                      <canvas
                        #sigCanvas
                        class="sig-canvas"
                        (mousedown)="startDrawing($event)"
                        (mousemove)="draw($event)"
                        (mouseup)="stopDrawing()"
                        (mouseleave)="stopDrawing()"
                        (touchstart)="startDrawingTouch($event)"
                        (touchmove)="drawTouch($event)"
                        (touchend)="stopDrawing()"
                      ></canvas>
                      <div class="sig-canvas-hint">Firma dentro del recuadro</div>
                      <button class="sig-clear-btn" (click)="clearSignature()">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                        Limpiar
                      </button>
                    </div>
                  }

                  @if (sigMode() === 'type') {
                    <div class="sig-type-area">
                      <input
                        type="text"
                        class="sig-type-input"
                        placeholder="Escribe tu nombre"
                        [(ngModel)]="typedSignature"
                        (input)="renderTypedSignature()"
                        maxlength="40"
                      >
                      <div class="sig-font-selector">
                        <label>Estilo:</label>
                        <select class="sig-font-select" [(ngModel)]="selectedFont" (change)="renderTypedSignature()">
                          <option value="'Dancing Script', cursive">Dancing Script</option>
                          <option value="'Great Vibes', cursive">Great Vibes</option>
                          <option value="'Parisienne', cursive">Parisienne</option>
                          <option value="'Sacramento', cursive">Sacramento</option>
                          <option value="'Alex Brush', cursive">Alex Brush</option>
                          <option value="'Allura', cursive">Allura</option>
                        </select>
                      </div>
                      <div class="sig-preview-box">
                        <canvas #typedCanvas class="sig-typed-canvas"></canvas>
                      </div>
                    </div>
                  }

                  <button
                    class="sig-submit-btn"
                    [disabled]="!hasSignature() || isSubmitting()"
                    (click)="submitSignature()"
                  >
                    @if (isSubmitting()) {
                      <span class="sig-spinner"></span>
                      <span>Firmando...</span>
                    } @else {
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="9 15 12 12 15 15"/><line x1="12" y1="12" x2="12" y2="21"/></svg>
                      <span>Firmar documento</span>
                    }
                  </button>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .sig-wrapper {
      background: linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%);
      min-height: calc(100vh - 57px);
    }

    /* Verify Step */
    .sig-verify-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 57px);
      padding: 2rem;
    }

    .sig-verify-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      padding: 3rem;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: var(--shadow-lg);
    }

    .sig-verify-icon {
      width: 80px;
      height: 80px;
      border-radius: var(--radius-2xl);
      background: linear-gradient(135deg, var(--primary-pale), #EFF6FF);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary);
      margin: 0 auto 1.5rem;
    }

    .sig-verify-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-1);
      margin-bottom: 0.5rem;
    }

    .sig-verify-subtitle {
      color: var(--text-3);
      font-size: 0.9375rem;
      margin-bottom: 2rem;
    }

    .sig-code-input-group {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .sig-code-input {
      flex: 1;
      padding: 14px 16px;
      background: var(--bg-2);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      font-size: 1.25rem;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-align: center;
      color: var(--text-1);
      text-transform: uppercase;
      transition: all 0.2s ease;
    }
    .sig-code-input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--primary-glow);
    }

    .sig-verify-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 14px 24px;
      background: linear-gradient(135deg, var(--primary), var(--primary-2));
      border: none;
      border-radius: var(--radius-md);
      color: white;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
      box-shadow: var(--shadow-sm);
    }
    .sig-verify-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: var(--shadow-primary);
    }
    .sig-verify-btn:disabled {
      background: var(--bg-3);
      color: var(--text-4);
      cursor: not-allowed;
      box-shadow: none;
    }

    .sig-code-hint {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 0.8125rem;
      color: var(--text-4);
    }

    .sig-spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Sign Step */
    .sig-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .sig-doc-info {
      flex: 1;
    }

    .sig-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-1);
      margin-bottom: 0.25rem;
      word-break: break-word;
    }

    .sig-subtitle {
      font-size: 0.875rem;
      color: var(--text-3);
    }

    .sig-status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: var(--radius-full);
      font-size: 0.8125rem;
      font-weight: 600;
      background: var(--warning-bg);
      color: var(--warning-2);
      border: 1px solid var(--warning);
    }
    .sig-status-badge.signed {
      background: var(--success-bg);
      color: var(--success-2);
      border-color: var(--success);
    }

    .sig-layout {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 1.5rem;
      align-items: start;
    }

    .sig-pdf-section {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }

    .sig-pdf-toolbar {
      display: flex;
      justify-content: center;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      background: var(--bg-2);
    }

    .sig-page-controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .btn-icon {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-md);
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--text-2);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    .btn-icon:hover:not(:disabled) {
      background: var(--primary-pale);
      border-color: var(--primary-border);
      color: var(--primary);
    }
    .btn-icon:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .sig-page-info {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-2);
      min-width: 120px;
      text-align: center;
    }

    .sig-pdf-container {
      position: relative;
      display: flex;
      justify-content: center;
      padding: 24px;
      background: var(--bg-2);
      min-height: 500px;
      overflow: auto;
    }

    .sig-pdf-canvas {
      box-shadow: var(--shadow-lg);
      border-radius: var(--radius-md);
      background: white;
    }

    .sig-zone-highlight {
      position: absolute;
      border: 2px dashed var(--primary);
      background: rgba(59, 130, 246, 0.1);
      border-radius: var(--radius-md);
      animation: pulse 2s ease-in-out infinite;
      pointer-events: none;
    }

    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
      50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); }
    }

    .sig-zone-label {
      position: absolute;
      top: -28px;
      left: 0;
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      color: white;
      background: linear-gradient(135deg, var(--primary), var(--primary-2));
      padding: 4px 10px;
      border-radius: var(--radius-md);
      white-space: nowrap;
    }

    .sig-panel {}

    .sig-panel-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);
      position: sticky;
      top: 80px;
    }

    .sig-panel-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-1);
      margin-bottom: 1.25rem;
    }
    .sig-panel-title svg {
      color: var(--primary);
    }

    .sig-already-signed {
      text-align: center;
      padding: 2rem 1rem;
    }

    .sig-success-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: var(--success-bg);
      color: var(--success);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;
    }

    .sig-already-signed h4 {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-1);
      margin-bottom: 0.5rem;
    }

    .sig-already-signed p {
      font-size: 0.875rem;
      color: var(--text-3);
    }

    .sig-mode-toggle {
      display: flex;
      gap: 4px;
      background: var(--bg-3);
      padding: 4px;
      border-radius: var(--radius-md);
      margin-bottom: 1rem;
    }

    .sig-mode-btn {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      border: none;
      background: transparent;
      color: var(--text-3);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .sig-mode-btn.active {
      background: var(--surface);
      color: var(--primary);
      box-shadow: var(--shadow-xs);
    }

    .sig-draw-area {
      position: relative;
      margin-bottom: 1rem;
    }

    .sig-canvas {
      width: 100%;
      height: 180px;
      background: linear-gradient(180deg, var(--bg-2) 0%, var(--surface) 100%);
      border: 2px dashed var(--border-2);
      border-radius: var(--radius-lg);
      cursor: crosshair;
      touch-action: none;
    }

    .sig-canvas-hint {
      text-align: center;
      font-size: 0.75rem;
      color: var(--text-4);
      margin-top: 6px;
    }

    .sig-clear-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      padding: 6px 12px;
      background: transparent;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      color: var(--text-3);
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .sig-clear-btn:hover {
      background: var(--error-bg);
      border-color: var(--error);
      color: var(--error);
    }

    .sig-type-area {
      margin-bottom: 1rem;
    }

    .sig-type-input {
      width: 100%;
      padding: 12px 14px;
      background: var(--bg-2);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      font-size: 1rem;
      color: var(--text-1);
      margin-bottom: 0.75rem;
      transition: all 0.2s ease;
    }
    .sig-type-input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--primary-glow);
    }

    .sig-font-selector {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 0.75rem;
    }
    .sig-font-selector label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-3);
      white-space: nowrap;
    }
    .sig-font-select {
      flex: 1;
      padding: 8px 10px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      color: var(--text-1);
      cursor: pointer;
    }

    .sig-preview-box {
      background: linear-gradient(180deg, var(--bg-2) 0%, var(--surface) 100%);
      border: 2px dashed var(--border-2);
      border-radius: var(--radius-lg);
      padding: 1rem;
      min-height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .sig-typed-canvas {
      max-width: 100%;
    }

    .sig-submit-btn {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, var(--success), var(--success-2));
      border: none;
      border-radius: var(--radius-md);
      color: white;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: var(--shadow-sm);
    }
    .sig-submit-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.39);
    }
    .sig-submit-btn:disabled {
      background: var(--bg-3);
      color: var(--text-4);
      cursor: not-allowed;
      box-shadow: none;
    }

    @media (max-width: 1024px) {
      .sig-layout {
        grid-template-columns: 1fr;
      }
      .sig-panel-card {
        position: static;
      }
    }

    @media (max-width: 768px) {
      .sig-verify-card {
        padding: 2rem 1.5rem;
      }
      .sig-code-input-group {
        flex-direction: column;
      }
    }
  `]
})
export class SignatureComponent implements OnInit {
  router = inject(Router);
  private route = inject(ActivatedRoute);
  private docService = inject(DocumentService);
  private pdfService = inject(PdfService);
  private supabase = inject(SupabaseService);

  @ViewChild('pdfCanvas') pdfCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('sigCanvas') sigCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('typedCanvas') typedCanvasRef!: ElementRef<HTMLCanvasElement>;

  // State
  step = signal<'verify' | 'sign'>('verify');
  code = '';
  isVerifying = signal(false);
  document = signal<Document | null>(null);
  signer = signal<Signer | null>(null);
  currentPage = signal(1);
  totalPages = signal(1);
  sigMode = signal<SignatureMode>('draw');
  isDrawing = false;
  lastX = 0;
  lastY = 0;
  typedSignature = signal('');
  selectedFont = signal("'Dancing Script', cursive");
  isSubmitting = signal(false);
  pdfBytes: ArrayBuffer | null = null;
  originalPdfBytes: ArrayBuffer | null = null;

  constructor() {}

  ngOnInit() {
    // Check for code in query params
    this.route.queryParams.subscribe((params: { [key: string]: any }) => {
      if (params['code']) {
        this.code = params['code'].toUpperCase();
        this.verifyCode();
      }
    });
  }

  async verifyCode() {
    if (this.code.length !== 8) return;
    this.isVerifying.set(true);

    try {
      const signer = await this.docService.getSignerByCode(this.code);
      if (!signer) {
        toast('Código no válido o expirado', 'error');
        this.isVerifying.set(false);
        return;
      }

      if (signer.status === 'signed') {
        toast('Este documento ya ha sido firmado', 'warning');
      }

      const doc = await this.docService.getDocumentById(signer.doc_id);
      if (!doc) {
        toast('Documento no encontrado', 'error');
        this.isVerifying.set(false);
        return;
      }

      this.signer.set(signer);
      this.document.set(doc);
      this.currentPage.set(doc.sign_zone_page || 1);

      // Load PDF - Supabase storage returns data directly
      try {
        const { data: fileData, error } = await this.supabase.storage
          .from('documents')
          .download(doc.file_id);

        if (error) throw error;

        this.pdfBytes = await fileData.arrayBuffer();
        this.originalPdfBytes = this.pdfBytes.slice(0);
        this.step.set('sign');
        setTimeout(() => this.renderPdf(), 100);
      } catch (e) {
        toast('Error al cargar el documento', 'error');
      }
    } catch (e) {
      toast('Error al verificar el código', 'error');
    } finally {
      this.isVerifying.set(false);
    }
  }

  async renderPdf() {
    if (!this.pdfBytes || !this.pdfCanvasRef) return;
    try {
      const canvas = this.pdfCanvasRef.nativeElement;
      const result = await this.pdfService.renderPdf(canvas, this.pdfBytes, this.currentPage(), 1.5);
      this.totalPages.set(result.totalPages);
    } catch (e) {
      console.error('Error rendering PDF:', e);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.renderPdf();
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.renderPdf();
    }
  }

  isZoneOnCurrentPage(): boolean {
    const doc = this.document();
    return !!doc && doc.sign_zone_page === this.currentPage();
  }

  zoneDisplay(): { x: number; y: number; w: number; h: number } | null {
    const doc = this.document();
    if (!doc || !this.pdfCanvasRef) return null;

    const canvas = this.pdfCanvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const container = canvas.parentElement!.getBoundingClientRect();

    // Calculate offset of canvas within container
    const offsetX = rect.left - container.left;
    const offsetY = rect.top - container.top;

    return {
      x: offsetX + (doc.sign_zone_x || 0),
      y: offsetY + (doc.sign_zone_y || 0),
      w: doc.sign_zone_w || 150,
      h: doc.sign_zone_h || 60
    };
  }

  setSigMode(mode: SignatureMode) {
    this.sigMode.set(mode);
    if (mode === 'type') {
      setTimeout(() => this.renderTypedSignature(), 50);
    }
  }

  // Canvas drawing
  startDrawing(e: MouseEvent) {
    const canvas = this.sigCanvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    this.isDrawing = true;
    this.lastX = e.clientX - rect.left;
    this.lastY = e.clientY - rect.top;
  }

  draw(e: MouseEvent) {
    if (!this.isDrawing) return;
    const canvas = this.sigCanvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(this.lastX, this.lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    this.lastX = x;
    this.lastY = y;
  }

  stopDrawing() {
    this.isDrawing = false;
  }

  startDrawingTouch(e: TouchEvent) {
    e.preventDefault();
    const canvas = this.sigCanvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    this.isDrawing = true;
    this.lastX = touch.clientX - rect.left;
    this.lastY = touch.clientY - rect.top;
  }

  drawTouch(e: TouchEvent) {
    e.preventDefault();
    if (!this.isDrawing) return;
    const canvas = this.sigCanvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(this.lastX, this.lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    this.lastX = x;
    this.lastY = y;
  }

  clearSignature() {
    const canvas = this.sigCanvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  renderTypedSignature() {
    const canvas = this.typedCanvasRef?.nativeElement;
    if (!canvas) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth || 340;
    canvas.height = 80;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const text = this.typedSignature();
    if (!text) return;

    ctx.font = `48px ${this.selectedFont()}`;
    ctx.fillStyle = '#0F172A';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  }

  hasSignature(): boolean {
    if (this.sigMode() === 'type') {
      return this.typedSignature().trim().length > 0;
    }
    // Check if canvas has drawing
    const canvas = this.sigCanvasRef?.nativeElement;
    if (!canvas) return false;
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return imageData.data.some((v, i) => i % 4 === 3 && v > 0);
  }

  async submitSignature() {
    const doc = this.document();
    const signer = this.signer();
    if (!doc || !signer || !this.originalPdfBytes) return;

    this.isSubmitting.set(true);
    showLoading('Aplicando firma...');

    try {
      let signatureDataUrl: string;

      if (this.sigMode() === 'draw') {
        const canvas = this.sigCanvasRef.nativeElement;
        signatureDataUrl = this.pdfService.extractSignatureTransparent(canvas);
      } else {
        const canvas = this.typedCanvasRef.nativeElement;
        signatureDataUrl = canvas.toDataURL('image/png');
      }

      // Compute hash of original
      const hash = await computeSHA256(this.originalPdfBytes);

      // Embed signature into PDF
      const zone = {
        page: doc.sign_zone_page || 1,
        x: doc.sign_zone_x || 0,
        y: doc.sign_zone_y || 0,
        w: doc.sign_zone_w || 150,
        h: doc.sign_zone_h || 60,
        scale: doc.sign_zone_scale || 1.5
      };

      const signedPdfBytes = await this.pdfService.embedSignature(
        this.originalPdfBytes,
        signatureDataUrl,
        zone
      );

      // Upload signed PDF to Supabase Storage
      const signedBlob = new Blob([signedPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const signedFile = new File([signedBlob], `signed_${doc.file_name}`, { type: 'application/pdf' });

      const fileName = `signed_${Date.now()}_${doc.file_name}`;
      const { data: uploaded, error: uploadError } = await this.supabase.storage
        .from('documents')
        .upload(fileName, signedFile);

      if (uploadError) throw uploadError;

      // Update signer
      await this.docService.updateSignerSignature(signer.code, uploaded.path);

      // Check if all signers have signed
      const allSigners = await this.docService.getSignersByDocId(doc.id);
      const allSigned = allSigners.every(s => s.status === 'signed');

      await this.docService.updateDocumentStatus(
        doc.id,
        allSigned ? 'signed' : 'partial',
        uploaded.path
      );

      // Log audit
      await this.docService.logAuditEvent(
        doc.id,
        'document_signed',
        `Documento firmado por ${signer.signer_name}. Hash original: ${hash}`
      );

      hideLoading();
      toast('Documento firmado exitosamente', 'success');
      this.router.navigate(['/done'], { queryParams: { status: 'signed' } });
    } catch (e: any) {
      hideLoading();
      toast('Error al firmar: ' + e.message, 'error');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
