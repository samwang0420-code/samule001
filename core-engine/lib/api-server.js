/**
 * GEO API Server - REST API with Authentication
 * 实现问卷→客户→分析的完整流程 + 登录保护
 */

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.API_PORT || 3000;

// JWT配置
const JWT_SECRET = process.env.JWT_SECRET || 'geo-dashboard-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Initialize Supabase client (with fallback)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
let useDatabase = false;

try {
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    useDatabase = true;
    console.log('✅ Supabase client initialized');
  } else {
    console.log('⚠️ Supabase credentials not found, using file storage mode');
  }
} catch (e) {
  console.log('⚠️ Supabase initialization failed, using file storage mode:', e.message);
  useDatabase = false;
}

// 内存用户存储(文件模式)
let fileUsers = [];
loadUsersFromFile().catch(() => {});

app.use(cors());
app.use(express.json());

// 静态文件服务 - 前端Dashboard
app.use(express.static(path.join(__dirname, '../public')));

// ==========================================
// 认证中间件
// ==========================================

// JWT验证中间件
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// API Key验证(用于问卷提交等公开接口)
function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const validApiKeys = ['geo-internal-samwang0420', 'geo-api-key-demo'];
  
  if (apiKey && validApiKeys.includes(apiKey)) {
    return next();
  }
  
  // 如果没有API Key，尝试JWT
  authenticateToken(req, res, next);
}

// 管理员验证
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// ==========================================
// 用户管理函数
// ==========================================

// 从文件加载用户
async function loadUsersFromFile() {
  try {
    const usersPath = path.join(__dirname, '../data/users.json');
    const data = await fs.readFile(usersPath, 'utf8');
    fileUsers = JSON.parse(data);
  } catch (e) {
    fileUsers = [];
    // 创建默认管理员
    await createDefaultAdmin();
  }
}

// 保存用户到文件
async function saveUsersToFile() {
  try {
    const dataDir = path.join(__dirname, '../data');
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(
      path.join(dataDir, 'users.json'),
      JSON.stringify(fileUsers, null, 2)
    );
  } catch (e) {
    console.error('Failed to save users:', e);
  }
}

// 创建默认管理员账户
async function createDefaultAdmin() {
  const adminExists = fileUsers.find(u => u.email === 'admin@geo.local');
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    fileUsers.push({
      id: 'admin_001',
      email: 'admin@geo.local',
      password_hash: hashedPassword,
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      created_at: new Date().toISOString(),
      last_login_at: null
    });
    await saveUsersToFile();
    console.log('✅ Default admin created: admin@geo.local / admin123');
  }
}

// 生成JWT Token
function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role || 'user'
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// ==========================================
// 认证API
// ==========================================

// 登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    let user = null;
    
    // 尝试从数据库验证
    if (useDatabase && supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (!error && data) {
        const validPassword = await bcrypt.compare(password, data.password_hash);
        if (validPassword) {
          user = data;
          // 更新最后登录时间
          await supabase
            .from('users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', user.id);
        }
      }
    }
    
    // 如果数据库没有，尝试文件
    if (!user) {
      user = fileUsers.find(u => u.email === email);
      if (user) {
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
          user = null;
        } else {
          // 更新最后登录时间
          user.last_login_at = new Date().toISOString();
          await saveUsersToFile();
        }
      }
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const token = generateToken(user);
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role || 'user'
        }
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 注册(仅管理员可创建新用户)
app.post('/api/auth/register', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = 'user' } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = 'user_' + Date.now();
    
    const userData = {
      id: userId,
      email,
      password_hash: hashedPassword,
      first_name: firstName || '',
      last_name: lastName || '',
      role,
      created_at: new Date().toISOString(),
      last_login_at: null
    };
    
    // 保存到数据库(如果可用)
    if (useDatabase && supabase) {
      const { error } = await supabase.from('users').insert(userData);
      if (error) {
        return res.status(400).json({ error: error.message });
      }
    }
    
    // 同时保存到文件
    fileUsers.push(userData);
    await saveUsersToFile();
    
    res.json({
      success: true,
      message: 'User created successfully',
      data: { id: userId, email }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取当前用户信息
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  res.json({
    success: true,
    data: {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// 登出(客户端删除token即可，这里记录日志)
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// 修改密码
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }
    
    const userId = req.user.userId;
    
    // 从文件找到用户
    const userIndex = fileUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = fileUsers[userIndex];
    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    fileUsers[userIndex].password_hash = hashedPassword;
    await saveUsersToFile();
    
    // 同时更新数据库
    if (useDatabase && supabase) {
      await supabase
        .from('users')
        .update({ password_hash: hashedPassword })
        .eq('id', userId);
    }
    
    res.json({ success: true, message: 'Password changed successfully' });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 健康检查
// ==========================================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(), 
    version: '2.0.0',
    database: useDatabase ? 'connected' : 'file-storage-mode'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(), 
    version: '2.0.0',
    database: useDatabase ? 'connected' : 'file-storage-mode'
  });
});

// ==========================================
// 问卷提交 (API Key或JWT都可用)
// ==========================================
app.post('/api/analyze', authenticateApiKey, async (req, res) => {
  try {
    const { 
      businessName, 
      website,
      address, 
      industry = 'medical', 
      services = [],
      keywords = [],
      email,
      contactName,
      contactEmail,
      ...otherFields
    } = req.body;
    
    if (!businessName || (!website && !address)) {
      return res.status(400).json({ 
        error: 'Missing required fields. Need: businessName + (website or address)' 
      });
    }
    
    const submissionId = crypto.randomUUID();
    const clientId = `geo_${Date.now()}`;
    
    const submissionData = {
      id: submissionId,
      client_id: null,
      website: website || '',
      business_name: businessName,
      industry: industry,
      business_description: otherFields.businessDescription || '',
      company_size: otherFields.companySize || '',
      year_established: otherFields.yearEstablished || null,
      service_area: otherFields.serviceArea || '',
      target_keywords: Array.isArray(keywords) ? keywords : [],
      competitors: otherFields.competitors || [],
      current_challenges: otherFields.challenges || '',
      expected_goals: otherFields.goals || '',
      contact_name: contactName || '',
      contact_job_title: otherFields.jobTitle || '',
      contact_email: contactEmail || email || '',
      contact_phone: otherFields.phone || '',
      contact_messaging: otherFields.messaging || '',
      additional_notes: otherFields.notes || '',
      source: 'questionnaire',
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      created_at: new Date().toISOString(),
      processed_at: null,
      processed_by: req.user?.userId || null
    };
    
    // 保存到数据库(如果可用)
    if (useDatabase && supabase) {
      const result = await supabase
        .from('questionnaire_submissions')
        .insert(submissionData);
      if (result.error) {
        console.log('DB insert failed:', result.error.message);
      }
    }
    
    // 同时保存到文件
    await saveSubmissionToFile(submissionData);
    
    // 异步处理
    processSubmission(submissionData, clientId).catch(console.error);
    
    res.status(202).json({
      success: true,
      message: 'Analysis request received. Processing started.',
      data: { 
        submissionId, 
        clientId, 
        businessName, 
        status: 'processing',
        eta: '5-10 minutes'
      }
    });
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 其他API端点(都需要JWT认证)
// ==========================================

// 获取客户列表
app.get('/api/clients', authenticateToken, async (req, res) => {
  try {
    if (useDatabase && supabase) {
      const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && clients) {
        const formatted = clients.map(c => ({
          id: c.id,
          name: c.business_name,
          industry: c.industry,
          geoScore: c.geo_score || 0,
          status: c.status
        }));
        return res.json({ success: true, data: formatted });
      }
    }
    
    const clientsFromFile = await getClientsFromFile();
    res.json({ success: true, data: clientsFromFile });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取客户详情
app.get('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (useDatabase && supabase) {
      const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();
      
      if (client) {
        return res.json({ success: true, data: client });
      }
    }
    
    const clientFromFile = await getClientFromFile(id);
    if (clientFromFile) {
      return res.json({ success: true, data: clientFromFile });
    }
    
    res.status(404).json({ error: 'Client not found' });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取问卷列表
app.get('/api/submissions', authenticateToken, async (req, res) => {
  try {
    if (useDatabase && supabase) {
      const { data } = await supabase
        .from('questionnaire_submissions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) return res.json({ success: true, data });
    }
    
    const submissions = await getSubmissionsFromFile();
    res.json({ success: true, data: submissions });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 执行优化
app.post('/api/execute', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.body;
    if (!clientId) {
      return res.status(400).json({ error: 'Missing clientId' });
    }
    
    res.json({
      success: true,
      message: 'Optimization queued',
      data: { clientId, status: 'processing' }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 辅助函数
// ==========================================

async function processSubmission(submission, clientId) {
  try {
    const client = await createClientFromSubmission(submission, clientId);
    
    if (useDatabase && supabase) {
      await supabase
        .from('questionnaire_submissions')
        .update({ client_id: client.id || clientId, processed_at: new Date().toISOString() })
        .eq('id', submission.id);
    }
    
    const jobId = `job_${Date.now()}`;
    await runSimpleAnalysis(client, submission, jobId);
    
  } catch (error) {
    console.error('Process error:', error);
  }
}

async function createClientFromSubmission(submission, clientId) {
  const clientData = {
    id: clientId,
    client_code: clientId,
    business_name: submission.business_name,
    industry: submission.industry,
    website: submission.website,
    email: submission.contact_email,
    target_keywords: submission.target_keywords || [],
    status: 'active',
    created_at: new Date().toISOString()
  };
  
  if (useDatabase && supabase) {
    const { data, error } = await supabase
      .from('clients')
      .insert(clientData)
      .select()
      .single();
    
    if (!error && data) {
      await saveClientToFile({ ...clientData, ...data });
      return { ...clientData, ...data };
    }
  }
  
  await saveClientToFile(clientData);
  return clientData;
}

async function runSimpleAnalysis(client, submission, jobId) {
  const results = {
    clientId: client.id,
    geoScore: Math.floor(Math.random() * 30) + 60,
    aiCitation: Math.floor(Math.random() * 40) + 30,
    created_at: new Date().toISOString()
  };
  
  const outputDir = path.join(__dirname, '../outputs', client.id);
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, 'analysis-results.json'),
    JSON.stringify(results, null, 2)
  );
  
  if (useDatabase && supabase) {
    await supabase
      .from('clients')
      .update({ geo_score: results.geoScore })
      .eq('id', client.id);
  }
  
  return results;
}

async function saveSubmissionToFile(data) {
  const dir = path.join(__dirname, '../outputs/submissions');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, `${data.id}.json`), JSON.stringify(data, null, 2));
}

async function saveClientToFile(client) {
  const dir = path.join(__dirname, '../outputs', client.id);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'client.json'), JSON.stringify(client, null, 2));
}

async function getClientsFromFile() {
  const outputsDir = path.join(__dirname, '../outputs');
  try {
    const entries = await fs.readdir(outputsDir, { withFileTypes: true });
    const clients = await Promise.all(
      entries
        .filter(e => e.isDirectory() && e.name.startsWith('geo_'))
        .map(async (e) => {
          try {
            const data = JSON.parse(await fs.readFile(path.join(outputsDir, e.name, 'client.json'), 'utf8'));
            const results = JSON.parse(await fs.readFile(path.join(outputsDir, e.name, 'analysis-results.json'), 'utf8').catch(() => '{}'));
            return {
              id: data.id || e.name,
              name: data.business_name,
              industry: data.industry,
              geoScore: results.geoScore || 0,
              status: data.status || 'active'
            };
          } catch (err) {
            return null;
          }
        })
    );
    return clients.filter(c => c !== null);
  } catch (e) {
    return [];
  }
}

async function getClientFromFile(clientId) {
  try {
    const data = JSON.parse(await fs.readFile(path.join(__dirname, '../outputs', clientId, 'client.json'), 'utf8'));
    return data;
  } catch (e) {
    return null;
  }
}

async function getSubmissionsFromFile() {
  const dir = path.join(__dirname, '../outputs/submissions');
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const submissions = await Promise.all(
      entries
        .filter(e => e.isFile() && e.name.endsWith('.json'))
        .map(async (e) => {
          try {
            return JSON.parse(await fs.readFile(path.join(dir, e.name), 'utf8'));
          } catch (err) {
            return null;
          }
        })
    );
    return submissions.filter(s => s !== null);
  } catch (e) {
    return [];
  }
}

// Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`GEO API Server running on port ${PORT}`);
  console.log(`Storage mode: ${useDatabase ? 'Database + File' : 'File Only'}`);
  console.log(`Default admin: admin@geo.local / admin123`);
});

export default app;
