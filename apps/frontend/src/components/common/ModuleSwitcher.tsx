import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronRight,
  Home,
  DollarSign,
  Users,
  TrendingUp,
  Package,
  Briefcase,
  Settings,
  Clock,
  Activity,
  AlertCircle,
  CheckCircle,
  Pause,
  Search,
  Grid3X3,
  List,
  Filter
} from 'lucide-react';
import { useModule, Module } from '@/contexts/ModuleContext';
import useModuleAccess from '@/hooks/useModuleAccess';

interface Props {
  variant?: 'dropdown' | 'sidebar' | 'grid';
  className?: string;
  showUsageStats?: boolean;
  showRecentModules?: boolean;
}

const getModuleIcon = (iconName: string = 'Home') => {
  const icons = {
    Home,
    DollarSign,
    Users,
    TrendingUp,
    Package,
    Briefcase,
    Settings
  };
  const IconComponent = icons[iconName as keyof typeof icons] || Home;
  return IconComponent;
};

const getStatusIcon = (status: Module['status']) => {
  switch (status) {
    case 'active': return <CheckCircle size={12} style={{ color: '#10b981' }} />;
    case 'trial': return <Clock size={12} style={{ color: '#f59e0b' }} />;
    case 'inactive': return <Pause size={12} style={{ color: '#6b7280' }} />;
    case 'suspended': return <AlertCircle size={12} style={{ color: '#ef4444' }} />;
    default: return <CheckCircle size={12} style={{ color: '#6b7280' }} />;
  }
};

const getStatusColor = (status: Module['status']) => {
  switch (status) {
    case 'active': return '#10b981';
    case 'trial': return '#f59e0b';
    case 'inactive': return '#6b7280';
    case 'suspended': return '#ef4444';
    default: return '#6b7280';
  }
};

const ModuleSwitcher: React.FC<Props> = ({
  variant = 'dropdown',
  className = '',
  showUsageStats = true,
  showRecentModules = true
}) => {
  const { currentModule, switchModule, isLoading } = useModule();
  const {
    getAccessibleModules,
    getModulesByCategory,
    getRecentModules,
    canSwitchToModule
  } = useModuleAccess();

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const accessibleModules = getAccessibleModules();
  const modulesByCategory = getModulesByCategory();
  const recentModules = getRecentModules(3);
  const categories = Object.keys(modulesByCategory);

  const filteredModules = searchTerm 
    ? accessibleModules.filter(module =>
        module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : selectedCategory === 'all' 
      ? accessibleModules 
      : modulesByCategory[selectedCategory] || [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleModuleSwitch = (moduleCode: string) => {
    if (canSwitchToModule(moduleCode)) {
      switchModule(moduleCode);
      setIsOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{
        padding: '12px 16px',
        color: '#6b7280',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <div style={{
          width: '16px',
          height: '16px',
          border: '2px solid #e5e7eb',
          borderTop: '2px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        Loading modules...
      </div>
    );
  }

  const renderModuleCard = (module: Module, compact = false) => {
    const IconComponent = getModuleIcon(module.icon);
    const isCurrentModule = currentModule?.code === module.code;
    const canSwitch = canSwitchToModule(module.code);

    return (
      <div
        key={module.code}
        onClick={() => canSwitch && handleModuleSwitch(module.code)}
        style={{
          padding: compact ? '8px 12px' : '12px 16px',
          cursor: canSwitch ? 'pointer' : 'not-allowed',
          borderRadius: '6px',
          border: isCurrentModule ? '2px solid #3b82f6' : '1px solid #e5e7eb',
          backgroundColor: isCurrentModule ? '#f0f9ff' : canSwitch ? 'white' : '#f9fafb',
          opacity: canSwitch ? 1 : 0.6,
          display: 'flex',
          alignItems: compact ? 'center' : 'flex-start',
          gap: '12px',
          transition: 'all 0.2s',
        }}
      >
        <div style={{
          color: isCurrentModule ? '#3b82f6' : '#6b7280',
          flexShrink: 0
        }}>
          <IconComponent size={compact ? 16 : 20} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: compact ? 0 : '4px'
          }}>
            <span style={{
              fontSize: compact ? '13px' : '14px',
              fontWeight: isCurrentModule ? '600' : '500',
              color: isCurrentModule ? '#1f2937' : '#374151',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {module.name}
            </span>
            {getStatusIcon(module.status)}
            {isCurrentModule && (
              <span style={{
                fontSize: '10px',
                padding: '1px 4px',
                backgroundColor: '#3b82f6',
                color: 'white',
                borderRadius: '3px',
                textTransform: 'uppercase',
                fontWeight: '600'
              }}>
                Active
              </span>
            )}
          </div>

          {!compact && (
            <div style={{
              fontSize: '12px',
              color: '#6b7280',
              marginBottom: '8px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {module.description}
            </div>
          )}

          {!compact && showUsageStats && module.metadata?.usage && (
            <div style={{
              display: 'flex',
              gap: '12px',
              fontSize: '11px',
              color: '#9ca3af'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <Activity size={10} />
                {module.metadata.usage.dailyActions} today
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <TrendingUp size={10} />
                {module.metadata.usage.weeklyActions} week
              </div>
            </div>
          )}

          {compact && module.status === 'trial' && (
            <div style={{
              fontSize: '10px',
              color: '#f59e0b',
              fontWeight: '500'
            }}>
              Trial
            </div>
          )}
        </div>

        {!compact && !canSwitch && (
          <div style={{
            fontSize: '11px',
            color: '#ef4444',
            textAlign: 'center',
            padding: '4px 8px',
            backgroundColor: '#fee2e2',
            borderRadius: '4px',
            whiteSpace: 'nowrap'
          }}>
            No Access
          </div>
        )}
      </div>
    );
  };

  if (variant === 'sidebar') {
    return (
      <div className={className} style={{ width: '280px' }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f8fafc'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#1f2937',
            margin: '0 0 8px 0'
          }}>
            Available Modules
          </h3>
          <p style={{
            fontSize: '12px',
            color: '#6b7280',
            margin: 0
          }}>
            {accessibleModules.length} of {accessibleModules.length} accessible
          </p>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{
              position: 'absolute',
              left: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af'
            }} />
            <input
              type="text"
              placeholder="Search modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px 6px 28px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '12px',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Recent Modules */}
        {showRecentModules && recentModules.length > 0 && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
            <h4 style={{
              fontSize: '12px',
              fontWeight: '500',
              color: '#6b7280',
              margin: '0 0 8px 0',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Recent
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {recentModules.map(module => renderModuleCard(module, true))}
            </div>
          </div>
        )}

        {/* All Modules */}
        <div style={{ padding: '12px 16px' }}>
          <h4 style={{
            fontSize: '12px',
            fontWeight: '500',
            color: '#6b7280',
            margin: '0 0 8px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            All Modules
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredModules.map(module => renderModuleCard(module, true))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div className={className}>
        {/* Header with Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'between',
          marginBottom: '16px',
          padding: '12px 16px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px'
        }}>
          <div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937',
              margin: '0 0 4px 0'
            }}>
              Available Modules
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: 0
            }}>
              {filteredModules.length} modules available
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '6px 8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '12px',
                backgroundColor: 'white'
              }}
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div style={{
              display: 'flex',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '6px 8px',
                  backgroundColor: viewMode === 'grid' ? '#3b82f6' : 'white',
                  color: viewMode === 'grid' ? 'white' : '#6b7280',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Grid3X3 size={14} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '6px 8px',
                  backgroundColor: viewMode === 'list' ? '#3b82f6' : 'white',
                  color: viewMode === 'list' ? 'white' : '#6b7280',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <Search size={16} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af'
          }} />
          <input
            type="text"
            placeholder="Search modules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        {/* Modules Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: viewMode === 'grid' 
            ? 'repeat(auto-fill, minmax(300px, 1fr))' 
            : '1fr',
          gap: '16px'
        }}>
          {filteredModules.map(module => renderModuleCard(module, viewMode === 'list'))}
        </div>

        {filteredModules.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#6b7280'
          }}>
            <Package size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
              No modules found
            </h3>
            <p style={{ fontSize: '14px' }}>
              Try adjusting your search or category filter.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div ref={dropdownRef} className={className} style={{ position: 'relative' }}>
      {/* Dropdown Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151',
          minWidth: '200px',
          justifyContent: 'between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {currentModule && (
            <div style={{ color: '#6b7280' }}>
              {React.createElement(getModuleIcon(currentModule.icon), { size: 16 })}
            </div>
          )}
          <span>
            {currentModule ? currentModule.name : 'Select Module'}
          </span>
        </div>
        <ChevronDown 
          size={16} 
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s'
          }} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          backgroundColor: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          zIndex: 50,
          maxHeight: '400px',
          overflow: 'auto'
        }}>
          {/* Search in dropdown */}
          <div style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{
                position: 'absolute',
                left: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af'
              }} />
              <input
                type="text"
                placeholder="Search modules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px 6px 28px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '12px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Recent Modules Section */}
          {showRecentModules && recentModules.length > 0 && (
            <div style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: '500',
                color: '#6b7280',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Recent
              </div>
              {recentModules.map(module => renderModuleCard(module, true))}
            </div>
          )}

          {/* All Modules */}
          <div style={{ padding: '8px' }}>
            {filteredModules.length > 0 ? (
              filteredModules.map(module => renderModuleCard(module, true))
            ) : (
              <div style={{
                padding: '16px',
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '12px'
              }}>
                No modules found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleSwitcher;