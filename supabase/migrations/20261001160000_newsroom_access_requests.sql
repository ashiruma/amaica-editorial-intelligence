-- Amaica Editorial Intelligence Platform
-- Migration: Newsroom Access & Clearance Requests Table
-- Location: supabase/migrations/20261001160000_newsroom_access_requests.sql

CREATE TABLE IF NOT EXISTS public.newsroom_access_requests (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  display_name text NOT NULL,
  requested_role text NOT NULL DEFAULT 'contributor',
  beat_reason text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by text
);

-- Index for speedy email and status lookups
CREATE INDEX IF NOT EXISTS idx_newsroom_access_requests_email ON public.newsroom_access_requests (email);
CREATE INDEX IF NOT EXISTS idx_newsroom_access_requests_status ON public.newsroom_access_requests (status);

-- Enable Row Level Security
ALTER TABLE public.newsroom_access_requests ENABLE ROW LEVEL SECURITY;

-- Permissive RLS policies for access request workflow
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'newsroom_access_requests' AND policyname = 'Public insert access requests'
  ) THEN
    CREATE POLICY "Public insert access requests" ON public.newsroom_access_requests FOR INSERT TO public WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'newsroom_access_requests' AND policyname = 'Public read access requests'
  ) THEN
    CREATE POLICY "Public read access requests" ON public.newsroom_access_requests FOR SELECT TO public USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'newsroom_access_requests' AND policyname = 'Public update access requests'
  ) THEN
    CREATE POLICY "Public update access requests" ON public.newsroom_access_requests FOR UPDATE TO public USING (true);
  END IF;
END $$;

GRANT ALL ON public.newsroom_access_requests TO anon, authenticated, service_role;
