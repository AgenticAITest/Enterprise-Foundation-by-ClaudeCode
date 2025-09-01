-- Public Schema (Shared across all tenants)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Tenants table
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subdomain VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    plan_id UUID,
    database_schema VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Super admin users
CREATE TABLE public.super_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Billing and usage tracking
CREATE TABLE public.billing_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('users', 'storage', 'api_calls', 'modules')),
    usage_value DECIMAL(15,2) NOT NULL,
    billing_period DATE NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, metric_type, billing_period)
);

-- Module subscriptions
CREATE TABLE public.tenant_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    module_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(tenant_id, module_name)
);

-- Exchange rates (shared across tenants)
CREATE TABLE public.exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_currency VARCHAR(3) NOT NULL,
    target_currency VARCHAR(3) NOT NULL,
    rate DECIMAL(12,6) NOT NULL,
    effective_date DATE NOT NULL,
    source VARCHAR(50) DEFAULT 'manual',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(base_currency, target_currency, effective_date)
);

-- Function to create tenant schema
CREATE OR REPLACE FUNCTION create_tenant_schema(tenant_id UUID, schema_name VARCHAR)
RETURNS void AS $$
BEGIN
    EXECUTE format('CREATE SCHEMA %I', schema_name);
    
    -- Set search path for this session
    EXECUTE format('SET search_path TO %I, public', schema_name);
    
    -- Users table for tenant
    EXECUTE format('
        CREATE TABLE %I.users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            role VARCHAR(50) NOT NULL DEFAULT ''user'',
            permissions JSONB DEFAULT ''[]'',
            is_active BOOLEAN DEFAULT true,
            last_login TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )', schema_name);
    
    -- Company settings
    EXECUTE format('
        CREATE TABLE %I.company_settings (
            setting_key VARCHAR(100) PRIMARY KEY,
            setting_value JSONB NOT NULL,
            updated_by UUID,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )', schema_name);
    
    -- Currency configuration
    EXECUTE format('
        CREATE TABLE %I.currencies (
            code VARCHAR(3) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            symbol VARCHAR(10) NOT NULL,
            decimal_places INTEGER DEFAULT 2,
            is_base BOOLEAN DEFAULT false,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )', schema_name);
    
    -- Documents with HTML storage
    EXECUTE format('
        CREATE TABLE %I.documents (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            type VARCHAR(50) NOT NULL,
            title VARCHAR(500) NOT NULL,
            content_html TEXT,
            metadata JSONB DEFAULT ''{}''::jsonb,
            version INTEGER DEFAULT 1,
            parent_id UUID,
            blob_files JSONB DEFAULT ''[]''::jsonb,
            created_by UUID NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )', schema_name);
    
    -- Audit trail
    EXECUTE format('
        CREATE TABLE %I.audit_logs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL,
            action VARCHAR(100) NOT NULL,
            resource_type VARCHAR(100) NOT NULL,
            resource_id VARCHAR(100),
            old_values JSONB,
            new_values JSONB,
            ip_address INET,
            user_agent TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )', schema_name);
    
    -- Form definitions
    EXECUTE format('
        CREATE TABLE %I.form_definitions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(200) NOT NULL,
            description TEXT,
            schema_json JSONB NOT NULL,
            ui_schema JSONB,
            module VARCHAR(100) NOT NULL,
            version INTEGER DEFAULT 1,
            is_active BOOLEAN DEFAULT true,
            created_by UUID NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )', schema_name);
    
    -- Report definitions
    EXECUTE format('
        CREATE TABLE %I.report_definitions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(200) NOT NULL,
            description TEXT,
            template_html TEXT NOT NULL,
            data_source JSONB NOT NULL,
            parameters JSONB DEFAULT ''{}''::jsonb,
            module VARCHAR(100) NOT NULL,
            created_by UUID NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )', schema_name);
    
    -- Insert default company settings
    EXECUTE format('
        INSERT INTO %I.company_settings (setting_key, setting_value) VALUES
        (''company_profile'', ''{"name": "", "logo": "", "addresses": []}''),
        (''localization'', ''{"language": "en", "timezone": "UTC", "dateFormat": "MM/dd/yyyy", "numberFormat": "en-US"}''),
        (''currency_config'', ''{"baseCurrency": "USD", "allowedCurrencies": ["USD"]}''),
        (''document_settings'', ''{"numberingFormat": "AUTO", "approvalRequired": false}'')', 
        schema_name);
    
    -- Insert default currencies
    EXECUTE format('
        INSERT INTO %I.currencies (code, name, symbol, decimal_places, is_base) VALUES
        (''USD'', ''US Dollar'', ''$'', 2, true)', 
        schema_name);

END;
$$ LANGUAGE plpgsql;