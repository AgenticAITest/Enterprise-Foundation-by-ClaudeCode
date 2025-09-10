import React, { useState } from 'react';
import OrganizationalUnitsEditor from '@/components/admin/OrganizationalUnitsEditor';
import DataScopeManager from '@/components/admin/DataScopeManager';
import UserScopeAssignmentMatrix from '@/components/admin/UserScopeAssignmentMatrix';
import AccessLevelControls from '@/components/admin/AccessLevelControls';
import ScopeTestingPanel from '@/components/admin/ScopeTestingPanel';
import { Building2, Shield, Users, Settings, Play } from 'lucide-react';

/**
 * Data Scopes Configuration Page - Phase 5.2.5 Implementation
 * Complete data scope management with organizational units, scope definitions, 
 * user assignments, access controls, and testing capabilities
 */
const DataScopes: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'structure' | 'scopes' | 'assignments' | 'controls' | 'testing'>('structure');
  const [organizationalUnits, setOrganizationalUnits] = useState<any[]>([]);
  const [dataScopes, setDataScopes] = useState<any[]>([]);
  const [accessRules, setAccessRules] = useState<any[]>([]);
  const [selectedScope, setSelectedScope] = useState<string | null>(null);

  const handleUnitsChange = (units: any[]) => {
    setOrganizationalUnits(units);
  };

  const handleScopeChange = (scopes: any[]) => {
    setDataScopes(scopes);
  };

  const handleRulesChange = (rules: any[]) => {
    setAccessRules(rules);
  };

  const tabs = [
    {
      key: 'structure',
      label: 'Organizational Structure',
      icon: Building2,
      description: 'Define departments, teams, and locations'
    },
    {
      key: 'scopes',
      label: 'Data Scopes',
      icon: Shield,
      description: 'Create and manage data access scopes'
    },
    {
      key: 'assignments',
      label: 'User Assignments',
      icon: Users,
      description: 'Assign users to data scopes'
    },
    {
      key: 'controls',
      label: 'Access Controls',
      icon: Settings,
      description: 'Fine-tune access rules and permissions'
    },
    {
      key: 'testing',
      label: 'Testing Panel',
      icon: Play,
      description: 'Test and validate scope configurations'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'structure':
        return (
          <OrganizationalUnitsEditor
            onUnitsChange={handleUnitsChange}
          />
        );
      case 'scopes':
        return (
          <DataScopeManager
            organizationalUnits={organizationalUnits}
            onScopeChange={handleScopeChange}
          />
        );
      case 'assignments':
        return (
          <UserScopeAssignmentMatrix
            dataScopes={dataScopes}
            organizationalUnits={organizationalUnits}
          />
        );
      case 'controls':
        return (
          <AccessLevelControls
            dataScopes={dataScopes}
            selectedScopeId={selectedScope}
            onRulesChange={handleRulesChange}
          />
        );
      case 'testing':
        return (
          <ScopeTestingPanel
            dataScopes={dataScopes}
            accessRules={accessRules}
          />
        );
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
          Data Scope Configuration
        </h1>
        <p style={{ color: '#6b7280', margin: 0 }}>
          Configure data access boundaries, organizational units, and fine-grained permissions
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
            {organizationalUnits.length}
          </div>
          <div style={{ color: '#6b7280' }}>Organizational Units</div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#10b981' }}>
            {dataScopes.length}
          </div>
          <div style={{ color: '#6b7280' }}>Data Scopes</div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#f59e0b' }}>
            {accessRules.length}
          </div>
          <div style={{ color: '#6b7280' }}>Access Rules</div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#8b5cf6' }}>
            {dataScopes.filter(s => s.isActive).length}
          </div>
          <div style={{ color: '#6b7280' }}>Active Scopes</div>
        </div>
      </div>
    </div>
  );
};

export default DataScopes;