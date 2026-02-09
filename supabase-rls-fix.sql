-- Fix for Supabase RLS Security Issue
-- Replace overly permissive WITH CHECK (true) policy with email validation

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow anonymous inserts" ON email_subscriptions;
DROP POLICY IF EXISTS "Allow anonymous reads" ON email_subscriptions;

-- Create restrictive INSERT policy with email validation
CREATE POLICY "Allow email subscription inserts"
  ON email_subscriptions
  FOR INSERT
  TO anon
  WITH CHECK (
    email IS NOT NULL AND
    email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'
  );

-- Create SELECT policy for public read access (this is intentional)
CREATE POLICY "Allow public read access"
  ON email_subscriptions
  FOR SELECT
  TO anon
  USING (true);

-- Optional: Add UPDATE policy for authenticated users only
CREATE POLICY "Allow authenticated users to update own entries"
  ON email_subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (
    email IS NOT NULL AND
    email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'
  );

-- Optional: Add DELETE policy for authenticated users only
CREATE POLICY "Allow authenticated users to delete own entries"
  ON email_subscriptions
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = id::text);
