import api from './api';

/**
 * Listings API Service
 * Handles all listing-related API calls
 */

const listingsService = {
  /**
   * Get all listings
   * @param {object} params - Query parameters { status, search, sort, page, limit }
   * @returns {Promise}
   */
  getListings: (params = {}) => {
    return api.get('/listings', { params });
  },

  /**
   * Get single listing by ID
   * @param {string} id - Listing ID
   * @returns {Promise}
   */
  getListingById: (id) => {
    return api.get(`/listings/${id}`);
  },

  /**
   * Sync listings from Avito
   * @returns {Promise}
   */
  syncListings: () => {
    return api.post('/listings/sync');
  },

  /**
   * Update listing
   * @param {string} id - Listing ID
   * @param {object} data - Update data
   * @returns {Promise}
   */
  updateListing: (id, data) => {
    return api.patch(`/listings/${id}`, data);
  },

  /**
   * Update listing price
   * @param {string} id - Listing ID
   * @param {number} newPrice - New price
   * @returns {Promise}
   */
  updatePrice: (id, newPrice) => {
    return api.patch(`/listings/${id}/price`, { newPrice });
  },

  /**
   * Delete listing
   * @param {string} id - Listing ID
   * @returns {Promise}
   */
  deleteListing: (id) => {
    return api.delete(`/listings/${id}`);
  },

  /**
   * Get listing statistics
   * @param {string} id - Listing ID
   * @returns {Promise}
   */
  getListingStats: (id) => {
    return api.get(`/listings/${id}/stats`);
  },
};

export default listingsService;
