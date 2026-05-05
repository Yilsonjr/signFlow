-- ============================================================
-- SignFlow + Lemon Squeezy - Setup Completo de Base de Datos
-- ============================================================
-- Ejecutar TODO este SQL en el SQL Editor de Supabase
-- (Dashboard > SQL Editor > New Query > pegar todo > Run)
--
-- Este script es IDEMPOTENTE: se puede ejecutar varias veces
-- sin errores. Primero crea tablas, luego migra columnas
-- viejas de PayPal si existen, luego crea indices, RLS, etc.
-- ============================================================

-- ============================================================
-- PASO 1: CREAR TODAS LAS TABLAS
-- (CREATE TABLE IF NOT EXISTS es seguro de correr siempre)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'business', 'payperuse')),
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  docs_used INTEGER DEFAULT 0,
  reset_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month'),
  lemon_subscription_id TEXT,
  subscription_status TEXT,
  subscription_end_date TIMESTAMPTZ,
  pay_per_use_credits DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  file_id TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'signed', 'cancelled')),
  sign_zone_x DECIMAL(10,2),
  sign_zone_y DECIMAL(10,2),
  sign_zone_w DECIMAL(10,2),
  sign_zone_h DECIMAL(10,2),
  sign_zone_page INTEGER,
  sign_zone_scale DECIMAL(5,2) DEFAULT 1.5,
  signature_data TEXT,
  signed_file_id TEXT,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.signers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doc_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  signer_name TEXT NOT NULL,
  signer_email TEXT,
  zone_index INTEGER NOT NULL,
  code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'cancelled')),
  signed_file_id TEXT,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doc_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  details TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pricing_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan TEXT NOT NULL UNIQUE,
  price DECIMAL(10,2) NOT NULL,
  lemon_product_id TEXT,
  lemon_variant_id TEXT,
  currency TEXT DEFAULT 'USD',
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  updated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lemon_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key TEXT NOT NULL,
  store_id TEXT NOT NULL,
  webhook_secret TEXT NOT NULL,
  environment TEXT DEFAULT 'test' CHECK (environment IN ('test', 'live')),
  updated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PASO 2: MIGRAR COLUMNAS VIEJAS DE PAYPAL (SI EXISTEN)
-- Ahora si las tablas ya fueron creadas arriba, es seguro
-- hacer ALTER TABLE
-- ============================================================

-- Migrar paypal_subscription_id -> lemon_subscription_id
DO $$
BEGIN
  -- Agregar lemon_subscription_id si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'lemon_subscription_id'
  ) THEN
    ALTER TABLE public.users ADD COLUMN lemon_subscription_id TEXT;
  END IF;

  -- Copiar datos de paypal_subscription_id a lemon_subscription_id si la columna vieja existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'paypal_subscription_id'
  ) THEN
    UPDATE public.users
    SET lemon_subscription_id = paypal_subscription_id
    WHERE lemon_subscription_id IS NULL AND paypal_subscription_id IS NOT NULL;

    ALTER TABLE public.users DROP COLUMN paypal_subscription_id;
  END IF;

  -- Agregar columnas faltantes en users si no existen (para tablas creadas anteriormente sin estas columnas)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE public.users ADD COLUMN subscription_status TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'subscription_end_date'
  ) THEN
    ALTER TABLE public.users ADD COLUMN subscription_end_date TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'pay_per_use_credits'
  ) THEN
    ALTER TABLE public.users ADD COLUMN pay_per_use_credits DECIMAL(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'plan'
  ) THEN
    ALTER TABLE public.users ADD COLUMN plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'business', 'payperuse'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.users ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'docs_used'
  ) THEN
    ALTER TABLE public.users ADD COLUMN docs_used INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'reset_date'
  ) THEN
    ALTER TABLE public.users ADD COLUMN reset_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month');
  END IF;

  -- Migrar paypal_plan_id en pricing_configs si existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pricing_configs' AND column_name = 'paypal_plan_id'
  ) THEN
    -- Copiar datos si lemon_variant_id no tiene valor
    UPDATE public.pricing_configs
    SET lemon_variant_id = paypal_plan_id
    WHERE lemon_variant_id IS NULL AND paypal_plan_id IS NOT NULL;

    ALTER TABLE public.pricing_configs DROP COLUMN paypal_plan_id;
  END IF;

  -- Agregar lemon_product_id y lemon_variant_id a pricing_configs si no existen
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pricing_configs' AND column_name = 'lemon_product_id'
  ) THEN
    ALTER TABLE public.pricing_configs ADD COLUMN lemon_product_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pricing_configs' AND column_name = 'lemon_variant_id'
  ) THEN
    ALTER TABLE public.pricing_configs ADD COLUMN lemon_variant_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pricing_configs' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE public.pricing_configs ADD COLUMN updated_by TEXT;
  END IF;
END $$;

-- Eliminar tabla vieja paypal_config si existe
DROP TABLE IF EXISTS public.paypal_config CASCADE;

-- ============================================================
-- PASO 3: INDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_documents_owner_id ON public.documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_code ON public.documents(code);
CREATE INDEX IF NOT EXISTS idx_signers_doc_id ON public.signers(doc_id);
CREATE INDEX IF NOT EXISTS idx_signers_code ON public.signers(code);
CREATE INDEX IF NOT EXISTS idx_audit_logs_doc_id ON public.audit_logs(doc_id);
CREATE INDEX IF NOT EXISTS idx_users_lemon_subscription ON public.users(lemon_subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_plan ON public.users(plan);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ============================================================
-- PASO 4: HABILITAR RLS (Row Level Security)
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lemon_config ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PASO 5: POLITICAS RLS (usar DROP + CREATE para evitar duplicados)
-- ============================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Documents
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
CREATE POLICY "Users can view own documents" ON public.documents
  FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can create own documents" ON public.documents;
CREATE POLICY "Users can create own documents" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
CREATE POLICY "Users can update own documents" ON public.documents
  FOR UPDATE USING (auth.uid() = owner_id);

-- Signers
DROP POLICY IF EXISTS "Users can view signers of own documents" ON public.signers;
CREATE POLICY "Users can view signers of own documents" ON public.signers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.documents WHERE id = doc_id AND owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create signers for own documents" ON public.signers;
CREATE POLICY "Users can create signers for own documents" ON public.signers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.documents WHERE id = doc_id AND owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update signers of own documents" ON public.signers;
CREATE POLICY "Users can update signers of own documents" ON public.signers
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.documents WHERE id = doc_id AND owner_id = auth.uid())
  );

-- Audit logs
DROP POLICY IF EXISTS "Users can view audit logs of own documents" ON public.audit_logs;
CREATE POLICY "Users can view audit logs of own documents" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.documents WHERE id = doc_id AND owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create audit logs for own documents" ON public.audit_logs;
CREATE POLICY "Users can create audit logs for own documents" ON public.audit_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.documents WHERE id = doc_id AND owner_id = auth.uid())
  );

-- Admins: pricing_configs y lemon_config
DROP POLICY IF EXISTS "Admins can manage pricing configs" ON public.pricing_configs;
CREATE POLICY "Admins can manage pricing configs" ON public.pricing_configs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can manage lemon config" ON public.lemon_config;
CREATE POLICY "Admins can manage lemon config" ON public.lemon_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- PASO 6: FUNCIONES Y TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_signers_updated_at ON public.signers;
CREATE TRIGGER update_signers_updated_at BEFORE UPDATE ON public.signers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pricing_configs_updated_at ON public.pricing_configs;
CREATE TRIGGER update_pricing_configs_updated_at BEFORE UPDATE ON public.pricing_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lemon_config_updated_at ON public.lemon_config;
CREATE TRIGGER update_lemon_config_updated_at BEFORE UPDATE ON public.lemon_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-crear perfil de usuario al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, user_id, email, name)
  VALUES (NEW.id, NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- PASO 7: INSERTAR PRECIOS POR DEFECTO
-- ============================================================

INSERT INTO public.pricing_configs (plan, price, currency, features, is_active, updated_by)
VALUES
  ('pro', 7.99, 'USD', '{"docs_limit": 50, "signers_limit": 10, "zones_limit": 10}', true, 'system'),
  ('business', 15.00, 'USD', '{"docs_limit": -1, "signers_limit": -1, "zones_limit": -1}', true, 'system')
ON CONFLICT (plan) DO UPDATE SET
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active;

-- ============================================================
-- PASO 8: CREAR BUCKET DE STORAGE
-- Los buckets de Storage no se pueden crear via SQL.
-- Ve a: Dashboard > Storage > New Bucket
-- Nombre: documents | Public: OFF | MIME: application/pdf | Max: 10MB
-- ============================================================

-- ============================================================
-- RESULTADO
-- ============================================================
SELECT 'SignFlow + Lemon Squeezy setup completado!' AS resultado;