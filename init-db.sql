-- Initialize database
-- This file runs when the PostgreSQL container first starts

-- Create database if not exists (though docker-compose already creates it)
SELECT 'CREATE DATABASE pafm_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'pafm_db')\gexec

-- Set up extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE pafm_db TO pafm_user;
