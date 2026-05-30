import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DocumentService } from '../../core/services/document.service';
import { Document, Signer } from '../../core/models';
import { NgIf, DatePipe } from '@angular/common';

export interface DocWithSigners extends Document {
  signers: Signer[];
  expanded: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, NgIf, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  docService = inject(DocumentService);

  docs = signal<DocWithSigners[]>([]);
  loading = signal(true);

  async ngOnInit() {
    await this.loadDocs();
  }

  async loadDocs() {
    this.loading.set(true);
    const docs = await this.docService.getDocuments();
    const docsWithSigners = await Promise.all(
      docs.map(async doc => ({
        ...doc,
        signers: await this.docService.getSignersByDocId(doc.id),
        expanded: false
      }))
    );
    this.docs.set(docsWithSigners);
    this.loading.set(false);
  }

  toggleSigners(doc: DocWithSigners) {
    this.docs.update(list =>
      list.map(d => d.id === doc.id ? { ...d, expanded: !d.expanded } : d)
    );
  }

  copySignerLink(signerCode: string) {
    const url = `${window.location.origin}/sign?code=${signerCode}`;
    navigator.clipboard.writeText(url);
    // Toast visual sin alert bloqueante
    const el = document.createElement('div');
    el.textContent = '✅ Enlace copiado';
    el.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1e293b;color:#fff;padding:10px 20px;border-radius:8px;font-size:14px;z-index:9999;';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  }

  signerStatusLabel(status: string): string {
    return status === 'signed' ? 'Firmado' : 'Pendiente';
  }
}