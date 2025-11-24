export const USER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DELETED: 'deleted',
};

export const LISTING_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  SOLD: 'sold',
  ARCHIVED: 'archived',
};

export const SENDER_TYPE = {
  CLIENT: 'client',
  AI_AGENT: 'ai_agent',
  SELLER: 'seller',
};

export const SUBSCRIPTION_PLAN = {
  START: 'START',
  PRO: 'PRO',
  BUSINESS: 'BUSINESS',
  ENTERPRISE: 'ENTERPRISE',
};

export const SUBSCRIPTION_LIMITS = {
  START: {
    listing_limit: 30,
    ai_message_limit: null,
    price: 499,
  },
  PRO: {
    listing_limit: 300,
    ai_message_limit: 50,
    price: 1049,
  },
  BUSINESS: {
    listing_limit: 1000,
    ai_message_limit: 500,
    price: 2200,
  },
  ENTERPRISE: {
    listing_limit: null,
    ai_message_limit: null,
    price: 5590,
  },
};

export const RATE_LIMITS = {
  GLOBAL: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
  },
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per 15 minutes
  },
  API: {
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
  },
};

export const PASSWORD_MIN_LENGTH = 8;
export const JWT_EXPIRY = '24h';
export const REFRESH_TOKEN_EXPIRY = '7d';
export const BCRYPT_SALT_ROUNDS = 12;
