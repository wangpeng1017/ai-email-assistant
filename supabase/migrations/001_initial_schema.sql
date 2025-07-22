-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  source TEXT NOT NULL CHECK (source IN ('excel', 'manual', 'scraped')),
  customer_website TEXT,
  customer_name TEXT,
  customer_email TEXT,
  error_message TEXT,
  generated_mail_subject TEXT,
  generated_mail_body TEXT
);

-- Create index on user_id for better query performance
CREATE INDEX leads_user_id_idx ON leads (user_id);
CREATE INDEX leads_status_idx ON leads (status);
CREATE INDEX leads_created_at_idx ON leads (created_at);

-- Create product_materials table
CREATE TABLE product_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_type TEXT
);

-- Create index on user_id for better query performance
CREATE INDEX product_materials_user_id_idx ON product_materials (user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_materials ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for leads table
CREATE POLICY "Users can view their own leads" ON leads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own leads" ON leads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads" ON leads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads" ON leads
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for product_materials table
CREATE POLICY "Users can view their own product materials" ON product_materials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own product materials" ON product_materials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own product materials" ON product_materials
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own product materials" ON product_materials
  FOR DELETE USING (auth.uid() = user_id);

-- Note: Storage bucket and file upload features will be added in future versions
