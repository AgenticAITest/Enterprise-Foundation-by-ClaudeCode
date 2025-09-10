import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  User, 
  Clock, 
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Users,
  MapPin,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Mouse,
  FileText,
  Download,
  Upload,
  Search,
  Filter,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  RefreshCw
} from 'lucide-react';

interface UserActivity {
  userId: string;
  userName: string;
  email: string;
  department: string;
  role: string;
  lastActive: string;
  sessionDuration: number; // minutes
  actionsToday: number;
  actionsThisWeek: number;
  loginCount: number;
  uniqueIPs: number;
  riskScore: number;
  deviceTypes: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  topModules: Array<{
    module: string;
    usage: number;
    percentage: number;
  }>;
  locations: Array<{
    city: string;
    country: string;
    count: number;
  }>;
  recentActions: Array<{
    timestamp: string;
    action: string;
    resource: string;
    module: string;
    outcome: 'success' | 'failure' | 'warning';
  }>;
  productivity: {
    documentsCreated: number;
    documentsEdited: number;
    reportsGenerated: number;
    dataExported: number;
  };
  anomalies: Array<{
    type: 'time' | 'location' | 'volume' | 'access';
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

interface Props {
  className?: string;
}

const mockUserActivities: UserActivity[] = [
  {
    userId: 'usr-emp-052',
    userName: 'Mike Rodriguez',
    email: 'mike.rodriguez@company.com',
    department: 'Finance',
    role: 'Finance Manager',
    lastActive: '2024-01-15T16:30:45Z',
    sessionDuration: 485,
    actionsToday: 127,
    actionsThisWeek: 892,
    loginCount: 8,
    uniqueIPs: 2,
    riskScore: 25,
    deviceTypes: {
      desktop: 85,
      mobile: 12,
      tablet: 3
    },
    topModules: [
      { module: 'Finance', usage: 450, percentage: 65 },
      { module: 'Reports', usage: 180, percentage: 26 },
      { module: 'Dashboard', usage: 62, percentage: 9 }
    ],
    locations: [
      { city: 'New York', country: 'USA', count: 6 },
      { city: 'Boston', country: 'USA', count: 2 }
    ],
    recentActions: [
      {
        timestamp: '2024-01-15T16:25:00Z',
        action: 'Generate Report',
        resource: 'Q4 Budget Analysis',
        module: 'Finance',
        outcome: 'success'
      },
      {
        timestamp: '2024-01-15T16:10:00Z',
        action: 'Update Record',
        resource: 'Budget Item #4521',
        module: 'Finance',
        outcome: 'success'
      },
      {
        timestamp: '2024-01-15T15:45:00Z',
        action: 'Export Data',
        resource: 'Expense Reports',
        module: 'Finance',
        outcome: 'success'
      }
    ],
    productivity: {
      documentsCreated: 8,
      documentsEdited: 23,
      reportsGenerated: 12,
      dataExported: 6
    },
    anomalies: []
  },
  {
    userId: 'usr-emp-034',
    userName: 'Lisa Wang',
    email: 'lisa.wang@company.com',
    department: 'HR',
    role: 'HR Specialist',
    lastActive: '2024-01-15T15:15:22Z',
    sessionDuration: 320,
    actionsToday: 89,
    actionsThisWeek: 445,
    loginCount: 5,
    uniqueIPs: 1,
    riskScore: 15,
    deviceTypes: {
      desktop: 95,
      mobile: 5,
      tablet: 0
    },
    topModules: [
      { module: 'HR', usage: 380, percentage: 85 },
      { module: 'Reports', usage: 45, percentage: 10 },
      { module: 'Admin', usage: 22, percentage: 5 }
    ],
    locations: [
      { city: 'Seattle', country: 'USA', count: 5 }
    ],
    recentActions: [
      {
        timestamp: '2024-01-15T15:12:00Z',
        action: 'View Profile',
        resource: 'Employee #2891',
        module: 'HR',
        outcome: 'success'
      },
      {
        timestamp: '2024-01-15T14:55:00Z',
        action: 'Update Record',
        resource: 'Performance Review',
        module: 'HR',
        outcome: 'success'
      }
    ],
    productivity: {
      documentsCreated: 3,
      documentsEdited: 15,
      reportsGenerated: 4,
      dataExported: 2
    },
    anomalies: []
  },
  {
    userId: 'usr-emp-067',
    userName: 'Robert Johnson',
    email: 'robert.johnson@company.com',
    department: 'IT',
    role: 'System Administrator',
    lastActive: '2024-01-15T17:45:33Z',
    sessionDuration: 720,
    actionsToday: 245,
    actionsThisWeek: 1450,
    loginCount: 12,
    uniqueIPs: 4,
    riskScore: 75,
    deviceTypes: {
      desktop: 70,
      mobile: 15,
      tablet: 15
    },
    topModules: [
      { module: 'Admin', usage: 580, percentage: 40 },
      { module: 'Security', usage: 435, percentage: 30 },
      { module: 'System', usage: 290, percentage: 20 },
      { module: 'Users', usage: 145, percentage: 10 }
    ],
    locations: [
      { city: 'Seattle', country: 'USA', count: 8 },
      { city: 'Portland', country: 'USA', count: 2 },
      { city: 'San Francisco', country: 'USA', count: 2 }
    ],
    recentActions: [
      {
        timestamp: '2024-01-15T17:40:00Z',
        action: 'Export Data',
        resource: 'User Database',
        module: 'Admin',
        outcome: 'warning'
      },
      {
        timestamp: '2024-01-15T17:20:00Z',
        action: 'Access Sensitive Data',
        resource: 'Security Logs',
        module: 'Security',
        outcome: 'success'
      }
    ],
    productivity: {
      documentsCreated: 12,
      documentsEdited: 45,
      reportsGenerated: 18,
      dataExported: 24
    },
    anomalies: [
      {
        type: 'volume',
        description: 'Data export volume 500% above normal',
        severity: 'high'
      },
      {
        type: 'time',
        description: 'Active during unusual hours (2:00 AM - 4:00 AM)',
        severity: 'medium'
      },
      {
        type: 'access',
        description: 'Attempted access to restricted financial data',
        severity: 'high'
      }
    ]
  },
  {
    userId: 'usr-emp-091',
    userName: 'Carlos Martinez',
    email: 'carlos.martinez@company.com',
    department: 'Sales',
    role: 'Sales Representative',
    lastActive: '2024-01-15T14:30:15Z',
    sessionDuration: 180,
    actionsToday: 45,
    actionsThisWeek: 234,
    loginCount: 3,
    uniqueIPs: 2,
    riskScore: 30,
    deviceTypes: {
      desktop: 45,
      mobile: 55,
      tablet: 0
    },
    topModules: [
      { module: 'Sales', usage: 180, percentage: 77 },
      { module: 'CRM', usage: 35, percentage: 15 },
      { module: 'Reports', usage: 19, percentage: 8 }
    ],
    locations: [
      { city: 'Mexico City', country: 'Mexico', count: 2 },
      { city: 'Cancun', country: 'Mexico', count: 1 }
    ],
    recentActions: [
      {
        timestamp: '2024-01-15T14:25:00Z',
        action: 'Update Opportunity',
        resource: 'Deal #OPP-2024-0156',
        module: 'Sales',
        outcome: 'success'
      },
      {
        timestamp: '2024-01-15T14:10:00Z',
        action: 'Create Lead',
        resource: 'Lead #L-2024-0289',
        module: 'Sales',
        outcome: 'success'
      }
    ],
    productivity: {
      documentsCreated: 5,
      documentsEdited: 8,
      reportsGenerated: 2,
      dataExported: 1
    },
    anomalies: [
      {
        type: 'location',
        description: 'Login from new country (Mexico)',
        severity: 'low'
      }
    ]
  },
  {
    userId: 'usr-emp-023',
    userName: 'Jennifer Lee',
    email: 'jennifer.lee@company.com',
    department: 'Projects',
    role: 'Project Manager',
    lastActive: '2024-01-15T16:45:28Z',
    sessionDuration: 520,
    actionsToday: 156,
    actionsThisWeek: 780,
    loginCount: 7,
    uniqueIPs: 1,
    riskScore: 20,
    deviceTypes: {
      desktop: 80,
      mobile: 15,
      tablet: 5
    },
    topModules: [
      { module: 'Projects', usage: 420, percentage: 54 },
      { module: 'Tasks', usage: 200, percentage: 26 },
      { module: 'Reports', usage: 100, percentage: 13 },
      { module: 'Calendar', usage: 56, percentage: 7 }
    ],
    locations: [
      { city: 'San Francisco', country: 'USA', count: 7 }
    ],
    recentActions: [
      {
        timestamp: '2024-01-15T16:40:00Z',
        action: 'Update Project',
        resource: 'Project Alpha Phase 2',
        module: 'Projects',
        outcome: 'success'
      },
      {
        timestamp: '2024-01-15T16:20:00Z',
        action: 'Assign Task',
        resource: 'Task #T-2024-0445',
        module: 'Tasks',
        outcome: 'success'
      }
    ],
    productivity: {
      documentsCreated: 15,
      documentsEdited: 32,
      reportsGenerated: 8,
      dataExported: 3
    },
    anomalies: []
  }
];

const UserActivityDashboard: React.FC<Props> = ({ className = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'lastActive' | 'actionsToday' | 'riskScore' | 'sessionDuration'>('lastActive');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedUser, setSelectedUser] = useState<UserActivity | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  const departments = [...new Set(mockUserActivities.map(user => user.department))];

  const filteredUsers = useMemo(() => {
    let filtered = mockUserActivities.filter(user => {
      const matchesSearch = !searchTerm || 
        user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDepartment = selectedDepartment === 'all' || user.department === selectedDepartment;
      
      const matchesRiskLevel = selectedRiskLevel === 'all' || 
        (selectedRiskLevel === 'low' && user.riskScore < 30) ||
        (selectedRiskLevel === 'medium' && user.riskScore >= 30 && user.riskScore < 60) ||
        (selectedRiskLevel === 'high' && user.riskScore >= 60);

      return matchesSearch && matchesDepartment && matchesRiskLevel;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'lastActive':
          aValue = new Date(a.lastActive);
          bValue = new Date(b.lastActive);
          break;
        case 'actionsToday':
          aValue = a.actionsToday;
          bValue = b.actionsToday;
          break;
        case 'riskScore':
          aValue = a.riskScore;
          bValue = b.riskScore;
          break;
        case 'sessionDuration':
          aValue = a.sessionDuration;
          bValue = b.sessionDuration;
          break;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [searchTerm, selectedDepartment, selectedRiskLevel, sortBy, sortOrder]);

  const getDeviceIcon = (deviceType: string, count: number) => {
    if (count === 0) return null;
    
    switch (deviceType) {
      case 'desktop': return <Monitor size={14} />;
      case 'mobile': return <Smartphone size={14} />;
      case 'tablet': return <Tablet size={14} />;
      default: return <Monitor size={14} />;
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 60) return '#dc2626';
    if (score >= 30) return '#f59e0b';
    return '#10b981';
  };

  const getAnomalySeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#dc2626';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getActivityMetrics = useMemo(() => {
    const totalUsers = filteredUsers.length;
    const activeToday = filteredUsers.filter(u => 
      new Date(u.lastActive) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;
    const highRisk = filteredUsers.filter(u => u.riskScore >= 60).length;
    const withAnomalies = filteredUsers.filter(u => u.anomalies.length > 0).length;
    const avgActions = Math.round(filteredUsers.reduce((sum, u) => sum + u.actionsToday, 0) / totalUsers);
    const avgSessionDuration = Math.round(filteredUsers.reduce((sum, u) => sum + u.sessionDuration, 0) / totalUsers);
    
    return {
      totalUsers,
      activeToday,
      highRisk,
      withAnomalies,
      avgActions,
      avgSessionDuration
    };
  }, [filteredUsers]);

  const handleExport = () => {
    const csvContent = [
      'Name,Email,Department,Role,Last Active,Actions Today,Session Duration,Risk Score,Anomalies',
      ...filteredUsers.map(user => 
        `${user.userName},${user.email},${user.department},${user.role},${user.lastActive},${user.actionsToday},${user.sessionDuration},${user.riskScore},${user.anomalies.length}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-activity-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderUserCard = (user: UserActivity) => (
    <div
      key={user.userId}
      style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        borderLeft: `4px solid ${getRiskScoreColor(user.riskScore)}`
      }}
      onClick={() => setSelectedUser(user)}
    >
      {/* User Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {user.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
              {user.userName}
            </div>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>
              {user.role} • {user.department}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{
            padding: '2px 6px',
            fontSize: '10px',
            fontWeight: '600',
            color: 'white',
            backgroundColor: getRiskScoreColor(user.riskScore),
            borderRadius: '4px'
          }}>
            Risk: {user.riskScore}
          </div>
          {user.anomalies.length > 0 && (
            <div style={{
              padding: '2px 6px',
              fontSize: '10px',
              color: '#dc2626',
              backgroundColor: '#fecaca',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '2px'
            }}>
              <AlertTriangle size={8} />
              {user.anomalies.length}
            </div>
          )}
        </div>
      </div>

      {/* Activity Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '12px',
        fontSize: '12px'
      }}>
        <div>
          <div style={{ color: '#6b7280', marginBottom: '2px' }}>Actions Today</div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
            {user.actionsToday}
          </div>
        </div>
        <div>
          <div style={{ color: '#6b7280', marginBottom: '2px' }}>Session Time</div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
            {Math.floor(user.sessionDuration / 60)}h {user.sessionDuration % 60}m
          </div>
        </div>
      </div>

      {/* Device Usage */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
          Device Usage
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {Object.entries(user.deviceTypes).map(([type, percentage]) => (
            percentage > 0 && (
              <div key={type} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                fontSize: '10px',
                color: '#6b7280'
              }}>
                {getDeviceIcon(type, percentage)}
                {percentage}%
              </div>
            )
          ))}
        </div>
      </div>

      {/* Last Active */}
      <div style={{ fontSize: '11px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Clock size={10} />
        Last active: {new Date(user.lastActive).toLocaleString()}
      </div>
    </div>
  );

  const renderUserDetails = (user: UserActivity) => (
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
        maxWidth: '800px',
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
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              {user.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                {user.userName}
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                {user.email} • {user.role} • {user.department}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedUser(null)}
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
          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#3b82f6' }}>
                {user.actionsToday}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Actions Today</div>
            </div>
            
            <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
                {Math.floor(user.sessionDuration / 60)}h {user.sessionDuration % 60}m
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Session Time</div>
            </div>
            
            <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#f59e0b' }}>
                {user.loginCount}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Logins Today</div>
            </div>
            
            <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: getRiskScoreColor(user.riskScore) }}>
                {user.riskScore}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Risk Score</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Top Modules */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', marginBottom: '12px' }}>
                Module Usage
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {user.topModules.map((module) => (
                  <div key={module.module} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', minWidth: '60px' }}>
                      {module.module}
                    </div>
                    <div style={{
                      flex: 1,
                      height: '6px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${module.percentage}%`,
                        backgroundColor: '#3b82f6',
                        borderRadius: '3px'
                      }}></div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280', minWidth: '40px' }}>
                      {module.percentage}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Productivity */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', marginBottom: '12px' }}>
                Productivity
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'between' }}>
                  <span style={{ color: '#6b7280' }}>Documents Created:</span>
                  <span style={{ fontWeight: '500' }}>{user.productivity.documentsCreated}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'between' }}>
                  <span style={{ color: '#6b7280' }}>Documents Edited:</span>
                  <span style={{ fontWeight: '500' }}>{user.productivity.documentsEdited}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'between' }}>
                  <span style={{ color: '#6b7280' }}>Reports Generated:</span>
                  <span style={{ fontWeight: '500' }}>{user.productivity.reportsGenerated}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'between' }}>
                  <span style={{ color: '#6b7280' }}>Data Exported:</span>
                  <span style={{ fontWeight: '500' }}>{user.productivity.dataExported}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Actions */}
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', marginBottom: '12px' }}>
              Recent Activity
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {user.recentActions.map((action, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  <div style={{ color: action.outcome === 'success' ? '#10b981' : action.outcome === 'warning' ? '#f59e0b' : '#ef4444' }}>
                    {action.outcome === 'success' ? <CheckCircle size={12} /> : 
                     action.outcome === 'warning' ? <AlertTriangle size={12} /> : 
                     <XCircle size={12} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#1f2937', fontWeight: '500' }}>
                      {action.action}: {action.resource}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '10px' }}>
                      {action.module} • {new Date(action.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Anomalies */}
          {user.anomalies.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#dc2626', marginBottom: '12px' }}>
                Security Anomalies
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {user.anomalies.map((anomaly, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    <div style={{ color: getAnomalySeverityColor(anomaly.severity) }}>
                      <AlertTriangle size={14} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#1f2937', fontWeight: '500' }}>
                        {anomaly.description}
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '10px', textTransform: 'capitalize' }}>
                        {anomaly.type} anomaly • {anomaly.severity} severity
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
            <Activity size={20} style={{ color: '#10b981' }} />
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
              User Activity Dashboard
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
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
              {viewMode === 'grid' ? <BarChart3 size={14} /> : <Users size={14} />}
              {viewMode === 'grid' ? 'List View' : 'Grid View'}
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
          Monitor user activity patterns, productivity metrics, and security anomalies
        </p>
      </div>

      {/* Activity Metrics */}
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
            {getActivityMetrics.totalUsers}
          </div>
          <div style={{ fontSize: '12px', color: '#075985' }}>Total Users</div>
        </div>
        
        <div style={{
          padding: '16px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#16a34a', marginBottom: '4px' }}>
            {getActivityMetrics.activeToday}
          </div>
          <div style={{ fontSize: '12px', color: '#166534' }}>Active Today</div>
        </div>
        
        <div style={{
          padding: '16px',
          backgroundColor: '#fef3c7',
          border: '1px solid #fcd34d',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#d97706', marginBottom: '4px' }}>
            {getActivityMetrics.avgActions}
          </div>
          <div style={{ fontSize: '12px', color: '#92400e' }}>Avg Actions</div>
        </div>
        
        <div style={{
          padding: '16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626', marginBottom: '4px' }}>
            {getActivityMetrics.highRisk}
          </div>
          <div style={{ fontSize: '12px', color: '#7f1d1d' }}>High Risk</div>
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
            placeholder="Search users..."
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

        {/* Department Filter */}
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          style={{
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '12px',
            backgroundColor: 'white'
          }}
        >
          <option value="all">All Departments</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>

        {/* Risk Level Filter */}
        <select
          value={selectedRiskLevel}
          onChange={(e) => setSelectedRiskLevel(e.target.value)}
          style={{
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '12px',
            backgroundColor: 'white'
          }}
        >
          <option value="all">All Risk Levels</option>
          <option value="low">Low Risk (0-29)</option>
          <option value="medium">Medium Risk (30-59)</option>
          <option value="high">High Risk (60+)</option>
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
            <option value="lastActive">Sort by Last Active</option>
            <option value="actionsToday">Sort by Activity</option>
            <option value="riskScore">Sort by Risk</option>
            <option value="sessionDuration">Sort by Session Time</option>
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
          Showing {filteredUsers.length} users
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#dc2626' }}></div>
            High Risk: {getActivityMetrics.highRisk}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></div>
            With Anomalies: {getActivityMetrics.withAnomalies}
          </div>
        </div>
      </div>

      {/* Users Grid/List */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(300px, 1fr))' : '1fr',
        gap: '16px'
      }}>
        {filteredUsers.map(renderUserCard)}
      </div>

      {filteredUsers.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          color: '#6b7280'
        }}>
          <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>No users found</h3>
          <p style={{ fontSize: '14px' }}>
            Try adjusting your filters to find users.
          </p>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && renderUserDetails(selectedUser)}
    </div>
  );
};

export default UserActivityDashboard;