-- ==========================================
-- 双维度评分系统数据库Schema变更
-- 运行此SQL以支持SEO+GEO双评分
-- ==========================================

-- ==========================================
-- 1. 在clients表中添加双评分字段
-- ==========================================

-- 主评分字段 (SEO + GEO)
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS geo_score INTEGER DEFAULT 0;

-- SEO细分评分 (技术/内容/权威)
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS tech_seo_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS content_seo_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS authority_seo_score INTEGER DEFAULT 0;

-- GEO细分评分 (AI引用/知识图谱/品牌提及)
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS ai_citation_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS knowledge_graph_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS brand_mentions_score INTEGER DEFAULT 0;

-- 综合状态字段
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS dual_status VARCHAR(50) DEFAULT 'needs_improvement';

-- 更新时间字段
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ==========================================
-- 2. 在analysis_jobs表中添加评分字段
-- ==========================================

ALTER TABLE public.analysis_jobs
ADD COLUMN IF NOT EXISTS seo_score INTEGER,
ADD COLUMN IF NOT EXISTS geo_score INTEGER,
ADD COLUMN IF NOT EXISTS dual_score INTEGER,
ADD COLUMN IF NOT EXISTS analysis_details JSONB;

-- ==========================================
-- 3. 在questionnaire_submissions表中添加预期评分
-- ==========================================

ALTER TABLE public.questionnaire_submissions
ADD COLUMN IF NOT EXISTS estimated_seo_score INTEGER,
ADD COLUMN IF NOT EXISTS estimated_geo_score INTEGER,
ADD COLUMN IF NOT EXISTS priority_level VARCHAR(50) DEFAULT 'medium';

-- ==========================================
-- 4. 创建双评分视图 (用于Dashboard展示)
-- ==========================================

CREATE OR REPLACE VIEW public.client_dual_scores AS
SELECT 
    c.id,
    c.client_code,
    c.business_name,
    c.industry,
    c.website,
    c.email,
    -- 主评分
    c.seo_score,
    c.geo_score,
    -- 综合评分
    ROUND((c.seo_score + c.geo_score) / 2.0) as dual_score,
    -- SEO细分
    c.tech_seo_score,
    c.content_seo_score,
    c.authority_seo_score,
    -- GEO细分
    c.ai_citation_score,
    c.knowledge_graph_score,
    c.brand_mentions_score,
    -- 状态判断
    CASE 
        WHEN c.seo_score >= 80 AND c.geo_score >= 80 THEN 'excellent'
        WHEN c.seo_score >= 60 AND c.geo_score >= 60 THEN 'good'
        WHEN c.seo_score >= 40 OR c.geo_score >= 40 THEN 'needs_improvement'
        ELSE 'critical'
    END as overall_status,
    -- 优先级建议
    CASE 
        WHEN c.seo_score < c.geo_score THEN 'focus_seo'
        WHEN c.geo_score < c.seo_score THEN 'focus_geo'
        ELSE 'balanced'
    END as improvement_priority,
    c.status,
    c.created_at,
    c.updated_at
FROM public.clients c
WHERE c.status = 'active'
ORDER BY dual_score DESC;

-- ==========================================
-- 5. 创建评分历史视图 (用于趋势分析)
-- ==========================================

CREATE OR REPLACE VIEW public.client_score_trends AS
SELECT 
    aj.client_id,
    c.business_name,
    aj.created_at as analysis_date,
    aj.seo_score,
    aj.geo_score,
    aj.dual_score,
    LAG(aj.seo_score) OVER (PARTITION BY aj.client_id ORDER BY aj.created_at) as prev_seo_score,
    LAG(aj.geo_score) OVER (PARTITION BY aj.client_id ORDER BY aj.created_at) as prev_geo_score,
    aj.seo_score - LAG(aj.seo_score) OVER (PARTITION BY aj.client_id ORDER BY aj.created_at) as seo_change,
    aj.geo_score - LAG(aj.geo_score) OVER (PARTITION BY aj.client_id ORDER BY aj.created_at) as geo_change
FROM public.analysis_jobs aj
JOIN public.clients c ON aj.client_id = c.id
WHERE aj.status = 'completed'
ORDER BY aj.client_id, aj.created_at DESC;

-- ==========================================
-- 6. 创建评分统计视图 (用于Dashboard)
-- ==========================================

CREATE OR REPLACE VIEW public.dashboard_stats AS
SELECT 
    COUNT(*) as total_clients,
    ROUND(AVG(seo_score)) as avg_seo_score,
    ROUND(AVG(geo_score)) as avg_geo_score,
    ROUND(AVG((seo_score + geo_score) / 2.0)) as avg_dual_score,
    MAX(seo_score) as highest_seo,
    MAX(geo_score) as highest_geo,
    MIN(seo_score) as lowest_seo,
    MIN(geo_score) as lowest_geo,
    COUNT(CASE WHEN seo_score >= 80 AND geo_score >= 80 THEN 1 END) as excellent_count,
    COUNT(CASE WHEN seo_score >= 60 AND geo_score >= 60 THEN 1 END) as good_count,
    COUNT(CASE WHEN (seo_score >= 40 AND seo_score < 60) OR (geo_score >= 40 AND geo_score < 60) THEN 1 END) as needs_improvement_count,
    COUNT(CASE WHEN seo_score < 40 AND geo_score < 40 THEN 1 END) as critical_count
FROM public.clients
WHERE status = 'active';

-- ==========================================
-- 7. 权限设置
-- ==========================================

GRANT SELECT ON public.client_dual_scores TO authenticated;
GRANT SELECT ON public.client_score_trends TO authenticated;
GRANT SELECT ON public.dashboard_stats TO authenticated;

-- ==========================================
-- 8. 验证字段添加成功
-- ==========================================

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'clients'
AND column_name IN (
    'seo_score', 
    'geo_score', 
    'tech_seo_score', 
    'content_seo_score', 
    'authority_seo_score',
    'ai_citation_score',
    'knowledge_graph_score',
    'brand_mentions_score',
    'dual_status',
    'updated_at'
)
ORDER BY ordinal_position;

-- ==========================================
-- 9. 创建触发器: 自动更新时间戳
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 检查触发器是否已存在
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_clients_updated_at') THEN
        CREATE TRIGGER update_clients_updated_at
        BEFORE UPDATE ON public.clients
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ==========================================
-- 10. 示例: 初始化现有数据的双评分
-- ==========================================

-- 给现有客户添加默认评分 (基于现有geo_score)
UPDATE public.clients 
SET 
    seo_score = COALESCE(geo_score, 0),
    tech_seo_score = COALESCE(geo_score * 0.8, 0),
    content_seo_score = COALESCE(geo_score * 0.7, 0),
    authority_seo_score = COALESCE(geo_score * 0.6, 0),
    ai_citation_score = COALESCE(geo_score * 0.5, 0),
    knowledge_graph_score = COALESCE(geo_score * 0.4, 0),
    brand_mentions_score = COALESCE(geo_score * 0.3, 0),
    dual_status = CASE 
        WHEN geo_score >= 80 THEN 'excellent'
        WHEN geo_score >= 60 THEN 'good'
        WHEN geo_score >= 40 THEN 'needs_improvement'
        ELSE 'critical'
    END
WHERE seo_score IS NULL OR seo_score = 0;

-- ==========================================
-- 验证所有视图工作正常
-- ==========================================

-- 测试双评分视图
-- SELECT * FROM public.client_dual_scores LIMIT 5;

-- 测试Dashboard统计
-- SELECT * FROM public.dashboard_stats;

-- 测试评分趋势
-- SELECT * FROM public.client_score_trends LIMIT 5;

-- ==========================================
-- 完成!
-- ==========================================

/*
执行后请验证:
1. SELECT * FROM public.client_dual_scores;  -- 应显示双评分
2. SELECT * FROM public.dashboard_stats;      -- 应显示统计
3. SELECT * FROM public.clients LIMIT 1;      -- 应显示新字段
*/
