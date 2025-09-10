import { NavigationMap, PathResult, UserRole } from './types';

// Intelligence Engine interfaces as planned
export interface PermissionPattern {
  roleHierarchy: RoleHierarchyAnalysis;
  accessPatterns: AccessPattern[];
  permissionGaps: PermissionGap[];
  securityRisks: SecurityRisk[];
}

export interface RoleHierarchyAnalysis {
  expectedHierarchy: Record<string, string[]>;
  actualHierarchy: Record<string, string[]>;
  violations: HierarchyViolation[];
  complianceScore: number;
}

export interface AccessPattern {
  pattern: string;
  rolesWithAccess: string[];
  frequency: number;
  riskLevel: 'low' | 'medium' | 'high';
  description: string;
}

export interface PermissionGap {
  role: string;
  expectedPath: string;
  actualResult: 'accessible' | 'forbidden' | 'error';
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface SecurityRisk {
  type: 'privilege_escalation' | 'unauthorized_access' | 'data_exposure' | 'weak_boundaries';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedRoles: string[];
  paths: string[];
  description: string;
  mitigation: string;
}

export interface HierarchyViolation {
  lowerRole: string;
  higherRole: string;
  violationType: 'excessive_access' | 'missing_access';
  affectedPaths: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface RoleComparisonAnalysis {
  uniqueAccess: Record<string, string[]>;
  commonAccess: string[];
  hierarchicalAccess: HierarchyMap;
  securityExceptions: SecurityException[];
}

export interface HierarchyMap {
  super_admin: string[];
  tenant_admin: string[];
  module_admin: string[];
  wms_user: string[];
  accounting_user: string[];
  readonly_user: string[];
}

export interface SecurityException {
  type: 'unexpected_access' | 'missing_access' | 'role_confusion';
  role: string;
  path: string;
  expected: boolean;
  actual: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface IntelligenceReport {
  permissionPatterns: PermissionPattern;
  roleComparison: RoleComparisonAnalysis;
  securityInsights: SecurityInsight[];
  performanceAnalysis: PerformanceAnalysis;
  recommendations: ActionableInsight[];
  executiveSummary: ExecutiveSummary;
}

export interface SecurityInsight {
  category: 'access_control' | 'role_management' | 'data_security' | 'system_boundaries';
  finding: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  evidence: string[];
  recommendation: string;
}

export interface PerformanceAnalysis {
  responseTimeAnalysis: ResponseTimeAnalysis;
  errorPatterns: ErrorPattern[];
  optimizationOpportunities: OptimizationOpportunity[];
}

export interface ResponseTimeAnalysis {
  averageByRole: Record<string, number>;
  slowestPaths: Array<{ path: string; role: string; responseTime: number }>;
  fastestPaths: Array<{ path: string; role: string; responseTime: number }>;
  performanceGrades: Record<string, string>;
}

export interface ErrorPattern {
  errorType: string;
  frequency: number;
  affectedRoles: string[];
  affectedPaths: string[];
  commonality: number;
}

export interface OptimizationOpportunity {
  area: 'performance' | 'security' | 'usability' | 'architecture';
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  priority: number;
}

export interface ActionableInsight {
  category: 'security' | 'performance' | 'architecture' | 'compliance';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  implementation: string[];
  validation: string[];
}

export interface ExecutiveSummary {
  securityPosture: 'excellent' | 'good' | 'needs_improvement' | 'critical';
  overallScore: number;
  keyFindings: string[];
  topRisks: string[];
  quickWins: string[];
  investmentPriorities: string[];
}

/**
 * NavigationIntelligenceEngine - Advanced AI-driven analysis of navigation patterns
 * Implements permission pattern recognition, role hierarchy validation, and security gap detection
 */
export class NavigationIntelligenceEngine {
  private navigationMap: NavigationMap;
  private roleHierarchy: Record<string, number> = {
    'super_admin': 6,
    'tenant_admin': 5,
    'module_admin': 4,
    'wms_user': 3,
    'accounting_user': 3,
    'readonly_user': 1
  };

  constructor(navigationMap: NavigationMap) {
    this.navigationMap = navigationMap;
  }

  /**
   * Main analysis entry point - generates comprehensive intelligence report
   */
  async generateIntelligenceReport(): Promise<IntelligenceReport> {
    console.log('🧠 Starting intelligent navigation analysis...');
    
    const permissionPatterns = await this.analyzePermissionPatterns();
    const roleComparison = await this.compareAllRoles();
    const securityInsights = await this.generateSecurityInsights();
    const performanceAnalysis = await this.analyzePerformancePatterns();
    const recommendations = await this.generateActionableInsights();
    const executiveSummary = await this.generateExecutiveSummary(
      permissionPatterns, securityInsights, performanceAnalysis
    );

    return {
      permissionPatterns,
      roleComparison,
      securityInsights,
      performanceAnalysis,
      recommendations,
      executiveSummary
    };
  }

  /**
   * Permission Pattern Recognition - AI-driven pattern detection
   */
  async analyzePermissionPatterns(): Promise<PermissionPattern> {
    console.log('🔍 Analyzing permission patterns...');

    const roleHierarchy = this.analyzeRoleHierarchy();
    const accessPatterns = this.identifyAccessPatterns();
    const permissionGaps = this.detectPermissionGaps();
    const securityRisks = this.assessSecurityRisks();

    return {
      roleHierarchy,
      accessPatterns,
      permissionGaps,
      securityRisks
    };
  }

  /**
   * Multi-Role Comparison Engine
   */
  async compareAllRoles(): Promise<RoleComparisonAnalysis> {
    console.log('⚖️ Comparing role access patterns...');

    const uniqueAccess: Record<string, string[]> = {};
    const commonAccess: string[] = [];
    const hierarchicalAccess: HierarchyMap = {
      super_admin: [],
      tenant_admin: [],
      module_admin: [],
      wms_user: [],
      accounting_user: [],
      readonly_user: []
    };

    // Analyze unique access per role
    Object.entries(this.navigationMap).forEach(([role, discovery]) => {
      const accessiblePaths = discovery.discoveredPaths
        .filter(p => p.accessible)
        .map(p => p.path);
      uniqueAccess[role] = accessiblePaths;
      hierarchicalAccess[role as keyof HierarchyMap] = accessiblePaths;
    });

    // Find common access paths
    const allRoles = Object.keys(uniqueAccess);
    if (allRoles.length > 0) {
      const firstRolePaths = new Set(uniqueAccess[allRoles[0]]);
      for (const path of firstRolePaths) {
        if (allRoles.every(role => uniqueAccess[role].includes(path))) {
          commonAccess.push(path);
        }
      }
    }

    const securityExceptions = this.detectSecurityExceptions(uniqueAccess);

    return {
      uniqueAccess,
      commonAccess,
      hierarchicalAccess,
      securityExceptions
    };
  }

  /**
   * Role Hierarchy Analysis
   */
  private analyzeRoleHierarchy(): RoleHierarchyAnalysis {
    const expectedHierarchy = this.getExpectedHierarchy();
    const actualHierarchy = this.getActualHierarchy();
    const violations = this.detectHierarchyViolations(expectedHierarchy, actualHierarchy);
    
    const totalChecks = Object.keys(expectedHierarchy).length * 6; // 6 roles
    const violationCount = violations.length;
    const complianceScore = Math.max(0, ((totalChecks - violationCount) / totalChecks) * 100);

    return {
      expectedHierarchy,
      actualHierarchy,
      violations,
      complianceScore
    };
  }

  /**
   * Access Pattern Identification
   */
  private identifyAccessPatterns(): AccessPattern[] {
    const patterns: AccessPattern[] = [];

    // Admin-only patterns
    const adminOnlyPaths = this.findPathsWithRoles(['super_admin', 'tenant_admin']);
    if (adminOnlyPaths.length > 0) {
      patterns.push({
        pattern: 'Admin-Only Access',
        rolesWithAccess: ['super_admin', 'tenant_admin'],
        frequency: adminOnlyPaths.length,
        riskLevel: 'low',
        description: 'Paths accessible only to administrative roles'
      });
    }

    // Universal access patterns
    const universalPaths = this.findUniversalAccessPaths();
    if (universalPaths.length > 0) {
      patterns.push({
        pattern: 'Universal Access',
        rolesWithAccess: Object.keys(this.navigationMap),
        frequency: universalPaths.length,
        riskLevel: 'medium',
        description: 'Paths accessible to all roles - verify if intended'
      });
    }

    // Privilege escalation risks
    const escalationRisks = this.findPrivilegeEscalationRisks();
    if (escalationRisks.length > 0) {
      patterns.push({
        pattern: 'Potential Privilege Escalation',
        rolesWithAccess: escalationRisks,
        frequency: escalationRisks.length,
        riskLevel: 'high',
        description: 'Lower-privilege roles accessing high-privilege paths'
      });
    }

    return patterns;
  }

  /**
   * Permission Gap Detection
   */
  private detectPermissionGaps(): PermissionGap[] {
    const gaps: PermissionGap[] = [];

    // Expected admin paths that aren't accessible
    const expectedAdminPaths = ['/admin', '/admin/users', '/admin/settings', '/admin/roles'];
    
    Object.entries(this.navigationMap).forEach(([role, discovery]) => {
      const isAdminRole = ['super_admin', 'tenant_admin'].includes(role);
      
      expectedAdminPaths.forEach(expectedPath => {
        const pathResult = discovery.discoveredPaths.find(p => p.path === expectedPath);
        
        if (isAdminRole && (!pathResult || !pathResult.accessible)) {
          gaps.push({
            role,
            expectedPath,
            actualResult: pathResult ? (pathResult.accessible ? 'accessible' : 'forbidden') : 'error',
            severity: 'high',
            recommendation: `Ensure ${role} has access to ${expectedPath}`
          });
        }
      });
    });

    return gaps;
  }

  /**
   * Security Risk Assessment
   */
  private assessSecurityRisks(): SecurityRisk[] {
    const risks: SecurityRisk[] = [];

    // Check for unauthorized admin access
    const unauthorizedAdminAccess = this.findUnauthorizedAdminAccess();
    if (unauthorizedAdminAccess.length > 0) {
      risks.push({
        type: 'unauthorized_access',
        severity: 'high',
        affectedRoles: unauthorizedAdminAccess,
        paths: ['/admin'],
        description: 'Non-admin roles accessing administrative functions',
        mitigation: 'Implement strict role-based access control for admin paths'
      });
    }

    // Check for weak role boundaries
    const weakBoundaries = this.detectWeakRoleBoundaries();
    if (weakBoundaries.length > 0) {
      risks.push({
        type: 'weak_boundaries',
        severity: 'medium',
        affectedRoles: weakBoundaries,
        paths: [],
        description: 'Roles have overlapping access patterns that may indicate weak boundaries',
        mitigation: 'Review and tighten role-based access controls'
      });
    }

    return risks;
  }

  // Utility methods
  private getExpectedHierarchy(): Record<string, string[]> {
    return {
      'super_admin': ['/admin', '/admin/users', '/admin/settings', '/admin/roles', '/admin/tenants'],
      'tenant_admin': ['/admin', '/admin/users', '/admin/settings'],
      'module_admin': ['/admin/settings'],
      'wms_user': ['/wms'],
      'accounting_user': ['/accounting'],
      'readonly_user': ['/dashboard']
    };
  }

  private getActualHierarchy(): Record<string, string[]> {
    const actual: Record<string, string[]> = {};
    
    Object.entries(this.navigationMap).forEach(([role, discovery]) => {
      actual[role] = discovery.discoveredPaths
        .filter(p => p.accessible)
        .map(p => p.path);
    });

    return actual;
  }

  private detectHierarchyViolations(expected: Record<string, string[]>, actual: Record<string, string[]>): HierarchyViolation[] {
    const violations: HierarchyViolation[] = [];

    // Compare each role pair for hierarchy violations
    const roles = Object.keys(expected);
    
    for (let i = 0; i < roles.length; i++) {
      for (let j = i + 1; j < roles.length; j++) {
        const lowerRole = this.roleHierarchy[roles[i]] < this.roleHierarchy[roles[j]] ? roles[i] : roles[j];
        const higherRole = this.roleHierarchy[roles[i]] > this.roleHierarchy[roles[j]] ? roles[i] : roles[j];
        
        const lowerPaths = new Set(actual[lowerRole] || []);
        const higherPaths = new Set(actual[higherRole] || []);
        
        // Find paths that lower role has but higher role doesn't
        const excessivePaths = [...lowerPaths].filter(path => !higherPaths.has(path));
        if (excessivePaths.length > 0) {
          violations.push({
            lowerRole,
            higherRole,
            violationType: 'excessive_access',
            affectedPaths: excessivePaths,
            severity: 'medium'
          });
        }
      }
    }

    return violations;
  }

  private findPathsWithRoles(roles: string[]): string[] {
    const paths: Set<string> = new Set();
    
    roles.forEach(role => {
      if (this.navigationMap[role]) {
        this.navigationMap[role].discoveredPaths
          .filter(p => p.accessible)
          .forEach(p => paths.add(p.path));
      }
    });

    return Array.from(paths);
  }

  private findUniversalAccessPaths(): string[] {
    const allRoles = Object.keys(this.navigationMap);
    const universalPaths: string[] = [];
    
    if (allRoles.length === 0) return universalPaths;
    
    // Get paths from first role
    const firstRolePaths = this.navigationMap[allRoles[0]]?.discoveredPaths
      .filter(p => p.accessible)
      .map(p => p.path) || [];
    
    // Check if path exists in all other roles
    firstRolePaths.forEach(path => {
      const isUniversal = allRoles.every(role => 
        this.navigationMap[role]?.discoveredPaths
          .some(p => p.path === path && p.accessible)
      );
      
      if (isUniversal) {
        universalPaths.push(path);
      }
    });

    return universalPaths;
  }

  private findPrivilegeEscalationRisks(): string[] {
    const risks: string[] = [];
    
    // Check if lower-privilege roles can access admin paths
    const lowPrivilegeRoles = ['readonly_user', 'wms_user', 'accounting_user'];
    const adminPaths = ['/admin', '/admin/users', '/admin/settings'];
    
    lowPrivilegeRoles.forEach(role => {
      if (this.navigationMap[role]) {
        const accessiblePaths = this.navigationMap[role].discoveredPaths
          .filter(p => p.accessible)
          .map(p => p.path);
        
        const hasAdminAccess = adminPaths.some(adminPath => 
          accessiblePaths.includes(adminPath)
        );
        
        if (hasAdminAccess) {
          risks.push(role);
        }
      }
    });

    return risks;
  }

  private findUnauthorizedAdminAccess(): string[] {
    const unauthorizedRoles: string[] = [];
    const nonAdminRoles = ['module_admin', 'wms_user', 'accounting_user', 'readonly_user'];
    
    nonAdminRoles.forEach(role => {
      if (this.navigationMap[role]) {
        const hasAdminAccess = this.navigationMap[role].discoveredPaths
          .some(p => p.path.startsWith('/admin') && p.accessible);
        
        if (hasAdminAccess) {
          unauthorizedRoles.push(role);
        }
      }
    });

    return unauthorizedRoles;
  }

  private detectWeakRoleBoundaries(): string[] {
    // Analyze overlap between roles to detect weak boundaries
    const roles = Object.keys(this.navigationMap);
    const weakBoundaryRoles: string[] = [];
    
    roles.forEach(role => {
      const rolePaths = this.navigationMap[role]?.discoveredPaths
        .filter(p => p.accessible)
        .map(p => p.path) || [];
      
      // Check overlap with other roles
      let totalOverlap = 0;
      roles.forEach(otherRole => {
        if (role !== otherRole) {
          const otherPaths = this.navigationMap[otherRole]?.discoveredPaths
            .filter(p => p.accessible)
            .map(p => p.path) || [];
          
          const overlap = rolePaths.filter(path => otherPaths.includes(path)).length;
          totalOverlap += overlap;
        }
      });
      
      // If 80%+ of paths overlap with other roles, consider it weak boundary
      const overlapPercentage = rolePaths.length > 0 ? (totalOverlap / rolePaths.length) : 0;
      if (overlapPercentage > 0.8) {
        weakBoundaryRoles.push(role);
      }
    });

    return weakBoundaryRoles;
  }

  private detectSecurityExceptions(uniqueAccess: Record<string, string[]>): SecurityException[] {
    const exceptions: SecurityException[] = [];

    // Check for unexpected access patterns
    Object.entries(uniqueAccess).forEach(([role, paths]) => {
      paths.forEach(path => {
        const isAdminPath = path.startsWith('/admin');
        const isAdminRole = ['super_admin', 'tenant_admin'].includes(role);
        
        if (isAdminPath && !isAdminRole) {
          exceptions.push({
            type: 'unexpected_access',
            role,
            path,
            expected: false,
            actual: true,
            riskLevel: 'high'
          });
        }
      });
    });

    return exceptions;
  }

  /**
   * Generate Security Insights
   */
  private async generateSecurityInsights(): Promise<SecurityInsight[]> {
    const insights: SecurityInsight[] = [];

    // Analyze role separation
    const roleOverlap = this.analyzeRoleOverlap();
    if (roleOverlap > 50) {
      insights.push({
        category: 'access_control',
        finding: `High role overlap detected: ${roleOverlap}% of paths are accessible by multiple roles`,
        impact: 'medium',
        evidence: ['Role comparison analysis'],
        recommendation: 'Review and tighten role-specific access controls'
      });
    }

    // Check admin access controls
    const adminAccessIssues = this.findUnauthorizedAdminAccess();
    if (adminAccessIssues.length > 0) {
      insights.push({
        category: 'access_control',
        finding: `Unauthorized admin access detected for roles: ${adminAccessIssues.join(', ')}`,
        impact: 'high',
        evidence: adminAccessIssues,
        recommendation: 'Implement strict admin access controls and review role permissions'
      });
    }

    return insights;
  }

  /**
   * Generate Performance Analysis
   */
  private async analyzePerformancePatterns(): Promise<PerformanceAnalysis> {
    const responseTimeAnalysis = this.analyzeResponseTimes();
    const errorPatterns = this.analyzeErrorPatterns();
    const optimizationOpportunities = this.identifyOptimizationOpportunities();

    return {
      responseTimeAnalysis,
      errorPatterns,
      optimizationOpportunities
    };
  }

  private analyzeResponseTimes(): ResponseTimeAnalysis {
    const averageByRole: Record<string, number> = {};
    const slowestPaths: Array<{ path: string; role: string; responseTime: number }> = [];
    const fastestPaths: Array<{ path: string; role: string; responseTime: number }> = [];
    const performanceGrades: Record<string, string> = {};

    Object.entries(this.navigationMap).forEach(([role, discovery]) => {
      const responseTimes = discovery.discoveredPaths
        .filter(p => p.responseTime && p.responseTime > 0)
        .map(p => p.responseTime!);
      
      if (responseTimes.length > 0) {
        const average = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        averageByRole[role] = Math.round(average);
        
        // Performance grading
        if (average < 1000) performanceGrades[role] = 'A';
        else if (average < 2000) performanceGrades[role] = 'B';
        else if (average < 3000) performanceGrades[role] = 'C';
        else performanceGrades[role] = 'D';

        // Track slowest and fastest paths
        discovery.discoveredPaths.forEach(p => {
          if (p.responseTime) {
            slowestPaths.push({ path: p.path, role, responseTime: p.responseTime });
            fastestPaths.push({ path: p.path, role, responseTime: p.responseTime });
          }
        });
      }
    });

    // Sort and limit results
    slowestPaths.sort((a, b) => b.responseTime - a.responseTime).splice(5);
    fastestPaths.sort((a, b) => a.responseTime - b.responseTime).splice(5);

    return {
      averageByRole,
      slowestPaths,
      fastestPaths,
      performanceGrades
    };
  }

  private analyzeErrorPatterns(): ErrorPattern[] {
    const errorPatterns: ErrorPattern[] = [];
    const errorMap = new Map<string, { count: number; roles: Set<string>; paths: Set<string> }>();

    Object.entries(this.navigationMap).forEach(([role, discovery]) => {
      discovery.discoveredPaths.forEach(p => {
        if (p.error) {
          const errorType = this.categorizeError(p.error);
          if (!errorMap.has(errorType)) {
            errorMap.set(errorType, { count: 0, roles: new Set(), paths: new Set() });
          }
          const errorData = errorMap.get(errorType)!;
          errorData.count++;
          errorData.roles.add(role);
          errorData.paths.add(p.path);
        }
      });
    });

    errorMap.forEach((data, errorType) => {
      errorPatterns.push({
        errorType,
        frequency: data.count,
        affectedRoles: Array.from(data.roles),
        affectedPaths: Array.from(data.paths),
        commonality: (data.roles.size / Object.keys(this.navigationMap).length) * 100
      });
    });

    return errorPatterns.sort((a, b) => b.frequency - a.frequency);
  }

  private categorizeError(error: string): string {
    if (error.includes('timeout')) return 'Timeout';
    if (error.includes('404')) return 'Not Found';
    if (error.includes('403')) return 'Forbidden';
    if (error.includes('500')) return 'Server Error';
    if (error.includes('network')) return 'Network Error';
    return 'Other';
  }

  private identifyOptimizationOpportunities(): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = [];

    // Performance optimization
    const avgResponseTime = this.calculateOverallAverageResponseTime();
    if (avgResponseTime > 2000) {
      opportunities.push({
        area: 'performance',
        description: `Average response time is ${avgResponseTime}ms - consider performance optimization`,
        impact: 'high',
        effort: 'medium',
        priority: 1
      });
    }

    // Security improvements
    const securityIssues = this.findUnauthorizedAdminAccess();
    if (securityIssues.length > 0) {
      opportunities.push({
        area: 'security',
        description: 'Unauthorized admin access detected - implement stricter access controls',
        impact: 'high',
        effort: 'medium',
        priority: 2
      });
    }

    return opportunities.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Generate Actionable Insights
   */
  private async generateActionableInsights(): Promise<ActionableInsight[]> {
    const insights: ActionableInsight[] = [];

    // Security improvements
    const unauthorizedAccess = this.findUnauthorizedAdminAccess();
    if (unauthorizedAccess.length > 0) {
      insights.push({
        category: 'security',
        title: 'Fix Unauthorized Admin Access',
        description: `Roles ${unauthorizedAccess.join(', ')} have unauthorized admin access`,
        priority: 'high',
        effort: 'medium',
        impact: 'high',
        implementation: [
          'Review role-based access control configuration',
          'Update admin route protection',
          'Test access controls for each role'
        ],
        validation: [
          'Verify non-admin roles cannot access /admin routes',
          'Test role hierarchy compliance',
          'Run security audit'
        ]
      });
    }

    // Performance improvements
    const slowPaths = this.findSlowPaths();
    if (slowPaths.length > 0) {
      insights.push({
        category: 'performance',
        title: 'Optimize Slow Loading Paths',
        description: `${slowPaths.length} paths have response times > 2 seconds`,
        priority: 'medium',
        effort: 'low',
        impact: 'medium',
        implementation: [
          'Profile slow-loading routes',
          'Implement caching strategy',
          'Optimize database queries'
        ],
        validation: [
          'Measure response time improvements',
          'Monitor user experience metrics',
          'Load test optimized routes'
        ]
      });
    }

    return insights.sort((a, b) => this.getPriorityScore(b) - this.getPriorityScore(a));
  }

  /**
   * Generate Executive Summary
   */
  private async generateExecutiveSummary(
    patterns: PermissionPattern,
    insights: SecurityInsight[],
    performance: PerformanceAnalysis
  ): Promise<ExecutiveSummary> {
    const securityPosture = this.assessSecurityPosture(patterns, insights);
    const overallScore = this.calculateOverallScore(patterns, insights, performance);
    
    const keyFindings = [
      `Role hierarchy compliance: ${patterns.roleHierarchy.complianceScore.toFixed(1)}%`,
      `Security risks identified: ${patterns.securityRisks.length}`,
      `Permission gaps found: ${patterns.permissionGaps.length}`,
      `Performance grade: ${this.calculatePerformanceGrade(performance)}`
    ];

    const topRisks = patterns.securityRisks
      .filter(r => r.severity === 'high' || r.severity === 'critical')
      .slice(0, 3)
      .map(r => r.description);

    const quickWins = insights
      .filter(i => i.priority === 'high' && i.effort === 'low')
      .slice(0, 3)
      .map(i => i.title);

    const investmentPriorities = [
      'Strengthen role-based access controls',
      'Implement comprehensive audit logging',
      'Optimize application performance',
      'Enhance security monitoring'
    ];

    return {
      securityPosture,
      overallScore,
      keyFindings,
      topRisks,
      quickWins,
      investmentPriorities
    };
  }

  // Helper methods
  private analyzeRoleOverlap(): number {
    const allPaths = new Set<string>();
    const rolePathCounts: Record<string, number> = {};

    Object.values(this.navigationMap).forEach(discovery => {
      discovery.discoveredPaths
        .filter(p => p.accessible)
        .forEach(p => {
          allPaths.add(p.path);
          rolePathCounts[p.path] = (rolePathCounts[p.path] || 0) + 1;
        });
    });

    const overlappingPaths = Object.values(rolePathCounts).filter(count => count > 1).length;
    return allPaths.size > 0 ? (overlappingPaths / allPaths.size) * 100 : 0;
  }

  private calculateOverallAverageResponseTime(): number {
    let totalTime = 0;
    let totalRequests = 0;

    Object.values(this.navigationMap).forEach(discovery => {
      discovery.discoveredPaths.forEach(p => {
        if (p.responseTime && p.responseTime > 0) {
          totalTime += p.responseTime;
          totalRequests++;
        }
      });
    });

    return totalRequests > 0 ? Math.round(totalTime / totalRequests) : 0;
  }

  private findSlowPaths(): Array<{ path: string; role: string; responseTime: number }> {
    const slowPaths: Array<{ path: string; role: string; responseTime: number }> = [];

    Object.entries(this.navigationMap).forEach(([role, discovery]) => {
      discovery.discoveredPaths.forEach(p => {
        if (p.responseTime && p.responseTime > 2000) {
          slowPaths.push({ path: p.path, role, responseTime: p.responseTime });
        }
      });
    });

    return slowPaths.sort((a, b) => b.responseTime - a.responseTime);
  }

  private getPriorityScore(insight: ActionableInsight): number {
    const priorityScores = { critical: 4, high: 3, medium: 2, low: 1 };
    const impactScores = { high: 3, medium: 2, low: 1 };
    const effortScores = { low: 3, medium: 2, high: 1 };

    return (
      priorityScores[insight.priority] +
      impactScores[insight.impact] +
      effortScores[insight.effort]
    );
  }

  private assessSecurityPosture(patterns: PermissionPattern, insights: SecurityInsight[]): 'excellent' | 'good' | 'needs_improvement' | 'critical' {
    const criticalIssues = patterns.securityRisks.filter(r => r.severity === 'critical').length;
    const highIssues = patterns.securityRisks.filter(r => r.severity === 'high').length;
    const complianceScore = patterns.roleHierarchy.complianceScore;

    if (criticalIssues > 0) return 'critical';
    if (highIssues > 2 || complianceScore < 70) return 'needs_improvement';
    if (highIssues > 0 || complianceScore < 90) return 'good';
    return 'excellent';
  }

  private calculateOverallScore(patterns: PermissionPattern, insights: SecurityInsight[], performance: PerformanceAnalysis): number {
    const securityScore = patterns.roleHierarchy.complianceScore;
    const performanceScore = this.calculatePerformanceScore(performance);
    const riskPenalty = patterns.securityRisks.length * 5;

    return Math.max(0, Math.round((securityScore + performanceScore) / 2 - riskPenalty));
  }

  private calculatePerformanceScore(performance: PerformanceAnalysis): number {
    const avgResponseTime = this.calculateOverallAverageResponseTime();
    if (avgResponseTime < 1000) return 100;
    if (avgResponseTime < 2000) return 80;
    if (avgResponseTime < 3000) return 60;
    if (avgResponseTime < 5000) return 40;
    return 20;
  }

  private calculatePerformanceGrade(performance: PerformanceAnalysis): string {
    const score = this.calculatePerformanceScore(performance);
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
}