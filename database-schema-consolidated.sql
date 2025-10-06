-- =====================================================
-- CONSOLIDATED DATABASE SCHEMA
-- Client Relationship Insights Application
-- =====================================================
-- This replaces all individual schema files
-- Execute this in Supabase SQL Editor in order
-- =====================================================

-- =====================================================
-- 1. CORE TABLES
-- =====================================================

-- Clients table - Fixed to use UUID for user_id consistency
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  email VARCHAR(255),
  domain VARCHAR(255),
  status VARCHAR(20) CHECK (status IN ('active', 'prospective', 'at_risk', 'completed', 'inactive')) DEFAULT 'active',
  relationship_health INTEGER CHECK (relationship_health >= 1 AND relationship_health <= 5) DEFAULT 3,
  current_project TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gmail accounts table for multi-account support
CREATE TABLE IF NOT EXISTS gmail_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gmail_address VARCHAR(255) NOT NULL,
  account_label VARCHAR(100),
  access_token TEXT,
  refresh_token TEXT,
  expires_at BIGINT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, gmail_address)
);

-- Emails table
CREATE TABLE IF NOT EXISTS emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  gmail_account_id UUID REFERENCES gmail_accounts(id) ON DELETE CASCADE,
  gmail_id VARCHAR(255) NOT NULL,
  thread_id VARCHAR(255) NOT NULL,
  from_email VARCHAR(255) NOT NULL,
  to_email VARCHAR(255) NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  is_automated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, gmail_id)
);

-- Insights table
CREATE TABLE IF NOT EXISTS insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email_id UUID REFERENCES emails(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  category VARCHAR(20) CHECK (category IN ('Risk', 'Upsell', 'Alignment', 'Note')),
  summary TEXT,
  evidence TEXT,
  suggested_action TEXT,
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  feedback VARCHAR(10) CHECK (feedback IN ('positive', 'negative')),
  raw_output TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. INDEXES FOR PERFORMANCE
-- =====================================================

-- Clients indexes
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_domain ON clients(domain);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_user_email ON clients(user_id, email);

-- Gmail accounts indexes
CREATE INDEX IF NOT EXISTS idx_gmail_accounts_user_id ON gmail_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_gmail_accounts_is_active ON gmail_accounts(is_active);

-- Emails indexes
CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_client_id ON emails(client_id);
CREATE INDEX IF NOT EXISTS idx_emails_gmail_account_id ON emails(gmail_account_id);
CREATE INDEX IF NOT EXISTS idx_emails_thread_id ON emails(thread_id);
CREATE INDEX IF NOT EXISTS idx_emails_timestamp ON emails(timestamp);
CREATE INDEX IF NOT EXISTS idx_emails_user_thread ON emails(user_id, thread_id);
CREATE INDEX IF NOT EXISTS idx_emails_user_client ON emails(user_id, client_id);
CREATE INDEX IF NOT EXISTS idx_emails_is_automated ON emails(is_automated);

-- Insights indexes
CREATE INDEX IF NOT EXISTS idx_insights_email_id ON insights(email_id);
CREATE INDEX IF NOT EXISTS idx_insights_client_id ON insights(client_id);
CREATE INDEX IF NOT EXISTS idx_insights_category ON insights(category);
CREATE INDEX IF NOT EXISTS idx_insights_created_at ON insights(created_at);

-- =====================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmail_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can only access their own clients" ON clients;
DROP POLICY IF EXISTS "Users can view their own Gmail accounts" ON gmail_accounts;
DROP POLICY IF EXISTS "Users can insert their own Gmail accounts" ON gmail_accounts;
DROP POLICY IF EXISTS "Users can update their own Gmail accounts" ON gmail_accounts;
DROP POLICY IF EXISTS "Users can delete their own Gmail accounts" ON gmail_accounts;
DROP POLICY IF EXISTS "Users can only access their own emails" ON emails;
DROP POLICY IF EXISTS "Users can only access their own insights" ON insights;

-- Clients RLS policies (using UUID consistently)
CREATE POLICY "Users can only access their own clients" ON clients
  FOR ALL USING (auth.uid() = user_id);

-- Gmail accounts RLS policies
CREATE POLICY "Users can view their own Gmail accounts" ON gmail_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Gmail accounts" ON gmail_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Gmail accounts" ON gmail_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Gmail accounts" ON gmail_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Emails RLS policies
CREATE POLICY "Users can only access their own emails" ON emails
  FOR ALL USING (auth.uid() = user_id);

-- Insights RLS policies
CREATE POLICY "Users can only access their own insights" ON insights
  FOR ALL USING (
    auth.uid() = (
      SELECT user_id FROM emails WHERE emails.id = insights.email_id
    )
  );

-- =====================================================
-- 4. TRIGGERS & FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating timestamps
DROP TRIGGER IF EXISTS clients_updated_at ON clients;
CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS gmail_accounts_updated_at ON gmail_accounts;
CREATE TRIGGER gmail_accounts_updated_at
  BEFORE UPDATE ON gmail_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. MATERIALIZED VIEWS FOR PERFORMANCE (Optional)
-- =====================================================

-- Dashboard statistics view
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_stats AS
SELECT
  emails.user_id,
  COUNT(DISTINCT emails.client_id) as total_clients,
  COUNT(DISTINCT emails.id) as total_emails,
  COUNT(DISTINCT insights.id) as total_insights,
  COUNT(DISTINCT CASE WHEN insights.category = 'Risk' THEN insights.id END) as risk_count,
  COUNT(DISTINCT CASE WHEN insights.category = 'Upsell' THEN insights.id END) as upsell_count,
  MAX(emails.timestamp) as last_email_date
FROM emails
LEFT JOIN insights ON insights.email_id = emails.id
GROUP BY emails.user_id;

-- Index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_stats_user_id ON dashboard_stats(user_id);

-- Refresh function (call this periodically or after significant data changes)
-- Example: SELECT refresh_dashboard_stats();
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Function to check if user owns a resource
CREATE OR REPLACE FUNCTION user_owns_email(email_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM emails
    WHERE id = email_uuid AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. GRANTS (if needed)
-- =====================================================

-- Ensure authenticated users can access their data
-- (Supabase handles this automatically with RLS, but kept for reference)

-- =====================================================
-- MIGRATION NOTES:
-- =====================================================
-- 1. This schema uses UUID for all user_id fields to maintain consistency with auth.users
-- 2. All RLS policies use auth.uid() for consistent authentication
-- 3. Foreign keys properly cascade on delete
-- 4. Indexes optimized for common query patterns
-- 5. Materialized view provides fast dashboard stats
-- 6. Remember to refresh materialized views periodically
--
-- To apply this schema:
-- 1. Backup your existing data first!
-- 2. Run this SQL in Supabase SQL Editor
-- 3. If you have existing data with TEXT user_ids in clients table,
--    you'll need to migrate that data first
-- =====================================================
