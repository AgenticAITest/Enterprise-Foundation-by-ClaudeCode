// Field Permission Context and Types
export { FieldPermissionProvider, useFieldPermissions } from '@/contexts/FieldPermissionContext';
export type {
  FieldAccessLevel,
  MaskingStrategy,
  FieldRule,
  FieldMaskingResult,
  FieldPermissionContextType
} from '@/contexts/FieldPermissionContext';

// Field Masking Hooks
export {
  useFieldVisibility,
  useFieldMask,
  useCanEditField,
  useFieldAccess,
  useMaskedData,
  useBulkFieldOperations,
  useFieldSecurity,
  useFormFieldPermissions
} from '@/hooks/useFieldMasking';
export type {
  FieldVisibilityResult,
  MaskedDataResult
} from '@/hooks/useFieldMasking';

// Field Masking Components
export { default as MaskedField, MaskedText } from './MaskedField';
export type { MaskedFieldProps, MaskedTextProps } from './MaskedField';

export { default as PermissionAwareForm } from './PermissionAwareForm';
export type { FormFieldDefinition, PermissionAwareFormProps } from './PermissionAwareForm';

// Re-export everything for convenience
export * from '@/contexts/FieldPermissionContext';
export * from '@/hooks/useFieldMasking';
export * from './MaskedField';
export * from './PermissionAwareForm';