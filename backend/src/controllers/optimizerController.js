import Competitor from '../models/Competitor.js';
import Listing from '../models/Listing.js';
import OpenAIService from '../services/openaiService.js';
import logger from '../utils/logger.js';

/**
 * Price Optimizer Controller
 * Handles price optimization recommendations
 */

class OptimizerController {
  /**
   * Get price recommendation for a listing
   * POST /api/optimize/price
   */
  static async getPriceRecommendation(req, res, next) {
    try {
      const userId = req.user.id;
      const { listingId } = req.body;

      if (!listingId) {
        return res.status(400).json({
          success: false,
          error: 'ID объявления обязателен',
        });
      }

      // Get listing
      const listing = await Listing.findById(listingId, userId);
      if (!listing) {
        return res.status(404).json({
          success: false,
          error: 'Объявление не найдено',
        });
      }

      // Get recent competitors
      const competitors = await Competitor.findRecentByListingId(listingId, 24);
      
      if (competitors.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Нет данных о конкурентах. Сначала запустите парсинг.',
        });
      }

      // Get competitor statistics
      const stats = await Competitor.getStatistics(listingId, 24);

      // Prepare data for AI
      const listingData = {
        title: listing.title,
        description: listing.description,
        currentPrice: listing.price,
        category: listing.category,
      };

      const competitorData = competitors.map(c => ({
        price: c.price,
        title: c.title,
      }));

      // Get AI recommendation
      const aiRecommendation = await OpenAIService.generatePriceRecommendation(
        listingData,
        competitorData
      );

      // Calculate pricing strategy
      let strategy = 'market';
      const avgPrice = stats.average;
      
      if (aiRecommendation.recommendedPrice < avgPrice * 0.9) {
        strategy = 'competitive';
      } else if (aiRecommendation.recommendedPrice > avgPrice * 1.1) {
        strategy = 'premium';
      }

      // Determine price comparison
      let priceComparison = 'at_average';
      if (listing.price < avgPrice * 0.95) {
        priceComparison = 'below_average';
      } else if (listing.price > avgPrice * 1.05) {
        priceComparison = 'above_average';
      }

      res.json({
        success: true,
        data: {
          currentPrice: listing.price,
          recommendedPrice: aiRecommendation.recommendedPrice,
          reasoning: aiRecommendation.reasoning,
          confidence: aiRecommendation.confidence,
          strategy,
          priceComparison,
          marketData: {
            average: Math.round(stats.average),
            median: Math.round(stats.median),
            min: Math.round(stats.min),
            max: Math.round(stats.max),
            competitorCount: stats.count,
            stdDev: Math.round(stats.stdDev),
          },
          potentialSavings: Math.round(listing.price - aiRecommendation.recommendedPrice),
          percentageChange: ((aiRecommendation.recommendedPrice - listing.price) / listing.price * 100).toFixed(1),
        },
      });
    } catch (error) {
      logger.error('Error getting price recommendation:', error);
      next(error);
    }
  }

  /**
   * Get price distribution (for charts)
   * GET /api/optimize/price-distribution/:listingId
   */
  static async getPriceDistribution(req, res, next) {
    try {
      const userId = req.user.id;
      const { listingId } = req.params;

      // Verify ownership
      const listing = await Listing.findById(listingId, userId);
      if (!listing) {
        return res.status(404).json({
          success: false,
          error: 'Объявление не найдено',
        });
      }

      const distribution = await Competitor.getPriceDistribution(listingId, 10);

      res.json({
        success: true,
        data: {
          distribution,
          currentPrice: listing.price,
        },
      });
    } catch (error) {
      logger.error('Error getting price distribution:', error);
      next(error);
    }
  }

  /**
   * Get price trends
   * GET /api/optimize/price-trends/:listingId
   */
  static async getPriceTrends(req, res, next) {
    try {
      const userId = req.user.id;
      const { listingId } = req.params;
      const { days = 7 } = req.query;

      // Verify ownership
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
          currentPrice: listing.price,
        },
      });
    } catch (error) {
      logger.error('Error getting price trends:', error);
      next(error);
    }
  }

  /**
   * Calculate optimal price range
   * GET /api/optimize/price-range/:listingId
   */
  static async getPriceRange(req, res, next) {
    try {
      const userId = req.user.id;
      const { listingId } = req.params;

      // Verify ownership
      const listing = await Listing.findById(listingId, userId);
      if (!listing) {
        return res.status(404).json({
          success: false,
          error: 'Объявление не найдено',
        });
      }

      const stats = await Competitor.getStatistics(listingId, 24);

      if (stats.count === 0) {
        return res.status(400).json({
          success: false,
          error: 'Нет данных о конкурентах',
        });
      }

      // Calculate recommended range based on statistics
      const avgPrice = stats.average;
      const stdDev = stats.stdDev;

      const optimalRange = {
        min: Math.round(avgPrice - stdDev),
        max: Math.round(avgPrice + stdDev),
        recommended: Math.round(avgPrice * 0.95), // 5% below average
        competitive: Math.round(avgPrice * 0.90), // 10% below average
        premium: Math.round(avgPrice * 1.10), // 10% above average
      };

      res.json({
        success: true,
        data: {
          currentPrice: listing.price,
          priceRange: optimalRange,
          marketAverage: Math.round(avgPrice),
          isWithinRange: listing.price >= optimalRange.min && listing.price <= optimalRange.max,
        },
      });
    } catch (error) {
      logger.error('Error calculating price range:', error);
      next(error);
    }
  }
}

export default OptimizerController;
