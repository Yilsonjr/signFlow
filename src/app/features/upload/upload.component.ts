import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UploadStateService } from '../../core/services/upload-state.service';
import { toast } from '../../shared/utils/toast';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss']
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