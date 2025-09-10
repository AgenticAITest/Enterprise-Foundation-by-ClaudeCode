import React, { ReactNode } from 'react';
import { usePermissionCheck, PermissionCheckOptions } from '@/hooks/usePermissionCheck';

interface ConditionalRenderProps extends PermissionCheckOptions {
  children: ReactNode;
  fallback?: ReactNode;
  inverse?: boolean; // Render when NOT authorized
  debug?: boolean;
}

/**
 * Component for conditional rendering based on permissions
 */
export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  children,
  fallback = null,
  inverse = false,
  debug = false,
  ...permissionOptions
}) => {
  const { allowed, loading, reason } = usePermissionCheck(permissionOptions);

  if (debug && process.env.NODE_ENV === 'development') {
    console.log('ConditionalRender:', { allowed, loading, reason, permissionOptions });
  }

  if (loading) {
    return <>{fallback}</>;
  }

  const shouldRender = inverse ? !allowed : allowed;
  return <>{shouldRender ? children : fallback}</>;
};

interface PermissionSwitchProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Switch component for multiple permission-based renders
 */
export const PermissionSwitch: React.FC<PermissionSwitchProps> = ({ 
  children, 
  fallback = null 
}) => {
  const childrenArray = React.Children.toArray(children);
  
  for (const child of childrenArray) {
    if (React.isValidElement(child) && child.type === PermissionCase) {
      const { allowed } = usePermissionCheck(child.props);
      if (allowed) {
        return <>{child.props.children}</>;
      }
    }
  }
  
  return <>{fallback}</>;
};

interface PermissionCaseProps extends PermissionCheckOptions {
  children: ReactNode;
}

/**
 * Case component for PermissionSwitch
 */
export const PermissionCase: React.FC<PermissionCaseProps> = ({ children }) => {
  return <>{children}</>;
};

interface ShowIfProps extends PermissionCheckOptions {
  children: ReactNode;
  debug?: boolean;
}

/**
 * Simple show/hide component based on permissions
 */
export const ShowIf: React.FC<ShowIfProps> = ({ children, debug, ...permissionOptions }) => {
  const { allowed, loading } = usePermissionCheck(permissionOptions);

  if (debug && process.env.NODE_ENV === 'development') {
    console.log('ShowIf:', { allowed, loading, permissionOptions });
  }

  if (loading || !allowed) {
    return null;
  }

  return <>{children}</>;
};

interface HideIfProps extends PermissionCheckOptions {
  children: ReactNode;
  debug?: boolean;
}

/**
 * Simple hide component based on permissions (inverse of ShowIf)
 */
export const HideIf: React.FC<HideIfProps> = ({ children, debug, ...permissionOptions }) => {
  const { allowed, loading } = usePermissionCheck(permissionOptions);

  if (debug && process.env.NODE_ENV === 'development') {
    console.log('HideIf:', { allowed, loading, permissionOptions });
  }

  if (loading || allowed) {
    return null;
  }

  return <>{children}</>;
};

export default ConditionalRender;