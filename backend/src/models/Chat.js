import pool from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Chat Model
 * Handles database operations for chat_logs table
 */

class Chat {
  /**
   * Find chats by user ID
   * @param {string} userId - User ID
   * @param {object} options - Query options { unreadOnly, page, limit }
   * @returns {Promise<{chats: array, total: number}>}
   */
  static async findByUserId(userId, options = {}) {
    try {
      const { unreadOnly = false, page = 1, limit = 20 } = options;
      
      let query = `
        SELECT DISTINCT ON (c.avito_chat_id)
          c.*,
          l.title as listing_title,
          l.price as listing_price
        FROM chat_logs c
        LEFT JOIN listings l ON c.listing_id = l.id
        WHERE c.user_id = $1
      `;
      
      const params = [userId];
      let paramCount = 1;
      
      if (unreadOnly) {
        paramCount++;
        query += ` AND c.is_read = FALSE`;
        params.push(false);
      }
      
      query += ` ORDER BY c.avito_chat_id, c.sent_at DESC`;
      
      // Count total for pagination
      const countQuery = `
        SELECT COUNT(DISTINCT c.avito_chat_id) as total
        FROM chat_logs c
        WHERE c.user_id = $1
      `;
      
      const countParams = [userId];
      
      if (unreadOnly) {
        countQuery += ` AND c.is_read = $2`;
        countParams.push(false);
      }
      
      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);
      
      // Apply pagination
      const offset = (page - 1) * limit;
      query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);
      
      const result = await pool.query(query, params);
      
      return {
        chats: result.rows,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error finding chats by user ID:', error);
      throw error;
    }
  }

  /**
   * Find chat by ID
   * @param {string} id - Chat ID
   * @returns {Promise<object|null>}
   */
  static async findById(id) {
    try {
      const query = 'SELECT * FROM chat_logs WHERE id = $1 LIMIT 1';
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding chat by ID:', error);
      throw error;
    }
  }

  /**
   * Find chat by Avito chat ID
   * @param {string} avitoChatId - Avito chat ID
   * @returns {Promise<object|null>}
   */
  static async findByAvitoChatId(avitoChatId) {
    try {
      const query = 'SELECT * FROM chat_logs WHERE avito_chat_id = $1 LIMIT 1';
      const result = await pool.query(query, [avitoChatId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding chat by Avito chat ID:', error);
      throw error;
    }
  }

  /**
   * Get messages for a chat
   * @param {string} chatId - Chat ID
   * @param {number} limit - Number of messages to return
   * @returns {Promise<array>}
   */
  static async getMessages(chatId, limit = 50) {
    try {
      const query = `
        SELECT * FROM chat_logs
        WHERE avito_chat_id = (
          SELECT avito_chat_id FROM chat_logs WHERE id = $1 LIMIT 1
        )
        ORDER BY sent_at ASC
        LIMIT $2
      `;
      
      const result = await pool.query(query, [chatId, limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting chat messages:', error);
      throw error;
    }
  }

  /**
   * Create a new message
   * @param {object} messageData - Message data
   * @returns {Promise<object>}
   */
  static async createMessage(messageData) {
    try {
      const {
        userId,
        listingId,
        avitoChatId,
        buyerId,
        senderType,
        message,
        sentAt,
      } = messageData;

      const query = `
        INSERT INTO chat_logs (
          user_id, listing_id, avito_chat_id, buyer_id, sender_type, message, sent_at, is_read
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const result = await pool.query(query, [
        userId,
        listingId,
        avitoChatId,
        buyerId,
        senderType,
        message,
        sentAt,
        senderType === 'buyer' ? false : true, // Buyer messages are unread, others are read
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating chat message:', error);
      throw error;
    }
  }

  /**
   * Mark chat as read
   * @param {string} chatId - Chat ID
   * @returns {Promise<void>}
   */
  static async markAsRead(chatId) {
    try {
      const query = `
        UPDATE chat_logs
        SET is_read = TRUE
        WHERE avito_chat_id = (
          SELECT avito_chat_id FROM chat_logs WHERE id = $1 LIMIT 1
        )
        AND sender_type = 'buyer'
      `;
      
      await pool.query(query, [chatId]);
    } catch (error) {
      logger.error('Error marking chat as read:', error);
      throw error;
    }
  }

  /**
   * Update AI status for chat
   * @param {string} chatId - Chat ID
   * @param {boolean} enabled - AI enabled status
   * @returns {Promise<object|null>}
   */
  static async updateAiStatus(chatId, enabled) {
    try {
      const query = `
        UPDATE chat_logs
        SET ai_enabled = $2
        WHERE avito_chat_id = (
          SELECT avito_chat_id FROM chat_logs WHERE id = $1 LIMIT 1
        )
        RETURNING *
      `;
      
      const result = await pool.query(query, [chatId, enabled]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating AI status:', error);
      throw error;
    }
  }

  /**
   * Get listing for chat
   * @param {string} chatId - Chat ID
   * @returns {Promise<object|null>}
   */
  static async getListingForChat(chatId) {
    try {
      const query = `
        SELECT l.* FROM listings l
        JOIN chat_logs c ON l.id = c.listing_id
        WHERE c.id = $1
        LIMIT 1
      `;
      
      const result = await pool.query(query, [chatId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting listing for chat:', error);
      throw error;
    }
  }

  /**
   * Count chats by user
   * @param {string} userId - User ID
   * @param {object} options - Count options { unreadOnly }
   * @returns {Promise<number>}
   */
  static async countByUser(userId, options = {}) {
    try {
      const { unreadOnly = false } = options;
      
      let query = 'SELECT COUNT(DISTINCT avito_chat_id) as count FROM chat_logs WHERE user_id = $1';
      const params = [userId];
      
      if (unreadOnly) {
        query += ' AND is_read = FALSE AND sender_type = $2';
        params.push(false);
      }
      
      const result = await pool.query(query, params);
      return parseInt(result.rows[0].count) || 0;
    } catch (error) {
      logger.error('Error counting chats:', error);
      throw error;
    }
  }

  /**
   * Get chat statistics
   * @param {string} userId - User ID
   * @returns {Promise<object>}
   */
  static async getStats(userId) {
    try {
      const query = `
        SELECT
          COUNT(DISTINCT avito_chat_id) as total_chats,
          COUNT(*) FILTER (WHERE sender_type = 'buyer' AND is_read = FALSE) as unread_messages,
          COUNT(*) FILTER (WHERE sender_type = 'seller' OR sender_type = 'ai_agent') as sent_messages
        FROM chat_logs
        WHERE user_id = $1
      `;
      
      const result = await pool.query(query, [userId]);
      const stats = result.rows[0];
      
      return {
        totalChats: parseInt(stats.total_chats) || 0,
        unreadMessages: parseInt(stats.unread_messages) || 0,
        sentMessages: parseInt(stats.sent_messages) || 0,
        responseRate: stats.sent_messages > 0 ? 
          Math.round((stats.sent_messages / (stats.unread_messages + stats.sent_messages)) * 100) : 0,
      };
    } catch (error) {
      logger.error('Error getting chat stats:', error);
      throw error;
    }
  }
}

export default Chat;
