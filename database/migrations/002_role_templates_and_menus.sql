-- ============================================================================
-- MODULAR ERP RBAC SYSTEM - ROLE TEMPLATES AND MENU STRUCTURE
-- Migration: 002_role_templates_and_menus.sql
-- Description: Create role templates and permission resources (menu structure)
-- ============================================================================

-- ============================================================================
-- 1. MODULE ROLE TEMPLATES TABLE
-- ============================================================================

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

-- ============================================================================
-- 2. PERMISSION RESOURCES TABLE (Menu Structure)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.permission_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
    resource_code VARCHAR(100) NOT NULL,
    resource_name VARCHAR(200) NOT NULL,
    resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('menu', 'api', 'report', 'widget', 'data')),
    parent_resource_id UUID REFERENCES public.permission_resources(id) ON DELETE CASCADE,
    path VARCHAR(500),  -- URL path or route
    icon VARCHAR(100),  -- CSS icon class
    sort_order INTEGER DEFAULT 0,
    is_leaf BOOLEAN DEFAULT false,  -- Only leaf menus can have permissions attached
    permission_levels TEXT[] DEFAULT ARRAY['manage', 'view_only', 'no_access'],  -- Available permission levels
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(module_id, resource_code)
);

-- ============================================================================
-- 3. INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_module_role_templates_module ON public.module_role_templates(module_id);
CREATE INDEX IF NOT EXISTS idx_permission_resources_module ON public.permission_resources(module_id);
CREATE INDEX IF NOT EXISTS idx_permission_resources_parent ON public.permission_resources(parent_resource_id);
CREATE INDEX IF NOT EXISTS idx_permission_resources_leaf ON public.permission_resources(is_leaf);

-- ============================================================================
-- 4. INSERT CORE MODULE ROLE TEMPLATES
-- ============================================================================

-- Get Core module ID for templates
DO $$
DECLARE
    core_module_id UUID;
BEGIN
    SELECT id INTO core_module_id FROM public.modules WHERE code = 'core';
    
    IF core_module_id IS NOT NULL THEN
        -- Core Module Role Templates
        INSERT INTO public.module_role_templates (module_id, role_code, role_name, description, is_system, sort_order, default_permissions) VALUES
        (core_module_id, 'tenant_admin', 'Tenant Administrator', 'Full access to all tenant settings and all modules', true, 1, '{"all_resources": {"permission": "manage"}}'::jsonb),
        (core_module_id, 'manager', 'Manager', 'Can manage most administrative functions', false, 2, '{"dashboard": {"permission": "view_only"}, "settings": {"general": "manage", "user_management": "view_only", "master_data": "manage", "integration": "view_only", "system": "view_only"}}'::jsonb),
        (core_module_id, 'user', 'Regular User', 'Basic user with limited access', false, 3, '{"dashboard": {"permission": "view_only"}, "settings": {"general": "view_only", "master_data": "view_only"}}'::jsonb)
        ON CONFLICT (module_id, role_code) DO NOTHING;
    END IF;
END $$;

-- ============================================================================
-- 5. INSERT WMS MODULE ROLE TEMPLATES  
-- ============================================================================

DO $$
DECLARE
    wms_module_id UUID;
BEGIN
    SELECT id INTO wms_module_id FROM public.modules WHERE code = 'wms';
    
    IF wms_module_id IS NOT NULL THEN
        -- WMS Module Role Templates
        INSERT INTO public.module_role_templates (module_id, role_code, role_name, description, is_system, sort_order, default_permissions) VALUES
        (wms_module_id, 'warehouse_admin', 'Warehouse Administrator', 'Full control over all warehouse operations and settings', true, 1, '{"all_resources": {"permission": "manage"}}'::jsonb),
        (wms_module_id, 'warehouse_manager', 'Warehouse Manager', 'Manages daily warehouse operations and staff', false, 2, '{"dashboard": {"permission": "view_only"}, "inbound": {"permission": "manage"}, "outbound": {"permission": "manage"}, "inventory_ops": {"permission": "manage"}, "workflow_monitor": {"permission": "manage"}, "reports": {"permission": "view_only"}, "settings": {"general": "manage", "user_management": "manage", "master_data": "manage", "warehouse_setup": "manage", "workflow_setting": "manage"}}'::jsonb),
        (wms_module_id, 'warehouse_supervisor', 'Warehouse Supervisor', 'Supervises specific warehouse areas and processes', false, 3, '{"dashboard": {"permission": "view_only"}, "inbound": {"permission": "manage"}, "outbound": {"permission": "manage"}, "inventory_ops": {"stock_overview": "view_only", "cycle_count": "manage", "relocation": "manage", "adjustment": "view_only"}, "workflow_monitor": {"view": "view_only"}, "reports": {"permission": "view_only"}}'::jsonb),
        (wms_module_id, 'warehouse_worker', 'Warehouse Worker', 'Executes basic warehouse tasks like picking and receiving', false, 4, '{"dashboard": {"permission": "view_only"}, "inbound": {"receive_items": "manage", "putaway": "manage"}, "outbound": {"pick": "manage", "pack": "manage"}, "inventory_ops": {"cycle_count": "manage", "relocation": "manage"}}'::jsonb)
        ON CONFLICT (module_id, role_code) DO NOTHING;
    END IF;
END $$;

-- ============================================================================
-- 6. INSERT CORE MODULE MENU STRUCTURE (Standard in ALL modules)
-- ============================================================================

DO $$
DECLARE
    core_module_id UUID;
    settings_id UUID;
BEGIN
    SELECT id INTO core_module_id FROM public.modules WHERE code = 'core';
    
    IF core_module_id IS NOT NULL THEN
        -- Level 1: Dashboard (leaf)
        INSERT INTO public.permission_resources (module_id, resource_code, resource_name, resource_type, path, icon, sort_order, is_leaf, permission_levels) VALUES
        (core_module_id, 'dashboard', 'Dashboard', 'menu', '/dashboard', 'fas fa-tachometer-alt', 1, true, ARRAY['view_only'])
        ON CONFLICT (module_id, resource_code) DO NOTHING;
        
        -- Level 1: Settings (parent)
        INSERT INTO public.permission_resources (module_id, resource_code, resource_name, resource_type, path, icon, sort_order, is_leaf, permission_levels) VALUES
        (core_module_id, 'settings', 'Settings', 'menu', '/settings', 'fas fa-cog', 2, false, ARRAY[]::TEXT[])
        ON CONFLICT (module_id, resource_code) DO NOTHING;
        
        -- Get Settings parent ID
        SELECT id INTO settings_id FROM public.permission_resources WHERE module_id = core_module_id AND resource_code = 'settings';
        
        -- Level 2: Settings sub-menus (all leaf)
        INSERT INTO public.permission_resources (module_id, resource_code, resource_name, resource_type, parent_resource_id, path, icon, sort_order, is_leaf, permission_levels) VALUES
        (core_module_id, 'settings_general', 'General', 'menu', settings_id, '/settings/general', 'fas fa-sliders-h', 1, true, ARRAY['manage', 'view_only', 'no_access']),
        (core_module_id, 'settings_user_management', 'User Management', 'menu', settings_id, '/settings/users', 'fas fa-users', 2, true, ARRAY['manage', 'view_only', 'no_access']),
        (core_module_id, 'settings_master_data', 'Master Data', 'menu', settings_id, '/settings/master-data', 'fas fa-database', 3, true, ARRAY['manage', 'view_only', 'no_access']),
        (core_module_id, 'settings_integration', 'Integration', 'menu', settings_id, '/settings/integration', 'fas fa-plug', 4, true, ARRAY['manage', 'view_only', 'no_access']),
        (core_module_id, 'settings_system', 'System', 'menu', settings_id, '/settings/system', 'fas fa-server', 5, true, ARRAY['manage', 'view_only', 'no_access'])
        ON CONFLICT (module_id, resource_code) DO NOTHING;
    END IF;
END $$;

-- ============================================================================
-- 7. INSERT WMS MODULE MENU STRUCTURE  
-- ============================================================================

DO $$
DECLARE
    wms_module_id UUID;
    core_module_id UUID;
    -- Level 1 menu IDs
    inbound_id UUID;
    outbound_id UUID;
    inventory_ops_id UUID;
    workflow_monitor_id UUID;
    reports_id UUID;
    settings_id UUID;
    -- Level 2 menu IDs
    cycle_count_id UUID;
BEGIN
    SELECT id INTO wms_module_id FROM public.modules WHERE code = 'wms';
    SELECT id INTO core_module_id FROM public.modules WHERE code = 'core';
    
    IF wms_module_id IS NOT NULL THEN
        -- Copy Core module menus to WMS (standard menus in all modules)
        INSERT INTO public.permission_resources (module_id, resource_code, resource_name, resource_type, parent_resource_id, path, icon, sort_order, is_leaf, permission_levels)
        SELECT wms_module_id, resource_code, resource_name, resource_type, 
               CASE 
                   WHEN parent_resource_id IS NOT NULL THEN 
                       (SELECT pr2.id FROM public.permission_resources pr2 
                        WHERE pr2.module_id = wms_module_id 
                        AND pr2.resource_code = (SELECT resource_code FROM public.permission_resources WHERE id = pr.parent_resource_id))
                   ELSE NULL
               END,
               path, icon, sort_order, is_leaf, permission_levels
        FROM public.permission_resources pr
        WHERE pr.module_id = core_module_id
        ON CONFLICT (module_id, resource_code) DO NOTHING;
        
        -- WMS-specific Level 1 menus (parents)
        INSERT INTO public.permission_resources (module_id, resource_code, resource_name, resource_type, path, icon, sort_order, is_leaf) VALUES
        (wms_module_id, 'inbound', 'Inbound', 'menu', '/wms/inbound', 'fas fa-truck', 10, false),
        (wms_module_id, 'outbound', 'Outbound', 'menu', '/wms/outbound', 'fas fa-shipping-fast', 11, false),
        (wms_module_id, 'inventory_ops', 'Inventory Ops', 'menu', '/wms/inventory', 'fas fa-boxes', 12, false),
        (wms_module_id, 'workflow_monitor', 'Workflow Monitor', 'menu', '/wms/workflow', 'fas fa-monitor-heart-rate', 13, false),
        (wms_module_id, 'reports', 'Reports', 'menu', '/wms/reports', 'fas fa-chart-bar', 14, false)
        ON CONFLICT (module_id, resource_code) DO NOTHING;
        
        -- Get Level 1 parent IDs
        SELECT id INTO inbound_id FROM public.permission_resources WHERE module_id = wms_module_id AND resource_code = 'inbound';
        SELECT id INTO outbound_id FROM public.permission_resources WHERE module_id = wms_module_id AND resource_code = 'outbound';
        SELECT id INTO inventory_ops_id FROM public.permission_resources WHERE module_id = wms_module_id AND resource_code = 'inventory_ops';
        SELECT id INTO workflow_monitor_id FROM public.permission_resources WHERE module_id = wms_module_id AND resource_code = 'workflow_monitor';
        SELECT id INTO reports_id FROM public.permission_resources WHERE module_id = wms_module_id AND resource_code = 'reports';
        SELECT id INTO settings_id FROM public.permission_resources WHERE module_id = wms_module_id AND resource_code = 'settings';
        
        -- Level 2: Inbound sub-menus (all leaf)
        INSERT INTO public.permission_resources (module_id, resource_code, resource_name, resource_type, parent_resource_id, path, icon, sort_order, is_leaf, permission_levels) VALUES
        (wms_module_id, 'purchase_orders', 'Purchase Orders', 'menu', inbound_id, '/wms/inbound/purchase-orders', 'fas fa-file-invoice', 1, true, ARRAY['manage', 'view_only', 'no_access']),
        (wms_module_id, 'approve_po', 'Approve PO', 'menu', inbound_id, '/wms/inbound/approve-po', 'fas fa-check-circle', 2, true, ARRAY['manage', 'view_only', 'no_access']),
        (wms_module_id, 'receive_items', 'Receive Items', 'menu', inbound_id, '/wms/inbound/receive', 'fas fa-dolly', 3, true, ARRAY['manage', 'view_only', 'no_access']),
        (wms_module_id, 'putaway', 'Putaway', 'menu', inbound_id, '/wms/inbound/putaway', 'fas fa-warehouse', 4, true, ARRAY['manage', 'view_only', 'no_access'])
        ON CONFLICT (module_id, resource_code) DO NOTHING;
        
        -- Level 2: Outbound sub-menus (all leaf)
        INSERT INTO public.permission_resources (module_id, resource_code, resource_name, resource_type, parent_resource_id, path, icon, sort_order, is_leaf, permission_levels) VALUES
        (wms_module_id, 'sales_orders', 'Sales Orders', 'menu', outbound_id, '/wms/outbound/sales-orders', 'fas fa-file-invoice-dollar', 1, true, ARRAY['manage', 'view_only', 'no_access']),
        (wms_module_id, 'allocate', 'Allocate', 'menu', outbound_id, '/wms/outbound/allocate', 'fas fa-random', 2, true, ARRAY['manage', 'view_only', 'no_access']),
        (wms_module_id, 'pick', 'Pick', 'menu', outbound_id, '/wms/outbound/pick', 'fas fa-hand-paper', 3, true, ARRAY['manage', 'view_only', 'no_access']),
        (wms_module_id, 'pack', 'Pack', 'menu', outbound_id, '/wms/outbound/pack', 'fas fa-box', 4, true, ARRAY['manage', 'view_only', 'no_access']),
        (wms_module_id, 'ship', 'Ship', 'menu', outbound_id, '/wms/outbound/ship', 'fas fa-truck-loading', 5, true, ARRAY['manage', 'view_only', 'no_access']),
        (wms_module_id, 'deliver', 'Deliver', 'menu', outbound_id, '/wms/outbound/deliver', 'fas fa-truck-moving', 6, true, ARRAY['manage', 'view_only', 'no_access'])
        ON CONFLICT (module_id, resource_code) DO NOTHING;
        
        -- Level 2: Inventory Ops sub-menus (mix of leaf and parent)
        INSERT INTO public.permission_resources (module_id, resource_code, resource_name, resource_type, parent_resource_id, path, icon, sort_order, is_leaf, permission_levels) VALUES
        (wms_module_id, 'stock_overview', 'Stock Overview', 'menu', inventory_ops_id, '/wms/inventory/stock', 'fas fa-list', 1, true, ARRAY['manage', 'view_only', 'no_access']),
        (wms_module_id, 'cycle_count', 'Cycle Count / Audit', 'menu', inventory_ops_id, '/wms/inventory/cycle-count', 'fas fa-clipboard-check', 2, false, ARRAY[]::TEXT[]),
        (wms_module_id, 'relocation', 'Relocation', 'menu', inventory_ops_id, '/wms/inventory/relocation', 'fas fa-exchange-alt', 3, true, ARRAY['manage', 'view_only', 'no_access']),
        (wms_module_id, 'adjustment', 'Adjustment', 'menu', inventory_ops_id, '/wms/inventory/adjustment', 'fas fa-balance-scale', 4, true, ARRAY['manage', 'view_only', 'no_access'])
        ON CONFLICT (module_id, resource_code) DO NOTHING;
        
        -- Get Cycle Count parent ID
        SELECT id INTO cycle_count_id FROM public.permission_resources WHERE module_id = wms_module_id AND resource_code = 'cycle_count';
        
        -- Level 3: Cycle Count sub-menus (all leaf)
        INSERT INTO public.permission_resources (module_id, resource_code, resource_name, resource_type, parent_resource_id, path, icon, sort_order, is_leaf, permission_levels) VALUES
        (wms_module_id, 'cycle_count_create', 'Create new', 'menu', cycle_count_id, '/wms/inventory/cycle-count/create', 'fas fa-plus', 1, true, ARRAY['manage', 'no_access']),
        (wms_module_id, 'cycle_count_submitted', 'Submitted', 'menu', cycle_count_id, '/wms/inventory/cycle-count/submitted', 'fas fa-paper-plane', 2, true, ARRAY['manage', 'view_only', 'no_access']),
        (wms_module_id, 'cycle_count_history', 'History', 'menu', cycle_count_id, '/wms/inventory/cycle-count/history', 'fas fa-history', 3, true, ARRAY['view_only'])
        ON CONFLICT (module_id, resource_code) DO NOTHING;
        
        -- Level 2: Workflow Monitor sub-menus (all leaf)
        INSERT INTO public.permission_resources (module_id, resource_code, resource_name, resource_type, parent_resource_id, path, icon, sort_order, is_leaf, permission_levels) VALUES
        (wms_module_id, 'workflow_view', 'View', 'menu', workflow_monitor_id, '/wms/workflow/view', 'fas fa-eye', 1, true, ARRAY['view_only']),
        (wms_module_id, 'workflow_override', 'Override', 'menu', workflow_monitor_id, '/wms/workflow/override', 'fas fa-exclamation-triangle', 2, true, ARRAY['manage', 'no_access'])
        ON CONFLICT (module_id, resource_code) DO NOTHING;
        
        -- Level 2: Reports sub-menus (all leaf)
        INSERT INTO public.permission_resources (module_id, resource_code, resource_name, resource_type, parent_resource_id, path, icon, sort_order, is_leaf, permission_levels) VALUES
        (wms_module_id, 'standard_reports', 'Standard Report', 'menu', reports_id, '/wms/reports/standard', 'fas fa-file-alt', 1, true, ARRAY['view_only']),
        (wms_module_id, 'movement_history', 'Movement History', 'menu', reports_id, '/wms/reports/movement', 'fas fa-history', 2, true, ARRAY['view_only']),
        (wms_module_id, 'audit_logs', 'Audit Logs', 'menu', reports_id, '/wms/reports/audit', 'fas fa-clipboard-list', 3, true, ARRAY['view_only']),
        (wms_module_id, 'financial_reports', 'Financial Reports', 'menu', reports_id, '/wms/reports/financial', 'fas fa-chart-line', 4, true, ARRAY['view_only'])
        ON CONFLICT (module_id, resource_code) DO NOTHING;
        
        -- Level 2: WMS-specific Settings (add to existing Settings parent)
        INSERT INTO public.permission_resources (module_id, resource_code, resource_name, resource_type, parent_resource_id, path, icon, sort_order, is_leaf, permission_levels) VALUES
        (wms_module_id, 'settings_warehouse_setup', 'Warehouse Setup', 'menu', settings_id, '/wms/settings/warehouse-setup', 'fas fa-warehouse', 10, true, ARRAY['manage', 'view_only', 'no_access']),
        (wms_module_id, 'settings_workflow_setting', 'Workflow Setting', 'menu', settings_id, '/wms/settings/workflow', 'fas fa-sitemap', 11, true, ARRAY['manage', 'view_only', 'no_access'])
        ON CONFLICT (module_id, resource_code) DO NOTHING;
    END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE NOTIFICATION
-- ============================================================================

SELECT 'Role Templates and Menu Structure Migration Complete' as status;