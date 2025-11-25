import React from 'react';
import { formatPrice } from '../../utils/formatters';

/**
 * Listing Card Component
 * Display listing information with actions
 */

const ListingCard = ({ 
  listing, 
  onSync, 
  onOptimize, 
  onView, 
  className = '' 
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow ${className}`}>
      {listing.imageUrl && (
        <img 
          src={listing.imageUrl} 
          alt={listing.title} 
          className="w-full h-48 object-cover"
        />
      )}
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 truncate">
          {listing.title}
        </h3>
        
        <p className="text-gray-600 text-sm mt-1 truncate">
          {listing.description}
        </p>
        
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xl font-bold text-blue-600">
            {formatPrice(listing.price)}
          </span>
          <span className={`px-2 py-1 text-xs rounded-full ${
            listing.status === 'active' 
              ? 'bg-green-100 text-green-800' 
              : listing.status === 'archived'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-blue-100 text-blue-800'
          }`}>
            {listing.status === 'active' ? 'Активно' : 
             listing.status === 'archived' ? 'В архиве' : 'Продано'}
          </span>
        </div>
        
        <div className="mt-4 flex space-x-2">
          <button
            onClick={() => onView && onView(listing)}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-3 rounded-md transition-colors"
          >
            Просмотр
          </button>
          <button
            onClick={() => onOptimize && onOptimize(listing)}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm py-2 px-3 rounded-md transition-colors"
          >
            Оптимизировать
          </button>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
