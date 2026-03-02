/**
 * Error Handler - 全局错误处理模块
 * 
 * 提供统一的错误处理、日志记录和恢复机制
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 错误日志文件
const LOG_FILE = path.join(__dirname, '../logs', `error-${new Date().toISOString().split('T')[0]}.log`);

/**
 * 错误分类
 */
export const ErrorTypes = {
  API_ERROR: 'API_ERROR',           // 外部API失败
  VALIDATION_ERROR: 'VALIDATION_ERROR', // 输入验证失败
  DATABASE_ERROR: 'DATABASE_ERROR',     // 数据库错误
  FILE_ERROR: 'FILE_ERROR',             // 文件操作错误
  NETWORK_ERROR: 'NETWORK_ERROR',       // 网络错误
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'        // 未知错误
};

/**
 * 统一的错误处理函数
 */
export async function handleError(error, context = {}) {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    type: classifyError(error),
    message: error.message,
    stack: error.stack,
    context,
    recoverable: isRecoverable(error)
  };
  
  // 记录到日志
  await logError(errorInfo);
  
  // 根据错误类型处理
  switch (errorInfo.type) {
    case ErrorTypes.API_ERROR:
      return handleApiError(error, context);
    case ErrorTypes.DATABASE_ERROR:
      return handleDatabaseError(error, context);
    case ErrorTypes.VALIDATION_ERROR:
      return handleValidationError(error, context);
    default:
      return handleUnknownError(error, context);
  }
}

function classifyError(error) {
  if (error.message?.includes('Apify') || error.message?.includes('API')) {
    return ErrorTypes.API_ERROR;
  }
  if (error.message?.includes('database') || error.message?.includes('supabase')) {
    return ErrorTypes.DATABASE_ERROR;
  }
  if (error.message?.includes('validation') || error.message?.includes('invalid')) {
    return ErrorTypes.VALIDATION_ERROR;
  }
  if (error.code === 'ENOENT' || error.code === 'EACCES') {
    return ErrorTypes.FILE_ERROR;
  }
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return ErrorTypes.NETWORK_ERROR;
  }
  return ErrorTypes.UNKNOWN_ERROR;
}

function isRecoverable(error) {
  // 可恢复的错误类型
  const recoverableCodes = [
    'ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED',
    'EAI_AGAIN', 'ENOTFOUND'
  ];
  return recoverableCodes.includes(error.code) || 
         error.message?.includes('timeout') ||
         error.message?.includes('rate limit');
}

async function handleApiError(error, context) {
  console.error(`\n❌ API Error: ${error.message}`);
  
  if (isRecoverable(error) && context.retryCount < 3) {
    console.log(`   Retrying... (${context.retryCount + 1}/3)`);
    await sleep(1000 * (context.retryCount + 1)); // 指数退避
    return { shouldRetry: true, retryCount: context.retryCount + 1 };
  }
  
  return { shouldRetry: false, fallback: context.fallback };
}

async function handleDatabaseError(error, context) {
  console.error(`\n❌ Database Error: ${error.message}`);
  
  // 检查是否是表不存在
  if (error.message?.includes('table') || error.message?.includes('relation')) {
    console.log('   ℹ️  Database tables may not be initialized.');
    console.log('   Run: npx supabase db push or create tables manually.');
  }
  
  return { shouldRetry: false, useLocalStorage: true };
}

async function handleValidationError(error, context) {
  console.error(`\n❌ Validation Error: ${error.message}`);
  console.log('   Please check your input and try again.');
  return { shouldRetry: false };
}

async function handleUnknownError(error, context) {
  console.error(`\n❌ Unexpected Error: ${error.message}`);
  console.log('   This has been logged. Please check logs/error-*.log');
  return { shouldRetry: false };
}

async function logError(errorInfo) {
  try {
    await fs.mkdir(path.dirname(LOG_FILE), { recursive: true });
    
    const logEntry = JSON.stringify(errorInfo) + '\n';
    await fs.appendFile(LOG_FILE, logEntry);
  } catch (e) {
    // 如果连日志都写不了，只能打印到控制台
    console.error('Failed to write error log:', e.message);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 包装异步函数，自动添加错误处理
 */
export function withErrorHandling(fn, options = {}) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      const result = await handleError(error, {
        function: fn.name,
        args,
        retryCount: options.retryCount || 0,
        fallback: options.fallback
      });
      
      if (result.shouldRetry && options.onRetry) {
        options.retryCount = result.retryCount;
        return withErrorHandling(fn, options)(...args);
      }
      
      if (result.fallback) {
        return result.fallback;
      }
      
      throw error; // 重新抛出，让上层处理
    }
  };
}

/**
 * 验证输入数据
 */
export function validateInput(data, schema) {
  const errors = [];
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    
    if (rules.required && !value) {
      errors.push(`${field} is required`);
      continue;
    }
    
    if (value && rules.minLength && value.length < rules.minLength) {
      errors.push(`${field} must be at least ${rules.minLength} characters`);
    }
    
    if (value && rules.maxLength && value.length > rules.maxLength) {
      errors.push(`${field} must be at most ${rules.maxLength} characters`);
    }
    
    if (value && rules.pattern && !rules.pattern.test(value)) {
      errors.push(`${field} format is invalid`);
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }
  
  return true;
}

/**
 * 安全的文件写入（带重试）
 */
export async function safeWriteFile(filePath, data, options = {}) {
  const maxRetries = options.maxRetries || 3;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, data);
      return true;
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      await sleep(100 * (i + 1));
    }
  }
}

/**
 * 超时包装器
 */
export function withTimeout(promise, ms, errorMessage = 'Operation timed out') {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), ms);
  });
  
  return Promise.race([promise, timeout]);
}

export default {
  handleError,
  withErrorHandling,
  validateInput,
  safeWriteFile,
  withTimeout,
  ErrorTypes
};
