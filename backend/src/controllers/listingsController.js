import Listing from '../models/Listing.js';
import Competitor from '../models/Competitor.js';
import Subscription from '../models/Subscription.js';
import avitoApiService from '../services/avitoApiService.js';
import logger from '../utils/logger.js';

/**
 * Listings Controller
 * Handles all listing-related API endpoints
 */

class ListingsController {
  /**
   * Get all listings for authenticated user
   * GET /api/listings
   */
  static async getListings(req, res, next) {
    try {
      const userId = req.user.id;
      const { status, search, sort, page, limit } = req.query;

      const result = await Listing.findByUserId(userId, {
        status,
        search,
        sort,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
      });

      res.json({
        success: true,
        data: result.listings,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      logger.error('Error fetching listings:', error);
      next(error);
    }
  }

  /**
   * Get single listing by ID
   * GET /api/listings/:id
   */
  static async getListingById(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const listing = await Listing.findById(id, userId);
      if (!listing) {
        return res.status(404).json({
          success: false,
          error: 'Объявление не найдено',
        });
      }

      // Fetch competitors for this listing
      const competitors = await Competitor.findRecentByListingId(id, 24);
      const stats = await Competitor.getStatistics(id, 24);

      res.json({
        success: true,
        data: {
          listing,
          competitors,
          competitorStats: stats,
        },
      });
    } catch (error) {
      logger.error('Error fetching listing:', error);
      next(error);
    }
  }

  /**
   * Sync listings from Avito
   * POST /api/listings/sync
   */
  static async syncListings(req, res, next) {
    try {
      const userId = req.user.id;
      const user = req.user;

      // Check if user has Avito token
      if (!user.avitoTokenEncrypted) {
        return res.status(400).json({
          success: false,
          error: 'Сначала подключите Avito API в профиле',
        });
      }

      // Check subscription listing limit
      const subscription = await Subscription.findByUserId(userId);
      if (!subscription) {
        return res.status(403).json({
          success: false,
          error: 'Подписка не найдена',
        });
      }

      // Fetch listings from Avito
      const avitoListings = await avitoApiService.fetchListings(
        user.avitoTokenEncrypted,
        userId
      );

      // Check listing limit
      const currentCount = await Listing.countByUser(userId, 'active');
      const limit = subscription.plan === 'ENTERPRISE' ? -1 : 
                    subscription.plan === 'BUSINESS' ? 1000 :
                    subscription.plan === 'PRO' ? 300 : 30;

      if (limit !== -1 && avitoListings.length > limit) {
        return res.status(403).json({
          success: false,
          error: `Превышен лимит объявлений для вашего тарифа (${limit})`,
          limit,
          current: avitoListings.length,
        });
      }

      // Upsert listings
      let syncedCount = 0;
      let updatedCount = 0;

      for (const avitoListing of avitoListings) {
        const existing = await Listing.findByAvitoId(avitoListing.id);
        
        const listingData = {
          userId,
          avitoListingId: avitoListing.id,
          title: avitoListing.title,
          description: avitoListing.description,
          price: avitoListing.price,
          category: avitoListing.category,
          imageUrl: avitoListing.images?.[0],
          url: avitoListing.url,
          status: avitoListing.status === 'active' ? 'active' : 'archived',
        };

        await Listing.upsert(listingData);
        
        if (existing) {
          updatedCount++;
        } else {
          syncedCount++;
        }
      }

      logger.info('Listings synced:', { userId, synced: syncedCount, updated: updatedCount });

      res.json({
        success: true,
        message: 'Синхронизация завершена',
        data: {
          synced: syncedCount,
          updated: updatedCount,
          total: syncedCount + updatedCount,
        },
      });
    } catch (error) {
      logger.error('Error syncing listings:', error);
      next(error);
    }
  }

  /**
   * Update listing
   * PATCH /api/listings/:id
   */
  static async updateListing(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const updates = req.body;

      const listing = await Listing.update(id, userId, updates);
      
      if (!listing) {
        return res.status(404).json({
          success: false,
          error: 'Объявление не найдено',
        });
      }

      res.json({
        success: true,
        message: 'Объявление обновлено',
        data: listing,
      });
    } catch (error) {
      logger.error('Error updating listing:', error);
      next(error);
    }
  }

  /**
   * Update listing price
   * PATCH /api/listings/:id/price
   */
  static async updatePrice(req, res, next) {
    try {
      const userId = req.user.id;
      const user = req.user;
      const { id } = req.params;
      const { newPrice } = req.body;

      // Validate price
      if (!newPrice || newPrice <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Некорректная цена',
        });
      }

      // Get listing
      const listing = await Listing.findById(id, userId);
      if (!listing) {
        return res.status(404).json({
          success: false,
          error: 'Объявление не найдено',
        });
      }

      // Update price in database
      const updatedListing = await Listing.updatePrice(id, userId, newPrice);

      // Update price on Avito
      let avitoUpdated = false;
      if (user.avitoTokenEncrypted && listing.avitoListingId) {
        try {
          avitoUpdated = await avitoApiService.updateListingPrice(
            user.avitoTokenEncrypted,
            listing.avitoListingId,
            newPrice
          );
        } catch (avitoError) {
          logger.warn('Failed to update price on Avito:', avitoError);
        }
      }

      res.json({
        success: true,
        message: 'Цена успешно обновлена',
        data: {
          listing: updatedListing,
          avitoUpdated,
        },
      });
    } catch (error) {
      logger.error('Error updating price:', error);
      next(error);
    }
  }

  /**
   * Delete listing
   * DELETE /api/listings/:id
   */
  static async deleteListing(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const deleted = await Listing.delete(id, userId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Объявление не найдено',
        });
      }

      res.json({
        success: true,
        message: 'Объявление удалено',
      });
    } catch (error) {
      logger.error('Error deleting listing:', error);
      next(error);
    }
  }

  /**
   * Get listing statistics
   * GET /api/listings/:id/stats
   */
  static async getListingStats(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const listing = await Listing.findById(id, userId);
      if (!listing) {
        return res.status(404).json({
          success: false,
          error: 'Объявление не найдено',
        });
      }

      // Get competitor statistics
      const competitorStats = await Competitor.getStatistics(id, 24);
      const priceTrends = await Competitor.getPriceTrends(id, 7);

      res.json({
        success: true,
        data: {
          listingPrice: listing.price,
          competitorStats,
          priceTrends,
        },
      });
    } catch (error) {
      logger.error('Error fetching listing stats:', error);
      next(error);
    }
  }
}

export default ListingsController;
