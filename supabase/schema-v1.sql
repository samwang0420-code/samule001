-- Supabase Schema v1.0 - Core Tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CLIENTS (律所客户)
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_code TEXT UNIQUE NOT NULL, -- e.g., "client_1772389766088"
    firm_name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT DEFAULT 'Houston',
    state TEXT DEFAULT 'TX',
    zip TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    practice_area TEXT DEFAULT 'immigration',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- GEO_AUDITS (GEO审计记录)
-- ============================================
CREATE TABLE IF NOT EXISTS geo_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    total_score INTEGER NOT NULL CHECK (total_score BETWEEN 0 AND 100),
    coordinate_precision INTEGER CHECK (coordinate_precision BETWEEN 0 AND 25),
    parking_accessibility INTEGER CHECK (parking_accessibility BETWEEN 0 AND 25),
    schema_markup INTEGER CHECK (schema_markup BETWEEN 0 AND 30),
    local_context INTEGER CHECK (local_context BETWEEN 0 AND 20),
    current_rank INTEGER,
    potential_rank INTEGER,
    competitor_count INTEGER DEFAULT 127,
    strengths TEXT[],
    weaknesses TEXT[],
    raw_data JSONB, -- 原始Apify数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SCHEMA_DEPLOYMENTS (Schema部署记录)
-- ============================================
CREATE TABLE IF NOT EXISTS schema_deployments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    schema_json JSONB NOT NULL,
    deployed_at TIMESTAMP WITH TIME ZONE,
    deployed_by TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'deployed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- KEYWORDS (追踪的关键词)
-- ============================================
CREATE TABLE IF NOT EXISTS keywords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    location TEXT DEFAULT 'Houston, TX',
    search_volume INTEGER, -- 月搜索量
    difficulty INTEGER, -- 竞争难度 0-100
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, keyword)
);

-- ============================================
-- RANKINGS (排名历史)
-- ============================================
CREATE TABLE IF NOT EXISTS rankings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    keyword_id UUID REFERENCES keywords(id) ON DELETE CASCADE,
    position INTEGER NOT NULL, -- 排名位置
    page INTEGER DEFAULT 1, -- 第几页
    serp_features TEXT[], -- ['local_pack', 'knowledge_panel', 'ads']
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- COMPETITORS (竞争对手)
-- ============================================
CREATE TABLE IF NOT EXISTS competitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    website TEXT,
    gmb_url TEXT,
    current_rank INTEGER,
    geo_score INTEGER,
    is_tracking BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- COMPETITOR_RANKINGS (对手排名历史)
-- ============================================
CREATE TABLE IF NOT EXISTS competitor_rankings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE,
    keyword_id UUID REFERENCES keywords(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ACTIVITY_LOG (操作日志)
-- ============================================
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'audit', 'schema_deploy', 'rank_check', etc.
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES (索引优化)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_clients_code ON clients(client_code);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

CREATE INDEX IF NOT EXISTS idx_audits_client ON geo_audits(client_id);
CREATE INDEX IF NOT EXISTS idx_audits_created ON geo_audits(created_at);

CREATE INDEX IF NOT EXISTS idx_keywords_client ON keywords(client_id);
CREATE INDEX IF NOT EXISTS idx_keywords_active ON keywords(is_active);

CREATE INDEX IF NOT EXISTS idx_rankings_keyword ON rankings(keyword_id);
CREATE INDEX IF NOT EXISTS idx_rankings_checked ON rankings(checked_at);

CREATE INDEX IF NOT EXISTS idx_competitors_client ON competitors(client_id);

-- ============================================
-- ROW LEVEL SECURITY (多租户安全)
-- ============================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE geo_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;

-- 简单策略: 所有用户可读写 (后续可按tenant_id隔离)
CREATE POLICY "Allow all" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all" ON geo_audits FOR ALL USING (true);
CREATE POLICY "Allow all" ON keywords FOR ALL USING (true);
CREATE POLICY "Allow all" ON rankings FOR ALL USING (true);
CREATE POLICY "Allow all" ON competitors FOR ALL USING (true);

-- ============================================
-- FUNCTIONS (辅助函数)
-- ============================================

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 获取客户最新GEO分数
CREATE OR REPLACE FUNCTION get_client_latest_geo_score(client_uuid UUID)
RETURNS TABLE (
    total_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT ga.total_score, ga.created_at
    FROM geo_audits ga
    WHERE ga.client_id = client_uuid
    ORDER BY ga.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 获取排名变化 (7天)
CREATE OR REPLACE FUNCTION get_ranking_change_7days(keyword_uuid UUID)
RETURNS TABLE (
    current_position INTEGER,
    position_7days_ago INTEGER,
    change INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH current_rank AS (
        SELECT position FROM rankings 
        WHERE keyword_id = keyword_uuid 
        ORDER BY checked_at DESC LIMIT 1
    ),
    week_ago_rank AS (
        SELECT position FROM rankings 
        WHERE keyword_id = keyword_uuid 
        AND checked_at <= NOW() - INTERVAL '7 days'
        ORDER BY checked_at DESC LIMIT 1
    )
    SELECT 
        c.position,
        w.position,
        (w.position - c.position)
    FROM current_rank c, week_ago_rank w;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE DATA (测试数据)
-- ============================================

-- 测试客户
INSERT INTO clients (client_code, firm_name, address, email, website)
VALUES (
    'client_demo_001',
    'Demo Immigration Law',
    '123 Test St, Houston, TX 77002',
    'demo@example.com',
    'https://demo-law.com'
)
ON CONFLICT (client_code) DO NOTHING;

-- 测试关键词
INSERT INTO keywords (client_id, keyword, search_volume, difficulty)
SELECT 
    id,
    'immigration lawyer houston',
    2400,
    65
FROM clients WHERE client_code = 'client_demo_001'
ON CONFLICT DO NOTHING;
