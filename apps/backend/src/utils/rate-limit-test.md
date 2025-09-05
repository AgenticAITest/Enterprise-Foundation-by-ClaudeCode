# Rate Limiting Implementation Test Guide

## ✅ **Implemented Rate Limits**

### **1. Global Rate Limiting**
- **Limit**: 2000 requests per 15 minutes per IP
- **Purpose**: Handles office NAT scenarios where multiple users share same public IP
- **Applied to**: All requests

### **2. Module-Specific Rate Limits**
- **Authentication**: 5 attempts per 15 minutes (per IP)
- **Core APIs**: 100 requests per minute
- **WMS**: 300 requests per minute  
- **Accounting**: 150 requests per minute
- **POS**: 800 requests per minute (high-volume retail)
- **HR**: 50 requests per minute (low-volume admin)
- **Read-Only**: 500 requests per minute (dashboards/reports)

### **3. Role-Based Rate Limits (per user per minute)**
- **Super Admin**: 1000 requests
- **Tenant Admin**: 500 requests  
- **Regular Users**: 200 requests
- **API-Only Users**: 2000 requests

### **4. Operation-Based Rate Limits (per user)**
- **Bulk Operations**: 10 per 5 minutes
- **File Uploads**: 10 per minute
- **Report Generation**: 10 per 15 minutes

## 🧪 **Test Endpoints Available**

All test endpoints are available at: `http://localhost:3001/api/rate-limits/`

### **Rate Limit Information**
```bash
GET /api/rate-limits/info
Authorization: Bearer <token>

# Returns current rate limit configuration
```

### **Authentication Rate Limit Test**
```bash
POST /api/rate-limits/demo/auth
# Try 6 times quickly - should get rate limited on 6th attempt
# Limit: 5/15min
```

### **Role-Based Rate Limit Test**  
```bash
GET /api/rate-limits/demo/role-based  
Authorization: Bearer <token>
# Rate limit varies by user role
```

### **Bulk Operation Test**
```bash
POST /api/rate-limits/demo/bulk
Authorization: Bearer <token>
# Try 11 times quickly - should get rate limited on 11th attempt
# Limit: 10/5min
```

### **File Upload Test**
```bash
POST /api/rate-limits/demo/upload
Authorization: Bearer <token>  
# Try 11 times quickly - should get rate limited on 11th attempt
# Limit: 10/min
```

### **Report Generation Test**
```bash
POST /api/rate-limits/demo/report
Authorization: Bearer <token>
# Try 11 times quickly - should get rate limited on 11th attempt  
# Limit: 10/15min
```

### **Status Check**
```bash
GET /api/rate-limits/status
Authorization: Bearer <token>

# Returns current rate limit headers and user info
```

## 🔍 **Smart Module Detection**

The system automatically applies appropriate rate limits based on URL patterns:

- `/auth/` → Authentication rate limit (5/15min)
- `/wms/` → WMS rate limit (300/min)  
- `/accounting/` → Accounting rate limit (150/min)
- `/pos/` → POS rate limit (800/min)
- `/hr/` → HR rate limit (50/min)
- `/roles/`, `/users/`, `/permissions/` → Core API rate limit (100/min)
- GET requests to `/dashboard`, `/reports` → Read-only rate limit (500/min)
- Default → Role-based rate limit

## 📊 **Rate Limit Headers**

When rate limits are applied, responses include these headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1693747200
```

## 🚫 **Rate Limit Response Format**

When rate limit is exceeded:
```json
{
  "status": "error",
  "message": "Too many requests. Please slow down.",
  "retryAfter": "1 minute"
}
```

## ⚡ **Performance Features**

1. **User + IP Key Generation**: More accurate tracking per user
2. **Success/Failure Filtering**: Failed logins count more than successful ones
3. **Development Bypass**: Can bypass in development with `BYPASS_RATE_LIMIT=true`
4. **Memory Store**: Uses in-memory store (Redis recommended for production)

## 🛠️ **Configuration Override**

Set environment variables to override default behavior:
```bash
NODE_ENV=development        # Enables development features
BYPASS_RATE_LIMIT=true     # Completely bypasses rate limiting
```

## ✅ **Production Recommendations**

1. **Use Redis Store**: Replace memory store with Redis for distributed systems
2. **Monitor Rate Limits**: Set up alerts for high rate limit usage
3. **Adjust Based on Usage**: Monitor actual usage patterns and adjust limits
4. **IP Whitelisting**: Consider whitelisting trusted IPs for higher limits
5. **Custom Headers**: Add rate limit info to API documentation

## 🎯 **Implementation Status**

- ✅ Global IP-based rate limiting (2000/15min)
- ✅ Module-specific rate limiting (all modules)
- ✅ Role-based rate limiting (all roles)  
- ✅ Operation-based rate limiting (bulk, upload, reports)
- ✅ Smart auto-detection based on URL patterns
- ✅ Comprehensive error messages and headers
- ✅ Test endpoints for validation
- ✅ Development bypass capability

**Rate limiting implementation is COMPLETE and ready for production use!** 🚀