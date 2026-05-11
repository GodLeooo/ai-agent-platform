const { BaseAgent } = require('../../core/base-agent');
const { LLMBridge } = require('../../utils/llm-bridge');

const SYSTEM_PROMPT = `你是一位报告生成专家。你的职责是：
1. 聚合多个 Agent 的分析结果
2. 按严重程度分级整理
3. 生成简洁清晰的 Review Summary
4. 输出 Markdown 格式，适合作为 MR 评论

输出格式：
直接输出 Markdown 格式的 Review Report，包含：
- 📊 总体评分（A/B/C/D/F）
- 🔴 Critical 问题列表
- 🟡 Major 问题列表
- 🟢 Minor/Info 建议
- ✅ 自动生成的测试覆盖情况
- 📝 总结与建议`;

class ReportAgent extends BaseAgent {
  constructor() {
    super('ReportAgent', '聚合生成 Review Report');
  }

  async run(input, context) {
    this.setStatus('running');

    const reviewResult = context.get('reviewResult') || {};
    const securityResult = context.get('securityResult') || {};
    const performanceResult = context.get('performanceResult') || {};
    const architectureResult = context.get('architectureResult') || {};
    const testResult = context.get('testResult') || {};

    const aggregatedData = JSON.stringify({
      review: reviewResult,
      security: securityResult,
      performance: performanceResult,
      architecture: architectureResult,
      test: testResult,
    }, null, 2);

    const { content, usage } = await LLMBridge.chat(
      SYSTEM_PROMPT,
      `请将以下多个 Agent 的分析结果聚合为一份 Review Report：

\`\`\`json
${aggregatedData}
\`\`\`

请生成 Markdown 格式的 Review Summary，按严重程度分级，并给出总体评分。`,
    );

    this.addTokenUsage(usage);

    const result = {
      report: content,
      severity: this._calcOverallSeverity(reviewResult, securityResult, performanceResult, architectureResult),
      agentCount: 5,
      generatedAt: new Date().toISOString(),
    };

    context.set('reportResult', result);
    this.setStatus('completed');
    return result;
  }

  _calcOverallSeverity(...results) {
    const severities = results.map((r) => r.severity || 'info');
    const order = ['critical', 'high', 'major', 'medium', 'minor', 'low', 'info'];
    let highest = 'info';
    for (const s of severities) {
      if (order.indexOf(s) < order.indexOf(highest)) {
        highest = s;
      }
    }
    return highest;
  }
}

module.exports = { ReportAgent };
