const { logger } = require('../utils/logger');

class AgentContext {
  constructor(data = {}) {
    this.data = new Map(Object.entries(data));
    this.history = [];
  }

  set(key, value) {
    this.data.set(key, value);
    this.history.push({ action: 'set', key, timestamp: Date.now() });
  }

  get(key) {
    return this.data.get(key);
  }

  has(key) {
    return this.data.has(key);
  }

  merge(other) {
    if (other instanceof AgentContext) {
      for (const [k, v] of other.data) {
        this.data.set(k, v);
      }
    }
  }

  toJSON() {
    return Object.fromEntries(this.data);
  }
}

class BaseAgent {
  constructor(name, description) {
    this.name = name;
    this.description = description;
    this.status = 'idle';
    this.lastRunAt = null;
    this.tokenUsage = { prompt: 0, completion: 0, total: 0 };
  }

  async run(input, context) {
    throw new Error(`Agent "${this.name}" must implement run()`);
  }

  setStatus(status) {
    this.status = status;
    console.log(`[${this.name}] status: ${status}`);
    logger.agent(this.name, status);
  }

  addTokenUsage(usage) {
    if (!usage) return;
    this.tokenUsage.prompt += usage.prompt_tokens || 0;
    this.tokenUsage.completion += usage.completion_tokens || 0;
    this.tokenUsage.total += usage.total_tokens || 0;
  }
}

module.exports = { BaseAgent, AgentContext };