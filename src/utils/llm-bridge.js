const { LLM_CONFIG } = require('../config');
const { logger } = require('./logger');

class LLMBridge {
  static isMockMode() {
    return !LLM_CONFIG.apiKey || LLM_CONFIG.apiKey === 'your-api-key-here';
  }

  static async chat(systemPrompt, userMessage, options = {}) {
    if (this.isMockMode()) {
      return this.mockChat(systemPrompt, userMessage);
    }

    const body = {
      model: options.model || LLM_CONFIG.model,
      max_tokens: options.maxTokens || LLM_CONFIG.maxTokens,
      temperature: options.temperature ?? LLM_CONFIG.temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    };

    logger.info(`[LLM] → 发送请求 (${body.messages[1].content.length} chars)`);
    console.log(`[LLM] → 发送请求 (${body.messages[1].content.length} chars)`);

    const resp = await fetch(`${LLM_CONFIG.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LLM_CONFIG.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      throw new Error(`LLM API error: ${resp.status} ${await resp.text()}`);
    }

    const data = await resp.json();
    const content = data.choices[0].message.content;
    const usage = data.usage;

    logger.info(`[LLM] ← 收到响应 (${content.length} chars, tokens: ${usage?.total_tokens || 'N/A'})`);
    console.log(`[LLM] ← 收到响应 (${content.length} chars, tokens: ${usage?.total_tokens || 'N/A'})`);

    return { content, usage, raw: data };
  }

  static mockChat(systemPrompt, userMessage) {
    const mockResponses = this.generateMockResponse(systemPrompt);
    const tokens = Math.floor(Math.random() * 500) + 100;

    logger.info(`[LLM] → 发送请求 (${userMessage.length} chars)`);
    console.log(`[LLM] → 发送请求 (${userMessage.length} chars)`);

    logger.info(`[LLM] ← 收到响应 (${mockResponses.length} chars, tokens: ${tokens})`);
    console.log(`[LLM] ← 收到响应 (${mockResponses.length} chars, tokens: ${tokens})`);

    return {
      content: mockResponses,
      usage: { prompt_tokens: tokens / 2, completion_tokens: tokens / 2, total_tokens: tokens },
      raw: { mock: true },
    };
  }

  static generateMockResponse(systemPrompt) {
    if (systemPrompt.includes('PRD')) {
      return JSON.stringify({
        features: [
          {
            id: 'F001',
            title: '用户注册登录',
            userStory: '作为新用户，我希望能够注册账户并登录系统',
            acceptanceCriteria: ['支持邮箱注册', '支持密码登录', '支持第三方OAuth登录'],
            techConstraints: ['需加密存储密码', '需实现JWT令牌认证'],
            dependencies: ['用户服务'],
          },
          {
            id: 'F002',
            title: '用户信息管理',
            userStory: '作为已登录用户，我希望能够管理个人信息',
            acceptanceCriteria: ['查看个人信息', '编辑个人信息', '上传头像'],
            techConstraints: ['头像需存储到对象存储'],
            dependencies: ['用户服务', '存储服务'],
          },
          {
            id: 'F003',
            title: '角色权限管理',
            userStory: '作为管理员，我希望能够管理用户角色和权限',
            acceptanceCriteria: ['创建角色', '分配权限', '分配用户角色'],
            techConstraints: ['需实现RBAC模型'],
            dependencies: ['权限服务'],
          },
          {
            id: 'F004',
            title: '用户活动日志',
            userStory: '作为审计人员，我希望查看用户操作日志',
            acceptanceCriteria: ['记录登录日志', '记录操作日志', '支持日志查询'],
            techConstraints: ['日志需持久化存储', '需保留90天'],
            dependencies: ['日志服务'],
          },
        ],
        epic: '构建完整的用户管理系统',
        estimation: { level: '中', storyPoints: '21' },
        summary: '解析到4个核心功能模块，涉及用户全生命周期管理',
      }, null, 2);
    }

    if (systemPrompt.includes('架构师')) {
      return JSON.stringify({
        architecture: {
          style: '微服务架构',
          diagram: `graph TB
  API[API Gateway] --> US[用户服务]
  API --> PS[权限服务]
  API --> LS[日志服务]
  US --> DB1[(MySQL)]
  PS --> DB2[(Redis)]
  LS --> DB3[(ES)]`,
          components: ['API Gateway', '用户服务', '权限服务', '日志服务'],
        },
        techStack: {
          language: 'Node.js',
          framework: 'Express.js',
          database: 'MySQL + Redis',
          middleware: ['JWT', 'Helmet', 'CORS'],
        },
        apiDesign: [
          { method: 'POST', path: '/api/auth/register', description: '用户注册', request: '{email, password}', response: '{token, userId}' },
          { method: 'POST', path: '/api/auth/login', description: '用户登录', request: '{email, password}', response: '{token, userId}' },
          { method: 'GET', path: '/api/users/:id', description: '获取用户信息', request: '-', response: '{user}' },
          { method: 'PUT', path: '/api/users/:id', description: '更新用户信息', request: '{user}', response: '{success}' },
        ],
        database: {
          tables: [
            { name: 'users', columns: [{ name: 'id', type: 'BIGINT', nullable: false }, { name: 'email', type: 'VARCHAR', nullable: false }] },
          ],
          indexes: ['idx_users_email'],
        },
        security: ['密码bcrypt加密', 'JWT认证', 'HTTPS强制', 'SQL注入防护'],
        summary: '采用微服务架构，使用Node.js + Express技术栈',
      }, null, 2);
    }

    if (systemPrompt.includes('项目经理')) {
      return JSON.stringify({
        tasks: [
          {
            id: 'T001',
            title: '用户服务基础框架搭建',
            description: '创建Express服务，配置路由和中间件',
            type: 'feature',
            priority: 'high',
            estimate: { hours: 4, complexity: '低' },
            dependencies: [],
            assigneeRole: '后端开发',
            acceptanceCriteria: ['服务可启动', '健康检查接口正常'],
          },
          {
            id: 'T002',
            title: '用户注册登录API实现',
            description: '实现用户注册和登录接口',
            type: 'feature',
            priority: 'high',
            estimate: { hours: 8, complexity: '中' },
            dependencies: ['T001'],
            assigneeRole: '后端开发',
            acceptanceCriteria: ['注册接口可用', '登录返回JWT令牌'],
          },
          {
            id: 'T003',
            title: '数据库表设计和初始化',
            description: '设计并创建用户相关数据库表',
            type: 'feature',
            priority: 'high',
            estimate: { hours: 3, complexity: '低' },
            dependencies: [],
            assigneeRole: '后端开发',
            acceptanceCriteria: ['表结构设计完成', '迁移脚本可用'],
          },
        ],
        milestones: [{ name: 'MVP', tasks: ['T001', 'T002', 'T003'] }],
        summary: '拆分为3个开发任务，预估总工时15小时',
      }, null, 2);
    }

    if (systemPrompt.includes('全栈开发者')) {
      return JSON.stringify({
        files: [
          {
            path: 'src/controllers/auth.controller.js',
            content: `const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;
    res.json({ message: '用户注册成功', userId: 1 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const token = jwt.sign({ userId: 1 }, 'secret', { expiresIn: '1d' });
    res.json({ token, userId: 1 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};`,
            type: 'controller',
          },
          {
            path: 'src/routes/auth.routes.js',
            content: `const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;`,
            type: 'config',
          },
        ],
        instructions: '运行 npm install && node src/index.js 启动服务',
        summary: '生成了认证控制器和路由模块',
      }, null, 2);
    }

    return JSON.stringify({ result: '模拟响应', message: '这是一个模拟的LLM响应' }, null, 2);
  }

  static async chatWithHistory(messages, options = {}) {
    if (this.isMockMode()) {
      return { mock: true, choices: [{ message: { content: '模拟响应' } }] };
    }

    const body = {
      model: options.model || LLM_CONFIG.model,
      max_tokens: options.maxTokens || LLM_CONFIG.maxTokens,
      temperature: options.temperature ?? LLM_CONFIG.temperature,
      messages,
    };

    const resp = await fetch(`${LLM_CONFIG.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LLM_CONFIG.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      throw new Error(`LLM API error: ${resp.status}`);
    }

    return await resp.json();
  }
}

module.exports = { LLMBridge };