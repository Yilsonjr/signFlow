import { Injectable } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

@Injectable({ providedIn: 'root' })
export class PdfService {
  async renderPdf(
    canvas: HTMLCanvasElement,
    arrayBuffer: ArrayBuffer,
    pageNum: number = 1,
    scale: number = 1.5
  ): Promise<{ width: number; height: number; totalPages: number }> {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport } as any).promise;

    return {
      width: viewport.width,
      height: viewport.height,
      totalPages: pdf.numPages
    };
  }

  async embedSignature(
    pdfBytes: ArrayBuffer,
    signatureDataUrl: string,
    zone: { page: number; x: number; y: number; w: number; h: number; scale: number }
  ): Promise<Uint8Array> {
    const { PDFDocument } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const page = pages[zone.page - 1];
    const { width: pdfW, height: pdfH } = page.getSize();

    const scaleX = pdfW / (zone.w / zone.scale);
    const scaleY = pdfH / (zone.h / zone.scale);

    const pdfX = zone.x * scaleX;
    const pdfY = pdfH - (zone.y + zone.h) * scaleY;

    const sigBytes = this.signatureToPngBytes(signatureDataUrl);
    const sigImage = await pdfDoc.embedPng(sigBytes);

    page.drawImage(sigImage, {
      x: pdfX,
      y: pdfY,
      width: zone.w * scaleX,
      height: zone.h * scaleY
    });

    return await pdfDoc.save();
  }

  private signatureToPngBytes(dataUrl: string): Uint8Array {
    const base64 = dataUrl.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  extractSignatureTransparent(canvas: HTMLCanvasElement): string {
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imageData.data;

    for (let i = 0; i < d.length; i += 4) {
      const brightness = (d[i] + d[i + 1] + d[i + 2]) / 3;
      if (brightness > 200) {
        d[i + 3] = 0;
      } else {
        const alpha = Math.min(255, Math.round((1 - brightness / 255) * 255 * 1.4));
        d[i] = 0;
        d[i + 1] = 0;
        d[i + 2] = 0;
        d[i + 3] = alpha;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
  }
}
