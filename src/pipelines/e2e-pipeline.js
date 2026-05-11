const { PRDParserAgent } = require('../agents/e2e-pipeline/prd-parser-agent');
const { TechDesignAgent } = require('../agents/e2e-pipeline/tech-design-agent');
const { TaskSplitterAgent } = require('../agents/e2e-pipeline/task-splitter-agent');
const { CodeGenAgent } = require('../agents/e2e-pipeline/code-gen-agent');
const { Orchestrator } = require('../core/orchestrator');
const { logger } = require('../utils/logger');

class E2EPipeline {
  constructor() {
    this.orchestrator = new Orchestrator('需求到代码流水线');
    this.pipelineConfig = {
      parallelCodeGen: true,
      maxParallelAgents: 4,
    };
  }

  async run(input) {
    logger.pipeline('需求到代码端到端', '启动', '开始执行');
    console.log('🚀 启动需求到代码端到端流水线');
    
    const context = this.orchestrator.createContext();
    
    logger.pipeline('需求到代码端到端', '阶段一', 'PRD 需求解析');
    console.log('📋 阶段一：PRD 需求解析');
    const prdParser = new PRDParserAgent();
    const prdResult = await this.orchestrator.runAgent(prdParser, input, context);
    console.log(`  解析到 ${prdResult.features?.length || 0} 个功能需求`);

    logger.pipeline('需求到代码端到端', '阶段二', '技术方案设计');
    console.log('🎯 阶段二：技术方案设计');
    const techDesign = new TechDesignAgent();
    const designResult = await this.orchestrator.runAgent(techDesign, {}, context);
    console.log(`  技术选型: ${designResult.techStack?.framework || 'N/A'}`);

    logger.pipeline('需求到代码端到端', '阶段三', '任务拆分');
    console.log('📝 阶段三：任务拆分');
    const taskSplitter = new TaskSplitterAgent();
    const taskResult = await this.orchestrator.runAgent(taskSplitter, {}, context);
    console.log(`  拆分为 ${taskResult.tasks?.length || 0} 个开发任务`);

    logger.pipeline('需求到代码端到端', '阶段四', '代码生成');
    console.log('💻 阶段四：代码生成');
    const codeGenResults = [];
    
    if (this.pipelineConfig.parallelCodeGen && taskResult.tasks?.length > 0) {
      const tasks = taskResult.tasks.slice(0, this.pipelineConfig.maxParallelAgents);
      const promises = tasks.map((task) => {
        const codeGen = new CodeGenAgent();
        return this.orchestrator.runAgent(codeGen, { task }, context);
      });
      codeGenResults.push(...(await Promise.all(promises)));
    } else if (taskResult.tasks?.length > 0) {
      for (const task of taskResult.tasks.slice(0, 3)) {
        const codeGen = new CodeGenAgent();
        const result = await this.orchestrator.runAgent(codeGen, { task }, context);
        codeGenResults.push(result);
      }
    }

    console.log(`  生成了 ${codeGenResults.length} 个代码模块`);

    const summary = {
      pipeline: '需求到代码端到端流水线',
      prdFeatures: prdResult.features?.length || 0,
      designComponents: designResult.architecture?.components?.length || 0,
      totalTasks: taskResult.tasks?.length || 0,
      generatedModules: codeGenResults.length,
      totalTokenUsage: this.orchestrator.getTotalTokenUsage(),
      milestones: taskResult.milestones || [],
    };

    console.log('✅ 流水线执行完成');
    console.log(JSON.stringify(summary, null, 2));

    return summary;
  }
}

module.exports = { E2EPipeline };