#!/usr/bin/env node

/**
 * Setup de Supabase para SignFlow + Lemon Squeezy
 *
 * FORMA RECOMENDADA: Ejecutar el SQL directamente en Supabase SQL Editor
 *   Ve a: Dashboard > SQL Editor > New Query
 *   Pega el contenido de: supabase/setup-database.sql
 *   Haz clic en Run
 *
 * Este script Node.js es una alternativa si prefieres la terminal.
 *
 * USO:
 *   node scripts/setup-supabase.js
 *
 * Asegurate de tener configuradas las variables de entorno en .env
 */

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en tu archivo .env');
  console.error('');
  console.error('Ejemplo:');
  console.error('  SUPABASE_URL=https://tu-proyecto.supabase.co');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('SignFlow + Lemon Squeezy - Setup de Supabase');
  console.log('=============================================\n');

  console.log('NOTA: Se recomienda usar el SQL Editor de Supabase directamente.');
  console.log('      Ve a Dashboard > SQL Editor > New Query');
  console.log('      Pega el contenido de: supabase/setup-database.sql\n');

  console.log('Leyendo script SQL...');

  const sqlPath = path.join(__dirname, '..', 'supabase', 'setup-database.sql');

  if (!fs.existsSync(sqlPath)) {
    console.error('Error: No se encuentra supabase/setup-database.sql');
    console.error('Asegurate de que el archivo existe.');
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Ejecutando SQL...\n');

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Si exec_sql no existe, dar instrucciones manuales
      console.log('No se puede ejecutar SQL directamente via RPC.');
      console.log('');
      console.log('INSTRUCCIONES MANUALES:');
      console.log('1. Ve a https://supabase.com/dashboard');
      console.log('2. Abre tu proyecto');
      console.log('3. En el menu lateral, haz clic en SQL Editor');
      console.log('4. Haz clic en New Query');
      console.log('5. Copia y pega el contenido de supabase/setup-database.sql');
      console.log('6. Haz clic en Run (Ctrl+Enter)');
      console.log('');
      console.log('Archivo SQL: ' + sqlPath);
      return;
    }

    console.log('Tablas creadas exitosamente.');
  } catch (err) {
    console.log('Ejecutando SQL por partes...\n');

    // Alternative: try executing via the REST API
    // Most Supabase projects don't allow direct SQL execution via the JS client
    console.log('No se puede ejecutar SQL directamente via el cliente JS.');
    console.log('');
    console.log('INSTRUCCIONES MANUALES:');
    console.log('1. Ve a https://supabase.com/dashboard');
    console.log('2. Abre tu proyecto');
    console.log('3. En el menu lateral, haz clic en SQL Editor');
    console.log('4. Haz clic en New Query');
    console.log('5. Copia y pega el contenido de supabase/setup-database.sql');
    console.log('6. Haz clic en Run (Ctrl+Enter)');
    console.log('');
    console.log('Archivo SQL: ' + sqlPath);
  }

  // Crear bucket de storage
  try {
    console.log('\nCreando bucket de storage "documents"...');
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('documents', {
      public: false
    });

    if (bucketError) {
      if (bucketError.message && bucketError.message.includes('already exists')) {
        console.log('Bucket "documents" ya existe.');
      } else {
        console.error('Error creando bucket:', bucketError.message);
        console.log('Puedes crearlo manualmente: Dashboard > Storage > New Bucket > "documents"');
      }
    } else {
      console.log('Bucket "documents" creado.');
    }
  } catch (e) {
    console.log('Bucket: crealo manualmente en Dashboard > Storage > New Bucket > "documents"');
  }

  // Insertar precios por defecto
  try {
    console.log('\nInsertando precios por defecto...');
    const defaultPricing = [
      { plan: 'pro', price: 7.99, currency: 'USD', features: { docs_limit: 50, signers_limit: 10, zones_limit: 10 }, is_active: true },
      { plan: 'business', price: 15.00, currency: 'USD', features: { docs_limit: -1, signers_limit: -1, zones_limit: -1 }, is_active: true }
    ];

    for (const pricing of defaultPricing) {
      const { error: pricingError } = await supabase
        .from('pricing_configs')
        .upsert(pricing, { onConflict: 'plan' });

      if (pricingError) {
        console.error(`Error insertando pricing para ${pricing.plan}:`, pricingError.message);
      } else {
        console.log(`  Precio ${pricing.plan}: $${pricing.price}/mes insertado`);
      }
    }
  } catch (e) {
    console.log('Inserta los precios manualmente si las tablas ya estan creadas.');
  }

  console.log('\nSetup completado!');
  console.log('\nProximos pasos:');
  console.log('  1. Configura variables en .env (LEMONSQUEEZY_API_KEY, STORE_ID, WEBHOOK_SECRET)');
  console.log('  2. Crea productos en Lemon Squeezy (ver CONFIGURACION_PASO_A_PASO.md)');
  console.log('  3. Configura webhook en Lemon Squeezy');
  console.log('  4. Despliega la Edge Function: supabase functions deploy lemon-webhook');
  console.log('  5. Configura secrets: supabase secrets set LEMONSQUEEZY_WEBHOOK_SECRET=tu-secret');
  console.log('  6. Inicia la app: npm start');
  console.log('  7. Configura en /admin > pestana Lemon Squeezy');
}

setupDatabase();