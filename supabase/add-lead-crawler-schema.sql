-- Lead Crawler System Schema
-- 存储爬取的潜在客户数据

-- ==========================================
-- 1. 创建leads主表
-- ==========================================

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 基本信息
    business_name TEXT NOT NULL,
    website TEXT,
    phone TEXT,
    email TEXT,
    
    -- 地址信息
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'US',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Google Maps信息
    google_maps_url TEXT,
    google_maps_rating DECIMAL(3, 2),
    google_maps_reviews_count INTEGER,
    place_id TEXT,
    
    -- 行业信息
    category TEXT,
    subcategory TEXT,
    industry TEXT,
    
    -- 评分数据 (爬取后分析)
    seo_score INTEGER,
    geo_score INTEGER,
    dual_score INTEGER,
    
    -- PDF报告
    pdf_url TEXT,
    pdf_generated_at TIMESTAMP WITH TIME ZONE,
    
    -- 处理状态
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'analyzing', 'pdf_generated', 'contacted', 'converted', 'disqualified')),
    
    -- 优先级
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    
    -- 来源追踪
    source_type VARCHAR(50) DEFAULT 'apify' CHECK (source_type IN ('apify', 'manual', 'import')),
    source_actor TEXT,
    source_query TEXT,
    
    -- 联系记录
    last_contacted_at TIMESTAMP WITH TIME ZONE,
    contact_notes TEXT,
    assigned_to TEXT,
    
    -- 时间戳
    crawled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. 创建leads搜索配置表
-- ==========================================

CREATE TABLE IF NOT EXISTS public.lead_search_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 搜索配置
    name TEXT NOT NULL,
    search_keyword TEXT NOT NULL,
    location TEXT NOT NULL,
    industry TEXT,
    
    -- Apify Actor配置
    actor_id TEXT DEFAULT 'xmiso_scrapers/millions-us-businesses-leads-with-emails-from-google-maps',
    apify_token TEXT,
    
    -- 搜索参数
    max_leads INTEGER DEFAULT 100,
    include_email BOOLEAN DEFAULT true,
    include_phone BOOLEAN DEFAULT true,
    include_website BOOLEAN DEFAULT true,
    
    -- 地理限制
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    radius_meters INTEGER,
    
    -- 状态
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'error')),
    
    -- 执行统计
    last_run_at TIMESTAMP WITH TIME ZONE,
    leads_found INTEGER DEFAULT 0,
    pdfs_generated INTEGER DEFAULT 0,
    
    -- 自动执行
    auto_run BOOLEAN DEFAULT false,
    run_frequency VARCHAR(20) CHECK (run_frequency IN ('hourly', 'daily', 'weekly', 'monthly')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. 创建leads爬取日志表
-- ==========================================

CREATE TABLE IF NOT EXISTS public.lead_crawl_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID REFERENCES public.lead_search_configs(id),
    
    -- 执行信息
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    
    -- 统计
    leads_found INTEGER DEFAULT 0,
    leads_inserted INTEGER DEFAULT 0,
    pdfs_generated INTEGER DEFAULT 0,
    
    -- 错误信息
    error_message TEXT,
    apify_run_id TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4. 创建视图: Lead Dashboard
-- ==========================================

CREATE OR REPLACE VIEW public.lead_dashboard AS
SELECT 
    l.*,
    CASE 
        WHEN l.seo_score IS NULL THEN 'pending_analysis'
        WHEN l.pdf_url IS NULL THEN 'pending_pdf'
        ELSE 'ready'
    END as processing_status,
    CASE 
        WHEN l.dual_score >= 80 THEN 'hot'
        WHEN l.dual_score >= 60 THEN 'warm'
        WHEN l.dual_score >= 40 THEN 'cold'
        ELSE 'frozen'
    END as lead_temperature
FROM public.leads l
WHERE l.status != 'disqualified'
ORDER BY l.dual_score DESC NULLS LAST, l.crawled_at DESC;

-- ==========================================
-- 5. 创建视图: Lead统计
-- ==========================================

CREATE OR REPLACE VIEW public.lead_stats AS
SELECT 
    COUNT(*) as total_leads,
    COUNT(CASE WHEN status = 'new' THEN 1 END) as new_leads,
    COUNT(CASE WHEN status = 'pdf_generated' THEN 1 END) as ready_leads,
    COUNT(CASE WHEN status = 'contacted' THEN 1 END) as contacted_leads,
    COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted_leads,
    
    COUNT(CASE WHEN pdf_url IS NOT NULL THEN 1 END) as pdfs_generated,
    
    ROUND(AVG(seo_score)) as avg_seo_score,
    ROUND(AVG(geo_score)) as avg_geo_score,
    ROUND(AVG(dual_score)) as avg_dual_score,
    
    COUNT(CASE WHEN crawled_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as leads_24h,
    COUNT(CASE WHEN crawled_at >= NOW() - INTERVAL '7 days' THEN 1 END) as leads_7d
FROM public.leads;

-- ==========================================
-- 6. 索引优化
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_industry ON public.leads(industry);
CREATE INDEX IF NOT EXISTS idx_leads_city ON public.leads(city);
CREATE INDEX IF NOT EXISTS idx_leads_dual_score ON public.leads(dual_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_leads_crawled_at ON public.leads(crawled_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON public.leads(priority);

CREATE INDEX IF NOT EXISTS idx_lead_configs_status ON public.lead_search_configs(status);
CREATE INDEX IF NOT EXISTS idx_crawl_logs_config ON public.lead_crawl_logs(config_id);

-- ==========================================
-- 7. 触发器: 自动更新updated_at
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lead_configs_updated_at ON public.lead_search_configs;
CREATE TRIGGER update_lead_configs_updated_at
    BEFORE UPDATE ON public.lead_search_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 8. RLS策略
-- ==========================================

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_search_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY leads_admin_all ON public.leads
    FOR ALL USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

CREATE POLICY lead_configs_admin_all ON public.lead_search_configs
    FOR ALL USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

-- ==========================================
-- 9. 权限授予
-- ==========================================

GRANT ALL ON public.leads TO authenticated;
GRANT ALL ON public.lead_search_configs TO authenticated;
GRANT ALL ON public.lead_crawl_logs TO authenticated;
GRANT SELECT ON public.lead_dashboard TO authenticated;
GRANT SELECT ON public.lead_stats TO authenticated;

-- ==========================================
-- 10. 验证
-- ==========================================

SELECT 'Tables created successfully' as status;

-- 验证表结构
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('leads', 'lead_search_configs', 'lead_crawl_logs')
ORDER BY table_name, ordinal_position;
