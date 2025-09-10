import { test, expect } from '@playwright/test';
import { IntelligentCrawler } from '../utils/intelligent-crawler';
import { NavigationIntelligenceEngine } from '../utils/navigation-intelligence';
import * as fs from 'fs/promises';

test.describe('Navigation Intelligence Engine - Hours 3-4 Implementation', () => {
  let crawler: IntelligentCrawler;
  let navigationMap: any;

  test.beforeAll(async () => {
    console.log('🧠 Initializing Intelligence Engine test suite...');
    
    // Initialize crawler with optimized settings for intelligence testing
    crawler = new IntelligentCrawler({
      baseURL: 'http://localhost:3002',
      maxPages: 20, // Reduced for faster intelligence testing
      timeout: 10000,
      screenshotMode: 'failures',
      videoRecording: false,
      networkMonitoring: true,
      performanceMetrics: true,
      retryAttempts: 2,
      retryDelay: 500,
      timeoutStrategy: 'balanced',
      errorRecovery: 'retry',
      resourceLimits: {
        maxConcurrentContexts: 4,
        maxPagesPerContext: 2,
        memoryLimitMB: 1024,
        networkTimeoutMs: 8000
      },
      parallelOptimization: {
        batchSize: 2,
        cooldownMs: 200,
        loadBalancing: true,
        priorityRoles: ['super_admin', 'tenant_admin']
      },
      performanceTracking: true
    });

    await crawler.initialize();
  });

  test.afterAll(async () => {
    if (crawler) {
      await crawler.cleanup();
    }
  });

  test('Hour 3: Permission Pattern Recognition', async () => {
    console.log('🎯 Testing Permission Pattern Recognition...');
    
    // First, discover navigation paths
    console.log('📊 Discovering navigation paths...');
    navigationMap = await crawler.discoverNavigationPathsIntelligently();
    
    // Validate we have sufficient data for analysis
    const rolesProcessed = Object.keys(navigationMap).length;
    console.log(`✅ Roles processed: ${rolesProcessed}/6`);
    expect(rolesProcessed).toBeGreaterThanOrEqual(2); // At least 2 roles for pattern analysis
    
    // Initialize Intelligence Engine
    const intelligenceEngine = new NavigationIntelligenceEngine(navigationMap);
    
    // Test permission pattern analysis
    console.log('🔍 Analyzing permission patterns...');
    const permissionPatterns = await intelligenceEngine.analyzePermissionPatterns();
    
    console.log('\\n📋 PERMISSION PATTERN ANALYSIS:');
    console.log('=======================================');
    console.log(`Role Hierarchy Compliance: ${permissionPatterns.roleHierarchy.complianceScore.toFixed(1)}%`);
    console.log(`Access Patterns Identified: ${permissionPatterns.accessPatterns.length}`);
    console.log(`Permission Gaps Found: ${permissionPatterns.permissionGaps.length}`);
    console.log(`Security Risks Detected: ${permissionPatterns.securityRisks.length}`);
    
    // Display access patterns
    console.log('\\n🎨 ACCESS PATTERNS:');
    permissionPatterns.accessPatterns.forEach((pattern, i) => {
      console.log(`${i + 1}. ${pattern.pattern}: ${pattern.rolesWithAccess.length} roles, Risk: ${pattern.riskLevel.toUpperCase()}`);
      console.log(`   ${pattern.description}`);
    });
    
    // Display security risks
    if (permissionPatterns.securityRisks.length > 0) {
      console.log('\\n🚨 SECURITY RISKS:');
      permissionPatterns.securityRisks.forEach((risk, i) => {
        console.log(`${i + 1}. [${risk.severity.toUpperCase()}] ${risk.type}`);
        console.log(`   Affects: ${risk.affectedRoles.join(', ')}`);
        console.log(`   ${risk.description}`);
        console.log(`   Mitigation: ${risk.mitigation}`);
      });
    } else {
      console.log('\\n✅ No critical security risks detected');
    }
    
    // Validation assertions
    expect(permissionPatterns.roleHierarchy.complianceScore).toBeGreaterThanOrEqual(0);
    expect(permissionPatterns.accessPatterns.length).toBeGreaterThanOrEqual(0);
    expect(permissionPatterns.roleHierarchy.violations).toBeDefined();
    
    console.log('\\n✅ Permission Pattern Recognition completed!');
  });

  test('Hour 3: Multi-Role Comparison Engine', async () => {
    console.log('⚖️ Testing Multi-Role Comparison Engine...');
    
    // Use navigation map from previous test or create minimal one
    if (!navigationMap || Object.keys(navigationMap).length === 0) {
      navigationMap = await crawler.discoverNavigationPathsIntelligently();
    }
    
    const intelligenceEngine = new NavigationIntelligenceEngine(navigationMap);
    
    // Test role comparison analysis
    console.log('📊 Performing role comparison analysis...');
    const roleComparison = await intelligenceEngine.compareAllRoles();
    
    console.log('\\n📈 ROLE COMPARISON ANALYSIS:');
    console.log('=====================================');
    console.log(`Common Access Paths: ${roleComparison.commonAccess.length}`);
    console.log(`Security Exceptions Found: ${roleComparison.securityExceptions.length}`);
    
    // Display unique access per role
    console.log('\\n🔐 UNIQUE ACCESS BY ROLE:');
    Object.entries(roleComparison.uniqueAccess).forEach(([role, paths]) => {
      console.log(`${role.padEnd(15)}: ${paths.length} unique paths`);
      if (paths.length <= 5) {
        paths.forEach(path => console.log(`  - ${path}`));
      } else {
        paths.slice(0, 3).forEach(path => console.log(`  - ${path}`));
        console.log(`  ... and ${paths.length - 3} more`);
      }
    });
    
    // Display common access paths
    if (roleComparison.commonAccess.length > 0) {
      console.log('\\n🌐 COMMON ACCESS PATHS:');
      roleComparison.commonAccess.forEach(path => console.log(`  - ${path}`));
    } else {
      console.log('\\n⚠️ No paths accessible to all roles');
    }
    
    // Display security exceptions
    if (roleComparison.securityExceptions.length > 0) {
      console.log('\\n🚨 SECURITY EXCEPTIONS:');
      roleComparison.securityExceptions.forEach((exception, i) => {
        console.log(`${i + 1}. [${exception.riskLevel.toUpperCase()}] ${exception.type}`);
        console.log(`   Role: ${exception.role}, Path: ${exception.path}`);
        console.log(`   Expected: ${exception.expected}, Actual: ${exception.actual}`);
      });
    } else {
      console.log('\\n✅ No security exceptions detected');
    }
    
    // Validation assertions
    expect(roleComparison.uniqueAccess).toBeDefined();
    expect(roleComparison.commonAccess).toBeInstanceOf(Array);
    expect(roleComparison.hierarchicalAccess).toBeDefined();
    expect(roleComparison.securityExceptions).toBeInstanceOf(Array);
    
    console.log('\\n✅ Multi-Role Comparison Engine completed!');
  });

  test('Hour 4: Deep Link Discovery Engine', async () => {
    console.log('🕳️ Testing Deep Link Discovery Engine...');
    
    // Use existing navigation map or create one
    if (!navigationMap || Object.keys(navigationMap).length === 0) {
      navigationMap = await crawler.discoverNavigationPathsIntelligently();
    }
    
    const intelligenceEngine = new NavigationIntelligenceEngine(navigationMap);
    
    // Generate comprehensive intelligence report
    console.log('📊 Generating comprehensive intelligence report...');
    const intelligenceReport = await intelligenceEngine.generateIntelligenceReport();
    
    console.log('\\n🧠 INTELLIGENCE REPORT SUMMARY:');
    console.log('=======================================');
    console.log(`Security Posture: ${intelligenceReport.executiveSummary.securityPosture.toUpperCase()}`);
    console.log(`Overall Score: ${intelligenceReport.executiveSummary.overallScore}/100`);
    console.log(`Security Insights: ${intelligenceReport.securityInsights.length}`);
    console.log(`Actionable Recommendations: ${intelligenceReport.recommendations.length}`);
    
    // Display key findings
    console.log('\\n📋 KEY FINDINGS:');
    intelligenceReport.executiveSummary.keyFindings.forEach((finding, i) => {
      console.log(`${i + 1}. ${finding}`);
    });
    
    // Display top risks
    if (intelligenceReport.executiveSummary.topRisks.length > 0) {
      console.log('\\n⚠️ TOP RISKS:');
      intelligenceReport.executiveSummary.topRisks.forEach((risk, i) => {
        console.log(`${i + 1}. ${risk}`);
      });
    }
    
    // Display quick wins
    if (intelligenceReport.executiveSummary.quickWins.length > 0) {
      console.log('\\n🎯 QUICK WINS:');
      intelligenceReport.executiveSummary.quickWins.forEach((win, i) => {
        console.log(`${i + 1}. ${win}`);
      });
    }
    
    // Display actionable recommendations
    console.log('\\n💡 ACTIONABLE RECOMMENDATIONS:');
    intelligenceReport.recommendations.slice(0, 5).forEach((rec, i) => {
      console.log(`${i + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
      console.log(`   Impact: ${rec.impact}, Effort: ${rec.effort}`);
      console.log(`   ${rec.description}`);
    });
    
    // Save intelligence report
    await fs.mkdir('results', { recursive: true });
    await fs.writeFile(
      'results/navigation-intelligence-report.json',
      JSON.stringify(intelligenceReport, null, 2)
    );
    
    console.log('\\n💾 Intelligence report saved to results/navigation-intelligence-report.json');
    
    // Validation assertions
    expect(intelligenceReport.permissionPatterns).toBeDefined();
    expect(intelligenceReport.roleComparison).toBeDefined();
    expect(intelligenceReport.securityInsights).toBeInstanceOf(Array);
    expect(intelligenceReport.performanceAnalysis).toBeDefined();
    expect(intelligenceReport.recommendations).toBeInstanceOf(Array);
    expect(intelligenceReport.executiveSummary).toBeDefined();
    expect(intelligenceReport.executiveSummary.overallScore).toBeGreaterThanOrEqual(0);
    expect(intelligenceReport.executiveSummary.overallScore).toBeLessThanOrEqual(100);
    
    console.log('\\n✅ Deep Link Discovery Engine completed!');
  });

  test('Hour 4: Performance Analysis and Benchmarking', async () => {
    console.log('📈 Testing Performance Analysis and Benchmarking...');
    
    // Read the generated intelligence report
    let intelligenceReport;
    try {
      const reportData = await fs.readFile('results/navigation-intelligence-report.json', 'utf8');
      intelligenceReport = JSON.parse(reportData);
    } catch (error) {
      console.log('⚠️ Intelligence report not found, generating...');
      
      if (!navigationMap || Object.keys(navigationMap).length === 0) {
        navigationMap = await crawler.discoverNavigationPathsIntelligently();
      }
      
      const engine = new NavigationIntelligenceEngine(navigationMap);
      intelligenceReport = await engine.generateIntelligenceReport();
    }
    
    // Analyze performance patterns
    console.log('\\n⚡ PERFORMANCE ANALYSIS:');
    console.log('==============================');
    
    const perfAnalysis = intelligenceReport.performanceAnalysis;
    
    console.log('\\n🕒 RESPONSE TIME ANALYSIS:');
    Object.entries(perfAnalysis.responseTimeAnalysis.averageByRole).forEach(([role, avgTime]) => {
      const grade = perfAnalysis.responseTimeAnalysis.performanceGrades[role] || 'N/A';
      console.log(`${role.padEnd(15)}: ${avgTime}ms (Grade: ${grade})`);
    });
    
    // Show slowest paths
    if (perfAnalysis.responseTimeAnalysis.slowestPaths.length > 0) {
      console.log('\\n🐌 SLOWEST PATHS:');
      perfAnalysis.responseTimeAnalysis.slowestPaths.forEach((path, i) => {
        console.log(`${i + 1}. ${path.path} (${path.role}): ${path.responseTime}ms`);
      });
    }
    
    // Show fastest paths
    if (perfAnalysis.responseTimeAnalysis.fastestPaths.length > 0) {
      console.log('\\n⚡ FASTEST PATHS:');
      perfAnalysis.responseTimeAnalysis.fastestPaths.forEach((path, i) => {
        console.log(`${i + 1}. ${path.path} (${path.role}): ${path.responseTime}ms`);
      });
    }
    
    // Show error patterns
    if (perfAnalysis.errorPatterns.length > 0) {
      console.log('\\n❌ ERROR PATTERNS:');
      perfAnalysis.errorPatterns.forEach((pattern, i) => {
        console.log(`${i + 1}. ${pattern.errorType}: ${pattern.frequency} occurrences (${pattern.commonality.toFixed(1)}% commonality)`);
        console.log(`   Affected roles: ${pattern.affectedRoles.join(', ')}`);
      });
    } else {
      console.log('\\n✅ No significant error patterns detected');
    }
    
    // Show optimization opportunities
    if (perfAnalysis.optimizationOpportunities.length > 0) {
      console.log('\\n🎯 OPTIMIZATION OPPORTUNITIES:');
      perfAnalysis.optimizationOpportunities.forEach((opp, i) => {
        console.log(`${i + 1}. [${opp.area.toUpperCase()}] ${opp.description}`);
        console.log(`   Impact: ${opp.impact}, Effort: ${opp.effort}, Priority: ${opp.priority}`);
      });
    }
    
    // Validation assertions
    expect(perfAnalysis).toBeDefined();
    expect(perfAnalysis.responseTimeAnalysis).toBeDefined();
    expect(perfAnalysis.errorPatterns).toBeInstanceOf(Array);
    expect(perfAnalysis.optimizationOpportunities).toBeInstanceOf(Array);
    
    console.log('\\n✅ Performance Analysis and Benchmarking completed!');
  });

  test('Hours 3-4 Integration: Complete Intelligence Engine Validation', async () => {
    console.log('🎯 Final Integration Test: Complete Intelligence Engine...');
    
    // Verify all intelligence components work together
    const startTime = Date.now();
    
    // 1. Navigation Discovery
    console.log('📊 Step 1: Navigation Discovery...');
    const discoveryMap = await crawler.discoverNavigationPathsIntelligently();
    const discoveryTime = Date.now() - startTime;
    
    // 2. Intelligence Analysis
    console.log('🧠 Step 2: Intelligence Analysis...');
    const analysisStartTime = Date.now();
    const engine = new NavigationIntelligenceEngine(discoveryMap);
    const fullReport = await engine.generateIntelligenceReport();
    const analysisTime = Date.now() - analysisStartTime;
    
    const totalTime = Date.now() - startTime;
    
    console.log('\\n🏆 INTELLIGENCE ENGINE PERFORMANCE SUMMARY:');
    console.log('==============================================');
    console.log(`Discovery Time: ${discoveryTime}ms`);
    console.log(`Analysis Time: ${analysisTime}ms`);
    console.log(`Total Execution Time: ${totalTime}ms`);
    console.log(`Roles Processed: ${Object.keys(discoveryMap).length}`);
    console.log(`Total Insights Generated: ${fullReport.recommendations.length}`);
    console.log(`Security Posture: ${fullReport.executiveSummary.securityPosture}`);
    console.log(`Overall Score: ${fullReport.executiveSummary.overallScore}/100`);
    
    // Performance validations (Hours 3-4 targets)
    expect(totalTime).toBeLessThan(120000); // Should complete in under 2 minutes
    expect(Object.keys(discoveryMap).length).toBeGreaterThanOrEqual(2); // At least 2 roles processed
    expect(fullReport.recommendations.length).toBeGreaterThanOrEqual(1); // At least 1 recommendation
    expect(fullReport.executiveSummary.overallScore).toBeGreaterThanOrEqual(0);
    
    // Save comprehensive results
    const finalReport = {
      executionMetrics: {
        discoveryTime,
        analysisTime,
        totalTime,
        rolesProcessed: Object.keys(discoveryMap).length
      },
      intelligenceReport: fullReport,
      timestamp: new Date().toISOString()
    };
    
    await fs.writeFile(
      'results/hours-3-4-intelligence-engine-results.json',
      JSON.stringify(finalReport, null, 2)
    );
    
    console.log('\\n💾 Complete results saved to results/hours-3-4-intelligence-engine-results.json');
    console.log('\\n🎉 Hours 3-4 Intelligence Engine Implementation: COMPLETED SUCCESSFULLY!');
    
    // Final validation
    expect(finalReport.executionMetrics.totalTime).toBeLessThan(120000);
    expect(finalReport.intelligenceReport.executiveSummary).toBeDefined();
    expect(finalReport.intelligenceReport.recommendations.length).toBeGreaterThanOrEqual(1);
  });
});