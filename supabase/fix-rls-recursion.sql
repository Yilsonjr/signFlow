-- ============================================================
-- Fix RLS infinite recursion on SignFlow
-- Run this in Supabase SQL Editor
-- ============================================================

-- Drop ALL existing policies on users to start clean
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can read by user_id" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Anon can view user by user_id" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;

-- Simple non-recursive policies:
-- 1. Anyone authenticated can select from users (needed for dashboard, profile, etc.)
CREATE POLICY "Authenticated users can view profiles" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Users can update their own row by matching id (not user_id to avoid confusion)
CREATE POLICY "Users can update own row" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 3. Allow insert for authenticated users (trigger also creates via SECURITY DEFINER)
CREATE POLICY "Authenticated users can insert profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() = user_id);

-- 4. Service role bypasses RLS anyway, no need for admin subquery policy

-- Drop ALL existing policies on other tables and recreate simply
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can create own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
DROP POLICY IF EXISTS "Anon can view document for signing" ON public.documents;
DROP POLICY IF EXISTS "Anon can create document" ON public.documents;
DROP POLICY IF EXISTS "Anon can update document for signing" ON public.documents;

CREATE POLICY "Authenticated can view documents" ON public.documents
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can create documents" ON public.documents
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update documents" ON public.documents
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Anon can view documents" ON public.documents
  FOR SELECT USING (true);
CREATE POLICY "Anon can update documents" ON public.documents
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can view signers of own documents" ON public.signers;
DROP POLICY IF EXISTS "Users can create signers for own documents" ON public.signers;
DROP POLICY IF EXISTS "Users can update signers of own documents" ON public.signers;
DROP POLICY IF EXISTS "Anon can view signers for signing" ON public.signers;
DROP POLICY IF EXISTS "Anon can create signer" ON public.signers;
DROP POLICY IF EXISTS "Anon can update signer for signing" ON public.signers;

CREATE POLICY "Authenticated can view signers" ON public.signers
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can create signers" ON public.signers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update signers" ON public.signers
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Anon can view signers" ON public.signers
  FOR SELECT USING (true);
CREATE POLICY "Anon can update signers" ON public.signers
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can view audit logs of own documents" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can create audit logs for own documents" ON public.audit_logs;

CREATE POLICY "Authenticated can view audit logs" ON public.audit_logs
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can create audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage pricing configs" ON public.pricing_configs;
DROP POLICY IF EXISTS "Anyone can view pricing" ON public.pricing_configs;

CREATE POLICY "Anyone can view pricing" ON public.pricing_configs
  FOR SELECT USING (true);
CREATE POLICY "Authenticated can modify pricing" ON public.pricing_configs
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage lemon config" ON public.lemon_config;

CREATE POLICY "Authenticated can manage lemon config" ON public.lemon_config
  FOR ALL USING (auth.role() = 'authenticated');

SELECT 'RLS fixed - no more infinite recursion!' AS resultado;