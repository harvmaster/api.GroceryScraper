class RateLimiter {

  maxRequests: number
  interval: number
  tokens: number
  lastRefill: number
  refillRate: number

  constructor(maxRequests, interval) {
    this.maxRequests = maxRequests;
    this.interval = interval;
    this.tokens = maxRequests;
    this.lastRefill = Date.now();
    this.refillRate = maxRequests / (interval * 1000); // Tokens per millisecond
  }

  refillTokens() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = timePassed * this.refillRate;
    this.tokens = Math.min(this.maxRequests, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  tryConsume() {
    this.refillTokens();
    if (this.tokens >= 1) {
      this.tokens--;
      return true;
    }
    return false;
  }

  async consume() {
    return new Promise((resolve, reject) => {
      if (this.tryConsume()) {
        resolve(undefined);
      } else {
        const timeToWait = Math.ceil(this.tokens / this.refillRate);
        setTimeout(() => {
          this.consume().then(resolve).catch(reject);
        }, timeToWait);
      }
    });
  }
}

export default RateLimiter;