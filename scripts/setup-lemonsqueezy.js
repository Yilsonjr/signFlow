#!/usr/bin/env node

/**
 * Setup script para Lemon Squeezy - SignFlow
 * 
 * Crea los productos y variants en Lemon Squeezy via API
 * 
 * Uso:
 *   node scripts/setup-lemonsqueezy.js
 * 
 * Requiere las siguientes variables de entorno:
 *   LEMONSQUEEZY_API_KEY - Tu API key de Lemon Squeezy
 *   LEMONSQUEEZY_STORE_ID - Tu Store ID
 */

const LEMON_API = 'https://api.lemonsqueezy.com/v1';

async function apiRequest(endpoint, method = 'GET', body = null) {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) {
    console.error('Error: LEMONSQUEEZY_API_KEY no esta configurada');
    process.exit(1);
  }

  const options = {
    method,
    headers: {
      'Accept': 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      'Authorization': `Bearer ${apiKey}`
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${LEMON_API}${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) {
    console.error(`Error en ${method} ${endpoint}:`, data);
    throw new Error(`API Error: ${response.status}`);
  }

  return data;
}

async function createStoreProduct(name, description, price, type = 'subscription', interval = 'month') {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  if (!storeId) {
    console.error('Error: LEMONSQUEEZY_STORE_ID no esta configurado');
    process.exit(1);
  }

  const priceInCents = Math.round(price * 100);

  const body = {
    data: {
      type: 'products',
      attributes: {
        name,
        description,
        status: 'published',
        store_id: parseInt(storeId)
      }
    }
  };

  const product = await apiRequest('/products', 'POST', body);
  const productId = product.data.id;
  const productSlug = product.data.attributes.slug;

  console.log(`Producto creado: ${name} (ID: ${productId})`);

  const variantBody = {
    data: {
      type: 'variants',
      attributes: {
        name: type === 'subscription' ? `Plan ${name} - Mensual` : name,
        price: priceInCents,
        is_license: false,
        interval: type === 'subscription' ? interval : null,
        interval_count: type === 'subscription' ? 1 : null,
        type,
        status: 'published'
      },
      relationships: {
        product: {
          data: {
            type: 'products',
            id: productId
          }
        }
      }
    }
  };

  const variant = await apiRequest('/variants', 'POST', variantBody);
  const variantId = variant.data.id;

  console.log(`Variant creada: Plan ${name} (ID: ${variantId})`);

  return { productId, variantId };
}

async function main() {
  console.log('=== Setup Lemon Squeezy - SignFlow ===\n');

  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;

  if (!apiKey || !storeId) {
    console.error('Configura las variables de entorno:');
    console.error('  LEMONSQUEEZY_API_KEY=tu-api-key');
    console.error('  LEMONSQUEEZY_STORE_ID=tu-store-id\n');
    console.error('Ejemplo:');
    console.error('  LEMONSQUEEZY_API_KEY=abc123 LEMONSQUEEZY_STORE_ID=12345 node scripts/setup-lemonsqueezy.js');
    process.exit(1);
  }

  console.log(`Usando Store ID: ${storeId}\n`);

  try {
    console.log('--- Creando Plan Pro ---');
    const pro = await createStoreProduct(
      'SignFlow Pro',
      'Plan Pro de SignFlow - 50 documentos al mes, hasta 10 firmantes, sin marca de agua',
      7.99,
      'subscription'
    );

    console.log('\n--- Creando Plan Business ---');
    const business = await createStoreProduct(
      'SignFlow Business',
      'Plan Business de SignFlow - Documentos ilimitados, firmantes ilimitados, API access, branding personalizado',
      15.00,
      'subscription'
    );

    console.log('\n--- Creando Creditos Pay Per Use ($5) ---');
    const credits5 = await createStoreProduct(
      'SignFlow Creditos $5',
      'Creditos prepago para firmar documentos. Aproximadamente 6 documentos.',
      5.00,
      'one_time'
    );

    console.log('\n--- Creando Creditos Pay Per Use ($10) ---');
    const credits10 = await createStoreProduct(
      'SignFlow Creditos $10',
      'Creditos prepago para firmar documentos. Aproximadamente 13 documentos.',
      10.00,
      'one_time'
    );

    console.log('\n--- Creando Creditos Pay Per Use ($25) ---');
    const credits25 = await createStoreProduct(
      'SignFlow Creditos $25',
      'Creditos prepago para firmar documentos. Aproximadamente 33 documentos.',
      25.00,
      'one_time'
    );

    console.log('\n=== Setup completado! ===\n');
    console.log('Configura estos IDs en el panel admin de SignFlow:\n');
    console.log('Plan Pro:');
    console.log(`  Product ID: ${pro.productId}`);
    console.log(`  Variant ID: ${pro.variantId}`);
    console.log('\nPlan Business:');
    console.log(`  Product ID: ${business.productId}`);
    console.log(`  Variant ID: ${business.variantId}`);
    console.log('\nPay Per Use $5:');
    console.log(`  Product ID: ${credits5.productId}`);
    console.log(`  Variant ID: ${credits5.variantId}`);
    console.log('\nPay Per Use $10:');
    console.log(`  Product ID: ${credits10.productId}`);
    console.log(`  Variant ID: ${credits10.variantId}`);
    console.log('\nPay Per Use $25:');
    console.log(`  Product ID: ${credits25.productId}`);
    console.log(`  Variant ID: ${credits25.variantId}`);
    console.log('\nNo olvides configurar el webhook en Lemon Squeezy apuntando a:');
    console.log('  https://tu-proyecto.supabase.co/functions/v1/lemon-webhook');

  } catch (error) {
    console.error('\nError durante el setup:', error.message);
    process.exit(1);
  }
}

main();