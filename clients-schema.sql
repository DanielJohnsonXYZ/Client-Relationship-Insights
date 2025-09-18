-- Create clients table for client management
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
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

-- Create indexes for clients
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_domain ON clients(domain);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_user_email ON clients(user_id, email);

-- Enable RLS for clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for clients using TEXT user_id
CREATE POLICY "Users can only access their own clients" ON clients
  FOR ALL USING (auth.jwt() ->> 'sub' = user_id);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';