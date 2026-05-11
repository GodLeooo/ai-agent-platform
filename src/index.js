require('dotenv').config();

const { logger } = require('./utils/logger');
const { CodeQualityPipeline } = require('./pipelines/code-quality-pipeline');
const { OnCallPipeline } = require('./pipelines/oncall-pipeline');
const { E2EPipeline } = require('./pipelines/e2e-pipeline');

async function main() {
  console.log('========================================');
  console.log('    AI Agent 协同平台 - 启动入口');
  console.log('========================================\n');
  
  logger.info('AI Agent 协同平台启动');

  const pipeline = process.argv[2] || 'help';

  switch (pipeline) {
    case 'code-quality':
      await runCodeQualityPipeline();
      break;
    case 'oncall':
      await runOnCallPipeline();
      break;
    case 'e2e':
      await runE2EPipeline();
      break;
    default:
      showHelp();
  }

  console.log(`\n📁 运行日志已保存到: ${logger.getLogPath()}`);
}

async function runCodeQualityPipeline() {
  console.log('🔧 运行代码质量工坊流水线\n');
  logger.pipeline('代码质量工坊', '启动', '开始执行');
  
  const codeQuality = new CodeQualityPipeline();
  const result = await codeQuality.run({
    repoPath: './test-repo',
    targetBranch: 'main',
  });
  
  logger.pipeline('代码质量工坊', '完成', JSON.stringify(result));
  
  console.log('\n📊 代码质量分析报告摘要:');
  console.log(`  - 代码审查问题: ${result.reviewIssues}`);
  console.log(`  - 安全漏洞: ${result.securityVulnerabilities}`);
  console.log(`  - 性能问题: ${result.performanceIssues}`);
  console.log(`  - 架构风险: ${result.architectureRisks}`);
  console.log(`  - 生成测试用例: ${result.testCasesGenerated}`);
  console.log(`  - 自动修复成功: ${result.autoFixCount}`);
  console.log(`  - 总 Token 消耗: ${result.totalTokenUsage}`);
}

async function runOnCallPipeline() {
  console.log('🔍 运行 On-Call 故障诊断流水线\n');
  logger.pipeline('On-Call故障诊断', '启动', '开始执行');
  
  const oncall = new OnCallPipeline();
  const result = await oncall.run({
    serviceName: 'user-service',
    timeRange: { start: '2024-01-15T00:00:00Z', end: '2024-01-15T01:00:00Z' },
  });
  
  logger.pipeline('On-Call故障诊断', '完成', JSON.stringify(result));
  
  console.log('\n🔬 故障诊断报告摘要:');
  console.log(`  - 日志异常数: ${result.logAnomalies}`);
  console.log(`  - 慢查询数: ${result.slowQueries}`);
  console.log(`  - 错误率: ${result.errorRate}%`);
  console.log(`  - 根因置信度: ${result.confidence}%`);
  console.log(`  - 建议修复方案: ${result.suggestions?.length || 0} 条`);
  console.log(`  - 总 Token 消耗: ${result.totalTokenUsage}`);
}

async function runE2EPipeline() {
  console.log('🚀 运行需求到代码端到端流水线\n');
  logger.pipeline('需求到代码端到端', '启动', '开始执行');
  
  const e2e = new E2EPipeline();
  const result = await e2e.run({
    prdContent: `产品需求文档 - 用户管理系统

1. 功能需求：
   - 用户注册、登录、注销
   - 用户信息管理（CRUD）
   - 角色权限管理
   - 用户活动日志

2. 非功能需求：
   - 支持 10000 TPS
   - 数据加密存储
   - 支持 OAuth2 第三方登录

3. 技术约束：
   - 使用 Node.js + Express
   - 使用 MySQL 数据库
   - 部署在 Kubernetes`,
  });
  
  logger.pipeline('需求到代码端到端', '完成', JSON.stringify(result));
  
  console.log('\n📈 需求到代码流水线报告摘要:');
  console.log(`  - PRD 功能数: ${result.prdFeatures}`);
  console.log(`  - 架构组件数: ${result.designComponents}`);
  console.log(`  - 开发任务数: ${result.totalTasks}`);
  console.log(`  - 生成代码模块: ${result.generatedModules}`);
  console.log(`  - 总 Token 消耗: ${result.totalTokenUsage}`);
}

function showHelp() {
  console.log('使用方法:');
  console.log('  node src/index.js <pipeline>');
  console.log('');
  console.log('可用流水线:');
  console.log('  code-quality   - 代码质量工坊（代码审查、安全扫描、性能检测）');
  console.log('  oncall         - On-Call 故障诊断（日志分析、链路追踪、根因推断）');
  console.log('  e2e            - 需求到代码端到端流水线（PRD解析、技术方案、代码生成）');
  console.log('');
  console.log('示例:');
  console.log('  node src/index.js code-quality');
}

main().catch((error) => {
  console.error('❌ 执行失败:', error.message);
  logger.error('执行失败', error);
  process.exit(1);
});