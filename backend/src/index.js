// server.js - Main Application Server with Database
const express = require('express');
const cors = require('cors');
const db = require('./db/db');

// Import routes


const app = express();
const PORT = process.env.PORT || 3000;

const complaintsRouter = require('./routes/complaints');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin-auth');
const dashboardRouter = require('./routes/dashboard');

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// =====================================================
// ROUTES
// =====================================================

app.use('/api/auth', authRouter);
app.use('/api/complaints', complaintsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/dashboard', dashboardRouter);

// =====================================================
// HEALTH CHECK & API INFO
// =====================================================

app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await db.query('SELECT 1');
    
    res.json({
      status: 'ok',
      message: 'Nepal Citizen Service Portal API',
      database: 'connected',
      timestamp: new Date().toISOString(),
      endpoints: {
        auth: [
          'POST /api/auth/register',
          'POST /api/auth/verify-otp',
          'POST /api/auth/login',
          'POST /api/auth/admin-login',
          'GET /api/auth/profile/:id',
          'POST /api/auth/logout'
        ],
        complaints: [
          'POST /api/complaints',
          'POST /api/complaints/classify',
          'POST /api/complaints/similar',
          'GET /api/complaints',
          'GET /api/complaints/:id',
          'PATCH /api/complaints/:id/status',
          'POST /api/complaints/:id/feedback'
        ],
        admin: [
          'GET /api/admin/dashboard',
          'GET /api/admin/complaints',
          'PATCH /api/admin/complaints/:id/assign',
          'PATCH /api/admin/complaints/:id/status',
          'PATCH /api/admin/complaints/:id/escalate',
          'GET /api/admin/team',
          'POST /api/admin/team',
          'GET /api/admin/team/:id',
          'GET /api/admin/collaborations',
          'POST /api/admin/collaborations',
          'PATCH /api/admin/collaborations/:id/progress',
          'GET /api/admin/analytics'
        ],
        dashboard: [
          'GET /api/dashboard/highest-upvote',
          'GET /api/dashboard/newest-first',
          'GET /api/dashboard/by-category/:category',
          'GET /api/dashboard/by-location',
          'GET /api/dashboard/stats'
        ],
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: err.message
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Nepal Citizen Service Portal API',
    version: '1.0.0',
    description: 'Backend API for Nepal\'s unified citizen service platform',
    documentation: '/api/health'
  });
});

// =====================================================
// ERROR HANDLING
// =====================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// =====================================================
// START SERVER
// =====================================================

const startServer = async () => {
  try {
    // Test database connection
    await db.query('SELECT 1');
    console.log('✓ Database connection verified');

    app.listen(PORT, () => {
      console.log('\n========================================');
      console.log(' Nepal Citizen Service Portal - API');
      console.log(' Running on http://localhost:' + PORT);
      console.log(' Database: PostgreSQL (Connected)');
      console.log('========================================\n');
      
      console.log('AUTH ENDPOINTS:');
      console.log('  POST   /api/auth/register        - Register new citizen');
      console.log('  POST   /api/auth/verify-otp      - Verify phone OTP');
      console.log('  POST   /api/auth/login           - Citizen login');
      console.log('  POST   /api/auth/admin-login     - Admin login');
      console.log('  GET    /api/auth/profile/:id     - Get user profile');
      console.log('  POST   /api/auth/logout          - Logout\n');
      
      console.log('COMPLAINT ENDPOINTS:');
      console.log('  POST   /api/complaints           - Submit complaint');
      console.log('  POST   /api/complaints/classify  - Classify only (no save)');
      console.log('  POST   /api/complaints/similar   - Find similar complaints');
      console.log('  GET    /api/complaints           - List all complaints');
      console.log('  GET    /api/complaints/:id       - Get complaint by ref');
      console.log('  PATCH  /api/complaints/:id/status - Update status');
      console.log('  POST   /api/complaints/:id/feedback - Submit feedback\n');
      console.log('  POST   /api/complaints/vote      - Vote on complaint');
      console.log('  DELETE /api/complaints/vote      - Remove vote');
      console.log('  GET    /api/complaints/:id/vote  - Get user vote');
      
      console.log('ADMIN ENDPOINTS:');
      console.log('  GET    /api/admin/dashboard');
      console.log('  GET    /api/admin/complaints');
      console.log('  PATCH  /api/admin/complaints/:id/assign');
      console.log('  PATCH  /api/admin/complaints/:id/status');
      console.log('  PATCH  /api/admin/complaints/:id/escalate');
      console.log('  GET    /api/admin/team');
      console.log('  POST   /api/admin/team');
      console.log('  GET    /api/admin/team/:id');
      console.log('  GET    /api/admin/collaborations');
      console.log('  POST   /api/admin/collaborations');
      console.log('  PATCH  /api/admin/collaborations/:id/progress');
      console.log('  GET    /api/admin/analytics\n');
      
      console.log('DASHBOARD ENDPOINTS (Public Feed):');
      console.log('  GET    /api/dashboard/highest-upvote  - Most upvoted');
      console.log('  GET    /api/dashboard/newest-first    - Newest complaints');
      console.log('  GET    /api/dashboard/by-category/:category');
      console.log('  GET    /api/dashboard/by-location');
      console.log('  GET    /api/dashboard/stats\n');

      console.log('OTHER:');
      console.log('  GET    /api/health               - API health check\n');
    });

  } catch (err) {
    console.error('Failed to start server:', err);
    console.error('\nPlease ensure:');
    console.error('1. PostgreSQL is running');
    console.error('2. Database "nepal_citizen_portal" exists');
    console.error('3. Database credentials are correct in db/db.js or .env');
    console.error('4. Schema has been created (run enhanced-schema.sql)\n');
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await db.pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  await db.pool.end();
  process.exit(0);
});

startServer();

module.exports = app;