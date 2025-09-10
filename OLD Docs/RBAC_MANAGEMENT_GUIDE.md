# RBAC Management Guide

## Overview

The Role-Based Access Control (RBAC) system allows super admins to manage users, roles, and permissions across different tenants.

## Authentication Required

All RBAC operations require authentication as a **super admin**:
- Login with: `admin@example.com` / `password`
- This gives you `super_admin` role with full system access

## Available API Endpoints

All endpoints require `Authorization: Bearer <your-jwt-token>` header.

### 1. Get Available Roles and Permissions

```bash
GET /api/admin/roles
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "availableRoles": [
      {
        "name": "admin",
        "description": "Full access to tenant resources and user management",
        "defaultPermissions": ["read", "write", "delete", "admin"]
      },
      {
        "name": "manager", 
        "description": "Read and write access to business data",
        "defaultPermissions": ["read", "write"]
      },
      {
        "name": "user",
        "description": "Read-only access to assigned resources",
        "defaultPermissions": ["read"]
      }
    ],
    "availablePermissions": [
      {
        "name": "read",
        "description": "View data and resources"
      },
      {
        "name": "write", 
        "description": "Create and update data"
      },
      {
        "name": "delete",
        "description": "Delete data and resources" 
      },
      {
        "name": "admin",
        "description": "Manage users and system settings"
      }
    ]
  }
}
```

### 2. Get All Tenants

```bash
GET /api/admin/tenants
```

This returns all tenants in the system. You'll need the tenant `id` for user management operations.

### 3. Get Users in a Tenant

```bash
GET /api/admin/tenants/{tenantId}/users
```

**Example:**
```bash
# First get tenant list to find tenant ID
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/admin/tenants

# Then get users for that tenant
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/admin/tenants/acme-tenant-id/users
```

### 4. Create New User

```bash
POST /api/admin/tenants/{tenantId}/users
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "securepassword", 
  "firstName": "John",
  "lastName": "Doe",
  "role": "manager",
  "permissions": ["read", "write"]  // Optional - defaults based on role
}
```

**Roles Available:**
- `admin`: Full tenant access + user management
- `manager`: Read/write business data
- `user`: Read-only access

**Example cURL:**
```bash
curl -X POST http://localhost:3001/api/admin/tenants/{tenantId}/users \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@company.com",
    "password": "password123",
    "firstName": "Jane",
    "lastName": "Manager", 
    "role": "manager"
  }'
```

### 5. Update User Role/Permissions

```bash
PUT /api/admin/tenants/{tenantId}/users/{userId}
Content-Type: application/json

{
  "role": "admin",
  "permissions": ["read", "write", "delete", "admin"],
  "isActive": true
}
```

### 6. Deactivate/Delete User

```bash
# Soft delete (deactivate)
DELETE /api/admin/tenants/{tenantId}/users/{userId}

# Hard delete (permanent)
DELETE /api/admin/tenants/{tenantId}/users/{userId}?hardDelete=true
```

## Step-by-Step Usage Example

### Step 1: Login as Super Admin
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Save the returned token
```

### Step 2: Get Available Tenants
```bash
curl -H "Authorization: Bearer <your-token>" \
  http://localhost:3001/api/admin/tenants

# Note down the tenant ID you want to manage
```

### Step 3: View Current Users in Tenant
```bash
curl -H "Authorization: Bearer <your-token>" \
  http://localhost:3001/api/admin/tenants/TENANT-ID-HERE/users
```

### Step 4: Create a New Manager
```bash
curl -X POST http://localhost:3001/api/admin/tenants/TENANT-ID-HERE/users \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sales.manager@company.com",
    "password": "welcome123",
    "firstName": "Sarah",
    "lastName": "Johnson",
    "role": "manager"
  }'
```

### Step 5: Update User Permissions
```bash
curl -X PUT http://localhost:3001/api/admin/tenants/TENANT-ID-HERE/users/USER-ID-HERE \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin",
    "permissions": ["read", "write", "delete", "admin"]
  }'
```

## Current Database Setup

The system uses a multi-tenant architecture:

- **Super Admins**: Stored in `public.super_admins` table
- **Tenants**: Stored in `public.tenants` table  
- **Tenant Users**: Stored in `tenant_{subdomain}.users` tables

### Existing Data:
- **Super Admin**: `admin@example.com` / `password`
- **Tenants**: `dev`, `acme`, `techcorp` 
- **Dev Tenant Users**: `admin@example.com` and `user@example.com`

## RBAC Hierarchy

1. **Super Admin** (`super_admin` role)
   - Can manage all tenants and their users
   - Can create/delete tenants
   - Full system access

2. **Tenant Admin** (`admin` role) 
   - Can manage users within their tenant
   - Full access to tenant data
   - Cannot manage other tenants

3. **Manager** (`manager` role)
   - Read/write access to business data
   - Cannot manage users
   - Limited to assigned modules

4. **User** (`user` role)
   - Read-only access
   - Basic functionality only

## Security Features

- **Password Hashing**: bcrypt with salt rounds 12
- **JWT Tokens**: 24-hour expiration
- **Audit Logging**: All admin actions are logged
- **Soft Delete**: Users can be deactivated instead of deleted
- **Permission Validation**: Role-based permission checks
- **Tenant Isolation**: Users cannot access other tenant data

## Frontend Integration

The backend RBAC endpoints are ready. To create a UI for this:

1. **User Management Page**: List users, create/edit forms
2. **Role Assignment**: Dropdowns for roles and permission checkboxes  
3. **Tenant Selection**: Admin can switch between tenants
4. **Audit Trail**: View logs of user management actions

This provides complete RBAC functionality through API endpoints that can be integrated with any frontend interface.