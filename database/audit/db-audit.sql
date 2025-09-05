-- Database Schema Audit Script
-- This script examines the current state of the database and reports schema inconsistencies
-- Run this to understand what schema version you're currently on

-- ============================================================================
-- 1. Database and Extension Check
-- ============================================================================
SELECT 'EXTENSIONS' as check_type, extname as name, extversion as version
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pg_trgm')
ORDER BY extname;

-- ============================================================================
-- 2. Schema Existence Check  
-- ============================================================================
SELECT 'SCHEMAS' as check_type, schema_name as name, NULL as version
FROM information_schema.schemata 
WHERE schema_name LIKE 'tenant_%' OR schema_name = 'public'
ORDER BY schema_name;

-- ============================================================================
-- 3. Public Schema Tables Audit
-- ============================================================================
SELECT 
    'PUBLIC_TABLES' as check_type,
    table_name as name,
    'exists' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- ============================================================================
-- 4. Critical Table Structure Analysis
-- ============================================================================

-- Check tenant_modules structure (CRITICAL - multiple possible schemas)
SELECT 
    'TENANT_MODULES_SCHEMA' as check_type,
    column_name as name,
    data_type || 
    CASE WHEN character_maximum_length IS NOT NULL 
         THEN '(' || character_maximum_length || ')' 
         ELSE '' 
    END as data_type_detail
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tenant_modules'
ORDER BY ordinal_position;

-- Check modules table structure
SELECT 
    'MODULES_SCHEMA' as check_type,
    column_name as name,
    data_type ||
    CASE WHEN character_maximum_length IS NOT NULL 
         THEN '(' || character_maximum_length || ')' 
         ELSE '' 
    END as data_type_detail
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'modules'
ORDER BY ordinal_position;

-- Check for RBAC tables (indicates advanced schema)
SELECT 
    'RBAC_TABLES' as check_type,
    table_name as name,
    CASE WHEN table_name IS NOT NULL THEN 'exists' ELSE 'missing' END as status
FROM (
    VALUES 
    ('permission_resources'),
    ('module_role_templates'), 
    ('user_module_roles'),
    ('role_permissions'),
    ('audit_logs')
) expected(table_name)
LEFT JOIN information_schema.tables t ON (
    t.table_schema = 'public' AND 
    t.table_name = expected.table_name
);

-- ============================================================================
-- 5. Data Consistency Checks
-- ============================================================================

-- Check if we have modules data
SELECT 
    'MODULES_DATA' as check_type,
    'count' as name,
    COUNT(*)::text as status
FROM public.modules
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'modules');

-- Check tenant_modules data (if table exists)
SELECT 
    'TENANT_MODULES_DATA' as check_type,
    'count' as name,
    COUNT(*)::text as status  
FROM public.tenant_modules
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenant_modules');

-- Check super_admins
SELECT 
    'SUPER_ADMINS_DATA' as check_type,
    'count' as name,
    COUNT(*)::text as status
FROM public.super_admins
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'super_admins');

-- ============================================================================
-- 6. Foreign Key Constraints Check
-- ============================================================================
SELECT 
    'FOREIGN_KEYS' as check_type,
    tc.constraint_name as name,
    tc.table_name || ' -> ' || ccu.table_name as status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================================================
-- 7. Migration Tracking Check
-- ============================================================================
SELECT 
    'MIGRATION_TRACKING' as check_type,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'schema_migrations'
    ) THEN 'schema_migrations table exists'
    ELSE 'NO MIGRATION TRACKING' 
    END as name,
    'critical' as status;

-- If migration table exists, show applied migrations
SELECT 
    'APPLIED_MIGRATIONS' as check_type,
    version as name,
    applied_at::text as status
FROM public.schema_migrations
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'schema_migrations')
ORDER BY version;

-- ============================================================================
-- 8. Schema Version Detection
-- ============================================================================
SELECT 
    'SCHEMA_VERSION_DETECTION' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'modules')
         AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'permission_resources')
         AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenant_modules' AND column_name = 'module_id')
        THEN 'ADVANCED_RBAC_SCHEMA'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'modules')
         AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenant_modules' AND column_name = 'module_name')
        THEN 'MIXED_SCHEMA_INCONSISTENT'
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenant_modules' AND column_name = 'module_name')
        THEN 'ORIGINAL_SIMPLE_SCHEMA'
        ELSE 'UNKNOWN_OR_BROKEN_SCHEMA'
    END as name,
    'detected' as status;