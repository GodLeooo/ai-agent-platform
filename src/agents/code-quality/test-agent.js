const { BaseAgent } = require('../../core/base-agent');
const { LLMBridge } = require('../../utils/llm-bridge');

const SYSTEM_PROMPT = `你是一位测试工程专家。你的职责是：
1. 根据代码变更自动生成测试用例
2. 覆盖 happy path、edge case 和异常路径
3. 生成的测试应可直接运行（使用 Jest 风格）
4. 确保测试覆盖关键业务逻辑和边界条件

输出格式（JSON）：
{
  "testFiles": [
    {
      "path": "测试文件路径",
      "content": "完整的测试代码",
      "covers": ["描述覆盖的场景"]
    }
  ],
  "estimatedCoverage": "预估覆盖率百分比",
  "summary": "测试生成摘要"
}`;

class TestAgent extends BaseAgent {
  constructor() {
    super('TestAgent', '自动生成测试用例');
  }

  async run(input, context) {
    this.setStatus('running');

    const { diff, files } = input;
    const reviewResult = context.get('reviewResult');
    const securityResult = context.get('securityResult');

    const knownIssues = [];
    if (reviewResult?.findings?.length) {
      knownIssues.push(...reviewResult.findings.map((f) => f.message));
    }
    if (securityResult?.vulnerabilities?.length) {
      knownIssues.push(...securityResult.vulnerabilities.map((v) => v.description));
    }

    const issuesContext = knownIssues.length > 0
      ? `\n\n已知问题（请确保测试覆盖这些场景）：\n${knownIssues.map((i) => `- ${i}`).join('\n')}`
      : '';

    const { content, usage } = await LLMBridge.chat(
      SYSTEM_PROMPT,
      `请为以下代码变更生成完整的测试用例：

变更文件: ${files?.join(', ') || 'all'}

Diff:
\`\`\`diff
${diff}
\`\`\`${issuesContext}

要求：
1. 覆盖 happy path、edge case、异常路径
2. 使用 Jest 测试框架
3. Mock 外部依赖
4. 每个测试用例有清晰的描述`,
    );

    this.addTokenUsage(usage);

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      result = { testFiles: [], estimatedCoverage: '0%', summary: content };
    }

    context.set('testResult', result);
    this.setStatus('completed');
    return result;
  }
}

module.exports = { TestAgent };
