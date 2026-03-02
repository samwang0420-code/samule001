-- Add SEO Score tracking to database
-- Run this in Supabase SQL Editor

-- Add seo_score to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0;

-- Add seo_score to analysis_jobs table  
ALTER TABLE public.analysis_jobs
ADD COLUMN IF NOT EXISTS seo_score INTEGER,
ADD COLUMN IF NOT EXISTS geo_score INTEGER;

-- Add comprehensive scoring fields
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS tech_seo_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS content_seo_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS authority_seo_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_citation_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS knowledge_graph_score INTEGER DEFAULT 0;

-- Create view for dual-score dashboard
CREATE OR REPLACE VIEW public.client_scores AS
SELECT 
    c.id,
    c.business_name,
    c.industry,
    c.seo_score,
    c.geo_score,
    c.tech_seo_score,
    c.content_seo_score,
    c.authority_seo_score,
    c.ai_citation_score,
    c.knowledge_graph_score,
    (c.seo_score + c.geo_score) / 2.0 as dual_score_average,
    CASE 
        WHEN c.seo_score >= 80 AND c.geo_score >= 80 THEN 'excellent'
        WHEN c.seo_score >= 60 AND c.geo_score >= 60 THEN 'good'
        WHEN c.seo_score >= 40 OR c.geo_score >= 40 THEN 'needs_improvement'
        ELSE 'critical'
    END as overall_status,
    c.created_at,
    c.updated_at
FROM public.clients c;

-- Grant access
GRANT ALL ON public.client_scores TO authenticated;

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clients' 
AND column_name IN ('seo_score', 'geo_score', 'tech_seo_score', 'content_seo_score', 'authority_seo_score');
