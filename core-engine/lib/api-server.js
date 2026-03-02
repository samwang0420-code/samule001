/**
 * GEO API Server - REST API
 */

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
import { executeGEOOptimization } from './auto-implement.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.API_PORT || 3000;

app.use(cors());
app.use(express.json());

// 静态文件服务 - 前端Dashboard
app.use(express.static(path.join(__dirname, '../public')));

// API Keys
const API_KEYS = new Set(process.env.API_KEYS?.split(',') || ['geo-api-key-demo']);

function authenticate(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || !API_KEYS.has(apiKey)) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }
  next();
}

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '2.0.0' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '2.0.0' });
});

// 运行分析
app.post('/api/analyze', authenticate, async (req, res) => {
  try {
    const { 
      businessName, 
      website,
      address, 
      industry = 'medical', 
      services = [],
      keywords = [],
      email,
      ...otherFields
    } = req.body;
    
    // Support both old format (address required) and new format (website required)
    const hasRequiredFields = (businessName && address) || (businessName && website);
    
    if (!hasRequiredFields) {
      return res.status(400).json({ 
        error: 'Missing required fields. Need: businessName + (address or website)' 
      });
    }
    
    const clientId = `geo_${Date.now()}`;
    
    // Save client data to file
    const clientData = {
      clientId,
      businessName,
      website: website || '',
      address: address || '',
      industry,
      services,
      keywords,
      email: email || '',
      ...otherFields,
      createdAt: new Date().toISOString()
    };
    
    const outputDir = path.join(__dirname, '../outputs', clientId);
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(
      path.join(outputDir, 'client.json'),
      JSON.stringify(clientData, null, 2)
    );
    
    // 异步执行分析
    setTimeout(() => {
      console.log(`Running analysis for ${businessName}...`);
      // 这里调用实际的medical-pipeline.js
    }, 100);
    
    res.status(202).json({
      success: true,
      message: 'Analysis started',
      data: { clientId, businessName, status: 'analyzing' }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取客户列表
app.get('/api/clients', authenticate, async (req, res) => {
  try {
    const outputsDir = path.join(__dirname, '../outputs');
    let clients = [];
    
    try {
      const entries = await fs.readdir(outputsDir, { withFileTypes: true });
      clients = await Promise.all(
        entries
          .filter(e => e.isDirectory())
          .map(async (e) => {
            try {
              const data = JSON.parse(await fs.readFile(path.join(outputsDir, e.name, 'client.json'), 'utf8'));
              return {
                id: e.name,
                name: data.firmName || data.name || e.name,
                industry: data.industry || 'medical',
                geoScore: data.geoScore || 0,
                aiCitation: data.aiCitation || 0,
                status: 'active'
              };
            } catch (err) {
              return { id: e.name, name: e.name, industry: 'medical', status: 'active' };
            }
          })
      );
    } catch (e) {
      clients = [];
    }
    
    res.json({ success: true, data: clients });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute GEO optimization
app.post('/api/execute', authenticate, async (req, res) => {
  try {
    const { clientId } = req.body;
    
    if (!clientId) {
      return res.status(400).json({ error: 'Missing clientId' });
    }
    
    // Load client data
    const clientData = JSON.parse(
      await fs.readFile(path.join(__dirname, '../outputs', clientId, 'client.json'), 'utf8')
    );
    
    // Execute optimization
    const result = await executeGEOOptimization(clientId, clientData);
    
    res.json(result);
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`GEO API Server running on port ${PORT}`);
});

export default app;
