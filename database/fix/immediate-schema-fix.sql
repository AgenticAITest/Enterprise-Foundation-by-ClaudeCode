-- IMMEDIATE SCHEMA FIX - Critical Migration
-- This script brings the database to a consistent state by applying missing RBAC tables
-- Execute this IMMEDIATELY before any further development

-- ============================================================================
-- Phase 1: Migration Tracking Setup
-- ============================================================================

-- Create migration tracking table
CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- Add missing extension for full-text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Record baseline state
INSERT INTO public.schema_migrations (version, description) 
VALUES ('000_baseline', 'Initial database state before RBAC migration')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- Phase 2: Missing RBAC Tables Creation
-- ============================================================================

-- USERS table (global, not tenant-specific)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_tenant_admin BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, email)
);

-- MODULE ROLE TEMPLATES - Define role templates per module
CREATE TABLE IF NOT EXISTS public.module_role_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
    role_code VARCHAR(50) NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    default_permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(module_id, role_code)
);

-- PERMISSION RESOURCES - Define what can be accessed/controlled
CREATE TABLE IF NOT EXISTS public.permission_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
    resource_code VARCHAR(100) NOT NULL,
    resource_name VARCHAR(200) NOT NULL,
    resource_type VARCHAR(50) DEFAULT 'menu' CHECK (resource_type IN ('menu', 'action', 'data', 'api')),
    parent_resource_id UUID REFERENCES public.permission_resources(id) ON DELETE CASCADE,
    path VARCHAR(500),
    icon VARCHAR(100),
    sort_order INTEGER DEFAULT 0,
    is_leaf BOOLEAN DEFAULT true,
    permission_levels TEXT[] DEFAULT ARRAY['view_only', 'manage', 'no_access'],
    actions TEXT[] DEFAULT ARRAY['view', 'create', 'edit', 'delete'],
    data_scope_types TEXT[] DEFAULT ARRAY['own', 'department', 'all'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(module_id, resource_code)
);

-- AUDIT LOGS - System-wide audit trail
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID, -- Can be null for system actions
    action_type VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Phase 3: Tenant-Specific RBAC Tables (Dynamic Schema Updates)
-- ============================================================================

-- Function to add RBAC tables to existing tenant schemas
CREATE OR REPLACE FUNCTION add_rbac_to_tenant_schema(schema_name TEXT)
RETURNS void AS $$
BEGIN
    -- ROLES table (per tenant)
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.roles (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
            role_code VARCHAR(50) NOT NULL,
            role_name VARCHAR(100) NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(module_id, role_code)
        )', schema_name);

    -- ROLE PERMISSIONS table (per tenant)
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.role_permissions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            role_id UUID REFERENCES %I.roles(id) ON DELETE CASCADE,
            resource_id UUID REFERENCES public.permission_resources(id) ON DELETE CASCADE,
            permission_level VARCHAR(50) NOT NULL DEFAULT ''view_only'',
            allowed_actions TEXT[] DEFAULT ARRAY[''view''],
            data_scope VARCHAR(50) DEFAULT ''own'',
            field_permissions JSONB DEFAULT ''{}''::jsonb,
            conditions JSONB DEFAULT ''{}''::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(role_id, resource_id)
        )', schema_name, schema_name);

    -- USER MODULE ROLES table (per tenant)  
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.user_module_roles (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
            module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
            role_id UUID REFERENCES %I.roles(id) ON DELETE CASCADE,
            assigned_by UUID REFERENCES public.users(id),
            assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP WITH TIME ZONE,
            is_active BOOLEAN DEFAULT true,
            UNIQUE(user_id, module_id)
        )', schema_name, schema_name);

    -- USER DATA SCOPES table (per tenant)
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.user_data_scopes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
            module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
            scope_type VARCHAR(50) NOT NULL,
            scope_values JSONB DEFAULT ''[]''::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, module_id, scope_type)
        )', schema_name);

    RAISE NOTICE 'Added RBAC tables to schema: %', schema_name;
END;
$$ LANGUAGE plpgsql;

-- Apply RBAC tables to existing tenant schemas
SELECT add_rbac_to_tenant_schema('tenant_dev');
SELECT add_rbac_to_tenant_schema('tenant_acme');
SELECT add_rbac_to_tenant_schema('tenant_techcorp');

-- ============================================================================
-- Phase 4: Indexes for Performance
-- ============================================================================

-- Public tables indexes
CREATE INDEX IF NOT EXISTS idx_users_tenant ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active);

CREATE INDEX IF NOT EXISTS idx_module_role_templates_module ON public.module_role_templates(module_id);
CREATE INDEX IF NOT EXISTS idx_permission_resources_module ON public.permission_resources(module_id);
CREATE INDEX IF NOT EXISTS idx_permission_resources_parent ON public.permission_resources(parent_resource_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action_type);

-- ============================================================================
-- Phase 5: Record Migration Completion
-- ============================================================================

INSERT INTO public.schema_migrations (version, description) 
VALUES ('001_rbac_schema_complete', 'Applied complete RBAC schema with all missing tables')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- Phase 6: Validation Queries
-- ============================================================================

-- Verify all expected tables exist
SELECT 'VALIDATION' as status, 'All RBAC tables created' as message
WHERE (
    SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('users', 'module_role_templates', 'permission_resources', 'audit_logs')
) = 4;

-- Show final table count
SELECT 'FINAL_STATE' as status, COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Show migration history
SELECT 'MIGRATIONS_APPLIED' as status, version, applied_at 
FROM public.schema_migrations 
ORDER BY applied_at;

NOTIFY schema_migration_complete;