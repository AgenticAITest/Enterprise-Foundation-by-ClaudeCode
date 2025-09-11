const { Client } = require('pg');

async function checkSuperAdmins() {
  const client = new Client({
    connectionString: 'postgresql://erp_admin:erp_password_2024@localhost:5432/erp_saas'
  });

  try {
    await client.connect();
    console.log('=== CHECKING SUPER_ADMINS TABLE ===');
    
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'super_admins' AND table_schema = 'public' 
      ORDER BY ordinal_position
    `);
    
    console.log('Super_admins table structure:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default || 'NULL'})`);
    });
    
    // Check if last_login exists
    const hasLastLogin = result.rows.some(row => row.column_name === 'last_login');
    console.log(`\n✅ last_login column exists: ${hasLastLogin}`);
    
    if (!hasLastLogin) {
      console.log('❌ Adding last_login column...');
      await client.query(`
        ALTER TABLE public.super_admins 
        ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE
      `);
      console.log('✅ last_login column added');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkSuperAdmins();