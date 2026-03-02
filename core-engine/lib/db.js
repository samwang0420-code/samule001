/**
 * Database Module - Supabase Integration
 * 
 * Handles all database operations for the GEO system
 * 
 * Setup:
 *   1. Create Supabase project at https://supabase.com
 *   2. Run schema-v1.sql in SQL Editor
 *   3. Copy URL and anon key to .env
 *   4. npm install @supabase/supabase-js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// Check if Supabase is configured
const isConfigured = SUPABASE_URL && SUPABASE_KEY;

// Create client only if configured
let supabase = null;
if (isConfigured) {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

// ============================================
// CLIENTS
// ============================================

export async function createClient(data) {
    if (!isConfigured) {
        console.log('⚠️  Supabase not configured. Client saved locally only.');
        return { id: null, local: true };
    }

    const { data: result, error } = await supabase
        .from('clients')
        .insert([{
            client_code: data.clientId,
            firm_name: data.firmName,
            address: data.address,
            email: data.email,
            website: data.website
        }])
        .select()
        .single();

    if (error) {
        console.error('DB Error (createClient):', error.message);
        return null;
    }

    console.log('✓ Client saved to database:', result.id);
    return result;
}

export async function getClientByCode(clientCode) {
    if (!isConfigured) return null;

    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('client_code', clientCode)
        .single();

    if (error) return null;
    return data;
}

export async function listClients() {
    if (!isConfigured) return [];

    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('DB Error:', error.message);
        return [];
    }

    return data;
}

// ============================================
// GEO AUDITS
// ============================================

export async function saveGeoAudit(clientId, auditData) {
    if (!isConfigured) {
        console.log('⚠️  Supabase not configured. Audit saved locally only.');
        return null;
    }

    // Get client UUID from code
    const client = await getClientByCode(clientId);
    if (!client) {
        console.error('Client not found:', clientId);
        return null;
    }

    const { data, error } = await supabase
        .from('geo_audits')
        .insert([{
            client_id: client.id,
            total_score: auditData.total,
            coordinate_precision: auditData.breakdown.coordinatePrecision,
            parking_accessibility: auditData.breakdown.parkingAccessibility,
            schema_markup: auditData.breakdown.schemaMarkup,
            local_context: auditData.breakdown.localContext,
            current_rank: auditData.currentRank,
            potential_rank: auditData.potentialRank,
            competitor_count: auditData.competitorCount,
            strengths: auditData.analysis.strengths,
            weaknesses: auditData.analysis.weaknesses,
            raw_data: auditData.rawData || {}
        }])
        .select()
        .single();

    if (error) {
        console.error('DB Error (saveGeoAudit):', error.message);
        return null;
    }

    console.log('✓ GEO audit saved:', data.id);
    return data;
}

export async function getClientLatestAudit(clientId) {
    if (!isConfigured) return null;

    const client = await getClientByCode(clientId);
    if (!client) return null;

    const { data, error } = await supabase
        .from('geo_audits')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) return null;
    return data;
}

// ============================================
// KEYWORDS
// ============================================

export async function addKeyword(clientId, keyword, location = 'Houston, TX') {
    if (!isConfigured) {
        console.log('⚠️  Supabase not configured. Keyword tracked locally only.');
        return null;
    }

    const client = await getClientByCode(clientId);
    if (!client) {
        console.error('Client not found:', clientId);
        return null;
    }

    const { data, error } = await supabase
        .from('keywords')
        .insert([{
            client_id: client.id,
            keyword: keyword.toLowerCase().trim(),
            location
        }])
        .select()
        .single();

    if (error) {
        if (error.code === '23505') {
            console.log('Keyword already exists:', keyword);
            return null;
        }
        console.error('DB Error:', error.message);
        return null;
    }

    console.log('✓ Keyword added:', data.id);
    return data;
}

export async function getClientKeywords(clientId) {
    if (!isConfigured) return [];

    const client = await getClientByCode(clientId);
    if (!client) return [];

    const { data, error } = await supabase
        .from('keywords')
        .select('*')
        .eq('client_id', client.id)
        .eq('is_active', true);

    if (error) return [];
    return data;
}

// ============================================
// RANKINGS
// ============================================

export async function saveRanking(keywordId, position, serpFeatures = []) {
    if (!isConfigured) return null;

    const page = Math.ceil(position / 10);

    const { data, error } = await supabase
        .from('rankings')
        .insert([{
            keyword_id: keywordId,
            position,
            page,
            serp_features: serpFeatures
        }])
        .select()
        .single();

    if (error) {
        console.error('DB Error:', error.message);
        return null;
    }

    return data;
}

export async function getKeywordRankings(keywordId, days = 30) {
    if (!isConfigured) return [];

    const { data, error } = await supabase
        .from('rankings')
        .select('*')
        .eq('keyword_id', keywordId)
        .gte('checked_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('checked_at', { ascending: true });

    if (error) return [];
    return data;
}

// ============================================
// COMPETITORS
// ============================================

export async function addCompetitor(clientId, name, address, notes = '') {
    if (!isConfigured) {
        console.log('⚠️  Supabase not configured. Competitor tracked locally only.');
        return null;
    }

    const client = await getClientByCode(clientId);
    if (!client) {
        console.error('Client not found:', clientId);
        return null;
    }

    const { data, error } = await supabase
        .from('competitors')
        .insert([{
            client_id: client.id,
            name,
            address,
            notes
        }])
        .select()
        .single();

    if (error) {
        console.error('DB Error:', error.message);
        return null;
    }

    console.log('✓ Competitor added:', data.id);
    return data;
}

export async function getClientCompetitors(clientId) {
    if (!isConfigured) return [];

    const client = await getClientByCode(clientId);
    if (!client) return [];

    const { data, error } = await supabase
        .from('competitors')
        .select('*')
        .eq('client_id', client.id)
        .eq('is_tracking', true);

    if (error) return [];
    return data;
}

// ============================================
// ACTIVITY LOG
// ============================================

export async function logActivity(clientId, type, description, metadata = {}) {
    if (!isConfigured) return null;

    const client = await getClientByCode(clientId);
    if (!client) return null;

    const { data, error } = await supabase
        .from('activity_log')
        .insert([{
            client_id: client.id,
            activity_type: type,
            description,
            metadata
        }])
        .select()
        .single();

    if (error) return null;
    return data;
}

// ============================================
// STATS & DASHBOARD
// ============================================

export async function getSystemStats() {
    if (!isConfigured) {
        return {
            clients: 0,
            audits: 0,
            keywords: 0,
            rankings: 0,
            competitors: 0
        };
    }

    const stats = {};

    // Count clients
    let { count: clientCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });
    stats.clients = clientCount || 0;

    // Count audits
    let { count: auditCount } = await supabase
        .from('geo_audits')
        .select('*', { count: 'exact', head: true });
    stats.audits = auditCount || 0;

    // Count keywords
    let { count: keywordCount } = await supabase
        .from('keywords')
        .select('*', { count: 'exact', head: true });
    stats.keywords = keywordCount || 0;

    // Count rankings
    let { count: rankingCount } = await supabase
        .from('rankings')
        .select('*', { count: 'exact', head: true });
    stats.rankings = rankingCount || 0;

    // Count competitors
    let { count: compCount } = await supabase
        .from('competitors')
        .select('*', { count: 'exact', head: true });
    stats.competitors = compCount || 0;

    return stats;
}

// ============================================
// EXPORT
// ============================================

export default {
    isConfigured,
    
    // Clients
    createClient,
    getClientByCode,
    listClients,
    
    // Audits
    saveGeoAudit,
    getClientLatestAudit,
    
    // Keywords
    addKeyword,
    getClientKeywords,
    
    // Rankings
    saveRanking,
    getKeywordRankings,
    
    // Competitors
    addCompetitor,
    getClientCompetitors,
    
    // Activity
    logActivity,
    
    // Stats
    getSystemStats
};
