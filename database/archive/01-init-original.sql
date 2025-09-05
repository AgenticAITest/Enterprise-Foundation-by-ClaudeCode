-- ERP SaaS Database Initialization Script
-- This script sets up the multi-tenant database structure

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- PUBLIC SCHEMA: System-wide tables
-- ============================================================================

-- Super Admin Users Table
CREATE TABLE IF NOT EXISTS public.super_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    permissions TEXT[] DEFAULT ARRAY['read', 'write', 'admin'],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tenants Table
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subdomain VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    plan_id VARCHAR(50) DEFAULT 'basic',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Billing and Usage Tracking
CREATE TABLE IF NOT EXISTS public.billing_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    month_year VARCHAR(7) NOT NULL, -- Format: 2024-01
    user_count INTEGER DEFAULT 0,
    storage_used_gb DECIMAL(10,2) DEFAULT 0.00,
    api_requests INTEGER DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, month_year)
);

-- ============================================================================
-- TENANT SCHEMA TEMPLATE: Dynamic schemas will be created for each tenant
-- ============================================================================

-- Function to create tenant schema
CREATE OR REPLACE FUNCTION create_tenant_schema(tenant_subdomain TEXT)
RETURNS VOID AS $$
DECLARE
    schema_name TEXT := 'tenant_' || tenant_subdomain;
BEGIN
    -- Create schema
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
    
    -- Users table for this tenant
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            role VARCHAR(50) DEFAULT ''user'' CHECK (role IN (''admin'', ''manager'', ''user'')),
            permissions TEXT[] DEFAULT ARRAY[''read''],
            is_active BOOLEAN DEFAULT true,
            last_login TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )', schema_name);

    -- Company Settings
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.company_settings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            setting_key VARCHAR(100) UNIQUE NOT NULL,
            setting_value JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )', schema_name);

    -- Currencies
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.currencies (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            code VARCHAR(3) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            symbol VARCHAR(10) NOT NULL,
            exchange_rate DECIMAL(10,6) NOT NULL DEFAULT 1.000000,
            is_base BOOLEAN DEFAULT false,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )', schema_name);

    -- Documents/Files
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.documents (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            filename VARCHAR(255) NOT NULL,
            original_name VARCHAR(255) NOT NULL,
            mime_type VARCHAR(100) NOT NULL,
            file_size BIGINT NOT NULL,
            file_path VARCHAR(500) NOT NULL,
            uploaded_by UUID REFERENCES %I.users(id),
            is_active BOOLEAN DEFAULT true,
            metadata JSONB DEFAULT ''{}''::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )', schema_name, schema_name);

    -- Audit Log
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.audit_log (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES %I.users(id),
            action VARCHAR(100) NOT NULL,
            table_name VARCHAR(100),
            record_id UUID,
            old_values JSONB,
            new_values JSONB,
            ip_address INET,
            user_agent TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )', schema_name, schema_name);

    RAISE NOTICE 'Created schema and tables for tenant: %', schema_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert default super admin
INSERT INTO public.super_admins (email, password_hash, first_name, last_name, permissions) 
VALUES (
    'admin@example.com', 
    crypt('password', gen_salt('bf')), 
    'Super', 
    'Admin',
    ARRAY['read', 'write', 'delete', 'admin']
) ON CONFLICT (email) DO NOTHING;

-- Insert development tenants
INSERT INTO public.tenants (subdomain, company_name, status, plan_id) VALUES
    ('dev', 'Development Company', 'active', 'enterprise'),
    ('acme', 'ACME Corporation', 'active', 'business'),
    ('techcorp', 'Tech Corp Ltd', 'active', 'enterprise')
ON CONFLICT (subdomain) DO NOTHING;

-- Create schemas for development tenants
SELECT create_tenant_schema('dev');
SELECT create_tenant_schema('acme');
SELECT create_tenant_schema('techcorp');

-- Insert sample users for dev tenant
INSERT INTO tenant_dev.users (email, password_hash, first_name, last_name, role, permissions) VALUES
    ('admin@example.com', crypt('password', gen_salt('bf')), 'Admin', 'User', 'admin', ARRAY['read', 'write', 'delete', 'admin']),
    ('user@example.com', crypt('password', gen_salt('bf')), 'Regular', 'User', 'user', ARRAY['read'])
ON CONFLICT (email) DO NOTHING;

-- Insert default currencies for dev tenant
INSERT INTO tenant_dev.currencies (code, name, symbol, exchange_rate, is_base) VALUES
    ('USD', 'US Dollar', '$', 1.000000, true),
    ('EUR', 'Euro', '€', 0.850000, false),
    ('GBP', 'British Pound', '£', 0.730000, false),
    ('JPY', 'Japanese Yen', '¥', 110.250000, false),
    ('CAD', 'Canadian Dollar', 'C$', 1.250000, false)
ON CONFLICT (code) DO NOTHING;

-- Insert company settings for dev tenant
INSERT INTO tenant_dev.company_settings (setting_key, setting_value) VALUES
    ('company_name', '"Development Company"'::jsonb),
    ('default_currency', '"USD"'::jsonb),
    ('timezone', '"UTC"'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

NOTIFY database_initialized;