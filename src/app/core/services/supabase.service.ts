import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

const SUPABASE_CONFIG = {
  url: environment.supabaseUrl,
  anonKey: environment.supabaseAnonKey,
};

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  client: SupabaseClient;

  readonly tables = {
    users: 'users',
    documents: 'documents',
    signers: 'signers',
    audit_logs: 'audit_logs',
    pricing_configs: 'pricing_configs',
    lemon_config: 'lemon_config'
  };

  constructor() {
    this.client = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  }

  // Auth helpers
  get auth() {
    return this.client.auth;
  }

  // Database helpers
  get db() {
    return this.client;
  }

  // Storage helpers
  get storage() {
    return this.client.storage;
  }

  // Helper para queries comunes
  from(table: string) {
    return this.client.from(table);
  }
}
