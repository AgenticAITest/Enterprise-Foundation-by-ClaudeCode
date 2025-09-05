import { Pool } from 'pg';
import { AppError } from '../middleware/error-handler.js';

export interface UserModuleRole {
  id: string;
  user_id: string;
  module_code: string;
  role_id: string;
  assigned_by: string;
  assigned_at: Date;
  valid_from?: Date;
  valid_until?: Date;
  is_active: boolean;
}

export interface UserRoleAssignment {
  user_id: string;
  module_code: string;
  role_id: string;
  role_name: string;
  assigned_by: string;
  assigned_at: Date;
  is_temporary: boolean;
  valid_until?: Date;
}

export class UserRoleService {
  constructor(private db: Pool) {}

  async getUserModuleRoles(tenantId: string, userId: string): Promise<UserRoleAssignment[]> {
    const query = `
      SELECT 
        umr.user_id,
        umr.module_code,
        umr.role_id,
        r.name as role_name,
        umr.assigned_by,
        umr.assigned_at,
        umr.valid_until IS NOT NULL as is_temporary,
        umr.valid_until
      FROM ${tenantId}.user_module_roles umr
      JOIN ${tenantId}.roles r ON umr.role_id = r.id
      WHERE umr.user_id = $1 AND umr.is_active = true
      ORDER BY umr.module_code, r.name
    `;
    
    const result = await this.db.query(query, [userId]);
    return result.rows;
  }

  async getUserRoleInModule(tenantId: string, userId: string, moduleCode: string): Promise<UserRoleAssignment | null> {
    const query = `
      SELECT 
        umr.user_id,
        umr.module_code,
        umr.role_id,
        r.name as role_name,
        umr.assigned_by,
        umr.assigned_at,
        umr.valid_until IS NOT NULL as is_temporary,
        umr.valid_until
      FROM ${tenantId}.user_module_roles umr
      JOIN ${tenantId}.roles r ON umr.role_id = r.id
      WHERE umr.user_id = $1 AND umr.module_code = $2 AND umr.is_active = true
    `;
    
    const result = await this.db.query(query, [userId, moduleCode]);
    return result.rows[0] || null;
  }

  async assignUserToRole(
    tenantId: string, 
    assignment: {
      user_id: string;
      module_code: string;
      role_id: string;
      assigned_by: string;
      valid_from?: Date;
      valid_until?: Date;
    }
  ): Promise<UserModuleRole> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Validate that user exists in tenant
      const userCheck = await client.query(
        `SELECT id FROM ${tenantId}.users WHERE id = $1`,
        [assignment.user_id]
      );
      
      if (userCheck.rows.length === 0) {
        throw new AppError('User not found in this tenant', 404);
      }

      // Validate that role exists and belongs to the module
      const roleCheck = await client.query(
        `SELECT id FROM ${tenantId}.roles WHERE id = $1 AND module_code = $2`,
        [assignment.role_id, assignment.module_code]
      );
      
      if (roleCheck.rows.length === 0) {
        throw new AppError('Role not found for this module', 404);
      }

      // Check if tenant has the module activated
      const moduleCheck = await client.query(
        'SELECT id FROM tenant_modules WHERE tenant_id = $1 AND module_code = $2 AND is_active = true',
        [tenantId.replace('tenant_', ''), assignment.module_code]
      );
      
      if (moduleCheck.rows.length === 0) {
        throw new AppError('Module not activated for this tenant', 400);
      }

      // Deactivate existing role assignment for this user and module
      await client.query(
        `UPDATE ${tenantId}.user_module_roles 
         SET is_active = false, updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = $1 AND module_code = $2 AND is_active = true`,
        [assignment.user_id, assignment.module_code]
      );

      // Create new role assignment
      const insertQuery = `
        INSERT INTO ${tenantId}.user_module_roles (
          user_id, module_code, role_id, assigned_by, valid_from, valid_until, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, true)
        RETURNING *
      `;
      
      const result = await client.query(insertQuery, [
        assignment.user_id,
        assignment.module_code,
        assignment.role_id,
        assignment.assigned_by,
        assignment.valid_from || new Date(),
        assignment.valid_until || null
      ]);

      await client.query('COMMIT');
      return result.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async removeUserFromModule(tenantId: string, userId: string, moduleCode: string): Promise<void> {
    const query = `
      UPDATE ${tenantId}.user_module_roles 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = $1 AND module_code = $2 AND is_active = true
    `;
    
    const result = await this.db.query(query, [userId, moduleCode]);
    
    if (result.rowCount === 0) {
      throw new AppError('User role assignment not found', 404);
    }
  }

  async updateUserRoleInModule(
    tenantId: string,
    userId: string,
    moduleCode: string,
    newRoleId: string,
    assignedBy: string,
    validUntil?: Date
  ): Promise<UserModuleRole> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Validate new role
      const roleCheck = await client.query(
        `SELECT id FROM ${tenantId}.roles WHERE id = $1 AND module_code = $2`,
        [newRoleId, moduleCode]
      );
      
      if (roleCheck.rows.length === 0) {
        throw new AppError('New role not found for this module', 404);
      }

      // Remove current assignment
      await this.removeUserFromModule(tenantId, userId, moduleCode);

      // Create new assignment
      const newAssignment = await this.assignUserToRole(tenantId, {
        user_id: userId,
        module_code: moduleCode,
        role_id: newRoleId,
        assigned_by: assignedBy,
        valid_until: validUntil
      });

      await client.query('COMMIT');
      return newAssignment;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async bulkAssignUsersToRole(
    tenantId: string,
    userIds: string[],
    moduleCode: string,
    roleId: string,
    assignedBy: string
  ): Promise<UserModuleRole[]> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      const results: UserModuleRole[] = [];

      for (const userId of userIds) {
        try {
          const assignment = await this.assignUserToRole(tenantId, {
            user_id: userId,
            module_code: moduleCode,
            role_id: roleId,
            assigned_by: assignedBy
          });
          results.push(assignment);
        } catch (error) {
          // Log error but continue with other users
          console.error(`Failed to assign role to user ${userId}:`, error);
        }
      }

      await client.query('COMMIT');
      return results;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getModuleUsers(tenantId: string, moduleCode: string): Promise<Array<{
    user_id: string;
    email: string;
    first_name: string;
    last_name: string;
    role_id: string;
    role_name: string;
    assigned_at: Date;
    is_temporary: boolean;
    valid_until?: Date;
  }>> {
    const query = `
      SELECT 
        u.id as user_id,
        u.email,
        u.first_name,
        u.last_name,
        r.id as role_id,
        r.name as role_name,
        umr.assigned_at,
        umr.valid_until IS NOT NULL as is_temporary,
        umr.valid_until
      FROM ${tenantId}.users u
      JOIN ${tenantId}.user_module_roles umr ON u.id = umr.user_id
      JOIN ${tenantId}.roles r ON umr.role_id = r.id
      WHERE umr.module_code = $1 AND umr.is_active = true
      ORDER BY u.last_name, u.first_name
    `;
    
    const result = await this.db.query(query, [moduleCode]);
    return result.rows;
  }

  async getUsersWithoutModuleAccess(tenantId: string, moduleCode: string): Promise<Array<{
    user_id: string;
    email: string;
    first_name: string;
    last_name: string;
  }>> {
    const query = `
      SELECT 
        u.id as user_id,
        u.email,
        u.first_name,
        u.last_name
      FROM ${tenantId}.users u
      WHERE u.id NOT IN (
        SELECT DISTINCT user_id 
        FROM ${tenantId}.user_module_roles 
        WHERE module_code = $1 AND is_active = true
      )
      AND u.is_active = true
      ORDER BY u.last_name, u.first_name
    `;
    
    const result = await this.db.query(query, [moduleCode]);
    return result.rows;
  }

  async createTemporaryRoleAssignment(
    tenantId: string,
    userId: string,
    moduleCode: string,
    roleId: string,
    assignedBy: string,
    durationHours: number,
    reason?: string
  ): Promise<UserModuleRole> {
    const validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + durationHours);

    const assignment = await this.assignUserToRole(tenantId, {
      user_id: userId,
      module_code: moduleCode,
      role_id: roleId,
      assigned_by: assignedBy,
      valid_until: validUntil
    });

    // Log temporary assignment for audit
    if (reason) {
      await this.logTemporaryAssignment(tenantId, assignment.id, reason, durationHours);
    }

    return assignment;
  }

  private async logTemporaryAssignment(
    tenantId: string,
    assignmentId: string,
    reason: string,
    durationHours: number
  ): Promise<void> {
    const query = `
      INSERT INTO audit_logs (
        tenant_id, action, resource_type, resource_id, 
        details, performed_by, performed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
    `;
    
    await this.db.query(query, [
      tenantId.replace('tenant_', ''),
      'temporary_role_assignment',
      'user_module_role',
      assignmentId,
      JSON.stringify({ reason, duration_hours: durationHours }),
      'system' // or get from context
    ]);
  }

  async expireTemporaryAssignments(): Promise<number> {
    const query = `
      UPDATE user_module_roles 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP 
      WHERE valid_until <= CURRENT_TIMESTAMP AND is_active = true
    `;
    
    const result = await this.db.query(query);
    return result.rowCount || 0;
  }

  async getUserRoleHistory(tenantId: string, userId: string, limit = 50): Promise<Array<{
    module_code: string;
    role_name: string;
    assigned_by: string;
    assigned_at: Date;
    deactivated_at?: Date;
    is_active: boolean;
  }>> {
    const query = `
      SELECT 
        umr.module_code,
        r.name as role_name,
        umr.assigned_by,
        umr.assigned_at,
        umr.updated_at as deactivated_at,
        umr.is_active
      FROM ${tenantId}.user_module_roles umr
      JOIN ${tenantId}.roles r ON umr.role_id = r.id
      WHERE umr.user_id = $1
      ORDER BY umr.assigned_at DESC
      LIMIT $2
    `;
    
    const result = await this.db.query(query, [userId, limit]);
    return result.rows;
  }
}