# Multi-Tenant ERP System - Product & User Guide

## Table of Contents
- [System Architecture Overview](#system-architecture-overview)
- [User Hierarchy & Access Levels](#user-hierarchy--access-levels)
- [Module System](#module-system)
- [Core Module Deep Dive](#core-module-deep-dive)
- [Business Modules Overview](#business-modules-overview)
- [Role & Permission Management](#role--permission-management)
- [User Workflows](#user-workflows)
- [API Architecture](#api-architecture)
- [Database Structure](#database-structure)

---

## System Architecture Overview

### Multi-Tenant SaaS Platform
This is a **multi-tenant SaaS ERP system** where each organization (tenant) gets their own isolated environment while sharing the same application infrastructure.

```
┌─────────────────────────────────────────────────────────────┐
│                    SYSTEM LEVELS                            │
├─────────────────────────────────────────────────────────────┤
│  🏢 SUPER ADMIN LEVEL                                       │
│  - Manages entire platform                                 │
│  - Controls all tenants and global modules                 │
│  - Revenue analytics and system monitoring                 │
├─────────────────────────────────────────────────────────────┤
│  🏬 TENANT LEVEL (Organization)                            │
│  - Company: "Acme Corp" (tenant_123)                      │
│  - Subdomain: acmecorp.yourapp.com                        │
│  - Own database schema, users, and configuration          │
├─────────────────────────────────────────────────────────────┤
│  📦 MODULE LEVEL (Per Tenant)                              │
│  - Core (Always active)                                   │
│  - WMS, Accounting, POS, HR (Optional modules)            │
│  - Each module has its own permissions and roles          │
├─────────────────────────────────────────────────────────────┤
│  👤 USER LEVEL (Per Tenant per Module)                     │
│  - Users can have different roles in different modules    │
│  - Permissions are module-specific                        │
│  - Data access controlled by role + data scopes           │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + TypeScript + PostgreSQL
- **Authentication**: JWT + Multi-tenant context
- **Database**: PostgreSQL with tenant-specific schemas
- **Architecture**: Plugin-based modular architecture with auto-discovery

---

## User Hierarchy & Access Levels

### 1. Super Admin (Platform Level)
**Location**: `/admin` portal (separate from tenant portals)
**Access Level**: Entire platform across all tenants

#### Capabilities:
- **Tenant Management**: Create, suspend, configure tenants
- **Global Module Control**: Enable/disable modules platform-wide
- **Revenue Analytics**: Track subscription revenue, usage metrics
- **System Monitoring**: Global audit logs, security events
- **Module Marketplace**: Manage available modules and pricing
- **Platform Settings**: Configure global system parameters

#### Typical Users:
- Platform owners/operators
- DevOps engineers
- Business development managers

### 2. Tenant Admin (Organization Level)
**Location**: `/{tenant-subdomain}/admin` portal
**Access Level**: Their specific organization/tenant only

#### Capabilities:
- **Module Management**: Activate/configure modules for their tenant
- **User Management**: Create, edit, delete users within their organization
- **Role Management**: Define custom roles and permissions per module
- **Data Scope Management**: Control what data users can access
- **Tenant Settings**: Configure organization-wide settings
- **Audit Trail**: View tenant-specific activity logs

#### Typical Users:
- IT administrators
- HR managers
- Operations directors

### 3. Module Users (Operational Level)
**Location**: `/{tenant-subdomain}` main application
**Access Level**: Specific modules with role-based permissions

#### Role Examples by Module:
- **Core**: Manager, User, Viewer
- **WMS**: Warehouse Manager, Inventory Worker, Auditor
- **Accounting**: Finance Manager, Bookkeeper, Expense Submitter
- **POS**: Store Manager, Cashier, Shift Supervisor
- **HR**: HR Manager, Payroll Processor, Employee

---

## Module System

### Module Architecture
Each module is a **self-contained business unit** with:
- Own permission resources and actions
- Dedicated role templates
- Specific UI components and workflows
- Independent data models
- Module-specific settings and configuration

### Module Status Types
1. **Active**: Fully operational and accessible
2. **Trial**: Limited-time access with restrictions
3. **Inactive**: Disabled but data preserved
4. **Suspended**: Blocked due to billing/compliance issues

### Module Dependencies
```
Core Module (Always Required)
├── Provides: User management, settings, dashboard, reports
├── Required by: All other modules
└── Contains: Base authentication and tenant management

Business Modules (Optional)
├── WMS (Warehouse Management)
├── Accounting (Financial Management)  
├── POS (Point of Sale)
└── HR (Human Resources)
```

---

## Plugin-Based Modular Architecture

### Overview
The system uses a **plugin-based modular architecture** that enables conflict-free development, automatic module discovery, and seamless integration. This architecture allows multiple teams to work independently on different modules without merge conflicts.

### Directory Structure
```
Code Base/
├── modules/                          # Module plugins directory
│   ├── warehouse/                   # ← Team A works here exclusively
│   │   ├── frontend/               # React components & pages
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   └── routes.tsx
│   │   ├── backend/                # Express routes & controllers
│   │   │   ├── routes/
│   │   │   ├── controllers/
│   │   │   └── models/
│   │   ├── database/               # Module-specific migrations
│   │   │   ├── migrations/
│   │   │   └── seeds/
│   │   ├── types/                  # TypeScript definitions
│   │   ├── tests/                  # Module-specific tests
│   │   └── module.config.ts        # Module configuration
│   │
│   ├── accounting/                 # ← Team B works here exclusively
│   │   ├── frontend/
│   │   ├── backend/
│   │   ├── database/
│   │   └── module.config.ts
│   │
│   ├── pos/                        # ← Team C works here exclusively
│   │   └── [same structure]
│   │
│   └── hr/                         # ← Team D works here exclusively
│       └── [same structure]
│
├── packages/
│   ├── module-loader/              # Auto-discovery engine
│   │   ├── src/
│   │   │   ├── discovery.ts        # Module auto-discovery
│   │   │   ├── integration.ts      # Module integration logic
│   │   │   └── registry.ts         # Module registry management
│   │   └── package.json
│   │
│   ├── shared/                     # Shared utilities & types
│   └── ui/                         # Common UI components
│
├── apps/
│   ├── frontend/                   # Main React application
│   │   ├── src/
│   │   │   ├── modules/           # Auto-loaded module routes
│   │   │   └── module-loader.ts   # Frontend module loader
│   │   └── package.json
│   │
│   └── backend/                    # Main Express server
│       ├── src/
│       │   ├── modules/           # Auto-loaded module routes
│       │   └── module-loader.ts   # Backend module loader
│       └── package.json
```

### Module Configuration
Each module defines its capabilities and integration points:

```typescript
// modules/warehouse/module.config.ts
export default {
  code: 'wms',
  name: 'Warehouse Management System',
  version: '1.0.0',
  enabled: true,
  
  // Dependencies
  dependencies: ['core'],
  
  // Frontend integration
  frontend: {
    routes: './frontend/routes.tsx',
    components: './frontend/components/index.ts',
    pages: './frontend/pages/index.ts'
  },
  
  // Backend integration
  backend: {
    routes: './backend/routes/index.ts',
    controllers: './backend/controllers/index.ts',
    models: './backend/models/index.ts'
  },
  
  // Database integration
  database: {
    migrations: './database/migrations/',
    seeds: './database/seeds/'
  },
  
  // Permissions & roles
  permissions: [
    'wms.inventory.view',
    'wms.inventory.create',
    'wms.inventory.edit',
    'wms.orders.process'
  ],
  
  roleTemplates: [
    'warehouse_admin',
    'warehouse_manager', 
    'inventory_worker'
  ]
}
```

### Auto-Discovery Engine

#### 1. Module Discovery
```typescript
// packages/module-loader/src/discovery.ts
import glob from 'glob';
import path from 'path';

export function discoverModules(): ModuleConfig[] {
  console.log('🔍 Discovering modules...');
  
  const configFiles = glob.sync('modules/*/module.config.ts');
  const modules = [];
  
  for (const configFile of configFiles) {
    try {
      const config = require(path.resolve(configFile)).default;
      
      if (config.enabled) {
        console.log(`✅ Found enabled module: ${config.name}`);
        modules.push(config);
      } else {
        console.log(`⏸️ Found disabled module: ${config.name}`);
      }
    } catch (error) {
      console.error(`❌ Error loading module config: ${configFile}`, error);
    }
  }
  
  return sortModulesByDependencies(modules);
}
```

#### 2. Frontend Integration
```typescript
// apps/frontend/src/module-loader.ts
import { discoverModules } from '@packages/module-loader';

export function integrateModules() {
  const modules = discoverModules();
  const routes = [];
  
  modules.forEach(module => {
    console.log(`🔌 Loading frontend for ${module.code}`);
    
    // Auto-register routes
    if (module.frontend.routes) {
      const moduleRoutes = require(module.frontend.routes).default;
      routes.push({
        path: `/${module.code}/*`,
        element: moduleRoutes
      });
    }
    
    // Auto-register components
    if (module.frontend.components) {
      const components = require(module.frontend.components);
      registerComponents(module.code, components);
    }
  });
  
  return routes;
}
```

#### 3. Backend Integration
```typescript
// apps/backend/src/module-loader.ts
import express from 'express';
import { discoverModules } from '@packages/module-loader';

export function integrateModules(app: express.Application) {
  const modules = discoverModules();
  
  modules.forEach(module => {
    console.log(`🔌 Loading backend for ${module.code}`);
    
    // Auto-register API routes
    if (module.backend.routes) {
      const routes = require(module.backend.routes).default;
      app.use(`/api/${module.code}`, routes);
      console.log(`📡 Registered API routes: /api/${module.code}`);
    }
    
    // Auto-register database models
    if (module.backend.models) {
      const models = require(module.backend.models);
      registerModels(module.code, models);
    }
  });
}
```

### Development Workflows

#### Individual Module Development
```bash
# Team A - Warehouse Module Development
git clone repo
cd modules/warehouse

# Install dependencies for this module only
npm install

# Start isolated development server
npm run dev:warehouse
# This runs: vite serve frontend & nodemon backend
# Only warehouse module is active

# Make changes in complete isolation
# No risk of conflicts with other teams

# Commit changes
git add modules/warehouse/
git commit -m "feat(wms): add inventory tracking"
git push
```

#### Parallel Team Development
```bash
# Team A (Warehouse)
cd modules/warehouse
npm run dev:warehouse    # Port 3001

# Team B (Accounting) - SIMULTANEOUSLY
cd modules/accounting  
npm run dev:accounting   # Port 3002

# Team C (POS) - SIMULTANEOUSLY
cd modules/pos
npm run dev:pos         # Port 3003

# NO CONFLICTS - Each team works in isolated directories
```

#### Full System Integration
```bash
# Integration Testing - All Modules
npm run dev              # Starts all enabled modules
npm run build           # Builds all modules into cohesive app
npm run test:integration # Tests module interactions

# Database Synchronization
npm run db:sync         # Auto-runs all module migrations
npm run db:seed         # Seeds data for all modules
```

### Module Lifecycle Management

#### 1. Module Development
```bash
# Create new module scaffold
npm run create:module accounting

# This generates:
modules/accounting/
├── frontend/
├── backend/ 
├── database/
├── types/
├── tests/
└── module.config.ts
```

#### 2. Module Activation
```typescript
// Enable module in config
{
  enabled: true,  // Module becomes discoverable
  dependencies: ['core'],
  version: '1.0.0'
}
```

#### 3. Hot Module Swapping
```bash
# Disable module without code changes
npm run module:disable accounting

# Enable module
npm run module:enable accounting  

# System automatically reloads with/without module
```

### Benefits of Plugin Architecture

#### ✅ **Zero Merge Conflicts**
- Each team works in isolated `modules/[name]/` directories
- No shared files that multiple teams modify
- Git conflicts are virtually eliminated

#### ✅ **Independent Development**
- Modules can be developed, tested, and deployed independently
- Teams can use different development speeds and methodologies
- Module-specific CI/CD pipelines

#### ✅ **Automatic Integration** 
- System automatically discovers and integrates enabled modules
- No manual registration or configuration needed
- Seamless module loading at runtime

#### ✅ **Team Scaling**
- Easy to add new teams and modules
- Clear ownership boundaries
- Minimal coordination overhead

#### ✅ **Hot Swapping**
- Modules can be enabled/disabled without code changes
- Perfect for A/B testing and gradual rollouts
- Easy tenant-specific module configuration

#### ✅ **Maintenance Efficiency**
- Bug fixes isolated to specific modules
- Module-specific testing and deployment
- Clear separation of concerns

### Advanced Module Features

#### Module Communication
```typescript
// Inter-module communication via events
import { ModuleEventBus } from '@packages/module-loader';

// WMS module emits inventory update
ModuleEventBus.emit('inventory.updated', {
  productId: '123',
  quantity: 50
});

// Accounting module listens for inventory changes
ModuleEventBus.on('inventory.updated', (data) => {
  updateInventoryValue(data.productId, data.quantity);
});
```

#### Shared Resources
```typescript
// Shared utilities across modules
import { DatabaseConnection, AuthMiddleware } from '@packages/shared';

// Each module can use shared infrastructure
export const warehouseRouter = express.Router();
warehouseRouter.use(AuthMiddleware.requirePermission('wms.inventory.view'));
```

#### Module Testing
```bash
# Test individual module
cd modules/warehouse
npm test                 # Unit tests for warehouse only

# Integration testing 
npm run test:integration # Test module interactions
npm run test:e2e        # End-to-end testing with all modules
```

This plugin architecture transforms development from a potential conflict-heavy monolith into a smooth, scalable, team-friendly system where multiple developers can work efficiently without stepping on each other's toes.

---

## Core Module Deep Dive

### Purpose
The **Core Module** provides foundational functionality required by all other modules. It cannot be disabled and serves as the platform's backbone.

### Core Resources & Permissions

#### 1. Dashboard (`core.dashboard`)
- **View Permission**: See overview metrics and widgets
- **Edit Permission**: Customize dashboard layout and widgets
- **Typical Usage**: Landing page after login with key business metrics

#### 2. User Management (`core.users`)
- **View**: List all users in the tenant
- **Create**: Add new users to the organization
- **Edit**: Modify user profiles and basic settings
- **Delete**: Remove users (with proper safeguards)
- **Typical Usage**: HR and IT admins managing employee accounts

#### 3. Settings (`core.settings`)
- **View**: Read tenant configuration and system settings
- **Edit**: Modify organization settings, preferences, integrations
- **Typical Usage**: Configure timezone, company info, notification preferences

#### 4. Tenant Management (`core.tenant_management`)
- **View**: See tenant information and subscription details
- **Edit**: Modify tenant settings, billing information
- **Typical Usage**: Administrative oversight of the organization account

#### 5. Reports (`core.reports`)
- **View**: Access to various system and usage reports
- **Export**: Generate PDF/Excel reports for external use
- **Typical Usage**: Management reporting and data analysis

### Core Role Templates

#### Tenant Administrator
- **Full Core Access**: All core permissions granted
- **Purpose**: Complete administrative control
- **Typical Count**: 1-2 per tenant
- **Use Case**: IT admin or company owner

#### Manager  
- **Limited Administrative Access**: 
  - Dashboard: View + Edit
  - Users: View + Create + Edit (no delete)
  - Settings: View only
  - Reports: View + Export (conditional)
- **Purpose**: Department managers with oversight responsibilities
- **Typical Count**: 3-8 per tenant

#### User
- **Basic Access**:
  - Dashboard: View only
  - Settings: View only (personal settings)
  - Reports: View only
- **Purpose**: Standard employees using the system
- **Typical Count**: Majority of users

---

## Business Modules Overview

### 1. WMS (Warehouse Management System)

#### Purpose
Complete warehouse operations including inventory tracking, order fulfillment, and logistics management.

#### Key Resources:
- **Inventory Management**: Track stock levels, locations, movements
- **Order Processing**: Handle inbound/outbound orders
- **Reporting**: Generate inventory reports and analytics
- **User Management**: WMS-specific user roles and permissions

#### Role Templates:
- **Warehouse Admin**: Full WMS control
- **Warehouse Manager**: Operational oversight and reporting
- **Warehouse Supervisor**: Team management and task assignment
- **Warehouse Worker**: Basic operations (receive, pick, pack)
- **Inventory Auditor**: Read-only access for auditing purposes

#### Typical Use Case:
Manufacturing company with physical inventory needs real-time stock tracking, automated reorder points, and integration with their accounting system.

### 2. Accounting (Financial Management)

#### Purpose
Complete financial operations including invoicing, expense tracking, reporting, and compliance.

#### Key Resources:
- **Invoicing**: Create, send, and track customer invoices
- **Expenses**: Manage business expenses and approvals
- **Financial Reporting**: P&L, balance sheets, cash flow
- **Tax Management**: Tax calculations and compliance reporting

#### Role Templates:
- **Finance Admin**: Full accounting access and configuration
- **Finance Manager**: Financial oversight and reporting
- **Accountant**: Day-to-day bookkeeping and transactions
- **Bookkeeper**: Data entry and basic financial tasks
- **Expense Submitter**: Submit and track expense reports

#### Typical Use Case:
Service company needing to track billable hours, generate client invoices, manage vendor payments, and produce financial reports for stakeholders.

### 3. POS (Point of Sale)

#### Purpose
Retail operations including sales transactions, customer management, and store operations.

#### Key Resources:
- **Sales Processing**: Handle transactions, payments, receipts
- **Customer Management**: Track customer data and purchase history
- **Inventory Integration**: Real-time stock updates from sales
- **Store Operations**: Multi-location support and regional management

#### Role Templates:
- **POS Admin**: Full system configuration and reporting
- **Regional Manager**: Multi-store oversight and analytics
- **Store Manager**: Single location management and reporting
- **Shift Supervisor**: Team oversight and daily operations
- **Cashier**: Basic sales transactions and customer service

#### Typical Use Case:
Retail chain with multiple locations needing centralized reporting, inventory synchronization, and customer loyalty tracking across all stores.

### 4. HR (Human Resources)

#### Purpose
Employee lifecycle management including recruitment, payroll, performance, and compliance.

#### Key Resources:
- **Employee Management**: Personnel records and organization structure
- **Payroll Processing**: Salary calculations and payment processing
- **Performance Management**: Reviews, goals, and development tracking
- **Compliance**: Labor law compliance and reporting

#### Role Templates:
- **HR Admin**: Full HR system access and configuration
- **HR Manager**: HR operations and strategic oversight
- **Payroll Processor**: Payroll calculations and payment processing
- **Department Manager**: Team oversight and performance management
- **Employee**: Self-service access to personal information

#### Typical Use Case:
Growing company needing to automate payroll, track employee performance, manage benefits, and ensure compliance with labor regulations.

---

## Role & Permission Management

### Permission Hierarchy
The system uses a **4-level permission hierarchy**:

```
Module Level
├── Resource Level (e.g., core.users)
    ├── Action Level (e.g., view, create, edit, delete)
        └── Data Scope Level (e.g., own data, department data, all data)
```

### Role Builder Interface
The Role Builder provides a comprehensive interface for creating and editing roles with enterprise-grade capabilities:

```
┌─────────────────────┬─────────────────────┬─────────────────────┐
│   BASIC INFO        │   PERMISSION TREE   │   PREVIEW/SUMMARY   │
│   ┌─────────────┐   │   ┌─────────────┐   │   ┌─────────────┐   │
│   │ Name        │   │   │ □ Users     │   │   │ Effective   │   │
│   │ Code        │   │   │   ☑ Create  │   │   │ Permissions │   │
│   │ Description │   │   │   ☑ Read    │   │   │             │   │
│   │ Module      │   │   │   ☐ Update  │   │   │ 🔍 Test     │   │
│   │ Type        │   │   │   ☐ Delete  │   │   │ 📊 Impact   │   │
│   └─────────────┘   │   │ □ Reports   │   │   │ ⚠️ Conflicts │   │
│                     │   │   ☐ View    │   │   │             │   │
│   INHERITANCE       │   │   ☐ Export  │   │   └─────────────┘   │
│   ┌─────────────┐   │   └─────────────┘   │                     │
│   │ Base Role   │   │                     │   QUICK ACTIONS     │
│   │ □ Inherit   │   │   BULK ACTIONS      │   ┌─────────────┐   │
│   └─────────────┘   │   [Select All]      │   │ Save Draft  │   │
│                     │   [Clear All]       │   │ Apply Temp  │   │
│                     │   [Apply Pattern]   │   │ Test Role   │   │
│                     │                     │   └─────────────┘   │
└─────────────────────┴─────────────────────┴─────────────────────┘

Features:
✅ Multi-mode support (Create, Edit, Template, Clone)
✅ Visual permission tree with hierarchical selection
✅ Real-time validation and conflict detection
✅ Template integration and customization
✅ Advanced configuration (session limits, IP restrictions, time-based access)
✅ Role inheritance with permission cascading
✅ Draft saving and preview functionality
```

### Bulk Assignment Interface
The Bulk Assignment Modal enables efficient management of role assignments across multiple users:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Bulk Role Assignment                              │
│  [Back] [Save Draft] [Preview Changes] [Execute Assignment] [Help] [Close]  │
└─────────────────────────────────────────────────────────────────────────────┘
┌──────────────────┬──────────────────┬─────────────────────────────────────────┐
│   USER SELECTION │  ROLE SELECTION  │           ASSIGNMENT PREVIEW           │
│                  │                  │                                         │
│ 🔍 Search users  │ 🔍 Search roles  │ 📊 Assignment Summary                   │
│ ┌──────────────┐ │ ┌──────────────┐ │ ┌─────────────────────────────────────┐ │
│ │Filter Options│ │ │Module: Core  │ │ │ 📈 25 Users × 3 Roles = 75 Changes │ │
│ │☑ Active      │ │ │☑ Admin       │ │ │ ⚠️  12 Conflicts detected           │ │
│ │☑ Inactive    │ │ │☐ Manager     │ │ │ 🕒 Scheduled for: Immediate         │ │
│ │☑ Pending     │ │ │☑ User        │ │ └─────────────────────────────────────┘ │
│ └──────────────┘ │ └──────────────┘ │                                         │
│                  │                  │ 🔄 Assignment Matrix                    │
│ Selected Users:  │ Role Templates:  │ ┌─────────────────────────────────────┐ │
│ ┌──────────────┐ │ ┌──────────────┐ │ │User    │Admin│Mgr│User│Status        │ │
│ │☑ John Doe    │ │ │[Standard Set]│ │ │John D. │ ✓   │   │ ⚠️ │Conflict      │ │
│ │☑ Jane Smith  │ │ │[Manager Set] │ │ │Jane S. │ ✓   │ ✓ │   │New           │ │
│ │☑ Bob Wilson  │ │ │[Power User]  │ │ │Bob W.  │     │   │ ✓ │Replace       │ │
│ └──────────────┘ │ └──────────────┘ │ └─────────────────────────────────────┘ │
│                  │                  │                                         │
│ [Select All]     │ Permission Preview│ ⚡ Conflict Resolution                   │
│ [Clear All]      │ ┌──────────────┐ │ ┌─────────────────────────────────────┐ │
│ [Import CSV]     │ │Selected roles│ │ │⚠️  John Doe: Admin + Manager        │ │
│                  │ │grant 47 total│ │ │   → Resolve: Keep highest privilege │ │
│ 25 users selected│ │permissions   │ │ │⚠️  Jane Smith: Conflicting schedules│ │
│                  │ └──────────────┘ │ │   → Resolve: Sequential assignment  │ │
│                  │                  │ └─────────────────────────────────────┘ │
└──────────────────┴──────────────────┴─────────────────────────────────────────┘

Features:
✅ Smart user filtering with multiple criteria
✅ Role template and bundle selection
✅ Real-time conflict detection and resolution
✅ Assignment scheduling and automation
✅ CSV import/export functionality
✅ Complete audit trail and rollback capability
✅ Impact analysis and preview functionality
```

### Data Scope vs Traditional RBAC

#### Traditional RBAC Limitations
Traditional Role-Based Access Control only answers **"CAN the user do this action?"** but fails to address **"WHICH data can they access?"**

```typescript
// Traditional RBAC Problem
if (user.hasPermission('invoices.read')) {
  // ❌ ALL users with same role see ALL invoices
  return getAllInvoices(); // No organizational boundaries!
}
```

**Problems:**
- ❌ All users with same role see ALL tenant data
- ❌ No organizational boundaries within permissions  
- ❌ Role explosion (need separate roles for each department)
- ❌ Poor compliance with data segregation requirements

#### Data Scope RBAC Solution
Our implementation combines traditional RBAC with **Data Scopes** to control **which specific data** users can access within their granted permissions.

```typescript
// Data Scope RBAC Solution  
if (user.hasPermission('invoices.read')) {
  const userScopes = user.getDataScopes();
  
  switch(userScopes.type) {
    case 'global':     // Admin sees everything
      return getAllInvoices(); 
    case 'department': // Manager sees department only
      return getInvoicesByDepartment(userScopes.departmentId);
    case 'team':       // Team lead sees team only
      return getInvoicesByTeam(userScopes.teamId);
    case 'personal':   // Employee sees only their invoices
      return getInvoicesByUser(user.id);
  }
}
```

#### Real-World Example

**Scenario**: 3 users with "Finance Manager" role in company with Sales, Marketing, Finance departments

**Traditional RBAC:**
```
❌ PROBLEM: All 3 Finance Managers see:
- ALL sales invoices + personal data
- ALL marketing invoices + personal data  
- ALL finance invoices + personal data
- Violates data privacy and business logic
```

**Data Scope RBAC:**
```
✅ SOLUTION: Same role, scoped data access:
- Sales Finance Manager    → Only sales department data
- Marketing Finance Manager → Only marketing department data
- Corporate Finance Manager → All department data (global scope)
```

#### Data Scope Hierarchy
```
🌐 Global Scope
├── 🏢 Company Scope
    ├── 📋 Department Scope  
        ├── 👥 Team Scope
            └── 👤 Personal Scope
```

#### Implementation Benefits

| Aspect | Traditional RBAC | Data Scope RBAC |
|--------|-----------------|-----------------|
| **Permission Model** | Role → Actions | Role → Actions + Data Boundaries |
| **Data Access** | All or Nothing | Filtered by Organizational Rules |
| **Scalability** | Poor (role explosion) | Excellent (scope combinations) |
| **Compliance** | Basic | Advanced (data segregation) |
| **User Experience** | Overwhelming data | Relevant data only |
| **Performance** | Queries all data | Queries filtered subsets |
| **Security** | High blast radius | Limited blast radius |

#### Technical Implementation

**Database Query Transformation:**

Traditional RBAC:
```sql
SELECT * FROM invoices 
WHERE user_has_permission('invoices.read')
```

Data Scope RBAC:
```sql  
SELECT * FROM invoices 
WHERE user_has_permission('invoices.read')
  AND (
    user_scope_type = 'global' 
    OR department_id = user_department_id
    OR team_id = user_team_id  
    OR created_by = user_id
  )
```

### Permission Types

#### 1. Granted Permissions
- **Definition**: Explicitly allowed actions within user's data scope
- **Color Code**: Green ✅
- **Example**: User can create invoices in their department

#### 2. Denied Permissions
- **Definition**: Explicitly blocked actions  
- **Color Code**: Red ❌
- **Example**: User cannot delete financial records

#### 3. Inherited Permissions
- **Definition**: Permissions from role templates
- **Color Code**: Green ✅ (with inheritance indicator)
- **Example**: Manager role inherits basic user permissions

#### 4. Conditional Permissions
- **Definition**: Permissions dependent on data scope or context
- **Color Code**: Yellow 🟡
- **Example**: User can edit expenses but only their own submissions

### Data Scopes
Control **what data** users can access within their permitted actions:

- **Global**: Access to all tenant data
- **Department**: Access to department-specific data
- **Team**: Access to team/group data  
- **Personal**: Access to only their own data
- **Custom**: Manually defined data boundaries

---

## User Workflows

### Super Admin Workflow

#### 1. Platform Management
```
Login to Super Admin Portal → 
View System Dashboard → 
Monitor Tenant Activity → 
Configure Global Modules → 
Review Revenue Analytics
```

#### 2. Tenant Onboarding
```
Create New Tenant → 
Configure Initial Modules → 
Set Trial Periods → 
Monitor Usage → 
Convert to Paid Subscription
```

### Tenant Admin Workflow

#### 1. Organization Setup
```
Login to Tenant Admin Portal →
Activate Required Modules →
Configure Module Settings →
Create User Accounts →
Assign Roles and Permissions
```

#### 2. User Management
```
Access User Management →
Create New User →
Select Module Access →
Assign Appropriate Role →
Configure Data Scopes →
Send Welcome Email
```

#### 3. Role Configuration
```
Access Role Management →
Choose Module (Core, WMS, etc.) →
Create Custom Role OR Use Template →
Configure Permissions Matrix →
Test Role Permissions →
Assign to Users
```

### End User Workflow

#### 1. Daily Operations
```
Login to Main Application →
Access Authorized Modules →
Perform Role-Based Tasks →
View Relevant Reports →
Update Personal Settings
```

#### 2. Module-Specific Tasks
- **WMS User**: Check inventory → Process orders → Generate shipping labels
- **Accounting User**: Create invoices → Record expenses → Generate reports
- **POS User**: Process sales → Handle returns → End-of-day reconciliation
- **HR User**: Update employee records → Process payroll → Track performance

---

## API Architecture

### Multi-Tenant API Structure
```
/api/
├── admin/                    # Super Admin APIs
│   ├── tenants/             # Tenant management
│   ├── modules/             # Global module control
│   └── billing/             # Revenue analytics
├── tenants/{tenantId}/       # Tenant-specific APIs
│   ├── modules/             # Tenant module management
│   ├── users/               # User management
│   ├── roles/               # Role management
│   └── permissions/         # Permission management
└── modules/                  # Module-specific APIs
    ├── core/                # Core functionality
    ├── wms/                 # Warehouse management
    ├── accounting/          # Financial operations
    ├── pos/                 # Point of sale
    └── hr/                  # Human resources
```

### Authentication Flow
1. **User Login**: JWT token issued with tenant context
2. **Request Processing**: Middleware validates tenant access
3. **Permission Check**: Module and action permissions verified
4. **Data Filtering**: Results filtered by data scope
5. **Response**: Authorized data returned

---

## Database Structure

### Multi-Tenant Schema Design
```sql
-- Public Schema (Shared)
public.tenants              -- Tenant information
public.users                -- SSO user accounts
public.modules              -- Available modules
public.module_role_templates -- Standard role definitions

-- Tenant-Specific Schemas
tenant_123.roles            -- Custom roles per tenant
tenant_123.role_permissions -- Permission assignments
tenant_123.user_module_roles -- User-role-module mappings
tenant_123.user_data_scopes  -- Data access boundaries

-- Module-Specific Tables (per tenant schema)
tenant_123.wms_inventory    -- WMS data
tenant_123.acc_invoices     -- Accounting data
tenant_123.pos_transactions -- POS data
tenant_123.hr_employees     -- HR data
```

### Data Isolation
- **Tenant Isolation**: Each tenant has its own database schema
- **Row-Level Security**: RLS policies prevent cross-tenant data access
- **Module Isolation**: Module data separated by table prefixes
- **User Context**: All queries include tenant and user context

---

## Current Implementation Status

### ✅ Completed (Phases 1-4)
- **Database Foundation**: Multi-tenant schema with RLS
- **Module System**: Complete module definitions and templates
- **Backend APIs**: All role and permission management endpoints
- **Security Middleware**: Authentication, authorization, rate limiting
- **Audit System**: Comprehensive activity logging

### 🔄 In Progress (Phase 5.2)
- **Tenant Admin Portal**: Role management interface
  - ✅ Step 1: Data Integration & Context
  - ✅ Step 2A: RoleListView Component  
  - ✅ Step 2B: RolePermissionMatrix
  - ⏳ Step 2C: RoleTemplatesBrowser (Next)

### 📋 Upcoming
- **User Management Interface**: Bulk operations, role assignments
- **Data Scope Configuration**: Visual data boundary setup
- **Module-Specific UIs**: WMS, Accounting, POS, HR interfaces
- **Super Admin Portal**: Enhanced with tenant management

---

## Security Model

### Access Control Matrix
```
User Type    | Core Access | Module Config | User Mgmt | Cross-Tenant
-------------|-------------|---------------|-----------|-------------
Super Admin  | All tenants | Global        | All       | Yes
Tenant Admin | Own tenant  | Tenant-only   | Tenant    | No
Module User  | Role-based  | None          | None      | No
```

### Data Protection
- **Encryption**: All sensitive data encrypted at rest and in transit
- **Audit Trail**: All actions logged with user and tenant context
- **Rate Limiting**: API protection against abuse
- **Session Management**: Secure JWT with proper expiration

---

## Troubleshooting Guide

### Common Issues

#### 1. Permission Denied Errors
- **Check**: User role assignments in target module
- **Verify**: Data scope configuration
- **Review**: Conditional permission requirements

#### 2. Module Access Issues
- **Confirm**: Module is activated for tenant
- **Check**: User has role assigned in that module
- **Verify**: Module subscription status (trial/active)

#### 3. Data Visibility Problems
- **Review**: Data scope settings for user
- **Check**: Department/team assignments
- **Verify**: Custom data boundary configuration

---

## Future Enhancements

### Planned Features
- **AI-Powered Insights**: Automated role recommendations
- **Advanced Workflows**: Approval processes for permission changes
- **Third-Party Integrations**: SSO, external HR systems, accounting tools
- **Mobile Applications**: iOS/Android apps for field operations
- **Advanced Analytics**: Usage patterns, optimization suggestions

### Scalability Roadmap
- **Multi-Region Deployment**: Global data centers
- **Advanced Caching**: Redis-based permission caching
- **Microservices**: Complete service separation by module
- **Event-Driven Architecture**: Real-time updates across modules

---

This guide will be updated as new features are implemented and the system evolves. For technical questions or feature requests, please refer to the development team.

**Last Updated**: September 7, 2025  
**Version**: 5.2 (Tenant Admin Portal Implementation)