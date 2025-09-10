import { test, expect } from '@playwright/test';
import { IntelligentCrawler } from '../utils/intelligent-crawler';
import * as fs from 'fs/promises';

test.describe('Intelligent Navigation Crawler - Enhanced Testing', () => {
  let crawler: IntelligentCrawler;

  test.beforeAll(async () => {
    // Initialize the intelligent crawler with optimized settings
    crawler = new IntelligentCrawler({
      baseURL: 'http://localhost:3002',
      maxPages: 50,
      timeout: 15000, // Optimized timeout
      screenshotMode: 'all',
      videoRecording: false, // Disabled for faster execution
      networkMonitoring: true,
      performanceMetrics: true,
      retryAttempts: 3,
      retryDelay: 1000,
      timeoutStrategy: 'balanced',
      errorRecovery: 'retry',
      resourceLimits: {
        maxConcurrentContexts: 6,
        maxPagesPerContext: 3,
        memoryLimitMB: 2048,
        networkTimeoutMs: 10000
      },
      parallelOptimization: {
        batchSize: 2, // Process 2 roles at a time
        cooldownMs: 500,
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

  test('Intelligent Multi-Role Navigation Discovery', async () => {
    console.log('🧠 Starting intelligent multi-role navigation discovery...');
    
    const startTime = Date.now();
    
    // Execute intelligent discovery with all optimizations
    const navigationMap = await crawler.discoverNavigationPathsIntelligently();
    
    const totalExecutionTime = Date.now() - startTime;
    console.log(`⚡ Total execution time: ${totalExecutionTime}ms`);
    
    // Validate that all roles were processed
    const expectedRoles = ['super_admin', 'tenant_admin', 'module_admin', 'wms_user', 'accounting_user', 'readonly_user'];
    
    console.log('\n📊 INTELLIGENT DISCOVERY RESULTS:');
    console.log('================================================');
    
    let totalPaths = 0;
    let totalAccessible = 0;
    let totalErrors = 0;
    
    for (const role of expectedRoles) {
      if (navigationMap[role]) {
        const discovery = navigationMap[role];
        const accessibleCount = discovery.discoveredPaths.filter(p => p.accessible).length;
        const errorCount = discovery.discoveredPaths.filter(p => p.error).length;
        const avgResponseTime = discovery.coverage?.avgResponseTime || 0;
        const performanceGrade = discovery.coverage?.performanceGrade || 'N/A';
        
        console.log(`✅ ${role.padEnd(15)}: ${accessibleCount}/${discovery.discoveredPaths.length} accessible, avg: ${avgResponseTime}ms, grade: ${performanceGrade}`);
        
        totalPaths += discovery.discoveredPaths.length;
        totalAccessible += accessibleCount;
        totalErrors += errorCount;
        
        // Validate that the role processed at least some paths
        expect(discovery.discoveredPaths.length).toBeGreaterThan(0);
      } else {
        console.log(`❌ ${role}: Failed to process`);
      }
    }
    
    // Performance validations
    const successfulRoles = Object.keys(navigationMap).length;
    const successRate = (successfulRoles / expectedRoles.length) * 100;
    
    console.log('\n📈 PERFORMANCE METRICS:');
    console.log(`Success Rate: ${successRate.toFixed(1)}% (${successfulRoles}/${expectedRoles.length} roles)`);
    console.log(`Total Paths: ${totalPaths} (${totalAccessible} accessible, ${totalErrors} errors)`);
    console.log(`Execution Time: ${totalExecutionTime}ms (${(totalExecutionTime/1000).toFixed(1)}s)`);
    console.log(`Performance: ${(totalPaths / (totalExecutionTime/1000)).toFixed(1)} paths/second`);
    
    // Generate intelligent reports
    await crawler.generateIntelligentReports(navigationMap);
    
    // Validate performance improvements over basic crawler
    expect(totalExecutionTime).toBeLessThan(60000); // Should complete in under 1 minute
    expect(successRate).toBeGreaterThan(70); // Should have >70% success rate
    expect(totalAccessible).toBeGreaterThan(20); // Should find >20 accessible paths
    
    console.log('\n🎯 Intelligent navigation discovery completed successfully!');
  });

  test('Performance Analysis and Reporting', async () => {
    console.log('📊 Analyzing performance reports...');
    
    // Read the generated performance report
    const performanceReport = await fs.readFile(
      'results/intelligent-performance-report.json',
      'utf8'
    );
    
    const report = JSON.parse(performanceReport);
    
    console.log('\n⚡ PERFORMANCE ANALYSIS:');
    console.log('========================================');
    console.log(`Total Execution: ${report.executionSummary.totalExecutionTime}ms`);
    console.log(`Context Creation: ${report.executionSummary.contextCreationTime}ms`);
    console.log(`Crawling Time: ${report.executionSummary.crawlingTime}ms`);
    console.log(`Report Generation: ${report.executionSummary.reportGenerationTime}ms`);
    console.log(`Success Rate: ${report.executionSummary.successRate.toFixed(1)}%`);
    
    console.log('\n📈 EFFICIENCY METRICS:');
    console.log(`Roles per minute: ${report.efficiency.rolesPerMinute}`);
    console.log(`Paths per minute: ${report.efficiency.pathsPerMinute}`);
    console.log(`Screenshots per minute: ${report.efficiency.screenshotsPerMinute}`);
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      report.recommendations.forEach((rec: string, i: number) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
    }
    
    // Performance should be significantly better than basic crawler
    expect(report.executionSummary.totalExecutionTime).toBeLessThan(60000);
    expect(report.executionSummary.successRate).toBeGreaterThan(70);
    
    console.log('✅ Performance analysis completed');
  });

  test('Intelligent Insights and Security Analysis', async () => {
    console.log('🔍 Analyzing intelligent insights...');
    
    // Read the generated insights report
    const insightsReport = await fs.readFile(
      'results/intelligent-insights.json',
      'utf8'
    );
    
    const insights = JSON.parse(insightsReport);
    
    console.log('\n🧠 ROLE ANALYSIS:');
    console.log('==============================');
    Object.entries(insights.roleAnalysis).forEach(([role, analysis]: [string, any]) => {
      console.log(`${role.padEnd(15)}: ${analysis.accessCount} paths, ${analysis.avgResponseTime}ms avg, grade ${analysis.performanceGrade}`);
    });
    
    console.log('\n🔒 SECURITY FINDINGS:');
    console.log('===========================');
    if (insights.securityFindings.length > 0) {
      insights.securityFindings.forEach((finding: any, i: number) => {
        console.log(`${i + 1}. [${finding.severity.toUpperCase()}] ${finding.type}`);
        console.log(`   Role: ${finding.role}, Path: ${finding.path}`);
        console.log(`   Description: ${finding.description}`);
      });
    } else {
      console.log('✅ No critical security issues detected');
    }
    
    console.log('\n⚡ PERFORMANCE INSIGHTS:');
    console.log('==============================');
    console.log(`Average Response Time: ${insights.performanceInsights.averageResponseTime.toFixed(1)}ms`);
    console.log(`Error Rate: ${insights.performanceInsights.errorRate.toFixed(1)}%`);
    
    if (insights.performanceInsights.slowestPath) {
      console.log(`Slowest Path: ${insights.performanceInsights.slowestPath.path} (${insights.performanceInsights.slowestPath.responseTime}ms)`);
    }
    
    if (insights.performanceInsights.fastestPath) {
      console.log(`Fastest Path: ${insights.performanceInsights.fastestPath.path} (${insights.performanceInsights.fastestPath.responseTime}ms)`);
    }
    
    console.log('\n💡 ACTIONABLE RECOMMENDATIONS:');
    console.log('=====================================');
    insights.recommendations.forEach((rec: string, i: number) => {
      console.log(`${i + 1}. ${rec}`);
    });
    
    // Validate that we have meaningful insights
    expect(Object.keys(insights.roleAnalysis).length).toBeGreaterThan(0);
    expect(insights.recommendations.length).toBeGreaterThan(0);
    expect(insights.performanceInsights.averageResponseTime).toBeGreaterThan(0);
    
    console.log('\n✅ Intelligent insights analysis completed');
  });

  test('Compare Performance vs Basic Crawler', async () => {
    console.log('⚖️ Comparing intelligent vs basic crawler performance...');
    
    // Read both performance reports if they exist
    let basicResults = null;
    let intelligentResults = null;
    
    try {
      const basicReport = await fs.readFile('results/test-results.json', 'utf8');
      basicResults = JSON.parse(basicReport);
    } catch {
      console.log('ℹ️ Basic crawler results not found - skipping comparison');
    }
    
    try {
      const intelligentReport = await fs.readFile('results/intelligent-performance-report.json', 'utf8');
      intelligentResults = JSON.parse(intelligentReport);
    } catch {
      console.log('❌ Intelligent crawler results not found');
    }
    
    if (basicResults && intelligentResults) {
      console.log('\n📊 PERFORMANCE COMPARISON:');
      console.log('=======================================');
      console.log(`Basic Crawler Success Rate: ${basicResults.stats?.successRate || 'N/A'}%`);
      console.log(`Intelligent Crawler Success Rate: ${intelligentResults.executionSummary.successRate.toFixed(1)}%`);
      
      const basicTime = basicResults.stats?.duration || 0;
      const intelligentTime = intelligentResults.executionSummary.totalExecutionTime;
      
      console.log(`Basic Crawler Time: ${basicTime}ms`);
      console.log(`Intelligent Crawler Time: ${intelligentTime}ms`);
      
      if (basicTime > 0) {
        const improvement = ((basicTime - intelligentTime) / basicTime) * 100;
        console.log(`Performance Improvement: ${improvement.toFixed(1)}% ${improvement > 0 ? 'faster' : 'slower'}`);
      }
    }
    
    console.log('✅ Performance comparison completed');
  });
});