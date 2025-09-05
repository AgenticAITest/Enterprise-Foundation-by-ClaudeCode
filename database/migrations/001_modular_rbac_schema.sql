-- ============================================================================
-- MODULAR ERP RBAC SYSTEM - DATABASE MIGRATION
-- Migration: 001_modular_rbac_schema.sql
-- Description: Create foundation tables for modular RBAC system
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- PUBLIC SCHEMA - System-Wide Tables (Shared with RLS)
-- ============================================================================

-- 1. MODULES - Available ERP modules
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    is_active BOOLEAN DEFAULT true,
    base_price DECIMAL(10,2) DEFAULT 0.00,
    price_per_user DECIMAL(10,2) DEFAULT 0.00,
    icon VARCHAR(100),  -- CSS class or icon name
    color VARCHAR(20),  -- Brand color for UI
    dependencies JSONB DEFAULT '[]'::jsonb,  -- Array of module codes this depends on
    settings_schema JSONB DEFAULT '{}'::jsonb,  -- JSON schema for module settings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TENANT_MODULES - Which modules each tenant has subscribed to
CREATE TABLE IF NOT EXISTS public.tenant_modules (
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial', 'expired')),
    settings JSONB DEFAULT '{}'::jsonb,  -- Module-specific tenant settings
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    activated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    suspended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tenant_id, module_id)
);

-- 3. USERS - Shared user table for SSO across modules (with RLS)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    is_tenant_admin BOOLEAN DEFAULT false,  -- Can manage tenant settings
    email_verified_at TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, email)  -- Email unique per tenant
);

-- 4. MODULE_ROLE_TEMPLATES - Predefined role templates per module
CREATE TABLE IF NOT EXISTS public.module_role_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
    role_code VARCHAR(50) NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,  -- System roles cannot be deleted
    sort_order INTEGER DEFAULT 0,
    default_permissions JSONB DEFAULT '{}'::jsonb,  -- Default permissions for this role
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(module_id, role_code)
);

-- 5. PERMISSION_RESOURCES - What can be controlled (menus, functions, data)
CREATE TABLE IF NOT EXISTS public.permission_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
    resource_code VARCHAR(100) NOT NULL,
    resource_name VARCHAR(200) NOT NULL,
    resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('menu', 'api', 'report', 'widget', 'data')),
    parent_resource_id UUID REFERENCES public.permission_resources(id) ON DELETE CASCADE,
    path VARCHAR(500),  -- URL path or menu path
    sort_order INTEGER DEFAULT 0,
    actions TEXT[] DEFAULT ARRAY['view'],  -- Available actions: view, create, edit, delete, approve, export
    data_scope_types TEXT[] DEFAULT ARRAY[]::TEXT[],  -- Possible data scope types: location, department, team, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(module_id, resource_code)
);

-- 6. AUDIT_LOGS - Comprehensive audit trail (with RLS)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID,  -- Can be NULL for system actions
    module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,  -- 'create', 'update', 'delete', 'login', 'permission_grant'
    resource_type VARCHAR(100),  -- 'user', 'role', 'permission', 'module'
    resource_id VARCHAR(100),
    resource_name VARCHAR(200),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    CONSTRAINT valid_action CHECK (action IN ('create', 'update', 'delete', 'login', 'logout', 'permission_grant', 'permission_revoke', 'role_assign', 'role_unassign', 'module_activate', 'module_deactivate'))
);

-- ============================================================================
-- TENANT SCHEMA UPDATES - Function to create/update tenant schemas
-- ============================================================================

-- Drop and recreate the tenant schema creation function
DROP FUNCTION IF EXISTS create_tenant_schema(TEXT);

CREATE OR REPLACE FUNCTION create_tenant_schema(tenant_subdomain TEXT)
RETURNS VOID AS $$
DECLARE
    schema_name TEXT := 'tenant_' || tenant_subdomain;
BEGIN
    -- Create schema
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
    
    -- 1. ROLES - Custom roles per tenant per module
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.roles (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            module_id UUID NOT NULL,  -- Which module this role belongs to
            role_code VARCHAR(50) NOT NULL,
            role_name VARCHAR(100) NOT NULL,
            description TEXT,
            based_on_template_id UUID,  -- If based on template from public.module_role_templates
            is_active BOOLEAN DEFAULT true,
            is_system BOOLEAN DEFAULT false,  -- Cannot be deleted by tenant
            sort_order INTEGER DEFAULT 0,
            created_by UUID,  -- User who created this role
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(module_id, role_code)
        )', schema_name);

    -- 2. ROLE_PERMISSIONS - Granular permissions per role
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.role_permissions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            role_id UUID REFERENCES %I.roles(id) ON DELETE CASCADE,
            resource_id UUID NOT NULL,  -- From public.permission_resources
            actions TEXT[] DEFAULT ARRAY[''view''],  -- Specific actions allowed
            data_scope JSONB DEFAULT ''{\"type\": \"all\"}''::jsonb,  -- Data filtering scope
            field_permissions JSONB DEFAULT ''{}''::jsonb,  -- Field-level permissions
            conditions JSONB DEFAULT ''{}''::jsonb,  -- Additional conditions
            granted BOOLEAN DEFAULT true,  -- true = grant, false = explicitly deny
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(role_id, resource_id)
        )', schema_name, schema_name);

    -- 3. USER_MODULE_ROLES - User assignments to roles in modules
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.user_module_roles (
            user_id UUID NOT NULL,  -- From public.users
            module_id UUID NOT NULL,
            role_id UUID REFERENCES %I.roles(id) ON DELETE CASCADE,
            assigned_by UUID,  -- Who assigned this role
            assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP WITH TIME ZONE,  -- For temporary assignments
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, module_id, role_id)
        )', schema_name, schema_name);

    -- 4. USER_DATA_SCOPES - Additional data scope restrictions per user
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.user_data_scopes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL,
            module_id UUID NOT NULL,
            scope_type VARCHAR(50) NOT NULL,  -- ''location'', ''department'', ''team''
            scope_values JSONB NOT NULL,  -- {\"locations\": [\"warehouse_1\"], \"departments\": [\"sales\"]}
            is_inclusive BOOLEAN DEFAULT true,  -- true = include only these, false = exclude these
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, module_id, scope_type)
        )', schema_name);

    -- Keep existing tenant tables (users table moved to public for SSO)
    -- But update existing users table to be compatible
    EXECUTE format('
        DROP TABLE IF EXISTS %I.users CASCADE;
    ', schema_name);

    -- Update company_settings table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.company_settings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            setting_key VARCHAR(100) UNIQUE NOT NULL,
            setting_value JSONB,
            module_id UUID,  -- If setting belongs to specific module
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )', schema_name);

    -- Keep other existing tables (currencies, documents, audit_log)
    -- These will remain module-agnostic business data

    RAISE NOTICE 'Updated schema and tables for tenant: %', schema_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on shared tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see users from their own tenant
CREATE POLICY tenant_isolation_users ON public.users
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Audit logs are tenant-isolated
CREATE POLICY tenant_isolation_audit ON public.audit_logs
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Public tables indexes
CREATE INDEX IF NOT EXISTS idx_modules_code ON public.modules(code);
CREATE INDEX IF NOT EXISTS idx_modules_active ON public.modules(is_active);
CREATE INDEX IF NOT EXISTS idx_tenant_modules_tenant ON public.tenant_modules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_modules_status ON public.tenant_modules(status);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_role_templates_module ON public.module_role_templates(module_id);
CREATE INDEX IF NOT EXISTS idx_permission_resources_module ON public.permission_resources(module_id);
CREATE INDEX IF NOT EXISTS idx_permission_resources_type ON public.permission_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to get user's effective permissions for a module
CREATE OR REPLACE FUNCTION get_user_effective_permissions(
    p_user_id UUID,
    p_tenant_subdomain TEXT,
    p_module_id UUID
)
RETURNS JSONB AS $$
DECLARE
    schema_name TEXT := 'tenant_' || p_tenant_subdomain;
    result JSONB := '{}'::jsonb;
    role_record RECORD;
    perm_record RECORD;
BEGIN
    -- Get all roles for user in this module
    FOR role_record IN 
        EXECUTE format('
            SELECT r.id, r.role_code, r.role_name 
            FROM %I.user_module_roles umr
            JOIN %I.roles r ON umr.role_id = r.id
            WHERE umr.user_id = $1 AND umr.module_id = $2 AND umr.is_active = true
            AND (umr.expires_at IS NULL OR umr.expires_at > NOW())
        ', schema_name, schema_name) 
        USING p_user_id, p_module_id
    LOOP
        -- Get permissions for each role
        FOR perm_record IN 
            EXECUTE format('
                SELECT pr.resource_code, rp.actions, rp.data_scope, rp.field_permissions
                FROM %I.role_permissions rp
                JOIN public.permission_resources pr ON rp.resource_id = pr.id
                WHERE rp.role_id = $1 AND rp.granted = true
            ', schema_name)
            USING role_record.id
        LOOP
            -- Merge permissions (union of actions)
            result := jsonb_set(
                result, 
                ARRAY[perm_record.resource_code], 
                COALESCE(result->perm_record.resource_code, '{}'::jsonb) || 
                jsonb_build_object(
                    'actions', perm_record.actions,
                    'data_scope', perm_record.data_scope,
                    'field_permissions', perm_record.field_permissions
                )
            );
        END LOOP;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION user_has_permission(
    p_user_id UUID,
    p_tenant_subdomain TEXT,
    p_module_id UUID,
    p_resource_code TEXT,
    p_action TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    schema_name TEXT := 'tenant_' || p_tenant_subdomain;
    has_permission BOOLEAN := false;
BEGIN
    EXECUTE format('
        SELECT EXISTS(
            SELECT 1 
            FROM %I.user_module_roles umr
            JOIN %I.roles r ON umr.role_id = r.id
            JOIN %I.role_permissions rp ON r.id = rp.role_id
            JOIN public.permission_resources pr ON rp.resource_id = pr.id
            WHERE umr.user_id = $1 
              AND umr.module_id = $2 
              AND pr.resource_code = $3
              AND $4 = ANY(rp.actions)
              AND umr.is_active = true
              AND r.is_active = true
              AND rp.granted = true
              AND (umr.expires_at IS NULL OR umr.expires_at > NOW())
        )
    ', schema_name, schema_name, schema_name) 
    INTO has_permission
    USING p_user_id, p_module_id, p_resource_code, p_action;
    
    RETURN has_permission;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- UPDATE EXISTING TENANT SCHEMAS
-- ============================================================================

-- Update existing tenant schemas to new structure
DO $$
DECLARE
    tenant_record RECORD;
BEGIN
    FOR tenant_record IN SELECT subdomain FROM public.tenants LOOP
        PERFORM create_tenant_schema(tenant_record.subdomain);
    END LOOP;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE NOTIFICATION
-- ============================================================================

SELECT 'Modular RBAC Schema Migration Complete' as status;