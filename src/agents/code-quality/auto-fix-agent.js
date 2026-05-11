const { BaseAgent } = require('../../core/base-agent');
const { LLMBridge } = require('../../utils/llm-bridge');

const SYSTEM_PROMPT = `你是一位自动修复专家。你的职责是：
1. 根据其他 Agent 发现的问题，自动生成修复代码
2. 修复后的代码必须保持原有功能不变
3. 每次修复只解决一个问题，避免引入新 bug
4. 输出 unified diff 格式的修复补丁

输出格式（JSON）：
{
  "fixes": [
    {
      "file": "文件路径",
      "issue": "修复的问题",
      "patch": "unified diff 格式的补丁",
      "confidence": "high|medium|low"
    }
  ],
  "summary": "修复摘要"
}`;

class AutoFixAgent extends BaseAgent {
  constructor() {
    super('AutoFixAgent', '自动修复代码问题');
  }

  async run(input, context) {
    this.setStatus('running');

    const { diff, files } = input;
    const reviewResult = context.get('reviewResult') || {};
    const securityResult = context.get('securityResult') || {};
    const architectureResult = context.get('architectureResult') || {};

    const allFindings = [
      ...(reviewResult.findings || []),
      ...(securityResult.vulnerabilities || []),
      ...(architectureResult.architectureFindings || []),
    ].filter((f) => f.severity === 'critical' || f.severity === 'major' || f.severity === 'high');

    if (allFindings.length === 0) {
      this.setStatus('completed');
      return { fixes: [], summary: '无需自动修复' };
    }

    const { content, usage } = await LLMBridge.chat(
      SYSTEM_PROMPT,
      `请为以下问题生成自动修复补丁：

原始 Diff：
\`\`\`diff
${diff}
\`\`\`

需要修复的问题：
${allFindings.map((f, i) => `${i + 1}. [${f.severity}] ${f.message || f.description} (${f.file || f.type})`).join('\n')}

要求：生成 unified diff 格式的修复补丁。`,
    );

    this.addTokenUsage(usage);

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      result = { fixes: [], summary: content };
    }

    context.set('autoFixResult', result);
    this.setStatus('completed');
    return result;
  }
}

module.exports = { AutoFixAgent };
