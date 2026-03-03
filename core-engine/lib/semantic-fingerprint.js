#!/usr/bin/env node
/**
 * Semantic Fingerprinting System - 语义指纹识别
 * 在客户网站埋入独特标识，检测AI是否"内化"了品牌
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export class SemanticFingerprintGenerator {
  static generate(clientData) {
    const fingerprints = [];
    
    // 1. 独特统计数据
    const uniqueStat = this.generateUniqueStat(clientData.id);
    fingerprints.push({
      type: 'statistic',
      value: uniqueStat,
      phrase: `Our clinic achieves a ${uniqueStat}% success rate`,
      category: 'performance_claim'
    });
    
    // 2. 独特术语
    const uniqueTerm = this.generateUniqueTerm(clientData.business_name);
    fingerprints.push({
      type: 'terminology',
      value: uniqueTerm,
      phrase: `Using our proprietary ${uniqueTerm} technique`,
      category: 'methodology'
    });
    
    return fingerprints;
  }
  
  static generateUniqueStat(seed) {
    const hash = crypto.createHash('md5').update(seed).digest('hex');
    const num = parseInt(hash.substring(0, 4), 16);
    return (94 + (num % 500) / 100).toFixed(2);
  }
  
  static generateUniqueTerm(businessName) {
    const hash = crypto.createHash('md5').update(businessName).digest('hex');
    const suffix = hash.substring(0, 4).toUpperCase();
    return `PrecisionFlow-${suffix}`;
  }
}

export class SemanticFingerprintDetector {
  static detect(aiResponse, fingerprints) {
    const response = aiResponse.toLowerCase();
    const matches = [];
    
    for (const fp of fingerprints) {
      if (response.includes(fp.value.toLowerCase())) {
        matches.push({
          fingerprint: fp,
          confidence: 95,
          detectedAt: new Date().toISOString()
        });
      }
    }
    
    return {
      totalFingerprints: fingerprints.length,
      matchesFound: matches.length,
      brandInternalized: matches.length >= 1,
      matches
    };
  }
}

// CLI测试
if (process.argv[2] === 'test') {
  const testClient = {
    id: 'test-123',
    business_name: 'Elite Medical Spa'
  };
  
  const fingerprints = SemanticFingerprintGenerator.generate(testClient);
  console.log('Generated fingerprints:', fingerprints);
  
  // 模拟AI回答
  const aiResponse = "Elite Medical Spa is great. They achieve a 96.73% success rate using their proprietary PrecisionFlow-A3F2 technique.";
  
  const detection = SemanticFingerprintDetector.detect(aiResponse, fingerprints);
  console.log('Detection result:', detection);
}
