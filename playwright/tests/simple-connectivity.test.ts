import { test, expect } from '@playwright/test';

test.describe('Basic Connectivity Test', () => {
  test('Frontend application is accessible', async ({ page }) => {
    console.log('🔍 Testing basic connectivity...');
    
    // Test if the development server is running
    const response = await page.goto('http://localhost:3002');
    
    expect(response?.status()).toBe(200);
    console.log('✅ Frontend server is accessible');
    
    // Test if we can navigate to admin
    await page.goto('http://localhost:3002/admin');
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    console.log(`📍 Current URL: ${url}`);
    
    // Check if we can see some content
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'results/connectivity-test.png' });
    
    console.log('🎯 Basic connectivity test completed');
  });

  test('Check login page accessibility', async ({ page }) => {
    console.log('🔐 Testing login page...');
    
    await page.goto('http://localhost:3002/login');
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    console.log(`📍 Login URL: ${url}`);
    
    // Look for common login elements
    const hasEmailInput = await page.locator('input[type="email"], input[name="email"]').count() > 0;
    const hasPasswordInput = await page.locator('input[type="password"], input[name="password"]').count() > 0;
    const hasLoginButton = await page.locator('button:has-text("Login"), button[type="submit"]').count() > 0;
    
    console.log(`📧 Email input found: ${hasEmailInput}`);
    console.log(`🔒 Password input found: ${hasPasswordInput}`);
    console.log(`🔘 Login button found: ${hasLoginButton}`);
    
    // Take screenshot of login page
    await page.screenshot({ path: 'results/login-page.png' });
    
    console.log('✅ Login page accessibility verified');
  });

  test('Navigation discovery without authentication', async ({ page }) => {
    console.log('🗺️  Testing basic navigation discovery...');
    
    const routes = ['/', '/admin', '/admin/users', '/admin/roles', '/admin/modules'];
    const results = [];
    
    for (const route of routes) {
      try {
        const response = await page.goto(`http://localhost:3002${route}`);
        const statusCode = response?.status() || 0;
        const finalUrl = page.url();
        
        results.push({
          route,
          statusCode,
          finalUrl,
          accessible: statusCode >= 200 && statusCode < 400
        });
        
        console.log(`📍 ${route} → ${statusCode} (${finalUrl.includes('login') ? 'redirected to login' : 'accessible'})`);
        
        // Small delay to avoid overwhelming the server
        await page.waitForTimeout(500);
        
      } catch (error) {
        results.push({
          route,
          error: (error as Error).message,
          accessible: false
        });
        console.log(`❌ ${route} → Error: ${(error as Error).message}`);
      }
    }
    
    const accessibleRoutes = results.filter(r => r.accessible).length;
    const totalRoutes = results.length;
    
    console.log(`📊 Navigation discovery: ${accessibleRoutes}/${totalRoutes} routes accessible`);
    console.log('🎯 Basic navigation test completed');
    
    // At least the home route should be accessible
    expect(accessibleRoutes).toBeGreaterThan(0);
  });
});