import { query, tenantQuery } from '../config/database.js';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

export interface Integration {
  id: string;
  tenant_id: string;
  name: string;
  type: 'inbound_api' | 'outbound_api' | 'webhook';
  status: 'active' | 'inactive' | 'error';
  description?: string;
  environment: 'development' | 'staging' | 'production';
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface InboundAPI {
  id: string;
  integration_id: string;
  endpoint_path: string;
  http_methods: string[];
  authentication_type: 'none' | 'api_key' | 'bearer_token' | 'basic_auth' | 'oauth2';
  api_key?: string;
  rate_limit_requests: number;
  rate_limit_window_minutes: number;
  request_validation_schema?: object;
  response_mapping?: object;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface OutboundAPI {
  id: string;
  integration_id: string;
  name: string;
  base_url: string;
  authentication_type: 'none' | 'api_key' | 'bearer_token' | 'basic_auth' | 'oauth2';
  auth_credentials?: object;
  default_headers?: object;
  timeout_seconds: number;
  retry_attempts: number;
  retry_delay_seconds: number;
  request_template?: object;
  response_mapping?: object;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Webhook {
  id: string;
  integration_id: string;
  name: string;
  url: string;
  events: string[];
  authentication_type: 'none' | 'api_key' | 'bearer_token' | 'signature';
  auth_credentials?: object;
  headers?: object;
  payload_template?: object;
  retry_attempts: number;
  retry_delay_seconds: number;
  timeout_seconds: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface IntegrationLog {
  id: string;
  integration_id: string;
  integration_type: string;
  execution_type: 'inbound_request' | 'outbound_request' | 'webhook_delivery';
  status: 'success' | 'error' | 'pending' | 'timeout';
  request_data?: object;
  response_data?: object;
  error_message?: string;
  execution_time_ms?: number;
  created_at: Date;
}

export class IntegrationService {
  /**
   * Get all integrations for a tenant
   */
  static async getTenantIntegrations(tenantId: string, environment?: string): Promise<Integration[]> {
    try {
      let queryStr = 'SELECT * FROM public.integrations WHERE tenant_id = $1';
      const params: any[] = [tenantId];
      
      if (environment) {
        queryStr += ' AND environment = $2';
        params.push(environment);
      }
      
      queryStr += ' ORDER BY created_at DESC';
      
      const result = await query(queryStr, params);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching tenant integrations:', error);
      throw new Error('Failed to fetch integrations');
    }
  }

  /**
   * Create new integration
   */
  static async createIntegration(data: {
    tenant_id: string;
    name: string;
    type: Integration['type'];
    description?: string;
    environment?: Integration['environment'];
    created_by?: string;
  }): Promise<Integration> {
    try {
      const result = await query(`
        INSERT INTO public.integrations (tenant_id, name, type, description, environment, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        data.tenant_id,
        data.name,
        data.type,
        data.description || null,
        data.environment || 'production',
        data.created_by || null
      ]);
      
      logger.info(`Integration created: ${data.name} for tenant ${data.tenant_id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating integration:', error);
      throw new Error('Failed to create integration');
    }
  }

  /**
   * Update integration
   */
  static async updateIntegration(id: string, tenantId: string, data: Partial<Integration>): Promise<Integration | null> {
    try {
      const updateFields = [];
      const values = [];
      let paramCount = 1;

      if (data.name) {
        updateFields.push(`name = $${paramCount++}`);
        values.push(data.name);
      }
      
      if (data.description !== undefined) {
        updateFields.push(`description = $${paramCount++}`);
        values.push(data.description);
      }

      if (data.status) {
        updateFields.push(`status = $${paramCount++}`);
        values.push(data.status);
      }

      if (data.environment) {
        updateFields.push(`environment = $${paramCount++}`);
        values.push(data.environment);
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id, tenantId);

      const result = await query(`
        UPDATE public.integrations 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount++} AND tenant_id = $${paramCount++}
        RETURNING *
      `, values);

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating integration:', error);
      throw new Error('Failed to update integration');
    }
  }

  /**
   * Delete integration
   */
  static async deleteIntegration(id: string, tenantId: string): Promise<boolean> {
    try {
      const result = await query(`
        DELETE FROM public.integrations 
        WHERE id = $1 AND tenant_id = $2
      `, [id, tenantId]);

      const success = result.rowCount > 0;
      if (success) {
        logger.info(`Integration ${id} deleted for tenant ${tenantId}`);
      }
      
      return success;
    } catch (error) {
      logger.error('Error deleting integration:', error);
      throw new Error('Failed to delete integration');
    }
  }

  /**
   * Create inbound API configuration
   */
  static async createInboundAPI(data: {
    integration_id: string;
    endpoint_path: string;
    http_methods: string[];
    authentication_type?: InboundAPI['authentication_type'];
    rate_limit_requests?: number;
    rate_limit_window_minutes?: number;
    request_validation_schema?: object;
    response_mapping?: object;
  }): Promise<InboundAPI> {
    try {
      const result = await query(`
        INSERT INTO public.inbound_apis (
          integration_id, endpoint_path, http_methods, authentication_type,
          rate_limit_requests, rate_limit_window_minutes, request_validation_schema, response_mapping
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        data.integration_id,
        data.endpoint_path,
        data.http_methods,
        data.authentication_type || 'api_key',
        data.rate_limit_requests || 100,
        data.rate_limit_window_minutes || 60,
        data.request_validation_schema ? JSON.stringify(data.request_validation_schema) : null,
        data.response_mapping ? JSON.stringify(data.response_mapping) : null
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating inbound API:', error);
      throw new Error('Failed to create inbound API configuration');
    }
  }

  /**
   * Create outbound API configuration
   */
  static async createOutboundAPI(data: {
    integration_id: string;
    name: string;
    base_url: string;
    authentication_type?: OutboundAPI['authentication_type'];
    auth_credentials?: object;
    default_headers?: object;
    timeout_seconds?: number;
    retry_attempts?: number;
    retry_delay_seconds?: number;
    request_template?: object;
    response_mapping?: object;
  }): Promise<OutboundAPI> {
    try {
      const encryptedCredentials = data.auth_credentials ? 
        await this.encryptCredentials(data.auth_credentials) : null;

      const result = await query(`
        INSERT INTO public.outbound_apis (
          integration_id, name, base_url, authentication_type, auth_credentials,
          default_headers, timeout_seconds, retry_attempts, retry_delay_seconds,
          request_template, response_mapping
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        data.integration_id,
        data.name,
        data.base_url,
        data.authentication_type || 'api_key',
        encryptedCredentials,
        data.default_headers ? JSON.stringify(data.default_headers) : null,
        data.timeout_seconds || 30,
        data.retry_attempts || 3,
        data.retry_delay_seconds || 5,
        data.request_template ? JSON.stringify(data.request_template) : null,
        data.response_mapping ? JSON.stringify(data.response_mapping) : null
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating outbound API:', error);
      throw new Error('Failed to create outbound API configuration');
    }
  }

  /**
   * Create webhook configuration
   */
  static async createWebhook(data: {
    integration_id: string;
    name: string;
    url: string;
    events: string[];
    authentication_type?: Webhook['authentication_type'];
    auth_credentials?: object;
    headers?: object;
    payload_template?: object;
    retry_attempts?: number;
    retry_delay_seconds?: number;
    timeout_seconds?: number;
  }): Promise<Webhook> {
    try {
      const encryptedCredentials = data.auth_credentials ? 
        await this.encryptCredentials(data.auth_credentials) : null;

      const result = await query(`
        INSERT INTO public.webhooks (
          integration_id, name, url, events, authentication_type, auth_credentials,
          headers, payload_template, retry_attempts, retry_delay_seconds, timeout_seconds
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        data.integration_id,
        data.name,
        data.url,
        data.events,
        data.authentication_type || 'none',
        encryptedCredentials,
        data.headers ? JSON.stringify(data.headers) : null,
        data.payload_template ? JSON.stringify(data.payload_template) : null,
        data.retry_attempts || 3,
        data.retry_delay_seconds || 5,
        data.timeout_seconds || 30
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating webhook:', error);
      throw new Error('Failed to create webhook configuration');
    }
  }

  /**
   * Generate API key for inbound authentication
   */
  static async generateAPIKey(integrationId: string, keyName: string, permissions: string[] = ['read', 'write'], userId?: string): Promise<{ key: string; id: string }> {
    try {
      // Generate secure API key
      const apiKey = `ik_${crypto.randomBytes(32).toString('hex')}`;
      const hashedKey = await bcrypt.hash(apiKey, 12);

      const result = await query(`
        INSERT INTO public.integration_api_keys (integration_id, key_name, api_key_hash, permissions, created_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [integrationId, keyName, hashedKey, permissions, userId || null]);

      return {
        key: apiKey,
        id: result.rows[0].id
      };
    } catch (error) {
      logger.error('Error generating API key:', error);
      throw new Error('Failed to generate API key');
    }
  }

  /**
   * Log integration execution
   */
  static async logExecution(data: {
    integration_id: string;
    integration_type: string;
    execution_type: IntegrationLog['execution_type'];
    status: IntegrationLog['status'];
    request_data?: object;
    response_data?: object;
    error_message?: string;
    execution_time_ms?: number;
  }): Promise<void> {
    try {
      await query(`
        INSERT INTO public.integration_logs (
          integration_id, integration_type, execution_type, status,
          request_data, response_data, error_message, execution_time_ms
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        data.integration_id,
        data.integration_type,
        data.execution_type,
        data.status,
        data.request_data ? JSON.stringify(data.request_data) : null,
        data.response_data ? JSON.stringify(data.response_data) : null,
        data.error_message || null,
        data.execution_time_ms || null
      ]);
    } catch (error) {
      logger.error('Error logging integration execution:', error);
      // Don't throw here as logging failures shouldn't break the integration
    }
  }

  /**
   * Get integration logs
   */
  static async getIntegrationLogs(integrationId: string, limit: number = 100): Promise<IntegrationLog[]> {
    try {
      const result = await query(`
        SELECT * FROM public.integration_logs 
        WHERE integration_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2
      `, [integrationId, limit]);
      
      return result.rows;
    } catch (error) {
      logger.error('Error fetching integration logs:', error);
      throw new Error('Failed to fetch integration logs');
    }
  }

  /**
   * Encrypt sensitive credentials
   */
  private static async encryptCredentials(credentials: object): Promise<object> {
    try {
      const secretKey = process.env.INTEGRATION_ENCRYPTION_KEY || 'default-key-please-change-in-production';
      const cipher = crypto.createCipher('aes-256-cbc', secretKey);
      
      const encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex') + cipher.final('hex');
      
      return { encrypted };
    } catch (error) {
      logger.error('Error encrypting credentials:', error);
      throw new Error('Failed to encrypt credentials');
    }
  }

  /**
   * Decrypt sensitive credentials
   */
  static async decryptCredentials(encryptedCredentials: any): Promise<object> {
    try {
      if (!encryptedCredentials?.encrypted) {
        return encryptedCredentials || {};
      }

      const secretKey = process.env.INTEGRATION_ENCRYPTION_KEY || 'default-key-please-change-in-production';
      const decipher = crypto.createDecipher('aes-256-cbc', secretKey);
      
      const decrypted = decipher.update(encryptedCredentials.encrypted, 'hex', 'utf8') + decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      logger.error('Error decrypting credentials:', error);
      return {};
    }
  }
}