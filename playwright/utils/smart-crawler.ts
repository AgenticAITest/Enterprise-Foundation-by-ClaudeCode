import { Browser, BrowserContext, Page, chromium } from 'playwright';
import { 
  UserRole, 
  PathDiscovery, 
  PathResult, 
  NavigationMap, 
  CrawlerConfig,
  PermissionTest,
  ElementVisibility,
  APIAccess,
  CoverageAnalysis,
  SecurityEvent
} from './types';
import { TEST_USERS, EXPECTED_ACCESS, ROLE_ELEMENT_VISIBILITY, API_ACCESS_MATRIX } from './test-users';
import * as fs from 'fs/promises';
import * as path from 'path';

export class MCPSmartCrawler {
  private browser: Browser | null = null;
  private contexts: Map<string, BrowserContext> = new Map();
  private config: CrawlerConfig;
  private securityEvents: SecurityEvent[] = [];

  constructor(config: Partial<CrawlerConfig> = {}) {
    this.config = {
      baseURL: 'http://localhost:3002',
      maxPages: 50,
      timeout: 30000,
      screenshotMode: 'all',
      videoRecording: true,
      networkMonitoring: true,
      performanceMetrics: true,
      ...config
    };
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initializing MCPSmartCrawler...');
    
    // Launch browser with optimal settings
    this.browser = await chromium.launch({
      headless: false, // Visual feedback during crawling
      slowMo: 100,     // Slow down for analysis
      args: [
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--no-sandbox'
      ]
    });

    console.log('✅ Browser launched successfully');
    await this.initializeUserContexts();
  }

  private async initializeUserContexts(): Promise<void> {
    console.log('🔧 Setting up user contexts...');
    
    for (const [roleName, userConfig] of Object.entries(TEST_USERS)) {
      const contextDir = path.join(process.cwd(), 'results', 'crawler', roleName);
      
      // Ensure results directory exists
      await fs.mkdir(contextDir, { recursive: true });

      // Create isolated browser context for each role
      const context = await this.browser!.newContext({
        viewport: { width: 1920, height: 1080 },
        permissions: ['notifications'],
        recordVideo: this.config.videoRecording ? { 
          dir: contextDir,
          size: { width: 1920, height: 1080 }
        } : undefined,
        ignoreHTTPSErrors: true
      });

      // Set up network monitoring for this context
      if (this.config.networkMonitoring) {
        await this.setupNetworkMonitoring(context, roleName);
      }

      // Set up console monitoring
      context.on('page', (page) => {
        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            this.securityEvents.push({
              type: 'console_error',
              severity: 'medium',
              message: msg.text(),
              details: { role: roleName, url: page.url() },
              timestamp: new Date().toISOString(),
              evidence: [`Console error for ${roleName}`]
            });
          }
        });
      });

      this.contexts.set(roleName, context);
      console.log(`✅ Context created for ${roleName}`);
    }

    console.log(`🎯 All ${this.contexts.size} user contexts initialized`);
  }

  private async setupNetworkMonitoring(context: BrowserContext, roleName: string): Promise<void> {
    context.route('**/*', async (route) => {
      const request = route.request();
      
      // Monitor API calls for permission analysis
      if (request.url().includes('/api/')) {
        await this.logAPIPermissionCheck(request, roleName);
      }
      
      // Check for suspicious patterns in requests
      await this.detectSuspiciousRequests(request, roleName);
      
      await route.continue();
    });
  }

  private async logAPIPermissionCheck(request: any, roleName: string): Promise<void> {
    const method = request.method();
    const url = request.url();
    const endpoint = `${method} ${url.replace(this.config.baseURL, '')}`;
    
    const allowedEndpoints = API_ACCESS_MATRIX[roleName]?.allowed || [];
    const deniedEndpoints = API_ACCESS_MATRIX[roleName]?.denied || [];
    
    // Check if this API call should be allowed for this role
    const shouldBeAllowed = allowedEndpoints.some(pattern => 
      this.matchesPattern(endpoint, pattern)
    );
    
    const shouldBeDenied = deniedEndpoints.some(pattern =>
      this.matchesPattern(endpoint, pattern)  
    );

    if (shouldBeDenied || (!shouldBeAllowed && roleName !== 'super_admin')) {
      this.securityEvents.push({
        type: 'suspicious_request',
        severity: 'high',
        message: `Potentially unauthorized API access: ${endpoint}`,
        details: { 
          role: roleName, 
          endpoint, 
          shouldBeAllowed,
          shouldBeDenied 
        },
        timestamp: new Date().toISOString(),
        evidence: [`API access attempt by ${roleName}`]
      });
    }
  }

  private async detectSuspiciousRequests(request: any, roleName: string): Promise<void> {
    const url = request.url();
    const postData = request.postData() || '';
    
    // Suspicious patterns to detect
    const suspiciousPatterns = [
      /['"]\s*;\s*DROP\s+TABLE/i,
      /<script.*?>.*?<\/script>/i,
      /\$\{.*\}/,
      /\.\.\//,
      /javascript:/i,
      /eval\s*\(/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(url) || pattern.test(postData)) {
        this.securityEvents.push({
          type: 'suspicious_request',
          severity: 'critical',
          message: `Malicious pattern detected in request`,
          details: {
            role: roleName,
            url,
            pattern: pattern.toString(),
            postData: postData.substring(0, 200)
          },
          timestamp: new Date().toISOString(),
          evidence: [`Suspicious request by ${roleName}`]
        });
        break;
      }
    }
  }

  private matchesPattern(endpoint: string, pattern: string): boolean {
    // Convert API pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '\\?');
    
    return new RegExp(regexPattern, 'i').test(endpoint);
  }

  async discoverNavigationPaths(): Promise<NavigationMap> {
    console.log('🗺️  Starting navigation path discovery...');
    const navigationMap: NavigationMap = {};
    
    // Process each role in parallel for performance
    const crawlPromises = Array.from(this.contexts.entries()).map(
      ([roleName, context]) => this.crawlAsRole(context, roleName)
    );
    
    const results = await Promise.all(crawlPromises);
    
    // Build navigation map from results
    results.forEach(result => {
      navigationMap[result.role] = result;
    });
    
    console.log('✅ Navigation discovery completed');
    return navigationMap;
  }

  private async crawlAsRole(context: BrowserContext, roleName: string): Promise<PathDiscovery> {
    const startTime = Date.now();
    console.log(`🕷️  Crawling as ${roleName}...`);
    
    const page = await context.newPage();
    const discoveredPaths: PathResult[] = [];
    const visitedPaths = new Set<string>();
    
    // Start with authentication
    await this.authenticateAsRole(page, roleName);
    
    // Begin crawling from expected accessible routes
    const expectedRoutes = EXPECTED_ACCESS[roleName] || ['/'];
    const crawlQueue = [...expectedRoutes];
    
    while (crawlQueue.length > 0 && discoveredPaths.length < this.config.maxPages) {
      const currentPath = crawlQueue.shift()!;
      
      if (visitedPaths.has(currentPath)) continue;
      visitedPaths.add(currentPath);
      
      try {
        const pathResult = await this.testPath(page, currentPath, roleName);
        discoveredPaths.push(pathResult);
        
        // If path is accessible, discover additional links
        if (pathResult.accessible && pathResult.links) {
          pathResult.links.forEach(link => {
            if (!visitedPaths.has(link) && this.isInternalLink(link)) {
              crawlQueue.push(link);
            }
          });
        }
        
      } catch (error) {
        discoveredPaths.push({
          path: currentPath,
          role: roleName,
          accessible: false,
          error: (error as Error).message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    const executionTime = Date.now() - startTime;
    console.log(`✅ ${roleName} crawl completed: ${discoveredPaths.length} paths in ${executionTime}ms`);
    
    return {
      role: roleName,
      discoveredPaths,
      permissionBoundaries: await this.analyzePermissionBoundaries(discoveredPaths, roleName),
      coverage: this.calculateCoverage(discoveredPaths),
      executionTime,
      timestamp: new Date().toISOString()
    };
  }

  private async authenticateAsRole(page: Page, roleName: string): Promise<void> {
    const userConfig = TEST_USERS[roleName];
    
    try {
      // Navigate to login page
      await page.goto(`${this.config.baseURL}/login`);
      await page.waitForLoadState('networkidle');
      
      // Fill login form (assuming standard form structure)
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      const loginButton = page.locator('button[type="submit"], button:has-text("Login")').first();
      
      if (await emailInput.isVisible()) {
        await emailInput.fill(userConfig.email);
        await passwordInput.fill(userConfig.password);
        await loginButton.click();
        
        // Wait for successful login (redirect to dashboard)
        await page.waitForURL('**/admin*', { timeout: 10000 });
        console.log(`✅ ${roleName} authenticated successfully`);
      } else {
        console.log(`ℹ️  ${roleName} - No login form found, assuming already authenticated`);
      }
      
    } catch (error) {
      console.error(`❌ Authentication failed for ${roleName}:`, error);
      throw error;
    }
  }

  private async testPath(page: Page, pathToTest: string, roleName: string): Promise<PathResult> {
    const startTime = Date.now();
    
    try {
      // Navigate to the path
      const response = await page.goto(`${this.config.baseURL}${pathToTest}`, {
        timeout: this.config.timeout
      });
      
      // Wait for page to load
      await page.waitForLoadState('networkidle', { timeout: 5000 });
      
      const statusCode = response?.status() || 0;
      const isAccessible = statusCode >= 200 && statusCode < 400 && 
                          !page.url().includes('/login') &&
                          !page.url().includes('/403') &&
                          !page.url().includes('/404');
      
      // Take screenshot if configured
      let screenshots: string[] = [];
      if (this.config.screenshotMode === 'all' || 
          (this.config.screenshotMode === 'boundaries' && !isAccessible)) {
        const screenshotPath = `results/crawler/${roleName}/${this.sanitizePath(pathToTest)}.png`;
        await page.screenshot({ 
          path: screenshotPath, 
          fullPage: true 
        });
        screenshots = [screenshotPath];
      }
      
      // Extract navigation links for further crawling
      const links = await this.extractAccessibleLinks(page);
      
      // Test permission-specific elements
      const permissionTest = await this.testPathPermissions(page, roleName);
      
      return {
        path: pathToTest,
        role: roleName,
        accessible: isAccessible,
        responseTime: Date.now() - startTime,
        statusCode,
        navigationElements: await page.locator('nav, [role="navigation"]').count(),
        links,
        permissionTest,
        screenshots,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        path: pathToTest,
        role: roleName, 
        accessible: false,
        responseTime: Date.now() - startTime,
        error: (error as Error).message,
        screenshots: [],
        timestamp: new Date().toISOString()
      };
    }
  }

  private async extractAccessibleLinks(page: Page): Promise<string[]> {
    try {
      // Extract all internal navigation links
      const links = await page.locator('a[href]').evaluateAll((elements) => {
        return elements
          .map(el => (el as HTMLAnchorElement).getAttribute('href'))
          .filter(href => href && !href.startsWith('http') && !href.startsWith('mailto'))
          .map(href => href!.startsWith('/') ? href : `/${href}`)
          .filter(href => href.length > 1); // Filter out just '/'
      });
      
      return [...new Set(links)]; // Remove duplicates
    } catch {
      return [];
    }
  }

  private async testPathPermissions(page: Page, roleName: string): Promise<PermissionTest> {
    const roleVisibility = ROLE_ELEMENT_VISIBILITY[roleName] || { visible: [], hidden: [] };
    
    const elementsVisible: ElementVisibility[] = [];
    const elementsHidden: ElementVisibility[] = [];
    
    // Test elements that should be visible
    for (const selector of roleVisibility.visible) {
      try {
        const isVisible = await page.locator(selector).isVisible();
        elementsVisible.push({
          selector,
          expected: true,
          actual: isVisible
        });
      } catch {
        elementsVisible.push({
          selector,
          expected: true,
          actual: false
        });
      }
    }
    
    // Test elements that should be hidden
    for (const selector of roleVisibility.hidden) {
      try {
        const isVisible = await page.locator(selector).isVisible();
        elementsHidden.push({
          selector,
          expected: false,
          actual: isVisible
        });
      } catch {
        elementsHidden.push({
          selector,
          expected: false,
          actual: false
        });
      }
    }
    
    return {
      elementsVisible,
      elementsHidden,
      apiCallsAllowed: [], // Will be populated by network monitoring
      apiCallsDenied: []
    };
  }

  private async analyzePermissionBoundaries(paths: PathResult[], roleName: string): Promise<any[]> {
    // Analyze which paths should be accessible vs actually accessible
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
          evidence: path.screenshots || []
        });
      }
    }
    
    return boundaries;
  }

  private calculateCoverage(paths: PathResult[]): CoverageAnalysis {
    const totalRoutes = paths.length;
    const accessibleRoutes = paths.filter(p => p.accessible).length;
    const restrictedRoutes = paths.filter(p => !p.accessible && !p.error).length;
    const errorRoutes = paths.filter(p => p.error).length;
    
    return {
      totalRoutes,
      accessibleRoutes,
      restrictedRoutes,
      errorRoutes,
      coveragePercentage: totalRoutes > 0 ? (accessibleRoutes / totalRoutes) * 100 : 0,
      uniqueNavigationElements: paths.reduce((sum, p) => sum + (p.navigationElements || 0), 0)
    };
  }

  private isInternalLink(link: string): boolean {
    return link.startsWith('/') && 
           !link.includes('logout') &&
           !link.includes('external') &&
           link.length > 1;
  }

  private sanitizePath(path: string): string {
    return path.replace(/[^a-zA-Z0-9-_]/g, '_');
  }

  async generateReports(navigationMap: NavigationMap): Promise<void> {
    console.log('📊 Generating crawler reports...');
    
    // Generate individual role reports
    for (const [roleName, discovery] of Object.entries(navigationMap)) {
      await this.generateRoleReport(roleName, discovery);
    }
    
    // Generate comprehensive comparison report
    await this.generateComparisonReport(navigationMap);
    
    // Generate security events report
    await this.generateSecurityReport();
    
    console.log('✅ Reports generated successfully');
  }

  private async generateRoleReport(roleName: string, discovery: PathDiscovery): Promise<void> {
    const reportPath = `results/crawler/${roleName}/report.json`;
    
    const report = {
      role: roleName,
      summary: {
        executionTime: discovery.executionTime,
        pathsDiscovered: discovery.discoveredPaths.length,
        accessiblePaths: discovery.discoveredPaths.filter(p => p.accessible).length,
        permissionViolations: discovery.permissionBoundaries.length,
        coverage: discovery.coverage
      },
      paths: discovery.discoveredPaths,
      permissionBoundaries: discovery.permissionBoundaries,
      timestamp: discovery.timestamp
    };
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  }

  private async generateComparisonReport(navigationMap: NavigationMap): Promise<void> {
    const reportPath = 'results/crawler/comparison-report.json';
    
    const report = {
      summary: {
        rolesTest: Object.keys(navigationMap).length,
        totalPathsDiscovered: Object.values(navigationMap).reduce(
          (sum, discovery) => sum + discovery.discoveredPaths.length, 0
        ),
        totalExecutionTime: Object.values(navigationMap).reduce(
          (sum, discovery) => sum + discovery.executionTime, 0
        )
      },
      roleComparison: Object.entries(navigationMap).map(([role, discovery]) => ({
        role,
        pathCount: discovery.discoveredPaths.length,
        accessibleCount: discovery.discoveredPaths.filter(p => p.accessible).length,
        coveragePercentage: discovery.coverage.coveragePercentage,
        violationCount: discovery.permissionBoundaries.length
      })),
      detailedResults: navigationMap,
      timestamp: new Date().toISOString()
    };
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  }

  private async generateSecurityReport(): Promise<void> {
    const reportPath = 'results/crawler/security-events.json';
    
    const report = {
      summary: {
        totalEvents: this.securityEvents.length,
        criticalEvents: this.securityEvents.filter(e => e.severity === 'critical').length,
        highEvents: this.securityEvents.filter(e => e.severity === 'high').length,
        mediumEvents: this.securityEvents.filter(e => e.severity === 'medium').length,
        lowEvents: this.securityEvents.filter(e => e.severity === 'low').length
      },
      events: this.securityEvents,
      timestamp: new Date().toISOString()
    };
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up crawler resources...');
    
    // Close all contexts
    for (const [roleName, context] of this.contexts) {
      await context.close();
      console.log(`✅ ${roleName} context closed`);
    }
    
    // Close browser
    if (this.browser) {
      await this.browser.close();
      console.log('✅ Browser closed');
    }
    
    console.log('🎯 Cleanup completed');
  }
}