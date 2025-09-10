import { NavigationMap, PathResult } from './types';
import { IntelligenceReport } from './navigation-intelligence';
import * as fs from 'fs/promises';
import * as path from 'path';

// Advanced reporting interfaces as planned in Day 2
export interface AdvancedReport {
  executiveSummary: ExecutiveSummary;
  roleComparisonMatrix: ComparisonMatrix;
  permissionHeatmap: PermissionHeatmap;
  securityFindings: SecurityFindings;
  recommendedActions: RecommendedAction[];
  interactiveElements: InteractiveElement[];
  exportOptions: ExportOption[];
}

export interface ExecutiveSummary {
  title: string;
  generatedAt: string;
  overallSecurityScore: number;
  keyMetrics: KeyMetric[];
  criticalFindings: string[];
  quickWins: string[];
  investmentRecommendations: string[];
  complianceStatus: ComplianceStatus;
}

export interface KeyMetric {
  name: string;
  value: string | number;
  trend: 'up' | 'down' | 'stable' | 'new';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface ComplianceStatus {
  overall: 'compliant' | 'non_compliant' | 'partial';
  roleHierarchy: number;
  accessControl: number;
  securityBoundaries: number;
  details: string[];
}

export interface ComparisonMatrix {
  roles: string[];
  paths: string[];
  accessMatrix: boolean[][];
  heatmapData: HeatmapCell[][];
  anomalies: MatrixAnomaly[];
}

export interface HeatmapCell {
  role: string;
  path: string;
  accessible: boolean;
  responseTime?: number;
  errorCount: number;
  riskLevel: 'low' | 'medium' | 'high';
  color: string;
}

export interface MatrixAnomaly {
  role: string;
  path: string;
  expected: boolean;
  actual: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  description: string;
}

export interface PermissionHeatmap {
  title: string;
  dimensions: { width: number; height: number };
  data: HeatmapDataPoint[];
  colorScale: ColorScale;
  legend: LegendItem[];
  insights: string[];
}

export interface HeatmapDataPoint {
  x: number;
  y: number;
  role: string;
  path: string;
  value: number;
  color: string;
  tooltip: string;
}

export interface ColorScale {
  min: string;
  mid: string;
  max: string;
  steps: number;
}

export interface LegendItem {
  color: string;
  label: string;
  value: string;
}

export interface SecurityFindings {
  summary: SecuritySummary;
  criticalIssues: SecurityIssue[];
  mediumIssues: SecurityIssue[];
  lowIssues: SecurityIssue[];
  recommendations: SecurityRecommendation[];
  timeline: SecurityTimelineItem[];
}

export interface SecuritySummary {
  totalIssues: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  riskScore: number;
  complianceGrade: string;
}

export interface SecurityIssue {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'access_control' | 'role_management' | 'data_security' | 'boundaries';
  affectedRoles: string[];
  affectedPaths: string[];
  impact: string;
  likelihood: 'low' | 'medium' | 'high';
  recommendation: string;
  effort: 'low' | 'medium' | 'high';
  priority: number;
}

export interface SecurityRecommendation {
  id: string;
  title: string;
  description: string;
  category: 'immediate' | 'short_term' | 'long_term';
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  implementation: string[];
  validation: string[];
  timeline: string;
}

export interface SecurityTimelineItem {
  timestamp: string;
  event: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  details: string;
}

export interface RecommendedAction {
  id: string;
  title: string;
  category: 'security' | 'performance' | 'compliance' | 'architecture';
  priority: 'low' | 'medium' | 'high' | 'critical';
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  description: string;
  implementation: ActionStep[];
  validation: ValidationStep[];
  estimatedTime: string;
  businessValue: string;
}

export interface ActionStep {
  step: number;
  title: string;
  description: string;
  responsible: string;
  dependencies: string[];
  deliverable: string;
}

export interface ValidationStep {
  step: number;
  description: string;
  method: string;
  criteria: string;
  expected: string;
}

export interface InteractiveElement {
  type: 'chart' | 'table' | 'heatmap' | 'graph' | 'dashboard';
  id: string;
  title: string;
  data: any;
  config: InteractiveConfig;
}

export interface InteractiveConfig {
  width?: number;
  height?: number;
  responsive?: boolean;
  interactive?: boolean;
  exportable?: boolean;
  filterEnabled?: boolean;
  sortEnabled?: boolean;
}

export interface ExportOption {
  format: 'pdf' | 'html' | 'json' | 'csv' | 'excel' | 'png';
  title: string;
  description: string;
  available: boolean;
  size?: string;
}

export interface NavigationMap {
  applicationArchitecture: ArchitectureMap;
  roleAccessVisualization: AccessVisualization;
  permissionFlowDiagram: FlowDiagram;
  securityBoundaryMap: SecurityMap;
}

export interface ArchitectureMap {
  nodes: ArchitectureNode[];
  connections: ArchitectureConnection[];
  layers: ArchitectureLayer[];
  metadata: ArchitectureMetadata;
}

export interface ArchitectureNode {
  id: string;
  type: 'route' | 'component' | 'service' | 'role';
  label: string;
  position: { x: number; y: number };
  properties: Record<string, any>;
}

export interface ArchitectureConnection {
  from: string;
  to: string;
  type: 'access' | 'dependency' | 'hierarchy' | 'data_flow';
  strength: number;
  bidirectional: boolean;
}

export interface ArchitectureLayer {
  id: string;
  name: string;
  type: 'presentation' | 'business' | 'data' | 'security';
  nodes: string[];
  color: string;
}

export interface ArchitectureMetadata {
  totalNodes: number;
  totalConnections: number;
  complexity: number;
  modularity: number;
  maintainability: string;
}

export interface AccessVisualization {
  roleNodes: RoleNode[];
  pathNodes: PathNode[];
  accessEdges: AccessEdge[];
  clusters: AccessCluster[];
}

export interface RoleNode {
  id: string;
  name: string;
  level: number;
  accessCount: number;
  position: { x: number; y: number };
  color: string;
}

export interface PathNode {
  id: string;
  path: string;
  roleCount: number;
  sensitivity: 'low' | 'medium' | 'high';
  position: { x: number; y: number };
  color: string;
}

export interface AccessEdge {
  from: string;
  to: string;
  accessible: boolean;
  responseTime: number;
  errorCount: number;
  color: string;
  width: number;
}

export interface AccessCluster {
  id: string;
  type: 'role_group' | 'path_group' | 'security_boundary';
  members: string[];
  centroid: { x: number; y: number };
  color: string;
}

export interface FlowDiagram {
  steps: FlowStep[];
  decisions: FlowDecision[];
  connections: FlowConnection[];
  swimlanes: FlowSwimlane[];
}

export interface FlowStep {
  id: string;
  type: 'start' | 'process' | 'decision' | 'end';
  label: string;
  position: { x: number; y: number };
  role?: string;
}

export interface FlowDecision {
  id: string;
  question: string;
  position: { x: number; y: number };
  outcomes: FlowOutcome[];
}

export interface FlowOutcome {
  condition: string;
  nextStep: string;
  probability: number;
}

export interface FlowConnection {
  from: string;
  to: string;
  label?: string;
  condition?: string;
}

export interface FlowSwimlane {
  id: string;
  role: string;
  steps: string[];
  color: string;
}

export interface SecurityMap {
  boundaries: SecurityBoundary[];
  zones: SecurityZone[];
  threats: ThreatVector[];
  controls: SecurityControl[];
}

export interface SecurityBoundary {
  id: string;
  name: string;
  type: 'role' | 'data' | 'network' | 'application';
  strength: 'weak' | 'medium' | 'strong';
  perimeter: { x: number; y: number }[];
  color: string;
}

export interface SecurityZone {
  id: string;
  name: string;
  level: 'public' | 'internal' | 'confidential' | 'restricted';
  roles: string[];
  paths: string[];
  color: string;
}

export interface ThreatVector {
  id: string;
  name: string;
  type: 'privilege_escalation' | 'unauthorized_access' | 'data_breach' | 'boundary_crossing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  impact: number;
  mitigated: boolean;
}

export interface SecurityControl {
  id: string;
  name: string;
  type: 'preventive' | 'detective' | 'corrective' | 'compensating';
  effectiveness: number;
  coverage: string[];
  status: 'active' | 'inactive' | 'partial';
}

/**
 * AdvancedReportGenerator - Enterprise-grade reporting and visualization engine
 * Implements interactive HTML dashboards, multi-format exports, and executive summaries
 */
export class AdvancedReportGenerator {
  private navigationMap: NavigationMap;
  private intelligenceReport: IntelligenceReport;
  private outputDirectory: string;

  constructor(navigationMap: NavigationMap, intelligenceReport: IntelligenceReport, outputDir = 'results') {
    this.navigationMap = navigationMap;
    this.intelligenceReport = intelligenceReport;
    this.outputDirectory = outputDir;
  }

  /**
   * Generate comprehensive advanced report with all visualization components
   */
  async generateAdvancedReport(): Promise<AdvancedReport> {
    console.log('📊 Generating advanced reporting suite...');
    
    const startTime = Date.now();
    
    const executiveSummary = await this.generateExecutiveSummary();
    const roleComparisonMatrix = await this.generateRoleComparisonMatrix();
    const permissionHeatmap = await this.generatePermissionHeatmap();
    const securityFindings = await this.generateSecurityFindings();
    const recommendedActions = await this.generateRecommendedActions();
    const interactiveElements = await this.generateInteractiveElements();
    const exportOptions = await this.generateExportOptions();

    const report: AdvancedReport = {
      executiveSummary,
      roleComparisonMatrix,
      permissionHeatmap,
      securityFindings,
      recommendedActions,
      interactiveElements,
      exportOptions
    };

    const generationTime = Date.now() - startTime;
    console.log(`📊 Advanced report generated in ${generationTime}ms`);

    // Save the comprehensive report
    await this.saveAdvancedReport(report);
    
    // Generate interactive HTML dashboard
    await this.generateInteractiveHTMLDashboard(report);
    
    // Generate executive PDF summary
    await this.generateExecutivePDF(report);

    return report;
  }

  /**
   * Generate Executive Summary for C-level stakeholders
   */
  private async generateExecutiveSummary(): Promise<ExecutiveSummary> {
    const overallScore = this.intelligenceReport.executiveSummary.overallScore;
    const securityPosture = this.intelligenceReport.executiveSummary.securityPosture;
    
    const keyMetrics: KeyMetric[] = [
      {
        name: 'Security Posture',
        value: securityPosture.toUpperCase(),
        trend: 'stable',
        severity: this.getPostureSeverity(securityPosture),
        description: 'Overall security assessment based on role hierarchy and access patterns'
      },
      {
        name: 'Compliance Score',
        value: `${this.intelligenceReport.permissionPatterns.roleHierarchy.complianceScore.toFixed(1)}%`,
        trend: 'up',
        severity: this.getComplianceSeverity(this.intelligenceReport.permissionPatterns.roleHierarchy.complianceScore),
        description: 'Role hierarchy compliance percentage'
      },
      {
        name: 'Security Risks',
        value: this.intelligenceReport.permissionPatterns.securityRisks.length,
        trend: 'stable',
        severity: this.getRiskSeverity(this.intelligenceReport.permissionPatterns.securityRisks.length),
        description: 'Total security risks identified across all roles'
      },
      {
        name: 'Roles Analyzed',
        value: Object.keys(this.navigationMap).length,
        trend: 'new',
        severity: 'low',
        description: 'Number of user roles comprehensively analyzed'
      }
    ];

    const criticalFindings = this.intelligenceReport.permissionPatterns.securityRisks
      .filter(risk => risk.severity === 'critical' || risk.severity === 'high')
      .map(risk => risk.description)
      .slice(0, 3);

    const quickWins = this.intelligenceReport.recommendations
      .filter(rec => rec.priority === 'high' && rec.effort === 'low')
      .map(rec => rec.title)
      .slice(0, 3);

    const complianceStatus: ComplianceStatus = {
      overall: this.determineOverallCompliance(),
      roleHierarchy: this.intelligenceReport.permissionPatterns.roleHierarchy.complianceScore,
      accessControl: this.calculateAccessControlScore(),
      securityBoundaries: this.calculateBoundaryScore(),
      details: this.generateComplianceDetails()
    };

    return {
      title: 'Multi-Tenant ERP Security Analysis - Executive Summary',
      generatedAt: new Date().toISOString(),
      overallSecurityScore: overallScore,
      keyMetrics,
      criticalFindings,
      quickWins,
      investmentRecommendations: this.intelligenceReport.executiveSummary.investmentPriorities,
      complianceStatus
    };
  }

  /**
   * Generate Role Comparison Matrix with heat map visualization
   */
  private async generateRoleComparisonMatrix(): Promise<ComparisonMatrix> {
    const roles = Object.keys(this.navigationMap);
    const allPaths = new Set<string>();
    
    // Collect all unique paths
    Object.values(this.navigationMap).forEach(discovery => {
      discovery.discoveredPaths.forEach(p => allPaths.add(p.path));
    });
    
    const paths = Array.from(allPaths).sort();
    const accessMatrix: boolean[][] = [];
    const heatmapData: HeatmapCell[][] = [];
    const anomalies: MatrixAnomaly[] = [];

    // Build access matrix and heatmap data
    roles.forEach((role, roleIndex) => {
      accessMatrix[roleIndex] = [];
      heatmapData[roleIndex] = [];
      
      paths.forEach((path, pathIndex) => {
        const pathResult = this.navigationMap[role]?.discoveredPaths.find(p => p.path === path);
        const accessible = pathResult ? pathResult.accessible : false;
        
        accessMatrix[roleIndex][pathIndex] = accessible;
        
        const responseTime = pathResult?.responseTime || 0;
        const errorCount = pathResult?.error ? 1 : 0;
        const riskLevel = this.calculatePathRiskLevel(role, path, accessible, responseTime);
        
        heatmapData[roleIndex][pathIndex] = {
          role,
          path,
          accessible,
          responseTime,
          errorCount,
          riskLevel,
          color: this.getRiskColor(riskLevel, accessible)
        };

        // Detect anomalies
        const expected = this.isExpectedAccess(role, path);
        if (expected !== accessible) {
          anomalies.push({
            role,
            path,
            expected,
            actual: accessible,
            riskLevel: accessible && !expected ? 'high' : 'medium',
            description: accessible && !expected 
              ? `${role} has unexpected access to ${path}`
              : `${role} lacks expected access to ${path}`
          });
        }
      });
    });

    return {
      roles,
      paths,
      accessMatrix,
      heatmapData,
      anomalies
    };
  }

  /**
   * Generate Permission Heatmap with interactive visualization data
   */
  private async generatePermissionHeatmap(): Promise<PermissionHeatmap> {
    const roles = Object.keys(this.navigationMap);
    const allPaths = new Set<string>();
    
    Object.values(this.navigationMap).forEach(discovery => {
      discovery.discoveredPaths.forEach(p => allPaths.add(p.path));
    });
    
    const paths = Array.from(allPaths);
    const data: HeatmapDataPoint[] = [];
    
    roles.forEach((role, x) => {
      paths.forEach((path, y) => {
        const pathResult = this.navigationMap[role]?.discoveredPaths.find(p => p.path === path);
        const accessible = pathResult ? pathResult.accessible : false;
        const responseTime = pathResult?.responseTime || 0;
        
        // Calculate heatmap value (0-100 based on accessibility and performance)
        let value = 0;
        if (accessible) {
          value = responseTime > 0 ? Math.max(10, 100 - (responseTime / 50)) : 50;
        }
        
        data.push({
          x,
          y,
          role,
          path,
          value,
          color: this.getHeatmapColor(value),
          tooltip: `${role} → ${path}: ${accessible ? 'Accessible' : 'Forbidden'}${
            responseTime ? ` (${responseTime}ms)` : ''
          }`
        });
      });
    });

    const insights = this.generateHeatmapInsights(data);

    return {
      title: 'Role-Path Access Permission Heatmap',
      dimensions: { width: roles.length, height: paths.length },
      data,
      colorScale: {
        min: '#ff4444', // Red for no access
        mid: '#ffaa00', // Orange for slow access
        max: '#00aa00', // Green for fast access
        steps: 10
      },
      legend: [
        { color: '#ff4444', label: 'No Access', value: '0' },
        { color: '#ffaa00', label: 'Slow Access', value: '1-50' },
        { color: '#00aa00', label: 'Fast Access', value: '51-100' }
      ],
      insights
    };
  }

  /**
   * Generate comprehensive security findings report
   */
  private async generateSecurityFindings(): Promise<SecurityFindings> {
    const risks = this.intelligenceReport.permissionPatterns.securityRisks;
    const criticalIssues: SecurityIssue[] = [];
    const mediumIssues: SecurityIssue[] = [];
    const lowIssues: SecurityIssue[] = [];

    // Categorize security issues
    risks.forEach((risk, index) => {
      const issue: SecurityIssue = {
        id: `SEC-${String(index + 1).padStart(3, '0')}`,
        title: this.formatRiskTitle(risk.type),
        description: risk.description,
        severity: risk.severity,
        category: this.categorizeRiskType(risk.type),
        affectedRoles: risk.affectedRoles,
        affectedPaths: risk.paths,
        impact: this.calculateImpactDescription(risk),
        likelihood: this.calculateLikelihood(risk),
        recommendation: risk.mitigation,
        effort: this.estimateEffort(risk),
        priority: this.calculatePriority(risk)
      };

      if (risk.severity === 'critical' || risk.severity === 'high') {
        criticalIssues.push(issue);
      } else if (risk.severity === 'medium') {
        mediumIssues.push(issue);
      } else {
        lowIssues.push(issue);
      }
    });

    const summary: SecuritySummary = {
      totalIssues: risks.length,
      criticalCount: criticalIssues.length,
      highCount: risks.filter(r => r.severity === 'high').length,
      mediumCount: mediumIssues.length,
      lowCount: lowIssues.length,
      riskScore: this.calculateRiskScore(risks),
      complianceGrade: this.calculateComplianceGrade()
    };

    const recommendations = await this.generateSecurityRecommendations(criticalIssues);
    const timeline = this.generateSecurityTimeline();

    return {
      summary,
      criticalIssues,
      mediumIssues,
      lowIssues,
      recommendations,
      timeline
    };
  }

  /**
   * Generate actionable recommendations with implementation details
   */
  private async generateRecommendedActions(): Promise<RecommendedAction[]> {
    const actions: RecommendedAction[] = [];

    this.intelligenceReport.recommendations.forEach((rec, index) => {
      const action: RecommendedAction = {
        id: `ACT-${String(index + 1).padStart(3, '0')}`,
        title: rec.title,
        category: rec.category,
        priority: rec.priority,
        effort: rec.effort,
        impact: rec.impact,
        description: rec.description,
        implementation: this.generateImplementationSteps(rec),
        validation: this.generateValidationSteps(rec),
        estimatedTime: this.estimateImplementationTime(rec),
        businessValue: this.calculateBusinessValue(rec)
      };

      actions.push(action);
    });

    return actions.sort((a, b) => this.compareActionPriority(a, b));
  }

  /**
   * Generate interactive visualization elements
   */
  private async generateInteractiveElements(): Promise<InteractiveElement[]> {
    return [
      {
        type: 'heatmap',
        id: 'permission-heatmap',
        title: 'Permission Access Heatmap',
        data: await this.generatePermissionHeatmap(),
        config: { width: 800, height: 600, interactive: true, exportable: true }
      },
      {
        type: 'chart',
        id: 'role-comparison-chart',
        title: 'Role Access Comparison',
        data: this.generateRoleComparisonChartData(),
        config: { width: 600, height: 400, interactive: true, exportable: true }
      },
      {
        type: 'dashboard',
        id: 'security-dashboard',
        title: 'Security Metrics Dashboard',
        data: this.generateSecurityDashboardData(),
        config: { responsive: true, interactive: true, filterEnabled: true }
      },
      {
        type: 'table',
        id: 'findings-table',
        title: 'Security Findings Table',
        data: this.generateFindingsTableData(),
        config: { sortEnabled: true, filterEnabled: true, exportable: true }
      }
    ];
  }

  /**
   * Generate export options for different formats
   */
  private async generateExportOptions(): Promise<ExportOption[]> {
    return [
      {
        format: 'pdf',
        title: 'Executive PDF Report',
        description: 'Comprehensive PDF report for executive stakeholders',
        available: true,
        size: '~2MB'
      },
      {
        format: 'html',
        title: 'Interactive HTML Dashboard',
        description: 'Interactive web dashboard with drill-down capabilities',
        available: true,
        size: '~5MB'
      },
      {
        format: 'json',
        title: 'Raw Data Export',
        description: 'Complete data export in JSON format for further analysis',
        available: true,
        size: '~500KB'
      },
      {
        format: 'csv',
        title: 'Security Findings CSV',
        description: 'Security findings and recommendations in CSV format',
        available: true,
        size: '~100KB'
      },
      {
        format: 'excel',
        title: 'Detailed Excel Report',
        description: 'Multi-sheet Excel workbook with detailed analysis',
        available: true,
        size: '~1MB'
      }
    ];
  }

  /**
   * Save the advanced report to file system
   */
  private async saveAdvancedReport(report: AdvancedReport): Promise<void> {
    await fs.mkdir(this.outputDirectory, { recursive: true });
    
    const reportPath = path.join(this.outputDirectory, 'advanced-intelligence-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`💾 Advanced report saved to ${reportPath}`);
  }

  /**
   * Generate interactive HTML dashboard
   */
  private async generateInteractiveHTMLDashboard(report: AdvancedReport): Promise<void> {
    const htmlContent = this.generateHTMLDashboardTemplate(report);
    const dashboardPath = path.join(this.outputDirectory, 'security-dashboard.html');
    
    await fs.writeFile(dashboardPath, htmlContent);
    console.log(`🌐 Interactive HTML dashboard saved to ${dashboardPath}`);
  }

  /**
   * Generate executive PDF summary
   */
  private async generateExecutivePDF(report: AdvancedReport): Promise<void> {
    const pdfData = {
      title: report.executiveSummary.title,
      summary: report.executiveSummary,
      keyFindings: report.securityFindings.summary,
      recommendations: report.recommendedActions.slice(0, 5),
      generatedAt: new Date().toISOString()
    };

    const pdfPath = path.join(this.outputDirectory, 'executive-summary.json');
    await fs.writeFile(pdfPath, JSON.stringify(pdfData, null, 2));
    console.log(`📄 Executive summary data saved to ${pdfPath}`);
  }

  // Helper methods for data processing and formatting
  private getPostureSeverity(posture: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (posture) {
      case 'excellent': return 'low';
      case 'good': return 'medium';
      case 'needs_improvement': return 'high';
      case 'critical': return 'critical';
      default: return 'medium';
    }
  }

  private getComplianceSeverity(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 90) return 'low';
    if (score >= 70) return 'medium';
    if (score >= 50) return 'high';
    return 'critical';
  }

  private getRiskSeverity(riskCount: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskCount === 0) return 'low';
    if (riskCount <= 2) return 'medium';
    if (riskCount <= 5) return 'high';
    return 'critical';
  }

  private determineOverallCompliance(): 'compliant' | 'non_compliant' | 'partial' {
    const score = this.intelligenceReport.permissionPatterns.roleHierarchy.complianceScore;
    if (score >= 90) return 'compliant';
    if (score >= 70) return 'partial';
    return 'non_compliant';
  }

  private calculateAccessControlScore(): number {
    // Calculate based on proper role boundaries
    const roles = Object.keys(this.navigationMap);
    let properBoundaries = 0;
    let totalBoundaries = 0;

    roles.forEach(role => {
      const paths = this.navigationMap[role]?.discoveredPaths || [];
      paths.forEach(p => {
        totalBoundaries++;
        if (this.isExpectedAccess(role, p.path) === p.accessible) {
          properBoundaries++;
        }
      });
    });

    return totalBoundaries > 0 ? (properBoundaries / totalBoundaries) * 100 : 100;
  }

  private calculateBoundaryScore(): number {
    // Calculate based on role separation
    const overlaps = this.calculateRoleOverlaps();
    return Math.max(0, 100 - (overlaps * 10));
  }

  private generateComplianceDetails(): string[] {
    return [
      `Role hierarchy compliance: ${this.intelligenceReport.permissionPatterns.roleHierarchy.complianceScore.toFixed(1)}%`,
      `Security risks identified: ${this.intelligenceReport.permissionPatterns.securityRisks.length}`,
      `Permission gaps found: ${this.intelligenceReport.permissionPatterns.permissionGaps.length}`,
      `Roles analyzed: ${Object.keys(this.navigationMap).length}`
    ];
  }

  private calculatePathRiskLevel(role: string, path: string, accessible: boolean, responseTime: number): 'low' | 'medium' | 'high' {
    if (!accessible) return 'low';
    if (path.includes('/admin') && !['super_admin', 'tenant_admin'].includes(role)) return 'high';
    if (responseTime > 3000) return 'medium';
    return 'low';
  }

  private getRiskColor(riskLevel: 'low' | 'medium' | 'high', accessible: boolean): string {
    if (!accessible) return '#cccccc'; // Gray for no access
    switch (riskLevel) {
      case 'high': return '#ff4444';
      case 'medium': return '#ffaa00';
      case 'low': return '#00aa00';
      default: return '#cccccc';
    }
  }

  private isExpectedAccess(role: string, path: string): boolean {
    // Define expected access patterns based on role hierarchy
    const adminPaths = ['/admin', '/admin/users', '/admin/settings', '/admin/roles'];
    const publicPaths = ['/', '/dashboard'];
    
    if (publicPaths.includes(path)) return true;
    if (adminPaths.includes(path)) return ['super_admin', 'tenant_admin'].includes(role);
    if (path === '/admin/settings') return ['super_admin', 'tenant_admin', 'module_admin'].includes(role);
    if (path.startsWith('/wms')) return role === 'wms_user';
    if (path.startsWith('/accounting')) return role === 'accounting_user';
    
    return false;
  }

  private getHeatmapColor(value: number): string {
    if (value === 0) return '#ff4444'; // Red for no access
    if (value < 30) return '#ff8844'; // Orange-red for poor performance
    if (value < 60) return '#ffaa00'; // Orange for medium performance
    if (value < 80) return '#aadd00'; // Yellow-green for good performance
    return '#00aa00'; // Green for excellent performance
  }

  private generateHeatmapInsights(data: HeatmapDataPoint[]): string[] {
    const insights: string[] = [];
    
    const totalPoints = data.length;
    const accessiblePoints = data.filter(d => d.value > 0).length;
    const highPerformancePoints = data.filter(d => d.value > 70).length;
    
    insights.push(`${accessiblePoints}/${totalPoints} role-path combinations are accessible`);
    insights.push(`${highPerformancePoints} combinations show high performance (>70)`);
    
    if (accessiblePoints / totalPoints < 0.3) {
      insights.push('Low access coverage may indicate overly restrictive permissions');
    }
    
    if (highPerformancePoints / accessiblePoints > 0.8) {
      insights.push('Excellent performance across accessible paths');
    }

    return insights;
  }

  private formatRiskTitle(riskType: string): string {
    return riskType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private categorizeRiskType(riskType: string): 'access_control' | 'role_management' | 'data_security' | 'boundaries' {
    switch (riskType) {
      case 'privilege_escalation':
      case 'unauthorized_access':
        return 'access_control';
      case 'weak_boundaries':
        return 'boundaries';
      case 'data_exposure':
        return 'data_security';
      default:
        return 'role_management';
    }
  }

  private calculateImpactDescription(risk: any): string {
    const roleCount = risk.affectedRoles.length;
    const pathCount = risk.paths.length;
    
    return `Affects ${roleCount} roles and ${pathCount} paths. ${
      risk.severity === 'critical' ? 'Immediate attention required.' :
      risk.severity === 'high' ? 'High priority remediation needed.' :
      'Monitor and address in next sprint.'
    }`;
  }

  private calculateLikelihood(risk: any): 'low' | 'medium' | 'high' {
    if (risk.affectedRoles.length > 3) return 'high';
    if (risk.affectedRoles.length > 1) return 'medium';
    return 'low';
  }

  private estimateEffort(risk: any): 'low' | 'medium' | 'high' {
    const pathCount = risk.paths.length;
    const roleCount = risk.affectedRoles.length;
    
    if (pathCount > 5 || roleCount > 4) return 'high';
    if (pathCount > 2 || roleCount > 2) return 'medium';
    return 'low';
  }

  private calculatePriority(risk: any): number {
    const severityScore = { critical: 4, high: 3, medium: 2, low: 1 }[risk.severity];
    const impactScore = risk.affectedRoles.length + risk.paths.length;
    return severityScore * 10 + impactScore;
  }

  private calculateRiskScore(risks: any[]): number {
    const weights = { critical: 10, high: 5, medium: 2, low: 1 };
    const totalScore = risks.reduce((sum, risk) => sum + weights[risk.severity], 0);
    const maxPossibleScore = risks.length * 10; // If all were critical
    return maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
  }

  private calculateComplianceGrade(): string {
    const score = this.intelligenceReport.permissionPatterns.roleHierarchy.complianceScore;
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    if (score >= 65) return 'D+';
    if (score >= 60) return 'D';
    return 'F';
  }

  private async generateSecurityRecommendations(criticalIssues: SecurityIssue[]): Promise<SecurityRecommendation[]> {
    const recommendations: SecurityRecommendation[] = [];
    
    criticalIssues.forEach((issue, index) => {
      recommendations.push({
        id: `REC-${String(index + 1).padStart(3, '0')}`,
        title: `Address ${issue.title}`,
        description: issue.recommendation,
        category: issue.priority > 8 ? 'immediate' : issue.priority > 5 ? 'short_term' : 'long_term',
        impact: issue.severity === 'critical' ? 'high' : issue.severity === 'high' ? 'medium' : 'low',
        effort: issue.effort,
        implementation: [`Review ${issue.category} configuration`, 'Update role permissions', 'Test access controls'],
        validation: ['Verify access patterns', 'Run security audit', 'Monitor for 30 days'],
        timeline: issue.priority > 8 ? '1-2 weeks' : issue.priority > 5 ? '4-6 weeks' : '8-12 weeks'
      });
    });

    return recommendations;
  }

  private generateSecurityTimeline(): SecurityTimelineItem[] {
    return [
      {
        timestamp: new Date().toISOString(),
        event: 'Security analysis completed',
        severity: 'info',
        details: `Analyzed ${Object.keys(this.navigationMap).length} roles and identified ${this.intelligenceReport.permissionPatterns.securityRisks.length} security risks`
      },
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        event: 'Permission pattern analysis started',
        severity: 'info',
        details: 'Initiated comprehensive role-based access control analysis'
      }
    ];
  }

  private generateImplementationSteps(rec: any): ActionStep[] {
    return [
      {
        step: 1,
        title: 'Assessment',
        description: `Assess current ${rec.category} implementation`,
        responsible: 'Security Team',
        dependencies: [],
        deliverable: 'Assessment report'
      },
      {
        step: 2,
        title: 'Planning',
        description: `Plan ${rec.title.toLowerCase()} implementation`,
        responsible: 'Development Team',
        dependencies: ['Assessment'],
        deliverable: 'Implementation plan'
      },
      {
        step: 3,
        title: 'Implementation',
        description: rec.description,
        responsible: 'Development Team',
        dependencies: ['Planning'],
        deliverable: 'Code changes and tests'
      },
      {
        step: 4,
        title: 'Validation',
        description: 'Validate implementation meets requirements',
        responsible: 'QA Team',
        dependencies: ['Implementation'],
        deliverable: 'Test results and sign-off'
      }
    ];
  }

  private generateValidationSteps(rec: any): ValidationStep[] {
    return [
      {
        step: 1,
        description: 'Functional testing of implemented changes',
        method: 'Automated testing suite',
        criteria: 'All tests pass',
        expected: '100% test success rate'
      },
      {
        step: 2,
        description: 'Security validation',
        method: 'Security audit and penetration testing',
        criteria: 'No new vulnerabilities introduced',
        expected: 'Clean security scan results'
      },
      {
        step: 3,
        description: 'Performance impact assessment',
        method: 'Load testing and monitoring',
        criteria: 'No significant performance degradation',
        expected: '<5% performance impact'
      }
    ];
  }

  private estimateImplementationTime(rec: any): string {
    const effortMap = {
      low: { high: '2-3 weeks', medium: '1-2 weeks', low: '3-5 days' },
      medium: { high: '6-8 weeks', medium: '4-6 weeks', low: '2-3 weeks' },
      high: { high: '12-16 weeks', medium: '8-12 weeks', low: '6-8 weeks' }
    };

    return effortMap[rec.effort]?.[rec.impact] || '4-6 weeks';
  }

  private calculateBusinessValue(rec: any): string {
    const impacts = {
      high: 'Significant security improvement, reduced compliance risk',
      medium: 'Moderate security enhancement, improved user experience',
      low: 'Minor improvements, technical debt reduction'
    };

    return impacts[rec.impact] || 'Moderate improvement in system security';
  }

  private compareActionPriority(a: RecommendedAction, b: RecommendedAction): number {
    const priorityScore = { critical: 4, high: 3, medium: 2, low: 1 };
    const impactScore = { high: 3, medium: 2, low: 1 };
    
    const aScore = priorityScore[a.priority] * 10 + impactScore[a.impact];
    const bScore = priorityScore[b.priority] * 10 + impactScore[b.impact];
    
    return bScore - aScore; // Descending order
  }

  private generateRoleComparisonChartData(): any {
    const roles = Object.keys(this.navigationMap);
    const data = roles.map(role => ({
      role,
      accessiblePaths: this.navigationMap[role]?.discoveredPaths.filter(p => p.accessible).length || 0,
      totalPaths: this.navigationMap[role]?.discoveredPaths.length || 0,
      avgResponseTime: this.navigationMap[role]?.coverage.avgResponseTime || 0
    }));

    return {
      type: 'bar',
      data: {
        labels: roles,
        datasets: [
          {
            label: 'Accessible Paths',
            data: data.map(d => d.accessiblePaths),
            backgroundColor: '#4ade80'
          },
          {
            label: 'Total Paths',
            data: data.map(d => d.totalPaths),
            backgroundColor: '#94a3b8'
          }
        ]
      }
    };
  }

  private generateSecurityDashboardData(): any {
    return {
      metrics: {
        totalRisks: this.intelligenceReport.permissionPatterns.securityRisks.length,
        criticalRisks: this.intelligenceReport.permissionPatterns.securityRisks.filter(r => r.severity === 'critical').length,
        complianceScore: this.intelligenceReport.permissionPatterns.roleHierarchy.complianceScore,
        rolesAnalyzed: Object.keys(this.navigationMap).length
      },
      charts: [
        {
          type: 'pie',
          title: 'Risk Distribution',
          data: this.getRiskDistributionData()
        },
        {
          type: 'line',
          title: 'Performance Trends',
          data: this.getPerformanceTrendData()
        }
      ]
    };
  }

  private generateFindingsTableData(): any {
    return {
      columns: ['ID', 'Title', 'Severity', 'Affected Roles', 'Recommendation', 'Priority'],
      rows: this.intelligenceReport.permissionPatterns.securityRisks.map((risk, index) => [
        `SEC-${String(index + 1).padStart(3, '0')}`,
        this.formatRiskTitle(risk.type),
        risk.severity.toUpperCase(),
        risk.affectedRoles.join(', '),
        risk.mitigation.substring(0, 50) + '...',
        this.calculatePriority(risk)
      ])
    };
  }

  private calculateRoleOverlaps(): number {
    const roles = Object.keys(this.navigationMap);
    let totalOverlaps = 0;
    let comparisons = 0;

    for (let i = 0; i < roles.length; i++) {
      for (let j = i + 1; j < roles.length; j++) {
        const role1Paths = new Set(
          this.navigationMap[roles[i]]?.discoveredPaths
            .filter(p => p.accessible)
            .map(p => p.path) || []
        );
        const role2Paths = new Set(
          this.navigationMap[roles[j]]?.discoveredPaths
            .filter(p => p.accessible)
            .map(p => p.path) || []
        );

        const intersection = new Set([...role1Paths].filter(x => role2Paths.has(x)));
        const union = new Set([...role1Paths, ...role2Paths]);
        
        if (union.size > 0) {
          totalOverlaps += intersection.size / union.size;
          comparisons++;
        }
      }
    }

    return comparisons > 0 ? totalOverlaps / comparisons : 0;
  }

  private getRiskDistributionData(): any {
    const risks = this.intelligenceReport.permissionPatterns.securityRisks;
    const distribution = { critical: 0, high: 0, medium: 0, low: 0 };
    
    risks.forEach(risk => {
      distribution[risk.severity]++;
    });

    return {
      labels: ['Critical', 'High', 'Medium', 'Low'],
      data: [distribution.critical, distribution.high, distribution.medium, distribution.low],
      colors: ['#dc2626', '#ea580c', '#d97706', '#65a30d']
    };
  }

  private getPerformanceTrendData(): any {
    const roles = Object.keys(this.navigationMap);
    return {
      labels: roles,
      data: roles.map(role => this.navigationMap[role]?.coverage.avgResponseTime || 0),
      borderColor: '#3b82f6',
      backgroundColor: '#3b82f620'
    };
  }

  private generateHTMLDashboardTemplate(report: AdvancedReport): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.executiveSummary.title}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .dashboard { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .metric-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-value { font-size: 2em; font-weight: bold; color: #2563eb; }
        .findings-section { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .risk-high { color: #dc2626; }
        .risk-medium { color: #ea580c; }
        .risk-low { color: #65a30d; }
        .heatmap { display: grid; gap: 2px; margin: 20px 0; }
        .heatmap-cell { padding: 5px; text-align: center; font-size: 12px; border-radius: 2px; }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>${report.executiveSummary.title}</h1>
            <p>Generated: ${new Date(report.executiveSummary.generatedAt).toLocaleString()}</p>
            <p>Overall Security Score: <strong class="${this.getScoreClass(report.executiveSummary.overallSecurityScore)}">${report.executiveSummary.overallSecurityScore}/100</strong></p>
        </div>
        
        <div class="metrics-grid">
            ${report.executiveSummary.keyMetrics.map(metric => `
                <div class="metric-card">
                    <h3>${metric.name}</h3>
                    <div class="metric-value ${this.getSeverityClass(metric.severity)}">${metric.value}</div>
                    <p>${metric.description}</p>
                </div>
            `).join('')}
        </div>

        <div class="findings-section">
            <h2>Security Findings Summary</h2>
            <div class="metrics-grid">
                <div class="metric-card">
                    <h3>Critical Issues</h3>
                    <div class="metric-value risk-high">${report.securityFindings.criticalIssues.length}</div>
                </div>
                <div class="metric-card">
                    <h3>Medium Issues</h3>
                    <div class="metric-value risk-medium">${report.securityFindings.mediumIssues.length}</div>
                </div>
                <div class="metric-card">
                    <h3>Low Issues</h3>
                    <div class="metric-value risk-low">${report.securityFindings.lowIssues.length}</div>
                </div>
                <div class="metric-card">
                    <h3>Compliance Grade</h3>
                    <div class="metric-value">${report.securityFindings.summary.complianceGrade}</div>
                </div>
            </div>
        </div>

        <div class="findings-section">
            <h2>Top Recommendations</h2>
            ${report.recommendedActions.slice(0, 5).map(action => `
                <div style="border-left: 4px solid ${this.getPriorityColor(action.priority)}; padding-left: 15px; margin-bottom: 15px;">
                    <h4>${action.title}</h4>
                    <p><strong>Priority:</strong> ${action.priority.toUpperCase()} | <strong>Impact:</strong> ${action.impact.toUpperCase()} | <strong>Effort:</strong> ${action.effort.toUpperCase()}</p>
                    <p>${action.description}</p>
                    <p><strong>Estimated Time:</strong> ${action.estimatedTime}</p>
                </div>
            `).join('')}
        </div>

        <div class="findings-section">
            <h2>Quick Wins</h2>
            <ul>
                ${report.executiveSummary.quickWins.map(win => `<li>${win}</li>`).join('')}
            </ul>
        </div>
    </div>

    <script>
        console.log('Security Dashboard Loaded');
        console.log('Report Data:', ${JSON.stringify(report, null, 2)});
    </script>
</body>
</html>`;
  }

  private getScoreClass(score: number): string {
    if (score >= 80) return 'risk-low';
    if (score >= 60) return 'risk-medium';
    return 'risk-high';
  }

  private getSeverityClass(severity: string): string {
    return `risk-${severity}`;
  }

  private getPriorityColor(priority: string): string {
    const colors = {
      critical: '#dc2626',
      high: '#ea580c', 
      medium: '#d97706',
      low: '#65a30d'
    };
    return colors[priority] || '#6b7280';
  }
}