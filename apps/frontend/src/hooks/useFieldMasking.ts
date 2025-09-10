import { useMemo, useCallback } from 'react';
import { useFieldPermissions, FieldAccessLevel, FieldMaskingResult } from '@/contexts/FieldPermissionContext';

export interface FieldVisibilityResult {
  visible: string[];
  hidden: string[];
  masked: string[];
  readonly: string[];
  editable: string[];
}

export interface MaskedDataResult<T> {
  data: T[];
  fieldSummary: Record<string, {
    accessLevel: FieldAccessLevel;
    originalCount: number;
    maskedCount: number;
    hiddenCount: number;
  }>;
  totalFields: number;
  visibleFields: number;
}

/**
 * Hook for analyzing field visibility and access levels
 */
export const useFieldVisibility = (resource: string, fields: string[], context?: any): FieldVisibilityResult => {
  const { getFieldAccess } = useFieldPermissions();

  return useMemo(() => {
    const result: FieldVisibilityResult = {
      visible: [],
      hidden: [],
      masked: [],
      readonly: [],
      editable: []
    };

    fields.forEach(field => {
      const accessLevel = getFieldAccess(resource, field, context);

      switch (accessLevel) {
        case 'full':
          result.visible.push(field);
          result.editable.push(field);
          break;
        case 'read':
          result.visible.push(field);
          result.readonly.push(field);
          break;
        case 'masked':
        case 'partial':
          result.visible.push(field);
          result.masked.push(field);
          result.readonly.push(field);
          break;
        case 'hidden':
        case 'denied':
          result.hidden.push(field);
          break;
      }
    });

    return result;
  }, [resource, fields, context, getFieldAccess]);
};

/**
 * Hook for masking individual field values
 */
export const useFieldMask = () => {
  const { maskField } = useFieldPermissions();

  return useCallback((resource: string, field: string, value: any, context?: any): FieldMaskingResult => {
    return maskField(resource, field, value, context);
  }, [maskField]);
};

/**
 * Hook for checking if a field can be edited
 */
export const useCanEditField = () => {
  const { canEditField } = useFieldPermissions();

  return useCallback((resource: string, field: string, context?: any): boolean => {
    return canEditField(resource, field, context);
  }, [canEditField]);
};

/**
 * Hook for getting field access level
 */
export const useFieldAccess = () => {
  const { getFieldAccess } = useFieldPermissions();

  return useCallback((resource: string, field: string, context?: any): FieldAccessLevel => {
    return getFieldAccess(resource, field, context);
  }, [getFieldAccess]);
};

/**
 * Hook for masking entire datasets with analytics
 */
export const useMaskedData = <T extends Record<string, any>>(
  resource: string,
  data: T[],
  context?: any
): MaskedDataResult<T> => {
  const { applyFieldMasking, getFieldAccess } = useFieldPermissions();

  return useMemo(() => {
    if (!data.length) {
      return {
        data: [],
        fieldSummary: {},
        totalFields: 0,
        visibleFields: 0
      };
    }

    const maskedData = applyFieldMasking(resource, data, context);
    const sampleItem = data[0];
    const allFields = Object.keys(sampleItem);
    
    const fieldSummary: Record<string, any> = {};
    let visibleFieldsCount = 0;

    allFields.forEach(field => {
      const accessLevel = getFieldAccess(resource, field, context);
      
      fieldSummary[field] = {
        accessLevel,
        originalCount: data.filter(item => item[field] !== undefined && item[field] !== null).length,
        maskedCount: 0,
        hiddenCount: 0
      };

      if (accessLevel === 'hidden' || accessLevel === 'denied') {
        fieldSummary[field].hiddenCount = data.length;
      } else {
        visibleFieldsCount++;
        if (accessLevel === 'masked' || accessLevel === 'partial') {
          fieldSummary[field].maskedCount = data.length;
        }
      }
    });

    return {
      data: maskedData,
      fieldSummary,
      totalFields: allFields.length,
      visibleFields: visibleFieldsCount
    };
  }, [resource, data, context, applyFieldMasking, getFieldAccess]);
};

/**
 * Hook for bulk field operations
 */
export const useBulkFieldOperations = () => {
  const { getVisibleFields, maskObject, canEditField } = useFieldPermissions();

  const getEditableFields = useCallback((resource: string, fields: string[], context?: any): string[] => {
    return fields.filter(field => canEditField(resource, field, context));
  }, [canEditField]);

  const maskMultipleObjects = useCallback(<T extends Record<string, any>>(
    resource: string,
    objects: T[],
    context?: any
  ): T[] => {
    return objects.map(obj => maskObject(resource, obj, context));
  }, [maskObject]);

  const filterSensitiveFields = useCallback((
    resource: string,
    obj: Record<string, any>,
    context?: any
  ): Record<string, any> => {
    const visibleFields = getVisibleFields(resource, Object.keys(obj), context);
    const filtered: Record<string, any> = {};
    
    visibleFields.forEach(field => {
      if (obj[field] !== undefined) {
        filtered[field] = obj[field];
      }
    });

    return filtered;
  }, [getVisibleFields]);

  return {
    getEditableFields,
    maskMultipleObjects,
    filterSensitiveFields,
    getVisibleFields
  };
};

/**
 * Hook for field-level security analysis
 */
export const useFieldSecurity = (resource: string) => {
  const { fieldRules, getFieldCategories } = useFieldPermissions();

  return useMemo(() => {
    const resourceRules = fieldRules.filter(rule => rule.resource === resource);
    const categories = getFieldCategories(resource);
    
    const securityLevels = {
      public: resourceRules.filter(rule => rule.accessLevel === 'full').length,
      restricted: resourceRules.filter(rule => rule.accessLevel === 'read').length,
      masked: resourceRules.filter(rule => rule.accessLevel === 'masked' || rule.accessLevel === 'partial').length,
      hidden: resourceRules.filter(rule => rule.accessLevel === 'hidden').length,
      denied: resourceRules.filter(rule => rule.accessLevel === 'denied').length
    };

    const sensitiveFields = resourceRules
      .filter(rule => ['pii', 'financial', 'confidential'].includes(rule.category || ''))
      .map(rule => rule.field);

    return {
      rules: resourceRules,
      categories,
      securityLevels,
      sensitiveFields,
      totalRules: resourceRules.length,
      hasSensitiveData: sensitiveFields.length > 0
    };
  }, [resource, fieldRules, getFieldCategories]);
};

/**
 * Hook for form field permissions
 */
export const useFormFieldPermissions = (resource: string, context?: any) => {
  const { getFieldAccess, canEditField, fieldRules } = useFieldPermissions();

  const getFieldProps = useCallback((field: string) => {
    const accessLevel = getFieldAccess(resource, field, context);
    const editable = canEditField(resource, field, context);

    return {
      accessLevel,
      disabled: !editable || accessLevel === 'read',
      hidden: accessLevel === 'hidden' || accessLevel === 'denied',
      readonly: accessLevel === 'read',
      required: false, // This could be enhanced with required field rules
      placeholder: accessLevel === 'masked' ? '••••••••' : undefined,
      className: `field-${accessLevel}`,
      'data-field-access': accessLevel,
      'data-sensitive': ['pii', 'financial', 'confidential'].includes(
        fieldRules.find(rule => rule.resource === resource && rule.field === field)?.category || ''
      )
    };
  }, [resource, context, getFieldAccess, canEditField]);

  const validateFieldAccess = useCallback((field: string, value: any) => {
    const accessLevel = getFieldAccess(resource, field, context);
    
    if (accessLevel === 'denied' || accessLevel === 'hidden') {
      return {
        valid: false,
        error: 'Access denied to this field'
      };
    }

    if ((accessLevel === 'read' || accessLevel === 'masked' || accessLevel === 'partial') && value !== undefined) {
      return {
        valid: false,
        error: 'Field is read-only'
      };
    }

    return { valid: true };
  }, [resource, context, getFieldAccess]);

  return {
    getFieldProps,
    validateFieldAccess
  };
};