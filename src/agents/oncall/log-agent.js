const { BaseAgent } = require('../../core/base-agent');
const { LLMBridge } = require('../../utils/llm-bridge');

const SYSTEM_PROMPT = `你是一位日志分析专家。你的职责是：
1. 从大量日志中识别异常模式和错误信号
2. 提取关键错误信息（异常类型、错误码、堆栈跟踪）
3. 标记日志中的时间序列异常（突增、突降）
4. 关联同一请求链路中的多条日志

输出格式（JSON）：
{
  "anomalies": [
    { "timestamp": "时间", "level": "ERROR|WARN|INFO", "service": "服务名", "message": "错误信息", "stackTrace": "堆栈（如有）" }
  ],
  "errorPatterns": ["识别到的错误模式"],
  "timeRange": { "start": "开始时间", "end": "结束时间", "peakErrorRate": "峰值错误率" },
  "summary": "日志分析摘要"
}`;

class LogAgent extends BaseAgent {
  constructor() {
    super('LogAgent', '日志分析与异常识别');
  }

  async run(input, context) {
    this.setStatus('running');

    const { logs, timeWindowMinutes = 30 } = input;

    const { content, usage } = await LLMBridge.chat(
      SYSTEM_PROMPT,
      `请分析以下 ${timeWindowMinutes} 分钟窗口的日志数据：

\`\`\`
${logs}
\`\`\`

要求：
1. 识别所有 ERROR 和 WARN 级别的日志
2. 发现错误的时间序列模式
3. 提取关键异常堆栈`,
    );

    this.addTokenUsage(usage);

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      result = { anomalies: [], errorPatterns: [], summary: content };
    }

    context.set('logResult', result);
    this.setStatus('completed');
    return result;
  }
}

module.exports = { LogAgent };
