/**
 * Validation utility functions
 */

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} True if valid
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * Requires: min 8 chars, 1 uppercase, 1 lowercase, 1 digit
 * @param {string} password - Password
 * @returns {object} { valid: boolean, errors: string[] }
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (!password) {
    return { valid: false, errors: ['Пароль обязателен'] };
  }
  
  if (password.length < 8) {
    errors.push('Минимум 8 символов');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Требуется заглавная буква');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Требуется строчная буква');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Требуется цифра');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate price value
 * @param {number|string} price - Price value
 * @returns {boolean} True if valid
 */
export const isValidPrice = (price) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return !isNaN(numPrice) && numPrice >= 0;
};

/**
 * Validate required field
 * @param {any} value - Field value
 * @returns {boolean} True if not empty
 */
export const isRequired = (value) => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

/**
 * Validate URL format
 * @param {string} url - URL string
 * @returns {boolean} True if valid
 */
export const isValidUrl = (url) => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate phone number (Russian format)
 * @param {string} phone - Phone number
 * @returns {boolean} True if valid
 */
export const isValidPhone = (phone) => {
  if (!phone) return false;
  const phoneRegex = /^(\+7|8)?[\s-]?\(?[0-9]{3}\)?[\s-]?[0-9]{3}[\s-]?[0-9]{2}[\s-]?[0-9]{2}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate length range
 * @param {string} text - Text to validate
 * @param {number} min - Minimum length
 * @param {number} max - Maximum length
 * @returns {boolean} True if within range
 */
export const isLengthInRange = (text, min, max) => {
  if (!text) return false;
  const length = text.length;
  return length >= min && length <= max;
};

/**
 * Sanitize input (remove HTML tags)
 * @param {string} input - Input string
 * @returns {string} Sanitized string
 */
export const sanitizeInput = (input) => {
  if (!input) return '';
  return input.replace(/<[^>]*>/g, '');
};

/**
 * Validate number range
 * @param {number} value - Number to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} True if within range
 */
export const isNumberInRange = (value, min, max) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num >= min && num <= max;
};
