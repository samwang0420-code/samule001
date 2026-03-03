-- Agentic Probing System Database Schema
-- 主动探测AI平台引用的数据库表

-- 1. AI探测结果表
CREATE TABLE IF NOT EXISTS public.ai_probing_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    
    -- 探测平台结果 (JSONB存储各平台数据)
    results JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- 探测统计
    platforms_tested INTEGER DEFAULT 0,
    brand_mentions INTEGER DEFAULT 0,
    citations_found INTEGER DEFAULT 0,
    
    -- 语义指纹匹配
    semantic_fingerprint_matches JSONB DEFAULT '[]'::jsonb,
    
    -- 探测时间
    probed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 语义指纹表
CREATE TABLE IF NOT EXISTS public.semantic_fingerprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    
    -- 指纹数据
    fingerprints JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- 埋入状态
    embedded_in_website BOOLEAN DEFAULT false,
    embedded_at TIMESTAMP WITH TIME ZONE,
    
    -- 检测统计
    detection_count INTEGER DEFAULT 0,
    last_detected_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Bing代理监控结果表
CREATE TABLE IF NOT EXISTS public.bing_monitoring_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    
    -- 关键词
    keyword TEXT NOT NULL,
    
    -- Bing排名
    bing_position INTEGER,
    bing_url TEXT,
    bing_title TEXT,
    
    -- SearchGPT预测
    searchgpt_probability INTEGER, -- 0-100
    searchgpt_prediction_reason TEXT,
    
    -- Rich/Deep Results
    in_deep_results BOOLEAN DEFAULT false,
    in_rich_results BOOLEAN DEFAULT false,
    
    -- 原始数据
    raw_bing_response JSONB,
    
    monitored_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. AI平台可见度综合评分表 (聚合视图)
CREATE TABLE IF NOT EXISTS public.ai_visibility_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    
    -- 综合评分
    overall_score INTEGER, -- 0-100
    
    -- 各平台评分
    perplexity_score INTEGER,
    searchgpt_score INTEGER,
    chatgpt_score INTEGER,
    claude_score INTEGER,
    gemini_score INTEGER,
    
    -- 指标详情
    total_mentions INTEGER DEFAULT 0,
    citation_rate INTEGER DEFAULT 0, -- 百分比
    semantic_match_rate INTEGER DEFAULT 0, -- 百分比
    
    -- 趋势
    trend TEXT CHECK (trend IN ('improving', 'stable', 'declining')),
    
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 探测任务队列表 (用于定时任务)
CREATE TABLE IF NOT EXISTS public.probing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    
    -- 任务配置
    job_type TEXT NOT NULL CHECK (job_type IN ('full_probe', 'quick_check', 'bing_monitor')),
    platforms JSONB DEFAULT '["perplexity", "bing"]'::jsonb,
    
    -- 任务状态
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    
    -- 执行信息
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    result_id UUID REFERENCES public.ai_probing_results(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引优化
CREATE INDEX idx_ai_probing_client ON public.ai_probing_results(client_id);
CREATE INDEX idx_ai_probing_date ON public.ai_probing_results(probed_at DESC);
CREATE INDEX idx_semantic_fp_client ON public.semantic_fingerprints(client_id);
CREATE INDEX idx_bing_monitoring_client ON public.bing_monitoring_results(client_id);
CREATE INDEX idx_bing_monitoring_keyword ON public.bing_monitoring_results(keyword);
CREATE INDEX idx_visibility_client ON public.ai_visibility_scores(client_id);
CREATE INDEX idx_visibility_date ON public.ai_visibility_scores(calculated_at DESC);
CREATE INDEX idx_probing_jobs_status ON public.probing_jobs(status);

-- 更新时间戳触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_semantic_fingerprints_updated_at ON public.semantic_fingerprints;
CREATE TRIGGER update_semantic_fingerprints_updated_at
    BEFORE UPDATE ON public.semantic_fingerprints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS策略 (如果需要)
-- ALTER TABLE public.ai_probing_results ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.semantic_fingerprints ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.bing_monitoring_results ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.ai_visibility_scores ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.ai_probing_results IS 'AI平台主动探测结果';
COMMENT ON TABLE public.semantic_fingerprints IS '客户网站语义指纹配置';
COMMENT ON TABLE public.bing_monitoring_results IS 'Bing排名监控及SearchGPT预测';
COMMENT ON TABLE public.ai_visibility_scores IS 'AI平台可见度综合评分';
COMMENT ON TABLE public.probing_jobs IS '探测任务队列';
