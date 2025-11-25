import Analytics from '../models/Analytics.js';
import Listing from '../models/Listing.js';
import Competitor from '../models/Competitor.js';
import Chat from '../models/Chat.js';
import Subscription from '../models/Subscription.js';
import logger from '../utils/logger.js';

/**
 * Analytics Controller
 * Handles all analytics-related API endpoints
 */

class AnalyticsController {
  /**
   * Get dashboard statistics
   * GET /api/dashboard/stats
   */
  static async getDashboardStats(req, res, next) {
    try {
      const userId = req.user.id;

      // Get user's subscription
      const subscription = await Subscription.findByUserId(userId);
      
      // Get listing count
      const totalListings = await Listing.countByUser(userId);
      
      // Get active chats count
      const activeChats = await Chat.countByUser(userId, { unreadOnly: true });
      
      // Get AI message usage
      const aiMessagesUsed = subscription ? subscription.aiMessagesUsed : 0;
      const aiMessagesLimit = subscription ? subscription.aiMessagesLimit : 0;
      
      // Get recent actions (simplified)
      const recentActions = [];

      res.json({
        success: true,
        data: {
          totalListings,
          activeChats,
          aiMessagesUsed,
          aiMessagesLimit,
          recentActions,
          subscription: subscription || null,
        },
      });
    } catch (error) {
      logger.error('Error fetching dashboard stats:', error);
      next(error);
    }
  }

  /**
   * Get listing analytics
   * GET /api/analytics/listings
   */
  static async getListingAnalytics(req, res, next) {
    try {
      const userId = req.user.id;
      const { dateFrom, dateTo, listingId } = req.query;

      let metrics = [];

      if (listingId) {
        // Get analytics for specific listing
        const listing = await Listing.findById(listingId, userId);
        if (!listing) {
          return res.status(404).json({
            success: false,
            error: 'Объявление не найдено',
          });
        }

        metrics = await Analytics.getListingMetrics(listingId, dateFrom, dateTo);
      } else {
        // Get analytics for all user's listings
        const listings = await Listing.findByUserId(userId);
        const listingIds = listings.listings.map(l => l.id);
        
        metrics = await Analytics.getMultipleListingMetrics(listingIds, dateFrom, dateTo);
      }

      res.json({
        success: true,
        data: {
          metrics,
        },
      });
    } catch (error) {
      logger.error('Error fetching listing analytics:', error);
      next(error);
    }
  }

  /**
   * Get competitor analytics
   * GET /api/analytics/competitors
   */
  static async getCompetitorAnalytics(req, res, next) {
    try {
      const userId = req.user.id;
      const { listingId, dateFrom, dateTo } = req.query;

      if (!listingId) {
        return res.status(400).json({
          success: false,
          error: 'ID объявления обязателен',
        });
      }

      // Verify listing ownership
      const listing = await Listing.findById(listingId, userId);
      if (!listing) {
        return res.status(404).json({
          success: false,
          error: 'Объявление не найдено',
        });
      }

      const trends = await Competitor.getPriceTrends(listingId, 30); // Last 30 days
      const stats = await Competitor.getStatistics(listingId);

      res.json({
        success: true,
        data: {
          trends,
          stats,
        },
      });
    } catch (error) {
      logger.error('Error fetching competitor analytics:', error);
      next(error);
    }
  }

  /**
   * Export analytics data
   * GET /api/analytics/export
   */
  static async exportAnalytics(req, res, next) {
    try {
      const userId = req.user.id;
      const { format = 'csv', type = 'listings' } = req.query;

      // In a real implementation, this would generate and return a file
      // For now, we'll return a simple JSON response

      res.json({
        success: true,
        message: `Экспорт данных в формате ${format} готов`,
        data: {
          format,
          type,
          downloadUrl: `/api/analytics/export/${type}.${format}`,
        },
      });
    } catch (error) {
      logger.error('Error exporting analytics:', error);
      next(error);
    }
  }

  /**
   * Get performance summary
   * GET /api/analytics/performance
   */
  static async getPerformanceSummary(req, res, next) {
    try {
      const userId = req.user.id;
      const { period = '30' } = req.query; // Days

      // Get user's listings
      const listings = await Listing.findByUserId(userId);
      
      // Calculate performance metrics
      const totalViews = 0;
      const totalMessages = 0;
      const totalListings = listings.listings.length;
      
      // Get chat statistics
      const chatStats = await Chat.getStats(userId);

      res.json({
        success: true,
        data: {
          period: `${period} дней`,
          metrics: {
            totalViews,
            totalMessages,
            totalListings,
            responseRate: chatStats.responseRate || 0,
            avgResponseTime: chatStats.avgResponseTime || 0,
          },
          comparison: {
            vsPreviousPeriod: 0,
            vsMarketAverage: 0,
          },
        },
      });
    } catch (error) {
      logger.error('Error fetching performance summary:', error);
      next(error);
    }
  }
}

export default AnalyticsController;
