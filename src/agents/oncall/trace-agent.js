const { BaseAgent } = require('../../core/base-agent');
const { LLMBridge } = require('../../utils/llm-bridge');

const SYSTEM_PROMPT = `你是一位分布式链路追踪专家。你的职责是：
1. 分析分布式调用链（trace）中的瓶颈和异常
2. 识别超时、重试、熔断触发等异常调用
3. 计算每跳延迟，标记异常跳转
4. 构建完整的调用拓扑图

输出格式（JSON）：
{
  "topology": {
    "nodes": [{"service": "服务名", "status": "healthy|degraded|down"}],
    "edges": [{"from": "源服务", "to": "目标服务", "latencyMs": 延迟, "status": "ok|slow|error"}]
  },
  "bottlenecks": [
    {"service": "服务名", "type": "超时|高延迟|错误率", "detail": "详情"}
  ],
  "criticalPath": "关键路径描述",
  "summary": "链路追踪摘要"
}`;

class TraceAgent extends BaseAgent {
  constructor() {
    super('TraceAgent', '全链路调用追踪');
  }

  async run(input, context) {
    this.setStatus('running');

    const { traces } = input;
    const logResult = context.get('logResult');

    const logContext = logResult?.anomalies?.length
      ? `\n\n日志分析已发现异常：\n${logResult.anomalies.map((a) => `- [${a.level}] ${a.service}: ${a.message}`).join('\n')}`
      : '';

    const { content, usage } = await LLMBridge.chat(
      SYSTEM_PROMPT,
      `请分析以下分布式调用链路数据：

\`\`\`json
${JSON.stringify(traces, null, 2)}
\`\`\`${logContext}

要求：
1. 构建完整调用拓扑
2. 标记每跳延迟和状态
3. 识别瓶颈节点`,
    );

    this.addTokenUsage(usage);

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      result = { topology: { nodes: [], edges: [] }, bottlenecks: [], summary: content };
    }

    context.set('traceResult', result);
    this.setStatus('completed');
    return result;
  }
}

module.exports = { TraceAgent };
