const { AgentContext } = require('./base-agent');

class Orchestrator {
  constructor(name) {
    this.name = name;
    this.agents = [];
    this.totalTokenUsage = 0;
  }

  createContext(data = {}) {
    return new AgentContext(data);
  }

  async runAgent(agent, input, context) {
    const result = await agent.run(input, context);
    this.addTokenUsage(agent.tokenUsage.total || 0);
    return result;
  }

  addTokenUsage(tokens) {
    this.totalTokenUsage += tokens;
  }

  getTotalTokenUsage() {
    return this.totalTokenUsage;
  }

  reset() {
    this.agents = [];
    this.totalTokenUsage = 0;
  }
}

module.exports = { Orchestrator };