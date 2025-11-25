import cron from 'node-cron';
import Listing from '../models/Listing.js';
import Competitor from '../models/Competitor.js';
import CompetitorParserService from '../services/competitorParserService.js';
import logger from '../utils/logger.js';

/**
 * Competitor Sync Job
 * Periodically update competitor prices
 */

class CompetitorSyncJob {
  static start() {
    // Run every 6 hours
    cron.schedule('0 0 */6 * * *', async () => {
      logger.info('Starting competitor sync job');
      
      try {
        // Get all active listings
        const listings = await Listing.findByUserId(null, { status: 'active' });
        
        let syncedCount = 0;
        let errorCount = 0;
        
        for (const listing of listings.listings) {
          try {
            // Check if competitor data is stale (> 6 hours old)
            const staleCompetitors = await Competitor.getStaleListings(6);
            
            if (staleCompetitors.length > 0) {
              // Parse competitors
              const competitors = await CompetitorParserService.parseCompetitors(listing);
              
              // Store in database
              for (const competitor of competitors) {
                await Competitor.upsert({
                  listingId: listing.id,
                  avitoCompetitorId: competitor.avitoCompetitorId,
                  title: competitor.title,
                  price: competitor.price,
                  url: competitor.url,
                  similarityScore: competitor.similarityScore,
                });
              }
              
              syncedCount++;
              logger.info(`Synced competitors for listing ${listing.id}`);
            }
          } catch (error) {
            errorCount++;
            logger.error(`Error syncing competitors for listing ${listing.id}:`, error);
          }
        }
        
        logger.info('Competitor sync job completed', {
          synced: syncedCount,
          errors: errorCount,
          total: listings.listings.length,
        });
      } catch (error) {
        logger.error('Error in competitor sync job:', error);
      }
    });
    
    logger.info('Competitor sync job scheduled (every 6 hours)');
  }
}

export default CompetitorSyncJob;
