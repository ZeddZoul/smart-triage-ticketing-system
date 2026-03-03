class RetryHandler {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries ?? 3;
    this.baseDelayMs = options.baseDelayMs ?? 1000;
  }

  async execute(fn) {
    let attempt = 0;
    let lastError;

    while (attempt < this.maxRetries) {
      try {
        return await fn(attempt + 1);
      } catch (error) {
        lastError = error;
        attempt += 1;
        if (attempt >= this.maxRetries) break;

        const delay = this.baseDelayMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}

module.exports = RetryHandler;
