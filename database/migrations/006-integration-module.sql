-- Integration Module Schema Migration
-- Phase 1: Core integration tables for inbound/outbound APIs and webhooks

-- Core integration configuration table
CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('inbound_api', 'outbound_api', 'webhook')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
    description TEXT,
    environment VARCHAR(20) NOT NULL DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production')),
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_integrations_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_integrations_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Inbound API configurations
CREATE TABLE IF NOT EXISTS public.inbound_apis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL,
    endpoint_path VARCHAR(500) NOT NULL,
    http_methods TEXT[] NOT NULL DEFAULT ARRAY['POST'],
    authentication_type VARCHAR(50) NOT NULL DEFAULT 'api_key' CHECK (authentication_type IN ('none', 'api_key', 'bearer_token', 'basic_auth', 'oauth2')),
    api_key VARCHAR(255),
    rate_limit_requests INTEGER DEFAULT 100,
    rate_limit_window_minutes INTEGER DEFAULT 60,
    request_validation_schema JSONB,
    response_mapping JSONB,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inbound_apis_integration FOREIGN KEY (integration_id) REFERENCES integrations(id) ON DELETE CASCADE,
    CONSTRAINT unique_tenant_endpoint UNIQUE (integration_id, endpoint_path)
);

-- Outbound API configurations
CREATE TABLE IF NOT EXISTS public.outbound_apis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    base_url VARCHAR(1000) NOT NULL,
    authentication_type VARCHAR(50) NOT NULL DEFAULT 'api_key' CHECK (authentication_type IN ('none', 'api_key', 'bearer_token', 'basic_auth', 'oauth2')),
    auth_credentials JSONB, -- Encrypted credentials storage
    default_headers JSONB,
    timeout_seconds INTEGER DEFAULT 30,
    retry_attempts INTEGER DEFAULT 3,
    retry_delay_seconds INTEGER DEFAULT 5,
    request_template JSONB,
    response_mapping JSONB,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_outbound_apis_integration FOREIGN KEY (integration_id) REFERENCES integrations(id) ON DELETE CASCADE
);

-- Webhook configurations
CREATE TABLE IF NOT EXISTS public.webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(1000) NOT NULL,
    events TEXT[] NOT NULL, -- Array of event types to trigger webhook
    authentication_type VARCHAR(50) NOT NULL DEFAULT 'none' CHECK (authentication_type IN ('none', 'api_key', 'bearer_token', 'signature')),
    auth_credentials JSONB, -- Encrypted credentials storage
    headers JSONB,
    payload_template JSONB,
    retry_attempts INTEGER DEFAULT 3,
    retry_delay_seconds INTEGER DEFAULT 5,
    timeout_seconds INTEGER DEFAULT 30,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_webhooks_integration FOREIGN KEY (integration_id) REFERENCES integrations(id) ON DELETE CASCADE
);

-- Integration execution logs
CREATE TABLE IF NOT EXISTS public.integration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL,
    integration_type VARCHAR(50) NOT NULL,
    execution_type VARCHAR(50) NOT NULL, -- 'inbound_request', 'outbound_request', 'webhook_delivery'
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error', 'pending', 'timeout')),
    request_data JSONB,
    response_data JSONB,
    error_message TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_integration_logs_integration FOREIGN KEY (integration_id) REFERENCES integrations(id) ON DELETE CASCADE
);

-- Integration API keys for inbound authentication
CREATE TABLE IF NOT EXISTS public.integration_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL,
    key_name VARCHAR(255) NOT NULL,
    api_key_hash VARCHAR(255) NOT NULL, -- Hashed API key for security
    permissions TEXT[] DEFAULT ARRAY['read', 'write'],
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_integration_api_keys_integration FOREIGN KEY (integration_id) REFERENCES integrations(id) ON DELETE CASCADE,
    CONSTRAINT fk_integration_api_keys_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT unique_key_name UNIQUE (integration_id, key_name)
);

-- Integration field mappings for data transformation
CREATE TABLE IF NOT EXISTS public.integration_field_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL,
    mapping_type VARCHAR(50) NOT NULL, -- 'inbound', 'outbound', 'webhook'
    source_field VARCHAR(500) NOT NULL,
    target_field VARCHAR(500) NOT NULL,
    transformation_rule JSONB, -- JSON rules for field transformation
    is_required BOOLEAN NOT NULL DEFAULT false,
    default_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_integration_field_mappings_integration FOREIGN KEY (integration_id) REFERENCES integrations(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_integrations_tenant_id ON public.integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON public.integrations(type);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON public.integrations(status);
CREATE INDEX IF NOT EXISTS idx_inbound_apis_integration_id ON public.inbound_apis(integration_id);
CREATE INDEX IF NOT EXISTS idx_inbound_apis_endpoint_path ON public.inbound_apis(endpoint_path);
CREATE INDEX IF NOT EXISTS idx_outbound_apis_integration_id ON public.outbound_apis(integration_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_integration_id ON public.webhooks(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_integration_id ON public.integration_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created_at ON public.integration_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_integration_api_keys_integration_id ON public.integration_api_keys(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_field_mappings_integration_id ON public.integration_field_mappings(integration_id);

-- Insert the integration module into modules table
INSERT INTO public.modules (
    id, 
    code, 
    name, 
    description, 
    version, 
    is_active, 
    base_price, 
    price_per_user, 
    icon, 
    color,
    dependencies,
    settings_schema
) VALUES (
    gen_random_uuid(),
    'integration',
    'Integration Hub',
    'Comprehensive integration management for inbound APIs, outbound APIs, and webhooks with tenant self-service configuration',
    '1.0.0',
    true,
    49.99,
    5.99,
    'Link',
    '#10B981',
    '[]'::jsonb,
    '{
        "webhook_retry_limit": {
            "type": "number",
            "default": 3,
            "description": "Maximum retry attempts for failed webhooks"
        },
        "api_rate_limit_default": {
            "type": "number", 
            "default": 100,
            "description": "Default rate limit for inbound APIs (requests per hour)"
        },
        "log_retention_days": {
            "type": "number",
            "default": 30,
            "description": "Number of days to retain integration execution logs"
        }
    }'::jsonb
) ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    version = EXCLUDED.version,
    updated_at = CURRENT_TIMESTAMP;

-- Update schema tracking
INSERT INTO public.schema_versions (version, applied_at, description) 
VALUES ('1.6.0', CURRENT_TIMESTAMP, 'Integration Module - Core tables for APIs and webhooks')
ON CONFLICT (version) DO NOTHING;