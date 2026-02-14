const express = require('express');
const cors = require('cors');
const complaintsRouter = require('./routes/complaints');
const authRouter = require('./routes/auth');
const { router: adminRouter, setComplaints } = require('./routes/admin');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Share the complaints array between routes
// complaints.js stores them, admin.js reads them
const sharedComplaints = [];
complaintsRouter.getStore = () => sharedComplaints;
setComplaints(sharedComplaints);

// Override complaints router to use shared store
// We need to patch the complaints router's internal store
// Simpler approach: use a shared module

// Routes
app.use('/api/auth', authRouter);
app.use('/api/complaints', complaintsRouter);
app.use('/api/admin', adminRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Nepal Citizen Service Portal API',
    endpoints: {
      auth: ['POST /api/auth/login', 'POST /api/auth/register', 'POST /api/auth/verify-otp', 'GET /api/auth/profile/:id'],
      complaints: ['POST /api/complaints', 'POST /api/complaints/classify', 'POST /api/complaints/similar', 'GET /api/complaints', 'GET /api/complaints/:id', 'PATCH /api/complaints/:id/status'],
      admin: ['GET /api/admin/dashboard', 'GET /api/admin/complaints', 'PATCH /api/admin/complaints/:id/assign', 'PATCH /api/admin/complaints/:id/status', 'PATCH /api/admin/complaints/:id/escalate', 'GET /api/admin/team', 'POST /api/admin/team', 'GET /api/admin/team/:id', 'GET /api/admin/collaborations', 'POST /api/admin/collaborations', 'PATCH /api/admin/collaborations/:id/progress', 'GET /api/admin/analytics']
    }
  });
});

app.listen(PORT, () => {
  console.log('========================================');
  console.log(' Nepal Citizen Service Portal - Mock API');
  console.log(' Running on http://localhost:' + PORT);
  console.log('========================================');
  console.log('');
  console.log('AUTH ENDPOINTS:');
  console.log('  POST   /api/auth/login');
  console.log('  POST   /api/auth/register');
  console.log('  POST   /api/auth/verify-otp');
  console.log('  GET    /api/auth/profile/:id');
  console.log('');
  console.log('COMPLAINT ENDPOINTS:');
  console.log('  POST   /api/complaints           - Submit complaint');
  console.log('  POST   /api/complaints/classify   - Classify only');
  console.log('  POST   /api/complaints/similar    - Find similar');
  console.log('  GET    /api/complaints            - List all');
  console.log('  GET    /api/complaints/:id        - Get by ref');
  console.log('  PATCH  /api/complaints/:id/status - Update status');
  console.log('');
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
  console.log('  GET    /api/admin/analytics');
  console.log('');
});