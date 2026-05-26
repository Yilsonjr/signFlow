# SignFlow v2.0 — Angular 21

**Firma digital de documentos, sin reuniones ni impresoras.**

SaaS de firma digital con múltiples firmantes, múltiples zonas de firma por página, planes de suscripción y verificación de integridad por SHA-256.

---

## 🚀 Características

- **Múltiples firmantes** — Asigna zonas de firma independientes a cada firmante
- **Múltiples zonas por página** — Define varias áreas en un mismo documento
- **Firma manuscrita y tipográfica** — Canvas libre o fuentes elegantes
- **Hash SHA-256** — Verificación de integridad del documento original y firmado
- **Audit trail** — Registro completo de aperturas, firmas y descargas
- **Planes de suscripción** — Free · Pro · Business · Pay-per-use via Lemon Squeezy
- **Admin panel** — Gestión de usuarios, planes y configuración de pagos

---

## 📦 Stack Técnico

| Capa | Tecnología |
|------|-----------|
| Framework | Angular 21 (standalone components, signals) |
| UI | Bootstrap 5 + SCSS |
| PDF Render | PDF.js 5 |
| PDF Edición | pdf-lib 1.17 |
| Backend / Auth / Storage | Supabase |
| Pagos | Lemon Squeezy |
| Deploy | Vercel |

---

## 🛠️ Instalación local

```bash
# 1. Clonar e instalar
git clone https://github.com/Yilsonjr/signFlow.git
cd signFlow
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores reales (ver sección Variables de entorno)

# 3. Ejecutar en desarrollo (genera environment.ts automáticamente)
npm start
```

---

## 🔑 Variables de entorno

Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:

```env
SUPABASE_URL=https://<tu-project>.supabase.co
SUPABASE_ANON_KEY=<tu-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<tu-service-role-key>
LEMON_SQUEEZY_API_KEY=<tu-api-key>
```

> **Vercel:** configura estas variables en **Settings → Environment Variables**. El build las leerá automáticamente.
>
> **Local:** el script `scripts/generate-env.js` lee `.env` y genera `src/environments/environment.ts` antes de cada build/serve.

---

## 🗄️ Configuración de Supabase

### Tablas necesarias

**users**
```sql
id uuid primary key references auth.users
email text
name text
role text default 'user'         -- 'user' | 'admin'
plan text default 'free'         -- 'free' | 'pro' | 'business' | 'pay_per_use'
docs_used integer default 0
docs_limit integer default 3
reset_date timestamptz
subscription_id text
subscription_status text
credits integer default 0
created_at timestamptz default now()
```

**documents**
```sql
id uuid primary key default gen_random_uuid()
user_id uuid references users(id)
file_name text
file_size integer
file_type text
file_id text
doc_code text unique
status text default 'pending'    -- 'pending' | 'partial' | 'signed'
sign_zones jsonb
original_hash text
signed_file_id text
signed_at timestamptz
created_at timestamptz default now()
```

**signers**
```sql
id uuid primary key default gen_random_uuid()
doc_id uuid references documents(id)
signer_name text
signer_email text
zone_index integer
code text unique
status text default 'pending'    -- 'pending' | 'signed'
signature_data text
signed_file_id text
signed_at timestamptz
```

**audit_logs**
```sql
id uuid primary key default gen_random_uuid()
doc_id uuid references documents(id)
action text
actor text
metadata jsonb
created_at timestamptz default now()
```

**pricing_configs**
```sql
id uuid primary key default gen_random_uuid()
plan text unique
price numeric
docs_limit integer
signers_limit integer
zones_limit integer
has_watermark boolean
```

**lemon_config**
```sql
id uuid primary key default gen_random_uuid()
api_key text
store_id text
webhook_secret text
environment text default 'test'
pro_product_id text
pro_variant_id text
business_product_id text
business_variant_id text
```

### Row Level Security (RLS)

Activar RLS en todas las tablas. Políticas mínimas recomendadas:

- **users**: el usuario solo puede leer/editar su propia fila (`auth.uid() = id`)
- **documents**: el propietario puede CRUD; cualquiera puede leer por `doc_code`
- **signers**: cualquiera puede leer/actualizar por su `code` único
- **audit_logs**: solo escritura desde el servicio (service role)
- **pricing_configs / lemon_config**: solo lectura pública; escritura solo admin

---

## 💳 Configuración de Lemon Squeezy

1. Crear cuenta en [app.lemonsqueezy.com](https://app.lemonsqueezy.com)
2. Crear una tienda y dos productos (Plan Pro y Plan Business)
3. Anotar los **Product IDs** y **Variant IDs** de cada plan
4. Crear un webhook apuntando a tu función de Supabase Edge:
   ```
   https://<project>.supabase.co/functions/v1/lemon-webhook
   ```
5. Anotar el **Webhook Signing Secret**
6. Desde el Admin Panel de SignFlow (`/admin`), guardar la configuración de Lemon Squeezy

### Planes y precios

| Plan | Precio | Docs/mes | Firmantes | Zonas |
|------|--------|----------|-----------|-------|
| Free | Gratis | 3 | 1 | 1 |
| Pro | $7.99/mes | 50 | 10 | 10 |
| Business | $15/mes | Ilimitado | Ilimitado | Ilimitado |
| Pay-per-use | $0.75/doc | — | — | — |

---

## 🚀 Deploy en Vercel

```bash
# Instalar Vercel CLI (si no lo tienes)
npm i -g vercel

# Deploy a producción
vercel --prod
```

O conecta el repositorio directamente desde el dashboard de Vercel. El `buildCommand` está configurado en `vercel.json`.

---

## 📝 Cambios desde v1.0

- ✅ Reescrita completamente en Angular 21
- ✅ Standalone components (sin NgModules)
- ✅ Signals para estado reactivo
- ✅ Lazy loading de rutas
- ✅ Guards de autenticación y roles
- ✅ Múltiples firmantes por documento
- ✅ Múltiples zonas de firma por página
- ✅ Firma tipográfica con fuentes elegantes
- ✅ Migrado de Appwrite a **Supabase**
- ✅ Migrado de PayPal/Stripe a **Lemon Squeezy**
- ✅ Hash SHA-256 para integridad del documento
- ✅ Audit trail completo
- ✅ Admin panel con gestión de usuarios y pagos
- ✅ Variables de entorno seguras (sin credenciales en el código)

---

## 📄 Licencia

MIT
