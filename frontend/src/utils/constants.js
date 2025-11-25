/**
 * Application constants
 */

// API configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  TIMEOUT: 30000, // 30 seconds
};

// Subscription plans
export const SUBSCRIPTION_PLANS = {
  START: {
    name: 'START',
    price: 499,
    listingsLimit: 30,
    aiMessagesLimit: 0,
    features: ['Оптимизатор цен', 'Базовый парсер', 'Логи действий'],
  },
  PRO: {
    name: 'PRO',
    price: 1049,
    listingsLimit: 300,
    aiMessagesLimit: 50,
    features: ['Парсер конкурентов', 'AI агент чата', 'Все функции START'],
  },
  BUSINESS: {
    name: 'BUSINESS',
    price: 2200,
    listingsLimit: 1000,
    aiMessagesLimit: 500,
    features: ['Расширенная аналитика', 'Приоритетная поддержка', 'Все функции PRO'],
  },
  ENTERPRISE: {
    name: 'ENTERPRISE',
    price: 5590,
    listingsLimit: -1, // Unlimited
    aiMessagesLimit: -1, // Unlimited
    features: ['API доступ', 'Интеграции', 'Все функции BUSINESS'],
  },
};

// Listing statuses
export const LISTING_STATUS = {
  ACTIVE: { value: 'active', label: 'Активно', color: 'green' },
  ARCHIVED: { value: 'archived', label: 'В архиве', color: 'gray' },
  SOLD: { value: 'sold', label: 'Продано', color: 'blue' },
};

// Chat sender types
export const SENDER_TYPE = {
  BUYER: { value: 'buyer', label: 'Покупатель', bgColor: '#F3F4F6', textColor: '#000' },
  SELLER: { value: 'seller', label: 'Продавец', bgColor: '#3B82F6', textColor: '#FFF' },
  AI_AGENT: { value: 'ai_agent', label: 'AI агент', bgColor: '#10B981', textColor: '#FFF' },
};

// Confidence levels
export const CONFIDENCE_LEVELS = {
  HIGH: { value: 'high', label: 'Высокая', color: 'green' },
  MEDIUM: { value: 'medium', label: 'Средняя', color: 'yellow' },
  LOW: { value: 'low', label: 'Низкая', color: 'red' },
};

// Price comparison colors
export const PRICE_COMPARISON = {
  BELOW_AVERAGE: { label: 'Ниже среднего', color: 'green' },
  AT_AVERAGE: { label: 'На уровне среднего', color: 'yellow' },
  ABOVE_AVERAGE: { label: 'Выше среднего', color: 'red' },
};

// Date filter presets
export const DATE_PRESETS = [
  { value: '7', label: 'Последние 7 дней' },
  { value: '30', label: 'Последние 30 дней' },
  { value: '90', label: 'Последние 90 дней' },
  { value: 'custom', label: 'Выбрать период' },
];

// Sort options for listings
export const LISTING_SORT_OPTIONS = [
  { value: 'date_desc', label: 'Сначала новые' },
  { value: 'date_asc', label: 'Сначала старые' },
  { value: 'price_desc', label: 'Сначала дорогие' },
  { value: 'price_asc', label: 'Сначала дешевые' },
  { value: 'views_desc', label: 'Больше просмотров' },
];

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
};

// Toast notification durations
export const TOAST_DURATION = {
  SUCCESS: 3000,
  ERROR: 5000,
  INFO: 4000,
};

// Chart colors
export const CHART_COLORS = {
  PRIMARY: '#3B82F6',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  DANGER: '#EF4444',
  GRAY: '#9CA3AF',
};

// Responsive breakpoints (match TailwindCSS)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Ошибка сети. Проверьте подключение к интернету.',
  UNAUTHORIZED: 'Необходимо войти в систему.',
  FORBIDDEN: 'Недостаточно прав для выполнения операции.',
  NOT_FOUND: 'Запрашиваемый ресурс не найден.',
  SERVER_ERROR: 'Ошибка сервера. Попробуйте позже.',
  VALIDATION_ERROR: 'Проверьте правильность введенных данных.',
  RATE_LIMIT: 'Слишком много запросов. Попробуйте позже.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Вы успешно вошли в систему',
  REGISTER: 'Регистрация прошла успешно',
  PROFILE_UPDATED: 'Профиль обновлен',
  AVITO_CONNECTED: 'Avito подключен',
  PRICE_UPDATED: 'Цена успешно обновлена',
  MESSAGE_SENT: 'Сообщение отправлено',
  SYNC_COMPLETED: 'Синхронизация завершена',
};

// App metadata
export const APP_META = {
  NAME: import.meta.env.VITE_APP_NAME || 'Avvo',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  DESCRIPTION: 'AI Helper для продавцов Avito',
};

// Trial period
export const TRIAL_PERIOD_DAYS = 14;

// Usage warning threshold (percentage)
export const USAGE_WARNING_THRESHOLD = 80;
