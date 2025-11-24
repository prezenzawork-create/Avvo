import express from 'express';
import * as authController from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes with rate limiting
router.post(
  '/register',
  authLimiter,
  authController.validateRegistration,
  authController.register
);

router.post(
  '/login',
  authLimiter,
  authController.validateLogin,
  authController.login
);

// Protected routes
router.get('/me', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);
router.post('/avito-connect', authMiddleware, authController.connectAvito);

export default router;
