require('dotenv').config();
const { Client } = require('pg');

async function createDatabase() {
  const dbName = process.env.DB_NAME || 'nadiaEcommerceEquitop';
  
  // Connect to the default 'postgres' database to create the new database
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: 'postgres', // Connect to default DB
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL server.');

    // Check if database exists
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
    
    if (res.rowCount === 0) {
      console.log(`Database "${dbName}" does not exist. Creating...`);
      // CREATE DATABASE cannot be run inside a transaction block
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database "${dbName}" created successfully.`);
    } else {
      console.log(`Database "${dbName}" already exists.`);
    }
  } catch (err) {
    console.error('Error creating database:', err.message);
    if (err.message.includes('authentication failed')) {
      console.error('TIP: Verify your DB_PASSWORD in .env file.');
    }
  } finally {
    await client.end();
  }
}

createDatabase();
