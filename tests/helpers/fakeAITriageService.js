const IAITriageService = require('../../src/interfaces/services/IAITriageService');
const { TicketCategory, TicketPriority } = require('../../src/entities/enums');

class FakeAITriageService extends IAITriageService {
  constructor(options = {}) {
    super();
    this.mode = options.mode || 'success'; // success | error
    this.result =
      options.result ||
      {
        category: TicketCategory.TECHNICAL_BUG,
        priority: TicketPriority.MEDIUM,
      };
    this.error = options.error || new Error('AI triage failure');
    this.calls = [];
  }

  setSuccess(result) {
    this.mode = 'success';
    this.result = result;
  }

  setError(error = new Error('AI triage failure')) {
    this.mode = 'error';
    this.error = error;
  }

  async classifyTicket(title, description) {
    this.calls.push({ title, description, at: new Date() });

    if (this.mode === 'error') {
      throw this.error;
    }

    return { ...this.result };
  }

  getCallCount() {
    return this.calls.length;
  }

  clearCalls() {
    this.calls = [];
  }
}

module.exports = FakeAITriageService;
