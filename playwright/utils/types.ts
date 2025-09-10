// Testing Types and Interfaces
export interface UserRole {
  name: string;
  email: string;
  password: string;
  permissions: string[];
  modules: string[];
  description: string;
}

export interface PathDiscovery {
  role: string;
  discoveredPaths: PathResult[];
  permissionBoundaries: PermissionBoundary[];
  coverage: CoverageAnalysis;
  executionTime: number;
  timestamp: string;
}

export interface PathResult {
  path: string;
  role: string;
  accessible: boolean;
  responseTime?: number;
  statusCode?: number;
  navigationElements?: number;
  links?: string[];
  permissionTest?: PermissionTest;
  screenshots?: string[];
  error?: string;
  timestamp: string;
}

export interface PermissionBoundary {
  path: string;
  role: string;
  expectedAccess: boolean;
  actualAccess: boolean;
  boundaryType: 'ui_element' | 'navigation' | 'api_endpoint' | 'data_scope';
  evidence: string[];
}

export interface PermissionTest {
  elementsVisible: ElementVisibility[];
  elementsHidden: ElementVisibility[];
  apiCallsAllowed: APIAccess[];
  apiCallsDenied: APIAccess[];
}

export interface ElementVisibility {
  selector: string;
  expected: boolean;
  actual: boolean;
  screenshot?: string;
}

export interface APIAccess {
  endpoint: string;
  method: string;
  expected: boolean;
  actual: boolean;
  statusCode?: number;
  responseTime?: number;
}

export interface CoverageAnalysis {
  totalRoutes: number;
  accessibleRoutes: number;
  restrictedRoutes: number;
  errorRoutes: number;
  coveragePercentage: number;
  uniqueNavigationElements: number;
}

export interface NavigationMap {
  [roleName: string]: PathDiscovery;
}

export interface CrawlerConfig {
  baseURL: string;
  maxPages: number;
  timeout: number;
  screenshotMode: 'all' | 'errors' | 'boundaries' | 'none';
  videoRecording: boolean;
  networkMonitoring: boolean;
  performanceMetrics: boolean;
}

export interface SecurityEvent {
  type: 'console_error' | 'suspicious_request' | 'permission_violation' | 'network_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: any;
  timestamp: string;
  evidence?: string[];
}

export interface TestResult {
  testName: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED' | 'ERROR';
  duration: number;
  error?: string;
  evidence: string[];
  metrics?: any;
}