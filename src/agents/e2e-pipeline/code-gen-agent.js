const { BaseAgent } = require('../../core/base-agent');
const { LLMBridge } = require('../../utils/llm-bridge');
const fs = require('fs');
const path = require('path');

const SYSTEM_PROMPT = `你是一位资深全栈开发者。你的职责是：
1. 根据任务描述生成高质量、可运行的代码
2. 遵循最佳实践和代码规范
3. 生成单元测试和API文档
4. 确保代码可维护性和扩展性

输出格式（JSON）：
{
  "files": [
    {
      "path": "文件路径",
      "content": "文件内容",
      "type": "controller/service/model/test/config"
    }
  ],
  "instructions": "运行说明",
  "summary": "代码生成摘要"
}`;

class CodeGenAgent extends BaseAgent {
  constructor() {
    super('CodeGenAgent', '代码生成');
  }

  async run(input, context) {
    this.setStatus('running');

    const { task } = input;
    const techDesignResult = context.get('techDesignResult');

    const { content, usage } = await LLMBridge.chat(
      SYSTEM_PROMPT,
      `请根据以下任务和技术方案生成代码：

技术方案：
\`\`\`json
${JSON.stringify(techDesignResult, null, 2)}
\`\`\`

任务详情：
\`\`\`json
${JSON.stringify(task, null, 2)}
\`\`\`

要求：
1. 生成完整的、可运行的代码
2. 包含必要的注释和文档
3. 遵循技术方案中的技术选型
4. 生成相应的单元测试`,
    );

    this.addTokenUsage(usage);

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      result = { files: [], instructions: '', summary: content };
    }

    if (result.files && result.files.length > 0) {
      await this.writeGeneratedFiles(result.files);
    }

    context.set('codeGenResult', result);
    this.setStatus('completed');
    return result;
  }

  async writeGeneratedFiles(files) {
    for (const file of files) {
      const fullPath = path.join(process.cwd(), file.path);
      const dir = path.dirname(fullPath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(fullPath, file.content);
    }
  }
}

module.exports = { CodeGenAgent };