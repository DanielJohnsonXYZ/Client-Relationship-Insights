-- Create emails table
CREATE TABLE emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gmail_id VARCHAR(255) UNIQUE NOT NULL,
  thread_id VARCHAR(255) NOT NULL,
  from_email VARCHAR(255) NOT NULL,
  to_email VARCHAR(255) NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create insights table
CREATE TABLE insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email_id UUID REFERENCES emails(id) ON DELETE CASCADE,
  category VARCHAR(20) CHECK (category IN ('Risk', 'Upsell', 'Alignment', 'Note')) NOT NULL,
  summary TEXT NOT NULL,
  evidence TEXT NOT NULL,
  suggested_action TEXT NOT NULL,
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  feedback VARCHAR(10) CHECK (feedback IN ('positive', 'negative')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_emails_thread_id ON emails(thread_id);
CREATE INDEX idx_emails_timestamp ON emails(timestamp);
CREATE INDEX idx_insights_email_id ON insights(email_id);
CREATE INDEX idx_insights_category ON insights(category);
CREATE INDEX idx_insights_created_at ON insights(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- Create policies (for now, allow all operations - tighten in production)
CREATE POLICY "Allow all operations on emails" ON emails FOR ALL USING (true);
CREATE POLICY "Allow all operations on insights" ON insights FOR ALL USING (true);