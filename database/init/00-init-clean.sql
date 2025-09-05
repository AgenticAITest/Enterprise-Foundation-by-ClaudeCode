-- Clean Database Initialization Script
-- This script initializes a fresh database using the proper migration system
-- Use this for new environments to ensure schema consistency

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create migration tracking table
CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- Record initialization
INSERT INTO public.schema_migrations (version, description) 
VALUES ('000_initialization', 'Database initialized with clean migration system')
ON CONFLICT (version) DO NOTHING;

-- Note: Actual schema creation happens through migration files
-- This ensures consistency with the migration system

-- Create a function to check if migrations need to be applied
CREATE OR REPLACE FUNCTION check_migration_status()
RETURNS TABLE(
    migrations_applied INTEGER,
    latest_migration TEXT,
    schema_ready BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM public.schema_migrations) as migrations_applied,
        (SELECT version FROM public.schema_migrations ORDER BY applied_at DESC LIMIT 1) as latest_migration,
        (SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'modules')) as schema_ready;
END;
$$ LANGUAGE plpgsql;

-- Show status
SELECT * FROM check_migration_status();

NOTIFY database_initialized_clean;