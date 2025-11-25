import Competitor from '../models/Competitor.js';
import Listing from '../models/Listing.js';
import CompetitorParserService from '../services/competitorParserService.js';
import logger from '../utils/logger.js';

/**
 * Competitor Controller
 * Handles all competitor-related API endpoints
 */

class CompetitorController {
  /**
   * Get competitors for a listing
   * GET /api/competitors
   */
  static async getCompetitors(req, res, next) {
    try {
      const userId = req.user.id;
      const { listing_id: listingId } = req.query;

      if (!listingId) {
        return res.status(400).json({
          success: false,
          error: 'ID объявления обязателен',
        });
      }

      // Verify listing ownership
      const listing = await Listing.findById(listingId, userId);
      if (!listing) {
        return res.status(404).json({
          success: false,
          error: 'Объявление не найдено',
        });
      }

      const competitors = await Competitor.findByListingId(listingId);
      const stats = await Competitor.getStatistics(listingId);

      res.json({
        success: true,
        data: {
          competitors,
          stats,
        },
      });
    } catch (error) {
      logger.error('Error fetching competitors:', error);
      next(error);
    }
  }

  /**
   * Parse competitors for a listing
   * POST /api/competitors/parse
   */
  static async parseCompetitors(req, res, next) {
    try {
      const userId = req.user.id;
      const { listingId } = req.body;

      if (!listingId) {
        return res.status(400).json({
          success: false,
          error: 'ID объявления обязателен',
        });
      }

      // Verify listing ownership
      const listing = await Listing.findById(listingId, userId);
      if (!listing) {
        return res.status(404).json({
          success: false,
          error: 'Объявление не найдено',
        });
      }

      // Parse competitors
      const parsedCompetitors = await CompetitorParserService.parseCompetitors(listing);

      // Filter by similarity
      const filteredCompetitors = CompetitorParserService.filterBySimilarity(
        parsedCompetitors,
        listing.title,
        0.3
      );

      // Validate and normalize competitors
      const validCompetitors = filteredCompetitors
        .map(competitor => CompetitorParserService.normalizeCompetitor(competitor))
        .filter(competitor => CompetitorParserService.validateCompetitor(competitor));

      // Store in database
      let storedCount = 0;
      for (const competitor of validCompetitors) {
        try {
          await Competitor.upsert({
            listingId,
            avitoCompetitorId: competitor.avitoCompetitorId,
            title: competitor.title,
            price: competitor.price,
            url: competitor.url,
            similarityScore: competitor.similarityScore,
          });
          storedCount++;
        } catch (dbError) {
          logger.warn('Failed to store competitor:', dbError);
        }
      }

      res.json({
        success: true,
        message: 'Парсинг конкурентов завершен',
        data: {
          parsed: parsedCompetitors.length,
          filtered: filteredCompetitors.length,
          stored: storedCount,
          competitors: validCompetitors.slice(0, 10), // Return first 10 for preview
        },
      });
    } catch (error) {
      logger.error('Error parsing competitors:', error);
      next(error);
    }
  }

  /**
   * Get competitor statistics
   * GET /api/competitors/stats
   */
  static async getCompetitorStats(req, res, next) {
    try {
      const userId = req.user.id;
      const { listing_id: listingId } = req.query;

      if (!listingId) {
        return res.status(400).json({
          success: false,
          error: 'ID объявления обязателен',
        });
      }

      // Verify listing ownership
      const listing = await Listing.findById(listingId, userId);
      if (!listing) {
        return res.status(404).json({
          success: false,
          error: 'Объявление не найдено',
        });
      }

      const stats = await Competitor.getStatistics(listingId);
      const distribution = await Competitor.getPriceDistribution(listingId);

      res.json({
        success: true,
        data: {
          stats,
          distribution,
        },
      });
    } catch (error) {
      logger.error('Error fetching competitor stats:', error);
      next(error);
    }
  }

  /**
   * Get competitor price trends
   * GET /api/competitors/trends
   */
  static async getPriceTrends(req, res, next) {
    try {
      const userId = req.user.id;
      const { listing_id: listingId, days = 7 } = req.query;

      if (!listingId) {
        return res.status(400).json({
          success: false,
          error: 'ID объявления обязателен',
        });
      }

      // Verify listing ownership
      const listing = await Listing.findById(listingId, userId);
      if (!listing) {
        return res.status(404).json({
          success: false,
          error: 'Объявление не найдено',
        });
      }

      const trends = await Competitor.getPriceTrends(listingId, parseInt(days));

      res.json({
        success: true,
        data: {
          trends,
        },
      });
    } catch (error) {
      logger.error('Error fetching price trends:', error);
      next(error);
    }
  }

  /**
   * Delete old competitor data
   * DELETE /api/competitors/old
   */
  static async deleteOldCompetitors(req, res, next) {
    try {
      const { daysOld = 30 } = req.query;
      const deletedCount = await Competitor.deleteOld(parseInt(daysOld));

      res.json({
        success: true,
        message: `Удалено ${deletedCount} записей`,
        data: {
          deletedCount,
        },
      });
    } catch (error) {
      logger.error('Error deleting old competitors:', error);
      next(error);
    }
  }
}

export default CompetitorController;
