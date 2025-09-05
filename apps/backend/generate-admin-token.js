import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

// Generate super admin token
const adminToken = jwt.sign({
  id: 'super-admin-1',
  userId: 'super-admin-1', 
  email: 'admin@example.com',
  role: 'super_admin',
  tenantId: null
}, JWT_SECRET, { 
  expiresIn: '1h' 
});

console.log('Super Admin Token:');
console.log(adminToken);
console.log('\nUse this token in Authorization header as:');
console.log(`Bearer ${adminToken}`);