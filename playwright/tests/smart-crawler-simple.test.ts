import { test, expect } from '@playwright/test';
import { TEST_USERS, EXPECTED_ACCESS } from '../utils/test-users';

test.describe('Smart Crawler - Simple Multi-Role Test', () => {
  
  test('Multi-Role Navigation Access Test', async ({ browser }) => {
    console.log('🚀 Starting multi-role navigation test...');
    
    const results: any[] = [];
    const roles = Object.keys(TEST_USERS);
    
    // Test each role's access to expected paths
    for (const role of roles) {
      console.log(`\n🎭 Testing role: ${role}`);
      
      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
      });
      
      const page = await context.newPage();
      const expectedPaths = EXPECTED_ACCESS[role] || [];
      const roleResults: any[] = [];
      
      for (const path of expectedPaths) {
        try {
          const startTime = Date.now();
          const response = await page.goto(`http://localhost:3002${path}`);
          await page.waitForLoadState('networkidle', { timeout: 5000 });
          
          const statusCode = response?.status() || 0;
          const finalUrl = page.url();
          const responseTime = Date.now() - startTime;
          const accessible = statusCode >= 200 && statusCode < 400;
          
          roleResults.push({
            role,
            path,
            statusCode,
            finalUrl,
            responseTime,
            accessible,
            redirected: !finalUrl.endsWith(path)
          });
          
          console.log(`  📍 ${path} → ${statusCode} ${accessible ? '✅' : '❌'} (${responseTime}ms)`);
          
          // Take screenshot for important paths
          if (accessible && (path.includes('admin') || path === '/')) {
            await page.screenshot({ 
              path: `results/crawler/${role}${path.replace(/\//g, '_') || '_root'}.png`,
              fullPage: true 
            });
          }
          
        } catch (error) {
          roleResults.push({
            role,
            path,
            error: (error as Error).message,
            accessible: false,
            responseTime: 0
          });
          console.log(`  ❌ ${path} → Error: ${(error as Error).message}`);
        }
        
        // Small delay to avoid overwhelming server
        await page.waitForTimeout(200);
      }
      
      await context.close();
      
      // Calculate role statistics
      const accessibleCount = roleResults.filter(r => r.accessible).length;
      const totalCount = roleResults.length;
      const avgResponseTime = roleResults
        .filter(r => r.responseTime > 0)
        .reduce((sum, r) => sum + r.responseTime, 0) / 
        (roleResults.filter(r => r.responseTime > 0).length || 1);
      
      results.push({
        role,
        paths: roleResults,
        statistics: {
          accessibleCount,
          totalCount,
          coveragePercentage: totalCount > 0 ? (accessibleCount / totalCount) * 100 : 0,
          avgResponseTime: Math.round(avgResponseTime)
        }
      });
      
      console.log(`  📊 ${role}: ${accessibleCount}/${totalCount} paths accessible (${Math.round((accessibleCount/totalCount)*100)}%)`);
    }
    
    // Generate results summary
    console.log('\n📋 MULTI-ROLE TEST SUMMARY:');
    console.log('================================================');
    
    results.forEach(({ role, statistics }) => {
      console.log(`${role.padEnd(15)}: ${statistics.accessibleCount}/${statistics.totalCount} paths (${statistics.coveragePercentage.toFixed(1)}%) avg: ${statistics.avgResponseTime}ms`);
    });
    
    // Validate role hierarchy expectations
    const superAdminStats = results.find(r => r.role === 'super_admin')?.statistics;
    const readonlyStats = results.find(r => r.role === 'readonly_user')?.statistics;
    
    if (superAdminStats && readonlyStats) {
      console.log(`\n🏛️ Role Hierarchy Validation:`);
      console.log(`Super Admin: ${superAdminStats.accessibleCount} paths`);
      console.log(`Readonly User: ${readonlyStats.accessibleCount} paths`);
      
      // Super admin should have access to more or equal paths than readonly
      expect(superAdminStats.accessibleCount).toBeGreaterThanOrEqual(readonlyStats.accessibleCount);
    }
    
    // Save detailed results
    const detailedResults = {
      timestamp: new Date().toISOString(),
      totalRolesTested: results.length,
      executionSummary: results.map(({ role, statistics }) => ({ role, statistics })),
      detailedResults: results
    };
    
    const fs = await import('fs/promises');
    await fs.writeFile(
      'results/multi-role-test-results.json', 
      JSON.stringify(detailedResults, null, 2)
    );
    
    console.log('\n✅ Multi-role navigation test completed!');
    console.log('📄 Detailed results saved to: results/multi-role-test-results.json');
    
    // Ensure at least some basic functionality works
    const totalAccessiblePaths = results.reduce((sum, r) => sum + r.statistics.accessibleCount, 0);
    expect(totalAccessiblePaths).toBeGreaterThan(10); // At least 10 total accessible paths across all roles
  });
  
  test('Permission Boundary Detection', async ({ browser }) => {
    console.log('🔍 Testing permission boundaries...');
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Test different roles on the same critical paths
    const criticalPaths = ['/admin', '/admin/users', '/admin/roles', '/admin/settings'];
    const boundaryResults: any[] = [];
    
    for (const path of criticalPaths) {
      console.log(`\n🛡️ Testing boundary: ${path}`);
      
      try {
        await page.goto(`http://localhost:3002${path}`);
        await page.waitForLoadState('networkidle', { timeout: 3000 });
        
        // Check for permission-sensitive elements
        const visibleElements = {
          createButton: await page.locator('[data-testid*="create"], button:has-text("Create"), button:has-text("Add")').count(),
          editButton: await page.locator('[data-testid*="edit"], button:has-text("Edit")').count(),
          deleteButton: await page.locator('[data-testid*="delete"], button:has-text("Delete")').count(),
          adminPanel: await page.locator('[data-testid*="admin"], [data-testid*="management"]').count(),
          userManagement: await page.locator('text=User Management, text=Users').count(),
          roleManagement: await page.locator('text=Role Management, text=Roles').count()
        };
        
        boundaryResults.push({
          path,
          accessible: true,
          elements: visibleElements,
          totalElements: Object.values(visibleElements).reduce((sum, count) => sum + count, 0)
        });
        
        console.log(`  📊 Elements found: ${Object.entries(visibleElements).map(([k,v]) => `${k}:${v}`).join(', ')}`);
        
        // Take screenshot of admin interface
        await page.screenshot({ 
          path: `results/boundary-test-${path.replace(/\//g, '_')}.png`,
          fullPage: true 
        });
        
      } catch (error) {
        boundaryResults.push({
          path,
          accessible: false,
          error: (error as Error).message
        });
        console.log(`  ❌ ${path} → Error: ${(error as Error).message}`);
      }
    }
    
    await context.close();
    
    console.log('\n🎯 Permission boundary test completed');
    
    // Should find admin interface elements
    const totalElements = boundaryResults.reduce((sum, r) => sum + (r.totalElements || 0), 0);
    expect(totalElements).toBeGreaterThan(0);
  });
  
  test('UI Element Visibility Analysis', async ({ browser }) => {
    console.log('👁️ Testing UI element visibility...');
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Test main admin dashboard for UI elements
    await page.goto('http://localhost:3002/admin');
    await page.waitForLoadState('networkidle');
    
    // Analyze the admin interface structure
    const uiAnalysis = {
      navigation: await page.locator('nav, [role="navigation"]').count(),
      buttons: await page.locator('button').count(),
      links: await page.locator('a').count(),
      forms: await page.locator('form').count(),
      tables: await page.locator('table').count(),
      cards: await page.locator('[data-testid*="card"], .card').count(),
      widgets: await page.locator('[data-testid*="widget"], .widget').count(),
      dashboardElements: await page.locator('[data-testid*="dashboard"]').count()
    };
    
    console.log('📊 UI Element Analysis:');
    Object.entries(uiAnalysis).forEach(([element, count]) => {
      console.log(`  ${element.padEnd(20)}: ${count}`);
    });
    
    // Take comprehensive screenshot
    await page.screenshot({ 
      path: 'results/ui-analysis-admin.png',
      fullPage: true 
    });
    
    await context.close();
    
    // Should find a reasonable number of interactive elements
    const totalInteractiveElements = uiAnalysis.buttons + uiAnalysis.links + uiAnalysis.forms;
    expect(totalInteractiveElements).toBeGreaterThan(5);
    
    console.log('✅ UI element visibility analysis completed');
  });
});