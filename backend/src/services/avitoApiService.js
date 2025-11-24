import axios from 'axios';
import { getAvitoToken } from '../models/User.js';
import logger from '../utils/logger.js';

class AvitoAPIService {
  constructor() {
    this.baseURL = process.env.AVITO_API_BASE_URL || 'https://api.avito.ru';
  }

  /**
   * Create Avito API client with user token
   */
  createClient(avitoToken) {
    return axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${avitoToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Test Avito API connection
   */
  async testConnection(avitoToken) {
    try {
      const client = this.createClient(avitoToken);
      const response = await client.get('/core/v1/accounts/self');
      return {
        success: true,
        account: response.data,
      };
    } catch (error) {
      logger.error('Avito API connection test failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Не удалось подключиться к Avito API',
      };
    }
  }

  /**
   * Fetch user listings from Avito
   */
  async fetchListings(userId) {
    try {
      const avitoToken = await getAvitoToken(userId);
      if (!avitoToken) {
        throw new Error('Avito token not found');
      }

      const client = this.createClient(avitoToken);
      const response = await client.get('/core/v1/items', {
        params: {
          per_page: 100,
        },
      });

      return response.data.resources || [];
    } catch (error) {
      logger.error('Failed to fetch Avito listings:', error);
      throw error;
    }
  }

  /**
   * Fetch chat messages from Avito
   */
  async fetchChatMessages(userId, chatId, since = null) {
    try {
      const avitoToken = await getAvitoToken(userId);
      if (!avitoToken) {
        throw new Error('Avito token not found');
      }

      const client = this.createClient(avitoToken);
      
      // Get account ID first
      const accountResponse = await client.get('/core/v1/accounts/self');
      const accountId = accountResponse.data.id;

      // Fetch messages
      const params = {};
      if (since) {
        params.since = since;
      }

      const response = await client.get(
        `/messenger/v2/accounts/${accountId}/chats/${chatId}/messages`,
        { params }
      );

      return response.data.messages || [];
    } catch (error) {
      logger.error('Failed to fetch Avito chat messages:', error);
      throw error;
    }
  }

  /**
   * Send message to Avito chat
   */
  async sendChatMessage(userId, chatId, messageText) {
    try {
      const avitoToken = await getAvitoToken(userId);
      if (!avitoToken) {
        throw new Error('Avito token not found');
      }

      const client = this.createClient(avitoToken);
      
      // Get account ID
      const accountResponse = await client.get('/core/v1/accounts/self');
      const accountId = accountResponse.data.id;

      // Send message
      const response = await client.post(
        `/messenger/v2/accounts/${accountId}/chats/${chatId}/messages`,
        {
          message: {
            text: messageText,
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to send Avito chat message:', error);
      throw error;
    }
  }

  /**
   * Update listing price on Avito
   */
  async updateListingPrice(userId, avitoListingId, newPrice) {
    try {
      const avitoToken = await getAvitoToken(userId);
      if (!avitoToken) {
        throw new Error('Avito token not found');
      }

      const client = this.createClient(avitoToken);
      
      const response = await client.patch(`/core/v1/items/${avitoListingId}`, {
        price: newPrice,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to update Avito listing price:', error);
      throw error;
    }
  }

  /**
   * Fetch listing analytics from Avito
   */
  async fetchListingAnalytics(userId, avitoListingId) {
    try {
      const avitoToken = await getAvitoToken(userId);
      if (!avitoToken) {
        throw new Error('Avito token not found');
      }

      const client = this.createClient(avitoToken);
      
      const response = await client.get(`/core/v1/items/${avitoListingId}/stats`);

      return {
        views: response.data.views || 0,
        clicks: response.data.clicks || 0,
        favorites: response.data.favorites || 0,
      };
    } catch (error) {
      logger.error('Failed to fetch Avito listing analytics:', error);
      return {
        views: 0,
        clicks: 0,
        favorites: 0,
      };
    }
  }
}

export default new AvitoAPIService();
