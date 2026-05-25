#!/usr/bin/env node
/**
 * generate-env.js
 * Lee las variables de entorno (desde .env en local, o desde el sistema en CI/Vercel)
 * y genera src/environments/environment.ts antes del build.
 */

const fs = require('fs');
const path = require('path');

// Cargar .env solo si existe (desarrollo local)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const supabaseUrl     = process.env['SUPABASE_URL']      || '';
const supabaseAnonKey = process.env['SUPABASE_ANON_KEY'] || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  SUPABASE_URL o SUPABASE_ANON_KEY no definidas. Revisa tu .env o las variables de entorno.');
}

const content = `// ⚠️  Archivo auto-generado por scripts/generate-env.js — NO EDITAR
// Regenerar con: npm run generate-env
export const environment = {
  supabaseUrl: '${supabaseUrl}',
  supabaseAnonKey: '${supabaseAnonKey}',
};
`;

const outPath = path.join(__dirname, '..', 'src', 'environments', 'environment.ts');
fs.writeFileSync(outPath, content, 'utf8');
console.log('✅ src/environments/environment.ts generado correctamente');
