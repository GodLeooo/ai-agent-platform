const { BaseAgent } = require('../../core/base-agent');
const { LLMBridge } = require('../../utils/llm-bridge');

const SYSTEM_PROMPT = `你是一位系统架构师，专门负责长链推理分析。你的职责是：
1. 检查变更是否引入跨服务接口不一致
2. 分析变更对系统整体架构的影响
3. 结合 ADR（Architecture Decision Records）文档评估合规性
4. 识别潜在的循环依赖和耦合问题
5. 评估变更是否符合领域驱动设计原则

当发现架构问题时，你需要进行深度推理：
- 追溯历史设计决策的原因
- 分析变更对上下游服务的影响链
- 给出详细的重构建议，包含代码示例

输出格式（JSON）：
{
  "needsDeepAnalysis": true/false,
  "severity": "critical|major|minor|info",
  "architectureFindings": [
    {
      "type": "接口不一致|循环依赖|设计原则违反|...",
      "description": "问题描述",
      "reasoning": "长链推理过程（why this is a problem, what decisions led here）",
      "impact": "影响范围",
      "refactoring": "重构建议，含代码示例"
    }
  ],
  "summary": "架构评估摘要"
}`;

class ArchitectureAgent extends BaseAgent {
  constructor() {
    super('ArchitectureAgent', '长链推理架构分析');
  }

  async run(input, context) {
    this.setStatus('running');

    const { diff, files } = input;
    const reviewResult = context.get('reviewResult');
    const adrDocs = context.get('adrDocs') || '暂无 ADR 文档';

    const crossContext = reviewResult
      ? `\n\nReview Agent 已发现 ${reviewResult.findings?.length || 0} 个问题，请判断是否需要架构层面的深度分析。`
      : '';

    const { content, usage } = await LLMBridge.chat(
      SYSTEM_PROMPT,
      `请对以下变更进行架构级长链推理分析：

变更文件: ${files?.join(', ') || 'all'}

项目 ADR 文档摘要：
${adrDocs}

Diff:
\`\`\`diff
${diff}
\`\`\`${crossContext}

请重点分析：
1. 是否引入跨服务接口不一致？
2. 是否违反已有架构决策？
3. 变更的上下游影响链是什么？`,
    );

    this.addTokenUsage(usage);

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      result = { needsDeepAnalysis: false, severity: 'info', architectureFindings: [], summary: content };
    }

    if (result.needsDeepAnalysis) {
      console.log(`[${this.name}] ⚠️  触发长链推理：需要架构层面的深度分析`);
    }

    context.set('architectureResult', result);
    this.setStatus('completed');
    return result;
  }
}

module.exports = { ArchitectureAgent };
