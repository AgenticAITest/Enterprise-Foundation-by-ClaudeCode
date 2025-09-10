import React, { useState } from 'react';
import { PermissionProvider } from '@/contexts/PermissionContext';
import { DataScopeProvider } from '@/contexts/DataScopeContext';
import { FieldPermissionProvider, useFieldPermissions } from '@/contexts/FieldPermissionContext';
import { MaskedField, MaskedText } from '@/components/field-masking/MaskedField';
import PermissionAwareForm, { FormFieldDefinition } from '@/components/field-masking/PermissionAwareForm';
import { useFieldVisibility, useMaskedData, useFieldSecurity } from '@/hooks/useFieldMasking';
import {
  Shield,
  Eye,
  EyeOff,
  User,
  FileText,
  Settings,
  DollarSign,
  Lock,
  AlertTriangle,
  Info,
  Edit,
  Database,
  Key,
  Phone,
  Mail,
  CreditCard,
  MapPin,
  Calendar,
  Building
} from 'lucide-react';

// Mock user data with sensitive fields
const mockUserData = {
  id: 'user_123',
  name: 'John Smith',
  email: 'john.smith@company.com',
  phone: '+1-555-123-4567',
  ssn: '123-45-6789',
  salary: 85000,
  address: '123 Main St, Springfield, IL 62701',
  dateOfBirth: '1985-06-15',
  emergencyContact: 'Jane Smith - (555) 987-6543',
  bankAccount: '****-****-****-1234',
  taxId: '12-3456789',
  personalNotes: 'Employee shows great potential for leadership roles. Has been with the company for 3 years and consistently exceeds targets. Considering for promotion to senior level.',
  department: 'Finance',
  team: 'Budget Analysis',
  manager: 'Alice Johnson',
  hireDate: '2021-03-15',
  status: 'Active'
};

// Mock financial report data
const mockFinancialData = {
  id: 'report_456',
  title: 'Q4 2024 Financial Summary',
  revenue: 2500000,
  expenses: 1800000,
  profitMargin: 28,
  confidentialNotes: 'Revenue includes unannounced acquisition deal. Public disclosure planned for Q1 2025.',
  projectedGrowth: 15.5,
  riskFactors: 'Market volatility, regulatory changes, competitive pressure',
  executiveSummary: 'Strong quarter with significant growth in all major segments.',
  departmentBreakdown: {
    sales: 1200000,
    marketing: 800000,
    engineering: 500000
  }
};

// Form field definitions for user editing
const userFormFields: FormFieldDefinition[] = [
  { name: 'name', label: 'Full Name', type: 'text', category: 'personal', validation: { required: true } },
  { name: 'email', label: 'Email Address', type: 'email', category: 'contact', validation: { required: true } },
  { name: 'phone', label: 'Phone Number', type: 'tel', category: 'contact' },
  { name: 'ssn', label: 'Social Security Number', type: 'text', category: 'confidential' },
  { name: 'salary', label: 'Annual Salary', type: 'currency', category: 'financial' },
  { name: 'address', label: 'Home Address', type: 'textarea', category: 'personal' },
  { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', category: 'personal' },
  { name: 'emergencyContact', label: 'Emergency Contact', type: 'text', category: 'personal' },
  { name: 'bankAccount', label: 'Bank Account', type: 'text', category: 'financial' },
  { name: 'personalNotes', label: 'Personal Notes', type: 'textarea', category: 'confidential' },
  { name: 'department', label: 'Department', type: 'select', category: 'general', options: [
    { value: 'Finance', label: 'Finance' },
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Sales', label: 'Sales' }
  ]},
  { name: 'manager', label: 'Manager', type: 'text', category: 'general' }
];

const FieldMaskingDemoContent: React.FC = () => {
  const [selectedResource, setSelectedResource] = useState<string>('users');
  const [selectedUser, setSelectedUser] = useState(mockUserData);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showRawData, setShowRawData] = useState(false);

  const { fieldRules, maskField, getFieldAccess } = useFieldPermissions();
  
  // Field analysis for selected resource
  const userFields = Object.keys(mockUserData);
  const fieldVisibility = useFieldVisibility('users', userFields);
  const userSecurity = useFieldSecurity('users');
  const maskedUserData = useMaskedData('users', [mockUserData]);

  const financialFields = Object.keys(mockFinancialData);
  const financialSecurity = useFieldSecurity('financial_reports');

  const renderFieldExample = (resource: string, field: string, value: any, title: string) => {
    const result = maskField(resource, field, value);
    const accessLevel = getFieldAccess(resource, field);

    return (
      <div key={`${resource}-${field}`} style={{
        padding: '12px',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        backgroundColor: 'white'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px'
        }}>
          <div style={{
            fontSize: '13px',
            fontWeight: '500',
            color: '#374151'
          }}>
            {title}
          </div>
          <div style={{
            padding: '2px 6px',
            backgroundColor: 
              accessLevel === 'full' ? '#dcfce7' :
              accessLevel === 'read' ? '#dbeafe' :
              accessLevel === 'masked' || accessLevel === 'partial' ? '#fef3c7' :
              '#fee2e2',
            color:
              accessLevel === 'full' ? '#166534' :
              accessLevel === 'read' ? '#1e40af' :
              accessLevel === 'masked' || accessLevel === 'partial' ? '#92400e' :
              '#dc2626',
            borderRadius: '10px',
            fontSize: '10px',
            fontWeight: '600',
            textTransform: 'uppercase'
          }}>
            {accessLevel}
          </div>
        </div>

        <div style={{
          padding: '8px',
          backgroundColor: '#f9fafb',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#6b7280',
          marginBottom: '8px',
          fontFamily: 'monospace'
        }}>
          Original: {String(value)}
        </div>

        <MaskedField
          resource={resource}
          field={field}
          value={value}
          showAccessLevel={false}
          showTooltip={true}
          style={{ fontSize: '14px' }}
        />

        {result.reason && (
          <div style={{
            marginTop: '6px',
            fontSize: '11px',
            color: '#6b7280',
            fontStyle: 'italic'
          }}>
            {result.reason}
          </div>
        )}
      </div>
    );
  };

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
          🎭 Field Masking & Hiding Based on Permissions Demo
        </h1>
        <p style={{ color: '#6b7280', margin: '8px 0 0 0' }}>
          Dynamic field-level access control with masking, hiding, and permission-aware forms
        </p>
      </div>

      {/* Controls */}
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
          <Settings size={16} />
          Demo Controls
        </h3>
        
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                padding: '6px 10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              <option value="users">User Data</option>
              <option value="financial_reports">Financial Reports</option>
              <option value="documents">Documents</option>
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
              />
              Show Advanced Details
            </label>
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
                checked={showRawData}
                onChange={(e) => setShowRawData(e.target.checked)}
              />
              Show Raw Data Comparison
            </label>
          </div>
        </div>
      </div>

      {/* Field Security Overview */}
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
          <Shield size={16} />
          Field Security Overview
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
              User Data Security
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <div style={{ padding: '8px', backgroundColor: '#dcfce7', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#166534' }}>
                  {fieldVisibility.editable.length}
                </div>
                <div style={{ fontSize: '11px', color: '#166534' }}>Editable</div>
              </div>
              <div style={{ padding: '8px', backgroundColor: '#fef3c7', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#92400e' }}>
                  {fieldVisibility.masked.length}
                </div>
                <div style={{ fontSize: '11px', color: '#92400e' }}>Masked</div>
              </div>
              <div style={{ padding: '8px', backgroundColor: '#fee2e2', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#dc2626' }}>
                  {fieldVisibility.hidden.length}
                </div>
                <div style={{ fontSize: '11px', color: '#dc2626' }}>Hidden</div>
              </div>
            </div>
            
            {showAdvanced && (
              <div style={{ marginTop: '12px', fontSize: '12px', color: '#6b7280' }}>
                <div><strong>Sensitive Fields:</strong> {userSecurity.sensitiveFields.join(', ')}</div>
                <div><strong>Total Rules:</strong> {userSecurity.totalRules}</div>
                <div><strong>Categories:</strong> {Object.keys(userSecurity.categories).join(', ')}</div>
              </div>
            )}
          </div>

          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
              Financial Data Security
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <div style={{ padding: '8px', backgroundColor: '#dcfce7', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#166534' }}>
                  {financialSecurity.securityLevels.public}
                </div>
                <div style={{ fontSize: '11px', color: '#166534' }}>Public</div>
              </div>
              <div style={{ padding: '8px', backgroundColor: '#fef3c7', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#92400e' }}>
                  {financialSecurity.securityLevels.masked}
                </div>
                <div style={{ fontSize: '11px', color: '#92400e' }}>Masked</div>
              </div>
              <div style={{ padding: '8px', backgroundColor: '#fee2e2', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#dc2626' }}>
                  {financialSecurity.securityLevels.hidden}
                </div>
                <div style={{ fontSize: '11px', color: '#dc2626' }}>Hidden</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Field Masking Examples */}
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
          <Eye size={16} />
          Field Masking Examples
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {selectedResource === 'users' && (
            <>
              {renderFieldExample('users', 'email', mockUserData.email, 'Email Address')}
              {renderFieldExample('users', 'phone', mockUserData.phone, 'Phone Number')}
              {renderFieldExample('users', 'ssn', mockUserData.ssn, 'Social Security Number')}
              {renderFieldExample('users', 'salary', mockUserData.salary, 'Annual Salary')}
              {renderFieldExample('users', 'bankAccount', mockUserData.bankAccount, 'Bank Account')}
              {renderFieldExample('users', 'personalNotes', mockUserData.personalNotes, 'Personal Notes')}
            </>
          )}

          {selectedResource === 'financial_reports' && (
            <>
              {renderFieldExample('financial_reports', 'revenue', mockFinancialData.revenue, 'Total Revenue')}
              {renderFieldExample('financial_reports', 'profitMargin', mockFinancialData.profitMargin, 'Profit Margin %')}
              {renderFieldExample('financial_reports', 'confidentialNotes', mockFinancialData.confidentialNotes, 'Confidential Notes')}
              {renderFieldExample('financial_reports', 'projectedGrowth', mockFinancialData.projectedGrowth, 'Projected Growth')}
            </>
          )}
        </div>
      </div>

      {/* Long Text Masking Example */}
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
          <FileText size={16} />
          Long Text Content Masking
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              Personal Notes (User Resource)
            </h4>
            <MaskedText
              resource="users"
              field="personalNotes"
              value={mockUserData.personalNotes}
              maxLength={150}
              showFull={false}
            />
          </div>

          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              Confidential Notes (Financial Resource)
            </h4>
            <MaskedText
              resource="financial_reports"
              field="confidentialNotes"
              value={mockFinancialData.confidentialNotes}
              maxLength={150}
              showFull={false}
            />
          </div>
        </div>
      </div>

      {/* Permission-Aware Form */}
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
          <Edit size={16} />
          Permission-Aware Form
        </h3>

        <PermissionAwareForm
          resource="users"
          fields={userFormFields}
          initialData={selectedUser}
          showFieldSummary={true}
          showAccessLevels={showAdvanced}
          onSubmit={(data) => {
            console.log('Form submitted with data:', data);
            alert('Form submitted successfully! Check console for data.');
          }}
          onCancel={() => alert('Form cancelled')}
        />
      </div>

      {/* Raw Data Comparison */}
      {showRawData && (
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
            <Database size={16} />
            Raw Data vs Masked Data Comparison
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Original Data
              </h4>
              <pre style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '12px',
                overflow: 'auto',
                maxHeight: '400px'
              }}>
                {JSON.stringify(mockUserData, null, 2)}
              </pre>
            </div>

            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Masked Data (What User Sees)
              </h4>
              <pre style={{
                padding: '12px',
                backgroundColor: '#fef3c7',
                border: '1px solid #fed7aa',
                borderRadius: '6px',
                fontSize: '12px',
                overflow: 'auto',
                maxHeight: '400px'
              }}>
                {JSON.stringify(maskedUserData.data[0], null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

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
          🎯 Field Masking System Status
        </h3>
        <ul style={{ fontSize: '14px', color: '#0369a1', lineHeight: '1.6', paddingLeft: '20px', margin: 0 }}>
          <li>✅ FieldPermissionContext: Multi-strategy field masking implemented</li>
          <li>✅ MaskedField: Smart field rendering with access level indicators</li>
          <li>✅ PermissionAwareForm: Dynamic form with field-level permissions</li>
          <li>✅ Masking Strategies: Asterisk, dots, partial, domain, currency masking</li>
          <li>✅ Field Categories: PII, financial, confidential data classification</li>
          <li>✅ Access Levels: Full, read, masked, partial, hidden, denied</li>
          <li>✅ Security Analysis: Field-level security metrics and reporting</li>
          <li>✅ Real-time Masking: Dynamic field masking based on user permissions</li>
        </ul>
      </div>
    </div>
  );
};

const FieldMaskingDemo: React.FC = () => {
  return (
    <PermissionProvider>
      <DataScopeProvider>
        <FieldPermissionProvider>
          <FieldMaskingDemoContent />
        </FieldPermissionProvider>
      </DataScopeProvider>
    </PermissionProvider>
  );
};

export default FieldMaskingDemo;