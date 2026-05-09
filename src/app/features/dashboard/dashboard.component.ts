import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DocumentService } from '../../core/services/document.service';
import { Document } from '../../core/models';
import { NgFor, NgIf, DatePipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, NgFor, NgIf, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  docService = inject(DocumentService);

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