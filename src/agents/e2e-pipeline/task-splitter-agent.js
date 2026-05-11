const { BaseAgent } = require('../../core/base-agent');
const { LLMBridge } = require('../../utils/llm-bridge');

const SYSTEM_PROMPT = `你是一位资深技术项目经理。你的职责是：
1. 将技术方案拆分为可执行的开发任务
2. 估算每个任务的复杂度和工作量
3. 定义任务依赖关系和优先级
4. 输出结构化的任务列表

输出格式（JSON）：
{
  "tasks": [
    {
      "id": "任务ID",
      "title": "任务标题",
      "description": "任务详细描述",
      "type": "feature/bugfix/refactor/test",
      "priority": "high/medium/low",
      "estimate": { "hours": 预估工时, "complexity": "低/中/高" },
      "dependencies": ["依赖的任务ID列表"],
      "assigneeRole": "建议角色",
      "acceptanceCriteria": ["验收标准"]
    }
  ],
  "milestones": [{"name": "里程碑名称", "tasks": ["包含的任务ID"]}],
  "summary": "任务拆分摘要"
}`;

class TaskSplitterAgent extends BaseAgent {
  constructor() {
    super('TaskSplitterAgent', '任务拆分');
  }

  async run(input, context) {
    this.setStatus('running');

    const techDesignResult = context.get('techDesignResult');

    const { content, usage } = await LLMBridge.chat(
      SYSTEM_PROMPT,
      `请根据以下技术方案拆分为开发任务：

\`\`\`json
${JSON.stringify(techDesignResult, null, 2)}
\`\`\`

要求：
1. 拆分为细粒度的开发任务
2. 估算每个任务的工时（小时）和复杂度
3. 定义任务间的依赖关系
4. 分配优先级和建议角色`,
    );

    this.addTokenUsage(usage);

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      result = { tasks: [], milestones: [], summary: content };
    }

    context.set('taskSplitResult', result);
    this.setStatus('completed');
    return result;
  }
}

module.exports = { TaskSplitterAgent };