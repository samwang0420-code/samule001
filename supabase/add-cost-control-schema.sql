-- Cost Control Database Schema - 成本控制数据库表

-- 1. 成本追踪表
CREATE TABLE IF NOT EXISTS public.cost_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    daily_cost DECIMAL(10, 4) DEFAULT 0,
    monthly_cost DECIMAL(10, 4) DEFAULT 0,
    query_count INTEGER DEFAULT 0,
    cache_hits INTEGER DEFAULT 0,
    api_calls INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 查询缓存表
CREATE TABLE IF NOT EXISTS public.query_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key TEXT NOT NULL UNIQUE,
    query TEXT NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    result JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 探测结果成本记录 (添加到现有表)
-- 修改 ai_probing_results 表添加成本字段
ALTER TABLE public.ai_probing_results 
ADD COLUMN IF NOT EXISTS cost_usd DECIMAL(10, 4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS from_cache BOOLEAN DEFAULT false;

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_cost_tracking_date ON public.cost_tracking(date);
CREATE INDEX IF NOT EXISTS idx_query_cache_key ON public.query_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_query_cache_expires ON public.query_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_query_cache_client ON public.query_cache(client_id);

-- 创建自动清理过期缓存的函数
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM public.query_cache 
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 注释
COMMENT ON TABLE public.cost_tracking IS '每日API成本追踪';
COMMENT ON TABLE public.query_cache IS '查询结果缓存，避免重复API调用';
