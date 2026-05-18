import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { PLANS, PlanType, UserRole, getPlan } from '../models';
import { toast } from '../../shared/utils/toast';

interface SupabaseUserDoc {
  id: string;
  user_id: string;
  email: string;
  name?: string;
  plan: PlanType;
  role?: UserRole;
  docs_used?: number;
  reset_date?: string;
  lemon_subscription_id?: string;
  subscription_status?: string;
  subscription_end_date?: string;
  pay_per_use_credits?: number;
  created_at: string;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private user = signal<SupabaseUserDoc | null>(null);
  private anonSignal = signal(false);

  readonly currentUser = this.user.asReadonly();
  readonly isAuthenticated = () => !!this.user();
  readonly isAnon = () => this.anonSignal();

  // Helpers para planes
  readonly currentPlan = () => getPlan(this.user()?.plan || 'free');
  readonly isPro = () => this.user()?.plan === 'pro' || this.user()?.plan === 'business';
  readonly isBusiness = () => this.user()?.plan === 'business';
  readonly isPayPerUse = () => this.user()?.plan === 'payperuse';
  readonly hasPaidPlan = () => ['pro', 'business'].includes(this.user()?.plan || '');
  readonly isAdmin = () => this.user()?.role === 'admin';

  readonly docsRemaining = () => {
    const user = this.user();
    if (!user) return 0;
    const plan = getPlan(user.plan);
    if (plan.docsLimit === -1) return 9999; // Ilimitado
    const used = user.docs_used ?? 0;
    return Math.max(0, plan.docsLimit - used);
  };

  readonly canCreateDoc = () => {
    const user = this.user();
    if (!user) return false;
    const plan = getPlan(user.plan);
    if (plan.docsLimit === -1) return true; // Ilimitado
    return this.docsRemaining() > 0;
  };

  readonly maxSignersAllowed = () => {
    const plan = this.currentPlan();
    return plan.maxSigners === -1 ? 9999 : plan.maxSigners;
  };

  readonly maxZonesAllowed = () => {
    const plan = this.currentPlan();
    return plan.maxZones === -1 ? 9999 : plan.maxZones;
  };

  readonly hasWatermark = () => {
    return this.currentPlan().watermark;
  };

  readonly payPerUseCredits = () => {
    return this.user()?.pay_per_use_credits || 0;
  };

  constructor(private supabase: SupabaseService, private router: Router) {}

  async init() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (user?.email) {
        await this.loadUserDoc();
      }
    } catch {
      // No session
    }
  }

  async login(email: string, password: string) {
    try {
      const { error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      await this.loadUserDoc();
      toast('¡Bienvenido!', 'success');
      this.router.navigate(['/dashboard']);
      return true;
    } catch (e: any) {
      toast(e.message || 'Credenciales incorrectas', 'error');
      return false;
    }
  }

  async register(name: string, email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      });

      if (error) throw error;

      // Reintentar hasta que el usuario se cree en la tabla (trigger de Supabase)
      let retries = 0;
      while (retries < 5) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const { data: existing } = await this.supabase
          .from(this.supabase.tables.users)
          .select('*')
          .eq('user_id', data.user?.id)
          .maybeSingle();
        if (existing) break;
        retries++;
      }

      await this.loadUserDoc();
      toast('¡Cuenta creada!', 'success');
      this.router.navigate(['/dashboard']);
      return true;
    } catch (e: any) {
      const message = e.message || '';
      if (message.includes('already registered') || message.includes('already been registered')) {
        toast('Ya existe una cuenta con ese correo. Usa iniciar sesión o prueba con otro email.', 'error');
      } else {
        toast(message || 'Error al crear cuenta', 'error');
      }
      return false;
    }
  }

  async logout() {
    try {
      await this.supabase.auth.signOut();
    } catch {}
    this.user.set(null);
    this.anonSignal.set(false);
    this.router.navigate(['/']);
  }

  private async loadUserDoc() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return;

      const { data: userDoc, error } = await this.supabase.from(this.supabase.tables.users)
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error;
      }

      if (userDoc) {
        this.user.set(userDoc as SupabaseUserDoc);
        return;
      }

      // Usuario no existe en la tabla, crearlo
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const userData = {
        user_id: user.id,
        email: user.email!,
        name: user.user_metadata?.['name'] || '',
        plan: 'free',
        docs_used: 0,
        reset_date: nextMonth.toISOString(),
        pay_per_use_credits: 0
      };

      const { data: newUserDoc, error: insertError } = await this.supabase
        .from(this.supabase.tables.users)
        .insert(userData)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating user doc:', insertError);
        toast('Error al crear perfil de usuario', 'error');
        return;
      }

      this.user.set(newUserDoc as SupabaseUserDoc);
    } catch (e: any) {
      console.error('Error loading user doc:', e);
      toast('Error al cargar perfil de usuario', 'error');
    }
  }
}
