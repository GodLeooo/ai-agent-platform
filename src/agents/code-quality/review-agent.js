const { BaseAgent } = require('../../core/base-agent');
const { LLMBridge } = require('../../utils/llm-bridge');

const SYSTEM_PROMPT = `你是一位资深代码审查专家。你的职责是：
1. 检查代码是否符合团队编码规范（命名、格式、注释）
2. 识别潜在的逻辑错误和边界条件遗漏
3. 评估代码可读性和可维护性
4. 检查是否有重复代码或可抽象的公共逻辑

输出格式（JSON）：
{
  "severity": "critical|major|minor|info",
  "findings": [
    { "file": "文件路径", "line": 行号, "rule": "规则名", "message": "问题描述", "suggestion": "修复建议" }
  ],
  "summary": "总体评价摘要"
}`;

class ReviewAgent extends BaseAgent {
  constructor() {
    super('ReviewAgent', '代码规范检查与逻辑审查');
  }

  async run(input, context) {
    this.setStatus('running');

    const { diff, files } = input;
    const fileList = files ? files.join(', ') : 'all changed files';

    const { content, usage } = await LLMBridge.chat(
      SYSTEM_PROMPT,
      `请审查以下代码变更：\n\n变更文件: ${fileList}\n\nDiff:\n\`\`\`diff\n${diff}\n\`\`\``,
    );

    this.addTokenUsage(usage);

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      result = { severity: 'info', findings: [], summary: content };
    }

    context.set('reviewResult', result);
    this.setStatus('completed');
    return result;
  }
}

module.exports = { ReviewAgent };
