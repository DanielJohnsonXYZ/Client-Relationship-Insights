-- Multi-Gmail Account Support Schema
-- Run this in your Supabase SQL Editor

-- Create gmail_accounts table to store multiple Gmail connections per user
CREATE TABLE IF NOT EXISTS gmail_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  gmail_address VARCHAR(255) NOT NULL,
  account_label VARCHAR(100), -- "Work Email", "Client Email", etc.
  access_token TEXT,
  refresh_token TEXT,
  expires_at BIGINT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate Gmail accounts per user
  UNIQUE(user_id, gmail_address)
);

-- Add gmail_account_id to emails table to track which account each email came from
ALTER TABLE emails ADD COLUMN IF NOT EXISTS gmail_account_id UUID REFERENCES gmail_accounts(id) ON DELETE CASCADE;

-- Update emails table to include account context
-- (This makes existing emails still work, but new ones will have account tracking)

-- RLS Policies for gmail_accounts
ALTER TABLE gmail_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own Gmail accounts"
  ON gmail_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Gmail accounts"
  ON gmail_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Gmail accounts"
  ON gmail_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Gmail accounts"
  ON gmail_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_gmail_accounts_user_id ON gmail_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_gmail_account_id ON emails(gmail_account_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_gmail_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update timestamps
CREATE TRIGGER gmail_accounts_updated_at
  BEFORE UPDATE ON gmail_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_gmail_accounts_updated_at();