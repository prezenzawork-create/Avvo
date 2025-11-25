import app from './app.js';
import logger from './utils/logger.js';
import pool from './config/database.js';
import CompetitorSyncJob from './jobs/competitorSync.js';
import ChatPollerJob from './jobs/chatPoller.js';
import AnalyticsAggregatorJob from './jobs/analyticsAggregator.js';

const PORT = process.env.PORT || 3000;

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    logger.error('Database connection failed:', err);
    process.exit(1);
  }
  logger.info('Database connected successfully');
});

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  
  // Start background jobs
  CompetitorSyncJob.start();
  ChatPollerJob.start();
  AnalyticsAggregatorJob.start();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    pool.end(() => {
      logger.info('Database pool closed');
      process.exit(0);
    });
  });
});
