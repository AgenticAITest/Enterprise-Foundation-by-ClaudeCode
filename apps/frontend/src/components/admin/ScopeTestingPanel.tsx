import React, { useState, useEffect } from 'react';
import { useTenantAdmin } from '@/providers/tenant-admin-provider';
import {
  Play, Pause, Eye, User, Shield, Database, Code, CheckCircle, XCircle,
  AlertTriangle, RefreshCw, Download, Settings, Search, Filter, Clock
} from 'lucide-react';

interface TestScenario {
  id: string;
  name: string;
  description: string;
  testUserId: string;
  scopeId: string;
  testQueries: TestQuery[];
  expectedResults: ExpectedResult[];
  isActive: boolean;
}

interface TestQuery {
  id: string;
  module: string;
  resource: string;
  action: string;
  sampleData?: any;
  sqlQuery?: string;
}

interface ExpectedResult {
  queryId: string;
  shouldAllow: boolean;
  expectedRecordCount?: number;
  reason: string;
}

interface TestResult {
  scenarioId: string;
  queryId: string;
  executionTime: number;
  success: boolean;
  actualResult: 'ALLOWED' | 'DENIED';
  expectedResult: 'ALLOWED' | 'DENIED';
  recordCount?: number;
  errorMessage?: string;
  executedSql?: string;
}

interface ScopeTestingPanelProps {
  dataScopes: any[];
  accessRules: any[];
  onTestComplete?: (results: TestResult[]) => void;
}

const ScopeTestingPanel: React.FC<ScopeTestingPanelProps> = ({
  dataScopes = [],
  accessRules = [],
  onTestComplete
}) => {
  const { tenantUsers, tenantModules } = useTenantAdmin();
  
  const [testScenarios, setTestScenarios] = useState<TestScenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<TestScenario | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [testHistory, setTestHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, passed, failed, running
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedScope, setSelectedScope] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock test scenarios
  const mockTestScenarios: TestScenario[] = [
    {
      id: 'scenario-1',
      name: 'Sales Department Access Test',
      description: 'Test that sales users can only access their department data',
      testUserId: 'user-2',
      scopeId: 'scope-sales-dept',
      testQueries: [
        {
          id: 'query-1',
          module: 'crm',
          resource: 'customers',
          action: 'read',
          sampleData: { department_id: 'sales', id: 123 },
          sqlQuery: 'SELECT * FROM customers WHERE department_id = \'sales\''
        },
        {
          id: 'query-2',
          module: 'crm',
          resource: 'customers',
          action: 'read',
          sampleData: { department_id: 'marketing', id: 456 },
          sqlQuery: 'SELECT * FROM customers WHERE department_id = \'marketing\''
        },
        {
          id: 'query-3',
          module: 'crm',
          resource: 'opportunities',
          action: 'create',
          sampleData: { assigned_to: 'user-2', department_id: 'sales' }
        }
      ],
      expectedResults: [
        {
          queryId: 'query-1',
          shouldAllow: true,
          expectedRecordCount: 50,
          reason: 'User belongs to sales department'
        },
        {
          queryId: 'query-2',
          shouldAllow: false,
          expectedRecordCount: 0,
          reason: 'User does not belong to marketing department'
        },
        {
          queryId: 'query-3',
          shouldAllow: true,
          reason: 'User can create opportunities in their department'
        }
      ],
      isActive: true
    },
    {
      id: 'scenario-2',
      name: 'Personal Data Scope Test',
      description: 'Test that users with personal scope can only access their own data',
      testUserId: 'user-6',
      scopeId: 'scope-personal',
      testQueries: [
        {
          id: 'query-4',
          module: 'hr',
          resource: 'employee_records',
          action: 'read',
          sampleData: { employee_id: 'user-6' }
        },
        {
          id: 'query-5',
          module: 'hr',
          resource: 'employee_records',
          action: 'read',
          sampleData: { employee_id: 'user-7' }
        },
        {
          id: 'query-6',
          module: 'crm',
          resource: 'opportunities',
          action: 'update',
          sampleData: { assigned_to: 'user-6', id: 789 }
        }
      ],
      expectedResults: [
        {
          queryId: 'query-4',
          shouldAllow: true,
          reason: 'User accessing their own HR record'
        },
        {
          queryId: 'query-5',
          shouldAllow: false,
          reason: 'User cannot access other employee records'
        },
        {
          queryId: 'query-6',
          shouldAllow: true,
          reason: 'User can update opportunities assigned to them'
        }
      ],
      isActive: true
    },
    {
      id: 'scenario-3',
      name: 'Global Admin Access Test',
      description: 'Test that global admin can access all data across departments',
      testUserId: 'user-1',
      scopeId: 'scope-global',
      testQueries: [
        {
          id: 'query-7',
          module: 'crm',
          resource: 'customers',
          action: 'read',
          sampleData: { department_id: 'sales' }
        },
        {
          id: 'query-8',
          module: 'crm',
          resource: 'customers',
          action: 'read',
          sampleData: { department_id: 'marketing' }
        },
        {
          id: 'query-9',
          module: 'finance',
          resource: 'invoices',
          action: 'read',
          sampleData: { amount: 10000 }
        }
      ],
      expectedResults: [
        {
          queryId: 'query-7',
          shouldAllow: true,
          reason: 'Global admin has access to all departments'
        },
        {
          queryId: 'query-8',
          shouldAllow: true,
          reason: 'Global admin has access to all departments'
        },
        {
          queryId: 'query-9',
          shouldAllow: true,
          reason: 'Global admin can access all financial data'
        }
      ],
      isActive: true
    }
  ];

  // Initialize with mock data
  useEffect(() => {
    setTestScenarios(mockTestScenarios);
  }, []);

  const filteredScenarios = testScenarios.filter(scenario => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (!scenario.name.toLowerCase().includes(searchLower) &&
          !scenario.description.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    if (selectedUser && scenario.testUserId !== selectedUser) return false;
    if (selectedScope && scenario.scopeId !== selectedScope) return false;

    return true;
  });

  const runScenarioTest = async (scenario: TestScenario) => {
    setIsRunning(true);
    setCurrentTest(scenario.id);
    setError(null);

    try {
      const scenarioResults: TestResult[] = [];

      // Run each test query in the scenario
      for (const query of scenario.testQueries) {
        const startTime = performance.now();
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        
        const endTime = performance.now();
        const executionTime = Math.round(endTime - startTime);

        // Find expected result for this query
        const expectedResult = scenario.expectedResults.find(r => r.queryId === query.id);
        
        // Simulate test execution based on scope and access rules
        const user = tenantUsers.find(u => u.id === scenario.testUserId);
        const scope = dataScopes.find(s => s.id === scenario.scopeId);
        
        // Mock decision logic
        let actualResult: 'ALLOWED' | 'DENIED' = 'DENIED';
        let recordCount = 0;
        
        if (scope) {
          if (scope.type === 'global') {
            actualResult = 'ALLOWED';
            recordCount = Math.floor(Math.random() * 100) + 1;
          } else if (scope.type === 'personal') {
            // For personal scope, only allow if accessing own data
            actualResult = query.sampleData?.employee_id === scenario.testUserId || 
                          query.sampleData?.assigned_to === scenario.testUserId ? 'ALLOWED' : 'DENIED';
            recordCount = actualResult === 'ALLOWED' ? 1 : 0;
          } else if (scope.type === 'department') {
            // For department scope, allow if in same department
            actualResult = query.sampleData?.department_id === 'sales' ? 'ALLOWED' : 'DENIED';
            recordCount = actualResult === 'ALLOWED' ? Math.floor(Math.random() * 50) + 1 : 0;
          }
        }

        const result: TestResult = {
          scenarioId: scenario.id,
          queryId: query.id,
          executionTime,
          success: true,
          actualResult,
          expectedResult: expectedResult?.shouldAllow ? 'ALLOWED' : 'DENIED',
          recordCount,
          executedSql: query.sqlQuery || `SELECT * FROM ${query.resource} WHERE scope_filter_applied`
        };

        scenarioResults.push(result);
      }

      // Update results
      setTestResults(prev => [
        ...prev.filter(r => r.scenarioId !== scenario.id),
        ...scenarioResults
      ]);

      // Add to history
      const historyEntry = {
        id: `history-${Date.now()}`,
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        timestamp: new Date().toISOString(),
        results: scenarioResults,
        passed: scenarioResults.every(r => r.actualResult === r.expectedResult),
        duration: scenarioResults.reduce((sum, r) => sum + r.executionTime, 0)
      };
      
      setTestHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10 runs

      if (onTestComplete) {
        onTestComplete(scenarioResults);
      }

    } catch (err) {
      setError('Failed to execute test scenario');
    } finally {
      setIsRunning(false);
      setCurrentTest(null);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setError(null);

    try {
      for (const scenario of filteredScenarios) {
        if (scenario.isActive) {
          await runScenarioTest(scenario);
        }
      }
    } catch (err) {
      setError('Failed to execute test suite');
    } finally {
      setIsRunning(false);
    }
  };

  const getTestStatus = (scenarioId: string) => {
    const scenarioResults = testResults.filter(r => r.scenarioId === scenarioId);
    if (scenarioResults.length === 0) return 'not_run';
    if (currentTest === scenarioId) return 'running';
    
    const allPassed = scenarioResults.every(r => r.actualResult === r.expectedResult);
    return allPassed ? 'passed' : 'failed';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle size={16} color="#10b981" />;
      case 'failed': return <XCircle size={16} color="#ef4444" />;
      case 'running': return <RefreshCw size={16} color="#f59e0b" className="animate-spin" />;
      default: return <Clock size={16} color="#6b7280" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return '#10b981';
      case 'failed': return '#ef4444';
      case 'running': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ 
      height: '700px', 
      border: '1px solid #e5e7eb', 
      borderRadius: '8px', 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
              Scope Testing Panel
            </h3>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
              Test data scope rules and access controls in a safe environment
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              <Settings size={12} />
              New Test
            </button>
            
            <button
              onClick={runAllTests}
              disabled={isRunning}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                backgroundColor: isRunning ? '#6b7280' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isRunning ? 'not-allowed' : 'pointer',
                fontSize: '12px'
              }}
            >
              {isRunning ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
              {isRunning ? 'Running...' : 'Run All Tests'}
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '8px' }}>
          <div style={{ position: 'relative' }}>
            <Search 
              size={12} 
              style={{ 
                position: 'absolute', 
                left: '8px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: '#6b7280' 
              }} 
            />
            <input
              type="text"
              placeholder="Search test scenarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 6px 6px 28px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            />
          </div>
          
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            style={{
              padding: '6px 8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '12px',
              minWidth: '120px'
            }}
          >
            <option value="">All Users</option>
            {tenantUsers.map(user => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>

          <select
            value={selectedScope}
            onChange={(e) => setSelectedScope(e.target.value)}
            style={{
              padding: '6px 8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '12px',
              minWidth: '120px'
            }}
          >
            <option value="">All Scopes</option>
            {dataScopes.map(scope => (
              <option key={scope.id} value={scope.id}>{scope.name}</option>
            ))}
          </select>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {filteredScenarios.length} tests
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Panel - Test Scenarios */}
        <div style={{ 
          width: '50%', 
          borderRight: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ 
            padding: '12px 16px',
            borderBottom: '1px solid #f3f4f6',
            backgroundColor: '#f9fafb'
          }}>
            <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#374151', margin: 0 }}>
              Test Scenarios
            </h4>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredScenarios.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <Database size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '500' }}>
                  No test scenarios found
                </h4>
                <p style={{ margin: 0, fontSize: '12px' }}>
                  Create test scenarios to validate your data scope rules
                </p>
              </div>
            ) : (
              <div style={{ padding: '8px' }}>
                {filteredScenarios.map(scenario => {
                  const status = getTestStatus(scenario.id);
                  const scenarioResults = testResults.filter(r => r.scenarioId === scenario.id);
                  const user = tenantUsers.find(u => u.id === scenario.testUserId);
                  const scope = dataScopes.find(s => s.id === scenario.scopeId);

                  return (
                    <div
                      key={scenario.id}
                      onClick={() => setSelectedScenario(scenario)}
                      style={{
                        padding: '12px',
                        marginBottom: '8px',
                        backgroundColor: selectedScenario?.id === scenario.id ? '#f0f9ff' : 'white',
                        border: `1px solid ${selectedScenario?.id === scenario.id ? '#3b82f6' : '#e5e7eb'}`,
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px'
                      }}>
                        {getStatusIcon(status)}
                        
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                            {scenario.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {scenario.description}
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            runScenarioTest(scenario);
                          }}
                          disabled={isRunning}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: status === 'running' ? '#6b7280' : '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: isRunning ? 'not-allowed' : 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          {status === 'running' ? 'Running...' : 'Run Test'}
                        </button>
                      </div>

                      <div style={{
                        display: 'flex',
                        justify: 'space-between',
                        fontSize: '11px',
                        color: '#6b7280'
                      }}>
                        <div>
                          User: {user?.name || 'Unknown'} • Scope: {scope?.name || 'Unknown'}
                        </div>
                        <div>
                          {scenario.testQueries.length} queries
                          {scenarioResults.length > 0 && ` • Last run: ${scenarioResults.every(r => r.actualResult === r.expectedResult) ? 'PASSED' : 'FAILED'}`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Test Details/Results */}
        <div style={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
          {selectedScenario ? (
            <>
              <div style={{ 
                padding: '12px 16px',
                borderBottom: '1px solid #f3f4f6',
                backgroundColor: '#f9fafb'
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#374151', margin: 0 }}>
                  {selectedScenario.name} - Results
                </h4>
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                {/* Scenario Info */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                    {selectedScenario.description}
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    fontSize: '11px'
                  }}>
                    <div>
                      <span style={{ color: '#6b7280' }}>Test User: </span>
                      <span style={{ color: '#374151' }}>
                        {tenantUsers.find(u => u.id === selectedScenario.testUserId)?.name}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280' }}>Data Scope: </span>
                      <span style={{ color: '#374151' }}>
                        {dataScopes.find(s => s.id === selectedScenario.scopeId)?.name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Test Results */}
                <div>
                  <h5 style={{ fontSize: '12px', fontWeight: '500', color: '#374151', margin: '0 0 8px 0' }}>
                    Test Results ({selectedScenario.testQueries.length} queries)
                  </h5>
                  
                  {selectedScenario.testQueries.map(query => {
                    const result = testResults.find(r => r.scenarioId === selectedScenario.id && r.queryId === query.id);
                    const expected = selectedScenario.expectedResults.find(e => e.queryId === query.id);
                    
                    return (
                      <div
                        key={query.id}
                        style={{
                          marginBottom: '12px',
                          padding: '12px',
                          backgroundColor: result ? 
                            (result.actualResult === result.expectedResult ? '#f0fdf4' : '#fef2f2') : 
                            '#f9fafb',
                          border: `1px solid ${result ? 
                            (result.actualResult === result.expectedResult ? '#bbf7d0' : '#fecaca') : 
                            '#e5e7eb'}`,
                          borderRadius: '6px'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px'
                        }}>
                          <div style={{ fontSize: '12px', fontWeight: '500' }}>
                            {query.module}.{query.resource} • {query.action}
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {result && (
                              <>
                                <span style={{
                                  fontSize: '10px',
                                  color: result.actualResult === result.expectedResult ? '#059669' : '#dc2626',
                                  fontWeight: '500'
                                }}>
                                  {result.actualResult === result.expectedResult ? 'PASS' : 'FAIL'}
                                </span>
                                {result.actualResult === result.expectedResult ? 
                                  <CheckCircle size={12} color="#059669" /> : 
                                  <XCircle size={12} color="#dc2626" />
                                }
                              </>
                            )}
                          </div>
                        </div>
                        
                        {result && (
                          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px' }}>
                            <div>Expected: {result.expectedResult} • Actual: {result.actualResult}</div>
                            {result.recordCount !== undefined && (
                              <div>Records returned: {result.recordCount}</div>
                            )}
                            <div>Execution time: {result.executionTime}ms</div>
                          </div>
                        )}
                        
                        {expected && (
                          <div style={{
                            fontSize: '11px',
                            color: '#6b7280',
                            backgroundColor: 'rgba(255,255,255,0.7)',
                            padding: '4px 6px',
                            borderRadius: '3px'
                          }}>
                            Reason: {expected.reason}
                          </div>
                        )}

                        {result?.executedSql && (
                          <details style={{ marginTop: '6px' }}>
                            <summary style={{ fontSize: '10px', color: '#6b7280', cursor: 'pointer' }}>
                              View SQL
                            </summary>
                            <pre style={{
                              fontSize: '9px',
                              fontFamily: 'monospace',
                              backgroundColor: '#f3f4f6',
                              padding: '4px',
                              borderRadius: '2px',
                              margin: '4px 0 0 0',
                              whiteSpace: 'pre-wrap'
                            }}>
                              {result.executedSql}
                            </pre>
                          </details>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Test History for this scenario */}
                {testHistory.filter(h => h.scenarioId === selectedScenario.id).length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <h5 style={{ fontSize: '12px', fontWeight: '500', color: '#374151', margin: '0 0 8px 0' }}>
                      Recent Test Runs
                    </h5>
                    
                    {testHistory
                      .filter(h => h.scenarioId === selectedScenario.id)
                      .slice(0, 3)
                      .map(historyItem => (
                        <div
                          key={historyItem.id}
                          style={{
                            padding: '8px',
                            backgroundColor: historyItem.passed ? '#f0fdf4' : '#fef2f2',
                            border: `1px solid ${historyItem.passed ? '#bbf7d0' : '#fecaca'}`,
                            borderRadius: '4px',
                            fontSize: '11px',
                            marginBottom: '4px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              {historyItem.passed ? <CheckCircle size={12} color="#059669" /> : <XCircle size={12} color="#dc2626" />}
                              <span style={{ marginLeft: '4px', fontWeight: '500' }}>
                                {historyItem.passed ? 'PASSED' : 'FAILED'}
                              </span>
                            </div>
                            <div style={{ color: '#6b7280' }}>
                              {new Date(historyItem.timestamp).toLocaleString()} • {historyItem.duration}ms
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
              textAlign: 'center',
              padding: '40px'
            }}>
              <div>
                <Eye size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '500' }}>
                  Select a test scenario
                </h4>
                <p style={{ margin: 0, fontSize: '12px' }}>
                  Choose a test scenario from the list to view results and details
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Test Modal Placeholder */}
      {showCreateModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateModal(false);
            }
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{
              width: '500px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden'
            }}
          >
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                Create Test Scenario
              </h3>
            </div>
            
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <Database size={48} style={{ margin: '0 auto 16px', color: '#9ca3af' }} />
              <p style={{ color: '#6b7280', margin: '0 0 16px 0' }}>
                Test scenario builder would be implemented here with:
              </p>
              <ul style={{ color: '#6b7280', textAlign: 'left', paddingLeft: '20px', margin: '0 0 16px 0' }}>
                <li>Test name and description</li>
                <li>User and scope selection</li>
                <li>Query builder interface</li>
                <li>Expected results definition</li>
                <li>Sample data configuration</li>
              </ul>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                
                <button
                  onClick={() => {
                    // Mock success
                    setShowCreateModal(false);
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Create Test
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScopeTestingPanel;