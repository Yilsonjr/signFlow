import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PLANS, PlanType, Plan } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { PaymentService } from '../../core/services/payment.service';
import { AdminService } from '../../core/services/admin.service';
import { LemonCheckoutComponent } from '../../shared/components/lemon-checkout.component';
import { toast } from '../../shared/utils/toast';

@Component({
  selector: 'app-precios',
  standalone: true,
  imports: [CommonModule, RouterLink, LemonCheckoutComponent],
  templateUrl: './precios.component.html',
  styleUrls: ['./precios.component.scss']
})
export class PreciosComponent {
  plans: Plan[] = PLANS;
  auth = inject(AuthService);
  router = inject(Router);
  paymentService = inject(PaymentService);
  adminService = inject(AdminService);
  showPayPerUseModal = signal(false);

  isCurrentPlan(planId: PlanType): boolean {
    return this.auth.currentPlan().id === planId;
  }

  getPlanDesc(planId: PlanType): string {
    const descs: Record<PlanType, string> = { free: 'Para empezar sin costo', pro: 'Perfecto para profesionales', business: 'Para equipos y empresas', payperuse: 'Ideal para uso ocasional' };
    return descs[planId];
  }

  getUpgradeLabel(planId: PlanType): string {
    const labels: Record<PlanType, string> = { free: 'Elegir Free', pro: 'Actualizar a Pro', business: 'Actualizar a Business', payperuse: 'Usar Pay Per Use' };
    return labels[planId];
  }

  startUpgrade(planId: PlanType) {
    if (!this.auth.isAuthenticated()) { toast('Debes iniciar sesion para suscribirte', 'warning'); return; }
  }

  async selectFree() {
    if (this.isCurrentPlan('free')) return;
    const confirmed = confirm('Bajar al plan Free? Perderas funciones Pro.');
    if (!confirmed) return;
    await this.paymentService.cancelSubscription();
  }

  startPayPerUse() {
    if (!this.auth.isAuthenticated()) { toast('Debes iniciar sesion', 'warning'); return; }
    this.showPayPerUseModal.set(true);
  }

  getDynamicPrice(planId: PlanType): number {
    return this.adminService.getDynamicPrice(planId) || PLANS.find(p => p.id === planId)?.price || 0;
  }

  getPriceDisplay(planId: PlanType): string {
    const dynamic = this.adminService.getDynamicPrice(planId);
    const base = PLANS.find(p => p.id === planId)?.price || 0;
    const price = dynamic > 0 ? dynamic : base;
    return price.toFixed(2);
  }

  async buyCredits(amount: number) {
    const success = await this.paymentService.addPayPerUseCredits(amount);
    if (success) { this.showPayPerUseModal.set(false); }
  }
}