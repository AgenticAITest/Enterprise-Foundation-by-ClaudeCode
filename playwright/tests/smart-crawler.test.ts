import { test, expect } from '@playwright/test';
import { MCPSmartCrawler } from '../utils/smart-crawler';
import * as fs from 'fs/promises';
import * as path from 'path';

test.describe('Smart Crawler - Multi-Role Navigation Discovery', () => {
  let crawler: MCPSmartCrawler;

  test.beforeAll(async () => {
    // Initialize the smart crawler
    crawler = new MCPSmartCrawler({
      baseURL: 'http://localhost:3002',
      maxPages: 30, // Limit for initial testing
      timeout: 15000,
      screenshotMode: 'all',
      videoRecording: true,
      networkMonitoring: true,
      performanceMetrics: true
    });

    await crawler.initialize();
  });

  test.afterAll(async () => {
    if (crawler) {
      await crawler.cleanup();
    }
  });

  test('Multi-Role Navigation Discovery', async () => {
    console.log('🚀 Starting comprehensive navigation discovery...');
    
    const startTime = Date.now();
    
    // Discover navigation paths for all roles simultaneously
    const navigationMap = await crawler.discoverNavigationPaths();
    
    const totalExecutionTime = Date.now() - startTime;
    console.log(`⏱️  Total execution time: ${totalExecutionTime}ms`);
    
    // Validate that all roles were tested
    const expectedRoles = ['super_admin', 'tenant_admin', 'module_admin', 'wms_user', 'accounting_user', 'readonly_user'];
    
    for (const role of expectedRoles) {
      expect(navigationMap[role]).toBeDefined();
      expect(navigationMap[role].discoveredPaths.length).toBeGreaterThan(0);
      
      console.log(`✅ ${role}: ${navigationMap[role].discoveredPaths.length} paths discovered`);
    }
    
    // Generate comprehensive reports
    await crawler.generateReports(navigationMap);
    
    // Validate key findings
    await validateCrawlerResults(navigationMap);
    
    console.log('🎯 Navigation discovery completed successfully');
  });

  test('Permission Boundary Analysis', async () => {
    console.log('🔍 Analyzing permission boundaries...');
    
    // Read the generated reports
    const comparisonReport = await fs.readFile(
      path.join(process.cwd(), 'results', 'crawler', 'comparison-report.json'),
      'utf8'
    );
    
    const report = JSON.parse(comparisonReport);
    
    // Validate permission boundaries
    for (const roleResult of report.roleComparison) {
      console.log(`🛡️  ${roleResult.role}: ${roleResult.violationCount} permission violations`);
      
      // Super admin should have the highest access
      if (roleResult.role === 'super_admin') {
        expect(roleResult.accessibleCount).toBeGreaterThan(10);
      }
      
      // Readonly user should have the lowest access
      if (roleResult.role === 'readonly_user') {
        expect(roleResult.accessibleCount).toBeLessThan(5);
      }
    }
  });

  test('Security Events Detection', async () => {
    console.log('🚨 Analyzing security events...');
    
    // Read security events report
    const securityReport = await fs.readFile(
      path.join(process.cwd(), 'results', 'crawler', 'security-events.json'), 
      'utf8'
    );
    
    const report = JSON.parse(securityReport);
    
    console.log(`🔍 Total security events: ${report.summary.totalEvents}`);
    console.log(`🚨 Critical events: ${report.summary.criticalEvents}`);
    console.log(`⚠️  High events: ${report.summary.highEvents}`);
    
    // Critical security events should be investigated
    if (report.summary.criticalEvents > 0) {
      console.log('🚨 CRITICAL: Security vulnerabilities detected!');
      
      const criticalEvents = report.events.filter((e: any) => e.severity === 'critical');
      for (const event of criticalEvents) {
        console.log(`  - ${event.message} (${event.details.role})`);
      }
    }
    
    // Should not have any critical vulnerabilities in a secure system
    expect(report.summary.criticalEvents).toBe(0);
  });

  test('Coverage Analysis', async () => {
    console.log('📊 Analyzing coverage metrics...');
    
    const comparisonReport = await fs.readFile(
      path.join(process.cwd(), 'results', 'crawler', 'comparison-report.json'),
      'utf8'
    );
    
    const report = JSON.parse(comparisonReport);
    
    // Validate coverage expectations
    const superAdminResult = report.roleComparison.find((r: any) => r.role === 'super_admin');
    const readonlyResult = report.roleComparison.find((r: any) => r.role === 'readonly_user');
    
    // Super admin should have high coverage
    expect(superAdminResult.coveragePercentage).toBeGreaterThan(80);
    
    // Readonly user should have limited but consistent access  
    expect(readonlyResult.coveragePercentage).toBeGreaterThan(50);
    expect(readonlyResult.coveragePercentage).toBeLessThan(superAdminResult.coveragePercentage);
    
    console.log('✅ Coverage analysis completed');
  });
});

async function validateCrawlerResults(navigationMap: any): Promise<void> {
  console.log('🧪 Validating crawler results...');
  
  // Test hierarchical access patterns
  const roleHierarchy = ['readonly_user', 'wms_user', 'accounting_user', 'module_admin', 'tenant_admin', 'super_admin'];
  
  for (let i = 1; i < roleHierarchy.length; i++) {
    const lowerRole = roleHierarchy[i - 1];
    const higherRole = roleHierarchy[i];
    
    const lowerAccess = navigationMap[lowerRole].discoveredPaths.filter((p: any) => p.accessible).length;
    const higherAccess = navigationMap[higherRole].discoveredPaths.filter((p: any) => p.accessible).length;
    
    console.log(`🔍 Access comparison: ${lowerRole}(${lowerAccess}) vs ${higherRole}(${higherAccess})`);
    
    // Higher roles should generally have more access (with some exceptions for specialized roles)
    if (!['wms_user', 'accounting_user'].includes(lowerRole)) {
      expect(higherAccess).toBeGreaterThanOrEqual(lowerAccess);
    }
  }
  
  // Validate role-specific access patterns
  const wmsUser = navigationMap['wms_user'];
  const accountingUser = navigationMap['accounting_user'];
  
  // WMS user should have different access than accounting user (specialized roles)
  const wmsAccessiblePaths = wmsUser.discoveredPaths.filter((p: any) => p.accessible).map((p: any) => p.path);
  const accountingAccessiblePaths = accountingUser.discoveredPaths.filter((p: any) => p.accessible).map((p: any) => p.path);
  
  console.log(`🏭 WMS accessible paths: ${wmsAccessiblePaths.length}`);
  console.log(`💰 Accounting accessible paths: ${accountingAccessiblePaths.length}`);
  
  // Both should have some unique access patterns
  const commonPaths = wmsAccessiblePaths.filter(path => accountingAccessiblePaths.includes(path));
  const uniqueToWMS = wmsAccessiblePaths.filter(path => !accountingAccessiblePaths.includes(path));
  const uniqueToAccounting = accountingAccessiblePaths.filter(path => !wmsAccessiblePaths.includes(path));
  
  console.log(`🤝 Common paths: ${commonPaths.length}`);
  console.log(`🏭 WMS unique: ${uniqueToWMS.length}`);
  console.log(`💰 Accounting unique: ${uniqueToAccounting.length}`);
  
  expect(uniqueToWMS.length + uniqueToAccounting.length).toBeGreaterThan(0);
  
  console.log('✅ Crawler results validation completed');
}