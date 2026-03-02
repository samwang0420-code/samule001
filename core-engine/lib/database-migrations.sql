-- Supabase Database Setup - Complete Schema
-- Run this in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- USERS TABLE (for dashboard authentication)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user', -- admin, user, client
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- CLIENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    client_code VARCHAR(50) UNIQUE NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(500),
    industry VARCHAR(100) DEFAULT 'medical',
    services TEXT[], -- Array of services
    gmb_url VARCHAR(500),
    gmb_place_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active', -- active, paused, cancelled
    plan_type VARCHAR(50) DEFAULT 'growth', -- growth, scale, enterprise
    monthly_fee DECIMAL(10,2) DEFAULT 500.00,
    setup_fee_paid BOOLEAN DEFAULT false,
    subscription_start_date DATE,
    subscription_end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- KEYWORDS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.keywords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    keyword VARCHAR(255) NOT NULL,
    search_volume INTEGER,
    difficulty INTEGER, -- 0-100
    current_rank INTEGER,
    target_rank INTEGER DEFAULT 1,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, keyword)
);

-- ==========================================
-- RANKINGS TABLE (daily snapshots)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.rankings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    keyword_id UUID REFERENCES public.keywords(id) ON DELETE CASCADE,
    rank INTEGER NOT NULL,
    previous_rank INTEGER,
    rank_change INTEGER,
    search_results_page INTEGER, -- which SERP page
    serp_features TEXT[], -- featured snippet, local pack, etc.
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- AI CITATIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.ai_citations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    platform VARCHAR(100) NOT NULL, -- perplexity, chatgpt, claude
    query TEXT NOT NULL,
    answer_snippet TEXT,
    client_mentioned BOOLEAN DEFAULT false,
    client_rank INTEGER, -- position in sources
    total_sources INTEGER,
    source_url VARCHAR(500),
    citation_probability DECIMAL(5,2),
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- COMPETITORS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.competitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    address TEXT,
    website VARCHAR(500),
    gmb_rating DECIMAL(2,1),
    gmb_review_count INTEGER,
    avg_rank INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- REPORTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL, -- weekly, monthly, quarterly
    report_date DATE NOT NULL,
    data JSONB NOT NULL, -- Flexible JSON data
    file_url VARCHAR(500), -- Link to generated file
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ACTIVITY LOG TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- analysis_started, report_sent, etc.
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- SUBSCRIPTIONS TABLE (for billing)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    plan_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- active, cancelled, past_due
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_keywords_client_id ON public.keywords(client_id);
CREATE INDEX IF NOT EXISTS idx_rankings_client_id ON public.rankings(client_id);
CREATE INDEX IF NOT EXISTS idx_rankings_checked_at ON public.rankings(checked_at);
CREATE INDEX IF NOT EXISTS idx_rankings_keyword_id ON public.rankings(keyword_id);
CREATE INDEX IF NOT EXISTS idx_ai_citations_client_id ON public.ai_citations(client_id);
CREATE INDEX IF NOT EXISTS idx_ai_citations_checked_at ON public.ai_citations(checked_at);
CREATE INDEX IF NOT EXISTS idx_reports_client_id ON public.reports(client_id);
CREATE INDEX IF NOT EXISTS idx_reports_date ON public.reports(report_date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_client_id ON public.activity_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);

-- ==========================================
-- VIEWS
-- ==========================================

-- Client overview view
CREATE OR REPLACE VIEW public.client_overview AS
SELECT 
    c.id,
    c.business_name,
    c.industry,
    c.status,
    c.plan_type,
    COUNT(DISTINCT k.id) as keyword_count,
    COUNT(DISTINCT comp.id) as competitor_count,
    AVG(r.rank) FILTER (WHERE r.checked_at > NOW() - INTERVAL '7 days') as avg_rank_7d,
    MAX(r.checked_at) as last_check_at,
    c.created_at
FROM public.clients c
LEFT JOIN public.keywords k ON k.client_id = c.id
LEFT JOIN public.competitors comp ON comp.client_id = c.id
LEFT JOIN public.rankings r ON r.client_id = c.id
GROUP BY c.id, c.business_name, c.industry, c.status, c.plan_type, c.created_at;

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_keywords_updated_at BEFORE UPDATE ON public.keywords
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitors_updated_at BEFORE UPDATE ON public.competitors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Calculate rank change function
CREATE OR REPLACE FUNCTION calculate_rank_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.previous_rank IS NOT NULL THEN
        NEW.rank_change = NEW.previous_rank - NEW.rank;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_rank_change
    BEFORE INSERT ON public.rankings
    FOR EACH ROW
    EXECUTE FUNCTION calculate_rank_change();

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY users_isolation ON public.users
    FOR ALL USING (id = auth.uid());

-- Clients isolation by user_id
CREATE POLICY clients_isolation ON public.clients
    FOR ALL USING (user_id = auth.uid());

-- ==========================================
-- DEMO DATA (Optional)
-- ==========================================

-- Insert demo admin user (password: admin123)
-- In production, use proper password hashing
INSERT INTO public.users (email, password_hash, role, first_name, last_name)
VALUES ('admin@stackmatrices.com', '$2b$10$YourHashedPasswordHere', 'admin', 'Admin', 'User')
ON CONFLICT (email) DO NOTHING;

-- Insert demo client
INSERT INTO public.clients (user_id, client_code, business_name, address, city, state, industry, services)
SELECT 
    id,
    'DEMO001',
    'Demo Medical Spa',
    '123 Main St',
    'Houston',
    'TX',
    'medical',
    ARRAY['Botox', 'Fillers', 'Laser']
FROM public.users WHERE email = 'admin@stackmatrices.com'
ON CONFLICT (client_code) DO NOTHING;

-- Insert demo keywords
INSERT INTO public.keywords (client_id, keyword, is_primary)
SELECT 
    c.id,
    unnest(ARRAY['botox houston', 'med spa near me', 'fillers houston']),
    true
FROM public.clients c WHERE c.client_code = 'DEMO001'
ON CONFLICT DO NOTHING;

-- ==========================================
-- GRANTS
-- ==========================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Service role can access everything
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
