-- Create user_profiles table for onboarding data
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  business_type VARCHAR(50) NOT NULL,
  services TEXT[] NOT NULL DEFAULT '{}',
  client_types TEXT[] NOT NULL DEFAULT '{}', 
  team_size VARCHAR(20) NOT NULL,
  primary_goals TEXT[] NOT NULL DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_business_type ON user_profiles(business_type);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can only access their own profile" ON user_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Add clients table for client management
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  email VARCHAR(255),
  domain VARCHAR(255),
  status VARCHAR(20) CHECK (status IN ('active', 'prospective', 'at_risk', 'completed', 'inactive')) DEFAULT 'active',
  relationship_health INTEGER CHECK (relationship_health >= 1 AND relationship_health <= 5) DEFAULT 3,
  current_project TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email)
);

-- Create indexes for clients
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_domain ON clients(domain);
CREATE INDEX idx_clients_email ON clients(email);

-- Enable RLS for clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for clients
CREATE POLICY "Users can only access their own clients" ON clients
  FOR ALL USING (auth.uid() = user_id);