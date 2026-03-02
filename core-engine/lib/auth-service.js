/**
 * Auth Service - 用户认证服务
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

/**
 * 注册新用户
 */
export async function registerUser({ email, password, firstName, lastName, companyName }) {
  // 检查邮箱是否已存在
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();
  
  if (existing) {
    throw new Error('Email already registered');
  }
  
  // 加密密码
  const passwordHash = await bcrypt.hash(password, 10);
  
  // 创建用户
  const { data: user, error } = await supabase
    .from('users')
    .insert({
      email,
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      company_name: companyName
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // 生成token
  const token = generateToken(user);
  
  return {
    user: sanitizeUser(user),
    token
  };
}

/**
 * 用户登录
 */
export async function loginUser(email, password) {
  // 查找用户
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error || !user) {
    throw new Error('Invalid email or password');
  }
  
  // 验证密码
  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    throw new Error('Invalid email or password');
  }
  
  // 更新最后登录时间
  await supabase
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', user.id);
  
  // 生成token
  const token = generateToken(user);
  
  return {
    user: sanitizeUser(user),
    token
  };
}

/**
 * 验证Token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

/**
 * 获取当前用户
 */
export async function getCurrentUser(token) {
  const decoded = verifyToken(token);
  if (!decoded) return null;
  
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', decoded.userId)
    .single();
  
  if (error || !user) return null;
  
  return sanitizeUser(user);
}

/**
 * 生成JWT Token
 */
function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * 清理敏感信息
 */
function sanitizeUser(user) {
  const { password_hash, ...sanitized } = user;
  return sanitized;
}

/**
 * 中间件: 验证请求
 */
export async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const user = await getCurrentUser(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  
  req.user = user;
  next();
}

/**
 * 中间件: 验证管理员
 */
export function adminMiddleware(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

export default {
  registerUser,
  loginUser,
  verifyToken,
  getCurrentUser,
  authMiddleware,
  adminMiddleware
};
