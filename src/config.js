const LLM_CONFIG = {
  baseURL: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
  apiKey: process.env.LLM_API_KEY || '',
  model: process.env.LLM_MODEL || 'gpt-4o',
  maxTokens: 4096,
  temperature: 0.1,
};

const PIPELINE_CONFIG = {
  codeQuality: {
    maxAutoFixRounds: 2,
    parallelAgents: true,
    severityThreshold: 'medium',
  },
  oncall: {
    logWindowMinutes: 30,
    maxRootCauseDepth: 5,
    autoCreateHotfix: true,
  },
  e2e: {
    maxParallelCodingAgents: 4,
    reviewRequired: true,
    autoMerge: false,
  },
};

module.exports = { LLM_CONFIG, PIPELINE_CONFIG };
