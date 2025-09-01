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
}

export interface TenantRequest extends AuthenticatedRequest {}