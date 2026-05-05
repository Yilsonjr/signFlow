export type PlanType = 'free' | 'pro' | 'business' | 'payperuse';

export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  user_id: string;
  email: string;
  name?: string;
  plan: PlanType;
  role?: UserRole;
  docs_used: number;
  reset_date: string;
  lemon_subscription_id?: string;
  subscription_status?: 'active' | 'cancelled' | 'past_due' | 'expired' | 'paused';
  subscription_end_date?: string;
  pay_per_use_credits?: number;
}

export interface Document {
  id: string;
  created_at: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_data?: string;
  code: string;
  signature_data?: string;
  status: 'pending' | 'partial' | 'signed' | 'cancelled';
  signed_at?: string;
  file_id: string;
  sign_zone_x?: number;
  sign_zone_scale?: number;
  signed_file_id?: string;
  sign_zone_y?: number;
  sign_zone_w?: number;
  sign_zone_h?: number;
  sign_zone_page?: number;
  owner_id: string;
}

export interface Signer {
  id: string;
  created_at: string;
  doc_id: string;
  signer_name: string;
  signer_email?: string;
  zone_index: number;
  code: string;
  status: 'pending' | 'signed' | 'cancelled';
  signed_file_id?: string;
  signed_at?: string;
}

export interface Plan {
  id: PlanType;
  label: string;
  price: number;
  priceLabel: string;
  docsLimit: number;        // -1 = ilimitado
  maxSigners: number;       // -1 = ilimitado
  maxZones: number;         // -1 = ilimitado
  watermark: boolean;
  features: string[];
  lemonPlanId?: string;
  lemonVariantId?: string;
}

export interface PricingConfig {
  id?: string;
  plan_id: PlanType;
  price: number;
  lemon_product_id?: string;
  lemon_variant_id?: string;
  is_active: boolean;
  updated_at: string;
  updated_by: string;
}

export interface LemonSqueezyConfig {
  id?: string;
  api_key: string;
  store_id: string;
  webhook_secret: string;
  environment: 'test' | 'live';
  updated_at: string;
  updated_by: string;
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    label: 'Free',
    price: 0,
    priceLabel: '$0',
    docsLimit: 3,
    maxSigners: 1,
    maxZones: 1,
    watermark: true,
    features: [
      '3 documentos al mes',
      '1 firmante por documento',
      '1 zona de firma',
      'Firma manuscrita básica',
      'Marca de agua SignFlow',
      'Código de acceso único'
    ]
  },
  {
    id: 'pro',
    label: 'Pro',
    price: 7.99,
    priceLabel: '$7.99/mes',
    docsLimit: 50,
    maxSigners: 10,
    maxZones: 10,
    watermark: false,
    lemonPlanId: 'pro',
    lemonVariantId: 'monthly',
    features: [
      '50 documentos al mes',
      'Hasta 10 firmantes',
      'Hasta 10 zonas de firma',
      'Firma manuscrita + tipográfica',
      'Sin marca de agua',
      'Historial completo',
      'PDF básico descargable',
      'Soporte por email'
    ]
  },
  {
    id: 'business',
    label: 'Business',
    price: 15.00,
    priceLabel: '$15/mes',
    docsLimit: -1,
    maxSigners: -1,
    maxZones: -1,
    watermark: false,
    lemonPlanId: 'business',
    lemonVariantId: 'monthly',
    features: [
      'Documentos ilimitados',
      'Firmantes ilimitados',
      'Zonas de firma ilimitadas',
      'Multi-usuarios (equipos)',
      'API access',
      'Branding personalizado',
      'Plantillas de documentos',
      'Roles y permisos',
      'Audit trail completo',
      'Soporte prioritario'
    ]
  },
  {
    id: 'payperuse',
    label: 'Pay Per Use',
    price: 0,
    priceLabel: 'Desde $0.50/doc',
    docsLimit: -1,
    maxSigners: -1,
    maxZones: -1,
    watermark: false,
    features: [
      'Paga solo lo que usas',
      '$0.50 - $1 por documento',
      'Firmantes ilimitados',
      'Zonas de firma ilimitadas',
      'Sin marca de agua',
      'Sin suscripción mensual',
      'Recarga de créditos',
      'Ideal para uso esporádico'
    ]
  }
];

export function getPlan(planId: PlanType): Plan {
  return PLANS.find(p => p.id === planId) || PLANS[0];
}

export function getSignZone(doc: Document): { page: number; x: number; y: number; w: number; h: number; scale: number } | null {
  if (doc.sign_zone_page === undefined || doc.sign_zone_page === null) return null;
  return {
    page: doc.sign_zone_page,
    x: doc.sign_zone_x || 0,
    y: doc.sign_zone_y || 0,
    w: doc.sign_zone_w || 0,
    h: doc.sign_zone_h || 0,
    scale: doc.sign_zone_scale || 1.5
  };
}
