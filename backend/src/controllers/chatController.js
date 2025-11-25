import Chat from '../models/Chat.js';
import Subscription from '../models/Subscription.js';
import OpenAIService from '../services/openaiService.js';
import avitoApiService from '../services/avitoApiService.js';
import logger from '../utils/logger.js';

/**
 * Chat Controller
 * Handles all chat-related API endpoints
 */

class ChatController {
  /**
   * Get all chats for authenticated user
   * GET /api/chats
   */
  static async getChats(req, res, next) {
    try {
      const userId = req.user.id;
      const { unreadOnly = false, page = 1, limit = 20 } = req.query;

      const result = await Chat.findByUserId(userId, {
        unreadOnly: unreadOnly === 'true',
        page: parseInt(page),
        limit: parseInt(limit),
      });

      res.json({
        success: true,
        data: result.chats,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      logger.error('Error fetching chats:', error);
      next(error);
    }
  }

  /**
   * Get messages for a specific chat
   * GET /api/chats/:id/messages
   */
  static async getChatMessages(req, res, next) {
    try {
      const userId = req.user.id;
      const { id: chatId } = req.params;

      // Verify chat ownership
      const chat = await Chat.findById(chatId);
      if (!chat || chat.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: 'Чат не найден',
        });
      }

      const messages = await Chat.getMessages(chatId);
      const listing = await Chat.getListingForChat(chatId);

      res.json({
        success: true,
        data: {
          messages,
          listing,
        },
      });
    } catch (error) {
      logger.error('Error fetching chat messages:', error);
      next(error);
    }
  }

  /**
   * Send manual reply to chat
   * POST /api/chats/:id/reply
   */
  static async sendReply(req, res, next) {
    try {
      const userId = req.user.id;
      const user = req.user;
      const { id: chatId } = req.params;
      const { message } = req.body;

      if (!message || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Сообщение не может быть пустым',
        });
      }

      // Verify chat ownership
      const chat = await Chat.findById(chatId);
      if (!chat || chat.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: 'Чат не найден',
        });
      }

      // Check if user has Avito token
      if (!user.avitoTokenEncrypted) {
        return res.status(400).json({
          success: false,
          error: 'Сначала подключите Avito API в профиле',
        });
      }

      // Send message via Avito API
      const avitoMessageId = await avitoApiService.sendChatMessage(
        user.avitoTokenEncrypted,
        chat.avitoChatId,
        message
      );

      // Log message in database
      const savedMessage = await Chat.createMessage({
        userId,
        listingId: chat.listingId,
        avitoChatId: chat.avitoChatId,
        buyerId: chat.buyerId,
        senderType: 'seller',
        message: message.trim(),
        sentAt: new Date(),
      });

      res.json({
        success: true,
        message: 'Сообщение отправлено',
        data: {
          message: savedMessage,
          avitoMessageId,
        },
      });
    } catch (error) {
      logger.error('Error sending reply:', error);
      next(error);
    }
  }

  /**
   * Send AI-generated reply to chat
   * POST /api/chats/:id/ai-reply
   */
  static async sendAiReply(req, res, next) {
    try {
      const userId = req.user.id;
      const user = req.user;
      const { id: chatId } = req.params;

      // Verify chat ownership
      const chat = await Chat.findById(chatId);
      if (!chat || chat.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: 'Чат не найден',
        });
      }

      // Check subscription AI quota
      const subscription = await Subscription.findByUserId(userId);
      if (!subscription) {
        return res.status(403).json({
          success: false,
          error: 'Подписка не найдена',
        });
      }

      const quota = await Subscription.checkAiQuota(userId);
      if (!quota.hasQuota) {
        return res.status(403).json({
          success: false,
          error: 'Превышен лимит AI сообщений для вашего тарифа',
          quota,
        });
      }

      // Check if user has Avito token
      if (!user.avitoTokenEncrypted) {
        return res.status(400).json({
          success: false,
          error: 'Сначала подключите Avito API в профиле',
        });
      }

      // Get conversation history
      const messages = await Chat.getMessages(chatId, 10); // Last 10 messages
      
      // Get listing context
      const listing = await Chat.getListingForChat(chatId);
      
      if (!listing) {
        return res.status(400).json({
          success: false,
          error: 'Объявление не найдено',
        });
      }

      // Generate AI response
      const aiResponse = await OpenAIService.generateChatResponse(
        messages,
        {
          title: listing.title,
          price: listing.price,
          description: listing.description,
        },
        'Здравствуйте! Могу ли я чем-нибудь помочь?' // Default message if no buyer message
      );

      // Send message via Avito API
      const avitoMessageId = await avitoApiService.sendChatMessage(
        user.avitoTokenEncrypted,
        chat.avitoChatId,
        aiResponse
      );

      // Log message in database
      const savedMessage = await Chat.createMessage({
        userId,
        listingId: chat.listingId,
        avitoChatId: chat.avitoChatId,
        buyerId: chat.buyerId,
        senderType: 'ai_agent',
        message: aiResponse,
        sentAt: new Date(),
      });

      // Increment AI message counter
      await Subscription.incrementAiMessagesUsed(userId);

      res.json({
        success: true,
        message: 'AI сообщение отправлено',
        data: {
          message: savedMessage,
          aiResponse,
          avitoMessageId,
        },
      });
    } catch (error) {
      logger.error('Error sending AI reply:', error);
      next(error);
    }
  }

  /**
   * Mark chat as read
   * PATCH /api/chats/:id/read
   */
  static async markAsRead(req, res, next) {
    try {
      const userId = req.user.id;
      const { id: chatId } = req.params;

      // Verify chat ownership
      const chat = await Chat.findById(chatId);
      if (!chat || chat.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: 'Чат не найден',
        });
      }

      await Chat.markAsRead(chatId);

      res.json({
        success: true,
        message: 'Чат отмечен как прочитанный',
      });
    } catch (error) {
      logger.error('Error marking chat as read:', error);
      next(error);
    }
  }

  /**
   * Enable/disable AI for chat
   * PATCH /api/chats/:id/ai-toggle
   */
  static async toggleAi(req, res, next) {
    try {
      const userId = req.user.id;
      const { id: chatId } = req.params;
      const { enabled } = req.body;

      // Verify chat ownership
      const chat = await Chat.findById(chatId);
      if (!chat || chat.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: 'Чат не найден',
        });
      }

      const updatedChat = await Chat.updateAiStatus(chatId, enabled);

      res.json({
        success: true,
        message: `AI ${enabled ? 'включен' : 'выключен'} для этого чата`,
        data: updatedChat,
      });
    } catch (error) {
      logger.error('Error toggling AI:', error);
      next(error);
    }
  }
}

export default ChatController;
