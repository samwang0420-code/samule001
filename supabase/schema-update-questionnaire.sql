-- Database Schema Update - 支持新问卷字段
-- Run this in Supabase SQL Editor

-- ==========================================
-- UPDATE clients TABLE - 新增字段
-- ==========================================

-- 添加公司详细信息字段
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS website VARCHAR(500),
ADD COLUMN IF NOT EXISTS business_description TEXT,
ADD COLUMN IF NOT EXISTS company_size VARCHAR(50),
ADD COLUMN IF NOT EXISTS year_established INTEGER,
ADD COLUMN IF NOT EXISTS service_area VARCHAR(255);

-- 添加SEO目标字段
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS target_keywords TEXT[],
ADD COLUMN IF NOT EXISTS competitors JSONB,
ADD COLUMN IF NOT EXISTS current_challenges TEXT,
ADD COLUMN IF NOT EXISTS expected_goals TEXT;

-- 添加联系人详细信息
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS contact_job_title VARCHAR(100),
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS contact_messaging VARCHAR(100),
ADD COLUMN IF NOT EXISTS additional_notes TEXT;

-- 添加提交来源追踪
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS source VARCHAR(100) DEFAULT 'questionnaire',
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- ==========================================
-- UPDATE keywords TABLE - 扩展字段
-- ==========================================

-- 添加关键词分类和优先级
ALTER TABLE public.keywords 
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS search_volume INTEGER,
ADD COLUMN IF NOT EXISTS cpc DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- ==========================================
-- NEW TABLE: questionnaire_submissions
-- ==========================================

-- 专门存储问卷提交的原始数据
CREATE TABLE IF NOT EXISTS public.questionnaire_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    
    -- 公司信息
    website VARCHAR(500) NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    business_description TEXT,
    company_size VARCHAR(50),
    year_established INTEGER,
    service_area VARCHAR(255),
    
    -- SEO目标
    target_keywords TEXT[],
    competitors JSONB,
    current_challenges TEXT,
    expected_goals TEXT,
    
    -- 联系人信息
    contact_name VARCHAR(100) NOT NULL,
    contact_job_title VARCHAR(100),
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    contact_messaging VARCHAR(100),
    additional_notes TEXT,
    
    -- 元数据
    source VARCHAR(100) DEFAULT 'questionnaire',
    ip_address INET,
    user_agent TEXT,
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES public.users(id)
);

-- 为问卷提交表创建索引
CREATE INDEX IF NOT EXISTS idx_questionnaire_client_id ON public.questionnaire_submissions(client_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_email ON public.questionnaire_submissions(contact_email);
CREATE INDEX IF NOT EXISTS idx_questionnaire_created_at ON public.questionnaire_submissions(created_at);

-- ==========================================
-- NEW TABLE: analysis_jobs
-- ==========================================

-- 存储分析任务的队列
CREATE TABLE IF NOT EXISTS public.analysis_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES public.questionnaire_submissions(id),
    
    -- 任务状态
    status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed
    priority INTEGER DEFAULT 1,
    
    -- 任务配置
    config JSONB,
    
    -- 结果
    results JSONB,
    error_message TEXT,
    
    -- 执行记录
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);

-- 为任务表创建索引
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.analysis_jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_client_id ON public.analysis_jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.analysis_jobs(created_at);

-- ==========================================
-- VIEWS - 方便查询
-- ==========================================

-- 创建问卷提交概览视图
CREATE OR REPLACE VIEW public.questionnaire_overview AS
SELECT 
    qs.id,
    qs.business_name,
    qs.industry,
    qs.contact_email,
    qs.contact_name,
    qs.created_at,
    qs.processed_at,
    CASE 
        WHEN qs.processed_at IS NOT NULL THEN 'processed'
        ELSE 'pending'
    END as status,
    array_length(qs.target_keywords, 1) as keyword_count
FROM public.questionnaire_submissions qs
ORDER BY qs.created_at DESC;

-- ==========================================
-- FUNCTIONS - 自动化处理
-- ==========================================

-- 自动从问卷创建客户记录
CREATE OR REPLACE FUNCTION create_client_from_questionnaire()
RETURNS TRIGGER AS $$
BEGIN
    -- 创建客户记录
    INSERT INTO public.clients (
        client_code,
        business_name,
        industry,
        website,
        email,
        services,
        target_keywords,
        status,
        created_at
    ) VALUES (
        'CLI_' || EXTRACT(EPOCH FROM NOW())::INTEGER,
        NEW.business_name,
        NEW.industry,
        NEW.website,
        NEW.contact_email,
        NEW.target_keywords,
        NEW.target_keywords,
        'active',
        NOW()
    )
    RETURNING id INTO NEW.client_id;
    
    -- 标记为已处理
    NEW.processed_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器（可选，如果需要自动处理）
-- CREATE TRIGGER auto_create_client
--     AFTER INSERT ON public.questionnaire_submissions
--     FOR EACH ROW
--     EXECUTE FUNCTION create_client_from_questionnaire();

-- ==========================================
-- RLS POLICIES - 权限控制
-- ==========================================

-- 为问卷提交表启用RLS
ALTER TABLE public.questionnaire_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_jobs ENABLE ROW LEVEL SECURITY;

-- 管理员可以查看所有
CREATE POLICY questionnaire_admin_all ON public.questionnaire_submissions
    FOR ALL USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

CREATE POLICY jobs_admin_all ON public.analysis_jobs
    FOR ALL USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

-- ==========================================
-- GRANTS - 权限授予
-- ==========================================

GRANT ALL ON public.questionnaire_submissions TO authenticated;
GRANT ALL ON public.analysis_jobs TO authenticated;
GRANT ALL ON public.questionnaire_overview TO authenticated;

-- ==========================================
-- 说明
-- ==========================================

/*
新增表说明:
1. questionnaire_submissions - 存储问卷原始提交数据
2. analysis_jobs - 分析任务队列

新增字段说明:
- clients表: 扩展了公司详细信息、SEO目标、联系人信息
- keywords表: 增加了分类、优先级、搜索量等字段

执行后请验证:
1. 检查表结构是否正确
2. 测试插入新字段数据
3. 验证视图是否能正常查询
*/
