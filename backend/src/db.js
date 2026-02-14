const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'dyslexia_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the connection
pool.getConnection()
  .then((connection) => {
    console.log('MySQL Connected Successfully!');
    connection.release();
  })
  .catch((error) => {
    console.error('Error connecting to MySQL:', error);
    // Retry connection after 5 seconds
    setTimeout(() => {
      console.log('Retrying MySQL connection...');
    }, 5000);
  });

module.exports = pool;
