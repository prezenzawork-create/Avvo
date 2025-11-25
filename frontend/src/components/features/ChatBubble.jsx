import React from 'react';

/**
 * Chat Bubble Component
 * Display chat messages with different styling for sender types
 */

const ChatBubble = ({ 
  message, 
  senderType, 
  timestamp, 
  className = '' 
}) => {
  const isBuyer = senderType === 'buyer';
  const isSeller = senderType === 'seller';
  const isAiAgent = senderType === 'ai_agent';
  
  const bubbleClasses = `rounded-lg px-4 py-2 max-w-xs md:max-w-md lg:max-w-lg ${
    isBuyer 
      ? 'bg-gray-100 text-gray-800 rounded-tl-none' 
      : isAiAgent
        ? 'bg-green-500 text-white rounded-tr-none'
        : 'bg-blue-500 text-white rounded-tr-none'
  }`;
  
  const containerClasses = `flex ${isBuyer ? 'justify-start' : 'justify-end'} mb-4 ${className}`;
  
  return (
    <div className={containerClasses}>
      <div className={bubbleClasses}>
        {isAiAgent && (
          <div className="flex items-center mb-1">
            <span className="text-xs font-semibold bg-green-600 px-2 py-1 rounded">
              AI
            </span>
          </div>
        )}
        <p className="text-sm">{message}</p>
        <p className={`text-xs mt-1 ${isBuyer ? 'text-gray-500' : 'text-blue-100'}`}>
          {timestamp}
        </p>
      </div>
    </div>
  );
};

export default ChatBubble;
