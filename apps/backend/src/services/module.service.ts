import { query, tenantQuery } from '../config/database.js';
import { logger } from '../utils/logger.js';

export interface Module {
  id: string;
  code: string;
  name: string;
  description: string;
  version: string;
  is_active: boolean;
  base_price: number;
  price_per_user: number;
  icon: string;
  color: string;
  dependencies?: string[];
  settings_schema?: object;
  created_at: Date;
  updated_at: Date;
}

export interface TenantModule {
  tenant_id: string;
  module_id: string;
  status: 'active' | 'suspended' | 'trial' | 'expired';
  settings: object;
  trial_ends_at?: Date;
  activated_at: Date;
  suspended_at?: Date;
}

export class ModuleService {
  /**
   * Get all available modules
   */
  static async getAllModules(): Promise<Module[]> {
    try {
      const result = await query(
        'SELECT * FROM public.modules WHERE is_active = true ORDER BY name'
      );
      return result.rows;
    } catch (error) {
      logger.error('Error fetching all modules:', error);
      throw new Error('Failed to fetch modules');
    }
  }

  /**
   * Get module by code
   */
  static async getModuleByCode(code: string): Promise<Module | null> {
    try {
      const result = await query(
        'SELECT * FROM public.modules WHERE code = $1 AND is_active = true',
        [code]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Error fetching module ${code}:`, error);
      throw new Error('Failed to fetch module');
    }
  }

  /**
   * Get modules for a specific tenant
   */
  static async getTenantModules(tenantId: string): Promise<(Module & TenantModule)[]> {
    try {
      const result = await query(`
        SELECT m.*, tm.status, tm.settings, tm.trial_ends_at, tm.activated_at, tm.suspended_at
        FROM public.modules m
        JOIN public.tenant_modules tm ON m.id = tm.module_id
        WHERE tm.tenant_id = $1 AND m.is_active = true
        ORDER BY m.name
      `, [tenantId]);
      return result.rows;
    } catch (error) {
      logger.error(`Error fetching tenant modules for ${tenantId}:`, error);
      throw new Error('Failed to fetch tenant modules');
    }
  }

  /**
   * Check if tenant has access to a module
   */
  static async tenantHasModule(tenantId: string, moduleCode: string): Promise<boolean> {
    try {
      const result = await query(`
        SELECT 1 FROM public.tenant_modules tm
        JOIN public.modules m ON tm.module_id = m.id
        WHERE tm.tenant_id = $1 AND m.code = $2 AND tm.status = 'active'
      `, [tenantId, moduleCode]);
      return result.rows.length > 0;
    } catch (error) {
      logger.error(`Error checking tenant module access:`, error);
      return false;
    }
  }

  /**
   * Activate a module for a tenant
   */
  static async activateModuleForTenant(
    tenantId: string, 
    moduleCode: string, 
    settings: object = {},
    isTrialMode = false
  ): Promise<boolean> {
    try {
      // Get module ID
      const moduleResult = await query(
        'SELECT id FROM public.modules WHERE code = $1 AND is_active = true',
        [moduleCode]
      );

      if (moduleResult.rows.length === 0) {
        throw new Error(`Module ${moduleCode} not found`);
      }

      const moduleId = moduleResult.rows[0].id;
      const trialEndDate = isTrialMode ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;

      // Activate module
      await query(`
        INSERT INTO public.tenant_modules (tenant_id, module_id, status, settings, trial_ends_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (tenant_id, module_id) 
        DO UPDATE SET 
          status = $3,
          settings = $4,
          trial_ends_at = $5,
          activated_at = CURRENT_TIMESTAMP,
          suspended_at = NULL,
          updated_at = CURRENT_TIMESTAMP
      `, [tenantId, moduleId, isTrialMode ? 'trial' : 'active', JSON.stringify(settings), trialEndDate]);

      logger.info(`Module ${moduleCode} activated for tenant ${tenantId}`);
      return true;
    } catch (error) {
      logger.error(`Error activating module ${moduleCode} for tenant ${tenantId}:`, error);
      throw new Error('Failed to activate module');
    }
  }

  /**
   * Deactivate a module for a tenant
   */
  static async deactivateModuleForTenant(tenantId: string, moduleCode: string): Promise<boolean> {
    try {
      const result = await query(`
        UPDATE public.tenant_modules tm
        SET status = 'suspended', 
            suspended_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        FROM public.modules m
        WHERE tm.module_id = m.id 
          AND tm.tenant_id = $1 
          AND m.code = $2
      `, [tenantId, moduleCode]);

      if (result.rowCount === 0) {
        throw new Error(`Module ${moduleCode} not found for tenant`);
      }

      logger.info(`Module ${moduleCode} deactivated for tenant ${tenantId}`);
      return true;
    } catch (error) {
      logger.error(`Error deactivating module ${moduleCode} for tenant ${tenantId}:`, error);
      throw new Error('Failed to deactivate module');
    }
  }

  /**
   * Update module settings for a tenant
   */
  static async updateTenantModuleSettings(
    tenantId: string, 
    moduleCode: string, 
    settings: object
  ): Promise<boolean> {
    try {
      const result = await query(`
        UPDATE public.tenant_modules tm
        SET settings = $3, updated_at = CURRENT_TIMESTAMP
        FROM public.modules m
        WHERE tm.module_id = m.id 
          AND tm.tenant_id = $1 
          AND m.code = $2
      `, [tenantId, moduleCode, JSON.stringify(settings)]);

      if (result.rowCount === 0) {
        throw new Error(`Module ${moduleCode} not found for tenant`);
      }

      logger.info(`Module ${moduleCode} settings updated for tenant ${tenantId}`);
      return true;
    } catch (error) {
      logger.error(`Error updating module settings:`, error);
      throw new Error('Failed to update module settings');
    }
  }

  /**
   * Get module statistics
   */
  static async getModuleStatistics(moduleCode: string): Promise<{
    total_tenants: number;
    active_tenants: number;
    trial_tenants: number;
    revenue_monthly: number;
  }> {
    try {
      const result = await query(`
        SELECT 
          COUNT(*) as total_tenants,
          COUNT(CASE WHEN tm.status = 'active' THEN 1 END) as active_tenants,
          COUNT(CASE WHEN tm.status = 'trial' THEN 1 END) as trial_tenants,
          COALESCE(SUM(CASE WHEN tm.status = 'active' THEN m.base_price END), 0) as revenue_monthly
        FROM public.tenant_modules tm
        JOIN public.modules m ON tm.module_id = m.id
        WHERE m.code = $1
      `, [moduleCode]);

      return result.rows[0] || {
        total_tenants: 0,
        active_tenants: 0,
        trial_tenants: 0,
        revenue_monthly: 0
      };
    } catch (error) {
      logger.error(`Error fetching module statistics:`, error);
      throw new Error('Failed to fetch module statistics');
    }
  }

  /**
   * Check module dependencies
   */
  static async checkModuleDependencies(moduleCode: string, tenantId: string): Promise<{
    satisfied: boolean;
    missing: string[];
  }> {
    try {
      const moduleResult = await query(
        'SELECT dependencies FROM public.modules WHERE code = $1',
        [moduleCode]
      );

      if (moduleResult.rows.length === 0) {
        return { satisfied: false, missing: ['Module not found'] };
      }

      const dependencies = moduleResult.rows[0].dependencies || [];
      
      if (dependencies.length === 0) {
        return { satisfied: true, missing: [] };
      }

      // Check which dependencies are missing
      const dependencyCheck = await query(`
        SELECT m.code
        FROM public.modules m
        JOIN public.tenant_modules tm ON m.id = tm.module_id
        WHERE tm.tenant_id = $1 
          AND m.code = ANY($2) 
          AND tm.status = 'active'
      `, [tenantId, dependencies]);

      const activeDependencies = dependencyCheck.rows.map(row => row.code);
      const missing = dependencies.filter(dep => !activeDependencies.includes(dep));

      return {
        satisfied: missing.length === 0,
        missing
      };
    } catch (error) {
      logger.error(`Error checking module dependencies:`, error);
      return { satisfied: false, missing: ['Error checking dependencies'] };
    }
  }

  /**
   * Activate a module system-wide
   */
  static async activateModule(moduleId: string): Promise<boolean> {
    try {
      // Check if it's a UUID or code
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      const result = uuidRegex.test(moduleId)
        ? await query('UPDATE public.modules SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [moduleId])
        : await query('UPDATE public.modules SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE code = $1', [moduleId]);
      
      return result.rowCount > 0;
    } catch (error) {
      logger.error(`Error activating module ${moduleId}:`, error);
      throw new Error('Failed to activate module');
    }
  }

  /**
   * Deactivate a module system-wide
   */
  static async deactivateModule(moduleId: string): Promise<boolean> {
    try {
      // Check if it's a UUID or code
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      const result = uuidRegex.test(moduleId)
        ? await query('UPDATE public.modules SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [moduleId])
        : await query('UPDATE public.modules SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE code = $1', [moduleId]);
      
      return result.rowCount > 0;
    } catch (error) {
      logger.error(`Error deactivating module ${moduleId}:`, error);
      throw new Error('Failed to deactivate module');
    }
  }

  /**
   * Get tenants currently using a module
   */
  static async getTenantsUsingModule(moduleId: string): Promise<{ id: string; name: string }[]> {
    try {
      // First, determine if moduleId is a UUID or code and get the actual UUID
      let actualModuleId: string;
      
      // Check if it's a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      if (uuidRegex.test(moduleId)) {
        // It's already a UUID
        actualModuleId = moduleId;
      } else {
        // It's a code, need to get the UUID
        const moduleResult = await query('SELECT id FROM public.modules WHERE code = $1', [moduleId]);
        if (moduleResult.rows.length === 0) {
          // Module doesn't exist, return empty array
          return [];
        }
        actualModuleId = moduleResult.rows[0].id;
      }
      
      // Now query with the UUID
      const result = await query(`
        SELECT DISTINCT t.id, t.company_name as name
        FROM public.tenants t
        JOIN public.tenant_modules tm ON t.id = tm.tenant_id
        WHERE tm.module_id = $1 AND tm.status = 'active'
        ORDER BY t.company_name
      `, [actualModuleId]);
      
      return result.rows;
    } catch (error) {
      logger.error(`Error fetching tenants using module ${moduleId}:`, error);
      throw new Error('Failed to fetch dependent tenants');
    }
  }
}