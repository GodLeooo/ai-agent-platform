const { BaseAgent } = require('../../core/base-agent');
const { LLMBridge } = require('../../utils/llm-bridge');

const SYSTEM_PROMPT = `你是一位资深后端架构师。你的职责是：
1. 根据需求输出完整的技术方案设计
2. 包含架构图、技术选型、数据库设计
3. 提供 API 接口设计和调用流程
4. 考虑安全性和性能因素

输出格式（JSON）：
{
  "architecture": {
    "style": "架构风格",
    "diagram": "Mermaid 架构图代码",
    "components": ["组件列表"]
  },
  "techStack": {
    "language": "语言",
    "framework": "框架",
    "database": "数据库",
    "middleware": ["中间件"]
  },
  "apiDesign": [
    { "method": "GET/POST/PUT/DELETE", "path": "/api/xxx", "description": "描述", "request": "请求体", "response": "响应体" }
  ],
  "database": {
    "tables": [{"name": "表名", "columns": [{"name": "列名", "type": "类型", "nullable": false}]}],
    "indexes": ["索引定义"]
  },
  "security": ["安全考虑"],
  "summary": "技术方案摘要"
}`;

class TechDesignAgent extends BaseAgent {
  constructor() {
    super('TechDesignAgent', '技术方案生成');
  }

  async run(input, context) {
    this.setStatus('running');

    const prdResult = context.get('prdResult');

    const { content, usage } = await LLMBridge.chat(
      SYSTEM_PROMPT,
      `请根据以下需求输出完整的后端技术方案：

\`\`\`json
${JSON.stringify(prdResult, null, 2)}
\`\`\`

要求：
1. 输出架构风格和组件划分
2. 技术选型（语言、框架、数据库）
3. RESTful API 设计
4. 数据库表结构设计
5. 安全和性能考虑`,
    );

    this.addTokenUsage(usage);

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      result = { techStack: {}, apiDesign: [], database: {}, summary: content };
    }

    context.set('techDesignResult', result);
    this.setStatus('completed');
    return result;
  }
}

module.exports = { TechDesignAgent };
