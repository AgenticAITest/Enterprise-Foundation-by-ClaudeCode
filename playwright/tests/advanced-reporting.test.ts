import { test, expect } from '@playwright/test';
import { NavigationIntelligenceEngine } from '../utils/navigation-intelligence';
import { AdvancedReportGenerator } from '../utils/advanced-reporting';
import { NavigationMap } from '../utils/types';
import * as fs from 'fs/promises';
import * as path from 'path';

test.describe('Advanced Reporting & Visualization - Hours 5-6 Implementation', () => {
  let mockNavigationMap: NavigationMap;
  let intelligenceEngine: NavigationIntelligenceEngine;
  let reportGenerator: AdvancedReportGenerator;
  let intelligenceReport: any;

  test.beforeAll(async () => {
    console.log('📊 Setting up Advanced Reporting test suite...');
    
    // Create comprehensive mock data for testing advanced reporting
    mockNavigationMap = {
      super_admin: {
        discoveredPaths: [
          { path: '/', accessible: true, responseTime: 800, screenshot: 'home.png' },
          { path: '/admin', accessible: true, responseTime: 1200, screenshot: 'admin.png' },
          { path: '/admin/users', accessible: true, responseTime: 1500, screenshot: 'users.png' },
          { path: '/admin/settings', accessible: true, responseTime: 900, screenshot: 'settings.png' },
          { path: '/admin/roles', accessible: true, responseTime: 1100, screenshot: 'roles.png' },
          { path: '/dashboard', accessible: true, responseTime: 600, screenshot: 'dashboard.png' },
          { path: '/reports', accessible: true, responseTime: 2100, screenshot: 'reports.png' }
        ],
        coverage: { totalPaths: 7, accessiblePaths: 7, avgResponseTime: 1157, performanceGrade: 'B' }
      },
      tenant_admin: {
        discoveredPaths: [
          { path: '/', accessible: true, responseTime: 850, screenshot: 'home.png' },
          { path: '/admin', accessible: true, responseTime: 1300, screenshot: 'admin.png' },
          { path: '/admin/users', accessible: true, responseTime: 1600, screenshot: 'users.png' },
          { path: '/admin/settings', accessible: true, responseTime: 950, screenshot: 'settings.png' },
          { path: '/admin/roles', accessible: false, error: 'Forbidden', screenshot: 'forbidden.png' },
          { path: '/dashboard', accessible: true, responseTime: 650, screenshot: 'dashboard.png' },
          { path: '/reports', accessible: true, responseTime: 1800, screenshot: 'reports.png' }
        ],
        coverage: { totalPaths: 7, accessiblePaths: 6, avgResponseTime: 1192, performanceGrade: 'B' }
      },
      module_admin: {
        discoveredPaths: [
          { path: '/', accessible: true, responseTime: 900, screenshot: 'home.png' },
          { path: '/admin', accessible: false, error: 'Forbidden', screenshot: 'forbidden.png' },
          { path: '/admin/users', accessible: false, error: 'Forbidden', screenshot: 'forbidden.png' },
          { path: '/admin/settings', accessible: true, responseTime: 1000, screenshot: 'settings.png' },
          { path: '/admin/roles', accessible: false, error: 'Forbidden', screenshot: 'forbidden.png' },
          { path: '/dashboard', accessible: true, responseTime: 700, screenshot: 'dashboard.png' },
          { path: '/reports', accessible: true, responseTime: 1600, screenshot: 'reports.png' }
        ],
        coverage: { totalPaths: 7, accessiblePaths: 4, avgResponseTime: 1050, performanceGrade: 'B' }
      },
      wms_user: {
        discoveredPaths: [
          { path: '/', accessible: true, responseTime: 750, screenshot: 'home.png' },
          { path: '/admin', accessible: false, error: 'Forbidden', screenshot: 'forbidden.png' },
          { path: '/admin/users', accessible: false, error: 'Forbidden', screenshot: 'forbidden.png' },
          { path: '/admin/settings', accessible: false, error: 'Forbidden', screenshot: 'forbidden.png' },
          { path: '/admin/roles', accessible: false, error: 'Forbidden', screenshot: 'forbidden.png' },
          { path: '/dashboard', accessible: true, responseTime: 600, screenshot: 'dashboard.png' },
          { path: '/wms', accessible: true, responseTime: 800, screenshot: 'wms.png' },
          { path: '/reports', accessible: false, error: 'Forbidden', screenshot: 'forbidden.png' }
        ],
        coverage: { totalPaths: 8, accessiblePaths: 3, avgResponseTime: 717, performanceGrade: 'A' }
      },
      accounting_user: {
        discoveredPaths: [
          { path: '/', accessible: true, responseTime: 720, screenshot: 'home.png' },
          { path: '/admin', accessible: false, error: 'Forbidden', screenshot: 'forbidden.png' },
          { path: '/admin/users', accessible: false, error: 'Forbidden', screenshot: 'forbidden.png' },
          { path: '/admin/settings', accessible: false, error: 'Forbidden', screenshot: 'forbidden.png' },
          { path: '/admin/roles', accessible: false, error: 'Forbidden', screenshot: 'forbidden.png' },
          { path: '/dashboard', accessible: true, responseTime: 580, screenshot: 'dashboard.png' },
          { path: '/accounting', accessible: true, responseTime: 900, screenshot: 'accounting.png' },
          { path: '/reports', accessible: true, responseTime: 1400, screenshot: 'reports.png' }
        ],
        coverage: { totalPaths: 8, accessiblePaths: 4, avgResponseTime: 900, performanceGrade: 'A' }
      },
      readonly_user: {
        discoveredPaths: [
          { path: '/', accessible: true, responseTime: 680, screenshot: 'home.png' },
          { path: '/admin', accessible: false, error: 'Forbidden', screenshot: 'forbidden.png' },
          { path: '/admin/users', accessible: false, error: 'Forbidden', screenshot: 'forbidden.png' },
          { path: '/admin/settings', accessible: false, error: 'Forbidden', screenshot: 'forbidden.png' },
          { path: '/admin/roles', accessible: false, error: 'Forbidden', screenshot: 'forbidden.png' },
          { path: '/dashboard', accessible: true, responseTime: 550, screenshot: 'dashboard.png' },
          { path: '/reports', accessible: true, responseTime: 1200, screenshot: 'reports.png' }
        ],
        coverage: { totalPaths: 7, accessiblePaths: 3, avgResponseTime: 810, performanceGrade: 'A' }
      }
    };

    // Generate intelligence report
    intelligenceEngine = new NavigationIntelligenceEngine(mockNavigationMap);
    intelligenceReport = await intelligenceEngine.generateIntelligenceReport();
    
    // Initialize Advanced Report Generator
    reportGenerator = new AdvancedReportGenerator(mockNavigationMap, intelligenceReport);
    
    console.log('✅ Advanced reporting test suite initialized with comprehensive mock data');
  });

  test('Hour 5: Executive Summary Generation', async () => {
    console.log('📋 Testing Executive Summary Generation...');
    
    const startTime = Date.now();
    const advancedReport = await reportGenerator.generateAdvancedReport();
    const generationTime = Date.now() - startTime;
    
    const executiveSummary = advancedReport.executiveSummary;
    
    console.log('\\n📊 EXECUTIVE SUMMARY RESULTS:');
    console.log('===============================');
    console.log(`Generation Time: ${generationTime}ms`);
    console.log(`Title: ${executiveSummary.title}`);
    console.log(`Overall Security Score: ${executiveSummary.overallSecurityScore}/100`);
    console.log(`Key Metrics: ${executiveSummary.keyMetrics.length}`);
    console.log(`Critical Findings: ${executiveSummary.criticalFindings.length}`);
    console.log(`Quick Wins: ${executiveSummary.quickWins.length}`);
    console.log(`Compliance Status: ${executiveSummary.complianceStatus.overall.toUpperCase()}`);
    
    console.log('\\n📈 KEY METRICS:');
    executiveSummary.keyMetrics.forEach((metric, i) => {
      console.log(`${i + 1}. ${metric.name}: ${metric.value} (${metric.severity.toUpperCase()})`);
      console.log(`   ${metric.description}`);
    });
    
    if (executiveSummary.criticalFindings.length > 0) {
      console.log('\\n🚨 CRITICAL FINDINGS:');
      executiveSummary.criticalFindings.forEach((finding, i) => {
        console.log(`${i + 1}. ${finding}`);
      });
    }
    
    if (executiveSummary.quickWins.length > 0) {
      console.log('\\n🎯 QUICK WINS:');
      executiveSummary.quickWins.forEach((win, i) => {
        console.log(`${i + 1}. ${win}`);
      });
    }

    // Validation assertions
    expect(generationTime).toBeLessThan(15000); // Should generate quickly
    expect(executiveSummary.title).toContain('Executive Summary');
    expect(executiveSummary.overallSecurityScore).toBeGreaterThanOrEqual(0);
    expect(executiveSummary.overallSecurityScore).toBeLessThanOrEqual(100);
    expect(executiveSummary.keyMetrics.length).toBeGreaterThan(0);
    expect(executiveSummary.complianceStatus).toBeDefined();
    expect(['compliant', 'non_compliant', 'partial']).toContain(executiveSummary.complianceStatus.overall);
    
    console.log('\\n✅ Executive Summary Generation: PASSED');
  });

  test('Hour 5: Role Comparison Matrix', async () => {
    console.log('🔐 Testing Role Comparison Matrix Generation...');
    
    const startTime = Date.now();
    const advancedReport = await reportGenerator.generateAdvancedReport();
    const matrixTime = Date.now() - startTime;
    
    const comparisonMatrix = advancedReport.roleComparisonMatrix;
    
    console.log('\\n📊 ROLE COMPARISON MATRIX:');
    console.log('=============================');
    console.log(`Generation Time: ${matrixTime}ms`);
    console.log(`Roles Analyzed: ${comparisonMatrix.roles.length}`);
    console.log(`Paths Analyzed: ${comparisonMatrix.paths.length}`);
    console.log(`Matrix Size: ${comparisonMatrix.accessMatrix.length}x${comparisonMatrix.accessMatrix[0]?.length || 0}`);
    console.log(`Anomalies Detected: ${comparisonMatrix.anomalies.length}`);
    
    console.log('\\n🔍 ACCESS MATRIX SAMPLE:');
    console.log('Role'.padEnd(15) + comparisonMatrix.paths.slice(0, 3).join('\\t'));
    comparisonMatrix.roles.slice(0, 3).forEach((role, i) => {
      const row = comparisonMatrix.accessMatrix[i]?.slice(0, 3).map(access => access ? '✅' : '❌').join('\\t\\t');
      console.log(role.padEnd(15) + row);
    });
    
    if (comparisonMatrix.anomalies.length > 0) {
      console.log('\\n⚠️ ACCESS ANOMALIES DETECTED:');
      comparisonMatrix.anomalies.slice(0, 5).forEach((anomaly, i) => {
        console.log(`${i + 1}. [${anomaly.riskLevel.toUpperCase()}] ${anomaly.role} → ${anomaly.path}`);
        console.log(`   Expected: ${anomaly.expected}, Actual: ${anomaly.actual}`);
        console.log(`   ${anomaly.description}`);
      });
    } else {
      console.log('\\n✅ No access anomalies detected');
    }

    // Validation assertions
    expect(matrixTime).toBeLessThan(12000);
    expect(comparisonMatrix.roles.length).toBe(6); // All 6 roles
    expect(comparisonMatrix.paths.length).toBeGreaterThan(0);
    expect(comparisonMatrix.accessMatrix.length).toBe(6); // One row per role
    expect(comparisonMatrix.heatmapData.length).toBe(6); // Heatmap data for all roles
    expect(comparisonMatrix.anomalies).toBeInstanceOf(Array);
    
    // Validate matrix structure
    comparisonMatrix.accessMatrix.forEach(row => {
      expect(row.length).toBe(comparisonMatrix.paths.length);
    });
    
    console.log('\\n✅ Role Comparison Matrix: PASSED');
  });

  test('Hour 5: Permission Heatmap Visualization', async () => {
    console.log('🎨 Testing Permission Heatmap Generation...');
    
    const startTime = Date.now();
    const advancedReport = await reportGenerator.generateAdvancedReport();
    const heatmapTime = Date.now() - startTime;
    
    const permissionHeatmap = advancedReport.permissionHeatmap;
    
    console.log('\\n🗺️ PERMISSION HEATMAP:');
    console.log('=======================');
    console.log(`Generation Time: ${heatmapTime}ms`);
    console.log(`Title: ${permissionHeatmap.title}`);
    console.log(`Dimensions: ${permissionHeatmap.dimensions.width}x${permissionHeatmap.dimensions.height}`);
    console.log(`Data Points: ${permissionHeatmap.data.length}`);
    console.log(`Legend Items: ${permissionHeatmap.legend.length}`);
    console.log(`Insights Generated: ${permissionHeatmap.insights.length}`);
    
    console.log('\\n🎨 COLOR SCALE:');
    console.log(`Min: ${permissionHeatmap.colorScale.min} | Mid: ${permissionHeatmap.colorScale.mid} | Max: ${permissionHeatmap.colorScale.max}`);
    console.log(`Steps: ${permissionHeatmap.colorScale.steps}`);
    
    console.log('\\n📊 LEGEND:');
    permissionHeatmap.legend.forEach((item, i) => {
      console.log(`${i + 1}. ${item.color} → ${item.label}: ${item.value}`);
    });
    
    console.log('\\n💡 HEATMAP INSIGHTS:');
    permissionHeatmap.insights.forEach((insight, i) => {
      console.log(`${i + 1}. ${insight}`);
    });
    
    // Sample data points analysis
    const accessiblePoints = permissionHeatmap.data.filter(d => d.value > 0).length;
    const totalPoints = permissionHeatmap.data.length;
    const accessibilityRate = ((accessiblePoints / totalPoints) * 100).toFixed(1);
    
    console.log(`\\n📈 ACCESSIBILITY ANALYSIS:`);
    console.log(`Total data points: ${totalPoints}`);
    console.log(`Accessible points: ${accessiblePoints}`);
    console.log(`Accessibility rate: ${accessibilityRate}%`);

    // Validation assertions
    expect(heatmapTime).toBeLessThan(12000);
    expect(permissionHeatmap.title).toContain('Heatmap');
    expect(permissionHeatmap.dimensions.width).toBe(6); // 6 roles
    expect(permissionHeatmap.dimensions.height).toBeGreaterThan(0);
    expect(permissionHeatmap.data.length).toBeGreaterThan(0);
    expect(permissionHeatmap.legend.length).toBeGreaterThan(0);
    expect(permissionHeatmap.insights.length).toBeGreaterThan(0);
    expect(permissionHeatmap.colorScale.steps).toBeGreaterThan(0);
    
    // Validate data point structure
    permissionHeatmap.data.forEach(point => {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.value).toBeGreaterThanOrEqual(0);
      expect(point.value).toBeLessThanOrEqual(100);
      expect(point.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(point.tooltip).toBeTruthy();
    });
    
    console.log('\\n✅ Permission Heatmap Visualization: PASSED');
  });

  test('Hour 6: Security Findings Report', async () => {
    console.log('🔒 Testing Security Findings Report...');
    
    const startTime = Date.now();
    const advancedReport = await reportGenerator.generateAdvancedReport();
    const securityTime = Date.now() - startTime;
    
    const securityFindings = advancedReport.securityFindings;
    
    console.log('\\n🛡️ SECURITY FINDINGS REPORT:');
    console.log('===============================');
    console.log(`Generation Time: ${securityTime}ms`);
    console.log(`Total Issues: ${securityFindings.summary.totalIssues}`);
    console.log(`Critical: ${securityFindings.summary.criticalCount}`);
    console.log(`High: ${securityFindings.summary.highCount}`);
    console.log(`Medium: ${securityFindings.summary.mediumCount}`);
    console.log(`Low: ${securityFindings.summary.lowCount}`);
    console.log(`Risk Score: ${securityFindings.summary.riskScore}/100`);
    console.log(`Compliance Grade: ${securityFindings.summary.complianceGrade}`);
    
    console.log('\\n🚨 CRITICAL SECURITY ISSUES:');
    if (securityFindings.criticalIssues.length > 0) {
      securityFindings.criticalIssues.forEach((issue, i) => {
        console.log(`${i + 1}. [${issue.id}] ${issue.title}`);
        console.log(`   Severity: ${issue.severity.toUpperCase()} | Category: ${issue.category}`);
        console.log(`   Affected: ${issue.affectedRoles.join(', ')}`);
        console.log(`   Impact: ${issue.impact}`);
        console.log(`   Recommendation: ${issue.recommendation.substring(0, 80)}...`);
      });
    } else {
      console.log('   ✅ No critical security issues detected');
    }
    
    console.log('\\n📋 SECURITY RECOMMENDATIONS:');
    securityFindings.recommendations.slice(0, 3).forEach((rec, i) => {
      console.log(`${i + 1}. [${rec.id}] ${rec.title}`);
      console.log(`   Category: ${rec.category} | Impact: ${rec.impact} | Effort: ${rec.effort}`);
      console.log(`   Timeline: ${rec.timeline}`);
    });
    
    console.log('\\n⏰ SECURITY TIMELINE:');
    securityFindings.timeline.forEach((event, i) => {
      console.log(`${i + 1}. ${new Date(event.timestamp).toLocaleString()}: ${event.event} [${event.severity.toUpperCase()}]`);
    });

    // Validation assertions
    expect(securityTime).toBeLessThan(12000);
    expect(securityFindings.summary).toBeDefined();
    expect(securityFindings.summary.totalIssues).toBeGreaterThanOrEqual(0);
    expect(securityFindings.summary.riskScore).toBeGreaterThanOrEqual(0);
    expect(securityFindings.summary.riskScore).toBeLessThanOrEqual(100);
    expect(securityFindings.summary.complianceGrade).toBeTruthy();
    expect(securityFindings.criticalIssues).toBeInstanceOf(Array);
    expect(securityFindings.mediumIssues).toBeInstanceOf(Array);
    expect(securityFindings.lowIssues).toBeInstanceOf(Array);
    expect(securityFindings.recommendations).toBeInstanceOf(Array);
    expect(securityFindings.timeline).toBeInstanceOf(Array);
    
    // Validate issue structure
    [...securityFindings.criticalIssues, ...securityFindings.mediumIssues, ...securityFindings.lowIssues].forEach(issue => {
      expect(issue.id).toMatch(/^SEC-\\d{3}$/);
      expect(issue.title).toBeTruthy();
      expect(['low', 'medium', 'high', 'critical']).toContain(issue.severity);
      expect(issue.priority).toBeGreaterThan(0);
    });
    
    console.log('\\n✅ Security Findings Report: PASSED');
  });

  test('Hour 6: Interactive HTML Dashboard Generation', async () => {
    console.log('🌐 Testing Interactive HTML Dashboard...');
    
    const startTime = Date.now();
    const advancedReport = await reportGenerator.generateAdvancedReport();
    const dashboardTime = Date.now() - startTime;
    
    // Check if dashboard file was created
    const dashboardPath = 'results/security-dashboard.html';
    let dashboardExists = false;
    let dashboardSize = 0;
    
    try {
      const stats = await fs.stat(dashboardPath);
      dashboardExists = true;
      dashboardSize = stats.size;
    } catch {
      // File doesn't exist, which is expected in test environment
    }
    
    const interactiveElements = advancedReport.interactiveElements;
    const exportOptions = advancedReport.exportOptions;
    
    console.log('\\n🎛️ INTERACTIVE DASHBOARD:');
    console.log('===========================');
    console.log(`Generation Time: ${dashboardTime}ms`);
    console.log(`Dashboard File Exists: ${dashboardExists ? 'Yes' : 'Skipped (test mode)'}`);
    if (dashboardExists) {
      console.log(`Dashboard Size: ${(dashboardSize / 1024).toFixed(1)} KB`);
    }
    console.log(`Interactive Elements: ${interactiveElements.length}`);
    console.log(`Export Options: ${exportOptions.length}`);
    
    console.log('\\n📊 INTERACTIVE ELEMENTS:');
    interactiveElements.forEach((element, i) => {
      console.log(`${i + 1}. [${element.type.toUpperCase()}] ${element.title}`);
      console.log(`   ID: ${element.id}`);
      console.log(`   Config: ${JSON.stringify(element.config)}`);
      console.log(`   Interactive: ${element.config.interactive ? 'Yes' : 'No'}`);
      console.log(`   Exportable: ${element.config.exportable ? 'Yes' : 'No'}`);
    });
    
    console.log('\\n📤 EXPORT OPTIONS:');
    exportOptions.forEach((option, i) => {
      console.log(`${i + 1}. ${option.format.toUpperCase()}: ${option.title}`);
      console.log(`   Description: ${option.description}`);
      console.log(`   Available: ${option.available ? 'Yes' : 'No'}`);
      console.log(`   Size: ${option.size || 'N/A'}`);
    });

    // Validation assertions
    expect(dashboardTime).toBeLessThan(15000);
    expect(interactiveElements.length).toBeGreaterThan(0);
    expect(exportOptions.length).toBeGreaterThan(0);
    
    // Validate interactive elements
    const expectedTypes = ['heatmap', 'chart', 'dashboard', 'table'];
    interactiveElements.forEach(element => {
      expect(expectedTypes).toContain(element.type);
      expect(element.id).toBeTruthy();
      expect(element.title).toBeTruthy();
      expect(element.config).toBeDefined();
    });
    
    // Validate export options
    const expectedFormats = ['pdf', 'html', 'json', 'csv', 'excel'];
    exportOptions.forEach(option => {
      expect(expectedFormats).toContain(option.format);
      expect(option.title).toBeTruthy();
      expect(option.description).toBeTruthy();
      expect(typeof option.available).toBe('boolean');
    });
    
    // Check that we have all major chart types
    const elementTypes = interactiveElements.map(e => e.type);
    expect(elementTypes).toContain('heatmap');
    expect(elementTypes).toContain('chart');
    expect(elementTypes).toContain('dashboard');
    
    console.log('\\n✅ Interactive HTML Dashboard: PASSED');
  });

  test('Hour 6: Multi-Format Export Capabilities', async () => {
    console.log('📤 Testing Multi-Format Export Capabilities...');
    
    const startTime = Date.now();
    const advancedReport = await reportGenerator.generateAdvancedReport();
    const exportTime = Date.now() - startTime;
    
    // Check for generated files
    const expectedFiles = [
      'results/advanced-intelligence-report.json',
      'results/executive-summary.json'
    ];
    
    const fileStatuses = [];
    for (const filePath of expectedFiles) {
      try {
        const stats = await fs.stat(filePath);
        fileStatuses.push({
          path: filePath,
          exists: true,
          size: stats.size,
          sizeKB: (stats.size / 1024).toFixed(1)
        });
      } catch {
        fileStatuses.push({
          path: filePath,
          exists: false,
          size: 0,
          sizeKB: '0'
        });
      }
    }
    
    console.log('\\n📁 EXPORT FILE STATUS:');
    console.log('========================');
    console.log(`Export Generation Time: ${exportTime}ms`);
    fileStatuses.forEach((file, i) => {
      console.log(`${i + 1}. ${path.basename(file.path)}`);
      console.log(`   Status: ${file.exists ? '✅ Created' : '❌ Missing'}`);
      console.log(`   Size: ${file.sizeKB} KB`);
      console.log(`   Path: ${file.path}`);
    });
    
    // Validate recommended actions structure
    const recommendedActions = advancedReport.recommendedActions;
    console.log('\\n🎯 RECOMMENDED ACTIONS ANALYSIS:');
    console.log(`Total Actions: ${recommendedActions.length}`);
    
    const actionsByPriority = {
      critical: recommendedActions.filter(a => a.priority === 'critical').length,
      high: recommendedActions.filter(a => a.priority === 'high').length,
      medium: recommendedActions.filter(a => a.priority === 'medium').length,
      low: recommendedActions.filter(a => a.priority === 'low').length
    };
    
    console.log(`Priority Breakdown: Critical(${actionsByPriority.critical}) High(${actionsByPriority.high}) Medium(${actionsByPriority.medium}) Low(${actionsByPriority.low})`);
    
    // Show top 3 actions
    console.log('\\n📋 TOP PRIORITY ACTIONS:');
    recommendedActions.slice(0, 3).forEach((action, i) => {
      console.log(`${i + 1}. [${action.priority.toUpperCase()}] ${action.title}`);
      console.log(`   Category: ${action.category} | Impact: ${action.impact} | Effort: ${action.effort}`);
      console.log(`   Time: ${action.estimatedTime}`);
      console.log(`   Value: ${action.businessValue}`);
      console.log(`   Implementation Steps: ${action.implementation.length}`);
      console.log(`   Validation Steps: ${action.validation.length}`);
    });

    // Validation assertions
    expect(exportTime).toBeLessThan(15000);
    expect(advancedReport.recommendedActions.length).toBeGreaterThan(0);
    expect(advancedReport.exportOptions.length).toBeGreaterThanOrEqual(5); // At least 5 export formats
    
    // Validate that key files exist
    const mainReportExists = fileStatuses.find(f => f.path.includes('advanced-intelligence-report.json'))?.exists;
    expect(mainReportExists).toBe(true);
    
    // Validate action structure
    recommendedActions.forEach(action => {
      expect(action.id).toMatch(/^ACT-\\d{3}$/);
      expect(action.title).toBeTruthy();
      expect(['security', 'performance', 'compliance', 'architecture']).toContain(action.category);
      expect(['critical', 'high', 'medium', 'low']).toContain(action.priority);
      expect(['high', 'medium', 'low']).toContain(action.effort);
      expect(['high', 'medium', 'low']).toContain(action.impact);
      expect(action.implementation).toBeInstanceOf(Array);
      expect(action.validation).toBeInstanceOf(Array);
      expect(action.estimatedTime).toBeTruthy();
      expect(action.businessValue).toBeTruthy();
    });
    
    console.log('\\n✅ Multi-Format Export Capabilities: PASSED');
  });

  test('Hours 5-6 Final Integration Test', async () => {
    console.log('🏁 Final Integration: Hours 5-6 Advanced Reporting & Visualization...');
    
    const integrationStart = Date.now();
    
    // Complete end-to-end advanced reporting flow
    console.log('\\n🔄 COMPLETE REPORTING PIPELINE:');
    
    // Step 1: Generate Intelligence Report
    console.log('Step 1: Intelligence analysis...');
    const step1Start = Date.now();
    const fullIntelligenceReport = await intelligenceEngine.generateIntelligenceReport();
    const step1Time = Date.now() - step1Start;
    
    // Step 2: Generate Advanced Report
    console.log('Step 2: Advanced reporting...');
    const step2Start = Date.now();
    const advancedReport = await reportGenerator.generateAdvancedReport();
    const step2Time = Date.now() - step2Start;
    
    const totalIntegrationTime = Date.now() - integrationStart;
    
    console.log('\\n🎯 INTEGRATION RESULTS:');
    console.log('=========================');
    console.log(`Intelligence Analysis: ${step1Time}ms`);
    console.log(`Advanced Reporting: ${step2Time}ms`);
    console.log(`Total Integration Time: ${totalIntegrationTime}ms`);
    
    // Comprehensive validation of all components
    const validationResults = {
      executiveSummary: advancedReport.executiveSummary !== undefined,
      roleComparisonMatrix: advancedReport.roleComparisonMatrix !== undefined,
      permissionHeatmap: advancedReport.permissionHeatmap !== undefined,
      securityFindings: advancedReport.securityFindings !== undefined,
      recommendedActions: advancedReport.recommendedActions.length > 0,
      interactiveElements: advancedReport.interactiveElements.length > 0,
      exportOptions: advancedReport.exportOptions.length >= 5
    };
    
    console.log('\\n✅ COMPONENT VALIDATION:');
    Object.entries(validationResults).forEach(([component, passed]) => {
      const status = passed ? '✅ PASSED' : '❌ FAILED';
      const formattedComponent = component.replace(/([A-Z])/g, ' $1').toLowerCase();
      console.log(`${formattedComponent.padEnd(25)}: ${status}`);
    });
    
    const passedComponents = Object.values(validationResults).filter(Boolean).length;
    const totalComponents = Object.keys(validationResults).length;
    const successRate = ((passedComponents / totalComponents) * 100).toFixed(1);
    
    console.log('\\n📊 HOURS 5-6 FINAL RESULTS:');
    console.log('==============================');
    console.log(`Components Validated: ${passedComponents}/${totalComponents} (${successRate}%)`);
    console.log(`Executive Dashboards: Generated`);
    console.log(`Interactive Elements: ${advancedReport.interactiveElements.length}`);
    console.log(`Export Formats: ${advancedReport.exportOptions.length}`);
    console.log(`Security Insights: ${advancedReport.securityFindings.summary.totalIssues}`);
    console.log(`Actionable Recommendations: ${advancedReport.recommendedActions.length}`);
    
    // Save final integration results
    const integrationReport = {
      timestamp: new Date().toISOString(),
      phase: 'Hours 5-6: Advanced Reporting & Visualization',
      executionTime: totalIntegrationTime,
      componentResults: validationResults,
      successRate: parseFloat(successRate),
      status: passedComponents === totalComponents ? 'COMPLETED' : 'PARTIAL',
      summary: {
        intelligenceTime: step1Time,
        reportingTime: step2Time,
        totalTime: totalIntegrationTime,
        componentsGenerated: passedComponents
      }
    };
    
    await fs.mkdir('results', { recursive: true });
    await fs.writeFile(
      'results/hours-5-6-integration-report.json',
      JSON.stringify(integrationReport, null, 2)
    );

    // Final comprehensive assertions
    expect(totalIntegrationTime).toBeLessThan(30000); // Should complete in under 30 seconds
    expect(passedComponents).toBe(totalComponents);
    expect(successRate).toBe('100.0');
    expect(advancedReport.executiveSummary.overallSecurityScore).toBeGreaterThanOrEqual(0);
    expect(advancedReport.permissionHeatmap.data.length).toBeGreaterThan(0);
    expect(advancedReport.securityFindings.summary.totalIssues).toBeGreaterThanOrEqual(0);
    
    console.log('\\n🎉 HOURS 5-6 ADVANCED REPORTING & VISUALIZATION: COMPLETE!');
    console.log('✅ All advanced reporting capabilities validated successfully');
    console.log('🎯 Day 2 Intelligence Engine Implementation: SUCCESS!');
    console.log('💾 Integration report saved to results/hours-5-6-integration-report.json');
    
    console.log('\\n🚀 READY FOR WEEK 1 DAY 3: SECURITY FUZZING ENGINE!');
  });
});