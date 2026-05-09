import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { AdminService } from './admin.service';
import { PlanType, getPlan } from '../models';
import { toast } from '../../shared/utils/toast';

declare global {
  interface Window {
    LemonSqueezy?: any;
  }
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);
  private admin = inject(AdminService);

  readonly PAY_PER_USE_PRICE = 0.75;

  isLemonSqueezyLoaded(): boolean {
    return typeof window.LemonSqueezy !== 'undefined';
  }

  async loadLemonSqueezyScript(): Promise<void> {
    if (this.isLemonSqueezyLoaded()) return;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://assets.lemonsqueezy.com/lemon.js';
      script.async = true;
      script.onload = () => {
        window.LemonSqueezy?.Setup?.();
        resolve();
      };
      script.onerror = () => reject(new Error('Error cargando Lemon Squeezy SDK'));
      document.body.appendChild(script);
    });
  }

  getLemonVariantId(plan: PlanType): string | null {
    return this.admin.getDynamicLemonVariantId(plan);
  }

  async openCheckout(plan: PlanType): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) {
      toast('Debes iniciar sesion para suscribirte', 'warning');
      return;
    }

    const variantId = this.getLemonVariantId(plan);
    if (!variantId) {
      toast('Producto no configurado. Contacta al administrador.', 'error');
      return;
    }

    try {
      await this.loadLemonSqueezyScript();

      window.LemonSqueezy?.Url?.Open?.(variantId, {
        checkout: {
          custom: {
            user_id: user.user_id,
            plan: plan
          }
        }
      });
    } catch (e: any) {
      toast('Error abriendo checkout: ' + e.message, 'error');
    }
  }

  async activateSubscription(plan: PlanType, subscriptionId: string): Promise<boolean> {
    const user = this.auth.currentUser();
    if (!user) {
      toast('Debes iniciar sesion para suscribirte', 'error');
      return false;
    }

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    try {
      const { error } = await this.supabase
        .from(this.supabase.tables.users)
        .update({
          plan: plan,
          lemon_subscription_id: subscriptionId,
          subscription_status: 'active',
          subscription_end_date: endDate.toISOString(),
          docs_used: 0
        })
        .eq('id', user.id);

      if (error) throw error;

      await this.auth.init();

      const planLabel = getPlan(plan).label;
      toast(`Bienvenido a SignFlow ${planLabel}!`, 'success');
      return true;
    } catch (e: any) {
      toast('Error activando tu suscripcion: ' + e.message, 'error');
      return false;
    }
  }

  async addPayPerUseCredits(amount: number): Promise<boolean> {
    const user = this.auth.currentUser();
    if (!user) {
      toast('Debes iniciar sesion', 'error');
      return false;
    }

    const variantId = this.getLemonVariantId('payperuse');
    if (variantId) {
      try {
        await this.loadLemonSqueezyScript();
        window.LemonSqueezy?.Url?.Open?.(variantId, {
          checkout: {
            custom: {
              user_id: user.user_id,
              plan: 'payperuse',
              credits_amount: amount.toString()
            }
          }
        });
        return true;
      } catch (e: any) {
        toast('Error abriendo checkout: ' + e.message, 'error');
        return false;
      }
    }

    const currentCredits = user.pay_per_use_credits || 0;
    const newCredits = currentCredits + amount;

    try {
      const { error } = await this.supabase
        .from(this.supabase.tables.users)
        .update({
          plan: 'payperuse',
          pay_per_use_credits: newCredits
        })
        .eq('id', user.id);

      if (error) throw error;

      await this.auth.init();
      toast(`Agregados $${amount.toFixed(2)} en creditos!`, 'success');
      return true;
    } catch (e: any) {
      toast('Error agregando creditos: ' + e.message, 'error');
      return false;
    }
  }

  async chargePerUse(): Promise<boolean> {
    const user = this.auth.currentUser();
    if (!user || user.plan !== 'payperuse') return false;

    const currentCredits = user.pay_per_use_credits || 0;
    if (currentCredits < this.PAY_PER_USE_PRICE) {
      toast('Creditos insuficientes. Recarga tu cuenta.', 'error');
      return false;
    }

    try {
      const { error } = await this.supabase
        .from(this.supabase.tables.users)
        .update({
          pay_per_use_credits: currentCredits - this.PAY_PER_USE_PRICE
        })
        .eq('id', user.id);

      if (error) throw error;

      await this.auth.init();
      return true;
    } catch (e: any) {
      toast('Error cobrando credito: ' + e.message, 'error');
      return false;
    }
  }

  async cancelSubscription(): Promise<boolean> {
    const user = this.auth.currentUser();
    if (!user?.lemon_subscription_id) {
      toast('No tienes una suscripcion activa', 'warning');
      return false;
    }

    try {
      const { error } = await this.supabase
        .from(this.supabase.tables.users)
        .update({
          plan: 'free',
          lemon_subscription_id: null,
          subscription_status: 'cancelled',
          subscription_end_date: null
        })
        .eq('id', user.id);

      if (error) throw error;

      await this.auth.init();
      toast('Suscripcion cancelada. Ahora estas en plan Free.', 'success');
      return true;
    } catch (e: any) {
      toast('Error cancelando suscripcion: ' + e.message, 'error');
      return false;
    }
  }

  async checkSubscriptionExpiry(): Promise<boolean> {
    const user = this.auth.currentUser();
    if (!user || !user.subscription_end_date) return true;

    const endDate = new Date(user.subscription_end_date);
    const now = new Date();

    if (endDate < now && user.plan !== 'free' && user.plan !== 'payperuse') {
      try {
        const { error } = await this.supabase
          .from(this.supabase.tables.users)
          .update({
            plan: 'free',
            lemon_subscription_id: null,
            subscription_status: 'expired',
            subscription_end_date: null
          })
          .eq('id', user.id);

        if (error) throw error;

        await this.auth.init();
        toast('Tu suscripcion ha vencido. Bajado a plan Free.', 'warning');
        return false;
      } catch {
        return true;
      }
    }

    return true;
  }
}