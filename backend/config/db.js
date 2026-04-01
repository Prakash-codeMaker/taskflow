/**
 * MongoDB Connection Configuration
 * Implements connection pooling and retry logic
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    logger.error('❌ MONGODB_URI is not set in your .env file.');
    logger.error('   Copy backend/.env.example → backend/.env and fill in your MongoDB Atlas URI.');
    process.exit(1);
  }

  const options = {
    // Connection pool
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    // Index management
    autoIndex: process.env.NODE_ENV !== 'production',
  };

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    logger.info(`✅ MongoDB connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', { error: err.message });
    });

  } catch (error) {
    logger.error('Failed to connect to MongoDB:', { error: error.message });
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', { error: error.message });
  }
};

module.exports = { connectDB, disconnectDB };
