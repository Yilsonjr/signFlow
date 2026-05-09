import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_CONFIG = {
  url: 'https://dqkcwosrayaktuuifivm.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxa2N3b3NyYXlha3R1dWlmaXZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MDc1ODgsImV4cCI6MjA5MzQ4MzU4OH0.Hl5g0yC0vSnuQUJuwFZiF6nMYyERRM-6OTQVW4RTXMg'
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
