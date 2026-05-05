import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { User, PricingConfig, LemonSqueezyConfig, PlanType } from '../models';
import { toast } from '../../shared/utils/toast';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  private users = signal<User[]>([]);
  private pricingConfigs = signal<PricingConfig[]>([]);
  private lemonConfig = signal<LemonSqueezyConfig | null>(null);

  readonly allUsers = this.users.asReadonly();
  readonly pricingConfigurations = this.pricingConfigs.asReadonly();
  readonly lemonConfiguration = this.lemonConfig.asReadonly();

  async loadUsers() {
    if (!this.auth.isAdmin()) {
      toast('Acceso denegado', 'error');
      return;
    }

    try {
      const { data, error } = await this.supabase
        .from(this.supabase.tables.users)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.users.set(data as User[]);
    } catch (e: any) {
      toast('Error cargando usuarios: ' + e.message, 'error');
    }
  }

  async updateUserRole(userId: string, role: 'user' | 'admin') {
    if (!this.auth.isAdmin()) {
      toast('Acceso denegado', 'error');
      return false;
    }

    try {
      const { error } = await this.supabase
        .from(this.supabase.tables.users)
        .update({ role })
        .eq('id', userId);

      if (error) throw error;

      await this.loadUsers();
      toast('Rol actualizado correctamente', 'success');
      return true;
    } catch (e: any) {
      toast('Error actualizando rol: ' + e.message, 'error');
      return false;
    }
  }

  async updateUserPlan(userId: string, plan: PlanType) {
    if (!this.auth.isAdmin()) {
      toast('Acceso denegado', 'error');
      return false;
    }

    try {
      const { error } = await this.supabase
        .from(this.supabase.tables.users)
        .update({ plan })
        .eq('id', userId);

      if (error) throw error;

      await this.loadUsers();
      toast('Plan actualizado correctamente', 'success');
      return true;
    } catch (e: any) {
      toast('Error actualizando plan: ' + e.message, 'error');
      return false;
    }
  }

  async loadPricingConfigs() {
    if (!this.auth.isAdmin()) {
      toast('Acceso denegado', 'error');
      return;
    }

    try {
      const { data, error } = await this.supabase
        .from(this.supabase.tables.pricing_configs)
        .select('*');

      if (error) throw error;

      if (data && data.length > 0) {
        this.pricingConfigs.set(data as PricingConfig[]);
      } else {
        this.initializeDefaultPricing();
      }
    } catch (e: any) {
      this.initializeDefaultPricing();
    }
  }

  private initializeDefaultPricing() {
    const userId = this.auth.currentUser()?.id || 'system';
    const defaultConfigs: PricingConfig[] = [
      {
        plan_id: 'pro',
        price: 7.99,
        is_active: true,
        updated_at: new Date().toISOString(),
        updated_by: userId
      },
      {
        plan_id: 'business',
        price: 15.00,
        is_active: true,
        updated_at: new Date().toISOString(),
        updated_by: userId
      }
    ];
    this.pricingConfigs.set(defaultConfigs);
  }

  async updatePricing(planId: PlanType, price: number, lemonProductId?: string, lemonVariantId?: string) {
    if (!this.auth.isAdmin()) {
      toast('Acceso denegado', 'error');
      return false;
    }

    try {
      const userId = this.auth.currentUser()?.id || 'system';
      const config: Partial<PricingConfig> = {
        price,
        lemon_product_id: lemonProductId,
        lemon_variant_id: lemonVariantId,
        updated_at: new Date().toISOString(),
        updated_by: userId
      };

      const existing = this.pricingConfigs().find(c => c.plan_id === planId);

      if (existing && existing.id) {
        const { error } = await this.supabase
          .from(this.supabase.tables.pricing_configs)
          .update(config)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await this.supabase
          .from(this.supabase.tables.pricing_configs)
          .insert({
            ...config,
            plan_id: planId,
            is_active: true
          });
        if (error) throw error;
      }

      await this.loadPricingConfigs();
      toast('Precio actualizado correctamente', 'success');
      return true;
    } catch (e: any) {
      toast('Error actualizando precio: ' + e.message, 'error');
      return false;
    }
  }

  async loadLemonSqueezyConfig() {
    if (!this.auth.isAdmin()) {
      toast('Acceso denegado', 'error');
      return;
    }

    try {
      const { data, error } = await this.supabase
        .from(this.supabase.tables.lemon_config)
        .select('*')
        .maybeSingle();

      if (error) throw error;
      if (data) this.lemonConfig.set(data as LemonSqueezyConfig);
    } catch (e: any) {
      // Config not set yet
    }
  }

  async updateLemonSqueezyConfig(config: Partial<LemonSqueezyConfig>) {
    if (!this.auth.isAdmin()) {
      toast('Acceso denegado', 'error');
      return false;
    }

    try {
      const userId = this.auth.currentUser()?.id || 'system';
      const updateData = {
        ...config,
        updated_at: new Date().toISOString(),
        updated_by: userId
      };

      const existing = this.lemonConfig();

      if (existing && existing.id) {
        const { error } = await this.supabase
          .from(this.supabase.tables.lemon_config)
          .update(updateData)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await this.supabase
          .from(this.supabase.tables.lemon_config)
          .insert(updateData);
        if (error) throw error;
      }

      await this.loadLemonSqueezyConfig();
      toast('Configuracion Lemon Squeezy actualizada', 'success');
      return true;
    } catch (e: any) {
      toast('Error actualizando Lemon Squeezy: ' + e.message, 'error');
      return false;
    }
  }

  getDynamicPrice(planId: PlanType): number {
    const config = this.pricingConfigs().find(c => c.plan_id === planId && c.is_active);
    return config?.price || 0;
  }

  getDynamicLemonVariantId(planId: PlanType): string | null {
    const config = this.pricingConfigs().find(c => c.plan_id === planId && c.is_active);
    return config?.lemon_variant_id || null;
  }
}