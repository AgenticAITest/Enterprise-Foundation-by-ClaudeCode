# Database Structure

This directory contains the official database schema and migrations for the ERP SaaS system.

## 🏛️ **Current Schema State**
- **Version**: Advanced RBAC Schema v1.0
- **Migration Status**: All migrations applied ✅
- **Last Updated**: September 3, 2025

## 📁 **Directory Structure**

### `/migrations/` - **SOURCE OF TRUTH** 
The authoritative database schema definitions. **Always use these.**

- `001_modular_rbac_schema.sql` - Core RBAC tables and structure
- `002_role_templates_and_menus.sql` - Role templates and permission resources  
- `003_audit_logs_table.sql` - Audit logging system
- More migrations added over time...

### `/seeds/`
Data seeding scripts for initial setup:
- `001_modules_and_templates.sql` - Default modules and role templates

### `/audit/`
Database maintenance and diagnostic tools:
- `db-audit.sql` - Schema validation and consistency checks

### `/fix/`
Emergency repair scripts (keep for documentation):
- `immediate-schema-fix.sql` - Critical migration that fixed schema inconsistencies

### `/archive/`
**⚠️ DEPRECATED FILES** - Do not use these:
- `schema-original.sql` - Old conflicting schema  
- `01-init-original.sql` - Outdated initialization script

## 🚀 **For New Developers**

### Database Setup:
1. **Start containers**: `docker-compose up -d`
2. **Verify schema**: Run `cat database/audit/db-audit.sql | docker exec -i erp-postgres psql -U erp_admin -d erp_saas`
3. **Should see**: `ADVANCED_RBAC_SCHEMA` detected ✅

### Making Schema Changes:
1. **Never** edit database directly
2. **Always** create new migration files in `/migrations/`
3. **Test** migrations in development first
4. **Document** changes in migration description

## 🔍 **Current Schema Overview**

### Public Tables (10 total):
- `tenants` - Tenant organizations
- `users` - Global user accounts  
- `super_admins` - System administrators
- `modules` - Available ERP modules
- `tenant_modules` - Which modules each tenant has
- `module_role_templates` - Role definitions per module
- `permission_resources` - Controllable resources/permissions
- `audit_logs` - System-wide activity log
- `billing_usage` - Usage tracking
- `schema_migrations` - Migration history

### Tenant-Specific Tables (per tenant schema):
- `roles` - Actual roles for this tenant
- `role_permissions` - Permission assignments  
- `user_module_roles` - User-to-role mappings
- `user_data_scopes` - Data access scopes

## 🚨 **Important Notes**

- **Schema State**: Database was migrated from partial state on Sept 3, 2025
- **Migration Tracking**: Now properly tracked in `schema_migrations` table  
- **No More Confusion**: Conflicting files archived to prevent issues
- **Production Ready**: Schema is now consistent and safe for deployment

## 📞 **Need Help?**

If you see errors related to missing tables or schema inconsistencies:

1. **Check migration status**: Look at `schema_migrations` table
2. **Run audit**: Execute `database/audit/db-audit.sql` 
3. **Should show**: `ADVANCED_RBAC_SCHEMA` detected
4. **If not**: Database may need re-initialization

---

**Last Schema Validation**: September 3, 2025 ✅  
**Migration System Status**: Active ✅  
**Development Safety**: High ✅