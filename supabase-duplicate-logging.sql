-- Create email_duplicates table for logging rejected duplicate subscriptions
CREATE TABLE email_duplicates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  attempted_at TIMESTAMP DEFAULT NOW(),
  reason TEXT,
  user_agent TEXT
);

-- Create index on email for faster lookups
CREATE INDEX idx_email_duplicates_email ON email_duplicates(email);
CREATE INDEX idx_email_duplicates_attempted_at ON email_duplicates(attempted_at);

-- Enable RLS
ALTER TABLE email_duplicates ENABLE ROW LEVEL SECURITY;

-- Allow anonymous reads (for dashboard queries)
CREATE POLICY "Allow public read access"
  ON email_duplicates
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous inserts (for logging duplicates)
CREATE POLICY "Allow anonymous inserts"
  ON email_duplicates
  FOR INSERT
  TO anon
  WITH CHECK (
    email IS NOT NULL AND
    email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'
  );

-- Optional: Create a view for duplicate statistics
CREATE OR REPLACE VIEW duplicate_statistics AS
SELECT
  email,
  COUNT(*) as duplicate_count,
  MIN(attempted_at) as first_attempt,
  MAX(attempted_at) as last_attempt,
  COUNT(DISTINCT reason) as unique_reasons
FROM email_duplicates
GROUP BY email
ORDER BY duplicate_count DESC;
