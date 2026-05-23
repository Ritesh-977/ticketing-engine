import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Initialize the Connection Pool
export const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20, // Max number of connections in the pool
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
});

// Test the connection on startup
db.connect()
    .then(() => console.log('📦 Successfully connected to PostgreSQL Database'))
    .catch((err) => console.error('❌ Database connection error:', err.stack));