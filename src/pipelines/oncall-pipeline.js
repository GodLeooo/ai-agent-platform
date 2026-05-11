const { Orchestrator } = require('../core/orchestrator');
const { logger } = require('../utils/logger');
const { LogAgent } = require('../agents/oncall/log-agent');
const { TraceAgent } = require('../agents/oncall/trace-agent');
const { RootCauseAgent } = require('../agents/oncall/root-cause-agent');
const { PIPELINE_CONFIG } = require('../config');

class OnCallPipeline {
  constructor() {
    this.orchestrator = new Orchestrator('On-Call故障诊断');
  }

  async run(payload) {
    const { serviceName, timeRange, errorRateThreshold = 5 } = payload;
    const context = this.orchestrator.createContext({ serviceName, timeRange });
    const startTime = Date.now();

    console.log('\n' + '='.repeat(60));
    console.log('🔍 On-Call 故障诊断 Pipeline 启动');
    console.log('='.repeat(60));

    console.log(`服务: ${serviceName}`);
    console.log(`时间范围: ${timeRange.start} ~ ${timeRange.end}`);

    const input = { serviceName, timeRange, errorRateThreshold };

    logger.pipeline('On-Call故障诊断', '阶段一', '日志分析');
    console.log('\n📌 阶段一：日志分析');
    const logAgent = new LogAgent();
    const logResult = await this.orchestrator.runAgent(logAgent, input, context);

    logger.pipeline('On-Call故障诊断', '阶段二', '链路追踪');
    console.log('\n📌 阶段二：链路追踪');
    const traceAgent = new TraceAgent();
    const traceResult = await this.orchestrator.runAgent(traceAgent, input, context);

    logger.pipeline('On-Call故障诊断', '阶段三', '根因推断（长链推理）');
    console.log('\n📌 阶段三：根因推断（长链推理）');
    const rootCauseAgent = new RootCauseAgent();
    const rootCauseResult = await this.orchestrator.runAgent(rootCauseAgent, input, context);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Pipeline 完成 (${elapsed}s)`);
    console.log('='.repeat(60));

    return {
      logAnomalies: logResult?.anomalies?.length || 0,
      slowQueries: logResult?.slowQueries?.length || 0,
      errorRate: logResult?.errorRate || 0,
      callGraphNodes: traceResult?.nodes?.length || 0,
      callGraphEdges: traceResult?.edges?.length || 0,
      confidence: rootCauseResult?.confidence || 0,
      suggestions: rootCauseResult?.suggestions || [],
      totalTokenUsage: this.orchestrator.getTotalTokenUsage(),
    };
  }
}

module.exports = { OnCallPipeline };