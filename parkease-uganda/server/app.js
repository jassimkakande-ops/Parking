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

// Global Middlewares
app.use(helmet());
app.use(cors());
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
