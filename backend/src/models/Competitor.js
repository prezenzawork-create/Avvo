import pool from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Competitor Model
 * Handles database operations for competitors table
 */

class Competitor {
  /**
   * Find all competitors for a listing
   * @param {string} listingId - Listing ID
   * @param {object} options - Query options { limit, sortBy }
   * @returns {Promise<array>}
   */
  static async findByListingId(listingId, options = {}) {
    try {
      const { limit = 50, sortBy = 'parsed_at DESC' } = options;

      const query = `
        SELECT * FROM competitors
        WHERE listing_id = $1
        ORDER BY ${sortBy}
        LIMIT $2
      `;

      const result = await pool.query(query, [listingId, limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding competitors by listing ID:', error);
      throw error;
    }
  }

  /**
   * Find recent competitors (parsed within time window)
   * @param {string} listingId - Listing ID
   * @param {number} hoursRecent - Hours to look back
   * @returns {Promise<array>}
   */
  static async findRecentByListingId(listingId, hoursRecent = 24) {
    try {
      const query = `
        SELECT * FROM competitors
        WHERE listing_id = $1
        AND parsed_at > NOW() - INTERVAL '${hoursRecent} hours'
        ORDER BY parsed_at DESC
      `;

      const result = await pool.query(query, [listingId]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding recent competitors:', error);
      throw error;
    }
  }

  /**
   * Create new competitor entry
   * @param {object} competitorData - Competitor data
   * @returns {Promise<object>}
   */
  static async create(competitorData) {
    try {
      const {
        listingId,
        avitoCompetitorId,
        title,
        price,
        url,
        similarityScore,
      } = competitorData;

      const query = `
        INSERT INTO competitors (
          listing_id, avito_competitor_id, title, price, url, similarity_score, parsed_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *
      `;

      const result = await pool.query(query, [
        listingId,
        avitoCompetitorId,
        title,
        price,
        url,
        similarityScore || null,
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating competitor:', error);
      throw error;
    }
  }

  /**
   * Upsert competitor (insert or update)
   * @param {object} competitorData - Competitor data
   * @returns {Promise<object>}
   */
  static async upsert(competitorData) {
    try {
      const {
        listingId,
        avitoCompetitorId,
        title,
        price,
        url,
        similarityScore,
      } = competitorData;

      const query = `
        INSERT INTO competitors (
          listing_id, avito_competitor_id, title, price, url, similarity_score, parsed_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (listing_id, avito_competitor_id)
        DO UPDATE SET
          title = EXCLUDED.title,
          price = EXCLUDED.price,
          url = EXCLUDED.url,
          similarity_score = EXCLUDED.similarity_score,
          parsed_at = NOW()
        RETURNING *
      `;

      const result = await pool.query(query, [
        listingId,
        avitoCompetitorId,
        title,
        price,
        url,
        similarityScore || null,
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error upserting competitor:', error);
      throw error;
    }
  }

  /**
   * Bulk insert competitors
   * @param {array} competitors - Array of competitor data objects
   * @returns {Promise<number>} Number of inserted records
   */
  static async bulkCreate(competitors) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let insertedCount = 0;
      for (const competitor of competitors) {
        const query = `
          INSERT INTO competitors (
            listing_id, avito_competitor_id, title, price, url, similarity_score, parsed_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
          ON CONFLICT (listing_id, avito_competitor_id) DO NOTHING
        `;

        const result = await client.query(query, [
          competitor.listingId,
          competitor.avitoCompetitorId,
          competitor.title,
          competitor.price,
          competitor.url,
          competitor.similarityScore || null,
        ]);

        insertedCount += result.rowCount;
      }

      await client.query('COMMIT');
      return insertedCount;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error bulk creating competitors:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Calculate competitor statistics
   * @param {string} listingId - Listing ID
   * @param {number} hoursRecent - Hours to look back for recent data
   * @returns {Promise<object>} Statistics { average, median, min, max, count }
   */
  static async getStatistics(listingId, hoursRecent = 24) {
    try {
      const query = `
        SELECT
          AVG(price) as average,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) as median,
          MIN(price) as min,
          MAX(price) as max,
          COUNT(*) as count,
          STDDEV(price) as std_dev
        FROM competitors
        WHERE listing_id = $1
        AND parsed_at > NOW() - INTERVAL '${hoursRecent} hours'
      `;

      const result = await pool.query(query, [listingId]);
      const stats = result.rows[0];

      return {
        average: parseFloat(stats.average) || 0,
        median: parseFloat(stats.median) || 0,
        min: parseFloat(stats.min) || 0,
        max: parseFloat(stats.max) || 0,
        count: parseInt(stats.count) || 0,
        stdDev: parseFloat(stats.std_dev) || 0,
      };
    } catch (error) {
      logger.error('Error calculating competitor statistics:', error);
      throw error;
    }
  }

  /**
   * Get price distribution (for charts)
   * @param {string} listingId - Listing ID
   * @param {number} buckets - Number of price buckets
   * @returns {Promise<array>} Distribution data
   */
  static async getPriceDistribution(listingId, buckets = 10) {
    try {
      const query = `
        WITH price_stats AS (
          SELECT MIN(price) as min_price, MAX(price) as max_price
          FROM competitors
          WHERE listing_id = $1
          AND parsed_at > NOW() - INTERVAL '24 hours'
        ),
        bucket_width AS (
          SELECT (max_price - min_price) / ${buckets} as width, min_price
          FROM price_stats
        )
        SELECT
          FLOOR((c.price - bw.min_price) / bw.width) as bucket,
          COUNT(*) as count,
          MIN(c.price) as min_price,
          MAX(c.price) as max_price
        FROM competitors c, bucket_width bw
        WHERE c.listing_id = $1
        AND c.parsed_at > NOW() - INTERVAL '24 hours'
        GROUP BY bucket
        ORDER BY bucket
      `;

      const result = await pool.query(query, [listingId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting price distribution:', error);
      throw error;
    }
  }

  /**
   * Delete old competitor data
   * @param {number} daysOld - Delete data older than this many days
   * @returns {Promise<number>} Number of deleted records
   */
  static async deleteOld(daysOld = 30) {
    try {
      const query = `
        DELETE FROM competitors
        WHERE parsed_at < NOW() - INTERVAL '${daysOld} days'
      `;

      const result = await pool.query(query);
      return result.rowCount;
    } catch (error) {
      logger.error('Error deleting old competitors:', error);
      throw error;
    }
  }

  /**
   * Delete all competitors for a listing
   * @param {string} listingId - Listing ID
   * @returns {Promise<number>} Number of deleted records
   */
  static async deleteByListingId(listingId) {
    try {
      const query = 'DELETE FROM competitors WHERE listing_id = $1';
      const result = await pool.query(query, [listingId]);
      return result.rowCount;
    } catch (error) {
      logger.error('Error deleting competitors by listing ID:', error);
      throw error;
    }
  }

  /**
   * Get price trends over time
   * @param {string} listingId - Listing ID
   * @param {number} days - Number of days to look back
   * @returns {Promise<array>} Trend data
   */
  static async getPriceTrends(listingId, days = 7) {
    try {
      const query = `
        SELECT
          DATE(parsed_at) as date,
          AVG(price) as average_price,
          MIN(price) as min_price,
          MAX(price) as max_price,
          COUNT(*) as competitor_count
        FROM competitors
        WHERE listing_id = $1
        AND parsed_at > NOW() - INTERVAL '${days} days'
        GROUP BY DATE(parsed_at)
        ORDER BY date ASC
      `;

      const result = await pool.query(query, [listingId]);
      return result.rows.map((row) => ({
        date: row.date,
        averagePrice: parseFloat(row.average_price),
        minPrice: parseFloat(row.min_price),
        maxPrice: parseFloat(row.max_price),
        competitorCount: parseInt(row.competitor_count),
      }));
    } catch (error) {
      logger.error('Error getting price trends:', error);
      throw error;
    }
  }
}

export default Competitor;
