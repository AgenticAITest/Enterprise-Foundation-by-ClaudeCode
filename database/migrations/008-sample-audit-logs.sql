-- Sample Audit Logs Data for Testing 5.1.6 Global Audit Logs Viewer
-- This migration adds sample audit log entries for testing purposes

-- Insert sample audit log entries with various actions, severities, and users
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
('123e4567-e89b-12d3-a456-426614174000', 'usr123', 'admin@testco.com', 'super_admin', 'sess001', 'login', 'authentication', NULL, NULL, 'POST', '/api/auth/login', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NULL, '{"login_time": "2025-01-15T10:30:00Z"}', 'success', NULL, 'info', 'core', 'authenticate', '2025-01-15 10:30:00+00'),
('123e4567-e89b-12d3-a456-426614174001', 'usr124', 'manager@devco.com', 'tenant_admin', 'sess002', 'login', 'authentication', NULL, NULL, 'POST', '/api/auth/login', '10.0.1.50', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', NULL, '{"login_time": "2025-01-15T10:32:00Z"}', 'success', NULL, 'info', 'core', 'authenticate', '2025-01-15 10:32:00+00'),

-- Failed login attempts (security alerts)
(NULL, NULL, 'hacker@suspicious.com', NULL, 'sess003', 'login_failed', 'authentication', NULL, NULL, 'POST', '/api/auth/login', '198.51.100.42', 'curl/7.68.0', NULL, NULL, 'failed', 'Invalid credentials', 'warning', 'core', 'authenticate', '2025-01-15 10:35:00+00'),
(NULL, NULL, 'admin@testco.com', NULL, 'sess004', 'login_failed', 'authentication', NULL, NULL, 'POST', '/api/auth/login', '203.0.113.15', 'python-requests/2.25.1', NULL, NULL, 'failed', 'Account temporarily locked', 'error', 'core', 'authenticate', '2025-01-15 10:37:00+00'),

-- User management actions
('123e4567-e89b-12d3-a456-426614174000', 'usr123', 'admin@testco.com', 'super_admin', 'sess005', 'create_user', 'user', 'usr125', 'newuser@testco.com', 'POST', '/api/users', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NULL, '{"email": "newuser@testco.com", "role": "user", "created_by": "admin@testco.com"}', 'success', NULL, 'info', 'user_management', 'create_user', '2025-01-15 10:45:00+00'),
('123e4567-e89b-12d3-a456-426614174001', 'usr124', 'manager@devco.com', 'tenant_admin', 'sess006', 'update_user', 'user', 'usr126', 'employee@devco.com', 'PUT', '/api/users/usr126', '10.0.1.50', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', '{"role": "user", "status": "active"}', '{"role": "admin", "status": "active"}', 'success', NULL, 'warning', 'user_management', 'update_user', '2025-01-15 11:00:00+00'),

-- Permission and role changes (critical events)
('123e4567-e89b-12d3-a456-426614174000', 'usr123', 'admin@testco.com', 'super_admin', 'sess007', 'assign_role', 'role', 'role001', 'finance_admin', 'POST', '/api/roles/assign', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '{"user": "usr127", "roles": ["user"]}', '{"user": "usr127", "roles": ["user", "finance_admin"]}', 'success', NULL, 'critical', 'rbac', 'assign_role', '2025-01-15 11:15:00+00'),
('123e4567-e89b-12d3-a456-426614174001', 'usr124', 'manager@devco.com', 'tenant_admin', 'sess008', 'permission_denied', 'permission', NULL, 'financial_reports', 'GET', '/api/reports/financial', '10.0.1.50', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', NULL, NULL, 'failed', 'User lacks required permission: view_financial_reports', 'error', 'finance', 'view_financial_reports', '2025-01-15 11:20:00+00'),

-- Module activations and deactivations
('123e4567-e89b-12d3-a456-426614174000', 'usr123', 'admin@testco.com', 'super_admin', 'sess009', 'activate_module', 'module', 'mod001', 'Integration Module', 'POST', '/api/modules/mod001/activate', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '{"status": "inactive"}', '{"status": "active", "activated_at": "2025-01-15T11:25:00Z"}', 'success', NULL, 'info', 'integration', 'activate_module', '2025-01-15 11:25:00+00'),
('123e4567-e89b-12d3-a456-426614174001', 'usr124', 'manager@devco.com', 'tenant_admin', 'sess010', 'deactivate_module', 'module', 'mod002', 'Finance Module', 'POST', '/api/modules/mod002/deactivate', '10.0.1.50', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', '{"status": "active"}', '{"status": "inactive", "deactivated_at": "2025-01-15T11:30:00Z"}', 'success', NULL, 'warning', 'finance', 'deactivate_module', '2025-01-15 11:30:00+00'),

-- Suspicious activities and security violations
(NULL, NULL, 'attacker@badsite.com', NULL, 'sess011', 'unauthorized_access', 'system', NULL, 'admin_panel', 'GET', '/api/admin/tenants', '198.51.100.99', 'Nmap Scripting Engine', NULL, NULL, 'failed', 'Access denied: IP blocked by security policy', 'critical', 'security', 'super_admin_access', '2025-01-15 11:35:00+00'),
('123e4567-e89b-12d3-a456-426614174001', 'usr124', 'manager@devco.com', 'tenant_admin', 'sess012', 'suspicious_activity', 'data', NULL, 'bulk_export', 'POST', '/api/export/all-data', '10.0.1.50', 'curl/7.68.0', NULL, NULL, 'failed', 'Unusual bulk data access pattern detected', 'error', 'data_export', 'bulk_export', '2025-01-15 11:40:00+00'),

-- Tenant management actions
('123e4567-e89b-12d3-a456-426614174000', 'usr123', 'admin@testco.com', 'super_admin', 'sess013', 'suspend_tenant', 'tenant', '123e4567-e89b-12d3-a456-426614174001', 'DevCo Solutions', 'POST', '/api/admin/tenants/suspend', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '{"status": "active"}', '{"status": "suspended", "reason": "Payment overdue"}', 'success', NULL, 'critical', 'tenant_management', 'suspend_tenant', '2025-01-15 11:45:00+00'),
('123e4567-e89b-12d3-a456-426614174000', 'usr123', 'admin@testco.com', 'super_admin', 'sess014', 'activate_tenant', 'tenant', '123e4567-e89b-12d3-a456-426614174001', 'DevCo Solutions', 'POST', '/api/admin/tenants/activate', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '{"status": "suspended"}', '{"status": "active", "reactivated_at": "2025-01-15T11:50:00Z"}', 'success', NULL, 'info', 'tenant_management', 'activate_tenant', '2025-01-15 11:50:00+00'),

-- Recent system events (last 24 hours)
('123e4567-e89b-12d3-a456-426614174000', 'usr123', 'admin@testco.com', 'super_admin', 'sess015', 'view_audit_logs', 'audit', NULL, 'audit_logs_page', 'GET', '/api/admin/audit-logs', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NULL, '{"filters": {"severity": "critical"}}', 'success', NULL, 'info', 'audit', 'view_audit_logs', NOW() - INTERVAL '1 hour'),
(NULL, 'system', 'system@erp.com', 'system', 'sys001', 'system_backup', 'system', NULL, 'database_backup', NULL, NULL, NULL, 'System Backup Service', '{"backup_type": "incremental"}', '{"backup_completed": true, "size_mb": 1024}', 'success', NULL, 'info', 'system', NULL, NOW() - INTERVAL '2 hours'),
(NULL, 'system', 'system@erp.com', 'system', 'sys002', 'security_scan', 'system', NULL, 'vulnerability_scan', NULL, NULL, NULL, 'Security Scanner', NULL, '{"vulnerabilities_found": 0, "scan_duration": "45s"}', 'success', NULL, 'info', 'security', NULL, NOW() - INTERVAL '3 hours');

-- Add some more entries to reach a good sample size
INSERT INTO audit_logs (
    tenant_id, user_id, user_email, user_role, session_id, action, resource_type, resource_id,
    resource_name, http_method, endpoint, ip_address, status, severity, module_code, performed_at
) VALUES
('123e4567-e89b-12d3-a456-426614174000', 'usr123', 'admin@testco.com', 'super_admin', 'sess016', 'export_audit_logs', 'audit', NULL, 'audit_export', 'GET', '/api/admin/audit-logs/export', '192.168.1.100', 'success', 'info', 'audit', NOW() - INTERVAL '30 minutes'),
('123e4567-e89b-12d3-a456-426614174001', 'usr124', 'manager@devco.com', 'tenant_admin', 'sess017', 'update_settings', 'settings', 'set001', 'notification_preferences', 'PUT', '/api/settings', '10.0.1.50', 'success', 'info', 'core', NOW() - INTERVAL '45 minutes'),
('123e4567-e89b-12d3-a456-426614174000', 'usr125', 'newuser@testco.com', 'user', 'sess018', 'view_dashboard', 'dashboard', NULL, 'main_dashboard', 'GET', '/api/dashboard', '192.168.1.150', 'success', 'info', 'core', NOW() - INTERVAL '15 minutes'),
(NULL, NULL, 'bot@crawler.com', NULL, 'sess019', 'blocked_request', 'security', NULL, 'rate_limit', 'POST', '/api/auth/login', '203.0.113.200', 'failed', 'warning', 'security', NOW() - INTERVAL '5 minutes');

-- Create indexes for better query performance on audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_at ON audit_logs(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module_code ON audit_logs(module_code);

-- Create a view for security alerts (frequently accessed)
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

-- Create a summary stats view for dashboard widgets
CREATE OR REPLACE VIEW audit_stats_daily AS
SELECT 
    DATE(performed_at) as date,
    COUNT(*) as total_events,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_events,
    COUNT(*) FILTER (WHERE severity = 'warning') as warning_events,
    COUNT(*) FILTER (WHERE severity = 'error') as error_events,
    COUNT(*) FILTER (WHERE severity = 'critical') as critical_events,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT action) as unique_actions
FROM audit_logs
WHERE performed_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(performed_at)
ORDER BY date DESC;