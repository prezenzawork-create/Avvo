import api from './api';

/**
 * Analytics API Service
 * Handles analytics-related API calls
 */

const analyticsService = {
  /**
   * Get dashboard statistics
   * @returns {Promise}
   */
  getDashboardStats: () => {
    return api.get('/dashboard/stats');
  },

  /**
   * Get listing analytics
   * @param {object} params - Query parameters { dateFrom, dateTo, listingId }
   * @returns {Promise}
   */
  getListingAnalytics: (params = {}) => {
    return api.get('/analytics/listings', { params });
  },

  /**
   * Get competitor analytics
   * @param {object} params - Query parameters { listingId, dateFrom, dateTo }
   * @returns {Promise}
   */
  getCompetitorAnalytics: (params = {}) => {
    return api.get('/analytics/competitors', { params });
  },

  /**
   * Get price trends
   * @param {string} listingId - Listing ID
   * @param {number} days - Number of days
   * @returns {Promise}
   */
  getPriceTrends: (listingId, days = 7) => {
    return api.get(`/optimize/price-trends/${listingId}?days=${days}`);
  },

  /**
   * Get price distribution
   * @param {string} listingId - Listing ID
   * @returns {Promise}
   */
  getPriceDistribution: (listingId) => {
    return api.get(`/optimize/price-distribution/${listingId}`);
  },

  /**
   * Get price recommendation
   * @param {string} listingId - Listing ID
   * @returns {Promise}
   */
  getPriceRecommendation: (listingId) => {
    return api.post('/optimize/price', { listingId });
  },

  /**
   * Get price range
   * @param {string} listingId - Listing ID
   * @returns {Promise}
   */
  getPriceRange: (listingId) => {
    return api.get(`/optimize/price-range/${listingId}`);
  },
};

export default analyticsService;
