import { Component, inject, ElementRef, ViewChild, signal, effect } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PdfService } from '../../core/services/pdf.service';
import { DocumentService } from '../../core/services/document.service';
import { UploadStateService, SignatureZone } from '../../core/services/upload-state.service';
import { AuthService } from '../../core/services/auth.service';
import { toast, showLoading, hideLoading } from '../../shared/utils/toast';

@Component({
  selector: 'app-sign-zone',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './sign-zone.component.html',
  styleUrls: ['./sign-zone.component.scss']
})
export class SignZoneComponent {
  router = inject(Router);
  private pdfService = inject(PdfService);
  private docService = inject(DocumentService);
  private uploadState = inject(UploadStateService);
  private auth = inject(AuthService);

  @ViewChild('pdfCanvas') pdfCanvasRef!: ElementRef<HTMLCanvasElement>;

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
    effect(() => {
      const state = this.uploadState.currentState();
      if (state.file && state.fileBytes) {
        this.file = state.file;
        this.pdfBytes = state.fileBytes;
        this.zones.set([...state.zones]);
        this.renderPdf();
      } else {
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

    const maxZones = this.auth.maxZonesAllowed();
    if (this.zones().length >= maxZones) {
      toast(`Límite de ${maxZones} zona(s) de firma alcanzado para tu plan`, 'warning');
      this.isDrawing.set(false);
      this.drawStart.set(null);
      this.drawRect.set(null);
      return;
    }

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
      this.router.navigate(['/dashboard']);
      toast(`Documento creado con ${signers.length} firmante(s)`, 'success');
    } catch (e: any) {
      toast('Error al crear documento: ' + e.message, 'error');
    }
  }
}