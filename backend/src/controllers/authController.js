import { body, validationResult } from 'express-validator';
import * as UserModel from '../models/User.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import logger from '../utils/logger.js';
import { PASSWORD_MIN_LENGTH } from '../config/constants.js';

export const validateRegistration = [
  body('email')
    .isEmail()
    .withMessage('Некорректный формат email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: PASSWORD_MIN_LENGTH })
    .withMessage(`Пароль должен содержать минимум ${PASSWORD_MIN_LENGTH} символов`)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Пароль должен содержать заглавные и строчные буквы, а также цифры'),
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Имя должно быть от 2 до 255 символов'),
];

export const validateLogin = [
  body('email').isEmail().withMessage('Некорректный формат email').normalizeEmail(),
  body('password').notEmpty().withMessage('Пароль обязателен'),
];

export const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации',
        errors: errors.array(),
      });
    }
    
    const { email, password, fullName } = req.body;
    
    // Check if user already exists
    const existingUser = await UserModel.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email уже зарегистрирован',
      });
    }
    
    // Create user with trial subscription
    const user = await UserModel.createUser(email, password, fullName);
    
    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);
    
    logger.info(`New user registered: ${email}`);
    
    // Remove sensitive data
    delete user.password_hash;
    
    res.status(201).json({
      success: true,
      message: 'Регистрация успешна. Активирована 14-дневная пробная версия PRO',
      data: {
        user,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error('Registration error:', error);
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации',
        errors: errors.array(),
      });
    }
    
    const { email, password } = req.body;
    
    // Find user
    const user = await UserModel.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Неверный email или пароль',
      });
    }
    
    // Verify password
    const isValidPassword = await UserModel.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Неверный email или пароль',
      });
    }
    
    // Check user status
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Учетная запись заблокирована',
      });
    }
    
    // Update last login
    await UserModel.updateLastLogin(user.id);
    
    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);
    
    logger.info(`User logged in: ${email}`);
    
    // Remove sensitive data
    delete user.password_hash;
    delete user.avito_token;
    
    res.json({
      success: true,
      message: 'Вход выполнен успешно',
      data: {
        user,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await UserModel.findUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден',
      });
    }
    
    // Remove sensitive data
    delete user.password_hash;
    delete user.avito_token;
    
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { fullName, email } = req.body;
    
    const updatedUser = await UserModel.updateUserProfile(req.user.userId, {
      fullName,
      email,
    });
    
    res.json({
      success: true,
      message: 'Профиль обновлен успешно',
      data: updatedUser,
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    next(error);
  }
};

export const connectAvito = async (req, res, next) => {
  try {
    const { avitoToken } = req.body;
    
    if (!avitoToken) {
      return res.status(400).json({
        success: false,
        message: 'Токен Avito обязателен',
      });
    }
    
    // Test Avito API connection
    const avitoApiService = (await import('../services/avitoApiService.js')).default;
    const testResult = await avitoApiService.testConnection(avitoToken);
    
    if (!testResult.success) {
      return res.status(400).json({
        success: false,
        message: testResult.error || 'Недействительный токен Avito',
      });
    }
    
    await UserModel.storeAvitoToken(req.user.userId, avitoToken);
    
    logger.info(`Avito token stored for user: ${req.user.userId}`);
    
    res.json({
      success: true,
      message: 'Avito API подключен успешно',
      data: {
        account: testResult.account,
      },
    });
  } catch (error) {
    logger.error('Connect Avito error:', error);
    next(error);
  }
};
