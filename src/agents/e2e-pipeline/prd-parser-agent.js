const { BaseAgent } = require('../../core/base-agent');
const { LLMBridge } = require('../../utils/llm-bridge');

const SYSTEM_PROMPT = `你是一位产品需求分析专家。你的职责是：
1. 解析 PRD（产品需求文档）中的功能需求
2. 提取用户故事和验收标准
3. 识别技术约束和依赖关系
4. 将自然语言需求转换为结构化技术需求

输出格式（JSON）：
{
  "features": [
    {
      "id": "功能ID",
      "title": "功能名称",
      "userStory": "用户故事",
      "acceptanceCriteria": ["验收标准列表"],
      "techConstraints": ["技术约束"],
      "dependencies": ["依赖的其他功能/服务"]
    }
  ],
  "epic": "史诗级描述",
  "estimation": { "level": "低/中/高", "storyPoints": "估算故事点" },
  "summary": "需求解析摘要"
}`;

class PRDParserAgent extends BaseAgent {
  constructor() {
    super('PRDParserAgent', 'PRD 需求解析');
  }

  async run(input, context) {
    this.setStatus('running');

    const { prdContent } = input;

    const { content, usage } = await LLMBridge.chat(
      SYSTEM_PROMPT,
      `请解析以下 PRD 文档：

\`\`\`
${prdContent}
\`\`\`

要求：
1. 提取所有功能需求
2. 为每个功能编写用户故事
3. 列出验收标准和技术约束`,
    );

    this.addTokenUsage(usage);

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      result = { features: [], summary: content };
    }

    context.set('prdResult', result);
    this.setStatus('completed');
    return result;
  }
}

module.exports = { PRDParserAgent };
