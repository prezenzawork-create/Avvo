import logger from '../utils/logger.js';

/**
 * Price Optimizer Service
 * Business logic for price optimization recommendations
 */

class PriceOptimizerService {
  /**
   * Calculate optimal price based on competitor data and user preferences
   * @param {object} listing - Listing object
   * @param {array} competitors - Array of competitor objects
   * @param {object} userPreferences - User pricing preferences
   * @returns {object} Price recommendation with strategy
   */
  static calculateOptimalPrice(listing, competitors, userPreferences = {}) {
    try {
      if (!competitors || competitors.length === 0) {
        throw new Error('Нет данных о конкурентах');
      }

      // Calculate competitor statistics
      const stats = this.calculateCompetitorStats(competitors);
      
      // Determine pricing strategy based on user preference
      const strategy = userPreferences.pricingStrategy || 'market';
      
      // Calculate recommended price based on strategy
      let recommendedPrice;
      let reasoning = '';
      
      switch (strategy) {
        case 'competitive':
          // Below average by 5-10%
          recommendedPrice = Math.round(stats.average * 0.92);
          reasoning = 'Конкурентная цена для увеличения продаж';
          break;
          
        case 'premium':
          // Above average by 5-15%
          recommendedPrice = Math.round(stats.average * 1.12);
          reasoning = 'Премиум цена для увеличения прибыли';
          break;
          
        case 'market':
        default:
          // At average
          recommendedPrice = Math.round(stats.average);
          reasoning = 'Цена на уровне рынка для баланса продаж и прибыли';
          break;
      }
      
      // Ensure price is reasonable
      recommendedPrice = this.validatePriceRange(recommendedPrice, stats, listing.price);
      
      // Calculate confidence level
      const confidence = this.calculateConfidence(stats, competitors.length);
      
      logger.info('Price calculated:', {
        listingId: listing.id,
        recommendedPrice,
        strategy,
        confidence,
      });
      
      return {
        recommendedPrice,
        strategy,
        reasoning,
        confidence,
        marketData: {
          average: Math.round(stats.average),
          median: Math.round(stats.median),
          min: Math.round(stats.min),
          max: Math.round(stats.max),
          competitorCount: competitors.length,
          stdDev: Math.round(stats.stdDev),
        },
      };
    } catch (error) {
      logger.error('Error calculating optimal price:', error);
      throw new Error('Не удалось рассчитать оптимальную цену');
    }
  }

  /**
   * Calculate competitor statistics
   * @param {array} competitors - Array of competitor objects
   * @returns {object} Statistics { average, median, min, max, stdDev }
   */
  static calculateCompetitorStats(competitors) {
    const prices = competitors.map(c => c.price).filter(price => price > 0);
    
    if (prices.length === 0) {
      throw new Error('Нет корректных цен конкурентов');
    }
    
    // Calculate average
    const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    // Calculate median
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const median = sortedPrices[Math.floor(sortedPrices.length / 2)];
    
    // Calculate min and max
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    
    // Calculate standard deviation
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - average, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      average,
      median,
      min,
      max,
      stdDev,
    };
  }

  /**
   * Validate that recommended price is within reasonable range
   * @param {number} recommendedPrice - Recommended price
   * @param {object} stats - Competitor statistics
   * @param {number} currentPrice - Current listing price
   * @returns {number} Validated price
   */
  static validatePriceRange(recommendedPrice, stats, currentPrice) {
    // Don't allow price to be more than 50% different from current price
    const maxChange = currentPrice * 0.5;
    const minAllowed = currentPrice - maxChange;
    const maxAllowed = currentPrice + maxChange;
    
    // Also don't allow price to be outside competitor range plus 20%
    const competitorMin = stats.min * 0.8;
    const competitorMax = stats.max * 1.2;
    
    // Combine both constraints
    const finalMin = Math.max(minAllowed, competitorMin);
    const finalMax = Math.min(maxAllowed, competitorMax);
    
    // Clamp recommended price to valid range
    return Math.max(finalMin, Math.min(finalMax, recommendedPrice));
  }

  /**
   * Calculate confidence level based on data quality
   * @param {object} stats - Competitor statistics
   * @param {number} competitorCount - Number of competitors
   * @returns {string} Confidence level ('high', 'medium', 'low')
   */
  static calculateConfidence(stats, competitorCount) {
    // High confidence: 10+ competitors, low standard deviation
    if (competitorCount >= 10 && stats.stdDev / stats.average < 0.3) {
      return 'high';
    }
    
    // Medium confidence: 5+ competitors, moderate standard deviation
    if (competitorCount >= 5 && stats.stdDev / stats.average < 0.5) {
      return 'medium';
    }
    
    // Low confidence: Few competitors or high variance
    return 'low';
  }

  /**
   * Compare current price with market average
   * @param {number} currentPrice - Current listing price
   * @param {number} marketAverage - Market average price
   * @returns {object} Price comparison result
   */
  static compareWithMarket(currentPrice, marketAverage) {
    const difference = currentPrice - marketAverage;
    const percentage = (difference / marketAverage) * 100;
    
    let comparison = 'at_average';
    let label = 'На уровне среднего';
    let color = 'yellow';
    
    if (percentage < -5) {
      comparison = 'below_average';
      label = 'Ниже среднего';
      color = 'green';
    } else if (percentage > 5) {
      comparison = 'above_average';
      label = 'Выше среднего';
      color = 'red';
    }
    
    return {
      comparison,
      label,
      color,
      difference: Math.round(difference),
      percentage: Math.round(percentage),
    };
  }

  /**
   * Generate price adjustment recommendation
   * @param {number} currentPrice - Current price
   * @param {number} recommendedPrice - Recommended price
   * @returns {object} Adjustment recommendation
   */
  static generateAdjustmentRecommendation(currentPrice, recommendedPrice) {
    const difference = recommendedPrice - currentPrice;
    const percentage = (difference / currentPrice) * 100;
    
    if (Math.abs(percentage) < 1) {
      return {
        action: 'hold',
        message: 'Цена оптимальна, изменение не требуется',
        difference: 0,
        percentage: 0,
      };
    }
    
    if (percentage > 0) {
      return {
        action: 'increase',
        message: `Увеличить цену на ${Math.abs(Math.round(difference))} ₽ (${Math.abs(Math.round(percentage))}%)`,
        difference: Math.round(difference),
        percentage: Math.round(percentage),
      };
    }
    
    return {
      action: 'decrease',
      message: `Снизить цену на ${Math.abs(Math.round(difference))} ₽ (${Math.abs(Math.round(percentage))}%)`,
      difference: Math.round(difference),
      percentage: Math.round(percentage),
    };
  }
}

export default PriceOptimizerService;
