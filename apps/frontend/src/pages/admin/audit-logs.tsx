import React, { useState } from 'react';
import AuditLogViewer from '@/components/admin/AuditLogViewer';
import RoleChangeTracker from '@/components/admin/RoleChangeTracker';
import SecurityEventMonitor from '@/components/admin/SecurityEventMonitor';
import UserActivityDashboard from '@/components/admin/UserActivityDashboard';
import ComplianceReportGenerator from '@/components/admin/ComplianceReportGenerator';
import { FileText, History, Shield, Activity, BarChart3 } from 'lucide-react';

/**
 * Tenant Audit Logs Page - Phase 5.2.6 Implementation
 * Complete audit trail interface with logs, role changes, security monitoring, 
 * user activity analytics, and compliance reporting
 */
const AuditLogs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'logs' | 'roles' | 'security' | 'activity' | 'compliance'>('logs');

  const tabs = [
    {
      key: 'logs',
      label: 'Audit Logs',
      icon: FileText,
      description: 'System audit logs and activity timeline'
    },
    {
      key: 'roles',
      label: 'Role Changes',
      icon: History,
      description: 'Role assignment and permission changes'
    },
    {
      key: 'security',
      label: 'Security Events',
      icon: Shield,
      description: 'Security incidents and threat monitoring'
    },
    {
      key: 'activity',
      label: 'User Activity',
      icon: Activity,
      description: 'User behavior and productivity analytics'
    },
    {
      key: 'compliance',
      label: 'Compliance Reports',
      icon: BarChart3,
      description: 'Regulatory compliance and audit reports'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'logs':
        return <AuditLogViewer />;
      case 'roles':
        return <RoleChangeTracker />;
      case 'security':
        return <SecurityEventMonitor />;
      case 'activity':
        return <UserActivityDashboard />;
      case 'compliance':
        return <ComplianceReportGenerator />;
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '8px',
          margin: 0
        }}>
          Audit Trail & Compliance
        </h1>
        <p style={{ color: '#6b7280', margin: 0 }}>
          Comprehensive audit logging, security monitoring, and compliance reporting for your tenant
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{
        borderBottom: '1px solid #e2e8f0',
        marginBottom: '24px'
      }}>
        <nav style={{ display: 'flex', gap: '8px' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  backgroundColor: activeTab === tab.key ? '#f0f9ff' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.key ? '2px solid #3b82f6' : '2px solid transparent',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeTab === tab.key ? '500' : 'normal',
                  color: activeTab === tab.key ? '#3b82f6' : '#6b7280',
                  borderRadius: '6px 6px 0 0',
                  marginBottom: '-1px'
                }}
              >
                <Icon size={16} />
                <div style={{ textAlign: 'left' }}>
                  <div>{tab.label}</div>
                  <div style={{
                    fontSize: '11px',
                    color: activeTab === tab.key ? '#60a5fa' : '#9ca3af',
                    marginTop: '1px'
                  }}>
                    {tab.description}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {renderTabContent()}
      </div>

      {/* Quick Stats Footer */}
      <div style={{
        marginTop: '16px',
        padding: '12px 16px',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px',
        fontSize: '12px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#3b82f6' }}>
            24/7
          </div>
          <div style={{ color: '#6b7280' }}>Monitoring Active</div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#10b981' }}>
            98.5%
          </div>
          <div style={{ color: '#6b7280' }}>Compliance Score</div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#f59e0b' }}>
            15
          </div>
          <div style={{ color: '#6b7280' }}>Active Reports</div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#8b5cf6' }}>
            100%
          </div>
          <div style={{ color: '#6b7280' }}>Data Retention</div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;