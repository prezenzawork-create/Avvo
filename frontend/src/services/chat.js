import api from './api';

/**
 * Chat API Service
 * Handles chat-related API calls
 */

const chatService = {
  /**
   * Get all chats
   * @param {object} params - Query parameters { unreadOnly, page, limit }
   * @returns {Promise}
   */
  getChats: (params = {}) => {
    return api.get('/chats', { params });
  },

  /**
   * Get messages for a chat
   * @param {string} chatId - Chat ID
   * @returns {Promise}
   */
  getChatMessages: (chatId) => {
    return api.get(`/chats/${chatId}/messages`);
  },

  /**
   * Send manual reply
   * @param {string} chatId - Chat ID
   * @param {string} message - Message text
   * @returns {Promise}
   */
  sendReply: (chatId, message) => {
    return api.post(`/chats/${chatId}/reply`, { message });
  },

  /**
   * Send AI-generated reply
   * @param {string} chatId - Chat ID
   * @returns {Promise}
   */
  sendAiReply: (chatId) => {
    return api.post(`/chats/${chatId}/ai-reply`);
  },

  /**
   * Mark chat as read
   * @param {string} chatId - Chat ID
   * @returns {Promise}
   */
  markAsRead: (chatId) => {
    return api.patch(`/chats/${chatId}/read`);
  },
};

export default chatService;
