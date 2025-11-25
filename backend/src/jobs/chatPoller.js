import cron from 'node-cron';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Subscription from '../models/Subscription.js';
import OpenAIService from '../services/openaiService.js';
import avitoApiService from '../services/avitoApiService.js';
import logger from '../utils/logger.js';

/**
 * Chat Poller Job
 * Check for new messages and trigger AI responses
 */

class ChatPollerJob {
  static start() {
    // Run every 2 minutes
    cron.schedule('*/2 * * * *', async () => {
      logger.info('Starting chat poller job');
      
      try {
        // Get users with Avito token and AI agent enabled
        const usersWithTokens = await User.findWithAvitoToken();
        
        let processedCount = 0;
        let aiReplyCount = 0;
        let errorCount = 0;
        
        for (const user of usersWithTokens) {
          try {
            // Check user's subscription for AI quota
            const subscription = await Subscription.findByUserId(user.id);
            if (!subscription) continue;
            
            const quota = await Subscription.checkAiQuota(user.id);
            if (!quota.hasQuota) continue;
            
            // Fetch new messages from Avito API
            const newMessages = await avitoApiService.fetchChatMessages(
              user.avitoTokenEncrypted,
              null // All chats
            );
            
            // Process each new message
            for (const message of newMessages) {
              // Check if message is from buyer and unread
              if (message.sender_type === 'buyer' && !message.is_read) {
                // Check if chat has AI enabled
                const chat = await Chat.findByAvitoChatId(message.chat_id);
                if (chat && chat.aiEnabled) {
                  // Get listing context
                  const listing = await Chat.getListingForChat(chat.id);
                  
                  if (listing) {
                    // Generate AI reply
                    const aiResponse = await OpenAIService.generateChatResponse(
                      [], // Would normally include conversation history
                      {
                        title: listing.title,
                        price: listing.price,
                        description: listing.description,
                      },
                      message.text
                    );
                    
                    // Send via Avito API
                    await avitoApiService.sendChatMessage(
                      user.avitoTokenEncrypted,
                      message.chat_id,
                      aiResponse
                    );
                    
                    // Log message and increment usage
                    await Chat.createMessage({
                      userId: user.id,
                      listingId: listing.id,
                      avitoChatId: message.chat_id,
                      buyerId: message.buyer_id,
                      senderType: 'ai_agent',
                      message: aiResponse,
                      sentAt: new Date(),
                    });
                    
                    await Subscription.incrementAiMessagesUsed(user.id);
                    aiReplyCount++;
                  }
                }
              }
            }
            
            processedCount++;
          } catch (error) {
            errorCount++;
            logger.error(`Error processing user ${user.id}:`, error);
          }
        }
        
        logger.info('Chat poller job completed', {
          processed: processedCount,
          aiReplies: aiReplyCount,
          errors: errorCount,
        });
      } catch (error) {
        logger.error('Error in chat poller job:', error);
      }
    });
    
    logger.info('Chat poller job scheduled (every 2 minutes)');
  }
}

export default ChatPollerJob;
