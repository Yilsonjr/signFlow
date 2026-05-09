# Lemon Squeezy Setup - SignFlow

## Configuracion de Lemon Squeezy para suscripciones y pagos

### 1. Crear cuenta en Lemon Squeezy

1. Ve a [lemonsqueezy.com](https://www.lemonsqueezy.com) y crea una cuenta
2. Configura tu tienda con nombre, moneda (USD) y datos fiscales

### 2. Crear Productos y Variants

En el dashboard de Lemon Squeezy, crea los siguientes productos:

#### Plan Pro ($7.99/mes)
- Product: "SignFlow Pro"
- Type: Subscription
- Price: $7.99/mes
- Billing cycle: Monthly
- Anota el **Product ID** y **Variant ID** (los necesitaras en el admin)

#### Plan Business ($15/mes)
- Product: "SignFlow Business"
- Type: Subscription
- Price: $15/mes
- Billing cycle: Monthly
- Anota el **Product ID** y **Variant ID**

#### Pay Per Use (Creditos)
- Product: "SignFlow Creditos"
- Type: One-time payment
- Crea variants para cada monto:
  - $5 creditos (~6 docs) - Variant ID
  - $10 creditos (~13 docs) - Variant ID
  - $25 creditos (~33 docs) - Variant ID
- Anota los **Variant IDs**

### 3. Obtener API Key y Store ID

1. Ve a **Settings > API** en Lemon Squeezy
2. Genera una nueva API Key
3. Copia tu **Store ID** desde el dashboard
4. Estos datos van en la pestana "Lemon Squeezy" del panel admin

### 4. Configurar Webhook

1. Ve a **Settings > Webhooks** en Lemon Squeezy
2. Crea un nuevo webhook apuntando a tu Supabase Edge Function:
   ```
   https://tu-proyecto.supabase.co/functions/v1/lemon-webhook
   ```
3. Selecciona los eventos:
   - `subscription_created`
   - `subscription_updated`
   - `subscription_cancelled`
   - `subscription_expired`
   - `subscription_payment_success`
   - `order_created`
4. Copia el **Webhook Secret** y ponlo en el admin panel

### 5. Configurar en el Panel Admin

1. Ve a `/admin` en tu app
2. En la pestana "Lemon Squeezy":
   - Pega tu API Key
   - Pega tu Store ID
   - Pega tu Webhook Secret
   - Selecciona Test o Live
3. En la pestana "Precios":
   - Para cada plan, introduce el Product ID y Variant ID de Lemon Squeezy

### 6. Desplegar la Supabase Edge Function

La Edge Function que procesa los webhooks esta en `supabase/functions/lemon-webhook/`.

Para desplegar:
```bash
supabase functions deploy lemon-webhook
```

### 7. Probar la Integracion

1. Usa el entorno **Test** primero
2. Lemon Squeezy provee tarjetas de prueba para test mode
3. Verifica que los webhooks se reciben correctamente en Supabase logs
4. Una vez probado, cambia a **Live**

### Estructura de Datos

Los IDs de Lemon Squeezy se almacenan en:
- `lemon_config` - Configuracion de API (api_key, store_id, webhook_secret, environment)
- `pricing_configs` - Por cada plan: `lemon_product_id` y `lemon_variant_id`
- `users` - `lemon_subscription_id` para rastrear la suscripcion activa

### Webhook Events

La Edge Function maneja estos eventos:

| Evento | Accion |
|--------|--------|
| `subscription_created` | Activar plan del usuario |
| `subscription_payment_success` | Renovar suscripcion |
| `subscription_cancelled` | Marcar para cancelacion al fin de periodo |
| `subscription_expired` | Bajar a plan Free |
| `subscription_payment_failed` | Marcar como past_due |
| `order_created` | Agregar creditos para Pay Per Use |

### Planes Definidos

| Plan | Precio | Tipo | Limites |
|------|--------|------|---------|
| Free | $0 | - | 3 docs/mes, 1 firmante, 1 zona |
| Pro | $7.99/mes | Subscription | 50 docs/mes, 10 firmantes, 10 zonas |
| Business | $15/mes | Subscription | Ilimitado |
| Pay Per Use | Desde $0.50/doc | One-time | Ilimitado (con creditos) |