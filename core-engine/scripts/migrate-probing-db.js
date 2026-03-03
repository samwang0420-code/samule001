#!/usr/bin/env node
/**
 * Database Migration for Agentic Probing System
 * 使用Supabase客户端执行SQL迁移
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://fixemvsckapejyfwphft.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

const SQL = `
-- Agentic Probing System Database Schema

-- 1. AI探测结果表
CREATE TABLE IF NOT EXISTS public.ai_probing_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    results JSONB NOT NULL DEFAULT '[]'::jsonb,
    platforms_tested INTEGER DEFAULT 0,
    brand_mentions INTEGER DEFAULT 0,
    citations_found INTEGER DEFAULT 0,
    semantic_fingerprint_matches JSONB DEFAULT '[]'::jsonb,
    probed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 语义指纹表
CREATE TABLE IF NOT EXISTS public.semantic_fingerprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    fingerprints JSONB NOT NULL DEFAULT '[]'::jsonb,
    embedded_in_website BOOLEAN DEFAULT false,
    embedded_at TIMESTAMP WITH TIME ZONE,
    detection_count INTEGER DEFAULT 0,
    last_detected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Bing代理监控结果表
CREATE TABLE IF NOT EXISTS public.bing_monitoring_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    bing_position INTEGER,
    bing_url TEXT,
    bing_title TEXT,
    searchgpt_probability INTEGER,
    searchgpt_prediction_reason TEXT,
    in_deep_results BOOLEAN DEFAULT false,
    in_rich_results BOOLEAN DEFAULT false,
    raw_bing_response JSONB,
    monitored_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. AI平台可见度综合评分表
CREATE TABLE IF NOT EXISTS public.ai_visibility_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    overall_score INTEGER,
    perplexity_score INTEGER,
    searchgpt_score INTEGER,
    chatgpt_score INTEGER,
    claude_score INTEGER,
    gemini_score INTEGER,
    total_mentions INTEGER DEFAULT 0,
    citation_rate INTEGER DEFAULT 0,
    semantic_match_rate INTEGER DEFAULT 0,
    trend TEXT CHECK (trend IN ('improving', 'stable', 'declining')),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 探测任务队列表
CREATE TABLE IF NOT EXISTS public.probing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL CHECK (job_type IN ('full_probe', 'quick_check', 'bing_monitor')),
    platforms JSONB DEFAULT '["perplexity", "bing"]'::jsonb,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    result_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_ai_probing_client ON public.ai_probing_results(client_id);
CREATE INDEX IF NOT EXISTS idx_ai_probing_date ON public.ai_probing_results(probed_at DESC);
CREATE INDEX IF NOT EXISTS idx_semantic_fp_client ON public.semantic_fingerprints(client_id);
CREATE INDEX IF NOT EXISTS idx_bing_monitoring_client ON public.bing_monitoring_results(client_id);
CREATE INDEX IF NOT EXISTS idx_bing_monitoring_keyword ON public.bing_monitoring_results(keyword);
CREATE INDEX IF NOT EXISTS idx_visibility_client ON public.ai_visibility_scores(client_id);
CREATE INDEX IF NOT EXISTS idx_visibility_date ON public.ai_visibility_scores(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_probing_jobs_status ON public.probing_jobs(status);
`;

async function runMigration() {
  console.log('🗄️  Running database migration for Agentic Probing...\n');
  
  try {
    // 使用Supabase的exec_sql函数执行SQL (如果有)
    // 或者逐个检查表是否存在
    
    const tables = [
      'ai_probing_results',
      'semantic_fingerprints',
      'bing_monitoring_results',
      'ai_visibility_scores',
      'probing_jobs'
    ];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (error && error.code === 'PGRST116') {
        console.log(`   ❌ Table ${table} does not exist`);
      } else if (error) {
        console.log(`   ⚠️  Table ${table} error:`, error.message);
      } else {
        console.log(`   ✅ Table ${table} exists`);
      }
    }
    
    console.log('\n⚠️  Please run the SQL manually in Supabase Dashboard:');
    console.log('1. Go to: https://app.supabase.com/project/fixemvsckapejyfwphft');
    console.log('2. Navigate to: SQL Editor → New query');
    console.log('3. Copy and paste the SQL from: supabase/add-agentic-probing-schema.sql');
    console.log('4. Click Run');
    
    // 保存SQL到文件供参考
    console.log('\n📄 SQL saved to: supabase/add-agentic-probing-schema.sql');
    
  } catch (error) {
    console.error('❌ Migration check failed:', error.message);
    process.exit(1);
  }
}

runMigration();
