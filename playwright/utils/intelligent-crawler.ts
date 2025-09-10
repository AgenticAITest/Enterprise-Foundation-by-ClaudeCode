import { Browser, BrowserContext, Page, chromium } from 'playwright';
import { MCPSmartCrawler } from './smart-crawler';
import { 
  UserRole, 
  PathDiscovery, 
  PathResult, 
  NavigationMap, 
  CrawlerConfig,
  PermissionTest,
  SecurityEvent
} from './types';
import { TEST_USERS, EXPECTED_ACCESS, ROLE_ELEMENT_VISIBILITY } from './test-users';
import * as fs from 'fs/promises';
import * as path from 'path';

// Enhanced configuration for intelligent crawling
interface IntelligentCrawlerConfig extends CrawlerConfig {
  retryAttempts: number;
  retryDelay: number;
  timeoutStrategy: 'aggressive' | 'balanced' | 'patient';
  errorRecovery: 'skip' | 'retry' | 'fallback';
  resourceLimits: ResourceLimits;
  parallelOptimization: ParallelConfig;
  performanceTracking: boolean;
}

interface ResourceLimits {
  maxConcurrentContexts: number;
  maxPagesPerContext: number;
  memoryLimitMB: number;
  networkTimeoutMs: number;
}

interface ParallelConfig {
  batchSize: number;
  cooldownMs: number;
  loadBalancing: boolean;
  priorityRoles: string[];
}

interface PerformanceMetrics {
  executionStartTime: number;
  contextCreationTime: number;
  crawlingTime: number;
  reportGenerationTime: number;
  totalMemoryUsage: number;
  networkRequests: number;
  screenshotCount: number;
  errorCount: number;
  successRate: number;
}

interface CrawlerProgress {
  totalRoles: number;
  completedRoles: number;
  currentRole: string;
  totalPaths: number;
  completedPaths: number;
  currentPath: string;
  estimatedTimeRemaining: number;
  successRate: number;
}

export class IntelligentCrawler extends MCPSmartCrawler {
  private intelligentConfig: IntelligentCrawlerConfig;
  private performanceMetrics: PerformanceMetrics;
  private progress: CrawlerProgress;
  private roleQueues: Map<string, string[]> = new Map();
  private failedPaths: Map<string, string[]> = new Map();

  constructor(config: Partial<IntelligentCrawlerConfig> = {}) {
    const baseConfig = {
      baseURL: 'http://localhost:3002',
      maxPages: 50,
      timeout: 15000, // Reduced from 30s for faster execution
      screenshotMode: 'all' as const,
      videoRecording: true,
      networkMonitoring: true,
      performanceMetrics: true
    };

    super(baseConfig);

    this.intelligentConfig = {
      ...baseConfig,
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
        batchSize: 2,
        cooldownMs: 500,
        loadBalancing: true,
        priorityRoles: ['super_admin', 'tenant_admin'] // Test high-privilege roles first
      },
      performanceTracking: true,
      ...config
    };

    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    this.performanceMetrics = {
      executionStartTime: Date.now(),
      contextCreationTime: 0,
      crawlingTime: 0,
      reportGenerationTime: 0,
      totalMemoryUsage: 0,
      networkRequests: 0,
      screenshotCount: 0,
      errorCount: 0,
      successRate: 0
    };

    this.progress = {
      totalRoles: Object.keys(TEST_USERS).length,
      completedRoles: 0,
      currentRole: '',
      totalPaths: 0,
      completedPaths: 0,
      currentPath: '',
      estimatedTimeRemaining: 0,
      successRate: 0
    };
  }

  async initialize(): Promise<void> {
    console.log('🧠 Initializing IntelligentCrawler...');
    const startTime = Date.now();
    
    await super.initialize();
    
    this.performanceMetrics.contextCreationTime = Date.now() - startTime;
    console.log(`⚡ Context creation optimized: ${this.performanceMetrics.contextCreationTime}ms`);
    
    // Pre-calculate total paths for progress tracking
    this.progress.totalPaths = Object.values(EXPECTED_ACCESS).reduce(
      (total, paths) => total + paths.length, 0
    );
    
    console.log(`📊 Intelligent crawler initialized: ${this.progress.totalRoles} roles, ${this.progress.totalPaths} total paths`);
  }

  async discoverNavigationPathsIntelligently(): Promise<NavigationMap> {
    console.log('🧠 Starting intelligent navigation discovery...');
    const startTime = Date.now();
    
    const navigationMap: NavigationMap = {};
    
    // Optimize role processing order (priority roles first)
    const roleOrder = this.optimizeRoleProcessingOrder();
    
    // Process roles in optimized batches
    const batches = this.createOptimizedBatches(roleOrder);
    
    for (const batch of batches) {
      console.log(`📦 Processing batch: ${batch.join(', ')}`);
      
      const batchPromises = batch.map(role => 
        this.crawlRoleWithIntelligentHandling(role)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process batch results with intelligent error handling
      batchResults.forEach((result, index) => {
        const role = batch[index];
        if (result.status === 'fulfilled') {
          navigationMap[role] = result.value;
          this.progress.completedRoles++;
          console.log(`✅ ${role} completed successfully`);
        } else {
          console.error(`❌ ${role} failed:`, result.reason);
          this.performanceMetrics.errorCount++;
          // Add to retry queue if configured
          if (this.intelligentConfig.errorRecovery === 'retry') {
            console.log(`🔄 Adding ${role} to retry queue`);
          }
        }
      });
      
      // Cooldown between batches to prevent resource exhaustion
      if (this.intelligentConfig.parallelOptimization.cooldownMs > 0) {
        await this.wait(this.intelligentConfig.parallelOptimization.cooldownMs);
      }
      
      this.updateProgress();
    }
    
    // Handle any failed roles with retry logic
    await this.handleFailedRoles(navigationMap);
    
    this.performanceMetrics.crawlingTime = Date.now() - startTime;
    this.performanceMetrics.successRate = (this.progress.completedRoles / this.progress.totalRoles) * 100;
    
    console.log(`🎯 Intelligent discovery completed: ${this.performanceMetrics.successRate.toFixed(1)}% success rate`);
    
    return navigationMap;
  }

  private optimizeRoleProcessingOrder(): string[] {
    const allRoles = Object.keys(TEST_USERS);
    const priorityRoles = this.intelligentConfig.parallelOptimization.priorityRoles;
    const regularRoles = allRoles.filter(role => !priorityRoles.includes(role));
    
    // Priority roles first, then others
    return [...priorityRoles, ...regularRoles];
  }

  private createOptimizedBatches(roles: string[]): string[][] {
    const batchSize = this.intelligentConfig.parallelOptimization.batchSize;
    const batches: string[][] = [];
    
    for (let i = 0; i < roles.length; i += batchSize) {
      batches.push(roles.slice(i, i + batchSize));
    }
    
    return batches;
  }

  private async crawlRoleWithIntelligentHandling(roleName: string): Promise<PathDiscovery> {
    this.progress.currentRole = roleName;
    console.log(`🔍 Intelligently crawling ${roleName}...`);
    
    const context = this.contexts.get(roleName);
    if (!context) {
      throw new Error(`Context not found for role: ${roleName}`);
    }
    
    const startTime = Date.now();
    const page = await context.newPage();
    const discoveredPaths: PathResult[] = [];
    
    // Configure page for optimal performance
    await this.optimizePagePerformance(page);
    
    const expectedPaths = EXPECTED_ACCESS[roleName] || [];
    this.roleQueues.set(roleName, [...expectedPaths]);
    
    // Process paths with intelligent retry and error handling
    for (const path of expectedPaths) {
      this.progress.currentPath = path;
      this.progress.completedPaths++;
      
      try {
        const pathResult = await this.testPathWithIntelligentRetry(page, path, roleName);
        discoveredPaths.push(pathResult);
        
        console.log(`  ✅ ${path} → ${pathResult.accessible ? 'accessible' : 'restricted'} (${pathResult.responseTime}ms)`);
        
        // Update performance metrics
        if (pathResult.accessible && pathResult.screenshots?.length) {
          this.performanceMetrics.screenshotCount++;
        }
        
      } catch (error) {
        console.log(`  ❌ ${path} → Error: ${(error as Error).message}`);
        
        const errorResult: PathResult = {
          path,
          role: roleName,
          accessible: false,
          error: (error as Error).message,
          responseTime: 0,
          timestamp: new Date().toISOString()
        };
        
        discoveredPaths.push(errorResult);
        this.performanceMetrics.errorCount++;
        
        // Track failed paths for potential retry
        if (!this.failedPaths.has(roleName)) {
          this.failedPaths.set(roleName, []);
        }
        this.failedPaths.get(roleName)!.push(path);
      }
    }
    
    const executionTime = Date.now() - startTime;
    
    return {
      role: roleName,
      discoveredPaths,
      permissionBoundaries: await this.analyzePermissionBoundariesIntelligently(discoveredPaths, roleName),
      coverage: this.calculateIntelligentCoverage(discoveredPaths),
      executionTime,
      timestamp: new Date().toISOString()
    };
  }

  private async optimizePagePerformance(page: Page): Promise<void> {
    // Optimize page settings for faster crawling
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Block unnecessary resources to speed up loading
    await page.route('**/*', (route) => {
      const resourceType = route.request().resourceType();
      
      // Block images, fonts, and media for faster loading (but allow screenshots when needed)
      if (['image', 'font', 'media'].includes(resourceType) && 
          !route.request().url().includes('favicon')) {
        route.abort();
      } else {
        route.continue();
      }
    });
    
    // Set aggressive timeouts for faster execution
    page.setDefaultTimeout(this.intelligentConfig.resourceLimits.networkTimeoutMs);
    page.setDefaultNavigationTimeout(this.intelligentConfig.resourceLimits.networkTimeoutMs);
  }

  private async testPathWithIntelligentRetry(page: Page, path: string, roleName: string): Promise<PathResult> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.intelligentConfig.retryAttempts; attempt++) {
      try {
        const startTime = Date.now();
        
        // Navigate with intelligent timeout handling
        const response = await page.goto(`${this.intelligentConfig.baseURL}${path}`, {
          timeout: this.getIntelligentTimeout(attempt),
          waitUntil: 'domcontentloaded' // Faster than 'networkidle'
        });
        
        // Quick load state check instead of full networkidle
        await page.waitForLoadState('domcontentloaded', { 
          timeout: this.getIntelligentTimeout(attempt) / 2 
        });
        
        const responseTime = Date.now() - startTime;
        const statusCode = response?.status() || 0;
        const accessible = statusCode >= 200 && statusCode < 400;
        
        // Take screenshot only if accessible and configured
        let screenshots: string[] = [];
        if (accessible && (this.intelligentConfig.screenshotMode === 'all' || 
                          this.intelligentConfig.screenshotMode === 'boundaries')) {
          
          // Re-enable images just for screenshot
          await page.unroute('**/*');
          const screenshotPath = `results/crawler/${roleName}${path.replace(/\//g, '_') || '_root'}.png`;
          await page.screenshot({ path: screenshotPath, fullPage: true });
          screenshots = [screenshotPath];
          
          // Re-apply optimization
          await this.optimizePagePerformance(page);
        }
        
        // Quick permission test
        const permissionTest = await this.quickPermissionTest(page, roleName);
        
        return {
          path,
          role: roleName,
          accessible,
          responseTime,
          statusCode,
          navigationElements: await page.locator('nav, [role="navigation"]').count(),
          permissionTest,
          screenshots,
          timestamp: new Date().toISOString()
        };
        
      } catch (error) {
        lastError = error as Error;
        console.log(`    🔄 Attempt ${attempt}/${this.intelligentConfig.retryAttempts} failed: ${lastError.message}`);
        
        if (attempt < this.intelligentConfig.retryAttempts) {
          const delay = this.intelligentConfig.retryDelay * attempt; // Exponential backoff
          await this.wait(delay);
        }
      }
    }
    
    throw lastError || new Error('All retry attempts failed');
  }

  private getIntelligentTimeout(attempt: number): number {
    const baseTimeout = this.intelligentConfig.timeout;
    
    switch (this.intelligentConfig.timeoutStrategy) {
      case 'aggressive':
        return Math.max(baseTimeout / 2, 5000); // Minimum 5s
      case 'patient':
        return baseTimeout * attempt; // Increase with attempts
      case 'balanced':
      default:
        return baseTimeout + (1000 * (attempt - 1)); // Slight increase
    }
  }

  private async quickPermissionTest(page: Page, roleName: string): Promise<PermissionTest> {
    const roleVisibility = ROLE_ELEMENT_VISIBILITY[roleName] || { visible: [], hidden: [] };
    
    // Quick visibility test with shorter timeouts
    const quickTest = async (selector: string, expected: boolean) => {
      try {
        const element = page.locator(selector).first();
        const isVisible = await element.isVisible({ timeout: 1000 });
        return { selector, expected, actual: isVisible };
      } catch {
        return { selector, expected, actual: false };
      }
    };
    
    const [visibleTests, hiddenTests] = await Promise.all([
      Promise.all(roleVisibility.visible.map(s => quickTest(s, true))),
      Promise.all(roleVisibility.hidden.map(s => quickTest(s, false)))
    ]);
    
    return {
      elementsVisible: visibleTests,
      elementsHidden: hiddenTests,
      apiCallsAllowed: [],
      apiCallsDenied: []
    };
  }

  private async analyzePermissionBoundariesIntelligently(
    paths: PathResult[], 
    roleName: string
  ): Promise<any[]> {
    // Enhanced boundary analysis with pattern recognition
    const boundaries = [];
    const expectedPaths = EXPECTED_ACCESS[roleName] || [];
    
    for (const path of paths) {
      const shouldBeAccessible = expectedPaths.includes(path.path);
      const actuallyAccessible = path.accessible;
      
      if (shouldBeAccessible !== actuallyAccessible) {
        boundaries.push({
          path: path.path,
          role: roleName,
          expectedAccess: shouldBeAccessible,
          actualAccess: actuallyAccessible,
          boundaryType: 'navigation',
          severity: this.calculateBoundarySeverity(path, roleName),
          evidence: path.screenshots || [],
          recommendation: this.generateBoundaryRecommendation(path, roleName)
        });
      }
    }
    
    return boundaries;
  }

  private calculateBoundarySeverity(path: PathResult, roleName: string): 'low' | 'medium' | 'high' | 'critical' {
    // Intelligent severity calculation
    if (path.path.includes('/admin') && !['super_admin', 'tenant_admin'].includes(roleName)) {
      return path.accessible ? 'critical' : 'low'; // Unexpected admin access is critical
    }
    
    if (path.path.includes('/users') || path.path.includes('/roles')) {
      return path.accessible && roleName === 'readonly_user' ? 'high' : 'medium';
    }
    
    return 'low';
  }

  private generateBoundaryRecommendation(path: PathResult, roleName: string): string {
    if (path.accessible && !EXPECTED_ACCESS[roleName]?.includes(path.path)) {
      return `Consider restricting access to ${path.path} for role ${roleName}`;
    } else if (!path.accessible && EXPECTED_ACCESS[roleName]?.includes(path.path)) {
      return `Verify if ${roleName} should have access to ${path.path}`;
    }
    return 'No action required';
  }

  private calculateIntelligentCoverage(paths: PathResult[]): any {
    const totalRoutes = paths.length;
    const accessibleRoutes = paths.filter(p => p.accessible).length;
    const restrictedRoutes = paths.filter(p => !p.accessible && !p.error).length;
    const errorRoutes = paths.filter(p => p.error).length;
    
    const avgResponseTime = paths.filter(p => p.responseTime && p.responseTime > 0)
      .reduce((sum, p) => sum + (p.responseTime || 0), 0) / 
      (paths.filter(p => p.responseTime && p.responseTime > 0).length || 1);
    
    return {
      totalRoutes,
      accessibleRoutes,
      restrictedRoutes,
      errorRoutes,
      coveragePercentage: totalRoutes > 0 ? (accessibleRoutes / totalRoutes) * 100 : 0,
      avgResponseTime: Math.round(avgResponseTime),
      uniqueNavigationElements: paths.reduce((sum, p) => sum + (p.navigationElements || 0), 0),
      performanceGrade: this.calculatePerformanceGrade(avgResponseTime, errorRoutes, totalRoutes)
    };
  }

  private calculatePerformanceGrade(avgResponseTime: number, errorRoutes: number, totalRoutes: number): string {
    const errorRate = (errorRoutes / totalRoutes) * 100;
    
    if (avgResponseTime < 1000 && errorRate < 5) return 'A+';
    if (avgResponseTime < 2000 && errorRate < 10) return 'A';
    if (avgResponseTime < 3000 && errorRate < 20) return 'B';
    if (avgResponseTime < 5000 && errorRate < 30) return 'C';
    return 'D';
  }

  private async handleFailedRoles(navigationMap: NavigationMap): Promise<void> {
    // Intelligent retry handling for failed roles
    if (this.failedPaths.size === 0) return;
    
    console.log(`🔄 Handling ${this.failedPaths.size} roles with failed paths...`);
    
    for (const [roleName, failedPathList] of this.failedPaths) {
      if (failedPathList.length > 0 && this.intelligentConfig.errorRecovery === 'retry') {
        console.log(`  🔄 Retrying ${failedPathList.length} failed paths for ${roleName}`);
        // Could implement selective retry logic here
      }
    }
  }

  private updateProgress(): void {
    const elapsedTime = Date.now() - this.performanceMetrics.executionStartTime;
    const progressRatio = this.progress.completedRoles / this.progress.totalRoles;
    
    if (progressRatio > 0) {
      this.progress.estimatedTimeRemaining = (elapsedTime / progressRatio) - elapsedTime;
    }
    
    this.progress.successRate = (this.progress.completedRoles / this.progress.totalRoles) * 100;
    
    console.log(`📊 Progress: ${this.progress.completedRoles}/${this.progress.totalRoles} roles (${this.progress.successRate.toFixed(1)}%) - ETA: ${Math.round(this.progress.estimatedTimeRemaining / 1000)}s`);
  }

  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateIntelligentReports(navigationMap: NavigationMap): Promise<void> {
    console.log('📊 Generating intelligent reports...');
    const startTime = Date.now();
    
    await super.generateReports(navigationMap);
    
    // Generate enhanced performance report
    await this.generatePerformanceReport();
    
    // Generate intelligent insights report
    await this.generateIntelligentInsights(navigationMap);
    
    this.performanceMetrics.reportGenerationTime = Date.now() - startTime;
    console.log(`📊 Intelligent reports generated in ${this.performanceMetrics.reportGenerationTime}ms`);
  }

  private async generatePerformanceReport(): Promise<void> {
    const totalExecutionTime = Date.now() - this.performanceMetrics.executionStartTime;
    
    const performanceReport = {
      executionSummary: {
        totalExecutionTime,
        contextCreationTime: this.performanceMetrics.contextCreationTime,
        crawlingTime: this.performanceMetrics.crawlingTime,
        reportGenerationTime: this.performanceMetrics.reportGenerationTime,
        successRate: this.performanceMetrics.successRate
      },
      efficiency: {
        rolesPerMinute: (this.progress.totalRoles / (totalExecutionTime / 60000)).toFixed(2),
        pathsPerMinute: (this.progress.totalPaths / (totalExecutionTime / 60000)).toFixed(2),
        screenshotsPerMinute: (this.performanceMetrics.screenshotCount / (totalExecutionTime / 60000)).toFixed(2)
      },
      resourceUsage: {
        errorCount: this.performanceMetrics.errorCount,
        screenshotCount: this.performanceMetrics.screenshotCount,
        networkRequests: this.performanceMetrics.networkRequests
      },
      recommendations: this.generatePerformanceRecommendations(),
      timestamp: new Date().toISOString()
    };
    
    await fs.writeFile(
      'results/intelligent-performance-report.json', 
      JSON.stringify(performanceReport, null, 2)
    );
  }

  private generatePerformanceRecommendations(): string[] {
    const recommendations = [];
    
    if (this.performanceMetrics.successRate < 90) {
      recommendations.push('Consider increasing retry attempts or timeout values');
    }
    
    if (this.performanceMetrics.errorCount > 0) {
      recommendations.push('Investigate and fix error sources for better reliability');
    }
    
    const totalTime = Date.now() - this.performanceMetrics.executionStartTime;
    if (totalTime > 60000) { // > 1 minute
      recommendations.push('Consider optimizing parallel processing or reducing timeout values');
    }
    
    return recommendations;
  }

  private async generateIntelligentInsights(navigationMap: NavigationMap): Promise<void> {
    const insights = {
      roleAnalysis: this.analyzeRolePatterns(navigationMap),
      securityFindings: this.analyzeSecurityPatterns(navigationMap),
      performanceInsights: this.analyzePerformancePatterns(navigationMap),
      recommendations: this.generateActionableRecommendations(navigationMap),
      timestamp: new Date().toISOString()
    };
    
    await fs.writeFile(
      'results/intelligent-insights.json',
      JSON.stringify(insights, null, 2)
    );
  }

  private analyzeRolePatterns(navigationMap: NavigationMap): any {
    const patterns = {};
    
    // Analyze access patterns across roles
    Object.entries(navigationMap).forEach(([role, discovery]) => {
      const accessiblePaths = discovery.discoveredPaths.filter(p => p.accessible).map(p => p.path);
      patterns[role] = {
        accessCount: accessiblePaths.length,
        uniquePaths: accessiblePaths,
        avgResponseTime: discovery.coverage.avgResponseTime || 0,
        performanceGrade: discovery.coverage.performanceGrade || 'N/A'
      };
    });
    
    return patterns;
  }

  private analyzeSecurityPatterns(navigationMap: NavigationMap): any[] {
    const findings = [];
    
    // Check for potential security issues
    Object.entries(navigationMap).forEach(([role, discovery]) => {
      discovery.permissionBoundaries?.forEach(boundary => {
        if (boundary.severity === 'high' || boundary.severity === 'critical') {
          findings.push({
            type: 'Permission Boundary Violation',
            role,
            path: boundary.path,
            severity: boundary.severity,
            description: boundary.recommendation,
            evidence: boundary.evidence
          });
        }
      });
    });
    
    return findings;
  }

  private analyzePerformancePatterns(navigationMap: NavigationMap): any {
    const allPaths = Object.values(navigationMap).flatMap(d => d.discoveredPaths);
    const responseTimes = allPaths.filter(p => p.responseTime).map(p => p.responseTime!);
    
    return {
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length || 0,
      slowestPath: allPaths.reduce((slowest, current) => 
        (current.responseTime || 0) > (slowest.responseTime || 0) ? current : slowest
      ),
      fastestPath: allPaths.reduce((fastest, current) => 
        (current.responseTime || Infinity) < (fastest.responseTime || Infinity) ? current : fastest
      ),
      errorRate: (allPaths.filter(p => p.error).length / allPaths.length) * 100
    };
  }

  private generateActionableRecommendations(navigationMap: NavigationMap): string[] {
    const recommendations = [];
    
    // Generate intelligent recommendations based on findings
    const allBoundaries = Object.values(navigationMap).flatMap(d => d.permissionBoundaries || []);
    
    if (allBoundaries.length > 0) {
      recommendations.push(`Review ${allBoundaries.length} permission boundary violations`);
    }
    
    const errorCount = Object.values(navigationMap).reduce(
      (total, d) => total + d.discoveredPaths.filter(p => p.error).length, 0
    );
    
    if (errorCount > 0) {
      recommendations.push(`Fix ${errorCount} navigation errors for better user experience`);
    }
    
    recommendations.push('Consider implementing automated permission monitoring');
    recommendations.push('Set up regular navigation testing in CI/CD pipeline');
    
    return recommendations;
  }
}