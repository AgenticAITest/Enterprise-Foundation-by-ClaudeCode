# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

This is a Turborepo monorepo. Always use these commands from the root:

- `npm install` - Install all dependencies across workspaces
- `npm run dev` - Start development servers for all packages
- `npm run build` - Build all packages and applications  
- `npm run test` - Run tests across all packages
- `npm run lint` - Run linting across all packages
- `npm run typecheck` - Run TypeScript type checking across all packages
- `npm run clean` - Clean build artifacts

### Package-Specific Commands
- **Frontend:** `cd apps/frontend && npm run dev` (Vite dev server on port 3000)
- **Backend:** `cd apps/backend && npm run dev` (Express server on port 3001 with hot reload)
- **Shared:** `cd packages/shared && npm run build` (TypeScript compilation)

## Architecture Overview

**Multi-tenant SaaS ERP application** with the following structure:

### Monorepo Structure
```
apps/
  frontend/     - React frontend (Vite + TypeScript)  
  backend/      - Express.js API server
  admin/        - Super admin portal (planned)
packages/
  shared/       - Shared TypeScript types and utilities
  ui/           - UI component library (planned)
database/       - PostgreSQL schema and migrations
playwright/     - E2E testing (planned)
```

### Technology Stack

**Frontend (apps/frontend):**
- React 18 + TypeScript + Vite
- State: Zustand for client state, TanStack Query for server state
- Routing: React Router v6
- UI: Tailwind CSS + Radix UI components + Lucide icons
- Forms: React Hook Form + Zod validation

**Backend (apps/backend):**
- Express.js + TypeScript  
- Database: PostgreSQL with dynamic tenant schemas
- Cache: Redis for sessions and caching
- Auth: JWT + Passport.js + bcrypt
- External: AWS SDK, Nodemailer, Puppeteer for PDFs
- Logging: Winston

**Database (PostgreSQL):**
- Multi-tenant architecture with dynamic schemas
- Public schema: tenants, super_admins, billing_usage
- Tenant-specific schemas: users, company_settings, documents

### Implementation Status

**✅ Completed:**
- Monorepo setup and configuration
- Database schema design
- Package dependencies and build configuration
- Shared types and utilities

**🔄 Partially Implemented:**
- Frontend app structure (imports exist, components missing)
- Backend server setup (basic Express, missing middleware/routes)

**❌ Not Yet Implemented:**
- Authentication system
- Multi-tenant functionality
- UI component library
- Business logic and features
- Admin portal
- Testing framework

### Multi-Tenant Architecture

The application uses **subdomain-based tenant isolation**:
- Each tenant gets: `{subdomain}.yourapp.com`
- Database: Dynamic schema per tenant (`tenant_123`, `tenant_456`)
- Middleware handles tenant context and data isolation
- Shared resources in public schema (billing, tenant management)

### Development Priorities

1. **Core Infrastructure:** Complete backend setup, implement auth middleware
2. **Frontend Foundation:** Create missing providers, layouts, and pages  
3. **Multi-Tenant System:** Tenant isolation and management
4. **Business Features:** UI library, forms, multi-currency support
5. **Advanced Features:** Document management, billing, testing

### Important Files to Check

- `TODO.md` - Current development status and task tracking
- `database/schema.sql` - Complete database structure
- `packages/shared/src/types/index.ts` - All TypeScript interfaces
- Package.json files - Dependencies and scripts for each workspace

Always check TODO.md for current development status before making changes.