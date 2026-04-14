const mysql = require('mysql2/promise');

// When running locally: DB_HOST=localhost (MySQL port forwarded from Docker)
// When running inside Docker: DB_HOST=mysql (service name)
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '3306'),
  user:     process.env.DB_USER     || 'root',
 password: process.env.DB_PASSWORD || '',  // Empty string for no password
  database: process.env.DB_NAME     || 'dyslexia_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool.getConnection()
  .then((connection) => {
    console.log(`MySQL Connected Successfully! (host: ${process.env.DB_HOST || 'localhost'})`);
    connection.release();
  })
  .catch((error) => {
    console.error('Error connecting to MySQL:', error.message);
  });

module.exports = pool;
console.log("DB CONFIG:", {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  database: process.env.DB_NAME
});