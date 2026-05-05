import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UploadStateService } from '../../core/services/upload-state.service';
import { toast } from '../../shared/utils/toast';

@Component({
  selector: 'app-upload',
  standalone: true,
  template: `
    <div class="upload-wrapper">
      <div class="container py-5">
        <div class="upload-header">
          <button class="btn-back" (click)="router.navigate(['/dashboard'])">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            <span>Volver al dashboard</span>
          </button>
          <div class="step-indicator">
            <div class="step active">
              <span class="step-number">1</span>
              <span class="step-label">Subir</span>
            </div>
            <div class="step-line"></div>
            <div class="step">
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

        <div class="upload-content">
          <div class="upload-card">
            <div class="upload-card-header">
              <h1 class="upload-title">Subir documento</h1>
              <p class="upload-subtitle">Selecciona un PDF para comenzar el proceso de firma</p>
            </div>

            <div 
              class="drop-zone" 
              [class.drag-over]="isDragging"
              (click)="fileInput.click()"
              (dragover)="onDragOver($event)"
              (dragleave)="onDragLeave()"
              (drop)="onDrop($event)"
            >
              <div class="drop-zone-content">
                <div class="drop-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                </div>
                <h3 class="drop-title">Arrastra tu archivo aquí</h3>
                <p class="drop-desc">o haz clic para seleccionar desde tu dispositivo</p>
                <div class="drop-formats">
                  <span class="format-badge">PDF</span>
                  <span class="format-badge">PNG</span>
                  <span class="format-badge">JPG</span>
                </div>
                <p class="drop-limit">Tamaño máximo: 50 MB</p>
              </div>
              <input 
                type="file" 
                #fileInput 
                class="d-none" 
                accept=".pdf,.png,.jpg,.jpeg" 
                (change)="onFileSelected($event)"
              >
            </div>

            @if (file) {
              <div class="file-preview">
                <div class="file-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div class="file-info">
                  <span class="file-name">{{ file.name }}</span>
                  <span class="file-size">{{ (file.size/1024).toFixed(1) }} KB</span>
                </div>
                <button class="btn-remove" (click)="file = null; $event.stopPropagation()">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            }

            <button 
              class="btn-upload" 
              [disabled]="!file" 
              (click)="next()"
            >
              <span>Continuar</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .upload-wrapper {
      background: linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%);
      min-height: calc(100vh - 57px);
    }
    
    .upload-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
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
      opacity: 0.5;
    }
    
    .step.active {
      opacity: 1;
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
    
    .upload-content {
      max-width: 680px;
      margin: 0 auto;
    }
    
    .upload-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      padding: 2.5rem;
      box-shadow: var(--shadow-sm);
    }
    
    .upload-card-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .upload-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-1);
      margin-bottom: 0.5rem;
    }
    
    .upload-subtitle {
      color: var(--text-3);
      font-size: 0.9375rem;
    }
    
    .drop-zone {
      border: 2px dashed var(--border-2);
      border-radius: var(--radius-xl);
      padding: 3rem;
      cursor: pointer;
      transition: all 0.3s ease;
      background: linear-gradient(180deg, var(--bg-2) 0%, var(--surface) 100%);
    }
    
    .drop-zone:hover {
      border-color: var(--primary);
      background: linear-gradient(180deg, var(--primary-pale) 0%, var(--surface) 100%);
    }
    
    .drop-zone.drag-over {
      border-color: var(--primary);
      background: var(--primary-pale);
      transform: scale(1.02);
    }
    
    .drop-zone-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.75rem;
    }
    
    .drop-icon {
      width: 80px;
      height: 80px;
      border-radius: var(--radius-2xl);
      background: linear-gradient(135deg, var(--primary-pale), #EFF6FF);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary);
      margin-bottom: 0.5rem;
    }
    
    .drop-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-1);
    }
    
    .drop-desc {
      color: var(--text-3);
      font-size: 0.9375rem;
    }
    
    .drop-formats {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    
    .format-badge {
      padding: 4px 12px;
      background: var(--bg-2);
      border: 1px solid var(--border);
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-3);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .drop-limit {
      font-size: 0.875rem;
      color: var(--text-4);
      margin-top: 0.25rem;
    }
    
    .file-preview {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--bg-2);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      margin-top: 1.5rem;
    }
    
    .file-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--success-bg), #D1FAE5);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--success);
      flex-shrink: 0;
    }
    
    .file-info {
      flex: 1;
      min-width: 0;
    }
    
    .file-name {
      display: block;
      font-weight: 600;
      color: var(--text-1);
      font-size: 0.9375rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .file-size {
      font-size: 0.875rem;
      color: var(--text-3);
    }
    
    .btn-remove {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--text-3);
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .btn-remove:hover {
      background: var(--error-bg);
      border-color: var(--error);
      color: var(--error);
    }
    
    .btn-upload {
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
      margin-top: 1.5rem;
      box-shadow: var(--shadow-sm);
    }
    
    .btn-upload:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: var(--shadow-primary);
    }
    
    .btn-upload:disabled {
      background: var(--bg-3);
      color: var(--text-4);
      cursor: not-allowed;
      box-shadow: none;
    }
    
    .d-none {
      display: none !important;
    }
    
    @media (max-width: 768px) {
      .upload-card {
        padding: 1.5rem;
      }
      
      .drop-zone {
        padding: 2rem;
      }
      
      .step-indicator {
        display: none;
      }
    }
  `]
})
export class UploadComponent {
  router = inject(Router);
  private auth = inject(AuthService);
  private uploadState = inject(UploadStateService);
  file: File | null = null;
  isDragging = false;

  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.isDragging = true;
  }

  onDragLeave() {
    this.isDragging = false;
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragging = false;
    if (e.dataTransfer?.files[0]) {
      this.validateAndSetFile(e.dataTransfer.files[0]);
    }
  }

  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files?.[0]) this.validateAndSetFile(input.files[0]);
  }

  private validateAndSetFile(file: File) {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast('Solo se permiten archivos PDF, PNG o JPG', 'error');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast('El archivo no puede superar los 50 MB', 'error');
      return;
    }
    this.file = file;
  }

  async next() {
    if (!this.file) return;

    // Validar según plan
    if (!this.auth.canCreateDoc()) {
      if (this.auth.isPayPerUse()) {
        toast('Créditos insuficientes. Recarga tu cuenta.', 'warning');
      } else {
        toast('Límite de documentos alcanzado. Actualiza tu plan.', 'warning');
      }
      this.router.navigate(['/pricing']);
      return;
    }

    try {
      const arrayBuffer = await this.file.arrayBuffer();
      this.uploadState.setFile(this.file, arrayBuffer);
      this.router.navigate(['/sign-zone']);
    } catch (e) {
      toast('Error al leer el archivo', 'error');
    }
  }
}
