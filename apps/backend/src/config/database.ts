import { Pool, PoolClient } from 'pg';

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'erp_saas',
  user: process.env.DB_USER || 'erp_admin',
  password: process.env.DB_PASSWORD || 'erp_password_2024',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize database connection
export const initializeDatabase = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connected successfully at:', result.rows[0].now);
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

// Get database client
export const getDbClient = async (): Promise<PoolClient> => {
  return await pool.connect();
};

// Execute query with automatic client management
export const query = async (text: string, params?: any[]): Promise<any> => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

// Execute query within a transaction
export const transaction = async (callback: (client: PoolClient) => Promise<any>): Promise<any> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Get tenant schema name
export const getTenantSchema = (subdomain: string): string => {
  return `tenant_${subdomain}`;
};

// Execute query in tenant context
export const tenantQuery = async (subdomain: string, text: string, params?: any[]): Promise<any> => {
  const schema = getTenantSchema(subdomain);
  const client = await pool.connect();
  try {
    // Set search path to tenant schema first, then public
    await client.query(`SET search_path TO ${schema}, public`);
    const result = await client.query(text, params);
    return result;
  } finally {
    // Reset search path
    await client.query('SET search_path TO public');
    client.release();
  }
};

// Close database pool (for graceful shutdown)
export const closeDatabase = async (): Promise<void> => {
  await pool.end();
  console.log('🔌 Database connection pool closed');
};

export default pool;