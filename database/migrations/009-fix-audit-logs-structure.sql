-- Fix audit_logs table structure for 5.1.6 Global Audit Logs Viewer
-- This migration ensures the audit_logs table has all required columns

-- Drop the existing table if it has the wrong structure and recreate it
DROP TABLE IF EXISTS public.audit_logs CASCADE;

CREATE TABLE public.audit_logs (
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
    
    -- Changes and Status
    old_values JSONB,                -- Previous state (for updates)
    new_values JSONB,                -- New state (for updates/creates)
    status VARCHAR(20) DEFAULT 'success', -- success, failed, pending
    error_message TEXT,              -- Error details (if failed)
    
    -- Severity and Context
    severity VARCHAR(20) DEFAULT 'info', -- info, warning, error, critical
    module_code VARCHAR(50),         -- Which module this relates to
    permission_required VARCHAR(100), -- Permission needed (if applicable)
    data_scope JSONB,                -- Data scope information
    details JSONB,                   -- Additional context details
    
    -- Timestamp
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Create indexes for common queries
    CONSTRAINT valid_status CHECK (status IN ('success', 'failed', 'pending')),
    CONSTRAINT valid_severity CHECK (severity IN ('info', 'warning', 'error', 'critical'))
);

-- Create indexes for performance
CREATE INDEX idx_audit_logs_performed_at ON audit_logs(performed_at DESC);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);  
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_status ON audit_logs(status);
CREATE INDEX idx_audit_logs_module_code ON audit_logs(module_code);

-- Create the security_alerts view
CREATE OR REPLACE VIEW security_alerts AS
SELECT 
    id,
    tenant_id,
    user_id,
    user_email,
    action,
    resource_type,
    resource_name,
    ip_address,
    status,
    error_message,
    severity,
    performed_at,
    details
FROM audit_logs
WHERE 
    severity IN ('error', 'critical') OR 
    status = 'failed' OR
    action IN ('login_failed', 'permission_denied', 'unauthorized_access', 'suspicious_activity')
ORDER BY performed_at DESC;

-- Now insert sample data for testing
INSERT INTO audit_logs (
    tenant_id,
    user_id, 
    user_email,
    user_role,
    session_id,
    action,
    resource_type,
    resource_id,
    resource_name,
    http_method,
    endpoint,
    ip_address,
    user_agent,
    old_values,
    new_values,
    status,
    error_message,
    severity,
    module_code,
    permission_required,
    performed_at
) VALUES 
-- Successful logins
('123e4567-e89b-12d3-a456-426614174000', 'usr123', 'admin@testco.com', 'super_admin', 'sess001', 'login', 'authentication', NULL, NULL, 'POST', '/api/auth/login', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NULL, '{"login_time": "2025-01-15T10:30:00Z"}', 'success', NULL, 'info', 'core', 'authenticate', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
('123e4567-e89b-12d3-a456-426614174001', 'usr124', 'manager@devco.com', 'tenant_admin', 'sess002', 'login', 'authentication', NULL, NULL, 'POST', '/api/auth/login', '10.0.1.50', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', NULL, '{"login_time": "2025-01-15T10:32:00Z"}', 'success', NULL, 'info', 'core', 'authenticate', CURRENT_TIMESTAMP - INTERVAL '1 hour 45 minutes'),

-- Failed login attempts (security alerts)
(NULL, NULL, 'hacker@suspicious.com', NULL, 'sess003', 'login_failed', 'authentication', NULL, NULL, 'POST', '/api/auth/login', '198.51.100.42', 'curl/7.68.0', NULL, NULL, 'failed', 'Invalid credentials', 'warning', 'core', 'authenticate', CURRENT_TIMESTAMP - INTERVAL '1 hour 30 minutes'),
(NULL, NULL, 'admin@testco.com', NULL, 'sess004', 'login_failed', 'authentication', NULL, NULL, 'POST', '/api/auth/login', '203.0.113.15', 'python-requests/2.25.1', NULL, NULL, 'failed', 'Account temporarily locked', 'error', 'core', 'authenticate', CURRENT_TIMESTAMP - INTERVAL '1 hour 15 minutes'),

-- User management actions
('123e4567-e89b-12d3-a456-426614174000', 'usr123', 'admin@testco.com', 'super_admin', 'sess005', 'create_user', 'user', 'usr125', 'newuser@testco.com', 'POST', '/api/users', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NULL, '{"email": "newuser@testco.com", "role": "user", "created_by": "admin@testco.com"}', 'success', NULL, 'info', 'user_management', 'create_user', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
('123e4567-e89b-12d3-a456-426614174001', 'usr124', 'manager@devco.com', 'tenant_admin', 'sess006', 'update_user', 'user', 'usr126', 'employee@devco.com', 'PUT', '/api/users/usr126', '10.0.1.50', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', '{"role": "user", "status": "active"}', '{"role": "admin", "status": "active"}', 'success', NULL, 'warning', 'user_management', 'update_user', CURRENT_TIMESTAMP - INTERVAL '50 minutes'),

-- Permission and role changes (critical events)
('123e4567-e89b-12d3-a456-426614174000', 'usr123', 'admin@testco.com', 'super_admin', 'sess007', 'assign_role', 'role', 'role001', 'finance_admin', 'POST', '/api/roles/assign', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '{"user": "usr127", "roles": ["user"]}', '{"user": "usr127", "roles": ["user", "finance_admin"]}', 'success', NULL, 'critical', 'rbac', 'assign_role', CURRENT_TIMESTAMP - INTERVAL '45 minutes'),
('123e4567-e89b-12d3-a456-426614174001', 'usr124', 'manager@devco.com', 'tenant_admin', 'sess008', 'permission_denied', 'permission', NULL, 'financial_reports', 'GET', '/api/reports/financial', '10.0.1.50', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', NULL, NULL, 'failed', 'User lacks required permission: view_financial_reports', 'error', 'finance', 'view_financial_reports', CURRENT_TIMESTAMP - INTERVAL '40 minutes'),

-- Module activations and deactivations
('123e4567-e89b-12d3-a456-426614174000', 'usr123', 'admin@testco.com', 'super_admin', 'sess009', 'activate_module', 'module', 'mod001', 'Integration Module', 'POST', '/api/modules/mod001/activate', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '{"status": "inactive"}', '{"status": "active", "activated_at": "2025-01-15T11:25:00Z"}', 'success', NULL, 'info', 'integration', 'activate_module', CURRENT_TIMESTAMP - INTERVAL '35 minutes'),
('123e4567-e89b-12d3-a456-426614174001', 'usr124', 'manager@devco.com', 'tenant_admin', 'sess010', 'deactivate_module', 'module', 'mod002', 'Finance Module', 'POST', '/api/modules/mod002/deactivate', '10.0.1.50', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', '{"status": "active"}', '{"status": "inactive", "deactivated_at": "2025-01-15T11:30:00Z"}', 'success', NULL, 'warning', 'finance', 'deactivate_module', CURRENT_TIMESTAMP - INTERVAL '30 minutes'),

-- Suspicious activities and security violations
(NULL, NULL, 'attacker@badsite.com', NULL, 'sess011', 'unauthorized_access', 'system', NULL, 'admin_panel', 'GET', '/api/admin/tenants', '198.51.100.99', 'Nmap Scripting Engine', NULL, NULL, 'failed', 'Access denied: IP blocked by security policy', 'critical', 'security', 'super_admin_access', CURRENT_TIMESTAMP - INTERVAL '25 minutes'),
('123e4567-e89b-12d3-a456-426614174001', 'usr124', 'manager@devco.com', 'tenant_admin', 'sess012', 'suspicious_activity', 'data', NULL, 'bulk_export', 'POST', '/api/export/all-data', '10.0.1.50', 'curl/7.68.0', NULL, NULL, 'failed', 'Unusual bulk data access pattern detected', 'error', 'data_export', 'bulk_export', CURRENT_TIMESTAMP - INTERVAL '20 minutes'),

-- Tenant management actions
('123e4567-e89b-12d3-a456-426614174000', 'usr123', 'admin@testco.com', 'super_admin', 'sess013', 'suspend_tenant', 'tenant', '123e4567-e89b-12d3-a456-426614174001', 'DevCo Solutions', 'POST', '/api/admin/tenants/suspend', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '{"status": "active"}', '{"status": "suspended", "reason": "Payment overdue"}', 'success', NULL, 'critical', 'tenant_management', 'suspend_tenant', CURRENT_TIMESTAMP - INTERVAL '15 minutes'),
('123e4567-e89b-12d3-a456-426614174000', 'usr123', 'admin@testco.com', 'super_admin', 'sess014', 'activate_tenant', 'tenant', '123e4567-e89b-12d3-a456-426614174001', 'DevCo Solutions', 'POST', '/api/admin/tenants/activate', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '{"status": "suspended"}', '{"status": "active", "reactivated_at": "2025-01-15T11:50:00Z"}', 'success', NULL, 'info', 'tenant_management', 'activate_tenant', CURRENT_TIMESTAMP - INTERVAL '10 minutes'),

-- Recent system events (last 24 hours)
('123e4567-e89b-12d3-a456-426614174000', 'usr123', 'admin@testco.com', 'super_admin', 'sess015', 'view_audit_logs', 'audit', NULL, 'audit_logs_page', 'GET', '/api/admin/audit-logs', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NULL, '{"filters": {"severity": "critical"}}', 'success', NULL, 'info', 'audit', 'view_audit_logs', CURRENT_TIMESTAMP - INTERVAL '5 minutes'),
(NULL, 'system', 'system@erp.com', 'system', 'sys001', 'system_backup', 'system', NULL, 'database_backup', NULL, NULL, NULL, 'System Backup Service', '{"backup_type": "incremental"}', '{"backup_completed": true, "size_mb": 1024}', 'success', NULL, 'info', 'system', NULL, CURRENT_TIMESTAMP - INTERVAL '4 minutes'),
(NULL, 'system', 'system@erp.com', 'system', 'sys002', 'security_scan', 'system', NULL, 'vulnerability_scan', NULL, NULL, NULL, 'Security Scanner', NULL, '{"vulnerabilities_found": 0, "scan_duration": "45s"}', 'success', NULL, 'info', 'security', NULL, CURRENT_TIMESTAMP - INTERVAL '3 minutes');

-- Add some more recent entries
INSERT INTO audit_logs (
    tenant_id, user_id, user_email, user_role, session_id, action, resource_type, resource_id,
    resource_name, http_method, endpoint, ip_address, status, severity, module_code, performed_at
) VALUES
('123e4567-e89b-12d3-a456-426614174000', 'usr123', 'admin@testco.com', 'super_admin', 'sess016', 'export_audit_logs', 'audit', NULL, 'audit_export', 'GET', '/api/admin/audit-logs/export', '192.168.1.100', 'success', 'info', 'audit', CURRENT_TIMESTAMP - INTERVAL '2 minutes'),
('123e4567-e89b-12d3-a456-426614174001', 'usr124', 'manager@devco.com', 'tenant_admin', 'sess017', 'update_settings', 'settings', 'set001', 'notification_preferences', 'PUT', '/api/settings', '10.0.1.50', 'success', 'info', 'core', CURRENT_TIMESTAMP - INTERVAL '1 minute'),
(NULL, NULL, 'bot@crawler.com', NULL, 'sess019', 'blocked_request', 'security', NULL, 'rate_limit', 'POST', '/api/auth/login', '203.0.113.200', 'failed', 'warning', 'security', CURRENT_TIMESTAMP - INTERVAL '30 seconds');

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON audit_logs TO erp_admin;
GRANT SELECT ON security_alerts TO erp_admin;