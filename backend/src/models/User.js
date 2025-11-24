import pool from '../config/database.js';
import bcrypt from 'bcrypt';
import { BCRYPT_SALT_ROUNDS, USER_STATUS, SUBSCRIPTION_PLAN, SUBSCRIPTION_LIMITS } from '../config/constants.js';
import { encrypt, decrypt } from '../utils/encryption.js';

export const createUser = async (email, password, fullName = null) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    
    // Create user first
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, full_name, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name, registration_date, status`,
      [email, passwordHash, fullName, USER_STATUS.ACTIVE]
    );
    
    const user = userResult.rows[0];
    
    // Create PRO trial subscription (14 days)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14);
    
    const subscriptionResult = await client.query(
      `INSERT INTO subscriptions (user_id, plan, listing_limit, ai_message_limit, start_date, end_date, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, plan, listing_limit, ai_message_limit, start_date, end_date`,
      [
        user.id,
        SUBSCRIPTION_PLAN.PRO,
        SUBSCRIPTION_LIMITS.PRO.listing_limit,
        SUBSCRIPTION_LIMITS.PRO.ai_message_limit,
        startDate,
        endDate,
        true
      ]
    );
    
    const subscription = subscriptionResult.rows[0];
    
    // Update user with subscription_id
    await client.query(
      `UPDATE users SET subscription_id = $1 WHERE id = $2`,
      [subscription.id, user.id]
    );
    
    await client.query('COMMIT');
    
    return {
      ...user,
      subscription,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const findUserByEmail = async (email) => {
  const result = await pool.query(
    `SELECT u.*, 
            s.plan, s.listing_limit, s.ai_message_limit, s.start_date, s.end_date, s.is_active as subscription_active
     FROM users u
     LEFT JOIN subscriptions s ON u.subscription_id = s.id
     WHERE u.email = $1`,
    [email]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const user = result.rows[0];
  
  // Decrypt Avito token if exists
  if (user.avito_token) {
    user.avito_token = decrypt(user.avito_token);
  }
  
  return user;
};

export const findUserById = async (userId) => {
  const result = await pool.query(
    `SELECT u.*, 
            s.plan, s.listing_limit, s.ai_message_limit, s.start_date, s.end_date, s.is_active as subscription_active
     FROM users u
     LEFT JOIN subscriptions s ON u.subscription_id = s.id
     WHERE u.id = $1`,
    [userId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const user = result.rows[0];
  
  // Decrypt Avito token if exists
  if (user.avito_token) {
    user.avito_token = decrypt(user.avito_token);
  }
  
  return user;
};

export const verifyPassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

export const updateLastLogin = async (userId) => {
  await pool.query(
    `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1`,
    [userId]
  );
};

export const updateUserProfile = async (userId, updates) => {
  const { fullName, email } = updates;
  
  const result = await pool.query(
    `UPDATE users 
     SET full_name = COALESCE($1, full_name),
         email = COALESCE($2, email)
     WHERE id = $3
     RETURNING id, email, full_name, registration_date, status`,
    [fullName, email, userId]
  );
  
  return result.rows[0];
};

export const storeAvitoToken = async (userId, token) => {
  const encryptedToken = encrypt(token);
  
  await pool.query(
    `UPDATE users SET avito_token = $1 WHERE id = $2`,
    [encryptedToken, userId]
  );
};

export const getAvitoToken = async (userId) => {
  const result = await pool.query(
    `SELECT avito_token FROM users WHERE id = $1`,
    [userId]
  );
  
  if (result.rows.length === 0 || !result.rows[0].avito_token) {
    return null;
  }
  
  return decrypt(result.rows[0].avito_token);
};
