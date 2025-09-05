# PostgreSQL Setup on Windows (Without Docker)

## Option 1: Docker Desktop (Recommended)
1. **Start Docker Desktop:**
   - Find Docker Desktop in Start Menu
   - Launch the application
   - Wait for the whale icon to be stable
   - Then run: `docker-compose up -d`

## Option 2: Direct PostgreSQL Installation

### Step 1: Download PostgreSQL
- Go to: https://www.postgresql.org/download/windows/
- Download PostgreSQL 15 installer
- Run the installer with these settings:
  - Port: `5432`
  - Superuser password: `erp_password_2024`
  - Locale: Default

### Step 2: Create Database and User
After installation, open **pgAdmin** or **SQL Shell (psql)** and run:

```sql
-- Create database
CREATE DATABASE erp_saas;

-- Create user
CREATE USER erp_admin WITH PASSWORD 'erp_password_2024';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE erp_saas TO erp_admin;
ALTER USER erp_admin CREATEDB;

-- Connect to the database
\c erp_saas;

-- Run the initialization script
-- (Copy and paste the contents of database/init/01-init.sql)
```

### Step 3: Update Backend Configuration
Create `.env` file with:
```bash
DATABASE_URL=postgresql://erp_admin:erp_password_2024@localhost:5432/erp_saas
DB_HOST=localhost
DB_PORT=5432
DB_NAME=erp_saas
DB_USER=erp_admin
DB_PASSWORD=erp_password_2024
```

## Option 3: Use Online PostgreSQL (Quick Test)
Services like:
- **ElephantSQL** (free tier available)
- **Supabase** (free tier with web interface)
- **Railway** (easy PostgreSQL hosting)

## Recommended: Try Docker Desktop First
Docker gives you the complete development environment with:
- PostgreSQL
- Redis
- pgAdmin web interface
- Easy reset/cleanup
- Consistent environment across systems