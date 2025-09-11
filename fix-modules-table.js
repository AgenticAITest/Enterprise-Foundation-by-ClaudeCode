const { Client } = require('pg');

async function checkAndFixModulesTable() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'erp_saas',
    user: 'erp_admin',
    password: 'erp_password_2024'
  });

  try {
    await client.connect();
    
    console.log('=== CHECKING MODULES TABLE ===');
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'modules'
      )
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('✅ Modules table exists');
      
      // Check if status column exists
      const statusColumn = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'modules' AND table_schema = 'public' AND column_name = 'status'
      `);
      
      if (statusColumn.rows.length === 0) {
        console.log('Adding missing status column...');
        await client.query('ALTER TABLE public.modules ADD COLUMN status VARCHAR(20) DEFAULT \'active\'');
        console.log('✅ Added status column');
      } else {
        console.log('✅ Status column already exists');
      }
      
      // Check current structure
      const structure = await client.query(`
        SELECT column_name, data_type, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'modules' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      
      console.log('\nModules table structure:');
      structure.rows.forEach(row => {
        console.log(`- ${row.column_name}: ${row.data_type} (default: ${row.column_default || 'NULL'})`);
      });
      
    } else {
      console.log('❌ Modules table does not exist. Creating it...');
      await client.query(`
        CREATE TABLE public.modules (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code VARCHAR(50) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          version VARCHAR(20) DEFAULT '1.0.0',
          status VARCHAR(20) DEFAULT 'active',
          icon VARCHAR(100),
          category VARCHAR(50),
          pricing_model VARCHAR(50) DEFAULT 'subscription',
          base_price DECIMAL(10,2) DEFAULT 0.00,
          setup_fee DECIMAL(10,2) DEFAULT 0.00,
          dependencies JSONB DEFAULT '[]'::jsonb,
          settings JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Created modules table');
      
      // Insert sample modules
      console.log('Inserting sample modules...');
      await client.query(`
        INSERT INTO public.modules (code, name, description, category, icon) VALUES 
        ('core', 'Core System', 'Essential system functionality', 'system', 'settings'),
        ('pos', 'Point of Sale', 'Retail point of sale system', 'sales', 'shopping-cart'),
        ('integration', 'Integration Hub', 'Third-party integrations', 'integration', 'link'),
        ('wms', 'Warehouse Management', 'Inventory and warehouse operations', 'operations', 'warehouse'),
        ('hr', 'Human Resources', 'Employee management system', 'hr', 'users'),
        ('accounting', 'Accounting', 'Financial management and reporting', 'finance', 'calculator')
      `);
      console.log('✅ Inserted sample modules');
    }
    
    // Show current modules data
    const modulesData = await client.query('SELECT code, name, status FROM public.modules ORDER BY code');
    console.log(`\nCurrent modules (${modulesData.rows.length} total):`);
    modulesData.rows.forEach(row => {
      console.log(`- ${row.code}: ${row.name} (status: ${row.status})`);
    });
    
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkAndFixModulesTable();