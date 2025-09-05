-- ============================================================================
-- MODULAR ERP RBAC SYSTEM - SEED DATA
-- File: 001_modules_and_templates.sql  
-- Description: Insert core modules and role templates
-- ============================================================================

-- ============================================================================
-- 1. CORE MODULES DEFINITION
-- ============================================================================

INSERT INTO public.modules (code, name, description, version, base_price, price_per_user, icon, color, dependencies, settings_schema) VALUES

-- Core Base Module (Always included)
('core', 'Core System', 'Essential system features including user management, settings, and basic reporting', '1.0.0', 0.00, 0.00, 'fas fa-cog', '#6366f1', '[]'::jsonb, '{
  "properties": {
    "company_info": {"type": "object"},
    "localization": {"type": "object"},
    "security_settings": {"type": "object"}
  }
}'::jsonb),

-- Warehouse Management System
('wms', 'Warehouse Management', 'Complete warehouse and inventory management system with receiving, picking, packing, and shipping', '1.0.0', 99.00, 15.00, 'fas fa-warehouse', '#059669', '["core"]'::jsonb, '{
  "properties": {
    "warehouses": {"type": "array"},
    "auto_allocation": {"type": "boolean"},
    "barcode_scanning": {"type": "boolean"},
    "cycle_counting": {"type": "boolean"}
  }
}'::jsonb),

-- Accounting & Finance
('accounting', 'Accounting & Finance', 'Full accounting system with general ledger, accounts payable/receivable, and financial reporting', '1.0.0', 149.00, 25.00, 'fas fa-calculator', '#dc2626', '["core"]'::jsonb, '{
  "properties": {
    "chart_of_accounts": {"type": "object"},
    "multi_currency": {"type": "boolean"},
    "tax_calculation": {"type": "boolean"},
    "bank_reconciliation": {"type": "boolean"}
  }
}'::jsonb),

-- Point of Sale
('pos', 'Point of Sale', 'Multi-store POS system with inventory integration, customer management, and sales reporting', '1.0.0', 79.00, 12.00, 'fas fa-cash-register', '#f59e0b', '["core", "inventory"]'::jsonb, '{
  "properties": {
    "stores": {"type": "array"},
    "payment_methods": {"type": "array"},
    "loyalty_program": {"type": "boolean"},
    "offline_mode": {"type": "boolean"}
  }
}'::jsonb),

-- Human Resources
('hr', 'Human Resources', 'HR management with employee records, payroll, time tracking, and performance management', '1.0.0', 89.00, 18.00, 'fas fa-users', '#8b5cf6', '["core"]'::jsonb, '{
  "properties": {
    "departments": {"type": "array"},
    "payroll_integration": {"type": "boolean"},
    "time_tracking": {"type": "boolean"},
    "performance_reviews": {"type": "boolean"}
  }
}'::jsonb),

-- Inventory Management
('inventory', 'Inventory Management', 'Advanced inventory control with multi-location tracking, cost management, and forecasting', '1.0.0', 69.00, 10.00, 'fas fa-boxes', '#10b981', '["core"]'::jsonb, '{
  "properties": {
    "locations": {"type": "array"},
    "lot_tracking": {"type": "boolean"},
    "serial_tracking": {"type": "boolean"},
    "demand_forecasting": {"type": "boolean"}
  }
}'::jsonb),

-- Customer Relationship Management
('crm', 'CRM & Sales', 'Customer relationship management with lead tracking, opportunity management, and sales pipeline', '1.0.0', 119.00, 20.00, 'fas fa-handshake', '#3b82f6', '["core"]'::jsonb, '{
  "properties": {
    "sales_stages": {"type": "array"},
    "lead_scoring": {"type": "boolean"},
    "email_integration": {"type": "boolean"},
    "marketing_automation": {"type": "boolean"}
  }
}'::jsonb),

-- Project Management  
('project', 'Project Management', 'Project planning, task management, time tracking, and resource allocation', '1.0.0', 59.00, 8.00, 'fas fa-project-diagram', '#14b8a6', '["core", "hr"]'::jsonb, '{
  "properties": {
    "project_templates": {"type": "array"},
    "gantt_charts": {"type": "boolean"},
    "time_tracking": {"type": "boolean"},
    "resource_allocation": {"type": "boolean"}
  }
}'::jsonb),

-- Procurement & Purchasing
('procurement', 'Procurement', 'Purchase order management, vendor management, and procurement analytics', '1.0.0', 79.00, 12.00, 'fas fa-shopping-cart', '#f97316', '["core", "inventory"]'::jsonb, '{
  "properties": {
    "approval_workflows": {"type": "boolean"},
    "vendor_portal": {"type": "boolean"},
    "contract_management": {"type": "boolean"},
    "spend_analytics": {"type": "boolean"}
  }
}'::jsonb),

-- Manufacturing (Future)
('manufacturing', 'Manufacturing', 'Production planning, work orders, bill of materials, and quality control', '1.0.0', 199.00, 30.00, 'fas fa-industry', '#6b7280', '["core", "inventory", "wms"]'::jsonb, '{
  "properties": {
    "work_centers": {"type": "array"},
    "quality_control": {"type": "boolean"},
    "capacity_planning": {"type": "boolean"},
    "shop_floor_control": {"type": "boolean"}
  }
}'::jsonb)

ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    version = EXCLUDED.version,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- 2. PERMISSION RESOURCES DEFINITION  
-- ============================================================================

-- CORE Module Resources
INSERT INTO public.permission_resources (module_id, resource_code, resource_name, resource_type, path, sort_order, actions, data_scope_types) 
SELECT m.id, * FROM (
    SELECT 'dashboard' as resource_code, 'Dashboard' as resource_name, 'menu' as resource_type, '/dashboard' as path, 1 as sort_order, ARRAY['view'] as actions, ARRAY[]::TEXT[] as data_scope_types
    UNION ALL SELECT 'user_management', 'User Management', 'menu', '/users', 2, ARRAY['view', 'create', 'edit', 'delete'], ARRAY['department', 'location']
    UNION ALL SELECT 'role_management', 'Role Management', 'menu', '/roles', 3, ARRAY['view', 'create', 'edit', 'delete'], ARRAY[]::TEXT[]
    UNION ALL SELECT 'tenant_settings', 'Tenant Settings', 'menu', '/settings', 4, ARRAY['view', 'edit'], ARRAY[]::TEXT[]
    UNION ALL SELECT 'audit_logs', 'Audit Logs', 'menu', '/audit', 5, ARRAY['view', 'export'], ARRAY[]::TEXT[]
    UNION ALL SELECT 'reports', 'System Reports', 'menu', '/reports', 6, ARRAY['view', 'export'], ARRAY[]::TEXT[]
) r
CROSS JOIN public.modules m 
WHERE m.code = 'core'
ON CONFLICT (module_id, resource_code) DO NOTHING;

-- WMS Module Resources
INSERT INTO public.permission_resources (module_id, resource_code, resource_name, resource_type, path, sort_order, actions, data_scope_types)
SELECT m.id, * FROM (
    SELECT 'wms_dashboard' as resource_code, 'WMS Dashboard' as resource_name, 'menu' as resource_type, '/wms' as path, 1 as sort_order, ARRAY['view'] as actions, ARRAY['warehouse', 'location']::TEXT[] as data_scope_types
    UNION ALL SELECT 'inventory_management', 'Inventory Management', 'menu', '/wms/inventory', 2, ARRAY['view', 'create', 'edit', 'delete'], ARRAY['warehouse', 'location', 'product_category']
    UNION ALL SELECT 'receiving', 'Receiving', 'menu', '/wms/receiving', 3, ARRAY['view', 'create', 'edit', 'process'], ARRAY['warehouse', 'dock']
    UNION ALL SELECT 'picking', 'Picking & Packing', 'menu', '/wms/picking', 4, ARRAY['view', 'create', 'process'], ARRAY['warehouse', 'zone']
    UNION ALL SELECT 'shipping', 'Shipping', 'menu', '/wms/shipping', 5, ARRAY['view', 'create', 'edit', 'process'], ARRAY['warehouse', 'carrier']
    UNION ALL SELECT 'locations', 'Location Management', 'menu', '/wms/locations', 6, ARRAY['view', 'create', 'edit', 'delete'], ARRAY['warehouse']
    UNION ALL SELECT 'cycle_counting', 'Cycle Counting', 'menu', '/wms/counting', 7, ARRAY['view', 'create', 'edit', 'approve'], ARRAY['warehouse', 'location']
    UNION ALL SELECT 'wms_reports', 'WMS Reports', 'menu', '/wms/reports', 8, ARRAY['view', 'export'], ARRAY['warehouse']
) r
CROSS JOIN public.modules m 
WHERE m.code = 'wms'
ON CONFLICT (module_id, resource_code) DO NOTHING;

-- Accounting Module Resources  
INSERT INTO public.permission_resources (module_id, resource_code, resource_name, resource_type, path, sort_order, actions, data_scope_types)
SELECT m.id, * FROM (
    SELECT 'accounting_dashboard' as resource_code, 'Accounting Dashboard' as resource_name, 'menu' as resource_type, '/accounting' as path, 1 as sort_order, ARRAY['view'] as actions, ARRAY['company', 'department']::TEXT[] as data_scope_types
    UNION ALL SELECT 'general_ledger', 'General Ledger', 'menu', '/accounting/gl', 2, ARRAY['view', 'create', 'edit'], ARRAY['company', 'account_type']
    UNION ALL SELECT 'accounts_payable', 'Accounts Payable', 'menu', '/accounting/ap', 3, ARRAY['view', 'create', 'edit', 'approve'], ARRAY['vendor', 'department']
    UNION ALL SELECT 'accounts_receivable', 'Accounts Receivable', 'menu', '/accounting/ar', 4, ARRAY['view', 'create', 'edit'], ARRAY['customer', 'department']
    UNION ALL SELECT 'invoicing', 'Invoicing', 'menu', '/accounting/invoices', 5, ARRAY['view', 'create', 'edit', 'send'], ARRAY['customer', 'salesperson']
    UNION ALL SELECT 'financial_reports', 'Financial Reports', 'menu', '/accounting/reports', 6, ARRAY['view', 'export'], ARRAY['company', 'department']
    UNION ALL SELECT 'tax_management', 'Tax Management', 'menu', '/accounting/tax', 7, ARRAY['view', 'edit', 'file'], ARRAY['company']
    UNION ALL SELECT 'bank_reconciliation', 'Bank Reconciliation', 'menu', '/accounting/bank', 8, ARRAY['view', 'create', 'edit', 'approve'], ARRAY['bank_account']
) r
CROSS JOIN public.modules m 
WHERE m.code = 'accounting'
ON CONFLICT (module_id, resource_code) DO NOTHING;

-- POS Module Resources
INSERT INTO public.permission_resources (module_id, resource_code, resource_name, resource_type, path, sort_order, actions, data_scope_types)
SELECT m.id, * FROM (
    SELECT 'pos_dashboard' as resource_code, 'POS Dashboard' as resource_name, 'menu' as resource_type, '/pos' as path, 1 as sort_order, ARRAY['view'] as actions, ARRAY['store', 'region']::TEXT[] as data_scope_types
    UNION ALL SELECT 'sales_transactions', 'Sales Transactions', 'menu', '/pos/sales', 2, ARRAY['view', 'create', 'edit', 'void'], ARRAY['store', 'terminal', 'cashier']
    UNION ALL SELECT 'store_management', 'Store Management', 'menu', '/pos/stores', 3, ARRAY['view', 'create', 'edit'], ARRAY['region', 'store_type']
    UNION ALL SELECT 'terminal_management', 'Terminal Management', 'menu', '/pos/terminals', 4, ARRAY['view', 'create', 'edit'], ARRAY['store']
    UNION ALL SELECT 'customer_management', 'Customer Management', 'menu', '/pos/customers', 5, ARRAY['view', 'create', 'edit'], ARRAY['store', 'region']
    UNION ALL SELECT 'product_catalog', 'Product Catalog', 'menu', '/pos/products', 6, ARRAY['view', 'create', 'edit'], ARRAY['category', 'store']
    UNION ALL SELECT 'promotions', 'Promotions & Discounts', 'menu', '/pos/promotions', 7, ARRAY['view', 'create', 'edit', 'approve'], ARRAY['store', 'region']
    UNION ALL SELECT 'pos_reports', 'POS Reports', 'menu', '/pos/reports', 8, ARRAY['view', 'export'], ARRAY['store', 'region', 'cashier']
) r
CROSS JOIN public.modules m 
WHERE m.code = 'pos'
ON CONFLICT (module_id, resource_code) DO NOTHING;

-- HR Module Resources
INSERT INTO public.permission_resources (module_id, resource_code, resource_name, resource_type, path, sort_order, actions, data_scope_types)
SELECT m.id, * FROM (
    SELECT 'hr_dashboard' as resource_code, 'HR Dashboard' as resource_name, 'menu' as resource_type, '/hr' as path, 1 as sort_order, ARRAY['view'] as actions, ARRAY['department', 'location']::TEXT[] as data_scope_types
    UNION ALL SELECT 'employee_management', 'Employee Management', 'menu', '/hr/employees', 2, ARRAY['view', 'create', 'edit'], ARRAY['department', 'location', 'manager']
    UNION ALL SELECT 'payroll', 'Payroll', 'menu', '/hr/payroll', 3, ARRAY['view', 'create', 'edit', 'process'], ARRAY['department', 'pay_group']
    UNION ALL SELECT 'time_tracking', 'Time & Attendance', 'menu', '/hr/time', 4, ARRAY['view', 'edit', 'approve'], ARRAY['department', 'manager']
    UNION ALL SELECT 'performance', 'Performance Management', 'menu', '/hr/performance', 5, ARRAY['view', 'create', 'edit'], ARRAY['department', 'manager']
    UNION ALL SELECT 'benefits', 'Benefits Administration', 'menu', '/hr/benefits', 6, ARRAY['view', 'create', 'edit'], ARRAY['employee_type']
    UNION ALL SELECT 'recruitment', 'Recruitment', 'menu', '/hr/recruitment', 7, ARRAY['view', 'create', 'edit'], ARRAY['department', 'position']
    UNION ALL SELECT 'hr_reports', 'HR Reports', 'menu', '/hr/reports', 8, ARRAY['view', 'export'], ARRAY['department', 'location']
) r
CROSS JOIN public.modules m 
WHERE m.code = 'hr'
ON CONFLICT (module_id, resource_code) DO NOTHING;

-- ============================================================================
-- 3. ROLE TEMPLATES DEFINITION
-- ============================================================================

-- CORE Module Role Templates
INSERT INTO public.module_role_templates (module_id, role_code, role_name, description, is_system, sort_order, default_permissions)
SELECT m.id, * FROM (
    SELECT 'tenant_admin' as role_code, 'Tenant Administrator' as role_name, 'Full access to all tenant settings and user management' as description, true as is_system, 1 as sort_order, '{"all_resources": {"actions": ["view", "create", "edit", "delete", "approve"]}, "data_scope": {"type": "all"}}'::jsonb as default_permissions
    UNION ALL SELECT 'system_manager', 'System Manager', 'Can manage system settings and most administrative functions', false, 2, '{"dashboard": {"actions": ["view"]}, "user_management": {"actions": ["view", "create", "edit"]}, "role_management": {"actions": ["view"]}, "tenant_settings": {"actions": ["view", "edit"]}, "reports": {"actions": ["view", "export"]}}'::jsonb
    UNION ALL SELECT 'user_manager', 'User Manager', 'Can manage users but not system settings', false, 3, '{"dashboard": {"actions": ["view"]}, "user_management": {"actions": ["view", "create", "edit"]}, "reports": {"actions": ["view"]}}'::jsonb
    UNION ALL SELECT 'readonly_user', 'Read-Only User', 'Can view data but cannot make changes', false, 4, '{"dashboard": {"actions": ["view"]}, "reports": {"actions": ["view"]}}'::jsonb
) r
CROSS JOIN public.modules m 
WHERE m.code = 'core'
ON CONFLICT (module_id, role_code) DO NOTHING;

-- WMS Module Role Templates
INSERT INTO public.module_role_templates (module_id, role_code, role_name, description, is_system, sort_order, default_permissions)
SELECT m.id, * FROM (
    SELECT 'warehouse_admin' as role_code, 'Warehouse Administrator' as role_name, 'Full control over all warehouse operations and settings' as description, true as is_system, 1 as sort_order, '{"all_resources": {"actions": ["view", "create", "edit", "delete", "process", "approve"]}, "data_scope": {"type": "all"}}'::jsonb as default_permissions
    UNION ALL SELECT 'warehouse_manager', 'Warehouse Manager', 'Manages daily warehouse operations and staff', false, 2, '{"wms_dashboard": {"actions": ["view"]}, "inventory_management": {"actions": ["view", "edit"]}, "receiving": {"actions": ["view", "create", "edit", "process"]}, "picking": {"actions": ["view", "process"]}, "shipping": {"actions": ["view", "create", "edit", "process"]}, "cycle_counting": {"actions": ["view", "create", "edit", "approve"]}, "wms_reports": {"actions": ["view", "export"]}}'::jsonb
    UNION ALL SELECT 'warehouse_supervisor', 'Warehouse Supervisor', 'Supervises specific warehouse areas and processes', false, 3, '{"wms_dashboard": {"actions": ["view"]}, "inventory_management": {"actions": ["view"]}, "receiving": {"actions": ["view", "process"]}, "picking": {"actions": ["view", "process"]}, "shipping": {"actions": ["view", "process"]}, "wms_reports": {"actions": ["view"]}}'::jsonb
    UNION ALL SELECT 'warehouse_worker', 'Warehouse Worker', 'Executes basic warehouse tasks like picking and receiving', false, 4, '{"wms_dashboard": {"actions": ["view"]}, "receiving": {"actions": ["view", "process"]}, "picking": {"actions": ["view", "process"]}, "cycle_counting": {"actions": ["view", "create"]}}'::jsonb
    UNION ALL SELECT 'inventory_auditor', 'Inventory Auditor', 'Reviews and audits inventory accuracy', false, 5, '{"wms_dashboard": {"actions": ["view"]}, "inventory_management": {"actions": ["view"]}, "cycle_counting": {"actions": ["view", "create", "edit", "approve"]}, "wms_reports": {"actions": ["view", "export"]}}'::jsonb
) r
CROSS JOIN public.modules m 
WHERE m.code = 'wms'
ON CONFLICT (module_id, role_code) DO NOTHING;

-- Accounting Module Role Templates
INSERT INTO public.module_role_templates (module_id, role_code, role_name, description, is_system, sort_order, default_permissions)
SELECT m.id, * FROM (
    SELECT 'finance_admin' as role_code, 'Finance Administrator' as role_name, 'Full control over all financial operations and settings' as description, true as is_system, 1 as sort_order, '{"all_resources": {"actions": ["view", "create", "edit", "delete", "approve", "file"]}, "data_scope": {"type": "all"}}'::jsonb as default_permissions
    UNION ALL SELECT 'finance_manager', 'Finance Manager', 'Manages financial operations and approves transactions', false, 2, '{"accounting_dashboard": {"actions": ["view"]}, "general_ledger": {"actions": ["view", "create", "edit"]}, "accounts_payable": {"actions": ["view", "create", "edit", "approve"]}, "accounts_receivable": {"actions": ["view", "create", "edit"]}, "invoicing": {"actions": ["view", "create", "edit", "send"]}, "financial_reports": {"actions": ["view", "export"]}, "bank_reconciliation": {"actions": ["view", "create", "edit", "approve"]}}'::jsonb
    UNION ALL SELECT 'accountant', 'Accountant', 'Processes accounting transactions and maintains records', false, 3, '{"accounting_dashboard": {"actions": ["view"]}, "general_ledger": {"actions": ["view", "create", "edit"]}, "accounts_payable": {"actions": ["view", "create", "edit"]}, "accounts_receivable": {"actions": ["view", "create", "edit"]}, "invoicing": {"actions": ["view", "create", "edit"]}, "bank_reconciliation": {"actions": ["view", "create", "edit"]}}'::jsonb
    UNION ALL SELECT 'bookkeeper', 'Bookkeeper', 'Enters and maintains basic financial records', false, 4, '{"accounting_dashboard": {"actions": ["view"]}, "general_ledger": {"actions": ["view", "create"]}, "accounts_payable": {"actions": ["view", "create"]}, "accounts_receivable": {"actions": ["view", "create"]}, "invoicing": {"actions": ["view", "create"]}}'::jsonb
    UNION ALL SELECT 'expense_submitter', 'Expense Submitter', 'Can submit expenses and view own financial records', false, 5, '{"accounting_dashboard": {"actions": ["view"]}, "accounts_payable": {"actions": ["view", "create"]}, "data_scope": {"type": "own_records"}}'::jsonb
) r
CROSS JOIN public.modules m 
WHERE m.code = 'accounting'
ON CONFLICT (module_id, role_code) DO NOTHING;

-- POS Module Role Templates
INSERT INTO public.module_role_templates (module_id, role_code, role_name, description, is_system, sort_order, default_permissions)
SELECT m.id, * FROM (
    SELECT 'pos_admin' as role_code, 'POS Administrator' as role_name, 'Full control over all POS operations and settings' as description, true as is_system, 1 as sort_order, '{"all_resources": {"actions": ["view", "create", "edit", "delete", "approve", "void"]}, "data_scope": {"type": "all"}}'::jsonb as default_permissions
    UNION ALL SELECT 'regional_manager', 'Regional Manager', 'Manages multiple stores within a region', false, 2, '{"pos_dashboard": {"actions": ["view"]}, "sales_transactions": {"actions": ["view", "void"]}, "store_management": {"actions": ["view", "edit"]}, "customer_management": {"actions": ["view", "create", "edit"]}, "promotions": {"actions": ["view", "create", "edit", "approve"]}, "pos_reports": {"actions": ["view", "export"]}}'::jsonb
    UNION ALL SELECT 'store_manager', 'Store Manager', 'Manages a single store and its operations', false, 3, '{"pos_dashboard": {"actions": ["view"]}, "sales_transactions": {"actions": ["view", "void"]}, "terminal_management": {"actions": ["view", "edit"]}, "customer_management": {"actions": ["view", "create", "edit"]}, "product_catalog": {"actions": ["view", "edit"]}, "pos_reports": {"actions": ["view", "export"]}}'::jsonb
    UNION ALL SELECT 'shift_supervisor', 'Shift Supervisor', 'Supervises cashiers during shifts', false, 4, '{"pos_dashboard": {"actions": ["view"]}, "sales_transactions": {"actions": ["view", "void"]}, "customer_management": {"actions": ["view", "create"]}, "pos_reports": {"actions": ["view"]}}'::jsonb
    UNION ALL SELECT 'cashier', 'Cashier', 'Processes sales transactions at POS terminals', false, 5, '{"sales_transactions": {"actions": ["view", "create"]}, "customer_management": {"actions": ["view", "create"]}, "product_catalog": {"actions": ["view"]}}'::jsonb
) r
CROSS JOIN public.modules m 
WHERE m.code = 'pos'
ON CONFLICT (module_id, role_code) DO NOTHING;

-- HR Module Role Templates
INSERT INTO public.module_role_templates (module_id, role_code, role_name, description, is_system, sort_order, default_permissions)
SELECT m.id, * FROM (
    SELECT 'hr_admin' as role_code, 'HR Administrator' as role_name, 'Full control over all HR operations and employee data' as description, true as is_system, 1 as sort_order, '{"all_resources": {"actions": ["view", "create", "edit", "delete", "process", "approve"]}, "data_scope": {"type": "all"}}'::jsonb as default_permissions
    UNION ALL SELECT 'hr_manager', 'HR Manager', 'Manages HR operations and employee relations', false, 2, '{"hr_dashboard": {"actions": ["view"]}, "employee_management": {"actions": ["view", "create", "edit"]}, "performance": {"actions": ["view", "create", "edit"]}, "benefits": {"actions": ["view", "create", "edit"]}, "recruitment": {"actions": ["view", "create", "edit"]}, "hr_reports": {"actions": ["view", "export"]}}'::jsonb
    UNION ALL SELECT 'payroll_processor', 'Payroll Processor', 'Processes payroll and manages compensation', false, 3, '{"hr_dashboard": {"actions": ["view"]}, "employee_management": {"actions": ["view"]}, "payroll": {"actions": ["view", "create", "edit", "process"]}, "time_tracking": {"actions": ["view", "edit"]}, "benefits": {"actions": ["view", "edit"]}}'::jsonb
    UNION ALL SELECT 'department_manager', 'Department Manager', 'Manages employees within their department', false, 4, '{"hr_dashboard": {"actions": ["view"]}, "employee_management": {"actions": ["view", "edit"]}, "time_tracking": {"actions": ["view", "approve"]}, "performance": {"actions": ["view", "create", "edit"]}, "data_scope": {"type": "department"}}'::jsonb
    UNION ALL SELECT 'employee', 'Employee', 'Can view own HR information and submit requests', false, 5, '{"hr_dashboard": {"actions": ["view"]}, "employee_management": {"actions": ["view"]}, "time_tracking": {"actions": ["view", "create"]}, "benefits": {"actions": ["view"]}, "data_scope": {"type": "own_records"}}'::jsonb
) r
CROSS JOIN public.modules m 
WHERE m.code = 'hr'
ON CONFLICT (module_id, role_code) DO NOTHING;

-- ============================================================================
-- 4. ACTIVATE CORE MODULE FOR EXISTING TENANTS
-- ============================================================================

-- Activate core module for all existing tenants
INSERT INTO public.tenant_modules (tenant_id, module_id, status, settings)
SELECT t.id, m.id, 'active', '{}'::jsonb
FROM public.tenants t
CROSS JOIN public.modules m
WHERE m.code = 'core'
ON CONFLICT (tenant_id, module_id) DO NOTHING;

-- ============================================================================
-- SEED DATA COMPLETE
-- ============================================================================

SELECT 'Module definitions and role templates seeded successfully' as status;