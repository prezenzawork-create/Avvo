import api from './api';

/**
 * Competitors API Service
 * Handles competitor-related API calls
 */

const competitorsService = {
  /**
   * Get competitors for a listing
   * @param {string} listingId - Listing ID
   * @returns {Promise}
   */
  getCompetitors: (listingId) => {
    return api.get(`/competitors?listing_id=${listingId}`);
  },

  /**
   * Parse competitors for a listing
   * @param {string} listingId - Listing ID
   * @returns {Promise}
   */
  parseCompetitors: (listingId) => {
    return api.post('/competitors/parse', { listingId });
  },

  /**
   * Get competitor statistics
   * @param {string} listingId - Listing ID
   * @returns {Promise}
   */
  getCompetitorStats: (listingId) => {
    return api.get(`/competitors/stats?listing_id=${listingId}`);
  },
};

export default competitorsService;
