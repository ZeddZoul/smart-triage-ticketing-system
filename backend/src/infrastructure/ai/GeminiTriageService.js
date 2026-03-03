const { GoogleGenAI } = require('@google/genai');
const IAITriageService = require('../../interfaces/services/IAITriageService');
const RetryHandler = require('./RetryHandler');
const { ExternalServiceError, ValidationError } = require('../../entities/errors');

class GeminiTriageService extends IAITriageService {
  constructor(config) {
    super();
    this.model = config.geminiModel || 'gemini-2.0-flash';
    this.retryHandler = new RetryHandler({ maxRetries: config.maxTriageRetries || 3 });
    this.client = new GoogleGenAI({ apiKey: config.geminiApiKey });
  }

  async classifyTicket(title, description) {
    if (!title || !description) {
      throw new ValidationError('title and description are required for triage');
    }

    try {
      return await this.retryHandler.execute(async () => {
        const prompt = [
          'You classify support tickets into a category and priority.',
          'Respond ONLY as strict JSON with keys: category, priority.',
          'Category: infer the most appropriate category. Common examples: Billing, Technical Bug, Feature Request, Account Access, General Inquiry — but use whatever fits best.',
          'Priority: infer the urgency. Common levels: Critical, High, Medium, Low — but use whatever fits best.',
          `Title: ${title}`,
          `Description: ${description}`,
        ].join('\n');

        const response = await this.client.models.generateContent({
          model: this.model,
          contents: prompt,
        });

        const text = response?.text?.trim?.() || '';
        const cleaned = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
        const parsed = JSON.parse(cleaned);

        if (!parsed?.category || !parsed?.priority) {
          throw new Error('Invalid AI response shape');
        }

        return {
          category: parsed.category,
          priority: parsed.priority,
        };
      });
    } catch (error) {
      throw new ExternalServiceError('Gemini triage failed', {
        message: error.message,
      });
    }
  }
}

module.exports = GeminiTriageService;
