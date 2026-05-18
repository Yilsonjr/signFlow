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
  templateUrl: './signature.component.html',
  styleUrls: ['./signature.component.scss']
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

      const hash = await computeSHA256(this.originalPdfBytes);

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

      const signedArrayBuffer = signedPdfBytes.buffer.slice(signedPdfBytes.byteOffset, signedPdfBytes.byteOffset + signedPdfBytes.byteLength) as ArrayBuffer;
      const signedBlob = new Blob([signedArrayBuffer], { type: 'application/pdf' });
      const signedFile = new File([signedBlob], `signed_${doc.file_name}`, { type: 'application/pdf' });

      const fileName = `signed_${Date.now()}_${doc.file_name}`;
      const { data: uploaded, error: uploadError } = await this.supabase.storage
        .from('documents')
        .upload(fileName, signedFile);

      if (uploadError) throw uploadError;

      await this.docService.updateSignerSignature(signer.code, uploaded.path);

      const allSigners = await this.docService.getSignersByDocId(doc.id);
      const allSigned = allSigners.every(s => s.status === 'signed');

      await this.docService.updateDocumentStatus(
        doc.id,
        allSigned ? 'signed' : 'partial',
        uploaded.path
      );

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