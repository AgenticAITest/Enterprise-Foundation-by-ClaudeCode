import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Star,
  Users,
  Shield,
  Crown,
  Eye,
  Plus,
  BarChart3,
  Zap,
  Award,
  TrendingUp,
  ChevronDown,
  Settings,
  Database,
  Warehouse,
  Calculator,
  ShoppingCart,
  UserCheck,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';

interface RoleTemplate {
  id: string;
  code: string;
  name: string;
  description: string;
  moduleCode: string;
  complexity: 'basic' | 'intermediate' | 'advanced';
  popularity: number;
  usageCount: number;
  recommendedUserCount: {
    min: number;
    max: number;
  };
  permissions: {
    [resourceCode: string]: {
      actions: string[];
      granted: boolean;
      conditional?: boolean;
    }
  };
  version: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  useCases: string[];
  industries: string[];
  companySize: 'startup' | 'small' | 'medium' | 'enterprise';
  customizable: {
    permissions: boolean;
    dataScopes: boolean;
    name: boolean;
  };
  isPopular?: boolean;
  isTrending?: boolean;
  isRecommended?: boolean;
}

interface RoleTemplatesBrowserProps {
  selectedModule: string;
  roleTemplates: RoleTemplate[];
  onTemplateSelect: (templateId: string) => void;
  onTemplatePreview: (template: RoleTemplate) => void;
  onTemplateApply: (templateId: string, customizations?: any) => void;
  onCreateCustomRole: () => void;
  onCompareTemplates: (templateIds: string[]) => void;
}

const RoleTemplatesBrowser: React.FC<RoleTemplatesBrowserProps> = ({
  selectedModule,
  roleTemplates,
  onTemplateSelect,
  onTemplatePreview,
  onTemplateApply,
  onCreateCustomRole,
  onCompareTemplates
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [complexityFilter, setComplexityFilter] = useState<'all' | 'basic' | 'intermediate' | 'advanced'>('all');
  const [companySizeFilter, setCompanySizeFilter] = useState<'all' | 'startup' | 'small' | 'medium' | 'enterprise'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'popularity' | 'usage' | 'newest'>('popularity');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Get module icon
  const getModuleIcon = (moduleCode: string) => {
    switch (moduleCode) {
      case 'core': return <Database size={16} color="#3b82f6" />;
      case 'wms': return <Warehouse size={16} color="#10b981" />;
      case 'accounting': return <Calculator size={16} color="#f59e0b" />;
      case 'pos': return <ShoppingCart size={16} color="#8b5cf6" />;
      case 'hr': return <UserCheck size={16} color="#ef4444" />;
      default: return <Settings size={16} color="#6b7280" />;
    }
  };

  // Get complexity color and icon
  const getComplexityDisplay = (complexity: string) => {
    switch (complexity) {
      case 'basic': return { color: '#10b981', bg: '#dcfce7', icon: '🟢', label: 'Basic' };
      case 'intermediate': return { color: '#f59e0b', bg: '#fef3c7', icon: '🟡', label: 'Intermediate' };
      case 'advanced': return { color: '#ef4444', bg: '#fef2f2', icon: '🔴', label: 'Advanced' };
      default: return { color: '#6b7280', bg: '#f3f4f6', icon: '⚪', label: 'Unknown' };
    }
  };

  // Get company size display
  const getCompanySizeDisplay = (size: string) => {
    switch (size) {
      case 'startup': return { icon: '🚀', label: 'Startup (1-10)' };
      case 'small': return { icon: '🏢', label: 'Small (10-50)' };
      case 'medium': return { icon: '🏬', label: 'Medium (50-200)' };
      case 'enterprise': return { icon: '🌐', label: 'Enterprise (200+)' };
      default: return { icon: '📊', label: 'Any Size' };
    }
  };

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let filtered = roleTemplates.filter(template => {
      // Module filter
      if (selectedModule !== 'all' && template.moduleCode !== selectedModule) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (!template.name.toLowerCase().includes(search) &&
            !template.description.toLowerCase().includes(search) &&
            !template.tags.some(tag => tag.toLowerCase().includes(search))) {
          return false;
        }
      }

      // Complexity filter
      if (complexityFilter !== 'all' && template.complexity !== complexityFilter) {
        return false;
      }

      // Company size filter
      if (companySizeFilter !== 'all' && template.companySize !== companySizeFilter) {
        return false;
      }

      return true;
    });

    // Sort templates
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          return b.popularity - a.popularity;
        case 'usage':
          return b.usageCount - a.usageCount;
        case 'newest':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [roleTemplates, selectedModule, searchTerm, complexityFilter, companySizeFilter, sortBy]);

  // Get popular templates
  const popularTemplates = useMemo(() => {
    return roleTemplates
      .filter(t => t.isPopular || t.isTrending || t.isRecommended)
      .slice(0, 6);
  }, [roleTemplates]);

  // Handle template selection for comparison
  const handleTemplateSelect = (templateId: string, selected: boolean) => {
    if (selected && selectedTemplates.length < 3) {
      setSelectedTemplates([...selectedTemplates, templateId]);
    } else if (!selected) {
      setSelectedTemplates(selectedTemplates.filter(id => id !== templateId));
    }
  };

  // Get permission count for template
  const getPermissionCount = (template: RoleTemplate) => {
    return Object.values(template.permissions).reduce(
      (count, permission) => count + permission.actions.length,
      0
    );
  };

  // Render star rating
  const renderStarRating = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={12}
        color={i < rating ? "#f59e0b" : "#e5e7eb"}
        fill={i < rating ? "#f59e0b" : "transparent"}
      />
    ));
  };

  // Render template card
  const renderTemplateCard = (template: RoleTemplate) => {
    const complexity = getComplexityDisplay(template.complexity);
    const companySize = getCompanySizeDisplay(template.companySize);
    const permissionCount = getPermissionCount(template);
    const isSelected = selectedTemplates.includes(template.id);

    return (
      <div
        key={template.id}
        style={{
          backgroundColor: 'white',
          border: `2px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`,
          borderRadius: '8px',
          padding: '20px',
          position: 'relative',
          cursor: 'pointer'
        }}
        onClick={() => onTemplateSelect(template.id)}
      >
        {/* Template badges */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          display: 'flex',
          gap: '4px'
        }}>
          {template.isPopular && (
            <div style={{
              backgroundColor: '#fef3c7',
              color: '#d97706',
              fontSize: '10px',
              fontWeight: '600',
              padding: '2px 6px',
              borderRadius: '12px'
            }}>
              🔥 Popular
            </div>
          )}
          {template.isTrending && (
            <div style={{
              backgroundColor: '#dcfce7',
              color: '#16a34a',
              fontSize: '10px',
              fontWeight: '600',
              padding: '2px 6px',
              borderRadius: '12px'
            }}>
              📈 Trending
            </div>
          )}
          {template.isRecommended && (
            <div style={{
              backgroundColor: '#dbeafe',
              color: '#1d4ed8',
              fontSize: '10px',
              fontWeight: '600',
              padding: '2px 6px',
              borderRadius: '12px'
            }}>
              ⭐ Recommended
            </div>
          )}
        </div>

        {/* Template header */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            {getModuleIcon(template.moduleCode)}
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1f2937',
              margin: 0
            }}>
              {template.name}
            </h3>
            <div style={{
              fontSize: '11px',
              fontWeight: '500',
              padding: '2px 6px',
              borderRadius: '12px',
              backgroundColor: complexity.bg,
              color: complexity.color
            }}>
              {complexity.icon} {complexity.label}
            </div>
          </div>

          <p style={{
            fontSize: '13px',
            color: '#6b7280',
            margin: 0,
            lineHeight: '1.4'
          }}>
            {template.description}
          </p>
        </div>

        {/* Template metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              color: '#6b7280',
              marginBottom: '4px'
            }}>
              <Shield size={12} />
              Permissions
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>
              {permissionCount}
            </div>
          </div>
          
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              color: '#6b7280',
              marginBottom: '4px'
            }}>
              <Users size={12} />
              Team Size
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>
              {template.recommendedUserCount.min}-{template.recommendedUserCount.max}
            </div>
          </div>
        </div>

        {/* Rating and usage */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {renderStarRating(template.popularity)}
            <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '4px' }}>
              ({template.usageCount} uses)
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>
            {companySize.icon} {companySize.label}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTemplatePreview(template);
            }}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              backgroundColor: 'white',
              color: '#374151',
              fontSize: '13px',
              fontWeight: '500',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <Eye size={14} />
            Preview
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTemplateApply(template.id);
            }}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              backgroundColor: '#3b82f6',
              color: 'white',
              fontSize: '13px',
              fontWeight: '500',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <Plus size={14} />
            Apply
          </button>
        </div>

        {/* Selection checkbox for comparison */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px'
        }}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              handleTemplateSelect(template.id, e.target.checked);
            }}
            style={{
              width: '16px',
              height: '16px',
              cursor: 'pointer'
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#1f2937',
            margin: 0,
            marginBottom: '4px'
          }}>
            Role Templates
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: 0
          }}>
            Browse and deploy pre-configured role templates for {selectedModule.charAt(0).toUpperCase() + selectedModule.slice(1)} module
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onCreateCustomRole}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              border: '1px solid #e5e7eb',
              backgroundColor: 'white',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <Settings size={16} />
            Create Custom Role
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto auto auto auto',
        gap: '12px',
        marginBottom: '24px',
        alignItems: 'center'
      }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#6b7280'
          }} />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Complexity Filter */}
        <select
          value={complexityFilter}
          onChange={(e) => setComplexityFilter(e.target.value as any)}
          style={{
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: 'white'
          }}
        >
          <option value="all">All Complexity</option>
          <option value="basic">🟢 Basic</option>
          <option value="intermediate">🟡 Intermediate</option>
          <option value="advanced">🔴 Advanced</option>
        </select>

        {/* Company Size Filter */}
        <select
          value={companySizeFilter}
          onChange={(e) => setCompanySizeFilter(e.target.value as any)}
          style={{
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: 'white'
          }}
        >
          <option value="all">All Sizes</option>
          <option value="startup">🚀 Startup</option>
          <option value="small">🏢 Small</option>
          <option value="medium">🏬 Medium</option>
          <option value="enterprise">🌐 Enterprise</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          style={{
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: 'white'
          }}
        >
          <option value="popularity">⭐ Most Popular</option>
          <option value="usage">📊 Most Used</option>
          <option value="newest">🆕 Newest</option>
          <option value="name">🔤 Name</option>
        </select>

        {/* Results count */}
        <div style={{ fontSize: '14px', color: '#6b7280', whiteSpace: 'nowrap' }}>
          {filteredTemplates.length} templates
        </div>
      </div>

      {/* Comparison bar */}
      {selectedTemplates.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '6px',
          marginBottom: '24px'
        }}>
          <span style={{ fontSize: '14px', color: '#0369a1' }}>
            {selectedTemplates.length} template{selectedTemplates.length > 1 ? 's' : ''} selected for comparison
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setSelectedTemplates([])}
              style={{
                padding: '4px 8px',
                border: '1px solid #bae6fd',
                backgroundColor: 'white',
                color: '#0369a1',
                fontSize: '12px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
            {selectedTemplates.length >= 2 && (
              <button
                onClick={() => onCompareTemplates(selectedTemplates)}
                style={{
                  padding: '4px 8px',
                  border: 'none',
                  backgroundColor: '#0369a1',
                  color: 'white',
                  fontSize: '12px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Compare ({selectedTemplates.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Popular Templates Section */}
      {popularTemplates.length > 0 && searchTerm === '' && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Sparkles size={18} color="#f59e0b" />
            Popular Templates
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {popularTemplates.map(template => renderTemplateCard(template))}
          </div>
        </div>
      )}

      {/* All Templates Section */}
      <div>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#1f2937',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Database size={18} color="#3b82f6" />
          All Templates
        </h3>

        {filteredTemplates.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center'
          }}>
            <Database size={48} style={{ margin: '0 auto 16px', opacity: 0.5, color: '#6b7280' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              No templates found
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '16px' }}>
              {searchTerm || complexityFilter !== 'all' || companySizeFilter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : `No templates available for the ${selectedModule} module.`
              }
            </p>
            {(searchTerm || complexityFilter !== 'all' || companySizeFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setComplexityFilter('all');
                  setCompanySizeFilter('all');
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            {filteredTemplates.map(template => renderTemplateCard(template))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleTemplatesBrowser;