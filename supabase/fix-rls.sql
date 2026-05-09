-- ============================================================
-- Fix RLS policies for SignFlow
-- Run this in Supabase SQL Editor
-- ============================================================

-- Users: permitir INSERT de propio perfil
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users: permitir SELECT anonimo (para firma sin cuenta)
DROP POLICY IF EXISTS "Anon can view user by user_id" ON public.users;
CREATE POLICY "Anon can view user by user_id" ON public.users
  FOR SELECT USING (true);

-- Documents: permitir SELECT anonimo (para firma sin cuenta)
DROP POLICY IF EXISTS "Anon can view document for signing" ON public.documents;
CREATE POLICY "Anon can view document for signing" ON public.documents
  FOR SELECT USING (true);

-- Documents: permitir INSERT anonimo (para firma sin cuenta)
DROP POLICY IF EXISTS "Anon can create document" ON public.documents;
CREATE POLICY "Anon can create document" ON public.documents
  FOR INSERT WITH CHECK (true);

-- Documents: permitir UPDATE anonimo (para firma)
DROP POLICY IF EXISTS "Anon can update document for signing" ON public.documents;
CREATE POLICY "Anon can update document for signing" ON public.documents
  FOR UPDATE USING (true);

-- Signers: permitir SELECT anonimo
DROP POLICY IF EXISTS "Anon can view signers for signing" ON public.signers;
CREATE POLICY "Anon can view signers for signing" ON public.signers
  FOR SELECT USING (true);

-- Signers: permitir INSERT anonimo
DROP POLICY IF EXISTS "Anon can create signer" ON public.signers;
CREATE POLICY "Anon can create signer" ON public.signers
  FOR INSERT WITH CHECK (true);

-- Signers: permitir UPDATE anonimo (para firma)
DROP POLICY IF EXISTS "Anon can update signer for signing" ON public.signers;
CREATE POLICY "Anon can update signer for signing" ON public.signers
  FOR UPDATE USING (true);

-- Pricing configs: permitir SELECT a todos (para mostrar planes)
DROP POLICY IF EXISTS "Anyone can view pricing" ON public.pricing_configs;
CREATE POLICY "Anyone can view pricing" ON public.pricing_configs
  FOR SELECT USING (true);

SELECT 'RLS policies fixed!' AS resultado;