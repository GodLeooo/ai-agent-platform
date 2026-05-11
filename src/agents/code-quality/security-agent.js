const { BaseAgent } = require('../../core/base-agent');
const { LLMBridge } = require('../../utils/llm-bridge');

const SYSTEM_PROMPT = `你是一位应用安全专家。你的职责是：
1. 检测 SQL 注入、XSS、CSRF 等 OWASP Top 10 漏洞
2. 检查敏感信息泄露（硬编码密钥、日志中的 PII）
3. 评估认证/授权实现是否安全
4. 检查依赖版本是否存在已知 CVE

输出格式（JSON）：
{
  "severity": "critical|high|medium|low",
  "vulnerabilities": [
    { "type": "漏洞类型", "file": "文件路径", "line": 行号, "description": "描述", "remediation": "修复方案" }
  ],
  "riskScore": "1-10",
  "summary": "安全评估摘要"
}`;

class SecurityAgent extends BaseAgent {
  constructor() {
    super('SecurityAgent', '安全漏洞扫描');
  }

  async run(input, context) {
    this.setStatus('running');

    const { diff, files } = input;
    const reviewResult = context.get('reviewResult');
    const reviewContext = reviewResult ? `\n\n代码审查已发现的问题（供参考）：${JSON.stringify(reviewResult.findings?.slice(0, 3))}` : '';

    const { content, usage } = await LLMBridge.chat(
      SYSTEM_PROMPT,
      `请对以下代码变更进行安全扫描：\n\n变更文件: ${files?.join(', ') || 'all'}\n\nDiff:\n\`\`\`diff\n${diff}\n\`\`\`${reviewContext}`,
    );

    this.addTokenUsage(usage);

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      result = { severity: 'low', vulnerabilities: [], riskScore: 1, summary: content };
    }

    context.set('securityResult', result);
    this.setStatus('completed');
    return result;
  }
}

module.exports = { SecurityAgent };
