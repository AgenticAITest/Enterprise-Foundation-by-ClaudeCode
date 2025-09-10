import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/providers/auth-provider';
import { useTenant } from '@/providers/tenant-provider';

const integrationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  type: z.enum(['inbound_api', 'outbound_api', 'webhook']),
  description: z.string().max(1000, 'Description too long').optional(),
  environment: z.enum(['development', 'staging', 'production']).default('production')
});

const inboundApiSchema = z.object({
  endpoint_path: z.string().min(1, 'Endpoint path is required'),
  http_methods: z.array(z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])).min(1, 'At least one method required'),
  authentication_type: z.enum(['none', 'api_key', 'bearer_token', 'basic_auth', 'oauth2']).default('api_key'),
  rate_limit_requests: z.number().min(1).max(10000).default(100),
  rate_limit_window_minutes: z.number().min(1).max(1440).default(60)
});

const outboundApiSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  base_url: z.string().url('Must be a valid URL'),
  authentication_type: z.enum(['none', 'api_key', 'bearer_token', 'basic_auth', 'oauth2']).default('api_key'),
  timeout_seconds: z.number().min(1).max(300).default(30),
  retry_attempts: z.number().min(0).max(10).default(3),
  retry_delay_seconds: z.number().min(1).max(60).default(5)
});

const webhookSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  url: z.string().url('Must be a valid URL'),
  events: z.array(z.string()).min(1, 'At least one event required'),
  authentication_type: z.enum(['none', 'api_key', 'bearer_token', 'signature']).default('none'),
  retry_attempts: z.number().min(0).max(10).default(3),
  retry_delay_seconds: z.number().min(1).max(60).default(5),
  timeout_seconds: z.number().min(1).max(300).default(30)
});

type IntegrationFormData = z.infer<typeof integrationSchema>;
type InboundApiFormData = z.infer<typeof inboundApiSchema>;
type OutboundApiFormData = z.infer<typeof outboundApiSchema>;
type WebhookFormData = z.infer<typeof webhookSchema>;

const IntegrationBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();
  const { tenant } = useTenant();
  
  const [step, setStep] = useState(1);
  const [integrationType, setIntegrationType] = useState<string>(searchParams.get('type') || 'inbound_api');
  const [isLoading, setIsLoading] = useState(false);
  const [integrationId, setIntegrationId] = useState<string | null>(null);

  const integrationForm = useForm<IntegrationFormData>({
    resolver: zodResolver(integrationSchema),
    defaultValues: {
      type: integrationType as any,
      environment: 'production'
    }
  });

  const inboundApiForm = useForm<InboundApiFormData>({
    resolver: zodResolver(inboundApiSchema),
    defaultValues: {
      authentication_type: 'api_key',
      rate_limit_requests: 100,
      rate_limit_window_minutes: 60,
      http_methods: ['POST']
    }
  });

  const outboundApiForm = useForm<OutboundApiFormData>({
    resolver: zodResolver(outboundApiSchema),
    defaultValues: {
      authentication_type: 'api_key',
      timeout_seconds: 30,
      retry_attempts: 3,
      retry_delay_seconds: 5
    }
  });

  const webhookForm = useForm<WebhookFormData>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      authentication_type: 'none',
      retry_attempts: 3,
      retry_delay_seconds: 5,
      timeout_seconds: 30,
      events: []
    }
  });

  useEffect(() => {
    if (searchParams.get('type')) {
      setIntegrationType(searchParams.get('type')!);
      integrationForm.setValue('type', searchParams.get('type') as any);
    }
  }, [searchParams]);

  const handleIntegrationSubmit = async (data: IntegrationFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to create integration');
      }

      const result = await response.json();
      setIntegrationId(result.data.id);
      setIntegrationType(data.type);
      setStep(2);
    } catch (error) {
      console.error('Error creating integration:', error);
      alert('Failed to create integration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigSubmit = async (configData: any) => {
    if (!integrationId) return;

    setIsLoading(true);
    try {
      let endpoint = '';
      switch (integrationType) {
        case 'inbound_api':
          endpoint = `/api/integrations/${integrationId}/inbound-api`;
          break;
        case 'outbound_api':
          endpoint = `/api/integrations/${integrationId}/outbound-api`;
          break;
        case 'webhook':
          endpoint = `/api/integrations/${integrationId}/webhook`;
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(configData)
      });

      if (!response.ok) {
        throw new Error('Failed to create configuration');
      }

      navigate(`/integrations/${integrationId}`, {
        state: { message: 'Integration created successfully!' }
      });
    } catch (error) {
      console.error('Error creating configuration:', error);
      alert('Failed to create configuration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStepTitle = () => {
    if (step === 1) return 'Basic Configuration';
    switch (integrationType) {
      case 'inbound_api':
        return 'Inbound API Configuration';
      case 'outbound_api':
        return 'Outbound API Configuration';
      case 'webhook':
        return 'Webhook Configuration';
      default:
        return 'Configuration';
    }
  };

  const getTypeDescription = (type: string) => {
    switch (type) {
      case 'inbound_api':
        return 'Create API endpoints that external systems can call';
      case 'outbound_api':
        return 'Configure calls to external APIs from your system';
      case 'webhook':
        return 'Set up event-driven notifications to external systems';
      default:
        return '';
    }
  };

  const availableEvents = [
    'user.created', 'user.updated', 'user.deleted',
    'order.created', 'order.updated', 'order.completed', 'order.cancelled',
    'invoice.created', 'invoice.paid', 'invoice.overdue',
    'inventory.low_stock', 'inventory.updated',
    'system.backup_completed', 'system.error'
  ];

  const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  const authTypes = {
    none: 'No Authentication',
    api_key: 'API Key',
    bearer_token: 'Bearer Token',
    basic_auth: 'Basic Authentication',
    oauth2: 'OAuth 2.0',
    signature: 'Signature-based'
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Integration</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {step === 1 ? 'Configure basic integration settings' : getTypeDescription(integrationType)}
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center space-x-4">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
          step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          1
        </div>
        <div className={`h-1 flex-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
          step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          2
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{getStepTitle()}</CardTitle>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <form onSubmit={integrationForm.handleSubmit(handleIntegrationSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Integration Name</label>
                <Input
                  {...integrationForm.register('name')}
                  placeholder="e.g., Customer Data API"
                  className="w-full"
                />
                {integrationForm.formState.errors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {integrationForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Integration Type</label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {(['inbound_api', 'outbound_api', 'webhook'] as const).map((type) => (
                    <div
                      key={type}
                      onClick={() => {
                        setIntegrationType(type);
                        integrationForm.setValue('type', type);
                      }}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        integrationType === type
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">
                          {type === 'inbound_api' && '📥'}
                          {type === 'outbound_api' && '📤'}
                          {type === 'webhook' && '🪝'}
                        </div>
                        <h3 className="font-medium">
                          {type === 'inbound_api' && 'Inbound API'}
                          {type === 'outbound_api' && 'Outbound API'}
                          {type === 'webhook' && 'Webhook'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {getTypeDescription(type)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                <textarea
                  {...integrationForm.register('description')}
                  placeholder="Describe what this integration does..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Environment</label>
                <select
                  {...integrationForm.register('environment')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => navigate('/integrations')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Next Step'}
                </Button>
              </div>
            </form>
          )}

          {step === 2 && integrationType === 'inbound_api' && (
            <form onSubmit={inboundApiForm.handleSubmit(handleConfigSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Endpoint Path</label>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">/api/integrations/</span>
                  <Input
                    {...inboundApiForm.register('endpoint_path')}
                    placeholder="customers"
                    className="flex-1"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  This will be accessible at: /api/integrations/your-path
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">HTTP Methods</label>
                <div className="flex flex-wrap gap-2">
                  {httpMethods.map((method) => (
                    <Badge
                      key={method}
                      variant={
                        inboundApiForm.watch('http_methods')?.includes(method as any)
                          ? 'default'
                          : 'outline'
                      }
                      className="cursor-pointer"
                      onClick={() => {
                        const currentMethods = inboundApiForm.getValues('http_methods') || [];
                        if (currentMethods.includes(method as any)) {
                          inboundApiForm.setValue(
                            'http_methods',
                            currentMethods.filter(m => m !== method) as any
                          );
                        } else {
                          inboundApiForm.setValue(
                            'http_methods',
                            [...currentMethods, method] as any
                          );
                        }
                      }}
                    >
                      {method}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Authentication</label>
                <select
                  {...inboundApiForm.register('authentication_type')}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                >
                  {Object.entries(authTypes).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rate Limit (requests)</label>
                  <Input
                    type="number"
                    {...inboundApiForm.register('rate_limit_requests', { valueAsNumber: true })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Window (minutes)</label>
                  <Input
                    type="number"
                    {...inboundApiForm.register('rate_limit_window_minutes', { valueAsNumber: true })}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Integration'}
                </Button>
              </div>
            </form>
          )}

          {step === 2 && integrationType === 'outbound_api' && (
            <form onSubmit={outboundApiForm.handleSubmit(handleConfigSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">API Name</label>
                <Input
                  {...outboundApiForm.register('name')}
                  placeholder="e.g., Payment Gateway API"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Base URL</label>
                <Input
                  {...outboundApiForm.register('base_url')}
                  placeholder="https://api.example.com"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Authentication</label>
                <select
                  {...outboundApiForm.register('authentication_type')}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                >
                  {Object.entries(authTypes).filter(([key]) => key !== 'signature').map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Timeout (seconds)</label>
                  <Input
                    type="number"
                    {...outboundApiForm.register('timeout_seconds', { valueAsNumber: true })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Retry Attempts</label>
                  <Input
                    type="number"
                    {...outboundApiForm.register('retry_attempts', { valueAsNumber: true })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Retry Delay (seconds)</label>
                  <Input
                    type="number"
                    {...outboundApiForm.register('retry_delay_seconds', { valueAsNumber: true })}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Integration'}
                </Button>
              </div>
            </form>
          )}

          {step === 2 && integrationType === 'webhook' && (
            <form onSubmit={webhookForm.handleSubmit(handleConfigSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Webhook Name</label>
                <Input
                  {...webhookForm.register('name')}
                  placeholder="e.g., Order Notification Webhook"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Webhook URL</label>
                <Input
                  {...webhookForm.register('url')}
                  placeholder="https://your-system.com/webhooks/orders"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Events to Subscribe</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {availableEvents.map((event) => (
                    <label key={event} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={event}
                        {...webhookForm.register('events')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{event}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Authentication</label>
                <select
                  {...webhookForm.register('authentication_type')}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                >
                  <option value="none">No Authentication</option>
                  <option value="api_key">API Key</option>
                  <option value="bearer_token">Bearer Token</option>
                  <option value="signature">Signature Verification</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Timeout (seconds)</label>
                  <Input
                    type="number"
                    {...webhookForm.register('timeout_seconds', { valueAsNumber: true })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Retry Attempts</label>
                  <Input
                    type="number"
                    {...webhookForm.register('retry_attempts', { valueAsNumber: true })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Retry Delay (seconds)</label>
                  <Input
                    type="number"
                    {...webhookForm.register('retry_delay_seconds', { valueAsNumber: true })}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Integration'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegrationBuilder;