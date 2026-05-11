const { BaseAgent } = require('../../core/base-agent');
const { LLMBridge } = require('../../utils/llm-bridge');

const SYSTEM_PROMPT = `你是一位性能优化专家。你的职责是：
1. 识别潜在的性能瓶颈（N+1 查询、内存泄漏、无限循环风险）
2. 检查数据库查询效率（缺少索引、全表扫描）
3. 评估缓存策略是否合理
4. 分析算法复杂度是否可接受

输出格式（JSON）：
{
  "severity": "critical|major|minor|info",
  "performance": [
    { "file": "文件路径", "issue": "性能问题", "impact": "影响说明", "optimization": "优化建议" }
  ],
  "summary": "性能评估摘要"
}`;

class PerformanceAgent extends BaseAgent {
  constructor() {
    super('PerformanceAgent', '性能瓶颈检测');
  }

  async run(input, context) {
    this.setStatus('running');

    const { diff, files } = input;

    const { content, usage } = await LLMBridge.chat(
      SYSTEM_PROMPT,
      `请对以下代码变更进行性能分析：\n\n变更文件: ${files?.join(', ') || 'all'}\n\nDiff:\n\`\`\`diff\n${diff}\n\`\`\``,
    );

    this.addTokenUsage(usage);

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      result = { severity: 'info', performance: [], summary: content };
    }

    context.set('performanceResult', result);
    this.setStatus('completed');
    return result;
  }
}

module.exports = { PerformanceAgent };
