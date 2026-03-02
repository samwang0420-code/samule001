-- Supabase Schema v1.0 - Simplified for manual execution
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/_/sql

-- ============================================
-- 1. CLIENTS (客户表)
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_code TEXT UNIQUE NOT NULL,
    firm_name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT DEFAULT 'Houston',
    state TEXT DEFAULT 'TX',
    zip TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    practice_area TEXT DEFAULT 'Medical Spa',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. GEO_AUDITS (审计记录)
-- ============================================
CREATE TABLE IF NOT EXISTS geo_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. KEYWORDS (关键词追踪)
-- ============================================
CREATE TABLE IF NOT EXISTS keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    location TEXT DEFAULT 'Houston, TX',
    search_volume INTEGER,
    difficulty INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, keyword)
);

-- ============================================
-- 4. RANKINGS (排名历史)
-- ============================================
CREATE TABLE IF NOT EXISTS rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword_id UUID REFERENCES keywords(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    page INTEGER DEFAULT 1,
    serp_features TEXT[],
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. COMPETITORS (竞争对手)
-- ============================================
CREATE TABLE IF NOT EXISTS competitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
-- 6. ACTIVITY_LOG (操作日志)
-- ============================================
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 索引优化
-- ============================================
CREATE INDEX IF NOT EXISTS idx_clients_code ON clients(client_code);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_audits_client ON geo_audits(client_id);
CREATE INDEX IF NOT EXISTS idx_keywords_client ON keywords(client_id);
CREATE INDEX IF NOT EXISTS idx_rankings_keyword ON rankings(keyword_id);
CREATE INDEX IF NOT EXISTS idx_rankings_checked ON rankings(checked_at);
CREATE INDEX IF NOT EXISTS idx_competitors_client ON competitors(client_id);

-- ============================================
-- 行级安全策略 (RLS)
-- ============================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE geo_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- 允许所有操作 (简化版，生产环境应更严格)
CREATE POLICY "Allow all" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all" ON geo_audits FOR ALL USING (true);
CREATE POLICY "Allow all" ON keywords FOR ALL USING (true);
CREATE POLICY "Allow all" ON rankings FOR ALL USING (true);
CREATE POLICY "Allow all" ON competitors FOR ALL USING (true);
CREATE POLICY "Allow all" ON activity_log FOR ALL USING (true);

-- ============================================
-- 更新触发器
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 验证创建成功
-- ============================================
SELECT 'Tables created successfully!' as status;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';
