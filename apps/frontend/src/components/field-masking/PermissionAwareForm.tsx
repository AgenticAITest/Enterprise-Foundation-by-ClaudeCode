import React, { useState, useEffect } from 'react';
import { useFormFieldPermissions, useFieldVisibility } from '@/hooks/useFieldMasking';
import { FieldAccessLevel } from '@/contexts/FieldPermissionContext';
import { MaskedField } from './MaskedField';
import {
  Eye,
  EyeOff,
  Edit,
  Lock,
  Shield,
  AlertTriangle,
  Save,
  X,
  Info,
  User,
  Mail,
  Phone,
  DollarSign,
  Calendar,
  MapPin,
  FileText
} from 'lucide-react';

export interface FormFieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'password' | 'textarea' | 'select' | 'date' | 'currency';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  };
  category?: 'personal' | 'contact' | 'financial' | 'confidential' | 'general';
}

export interface PermissionAwareFormProps {
  resource: string;
  fields: FormFieldDefinition[];
  initialData?: Record<string, any>;
  context?: any;
  onSubmit?: (data: Record<string, any>) => void;
  onCancel?: () => void;
  showFieldSummary?: boolean;
  showAccessLevels?: boolean;
  readOnlyMode?: boolean;
  className?: string;
}

const getFieldIcon = (type: string, size = 16) => {
  switch (type) {
    case 'email': return <Mail size={size} style={{ color: '#6b7280' }} />;
    case 'tel': return <Phone size={size} style={{ color: '#6b7280' }} />;
    case 'currency':
    case 'number': return <DollarSign size={size} style={{ color: '#6b7280' }} />;
    case 'date': return <Calendar size={size} style={{ color: '#6b7280' }} />;
    case 'textarea': return <FileText size={size} style={{ color: '#6b7280' }} />;
    default: return <User size={size} style={{ color: '#6b7280' }} />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'personal': return { bg: '#fef3c7', border: '#fed7aa', text: '#92400e' };
    case 'contact': return { bg: '#dbeafe', border: '#bfdbfe', text: '#1e40af' };
    case 'financial': return { bg: '#dcfce7', border: '#bbf7d0', text: '#166534' };
    case 'confidential': return { bg: '#fee2e2', border: '#fecaca', text: '#dc2626' };
    default: return { bg: '#f9fafb', border: '#e5e7eb', text: '#374151' };
  }
};

export const PermissionAwareForm: React.FC<PermissionAwareFormProps> = ({
  resource,
  fields,
  initialData = {},
  context,
  onSubmit,
  onCancel,
  showFieldSummary = true,
  showAccessLevels = false,
  readOnlyMode = false,
  className = ''
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { getFieldProps, validateFieldAccess } = useFormFieldPermissions(resource, context);
  const fieldNames = fields.map(f => f.name);
  const fieldVisibility = useFieldVisibility(resource, fieldNames, context);

  // Update form data when initial data changes
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleFieldChange = (fieldName: string, value: any) => {
    const validation = validateFieldAccess(fieldName, value);
    
    if (!validation.valid) {
      setErrors(prev => ({ ...prev, [fieldName]: validation.error || 'Validation failed' }));
      return;
    }

    setFormData(prev => ({ ...prev, [fieldName]: value }));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (readOnlyMode) return;

    setIsSubmitting(true);
    
    // Validate all fields
    const newErrors: Record<string, string> = {};
    
    fieldVisibility.editable.forEach(fieldName => {
      const field = fields.find(f => f.name === fieldName);
      const value = formData[fieldName];
      
      // Required validation
      if (field?.validation?.required && (!value || String(value).trim() === '')) {
        newErrors[fieldName] = 'This field is required';
        return;
      }
      
      // Length validation
      if (value && typeof value === 'string') {
        if (field?.validation?.minLength && value.length < field.validation.minLength) {
          newErrors[fieldName] = `Minimum length is ${field.validation.minLength}`;
          return;
        }
        if (field?.validation?.maxLength && value.length > field.validation.maxLength) {
          newErrors[fieldName] = `Maximum length is ${field.validation.maxLength}`;
          return;
        }
      }
      
      // Pattern validation
      if (value && field?.validation?.pattern && !field.validation.pattern.test(String(value))) {
        newErrors[fieldName] = 'Invalid format';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    // Only submit editable fields
    const submitData: Record<string, any> = {};
    fieldVisibility.editable.forEach(fieldName => {
      submitData[fieldName] = formData[fieldName];
    });

    try {
      await onSubmit?.(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormFieldDefinition) => {
    const fieldProps = getFieldProps(field.name);
    const value = formData[field.name] || '';
    const error = errors[field.name];
    const categoryColors = getCategoryColor(field.category || 'general');

    if (fieldProps.hidden) {
      return null;
    }

    const commonInputStyles: React.CSSProperties = {
      width: '100%',
      padding: '8px 12px',
      border: `1px solid ${error ? '#ef4444' : fieldProps.readonly ? '#e5e7eb' : '#d1d5db'}`,
      borderRadius: '6px',
      fontSize: '14px',
      backgroundColor: fieldProps.readonly ? '#f9fafb' : 'white',
      color: fieldProps.readonly ? '#6b7280' : '#374151',
      opacity: fieldProps.disabled ? 0.6 : 1,
      cursor: fieldProps.disabled ? 'not-allowed' : 'default'
    };

    return (
      <div 
        key={field.name}
        style={{
          marginBottom: '20px',
          padding: '12px',
          border: `1px solid ${categoryColors.border}`,
          borderRadius: '8px',
          backgroundColor: categoryColors.bg
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px'
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: categoryColors.text
          }}>
            {getFieldIcon(field.type, 14)}
            {field.label}
            {field.validation?.required && fieldProps.accessLevel === 'full' && (
              <span style={{ color: '#ef4444' }}>*</span>
            )}
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {showAccessLevels && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 6px',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '500'
              }}>
                {fieldProps.accessLevel === 'full' && <Edit size={10} style={{ color: '#10b981' }} />}
                {fieldProps.accessLevel === 'read' && <Eye size={10} style={{ color: '#3b82f6' }} />}
                {(fieldProps.accessLevel === 'masked' || fieldProps.accessLevel === 'partial') && <Shield size={10} style={{ color: '#f59e0b' }} />}
                {fieldProps.accessLevel === 'denied' && <Lock size={10} style={{ color: '#ef4444' }} />}
                {fieldProps.accessLevel}
              </div>
            )}

            {field.category && (
              <div style={{
                padding: '2px 6px',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: categoryColors.text
              }}>
                {field.category}
              </div>
            )}
          </div>
        </div>

        {fieldProps.readonly || fieldProps.accessLevel !== 'full' ? (
          <MaskedField
            resource={resource}
            field={field.name}
            value={value}
            context={context}
            showAccessLevel={false}
            style={{
              display: 'block',
              padding: '8px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '6px',
              fontSize: '14px',
              minHeight: '20px'
            }}
            fallback={
              <div style={{
                padding: '8px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                border: '1px dashed rgba(0, 0, 0, 0.2)',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#6b7280',
                fontStyle: 'italic'
              }}>
                [Field access restricted]
              </div>
            }
          />
        ) : (
          <>
            {field.type === 'textarea' ? (
              <textarea
                value={value}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                disabled={fieldProps.disabled || readOnlyMode}
                style={{
                  ...commonInputStyles,
                  minHeight: '80px',
                  resize: 'vertical'
                }}
              />
            ) : field.type === 'select' ? (
              <select
                value={value}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                disabled={fieldProps.disabled || readOnlyMode}
                style={commonInputStyles}
              >
                <option value="">Select {field.label.toLowerCase()}</option>
                {field.options?.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                value={value}
                onChange={(e) => handleFieldChange(field.name, 
                  field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                )}
                placeholder={field.placeholder}
                disabled={fieldProps.disabled || readOnlyMode}
                style={commonInputStyles}
              />
            )}
          </>
        )}

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '6px',
            color: '#ef4444',
            fontSize: '12px'
          }}>
            <AlertTriangle size={12} />
            {error}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`permission-aware-form ${className}`}>
      {showFieldSummary && (
        <div style={{
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px'
        }}>
          <h4 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Info size={16} />
            Field Access Summary
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            <div style={{
              padding: '8px',
              backgroundColor: '#dcfce7',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#166534' }}>
                {fieldVisibility.editable.length}
              </div>
              <div style={{ fontSize: '12px', color: '#166534' }}>Editable</div>
            </div>

            <div style={{
              padding: '8px',
              backgroundColor: '#dbeafe',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#1e40af' }}>
                {fieldVisibility.readonly.length}
              </div>
              <div style={{ fontSize: '12px', color: '#1e40af' }}>Read-only</div>
            </div>

            <div style={{
              padding: '8px',
              backgroundColor: '#fef3c7',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#92400e' }}>
                {fieldVisibility.masked.length}
              </div>
              <div style={{ fontSize: '12px', color: '#92400e' }}>Masked</div>
            </div>

            <div style={{
              padding: '8px',
              backgroundColor: '#fee2e2',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#dc2626' }}>
                {fieldVisibility.hidden.length}
              </div>
              <div style={{ fontSize: '12px', color: '#dc2626' }}>Hidden</div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {fields
          .filter(field => !getFieldProps(field.name).hidden)
          .map(renderField)
        }

        {!readOnlyMode && fieldVisibility.editable.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '24px',
            paddingTop: '24px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                backgroundColor: isSubmitting ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? (
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid currentColor',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              ) : (
                <Save size={16} />
              )}
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
                Cancel
              </button>
            )}
          </div>
        )}

        {readOnlyMode && (
          <div style={{
            marginTop: '24px',
            paddingTop: '24px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            <EyeOff size={16} />
            Form is in read-only mode due to permission restrictions
          </div>
        )}
      </form>
    </div>
  );
};

export default PermissionAwareForm;