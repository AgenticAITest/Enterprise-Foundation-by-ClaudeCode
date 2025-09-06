import express from 'express';
import { IntegrationService } from '../services/integration.service.js';
import { authenticateToken } from '../middleware/auth.js';
import { tenantMiddleware } from '../middleware/tenant.js';
import { validateRequest } from '../middleware/validation.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Apply authentication and tenant middleware to all routes
router.use(authenticateToken);
router.use(tenantMiddleware);

/**
 * GET /integrations
 * Get all integrations for the authenticated tenant
 */
router.get('/', async (req, res) => {
  try {
    const { environment } = req.query;
    const integrations = await IntegrationService.getTenantIntegrations(
      req.tenant.id,
      environment as string
    );
    
    res.json({
      success: true,
      data: integrations
    });
  } catch (error) {
    logger.error('Error fetching integrations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch integrations'
    });
  }
});

/**
 * POST /integrations
 * Create a new integration
 */
router.post('/', validateRequest({
  body: {
    name: { type: 'string', required: true, minLength: 1, maxLength: 255 },
    type: { type: 'string', required: true, enum: ['inbound_api', 'outbound_api', 'webhook'] },
    description: { type: 'string', required: false, maxLength: 1000 },
    environment: { type: 'string', required: false, enum: ['development', 'staging', 'production'] }
  }
}), async (req, res) => {
  try {
    const integration = await IntegrationService.createIntegration({
      tenant_id: req.tenant.id,
      name: req.body.name,
      type: req.body.type,
      description: req.body.description,
      environment: req.body.environment || 'production',
      created_by: req.user.id
    });
    
    res.status(201).json({
      success: true,
      data: integration
    });
  } catch (error) {
    logger.error('Error creating integration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create integration'
    });
  }
});

/**
 * PUT /integrations/:id
 * Update an integration
 */
router.put('/:id', validateRequest({
  params: {
    id: { type: 'string', required: true, format: 'uuid' }
  },
  body: {
    name: { type: 'string', required: false, minLength: 1, maxLength: 255 },
    description: { type: 'string', required: false, maxLength: 1000 },
    status: { type: 'string', required: false, enum: ['active', 'inactive', 'error'] },
    environment: { type: 'string', required: false, enum: ['development', 'staging', 'production'] }
  }
}), async (req, res) => {
  try {
    const integration = await IntegrationService.updateIntegration(
      req.params.id,
      req.tenant.id,
      req.body
    );
    
    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'Integration not found'
      });
    }
    
    res.json({
      success: true,
      data: integration
    });
  } catch (error) {
    logger.error('Error updating integration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update integration'
    });
  }
});

/**
 * DELETE /integrations/:id
 * Delete an integration
 */
router.delete('/:id', validateRequest({
  params: {
    id: { type: 'string', required: true, format: 'uuid' }
  }
}), async (req, res) => {
  try {
    const success = await IntegrationService.deleteIntegration(req.params.id, req.tenant.id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Integration not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Integration deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting integration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete integration'
    });
  }
});

/**
 * POST /integrations/:id/inbound-api
 * Create inbound API configuration
 */
router.post('/:id/inbound-api', validateRequest({
  params: {
    id: { type: 'string', required: true, format: 'uuid' }
  },
  body: {
    endpoint_path: { type: 'string', required: true, minLength: 1, maxLength: 500 },
    http_methods: { type: 'array', required: true, items: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] } },
    authentication_type: { type: 'string', required: false, enum: ['none', 'api_key', 'bearer_token', 'basic_auth', 'oauth2'] },
    rate_limit_requests: { type: 'number', required: false, min: 1, max: 10000 },
    rate_limit_window_minutes: { type: 'number', required: false, min: 1, max: 1440 },
    request_validation_schema: { type: 'object', required: false },
    response_mapping: { type: 'object', required: false }
  }
}), async (req, res) => {
  try {
    const inboundAPI = await IntegrationService.createInboundAPI({
      integration_id: req.params.id,
      ...req.body
    });
    
    res.status(201).json({
      success: true,
      data: inboundAPI
    });
  } catch (error) {
    logger.error('Error creating inbound API:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create inbound API configuration'
    });
  }
});

/**
 * POST /integrations/:id/outbound-api
 * Create outbound API configuration
 */
router.post('/:id/outbound-api', validateRequest({
  params: {
    id: { type: 'string', required: true, format: 'uuid' }
  },
  body: {
    name: { type: 'string', required: true, minLength: 1, maxLength: 255 },
    base_url: { type: 'string', required: true, minLength: 1, maxLength: 1000 },
    authentication_type: { type: 'string', required: false, enum: ['none', 'api_key', 'bearer_token', 'basic_auth', 'oauth2'] },
    auth_credentials: { type: 'object', required: false },
    default_headers: { type: 'object', required: false },
    timeout_seconds: { type: 'number', required: false, min: 1, max: 300 },
    retry_attempts: { type: 'number', required: false, min: 0, max: 10 },
    retry_delay_seconds: { type: 'number', required: false, min: 1, max: 60 },
    request_template: { type: 'object', required: false },
    response_mapping: { type: 'object', required: false }
  }
}), async (req, res) => {
  try {
    const outboundAPI = await IntegrationService.createOutboundAPI({
      integration_id: req.params.id,
      ...req.body
    });
    
    res.status(201).json({
      success: true,
      data: outboundAPI
    });
  } catch (error) {
    logger.error('Error creating outbound API:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create outbound API configuration'
    });
  }
});

/**
 * POST /integrations/:id/webhook
 * Create webhook configuration
 */
router.post('/:id/webhook', validateRequest({
  params: {
    id: { type: 'string', required: true, format: 'uuid' }
  },
  body: {
    name: { type: 'string', required: true, minLength: 1, maxLength: 255 },
    url: { type: 'string', required: true, minLength: 1, maxLength: 1000 },
    events: { type: 'array', required: true, items: { type: 'string' } },
    authentication_type: { type: 'string', required: false, enum: ['none', 'api_key', 'bearer_token', 'signature'] },
    auth_credentials: { type: 'object', required: false },
    headers: { type: 'object', required: false },
    payload_template: { type: 'object', required: false },
    retry_attempts: { type: 'number', required: false, min: 0, max: 10 },
    retry_delay_seconds: { type: 'number', required: false, min: 1, max: 60 },
    timeout_seconds: { type: 'number', required: false, min: 1, max: 300 }
  }
}), async (req, res) => {
  try {
    const webhook = await IntegrationService.createWebhook({
      integration_id: req.params.id,
      ...req.body
    });
    
    res.status(201).json({
      success: true,
      data: webhook
    });
  } catch (error) {
    logger.error('Error creating webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create webhook configuration'
    });
  }
});

/**
 * POST /integrations/:id/api-keys
 * Generate API key for inbound authentication
 */
router.post('/:id/api-keys', validateRequest({
  params: {
    id: { type: 'string', required: true, format: 'uuid' }
  },
  body: {
    key_name: { type: 'string', required: true, minLength: 1, maxLength: 255 },
    permissions: { type: 'array', required: false, items: { type: 'string' } }
  }
}), async (req, res) => {
  try {
    const apiKey = await IntegrationService.generateAPIKey(
      req.params.id,
      req.body.key_name,
      req.body.permissions || ['read', 'write'],
      req.user.id
    );
    
    res.status(201).json({
      success: true,
      data: {
        id: apiKey.id,
        key: apiKey.key,
        message: 'API key generated successfully. Please store it securely as it will not be shown again.'
      }
    });
  } catch (error) {
    logger.error('Error generating API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate API key'
    });
  }
});

/**
 * GET /integrations/:id/logs
 * Get integration execution logs
 */
router.get('/:id/logs', validateRequest({
  params: {
    id: { type: 'string', required: true, format: 'uuid' }
  },
  query: {
    limit: { type: 'number', required: false, min: 1, max: 1000 }
  }
}), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const logs = await IntegrationService.getIntegrationLogs(req.params.id, limit);
    
    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    logger.error('Error fetching integration logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch integration logs'
    });
  }
});

export default router;