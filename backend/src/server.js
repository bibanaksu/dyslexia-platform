require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

// Import routes
const parentsRouter = require('./routes/parents');
const childrenRouter = require('./routes/children');
const assessmentsRouter = require('./routes/assessments');
const activitiesRouter = require('./routes/activities');
const therapistsRouter = require('./routes/therapists');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

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
app.use('/api/therapists', therapistsRouter);

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

// 404 handler - this should be last
app.use((req, res) => {
  console.log('404 for URL:', req.method, req.url);
  res.status(404).json({ error: `Route not found: ${req.method} ${req.url}` });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`Dyslexia Support Platform Backend`);
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`========================================`);
  console.log(`Available Routes:`);
  console.log(`- GET  /api/health`);
  console.log(`- GET  /api/db-status`);
  console.log(`- POST /api/parents/login`);
  console.log(`- POST /api/parents/register`);
  console.log(`- POST /api/therapists/login`);
  console.log(`- POST /api/therapists/register`);
  console.log(`- GET  /api/children`);
  console.log(`- GET  /api/assessments/child/:childId`);
  console.log(`- GET  /api/activities`);
  console.log(`========================================`);
});
