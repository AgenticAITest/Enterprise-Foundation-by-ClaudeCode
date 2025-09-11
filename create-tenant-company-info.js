const { Client } = require('pg');

async function createTenantCompanyInfoTables() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'erp_saas',
    user: 'erp_admin',
    password: 'erp_password_2024'
  });

  try {
    await client.connect();
    
    console.log('=== FINDING TENANT SCHEMAS ===');
    
    // Find all tenant schemas
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%'
      ORDER BY schema_name
    `);
    
    console.log(`Found ${schemasResult.rows.length} tenant schemas:`);
    schemasResult.rows.forEach(row => {
      console.log(`- ${row.schema_name}`);
    });
    
    if (schemasResult.rows.length === 0) {
      console.log('No tenant schemas found. Creating table structure for future tenants...');
      await client.end();
      return;
    }
    
    console.log('\n=== CREATING TENANT_COMPANY_INFO TABLES ===');
    
    // Create table in each tenant schema
    for (const schemaRow of schemasResult.rows) {
      const schemaName = schemaRow.schema_name;
      console.log(`\nProcessing schema: ${schemaName}`);
      
      try {
        // Check if table already exists
        const tableExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = $1 AND table_name = 'tenant_company_info'
          )
        `, [schemaName]);
        
        if (tableExists.rows[0].exists) {
          console.log(`  ✅ tenant_company_info table already exists in ${schemaName}`);
        } else {
          // Create the table
          await client.query(`
            CREATE TABLE ${schemaName}.tenant_company_info (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              company_name VARCHAR(255) NOT NULL,
              address1 VARCHAR(255),
              address2 VARCHAR(255),
              city VARCHAR(100),
              state VARCHAR(100),
              zip VARCHAR(20),
              country VARCHAR(100) DEFAULT 'US',
              phone VARCHAR(50),
              email VARCHAR(255),
              website VARCHAR(255),
              logo_path VARCHAR(500),
              tax_id VARCHAR(50),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              
              -- Ensure only one company info record per tenant
              CONSTRAINT single_company_info UNIQUE (id)
            )
          `);
          
          // Create trigger to auto-update updated_at
          await client.query(`
            CREATE OR REPLACE FUNCTION ${schemaName}.update_tenant_company_info_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql'
          `);
          
          await client.query(`
            CREATE TRIGGER update_tenant_company_info_updated_at
            BEFORE UPDATE ON ${schemaName}.tenant_company_info
            FOR EACH ROW EXECUTE PROCEDURE ${schemaName}.update_tenant_company_info_updated_at()
          `);
          
          console.log(`  ✅ Created tenant_company_info table in ${schemaName}`);
          
          // Insert default company info based on public.tenants data
          const tenantData = await client.query(`
            SELECT company_name, address1, address2, city, state, zip, phone 
            FROM public.tenants 
            WHERE subdomain = $1
          `, [schemaName.replace('tenant_', '')]);
          
          if (tenantData.rows.length > 0) {
            const tenant = tenantData.rows[0];
            await client.query(`
              INSERT INTO ${schemaName}.tenant_company_info 
              (company_name, address1, address2, city, state, zip, phone)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
              tenant.company_name,
              tenant.address1,
              tenant.address2,
              tenant.city,
              tenant.state,
              tenant.zip,
              tenant.phone
            ]);
            console.log(`  ✅ Inserted default company info for ${schemaName}`);
          }
        }
        
        // Show current structure
        const structure = await client.query(`
          SELECT column_name, data_type, column_default
          FROM information_schema.columns 
          WHERE table_name = 'tenant_company_info' AND table_schema = $1
          ORDER BY ordinal_position
        `, [schemaName]);
        
        console.log(`  Table structure (${structure.rows.length} columns):`);
        structure.rows.forEach(col => {
          console.log(`    - ${col.column_name}: ${col.data_type}`);
        });
        
      } catch (error) {
        console.error(`  ❌ Error processing ${schemaName}:`, error.message);
      }
    }
    
    console.log('\n=== COMPLETED ===');
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

createTenantCompanyInfoTables();