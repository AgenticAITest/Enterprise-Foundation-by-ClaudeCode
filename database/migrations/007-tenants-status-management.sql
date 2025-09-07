-- Migration: Add tenant status management fields
-- This migration adds necessary fields for tenant status management in the admin portal

-- Create tenants table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subdomain VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add status management columns if they don't exist
DO $$ 
BEGIN
    -- Add status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'status') THEN
        ALTER TABLE public.tenants ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial', 'inactive'));
    END IF;
    
    -- Add plan_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'plan_id') THEN
        ALTER TABLE public.tenants ADD COLUMN plan_id VARCHAR(50) DEFAULT 'basic';
    END IF;
    
    -- Add suspension fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'suspended_reason') THEN
        ALTER TABLE public.tenants ADD COLUMN suspended_reason TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'suspended_at') THEN
        ALTER TABLE public.tenants ADD COLUMN suspended_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add trial fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'trial_ends_at') THEN
        ALTER TABLE public.tenants ADD COLUMN trial_ends_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'trial_modules') THEN
        ALTER TABLE public.tenants ADD COLUMN trial_modules JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    -- Add subscription limit fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'max_users') THEN
        ALTER TABLE public.tenants ADD COLUMN max_users INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'max_storage_gb') THEN
        ALTER TABLE public.tenants ADD COLUMN max_storage_gb INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'max_api_calls_per_day') THEN
        ALTER TABLE public.tenants ADD COLUMN max_api_calls_per_day INTEGER;
    END IF;
END
$$;

-- Create some sample tenants for testing if none exist
INSERT INTO public.tenants (subdomain, company_name, status, plan_id, max_users, max_storage_gb, max_api_calls_per_day)
SELECT * FROM (VALUES
    ('acme-corp', 'Acme Corporation', 'active', 'business', 100, 500, 10000),
    ('tech-solutions', 'Tech Solutions Ltd', 'active', 'enterprise', 500, 1000, 50000),
    ('startup-inc', 'Startup Inc', 'trial', 'basic', 10, 100, 1000),
    ('global-systems', 'Global Systems', 'suspended', 'business', 200, 750, 25000),
    ('innovation-labs', 'Innovation Labs', 'active', 'enterprise', 1000, 2000, 100000)
) AS data(subdomain, company_name, status, plan_id, max_users, max_storage_gb, max_api_calls_per_day)
WHERE NOT EXISTS (SELECT 1 FROM public.tenants);

-- Update updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON public.tenants(subdomain);

-- Record migration
INSERT INTO public.schema_migrations (version, description) 
VALUES ('007', 'Add tenant status management fields and sample data')
ON CONFLICT (version) DO NOTHING;