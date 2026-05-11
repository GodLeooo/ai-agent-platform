const { AgentContext } = require('../core/base-agent');
const { Orchestrator } = require('../core/orchestrator');
const { logger } = require('../utils/logger');
const { ReviewAgent } = require('../agents/code-quality/review-agent');
const { SecurityAgent } = require('../agents/code-quality/security-agent');
const { PerformanceAgent } = require('../agents/code-quality/performance-agent');
const { ArchitectureAgent } = require('../agents/code-quality/architecture-agent');
const { TestAgent } = require('../agents/code-quality/test-agent');
const { ReportAgent } = require('../agents/code-quality/report-agent');
const { AutoFixAgent } = require('../agents/code-quality/auto-fix-agent');
const { PIPELINE_CONFIG } = require('../config');

class CodeQualityPipeline {
  constructor() {
    this.orchestrator = new Orchestrator('代码质量工坊');
  }

  async run(payload) {
    const { diff, files, adrDocs } = payload;
    const context = this.orchestrator.createContext({ adrDocs });
    const startTime = Date.now();

    console.log('\n' + '='.repeat(60));
    console.log('🏗️  代码质量工坊 Pipeline 启动');
    console.log('='.repeat(60));

    const input = { diff, files };

    logger.pipeline('代码质量工坊', 'Phase 1', '并行分析（4 Agent）');
    console.log('\n📌 Phase 1: 并行分析（4 Agent）');
    const parallelAgents = [
      new ReviewAgent(),
      new SecurityAgent(),
      new PerformanceAgent(),
      new ArchitectureAgent(),
    ];

    let parallelResults;
    if (PIPELINE_CONFIG.codeQuality.parallelAgents) {
      parallelResults = await Promise.all(
        parallelAgents.map((agent) => this.orchestrator.runAgent(agent, input, context)),
      );
    } else {
      parallelResults = [];
      for (const agent of parallelAgents) {
        parallelResults.push(await this.orchestrator.runAgent(agent, input, context));
      }
    }

    logger.pipeline('代码质量工坊', 'Phase 2', '生成测试用例');
    console.log('\n📌 Phase 2: 生成测试用例');
    const testAgent = new TestAgent();
    const testResult = await this.orchestrator.runAgent(testAgent, input, context);

    logger.pipeline('代码质量工坊', 'Phase 3', '生成 Review Report');
    console.log('\n📌 Phase 3: 生成 Review Report');
    const reportAgent = new ReportAgent();
    const reportResult = await this.orchestrator.runAgent(reportAgent, input, context);

    let autoFixResult = null;
    const hasCritical = parallelResults.some(
      (r) => r.severity === 'critical' || r.severity === 'high',
    );
    if (hasCritical) {
      logger.pipeline('代码质量工坊', 'Phase 4', 'Auto-Fix（检测到严重问题）');
      console.log('\n📌 Phase 4: Auto-Fix（检测到严重问题）');
      const autoFixAgent = new AutoFixAgent();
      autoFixResult = await this.orchestrator.runAgent(autoFixAgent, input, context);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Pipeline 完成 (${elapsed}s)`);
    console.log('='.repeat(60));

    return {
      reviewIssues: parallelResults[0]?.issues?.length || 0,
      securityVulnerabilities: parallelResults[1]?.vulnerabilities?.length || 0,
      performanceIssues: parallelResults[2]?.issues?.length || 0,
      architectureRisks: parallelResults[3]?.risks?.length || 0,
      testCasesGenerated: testResult?.testCases?.length || 0,
      autoFixCount: autoFixResult?.fixes?.length || 0,
      totalTokenUsage: this.orchestrator.getTotalTokenUsage(),
    };
  }
}

module.exports = { CodeQualityPipeline };