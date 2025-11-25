import axios from 'axios';
import logger from '../utils/logger.js';

/**
 * Competitor Parser Service
 * Parses Avito public search results to extract competitor pricing
 */

class CompetitorParserService {
  /**
   * Parse competitors for a listing
   * @param {object} listing - Listing object with title, category, etc.
   * @returns {Promise<array>} Array of competitor objects
   */
  static async parseCompetitors(listing) {
    try {
      // This is a simplified implementation
      // In a real implementation, this would parse actual Avito search results
      const competitors = [];
      
      // Simulate parsing competitors
      const competitorCount = Math.floor(Math.random() * 10) + 5; // 5-15 competitors
      
      for (let i = 0; i < competitorCount; i++) {
        const priceVariation = (Math.random() * 0.4) - 0.2; // -20% to +20%
        const competitorPrice = Math.round(listing.price * (1 + priceVariation));
        
        competitors.push({
          avitoCompetitorId: `competitor-${listing.id}-${i}`,
          title: `${listing.title} (Конкурент ${i + 1})`,
          price: competitorPrice,
          url: `https://www.avito.ru/competitor-${listing.id}-${i}`,
          similarityScore: Math.random(), // 0.0 - 1.0
        });
      }
      
      logger.info('Competitors parsed:', {
        listingId: listing.id,
        count: competitors.length,
      });
      
      return competitors;
    } catch (error) {
      logger.error('Error parsing competitors:', error);
      throw new Error('Не удалось получить данные о конкурентах');
    }
  }

  /**
   * Calculate similarity score between two listing titles
   * @param {string} title1 - First listing title
   * @param {string} title2 - Second listing title
   * @returns {number} Similarity score (0.0 - 1.0)
   */
  static calculateSimilarity(title1, title2) {
    // Simple word-based similarity calculation
    const words1 = title1.toLowerCase().split(/\s+/);
    const words2 = title2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = new Set([...words1, ...words2]).size;
    
    return totalWords > 0 ? commonWords.length / totalWords : 0;
  }

  /**
   * Filter competitors by similarity threshold
   * @param {array} competitors - Array of competitor objects
   * @param {string} listingTitle - Original listing title
   * @param {number} threshold - Minimum similarity score (0.0 - 1.0)
   * @returns {array} Filtered competitors
   */
  static filterBySimilarity(competitors, listingTitle, threshold = 0.3) {
    return competitors.filter(competitor => {
      const similarity = this.calculateSimilarity(listingTitle, competitor.title);
      competitor.similarityScore = similarity;
      return similarity >= threshold;
    });
  }

  /**
   * Validate competitor data
   * @param {object} competitor - Competitor object
   * @returns {boolean} True if valid
   */
  static validateCompetitor(competitor) {
    return (
      competitor.avitoCompetitorId &&
      competitor.title &&
      typeof competitor.price === 'number' &&
      competitor.price > 0 &&
      competitor.url
    );
  }

  /**
   * Normalize competitor data
   * @param {object} competitor - Raw competitor data
   * @returns {object} Normalized competitor data
   */
  static normalizeCompetitor(competitor) {
    return {
      avitoCompetitorId: String(competitor.avitoCompetitorId),
      title: String(competitor.title).trim(),
      price: Number(competitor.price),
      url: String(competitor.url),
      similarityScore: competitor.similarityScore ? Number(competitor.similarityScore) : null,
    };
  }
}

export default CompetitorParserService;
