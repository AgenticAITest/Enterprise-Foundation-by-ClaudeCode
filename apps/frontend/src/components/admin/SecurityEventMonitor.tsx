import React, { useState, useMemo } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Eye, 
  Filter,
  Search,
  Calendar,
  MapPin,
  User,
  Clock,
  Zap,
  Ban,
  CheckCircle,
  XCircle,
  AlertCircle,
  Globe,
  Lock,
  Unlock,
  Key,
  Database,
  Server,
  Wifi,
  Download,
  Bell,
  BellOff,
  Trash2,
  Flag,
  TrendingUp,
  BarChart3,
  Layers
} from 'lucide-react';

interface SecurityEvent {
  id: string;
  timestamp: string;
  eventType: 'authentication' | 'authorization' | 'data_access' | 'system' | 'compliance' | 'threat';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  userId?: string;
  userName?: string;
  ipAddress: string;
  userAgent: string;
  resource: string;
  action: string;
  module: string;
  outcome: 'success' | 'failure' | 'blocked' | 'warning';
  riskScore: number;
  location: {
    country: string;
    city: string;
    isp?: string;
  };
  deviceInfo: {
    type: 'desktop' | 'mobile' | 'tablet' | 'api' | 'unknown';
    os?: string;
    browser?: string;
  };
  threatIndicators: {
    suspicious_ip: boolean;
    multiple_failures: boolean;
    unusual_location: boolean;
    unusual_time: boolean;
    privilege_escalation: boolean;
    automated_behavior: boolean;
  };
  responseActions: string[];
  relatedEvents?: string[];
  metadata?: Record<string, any>;
}

interface Props {
  className?: string;
}

const mockSecurityEvents: SecurityEvent[] = [
  {
    id: 'sec-001',
    timestamp: '2024-01-15T15:45:23Z',
    eventType: 'threat',
    severity: 'critical',
    title: 'Multiple Failed Login Attempts',
    description: 'User attempted login 15 times in 5 minutes with different passwords',
    userId: 'usr-emp-034',
    userName: 'Lisa Wang',
    ipAddress: '192.168.1.205',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    resource: 'authentication',
    action: 'login',
    module: 'Auth',
    outcome: 'blocked',
    riskScore: 95,
    location: {
      country: 'United States',
      city: 'New York',
      isp: 'Comcast Cable'
    },
    deviceInfo: {
      type: 'desktop',
      os: 'Windows 10',
      browser: 'Chrome'
    },
    threatIndicators: {
      suspicious_ip: false,
      multiple_failures: true,
      unusual_location: false,
      unusual_time: true,
      privilege_escalation: false,
      automated_behavior: true
    },
    responseActions: ['Account locked for 30 minutes', 'Security team notified', 'IP temporarily blocked'],
    metadata: {
      failed_attempts: 15,
      lockout_duration: 30,
      last_successful_login: '2024-01-14T09:30:00Z'
    }
  },
  {
    id: 'sec-002',
    timestamp: '2024-01-15T14:20:17Z',
    eventType: 'authorization',
    severity: 'error',
    title: 'Unauthorized Access Attempt',
    description: 'User attempted to access sensitive financial data without proper permissions',
    userId: 'usr-emp-067',
    userName: 'Robert Johnson',
    ipAddress: '10.0.1.45',
    userAgent: 'PostmanRuntime/7.29.0',
    resource: 'financial_reports',
    action: 'read',
    module: 'Finance',
    outcome: 'blocked',
    riskScore: 75,
    location: {
      country: 'United States',
      city: 'Seattle',
      isp: 'Amazon Web Services'
    },
    deviceInfo: {
      type: 'api',
      os: 'Unknown',
      browser: 'API Client'
    },
    threatIndicators: {
      suspicious_ip: false,
      multiple_failures: false,
      unusual_location: false,
      unusual_time: false,
      privilege_escalation: true,
      automated_behavior: true
    },
    responseActions: ['Access denied', 'Manager notified', 'Audit log created'],
    relatedEvents: ['sec-003'],
    metadata: {
      requested_resource: '/api/finance/reports/sensitive',
      user_role: 'HR Specialist',
      required_permission: 'finance.reports.read'
    }
  },
  {
    id: 'sec-003',
    timestamp: '2024-01-15T14:18:45Z',
    eventType: 'data_access',
    severity: 'warning',
    title: 'Unusual Data Export Volume',
    description: 'User exported 5x more data than their typical usage pattern',
    userId: 'usr-emp-067',
    userName: 'Robert Johnson',
    ipAddress: '10.0.1.45',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    resource: 'employee_data',
    action: 'export',
    module: 'HR',
    outcome: 'success',
    riskScore: 60,
    location: {
      country: 'United States',
      city: 'Seattle'
    },
    deviceInfo: {
      type: 'desktop',
      os: 'macOS',
      browser: 'Chrome'
    },
    threatIndicators: {
      suspicious_ip: false,
      multiple_failures: false,
      unusual_location: false,
      unusual_time: false,
      privilege_escalation: false,
      automated_behavior: false
    },
    responseActions: ['Export completed', 'Usage pattern flagged', 'Data steward notified'],
    relatedEvents: ['sec-002'],
    metadata: {
      export_size: '2.5MB',
      record_count: 1250,
      typical_export_size: '0.5MB',
      export_format: 'CSV'
    }
  },
  {
    id: 'sec-004',
    timestamp: '2024-01-15T13:55:32Z',
    eventType: 'system',
    severity: 'error',
    title: 'Database Connection Anomaly',
    description: 'Unusual database connection pattern detected from application server',
    ipAddress: '172.16.0.10',
    userAgent: 'Internal/ERP-System',
    resource: 'database_connection',
    action: 'connect',
    module: 'System',
    outcome: 'warning',
    riskScore: 45,
    location: {
      country: 'United States',
      city: 'Data Center'
    },
    deviceInfo: {
      type: 'api',
      os: 'Linux',
      browser: 'System Process'
    },
    threatIndicators: {
      suspicious_ip: false,
      multiple_failures: false,
      unusual_location: false,
      unusual_time: false,
      privilege_escalation: false,
      automated_behavior: true
    },
    responseActions: ['Connection monitored', 'DBA notified', 'Performance metrics collected'],
    metadata: {
      connection_count: 150,
      normal_connection_count: 45,
      database_instance: 'prod-db-01',
      connection_pool_exhausted: false
    }
  },
  {
    id: 'sec-005',
    timestamp: '2024-01-15T13:30:18Z',
    eventType: 'authentication',
    severity: 'warning',
    title: 'Login from New Location',
    description: 'User successfully logged in from a previously unseen geographic location',
    userId: 'usr-emp-091',
    userName: 'Carlos Martinez',
    ipAddress: '203.0.113.15',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15',
    resource: 'authentication',
    action: 'login',
    module: 'Auth',
    outcome: 'success',
    riskScore: 35,
    location: {
      country: 'Mexico',
      city: 'Cancun',
      isp: 'Telmex'
    },
    deviceInfo: {
      type: 'mobile',
      os: 'iOS 17.1',
      browser: 'Safari'
    },
    threatIndicators: {
      suspicious_ip: false,
      multiple_failures: false,
      unusual_location: true,
      unusual_time: false,
      privilege_escalation: false,
      automated_behavior: false
    },
    responseActions: ['Login allowed', 'Location added to profile', 'User notified via email'],
    metadata: {
      previous_locations: ['New York', 'Boston'],
      travel_notification: false,
      mfa_completed: true
    }
  },
  {
    id: 'sec-006',
    timestamp: '2024-01-15T12:15:44Z',
    eventType: 'compliance',
    severity: 'info',
    title: 'GDPR Data Access Request',
    description: 'User requested access to their personal data as per GDPR Article 15',
    userId: 'usr-emp-023',
    userName: 'Jennifer Lee',
    ipAddress: '192.168.1.120',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    resource: 'personal_data',
    action: 'access_request',
    module: 'Compliance',
    outcome: 'success',
    riskScore: 10,
    location: {
      country: 'United States',
      city: 'San Francisco'
    },
    deviceInfo: {
      type: 'desktop',
      os: 'Windows 10',
      browser: 'Firefox'
    },
    threatIndicators: {
      suspicious_ip: false,
      multiple_failures: false,
      unusual_location: false,
      unusual_time: false,
      privilege_escalation: false,
      automated_behavior: false
    },
    responseActions: ['Request logged', 'DPO notified', '30-day response timer started'],
    metadata: {
      request_type: 'GDPR Article 15',
      data_categories: ['personal_info', 'employment_records', 'system_logs'],
      response_deadline: '2024-02-14T12:15:44Z'
    }
  },
  {
    id: 'sec-007',
    timestamp: '2024-01-15T11:45:28Z',
    eventType: 'data_access',
    severity: 'critical',
    title: 'Privileged Data Access After Hours',
    description: 'Admin user accessed sensitive customer data outside normal business hours',
    userId: 'usr-admin-002',
    userName: 'David Kim',
    ipAddress: '192.168.1.150',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    resource: 'customer_pii',
    action: 'read',
    module: 'Admin',
    outcome: 'success',
    riskScore: 85,
    location: {
      country: 'United States',
      city: 'New York'
    },
    deviceInfo: {
      type: 'desktop',
      os: 'macOS',
      browser: 'Chrome'
    },
    threatIndicators: {
      suspicious_ip: false,
      multiple_failures: false,
      unusual_location: false,
      unusual_time: true,
      privilege_escalation: false,
      automated_behavior: false
    },
    responseActions: ['Access logged', 'CISO notified', 'Additional monitoring activated'],
    metadata: {
      business_hours: '9:00-17:00',
      access_time: '23:45',
      records_accessed: 47,
      justification_required: true
    }
  },
  {
    id: 'sec-008',
    timestamp: '2024-01-15T10:22:15Z',
    eventType: 'threat',
    severity: 'warning',
    title: 'Suspicious API Usage Pattern',
    description: 'API key showing unusual request patterns consistent with automated scraping',
    ipAddress: '45.32.18.95',
    userAgent: 'python-requests/2.31.0',
    resource: 'api_endpoints',
    action: 'bulk_request',
    module: 'API',
    outcome: 'warning',
    riskScore: 70,
    location: {
      country: 'Germany',
      city: 'Frankfurt',
      isp: 'Vultr Holdings'
    },
    deviceInfo: {
      type: 'api',
      os: 'Unknown',
      browser: 'Python Script'
    },
    threatIndicators: {
      suspicious_ip: true,
      multiple_failures: false,
      unusual_location: true,
      unusual_time: false,
      privilege_escalation: false,
      automated_behavior: true
    },
    responseActions: ['Rate limiting applied', 'API key flagged', 'Security analysis initiated'],
    metadata: {
      requests_per_minute: 450,
      normal_rate: 15,
      api_key: 'ak_***4f2a',
      rate_limit_applied: '100 req/hour'
    }
  }
];

const SecurityEventMonitor: React.FC<Props> = ({ className = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedOutcome, setSelectedOutcome] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [riskScoreRange, setRiskScoreRange] = useState({ min: 0, max: 100 });
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sortBy, setSortBy] = useState<'timestamp' | 'riskScore' | 'severity'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [showThreatIndicators, setShowThreatIndicators] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  const eventTypes = [...new Set(mockSecurityEvents.map(event => event.eventType))];
  const severities = [...new Set(mockSecurityEvents.map(event => event.severity))];
  const outcomes = [...new Set(mockSecurityEvents.map(event => event.outcome))];
  const modules = [...new Set(mockSecurityEvents.map(event => event.module))];

  const filteredEvents = useMemo(() => {
    let filtered = mockSecurityEvents.filter(event => {
      const matchesSearch = !searchTerm || 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.ipAddress.includes(searchTerm);

      const matchesEventType = selectedEventType === 'all' || event.eventType === selectedEventType;
      const matchesSeverity = selectedSeverity === 'all' || event.severity === selectedSeverity;
      const matchesOutcome = selectedOutcome === 'all' || event.outcome === selectedOutcome;
      const matchesModule = selectedModule === 'all' || event.module === selectedModule;
      const matchesRiskScore = event.riskScore >= riskScoreRange.min && event.riskScore <= riskScoreRange.max;
      
      const matchesDateRange = (!dateRange.start || event.timestamp >= dateRange.start) &&
                              (!dateRange.end || event.timestamp <= dateRange.end);

      return matchesSearch && matchesEventType && matchesSeverity && matchesOutcome && 
             matchesModule && matchesRiskScore && matchesDateRange;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'timestamp':
          aValue = new Date(a.timestamp);
          bValue = new Date(b.timestamp);
          break;
        case 'riskScore':
          aValue = a.riskScore;
          bValue = b.riskScore;
          break;
        case 'severity':
          const severityOrder = { info: 1, warning: 2, error: 3, critical: 4 };
          aValue = severityOrder[a.severity];
          bValue = severityOrder[b.severity];
          break;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [searchTerm, selectedEventType, selectedSeverity, selectedOutcome, selectedModule, riskScoreRange, dateRange, sortBy, sortOrder]);

  const toggleExpanded = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'authentication': return <Key size={14} />;
      case 'authorization': return <Lock size={14} />;
      case 'data_access': return <Database size={14} />;
      case 'system': return <Server size={14} />;
      case 'compliance': return <Flag size={14} />;
      case 'threat': return <AlertTriangle size={14} />;
      default: return <Shield size={14} />;
    }
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'authentication': return '#3b82f6';
      case 'authorization': return '#f59e0b';
      case 'data_access': return '#10b981';
      case 'system': return '#6b7280';
      case 'compliance': return '#8b5cf6';
      case 'threat': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'error': return '#f97316';
      case 'critical': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'success': return <CheckCircle size={12} />;
      case 'failure': return <XCircle size={12} />;
      case 'blocked': return <Ban size={12} />;
      case 'warning': return <AlertCircle size={12} />;
      default: return <Shield size={12} />;
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'success': return '#10b981';
      case 'failure': return '#ef4444';
      case 'blocked': return '#dc2626';
      case 'warning': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return '#dc2626';
    if (score >= 60) return '#f97316';
    if (score >= 40) return '#f59e0b';
    return '#10b981';
  };

  const handleExport = () => {
    const csvContent = [
      'Timestamp,Event Type,Severity,Title,User,IP Address,Resource,Action,Module,Outcome,Risk Score,Location',
      ...filteredEvents.map(event => 
        `${event.timestamp},${event.eventType},${event.severity},"${event.title}",${event.userName || 'System'},${event.ipAddress},${event.resource},${event.action},${event.module},${event.outcome},${event.riskScore},"${event.location.city}, ${event.location.country}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-events-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderThreatIndicators = (indicators: SecurityEvent['threatIndicators']) => {
    const activeIndicators = Object.entries(indicators).filter(([_, active]) => active);
    if (activeIndicators.length === 0) return null;

    return (
      <div style={{ marginTop: '12px' }}>
        <div style={{ fontSize: '12px', fontWeight: '500', color: '#dc2626', marginBottom: '6px' }}>
          Threat Indicators
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {activeIndicators.map(([indicator, _]) => (
            <span
              key={indicator}
              style={{
                padding: '2px 6px',
                fontSize: '10px',
                backgroundColor: '#fecaca',
                color: '#991b1b',
                borderRadius: '3px',
                textTransform: 'capitalize'
              }}
            >
              {indicator.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const securityMetrics = useMemo(() => {
    const critical = filteredEvents.filter(e => e.severity === 'critical').length;
    const highRisk = filteredEvents.filter(e => e.riskScore >= 70).length;
    const blocked = filteredEvents.filter(e => e.outcome === 'blocked').length;
    const threats = filteredEvents.filter(e => e.eventType === 'threat').length;
    
    return { critical, highRisk, blocked, threats };
  }, [filteredEvents]);

  return (
    <div className={className}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={20} style={{ color: '#dc2626' }} />
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
              Security Event Monitor
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setAlertsEnabled(!alertsEnabled)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                backgroundColor: alertsEnabled ? '#dcfce7' : '#f3f4f6',
                border: `1px solid ${alertsEnabled ? '#16a34a' : '#d1d5db'}`,
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                color: alertsEnabled ? '#166534' : '#6b7280'
              }}
            >
              {alertsEnabled ? <Bell size={14} /> : <BellOff size={14} />}
              Alerts {alertsEnabled ? 'On' : 'Off'}
            </button>
            <button
              onClick={handleExport}
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
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>
        <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
          Real-time monitoring and analysis of security events, threats, and anomalies
        </p>
      </div>

      {/* Security Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          padding: '16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626', marginBottom: '4px' }}>
            {securityMetrics.critical}
          </div>
          <div style={{ fontSize: '12px', color: '#7f1d1d' }}>Critical Events</div>
        </div>
        
        <div style={{
          padding: '16px',
          backgroundColor: '#fff7ed',
          border: '1px solid #fed7aa',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#f97316', marginBottom: '4px' }}>
            {securityMetrics.highRisk}
          </div>
          <div style={{ fontSize: '12px', color: '#9a3412' }}>High Risk Events</div>
        </div>
        
        <div style={{
          padding: '16px',
          backgroundColor: '#fef3c7',
          border: '1px solid #fcd34d',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b', marginBottom: '4px' }}>
            {securityMetrics.blocked}
          </div>
          <div style={{ fontSize: '12px', color: '#92400e' }}>Blocked Actions</div>
        </div>
        
        <div style={{
          padding: '16px',
          backgroundColor: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981', marginBottom: '4px' }}>
            {Math.round((securityMetrics.blocked / filteredEvents.length) * 100) || 0}%
          </div>
          <div style={{ fontSize: '12px', color: '#047857' }}>Block Rate</div>
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
            placeholder="Search events, users, IPs..."
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

        {/* Event Type */}
        <select
          value={selectedEventType}
          onChange={(e) => setSelectedEventType(e.target.value)}
          style={{
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '12px',
            backgroundColor: 'white'
          }}
        >
          <option value="all">All Event Types</option>
          {eventTypes.map(type => (
            <option key={type} value={type}>{type.replace(/_/g, ' ').toUpperCase()}</option>
          ))}
        </select>

        {/* Severity */}
        <select
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
          style={{
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '12px',
            backgroundColor: 'white'
          }}
        >
          <option value="all">All Severities</option>
          {severities.map(severity => (
            <option key={severity} value={severity}>{severity.toUpperCase()}</option>
          ))}
        </select>

        {/* Outcome */}
        <select
          value={selectedOutcome}
          onChange={(e) => setSelectedOutcome(e.target.value)}
          style={{
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '12px',
            backgroundColor: 'white'
          }}
        >
          <option value="all">All Outcomes</option>
          {outcomes.map(outcome => (
            <option key={outcome} value={outcome}>{outcome.toUpperCase()}</option>
          ))}
        </select>

        {/* Risk Score Range */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <input
            type="number"
            placeholder="Min Risk"
            value={riskScoreRange.min}
            onChange={(e) => setRiskScoreRange(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
            style={{
              width: '80px',
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '12px'
            }}
          />
          <span style={{ fontSize: '12px', color: '#6b7280' }}>-</span>
          <input
            type="number"
            placeholder="Max Risk"
            value={riskScoreRange.max}
            onChange={(e) => setRiskScoreRange(prev => ({ ...prev, max: parseInt(e.target.value) || 100 }))}
            style={{
              width: '80px',
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '12px'
            }}
          />
        </div>

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
            <option value="timestamp">Sort by Time</option>
            <option value="riskScore">Sort by Risk</option>
            <option value="severity">Sort by Severity</option>
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
          Showing {filteredEvents.length} of {mockSecurityEvents.length} security events
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowThreatIndicators(!showThreatIndicators)}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              backgroundColor: showThreatIndicators ? '#fecaca' : '#f3f4f6',
              border: `1px solid ${showThreatIndicators ? '#f87171' : '#d1d5db'}`,
              borderRadius: '4px',
              cursor: 'pointer',
              color: showThreatIndicators ? '#991b1b' : '#6b7280'
            }}
          >
            Show Threat Indicators
          </button>
        </div>
      </div>

      {/* Events List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredEvents.map((event) => (
          <div
            key={event.id}
            style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* Event Header */}
            <div
              style={{
                padding: '16px',
                cursor: 'pointer',
                borderLeft: `4px solid ${getSeverityColor(event.severity)}`
              }}
              onClick={() => toggleExpanded(event.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ color: getEventTypeColor(event.eventType) }}>
                    {getEventTypeIcon(event.eventType)}
                  </div>
                  
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                        {event.title}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{
                          padding: '2px 6px',
                          fontSize: '10px',
                          fontWeight: '500',
                          color: 'white',
                          backgroundColor: getEventTypeColor(event.eventType),
                          borderRadius: '3px',
                          textTransform: 'uppercase'
                        }}>
                          {event.eventType.replace(/_/g, ' ')}
                        </span>
                        <span style={{ color: getOutcomeColor(event.outcome) }}>
                          {getOutcomeIcon(event.outcome)}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {event.userName ? `${event.userName} • ` : ''}
                      {event.ipAddress} • {event.location.city}, {event.location.country} • 
                      {' '}{new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: 'white',
                    backgroundColor: getRiskScoreColor(event.riskScore),
                    borderRadius: '4px'
                  }}>
                    Risk: {event.riskScore}
                  </div>
                  <div style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: '500',
                    color: 'white',
                    backgroundColor: getSeverityColor(event.severity),
                    borderRadius: '4px',
                    textTransform: 'uppercase'
                  }}>
                    {event.severity}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                {event.description}
              </div>

              {showThreatIndicators && renderThreatIndicators(event.threatIndicators)}
            </div>

            {/* Expanded Details */}
            {expandedEvents.has(event.id) && (
              <div style={{
                padding: '16px',
                borderTop: '1px solid #f3f4f6',
                backgroundColor: '#fafbfc'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                  {/* Event Details */}
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', marginBottom: '8px', margin: '0 0 8px 0' }}>
                      Event Details
                    </h4>
                    <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.4' }}>
                      <div><strong>Resource:</strong> {event.resource}</div>
                      <div><strong>Action:</strong> {event.action}</div>
                      <div><strong>Module:</strong> {event.module}</div>
                      <div><strong>User Agent:</strong> {event.userAgent}</div>
                      <div><strong>Device:</strong> {event.deviceInfo.type} ({event.deviceInfo.os} {event.deviceInfo.browser})</div>
                    </div>
                  </div>

                  {/* Location & ISP */}
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', marginBottom: '8px', margin: '0 0 8px 0' }}>
                      Location Information
                    </h4>
                    <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.4' }}>
                      <div><strong>Country:</strong> {event.location.country}</div>
                      <div><strong>City:</strong> {event.location.city}</div>
                      {event.location.isp && <div><strong>ISP:</strong> {event.location.isp}</div>}
                      <div><strong>IP Address:</strong> {event.ipAddress}</div>
                    </div>
                  </div>

                  {/* Response Actions */}
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', marginBottom: '8px', margin: '0 0 8px 0' }}>
                      Response Actions
                    </h4>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {event.responseActions.map((action, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                          <CheckCircle size={10} style={{ color: '#10b981' }} />
                          {action}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                {event.metadata && (
                  <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', marginBottom: '8px', margin: '0 0 8px 0' }}>
                      Additional Metadata
                    </h4>
                    <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#6b7280' }}>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(event.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          color: '#6b7280'
        }}>
          <Shield size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>No security events found</h3>
          <p style={{ fontSize: '14px' }}>
            Try adjusting your filters or search terms to find security events.
          </p>
        </div>
      )}
    </div>
  );
};

export default SecurityEventMonitor;