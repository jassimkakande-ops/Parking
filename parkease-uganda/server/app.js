const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const errorHandler = require('./middleware/errorHandler');
const { successResponse } = require('./utils/apiResponse');

const app = express();

const authRoutes = require('./modules/auth/auth.routes');
const parkingRoutes = require('./modules/parking/parking.routes');
const bookingRoutes = require('./modules/booking/booking.routes');
const paymentRoutes = require('./modules/payments/payment.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const withdrawalRoutes = require('./modules/withdrawals/withdrawal.routes');
const contactRoutes = require('./modules/contact/contact.routes');
const attendantsRoutes = require('./modules/attendants/attendants.routes');
const paymentRepository = require('./modules/payments/payment.repository');

// Background Tasks
setInterval(() => {
  paymentRepository.timeoutPendingPayments().catch(err => {
    console.error('Failed to timeout pending payments:', err.message);
  });
}, 30000); // Check every 30 seconds

// Global Middlewares
app.use(helmet());
const corsOptions = {
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : '*',
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic Health Check Route
app.get('/api/v1/health', (req, res) => {
  res.status(200).json(successResponse({ status: 'ok', timestamp: new Date() }));
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', parkingRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/withdrawals', withdrawalRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/attendants', attendantsRoutes);

// 404 handler for undefined routes
app.use('*', (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  error.isOperational = true;
  next(error);
});

// Centralized error handler (MUST be last middleware)
app.use(errorHandler);

module.exports = app;
