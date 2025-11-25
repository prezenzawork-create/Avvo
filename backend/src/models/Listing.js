import pool from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Listing Model
 * Handles database operations for listings table
 */

class Listing {
  /**
   * Find all listings for a user
   * @param {string} userId - User ID
   * @param {object} filters - Filter options { status, search, sort, page, limit }
   * @returns {Promise<{listings: array, total: number}>}
   */
  static async findByUserId(userId, filters = {}) {
    try {
      const {
        status,
        search,
        sort = 'date_desc',
        page = 1,
        limit = 20,
      } = filters;

      let query = 'SELECT * FROM listings WHERE user_id = $1';
      const params = [userId];
      let paramCount = 1;

      // Apply status filter
      if (status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        params.push(status);
      }

      // Apply search filter
      if (search) {
        paramCount++;
        query += ` AND (title ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
        params.push(`%${search}%`);
      }

      // Apply sorting
      const sortMap = {
        date_desc: 'created_at DESC',
        date_asc: 'created_at ASC',
        price_desc: 'price DESC',
        price_asc: 'price ASC',
        title_asc: 'title ASC',
      };
      query += ` ORDER BY ${sortMap[sort] || 'created_at DESC'}`;

      // Count total for pagination
      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count);

      // Apply pagination
      const offset = (page - 1) * limit;
      query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      return {
        listings: result.rows,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error finding listings by user:', error);
      throw error;
    }
  }

  /**
   * Find listing by ID
   * @param {string} id - Listing ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<object|null>}
   */
  static async findById(id, userId) {
    try {
      const query = 'SELECT * FROM listings WHERE id = $1 AND user_id = $2';
      const result = await pool.query(query, [id, userId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding listing by ID:', error);
      throw error;
    }
  }

  /**
   * Find listing by Avito ID
   * @param {string} avitoListingId - Avito listing ID
   * @returns {Promise<object|null>}
   */
  static async findByAvitoId(avitoListingId) {
    try {
      const query = 'SELECT * FROM listings WHERE avito_listing_id = $1';
      const result = await pool.query(query, [avitoListingId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding listing by Avito ID:', error);
      throw error;
    }
  }

  /**
   * Create new listing
   * @param {object} listingData - Listing data
   * @returns {Promise<object>}
   */
  static async create(listingData) {
    try {
      const {
        userId,
        avitoListingId,
        title,
        description,
        price,
        category,
        imageUrl,
        url,
        status = 'active',
      } = listingData;

      const query = `
        INSERT INTO listings (
          user_id, avito_listing_id, title, description, price,
          category, image_url, url, status, last_synced_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING *
      `;

      const result = await pool.query(query, [
        userId,
        avitoListingId,
        title,
        description,
        price,
        category,
        imageUrl,
        url,
        status,
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating listing:', error);
      throw error;
    }
  }

  /**
   * Update listing
   * @param {string} id - Listing ID
   * @param {string} userId - User ID
   * @param {object} updates - Fields to update
   * @returns {Promise<object|null>}
   */
  static async update(id, userId, updates) {
    try {
      const allowedFields = ['title', 'description', 'price', 'status', 'category'];
      const fields = Object.keys(updates).filter((key) =>
        allowedFields.includes(key)
      );

      if (fields.length === 0) {
        throw new Error('No valid fields to update');
      }

      const setClause = fields
        .map((field, index) => `${field} = $${index + 3}`)
        .join(', ');
      const values = fields.map((field) => updates[field]);

      const query = `
        UPDATE listings
        SET ${setClause}, updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `;

      const result = await pool.query(query, [id, userId, ...values]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating listing:', error);
      throw error;
    }
  }

  /**
   * Update listing price
   * @param {string} id - Listing ID
   * @param {string} userId - User ID
   * @param {number} newPrice - New price
   * @returns {Promise<object|null>}
   */
  static async updatePrice(id, userId, newPrice) {
    try {
      const query = `
        UPDATE listings
        SET price = $3, updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `;

      const result = await pool.query(query, [id, userId, newPrice]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating listing price:', error);
      throw error;
    }
  }

  /**
   * Upsert listing (insert or update)
   * @param {object} listingData - Listing data
   * @returns {Promise<object>}
   */
  static async upsert(listingData) {
    try {
      const {
        userId,
        avitoListingId,
        title,
        description,
        price,
        category,
        imageUrl,
        url,
        status = 'active',
      } = listingData;

      const query = `
        INSERT INTO listings (
          user_id, avito_listing_id, title, description, price,
          category, image_url, url, status, last_synced_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        ON CONFLICT (avito_listing_id)
        DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          price = EXCLUDED.price,
          category = EXCLUDED.category,
          image_url = EXCLUDED.image_url,
          url = EXCLUDED.url,
          status = EXCLUDED.status,
          last_synced_at = NOW(),
          updated_at = NOW()
        RETURNING *
      `;

      const result = await pool.query(query, [
        userId,
        avitoListingId,
        title,
        description,
        price,
        category,
        imageUrl,
        url,
        status,
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error upserting listing:', error);
      throw error;
    }
  }

  /**
   * Count user's listings
   * @param {string} userId - User ID
   * @param {string} status - Optional status filter
   * @returns {Promise<number>}
   */
  static async countByUser(userId, status = null) {
    try {
      let query = 'SELECT COUNT(*) FROM listings WHERE user_id = $1';
      const params = [userId];

      if (status) {
        query += ' AND status = $2';
        params.push(status);
      }

      const result = await pool.query(query, params);
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error counting listings:', error);
      throw error;
    }
  }

  /**
   * Update last synced timestamp
   * @param {string} id - Listing ID
   * @returns {Promise<void>}
   */
  static async updateSyncTimestamp(id) {
    try {
      const query = 'UPDATE listings SET last_synced_at = NOW() WHERE id = $1';
      await pool.query(query, [id]);
    } catch (error) {
      logger.error('Error updating sync timestamp:', error);
      throw error;
    }
  }

  /**
   * Delete listing
   * @param {string} id - Listing ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>}
   */
  static async delete(id, userId) {
    try {
      const query = 'DELETE FROM listings WHERE id = $1 AND user_id = $2';
      const result = await pool.query(query, [id, userId]);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error deleting listing:', error);
      throw error;
    }
  }

  /**
   * Get stale listings (not synced recently)
   * @param {number} hoursStale - Hours since last sync
   * @returns {Promise<array>}
   */
  static async getStaleListings(hoursStale = 6) {
    try {
      const query = `
        SELECT * FROM listings
        WHERE status = 'active'
        AND (last_synced_at IS NULL OR last_synced_at < NOW() - INTERVAL '${hoursStale} hours')
        ORDER BY last_synced_at ASC NULLS FIRST
      `;

      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error getting stale listings:', error);
      throw error;
    }
  }
}

export default Listing;
