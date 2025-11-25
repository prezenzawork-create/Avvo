import axios from 'axios';
import logger from '../utils/logger.js';

/**
 * OpenAI Service
 * Handles all interactions with OpenAI API for price optimization and chat responses
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

class OpenAIService {
  /**
   * Generate price recommendation using AI
   * @param {object} listingData - Listing information
   * @param {array} competitorData - Array of competitor prices
   * @returns {Promise<object>} { recommendedPrice, reasoning, confidence }
   */
  static async generatePriceRecommendation(listingData, competitorData) {
    try {
      const { title, description, currentPrice, category } = listingData;

      // Calculate basic statistics
      const prices = competitorData.map((c) => c.price);
      const avgPrice = prices.length > 0
        ? prices.reduce((a, b) => a + b, 0) / prices.length
        : currentPrice;
      const minPrice = prices.length > 0 ? Math.min(...prices) : currentPrice;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : currentPrice;

      // Prepare prompt in Russian
      const systemPrompt = `Системная роль: Эксперт по ценообразованию на маркетплейсах.

Ты помогаешь продавцам на Avito оптимизировать цены на их товары для максимизации продаж и прибыли.
Анализируй цены конкурентов, рыночные тренды и характеристики товара.
Отвечай на русском языке.`;

      const userPrompt = `Контекст:
- Товар: "${title}"
- Категория: ${category || 'не указана'}
- Описание: ${description ? description.substring(0, 200) : 'не указано'}
- Текущая цена: ${currentPrice} ₽
- Количество конкурентов: ${prices.length}
- Средняя цена конкурентов: ${Math.round(avgPrice)} ₽
- Минимальная цена: ${minPrice} ₽
- Максимальная цена: ${maxPrice} ₽
- Цены конкурентов: ${prices.slice(0, 10).join(', ')} ₽

Задача: Порекомендуйте оптимальную цену для максимизации продаж и прибыли.

Верни ответ СТРОГО в формате JSON:
{
  "recommendedPrice": number (число),
  "reasoning": "string (объяснение рекомендации на русском)",
  "confidence": "high" | "medium" | "low"
}`;

      const response = await axios.post(
        OPENAI_API_URL,
        {
          model: OPENAI_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 500,
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const content = response.data.choices[0].message.content;
      const result = JSON.parse(content);

      logger.info('Price recommendation generated:', {
        listing: title,
        recommended: result.recommendedPrice,
      });

      return {
        recommendedPrice: result.recommendedPrice,
        reasoning: result.reasoning,
        confidence: result.confidence || 'medium',
      };
    } catch (error) {
      logger.error('Error generating price recommendation:', error.message);

      // Fallback to simple average-based recommendation
      if (competitorData.length > 0) {
        const prices = competitorData.map((c) => c.price);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const recommendedPrice = Math.round(avgPrice * 0.95); // 5% below average

        return {
          recommendedPrice,
          reasoning: 'Рекомендация основана на среднем значении цен конкурентов (AI недоступен)',
          confidence: 'low',
        };
      }

      throw new Error('Не удалось сгенерировать рекомендацию по цене');
    }
  }

  /**
   * Generate chat response using AI
   * @param {array} conversationHistory - Array of previous messages
   * @param {object} listingContext - Listing information
   * @param {string} buyerMessage - Latest message from buyer
   * @returns {Promise<string>} AI-generated response in Russian
   */
  static async generateChatResponse(conversationHistory, listingContext, buyerMessage) {
    try {
      const { title, price, description } = listingContext;

      // Prepare conversation context
      const historyText = conversationHistory
        .slice(-5) // Last 5 messages
        .map((msg) => `${msg.sender_type === 'buyer' ? 'Покупатель' : 'Продавец'}: ${msg.message}`)
        .join('\n');

      const systemPrompt = `Системная роль: Вы — вежливый продавец на Avito. Отвечайте на вопросы покупателей по-русски.

Правила:
- Будьте вежливы и профессиональны
- Отвечайте кратко и по делу (максимум 150 слов)
- Не придумывайте информацию, которой нет
- Если не знаете ответ, предложите уточнить детали
- Используйте естественный разговорный русский язык`;

      const userPrompt = `Товар: "${title}"
Цена: ${price} ₽
Описание: ${description ? description.substring(0, 300) : 'не указано'}

${historyText ? `История переписки:\n${historyText}\n` : ''}
Новое сообщение от покупателя: ${buyerMessage}

Напишите краткий, вежливый ответ (максимум 150 слов).`;

      const response = await axios.post(
        OPENAI_API_URL,
        {
          model: OPENAI_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 150,
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const reply = response.data.choices[0].message.content.trim();

      logger.info('Chat response generated:', {
        listing: title,
        buyerMessage: buyerMessage.substring(0, 50),
      });

      return reply;
    } catch (error) {
      logger.error('Error generating chat response:', error.message);

      // Fallback to default response
      return 'Здравствуйте! Спасибо за интерес к моему объявлению. К сожалению, AI-помощник временно недоступен. Я отвечу вам в ближайшее время.';
    }
  }

  /**
   * Test OpenAI API connection
   * @returns {Promise<boolean>} True if connection successful
   */
  static async testConnection() {
    try {
      const response = await axios.post(
        OPENAI_API_URL,
        {
          model: OPENAI_MODEL,
          messages: [
            { role: 'user', content: 'Тест соединения. Ответь "OK".' },
          ],
          max_tokens: 10,
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      return response.status === 200;
    } catch (error) {
      logger.error('OpenAI connection test failed:', error.message);
      return false;
    }
  }

  /**
   * Get estimated token count (simple approximation)
   * @param {string} text - Text to estimate
   * @returns {number} Estimated token count
   */
  static estimateTokenCount(text) {
    // Rough approximation: 1 token ≈ 4 characters for Russian
    return Math.ceil(text.length / 4);
  }
}

export default OpenAIService;
