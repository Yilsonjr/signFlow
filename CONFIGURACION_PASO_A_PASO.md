# Configurar Supabase + Lemon Squeezy - Guia Paso a Paso

Sigue estos pasos en orden. No saltes ninguno.

---

## PASO 1: Crear tablas en Supabase

1. Ve a [supabase.com](https://supabase.com) y abre tu proyecto
2. En el menu lateral izquierdo, haz clic en **SQL Editor**
3. Haz clic en **New Query** (o el boton "+")
4. Copia **TODO el contenido** del archivo `supabase/setup-database.sql`
5. Pegalo en el editor
6. Haz clic en **Run** (o presiona Ctrl+Enter)
7. Deberias ver el mensaje: `"SignFlow + Lemon Squeezy setup completado!"`

### Que se crea:

| Tabla | Columnas clave |
|-------|---------------|
| `users` | `plan`, `lemon_subscription_id`, `subscription_status`, `pay_per_use_credits` |
| `documents` | PDFs subidos con zonas de firma |
| `signers` | Firmantes de documentos |
| `audit_logs` | Registro de actividad |
| `pricing_configs` | `plan`, `price`, `lemon_product_id`, `lemon_variant_id` |
| `lemon_config` | `api_key`, `store_id`, `webhook_secret`, `environment` |

> Si ya tenias tablas de PayPal, el SQL migra `paypal_subscription_id` a `lemon_subscription_id` y elimina `paypal_config`.

---

## PASO 2: Crear Storage Bucket

1. En el menu lateral de Supabase, haz clic en **Storage**
2. Haz clic en **New Bucket**
3. Configura:
   - **Name**: `documents`
   - **Public**: **NO** (desmarcado)
4. Haz clic en **Create Bucket**
5. Una vez creado, haz clic en el bucket `documents`
6. En la pestana **Configuration**:
   - **Allowed MIME types**: `application/pdf`
   - **Max file size**: `10485760` (10MB)

---

## PASO 3: Crear cuenta en Lemon Squeezy

1. Ve a [lemonsqueezy.com](https://www.lemonsqueezy.com) y crea una cuenta
2. Crea tu tienda (Store)
3. **Anota tu Store ID** (lo encuentras en Settings > Store)
4. En **Settings > API**, genera una API Key y copiala

---

## PASO 4: Crear productos en Lemon Squeezy

Ve a **Products** en tu dashboard de Lemon Squeezy y crea estos productos:

### 4.1 Plan Pro ($7.99/mes)
1. **New Product**
2. Nombre: `SignFlow Pro`
3. Descripcion: `Plan Pro - 50 docs/mes, 10 firmantes, sin marca de agua`
4. Tipo: **Subscription**
5. Precio: `$7.99/month`
6. Moneda: `USD`
7. Guarda el producto
8. **Anota el Product ID y Variant ID** de la URL

### 4.2 Plan Business ($15/mes)
1. **New Product**
2. Nombre: `SignFlow Business`
3. Descripcion: `Plan Business - Docs ilimitados, firmantes ilimitados, API access`
4. Tipo: **Subscription**
5. Precio: `$15.00/month`
6. **Anota el Product ID y Variant ID**

### 4.3 Pay Per Use - $5 creditos
1. **New Product**
2. Nombre: `SignFlow Creditos $5`
3. Tipo: **One-time payment**
4. Precio: `$5.00`
5. **Anota el Variant ID**

### 4.4 Pay Per Use - $10 creditos
1. **New Product**
2. Nombre: `SignFlow Creditos $10`
3. Tipo: **One-time payment**
4. Precio: `$10.00`
5. **Anota el Variant ID**

### 4.5 Pay Per Use - $25 creditos
1. **New Product**
2. Nombre: `SignFlow Creditos $25`
3. Tipo: **One-time payment**
4. Precio: `$25.00`
5. **Anota el Variant ID**

> **Donde encontrar los IDs?** En Lemon Squeezy, ve a Products > haz clic en el producto > la URL tiene el ID. El Variant ID esta en la pestana de variants.

---

## PASO 5: Configurar Webhook en Lemon Squeezy

1. Ve a **Settings > Webhooks** en Lemon Squeezy
2. Haz clic en **Create Webhook**
3. **Callback URL**: `https://TU-PROYECTO-REF.supabase.co/functions/v1/lemon-webhook`
   - Reemplaza `TU-PROYECTO-REF` con tu Project Reference de Supabase
   - Lo encuentras en: Supabase Dashboard > Settings > General > Reference ID
4. **Events** a seleccionar (marca todos estos):
   - `subscription_created`
   - `subscription_updated`
   - `subscription_cancelled`
   - `subscription_expired`
   - `subscription_paused`
   - `subscription_resumed`
   - `subscription_payment_success`
   - `subscription_payment_failed`
   - `order_created`
5. Haz clic en **Save**
6. **Copia el Signing Secret** (webhook secret) - lo necesitaras en los siguientes pasos

---

## PASO 6: Desplegar la Edge Function (Webhook)

### 6.1 Instalar Supabase CLI (si no lo tienes)
```bash
npm install -g supabase
```

### 6.2 Login y vincular proyecto
```bash
supabase login
supabase link --project-ref TU-PROJECT-REF
```

### 6.3 Desplegar la Edge Function
```bash
supabase functions deploy lemon-webhook
```

### 6.4 Configurar secrets de la Edge Function
```bash
supabase secrets set LEMONSQUEEZY_WEBHOOK_SECRET=el-signing-secret-que-copiaste
```

> Los secrets `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` ya estan disponibles automaticamente en las Edge Functions.

### 6.5 Verificar el despliegue
```bash
supabase functions list
```
Deberias ver `lemon-webhook` en la lista.

---

## PASO 7: Configurar en el Panel Admin de SignFlow

1. Inicia tu app: `npm start`
2. Inicia sesion con un usuario administrador
   - Si tu usuario no es admin, puedes cambiar el rol en Supabase:
     - Ve a **Table Editor > users**
     - Busca tu usuario
     - Cambia `role` de `user` a `admin`
3. Ve a `/admin` en tu navegador
4. En la pestana **Lemon Squeezy**:
   - **API Key**: pega tu API Key de Lemon Squeezy
   - **Store ID**: pega tu Store ID
   - **Webhook Secret**: pega el Signing Secret del webhook
   - **Environment**: selecciona `test` (para pruebas) o `live` (para produccion)
   - Haz clic en **Guardar Configuracion**
5. En la pestana **Precios**:
   - Para cada plan (Pro, Business):
     - **Precio mensual**: 7.99 / 15.00
     - **Lemon Squeezy Product ID**: pega el ID del producto
     - **Lemon Squeezy Variant ID**: pega el ID de la variante
   - Haz clic en **Actualizar Precio** para cada uno

---

## PASO 8: Probar la integracion

### 8.1 Modo Test
1. En Lemon Squeezy, asegurate de estar en **Test Mode** (toggle en el dashboard)
2. Ve a tu app > `/pricing`
3. Haz clic en **Actualizar a Pro**
4. Deberia abrirse el overlay de checkout de Lemon Squeezy
5. Usa una tarjeta de prueba (Lemon Squeezy te da numeros de prueba)
6. Completa el pago de prueba
7. Verifica en Supabase **Table Editor > users** que:
   - `plan` = `pro`
   - `lemon_subscription_id` tiene un valor
   - `subscription_status` = `active`

### 8.2 Verificar webhook
1. En Supabase: **Logs > Edge Function Logs**
2. Busca entradas de `lemon-webhook`
3. Desde Lemon Squeezy puedes enviar eventos de prueba: **Settings > Webhooks > Send test event**

### 8.3 Probar cancelacion
1. Ve a `/pricing`
2. Haz clic en **Bajar a Free**
3. Verifica que `plan` cambia a `free` y `lemon_subscription_id` se borra

---

## Estructura de la base de datos

### Tabla `users`

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| `id` | UUID | ID unico (viene de auth.users) |
| `user_id` | UUID | Referencia a auth.users |
| `email` | TEXT | Email del usuario |
| `name` | TEXT | Nombre |
| `plan` | TEXT | 'free', 'pro', 'business', 'payperuse' |
| `role` | TEXT | 'user' o 'admin' |
| `docs_used` | INTEGER | Documentos usados en el periodo |
| `reset_date` | TIMESTAMPTZ | Fecha de reset del contador |
| `lemon_subscription_id` | TEXT | ID de suscripcion de Lemon Squeezy |
| `subscription_status` | TEXT | 'active', 'cancelled', 'past_due', 'expired', 'paused' |
| `subscription_end_date` | TIMESTAMPTZ | Fecha de vencimiento |
| `pay_per_use_credits` | DECIMAL | Creditos disponibles para PPU |

### Tabla `pricing_configs`

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| `plan` | TEXT (UNIQUE) | 'pro' o 'business' |
| `price` | DECIMAL | Precio mensual |
| `lemon_product_id` | TEXT | ID del producto en Lemon Squeezy |
| `lemon_variant_id` | TEXT | ID de la variante en Lemon Squeezy |
| `is_active` | BOOLEAN | Plan activo |
| `updated_by` | TEXT | Quien actualizo |

### Tabla `lemon_config`

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| `api_key` | TEXT | API Key de Lemon Squeezy |
| `store_id` | TEXT | Store ID |
| `webhook_secret` | TEXT | Signing Secret del webhook |
| `environment` | TEXT | 'test' o 'live' |
| `updated_by` | TEXT | Quien actualizo |

---

## Troubleshooting

| Problema | Solucion |
|----------|----------|
| Error: "relation public.users does not exist" | Ejecuta el SQL completo del PASO 1 |
| Error: "producto no configurado" | Configura Product ID y Variant ID en /admin > Precios |
| Error: "Error abriendo checkout" | Verifica que el Lemon Squeezy SDK carga en la consola del navegador |
| Webhook no recibe eventos | Verifica la URL del webhook en Lemon Squeezy, los secrets, y que la Edge Function esta desplegada |
| Suscripcion no se activa | Revisa los logs del webhook en Supabase Dashboard > Logs > Edge Function Logs |
| No puedo acceder a /admin | Cambia tu role a `admin` en Table Editor > users |
| Error: column "lemon_subscription_id" no existe | Re-ejecuta el SQL del PASO 1 (migra automaticamente) |