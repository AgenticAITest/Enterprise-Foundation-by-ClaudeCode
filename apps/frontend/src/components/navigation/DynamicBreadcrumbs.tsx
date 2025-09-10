import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useNavigation } from '@/contexts/NavigationContext';
import { ChevronRight, Home } from 'lucide-react';

interface DynamicBreadcrumbsProps {
  variant?: 'default' | 'compact' | 'minimal';
  showHome?: boolean;
  separator?: React.ComponentType<any>;
  maxItems?: number;
  className?: string;
}

const DynamicBreadcrumbs: React.FC<DynamicBreadcrumbsProps> = ({
  variant = 'default',
  showHome = true,
  separator = ChevronRight,
  maxItems = 5,
  className
}) => {
  const location = useLocation();
  const { getBreadcrumbs, findNavigationItem } = useNavigation();
  
  const breadcrumbs = getBreadcrumbs(location.pathname);
  const Separator = separator;

  // Limit breadcrumbs if maxItems is set
  const displayBreadcrumbs = breadcrumbs.length > maxItems 
    ? [
        ...breadcrumbs.slice(0, 1), // Keep first item
        { id: 'ellipsis', label: '...', path: '', permissions: [] }, // Add ellipsis
        ...breadcrumbs.slice(-(maxItems - 2)) // Keep last items
      ]
    : breadcrumbs;

  if (breadcrumbs.length === 0 && !showHome) {
    return null;
  }

  const renderBreadcrumbItem = (item: any, index: number, isLast: boolean) => {
    if (item.id === 'ellipsis') {
      return (
        <span key="ellipsis" style={{
          color: '#9ca3af',
          fontSize: variant === 'compact' ? '12px' : '14px'
        }}>
          ...
        </span>
      );
    }

    const isClickable = !isLast && item.path;

    const baseStyles = {
      fontSize: variant === 'compact' ? '12px' : '14px',
      fontWeight: isLast ? '500' : '400',
      color: isLast ? '#1f2937' : '#6b7280',
      textDecoration: 'none',
      transition: 'color 0.2s ease'
    };

    if (isClickable) {
      return (
        <Link
          key={item.id}
          to={item.path}
          style={baseStyles}
        >
          {item.label}
        </Link>
      );
    }

    return (
      <span key={item.id} style={baseStyles}>
        {item.label}
      </span>
    );
  };

  const renderSeparator = (index: number) => (
    <Separator
      key={`separator-${index}`}
      size={variant === 'compact' ? 14 : 16}
      style={{ color: '#d1d5db', margin: '0 8px' }}
    />
  );

  if (variant === 'minimal') {
    const currentItem = breadcrumbs[breadcrumbs.length - 1];
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        fontSize: '14px',
        color: '#6b7280'
      }} className={className}>
        {currentItem ? (
          <span style={{ fontWeight: '500', color: '#1f2937' }}>
            {currentItem.label}
          </span>
        ) : (
          showHome && (
            <span style={{ fontWeight: '500', color: '#1f2937' }}>
              Dashboard
            </span>
          )
        )}
      </div>
    );
  }

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      fontSize: variant === 'compact' ? '12px' : '14px',
      padding: variant === 'compact' ? '8px 0' : '12px 0'
    }} className={className}>
      {showHome && (
        <>
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#6b7280',
              textDecoration: 'none',
              fontSize: variant === 'compact' ? '12px' : '14px',
              fontWeight: '400',
              transition: 'color 0.2s ease'
            }}
          >
            <Home size={variant === 'compact' ? 14 : 16} />
            {variant !== 'compact' && 'Home'}
          </Link>
          
          {displayBreadcrumbs.length > 0 && renderSeparator(0)}
        </>
      )}

      {displayBreadcrumbs.map((item, index) => (
        <React.Fragment key={item.id || index}>
          {renderBreadcrumbItem(item, index, index === displayBreadcrumbs.length - 1)}
          {index < displayBreadcrumbs.length - 1 && renderSeparator(index + 1)}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default DynamicBreadcrumbs;