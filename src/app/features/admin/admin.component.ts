import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { User, PricingConfig, PlanType } from '../../core/models';
import { toast } from '../../shared/utils/toast';

import { FormsModule } from '@angular/forms';
import { NgClass, SlicePipe } from '@angular/common';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule, NgClass, SlicePipe],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  adminService = inject(AdminService);
  auth = inject(AuthService);
  router = inject(Router);

  activeTab = signal<'users' | 'pricing' | 'lemonsqueezy' | 'audit'>('users');
  loading = signal(false);

  // Audit log state
  auditEventFilter = signal('');
  auditPage = signal(0);
  auditLoading = signal(false);

  readonly AUDIT_EVENTS = [
    { value: '', label: 'Todos los eventos' },
    { value: 'document_created', label: 'Documento creado' },
    { value: 'document_opened', label: 'Documento abierto' },
    { value: 'document_signed', label: 'Documento firmado' },
    { value: 'document_downloaded', label: 'Documento descargado' },
    { value: 'document_cancelled', label: 'Documento cancelado' },
  ];

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    try {
      await Promise.all([
        this.adminService.loadUsers(),
        this.adminService.loadPricingConfigs(),
        this.adminService.loadLemonSqueezyConfig()
      ]);
    } catch (error) {
      toast('Error cargando datos administrativos', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  setActiveTab(tab: 'users' | 'pricing' | 'lemonsqueezy' | 'audit') {
    this.activeTab.set(tab);
    if (tab === 'audit' && this.adminService.allAuditLogs().length === 0) {
      this.loadAuditLogs(true);
    }
  }

  async loadAuditLogs(reset = false) {
    if (reset) {
      this.auditPage.set(0);
    }
    this.auditLoading.set(true);
    await this.adminService.loadAuditLogs(this.auditPage(), this.auditEventFilter());
    this.auditLoading.set(false);
  }

  async loadMoreAuditLogs() {
    this.auditPage.update(p => p + 1);
    this.auditLoading.set(true);
    await this.adminService.loadAuditLogs(this.auditPage(), this.auditEventFilter());
    this.auditLoading.set(false);
  }

  async onAuditFilterChange(event: Event) {
    this.auditEventFilter.set((event.target as HTMLSelectElement).value);
    await this.loadAuditLogs(true);
  }

  get hasMoreAuditLogs(): boolean {
    return this.adminService.allAuditLogs().length < this.adminService.auditLogsCount();
  }

  formatAuditDate(iso: string): string {
    return new Date(iso).toLocaleString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  auditEventLabel(event: string): string {
    return this.AUDIT_EVENTS.find(e => e.value === event)?.label ?? event;
  }

  auditEventClass(event: string): string {
    const map: Record<string, string> = {
      document_created: 'badge-created',
      document_signed: 'badge-signed',
      document_opened: 'badge-opened',
      document_downloaded: 'badge-downloaded',
      document_cancelled: 'badge-cancelled',
    };
    return map[event] ?? 'badge-default';
  }

  async updateUserRole(user: User, role: 'user' | 'admin') {
    if (user.id === this.auth.currentUser()?.id) {
      toast('No puedes cambiar tu propio rol', 'warning');
      return;
    }

    await this.adminService.updateUserRole(user.id, role);
  }

  async updateUserPlan(user: User, plan: PlanType) {
    await this.adminService.updateUserPlan(user.id, plan);
  }

  async updatePricing(planId: PlanType, price: number, lemonProductId?: string, lemonVariantId?: string) {
    await this.adminService.updatePricing(planId, price, lemonProductId, lemonVariantId);
  }

  async updateLemonSqueezyConfig(apiKey: string, storeId: string, webhookSecret: string, environment: 'test' | 'live') {
    await this.adminService.updateLemonSqueezyConfig({
      api_key: apiKey,
      store_id: storeId,
      webhook_secret: webhookSecret,
      environment
    });
  }

  getPlanLabel(plan: PlanType): string {
    const labels = {
      free: 'Free',
      pro: 'Pro',
      business: 'Business',
      payperuse: 'Pay Per Use'
    };
    return labels[plan];
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}