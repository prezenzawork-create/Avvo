import pool from './database.js';

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Enable UUID extension
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);
    
    // Create ENUM types
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deleted');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        CREATE TYPE listing_status AS ENUM ('active', 'paused', 'sold', 'archived');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        CREATE TYPE sender_type AS ENUM ('client', 'ai_agent', 'seller');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        CREATE TYPE subscription_plan AS ENUM ('START', 'PRO', 'BUSINESS', 'ENTERPRISE');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    // Create Subscriptions table first (referenced by Users)
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID UNIQUE NOT NULL,
        plan subscription_plan NOT NULL,
        listing_limit INTEGER NOT NULL,
        ai_message_limit INTEGER NULL,
        start_date DATE NOT NULL,
        end_date DATE NULL,
        is_active BOOLEAN DEFAULT TRUE,
        auto_renew BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_subscriptions_user_active 
        ON subscriptions(user_id, is_active);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date 
        ON subscriptions(end_date);
    `);
    
    // Create Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NULL,
        subscription_id UUID REFERENCES subscriptions(id),
        avito_token TEXT NULL,
        registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL,
        status user_status NOT NULL DEFAULT 'active'
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_subscription_id ON users(subscription_id);
      CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
    `);
    
    // Update subscriptions to add foreign key to users
    await client.query(`
      ALTER TABLE subscriptions 
      DROP CONSTRAINT IF EXISTS fk_subscriptions_user;
      
      ALTER TABLE subscriptions 
      ADD CONSTRAINT fk_subscriptions_user 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    `);
    
    // Create Listings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS listings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        avito_listing_id VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT NULL,
        current_price DECIMAL(10,2) NOT NULL,
        recommended_price DECIMAL(10,2) NULL,
        category VARCHAR(100) NULL,
        status listing_status NOT NULL DEFAULT 'active',
        auto_pricing_enabled BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id);
      CREATE INDEX IF NOT EXISTS idx_listings_avito_id ON listings(avito_listing_id);
      CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
      CREATE INDEX IF NOT EXISTS idx_listings_user_status 
        ON listings(user_id, status);
      CREATE INDEX IF NOT EXISTS idx_listings_user_auto_pricing 
        ON listings(user_id, auto_pricing_enabled);
    `);
    
    // Create Competitors table
    await client.query(`
      CREATE TABLE IF NOT EXISTS competitors (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
        competitor_avito_id VARCHAR(255) NOT NULL,
        competitor_price DECIMAL(10,2) NOT NULL,
        competitor_title VARCHAR(500) NULL,
        similarity_score DECIMAL(4,2) NULL CHECK (similarity_score >= 0 AND similarity_score <= 1),
        scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE
      );
      
      CREATE INDEX IF NOT EXISTS idx_competitors_listing_id ON competitors(listing_id);
      CREATE INDEX IF NOT EXISTS idx_competitors_scraped_at ON competitors(scraped_at);
      CREATE INDEX IF NOT EXISTS idx_competitors_listing_active 
        ON competitors(listing_id, is_active);
      CREATE INDEX IF NOT EXISTS idx_competitors_avito_id 
        ON competitors(competitor_avito_id);
    `);
    
    // Create Analytics table
    await client.query(`
      CREATE TABLE IF NOT EXISTS analytics (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        views_count INTEGER DEFAULT 0,
        clicks_count INTEGER DEFAULT 0,
        messages_count INTEGER DEFAULT 0,
        favorites_count INTEGER DEFAULT 0,
        price_at_date DECIMAL(10,2) NULL,
        UNIQUE(listing_id, date)
      );
      
      CREATE INDEX IF NOT EXISTS idx_analytics_listing_date 
        ON analytics(listing_id, date);
      CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics(date);
    `);
    
    // Create Chat Logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
        avito_chat_id VARCHAR(255) NOT NULL,
        message_text TEXT NOT NULL,
        sender_type sender_type NOT NULL,
        is_automated BOOLEAN DEFAULT FALSE,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_chat_logs_listing_id ON chat_logs(listing_id);
      CREATE INDEX IF NOT EXISTS idx_chat_logs_chat_sent 
        ON chat_logs(avito_chat_id, sent_at);
      CREATE INDEX IF NOT EXISTS idx_chat_logs_sent_at ON chat_logs(sent_at);
    `);
    
    // Create AI Message Usage table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_message_usage (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        billing_month DATE NOT NULL,
        messages_used INTEGER DEFAULT 0,
        messages_limit INTEGER NOT NULL,
        last_reset_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, billing_month)
      );
      
      CREATE INDEX IF NOT EXISTS idx_ai_usage_user_month 
        ON ai_message_usage(user_id, billing_month);
      CREATE INDEX IF NOT EXISTS idx_ai_usage_month 
        ON ai_message_usage(billing_month);
    `);
    
    await client.query('COMMIT');
    console.log('✓ Database tables created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

const runMigration = async () => {
  try {
    console.log('Starting database migration...');
    await createTables();
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigration();
