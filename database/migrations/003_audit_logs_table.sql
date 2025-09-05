-- Migration: Add audit_logs table for comprehensive audit logging
-- This table will store all audit events in the public schema (shared across tenants)

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Context Information
    tenant_id VARCHAR(50),           -- Which tenant (null for system operations)
    user_id VARCHAR(50),             -- Who performed the action
    user_email VARCHAR(255),         -- User email for easy identification
    user_role VARCHAR(50),           -- User role at time of action
    session_id VARCHAR(100),         -- Session identifier
    
    -- Action Details
    action VARCHAR(100) NOT NULL,    -- login, create_user, assign_role, etc.
    resource_type VARCHAR(50),       -- user, role, permission, module, etc.
    resource_id VARCHAR(100),        -- ID of affected resource
    resource_name VARCHAR(255),      -- Human-readable resource name
    
    -- Request Information  
    http_method VARCHAR(10),         -- GET, POST, PUT, DELETE
    endpoint VARCHAR(500),           -- API endpoint called
    ip_address INET,                 -- Client IP address
    user_agent TEXT,                 -- Browser/client info
    
    -- Changes Tracking
    old_values JSONB,                -- Previous state (for updates/deletes)
    new_values JSONB,                -- New state (for creates/updates)
    
    -- Status & Metadata
    status VARCHAR(20) DEFAULT 'success',  -- success, failed, pending
    error_message TEXT,              -- If status=failed
    severity VARCHAR(20) DEFAULT 'info',   -- info, warning, error, critical
    
    -- Additional Context
    module_code VARCHAR(50),         -- Which module was affected
    permission_required VARCHAR(100), -- What permission was needed
    data_scope JSONB,               -- User's data scope at time of action
    
    -- Timestamps
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexing constraints
    CONSTRAINT audit_logs_action_check CHECK (action IN (
        'login', 'logout', 'login_failed',
        'create_user', 'update_user', 'delete_user', 'activate_user', 'deactivate_user',
        'create_role', 'update_role', 'delete_role', 'assign_role', 'remove_role',
        'update_permissions', 'create_permission', 'delete_permission',
        'activate_module', 'deactivate_module', 'update_module_settings',
        'bulk_operation', 'file_upload', 'report_generation',
        'data_export', 'data_import', 'system_configuration',
        'password_reset', 'email_change', 'profile_update',
        'api_call', 'permission_check', 'rate_limit_hit'
    )),
    
    CONSTRAINT audit_logs_status_check CHECK (status IN ('success', 'failed', 'pending')),
    CONSTRAINT audit_logs_severity_check CHECK (severity IN ('info', 'warning', 'error', 'critical'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_performed_at ON audit_logs(tenant_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_performed_at ON audit_logs(user_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_performed_at ON audit_logs(action, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module_code ON audit_logs(module_code, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session ON audit_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address, performed_at DESC);

-- Add comment to table
COMMENT ON TABLE audit_logs IS 'Comprehensive audit log for all system operations across all tenants';

-- Add comments to key columns
COMMENT ON COLUMN audit_logs.tenant_id IS 'Tenant ID (null for system-wide operations)';
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed (login, create_user, etc.)';
COMMENT ON COLUMN audit_logs.old_values IS 'Previous state before change (JSON)';
COMMENT ON COLUMN audit_logs.new_values IS 'New state after change (JSON)';
COMMENT ON COLUMN audit_logs.severity IS 'Event severity level for monitoring';
COMMENT ON COLUMN audit_logs.data_scope IS 'User data scope at time of action (JSON)';

-- Insert initial system event
INSERT INTO audit_logs (
    action, 
    resource_type, 
    resource_name,
    status, 
    severity,
    new_values,
    performed_at
) VALUES (
    'system_configuration',
    'database',
    'audit_logs_table_created',
    'success',
    'info',
    '{"migration": "003_audit_logs_table.sql", "version": "1.0"}',
    CURRENT_TIMESTAMP
);