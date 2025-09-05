import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    tenantId?: string;
    permissions: string[];
  };
  tenant?: {
    id: string;
    subdomain: string;
    companyName: string;
    schema: string;
    status: string;
  };
  permission?: {
    resourceCode: string;
    level: 'manage' | 'view_only' | 'no_access';
    grantedByRole?: string;
    inheritedBy?: string;
  };
  permissions?: Array<{
    resourceCode: string;
    level: 'manage' | 'view_only' | 'no_access';
    grantedByRole?: string;
  }>;
  moduleContext?: string;
  dataScope?: {
    type: string;
    values: string[];
    filters: any;
  };
}

export interface TenantRequest extends AuthenticatedRequest {}