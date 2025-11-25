import pool from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Analytics Model
 * Handles database operations for analytics table
 */

class Analytics {
  /**
   * Create new analytics record
   * @param {object} analyticsData - Analytics data
   * @returns {Promise<object>}
   */
  static async create(analyticsData) {
    try {
      const { listingId, date, views, messages, favorites } = analyticsData;

      const query = `
        INSERT INTO analytics (listing_id, date, views, messages, favorites)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const result = await pool.query(query, [
        listingId,
        date,
        views || 0,
        messages || 0,
        favorites || 0,
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating analytics record:', error);
      throw error;
    }
  }

  /**
   * Get listing metrics
   * @param {string} listingId - Listing ID
   * @param {string} dateFrom - Start date (ISO format)
   * @param {string} dateTo - End date (ISO format)
   * @returns {Promise<array>}
   */
  static async getListingMetrics(listingId, dateFrom, dateTo) {
    try {
      let query = `
        SELECT date, views, messages, favorites
        FROM analytics
        WHERE listing_id = $1
      `;
      
      const params = [listingId];
      let paramCount = 1;
      
      if (dateFrom) {
        paramCount++;
        query += ` AND date >= $${paramCount}`;
        params.push(dateFrom);
      }
      
      if (dateTo) {
        paramCount++;
        query += ` AND date <= $${paramCount}`;
        params.push(dateTo);
      }
      
      query += ' ORDER BY date ASC';
      
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting listing metrics:', error);
      throw error;
    }
  }

  /**
   * Get metrics for multiple listings
   * @param {array} listingIds - Array of listing IDs
   * @param {string} dateFrom - Start date (ISO format)
   * @param {string} dateTo - End date (ISO format)
   * @returns {Promise<array>}
   */
  static async getMultipleListingMetrics(listingIds, dateFrom, dateTo) {
    try {
      if (!listingIds || listingIds.length === 0) {
        return [];
      }
      
      let query = `
        SELECT 
          listing_id,
          SUM(views) as total_views,
          SUM(messages) as total_messages,
          SUM(favorites) as total_favorites,
          AVG(views) as avg_views,
          AVG(messages) as avg_messages,
          AVG(favorites) as avg_favorites
        FROM analytics
        WHERE listing_id = ANY($1)
      `;
      
      const params = [listingIds];
      let paramCount = 1;
      
      if (dateFrom) {
        paramCount++;
        query += ` AND date >= $${paramCount}`;
        params.push(dateFrom);
      }
      
      if (dateTo) {
        paramCount++;
        query += ` AND date <= $${paramCount}`;
        params.push(dateTo);
      }
      
      query += ' GROUP BY listing_id ORDER BY total_views DESC';
      
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting multiple listing metrics:', error);
      throw error;
    }
  }

  /**
   * Get performance summary
   * @param {string} userId - User ID
   * @param {number} days - Number of days to look back
   * @returns {Promise<object>}
   */
  static async getPerformanceSummary(userId, days = 30) {
    try {
      const query = `
        SELECT
          SUM(a.views) as total_views,
          SUM(a.messages) as total_messages,
          SUM(a.favorites) as total_favorites,
          COUNT(DISTINCT a.listing_id) as active_listings
        FROM analytics a
        JOIN listings l ON a.listing_id = l.id
        WHERE l.user_id = $1
        AND a.date >= CURRENT_DATE - INTERVAL '${days} days'
      `;
      
      const result = await pool.query(query, [userId]);
      const summary = result.rows[0];
      
      return {
        totalViews: parseInt(summary.total_views) || 0,
        totalMessages: parseInt(summary.total_messages) || 0,
        totalFavorites: parseInt(summary.total_favorites) || 0,
        activeListings: parseInt(summary.active_listings) || 0,
      };
    } catch (error) {
      logger.error('Error getting performance summary:', error);
      throw error;
    }
  }

  /**
   * Delete old analytics data
   * @param {number} daysOld - Delete data older than this many days
   * @returns {Promise<number>} Number of deleted records
   */
  static async deleteOld(daysOld = 90) {
    try {
      const query = `
        DELETE FROM analytics
        WHERE date < CURRENT_DATE - INTERVAL '${daysOld} days'
      `;
      
      const result = await pool.query(query);
      return result.rowCount;
    } catch (error) {
      logger.error('Error deleting old analytics:', error);
      throw error;
    }
  }

  /**
   * Get trending listings
   * @param {string} userId - User ID
   * @param {number} limit - Number of listings to return
   * @returns {Promise<array>}
   */
  static async getTrendingListings(userId, limit = 10) {
    try {
      const query = `
        SELECT 
          l.id,
          l.title,
          l.price,
          SUM(a.views) as total_views,
          SUM(a.messages) as total_messages,
          SUM(a.favorites) as total_favorites
        FROM analytics a
        JOIN listings l ON a.listing_id = l.id
        WHERE l.user_id = $1
        AND a.date >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY l.id, l.title, l.price
        ORDER BY total_views DESC
        LIMIT $2
      `;
      
      const result = await pool.query(query, [userId, limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting trending listings:', error);
      throw error;
    }
  }
}

export default Analytics;
