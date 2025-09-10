import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Download,
  Calendar,
  Filter,
  Search,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  User,
  Shield,
  Database,
  Activity,
  BarChart3,
  Settings,
  Eye,
  Play,
  Pause,
  RefreshCw,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Save,
  FileX,
  AlertCircle,
  Info,
  Globe
} from 'lucide-react';

interface ComplianceReport {
  id: string;
  name: string;
  type: 'gdpr' | 'sox' | 'hipaa' | 'pci' | 'iso27001' | 'custom';
  description: string;
  frequency: 'manual' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  status: 'active' | 'inactive' | 'running' | 'failed' | 'completed';
  lastRun: string;
  nextRun?: string;
  createdBy: string;
  createdAt: string;
  parameters: {
    dateRange: {
      start: string;
      end: string;
    };
    departments?: string[];
    modules?: string[];
    riskLevels?: string[];
    includePersonalData?: boolean;
    includeSystemLogs?: boolean;
    includeUserActivity?: boolean;
    includeRoleChanges?: boolean;
  };
  outputFormat: 'pdf' | 'csv' | 'xlsx' | 'json';
  results?: {
    totalRecords: number;
    complianceScore: number;
    violations: number;
    warnings: number;
    passed: number;
    findings: Array<{
      category: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      count: number;
      description: string;
    }>;
  };
  metadata?: {
    executionTime?: number;
    dataSize?: string;
    reportSize?: string;
  };
}

interface Props {
  className?: string;
}

const mockComplianceReports: ComplianceReport[] = [
  {
    id: 'rpt-001',
    name: 'GDPR Data Protection Audit',
    type: 'gdpr',
    description: 'Comprehensive GDPR compliance report including data processing activities, consent tracking, and privacy controls',
    frequency: 'quarterly',
    status: 'completed',
    lastRun: '2024-01-15T09:00:00Z',
    nextRun: '2024-04-15T09:00:00Z',
    createdBy: 'Sarah Chen',
    createdAt: '2024-01-01T08:00:00Z',
    parameters: {
      dateRange: {
        start: '2023-10-01T00:00:00Z',
        end: '2024-01-01T00:00:00Z'
      },
      departments: ['HR', 'Finance', 'Sales'],
      modules: ['Users', 'Documents', 'Reports'],
      includePersonalData: true,
      includeSystemLogs: true,
      includeUserActivity: true,
      includeRoleChanges: true
    },
    outputFormat: 'pdf',
    results: {
      totalRecords: 15420,
      complianceScore: 92,
      violations: 2,
      warnings: 8,
      passed: 145,
      findings: [
        {
          category: 'Data Retention',
          severity: 'medium',
          count: 5,
          description: 'Data retained beyond policy limits'
        },
        {
          category: 'Consent Management',
          severity: 'low',
          count: 3,
          description: 'Missing consent records for data processing'
        },
        {
          category: 'Access Controls',
          severity: 'high',
          count: 2,
          description: 'Excessive permissions granted for personal data access'
        }
      ]
    },
    metadata: {
      executionTime: 45,
      dataSize: '2.3 GB',
      reportSize: '15.2 MB'
    }
  },
  {
    id: 'rpt-002',
    name: 'SOX Financial Controls Review',
    type: 'sox',
    description: 'Sarbanes-Oxley compliance report focusing on financial data access controls and segregation of duties',
    frequency: 'monthly',
    status: 'active',
    lastRun: '2024-01-01T10:00:00Z',
    nextRun: '2024-02-01T10:00:00Z',
    createdBy: 'David Kim',
    createdAt: '2023-12-15T14:30:00Z',
    parameters: {
      dateRange: {
        start: '2023-12-01T00:00:00Z',
        end: '2024-01-01T00:00:00Z'
      },
      departments: ['Finance', 'Accounting'],
      modules: ['Finance', 'Reports', 'Admin'],
      riskLevels: ['high', 'critical'],
      includeUserActivity: true,
      includeRoleChanges: true
    },
    outputFormat: 'xlsx',
    results: {
      totalRecords: 8920,
      complianceScore: 88,
      violations: 5,
      warnings: 12,
      passed: 98,
      findings: [
        {
          category: 'Segregation of Duties',
          severity: 'high',
          count: 3,
          description: 'Users with conflicting roles in financial processes'
        },
        {
          category: 'Privileged Access',
          severity: 'medium',
          count: 7,
          description: 'Admin access to financial systems without approval'
        },
        {
          category: 'Change Management',
          severity: 'medium',
          count: 7,
          description: 'Financial system changes without proper documentation'
        }
      ]
    },
    metadata: {
      executionTime: 28,
      dataSize: '1.1 GB',
      reportSize: '8.7 MB'
    }
  },
  {
    id: 'rpt-003',
    name: 'Security Incident Response',
    type: 'custom',
    description: 'Custom report tracking security incidents, response times, and remediation status',
    frequency: 'weekly',
    status: 'running',
    lastRun: '2024-01-08T06:00:00Z',
    nextRun: '2024-01-15T06:00:00Z',
    createdBy: 'Emma Thompson',
    createdAt: '2024-01-05T11:20:00Z',
    parameters: {
      dateRange: {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-08T00:00:00Z'
      },
      modules: ['Security', 'Admin', 'System'],
      riskLevels: ['medium', 'high', 'critical'],
      includeSystemLogs: true,
      includeUserActivity: false,
      includeRoleChanges: false
    },
    outputFormat: 'csv',
    results: {
      totalRecords: 234,
      complianceScore: 75,
      violations: 12,
      warnings: 18,
      passed: 45,
      findings: [
        {
          category: 'Incident Response Time',
          severity: 'medium',
          count: 8,
          description: 'Security incidents exceeding response time SLA'
        },
        {
          category: 'Threat Detection',
          severity: 'high',
          count: 4,
          description: 'Undetected threats identified in retrospective analysis'
        }
      ]
    },
    metadata: {
      executionTime: 12,
      dataSize: '145 MB',
      reportSize: '2.1 MB'
    }
  },
  {
    id: 'rpt-004',
    name: 'PCI DSS Payment Card Compliance',
    type: 'pci',
    description: 'Payment Card Industry Data Security Standard compliance assessment',
    frequency: 'annual',
    status: 'failed',
    lastRun: '2024-01-10T12:00:00Z',
    nextRun: '2025-01-10T12:00:00Z',
    createdBy: 'Michael Brown',
    createdAt: '2023-01-10T09:15:00Z',
    parameters: {
      dateRange: {
        start: '2023-01-10T00:00:00Z',
        end: '2024-01-10T00:00:00Z'
      },
      departments: ['Finance', 'Sales', 'IT'],
      modules: ['Payment', 'Finance', 'Security'],
      includeSystemLogs: true,
      includeUserActivity: true
    },
    outputFormat: 'pdf',
    results: {
      totalRecords: 5680,
      complianceScore: 65,
      violations: 18,
      warnings: 25,
      passed: 42,
      findings: [
        {
          category: 'Network Security',
          severity: 'critical',
          count: 3,
          description: 'Inadequate network segmentation for payment processing'
        },
        {
          category: 'Access Controls',
          severity: 'high',
          count: 8,
          description: 'Weak access controls for payment card data'
        },
        {
          category: 'Data Encryption',
          severity: 'high',
          count: 7,
          description: 'Unencrypted payment card data in storage'
        }
      ]
    },
    metadata: {
      executionTime: 67,
      dataSize: '890 MB',
      reportSize: '12.4 MB'
    }
  },
  {
    id: 'rpt-005',
    name: 'User Activity Compliance',
    type: 'custom',
    description: 'Daily user activity monitoring for compliance with corporate policies',
    frequency: 'daily',
    status: 'active',
    lastRun: '2024-01-15T00:00:00Z',
    nextRun: '2024-01-16T00:00:00Z',
    createdBy: 'Lisa Martinez',
    createdAt: '2024-01-01T16:45:00Z',
    parameters: {
      dateRange: {
        start: '2024-01-14T00:00:00Z',
        end: '2024-01-15T00:00:00Z'
      },
      includeUserActivity: true,
      includeRoleChanges: true,
      includeSystemLogs: false
    },
    outputFormat: 'json',
    results: {
      totalRecords: 1245,
      complianceScore: 96,
      violations: 1,
      warnings: 3,
      passed: 89,
      findings: [
        {
          category: 'Policy Violations',
          severity: 'low',
          count: 4,
          description: 'Minor policy violations in data access patterns'
        }
      ]
    },
    metadata: {
      executionTime: 8,
      dataSize: '45 MB',
      reportSize: '892 KB'
    }
  }
];

const ComplianceReportGenerator: React.FC<Props> = ({ className = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedFrequency, setSelectedFrequency] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'lastRun' | 'complianceScore' | 'violations'>('lastRun');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ComplianceReport | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const reportTypes = [...new Set(mockComplianceReports.map(report => report.type))];
  const statuses = [...new Set(mockComplianceReports.map(report => report.status))];
  const frequencies = [...new Set(mockComplianceReports.map(report => report.frequency))];

  const filteredReports = useMemo(() => {
    let filtered = mockComplianceReports.filter(report => {
      const matchesSearch = !searchTerm || 
        report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.createdBy.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = selectedType === 'all' || report.type === selectedType;
      const matchesStatus = selectedStatus === 'all' || report.status === selectedStatus;
      const matchesFrequency = selectedFrequency === 'all' || report.frequency === selectedFrequency;

      return matchesSearch && matchesType && matchesStatus && matchesFrequency;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'lastRun':
          aValue = new Date(a.lastRun);
          bValue = new Date(b.lastRun);
          break;
        case 'complianceScore':
          aValue = a.results?.complianceScore || 0;
          bValue = b.results?.complianceScore || 0;
          break;
        case 'violations':
          aValue = a.results?.violations || 0;
          bValue = b.results?.violations || 0;
          break;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [searchTerm, selectedType, selectedStatus, selectedFrequency, sortBy, sortOrder]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle size={14} style={{ color: '#10b981' }} />;
      case 'inactive': return <XCircle size={14} style={{ color: '#6b7280' }} />;
      case 'running': return <RefreshCw size={14} style={{ color: '#3b82f6' }} className="animate-spin" />;
      case 'failed': return <XCircle size={14} style={{ color: '#ef4444' }} />;
      case 'completed': return <CheckCircle size={14} style={{ color: '#059669' }} />;
      default: return <Clock size={14} style={{ color: '#6b7280' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'inactive': return '#6b7280';
      case 'running': return '#3b82f6';
      case 'failed': return '#ef4444';
      case 'completed': return '#059669';
      default: return '#6b7280';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'gdpr': return <Shield size={14} />;
      case 'sox': return <BarChart3 size={14} />;
      case 'hipaa': return <User size={14} />;
      case 'pci': return <Database size={14} />;
      case 'iso27001': return <Settings size={14} />;
      case 'custom': return <FileText size={14} />;
      default: return <FileText size={14} />;
    }
  };

  const getComplianceScoreColor = (score: number) => {
    if (score >= 90) return '#10b981';
    if (score >= 75) return '#f59e0b';
    if (score >= 60) return '#f97316';
    return '#ef4444';
  };

  const complianceMetrics = useMemo(() => {
    const total = filteredReports.length;
    const active = filteredReports.filter(r => r.status === 'active').length;
    const failed = filteredReports.filter(r => r.status === 'failed').length;
    const avgScore = filteredReports.reduce((sum, r) => sum + (r.results?.complianceScore || 0), 0) / total;
    const totalViolations = filteredReports.reduce((sum, r) => sum + (r.results?.violations || 0), 0);
    
    return { total, active, failed, avgScore: Math.round(avgScore), totalViolations };
  }, [filteredReports]);

  const handleExport = (report: ComplianceReport) => {
    const csvContent = [
      'Report Name,Type,Status,Compliance Score,Violations,Warnings,Last Run',
      `${report.name},${report.type.toUpperCase()},${report.status.toUpperCase()},${report.results?.complianceScore || 'N/A'},${report.results?.violations || 'N/A'},${report.results?.warnings || 'N/A'},${report.lastRun}`
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-report-${report.id}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderReportDetails = (report: ComplianceReport) => (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ color: '#3b82f6' }}>
              {getTypeIcon(report.type)}
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                {report.name}
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                {report.type.toUpperCase()} • Created by {report.createdBy}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowDetails(false)}
            style={{
              padding: '8px',
              border: 'none',
              backgroundColor: '#f3f4f6',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '24px' }}>
            <p style={{ color: '#6b7280', margin: 0, lineHeight: '1.5' }}>
              {report.description}
            </p>
          </div>

          {/* Compliance Score */}
          {report.results && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: getComplianceScoreColor(report.results.complianceScore) }}>
                  {report.results.complianceScore}%
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Compliance Score</div>
              </div>
              
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>
                  {report.results.violations}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Violations</div>
              </div>
              
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
                  {report.results.warnings}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Warnings</div>
              </div>
              
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                  {report.results.passed}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Passed Checks</div>
              </div>
              
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
                  {report.results.totalRecords.toLocaleString()}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Records Analyzed</div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Report Configuration */}
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937', marginBottom: '12px' }}>
                Configuration
              </h4>
              <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.6' }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Frequency:</strong> {report.frequency}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Output Format:</strong> {report.outputFormat.toUpperCase()}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Date Range:</strong> {new Date(report.parameters.dateRange.start).toLocaleDateString()} - {new Date(report.parameters.dateRange.end).toLocaleDateString()}
                </div>
                {report.parameters.departments && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Departments:</strong> {report.parameters.departments.join(', ')}
                  </div>
                )}
                {report.parameters.modules && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Modules:</strong> {report.parameters.modules.join(', ')}
                  </div>
                )}
              </div>
            </div>

            {/* Execution Details */}
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937', marginBottom: '12px' }}>
                Execution Details
              </h4>
              <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.6' }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Last Run:</strong> {new Date(report.lastRun).toLocaleString()}
                </div>
                {report.nextRun && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Next Run:</strong> {new Date(report.nextRun).toLocaleString()}
                  </div>
                )}
                {report.metadata && (
                  <>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Execution Time:</strong> {report.metadata.executionTime} minutes
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Data Processed:</strong> {report.metadata.dataSize}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Report Size:</strong> {report.metadata.reportSize}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Findings */}
          {report.results && report.results.findings.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937', marginBottom: '12px' }}>
                Key Findings
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {report.results.findings.map((finding, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    padding: '12px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '6px',
                    border: `1px solid ${
                      finding.severity === 'critical' ? '#fecaca' : 
                      finding.severity === 'high' ? '#fed7aa' :
                      finding.severity === 'medium' ? '#fef3c7' : '#dcfce7'
                    }`
                  }}>
                    <div style={{ 
                      color: finding.severity === 'critical' ? '#dc2626' : 
                            finding.severity === 'high' ? '#f97316' :
                            finding.severity === 'medium' ? '#f59e0b' : '#10b981' 
                    }}>
                      <AlertTriangle size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', marginBottom: '4px' }}>
                        {finding.category} ({finding.count} issues)
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {finding.description}
                      </div>
                      <div style={{ 
                        fontSize: '10px', 
                        color: finding.severity === 'critical' ? '#dc2626' : 
                              finding.severity === 'high' ? '#f97316' :
                              finding.severity === 'medium' ? '#f59e0b' : '#10b981',
                        textTransform: 'uppercase',
                        fontWeight: '600',
                        marginTop: '4px'
                      }}>
                        {finding.severity} Severity
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              onClick={() => handleExport(report)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <Download size={14} />
              Download Report
            </button>
            
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 16px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <Play size={14} />
              Run Now
            </button>
            
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 16px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <Copy size={14} />
              Duplicate
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={className}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} style={{ color: '#8b5cf6' }} />
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
              Compliance Report Generator
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 16px',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <Plus size={14} />
              New Report
            </button>
          </div>
        </div>
        <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
          Generate and schedule compliance reports for regulatory requirements and audit trails
        </p>
      </div>

      {/* Compliance Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          padding: '16px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#0284c7', marginBottom: '4px' }}>
            {complianceMetrics.total}
          </div>
          <div style={{ fontSize: '12px', color: '#075985' }}>Total Reports</div>
        </div>
        
        <div style={{
          padding: '16px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#16a34a', marginBottom: '4px' }}>
            {complianceMetrics.active}
          </div>
          <div style={{ fontSize: '12px', color: '#166534' }}>Active Reports</div>
        </div>
        
        <div style={{
          padding: '16px',
          backgroundColor: '#fef3c7',
          border: '1px solid #fcd34d',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: getComplianceScoreColor(complianceMetrics.avgScore), marginBottom: '4px' }}>
            {complianceMetrics.avgScore}%
          </div>
          <div style={{ fontSize: '12px', color: '#92400e' }}>Avg Score</div>
        </div>
        
        <div style={{
          padding: '16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626', marginBottom: '4px' }}>
            {complianceMetrics.totalViolations}
          </div>
          <div style={{ fontSize: '12px', color: '#7f1d1d' }}>Total Violations</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        marginBottom: '20px',
        padding: '16px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px'
      }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 8px 8px 32px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '12px'
            }}
          />
        </div>

        {/* Type Filter */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          style={{
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '12px',
            backgroundColor: 'white'
          }}
        >
          <option value="all">All Types</option>
          {reportTypes.map(type => (
            <option key={type} value={type}>{type.toUpperCase()}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          style={{
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '12px',
            backgroundColor: 'white'
          }}
        >
          <option value="all">All Statuses</option>
          {statuses.map(status => (
            <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
          ))}
        </select>

        {/* Frequency Filter */}
        <select
          value={selectedFrequency}
          onChange={(e) => setSelectedFrequency(e.target.value)}
          style={{
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '12px',
            backgroundColor: 'white'
          }}
        >
          <option value="all">All Frequencies</option>
          {frequencies.map(freq => (
            <option key={freq} value={freq}>{freq.charAt(0).toUpperCase() + freq.slice(1)}</option>
          ))}
        </select>

        {/* Sort Options */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              flex: 1,
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '12px',
              backgroundColor: 'white'
            }}
          >
            <option value="lastRun">Sort by Last Run</option>
            <option value="name">Sort by Name</option>
            <option value="complianceScore">Sort by Score</option>
            <option value="violations">Sort by Violations</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            style={{
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            {sortOrder === 'desc' ? '↓' : '↑'}
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div style={{
        display: 'flex',
        justifyContent: 'between',
        alignItems: 'center',
        marginBottom: '16px',
        padding: '8px 0',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          Showing {filteredReports.length} of {mockComplianceReports.length} compliance reports
        </div>
      </div>

      {/* Reports List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredReports.map((report) => (
          <div
            key={report.id}
            style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              borderLeft: `4px solid ${getStatusColor(report.status)}`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ color: '#3b82f6' }}>
                  {getTypeIcon(report.type)}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937', margin: 0 }}>
                      {report.name}
                    </h3>
                    <div style={{
                      padding: '2px 6px',
                      fontSize: '10px',
                      fontWeight: '500',
                      color: 'white',
                      backgroundColor: getStatusColor(report.status),
                      borderRadius: '3px',
                      textTransform: 'uppercase'
                    }}>
                      {report.status}
                    </div>
                    <div style={{
                      padding: '2px 6px',
                      fontSize: '10px',
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      borderRadius: '3px',
                      textTransform: 'uppercase'
                    }}>
                      {report.type}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {report.description}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {report.results && (
                  <div style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: 'white',
                    backgroundColor: getComplianceScoreColor(report.results.complianceScore),
                    borderRadius: '4px'
                  }}>
                    {report.results.complianceScore}% Score
                  </div>
                )}
                {report.results && report.results.violations > 0 && (
                  <div style={{
                    padding: '2px 6px',
                    fontSize: '10px',
                    color: '#dc2626',
                    backgroundColor: '#fecaca',
                    borderRadius: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    <AlertTriangle size={8} />
                    {report.results.violations} violations
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '12px' }}>
              <div style={{ fontSize: '12px' }}>
                <div style={{ color: '#6b7280' }}>Frequency</div>
                <div style={{ fontWeight: '500', color: '#1f2937', textTransform: 'capitalize' }}>{report.frequency}</div>
              </div>
              
              <div style={{ fontSize: '12px' }}>
                <div style={{ color: '#6b7280' }}>Last Run</div>
                <div style={{ fontWeight: '500', color: '#1f2937' }}>{new Date(report.lastRun).toLocaleDateString()}</div>
              </div>
              
              {report.nextRun && (
                <div style={{ fontSize: '12px' }}>
                  <div style={{ color: '#6b7280' }}>Next Run</div>
                  <div style={{ fontWeight: '500', color: '#1f2937' }}>{new Date(report.nextRun).toLocaleDateString()}</div>
                </div>
              )}
              
              <div style={{ fontSize: '12px' }}>
                <div style={{ color: '#6b7280' }}>Created By</div>
                <div style={{ fontWeight: '500', color: '#1f2937' }}>{report.createdBy}</div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '8px',
              paddingTop: '12px',
              borderTop: '1px solid #f3f4f6'
            }}>
              <button
                onClick={() => {
                  setSelectedReport(report);
                  setShowDetails(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                <Eye size={12} />
                View Details
              </button>
              
              <button
                onClick={() => handleExport(report)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                <Download size={12} />
                Export
              </button>
              
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  backgroundColor: '#dcfce7',
                  border: '1px solid #16a34a',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  color: '#166534'
                }}
              >
                <Play size={12} />
                Run Now
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          color: '#6b7280'
        }}>
          <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>No compliance reports found</h3>
          <p style={{ fontSize: '14px' }}>
            Try adjusting your filters or create a new compliance report.
          </p>
        </div>
      )}

      {/* Report Details Modal */}
      {showDetails && selectedReport && renderReportDetails(selectedReport)}
    </div>
  );
};

export default ComplianceReportGenerator;