export interface Tenant {
  id: string;
  subdomain: string;
  companyName: string;
  status: 'active' | 'suspended' | 'inactive';
  planId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  tenantId: string;
  isActive: boolean;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  isBase: boolean;
  exchangeRate?: number;
}

export interface CompanySettings {
  companyName: string;
  logo?: string;
  addresses: CompanyAddress[];
  baseCurrency: string;
  allowedCurrencies: string[];
  language: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
}

export interface CompanyAddress {
  type: 'head_office' | 'branch' | 'warehouse';
  name: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone?: string;
  email?: string;
}

export interface Document {
  id: string;
  type: string;
  title: string;
  contentHtml: string;
  metadata: Record<string, any>;
  version: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  version: string;
  isActive: boolean;
  permissions: string[];
  dependencies: string[];
}

export interface BillingUsage {
  tenantId: string;
  metricType: 'users' | 'storage' | 'api_calls' | 'modules';
  usageValue: number;
  billingPeriod: Date;
  createdAt: Date;
}

export interface TestResult {
  testScenario: string;
  expectedResult: string;
  actualResult: string;
  screenshots?: string[];
  executionTime: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  errorMessage?: string;
}