import React, { useState } from 'react';
import {
  Database,
  Users,
  Settings,
  ChevronDown,
  Circle,
  CheckCircle,
  AlertTriangle,
  Clock,
  MoreVertical,
  Eye,
  Sliders,
  Power,
  PowerOff
} from 'lucide-react';

interface ModuleCardProps {
  module: {
    code: string;
    name: string;
    description: string;
    category: string;
    status: 'active' | 'inactive' | 'trial' | 'suspended';
    version: string;
    usageStats: {
      activeUsers: number;
      totalUsers: number;
      lastActivity: Date;
      storageUsed?: string;
      apiCalls?: number;
      usagePercentage: number;
    };
    trialInfo?: {
      expiresAt: Date;
      daysRemaining: number;
    };
    permissions: {
      canDisable: boolean;
      canConfigure: boolean;
      canViewStats: boolean;
    };
  };
  onViewDetails: (module: any) => void;
  onConfigure: (module: any) => void;
  onToggleStatus: (module: any, action: 'enable' | 'disable') => void;
}

const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  onViewDetails,
  onConfigure,
  onToggleStatus
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' };
      case 'trial': return { bg: '#fef3c7', text: '#d97706', border: '#fcd34d' };
      case 'inactive': return { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' };
      case 'suspended': return { bg: '#fecaca', text: '#dc2626', border: '#fca5a5' };
      default: return { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle size={14} />;
      case 'trial': return <Clock size={14} />;
      case 'inactive': return <Circle size={14} />;
      case 'suspended': return <AlertTriangle size={14} />;
      default: return <Circle size={14} />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'core': return <Database size={24} color="#3b82f6" />;
      case 'business': return <Users size={24} color="#10b981" />;
      case 'integration': return <Settings size={24} color="#f59e0b" />;
      default: return <Database size={24} color="#6b7280" />;
    }
  };

  const getCategoryBg = (category: string) => {
    switch (category.toLowerCase()) {
      case 'core': return '#eff6ff';
      case 'business': return '#f0fdf4';
      case 'integration': return '#fffbeb';
      default: return '#f3f4f6';
    }
  };

  const formatLastActivity = (date: Date) => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const statusColors = getStatusColor(module.status);

  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      position: 'relative',
      transition: 'all 0.2s ease'
    }}>
      {/* Module Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          {/* Module Icon */}
          <div style={{
            padding: '8px',
            backgroundColor: getCategoryBg(module.category),
            borderRadius: '8px'
          }}>
            {getCategoryIcon(module.category)}
          </div>
          
          {/* Module Info */}
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '4px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0
              }}>
                {module.name}
              </h3>
              <span style={{
                fontSize: '12px',
                color: '#6b7280',
                backgroundColor: '#f3f4f6',
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                v{module.version}
              </span>
            </div>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: 0,
              lineHeight: '1.4'
            }}>
              {module.description}
            </p>
          </div>
        </div>

        {/* Actions Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              padding: '6px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <MoreVertical size={16} color="#6b7280" />
          </button>

          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              zIndex: 10,
              minWidth: '180px',
              marginTop: '4px'
            }}>
              {module.permissions.canViewStats && (
                <button
                  onClick={() => {
                    onViewDetails(module);
                    setDropdownOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#374151',
                    fontSize: '14px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <Eye size={16} />
                  View Details
                </button>
              )}
              
              {module.permissions.canConfigure && (
                <button
                  onClick={() => {
                    onConfigure(module);
                    setDropdownOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#374151',
                    fontSize: '14px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <Sliders size={16} />
                  Configure
                </button>
              )}

              {module.permissions.canDisable && (
                <>
                  <div style={{
                    height: '1px',
                    backgroundColor: '#e5e7eb',
                    margin: '4px 0'
                  }} />
                  
                  {module.status === 'active' ? (
                    <button
                      onClick={() => {
                        onToggleStatus(module, 'disable');
                        setDropdownOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '12px 16px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#dc2626',
                        fontSize: '14px',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <PowerOff size={16} />
                      Disable Module
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onToggleStatus(module, 'enable');
                        setDropdownOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '12px 16px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#10b981',
                        fontSize: '14px',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <Power size={16} />
                      Enable Module
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '16px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px',
          backgroundColor: statusColors.bg,
          border: `1px solid ${statusColors.border}`,
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '500',
          color: statusColors.text
        }}>
          {getStatusIcon(module.status)}
          {module.status.charAt(0).toUpperCase() + module.status.slice(1)}
        </div>

        {/* Trial Info */}
        {module.status === 'trial' && module.trialInfo && (
          <div style={{
            fontSize: '12px',
            color: '#d97706',
            fontWeight: '500'
          }}>
            {module.trialInfo.daysRemaining} days left
          </div>
        )}
      </div>

      {/* Usage Stats */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            Usage ({module.usageStats.activeUsers}/{module.usageStats.totalUsers} users)
          </span>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
            {module.usageStats.usagePercentage}%
          </span>
        </div>
        
        {/* Usage Progress Bar */}
        <div style={{
          width: '100%',
          height: '6px',
          backgroundColor: '#f3f4f6',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${module.usageStats.usagePercentage}%`,
            height: '100%',
            backgroundColor: module.status === 'active' ? '#10b981' : 
                           module.status === 'trial' ? '#f59e0b' : '#6b7280',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* Additional Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        fontSize: '12px',
        color: '#6b7280'
      }}>
        <div>
          <div style={{ fontWeight: '500', color: '#374151' }}>Last Activity</div>
          <div>{formatLastActivity(module.usageStats.lastActivity)}</div>
        </div>
        <div>
          <div style={{ fontWeight: '500', color: '#374151' }}>
            {module.usageStats.storageUsed ? 'Storage' : 'API Calls'}
          </div>
          <div>
            {module.usageStats.storageUsed || 
             (module.usageStats.apiCalls ? `${module.usageStats.apiCalls.toLocaleString()}` : 'N/A')}
          </div>
        </div>
      </div>

      {/* Click overlay to close dropdown */}
      {dropdownOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 5
          }}
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default ModuleCard;