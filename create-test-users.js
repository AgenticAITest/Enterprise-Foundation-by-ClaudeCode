const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  user: 'erp_admin',
  password: 'erp_password_2024',
  host: 'localhost',
  port: 5432,
  database: 'erp_saas'
});

async function createTestUsers() {
  try {
    const passwordHash = await bcrypt.hash('password', 12);
    
    const testUsers = [
      { email: 'moduleadmin@acme.com', schema: 'tenant_acme', firstName: 'Module', lastName: 'Admin', role: 'admin' },
      { email: 'warehouse@acme.com', schema: 'tenant_acme', firstName: 'Warehouse', lastName: 'User', role: 'user' },
      { email: 'accounting@techcorp.com', schema: 'tenant_techcorp', firstName: 'Accounting', lastName: 'User', role: 'user' },
      { email: 'readonly@techcorp.com', schema: 'tenant_techcorp', firstName: 'Read', lastName: 'Only', role: 'user' }
    ];

    for (const user of testUsers) {
      const checkUser = await pool.query(`SELECT COUNT(*) as count FROM ${user.schema}.users WHERE email = $1`, [user.email]);
      
      if (checkUser.rows[0].count == 0) {
        await pool.query(`
          INSERT INTO ${user.schema}.users 
          (id, email, password_hash, first_name, last_name, role, permissions, is_active, created_at, updated_at) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        `, [uuidv4(), user.email, passwordHash, user.firstName, user.lastName, user.role, ['*'], true]);
        
        console.log('✅ Created user:', user.email, 'in', user.schema);
      } else {
        console.log('✅ User already exists:', user.email);
      }
    }

    console.log('\n🎯 Test Users Ready:');
    console.log('- super@example.com → Super Admin');
    console.log('- admin@example.com → Dev Tenant Admin');
    console.log('- moduleadmin@acme.com → ACME Module Admin');
    console.log('- warehouse@acme.com → ACME Warehouse User');
    console.log('- accounting@techcorp.com → TechCorp Accounting User');
    console.log('- readonly@techcorp.com → TechCorp Read-Only User');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

createTestUsers();