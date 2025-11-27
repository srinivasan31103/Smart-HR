/**
 * Smart HR System - Main Server Entry Point
 *
 * This file initializes and starts the Express server with all middleware,
 * routes, error handling, and database connection.
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

// Import configurations
const connectDB = require('./config/database');
const { HTTP_STATUS } = require('./config/constants');

// Import middleware
const { errorHandler } = require('./middlewares/errorMiddleware');
const { globalRateLimiter } = require('./middlewares/rateLimitMiddleware');

// Import routes
const routes = require('./routes');

// Initialize Express app
const app = express();

// ==================== MIDDLEWARE SETUP ====================

// Security headers
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true, // Allow cookies to be sent
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parsers
app.use(express.json({ limit: '10mb' })); // For JSON payloads
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // For URL-encoded data

// Cookie parser
app.use(cookieParser(process.env.COOKIE_SECRET));

// HTTP request logger (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Global rate limiting
app.use(globalRateLimiter);

// ==================== API ROUTES ====================

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart HR API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Mount API routes
app.use(`/api/${process.env.API_VERSION || 'v1'}`, routes);

// 404 handler for undefined routes
app.use((req, res, next) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ==================== ERROR HANDLING ====================

// Global error handler (must be last)
app.use(errorHandler);

// ==================== DATABASE & SERVER STARTUP ====================

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start listening
    const server = app.listen(PORT, () => {
      console.log('='.repeat(60));
      console.log(`✅ Smart HR Server Running`);
      console.log(`=`.repeat(60));
      console.log(`   Environment:  ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Port:         ${PORT}`);
      console.log(`   API Version:  ${process.env.API_VERSION || 'v1'}`);
      console.log(`   Database:     ${process.env.MONGODB_URI?.split('@')[1]?.split('/')[1] || 'Connected'}`);
      console.log(`   Health:       http://localhost:${PORT}/health`);
      console.log(`   API Base:     http://localhost:${PORT}/api/${process.env.API_VERSION || 'v1'}`);
      console.log('='.repeat(60));
      console.log('');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
        mongoose.connection.close(false, () => {
          console.log('MongoDB connection closed');
          process.exit(0);
        });
      });
    });

    process.on('SIGINT', () => {
      console.log('\nSIGINT signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
        mongoose.connection.close(false, () => {
          console.log('MongoDB connection closed');
          process.exit(0);
        });
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('❌ Unhandled Promise Rejection:', err);
      server.close(() => {
        process.exit(1);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;
