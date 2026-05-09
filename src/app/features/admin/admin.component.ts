import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { User, PricingConfig, PlanType } from '../../core/models';
import { toast } from '../../shared/utils/toast';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  adminService = inject(AdminService);
  auth = inject(AuthService);
  router = inject(Router);

  activeTab = signal<'users' | 'pricing' | 'lemonsqueezy'>('users');
  loading = signal(false);

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

  setActiveTab(tab: 'users' | 'pricing' | 'lemonsqueezy') {
    this.activeTab.set(tab);
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