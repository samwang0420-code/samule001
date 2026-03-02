/**
 * GEO API Server - REST API
 * 
 * 提供API端点供外部系统集成
 */

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import * as geoEngine from '../geo.js';
import * as aiCitation from './ai-citation-monitor.js';
import * as reportGenerator from './report-generator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.API_PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// API Key验证
const API_KEYS = new Set(process.env.API_KEYS?.split(',') || []);

function authenticate(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || !API_KEYS.has(apiKey)) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }
  
  next();
}

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// ==========================================
// 分析端点
// ==========================================

/**
 * POST /api/analyze
 * 运行完整的GEO分析
 */
app.post('/api/analyze', authenticate, async (req, res) => {
  try {
    const { businessName, address, industry = 'medical', services = [] } = req.body;
    
    if (!businessName || !address) {
      return res.status(400).json({ 
        error: 'Missing required fields: businessName, address' 
      });
    }
    
    console.log(`🔍 API: Analyzing ${businessName}...`);
    
    // 这里应该调用实际的分析函数
    // 模拟响应
    const result = {
      clientId: `api_${Date.now()}`,
      businessName,
      address,
      industry,
      services,
      status: 'analyzing',
      estimatedTime: '60-120 seconds',
      webhook: req.body.webhook
    };
    
    // 异步执行分析
    if (req.body.async !== false) {
      // 后台运行分析
      setTimeout(() => runAsyncAnalysis(result, req.body.webhook), 100);
      
      return res.status(202).json({
        success: true,
        message: 'Analysis started',
        data: result
      });
    }
    
    // 同步执行（会超时，不推荐）
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analysis/:clientId
 * 获取分析结果
 */
app.get('/api/analysis/:clientId', authenticate, async (req, res) => {
  try {
    const { clientId } = req.params;
    
    // 从文件系统加载结果
    const outputDir = path.join(__dirname, '../outputs', clientId);
    
    const results = {
      clientId,
      status: 'completed',
      reports: {}
    };
    
    try {
      const scoreData = await import(path.join(outputDir, 'score.json'), { assert: { type: 'json' } });
      results.reports.geoScore = scoreData.default;
    } catch (e) {}
    
    try {
      const citationData = await import(path.join(outputDir, 'citation.json'), { assert: { type: 'json' } });
      results.reports.citation = citationData.default;
    } catch (e) {}
    
    res.json({
      success: true,
      data: results
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 监控端点
// ==========================================

/**
 * GET /api/monitoring/rankings/:clientId
 * 获取排名数据
 */
app.get('/api/monitoring/rankings/:clientId', authenticate, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { days = 30 } = req.query;
    
    // 加载历史排名数据
    const rankings = await loadRankingHistory(clientId, parseInt(days));
    
    res.json({
      success: true,
      data: {
        clientId,
        period: `${days} days`,
        rankings
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/monitoring/ai-citations/:clientId
 * 获取AI引用数据
 */
app.get('/api/monitoring/ai-citations/:clientId', authenticate, async (req, res) => {
  try {
    const { clientId } = req.params;
    
    const history = await aiCitation.loadCitationHistory(clientId);
    const report = await aiCitation.generateAICitationReport(clientId);
    
    res.json({
      success: true,
      data: {
        clientId,
        history: history.slice(-30), // 最近30条
        summary: report
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 报告端点
// ==========================================

/**
 * POST /api/reports/weekly
 * 生成周报
 */
app.post('/api/reports/weekly', authenticate, async (req, res) => {
  try {
    const { clientId, weekData } = req.body;
    
    const report = await reportGenerator.generateWeeklyReport(clientId, weekData);
    const reportPath = await reportGenerator.saveReport(clientId, report, 'weekly');
    
    res.json({
      success: true,
      data: {
        report,
        path: reportPath
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/reports/download/:clientId/:reportType
 * 下载报告
 */
app.get('/api/reports/download/:clientId/:reportType', authenticate, async (req, res) => {
  try {
    const { clientId, reportType } = req.params;
    const { date } = req.query;
    
    const filename = date 
      ? `${reportType}-${date}.md`
      : `${reportType}-${new Date().toISOString().split('T')[0]}.md`;
    
    const filePath = path.join(__dirname, '../outputs', clientId, 'reports', filename);
    
    res.sendFile(filePath);
    
  } catch (error) {
    res.status(404).json({ error: 'Report not found' });
  }
});

// ==========================================
// 客户管理端点
// ==========================================

/**
 * GET /api/clients
 * 列出所有客户
 */
app.get('/api/clients', authenticate, async (req, res) => {
  try {
    const outputsDir = path.join(__dirname, '../outputs');
    const entries = await fs.readdir(outputsDir, { withFileTypes: true });
    
    const clients = await Promise.all(
      entries
        .filter(e => e.isDirectory())
        .map(async (e) => {
          try {
            const clientData = await import(
              path.join(outputsDir, e.name, 'client.json'),
              { assert: { type: 'json' } }
            );
            return {
              id: e.name,
              ...clientData.default
            };
          } catch (err) {
            return { id: e.name, name: 'Unknown' };
          }
        })
    );
    
    res.json({
      success: true,
      data: clients
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/clients/:clientId
 * 获取客户详情
 */
app.get('/api/clients/:clientId', authenticate, async (req, res) => {
  try {
    const { clientId } = req.params;
    const outputDir = path.join(__dirname, '../outputs', clientId);
    
    const clientData = await import(
      path.join(outputDir, 'client.json'),
      { assert: { type: 'json' } }
    );
    
    res.json({
      success: true,
      data: clientData.default
    });
    
  } catch (error) {
    res.status(404).json({ error: 'Client not found' });
  }
});

// ==========================================
// Webhook处理
// ==========================================

async function runAsyncAnalysis(analysisData, webhookUrl) {
  console.log(`🔄 Running async analysis for ${analysisData.clientId}...`);
  
  try {
    // 这里调用实际的分析逻辑
    // await geoEngine.analyze(...);
    
    const result = {
      ...analysisData,
      status: 'completed',
      completedAt: new Date().toISOString()
    };
    
    // 发送webhook通知
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'analysis.completed',
          data: result
        })
      });
    }
    
  } catch (error) {
    console.error('Async analysis failed:', error);
    
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'analysis.failed',
          error: error.message
        })
      });
    }
  }
}

async function loadRankingHistory(clientId, days) {
  // 从数据库或文件加载
  return []; // Placeholder
}

// 启动服务器
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║     GEO API Server Running                               ║
╠══════════════════════════════════════════════════════════╣
║  Port:     ${PORT}                                          ║
║  Health:   http://localhost:${PORT}/health                   ║
╚══════════════════════════════════════════════════════════╝
  `);
});

export default app;
