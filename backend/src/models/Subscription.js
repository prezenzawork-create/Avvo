import pool from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Subscription Model
 * Handles database operations for subscriptions table
 */

class Subscription {
  /**
   * Find subscription by user ID
   * @param {string} userId - User ID
   * @returns {Promise<object|null>}
   */
  static async findByUserId(userId) {
    try {
      const query = 'SELECT * FROM subscriptions WHERE user_id = $1';
      const result = await pool.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding subscription by user ID:', error);
      throw error;
    }
  }

  /**
   * Create new subscription
   * @param {object} subscriptionData - Subscription data
   * @returns {Promise<object>}
   */
  static async create(subscriptionData) {
    try {
      const {
        userId,
        plan,
        status = 'active',
        startedAt = new Date(),
        expiresAt,
        aiMessagesLimit,
      } = subscriptionData;

      const query = `
        INSERT INTO subscriptions (
          user_id, plan, status, started_at, expires_at, ai_messages_used, ai_messages_limit
        )
        VALUES ($1, $2, $3, $4, $5, 0, $6)
        RETURNING *
      `;

      const result = await pool.query(query, [
        userId,
        plan,
        status,
        startedAt,
        expiresAt,
        aiMessagesLimit,
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Update subscription
   * @param {string} userId - User ID
   * @param {object} updates - Fields to update
   * @returns {Promise<object|null>}
   */
  static async update(userId, updates) {
    try {
      const allowedFields = [
        'plan',
        'status',
        'expires_at',
        'ai_messages_used',
        'ai_messages_limit',
      ];
      const fields = Object.keys(updates).filter((key) =>
        allowedFields.includes(key)
      );

      if (fields.length === 0) {
        throw new Error('No valid fields to update');
      }

      const setClause = fields
        .map((field, index) => `${field} = $${index + 2}`)
        .join(', ');
      const values = fields.map((field) => updates[field]);

      const query = `
        UPDATE subscriptions
        SET ${setClause}, updated_at = NOW()
        WHERE user_id = $1
        RETURNING *
      `;

      const result = await pool.query(query, [userId, ...values]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating subscription:', error);
      throw error;
    }
  }

  /**
   * Increment AI messages used counter
   * @param {string} userId - User ID
   * @returns {Promise<object|null>}
   */
  static async incrementAiMessagesUsed(userId) {
    try {
      const query = `
        UPDATE subscriptions
        SET ai_messages_used = ai_messages_used + 1, updated_at = NOW()
        WHERE user_id = $1
        RETURNING *
      `;

      const result = await pool.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error incrementing AI messages used:', error);
      throw error;
    }
  }

  /**
   * Reset AI messages counter (monthly reset)
   * @param {string} userId - User ID
   * @returns {Promise<object|null>}
   */
  static async resetAiMessagesUsed(userId) {
    try {
      const query = `
        UPDATE subscriptions
        SET ai_messages_used = 0, updated_at = NOW()
        WHERE user_id = $1
        RETURNING *
      `;

      const result = await pool.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error resetting AI messages used:', error);
      throw error;
    }
  }

  /**
   * Check if subscription is active
   * @param {string} userId - User ID
   * @returns {Promise<boolean>}
   */
  static async isActive(userId) {
    try {
      const query = `
        SELECT status, expires_at FROM subscriptions
        WHERE user_id = $1
      `;

      const result = await pool.query(query, [userId]);
      const subscription = result.rows[0];

      if (!subscription) return false;
      if (subscription.status !== 'active') return false;
      if (new Date(subscription.expires_at) < new Date()) return false;

      return true;
    } catch (error) {
      logger.error('Error checking subscription status:', error);
      throw error;
    }
  }

  /**
   * Check if user has AI messages quota remaining
   * @param {string} userId - User ID
   * @returns {Promise<{hasQuota: boolean, used: number, limit: number}>}
   */
  static async checkAiQuota(userId) {
    try {
      const query = `
        SELECT ai_messages_used, ai_messages_limit
        FROM subscriptions
        WHERE user_id = $1
      `;

      const result = await pool.query(query, [userId]);
      const subscription = result.rows[0];

      if (!subscription) {
        return { hasQuota: false, used: 0, limit: 0 };
      }

      const used = subscription.ai_messages_used || 0;
      const limit = subscription.ai_messages_limit || 0;

      // -1 means unlimited
      const hasQuota = limit === -1 || used < limit;

      return { hasQuota, used, limit };
    } catch (error) {
      logger.error('Error checking AI quota:', error);
      throw error;
    }
  }

  /**
   * Get expiring subscriptions (for notification)
   * @param {number} daysUntilExpiry - Days before expiry
   * @returns {Promise<array>}
   */
  static async getExpiringSubscriptions(daysUntilExpiry = 3) {
    try {
      const query = `
        SELECT s.*, u.email, u.full_name
        FROM subscriptions s
        JOIN users u ON s.user_id = u.id
        WHERE s.status = 'active'
        AND s.expires_at > NOW()
        AND s.expires_at < NOW() + INTERVAL '${daysUntilExpiry} days'
        ORDER BY s.expires_at ASC
      `;

      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error getting expiring subscriptions:', error);
      throw error;
    }
  }

  /**
   * Get expired subscriptions
   * @returns {Promise<array>}
   */
  static async getExpiredSubscriptions() {
    try {
      const query = `
        SELECT * FROM subscriptions
        WHERE status = 'active'
        AND expires_at < NOW()
      `;

      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error getting expired subscriptions:', error);
      throw error;
    }
  }

  /**
   * Expire subscription
   * @param {string} userId - User ID
   * @returns {Promise<object|null>}
   */
  static async expire(userId) {
    try {
      const query = `
        UPDATE subscriptions
        SET status = 'expired', updated_at = NOW()
        WHERE user_id = $1
        RETURNING *
      `;

      const result = await pool.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error expiring subscription:', error);
      throw error;
    }
  }

  /**
   * Upgrade/downgrade subscription plan
   * @param {string} userId - User ID
   * @param {string} newPlan - New plan name
   * @param {object} options - Additional options { expiresAt, aiMessagesLimit }
   * @returns {Promise<object|null>}
   */
  static async changePlan(userId, newPlan, options = {}) {
    try {
      const { expiresAt, aiMessagesLimit } = options;

      let query = `
        UPDATE subscriptions
        SET plan = $2, updated_at = NOW()
      `;
      const params = [userId, newPlan];

      if (expiresAt) {
        query += `, expires_at = $${params.length + 1}`;
        params.push(expiresAt);
      }

      if (aiMessagesLimit !== undefined) {
        query += `, ai_messages_limit = $${params.length + 1}`;
        params.push(aiMessagesLimit);
      }

      query += ' WHERE user_id = $1 RETURNING *';

      const result = await pool.query(query, params);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error changing subscription plan:', error);
      throw error;
    }
  }

  /**
   * Get subscription stats (for admin)
   * @returns {Promise<object>}
   */
  static async getStats() {
    try {
      const query = `
        SELECT
          plan,
          status,
          COUNT(*) as count
        FROM subscriptions
        GROUP BY plan, status
        ORDER BY plan, status
      `;

      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error getting subscription stats:', error);
      throw error;
    }
  }
}

export default Subscription;
