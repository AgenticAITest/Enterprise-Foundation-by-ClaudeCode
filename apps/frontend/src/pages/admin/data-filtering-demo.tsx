import React, { useState, useMemo } from 'react';
import { DataScopeProvider, useDataScope, DataScopeLevel } from '@/contexts/DataScopeContext';
import { ScopedDataTable, TableColumn } from '@/components/data-scope/ScopedDataTable';
import { DataScopeFilter } from '@/components/data-scope/DataScopeFilter';
import { useDataFiltering, useDataAccess, useBulkDataOperations } from '@/hooks/useDataFiltering';
import {
  Database,
  Users,
  DollarSign,
  FileText,
  Shield,
  Filter,
  Eye,
  EyeOff,
  User,
  Building,
  Globe,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  BarChart3,
  Settings
} from 'lucide-react';

// Mock data structures
interface MockUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
  departmentId: string;
  teamId: string;
  userId: string;
  createdBy: string;
  createdAt: string;
  status: 'active' | 'inactive' | 'pending';
}

interface MockFinancialReport {
  id: string;
  title: string;
  type: 'budget' | 'expense' | 'revenue';
  amount: number;
  tenantId: string;
  departmentId: string;
  teamId?: string;
  createdBy: string;
  ownerId: string;
  quarter: string;
  status: 'draft' | 'submitted' | 'approved';
  createdAt: string;
}

interface MockDocument {
  id: string;
  filename: string;
  type: string;
  size: number;
  tenantId: string;
  departmentId?: string;
  teamId?: string;
  userId: string;
  createdBy: string;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
}

// Mock data generators
const mockUsers: MockUser[] = [
  {
    id: 'user_123',
    name: 'John Manager',
    email: 'john@company.com',
    role: 'Finance Manager',
    tenantId: 'tenant_456',
    departmentId: 'dept_finance',
    teamId: 'team_budget',
    userId: 'user_123',
    createdBy: 'admin_001',
    createdAt: '2024-01-15T10:30:00Z',
    status: 'active'
  },
  {
    id: 'user_456',
    name: 'Alice Analyst',
    email: 'alice@company.com',
    role: 'Financial Analyst',
    tenantId: 'tenant_456',
    departmentId: 'dept_finance',
    teamId: 'team_budget',
    userId: 'user_456',
    createdBy: 'user_123',
    createdAt: '2024-02-01T09:15:00Z',
    status: 'active'
  },
  {
    id: 'user_789',
    name: 'Bob Developer',
    email: 'bob@company.com',
    role: 'Software Engineer',
    tenantId: 'tenant_456',
    departmentId: 'dept_engineering',
    teamId: 'team_backend',
    userId: 'user_789',
    createdBy: 'admin_001',
    createdAt: '2024-01-20T14:45:00Z',
    status: 'active'
  },
  {
    id: 'user_999',
    name: 'Carol Admin',
    email: 'carol@company.com',
    role: 'System Admin',
    tenantId: 'tenant_456',
    departmentId: 'dept_admin',
    teamId: 'team_ops',
    userId: 'user_999',
    createdBy: 'admin_001',
    createdAt: '2024-01-01T08:00:00Z',
    status: 'active'
  }
];

const mockReports: MockFinancialReport[] = [
  {
    id: 'report_001',
    title: 'Q1 2024 Budget Analysis',
    type: 'budget',
    amount: 150000,
    tenantId: 'tenant_456',
    departmentId: 'dept_finance',
    teamId: 'team_budget',
    createdBy: 'user_123',
    ownerId: 'user_123',
    quarter: 'Q1 2024',
    status: 'approved',
    createdAt: '2024-03-01T10:00:00Z'
  },
  {
    id: 'report_002',
    title: 'February Expenses',
    type: 'expense',
    amount: 45000,
    tenantId: 'tenant_456',
    departmentId: 'dept_finance',
    createdBy: 'user_456',
    ownerId: 'user_456',
    quarter: 'Q1 2024',
    status: 'submitted',
    createdAt: '2024-02-28T16:30:00Z'
  },
  {
    id: 'report_003',
    title: 'Engineering Department Budget',
    type: 'budget',
    amount: 200000,
    tenantId: 'tenant_456',
    departmentId: 'dept_engineering',
    teamId: 'team_backend',
    createdBy: 'user_789',
    ownerId: 'user_789',
    quarter: 'Q1 2024',
    status: 'draft',
    createdAt: '2024-02-15T11:20:00Z'
  }
];

const mockDocuments: MockDocument[] = [
  {
    id: 'doc_001',
    filename: 'Budget Guidelines 2024.pdf',
    type: 'PDF',
    size: 2048000,
    tenantId: 'tenant_456',
    departmentId: 'dept_finance',
    teamId: 'team_budget',
    userId: 'user_123',
    createdBy: 'user_123',
    isPublic: true,
    tags: ['budget', 'guidelines', '2024'],
    createdAt: '2024-01-10T09:00:00Z'
  },
  {
    id: 'doc_002',
    filename: 'Personal Notes.txt',
    type: 'TXT',
    size: 5120,
    tenantId: 'tenant_456',
    departmentId: 'dept_finance',
    userId: 'user_456',
    createdBy: 'user_456',
    isPublic: false,
    tags: ['personal', 'notes'],
    createdAt: '2024-02-05T15:30:00Z'
  },
  {
    id: 'doc_003',
    filename: 'API Documentation.md',
    type: 'MD',
    size: 1024000,
    tenantId: 'tenant_456',
    departmentId: 'dept_engineering',
    teamId: 'team_backend',
    userId: 'user_789',
    createdBy: 'user_789',
    isPublic: true,
    tags: ['api', 'documentation', 'technical'],
    createdAt: '2024-02-20T13:45:00Z'
  }
];

const DataFilteringDemoContent: React.FC = () => {
  const [selectedResource, setSelectedResource] = useState<string>('users');
  const [selectedAction, setSelectedAction] = useState<string>('read');
  const [selectedScopes, setSelectedScopes] = useState<DataScopeLevel[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { userScope, getScopeDescription } = useDataScope();
  
  // Data access checks
  const userAccess = useDataAccess('users', selectedAction);
  const reportAccess = useDataAccess('financial_reports', selectedAction);
  const documentAccess = useDataAccess('documents', selectedAction);

  // Data filtering hooks
  const userFiltering = useDataFiltering(mockUsers, { 
    resource: 'users', 
    action: selectedAction 
  });
  
  const reportFiltering = useDataFiltering(mockReports, { 
    resource: 'financial_reports', 
    action: selectedAction 
  });
  
  const documentFiltering = useDataFiltering(mockDocuments, { 
    resource: 'documents', 
    action: selectedAction 
  });

  // Bulk operations
  const { validateBulkOperation, filterAccessibleItems } = useBulkDataOperations();

  // Table columns
  const userColumns: TableColumn<MockUser>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value, item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={16} style={{ color: '#6b7280' }} />
          <div>
            <div style={{ fontWeight: '500' }}>{value}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>{item.email}</div>
          </div>
        </div>
      )
    },
    { key: 'role', label: 'Role', sortable: true },
    {
      key: 'departmentId',
      label: 'Department',
      render: (value) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Building size={14} style={{ color: '#6b7280' }} />
          {value.replace('dept_', '')}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span style={{
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '500',
          backgroundColor: value === 'active' ? '#dcfce7' : '#fef3c7',
          color: value === 'active' ? '#166534' : '#92400e'
        }}>
          {value}
        </span>
      )
    }
  ];

  const reportColumns: TableColumn<MockFinancialReport>[] = [
    {
      key: 'title',
      label: 'Report Title',
      render: (value, item) => (
        <div>
          <div style={{ fontWeight: '500' }}>{value}</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>{item.quarter}</div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (value) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <DollarSign size={14} style={{ color: '#6b7280' }} />
          {value}
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => `$${value.toLocaleString()}`
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span style={{
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '500',
          backgroundColor: 
            value === 'approved' ? '#dcfce7' : 
            value === 'submitted' ? '#fef3c7' : '#fee2e2',
          color: 
            value === 'approved' ? '#166534' : 
            value === 'submitted' ? '#92400e' : '#dc2626'
        }}>
          {value}
        </span>
      )
    }
  ];

  const documentColumns: TableColumn<MockDocument>[] = [
    {
      key: 'filename',
      label: 'Document',
      render: (value, item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={16} style={{ color: '#6b7280' }} />
          <div>
            <div style={{ fontWeight: '500' }}>{value}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              {item.type} • {(item.size / 1024).toFixed(1)} KB
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'isPublic',
      label: 'Visibility',
      render: (value) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {value ? <Eye size={14} style={{ color: '#10b981' }} /> : <EyeOff size={14} style={{ color: '#6b7280' }} />}
          {value ? 'Public' : 'Private'}
        </div>
      )
    },
    {
      key: 'tags',
      label: 'Tags',
      render: (value: string[]) => (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {value.map(tag => (
            <span key={tag} style={{
              padding: '2px 6px',
              borderRadius: '8px',
              fontSize: '11px',
              backgroundColor: '#f3f4f6',
              color: '#6b7280'
            }}>
              {tag}
            </span>
          ))}
        </div>
      )
    }
  ];

  const getResourceData = () => {
    switch (selectedResource) {
      case 'users': return { data: mockUsers, columns: userColumns, filtering: userFiltering };
      case 'financial_reports': return { data: mockReports, columns: reportColumns, filtering: reportFiltering };
      case 'documents': return { data: mockDocuments, columns: documentColumns, filtering: documentFiltering };
      default: return { data: [], columns: [], filtering: { data: [], totalCount: 0, hasMore: false, appliedScopes: [], filters: {}, loading: false } };
    }
  };

  const { data, columns, filtering } = getResourceData();

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '8px',
          margin: 0
        }}>
          🔍 Data Filtering Based on Scope Demo
        </h1>
        <p style={{ color: '#6b7280', margin: '8px 0 0 0' }}>
          Hierarchical data access control with tenant, department, team, and individual scoping
        </p>
      </div>

      {/* User Context & Controls */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginBottom: '32px'
      }}>
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#1f2937', 
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Shield size={16} />
            Current User Scope
          </h3>
          
          {userScope && (
            <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>User ID:</strong> {userScope.userId}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Tenant:</strong> {userScope.tenantId}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Department:</strong> {userScope.departmentId}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Team:</strong> {userScope.teamId}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Available Scopes:</strong>
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                  {userScope.scopes.map(scope => (
                    <span key={scope} style={{
                      padding: '2px 6px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '500',
                      backgroundColor: '#eff6ff',
                      color: '#1d4ed8'
                    }}>
                      {scope}
                    </span>
                  ))}
                </div>
              </div>
              {userScope.managedDepartments && userScope.managedDepartments.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>Managed Departments:</strong> {userScope.managedDepartments.join(', ')}
                </div>
              )}
              {userScope.managedTeams && userScope.managedTeams.length > 0 && (
                <div>
                  <strong>Managed Teams:</strong> {userScope.managedTeams.join(', ')}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#1f2937', 
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Settings size={16} />
            Demo Controls
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px',
                display: 'block'
              }}>
                Resource Type
              </label>
              <select
                value={selectedResource}
                onChange={(e) => setSelectedResource(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                <option value="users">Users</option>
                <option value="financial_reports">Financial Reports</option>
                <option value="documents">Documents</option>
              </select>
            </div>

            <div>
              <label style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px',
                display: 'block'
              }}>
                Action
              </label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                <option value="read">Read</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
              </select>
            </div>

            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={showAdvanced}
                  onChange={(e) => setShowAdvanced(e.target.checked)}
                  style={{ marginRight: '4px' }}
                />
                Show Advanced Info
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Access Summary */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          color: '#1f2937', 
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <BarChart3 size={16} />
          Data Access Summary
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <div style={{
            padding: '12px',
            border: `1px solid ${userAccess.canAccess ? '#d1fae5' : '#fecaca'}`,
            borderRadius: '6px',
            backgroundColor: userAccess.canAccess ? '#f0fdf4' : '#fef2f2'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Users size={16} style={{ color: userAccess.canAccess ? '#10b981' : '#ef4444' }} />
              <span style={{ fontWeight: '500', color: userAccess.canAccess ? '#047857' : '#dc2626' }}>
                Users {selectedAction}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              {userAccess.canAccess 
                ? `${userFiltering.totalCount} accessible items`
                : userAccess.reason
              }
            </div>
          </div>

          <div style={{
            padding: '12px',
            border: `1px solid ${reportAccess.canAccess ? '#d1fae5' : '#fecaca'}`,
            borderRadius: '6px',
            backgroundColor: reportAccess.canAccess ? '#f0fdf4' : '#fef2f2'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <DollarSign size={16} style={{ color: reportAccess.canAccess ? '#10b981' : '#ef4444' }} />
              <span style={{ fontWeight: '500', color: reportAccess.canAccess ? '#047857' : '#dc2626' }}>
                Reports {selectedAction}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              {reportAccess.canAccess 
                ? `${reportFiltering.totalCount} accessible items`
                : reportAccess.reason
              }
            </div>
          </div>

          <div style={{
            padding: '12px',
            border: `1px solid ${documentAccess.canAccess ? '#d1fae5' : '#fecaca'}`,
            borderRadius: '6px',
            backgroundColor: documentAccess.canAccess ? '#f0fdf4' : '#fef2f2'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <FileText size={16} style={{ color: documentAccess.canAccess ? '#10b981' : '#ef4444' }} />
              <span style={{ fontWeight: '500', color: documentAccess.canAccess ? '#047857' : '#dc2626' }}>
                Documents {selectedAction}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              {documentAccess.canAccess 
                ? `${documentFiltering.totalCount} accessible items`
                : documentAccess.reason
              }
            </div>
          </div>
        </div>
      </div>

      {/* Data Scope Filter */}
      <div style={{ marginBottom: '24px' }}>
        <DataScopeFilter
          resource={selectedResource}
          action={selectedAction}
          showAdvanced={showAdvanced}
          onScopeChange={setSelectedScopes}
        />
      </div>

      {/* Data Table */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          color: '#1f2937', 
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Database size={16} />
          Filtered Data: {selectedResource.charAt(0).toUpperCase() + selectedResource.slice(1)}
        </h3>

        <ScopedDataTable
          data={data}
          columns={columns}
          resource={selectedResource}
          action={selectedAction}
          searchFields={['name', 'email', 'title', 'filename']}
          showScopeInfo={true}
          showSearch={true}
          showPagination={true}
          pageSize={5}
          emptyMessage={`No ${selectedResource} available with current scope permissions`}
        />
      </div>

      {/* System Status */}
      <div style={{
        marginTop: '32px',
        backgroundColor: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: '8px',
        padding: '20px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#0369a1',
          marginBottom: '12px'
        }}>
          🎯 Data Filtering System Status
        </h3>
        <ul style={{ fontSize: '14px', color: '#0369a1', lineHeight: '1.6', paddingLeft: '20px', margin: 0 }}>
          <li>✅ DataScopeContext: Hierarchical scope management working</li>
          <li>✅ useDataFiltering: Scope-based data filtering implemented</li>
          <li>✅ ScopedDataTable: Permission-aware data table with search/pagination</li>
          <li>✅ DataScopeFilter: Interactive scope selection and filtering</li>
          <li>✅ Multi-level Scoping: Global, tenant, department, team, and individual access</li>
          <li>✅ Bulk Operations: Scope-aware bulk data validation</li>
          <li>✅ Real-time Filtering: Dynamic data filtering based on user permissions</li>
        </ul>
      </div>
    </div>
  );
};

const DataFilteringDemo: React.FC = () => {
  return (
    <DataScopeProvider>
      <DataFilteringDemoContent />
    </DataScopeProvider>
  );
};

export default DataFilteringDemo;