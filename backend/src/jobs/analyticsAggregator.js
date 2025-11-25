import cron from 'node-cron';
import Listing from '../models/Listing.js';
import Analytics from '../models/Analytics.js';
import avitoApiService from '../services/avitoApiService.js';
import logger from '../utils/logger.js';

/**
 * Analytics Aggregator Job
 * Collect analytics data from Avito
 */

class AnalyticsAggregatorJob {
  static start() {
    // Run daily at 02:00
    cron.schedule('0 2 * * *', async () => {
      logger.info('Starting analytics aggregator job');
      
      try {
        // Get all listings with Avito connection
        const listings = await Listing.findByUserId(null, { status: 'active' });
        
        let processedCount = 0;
        let errorCount = 0;
        
        for (const listing of listings.listings) {
          try {
            // Skip if no Avito listing ID
            if (!listing.avitoListingId) continue;
            
            // Fetch analytics from Avito API (this would need to be implemented in avitoApiService)
            // For now, we'll simulate the data
            const analyticsData = {
              views: Math.floor(Math.random() * 1000),
              messages: Math.floor(Math.random() * 100),
              favorites: Math.floor(Math.random() * 50),
              date: new Date(),
            };
            
            // Store in analytics table
            await Analytics.create({
              listingId: listing.id,
              date: analyticsData.date,
              views: analyticsData.views,
              messages: analyticsData.messages,
              favorites: analyticsData.favorites,
            });
            
            processedCount++;
            logger.info(`Aggregated analytics for listing ${listing.id}`);
          } catch (error) {
            errorCount++;
            logger.error(`Error aggregating analytics for listing ${listing.id}:`, error);
          }
        }
        
        // Purge analytics data older than 90 days
        const deletedCount = await Analytics.deleteOld(90);
        
        logger.info('Analytics aggregator job completed', {
          processed: processedCount,
          errors: errorCount,
          purged: deletedCount,
        });
      } catch (error) {
        logger.error('Error in analytics aggregator job:', error);
      }
    });
    
    logger.info('Analytics aggregator job scheduled (daily at 02:00)');
  }
}

export default AnalyticsAggregatorJob;
