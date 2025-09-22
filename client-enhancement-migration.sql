-- Migration to add client support and automated email filtering
-- Run this in Supabase SQL Editor

-- Add client_id and is_automated columns to emails table
ALTER TABLE emails ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE emails ADD COLUMN is_automated BOOLEAN DEFAULT FALSE;

-- Add client_id column to insights table 
ALTER TABLE insights ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- Create new indexes for better performance
CREATE INDEX idx_emails_client_id ON emails(client_id);
CREATE INDEX idx_emails_user_client ON emails(user_id, client_id);
CREATE INDEX idx_emails_is_automated ON emails(is_automated);
CREATE INDEX idx_insights_client_id ON insights(client_id);

-- Update existing insights to inherit client_id from their associated emails
UPDATE insights 
SET client_id = emails.client_id 
FROM emails 
WHERE insights.email_id = emails.id AND insights.client_id IS NULL;