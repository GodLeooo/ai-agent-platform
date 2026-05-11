const { BaseAgent } = require('../../core/base-agent');
const { LLMBridge } = require('../../utils/llm-bridge');

const SYSTEM_PROMPT = `你是一位 SRE 故障诊断专家，擅长长链推理根因分析。你的职责是：
1. 结合日志分析结果和链路追踪结果，推断故障根因
2. 参考历史 Incident 知识库中的相似案例
3. 给出置信度评分和推理链
4. 提供修复建议和 Hotfix 方案

推理过程要求：
- Step 1: 列出所有异常信号
- Step 2: 排除不可能的根因（带理由）
- Step 3: 对剩余候选根因评分
- Step 4: 给出最可能的根因和修复方案

输出格式（JSON）：
{
  "reasoning": {
    "step1_signals": ["异常信号列表"],
    "step2_excluded": [{"cause": "排除的根因", "reason": "排除理由"}],
    "step3_candidates": [{"cause": "候选根因", "confidence": "0-100%", "evidence": "支持证据"}],
    "step4_conclusion": "最终结论"
  },
  "rootCause": {
    "service": "根因服务",
    "type": "故障类型",
    "description": "详细描述",
    "confidence": "0-100%"
  },
  "fixSuggestion": {
    "immediateAction": "立即行动",
    "hotfix": "Hotfix 方案代码",
    "longTerm": "长期改进建议"
  },
  "similarIncidents": ["相似历史事件引用"],
  "summary": "诊断摘要"
}`;

class RootCauseAgent extends BaseAgent {
  constructor() {
    super('RootCauseAgent', '长链推理根因推断');
  }

  async run(input, context) {
    this.setStatus('running');

    const { incidentHistory } = input;
    const logResult = context.get('logResult') || {};
    const traceResult = context.get('traceResult') || {};

    const historyContext = incidentHistory?.length
      ? `\n\n历史 Incident 知识库：\n${incidentHistory.map((i) => `- [${i.id}] ${i.title}: ${i.rootCause}`).join('\n')}`
      : '';

    const { content, usage } = await LLMBridge.chat(
      SYSTEM_PROMPT,
      `请进行长链推理根因分析：

## 日志分析结果
${JSON.stringify(logResult, null, 2)}

## 链路追踪结果
${JSON.stringify(traceResult, null, 2)}${historyContext}

请按照 Step 1-4 的推理流程，给出故障根因和修复建议。`,
    );

    this.addTokenUsage(usage);

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      result = {
        rootCause: { service: 'unknown', type: 'unknown', description: content, confidence: '50%' },
        summary: content,
      };
    }

    context.set('rootCauseResult', result);
    this.setStatus('completed');
    return result;
  }
}

module.exports = { RootCauseAgent };
