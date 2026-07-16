const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Success:', res.rows);
  }
  pool.end();
});
