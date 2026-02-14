require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

// Import routes
const parentsRouter = require('./routes/parents');
const childrenRouter = require('./routes/children');
const assessmentsRouter = require('./routes/assessments');
const activitiesRouter = require('./routes/activities');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'Dyslexia Platform Backend is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/parents', parentsRouter);
app.use('/api/children', childrenRouter);
app.use('/api/assessments', assessmentsRouter);
app.use('/api/activities', activitiesRouter);

// Test database connection endpoint
app.get('/api/db-status', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query('SELECT 1 + 1 as result');
    connection.release();
    res.json({ status: 'Database connected successfully', dbTest: result[0] });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`Dyslexia Support Platform Backend`);
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`========================================`);
  console.log(`API Documentation:`);
  console.log(`- Health Check: GET /api/health`);
  console.log(`- Parents: GET/POST/PUT /api/parents`);
  console.log(`- Children: GET/POST/PUT/DELETE /api/children`);
  console.log(`- Assessments: GET/POST/PUT /api/assessments`);
  console.log(`- Activities: GET/POST/PUT /api/activities`);
  console.log(`========================================`);
});

