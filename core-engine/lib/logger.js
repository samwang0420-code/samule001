#!/usr/bin/env node
/**
 * Logger - 结构化日志系统
 * 
 * 提供多级别日志、日志轮转、性能监控
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const currentLogLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? LOG_LEVELS.INFO;

/**
 * 日志记录器类
 */
class Logger {
  constructor(module) {
    this.module = module;
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDir();
  }
  
  async ensureLogDir() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (e) {
      // 忽略错误
    }
  }
  
  async log(level, message, metadata = {}) {
    if (LOG_LEVELS[level] > currentLogLevel) return;
    
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      module: this.module,
      message,
      ...metadata
    };
    
    // 控制台输出
    const color = this.getColor(level);
    console.log(`${color}[${level}] ${this.module}: ${message}\x1b[0m`);
    
    // 文件写入
    await this.writeToFile(entry);
  }
  
  getColor(level) {
    switch (level) {
      case 'ERROR': return '\x1b[31m'; // 红色
      case 'WARN': return '\x1b[33m';  // 黄色
      case 'INFO': return '\x1b[36m';  // 青色
      case 'DEBUG': return '\x1b[90m'; // 灰色
      default: return '\x1b[0m';
    }
  }
  
  async writeToFile(entry) {
    try {
      const date = new Date().toISOString().split('T')[0];
      const logFile = path.join(this.logDir, `app-${date}.jsonl`);
      
      await fs.appendFile(logFile, JSON.stringify(entry) + '\n');
    } catch (e) {
      // 文件写入失败不影响程序运行
    }
  }
  
  error(message, metadata) {
    return this.log('ERROR', message, metadata);
  }
  
  warn(message, metadata) {
    return this.log('WARN', message, metadata);
  }
  
  info(message, metadata) {
    return this.log('INFO', message, metadata);
  }
  
  debug(message, metadata) {
    return this.log('DEBUG', message, metadata);
  }
  
  /**
   * 性能计时
   */
  async time(label, fn) {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.info(`${label} completed`, { duration: Math.round(duration) + 'ms' });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`${label} failed`, { duration: Math.round(duration) + 'ms', error: error.message });
      throw error;
    }
  }
}

/**
 * 创建日志记录器
 */
export function createLogger(module) {
  return new Logger(module);
}

/**
 * 查看日志
 */
export async function viewLogs(options = {}) {
  const { date = new Date().toISOString().split('T')[0], level, limit = 50 } = options;
  
  try {
    const logFile = path.join(__dirname, '../logs', `app-${date}.jsonl`);
    const content = await fs.readFile(logFile, 'utf8');
    
    const entries = content
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line))
      .filter(entry => !level || entry.level === level)
      .slice(-limit);
    
    return entries;
  } catch (e) {
    return [];
  }
}

/**
 * 清理旧日志
 */
export async function cleanupLogs(daysToKeep = 7) {
  const logDir = path.join(__dirname, '../logs');
  const cutoff = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
  
  try {
    const files = await fs.readdir(logDir);
    let cleaned = 0;
    
    for (const file of files) {
      if (!file.startsWith('app-') || !file.endsWith('.jsonl')) continue;
      
      const filePath = path.join(logDir, file);
      const stats = await fs.stat(filePath);
      
      if (stats.mtimeMs < cutoff) {
        await fs.unlink(filePath);
        cleaned++;
      }
    }
    
    return { cleaned };
  } catch (e) {
    return { cleaned: 0, error: e.message };
  }
}

export default { createLogger, viewLogs, cleanupLogs };
