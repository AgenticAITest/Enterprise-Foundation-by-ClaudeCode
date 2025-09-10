import React, { ReactNode } from 'react';
import { useFieldMask, useFieldAccess } from '@/hooks/useFieldMasking';
import { FieldAccessLevel } from '@/contexts/FieldPermissionContext';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Edit, 
  Shield, 
  AlertTriangle,
  Info,
  User,
  DollarSign,
  FileText
} from 'lucide-react';

export interface MaskedFieldProps {
  resource: string;
  field: string;
  value: any;
  context?: any;
  showAccessLevel?: boolean;
  showTooltip?: boolean;
  fallback?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  renderValue?: (value: any, masked: boolean) => ReactNode;
  onAccessDenied?: (field: string, reason: string) => void;
}

const AccessLevelIcon: React.FC<{ level: FieldAccessLevel; size?: number }> = ({ level, size = 14 }) => {
  const icons = {
    full: Edit,
    read: Eye,
    masked: Shield,
    partial: Eye,
    hidden: EyeOff,
    denied: Lock
  };

  const colors = {
    full: '#10b981',      // green
    read: '#3b82f6',      // blue
    masked: '#f59e0b',    // amber
    partial: '#8b5cf6',   // violet
    hidden: '#6b7280',    // gray
    denied: '#ef4444'     // red
  };

  const Icon = icons[level];
  return <Icon size={size} style={{ color: colors[level] }} />;
};

const getFieldTypeIcon = (field: string, size = 14) => {
  if (field.includes('email') || field.includes('mail')) {
    return <FileText size={size} style={{ color: '#6b7280' }} />;
  }
  if (field.includes('phone') || field.includes('mobile')) {
    return <User size={size} style={{ color: '#6b7280' }} />;
  }
  if (field.includes('salary') || field.includes('amount') || field.includes('revenue')) {
    return <DollarSign size={size} style={{ color: '#6b7280' }} />;
  }
  return <FileText size={size} style={{ color: '#6b7280' }} />;
};

export const MaskedField: React.FC<MaskedFieldProps> = ({
  resource,
  field,
  value,
  context,
  showAccessLevel = false,
  showTooltip = false,
  fallback,
  className = '',
  style,
  renderValue,
  onAccessDenied
}) => {
  const maskField = useFieldMask();
  const getFieldAccess = useFieldAccess();
  
  const result = maskField(resource, field, value, context);
  const accessLevel = getFieldAccess(resource, field, context);

  // Handle access denied cases
  if (accessLevel === 'denied' || accessLevel === 'hidden') {
    onAccessDenied?.(field, result.reason || 'Access denied');
    
    if (fallback) {
      return <>{fallback}</>;
    }
    
    if (accessLevel === 'hidden') {
      return null; // Completely hidden
    }
    
    return (
      <div 
        className={`masked-field-denied ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 6px',
          backgroundColor: '#fef2f2',
          color: '#dc2626',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500',
          border: '1px solid #fecaca',
          ...style
        }}
        title={showTooltip ? result.reason : undefined}
      >
        <Lock size={12} />
        Access Denied
      </div>
    );
  }

  // Render the field value
  const displayValue = renderValue 
    ? renderValue(result.displayValue, !result.isOriginal)
    : result.displayValue;

  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    ...style
  };

  const valueStyle: React.CSSProperties = {
    fontFamily: result.isOriginal ? 'inherit' : 'monospace',
    color: result.isOriginal ? 'inherit' : '#6b7280',
    fontStyle: result.isOriginal ? 'normal' : 'italic'
  };

  if (result.accessLevel === 'masked' || result.accessLevel === 'partial') {
    valueStyle.backgroundColor = '#fef3c7';
    valueStyle.padding = '1px 4px';
    valueStyle.borderRadius = '3px';
    valueStyle.border = '1px solid #fed7aa';
  }

  return (
    <span 
      className={`masked-field masked-field-${accessLevel} ${className}`}
      style={containerStyle}
      title={showTooltip ? `Field: ${field}, Access: ${accessLevel}${result.reason ? `, ${result.reason}` : ''}` : undefined}
    >
      {showAccessLevel && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <AccessLevelIcon level={accessLevel} size={12} />
          {getFieldTypeIcon(field, 12)}
        </div>
      )}
      
      <span style={valueStyle}>
        {displayValue}
      </span>

      {!result.isOriginal && showAccessLevel && (
        <div style={{
          padding: '1px 4px',
          backgroundColor: '#e5e7eb',
          color: '#6b7280',
          borderRadius: '8px',
          fontSize: '9px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {result.maskingApplied.join(',')}
        </div>
      )}
    </span>
  );
};

export interface MaskedTextProps {
  resource: string;
  field: string;
  value: string;
  context?: any;
  maxLength?: number;
  showFull?: boolean;
  className?: string;
}

export const MaskedText: React.FC<MaskedTextProps> = ({
  resource,
  field,
  value,
  context,
  maxLength = 100,
  showFull = false,
  className = ''
}) => {
  const maskField = useFieldMask();
  const result = maskField(resource, field, value, context);

  if (result.accessLevel === 'denied' || result.accessLevel === 'hidden') {
    return (
      <div className={`masked-text-denied ${className}`} style={{
        padding: '8px 12px',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '6px',
        color: '#dc2626',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <AlertTriangle size={16} />
        Content access denied
      </div>
    );
  }

  let displayText = result.displayValue;
  let truncated = false;

  if (!showFull && displayText.length > maxLength) {
    displayText = displayText.substring(0, maxLength) + '...';
    truncated = true;
  }

  return (
    <div className={`masked-text ${className}`} style={{
      padding: '8px 12px',
      backgroundColor: result.isOriginal ? 'white' : '#fef3c7',
      border: `1px solid ${result.isOriginal ? '#e5e7eb' : '#fed7aa'}`,
      borderRadius: '6px',
      fontSize: '14px',
      lineHeight: '1.5',
      fontFamily: result.isOriginal ? 'inherit' : 'monospace',
      whiteSpace: 'pre-wrap'
    }}>
      {displayText}
      {truncated && (
        <span style={{ color: '#6b7280', fontStyle: 'italic' }}>
          {' '}(truncated)
        </span>
      )}
      {!result.isOriginal && (
        <div style={{
          marginTop: '8px',
          padding: '4px 8px',
          backgroundColor: '#f3f4f6',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#6b7280',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <Info size={12} />
          Content masked using {result.maskingApplied.join(', ')} strategy
        </div>
      )}
    </div>
  );
};

export default MaskedField;