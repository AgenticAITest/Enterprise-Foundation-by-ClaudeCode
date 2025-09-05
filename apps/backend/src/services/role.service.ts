import { Pool } from 'pg';
import { AppError } from '../middleware/error-handler.js';

export interface Role {
  id: string;
  name: string;
  description: string;
  module_code: string;
  tenant_id: string;
  is_custom: boolean;
  based_on_template: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface RoleTemplate {
  id: string;
  module_code: string;
  template_name: string;
  display_name: string;
  description: string;
  default_permissions: any[];
  is_active: boolean;
}

export interface RolePermission {
  role_id: string;
  resource_code: string;
  permission_level: 'manage' | 'view_only' | 'no_access';
}

export class RoleService {
  constructor(private db: Pool) {}

  async getRolesByModule(tenantId: string, moduleCode: string): Promise<Role[]> {
    const query = `
      SELECT r.* 
      FROM ${tenantId}.roles r 
      WHERE r.module_code = $1 
      ORDER BY r.name
    `;
    
    const result = await this.db.query(query, [moduleCode]);
    return result.rows;
  }

  async getRoleById(tenantId: string, roleId: string): Promise<Role | null> {
    const query = `
      SELECT * FROM ${tenantId}.roles 
      WHERE id = $1
    `;
    
    const result = await this.db.query(query, [roleId]);
    return result.rows[0] || null;
  }

  async createRole(tenantId: string, roleData: {
    name: string;
    description: string;
    module_code: string;
    based_on_template?: string;
    permissions?: RolePermission[];
  }): Promise<Role> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Create the role
      const roleQuery = `
        INSERT INTO ${tenantId}.roles (
          name, description, module_code, is_custom, based_on_template
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const roleResult = await client.query(roleQuery, [
        roleData.name,
        roleData.description,
        roleData.module_code,
        true, // All created roles are custom
        roleData.based_on_template || null
      ]);
      
      const role = roleResult.rows[0];

      // If permissions provided, create them
      if (roleData.permissions && roleData.permissions.length > 0) {
        await this.setRolePermissions(client, tenantId, role.id, roleData.permissions);
      }

      await client.query('COMMIT');
      return role;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async createRoleFromTemplate(tenantId: string, templateId: string, customName?: string): Promise<Role> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Get template details
      const template = await this.getRoleTemplate(templateId);
      if (!template) {
        throw new AppError('Role template not found', 404);
      }

      // Create role based on template
      const roleQuery = `
        INSERT INTO ${tenantId}.roles (
          name, description, module_code, is_custom, based_on_template
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const roleResult = await client.query(roleQuery, [
        customName || template.display_name,
        template.description,
        template.module_code,
        !!customName, // Custom if name provided
        template.id
      ]);
      
      const role = roleResult.rows[0];

      // Apply default permissions from template
      if (template.default_permissions && template.default_permissions.length > 0) {
        await this.setRolePermissions(client, tenantId, role.id, template.default_permissions);
      }

      await client.query('COMMIT');
      return role;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateRole(tenantId: string, roleId: string, updates: {
    name?: string;
    description?: string;
    permissions?: RolePermission[];
  }): Promise<Role> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Update role basic info
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      if (updates.name) {
        updateFields.push(`name = $${paramIndex++}`);
        updateValues.push(updates.name);
      }

      if (updates.description) {
        updateFields.push(`description = $${paramIndex++}`);
        updateValues.push(updates.description);
      }

      if (updateFields.length > 0) {
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        updateValues.push(roleId);

        const query = `
          UPDATE ${tenantId}.roles 
          SET ${updateFields.join(', ')} 
          WHERE id = $${paramIndex}
          RETURNING *
        `;
        
        const result = await client.query(query, updateValues);
        
        if (result.rows.length === 0) {
          throw new AppError('Role not found', 404);
        }
      }

      // Update permissions if provided
      if (updates.permissions) {
        await this.setRolePermissions(client, tenantId, roleId, updates.permissions);
      }

      // Get updated role
      const role = await this.getRoleById(tenantId, roleId);
      
      await client.query('COMMIT');
      return role!;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteRole(tenantId: string, roleId: string): Promise<void> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Check if role is in use
      const usageQuery = `
        SELECT COUNT(*) as usage_count 
        FROM ${tenantId}.user_module_roles 
        WHERE role_id = $1
      `;
      
      const usageResult = await client.query(usageQuery, [roleId]);
      
      if (parseInt(usageResult.rows[0].usage_count) > 0) {
        throw new AppError('Cannot delete role that is currently assigned to users', 400);
      }

      // Delete role permissions first
      await client.query(`DELETE FROM ${tenantId}.role_permissions WHERE role_id = $1`, [roleId]);

      // Delete the role
      const deleteResult = await client.query(
        `DELETE FROM ${tenantId}.roles WHERE id = $1`, 
        [roleId]
      );

      if (deleteResult.rowCount === 0) {
        throw new AppError('Role not found', 404);
      }

      await client.query('COMMIT');

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getRolePermissions(tenantId: string, roleId: string): Promise<RolePermission[]> {
    const query = `
      SELECT rp.*, pr.name as resource_name, pr.display_name as resource_display_name
      FROM ${tenantId}.role_permissions rp
      JOIN permission_resources pr ON rp.resource_code = pr.code
      WHERE rp.role_id = $1
      ORDER BY pr.display_order
    `;
    
    const result = await this.db.query(query, [roleId]);
    return result.rows;
  }

  private async setRolePermissions(client: any, tenantId: string, roleId: string, permissions: RolePermission[]): Promise<void> {
    // Delete existing permissions
    await client.query(`DELETE FROM ${tenantId}.role_permissions WHERE role_id = $1`, [roleId]);

    // Insert new permissions
    if (permissions.length > 0) {
      const values = permissions.map((perm, index) => 
        `($1, $${index * 2 + 2}, $${index * 2 + 3})`
      ).join(', ');

      const insertQuery = `
        INSERT INTO ${tenantId}.role_permissions (role_id, resource_code, permission_level)
        VALUES ${values}
      `;

      const params = [roleId, ...permissions.flatMap(p => [p.resource_code, p.permission_level])];
      await client.query(insertQuery, params);
    }
  }

  async getRoleTemplates(moduleCode?: string): Promise<RoleTemplate[]> {
    let query = 'SELECT * FROM module_role_templates WHERE is_active = true';
    const params: any[] = [];

    if (moduleCode) {
      query += ' AND module_code = $1';
      params.push(moduleCode);
    }

    query += ' ORDER BY module_code, display_name';
    
    const result = await this.db.query(query, params);
    return result.rows;
  }

  async getRoleTemplate(templateId: string): Promise<RoleTemplate | null> {
    const query = 'SELECT * FROM module_role_templates WHERE id = $1 AND is_active = true';
    const result = await this.db.query(query, [templateId]);
    return result.rows[0] || null;
  }

  async cloneRole(tenantId: string, sourceRoleId: string, newName: string, newDescription?: string): Promise<Role> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Get source role
      const sourceRole = await this.getRoleById(tenantId, sourceRoleId);
      if (!sourceRole) {
        throw new AppError('Source role not found', 404);
      }

      // Get source role permissions
      const sourcePermissions = await this.getRolePermissions(tenantId, sourceRoleId);

      // Create new role
      const roleQuery = `
        INSERT INTO ${tenantId}.roles (
          name, description, module_code, is_custom, based_on_template
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const roleResult = await client.query(roleQuery, [
        newName,
        newDescription || sourceRole.description,
        sourceRole.module_code,
        true,
        sourceRole.based_on_template
      ]);
      
      const newRole = roleResult.rows[0];

      // Copy permissions
      if (sourcePermissions.length > 0) {
        const permissions = sourcePermissions.map(p => ({
          role_id: newRole.id,
          resource_code: p.resource_code,
          permission_level: p.permission_level
        }));
        
        await this.setRolePermissions(client, tenantId, newRole.id, permissions);
      }

      await client.query('COMMIT');
      return newRole;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}