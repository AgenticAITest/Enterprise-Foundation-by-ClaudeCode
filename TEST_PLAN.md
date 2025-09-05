# Backend API Test Plan
**Project:** Modular ERP RBAC System  
**Test Phase:** Pre-Frontend Development Validation  
**Created:** September 3, 2025  
**Status:** Ready for Execution

## Executive Summary

This test plan validates all backend APIs and core functionality before frontend development begins. The goal is to ensure APIs return consistent data structures, handle errors properly, and maintain security standards that the frontend will rely on.

**Test Scope:** 40+ API endpoints across 6 major service areas  
**Priority:** Critical for frontend development success  
**Estimated Execution Time:** 8-12 hours

---

## Test Environment Setup

### Prerequisites
- Backend server running on http://localhost:3001
- PostgreSQL database with test data
- Docker containers running (postgres, redis)
- Postman or curl for manual testing

### Test Data Requirements
```sql
-- Required test data:
- 3 test tenants (tenant_dev, tenant_acme, tenant_test)  
- 5 modules (core, wms, accounting, pos, hr)
- 10+ role templates per module
- 20+ permission resources per module
- 5 test users with different roles
```

### Authentication Tokens Needed
```javascript
// Generate these tokens before testing:
super_admin_token  // For admin endpoints
tenant_admin_token // For tenant management
regular_user_token // For permission testing
expired_token      // For error testing
invalid_token      // For security testing
```

---

## Test Categories

## Category 1: API Contract Tests (CRITICAL - 28 tests)

### 1.1 Module Management APIs (6 tests)

#### TEST-MOD-001: List All Modules
- **Endpoint:** `GET /api/modules`
- **Auth:** Required (any authenticated user)
- **Expected Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "code": "string", 
      "description": "string",
      "is_core": "boolean",
      "dependencies": "array",
      "created_at": "timestamp"
    }
  ]
}
```
- **Pass Criteria:** Returns 200, includes all 5 modules, correct structure

#### TEST-MOD-002: Get Module Details
- **Endpoint:** `GET /api/modules/{moduleId}`
- **Auth:** Required
- **Test Cases:**
  - Valid module ID → 200 with module details
  - Invalid module ID → 404 with error message
  - Missing auth → 401 with error message

#### TEST-MOD-003: Get Tenant Active Modules
- **Endpoint:** `GET /api/tenants/{tenantId}/modules`
- **Auth:** Required + tenant access
- **Expected Response:** List of activated modules for tenant
- **Pass Criteria:** Only shows tenant's active modules

#### TEST-MOD-004: Activate Module for Tenant
- **Endpoint:** `POST /api/tenants/{tenantId}/modules/{moduleId}/activate`
- **Auth:** Required + tenant admin
- **Request Body:** `{ "settings": {} }`
- **Pass Criteria:** Module activated, audit logged

#### TEST-MOD-005: Update Module Settings
- **Endpoint:** `PUT /api/tenants/{tenantId}/modules/{moduleId}/settings`
- **Auth:** Required + tenant admin
- **Request Body:** `{ "settings": { "key": "value" } }`
- **Pass Criteria:** Settings updated, changes audited

#### TEST-MOD-006: Deactivate Module
- **Endpoint:** `DELETE /api/tenants/{tenantId}/modules/{moduleId}/deactivate`
- **Auth:** Required + tenant admin
- **Pass Criteria:** Module deactivated, audit logged

### 1.2 Role Management APIs (10 tests)

#### TEST-ROLE-001: List Roles by Module
- **Endpoint:** `GET /api/roles/tenants/{tenantId}/modules/{moduleId}/roles`
- **Auth:** Required + tenant access
- **Expected Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "module_code": "string",
      "is_system": "boolean",
      "permission_count": "number",
      "created_at": "timestamp"
    }
  ]
}
```

#### TEST-ROLE-002: Create Custom Role
- **Endpoint:** `POST /api/roles/tenants/{tenantId}/modules/{moduleId}/roles`
- **Auth:** Required + tenant admin
- **Request Body:**
```json
{
  "name": "Custom Warehouse Supervisor",
  "description": "Custom role for warehouse operations"
}
```
- **Pass Criteria:** Role created with ID, audit logged

#### TEST-ROLE-003: Update Role
- **Endpoint:** `PUT /api/roles/tenants/{tenantId}/roles/{roleId}`
- **Auth:** Required + tenant admin
- **Pass Criteria:** Role updated, changes audited

#### TEST-ROLE-004: Delete Role
- **Endpoint:** `DELETE /api/roles/tenants/{tenantId}/roles/{roleId}`
- **Auth:** Required + tenant admin
- **Pass Criteria:** Role deleted (if no active users)

#### TEST-ROLE-005: Get Role Templates
- **Endpoint:** `GET /api/roles/templates/{moduleCode}`
- **Auth:** Required
- **Pass Criteria:** Returns all templates for module

#### TEST-ROLE-006: List All Role Templates
- **Endpoint:** `GET /api/roles/templates`
- **Auth:** Required
- **Pass Criteria:** Returns templates grouped by module

#### TEST-ROLE-007: Create Role from Template
- **Endpoint:** `POST /api/roles/tenants/{tenantId}/roles/from-template`
- **Request Body:**
```json
{
  "template_id": "uuid",
  "custom_name": "Modified Warehouse Manager"
}
```
- **Pass Criteria:** Role created with template permissions

#### TEST-ROLE-008: Clone Existing Role
- **Endpoint:** `POST /api/roles/tenants/{tenantId}/roles/{roleId}/clone`
- **Request Body:** `{ "new_name": "Cloned Role" }`
- **Pass Criteria:** New role created with same permissions

#### TEST-ROLE-009: Get Role Permissions
- **Endpoint:** `GET /api/roles/tenants/{tenantId}/roles/{roleId}/permissions`
- **Auth:** Required + tenant access
- **Expected Response:** List of permissions with resource details

#### TEST-ROLE-010: Update Role Permissions
- **Endpoint:** `PUT /api/roles/tenants/{tenantId}/roles/{roleId}/permissions`
- **Request Body:**
```json
{
  "permissions": [
    {
      "resource_code": "wms.inventory",
      "actions": ["view", "edit"]
    }
  ]
}
```
- **Pass Criteria:** Permissions updated, audit logged

### 1.3 Permission Management APIs (7 tests)

#### TEST-PERM-001: Get Module Resources
- **Endpoint:** `GET /api/permissions/modules/{moduleCode}/resources`
- **Auth:** Required
- **Expected Response:** All permission resources for module
- **Pass Criteria:** Returns hierarchical resource structure

#### TEST-PERM-002: Get Resource Hierarchy
- **Endpoint:** `GET /api/permissions/modules/{moduleCode}/hierarchy`
- **Auth:** Required
- **Pass Criteria:** Returns parent-child resource relationships

#### TEST-PERM-003: Get User Effective Permissions
- **Endpoint:** `GET /api/permissions/tenants/{tenantId}/users/{userId}/effective-permissions`
- **Auth:** Required + user or admin access
- **Expected Response:**
```json
{
  "status": "success",
  "data": {
    "user_id": "uuid",
    "modules": {
      "wms": {
        "role": "warehouse_manager",
        "permissions": [
          {
            "resource": "wms.inventory.items",
            "actions": ["view", "edit", "create"]
          }
        ]
      }
    }
  }
}
```

#### TEST-PERM-004: Check Specific Permission
- **Endpoint:** `GET /api/permissions/tenants/{tenantId}/users/{userId}/check/{resourceCode}`
- **Query:** `?action=edit`
- **Pass Criteria:** Returns boolean permission result

#### TEST-PERM-005: Get User Accessible Modules
- **Endpoint:** `GET /api/permissions/tenants/{tenantId}/users/{userId}/accessible-modules`
- **Pass Criteria:** Returns only modules user has access to

#### TEST-PERM-006: Get Menu Permissions
- **Endpoint:** `GET /api/permissions/tenants/{tenantId}/users/{userId}/menu-permissions/{moduleCode}`
- **Pass Criteria:** Returns menu structure with visibility flags

#### TEST-PERM-007: Validate Access Request
- **Endpoint:** `POST /api/permissions/tenants/{tenantId}/users/{userId}/validate-access`
- **Request Body:**
```json
{
  "resource": "wms.inventory.items",
  "action": "delete",
  "context": { "item_id": "123" }
}
```
- **Pass Criteria:** Returns access validation result

### 1.4 User Assignment APIs (5 tests)

#### TEST-USER-001: List Tenant Users
- **Endpoint:** `GET /api/user-roles/tenants/{tenantId}/users`
- **Auth:** Required + tenant admin
- **Pass Criteria:** Returns all users in tenant

#### TEST-USER-002: Get User Module Roles
- **Endpoint:** `GET /api/user-roles/tenants/{tenantId}/users/{userId}/module-roles`
- **Pass Criteria:** Returns user's roles across all modules

#### TEST-USER-003: Assign User to Module Role
- **Endpoint:** `POST /api/user-roles/tenants/{tenantId}/users/{userId}/module-roles`
- **Request Body:**
```json
{
  "module_code": "wms",
  "role_id": "uuid"
}
```
- **Pass Criteria:** Role assigned, audit logged

#### TEST-USER-004: Update User Module Role
- **Endpoint:** `PUT /api/user-roles/tenants/{tenantId}/users/{userId}/module-roles/{moduleCode}`
- **Pass Criteria:** Role updated, old assignment removed

#### TEST-USER-005: Remove User from Module
- **Endpoint:** `DELETE /api/user-roles/tenants/{tenantId}/users/{userId}/module-roles/{moduleCode}`
- **Pass Criteria:** Assignment removed, audit logged

## Category 2: Admin API Tests (CRITICAL - 5 tests)

### 2.1 Super Admin APIs

#### TEST-ADMIN-001: Get Tenant Statistics
- **Endpoint:** `GET /api/admin/tenants/stats`
- **Auth:** Required + super admin
- **Expected Response:**
```json
{
  "status": "success",
  "data": {
    "tenant_overview": {
      "total_tenants": "3",
      "active_tenants": "3",
      "new_tenants_30d": "3"
    },
    "user_overview": {
      "total_users": "5",
      "new_users_30d": "2"
    },
    "module_usage": [...],
    "growth_trends": [...]
  }
}
```

#### TEST-ADMIN-002: Get Module Usage Stats
- **Endpoint:** `GET /api/admin/modules/usage`
- **Auth:** Required + super admin
- **Pass Criteria:** Returns module adoption rates and trends

#### TEST-ADMIN-003: Get Revenue Analytics
- **Endpoint:** `GET /api/admin/billing/revenue`
- **Auth:** Required + super admin
- **Pass Criteria:** Returns mock billing data structure

#### TEST-ADMIN-004: Suspend Tenant
- **Endpoint:** `POST /api/admin/tenants/{tenantId}/suspend`
- **Auth:** Required + super admin
- **Request Body:** `{ "reason": "Test suspension" }`
- **Pass Criteria:** Tenant status updated, audit logged

#### TEST-ADMIN-005: Update Module Settings
- **Endpoint:** `PUT /api/admin/modules/{moduleId}/settings`
- **Auth:** Required + super admin
- **Request Body:** `{ "settings": { "max_users": 100 } }`
- **Pass Criteria:** Settings updated globally

## Category 3: Authentication & Security Tests (HIGH - 12 tests)

### 3.1 Authentication Tests

#### TEST-AUTH-001: Valid Token Access
- **Test:** Use valid JWT token
- **Pass Criteria:** All authenticated endpoints return 200

#### TEST-AUTH-002: Missing Token
- **Test:** Request without Authorization header
- **Pass Criteria:** Returns 401 with error message

#### TEST-AUTH-003: Invalid Token Format
- **Test:** Use malformed JWT token
- **Pass Criteria:** Returns 401 with error message

#### TEST-AUTH-004: Expired Token
- **Test:** Use expired JWT token
- **Pass Criteria:** Returns 401 with error message

### 3.2 Authorization Tests

#### TEST-AUTHZ-001: Super Admin Access
- **Test:** Super admin accessing admin endpoints
- **Pass Criteria:** All admin endpoints accessible

#### TEST-AUTHZ-002: Tenant Admin Access
- **Test:** Tenant admin accessing tenant-specific endpoints
- **Pass Criteria:** Can access own tenant, blocked from others

#### TEST-AUTHZ-003: Regular User Access
- **Test:** Regular user accessing admin endpoints
- **Pass Criteria:** Returns 403 Forbidden

#### TEST-AUTHZ-004: Cross-Tenant Access
- **Test:** Tenant A admin trying to access Tenant B data
- **Pass Criteria:** Returns 403 Forbidden

### 3.3 Security Tests

#### TEST-SEC-001: SQL Injection Attempts
- **Test:** Include SQL injection patterns in requests
- **Pass Criteria:** No database errors, no data leakage

#### TEST-SEC-002: Rate Limiting
- **Test:** Exceed rate limits for different endpoints
- **Pass Criteria:** Returns 429 Too Many Requests

#### TEST-SEC-003: XSS Prevention
- **Test:** Include XSS payloads in request data
- **Pass Criteria:** Data properly escaped/sanitized

#### TEST-SEC-004: CSRF Protection
- **Test:** Cross-origin requests without proper headers
- **Pass Criteria:** CORS policy enforced

## Category 4: Data Integrity Tests (MEDIUM - 8 tests)

### 4.1 Database Constraint Tests

#### TEST-DATA-001: Unique Constraints
- **Test:** Create duplicate entries (tenants, users, roles)
- **Pass Criteria:** Database constraints prevent duplicates

#### TEST-DATA-002: Foreign Key Constraints
- **Test:** Reference non-existent records
- **Pass Criteria:** Operations fail with proper error messages

#### TEST-DATA-003: Cascade Deletes
- **Test:** Delete parent records with children
- **Pass Criteria:** Children properly deleted or operation blocked

#### TEST-DATA-004: Data Validation
- **Test:** Invalid data formats (emails, UUIDs, dates)
- **Pass Criteria:** Validation errors returned

### 4.2 Transaction Tests

#### TEST-TRANS-001: Role Assignment Rollback
- **Test:** Fail role assignment mid-transaction
- **Pass Criteria:** No partial data committed

#### TEST-TRANS-002: Module Activation Rollback
- **Test:** Fail module activation mid-process
- **Pass Criteria:** Module not partially activated

#### TEST-TRANS-003: Bulk Operations
- **Test:** Bulk user assignments with some failures
- **Pass Criteria:** Successful operations committed, failures rolled back

#### TEST-TRANS-004: Concurrent Access
- **Test:** Multiple users modifying same data
- **Pass Criteria:** Data consistency maintained

## Category 5: Error Handling Tests (MEDIUM - 10 tests)

### 5.1 HTTP Error Codes

#### TEST-ERR-001: 400 Bad Request Format
- **Test:** Invalid request bodies across all POST/PUT endpoints
- **Expected Response:**
```json
{
  "status": "error",
  "message": "Invalid request format",
  "details": "Specific validation errors"
}
```

#### TEST-ERR-002: 404 Not Found Format
- **Test:** Request non-existent resources
- **Expected Response:**
```json
{
  "status": "error", 
  "message": "Resource not found"
}
```

#### TEST-ERR-003: 500 Server Error Handling
- **Test:** Trigger server errors (database disconnection)
- **Pass Criteria:** Graceful error response, no data exposure

### 5.2 Validation Error Tests

#### TEST-VAL-001: Missing Required Fields
- **Test:** Omit required fields in requests
- **Pass Criteria:** Clear validation error messages

#### TEST-VAL-002: Invalid Data Types
- **Test:** Wrong data types (string for number, etc.)
- **Pass Criteria:** Type validation errors

#### TEST-VAL-003: String Length Validation
- **Test:** Exceed max lengths for text fields
- **Pass Criteria:** Length validation errors

#### TEST-VAL-004: Email Format Validation
- **Test:** Invalid email formats
- **Pass Criteria:** Email validation errors

#### TEST-VAL-005: UUID Format Validation
- **Test:** Invalid UUID formats in path parameters
- **Pass Criteria:** UUID validation errors

#### TEST-VAL-006: Date Format Validation
- **Test:** Invalid date formats
- **Pass Criteria:** Date validation errors

#### TEST-VAL-007: Enum Value Validation
- **Test:** Invalid enum values (status, role types)
- **Pass Criteria:** Enum validation errors

---

## Test Execution Guidelines

### Pre-Execution Checklist
- [ ] Backend server running and accessible
- [ ] Database populated with test data  
- [ ] All required authentication tokens generated
- [ ] Test environment isolated from production
- [ ] Backup of database taken

### Execution Order
1. **Authentication Tests** - Ensure auth works before other tests
2. **API Contract Tests** - Core functionality verification
3. **Admin API Tests** - Super admin functionality
4. **Security Tests** - Permission and authorization validation
5. **Data Integrity Tests** - Database and transaction validation
6. **Error Handling Tests** - Edge cases and error scenarios

### Pass/Fail Criteria

#### PASS Requirements
- ✅ Correct HTTP status codes
- ✅ Expected response structure/format
- ✅ Data accuracy and completeness
- ✅ Proper error handling
- ✅ Security constraints enforced
- ✅ Audit logging working (where applicable)

#### FAIL Indicators
- ❌ Incorrect HTTP status codes
- ❌ Missing or malformed response fields
- ❌ Security vulnerabilities
- ❌ Data corruption or inconsistency
- ❌ Server crashes or unhandled exceptions
- ❌ Performance issues (response time >2 seconds)

### Issue Tracking
For each failed test, document:
1. **Test ID** and description
2. **Expected** vs **Actual** result
3. **Error messages** or symptoms
4. **Steps to reproduce**
5. **Severity** (Critical/High/Medium/Low)
6. **Fix required** (Yes/No)

---

## Test Metrics & Success Criteria

### Target Metrics
- **Test Coverage:** 100% of completed API endpoints
- **Pass Rate:** >95% for CRITICAL tests
- **Pass Rate:** >90% for HIGH priority tests
- **Pass Rate:** >85% for MEDIUM priority tests
- **Performance:** <1 second average response time
- **Security:** 0 critical security vulnerabilities

### Success Criteria for Frontend Development
- All CRITICAL tests passing (100%)
- All authentication flows working
- All admin endpoints functional
- Cross-tenant security verified
- Error handling consistent

### Deliverables
1. **Completed test execution** with results
2. **Issue log** with all failed tests documented
3. **Fixes implemented** for critical/high priority issues
4. **Regression testing** completed after fixes
5. **Sign-off** that APIs are ready for frontend development

---

## Phase 5.1.4: Admin Module Management Testing (40 tests)

### Overview
Testing the complete module management functionality in the admin portal, including module catalog display, activation/deactivation, dependency validation, and edge cases.

### Test Environment Requirements
- Admin portal running on http://localhost:3007
- Backend API running on http://localhost:3001
- Valid super_admin token
- Test database with modules and tenant data

---

### Category UI-MOD: Module Catalog Display (8 tests)

#### TEST-UI-MOD-001: Module Catalog Basic Loading
- **Test:** Navigate to /modules page
- **Expected:** Module catalog loads with all available modules
- **Pass Criteria:** All modules display with correct information (name, version, status, pricing)

#### TEST-UI-MOD-002: Module Card Information Display
- **Test:** Verify module card shows all required fields
- **Expected:** Each card shows name, description, version, status badge, pricing, dependencies
- **Pass Criteria:** All data matches backend API response

#### TEST-UI-MOD-003: Status Badge Accuracy
- **Test:** Verify active/inactive status badges
- **Expected:** Green badge for active, red badge for inactive modules
- **Pass Criteria:** Badge color and text match module.is_active status

#### TEST-UI-MOD-004: Search Functionality
- **Test:** Search modules by name, description, or code
- **Expected:** Filters modules in real-time as user types
- **Pass Criteria:** Only matching modules displayed

#### TEST-UI-MOD-005: Status Filter
- **Test:** Filter by active/inactive/all status
- **Expected:** Shows only modules matching selected status
- **Pass Criteria:** Filtered results match criteria

#### TEST-UI-MOD-006: Price Filter
- **Test:** Filter by free/premium/all pricing
- **Expected:** Shows only modules matching price criteria
- **Pass Criteria:** Free modules (base_price = 0) vs premium correctly filtered

#### TEST-UI-MOD-007: Sort Functionality
- **Test:** Sort by name, price, and creation date
- **Expected:** Modules reorder according to selected criteria
- **Pass Criteria:** Sort order is correct for each option

#### TEST-UI-MOD-008: Module Statistics Display
- **Test:** Verify stats cards show correct counts
- **Expected:** Total, active, free, premium module counts
- **Pass Criteria:** Numbers match actual module data

---

### Category UI-ACT: Module Activation Testing (12 tests)

#### TEST-UI-ACT-001: Activate Inactive Module (Success)
- **Pre-condition:** Module is inactive and has no dependency issues
- **Test:** Click activate button on inactive module
- **Expected:** Success toast, module becomes active, button changes to "Deactivate"
- **Pass Criteria:** UI updates immediately, backend state persists

#### TEST-UI-ACT-002: Activate Module with Dependencies (Success)
- **Pre-condition:** Module dependencies are satisfied
- **Test:** Activate module that requires other modules
- **Expected:** Activation succeeds, success message shown
- **Pass Criteria:** Module activates without dependency errors

#### TEST-UI-ACT-003: Activate Module Loading State
- **Test:** Click activate and verify loading state
- **Expected:** Button shows spinner and becomes disabled during API call
- **Pass Criteria:** Loading state visible until API response

#### TEST-UI-ACT-004: Activate Module API Error Handling
- **Pre-condition:** Backend returns error (simulate network failure)
- **Test:** Attempt to activate module
- **Expected:** Error toast shown, module remains inactive
- **Pass Criteria:** User sees clear error message, no state change

#### TEST-UI-ACT-005: Multiple Module Activation Race Condition
- **Test:** Quickly click activate on multiple modules
- **Expected:** Each module processes independently without conflicts
- **Pass Criteria:** All modules activate successfully or show appropriate errors

#### TEST-UI-ACT-006: Activate Core Module (Already Active)
- **Pre-condition:** Core module is always active
- **Test:** Verify core module button state
- **Expected:** No activate/deactivate button or disabled state
- **Pass Criteria:** Core module cannot be deactivated

#### TEST-UI-ACT-007: Permission Check for Activation
- **Pre-condition:** User without super_admin role
- **Test:** Attempt module activation
- **Expected:** 403 error, appropriate error message
- **Pass Criteria:** Non-super-admin users cannot activate modules

#### TEST-UI-ACT-008: Activate Module - Real-time Stats Update
- **Test:** Activate module and verify stats cards update
- **Expected:** Active module count increases immediately
- **Pass Criteria:** Statistics reflect new state without page refresh

#### TEST-UI-ACT-009: Activate Module - Filter Persistence
- **Pre-condition:** Filters applied (e.g., showing only inactive)
- **Test:** Activate module while filters active
- **Expected:** Module disappears from view if filter no longer matches
- **Pass Criteria:** Filtered view updates correctly

#### TEST-UI-ACT-010: Activate Module - Search Persistence
- **Pre-condition:** Search term entered
- **Test:** Activate module that matches search
- **Expected:** Module remains visible, status updates
- **Pass Criteria:** Search results maintain consistency

#### TEST-UI-ACT-011: Activate Module Success Toast Auto-hide
- **Test:** Activate module successfully
- **Expected:** Success toast appears and auto-hides after 3 seconds
- **Pass Criteria:** Toast message disappears automatically

#### TEST-UI-ACT-012: Activate Module - Browser Refresh Persistence
- **Test:** Activate module, then refresh browser
- **Expected:** Module remains in activated state after refresh
- **Pass Criteria:** Backend state persisted correctly

---

### Category UI-DEACT: Module Deactivation Testing (15 tests)

#### TEST-UI-DEACT-001: Deactivate Active Module (Success)
- **Pre-condition:** Module is active and no tenants using it
- **Test:** Click deactivate button on active module
- **Expected:** Success toast, module becomes inactive, button changes to "Activate"
- **Pass Criteria:** UI updates immediately, backend state persists

#### TEST-UI-DEACT-002: Deactivate Module with Tenant Dependencies (Block)
- **Pre-condition:** Module is active and being used by tenants
- **Test:** Attempt to deactivate module
- **Expected:** Error toast explaining tenants are using module
- **Pass Criteria:** Deactivation blocked, clear error message shown

#### TEST-UI-DEACT-003: Deactivate Core Module (Block)
- **Test:** Attempt to deactivate core module
- **Expected:** Button disabled or error message
- **Pass Criteria:** Core module cannot be deactivated under any circumstances

#### TEST-UI-DEACT-004: Deactivate Module Loading State
- **Test:** Click deactivate and verify loading state
- **Expected:** Button shows spinner and becomes disabled during API call
- **Pass Criteria:** Loading state visible until API response

#### TEST-UI-DEACT-005: Deactivate Module API Error Handling
- **Pre-condition:** Backend returns server error
- **Test:** Attempt to deactivate module
- **Expected:** Error toast shown, module remains active
- **Pass Criteria:** User sees clear error message, no state change

#### TEST-UI-DEACT-006: Deactivate Module with Dependency Chain
- **Pre-condition:** Module A depends on Module B, both active
- **Test:** Try to deactivate Module B
- **Expected:** Error or warning about dependency chain impact
- **Pass Criteria:** System prevents breaking dependency chains

#### TEST-UI-DEACT-007: Deactivate Module - Tenant Count Display
- **Pre-condition:** Module used by multiple tenants
- **Test:** Attempt deactivation
- **Expected:** Error shows exact number of affected tenants
- **Pass Criteria:** Clear information about impact scope

#### TEST-UI-DEACT-008: Deactivate Module - Retry After Tenant Removal
- **Test:** Remove tenant usage, then retry deactivation
- **Expected:** Deactivation succeeds after dependencies cleared
- **Pass Criteria:** Module deactivates successfully when safe

#### TEST-UI-DEACT-009: Deactivate Module - Real-time Stats Update
- **Test:** Successfully deactivate module
- **Expected:** Active module count decreases immediately
- **Pass Criteria:** Statistics reflect new state without page refresh

#### TEST-UI-DEACT-010: Deactivate Module Success Toast Auto-hide
- **Test:** Successfully deactivate module
- **Expected:** Success toast appears and auto-hides after 3 seconds
- **Pass Criteria:** Toast message disappears automatically

#### TEST-UI-DEACT-011: Deactivate Module - Filter Impact
- **Pre-condition:** "Active only" filter applied
- **Test:** Deactivate module
- **Expected:** Module disappears from filtered view
- **Pass Criteria:** Filtered view updates immediately

#### TEST-UI-DEACT-012: Deactivate Module - Browser Refresh Persistence
- **Test:** Deactivate module, then refresh browser
- **Expected:** Module remains in deactivated state after refresh
- **Pass Criteria:** Backend state persisted correctly

#### TEST-UI-DEACT-013: Deactivate Multiple Modules Sequentially
- **Test:** Deactivate several modules one after another
- **Expected:** Each deactivation processed correctly
- **Pass Criteria:** No interference between sequential operations

#### TEST-UI-DEACT-014: Deactivate Module - Network Interruption Recovery
- **Pre-condition:** Simulate network disconnection during deactivation
- **Test:** Attempt deactivation with poor connectivity
- **Expected:** Appropriate error handling and retry capability
- **Pass Criteria:** User informed of network issues, can retry

#### TEST-UI-DEACT-015: Deactivate Module - Concurrent User Test
- **Pre-condition:** Two admin users logged in
- **Test:** Both attempt to deactivate same module simultaneously
- **Expected:** One succeeds, other gets appropriate feedback
- **Pass Criteria:** No race conditions or data corruption

---

### Category UI-DEP: Dependency Management Testing (5 tests)

#### TEST-UI-DEP-001: View Module Dependencies
- **Test:** Check module details for dependency information
- **Expected:** Dependencies clearly listed in module details modal
- **Pass Criteria:** All required modules shown with status

#### TEST-UI-DEP-002: Dependency Chain Validation
- **Pre-condition:** Module A requires B, B requires C
- **Test:** View dependency information for Module A
- **Expected:** Shows complete dependency chain
- **Pass Criteria:** All levels of dependencies visible

#### TEST-UI-DEP-003: Circular Dependency Detection
- **Pre-condition:** Modules with circular dependencies in database
- **Test:** Attempt to display dependency information
- **Expected:** System handles circular references gracefully
- **Pass Criteria:** No infinite loops or crashes

#### TEST-UI-DEP-004: Missing Dependency Highlight
- **Pre-condition:** Module requires another module that's inactive
- **Test:** View module with unsatisfied dependencies
- **Expected:** Missing dependencies highlighted or marked
- **Pass Criteria:** User can easily identify dependency issues

#### TEST-UI-DEP-005: Dependency Impact Warning
- **Test:** Attempt to deactivate module that others depend on
- **Expected:** Warning shows which modules will be affected
- **Pass Criteria:** Clear impact assessment provided

---

## Expected Test Results Summary

### Pass Criteria for Phase 5.1.4
- **Module Catalog:** All UI components render correctly with live data
- **Activation Flow:** Modules activate successfully with proper validation
- **Deactivation Flow:** Modules deactivate with tenant dependency protection
- **Error Handling:** All edge cases handled gracefully with clear messaging
- **Real-time Updates:** UI stays synchronized with backend state
- **Performance:** No noticeable delays or race conditions

### Critical Issues to Watch For
1. **Silent Failures:** Operations that don't show feedback to users
2. **State Inconsistency:** UI showing different state than backend
3. **Dependency Violations:** Allowing operations that break module dependencies
4. **Permission Bypass:** Non-admin users accessing management features
5. **Race Conditions:** Multiple simultaneous operations causing conflicts

---

## Conclusion

This test plan ensures that all backend APIs are thoroughly validated before frontend development begins. By following this systematic approach, we can identify and fix issues early, preventing costly debugging during UI development.

**Next Steps:**
1. Execute tests according to this plan
2. Document results in TEST_RESULTS.md
3. Fix any critical/high priority issues found
4. Re-test fixed components
5. Proceed with frontend development once tests pass

**Estimated Timeline:**
- Test execution: 8-12 hours
- Issue fixes: 4-8 hours (depending on findings)  
- Regression testing: 2-4 hours
- **Total: 14-24 hours**