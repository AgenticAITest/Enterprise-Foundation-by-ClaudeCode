import React, { ButtonHTMLAttributes } from 'react';
import { usePermissionCheck, PermissionCheckOptions } from '@/hooks/usePermissionCheck';
import { Lock, Shield, Eye, EyeOff } from 'lucide-react';

interface PermissionButtonProps 
  extends ButtonHTMLAttributes<HTMLButtonElement>, 
    PermissionCheckOptions {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  disableWhenUnauthorized?: boolean;
  hideWhenUnauthorized?: boolean;
  loadingText?: string;
  unauthorizedText?: string;
  children: React.ReactNode;
}

/**
 * Button component with built-in permission checking
 */
export const PermissionButton: React.FC<PermissionButtonProps> = ({
  variant = 'primary',
  size = 'md',
  showIcon = false,
  disableWhenUnauthorized = false,
  hideWhenUnauthorized = false,
  loadingText = 'Loading...',
  unauthorizedText = 'Unauthorized',
  children,
  permissions,
  roles,
  resource,
  action,
  scope,
  requireAll,
  disabled,
  title,
  ...buttonProps
}) => {
  const { allowed, loading } = usePermissionCheck({
    permissions,
    roles,
    resource,
    action,
    scope,
    requireAll
  });

  // Hide button if not authorized and hideWhenUnauthorized is true
  if (!loading && !allowed && hideWhenUnauthorized) {
    return null;
  }

  const getVariantStyles = () => {
    const baseStyles = {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      border: 'none',
      borderRadius: '6px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontSize: size === 'sm' ? '14px' : size === 'lg' ? '16px' : '14px',
      padding: 
        size === 'sm' ? '6px 12px' : 
        size === 'lg' ? '12px 24px' : 
        '8px 16px'
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          backgroundColor: '#3b82f6',
          color: 'white'
        };
      case 'secondary':
        return {
          ...baseStyles,
          backgroundColor: '#f3f4f6',
          color: '#374151'
        };
      case 'outline':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: '#374151',
          border: '1px solid #d1d5db'
        };
      case 'ghost':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: '#374151'
        };
      case 'destructive':
        return {
          ...baseStyles,
          backgroundColor: '#dc2626',
          color: 'white'
        };
      default:
        return baseStyles;
    }
  };

  const getDisabledStyles = () => ({
    opacity: 0.6,
    cursor: 'not-allowed',
    backgroundColor: '#f3f4f6',
    color: '#9ca3af'
  });

  const buttonDisabled = disabled || loading || (!allowed && disableWhenUnauthorized);
  const buttonStyles = {
    ...getVariantStyles(),
    ...(buttonDisabled ? getDisabledStyles() : {})
  };

  const getButtonContent = () => {
    if (loading) {
      return (
        <>
          <div style={{
            width: '14px',
            height: '14px',
            border: '2px solid currentColor',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          {loadingText}
        </>
      );
    }

    if (!allowed && disableWhenUnauthorized) {
      return (
        <>
          {showIcon && <Lock size={16} />}
          {unauthorizedText}
        </>
      );
    }

    return (
      <>
        {showIcon && !allowed && <Shield size={16} />}
        {children}
      </>
    );
  };

  const buttonTitle = 
    !allowed && (disableWhenUnauthorized || hideWhenUnauthorized)
      ? `Access denied: insufficient permissions`
      : title;

  return (
    <button
      {...buttonProps}
      disabled={buttonDisabled}
      style={buttonStyles}
      title={buttonTitle}
    >
      {getButtonContent()}
    </button>
  );
};

interface PermissionLinkProps 
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    PermissionCheckOptions {
  showIcon?: boolean;
  hideWhenUnauthorized?: boolean;
  children: React.ReactNode;
}

/**
 * Link component with built-in permission checking
 */
export const PermissionLink: React.FC<PermissionLinkProps> = ({
  showIcon = false,
  hideWhenUnauthorized = false,
  children,
  permissions,
  roles,
  resource,
  action,
  scope,
  requireAll,
  style,
  title,
  onClick,
  ...linkProps
}) => {
  const { allowed, loading } = usePermissionCheck({
    permissions,
    roles,
    resource,
    action,
    scope,
    requireAll
  });

  if (!loading && !allowed && hideWhenUnauthorized) {
    return null;
  }

  const linkStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    textDecoration: 'none',
    color: allowed ? '#3b82f6' : '#9ca3af',
    cursor: allowed ? 'pointer' : 'not-allowed',
    opacity: allowed ? 1 : 0.6,
    transition: 'all 0.2s ease',
    ...style
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!allowed) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  const linkTitle = 
    !allowed ? 'Access denied: insufficient permissions' : title;

  return (
    <a
      {...linkProps}
      style={linkStyles}
      title={linkTitle}
      onClick={handleClick}
    >
      {showIcon && !allowed && <EyeOff size={14} />}
      {children}
    </a>
  );
};

export default PermissionButton;