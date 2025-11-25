import express from 'express';
import ChatController from '../controllers/chatController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { body, param, query } from 'express-validator';

const router = express.Router();

/**
 * All routes require authentication
 */
router.use(authenticate);

/**
 * GET /api/chats
 * Get all chats for authenticated user
 */
router.get(
  '/',
  [
    query('unreadOnly').optional().isBoolean(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  ChatController.getChats
);

/**
 * GET /api/chats/:id/messages
 * Get messages for a specific chat
 */
router.get(
  '/:id/messages',
  [
    param('id').isUUID().withMessage('Некорректный ID чата'),
  ],
  ChatController.getChatMessages
);

/**
 * POST /api/chats/:id/reply
 * Send manual reply to chat
 */
router.post(
  '/:id/reply',
  [
    param('id').isUUID().withMessage('Некорректный ID чата'),
    body('message').isString().trim().isLength({ min: 1 }).withMessage('Сообщение не может быть пустым'),
  ],
  ChatController.sendReply
);

/**
 * POST /api/chats/:id/ai-reply
 * Send AI-generated reply to chat
 */
router.post(
  '/:id/ai-reply',
  [
    param('id').isUUID().withMessage('Некорректный ID чата'),
  ],
  ChatController.sendAiReply
);

/**
 * PATCH /api/chats/:id/read
 * Mark chat as read
 */
router.patch(
  '/:id/read',
  [
    param('id').isUUID().withMessage('Некорректный ID чата'),
  ],
  ChatController.markAsRead
);

/**
 * PATCH /api/chats/:id/ai-toggle
 * Enable/disable AI for chat
 */
router.patch(
  '/:id/ai-toggle',
  [
    param('id').isUUID().withMessage('Некорректный ID чата'),
    body('enabled').isBoolean().withMessage('Значение должно быть boolean'),
  ],
  ChatController.toggleAi
);

export default router;
