import { Component, inject, ElementRef, ViewChild, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PdfService } from '../../core/services/pdf.service';
import { DocumentService } from '../../core/services/document.service';
import { UploadStateService, SignatureZone } from '../../core/services/upload-state.service';
import { AuthService } from '../../core/services/auth.service';
import { toast, showLoading, hideLoading } from '../../shared/utils/toast';

@Component({
  selector: 'app-sign-zone',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="sz-wrapper">
      <div class="container-fluid py-4">
        <div class="sz-header">
          <button class="btn-back" (click)="router.navigate(['/upload'])">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            <span>Volver</span>
          </button>
          <div class="step-indicator">
            <div class="step completed">
              <span class="step-number">1</span>
              <span class="step-label">Subir</span>
            </div>
            <div class="step-line completed"></div>
            <div class="step active">
              <span class="step-number">2</span>
              <span class="step-label">Zona de firma</span>
            </div>
            <div class="step-line"></div>
            <div class="step">
              <span class="step-number">3</span>
              <span class="step-label">Compartir</span>
            </div>
          </div>
        </div>

        <div class="sz-layout">
          <!-- PDF Viewer -->
          <div class="sz-pdf-section">
            <div class="sz-toolbar">
              <div class="sz-page-controls">
                <button class="btn-icon" (click)="prevPage()" [disabled]="currentPage() <= 1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <span class="sz-page-info">Página {{ currentPage() }} de {{ totalPages() }}</span>
                <button class="btn-icon" (click)="nextPage()" [disabled]="currentPage() >= totalPages()">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
              <div class="sz-mode-toggle">
                <button 
                  class="mode-btn" 
                  [class.active]="mode() === 'view'"
                  (click)="setMode('view')"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  Ver
                </button>
                <button 
                  class="mode-btn" 
                  [class.active]="mode() === 'draw'"
                  (click)="setMode('draw')"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
                  Dibujar zona
                </button>
              </div>
            </div>

            <div class="sz-canvas-container" [class.draw-mode]="mode() === 'draw'">
              <canvas 
                #pdfCanvas 
                class="sz-pdf-canvas"
                (mousedown)="onCanvasMouseDown($event)"
                (mousemove)="onCanvasMouseMove($event)"
                (mouseup)="onCanvasMouseUp($event)"
                (mouseleave)="onCanvasMouseUp($event)"
              ></canvas>
              
              <!-- Zone overlays -->
              @for (zone of zones(); track zone.id) {
                @if (zone.page === currentPage()) {
                  <div 
                    class="sz-zone-overlay"
                    [style.left.px]="zone.x"
                    [style.top.px]="zone.y"
                    [style.width.px]="zone.w"
                    [style.height.px]="zone.h"
                    [class.active]="selectedZone()?.id === zone.id"
                    (click)="selectZone(zone); $event.stopPropagation()"
                  >
                    <div class="sz-zone-label">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>
                      {{ zone.signerName || 'Sin nombre' }}
                    </div>
                    <button class="sz-zone-remove" (click)="removeZone(zone.id); $event.stopPropagation()">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                }
              }

              <!-- Drawing preview -->
              @if (isDrawing() && drawRect()) {
                <div 
                  class="sz-draw-preview"
                  [style.left.px]="drawRect()!.x"
                  [style.top.px]="drawRect()!.y"
                  [style.width.px]="drawRect()!.w"
                  [style.height.px]="drawRect()!.h"
                ></div>
              }
            </div>

            @if (mode() === 'draw') {
              <div class="sz-hint">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                Haz clic y arrastra para dibujar una zona de firma
              </div>
            }
          </div>

          <!-- Sidebar -->
          <div class="sz-sidebar">
            <div class="sz-sidebar-card">
              <h3 class="sz-sidebar-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Firmantes
              </h3>
              
              @if (zones().length === 0) {
                <div class="sz-empty-state">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                  <p>No hay zonas de firma</p>
                  <span class="sz-empty-hint">Selecciona "Dibujar zona" y arrastra sobre el PDF</span>
                </div>
              } @else {
                <div class="sz-zones-list">
                  @for (zone of zones(); track zone.id) {
                    <div class="sz-zone-item" [class.active]="selectedZone()?.id === zone.id" (click)="selectZone(zone)">
                      <div class="sz-zone-num">{{ $index + 1 }}</div>
                      <div class="sz-zone-info">
                        <input 
                          type="text" 
                          class="sz-zone-input"
                          placeholder="Nombre del firmante"
                          [(ngModel)]="zone.signerName"
                          (click)="$event.stopPropagation()"
                          (blur)="updateZone(zone)"
                        >
                        <input 
                          type="email" 
                          class="sz-zone-input sz-zone-email"
                          placeholder="Email (opcional)"
                          [(ngModel)]="zone.signerEmail"
                          (click)="$event.stopPropagation()"
                          (blur)="updateZone(zone)"
                        >
                      </div>
                      <button class="sz-zone-delete" (click)="removeZone(zone.id); $event.stopPropagation()">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  }
                </div>
              }

              <div class="sz-sidebar-actions">
                <button 
                  class="btn-create" 
                  [disabled]="zones().length === 0 || !allZonesHaveNames()"
                  (click)="createDocument()"
                >
                  <span>Crear documento</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </button>
                @if (!allZonesHaveNames()) {
                  <p class="sz-validation-hint">Completa el nombre de todos los firmantes</p>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sz-wrapper {
      background: linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%);
      min-height: calc(100vh - 57px);
    }

    .sz-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      color: var(--text-2);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-back:hover {
      background: var(--bg-2);
      border-color: var(--border-2);
    }

    .step-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .step {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      opacity: 0.4;
    }
    .step.active {
      opacity: 1;
    }
    .step.completed {
      opacity: 0.8;
    }
    .step.completed .step-number {
      background: linear-gradient(135deg, var(--success), var(--success-2));
      color: white;
    }
    .step-number {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--bg-3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-3);
    }
    .step.active .step-number {
      background: linear-gradient(135deg, var(--primary), var(--primary-2));
      color: white;
    }
    .step-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-2);
    }
    .step-line {
      width: 32px;
      height: 1px;
      background: var(--border);
    }
    .step-line.completed {
      background: var(--success);
    }

    .sz-layout {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 1.5rem;
      align-items: start;
    }

    .sz-pdf-section {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }

    .sz-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      background: var(--bg-2);
    }

    .sz-page-controls {
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

    .sz-page-info {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-2);
      min-width: 120px;
      text-align: center;
    }

    .sz-mode-toggle {
      display: flex;
      gap: 4px;
      background: var(--bg-3);
      padding: 4px;
      border-radius: var(--radius-md);
    }

    .mode-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      border: none;
      background: transparent;
      color: var(--text-3);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .mode-btn.active {
      background: var(--surface);
      color: var(--primary);
      box-shadow: var(--shadow-xs);
    }
    .mode-btn:hover:not(.active) {
      color: var(--text-2);
    }

    .sz-canvas-container {
      position: relative;
      display: flex;
      justify-content: center;
      padding: 24px;
      background: var(--bg-2);
      min-height: 500px;
      overflow: auto;
    }
    .sz-canvas-container.draw-mode {
      cursor: crosshair;
    }

    .sz-pdf-canvas {
      box-shadow: var(--shadow-lg);
      border-radius: var(--radius-md);
      background: white;
    }

    .sz-zone-overlay {
      position: absolute;
      border: 2px dashed var(--primary);
      background: rgba(59, 130, 246, 0.08);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 4px;
    }
    .sz-zone-overlay:hover,
    .sz-zone-overlay.active {
      background: rgba(59, 130, 246, 0.15);
      border-style: solid;
      box-shadow: 0 0 0 3px var(--primary-glow);
    }

    .sz-zone-label {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--primary-2);
      background: rgba(255,255,255,0.9);
      padding: 2px 6px;
      border-radius: var(--radius-sm);
      backdrop-filter: blur(4px);
    }

    .sz-zone-remove {
      position: absolute;
      top: -10px;
      right: -10px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--error);
      border: 2px solid white;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s ease;
      box-shadow: var(--shadow-sm);
    }
    .sz-zone-overlay:hover .sz-zone-remove {
      opacity: 1;
    }

    .sz-draw-preview {
      position: absolute;
      border: 2px solid var(--primary);
      background: rgba(59, 130, 246, 0.1);
      border-radius: var(--radius-md);
      pointer-events: none;
    }

    .sz-hint {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      background: var(--primary-pale);
      color: var(--primary-2);
      font-size: 0.875rem;
      font-weight: 500;
      border-top: 1px solid var(--primary-border);
    }

    .sz-sidebar {}

    .sz-sidebar-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);
      position: sticky;
      top: 80px;
    }

    .sz-sidebar-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-1);
      margin-bottom: 1.25rem;
    }
    .sz-sidebar-title svg {
      color: var(--primary);
    }

    .sz-empty-state {
      text-align: center;
      padding: 2rem 1rem;
      color: var(--text-4);
    }
    .sz-empty-state svg {
      margin-bottom: 0.75rem;
      stroke: var(--border-2);
    }
    .sz-empty-state p {
      font-weight: 500;
      margin-bottom: 0.25rem;
      color: var(--text-3);
    }
    .sz-empty-hint {
      font-size: 0.8125rem;
    }

    .sz-zones-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
      max-height: 400px;
      overflow-y: auto;
    }

    .sz-zone-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px;
      background: var(--bg-2);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .sz-zone-item:hover {
      border-color: var(--border-2);
    }
    .sz-zone-item.active {
      border-color: var(--primary);
      background: var(--primary-pale);
      box-shadow: 0 0 0 3px var(--primary-glow);
    }

    .sz-zone-num {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), var(--primary-2));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
      flex-shrink: 0;
    }

    .sz-zone-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .sz-zone-input {
      width: 100%;
      padding: 8px 10px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      color: var(--text-1);
      transition: all 0.2s ease;
    }
    .sz-zone-input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--primary-glow);
    }
    .sz-zone-email {
      font-size: 0.8125rem;
      color: var(--text-3);
    }

    .sz-zone-delete {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-md);
      background: transparent;
      border: none;
      color: var(--text-4);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.2s ease;
    }
    .sz-zone-delete:hover {
      background: var(--error-bg);
      color: var(--error);
    }

    .sz-sidebar-actions {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .btn-create {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, var(--primary), var(--primary-2));
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
    .btn-create:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: var(--shadow-primary);
    }
    .btn-create:disabled {
      background: var(--bg-3);
      color: var(--text-4);
      cursor: not-allowed;
      box-shadow: none;
    }

    .sz-validation-hint {
      font-size: 0.8125rem;
      color: var(--warning);
      text-align: center;
      margin: 0;
    }

    @media (max-width: 1024px) {
      .sz-layout {
        grid-template-columns: 1fr;
      }
      .sz-sidebar-card {
        position: static;
      }
    }

    @media (max-width: 768px) {
      .sz-header {
        flex-direction: column;
        align-items: stretch;
      }
      .step-indicator {
        justify-content: center;
      }
      .sz-toolbar {
        flex-direction: column;
        gap: 8px;
      }
    }
  `]
})
export class SignZoneComponent {
  router = inject(Router);
  private pdfService = inject(PdfService);
  private docService = inject(DocumentService);
  private uploadState = inject(UploadStateService);
  private auth = inject(AuthService);

  @ViewChild('pdfCanvas') pdfCanvasRef!: ElementRef<HTMLCanvasElement>;

  // State signals
  currentPage = signal(1);
  totalPages = signal(1);
  mode = signal<'view' | 'draw'>('view');
  isDrawing = signal(false);
  drawStart = signal<{ x: number; y: number } | null>(null);
  drawRect = signal<{ x: number; y: number; w: number; h: number } | null>(null);
  zones = signal<SignatureZone[]>([]);
  selectedZone = signal<SignatureZone | null>(null);
  pdfBytes: ArrayBuffer | null = null;

  private file: File | null = null;

  constructor() {
    // Subscribe to upload state
    effect(() => {
      const state = this.uploadState.currentState();
      if (state.file && state.fileBytes) {
        this.file = state.file;
        this.pdfBytes = state.fileBytes;
        this.zones.set([...state.zones]);
        this.renderPdf();
      } else {
        // No file uploaded, redirect back
        this.router.navigate(['/upload']);
      }
    });
  }

  async renderPdf() {
    if (!this.pdfBytes || !this.pdfCanvasRef) return;
    try {
      const canvas = this.pdfCanvasRef.nativeElement;
      const result = await this.pdfService.renderPdf(canvas, this.pdfBytes, this.currentPage(), 1.5);
      this.totalPages.set(result.totalPages);
    } catch (e) {
      console.error('Error rendering PDF:', e);
      toast('Error al cargar el PDF', 'error');
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

  setMode(mode: 'view' | 'draw') {
    this.mode.set(mode);
    this.selectedZone.set(null);
  }

  // Drawing logic
  onCanvasMouseDown(e: MouseEvent) {
    if (this.mode() !== 'draw') return;
    const rect = this.pdfCanvasRef.nativeElement.getBoundingClientRect();
    this.drawStart.set({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    this.isDrawing.set(true);
    this.drawRect.set({ x: e.clientX - rect.left, y: e.clientY - rect.top, w: 0, h: 0 });
  }

  onCanvasMouseMove(e: MouseEvent) {
    if (!this.isDrawing() || !this.drawStart()) return;
    const rect = this.pdfCanvasRef.nativeElement.getBoundingClientRect();
    const start = this.drawStart()!;
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    this.drawRect.set({
      x: Math.min(start.x, currentX),
      y: Math.min(start.y, currentY),
      w: Math.abs(currentX - start.x),
      h: Math.abs(currentY - start.y)
    });
  }

  onCanvasMouseUp(e: MouseEvent) {
    if (!this.isDrawing() || !this.drawRect()) return;
    const rect = this.drawRect()!;

    // Validar límite de zonas según plan
    const maxZones = this.auth.maxZonesAllowed();
    if (this.zones().length >= maxZones) {
      toast(`Límite de ${maxZones} zona(s) de firma alcanzado para tu plan`, 'warning');
      this.isDrawing.set(false);
      this.drawStart.set(null);
      this.drawRect.set(null);
      return;
    }

    // Only create zone if it has reasonable size
    if (rect.w > 30 && rect.h > 20) {
      const newZone: SignatureZone = {
        id: crypto.randomUUID(),
        page: this.currentPage(),
        x: rect.x,
        y: rect.y,
        w: rect.w,
        h: rect.h,
        signerName: '',
        signerEmail: ''
      };
      this.zones.update(zones => [...zones, newZone]);
      this.uploadState.addZone(newZone);
      this.selectedZone.set(newZone);
      // Switch back to view mode after drawing
      this.mode.set('view');
    }

    this.isDrawing.set(false);
    this.drawStart.set(null);
    this.drawRect.set(null);
  }

  selectZone(zone: SignatureZone) {
    this.selectedZone.set(zone);
    if (zone.page !== this.currentPage()) {
      this.currentPage.set(zone.page);
      this.renderPdf();
    }
  }

  removeZone(id: string) {
    this.zones.update(zones => zones.filter(z => z.id !== id));
    this.uploadState.removeZone(id);
    if (this.selectedZone()?.id === id) {
      this.selectedZone.set(null);
    }
  }

  updateZone(zone: SignatureZone) {
    this.uploadState.updateZone(zone.id, {
      signerName: zone.signerName,
      signerEmail: zone.signerEmail
    });
  }

  allZonesHaveNames(): boolean {
    return this.zones().length > 0 && this.zones().every(z => z.signerName.trim().length > 0);
  }

  async createDocument() {
    if (!this.file || !this.pdfBytes) return;
    if (!this.allZonesHaveNames()) {
      toast('Completa el nombre de todos los firmantes', 'warning');
      return;
    }

    try {
      const { doc, signers } = await this.docService.createDocumentWithSigners(
        this.file,
        this.pdfBytes,
        this.zones()
      );

      this.uploadState.clear();
      // Navigate to a success/share page
      this.router.navigate(['/dashboard']);
      toast(`Documento creado con ${signers.length} firmante(s)`, 'success');
    } catch (e: any) {
      toast('Error al crear documento: ' + e.message, 'error');
    }
  }
}
