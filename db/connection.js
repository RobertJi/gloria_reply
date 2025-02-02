import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.PGHOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT || 5432,
  ssl: {
    rejectUnauthorized: false,
    sslmode: 'require'
  }
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully');
  }
}); 