-- Create emails table
CREATE TABLE emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
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

-- Create insights table
CREATE TABLE insights (
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

-- Create indexes for better performance
CREATE INDEX idx_emails_user_id ON emails(user_id);
CREATE INDEX idx_emails_client_id ON emails(client_id);
CREATE INDEX idx_emails_thread_id ON emails(thread_id);
CREATE INDEX idx_emails_timestamp ON emails(timestamp);
CREATE INDEX idx_emails_user_thread ON emails(user_id, thread_id);
CREATE INDEX idx_emails_user_client ON emails(user_id, client_id);
CREATE INDEX idx_emails_is_automated ON emails(is_automated);
CREATE INDEX idx_insights_email_id ON insights(email_id);
CREATE INDEX idx_insights_client_id ON insights(client_id);
CREATE INDEX idx_insights_category ON insights(category);
CREATE INDEX idx_insights_created_at ON insights(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- Create secure RLS policies
CREATE POLICY "Users can only access their own emails" ON emails
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own insights" ON insights
  FOR ALL USING (
    auth.uid() = (
      SELECT user_id FROM emails WHERE emails.id = insights.email_id
    )
  );

-- Migration script for existing data (run after schema update)
-- UPDATE emails SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;