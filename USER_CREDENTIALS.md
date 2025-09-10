# User Credentials & Access Guide

## Current Login Information

### Super Admin (Full System Access)
- **Email:** `super@example.com`  
- **Password:** `password`
- **Access:** Full system administration, all modules, all permissions, super admin portal
- **Login URL:** http://localhost:3000

### Tenant Users (Dev Tenant)
- **Tenant Admin:** `admin@example.com` / `password` (tenant administration only)
- **Regular User:** `user@example.com` / `password`

## Port Configuration (STABLE)

| Service | Port | URL | Status |
|---------|------|-----|---------|
| Frontend | 3000 | http://localhost:3000 | ✅ Stable |
| Backend API | 3001 | http://localhost:3001/api | ✅ Stable |
| Admin Portal | 3002 | http://localhost:3002 | 🚧 Planned |

## Important Notes

### Authentication System
- The system checks for **super_admin** first, then **tenant users**
- User accounts exist in different tables:
  - Super Admin: `super@example.com` in `super_admins` table (global access)
  - Tenant Admin: `admin@example.com` in `tenant_dev.users` table (tenant-specific access)
- The login system will authenticate as super admin if credentials match

### Port Management
- **Never manually change ports** - they are configured in `.env` files
- If port conflicts occur, check what's using the port before changing
- Frontend proxy in `vite.config.ts` must match backend port (currently 3001)
- All CORS origins are configured in backend server

### Troubleshooting Login Issues

1. **"Failed to fetch" error:**
   - Check if backend is running on port 3001
   - Verify frontend proxy configuration matches backend port
   - Check CORS configuration includes http://localhost:3000

2. **"Invalid credentials" error:**
   - For Super Admin: Use `super@example.com` / `password`
   - For Tenant Admin: Use `admin@example.com` / `password`
   - Check database contains the user with matching password hash

3. **Port conflicts:**
   - Use `netstat -ano | findstr :3001` to check port usage
   - Kill conflicting processes or restart system
   - Ensure only one backend instance is running

## Development Setup

### Starting Services (Correct Order)
1. **Backend:** `cd apps/backend && npm run dev` (port 3001)
2. **Frontend:** `cd apps/frontend && npm run dev` (port 3000)
3. **Database:** Ensure PostgreSQL is running on port 5432

### Testing Credentials
All Playwright tests now use the correct credentials:
- Super Admin: `super@example.com` / `password`  
- Tenant Admin: `admin@example.com` / `password`
- Tests are located in: `playwright/utils/test-users.ts`

---

**Last Updated:** September 8, 2025  
**Verified Working:** ✅ All credentials tested and confirmed