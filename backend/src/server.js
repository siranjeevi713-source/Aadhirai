require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const { connectDB } = require('./config/database');
const { seedDatabase } = require('./utils/seed');

// Routes
const authRoutes = require('./modules/auth/auth.routes');
const superAdminRoutes = require('./modules/super-admin/superAdmin.routes');
const complaintsRoutes = require('./modules/complaints/complaints.routes');
const reviewsRoutes = require('./modules/reviews/reviews.routes');
const notificationsRoutes = require('./modules/notifications/notifications.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('CORS policy violation'));
  },
  credentials: true,
}));

// Request logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(UPLOAD_DIR));

// Health check
app.get(['/health', '/api/health'], (req, res) => {
  res.json({ status: 'healthy', service: 'aadhirai-backend', version: '2.0.0', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error.' });
});

async function start() {
  await connectDB();
  await seedDatabase();
  app.listen(PORT, () => {
    console.log(`[Server] AADHIRAI Backend running on http://localhost:${PORT}`);
    console.log(`[Server] API Health: http://localhost:${PORT}/api/health`);
  });
}

start().catch(err => {
  console.error('[Server] Startup failed:', err);
  process.exit(1);
});

