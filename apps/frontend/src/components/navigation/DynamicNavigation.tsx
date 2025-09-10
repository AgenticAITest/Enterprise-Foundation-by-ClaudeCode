import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useNavigation } from '@/contexts/NavigationContext';
import { 
  ChevronDown, 
  ChevronRight, 
  Home,
  DollarSign,
  Users,
  TrendingUp,
  Settings,
  BarChart3,
  Calculator,
  FileText,
  Shield
} from 'lucide-react';

// Icon mapping for navigation items
const iconMap: Record<string, React.ComponentType<any>> = {
  Home,
  DollarSign,
  Users,
  TrendingUp,
  Settings,
  BarChart3,
  Calculator,
  FileText,
  Shield
};

interface NavigationItemProps {
  item: any;
  level?: number;
  isCollapsed?: boolean;
}

const NavigationItemComponent: React.FC<NavigationItemProps> = ({ 
  item, 
  level = 0, 
  isCollapsed = false 
}) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  const Icon = item.icon ? iconMap[item.icon] : null;
  const hasChildren = item.children && item.children.length > 0;
  const isActive = location.pathname === item.path;
  const isParentActive = item.children?.some((child: any) => 
    location.pathname === child.path
  );

  const paddingLeft = `${16 + (level * 16)}px`;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            paddingLeft,
            backgroundColor: isParentActive ? '#eff6ff' : 'transparent',
            color: isParentActive ? '#2563eb' : '#374151',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            textAlign: 'left'
          }}
        >
          {Icon && <Icon size={18} />}
          {!isCollapsed && (
            <>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{
                  padding: '2px 6px',
                  fontSize: '10px',
                  fontWeight: '600',
                  backgroundColor: typeof item.badge === 'string' ? '#10b981' : '#6b7280',
                  color: 'white',
                  borderRadius: '10px'
                }}>
                  {item.badge}
                </span>
              )}
              {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </>
          )}
        </button>
        
        {isOpen && !isCollapsed && (
          <div style={{ marginTop: '4px' }}>
            {item.children.map((child: any) => (
              <NavigationItemComponent
                key={child.id}
                item={child}
                level={level + 1}
                isCollapsed={isCollapsed}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={item.path}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        paddingLeft,
        backgroundColor: isActive ? '#eff6ff' : 'transparent',
        color: isActive ? '#2563eb' : '#374151',
        borderRadius: '6px',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.2s ease'
      }}
    >
      {Icon && <Icon size={18} />}
      {!isCollapsed && (
        <>
          <span style={{ flex: 1 }}>{item.label}</span>
          {item.badge && (
            <span style={{
              padding: '2px 6px',
              fontSize: '10px',
              fontWeight: '600',
              backgroundColor: typeof item.badge === 'string' ? 
                (item.badge === 'New' ? '#10b981' : '#f59e0b') : '#6b7280',
              color: 'white',
              borderRadius: '10px'
            }}>
              {item.badge}
            </span>
          )}
          {item.isNew && (
            <span style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#10b981',
              borderRadius: '50%'
            }} />
          )}
        </>
      )}
    </Link>
  );
};

interface NavigationGroupProps {
  group: any;
  isCollapsed?: boolean;
}

const NavigationGroup: React.FC<NavigationGroupProps> = ({ group, isCollapsed = false }) => {
  const [isOpen, setIsOpen] = useState(group.defaultOpen !== false);
  const GroupIcon = group.icon ? iconMap[group.icon] : null;

  return (
    <div style={{ marginBottom: '24px' }}>
      {group.collapsible && !isCollapsed ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            marginBottom: '8px',
            backgroundColor: 'transparent',
            color: '#6b7280',
            border: 'none',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            textAlign: 'left'
          }}
        >
          {GroupIcon && <GroupIcon size={12} />}
          <span style={{ flex: 1 }}>{group.label}</span>
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      ) : (
        !isCollapsed && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            marginBottom: '8px',
            color: '#6b7280',
            fontSize: '11px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {GroupIcon && <GroupIcon size={12} />}
            {group.label}
          </div>
        )
      )}

      {(isOpen || !group.collapsible) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {group.items.map((item: any) => (
            <NavigationItemComponent
              key={item.id}
              item={item}
              isCollapsed={isCollapsed}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface DynamicNavigationProps {
  variant?: 'sidebar' | 'horizontal' | 'mobile';
  isCollapsed?: boolean;
  maxWidth?: string;
  className?: string;
}

const DynamicNavigation: React.FC<DynamicNavigationProps> = ({
  variant = 'sidebar',
  isCollapsed = false,
  maxWidth = '100%',
  className
}) => {
  const { getAccessibleNavigation, isLoading } = useNavigation();
  
  if (isLoading) {
    return (
      <div style={{
        padding: '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          width: '20px',
          height: '20px',
          border: '2px solid #e5e7eb',
          borderTop: '2px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  const accessibleNavigation = getAccessibleNavigation();

  if (variant === 'horizontal') {
    return (
      <nav style={{
        display: 'flex',
        gap: '8px',
        padding: '12px 0',
        borderBottom: '1px solid #e5e7eb',
        maxWidth,
        overflowX: 'auto'
      }} className={className}>
        {accessibleNavigation.map(group => (
          group.items.map(item => {
            const Icon = item.icon ? iconMap[item.icon] : null;
            const location = useLocation();
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.id}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: isActive ? '#eff6ff' : 'transparent',
                  color: isActive ? '#2563eb' : '#374151',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
              >
                {Icon && <Icon size={16} />}
                {item.label}
                {item.badge && (
                  <span style={{
                    padding: '2px 6px',
                    fontSize: '10px',
                    fontWeight: '600',
                    backgroundColor: typeof item.badge === 'string' ? '#10b981' : '#6b7280',
                    color: 'white',
                    borderRadius: '10px'
                  }}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })
        ))}
      </nav>
    );
  }

  // Sidebar variant (default)
  return (
    <nav style={{ 
      width: '100%',
      maxWidth,
      padding: isCollapsed ? '12px 8px' : '16px'
    }} className={className}>
      {accessibleNavigation.map(group => (
        <NavigationGroup
          key={group.id}
          group={group}
          isCollapsed={isCollapsed}
        />
      ))}
    </nav>
  );
};

export default DynamicNavigation;