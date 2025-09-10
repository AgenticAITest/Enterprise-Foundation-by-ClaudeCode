import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { usePermissions } from '@/contexts/PermissionContext';
import { useDataScope } from '@/contexts/DataScopeContext';

export type FieldAccessLevel = 
  | 'full'      // Full access - can read and edit
  | 'read'      // Read-only access
  | 'masked'    // Masked/redacted display (e.g., ****)
  | 'partial'   // Partial display (e.g., first 3 chars)
  | 'hidden'    // Completely hidden
  | 'denied';   // Access denied

export type MaskingStrategy = 
  | 'asterisk'    // Replace with *
  | 'dots'        // Replace with •
  | 'redacted'    // Show [REDACTED]
  | 'partial'     // Show first/last chars
  | 'initials'    // Show initials only
  | 'domain'      // For emails, show domain only
  | 'currency'    // For amounts, show currency but mask value
  | 'custom';     // Custom masking function

export interface FieldRule {
  id: string;
  resource: string;           // e.g., 'users', 'financial_data'
  field: string;              // e.g., 'email', 'salary', 'ssn'
  requiredPermissions: string[];
  requiredRoles?: string[];
  requiredScopes?: string[];
  accessLevel: FieldAccessLevel;
  maskingStrategy?: MaskingStrategy;
  customMask?: (value: any) => string;
  conditions?: Record<string, any>;
  priority?: number;
  category?: string;          // 'pii', 'financial', 'confidential'
}

export interface FieldMaskingResult {
  value: any;
  displayValue: string;
  accessLevel: FieldAccessLevel;
  isOriginal: boolean;
  maskingApplied: string[];
  reason?: string;
}

export interface FieldPermissionContextType {
  fieldRules: FieldRule[];
  getFieldAccess: (resource: string, field: string, context?: any) => FieldAccessLevel;
  maskField: (resource: string, field: string, value: any, context?: any) => FieldMaskingResult;
  canEditField: (resource: string, field: string, context?: any) => boolean;
  getVisibleFields: (resource: string, fields: string[], context?: any) => string[];
  applyFieldMasking: <T>(resource: string, data: T[], context?: any) => T[];
  maskObject: <T>(resource: string, obj: T, context?: any) => T;
  getFieldCategories: (resource: string) => Record<string, string[]>;
  isLoading: boolean;
}

const FieldPermissionContext = createContext<FieldPermissionContextType | undefined>(undefined);

// Mock field rules for demonstration
const mockFieldRules: FieldRule[] = [
  // User PII fields
  {
    id: 'user_email_basic',
    resource: 'users',
    field: 'email',
    requiredPermissions: ['admin.users.read'],
    accessLevel: 'full',
    category: 'pii',
    priority: 100
  },
  {
    id: 'user_email_partial',
    resource: 'users',
    field: 'email',
    requiredPermissions: ['core.users.read'],
    accessLevel: 'partial',
    maskingStrategy: 'domain',
    category: 'pii',
    priority: 80
  },
  {
    id: 'user_phone_admin',
    resource: 'users',
    field: 'phone',
    requiredPermissions: ['admin.users.read'],
    accessLevel: 'full',
    category: 'pii',
    priority: 100
  },
  {
    id: 'user_phone_masked',
    resource: 'users',
    field: 'phone',
    requiredPermissions: ['core.users.read'],
    accessLevel: 'masked',
    maskingStrategy: 'partial',
    category: 'pii',
    priority: 80
  },
  {
    id: 'user_ssn_hr',
    resource: 'users',
    field: 'ssn',
    requiredPermissions: ['hr.pii.read'],
    accessLevel: 'full',
    category: 'pii',
    priority: 100
  },
  {
    id: 'user_ssn_masked',
    resource: 'users',
    field: 'ssn',
    requiredPermissions: ['admin.users.read'],
    accessLevel: 'masked',
    maskingStrategy: 'partial',
    category: 'pii',
    priority: 90
  },
  {
    id: 'user_ssn_denied',
    resource: 'users',
    field: 'ssn',
    requiredPermissions: [],
    accessLevel: 'denied',
    category: 'pii',
    priority: 0
  },

  // Financial fields
  {
    id: 'salary_hr_full',
    resource: 'users',
    field: 'salary',
    requiredPermissions: ['hr.salary.read'],
    accessLevel: 'full',
    category: 'financial',
    priority: 100
  },
  {
    id: 'salary_manager_read',
    resource: 'users',
    field: 'salary',
    requiredPermissions: ['finance.budget.read'],
    requiredScopes: ['department', 'team'],
    accessLevel: 'read',
    category: 'financial',
    priority: 90
  },
  {
    id: 'salary_masked',
    resource: 'users',
    field: 'salary',
    requiredPermissions: ['core.users.read'],
    accessLevel: 'masked',
    maskingStrategy: 'currency',
    category: 'financial',
    priority: 50
  },

  // Financial report fields
  {
    id: 'revenue_full',
    resource: 'financial_reports',
    field: 'revenue',
    requiredPermissions: ['finance.reports.read'],
    accessLevel: 'full',
    category: 'financial',
    priority: 100
  },
  {
    id: 'revenue_executive',
    resource: 'financial_reports',
    field: 'revenue',
    requiredRoles: ['executive', 'cfo'],
    accessLevel: 'full',
    category: 'financial',
    priority: 95
  },
  {
    id: 'revenue_manager',
    resource: 'financial_reports',
    field: 'revenue',
    requiredPermissions: ['finance.dashboard.read'],
    requiredScopes: ['department'],
    accessLevel: 'partial',
    maskingStrategy: 'currency',
    category: 'financial',
    priority: 80
  },
  {
    id: 'profit_margin_sensitive',
    resource: 'financial_reports',
    field: 'profitMargin',
    requiredPermissions: ['finance.sensitive.read'],
    accessLevel: 'full',
    category: 'confidential',
    priority: 100
  },
  {
    id: 'profit_margin_hidden',
    resource: 'financial_reports',
    field: 'profitMargin',
    requiredPermissions: [],
    accessLevel: 'hidden',
    category: 'confidential',
    priority: 0
  },

  // Document fields
  {
    id: 'document_content_owner',
    resource: 'documents',
    field: 'content',
    requiredPermissions: [],
    requiredScopes: ['own'],
    accessLevel: 'full',
    category: 'content',
    priority: 100
  },
  {
    id: 'document_content_team',
    resource: 'documents',
    field: 'content',
    requiredScopes: ['team'],
    accessLevel: 'read',
    category: 'content',
    priority: 80
  },
  {
    id: 'document_content_preview',
    resource: 'documents',
    field: 'content',
    requiredPermissions: ['documents.read'],
    accessLevel: 'partial',
    maskingStrategy: 'partial',
    category: 'content',
    priority: 60
  }
];

interface Props {
  children: ReactNode;
  mockRules?: FieldRule[];
}

export const FieldPermissionProvider: React.FC<Props> = ({ 
  children, 
  mockRules = mockFieldRules 
}) => {
  const [fieldRules, setFieldRules] = useState<FieldRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { hasPermission, hasRole } = usePermissions();
  const { getAllowedScopes } = useDataScope();

  const getFieldAccess = (resource: string, field: string, context?: any): FieldAccessLevel => {
    // Find applicable rules for the resource and field
    const applicableRules = fieldRules
      .filter(rule => rule.resource === resource && rule.field === field)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    if (applicableRules.length === 0) {
      return 'full'; // Default to full access if no rules
    }

    // Check each rule in priority order
    for (const rule of applicableRules) {
      let hasRequiredPermissions = true;
      let hasRequiredRoles = true;
      let hasRequiredScopes = true;

      // Check permissions
      if (rule.requiredPermissions && rule.requiredPermissions.length > 0) {
        hasRequiredPermissions = rule.requiredPermissions.some(permission => 
          hasPermission(permission)
        );
      }

      // Check roles
      if (rule.requiredRoles && rule.requiredRoles.length > 0) {
        hasRequiredRoles = rule.requiredRoles.some(role => 
          hasRole(role)
        );
      }

      // Check scopes
      if (rule.requiredScopes && rule.requiredScopes.length > 0) {
        const allowedScopes = getAllowedScopes();
        hasRequiredScopes = rule.requiredScopes.some(scope => 
          allowedScopes.includes(scope as any)
        );
      }

      // If all requirements are met, return this rule's access level
      if (hasRequiredPermissions && hasRequiredRoles && hasRequiredScopes) {
        return rule.accessLevel;
      }
    }

    // If no rules match, return the lowest priority rule's access level
    return applicableRules[applicableRules.length - 1]?.accessLevel || 'denied';
  };

  const applyMaskingStrategy = (strategy: MaskingStrategy, value: any, customMask?: (value: any) => string): string => {
    if (customMask) {
      return customMask(value);
    }

    const strValue = String(value || '');
    
    switch (strategy) {
      case 'asterisk':
        return '*'.repeat(Math.min(strValue.length, 8));
        
      case 'dots':
        return '•'.repeat(Math.min(strValue.length, 8));
        
      case 'redacted':
        return '[REDACTED]';
        
      case 'partial':
        if (strValue.length <= 3) return '*'.repeat(strValue.length);
        return strValue.slice(0, 2) + '*'.repeat(strValue.length - 4) + strValue.slice(-2);
        
      case 'initials':
        return strValue.split(' ').map(word => word.charAt(0)).join('.').toUpperCase();
        
      case 'domain':
        if (strValue.includes('@')) {
          const [, domain] = strValue.split('@');
          return `***@${domain}`;
        }
        return '***';
        
      case 'currency':
        if (typeof value === 'number') {
          return `$***,***`;
        }
        return '[AMOUNT HIDDEN]';
        
      default:
        return strValue;
    }
  };

  const maskField = (resource: string, field: string, value: any, context?: any): FieldMaskingResult => {
    const accessLevel = getFieldAccess(resource, field, context);
    
    if (accessLevel === 'hidden' || accessLevel === 'denied') {
      return {
        value: undefined,
        displayValue: '',
        accessLevel,
        isOriginal: false,
        maskingApplied: ['hidden'],
        reason: accessLevel === 'denied' ? 'Access denied' : 'Field hidden'
      };
    }

    if (accessLevel === 'full') {
      return {
        value,
        displayValue: String(value || ''),
        accessLevel,
        isOriginal: true,
        maskingApplied: []
      };
    }

    if (accessLevel === 'read') {
      return {
        value,
        displayValue: String(value || ''),
        accessLevel,
        isOriginal: true,
        maskingApplied: []
      };
    }

    // Apply masking for 'masked' or 'partial' access levels
    const applicableRule = fieldRules
      .filter(rule => rule.resource === resource && rule.field === field)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .find(rule => {
        const hasPermissions = !rule.requiredPermissions || rule.requiredPermissions.some(p => hasPermission(p));
        const hasRoles = !rule.requiredRoles || rule.requiredRoles.some(r => hasRole(r));
        return hasPermissions && hasRoles;
      });

    const maskingStrategy = applicableRule?.maskingStrategy || 'asterisk';
    const customMask = applicableRule?.customMask;
    const displayValue = applyMaskingStrategy(maskingStrategy, value, customMask);

    return {
      value: accessLevel === 'partial' ? value : undefined,
      displayValue,
      accessLevel,
      isOriginal: false,
      maskingApplied: [maskingStrategy],
      reason: `Masked using ${maskingStrategy} strategy`
    };
  };

  const canEditField = (resource: string, field: string, context?: any): boolean => {
    const accessLevel = getFieldAccess(resource, field, context);
    return accessLevel === 'full';
  };

  const getVisibleFields = (resource: string, fields: string[], context?: any): string[] => {
    return fields.filter(field => {
      const accessLevel = getFieldAccess(resource, field, context);
      return accessLevel !== 'hidden' && accessLevel !== 'denied';
    });
  };

  const applyFieldMasking = <T extends Record<string, any>>(
    resource: string, 
    data: T[], 
    context?: any
  ): T[] => {
    return data.map(item => maskObject(resource, item, context));
  };

  const maskObject = <T extends Record<string, any>>(
    resource: string, 
    obj: T, 
    context?: any
  ): T => {
    const maskedObj = { ...obj };
    
    Object.keys(obj).forEach(field => {
      const result = maskField(resource, field, obj[field], context);
      
      if (result.accessLevel === 'hidden' || result.accessLevel === 'denied') {
        delete maskedObj[field];
      } else if (!result.isOriginal) {
        maskedObj[field] = result.displayValue as any;
      }
    });

    return maskedObj;
  };

  const getFieldCategories = (resource: string): Record<string, string[]> => {
    const categories: Record<string, string[]> = {};
    
    fieldRules
      .filter(rule => rule.resource === resource)
      .forEach(rule => {
        const category = rule.category || 'general';
        if (!categories[category]) {
          categories[category] = [];
        }
        if (!categories[category].includes(rule.field)) {
          categories[category].push(rule.field);
        }
      });

    return categories;
  };

  useEffect(() => {
    // Simulate loading field rules
    const timer = setTimeout(() => {
      setFieldRules(mockRules);
      setIsLoading(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [mockRules]);

  const contextValue: FieldPermissionContextType = useMemo(() => ({
    fieldRules,
    getFieldAccess,
    maskField,
    canEditField,
    getVisibleFields,
    applyFieldMasking,
    maskObject,
    getFieldCategories,
    isLoading
  }), [fieldRules, isLoading]);

  return (
    <FieldPermissionContext.Provider value={contextValue}>
      {children}
    </FieldPermissionContext.Provider>
  );
};

export const useFieldPermissions = (): FieldPermissionContextType => {
  const context = useContext(FieldPermissionContext);
  if (context === undefined) {
    throw new Error('useFieldPermissions must be used within a FieldPermissionProvider');
  }
  return context;
};

export default FieldPermissionContext;